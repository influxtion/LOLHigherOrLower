import { MODES } from './constants.js';

export const formatInteger = (value) =>
  Number.isFinite(value) ? Math.round(value).toLocaleString('en-US') : '—';

export const formatPercent = (value) =>
  Number.isFinite(value) ? `${value.toFixed(2)}%` : '—';

/**
 * Mode-aware stat formatter. Given a raw stat value, returns the display
 * string for that mode. Centralizing this keeps the ChampionCard component
 * oblivious to mode specifics.
 */
export function formatStat(mode, value) {
  if (mode === MODES.WIN_RATE) return formatPercent(value);
  return formatInteger(value);
}
