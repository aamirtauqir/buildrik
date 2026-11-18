# R47 — restore useful workflows within the original Buildrick UI

14 October 2026. Read-only comparison. **Page 01, Existing Application (`8280:2`), is the visual and structural baseline.** Page 04's simplified shell is a substantial departure from that baseline, not merely a spacing problem. Restore the existing canonical page-04 editor roots in place using page 01's structure and page 01A's controls; retain useful authored workflows. Do not create another parallel UI or globally restyle component masters.

## Representative evidence

| Role | Native frame |
| --- | --- |
| Original Heading Style, 1440 × 900 | [8293:2](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8293-2) |
| Original Image Style / Behaviour | `8293:373` / `8293:734` |
| Original Layers, 1280 × 720 | `8283:610` |
| Earlier Improved Heading / Image | Page 02 `8312:2`: `8317:297` / `8317:242981` |
| Current authored Heading / Image | Page 04 `8463:2`: `8843:16808` / `8843:20467` |
| Original reusable controls | Page 01A `8286:1818`, board `8287:2` |

Native inspection independently verified original labels, dimensions, construction and absence of reactions. Root visually reviewed original `8293:2` and Improved `8317:297`; this agent reviewed the rendered [original reusable controls](evidence/figma-current-controls.png) and the four page-04 screenshots linked in [R45 visual audit](R45-EDITOR-VISUAL-AUDIT.md). Page-01 full-screen screenshot review is attributed to root, not claimed as this agent's independent pixel inspection. The R45 screenshots precede the targeted workflow repair.

## Concrete deviations to correct

| Original UI / evidence | Page 02 and page 04 departure | Restore-in-place implication |
| --- | --- | --- |
| 60 px tool rail, separate 280 px Pages/Layers drawer, 300 px Inspector. Original Add/Layers/Pages/Assets/CMS/Brand/Help labels at `8293:37–72`; Pages header/search `8293:79/86`. | Page 02 retains a 280 px drawer `8317:347` and 300 px Inspector `8317:418`. Page 04 replaces the rail/drawer distinction with a ~216 px text navigation column mixing destinations and tree rows; Inspector is 352 px. | Restore the original shell proportions and distinct tool/drawer roles within the existing page-04 roots. The original already has the rail; this is restoration, not a new Webflow-themed rail. |
| Original Inspector has breadcrumb, element name, AI/menu/hide, **Style / Behaviour / Effects**, then State: Base (`8293:182–209`). | Improved Heading uses Style/Settings/Interactions; Improved Image still uses Style/Content/Effects. Page 04 uses Style/Settings/Interactions and a separate generic Shared Style view. | Restore one consistent original header/tab/context structure. Map actions by meaning; simply renaming Interactions to Effects would put the wrong controls there. Keep intentional ownership changes explicit rather than silently duplicating properties. |
| Heading Level segment, Text style and Edit text on canvas sit in the original type section (`8293:217–236`); Typography follows. Compact 24 px inputs sit in 28 px rows. | Page 02 Heading property rows are 38 px high (`8541:4099`, `8541:4115`), and introduces Layout ahead of Typography. Page 04 often presents full-width fields, route buttons and recovery buttons as a sparse form. | Recompose the existing actions using original section headers, label/value rows and segmented controls. Preserve the newer text-style/size/output contract without retaining the replacement form layout. |
| Original Layers has its own header, search, selected element rows and count (`8283:688/695/701/706/711/716/717`). Original selected layer component is 278 × 28 with icon and pale-blue selection. | Page 04 mixes tree identity with navigation and previously added a second Image identity. R45 fixed the duplicate and highlighted the real row, but the flat navigation structure still differs. | Put the existing real selection/recovery actions into the original Layers surface. Preserve hidden-element recovery and one logical identity; do not add another selection list. |
| Original retains open page tabs, bottom View/zoom and selected dimensions (`8293:107–109`, `172–178`); root's visual review also identifies bottom Undo. | Page 02 keeps page tabs, zoom and width, but its Undo node `8317:409` has no reaction. Page 04 substitutes repeated context labels and large device buttons, losing much of that editing context. | Restore original page/canvas controls and placement. Map a truthful existing Undo workflow; a visible Undo icon is not proof of working document history. Retain actual device-width bindings and page bounds. |
| Original Image uses Choose image, alt hint, Fit segments and Loading in its type section (`8293:594–611`). Behaviour groups CMS, Visibility, Interactions, CSS classes and Attributes (`8293:942–978`). | Page 02 mixes Image content and display under Content; page 04 routes fit to Shared Style and uses generic fields/buttons. | Reuse the original compact image presentation while preserving the approved attribute-versus-style write scopes. Decide and document any necessary tab-placement exception; do not discard global source/alt behavior or scoped fit behavior to match a screenshot. |

The original UI dimensions and tab/section contract are also recorded in [AS-IS Inspector state specification](AS-IS-INSPECTOR-STATE-SPEC.md). Its recorded defects are reference evidence, not behaviors that must be reintroduced.

## What is actually reusable

The four inspected original screens are **native editable DOM reconstructions**, not raster captures. All four contain rectangles, text, vectors and frames, with **no component instances, no image fills and no prototype reaction nodes**. Heading `8293:2` has 260 direct children. They provide measured placement and visual references; they are not a ready-wired component shell.

Page 01A supplies the reusable components. Current native reads confirmed these masters exist; inspected controls have no descendant prototype reactions, so workflow actions must be mapped deliberately.

| Original family | Masters to reuse without modifying them |
| --- | --- |
| Publish / Preview | `8287:12` / `8287:22`; Publish contains an instance of original Button `9:18` |
| Text select / number-unit / colour | `8287:35` / `8287:41` / `8287:53`, each 160 × 24 |
| Style / Behaviour / Effects tabs | `8287:72` / `8287:76` / `8287:80`, ~100 × 32 |
| Heading level / context | `8287:89` / `8287:249` |
| Heading / Typography / Size headers | `8287:118` / `8287:123` / `8287:128` |
| Text style / font size / line height / weight / colour rows | `8287:138` / `8287:145` / `8287:158` / `8287:171` / `8287:178`, 299 × 28 |
| Selected layer / Pages header | `8287:220` / `8287:238` |
| More / Hide inspector | `8288:7` / `8288:13` |

These are bounded captured states, not a complete library of responsive and interaction variants. See the [library provenance and limits](FIGMA-AS-IS-COMPONENT-LIBRARY.md).

## Consolidation and action mapping

1. Keep page 01 as the AS-IS reference and 01A as the original control library. **Repair current canonical page-04 roots `8843:16808` / `8843:20467` in place**, retaining entry IDs and current variable ownership. Use instances/local composition from the original controls; do not make another product page or mutate global `8314:*`, `8287:*` or original masters.
2. Transfer useful page-04 actions to their restored original surfaces. Preserve real layer recovery (`8843:16833`, `8843:20492`), complete target/device synchronization, actual selected visibility bindings (`8843:17107`, `8843:20778`), dynamic website widths, and the existing guarded Undo (`9064:17599`) reachable independently of collapsed sections. Keep the current finite/runtime limitations explicit.
3. Treat page 02 as overlapping earlier work, not a second current application. It has some wired routes—Heading Layers `8317:323 → 8375:1280`, Pages `8317:327 → 8317:243948`, History `8317:310 → 8395:1711`, Preview `8317:314 → 8329:1629`, Publish `8317:316 → 8317:245051`—but other apparent controls are inert. These are route inventory inputs, not proof their destinations should become canonical or that they work end to end.
4. After the restored page-04 journey is reviewed, reconcile overlapping page-02/page-04 entries into one explicit canonical route map. Redirect existing links where appropriate and mark superseded alternatives clearly. Archive or remove duplicates only after incoming destinations and useful unique flows are accounted for. **Deduplication has not occurred in this audit.**

The next review should compare the restored canonical editor directly against original page 01 and walk the preserved editing flows. More action counts cannot establish fidelity to the original interface. This task made no Figma, source, STATUS or registry changes.
