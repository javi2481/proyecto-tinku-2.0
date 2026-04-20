/**
 * Exercise Review Script for Tinku 2.0
 *
 * CLI tool to review, edit, approve, or reject exercises from
 * seeds/exercises_raw/<concept_id>/ and move them to
 * seeds/exercises_approved/ or seeds/exercises_rejected/.
 *
 * Usage:
 *   npx tsx scripts/review_exercises.ts --concept <concept_id>
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "fs";
import { join } from "path";

// ─── Types ──────────────────────────────────────────────────────

interface Exercise {
  exercise_id: string;
  exercise_type: string;
  concept_id: string;
  prompt: string;
  correct_answer: unknown;
  distractors?: string[];
  hint?: string;
  character_id: string;
  context_id: string;
  difficulty: number;
  source: string;
}

// ─── Load raw exercises ─────────────────────────────────────────

const SEEDS_DIR = join(process.cwd(), "seeds");

function loadRawExercises(conceptId: string): Exercise[] {
  const rawDir = join(SEEDS_DIR, "exercises_raw", conceptId);

  if (!existsSync(rawDir)) {
    console.error(`No raw exercises found for concept: ${conceptId}`);
    console.error(`Expected directory: ${rawDir}`);
    process.exit(1);
  }

  const files = readdirSync(rawDir).filter((f) => f.endsWith(".json"));
  if (files.length === 0) {
    console.error(`No JSON files found in ${rawDir}`);
    process.exit(1);
  }

  const allExercises: Exercise[] = [];
  for (const file of files) {
    const content = readFileSync(join(rawDir, file), "utf-8");
    const exercises = JSON.parse(content) as Exercise[];
    allExercises.push(...exercises);
  }

  return allExercises;
}

// ─── Interactive Review ─────────────────────────────────────────

function displayExercise(exercise: Exercise, index: number, total: number): void {
  console.log("\n" + "=".repeat(60));
  console.log(`Exercise ${index + 1}/${total}`);
  console.log("=".repeat(60));
  console.log(`ID:         ${exercise.exercise_id}`);
  console.log(`Type:       ${exercise.exercise_type}`);
  console.log(`Concept:    ${exercise.concept_id}`);
  console.log(`Difficulty: ${exercise.difficulty}/10`);
  console.log(`Character:  ${exercise.character_id}`);
  console.log(`Context:    ${exercise.context_id}`);
  console.log(`\nPROMPT:\n${exercise.prompt}`);
  console.log(`\nCORRECT ANSWER: ${JSON.stringify(exercise.correct_answer)}`);
  if (exercise.distractors && exercise.distractors.length > 0) {
    console.log(`\nDISTRACTORS: ${exercise.distractors.join(" | ")}`);
  }
  if (exercise.hint) {
    console.log(`\nHINT: ${exercise.hint}`);
  }
  console.log("=".repeat(60));
}

async function reviewExercises(conceptId: string): Promise<void> {
  const exercises = loadRawExercises(conceptId);
  console.log(`Found ${exercises.length} exercises for concept: ${conceptId}\n`);

  const approved: Exercise[] = [];
  const rejected: Array<{ exercise: Exercise; reason: string }> = [];

  for (let i = 0; i < exercises.length; i++) {
    displayExercise(exercises[i]!, i, exercises.length);

    // Simple CLI review: log action needed
    // In a real interactive mode, this would use readline
    // For now, it auto-approves exercises that pass basic validation
    const exercise = exercises[i]!;

    // Basic validation
    const issues: string[] = [];
    if (!exercise.prompt || exercise.prompt.length < 10) {
      issues.push("Prompt too short or empty");
    }
    if (!exercise.exercise_type) {
      issues.push("Missing exercise_type");
    }
    if (!exercise.concept_id) {
      issues.push("Missing concept_id");
    }
    if (exercise.difficulty === undefined || exercise.difficulty < 1 || exercise.difficulty > 10) {
      issues.push(`Invalid difficulty: ${exercise.difficulty}`);
    }

    if (issues.length === 0) {
      approved.push(exercise);
      console.log("✅ Auto-approved");
    } else {
      console.log(`⚠️  Issues: ${issues.join(", ")}`);
      console.log("   Marking for review (rejected with reason)");
      rejected.push({ exercise, reason: issues.join("; ") });
    }
  }

  // Save approved exercises
  const approvedDir = join(SEEDS_DIR, "exercises_approved", conceptId);
  mkdirSync(approvedDir, { recursive: true });
  writeFileSync(
    join(approvedDir, "approved.json"),
    JSON.stringify(approved, null, 2),
    "utf-8",
  );

  // Save rejected exercises
  const rejectedDir = join(SEEDS_DIR, "exercises_rejected", conceptId);
  mkdirSync(rejectedDir, { recursive: true });
  writeFileSync(
    join(rejectedDir, "rejected.json"),
    JSON.stringify(rejected, null, 2),
    "utf-8",
  );

  console.log(`\n📊 Review Summary for ${conceptId}:`);
  console.log(`   Approved: ${approved.length}`);
  console.log(`   Rejected: ${rejected.length}`);
  console.log(`   Total:    ${exercises.length}`);
  console.log(`\n   Approved saved to: ${join(approvedDir, "approved.json")}`);
  console.log(`   Rejected saved to: ${join(rejectedDir, "rejected.json")}`);
}

// ─── Main ───────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  let conceptId = "";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--concept" && args[i + 1]) {
      conceptId = args[i + 1]!;
      i++;
    }
  }

  if (!conceptId) {
    console.error("Usage: npx tsx scripts/review_exercises.ts --concept <concept_id>");
    process.exit(1);
  }

  await reviewExercises(conceptId);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});