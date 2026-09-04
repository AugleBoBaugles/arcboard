-- Step 2 (multi-timeline + Loose Scenes) migration. Run once in the Supabase
-- SQL editor against an existing project that already has schema.sql applied.
-- Fresh installs should use schema.sql directly instead (already updated to
-- reflect this).

-- A Loose Scene has no timeline yet.
alter table public.scenes alter column timeline_id drop not null;

-- The original FK was `on delete cascade`, which would silently delete every
-- scene on a timeline the moment that timeline is deleted. It needs to be
-- `on delete set null` instead, so deleted-timeline scenes become Loose
-- Scenes rather than disappearing.
do $$
begin
  if exists (
    select 1 from pg_constraint
    where conrelid = 'public.scenes'::regclass
      and contype = 'f'
      and conname = 'scenes_timeline_id_fkey'
  ) then
    alter table public.scenes drop constraint scenes_timeline_id_fkey;
  end if;
end $$;

alter table public.scenes
  add constraint scenes_timeline_id_fkey
    foreign key (timeline_id) references public.timelines(id) on delete set null;
