# Arcboard

A visual planning tool for structuring a webcomic before drawing begins. See [SPEC.md](SPEC.md)
for the full functional spec and build order.

## Stack

- React + JavaScript + Vite
- [Supabase](https://supabase.com) (Postgres + Auth) for accounts and per-user data persistence
- [@dnd-kit](https://dndkit.com) for drag-and-drop

## Setup

1. Install dependencies:
   ```
   npm install
   ```
2. Create a Supabase project at [supabase.com](https://supabase.com).
3. In the Supabase SQL editor, run [supabase/schema.sql](supabase/schema.sql) to create the
   `timelines` and `scenes` tables with row-level security.
4. Copy `.env.example` to `.env.local` and fill in your project's URL and anon key (Project
   Settings → API in the Supabase dashboard):
   ```
   VITE_SUPABASE_URL=
   VITE_SUPABASE_ANON_KEY=
   ```
5. For local dev convenience, consider disabling "Confirm email" under Authentication → Providers
   → Email in the Supabase dashboard, so signup doesn't require clicking an email link.
6. Start the dev server:
   ```
   npm run dev
   ```

## Current status

Step 1 of the build order (SPEC.md §5): single-timeline scene planning — sign up/log in, create,
edit, delete, and drag-reorder scenes on one timeline, persisted per-account in Supabase.
