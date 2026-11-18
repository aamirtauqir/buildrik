# C1 — Engine data model + style system vs Webflow

Audit date 2026-10-20 · HEAD `19f964d5e` (main) · read-only on app code.
Every claim below was verified in current source (file:line, paths relative to
`packages/editor/` unless prefixed). Behaviour marked **PROVEN** was reproduced
with a real `Composer` (jsdom) in throwaway probe tests kept outside the repo
(scratchpad config, `createTestComposer` from `src/engine/__tests__/test-utils/realComposer.ts`).
Nothing in the repo was edited. Webflow claims marked *(uncertain)* are from memory and
were not re-checked against current Webflow docs.

---

## 0. The model in one paragraph

An element is a plain `ElementData` record: `id`, `type` (56-value union),
`tagName`, `attributes`, `classes`, `styles` (a flat property map = the
**desktop/base** styles), `breakpointStyles`, `content`, `children`, `data`
(custom bag: interactions, layer name…) — `src/shared/types/element.ts:34-79`.
Pages hold one root element tree (`src/shared/types/project.ts:179-191`); the
project is `{ pages, styles: StyleData[], settings, … }` (`project.ts:33-45`,
written by `Composer.exportProject` `src/engine/Composer.ts:778-803`).

Styling is **per element, keyed by element id**, in two stores:

| Layer | Where it lives | Selector |
|---|---|---|
| Base (desktop) | `ElementData.styles` via `Element.setStyle` (`src/engine/elements/ElementStyles.ts:131-160`) | none — rendered inline on canvas; exported as `.buildrick-<id>` |
| Tablet / mobile override | `StyleEngine` rule (`src/engine/styles/StyleEngine.ts:189-219`) **and** mirrored into `ElementData.breakpointStyles` (`:330-348`) | `@media (max-width:…) { [data-buildrick-id="<id>"] }` |
| State (`:hover` etc.) | `StyleEngine` rule only (`src/editor/inspector/hooks/useStyleHandlers.ts:278-298`) | `[data-buildrick-id="<id>"]:hover` (optionally inside the breakpoint @media) |
| User class rules (`.hero {}`) | `StyleEngine` rule — engine supports it, **no UI writes it** | `.hero` |

`StyleEngine` is a generic `selector|mediaQuery → properties` map
(`StyleEngine.ts:31-32, 52-54, 79-114`), so the engine *could* do class styling;
the product never routes Inspector edits to a class selector.

---

## Data model / export — VERDICT: DIFFERENT MODEL (output is semantic HTML + generated per-element classes, not reusable class CSS) · P1

**What exists**
- Real tags: `Element.getTagName()` returns the stored tag when it is on the shared
  allowlist, else the type's default tag (`src/engine/elements/Element.ts:122-125`;
  allowlist `packages/shared/schemas/element-markup.ts:19-42`). Export uses the
  stored tag (`src/engine/export/ExportEngine.ts:389-390`).
- **Publish path (multi-page)**: base styles become one class rule per element,
  `.buildrick-<id> {…}` (`ExportEngine.ts:524-551`), emitted first, then
  `StyleEngine.generateResponsiveCSS` (all rules: breakpoint, state, any class rules)
  (`ExportEngine.ts:779-785`; `StyleEngine.ts:354-416`). Each element is written
  with `data-buildrick-id` and `class="buildrick-<id> userClass…"`
  (`ExportEngine.ts:1143-1154`). Output is a linked `styles.css` (`:950-951`).
- **Single-file export / ZIP** (`ExportEngine.generateCSS` `:318-366`,
  `elementToHTML` `:371-466`): same `.buildrick-<id>` approach, `cssStyle: "inline"`
  optional (`:435-439`).
- **Quick preview / "copy HTML"** (`Composer.exportHTML`, `Composer.ts:822-899`):
  base styles **inline** in `style=""` (`elements.toHTML`), plus the StyleEngine
  CSS. PROBE output: `<h2 data-buildrick-id="el-…" data-buildrick-type="heading" class="hero" style="padding: calc(1rem + 2vw); margin: var(--x)">`.
- Ids: `generateId("el")` on every clone (`src/engine/elements/ElementManager.ts:365-372`).

**vs Webflow** — Webflow publishes semantic HTML with the *user's* class names and
one CSS rule per class/combo class; a 50-card grid shares one `.card` rule. Buildrick
emits one rule per element (`.buildrick-<id>`), so CSS grows linearly with element
count, class names carry no meaning, and exported code is not hand-maintainable.
Every element also carries engine attributes (`data-buildrick-id`, `data-buildrick-type`).

**Bugs**
- **PROVEN (output level) — Quick preview loses tablet/mobile overrides.**
  `exportHTML` writes base styles inline and the breakpoint override as an
  `@media { [data-buildrick-id] {…} }` rule; inline beats any stylesheet rule, so
  the override can never apply in that document. Probe: heading base `font-size:48px`,
  tablet `30px` → html has `style="…font-size: 48px"` and css has the
  `(max-width: 1023px)` rule. The publish path fixed exactly this collision
  (`ExportEngine.ts:505-523` "H1 cascade fix"); `Composer.exportHTML` (which the
  comment at `Composer.ts:812-821` says feeds Quick preview, the preview modal,
  view mode and "copy page HTML") did not. Impact depends on whether a preview
  surface renders this document at a narrow width (not checked live). P1.
- *Suspected* P2 — canvas vs publish disagree when an imported class rule and an
  element base style set the same property: canvas inline base wins; publish emits
  `.buildrick-<id>` first and `.hero` later at equal specificity (0,1,0), so the class
  wins (`ExportEngine.ts:779-785`, `StyleEngine.ts:368-373`).

---

## S01 Class-based styling — VERDICT: MISSING (classes are name tags; styling is per element) · P0

**What exists**
- `classes: string[]` on the element (`element.ts:44`), add/remove/set
  (`ElementStyles.ts:85-121`), exported into `class=""` (`ExportEngine.ts:398, 1153`).
- Inspector "CSS classes" section adds/removes names only
  (`src/editor/inspector/sections/CSSClassesSection.tsx:116-130`). Its suggestion list
  calls `composer.styles.getGlobalClasses()` (`:110-113`), **which does not exist on
  `StyleEngine`** (whole class read, `StyleEngine.ts:1-825`) — suggestions are always
  empty. Brand › Classes says the same in its header
  (`src/editor/design-system/ui/sections/ClassesSection.tsx:17-20`) and only tallies
  names off the tree (`:37-48`).
- Every Inspector style write targets the element: desktop → `el.setStyle`, tablet/
  mobile → `[data-buildrick-id]` rule, state → `[data-buildrick-id]:state`
  (`useStyleHandlers.ts:267-303, 368-401`; `commandOperations.ts:270-285`).
- Class rules can exist only if they arrive through an import (StyleEngine is
  generic; PROBE: `setRule(".hero", …)` + `:hover` export correctly as `.hero{}` /
  `.hero:hover{}`). `StyleEngine.computeStyles`/`getClassStyles` read class rules
  (`:745-797`) but have **zero callers** outside the file.
- Substitute: "Apply style to all {H3 headings} on this page"
  (`src/engine/commands/stylePeers.ts:1-115`) — a **one-shot copy** of typography/
  fill/border/effects to same-type elements on the active page; no live link.

**Missing vs Webflow**: two elements cannot share a class and change together; no
combo classes, no class selector field, no "styles on this class affect N elements"
count, no tag/global selectors ("All H2s", "Body (All pages)"). This is Webflow's core
mental model — every Webflow switcher will look for it first.

**Bug — PROVEN: Apply-style-to-peers is dead under any state.**
`stylePeers.ts:79` builds the selector as `[data-buildrik-id="…"]` (missing "c");
everything else, including the writer `useStyleHandlers.ts:269`, uses
`data-buildrick-id`. With pseudo ≠ normal, `styleAt` (`:82-86`) reads a rule that never
exists → returns `{}` → `applyStyleToPeers` returns 0 (`:98-99`). Probe: source has a
`:hover` rule, `applyStyleToPeers(…, {pseudo:"hover"})` → `0`, peer has no hover rule.
Had it found anything, `:107` would write rules no element matches. The existing test
only asserts the empty case (`src/engine/commands/__tests__/stylePeers.test.ts:156-160`),
which passes for the wrong reason. P1 (feature-local).

---

## S03 Breakpoint cascade — VERDICT: PARTIAL · P1

**What exists**
- Exactly three breakpoints, a closed union: `BreakpointId = "desktop" | "tablet" | "mobile"`
  (`src/shared/types/breakpoints.ts:15`). Config `src/shared/constants/breakpoints.ts:16-41`.
- Desktop-first, max-width cascade: desktop = no query; tablet `(max-width: 1023px)`;
  mobile `(max-width: 767px)` (`breakpoints.ts:52-59`). Export order base → tablet →
  mobile (`StyleEngine.ts:389-402`), so mobile inherits tablet in real CSS.
- "Wide" (1920) is a preview size only, no style layer (`breakpoints.ts:103-108`;
  `commandOperations.ts:240-248` maps it to desktop).
- Override storage: rule keyed `[data-buildrick-id]|<query>` plus a mirror in
  `ElementData.breakpointStyles` (`StyleEngine.ts:205-216, 330-348`). Removal keeps
  both in step (`:266-301`).
- Editor preview re-emits the active device's rules without the media query and
  `!important` (canvas is a narrowed div, media queries never match)
  (`StyleEngine.ts:689-711`), cascading tablet→mobile (`:693`).

**Missing vs Webflow**: no custom breakpoints (union is closed); no larger
breakpoints (Webflow: 1280/1440/1920 min-width, cascading up); no mobile-portrait
split (Webflow 478px) *(uncertain on exact px)*; `device-hide` flags are base-only
(`useStyleHandlers.ts:270-277`).

**Bugs**
- **PROVEN (engine read) — mobile reads skip the tablet layer.** `stylesAt` merges
  base + the requested breakpoint only (`commandOperations.ts:254-262`). Probe: base
  48px, tablet 30px → `stylesAt(mobile)["font-size"] === "48px"`, while the exported
  CSS and the editor preview (`StyleEngine.ts:693`) render 30px at mobile.
  `computeEffectiveStyles` (`src/editor/inspector/config/cssContext.ts:53-70`, used
  for parent flex/grid detection) inherits the error. The Inspector partly masks it
  by sampling the canvas for keys in the type defaults when the canvas device equals
  the edited breakpoint (`useStyleHandlers.ts:207-211`); any other property, or
  editing Mobile while the canvas shows another device, shows the desktop value.
  `useFieldOverrides` reports only the current layer's own keys, so a value coming
  from Tablet is not attributed (`src/editor/inspector/hooks/useFieldOverrides.ts:6-9`). P1.
- Dual store drift risk (design smell): rendering/export read StyleEngine rules,
  ReactExporter reads `breakpointStyles` (`src/engine/export/ReactExporter.ts:201-212`).
  Nothing rebuilds rules from `breakpointStyles` on load or clone — see C07.

---

## S04 States — VERDICT: PARTIAL · P1

**What exists**
- Type `PseudoStateId = "normal" | "hover" | "focus" | "active" | "disabled"`
  (`src/shared/types/style.ts:30`); the Inspector checks those four
  (`src/editor/inspector/config/pseudoOverrides.ts:15-34`). StyleEngine also
  recognises `focus-visible`/`focus-within` (`StyleEngine.ts:24`).
- Stored as per-element StyleEngine rules `[data-buildrick-id="id"]:hover`, per
  breakpoint (`useStyleHandlers.ts:278-298`). Exported as real CSS (publish emits all
  rules, `ExportEngine.ts:782-785`). Canvas preview re-emits desktop state rules
  `!important` so they beat inline base (`StyleEngine.ts:669-675`).
- Undoable: PROBE — set `:hover` rule in a transaction, undo → rule gone.

**Missing vs Webflow**: no `:visited`, `::placeholder`, `::before/::after`, `:first/
:last/:nth-child` (Webflow collection-item states), link "Current" state; states are
per element, not per class, so "every button hovers the same" needs N edits (or the
broken peer copy above). *(Webflow state list from memory.)*
**Bugs**: states are lost on duplicate/paste (C07, PROVEN). Peer-apply under a state
is dead (S01, PROVEN).

---

## S05 Inheritance / where-a-value-comes-from — VERDICT: PARTIAL · P1

**What exists**: `useFieldOverrides` marks three override kinds per field —
current-breakpoint, current-state, component-master — with dots, counts and per-
kind reset (`useFieldOverrides.ts:1-90`; `useStyleHandlers.ts:213-221`). Unset rows
show the canvas-computed value (`useStyleHandlers.ts:190-211`).
**Missing vs Webflow**: no "inherited from parent / from class X / from Tablet"
indicator (Webflow's orange/yellow labels and selector-source tooltip); no
cascade-from-larger-breakpoint attribution (see S03 bug); no class-level source
because there are no class styles.

---

## S06 Style manager / unused-class cleanup — VERDICT: MISSING · P2 (P1 once classes exist)

**What exists**: Brand › Classes lists class names with "used N×" counts from the
tree (`ClassesSection.tsx:37-48`), no rename/delete/clean-up.
**Missing**: style manager, rename class site-wide, "Clean up unused styles".
**Bug — PROVEN: orphan rules are never removed.** Nothing outside `StyleEngine`
calls `removeRule`/`clearBreakpointStyles` (repo grep). Probe: element with a tablet
override and a `:hover` rule deleted → 2 rules remain and `toCSS()` still contains
its id. They ship in every publish forever (`generateResponsiveCSS` walks all rules,
`StyleEngine.ts:368`). P2 (bloat, no visible break).

---

## S07 Variables / tokens — VERDICT: PARTIAL (close to Webflow Variables) · P2

**What exists**
- Schema v6 tokens, DTCG-shaped: `id, name, kind, layer (primitive|semantic),
  modes: { light, dark? }` where each mode is `{value}` or `{alias}`, plus `cssVar`
  (`packages/shared/schemas/design-tokens.ts:38-57`); graph validation (no cycles,
  alias same kind, primitives literal-light-only) (`:61-99`); DTCG import/export
  (`:132-176`).
- 14 kinds (`src/engine/designSystem/types.ts:63-68`) incl. color, type, spacing,
  radius, shadow, motion, border, opacity, z-index, breakpoint, sizing.
- Binding: a style value **is** `var(--buildrick-design-<id>)`
  (`types.ts:139-141`; Inspector recognises only that pattern,
  `src/editor/inspector/shared/tokenBindingDetection.ts:19`). "Connect to tokens"
  finds raw values equal to a token and rewrites them, base + breakpoints
  (`src/engine/designSystem/connectTokens.ts:1-105`).
- Export: `:root{…}` custom properties; dark mode as
  `@media (prefers-color-scheme: dark){:root:not([data-theme="light"])…}` and
  `:root[data-theme="dark"]` (`packages/shared/tokens/emit.ts:20-105`), emitted on
  publish, single-file and preview (`ExportEngine.ts:329-334, 792-795`;
  `Composer.ts:846-847`).
- Token edits are in undo scope (`src/engine/HistoryManager.ts:378-396`).

**Missing vs Webflow**: only two fixed modes (light/dark) — Webflow allows custom
modes per collection *(uncertain on limits)*; no user collections/groups beyond
`group`/`category` strings; no percentage/number variables bound to arbitrary
properties via a variable picker on every field (binding is field-specific);
variables cannot be applied per breakpoint as a mode.

---

## S08 Units, calc(), var() — VERDICT: PARTIAL · P1

**What exists**: `InputWithUnit` accepts number + unit from its list
(`px % em rem vw vh auto` default), keywords `auto none inherit normal initial`, and
a token `var()` (`src/editor/inspector/shared/controls/InputControls.tsx:155, 196-210, 214-216`).
The engine stores any string (PROBE: `padding: calc(1rem + 2vw)`, `margin: var(--x)`
round-trip to export), filtered only by `isSafeCssDeclaration` at write-out
(`StyleEngine.ts:545-547`).
**Missing vs Webflow**: `parseEntry` rejects anything else — `calc(…)`, `clamp()`,
`min()/max()`, `ch`, `svh/dvh`, an arbitrary `var(--x)` — with "Enter a valid number"
(`InputControls.tsx:153, 205-206`). Webflow accepts typed `calc()` and unit keywords in
every field *(Webflow calc support from memory)*. A value already holding `calc()`
displays as raw text with a `px` unit (`splitValue`, `:179-194`).

---

## S11 Copy / paste styles — VERDICT: PARTIAL · P1

**What exists**: `copy-style` snapshots `el.getStyles()` (base + component overrides)
into `composer.styleClipboard` (`src/engine/commands/defaultCommands.ts:187-202`);
`paste-style` → `pasteStyles` merges key by key, one undo step, lock-gated
(`src/engine/commands/commandOperations.ts:318-326`). Same command behind ⋯, canvas
menu, ⌥⌘C/⌥⌘V.
**Missing / bugs**
- Copies **desktop base only** — tablet/mobile overrides and states are not copied.
- **PROVEN — paste ignores the active breakpoint.** `pasteStyles` calls `el.setStyle`
  (base) unconditionally (`:323`), unlike `writeCanvasStyles` (`:294-304`). Probe:
  device = tablet, paste `{color: green}` → base color `green`, tablet rule `{}`. A user
  pasting while on Tablet silently changes Desktop. P1.
- Webflow pastes onto the target's class at the current breakpoint/state
  *(uncertain)*; no class model here, so paste never propagates.

---

## C11 Undo / redo — VERDICT: MATCHES WEBFLOW (mostly) · P2

**What exists**
- One global stack for the whole project (all pages), JSON-patch entries with a full
  checkpoint every 10, max 100 entries (`HistoryManager.ts:1-6, 80-90`;
  `src/shared/constants/config.ts:107`).
- Recording is driven by `PROJECT_CHANGED` (every `markDirty`), coalesced: a 0 ms
  defer then a 500 ms window; transaction labels are merged
  (`HistoryManager.ts:94-127, 177-190`). `beginTransaction/endTransaction` nest and
  emit one change at the outermost end (`Composer.ts:1150-1185`); rollback restores a
  pre-transaction snapshot (`:1187-1213`). Inspector writes are one transaction per
  burst/selection (`useStyleHandlers.ts:316-323, 404-418`).
- Scope = element tree + style rules + design tokens/presets/dark mode; settings and
  metadata excluded and preserved on undo (`HistoryManager.ts:378-436`). Undo keeps
  the active page (`:427-436`). Load resets the stack to one baseline
  (`:131-161`).
**Not undoable**: component definitions ("Element history holds pages, not component
definitions" — `src/engine/components/ComponentManager.ts:48-51`; toast-undo only),
project settings (SEO, custom code), CMS collection items (not in `exportProject`).
Selection and navigation are not history (by design, matches Webflow).
**Risk**: any write path that mutates data without `markDirty` is invisible to undo —
e.g. `Element.setBreakpointStyles` (`Element.ts:369-371`) relies on the accompanying
`setRule` to mark dirty. `collaboration/` corrupts the stack (engine `AGENTS.md`
Pitfalls) — demo-only.

---

## C07 Copy / paste / duplicate (engine) — VERDICT: PARTIAL, with a data-loss bug · P0

**What exists**: `duplicateElement` and `pasteElement` deep-clone `toJSON()` with fresh
ids for the whole subtree (`src/engine/elements/manager/ElementCRUD.ts:227-252, 270-292`;
`ElementManager.ts:365-372`); attributes are deep-copied (fixed shared-reference bug);
layer name gets a copy suffix; CMS bindings follow duplicates
(`src/engine/cms/CMSBindingManager.ts:130`). Page duplicate clones the tree with fresh
ids (`src/engine/elements/manager/PageManager.ts:303`).
**Bug — PROVEN: duplicate / copy-paste drops every responsive override and every
state style from what renders and publishes.** Those live in StyleEngine rules keyed
by the *old* id; cloning assigns a new id and nothing copies the rules (the id-rename
copier `copyIdKeyedStyles` is used only on project import, `Composer.ts:711-716`; no
`ELEMENT_DUPLICATED`/`CLIPBOARD_PASTE` listener touches styles — repo grep). The
`breakpointStyles` mirror *is* cloned, but nothing turns it back into rules. Probe:
heading with base `color:red`, tablet `font-size:22px`, `:hover color:blue` →
duplicate: base kept; tablet rule `{}`; hover rule `undefined`; `toCSS()` does not
mention the clone id; `breakpointStyles` still says `{tablet:{font-size:22px}}`
(so the React export and Connect-to-tokens see an override the site does not have).
Duplicate-and-tweak is the core Webflow workflow; a duplicated card looks right on
desktop and wrong on tablet/mobile/hover. P0.

---

## E02 / E03 Attributes, id, custom attributes, tag, alt/ARIA — VERDICT: PARTIAL · P1

**What exists**
- `attributes: Record<string,string>` per element (`element.ts:42`); every attribute
  is exported except `class`/`style`, filtered by `isSafeAttrValue`
  (`ExportEngine.ts:410-425, 1170-1180`). Engine adds `data-buildrick-id` (and
  `data-buildrick-interactions`) on read (`ElementStyles.ts:66-79`).
- HTML `id` is a plain attribute, separate from the engine id; Attributes section has
  ID / Title / Tab index plus per-type rows (`src/editor/inspector/config/attributeFields.ts:18-20`
  and onward; `src/editor/inspector/sections/attributes/AttributesSection.tsx:39-48`).
- Alt text row on images (`src/editor/inspector/sections/typeBlock/bodies/mediaBodies.tsx:67-71`);
  converting to `img` seeds `alt=""` (`SourceRow.tsx:103-104`).
- Tag choice: heading level h1–h6 only (`typeBlock/bodies/textBodies.tsx:30, 42-56`).
**Missing vs Webflow**
- Custom attribute editor is **add-only** and **forces a `data-` prefix** unless the
  name starts with `data-` or `aria-` (`DataAttributeEditor.tsx:64-77`); it never lists,
  edits or removes existing custom attributes (`:78-103`). So `role`, `itemprop`,
  `rel` on non-links etc. cannot be set; a typo cannot be deleted. Webflow allows any
  attribute name (with a reserved list) and edits/removes them *(reserved list uncertain)*.
- No tag picker for containers (div → section/article/aside/nav/header/footer/main);
  repo grep found no tag control outside headings. Webflow's Div Block has one.
- No validation of the HTML `id` (uniqueness/shape) at the write site seen.

---

## Severity roll-up (Webflow switcher)

| ID | Verdict | Sev |
|---|---|---|
| Data model / export | DIFFERENT MODEL | P1 |
| S01 class styling | MISSING | P0 |
| S03 breakpoints | PARTIAL | P1 |
| S04 states | PARTIAL | P1 |
| S05 value source | PARTIAL | P1 |
| S06 style manager | MISSING | P2 |
| S07 variables | PARTIAL (close) | P2 |
| S08 units/calc/var | PARTIAL | P1 |
| S11 copy/paste styles | PARTIAL | P1 |
| C11 undo/redo | MATCHES (mostly) | P2 |
| C07 duplicate/paste | PARTIAL + data loss | P0 |
| E02/E03 attributes/tag | PARTIAL | P1 |

## Bugs found (status)

1. PROVEN · P0 — duplicate/paste drops breakpoint + state styles (`ElementCRUD.ts:227-292`, `ElementManager.ts:365-372`; no rule copy).
2. PROVEN · P1 — `stylePeers.ts:79` selector typo `data-buildrik-id`: Apply-to-all under any state copies nothing.
3. PROVEN · P1 — `pasteStyles` writes base styles regardless of active breakpoint (`commandOperations.ts:323`).
4. PROVEN (engine) · P1 — `stylesAt` skips the tablet layer for mobile (`commandOperations.ts:254-262`); Inspector values/flex detection wrong on Mobile.
5. PROVEN (output) · P1 — `Composer.exportHTML` inline base styles shadow breakpoint rules (`Composer.ts:822-899`).
6. PROVEN · P2 — style rules of deleted elements are never removed and ship in CSS.
7. Confirmed · P2 — `getGlobalClasses()` called by the class suggestion list does not exist (`CSSClassesSection.tsx:110-113`).
8. Suspected · P2 — imported class rules beat element base styles on publish but lose on canvas.

## Not verified

- No live-app walk (canvas, preview modal at narrow widths) — bugs 4/5 are proven at
  engine/output level only; whether a user sees bug 5 depends on preview surfaces
  rendering `exportHTML` at narrow widths.
- ReactExporter and AI `applySetStyle.ts:406` write paths were not traced.
- Webflow-side claims marked *(uncertain)* were not checked against current docs.
