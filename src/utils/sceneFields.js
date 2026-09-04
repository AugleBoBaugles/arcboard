// Single source of truth for the scenes.status enum — mirrors the CHECK
// constraint in supabase/schema.sql. Update both together if this list changes.
export const SCENE_STATUSES = ['idea', 'scripted', 'thumbnailed', 'drawn', 'published']
