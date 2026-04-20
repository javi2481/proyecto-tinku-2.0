-- ============================================================
-- Migration 000: Clean Slate
-- Drop all existing Tinku 1.x tables, functions, triggers,
-- and custom types to prepare for Tinku 2.0 schema.
-- ============================================================

-- Drop triggers on auth.users (must be done first)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop all existing public tables (order matters for FK dependencies)
DROP TABLE IF EXISTS public.data_access_log CASCADE;
DROP TABLE IF EXISTS public.email_verifications CASCADE;
DROP TABLE IF EXISTS public.parental_consents CASCADE;
DROP TABLE IF EXISTS public.student_badges CASCADE;
DROP TABLE IF EXISTS public.badges_catalog CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.sessions CASCADE;
DROP TABLE IF EXISTS public.attempts CASCADE;
DROP TABLE IF EXISTS public.concept_mastery CASCADE;
DROP TABLE IF EXISTS public.exercise_concepts CASCADE;
DROP TABLE IF EXISTS public.exercises CASCADE;
DROP TABLE IF EXISTS public.concept_links CASCADE;
DROP TABLE IF EXISTS public.concepts CASCADE;
DROP TABLE IF EXISTS public.xp_rules CASCADE;
DROP TABLE IF EXISTS public.app_logs CASCADE;
DROP TABLE IF EXISTS public.students CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop all custom functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.set_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.is_parent_of(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.is_student_self(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.generate_login_code() CASCADE;
DROP FUNCTION IF EXISTS public.check_attempt_session_consistency() CASCADE;
DROP FUNCTION IF EXISTS public.rls_auto_enable() CASCADE;

-- Drop custom enum types
DROP TYPE IF EXISTS public.consent_event_type CASCADE;
DROP TYPE IF EXISTS public.email_verify_purpose CASCADE;
DROP TYPE IF EXISTS public.session_close_reason CASCADE;
DROP TYPE IF EXISTS public.answer_outcome CASCADE;
DROP TYPE IF EXISTS public.exercise_difficulty CASCADE;
DROP TYPE IF EXISTS public.exercise_type CASCADE;
DROP TYPE IF EXISTS public.grade_level CASCADE;
DROP TYPE IF EXISTS public.subject CASCADE;
DROP TYPE IF EXISTS public.subscription_status CASCADE;
DROP TYPE IF EXISTS public.user_role CASCADE;