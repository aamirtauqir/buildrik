# D2: per-screen design-spec audit, Panels 00–13

Audit only. Spec level. No hi-fi exists. Paths are relative to `P = docs/audit-and-design-2026-10-16/panels/`.

## Scope read

| File | Lines read | Notes |
|---|---|---|
| P/00-STRATEGY.md | 1–49 (full) | JTBD §3, loop §4 |
| P/00-SHARED-CONTRACTS.md | 1–360 (full) | SC-1…SC-22 |
| P/01-TOPBAR.md | 1–253 (full) | |
| P/02-LEFT-RAIL.md | 1–193 (full) | |
| P/03-ADD.md | 1–230 (full) | |
| P/04-LAYERS.md | 1–192 (full) | |
| P/05-CANVAS.md | 1–201 (full) | |
| P/06-INSPECTOR-DELTA.md | 1–84 (full) | overlay only |
| P/07-CMS.md | 1–176 (full) | |
| P/08-ASSETS.md | 1–172 (full) | |
| P/09-BRAND.md | 1–185 (full) | |
| P/10-SITE-SETTINGS.md | 1–157 (full) | |
| P/11-PAGES-AND-BOTTOM-BAR.md | 1–172 (full) | |
| P/12-RIGHT-TASK-HOST.md | 1–157 (full) | |
| P/13-COMPONENTS.md | 1–155 (full) | |
| greps over P/01–13 | — | "job/JTBD/00-STRATEGY", "WCAG/contrast/reduced-motion", "motion/animat", "offline", "loading/skeleton", "DESIGN.md", noun counts (workspace/area/master/library), "DESIGN READY" across D |

**Skipped, and why:** The root `DESIGN.md` is outside the D2 file list. This audit only records that no panel cites it (D2-29). `PRODUCT-DESIGN-BRIEF.md` FD-INS-02/03 is the base for Panel 06, so Panel 06 is judged as a delta only. Panels 14–25 are read only where 00–13 cite them, never directly. INV and RL were not needed for a screen-spec audit. Those are other agents' tasks.

**Vocabulary note:** The task asks "what is missing for DESIGN READY", but SC-16 (00:281-284) retired DESIGN READY. The column below reads it as "what is missing before this spec can honestly carry SPEC COMPLETE and then move toward VERIFIED".

---

## Screen spec audit

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

## Shared-pattern consistency matrix

Legend: ✓ consistent with SC/peers · **Δ** divergence (see note) · — not applicable / not specified.

| Pattern | 01 Topbar | 02 Rail | 03 Add | 04 Layers | 05 Canvas | 06 Insp. | 07 CMS | 08 Assets | 09 Brand | 10 Settings | 11 Pages/Bottom | 12 Task host | 13 Components |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Panel header height | 56 bar | — | **Δ 44** | **Δ 44** | toolbar 44 | INS-D01 slots | 56 (collection) | 56 (SC-1) | 56 | 56 | manager 56 | **Δ 48** | 56 (SC-1) |
| Back control | Preview "‹ Back to {origin}" ✓ | — | "‹ Back to Add" ✓ | — | return chip SC-7 ✓ | "‹ Back to Heading/Style" ✓ | SC-1 ✓ | SC-1 ✓ | SC-1 ✓ | SC-1 ✓ | "‹ Back to Pages" ✓ | "‹ Back to Inspector" (conditional) ✓; RT-13 "‹ Activity" legacy | sketch "‹ Back to Add / Editor" ✓ |
| Search field | — | — | sticky 32, `/`, Esc clear→blur ✓ | sticky 32, Esc clear→**no-op Δ** | — | — | Search + filters | `/` focus, server search ✓ | — | search mode combobox **Δ** (replaces nav) | names + slugs | — | name search |
| List row height | — | 52 item | 32 | 32 (28 compact) | — | bound row 48 | 40 | 40 / grid | 40 token | — | **Δ 32** (pages are "resource lists", 03 §8 says 40) | — | 40 |
| Tree row | — | — | — | indent 16, cap 4 | — | — | — | folders (unspecified) | — | — | tree + folders (indent unspecified) **Δ** | — | — |
| Empty state | — | — | copy + action ✓ | "No layers yet" + Add ✓ | → Panel 16 | — | copy + action ✓ | copy + drop zone + Stock ✓ | "No brand set." + Starters ✓ | — | one-page note | existing per task | per section ✓ |
| Loading | role-loading rule | role loading | "Open a page first" | skeleton ✓ | skeleton ✓ | base | **Δ missing** | skeleton (not restated) | **Δ missing** | footer "Loading" | skeletons ✓ | boundary for all ✓ | skeleton ✓ |
| Error | "Status unavailable" ✓ | area shows own retry | "Couldn't load … — Retry" ✓ | boundary + Retry ✓ | render error NEW ✓ | — | "Couldn't save — Retry" ✓ | "Search failed — Retry" ✓ | panel error + Retry ✓ | "Couldn't save — Retry" ✓ | "Pages unavailable — Retry" ✓ | boundary + Retry ✓ | "Couldn't load … — Retry" ✓ |
| Confirm dialog | exit 3-way; **Duplicate site confirm Δ** (not in SC-15) | guard 2-way | — | none (Delete Undo) ✓ | restore confirm (TT) | Unbind = explicit, no confirm ✓ | E-1/E-2/E-3 ✓; permanent delete **typed Δ** | E-4 ✓ | none ✓ | domain/transfer ✓; **locale add/remove confirm Δ** | page delete no confirm ✓ | History restore / Unpublish modal ✓ | **Update-from-selection confirm Δ**, **dup-name "create anyway?" Δ**, permanent delete **non-typed Δ** |
| Destructive undo toast copy | — | — | "{X} added … Undo" | "N elements deleted · Undo" ✓ | SC-3 | — | **Δ "Deleted — Restore"** | "grace Undo" (copy unspecified) | — | "Redirect deleted — Undo" | "About deleted · Undo · Recently deleted ›" | "Issue fixed" + Undo | "{name} deleted · Undo · Recently deleted ›" |
| Context menu | ⋯ site menu (grouping Δ) | — | header ⋯ only | SC-3 + **extras Δ** | CV-16 **not recomposed Δ** | header ⋯ SC-3 ✓ | row menu (Delete) | specific | card menu | — | row menu specific | task ⋯ | row ⋯ + detail ⋯ |
| Bulk bar | — | — | — | footer select mode | multi toolbar **Δ** (SC-17 missing) | Mixed (SC-17) | Bulk publish/unpublish/delete + report | "Select assets…" Move/Tag/Delete | — | — | bulk bar ✓ | — | — (no bulk) |
| Footer actions | — | — | — | footer 32 (status) | — | — | record Save/Cancel | footer 32 (quota) | — | **48 Discard / Save settings** | manager 48; dialog Cancel/Save | 48 only with actions | — |
| Tabs | — | — | — | — | — | 4 tabs (locked) | 4 workspace tabs | detail tabs 3 | none (nav) | none (nav) | page settings 3 tabs | History views 3 | — |
| Surface type | bar | bar | left panel | left panel | canvas | right column | area | area + left picker + dialog | area | area | bar + sheet + dialog | right task / tray / sheet | area |
| Save model | — | — | transaction | transaction | transaction | live commit | **explicit** record Save | upload receipt | **autosave** | **staged explicit** + immediate | page autosave; page settings explicit | per task | explicit actions |
| Dirty-guard copy | Stay / Leave anyway / Save & leave | Keep editing / Leave and lose changes | — | — | — | — | → 02 | — | none (autosave) | Keep editing / Discard / Save and continue | → one guard contract | Keep / Discard | — |
| "Not yet" feature label | "Planned" | — | — | — | — | — | "Planned" | — | — | **"Planned" + "Coming soon" Δ** | — | — | — |
| Same concept naming | — | "workspace" ×33 (SC-11 says Area) | "Library" tag **Δ** | "master" ×3 **Δ** | — | — | "workspace" | "library" alone **Δ** | "Colours/Colors" mixed **Δ** | "workspace" (org sense ✓) | ✓ SC-11 | — | "master" ×13, "Library · v4" **Δ** |
| Width model | 56h | 56w | 284/260–360 | 284/260–360 | flex, 1440 frame | 300 fixed (overlay 312) | 240 + 320 | 240 + 320 / 284 / 720 | 240 + 468 | 240 + 960/720 | 32h / 560–720 | 360 (320–420) | 240 + 320 |

---

## Principle observations

| PID | Module | Observation (spec-level) | Risk | Evidence | Suggested status |
|---|---|---|---|---|---|
| P01 | 03 Add | Duplicates are removed by moving, so each item appears once. 54 → 37 primitives + toggle | Add still shows up to 8 groups (CMS fields, Favorites, Recent, Elements, Sections, Catalog, Saved ×3 scopes) | 03 §4 | PASS-SPEC |
| P01 | 11 Status | Multi-owner Details popover keeps the bar to one line | Its 6 row kinds appear only on demand | 11 §8 | PASS-SPEC |
| P02 | 01 ⋯ menu | ~16 rows in 6 groups, one of them mis-grouped | Slower scan; Unpublish under "Collaborate" | 01 §6 (01:141) | NEEDS REVISION |
| P02 | 09 Brand | Flat 11-row nav regrouped into Tokens / Reusable styles / Tools; 11 kinds go behind "Other kinds" | — | 09 §4.1 | PASS-SPEC |
| P03 | 04 Layers | Row actions are 24×24 inside a 28 row in compact mode | Exactly at the WCAG 2.5.8 minimum; mis-hit risk the CLAUDE notes already saw | 04 §5, §10 | NEEDS REVISION (state the spacing rule) |
| P03 | 11 strip | Tabs shrink 28 → 24h | Smaller targets on a frequent action | 11 §4 | NEEDS REVISION |
| P03 | 01 | ⋯ 28×28, Exit 28h, review pill 24h | Small top-edge targets | 01 §5.1, §5.4, §5.10 | NEEDS REVISION |
| P04 | 07 / 09 / 04 | Dynamic pages promoted out of ⋯; Brand "Other kinds" sub-list; Layers markers max 3 + "+N" | — | 07 §4, 09 §4.1, 04 §5 | PASS-SPEC |
| P05 | 02 / 01 | Labels under every rail icon; Site settings never icon-only | — | 02 §8, 01 §5.3 | PASS-SPEC |
| P05 | 05 | Breakpoint segments are icon-only by default; labels show only at ≥1000 column | Users must recall which icon is which; this is the write scope | 05 §5 | NEEDS REVISION (keep labels or show the active label) |
| P06 | 04 | "Dim in editor" separated from live visibility; tooltip "still published" | — | 04 §6 | PASS-SPEC |
| P06 | 11 | "● Unpublished" → "● Unsaved" fixes a wrong model | — | 11 §5 | PASS-SPEC |
| P07 | 00 | Esc selects the parent (builder convention); ⌘⇧L lock; shortcuts moved off browser chords | Rail arrows no longer activate (departs from tablists) | SC-2, SC-12, 02 §8 | PASS-SPEC |
| P08 | 03 | Placement walk computes the target and shows it before commit | — | 03 §5 | PASS-SPEC |
| P09 | 03 / 07 / 10 | "Saved" only after receipt; success toast after the transaction | No latency budgets anywhere (no ms target for area switch, search, insert) | 03 §5, 07 §5, 10 §5 | NEEDS REVISION (add response targets) |
| P10 | all | Aesthetic quality cannot be judged; no panel cites `DESIGN.md` | Visual layer unowned in specs | grep "DESIGN.md" = 0 relevant hits | BLOCKED (no visual spec) |
| P11 | 01 / 07 | One-blue-CTA rule; primary action follows the tab | Only stated in 01 and 07 | 01 §5.9, 07 §4 | PASS-SPEC (partial) |
| P12 | 02 / 01 | Rail divider groups (tools vs resources); topbar zones | — | 02 §4, 01 §4 | PASS-SPEC |
| P13 | — | No layout composition beyond ASCII sketches | — | — | N/A (no hi-fi) |
| P14 | 01 / 02 | Gaps given (12/8, 4, 8) but no whitespace rule for area bodies | — | 01 §8, 02 §9 | N/A (spec-thin) |
| P15 | 01 / 02 / 10 | Only isolated type values (14/500 site name, 11/500 rail label, 20/28 settings title) | No type scale per panel; no DESIGN.md link | 01 §5.2, 02 §9, 10 §4 | NEEDS REVISION |
| P16 | 03 | 4px-multiple values throughout, but card 120 vs computed ≈126 | Ambiguous card width | 03 §6.5 vs §8 | NEEDS REVISION (minor) |
| P17 | 07 / 08 / 09 / 10 / 13 | Area grid repeats rail 56 + nav 240 + detail 320 | Brand preview 468 is the outlier | 07 §11, 08 §10, 13 §10, 09 §8 | PASS-SPEC |
| P18 | 04 | Dimmed rows at 50% opacity and muted italic for hidden rows | Likely below 4.5:1; no contrast requirement in 01–13 | 04 §5; grep "contrast" = 0 | NEEDS REVISION |
| P19 | 03 / 11 / 07 / 13 | Row heights 24/28/32/40/48 with a stated rule (tool 32, resource 40) that 11 breaks | Uneven rhythm between Pages and other resource lists | 03 §8, 11 §5 | NEEDS REVISION |
| P20 | 00 SC-1 | Back slot fixed at the left end of the 56 header in every area | Header heights still 44/48/56 across surfaces | SC-1; matrix | PASS-SPEC (back) / NEEDS REVISION (headers) |
| P21 | 03 | One insertion contract for all 10 insert routes | — | 03 §5 | PASS-SPEC |
| P22 | 01 / 04 | Site name becomes non-interactive text; Dim icon "eye-off with E" | The "E" glyph is an untested signifier | 01 §5.2, 04 §6 | PASS-SPEC (test glyph) |
| P23 | 11 / SC-4 | Status priority with failure first; per-owner rows; Brand "applied locally" vs "saved" | Multi-owner rows fall back to page-only until the registry ships | 11 §8, SC-4, SC-9 | PASS-SPEC |
| P24 | 03 / 04 / 07 / 10 | Lock checks on every route; stale-target refusal; field stored-data preflight; settings save guard on Publish | — | 03 §5, 04 §6, 07 §6, 10 §5 | PASS-SPEC |
| P25 | SC-15 / 11 / 13 | Undo over confirm with 30-day Recently deleted | Recovery copy and confirm types diverge (D2-9, D2-10) | SC-15, 07 §5, 11 §5, 13 §6 | NEEDS REVISION (copy) |
| P26 | 13 / 15-entry | Components and Templates are areas with no rail item; doors are ⇧A, ⌘K, an Add link and an Inspector link | Low discoverability for a primary reuse feature (BD-16) | 02 §6, 13 §4, 03 §6.6 | NEEDS REVISION (decide a persistent door) |
| P26 | 01 / 07 | Site settings visible; Dynamic pages promoted to a tab | — | 01 §5.3, 07 §4 | PASS-SPEC |
| P27 | 08 / 02 | Picker: click = select, then Insert (2 steps; double-click shortcut); rail needs Enter after arrows | Deliberate cost for safety | 08 §4.3, 02 §8 | PASS-SPEC |
| P28 | 03 / 04 / 01 | 300ms preview card, 600ms auto-expand, insert flash, "✓ Published" 2s | No reduced-motion rule in 01–13 | 03 §6.5, 04 §7, 01 §5.9 | NEEDS REVISION |
| P29 | 03 / 05 / 01 | CMS fields group only with a record; Record switcher contextual; Comments disabled outside Editor | — | 03 §6.7, 05 §5, 01 §5.5 | PASS-SPEC |
| P30 | 04 | Width budget at 260 computed for markers and actions | — | 04 §5 | PASS-SPEC |
| P31 | 00 | SC-1/2/3/11/15 create consistency by override | Panels keep stale text; implementers must merge two sources | 00:198, 06 §7 | NEEDS REVISION |
| P32 | 02 / 12 | Two destination types; right column = Inspector or one task | Three door types for areas (rail, topbar, none) | 02 §5, 12 §4.1 | PASS-SPEC |
| P33 | SC-1 / SC-7 | One "‹ Back to {origin}" pattern; return chip | Legacy "‹ Activity" (12 RT-13) | SC-1, 12 §2 | PASS-SPEC |
| P34 | 01 / 05 / 12 / areas | ≤1366 / ≤1280 / ≤1024 behaviours defined per surface | Toolbar fit with a docked task at 740 not checked; Brand preview rule duplicated | 05 §9, 12 §4.5, 09 §8 | NEEDS REVISION (minor) |
| P35 | 02 / 08 / 12 / 24-ref | Shared Asset picker, shared Recently deleted row (Panel 24), shared font list, one task host frame | — | 08 §4.3, §7; 12 §4.2 | PASS-SPEC |
| P36 | 01 / 02 / 04 | Only `--bk-size-topbar`, `--bk-size-rail`, `--bk-*` muted text named | Most sizes are px literals in specs, not tokens | 01 §8, 02 §9, 04 §5 | NEEDS REVISION (minor) |
| P37 | 01 / 09 / 10 | Menu and nav groups are semantic; one ⋯ misgroup | — | 01 §6, 09 §4.1, 10 §4 | PASS-SPEC (fix D2-4) |
| P38 | all | Every panel has a states table | Loading missing in 07/09; offline missing in 03/04/05/09/10/12/13; no long-content row in most | per-panel §States | NEEDS REVISION |
| P39 | 02 / 03 / 04 / 08 / 11 / 12 | Strong keyboard/ARIA specs (roving, grid, tree, landmarks, 2.5.7, 2.1.4) | Contrast, target size, reduced motion and focus-ring colour not specified in 01–13; screen reader never verified | 04 §10, 03 §10, SC-12 | NEEDS REVISION |
| P40 | 00 / all | Preservation maps + SC-9 fallbacks make the debt explicit | Fallbacks keep today's behaviour; stale panel text left by design (SC-11) | 00:198, SC-9 | NEEDS REVISION (track the stale text) |

---

## Contradictions & gaps

| ID | Type | Statement A | Statement B / missing | Severity | Proposed resolution |
|---|---|---|---|---|---|
| D2-1 | missing | 00-STRATEGY:5 "Each panel's §3 should name which job (§3) it serves" | No panel 01–13 names a job; every §3 is "Problems" (grep 0 hits) | Major | Add one "Job: J1/J2/J3/S" line to each §1 |
| D2-2 | ambiguity | SC-16 (00:284) "A panel with an open ⛔ dependency shows 'SPEC COMPLETE · blocked by…'" | 05 §5 and 09 §5 specify document ⌘Z, which depends on ⛔ U-1 (00:128), but their status lines carry no "blocked by" | Minor | Add "blocked by U-1 (interim guard)" or state why it doesn't apply |
| D2-3 | contradiction | 00:29 search fields (incl. Layers): clear, then a second Esc **blurs** | 00:36 and 04 §9 "Layers: clear search → **no-op**" | Minor | Pick one; recommend blur for every search field (SC-2 exception) |
| D2-4 | contradiction | 01 §6 group "Collaborate" | Same group holds "Unpublish site…" (01:141, empty group cell) | Minor | Move Unpublish into "This site" or a "Danger" group |
| D2-5 | stale | 01 §4 diagram "● Waiting · Sara ›" | 01 §5.4 chip states (amended) have no "Waiting · {name}" | Minor | Redraw the diagram with a valid chip state |
| D2-6 | stale | 01 §10 "Presence … (+ optional people popover)" | 01 §5.6 click opens the People popover (Panel 21) | Minor | Drop "optional" |
| D2-7 | contradiction | 10 §5 interim layer 1 is mandatory: re-read and show "Changed elsewhere — Review" before writing | 10 T-ST-04b "two sessions save in turn → second write wins" | Major | Rewrite T-ST-04b to assert the read-compare-write prompt |
| D2-8 | contradiction | SC-15 (00:275-276): confirms only for the listed cases; "any other confirm … is overridden" | 01 §6 Duplicate site confirm; 10 §5 Languages add/remove locale confirm; 13 §6 Update from selection confirm; 13 §5 duplicate-name "create anyway?"; 13 §9 Detach instance confirm | Major | Either add each to the SC-15 exception list with a reason, or replace each with Undo |
| D2-9 | contradiction | 07 §8 "Delete permanently (typed confirm, ADMIN+)" | 13 §4 "Delete permanently (ADMIN+, non-typed confirm)" | Minor | One rule in Panel 24 §4.8; panels cite it |
| D2-10 | contradiction | SC-3 toast "N elements deleted · Undo" | 07 §5 "Deleted — Restore"; 11 §5 "… · Undo · Recently deleted ›"; 08 §6 copy unspecified | Minor | One toast pattern: "{name} deleted · Undo · Recently deleted ›" |
| D2-11 | missing | SC-14 (00:269) locked descendants: Layers-only select + outline inherited-lock marker | 04 §5 markers list only 🔒; 04 §6 lock rules don't mention descendants | Major | Add the inherited-lock marker, its accessible name and its refusal copy to 04 §5/§6 |
| D2-12 | missing | SC-17 (00:289) multi-selection toolbar "Duplicate · Delete · Group · More" | 05 §6 "Duplicate · Delete · More — buttons unchanged" (single only) | Minor | Add the multi-select toolbar row to 05 §6 |
| D2-13 | missing | SC-13 (00:263-266) Inspector override dot, "Tablet" label, Reset to parent, "N overrides", first-time note; toast "applies to all breakpoints" | Not in 06 delta; 05 §7 only "Editing Tablet" label | Minor | Add SC-13 rows to 06 §2 and 05 §7 |
| D2-14 | contradiction | SC-3 "one registry; every menu draws from it" | 04 §7 adds Show on canvas, Copy link, Paste into/after, which are not in SC-3 | Minor | Add those rows to SC-3 (Layers column) |
| D2-15 | missing | SC-3 canvas column has Select children, Move to page, Move up/down/into/out, Lock ⌘⇧L | 05 §6 menu = "CV-16 kept + Show in Layers"; CV-16 lacks them | Minor | Replace the 05 menu row with "per SC-3" + grouping order |
| D2-16 | contradiction | 03 §8 "GEO-01's 40px list row applies to resource lists (records, assets, pages)" | 11 §5 Pages manager rows 32h; Recently deleted rows 32 (07 §8, 13 §4 via Panel 24) | Minor | Decide whether pages are a resource list (40) or a tool list (32); amend GEO-01 note |
| D2-17 | ambiguity | 06 header "300px fixed (INS-D07)" | 05 §9 and 06 B5 "obscures 312"; 12 §4.5 overlay "+12 inset" stated only for tasks | Minor | State the Inspector overlay inset (12) once in GEO-01 |
| D2-18 | gap | 05 §9 one-row toolbar needs ≈750+ | 12 §4.5 canvas region at 1440 with a docked task = 740 | Minor | State that the 05 collapse order applies whenever a task docks, and verify at 1440 |
| D2-19 | contradiction | 09 §8 preview "fixed width … min 360 … no splitter" | 09 §4 and §11 "360–520"; the <1280 rule is written twice in §8 | Minor | One rule: fixed 468, shrinks to 360, toggle below 1280 |
| D2-20 | missing | Panels 03/04/05/08/11/12/13 define loading | 07 §11 and 09 §10 have no loading state | Minor | Add loading rows (skeleton pattern) |
| D2-21 | missing | 01, 07, 08, 11 define offline | 03, 04, 05, 09 (autosave), 10 (Save), 12, 13 do not; 09 has no autosave-failure state | Major | Add offline and apply-failure rows, at least for 09 and 10 |
| D2-22 | naming | SC-11 (00:220-221) "Area" for editor destinations; "Workspace" = organization only | 02 (33×), 08 (25×), 13 (22×), 07 (14×) use "workspace" for areas | Minor | Rename in the next edit; UI copy must use "area" names only |
| D2-23 | naming | SC-11 "Main component", not "master" | 13 uses "master" 13×, 04 3× | Minor | Replace |
| D2-24 | naming | SC-11 never "library" alone | 03 §6.6 tag "Library"; 13 §4 "Library · v4"; 08 §5 "Not saved to library — Retry" | Minor | "Component library · v4"; "Not saved to Assets — Retry" |
| D2-25 | naming | 01 §9 and 07 §4 "Planned" | 10 §7 "SEO analysis · Planned" card that says "Coming soon"; T-ST-09 "Coming soon" | Minor | One label: "Planned" (flagged-features rule) |
| D2-26 | naming | SC-11 "US English in UI copy" | 09 §4.1 "Counts stay on Colours", BR rows; 03 body "favourites" next to UI "FAVORITES" | Minor | US spelling in any string that ships |
| D2-27 | stale | SC-21 every AI path inactive; 12 T-RT-04 marked inactive | 09 T-BR-05 AI Apply acceptance not marked inactive | Minor | Mark T-BR-05 "(inactive — SC-21)" |
| D2-28 | inconsistency | 12 §4.3 "Rail navigation, page switching and workspace changes use the same guard contract" | Guard copy varies: 01 §7.1 Stay/Leave anyway/Save & leave · 02 §7 Keep editing/Leave and lose changes · 10 §5 Keep editing/Discard/Save and continue · 12 §4.3 Keep/Discard | Minor | One guard dialog in SC (title, three verbs) with declared variants |
| D2-29 | missing | CLAUDE.md: DESIGN.md owns type, colour, motion | No panel 01–13 cites DESIGN.md; no type scale, contrast or motion lines | Major | Add a SC row "visual tokens per DESIGN.md" + per-panel type/contrast hooks |
| D2-30 | missing | 04 §5 dimmed rows 50% opacity; hidden rows muted italic | No contrast floor for de-emphasized text | Minor | Add a minimum contrast for dimmed/hidden row text |
| D2-31 | ambiguity | 07 §8 "Records Status filter gains Recently deleted … same list hosts deleted fields and collections" | A deleted collection's records filter is unreachable once the collection leaves the nav; Restore collection has no stated location | Major | CMS nav-level "Recently deleted" entry (like 08/13) hosting records, fields and collections |
| D2-32 | ambiguity | 03 §6.5 card "120×(65 thumb + 24 label)" | 03 §8 card width = (panel−32)/2 ≈ 126 at 284 | Minor | Card width = fluid formula; drop the 120 |
| D2-33 | ambiguity | 01 §5.3 Site settings: overview first, then last group "for the session" | 10 ST-02 "last screen remembered per site" (persistent) | Minor | State the persistence scope once (session or per site) |
| D2-34 | missing | 08 §5 interim: status "Image not uploaded yet — Retry" at Save-failed tier | 11 §8 status list and SC-4 priority do not include this text | Minor | Add it to the 11 status table under Save failed |
| D2-35 | gap | 00-STRATEGY §4 Change step = CMS/Assets/Brand | Components and Templates areas have no rail door; 13 relies on ⇧A, ⌘K and links | Minor | Record the door decision explicitly (keep as is with reason, or add a visible door) |

---

## Consistency notes

- **Headers:** four heights for the same "surface header" role. 44 (Add, Layers, canvas toolbar), 48 (right task), 56 (areas, Pages manager, Brand, topbar). No SC row reconciles them (01 §8, 03 §8, 04 §10, 12 §4.2, SC-1).
- **Back labels:** SC-1 "‹ Back to {origin}" holds everywhere. Remnants: 12 RT-13 "‹ Activity" (as-built row), 13 sketch "Back to Add / Editor" (illustrative).
- **Esc:** Areas 07/08/09/10/13 all adopt "topmost layer, else no-op". The search-field step diverges (D2-3). 07 record subview Esc = Cancel with guard; 08 picker Esc = cancel. Both are consistent with SC-2 step 3.
- **Menus:** Only 04 and 06 draw explicitly from SC-3. 05 still lists CV-16. 01/03/07/08/09/11/13 have domain menus outside the registry (expected), with no shared ordering rule (destructive last, separators).
- **Confirmations:** SC-15 whitelist vs five retained confirms (D2-8). Permanent-delete confirm type differs (D2-9).
- **Undo / recovery:** Document Undo: 05, 09 (shared stack). Live recovery toast: 07, 08, 11, 13. No document undo: 10 (OD-U2). Toast copy and the "Restore" vs "Undo" verb differ (D2-10). Recently deleted has three placements: nav entry (08, 13), ⋯ subview (11), records filter (07, D2-31).
- **Empty / loading / error:** "Couldn't … — Retry" error copy is consistent. Loading is missing in 07/09. Empty-state actions are consistent (copy + one action).
- **Save model:** Autosave (Brand, pages) vs explicit (CMS record "Save record", Site settings "Save settings", Page settings "Save"). The primary-button labels are not uniform ("Save record" / "Save settings" / "Save"), and the footer heights match (48) only in 10/11.
- **Dirty-guard dialogs:** Four copy variants (D2-28).
- **Shortcuts:** SC-12 applied in 01/02/05/11/12 (H, ⇧1, ⇧R, ⌥B). 04 ⇧L ✓. Lock ⌘⇧L is not mentioned in 04/05.
- **Widths:** Areas share 240 nav + 320 detail. Left tools 284/260–360. Right column 300 (Inspector) vs 360 (task) with a pinned-300 hidden Inspector (12 §4.1). Dialogs 720/480/960 (08, 13), 640 (10), 720 max (11 page settings).
- **Viewer treatment:** "disabled with reason" (01, 02, 11) vs "hidden" (04 structural menu items, 12 AI/Issues). SC-6 allows both, but there is no rule for when to hide and when to disable.
- **Naming:** "workspace", "master", "library", "Colours" and "Planned/Coming soon" all drift from SC-11 (D2-22…D2-26).
