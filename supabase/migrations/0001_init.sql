-- MistiRinai — initial schema
-- Run this in Supabase → SQL Editor, or via `supabase db push` (see README).
--
-- Design notes:
--  * There is no Supabase Auth user table. Authentication is a single
--    shared password, verified by a Netlify Function and never exposed
--    to the browser (see netlify/functions/auth-login.ts).
--  * `app_config` is a singleton row holding the hashed password and a
--    few site settings. `created_by` / `owner_id` columns below are
--    text placeholders ('owner') so that real multi-user accounts can
--    be introduced later without a schema rewrite.
--  * Every table has Row Level Security ENABLED with NO policies for
--    the `anon` / `authenticated` Postgres roles. Only the
--    `service_role` key (used exclusively inside Netlify Functions,
--    never in the browser) can read or write — service_role bypasses
--    RLS by design. This means even if the anon key leaked, it could
--    not read a single row.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- app_config: singleton config + hashed shared password
-- ---------------------------------------------------------------------
create table if not exists app_config (
  id int primary key default 1,
  password_hash text not null,
  site_subtitle text not null default 'A little place for all the moments that matter.',
  default_theme text not null default 'system',
  default_gallery_layout text not null default 'masonry',
  default_sort text not null default 'newest',
  date_format text not null default 'MMM d, yyyy',
  time_format text not null default '12h',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint app_config_singleton check (id = 1)
);

alter table app_config enable row level security;

-- ---------------------------------------------------------------------
-- sessions: server-side session store so logout / expiry is REAL,
-- not just "the cookie disappeared". The cookie holds an opaque token;
-- only its SHA-256 hash is stored here.
-- ---------------------------------------------------------------------
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  user_label text not null default 'owner', -- future: fk to a real users table
  role text not null default 'editor',      -- future: 'owner' | 'editor' | 'viewer'
  ip text,
  user_agent text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz
);

alter table sessions enable row level security;
create index if not exists idx_sessions_expires_at on sessions (expires_at);

-- ---------------------------------------------------------------------
-- login_attempts: brute-force / rate limiting
-- ---------------------------------------------------------------------
create table if not exists login_attempts (
  id bigint generated always as identity primary key,
  ip text not null,
  success boolean not null,
  attempted_at timestamptz not null default now()
);

alter table login_attempts enable row level security;
create index if not exists idx_login_attempts_ip_time on login_attempts (ip, attempted_at desc);

-- ---------------------------------------------------------------------
-- memories
-- ---------------------------------------------------------------------
create table if not exists memories (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  type text not null check (type in ('photo', 'video', 'audio', 'document', 'text', 'other')),
  storage_path text,               -- null for text memories
  thumbnail_path text,
  original_filename text,
  mime_type text,
  file_size bigint,
  text_content text,               -- used only when type = 'text'
  date_taken date,
  location text,
  is_favorite boolean not null default false,
  people text[],                   -- optional participant names
  metadata jsonb not null default '{}'::jsonb,
  created_by text not null default 'owner',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table memories enable row level security;
create index if not exists idx_memories_created_at on memories (created_at desc);
create index if not exists idx_memories_date_taken on memories (date_taken desc);
create index if not exists idx_memories_type on memories (type);
create index if not exists idx_memories_favorite on memories (is_favorite);
create index if not exists idx_memories_title_trgm on memories using gin (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(text_content, '')));

-- ---------------------------------------------------------------------
-- tags + memory_tags (normalized, not a JSON blob)
-- ---------------------------------------------------------------------
create table if not exists tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

alter table tags enable row level security;

create table if not exists memory_tags (
  memory_id uuid not null references memories (id) on delete cascade,
  tag_id uuid not null references tags (id) on delete cascade,
  primary key (memory_id, tag_id)
);

alter table memory_tags enable row level security;
create index if not exists idx_memory_tags_tag on memory_tags (tag_id);

-- ---------------------------------------------------------------------
-- calendar_events
-- ---------------------------------------------------------------------
create table if not exists calendar_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  start_datetime timestamptz not null,
  end_datetime timestamptz,
  all_day boolean not null default true,
  category text not null default 'custom'
    check (category in ('birthday', 'anniversary', 'first_meeting', 'special_day', 'trip', 'celebration', 'reminder', 'custom')),
  color text default '#B8903F',
  recurrence_rule text,            -- e.g. 'FREQ=YEARLY' or 'FREQ=MONTHLY'
  reminder text,                   -- e.g. 'none' | '1_day_before' | '1_week_before'
  created_by text not null default 'owner',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table calendar_events enable row level security;
create index if not exists idx_calendar_start on calendar_events (start_datetime);
create index if not exists idx_calendar_category on calendar_events (category);

-- ---------------------------------------------------------------------
-- audit_logs
-- ---------------------------------------------------------------------
create table if not exists audit_logs (
  id bigint generated always as identity primary key,
  actor text not null default 'owner',
  action text not null,   -- e.g. 'login', 'upload', 'edit_memory', 'delete_memory', ...
  target text,            -- e.g. memory id or event id
  ip text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table audit_logs enable row level security;
create index if not exists idx_audit_created_at on audit_logs (created_at desc);

-- ---------------------------------------------------------------------
-- keep updated_at fresh
-- ---------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_memories_updated_at on memories;
create trigger trg_memories_updated_at before update on memories
  for each row execute function set_updated_at();

drop trigger if exists trg_calendar_updated_at on calendar_events;
create trigger trg_calendar_updated_at before update on calendar_events
  for each row execute function set_updated_at();

drop trigger if exists trg_app_config_updated_at on app_config;
create trigger trg_app_config_updated_at before update on app_config
  for each row execute function set_updated_at();
