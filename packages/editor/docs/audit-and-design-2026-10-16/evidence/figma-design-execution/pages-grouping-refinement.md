# Pages grouping and control clarity — BD-27

Date: 2026-10-18. Authorized scope: fix the identified Pages grouping/placement issues in Figma. Normal width284px, rail56px, Inspector300px and expanded Listings720px remain. No application code or production data changed.

## Before and selected solution

The BD-25 panel fit its bounds, but view selectors looked like unrelated controls, Contact status squeezed identity, collection actions appeared detached, folder privacy was a heavy heading, New folder was an unexplained ellipsis, and the unsaved-dot legend resembled live feedback. Geometry alone did not establish clarity.

Inspected the current Figma hierarchy, existing PageResourceRow62:1576 properties and all Pages consumer states. Source PageList.tsx:360–366 and PageRow.tsx:363 establish that the disputed line explains page indicators; it is not a second persistence service. P11 requires retaining the indicator explanation.

Chosen: regroup existing controls within284px using existing tokens and reusable instances. Retaining the previous arrangement would preserve the known confusion; widening the panel would undo BD-25 without resolving scope/hierarchy. No capabilities were removed.

## Final anatomy and contracts

- Header56px: title/count, named More page actions icon, Close.
- Pinned navigation92px: Search, then one consistent three-option Pages/Listings/Structure selector. Same-size controls, selected surface, subdued unselected labels. More actions are separate from view selection.
- One scrolling body: page list; private folders; collection pages. Default desktop body577px, short277px, narrow445px. Search/views remain reachable while the list scrolls.
- Ordinary rows stay40px. Descriptive status rows use compatible PageResourceRow / Stacked status80:14400 at56px, preserving Name/URL/Status properties, icon and32px page-actions target. Hidden from publish sits beneath name/path, retaining full identity width. Recovery retains its80px metadata exception.
- Folder section: My folders heading and secondary Only visible to you guidance. Existing folder/page hierarchy and privacy meaning retained.
- Collection card: Blog post name/URL/count and its Open page / Manage in CMS actions share one group. Open page means the collection template in this explicit context; the label does not grant access or create a new destination.
- Creation footer84px: primary Add page across the panel, then From template and explicitly labelled New folder. During inline rename Add page becomes secondary so Update URL is the task primary. Existing eligibility and guard contracts remain; no new disabling behavior.
- Recovery is its own subview and retains a48px explanatory footer rather than unrelated creation actions.
- Page indicator legend reads “● marks a page with unsaved changes” inside the page-list group. It describes a per-page marker; live save state remains in the bottom bar. A saved page is not marked dirty merely because the legend is visible.
- Visible proportional scrollbar specimens mark overflowing bodies (rename, restored receipt, short and narrow). Production must use a real scrollbar/keyboard scroll behavior; these Figma shapes are visual affordance evidence only.

All grouping uses native auto layout; existing actions and their available prototype reactions are retained. Stable node IDs cover page management, branch return and rename controls. The page-row descriptive-status extension is narrowly scoped; ordinary/listing/recovery rows are not silently converted. New-folder instance changes to the existing labelled Button component without changing its action identity.

## Evidence and validation limits

Changed14 existing manager screens (13 normal and one expanded Listings) and the two existing compact viewport specimens. Main63:6393, rename63:14567, Structure63:21939, no-results63:22616, More65:17148; short78:19785; narrow78:20392. Independent review covers grouping/hierarchy, label/status clarity, geometry and interaction/accessibility limits separately.

Native render screenshots: [main](pages-grouping-main.png), [rename](pages-grouping-rename.png), [short](pages-grouping-short.png), [narrow](pages-grouping-narrow.png). Before: pages-compact-main.png. During authoring the screenshot endpoint showed stale offsets for reparented groups; final evidence uses use_figma node.screenshot and native transform checks. An unresolved-color fallback on the selected view was fixed while preserving token bindings.

Review fixes: consistent Hidden from publish in the More scene; secondary Add page during rename; visible scroll cues. Normal, rename, Structure, empty, short and narrow views were visually inspected. Mutation records: pages-grouping-ledger.json. Authoring: pages-grouping-refinement.js.

Status: PARTIALLY VERIFIED. The listed visual grouping defects have been addressed in the inspected design; user acceptance remains pending. Full prototype traversal, scrolling/keyboard playback, assistive technology, tooltip/long-content stress cases and application save/Undo/persistence tests NOT RUN. Existing unwired Add/Template/New folder/Open page destinations are still incomplete B3 coverage, not tested working interactions. Current work does not declare the entire Pages module or B3 complete.

Independent report: [Pages grouping review](pages-grouping-review.md).

## BD-27 follow-up — lighter actions and explicit settings navigation

2026-10-19. User accepted the improved grouping and requested lighter actions and a meaningful navigation entry for the SEO destination. Existing source confirms PageContextMenu → onSettings → PageSettingsDrawer, whose default tab is SEO and whose other tabs are Social and Advanced. The correct scope label is **Page settings ›**. Header/global and page-row ellipses still open actual action menus; they are not renamed into SEO shortcuts.

Applied to 13 manager scenes containing creation controls and both viewport specimens; recovery scene inspected and unchanged. Existing Button instances use a compact112×32 Secondary `+ Add page`, transparent Ghost text commands for From template/New folder, and accent text navigation for Open page/Manage in CMS. The full-width blue creation stripe is superseded. Existing84px footer,284px panel,720px Listings,32px targets and component identities remain. Menu item63:14553 now reads Page settings › and retains its navigation to63:15939 (SEO default). No shared masters, data bindings or application code changed.

Preservation: all69 styled Button instances retained their existing reaction arrays; the settings menu item's destination remains unchanged. Existing unwired controls remain explicitly unwired. Text-link appearance does not mandate HTML anchors for in-editor commands: use a real link only for a routable destination, otherwise a keyboard-operable button. Preserve existing accessible names; hover emphasis and a visible focus ring remain implementation requirements. Enter activates navigation; command buttons also accept Space; dismissing settings restores the invoking page context and focus under the existing contract.

Evidence: [menu/full editor](pages-actions-menu.png), [rename](pages-actions-rename.png), [short viewport](pages-actions-short.png), [mutation ledger](pages-actions-ledger.json). Compared with pages-grouping-main.png: lower action weight, collection links remain adjacent to their owner, Update URL retains rename priority, pinned footer remains visible at600px height. Native screenshot inspection passed for these bounded visual cases. Prototype click/keyboard playback, assistive technology and runtime persistence are NOT RUN. Status remains PARTIALLY VERIFIED; no whole-module completion claim.

Independent read-only design_guard_reviewer check: no blockers in this bounded follow-up. Sampled32px targets/footer fit, rename action priority, contextual collection links and settings destination/tab scope passed the visual/structural review. Interaction/accessibility is route-structure evidence only; unwired controls, keyboard/focus and runtime remain untested. Follow-up user acceptance is not inferred. Parent ledger checks confirmed69 unchanged reaction arrays and15 compact Add controls. Authoring source: pages-actions-refinement.js.
