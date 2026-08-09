# Residential Nexus — Smart Room Search

AI-powered student hostel & PG finder platform with a full owner management dashboard and home food delivery.

## Project status

The frontend started as a localStorage/demo application. The production migration is now being implemented incrementally on the `feature/production-mvp-foundation` branch so the existing UI is preserved while real backend capabilities are introduced and tested one layer at a time.

### Migration roadmap

- [x] Phase 1 — Express API foundation, environment validation, security headers, CORS, health endpoint
- [ ] Phase 2 — Database schema and persistence
- [ ] Phase 3 — Authentication and Student/Owner/Admin authorization
- [ ] Phase 4 — Real property, room, tenant and booking APIs
- [ ] Phase 5 — Payments, bills and receipts
- [ ] Phase 6 — Property verification, reviews and moderation
- [ ] Phase 7 — AI search/recommendation integrations
- [ ] Phase 8 — Production testing, deployment and security hardening

## Features

### For Students
- 🔍 **Smart Search** — Search hostels by text (name, location, amenities, tags) and price range
- 🖼️ **Image-Based Discovery** — Upload a room photo to find similar hostels
- 📋 **Hostel Detail** — View facilities, house rules, reviews, and AI-generated recommendations
- 📅 **Book / Schedule Visit** — Send booking requests or schedule property visits directly
- 💳 **Rent Tracking** — View monthly rent history, pay via UPI, download receipts
- 🍽️ **Home Food Delivery** — Order home-cooked meals from local cooks delivered to your room
- 👤 **Full Profile** — Personal info, education, guardian contacts, medical details, identity docs

### For Property Owners
- 🏠 **Multi-Property Dashboard** — Overview of all properties with occupancy & revenue stats
- 📊 **Per-Property Management**
  - Dashboard with real-time stats
  - Rooms management (add, view, status tracking)
  - Tenant management with payment history & receipt download
  - Booking & visit requests with room allocation workflow (3-step multi-form)
  - Payment accounts (UPI + bank) management
  - Bills & charges (electricity, water, maintenance, etc.)
  - Edit property details
- ➕ **Add New Property** — Full form with Google Maps pin drop, amenity selection, image upload
- 👤 **Owner Profile** — Personal, business, identity document management

### General
- 🌙 **Dark / Light Mode** toggle
- 🔐 **Auth** — Student & Owner login/signup with role-based protected routes
- 📱 **Fully Responsive** — Works on mobile, tablet, and desktop

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Animations**: Framer Motion
- **Routing**: React Router v6
- **State**: React hooks + localStorage during migration
- **Maps**: Google Maps API (`@react-google-maps/api`)
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod
- **Backend**: Node.js + Express + TypeScript
- **Validation**: Zod
- **Security middleware**: Helmet + CORS

## Getting Started

### Frontend

Requirements: Node.js 18+ or Bun.

```bash
npm install
cp .env.example .env
npm run dev
```

### Backend

Requirements: Node.js 20+.

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Health check:

```text
GET http://localhost:3000/api/v1/health
```

The frontend should use the backend base URL through `VITE_API_URL` once API migration begins.

## Environment Variables

### Frontend

| Variable | Required | Description |
|---|---|---|
| `VITE_GOOGLE_MAPS_API_KEY` | Yes for maps | Google Maps JavaScript API key |
| `VITE_API_URL` | No | Backend API URL |
| `VITE_AI_SERVICE_URL` | No | AI service URL when AI integration is enabled |

### Backend

See [`backend/.env.example`](backend/.env.example). Secrets must not be committed to Git.

## Production architecture

```text
React + TypeScript
        |
        | REST / HTTPS
        v
Node.js + Express API
        |
        +-- Authentication & authorization
        +-- Request validation
        +-- Business services
        +-- Database repositories
        +-- Payments / webhooks
        +-- AI integrations
        |
        v
     Database
```

## Project Structure

```text
src/                         # Existing React frontend
├── components/
├── data/
├── hooks/
├── lib/
└── pages/

backend/                     # Production API (migration in progress)
├── src/
│   ├── config/
│   │   └── env.ts
│   ├── app.ts
│   └── server.ts
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

## Demo mode

The existing frontend demo mode remains available while migration is in progress. It will be retired feature-by-feature only after the corresponding backend functionality has been implemented and tested.
