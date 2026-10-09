# andster.dev

My personal website, live at [andster.dev](https://andster.dev).

- **`frontend/`** — Next.js 16 (App Router, React 19, Tailwind CSS 4, three.js background). Deployed on Vercel.
- **`backend/`** — small Flask API that feeds the live widgets (Last.fm "now playing", Monkeytype typing stats, GitHub activity). Deployed on Render.

## Running it locally

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt
cp .env.example .env                                 # then fill in the API keys
flask --app src.app run                              # http://127.0.0.1:5000
```

Routes: `GET /` (health check), `GET /nowplaying` (Spotify if configured, else Last.fm), `GET /lastfm`, `GET /monkeytype`, `GET /github`.
Each answers JSON, or a JSON `{"error": ...}` with HTTP 502 when the upstream service is unavailable.
Responses are cached in memory (Last.fm 15 s, GitHub 5 min, Monkeytype 1 h) so visitors don't translate 1:1 into upstream API calls.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local        # optional: point NEXT_PUBLIC_BACKEND_URL at your local backend
npm run dev                       # http://localhost:3000
```

Without `.env.local` the frontend talks to the deployed Render backend.

## Checks

Both halves are checked by GitHub Actions on every push and pull request (`.github/workflows/ci.yml`).

```bash
# frontend
cd frontend
npm run lint        # ESLint (eslint-config-next)
npm run typecheck   # tsc --noEmit
npm test            # Vitest + Testing Library
npm run build

# backend
cd backend
ruff check .
pytest
```

## Environment variables

| Where | Variable | Purpose |
| --- | --- | --- |
| backend | `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN` | Optional. Now playing / last played straight from Spotify, with a direct link to the track. Get the refresh token with `python scripts/spotify_auth.py` (instructions at the top of that file); it expires every six months. |
| backend | `LASTFM_API_KEY`, `LASTFM_USERNAME` | Last.fm recent tracks (the fallback for `/nowplaying`) |
| backend | `APE_KEY` | Monkeytype ApeKey (results + personal bests) |
| backend | `GITHUB_API_KEY`, `GITHUB_USERNAME` | GitHub public events (token optional, raises the rate limit) |
| backend | `CORS_ORIGINS` | `*` (default) or a comma-separated allow-list of origins |
| frontend | `NEXT_PUBLIC_BACKEND_URL` | Backend base URL (defaults to the Render deployment) |

See `backend/.env.example` and `frontend/.env.example`.
