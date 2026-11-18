# R47 — Competing design pages and consolidation audit

14 October 2026. Read-only native inspection of pages `8280:2`, `8312:2` and `8463:2`; no Figma, source, STATUS or register mutations. **The user's baseline is 01 — EXISTING APPLICATION / AS-IS (`8280:2`).** Page 04 remains the authorized working successor; page 02 is a noncurrent proposal with its own clickable prototype. Neither proposal overrides the visual baseline established by 01. This audit compares module/flow structure; root's separate original-screen review establishes visual differences. No new visual acceptance or browser playback is claimed.

## Finding

There are two overlapping product proposals, each with editor navigation and module destinations. Page 02 is not merely an old mood board: Editor `8317:297` has 27 inspected reaction entries leading to its own Pages, History, Review, Preview, Publish, Media and other states. Page 04 separately implements the same product areas and has accumulated later finite interaction work. Keeping both as active improved applications makes the intended editor and flow source ambiguous.

Fresh top-level inventories contain 200 children on 01, 312 on 02 and 724 on 04. These include specifications, evidence notes, controls, dialogs and screen states; they are **not screen, feature or completion counts**. The comparison below is representative rather than an exhaustive node equivalence map. Shared names establish overlapping purpose, not identical implementation.

## Representative duplication map

| Product area / task | Page 02 — Improved Application / TO-BE | Page 04 — Product Design / Flow reconciliation |
|---|---|---|
| Editor, selected Heading, Style | `8317:297` Heading Style; `8375:1280` Layers collapsed | `8465:2` Layout/spacing; `8843:16808` Heading; `8841:14864` shared Style |
| Image / type-specific Inspector | `8317:242981` Image content; `8541:4478` Image Style | `8507:2799` Image Settings; newer `8843:20467` Image |
| Flex/Grid and mixed selection | `8317:243209` Flex; `8317:243462` Grid; `8317:247370` mixed | `8465:5` Grid editor; `8465:12` mixed; later type/Style fixtures |
| Form content / submission | `8317:246429` Form content; `8541:5836` Form Style | `8507:247302` submission; newer `8843:30589` Form and `9026:17446` After submit |
| Pages / templates | `8317:243948` Pages; `8318:244145` template new page; `8318:244368` blank | `8539:9579` Pages; `8663:12890` template new page; `8663:12911` blank |
| CMS records / fields | `8317:9` records; `8334:1058` another records flow; `8535:3606` fields | `8539:9881` CMS; `8539:11501` fields |
| Media chooser / library / upload recovery | `8317:201` library; `8318:751` chooser; `8580:6166` upload | `8539:9786` library; `8539:12728` chooser; `8579:11740` upload |
| Brand and shared styles | `8317:242215` palette; `8317:242322` foundations; `8535:3157` styles | `8539:9974` Brand; `8539:11052` styles |
| Site Settings | `8317:242436` SEO draft; `8534:2609` General; `8536:3583` Analytics | `8539:12370` SEO; `8539:10085` General; `8539:12467` Analytics |
| Saved Components / instance recovery | `8318:243977` remote-sync recovery; `8535:4213` manager; `8332:1244` reset confirmation; `8332:1665` detach confirmation | `8539:12108` manager; `8507:248294` reset review; `8543:9426` detach review |
| History / restore | `8317:244554` comparison; `8370:1379` restore safety-save | `8539:9190` History; `8666:12945` semantic comparison; `8666:12984` restore confirmation |
| Review / Activity / existing AI | `8317:244386` Review; `8317:244887` Activity; `8317:244162` stale selected-AI | `8581:11815` captured Review; `8465:50` proposed activity; `8581:11797` captured selected-AI; other proposed AI/team expansions |
| Preview / Publish | `8317:245216` Mobile preview; `8317:245051` blocked Publish; `8329:775` confirmation | `8539:9339` preview; `8539:9433` Publish; `8662:13058` confirmation |
| Utilities / workspace destinations | `8317:245583` palette; `8535:4121` shortcuts; `8534:3239` Members | `8539:12016` shortcuts; `8539:10714` Members; separate navigation from page-04 editor roots |

The R26 pairs are especially clear duplication: General `8534:2609` ↔ `8539:10085`; CMS fields `8535:3606` ↔ `8539:11501`; Saved Components `8535:4213` ↔ `8539:12108`; Publish targets `8535:4423` ↔ `8539:12318`. They are separate node trees. Fresh reads of General show independent page-04 navigation to its own Settings destinations.

Original reference anchors remain available: Heading `8283:2`, Layers `8283:610`, Pages `8283:935`, Add catalog `8283:1249`, Saved Components `8283:1654`, Media `8283:2325`, CMS records `8283:2523`, Brand colors `8286:511`, General Settings `8286:1613`, History `8290:2` / `8290:178`, Publish `8290:1233`.

## Useful behavior to salvage from 04

These are later, specifically evidenced behavior donors, not reasons to adopt page 04's shell. “Useful” does not mean the capability is absent everywhere on 02: an exhaustive reaction/value comparison was not run.

- **Scoped editing and recovery:** shared Style `8841:14864`, Heading `8843:16808`, Image `8843:20467`. R38 and R45 document finite output, property origin, raw presence/reset/owned Undo, named-device visibility versus scoped Display, and exact hidden-target Layers recovery. Preserve these contracts inside the existing application's visual/context structure. [R45 evidence and limits](R45-VISIBILITY-OUTPUT-QA.md).
- **Form field change versus remote save:** Form `8843:30589`, Fields `9024:17458`, After submit `9026:17446`. The later contract separates canvas recovery from server drafts/pending/acknowledged values, group-specific failure/retry and effective permission checks. These are finite simulations with explicit runtime limits. [R42 report](R42-FORM-OUTPUT-QA.md).
- **Select meaningful editing:** Select `8843:19020`, Options `9035:17710`, Service detail `9035:17756`. Finite label edits preserve submitted values; named removal/default consequences, recovery and return retain useful user-task semantics. [R43 report](R43-SELECT-OUTPUT-QA.md).
- **Actual output coupled to controls:** Video `8843:22237` with global Ratio/source isolation; Columns and Slides order/content-loss/recovery contracts. Reuse the evidenced behavior and source caveats, not wholesale duplicate screens. [R44](R44-VIDEO-OUTPUT-QA.md), [R40](R40-COLUMNS-OUTPUT-QA.md), [R41](R41-SLIDES-OUTPUT-QA.md).
- **Recovery branches worth checking before consolidation:** page-04 Publish checking/failure/confirmation (`8662:12993`, `8662:13097`, `8662:13058`) and History restore/Undo (`8666:12984`, `8666:13000`, `8666:13009`). Fresh existence/reaction reads establish available donor states, not fresh end-to-end acceptance or uniqueness over 02.

Do not migrate by recency alone. Page 04 also contains explicitly **PROPOSED / scope unverified** AI `8465:19–30`, Agents `8465:31–45`, and Team `8465:46–61`. Fresh Heading/Form/Image roots still have navigation destinations to proposed Agents `8465:31` and Team `8465:46`. These links need a source-backed scope decision before any consolidation; they are not automatically approved product capabilities. Page 02's remote-sync frame `8318:243977` has no inspected reactions, while its editor has working routes: evidence quality varies inside each page.

## Concrete consolidation recommendation

1. **Preserve 01 unchanged as the visual and capability baseline.** Stop treating either proposed shell as accepted. Keep both proposal pages unchanged during this audit; do not delete or bulk move them.
2. **Keep existing page 04 (`8463:2`) as the authorized working successor, rebuilding its UI to the 01 baseline module by module.** The latest baseline clarification does not authorize moving authoring to 02. Start with original Heading/Layers/Inspector, preserving its controls, hierarchy and terminology while repairing the agreed editing workflow. Page 02 remains a noncurrent historical prototype and behavior donor, not a static reference or another active improvement target. Do not create another page or parallel UI.
3. **Retain useful behavior within 04 and transfer only needed recovery work from 02.** Maintain an explicit table for every retained task: original 01 anchor → one working root on 04 → donor behavior IDs → entry, change, outcome, failure/recovery and return evidence. Preserve or migrate native variable bindings/reactions together with their dependency map; screen copying alone can leave caller aliases, owner gates and Undo wired to old roots.
4. **Prove one baseline-faithful vertical task before broader migration:** select original-style Heading → edit Mobile property with clear origin → reset/Undo → hide → recover through Layers → return with target/device retained. Compare against original 01 visually and inspect dependencies for writes back into donor roots. Then repeat module by module across the existing 14-module scope.
5. **Retire competing public entry routes only after equivalent replacements on 04 are verified.** Keep 02 as clearly historical prototype/donor evidence and 04 as the sole current working successor. Preserve an ID migration map before later historical organization or cleanup; this report does not authorize destructive deletion. Expose one recommended product entry and one current module map. Historical organization and route retirement are pending recommendations, not completed deduplication.

The immediate correction is consolidation around Existing Application, not another feature pass. R46 remains deferred. All 14 module gates remain OPEN; historical action totals and screen inventories cannot resolve this product-direction failure. This audit wrote only this report and made no native mutations.
