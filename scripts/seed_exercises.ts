/**
 * Exercise Seed Script for Tinku 2.0
 *
 * Imports approved exercises from seeds/exercises_approved/<concept_id>/
 * to Supabase via UPSERT by exercise_id. Idempotent — re-running does not
 * duplicate exercises.
 *
 * Prerequisites:
 *   - Supabase tables (islands, regions, concepts, exercises) must exist
 *   - OPENROUTER_API_KEY or SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY must be set
 *   - Catalog YAML files must be seeded first
 *
 * Usage:
 *   npx tsx scripts/seed_exercises.ts [--dry-run]
 */

import { readFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";

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

// ─── Config ─────────────────────────────────────────────────────

const SEEDS_DIR = join(process.cwd(), "seeds");

function getEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} is not set. Set it in .env.local or export it.`);
  }
  return value;
}

// ─── Load approved exercises ────────────────────────────────────

function loadAllApprovedExercises(): Exercise[] {
  const approvedDir = join(SEEDS_DIR, "exercises_approved");

  if (!existsSync(approvedDir)) {
    console.log("No approved exercises directory found. Nothing to seed.");
    return [];
  }

  const conceptDirs = readdirSync(approvedDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  const allExercises: Exercise[] = [];

  for (const conceptId of conceptDirs) {
    const approvedFile = join(approvedDir, conceptId, "approved.json");
    if (existsSync(approvedFile)) {
      const content = readFileSync(approvedFile, "utf-8");
      const exercises = JSON.parse(content) as Exercise[];
      allExercises.push(...exercises);
      console.log(`  Loaded ${exercises.length} exercises from ${conceptId}`);
    }
  }

  return allExercises;
}

// ─── Seed to Supabase ─────────────────────────────────────────

async function seedToSupabase(exercises: Exercise[], dryRun: boolean): Promise<void> {
  const supabaseUrl = getEnvVar("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseKey = getEnvVar("SUPABASE_SERVICE_ROLE_KEY");

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Verify that catalog tables exist by checking for islands
  console.log("\nVerifying catalog tables...");
  const { error: islandError } = await supabase.from("islands").select("id").limit(1);
  if (islandError) {
    console.error("❌ Catalog tables not found. Run migrations first.");
    console.error(`   Error: ${islandError.message}`);
    console.error("   Execute supabase-schema migrations before seeding exercises.");
    process.exit(1);
  }
  console.log("✅ Catalog tables found.");

  if (dryRun) {
    console.log("\n🔍 DRY RUN — would seed the following exercises:");
    for (const exercise of exercises) {
      console.log(`   ${exercise.exercise_id} (${exercise.exercise_type}) — ${exercise.concept_id}`);
    }
    console.log(`\n   Total: ${exercises.length} exercises (dry run, no data inserted)`);
    return;
  }

  // Transform exercises for Supabase insert
  const rows = exercises.map((ex) => ({
    exercise_id: ex.exercise_id,
    exercise_type: ex.exercise_type,
    concept_id: ex.concept_id,
    prompt: ex.prompt,
    correct_answer: ex.correct_answer,
    distractors: ex.distractors ?? null,
    hint: ex.hint ?? null,
    character_id: ex.character_id,
    context_id: ex.context_id,
    difficulty: ex.difficulty,
    source: ex.source,
    status: "approved" as const,
  }));

  // Batch upsert (Supabase recommends batches of 100)
  const batchSize = 100;
  let seeded = 0;

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);

    const { error } = await supabase
      .from("exercises")
      .upsert(batch, { onConflict: "exercise_id" });

    if (error) {
      console.error(`❌ Error seeding batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
      console.error("   No partial data inserted. Fix the error and re-run (idempotent).");
      process.exit(1);
    }

    seeded += batch.length;
    console.log(`   Seeded batch ${Math.floor(i / batchSize) + 1}: ${batch.length} exercises (total: ${seeded})`);
  }

  console.log(`\n✅ Successfully seeded ${seeded} exercises.`);
}

// ─── Main ───────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");

  console.log("🌱 Tinku 2.0 — Exercise Seed Script");
  console.log("=".repeat(40));

  if (dryRun) {
    console.log("Mode: DRY RUN (no data will be inserted)\n");
  } else {
    console.log("Mode: LIVE (will insert data)\n");
  }

  const exercises = loadAllApprovedExercises();

  if (exercises.length === 0) {
    console.log("\nNo approved exercises found. Nothing to seed.");
    console.log("Run generate_exercises.ts and review_exercises.ts first.");
    return;
  }

  console.log(`\nFound ${exercises.length} approved exercises to seed.`);

  // Validate exercise IDs are unique
  const ids = exercises.map((e) => e.exercise_id);
  const uniqueIds = new Set(ids);
  if (ids.length !== uniqueIds.size) {
    const dupSet = new Set<string>();
    const duplicates: string[] = [];
    for (const id of ids) {
      if (dupSet.has(id)) {
        duplicates.push(id);
      }
      dupSet.add(id);
    }
    console.error(`\n❌ Duplicate exercise IDs found: ${duplicates.join(", ")}`);
    process.exit(1);
  }

  await seedToSupabase(exercises, dryRun);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});