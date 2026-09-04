-- Arcboard schema: timelines + scenes, scoped per user via Supabase Auth + RLS.
-- Run once in the Supabase project's SQL editor for a FRESH install.
-- An existing project should instead apply the files under supabase/migrations/
-- in order — this file is not re-run against a project that already has it.

create extension if not exists pgcrypto;

-- ---------- timelines ----------
create table public.timelines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Main Timeline',
  position double precision not null default 0,
  created_at timestamptz not null default now()
);

create index timelines_user_idx on public.timelines(user_id);

-- ---------- scenes ----------
create table public.scenes (
  id uuid primary key default gen_random_uuid(),
  -- Null when the scene is a Loose Scene (SPEC.md 2.6) — not yet on any timeline.
  -- on delete set null (not cascade): deleting a timeline should turn its
  -- scenes into Loose Scenes, not delete them.
  timeline_id uuid references public.timelines(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Untitled scene',
  description text not null default '',
  position double precision not null,
  tags text[] not null default '{}',
  status text not null default 'idea'
    check (status in ('idea', 'scripted', 'thumbnailed', 'drawn', 'published')),
  notes text not null default '',
  weight double precision,
  color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index scenes_timeline_position_idx on public.scenes(timeline_id, position);
create index scenes_user_idx on public.scenes(user_id);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger scenes_set_updated_at
before update on public.scenes
for each row execute function public.set_updated_at();

-- ---------- row level security ----------
alter table public.timelines enable row level security;
alter table public.scenes enable row level security;

create policy "timelines_select_own" on public.timelines
  for select using (auth.uid() = user_id);
create policy "timelines_insert_own" on public.timelines
  for insert with check (auth.uid() = user_id);
create policy "timelines_update_own" on public.timelines
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "timelines_delete_own" on public.timelines
  for delete using (auth.uid() = user_id);

create policy "scenes_select_own" on public.scenes
  for select using (auth.uid() = user_id);
create policy "scenes_insert_own" on public.scenes
  for insert with check (auth.uid() = user_id);
create policy "scenes_update_own" on public.scenes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "scenes_delete_own" on public.scenes
  for delete using (auth.uid() = user_id);
