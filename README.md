# Residential Nexus — Smart Room Search

Production-oriented student hostel / PG marketplace with student discovery, owner property management, bookings, rent tracking, food delivery, maps and responsive dashboards.

## Architecture

- **Frontend:** React 18 + TypeScript + Vite + Tailwind + shadcn/ui
- **Production API:** Node.js + Express
- **Database:** PostgreSQL
- **Authentication:** bcrypt password hashing + JWT access tokens
- **Maps:** Google Maps API
- **Deployment:** frontend can run on Netlify/Vercel; backend can run on Railway/Render/Fly.io or any Node host; PostgreSQL can run on Railway, Supabase, Neon, Render or another managed PostgreSQL provider.

## Current production foundation

The `work-sankha` branch introduces a real backend boundary instead of treating localStorage as a server. The backend includes:

- secure password hashing
- JWT authentication and `/api/auth/me`
- PostgreSQL schema with users, student profiles, properties, rooms, bookings and payments
- public hostel/property discovery APIs
- owner property creation and listing APIs
- authenticated student booking creation
- authenticated owner/student booking status workflow
- health endpoint for deployment checks
- Helmet, CORS configuration and JSON limits
- environment templates with no secrets committed

## Local development

### Frontend

```bash
npm install
cp .env.example .env
npm run dev
```

Set `VITE_API_URL` to the backend URL.

### Backend

```bash
cd backend
npm install
cp .env.example .env
```

Create a PostgreSQL database and run `backend/sql/schema.sql`, then configure:

- `DATABASE_URL`
- `JWT_SECRET` — use a long random secret in production
- `CORS_ORIGIN` — the exact frontend origin(s)
- `PORT` — supplied by the hosting provider when available

Start the API:

```bash
npm start
```

Health check: `GET /health`

## Important production rule

The repository still contains legacy demo/localStorage modules used by parts of the existing UI. They are retained while the UI is migrated to the production API so existing screens do not break unexpectedly. **Do not treat localStorage accounts, mock listings, demo payment verification or demo Google login as production functionality.** The production release should use the backend for every authenticated and business-critical operation.

## Release checklist

1. Create the PostgreSQL database and apply `backend/sql/schema.sql`.
2. Deploy the backend and verify `/health` reports `database: "ok"`.
3. Configure frontend `VITE_API_URL` to the deployed API.
4. Migrate remaining local data services (hostels, rooms, tenants, rent, food, profiles and payments) to API endpoints.
5. Add real payment-provider server verification before enabling rent payments.
6. Add object storage for identity/property images; never store sensitive documents as localStorage data.
7. Configure Google OAuth with a real client ID and server-side token validation if Google login is enabled.
8. Add rate limiting, request validation, audit logging, backups and monitoring before public launch.
9. Run browser/mobile regression tests against a staging database.
10. Only then merge `work-sankha` into `main` and release.

## Branch

All production work for this pass is isolated in **`work-sankha`**. `main` is untouched.
