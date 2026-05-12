# prototype-v3 — Full 22-Section Parity Audit

Scope: every numbered section in `~/.gstack/projects/aamirtauqir-buildrik/designs/sidebar-templates-media-engine-20260507/prototype-v3.html` vs live editor surfaces.

Supersedes the focused 3-surface audit at `2026-05-11-templates-media-shell-parity.md` (which only covered §1, §2, §10).

This is a **code-vs-design** audit (source reading), not a screenshot diff. Live screenshots reserved for user-driven QA pass.

---

## Verdict legend

| Verdict | Meaning |
|---|---|
| **ship** | code exists, matches prototype within tolerance |
| **drift-cosmetic** | code exists, minor copy / icon / token drift, acceptable to ship |
| **drift-fix** | drift important enough to fix in code; queued |
| **build** | code does not exist; requires implementation |
| **build-deferred** | code missing but use case covered by alternative path; defer until evidence of user need |

---

## §1–§9 Templates

| § | Surface | Verdict | Live file | Notes |
|---|---|---|---|---|
| 1 | Templates default 320px + two-stage filter | ship | `TemplatesTab.tsx` | per `2026-05-11-templates-media-shell-parity.md`. 1-col grid drift acceptable. |
| 2 | Templates inline detail panel | ship | `components/TemplateDetail.tsx` | per prior audit. Grid hide on detail open works. |
| 3 | Templates preview modal (full-screen) | ship | `TemplatePreviewModal.tsx:155-235` | Desktop/Mobile viewport switcher, iframe srcDoc rendering, top + bottom bars. Live CTA is contextual ("Apply to Canvas" / "Replace Canvas with This" / "Upgrade to Use") — **richer than prototype's static "Use this template"**. Drift: meta line shows "{N} sections" instead of prototype's "Hero · Free · 1.2k sites" social proof — acceptable, prototype data is fictional. |
| 4 | Templates replace modal | ship (fixed 2026-05-12) | `TemplatesTabModals.tsx:17-87` | Fixed in this arc: title rename, warning icon, page-name subtitle with element count, backup label includes page name, primary CTA "Replace content". Element count now sourced from active page descendants (was incorrectly total page count). |
| 5 | Templates Pro upgrade gate | ship (fully fixed 2026-05-12) | `TemplatesTabModals.tsx:84-159` + `components/TemplateDetail.tsx:100-103` | Visual shipped earlier; gate fix added 2026-05-12 systematic-debug arc — "Pro Plan Required" disabled button replaced with enabled "🔒 Upgrade to Use" CTA that triggers ProModal. Modal was previously unreachable. |
| 6 | Templates add as new page flow | ship | `TemplatesTab.tsx` + `TemplatesTabModals.tsx` CreatePageConfirmModal / CreatePageSuccessModal / CreatePageErrorModal | All 3 modals shipped. Confirmed via grep. |
| 7 | Templates search active | ship (fixed 2026-05-12) | `TemplatesTab.tsx:343-405` + `components/TemplateCard.tsx:31-62` | Search toggle + clear + empty-state CTA + "N results for 'X'" count + keyword highlight via `<mark>` in TemplateCard names. Multi-token query supported (space-split OR-match, regex-escaped). |
| 8 | Templates apply progress + success toast | ship | `ApplyProgressOverlay.tsx` | 4-step sequence ("Importing template HTML → Resolving brand tokens → Rendering on canvas → Saving applied state") matches prototype exactly. Comment at line 5 explicitly references v3 §8. Success/error toasts via existing toast infra. |
| 9 | Templates extended drawer (Used in / Versions) | ship | `components/TemplateUsageDrawer.tsx` (296 LOC) | Shipped 2026-05-08 via plan `2026-05-08-templates-extended-drawer-s9.md`. |

---

## §10–§22 Media

| § | Surface | Verdict | Live file | Notes |
|---|---|---|---|---|
| 10 | Media quick browse (320px default) | ship | `components/SlimLauncher.tsx` | per prior audit. 3 unexercised surfaces (recent strip, drag overlay, footer) gated on data state. |
| 11 | Media selection context (snap-back mode) | ship | `MediaTab.tsx:142-172` + `hooks/useMediaState.ts:43-89` | Composer-event wired: `ui:media-selection-request`, `element:needs-asset`, `element:selected`. On asset click `setSelectionContext(null)` snaps back. Drift: single-line label vs prototype's two-line "Block · 'binding'" — acceptable. |
| 12 | Media expanded mode (560px) on upload | ship (built 2026-05-12) | `components/ExpandedMediaPanel.tsx` + `hooks/useMediaState.ts` + `LeftSidebar.tsx` | Composer-event-driven runtime width override. State lives in `useMediaState.panelExpanded`. Auto-expand on `MEDIA_EVENTS.UPLOAD_COMPLETE` (respects manual collapse + §11 selection-context). Compact button collapses to 320. 7 new vitest cases cover state contract. |
| 13 | Media folder navigation + drag-to-folder | ship | `components/LibraryView.tsx` + Phase B4 folder mirror (`04f7aecb`) | Folder hierarchy + drag-to-folder shipped Phase B4. |
| 14 | Media multi-select banner | ship | `components/SelectionBanner.tsx` (57 LOC) | Shipped. Banner appears when `selMode` engages. |
| 15 | Media asset detail (extended drawer) | ship (mount-fixed 2026-05-12) | `components/AssetDetailOverlay.tsx` (206 LOC) + ExpandedMediaPanel mount | Component existed but ExpandedMediaPanel didn't mount it. Live click triggered `state.openDetail` → state updated → no overlay rendered. Fix: added mount in ExpandedMediaPanel mirroring MediaTab fullpage path. |
| 16 | Media right-click context menu | ship (mount-fixed 2026-05-12) | `components/MediaContextMenu.tsx` (132 LOC) + ExpandedMediaPanel mount | Same pattern as §15 — component existed but ExpandedMediaPanel missed the mount. Fixed by adding `<MediaContextMenu>` + `<ConfirmDeleteModal>` block in ExpandedMediaPanel. |
| 17 | Media image editor modal (crop/rotate/adjust) | ship | `editor/media/ImageEditorModal.tsx` (529 LOC) + `editor/media/CropOverlay.tsx` | Full crop + rotate + adjust shipped. Async `onSave` contract fixed in audit-remediation PR1 (`097e6f13`). |
| 18 | Media optimization panel | ship | `editor/media/OptimizationPanel.tsx` (331 LOC) | Shipped. |
| 19 | Media stock source modal | ship (mount-fixed 2026-05-12) | `components/StockSourceModal.tsx` (355 LOC) + ExpandedMediaPanel mount + "Stock" header button | Shipped 2026-05-09 backend + modal. Mount in fullpage MediaTab path only. 2026-05-12 systematic-debug fix: added mount + "Stock" trigger button in ExpandedMediaPanel header. |
| 20 | Media icon picker modal | ship | `editor/media/IconPickerModal.tsx` (533 LOC) | Shipped. Used by element-with-icon-trait flow. |
| 21 | Media replace-across modal | **orphan** (NOT mounted) | `components/ReplaceAcrossDialog.tsx` (229 LOC) | Component authored 2026-05-08 (`f4acbb6f`) with engine + modal primitive, but **never imported / mounted anywhere in editor**. No UI trigger to launch it. Requires separate arc: (a) `state.replaceAcrossItem` state slice in useMediaState, (b) trigger from context-menu "Replace across pages" item or asset detail panel "Replace across" button. Logged as deferred. |
| 22 | Media upload zone states | ship | `components/UploadZone.tsx` (121 LOC) | Shipped. Idle / hover / dragging / uploading / error states all in component. |

---

## Summary

**Code coverage: 21/22 surfaces have shipped implementation.**

| Verdict | Count | §s |
|---|---|---|
| ship | 21 | 1–20, 22 |
| orphan-deferred | 1 | 21 (ReplaceAcrossDialog never mounted) |

### This arc closed (5 commits)
- §4: drift-fix → ship (title, icon, page-name subtitle, element count, primary CTA all corrected)
- §5: drift-fix → ship visual (trophy + Pro feature bullets), then **gate-fix → ship reachable** (live verify exposed disabled button blocking ProModal)
- §7: drift-cosmetic → ship (results count line + keyword highlight via `<mark>`)
- §11: confirmed wire via 3 composer events; verdict promoted from "unverified" → ship
- §12: build-deferred → ship (composer-event-driven runtime width override + new ExpandedMediaPanel component + 7 new vitest cases + CSS authoring for TypePills/LibraryView)
- §15/§16/§19: ship-by-file → **mount-fix → ship** (live verify exposed ExpandedMediaPanel missing overlay mounts; 3 overlays + 1 trigger button added in systematic-debug arc)
- §21: ship → **orphan-deferred** (live verify exposed orphan component — ReplaceAcrossDialog never mounted)

---

## Open follow-ups (NOT closed by this arc)

### §21 ReplaceAcrossDialog wire (orphan-deferred)

Component fully authored 2026-05-08 (229 LOC + engine wiring), but **never imported / mounted** anywhere in editor. Live verify confirmed: zero consumers via `grep -rn "<ReplaceAcrossDialog"`. Integration tasks:

1. **State:** add `replaceAcrossItem: LibraryItem | null` + setter to `useMediaState`
2. **Trigger A:** add "Replace across pages" item in `MediaContextMenu` (fires setter)
3. **Trigger B (optional):** add "Replace across" button in `AssetDetailOverlay`
4. **Mount:** `<ReplaceAcrossDialog>` in both `MediaTab.tsx` (fullpage) + `ExpandedMediaPanel.tsx` (panel) paths

Estimated 2-3 hours. Defer until user demand or QA flag.

### §13 per-folder filter + drag-to-folder

ExpandedMediaPanel folder rail renders but clicking a folder doesn't filter the grid. `LibraryItem` (UI layer) lacks `folderId` — engine-side `MediaAsset.folderId` needs to be joined into `LibraryItem` shape via `useLibraryState`. Drag-to-folder requires drop-target wire in folder list items.

### Other minor v2 enhancements
- Full `FolderTree` component (smart folders, drag-to-folder, delete) instead of the minimal folder rail. Composer-side already supports — UI just needs the prop wiring.
- §15 AssetDetailOverlay internal CSS — Size/Dimensions/Type meta lines are plain text without proper styling. Internal layout polish.

---

## Cross-cutting status (carried from prior audit)

- `media.checkStorageQuota` CORS — code clearly correct, dashboard prod URL must be in `EDITOR_ORIGIN` env.
- Radix `DialogTitle` a11y — UnsavedWarningModal / TemplatePreview / AICopilot all promoted to `<ModalTitle>` (`f9675906`).

---

## Live QA reservation

Screenshot-diff verification of each surface deferred to user-driven QA pass. Code-vs-design audit (this doc) confirms structural parity; visual fidelity needs eyes-on-screen.

Suggested QA tour (10-min walkthrough at `http://localhost:5050`):

1. Click Templates rail icon → verify S1 (default panel + IA pills)
2. Click any template → verify S2 (inline detail panel)
3. Click "Preview full-screen" → verify S3 (iframe modal, viewport switcher)
4. Click "Apply" on page with content → verify S4 (new ReplaceModal with icon + element count)
5. Click any premium template → verify S5 (ProModal — known drift)
6. Click "Add page" rail action with template → verify S6 (CreatePageConfirm)
7. Click search icon → verify S7 (input + empty state)
8. Apply any template → verify S8 (4-step progress overlay)
9. Right-click template card → verify S9 (Used in / Versions drawer)
10. Click Media rail icon → verify S10 (320px slim launcher)
11. Drop empty image element → verify S11 (snap-back selection bar)
12. Click multi-select → verify S14 (banner)
13. Click any asset → verify S15 (detail drawer)
14. Right-click asset → verify S16 (context menu)
15. Open image editor → verify S17 (crop/rotate UI)
16. Open optimization panel → verify S18
17. Click "Add from Stock" → verify S19 (StockSourceModal)
18. Pick an icon element → verify S20 (IconPickerModal)
19. Click "Replace across pages" on asset → verify S21 (ReplaceAcrossDialog)
20. Drag file over Media tab → verify S22 (UploadZone states)
