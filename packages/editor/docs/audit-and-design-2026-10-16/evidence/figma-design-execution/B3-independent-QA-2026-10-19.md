# B3 independent QA — guards and page creation

2026-10-19 · Reviewer `/root/figma_qa` · Figma design output only.

**Verdict: PARTIALLY VERIFIED.** No outstanding blocker remains from the defects identified in this bounded review after the final fresh readback and P79 screenshot. This is not full B3 acceptance, application verification, or approval of every visible control. The execution record is [B3 missing flows](B3-missing-flows-2026-10-19.md).

## Scope and evidence

Reviewed existing P01–43 records to avoid duplicate work, then independently queried native nodes and prototype reactions for P44–83 and modified P01/P10 in file `2L9OTGzBrL6kYmU18yA1c7`, page `3:4`. Inspected representative screenshots for draft retention, pending/rejected/offline save, invalid URL, short-height guards, Blank creation, validation/capacity, Templates catalogue/preview/partial failure, successful creation and restoration.

Sources of intended behavior: standing AGENTS.md, active brief decisions BD-25–28, P11 §§6–7, P15 §§5–6 and SC-24. Figma was inspected as authorized design output, not as product-research or implementation evidence. No application or Figma mutation was performed by this reviewer. This report and its two evidence images are the reviewer's only project writes.

## Separate review dimensions

| Dimension | Bounded result | Limit |
|---|---|---|
| Geometry | Sampled 1440×900 frames and 1440×600 offline guard/retained form fit; 480px guard copy grows with content; actions remain visible; creation/recovery receipts now appear above the bottom bar. Catalogue has native vertical scrolling. | Not an exhaustive measurement of every frame; narrow-width and 200% text behavior not verified. |
| Grouping and hierarchy | Retained compact shell; source selection uses a selector rather than competing command emphasis; page identity, pending return and recovery actions are grouped coherently. P79 now gives Keep editing the primary/focus treatment. | No usability study; illustrative template imagery does not establish catalogue recognition or final content quality. |
| Labels and status clarity | Local settings drafts are distinguished from confirmed Page status; offline/pending save states are explicit. Services identity matches selected page and template result. Capacity fixture retains ten pages, and Undo retains Home before explicit Open Services. | Sample receipts and outcomes are illustrative; no real persistence result was tested. |
| Interaction and accessibility | Inspected route graph now retains offline/short/ten-page/invalid-draft context; actual modal controls receive their intended links; late save after cancelled navigation returns to saved settings without leaving. Disabled-instance links were absent in the inspected graph. | Route existence is not playback. Actual keyboard/focus trapping, assistive technology, live form input, saving/history and permissions are NOT RUN. |

## Defects found and corrected

- Unqualified Saved labels beside dirty settings; pending/offline Save availability; fixed-height multiline guard help; saved destination still saying Unsaved override.
- Cancel-navigation destination failing to represent an in-flight save; submitted fields/description lacking explicit protection.
- Capacity count diverging from its page inventory; the creating checkbox losing its selected indicator; success receipts outside visible layout.
- Offline discard routing to Viewer Home; offline cancellation routing online; ten-page cancellation dropping into a six-page fixture; short guard returns losing the short viewport.
- Template confirmation and source-selector links attached to background controls rather than the modal controls.
- Cancel navigation resetting an invalid URL draft; choosing already-selected Blank supplying a name; direct Templates entry lacking its captured creation origin.
- Undo opening Services instead of retaining Home; partial import failure lacking its existing Services page/count; copied row menus navigating to unrelated About states.
- P79 emphasizing Fix page URL instead of the required safe Keep editing action; missing exact return wording; section rows using text-element icons.

## Final targeted readback

A separate read-only call after the final write confirmed persistence:

- P77 `109:30868`, P81 `109:42059`, P83 `109:44764`: **zero actionable copied page-menu navigation links**. Explicit empty `ON_CLICK` actions suppress inherited component reactions. These menu doors remain intentionally unsimulated, not functionally complete.
- P79 `109:32246`: Keep editing `109:32899` is Primary/Focus and returns to retained-invalid P78 `109:31658`; Fix page URL `109:32903` is Secondary and reaches pending correction P48. Body explicitly states that closing returns to Pages while Home stays open; text uses auto height. [Final independently inspected screenshot](b3-qa-p79-final.png).
- P70/P71 section rows use the existing square icon rather than a text-element icon.

Previously verified corrected routes include P47→offline P30, P53→short P82/P83, P55's actual From template selector→P54, P66's actual confirmation Create→P74, P57→ten-page P77, P61→offline P30, P48 Cancel navigation→retained-invalid P78, and P72 Undo→Home-retained P81 with separate Open Services.

## Playback attempt and remaining boundaries

Attempted actual playback in a separate browse tab at P55's prototype URL, at browser viewport 1280×720. Figma remained on its loading screen. Console reported **WebGL initialization failed**, alongside a 403 response and login-provider errors. No design-frame interaction executed. [Loading screenshot](b3-qa-prototype-loading.png). Playback is therefore **NOT RUN due to host rendering limitation**; it is not a successful end-to-end test or an application defect. No credential import or browser restart was attempted.

P75 Check Services→P73 represents a specifically confirmed-empty sample result, not evidence that every unknown operation yields an empty page. Other reconciliation outcomes remain undrawn. Deterministic delays and input-correction hotspots simulate selected outcomes; they are not real network acknowledgements or editable form validation. Broader guard owners, remaining B3 tasks, full Templates coverage, application implementation, save/reopen, undo persistence, role enforcement and complete accessibility testing remain open under their owning records.
