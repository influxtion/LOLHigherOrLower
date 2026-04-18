# LoL Higher or Lower

A small React + Vite web game. The player is shown two League of Legends champion cards side-by-side — a revealed **anchor** on the left and a hidden **challenger** on the right — and must pick which has the higher stat. On a correct guess the challenger's stat is revealed and it slides into the anchor slot for the next round (see "conveyor belt" below).

## Project purpose

Give a LoL player a quick, satisfying "how well do I know the roster?" loop. The UI should feel deliberately designed (dark, LoL-flavored, gold accents) rather than generically themed, and the code should be clean enough that a new developer can understand the full flow in a single sitting.

## Game modes

Modes are switched at any time from the left sidebar. Each mode has its own independent high score.

### 1. Base HP

Which champion has the higher **base HP at level 1**? Values are fetched live from Riot's Data Dragon CDN. No interpretation — the number comes directly from `stats.hp` in the Data Dragon champion payload.

## The "conveyor belt" round transition

Classic Higher or Lower flow. The left card is the **anchor** — its stat is always visible. The right card is the **challenger** — its stat stays hidden until the player picks. On a correct guess the challenger's stat is revealed, then the challenger slides into the anchor slot (keeping its now-known value) and a fresh random champion becomes the new challenger on the right. Output of one turn is the input of the next — the chain is continuous.

Implemented in `src/hooks/useGameState.js::advanceRound` (the swap site) and `src/components/GameScreen/GameScreen.jsx` (which decides per-side reveal state).

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
│   ├── useGameState.js               Round state machine, score, high-score persistence, conveyor-belt swap
│   ├── useChampionData.js            Fetches + caches the champion list per mode
│   └── useLocalStorage.js            Small generic hook for persisted state
├── data/
│   └── releaseDates.js               getReleaseDate(id) lookup for Release Date mode
├── utils/
│   ├── api.js                        Data Dragon fetchers, version resolution
│   ├── random.js                     pickRandom, pickRandomExcluding
│   ├── format.js                     formatInteger, formatReleaseDate, formatStat
│   └── constants.js                  Mode ids, URLs, timings, storage keys
└── styles/
    ├── tokens.css                    CSS variables — colors, spacing, type, radii, motion
    ├── reset.css                     Minimal reset
    └── globals.css                   Base element styles; imports tokens + reset
```

## Data sources

### Data Dragon

- `GET https://ddragon.leagueoflegends.com/api/versions.json` — array of patch versions; `versions[0]` is the latest.
- `GET https://ddragon.leagueoflegends.com/cdn/{version}/data/en_US/champion.json` — batch endpoint that already contains `stats.hp` and `info.difficulty` for every champion. **This is preferred over the per-champion endpoint** because one request covers the full roster (~170 champions) instead of one-per-champion.
- Card art: `https://cdn.communitydragon.org/latest/champion/{id}/splash-art/centered` (Community Dragon). 1280×720 landscape with the champion pre-centered — scales cleanly into the portrait card aspect without the aggressive upscaling you'd get from Data Dragon's 308×560 loading tile. On the rare 404 (brand-new champion before Community Dragon mirrors them), the card falls back to `https://ddragon.leagueoflegends.com/cdn/img/champion/loading/{id}_0.jpg`.

### Release dates — static dataset

Release Date mode joins the live Data Dragon roster with a hand-curated static dataset in `src/data/releaseDates.js`. Champions missing from the dataset are filtered out rather than given a fake date — a freshly-added champion just sits out until the dataset is updated.

## API strategy

Data fetching lives entirely in `utils/api.js`. Hooks/components only see the normalized `[{ id, name, stat, imageUrl }]` shape. All modes source their roster from the Data Dragon batch `champion.json`; error states are surfaced in the UI.

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

- If Data Dragon changes the shape of `champion.json`, update the fetchers in `utils/api.js` and note it here.
- When a new champion ships, HP and Difficulty modes pick them up automatically from the live Data Dragon roster. Release Date mode will skip them until they're added to `src/data/releaseDates.js`.
- This file is the source of truth for onboarding. Keep it honest — if a decision above stops being true, update it here first.
