# Webcomic Planner — App Spec

## 1. Purpose
A visual planning tool for structuring a webcomic before drawing begins. The core interaction is
arranging "scenes" on one or more draggable timelines, so the author can plan pacing, parallel
storylines, and structure at a glance. A later phase adds lightweight wireframing per scene.

This document describes **functionality only** — no tech stack is specified. Treat it as a
requirements/spec doc to scaffold the app from.

---

## 2. Core Concepts

### 2.1 Scene
The fundamental unit of planning. A scene represents a beat, moment, or sequence in the story.

Fields:
- `id`
- `title` (short label shown on the card)
- `description` (free text)
- `order` / `position` (its place along its timeline — absent/null for a Loose Scene, see 2.6)
- `tags` (freeform — location, arc, tone, etc.)
- `characters` (structured links to Character records, see 2.7 — distinct from freeform `tags`)
- `tone` (freeform or short enum, e.g. comedic/tense/quiet — surfaced in the detail view and usable
  for color-coding alongside arc/character)
- `status` — enum: `idea → scripted → thumbnailed → drawn → published`
- `notes` (continuity notes, dialogue snippets, reference images — see 2.5)
- `weight` (optional numeric value representing pacing intensity/length, used by the pacing view)
- `color` (optional, derived from tag or manually set — used for arc/character color-coding)

### 2.2 Timeline
A horizontal lane containing an ordered sequence of scenes.

- The app supports **multiple timelines visible at once** (e.g. main plot, subplot, per-character
  POV, per-arc).
- Timelines share a common horizontal axis so scenes on different timelines can be visually
  aligned to indicate simultaneity (Scene A on Timeline 1 happens "at the same time" as Scene B on
  Timeline 2).
- Timelines can be added, renamed, reordered (vertically stacked), collapsed, hidden, or deleted.
- Zoom control: zoom out to see chapter-level groupings, zoom in to see individual scenes in
  detail.

### 2.3 Chapters / Episodes
A run of consecutive scenes on a timeline can be grouped into a named chapter/episode block,
which can be collapsed to a single unit when zoomed out.

### 2.4 Wireframes (Phase 2 — build after core planning works)
Each scene can optionally hold a simple panel-layout sketch:
- A canvas of rectangular "panels" representing comic panels
- Rough figure/shape placeholders can be placed inside panels
- Quick-insert templates: 2-panel, 4-panel, splash page, etc., which the user can then adjust
- The wireframe is attached to its scene card and travels with it if the scene is moved/reordered

### 2.5 Scene Detail View
Clicking/expanding a scene card opens a detail panel with:
- Full description, dialogue snippets
- Reference images
- Continuity notes (e.g. "wearing red jacket here")
- Tags, tone, status, character links (see 2.7), cross-linked scenes (see 3.7)

### 2.6 Loose Scenes
A side panel listing scenes that don't have a timeline/position yet — ideas captured before the
author knows where they'll land in the story. A Loose Scene is a normal Scene record with no
`timeline_id`/`position`.
- Create a scene directly in the Loose Scenes panel (no timeline required).
- Drag a Loose Scene out of the panel onto any timeline to give it a position (same drag
  interaction as reordering, just a different drop target — see 4).
- Drag a scene from a timeline back into the panel to unassign it.
- A scene can also be created as "loose" from a Character page (see 2.7) — e.g. jotting down a
  scene idea for a character before knowing where it fits chronologically.

### 2.7 Characters
A first-class entity, not just a freeform tag. Each character has their own page.

- **Character page** is a form covering the character's info: name, description/bio, and other
  freeform fields (personality, role, etc.) — the exact field set is a detail for the build step,
  not fixed here.
- **Character gallery**: each character page can hold uploaded reference images.
- **Character ↔ Scene links**: a character page lists every scene it's tagged in (via the
  structured `characters` field on Scene, 2.1), and each link jumps to that scene. This is the
  structured counterpart to — and supersedes — the freeform "character tag" idea in 3.1/3.3.
- **Characters index**: a page listing all characters, the entry point to individual character
  pages.
- **Relationship tree (stretch goal — build last, after everything else in this spec)**: a visual,
  connected graph of characters where the author can draw a relationship between two characters
  and annotate what kind of relationship it is (e.g. "siblings," "rivals," "unrequited crush").
  Not required for the Characters feature to be useful on its own — everything above should work
  without it.

---

## 3. Supporting Features (build after core drag/timeline functionality works)

### 3.1 Organization
- Filter/search scenes by tag, character, arc, or status
- Color-coding by arc/character/tone (manual override of derived color)

### 3.2 Pacing View
A secondary visualization plotting scene `weight`/intensity over the timeline as a graph, to help
spot pacing problems (e.g. too many low-intensity scenes in a row).

### 3.3 Character Tracker
Superseded by the structured Characters feature (2.7) — each character's page already lists every
scene it's tagged in, which is what this feature was meant to provide. Worth revisiting later only
if a *cross-character* view (e.g. "who hasn't appeared in the last N scenes") is wanted beyond
what individual character pages give you.

### 3.4 Continuity Notes
Already covered under scene detail (2.5) — surfaced here as a feature to make sure it's
implemented as searchable/pinnable, not just a text blob.

### 3.5 Version / History Snapshots
Ability to save a named snapshot of the full board state before a big reorder, and revert to it if
the reorder doesn't work out. Does not need to be full undo/redo — just manual save-points.

### 3.6 Publish Tracker
Mark scenes as scheduled/posted with a date, for serialized online publishing. Could be a
lightweight calendar or list view filtered to `status = published` (or a separate `publish_date`
field).

### 3.7 Cross-links Between Scenes
Ability to flag a pair of scenes as foreshadowing → payoff (or any other relationship), and jump
between them from the detail view.

### 3.8 Export to Outline
A button that generates a linear text outline of the current timeline order (title +
description per scene, in sequence) for use when writing the actual script.

### 3.9 Account Management
A way for the user to deactivate their account (hides their data, blocks login). A true
irreversible delete is a later hardening task — deactivation is the near-term target since it
avoids the extra privileged backend piece a hard delete would require.

---

## 4. Interaction Requirements

- **Drag-and-drop** is central: scenes must be freely draggable within a timeline (reordering) and
  ideally draggable between timelines too.
- Multiple timelines must render simultaneously on one screen, vertically stacked, sharing a
  horizontal time axis.
- Zoom in/out must work smoothly across chapter-level and scene-level views without losing
  position context.
- The board should support an arbitrary/growing number of scenes without becoming unusable —
  virtualization or lazy rendering may be needed at scale (implementation detail, left to Claude
  Code's judgment).

---

## 5. Suggested Build Order
*(Revised 2026-08-30 to interleave the wishlist items from §2.6/2.7/3.9 by dependency — see §8.)*

1. ✅ **Data model + single timeline**: create/edit/delete scenes, drag-reorder within one
   timeline. *(Done.)*
2. **Multiple timelines + Loose Scenes**: add/remove timelines, shared horizontal axis, vertical
   stacking, plus the Loose Scenes panel (2.6) — both are "scenes need a home other than their
   current timeline" problems, solved with the same drag-between-containers mechanics.
3. **Scene detail view**: expand a scene into the full editable detail panel (2.5), including the
   new `tone` field.
4. **Characters**: character index + character page (bio form, gallery, scene links), structured
   `characters` field on Scene replacing/augmenting freeform tags, "create loose scene from
   character page." Depends on the detail view (step 3) for the tagging UI and Loose Scenes
   (step 2) for that last capability.
5. **Chapters/grouping + zoom**: collapse runs of scenes, zoom in/out.
6. **Organization layer**: tags, filters, search, color-coding (now including character/tone).
7. **Pacing view** (derived/read-only view over existing data — character tracker dropped, see
   3.3).
8. **Continuity, cross-links, version snapshots, publish tracker, export-to-outline, account
   deactivation (3.9).**
9. **Character relationship tree** (2.7 stretch goal) — deliberately last among the planning
   features, per your call that it's the lowest-priority item on the wishlist.
10. **Wireframing (Phase 2)**: panel canvas, templates, attach-to-scene.

---

## 6. Explicitly Out of Scope (for now)
- Tech stack / framework choice
- Actual comic art/drawing tools (this is a planning tool, not a drawing tool)
- Collaboration/multi-user features beyond per-user accounts (see decisions below — revisit further
  multi-user/collab features if needed)
- Mobile-specific UI (assume desktop-first unless told otherwise)

---

## 7. Stack & Persistence Decisions (added 2026-08-27)
- Frontend: React + JavaScript (not TypeScript) + Vite.
- User accounts required: each user logs in and their board data (timelines, scenes, etc.) is
  saved/loaded per-account. This implies a backend + database, not a local-only app — to be
  detailed in the scaffolding plan.

---

## 8. Wishlist Additions (2026-08-30)
Added: Loose Scenes (2.6), Characters incl. gallery + relationship tree (2.7), `tone` +
structured `characters` field on Scene (2.1), Account deactivation (3.9). Character Tracker (3.3)
marked superseded by 2.7. Build order (§5) revised to interleave these by dependency rather than
appending them at the end. Character image uploads will need a Supabase Storage bucket with
per-user policies when we reach that build step — not yet designed, just flagged here so it's not
a surprise.
