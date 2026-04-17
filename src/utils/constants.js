/*
 * Centralized constants. Nothing in the codebase should hard-code a mode id,
 * URL, or timing value — import from here instead.
 */

export const MODES = {
  HP: 'hp',
  WIN_RATE: 'winRate',
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
];

export const DDRAGON = {
  versionsUrl: 'https://ddragon.leagueoflegends.com/api/versions.json',
  championDataUrl: (version) =>
    `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`,
  loadingArtUrl: (championId) =>
    `https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${championId}_0.jpg`,
};

export const TIMINGS = {
  revealMs: 900,
  nextRoundDelayMs: 1100,
};

export const STORAGE_KEYS = {
  highScoreHp: 'lolhl:highscore:hp',
  highScoreWinRate: 'lolhl:highscore:winRate',
};

export const highScoreKeyFor = (mode) =>
  mode === MODES.HP ? STORAGE_KEYS.highScoreHp : STORAGE_KEYS.highScoreWinRate;
