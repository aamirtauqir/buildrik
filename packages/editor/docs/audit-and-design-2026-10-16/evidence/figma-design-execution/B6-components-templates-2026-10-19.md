# B6 Components and Templates — 2026-10-19

DESIGN ONLY · Figma file `2L9OTGzBrL6kYmU18yA1c7`, page `05 · Resources` (`3:6`). No application code, tokens, data or deployment changed.

## Components workspace — K01–K39 (board `221:43842`)

Spec: P13 §§4–10, T-CP-01…18, SC-15, SC-32, PKG-01.

| Frames | What they show | Script / ledger |
|---|---|---|
| K01 `215:43301`, K22 `217:42918` | Doors: Add header “Components ›”, Layers instance menu “Go to main component ›” (N1) | `b6-components-core.js`, `b6-components-actions.js` |
| K02–K04 `215:43588`, `215:43978`, `215:44300` | This site / This page / Component library sections (N2), rows 40, summary 320, Load more, restricted item | core |
| K05–K08 | Review update v4→v5 with a conflict choice, applied receipt, local changes with Share update (Admin) vs disabled with reason (Editor) | core |
| K09–K11 | Create: scope before commit, duplicate-name inline warning, at-capacity disabled | core |
| K12–K16 | Update from selection: review → Choose on canvas → source chosen → Return to component review → Update → Undo receipt (class a) | actions |
| K17–K21 | Detach all and Delete Undo receipts, Recently deleted with SC-32 bulk bar, typed permanent delete, Used on with Locate | actions |
| K23–K27 | Offline, library load error, empty This page, 200-character name, 1280×640 | actions |
| K28–K39 | Export blocked/ready/started; Import file → roots → check → map → review → importing → unknown outcome → receipt → imported-but-Insert-failed | `b6-components-packages.js` |

Corrections during the pass: row columns re-fit to 776px so menus align (`-fixes`, `-fixes-2`); “More actions” replaces an overflowing label; nav counts match the list; status outside Brand reads “Saved just now” (24 frames); Layers menu anchored to its row; compact detail fits 464px.

Deferred to B4 (Inspector): Reset to main component confirm, Variant unavailable, breakpoint/state instance overrides. Variant authoring stays deferred (owner P4).

## Templates area — T01–T23 (board `223:47858`)

Spec: P15 §§4–7, SC-15, SC-20, N7.

| Frames | What they show | Script / ledger |
|---|---|---|
| T01–T02 `222:43842`, `222:44210` | Catalogue in the shell, Show filter + Recent + search, Creating mode bar; duplicate name inline | `b6-templates.js` |
| T03–T05 | Preview with mode-matched primary and Brand line; Pro on Free “Upgrade to use” with preview open; Pro in trial | same |
| T06–T10 | Running (Cancel only before import), taking longer → Keep waiting, landed with Page settings + Connect to Brand colors (→ Brand B19), import report Keep/Undo, failure leaves nothing (T-1) | same |
| T11–T14 | Replacing mode, class-b confirm with backup on (Cancel default), backup failed choices, stale target keeps Replacing | `b6-templates-2.js` |
| T15–T17 | Saved card menu, delete Undo + Recently deleted, Save as template with name + description | same |
| T18–T23 | Offline, viewer, role unknown, no match, empty Saved, 1280×640 Show in header | same |

Engineering dependencies stay annotated: T-1 (create+import one operation), T-3 (rename), T-4 (Undo of create), T-6 (templates on Brand tokens), T-7 (Recently deleted).

## Remaining in B6

- J-F3 is represented by Assets A14–A18 and A34 (picker choose/cancel/replace/locked target). A dedicated end-to-end J-F3 walk is part of B10.
- Components independent review (read-only `design-qa-critic`, 35 of 39 frames screenshotted) found no P0, 7 P1, 12 P2. The fixes are in `b6-components-review-fixes.js`:
  - K06 row now shows v5, and Undo returns to the list.
  - K17 shows usage after the detach. K25 has This page active with 0.
  - K23 disables every server-only action and gives the reason.
  - K32–K35 have Cancel on every step before Import.
  - K13 → K14 is linked. The Layers door lands on the new K40 with “‹ Back to Layers · Hero card”.
  - P2s: counts (K04/K18/K21/K24), K19/K20 nav, one back link, a 32px bulk bar with Clear last, the K05 choice state, the K15/K16 local-changes signal, K02 wiring and K37 links.
  - Added K41 (open row menu) and K42 (restored receipt).
  - Still open from the review: real radio/checkbox components in Create, the Structure subview, search results and Sort menu, the Inspector-side items (B4), loading/empty-site/library-empty/tombstone/Not linked/restricted detail, and Import cancelled/resuming. Search height (28 vs 32) and header layer naming are deferred to the B10 shared-header pass.
- Templates independent review: not run yet.
- Not verified anywhere: keyboard/focus, screen reader, prototype playback, persistence, server behaviour.
