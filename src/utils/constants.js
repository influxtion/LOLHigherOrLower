/*
 * Centralized constants. Nothing in the codebase should hard-code a mode id,
 * URL, or timing value — import from here instead.
 */

export const MODES = {
  HP: 'hp',
  DIFFICULTY: 'difficulty',
  RELEASE: 'release',
  SKIN_COUNT: 'skinCount',
};

export const MINIGAMES = {
  PIXEL_REVEAL: 'pixelReveal',
  PIXEL_REVEAL_SKINS: 'pixelRevealSkins',
};

export const MODE_LIST = [
  {
    id: MODES.HP,
    slug: 'hp',
    label: 'Base HP',
    shortLabel: 'HP',
    statLabel: 'Base HP',
    description: 'Compare base HP at level 1.',
    pageTitle: 'League of Legends Higher or Lower — Base HP | StatRift',
    pageDescription:
      "Play League of Legends Higher or Lower with champion base HP. Guess which LoL champion starts with more HP at level 1 and build a streak. Free browser-based LoL trivia game.",
    pageHeading: 'Base HP — Higher or Lower?',
    pageIntro:
      "A League of Legends Higher or Lower game built around base HP. Which LoL champion starts with more HP at level 1? Values are pulled live from Riot's Data Dragon — no interpretation, just the raw number. Pick correctly and chain a streak as long as you can.",
  },
  {
    id: MODES.DIFFICULTY,
    slug: 'difficulty',
    label: 'Difficulty',
    shortLabel: 'DIFF',
    statLabel: 'Difficulty',
    description: "Compare Riot's 1–10 difficulty rating.",
    pageTitle: 'League of Legends Higher or Lower — Difficulty | StatRift',
    pageDescription:
      "Play League of Legends Higher or Lower with Riot's champion difficulty rating. Guess which LoL champion is rated harder to play and chain a streak. Free LoL trivia game.",
    pageHeading: 'Difficulty — Higher or Lower?',
    pageIntro:
      "A League of Legends Higher or Lower game built around Riot's 1–10 champion difficulty rating. Guess which of the two LoL champions Riot rates as harder to play. Ties count as correct.",
  },
  {
    id: MODES.RELEASE,
    slug: 'release',
    label: 'Release Date',
    shortLabel: 'DATE',
    statLabel: 'Released',
    description: 'Which champion came out first?',
    pageTitle: 'League of Legends Higher or Lower — Release Date | StatRift',
    pageDescription:
      "Play League of Legends Higher or Lower with champion release dates. Guess which LoL champion came out first, from Annie in 2009 to the latest release. Free LoL trivia.",
    pageHeading: 'Release Date — Earlier or Later?',
    pageIntro:
      "A League of Legends Higher or Lower game built around champion release dates. From Annie in 2009 to the latest release, pick the LoL champion that came out earlier and chain a streak. A trivia game for long-time League players.",
  },
  {
    id: MODES.SKIN_COUNT,
    slug: 'skins',
    label: 'Skin Count',
    shortLabel: 'SKINS',
    statLabel: 'Skins',
    description: 'Which champion has more skins?',
    pageTitle: 'League of Legends Higher or Lower — Skin Count | StatRift',
    pageDescription:
      "Play League of Legends Higher or Lower with champion skin counts. Guess which LoL champion has more skins across the full roster. Free browser-based LoL trivia.",
    pageHeading: 'Skin Count — Higher or Lower?',
    pageIntro:
      "A League of Legends Higher or Lower game built around skin counts. Ahri and Lux are the obvious answers — the rest are trickier. Pick which LoL champion has more skins across the full catalogue (base skin counted) and chain a streak.",
  },
];

export const MINIGAMES_LIST = [
  {
    id: MINIGAMES.PIXEL_REVEAL,
    slug: 'fog-of-war',
    label: 'Fog of War',
    shortLabel: 'FOG',
    description: 'Identify the champion through a veil of pixels.',
    pageTitle: 'League of Legends Pixel Art Guessing Game — Fog of War | StatRift',
    pageDescription:
      "A League of Legends pixelated art guessing game. Identify the LoL champion from pixelated splash art — each wrong guess clears a little more of the fog. Free and browser-based.",
    pageHeading: 'Fog of War',
    pageIntro:
      "A League of Legends pixel art guessing game. Identify the LoL champion from behind a veil of pixels — each wrong guess clears a little more of the fog. Fewer guesses is better. How low can you go?",
  },
  {
    id: MINIGAMES.PIXEL_REVEAL_SKINS,
    slug: 'fog-of-war-skins',
    label: 'Fog of War: Skins',
    shortLabel: 'SKINS',
    description: 'Same fog — but a random skin splash. Often barely recognizable.',
    pageTitle: 'LoL Skin Pixel Art Guessing Game — Fog of War: Skins | StatRift',
    pageDescription:
      "A League of Legends pixelated art guessing game, skin edition. Identify the LoL champion from a random pixelated skin splash. The harder variant of Fog of War.",
    pageHeading: 'Fog of War: Skins',
    pageIntro:
      "The harder variant of our League of Legends pixel art guessing game. Same fog, same fewer-is-better scoring — but the splash art is from a random skin instead of the base art. Often barely recognisable. For players who know the roster cold.",
  },
];

/* Unified lookup: every playable entry (HoL modes + minigames) in one list.
   Used by the Astro page router (`[mode].astro`) and by the sidebar to
   resolve slug ↔ id without caring which group the entry belongs to. */
export const ALL_MODES = [...MODE_LIST, ...MINIGAMES_LIST];

export const modeIdToSlug = (id) =>
  ALL_MODES.find((m) => m.id === id)?.slug ?? null;

export const slugToMode = (slug) =>
  ALL_MODES.find((m) => m.slug === slug) ?? null;

export const pathForMode = (id) => {
  const slug = modeIdToSlug(id);
  return slug ? `/play/${slug}` : '/';
};

export const isMinigameId = (id) =>
  MINIGAMES_LIST.some((m) => m.id === id);

/* Sidebar + menu grouping. Each group = a header with a tagline and the set
   of game ids that belong to it. Kept here so both the sidebar and the main
   menu stay in sync. */
export const GAME_GROUPS = [
  {
    id: 'higherLower',
    label: 'Higher Or Lower?',
    tagline:
      'League of Legends Higher or Lower — pick the LoL champion with the higher stat.',
    entries: MODE_LIST,
  },
  {
    id: 'pixelReveal',
    label: 'Fog of War',
    tagline:
      'A League of Legends pixel art guessing game. Identify the LoL champion through a veil of pixels.',
    entries: MINIGAMES_LIST,
  },
];

export const DDRAGON = {
  versionsUrl: 'https://ddragon.leagueoflegends.com/api/versions.json',
  championDataUrl: (version) =>
    `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`,
  loadingArtUrl: (championId) =>
    `https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${championId}_0.jpg`,
};

/* Community Dragon's centered splash art is ~1215px wide with the champion
   pre-centered — ideal for portrait cards and far higher res than Data
   Dragon's 308×560 loading tile (no upscaling, no "too zoomed in" look). */
export const CDRAGON = {
  centeredSplashUrl: (championId) =>
    `https://cdn.communitydragon.org/latest/champion/${championId}/splash-art/centered`,
  skinCenteredSplashUrl: (championKey, skinNum) =>
    `https://cdn.communitydragon.org/latest/champion/${championKey}/splash-art/centered/skin/${skinNum}`,
  skinsJsonUrl:
    'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/skins.json',
  tileUrl: (championKey) =>
    `https://cdn.communitydragon.org/latest/champion/${championKey}/tile`,
};

export const TIMINGS = {
  revealMs: 900,
  nextRoundDelayMs: 1100,
};

export const STORAGE_KEYS = {
  highScoreHp: 'lolhl:highscore:hp',
  highScoreDifficulty: 'lolhl:highscore:difficulty',
  highScoreRelease: 'lolhl:highscore:release',
  highScoreSkinCount: 'lolhl:highscore:skinCount',
  bestPixelReveal: 'lolhl:best:pixelReveal',
  bestPixelRevealSkins: 'lolhl:best:pixelRevealSkins',
};

export const highScoreKeyFor = (mode) => {
  if (mode === MODES.DIFFICULTY) return STORAGE_KEYS.highScoreDifficulty;
  if (mode === MODES.RELEASE) return STORAGE_KEYS.highScoreRelease;
  if (mode === MODES.SKIN_COUNT) return STORAGE_KEYS.highScoreSkinCount;
  if (mode === MINIGAMES.PIXEL_REVEAL) return STORAGE_KEYS.bestPixelReveal;
  if (mode === MINIGAMES.PIXEL_REVEAL_SKINS) return STORAGE_KEYS.bestPixelRevealSkins;
  return STORAGE_KEYS.highScoreHp;
};

/* Pixel Reveal step schedule. Index = wrong-guess count; value is the
   downsampled grid width (in pixels) that gets upscaled to fill the card.
   Last entry of null means "render at full resolution" — the visual floor. */
export const PIXEL_REVEAL_STEPS = [8, 16, 24, 40, 64, 96, 140, 200, 320, null];
