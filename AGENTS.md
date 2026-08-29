# Base44 Dev Environment

## What this app is
Residential Nexus — a Vite + React 18 + TypeScript SPA (student hostel/PG finder).
Pure frontend: all data lives in `localStorage` via `src/lib/dataService.ts`.
There is **no backend, no database, no API server** — the app runs entirely in demo mode.

## Running it
```
docker compose -f docker-compose.base44.yml up -d
```
- Service `web` uses `node:22-slim`, bind-mounts the repo at `/app`, runs `npm install` then `npm run dev`.
- Vite dev server listens on container port 8080, mapped to host port **3000**.
- `vite.config.ts` sets `allowedHosts: true` so the preview's external hostname is accepted.
- Live reload (HMR) is active — edits appear without a rebuild or `reload_preview`.

## Verifying it works
- `curl -sf http://localhost:3000/` returns the Vite HTML shell.
- `curl -sf -H "Host: external.example" http://localhost:3000/src/main.tsx` returns unhashed source (confirms dev mode, not a prebuilt bundle).

## Credentials (all optional)
The app boots and is fully usable without any secrets. Two optional Vite env vars enhance features:
- `VITE_GOOGLE_MAPS_API_KEY` — map picker on Add Property page (falls back gracefully).
- `VITE_GOOGLE_CLIENT_ID` — "Sign in with Google" (falls back to demo Google login).
Both are delivered via `/run/base44/app.env`; placeholders live in `.env.base44-defaults`.

## Tests
`npm test` (vitest, jsdom) — run inside the container: `docker compose exec web npm test`.
