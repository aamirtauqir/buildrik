# Class-first styling: design and engineering spec (BD-30)

**Date:** 2026-10-20 · **Decision:** BD-30 (owner, 2026-10-20). Styling becomes class-first, Webflow-like.
**Status:** Q1–Q10 and phases accepted by the owner under BD-38 (2026-10-20). Native CF01–71 design specimens added 2026-10-21; sampled independent review only. Application implementation and runtime verification are not established by this design pass.
**Mode:** AUDIT_AND_DESIGN, with explicitly authorized Figma output. No application code was changed in this design pass.
**Code read:** worktree `~/Desktop/buildrik-worktrees/phase1-integration`, branch `feat/phase1-integration` @ `6dbe51b25` (AI removed, Phase 1 and latest fixes; this is what will ship). Unless stated otherwise, `file:line` anchors are relative to `packages/editor/src/` in that tree. `shared-pkg/` means `packages/shared/`.
**Leads:** `README.md`, `evidence/C1`, `evidence/C3`, `evidence/W`, `FLOW-SENSE.md` in this folder. Those files were written against `main` @ `19f964d5e`. Wherever this branch differs from them, this spec says so.
**Authority:** PRODUCT-DESIGN-BRIEF decisions stay as approved. This spec places class-first inside them and does not reopen them: BD-01/05 (rail and Brand), BD-08 (Content / Style / Behaviour / Effects; Style starts with **Classes**), IA-02 (shared Undo), IA-06 (scope visible), SC-21 (no AI). BD-30 replaces one clause of BD-08 (INS-D01, "class membership is separate from an unevidenced class-definition authoring engine"). BD-30 now *is* that engine.

---

## 0. Summary

- **Model.** A class owns styles. A rule is keyed by **selector × breakpoint × state**. A selector is one of three kinds: a tag (`body`, `h1`…), a class chain (`.card`, `.card.is-dark`), or one element ("this element only", the existing per-element store). Desktop-first cascade, three breakpoints, five states. Tokens bind the way they do today, with `var(--buildrick-design-<id>)`.
- **Engine.** No second rule store. Class and tag rules are ordinary `StyleEngine` rules, which already render, export, undo and validate generic selectors. Two things are added: a derived **class registry** (names, order, counts) and a **cascade ladder** that orders and weights layers so that tag < class < combo < element-local everywhere: canvas, Preview and publish.
- **Migration.** **(c) Hybrid.** Existing per-element styles stay as "this element only" with no visual change, and classes are used from the switch onward. Conversion of existing styles is opt-in and previewed ("Make class from this element", "Find matching styles"). There is no auto-conversion on load. A server-owned `Site.styleModel` column and env flags (`CLASS_STYLES`, `CLASS_STYLES_WORKSPACES`) give the same staged rollout `BRAND_TOKENS_V2` uses.
- **Phases.** P0 foundations, P1 base classes, P2 combos and indicators, P3 Style selectors manager, P4 tag styles and insert defaults, P5 conversion and cross-project paste, P6 rollout. Sizes are in §6.

---

## 1. The model

### 1.1 Today (verified on this branch)

| Fact | Anchor |
|---|---|
| An element carries `classes?: string[]` (names only), `styles` (desktop base) and `breakpointStyles` (a mirror) | `shared/types/element.ts:44,46,48` |
| Desktop styles go to the element. Tablet and mobile go to a `[data-buildrick-id="<id>"]` rule inside a media query | `engine/commands/commandOperations.ts:288-302` (`setStyleAt`); `engine/styles/StyleEngine.ts:195-228` (`setBreakpointStyle`) |
| A state goes to a `[data-buildrick-id]:<state>` rule | `editor/inspector/hooks/useStyleHandlers.ts:278-298` |
| Selector helper (one place) | `shared/utils/elementSelector.ts:11` |
| `StyleEngine` is a generic `selector|mediaQuery → properties` store, with `setRule` taking `pseudo`/`replace` | `StyleEngine.ts:31-32, 86-121` |
| `computeStyles`/`getClassStyles` read `.class` rules, with **zero callers** outside the file | `StyleEngine.ts:719-772` (repo grep, this branch) |
| The class field adds and removes names only. Its suggestions call `styles.getGlobalClasses()`, which does not exist, so the list is always empty | `editor/inspector/sections/CSSClassesSection.tsx:111-114, 117-130` |
| Class names are parsed by splitting on whitespace and commas and stripping a leading `.`. They are not validated against CSS grammar | `CSSClassesSection.tsx:38` |
| Brand › Classes lists names and "used N×" from the tree, and says there is no class detail | `editor/design-system/ui/sections/ClassesSection.tsx:1-23, 34` |
| The class section sits in **Behaviour**. The inspector has 3 tabs; BD-08's Content tab is not built | `editor/inspector/config/sectionOrder.ts` (`BEHAVIOUR_ORDER` holds `css-classes`); `sections/registry/_shared.tsx:46-50` |
| Precedence for one element: base → base:state → tablet → tablet:state → mobile → mobile:state, implemented once and shared | `engine/styles/ResolvedStyle.ts:1-53` |
| Canvas, Preview and publish share one base-layer generator (plan D10). The canvas renders base as a `[data-buildrick-id]` rule, not inline | `engine/styles/cascadeCSS.ts:74-115`; `StyleEngine.ts:679-685` |
| Inserting a block writes type defaults **as element-local styles** | `blocks/blockRegistry.ts:343-355` (`applyTypeDefaults`) |

The C1 bugs have moved on this branch: duplicate and paste now copy rules (`engine/elements/ElementManager.ts:395-400`, called at `ElementCRUD.ts:239, 288`); paste writes at the active breakpoint (`commandOperations.ts:336-347`); mobile reads include tablet (`commandOperations.ts:273-280`); the stylePeers typo is gone (`engine/commands/stylePeers.ts:85,107` use `elementSelector`). These were **read in code, not re-run live**.

### 1.2 Target model

**Selector kinds.**

| Kind | What it is | Stored as (StyleEngine `selector`) | Who sees it |
|---|---|---|---|
| **Tag** | Site default for an HTML tag: Body (all pages), All H1–H6, Paragraph, Link, List, Image, Button, Form field, and so on | `body`, `h1`, `a`, … (bare type selector) | Brand › Classes, "Tags" group |
| **Base class** | First class on an element | `.card` | Selector field and manager |
| **Combo class** | Any class after the first on an element. Applies only where the whole chain is present, and inherits from everything before it | `.card.is-dark` (compound, in chain order) | Selector field (shown as `card` + `is-dark`) |
| **Element-local** ("This element only") | The existing per-element store. Kept for migrated styles and deliberate one-offs | `ElementData.styles` + `[data-buildrick-id="<id>"]` rules (unchanged) | Selector field, "This element only" mode |

**What a class is.** A name plus a set of rules. It has no stable id. HTML truth is the name in `element.classes`, which keeps HTML paste and import working (§2.3). Whether a class is base or combo depends on its **position on an element**, not on the class itself. This is Webflow's rule (W S01): `is-dark` is a combo on `.card.is-dark`, and may also be used as a base elsewhere. When it is used as a base its rules are keyed `.is-dark` and are separate from `.card.is-dark`.

**Rule key.** `selector × breakpoint (desktop | tablet | mobile) × state (normal | hover | focus | active | disabled)`. This maps 1:1 onto the existing `StyleData {selector, mediaQuery, pseudo}` (`shared/types/style.ts:13`). No new key type is needed.

**Ordering.** Element chain order is author order: the first chip is the base. Reordering chips changes which rules apply, so P1 does not allow reordering. Removing the base demotes the first combo to base, which brings its own base rules into effect. The UI warns about this (§3.4).

**Cascade (what wins).** This order applies at every breakpoint and in every state:

`tag` < `base class` < `combo (longer chain wins)` < `element-local`

Within a layer the existing D10 order applies: desktop, then tablet, then mobile, and state over plain (`ResolvedStyle.ts`). Across layers, a **higher layer wins even against a lower layer's state or breakpoint**. Example: an element-local desktop `color` beats `.btn:hover`'s `color`. This is a deliberate difference from Webflow. It is explained in §1.4 and listed as owner question Q3.

**Inheritance from parents.** Typography and colour inherit through the DOM, as in CSS. The inspector attributes the value to the parent's selector (§3.3).

**Tokens.** Unchanged. A value bound to a token is `var(--buildrick-design-<id>)` (`editor/inspector/shared/tokenBindingDetection.ts:19`). It may appear in any layer. Token usage already reads every rule (`engine/Composer.ts:994` recomputes from `styles.exportStyles()`), so class rules are counted without changes. "Connect to tokens" (`engine/designSystem/connectTokens.ts`) rewrites element base and breakpoint values only, and must be extended to class and tag rules (P2).

### 1.3 Webflow parity

| Webflow rule (W) | Buildrick class-first |
|---|---|
| Classes own styles; edit once, all change (S01) | Same |
| Combo inherits from base; edits affect only that chain (S01) | Same. Chain depth is capped at **3 classes** (Webflow advises one level of combo), which keeps the specificity ladder bounded (§4.2) |
| Tag styles, pink (S01) | Same set, minus Localize-only tags. Lives in Brand › Classes › Tags |
| Removing a class from an element keeps it on the site (S01) | Same. Unused classes are listed for clean-up |
| Duplicate class gives an independent copy (S01) | Same |
| Names are case-insensitive, start with a letter, special characters become hyphens (S01) | Same rule, normalised to lower case (§4.3) |
| Orange inherited, blue set here, pink local, red strikethrough for a hidden base value (S05) | Same *meanings*, with different hues (DESIGN.md single accent; purple banned, Gate 18). Each indicator is shape + text, not colour alone (§3.3) |
| States per selector (S04) | Same, with today's 4 states. `focus-visible` is the first candidate to add (StyleEngine already recognises it) |
| Auto-class on first edit (S01) | **New class-mode sites only** (Q1). Migrated sites never auto-create |
| Pink element-local only for grid placement and Quick Stack | **Deliberate difference.** "This element only" is a first-class mode, because migrated sites hold all their styles there and because one-offs are common in small sites |
| 6–7 breakpoints, custom (S03) | **Deliberate difference.** Stays at 3 (`shared/types/breakpoints.ts:15`). Out of scope |
| No copy/paste style command (S11) | **Kept.** Copy and paste style stay, and write to the current selector scope (§2.4) |
| Variables with modes and collections (S07) | Out of scope. Tokens as today |

### 1.4 Why element-local is the top layer

1. **Migration safety.** Every existing site is 100% element-local. If classes could override local values, a class added later would silently do nothing wherever a local value exists (today's W3 dead end, inverted). If local values could be overridden by classes, migrated elements would restyle when a class is added. Putting local on top means adding a class to a migrated element **never changes a value the user set**, and the inspector shows exactly which values block it (§3.3, red strikethrough, "Move to class").
2. **Predictability.** "This element only" is a promise. It should hold in every state and at every breakpoint.

The cost is that a local value shadows a class's hover value too. The inspector shows this as "shadowed by this element's own value" and offers "Move this element's values to the class".

---

## 2. Engine and data

### 2.1 Element model

There is **no change to `ElementData`** (`shared/types/element.ts:34-79`). `classes` stays a name list, and `styles`/`breakpointStyles` stay the element-local store. This is intentional, so that templates, HTML import, components and the server re-id path keep working untouched.

### 2.2 Rule storage: StyleEngine stays the single store

- Class and tag rules are `StyleData` entries with selectors built by **one new helper**, `classSelector(chain: string[], tag?: string)`, beside `elementSelector` in `shared/utils/`. It is the only place a class selector string is built, which avoids the 16-place hand-building `elementSelector` was introduced to stop (`elementSelector.ts:1-10`).
- **Class registry, derived rather than stored.** `composer.classes` (a new manager, engine-only) exposes `list()` (name, first-seen order, element count per page and site, rule count), `elementsUsing(chain)`, `rename(old, new)`, `duplicate(name)`, `deleteIfUnused(name)`, `removeUnused()`. It is computed from `element.classes` plus rule selectors. It replaces the missing `getGlobalClasses()` (`CSSClassesSection.tsx:111-114`) and the tree tally in `ClassesSection.tsx`. Because nothing new is persisted, a stale editor that drops unknown fields cannot lose class data.
- **Writes.** A new `setClassStyleAt(composer, chain, bp, state, prop, value)` sits beside `setStyleAt` in `engine/commands/commandOperations.ts` and follows its contract: no lock check, no transaction, callers wrap it. A class write is **not** an element write, so the element lock gate does not apply. Instead, a class is writable only if `composer.readOnly` is false (`engine/Composer.ts:145`) and the class is not used by a locked element, or the user confirms (Q6).
- **Ordering at render.** `StyleEngine.generateResponsiveCSS` (`StyleEngine.ts:361-427`) emits rules in insertion order inside each breakpoint bucket. It gains a stable sort by layer: tag → class (chain length ascending) → element-local. That is the only change to that method. The specificity ladder (§4.2) is applied when selectors are emitted, so canvas (`canvasCSS`, `StyleEngine.ts:679-685`) and publish (`ExportEngine.ts:789-795`) agree by construction.
- **Resolution for the inspector.** `ResolvedStyle.resolveStyle` (`ResolvedStyle.ts:39-53`) takes a `StyleLayerSource` with base, breakpoint and state. It is extended to a list of sources (tags → classes in chain order → local), each resolved with the existing D10 rule, and it returns **value plus origin** (`{value, from: {kind, selector, breakpoint, state}}`). The indicators (§3.3) need the origin. It stays pure, with no DOM, so it can be tested without a browser.
- **Hygiene that becomes mandatory.** Element-local rules of deleted elements are still never pruned: no `removeRule` caller exists outside StyleEngine (repo grep on this branch; C1 S06 PROVEN on main). For class rules, "unused" is a user-visible manager state, so local-rule pruning on delete must land in P0, otherwise the "unused" count is wrong.

### 2.3 Project schema, version and migration

| Today | Change |
|---|---|
| `ProjectData.version` is hard-coded `"1.0.0"` on export (`engine/Composer.ts:798`) | Leave it. It is not a real version |
| `dsSchemaVersion` is the DS migration counter, target 3 (`engine/designSystem/migrations/projectMigrations/index.ts:19`; runner `engine/migration/MigrationManager.ts:25`) | **Do not** reuse it for the style model, because it has its own meaning and rollback |
| `brandTokensV2` / `tokensMigrationHold` are server-owned site columns read at load (`services/BuildrikSyncProvider.ts:732-733`; `shared/types/project.ts:70-72`) | **Add `styleModel: "element" | "class"`** the same way: a `Site.styleModel` column (default `"element"`), read at load into `composer.styleModel`, and never trusted from the client payload |
| Save schema accepts `styles: z.array(z.unknown())` (`shared-pkg/schemas/sites.ts:353`) | Add an optional `styleModelAck: "class"` on the editor save. The server **refuses** a save on a class-mode site that lacks it (CONFLICT "editor out of date — reload"). This blocks a stale tab with old ordering from saving over class data. It follows the existing version-guard pattern of `designTokensSchemaVersion` (`server/services/brand-tokens.ts:43-55`) |
| Rules are validated on import against the shared selector grammar (`StyleEngine.ts:452-479`; `shared-pkg/schemas/element-markup.ts:175, 195`) | The grammar already accepts `.a.b`, bare tags and `:hover` (`CSS_IDENT` at `element-markup.ts:142`). No grammar change. Add a unit test pinning that every `classSelector()` output passes `isSafeCssSelector` |

**Migration on switch (element → class).** There is no data rewrite. Flipping `Site.styleModel` changes only rendering order and the inspector. A rollback flips it back, and old rendering returns because no data moved. Class rules made while in class mode then render in legacy order (class ties local by specificity and wins by order). That can change visuals. Rollback therefore shows a warning that lists affected classes (P6).

### 2.4 Undo and history granularity

- The undo snapshot already includes all style rules (it keeps `exportProject().styles`; `engine/HistoryManager.ts:378-396`), so class rules are undoable without new code.
- One user gesture is one transaction, matching today's `style-change` burst (`useStyleHandlers.ts:318`). Concretely:
  - A class value edit is one step, however many elements change.
  - Rename is one step (registry rename + every `element.classes` + every rule selector).
  - Duplicate class is one step (new rules + swap on the selected element).
  - Delete unused is one step; "Remove all unused" is one step.
  - "Move this element's values to class" is one step (writes class, clears local).
  - "Make class from this element" is one step.
- The toast for multi-element consequences says the count: "Updated .card on 12 elements · Undo".
- Coalescing: class edits use the same 500 ms window. Two different classes edited within 500 ms must not merge their labels in a misleading way. Label as the last class.

### 2.5 Copy, paste and duplicate

| Action | Classes | Element-local |
|---|---|---|
| Duplicate (⌘D), copy/paste in the same site | **Shared**. The copy keeps the class names, and the rules already exist | **Copied** to the new id (existing `copyStyleRules`, `ElementManager.ts:395-400`) |
| Page duplicate | Shared | Copied (`PageManager.ts:338`) |
| Paste HTML from outside | Class names land in `classes`. If the site has no rules for them, they style nothing (same as Webflow), and the manager lists them as "no styles" | Inline `style=` becomes element-local, as today |
| Template insert, component package import (BD-17), future cross-site paste | **Conflict rule, Webflow C07:** same name with identical rules is merged; same name with different rules is renamed `name-2` on the incoming side; a new name is added | Copied |
| Copy style / Paste style (`engine/commands/defaultCommands.ts`, `commandOperations.ts:336-347`) | **Writes to the current selector scope.** With a class selected, paste goes into that class at the active breakpoint and state. The confirmation names the scope ("Paste into .card · Tablet · affects 12 elements") | With "This element only", today's behaviour |
| Reset style (`defaultCommands.ts:226`, which clears **base only** today) | "Reset .card at Tablet" clears that class's values at the current breakpoint and state, with a count warning | "Reset this element" clears base **and** local breakpoint/state rules (fixes the partial reset) |
| "Apply style to all {peers}" (`stylePeers.ts:92-107`) | In class mode it becomes **"Add class .x to all {peers} on this page"**, a live link instead of a copy | Kept in element mode only |

### 2.6 Components and instance overrides

- A component master is an `ElementData` tree (`shared/types/components.ts:31`). Its classes are names, and class rules are site-global. So class styles inside a component apply to every instance **and** to every non-component element with that class. This is Webflow parity.
- Instance overrides are recorded when `Element.setStyle` runs (`engine/elements/ElementStyles.ts:131-160` → `recordInstanceOverride`, kinds at `components.ts:138-141`). Class writes do not call `setStyle`, so **a class edit is never recorded as an instance override.** This is correct, but it must be shown in the UI:
  - When the selection is inside an instance, class **membership** is read-only. **Open component** navigates to the existing definition detail with an exact return; it does not imply a new master-editing canvas. Editing a shared class through Brand is a sitewide class operation, with usage/consequence disclosure, never an instance override.
  - "This element only" stays available on instances and keeps writing instance overrides. This preserves the existing capability.
- **Push to master** is a separate consequential command, available only on an instance root (BD-32). Confirm the definition and affected instances; preserve the current local state on pending/failure. A child can never replace the definition. Open component remains navigation on root or child.
- Component definitions are not on ⌘Z (`engine/components/ComponentManager.ts:48-56`). Class rules are on ⌘Z. A master update plus a class edit therefore undo separately. This is a known limitation, tied to IA-02.
- *Suspected, not traced:* whether instantiation carries the master's `[data-buildrick-id]` **state** rules. `masterTree` holds only `ElementData`, which has base styles and the breakpoint mirror. Class-first removes this gap for anything styled by class.

### 2.7 CMS-bound elements

- A collection-list item is one template element repeated. In class mode, the published CSS is one `.card` rule for N items, instead of one per template id.
- Style-row binding (BD-22 binds Style rows such as background image) writes **per item**. A bound value is item data, not a class value. Rule: **a CMS-bound property is always element-local.** The class value stays as the fallback, and the indicator says "Bound to {field}; class value used when empty". Webflow behaves the same way (bindings sit on the element).
- *Not verified:* how `CMSExportResolver` clones template elements and ids. Before P1, it must be confirmed that repeated items keep the user class names in `class=""`.

### 2.8 Collaboration and ops (flag off, planned)

- Collab is demo-only and fenced (`src/engine/AGENTS.md` Pitfalls). Ops are untyped payloads (`shared-pkg/schemas/collab.ts:56-66`).
- Class-first **widens the blast radius** of one op: a class edit changes many elements, so two people editing different elements that share `.card` now conflict. The planned OT/CRDT arc must treat a rule (`selector|mq|pseudo|property`) as the unit of merge. **Do not** treat the element as that unit for class rules. This is recorded for that arc. Nothing is built now.

---

## 3. Inspector UX

### 3.1 Where it lives (no IA reopened)

- **Selector field:** the first group of the **Style** tab, which is where BD-08 puts "Classes". It sits directly above the existing context row ("State: Base ▾ · Tablet · N overrides"; `editor/inspector/components/ContextRow.tsx`). The **same selector + context row** renders on **Effects**, which already shows the context row (`ProInspector.tsx:311, 343`), because Effects values are class-scoped too. There is one component and one value. Effects shows the same scope, not a second selector. Behaviour and Content are not styles and do not show it.
- The Behaviour › "CSS classes" section (`sectionOrder.ts`, `BEHAVIOUR_ORDER`) is **removed** in class mode. In element mode, FS-05's interim recommendation applies: rename it "Class names (for custom code)", move it to Behaviour › Advanced attributes, and add one line saying it does not style.
- **Style selectors manager:** **Brand › Classes** (the existing destination, `ClassesSection.tsx`), extended. There is **no new rail entry**, consistent with BD-01/05 (Brand owns site-wide design resources). The selector field's ⋯ has "Open in Brand › Classes", and the manager's "Select elements" returns to the canvas. Return follows IA-07.

### 3.2 Selector field

```
Selector   [ card ][ + is-dark ]  [+]     ⋯
           12 on this page · 31 on site                    (count line)
State: Base ▾   ·   Tablet · 3 overrides · Revert         (existing context row)
```

| Action | Behaviour | Writes |
|---|---|---|
| Type in the field, Enter | Suggestions are existing classes, filtered, most-used first. Enter on an existing class applies it. Enter on a new name creates it. Invalid input shows an inline error before creation (§4.3) | `element.classes` (one undo step) |
| Add a second chip | It becomes a combo. Chip text is `+ is-dark`. Comma or Enter chains another (cap 3; at the cap: "Up to 3 classes — use a new class instead") | `element.classes` |
| Click a chip | Opens chip menu: Rename…, Duplicate as new class, Remove from element, Select all elements using it, Open in Brand › Classes | — |
| **This element only** (toggle at the field's right) | Switches edits to element-local. Chips dim, and the field says "Editing this element only". With no classes, this is the only scope and the toggle is not shown | `ElementData.styles` / `[data-buildrick-id]` rules (today's paths) |
| No class, class-mode site, first style edit | Q1 (recommended): auto-create a class named after the element type (`heading`, `heading-2`, …), show the chip and a toast ("Created class .heading · Undo"). On a migrated site the edit stays local | Class rule, or local |
| Remove a chip | Removes the name from this element only. If it is the base and combos remain, a confirm explains "is-dark becomes the base class; its styles change" | `element.classes` |
| Rename | Site-wide. The dialog shows "Renames on 31 elements, 4 pages". Name collision is refused ("A class named hero already exists — merge?" is **not** offered in P1) | All `element.classes`, all rule selectors |
| Duplicate as new class | Creates `card-2` with copied rules and replaces the chip on **this element only**. The duplicate is independent (S01) | New rules + `element.classes` |

**What a style edit writes:**

| Selector state | Edit goes to |
|---|---|
| Class chain, "This element only" off | Rule for the **full chain** (`.card.is-dark` when a combo is present, otherwise `.card`) at current breakpoint × state |
| "This element only" on | Element-local, at current breakpoint × state (unchanged code paths) |
| Element is a component instance | Element-local only (§2.6) |
| Property is CMS-bound | Element-local binding (§2.7) |

### 3.3 Inheritance indicators

The existing `OverrideKind = "breakpoint" | "pseudo" | "master"` (`editor/inspector/shared/controls/InspectorFieldContext.tsx:19`; reset labels `OverrideDot.tsx:38-40`) is extended from "overridden here" to **"where this value comes from"**. The data comes from `resolveStyle` with origin (§2.2).

| Meaning (Webflow colour) | Buildrick treatment | Click |
|---|---|---|
| **Set here**: this selector, this breakpoint, this state (blue) | Accent label + filled dot | Menu: Reset (⌥-click resets directly) |
| **Inherited**: from the base class, a larger breakpoint, a tag, Base state, or a parent's typography (orange) | Warning-role label + hollow dot. Tooltip: "Inherited from .card · Desktop", or "from parent Section (.hero)" | Menu: Go to source (selects that class/breakpoint/state, or selects the parent) |
| **This element only** (pink) | Neutral-strong label + square marker. Shown when a local value beats the class | Menu: Move to class .card · Reset this element's value |
| **Shadowed**: a class value hidden by a combo or a local value (red strikethrough) | Strikethrough on the hidden value in the source row tooltip, and in the manager's CSS preview | — |
| Master override (existing) | Unchanged | Reset to master |
| Token-bound | Existing token chip (no purple) | Existing |

Hues are role tokens from DESIGN.md (`--bk-*`), never purple (Gate 18). Each state has a distinct **shape + text** so it does not depend on colour (a11y). A section header collapsed with set values shows the existing dot count, split by kind.

**"N other elements use this class" warnings.**
- The count line under the field is always visible when a class is selected: "12 on this page · 31 on site".
- The first edit in a session to a class used on more than one element shows a one-time inline note in the field: "Changes apply to 31 elements. **This element only**". It does not appear again for that class in that session. It is never a blocking modal, because Webflow does not block and a modal on every edit would be hostile.
- Destructive class-wide actions (reset class, paste into class, remove all unused) get a confirm that states the count. Cancel is the default.

### 3.4 States, breakpoints and multi-select

- The **State** and **breakpoint** chips stay where they are (ContextRow). They now apply to the selected selector. The context-row counts ("Tablet · N overrides", "N :hover overrides") count overrides **on that selector**.
- Switching breakpoint or state never changes the selected selector.
- **Multi-select** (today, writes go to every selected element: `useStyleHandlers.ts` `extraTargetIds`):
  - All selected elements have the **same chain**: the selector shows it and edits write the class once. The count shows "3 selected · 31 on site".
  - Chains differ: the selector shows "Mixed classes" and style controls are disabled, with the text "Selected elements have different classes. Pick one, or edit **these elements only**". Choosing that writes element-local values to each, which is today's behaviour, now explicit.
  - Adding a class with a mixed selection adds it to all of them (one step). Removing one removes it from those that have it.

### 3.5 All states

| State | Selector field | Style controls |
|---|---|---|
| **Empty**, no selection | Not shown (Page appearance context, BD-08) | — |
| **Empty**, element without classes | Placeholder "Add a class…". Below it: "Styles apply to this element only" (migrated site), or "Your first style creates a class" (class-mode site with Q1) | Enabled |
| **Loading** | The registry is derived synchronously, so there is no spinner. While the project is loading, the existing `InspectorLoading` covers the panel | — |
| **Error**: invalid name | Inline under the field: "Class names start with a letter and use letters, numbers, - and _" (with a suggested normalised name) | Unchanged |
| **Error**: save failed | Existing save status in the bottom bar. Nothing class-specific | Unchanged |
| **Error**: rule refused (grammar) | Never user-reachable when `classSelector()` is the only builder. If it happens anyway: dev warning, edit not applied, toast "Could not apply style" | — |
| **Conflict**: save conflict pending | Read-only, existing (`ProInspector.tsx:222`, `readOnlyReason: "conflict"`) | Read-only |
| **Conflict**: stale editor (server refuses save, §2.3) | Banner: "This site uses classes. Reload to keep editing." Edits are blocked until reload | Read-only |
| **Read-only**: locked element | Chips visible and not editable. "Locked" reason. A class used by a locked element and other elements is still editable from an unlocked element; the confirm names the locked one (Q6) | Read-only for local |
| **Read-only**: component instance | Membership chips read-only; **Open component** navigation, and **Push to master** separately on the instance root only | "This element only" enabled |
| **Read-only**: viewer (`?view=readonly`, `shared/utils/editorViewMode.ts`) | No inspector (existing) | — |
| **Element mode** (flag off for site) | Not shown. Behaviour › Class names (FS-05 interim) | Today |

### 3.6 Style selectors manager (Brand › Classes)

Built from the current card list (`ClassesSection.tsx`).

- **Tags** group first (P4), then **Classes** in first-seen order, with combos nested as `card + is-dark`.
- A row shows the name, "N elements · M pages" and a set-values dot.
- Row actions: Rename, Duplicate, Select elements (canvas selection on the current page, plus a list of other pages to jump to), Delete (enabled only when unused), and a CSS preview of the class's rules per breakpoint and state, read-only.
- Header: search by name **and** by value (`44px`, `#1A56DB`, desktop and base only, as Webflow S06), plus **Clean up unused** (lists them, confirm, one undo step).
- Empty: "No classes yet. Select an element and add a class in Style." Error: none of its own (derived data).
- The "Find matching styles" conversion tool lives here (§5, P5).

---

## 4. Export and publish

### 4.1 Today

- Publish emits one `.buildrick-<id>` rule per element with base styles (`engine/export/ExportEngine.ts:530-558`, `buildPublishBaseCss` → `elementBaseCSS`), then all StyleEngine rules (`:789-795`). Each element carries `data-buildrick-id` and `class="buildrick-<id> userClasses…"` (`:1146-1150`; single-file at `:409`). The prefix is `cssPrefix: "buildrick-"` (`shared/types/export.ts:68`).
- The stylesheet is **inlined into every page** (`editor/shell/exportPublishPages.ts:84`, "Pages are capped at 2MB each"). CSS size is therefore paid once **per page**.
- `buildrick-<id>` is load-bearing beyond styling: the approved-vs-current review compare uses the first class token as strip identity (`shared/utils/html/approvedCompare.ts:20-22`).

### 4.2 Generated CSS in class mode

Order inside each breakpoint bucket is tags → classes (chain length ascending, then first-seen) → element-local. Buckets are base, `@media (max-width:1023px)`, `@media (max-width:767px)`, as today (`StyleEngine.ts:361-427`). Hide rules come last (`cascadeCSS.ts:39-49`, unchanged).

```css
/* tags */
body{font-family:var(--buildrick-design-font-body)}
h2{font-size:36px}
/* classes */
.card{padding:24px;border-radius:8px}
.card:hover{box-shadow:var(--buildrick-design-shadow-md)}
.card.is-dark{background:#0F172A;color:#fff}
/* element-local (ladder) */
.buildrick-el_8f2.buildrick-el_8f2.buildrick-el_8f2.buildrick-el_8f2{margin-top:40px}
@media (max-width:1023px){
  .card{padding:16px}
  .buildrick-el_8f2.buildrick-el_8f2.buildrick-el_8f2.buildrick-el_8f2{margin-top:24px}
}
```

**Specificity ladder.** Class rules are real CSS (`.a`, `.a.b`, `.a.b.c`, plus at most one pseudo-class), so the maximum is (0,4,0). Element-local rules are emitted with their identity class repeated 4×, giving (0,4,0), and come after classes. They therefore win against every class rule, including class states. Local states append the pseudo-class, giving (0,5,0). On the canvas the identity is `[data-buildrick-id="…"]`, repeated the same way. One helper, `localSelector(id, target)` in `cascadeCSS.ts`, builds both. Tags are (0,0,1).

**Rejected alternative: CSS `@layer`.** It would give cleaner output. But the canvas is a `div` in the chrome document, not an iframe (C2 C01), and chrome already declares `@layer reset, components, overrides` (`themes/default.css`, CLAUDE.md §Cascade). Unlayered chrome rules would then beat **all** layered customer CSS on the canvas, and unlayered Site Global CSS would beat it on publish. The ladder keeps today's "everything unlayered" world. Revisit `@layer` if the canvas becomes an iframe.

**Identity class.** `buildrick-<id>` is emitted **only for elements that have local styles**. `data-buildrick-id` stays on every element for the interaction runtime (`ElementStyles.ts:66-79`). `approvedCompare.ts` moves to `data-buildrick-id` as strip identity before the class is dropped (P1 prerequisite, with a test). A class-mode element with no local styles publishes as `<div class="card is-dark" data-buildrick-id="…">`.

**Naming collisions with engine names.** Names starting `buildrick-` or `bd-`, or `w-` (reserved for future Webflow import), are refused. `ClassesSection.tsx:34` already hides the `buildrick-` namespace.

### 4.3 Sanitising user class names

- One normaliser lives in `shared-pkg/schemas/` (SSOT, used by the editor and by any future server import):
  1. Trim, then lower-case.
  2. Replace whitespace and any character outside `[a-z0-9_-]` with `-`.
  3. Collapse runs of `-` and strip `-` from both ends.
  4. Must match `^[a-z][a-z0-9_-]{0,63}$`.
  5. Reserved prefixes are refused.
- Case-insensitive identity: `Card` and `card` are one class (Webflow S01). Loading a legacy site with `Card` on one element and `card` on another merges them on the first class edit (shown in the manager as "2 spellings merged").
- `parseClassList` (`CSSClassesSection.tsx:38`) is replaced by the normaliser. Today a typed `a+b` or `2col` reaches `class=""` and could never be a valid selector.
- Every output of the normaliser must pass `isSafeCssSelector` (`element-markup.ts:175`), pinned by test.

### 4.4 Old `.buildrick-<id>` output and CSS size

- Element mode: output is **byte-identical** to today. This is a P0 acceptance check.
- Class mode: migrated elements keep their local rules, so output is unchanged except for the 4× identity selector. That adds about 3× the identity text per local rule. On a site that is 100% local this **grows** CSS by an estimated 10–25%, which is not measured. It shrinks as styles move to classes. Measure on the 3 largest real sites in P0 (gzip size is what Vercel serves; the per-page inline cost is the uncompressed size against the 2 MB page cap).
- Mitigation if growth matters: emit the 4× ladder only for local rules whose property is also set by some class rule on that element. Otherwise use a 1× selector. This is a pure optimisation that the ResolvedStyle origin data makes possible.

---

## 5. Migration of existing sites

### 5.1 Options

| | (a) Keep local, classes going forward | (b) Auto-convert identical style sets | (c) Hybrid: (a) + opt-in assisted conversion |
|---|---|---|---|
| Visual change on load/publish | None by construction (except §4.4 identity selector text, no computed change) | Risk: grouping is exact-match only if states, breakpoints and token bindings are compared too; any normalisation bug restyles a live site | None on load. A conversion is previewed and undoable |
| User surprise | Low | **High.** A user edits one card and 40 change, with nothing explaining why | Low. The user chose each class |
| Naming | User's | Machine names (`heading-3-copy-7`) nobody can read | User's, or suggested and editable |
| Effort | S | M–L plus a parity harness | M (P5) |
| Value | Classes only on new work | Immediate reuse | Reuse where the user wants it |

### 5.2 Recommendation: (c) Hybrid

1. Switching a site to class mode **moves no data**: no rule is rewritten and no element is touched.
2. New styling uses classes. Existing values show as "This element only".
3. Conversion is offered and never forced:
   - **Make class from this element** (selector ⋯): moves this element's local base, breakpoint and state values into a new class, applies it, and clears local values. One step, with no visual change, checked by origin-resolve before commit.
   - **Find matching styles** (Brand › Classes): lists groups of elements whose full local style record (base + all breakpoints + all states, values compared after normalisation) is identical. For each group: suggested name, preview, Convert. Exact matches only. Near-matches are not offered (they would be visual changes).
   - **Move to class** on a pink indicator (§3.3).

### 5.3 No-visual-change guarantee and how it is checked

- **On load and publish:** element mode keeps today's code path and its byte-identical output is asserted (P0 test). Class mode changes only rule order and local selector weight. Since local already wins on the canvas today, the only computed changes are where an **imported** `.x` rule and a local value set the same property. In that case publish today lets the class win and the canvas lets local win (C1 *suspected* P2). Class mode makes publish match the canvas. The switch therefore runs a **parity report** before flipping: it resolves every element's value with origin, legacy order vs class order, and lists any element whose resolved value differs. If none: flip. If some: show the list (Q5).
- **Per conversion:** origin-resolve before and after on every affected element at every breakpoint and state; refuse to commit when any value differs.
- **Live check (repo rule):** a Playwright sweep reads `getComputedStyle` for every element at 3 viewport widths × normal/hover on canvas, Preview and the published page, before and after. Zero diffs is the gate.

### 5.4 Versioning, rollback, flag and staged rollout

- `Site.styleModel` column (server-owned, §2.3). Env: `CLASS_STYLES=on` enables the switch for all workspaces; `CLASS_STYLES_WORKSPACES=<ids>` enables listed ones. Same shape as `isBrandTokensV2Enabled` (`server/services/brand-tokens.ts:17-21`). **Server-side, read per request. Never `NEXT_PUBLIC_*`**: this avoids the VITE/NEXT_PUBLIC pair trap and `gate:baked-flags` (root CLAUDE.md, Editor feature flags).
- `CLASS_STYLES_DEFAULT_NEW=on` makes **new** sites start in class mode (stage 3).
- Rollback per site: an operator sets `styleModel` back to `"element"`. No data is lost. Class rules then render in legacy order, and the rollback lists affected classes first (§2.3). Per env: unsetting the flags stops new switches; switched sites keep working.
- An auto-checkpoint (version) is taken right before the switch and before each "Find matching styles" conversion, using the existing version mechanism (same pattern as the theme rollback snapshot, Prisma `projectStyles` snapshot rows).
- Stages:
  1. QA workspace only.
  2. Opt-in "Use classes (beta)" per site, in Site settings › Advanced (BD-14 owner surface).
  3. Default for new sites.
  4. Prompt existing sites. Never force.
- Root CLAUDE.md env table gains the three rows in the same commit (repo rule). `scripts/check-prod-env.mjs` is not required (optional flags).

---

## 6. Phased build plan

Sizes: S ≤ 3 days, M ≈ 1–2 weeks, L ≈ 2–4 weeks, for one engineer with tests. These are rough and not estimated against a backlog.

### P0 Foundations, flag-gated, no user UI (M)
- `classSelector`, `localSelector`, name normaliser (shared), `composer.classes` derived registry, `setClassStyleAt`, layer sort in `generateResponsiveCSS`, ladder in `elementBaseCSS`/export, `resolveStyle` with sources and origin, local-rule pruning on delete, `Site.styleModel` column + migration, load/save plumbing, stale-editor save guard, env flags.
- **Observable acceptance (running app):**
  1. A legacy site with flags off: published HTML/CSS is byte-identical to before (diff of two publishes).
  2. The same site switched to class mode on the QA workspace: the computed-style sweep (3 widths × normal/hover; canvas, Preview, published) shows 0 diffs.
  3. An old editor build saving to a class-mode site gets the reload banner, and the site is unchanged.
  4. Deleting an element with a tablet override removes its rule (published CSS no longer contains its id).
- **Tests:** unit tests on a real Composer (`createTestComposer`); export snapshot; DB tier for the save guard; Playwright sweep script, committed as a reusable harness.

### P1 Base classes in the inspector (L)
- Selector field (Style top + Effects context), add/remove/rename/duplicate, chip menu, count line, one-time shared-edit note, "This element only", auto-class (Q1), multi-select rules, all §3.5 states, remove Behaviour › CSS classes in class mode, `approvedCompare` identity move, drop `buildrick-<id>` for elements without local styles, paste/reset scope.
- **Observable acceptance:** replay L W3. Two headings get `hero-title`; set font-size 36px and colour on one; the second changes on canvas, in Preview and on the published URL (computed values read, not eyeballed). Tablet value on the class applies to both at 1023px. Hover on the class works on both in published. The count reads "2 on this page". ⌘Z reverts both in one step. Published HTML shows `class="hero-title"` and one `.hero-title` rule.

### P2 Combo classes and inheritance indicators (L)
- Combos (cap 3), origin-based indicators (set / inherited / local / shadowed), Go to source, Move to class, Connect-to-tokens on class rules.
- **Observable acceptance:** `.btn` + `.btn.is-ghost`. Editing the combo changes only ghost buttons; editing the base changes both. On a ghost button, the base background shows as inherited with tooltip "from .btn". Setting it on the combo shows the base value struck through. A migrated element with a local colour shows a "This element only" marker, and Move to class clears the local value with no computed change.

### P3 Style selectors manager in Brand › Classes (M)
- List, nested combos, counts, CSS preview, rename, duplicate, select elements, delete unused, Clean up unused, search by name and value.
- **Observable acceptance:** "Clean up unused" on a site with 3 unused classes removes exactly those 3 from the published CSS, and one ⌘Z restores them. Search "36px" finds `.hero-title`. Rename updates all elements across 2 pages (published HTML checked on both).

### P4 Tag styles and insert defaults (M–L)
- Tags group, tag rules, and the change to insertion: in class mode, `applyTypeDefaults` (`blockRegistry.ts:343-355`) writes **nothing local**. Type defaults become seeded tag rules (once per site at switch, editable). Block and template HTML styles land as local (unchanged) until P5.
- **Observable acceptance:** a new heading inserted on a class-mode site has no local values (inspector shows none as "This element only"). Its size comes from "All H2" (inherited indicator). Changing All H2 to 40px changes every unclassed H2 on canvas and in published.
- **Risk:** this is the step most likely to change look-and-feel for users who expect defaults on the element. Ship behind its own sub-flag.

### P5 Conversion and cross-project class conflicts (M)
- Make class from this element, Find matching styles, rename/merge rule for template insert and component package import (BD-17).
- **Observable acceptance:** on a migrated site with 6 identical cards, Find matching styles offers one group of 6. Convert creates `.card`, the sweep shows 0 computed diffs, and editing `.card` padding changes all 6. Importing a package whose `.card` differs creates `.card-2`; an identical one merges.

### P6 Rollout (S per stage, plus calendar time)
- Stages per §5.4, with a parity report on each switch and rollback runbook in `docs/runbooks/` (mirrors brand-token-migration).
- **Observable acceptance per stage:** the switched sites' published pages pass the sweep; there are no stale-editor saves in server logs; rollback on a QA site restores legacy output.

### Gates and repo rules affected
- `verify:ds` chrome gates: new UI composes `@/editor/chrome-ui` (no `flowbite-react` import, `gate:chrome-ui-surface`), no raw `<button>/<input>` (Gate 24), no hex (Gate 16), no purple (Gate 18), overlays via chrome-ui primitives (Gate 22). Run `pnpm flowbite:classlist` if a new flowbite component is imported.
- Relative-imports gate (`../../` banned); `gate:ds-ssot`.
- The `StyleData` and `PseudoStateId` types are defined twice (`shared/types/style.ts:13,30` and `shared/types/index.ts:129,146`). Collapse them to one before adding origin fields, otherwise the SSOT scanner and drift will bite.
- Root CLAUDE.md env table: 3 new rows.
- `gate:figma`/Figma build loop: CF01–71 now provide selector, scope, manager, migration and recovery specimens. [Review index](https://www.figma.com/design/2L9OTGzBrL6kYmU18yA1c7?node-id=415-61494). These establish design output, not implementation conformance or exhaustive prototype/accessibility acceptance (Q8).
- Tests protecting the old model get rewritten in the same commit (editor CLAUDE.md loop rule 4), e.g. `CSSClassesSection.write.test.tsx`, `stylePeers.test.ts`.

---

## 7. Risks, owner questions, not verified

### 7.1 Risks (ranked)

1. **Insert defaults are local** (`blockRegistry.ts:343-355`). Until P4, every new element carries local values that out-rank any class (§1.4). A user adds `.card` to a fresh element and sees little change. *Mitigation:* in class mode from P1, defaults that duplicate a tag default are not written locally; the indicator explains the rest; P4 completes it.
2. **Local-wins-over-class-state** (§1.2) surprises Webflow users on migrated elements. *Mitigation:* shadowed marker + Move to class. Q3.
3. **Publish change for sites with imported class rules** (canvas/publish mismatch fixed in one direction). *Mitigation:* parity report on switch. Q5.
4. **Stale tabs and old clients.** *Mitigation:* server-owned `styleModel` + save guard. The derived registry means nothing new to lose.
5. **CSS growth from the ladder** on fully local sites, paid per page (inline stylesheet). *Mitigation:* measure in P0; selective ladder (§4.4).
6. **Blast radius of class edits** in collab (future) and for locked elements (Q6).
7. **Component definitions not on ⌘Z** while class rules are: mixed undo. Tied to IA-02.
8. **Scope.** BD-08's Content tab is not built yet. P1 lands on the 3-tab inspector. The selector placement survives either way (Style top + Effects context).

### 7.2 Owner questions (with recommended answers)

| # | Question | Recommended |
|---|---|---|
| Q1 | Auto-create a class on the first style edit of an unclassed element? | **Yes, on class-mode new sites only**, named after the element type, with an Undo toast. Never on migrated sites |
| Q2 | Combo depth cap? | **3 classes total.** Webflow advises 1 combo level; 3 bounds the ladder |
| Q3 | Should an element's own value beat a class's hover/state value? | **Yes, local always wins** (predictable "this element only"), with a visible shadowed marker and Move to class |
| Q4 | Migration approach? | **(c) Hybrid**: no data moved on switch, opt-in exact-match conversion |
| Q5 | When the switch's parity report finds imported-class/local conflicts (publish would change to match canvas), what happens? | **Show the list, let the user switch anyway** (canvas = truth today); offer "Keep publish as before" which converts those local values to the class value first |
| Q6 | Edit a class that a locked element also uses? | **Allow, with a confirm naming the locked elements.** A lock protects an element's structure and own values, not shared classes |
| Q7 | Keep "Copy style / Paste style" (Webflow has none)? | **Keep**, scoped to the current selector |
| Q8 | Design boards before build? | **Yes**: selector field (all §3.5 states), indicators, manager. Required by the editor's Figma loop before P1 chrome |
| Q9 | Add `focus-visible` / `placeholder` states with classes? | **`focus-visible` in P2** (engine recognises it); others later |
| Q10 | Should "Apply style to all {peers}" survive in class mode? | **Replace with "Add class to all {peers}"**; keep the copy action in element mode only |

### 7.3 Not verified

- **Nothing was run.** There was no live walk, no tests and no probes on this branch. Every "today" statement is a code read at `6dbe51b25`.
- Phase 1 fixes for duplicate rules, paste breakpoint, mobile-reads-tablet and the stylePeers selector were confirmed **in code only**.
- Not traced: `CMSExportResolver` item cloning and class carriage (§2.7); component instantiation of master state rules (§2.6, suspected); server publish worker or other server code that might read `buildrick-<id>` classes; ReactExporter (reads `breakpointStyles`, C1).
- CSS growth (§4.4) is an estimate, not a measurement.
- Webflow behaviour comes from `evidence/W` (official docs, not tested in an account).
- No DESIGN.md hue tokens were chosen for the indicators. They are named by role only.
- `themes/default.css` `@layer` declaration was taken from editor CLAUDE.md, not re-read.
