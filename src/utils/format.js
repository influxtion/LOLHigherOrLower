import { MODES } from './constants.js';

export const formatInteger = (value) =>
  Number.isFinite(value) ? Math.round(value).toLocaleString('en-US') : '—';

export const formatPercent = (value) =>
  Number.isFinite(value) ? `${value.toFixed(2)}%` : '—';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/* Stat is stored as a NEGATED YYYYMMDD integer (see releaseDates.js) so that
   "earlier = higher" in the numeric compare. Reverse the negation here for
   display. Month + year only — day precision is noise for "who came out first". */
export const formatReleaseDate = (value) => {
  if (!Number.isFinite(value)) return '—';
  const abs = Math.abs(value);
  const year = Math.floor(abs / 10000);
  const month = Math.floor(abs / 100) % 100;
  const name = MONTH_NAMES[month - 1];
  return name ? `${name} ${year}` : String(year);
};

/**
 * Mode-aware stat formatter. Given a raw stat value, returns the display
 * string for that mode. Centralizing this keeps the ChampionCard component
 * oblivious to mode specifics.
 */
export function formatStat(mode, value) {
  if (mode === MODES.WIN_RATE) return formatPercent(value);
  if (mode === MODES.RELEASE) return formatReleaseDate(value);
  return formatInteger(value);
}
