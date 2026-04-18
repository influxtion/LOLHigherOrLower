# LoL Higher or Lower

A small **Astro + React** web game (branded "StatRift"). The player is shown two League of Legends champion cards side-by-side — a revealed **anchor** on the left and a hidden **challenger** on the right — and must pick which has the higher stat. On a correct guess the challenger's stat is revealed and it slides into the anchor slot for the next round (see "conveyor belt" below).

Astro pre-renders one HTML file per route (home + one per mode). Each game mode lives at its own URL, with its own `<title>` and `<meta description>` — so the site is indexable per mode instead of being a single-URL SPA.

## Project purpose

Give a LoL player a quick, satisfying "how well do I know the roster?" loop. The UI should feel deliberately designed (dark, LoL-flavored, gold accents) rather than generically themed, and the code should be clean enough that a new developer can understand the full flow in a single sitting.

## Game modes

Modes are switched at any time from the left sidebar. Each mode has its own independent high score.

### 1. Base HP

Which champion has the higher **base HP at level 1**? Values are fetched live from Riot's Data Dragon CDN. No interpretation — the number comes directly from `stats.hp` in the Data Dragon champion payload.

## The "conveyor belt" round transition

Classic Higher or Lower flow. The left card is the **anchor** — its stat is always visible. The right card is the **challenger** — its stat stays hidden until the player picks. On a correct guess the challenger's stat is revealed, then the challenger slides into the anchor slot (keeping its now-known value) and a fresh random champion becomes the new challenger on the right. Output of one turn is the input of the next — the chain is continuous.

Implemented in `src/hooks/useGameState.js::advanceRound` (the swap site) and `src/components/GameScreen/GameScreen.jsx` (which decides per-side reveal state).

## Routes

| URL | Content |
|---|---|
| `/` | Menu — hero, `ChampionOrbit` island, mode cards (all static HTML except orbit) |
| `/play/hp` | Base HP mode |
| `/play/difficulty` | Difficulty mode |
| `/play/release` | Release Date mode |
| `/play/skins` | Skin Count mode |
| `/play/fog-of-war` | Fog of War (Pixel Reveal) minigame |
| `/play/fog-of-war-skins` | Fog of War: Skins minigame |
| `/404` | Not found |

URL slugs and internal mode IDs (e.g. `skinCount`, `pixelReveal`) are intentionally different — slugs optimize for SEO/readability, IDs optimize for code. The mapping lives in `src/utils/constants.js` (`ALL_MODES`, `pathForMode`, `slugToMode`, `modeIdToSlug`).

## File / component structure

```
astro.config.mjs                      Astro + React + sitemap integrations; site = https://statrift.com
src/
├── layouts/
│   └── BaseLayout.astro              <html>/<head>, per-page SEO meta, OG/Twitter cards, canonical, fonts, sidebar + slot
├── pages/                            File-based routing (Astro)
│   ├── index.astro                   / — static menu hero + mode cards; ChampionOrbit as client:only island
│   ├── play/[mode].astro             Dynamic route (getStaticPaths) — mounts GameScreen or PixelRevealScreen as client:only
│   └── 404.astro
├── components/
│   ├── Sidebar/                      Sidebar.astro (static, no JS) — <a href> links, active highlight from Astro.url.pathname
│   ├── ChampionCard/                 Loading-art portrait + name + stat (hidden / correct / incorrect states)
│   ├── VersusDivider/                "VS" badge rendered between the two cards
│   ├── ScoreDisplay/                 Current streak box with high score beneath
│   ├── MenuScreen/                   Contains only ChampionOrbit.jsx + shared MenuScreen.module.css (menu markup itself lives in index.astro)
│   ├── GameScreen/                   Orchestrates rounds: renders cards, divider, score, and game-over overlay
│   ├── PixelReveal/                  Fog of War minigame — PixelRevealScreen, PixelCanvas, ChampionSearchInput
│   └── GameOver/                     Game-over overlay: final score, high score, play-again / change-mode actions
├── hooks/
│   ├── useGameState.js               Round state machine, score, high-score persistence, conveyor-belt swap
│   ├── useChampionData.js            Fetches + caches the champion list per mode
│   ├── usePixelReveal.js             Pixel-reveal minigame state
│   └── useLocalStorage.js            Small generic hook for persisted state (touches window — requires client:only parent)
├── data/
│   └── releaseDates.js               getReleaseDate(id) lookup for Release Date mode
├── utils/
│   ├── api.js                        Data Dragon fetchers, version resolution
│   ├── random.js                     pickRandom, pickRandomExcluding
│   ├── format.js                     formatInteger, formatReleaseDate, formatStat
│   └── constants.js                  Mode ids/slugs, SEO strings, URLs, timings, storage keys
└── styles/
    ├── tokens.css                    CSS variables — colors, spacing, type, radii, motion
    ├── reset.css                     Minimal reset (includes `a` reset for the new <a> mode links)
    └── globals.css                   Base element styles; imports tokens + reset; imported from BaseLayout.astro
public/
├── favicon.svg
└── robots.txt                        Points at /sitemap-index.xml
```

## Astro islands — what hydrates and why

Astro ships zero JS by default. Components opt into hydration with a `client:*` directive.

- **Sidebar** — static `.astro` file, no JS shipped. Highlighting is server-rendered from `Astro.url.pathname`.
- **Menu hero & mode cards** — static HTML in `index.astro`. Mode cards are `<a href>` tags.
- **ChampionOrbit** — `client:only="react"`. Uses canvas + `ResizeObserver` + rAF, so prerendering would crash on `window`.
- **GameScreen / PixelRevealScreen** — `client:only="react"`. Both use `useLocalStorage` (reads `window.localStorage` synchronously in the initializer), so neither can prerender. A single `client:only` boundary per page keeps the hydration model simple.
- All other React components (ChampionCard, ScoreDisplay, VersusDivider, GameOver, PixelCanvas, ChampionSearchInput) hydrate transitively inside their `client:only` parent — nothing to configure on them.

**Rule of thumb:** if a component (or any hook it transitively uses) touches `window`, `localStorage`, `navigator`, or a canvas/animation API at render or init time, it must live inside a `client:only` boundary, not `client:load`.

## Navigation

No client-side router. The sidebar and the menu's mode cards are plain `<a href="/play/{slug}">` — clicking them is a full page navigation to a pre-rendered HTML file (fast, SEO-ideal, bookmarkable, back/forward works). The "Change Mode" button inside `GameOver` navigates to `/` via `window.location.href` (fine inside the `client:only` island).

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

- **Vanilla CSS + CSS Modules.** No Tailwind, no CSS-in-JS, no UI library. A component's styles sit next to its JSX (or `.astro`). Global design tokens live in `styles/tokens.css` as CSS variables.
- **Astro for routing, React for interactivity.** No React Router — routing is file-based via `src/pages/`. Each game is a pre-rendered HTML page with a single React island for the interactive part. Keeps the SEO story honest and the codebase small.
- **No state library.** Props + a couple of hooks cover every need here.
- **Dark LoL aesthetic.** Deep near-black backgrounds, a single gold accent used sparingly, a serif display font (Cinzel) for scores/titles, Inter for body. Google Fonts loaded via `<link>` rather than a package dep.
- **Anti-"AI-generated" CSS rules:** no gradient buttons, no unmotivated drop shadows, no random pixel values (type scale and spacing scale are fixed), gold is an accent not a fill. Shadows only where depth is meaningful.
- **Image preloading.** When a correct guess resolves, the next challenger's image is preloaded with `new Image()` before it hits the DOM so swaps feel instant.

## How to run

```
npm install
npm run dev        # dev server at http://localhost:4321
npm run build      # production build — emits dist/ with one HTML file per route + sitemap
npm run preview    # preview the built bundle
```

No environment variables. The only runtime API is Data Dragon, which is public.

## SEO

- Per-page `<title>` + `<meta description>` set in `BaseLayout.astro`, fed from each page's frontmatter. Mode SEO strings live alongside each entry in `src/utils/constants.js` (`pageTitle`, `pageDescription`).
- Per-page canonical URL + Open Graph + Twitter card tags handled in `BaseLayout.astro`.
- Sitemap auto-generated by `@astrojs/sitemap` at `/sitemap-index.xml` + `/sitemap-0.xml`. `public/robots.txt` points at it.
- When adding a new mode or minigame: add it to `MODE_LIST` / `MINIGAMES_LIST` in `constants.js` (with `slug`, `pageTitle`, `pageDescription`). The `[mode].astro` dynamic route + sitemap pick it up automatically — no new files needed.
- When the production domain changes: update `site` in `astro.config.mjs` and the sitemap URL in `public/robots.txt`.

## Maintenance notes

- If Data Dragon changes the shape of `champion.json`, update the fetchers in `utils/api.js` and note it here.
- When a new champion ships, HP and Difficulty modes pick them up automatically from the live Data Dragon roster. Release Date mode will skip them until they're added to `src/data/releaseDates.js`.
- Adding a new game mode: add an entry to `MODE_LIST` or `MINIGAMES_LIST` (with `slug`, `pageTitle`, `pageDescription`), wire the `mode` id into the relevant hook, and it'll appear in the menu + sidebar + get its own `/play/<slug>` URL automatically.
- This file is the source of truth for onboarding. Keep it honest — if a decision above stops being true, update it here first.
