# LoL Higher or Lower

A small React + Vite web game. The player is shown two League of Legends champion cards side-by-side and must pick which one has the higher stat. Classic Higher-or-Lower flow: the winning champion stays on screen while a new challenger replaces the loser — with one twist noted below.

## Project purpose

Give a LoL player a quick, satisfying "how well do I know the roster?" loop. The UI should feel deliberately designed (dark, LoL-flavored, gold accents) rather than generically themed, and the code should be clean enough that a new developer can understand the full flow in a single sitting.

## Game modes

Two modes, switched at any time from the left sidebar. Each mode has its own independent high score.

### 1. Base HP

Which champion has the higher **base HP at level 1**? Values are fetched live from Riot's Data Dragon CDN. No interpretation — the number comes directly from `stats.hp` in the Data Dragon champion payload.

### 2. Win Rate (Emerald+)

Which champion has the higher **win rate in Emerald+ ranked games**? The game attempts a live fetch from U.GG's public data endpoint on load; if that request fails (network error, CORS, or timeout), it silently falls back to a realistic static dataset bundled with the app.

**Honesty note:** the static dataset values are plausible and internally consistent, but they are not scraped live. They exist so that Mode 2 always works, not as a source of truth for real ladder stats.

## The "winner always replaced" invariant

Standard Higher or Lower keeps the winning card on screen indefinitely. That means one dominant champion (e.g. the tankiest champion in the roster for Mode 1) can carry an arbitrarily long streak, turning the game into a memory test. To avoid this, **both cards are replaced at the start of each new round, even the winner.** The winner's identity is recorded and excluded from the next pair so the game is always moving.

This is the single non-obvious gameplay invariant. It is implemented in `src/hooks/useGameState.js` and commented at the swap site.

## File / component structure

```
src/
├── main.jsx                          React entry point
├── App.jsx                           Top-level: owns mode + screen state, renders sidebar + active screen
├── App.module.css
├── components/
│   ├── Sidebar/                      Left-rail mode switcher, visible on menu and game screens
│   ├── ChampionCard/                 Loading-art portrait + name + stat (hidden / correct / incorrect states)
│   ├── VersusDivider/                "VS" badge rendered between the two cards
│   ├── ScoreDisplay/                 Current streak box with high score beneath
│   ├── MenuScreen/                   Home screen — title lockup and mode picker
│   ├── GameScreen/                   Orchestrates rounds: renders cards, divider, score, and game-over overlay
│   └── GameOver/                     Game-over overlay: final score, high score, play-again / change-mode actions
├── hooks/
│   ├── useGameState.js               Round state machine, score, high-score persistence, winner-replaces rule
│   ├── useChampionData.js            Fetches + caches the champion list per mode
│   └── useLocalStorage.js            Small generic hook for persisted state
├── data/
│   ├── winRates.json                 Curated Emerald+ dataset (patch 15.8.1, 170 champions) + _meta
│   └── winRates.js                   getWinRate(id) lookup helper with 50.0 default
├── utils/
│   ├── api.js                        Data Dragon + win-rate fetchers, version resolution
│   ├── random.js                     pickRandom, pickRandomExcluding
│   ├── format.js                     formatInteger, formatPercent, statLabel
│   └── constants.js                  Mode ids, URLs, timings, storage keys
└── styles/
    ├── tokens.css                    CSS variables — colors, spacing, type, radii, motion
    ├── reset.css                     Minimal reset
    └── globals.css                   Base element styles; imports tokens + reset
```

## Data sources

### Data Dragon (Mode 1)

- `GET https://ddragon.leagueoflegends.com/api/versions.json` — array of patch versions; `versions[0]` is the latest.
- `GET https://ddragon.leagueoflegends.com/cdn/{version}/data/en_US/champion.json` — batch endpoint that already contains `stats.hp` for every champion. **This is preferred over the per-champion endpoint** (`.../champion/{id}.json`) because one request covers the full roster (~170 champions) instead of one-per-champion. The per-champion endpoint is reserved as a fallback if the batch endpoint ever drops the hp field.
- Loading-screen art: `https://ddragon.leagueoflegends.com/cdn/img/champion/loading/{id}_0.jpg`. Portrait-oriented, card-friendly.

### Win rates — static dataset (Mode 2)

There is no live win-rate fetch. Mode 2 joins the live Data Dragon roster with a hand-curated static dataset:

- `src/data/winRates.json` — flat `{ championId: winRate }` map for every champion in Data Dragon patch **15.8.1** (170 entries), plus a `_meta` block with patch, rank, last-updated date, and the manual-update instructions.
- `src/data/winRates.js` — exports `getWinRate(championId)` (returns `50.0` for unknown ids) and `getWinRateMeta()`.

The join happens in `utils/api.js::fetchChampionsWinRate`: it pulls the live champion list from Data Dragon (so images, display names, and the current roster always match Mode 1) and looks up each champion's win rate via `getWinRate(id)`. A newly added champion missing from `winRates.json` is still playable — they just show up at the default 50.0 until the dataset is refreshed.

**Manual update process.** To refresh the numbers:
1. Visit `https://lolalytics.com/lol/tierlist/`.
2. Set rank filter to **Emerald+**.
3. Replace the values in `src/data/winRates.json` with the current win rates (keep the champion ids identical to Data Dragon).
4. Bump `_meta.patch` and `_meta.lastUpdated`.

Values are realistic Emerald+ win rates (47.0–54.0 range, most 50–52). This is a point-in-time snapshot, maintained by hand.

## API strategy

| Mode | Source | Error handling |
| --- | --- | --- |
| Base HP | Data Dragon `champion.json` (batch) | Error state surfaced in UI |
| Win Rate | Data Dragon roster + `winRates.json` | Unknown champion ids default to 50.0 |

Data fetching lives entirely in `utils/api.js`. Hooks/components only see the normalized `[{ id, name, stat, imageUrl }]` shape.

## Design decisions

- **Vanilla CSS + CSS Modules.** No Tailwind, no CSS-in-JS, no UI library. A component's styles sit next to its JSX. Global design tokens live in `styles/tokens.css` as CSS variables.
- **No router.** Three screens gated by local React state is simpler and honest to the scope.
- **No state library.** Props + a couple of hooks cover every need here.
- **Dark LoL aesthetic.** Deep near-black backgrounds, a single gold accent used sparingly, a serif display font (Cinzel) for scores/titles, Inter for body. Google Fonts loaded via `<link>` rather than a package dep.
- **Anti-"AI-generated" CSS rules:** no gradient buttons, no unmotivated drop shadows, no random pixel values (type scale and spacing scale are fixed), gold is an accent not a fill. Shadows only where depth is meaningful.
- **Image preloading.** When a correct guess resolves, the next challenger's image is preloaded with `new Image()` before it hits the DOM so swaps feel instant.

## How to run

```
npm install
npm run dev        # dev server at http://localhost:5173
npm run build      # production build
npm run preview    # preview the built bundle
```

No environment variables. The only runtime API is Data Dragon, which is public.

## Maintenance notes

- If Data Dragon changes the shape of `champion.json`, update `utils/api.js::fetchChampionsHP` / `fetchChampionsWinRate` and note it here.
- When a new champion ships, Mode 1 picks them up automatically from the live Data Dragon roster. Mode 2 will also include them, showing the 50.0 default until you add their real win rate to `src/data/winRates.json` (and bump `_meta.patch` / `_meta.lastUpdated`).
- This file is the source of truth for onboarding. Keep it honest — if a decision above stops being true, update it here first.
