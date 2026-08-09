# Residential Nexus — Smart Room Search

AI-ready student hostel & PG marketplace with student discovery, owner property management and an extensible student-living ecosystem.

## Production migration status

The original frontend was a localStorage/demo application. The migration is being implemented on `feature/production-mvp-foundation` while preserving the existing UI.

- [x] Phase 1 — Express API foundation, environment validation, security headers, CORS, health endpoint
- [x] Phase 2 — PostgreSQL schema, connection layer and persistent domain model
- [x] Phase 3 — JWT authentication, password hashing and Student/Owner/Admin authorization
- [x] Phase 4 — Real property, room and booking APIs; frontend API layer migrated to backend
- [x] Phase 5 — Persistent payment records and payment-gateway integration boundary
- [x] Phase 6 — Property verification, reviews, ratings and admin moderation
- [x] Phase 7 — AI integration boundaries for recommendations, natural-language search and image search
- [x] Phase 8 — CI workflow, environment documentation and production hardening baseline

**Important:** external payment settlement, OTP/email delivery, Google OAuth, AI vision and identity verification cannot be truthfully marked live without provider credentials and webhook configuration. The platform now has explicit integration boundaries instead of simulated success responses.

## Core product

### Students
- Hostel/PG discovery and search
- Property details, rooms and reviews
- Booking / visit requests
- Rent and payment history
- Profile management
- Future AI recommendations and image search

### Owners
- Multi-property management
- Room management
- Booking workflow
- Tenant management foundation
- Property verification workflow
- Revenue/payment foundation

### Admin
- User/property oversight
- Property approval, rejection and suspension
- Platform dashboard
- Moderation foundation

## Stack

- Frontend: React 18 + TypeScript + Vite
- UI: Tailwind CSS + shadcn/ui
- Backend: Node.js + Express + TypeScript
- Database: PostgreSQL
- Auth: bcrypt + JWT
- Validation: Zod
- Maps: Google Maps API
- Testing/CI: Vitest, Playwright and GitHub Actions

## Run locally

### Frontend

```bash
npm install
cp .env.example .env
npm run dev
```

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Create PostgreSQL database and apply backend/src/db/schema.sql
npm run typecheck
npm run build
npm run dev
```

Backend health endpoint:

`GET http://localhost:3000/api/v1/health`

## Environment

Frontend: `VITE_API_URL`, `VITE_GOOGLE_MAPS_API_KEY` and optional AI service configuration.

Backend: see `backend/.env.example`. Never commit secrets.

## Architecture

```text
React + TypeScript
       |
       | REST / HTTPS
       v
Node.js + Express
       |
       +-- JWT authentication / authorization
       +-- Zod validation
       +-- Property / room / booking services
       +-- Reviews / moderation
       +-- Payment records + webhook boundary
       +-- AI integration boundary
       |
       v
   PostgreSQL
```

## Branch

Production migration work is isolated in:

`feature/production-mvp-foundation`

The `main` branch has not been changed by this migration work.
