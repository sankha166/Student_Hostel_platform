# Student Hostel Platform API

Production-oriented REST API for Residential Nexus / Student Hostel Platform.

## Run locally

1. Create PostgreSQL database `student_hostel`.
2. Copy `.env.example` to `.env` and set `DATABASE_URL` and a strong `JWT_SECRET`.
3. Apply `src/db/schema.sql` to PostgreSQL.
4. From `backend/`, run `npm install`.
5. Run `npm run typecheck`.
6. Run `npm run dev`.

Health: `GET http://localhost:3000/api/v1/health`

## Implemented API

- Authentication: register/login
- Authenticated profile read/update
- Property search, creation and update
- Room creation/listing
- Student booking creation/listing
- Owner/admin booking workflow
- Verified-stay reviews
- Persistent payment records with an explicit gateway-verification boundary
- Admin dashboard and property moderation

## Not falsely marked as production-ready

Real payment gateway settlement/webhooks, OTP/email delivery, Google OAuth, AI vision/image search and external identity verification require provider accounts, credentials and production webhook configuration. The code leaves explicit integration boundaries for those services rather than simulating successful verification.

No secrets should be committed to Git. Use `.env` locally and hosting-provider secret storage in production.
