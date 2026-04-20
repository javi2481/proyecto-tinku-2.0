import { z } from "zod";

// ─── Exercise Type Enum ──────────────────────────────────────

export const ExerciseTypeEnum = z.enum([
  "mcq",
  "numeric_input",
  "h5p_fill_blank",
  "h5p_drag_drop",
  "h5p_match",
  "socioemotional_dilemma",
]);

export type ExerciseType = z.infer<typeof ExerciseTypeEnum>;

// ─── Base Exercise Schema ─────────────────────────────────────

export const ExerciseSchema = z.object({
  exercise_id: z.string().min(1),
  exercise_type: ExerciseTypeEnum,
  concept_id: z.string().min(1),
  prompt: z.string().min(10),
  correct_answer: z.unknown(),
  distractors: z.array(z.string()).optional(),
  hint: z.string().optional(),
  character_id: z.string().min(1),
  context_id: z.string().min(1),
  difficulty: z.number().int().min(1).max(10),
  source: z.literal("generated_v1"),
});

export type Exercise = z.infer<typeof ExerciseSchema>;

// ─── Specialized Schemas ──────────────────────────────────────

export const McqExerciseSchema = ExerciseSchema.extend({
  exercise_type: z.literal("mcq"),
  distractors: z.array(z.string()).min(2).max(4),
  correct_answer: z.string(),
});

export const NumericExerciseSchema = ExerciseSchema.extend({
  exercise_type: z.literal("numeric_input"),
  correct_answer: z.number(),
  distractors: z.undefined(),
});

export const SocioemotionalDilemmaSchema = ExerciseSchema.extend({
  exercise_type: z.literal("socioemotional_dilemma"),
  distractors: z.array(z.string()).min(2).max(4),
  correct_answer: z.string(),
});

// ─── Validation Result Types ──────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface DistributionResult {
  valid: boolean;
  errors: string[];
  actualTotal: number;
}

// ─── Distractor Validation ────────────────────────────────────

export function validateDistractors(params: {
  correct_answer: string;
  distractors: string[];
  exercise_type: string;
  concept_id?: string;
}): ValidationResult {
  const errors: string[] = [];
  const { correct_answer, distractors } = params;

  // Check for duplicates
  const uniqueDistractors = new Set(distractors);
  if (uniqueDistractors.size !== distractors.length) {
    errors.push("Distractors contain duplicates");
  }

  // Check for distractors equal to correct answer
  if (distractors.includes(correct_answer)) {
    errors.push("Distractor equals correct answer");
  }

  // Check for trivially obvious distractors (0, 1, 999, etc.)
  const trivialPatterns = ["0", "1", "999", "1000"];
  const trivialCount = distractors.filter(
    (d) => trivialPatterns.includes(d) && d !== correct_answer
  ).length;
  if (trivialCount >= 2) {
    errors.push("Too many trivial distractors (0, 1, 999, 1000)");
  }

  // Check that distractors are plausible
  // For math exercises: distractors should be numerically close-ish to the answer
  if (params.concept_id?.startsWith("M")) {
    const correctNum = parseFloat(correct_answer);
    if (!isNaN(correctNum)) {
      const distractorNums = distractors.map((d) => parseFloat(d)).filter((n) => !isNaN(n));
      const allFarOff = distractorNums.every((d) => Math.abs(d - correctNum) > correctNum * 2);
      if (allFarOff && distractorNums.length > 0) {
        errors.push("All distractors are too far from correct answer — not plausible");
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

// ─── Numeric Answer Validation ─────────────────────────────────

export function validateNumericAnswer(params: {
  prompt: string;
  correct_answer: number;
}): ValidationResult {
  const errors: string[] = [];
  const { prompt, correct_answer } = params;

  // Try to extract arithmetic from the prompt and verify
  // Pattern: "N operador M" where operator is +, -, ×, *
  const sumPattern = /(\d+)\s*\+\s*(\d+)/g;
  const subPattern = /(\d+)\s*[-–]\s*(\d+)/g;
  const multPattern = /(\d+)\s*[×x]\s*(\d+)/g;

  let verified = false;
  let hasArithmetic = false;

  // Check additions
  let match: RegExpExecArray | null;
  while ((match = sumPattern.exec(prompt)) !== null) {
    hasArithmetic = true;
    const a = parseInt(match[1] ?? "0", 10);
    const b = parseInt(match[2] ?? "0", 10);
    if (a + b === correct_answer) {
      verified = true;
      break;
    }
  }

  // Check subtractions
  if (!verified) {
    subPattern.lastIndex = 0;
    while ((match = subPattern.exec(prompt)) !== null) {
      hasArithmetic = true;
      const a = parseInt(match[1] ?? "0", 10);
      const b = parseInt(match[2] ?? "0", 10);
      if (a - b === correct_answer) {
        verified = true;
        break;
      }
    }
  }

  // Check multiplications
  if (!verified) {
    multPattern.lastIndex = 0;
    while ((match = multPattern.exec(prompt)) !== null) {
      hasArithmetic = true;
      const a = parseInt(match[1] ?? "0", 10);
      const b = parseInt(match[2] ?? "0", 10);
      if (a * b === correct_answer) {
        verified = true;
        break;
      }
    }
  }

  // Also check subtraction patterns if we haven't found arithmetic yet
  // (subPattern may not have matched if sumPattern already set hasArithmetic)
  if (!hasArithmetic) {
    const subCheck = /(\d+)\s*[-–]\s*(\d+)/;
    const multCheck = /(\d+)\s*[×x]\s*(\d+)/;
    hasArithmetic = sumPattern.test(prompt) || subCheck.test(prompt) || multCheck.test(prompt);
  }

  // If we found arithmetic but it doesn't match the answer, that's an error
  if (hasArithmetic && !verified) {
    errors.push("Correct answer does not match arithmetic in prompt");
  }

  return { valid: errors.length === 0, errors };
}

// ─── Context Coherence Validation ──────────────────────────────

const KNOWN_CONTEXTS: Record<string, string[]> = {
  kiosco: ["kiosco", "alfajor", "caramelo", "figurita", "comprar", "vuelto", "moneda", "chupetín", "gaseosa"],
  colectivo: ["colectivo", "SUBE", "boleto", "parada", "cuadra", "asiento"],
  plaza: ["plaza", "hamaca", "tobogán", "banco", "jugar", "perro", "amigo"],
  escuela: ["escuela", "recreo", "pizarrón", "banco", "cuaderno", "mochila", "maestra", "compañero"],
  feria: ["feria", "puesto", "regatear", "manzana", "pulsera", "sábado"],
  cancha: ["cancha", "gol", "entrada", "alfajor", "equipo", "hincha"],
  cumpleaños: ["cumpleaños", "torta", "velita", "regalo", "invitado", "juego"],
  figuritas: ["figurita", "álbum", "sobre", "repetida", "intercambiar", "mundial"],
  naturaleza: ["montaña", "río", "árbol", "animal", "flor", "cordillera"],
  rio: ["río", "costa", "nadar", "pescar", "asado", "lancha"],
  museo: ["museo", "dinosaurio", "fósil", "exhibición", "guía"],
  familia: ["familia", "hermano", "mamá", "papá", "abuela", "casa", "cena"],
  barrio: ["barrio", "almacén", "esquina", "vecino", "vereda", "bicicleta"],
};

// Common English words that shouldn't appear in Argentine content
const ENGLISH_INDICATORS = [
  /\bthe\b/i, /\band\b/i, /\bwas\b/i, /\bwith\b/i, /\bwent\b/i,
  /\bshe\b/i, /\bhe\b/i, /\bthey\b/i, /\bhave\b/i, /\bbought\b/i,
];

export function validateContextCoherence(params: {
  prompt: string;
  context_id: string;
}): ValidationResult {
  const errors: string[] = [];
  const { prompt, context_id } = params;

  // Check for English text (obvious translation)
  let englishWordCount = 0;
  for (const pattern of ENGLISH_INDICATORS) {
    if (pattern.test(prompt)) {
      englishWordCount++;
    }
  }
  if (englishWordCount >= 2) {
    errors.push("Exercise contains English text — possible untranslated or poorly translated content");
  }

  // Check context keywords appear in prompt
  const contextKeywords = KNOWN_CONTEXTS[context_id];
  if (contextKeywords) {
    const promptLower = prompt.toLowerCase();
    const hasKeyword = contextKeywords.some((keyword) =>
      promptLower.includes(keyword.toLowerCase())
    );
    if (!hasKeyword) {
      errors.push(`Exercise context (${context_id}) doesn't match prompt content — no context keywords found`);
    }
  }

  return { valid: errors.length === 0, errors };
}

// ─── Type Distribution Validation ──────────────────────────────

export function validateTypeDistribution(
  distribution: Record<string, number>,
  islandId: string
): DistributionResult {
  const errors: string[] = [];

  const total = Object.values(distribution).reduce((sum, val) => sum + val, 0);

  if (Math.abs(total - 1.0) > 0.02) {
    errors.push(`Type distribution sums to ${total.toFixed(3)}, expected ~1.0`);
  }

  if (islandId === "amigos" && !distribution.socioemotional_dilemma) {
    errors.push("Amigos concepts must include socioemotional_dilemma type");
  }

  if (islandId === "numeros") {
    const expectedNumerosTypes = ["mcq", "numeric_input", "h5p_fill_blank", "h5p_drag_drop", "h5p_match"];
    for (const expectedType of expectedNumerosTypes) {
      if (!(expectedType in distribution)) {
        errors.push(`Números concepts should include ${expectedType} type`);
      }
    }
  }

  return { valid: errors.length === 0, errors, actualTotal: total };
}

// ─── Character Balance Validation ──────────────────────────────

export function validateCharacterBalance(exercises: Exercise[]): ValidationResult {
  const errors: string[] = [];
  const totalExercises = exercises.length;

  if (totalExercises === 0) {
    return { valid: true, errors: [] };
  }

  const characterCounts: Record<string, number> = {};
  for (const ex of exercises) {
    characterCounts[ex.character_id] = (characterCounts[ex.character_id] ?? 0) + 1;
  }

  const maxRatio = 0.15;
  for (const [characterId, count] of Object.entries(characterCounts)) {
    const ratio = count / totalExercises;
    if (ratio > maxRatio) {
      errors.push(`Character "${characterId}" appears in ${(ratio * 100).toFixed(1)}% of exercises (max 15%)`);
    }
  }

  return { valid: errors.length === 0, errors };
}