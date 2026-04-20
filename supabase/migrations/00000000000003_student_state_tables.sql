-- ============================================================
-- Migration 003: Student State & Analytics Tables
-- Tables: student_concept_state, student_exercise_attempts,
--   student_levels, student_coins, student_ship_parts,
--   missions, student_missions, ari_conversations, app_events
-- Includes: indexes, triggers, RLS policies
-- ============================================================

-- -----------------------------------------------------------
-- Table: student_concept_state
-- Core of the adaptive engine (BKT). One row per student-concept pair.
-- -----------------------------------------------------------
CREATE TABLE public.student_concept_state (
  student_id  UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  concept_id  UUID NOT NULL REFERENCES public.concepts(id) ON DELETE CASCADE,
  p_known     DECIMAL(5,4) NOT NULL DEFAULT 0.0,
  attempts    SMALLINT NOT NULL DEFAULT 0,
  last_seen   TIMESTAMPTZ,
  learn_rate  DECIMAL(5,4) NOT NULL DEFAULT 0.1,
  slip        DECIMAL(5,4) NOT NULL DEFAULT 0.1,
  guess       DECIMAL(5,4) NOT NULL DEFAULT 0.2,
  mastery     public.concept_mastery_status NOT NULL DEFAULT 'not_started',
  PRIMARY KEY (student_id, concept_id)
);

CREATE INDEX idx_student_concept_state_student ON public.student_concept_state(student_id);
CREATE INDEX idx_student_concept_state_concept ON public.student_concept_state(concept_id);

-- -----------------------------------------------------------
-- Table: student_exercise_attempts
-- Every attempt a student makes on an exercise.
-- -----------------------------------------------------------
CREATE TABLE public.student_exercise_attempts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  exercise_id     UUID NOT NULL REFERENCES public.exercises(id),
  is_correct      BOOLEAN NOT NULL,
  attempt_number  SMALLINT,
  time_ms         SMALLINT,
  hint_used       BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_student_exercise_attempts_student ON public.student_exercise_attempts(student_id, exercise_id);

-- -----------------------------------------------------------
-- Table: student_levels
-- Gamification: level and XP tracking per student.
-- Auto-created by trigger when student is inserted.
-- -----------------------------------------------------------
CREATE TABLE public.student_levels (
  student_id UUID PRIMARY KEY REFERENCES public.students(id) ON DELETE CASCADE,
  level      SMALLINT NOT NULL DEFAULT 1,
  xp         INTEGER NOT NULL DEFAULT 0,
  title      TEXT NOT NULL DEFAULT 'Explorador Novato',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_student_levels_student ON public.student_levels(student_id);

-- -----------------------------------------------------------
-- Table: student_coins
-- Province-specific coins earned by students.
-- -----------------------------------------------------------
CREATE TABLE public.student_coins (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  province    TEXT NOT NULL,
  earned_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------
-- Table: student_ship_parts
-- Ship customization parts earned as rewards.
-- -----------------------------------------------------------
CREATE TABLE public.student_ship_parts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  part_type   TEXT NOT NULL CHECK (part_type IN ('sail', 'flag', 'paint', 'figurehead', 'lantern')),
  earned_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------
-- Table: missions
-- Available missions (daily, weekly, exploratory, creative).
-- -----------------------------------------------------------
CREATE TABLE public.missions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  description   TEXT,
  mission_type  public.mission_type NOT NULL,
  xp_reward     SMALLINT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------
-- Table: student_missions
-- Mission assignments and progress for students.
-- -----------------------------------------------------------
CREATE TABLE public.student_missions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  mission_id    UUID NOT NULL REFERENCES public.missions(id),
  status        public.mission_status NOT NULL DEFAULT 'active',
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------
-- Table: ari_conversations
-- Conversations between students and Ari (AI companion).
-- -----------------------------------------------------------
CREATE TABLE public.ari_conversations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  island_id   public.island_id,
  concept_id  UUID REFERENCES public.concepts(id),
  message     TEXT NOT NULL,
  response    TEXT NOT NULL,
  model_used  TEXT,
  tokens_used SMALLINT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ari_conversations_student ON public.ari_conversations(student_id, created_at DESC);

-- -----------------------------------------------------------
-- Table: app_events
-- Generic analytics events (replaces PostHog for MVP).
-- -----------------------------------------------------------
CREATE TABLE public.app_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id),
  event_type  TEXT NOT NULL,
  payload     JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_app_events_user_type ON public.app_events(user_id, event_type);

-- -----------------------------------------------------------
-- Trigger: Auto-create student_levels when student is inserted
-- -----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_student_level()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  INSERT INTO public.student_levels (student_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_create_student_level
  AFTER INSERT ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.create_student_level();

-- Trigger: updated_at for student_levels
CREATE TRIGGER trg_student_levels_updated_at
  BEFORE UPDATE ON public.student_levels
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------
-- RLS: Enable on all student state tables
-- -----------------------------------------------------------
ALTER TABLE public.student_concept_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_exercise_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_coins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_ship_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ari_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_events ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------
-- Helper function: is_own_student_or_parent()
-- Returns true if the current user is the parent of the student
-- or an admin.
-- -----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_own_student_or_parent(student_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path TO public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.students s
    JOIN public.users u ON u.id = s.parent_id
    WHERE s.id = student_id AND u.id = auth.uid()
    UNION ALL
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- -----------------------------------------------------------
-- RLS Policies: student_concept_state
-- -----------------------------------------------------------
CREATE POLICY "Students and parents can read own concept state"
  ON public.student_concept_state FOR SELECT
  TO authenticated
  USING (is_own_student_or_parent(student_id));

CREATE POLICY "Students can insert own concept state"
  ON public.student_concept_state FOR INSERT
  TO authenticated
  WITH CHECK (is_own_student_or_parent(student_id));

CREATE POLICY "Students can update own concept state"
  ON public.student_concept_state FOR UPDATE
  TO authenticated
  USING (is_own_student_or_parent(student_id))
  WITH CHECK (is_own_student_or_parent(student_id));

CREATE POLICY "Admins can manage concept state"
  ON public.student_concept_state FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- -----------------------------------------------------------
-- RLS Policies: student_exercise_attempts
-- -----------------------------------------------------------
CREATE POLICY "Students and parents can read own attempts"
  ON public.student_exercise_attempts FOR SELECT
  TO authenticated
  USING (is_own_student_or_parent(student_id));

CREATE POLICY "Students can insert own attempts"
  ON public.student_exercise_attempts FOR INSERT
  TO authenticated
  WITH CHECK (is_own_student_or_parent(student_id));

CREATE POLICY "Admins can manage attempts"
  ON public.student_exercise_attempts FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- -----------------------------------------------------------
-- RLS Policies: student_levels
-- -----------------------------------------------------------
CREATE POLICY "Students and parents can read own levels"
  ON public.student_levels FOR SELECT
  TO authenticated
  USING (is_own_student_or_parent(student_id));

CREATE POLICY "System can update levels"
  ON public.student_levels FOR UPDATE
  TO authenticated
  USING (is_own_student_or_parent(student_id))
  WITH CHECK (is_own_student_or_parent(student_id));

CREATE POLICY "Admins can manage levels"
  ON public.student_levels FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- -----------------------------------------------------------
-- RLS Policies: student_coins
-- -----------------------------------------------------------
CREATE POLICY "Students and parents can read own coins"
  ON public.student_coins FOR SELECT
  TO authenticated
  USING (is_own_student_or_parent(student_id));

CREATE POLICY "Students can insert own coins"
  ON public.student_coins FOR INSERT
  TO authenticated
  WITH CHECK (is_own_student_or_parent(student_id));

CREATE POLICY "Admins can manage coins"
  ON public.student_coins FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- -----------------------------------------------------------
-- RLS Policies: student_ship_parts
-- -----------------------------------------------------------
CREATE POLICY "Students and parents can read own ship parts"
  ON public.student_ship_parts FOR SELECT
  TO authenticated
  USING (is_own_student_or_parent(student_id));

CREATE POLICY "Students can insert own ship parts"
  ON public.student_ship_parts FOR INSERT
  TO authenticated
  WITH CHECK (is_own_student_or_parent(student_id));

CREATE POLICY "Admins can manage ship parts"
  ON public.student_ship_parts FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- -----------------------------------------------------------
-- RLS Policies: missions (catalog - readable by all authenticated)
-- -----------------------------------------------------------
CREATE POLICY "Missions are readable by authenticated users"
  ON public.missions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage missions"
  ON public.missions FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- -----------------------------------------------------------
-- RLS Policies: student_missions
-- -----------------------------------------------------------
CREATE POLICY "Students and parents can read own missions"
  ON public.student_missions FOR SELECT
  TO authenticated
  USING (is_own_student_or_parent(student_id));

CREATE POLICY "Students can insert own missions"
  ON public.student_missions FOR INSERT
  TO authenticated
  WITH CHECK (is_own_student_or_parent(student_id));

CREATE POLICY "Students can update own missions"
  ON public.student_missions FOR UPDATE
  TO authenticated
  USING (is_own_student_or_parent(student_id))
  WITH CHECK (is_own_student_or_parent(student_id));

CREATE POLICY "Admins can manage student missions"
  ON public.student_missions FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- -----------------------------------------------------------
-- RLS Policies: ari_conversations
-- -----------------------------------------------------------
CREATE POLICY "Students and parents can read own conversations"
  ON public.ari_conversations FOR SELECT
  TO authenticated
  USING (is_own_student_or_parent(student_id));

CREATE POLICY "Students can insert own conversations"
  ON public.ari_conversations FOR INSERT
  TO authenticated
  WITH CHECK (is_own_student_or_parent(student_id));

CREATE POLICY "Admins can manage conversations"
  ON public.ari_conversations FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- -----------------------------------------------------------
-- RLS Policies: app_events
-- -----------------------------------------------------------
CREATE POLICY "Users can read own events"
  ON public.app_events FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own events"
  ON public.app_events FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can read all events"
  ON public.app_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

COMMENT ON TABLE public.app_events IS 'Generic analytics events. Consider adding pg_cron job: DELETE FROM app_events WHERE created_at < now() - interval ''90 days''';