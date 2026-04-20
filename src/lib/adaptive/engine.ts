/**
 * BKT Engine — Adaptive learning for Tinku 2.0
 * Ported and adapted from proyecto-tinku v1
 * 
 * p_known_new = clamp(p_known + learn_rate * (outcome_score - p_known), 0, 1)
 * learn_rate = 0.15, mastery threshold = 0.85
 */

export type AnswerOutcome = 'correct_first' | 'correct_retry' | 'incorrect' | 'skipped';
export type ExerciseDifficulty = 'easy' | 'medium' | 'hard';

/**
 * Outcome → factor [0..1] applied to base_xp
 */
export const OUTCOME_FACTOR: Record<AnswerOutcome, number> = {
  correct_first: 1.0,
  correct_retry: 0.6,
  incorrect: 0,
  skipped: 0,
};

/**
 * Compute XP given base_xp, outcome, and hints used
 */
export function computeXp(
  baseXp: number,
  outcome: AnswerOutcome,
  hintsUsed: number,
  hintPenalty: number,
): number {
  const factor = OUTCOME_FACTOR[outcome];
  const raw = Math.round(baseXp * factor) - hintsUsed * hintPenalty;
  return Math.max(0, Math.min(baseXp, raw));
}

/**
 * BKT simplified — update p_known after an exercise attempt
 */
export function updatePKnown(
  pKnown: number,
  outcome: AnswerOutcome,
  hintsUsed: number,
): { pKnownNew: number; delta: number; isMastered: boolean } {
  const learnRate = 0.15;
  const outcomeScore = OUTCOME_FACTOR[outcome];
  
  // Hint penalty: reduces effective outcome 10% per hint, capped at 50%
  const hintAdjust = Math.min(0.5, hintsUsed * 0.1);
  const effective = Math.max(0, outcomeScore - hintAdjust);

  const raw = pKnown + learnRate * (effective - pKnown);
  const pKnownNew = Math.max(0, Math.min(1, Number(raw.toFixed(3))));
  const delta = Number((pKnownNew - pKnown).toFixed(3));
  const isMastered = pKnownNew >= 0.85;
  
  return { pKnownNew, delta, isMastered };
}

/**
 * Select difficulty band based on p_known (Zone of Proximal Development)
 */
export function pickDifficulty(p_known: number): ExerciseDifficulty | 'mastered' {
  if (p_known < 0.4) return 'easy';
  if (p_known < 0.65) return 'medium';
  if (p_known < 0.85) return 'hard';
  return 'mastered';
}

/**
 * Get mastery threshold (0.85 standard, configurable)
 */
export const MASTERY_THRESHOLD = 0.85;