# SCREEN_DESIGN_SPECIFICATIONS

## Current screen-family evidence — 2026-10-20

The [current S01–S31/X01–X02 map](../evidence/figma-design-execution/COMPLETION-2026-10-20.md) and [Figma task index](https://www.figma.com/design/2L9OTGzBrL6kYmU18yA1c7?node-id=262-2) identify the current editable output. The previous “ready to draw/no screens” statuses below are historical, not a claim that current output is absent. S21 first-run remains excluded pending R1 interviews; S30 is preservation-only; S31 is deferred by SC-21. Screen-family presence does not certify all states, prototype actions, source acceptance rows or runtime implementation.

## Figma output checkpoint · 2026-10-18

Later user authorization has produced [new editable Figma output](https://www.figma.com/design/2L9OTGzBrL6kYmU18yA1c7). The earlier “none exists / blocked” statements below describe Audit A's historical state. They are not current blanket blockers; current source amendments and owner decisions govern.

| Screens | Output reference | Coverage status |
|---|---|---|
| S01–S06, S12 | [Integrated Desktop editing](https://www.figma.com/design/2L9OTGzBrL6kYmU18yA1c7?node-id=7-20634), J-F1 states 01–12 | Initial shell/journey represented. Menus, deep controls, all object types, complete Pages and state families remain partial. |
| S03/S04/S05/S06 | [Recovery and Mixed specimens](https://www.figma.com/design/2L9OTGzBrL6kYmU18yA1c7?node-id=10-1190) | Lock/stale insertion, Mixed, save/focus and narrow examples; no drag/engine verification. |
| S13 | [Docked Review host](https://www.figma.com/design/2L9OTGzBrL6kYmU18yA1c7?node-id=15-2450) plus overlay/sheet/peek | Host geometry demonstrated; full Review/task-module design remains B8. |
| S28 | [Tablet Preview](https://www.figma.com/design/2L9OTGzBrL6kYmU18yA1c7?node-id=8-3262) → return | One draft/Tablet/return path; broader Preview coverage remains B3. |
| S07–S11, S14–S27, S29–S31 | [Batch dispositions](../FIGMA-DESIGN-EXECUTION-PLAN.md#6-screen-completeness-map) | Not completed by this pass. First-run research and AI/commerce decisions remain in force. |

Independent **DESIGN REVIEW PASSED** is limited to the corrected visual specimens J08/C03/C08. Full batch coverage, full-editor 200% text, prototype playback, accessibility and runtime are not verified. [Execution outcome](../evidence/figma-design-execution/README.md).

Date 2026-10-18 · Mode AUDIT.

**No hi-fi or editable screen designs exist.** The canonical screen specifications are the panel docs (`panels/01…25`, FD-INS in the brief, FD-DYN). This file does **not** duplicate them (one source per screen); it indexes every documented screen, records its audit verdict, and lists exactly what each needs before it can be drawn and called complete. Figma output is BLOCKED (FINAL_DESIGN_QA_REPORT §2).

Rule applied: *no screen may be marked complete if documented controls are missing.* Therefore **no screen is complete.** "Ready to draw" = spec has no Major gap left.

## 1. Screen index

| # | Screen / surface | Canonical spec | Host · geometry | Job | Written status | Audit verdict | Must fix before drawing |
|---|---|---|---|---|---|---|---|
| S01 | Topbar + ⋯ site menu + bell | P01 | bar 56; menu 260 → 280 | J1–J3 | SPEC COMPLETE | NEEDS REVISION | targets <32; ⋯ regroup (Unpublish); Duplicate/Delete site confirms vs SC-15; Export annex; JTBD line |
| S02 | Left rail | P02 | 56w, items 48×52 | J1 | SPEC COMPLETE | Ready to draw (minor) | one guard dialog (CS-02); label truncation copy |
| S03 | Add panel + quick-add picker | P03 | 284 (260–360) | J1 | SPEC COMPLETE | NEEDS REVISION | Library/This-site scope (T3-1); card width 120 vs 126; offline; Components door |
| S04 | Layers | P04 | 284 (260–360) | J1 | SPEC COMPLETE | NEEDS REVISION | inherited-lock marker; Group lock = Fix not existing; dim-row contrast; use TreeRow |
| S05 | Canvas + canvas toolbar + selection/multi toolbar + context menu | P05 + SC-3/SC-17 | flex; toolbar 44 | J1 | SPEC COMPLETE | **NEEDS REVISION (most gaps)** | multi toolbar (T2-1); menu order + type group (T2-3/4); Tab/Enter conflicts (T2-5/9); multi-resize, marquee (T2-6/11); drag-feedback table (T2-38); overlay tokens; short-height empty CTA; 740 toolbar fit; 1440 frame zoom |
| S06 | Inspector (4 tabs, sections, special contexts) | PDB FD-INS-01/02/03 + P06 delta | 300 fixed; overlay ≤1366 | J1 | SPEC COMPLETE (delta) | NEEDS REVISION | row anatomy (label width/heights); SC-13 reset wording + override marker count; Mixed visual; numeric/colour/box-model/alignment controls; noun cleanup; one merged spec (P06 + annex) |
| S07 | Forms (build + settings + inbox + visitor outcome) | **partial** — inbox in P10 (:105, :132, :145, :151); build in IAF-13, FORM-01, REPORT; P06 has 0 form rows | — | J3 | — | **PARTIAL SPEC** (inbox done; build + visitor states missing) | write Forms build + visitor sections; spam "applies on next publish"; password field; 365-day retention line; delete exception |
| S08 | CMS area (collections, records, fields, dynamic pages, CMS → Data) + binding | P07 + FD-DYN | nav 240, record 720–960 | J3 | SPEC COMPLETE · blocked | NEEDS REVISION | loading state; collection-level Recently deleted; conflict field diff + Keep-mine rebase; "Deleted — Restore" copy |
| S09 | Assets area + left picker + picker dialog + image editor | P08 | nav 240 / detail 320 / picker 284 / dialog 720 | J1/J3 | SPEC COMPLETE · blocked | NEEDS REVISION | synthetic progress claim; quota 80 vs 90; audio filter; folder delete recovery; loading row |
| S10 | Brand area | P09 | nav 240 + body + preview 468 | J1 | SPEC COMPLETE | NEEDS REVISION | loading + offline/apply-failure; preview width rule; "From logo or URL" in/out (SC-21); starters naming/colour (owner) |
| S11 | Site settings (11 screens + Danger zone) | P10 | header 56, nav 240, content 960/720, footer 48 | J3 | SPEC COMPLETE · blocked | NEEDS REVISION | T-ST-04b contradiction; SC-15 confirms (locale, redirect, archive, delete, slug, primary); offline; Permissions dialog content; server-vs-network error copy |
| S12 | Pages manager sheet + bottom bar + page strip + status + page settings dialog | P11 | bar 32; sheet 560/720; dialog 720 | J1 | SPEC COMPLETE | NEEDS REVISION | keyboard reorder; rows 40; one SEO score model; one indexing control; strip tab 24 → 28 |
| S13 | Right task host (frame) | P12 | 360 (320–420); overlay; sheet ≤1280 | J2/J3 | SPEC COMPLETE | NEEDS REVISION | T-RT-09 AI leak; legacy "‹ Activity"; per-task offline table; named-version delete recovery |
| S14 | Publish task + review-and-publish dialog + release history | P14 | task 360; dialog 720 | J3 | SPEC COMPLETE · blocked P-1 | NEEDS REVISION | republish confirm vs SC-15; legal line; Checks overflow; "See all ›" target; Vercel-plan password state |
| S15 | Review task (designer side) | P12 + P17 | task 360 | J2 | SPEC COMPLETE · blocked R-4/R-11 | Ready to draw · **blocked-by authz ⛔ row (T5-02) not yet in SC-9** | authz holes (T5-02) recorded as ⛔ |
| S16 | Client review page `/review/<token>` | P17 | external, 320–1920 | J2 | SPEC COMPLETE · blocked | Ready to draw | footer 2-row vs task footer 48 (justify as external) |
| S17 | History · Activity · Compare · Time travel | P12 + IAF-18 | task 360; Compare full work area | J3 | SPEC COMPLETE | NEEDS REVISION | version delete recovery; session-restore save (BK-19); Overwrite snapshot (BK-59) |
| S18 | Issues task | P12 + P14 checks | task 360 | J3 | SPEC COMPLETE | NEEDS REVISION | load-time damage-scan rows undesigned (F-EN-C5.7) |
| S19 | Components area | P13 | nav 240 + detail 320 | J1 | SPEC COMPLETE | NEEDS REVISION | scope definition (T3-1); confirms vs SC-15; instance breakpoint overrides (T3-14); "master" → "main component"; persistent door |
| S20 | Templates area | P15 | header 56, nav 240, cards 226 | J1 | SPEC COMPLETE | NEEDS REVISION | offline contradiction with P22 (D3-2); Replace confirm; Connect-to-tokens after apply (T6-22); P-TRIAL blocked-by |
| S21 | First run / empty canvas / Getting-started pill | P16 | canvas overlay + pill 32 | J1 | SPEC COMPLETE | NEEDS REVISION | achievement toast vs P22 toast rules; short-height layout; remove pulse; coach stacking |
| S22 | Command palette + shortcuts sheet + Help popover | P18 | 640 / 720 / 240 | all | SPEC COMPLETE | Ready to draw (minor) | ⋯ header single occupant (with P23 trial chip) |
| S23 | Interactions section | P19 | Inspector section | J1 | SPEC COMPLETE · blocked IXD-3/4 | NEEDS REVISION | loading/offline state or N/A; Reverse toggle vs runtime; Play target 24 |
| S24 | Collaboration (presence, people popover, remote cursors) | P21 | popover 320 → 360 | J1 | SPEC COMPLETE · blocked MP-* | NEEDS REVISION | offline announced twice (21 vs 22); extra banner outside P22 slot |
| S25 | Global states (shell skeleton, crash, conflict, offline, session, banners, toasts, notifications) | P22 | slot 40; card 480; dialog 480/720; toast 460 | all | SPEC COMPLETE · blocked G-2/G-12 | **NEEDS REVISION (Critical)** | Restore my edits server check (T5-01); RecoveryBanner Discard rule; storage-full, mirror-refused, CMS hydration rows |
| S26 | Plans & trial (Pro chip, limits, upgrade dialog, trial end, active set) | P23 | dialog 480 | J3 | SPEC COMPLETE · blocked TR-* | NEEDS REVISION | trial notice through P22 slot; AI benefit exclusion; protection-removal confirm |
| S27 | Undo & Recently deleted | P24 | sheet subviews | all | SPEC COMPLETE · blocked U-1 | Ready to draw | page soft delete dependency (U-7) |
| S28 | Preview (full screen) | SC-8 + P01 | full screen | J2 | in SC | NEEDS REVISION | canvas-vs-preview font/colour parity line (T1-23) |
| S29 | Export dialog | **none** (P01 row + IAF-15) | dialog | J3 | — | **NOT SPECIFIED** | geometry, tabs, states, plan-lock, "Soon" tiles decision |
| S30 | E-commerce (product blocks, setup modal) | **none** | — | — | P1-D15 proposed Defer | **BLOCKED (owner)** | decide Defer + read-only behaviour for existing product blocks |
| S31 | AI (future Build tab) | P20 | — | — | DEFERRED (SC-21) | N/A this version | remove leaks only |
| — | Analytics events | P25 | non-visual | — | SPEC COMPLETE | NEEDS REVISION | `publish_blocked` enum gains the motion row |

Counts: 31 screens/surfaces · 5 Ready to draw (minor; S15 blocked-by an SC-9 row) · 23 NEEDS REVISION (incl. Forms partial spec) · 1 NOT SPECIFIED (Export) · 1 BLOCKED (owner) · 1 N/A (deferred).

## 2. Per-screen audit detail (panels 00–13)

JTBD codes (00-STRATEGY §3): **J1** Build · **J2** Get approval · **J3** Publish and maintain · **S** supporting job (consistency / CMS at scale / never lose work). **No panel 01–13 names its job** (D2-1). The job column is therefore the auditor's inference and is marked "(inferred)".

### Panel 00: Shared contracts
| Field | Finding |
|---|---|
| Purpose | One definition for cross-panel rules. It wins over panel text (00:5) |
| Job | S (all) |
| Location / geometry | Not a screen. It sets the 56px workspace header back slot (SC-1), F6 order (SC-5), narrow-width behaviour (SC-19), the 1440 Desktop frame (SC-8/13) |
| Registries | SC-3 actions, SC-11 glossary, SC-12 shortcuts, SC-9 deps (⛔), SC-15 confirm whitelist, SC-6 viewer matrix |
| Internal defects | SC-2 search exception (00:29, "second Esc blurs") vs 00:36 ("Layers: clear search → no-op") (D2-3). SC-15 says "any other confirm is overridden", but panels keep five other confirms (D2-8) |
| Readiness as written | SPEC COMPLETE (written scope), not VERIFIED (00:4) |
| Supported? | Yes, but it rules by override: "Panels keep their text until edited" (00:198). Every panel therefore carries known stale text (P40) |
| Missing | Header-height rule, row-height rule, toast copy pattern, dirty-guard dialog copy pattern, "Planned/Coming soon" wording. These are shared patterns with no SC row (see matrix) |

### Panel 01: Topbar
| Field | Finding |
|---|---|
| Purpose | "Which site, delivery state, leave/preview/review/publish" (01 §1) |
| Job | J2 + J3 (inferred). The doc states none |
| Location / geometry | Full width, top, 56h, grows with text. Zone widths, ≤1280 and ≤1024 compositions, reduction order and a second 56 row (01 §8). Scroll owner: none (wraps) |
| Primary action | Lifecycle CTA "Publish changes" / "Send for review" (01 §5.9) |
| Controls | Exit, site name + live dot, Site settings, Review chip, Comments, Presence, Bell, Preview, CTA, ⋯ (6 groups, ~16 rows). **Y** |
| States: present | role loading, viewer, owner view mode, reviews off, collab off, publish off, offline, non-Editor area, live-status loading/failed, modal open, CTA running/failed/success, notification count failure (01 §9, §5.7, §5.9) |
| States: missing | none material. Empty and many-items are N/A |
| Context menu | ⋯ Site menu, specific (01 §6). Grouping defect: "Unpublish site…" sits in the **Collaborate** group (01:141) (D2-4) |
| Keyboard / focus | Yes (01 §9, §5.10). F6 first, popovers return focus |
| A11y | Yes: accessible names, `aria-pressed`, never colour-only (01 §5.2, §5.4). No contrast or target-size line |
| Undo | N/A. Save status moves to 11 |
| Adjacent / return | 10 via SC-1 back. Preview SC-8 origin-named back. 12 Review/Publish. 11 status |
| Readiness written vs content | SPEC COMPLETE, not VERIFIED. **Supported**, apart from stale bits: §4 diagram "Waiting · Sara" (D2-5), §10 "optional people popover" (D2-6) |
| Missing to advance | JTBD line; refresh the stale diagram and preservation rows; target sizes (⋯ 28, Exit 28h, pill 24h); measured fit at 1024/1280 |

### Panel 02: Left rail
| Field | Finding |
|---|---|
| Purpose | "Permanent map of the editor" (02 §1) |
| Job | S / J1 navigation (inferred) |
| Location / geometry | Left, 56 fixed. Item 48×52. Help pinned. One scroll region at short height. Content height 374 computed (02 §9) |
| Primary action | Navigate to a destination |
| Controls | Add, Layers, Assets, CMS, Brand, Help popover (exactly 2 rows). **Y** |
| States: present | viewer (disabled with reason), owner view mode (hidden), role loading, workspace load failure, reload/migration, coach, short height, 200% text, guard failure Retry/Stay (02 §7, §10) |
| States: missing | none material |
| Context menu | None (N/A) |
| Keyboard / focus | Yes. Toolbar of buttons, roving, Enter activates (02 §8) |
| A11y | Yes: `nav` landmark, `aria-current`, focusable disabled, never colour-only (02 §6, §8) |
| Undo | N/A |
| Adjacent / return | Areas 07/08/09; Add/Layers restore exact Editor origin; contextual deep links keep origin back (02 §6.1) |
| Readiness written vs content | SPEC COMPLETE. **Supported** |
| Missing to advance | JTBD line; label truncation copy for 48px labels; verify coach re-anchor (02 §13) |

### Panel 03: Add
| Field | Finding |
|---|---|
| Purpose | "Put something new on the current page, exactly where I expect" (03 §1) |
| Job | J1 (inferred) |
| Location / geometry | Left panel 284 / 260–360 bounded resize. Header 44, search 32 sticky, one list scroll. Rows 32, sub-heads 24, block grid 2 columns (03 §8) |
| Primary action | Insert (click/Enter or drag) |
| Controls | Header ⋯ (Paste HTML), search, CMS fields, Favorites, Recent, Elements (37 + toggle), Sections (8), Catalog (14), Saved (3 scopes), Page templates link, Manage components. **Y** |
| States: present | viewer, locked target, no page/loading, catalogue unavailable, nesting-invalid reason, library failure, library empty, no results, saved empty, stale target, panel collapsed (03 §9, §5, §6) |
| States: missing | **offline** (library adopt/insert while offline); **many items** in Library (no paging or virtualization specified); long item names |
| Context menu | None on rows; header ⋯ only. Replace with block lives in the canvas menu |
| Keyboard / focus | Yes. ARIA grid, F favourite, `/` focus, focus stays in Add after insert (03 §10, §5) |
| A11y | Yes. Single status line, WCAG 2.5.7 non-drag path |
| Undo | One step per insert; Generate one step (inactive under SC-21) (03 §5) |
| Adjacent / return | Templates and Components with "‹ Back to Add" exact restore (03 §6.6); Asset picker in place; Inspector highlights the row (06 A7) |
| Readiness written vs content | SPEC COMPLETE. **Supported**. Card width 120 conflicts with computed ≈126 (D2-32) |
| Missing to advance | JTBD; Library scale and offline states; card geometry fix |

### Panel 04: Layers
| Field | Finding |
|---|---|
| Purpose | "What is on this page, how nested; select, rename, reorder, lock, tidy" (04 §1) |
| Job | J1 (inferred) |
| Location / geometry | Left panel 284/260–360. Header 44 "Layers · {page}", search 32, footer 32, one scroll, virtualized >300. Indent capped at 4 levels. 260 width budget computed (04 §5, §10) |
| Primary action | Select / reorder |
| Controls | Header ⋯ (4), search, ≡ display (5), row parts, two row actions, context menu (~17), footer select mode. **Y** |
| States: present | loading skeleton, error + Retry, empty page + Add, no results, rejected drop, viewer, locked, multi-select mixed summary, 5,000-node scale, long names (indent cap, tooltip, path subtitle) (04 §11, §8, §9) |
| States: missing | **inherited lock** for descendants (SC-14 00:269) (D2-11); offline N/A (local) |
| Context menu | Specific, drawn from SC-3, but it adds Show on canvas, Copy link and Paste into/after, which are absent from SC-3 (D2-14) |
| Keyboard / focus | Yes, full: tree keys, ⌥↑/↓ moves, Shift+F10, type-ahead (04 §10) |
| A11y | Yes: flat treeitems with level, setsize, posinset; every marker has a name (04 §5, §10) |
| Undo | Per op one step. Dim has no undo (view preference) (04 §6) |
| Adjacent / return | Canvas Show in Layers ⇧L; Inspector Visibility "Hide on live site… →"; Move to page → Go to page; empty → Add |
| Readiness written vs content | SPEC COMPLETE. **Supported**, apart from the SC-14 marker and the Esc conflict (D2-3) |
| Missing to advance | JTBD; inherited-lock marker; registry alignment; contrast for 50%-opacity dimmed rows (D2-30) |

### Panel 05: Canvas + canvas toolbar
| Field | Finding |
|---|---|
| Purpose | "See the page at a breakpoint, select precisely, edit directly, know what and where" (05 §1) |
| Job | J1 (inferred) |
| Location / geometry | Canvas column. Toolbar 44 above (88 in two rows when the column is <720). 5-step collapse order. Wrapper 24 gutter. Desktop frame 1440. Scroll owner: canvas viewport (pan/zoom) (05 §9) |
| Primary action | Direct manipulation / inline edit |
| Controls | Undo/Redo, return chip, breadcrumbs, segments, width field, zoom, View ▾, Record ▾; selection toolbar; context menu; format bar. **P**: the context menu is "CV-16 kept + Show in Layers" and is not recomposed to SC-3 (D2-15); the selection toolbar does not cover multi-select per SC-17 (D2-12) |
| States: present | empty (→ Panel 16), loading, render error (NEW), locked, viewer, comment mode, Time Travel, Compare, source picking (05 §8) |
| States: missing | offline; site failed to load (owned by Panel 22 OD-1, not cross-referenced); very long page / many elements performance; selection lost when a peer deletes the element |
| Context menu | CV-16 list plus SC-3 by override. Generic grouping (Arrange ›, Style ›, Structure ›) |
| Keyboard / focus | Yes: Esc ladder, keyboard resize, F6, toolbar landmark (05 §6, §10) |
| A11y | Partial: live region for selection, breadcrumbs `nav`, handle names. No canvas-overlay contrast line |
| Undo | Yes: named Undo, gesture-only Esc, one step per gesture (05 §5, §6) |
| Adjacent / return | SC-7 return chip; Layers ⇧L; Inspector; bottom bar pages; Preview SC-8 |
| Readiness written vs content | SPEC COMPLETE. Mostly supported. ⌘Z behaviour depends on ⛔ U-1 (00:128) but the status does not say "blocked by" (D2-2) |
| Missing to advance | JTBD; SC-3/SC-17 recomposition; toolbar fit while a task docks at 740 (D2-18); offline and peer-delete states |

### Panel 06: Inspector delta
| Field | Finding |
|---|---|
| Purpose | Overlay that keeps FD-INS-02/03 consistent with FD-DYN-01 and Panels 01–05 (06 header) |
| Job | J1 + S (CMS) (inferred) |
| Location / geometry | Right, 300 fixed (INS-D07). Overlay at ≤1366 "obscures 312" (05 §9, 06 B5); +12 inset not stated (D2-17). Source picker 280 floats left |
| Primary action | Edit / bind properties |
| Controls | Delta only (bind icon, chip, Unbind ×2, Dynamic bindings summary, Conditions). **P** by design: the base must be read too (06 §7) |
| States: present | viewer (C4), locked (A9), legacy conditions (B8), previewed record (C1), tab switch with subview (C2) |
| States: missing | SC-13 per-breakpoint override dot, "Tablet" label, Reset and first-time note (00:263-266) are not mapped into the base (D2-13) |
| Context menu | Header ⋯ = SC-3 registry (C7) |
| Keyboard / focus | Esc C6; focus rules A7, C2, C3 |
| A11y | Not in delta; base owns it (UNKNOWN here) |
| Undo | Gesture-live values commit as one step (C9); Unbind |
| Adjacent / return | CMS "‹ Back to Heading" restores the subview (C3); Asset picker (B6); Dynamic pages (C5) |
| Readiness written vs content | SPEC COMPLETE (written scope). Supported only as a delta. The annex JSON is "superseded but not rewritten" (06 §7), so the implementation has two sources |
| Missing to advance | SC-13 mapping; one merged Inspector spec, or a rule for which annex rows are dead |

### Panel 07: CMS area
| Field | Finding |
|---|---|
| Purpose | "Where content lives" (07 §1) |
| Job | J3 + S (CMS at scale) (inferred) |
| Location / geometry | rail 56 + nav 240 (200–280) + work flex + detail 320. Record subview 720–960, preview 420 or toggle. Rows 40. Horizontal table scroll when needed. ≤1280 nav overlay (07 §11) |
| Primary action | Tab-following header button (+ Add record / + Add field); Save record in the subview |
| Controls | 4 tabs, table, Status filter, column picker, search, sort, bulk, record form (16 types), ⋯ imports, Dynamic pages form, settings, Data. **Y** |
| States: present | no collections, no records/fields/matches, load failed + Retry, saving/queued/saved/failed/conflict, offline, role refusal, collection page missing, field-usage refusals, preflights (07 §11, §5–8) |
| States: missing | **loading** (not listed in §11); success for bulk is present; **where a deleted collection's Recently deleted lives** (D2-31) |
| Context menu | Row menu (Delete) + collection ⋯ (imports, Planned providers). Specific but thin |
| Keyboard / focus | ⌘S record-scope rule; Esc topmost; rows focusable (07 §11) |
| A11y | **Thin**: no table ARIA, sort announcement or column-picker semantics |
| Undo | CMS live recovery toast; E-1/E-2/E-3 typed confirms; exact Restore pending endpoint (07 §5, §8) |
| Adjacent / return | "Edit collection page ›" back to CMS · Dynamic pages; Conditions Locate → Inspector; picker dialog; Site settings › Redirects |
| Readiness written vs content | "SPEC COMPLETE · blocked by field tombstone + collection undelete": matches SC-9 ⛔ (00:112-113). **Supported** |
| Missing to advance | JTBD; loading state; table a11y; Recently-deleted placement for collections; permanent-delete confirm type (D2-9) |

### Panel 08: Assets area + pickers
| Field | Finding |
|---|---|
| Purpose | "Find, upload, organise, improve files, put the right one in the right place" (08 §1) |
| Job | J1 + S (inferred) |
| Location / geometry | Area: nav 240 + library flex + detail 320 + footer 32. Picker 284 (Editor). Dialog 720/480/960. Grid cells 120–160, rows 40. ≤1280 nav overlay (08 §10) |
| Primary action | Upload ▾ / Place on canvas (area); Insert / Replace (picker) |
| Controls | Nav (6 + Recently deleted), toolbar (search, Type, Tag, Sort, view, density, Upload ▾), detail tabs (Details/Usage/Versions), actions (~12). **Y** |
| States: present | no assets, no results, truncated, search failed, offline banner, quota 90%, asset missing, stock not configured, upload progress/pending/failed (FI-03), viewer read-only (08 §9, §5, §8) |
| States: missing | loading (AS-13 skeleton is not restated in the target); picker-empty is not restated |
| Context menu | Specific (08 §4.2); Download added everywhere |
| Keyboard / focus | Yes: grid pattern, Space/Enter, `/` search, Esc rule (08 §10) |
| A11y | Yes (grid fix). No contrast line for thumbnails or labels |
| Undo | Replace across site one Undo; delete E-4 confirm until U-4, then Undo + Recently deleted (08 §6) |
| Adjacent / return | Picker returns to the prior panel; CMS stays active; Brand "Manage site fonts ›"; Site settings "Choose from Assets" |
| Readiness written vs content | "SPEC COMPLETE · blocked by FI-03 persistence": matches SC-9 ⛔ (00:135). **Supported** |
| Missing to advance | JTBD; SC-11 copy ("Not saved to library", D2-24); loading row |

### Panel 09: Brand area
| Field | Finding |
|---|---|
| Purpose | "Define my site's look once and see what each change touches" (09 §1) |
| Job | S (consistency) / J1 (inferred) |
| Location / geometry | nav 240 + body flex (title max 700) + preview 360–520 (468). Header 56. Body <480 → detail replaces list. <1280 preview → header toggle (09 §8, §11). Preview width rule self-contradicts (D2-19) |
| Primary action | Page primary (+ Add color / Run checks / Apply starter) |
| Controls | 3-group nav, header (Undo/Redo, Review changes, Restore points, primary), token cards per kind, tools. **Y** |
| States: present | viewer, migration read-only, empty first run, load error, usage unknown, restore point unavailable, preview locked (09 §10, §8) |
| States: missing | **loading**; **offline / autosave failure** (Brand autosaves, but no "couldn't apply" state; SC-4 only gives the status text); large-token-set performance (09 §14 not verified) |
| Context menu | Card menu Rename / Delete / Reset (specific) |
| Keyboard / focus | Esc topmost-only, token table one Tab stop (09 §11) |
| A11y | Thin: inert behind, nothing on the colour picker or contrast-check UI itself |
| Undo | Header Undo/Redo on the shared document stack; restore points (09 §5) |
| Adjacent / return | Inspector "Edit token ›" → "‹ Back to {element}"; Assets › Fonts; Add Sections link |
| Readiness written vs content | SPEC COMPLETE. Mostly supported. ⌘Z depends on ⛔ U-1 (D2-2). T-BR-05 tests AI without the SC-21 note (D2-27) |
| Missing to advance | JTBD; loading and offline/apply-failure states; preview width rule |

### Panel 10: Site settings area
| Field | Finding |
|---|---|
| Purpose | "Configure how this site behaves and know when each change takes effect" (10 §1) |
| Job | J3 (inferred) |
| Location / geometry | No rail active. nav 240 + content max 960, forms 720, stack <640. Header 56, footer 48. ≤1280 nav overlay. Dialogs 640 (10 §9) |
| Primary action | Save settings (staged); per-action immediate operations |
| Controls | All existing screens kept + scope chip, Choose from Assets, Spam/Archived, Planned cards. **Y** (by reference to existing) |
| States: present | checking access, could not verify, demo, below role, viewer, plan restriction, site locked, over-limit, server refusal, saving/saved/failed/conflict, Needs attention (10 §5–7) |
| States: missing | **offline Save** (staged and immediate); loading is only implied by the existing footer "Loading" |
| Context menu | None |
| Keyboard / focus | Esc topmost; focus to first invalid; code-field Esc (10 §10, §7) |
| A11y | Partial |
| Undo | No document undo (OD-U2); redirect Undo toast; Languages locale confirm conflicts with SC-15 (D2-8) |
| Adjacent / return | Topbar door, SC-1 back, Publish/Preview save guard, Form submissions → Inspector with return |
| Readiness written vs content | "SPEC COMPLETE · blocked by settings revision stamp + access gate": matches SC-9 ⛔ (00:125, 133). **T-ST-04b contradicts the mandatory interim guard** (D2-7) |
| Missing to advance | JTBD; fix T-ST-04b; offline states |

### Panel 11: Pages, bottom bar, status
| Field | Finding |
|---|---|
| Purpose | "Which page / take me to another; is my work safe" (11 §1) |
| Job | J1 + S (never lose work) (inferred) |
| Location / geometry | Bottom bar 32h, full width. Strip tabs 24h. Status max 280. Manager sheet 560/720 × min(vh−48, work−24), header 56, footer 48. Page settings 720. Popover 360 (11 §10) |
| Primary action | Open page (strip / row); + Add page |
| Controls | Pages button, strip, status button, Details ⌄; manager header/body/footer/row menu/bulk; page settings. **Y** |
| States: present | viewer, loading, load error, one page, 100+ pages (virtualized), plan-locked pages, capacity, six status states + details (11 §9, §8, §6) |
| States: missing | offline for manager writes (rename/delete while offline); Assets interim "Image not uploaded yet" is not in the status list (D2-34) |
| Context menu | Row menu specific; no strip menu (deliberate, IA-05) |
| Keyboard / focus | Yes: toolbar strip, F2/⌘D/⌫, Esc to Pages button (11 §11) |
| A11y | Yes: navigation buttons with `aria-current`, not tabs |
| Undo | Page delete Undo + Recently deleted, carrying the warnings (11 §5–6) |
| Adjacent / return | Templates "‹ Back to Pages"; CMS Dynamic pages; History (Versions ›) |
| Readiness written vs content | SPEC COMPLETE. **Supported** (receipt registry is a fallback, not ⛔) |
| Missing to advance | JTBD; offline writes; status text for the FI-03 interim; strip tab 24h target-size check |

### Panel 12: Right task host
| Field | Finding |
|---|---|
| Purpose | "Inspector or exactly one named task, with a clear way back" (12 §1) |
| Job | J2 + J3 (inferred) |
| Location / geometry | ≥1367 docked 360 (320–420); 1281–1366 overlay 360 + 12 inset; ≤1280 sheet min(560, avail−24). Header 48. Footer 48 only with actions. One body scroll (12 §4.5) |
| Primary action | Per task (Publish CTA, Review composer) |
| Controls | Host: title, scope, back, ✕, resize splitter. **P**: interiors are delegated (Publish → 14, Review → 17, others "kept") |
| States: present | viewer, publish flag off, reviews off, AI not configured, task load failure, read-only owner (12 §6); per-task guards (§4.3) |
| States: missing | per-task empty and offline are not restated; Activity "Load more" failure |
| Context menu | Task ⋯ menus existing (RT-10/11/12) |
| Keyboard / focus | Yes: one-layer Esc, focus to title, return to invoker (12 §4.4) |
| A11y | Landmark named per task (12 §4.2) |
| Undo | History task; "Undo this run's N changes" (inactive); Issues fix Undo |
| Adjacent / return | NAV-02 Back vs Close semantics; Compare/Time Travel; origin stack for Issues/Review |
| Readiness written vs content | SPEC COMPLETE for the host. Interiors rely on 14/17 |
| Missing to advance | JTBD; per-task empty/offline table; canvas toolbar fit at 740 (D2-18) |

### Panel 13: Components area
| Field | Finding |
|---|---|
| Purpose | "Make once, reuse on any page/site, keep consistent, move as a file" (13 §1) |
| Job | S (consistency) / J1 (inferred) |
| Location / geometry | No rail active. nav 240 + list flex (rows 40) + detail 320; subview 720–960; dialogs 720/480/960, vh−48; ≤1280 nav overlay (13 §10) |
| Primary action | + Create / Insert |
| Controls | Nav (3 sections + Import + Recently deleted), search, sort, row ⋯ (5), detail actions (~9), create modal, export/import dialogs. **Y** |
| States: present | empty per section, loading, error + Retry, library failure, restricted, capacity 80/100, import cancelled/interrupted/unknown/resuming (13 §10, §5, §8) |
| States: missing | offline; many items (library paging not stated); long names |
| Context menu | Row ⋯ specific; detail ⋯ |
| Keyboard / focus | Roving list, focus to header, Esc rule (13 §10) |
| A11y | Partial (focus ring fix, 32 min buttons) |
| Undo | Undo toast + Recently deleted; Undo import conditional (13 §6, §8) |
| Adjacent / return | Add "‹ Back to Add"; Inspector "Edit main component" "‹ Back to {instance}"; canvas Choose on canvas (05 §8) |
| Readiness written vs content | SPEC COMPLETE. §7/§8 are new engineering (revisions, packages). Fallbacks given. Keeps an Update-from-selection confirm against SC-15 (D2-8) |
| Missing to advance | JTBD; SC-11 noun cleanup ("master" ×13, "Library ·"); offline; confirm alignment |

---

## 3. Per-screen audit detail (panels 14–25)

### 14 Publish
| Field | Finding |
|---|---|
| Documented purpose | "What will go live, is it safe, and did it work?" (14 §1) |
| Job served | Job 3 "publish safely"; north star (14 §3, 00-STRATEGY §6) |
| Location / host + geometry | Right task 360 (Panel 12 host), header 48, footer 48; review-and-publish dialog 720 bounded; topbar CTA states (14 §4.1–4.3, §8). NOT MEASURED |
| Primary action | Footer "Publish changes" (lifecycle verb), then dialog "Publish" (14 §4.1, §4.3) |
| Controls listed | **Y**: status card, What will change, Checks + Fix ›, Approval, Goes to, footer CTA, header ⋯ (All releases, Unpublish), dialog sections 1–5. Mock §4.1 omits the ⋯ described in text (14:89) |
| States present | empty (no changes / first publish §5.1), loading (Checking… §6), error (checks failed, §7 failure table), permission (viewer/EDITOR/ADMIN §6), offline (§6, running "Reconnecting…"), success (§5.5), partial ("live but recording failed" §5.5; "Edits this session" fallback §4.1), locked-on-Free (§6) |
| States missing | long-content: only "long domains wrap" (§8); many-items: no overflow or limit for the Checks list (13+ rows), and the change list "See all ›" target is not fixed (§4.1 vs §5.1 "rows open Compare") |
| Context menus | Header ⋯ (14:89); no row menus |
| Keyboard / focus spec | Y (§8: U opens; focus to header, first unchecked box, outcome heading; no publish key) |
| a11y spec | Y (aria-disabled + reason, progressbar values, polite/assertive split, glyph states) |
| Undo / history spec | P. Not undoable by design; recovery = republish (§5.6, 24 row 46). Unpublish uses a typed confirm |
| Adjacent screens & return | Fix › in Editor keeps the task, no chip; Fix › elsewhere opens that area with Publish in the tray, back per SC-1 (§5.2, SC-7); History › Published; Review gate banner → Open Review; Site settings › Domains |
| Readiness label vs content | "SPEC COMPLETE · blocked by P-1, FI-03, Access gate; plan rows TR-7, TR-12". Content matches. ⛔ rows are named |
| Missing for VERIFIED / hi-fi | P-1 ⛔ shipped; no Figma board; Checks overflow rule; "See all ›" destination; geometry measured |

### 15 Templates
| Field | Finding |
|---|---|
| Documented purpose | "Which ready-made page layout, and does it go to a new page or this page?" (15 §1) |
| Job served | Job 1 (15 §3) |
| Location / host + geometry | In-shell **area**: header 56, local nav 240, cards 226 + 16 gap; ≤1280 nav collapses to a dropdown; preview fills the work area (15 §4, §7) |
| Primary action | Mode-matched: Create page / Replace {page} in the preview header (15 §4.1) |
| Controls listed | **Y**: back, title + site, search, Show filter, Recent, mode bar + Change ›, grid cards, preview devices, Used on, header ⋯ Reload, Saved card ⋯ Rename/Delete |
| States present | loading (skeleton), empty (no match; empty Saved), partial (saved syncing/failed), error (render error, apply failure §5.2, stale target §5.2a), permission (EDITOR+, viewer, unknown role), offline (assumption §6), success (toast §5.2), running/timeout (§5.4), Pro/plan (§6) |
| States missing | long-content (long template or page names in the mode bar and cards) not specified; many-items only via the category rule (≥12, §4) — no grid paging or virtualisation note for 12+ iframes (flagged as unverified render cost in §12) |
| Context menus | Saved card ⋯ (Rename after T-3, Delete); header ⋯ (Reload catalogue) |
| Keyboard / focus spec | Y (§7: focus into search, preview primary, Back restores card focus; Esc ladder §4.1) |
| a11y spec | Y (card group not nested buttons, accessible name formula, inert thumbnails, radiogroup, polite counts) |
| Undo / history spec | Y: Replace = backup + Undo; Create Undo after T-4 (confirm until then); saved-template delete Undo — but the mechanism over a hard server delete is unspecified (see D3-24) |
| Adjacent screens & return | One door contract with origin-based Back (§5.1 table): Pages, Add, empty canvas, ⌘K, T |
| Readiness label vs content | "SPEC COMPLETE · not VERIFIED", but T-TP-13 (Pro templates) depends on ⛔ P-TRIAL with no "blocked by" (D3-18) |
| Missing for VERIFIED / hi-fi | T-5 Figma board 4418:54134 update; T-1/T-2/T-4; offline behaviour (an assumption, and it contradicts 22 — D3-2) |

### 16 First run
| Field | Finding |
|---|---|
| Documented purpose | "What do I do first, and how do I see a result fast?" (16 §1) |
| Job served | Activation (00-STRATEGY §5); job 1 |
| Location / host + geometry | Empty-canvas prompt (canvas centre); RailCoach anchored to the rail; checklist pill 32h at bottom-left, 12 above the bottom bar, 12 right of the rail; list ≤360h upward; ≤1366 collapses to a 32×32 icon (16 §4.1–4.3) |
| Primary action | Template card → that template's preview (16 §4.1) |
| Controls listed | **Y**: 3 cards, Browse all, + Add a section, Start blank (Describe hidden by SC-21), RailCoach Got it, 7-step checklist with buttons, pill, toast "Next ›", Help popover rows |
| States present | empty (subject), loading (nothing counts), partial (eligible count, ineligible with reason), error (onboarding server unreachable), permission (viewer, zero eligible), offline (tick queue), success (achievement, finished), reduced motion |
| States missing | long-content and many-items N/A. AI-unavailable is a decided hide (SC-21) |
| Context menus | None |
| Keyboard / focus spec | Y (no focus move; toast reachable in the bottom-bar F6 region; Esc dismisses RailCoach) |
| a11y spec | Y (`role=status` polite, announcement text T-FR-16) — but it conflicts with 22's toast live-region rule (D3-3) |
| Undo / history spec | Y (dismiss = toast Undo; no confirm, SC-15; 24 row 56) |
| Adjacent screens & return | Cards → 15 preview (Back "‹ Back to Editor · {page}"); Add a section → 03; checklist buttons → Brand, Pages, Review, Publish; Help → 18 popover |
| Readiness label vs content | "SPEC COMPLETE · not VERIFIED". F-1 = ⛔ A-1 is declared as "blocks Panel 25 events only" (SC-9). Consistent |
| Missing for VERIFIED / hi-fi | F-5 Figma board 4428:44164; F-2 server dismissal; 5-user test (00-STRATEGY §7); toast-stack rule reconciled with 22 |

### 17 Client review
| Field | Finding |
|---|---|
| Documented purpose | Designer: "what does my client think, am I cleared"; client: "what am I looking at, how do I comment and approve" (17 §1) |
| Job served | Job 2 "Get approval" (17 header) |
| Location / host + geometry | Dashboard page `/review/<token>`: header 56 (phone 48), side 360, footer 64 sticky, no horizontal scroll from 320 to 1920. Editor Review task 360, rows 32/48 (17 §4.1–4.3, §8) |
| Primary action | Client: Approve Round n (with code, OD-R7). Designer: footer "Send Round n+1 to {client}" (17 §4.3) |
| Controls listed | **Y**: device switch, Add comment / crosshair, pins, comments panel + filter, general note, footer actions; task round card, Client/Team/All filter, audience toggle, composer, Next ›, Locate ›, Resolve, ⋯ actions |
| States present | Client page: loading, identify, open, no snapshot, answered, dead (4 kinds), already answered, offline, rate-limited (17 §6). Task: loading, error, never-sent, all-resolved, revoked, expired, viewer read-only, locked-on-Free |
| States missing | long-content: comment ≤2000 is set, but truncation in task rows and client list rows is not. many-items: filter + page grouping exist; no list cap or paging for long threads (P) |
| Context menus | Review task ⋯ (Compare rounds, Round history, Open link, Re-send, Revoke) (CR-14 kept) |
| Keyboard / focus spec | Y (keyboard crosshair 8/40 px, Enter/Esc, scoped C key + toggle, Approve confirm traps/returns focus) |
| a11y spec | Y (landmarks, pins as buttons linked to rows, crosshair position announcement, polite/assertive split) |
| Undo / history spec | Y (resolve → toast Undo OD-U7; revoke = declared SC-15 confirm; approval not withdrawable OD-R6) |
| Adjacent screens & return | Edit {element} → canvas chip "‹ Back to Review" (SC-7); Publish gate banner and Approval row (14); bell rows (22 §5.11); Locate › (SC-19) |
| Readiness label vs content | "SPEC COMPLETE · blocked by R-4, R-11" — matches SC-9 ⛔ rows |
| Missing for VERIFIED / hi-fi | No Figma boards for §4.1–4.3 (17 §14); R-2/R-3 for pins and replies; OD-R4 security review; real-device pan/pinch |

### 18 Command palette, shortcuts sheet, Help
| Field | Finding |
|---|---|
| Documented purpose | "How do I get to it, and what keys does it have?" (18 §1) |
| Job served | All three; "Build fast" most (18 §3) |
| Location / host + geometry | Palette 640w, top 48, max-h min(800, 100vh−96), rows 32, footer 32. Sheet 720 bounded, header 56, max-h 80vh. Help popover 240 (18 §8) |
| Primary action | Enter runs the highlighted row (18 §5.5) |
| Controls listed | **Y**: input, scope chip, groups in canonical order, nested levels, Show all, footer hints; sheet search, platform toggle, single-key toggle, BASICS; Help 2 rows |
| States present | empty (first use, no match), loading (components, records), partial (group fetch failed), error (action fails after Run), permission (viewer, view mode, locked on Free), offline, modal open, session expired, success (focus to destination) |
| States missing | long-content: rows wrap at 200% only (P); long result lists are handled by ≤5 per group + Show all (Y) |
| Context menus | None (palette is itself a command surface) |
| Keyboard / focus spec | Y (most complete in the set: ↑↓, →, Backspace levels, Esc at any level, Tab not on rows, focus return) |
| a11y spec | Y (combobox/listbox, aria-activedescendant, reason ≥4.5:1, count announced, single-key toggle WCAG 2.1.4) |
| Undo / history spec | Y (Clear history: E-5 confirm until K-8, then Undo; destructive actions via Undo) |
| Adjacent screens & return | Areas via SC-1 direct entry; tasks per Panel 12; templates → 15 preview; Help → 16 checklist |
| Readiness label vs content | "SPEC COMPLETE · blocked by P-TRIAL (T-CP-07 only)" — matches |
| Missing for VERIFIED / hi-fi | No target Figma boards; three-browser key acceptance (Ctrl+K on Windows); K-1/K-2 |

### 19 Interactions
| Field | Finding |
|---|---|
| Documented purpose | "What moves on my visitor's page, when, and will it look the same live?" (19 §1) |
| Job served | Job 1 "Build"; job 3 (19 §3) |
| Location / host + geometry | Inspector › Behaviour section, 300 wide, rows 32, Play 24×24, picker 2 columns (19 §4.1, §8) |
| Primary action | "+ Add interaction" → preset (19 §4.2) |
| Controls listed | **Y**: row (play/trigger/effect/state/drill), Add picker (7 presets + custom triggers), editor fields (Trigger, Effect, Animate, Timing, Repeat, When, Reverse, Plays on), ⋯ (Duplicate/Disable/Delete/Preview reduced motion), CSS animation editor |
| States present | empty (no interactions), permission (locked, site locked, viewer, multi-select), error (unknown trigger, target missing, hidden at breakpoint), legacy, success (toast, Play finished), plan (no gate) |
| States missing | **loading** (none), **offline** (none — probably N/A, not stated), many-items (list scroll and order not specified beyond "no reorder"; a >20 Tip exists), long-content (long names) N |
| Context menus | Editor ⋯ (19 §4.3) |
| Keyboard / focus spec | Y (Esc ladder §4.2, focus after add/delete, arrows in picker groups) |
| a11y spec | Y (named controls, aria-pressed, announcements; customer-output WCAG 2.2.2/2.3.1/2.3.3 rules) |
| Undo / history spec | Y (one step per discrete choice; commit on Enter/blur; delete toast Undo) |
| Adjacent screens & return | Entries from SC-3 surfaces + ⌘K; Pick on canvas uses the source-picking banner (05 §8); Issues and Publish rows → the row (§5.8) |
| Readiness label vs content | "SPEC COMPLETE · blocked by IXD-3, IXD-4" — matches. But 00-STRATEGY §8 still lists "interactions authoring" as Later (D3-12) |
| Missing for VERIFIED / hi-fi | Figma boards not opened (4428:142686 / 4418:109686); IXD-3/IXD-4 ⛔; preset and threshold values are *(DS)*, not validated |

### 20 AI — DEFERRED (SC-21)
| Field | Finding |
|---|---|
| Documented purpose | One AI contract (20 §1) — kept for the future "Build" tab |
| Job served | Job 1 accelerator (20 header) |
| Location / host + geometry | Hosts of others (AI task 360, Generate 284) (20 §8) |
| Status vs content | Header "DEFERRED — not in this version" + §0 mechanism (flag `NEXT_PUBLIC_FEATURE_AI` off, background hooks unmounted, wizard AI path hidden, AI-D1 role check still ships). **Deferral is cleanly stated in 20 itself and in SC-21.** OD-AI-1…4 deferred with the panel (20:308-311) |
| Leaks into other panels' this-version specs | 3 Major, 5 Minor — see the table below |

**AI-leak sweep (grep of all of P; lines already marked SC-21/inactive/hidden excluded):**

| # | File:line | Text | Verdict |
|---|---|---|---|
| L1 | 12-RIGHT-TASK-HOST.md:142 (T-RT-09) | "Saves inline compare still shows Visual/Semantic/**AI summary**" | **LEAK (Major)** — the acceptance test asserts a hidden AI surface; contradicts 12:96 ("AI summary is hidden in this version") and SC-21 ("History AI summary" hidden) |
| L2 | 12-RIGHT-TASK-HOST.md:96 | History target keeps "**milestone banner**" | **Probable leak (UNKNOWN)** — AI-12 milestone suggestion is a background AI hook that is not mounted while the flag is off (20 §0, SC-21). If this banner is the AI suggestion card, it must be marked hidden |
| L3 | 23-PLANS-AND-TRIAL.md:124 (§4.5) | Upgrade dialog "Benefit rows are generated from `PLAN_LIMITS` FREE→PRO deltas" | **LEAK (Major)** — PL-01 deltas include AI prompts/day 10→200 and AI generations/month 3→20 (23:22). There is no exclusion rule, and SC-21 hides "AI copy in plan/upgrade dialogs". The mock omits AI, but the generation rule would print it |
| L4 | 09-BRAND.md:88 | "Brand from logo/URL" kept as an active subtask | **Ambiguous (Minor)** — 20 §1 says it is not AI, but 20 §4.7 says "dsAi flag off → From logo/URL hidden", and SC-21 hides "Brand DS-AI entries". Whether it ships this version is undecided |
| L5 | 16-FIRST-RUN.md:110-111, 155 (F-3), 168 (T-FR-09) | "AI site arrives" flow and seeding | **Scope gap (Minor)** — the wizard AI path is hidden (AI-14, 20 §0), so no new AI sites arrive this version. The flow is still needed for legacy AI sites, but it is not marked as such |
| L6 | 12-RIGHT-TASK-HOST.md:107 | State row "AI not configured / quota — existing error states" | **Minor** — the file has an SC-21 header, but the row is not marked inactive |
| L7 | 12-RIGHT-TASK-HOST.md:70; 22-GLOBAL-STATES.md:140 | "all **six** tasks" | **Minor** — five tasks ship this version (AI hidden) |
| L8 | 00-SHARED-CONTRACTS.md:181 (SC-10 AI row), :228-229 (SC-11 "AI prompt", "AI site draft") | glossary and amendment rows | **Minor** — not marked inactive; other SC rows (SC-3, SC-12, SC-18) are |
| L9 | 13-COMPONENTS.md:28 | "AI `save-as-component`" door (today row) | Not a leak (today inventory, header present). The SC-21 hidden-entry list (00:337) does not name this door |
| L10 | 08-ASSETS.md (whole file) | No SC-21 header; one inline mark at :75 | OK. Background auto alt text (AI-09) is never mentioned in 08's upload flow, so no leak |
| — | 01:22,46; 03; 05:42; 18 CP-06/CP-10; 24 rows 48–50; 25 §4.6, `via ai`, `ai_quota` | — | Correctly marked, or today-only inventory rows |

### 21 Collaboration
| Field | Finding |
|---|---|
| Documented purpose | "Who else is here, what are they touching, is my work safe?" (21 §1) |
| Job served | Secondary user (agency teammates); jobs 1 and 3 (21 §3) |
| Location / host + geometry | Topbar presence cluster + People popover 320, rows 40; canvas outlines, cursors, tags; Follow frame + bar; Inspector line; typing confirm (21 §4, §8) |
| Primary action | Follow / Go there (People); passive presence otherwise |
| Controls listed | **Y**: cluster, pill, People rows, Follow, Go there, Hide my cursor, Manage members, Follow Stop, Wait / Edit anyway |
| States present | empty (solo), loading (Finding people…), partial (Phase A/B), error (Couldn't load people), permission (viewer before/after MP-7, EDITOR, ADMIN, plan-locked), offline/reconnect/resync/revoked (§5.6), many-items (10-cursor cap, room cap 25), success (join/leave announcements) |
| States missing | long-content (long names; duplicate names handled by surname initial) P |
| Context menus | None |
| Keyboard / focus spec | Y (Esc closes People, focus returns; Esc stops Follow, SC-2; Wait default focus) |
| a11y spec | Y (People is the screen-reader path; identity never colour-only; batched announcements) — but Offline is assertive here vs polite in 22 (D3-15) |
| Undo / history spec | Y (own changes only, skip on peer change, MP-8) |
| Adjacent screens & return | Go there = SC-1 direct navigation; Panel 10 banner layer 2; Panel 07 record banner; Panel 22 §5.5/5.7 access surfaces |
| Readiness label vs content | "SPEC COMPLETE · blocked by Phase A ⛔ MP-3/4/5, Phase B ⛔ MP-1/2/6/8" — matches. 00-STRATEGY §8 lists multiplayer as Later (D3-12) |
| Missing for VERIFIED / hi-fi | No Figma for People/Follow (21 §16); all MP ⛔ rows |

### 22 Global states
| Field | Finding |
|---|---|
| Documented purpose | "Is my work safe, can I keep working, what next?" (22 §1) |
| Job served | Supporting job "never lose work" (22 header) |
| Location / host + geometry | Severity ladder L1–L6 (22 §4.1): full-screen card 480; dialogs 480/720; **global banner slot** under the topbar, 40 min, full width, pushing content down; toasts 460; "N more" popover 360 (22 §4.2, §8) |
| Primary action | Per state (Sign in, Download a copy, Reload editor, Edit here…) |
| Controls listed | **Y**: banner + actions + "N more", card actions, dialog actions, toast rules, bell row behaviour |
| States present | All nine dimensions (the panel's subject): loading/boot, load failed, session, offline / can't reach, save failed, conflict, permission lost, deleted, version skew, crash, tabs, narrow/phone/browser, locked on Free |
| States missing | — (most complete). Trial-ended notice from 23 is absent from the banner list (D3-4) |
| Context menus | None |
| Keyboard / focus spec | Y (banners never move focus; dialogs focus primary; Esc per SC-2; F6 includes the banner slot) |
| a11y spec | Y (single `role=alert` owner; banners announce via pipes; never colour-only; 200% wrap) |
| Undo / history spec | P (recovery copy, Download a copy, Reload confirm; discard kept copy = SC-15 exception) |
| Adjacent screens & return | 11 §8 status opens dialogs; bell rows open in place (SC-1/SC-7); 14 P-3 resume |
| Readiness label vs content | "SPEC COMPLETE · blocked by G-2, G-12" — matches |
| Missing for VERIFIED / hi-fi | G-1…G-12; reconcile the toast rule with 16 and the banner list with 21/23 |

### 23 Plans and trial
| Field | Finding |
|---|---|
| Documented purpose | "What does my plan let me do here, and what if I go past it?" (23 §1) |
| Job served | Job 3; job 1 for limits (23 §3) |
| Location / host + geometry | ⋯ menu header chip row 32; Site settings Overview card max 720; Upgrade dialog 480; limit lines 12px; "Choose what stays active" (dashboard, size not given) (23 §4, §5.5a, §8) |
| Primary action | OWNER: "Choose Pro in Billing ↗"; others: "Ask the workspace owner to upgrade" |
| Controls listed | **Y**: chip states table, Pro chip, limit line, locked row, Upgrade dialog, trial-ended notice, active-set screen, Publish plan rows |
| States present | loading/unknown plan, permission (OWNER/others/viewer, role+plan), locked, trial live/ended, paid states incl. PAST_DUE/cancel/Business, offline, demo |
| States missing | many-items: "Choose what stays active" with many sites/pages has no search or scroll rule (P); empty N/A |
| Context menus | None (chip popover for non-owners) |
| Keyboard / focus spec | P (dialog focus → title, Esc; nothing for the active-set screen) |
| a11y spec | Y (aria-describedby limit line, aria-disabled, glyph + text, 4.5:1 tones) — trial notice `role=status` conflicts with 22 §8 (D3-4) |
| Undo / history spec | P (active-set save confirm; no undo stated; remove-protection has no Undo by design) |
| Adjacent screens & return | Billing in a new tab (IAF-14 G), refresh on focus (TR-3); 14 §5.2 rows; 22 banner 4b; 15 Pro templates |
| Readiness label vs content | "SPEC COMPLETE · blocked by TR-1, TR-2, TR-6, TR-7, TR-12, Access gate" — matches |
| Missing for VERIFIED / hi-fi | Stripe test-mode check (48 h rule); active-set screen geometry; AI exclusion rule for benefit rows (L3) |

### 24 Undo coverage
| Field | Finding |
|---|---|
| Documented purpose | "If I regret this, how do I get it back, and does ⌘Z do it?" (24 §1) |
| Job served | Supporting "never lose work"; health signal undo-after-delete (24 header) |
| Location / host + geometry | Cross-panel contract + one surface: Recently deleted (Pages sheet 560/720; Components detail column), rows 32; Undo/Redo 32×32 (24 §4.8, §8) |
| Primary action | Restore (Recently deleted); ⌘Z |
| Controls listed | **Y** for Recently deleted (entry, rows, Restore, bulk, Delete permanently, empty); matrix of 56 operations |
| States present | empty, loading, error, offline, permission (viewer, EDITOR, ADMIN+), read-only, refused undo, collab, plan lock, partial (component re-link) |
| States missing | long-content (long page or component names in rows) N |
| Context menus | Row ⋯ Delete permanently (ADMIN+) |
| Keyboard / focus spec | Y (listbox multi-select Space/⇧↑↓; focus after Restore; area-aware ⌘Z table §4.3) |
| a11y spec | Y |
| Undo / history spec | Y (subject) |
| Adjacent screens & return | "‹ Back to Pages" / "‹ Back to Components" (SC-1); "Open Editor to undo" (§4.3); History › Session labels (12 RT-12) |
| Readiness label vs content | "SPEC COMPLETE · blocked by U-1 (rows 20/23 …; MP-8)" — matches |
| Missing for VERIFIED / hi-fi | U-1 ⛔ interim guard; U-7 page soft delete (Page has no `deletedAt`); no Figma for Recently deleted |

### 25 Analytics events
| Field | Finding |
|---|---|
| Documented purpose | Single list of product events (25 §1) |
| Job served | All three (metrics, 00-STRATEGY §6) |
| Location / host + geometry | Not a UI; one row in Account settings › Privacy (25 §6.4) |
| Primary action | N/A (opt-out toggle) |
| Controls listed | P — opt-out row copy given; no layout |
| States | N/A for UI; delivery offline queue, de-dup, drop-and-count (25 §6.5, T-AN-14) |
| Context menus / keyboard / a11y | N/A |
| Undo / history spec | N/A |
| Adjacent screens & return | Account settings › Privacy (dashboard) |
| Readiness label vs content | "SPEC COMPLETE · blocked by A-1, A-3, A-4" — matches |
| Missing for VERIFIED / hi-fi | `publish_blocked` enum missing the motion row (D3-1); stale owner column (D3-14); legal gate |

---
