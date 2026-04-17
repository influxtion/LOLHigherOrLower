import releaseDates from './releaseDates.json';

/**
 * Look up the release-date "firstness" score for a champion by Data Dragon id.
 *
 * The game prompt is "who came out first?", so the correct answer is the
 * EARLIER champion. To make that work with the generic numeric higher/lower
 * comparison (which always treats the larger value as the winner), we return
 * the date as a NEGATED YYYYMMDD integer — an earlier date becomes a larger
 * (less-negative) number. The display formatter in utils/format.js reverses
 * the negation before rendering. Returns null for unknown ids; the caller
 * filters those out of the pool instead of substituting a fake date.
 */
export function getReleaseDate(championId) {
  if (!championId) return null;
  const iso = releaseDates.dates?.[championId];
  if (typeof iso !== 'string') return null;
  const [year, month, day] = iso.split('-').map(Number);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }
  return -(year * 10000 + month * 100 + day);
}

export function getReleaseDateMeta() {
  return releaseDates._meta ?? null;
}
