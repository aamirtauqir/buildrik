# Module C · CMS · Pages · Assets — visual/pattern/IA pass

_Reconstructed after the reboot: agent summary + §6._

Report written to `/private/tmp/claude-501/-Users-shahg/b0605a7a-7551-4483-8ad1-16b86d46874d/scratchpad/interaction-audit/C-v.md`.

**Module C · visual / pattern / IA pass — summary**

Scope: all 13 sections + 12 loose dialogs read (frame lists, archetype screenshots, structural reads); earlier fixes A–M and the coordinator's wiring untouched. Every write read back in one consolidated call; 0.5× screenshots of changed boards.

Fixed (23 batches, ~130 nodes):
- **Pages bulk bar** 94471/96537: "Duplicate" and "Move to…" overlapped by 24 px → re-spaced (x 162/230).
- **Delete "Menu"? 93099**: emphasis was inverted (Cancel filled blue, Delete outlined) → ghost Cancel + filled red Delete (file majority).
- **Image editor Resize 149498** rendered empty (Body missing, footer at y 162) → Body cloned from 154331; stray 1-px border removed on the 3 Optimise boards.
- **Delete-field chain** 165425/165439/165458: 100-px footer spacer → 6 px (buttons no longer pushed down).
- **Old row menu 91555** → v3 anatomy (200 wide @72,176, shortcuts right-aligned); items kept since 93657/93929 depend on them.
- **Breadcrumbs**: 8 Pages boards leaked state names ("› Menu actions", "· searching"…) → `Bella Cucina › Home › Pages`; 6 live old-Content boards → crumb `Bella Cucina › Home › CMS` + status `CMS · Menu items › X` (was "Content · …").
- **Pages toolbar**: 13 older boards lacked the Structure toggle (166-px box, Listings only) → aligned to the base family; all 25 Structure links now go to the real structure view 95789 (7 went to 164827 — a listings duplicate labelled "↳ Structure / ⚂ Structure", now hidden; 6 went to the *listings* board). 95789 got its `‹ Pages` return and "+ Add page".
- **CMS dialogs ×30** (Add record chain, Add/Configure field, Field settings ×8, Generated pages, Products, 88263, 86914): stacked ghost links → v3 footer row (dismiss → secondary → primary) + border/shadow; Name field settings outlier (560 wide, lowercase title, different labels) aligned to its 7 siblings.
- **New states** (cloned from file anatomy, wired from trigger + STATES launcher): `STATE · CMS · Delete collection?` 4757:150118 (Settings › Delete collection… → OVERLAY; Cancel CLOSE; Delete → CMS root 140486) and `STATE · CMS · Collection renamed` 4762:55480 (Rename → NAVIGATE, toast cloned from 96537).
- `Generate 4 pages` 148113 now sets `pagesGenerated / menuItems = true`.

Reported, not changed:
- GENERATED · MENU ITEMS is five sibling nodes per board (rule/header/sub/rule/source frame) → 45 visibility bindings needed (R1), not a single node.
- Old `Open Fields`/`Open Dynamic pages` edges (36) left: 85740 is the only home of the added-field rows (Save field ×7 land there), 86021 of the URL-pattern validation chain, 86237 of the Price-required sheet (A2).
- Add record = 720-px modal vs in-place side sheet 144760 → flag A1 (recommend sheet in "new" mode).
- Assets dialog family has two footer treatments across ~47 dialogs (stacked 180×44 vs primary-left row) → R2 (systems-scale); Inspector header "Media" vs element name on 6 canvas boards → X1; `Choose for canvas` with no selection → A4; 95789's page list ≠ listings tree → A5; Team empty tabs/Add record still blocked (B1).
- Team sidebar count already reads "0" (misread at 0.5×).

UNVERIFIED: no playback — overlay→NAVIGATE from the Delete-collection dialog, Structure toggle round-trip, and 22 of 30 footer conversions verified by structure read-back only (8 by screenshot).

## 6. Requests / blocked / ambiguities



**Requests**
- R1 (coordinator / Pages owner): bind `visible` of the five GENERATED nodes per Pages board (ids above) to `VariableID:4643:45304` — 9 live boards × 5 = 45 bindings; then 147857 can flip "PAGES TO GENERATE" to a generated state on the same variable.
- R2 (SYSTEMS / Assets owner): the Assets dialog family has two footer treatments (stacked 180×44 vs `Dialog actions` primary-left); align both to the v3 footer (right-aligned, dismiss → primary) — ~47 dialogs, and titles 24 → `ui/20 · heading lg`. Row-menu items 27/30 px and dialog titles 22 px in the CMS family are text-style work (SYSTEMS).
- X1 (Inspector): `Inspector · profile · MEDIA` header reads "Media" while Layers / breadcrumb / status read the element name on 150780, 151046, 151238, 160695, 160961, 162133.
- X2 (Pages): `⟳ btn/reload-pages` exists only on the base family (90494, 93108, 93381, 93657, 93929, 94200) — decide whether the other 21 boards get it.

**Ambiguities for the owner**
- A1 Add record as a 720-px modal (164185 chain) vs the in-place side sheet (144760): majority pattern for record editing is the sheet; recommend "Add record" = the same sheet in new mode (title "New record", empty fields, Save record / Discard). Not changed.
- A2 Old Content cluster kept as the second design generation: 85740 / 86021 / 86237 are the only homes of the added-field rows, the URL-pattern validation chain and the Price-required sheet, so the 36 `Open Fields` / `Open Dynamic pages` edges were left on the old boards. Retarget only after v3 147552 gets conditional field rows (X5 of the interaction report) and 143182 gets a Price-required sheet.
- A3 "Collection renamed" toast (4762:55578) has no auto-dismiss, like its source 96537; add AFTER_TIMEOUT if toasts should clear.
- A4 `Choose for canvas` from Asset details with nothing selected always targets Home › Menu preview image.
- A5 95789 (structure view) lists a different page set than the listings tree; either redraw its rows from the listing (Marketing › …, Home, Menu, Contact, Legal › …, About) or accept it as illustrative.
- A6 93099's emphasis was swapped to the file majority (ghost Cancel, red Delete); if the Pages owner intended "safe default = Cancel", revert 93104/93106 and the clone 4757:150118 together.

**Blocked**
- B1 Empty Team 148905 tabs and `Add record` ×2 — still no Team boards / collection-agnostic Add-record dialog.
- B2 GENERATED group visibility gate (R1) — multi-node group, out of the "single node" remit.
