import winRates from './winRates.json';

const DEFAULT_WIN_RATE = 50.0;

/**
 * Look up the Emerald+ win rate for a champion by Data Dragon id.
 * Returns 50.0 for unknown champions so the game never has to special-case
 * a missing entry (e.g. a brand-new champion not yet in the dataset).
 */
export function getWinRate(championId) {
  if (!championId) return DEFAULT_WIN_RATE;
  const value = winRates[championId];
  return typeof value === 'number' ? value : DEFAULT_WIN_RATE;
}

/**
 * Metadata describing the dataset (patch, rank, last-updated, source).
 * Useful for surfacing "stats last updated" info or for tooling that wants
 * to know how fresh the values are.
 */
export function getWinRateMeta() {
  return winRates._meta ?? null;
}
