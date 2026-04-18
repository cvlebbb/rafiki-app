# Rafiki

Rafiki is a social hangout web app for creating plans, joining events, and chatting with other participants in real time.

## Tech Stack

- React 18 + Vite
- Tailwind CSS + custom neon theme
- Supabase (Auth, Postgres, Realtime, Storage)
- React Router v6
- Zustand state management
- Leaflet + OpenStreetMap (Carto dark tiles)

## Features

- Landing page with animated neon branding
- Email/password and Google auth flows
- Protected `/app/*` routes
- Discover feed with filters and hangout detail modal
- Join hangout flow with full/creator/already-joined handling
- Create hangout flow with map pin + reverse geocode + live preview
- Chats page with realtime updates and expired-chat notice handling
- Profile page with friendship actions
- Settings page for username, bio, avatar, and sign out
- Toast notifications throughout

## Route Map

- `/` landing
- `/login` login
- `/signup` signup
- `/app/discover`
- `/app/discover/:id`
- `/app/create`
- `/app/chats`
- `/app/profile`
- `/app/profile/:userId`
- `/app/settings`

## Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

## Local Setup

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

## Supabase Setup

1. Create a Supabase project.
2. Apply SQL migrations from `supabase/migrations/` (especially `002_full_app_logic.sql`).
3. Configure Auth providers (Google + Email/Password).
4. Create Storage buckets:
   - `hangout-images`
   - `profile-avatars`
5. Add Storage policies for authenticated uploads and public read as needed.
6. (Optional) Deploy edge functions in `supabase/functions/` and schedule cron jobs.

## Schema Compatibility Note

This app currently supports both:

- New schema style (`hangout_members`, `group_chats`, `messages.chat_id/content`)
- Legacy schema style (`participants`, `messages.hangout_id/text`)

This helps avoid runtime breakage on partially migrated databases.

## Suggested Git Workflow

```bash
git init
git add .
git commit -m "Initial Rafiki app"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

## What I Need From You To Help Push To GitHub

If you want me to guide the exact push command sequence for your repo, send:

1. Your GitHub username
2. Repo name (or full repo URL)
3. Whether repo should be public or private
4. Whether you already ran `git init` in this folder

If you want me to do the push steps with you end-to-end, I can also give the exact commands for PAT auth (`gh` CLI or HTTPS token flow).