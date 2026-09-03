# Base44 Dev Environment

## What this app is
Residential Nexus — a full-stack B2B SaaS for managed accommodation providers.
- **Backend**: Node.js + Express + Prisma + PostgreSQL (in `server/`), JWT auth, RBAC, REST API.
- **Frontend**: Vite + React 18 + TypeScript SPA. Talks to the backend via a Vite proxy (`/api` → API service).

## Architecture
The doc spec (`3d7752152_...docx`) defines a multi-tenant model: Account → Properties → Buildings → Floors → Rooms → Beds → Residents → Stays/Payments/Complaints. The backend implements all of this with Prisma; the frontend consumes it.

### Services (docker-compose.base44.yml)
- `db` — PostgreSQL 15-alpine, healthchecked, volume `postgres_data`.
- `api` — `node:22` (NOT slim — Prisma schema engine needs OpenSSL), bind-mounts repo, runs `npm install && prisma generate && prisma db push && seed && dev` (tsx watch). Port 8000.
- `web` — `node:22-slim`, bind-mounts repo, runs `npm install && vite dev`. Port 8080 → host 3000. Vite proxy `/api` → `http://api:8000`.

### Why `node:22` (not slim) for the API
Prisma's schema/query engine needs OpenSSL. `node:22-slim` is missing it and `prisma db push` fails with "Schema engine error". The full `node:22` image includes it.

## Running it
```
docker compose -f docker-compose.base44.yml up -d
```
All three services start with healthchecks. The API auto-migrates (`prisma db push`) and seeds on every boot (idempotent — upserts + existence checks).

## Demo credentials
- **Owner**: `owner@nexus.demo` / `demo123456`
- **Resident**: `student@nexus.demo` / `demo123456`

## Verifying it works
- `curl -sf -H "Host: external.example" http://localhost:3000/` returns the Vite HTML shell.
- `curl -sf http://localhost:8000/api/health` returns `{"status":"ok"}`.
- `curl -sf -X POST http://localhost:8000/api/auth/login -H 'Content-Type: application/json' -d '{"email":"owner@nexus.demo","password":"demo123456"}'` returns a JWT token.
- Login via the preview → redirects to `/owner` (owner) or `/student` (resident).

## Frontend structure
- `src/lib/apiClient.ts` — fetch wrapper with JWT, all calls go through `/api` (Vite proxy).
- `src/lib/nexus.ts` — typed API functions grouped by module (auth, dashboard, properties, inventory, residents, stays, payments, complaints, residentPortal).
- `src/contexts/AuthContext.tsx` — JWT-based auth (login/register/store token).
- Operator pages: `OwnerMainDashboard`, `propertyDashboard` (tabs: Inventory, Residents, Payments, Complaints), `AddProperty`.
- Resident pages: `StudentDashboard` (portal), `RentPage`, `StudentProfile`, `ResidentComplaints`.
- `src/components/operator/` — tab components for the property dashboard.

## Backend structure (server/)
- `prisma/schema.prisma` — full multi-tenant schema matching the doc.
- `src/index.ts` — Express app, all route mounting.
- `src/lib/auth.ts` — JWT signing/verification, bcrypt hashing, RBAC permission matrix, auth middleware.
- `src/routes/` — auth, properties, inventory (buildings/floors/rooms/beds), residents, stays (allocation/check-out/transfer), payments (ledger/generate-rent), complaints (SLA tracking), dashboard, residentPortal.
- `src/seed.ts` — seeds demo account, 2 properties with full hierarchy, 5 residents, payments, complaints.

## Secrets
- `JWT_SECRET` — optional (defaults to dev secret). Set via dashboard for production.
- `VITE_GOOGLE_MAPS_API_KEY`, `VITE_GOOGLE_CLIENT_ID` — optional UI enhancements.
- Local DB credentials are generated inline in compose (not secrets).

## Notes
- The old localStorage-based `src/lib/dataService.ts` and `src/lib/api.ts` still exist for the legacy hostel search feature (FoodDelivery, mockData). New pages use `src/lib/nexus.ts` + backend.
- `prisma db push --accept-data-loss` runs on every boot — safe for dev, reset DB volume for a clean slate.
