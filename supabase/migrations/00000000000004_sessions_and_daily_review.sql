-- ============================================================
-- Migration 004: Sessions & Daily Review System
-- Tables: sessions, data_access_log
-- Includes: daily review mechanics
-- ============================================================

-- -----------------------------------------------------------
-- Table: sessions
-- Tracks study sessions per student (island-based).
-- Used by daily review to track completion.
-- -----------------------------------------------------------
CREATE TABLE public.sessions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id            UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  island_id             TEXT NOT NULL,
  started_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at              TIMESTAMPTZ,
  duration_seconds     INTEGER,
  exercises_attempted  SMALLINT DEFAULT 0,
  correct_count         SMALLINT DEFAULT 0,
  metadata              JSONB DEFAULT '{}',
  close_reason          TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sessions_student ON public.sessions(student_id, started_at DESC);

-- -----------------------------------------------------------
-- Table: data_access_log
-- Audit log for tracking daily review completion,
-- badge awards, and other key access events.
-- -----------------------------------------------------------
CREATE TABLE public.data_access_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  access_type     TEXT NOT NULL,
  access_target  TEXT NOT NULL,
  metadata       JSONB DEFAULT '{}',
  accessed_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_data_access_log_student_target ON public.data_access_log(student_id, access_target, accessed_at DESC);

-- -----------------------------------------------------------
-- RLS: Only student's own data is writable
-- -----------------------------------------------------------
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_access_log ENABLE ROW LEVEL SECURITY;

-- Sessions: student can read their own, admins can do all
CREATE POLICY "Students can read own sessions"
  ON public.sessions FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Students can insert own sessions"
  ON public.sessions FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.translate_uid() OR student_id IN (
    SELECT id FROM public.students WHERE parent_id = auth.translate_uid()
  ));

CREATE POLICY "Students can update own sessions"
  ON public.sessions FOR UPDATE
  TO authenticated
  USING (student_id = auth.uid());

-- Data access log: same rules
CREATE POLICY "Students can read own access logs"
  ON public.data_access_log FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Students can insert own access logs"
  ON public.data_access_log FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.translate_uid() OR student_id IN (
    SELECT id FROM public.students WHERE parent_id = auth.translate_uid()
  ));

-- -----------------------------------------------------------
-- Trigger: updated_at for sessions
-- -----------------------------------------------------------
CREATE TRIGGER trg_sessions_updated_at
  BEFORE UPDATE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();