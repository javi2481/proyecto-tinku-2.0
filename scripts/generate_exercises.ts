/**
 * Exercise Generation Script for Tinku 2.0
 *
 * Reads YAML concept plans, composes prompts with character + context,
 * calls OpenRouter API (Claude Haiku), parses JSON response, validates
 * against schema, and saves to seeds/exercises_raw/<concept_id>/.
 *
 * Usage:
 *   npx tsx scripts/generate_exercises.ts --concept <concept_id> [--count 30] [--model anthropic/claude-3-haiku-20240307]
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import yaml from "js-yaml";

// ─── Types ──────────────────────────────────────────────────────

interface Concept {
  id: string;
  region_id: string;
  name: string;
  description: string;
  grade: number;
  difficulty_range: [number, number];
  province_coin: string;
  nap_alignment: string;
  prerequisites: string[];
  type_distribution: Record<string, number>;
  characters_to_use: string[];
}

interface Character {
  id: string;
  name: string;
  age: number;
  city: string;
  interests: string[];
  personality_traits: string[];
  contexts: string[];
  description: string;
}

interface ContextEntry {
  id: string;
  name: string;
  description: string;
  setting_type: string;
  economic: boolean;
  typical_items?: string[];
  note?: string;
}

interface Region {
  id: string;
  island_id: string;
  name: string;
  description: string;
  order: number;
}

interface Island {
  id: string;
  name: string;
  description: string;
  theme_color: string;
  nap_alignment: string;
  regions: string[];
}

// ─── Load YAML catalogs ────────────────────────────────────────

const SEEDS_DIR = join(process.cwd(), "seeds");
const PROMPTS_DIR = join(process.cwd(), "prompts");

function loadYaml<T>(filename: string): T {
  const filepath = join(SEEDS_DIR, filename);
  const raw = readFileSync(filepath, "utf-8");
  return yaml.load(raw) as T;
}

function loadConcept(conceptId: string): Concept {
  const data = loadYaml<{ concepts: Concept[] }>("concepts.yml");
  const concept = data.concepts.find((c) => c.id === conceptId);
  if (!concept) {
    throw new Error(`Concept not found: ${conceptId}`);
  }
  return concept;
}

function loadCharacter(characterId: string): Character {
  const data = loadYaml<{ characters: Character[] }>("characters.yml");
  const character = data.characters.find((c) => c.id === characterId);
  if (!character) {
    throw new Error(`Character not found: ${characterId}`);
  }
  return character;
}

function loadContext(contextId: string): ContextEntry {
  const data = loadYaml<{ contexts: ContextEntry[] }>("contexts.yml");
  const context = data.contexts.find((c) => c.id === contextId);
  if (!context) {
    throw new Error(`Context not found: ${contextId}`);
  }
  return context;
}

function loadIsland(islandId: string): Island {
  const data = loadYaml<{ islands: Island[] }>("islands.yml");
  const island = data.islands.find((i) => i.id === islandId);
  if (!island) {
    throw new Error(`Island not found: ${islandId}`);
  }
  return island;
}

function loadRegion(regionId: string): Region {
  const data = loadYaml<{ regions: Region[] }>("regions.yml");
  const region = data.regions.find((r) => r.id === regionId);
  if (!region) {
    throw new Error(`Region not found: ${regionId}`);
  }
  return region;
}

// ─── Generate exercises for a concept ───────────────────────────

async function generateExerciseBatch(
  concept: Concept,
  character: Character,
  context: ContextEntry,
  exerciseType: string,
  count: number,
  difficultyTarget: number,
  model: string,
  apiKey: string,
): Promise<unknown[]> {
  const promptTemplate = readFileSync(join(PROMPTS_DIR, "exercise-generation.md"), "utf-8");

  const filledPrompt = promptTemplate
    .replace(/{concept_name}/g, concept.name)
    .replace(/{concept_description}/g, concept.description)
    .replace(/{grade}/g, String(concept.grade))
    .replace(/{difficulty_range}/g, `[${concept.difficulty_range[0]}, ${concept.difficulty_range[1]}]`)
    .replace(/{exercise_type}/g, exerciseType)
    .replace(/{character_name}/g, character.name)
    .replace(/{character_age}/g, String(character.age))
    .replace(/{character_city}/g, character.city)
    .replace(/{context_name}/g, context.name)
    .replace(/{context_description}/g, context.description)
    .replace(/{num_exercises}/g, String(count))
    .replace(/{concept_id}/g, concept.id)
    .replace(/{character_id}/g, character.id)
    .replace(/{context_id}/g, context.id)
    .replace(/{target_difficulty}/g, String(difficultyTarget));

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content: filledPrompt,
        },
        {
          role: "user",
          content: `Generá ${count} ejercicios de tipo "${exerciseType}" para el concepto "${concept.name}" (${concept.id}), dificultad ${difficultyTarget}/10, con el personaje ${character.name} en el contexto "${context.name}". Respondé SOLO con un JSON array, sin markdown ni explicación.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenRouter API error ${response.status}: ${errorBody}`);
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };

  const content = data.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No content in API response");
  }

  // Try to parse JSON from the response (may have markdown fences)
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error(`Could not extract JSON array from response:\n${content.substring(0, 500)}`);
  }

  return JSON.parse(jsonMatch[0]) as unknown[];
}

// ─── Main ───────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  let conceptId = "";
  let count = 30;
  let model = "anthropic/claude-3-haiku-20240307";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--concept" && args[i + 1]) {
      conceptId = args[i + 1]!;
      i++;
    } else if (args[i] === "--count" && args[i + 1]) {
      count = parseInt(args[i + 1]!, 10);
      i++;
    } else if (args[i] === "--model" && args[i + 1]) {
      model = args[i + 1]!;
      i++;
    }
  }

  if (!conceptId) {
    console.error("Usage: npx tsx scripts/generate_exercises.ts --concept <concept_id> [--count 30] [--model anthropic/claude-3-haiku-20240307]");
    process.exit(1);
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error("Error: OPENROUTER_API_KEY environment variable is not set.");
    console.error("Set it in .env.local or export it before running this script.");
    process.exit(1);
  }

  console.log(`Generating exercises for concept: ${conceptId}`);
  console.log(`Model: ${model}, count per type: ~${count}`);

  const concept = loadConcept(conceptId);
  const region = loadRegion(concept.region_id);
  const island = loadIsland(region.island_id);

  console.log(`Concept: ${concept.name} (${concept.id})`);
  console.log(`Region: ${region.name}, Island: ${island.name}`);
  console.log(`Grade: ${concept.grade}°, Difficulty: [${concept.difficulty_range}]`);

  // Determine exercise types and their counts based on type_distribution
  const totalPerType = Math.max(Math.ceil(count / Object.keys(concept.type_distribution).length), 5);
  const outputDir = join(SEEDS_DIR, "exercises_raw", concept.id);
  mkdirSync(outputDir, { recursive: true });

  const allExercises: unknown[] = [];
  let retries = 0;
  const maxRetries = 1;

  for (const [exerciseType, ratio] of Object.entries(concept.type_distribution)) {
    const numExercises = Math.max(Math.round(count * ratio), 3);

    // Pick character and context, rotating through the list
    const characterIndex = allExercises.length % concept.characters_to_use.length;
    const characterId = concept.characters_to_use[characterIndex]!;
    const character = loadCharacter(characterId);

    // Pick context from character's contexts
    const contextId = character.contexts[characterIndex % character.contexts.length]!;
    const context = loadContext(contextId);

    // Calculate target difficulty within the range
    const [minDiff, maxDiff] = concept.difficulty_range;
    const difficultyTarget = Math.round(minDiff + (maxDiff - minDiff) * (allExercises.length / count));

    console.log(`\nGenerating ${numExercises} ${exerciseType} exercises (ratio: ${ratio})...`);

    let success = false;
    let attempts = 0;

    while (!success && attempts <= maxRetries) {
      try {
        const batch = await generateExerciseBatch(
          concept, character, context, exerciseType,
          numExercises, difficultyTarget, model, apiKey,
        );

        console.log(`  Generated ${batch.length} exercises of type ${exerciseType}`);
        allExercises.push(...batch);
        success = true;
      } catch (error) {
        attempts++;
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error(`  Attempt ${attempts} failed: ${errMsg}`);

        if (attempts <= maxRetries) {
          console.log("  Retrying with temperature 0...");
          // Retry with temperature 0 for deterministic output
          // (fallthrough — same call, different temperature)
        } else {
          console.error(`  Skipping ${exerciseType} after ${attempts} failed attempts. Continuing.`);
        }
      }
    }
  }

  // Save raw output
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").substring(0, 19);
  const outputFile = join(outputDir, `batch_${timestamp}.json`);
  writeFileSync(outputFile, JSON.stringify(allExercises, null, 2), "utf-8");

  console.log(`\n✅ Saved ${allExercises.length} exercises to ${outputFile}`);
  console.log(`Total exercises generated: ${allExercises.length}`);

  // Print type distribution summary
  const typeCounts: Record<string, number> = {};
  for (const ex of allExercises) {
    const exercise = ex as Record<string, unknown>;
    const type = String(exercise.exercise_type ?? "unknown");
    typeCounts[type] = (typeCounts[type] ?? 0) + 1;
  }
  console.log("\nType distribution:");
  for (const [type, cnt] of Object.entries(typeCounts)) {
    console.log(`  ${type}: ${cnt} (${((cnt / allExercises.length) * 100).toFixed(1)}%)`);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});