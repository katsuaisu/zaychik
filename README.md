# Zaychik — GWA Calculator + Flashcards

A study app for students: compute your GWA quarter by quarter, and review your subjects with
playful flashcard decks (classic, fill-in-the-blanks, matching and ordering cards).

## Features

- **GWA calculator** — 10 default subjects seeded per account, Q1–Q4 tabs, final / previous /
  tentative grades, unit weighting and a live weighted average.
- **Flashcard decks** — colour-coded decks, four card types, a deck editor and a quiz runner with
  progress bar, XP, hearts and mastery status.
- **Progress** — per-deck mastered / learning / forgotten breakdown, total XP, cards studied and a
  day streak.
- **Public decks** — browse decks other students shared and copy one (with all of its cards) into
  your own library.
- **Auth** — email + password and Google sign-in.

## Tech stack

- React 19 + TypeScript
- TanStack Start v1 (SSR / server functions) and TanStack Router file-based routing
- TanStack Query for data fetching and cache invalidation
- Tailwind CSS v4 (design tokens in `src/styles.css`) + shadcn/ui primitives
- Vite 7 build, deployed to an edge (Cloudflare Workers-style) runtime
- Supabase (via Lovable Cloud) for Postgres, row-level security and auth
- `sonner` for toasts, `lucide-react` for icons

## Project layout

```
src/
  components/        AppShell, DeckCard/DeckGrid, dialogs, study/ card components
  hooks/             useAuth
  integrations/      generated Supabase + Lovable auth clients (do not edit by hand)
  lib/               gwa.ts, queries.ts, deck-colors.ts, sounds.ts, card-data.ts
  routes/            file-based routes (index, auth, _authenticated/*)
  styles.css         design tokens, utilities and animations
supabase/migrations/ database schema, RLS policies and the new-user trigger
```

## Environment variables

These are read by the code and live in `.env` (created automatically when the backend is connected).
Client variables are exposed to the browser; server variables are only read inside server code.

| Variable | Used by | Purpose |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | browser client | Backend API URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | browser client | Public (anon) API key |
| `VITE_SUPABASE_PROJECT_ID` | browser client | Backend project reference |
| `SUPABASE_URL` | server | Backend API URL for server-side calls |
| `SUPABASE_PUBLISHABLE_KEY` | server | Public key for server-side calls |
| `SUPABASE_SERVICE_ROLE_KEY` | server (admin client) | Privileged access; never expose to the browser |

Google sign-in uses the managed OAuth broker in `@lovable.dev/cloud-auth-js`
(`src/integrations/lovable`), so no Google client ID or secret is needed in this repo. If you bring
your own Google credentials, configure them on the auth provider, not in code.

## Getting started

Requires Node.js 20+ (or Bun).

```sh
git clone <this-repository-url>
cd <repository-name>
npm install          # or: bun install
```

Make sure `.env` contains the variables above (they are provisioned for you in Lovable; copy them
across when running locally).

### Run the dev server

```sh
npm run dev          # http://localhost:8080
```

### Build for production

```sh
npm run build        # production build
npm run preview      # serve the production build locally
```

Other scripts: `npm run lint` (ESLint) and `npm run format` (Prettier).

## Database

The schema lives in `supabase/migrations/`: `profiles`, `subjects`, `quarter_grades`, `decks`,
`cards` and `study_results`. Every table has row-level security so a user only sees their own rows,
plus read policies that expose decks (and their cards) flagged `is_public`. A trigger on new sign-ups
creates the profile and seeds the 10 starter subjects.
