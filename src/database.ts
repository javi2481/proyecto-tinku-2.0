/**
 * Tinkú — Types generados a mano del schema Supabase (Ola 1).
 * Alineados con /app/supabase/migrations/0001 y 0002.
 * Regenerar manualmente si se cambia el schema.
 *
 * Alternativa futura: `supabase gen types typescript` con access token.
 */

export type UserRole = 'parent' | 'teacher' | 'admin';
export type SubscriptionStatus = 'free' | 'premium_active' | 'premium_cancelled' | 'premium_past_due';
export type GradeLevel = 'grade_1' | 'grade_2' | 'grade_3' | 'grade_4' | 'grade_5' | 'grade_6' | 'grade_7';
export type Subject = 'math' | 'language' | 'science' | 'social' | 'tech' | 'arts' | 'ethics';
export type ExerciseType = 'multiple_choice' | 'fill_blank' | 'drag_drop' | 'matching' | 'numeric_input' | 'h5p_embedded';
export type ExerciseDifficulty = 'easy' | 'medium' | 'hard';
export type AnswerOutcome = 'correct_first' | 'correct_retry' | 'incorrect' | 'skipped';
export type SessionCloseReason = 'user_exit' | 'timeout' | 'device_switched' | 'parental_limit' | 'error';
export type ConsentEventType = 'granted' | 'revoked' | 'reconfirmed';
export type EmailVerifyPurpose = 'signup' | 'consent_reconfirmation' | 'password_reset';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  email: string;
  phone: string | null;
  whatsapp_opt_in: boolean;
  preferred_language: string;
  timezone: string;
  email_double_opt_in_completed: boolean;
  onboarding_completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  parent_id: string;
  status: SubscriptionStatus;
  provider: string | null;
  provider_subscription_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancelled_at: string | null;
  price_ars: number | null;
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  parent_id: string;
  auth_user_id: string | null;
  first_name: string;
  birth_year: number;
  current_grade: GradeLevel;
  avatar_id: string;
  login_code: string;
  login_code_expires_at: string | null;
  streak_current: number;
  streak_max: number;
  last_active_at: string | null;
  total_xp: number;
  parental_consent_given: boolean;
  parental_consent_at: string | null;
  parental_consent_ip: string | null;
  parental_consent_user_agent: string | null;
  consent_revoked_at: string | null;
  deletion_requested_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ParentalConsent {
  id: string;
  student_id: string;
  parent_id: string;
  event_type: ConsentEventType;
  consent_text_version: string;
  ip: string | null;
  user_agent: string | null;
  notes: string | null;
  created_at: string;
}

export interface EmailVerification {
  id: string;
  profile_id: string;
  token_hash: string;
  purpose: EmailVerifyPurpose;
  expires_at: string;
  verified_at: string | null;
  ip_sent: string | null;
  ip_verified: string | null;
  attempts: number;
  created_at: string;
}

export interface Concept {
  id: string;
  code: string;
  primary_subject: Subject;
  grade: GradeLevel;
  name_es: string;
  description_es: string | null;
  nap_reference: string | null;
  prerequisites: string[];
  display_order: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Exercise {
  id: string;
  concept_id: string;
  exercise_type: ExerciseType;
  difficulty: ExerciseDifficulty;
  title_es: string;
  prompt_es: string;
  content: Record<string, unknown>;
  h5p_content_id: string | null;
  correct_answer: Record<string, unknown>;
  hints: Array<Record<string, unknown>>;
  pedagogical_review_status: 'pending' | 'approved' | 'rejected' | 'needs_revision';
  estimated_time_seconds: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Session {
  id: string;
  student_id: string;
  island: Subject;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  exercises_attempted: number;
  exercises_correct: number;
  xp_earned: number;
  close_reason: SessionCloseReason | null;
  device_type: string | null;
  created_at: string;
}

export interface Attempt {
  id: string;
  session_id: string;
  student_id: string;
  exercise_id: string;
  concept_id: string;
  attempt_number: number;
  outcome: AnswerOutcome;
  answer_given: Record<string, unknown> | null;
  time_spent_seconds: number;
  hints_used: number;
  xp_earned: number;
  created_at: string;
}

export interface ConceptMastery {
  id: string;
  student_id: string;
  concept_id: string;
  p_known: number;
  last_p_known_delta: number;
  total_attempts: number;
  correct_attempts: number;
  is_mastered: boolean;
  mastered_at: string | null;
  last_attempt_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Badge {
  id: string;
  code: string;
  name_es: string;
  description_es: string;
  icon_url: string;
  xp_reward: number;
  unlock_criteria: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
}

export interface StudentBadge {
  id: string;
  student_id: string;
  badge_id: string;
  earned_at: string;
}

export interface XpRule {
  id: string;
  difficulty: ExerciseDifficulty;
  outcome: AnswerOutcome;
  base_xp: number;
  hint_penalty: number;
  updated_at: string;
}

export interface AppLog {
  id: string;
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  source: string;
  message: string;
  context: Record<string, unknown> | null;
  user_auth_uid: string | null;
  created_at: string;
}

export interface DataAccessLog {
  id: string;
  accessor_id: string | null;
  accessor_auth_uid: string | null;
  student_id: string;
  access_type: string;
  access_target: string;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown> | null;
  accessed_at: string;
}
