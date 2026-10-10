# Design-authority decisions — 2026-10-10

The owner's answers in `docs/audits/2026-10-08-editor-full-audit/OWNER-ANSWERS-2026-10-10.md`, written down here as the Figma source of truth for `g4GzQFqzNYz5sosz1QtZXC` (page `4418:45431`). The Figma edits named below were made and read back on 2026-10-10 (lane P2). The code changes are on branch `fix/p2-figma-authority`.

## 1. Review: v2 is the only current design (FG-002, FG-001, FG-004)

**Decided.** The Review v2 section `8165:219385` (03 Oct, 28 boards) is the single current Review design. The earlier family in section `4418:115731` is historical.

**Done in Figma.**
- I renamed the v2 section to "… Review v2 · 03 Oct 2026 — the CURRENT Review design".
- 29 old-family boards now carry `ARCHIVE · … — superseded 10 Oct 2026 by Review v2 (8165:219385) · FG-002`. I deleted nothing.
- The old section's name now says the family is archived. It holds the publish-gate boards `4418:120066` / `5931:44782` and the preview board `4418:120075`, which stay current.
- Every topbar `chip/review` (778) now opens v2. Detached → `8165:223201`, open comments → `8165:220437`.

**For the build.** See `docs/design-jobs/REVIEW-V2/state-map.md`, which maps each v2 board state to its app state. FG-001 and FG-004 build from it as one piece of work.

## 2. Page settings: a drawer with staged edits and Cancel / Save (FG-012, with FG-007)

**Decided.** Page settings is a **right-docked drawer** with **staged edits** and an explicit **Cancel / Save** footer. Save writes the draft; publishing stays separate. The same unsaved-changes guard runs on close, on page switch, and on an Issues "Fix" hand-off (FG-010).

**This supersedes owner decision #20** (boards `6887:73809/73848/73882`, quoted in `PageSettingsDrawer.tsx:7`): a centred modal with Cancel / Done. The 2026-10-04 SEO-M boards already drew a drawer, but their footer read "Discard · Save".

**Which board is authoritative.**

| Board(s) | Role now |
|---|---|
| `8197:224150` SEO-M1 · Page drawer · SEO · default | **Authoritative** for the Page settings container. The name carries "AUTHORITATIVE for Page settings (FG-012…)". |
| SEO-M1…M5d + M6b (17 boards: `8197:224150`, `8197:224590`, `8197:225020`, `8197:225454`, `8197:225890`, `8198:225605`, `8198:226013`, `8198:226393`, `8198:226773`, `8198:227181`, `8198:227594`, `8198:228023`, `8198:228438`, `8198:228843`, `8198:229255`, `8198:229662`, `8200:229123`) | Current. Each footer's secondary button now reads **Cancel** (was "Discard"): the per-board text override on the shared `Footer save bar`. `8200:228777` (M6, Fix hand-off) has no footer bar and is unchanged. |
| `6887:73809`, `6887:73848`, `6887:73882` (modal · SEO / Social / Advanced) | **Archived.** Renamed `ARCHIVE · … — superseded 10 Oct 2026 by the SEO-M Page drawer (8197:224150) … FG-012 (replaces decision #20 Cancel / Done)`. |

**Not done.** The code is still the centred modal with Cancel / Done. Changing that is the FG-007 SEO arc (owner implementation order, step 4). Doors that open the archived modal boards from the Pages row menu were not retargeted, because no shell doors were in scope for FG-012.

## 3. Inspector spacing labels: Inter, values mono (DQ-015)

**Decided.** The "Margin" / "Padding" ring labels are Inter 11/500. The numeric values stay Geist Mono.

**Done.** Board nodes `8092:211005` and `8092:211011` now use the `ui/11 · caption medium` text style (Inter Medium 11). The values (`8092:211004`, etc.) stay Geist Mono Regular 12. DESIGN.md §Typography gained the "Words beside data stay Inter" line. `SpacingControls.tsx` `BOX_TAG` now uses `--bk-font-ui` 11/500.

## 4. First-use tip: icon, not emoji (DQ-026)

**Decided.** Replace 💡 with the icon system's lightbulb. Keep "Tip 1/4".

**Done.** The icon library had no lightbulb, so I added `icon/lightbulb` (`8274:2288`, Lucide "lightbulb", 24×24, stroke bound to the same variable as `icon/bell`) to LIBRARY · icons `7396:81899` on the Components page. Board 7054:78348's title row is now auto-layout `8274:242269`: instance `8274:242265` at 14px, then "Tip 1/4". `FirstUseTip.tsx` renders lucide `Lightbulb` at 14px in ink-muted. DESIGN.md anti-slop rule 6 cites the swap.

## 5. Layers: a failed search is not an empty tree (L2-031)

**Decided.** A failed search shows "No matching layers" plus a **Clear search** button. An empty tree shows "No layers yet".

**Done.** Board 4418:83498 (no-results instance `6598:149606`) now reads "No matching layers" · "Try a different name, or clear the search." · button "Clear search". Board 4418:83911 (empty instance `6598:149601`) reads "No layers yet" · "Add an element to start building this page.". In code, `PanelStateMessage` takes a `title`, `PanelNoResults` takes `title` + `onClear`, and `LayersTab` clears its lifted search. I rewrote both tests. Pages keeps "Nothing here yet" because its boards were not changed.
