-- ============================================================
-- Migration 001: Identity Tables
-- Tables: users, students, student_codes
-- Includes: user_role ENUM, RLS policies, triggers
-- ============================================================

-- -----------------------------------------------------------
-- ENUM: user_role
-- Ola 1: parent, admin. Teacher added in Ola 3.
-- -----------------------------------------------------------
CREATE TYPE public.user_role AS ENUM ('parent', 'admin', 'teacher');

-- -----------------------------------------------------------
-- Table: users
-- Extends auth.users with profile data.
-- PK = auth.uid (1:1 with auth.users)
-- -----------------------------------------------------------
CREATE TABLE public.users (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role       public.user_role NOT NULL DEFAULT 'parent',
  full_name  TEXT,
  avatar     TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------
-- Table: students
-- Each student belongs to one parent (user with role='parent').
-- -----------------------------------------------------------
CREATE TABLE public.students (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id        UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  date_of_birth    DATE,
  grade            SMALLINT CHECK (grade BETWEEN 1 AND 7),
  avatar           TEXT,
  has_seen_welcome BOOLEAN NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_students_parent_id ON public.students(parent_id);

-- -----------------------------------------------------------
-- Table: student_codes
-- 6-char alphanumeric codes for student login.
-- Charset excludes confusing chars: 0/O, 1/l/I
-- -----------------------------------------------------------
CREATE TABLE public.student_codes (
  code       CHAR(6) PRIMARY KEY
    CHECK (code ~ '^[A-HJ-NP-Z2-9]{6}$'),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_student_codes_student_id ON public.student_codes(student_id);

-- -----------------------------------------------------------
-- Function: set_updated_at()
-- Auto-update updated_at on any row modification.
-- -----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------
-- Function: handle_new_user()
-- Auto-create public.users row when auth.users row is created.
-- SECURITY DEFINER allows insert into public.users regardless of RLS.
-- -----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  INSERT INTO public.users (id, role, full_name)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'parent'),
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
      NULLIF(NEW.raw_user_meta_data->>'name', ''),
      NULLIF(NEW.raw_user_meta_data->>'given_name', ''),
      split_part(NEW.email, '@', 1)
    )
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name;
  RETURN NEW;
END;
$$;

-- Trigger: auth.users → public.users sync
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger: updated_at for users
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Trigger: updated_at for students
CREATE TRIGGER trg_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------
-- RLS: Enable on all identity tables
-- -----------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_codes ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------
-- RLS Policies: users
-- -----------------------------------------------------------
CREATE POLICY "Users can read own row"
  ON public.users FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update own row"
  ON public.users FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can read all users"
  ON public.users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- -----------------------------------------------------------
-- RLS Policies: students
-- -----------------------------------------------------------
CREATE POLICY "Parents can see own children"
  ON public.students FOR SELECT
  TO authenticated
  USING (parent_id = auth.uid());

CREATE POLICY "Parents can insert own children"
  ON public.students FOR INSERT
  TO authenticated
  WITH CHECK (parent_id = auth.uid());

CREATE POLICY "Parents can update own children"
  ON public.students FOR UPDATE
  TO authenticated
  USING (parent_id = auth.uid())
  WITH CHECK (parent_id = auth.uid());

CREATE POLICY "Parents can delete own children"
  ON public.students FOR DELETE
  TO authenticated
  USING (parent_id = auth.uid());

CREATE POLICY "Admins can do everything with students"
  ON public.students FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- -----------------------------------------------------------
-- RLS Policies: student_codes
-- -----------------------------------------------------------
CREATE POLICY "Parents can see own children codes"
  ON public.student_codes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE id = student_codes.student_id AND parent_id = auth.uid()
    )
  );

CREATE POLICY "Parents can create codes for own children"
  ON public.student_codes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE id = student_codes.student_id AND parent_id = auth.uid()
    )
  );

CREATE POLICY "Parents can delete own children codes"
  ON public.student_codes FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE id = student_codes.student_id AND parent_id = auth.uid()
    )
  );

CREATE POLICY "Admins can do everything with student codes"
  ON public.student_codes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );