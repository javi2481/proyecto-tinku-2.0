import { describe, it, expect } from 'vitest';
import { updatePKnown, computeXp, pickDifficulty, OUTCOME_FACTOR } from '@/lib/adaptive/engine';

describe('BKT Engine', () => {
  describe('updatePKnown', () => {
    it('increases p_known on correct first attempt', () => {
      const result = updatePKnown(0.5, 'correct_first', 0);
      expect(result.pKnownNew).toBeGreaterThan(0.5);
      expect(result.isMastered).toBe(false);
    });

    it('increases p_known less after hint', () => {
      const noHint = updatePKnown(0.5, 'correct_first', 0);
      const withHint = updatePKnown(0.5, 'correct_first', 2);
      expect(withHint.pKnownNew).toBeLessThan(noHint.pKnownNew);
    });

    it('decreases p_known on incorrect', () => {
      const result = updatePKnown(0.5, 'incorrect', 0);
      expect(result.pKnownNew).toBeLessThan(0.5);
      expect(result.delta).toBeLessThan(0);
    });

    it('marks as mastered when p_known >= 0.85', () => {
      const result = updatePKnown(0.84, 'correct_first', 0);
      expect(result.isMastered).toBe(true);
    });

    it('clamps p_known between 0 and 1', () => {
      const atZero = updatePKnown(0, 'incorrect', 0);
      expect(atZero.pKnownNew).toBe(0);
      
      const atOne = updatePKnown(0.99, 'correct_first', 0);
      expect(atOne.pKnownNew).toBeLessThanOrEqual(1);
      expect(atOne.pKnownNew).toBeGreaterThan(0.9);
    });
  });

  describe('computeXp', () => {
    it('gives full XP for correct first attempt', () => {
      const xp = computeXp(10, 'correct_first', 0, 1);
      expect(xp).toBe(10);
    });

    it('gives reduced XP for retry', () => {
      const xp = computeXp(10, 'correct_retry', 0, 1);
      expect(xp).toBe(6); // 10 * 0.6
    });

    it('deducts XP for hints', () => {
      const xp = computeXp(10, 'correct_first', 2, 1);
      expect(xp).toBe(8); // 10 - (2 * 1)
    });

    it('gives zero XP for incorrect', () => {
      const xp = computeXp(10, 'incorrect', 0, 1);
      expect(xp).toBe(0);
    });
  });

  describe('pickDifficulty', () => {
    it('selects easy for p_known < 0.4', () => {
      expect(pickDifficulty(0.3)).toBe('easy');
    });

    it('selects medium for 0.4 <= p_known < 0.65', () => {
      expect(pickDifficulty(0.5)).toBe('medium');
    });

    it('selects hard for 0.65 <= p_known < 0.85', () => {
      expect(pickDifficulty(0.7)).toBe('hard');
    });

    it('returns mastered for p_known >= 0.85', () => {
      expect(pickDifficulty(0.85)).toBe('mastered');
      expect(pickDifficulty(0.9)).toBe('mastered');
    });
  });

  describe('OUTCOME_FACTOR', () => {
    it('has correct factors', () => {
      expect(OUTCOME_FACTOR.correct_first).toBe(1.0);
      expect(OUTCOME_FACTOR.correct_retry).toBe(0.6);
      expect(OUTCOME_FACTOR.incorrect).toBe(0);
      expect(OUTCOME_FACTOR.skipped).toBe(0);
    });
  });
});