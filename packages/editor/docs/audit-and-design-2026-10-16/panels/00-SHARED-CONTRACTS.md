# Panel 00 — Shared cross-panel contracts (FD-PNL-00)

> **BD-25 — compact Pages width, 2026-10-18:** normal Pages/Structure/rename/recovery manager is284px, matching Add/Layers. Rail56px + panel284px =340px. Supersedes earlier560px normal manager width; expanded Listings remains720px. See the canonical brief and `pages-compact-width.md` evidence.

> **BD-24 — latest owner correction, 2026-10-18:** Pages management is in the left rail after Layers. The bottom bar contains created-page tabs and save status. This overrides earlier bottom Pages-button / no-Pages-in-rail instructions in this record and its historical references. The manager anchors beside the 56px rail, below the 56px topbar, above the 32px bottom bar; existing widths, guard/return and permission contracts remain. See the canonical decision in PRODUCT-DESIGN-BRIEF.md and `evidence/figma-design-execution/pages-placement-correction.md`.

Date 2026-10-17 · Mode: DESIGN ONLY
Status: **SPEC COMPLETE (written scope) · not VERIFIED** (independent cross-panel audit: pass 1 NO with 28 items; pass 2 24 resolved + 4 partial + 5 new issues — all fixed afterwards). Runtime NOT RUN. Product-design review 2026-10-17 (`REVIEW-2026-10-17-pro-product-design.md`): recommendations applied as SC-11…SC-19 and amendments marked *(R-1017)*; owner instruction 2026-10-17 "han likh do". Status vocabulary: SC-16.
**2026-10-18 owner decisions applied** (design-audit-2026-10-18/OWNER-DECISIONS-2026-10-18.md): S1, S2, S3, S4, S5, P3, C1, C2, C3, C4, C5, C7, N2, N5, N6, V1, V2, V3, V4, V5, V6, V7, V8, V9, P9, R1 (via 00-STRATEGY §7); all 45 recorded in SC-23. Gap rows: D1-9, D1-10, D1-17, D1-20, D2-3, D2-9, D2-10, D2-14, D2-28, D2-29, D3-16, D3-30, T1-03, T1-04, T1-18, T2-1, T2-3, T2-4, T2-5, T2-6, T2-7, T2-8, T2-9, T2-11, T2-13, T2-14, T2-20, T2-30, T2-33, T3-1, T3-6, T3-14, T3-18, T4-4, T4-8, T4-9, T4-22, T5-01, T5-02, T5-03, T5-10, T6-2, T6-4, T6-5, T6-6, T6-8, T6-21, T6-28, T7-21, T7-22, T7-25, T7-31; CS-01…CS-16, CS-17 (search Esc only), CS-19…CS-22. Round 2: Q1, Q2, Q3, Q4, Q5, Q6, Q7, Q8, Q9, Q10, Q12, Q13, Q14, Q15, Q16 (Q11 lands in Panel 10; Q12 detail in Panel 07, owned elsewhere) *(R-1018b)*.
Purpose: one definition for rules that several panels use. **Where a panel's text differs from this file, this file wins.** Owner instruction 2026-10-17: all designer recommendations accepted.

---

## SC-1 Back slot and label
- **Slot:** left end of the 56px workspace / work-area header (CMS, Assets, Brand, Site settings, Templates, Components, Compare, Preview bar). Never inside the local nav, so it survives the ≤1280 nav collapse (GEO-01).
- **Label:**
  - Direct entry (rail, topbar, shortcut, ⌘K) → **"‹ Back to Editor · {page}"** — restores page, selection, breakpoint, zoom (IA exact return).
  - Contextual entry (origin frame, NAV-01) → **"‹ Back to {origin}"** (e.g. "‹ Back to Heading", "‹ Back to Add", "‹ Back to Pages").
  - Preview bar follows the same rule (from Editor: "‹ Back to Editor"). The word "canvas" is not used in back labels.
  - **Direct entry from a workspace** *(R-1017; resolves the SC-1 / Panel 01 §5.8 / IA-03 / T-IA-09 conflict)*: a topbar door (Preview, Site settings) opened while another workspace is active returns to **that workspace and its exact state** — "‹ Back to CMS", "‹ Back to Assets". From Editor it stays "‹ Back to Editor · {page}". This is not an origin frame (no return chip, no stack); it is "return to where the topbar was pressed".
- Direct navigation never pushes an origin frame (NAV-01); topbar Site settings is direct navigation.
- **One label pattern** *(R-1017)*: every back control — header slot, return chip, task header — reads "‹ Back to {origin}". "‹ Review", "‹ Inspector", "‹ Add" become "‹ Back to Review", "‹ Back to Inspector", "‹ Back to Add". "‹ Back to Inspector" in a task header shows only when the Inspector was visible before the task opened; otherwise the header has ✕ only.

## SC-2 Escape ladder (every surface)
1. Revert the focused field's unapplied draft (while typing, the first Esc only does this).
2. Close the open popover / menu / dialog.
3. Back out of a subview or detail to its list.
4. Clear an active search.
5. Otherwise **no-op**.

- **Two contexts, two Esc results** *(R-1018, C4 / D2 reconciliation)*: **inline canvas text editing — Esc commits and leaves text mode** (C4; ⌘Z reverts the edit); **Inspector / form field drafts — Esc reverts the draft** (step 1). Panels use these exact words.

- **Nested text tools (clarification, 2026-10-22):** while a Link dialog or formatting menu is open inside inline text editing, its focused form draft and overlay own Escape first. Revert an unapplied link-field draft if present; the next Escape closes the dialog and restores the text selection/edit mode. Escape commits and exits inline text only after that nested overlay is closed. Closing or cancelling the Link dialog never discards the parent text draft.

- **Only the canvas changes selection** (Panel 05 ladder: gesture (a cancelled ⌘-drag clone removes the copy *(R-1018, T2-8)*) → inline text → menu → comment mode → **stop Follow** (Panel 21) → **select parent; at the page root, clear selection** *(R-1017 Change — builder convention "Esc backs out one level"; replaces 05 step 5 "clear selection")*).
- **Declared exceptions** *(R-1017; these are the only ones)*:
  - **Code fields** (Site settings › Custom code, Embed): Esc moves focus out of the field and **keeps the text** — step 1 never reverts code.
  - **Search fields** (Add, Layers, Assets, CMS, Templates): step 4 "clear" then a second Esc **blurs** the field (no other effect).
  - **Inspector outside a field**: step 5 moves focus to the canvas (selection unchanged) — the Inspector is the canvas's property sheet, so this counts as "back one level".
  - **Right task with nothing open inside it**: first Esc closes the task (Panel 12 Close semantics).
  - **AI prompt fields** (Panel 20, inactive under SC-21): Esc blurs the field and keeps the typed prompt.
  - **Inspector Play running** (Panel 19 §5.3): first Esc stops Play and resets the element; focus stays on ▶.
  - **Inline text on the canvas** *(R-1018, C4)*: Esc (or a click outside) **commits** the text and leaves text editing; the element stays selected. Step 1 never reverts inline text — ⌘Z undoes it (SC-17). Keys inside text: SC-12 "Text keys".
  Any other panel text that differs from the ladder is overridden.
- **Nothing closes on Esc** except temporary sheets (Pages manager, Asset picker, dialogs) and right-column tasks (Panel 12, Close semantics).
- Layers: clear search → second Esc blurs the field (search-field exception above) *(R-1018, D2-3 — was "no-op")*; **Change:** no deselect, no panel close.
- Compare and Time Travel own their Esc (exit to exact origin).

## SC-3 Shared element-action registry
One registry; every menu draws from it with the same label and shortcut.

| Action | Shortcut | Canvas context menu | Selection toolbar More | Layers row menu | Inspector header ⋯ |
|---|---|---|---|---|---|
| Duplicate | ⌘D | ✓ | ✓ (button) | ✓ | ✓ |
| Delete | ⌫ | ✓ | ✓ (button) | ✓ | ✓ |
| Copy / Cut / Paste | ⌘C / ⌘X / ⌘V | ✓ | ✓ | ✓ | — |
| Copy style / Paste style | ⌘⌥C / ⌘⌥V | ✓ | ✓ | — | ✓ |
| Lock / Unlock | ⌘⇧L *(R-1017 NEW)* | ✓ | ✓ | ✓ | ✓ |
| Group / Ungroup | ⌘G / ⌘⇧G | ✓ | ✓ | ✓ (Group + Ungroup *(R-1017)*) | — |
| Wrap in container / Unwrap | — | ✓ | ✓ | — | — |
| Rename | F2 (Layers) | — | — | ✓ | ✓ (name field) |
| Show in Layers | ⇧L | ✓ | ✓ | — | ✓ |
| Save as component… | — | ✓ | ✓ | ✓ | ✓ |
| Bind to CMS field… — every surface lands in **Inspector › Content with the field picker open** for the selected element (owner Q7) *(R-1018b)* | — | ✓ | ✓ | — | ✓ |
| Replace with block… | — | ✓ (sections) | ✓ | — | — |
| Move to page… | — | ✓ | ✓ | ✓ | — |
| Select children | — | ✓ | ✓ | ✓ | — |
| Move up / down / into above / out | ⌥↑ / ⌥↓ (up/down) | ✓ | ✓ | ✓ | — |
| Arrange: **Move to top of parent / Move to bottom of parent** *(R-1018, T2-33 / principle P06: was "Bring to front / Send to back" — the action changes sibling order, not z-index; label only, behaviour unchanged)* | ⌘⌥] ⌘] ⌘[ ⌘⌥[ *(R-1017: moved off ⌘⇧]/⌘⇧[, which switch browser tabs)* | ✓ | ✓ | — | — |
| Add interaction | — | ✓ | ✓ | — | ✓ |
| Apply style to all {type} on this page *(R-1018, T6-6 — existing Inspector ⋯ action)* | — | — | — | — | ✓ |
| Reset style *(R-1018, T6-6 — existing)* | — | — | — | — | ✓ |
| Show on canvas *(R-1018, D2-14 — existing Layers row action)* | — | — | — | ✓ | — |
| Copy link *(R-1018, D2-14 — existing Layers row action)* | — | — | — | ✓ | — |
| Paste into / Paste after *(R-1018, D2-14 — existing Layers row action)* | — | — | — | ✓ | — |
| Open component — **instance rows only** *(R-1018, N1; Panel 04 §5)*: opens Components with the main selected, back "‹ Back to Layers" | — | — | — | ✓ | — |
| Edit text — text/heading/button types *(R-1018, C2 type-context; surfaces the existing Inspector "Edit text on canvas", INV 8.2 / #51–53 — no new capability)*: enters inline edit | — | ✓ (type-context) | — | — | — (Inspector body keeps "Edit text on canvas") |
| Edit link — link/button types *(R-1018, C2 type-context; surfaces the existing Inspector Link section, INV #98)*: opens Inspector › Link, focused | — | ✓ (type-context) | — | — | — |
| Open collection › — Collection list *(R-1018, C2 type-context; surfaces the existing Inspector "Open collection ›", INV B38 / #111)*: opens CMS on that collection, origin return SC-1 | — | ✓ (type-context) | — | — | — (Inspector Collection list section keeps it) |
| Detach instance — component instances *(R-1018, C2 type-context; surfaces the existing ComponentRow action, INV #49 / D22; SC-15 class (a))* | — | ✓ (type-context) | — | — | ✓ (identity details, Panel 13 §9) |
| Improve with AI — inactive (SC-21) | — | ✓ (if AI available) | ✓ (omitted when AI is unavailable — Panel 20 §4.7) | — | ✓ (Ask AI) |

**Menu group order — one order on every surface** *(R-1018, C2 / CS-16, T2-3, T2-4)*. Every SC-3 menu (canvas context menu, selection toolbar More, Layers row menu, Inspector header ⋯) shows its eligible rows in these groups, separated by dividers, in this order; a group with no eligible row is omitted:
1. **Type-context** (canvas context menu only) — the selected element type's own actions that **already exist in the registry** (e.g. Image: Replace image…, Edit alt text). The rule adds no new action; a type with none has no group.
2. **Clipboard** — Copy · Cut · Paste · Paste into / after · Duplicate · Copy style · Paste style · Copy link.
3. **Structure** — Group / Ungroup · Wrap in container / Unwrap · Select children · Replace with block… · Save as component… · Open component (instances) · Bind to CMS field… · Move to page… · Show in Layers · Show on canvas · Rename.
4. **Arrange** — Move up / down / into above / out · Move to top / bottom of parent.
5. **State** — Lock / Unlock · Add interaction · Apply style to all {type} on this page · Reset style.
6. **Delete** — always last, alone.
- **Viewport clamp** *(R-1018, CS-16, T2-13)*: every menu, submenu and popover stays inside the viewport minus 16 px on each side; it flips or shifts instead of clipping.
- **Disabled rows** *(R-1018, T2-14)*: an ineligible-but-relevant row is shown disabled with its reason (SC-18 / Panel 18 row pattern); rows that never apply to the selection are omitted.
- Decision #17 (INV A1.9 "multi-delete needs a confirm design") is **overridden** by the Delete rule below *(R-1018, T7-21)*.
Lock and permission refusals are the same for every surface (Panel 04 §6).
**Group ≠ Wrap** *(R-1017; Panel 04 §7 "no separate Wrap" is overridden)*: Group wraps a multi-selection in a new container and is undone by Ungroup; Wrap in container wraps one element; Unwrap lifts children out of a container that was not created by Group. Both stay in the registry.
**Same behaviour on every surface** *(R-1017)*: Delete of one or many elements never asks for confirmation on any surface — it uses Undo (toast "N elements deleted · Undo"). Panel 04 §7 "N>1: existing confirm + Undo" becomes Undo only.
Shortcut scope and platform mapping: SC-12.

## SC-4 Status wording
- Priority (bottom-bar status, Panel 11): **Conflict › Save failed › Offline › Saving › Unsaved › Saved**.
- Brand: **"Brand changes applied locally"** until the document save receipt, then **"Brand changes saved"**.
- **Save vocabulary — five states, every surface** *(R-1018, CS-12; replaces "Record saving / Record save pending / Record saved / Record save failed", "Uploading · Waiting to sync", "Saved to site", "Saved directly")*: **Saving…** · **Saved** · **Couldn't save — Retry** · **Applies on next publish** (a saved change that reaches the live site only on publish) · **Offline — will save when back online**. A surface may prefix its object ("Record saved"); it never invents another state. "Saved" only after the server receipt (SC-9). The Brand pair above is the Brand form of Saving… / Saved.
- **Declared exception — "Only on this device"** *(R-1018, Panel 07 T4-18)*: a CMS collection the **server refused** (not an offline queue) shows "Only on this device" with Retry. It is not "Offline — will save when back online": the device may be online and reconnecting will not save it — only Retry or a fix will. No other surface uses it.
- Per-owner rows require the receipt registry (SC-9); until then only the page row.

## SC-5 F6 order (NAV-04 amendment)
topbar → **global banner slot (Panel 22 §4.2, only while a banner shows)** → rail → left panel / local nav → canvas toolbar + canvas (or workspace body) → Inspector / right task → bottom bar.
**Fallback chord** *(R-1017)*: browsers own F6 (address bar) and do not always pass it to the page, so the same region cycle is also on **⌃`** (next) / **⌃⇧`** (previous). Acceptance: verified in Chrome, Safari, Firefox on macOS and Windows before either key is called working.

## SC-6 Viewer access matrix

| Surface | Viewer |
|---|---|
| Topbar | Exit, site name + live dot, Site settings **disabled with reason** ("Site settings needs Editor access" — SC-28 pattern *(R-1018)*), Review chip (read-only status, opens Review read-only) and Comments when reviews are on (viewers may create site comments, IAF-19), bell, Preview, disabled CTA with reason, ⋯ view-mode menu |
| Rail | Add, CMS, Brand disabled with reason; Layers, Assets enabled; **no viewer group** (Review → topbar chip, History → bottom status Versions › / H *(⌘H removed, SC-12)*, Activity → bell footer) |
| Canvas | select, hover, comments; toolbar breadcrumbs (select-only) + View group |
| Layers | tree, search, select, Dim in editor; no structural actions |
| Inspector | existing viewer body (INS-D03) |
| Assets | read-only, own uploads + site fonts |
| CMS / Brand / Components / Site settings | not available |
| Pages | strip switching; manager button disabled with reason |
| Right tasks | History, Review, Activity read-only; Publish viewer reason; no AI, no Issues |
| Status | "View only · Versions ›" |

## SC-7 Return chip in Editor
- When Editor is entered through a contextual frame, the canvas toolbar Editing group shows a chip **"‹ Back to {origin}"** left of Undo. Clicking it returns to the origin and its exact state; deliberate navigation (rail, page switch) dismisses it.
- Sources: CMS › Dynamic pages "Edit template", Site settings › Form submissions "Configure in Inspector", Review "Edit {element}" (Review closes; chip "‹ Back to Review"), Components "Choose on canvas" (chip replaced by the source-picking banner, Panel 05 §8), CMS → Data Conditions index "Locate".
- **Topbar Publish outside Editor** *(R-1018b, owner Q15)*: pressing Publish while CMS, Assets, Brand, Site settings, Templates or Components is the active area opens the **Publish task in the task tray of that area, in place** — no switch to Editor, no return chip; closing the task leaves the user exactly where they were. Same tray model as a Publish "Fix ›" target in another area (next bullet). Unsaved Site settings edits still get SC-24 "Save settings first?" before the task opens.
- Issues "Fix ›" **and Publish check "Fix ›"** keep their task open beside the canvas — no chip. A Publish Fix target in another area opens that area with Publish in the task tray; Back follows SC-1 (Panel 14 §5.2).

## SC-8 Preview

**BD-34 (2026-10-20):** Preview runs the site’s scripts and interactions in a sandbox that cannot access the editor. Preserve exact page/breakpoint/width/record and return context. This is an execution contract; Figma Preview specimens do not verify script execution or isolation.

Opens the last Editor page at the current breakpoint **and current frame width** (incl. a saved custom width). A template page previews the canvas Record-switcher record (FD-DYN-01 §13). Desktop width 1440 (parity with export). Back per SC-1. Note added to CTRL-05. **Draft record** *(R-1017; resolves SC-8 vs FD-DYN-01 D5)*: if the switcher record is a Draft, Preview shows it with a top bar "Draft record — visitors won't see this page until it is published"; published output still never includes drafts. **Custom width** stays an editor/preview width only — export parity is with the 1440 Desktop frame.
- **Render parity** *(R-1018b, owner Q6)*: the canvas and Preview must render **as published** — same fonts (site fonts loaded, same fallback order) and same colors (Brand tokens resolved the same way as the published CSS). Engineering dependency: SC-9 "Preview/canvas render parity". **Interim note** until it ships: the Preview bar shows a neutral info line "**Fonts and colors may differ slightly until published**" *(DS)*; it is removed when the SC-9 row ships. The note never appears on the published site.

## SC-9 Engineering dependencies register

**Release-blocking** *(R-1017)*: a row marked ⛔ may not ship its panel with the fallback alone; the interim guard named in the panel is mandatory.

| Dependency | Needed by | Fallback until shipped |
|---|---|---|
| Per-operation save **receipt registry** | 01 §7.4, 07 §5, 08 §5, 09 §9, 11 §8 | Status shows page save only; CMS keeps its own record messages; T-PG-08, T-CM-06 BLOCKED |
| Library **revisions** + library query including current-site-only components | 03 §6.6, 13 §4/§7 | "Library" without version, no Update available |
| Activity target ids + cursor pagination | 12 §5 | Panel-level open; no Load more |
| Publish job ids for "Compare vN-1 → vN" — **same work as Panel 14 P-4** (stable release numbers + both job ids) | 12 §5, 14 §5.5 | Opens History › Published |
| CMS record undelete endpoint | 07 §5 | Restore as new record |
| ⛔ CMS field tombstone + type-conversion endpoint *(R-1017)* | 07 §6 | Field delete refused when any record holds a value; type change refused when any record holds a value |
| ⛔ CMS collection **undelete** (soft delete already exists server-side: `cms.service.ts:307-318` sets `deletedAt` on the collection and its entries) *(R-1017, corrected 2026-10-17)* | 07 §8 | Collection delete blocked while bound; confirm says "Deleted collections can't be restored from the editor yet" (the data is kept on the server) |
| CMS bulk-operation API *(R-1017, was only in 07 §14)* | 07 §5 Bulk | Per-record calls with a progress count; partial results listed |
| CMS field-write receipts *(R-1017)* | 07 §6 | "Saving…" until the response; no optimistic Saved |
| Slug-taken check on exact Restore *(R-1017)* | 07 §5 | Restore refuses with "Slug in use — Restore with a new slug" |
| Server-side component cap (100) *(R-1017)* | 13 §5 | Client cap only; server error copy shown if exceeded |
| Server filter / sort / pagination at publish *(R-1017)* | FD-DYN-01 §18 | As FD-DYN-01 states |
| Page / component / collection / **saved page template** *(R-1018b, Q16)* "Recently deleted" (30 days) *(R-1017, SC-15)* | 07, 11, 13, 15 | Undo toast only, with the item named |
| Site-wide asset usage scan incl. Site settings + Brand references *(R-1017)* | 08 §6 | When the E-4 confirm shows (asset has known placements), it also says "May be used as favicon, social image or brand image — check Site settings" |
| Command palette K-1…K-8: shortcut table as data, capability resolver, per-user single-key pref, library query (same work as the Library revisions row above *(R-1018, D1-17)*), record search, read-only gate for quick-add, cross-page layer index, restorable history clear *(R-1017)* | 18 §11 | as Panel 18 §11 states |
| ⛔ Client review R-4 (notifications/emails; interim: no "You will be notified", 60 s chip refresh) and ⛔ R-11 (staleness from round snapshot time; interim: compare with round createdAt); R-1…R-3, R-5…R-10, R-12…R-14 *(R-1017)* | 17 §11 | as Panel 17 §11 states |
| ⛔ Interactions IXD-3 (Preview script sandbox + CSP + postMessage rules) and ⛔ IXD-4 (reduced motion in published script AND exported CSS; interim guard mandatory); IXD-1, 2, 5–11 *(R-1017)*; IXD-12 "Reverse when the pointer / focus leaves" runs in the published runtime and canvas Play *(R-1018, T2-18)* | 19 §11 | as Panel 19 §11 states; IXD-12: Reverse toggle hidden, stored `reverse` kept |
| Plans & trial ⛔ TR-1, TR-2, TR-6, TR-7, ⛔ TR-12 (server refuses `OVER_FREE_LIMIT` on writes/publish for locked items; persisted active set + Billing "Choose what stays active"; unlock on webhook) (detail of P-TRIAL); TR-3…TR-5, TR-8…TR-11 *(R-1017)* | 23 §11 | no trial / as Panel 23 §11 states |
| ⛔ Access gate applied immediately (OD-C3 decided, SC-22): password protection / access changes take effect on the live site at once via a server gate *(R-1017)* | 10 §7, 14 §5.2, 23 §5.6 | today's behaviour: applies on next publish, with the C-3 "stays public until you publish" warning (Panel 10 §7) — mandatory while the gate is missing |
| ⛔ AI-D1 (server checks site role from siteId, refuses below EDITOR before reserving quota — mandatory interim guard; plan from site's workspace effective plan); AI-D2…AI-D8 *(R-1017)* | 20 §11 | as Panel 20 §11 states |
| ⛔ Global states G-2 (resend only for same user) and ⛔ G-12 (recovery copy per user; interim: userId inside copy, offered only to that user, cleared on Sign out after Download offer); G-1, G-3…G-11 *(R-1017)* | 22 §11 | as Panel 22 §11 states |
| ⛔ Undo U-1 (⌘Z checks active area; interim guard: outside Editor and Brand document Undo/Redo is blocked with "Nothing to undo here — Open Editor to undo", never runs); U-2…U-5, U-7 *(R-1017)* | 24 §11 | as Panel 24 §11 states |
| Templates T-1…T-5: create+import as one operation, apply operation id, saved-template rename (delete already exists), create-page undo incl. nav entry, Figma board 4418:54134 *(R-1017)*; **T-6** re-author the 10 built-in templates on Brand tokens, no purple/violet/indigo (content work, owner N7) *(R-1018)* | 15 §9 | as Panel 15 §9 states (create confirm stays until T-4); T-6: interim "Connect to Brand colors" offer (Panel 15 §5.7) |
| First run F-1 (= ⛔ A-1 — blocks Panel 25 events only; Panel 16 ships on the F-1 fallback), F-2, F-3, F-5: analytics pipeline + data contract + editor-telemetry opt-out, server checklist dismissal + RailCoach flag + user-namespaced cache, wizard brand answers written as tokens, Figma board 4428:44164 update *(R-1017)* | 16 §9 | as Panel 16 §9 states |
| ⛔ Server-side enforcement of Blocking pre-publish checks in `startPublish` (P-1) *(R-1017)* | 14 §5.2 | UI-only gating; 14 stays "blocked" |
| ⛔ **P-9 Vercel protection capability check** *(R-1018, S7 / T5-08)*: read at check time whether the connected Vercel plan supports password protection; a 402/403 on protection becomes a refused publish (`PROTECTION_UNSUPPORTED`), never a silent public deploy (`publish.service.ts:996-1015`) | 14 §5.2, §11 | None safe — the Blocking row can't be shown without it; Panel 14 stays "blocked by P-9" |
| Draft-vs-live diff, active-job query (+ job id in `ALREADY_PUBLISHING`), stable release numbers (= P-4, the Publish job ids row above *(R-1018, D1-17)*), server `simulated` flag, publisher notification, stored-revision publish, actor on history rows (P-2…P-8) *(R-1017)* | 14 §11 | as Panel 14 §11 states |
| ⛔ Settings revision stamp | 10 §5 | Last write wins, no false Saved + mandatory interim read-compare-write on Save (10 §5, flag-independent); concurrent-edit banner only when collaboration presence is available (Panel 21 MP-4) |
| Page capacity query | 11 §6 | Post-save error |
| ⛔ FI-03 persistence (P1-D18) | 08 §5 | **Interim guard (08 §5): unsaved local image shown as Save failed; exit/close blocked with Retry / Remove / Stay** — cross-device recovery waits for P1-D18 |
| Site-font owner name field | 08 §7 | Owner name not shown |
| D8 published runtime script | FD-DYN-01 P4b | Live sources "Coming soon" |
| ⛔ MP-3 Collaboration Phase A: server-stamped identity (id, display name, avatar, role) on every presence/op frame | 21 §11 | None — Phase A does not ship; presence hidden |
| ⛔ MP-4 Collaboration Phase A: ephemeral presence channel (roster on join, heartbeat 10 s / timeout 30 s, leave on pagehide, area+page+breakpoint+record+selection+editing) | 21 §4–5, 10 §5 banner | None — Phase A does not ship (ping/pong unused; op log can't give a roster) |
| ⛔ MP-5 Collaboration Phase A: transport seeds lastSeq from hello, handles resync/revoked (with demoted/removed reason), reconnects from last seq, dedupes | 21 §5.6 | None — Phase A does not ship |
| ⛔ MP-1 Collaboration Phase B: convergent merge (server seq total order, own ops rebased; or CRDT) | 21 §5.2 | Phase B off |
| ⛔ MP-2 Collaboration Phase B: one server document (join = saved revision + later ops; peers don't stale each other's CAS) | 21 §5.2 | Phase B off; CAS + ConflictModal |
| ⛔ MP-6 Collaboration Phase B: durable op outbox + acks | 21 §5.4 | Phase B off |
| ⛔ MP-8 Collaboration Phase B: collab-aware undo (transform inverse, skip if not applicable) | 21 §5.3 | Phase B off |
| Collaboration MP-7 viewer presence stream, MP-9 viewport broadcast, MP-10 server room cap + cursor coalescing, MP-11 page-space cursors, MP-12 save notification on the presence channel | 21 §11 | as Panel 21 §11 states |
| ⛔ Analytics A-1, ⛔ A-3, ⛔ A-4 (OD-A4 decided: opt-out built before launch); A-2, A-5…A-13 *(R-1017)*: pipeline + legal gate (A-1), catalogue (A-2), HMAC key (A-3), opt-out (A-4), publish actor (A-5), retention, emit points, editor_ready, QA flag, effective plan, creationMethod, reason_code, failed-step fix | 25 §11 | as Panel 25 §11 states |
| ⛔ **CMS conflict rebase** *(R-1018, S6 / T4-17)*: base-version tracking per open record + mandatory server precondition, so Keep mine re-applies only my changed fields on the latest version (today Keep mine resends the copy from conflict time and the precondition is optional — INV B43) | 07 §5 Conflict | None stated — release-blocking; Panel 07 stays "blocked by conflict rebase" |
| Real upload progress *(R-1018, T4-3)*: `onUploadProgress` wired through `MediaManager` → `AssetUploadService` | 08 §5 Progress | Indeterminate "Uploading…" with no percentage; synthetic 25/50/75 milestones removed |
| Forms *(R-1018, T4-1 / F-ST-S47 / F-FM-15)*: (1) server refuses submissions for a form that was never published and a success redirect never targets an unpublished site; (2) published runtime handles the response so visitor outcome states show **inline under the form** | 06 §3.1 F8, Visitor outcome states | (1) the F8 note "This form starts collecting submissions after you publish." only; (2) today's separate plain result pages |
| Components CP-D1 cursor paging on the component library query; CP-D2 record instance overrides per breakpoint and state (C7, INV D14) *(R-1018)* | 13 §10, §12a | CP-D1: full list as today; CP-D2: today's behaviour — Tablet/Mobile/state edits on instances not recorded, no override count |
| Activity exact items, Replace across site all-or-none *(R-1018, D1-17: "Settings conflict" merged into the ⛔ Settings revision stamp row)* | 12, 08 | as each panel states |
| ⛔ **Recovery Restore checks the server first** *(R-1018, S1 / T5-01)*: "Restore my edits" compares the kept copy's time with the server's last save; server older → Restore; server newer → **Download my copy** + **Compare**, never a silent overwrite. Fix exists on an unmerged branch (`765343348`). **= Panel 22 ⛔ G-13** *(R-1018)* | 22 §5.2, §7, §11 | Interim guard (mandatory): until it merges, the offer shows Download my copy + Compare only — no Restore that writes to the server |
| ⛔ **Site-scope authorization** *(R-1018, T5-02; decided PDB P1-D20 and FI-05 / T-FI-05, ref `feat/phase1-s5-authz` 7140abdd2)*: (1) review revoke — role is checked on `input.siteId` but the review is matched only by workspace (cross-site revoke, `review.service.ts:461-478`); (2) `reviews.resolve` checks workspace ADMIN and ignores the per-site role (`reviews.ts:180-187`); (3) `site-component.library` / `libraryGet` and `theme.targets` / `getShared` / `snapshots` have no site scope (INV Y45). Acceptance: the server refuses every cross-site call. **(1) = Panel 17 ⛔ R-15; (2) = Panel 17 ⛔ R-16** *(R-1018)* | 17, 13, 09, 03 | None — release-blocking |
| ⛔ **Duplicate / paste keep breakpoint and :hover styles** *(R-1018, FI-02 / T-FI-02, T2-7)* | 05 §6, 24 | None — release-blocking; acceptance T-FI-02 (a duplicated or pasted element keeps its Tablet, Mobile and hover values) |
| ⛔ **"Before overwrite" save** *(R-1018, S4)*: Overwrite in a save conflict first writes the server version to History › Saves as "Before overwrite · {time}", then overwrites; the toast links to it. **= Panel 22 ⛔ G-14** (Panel 24 row 59) *(R-1018)* | 22 §5.4, 12 History, 24 | None — Overwrite ships only with the snapshot |
| ⛔ **Named-version soft delete** *(R-1018, S5 / T3-6)*: deleting a named version moves it to History › Saves › Recently deleted for 30 days (Undo toast). **= Panel 12 ⛔ RT-D1 = Panel 24 ⛔ U-8** *(R-1018)* | 12 History, 24 | Interim guard: class (b) consequence confirm "This version will be deleted permanently — it can't be restored yet" |
| ⛔ **Form `pageId` / `sourceUrl` persistence** *(R-1018, T4-8)*: form submissions store the page and URL they came from, so "Configure in Inspector" (SC-7) reaches the exact form | 10 Forms, SC-7 | Interim guard: when the form isn't on the open page, the action reads "Form not on this page — **Open page ›**" |
| ⛔ **Brand "From logo or URL" off the `dsAi` flag** *(R-1018, P3 / T7-22)*: it is not AI (deterministic extraction) and ships this version; engineering moves the entry and `theme.extractBrandFromUrl` off `NEXT_PUBLIC_FEATURE_DS_AI`. **= Panel 09 BR-08b** (T-BR-14) | 09 | Until moved, the entry stays hidden with the flag (as today) and Panel 09 does not ship it |
| Asset quota checks real bytes, not the client-declared size *(R-1018, T4-9)* | 08 | Quota trusts the declared size (as today) |
| **Preview/canvas render parity** *(R-1018b, owner Q6)*: canvas and Preview load the published site fonts and resolve Brand colors exactly as the published CSS does (C5.4 content-rule fix `2530f1626` covers content only, not fonts/colors) | SC-8, 01 §5 Preview, 05, 09 | Interim note in the Preview bar "Fonts and colors may differ slightly until published" (SC-8) |
| **Deferred Source persistence** (BD-39, 2026-10-21 supersedes Q12) | Future Sources specification in 07 §10.1 and CMS-DYNAMIC-BINDING-DESIGN | Sources management and stored-JSON source choices are hidden behind the disabled release flag. No local-only persistence claim. Retain historical specifications and existing data; do not delete bindings as part of hiding the UI. |

## SC-10 Amendments register (owner accepted all recommendations, 2026-10-17)

| Amendment | Source | Panel |
|---|---|---|
| CMS exact Restore (same ID) | DEC-IA-06 / IAF-07 H/K | 07 |
| Page settings footer Save/Cancel | IAF-05 E/G | 11 |
| Desktop authoring 1440 + saved custom width | IAF-02 F / DEC-IA-04 | 05 |
| Site settings header 56 (from 112), footer 48 | GEO-01 / board 8134:212121 | 10 |
| Brand header 56, nav 240 | IA-02 / GEO-01 | 09 |
| F6 order | NAV-04 | SC-5 |
| Layers Esc (no deselect/close) | — | 04 / SC-2 |
| Dense tool rows 32 (Add, Layers) | GEO-01 | 03, 04 |
| Templates primary entry Pages → New page → From template | IA-01 | 03, 11 |
| Viewer Site settings route withdrawn | IAF-20 K | 01, 10 |
| Publish interior redesigned (one review-and-publish dialog; gate modal → banner; topbar Running/Failed states; Fix return model) | Panel 14 (R-1017) | 01 §5.9, 12 RT-10, SC-7 |
| "Release" = site publish; component verb "Share update" | Panel 14 review B2 | SC-11, 13 §6 (edited) |
| Templates becomes an area in the shell (not a full-screen portal); search + Show filter; create confirm → Undo (after T-4); EDITOR may replace (OD-T1 accepted); noun "Page template" | Panel 15 (R-1017) | SC-11, 02, 03, 05, 11 — **text follow-ups applied 2026-10-17:** 03 ("section templates", Blocks footer door), 05 §8 ("Existing CTA unchanged" → Panel 16 §4.1), 11 ("Templates workspace", "Blog template ⧉" → "Collection page") |
| Plans: Free (badge) + Pro, with a 30-day free Pro trial per workspace; replaces the brief "everything free" rule (OD-T2 final, owner 2026-10-17) | owner | SC-20; 08, 10, 11, 14, 15, 16, SC-18 |
| Keyboard legend card retired; rows → shortcuts sheet BASICS; rail Help → Help popover (removal) | IAF-21 K / Panel 18 §9 | 18, 02, 16 |
| ⋯ menu "Command palette ⌘K" row → menu header entry "Search ⌘K" | Panel 18 | 18, 01 §6 |
| Viewers get the palette with disabled-with-reason rows | SC-6 / SC-18 / IAF-20 E | 18 |
| ⌘K in Assets opens the palette scoped "In Assets"; `/` focuses area search | IAF-09 M09-A3.38 / Panel 18 | 18, 08 |
| Clear history: chrome-ui confirm until K-8, then no confirm + "History cleared · Undo" | SC-15 / Panel 18 | 18 |
| Comment pins also visible while the Review task is open; client pins labelled "Client" | Panel 17 §4.4 | 05 CV-17 |
| Review chip words: Not sent · Review · Sent · Opened · Changes requested · N · Approved · Approved · edited since · Link expired (R-12); no revoked chip | Panel 17 §4.4 | 01 TB-05 |
| Review task: round card, Client/Team filter, audience toggle, footer "Send Round n+1", "‹ Back to Review", reply guard | Panel 17 §4.3 | 12 RT-11, RT-06 |
| Publish Approval row "(not required)" when off; banner "review link expired · Re-send ›"; staleness from round snapshot time; revoked latest round = no review | Panel 17 §5.2, §5.5 | 14 §4.1, §4.3 |
| Confirmation kept for revoking a client review link | Panel 17 §5.2 | SC-15 |
| Preview runs only Buildrick's interaction script under IXD-3 controls (reverses IAF-15 C for that script; custom code never runs) — on OD-I1 | Panel 19 §5.4 | SC-8, IAF-15 |
| SC-18 Interactions one-liner replaced by Panel 19 | Panel 19 | SC-18 |
| "Add interaction" opens the Add picker on every SC-3 surface incl. Inspector ⋯; page root disabled with reason | Panel 19 §5.1 | SC-3, 06 |
| Publish checks gain a WCAG 2.2.2 Blocking motion row; Issues gains motion tips | Panel 19 §5.8 | 12, 14 §5.2 |
| **Inactive while SC-21 holds** *(R-1018, D3-30)* — AI contract: 7 entry classes, scope/cost/privacy lines, one approval = one Undo step + "Undo this run" with stop rule, "AI prompts" noun, viewers no AI, AI opens with I — inactive (SC-21) | Panel 20 | 03, 05, 09, 11, 12, 16, SC-2, SC-3, SC-11, SC-12, SC-18 — **text follow-ups applied 2026-10-17:** 12 RT-09 ⌘J → I; 12 "Undo all" → "Undo this run's N changes"; 03 §6.4 Generate Enter (⌘Enter alias) + Keep · Undo footer; 16 T-FR-20 copy; 09 BR-08 Apply = shared-Undo transaction |
| Global banner slot under the topbar; banners join the F6 cycle; persistent conditions move from toasts to banners | Panel 22 | SC-5, 01, 11, 05 §9 |
| Bell rows for this site open their in-editor target with no navigation/exit guard; others open in a new tab; mark-read failure keeps the row unread | Panel 22 §5.11 | 01 §5.7 |
| ⌘Z acts on the document only in Editor and Brand; other areas run their own live recovery toast or show "Open Editor to undo" | IA-02 / Panel 24 §4.3 | 05, 09, 18 |
| Pages and Components Recently deleted layout owned by Panel 24; Assets Recently deleted 30 days (NEW, OD-U3) | SC-15 / 24 §4.8 | 08, 11, 13 |
| A toast's Undo is disabled once newer edits exist; every recovery toast stays ≥ 8 s | 24 §4.4 | all |
| History › Session rows "verb + target + place", dividers for opened/cleared | 24 §4.5 / IAF-18 | 12 RT-12 |
| CMS bind/unbind becomes an undo step (U-3) | 24 | 05, 07 |
| Page delete: ⌫ deletes with Undo toast + Pages › Recently deleted (was a confirm, T-PG-06) | 24 / SC-15 | 11 |
| Esc stops Follow: canvas ladder step after "exit comment mode", before "select parent / clear selection" | Panel 21 §4.4 | 05, SC-2 |
| Site settings concurrent-edit guard = two layers: read-compare-write on Save always (flag-independent, mandatory) + "{name} is also editing" banner only when presence is available | Panel 21 §5.5 | 10 §5 |
| "Start collaboration" (menu, ⌘K) → automatic presence join; menu/⌘K row "People on this site…"; presence cluster opens a People popover | Panel 21 §5.1 (OD-CL-2) | 01 §5.6, §6 |
| Empty canvas: template cards primary, open their preview; checklist reordered, Connect client only when eligible, template apply counts for step 1; achievement toast non-modal | Panel 16 (R-1017; amends IAF-21 H and Panel 05 §8) | 05, 02, IAF-21 |

**Removals/changes accepted under BD-15:** Widen-to-700 (Layers, Pages, Components — replaced by bounded resize / workspaces); in-session audio insertion (server never accepted audio); implicit asset replace on click; Esc no longer leaves workspaces; Time Travel band → dedicated area; save pill → bottom status.

## SC-11 Glossary — one noun, one meaning *(R-1017)*
This list wins over panel wording. Panels keep their text until edited; implementation and Figma use these words.

| Use | Means | Do not use for this |
|---|---|---|
| **Site** | the whole website being edited | project |
| **Page** | one URL in the site; static or dynamic | screen |
| **Page template** | a ready-made page layout you create a page from or replace a page with; area name **Templates** (Panel 15) — *amended 2026-10-17: was "Starter page", which clashed with Brand › Starters* | "starter page", "site template" (dashboard multi-page templates only) |
| **Section** | a full-width ready-made part of a page (hero, pricing, footer) — the 8 cards in Add | "block", "section template" |
| **Element** | any single thing on the canvas, of any registered element type *(R-1018, T3-18 / T7-31: the "69 types" count removed — 69 is the block-record count, the engine type count differs; the number comes from the code registry, not this glossary)* | "block" |
| **Component** | a reusable element group; one **main** and many **instances** | master, definition, saved master, symbol |
| **Main component** | the component definition; **Open component** navigates to its detail. **Push to master** is the separate root-only update command (BD-32) | master, definition |
| **Release** | one successful site publish (History › Published lists releases; "Republish this release", IAF-16 H) — *amended 2026-10-17 after Panel 14 review B2* | a component update |
| **Library update** / **Share update** | a new version of a library component made available: "Share update v5" | "publish", "release" |
| **Component library** | components shared across the **workspace's** sites (BD-16 — not a personal library across workspaces) *(R-1018, D1-9 — was "the account's sites")*; tag "Component library · v4" | "library" alone |
| **This site** (Components scope) | main components made on this site **plus** library components already adopted here — each listed **once** *(R-1018, N2 / T3-1)* | — |
| **Component library** (Components scope) *(R-1018 — scope noun was "Library"; "library" alone is banned by the row above)* | workspace library components **not yet on this site** (adopt to use) *(R-1018, N2)*; Panel 03 and 13 counts derive from these two scopes | "all library items, adopted or not" |
| **Asset** | an uploaded file: image, video, file, font | media, file (in UI titles) |
| **Assets library** | your assets (personal — "Only you see these"), filterable to this site *(R-1018, D1-10 — was "the user's asset list for this site")*; error copy "Not saved to Assets — Retry" | "library" alone |
| **Collection** | a CMS table (Blog) | |
| **Record** | one row of a collection | item, entry |
| **Collection page** | the page that repeats once per record | "template page", "CMS template" |
| **Brand** | the site's colours, type, spacing, imagery tokens and classes | theme, design system (in UI) |
| **Token** | one named Brand value (Primary, Body size) | variable |
| **Font-size token** | a Brand type-size token as chosen in the Inspector and in Brand *(R-1018, T6-2 / CS-14; FD-INS-02 wins)* | Text style, Size preset, Type styles |
| **Class** | a named shared style applied to elements | |
| **Area** | one destination of the editor shell: Editor, CMS, Assets, Brand, Site settings, Templates, Components | "workspace" |
| **Workspace** | the organization (dashboard level) only | an editor area |
| **Save** / **Version** | an automatic or named saved state in History › Saves; "Versions ›" opens History › Saves | snapshot |
| **Restore point** | the automatic copy Brand makes before a bulk Brand change is applied: starter, import, scale, Dark Auto, From logo or URL, theme push *(R-1018, T6-21 — widened from "starter or import")*, and **Connect** — "Before connect" (owner Q9) *(R-1018b)* | snapshot |
| **Publish** | make the site live | |
| **Current breakpoint** | the breakpoint being edited now | previewed / authored breakpoint |
| **Page root** | the page itself; crumb label "Page", Layers top row "Page", Inspector "Page" | Body |
| **Getting started** | the editor's onboarding checklist and its Help entry (Panel 16) | "Get started", "Learn Buildrick" |
| **AI prompt** — inactive (SC-21) *(R-1018, D3-30)* | one request to the AI model; the unit of the daily AI limit — "{used} of {limit} AI prompts today on {plan}" | AI request, credit, generation, token |
| **AI site draft** — inactive (SC-21) *(R-1018, D3-30)* | a whole site drafted by AI from the dashboard wizard; monthly limit | AI generation |
| **Changes not published** | count of saved changes since the last publish: "N changes not published" | "unpublished" alone |
| **Planned** | a capability that is designed but not built yet (flagged-viable) *(R-1018, CS-15)* | Coming soon, Soon |
Spelling: US English in UI copy (Color, Optimize) — **tab and section labels included** *(R-1018, T6-8 / D2-26)*: Inspector tab **"Behavior"**, Brand **"Colors"**, "Color mode", "favorites". No label is exempt.

## SC-12 Shortcut scope and platform table *(R-1017)*
- **Scope** of every shortcut: **Canvas** (canvas or Layers focused, not editing text) · **Text** (inline text editing) · **Field** (any input) · **Global** (anywhere except Field and Text). A shortcut fires only in its scope; Field and Text keep the browser's own meaning (⌘Z field undo, ⌘B bold, ⌘⇧V paste as plain text).
- **Platform:** ⌘ → Ctrl, ⌥ → Alt, ⌃ → Ctrl on Windows/Linux unless the row says otherwise. Tooltips and the shortcuts dialog show the user's platform.
- **Single-key shortcuts** (A L M D B P T U H R C ? / and type-ahead; I inactive while SC-21; **S removed** — Site settings has no shortcut, owner Q4 *(R-1018b)*) can be turned off: **Shortcuts dialog › "Single-key shortcuts" on/off** (WCAG 2.1.4). Default on. ⌘/ always opens the dialog.

| Action | Was | Now | Scope | Why |
|---|---|---|---|---|
| History | H / ⌘H | **H** (+ bottom status "Versions ›") | Global | ⌘H hides the browser on macOS; Ctrl+H is browser history on Windows |
| Zoom to fit | ⌘1 | **⇧1** | Canvas | ⌘1 switches browser tab |
| Zoom to selection | ⌘2 | **⇧2** | Canvas | ⌘2 switches browser tab |
| Zoom 100% | ⌘0 | **⇧0** (⌘0 kept as alias where the browser passes it) | Canvas | ⌘0 is browser zoom reset |
| Rulers | ⌘R | **⇧R** | Canvas | ⌘R reloads the page |
| Badges | ⌘B | **⌥B** | Canvas | ⌘B is Bold in Text scope |
| X-Ray | ⌘⇧X | **⌥X** | Canvas | ⌘⇧X is strikethrough in Text scope |
| Move to top / bottom of parent (was "Bring to front / Send to back" — SC-3 *(R-1018)*) | ⌘⇧] / ⌘⇧[ | **⌘⌥] / ⌘⌥[** | Canvas | ⌘⇧]/[ switch browser tabs |
| Time Travel | ⌃⇧T | ⌃⇧T on macOS; **Alt+Shift+T** on Windows | Global | Ctrl+Shift+T reopens a closed tab |
| Paste HTML | ⌘⇧V | ⌘⇧V **Canvas scope only** | Canvas | in Text/Field it stays paste as plain text |
| Show in Layers | ⇧L | ⇧L **Canvas + Inspector only** | Canvas | never in Text, Field or Layers type-ahead |
| Lock / Unlock | — | **⌘⇧L** | Canvas | builder convention |
| Open AI task — inactive (SC-21) | I / ⌘J / ⌃J / ⌃⇧A | **I** (+ ⌘K "Ask AI") | Global (single key) | ⌘J/⌃J/⌃⇧A are browser shortcuts (Panel 20) |
| Keyboard shortcuts dialog | ? or ⌘/ | **? or ⌘/** — the Help popover has no letter key | Global | ? was assigned twice |
| Preview | ⌘P | ⌘P (prevent print) + **⌘↵** alias | Global | verify interception per browser |
| Region cycle | F6 | F6 + **⌃`** / ⌃⇧` | Global | SC-5 |
| Command palette | ⌘K / ⌘⇧P | **⌘K** + ⌘⇧P alias | **Global incl. Field and Text** (declared exception, like F6) — an uncommitted field commits first (SC-17) | Ctrl+K on Windows Chrome/Firefox is address-bar search — must pass the three-browser acceptance; where it doesn't, that browser documents Ctrl+Shift+P (Panel 18) |
| Export site… *(R-1018, Panel 01 §14; INV 13.12)* | ⌘⇧E | **⌘⇧E** (existing chord, no other SC-12 or panel use) — opens the same dialog as ⋯ This site › Export site… and ⌘K | Global | kept; must pass the three-browser acceptance below (Firefox uses Ctrl+Shift+E for its Network tool) — removed, not remapped, if a browser does not pass it |
| Site settings *(R-1018b, owner Q4)* | ⌃, / ⌘, / S | **none** — access is the topbar Site settings button and ⌘K only | — | ⌘, opens the browser's own settings; owner: no shortcut |
| Focus mode — hide all panels *(R-1018b, owner Q5)* | ⌘\ (toggled the Inspector only, INV 1.6) | **⌘\** hides every side panel — left panel (Add / Layers), Inspector and right task — so only the canvas shows — **rail, topbar and bottom bar hide too** (owner Q5 option: "sirf canvas"). Kept: the canvas toolbar (breakpoint, zoom) and a small floating pill "Show panels ⌘\" for mouse exit *(DS)*; Panel 22 banners and error/Undo toasts still appear over focus mode, so failures are never hidden *(DS)*. **Exit:** ⌘\ again restores exactly the panels that were open; clicking a rail item or a key that opens a panel also leaves focus mode with that panel shown *(DS)*. **Esc does not exit focus mode** — it keeps its SC-2 meaning | Global | Figma / Framer convention; must pass the three-browser acceptance below |
| Focus area search | ⌘K (Asset library only) | **/** | Global (single key; off with the toggle) | gives ⌘K one meaning (Panel 18) |
| Next / previous element *(R-1018, C4 / T2-5)* | Tab (also "enters handles" in P05 §6) | **Tab / ⇧Tab cycle elements** — always; never enters handles | Canvas | one meaning for Tab |
| Keyboard resize mode (BD-39 supersedes C4 entry) | Former Enter entry | Enter on selected text starts inline editing. Resize retains its handle-mode interaction below; an alternate shortcut is an implementation decision still to be assigned. Do not advertise Enter as resize. | Canvas | Preserves text editing entry |
| Text keys *(R-1018, C4 / T2-9)* | Enter always commits; Esc reverts | **⇧Enter** line break · **Enter in a list** adds an item · plain **Enter** outside a list commits (as today) · **Esc** or click outside **commits** (SC-2 inline-text exception; replaces P05 CV-15 "Esc revert") | Text | lists could not get a second item; no line breaks |
Notes *(R-1018)*: **⌘↵** (Preview alias) is Global, so in a Field or Text it keeps the field's own meaning — Send comment (Panel 17), Generate (inactive, SC-21) (T7-25). The old ⌘K "zoom to selection" alias is **removed** — ⌘K is only the palette; zoom to selection is ⇧2 (T2-20).
Acceptance: each "Now" key verified in Chrome, Safari, Firefox (macOS + Windows); a key the browser does not pass is removed, not documented.

## SC-13 Breakpoint cascade *(R-1017)*
- **Breakpoints:** Desktop **≥1024** (authoring frame 1440; presets 1920 · 1440 · 1280 · 1024 are Desktop widths — "Wide 1920" is a **Desktop preset, not a breakpoint**), Tablet **768–1023**, Mobile **<768**. A custom width selects the breakpoint whose range contains it; the segment control follows.
- **Cascade:** Desktop is the base; values set on Desktop flow down to Tablet and Mobile; a value set on Tablet flows to Mobile; a smaller breakpoint never changes a larger one.
- **Inspector — override signalling, three levels only** *(R-1018, T6-5 / CS-04; FD-INS M07-39 / INS-18 model — replaces the five-marker list)*: (1) **context row** — one persistent scope line at the top of the Inspector ("Editing Tablet · N overrides"), not repeated per section; (2) **section count** — the section header shows "N overrides"; (3) **field dot** — an overridden field shows an accent dot. The same warning is never shown five times.
- **Reset** *(R-1018, T6-4 / CS-04; FD-INS IC-03 wins)*: the per-property action **names the layer it removes** — "**Remove Mobile override**" (not "Reset to Desktop"); its tooltip names the **resolved fallback** it will show, e.g. "Falls back to 24 px from Tablet". Inherited values show their source breakpoint in the tooltip.
- **Component instances** *(R-1018, C7 / T3-14)*: edits to an instance at Tablet, Mobile or a state (hover) are recorded as **instance overrides** with the same cascade and the same three signals; Remove override returns the instance value to the main component's value for that layer.
- **Structure is not per breakpoint:** move, reorder, reparent, group, delete and insert change every breakpoint. **Interactions also apply to all breakpoints** (Panel 19 §5.6); their own first-edit note replaces this section's note for interaction rows. When the current breakpoint is not Desktop, the toast says so: "Moved · applies to all breakpoints · Undo". Visibility (hide on Tablet) is the per-breakpoint way to differ.
- **Hidden everywhere:** an element hidden on Desktop, Tablet and Mobile shows a "Hidden everywhere" marker in Layers and is announced.
- **First-time explanation:** the first edit on Tablet or Mobile shows a one-time inline note in the Inspector: "Changes here apply to Tablet and Mobile. Desktop stays the same."

## SC-14 Lock scope *(R-1017)*
Locking an element locks it **and all its descendants** (Figma convention). Locked descendants: selectable from Layers only (not from the canvas), no move / resize / delete / inline text edit / Inspector writes / insert inside; they show an inherited-lock marker (outline lock icon) in Layers. **On the canvas** *(R-1018b, owner Q8)*: hovering or clicking a locked descendant shows a small badge at the element **"Locked by {parent} — unlock in Layers"** *(DS: badge = canvas label style, Lucide lock icon; click on "Layers" runs Show in Layers on the locking parent)*; the click does not select the descendant. Add: **click-insert** is disabled while the target is locked, but **rows stay draggable** — the drop is refused only at locked drop points ("Locked — drop somewhere else").

- **One lock copy everywhere** (2026-10-17): element lock — "Locked — unlock to edit"; plan lock (SC-20) — "Over the Free limit — Upgrade to edit" (owner) / "Over the Free limit — Ask the workspace owner to upgrade" (others). The two are never mixed: an element lock is the user's choice, a plan lock is the plan's.

## SC-15 Recovery — Undo over confirm, 30-day Recently deleted *(R-1017)*

**BD-29, owner2026-10-19:** form-field type conversions belong to(a) when lossless (direct apply + one Undo), and(b) when existing data/options would be removed (specific consequence; default Cancel). No always-confirm rule. Stable IDs and compatible style/attributes/references must survive; otherwise refuse the conversion. This resolves Panel06§7 and supersedes the older ambiguous Inspector confirmation wording.
- Deleting a **page, component (main), collection, record or CMS field** moves it to that area's **Recently deleted** list for 30 days with Restore (same ID where the server supports it — SC-9). Undo toast as well.
- **Three classes — every destructive or consequential action belongs to exactly one** *(R-1018, S2 / CS-01; resolves D2-8, D3-6, T1-03, T1-04, T3-2, T4-22, T5-03, T6-28)*:
  - **(a) Undo only** — no dialog; toast ≥ 8 s "**{Name} {verb} · Undo**", plus "· Recently deleted ›" where the object has a Recently deleted list (SC-28 delete toast). Applies to: delete **page, main component, collection, record, CMS field** (as today, with E-1…E-3 below); **element delete** (SC-3); **archive / unarchive site**; **locale remove**; **redirect delete**; **detach instance(s)** (one or all); **update main component from selection**; **set primary domain**; **named-version delete** (S5 — History › Saves › Recently deleted, 30 days; needs SC-9 ⛔ named-version soft delete); **saved page template delete** (owner Q16 — Templates › Recently deleted, 30 days; Panel 15, Panel 24) *(R-1018b)*; **History › Saves "Restore to draft"** *(R-1018 reconciliation; Panel 12 History, Panel 24 row 54)* — it first writes the "Before restoring" safety version, so it is undoable: no dialog; a persistent **Undo restore** from the safety version, with a revision check (≥ 8 s, IAF-18 G/H). It resets the ⌘Z stack, so recovery is the toast's Undo restore or Restore of the safety version — never ⌘Z.
  - **(b) Consequence confirm** — a plain dialog that states the consequence in one sentence; default button = **Cancel**. Applies to: **replace page from template**; **create page from template until T-4** (then Undo, SC-10); **republish**; **reload latest** (discards local changes); **overwrite** in a save conflict (only after the "Before overwrite" save, S4); **remove password protection and publish**; **change a live page's slug**; **Inspector column reduction that removes content**; **component Reset that drops overrides** *(DS)*; **choosing the active set on plan downgrade** *(DS)*; **duplicate site** *(DS)*; **form submission delete** *(DS)* — "Delete N submissions permanently" (submissions are hard-deleted); **change the site URL slug** (Panel 10 §5.1, alongside the live page slug) *(R-1018)*; **Approve a review round** (Panel 17 CR-11 — existing confirm, + code step with OD-R7) *(R-1018)*; **Publish with errors / stale approval** (Panel 14 §4.3 — the errors confirm and stale-approval choice, now checkboxes in the one publish dialog) *(R-1018)*; **named-version delete — interim only** (today's confirm until SC-9 ⛔ named-version soft delete / U-8 ships, then class (a) — S5; temporary) *(R-1018)*. Unchanged from before and in this class: **delete a domain**; **revoke a client review link** (a revoked token is never reissued, so Undo can't restore it — a re-send issues a new link; Panel 17); **Clear undo history until K-8 ships** (E-5); **discard a kept unsaved copy** (Panel 22 §7 — the copy is the only record of work the server never received; "Not now" only hides it), including the RecoveryBanner "Discard & reload" *(T1-18)*; **lossy CMS field-type conversions**; **asset delete while placed** (E-4); **History › Session / Time Travel "Restore to here"** — the existing warning that counts the later steps and redo it drops (Panel 24 row 53, IAF-18 G; it was missing from this list) *(R-1018 reconciliation)*.
  - **(c) Typed confirm** — the user types the confirmation text the dialog asks for (as each action already specifies, e.g. DELETE for site delete). Applies to: **delete site** (the screen also states "You can restore it from Recently deleted for 30 days"); **unpublish site**; **transfer site**; **permanent delete from any Recently deleted list** (resolves D2-9: typed everywhere, ADMIN+); **CMS E-1 / E-2 / E-3** below.
  - **Duplicate name** ("create anyway?") → an **inline warning** under the name field, no dialog.
- **Declared exceptions (Panel 24 §4.9):** **E-1** typed confirm to delete a CMS record that owns a generated page (07 §5); **E-2** typed confirm for collection delete (07 §8); **E-3** typed confirm for CMS field delete when N > 0 records hold a value (07 §6 C-4, kept after the tombstone ships because it states the data count); **E-4** asset delete confirm while the asset has known placements, until U-4 ships (server hard-deletes after the 8 s grace, 08 §5); **E-5** Clear undo history confirm until K-8 ships (18). Page delete is **not** an exception: Undo + Pages › Recently deleted (Panel 11 T-PG-06 overridden). **Every confirm in the product is listed here; a panel that needs another must add it here first.** *(R-1018, S2)* **Advisory prompts (not confirms)** *(R-1018)*: a prompt that protects nothing destructive and refuses nothing — e.g. Panel 21 "Ana is typing here" [Wait] [Edit anyway] *(DS)* — is not a confirm and needs no class; it must keep a non-blocking path (Edit anyway).
- **Page delete** (Panel 11 §5): ⌘Z restores the page with its slug, folder and settings in the session; after the session, Pages manager › Recently deleted.
- **Main component delete** (Panel 13 §6): instances are detached, and Restore re-links them; the Undo toast names "N instances on M pages detached" (no confirm — component delete is not an SC-15 exception).
- **Revert in Brand "Review changes"** is a new undoable step (⌘Z re-applies the reverted change).

## SC-16 Status vocabulary for these docs *(R-1017)*
- **SPEC COMPLETE** — every section written; independent review findings resolved.
- **VERIFIED** — SPEC COMPLETE + checked in the running app at 1440×900 + geometry measured + SC-9 ⛔ rows shipped or guarded.
- "DESIGN READY" is retired. No panel is VERIFIED today. A panel with an open ⛔ dependency shows "SPEC COMPLETE · blocked by {dependency}".

## SC-17 Focus and undo in fields *(R-1017)*
- ⌘Z inside a text field (inline text, rename, width field, search, Inspector input) is **field undo** until the field is committed (Enter / blur); after that it is document undo.
- After an undo that removes an inserted element, selection returns to what was selected before the insert.
- **Multi-selection:** the selection toolbar shows Duplicate · Delete · Group · More; the Inspector shows shared properties with "Mixed" for differing values (FD-INS-02 mixed rule); insert target = after the **last selected element in document order**.
  - *(R-1018, C3 / T2-6)* **Resize handles are hidden** in a multi-selection this version — the canvas shows one **combined bounding box** (outline only) and the toolbar; no handle resizes only the primary element.
  - *(R-1018, T2-1)* The toolbar is **anchored to the combined box** (same placement rules as the single-selection toolbar, Panel 05 §6).
  - *(R-1018, C5 / T2-11)* **Marquee:** **Shift+drag anywhere** on the page (not only the 20 px strip outside it) draws the marquee; it selects elements at **one depth** — never a parent together with its children (which depth is picked: Panel 05 §6).

## SC-18 One-line contracts for surfaces without a panel spec *(R-1017)*
Until their own panel spec exists, these rules bind every panel:
- **Plan limits / upgrade** (in force on Free after the trial — SC-20). Billing rights = workspace OWNER (`billing.ts:41-49`); a plan lock is never worded as a role lock. Per-gate copy (Panel 23 §4.4/§7): inline line "{used} of {limit} on {plan}", shown as a near-limit warning **from 80 %** on every gate (existing threshold; *(R-1018, T4-4)*); at the limit the action is disabled with reason and **"Upgrade"** (owner) / **"Ask the workspace owner to upgrade"** (others, OD-PL-4). Same wording on Pages, Assets quota, AI quota (when AI returns — SC-21), Components cap, Site settings plan locks.
- **AI — not in this version (SC-21).** When it returns (Panel 20): every AI entry belongs to one class (insert, change, fill a field, read-only, background, shared resource, consequence). Before any request the surface shows **what AI looks at, what it can change, what it costs and what is sent to the provider**; before any change to existing content it shows **before → after**. **One user approval = one step in the shared document Undo** (Brand/component Apply included); a multi-step run also offers "Undo this run's N changes", which stops at the first newer edit and says so ("2 of 3 undone — stopped at a newer edit"); Redo is one step at a time. Background AI runs only after a one-time notice. Limits: "{used} of {limit} AI prompts today on {plan}" (trial: "· Pro trial"); Upgrade for the workspace owner, "Ask the workspace owner to upgrade" for others; rate limits never mention plans. Viewers get no AI; the server checks the site role on every AI request.
- **Session expiry:** a re-sign-in dialog over the current area; unsaved edits and the save queue are kept and resent after sign-in; nothing navigates away.
- **Command palette (⌘K):** searches actions from SC-3, areas, pages, components and records the user may access; disabled actions show their reason; a visible "Search ⌘K" entry exists in the topbar ⋯ menu header and the shortcuts dialog.
- **Interactions:** see Panel 19 (replaces this line).

## SC-19 Narrow widths — never cover the target *(R-1017; moved into number order R-1018, D1-20)*
When a right task (Issues "Fix ›", Review "Locate", CMS "Locate") or the Inspector overlay would cover the element it points to (≤1366), the canvas scrolls so the target sits fully in the visible part, and at ≤1280 the task sheet collapses to a 48px peek strip until the user re-opens it. After an Add insert at ≤1366 the Inspector overlay does **not** auto-open; the new element is selected and highlighted.

## SC-20 Plans: Free + Pro, with a 1-month free Pro trial (owner, 2026-10-17)
Owner, in order: *"free chaloo… us per pro likho"* → *"un ko bhee filhal free hi kar do"* → **final:** *"badge free per kar do ap. or pro option on kar do mager 1 month ka free trial ho ga log us ko free ma use kar saktey hein"*. This section replaces the short-lived "everything free" rule.

**Plans**
- **Free** — published sites carry the **"Made with Buildrick" badge** (existing, `route.ts:323-326`); Pro features locked; Free limits.
- **Pro** — no badge; Pro features (Pro templates, Site settings Custom code and Access/password protection, every other "Pro" item) unlocked; Pro limits (`lib/constants/plan-limits.ts`). Business unchanged.
- **Pro trial — 30 days free.** While the trial runs the workspace is treated exactly as **Pro** (features, limits, no badge).

**Trial rules** *(designer defaults — **accepted by the owner 2026-10-17: "sab theek hai abhi ka lia"**)*
| Rule | Default |
|---|---|
| Who | one trial **per workspace**, once; never restarts |
| Starts | automatically when the workspace is created (sign-up) — **no card needed**. Workspaces that exist on launch day get their 30 days from launch day |
| Shows | a **"Pro trial · {n} days left"** chip as the first row under the topbar ⋯ menu header (the header itself holds only "Search ⌘K" — Panels 01 §6, 18, 23 *(R-1018)*) and in Site settings › Overview; clicking opens Billing. Pro items keep their **"Pro"** chip during the trial |
| Reminders | in-app notification + email at **7, 3 and 1 day** left ("Your Pro trial ends tomorrow — keep Pro or continue on Free" at 1 day) and on the last day ("Your Pro trial ends today") |
| Upgrade during trial | Billing › Choose Pro starts the paid subscription **when the trial ends** (no double charge, remaining trial days kept) |
| Trial ends without upgrade | workspace moves to **Free** automatically. **Nothing is deleted.** **Everything above a Free limit is locked read-only until the workspace buys Pro** (owner 2026-10-17): extra sites, pages beyond 10, domains, extra members (view-only), redirects, Pro-only settings — view/Preview/export and Delete (OD-PL-7) only; live sites keep serving their last publish. The newest-edited items up to the limit stay editable; the owner can choose which (Panel 23 §5.5) |
| Live sites after the trial | **unchanged** — editable sites: the next publish on Free adds the badge and drops Pro-only output (Publish shows this first, below); locked sites can't be published until upgrade and keep serving their last publish |

**Publishing after the trial (Panel 14 §5.2 gains a check row)**
- **"Pro features on this site"** (Tip): "Custom code won't be included on Free — Upgrade · Publish without it".
- **Password protection on a Free site** (**Blocking**, safety): "This site is password protected. On Free the protection is removed and the site becomes public — **Upgrade** · **Remove protection and publish**". Never published silently public.
- Badge row (Tip): "Free sites show 'Made with Buildrick' — Upgrade to remove".

**Resolver and Stripe rules (Panel 23, 2026-10-17):** trial = Pro is computed on read by one effective-plan resolver; a subscription that never collected a payment never unpublishes sites; the second-workspace rule counts only workspaces that have paid; one trial per workspace, and at most one per owner per 12 months (OD-PL-6, decided — SC-22); reminders by an hourly job in the workspace timezone at 09:00 local, trial ends at local midnight after day 30; choosing Pro with <48 h left anchors billing at trial end (or shows charge-now copy).

**Copy**
- During trial, Pro items: "Pro · included in your trial".
- After trial, locked items: SC-18 — "Available on Pro · Upgrade" (owner) / "Ask the workspace owner to upgrade"; over-limit items: "Over the Free limit — Upgrade to edit".
- Technical limits (file sizes, publish payload 2 MB/16 MB/500 pages, 100 components, AI rate limits) are not plan gates and never mention plans.

**Engineering (⛔ P-TRIAL — detailed as Panel 23 TR-1, TR-2, TR-6, TR-7, TR-12)** — none of this exists today (no trial in code; `Subscription.status` can hold `TRIALING` from Stripe but nothing creates an app trial, `server/services/subscription-status.ts:1-23`): `trialEndsAt` per workspace; one **effective plan** resolver (`PRO` while the trial is live) used by every gate, the badge (`route.ts:326` reads `ws.plan` directly today) and every server limit; expiry job + reminder notifications/emails; Billing starts the subscription at trial end; Publish check rows above. Fallback until shipped: plans work as today (Free/Pro, no trial).

## SC-21 No AI in this version (owner, 2026-10-17)
Owner: *"Ai ko is ma sae remove kar do… ai ka lia hum build ka aik alag tab baney gae vo bad ka kam hai, yeah version Ai ka bina ho ga, sirf doc ma update karna hai mager backend sae kuch remove ni karna"*.
- **Mechanism (Panel 20 §0):** all AI entry points (Panel 20 AI-01…AI-14) sit behind a new client flag **`NEXT_PUBLIC_FEATURE_AI`, default off** (its root CLAUDE.md env row is added in the same commit as the code that reads it — not before). While it is off, the **background AI hooks are not mounted** — auto alt text on upload (`useAltTextAutoTrigger`, `StudioPanels.tsx:275`) and History milestone-name suggestion (`useAutoMilestone`, `HistoryTab.tsx:152`) — so the editor sends **no site content** to the AI provider. Hiding UI alone is not enough. The **dashboard wizard's AI site-draft path is hidden too**; template and blank paths stay.
- **Security still ships:** the `ai.*`, `media.generateAltText` and `templates.generate` routes stay live, so AI-D1's server site-role check (refuse below EDITOR before reserving quota) ships anyway (backlog BK-001). Residual risk accepted with "backend stays": a signed-in user can call `ai.*` directly within their own daily quota.
- **Acceptance T-AI-00:** flag off → no AI door in editor, Assets, History, Page settings, Brand or the wizard; uploading an image and making 10+ edits sends no request to `ai.*` or `media.generateAltText` (network log); a VIEWER calling `ai.streamPrompt` with a `siteId` is refused.
- **This release has no AI in the UI.** Every AI entry point is hidden (not disabled-with-reason): Add › Generate a section, empty-canvas "Describe a section", right-column AI task + its key I, "Improve with AI" / "Ask AI" in every SC-3 menu, ⌘K "Ask AI", Brand DS-AI entries, SEO "Write with AI", alt-text generation **and the auto alt-text on upload toggle** (deferred to the AI Build tab, owner Q14 *(R-1018b)* — the manual alt field (Panel 08) and the publish missing-alt check stay), History AI summary, AI quota lines and AI copy in plan/upgrade dialogs.
- **Backend stays as is** — no AI route, service, table, env var or flag is removed. UI hiding uses the existing flags/config.
- **Brand › From logo or URL is not AI (P20) and ships this version (P3)** *(R-1018, T7-22)*: deterministic colour/font extraction, never labelled AI; it is not among the hidden "Brand DS-AI entries". Engineering moves it off `NEXT_PUBLIC_FEATURE_DS_AI` (SC-9 ⛔). Every other Brand AI entry stays hidden while SC-21 holds, whatever `NEXT_PUBLIC_FEATURE_DS_AI` says *(T5-10)*.
- **Panel 20 (AI)** is kept as the design for the future **AI "Build" tab** — status DEFERRED; its rules apply only when AI returns.
- Panels that mention AI keep their text for later; for this version **SC-21 overrides them** (03, 05, 09, 12, 16, 18, 20, 23, 24, 25 …). First-run step 1 counts only section inserts and template applies. Analytics `ai_*` events are not emitted. The SC-12 "Open AI task — I" row and the SC-3 "Improve with AI" row are inactive.

## SC-22 Owner decisions accepted (2026-10-17)
Owner: *"baqi theek hein"* — every designer recommendation listed in the reply of 2026-10-17 is accepted, except the two items above (trial over-limit → SC-20; AI → SC-21). In each panel the matching OD-* is **decided as recommended**:
- **17 Client review:** OD-R1 agency_layer on for all (flag = kill switch) · OD-R2 no plan gate · OD-R3 one signer · OD-R4 frame read access after security review · OD-R5 replies visible only when "To {client}" · OD-R6 no withdraw · OD-R7 email code before Approve.
- **18 Palette:** OD-18-2 palette in read-only view with "Exit view mode" · OD-18-3 no topbar ⌘K button.
- **19 Interactions:** OD-I1 Preview runs Buildrick script under IXD-3 · OD-I2 retire only the GSAP InteractionRuntime path · OD-I3 "Scroll to element" later · OD-I4 old scroll interactions keep "Every time".
- **20 AI:** deferred with the panel (SC-21).
- **21 Collab:** OD-CL-1 Phase A first · CL-2 auto-join + Hide my cursor · CL-3 viewers "Viewing" · CL-4 no plan gate, seats are the gate · CL-5 advisory text lock "Wait / Edit anyway" · CL-6 no cursor data stored, 24 h op-log retention.
- **22 Global:** OD-1 read-only canvas + Download when the site fails to load · OD-2 phone notice, no editing · OD-3 last 2 versions of Chrome/Edge/Firefox/Safari.
- **23 Plans:** OD-PL-2 paid downgrade never unpublishes · OD-PL-3 trial domains stay connected (locked) · OD-PL-4 "Ask the workspace owner to upgrade" (SC-18/SC-20/15 copy updated) · OD-PL-5 page-level custom code is Pro · OD-PL-6 one trial per owner per 12 months · OD-PL-7 allow Delete on locked items.
- **24 Undo:** OD-U1 area ⌘Z runs that area's live toast · U2 no document undo for Site settings · U3 Assets Recently deleted 30 days · U4 no undo after reload · U5 skip peer-changed steps · U6 100 steps + divider · U7 Undo for comment resolve.
- **25 Analytics:** OD-A1 map AI names in reports (inactive while SC-21) · A2 HMAC ids · A3 13 months · A4 opt-out, sharing on by default, built before launch (A-4 ⛔) · A5 no telemetry on /review · A6 simulated excluded from north star · A7 QA flag · A8 own Postgres store.
- **Earlier:** Panel 10 OD-C3 password/access changes apply immediately (server gate — SC-9 ⛔ "Access gate applied immediately"; until it ships, today's next-publish behaviour with the C-3 warning; Panel 23 M3: trial end never changes access on a live site) · Panel 15 Pro template lock keyed on the effective plan (`starter` check replaced).

## SC-23 Owner decisions 2026-10-18 *(R-1018)*
Owner chose "Accept recommendations for unanswered" on the decision sheet (https://claude.ai/artifact/VJc2iexSu7zeSSAfNPs4aA): **all 45 decisions = option A**, then "han laga do" (apply). Full table: `design-audit-2026-10-18/OWNER-DECISIONS-2026-10-18.md`. DS-OD-1…12 (DESIGN_SYSTEM_SPECIFICATION §7) and OD-A1…A10 (FINAL_DESIGN_QA_REPORT §5) are decided as recommended; the DESIGN.md changes they imply (V1, V4, V5, V6, V9) are approved deviations. Where each lands in this file:
- **Safety:** S1 Restore checks the server first (SC-9 ⛔) · S2 three confirm classes (SC-15) · S3 one unsaved-changes dialog (SC-24) · S4 "Before overwrite" save (SC-9 ⛔, SC-15 b) · S5 named-version Undo + 30-day Recently deleted (SC-9 ⛔, SC-15 a) · S6 CMS conflict field diff, Keep mine rebases changed fields only (Panel 07) · S7 Blocking publish check when the Vercel plan can't password-protect (Panels 10, 14) · S8 password field type hidden for new forms, existing ones keep working with an Inspector warning (Panels 06, 10).
- **Scope:** P1 e-commerce deferred — existing product blocks render, text/images editable, "Commerce editing is planned" · P2 Export "Soon" tiles removed · P3 Brand From logo or URL ships, not AI (SC-21, SC-9 ⛔) · P4 component variant authoring deferred · P5 27-component DS catalogue stays in code, no UI · P6 Classes selector deferred to the classes arc · P7 Pro everywhere, Beginner path removed · P8 scheduled-publish stub removed · P9 light chrome only (SC-27) · P10 no per-record CMS history; phrase removed from FD-DYN · P11 multi-reference fields deferred, "contains any of" hidden · P12 removed features stay gone except those the panel docs revived.
- **Canvas:** C1 1440 Desktop frame + Fit, zoom-independent selection chrome, one-click 100% (SC-29) · C2 fixed menu group order + type-context group (SC-3) · C3 multi-select hides resize handles (SC-17) · C4 Tab / Enter / ⇧Enter / Esc (SC-2, SC-12) · C5 marquee Shift+drag anywhere, one depth (SC-17) · C6 image dropped on an image inserts; a centre "Replace image" zone replaces (Panels 05, 08) · C7 instance edits at Tablet/Mobile/hover are overrides (SC-13).
- **Navigation:** N1 "Components ›" in the Add header + Layers instance link, no rail item (Panels 03, 04; 00-STRATEGY §4) · N2 This site vs Component library scopes (SC-11) *(R-1018 noun)* · N3 one SEO score (SEO-tab model) also in Listings (Panel 10) · N4 Issues chip left of Publish only when Blocking/errors exist (Panel 01) · N5 URL keeps area, record, task (SC-26) · N6 one bell grouped This site / Other sites (Panels 01, 22; closes Q1) · N7 templates re-authored on Brand tokens, no purple; interim "Connect to Brand colors" offer (Panel 15) · N8 starters renamed generically, violet recoloured (Panel 09).
- **Visual:** V1 40 px rows for thumbnail resource lists incl. Pages; tool lists 32 · V2 info banners neutral grey + icon · V3 red alignment guides · V4 `shadow-drag` on menus/popovers; anti-slop #10 → "no decorative shadows" · V5 motion 100/160/240 only, no pulse · V6 header ladder · V7 popover widths 240/280/360 · V8 Brand preview fixed 468 · V9 keep ink #111827, reword DESIGN.md NO BLACK — all in SC-27.
- **Research:** R1 user validation before first-run Figma (00-STRATEGY §7).
- **Round 2 (Q1–Q16, same file, owner-approved 2026-10-18)** *(R-1018b)*: Q1 Exit Save and leave · Q2 "Save settings first?" (SC-24) · Q3 Brand guard only while a save is pending or failed (SC-24, Panel 09) · Q4 no Site settings shortcut (SC-12) · Q5 ⌘\ focus mode (SC-12) · Q6 render parity + interim Preview note (SC-8, SC-9) · Q7 Bind to CMS field → Inspector › Content picker (SC-3) · Q8 inherited-lock badge (SC-14) · Q9 Connect restore point (SC-11, Panel 09) · Q10 one bulk bar (SC-32) · Q11 per-form submissions filter (Panel 10) · Q12 Sources ship (historical; superseded by BD-39, Sources hidden this release) · Q13 one icon picker (SC-33) · Q14 auto alt text deferred (SC-21) · Q15 Publish in the tray in place (SC-7) · Q16 saved-template delete class (a) (SC-15).

## SC-24 One unsaved-changes dialog *(R-1018, S3 / CS-02, D2-28)*
Every "leave with unsaved edits" moment (rail, page switch, area change, task close, Exit) uses **one** dialog: title **"Leave without saving?"** · **Keep editing** (default, Esc) · **Discard changes** · **Save and leave** — the third button only where an explicit Save exists (**Site settings, CMS record, Page settings**). Replaces "Stay / Leave anyway / Save & leave" (01), "Keep editing / Leave and lose changes" (02), "Keep editing / Discard / Save and continue" (10) and "Keep / Discard" (12). Autosaved surfaces never show it.
- **Exit with unsaved page edits** *(R-1018, reconciles Panel 01 §7.1)* — **owner-confirmed 2026-10-18 (Q1)** *(R-1018b)*: Exit also offers **Save and leave** when the page has unsaved edits — it is an explicit flush save (⌘S, 3 s limit; failure keeps the user in the editor with the save-failed banner). Offline: no Save and leave. Autosaved owners get the third button only here (page, on Exit) and in the Brand form below (only while a Brand save is pending or failed) *(R-1018b)*.
- **Named variant — "Save settings first?"** *(R-1018, Panel 10 §5)* — **owner-confirmed 2026-10-18 (Q2)** *(R-1018b)*: topbar **Publish** or **Preview** with unsaved Site settings edits is not a leave, so it uses its own title **"Save settings first?"** · **Keep editing** (default, Esc) · **Publish without these changes** · **Save and continue** (buttons exactly as Panel 10 §5). It is the only variant with a different title; the Brand form below keeps the title *(R-1018b)*.
- **Brand** *(R-1018b, owner Q3)*: Brand autosaves (its edits are shared-history document steps), so leaving Brand — rail, Back, area change, Exit — shows **no dialog while its changes are saved**. The dialog appears **only while a Brand save is pending or failed** at the moment of leaving: title "Leave without saving?" · **Keep editing** (default, Esc) · **Save and leave** (flushes or retries the document save, 3 s limit as on Exit; failure keeps the user in Brand with "Couldn't save — Retry") · **Leave and keep retrying** *(DS)* (leaves; the changes stay applied in the document and the bottom-bar status keeps "Couldn't save — Retry" / "Offline — will save when back online", SC-4). No "Discard changes" — Brand steps are undone with ⌘Z. Offline: no Save and leave. Panel 09 §9; Panel 02 rail guard.

### SC-24.1 Navigation transaction and draft ownership — B3.1, 2026-10-19

**DESIGN SPECIFICATION / runtime NOT RUN.** User authorized detailing B3.1 after the continuation plan. This extends the already selected SC-24 actions and IA-07 continuity rule; it does not authorize application edits. Page-specific destinations and PG-G01–12 mapping live in [P11 §7.1–7.4](11-PAGES-AND-BOTTOM-BAR.md#71-b31-page-navigation-and-settings-return-contract).

**One coordinator, owner-specific operations.** Use the existing shared guard concept, extended to retain affected drafts and their exact targets. Do not introduce a Pages-only guard or make every navigation wait for every background save. The first would leave competing policies; the second would interrupt harmless browsing and ordinary canvas autosave. Prompt only when the requested transition loses an affected staged draft, plus SC-24's explicit Brand/Exit exceptions. Opening a temporary manager or picker that retains the task is not leaving it.

Capture the following before offering a consequential action. These are required semantics, not a prescribed TypeScript API:

| Captured value | Contract |
|---|---|
| Intention | Unique attempt identity, site/account identity, exact destination (including page ID), entry point and requested outcome: navigate, close or contextual return. It remains fixed while the guard owns the intention |
| Origin | Area, object ID, owning form/tab/field, invoking focus target, parent overlay stack, local search/filter/scroll and retained draft session. A Page settings target can differ from the active canvas page |
| Affected owners | Stable owner/object/draft IDs, revision being submitted, validation state, actual save/discard capabilities, permission and current operation status. Immediate completed operations are not staged drafts |
| Completion evidence | Owner-confirmed result for the submitted identity/revision. Document application, network queue acceptance, server acknowledgement and publication are distinct; only the required owner's successful acknowledgement completes Save and leave |

An open guard blocks other navigation requests without replacing the pending destination. A rejected command does not open another guard. A different site/account invalidates the intention; it never receives an old save or continuation. Revalidate permissions and object existence immediately before each mutation and before navigation. If a target disappears, retain unresolved work, explain the missing target and offer a deliberate return to a surviving containing list; do not silently choose another page. In-memory retention is not crash/reload recovery.

### SC-24.2 States, partial results and late responses

| State / event | Owner action and feedback | Navigation / recovery |
|---|---|---|
| Inspect request | Check whether the destination actually discards/unmounts an affected task. Resolve active field edits through SC-17; an invalid draft stays with its field, never coerced or silently applied | If no affected draft/exception, continue without a dialog. Otherwise retain the origin and open the shared guard |
| Await decision | Title/actions remain SC-24. Name the draft owner and intended destination, e.g. `Blog record “Studio launch” has unsaved changes. You asked to open About.` | Keep editing, Escape, or guard dismissal cancels only the pending continuation and returns to the source task; no implicit discard |
| Save and leave | Validate the affected owner; show `Saving…` beside its name. Disable repeat Save/Discard and background writes to that submitted draft while the request is in flight. SC-25 progress applies | Stay until confirmed success. Failure, invalid input, conflict or queued/offline work never opens the destination. Retry targets the same owner and revalidates permission/revision |
| Validation fails | Keep values; expose the invalid field and its error in the owning form. Leave the guard's decision surface so the user can correct the field; preserve the requested destination in a local `After saving: Open About` notice | The retained intention continues to block competing navigation even though the guard is closed. In the owning form's footer, temporarily replace the normal footer actions with that notice, **Cancel navigation** and explicit **Save and leave**. Cancel navigation clears the intention and restores the normal footer. A scoped Cmd/Ctrl+S saves without following the pending destination, keeping the correction task open. Explicit Save and leave after correction retries it; field editing or a background save never navigates |
| Keep editing during a save | Cancel the navigation intention; do not claim that an already-sent mutation was cancelled. Display `Saving continues; you will stay here.` until its result | The submitted draft stays protected until settlement; if an owner supports further edits, keep them as a newer revision. A late success can update only its submitted revision/status, never overwrite newer input or reopen the cancelled destination |
| Save failed / conflict | Owner-local `Couldn't save — Retry` with actual reason, or the owner's conflict review. Keep the current input and distinguish confirmed saves from unresolved ones | Retry only after the previous request settles or its result is reconciled. An uncertain result is not proof of failure; do not issue an untracked duplicate. Conflict review returns to this owner; no automatic overwrite |
| Discard changes | Only the named, still-staged owner draft is discarded through its supported handler. A mutation already applied or sent is not undone by discarding a form | Wait for discard completion. Missing/throwing/failed handler leaves navigation blocked and input retained, with Keep editing and owner-specific recovery. Completed discards are reported honestly and are not silently restored |
| Local commit awaiting sync | A document-backed form may have applied its values locally before server confirmation. Identify that stage as pending; do not show `Saved` or continue as though sync succeeded | Retry sync against the committed revision rather than applying the edit twice. Do not offer Discard for those applied values; keep editing or use the owning history/recovery action. Show remaining staged edits separately |
| All owners resolved | Confirm every affected owner is successfully saved, explicitly discarded, or retained by an allowed non-lossy continuation. Recheck the destination/access and that the intention is still active | Continue once, announce the named destination and restore its specified context. Navigation itself adds no document Undo step and does not mark content dirty |

**Multiple owners:** show affected owners in a stable sequence: innermost active form first, then retained parent task, then other affected tasks in their capture order. Show `1 of N` and per-owner `Saved`, `Discarded`, or unresolved status. The current SC-24 buttons act on the **named current owner**, not a silent “discard everything.” On success advance to the next owner; stop at its first failure. Keep editing returns to the unresolved task and cancels the remaining continuation; it does not roll back confirmed saves/discards. Recompute the affected set before leaving; a newly dirty owner must be resolved explicitly. Brand keeps its separate SC-24 action set, including Leave and keep retrying; never reinterpret it as a discardable form.

**Offline and access:** preserve drafts and show the owning connection/access reason. For Page settings and other owners whose save requires a connection, Save and leave is unavailable offline; it cannot report a queued write as completion. CMS's existing queue state remains visible if a record save is already queued, but does not satisfy this guarded leave. Keep editing and supported local draft discard remain available; no unauthorised server mutation is permitted. Brand/Exit omit Save and leave offline as already specified. On lost access, keep a retained draft only as allowed by P22 recovery ownership; reauthentication follows the same-user rule, with no automatic resend after an account change.

### SC-24.3 Guard composition, focus and status

**Designer-selected detail within approved DS:** use the shared Modal/ConfirmDialog family, 480px default/max width, clamped to viewport minus 48px, content-growing up to viewport minus 48px. Existing 480px dialog size is reused; no new token or permanent panel. Header: shared title; body: owner identity, intended action, then state/error. Footer: **Keep editing** as safe primary/default, **Discard changes** as a clearly destructive secondary action, **Save and leave** as a secondary action when eligible. Brand substitutes its established action set. Long identities wrap; never shrink type to fit. Footer actions wrap/stack in reading order when necessary. At short height, use one body scroll with reachable header/footer; if enlarged header/footer would consume the available height, make the whole dialog scroll rather than trapping content under sticky regions. Geometry is specified, not measured.

When the guard replaces an active Page settings decision, retain that form's state but suspend its focus trap/keyboard handlers. Exactly one modal layer handles focus, Escape and Cmd/Ctrl+S. In the guard, Cmd/Ctrl+S cannot bypass the explicit Save-and-leave action or trigger the hidden project save. On Keep editing, restore the owning form and its relevant field; on validation, focus the first invalid field. On success, focus the destination's page heading/canvas region; on contextual close, restore the invoking row/control. Missing control → surviving owner section heading with an explanation. Scrim dismissal behaves as Keep editing, never Discard. Permission/error messages must be visible and programmatically associated, not tooltip-only.

Keep statuses scoped: an unapplied form draft says `Page settings · Unsaved changes`; the bottom `Page · Saved` can describe an earlier confirmed document revision, so qualify its owner when both are visible. After local apply, global pending/failure must reflect that operation; only a server receipt allows Saved. Until the multi-owner receipt registry exists, preserve the documented page-only global fallback and show other owners' status locally; do not fabricate aggregate success. Saved does not mean published. Browser tab close/reload uses the existing browser-unload/recovery contract; this custom dialog cannot promise asynchronous save on unload.

## SC-25 Response-time targets *(R-1018, principle P09 Doherty)*
| From the user's action | The UI must |
|---|---|
| ≤ 100 ms | acknowledge — pressed state, row highlight, or the panel/area starts opening |
| ≤ 400 ms | show the destination's **skeleton** if content is not ready (no blank panel, no spinner-only area) |
| ≥ 1 s | show **progress text** naming the work ("Uploading 2 of 5…", "Publishing…") |
| ≥ 10 s | show "**Taking longer than usual…**" with **Cancel** where the operation can be cancelled; never a false failure on a timer alone |
Applies to area switch, search, insert, panel/task open, save, upload, publish, template apply. Verification: measured in the running app (CLAUDE.md "Measure, don't eyeball").

## SC-26 URL state *(R-1018, N5; closes Q12)*
The editor URL keeps **area**, **record** (CMS record, asset, token or settings screen) and **open task**, e.g. `/edit/{siteId}?area=cms&record={id}&task=review`. Reload and shared links restore them. An invalid target (deleted, no access, other site) falls back per **IA-07**: explain the condition and open the nearest containing list or page — never a silent landing on Editor. URL changes are navigation only: never an undo step, never "unsaved".

## SC-27 Visual layer *(R-1018, V1–V9, P9 / CS-03, CS-05, CS-06, CS-07, CS-19, CS-20, CS-22, D2-29)*
Until root `DESIGN.md` is re-synced, the visual source for every panel is **`design-audit-2026-10-18/DESIGN_SYSTEM_SPECIFICATION.md`** (§2 values, §3 patterns, §4 components); where a panel value differs, DS wins. Token values still change only through Figma → regenerate. Summary:
- **Header ladder:** area 20/30/600 · dialog 16/24/600 · panel/task 14/20/600 · section 12/16/600 **sentence case** (no uppercase headers).
- **Geometry (GEO-01 / DS §2.6):** rail 56 · Add/Layers 284 (260–360) · Inspector 300 (overlay ≤1366: 300 + 12 inset) · task host 360 (320–420) · nav 240 · detail 320 · area header 56 · task header/footer 48 · drawer header 44 · bottom bar / drawer footer 32 · canvas toolbar 44 · dialogs 480/560/640/720/960 · popovers **240/280/360** · toast 460 · Brand preview **fixed 468** (min 360, hidden <1280).
- **Rows:** 28 dense (Layers compact) · 32 tool lists · **40 thumbnail resource lists (Pages included)** · 48 two-line · 56 avatar two-line.
- **Targets:** controls min 32; in-row icon buttons 24 with ≥ 8 px spacing.
- **Motion:** 100 / 160 / 240 ms only; no pulse; every animation names its `prefers-reduced-motion` result (fade → instant, slide → fade 100).
- **Colour:** info banners **neutral grey + icon**; alignment guides **red** (new token `canvas-guide`); accent only for selection-like items (canvas overlays per DS §2.11); ink `#111827` kept; **light chrome only** this version.
- **Elevation & shape:** menus/popovers `shadow-drag`; focus = accent border + soft 2 px ring (founder 2026-07-29); radius per G13 (panel chrome ≤ 4, form atoms/overlays 8, modals 12).
- **Icons:** Lucide only — no emoji in UI or spec sketches.

## SC-28 Standard sentences *(R-1018, DS §3 / CS-10, CS-11, CS-13, CS-15, D2-10, D3-16)*
| Situation | Copy |
|---|---|
| Role refusal | "**{Action} needs {Role} access**" (+ Request access where it exists) — e.g. "Editing needs Editor access" |
| Offline control | disabled with "**Needs a connection**"; one polite announcement, owned by Panel 22 |
| Offline save | "Offline — will save when back online" (SC-4) |
| Load error | server: "**Couldn't load {thing} — Retry**"; network: "**You're offline**" — never blame the connection for a server error |
| Not built yet | "**Planned**" only (never "Coming soon" / "Soon") |
| Delete toast | "**{Name} deleted · Undo · Recently deleted ›**" (≥ 8 s; last part only where the object has a list) |
| No results | "No {items} match "{query}"" + Clear search |
| Empty | title + one sentence + one action (DS §3) |

## SC-29 Canvas frame and zoom *(R-1018, C1 / T2-30)*
Desktop stays a **1440 frame** with **Fit** (≈52 % on 1280–1440 screens). **Selection chrome is zoom-independent**: handles (8 px, 12 px hit area), labels, W×H pill and marquee keep their screen size at any zoom. **One click to 100 %** from the canvas toolbar zoom control (⇧0 still works). The frame never follows the column width — that would change the authored layout.

## SC-30 Notices near the topbar *(R-1018, CS-08)*
Any notice under or beside the topbar (trial, review, collaboration, recovery, offline, Getting-started) goes through the **Panel 22 global banner slot** with a priority entry. No panel places its own pill, strip or notice there.

## SC-31 One toast pipeline *(R-1018, CS-09)*
All toasts go through **Panel 22's stack**: ≤ 1 transient + ≤ 2 persistent, bottom-right, 460 max, no own live region; recovery toasts ≥ 8 s (SC-10). The first-run achievement toast is a persistent-class toast in this stack (not bottom-left, no own `role=status`).

## SC-32 One bulk-selection bar *(R-1018b, owner Q10)*
Every list that supports multi-select — **Pages manager (Panel 11), CMS records (Panel 07), Assets (Panel 08), every Recently deleted list (Panel 24), Components if bulk exists (Panel 13)** — uses **one** bar in place of the list header while ≥ 1 item is selected: **"{N} selected · {actions} · Clear"**. Height 32 (DS §2.6 bottom-bar/footer row); actions are the list's own existing bulk actions, in SC-3 group order with Delete last; Clear (and Esc, SC-2 step 3) empties the selection. Disabled actions show their reason (SC-28). No list invents its own bar.

**Compact composition, 2026-10-19 (DS; design execution, review pending):** at the approved 284px Pages width, retain the same bar and actions but reflow it into two 32px rows: selection count + Clear, then Duplicate / Move to… / Delete. Total height64px; keep it pinned below search/views and subtract64px from the scrolling body. The creation footer remains84px. Wider list headers retain one32px row. This responsive composition supersedes the single-row height only when its labelled controls cannot fit; it does not change selection, ownership or action order. Do not shrink type, clip labels or remove actions to force a fit. Recovery lists use the same responsive rule with their own actions.

## SC-33 One icon picker, two doors *(R-1018b, owner Q13)*
There is **one** icon picker. **Assets › Icons** is where icons are managed (browse, search, the site's set); the **Inspector** (icon element, button icon) opens **the same picker** as a popover (360, DS §2.6) with the same search, categories and selection model. Any second picker implementation is retired; Panel 08 and Panel 06 point here.

## Not covered in this pass
- ~~Templates workspace interior~~ — now **Panel 15** (2026-10-17).
- Dashboard surfaces; members/visitor login (D7 deferred).
