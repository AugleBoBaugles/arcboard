-- Step 3 (Scene Detail View) migration. Run once in the Supabase SQL editor
-- against an existing project that already has 0001_loose_scenes.sql applied.
-- Fresh installs should use schema.sql directly instead (already updated to
-- reflect this).

-- Freeform tone descriptor (e.g. "comedic", "tense", "quiet") — SPEC.md 2.1
-- calls this "freeform or short enum"; implemented as a plain nullable text
-- column with no CHECK constraint, unlike `status`.
alter table public.scenes add column tone text;
