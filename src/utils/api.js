/*
 * All network calls live here. Hooks and components only consume the
 * normalized `{ id, name, stat, imageUrl }` shape returned below.
 *
 * Mode 1 (Base HP) is fully live against Data Dragon.
 * Mode 2 (Win Rate) joins the live Data Dragon roster with a hand-curated
 * static dataset in src/data/winRates.json. There is no live win-rate fetch.
 */

import { DDRAGON, MODES } from './constants.js';
import { getWinRate } from '../data/winRates.js';

/**
 * GETs the latest Data Dragon patch version. versions[0] is always newest.
 */
export async function fetchLatestVersion() {
  const response = await fetch(DDRAGON.versionsUrl);
  if (!response.ok) throw new Error(`versions.json HTTP ${response.status}`);
  const versions = await response.json();
  if (!Array.isArray(versions) || versions.length === 0) {
    throw new Error('versions.json returned no versions');
  }
  return versions[0];
}

/**
 * GETs the batch champion.json for the given patch and normalizes it.
 * The batch endpoint already contains stats.hp for every champion, so one
 * request covers the full roster (~170 champions).
 */
export async function fetchChampionsHP(version) {
  const payload = await fetchChampionPayload(version);
  return Object.values(payload?.data ?? {})
    .map((champion) => ({
      id: champion.id,
      name: champion.name,
      stat: champion.stats?.hp,
      imageUrl: DDRAGON.loadingArtUrl(champion.id),
    }))
    .filter((c) => Number.isFinite(c.stat));
}

/**
 * Builds the Mode 2 champion list: every champion from the live Data Dragon
 * roster, annotated with its win rate from the hand-curated static dataset.
 * Unknown-champion lookups fall back to 50.0 inside getWinRate() so a newly
 * added champion is still playable (just centered) until the dataset is
 * updated by hand.
 */
export async function fetchChampionsWinRate(version) {
  const payload = await fetchChampionPayload(version);
  return Object.values(payload?.data ?? {}).map((champion) => ({
    id: champion.id,
    name: champion.name,
    stat: getWinRate(champion.id),
    imageUrl: DDRAGON.loadingArtUrl(champion.id),
  }));
}

async function fetchChampionPayload(version) {
  const response = await fetch(DDRAGON.championDataUrl(version));
  if (!response.ok) throw new Error(`champion.json HTTP ${response.status}`);
  return response.json();
}

/**
 * Dispatch entry point used by the champion-data hook. Keeps the hook from
 * knowing anything about HTTP or data sources.
 */
export async function fetchChampionsForMode(mode) {
  const version = await fetchLatestVersion();
  if (mode === MODES.WIN_RATE) return fetchChampionsWinRate(version);
  return fetchChampionsHP(version);
}
