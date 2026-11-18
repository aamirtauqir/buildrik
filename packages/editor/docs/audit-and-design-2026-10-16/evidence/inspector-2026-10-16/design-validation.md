# Inspector design-specification validation — 2026-10-16

Normative parent: FD-INS-02 in PRODUCT-DESIGN-BRIEF.md. This is evidence for a documentation-only design specimen and written contracts, not corrected application runtime, user research or accessibility conformance.

## Artifact and method

`inspector-design.html` uses the existing generated chrome tokens and local Inter/Geist Mono fonts. It contains 13 selectable scenario compositions, four tabs, a source-details/return dialog, a simulated invalid-input session, restricted/special bodies and text-enlargement control. No Composer/application imports, project save, service requests or deployment. Resource dialogs only illustrate destination/return scope; they are not complete resource managers. The fixture picker and 32px design-review strip are test aids, not product navigation.

Opened through the already running Vite file-serving route:

`http://localhost:5050/@fs/Users/shahg/Desktop/pencil/buildrik/packages/editor/docs/audit-and-design-2026-10-16/evidence/inspector-2026-10-16/inspector-design.html`

The initial ordinary `/docs/...` URL returned the existing app because Vite's root is `demo`; title/DOM inspection detected this and the file-serving URL was used. No app routing was changed. Browser commands used the isolated audit profile `/tmp/buildrik-inspector-audit-browse.json` with approved access. Measurements use CSS viewport dimensions, normal browser zoom and loaded local fonts. No fabricated production or external-comparison evidence.

## Measured composition

| CSS viewport / fixture | Inspector rectangle | Scroll-body height | Result |
|---|---|---|---|
|1440×900 / normal Heading|x1140 y88,300×780|628px|Four tabs about73px each; no document horizontal overflow or measured field crossing right edge|
|1280×720 / normal Heading|x968 y108,300×568|414px|Overlay; four labels fit; no measured horizontal overflow|
|1024×768 / normal Heading|x712 y108,300×616|462px|Overlay; four labels fit; no measured horizontal overflow|
|1440×600 / normal Heading, corrected final CSS|x1140 y88,300×480|365px|Panel bottom568 within viewport; short-height body available|
|1280×720 / 200% Inspector text|x968 y108,300×568|268px|Tabs reflow2×2 atabout145px each; body scrollHeight1705px; no document horizontal overflow|
|1280×720 / long-name missing-resource Content|same300px overlay width|412px|Long identity wraps; Inspector horizontal overflow false; missing reference differs from failed fetch|

An initial specimen CSS rule applied a100px top offset to the docked panel at short height, pushing its bottom outside the600px viewport. The rule was restricted to the narrow overlay media condition, then remeasured as above. This was a documentation-specimen correction, not an application defect or fix.

The shell scaffolding includes a340px combined left region, illustrative56px topbar and32px bottom bar, plus32px review-only strip. Those heights explain the y88 desktop panel; they are not a claim the whole production shell has been redesigned/verified. Website viewport/zoom controls are schematic; there is no website model to alter in this specimen.

## Observed interaction checks

| Case | Observed result |
|---|---|
|Style tab focused → ArrowRight|Behaviour selected; focus `tab-Behaviour`|
|Then Home|Content selected; focus `tab-Content`|
|Style → Source details → Escape|Dialog closed; focus returned to source trigger|
|Font size `bad` → Image fixture → Heading → Style|Original invalid text restored with `Unapplied input retained for this element…`; simulated committed font still32|
|Escape in restored invalid field|Value32; invalid false; error cleared|
|Role-restricted fixture|Denied-role notice; tab strip hidden; no editable body inputs/selects|
|Mixed headings fixture → Content|`3 selected · 2 editable · 1 locked`; Heading level `Mixed`|
|Long name + missing resource|Full identity wraps; retained binding and explicit missing-field explanation visible|

Native browser clicks/keys were used for the table above; DOM probes read state/geometry. This is a heuristic/prototype walkthrough, not usability testing with users. No claim that ordinary field drafts, all live-update batching, every control, all resource service returns, actual class/token CSS, app permissions or saved output were executed by this specimen.

## Screenshots inspected

- [Normal four-tab composition](design-normal.png),1440×900.
- [200% text and two-row tabs](design-enlarged.png),1280×720.
- [Long name / missing resource in narrow overlay](design-long-narrow.png),1024×768.

## Required implementation verification

P-M07-* preservation cases, T-INS-01–20 and T-II-01–11 remain **specified, not passed by an implemented correction**. Actual history transactions, server save/reopen, conflicting edits, revoked roles, CSS specificity/output convergence, fonts/uploads, shared token writes, resource workspaces and performance need implementation checks. Full screen-reader testing, localized strings, browser zoom distinct from the simulated text-enlargement toggle, every severe short-height combination, and real user task testing remain unrun. The written fallback/acceptance rules define what must happen; this artifact does not certify all combinations.

The previous audit's18 existing files/132 tests and six runtime defects retain their original bounded status. They were not rerun or promoted to evidence that FD-INS-02 is implemented.
