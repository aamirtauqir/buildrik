# Batch 01a — Heading selection and Style

> **SUPERSEDED / historical — do not design from. Current specs: panels/00–25 + design-audit-2026-10-18.** *(R-1018, D1-6/D1-22; owner decisions 2026-10-18)*

> Superseded specifics *(R-1018)*: tabs/placement rows (H05, Heading in Style) → FD-INS-02 INS-D01 four tabs, Heading level in Content (T6-1); "Size preset" → **Font-size token** (SC-11, D1-8/T6-2); unit change without conversion → INS-D11 converts (T6-3); 96/8/164 row numbers → FD-INS-02 row anatomy 88/8/fill, row 32 (T6-9); rail 60 + drawer 280 → GEO-01 rail 56 + drawer 284 (T6-11). The H-row census remains useful as history.

2026-10-16 · DESIGN ONLY · C2 panel regrouping · designer/freelancer.

Status: PARTIALLY VERIFIED — Heading/Typography proposal and scoped visual/source QA complete; prototype playback and full unchanged-surface verification remain open. This record covers one unlocked, unbound heading at Desktop / Base. The shared controls retain their existing contracts; responsive/pseudo design is 01b, mixed/locked/conflict design is 01c, and broad panel composition is 01d. No application changes, saved-content writes or deployment are authorized here.

## Evidence and applicability

- Source: main @ `19f964d5e7efda2c276a4c185782bb963da605ec`, unchanged from audit baseline.
- Historical visual: original Figma `g4GzQFqzNYz5sosz1QtZXC`, AS-IS02 `8283:2`, `evidence/figma-as-is-screens/02.png`. Historical fixture is different from the current site; its content/counts do not establish regressions.
- Current: `http://localhost:3000/edit/cmv8uviql000bucorbmjjol97`, Home, heading `el-mva2l3zg-dz8pwn1yla`, H3, “Tom & Jerry”, displayed size18.72px / line-height28.08px / weight700. Layer label currently contains `&amp;`; Inspector fallback name is Heading. Do not silently fix saved names/content in a design comparison.
- Captures: `evidence/batch01a-current-heading-1280.png`, `batch01a-current-layers-1280.png`, `batch01a-current-advanced.png` and associated snapshots. 1280×720, browser100%, canvas100%, Desktop/Base; authored width is independent of available canvas.
- Canvas click and Layers row selected the same existing ID. Advanced Typography was opened without changing values. Existing session credentials were reused only for localhost.
- Selection, Inspector, Layers, type semantics, typography, tokens, menus, history/write boundaries and panel geometry are applicable. CMS/Components/Assets are related destinations, not redesigned in this slice. No publication or service delivery is tested.
- No Code Connect mappings found for these controls. At discovery, the new file contained planning boards only. Library searches found no compatible Buildrick Input/Section or bk-ink variables. This batch adds five local reusable controls, eighteen scoped code-token variables and five Inter text styles. The discovered remote Body style was not used; no unrelated community visual system was substituted.

Only Heading and Typography placement/copy are proposed changes. Surrounding chrome, canvas content, lower sections and unchanged pickers are contextual representations, not a replacement specification for those modules. Implementation must keep their complete existing components and handlers. Historical/current fixtures differ; abbreviated canvas and Layers imagery does not authorize deleting any saved content.

## Issues and chosen integration

| ID | Evidence and user problem | Owner / scope | Decision |
|---|---|---|---|
| B01-01 | `textBodies.tsx:TextStyleRow` only writes `font-size` to a Brand token. “Text style” under Heading can imply font family/weight/colour will change too. | Selected element font-size; token definition remains Brand. Presentation/copy only. | Move this existing selector into Typography immediately before Font size; label **Size preset**, with one helper “Links font size only.” Preserve Custom and all token choices. No new full text-style engine. |
| B01-02 | Historical/current heading blocks mix document heading level with visual size binding. | Element tag versus style property. | Keep **Heading level** and **Edit text on canvas** in Heading. Group visual font controls together in Typography. |
| B01-03 | Current Edit text on canvas is a small trailing text link. | Existing inline-edit command. | Full-width outlined action inside Heading, same command/target; no secondary textarea. |
| B01-04 | Advanced Typography has nine real controls; plain “More settings” does not identify its content. | Typography local disclosure. | Label **Advanced typography · 9**, expanded label **Less typography**. Preserve all nine controls, values and per-section expansion behavior. |
| B01-05 | 300px Inspector uses108px label +160px field within268px inner width. Long labels compete with field details. | This slice’s rows, not global chrome tokens. | Proposed96px label +8px gap +164px field with16px padding. Wrap multi-word labels;32px rows and28px controls. Do not shrink typography to fit. |

Alternatives considered: keep current grouping and add help only (least disruption, leaves size binding separate from its value); merge Heading and Typography into one large section (reduces boundaries but obscures HTML level versus visual styling); chosen regrouping preserves section identities and places size binding next to its edited value. No new workspace or tab is justified for this task. The relocation is heading-only: Text/Link/Label callers of the shared TextStyleRow retain their current access until their own reviewed slice. Expected clarity benefit is a design hypothesis, not user-tested evidence.

## Panel and context specification

- Current measured1280 geometry: Inspector x968,y112,w300,h596; header72; tabs32; context28; body464. Proposed outer geometry/header/tabs/context unchanged. Body remains the single vertical scroll owner; full content exists below the fold.
- Normal1440×900 proposal uses x1128,y112,w300,h776;1280×720 uses measured geometry;1440×600 stress case uses x1128,y112,w300,h476. These are mockup/test configurations, not newly declared minimum support.
- Rail60 + drawer280 + Inspector300 reserve640px. Gross center is640 at1280 and800 at1440 before current floating gutters. No change to page width, breakpoint or zoom from this regrouping.
- Width min/default/max300 for this slice; no invented resize handle. Hide/restore continues through existing Inspector control/shortcut. Expanded left workspace is deferred to01d; do not claim this slice verifies it.
- Heading body: six level segments, then existing inline edit action. Typography: Font, Size preset, helper, Font size, Line height, Weight, Colour, Align, advanced disclosure. All subsequent existing sections remain in existing order with existing values, eligibility and open/closed preferences.
- Long layer names: preserve editable name and existing Double-click to rename tooltip, keep AI/menu/hide reachable; no saved name migration. Current selection remains identified by stable ID, not the displayed label.
- Existing header/status marks, tabs and State:Base remain. No duplicate breakpoint selector, shared-class editor or fictitious save button is introduced.

## Preservation census and editing contracts

All rows refer to current source, not just screenshots. “Unchanged” means retained through the same existing component/handler; it does not mean independently runtime-tested in every state.

| ID | Existing capability / exact options | Proposed location and behavior | Evidence / verification |
|---|---|---|---|
| H01 | Canvas selection and Layers selection | Same heading ID; Inspector reflects same target. Clicking another element changes target explicitly. | `useComposerSelection`, `LayerTreeItem`; both entries observed. |
| H02 | Breadcrumb page/ancestors/current | Header unchanged: page clears selection, ancestor selects that ancestor. | `InspectorHeader.pathFor`; source verified. |
| H03 | Element rename | Header unchanged; double-click/Enter/F2 edit, Enter/blur commit trimmed name, Escape cancel; Layers/canvas use same writer. | `ElementNameField`, `layersPersistence`; no rename executed. |
| H04 | AI, element menu, hide Inspector | Preserve header doors, labels and shortcut; no AI execution. | `InspectorHeader`; menu inspected separately. |
| H05 | Style/Behaviour/Effects tabs | Same IDs/order; same-type selection retains tab, different type starts Style; preserve scroll memory. | `ProInspector`, `InspectorTabContent`. |
| H06 | State, breakpoint and override resets | Existing context row retained; full pseudo/breakpoint redesign deferred01b. | `ContextRow`, `useFieldOverrides`; Base shown only in this slice. |
| H07 | Heading level H1/H2/H3/H4/H5/H6 | Heading → Heading level. Writes tag, not font size; one existing heading-level transaction. | `textBodies.tsx:LevelRow`; current H3 observed; mutation not run. |
| H08 | Text style: Custom + registry rows | Typography → Size preset. Existing Heading1/2/3, Sub-heading, Body large, Body text, Caption, CaptionXS fixture options; registry remains dynamic. Select token binds font-size only; Custom converts a resolvable token to its resolved size; if resolution fails, the unresolved token value remains intact. | `TextStyleRow`, `typeStyleRows`; options observed. |
| H09 | Edit text on canvas | Heading full-width action; exact selected ID via UI_INLINE_EDIT_REQUEST; existing inline editor remains owner. No extra text property. | `EditTextRow`; existing toolbar retains18 controls: block format (Paragraph/H1–H6), size (10/13/16/18/24/32/48px), Bold/Italic/Underline/Strike, bullet/numbered lists, Left/Center/Right/Justify, decrease/increase indent, text/highlight colours, link (URL/Remove/Apply), clear formatting. Enter/blur/left click outside commits sanitized changed content; Escape restores original; toolbar clicks preserve text selection. Source: RichTextEditor, useCanvasInlineEdit. No content mutation executed. |
| H10 | Font family picker | Typography Font unchanged; search, All/Sans Serif/Serif/Display/Monospace categories, uploaded/system/Google groups and existing selected marker retained. | `FontPicker`, `FontPickerDropdown`; UI opened, no font applied. |
| H11 | Font picker Manage site fonts | Same Site fonts entry via `openSiteFonts`; keep selected heading and return context. Do not treat font upload as local style edit. | `FontPicker.tsx:44`; manager return is preserved contract, not replayed here. |
| H12 | Font size number + stepper + unit | Next to preset; px/em/rem/%/vw, existing value/default16px and token resolution. Explicit numeric edit replaces size binding. | `FontControls`, `InputControls`; no value write executed. |
| H13 | Line height | px/unitless×/em/%/normal, placeholder1.5; preserve actual resolved28.08px fixture display. | `FontControls`; options observed. |
| H14 | Weight | Default +100/200/300/400/500/600/700/800/900. | `FONT_WEIGHTS`, `SelectRow`; same discrete write. |
| H15 | Colour | Keep swatch, hex entry, token binding chip, picker and supported source actions. Preserve raw/custom token values; do not imply computed colour resolution is complete. | `ColorInput`, `ColorFillPopover`; source-backed, picker states outside changed layout. |
| H16 | Alignment | Left/Center/Right only. No invented Justify. | `FontControls`; same ButtonGroup/discrete history. |
| H17 | Advanced disclosure | More settings9 → Advanced typography9; Less → Less typography. Hide/show does not clear stored values. | `TypographyControls`, `useAdvancedSettings`. |
| H18 | Text transform | none/uppercase/lowercase/capitalize. | `TypographyControls`, unchanged property/options. |
| H19 | Text decoration | none/underline/line-through/overline. | Same. |
| H20 | Letter spacing | px/em/normal. | Same InputWithUnit; blank and token values preserved. |
| H21 | Word spacing | px/em/normal. | Same. |
| H22 | Font style | normal/italic. | Same. |
| H23 | White space | Default/normal/nowrap/pre/pre-wrap/pre-line. | Same SelectRow. |
| H24 | Word break | Default/normal/break-all/keep-all/break-word. | Same. |
| H25 | Text indent | Existing InputWithUnit default units px/%/em/rem/vw/vh/auto. | Same; no new clamp. |
| H26 | Vertical align | Default/baseline/top/middle/bottom/sub/super. | Same. |
| H27 | Field source/reset markers | Preserve token/override dots, context-specific reset and read-only refusal; no new generic reset that overwrites inherited values. | `FieldDot`, `InspectorFieldContext`, `useFieldOverrides`; detailed states01b/c. |
| H28 | Section disclosure/Alt-click behavior | Keep exact section IDs/preferences and keyboard semantics; label change cannot reset preferences. | `useInspectorSections`, `Section`, `InspectorTabContent`. |
| H29 | Remaining Style sections | Existing conditional Component/Layout and Size/Spacing/Fill/Border/Text inside retained unchanged with full controls/menus/values; not substituted by placeholder summaries in implementation. | `sectionOrder`, registry predicates; this slice does not redesign their internals. |
| H30 | Duplicate / Copy style / Paste style | Existing element menu and shortcuts unchanged; Paste disabled reason when clipboard empty. | `ELEMENT_ACTIONS`, `INSPECTOR_MENU`; no action executed. |
| H31 | Apply style to all matching headings | Existing menu with page-local peer count and confirmation. Same exact heading tag matching; never silently global. | `findStylePeers`, `ApplyStyleDialog`; no apply executed. |
| H32 | Reset style / Save as component / Lock or Unlock / Delete | Existing menu entries, eligibility, confirmation/history contracts unchanged; no destructive actions run. | `elementActions`; component flow later05, lock01c. |
| H33 | Canvas context actions / inline toolbar | Keep duplicate/delete/more, supported CMS and interaction doors and existing keyboard actions. Not replaced with Inspector-only alternatives. | `elementActions`, canvas UI; unchanged. |
| H34 | Save/conflict/history/selection transitions | Engine remains sole document writer. No new Save/Cancel bar. Locks and save conflicts refuse writes; selection changes flush pending original-target write before context swap. | `useStyleHandlers`, `commandOperations`, `ProInspector`; runtime mutation/reopen NOT RUN. |

### Shared control behavior retained

Numeric fields: plain numbers update live; typed supported units/tokens parse on Enter/blur; empty clears property; unreadable input stays visible with “Enter a valid number. Choose the unit separately.” and retains last valid element value. Up/Down ±1, Shift±10; no invented range limits. Unit changes preserve number and change the stored unit (no implicit conversion). Escape restores focus-time value; untouched blur must not unbind a token. Token-bound steppers do not write. These are `InputControls` contracts, not newly tested claims.

Style handler:50ms write interval, existing history coalescing; discrete selections flush pending writes and their own history boundary. Changes stay on original stable target, selected breakpoint and pseudo state. Current Base/Desktop style is selected element data; token definitions remain shared. Figma navigation must never represent an actual save/deployment result.

Selection/disclosure/header navigation remains UI state. Existing section preferences are keyed by element type/section under `buildrick-inspector-sections-v3`; no new project fields. Invalid input/target deletion/loading/conflict must retain existing safeguards; full conflict/multi/locked representations are explicitly next slice01c.

## Required design examples and checks

- Main1280 and1440 with Layers, selected heading, all header doors and grouped Heading/Typography.
- Short-height1440×600 showing the same scroll owner and reachable controls.
- Advanced typography content showing all nine controls and every value row; scroll states, not removed controls.
- Numeric error, existing element menu and inline-edit entry/return represented or linked to exact unchanged source contract. Font picker is an unchanged surface; keep its search/groups/management and existing bounds.
- Match new main mockup with the current fixture values; external annotations distinguish omitted offscreen canvas content from deleted product data.
- Comparative review checks H01–H34 destinations and all six heading levels,15 typography properties (six core plus nine advanced), preset options, units, menu gates and existing return paths.
- Prototype links demonstrate named transitions only. Arbitrary text input, engine writes, undo/redo, font loading, save/reopen and full keyboard behavior require later application QA; do not label prototype navigation as those checks.

## QA record

New file: `6yvgev9dRXrSLPluWkjDoz`, page `6:8080`. [Three-way comparison and all states](BATCH-01A-REVIEW.html).

| Example | Figma node | Final capture |
|---|---|---|
| Main1280×720 | [6:8134](https://www.figma.com/design/6yvgev9dRXrSLPluWkjDoz?node-id=6-8134) | evidence/batch01a-proposed-normal.png |
| Wide1440×900 | 6:8611 | evidence/batch01a-proposed-wide.png |
| Advanced, scrolled | 6:9089 | evidence/batch01a-proposed-advanced.png |
| Short1440×600 | 6:9649 | evidence/batch01a-proposed-short.png |
| Invalid number | 6:10127 | evidence/batch01a-proposed-error.png |
| Inline entry | 6:10605 | evidence/batch01a-proposed-inline.png |
| Element menu | 6:11085 | evidence/batch01a-proposed-menu.png |
| Font-picker reference excerpt | 6:11581 | evidence/batch01a-proposed-font.png |

PASS, scoped: H01–H34 source/destination mapping; six heading levels, six core and nine advanced typography properties, size preset, eighteen inline-toolbar controls and existing menu commands accounted for. Independent reviewer `audit_spec_review` found no unsupported feature expansion. Their corrections were applied: exact font categories, unresolved-token fallback, heading-only relocation boundary, matching #1a1a1a swatch, decoration treatments and explicit font/inline limitations. Primary visual review also corrected segment wrapping, separate margin sides, menu stacking and missing canvas duplicate/delete/more actions. All eight final screenshots were inspected after these corrections.

PASS, structural at the initial checkpoint: eight editable top-level frames;314 component instances,1255 Auto Layout containers,1173 text nodes and zero image fills inside screens. Inter Regular/Semi Bold/Bold only. Eight separate Style scroll viewports retain a single body scroll owner per screen. Short-height viewport344px contains1102px body with758px overflow through Border; no lower section was removed to make the first viewport fit.52 authored navigation links target existing frames. These are structural checks, not playback results. Ledgers: `evidence/batch01a-figma-ledger.json`, `batch01a-figma-fix.json`, `batch01a-final-structure.json`.

PASS, safe current-runtime observations: Canvas and Layers select the same heading ID; Advanced, font picker and element menu open. No typography values, content or saved project data were changed. The error and inline proposal states are source-backed representations, not runtime mutation tests.

NOT RUN / not fully represented: Figma prototype playback, full keyboard/focus/escape loop, long-name/long-value stress frames, full font-result scrolling and uploaded-font state, colour/token picker visual states, lower-section exhaustive visuals, save/reopen/Undo/redo, actual font loading and style writes. Font screenshot shows one Google font from26 results; full results and conditional Uploaded group remain required. Inline Paragraph/10px are existing uncontrolled select defaults, not verified computed formatting. Prototype links between differently sized examples are demonstrations, not an application viewport-change contract. Responsive/pseudo and mixed/locked/conflict cases remain01b/c; expanded panels01d. Historical fresh visuals95/96/98/99 remain unavailable and unrelated to this slice.

No full-editor preservation, implementation, accessibility or end-to-end PASS is claimed. The core regrouping is specified for design review; the batch retains PARTIALLY VERIFIED status until the applicable open design checks are closed.

## Frontend handoff and acceptance queue

Implement only after separate implementation authorization. Reuse existing controls; do not rebuild the surrounding shell from these frames. In `textBodies.tsx`, retain LevelRow/EditTextRow and relocate heading-only TextStyleRow to Typography using existing handlers; other Text/Link/Label callers retain their access. Preserve section IDs, eligibility, values, token identifiers, context, history boundaries and registry ordering. Update disclosure wording and row layout locally; no schema migration or global token changes.

1. Before implementation: replay prototype entry/return and short-height scroll, then add/review long-name and long-value examples. Keep full font/colour surfaces explicitly unchanged or review their complete states before modifying them.
2. On a disposable implementation fixture: select the same heading from Canvas and Layers; switch target/type/tab; verify scroll memory and the original-target pending-write flush.
3. Exercise H1–H6 without changing font size; choose every dynamic size preset; check Custom with resolved and unresolved tokens, explicit number edits and untouched blur.
4. Exercise numeric live/commit/cancel/invalid/unit/stepper states and each of the15 typography properties. Expand/collapse all nine advanced fields without clearing values.
5. Open/close font and colour pickers, manage fonts then return to the same heading; verify full results, uploaded group when present, keyboard focus and selected marker.
6. Enter inline editing, use each supported command, retain selection through toolbar interaction, Escape cancel and commit changed sanitized content; verify one content transaction and save/reopen on that fixture.
7. Exercise menu eligibility and confirmation paths, then Undo/redo and responsive/pseudo/locked/conflict restrictions in their relevant batches. Do not infer these results from mockups.

Essential corrections: B01-01–04 and preservation/state contracts. Visual polish: B01-05 row alignment and action treatment. Optional new product features: none proposed in this batch.

## Subsequent checkpoint — wireframing focus

User redirected work to static wireframes, then authorized continuous progression through stages. Current review page is25:1520; WF01 25:1521, WF02 25:2028, WF03 25:2618. Earlier colour studies remain exploratory, not approved visual design. All three wireframes have zero prototype reactions.

Before that direction change, nine Figma navigation cases passed (evidence/batch01a-playback-results.json): Advanced entry/return, menu entry/Escape, font entry/Escape, inline entry/inner click/Escape. Initial browser loading recovered with a separate graphics-enabled browser. No application data edits were exercised. Long-content fixture22:1226 and static short-scroll-end22:1733 were added; the layer-label wrap was corrected. Actual short-screen scroll playback was not completed before the user redirected focus. These specific results supersede the earlier blanket prototype NOT RUN statement; other outstanding checks remain.

Clarification: ElementNameField currently exposes Double-click to rename, not a full-value tooltip. A different selected element resets pseudo-state to Base. Bulk ContextRow reset conflict safety is not established; the blanket conflict-safe assumption must not be extended to that path. Source review for01b is recorded separately.
