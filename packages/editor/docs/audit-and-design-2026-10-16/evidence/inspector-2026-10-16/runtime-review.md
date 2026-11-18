# Inspector runtime evidence — 2026-10-16

Supporting evidence for PRODUCT-DESIGN-BRIEF.md; no application fixes implemented.

Revision: `19f964d5e7efda2c276a4c185782bb963da605ec`. Running Vite editor: `http://localhost:5050/`, an isolated browser profile using `/tmp/buildrik-inspector-audit-browse.json`. URL had **no siteId** and began with an empty local project. Tests used disposable local elements only, not saved user projects or production records. No publishing, account changes, server saves, application/test-code edits or Figma access. Existing demo `window.__bkComposer` APIs were used to prepare selection/style fixtures and inspect model values; stated UI edits used real browser controls. Thus this is a mixture of prepared-fixture integration checks and observed UI interaction, not an entirely manual end-to-end creation test.

Browser helper initially could not bind/connect through sandbox; scoped escalation was approved, then the running application was accessible. Initial Add clicks were intercepted by two onboarding popovers; dismissing their existing Got it controls made Add usable. This is not recorded as an Inspector defect.

## R-INS-01 — Responsive effective-value mismatch: reproduced

1. Add Heading using the existing Add control.
2. On this disposable element, prepare Desktop `font-size:48px` and Tablet `font-size:32px` using the existing element/style APIs; leave Mobile without a font-size override.
3. Set device to Mobile using `composer.setDevice("mobile")`.
4. Inspect the actual heading DOM `[data-buildrick-id]` and the visible font-size input.

Result: `getComputedStyle(heading).fontSize === "32px"`; Inspector font-size input `48`, unit px, context Mobile. This confirms IFL-01 for this normal-state cascade. No assertion is made about all other responsive/state properties or published output.

Evidence: [Mobile Inspector screenshot](mobile-value-mismatch.png). The screenshot establishes context/input; the browser computed-style read establishes 32px, which cannot be reliably inferred by eye from zoomed pixels.

## R-INS-02 — Multi-link edit targets only primary: reproduced

Prepare two link elements with hrefs `https://example.com/one` and `https://example.com/two`; select both using `selection.selectMultiple`. Open Behaviour through its tab. Visible note: `Edits apply to all 2. One Undo restores all 2.` URL field shows primary value, not Mixed. Fill URL with `https://example.com/updated`, then Tab.

Resulting hrefs: `["https://example.com/updated", "https://example.com/two"]`. Both remain selected. Only primary changed despite the all-target scope promise. This confirms the Link branch of IFL-03 / INS-F01; CMS/classes/interactions and other batch branches remain source-only findings.

## R-INS-03 — Undo restores href, Inspector stays stale: reproduced

Immediately after R-INS-02, invoke the existing history Undo. Model hrefs become `["https://example.com/one", "https://example.com/two"]`, while the visible URL input remains `https://example.com/updated` with unchanged selection. This confirms the Link branch of IFL-05 / INS-F03. Generic attributes and component state require their own runtime cases.

Evidence: [Multi-link Inspector after Undo](multi-link-after-undo.png). Screenshot captures the displayed stale URL; corresponding before/after model values are recorded above.

## R-INS-04 — Columns count/gap revert to Default on reselection: reproduced

Clear selection; add Columns using Add. It initially contains two children. In Inspector select Columns=3 and Gap=24px. The model has 3 children, styles `{gap:"24px"}`, attributes `{}`; fields display `3` and `24px`. Select the test heading, then reselect the same Columns element.

Result: model still has 3 children and gap 24px, but both dropdowns display `Default` (value empty). Confirms INS-F07 read/write mismatch. This check did not reduce columns with user content or verify reload/deletion recovery.

## R-INS-05 — Semantic mixed value not shown: reproduced

Prepare headings H1 and H3 under the same page; select both. Inspector says `2 selected · Headings`, yet Level has H1 `aria-checked=true`; H2–H6 false. The adjacent Text style/Weight can show Mixed, proving semantic Level lacks the equivalent state in this fixture. No level edit was committed. Confirms one branch of IFL-04 / INS-F02; other semantic fields remain unverified.

## R-INS-06 — Rotate edit loses unsupported transform function: reproduced; Undo restores

Prepare a single heading with `transform: translate3d(10px, 20px, 0px) rotate(10deg)`. Open Effects. Focus the existing Rotate range input and press ArrowRight once.

Result: Rotate displays 11 and the saved model transform becomes `rotate(11deg)`. The unrelated translate3d function is removed. Invoke one history Undo: the full original `translate3d(10px, 20px, 0px) rotate(10deg)` string returns. This confirms destructive simplification for this transform; filters, reordered repeated functions, matrices and other unsupported CSS functions need separate tests.

## Current geometry observations

Measurements from the actual shell, with Add open and Inspector open:

| Browser CSS viewport | Inspector width × height | Inspector x/y | Notes |
|---|---|---|---|
| 1440×900 | 300×844 | 1140/56 | Sidebar 340px, canvas column 800px, Inspector docked |
| 1280×720 | 300×596 | 968/112 | Existing narrow-window overlay behavior; not a proposed new layout |
| 1024×768 | 300×644 | 712/112 | Existing narrow-window overlay behavior; not mobile-editor support certification |

`LayoutShell.css` has a 1366px media query governing the overlay; this measurement does not independently validate every overlay/focus state. Viewport restored to 1440×900. No proposed layout was implemented or interactively tested.

Four-tab text-budget probe with current font `500 12px Inter, sans-serif`: Content 45.59px, Style 29.10px, Behaviour 57.80px, Effects 39.96px. Four equal tabs in 300px give roughly 75px each, so English text alone fits without widening. This is only a font measurement, not proof of focus-ring fit, accessibility, localized-label fit or usability at enlarged text.

## Coverage limits

Six bounded defect scenarios reproduced, plus one positive Undo recovery in R-INS-06. No claim of six globally broken subsystems or complete Inspector verification. Save/reopen against the server, actual user roles/revocation, collaboration, offline/conflict races, resource pickers requiring authentication, preview/published output, full keyboard/screen-reader checks and complex-project performance were not verified. Local fixtures may persist only in this isolated browser's local storage; no real project was touched.
