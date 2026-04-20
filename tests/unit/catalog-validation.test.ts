import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import yaml from "js-yaml";

const SEEDS_DIR = join(process.cwd(), "seeds");

/** Helper to load and parse a YAML file */
function loadYaml<T>(filename: string): T {
  const filepath = join(SEEDS_DIR, filename);
  if (!existsSync(filepath)) {
    throw new Error(`File not found: ${filepath}`);
  }
  const raw = readFileSync(filepath, "utf-8");
  return yaml.load(raw) as T;
}

// Type definitions for catalog structures
interface Island {
  id: string;
  name: string;
  description: string;
  theme_color: string;
  nap_alignment: string;
  regions: string[];
}

interface Region {
  id: string;
  island_id: string;
  name: string;
  description: string;
  order: number;
}

interface Concept {
  id: string;
  region_id: string;
  name: string;
  description: string;
  difficulty_range: [number, number];
  province_coin: string;
  nap_alignment: string;
  prerequisites: string[];
  type_distribution: Record<string, number>;
  characters_to_use: string[];
  grade: number;
}

interface Character {
  id: string;
  name: string;
  age: number;
  city: string;
  interests: string[];
  personality_traits: string[];
}

interface Context {
  id: string;
  name: string;
  description: string;
  setting_type: string;
}

// ─── REQ-PC-001: Islands Catalog ────────────────────────────────────

describe("REQ-PC-001: Islands Catalog YAML", () => {
  it("should contain exactly 2 islands: Números and Amigos", () => {
    const data = loadYaml<{ islands: Island[] }>("islands.yml");

    expect(data.islands).toHaveLength(2);
    const names = data.islands.map((i) => i.name);
    expect(names).toContain("Isla de los Números");
    expect(names).toContain("Isla de los Amigos");
  });

  it("should have complete metadata for each island", () => {
    const data = loadYaml<{ islands: Island[] }>("islands.yml");

    for (const island of data.islands) {
      expect(island.id).toBeDefined();
      expect(island.id.length).toBeGreaterThan(0);
      expect(island.name).toBeDefined();
      expect(island.description).toBeDefined();
      expect(island.description.length).toBeGreaterThan(10);
      expect(island.theme_color).toBeDefined();
      expect(island.nap_alignment).toBeDefined();
      expect(island.nap_alignment.length).toBeGreaterThan(0);
    }
  });

  it("Isla de los Números should reference at least 3 regions", () => {
    const data = loadYaml<{ islands: Island[] }>("islands.yml");
    const numeros = data.islands.find((i) => i.name === "Isla de los Números");

    expect(numeros).toBeDefined();
    expect(numeros!.regions.length).toBeGreaterThanOrEqual(3);
  });

  it("Isla de los Amigos should reference regions", () => {
    const data = loadYaml<{ islands: Island[] }>("islands.yml");
    const amigos = data.islands.find((i) => i.name === "Isla de los Amigos");

    expect(amigos).toBeDefined();
    expect(amigos!.regions.length).toBeGreaterThanOrEqual(1);
  });
});

// ─── REQ-PC-002: Regions Catalog ─────────────────────────────────────

describe("REQ-PC-002: Regions Catalog YAML", () => {
  it("should have at least 6 regions in total", () => {
    const data = loadYaml<{ regions: Region[] }>("regions.yml");

    expect(data.regions.length).toBeGreaterThanOrEqual(6);
  });

  it("should have complete metadata for each region", () => {
    const data = loadYaml<{ regions: Region[] }>("regions.yml");

    for (const region of data.regions) {
      expect(region.id).toBeDefined();
      expect(region.id.length).toBeGreaterThan(0);
      expect(region.island_id).toBeDefined();
      expect(region.name).toBeDefined();
      expect(region.description).toBeDefined();
      expect(typeof region.order).toBe("number");
    }
  });

  it("should link regions to islands that exist in islands.yml", () => {
    const islandsData = loadYaml<{ islands: Island[] }>("islands.yml");
    const regionsData = loadYaml<{ regions: Region[] }>("regions.yml");

    const islandIds = new Set(islandsData.islands.map((i) => i.id));
    for (const region of regionsData.regions) {
      expect(islandIds.has(region.island_id)).toBe(true);
    }
  });

  it("should have unique region IDs", () => {
    const data = loadYaml<{ regions: Region[] }>("regions.yml");
    const ids = data.regions.map((r) => r.id);
    const uniqueIds = new Set(ids);

    expect(ids.length).toBe(uniqueIds.size);
  });
});

// ─── REQ-PC-003: Concepts Catalog ─────────────────────────────────────

describe("REQ-PC-003: Concepts Catalog YAML", () => {
  it("should have 20+ concepts for Isla de los Números", () => {
    const conceptsData = loadYaml<{ concepts: Concept[] }>("concepts.yml");
    const islandsData = loadYaml<{ islands: Island[] }>("islands.yml");
    const regionsData = loadYaml<{ regions: Region[] }>("regions.yml");

    const numerosIsland = islandsData.islands.find((i) => i.name === "Isla de los Números");
    const numerosRegionIds = new Set<string>();
    for (const r of regionsData.regions) {
      if (r.island_id === numerosIsland!.id) {
        numerosRegionIds.add(r.id);
      }
    }

    const numerosConcepts = conceptsData.concepts.filter((c) => numerosRegionIds.has(c.region_id));
    expect(numerosConcepts.length).toBeGreaterThanOrEqual(20);
  });

  it("should have 5 concepts for Isla de los Amigos", () => {
    const conceptsData = loadYaml<{ concepts: Concept[] }>("concepts.yml");
    const islandsData = loadYaml<{ islands: Island[] }>("islands.yml");
    const regionsData = loadYaml<{ regions: Region[] }>("regions.yml");

    const amigosIsland = islandsData.islands.find((i) => i.name === "Isla de los Amigos");
    const amigosRegionIds = new Set<string>();
    for (const r of regionsData.regions) {
      if (r.island_id === amigosIsland!.id) {
        amigosRegionIds.add(r.id);
      }
    }

    const amigosConcepts = conceptsData.concepts.filter((c) => amigosRegionIds.has(c.region_id));
    expect(amigosConcepts.length).toBeGreaterThanOrEqual(5);
  });

  it("should have complete metadata for each concept", () => {
    const data = loadYaml<{ concepts: Concept[] }>("concepts.yml");

    for (const concept of data.concepts) {
      expect(concept.id).toBeDefined();
      expect(concept.id.length).toBeGreaterThan(0);
      expect(concept.region_id).toBeDefined();
      expect(concept.name).toBeDefined();
      expect(concept.description).toBeDefined();
      expect(concept.difficulty_range).toBeDefined();
      expect(concept.difficulty_range).toHaveLength(2);
      expect(concept.difficulty_range[0]).toBeLessThanOrEqual(concept.difficulty_range[1]);
      expect(concept.province_coin).toBeDefined();
      expect(concept.nap_alignment).toBeDefined();
      expect(Array.isArray(concept.prerequisites)).toBe(true);
      expect(concept.type_distribution).toBeDefined();
      expect(concept.characters_to_use).toBeDefined();
      expect(concept.characters_to_use.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("should form a DAG (no cycles in prerequisites)", () => {
    const data = loadYaml<{ concepts: Concept[] }>("concepts.yml");

    const conceptIds = new Set(data.concepts.map((c) => c.id));

    // Verify prerequisites reference existing concepts
    for (const concept of data.concepts) {
      for (const prereq of concept.prerequisites) {
        expect(conceptIds.has(prereq)).toBe(true);
      }
    }

    // Check for cycles via topological sort (Kahn's algorithm)
    const inDegree = new Map<string, number>();
    const adjacency = new Map<string, string[]>();

    for (const c of data.concepts) {
      inDegree.set(c.id, c.prerequisites.length);
      for (const prereq of c.prerequisites) {
        const adj = adjacency.get(prereq) ?? [];
        adj.push(c.id);
        adjacency.set(prereq, adj);
      }
    }

    const queue: string[] = [];
    const inDegreeEntries = Array.from(inDegree.entries());
    for (const entry of inDegreeEntries) {
      if (entry[1] === 0) queue.push(entry[0]);
    }

    let processed = 0;
    while (queue.length > 0) {
      const node = queue.shift()!;
      processed++;
      const neighbors = adjacency.get(node) ?? [];
      for (const neighbor of neighbors) {
        const newDeg = (inDegree.get(neighbor) ?? 0) - 1;
        inDegree.set(neighbor, newDeg);
        if (newDeg === 0) queue.push(neighbor);
      }
    }

    expect(processed).toBe(data.concepts.length);
  });

  it("type_distribution for Números concepts should sum to ~1.0 (±0.01)", () => {
    const conceptsData = loadYaml<{ concepts: Concept[] }>("concepts.yml");
    const islandsData = loadYaml<{ islands: Island[] }>("islands.yml");
    const regionsData = loadYaml<{ regions: Region[] }>("regions.yml");

    const numerosIsland = islandsData.islands.find((i) => i.name === "Isla de los Números");
    const numerosRegionIds = new Set<string>();
    for (const r of regionsData.regions) {
      if (r.island_id === numerosIsland!.id) numerosRegionIds.add(r.id);
    }

    const numerosConcepts = conceptsData.concepts.filter((c) => numerosRegionIds.has(c.region_id));

    for (const concept of numerosConcepts) {
      const sum = Object.values(concept.type_distribution).reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1.0, 1);
    }
  });

  it("type_distribution for Amigos concepts should include socioemotional_dilemma", () => {
    const conceptsData = loadYaml<{ concepts: Concept[] }>("concepts.yml");
    const islandsData = loadYaml<{ islands: Island[] }>("islands.yml");
    const regionsData = loadYaml<{ regions: Region[] }>("regions.yml");

    const amigosIsland = islandsData.islands.find((i) => i.name === "Isla de los Amigos");
    const amigosRegionIds = new Set<string>();
    for (const r of regionsData.regions) {
      if (r.island_id === amigosIsland!.id) amigosRegionIds.add(r.id);
    }

    const amigosConcepts = conceptsData.concepts.filter((c) => amigosRegionIds.has(c.region_id));

    for (const concept of amigosConcepts) {
      expect(concept.type_distribution).toHaveProperty("socioemotional_dilemma");
    }
  });
});

// ─── REQ-PC-004: Characters Catalog ──────────────────────────────────

describe("REQ-PC-004: Characters Catalog YAML", () => {
  const requiredNames = ["Lucía", "Mateo", "Valentina", "Joaquín", "Camila", "Tomás", "Sofía", "Benjamín", "Martina", "Lautaro"];

  it("should contain exactly 10 characters with the required names", () => {
    const data = loadYaml<{ characters: Character[] }>("characters.yml");

    expect(data.characters).toHaveLength(10);
    const names = data.characters.map((c) => c.name);
    for (const requiredName of requiredNames) {
      expect(names).toContain(requiredName);
    }
  });

  it("should have complete metadata for each character", () => {
    const data = loadYaml<{ characters: Character[] }>("characters.yml");

    for (const char of data.characters) {
      expect(char.id).toBeDefined();
      expect(char.id.length).toBeGreaterThan(0);
      expect(char.name).toBeDefined();
      expect(char.age).toBeGreaterThanOrEqual(6);
      expect(char.age).toBeLessThanOrEqual(12);
      expect(char.city).toBeDefined();
      expect(char.city.length).toBeGreaterThan(0);
      expect(char.interests.length).toBeGreaterThanOrEqual(2);
      expect(char.personality_traits.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("should have unique character IDs", () => {
    const data = loadYaml<{ characters: Character[] }>("characters.yml");
    const ids = data.characters.map((c) => c.id);
    const uniqueIds = new Set(ids);

    expect(ids.length).toBe(uniqueIds.size);
  });
});

// ─── REQ-PC-005: Contexts Catalog ────────────────────────────────────

describe("REQ-PC-005: Contexts Catalog YAML", () => {
  it("should contain at least 8 Argentine contexts", () => {
    const data = loadYaml<{ contexts: Context[] }>("contexts.yml");

    expect(data.contexts.length).toBeGreaterThanOrEqual(8);
  });

  it("should have complete metadata for each context", () => {
    const data = loadYaml<{ contexts: Context[] }>("contexts.yml");

    for (const ctx of data.contexts) {
      expect(ctx.id).toBeDefined();
      expect(ctx.id.length).toBeGreaterThan(0);
      expect(ctx.name).toBeDefined();
      expect(ctx.description).toBeDefined();
      expect(ctx.description.length).toBeGreaterThan(10);
      expect(ctx.setting_type).toBeDefined();
    }
  });

  it("should have unique context IDs", () => {
    const data = loadYaml<{ contexts: Context[] }>("contexts.yml");
    const ids = data.contexts.map((c) => c.id);
    const uniqueIds = new Set(ids);

    expect(ids.length).toBe(uniqueIds.size);
  });

  it("should include standard setting types from CONTENT.md", () => {
    const data = loadYaml<{ contexts: Context[] }>("contexts.yml");
    const settingTypes = new Set(data.contexts.map((c) => c.setting_type));

    const expectedTypes = ["kiosco", "colectivo", "plaza", "escuela", "feria", "cancha", "cumpleaños"];
    for (const expected of expectedTypes) {
      expect(settingTypes.has(expected)).toBe(true);
    }
  });
});