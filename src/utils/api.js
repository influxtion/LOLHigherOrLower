/*
 * All network calls live here. Hooks and components only consume the
 * normalized `{ id, name, stat, imageUrl }` shape returned below.
 *
 * Mode 1 (Base HP) is fully live against Data Dragon.
 * Mode 2 (Win Rate) joins the live Data Dragon roster with a hand-curated
 * static dataset in src/data/winRates.json. There is no live win-rate fetch.
 */

import { CDRAGON, DDRAGON, MINIGAMES, MODES } from './constants.js';
import { getWinRate } from '../data/winRates.js';
import { getReleaseDate } from '../data/releaseDates.js';

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
      imageUrl: CDRAGON.centeredSplashUrl(champion.id),
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
    imageUrl: CDRAGON.centeredSplashUrl(champion.id),
  }));
}

/**
 * Builds the Difficulty-mode champion list from Riot's own 1–10 rating, which
 * ships inside `info.difficulty` on the batch champion.json payload.
 */
export async function fetchChampionsDifficulty(version) {
  const payload = await fetchChampionPayload(version);
  return Object.values(payload?.data ?? {})
    .map((champion) => ({
      id: champion.id,
      name: champion.name,
      stat: champion.info?.difficulty,
      imageUrl: CDRAGON.centeredSplashUrl(champion.id),
    }))
    .filter((c) => Number.isFinite(c.stat));
}

/**
 * Builds the Release-Date mode champion list. Data Dragon does not ship
 * release dates, so we join the live roster with a hand-curated static
 * dataset (src/data/releaseDates.json). Champions missing from the dataset
 * are filtered out rather than given a fake date — keeps the game honest,
 * and a freshly-added champion just sits out until the JSON is updated.
 */
export async function fetchChampionsRelease(version) {
  const payload = await fetchChampionPayload(version);
  return Object.values(payload?.data ?? {})
    .map((champion) => ({
      id: champion.id,
      name: champion.name,
      stat: getReleaseDate(champion.id),
      imageUrl: CDRAGON.centeredSplashUrl(champion.id),
    }))
    .filter((c) => Number.isFinite(c.stat));
}

/**
 * Pixel Reveal minigame champion list. No stat — just identity + splash URL.
 */
export async function fetchChampionsForPixelReveal(version) {
  const payload = await fetchChampionPayload(version);
  return Object.values(payload?.data ?? {}).map((champion) => ({
    id: champion.id,
    name: champion.name,
    imageUrl: CDRAGON.centeredSplashUrl(champion.id),
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
  if (mode === MODES.DIFFICULTY) return fetchChampionsDifficulty(version);
  if (mode === MODES.RELEASE) return fetchChampionsRelease(version);
  if (mode === MINIGAMES.PIXEL_REVEAL) return fetchChampionsForPixelReveal(version);
  return fetchChampionsHP(version);
}
