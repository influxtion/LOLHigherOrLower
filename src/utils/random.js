/*
 * Small random-picking helpers. Kept separate so the game-state hook reads
 * clearly and so these are trivially unit-testable.
 */

export function pickRandom(list) {
  if (!list?.length) return null;
  const index = Math.floor(Math.random() * list.length);
  return list[index];
}

/**
 * Pick a random item whose `id` is not in `excludeIds`.
 * Returns null if the exclusion set removes every option.
 */
export function pickRandomExcluding(list, excludeIds) {
  if (!list?.length) return null;
  const exclude = new Set(excludeIds.filter(Boolean));
  const pool = list.filter((item) => !exclude.has(item.id));
  return pickRandom(pool);
}

/**
 * Pick two distinct random items. Returns [a, b] or null if fewer than 2 exist.
 */
export function pickPair(list, excludeIds = []) {
  if (!list || list.length < 2) return null;
  const first = pickRandomExcluding(list, excludeIds);
  if (!first) return null;
  const second = pickRandomExcluding(list, [...excludeIds, first.id]);
  if (!second) return null;
  return [first, second];
}
