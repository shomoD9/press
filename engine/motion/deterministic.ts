/*
This module enforces deterministic pseudo-random behavior. We isolate seeded
random generation here so scene visuals can feel organic while remaining fully
reproducible for render parity and test expectations.
*/

export function hashString(input: string): number {
  let hash = 2166136261;

  // FNV-like hashing gives stable integer seeds from human-readable identifiers.
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

export function mulberry32(seed: number): () => number {
  let t = seed >>> 0;

  return () => {
    t += 0x6d2b79f5;
    let result = Math.imul(t ^ (t >>> 15), t | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);

    // We normalize to [0, 1) because scene kits consume probability-like values.
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededRandomSequence(seedKey: string, count: number): number[] {
  const seed = hashString(seedKey);
  const nextRandom = mulberry32(seed);

  const values: number[] = [];
  for (let index = 0; index < count; index += 1) {
    values.push(nextRandom());
  }

  return values;
}
