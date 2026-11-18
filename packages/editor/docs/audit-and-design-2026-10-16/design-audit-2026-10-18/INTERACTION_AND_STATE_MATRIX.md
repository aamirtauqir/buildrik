# INTERACTION_AND_STATE_MATRIX

## Current state evidence — 2026-10-20

[Current state/source mapping](../evidence/figma-design-execution/COMPLETION-2026-10-20.md) adds concrete editable normal, empty, invalid, duplicate, pending, failed, unknown-result, offline, restricted, conflict, partial-result, restoration and acknowledged-outcome specimens. This covers the changed CMS/Settings/Templates/recovery tasks plus the [B4 current control map](../evidence/figma-design-execution/b4-20261020-source-mapping.md).

Independent native-route review corrected wrong object selection, lost restored results, role drift, origin drift and stale count/type fixtures. Outcome launchers are outside product UI; a pending operation has no invented timer-to-success. Actual input validation, focus, keyboard, timing, arbitrary selection combinations and server behavior remain NOT RUN. B9 first-run arbitration/replay stays pending on the unavailable interviews.

## B3.1 reconciliation — 2026-10-19

**Written guard/navigation contract only; visual and runtime checks NOT RUN.** The earlier audit tables below retain their date/provenance. This bounded amendment resolves the mapped draft/return details through [SC-24.1–3](../panels/00-SHARED-CONTRACTS.md#sc-241-navigation-transaction-and-draft-ownership--b31-2026-10-19) and [P11 §7.1–7.4](../panels/11-PAGES-AND-BOTTOM-BAR.md#71-b31-page-navigation-and-settings-return-contract). It does not globally upgrade Pages, CMS, Brand or Settings coverage.

| State / interaction | Current written coverage | Acceptance IDs | Evidence still needed |
|---|---|---|---|
| Manager browse vs leave task | Temporary manager retains origin; page activation resolves affected draft; focus alone never navigates | PG-G01/02/12 | Mount/unmount retention and actual command/keyboard behavior |
| Guard decision / save / retry | Fixed destination, safe default, per-owner validation and completion; pending/error/queued result cannot navigate | PG-G02/03/06 | Delayed saves, receipt boundary, duplicate prevention and failure recovery |
| Discard / partial resolution | Named staged draft only; unsupported/failed discard blocks leave; earlier confirmed results survive | PG-G04/10 | Multiple owners, throwing handlers and retained-draft verification |
| Page settings close and return | Dirty Cancel/Close uses shared guard; footer Save closes, key Save stays; origin page can differ from target | PG-G05/06 | Modal/focus ownership, field validation and exact return playback |
| Offline / restricted | Local staging retained; required-connection save unavailable; loaded-page navigation and Viewer access preserved | PG-G07/09/12 | Network transitions, role changes and plan-restricted opening |
| Concurrent change / late result | Target/account/revision checks; cancelled intention never revived by a late success; no silent retarget | PG-G08/11 | Race tests, per-page snapshots and permission enforcement |
| Geometry | 480px shared guard with wrapping/short-height fallback; existing manager/settings geometry retained | P11 §7.3 | All prescribed viewports and 200% text enlargement |
| Grouping and status | Draft identity/action first, owner-specific feedback, no false aggregate Saved; Brand never offers Discard | PG-G06/09/10 | Visual hierarchy and actual simultaneous local/global feedback |

Applicability: pristine/dirty/saving/error/invalid/queued/offline/conflict/partial/cancel/stale/access-change/long-name/multiple-owner states are specified for this slice. A guard's standalone empty/search/no-results state is **N/A**: it opens only for a named affected task and is not a search/list surface. Underlying Pages loading/empty/search states remain in P11 and B3.2–3; their design or implementation is not certified here. Focus/screen-reader checks remain NOT RUN even where their intended behavior is specified.

Date 2026-10-18 · Mode AUDIT · Source: panel specs (canonical), extracted in `_extraction/D2`, `D3`, `T2`. Verification: document inspection only.

## 1. Global interaction contracts (00-SHARED-CONTRACTS) and their conformance

| Contract | Rule (short) | Conformance across panels | Open conflict |
|---|---|---|---|
| SC-1 Back | One "‹ Back to {origin}" in the header left slot | ✓ everywhere | P12 RT-13 legacy "‹ Activity" |
| SC-2 Esc | Esc backs out one level; canvas Esc selects parent; search Esc clears then blurs | ✓ | Layers search Esc "no-op" (D2 matrix) |
| SC-3 Action registry | One registry for canvas menu, Layers menu, Inspector ⋯, ⌘K | ✓ content | **No order/grouping, no type-specific group** (T2-3/4); "Apply style to all", "Reset style" missing (T6-6) |
| SC-4 Save status | Priority failure-first; "Saved" only after receipt | ✓ | Three save vocabularies (CMS / Assets / Forms) (T4 P31) |
| SC-5 Regions | F6 + ⌃` fallback; one banner slot | ✓ | P21 and P23 add banners outside the slot (D3-4, D3-21) |
| SC-7 Return chip / Fix | Fix in Editor keeps task; Fix elsewhere → tray + Back | ✓ | — |
| SC-8 Preview | Last Editor page, current breakpoint + frame width | ✓ width | Fonts/colours parity unaddressed (T1-23) |
| SC-12 Shortcuts | One table, platform-aware, single-key toggle (2.1.4) | ✓ | DESIGN.md lists an older key set (T7-10) |
| SC-13 Breakpoint cascade | Desktop → Tablet → Mobile; override dot; reset | ✓ cascade | Reset label and 5 stacked markers contradict FD-INS (T6-4, T6-5) |
| SC-14 Lock | Locked = not selectable on canvas; Layers-only; descendants inherit | ✓ | Inherited-lock marker missing in P04 (D2-11) |
| SC-15 Undo over confirm | Undo ≥8 s + 30-day Recently deleted; confirm only for listed exceptions | **✗ ~20 panel confirms outside the list** | CS-01 |
| SC-17 Multi-select | Toolbar Duplicate · Delete · Group · More; Mixed values | ✗ P05 says single only | T2-1 |
| SC-19 Narrow widths | Never cover the target; no auto-open overlay | ✓ | — |
| (missing) Latency targets | — | — | No response-time contract (P09 principle) |
| (missing) URL state | — | — | Reload loses area/record/task (Q12) |

## 2. Canvas and editing interactions

| Interaction | Trigger | Feedback | Success | Failure / recovery | Undo | Spec | Status |
|---|---|---|---|---|---|---|---|
| Select | click; ⌘click deepest; Esc parent | outline + tag + handles | Inspector shows element | locked → Layers-only + reason | n/a | P05 §6, SC-2, SC-14 | ✓ |
| Hover | pointer | 1 px outline + name | — | — | — | P05 CV-09 | ✓ (modifier hints undiscoverable) |
| Multi-select | ⇧click; marquee | combined box + multi toolbar | Mixed values in Inspector | — | — | SC-17 | **✗ contradiction P05 vs SC-17; marquee start rule; multi-resize** |
| Resize | handles; keyboard handle mode | W×H pill | value in Inspector | Esc cancels gesture | one step | P05 §6, T-CV-03/04 | ✓ (Tab vs handle-mode conflict) |
| Drag / move / reorder | drag; ⌥↑↓ (Layers) | insertion line, valid/invalid, path pill | dropped | invalid drop reason; locked-drop copy | one step | P05 CV-13, P04 §7 | **✗ no state table** |
| Duplicate / clone | ⌘D; ⌘-drag | clone badge | copy selected | — | one step | SC-3, P24 row 3 | **✗ style loss (FI-02) + cancelled clone residue** |
| Inline text edit | double-click | format bar | commit | — | one step | P05 CV-15 | **✗ Enter/lists/line breaks** |
| Context menu | right-click; ⋯; ⇧F10 | menu | action | disabled-with-reason row | per action | SC-3 | **✗ order, type group, viewport clamp** |
| Insert (10 routes) | Add click/drag, ⌘K, quick-add, paste… | target subtitle "Adds after {X}" | flash + receipt toast | locked/stale-target refusal | one step | P03 §5 | ✓ |
| Delete | ⌫ | — | toast "N deleted · Undo" ≥8 s | Recently deleted 30 d | ✓ | SC-15, P24 | ✓ |
| Breakpoint switch | segments; width field | active segment + label | canvas reflows | — | view (no undo) | P05 §5, SC-13 | ✓ (icon-only label at <1000) |
| Zoom / fit | toolbar, keys | % | — | — | view | P05 | ✓ (1440 frame at ~52%) |
| Comment pin | Comments mode click | pin | thread | — | — | P05, P17 | ✓ |

## 3. Screen × state coverage

✓ specified · ~ partial / implied · ✗ missing · N/A not applicable. Source: per-panel States sections (D2, D3).

| Screen | Ideal | Loading | Empty | No results | Error + Retry | Permission / viewer | Offline | Partial | Long content | Many items | Success | Locked / plan |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| P01 Topbar | ✓ | ✓ | N/A | N/A | ✓ | ✓ | ✓ | ✓ | ~ | N/A | ✓ | ✓ |
| P02 Rail | ✓ | ✓ | N/A | N/A | ✓ | ✓ | ~ | N/A | ✓ (200%) | N/A | N/A | ✓ |
| P03 Add | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | **✗** | ✓ | **✗** | **✗** (Library paging) | ✓ | ✓ |
| P04 Layers | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | N/A (local) | ✓ | ✓ | ✓ (5,000 nodes) | — | **~** (inherited lock ✗) |
| P05 Canvas | ✓ | ✓ | ✓ (→P16) | N/A | ✓ | ✓ | **✗** | ~ | N/A | **✗** (perf) | — | ✓ |
| P06 Inspector | ✓ | ~ | ✓ | N/A | ~ | ✓ | ~ | Mixed **~** (no visual) | ~ | N/A | — | ✓ |
| Forms (inbox in P10; build + visitor unspecified) | ~ | ✗ | ~ (inbox) | ✗ | ✗ | ~ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| P07 CMS | ✓ | **✗** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ~ | ✓ | ✓ | ✓ |
| P08 Assets | ✓ | **~** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ (truncated) | ~ | ✓ | ✓ | ✓ (quota) |
| P09 Brand | ✓ | **✗** | ✓ | N/A | ✓ | ✓ | **✗** | ~ | ~ | **✗** (large token sets) | ~ | ✓ |
| P10 Settings | ✓ | ~ | N/A | ✓ (search) | ✓ | ✓ | **✗** | ✓ | ~ | N/A | ✓ | ✓ |
| P11 Pages / status | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | **✗** (writes) | ✓ | ✓ | ✓ (100+) | ✓ | ✓ |
| P12 Task host | ✓ | ✓ | **~** | N/A | ✓ | ✓ | **✗** | ~ | ~ | ~ | ✓ | ✓ |
| P13 Components | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | **✗** | ✓ | **✗** | **✗** (paging) | ✓ | ✓ |
| P14 Publish | ✓ | ✓ | ✓ | N/A | ✓ | ✓ | ✓ | ✓ | ~ | **✗** (checks overflow) | ✓ | ✓ |
| P15 Templates | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | **✗ (contradicts P22)** | ✓ | ✗ | ~ | ✓ | ✓ |
| P16 First run | ✓ | ✓ | ✓ | N/A | ✓ | ✓ | ✓ | ✓ | N/A | N/A | ✓ | N/A |
| P17 Client review | ✓ | ✓ | ✓ | ~ | ✓ | ✓ | ✓ | ✓ | ~ | ~ | ✓ | ✓ |
| P18 ⌘K / Help | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ~ | ✓ | ✓ | ✓ |
| P19 Interactions | ✓ | **✗** | ✓ | N/A | ✓ | ✓ | **✗ (state N/A?)** | — | ✗ | ~ | ✓ | ✓ |
| P21 Collaboration | ✓ | ✓ | ✓ | N/A | ✓ | ✓ | ✓ | ✓ | ~ | ✓ | ✓ | ✓ |
| P22 Global states | ✓ | ✓ | N/A | N/A | ✓ | ✓ | ✓ | ✓ | N/A | N/A | ✓ | ✓ |
| P23 Plans & trial | ✓ | ✓ | N/A | N/A | ~ | ✓ | ✓ | ✓ | N/A | **~** (active set) | ✓ | ✓ |
| P24 Undo / Recently deleted | ✓ | ✓ | ✓ | ✗ (no search) | ✓ | ✓ | ✓ | ✓ | ✗ | ~ | ✓ | ✓ |
| Export | ✗ no spec | | | | | | | | | | | |

Missing-state totals: Offline ✗ in 10 screens · Loading ✗/~ in 7 · Long content ✗/~ in 17 · Many items ✗/~ in 12 (Forms counted in each). These are the state boards the first Figma pass must add.

## 4. Interaction matrix — panels 14–25

| Interaction / flow | Trigger | Feedback | Success | Failure / recovery | Undo | Panel § |
|---|---|---|---|---|---|---|
| Publish site | CTA / footer → dialog | "Saving…" → "Saved {time}" → "Publishing n/N…" ring + step list | "Your changes are live…" + toast View live | §7 reason table; live site named unchanged; Try again / View log | None (republish) | 14 §5.3–5.5 |
| Fix a check | Check row Fix › | Opens target, task kept / tray | Checks re-run | No owner → "How to fix" line | — | 14 §5.2 |
| Publish start timeout | No job id | "Checking whether the publish started…" | Resumes running view | "Publishing didn't start. Nothing changed." | — | 14 §5.4 |
| Poll lost | 3 poll failures | "Checking status…" 5 s × 1 min | Resumes | "We lost track… Check status" | — | 14 §5.4 |
| Republish release | History row | Confirm (facts) | New release | "no longer stored" disabled | — | 14 §5.6 |
| Unpublish | ⋯ (ADMIN) | Typed confirm | Toast "Site unpublished · Publish again" | — | Confirm (SC-15) | 14 §5.7 |
| Open Templates | 7 doors | Mode bar Creating/Replacing | Catalogue/preview | Stale target refusal | — | 15 §5.1, §5.2a |
| Create page from template | Preview › Create page | Progress overlay (4 stages) | Editor on new page + toast | T-1 copy; "Taking longer…" | Toast Undo after T-4; confirm until then | 15 §5.2, §5.4 |
| Replace page | Preview › Replace | Confirm + backup | Toast "replaced · Backup… · Undo" | Backup-failure dialog | Toast Undo / ⌘Z | 15 §5.3 |
| Delete saved template | Saved card ⋯ | Toast | Removed | Mechanism unspecified (D3-24) | Toast Undo | 15 §5.5 |
| Empty-canvas start | Card click | Preview in Replacing | Content on page; step 1 ticks | — | Replace Undo | 16 §4.1, §5.2 |
| Checklist step complete | Outcome event | Non-modal toast "✓ step — Next ›" | Pill count | Offline → queued | — | 16 §4.3–4.4 |
| Dismiss checklist | ✕ | Toast "hidden · Undo · bring it back from Help" | Hidden (server) | — | Toast Undo | 16 §5.3 |
| Send review round | Send for review | Snapshot render → outcome modal | Link + email | Render fail keeps dialog: Try again / Send without preview | — | 17 §5.1 |
| Client comment | Add comment / crosshair / C | Anchored composer | Pin + list row | "Not sent… Send again" | — | 17 §4.1, §5.3 |
| Client approve | Approve Round n | Confirm + emailed code | Approved card + receipt | Already answered; offline disabled | None (OD-R6) | 17 §5.3 |
| Revoke link | ⋯ | Confirm | Chip → Not sent/Review | — | Confirm (SC-15 exception) | 17 §5.2 |
| Resolve comment | ✓ | Pending until ack | Resolved | — | Toast Undo (OD-U7) | 17 §5.4 |
| Open palette | ⌘K / ⌘⇧P / ⋯ "Search ⌘K" | Field commit first (SC-17) | Palette, scoped chip | Invalid field → stays | — | 18 §5.1 |
| Run command | Enter | Closes; focus to destination | Recent updated | Toast "Couldn't {action} — {reason} · Retry" | Per action | 18 §5.5 |
| Disabled row Enter | Enter | Assertive reason; stays open | — | — | — | 18 §5.6 |
| Toggle single keys | Sheet toggle | Rows show "off" | Keys stop | — | Toggle back | 18 §5.9 |
| Add interaction (preset) | + Add / SC-3 / ⌘K | Row added, focus, plays once (not under reduced motion) | Toast "Interaction added · Undo" | Root/multi/locked disabled with reason | Toast Undo / ⌘Z | 19 §4.2, §5.1 |
| Edit timing | Field type | Draft | Commit on Enter/blur = 1 step | Esc reverts | ⌘Z | 19 §5.2 |
| Play | ▶ | "Playing…" / "Finished" | Animates once | Hidden at breakpoint → disabled | Transient | 19 §5.3 |
| Delete interaction | ⋯ Delete | Toast | Removed, focus next | — | Toast Undo | 19 §5.2 |
| Join presence | Open editor (flag on) | Pill "N here" | Roster | "Couldn't load people — Retry" | — | 21 §5.1 |
| Follow | People › Follow / tag | Border + "Following Ana · Stop" | View tracks | Stops on Esc/edit/leave with reason | — | 21 §4.4 |
| Type in a peer-edited text | Double-click | Confirm "Ana is typing here" | Edit anyway | Wait | — | 21 §4.3 |
| Peer saved (Phase A) | MP-12 | Banner "Ana saved changes · Get latest" | Backup then reload | Without MP-12: ConflictModal | — | 21 §5.2 |
| Session expiry | 401 | Dialog / banner | Auto resend (G-2) | Different account → Download | — | 22 §5.2 |
| Offline | `offline` | Banner 6 + status | "Back online — changes saved" | Partial → Save failed | — | 22 §5.3 |
| Conflict | SAVE_CONFLICT | 720 dialog | Download / Reload (confirm) / Overwrite (confirm) | Backup failure keeps dialog | — | 22 §5.4 |
| Permission lost | FORBIDDEN / focus read | Banner 5, view mode | — | Download changes | — | 22 §5.5 |
| Crash | Boundary | Card with computed safety line | Reload | Download a copy first | — | 22 §5.9 |
| Other tab | BroadcastChannel | Banner 7 | Edit here takes over | Other tab save fails → stays editable | — | 22 §5.12 |
| Hit a plan limit | Action at limit | Disabled + "{used} of {limit} on {plan}" | Upgrade (OWNER) | "Ask the workspace owner" | — | 23 §4.4 |
| Upgrade | Upgrade dialog | Billing in new tab | Locks lift on focus (TR-3) | "Upgraded? Reload to unlock" | — | 23 §4.5, §5.7 |
| Trial ends | `trialEndsAt` | Notice under topbar | — | Over-limit items lock | Choose what stays active | 23 §5.5 |
| Remove protection and publish | Blocking row | Confirm names domain | Public site + badge | "protection was removed… live site still protected" · Restore protection | None | 23 §5.6 |
| Area-aware ⌘Z | ⌘Z outside Editor/Brand | Area toast action or "Nothing to undo here — Open Editor to undo" | — | — | — | 24 §4.3 |
| Restore deleted page/component | Recently deleted › Restore | Toast "About restored · Open" | Same ID/slug | Slug taken → new slug; offline disabled | — | 24 §4.8 |
| Opt-out of telemetry | Account › Privacy toggle | — | No events stored | Publish events until A-5 | Toggle back | 25 §6.4 |

---

## 5. Component state requirements

Every interactive component must define D · H · A · F · S · Di · E · L · X where applicable — table and gaps in DESIGN_SYSTEM_SPECIFICATION §4. Components with **no state spec at all** today: numeric + unit, colour picker, box-model, alignment, accordion/section, banner.
