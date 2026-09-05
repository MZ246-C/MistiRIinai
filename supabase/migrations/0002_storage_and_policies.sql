-- MistiRinai — storage bucket + policy notes
--
-- We deliberately do NOT add any RLS policies for `anon` or `authenticated`
-- roles on any table in 0001_init.sql. With RLS enabled and zero policies,
-- those roles can read/write nothing — which is exactly what we want,
-- because the browser never talks to Postgres directly. All reads/writes
-- go through Netlify Functions using the service_role key (server-only,
-- bypasses RLS by design). This is intentionally the simplest and most
-- airtight posture for a single-tenant private app.
--
-- If you later add Supabase Auth + multiple real user accounts, that's
-- the point at which you'd add real per-user RLS policies here, e.g.:
--
--   create policy "owners can read their own memories"
--     on memories for select
--     using (created_by = auth.uid()::text);
--
-- For now, leave this file's policies section empty — access control is
-- enforced entirely in netlify/functions/_shared/auth.ts.

-- ---------------------------------------------------------------------
-- Storage bucket for private media (create via SQL or Dashboard — see README)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('memories', 'memories', false)
on conflict (id) do update set public = false;

-- No storage.objects policies are added for anon/authenticated, for the
-- same reason as above: only the service role (server-side) issues
-- signed upload/download URLs. The bucket is NOT public, so there is no
-- predictable public URL for any uploaded file.
