# Inspector — redesign spec

The right-hand column: the single place to read and change everything about
one selected element.

The audit's inspector lane ends on a sentence worth quoting whole, because it
is the design brief: *"the panel is strong on CSS and weak on everything a
page is made of"* (`UX-D-29`). A slider has no slide list. A form has no
destination. Meanwhile a 185-entry registry sitting in `config/` describes
both editors in detail, and nothing imports it.

That gap — a finished description of the intended panel, and a shipped panel
that is a CSS inspector — is the whole problem. Everything else in this spec
is a consequence of it.

Every claim below was re-read at source. Where the audit or its QA pass was
wrong, it is marked.

---

## 1. What is actually wrong

| | |
|---|---|
| **The entire PROPERTIES map is dead.** `propertiesRegistry.ts` holds **185** property definitions across **31** families (counted by parsing the export). It is re-exported at `config/index.ts:19-22` and **imported by nothing** — a repo-wide grep for `PROPERTIES` and `propertiesRegistry` returns that re-export, two past-tense comments (`registry/index.tsx:124`, `registry/_shared.tsx:177`) and one test comment. No section, no renderer, no hook reads it. | `UX-D-07` |
| **Whole families in it describe surfaces that exist in no panel.** `slider.*` (8), `modal.*` (8), `navbar.*` (7), `tabs.*` (6), `accordion.*` (6), `data.*` (8 — collection, bindField, repeaterEnabled, mapping, filters, sort, limit, emptyState), `a11y.*` (5), `visibilityRules.*` (4), `form.*` (4). | `UX-D-07` |
| — and one of them names a component the product never built: `"navbar.menuItems": { type: "menuEditor" }` (`propertiesRegistry.ts:1037`). The string `"menuEditor"` appears at exactly two lines — that entry and the type union at `:68`. **No renderer.** | QA §6, unfiled |
| **Composite elements have no component editor.** `slider`, `accordion`, `navbar`, `nav`, `list`, `table` all map to `CONTAINER_PROFILE` (`elementProfiles.ts:246-254`); `tabs` is not a key at all, so `getProfileFor` falls through to the same profile and logs a warning (`:283-297`). | `UX-D-08` |
| — and the only non-style section they get is **Element properties**, which for them is `ELEMENT_PROPERTIES.default` — **ID, Title, Tab Index** (`elementProperties/config.ts:316-320`). There is no way to add a slide, set autoplay, choose arrows vs dots, add an accordion item, set single-vs-multiple open, or edit navbar menu items. The user hand-builds the structure by selecting generated children one at a time in Layers. | `UX-D-08` |
| **Forms get five raw HTML attributes and no destination.** Action URL, Method, Encoding, Disable Validation, Autocomplete (`elementProperties/config.ts:210-240`). No email address, no webhook, no success message, no redirect. | `UX-D-09` |
| **The section that would do it is finished, exported, and mounted nowhere.** `FormSettingsSection` self-describes as *"Inspector section for form element configuration"* (`FormSettingsSection.tsx:2`), wires to the engine's `FormHandler` via `useFormHandler` (`:32`), draws seven fields — Form ID, Action, Webhook URL, Success Message, Error Message, Success Redirect, Email Field Name — and is exported at `shared/forms/index.ts:16`. Its only other references are its own test file and a comment in `FormsScreen.emptyCopy.test.ts:13` that already says *"has no consumer, so a user cannot reach it either."* | `UX-D-09` |
| **Two animation systems sit adjacent in every profile.** Interactions: 14 triggers + 39 presets, GSAP runtime (`sections/interactions/types.ts:69-147` — both counts verified by parsing). Animation: no trigger at all, 25 presets in three tabs, one per element, writes the CSS `animation` property (`editor/animation/AnimationEditor.tsx:21-52` — entrance 12 / attention 8 / exit 5). They are adjacent in **all seven** profiles. | `UX-D-14` |
| — **18 preset labels are identical across both lists**, not the 16 the audit filed: Bounce, Fade In, Fade In Down/Left/Right/Up, Fade Out, Flash, Pulse, Rotate In, Rubber Band, Shake, Slide In Down, Slide In Up, Swing, Wobble, Zoom In, Zoom Out. Plus three near-misses a user reads as the same thing: Heartbeat/Heart Beat, Flip X/Flip In X, Flip Y/Flip In Y. Nothing in either section says which one runs on the published page. | QA correction to `UX-D-14` |
| **"All like this" says "on this page" and fans out across every loaded page.** The dropdown's copy is `"No other ${typeLabel}s on this page"` (`ScopeDropdown.tsx:153`) and `"no other ${typeLabel}s here"` (`:159`). The peer set is `composer.elements.getAllElements()` (`:58-67`) — whose own doc comment reads *"Get every registered element, across all loaded pages"* (`ElementManager.ts:151-158`), and whose scope comment at `:525-533` records that `setActivePage` *"never clears or repopulates this registry — the only `clear()` is a full project reset."* The banner says a number, never which pages. | `UX-D-04` |
| **And the mode ends without saying so.** `useEffect([selectedElement?.id])` calls `setReachAll(false)` (`ProInspector.tsx:110-114`). Clicking the next button of the same type — the most likely next action *inside* the mode — silently drops back to "This item". | `UX-D-05` |
| **No search, in a 16-section column.** `CONTAINER_PROFILE.order` is 16 section ids (`elementProfiles.ts:48-65`), most collapsed, several with a further "More settings" disclosure inside. The plumbing exists and is inert: `useAdvancedSettings` takes a `searchQuery` and auto-expands the group that matches (`:88-105`), and `ProInspector.tsx:192` passes `searchQuery: ""` — a literal, so the effect's `if (!searchQuery) return` can never fall through. | `UX-D-10` |
| **No expand-all / collapse-all.** Both are implemented, scoped to the selected element's profile, persisted to `localStorage` (`useInspectorSections.ts:227-249`, returned at `:274-280`) — and `ProInspector.tsx:181` destructures only `{ expandedSections, toggleSection }`. A **second** unused pair exists on `useAdvancedSettings` (`:176-192`). The only expand/collapse wired to a control in the product is the Layers panel's. | `UX-D-11` |
| **No reset on any row, or any section.** The single revert affordance in the panel is the breakpoint strip's per-row undo arrow (`BreakpointOverrides.tsx:104-120`), which exists only when the canvas is on tablet or mobile. On desktop, removing a value means knowing that emptying the field deletes the declaration — which nothing says. | `UX-D-25` |
| — compounded: unset rows are pre-filled from `{ ...defaultStyles, ...computed-off-the-canvas, ...effective }` with no provenance marker (`useStyleHandlers.ts:157-161`), so a value the user authored looks identical to one they did not. | `UX-D-25` |
| **Disabled reasons are computed and then dropped.** `getPropertyStates` builds `{ disabled, reason }` for every blocked property in plain English — *"Inline elements ignore vertical spacing"*, *"Set position to relative/absolute/fixed to edit offsets"*, *"Enable flex/grid to use gaps"*, *"Applies only to flex items"* (`cssContext.ts:150-197`). Spacing forwards only `?.disabled` (`SpacingSection.tsx:248-259`), so four margin/padding boxes on an inline element go grey with no explanation at all. | `UX-D-12` |
| — and where the reason **is** passed, it is a native `title=` on a **disabled** input (`PositionControls.tsx:150,162,172,184`; `FlexItemControls.tsx:61,75,89`). Browsers suppress pointer events on disabled form controls, so the tooltip does not open. Either way the user gets a dead control with no cause. | `UX-D-12` |
| — and two of the reasons can never be reached at all, because the controls they explain are not rendered: Gap lives inside `{isFlexContainer && …}` and the flex-item block inside `{isFlexItem && …}` (`flexbox/index.tsx:100-176`). On a plain div there is no disabled gap row — there is no gap row. | `UX-D-13` |
| **The breakpoint strip has no upper bound.** Every override draws a row **plus** its own full-width tinted banner — *"Overridden on Tablet — Base is 24px"* — unconditionally (`BreakpointOverrides.tsx:85-127`). Ten tablet overrides is twenty stacked blocks in a 300px column, mounted **above** the scroll container (`ProInspector.tsx:501-505` vs the body at `:539-567`), so the whole panel is pushed below the fold on exactly the element the user most needs. No collapse, no summary, no revert-all. | `UX-D-20` |
| **Picking `:hover` changes where every write lands and the canvas does not move.** Nothing forces the state on the selected node — a grep for `force-state` / `forceState` / `data-force` / `pseudo-preview` / `previewState` / `simulateState` returns nothing in the package. The user edits a hover colour and sees it only by physically hovering, which is impossible while dragging a slider. And the dropdown offers all five states on every element type unconditionally (`StateDropdown.tsx:19-27`), including plain containers where three of them can never fire. | `UX-D-21` |
| **Multi-select replaces the whole panel with a toolbar.** Two or more selected short-circuits **before** the breakpoint/state pill row (`ProInspector.tsx:298-310` vs `:420-444`), so the batch write lands on the canvas's current device with nothing on screen saying so. No list of what is selected, no per-row remove, no delete, no group. | `UX-D-03` |
| **The lock is announced and not enforced.** The canvas refuses a locked element and toasts *"This element is locked. Unlock it in the Layers panel."* (`useSelectionBehavior.ts:88,106,134`). The Layers tree has no such check (`useLayerSelection.ts:67-75`) and neither does canvas pick mode (`Canvas.tsx:608-617`). The inspector then renders every control enabled — a grep for `lock` inside `editor/inspector` finds only the word inside CSS `display` values. | `UX-D-02` |
| **The raw-CSS escape hatch cannot be opened.** `all-css` is registered in all seven profiles and gated on `ctx.devMode === true` (`registry/element.tsx:74`), which reads `localStorage["buildrick:dev-mode"]` **at module load** (`featureFlags.ts:17-35`). Nothing in the UI writes that key. The same mechanism hides a second, parallel Border implementation behind another key (`registry/visual.tsx:36`). | `UX-D-22` |
| **The footer's "N of M sections apply" understates the element every time.** `sectionApplies()` reads `entry.styleKeys` (`registry/index.tsx:102-111`), and six sections declare `styleKeys: []` — link, interactions, animation, element-properties, css-classes, all-css. They are structurally incapable of counting. An element with three interactions and four classes reads "2 of 13". | `UX-D-17` |

**The thesis:** the inspector is not a panel that needs reorganising. It is a
**CSS inspector standing in for an element editor**, and the evidence is that
the element editor was fully specified — 185 properties, 31 families, a
`menuEditor` type, a `slidesEditor`-shaped `slider.*` family — and then never
built, while the description was left in the tree where every subsequent audit
rediscovers it as a feature list.

---

## 2. The structural fix, before any pixels

### 2.1 Every element gets a section that edits the ELEMENT

One new section, first in the profile, above every CSS section. It is the one
place a builder differs from a CSS panel, and it is what all seven off-rail
composite types are missing.

| Element | What the first section is |
|---|---|
| slider | slide list — add / remove / reorder — plus autoplay, loop, arrows-vs-dots |
| tabs | tab list, plus default-open |
| accordion | item list, plus single-vs-multiple open |
| navbar / nav | menu items — the `navbar.menuItems: menuEditor` the registry already declares |
| list / table | row/column list |
| form | where it goes (§4) |
| everything else | **nothing** — the section does not render |

That last row is the rule that keeps this honest. `ELEMENT_PROPERTIES` has
type-specific entries for 15 types today and `default` for the rest, and the
default trio — ID / Title / Tab Index — is three raw HTML attributes under a
heading promising the element's own properties (`UX-D-23`). Those three are
**Advanced HTML**, they move under the same disclosure the other advanced
blocks use, and the "Element properties" name is freed for the section that
actually edits the element.

### 2.2 The registry is either the source or it is deleted

185 definitions describing editors that do not exist is not documentation; it
is a trap that has now cost two audits. Two acceptable outcomes, no third:

- **Make it the source.** The sections render from `PROPERTIES`, and the
  families that describe missing surfaces become the build list for §2.1.
- **Delete it**, and let §2.1's editors be declared where the sections
  actually read from.

What must not survive is the current state, where `config/index.ts:19-22`
exports a full description of the intended panel to nobody. `registry/index.tsx:120-131`
already recorded the decision that pointed the other way — *"Sections declare
what they draw"* — which makes the registry's continued export the leftover
half of a migration that finished.

### 2.3 One motion section

Interactions and Animation are the same feature drawn twice, adjacent, in
every profile, sharing 18 identical preset labels. **"Animation" is
Interactions with the trigger `On page load`.** Fold it in: one trigger list,
one preset catalogue, one runtime. A user who has set both on one element
currently has no way to know which one the published page runs.

The preset picker itself needs two things it does not have: the six groups the
constants already declare (`ANIMATION_PRESET_GROUPS`, thrown away by
`ANIMATION_PRESETS` flattening it "for backwards compatibility" and rendered
as one flat 39-item `<select>` at `InteractionEditor.tsx:112-117`), and motion
on hover. Choosing between "Slide Up", "Fade In Up" and "Slide In Up" by name
is guesswork. (`UX-D-15`)

And the trigger list gets cut to what applies to the selected element type.
Fourteen triggers under four headings with no descriptions offers a plain
container "On Focus" and "On Blur", offers every element its own "Page Load",
and includes three separate scroll answers the user must A/B (`UX-D-16`).

### 2.4 Scope must be honest before it is pretty

"All like this" writes to `getAllElements()`. Two acceptable outcomes:

- **Scope it to the active page**, and the existing copy becomes true.
- **Keep it project-wide**, and the copy changes to say so — *"also changes 9
  buttons on 3 other pages"* — with a way to see them before committing.

Either way, the reach is a **working mode**, not a property of one element:
it survives a selection change to another element of the same type, and it
ends explicitly. And **"Whole site" leaves the dropdown entirely** — it is not
a reach, it has no controls behind it, and it renders a takeover card reading
"Editing the whole site" while the pill directly above still reads "This"
(`ScopeDropdown.tsx:113` never receives `wholeSite`). It is navigation to
Brand and belongs where navigation lives. (`UX-D-06`)

### 2.5 Findability is three controls that already exist

Search, expand-all and collapse-all are all implemented and none is called.
This is the cheapest lane in the audit: three hooks, zero new logic, one
header row.

---

## 3. The panel

```
┌─ Inspector ────────────────────── 300 ─┐   --bk-size-inspector
│  ⬚ Button · Hero CTA            🔒  ⋯  │   type · name · lock badge · menu
│  [ This ▾ ]  [ Desktop ▾ ]  [ Base ▾ ] │   reach · breakpoint · state
├────────────────────────────────────────┤
│  ⌕ Search properties              ⌫    │   ← searchQuery, already wired
├────────────────────────────────────────┤
│  ⚠ 6 tablet overrides        ⌄  Revert │   ← ONE row, was 6 rows + 6 banners
├────────────────────────────────────────┤
│  BUTTON                           ⌃    │   ← §2.1 — the element, not its CSS
│  Label   [ Get started        ]        │
│  Links to  [ /pricing        ▾]        │
├────────────────────────────────────────┤
│  Layout                    flex   ⌄    │   collapsed sections carry a pill
│  Size                    120×40   ⌄    │
│  Spacing                  16 all  ⌄    │
│  Typography          Inter · 14   ⌄    │
│  Background          #1A56DB      ⌄    │
│  Border                    none   ⌄    │
│  Corner radius              8px   ⌄    │
│  Effects                  1 shadow⌄    │
│  Motion                2 triggers ⌄    │   ← one section, was two
│  Visibility        hidden on 1    ⌄    │
│  Link                  /pricing   ⌄    │   ← non-CSS sections get a pill too
│  CSS classes          4 classes   ⌄    │
│  Advanced HTML                    ⌄    │   ← was "Element properties"
│  Custom CSS                       ⌄    │   ← was dev-mode-only
├────────────────────────────────────────┤
│  Expand all · Collapse all             │
└────────────────────────────────────────┘
```

**The header is three pills and they all stay put.** Today multi-select
short-circuits above them (`ProInspector.tsx:298-310`), so the one state where
a write hits many elements at once is the one state that does not say which
breakpoint it lands on. The pill row is unconditional.

**The override strip is one row.** Not `n` rows plus `n` full-width banners
stacked above the scroll container. It expands on demand, keeps the per-row
revert inside the expansion, and gains a revert-all. (`UX-D-20`)

**Every collapsed section carries a pill.** Twelve do today; four do not —
Interactions, CSS classes, Element properties and Link — and those same four
never auto-open, because auto-open reads `styleKeys` they do not have. An
element with three interactions, four classes and a link looks, collapsed,
exactly like one with none of them. The pill is a count; a non-zero count
auto-opens the section the way a CSS value does. (`UX-D-26`)

**And the footer count goes away** in its current form. "2 of 13 sections
apply" is arithmetic over `styleKeys`, which six sections do not have. Once
every section reports its own has-content for the pill, the same signal
answers the count — or the count is dropped, because the pills already say it.
(`UX-D-17`)

**Locked draws as locked.** A badge in the header, controls disabled, and one
Unlock button that clears `data.locked` in place. Today the header shows
nothing and every control is live. (`UX-D-02`)

---

## 4. Forms, and one thing the QA pass got wrong

The audit says a form has no destination, and it is right. But the reason
matters for what gets built, and the record needs correcting.

**The QA pass filed an unfiled bonus defect:** *"`FormSettingsSection.tsx:45,54`
writes `element.setData("formConfig", …)`; `ExportEngine.ts:892` reads
`formSettings`. Mounting the orphan section would still not make a form
deliver anything."*

**That is wrong.** `ExportEngine.ts:892` is the *return type* of
`collectFormElements`, not a read. The read is `ExportEngine.ts:899` —
`if (element.type === "form" && element.data?.formConfig)` — and `:900-931`
converts `formConfig` into `formSettings`, routing Formspree URLs to the
`formspree` provider and everything else to `custom`. The exporter reads
exactly the key the section writes.

**The real defect is narrower and worse.** The exporter only emits anything at
all when `formConfig.webhookUrl` is truthy (`ExportEngine.ts:909`). The
section's Action select offers three values — Store Submission, Send to
Webhook, Send Email (`FormSettingsSection.tsx:104-113`) — and the Webhook URL
field renders **only** when Action is `webhook` (`:115-131`). `handleCreateForm`
seeds `action: "submit"` (`:52-56`). So:

> A user who mounts this section, clicks Create, and fills in a success
> message has configured a form that exports **nothing**. Two of the three
> Actions the control offers are dead at the exporter.

Three consequences for the design:

1. **The section is mounted, and its Action list is cut to what ships.** One
   destination the user can name — an email address or a webhook URL — not a
   three-way choice where two options do nothing.
2. **The form's destination must be editable without knowing what an "action
   URL" is.** The five raw HTML attributes at `elementProperties/config.ts:210-240`
   move under Advanced HTML; the destination is the first section (§2.1).
3. **The section cannot be mounted as written.** It is built from raw
   `<select>` / `<input>` with inline `style` objects
   (`FormSettingsSection.tsx:95-170`) — the DS contract's forbidden move.
   `shared/forms/` escapes Gate 24 today only because the gate scans
   `packages/editor/src/editor` (`ds-grep-gates.sh:596-620`); moving the file
   into `editor/inspector/` fails the build at zero tolerance. It is a rebuild
   on `@/editor/chrome-ui`, not a `git mv`.

---

## 5. Interaction detail

**Search filters rows across every section and opens the ones that match.**
The `searchQuery` path is already written for it, including the auto-expand
effect it currently starves (`useAdvancedSettings.ts:88-105`). Clearing it
restores the previous open set.

**Disabled says why, visibly, and offers the fix.** The reason goes under the
row as helper text, never in a `title=` on a disabled control. Where the cause
is one-click fixable it becomes a button — the pattern is already in the tree:
`EnableFlexPrompt` does exactly this when the container is not flex. And the
rows currently hidden behind `{isFlexContainer && …}` / `{isFlexItem && …}`
render **disabled with their reason** instead of not rendering: a control the
user can see and cannot use teaches; a missing control does not.
(`UX-D-12`, `UX-D-13`)

**Authored values are marked; every authored row clears in one click.** The
style object is `{ ...defaultStyles, ...computed, ...effective }` with no
provenance, so a default and a decision look the same. Marking them is the
half that makes the panel legible; the clear is the half that makes it
reversible. Emptying a field already deletes the declaration
(`useStyleHandlers.ts:193-200`) — the control just needs to say so.

**Picking a pseudo-state forces it on the canvas.** A data attribute the
canvas CSS mirrors, held while the state is selected. Without it, editing a
hover colour is editing blind. And pseudo layers get the same "what this state
overrides" strip the breakpoints have — a `:hover` rule written last week is
invisible today unless someone thinks to pick `:hover`; the only cue is a 5px
dot on the pill. (`UX-D-21`)

**The state list is filtered by element type.** `:focus`, `:active` and
`:disabled` are offered on plain containers where they cannot fire.

**Multi-select gets the single-selection's context.** The pill row, a list of
what is selected with per-row remove, and the destructive/structural actions
the single-selection ⋯ menu already has. (`UX-D-03`)

**Destructive actions in this panel pick one rule.** Deleting an interaction
is a bare red button with no confirmation and no undo hint
(`InteractionEditor.tsx:172-179`); deleting the **element**, in the same
panel, opens a modal that names it and says Ctrl+Z will bring it back
(`DeleteConfirmModal.tsx:28-63`). Both go through composer transactions and
both are equally undoable. Given the modal already tells the truth about undo,
the cheaper answer is a toast with Undo for both. (`UX-D-28`)

**Duplicate class input responds.** Typing an already-applied class hits an
early return that skips the field clear, so the text sits there and the only
report is a dev-console warning (`CSSClassesSection.tsx:74-88`). Flash the
existing chip and say "already applied", or clear the field silently. Either
way the control must respond. (`UX-D-24`)

**Custom CSS ships to everyone.** It is the standard escape hatch in every
competitor, it is registered in all seven profiles, and it is currently behind
a `localStorage` key nothing in the UI writes. When the panel has no control
for a property, this is the only way out. Ship it as a normal collapsed
section and resolve the two Border implementations to one. (`UX-D-22`)

**Visibility declares its real keys.** The section writes `--hide-${breakpointId}`
(`VisibilitySection.tsx:36-45`) while its registry entry declares
`['display','visibility','opacity','pointer-events']` (`registry/effects.tsx:128-132`).
So it auto-opens whenever the element merely has a display value, and an
element whose *only* setting is "hidden on mobile" does not auto-open at all.
The write itself is honoured end to end (`Canvas.css:763-767`,
`ExportEngine.ts:126-128`) — this is a labelling defect, and the fix is
declaring `--hide-desktop/tablet/mobile`. (`UX-D-18`)

---

## 6. What this does NOT do

- **No new property controls.** Every CSS section listed in §3 exists today.
  The only new section is §2.1's element editor, and its content comes from
  the registry that is already written.
- **No new preset catalogue.** The 39 GSAP presets already have full
  cross-layer coverage — `presetCoverage.test.ts` passes, so each has a GSAP
  timeline, a canvas keyframe and an export keyframe. Merging Animation into
  Interactions removes a list; it writes none.
- **No new trigger types.** The 14 exist. §2.3 filters and describes them; it
  adds nothing except the `On page load` trigger that "Animation" already is.
- **No new form backend.** `FormHandler`, `formConfig` and the exporter's
  Formspree/custom routing are all built and wired
  (`ExportEngine.ts:899-931`). What is missing is a mounted control and an
  Action list that matches what the exporter honours.
- **No new search, expand or collapse logic.** All three hooks exist
  (`useAdvancedSettings.ts:88-105,176-192`, `useInspectorSections.ts:227-249`).
  This spec calls them.
- **No new panel width.** 300, `--bk-size-inspector`, per `SPEC-NAVIGATION.md`
  §5.2. The override strip's fix is a collapse, not a wider column.
- **No AI affordance beyond the one door.** The `✦ AI` chip stays, but per
  `UX-D-01` it currently **replaces** the inspector and selecting an element
  afterwards does not bring it back (`StudioPanels.tsx:495-501` clears the
  flag only from `onClose`/`onBack`). That is `SPEC-NAVIGATION.md` §2.5's
  decision — one AI home, docked beside the inspector rather than over it —
  and this spec inherits it rather than re-deciding it.
- **No change to Layers.** The `T`/`M` breakpoint badges that can never render
  (`useLayerTree.ts:88-95` never populates `breakpointOverrides`) are Layers'
  defect to fix; this spec only requires that what the inspector hides per
  breakpoint has an echo somewhere.

---

## 7. Acceptance

Observable in the running app at 1440×900. A green test is not acceptance —
this repo has shipped three passing suites over a broken feature.

1. **A slider can be given a second slide from the inspector**, without
   selecting a generated child in Layers. Same for a tab, an accordion item,
   and a navbar menu item.
2. **A form can be pointed at a destination by someone who does not know what
   an action URL is**, and a test submission arrives. Verified by exporting
   and submitting, not by reading `formConfig`.
3. **`PROPERTIES` is either imported by a section or deleted.** Grep
   `propertiesRegistry` across `packages/editor/src`: either it has a
   production consumer, or the file is gone. The current state — exported at
   `config/index.ts:19-22`, imported by nothing — fails.
4. **There is one motion section** and one preset list. Grep for
   `AnimationEditor`: it is either the motion section or absent.
5. **Typing "radius" in the inspector search opens Corner radius** on a
   container whose sections are all collapsed.
6. **Expand all opens all 16 sections of a container profile; collapse all
   closes them**, and the state survives selecting another container.
7. **Every authored value has a one-click clear, and looks different from a
   default.** Set a padding, reload, and the two are still distinguishable.
8. **A disabled control states its reason without hovering.** Select an inline
   element: all four margin/padding boxes carry visible text. Select a plain
   div: the gap row is *present and disabled with its reason*, not absent.
9. **"All like this" says which pages it will touch**, and the mode survives
   clicking the next button of the same type.
10. **Editing a `:hover` colour changes the canvas** while the state pill is
    on `:hover`, without the pointer over the element.
11. **A locked element cannot be edited from the inspector**, reached from
    Layers or from canvas pick mode, and the header says why with an Unlock.
12. **Ten tablet overrides do not push the first style control below the
    fold.** Measured, not eyeballed — the panel is 300px wide and at 2× an
    8px error is invisible.

### The code fixes this design cannot paper over

| # | Fix | Where |
|---|---|---|
| 1 | Composite types need real profiles; `tabs` is not even a key in `PROFILE_MAP` | `elementProfiles.ts:246-254`, `:283-297` |
| 2 | `FormSettingsSection` must be rebuilt on `chrome-ui` before it can be mounted (raw `<select>`/`<input>` + inline styles fail Gate 24 inside `editor/`), and its Action list cut to what `ExportEngine.ts:909` honours | `FormSettingsSection.tsx:95-170`, `ds-grep-gates.sh:596-633` |
| 5 | `searchQuery: ""` is a literal — the auto-expand effect can never fire | `ProInspector.tsx:192`, `useAdvancedSettings.ts:88-89` |
| 6 | `collapseAll` / `expandAll` are returned and never destructured | `ProInspector.tsx:181`, `useInspectorSections.ts:274-280` |
| 7 | The style object carries no provenance — defaults, computed and authored are merged flat | `useStyleHandlers.ts:157-161` |
| 8 | Spacing forwards `?.disabled` and drops `reason`; Position/FlexItem put `reason` in `title=` on a disabled input | `SpacingSection.tsx:248-259`, `PositionControls.tsx:150-184` |
| 9 | Peer set is `getAllElements()` — every loaded page, by the registry's own doc comment | `ScopeDropdown.tsx:58-67`, `ElementManager.ts:151-163` |
| 10 | No forced-state mechanism exists anywhere in the package | grep `forceState` / `previewState`: zero hits |
| 11 | Lock is enforced in `useSelectionBehavior` only; Layers and pick mode both bypass it | `useLayerSelection.ts:67-75`, `Canvas.tsx:608-617` |

Items 1, 2, 9, 10 and 11 are not drawings. Until they land, the panel cannot
tell the truth about what it is editing, and this spec should not be drawn as
though it can.
