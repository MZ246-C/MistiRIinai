# MistiRinai

A private, authenticated digital memory booth — upload and organize photos,
videos, audio, documents, and text memories, and keep track of important
dates on a calendar. Built to be genuinely private: every piece of data is
protected server-side, not just hidden in the UI.

> **New to this?** Read `SETUP_GUIDE.md` instead — it walks through every
> step (VS Code → GitHub → Supabase → Netlify) in plain language, assuming
> no prior experience. This README is the technical reference.

## Features (implemented)

- **Real authentication** — a single shared password, bcrypt-hashed and
  stored server-side, verified by a Netlify Function. Sessions are opaque
  tokens stored in an HttpOnly, Secure, SameSite cookie, backed by a
  real, revocable server-side session table (logout actually invalidates
  the session — it isn't just "the cookie disappeared").
- **Brute-force protection** — failed logins are rate-limited per IP using
  a database-backed counter (works correctly across serverless cold starts,
  unlike an in-memory counter).
- **Memories** — photo, video, audio, document, and text-only memories,
  with title, description, date, location, tags, favorite flag.
- **Private file storage** — uploads go straight from the browser to a
  *private* Supabase Storage bucket using short-lived signed upload URLs
  (so large videos never pass through a serverless function body). Viewing
  a file requires a fresh signed URL minted only after the session is
  verified server-side.
- **File validation** — MIME type + extension allowlist (cross-checked
  against each other), per-type size limits, sanitized filenames, and
  randomly generated storage keys (the original filename is never trusted
  as a path).
- **Gallery** — masonry / grid / list views, search, type filters,
  favorites filter, sorting.
- **Calendar** — month view with animated transitions, categorized events,
  yearly/monthly recurrence, upcoming-dates timeline on the dashboard.
- **Audit log** — login, upload, edit, and delete actions are recorded
  server-side (`audit_logs` table). There's no viewer UI yet — see
  "What's next."
- **Light/dark themes**, responsive layout with a mobile bottom nav,
  `prefers-reduced-motion` support, toast notifications, empty states.
- **Netlify + Supabase deployment** — `netlify.toml` with SPA redirects,
  security headers, and a Content-Security-Policy; SQL migrations for
  schema + RLS + the storage bucket.

## What's next (designed for, not yet built)

The spec this project was built from is intentionally larger than a first
version should be. These are scaffolded for (the DB schema and API shape
won't need to change) but not implemented yet, so they're listed honestly
rather than faked:

- Multiple real user accounts / owner-editor-viewer roles (the `sessions`
  table already has a `role` column and every table has a `created_by`
  column ready for this)
- A visible audit-log viewer page (the data is already being recorded)
- Dedicated timeline/"memory journey" scroll view
- Command palette (Ctrl/Cmd+K)
- Export/import (ZIP of memories + metadata)
- Thumbnail *generation* (resizing) — currently photo thumbnails just use
  the original image via a signed URL; videos/audio/documents show an
  icon instead of a generated poster frame
- PWA install prompt polish beyond the base manifest

## Architecture

```
Browser (React + TS + Vite + Tailwind + Framer Motion)
   │  fetch("/api/...", { credentials: "include" })
   ▼
Netlify Functions ("/netlify/functions/*.ts")
   │  every function calls requireSession() FIRST, before touching data
   ▼
Supabase Postgres (service-role key, server-side only) + Supabase Storage
   (private bucket, signed URLs only)
```

**Why no Supabase Auth?** The spec calls for a single shared password
with room to grow into real accounts later. Rolling a small, well-scoped
auth system (bcrypt + a real server-side session table) is simpler to
audit than mapping a single shared password onto a multi-user auth
provider, and the schema (`role`, `created_by` columns) is already shaped
so that swapping in Supabase Auth later — for real per-person accounts —
is additive, not a rewrite.

**Why query params instead of `/api/memories/:id`?** Netlify Functions
route by filename, not by a URL router. Rather than hand-rolling path
parsing (a common source of subtle bugs), endpoints that need an id use
`?id=` — e.g. `GET /api/memories-get?id=...`. Functionally identical,
fewer moving parts.

### API endpoints

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/auth-login` | Verify password, start a session |
| POST | `/api/auth-logout` | Revoke the current session |
| GET | `/api/auth-session` | Check if the current cookie is still valid |
| GET | `/api/memories-list` | List memories (filters: type, favorite, q, sort, page) |
| GET | `/api/memories-get?id=` | One memory + signed view URL |
| POST | `/api/memories-create` | Create a **text** memory |
| PATCH | `/api/memories-update?id=` | Edit a memory's metadata/tags/favorite |
| DELETE | `/api/memories-delete?id=` | Delete a memory + its storage file(s) |
| POST | `/api/uploads-create` | Validate a file, get a signed upload URL |
| POST | `/api/uploads-complete` | Finalize an upload into a memory record |
| GET | `/api/calendar-list` | List calendar events (filters: from, to, category, q) |
| POST | `/api/calendar-create` | Create an event |
| PATCH | `/api/calendar-update?id=` | Edit an event |
| DELETE | `/api/calendar-delete?id=` | Delete an event |
| GET | `/api/search?q=` | Search memories + events together |
| GET | `/api/dashboard-stats` | Counts, upcoming events, recent memories |
| GET / PATCH | `/api/settings-get`, `/api/settings-update` | Site settings |

Every one of these (except `auth-login`) calls `requireSession()` as its
first line and returns 401 if there's no valid session — there is no
endpoint that trusts the frontend to have already checked.

## Local development

```bash
npm install
npm run dev          # starts Vite only — functions need `netlify dev` (see SETUP_GUIDE.md)
```

For working uploads/auth locally you need `netlify dev` (which runs both
Vite and the functions together) — full instructions are in
`SETUP_GUIDE.md`.

## Environment variables

See `.env.example` for the full list with explanations. In short:

- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` — browser-safe, bundled
  into the frontend. Safe specifically because no table grants any
  privilege to the `anon` role (see `supabase/migrations/0002_*.sql`).
- Everything else (`SUPABASE_SERVICE_ROLE_KEY`, `SESSION_SECRET`,
  `INITIAL_ADMIN_PASSWORD`, etc.) is **server-only** — read exclusively
  inside `netlify/functions/_shared/env.ts` and never imported by any file
  under `src/`.

## Security checklist

Use this to verify a deployment before trusting it with real memories:

- [ ] `.env` is not committed (check `git log --all -- .env` returns nothing)
- [ ] Visiting the Netlify URL directly shows the login screen, not the dashboard
- [ ] `curl https://your-site.netlify.app/api/memories-list` (no cookie) returns `401`, not data
- [ ] `curl https://your-site.netlify.app/api/dashboard-stats` (no cookie) returns `401`
- [ ] The Supabase Storage bucket `memories` is **not public** (Supabase dashboard → Storage → bucket settings)
- [ ] Opening a memory's file URL directly (copy it from network tab) stops working after ~5 minutes (signed URL TTL)
- [ ] `view-source:` on the deployed site contains no password, no `SUPABASE_SERVICE_ROLE_KEY`, no `SESSION_SECRET`
- [ ] Entering the wrong password 8+ times in a row gets rate-limited (`429`)
- [ ] Logging out and pressing "back" does not show private content
- [ ] `robots.txt` disallows all crawling and pages carry `noindex`

## Tech stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, React Router, lucide-react
- **Backend:** Netlify Functions (Node/TypeScript)
- **Database:** Supabase Postgres, with Row Level Security enabled and zero
  policies for `anon`/`authenticated` — only the service-role key (server-side)
  can read or write
- **Storage:** Supabase Storage, private bucket, signed URLs only
- **Hosting:** Netlify (static frontend + serverless functions)
- **Testing:** Vitest (unit tests for file validation logic)
- **CI:** GitHub Actions (`.github/workflows/ci.yml`) — install, type-check, lint, test, build

## License

Private personal project — no license granted for reuse.
