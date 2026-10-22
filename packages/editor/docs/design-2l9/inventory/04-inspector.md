# Gap inventory · 04 Inspector (page `3:5`, Figma page 04)

Lane L-B. Read-only pass, zero Figma calls. Source: `docs/design-2l9/dump/page-3-5.json` (313 frames, all `active` in `boards-2l9.json`) compared with `packages/editor/src/editor/inspector/` at `feat/design-2l9`. Paths below are relative to `packages/editor/` unless noted. Per-node rows: `04-inspector.json`.

**Counts:** drift 139 · missing 87 · match 1 · blocked:owner-class-first 86 (313 total; 46 rows carry `inheritsFrom`).

**Cross-cutting findings (these explain most rows):**
- **Tab chassis.** Every board draws four tabs: **Content · Style · Behavior · Effects**. The code has three: Style · Behaviour · Effects (`src/editor/inspector/sections/registry/_shared.tsx:46`). There is no Content tab. Content-type controls are spread over Style (type block, `config/sectionOrder.ts:17`) and Behaviour (Fields, CMS binding, Attributes, `config/sectionOrder.ts:28`). The board also spells it "Behavior", not "Behaviour". Almost every drift row inherits this.
- **Context line.** On Content tabs the board reads "Content · All breakpoints"; on Behavior tabs it reads "Behavior · All breakpoints". Style and Effects read "Editing Desktop · Default state". The code shows a "State: Base" chip on Style and Effects only (`components/ContextRow.tsx`). This header/context row is **phase1** (Task 1.4). Lane rows note it but do not re-analyse it.
- **Content-tab rows the code lacks everywhere:** Semantics (Tag, ID), Conditions, and "Advanced attributes · N set".
- **Precision and safety model.** The boards show inline invalid drafts ("Last applied: …"), preserved custom expressions, action toasts ("… · Undo"), and named consequence confirms. Few of these exist. They recur in the Forms, Precision, Behavior, Instance and States families.
- **Shell rows tagged phase1:** S02 (load-failed, Task 1.6) and S31 (header breadcrumb, Task 1.4). S30 ("Show Inspector") is shell chrome in `StudioPanels.tsx`.

## Families

### Refinement

| archetype | example nodeIds (≤3) | count | code surface (file:line) | status | notes |
|---|---|---|---|---|---|
| Inspector context specimens | `36:2` | 1 | `src/editor/inspector/sections/registry/_shared.tsx:46` | drift | Board Content·Style·Behavior·Effects; code has no Content tab; page/multi contexts differ (spec specimen) |
| Color scope and safe commits | `39:9114` | 1 | `src/editor/inspector/shared/ColorFillPopover.tsx:1` | drift | Board splits "Update shared Brand color" vs "Use on selected element"; popover has no such split. L-D overlap |

### Forms

| archetype | example nodeIds (≤3) | count | code surface (file:line) | status | notes |
|---|---|---|---|---|---|
| Form field list | `156:716` F01, `156:4279` F07, `159:6780` F21 | 12 | `src/editor/inspector/sections/FormFieldsSection.tsx:159` | drift | Fields sits in Behaviour (config/sectionOrder.ts:29), board Content; no reorder hint/Move up·down menu; Semantics/Conditions rows missing |
| Field detail | `156:1316` F02, `156:2506` F04, `156:3684` F06 | 7 | `src/editor/inspector/sections/FormFieldsSection.tsx:172` | drift | Label row writes the placeholder attr; no separate Placeholder, Name (submission key), Default value, Validation rows |
| Duplicate submission key | `156:1911` F03 | 1 | — | missing | No submission-key uniqueness check or retained-draft error |
| Legacy Password warning | `156:4859` F08 | 1 | — | missing | No plain-text Password warning; type block still offers Password as a type (sections/typeBlock/bodies/formBodies.tsx:33) |
| Unlabeled field repair | `156:5458` F09 | 1 | — | missing | No accessible-label repair for existing unlabeled fields |
| Add field types | `156:3109` F05 | 1 | `src/editor/inspector/sections/FormFieldsSection.tsx:31` | drift | Code 6 types (Text, Email, Phone, Number, Date, Long text); board 13 incl. Select, Checkbox, Radio, Switch, Slider, Time, Color, Submit |
| Form settings | `156:6055` F10, `156:7819` F13, `156:10131` F17 | 4 | `src/editor/inspector/sections/FormAfterSubmitSection.tsx:169` | drift | Board "Form settings · This form", "Applies on next publish" tags, status row + "Saved separately…" note; code After submit, no status row |
| Form settings saving | `156:6643` F11 | 1 | `src/editor/inspector/sections/FormAfterSubmitSection.tsx:214` | drift | Code "Saving…" note; board "Form settings status · Saving…" row |
| Form settings failed save | `156:7230` F12 | 1 | `src/editor/inspector/sections/FormAfterSubmitSection.tsx:156` | drift | Code shows raw error; board "Couldn’t save — your message is still here" + Retry |
| Form settings offline | `156:8406` F14 | 1 | — | missing | No offline state disabling service controls while Content stays reachable |
| Recipient requires Admin | `156:9001` F15 | 1 | `src/editor/inspector/sections/FormAfterSubmitSection.tsx:156` | drift | Code learns Admin-only from a FORBIDDEN save; board discloses up front, field disabled |
| Form settings loading | `156:9584` F16 | 1 | `src/editor/inspector/sections/FormAfterSubmitSection.tsx:173` | drift | "Loading…" vs board "Loading form settings…" |
| Redirect page picker | `156:11319` F19, `159:8959` F26, `159:9710` F28 | 3 | — | missing | Redirect is a free-text CommitRow (FormAfterSubmitSection.tsx:195); no shared page picker, URL check, atomic save |
| Redirect URL invalid draft | `159:8570` F25 | 1 | — | missing | No "Enter a complete https:// or http:// URL" validation with retained draft |
| Redirect saving atomically | `159:9347` F27 | 1 | — | missing | No pending state for page+action atomic save |
| Viewer role disclosure | `157:105715` F20 | 1 | `src/editor/shell/ViewerRoleNotice.tsx:27` | match | Copy matches board; owned by L-F |
| Field type lossless change | `170:121692` F29, `170:122069` F30 | 2 | `src/editor/inspector/sections/FormFieldsSection.tsx:174` | drift | Type select swaps immediately; no Field type menu or "applied · Undo" toast |
| Select→Text data-loss conversion | `170:122442` F31, `170:122820` F32, `170:123180` F33 | 6 | — | missing | Field list has no Select/options rows; no data-loss confirm (BD-29, owner-approved 2026-10-19) |
| Forms handoff note | `156:11902` | 1 | `src/editor/inspector/sections/FormFieldsSection.tsx:159` | drift | Handoff/acceptance board for F01–F19, not a UI surface |
| Visitor form states (published) | `160:8757`, `160:8779`, `160:8801` | 15 | — | missing | Published form posts to dashboard app/api/public/forms/[siteId]/[formBlockId]/route.ts which returns separate HTML pages (:19,:148); no inline states |

### Precision

| archetype | example nodeIds (≤3) | count | code surface (file:line) | status | notes |
|---|---|---|---|---|---|
| Text content and semantics | `161:8480` I01 | 1 | `src/editor/inspector/sections/typeBlock/EditTextRow.tsx:41` | drift | "Edit text on canvas" exists but in Style type block (config/sectionOrder.ts:17); Tag/ID Semantics, Conditions, Advanced attributes rows missing |
| Text Style tab | `161:8940` I02, `161:10007` I04 | 2 | `src/editor/inspector/sections/typography/FontControls.tsx:62` | drift | Board Width mode/Height mode rows vs Fixed/Fill/Hug (sections/SizeSection.tsx:165); "Background" vs code "Fill"; "2 set" summaries |
| Invalid unit draft | `161:9467` I03 | 1 | — | missing | No inline "Enter a non-negative number… Last applied: 24 px"; draft not retained |
| Tab-switch guard | `161:10541` I05 | 1 | — | missing | No "Unapplied font size" Keep editing / Revert and switch guard |
| Unit menu | `161:11006` I06 | 1 | `src/editor/inspector/shared/controls/InputControls.tsx:220` | drift | Generic unit list px % em rem vw vh auto; board property-specific list + conversion note |
| Unit conversion | `161:11470` I07 | 1 | — | missing | No px→rem conversion on unit change |
| Custom expression preserved | `161:12005` I08 | 1 | — | missing | calc() not shown as "Custom value · Preserved as authored" |
| Effects compound values | `161:12525` I09 | 1 | `src/editor/inspector/sections/effects/ShadowSection.tsx:46` | drift | Shadow Outer/Inner rows vs layered list; Filters do not show "Authored value" custom compound (effects/FiltersSection.tsx:23) |
| Filter expression edit | `161:13037` I10, `161:13481` I11 | 2 | — | missing | No exact-expression filter editing that keeps sequence |
| Precision handoff note | `161:17404` | 1 | `src/editor/inspector/sections/interactions/index.tsx:131` | drift | Handoff/acceptance board for I01–I19 |

### Behavior

| archetype | example nodeIds (≤3) | count | code surface (file:line) | status | notes |
|---|---|---|---|---|---|
| Visibility + Interactions empty | `161:13919` I12, `161:15688` I16, `271:130019` G19 | 4 | `src/editor/inspector/sections/VisibilitySection.tsx:52` | drift | Board "Show on these devices", data-conditions note, "Plays on all breakpoints", "No interactions yet"; tab label Behavior vs code "Behaviour" |
| Hidden on live breakpoint note | `161:14383` I13 | 1 | — | missing | No "Hidden on the live Desktop page… stays visible here" note |
| Add interaction presets | `161:14772` I14, `271:129231` G17 | 2 | `src/editor/inspector/sections/interactions/AddInteractionPanel.tsx:127` | drift | Code trigger groups under "Choose Trigger"; board presets first, then "Choose a trigger ›" |
| Interaction editor | `161:15179` I15, `271:129605` G18 | 2 | `src/editor/inspector/sections/interactions/InteractionEditor.tsx:144` | drift | Board Trigger/Effect/Animate/Repeat/When rows, Play/More…, "Interaction added · Undo" toast |
| Interaction preview playback | `161:16082` I17 | 1 | — | missing | No Play/Stop canvas preview |
| Interaction reduced motion | `161:16511` I18 | 1 | — | missing | No reduced-motion disclosure |
| Interaction missing target | `161:16940` I19 | 1 | — | missing | No missing-target fallback state |
| Interaction actions menu | `165:17822` I20, `165:19449` I24 | 2 | `src/editor/inspector/sections/interactions/InteractionEditor.tsx:195` | drift | Inline Disable/Delete buttons; board "Interaction actions" menu Duplicate/Disable/Delete |
| Interaction disabled | `165:18272` I21 | 1 | `src/editor/inspector/sections/interactions/InteractionEditor.tsx:195` | drift | Disable exists; board keeps config visible with disabled marker |
| Interaction deleted + Undo | `165:18662` I22, `165:19056` I23 | 2 | `src/editor/inspector/sections/interactions/InteractionEditor.tsx:203` | drift | Delete exists; no "Interaction deleted · Undo" toast |
| Add interaction on locked target | `271:131163` G22 | 1 | `src/editor/inspector/components/StatusLine.tsx:46` | drift | "Locked — unlock to edit"/Unlock copy matches; no "No interaction was added" note; Selector row is class-first |

### Instance

| archetype | example nodeIds (≤3) | count | code surface (file:line) | status | notes |
|---|---|---|---|---|---|
| Instance identity block | `241:16522` IC01 | 1 | `src/editor/inspector/sections/ComponentRow.tsx:114` | drift | Code "Component" section in Style with "Edit master"; board block above tabs: library·version, Variant, Edit main component ›, Reset · N overrides, Detach |
| Reset to main confirm | `241:17060` IC02 | 1 | `src/editor/inspector/sections/ComponentRow.tsx:177` | drift | Confirm copy "Overrides on this instance will be discarded." vs board consequence list |
| Reset disabled with reason | `241:17608` IC03 | 1 | — | missing | No disabled Reset with "No overrides to reset" |
| Variant unavailable | `241:18146` IC04 | 1 | — | missing | No missing-variant state |
| Instance breakpoint override signals | `241:18683` IC05 | 1 | `src/editor/inspector/shared/controls/OverrideDot.tsx:45` | drift | Override dot exists; board section count "2 overrides", "Remove Tablet override", "Falls back to Desktop" missing |
| Detach without dialog | `241:19230` IC06 | 1 | `src/editor/inspector/sections/ComponentRow.tsx:169` | drift | Code confirms detach in a dialog; board applies directly with "detached · Undo" toast |
| Instance handoff note | `241:19772` | 1 | `src/editor/inspector/sections/ComponentRow.tsx:114` | drift | Handoff board for IC01–IC06 |

### Composite

| archetype | example nodeIds (≤3) | count | code surface (file:line) | status | notes |
|---|---|---|---|---|---|
| Tabs pair relationships | `245:36832` C01, `245:37366` C02, `245:37877` C03 | 6 | — | missing | tabs is a plain container (src/shared/constants/elementCapabilities.ts:171); no pair/relationship UI |
| Modal trigger/dialog | `245:39899` C07, `245:40398` C08, `245:40932` C09 | 8 | — | missing | No modal trigger↔dialog link, local insertion or close policy UI |
| Table structure | `245:42929` C13, `245:43495` C14, `245:44049` C15 | 4 | — | missing | table is a plain container (elementCapabilities.ts:173); no rows/cols/caption/merged-cell UI |

### Advanced style

| archetype | example nodeIds (≤3) | count | code surface (file:line) | status | notes |
|---|---|---|---|---|---|
| Children layout + placement | `247:21216` A01 | 1 | `src/editor/inspector/sections/layout/index.tsx:52` | drift | Board "Children layout"/"Placement"/"Advanced layout" groups, Row/Column gap, Align lines; code one "Layout" section |
| Grid tracks + item placement | `247:21762` A02 | 1 | `src/editor/inspector/sections/layout/GridControls.tsx:53` | drift | Code Columns count only; board tracks + item placement |
| Advanced layout + size constraints | `247:22310` A03 | 1 | `src/editor/inspector/sections/layout/OverflowVisibilityControls.tsx:72` | drift | Overflow/Box sizing exist; Float/Clear and grouped Size constraints differ |
| Spacing tokens + flex item | `247:22853` A04 | 1 | `src/editor/inspector/sections/layout/ItemControls.tsx:97` | drift | Grow/shrink exist; board "Flex item" group + spacing-token picker differ (SizeSection.tsx:95) |
| Full typography + text inside | `247:23404` A05 | 1 | `src/editor/inspector/sections/typography/TypographyControls.tsx:27` | drift | Rows exist; board grouping/labels differ ("Text inside" registry/text.tsx:120) |
| Gradient preservation + image fill | `247:23966` A06 | 1 | `src/editor/inspector/sections/BackgroundSection.tsx:210` | drift | Two-stop Color 1/2 only; no 3-stop "Custom gradient" preservation; image options exist (:346) |
| Borders, corners, outline | `247:24493` A07 | 1 | `src/editor/inspector/sections/BorderSection.tsx:85` | drift | Per-side borders/corners/outline grouping differs from board |
| Shadow/transform/transition lossless | `247:25026` A08 | 1 | `src/editor/inspector/sections/effects/TransformMotionSection.tsx:45` | drift | Transform/Transition rows exist; multi-layer authored shadow not preserved (ShadowSection.tsx:46) |
| Advanced effects authored values | `247:25554` A09 | 1 | `src/editor/inspector/sections/effects/EffectsAdvancedSection.tsx:52` | drift | Cursor/Blend/Text shadow rows; board shows authored values read-only/editable |
| Legacy CSS animation conflicts | `247:26063` A10 | 1 | `src/editor/inspector/sections/interactions/ElementAnimationRow.tsx:19` | drift | Animation row exists; no legacy-trigger note or property-conflict warning |
| Native attributes + protected keys | `247:26594` A11 | 1 | `src/editor/inspector/sections/attributes/AttributesSection.tsx:41` | drift | Attributes in Behaviour tab; board Content › Semantics + "Custom attributes", data-bk-id protected note |
| Semantic tag conversion | `247:27113` A12, `247:27602` A13 | 2 | — | missing | No "Change semantic tag" impact review / one-Undo conversion |

### Batch

| archetype | example nodeIds (≤3) | count | code surface (file:line) | status | notes |
|---|---|---|---|---|---|
| Batch eligibility + mixed | `247:28097` B01 | 1 | `src/editor/inspector/components/MultiSelectBar.tsx:11` | drift | Mixed detection exists; no "2 of 3 eligible", locked exclusion, per-target Inspect rows |
| Batch progress maximum rejection | `247:28584` B02 | 1 | — | missing | Progress Value/Maximum single-target only (sections/typeBlock/bodies/widgetBodies.tsx:176) |
| Batch progress independent maxima | `247:29083` B03, `251:77000` B06 | 2 | — | missing | No per-target maxima batch write/Undo result |
| Batch geometry eligibility | `247:29578` B04 | 1 | — | missing | No zero-property no-op disclosure |
| Same value, different sources | `247:30075` B05 | 1 | — | missing | No multi-source token disclosure for mixed selection |

### Fonts

| archetype | example nodeIds (≤3) | count | code surface (file:line) | status | notes |
|---|---|---|---|---|---|
| Font picker source-aware | `247:30567` R01, `251:76737` R08 | 2 | `src/editor/inspector/sections/typography/FontPicker.tsx:34` | drift | Board "Inter · System" source label + "Applied stack"; code family name only |
| Manage site fonts | `247:31047` R02, `251:76342` R07 | 2 | `src/editor/inspector/sections/typography/FontPickerDropdown.tsx:252` | drift | "Manage site fonts" foot exists; board returns to exact Inspector origin |
| Site fonts availability-only | `247:31533` R03 | 1 | `src/editor/inspector/sections/typography/FontPicker.tsx:44` | drift | openSiteFonts routes out; board inline availability panel "Added to site · Ready to use" |
| Returned family needs explicit Use | `247:32025` R04 | 1 | — | missing | No explicit "Use" step after returning from site fonts |
| Font load failed | `247:32505` R05 | 1 | — | missing | No "Font unavailable — fallback rendering" + Retry |
| Stale picker target | `247:32989` R06 | 1 | — | missing | No "Selection changed" refusal |
| Assets Fonts origin pin | `252:46432` R09 | 1 | `src/editor/inspector/sections/typography/FontPicker.tsx:44` | drift | Assets › Fonts pinned origin row lives in Assets (L-C) |

### Block references

| archetype | example nodeIds (≤3) | count | code surface (file:line) | status | notes |
|---|---|---|---|---|---|
| Per-block control references | `249:71560` B69, `249:71797` B69, `249:72047` B69 | 10 | `src/editor/inspector/sections/typeBlock/TypeBlockSection.tsx:27` | drift | Per-type bodies exist in Style type block; board homes them under Content (Tag, Children, Source, Alt…) |
| Stack/Tabs/Modal/Table/Product Card refs | `249:74252` B69 | 1 | `src/editor/inspector/sections/typeBlock/TypeBlockSection.tsx:27` | drift | Switch/Toggle bodies exist; Tabs/Modal/Dialog/Table relationship controls missing |
| Ecommerce block refs | `249:74541` B69 | 1 | — | missing | product types have no type body (src/shared/constants/elementCapabilities.ts:21) |
| Native semantics support routes | `249:74672`, `249:74769`, `249:74874` | 4 | — | missing | No native-tag (time/abbr/wbr…) Tag control or attribute routes |

### States

| archetype | example nodeIds (≤3) | count | code surface (file:line) | status | notes |
|---|---|---|---|---|---|
| Project loading | `255:82447` S01 | 1 | `src/editor/inspector/components/InspectorLoading.tsx:35` | drift | Board tabs + "Loading project · Your saved content is still arriving…"; code skeleton only when nothing selected |
| Project load failure | `255:82909` S02 | 1 | `src/editor/shell/LoadErrorBanner.tsx:1` | drift | phase1 — load-failed chrome (Task 1.6) |
| Inspector error boundary | `255:83370` S03 | 1 | `src/editor/inspector/components/InspectorErrorBoundary.tsx:65` | drift | "Inspector Error" vs "Unable to display Inspector · … still selected" + Try again |
| Inspector recovered | `255:83852` S04 | 1 | `src/editor/inspector/components/InspectorErrorBoundary.tsx:65` | drift | Recovery must return original target + Style; boundary resets but tab/target not asserted |
| Section render failure | `255:84358` S05 | 1 | — | missing | One boundary for the whole tab (ProInspector.tsx:389); no per-section "Retry Typography" |
| Page appearance | `255:84855` S06 | 1 | `src/editor/inspector/components/PagePanel.tsx:220` | drift | "Editing Desktop · Page appearance" context; "SEO & social" vs "SEO and social"; ✦ AI on page header to remove (:236) |
| Template applied notice | `255:85352` S07 | 1 | `src/editor/inspector/components/PagePanel.tsx:293` | drift | "Template applied!" vs "Template applied · The Studio template was applied to Home" + Dismiss notice |
| Element menu | `255:85835` S08 | 1 | `src/editor/shared/elementActions.ts:243` | drift | Board groups Clipboard/Structure/State + Bind to CMS, Show in Layers, Add interaction; Selector row is class-first |
| Element deletion Undo | `255:86352` S09 | 1 | `src/editor/shared/elementActions.ts:180` | drift | Board "Hero heading deleted · Undo" on Page panel |
| Element duplicate selection | `255:86840` S10 | 1 | `src/editor/shared/elementActions.ts:108` | drift | Board selects the new copy explicitly with receipt |
| Apply style categories | `255:87335` S11, `255:87841` S12 | 2 | `src/editor/inspector/components/ApplyStyleDialog.tsx:68` | drift | Fixed categories in code; board choose Typography/Spacing/Fill/Border, locked-skipped count |
| Remove state-layer overrides | `255:88341` S13, `255:88837` S14 | 2 | `src/editor/inspector/components/ContextRow.tsx:123` | drift | Reset is a link; board lists the exact Hover properties before removal |
| Remove breakpoint-layer overrides | `255:89334` S15, `255:89827` S16 | 2 | `src/editor/inspector/components/ContextRow.tsx:131` | drift | Revert is a link; board lists properties + Desktop fallback values |
| Jump to property | `255:90324` S17, `255:90822` S18 | 2 | `src/editor/inspector/hooks/usePropertyJump.ts:92` | drift | ⌘K global rows "label · path"; board Inspector-scoped "Properties · Hero heading" search |
| Apply style none selected | `255:91321` S19 | 1 | — | missing | No category selection, so no zero-category no-history case |
| Reset style named layer | `255:91826` S20, `255:92313` S21 | 2 | `src/editor/shared/elementActions.ts:147` | drift | Resets without confirm ("Styles reset · Undo"); board names layer + properties |
| Locked element read-only | `255:92819` S22 | 1 | `src/editor/inspector/components/StatusLine.tsx:46` | drift | Board header "Read only · … is locked" + "Editing unavailable" card; code status line |
| Bind text to CMS | `258:31477` S23, `258:31982` S24 | 2 | `src/editor/inspector/sections/CmsBindingSection.tsx:276` | drift | Collection/Field/Record selects in Behaviour; board "Bind Title text" source picker (This page’s record/Specific/List item) |
| Bound text | `258:32482` S25 | 1 | `src/editor/inspector/components/StatusMarks.tsx:65` | drift | "Bound to …" mark; board Content "Dynamic bindings" row |
| Unbind + exact return | `258:32981` S26, `258:33493` S27 | 2 | `src/editor/inspector/sections/CmsBindingSection.tsx:296` | drift | Unbind exists; board return path + Undo toast |
| Rename display name | `258:35802` S28, `258:36291` S29 | 2 | `src/editor/inspector/components/ElementNameField.tsx:53` | drift | Enter/Escape exist inline; board confirm card noting DOM ID/tag unchanged |
| Inspector hidden | `258:36770` S30 | 1 | `src/editor/shell/StudioPanels.tsx:904` | drift | Shell chrome; "Show inspector" vs board "Show Inspector" |
| Ancestor overflow breadcrumb | `258:37248` S31 | 1 | `src/editor/inspector/components/InspectorHeader.tsx:89` | drift | phase1 — Inspector header breadcrumb (Task 1.4) |
| Scroll restoration | `258:37744` S32 | 1 | `src/editor/inspector/ProInspector.tsx:257` | drift | Per-element restore exists; board per element+tab |
| Video embed invalid draft | `258:38255` S33 | 1 | `src/editor/inspector/sections/typeBlock/bodies/embedBodies.tsx:78` | drift | URL rows exist; no retained invalid draft + "Restore last valid URL" |
| Inline SVG replacement | `258:38731` S34, `258:39198` S35 | 2 | — | missing | No SVG→image replacement with content-loss confirm |
| Binding source deleted | `258:39679` S36 | 1 | `src/editor/inspector/components/StatusMarks.tsx:65` | drift | "Source missing — …" mark; board card with Choose another/Keep/Unbind |

### Dynamic data

| archetype | example nodeIds (≤3) | count | code surface (file:line) | status | notes |
|---|---|---|---|---|---|
| Property binding owner | `255:93321` D01, `255:93677` D02 | 2 | `src/editor/inspector/sections/CmsBindingSection.tsx:276` | drift | Board Content › "Dynamic bindings" with "‹ CMS · Dynamic pages" return; code Behaviour "CMS binding" |
| Bind source picker | `255:94031` D03 | 1 | — | missing | No searchable "Choose source" picker |
| Content Conditions | `255:94411` D04, `255:94775` D05, `255:95134` D06 | 7 | — | missing | No element Conditions (show/hide by record field) in Inspector |
| Template binding removed | `258:35441` D11 | 1 | `src/editor/inspector/sections/CmsBindingSection.tsx:218` | drift | unbindAll keeps text; board retained static value + Undo |

### Menu actions

| archetype | example nodeIds (≤3) | count | code surface (file:line) | status | notes |
|---|---|---|---|---|---|
| Copy/paste style | `271:124080` G01, `271:124383` G02 | 2 | `src/editor/shared/elementActions.ts:118` | drift | No "2 styles copied · This element only · Desktop / Default" receipt; Selector row blocked:owner-class-first |
| Paste style empty clipboard | `271:124689` G03 | 1 | `src/editor/shared/elementActions.ts:131` | drift | Disabled reason "Copy a style first" matches; menu grouping differs (S08) |
| Paste style locked target | `271:124992` G04 | 1 | `src/editor/shared/elementActions.ts:118` | drift | No locked-before-command refusal note |
| Create component scope | `271:125321` G05, `271:125668` G06, `271:126015` G07 | 12 | `src/editor/shared/elementActions.ts:157` | drift | Save as component… opens existing dialog; no "Where it can be used" Library/This page scope, pending/failure states |
| Menu action review note | `271:131476` G23 | 1 | `src/editor/shared/elementActions.ts:243` | drift | REVIEW ONLY board for S08/G01–G22 |

### Class-first

| archetype | example nodeIds (≤3) | count | code surface (file:line) | status | notes |
|---|---|---|---|---|---|
| Class copy/paste | `273:252986` G24, `273:253283` G25, `273:253576` G26 | 4 | — | blocked:owner-class-first | Class-scoped copy/paste; class-first flow decisions pending |
| Class styling core (selectors, combos, scope, conflicts) | `415:50289` CF01, `415:50616` CF02, `415:50937` CF03 | 35 | — | blocked:owner-class-first | CF0–CF34; class-first styling flow decisions pending (CLASS-FIRST-SPEC.md) |
| Brand Classes manager | `419:51523` CF35, `419:51881` CF36, `419:52239` CF37 | 7 | — | blocked:owner-class-first | CF35–CF41; class-first styling flow decisions pending (CLASS-FIRST-SPEC.md) |
| Class-mode conversion + history | `419:53909` CF42, `419:54241` CF43, `419:54542` CF44 | 7 | — | blocked:owner-class-first | CF42–CF48; class-first styling flow decisions pending (CLASS-FIRST-SPEC.md) |
| Push/restore/conflict recovery | `419:56147` CF49, `419:56435` CF50, `419:56721` CF51 | 21 | — | blocked:owner-class-first | CF49–CF69; class-first styling flow decisions pending (CLASS-FIRST-SPEC.md) |
| Class manager viewports | `422:50614` CF70, `422:50915` CF71, `433:50940` CF72 | 8 | — | blocked:owner-class-first | CF70–CF77; class-first styling flow decisions pending (CLASS-FIRST-SPEC.md) |
| Component push with classes | `462:51685` CF78, `462:51821` CF79, `462:52099` CF80 | 4 | — | blocked:owner-class-first | CF78–CF81; class-first styling flow decisions pending (CLASS-FIRST-SPEC.md) |

## Top drifts

1. **The Content tab is missing and "Behaviour" is spelled differently.** Three tabs instead of four (`src/editor/inspector/sections/registry/_shared.tsx:46`, `config/sectionOrder.ts:15-48`). This affects about 200 rows. Fix it first, because every lane comparison depends on it.
2. **The Form field detail conflates Label and placeholder.** The "Label" row writes the `placeholder` attribute (`sections/FormFieldsSection.tsx:172`). Name (the submission key), Placeholder, Default value and Validation rows are absent, and Add field offers 6 types where the board shows 13 (`:31`).
3. **Form settings has no status row and no page picker.** It has no "Applies on next publish" tags, no "Form settings status" row with Retry, and Redirect is a free-text input (`sections/FormAfterSubmitSection.tsx:169,195`).
4. **The Interactions model is trigger-first.** The board is presets-first (`sections/interactions/AddInteractionPanel.tsx:127`). The editor lacks Play/Stop preview, the Repeat/When rows and the actions menu (`InteractionEditor.tsx:144,195`).
5. **The instance block sits inside Style.** `sections/ComponentRow.tsx:114` renders "Edit master" and a detach confirm dialog (`:169`). The board puts an identity block above the tabs, with "Reset · N overrides" and a direct Detach plus Undo.
6. **The element ⋯ menu is missing rows and groups.** It lacks Bind to CMS field…, Show in Layers and Add interaction, and the Clipboard/Structure/State groups (`src/editor/shared/elementActions.ts:243`).
7. **CMS binding is in Behaviour, as selects.** The board has Content › "Dynamic bindings" with a source picker (`sections/CmsBindingSection.tsx:276`). Element Conditions (D04–D10) do not exist at all.
8. **Override-layer removal is a bare link.** Reset state / Revert breakpoint (`components/ContextRow.tsx:123,131`) carry no list of properties or fallbacks. The same gap shows in Apply style, which cannot pick categories (`components/ApplyStyleDialog.tsx:68`).
9. **The error and loading states differ.** The error boundary title is "Inspector Error" (`components/InspectorErrorBoundary.tsx:65`), there is no per-section failure, and loading only shows while nothing is selected (`components/InspectorLoading.tsx:35`, `ProInspector.tsx:315`).
10. **Lossless values are not preserved.** Two-stop-only gradients (`sections/BackgroundSection.tsx:210`), Outer/Inner shadow (`effects/ShadowSection.tsx:46`), no display of custom `calc()` or filter expressions, and a generic unit list (`shared/controls/InputControls.tsx:220`).

## Missing clusters (no code)

- **Composite widgets C01–C18:** tabs pairs, modal trigger↔dialog and table structure. `tabs` and `table` are plain containers (`src/shared/constants/elementCapabilities.ts:171,173`).
- **Batch B02–B06** and **semantic tag conversion A12–A13**.
- **Native semantics routes** (4 boards) and **ecommerce block refs** (product has no body, `elementCapabilities.ts:21`).
- **Visitor form states B4-V** (15 boards). The published form posts to `packages/dashboard/app/api/public/forms/[siteId]/[formBlockId]/route.ts`, which returns separate HTML pages (`:19`, `:148`). Inline states need a runtime change plus the dashboard route, which is outside `inspector/`. Lane L-B owns these by page, but the work is runtime/export.
- **Select→Text conversion (BD-29, F31–F35)**, owner-approved 2026-10-19.

## Code-ahead dispositions

| Code capability (not on any 04 board) | Where | Disposition |
|---|---|---|
| AI agent-run takeover card | `src/editor/inspector/ProInspector.tsx:112-126,349-356` | Delete. Status `blocked:pr33-ai-removal` (AI removal is in unmerged PR #33). |
| ✦ AI chip on the element header | `components/InspectorHeader.tsx:105-113` | phase1, removed by Task 1.4. |
| "Ask AI about this page" on the Page panel | `components/PagePanel.tsx:236` | Delete. `blocked:pr33-ai-removal`. Not covered by Task 1.4, so add a drift row for the lead's Step 1b grep. |
| "Improve with AI" element action | `src/editor/shared/elementActions.ts:194` | Not in `INSPECTOR_MENU`. Confirm it is canvas-only, then `blocked:pr33-ai-removal`. |
| Multi-select Align / Distribute / Group bar | `components/MultiSelectBar.tsx:48-108` | Keep. Not on B01 (batch). Its home is the canvas selection toolbar or the multi header; needs an owner call. Record `code:align-distribute`. |
| Pseudo-state picker incl. `:disabled` | `components/ContextRow.tsx` STATES | Keep the behaviour. It becomes the phase1 "Editing" select options (Task 1.4). |
| CSS classes section | `sections/CSSClassesSection.tsx:133` | `blocked:owner-class-first`. |
| Theme-toggle inspector (Brand/Dark mode) | `components/ThemeToggleInspector.tsx`, `ProInspector.tsx:319` | Keep (`code:theme-toggle`). B69/02 lists Theme toggle, so check the copy there. |
| ⌥-click open/close-all sections, "+" add rows (DD-11) | `tabs/InspectorTabContent.tsx:142` | Keep. These are interaction affordances, not visual. Record `code:section-affordances`. |
| Spacing-token link in Size/Spacing | `sections/SizeSection.tsx:95` | Keep. It maps to the A04 spacing-token picker. Restyle it to the board. |

## Not mapped / caveats

- Every row is mapped. Annotation and handoff boards (Forms handoff, precision handoff, IC handoff, BD-29, G23 REVIEW ONLY, CF00, B69, Native) take the status of the family they specify.
- The statuses come from on-screen copy, instances and boxes, with no screenshots. Geometry such as the 300 px column, row heights and spacing was not compared.
- The CF block (CF00–CF81, 82 rows) plus G24–G27 is `blocked:owner-class-first` as a whole. Some CF rows (CF62/69/78–81, component push; CF70–77, viewports) touch non-class behaviour. Re-triage them when the class-first decisions close.
