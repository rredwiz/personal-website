# Handoff: audit + fix pass (branch `fix/audit`)

_Written 2026-10-09 by the agent that did the audit; updated the same day by the session that ran the checks on Andrew's Mac. Read this before continuing._

## Status at a glance

| Area | State |
| --- | --- |
| Branch | `fix/audit`, on top of `master` (`94678a5`); `git log --oneline master..fix/audit` lists the commits. **Not pushed**, and Andrew asked that nothing go to `master` yet. |
| Backend (`backend/`) | **Verified.** `ruff check .`, `ruff format --check .` and 56 pytest tests pass (Python 3.14 locally; CI uses 3.13). The second session fixed one `ruff` failure (missing newline in `src/apis/__init__.py`) that would have failed CI. |
| Frontend (`frontend/`) | **Verified.** Clean `npm ci` (npm 10.9.8, as in CI) → `lint` (0 problems, 37 files, React Compiler rules active) → `typecheck` (also with no `.next/`, as in CI) → `test` (61 tests) → `build` all pass on Next 16.4.0. |
| Visual parity | **Verified in a browser** against a `master` build: home and projects at 1024×768 and 390×844 match element-for-element (bounding boxes, font sizes, colours). Only differences: the intended nav underline (makes the nav pill 1 px taller), the `/projects` tab title, and the fixed body-overflow bug (`master` leaves inline `overflow: auto` on `<body>` after one navigation). No console errors. |
| Design pass | **Done, awaiting Andrew's review** on `design/visual-refresh` (rebased onto the latest `fix/audit`). See "Design pass" at the bottom. |
| Vim theme | `design/vim`, built on `design/visual-refresh` at Andrew's request ("Vim themed", smoother font). Awaiting his review; see "Vim theme" at the bottom. |

## What the second session changed

- **Lockfile regenerated** (CI's `npm ci` would have failed on the stale one). Every runtime dependency stays at the version `master` ships except Next.js.
- **next 16.1.1 → 16.4.0** (and `eslint-config-next` to match): `npm audit` reported critical advisories for `next <=16.3.7` (RSC DoS, cache poisoning, middleware bypass, image-optimizer SSRF/RCE) plus the bundled `sharp`/`postcss`.
- **vitest 3.2 → 4.1.11, @vitejs/plugin-react 4 → 5.2**: vitest 3 pulls in `tinypool <2.1.2` (critical) and `@vitest/mocker <4.1.11`. No test changes were needed. `vitest.config.ts` → `.mts` (Vite 8 warns about ESM in a CJS-loaded config); `tsconfig.json` includes `**/*.mts`.
- `npm audit fix` for transitive `tar`, `fflate`, `postcss`, `sharp`. **Remaining:** `braces <=3.0.3` via `eslint-config-next → fast-glob` (lint-time only; npm's only "fix" is downgrading to eslint-config-next 14). **ESLint stays on 9**: `eslint-plugin-react` (bundled by eslint-config-next) doesn't support ESLint 10 yet.
- **Prettier run** in its own commit (house style = `master`'s: 4-space, 80 columns). JSON stays 2-space; `tsconfig.json`/`next-env.d.ts` are left to Next.js.
- **Hydration fix for reduced-motion visitors:** `MonkeyTypeStatsCard` rendered `reducedMotion ? target : animated` on the first render. The server can't know the visitor's preference, so anyone with *prefers-reduced-motion* got "Hydration failed because the server rendered text didn't match the client" (reproduced in Chrome with the preference emulated). The first render is now always 0 and the count-up runs after mount (one step for reduced motion). A `renderToString` test compares the markup under both preferences and fails on the old code.
- **`next-env.d.ts` is no longer tracked:** Next 16 writes it differently for `next dev` (`.next/dev/types/...`) and `next build` (`.next/types/...`), so it flipped in every working tree. It's gitignored, as create-next-app does, and `npm run typecheck` is now `next typegen && tsc --noEmit`, which regenerates it plus the route types (including Next's route validator). Tested from a clean checkout.
- **npm gotcha:** npm 10.9.8 crashes (`Cannot read properties of null (reading 'edgesOut')` in Arborist `#loadPeerSet`) when *adding or upgrading* vitest 4 in this tree. If that happens, run the install with `npx npm@11 install ...`; the resulting lockfile (v3) works with npm 10's `npm ci`, which was verified.

## Now playing: why it froze, and the Spotify option (2026-10-09)

**Why the card stopped changing:** the backend was fine. It returns Last.fm's latest scrobble, and Last.fm hasn't received one since **24 Jul 2026, 02:06** ("Eyes Wide Shut" by Fineart; the profile shows no listening in the last 7 days). On 18 Jun 2026 Spotify announced that refresh tokens expire six months after the original authorization (refreshing doesn't extend them), effective for existing apps on **20 Jul 2026**. Last.fm's "Spotify Scrobbling" link is such an authorization, and the scrobbles stop four days after that date. **Fix (Andrew):** on last.fm → Settings → Applications, disconnect Spotify Scrobbling and connect it again, then play a new song. Expect to redo it every six months.

**What changed in code**
- `GET /nowplaying` (new): Spotify when `SPOTIFY_CLIENT_ID`/`SECRET`/`REFRESH_TOKEN` are set and Spotify answers; otherwise Last.fm. The response shape is the same either way, plus `played_at` (ISO time; `null` while playing) and `source` (`spotify`/`lastfm`). `GET /lastfm` stays for already-deployed frontends.
- `src/apis/spotify.py` is real now: currently-playing first, then recently-played; a 20 s cache (dev-mode apps share one quota); `invalid_grant` logs a "run scripts/spotify_auth.py" error and backs off 15 min instead of retrying.
- `backend/scripts/spotify_auth.py`: one-time Authorization Code flow on `http://127.0.0.1:8888/callback` that prints the refresh token and its approximate expiry.
- Frontend: `fetchRecentTrack` calls `/nowplaying` and falls back to `/lastfm` on a 404 (old backend), so Vercel and Render can deploy in either order. `songLink()` gives the direct Spotify track URL when Spotify supplied the data, and a Spotify search URL otherwise.

**Spotify vs Last.fm**

| | Spotify Web API | Last.fm |
| --- | --- | --- |
| Link to the song | Direct track URL (`open.spotify.com/track/...`) | Last.fm page, or a Spotify *search* link |
| Freshness | Real time, including pause state | After the scrobble posts; "now playing" usually works |
| Setup | Developer app + one-time OAuth (`scripts/spotify_auth.py`) | API key only |
| Ongoing upkeep | Re-authorize every 6 months (Spotify's 2026 rule) | Reconnect Spotify Scrobbling every 6 months (same rule, but it fails silently) |
| Requirements | App owner needs Spotify **Premium** (Development Mode, Feb 2026) | None |
| Sources | Spotify only | Anything that scrobbles |

Recommendation: set up Spotify (direct links, real time, and a loud log line when it lapses) and keep Last.fm as the automatic fallback. Steps are at the top of `backend/scripts/spotify_auth.py`; the README's env table lists the variables.

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

## Design pass (branch `design/visual-refresh`)

Same routes, copy, widgets and data as `fix/audit`; new presentation. lint, typecheck, 72 tests and `next build` pass. Not pushed.

**Direction:** a dark "developer desk", strictly monochrome. Every colour is one cool slate hue (oklch h≈255) at very low chroma, varying only in lightness; emphasis comes from brightness (the name is white, the rest of the greeting soft grey), and a pale steel tint of the same hue (`#c4d2e5`) marks focus rings, the progress bar and hovers. The silk shader alone is the background (no glow, no vignette); cards are flat glass over it, with file-viewer header bars on the README cards and monospace metadata labels. The only colour on the page comes from content: the avatar and the album art. *History:* the first version used a warm copper accent, a glow behind the nav, a vignette, an album-art tint and Spotify green; Andrew felt it read as AI-branded and asked for a different undertone and a more monochromatic scheme, so all of that was removed.

**What changed**
- **Type:** Geist (UI), Geist Mono (labels, numbers), Bricolage Grotesque with its optical-size axis (names, headings), all via `next/font`.
- **Tokens** in `globals.css` (`@theme`): `canvas`, `surface`, `line`/`line-strong`, an ink scale (`ink`, `ink-soft`, `ink-muted`, `ink-faint`), `accent`, `shadow-card`, all from the slate hue. Text tiers pass WCAG AA on the cards (`ink-faint` is the lowest, ~5:1). Components use these instead of ad-hoc greys. `:focus-visible` rings everywhere.
- **Shared pieces:** `components/ui/Card.tsx` (`Card`, `CardFileBar`, `CardLabel`), `components/ui/ExternalLink.tsx`, `components/Avatar.tsx`, `components/icons.tsx` (Lucide geometry for UI glyphs, Simple Icons brand marks), `lib/cx.ts`.
- **Layout:** nav, page and footer are in normal flow (sticky nav pill, footer pill), so nothing overlaps at short heights; content is `w-full max-w-4xl` (the `min-w-screen` off-centre bug is gone); the background is a fixed layer under an `isolate` body (the 200 ms body-class hack is gone); there's a skip link.
- **Home:** profile card with the 16×16 sprite drawn at exactly 5× with nearest-neighbour scaling (crisp; served `unoptimized`); README card with a `#` heading; Last.fm card with fixed-size art (no layout shift), a skeleton while loading, a monochrome equalizer when playing, and a link to Last.fm when the backend sends `url`; Monkeytype card showing **only the best score** (15s mode), with the bar measuring it against a **200 wpm** goal (Andrew's call; the average is no longer shown).
- **Projects:** whole-card links (stretched `::after`; the focus ring outlines the card), repo slug, hover lift, and tags taken from each repo's real stack. The MC Instance Bot link is now `github.com/rredwiz/alt-manager` (the repo was renamed; the old URL redirects).
- **New pages/files:** `app/not-found.tsx`; `app/opengraph-image.tsx` (1200×630 social card rendered at build; it fetches the two fonts from Google Fonts and falls back to the default font when offline rather than failing the build).
- **Motion:** cards rise in with a short stagger (CSS only); 12 px page fade; the nav pill slides between routes. All of it is off or instant with `prefers-reduced-motion`.
- **Microcopy** that changed (everything else is verbatim): "Recently Listened to on Spotify" → "Last played on Spotify", "Currently listening…" → "Now playing on Spotify", the Monkeytype card is now "161.69 wpm best … 81% of goal … 200 wpm" (was average + best, "75.5% to 150wpm"), nav items show "Home"/"Projects" labels, and "and things I've built" now also shows on mobile.
- **Assets:** removed 11 files nothing referenced. Kept `timer-app-example2.png`, a real screenshot of the timer app (`ProjectCard` takes `imageSrc`/`imageAlt` if you want it on that card; it was left off to keep the three cards uniform).

**Verified:** 1280×800, 1024×560 and 390×844 on home, projects and the 404; keyboard focus (rings, card links, skip link); hover states; reduced motion (no hydration errors, bar still fills); no console errors; the OG image renders.

**Open / ideas not done**
- GitHub activity feed stays unrendered until the backend issue above is fixed (otherwise it would always be empty).
- Possible follow-ups: project screenshots for all three cards, a "currently working on" line, a light theme, a cursor spotlight on cards.

## Vim theme (branch `design/vim`)

Andrew liked the monochrome refresh and asked for a Vim-themed iteration with a smoother font. Same content, data and widgets; all checks pass (117 frontend tests).

- **Font:** JetBrains Mono for everything (headings, text, labels, numbers), via `next/font`. Chosen from a side-by-side render of nine options (Bricolage, Geist Mono, IBM Plex Mono, DM Mono, Fira Code, Red Hat Mono, Spline Sans Mono, Martian Mono, Recursive): it was the smoothest, it's an editor font, and it stays readable at paragraph size. The three font roles in `globals.css` still exist, so headings can diverge later.
- **Tabline** (`navigation/Nav.tsx`): `1 home.md  2 projects.md`, the active tab in reverse video sliding between tabs. Visible numbers and extensions are `aria-hidden`, so the links are still named "home" and "projects".
- **Statusline + command line** (`vim/StatusLine.tsx`, docked at the bottom, sticky from `md` up): mode (`NORMAL`/`COMMAND`), buffer (`~/home.md`, or `~/nope [New]` on a 404), filetype, a `keys:on/off` toggle, and Vim's ruler (`All`/`Top`/`Bot`/`42%`). The command line's resting message is "This site owner is extremely cool." (the old footer pill).
- **Keys:** `j`/`k` scroll, `gg`/`G` top/bottom, `gt`/`gT` cycle tabs, `:` opens the command line, `?` help, `Esc` closes. Commands (`vim/commands.ts`, pure and tested): `:home`, `:projects`, `:e`/`:tabe <file>`, `:tabn`/`:tabp`/`:tabfirst`/`:tablast`, `:github`, `:linkedin`, `:resume`, `:monkeytype`, `:help`, `:set nokeys`/`:set keys`, plus Vim-flavoured errors (`:q` gets E37, unknown commands get E492, `:e nope` gets E484). Keys are ignored in text fields and with Cmd/Ctrl/Alt, so browser and screen-reader shortcuts are untouched. They can be switched off from the statusline or the help panel (remembered in localStorage), which is what WCAG 2.1.4 asks of single-character shortcuts. The `:` and `?` chips make both reachable by mouse and touch.
- **Buffers** (`vim/Buffer.tsx`): the README cards render as `:set number wrap` buffers (line-number gutter, `#` heading markers) with `~` filler that only appears in spare space. Never makes a card taller.
- **Details:** blinking block cursor after "Andrew." (steady with reduced motion), window bars show the filetype and light up on hover like Vim's active window, cards use a tighter radius, the 404 says `E484: Can't open file ~/<path>`, and the OG image uses JetBrains Mono.
- **Verified** with real key events in Chrome (17 scripted checks: help, every command path, tab cycling, j/G/gg with the ruler, the keys toggle and its persistence), at 1280×800 and 390×844, with reduced motion (no hydration errors) and on the 404.

