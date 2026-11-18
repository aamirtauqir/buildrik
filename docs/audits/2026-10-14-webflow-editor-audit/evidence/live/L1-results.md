# L1 live results: Shell, Canvas, Selection, Workflow plumbing (code map 01)

- **App:** http://localhost:3300 (main @ df60cf9ec, clean worktree; this is HEAD **without** the uncommitted canvas-menu diff)
- **Site:** audit1014-L1 = `cmv7v814l0008i7dbwzaqpcxv` (owner qa@buildrik.local). Nothing was published.
- **Extra test data:** a local user `audit1014-l1@buildrik.local` (`cmv7zf2t20000f2rji3vhpsrl`), its workspace "audit1014 L1 WS" and the site "audit1014 fresh" (`cmv7zfb5100hji7dbvk4ku7nj`). I created these because qa's onboarding is complete on the server (clearing localStorage restores it), so checks #2 and #4 could not run as qa.
- **Evidence:** `scratchpad/audit/live/L1/` (`*.json` holds the measurements, `*.png` the screenshots). Scripts are in `L1/scripts/`.
- **Method:** Playwright with the rig. The composer was reached through the React fiber on `.buildrick-canvas` and exposed as `window.__C`. Viewport 1440×900 unless stated.

## Summary counts

§10 checks (24): **CONFIRMED 17** · **PARTIAL 6** · **NOT REPRODUCED 1**. #11 was confirmed at HEAD; its working-tree variant is BLOCKED.

| | CONFIRMED | PARTIAL | NOT REPRODUCED | BLOCKED |
|---|---|---|---|---|
| §10 #1–24 | 4,5,6,7,8,10,11(HEAD),13,14,15,16,17,18,21,22,23,24 | 2,3,9,12,19,20 | 1 | 11 (working tree only) |
| §9 without a §10 step | D-11 (paste-into + arrange) | — | — | D-11 drop, D-13, D-14, D-17, D-20; not verified: D-23, D-24 |

## Check table

| # | ID | Claim | Steps actually run | Measured | Verdict | Evidence |
|---|---|---|---|---|---|---|
| 1 | UX-01 | Empty-page CTA clips at 1280×720 | 1280×720 → Pages → Add page → Blank → "audit1014 empty" → Create. Measured `.bd-canvas-empty-cta` children against the container and `.bd-canvas-scroll` | Container and scroll area 116–651. Title "This page is empty" top 252; "Start blank" bottom 515 | **NOT REPRODUCED** | c1c-1280x720.json, c1c-empty-1280x720.png |
| 2 | UX-04 | Creating a 2nd page stacks ≥2 blocking modals | Fresh user and site. Pages → Add page → Blank → Create. Polled dialogs every 100 ms | 1 modal (`achievement-card` "Add your first page", aria-modal=true), shown together with the "Page created · 'About' is ready." toast and the empty-page CTA. Never 2 modals. On qa's site (it has a nav) the create toast is **"Link duplicated · Undo"**, not "Page created" | **PARTIAL** | c2c4.json, ux04-after-create.png, c1c-1280x720.json |
| 3 | UX-07 | Toolbar and label overlap the element | Selected the button "Click Me" (66×24), the 984×256 section, and the first heading near the frame top. Read rects of `canvas-selection-tag`, `selection-toolbar` and `-caption` | Button: tag (482,438–528,458) **intersects** the toolbar (462,426–550,458). Section: pill **inside** the element; caption "⧉ Duplicate ⌘D · 🗑 Delete ⌫ · ⋯ More" drawn over the element. Heading at frame top+44: no overlap, because there was room above; the true no-room case was not reached | **PARTIAL** | c3.json, c3b.json, c3-*.png |
| 4 | UX-13 | Achievement card sits above the Preview overlay | Fresh user → topbar Preview | `achievement-card` z-index 10001 vs `preview-overlay` 50. `elementFromPoint` at the card centre is the card | **CONFIRMED** | c2c4.json, ux13-preview.png |
| 5 | IA-12 / D-19 | Below 1366 the inspector track stays and the inspector also floats absolute | Measured the shell grid and the inspector at 1280×800, 1366×800 and 1440×900 | 1280: cols `340px 0px 640px 300px`, inspector `position:absolute; top:56px`, rect y=112. 1366: same (`…726px 300px`, absolute). 1440: static | **CONFIRMED** | c5.json, c5-*.png |
| 6 | CAN-01 / D-01 | Resize ignores zoom; click-release at 50% halves the size | Selected h3 "Margherita". At 100%: press/release on the E handle, then +20 px. Footer zoom → 50%: press/release, then +20 px | 50% no-move: model 296×28 → **143px × 18px**. 50% +20 px: → **92px × 10px** (screen 72 + 20). At 100% a no-move click also writes fixed `293px × 28px` (both axes, auto → px) | **CONFIRMED** | resize.json, resize-50*.png |
| 7 | CAN-02 | Keyboard resize stores NaNpx | Focused "Resize from right edge", pressed Enter, moved 5 and 10 px, clicked | Model `width: "NaNpx"`; console `` `NaN` is an invalid value for the `width` css style property ``. **Persisted**: after reload the model still reads NaNpx | **CONFIRMED** | resize.json, j2.json (reload) |
| 8 | CAN-03 / D-09 | Escape-cancelling a resize undoes the previous edit | Left-column p: Inspector Align Right, waited 2.6 s, E-handle drag −48 px, Escape, mouseup, reload | During drag DOM width 250. After Escape `text-align` right → start, history 2 → 1, toast "Undo: Changed style · Redo", 1 saveProject 200. **After reload: start** (the edit is lost). The first attempt (right-column element) was a harness null: its handle sat at the clipped viewport edge (see N2). The D-09 unmount variant was not run | **CONFIRMED** (cancel path) | c8b.json, c8b-during.png |
| 9 | D-06 / D-07 | Keys leak through full-page tools | (a) Inline-edited the h2, ⌘, opened Settings, focused nav "Overview", ⌘Z. (b) Selected a heading, opened Brand, focused "Colours", pressed Backspace / Delete / ⌘D / ⌘G. (c) Pressed L in Brand | (a) The text edit was undone while Settings stayed open (canUndo true → false) and **a sites.saveProject was sent**. (b) Opening Brand (and Settings) **clears the selection**, so Backspace, Delete and ⌘D did nothing. ⌘G still ran the engine command behind Brand (canvas toast "Select two or more elements to group"). (c) L left Brand and opened Layers | **PARTIAL** (a and c confirmed; b not reproduced) | c9b.json, c9.json, c9b-settings-undo.png, c9c-brand-L.png |
| 10 | PAGE-01 / D-08 | ⌘D on a focused page row duplicates the canvas element | Selected a canvas h2, focused the "Page 3" row with `focus()` (no page switch), pressed ⌘D. Also tried clicking the "About" row first | Focused row: pages 5 → 5, headings 22 → 23, toast "Heading duplicated · Undo". Clicking a row switches page and clears the selection, so ⌘D then does nothing (and the page is not duplicated either) | **CONFIRMED** | c10.json |
| 11 | IA-01 / D-18 | Canvas submenus can't be used by keyboard at HEAD | Right-clicked the h2, ArrowDown ×4 to "Style", ArrowRight, ArrowDown. Clicked the "Style" parent | Submenu rect **(0,0)–(200,74)**. ↓ closed the submenu and moved to "Structure". Clicking the parent opened no submenu. The working-tree variant could not run: the live server uses a clean df60cf9ec worktree without that diff | **CONFIRMED** at HEAD / **BLOCKED** for the working tree | menus.json, ia01-submenu.png |
| 12 | IA-15 | Menus are not clamped to the viewport | 1280×720: right-click near the bottom-right of the canvas; right-click the last Layers row | Canvas menu 926,621 → bottom **914 > 720**. Layers menu opened upward at 400–663 (clamped) | **PARTIAL** (canvas yes, Layers no) | c12.json, c12-*.png |
| 13 | MENU-01 | Layers menu has no arrow keys | Right-click a Layers row → ↓ → ↓ → Escape | activeElement stayed `layer-menu-cut` both times. After Escape focus went to BODY, not back to the row | **CONFIRMED** | menus.json |
| 14 | IA-04 / D-21 | Cross-parent Group silently does nothing | selectMultiple(h3 in card A, h2 elsewhere) → right-click → Group | Menu Group enabled. Click: node delta 0, no toast. Inspector MultiSelectBar "Group" `disabled=true` | **CONFIRMED** | menus.json |
| 15 | D-02 | ⌘S in an input claims saved without saving | saveProject requests aborted; canvas edit (autosave fails → status `error`); focused the Page 4 rename input; ⌘S. Repeated with focus outside inputs | In the input: **0 requests**, `state.dirty` true → **false**, status stayed `error`. Outside inputs: **2** saveProject requests per ⌘S. In the unblocked run the Home tab's dirty dot cleared at the keypress, before the response | **CONFIRMED** | c15b.json, c15.json |
| 16 | D-05 | Undo bypasses read-only time travel | Align edit → ⌃⇧T (band shown, `composer.readOnly=true`) → ⌘Z | `text-align` left → right (undone), **sites.saveProject sent**, readOnly flipped to false. The footer Undo was disabled during time travel; only ⌘Z leaked | **CONFIRMED** | c16_24.json, d05-timetravel.png |
| 17 | D-10 | Right-click selects locked elements; Ungroup dissolves a locked container | Locked the Marinara card via menu → right-clicked it → top-level "Ungroup" | Right-click selected the locked card. Menu: "…Unlock, **Ungroup**…". Click: container gone, both children reparented, no toast | **CONFIRMED** | misc.json, misc2.json, d10b-after-ungroup.png |
| 18 | D-12 | ⌘-drag then Escape leaves a clone | Held Meta, dragged the h2 8 steps, Escape, mouseup | Headings 23 → 24 during the drag; still 24 after Escape; toast "Heading duplicated · Undo" | **CONFIRMED** | misc.json, d12-after.png |
| 19 | D-15 / D-16 | Marquee and resize overlay wrong under zoom | Marquee in the frame padding at 100% and 50%; in the grey gutter and on the root at 50%. Resize start at 50% (left-column p), handles measured at +1 px and +21 px | Marquee 100%: drawn 80×60 = pointer. 50%: drawn **40×30** for an 80×60 path (half, not double). Gutter and root at 50%: no marquee starts. Resize at 50%: at +1 px the element itself drops from 148 → 72 px screen width, and the handles jump ~135 px up/left (E handle 654,474 → 567,339) | **PARTIAL** (wrong size and jump confirmed; direction differs from the claim) | misc2.json, d1516.json, d15-50-framepad.png, d16-50-at1px.png |
| 20 | D-03 | Manual save marks clean → close loses the last edit | saveProject held 3 s; edit; ⌘S; second edit (Align Right) during the request; `page.close({runBeforeUnload:true})`; reload | dirty stayed **true** (the claim's mechanism was not seen). The status read "saved" while that edit was pending. **No beforeunload prompt** (control with a failed save *did* prompt). **After reload the last edit was lost** (center, not right) | **PARTIAL** (the loss reproduces; the cause differs) | c20.json, bu-control.json |
| 21 | D-04 | "Restore my edits" overwrites newer server work | A: saves aborted, edit fails (`bk-unsaved-v1-…` written). B: adds page "audit1014 B page" (saved). A: unroute, reload, click "Restore my edits" | After Restore: A's pages lack "audit1014 B page"; **server pages lack it** (fresh load). No ConflictModal | **CONFIRMED** | c21.json, c21-A-*.png |
| 22 | Escape in Layers | One Escape clears the selection AND closes the drawer | Selected via a Layers row, clicked the empty rail (focus BODY), Escape | One press: selection [] **and** drawer 280 → 1 px (inert). With focus on the row instead: only the selection clears | **CONFIRMED** | misc.json |
| 23 | UX-06 | Breakpoint hidden on Desktop | Searched `body.innerText` for "Desktop" or "1440" at 1280, 1366 and 1440 | No matches | **CONFIRMED** | c5.json |
| 24 | Hide eye | Hide is editor-only | Layers eye on "Diavola" h3 → canvas, ⌘P preview, exported HTML | Canvas opacity 0.25, pointer-events none. Preview iframe: display block, opacity 1. Exported HTML contains the element. Tooltip: "Show in editor — this element publishes either way" | **CONFIRMED** (editor-only; the tooltip does disclose it) | c16_24.json, e24-preview.png |

### §9 defects that have no §10 step

| ID | What I ran | Result | Verdict |
|---|---|---|---|
| D-11 lock not enforced | Locked the Diavola card, copied "Our menu" h2, selected the locked card, pressed ⌘V. Selected the locked card and pressed ⌘[ | Paste landed **inside** the locked card (children 2 → 3), showing "Locked — unlock to edit" **and** "Element pasted" toasts together. ⌘[ moved the locked card (index 3 → 2) while showing the "Locked" toast. Drop-into-locked not run (drag blocked) | **CONFIRMED** (paste-into, arrange) / drop **BLOCKED** (d11c.json) |
| D-13, D-14, D-20 | All need an HTML5 drag from the Add panel | Add-panel drag worked once (j1a). Every later attempt hung `dragTo` or **killed the browser process** at the first mousemove after mousedown. The unlocked control did the same, so this is not tied to locks. Cause unknown: Chromium headless or a product hang | **BLOCKED** (d11b.json, d11ctl.json) |
| D-17 menu Cut/Copy clipboard | The script never reached the clipboard step (it hung in the drag above) | — | **BLOCKED** |
| D-22 | Latent only | Not observable from the UI | n/a |
| D-23 recovery banner | Not targeted. The recovery path appeared as a **toast** ("Some work never reached the server … Restore my edits"), not a banner | — | Not verified |
| D-24 | No UI path | — | Not verified |

## Journey walkthroughs

**J1: add, select, nest, reorder, resize, lock, multi-select**
1. Add panel click on "Heading" with nothing selected. H2 appended as the 45th root child at y=2318, and the canvas did **not** scroll to it (`inViewport:false`). Toast "Heading added · Undo"; status went saving → saved; 1 saveProject 200. → **N1**
2. Dragged "Text" onto the h2 "Heading". Delta +1; the paragraph was inserted after the target as a sibling ("Paragraph added · Undo").
3. Canvas click on a nested h3 selected the deepest element. Breadcrumb "Home › … › Container › Heading". Clicking the parent crumb selected its parent container. Double-click on a leaf heading went into text edit, and Escape left the selection intact.
4. Layers: after expanding the ancestor chain, clicking the row of a nested p selected it. The canvas scrolled it into view; crumbs "Home › … › Container › Text". ↑ on the focused row moved both selection and focus to the previous sibling.
5. Layers reorder (row drag): the new heading moved above its previous sibling; model order changed; no toast.
6. Resize at 100% and 50%: see #6 and #7. The 50% defects are severe (halved sizes; NaN persisted).
7. Lock (Layers lock button): `isLocked()` true; canvas click on it selects nothing (by design). Right-click still selects it (#17).
8. Multi-select: Shift-click on two h3s gave 2 selected. Inspector reads "2 selected · Headings".

**J2: recover from an accident**
1. Deleted a p with Backspace: −1, toast "Text deleted · Undo". ⌘Z restored it (toast "Undo: Deleted element · Redo"), but the **selection went to its parent**, not to the restored element (N5). ⌘⇧Z redo and ⌘Z again both worked. Toast Undo also works.
2. Escape-cancel of a resize undoes the *previous* edit (#8).
3. Save status: `unsaved` → `saving` (~380 ms) → `saved` (~300 ms). `error` appears with "Couldn't reach the server — not saved", "Couldn't save … · Home" and "Retry save · Keep editing". The saved pill's text is "History ›".
4. Reload persistence: the align edit, the lock and the deletion state survived reload. NaNpx persisted (#7).

**J3: keyboard**
- **Command palette** (⌘K / ⌘⇧P): 640×800 dialog, focus in `cmdk-input`, 35 rows with an empty query. "dupl" → "Duplicate"; the typo "dplicate" → 0 rows (substring only). Enter on "Duplicate" ran it (+1). Escape closes, but focus goes to **BODY**, also when opened from a focused topbar button (no focus return). Tab stayed inside the dialog for 2 presses.
- **Shortcuts listed vs working:** the cheat sheet (`?`) lists 66 rows. I tested 62 (keys.json). All produced their documented effect, with these exceptions:
  - "C comment mode": no observable change found; unverified.
  - ⇧/⌘+Arrows on in-flow elements refuse, with the toast "This element sits in the page flow. Set Position…". This is intended.
  - ↓, End, ⌘] and ⌥↓ were no-ops only because the target was a last child. Not a defect.
  - ⌘1 zoom-to-fit gave **26%** at 1440×900 (N8).
- **Full-page tools** (Settings ⌘,; Brand rail click; Templates "T"; Assets rail = drawer, not full page):
  - Opening does not move focus into the surface; it stays on the trigger or the rail.
  - Covered chrome is neither `inert` nor `aria-hidden`. Tab reaches "Skip to Canvas", rail Help, the "Get started" checklist and the Next.js portal before entering the surface.
  - Escape closes Settings and Templates but **not Brand**: Escape moved focus to Brand's "Preview zoom" select.
  - After close, focus is BODY (no return).
  - "Back to canvas" sits at Settings (16,12), Templates (15,11) and Brand (74,20).

## New findings (not in the code map)

| ID | Finding | Measurement | Evidence |
|---|---|---|---|
| N1 | Click-add with nothing selected appends at the end of the page, off-screen, and the canvas doesn't follow | new h2 rect y=2318 in a viewport ending at 831; `inViewport:false` 1.5 s later | j1a.json, j1-click-add.png |
| N2 | At the default 1440×900 and 100% zoom, the 1024px Desktop frame overflows the 752px canvas viewport. The right column is clipped, and right-edge resize handles of right-column elements sit on the clip edge (x=1116), where a drag does nothing | `.bd-canvas-scroll` scrollWidth 1024 vs clientWidth 752; failed first CAN-03 attempt | c5.json, c8b (first run), explore.png |
| N3 | A resize-handle click with no movement at 100% converts auto width/height to fixed px on both axes | 296×28.08 auto → model `293px`/`28px` | resize.json |
| N4 | Creating a page on a site whose nav takes a link shows "Link duplicated · Undo" instead of "Page created" | toast list after Create page | c1c-1280x720.json, c1c-empty-1280x720.png |
| N5 | Undo of a delete selects the parent, not the restored element | sel after ⌘Z = `el-mufw87rq-deisu012so` (parent) | j2.json |
| N6 | Save status says "saved" while a newer edit is still pending | sequence `saved\|dirty=true` while the third request was in flight | c20.json |
| N7 | After a failed save, ⌘S inside an input sets dirty=false and status stays "error". No automatic retry within 6 s of the network returning | c15b afterUnblock: status error, saves unchanged | c15b.json |
| N8 | ⌘1 "Zoom to fit" goes to 26% at 1440×900 (fits page height, not width) | zoom 100 → 26 | keys.json |
| N9 | A locked element shows contradictory toasts: "Locked — unlock to edit" alongside "Element pasted"; Arrange shows "Locked" and moves it anyway | see D-11 | d11c.json |
| N10 | The preview page selector label overlaps its chevron ("Abo⌄t") | visual only, not measured | ux13-preview.png |
| N11 | On a reload with recovery data, a stale "Couldn't save … Retry save" toast shows next to "Restore my edits" although the reload's own load succeeded | toast list after reload | c21.json |

## State coverage actually seen
saved · saving · unsaved · error (plus the failure toasts) · recovery toast · empty page CTA · locked (badge, no canvas-click select) · read-only (time travel, footer Undo disabled) · multi-select · hidden (dimmed) · onboarding achievement modal · first-use tip.
**Never seen:** ConflictModal (not even in the D-04 scenario where it should fire), offline status, session-expired, load-error banner, recovery *banner*.

## Not verified (and why)
- #11 working-tree variant: the server runs a clean df60cf9ec worktree, so it would need a build with the uncommitted menu diff.
- #8 D-09 (cancel on unmount mid-drag): not attempted.
- #3 "no room above" case: the top heading had 44 px above it. It needs an element flush with the frame top.
- D-11 drop path, D-13, D-14, D-20: Add-panel HTML5 drags hang or crash headless Chromium after the first success (the control also failed). They need a headed browser or a manual walk.
- D-17: the clipboard step was never reached (needs a rerun without drag).
- D-22 (latent), D-23 (recovery banner, only the toast was seen), D-24 (no UI).
- "C" comment-mode shortcut: no observable marker found.
- #9(b) as specified: impossible, because opening Brand clears the selection, so there is nothing for Backspace to delete.

## Harness notes (null results that were mine, not the product's)
- A first shortcut sweep crashed after ⌘X and before its undo, so the cut persisted. It deleted p `el-mufw87rp-1qvimm6x4t9` from the Margherita card. Traced and confirmed as harness, not product.
- The editor reopens on the last active page; an early probe failed on that until a `goHome` step was added.
- Clicking an already-open rail tab closes the drawer (rig trap); one Layers read hit the closed drawer.
- Typing into the NewPageModal is fine. Enter defaults to "From template", which opens Templates. This is by design: the modal's resting choice is From template.

## Test artifacts left on audit1014-L1
- Page "audit1014 empty"
- Added h2 `el-mv7wvg01-1j9apy77hax` (locked) and p `el-mv7wvlwk-1v8izak1mou`
- Heading `el-mskbnhoc-11031is12r8` text is now " audit1014"
- Margherita h3 has width `NaNpx` / height 10px
- Marinara card ungrouped
- Margherita p deleted (harness)
- Duplicate h2 `el-mv7xth4w-km2pg81mk8`
- "Our menu" copy `el-mv7zehj8-1i11qgp1sn0` inside the Diavola card
- Assorted text-align changes
- Page "audit1014 B page" deleted by #21
