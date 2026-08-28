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
- `order` / `position` (its place along its timeline)
- `tags` (freeform — character, location, arc, etc.)
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
- Tags, status, linked scenes (see 2.7)

---

## 3. Supporting Features (build after core drag/timeline functionality works)

### 3.1 Organization
- Filter/search scenes by tag, character, arc, or status
- Color-coding by arc/character/tone (manual override of derived color)

### 3.2 Pacing View
A secondary visualization plotting scene `weight`/intensity over the timeline as a graph, to help
spot pacing problems (e.g. too many low-intensity scenes in a row).

### 3.3 Character Tracker
Auto-generated view listing which scenes each character (tag) appears in, to catch characters who
disappear for too long.

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

1. **Data model + single timeline**: create/edit/delete scenes, drag-reorder within one timeline.
2. **Multiple timelines**: add/remove timelines, shared horizontal axis, vertical stacking.
3. **Scene detail view**: expand a scene into the full editable detail panel (2.5).
4. **Chapters/grouping + zoom**: collapse runs of scenes, zoom in/out.
5. **Organization layer**: tags, filters, search, color-coding.
6. **Pacing view + character tracker** (derived/read-only views over existing data).
7. **Continuity, cross-links, version snapshots, publish tracker, export-to-outline.**
8. **Wireframing (Phase 2)**: panel canvas, templates, attach-to-scene.

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
