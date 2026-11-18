# L3 live results: Components + Brand (code map 03)

- **App:** http://localhost:3300 (main @ df60cf9ec), 1440×900, owner qa@buildrik.local
- **Sites:** S1 = audit1014-L3 `cmv7v81l0000mi7db7l16u59y` (assigned). S2 = audit1014-L3-S2 `cmv7xyj12009zi7dbaa86j098`, a throwaway duplicate of S1 made through `sites.duplicate`.
- **Evidence:** `scratchpad/audit/live/L3/`. Each phase script (`phaseA..Q.mjs`, `brand0..5.mjs`, `lc18.mjs`) writes a JSON file with the same letter (`D.json`, `E.json`, …) plus PNG screenshots.
- **Method:** the composer is reached through React fiber props and used only for reads and for setup (`window.__c`). Every action under test went through the UI unless a row below says otherwise.

## Summary

| Verdict | Count | IDs |
|---|---|---|
| CONFIRMED | 14 | LC-1, LC-2, LC-3, LC-5, LC-6, LC-7, LC-8, LC-9, LC-10, LC-13, LC-15, LC-17, LC-18, C-10 |
| PARTIAL | 3 | LC-4, LC-14, LC-16 |
| NOT REPRODUCED (premise not reachable) | 2 | LC-11, LC-12 |
| BLOCKED | 0 | |

There are also **9 new findings** (§ New findings). The most serious is NF-1: undeletable orphan instances in any duplicated site.

## Check table

| ID | Claim | Steps actually run | Measured | Verdict | Evidence |
|---|---|---|---|---|---|
| LC-1 (C-1) | An instance root cannot be deleted, cut or deleted from the menu | Selected instance root `el-mv7x3jbg…`. The selection was verified as that id. Pressed Delete, then Backspace, then ⌘X, then right-click › Delete. | The element remained after all 4 doors. Each door raised the toast "Part of a component — detach the instance to change it". | CONFIRMED | C.json, C1-instance-root-selected.png |
| LC-2 (C-4) | Counts stay stale after the containing element is deleted | Moved 2 instances of audit1014-Card into a wrapper (setup through the API), then deleted the wrapper with the Delete key. | List: "2 on this site" before and after the delete. Detail: "2 linked instances…", USED ON 0, and Detach all still enabled. The map holds 2 instances with `inDom:false`. After reload: "0 on this site". | CONFIRMED | K.json, J5-lc2-after-delete.png |
| LC-3 (C-2) | Mobile and :hover overrides on an instance are lost on master update, and the toast says nothing | Instance B heading: Font size 30 on Desktop. Mobile breakpoint (`viewport.setDevice`, the same call the UI makes): Font size 14. State chip :hover: Font size 40. The instance `overrides` held only the desktop op (`#/children[0]/style/font-size`). Then Update from selection on instance A. | Toast: "audit1014-Card2 updated · 2 linked instances updated · Undo", with no lost count. After the update: desktop 30px (kept). Mobile 14px → **30px** (`breakpointStyles` null). The new heading id has **0** hover rules. Every instance and child id changed. | CONFIRMED | E.json, F.json, G.json, E2/E3/F1 png |
| LC-4 (C-3) | Reset to master leaves the selection on a deleted element | Gave instance B a bg override, then ⋯ › Reset to master › Reset. | The instance root id changed (`el-mv7xg4ri…` gone, new `el-mv7xkf5w…`). The selection moved to the **parent section**, so it was not left dangling. No toast. | PARTIAL: ids change and there is no feedback, but the selection is not orphaned | G.json, G2-after-reset.png |
| LC-5 (C-5) | A ⌘D copy of an instance is not an instance until reload | ⌘D on instance B. Selected the copy and set its bg to #fecaca. Waited for save, then reloaded. | Before reload: `isInstance` false, no Component row, but `data.componentInstance` was copied (pointing at the original's id); the panel said "2 on this site". After reload: it is an instance with a Component row, overrides `[]`. **The bg edit made before reload was never recorded as an override**, so the next master sync will wipe it. | CONFIRMED | H.json, H1/H4 png |
| LC-6 (C-6B) | Creating a component from an existing instance misreports | Instance of audit1014-Card › Structure › Save as component › "audit1014-LC6". | Toast: "audit1014-LC6 created as a component". The element is still an instance of audit1014-Card (Component row unchanged). LC6 has "0 linked instances". LC6's masterTree root carries audit1014-Card's `componentInstance` marker. | CONFIRMED | I.json, I4-lc6.png |
| LC-7 (C-12) | A library rename is reverted by the editor | Dashboard /dashboard/agency/library › Rename audit1014-Card2 → "-renamed". Both DB rows were renamed. Reloaded the S2 editor in the same browser context and ran an upsert (Update from selection). | The editor still showed "audit1014-Card2". After the upsert the S2 DB row was back to **"audit1014-Card2"** while the S1 row kept "-renamed". | CONFIRMED | N.json, N3-dashboard-library.png |
| LC-8 | A linked master does not propagate | Changed bg on the S1 instance and ran Update from selection (S1 master → v5). Opened S2. | S2 master stayed at v4. All 3 S2 instances kept bg rgb(253,230,138); S1 showed rgb(167,243,208). The S2 list still reads "3 on this site · linked". | CONFIRMED | N.json, N2-S2-linked.png |
| LC-9 (C-8) | The IndexedDB row moves between projects | S2: Add › SAVED COMPONENTS › library row audit1014-Card2, then insert. Read IndexedDB. In the same context, opened S1 with `siteComponents.(list\|get\|library)` aborted. Not run with the network offline. | IndexedDB row `projectId` = S2. In S1: 0 components loaded, the instance `isInstance` true but **no Component row**. After a normal reload the row's projectId goes back to S1. | CONFIRMED (hydration-failure variant) | M3.json, M4-S1-no-hydrate.png |
| LC-10 (C-16) | The rename dialog accepts a dot | Brand › Colours › custom-color-secondary › ⋯ › Rename › `brand.test`. | No inline error and Confirm enabled. The dialog closed with the toast `Renaming "Secondary" wasn't applied — nothing was changed.` (no reason given). The id was unchanged. | CONFIRMED | brand5.json, LC10-*.png |
| LC-11 (C-17) | The token picker does not mark a `--bd-*` radius | Selected container "Grid Item 1" and inspected the Radius row and every `button[aria-label*=token]`. | The Radius row has only px/%/em/rem and "More settings", with **no token link at all**. No "Link … to spacing token" button was rendered either. The picker scenario cannot be reached. | NOT REPRODUCED (premise not reachable). A related gap: radius cannot be bound to a token from the Inspector. | brand5.json, LC11-radius-row.png |
| LC-12 (C-18) | Unlinking during the dark preview writes the dark hex | Brand › Colour mode › Auto › Preview in dark › Confirm, then Dark preview (`html[data-theme=dark]`, primary #60A5FA), then Back to canvas. | Leaving Brand resets to `data-theme=light`, so an unlink on the canvas cannot happen under the dark preview. The primary-bound container also shows **no background Unlink** (only "Unlink Colour token"). | NOT REPRODUCED (preview cleared on exit) | brand4.json, DM2/LC12 png |
| LC-13 | Variants cannot be authored | Inspector Variant select; button/menu text searched for "variant" in the Inspector and the master detail. | Options: `["Default"]`. No variant authoring control. | CONFIRMED | I.json |
| LC-14 (S-1) | An open tab's Overwrite reverts a theme push | Opened S2 (primary #1A56DB). Ran `theme.capture`(S1) then `theme.push`([S2]): "pushed", 132 tokens, `dsSchemaVersion` 3→4, snapshot "theme-push". In the stale tab: an edit, then the conflict modal › Overwrite… › Yes, overwrite. Reloaded. | Tokens **not** reverted: DB still has 132 tokens and after reload primary = #B91C1C (the pushed value). **`dsSchemaVersion` fell back 4 → 3** after the Overwrite. Brand text has no mention of a workspace or push origin. | PARTIAL: no token revert, but the S-2 counter regression and the missing source indication are confirmed | P.json, P4-conflict.png |
| LC-15 (S-3) | Restore points evict the push snapshot | After the push, `theme.snapshots`(S2) returned 1 row. Ran `theme.createBrandRestorePoint` ×10 **through tRPC, not the Generate-scale UI**. | The DB holds 10 "generator" rows and the theme-push row is gone. `theme.snapshots` → `[]`. `theme.rollback` → 400 "No theme snapshot to roll back to". | CONFIRMED | P.json |
| LC-16 (C-21) | A template drops instance markers | ⌘K › "Save page as template" › audit1014-tpl › Save (the page had a Card2 instance). | Toast "Template saved". The DB `userTemplate.html` contains the card content and **no** `componentInstance` marker. It does contain `{{token.spacing.space-4}}`, `{{token.radius.radius-md}}` and similar placeholders. Apply on another page was **not** run. | PARTIAL (save side confirmed) | Q.json, orphdb output in transcript |
| LC-17 (C-15) | A failed delete resurrects the master | Aborted `siteComponents.delete`, deleted the LC6 master (confirm), then reloaded without the block. | Toasts: "audit1014-LC6 deleted · Undo" and "A component didn't sync to the cloud · It's saved on this device…". After reload LC6 is back in the list. Only 1 delete POST was sent (the blocked one) and **none was replayed**. | CONFIRMED | L.json, L1-delete-blocked.png |
| LC-18 (C-13) | Library reads ignore site grants | Created a temporary user, an EDITOR member, and a SitePermission on S2 only. Logged in and called tRPC. User removed afterwards. | `siteComponents.list`(S1) → 403. `library`(S2) lists S1-only masters (audit1014-Card, LC6) and another site's "Audit As-Is heading 1010". `libraryGet`(S2, LC6) returns the **full payload**. `theme.targets` lists every workspace site. | CONFIRMED | LC18.json |
| C-10 | Toast Undo after an update does not restore dropped overrides | New Card2 instance with an override on `children[1]` font-size 22px. Update from selection from an unrelated H2. Clicked Undo in the toast. | Toast: "…1 override couldn't be re-applied and was lost. · Undo". After Undo the master is back to a container, but the instance has overrides `[]` and the paragraph is 16px (the override is gone). | CONFIRMED | J.json, J3-update-toast.png |

## Journey 1: Components

| Step | Observed | Issue |
|---|---|---|
| Create from selection | Right-click on the card › Structure › Save as component…. The modal names the target: "Selected: Home › Container…". Toast "audit1014-Card2 created as a component". The source became an instance. A right-click retargets the selection to the clicked element (verified). | "Save as component" sits two levels deep, under Structure ›. My first attempt made a master from an H3 (harness click issue, not a product fault). |
| Place 2 instances | Components (⇧A) › row › Insert from saved components. Toast "Component added to canvas". The detail says "2 linked instances … Updating this master affects those instances". USED ON Home · 2. | none |
| Override (desktop / mobile / hover) | Desktop: recorded, with a "Overrides master" dot. Mobile: a "Overridden on Mobile" dot plus a "Mobile · Revert" line, **not** recorded as an instance override. Hover: "1 :hover override · Reset", also **not** recorded. | LC-3 |
| Multi-instance warning | Update confirm: "2 instance(s) will change to match. Any edits made on an instance are kept where they still fit…". | The copy promises edits are kept, but mobile and hover edits are silently lost (LC-3). |
| Edit master | "Edit master" opens the detail screen with "‹ Back to instance". Editing still only happens through "Update from selection…". | No in-place editing (as mapped). |
| Reset override (dot) | Override dot › Reset to master: font-size 30 → 18.72px, overrides `[]`. | none |
| Reset instance | Confirm, then the instance is re-cloned with new ids. Selection goes to the parent. No toast. | LC-4 |
| Duplicate | Not an instance until reload, and edits made in between are lost to the next sync. | LC-5 |
| Detach | Confirm copy is clear. Toast "audit1014-Card2 instance detached". ⌘Z re-links and ⌘⇧Z detaches again. After reload it stays detached. The `componentInstance` data marker stays on the element (harmless today). | none |
| Delete | An instance root is refused (LC-1). A detached element deletes, with toast "Container deleted · Undo". Deleting a master: the confirm names the instance count; toast with Undo. | LC-1 |
| Reload persistence | Instances, overrides, `breakpointStyles` and hover rules persist. Components arrive asynchronously, about 2.5–5 s after the editor shows. | NF-3 (orphan CSS rules persist) |

## Journey 2: Brand

| Step | Observed | Issue |
|---|---|---|
| Colour token | color-primary light #1A56DB → #B91C1C through Change › hex › Save. Only `el-msne1y9i…` (bg `var(--…color-primary)`) changed. Two default Buttons (bg rgb(26,86,219)) and a Link (literal `color: rgb(26,86,219)`) **stayed blue**. "Used by 1 element" is accurate for the token, but the page still has unbound brand blue. No toast. "Review changes · 1". | NF-5 |
| Type token | font-size-base 16px → 20px. The detail said "**Used by 0 elements**", yet the root, all P, DIV and INPUT elements went 16→20px and H2 24→30px (more than 20 elements). | NF-4 |
| Undo | With focus out of the input, ⌘Z reverted the token (20→16). With focus still in the Value input, ⌘Z did a text undo and ⌘⇧Z then committed a new edit. | NF-6 |
| Restore point | Turning Dark mode Auto showed the generated-dark list, then Preview in dark, then Confirm. A `theme.createBrandRestorePoint` 200 followed and a "Dark mode Auto" restore row appeared. Restore applies **with one click and no confirm**; toast "Brand restored · Undo ⌘Z". (My ⌘Z earlier in the same run had already undone "Turn on dark mode", so the restore's own effect is not isolated.) | Low: no confirm on restore |
| Reload | After reload: primary #B91C1C persisted, the type revert to 16px persisted, darkMode "off". | none |
| Usage counts | Usage only counts direct `var()` bindings. Inherited impact is invisible (NF-4), and "color-text Used by 0" while the page root shows a Text colour "Text" token chip. | NF-4 |

## New findings

1. **NF-1 (High): orphan instances in duplicated sites cannot be deleted or detached.** `sites.duplicate` does not copy `SiteComponent` rows. In S1 (a duplicate of the fixture), 5 "Click Me" buttons are registered instances of `comp-1787638739693-iek16kndw` ("U4 Override Probe", whose only row is on the fixture site). Delete answers "Part of a component — detach the instance to change it", but the Inspector has **no Component section**, so there is no way to detach them. S2 showed the same thing for Card2 until I adopted it from the library. Evidence: orph.mjs output, Q2-orphan.png, M.json M1.
2. **NF-2 (Medium): a Update/Reset leaves orphaned :hover CSS rules in the saved project.** After the update, the 2 `:hover` rules for the old id `el-mv7x9ltn-1epqtpq1j9x` were still present after reload, and the new id had 0 (G.json `hoverRulesOldId: 2`).
3. **NF-3 (Medium): a duplicated instance's pre-reload edits are never overrides** (part of LC-5). The bg #fecaca stayed after reload but with overrides `[]`, so the next sync will drop it silently.
4. **NF-4 (Medium): type-token usage reports "Used by 0" while the change restyles the whole page** through inheritance.
5. **NF-5 (Medium): default Button and Link colours are literal #1A56DB, not `color-primary`.** Changing the primary leaves them blue, which contradicts the banner "every change you make applies to the site straight away".
6. **NF-6 (Low): ⌘Z or ⌘⇧Z while the Brand Value input still has focus** acts on the input text, and blur then commits it as a new token edit (two session edits recorded).
7. **NF-7 (Low): misleading copy after a failed delete.** The toast "A component didn't sync … It's saved on this device" appears after a failed DELETE.
8. **NF-8 (Medium): `dsSchemaVersion` regresses 4→3 when a stale tab overwrites after a theme push** (LC-14). This is the S-2 counter collision, observed live.
9. **NF-9 (Info): a component created from a heading shows "STRUCTURE 0"** (B.json). This is correct for a leaf, but the label reads like an empty master.

## State coverage seen

| Area | States seen |
|---|---|
| Components panel and detail | Empty "0 on this site", "New" badge, YOUR COMPONENTS, LINKED FROM LIBRARY · linked, master detail, "Back to instance" |
| Confirms | Update, Reset, Detach, Delete (with instance count) |
| Toasts | Create, Insert, Update with and without lost count, Undo, detach, refused-delete, sync failure (Retry now) |
| Editor shell | Conflict modal and the Overwrite… / Yes, overwrite confirm |
| Brand | Colours table, token detail, picker, Value editor, Review changes list and empty state, Restore points empty and with one row, Dark mode off / proposal / preview / auto, rename error toast, Presets list |
| Dashboard | Library list with Rename |

**Not seen:** the "Couldn't load your shared components" toast (hydration aborted twice, nothing visible at about 17 s; it may have auto-dismissed before my read), the Brand read-only banner, and the theme lock display.

## Not verified

- **LC-16 apply side.** I did not apply the template to another page (Templates panel apply flow), so I did not check for silent detach or unresolved `{{token` placeholders on apply.
- **LC-9 with the network truly offline.** I used aborted hydration requests instead.
- **LC-15 through the UI.** The restore points came from tRPC calls, not 10 Generate-scale applies.
- **Brand lock / `themeLocked` display** and the editor's read-only banner were not exercised.
- **Style presets apply.** The Presets list shows 11 categories and no Apply/Use control. Inspector text for a button has no preset mention. I could not drill into a preset detail because the row click did not land.
- **C-11.** Detach all / Delete master during read-only was not tested.
- **C-7.** "Convert matching groups" adopting nested instances was not tested.
- **C-14.** Duplicate master dropping variants or pageId was not tested.
- **⌘Z after Update from selection** (pages vs master) was not isolated.
- **1280×720.** Not checked; everything was run at 1440×900.
- **The restore's own effect** was not isolated from my earlier ⌘Z (see Journey 2).

## Side effects left behind

- **S1:** masters audit1014-Card, audit1014-Card2 (v5) and audit1014-LC6; colour primary #B91C1C; dark mode off; test card elements in the "Our menu" section.
- **S2 (throwaway):** pushed theme tokens, 10 generator restore points, and Card2 linked from the library.
- **Workspace:** the user template "audit1014-tpl".
- **Restored:** the workspace `sharedTheme`, captured during LC-14, was reset to null afterwards. The temporary scoped user `audit1014-l3-scoped@buildrik.local` and its membership were deleted.
