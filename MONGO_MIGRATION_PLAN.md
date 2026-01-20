## MongoDB Migration Plan – Polaris Clubs Manager

This document tracks the migration from **Supabase/Postgres** to **MongoDB + Mongoose + Pusher**.

### Tech Targets

- **Database**: MongoDB Atlas  
  - URI: `MONGODB_URI` (set in environment)  
  - DB name: `Atlas-Club-Manager`
- **ODM**: Mongoose
- **Realtime**: Pusher Channels (for notifications + messaging)

### Phases & Status

- [x] **Planning**
  - Map current Supabase schema and data flows (reservations, spaces, clubs, users, notifications, messages, online_status).
  - Decide on MongoDB + Mongoose + Pusher stack.
- [x] **Phase 1 – Mongo/Mongoose Foundation**
  - [x] Add Mongoose dependency and connection helper (`lib/mongodb.ts`).
  - [x] Define Mongoose models for: `User`, `Club`, `Space`, `Reservation`, `Notification`, `Message`, `OnlineStatus`.
  - [x] Verify basic connection + simple test query in a dev-only route/script (`/api/health/mongo`).
- [x] **Phase 2 – Data Migration (Supabase → Mongo)**
  - [x] Create migration script to read from Supabase and upsert into Mongo collections (`scripts/migrate-supabase-to-mongo.ts`).
  - [ ] Run migration locally, verify counts and sample documents.
  - [ ] Run migration against production Mongo once validated.
- [x] **Phase 3 – API Routes to Mongo**
  - [x] Spaces API (`/api/spaces`, `/api/spaces/[id]/image`).
  - [x] Clubs API (`/api/clubs`, `/api/clubs/[id]/image`).
  - [x] Users/auth-related queries in login + admin hooks (NextAuth route).
  - [x] Reservations API (`/api/reservations`, `/api/reservations/[id]`, `/api/reservations/[id]/status`, `/api/reservations/delete-rejected`).
  - [x] Analytics API (`/api/analytics` with Mongo aggregation pipelines).
  - [x] Notification helper (`lib/send-notification.ts`).
- [x] **Phase 4 – Frontend Off Supabase**
  - [x] Replace all direct `supabase` usages in components/hooks with calls to `/api/...` backed by Mongo.
  - [x] Migrated contexts: `notifications-context.tsx`, `messaging-context.tsx` (using API calls, polling temporarily)
  - [x] Migrated components: `big-calendar.tsx`, `admin-layout.tsx`, `NewConversation.tsx`, `MessagingUI.tsx`
  - [x] Migrated hooks: `useAdminUser.ts`
  - [x] Migrated pages: `login/page.tsx`, `club/*`, `admin/*`
  - [x] Created API routes: `/api/notifications`, `/api/messages`, `/api/users`
  - [x] Added PUT endpoints for updating: `/api/reservations/[id]`, `/api/clubs/[id]`, `/api/users/[id]`
  - [x] Ensure UI behavior and API response shapes remain consistent.
- [x] **Phase 5 – Realtime via Pusher**
  - [x] Set up Pusher app + environment variables (user has already configured).
  - [x] Created Pusher server helper (`lib/pusher-server.ts`).
  - [x] Created Pusher client helper (`lib/pusher-client.ts`).
  - [x] Updated API routes to trigger Pusher events on data changes.
  - [x] Updated `notifications-context` to subscribe to Pusher channels.
  - [x] Updated `messaging-context` to subscribe to Pusher channels.
  - [ ] **Note**: Add `NEXT_PUBLIC_PUSHER_KEY` and `NEXT_PUBLIC_PUSHER_CLUSTER` to `.env.local` for client-side access.
- [ ] **Phase 6 – Auth/Permissions Hardening (Optional)**
  - [ ] (If chosen) Wire NextAuth to Mongo.
  - [ ] Replace localStorage-based admin/club identity with session-based checks.
- [x] **Phase 7 – Supabase Removal & Cleanup**
  - [x] Remove `lib/supabase.ts` and Supabase dependencies.
  - [x] Remove unused Supabase imports from code files.
  - [x] Clean up Supabase comments in code.
  - [x] Remove `@supabase/supabase-js` from package.json.
  - [x] Delete test files that depend on Supabase.
  - [ ] Remove/mark legacy Supabase SQL files (kept for reference in `supabase/` folder).

### Pusher Setup Notes

When we reach the realtime phase, you’ll need:

1. Create a free account at `https://dashboard.pusher.com`.
2. Create a **Channels** app (region close to your users).
3. From the app dashboard, copy:
   - `app_id`
   - `key`
   - `secret`
   - `cluster`
4. Add these to `.env.local` (and `.env.production` as needed), e.g.:

```bash
PUSHER_APP_ID=your_app_id
PUSHER_KEY=your_key
PUSHER_SECRET=your_secret
PUSHER_CLUSTER=eu
PUSHER_USE_TLS=true
```

We will then:
- Initialize a Pusher server client in a small helper (e.g. `lib/pusher.ts`).
- Use it in API routes / change-stream listeners to broadcast events.
- Use the Pusher JS client in React contexts to receive live updates.

### Notes / Decisions

- Keep **string IDs** compatible with existing data to avoid touching front-end assumptions.
- Maintain existing API response shapes whenever possible to minimize UI changes.
- Realtime is required; initial fallback to polling is acceptable only temporarily during development.

