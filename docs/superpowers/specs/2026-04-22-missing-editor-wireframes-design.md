---
date: 2026-04-22
topic: missing-editor-wireframes
status: approved
related:
  - docs/ideation/2026-04-20-editor-chrome-ds-ideation.md
  - docs/ideation/2026-04-21-editor-ds-fresh-options-ideation.md
---

# Missing Editor Wireframes — Design Spec

## Goal

Generate the 14 missing `wireframes.html` files that complete the editor's surface coverage in `/Users/shahg/.gstack/projects/aamirtauqir-buildrik/designs/`. Today (2026-04-22) 15 wireframes already exist; this spec closes the remaining gap so every editor surface has an approvable wireframe candidate before code port.

## Non-goals

- Porting any wireframe to editor TSX code (separate workflow).
- Engine/manager changes.
- DS token migration.
- `approved.json` selection — manual user step after wireframe review.
- `state1-grid/` variant folders (used only post-approval).

## Context

The editor has ~30 distinct UI surfaces (tabs, chrome, feature modules). As of 2026-04-22 15:18, 15 of those have today-dated wireframes generated via the gstack design workflow. 14 remain uncovered. Without wireframes, those surfaces cannot enter the approval → port pipeline.

Reference wireframes analyzed:
- `build-tab-20260422/wireframes.html` (676 lines, 9 stages)
- `topbar-20260422/wireframes.html` (669 lines, 11 stages)
- `inspector-20260422/wireframes.html` (10 stages)
- `ai-suite-20260422/wireframes.html` (7 stages)
- `micro-states-20260422/wireframes.html` (489 lines, 6 stages)

Pattern confirmed: self-contained HTML, single `<style>` block, numeric `data-state`, sticky dark nav toggles `.stage.visible`, DS V1 tokens, Inter Tight + Geist Mono.

---

## Section 1 — Shared Contract

All 14 wireframes follow this locked contract.

### File location

```
/Users/shahg/.gstack/projects/aamirtauqir-buildrik/designs/<surface>-20260422/wireframes.html
```

### HTML skeleton

- `<!DOCTYPE html>`, self-contained, no build step.
- Google Fonts via `fonts.bunny.net`: Inter Tight 400/500/600/700 + Geist Mono 400/500.
- Single `<style>` block — no external CSS.
- Inline `<script>` — nav click toggles `.stage.visible`.

### Design tokens (locked — copy verbatim from build-tab reference)

```css
--aqb-bg-app:#F1F5F9;
--aqb-bg-panel:#F8FAFC;
--aqb-bg-subtle:#F1F5F9;
--aqb-bg-card:#FFFFFF;
--aqb-bg-elevated:#FFFFFF;
--aqb-border:#E2E8F0;
--aqb-border-medium:#CBD5E1;
--aqb-border-strong:#94A3B8;
--aqb-text-primary:#334155;
--aqb-text-secondary:#64748B;
--aqb-text-muted:#94A3B8;
--aqb-text-disabled:#CBD5E1;
--accent:#2D6DFF;
--accent-hover:#4B8DFF;
--accent-pressed:#1E58D9;
--accent-tint:rgba(45,109,255,0.10);
--accent-subtle:rgba(45,109,255,0.05);
--accent-on:#FFFFFF;
--success:#16A34A;
--warning:#D97706;
--error:#DC2626;
--aqb-font:"Inter Tight","sans-serif";
--aqb-font-mono:"Geist Mono","monospace";
--shadow-modal:0 8px 32px rgba(15,23,42,0.08);
```

### Stage geometry

- Fixed `1440 × 900`, 12px radius, `#E2E8F0` outer bg.
- Shell grid: `60px 320px 1fr 320px` (rail | sidebar | canvas | inspector).
- Nav: sticky top, `#0F172A` bg, Geist Mono 11px, section groups.

### Stage count rule

- Minimum **6** stages, maximum **11** per file.
- Must cover: default · populated · empty · hover/active · error-or-loading · edge-case (modal/overflow/etc).

### Anti-slop rules (non-negotiable)

- No purple/violet/indigo anywhere.
- No default system font stacks (no Arial/Helvetica/Roboto).
- No decorative gradients beyond cobalt tint.
- No spring motion, no scroll choreography.
- 4px base spacing grid only.

---

## Section 2 — File Layout + Generation Order

### File paths (all under `/Users/shahg/.gstack/projects/aamirtauqir-buildrik/designs/`)

| # | Folder | File |
|---|--------|------|
| 1 | `shell-20260422/` | `wireframes.html` |
| 2 | `rail-20260422/` | `wireframes.html` |
| 3 | `sidebar-container-20260422/` | `wireframes.html` |
| 4 | `pages-tab-20260422/` | `wireframes.html` |
| 5 | `history-tab-20260422/` | `wireframes.html` |
| 6 | `elements-tab-20260422/` | `wireframes.html` |
| 7 | `component-library-20260422/` | `wireframes.html` |
| 8 | `wizard-20260422/` | `wireframes.html` |
| 9 | `onboarding-20260422/` | `wireframes.html` |
| 10 | `animation-20260422/` | `wireframes.html` |
| 11 | `collaboration-20260422/` | `wireframes.html` |
| 12 | `ecommerce-20260422/` | `wireframes.html` |
| 13 | `export-20260422/` | `wireframes.html` |
| 14 | `sync-20260422/` | `wireframes.html` |

### Phase order (dependency-first)

| Phase | Files | Reason |
|-------|-------|--------|
| **P1 Foundation** | shell, rail, sidebar-container (1–3) | Root layout + nav. Defines slots for P2. |
| **P2 Sidebar tabs** | pages, history, elements, component-library (4–7) | Fill sidebar slot. Reuse panel header. |
| **P3 Overlays** | wizard, onboarding (8–9) | Modal/full-screen, overlay P1 chrome. |
| **P4 Feature modules** | animation, collaboration, ecommerce, export, sync (10–14) | Self-contained panels + modals. |

### Batching strategy

- 1 wireframe per commit (easy review + revert).
- Commit msg: `wireframe: <surface> — <N> states (<brief>)`.
- No batch commits.

### Naming convention

- Folder = `<surface>-20260422/` (match today's 15).
- Exception: `sidebar-container` (avoids collision with `sidebar-system-20260418`).
- Exception: `pages-tab` / `history-tab` / `elements-tab` (disambiguation).

---

## Section 3 — Per-Surface State Enumeration

**Total: ~98 stages across 14 files (avg 7/surface, range 6-8).**

### Phase 1 — Foundation

**1. shell** (8 states) — root AquibraStudio layout
- S1 default (idle canvas)
- S2 element-selected (inspector filled)
- S3 no-inspector mode
- S4 preview/fullscreen
- S5 loading skeleton
- S6 dirty/unsaved topbar
- S7 offline banner
- S8 responsive preview (mobile frame)

**2. rail** (6 states) — 60px left icon nav
- S1 default
- S2 hover tooltip
- S3 badge/dot
- S4 active-tab pressed
- S5 disabled/locked
- S6 context menu open

**3. sidebar-container** (7 states) — 320px panel wrapper
- S1 default (header + body)
- S2 search-active
- S3 secondary-tabs row
- S4 collapsed
- S5 resize-handle grab
- S6 scrolled sticky header
- S7 filter chips row

### Phase 2 — Sidebar tabs

**4. pages-tab** (8 states)
- S1 default list
- S2 populated + groups
- S3 empty CTA
- S4 search results
- S5 bulk-select toolbar
- S6 drag-reorder
- S7 page-settings drawer
- S8 error/loading

**5. history-tab** (7 states)
- S1 timeline recent
- S2 version preview
- S3 compare diff
- S4 restore modal
- S5 empty
- S6 filter by user/date
- S7 snapshot create

**6. elements-tab** (7 states)
- S1 default grid
- S2 category filter
- S3 search
- S4 favorites
- S5 hover preview
- S6 drag-to-canvas
- S7 empty results

**7. component-library** (7 states)
- S1 library grid
- S2 category view
- S3 component detail + variants
- S4 create-new modal
- S5 search
- S6 saved/custom tab
- S7 empty

### Phase 3 — Overlays

**8. wizard** (7 states)
- S1 step1 template pick
- S2 step2 content setup
- S3 step3 customize
- S4 step4 review
- S5 complete
- S6 error in step
- S7 back/skip

**9. onboarding** (7 states)
- S1 welcome splash
- S2 role/profile
- S3 team invite
- S4 first project
- S5 tour popover A
- S6 tour popover B
- S7 completion

### Phase 4 — Feature modules

**10. animation** (7 states)
- S1 panel default
- S2 selected anim editor
- S3 timeline view
- S4 keyframe editor
- S5 preset library
- S6 empty
- S7 preview playing

**11. collaboration** (7 states)
- S1 solo default
- S2 active cursors
- S3 comments thread
- S4 share modal
- S5 permissions editor
- S6 conflict/merge
- S7 presence avatars topbar

**12. ecommerce** (7 states)
- S1 products list
- S2 product detail
- S3 cart/checkout preview
- S4 payment methods
- S5 orders dash
- S6 empty
- S7 settings/config

**13. export** (7 states)
- S1 panel default
- S2 format pick
- S3 options config
- S4 in-progress
- S5 success + download
- S6 error
- S7 export history

**14. sync** (7 states)
- S1 all-synced status
- S2 syncing progress
- S3 conflict detected
- S4 offline mode
- S5 version mismatch
- S6 sync history log
- S7 force-sync modal

---

## Section 4 — Quality Gates + Review Loop

### Per-file gates (run before commit)

| Gate | Check | Tool |
|------|-------|------|
| **G1 hex-color** | No non-DS hex (whitelist = tokens in Section 1). No purple/violet/indigo. | `grep -E '#[0-9a-fA-F]{3,8}'` + allowlist |
| **G2 font-stack** | No `Arial`/`Helvetica`/`Roboto` fallback beyond `"sans-serif"`. Must use Inter Tight + Geist Mono. | `grep -E 'Arial\|Helvetica\|Roboto'` |
| **G3 stage-count** | 6–11 stages per file, numeric `data-state="1"…"N"`. | `grep -c 'class="stage'` |
| **G4 geometry** | Stage = 1440×900, rail = 60px, sidebar = 320px, inspector = 320px. | regex check |
| **G5 nav-wiring** | Every `data-state` has matching nav button. Last stage has class `visible`. | DOM parse |
| **G6 self-contained** | Zero external `<script src>` or `<link rel="stylesheet">` except `fonts.bunny.net`. | grep |
| **G7 file-size** | 400–900 lines. Over 900 = split; under 400 = under-specified. | `wc -l` |

### Review loop (per wireframe)

```
1. Generate → run G1-G7
2. If any gate fails → fix inline, re-run
3. If all pass → open in browser, visual spot-check
4. Commit: wireframe: <surface> — <N> states (<brief>)
```

### Batch checkpoint

After each phase (P1, P2, P3, P4) complete, pause and ask user to review phase output before next phase starts. User can reject any wireframe → regenerate with feedback.

### Rollback policy

1 wireframe = 1 commit → `git revert <sha>` undoes cleanly. No cross-file dependencies (each self-contained HTML).

### Non-goals (explicit, repeat)

- No animation/JS logic beyond nav toggle.
- No interaction state machine (hover = static snapshot only).
- No code-port to editor.
- No copy/content review (lorem/placeholder OK for non-chrome text).

---

## Section 5 — Timeline + Deliverables

### Estimated effort

- Template copy (build-tab as base): ~50 lines boilerplate reused.
- Per-stage markup: 40-80 lines × avg 7 stages = 280-560 lines body.
- Total: ~500-700 lines HTML per file.
- Time: ~8-15 min per wireframe incl. G1-G7 validation.

### Phase timeline (sequential, no parallel)

| Phase | Wireframes | Count | Est time | Checkpoint |
|-------|-----------|-------|----------|-----------|
| **P1 Foundation** | shell, rail, sidebar-container | 3 | 30-45 min | User reviews P1 |
| **P2 Sidebar tabs** | pages, history, elements, component-library | 4 | 45-60 min | User reviews P2 |
| **P3 Overlays** | wizard, onboarding | 2 | 20-30 min | User reviews P3 |
| **P4 Feature modules** | animation, collab, ecom, export, sync | 5 | 60-75 min | User reviews P4 |
| **Total** | **14 wireframes** | **~98 stages** | **~3-4 hrs** | |

### Deliverables

- 14 × `wireframes.html` in `/Users/shahg/.gstack/projects/aamirtauqir-buildrik/designs/<surface>-20260422/`
- 14 × git commits (one per wireframe) on `main`
- This spec at `docs/superpowers/specs/2026-04-22-missing-editor-wireframes-design.md`
- Implementation plan at `docs/superpowers/plans/2026-04-22-missing-editor-wireframes-plan.md` (from writing-plans skill)

### Success criteria

1. All 14 files exist at declared paths.
2. Every file passes G1-G7 quality gates.
3. Total stages ≥ 84 (min 6/surface × 14) and ≤ 154 (max 11/surface × 14).
4. Every commit isolated, revertable.
5. User approves each phase before next begins.

### Out of scope

- Port to editor TSX code.
- Engine/manager changes.
- DS token migration.
- `approved.json` selection.
- `state1-grid/` variant folders.
