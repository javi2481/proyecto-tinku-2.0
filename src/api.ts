/**
 * Tinkú — Tipos para APIs y Server Actions del backend.
 */

export interface StudentProgressStats {
  total_xp: number;
  streak_current: number;
  streak_max: number;
  mastered_count: number;
  concepts_in_progress: number;
  last_active_at: string | null;
  exercises_total: number;
  exercises_correct: number;
}

export interface DailyStats {
  date: string;
  exercises_attempted: number;
  exercises_correct: number;
  xp_earned: number;
  time_spent_seconds: number;
}

export interface DataExport {
  exported_at: string;
  student: {
    first_name: string;
    birth_year: number;
  };
  sessions: Record<string, unknown>[];
  attempts: Record<string, unknown>[];
  badges: Record<string, unknown>[];
  mastery: Record<string, unknown>[];
}