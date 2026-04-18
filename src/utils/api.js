/*
 * All network calls live here. Hooks and components only consume the
 * normalized `{ id, name, stat, imageUrl }` shape returned below.
 *
 * Base HP and Difficulty are fully live against Data Dragon.
 * Release Date joins the live roster with a hand-curated static dataset.
 */

import { CDRAGON, DDRAGON, MINIGAMES, MODES, ROSTER_GAMES } from './constants.js';
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
 * Builds the Skin-Count mode champion list. Counts non-base skins per champion
 * from CDragon's bulk skins.json — same source as the Fog of War: Skins
 * minigame, keeping "number of skins" consistent across the app.
 */
export async function fetchChampionsSkinCount(version) {
  const [payload, skinsMap] = await Promise.all([
    fetchChampionPayload(version),
    fetchSkinsPayload(),
  ]);

  const champions = Object.values(payload?.data ?? {});
  const counts = new Map(champions.map((c) => [Number(c.key), 0]));
  for (const skin of Object.values(skinsMap)) {
    if (!skin || skin.isBase) continue;
    const championKey = Math.floor(skin.id / 1000);
    if (counts.has(championKey)) {
      counts.set(championKey, counts.get(championKey) + 1);
    }
  }

  return champions.map((champion) => ({
    id: champion.id,
    name: champion.name,
    stat: counts.get(Number(champion.key)) ?? 0,
    imageUrl: CDRAGON.centeredSplashUrl(champion.id),
  }));
}

/**
 * Ability Builder roster — just identity + splash + tile, no abilities.
 * Abilities are fetched per-champion on demand via fetchChampionAbilities()
 * so we don't blow up the app with ~170 detail fetches up front.
 */
export async function fetchChampionsAbilityBuilder(version) {
  const payload = await fetchChampionPayload(version);
  return Object.values(payload?.data ?? {}).map((champion) => ({
    id: champion.id,
    key: champion.key,
    name: champion.name,
    title: champion.title,
    imageUrl: CDRAGON.centeredSplashUrl(champion.id),
    tileUrl: CDRAGON.tileUrl(champion.key),
    version,
  }));
}

/**
 * Fetches the detailed champion.json for one champion and normalizes the
 * spells + passive into `{ q, w, e, r, passive }` where each ability is
 * `{ name, description, iconUrl }`.
 */
export async function fetchChampionAbilities(version, championId) {
  const response = await fetch(DDRAGON.championDetailUrl(version, championId));
  if (!response.ok) {
    throw new Error(`champion detail HTTP ${response.status}`);
  }
  const payload = await response.json();
  const champion = payload?.data?.[championId];
  if (!champion) throw new Error('champion detail missing');
  const spells = champion.spells ?? [];
  const mk = (spell) =>
    spell
      ? {
          name: spell.name,
          description: spell.description,
          iconUrl: spell.image?.full
            ? DDRAGON.spellIconUrl(version, spell.image.full)
            : null,
        }
      : null;
  return {
    q: mk(spells[0]),
    w: mk(spells[1]),
    e: mk(spells[2]),
    r: mk(spells[3]),
    passive: champion.passive
      ? {
          name: champion.passive.name,
          description: champion.passive.description,
          iconUrl: champion.passive.image?.full
            ? DDRAGON.passiveIconUrl(version, champion.passive.image.full)
            : null,
        }
      : null,
  };
}

/**
 * Stat Builder mode champion list. Unlike the Higher/Lower modes which carry
 * a single `.stat`, each entry here carries all 7 base stats so the game can
 * both display the revealed value and compute its percentile in the roster.
 * Also exposes `tileUrl` so the bouncing-roll animation can render circular
 * tile icons without a second fetch.
 */
export async function fetchChampionsStatBuilder(version) {
  const payload = await fetchChampionPayload(version);
  return Object.values(payload?.data ?? {})
    .map((champion) => ({
      id: champion.id,
      key: champion.key,
      name: champion.name,
      imageUrl: CDRAGON.centeredSplashUrl(champion.id),
      tileUrl: CDRAGON.tileUrl(champion.key),
      stats: {
        hp: champion.stats?.hp,
        mp: champion.stats?.mp,
        ad: champion.stats?.attackdamage,
        as: champion.stats?.attackspeed,
        range: champion.stats?.attackrange,
        armor: champion.stats?.armor,
        mr: champion.stats?.spellblock,
      },
    }))
    .filter((c) =>
      [c.stats.hp, c.stats.mp, c.stats.ad, c.stats.as, c.stats.range, c.stats.armor, c.stats.mr]
        .every((v) => Number.isFinite(v)),
    );
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

/**
 * Skins variant of Pixel Reveal. The puzzle pool is one entry per non-base
 * skin, but every entry is keyed by its champion's id — so the guess loop
 * (match by id) and the autocomplete (deduped champion list) work unchanged.
 *
 * Skin IDs from CDragon encode both champion numeric key and skin number:
 *   skinId = championKey * 1000 + skinNum
 * We map the numeric key back to the Data Dragon string id via champion.json.
 */
export async function fetchChampionsForPixelRevealSkins(version) {
  const [payload, skinsMap] = await Promise.all([
    fetchChampionPayload(version),
    fetchSkinsPayload(),
  ]);

  const champions = Object.values(payload?.data ?? {});
  const keyToChampion = new Map(
    champions.map((c) => [Number(c.key), { id: c.id, name: c.name }]),
  );

  const entries = [];
  for (const skin of Object.values(skinsMap)) {
    if (!skin || skin.isBase) continue;
    const championKey = Math.floor(skin.id / 1000);
    const skinNum = skin.id % 1000;
    const champion = keyToChampion.get(championKey);
    if (!champion) continue;
    entries.push({
      id: champion.id,
      name: champion.name,
      skinName: skin.name,
      imageUrl: CDRAGON.skinCenteredSplashUrl(championKey, skinNum),
    });
  }
  return entries;
}

async function fetchSkinsPayload() {
  const response = await fetch(CDRAGON.skinsJsonUrl);
  if (!response.ok) throw new Error(`skins.json HTTP ${response.status}`);
  return response.json();
}

/**
 * Lightweight roster fetch for the menu-screen orbit background. Returns the
 * numeric key + DDragon id for every live champion. Uses the same batch
 * endpoint as every other mode, so the browser HTTP cache covers repeat calls
 * when the user bounces between menu and a mode.
 */
export async function fetchChampionTiles() {
  const version = await fetchLatestVersion();
  const payload = await fetchChampionPayload(version);
  return Object.values(payload?.data ?? {}).map((champion) => ({
    id: champion.id,
    key: champion.key,
    tileUrl: CDRAGON.tileUrl(champion.key),
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
  if (mode === MODES.DIFFICULTY) return fetchChampionsDifficulty(version);
  if (mode === MODES.RELEASE) return fetchChampionsRelease(version);
  if (mode === MODES.SKIN_COUNT) return fetchChampionsSkinCount(version);
  if (mode === MINIGAMES.PIXEL_REVEAL) return fetchChampionsForPixelReveal(version);
  if (mode === MINIGAMES.PIXEL_REVEAL_SKINS) return fetchChampionsForPixelRevealSkins(version);
  if (mode === ROSTER_GAMES.STAT_BUILDER) return fetchChampionsStatBuilder(version);
  if (mode === ROSTER_GAMES.ABILITY_BUILDER) return fetchChampionsAbilityBuilder(version);
  return fetchChampionsHP(version);
}
