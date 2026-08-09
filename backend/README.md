# Student Hostel Platform API

This directory contains the production backend for Residential Nexus.

## Current phase

Phase 1 establishes a secure Express API shell. It intentionally does not contain authentication, database access, payments, or AI integrations yet. Those are added incrementally so each layer can be tested before the next one is introduced.

## Requirements

- Node.js 20+
- npm

## Setup

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

## Architecture direction

```text
React frontend
      |
      | HTTPS / REST
      v
Express API
      |
      +-- authentication & authorization
      +-- validation
      +-- business services
      +-- database repositories
      +-- external integrations
```

No secrets should be committed to Git. Use `.env` locally and configure secrets through the hosting provider in production.
