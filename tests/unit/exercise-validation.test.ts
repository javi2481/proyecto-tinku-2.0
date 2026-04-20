import { describe, it, expect } from "vitest";
import {
  ExerciseSchema,
  McqExerciseSchema,
  NumericExerciseSchema,
  SocioemotionalDilemmaSchema,
  validateDistractors,
  validateNumericAnswer,
  validateContextCoherence,
  validateTypeDistribution,
  validateCharacterBalance,
} from "@/lib/exercise-validation";

// ─── REQ-EG-005: Exercise Validation ──────────────────────────

describe("REQ-EG-005: Exercise JSON Schema validation", () => {
  it("should accept a valid MCQ exercise", () => {
    const valid = ExerciseSchema.safeParse({
      exercise_id: "M1_NUM_HASTA_20_001",
      exercise_type: "mcq",
      concept_id: "M1_NUM_HASTA_20",
      prompt: "¿Cuántos alfajores tiene Lucía si compró 3 de chocolate y 4 de dulce de leche?",
      correct_answer: "7",
      distractors: ["5", "6", "8"],
      hint: "Sumá los alfajores de los dos sabores.",
      character_id: "lucia",
      context_id: "kiosco",
      difficulty: 3,
      source: "generated_v1",
    });

    expect(valid.success).toBe(true);
  });

  it("should reject an exercise missing required fields", () => {
    const result = ExerciseSchema.safeParse({
      exercise_id: "M1_NUM_HASTA_20_001",
      // missing exercise_type, prompt, correct_answer, etc.
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.issues.map((e) => e.path.join("."));
      expect(errors.length).toBeGreaterThan(0);
    }
  });

  it("should reject an exercise with invalid exercise_type", () => {
    const result = ExerciseSchema.safeParse({
      exercise_id: "M1_NUM_HASTA_20_001",
      exercise_type: "invalid_type",
      concept_id: "M1_NUM_HASTA_20",
      prompt: "Some prompt text here",
      correct_answer: "7",
      distractors: ["5", "6", "8"],
      character_id: "lucia",
      context_id: "kiosco",
      difficulty: 3,
      source: "generated_v1",
    });

    expect(result.success).toBe(false);
  });

  it("should accept a valid numeric_input exercise", () => {
    const valid = ExerciseSchema.safeParse({
      exercise_id: "M1_SUM_SIN_REAGR_10_001",
      exercise_type: "numeric_input",
      concept_id: "M1_SUM_SIN_REAGR_10",
      prompt: "¿Cuánto es 3 + 4?",
      correct_answer: 7,
      distractors: undefined,
      hint: "Contá con los dedos.",
      character_id: "camila",
      context_id: "escuela",
      difficulty: 2,
      source: "generated_v1",
    });

    expect(valid.success).toBe(true);
  });

  it("should accept a valid socioemotional_dilemma exercise", () => {
    const valid = ExerciseSchema.safeParse({
      exercise_id: "S1_RECONOCER_EMOCIONES_001",
      exercise_type: "socioemotional_dilemma",
      concept_id: "S1_RECONOCER_EMOCIONES",
      prompt: "Lucía se cayó en el patio y se lastimó la rodilla. ¿Qué siente Lucía?",
      correct_answer: "tristeza",
      distractors: ["alegría", "enojo", "sorpresa"],
      hint: "Pensá cómo te sentirías si te cayeras y te doliera.",
      character_id: "lucia",
      context_id: "escuela",
      difficulty: 1,
      source: "generated_v1",
    });

    expect(valid.success).toBe(true);
  });

  it("should reject an exercise with empty prompt", () => {
    const result = ExerciseSchema.safeParse({
      exercise_id: "M1_NUM_HASTA_20_001",
      exercise_type: "mcq",
      concept_id: "M1_NUM_HASTA_20",
      prompt: "",
      correct_answer: "7",
      distractors: ["5", "6", "8"],
      character_id: "lucia",
      context_id: "kiosco",
      difficulty: 3,
      source: "generated_v1",
    });

    expect(result.success).toBe(false);
  });

  it("should accept all valid exercise types from enum", () => {
    const validTypes = ["mcq", "numeric_input", "h5p_fill_blank", "h5p_drag_drop", "h5p_match", "socioemotional_dilemma"];

    for (const type of validTypes) {
      const result = ExerciseSchema.safeParse({
        exercise_id: `TEST_${type}_001`,
        exercise_type: type,
        concept_id: "M1_NUM_HASTA_20",
        prompt: "Test prompt...",
        correct_answer: type === "numeric_input" ? 7 : "answer",
        distractors: type === "numeric_input" ? undefined : ["a", "b", "c"],
        character_id: "lucia",
        context_id: "kiosco",
        difficulty: 3,
        source: "generated_v1",
      });

      expect(result.success).toBe(true);
    }
  });
});

describe("REQ-EG-005: MCQ-specific validation", () => {
  it("should accept MCQ with 2-4 distractors", () => {
    const result = McqExerciseSchema.safeParse({
      exercise_id: "M1_NUM_HASTA_20_001",
      exercise_type: "mcq",
      concept_id: "M1_NUM_HASTA_20",
      prompt: "¿Cuántos alfajores?",
      correct_answer: "7",
      distractors: ["5", "6", "8"],
      character_id: "lucia",
      context_id: "kiosco",
      difficulty: 3,
      source: "generated_v1",
    });

    expect(result.success).toBe(true);
  });

  it("should reject MCQ with fewer than 2 distractors", () => {
    const result = McqExerciseSchema.safeParse({
      exercise_id: "M1_NUM_HASTA_20_001",
      exercise_type: "mcq",
      concept_id: "M1_NUM_HASTA_20",
      prompt: "¿Cuántos alfajores?",
      correct_answer: "7",
      distractors: ["5"],
      character_id: "lucia",
      context_id: "kiosco",
      difficulty: 3,
      source: "generated_v1",
    });

    expect(result.success).toBe(false);
  });

  it("should reject numeric_input exercise that has distractors", () => {
    const result = NumericExerciseSchema.safeParse({
      exercise_id: "M1_SUM_SIN_REAGR_10_001",
      exercise_type: "numeric_input",
      concept_id: "M1_SUM_SIN_REAGR_10",
      prompt: "¿Cuánto es 3 + 4?",
      correct_answer: 7,
      distractors: ["5", "6"],
      character_id: "camila",
      context_id: "escuela",
      difficulty: 2,
      source: "generated_v1",
    });

    expect(result.success).toBe(false);
  });
});

// ─── Distractor validation ──────────────────────────────────

describe("REQ-EG-005: Distractor plausibility validation", () => {
  it("should reject duplicate distractors", () => {
    const result = validateDistractors({
      correct_answer: "7",
      distractors: ["5", "5", "6"],
      exercise_type: "mcq",
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Distractors contain duplicates");
  });

  it("should reject distractors that equal the correct answer", () => {
    const result = validateDistractors({
      correct_answer: "7",
      distractors: ["5", "7", "8"],
      exercise_type: "mcq",
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Distractor equals correct answer");
  });

  it("should accept plausible distractors for math exercises", () => {
    const result = validateDistractors({
      correct_answer: "7",
      distractors: ["5", "8", "6"],
      exercise_type: "mcq",
      concept_id: "M1_SUM_SIN_REAGR_10",
    });

    expect(result.valid).toBe(true);
  });

  it("should reject trivially obvious distractors (e.g., 0, 1, 999)", () => {
    const result = validateDistractors({
      correct_answer: "7",
      distractors: ["0", "1", "999"],
      exercise_type: "mcq",
    });

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

// ─── Numeric answer validation ──────────────────────────────

describe("REQ-EG-005: Numeric answer validation", () => {
  it("should validate correct numeric answer in prompt", () => {
    const result = validateNumericAnswer({
      prompt: "Si Lucía tiene 3 alfajores y Mateo le da 4 más, ¿cuántos alfajores tiene en total?",
      correct_answer: 7,
    });

    expect(result.valid).toBe(true);
  });

  it("should detect incorrect numeric answer with explicit arithmetic", () => {
    const result = validateNumericAnswer({
      prompt: "Resolvé: 3 + 4 = ?",
      correct_answer: 8, // wrong: 3 + 4 = 7
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Correct answer does not match arithmetic in prompt");
  });

  it("should accept answers for subtraction exercises", () => {
    const result = validateNumericAnswer({
      prompt: "Sofía tenía 12 figuritas y regaló 5. ¿Cuántas figuritas le quedan?",
      correct_answer: 7,
    });

    expect(result.valid).toBe(true);
  });

  it("should accept exercises where correct answer cannot be auto-verified", () => {
    const result = validateNumericAnswer({
      prompt: "¿Cuántos parientes tiene Lautaro si tiene 2 hermanos mayores y sus padres?",
      correct_answer: 4,
    });

    // Cannot auto-verify, so it should pass (not enough info to verify)
    expect(result.valid).toBe(true);
  });
});

// ─── Context coherence validation ──────────────────────────

describe("REQ-EG-005: Context coherence validation", () => {
  it("should accept exercises with matching context", () => {
    const result = validateContextCoherence({
      prompt: "Lucía fue al kiosco y compró 3 alfajores de $30 cada uno. ¿Cuánto pagó en total?",
      context_id: "kiosco",
    });

    expect(result.valid).toBe(true);
  });

  it("should flag obvious translations without local context", () => {
    const result = validateContextCoherence({
      prompt: "Maria went to the supermarket to buy apples. How many apples did she buy?",  // translated from English, not Argentine
      context_id: "kiosco",
    });

    expect(result.valid).toBe(false);
    expect(result.errors.some((e: string) => e.includes("English") || e.includes("translation"))).toBe(true);
  });

  it("should accept Argentine contexts with voseo", () => {
    const result = validateContextCoherence({
      prompt: "Mateo tiene 25 figuritas del álbum del Mundial. Si compra un sobre de 5, ¿cuántas tendrá?",
      context_id: "figuritas",
    });

    expect(result.valid).toBe(true);
  });
});

// ─── Type distribution validation ───────────────────────────

describe("REQ-EG-005: Type distribution validation", () => {
  it("should accept a valid type distribution for Números concepts", () => {
    const distribution = {
      mcq: 0.40,
      numeric_input: 0.25,
      h5p_fill_blank: 0.15,
      h5p_drag_drop: 0.10,
      h5p_match: 0.10,
    };

    const result = validateTypeDistribution(distribution, "numeros");

    expect(result.valid).toBe(true);
    expect(result.actualTotal).toBeCloseTo(1.0, 1);
  });

  it("should reject a distribution that doesn't sum to ~1.0", () => {
    const distribution = {
      mcq: 0.50,
      numeric_input: 0.10,
      h5p_fill_blank: 0.05,
    };

    const result = validateTypeDistribution(distribution, "numeros");

    expect(result.valid).toBe(false);
  });

  it("should accept a valid type distribution for Amigos concepts", () => {
    const distribution = {
      socioemotional_dilemma: 0.50,
      mcq: 0.30,
      h5p_drag_drop: 0.10,
      h5p_match: 0.10,
    };

    const result = validateTypeDistribution(distribution, "amigos");

    expect(result.valid).toBe(true);
  });
});

// ─── Character balance validation ───────────────────────────

describe("REQ-EG-005: Character balance validation", () => {
  it("should accept a balanced distribution where no character exceeds 15%", () => {
    const characterIds = ["lucia", "mateo", "valentina", "joaquin", "camila", "tomas", "sofia", "benjamin", "martina", "lautar"];
    const exercises = Array.from({ length: 100 }, (_, i) => ({
      character_id: characterIds[i % 10]!,
      exercise_id: `TEST_${i}`,
      exercise_type: "mcq" as const,
      concept_id: "M1_NUM_HASTA_20",
      prompt: "test",
      correct_answer: "7",
      distractors: ["5", "6", "8"],
      difficulty: 3,
      source: "generated_v1" as const,
      context_id: "kiosco",
    }));

    const result = validateCharacterBalance(exercises);

    expect(result.valid).toBe(true);
  });

  it("should reject a distribution where one character exceeds 15%", () => {
    // 20 out of 100 = 20% for lucia, >15%
    const baseIds = ["mateo", "valentina", "joaquin", "camila", "tomas", "sofia", "benjamin", "martina", "lautar"];
    const exercises = Array.from({ length: 100 }, (_, i) => ({
      character_id: i < 20 ? "lucia" : baseIds[(i - 20) % 9]!,
      exercise_id: `TEST_${i}`,
      exercise_type: "mcq" as const,
      concept_id: "M1_NUM_HASTA_20",
      prompt: "test",
      correct_answer: "7",
      distractors: ["5", "6", "8"],
      difficulty: 3,
      source: "generated_v1" as const,
      context_id: "kiosco",
    }));

    const result = validateCharacterBalance(exercises);

    expect(result.valid).toBe(false);
    expect(result.errors.some((e: string) => e.includes("15%"))).toBe(true);
  });
});