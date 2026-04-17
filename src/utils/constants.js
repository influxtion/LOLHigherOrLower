/*
 * Centralized constants. Nothing in the codebase should hard-code a mode id,
 * URL, or timing value — import from here instead.
 */

export const MODES = {
  HP: 'hp',
  WIN_RATE: 'winRate',
  DIFFICULTY: 'difficulty',
  RELEASE: 'release',
};

export const MINIGAMES = {
  PIXEL_REVEAL: 'pixelReveal',
};

export const MODE_LIST = [
  {
    id: MODES.HP,
    label: 'Base HP',
    shortLabel: 'HP',
    statLabel: 'Base HP',
    description: 'Compare base HP at level 1.',
  },
  {
    id: MODES.WIN_RATE,
    label: 'Win Rate',
    shortLabel: 'WR',
    statLabel: 'Win Rate (Emerald+)',
    description: 'Compare Emerald+ ranked win rates.',
  },
  {
    id: MODES.DIFFICULTY,
    label: 'Difficulty',
    shortLabel: 'DIFF',
    statLabel: 'Difficulty',
    description: "Compare Riot's 1–10 difficulty rating.",
  },
  {
    id: MODES.RELEASE,
    label: 'Release Date',
    shortLabel: 'DATE',
    statLabel: 'Released',
    description: 'Which champion came out first?',
  },
];

export const MINIGAMES_LIST = [
  {
    id: MINIGAMES.PIXEL_REVEAL,
    label: 'Fog of War',
    shortLabel: 'FOG',
    description: 'Identify the champion through a veil of pixels.',
  },
];

export const isMinigameId = (id) =>
  MINIGAMES_LIST.some((m) => m.id === id);

/* Sidebar + menu grouping. Each group = a header with a tagline and the set
   of game ids that belong to it. Kept here so both the sidebar and the main
   menu stay in sync. */
export const GAME_GROUPS = [
  {
    id: 'higherLower',
    label: 'Higher Or Lower?',
    tagline: 'Pick the character with the higher stat.',
    entries: MODE_LIST,
  },
  {
    id: 'pixelReveal',
    label: 'Fog of War',
    tagline: 'Identify a champion through a veil of pixels.',
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
};

export const TIMINGS = {
  revealMs: 900,
  nextRoundDelayMs: 1100,
};

export const STORAGE_KEYS = {
  highScoreHp: 'lolhl:highscore:hp',
  highScoreWinRate: 'lolhl:highscore:winRate',
  highScoreDifficulty: 'lolhl:highscore:difficulty',
  highScoreRelease: 'lolhl:highscore:release',
  bestPixelReveal: 'lolhl:best:pixelReveal',
};

export const highScoreKeyFor = (mode) => {
  if (mode === MODES.WIN_RATE) return STORAGE_KEYS.highScoreWinRate;
  if (mode === MODES.DIFFICULTY) return STORAGE_KEYS.highScoreDifficulty;
  if (mode === MODES.RELEASE) return STORAGE_KEYS.highScoreRelease;
  if (mode === MINIGAMES.PIXEL_REVEAL) return STORAGE_KEYS.bestPixelReveal;
  return STORAGE_KEYS.highScoreHp;
};

/* Pixel Reveal step schedule. Index = wrong-guess count; value is the
   downsampled grid width (in pixels) that gets upscaled to fill the card.
   Last entry of null means "render at full resolution" — the visual floor. */
export const PIXEL_REVEAL_STEPS = [8, 16, 24, 40, 64, 96, 140, 200, 320, null];
