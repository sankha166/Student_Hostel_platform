# Residential Nexus — Smart Room Search

AI-powered student hostel & PG finder platform with a full owner management dashboard and home food delivery.

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
- **State**: React hooks + localStorage (demo mode)
- **Maps**: Google Maps API (`@react-google-maps/api`)
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod

## Getting Started

### Prerequisites
- Node.js 18+ or Bun
- Google Maps API key

### Setup

```bash
# Install dependencies
npm install

# Copy env file
cp .env.example .env

# Fill in your Google Maps API key
VITE_GOOGLE_MAPS_API_KEY=your_key_here

# Start dev server
npm run dev
```

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_GOOGLE_MAPS_API_KEY` | Yes (for maps) | Google Maps JavaScript API key |
| `VITE_API_URL` | No | Backend API URL (defaults to localhost:3000) |
| `VITE_AI_SERVICE_URL` | No | AI service URL (defaults to localhost:5000) |

## Build for Production

```bash
npm run build
# Output is in dist/
```

## Deploy to Netlify

1. Push to GitHub
2. Connect repo in Netlify dashboard
3. Set build command: `npm run build`
4. Set publish directory: `dist`
5. Add environment variables in Netlify settings
6. Deploy!

The `netlify.toml` is already configured for SPA routing.

## Demo Mode

The app ships with full mock data and works completely offline without a backend. Authentication stores session in `localStorage`. All CRUD operations update local state (no persistence between refreshes for demo).

## Project Structure

```
src/
├── components/       # Shared UI components
│   ├── landing/      # Landing page sections
│   └── ui/           # shadcn/ui primitives
├── data/             # Mock data (hostels, owners, food, bills)
├── hooks/            # useAuth, useMobile, useToast
├── lib/              # api.ts, constants.ts, utils.ts
└── pages/            # Route-level page components
    ├── Index.tsx           # Landing page
    ├── AuthPage.tsx        # Login/Signup
    ├── StudentDashboard.tsx
    ├── HostelDetail.tsx
    ├── RentPage.tsx
    ├── StudentProfile.tsx
    ├── OwnerMainDashboard.tsx
    ├── propertyDashboard.tsx
    ├── AddProperty.tsx
    ├── OwnerProfile.tsx
    └── FoodDelivery.tsx
```


