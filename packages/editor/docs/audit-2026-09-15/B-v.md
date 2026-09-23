# Module B · Brand · Templates · Add · Components — visual/pattern/IA pass

_Reconstructed after the reboot: agent summary + §6._

Report written to `/private/tmp/claude-501/-Users-shahg/b0605a7a-7551-4483-8ad1-16b86d46874d/scratchpad/interaction-audit/B-v.md`.

**Module B · visual / pattern / IA pass — summary**

Scope: all 6 sections read (7 + 12 + 57 + 21 + 16 + 36 boards), 9 token dialogs, 5 loose Manage-saved-master boards, 19 Brand drill-ins; pass-1 fixes and the coordinator's `templates/replaceTarget` gates kept.

Fixed (17 fix groups, 30 nodes created, 27 hidden, 0 deleted, no main-component edits, every write read back):
- **Token dialogs ×9**: every footer carried a 100-px spacer + `MIN` → 67-px blank band above the buttons; spacer hidden, footer `MAX`, padding 20→24 (v3 anatomy). Rename token 422→371 tall.
- **Components delete-confirm 4418:142410** was a wireframe spec card (grey ground, debug label, raw rectangles) used live by all 6 masters → rebuilt in place as a 560 v3 card with `Cancel`(ghost, CLOSE) / `Delete`(destructive → 142651) instances; Detach/Update confirms got foot rows + 16 SB titles + `elevation/modal`.
- **12 v1 Home backup/couldn't-apply dialogs** (stacked buttons, 22-px titles, no shadow, mixed kinds/labels) → v3 foot rows Cancel → secondary → primary, copy aligned ("Replace without a backup", "Cancel"). 14 more confirms: spacer → `MAX` (structural).
- **Templates catalogue + replace mode**: the saved "Autumn menu layout" wide text card → a 4th real card (thumbnail from the Autumn preview artwork, family CTA, same reactions); grid now 4-up 258×311; Loading skeleton 4-up; "all three" → "all four". Bistro Landing preview's outlined raw "Replace Home" → destructive Button instance with the gate copied.
- **Add family**: BLOCKS 50→8 on 13 boards (+ disabled-item 48/63/27 → 53/8/14); `COMPONENTS/MINE` → `BUILT-IN/SAVED COMPONENTS`; 7 `PAGE TEMPLATES / TEMPLATES` group headers hidden (node names themselves say "removed from Insert… four groups", matches locked v3 IA).
- **"See all 6 ›"**: Starters drill-in listed 6 *different* starters with row-level clicks → renamed to the v3 six, wired per card; the orphaned `brand/mode/advanced` is now set by every mode entry and the Starters Back row/label is a CONDITIONAL (Advanced if advanced, else Simple) — returns to where the user came from without a new variable.
- **Manage saved master ×6**: Menu card's red "Detach all" → secondary like its 5 siblings; three stacked buttons now one width.
- Reusable styles values overflowed the drawer (x→447) → right-aligned inside; stray "saved components · 0 / 2 variants" blocks hidden on 2 drill-ins; 3 v3 toasts aligned to (centre 740, y 744); live → REFERENCE "where used" link hidden.
- **Drawer ✕ dead** on the `expand-close` Panel header variant (only the `close` variant was swept earlier): wired 21 in my sections → 4418:123573.

Not changed, flagged: scrim absent on **169/169** dialogs page-wide (X2, needs one page-wide decision); 288/381 expand-close ✕ + all ⛶ dead page-wide (X1 sweep); Panel header title size is a main-component variant (X4); text-style/button-size snapping (X5, SYSTEMS).

Owner ambiguities: **A8** templates "re-map to Brand" (v3) vs "keep captured colours" (v1 ×6 strings, contradicts itself on the replace-mode board); A9 Simple "Accent" vs tokens "success"; A10 Starters back label form; A11 v1 backup-ready still manual vs v3 auto-progress; A12 library-linked masters offering Update/Delete. Variable request V1: preview CTA/subtitle/scope strings for the Menu context (they still say "Home").

Verification: reactions/properties read back in one consolidated script (all counts exact); screenshots of every changed board; playback UNVERIFIED. One write timed out (331 s, bridge stalled ~10 min) but landed — nothing re-applied.

## 6. Requests / blocked / ambiguities



### Cross-module requests
- **X1 (coordinator sweep)** — `Panel header` `Icons=expand-close` ✕ child (`…;16:13`) is dead on **288 / 381** instances page-wide (the earlier sweep only caught the `close` variant's TEXT ✕); ⛶ (`…;16:8`) is dead on 381/381 and no "drawer expanded" board exists. One indexed script: for every expand-close instance whose `;16:13` has no reaction → `NAVIGATE→4418:123573` (STATE boards keep their base-board targets). I did the 21 in my sections.
- **X2 (owner / coordinator)** — overlay scrim: 169/169 dialog-sized CURRENT DESIGN frames have `overlayBackground NONE`. If the DESIGN-RULES scrim is wanted, it must be one page-wide script (`overlayBackground = {type:'SOLID_COLOR', color:{r:.067,g:.094,b:.153,a:.5}}`), not per module.
- **X3 (CMS owner)** — I hid `Group header · TEMPLATES` `4428:151522` on `Add · Elements · Collection list` 4428:151488 (CMS section) to match the other 22 Add boards — revert if you disagree.
- **X4 (SYSTEMS / library)** — `Panel header` main component: `expand-close` title is 11 M, `close` title is 14 SB; the rule says `ui/14 · panel title` + ⛶ + ✕. Fix on 🧩 Components (16:6), not per instance. Also: raw 27/33/34-px buttons in Brand footer, Swatch picker, v3 replace confirm and token dialogs vs `Button/sm` 28.
- **X5 (SYSTEMS)** — dialog titles 15 SB (v3 + token dialogs) / 13 SB (v1 confirms), bodies 11/12 → `ui/16 · heading` / `ui/13 · row label`; DROP_SHADOW on the v3 dialogs is unbound (should be `elevation/modal`); token dialog inputs r 8 (rule 4).

### Variable requests
- **V1** `templates/previewCta` (STRING "Replace Home" / "Replace Menu") + `templates/previewScope` (STRING) — bind the four previews' `btn/Use this template` label, "Page template · Own colours and typography" subtitle and the scope footer so the Menu replace flow stops saying "Home" (set alongside `templates/replaceTarget` by Pages row menu › Replace layout and by the Add/TEMPLATES resets).
- **V2** (from pass 1, still open) `brand/picker/title` + `brand/picker/hex` for the five unwired colour rows; `components/heroSaved` etc. for Add › MINE sync; V7 token-dialog copy bindings.

### Ambiguities for the owner
- **A8 · Do templates re-map to Brand tokens or keep their captured colours?** v3 replace-mode subtitle (re-map) contradicts the v1 catalogue subtitle, all four "Replace Home" confirms, the save-as-template note, the saved card meta and the preview subtitles ("Own colours and typography") — and contradicts its own saved card on the same board. Pick one; ~9 strings change.
- **A9 · Simple's sixth colour is "Accent #C27803"; Colour tokens shows "success #057A55" as the sixth most-used.** Fine if Accent is among the other 12 tokens; otherwise one of the two lists is wrong.
- **A10 · Starters Back label**: kept "‹ Brand · Starters" (level-1 breadcrumb pattern) although its destination is now conditional; "‹ Brand" would be the destination-naming form used by level-2 drill-ins. Also the six starter thumbnails on the drill-in are blank grey (v1 leftovers) while the Simple cards show dot swatches.
- **A11 · v1 Home backup-ready dialogs** are still manual confirms (Replace Home with X button) while the v3 Menu backup-ready became a 1.4-s progress step (owner decision in the F-ledger). Anatomy is aligned; the flow model is not — say if the Home chain should also auto-advance.
- **A12 · Library-linked masters** (Button / primary, Price row) offer "Update from selection…" and "Delete … master" although their copy says library updates arrive automatically — intended (unlink) or should those two be disabled?
- Open from pass 1: A1–A7, D1 (now gated by `replaceTarget`), M1–M11.

### Blocked / not done on purpose
- R2 starter-applied state, R4 block hover ×7, R7 Home-applied toasts — need new boards; listed as inferred.
- Scrim, text-style snapping, button-size unification — page-wide / SYSTEMS (X2, X4, X5).
