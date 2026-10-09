# Handoff: audit + fix pass (branch `fix/audit`)

_Written 2026-10-09 by the agent that did the audit; updated the same day by the session that ran the checks on Andrew's Mac. Read this before continuing._

## Status at a glance

| Area | State |
| --- | --- |
| Branch | `fix/audit`, on top of `master` (`94678a5`); `git log --oneline master..fix/audit` lists the commits. **Not pushed**, and Andrew asked that nothing go to `master` yet. |
| Backend (`backend/`) | **Verified.** `ruff check .`, `ruff format --check .` and 56 pytest tests pass (Python 3.14 locally; CI uses 3.13). The second session fixed one `ruff` failure (missing newline in `src/apis/__init__.py`) that would have failed CI. |
| Frontend (`frontend/`) | **Verified.** Clean `npm ci` (npm 10.9.8, as in CI) → `lint` (0 problems, 37 files, React Compiler rules active) → `typecheck` (also with no `.next/`, as in CI) → `test` (61 tests) → `build` all pass on Next 16.4.0. |
| Visual parity | **Verified in a browser** against a `master` build: home and projects at 1024×768 and 390×844 match element-for-element (bounding boxes, font sizes, colours). Only differences: the intended nav underline (makes the nav pill 1 px taller), the `/projects` tab title, and the fixed body-overflow bug (`master` leaves inline `overflow: auto` on `<body>` after one navigation). No console errors. |
| Design pass | Branch `design/visual-refresh` from `fix/audit` (see the brief at the bottom). |

## What the second session changed

- **Lockfile regenerated** (CI's `npm ci` would have failed on the stale one). Every runtime dependency stays at the version `master` ships except Next.js.
- **next 16.1.1 → 16.4.0** (and `eslint-config-next` to match): `npm audit` reported critical advisories for `next <=16.3.7` (RSC DoS, cache poisoning, middleware bypass, image-optimizer SSRF/RCE) plus the bundled `sharp`/`postcss`.
- **vitest 3.2 → 4.1.11, @vitejs/plugin-react 4 → 5.2**: vitest 3 pulls in `tinypool <2.1.2` (critical) and `@vitest/mocker <4.1.11`. No test changes were needed. `vitest.config.ts` → `.mts` (Vite 8 warns about ESM in a CJS-loaded config); `tsconfig.json` includes `**/*.mts`.
- `npm audit fix` for transitive `tar`, `fflate`, `postcss`, `sharp`. **Remaining:** `braces <=3.0.3` via `eslint-config-next → fast-glob` (lint-time only; npm's only "fix" is downgrading to eslint-config-next 14). **ESLint stays on 9**: `eslint-plugin-react` (bundled by eslint-config-next) doesn't support ESLint 10 yet.
- **Prettier run** in its own commit (house style = `master`'s: 4-space, 80 columns). JSON stays 2-space; `tsconfig.json`/`next-env.d.ts` are left to Next.js.
- **Hydration fix for reduced-motion visitors:** `MonkeyTypeStatsCard` rendered `reducedMotion ? target : animated` on the first render. The server can't know the visitor's preference, so anyone with *prefers-reduced-motion* got "Hydration failed because the server rendered text didn't match the client" (reproduced in Chrome with the preference emulated). The first render is now always 0 and the count-up runs after mount (one step for reduced motion). A `renderToString` test compares the markup under both preferences and fails on the old code.
- **`next-env.d.ts` is no longer tracked:** Next 16 writes it differently for `next dev` (`.next/dev/types/...`) and `next build` (`.next/types/...`), so it flipped in every working tree. It's gitignored, as create-next-app does, and `npm run typecheck` is now `next typegen && tsc --noEmit`, which regenerates it plus the route types (including Next's route validator). Tested from a clean checkout.
- **npm gotcha:** npm 10.9.8 crashes (`Cannot read properties of null (reading 'edgesOut')` in Arborist `#loadPeerSet`) when *adding or upgrading* vitest 4 in this tree. If that happens, run the install with `npx npm@11 install ...`; the resulting lockfile (v3) works with npm 10's `npm ci`, which was verified.

## How to run the checks

```bash
cd ~/.stuff/projects/personal-website/frontend
npm ci && npm run lint && npm run typecheck && npm test && npm run build

cd ../backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
ruff check . && pytest
```

`~/.stuff/projects/_to_delete/` (the transfer archive and a stale git lock file) can be deleted.

## Ground rule that was followed

The owner asked for **no visual/layout changes in this pass**. Every markup edit keeps identical rendering under Tailwind's preflight (e.g. `h3 → h2` with the same classes). The only intentionally visible change: the nav now underlines the current page's icon — that code existed before but was dead (its `page` prop was never passed).

## What was wrong, and what changed

### Backend (Flask on Render)

| Bug | Fix |
| --- | --- |
| `requirements.txt` was **UTF-16** (PowerShell `pip freeze`); diffs showed as binary and other tooling choked. | Rewritten as UTF-8 with direct deps only (`Flask`, `gunicorn`, `python-dotenv`, `requests==2.32.4`). `requirements-dev.txt` adds `pytest` + `ruff`. |
| `monkeytype.py`: operator-precedence bug — `A or B and C and D` counted **every** `english_1k` test regardless of mode/duration. `mode2 == 15` compared int to the API's string. Upstream failures were cached for an hour as `{"averagewpm": None}`. "Best" returned the *first* english entry, not the best. | Explicit `_is_target_test` (language ∈ {english, english_1k}, mode `time`, `str(mode2) == "15"`); failures are never cached; best = `max` wpm across the target languages for the 15 s bucket. **The displayed "best" number may change** (it now includes english_1k). |
| `github.py`: `else: break` stopped at the first non-push event (a star/fork hid everything after it); `commits[0]` raised on empty pushes; `repo_url`/`commit_url` were api.github.com URLs; `Authorization: Bearer None` sent without a token; with a token, `/users/x/events` includes **private-repo** activity. | `continue` instead of `break`; empty pushes skipped; github.com URLs; header only with a token; `/events/public`; uses the push's head commit and the first line of its message; 5-minute cache. |
| `lastfm.py`: Last.fm returns `track` as an **object** (not a list) when only one track comes back → `KeyError: 0`; now-playing detection relied on list length; `image[3]` could IndexError or be `""`; plain-http URL. | Normalises dict/list; uses `@attr.nowplaying`; picks the largest non-empty image; https; 15 s cache. **API change:** `currentlylistening` is now a real boolean (was the string `"True"`/`"False"`); a `url` field was added. The frontend accepts both shapes. |
| `app.py`: `/monkeytype` answered **200** with `{"error": ...}` → frontend rendered "undefined wpm"; no request timeouts (a hung upstream pins a gunicorn worker); env vars read at import time (untestable); HTML 500 pages. | Upstream failures → **502 JSON**; every request has a (5 s, 10 s) timeout via `src/http_client.fetch_json`; env read lazily; JSON 404/500 handlers; `create_app()` factory (`app = create_app()` keeps `gunicorn src.app:app` working). |
| `flask-cors` | Replaced by a 15-line `after_request` hook. `CORS_ORIGINS` env: `*` (default) or a comma-separated allow-list (echoes the matching origin + `Vary: Origin`). |
| `spotify.py` (still not routed) | Timeouts, no `KeyError` on a failed token refresh, missing-credential guard. |

New files: `src/cache.py` (thread-safe single-value TTL cache, never caches `None`), `src/http_client.py`, `tests/` (7 files, 56 tests), `pyproject.toml` (pytest + ruff `E,F,W,I,B`, line length 110), `.env.example`.

### Frontend (Next 16 / React 19 / Tailwind 4 on Vercel)

| Bug | Fix |
| --- | --- |
| `RecentlyListenedCard` polled the backend **every 4 s per visitor**, forever, even in background tabs; no abort; errors left "Loading…" on screen for good; `<img>` had no `alt` and could be `src=""`; compared `currentlylistening === "True"`. | `usePolling` hook: 30 s interval, skipped while `document.hidden`, immediate refresh on return, in-flight request aborted on the next tick/unmount. Error state ("Listening history unavailable."), keeps the last good track if a later refresh fails, placeholder box when there's no album art, alt text, `isNowPlaying()` accepts boolean or legacy string. |
| Home page: an error payload from the backend became `averagewpm: undefined` → "undefined wpm" and a `NaN` progress animation. | `lib/api.ts` validates every payload (`parseTypingScore`, `parseRecentTrack`, `parseGithubEvents`); `MonkeyTypeStatsCard` takes `stats: TypingScore \| null` and shows "—" / "typing stats unavailable". |
| `LayoutTransition`: set `document.body.style.overflow = "auto"` after each navigation, which **overrides the layout's `overflow-x-hidden`** (horizontal scrollbar on desktop after the first route change); used `onAnimationEnd`, a DOM CSS-animation event that motion never fires; effect cleanup ran on every render. | Only `overflowY` is toggled, restored to `""` (class takes over again); `onAnimationComplete`; timers cleaned up; never leaves the body locked on unmount. |
| `Nav`: active-page underline was dead code. `className?: ReactNode` (also in `WarningElement`). | Client component using `usePathname()`; `aria-current="page"`; `aria-label="Primary"`; proper `string` prop types. |
| `ProjectCard`: external link was an `onClick` on an `<img>` — not focusable, no role, no middle-click; made the whole card a client component. | Real `<a target="_blank" rel="noopener noreferrer" aria-label>`; server component again; optional `imageSrc` is now actually rendered. |
| `Background`/`Silk`: if WebGL is unavailable (or the GPU is blocklisted) three.js throws during render and **the whole page blanks**; `setTimeout` never cleared; animation ignored `prefers-reduced-motion`. | `supportsWebGL()` check, `SilkErrorBoundary` (falls back to the flat colour), timer cleanup, reduced motion → `speed=0` + `frameloop="demand"`. |
| Backend URL hard-coded in three places; `SpotifyCard` pointed at `http://127.0.0.1:8000` (mixed content on https). | `lib/config.ts`: `NEXT_PUBLIC_BACKEND_URL` with the Render URL as default; `backendUrl("/lastfm")`. |
| `"lint": "next lint"` — the command was removed in Next 16, so lint did nothing. | `eslint.config.mjs` (flat config, `eslint-config-next/core-web-vitals` + `/typescript`), `"lint": "eslint ."`, plus `typecheck`, `test`, `format`, `check` scripts. `next dev --turbopack` → `next dev` (Turbopack is the default in 16). |
| `target="_blank"` without `rel`, `I'm` unescaped (fails `react/no-unescaped-entities`), heading order `h1 → h3`, no-op `text-md`/`md:text-md` classes (not a Tailwind utility), missing `metadataBase`/OG/`themeColor`, `/projects` had no title. | All addressed; `layout.tsx` exports `viewport` and `metadata.openGraph`; `/projects` has its own `metadata`. |

New files: `src/lib/{config,api,webgl,theme}.ts`, `src/hooks/usePolling.ts`, 11 Vitest files (50 test cases) under `src/**/__tests__/`, `vitest.config.ts`, `vitest.setup.tsx` (mocks `next/image` and `next/link`, polyfills `matchMedia`), `.env.example`, `.prettierignore`.

### Repo level

- `README.md`: real setup/run/check instructions and an env-var table (was one line).
- `.github/workflows/ci.yml`: frontend (npm ci → lint → typecheck → test → build) and backend (ruff → pytest) on pushes to `master`/`main` and on PRs.
- `.gitignore`: venvs, `.env*.local`, caches, `.vercel`, `.DS_Store`.

## Deliberately left alone (for the design pass)

- `min-w-screen` (100 vw) on both pages + `overflow-x-hidden` on `<body>`: when a scrollbar is visible, content is centred ~4 px right of true centre. `w-full` fixes it; not done because it changes layout.
- The background layering hack: `Background` removes `bg-[#232323]` from `<body>` after 200 ms because the body background otherwise paints over the `z-[-1]` canvas. Works; a cleaner structure is `isolate` on body + `z-0` background + `relative z-10` content.
- Removed `text-md` was a no-op, so nothing changed visually, but the author presumably meant `text-base` on `WarningElement` (desktop) and the "wpm" suffix in the stats card.
- Unused assets in `frontend/public`: `blueskyLogo-icon.svg`, `monkeytype.svg`, `timer-app-example2.png`, `ImageIcon.png`.
- `FrozenRoute` imports `next/dist/shared/lib/app-router-context.shared-runtime` (internal). Standard workaround for AnimatePresence exit animations in the App Router; re-check after Next upgrades.
- Spotify stays unrouted (backend) and un-rendered (frontend); `GithubEvents` + `getGithubEvents()` are ready but not rendered on `/projects`.
- Copy ("rising junior", "interning at Purolator Digital Lab") is content, not code — Andrew's call.
- **Known issue (found 2026-10-09): `/github` always returns `{"events": []}`.** GitHub's Events API no longer includes `commits` in `PushEvent` payloads (only `head`/`before`/`ref`), and `create_github_json()` skips pushes without commits. Fix: build `commit_url` from `payload.head`, look the message up via `GET /repos/{repo}/commits/{sha}` for the first few pushes (bounded and cached), and keep accepting the old payload shape. Not user-visible today because nothing renders the feed.

## First-run watch list (all resolved 2026-10-09)

The first session couldn't run the frontend; this was its list of things to watch. Outcomes:

1. `eslint.config.mjs` imports: **worked as written** with eslint-config-next 16.4.0.
2. React Compiler lint rules (`react-hooks/set-state-in-effect`, `refs`, `purity`, …): **active, and the code passes them** (0 problems).
3. `Silk.tsx` ref cast: **tsc accepts it.**
4. Vitest/jsdom: **no extra polyfills needed**; 61 tests pass (the "50 test cases" count above undercounted).
5. Stale `package-lock.json`: **regenerated and committed.**
6. Dependency ranges: **resolved fine; bumped for security** (see "What the second session changed").
7. Prettier: **run, own commit.**
8. Deploy notes still apply: Render needs no config change (`Procfile` unchanged, `requirements.txt` just lost `flask-cors`); optionally set `CORS_ORIGINS=https://andster.dev,https://www.andster.dev`. Vercel: nothing to change; `NEXT_PUBLIC_BACKEND_URL` is optional. The new frontend accepts both the old and the new backend response shapes, so the two can deploy in either order.

## Design-pass brief (pass 2 — "go all out", separate branch)

**Setup:** `git checkout -b design/visual-refresh fix/audit` after the frontend checks are green. Take *before* screenshots at 390 px and 1280 px (Playwright works headless; WebGL falls back to the flat colour there, which is fine). Keep `npm run check` green — tests assert behaviour and accessibility (roles, names, `aria-current`, link attributes), not class names, except `Background.test.tsx`, which checks `opacity-0/100` + `transition-opacity` and the `bg-[#232323]` body-class dance; update those if the layering changes.

**What exists today:** dark `#232323` base with a three.js "silk" shader (`components/background/Silk.tsx`, tunable: `speed`, `scale`, `color`, `noiseIntensity`, `rotation`); glass cards (`bg-black/25 border border-gray-500/25 rounded-xl shadow-md p-4`); a 3-column grid at `md` inside `w-3xl`; **Home:** profile card (Minecraft avatar `pixierou.png` + GitHub/LinkedIn/resume icons + name/role/location), "andrew/README.md" about card, Last.fm card (album art + now-playing/recently-played), Monkeytype card (avg/best wpm + progress bar to 150 wpm); **Projects:** header card + three `ProjectCard`s (title, one-liner, external-link icon; optional image prop now works); pill nav top-centre with home/projects icons; bottom pill "This site owner is extremely cool."; page transitions = fade + 30 px slide via `motion` (`LayoutTransition.tsx`). System font stack (no `next/font`); icons are grey (`#9ca3af`) SVGs from svgrepo in `/public`; Tailwind 4 with no custom theme tokens (`globals.css` is 5 lines).

**Keep:** both routes and their content, the live widgets, the avatar, the joke pill, dark theme, the silk background idea (retune freely), the per-page `metadata`.

**Open ideas (pick what earns its place):** real typography via `next/font` (display + mono accent for the `andrew/README.md` labels) and a type scale; design tokens in `globals.css` (`@theme`) instead of ad-hoc greys; card hierarchy, hover/press states and `focus-visible` rings (none exist today); honour `prefers-reduced-motion` for page transitions too (`useReducedMotion` is already used by the background and stats card); replace `min-w-screen` with `w-full` and restructure the background layering (`isolate`); mobile polish (nav overlaps the first card at short viewports, cards stack with `mt-20`); projects: tech tags, screenshots, maybe the ready `GithubEvents` feed; `app/not-found.tsx`, `app/opengraph-image.tsx`, `loading.tsx` skeletons for the widgets; consider making the stats bar's goal and copy less "placeholder". Delete unused assets while you're there.
