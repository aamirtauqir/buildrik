# Current-source Inspector section/control inventory — 2026-10-18

**Evidence-only companion to the canonical 122-row register; not a replacement feature count.** Reviewer runtime: NOT RUN for every entry. Static source registration does not prove runtime reachability, persistence or output. Existing register: `docs/audit-and-design-2026-10-16/evidence/inspector-2026-10-16/inspector-preservation-map.md` and JSON. Block/native coverage remains the existing BIC records. Audit and risks: `/tmp/buildrick-control-audit.md`.

Paths below relative to package editor. Current registry has 25 section IDs; that is a registry count, not 25 features or a replacement for 122 preservation rows. Approved four-tab design ownership is independent of the current three-tab implementation.

## Every current section registration

| ID | Current tab / default disclosure | Control families | Registry evidence | Runtime |
|---|---|---|---|---|
| `form-fields` | behaviour / open | Child field list and drill-in; Label CommitRow; field Type select; Required checkbox; add-field action. | `src/editor/inspector/sections/registry/behaviour.tsx:101` | NOT RUN |
| `form-settings` | behaviour / open | After-submit choice; Message/Redirect/Send to commit fields; Spam protection checkbox; form service settings. | `src/editor/inspector/sections/registry/behaviour.tsx:111` | NOT RUN |
| `slides` | behaviour / open | Dynamic child list, selection and actions (reorder/duplicate/delete), add-slide action. | `src/editor/inspector/sections/registry/behaviour.tsx:121` | NOT RUN |
| `slider-settings` | behaviour / open | Autoplay, Arrows, Dots toggles; conditional interval numeric draft, 1–60 sec at blur. | `src/editor/inspector/sections/registry/behaviour.tsx:131` | NOT RUN |
| `collection` | behaviour / open | Collection select; New collection; Show items unitless count; Open collection. Filter/sort expanded design is not inferred as current source. | `src/editor/inspector/sections/registry/behaviour.tsx:141` | NOT RUN |
| `link` | behaviour / open | Destination kind select; conditional Page, URL, Email, Phone, Anchor; target/rel/title and validation. | `src/editor/inspector/sections/registry/behaviour.tsx:151` | NOT RUN |
| `cms-binding` | behaviour / open | Collection/Field/Record selects, source selector and conditional binding controls; dynamic schema/records; exact resource links. | `src/editor/inspector/sections/registry/behaviour.tsx:166` | NOT RUN |
| `visibility` | behaviour / open | Independent Show on Desktop/Tablet/Mobile checkboxes; writes base --hide-* keys. | `src/editor/inspector/sections/registry/behaviour.tsx:176` | NOT RUN |
| `interactions` | behaviour / open | Dynamic interaction list, add/edit/preview; trigger/animation/easing enumerations; duration/delay numeric fields; element animation row. | `src/editor/inspector/sections/registry/behaviour.tsx:187` | NOT RUN |
| `css-classes` | behaviour / open | Class chips/menus; add-class CommitRow with suggestions; selected element classes. | `src/editor/inspector/sections/registry/behaviour.tsx:196` | NOT RUN |
| `attributes` | behaviour / closed | Common/type-specific PropertyRows; custom data-* key/value editor; dynamic authored attributes. | `src/editor/inspector/sections/registry/behaviour.tsx:210` | NOT RUN |
| `layout` | style / always | Display segments; inline variant select; flex/grid context controls; position/insets/z-index; overflow/box-sizing/float/clear/visibility. | `src/editor/inspector/sections/registry/box.tsx:45` | NOT RUN |
| `size` | style / always | Width/height mode + number/unit; min/max; contextual flex-grow/shrink/basis/order/self alignment; grid placement. | `src/editor/inspector/sections/registry/box.tsx:64` | NOT RUN |
| `spacing` | style / always | Margin/padding composite with independent side inputs, linked editing, source and reset markers. | `src/editor/inspector/sections/registry/box.tsx:84` | NOT RUN |
| `fill` | style / valued | Color/token control; background image/media; background-position/size/repeat/attachment/blend controls. | `src/editor/inspector/sections/registry/box.tsx:98` | NOT RUN |
| `border` | style / valued | Width/unit, style select, color; linked/unlinked corner radius; individual sides; outline. | `src/editor/inspector/sections/registry/box.tsx:117` | NOT RUN |
| `component` | style / always | Instance identity, variant select, master link, instance action menu; dynamic variants from component model. | `src/editor/inspector/sections/registry/component.tsx:12` | NOT RUN |
| `opacity` | effects / valued | 0–100% slider plus editable number; stored fractional CSS opacity. | `src/editor/inspector/sections/registry/effects.tsx:20` | NOT RUN |
| `shadow` | effects / valued | Outer/inner preset selects with custom values, advanced raw CSS fields; combined box-shadow. | `src/editor/inspector/sections/registry/effects.tsx:29` | NOT RUN |
| `filters` | effects / valued | Blur 0–20px, brightness 0–200%, contrast 0–200%, grayscale 0–100%; sliders with printed readouts. | `src/editor/inspector/sections/registry/effects.tsx:39` | NOT RUN |
| `transform-motion` | effects / valued | Scale 0–200%, rotate −180..180°, skew −45..45° sliders; Move X/Y text; transition property/easing selects; duration/delay text. | `src/editor/inspector/sections/registry/effects.tsx:49` | NOT RUN |
| `effects-advanced` | effects / closed | Cursor, blend, will-change selects; raw text-shadow CSS. | `src/editor/inspector/sections/registry/effects.tsx:60` | NOT RUN |
| `typography` | style / always | Font picker; color; size/unit; unitless/unit line-height; weight select; alignment segments; advanced text properties. | `src/editor/inspector/sections/registry/text.tsx:105` | NOT RUN |
| `text-inside` | style / closed | Same Typography controls, closed inherited summary for container/other inside-text contexts; not a new child text-content value. | `src/editor/inspector/sections/registry/text.tsx:118` | NOT RUN |
| `type` | style / always | Element-capability selected body; content/tag/attributes/media/layout/widgets. Complete body-map index below. | `src/editor/inspector/sections/registry/type.tsx:15` | NOT RUN |

## Type-block registry: every registered body ID

Bodies selected through `src/shared/constants/elementCapabilities.ts`, not tag guesses. Current aliases include paragraph→text; textarea/select/upload→input; checkbox/radio/switch→choice; icon→svg; stack→flex; columns→grid with its own attribute rows. Hero/container profiles do not have a text body. Eligibility intersection is `tabs/InspectorTabContent.tsx:95`.

| Body source | Registered IDs and body functions | Evidence | Runtime |
|---|---|---|---|
| `embedBodies.tsx` | `video-embed` → `VideoEmbed` | `src/editor/inspector/sections/typeBlock/bodies/embedBodies.tsx:101` | NOT RUN |
| `embedBodies.tsx` | `map-embed` → `MapEmbed` | `src/editor/inspector/sections/typeBlock/bodies/embedBodies.tsx:102` | NOT RUN |
| `embedBodies.tsx` | `lottie` → `Lottie` | `src/editor/inspector/sections/typeBlock/bodies/embedBodies.tsx:103` | NOT RUN |
| `formBodies.tsx` | `input` → `InputBody` | `src/editor/inspector/sections/typeBlock/bodies/formBodies.tsx:146` | NOT RUN |
| `formBodies.tsx` | `choice` → `ChoiceBody` | `src/editor/inspector/sections/typeBlock/bodies/formBodies.tsx:147` | NOT RUN |
| `layoutBodies.tsx` | `flex` → `Flex` | `src/editor/inspector/sections/typeBlock/bodies/layoutBodies.tsx:54` | NOT RUN |
| `layoutBodies.tsx` | `grid` → `Grid` | `src/editor/inspector/sections/typeBlock/bodies/layoutBodies.tsx:55` | NOT RUN |
| `mediaBodies.tsx` | `image` → `Image` | `src/editor/inspector/sections/typeBlock/bodies/mediaBodies.tsx:166` | NOT RUN |
| `mediaBodies.tsx` | `video` → `Video` | `src/editor/inspector/sections/typeBlock/bodies/mediaBodies.tsx:167` | NOT RUN |
| `mediaBodies.tsx` | `audio` → `Audio` | `src/editor/inspector/sections/typeBlock/bodies/mediaBodies.tsx:168` | NOT RUN |
| `mediaBodies.tsx` | `svg` → `Svg` | `src/editor/inspector/sections/typeBlock/bodies/mediaBodies.tsx:169` | NOT RUN |
| `textBodies.tsx` | `heading` → `Heading` | `src/editor/inspector/sections/typeBlock/bodies/textBodies.tsx:148` | NOT RUN |
| `textBodies.tsx` | `text` → `TextBody` | `src/editor/inspector/sections/typeBlock/bodies/textBodies.tsx:149` | NOT RUN |
| `textBodies.tsx` | `link` → `TextBody` | `src/editor/inspector/sections/typeBlock/bodies/textBodies.tsx:150` | NOT RUN |
| `textBodies.tsx` | `label` → `TextBody` | `src/editor/inspector/sections/typeBlock/bodies/textBodies.tsx:151` | NOT RUN |
| `textBodies.tsx` | `button` → `ButtonBody` | `src/editor/inspector/sections/typeBlock/bodies/textBodies.tsx:152` | NOT RUN |
| `widgetBodies.tsx` | `countdown` → `Countdown` | `src/editor/inspector/sections/typeBlock/bodies/widgetBodies.tsx:262` | NOT RUN |
| `widgetBodies.tsx` | `progress` → `Progress` | `src/editor/inspector/sections/typeBlock/bodies/widgetBodies.tsx:263` | NOT RUN |
| `widgetBodies.tsx` | `accordion` → `Accordion` | `src/editor/inspector/sections/typeBlock/bodies/widgetBodies.tsx:264` | NOT RUN |

## PropertyConfig definitions (literal configured fields)

All matching literal `id` / `label` / `type` / `options` declarations from the attribute config and the type-body config sources are quoted below with line anchors. Repeated fields are shared NAME/PLACEHOLDER/DEFAULT references, not additional product features. `PropertyField.PropertyConfig` supports text/select/checkbox/textarea; value storage remains string and boolean attributes normalize to true/presence or absent. Defaults, enums and conditionals require reading the adjoining config. These quotes are static declarations, not proof of input acceptance.

### src/editor/inspector/config/attributeFields.ts

- `18`: `{ id: "id", label: "ID", type: "text", placeholder: "element-id" },`
- `19`: `{ id: "title", label: "Title", type: "text", placeholder: "Shown on hover" },`
- `20`: `{ id: "tabindex", label: "Tab index", type: "text", placeholder: "0" },`
- `26`: `id: "decoding",`
- `27`: `label: "Decoding",`
- `28`: `type: "select",`
- `29`: `options: [`
- `30`: `{ value: "auto", label: "Auto" },`
- `31`: `{ value: "sync", label: "Sync" },`
- `32`: `{ value: "async", label: "Async" },`
- `38`: `id: "preload",`
- `39`: `label: "Preload",`
- `40`: `type: "select",`
- `41`: `options: [`
- `42`: `{ value: "auto", label: "Auto" },`
- `43`: `{ value: "metadata", label: "Metadata" },`
- `44`: `{ value: "none", label: "None" },`
- `49`: `{ id: "readonly", label: "Read only", type: "checkbox" },`
- `51`: `id: "autocomplete",`
- `52`: `label: "Autocomplete",`
- `53`: `type: "select",`
- `54`: `options: [`
- `55`: `{ value: "on", label: "On" },`
- `56`: `{ value: "off", label: "Off" },`
- `57`: `{ value: "name", label: "Name" },`
- `58`: `{ value: "email", label: "Email" },`
- `59`: `{ value: "tel", label: "Phone" },`
- `64`: `{ id: "readonly", label: "Read only", type: "checkbox" },`
- `65`: `{ id: "maxlength", label: "Max length", type: "text" },`
- `66`: `{ id: "cols", label: "Columns", type: "text", placeholder: "50" },`
- `69`: `{ id: "action", label: "Action URL", type: "text", placeholder: "/submit" },`
- `71`: `id: "method",`
- `72`: `label: "Method",`
- `73`: `type: "select",`
- `74`: `options: [`
- `75`: `{ value: "POST", label: "POST" },`
- `76`: `{ value: "GET", label: "GET" },`
- `80`: `id: "enctype",`
- `81`: `label: "Encoding",`
- `82`: `type: "select",`
- `83`: `options: [`
- `84`: `{ value: "application/x-www-form-urlencoded", label: "URL encoded" },`
- `85`: `{ value: "multipart/form-data", label: "Multipart (file upload)" },`
- `86`: `{ value: "text/plain", label: "Plain text" },`
- `89`: `{ id: "novalidate", label: "Disable validation", type: "checkbox" },`
- `91`: `id: "autocomplete",`
- `92`: `label: "Autocomplete",`
- `93`: `type: "select",`
- `94`: `options: [`
- `95`: `{ value: "on", label: "On" },`
- `96`: `{ value: "off", label: "Off" },`
- `102`: `/** The Attributes rows for a type: its own §17.H rows, then the common ones`
- `104`: `export function attributeFieldsFor(type: string): readonly PropertyConfig[] {`

### src/editor/inspector/sections/typeBlock/bodies/embedBodies.tsx

- `33`: `const RATIO_OPTIONS = EMBED_RATIOS.map((r) => ({ value: r, label: r }));`
- `50`: `function UrlRows({ label, placeholder, attr, kind, p }: { label: string; placeholder: string; attr: string; kind: EmbedKind; p: TypeBlockBodyProps }) {`

### src/editor/inspector/sections/typeBlock/bodies/formBodies.tsx

- `47`: `const NAME: PropertyConfig = { id: "name", label: "Name", type: "text", placeholder: "field_name" };`
- `48`: `const PLACEHOLDER: PropertyConfig = { id: "placeholder", label: "Placeholder", type: "text", placeholder: "Enter text…" };`
- `49`: `const DEFAULT: PropertyConfig = { id: "value", label: "Default", type: "text", placeholder: "" };`
- `53`: `input: [{ id: "type", label: "Input type", type: "select", options: INPUT_TYPES }, NAME, PLACEHOLDER, DEFAULT],`
- `54`: `textarea: [NAME, PLACEHOLDER, DEFAULT, { id: "rows", label: "Rows", type: "text", placeholder: "4" }],`
- `55`: `select: [NAME, { id: "options", label: "Options (one per line)", type: "textarea", placeholder: "Option 1\nOption 2" }],`
- `66`: `function FlagRow({ name, label, ...props }: TypeBlockBodyProps & { name: string; label: string }) {`

### src/editor/inspector/sections/typeBlock/bodies/layoutBodies.tsx

- `23`: `id: "data-columns",`
- `24`: `label: "Columns",`
- `25`: `type: "select",`
- `26`: `options: ["2", "3", "4", "5", "6"].map((v) => ({ value: v, label: v })),`
- `29`: `id: "data-gap",`
- `30`: `label: "Gap",`
- `31`: `type: "select",`
- `32`: `options: [`
- `33`: `{ value: "0", label: "None" },`
- `34`: `{ value: "8px", label: "8px" },`
- `35`: `{ value: "16px", label: "16px" },`
- `36`: `{ value: "24px", label: "24px" },`
- `37`: `{ value: "32px", label: "32px" },`

### src/editor/inspector/sections/typeBlock/bodies/mediaBodies.tsx

- `36`: `{ value: "cover", label: "Cover" },`
- `37`: `{ value: "contain", label: "Contain" },`
- `38`: `{ value: "fill", label: "Fill" },`
- `42`: `{ value: "lazy", label: "Lazy" },`
- `43`: `{ value: "eager", label: "Eager" },`
- `120`: `id: "data-icon-size",`
- `121`: `label: "Icon size",`
- `122`: `type: "select",`
- `123`: `options: ["16", "20", "24", "32", "48", "64"].map((v) => ({ value: v, label: '${v}px' })),`
- `126`: `id: "data-icon-stroke",`
- `127`: `label: "Stroke width",`
- `128`: `type: "select",`
- `129`: `options: ["1", "1.5", "2", "2.5", "3"].map((v) => ({ value: v, label: v })),`

### src/editor/inspector/sections/typeBlock/bodies/textBodies.tsx

- `31`: `const LEVELS = ["h1", "h2", "h3", "h4", "h5", "h6"].map((v) => ({ value: v, label: v.toUpperCase() }));`
- `34`: `{ value: "button", label: "Button" },`
- `35`: `{ value: "submit", label: "Submit" },`
- `36`: `{ value: "reset", label: "Reset" },`
- `69`: `typeStyleRows(tokens).map((row) => ({ value: row.id, label: row.name })),`
- `76`: `const choose = (id: string) => {`
- `151`: `label: TextBody,`

### src/editor/inspector/sections/typeBlock/bodies/widgetBodies.tsx

- `43`: `{ value: "message", label: "Show message" },`
- `44`: `{ value: "hide", label: "Hide" },`
- `99`: `function labelText(label: Element): Element {`
- `188`: `{ value: "open", label: "Open" },`
- `189`: `{ value: "closed", label: "Closed" },`

## Reusable control variants and behavior boundary

| Primitive | Variants / contract | Evidence |
|---|---|---|
| InputRow | text/number/textarea; string value; linked label; mixed/read-only/source; live onChange. | shared/controls/InputControls.tsx:44 |
| InputWithUnit | number + unit, keyword, noUnit count, unlabeled pair, override marker, invalid draft/error; Enter/blur/Escape/arrows. | shared/controls/InputControls.tsx:125 |
| SelectRow | Default placeholder or no blank option; mixed disabled placeholder; override/source; discrete undo. | shared/controls/InputControls.tsx:428 |
| ButtonGroup | text/icon segments; radiogroup, roving tab, arrows/Home/End; widened label layout when >4 options. | shared/controls/ButtonControls.tsx:25 |
| CheckRow | bool, indeterminate mixed, label-first semantics beside box, read-only; property optional. | shared/controls/CheckRow.tsx:19 |
| SliderInput | range + printed readout or optional editable numeric companion; min/max/step/unit. | shared/controls/SliderControls.tsx:15 |
| RangeSlider | range + printed value; numeric entry absent; declared labelWidth/valueWidth are not consumed in destructuring. | shared/controls/SliderControls.tsx:116 |
| ColorInput | literal/keyword/token/inherited/mixed; swatch/popover/error; binding chip/unlink/relink/exact token navigation. | shared/controls/ColorInput.tsx:70 |
| SpacingBox / CornerRadiusInput | independent side/corner values, linked editing, units/keywords/token/source, mixed/read-only; composite geometry. | shared/controls/SpacingControls.tsx:29 |
| AlignmentGrid | spatial 3×3 alignment control for applicable layout; needs accessible names and keyboard validation. | shared/controls/AlignmentGrid.tsx |
| ControlRow | default/stacked/compact API; sm/md/lg label presets; disabled reason/title; actual rendering differs from advertised sizing; compact uses default path. | shared/controls/ControlRow.tsx:41 |
| TextInputRow | raw CSS/text, property-aware read-only/mixed; declared labelWidth not consumed; linked label. | shared/controls/TextControls.tsx:16 |
| Section | open/summary/empty-add; controlled or own disclosure; active/error/override summary; Alt-toggle-all; keyboard Enter/Space. | shared/controls/Section.tsx:130 |
| MoreSettingsToggle | progressive disclosure, advanced count; content retained in model. | shared/controls/MoreSettingsToggle.tsx |
| FieldDot / OverrideDot / MixedValueIndicator | source/reset affordances, breakpoint/pseudo/master and mixed explanations. | shared/controls/FieldDot.tsx; OverrideDot.tsx; MixedValueIndicator.tsx |
| CommitRow | local text/url/email draft; Enter/blur commit; Escape restore; clear-on-commit; datalist suggestions. | sections/behaviourRows.tsx:24 |
| PickRow / ActionRow / NoteRow | opens contextual editor; compact action; muted/error note. | sections/behaviourRows.tsx:89 |
| SourceRow / EditTextRow | media-picker entry with selected target; actual canvas text editing entry. | sections/typeBlock/SourceRow.tsx; EditTextRow.tsx |
| Note / Warning | inline hint and role=status warning for custom body states. | sections/typeBlock/bodies/bodyRows.tsx:17 |
| ToggleSwitch | used in SliderPlayback for immediate Autoplay/Arrows/Dots; chrome-ui re-exports Flowbite primitive. | sections/SliderPlaybackSection.tsx:76; chrome-ui/index.ts:170 |
| Tooltip / Popover / IconButton / Button / TextInput / TextField / Select / Checkbox | Shared chrome primitives underpin rows, source and reset controls. Changing global variants affects shell/CMS/Assets/Brand too. | src/editor/chrome-ui/index.ts |
| chrome-ui FieldRow | exported row/stacked, 96px label/32px minimum; no live JSX consumers found. Latent duplication only. | src/editor/chrome-ui/FieldRow.tsx:25 |

## Static coverage limitations

- The section table exhausts current top-level defineSection registrations. It does not expand every runtime option or every authored object.
- Dynamic/custom fields: CMS schema/record/collection options, component variants/overrides, accordion child labels/open states, form children, slides, CSS classes, data-* names/values, custom CSS strings and media/token choices remain variable-size collections. They require representative real project data and canonical preservation-register mapping.
- Compound CSS lists can encode values beyond their compact controls. Do not treat displayed range or preset list as the complete set of supported saved values.
- Type blocks are not 1:1 with block or native HTML inventories. The capabilities map and BIC native-route records must be joined before claiming per-element completeness.
- Pseudo state, breakpoint, lock/conflict/role, selection intersection, feature flags and optional callbacks affect actual visibility/availability. Static registration is not a reachability pass.
- Source references cover control contracts and sample handlers. Full engine/service/save/reopen/preview/export verification remains NOT RUN here.
- Existing 122-row register is preserved; no invented new atomic completeness percentage or replacement feature count.
