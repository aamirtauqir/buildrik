# Design 2L9 · Lane L-B · Inspector (Figma page 04) — sub-plan

> **For agentic workers:** execute archetype by archetype with THE LOOP (master plan `2026-10-22-implement-2l9-design.md`, Phase 2). One commit per archetype. Steps use checkbox (`- [ ]`) syntax.

**Goal:** the shipping Inspector matches page 04 of Figma `2L9OTGzBrL6kYmU18yA1c7`, starting with the four-tab chassis every other 04 row inherits.

**Branch / worktree:** `feat/design-2l9-lane-b` · `~/Desktop/buildrik-worktrees/design-2l9-lane-b` (from `feat/design-2l9` @ `59c9fdf67`). Probe port **5172** (temporary config, deleted after use).

**Owned paths:** `packages/editor/src/editor/inspector/` except `components/InspectorHeader.tsx` (lead, Task 1.4). Shared files touched only where a row needs them (`scripts/conformance/*` regression net; `src/shared/constants/elementCapabilities.ts` is read, not edited).

**Inventory:** `packages/editor/docs/design-2l9/inventory/04-inspector.md` / `.json` — 313 rows: drift 139 · missing 87 · match 1 · blocked:owner-class-first 86.

## Global Constraints, Review Focus, Manifest schema

As in the master plan (`docs/superpowers/plans/2026-10-22-implement-2l9-design.md` §Global Constraints, §Review Focus, §Manifest schema). Lane-specific restatements:
- Board = visuals and copy; code contract = behaviour. Where the code wins: `authority: code:<reason>`.
- Board sample data ("Fieldwork Studio", "hero-intro", "Blog.title") is never copied.
- Tests protecting the old design are rewritten in the same commit; "re-baseline: <surface>" in the body when pins change.
- `verified: "drift-fixed"` only after a board comparison (probe screenshot or live); otherwise `drift-open` + "built, not compared".
- Light verification: targeted vitest per slice; `npx tsc --noEmit` = 0 and `pnpm run verify:ds` (cwd `packages/editor`) before each commit batch.

## Lane decisions (precedence rules, no owner input needed)

- **LD-1 Tab ids.** The four tabs are `content · style · behaviour · effects`. The label reads **"Behavior"** (board); the internal id stays `behaviour` because `BehaviourSectionId` / `behaviourSections` in `src/shared/constants/elementCapabilities.ts` (outside this lane) share the spelling and no user sees it.
- **LD-2 What moves to Content** (boards 36:2, I01, F01, F02, D01, A11, B69/01): the type block's content rows (text, heading level, field rows, media source/alt, embed URLs, widget values), Fields, Slides, Collection, CMS binding, Attributes. **Link stays on Behavior** — B69/01 draws "Behavior · Destination / Target / Rel" for a link; only its text is Content (the type block's Edit text). This overrides the lane brief's "link" item: the board decides placement.
- **LD-3 What stays on Style:** the Flex/Grid type bodies (they are the "Children layout" controls, board 36:2 specimen 2), Component row (until the instance block, A8), Layout, Typography, Size, Spacing, Fill, Border, Text inside. The Text style row (Brand type-style binding of `font-size`) is a style write, so it moves from the type block to the head of Typography (no board draws it on Content; capability kept, `code:text-style-binding`).
- **LD-4 Behavior:** Form settings (board F10 draws After submit, Notifications, Spam on the Behavior side with Visibility + Interactions), Playback, Link, Visibility, Interactions, CSS classes (`blocked:owner-class-first`, kept reachable).
- **LD-5 Opening tab.** A new element type opens on **Content** when its Content tab has a defining block (type block body or Fields/Slides/Collection), else on **Style** (containers, sections: the boards' container specimens are Style). Same-type selection keeps the tab (DD-20 unchanged). The override context row (State chip · Reset · Revert) shows on Style and Effects only.
- **LD-6 No placeholder rows.** "Conditions · None" is not drawn until conditions exist (engine + export runtime, see Later). Drawing a row that cannot do anything is a fake.

## Archetypes (ordered: Play-journey steps first, then the largest drift clusters)

### A1 · Tab chassis — Content · Style · Behavior · Effects  (~200 rows inherit; direct: 36:2, 161:8480, 156:716, 161:13919)
Files: `sections/registry/_shared.tsx`, `sections/registry/{type,behaviour}.tsx`, `config/sectionOrder.ts`, `ProInspector.tsx`, `sections/typeBlock/bodies/textBodies.tsx`, `sections/typography/index.tsx` (+ new `sections/typography/TextStyleRow.tsx`), `hooks/usePropertyJump.ts` / `config/propertyIndex.ts` paths.
- [ ] Failing tests: `sectionOrder.test.ts` › "four tabs in board order, labelled Content · Style · Behavior · Effects"; titles per tab for heading / button / form / image / flex; `ProInspector.branches` › "a text element opens on Content, a container on Style"; `mustNot` › tab loop over 4 labels, no context row on Content or Behavior; `InspectorTabContent.test` updated; `propertyIndex.test` paths ("Content › …").
- [ ] Implement LD-1…LD-5. Copy adopted: "Content", "Style", "Behavior", "Effects".
- [ ] Regression net: `scripts/conformance/inspector-v4-state.mjs` accepts "Behavior".
- Header line "Content · All breakpoints" / "Behavior · {type}" is the header's (lead-owned) → REQUESTS.md #10.

### A2 · Semantics + Advanced attributes  (I01, A11, F01, D01; ~20 rows)
Files: new `sections/SemanticsSection.tsx`, registry entry `semantics` (Content), `attributes/AttributesSection.tsx`, `config/attributeFields.ts`, `textBodies.tsx` (Level row moves into Semantics' Tag for headings).
- [ ] Tests: Semantics shows Tag + ID for every element; heading Tag = H1–H6 select (one Undo, lock gate); other types show their native tag read-only; ID edits write `id` (moved out of Attributes, no second ID row); Attributes retitled "Advanced attributes", closed, summary "{n} set".
- Copy: "Semantics", "Tag", "ID", "Content and semantic changes apply to all breakpoints.", "Advanced attributes", "{n} set".
- "Change semantic tag" (A12/A13 impact review) stays `missing` — later slice.

### A3 · Form field detail — Label vs placeholder bug  (F02, F04, F06 + inheritors; 7 rows)
Files: `sections/FormFieldsSection.tsx` (+ small `formFieldModel.ts` if the label lookup needs its own home).
- [ ] Failing test first: "Label edits the field's label text, Placeholder edits `placeholder`" (today Label writes `placeholder`, `FormFieldsSection.tsx:172`).
- [ ] Rows in board order: "‹ {form}" back · Field · Type · Label · Placeholder · Name ("Name is the key stored with each submission.") · Required · Default value · Validation (min/max length or min/max by type — whatever the code contract supports) · More settings.
- Label source: the field's `<label for>` / wrapping `<label>` text, else `aria-label`.

### A4 · Add field — 13 types  (F05)
- [ ] "+ Add field" opens the "Add field" list: Text, Email, Number, Textarea, Select, Checkbox, Radio, Switch, Slider, Date, Time, Color, Submit — each inserts the matching element (existing element factories), before the submit button. Field list summaries name the new types.

### A5 · Field list affordances  (F01, F07, F21 + inheritors; 12 rows)
- [ ] Row "⋯" menu (Move up / Move down / Delete) as the keyboard route to the drag reorder; note "Drag to reorder, or use a field's menu."; submit row listed as "Submit button".

### A6 · Form settings copy and status  (F10–F13, F16, F15; 6 rows)
Files: `sections/FormAfterSubmitSection.tsx`.
- [ ] "Applies on next publish" tags; "Form settings status" row (Saved / Saving… / "Couldn't save — your message is still here" + Retry); "Saved separately from page edits; outside document Undo."; "Loading form settings…". Recipient Admin-only disclosure up front only if the code knows the role before a save (else `code:forbidden-on-save`).

### A7 · Behavior tab copy + interactions  (I12, I14–I16, I20–I23, G17–G19; ~14 rows)
- [ ] Visibility "Show on these devices"; Interactions "Plays on all breakpoints", "No interactions yet."; presets before "Choose a trigger ›"; actions menu Duplicate / Disable / Delete; "Interaction deleted · Undo" receipt through the composer history (one undo).

### A8 · Component instance block  (IC01–IC06 + handoff; 7 rows)
- [ ] Identity block above the tabs (library · version, Variant, "Edit main component ›", "Reset · {n} overrides", Detach); Reset disabled "No overrides to reset"; Detach applies directly with "{name} detached · Undo" (composer history). Above-tabs placement is in `ProInspector.tsx` (owned), not the header.

### A9 · Inspector states  (S01, S03, S04, S06, S07; 5 rows)
- [ ] Error boundary "Unable to display Inspector" + "{name} is still selected" + Try again (returns to the same target and tab); "Loading project · Your saved content is still arriving…"; Page panel "SEO and social" copy check; "Template applied · …" notice with Dismiss.

### A10 · CMS binding on Content  (D01, S23–S27, S36, D11; ~10 rows)
- [ ] Section titled "Dynamic bindings"; bound row "{Property} · {Collection}.{field} ›"; unbind keeps the static value with an Undo receipt.

## Later slices (not started in this run)
- **Conditions** (D04–D10, 7 rows + the Conditions row of ~40 Content boards): needs an element-level condition model in `src/engine/` (lead-owned) and the export runtime → REQUESTS.md #11.
- **Visitor form runtime B4-V** (15 rows, `160:8757`…): inline published-form states live in the dashboard route `packages/dashboard/app/api/public/forms/[siteId]/[formBlockId]/route.ts` + the exported form script — a server/runtime slice through the full chain; not started (lane brief).
- Redirect page picker + URL validation (F19, F25–F28), offline (F14), duplicate submission key (F03), Password warning (F08), unlabeled repair (F09), Select→Text conversion (F29–F33, BD-29).
- Precision family (I03–I11: invalid drafts, unit menus/conversion, custom expressions), Advanced style A01–A10, Batch B01–B06, Fonts R01–R09, Composite C01–C18, Block refs, Menu actions G01–G23, override-layer removal S13–S21, rename confirm, scroll restoration.

## Blocked
- **`blocked:owner-class-first`** — CF00–CF81, G24–G27 (86 rows) and the CSS classes section's redesign; spec `docs/audits/2026-10-20-webflow-reverse-audit/CLASS-FIRST-SPEC.md`.
- **`blocked:pr33-ai-removal`** — AI agent-run takeover card (`ProInspector.tsx` agent run), "Ask AI about this page" (`PagePanel.tsx`), "Improve with AI" action.

## Code-ahead dispositions

| Capability | Disposition |
|---|---|
| AI agent-run takeover card (`ProInspector.tsx`) | Delete with PR #33 — `blocked:pr33-ai-removal` |
| "Ask AI about this page" (`PagePanel.tsx`) | Delete with PR #33 — `blocked:pr33-ai-removal` |
| "Improve with AI" element action | canvas-only; `blocked:pr33-ai-removal` |
| Multi-select Align / Distribute / Group bar | kept at the multi-select bar above the tabs — `code:align-distribute`, owner decision on its final home (`open:align-distribute-home`) |
| Pseudo-state picker incl. `:disabled` | kept — header Editing select (Task 1.4, done) |
| CSS classes section | kept at Behavior › CSS classes — `blocked:owner-class-first` |
| Theme-toggle inspector | kept — `code:theme-toggle` |
| ⌥-click open/close-all, "+" add rows | kept on every tab — `code:section-affordances` |
| Spacing-token link | kept in Size/Spacing — restyled with A04 later |
| Text style (Brand type-style binding) | kept at Style › Typography (LD-3) — `code:text-style-binding` |
| Heading Level segmented | kept as Content › Semantics › Tag for headings (A2) |
| Input attributes (read-only, autocomplete, max length, form action/method/encoding) | kept at Content › Advanced attributes (A2) |
