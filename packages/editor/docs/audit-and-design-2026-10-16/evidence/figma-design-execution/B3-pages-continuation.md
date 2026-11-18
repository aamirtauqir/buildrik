# B3 Pages continuation — open, scale and restricted access

2026-10-19 · DESIGN ONLY · continuation of the authorized B3 batch. Initial scope recorded before Figma mutation; final evidence follows below.

The task is to open an existing page without carrying another page's selection, and to keep page navigation understandable with many pages or restricted writes. Existing source `usePages.selectPage` calls `setActivePage` directly; the approved P11 contract additionally requires guards and per-page view snapshots. Those requirements are not claimed implemented.

## Decision and boundary

Retain the compact284px manager beside56px rail,300px Inspector,56px topbar and32px bottom strip. Extend the existing Editor scenes; do not create another Pages workspace. Widening the normal manager would contradict BD-25, and hiding page actions would reduce discoverability. Existing40px page rows,56px stacked status rows, pinned search/views and84px creation footer remain.

This C2 slice represents: About opened with a distinct illustrative canvas, no selected element and its canonical Page appearance Inspector (INS-D03); Pages reopened on About; a100-page fixture with one scrolling list and horizontally scrolling page strip; offline manager and page menu with explicit write restrictions; offline opening of an already-loaded About; Viewer Home/About with disabled Pages management and working page navigation. Content is illustrative fixture data, not a production-page capture.

Scope owners: Pages manages page resources; bottom strip opens pages; Inspector owns selected objects; role restrictions follow SC-6/P11. Offline means loaded pages remain navigable while manager writes require a connection. Viewers cannot enter the manager, but can navigate created pages. Opening Pages alone changes neither page nor selection. About's first visit uses Fit/no selection/Base; return to Home restores its existing Text/Desktop/52% fixture.

Reuse existing native components, semantic tokens and current accepted styles. No shared token or master changes planned. Changes are limited to new scenes and existing About navigation links. Existing creation/template/folder/action doors remain available; their complete destination flows are deferred explicitly rather than represented as working here.

## Acceptance and risks

- Separate checks for geometry, grouping, label/status scope, navigation and access. Inspect native screenshots after composition.
- Verify About labels, active bottom tab, Layers and canvas agree; use Page appearance, never inherit Home's selected-object fields.
-100 actual native list rows; header/search/views/footer fixed; list and bottom navigation scroll independently. More than300-row virtualization remains an implementation requirement, not demonstrated by Figma.
- Offline controls retain clear reasons. Viewer manager entry has no navigation reaction; viewport browsing remains available. No role expansion.
- Preserve exact target and return routes; no inherited prototype actions leading to an unrelated state.
- Inspect short/narrow compositions already recorded in BD-27; the new100-page fixture also needs a short-height specimen.
- Runtime keyboard, screen reader, draft persistence, page snapshots, server permission and offline synchronization tests remain NOT RUN. Prototype wiring is structural evidence, not browser verification.

Independent read-only review required by Product Design Guard. Full B3, creation/templates, switch-draft branches, remaining folder/reorder flows and other editor modules remain pending.

## Delivered native states

16 new top-level scenes on03 · Editor. Existing01–27 and their historical status are not replaced.

| State | Figma |
|---|---|
| B3-P28 · Open About / first visit | [94:12846](https://www.figma.com/design/2L9OTGzBrL6kYmU18yA1c7?node-id=94-12846) |
| B3-P29 · Pages / About active | [94:13447](https://www.figma.com/design/2L9OTGzBrL6kYmU18yA1c7?node-id=94-13447) |
| B3-P30 · Pages / offline loaded pages | [94:14750](https://www.figma.com/design/2L9OTGzBrL6kYmU18yA1c7?node-id=94-14750) |
| B3-P31 · Offline / About opened | [94:15445](https://www.figma.com/design/2L9OTGzBrL6kYmU18yA1c7?node-id=94-15445) |
| B3-P32 · Pages / 100-page fixture | [94:15802](https://www.figma.com/design/2L9OTGzBrL6kYmU18yA1c7?node-id=94-15802) |
| B3-P33 · 100 pages / short viewport | [94:18181](https://www.figma.com/design/2L9OTGzBrL6kYmU18yA1c7?node-id=94-18181) |
| B3-P34 · Viewer / Home | [94:20973](https://www.figma.com/design/2L9OTGzBrL6kYmU18yA1c7?node-id=94-20973) |
| B3-P35 · Viewer / About | [94:21526](https://www.figma.com/design/2L9OTGzBrL6kYmU18yA1c7?node-id=94-21526) |
| B3-P36 · Offline / page actions | [94:28891](https://www.figma.com/design/2L9OTGzBrL6kYmU18yA1c7?node-id=94-28891) |
| B3-P37 · About / page settings return | [94:29621](https://www.figma.com/design/2L9OTGzBrL6kYmU18yA1c7?node-id=94-29621) |
| B3-P38 · Offline / page settings save unavailable | [94:30029](https://www.figma.com/design/2L9OTGzBrL6kYmU18yA1c7?node-id=94-30029) |
| B3-P39 · Offline / Home retained | [94:30772](https://www.figma.com/design/2L9OTGzBrL6kYmU18yA1c7?node-id=94-30772) |
| B3-P40 · 100 pages / manager closed | [94:31301](https://www.figma.com/design/2L9OTGzBrL6kYmU18yA1c7?node-id=94-31301) |
| B3-P41 · 100 pages / short manager closed | [94:33551](https://www.figma.com/design/2L9OTGzBrL6kYmU18yA1c7?node-id=94-33551) |
| B3-P42 · Offline / Pages on About | [94:35825](https://www.figma.com/design/2L9OTGzBrL6kYmU18yA1c7?node-id=94-35825) |
| B3-P43 · About settings / exact manager return | [95:20851](https://www.figma.com/design/2L9OTGzBrL6kYmU18yA1c7?node-id=95-20851) |

## Navigation and continuity

- Main Editor About tab7:21047, manager About row63:6956 and restored-page Open64:19136 now reach P28. Returning Home restores the existing Text/Desktop/52% specimen.
- P28 ↔ P29 preserves the same About authored content and Page appearance. SEO from P28 opens P37 and returns to P28; SEO from P29 opens P43 and returns to P29. Modal Close/Cancel retain the captured origin. These are pristine-settings specimens: Save is disabled until an edit; this slice does not simulate a successful write.
- P30 → About → P31; P31 opens its own manager P42. P39 is the exact offline Home closed state. No new offline navigation reaction leads to an online scene.
- P30 About ellipsis → P36; its Page settings → P38; Cancel/Close → P30. The P36 panel X and rail Pages button close to P39; its About ellipsis dismisses only the menu back to P30.
- P34 ↔ P35 switches Home/About without leaving Viewer access. Pages/Add/CMS/Brand are restricted; Undo/Redo and structural actions are disabled. Existing ViewerRoleNotice body is preserved, rather than showing additional Inspector properties.
- P32/P33 close to P40/P41 and reopen with the same100-page fixture/viewport. Their page-open destinations are not simulated; do not route them into the five-page fixture. Right chevron structurally scrolls to the final tab. Incremental scroll, keyboard roving and tooltip behavior remain runtime/prototype-playback checks.
- Bottom plus opens the existing manager; in Viewer it is disabled with the specified adding-pages access reason. Focusing Add page after opening remains the P11 implementation contract, not a Figma keyboard result.

## Control, geometry and access handoff

P28/P29/P31/P35/P37/P42/P43 share identical illustrative About typography and geometry. No selection restores Page appearance: background, max width with separate px selector, typography, spacing and that page’s SEO entry. This corrects the interim empty Inspector; the initial interim screenshot is not final evidence.

Normal manager284×812 at1440×900; short manager284×512 at1440×600. Header56, pinned search/views92, footer84, one vertical body;100 rows are260×40 with4px gaps (4396px total content). Bottom strip keeps100 native navigation buttons and horizontal overflow; long labels retain full text with visual ellipsis. The100-page fixture has no folder or collection data; their management actions remain in the footer. Existing grouped five-page specimen retains folders and collection navigation.

Settings reuse the centered720×700 modal atx360/y112, full-screen scrim, one body scroll and fixed footer. Pristine online Save is disabled. Offline fields permit local staging while Save is disabled with “Needs a connection to save page settings” inside the footer; this is not a claim that every field is read-only. Dirty offline cancellation/guard is still pending.

Offline page-menu write entries are disabled; Copy link and Page settings remain available by contract. Loaded page navigation remains allowed. Viewer Pages rail has no opening reaction and no manager scene; bottom status reads View only with Versions entry. Scope/permission reasons remain readable in the role notice. Permissions and Versions destinations are retained but unwired in this slice and remain B3 work.

## Verification and evidence

Status: **PARTIALLY VERIFIED — bounded native design/structure review, not implementation verification.**

Final recursive readback:16 scenes,59 internal prototype reactions,0 image-filled UI nodes,0 offline-to-online route leaks and0 reactions on Disabled instances. Both long-list scenes have exactly100 native rows and100 bottom tabs. All7 About branches have identical authored text/font/geometry signatures. Three existing entry links were also connected; those are outside the59 new-scene reaction count. The initial mutation ledger includes superseded routes; [final audit](b3-pages-continuation-final-audit.json) is authoritative.

Final visual evidence: [About open](b3-about-open.png), [About manager](b3-about-manager.png), [100 pages at600px height](b3-pages-100-short.png), [Viewer Home](b3-viewer-home.png), [offline menu](b3-offline-menu.png), [offline settings](b3-offline-settings.png). Compare the manager with prior [BD-27 evidence](pages-grouping-refinement.md), and default editor with [BD-28 evidence](editor-style-rollout.md). Existing accepted shell styling is retained; this is additional state coverage.

Independent reviewer `/root/design_guard_reviewer` found and prompted corrections for: inherited offline-to-online menu links; inconsistent About typography between clones; settings positioned as drawers without modal scrims; offline reason outside its modal; offline panel X dismissing only the menu; and SEO returning to a closed manager when opened from an active manager. Targeted readback and screenshots verified corrections. Final independent native readback confirmed offline Close/rail→94:30772 and manager SEO→95:20851→94:13447. **No outstanding blocker remains within this bounded continuation.** Ownership/access, sampled geometry, grouping and status scope passed the design review. The reviewer retained **PARTIALLY VERIFIED** because runtime, keyboard/accessibility and end-to-end prototype playback were not run; full B3 and implementation readiness are not established.

Runtime/browser, keyboard, assistive technology, save/reopen, undo/redo, real offline sync, server authorization, switch guards,200% text and100-page narrow-width behavior: **NOT RUN**. Native prototype links are structurally checked, not claimed played end-to-end. No application code, data, shared master/token definitions or deployment changed.

Artifact validation passed: final JSON parsed;16-frame/100-row/permission-route assertions passed;7 About signatures matched; all local evidence links resolved; six PNG signatures and dimensions verified (five1440×900, one1440×600). This validates the handoff artifacts, not application interactions.

## Next resumable work

Complete New page Blank/template choice and actual catalog return, creation/capacity failure, page-switch draft guard/failure, folders/reorder, full long-list search/keyboard/navigation, remaining settings variants and Permissions/Versions destinations. Then continue B3 Canvas/Layers, palette/Help and Share preview. Existing narrow manager samples remain available, but they do not certify a100-page narrow fixture. Full B3 stays open.
