# P2 status: design authority (2026-10-10)

The P2 package from `OWNER-ANSWERS-2026-10-10.md`. Branch: `fix/p2-figma-authority` (from `503bc62cd`). Figma file: `g4GzQFqzNYz5sosz1QtZXC`, page `4418:45431`, plus the Components page `1:2`.

- **Decision log:** `docs/design-jobs/FIGMA-TO-CODE/DECISIONS-2026-10-10.md`
- **Review v2 state map:** `docs/design-jobs/REVIEW-V2/state-map.md`
- **Screenshots:** `evidence-p2/` (`fig-*` = board, `live-*` = app at 1440×900, port 3660, throwaway site created and deleted)

**How writes were read back.** Every `use_figma` write returned its own in-call readback (names, reaction destinations, fonts, text). A separate read call (w4) then re-fetched the nodes by id: names, `chip/review` reaction destinations, label fonts, tip text and siblings, and the Cancel text. That same call took five node screenshots; the four that cover the edits are saved under `evidence-p2/`.

| ID | Status | Figma nodes changed | Commit | Evidence |
|---|---|---|---|---|
| FG-002 | DONE (Figma) | Section `8165:219385` renamed to "… Review v2 … the CURRENT Review design". Section `4418:115731` renamed to "… OLD family, archived …". 29 boards prefixed `ARCHIVE ·` and suffixed "superseded 10 Oct 2026 by Review v2": `4418:115732, 115743, 115752, 115766, 115784, 116040, 116264, 116479, 116688, 116906, 117140, 117393, 117646, 117900, 118153, 118407, 118661, 118896, 119819, 120123, 120342, 120553, 120752, 120964, 121174, 121372, 121571, 121686`, `6879:66771`. Kept: the publish gates `4418:120066` / `5931:44782`, preview `4418:120075`, and 3 boards that were already archived. `chip/review` CONDITIONAL reactions on 778 Topbar instances changed `4418:116906→8165:223201` and `4418:115784→8165:220437` (plus one stray, `6879:66771→8165:219395`). | f33c28ef1 | Readback histogram: 770 + 5 (double reaction) chips → `[8165:223201, 8165:220437]`. 1 → `8165:219395`. 2 boards keep a self-link on one branch (`7566:192704`, `7571:191619`, untouched). 0 failures. Sample `I4418:46798;4418:144994` re-read in w4. |
| FG-001 | READY TO BUILD (not built) | — (FG-002 is its unblocker) | f33c28ef1 | The code rebuild of `ReviewTab` follows the state map. Not started in P2. |
| FG-004 | DONE (map) / NOT BUILT | — | f33c28ef1 | `REVIEW-V2/state-map.md`: 26 v2 boards → `ReviewPillState` / round / `NextMove.gate` / load / role, plus 4 code-only states that still need boards. |
| FG-012 | DONE (Figma + log) / code NOT changed | Modal boards `6887:73809`, `6887:73848`, `6887:73882` renamed `ARCHIVE · … superseded … by the SEO-M Page drawer (8197:224150) … Cancel / Save`. `8197:224150` suffixed "AUTHORITATIVE for Page settings (FG-012…)". Footer "Discard" → "Cancel" on 17 SEO-M boards (text nodes `I<bar>;7443:150521;9:55` in `8197:224150, 224590, 225020, 225454, 225890`, `8198:225605, 226013, 226393, 226773, 227181, 227594, 228023, 228438, 228843, 229255, 229662`, `8200:229123`). `8200:228777` has no bar. | f33c28ef1 | w3 returned the 17 text ids. w4 re-read `I8197:224525;7443:150521;9:55` = "Cancel". Code is still the modal with Cancel/Done (`PageSettingsDrawer.tsx`); moving it is the FG-007 SEO arc. Pages-menu doors into the archived modal boards were not retargeted. |
| DQ-015 | DONE | `8092:211005` "Margin", `8092:211011` "Padding" → text style `ui/11 · caption medium` (Inter Medium 11). Values (e.g. `8092:211004`) stay Geist Mono Regular 12. | f33c28ef1 | w4: both labels "Inter Medium 11". Live: labels `Inter 11px/500 rgb(108,112,121)`, value inputs `"Geist Mono" 12px tabular-nums`. `fig-7993-198908-spacing.png` vs `live-spacing.png`. DESIGN.md §Typography updated. |
| DQ-026 | DONE | New component `icon/lightbulb` `8274:2288` (Lucide, 24×24, 3 vectors `8274:2285–2287`, stroke bound to `VariableID:524:64` like icon/bell) in LIBRARY · icons `7396:81899`, page `1:2`. Tip board 7054:78348: title `7054:78352` "💡  Tip 1/4" → "Tip 1/4", wrapped in new auto-layout row `8274:242269` with instance `8274:242265` (14px). | f33c28ef1 | w4: title "Tip 1/4", siblings `icon/lightbulb,title`. Live: "Tip 1/4" + 14×14 svg in ink-muted. `fig-7054-78351-tip.png` vs `live-tip.png`. DESIGN.md rule 6 cites it. |
| L2-031 | DONE | No-results instance `6598:149606` (board `4418:83498`): Title "No matching layers", Message "Try a different name, or clear the search.", Action on, button text `I6598:149606;…` "Clear search". Empty instance `6598:149601` (board `4418:83911`): Title "No layers yet", Message "Add an element to start building this page." | f33c28ef1 | Live: a search for "zzzqq" shows "No matching layers" (Inter 13/500) + Clear search + Search everywhere. Clear search empties the field and the tree returns (1 row). An empty page shows "No layers yet". `fig-4418-83503-layers-noresults.png` vs `live-layers-noresults-full.png`, `fig-6598-149601-layers-empty.png` vs `live-layers-empty.png`. Tests rewritten: `LayersNoResults.test.tsx`, `LayersEmptyState.copy.test.tsx`. `copy.json` amended. |

**Gates.**
- `tsc --noEmit`: 0 errors.
- Targeted vitest (layers, build components, inspector controls + SpacingSection, pages, layers tab): 83 files / 661 tests pass.
- `verify:ds` (editor + dashboard): exit 0, run on f33c28ef1. The copy gate needed `copy.json` amended for the new Layers empty sentence.

**Not verified or not done.**
- A page-wide scan for other inbound links to the archived Review boards timed out server-side. Only Topbar `chip/review` was retargeted.
- The 3 "Review anchored" top-level boards (`4418:172804/173065/173326`) were not classified.
- Live side-by-side for Review v2 and SEO-M was not done, because no code changed for them.

Figma call spend: 11 `use_figma` calls (7 reads, 4 writes), of which 2 reads failed (an over-size return, and a server-side timeout on the page-wide reaction scan).
