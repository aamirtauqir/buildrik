# BIC-01 — Basic, layout and form blocks

**34/34 individual records.** This annex is incorporated by FD-INS-03. BIC-C01–07 and FD-INS-02 IC/II are normative shared contracts; specific native form transitions and eligibility in BIC-C06/07 govern generic examples here. Source findings are distinct from redesigned behavior. Runtime survey covers insertion, selected target and default Inspector only.

## Shared source findings

- Generic Input body (`formBodies.tsx:30–101`) exposes type/name/placeholder/default/required/disabled, not every subtype-specific constraint. Choice writer (`formBodies.tsx:108–160`) targets nested input but lock/read dispatch must include actual native child and ancestors.
- `PropertyField.tsx:137–171` Select reader/writer uses content rather than stock option child tree; `Element.setContent` does not remove existing children. Stock options require one native-tree owner.
- `FormFieldsSection.tsx:68–81` input/textarea conversion recreates IDs and copies only five attrs; preserve ID/references or refuse lossful conversion. Field list must recognize select and move proven label+control units.
- Native file transport: dashboard `app/api/public/forms/[siteId]/[formBlockId]/route.ts:36–89` and shared `schemas/forms.ts:6–10` establish string JSON/urlencoded fields, not file bytes. Root `lib/publish-forms.ts:128` distinguishes absent versus present-empty action.
- Layout reads/write source consistency is specified by INS-D05/II-01; no independent count/gap shadow values. Native tags qualify capabilities; all scalar defaults and units below are selected control specifications, not existingUI claims.

## B69-container

Source: `src/blocks/Basic/Container.tsx`. **Builder/current Inspector paths inspected in source. block-runtime-survey.json verifies insertion/tree/returned selection/default panel only. Redesigned controls, save/reopen and output NOT RUN.**

**Existing structure:** Observed generated native tree: <div>. Returned selection: container / div.

**Gap:** Generic type does not authorize every native tag or arbitrary nesting.

**Disposition:** Keep + Regroup

**Owner:** Selected container owns children and box; parent owns its placement context.

**Editing home:** Content → Children/Attributes; Style → Children layout/placement/box.

**Controls/validation:**

- Semantic tag readout uses actual native tag; existing valid tag retained. Children list derived from tree, Add validates native + engine nesting. Empty container offers existing Add path.
- Display and flex/grid controls share existing Style writer; current class membership stays one source. Do not write defaults on selection.

**Flow / cancellation / recovery:** Canvas/Layers select → Content Children → select child → edit actual child → Back to container. Add/reorder/remove through BIC-C02; invalid target explains restriction and keeps tree.

**Permission, keyboard, batch and focus:** BIC-C01–07 and IC/II apply: actual target, descendants, ancestor locks, component scope, command/server authorization; structure single owner only; scalar batch explicitly compatible subtypes and accurate mixed state. Exclude native ID/label association, structural/type conversion, CMS binding, form transport and radio group/default actions from batch; deduplicate shortcuts and directly selected controls by actual write target. Keyboard Add/Edit/Move up/down/Remove; Enter applies, invalid draft retained, Escape cancels current interaction per II-02. Return restores exact parent/row focus.

**Compatibility:** No schema change required for regrouping; preserve IDs/native tags/content, styles, safe attrs and references. Structural corrections use atomic commands, not a new parallel property store.

**Acceptance (not run against redesign):**

- T-B69-container-01: Empty container stays empty until Add; selecting it makes no mutation.
- T-B69-container-02: Child return restores container ID/scroll; delete/Undo preserves descendants.

## B69-text

Source: `src/blocks/Basic/Text.tsx`. **Builder/current Inspector paths inspected in source. block-runtime-survey.json verifies insertion/tree/returned selection/default panel only. Redesigned controls, save/reopen and output NOT RUN.**

**Existing structure:** Observed generated native tree: <span>. Returned selection: text / span.

**Gap:** Inline rich text must not be flattened by a plain root text replacement.

**Disposition:** Move + Keep

**Owner:** Actual text element or inline range in parent content.

**Editing home:** Content → Text/semantics; Style → Typography; binding under Content.

**Controls/validation:**

- Edit text on canvas targets real content; preserve inline links/emphasis/marks unless explicitly replaced. Empty text is authored empty, not default sample text.
- Applicable CMS binding controls retain exact field/source; bound content editing follows IC-07. Typography/token controls use existing supported values and actual provenance.

**Flow / cancellation / recovery:** Select → Edit text → canvas text mode → valid edit commit → Escape exits/cancels current interaction per II-02 → return same Inspector. Bound text opens binding detail or explicit disconnect before static replacement.

**Permission, keyboard, batch and focus:** BIC-C01–07 and IC/II apply: actual target, descendants, ancestor locks, component scope, command/server authorization; structure single owner only; scalar batch explicitly compatible subtypes and accurate mixed state. Exclude native ID/label association, structural/type conversion, CMS binding, form transport and radio group/default actions from batch; deduplicate shortcuts and directly selected controls by actual write target. Keyboard Add/Edit/Move up/down/Remove; Enter applies, invalid draft retained, Escape cancels current interaction per II-02. Return restores exact parent/row focus.

**Compatibility:** No schema change required for regrouping; preserve IDs/native tags/content, styles, safe attrs and references. Structural corrections use atomic commands, not a new parallel property store.

**Acceptance (not run against redesign):**

- T-B69-text-01: Edit inline emphasis preserves nested markup and other properties.
- T-B69-text-02: Empty text stays empty through reopen; Undo exact.

## B69-heading

Source: `src/blocks/Basic/Heading.tsx`. **Builder/current Inspector paths inspected in source. block-runtime-survey.json verifies insertion/tree/returned selection/default panel only. Redesigned controls, save/reopen and output NOT RUN.**

**Existing structure:** Observed generated native tree: <h2>. Returned selection: heading / h2.

**Gap:** Multi-selection current primary-level display is not valid mixed-state behavior.

**Disposition:** Move + Fix

**Owner:** Selected heading owns native h1–h6 and content.

**Editing home:** Content → Text/Heading level; Style → Typography.

**Controls/validation:**

- Heading level H1/H2/H3/H4/H5/H6, default preset H2; native tag change retains ID/content. Existing semantic level applies across breakpoints, not only current viewport.
- Show Mixed for different tags; batch writes only explicit compatible headings, with no change on focus. Empty/default level is not a silent H2 reset; Reset semantic level is not inherited CSS.

**Flow / cancellation / recovery:** Select heading → Content choose level → one Undo; Edit text mode same target. Return from exact font/token source preserves heading, tab, breakpoint and draft.

**Permission, keyboard, batch and focus:** BIC-C01–07 and IC/II apply: actual target, descendants, ancestor locks, component scope, command/server authorization; structure single owner only; scalar batch explicitly compatible subtypes and accurate mixed state. Exclude native ID/label association, structural/type conversion, CMS binding, form transport and radio group/default actions from batch; deduplicate shortcuts and directly selected controls by actual write target. Keyboard Add/Edit/Move up/down/Remove; Enter applies, invalid draft retained, Escape cancels current interaction per II-02. Return restores exact parent/row focus.

**Compatibility:** No schema change required for regrouping; preserve IDs/native tags/content, styles, safe attrs and references. Structural corrections use atomic commands, not a new parallel property store.

**Acceptance (not run against redesign):**

- T-B69-heading-01: H1+H3 show Mixed and no mutation until choose.
- T-B69-heading-02: Level change preserves ID/inline content and all style layers.

## B69-paragraph

Source: `src/blocks/Basic/Paragraph.tsx`. **Builder/current Inspector paths inspected in source. block-runtime-survey.json verifies insertion/tree/returned selection/default panel only. Redesigned controls, save/reopen and output NOT RUN.**

**Existing structure:** Observed generated native tree: <p>. Returned selection: paragraph / p.

**Gap:** Generic text actions must not erase inline markup or convert paragraph to span.

**Disposition:** Move + Keep

**Owner:** Native paragraph content and styles; any inline child range owns its semantic text.

**Editing home:** Content → Text; Style → Typography.

**Controls/validation:**

- Preset p text is placeholder sample only, not fallback on empty. Content editing preserves native p and inline structures.
- Advanced safe attrs/lang/dir preserved; no heading-level field for p. Empty placeholder text not automatically regenerated.

**Flow / cancellation / recovery:** Select p → edit text → commit/cancel → return same p. Linking inline range uses existing text/link capability only; unrelated paragraphs not affected.

**Permission, keyboard, batch and focus:** BIC-C01–07 and IC/II apply: actual target, descendants, ancestor locks, component scope, command/server authorization; structure single owner only; scalar batch explicitly compatible subtypes and accurate mixed state. Exclude native ID/label association, structural/type conversion, CMS binding, form transport and radio group/default actions from batch; deduplicate shortcuts and directly selected controls by actual write target. Keyboard Add/Edit/Move up/down/Remove; Enter applies, invalid draft retained, Escape cancels current interaction per II-02. Return restores exact parent/row focus.

**Compatibility:** No schema change required for regrouping; preserve IDs/native tags/content, styles, safe attrs and references. Structural corrections use atomic commands, not a new parallel property store.

**Acceptance (not run against redesign):**

- T-B69-paragraph-01: Empty and multiline paragraph preserve semantics.
- T-B69-paragraph-02: Styled inline links and CMS values survive unrelated typography change.

## B69-button

Source: `src/blocks/Basic/Button.tsx`. **Builder/current Inspector paths inspected in source. block-runtime-survey.json verifies insertion/tree/returned selection/default panel only. Redesigned controls, save/reopen and output NOT RUN.**

**Existing structure:** Observed generated native tree: <button>. Returned selection: button / button.

**Gap:** Preset has no type attr; inside form browser semantics can submit. A button href alone is not proof of navigation.

**Disposition:** Move + Fix

**Owner:** Button owns text/children, native button type and supported action.

**Editing home:** Content → Label/semantics; Behaviour → action; Style/Effects current fields.

**Controls/validation:**

- Type button/submit/reset, plus existing absent state shown Native default; new generic Button preset should explicitly use button. Existing absent attrs are not rewritten on open.
- Text label edits text-bearing child or native content without deleting icon/count children. Navigation is a deliberate Convert to link command: preview native button→a and internal type→link, retain stable engine/DOM IDs, content/children, classes, style layers and compatible references, and set destination via existing Link writer. Remove button-only type only on confirmed Apply; one Undo restores the exact button. Show effect on tag selectors and interaction/component references. An effective native submit/reset role (including absent type inside a form), an authored disabled button, or a form/popovertarget/invoker/button-only reference blocks this shortcut and routes to its action/disabled settings for an intentional change first; never transfer disabled to an anchor and claim the behavior is preserved. If any reference or child structure cannot survive losslessly, refuse before mutation. Cancel retains the button. Never author href on an unchanged button or silently attach an unevidenced click runtime.

**Flow / cancellation / recovery:** Select button → Content label/type → Behaviour supported action → explicit Preview to exercise. Editor click selects and cannot submit. Type change with form consequences shown; one Undo.

**Permission, keyboard, batch and focus:** BIC-C01–07 and IC/II apply: actual target, descendants, ancestor locks, component scope, command/server authorization; structure single owner only; scalar batch explicitly compatible subtypes and accurate mixed state. Exclude native ID/label association, structural/type conversion, CMS binding, form transport and radio group/default actions from batch; deduplicate shortcuts and directly selected controls by actual write target. Keyboard Add/Edit/Move up/down/Remove; Enter applies, invalid draft retained, Escape cancels current interaction per II-02. Return restores exact parent/row focus.

**Compatibility:** No schema change required for regrouping; preserve IDs/native tags/content, styles, safe attrs and references. Structural corrections use atomic commands, not a new parallel property store.

**Acceptance (not run against redesign):**

- T-B69-button-01: Button in form does not accidentally submit during editor selection.
- T-B69-button-02: Existing missing type remains absent until intentional edit; label preserves nested icon.
- T-B69-button-03: Preview/output action matches authored setting; no claim from href attribute alone.

## B69-link

Source: `src/blocks/Basic/Link.tsx`. **Builder/current Inspector paths inspected in source. block-runtime-survey.json verifies insertion/tree/returned selection/default panel only. Redesigned controls, save/reopen and output NOT RUN.**

**Existing structure:** Observed generated native tree: <a>. Returned selection: link / a.

**Gap:** Primary-only link edits and stale input after Undo already verified in prior runtime record.

**Disposition:** Move + Fix

**Owner:** Anchor owns destination/target/rel; page/section IDs point to their resource owner.

**Editing home:** Content → Label; Behaviour → Link; Style/Effects appearance.

**Controls/validation:**

- Destination types URL/Page/Section/Email/Phone from existing Link model; preserve internal #page:id and section references. URL safe scheme validation; missing referenced resource stays visible with Choose/Clear.
- Open same/new tab; rel merge preserves user values and required safe target tokens. Existing # is placeholder. No nested interactive content. Mixed multi-link reads/writes/Undo reflect every eligible target.

**Flow / cancellation / recovery:** Select link → Behaviour → choose destination → commit → navigate source page/resource only via explicit link → return. Unavailable reference retains previous saved value until chosen correction; cancel draft retains prior destination.

**Permission, keyboard, batch and focus:** BIC-C01–07 and IC/II apply: actual target, descendants, ancestor locks, component scope, command/server authorization; structure single owner only; scalar batch explicitly compatible subtypes and accurate mixed state. Exclude native ID/label association, structural/type conversion, CMS binding, form transport and radio group/default actions from batch; deduplicate shortcuts and directly selected controls by actual write target. Keyboard Add/Edit/Move up/down/Remove; Enter applies, invalid draft retained, Escape cancels current interaction per II-02. Return restores exact parent/row focus.

**Compatibility:** No schema change required for regrouping; preserve IDs/native tags/content, styles, safe attrs and references. Structural corrections use atomic commands, not a new parallel property store.

**Acceptance (not run against redesign):**

- T-B69-link-01: Two links edit and Undo both targets; inputs re-read actual values.
- T-B69-link-02: Deleted page reference shown missing; never rebound by matching name.

## B69-list

Source: `src/blocks/Basic/List.tsx`. **Builder/current Inspector paths inspected in source. block-runtime-survey.json verifies insertion/tree/returned selection/default panel only. Redesigned controls, save/reopen and output NOT RUN.**

**Existing structure:** Observed generated native tree: <ul> → [<li>, <li>, <li>]. Returned selection: list / ul.

**Gap:** Root is generic container family; item content/ordering needs semantic li units.

**Disposition:** Extend + Fix

**Owner:** List root owns ul/ol; li owns item content, native numbering and nested lists.

**Editing home:** Content → List type/items; Style → marker and actual list layout.

**Controls/validation:**

- Type Unordered/Ordered (ul/ol), preserve existing menu/dl through native route rather than converting. Ordered start signed integer/absent, reversed presence/absent; per-li value signed integer/absent in native attrs. No zero-as-empty.
- Items Add/Edit/Duplicate/Move/Remove preserve actual li ID and arbitrary nested content. New item is li with editable text; empty list valid. Nested lists remain inside li, never directly relabelled as text.

**Flow / cancellation / recovery:** Select list → choose item → Edit text or child → Back to list → reorder li. Changing type preserves items; unavailable ol-only attrs retained safely with scope note until explicit removal, not silently deleted.

**Permission, keyboard, batch and focus:** BIC-C01–07 and IC/II apply: actual target, descendants, ancestor locks, component scope, command/server authorization; structure single owner only; scalar batch explicitly compatible subtypes and accurate mixed state. Exclude native ID/label association, structural/type conversion, CMS binding, form transport and radio group/default actions from batch; deduplicate shortcuts and directly selected controls by actual write target. Keyboard Add/Edit/Move up/down/Remove; Enter applies, invalid draft retained, Escape cancels current interaction per II-02. Return restores exact parent/row focus.

**Compatibility:** No schema change required for regrouping; preserve IDs/native tags/content, styles, safe attrs and references. Structural corrections use atomic commands, not a new parallel property store.

**Acceptance (not run against redesign):**

- T-B69-list-01: Reorder populated li preserves nested list; Undo exact.
- T-B69-list-02: ul→ol does not rewrite text/IDs; start=0 distinct absent.
- T-B69-list-03: Invalid non-li direct drop rejected without tree mutation.

## B69-divider

Source: `src/blocks/Basic/Divider.tsx`. **Builder/current Inspector paths inspected in source. block-runtime-survey.json verifies insertion/tree/returned selection/default panel only. Redesigned controls, save/reopen and output NOT RUN.**

**Existing structure:** Observed generated native tree: <hr>. Returned selection: divider / hr.

**Gap:** Void hr cannot accept children; container controls inappropriate.

**Disposition:** Keep + Regroup

**Owner:** Native hr and its local style.

**Editing home:** Content → semantic readout/Attributes; Style → width/border/spacing.

**Controls/validation:**

- Keep native hr with no content/children row. Visual thickness uses existing border/size property, not a duplicate thickness store; authored custom styles preserved.
- Decorative versus semantic treatment explicit native accessibility attrs; no arbitrary heading/link controls.

**Flow / cancellation / recovery:** Select divider → Style edit actual property → source/reset via II-01 → Undo. Attempted insertion inside hr is rejected and offers a valid adjacent location.

**Permission, keyboard, batch and focus:** BIC-C01–07 and IC/II apply: actual target, descendants, ancestor locks, component scope, command/server authorization; structure single owner only; scalar batch explicitly compatible subtypes and accurate mixed state. Exclude native ID/label association, structural/type conversion, CMS binding, form transport and radio group/default actions from batch; deduplicate shortcuts and directly selected controls by actual write target. Keyboard Add/Edit/Move up/down/Remove; Enter applies, invalid draft retained, Escape cancels current interaction per II-02. Return restores exact parent/row focus.

**Compatibility:** No schema change required for regrouping; preserve IDs/native tags/content, styles, safe attrs and references. Structural corrections use atomic commands, not a new parallel property store.

**Acceptance (not run against redesign):**

- T-B69-divider-01: No children created inside hr.
- T-B69-divider-02: Border/width edit preserves spacing and resets only active layer.

## B69-row

Source: `src/blocks/Basic/Row.tsx`. **Builder/current Inspector paths inspected in source. block-runtime-survey.json verifies insertion/tree/returned selection/default panel only. Redesigned controls, save/reopen and output NOT RUN.**

**Existing structure:** Observed generated native tree: <div>. Returned selection: columns / div.

**Gap:** Row builder creates zero children; showing default2 hides actual structure.

**Disposition:** Fix + Regroup

**Owner:** Empty columns-typed div owns actual child list and its layout.

**Editing home:** Content → Columns/Children; Style → Children layout/gap.

**Controls/validation:**

- Display actual count0 for new Row, custom count when outside preset2–6. Adding columns is explicit structural action, not initial render side effect.
- Same column-count contract as columns/columns3; gap style and responsive read from actual CSS, not stale data-gap. Existing arbitrary children preserved; destructive shrink INS-D05.

**Flow / cancellation / recovery:** Select empty Row → Add column(s) → select new child → edit → Back. Count change previews contents affected; cancel/invalid nesting no changes.

**Permission, keyboard, batch and focus:** BIC-C01–07 and IC/II apply: actual target, descendants, ancestor locks, component scope, command/server authorization; structure single owner only; scalar batch explicitly compatible subtypes and accurate mixed state. Exclude native ID/label association, structural/type conversion, CMS binding, form transport and radio group/default actions from batch; deduplicate shortcuts and directly selected controls by actual write target. Keyboard Add/Edit/Move up/down/Remove; Enter applies, invalid draft retained, Escape cancels current interaction per II-02. Return restores exact parent/row focus.

**Compatibility:** No schema change required for regrouping; preserve IDs/native tags/content, styles, safe attrs and references. Structural corrections use atomic commands, not a new parallel property store.

**Acceptance (not run against redesign):**

- T-B69-row-01: Row stays0 until explicit insertion.
- T-B69-row-02: Gap reselect and Undo match saved style; no arbitrary child loss.

## B69-column

Source: `src/blocks/Basic/Column.tsx`. **Builder/current Inspector paths inspected in source. block-runtime-survey.json verifies insertion/tree/returned selection/default panel only. Redesigned controls, save/reopen and output NOT RUN.**

**Existing structure:** Observed generated native tree: <div>. Returned selection: container / div.

**Gap:** Column class is not a separate fixed 12-column grid system.

**Disposition:** Keep + Regroup

**Owner:** Selected column owns box/content; row/grid/flex parent owns sibling layout.

**Editing home:** Content → Children; Style → Placement in parent + box.

**Controls/validation:**

- Expose relevant flex-item/grid-item placement through existing fields only when parent layout matches; do not force child display or width.
- Children edit via same generic container route. Type label and parent breadcrumb distinguish root Row from selected Column.

**Flow / cancellation / recovery:** Select column → parent breadcrumb for layout or Content child edit → Back restores column. Reorder uses parent siblings with native restrictions.

**Permission, keyboard, batch and focus:** BIC-C01–07 and IC/II apply: actual target, descendants, ancestor locks, component scope, command/server authorization; structure single owner only; scalar batch explicitly compatible subtypes and accurate mixed state. Exclude native ID/label association, structural/type conversion, CMS binding, form transport and radio group/default actions from batch; deduplicate shortcuts and directly selected controls by actual write target. Keyboard Add/Edit/Move up/down/Remove; Enter applies, invalid draft retained, Escape cancels current interaction per II-02. Return restores exact parent/row focus.

**Compatibility:** No schema change required for regrouping; preserve IDs/native tags/content, styles, safe attrs and references. Structural corrections use atomic commands, not a new parallel property store.

**Acceptance (not run against redesign):**

- T-B69-column-01: Column style does not mutate parent gap.
- T-B69-column-02: Parent layout entry returns to exact column ID, preserving child drafts.

## B69-spacer

Source: `src/blocks/Basic/Spacer.tsx`. **Builder/current Inspector paths inspected in source. block-runtime-survey.json verifies insertion/tree/returned selection/default panel only. Redesigned controls, save/reopen and output NOT RUN.**

**Existing structure:** Observed generated native tree: <div>. Returned selection: spacer / div.

**Gap:** Empty spacer is intentional, not failed content; imported custom children must not be deleted.

**Disposition:** Keep + Regroup

**Owner:** Spacer element height/width and layout position.

**Editing home:** Style → Size/Spacing; Content → semantic identity/Attributes.

**Controls/validation:**

- Preset height40px; other supported CSS units/raw expressions preserved. Zero valid; remove override exposes fallback, not necessarily40.
- No automatic blank-text insertion. If existing unexpected children present show Custom structure and normal Layers route, not silent cleanup.

**Flow / cancellation / recovery:** Select spacer → Size → change height → check active breakpoint/source → Undo. Drag/reorder is parent structure command, not height edit.

**Permission, keyboard, batch and focus:** BIC-C01–07 and IC/II apply: actual target, descendants, ancestor locks, component scope, command/server authorization; structure single owner only; scalar batch explicitly compatible subtypes and accurate mixed state. Exclude native ID/label association, structural/type conversion, CMS binding, form transport and radio group/default actions from batch; deduplicate shortcuts and directly selected controls by actual write target. Keyboard Add/Edit/Move up/down/Remove; Enter applies, invalid draft retained, Escape cancels current interaction per II-02. Return restores exact parent/row focus.

**Compatibility:** No schema change required for regrouping; preserve IDs/native tags/content, styles, safe attrs and references. Structural corrections use atomic commands, not a new parallel property store.

**Acceptance (not run against redesign):**

- T-B69-spacer-01: 0/40px/auto/rem values represented without default coercion.
- T-B69-spacer-02: No imported child removal when Inspector opens.

## B69-theme-toggle

Source: `src/blocks/Basic/ThemeToggle.ts`. **Builder/current Inspector paths inspected in source. block-runtime-survey.json verifies insertion/tree/returned selection/default panel only. Redesigned controls, save/reopen and output NOT RUN.**

**Existing structure:** Observed generated native tree: <div> → [<button>, <button>]. Returned selection: container / div.

**Gap:** Auto-only Add eligibility and off-mode publish hiding must be visible; not local element theme setting.

**Disposition:** Keep special context + Fix scope

**Owner:** Site Brand owns mode/tokens; group+two buttons own local content/styles; visitor preference is runtime state.

**Editing home:** Existing Theme toggle special Inspector → exact Brand Colour mode; child styling via explicit parts/Layers.

**Controls/validation:**

- Group has light/dark data-bk-tt button roles and type=button. Show site Dark mode Off/Auto from canonical Brand; current Inspector explains hidden-on-publish when disabled.
- Open Brand → Colour mode preserves origin; requires Brand permission to change site mode. No duplicated local mode toggle. Local labels/accessibility edits target actual buttons, preserve runtime markers. Light/Dark visitor choice is distinct from site Auto/Off. Removing or changing a required light/dark part shows the functional consequence and explicit repair route; never automatically reconstruct the group.

**Flow / cancellation / recovery:** Select toggle → see site mode/status → exact Brand mode → save through existing Brand flow → Back to toggle. Cancel returns without site mutation; existing toggle stored even when not currently offered in Add.

**Permission, keyboard, batch and focus:** BIC-C01–07 and IC/II apply: actual target, descendants, ancestor locks, component scope, command/server authorization; structure single owner only; scalar batch explicitly compatible subtypes and accurate mixed state. Exclude native ID/label association, structural/type conversion, CMS binding, form transport and radio group/default actions from batch; deduplicate shortcuts and directly selected controls by actual write target. Keyboard Add/Edit/Move up/down/Remove; Enter applies, invalid draft retained, Escape cancels current interaction per II-02. Return restores exact parent/row focus.

**Compatibility:** No schema change required for regrouping; preserve IDs/native tags/content, styles, safe attrs and references. Structural corrections use atomic commands, not a new parallel property store.

**Acceptance (not run against redesign):**

- T-B69-theme-toggle-01: Off-mode existing toggle remains inspectable/stored and publish limit explicit.
- T-B69-theme-toggle-02: Brand mode update is site scope, not element override.
- T-B69-theme-toggle-03: Light/dark button marker IDs survive label edits.

## B69-section

Source: `src/blocks/Layout/Section.tsx`. **Builder/current Inspector paths inspected in source. block-runtime-survey.json verifies insertion/tree/returned selection/default panel only. Redesigned controls, save/reopen and output NOT RUN.**

**Existing structure:** Observed generated native tree: <section> → [<div>]. Returned selection: section / section.

**Gap:** A nested content max-width must not be mistaken for section width.

**Disposition:** Keep + Regroup

**Owner:** Section landmark root and nested content container are separate style owners.

**Editing home:** Content → section children; Style root spacing/fill; inner container layout via explicit child.

**Controls/validation:**

- Section label/native attrs on section; Content container row targets actual nested div. Existing landmark/accessibility names preserved.
- Root Fill/spacing and inner max-width/children layout remain distinct, each with source/reset. No new root max-width alias that writes a different owner.

**Flow / cancellation / recovery:** Select section → Content container → style max-width or edit child → Back to section. Delete section impact includes complete subtree.

**Permission, keyboard, batch and focus:** BIC-C01–07 and IC/II apply: actual target, descendants, ancestor locks, component scope, command/server authorization; structure single owner only; scalar batch explicitly compatible subtypes and accurate mixed state. Exclude native ID/label association, structural/type conversion, CMS binding, form transport and radio group/default actions from batch; deduplicate shortcuts and directly selected controls by actual write target. Keyboard Add/Edit/Move up/down/Remove; Enter applies, invalid draft retained, Escape cancels current interaction per II-02. Return restores exact parent/row focus.

**Compatibility:** No schema change required for regrouping; preserve IDs/native tags/content, styles, safe attrs and references. Structural corrections use atomic commands, not a new parallel property store.

**Acceptance (not run against redesign):**

- T-B69-section-01: Changing inner max-width leaves section full-width/background unchanged.
- T-B69-section-02: Nested return retains correct owner and Undo targets.

## B69-columns

Source: `src/blocks/Layout/Columns.tsx`. **Builder/current Inspector paths inspected in source. block-runtime-survey.json verifies insertion/tree/returned selection/default panel only. Redesigned controls, save/reopen and output NOT RUN.**

**Existing structure:** Observed generated native tree: <div> → [<div>, <div>]. Returned selection: columns / div.

**Gap:** 2-column preset structure exists; current attribute reads can disagree with actual children/CSS.

**Disposition:** Move + Fix

**Owner:** Columns root owns ordered column nodes; root CSS owns gap/layout.

**Editing home:** Content → Column count/items; Style → gap/layout.

**Controls/validation:**

- Preset creates2 real columns. Read actual count;2–6 convenience choices; preserve any custom/legacy count. Setting larger adds empty column units; no cloning populated user content implicitly.
- Reducing populated columns requires Move contents to last remaining column / Remove contents with impact / Cancel (INS-D05). Move preserves the removed column own text/content as well as descendants in order; never drop direct Column 1 caption content. If a lossless valid nesting transformation is unavailable, block Move with a reason and preserve the tree. Validate nesting, locks, component/CMS refs first. One transaction/Undo.
- Gap presets0/8/16/24/32px plus preserved custom CSS/units; actual active-layer gap owns value, no independent data-gap copy.

**Flow / cancellation / recovery:** Select root → count change → review affected children → choose explicit content treatment → atomic commit → select surviving column or return root. Invalid operation preserves original structure.

**Permission, keyboard, batch and focus:** BIC-C01–07 and IC/II apply: actual target, descendants, ancestor locks, component scope, command/server authorization; structure single owner only; scalar batch explicitly compatible subtypes and accurate mixed state. Exclude native ID/label association, structural/type conversion, CMS binding, form transport and radio group/default actions from batch; deduplicate shortcuts and directly selected controls by actual write target. Keyboard Add/Edit/Move up/down/Remove; Enter applies, invalid draft retained, Escape cancels current interaction per II-02. Return restores exact parent/row focus.

**Compatibility:** No schema change required for regrouping; preserve IDs/native tags/content, styles, safe attrs and references. Structural corrections use atomic commands, not a new parallel property store.

**Acceptance (not run against redesign):**

- T-B69-columns-01: Preset 2 reads2 after reselect; gap24px reads24px.
- T-B69-columns-02: Shrink populated columns Cancel exact; Move preserves IDs; Remove+Undo restores all.
- T-B69-columns-03: Mobile gap does not change Desktop or structural count.

## B69-columns3

Source: `src/blocks/Layout/Columns.tsx`. **Builder/current Inspector paths inspected in source. block-runtime-survey.json verifies insertion/tree/returned selection/default panel only. Redesigned controls, save/reopen and output NOT RUN.**

**Existing structure:** Observed generated native tree: <div> → [<div>, <div>, <div>]. Returned selection: columns / div.

**Gap:** 3-column preset structure exists; current attribute reads can disagree with actual children/CSS.

**Disposition:** Move + Fix

**Owner:** Columns root owns ordered column nodes; root CSS owns gap/layout.

**Editing home:** Content → Column count/items; Style → gap/layout.

**Controls/validation:**

- Preset creates3 real columns. Read actual count;2–6 convenience choices; preserve any custom/legacy count. Setting larger adds empty column units; no cloning populated user content implicitly.
- Reducing populated columns requires Move contents to last remaining column / Remove contents with impact / Cancel (INS-D05). Move preserves the removed column own text/content as well as descendants in order; never drop direct Column 1 caption content. If a lossless valid nesting transformation is unavailable, block Move with a reason and preserve the tree. Validate nesting, locks, component/CMS refs first. One transaction/Undo.
- Gap presets0/8/16/24/32px plus preserved custom CSS/units; actual active-layer gap owns value, no independent data-gap copy.

**Flow / cancellation / recovery:** Select root → count change → review affected children → choose explicit content treatment → atomic commit → select surviving column or return root. Invalid operation preserves original structure.

**Permission, keyboard, batch and focus:** BIC-C01–07 and IC/II apply: actual target, descendants, ancestor locks, component scope, command/server authorization; structure single owner only; scalar batch explicitly compatible subtypes and accurate mixed state. Exclude native ID/label association, structural/type conversion, CMS binding, form transport and radio group/default actions from batch; deduplicate shortcuts and directly selected controls by actual write target. Keyboard Add/Edit/Move up/down/Remove; Enter applies, invalid draft retained, Escape cancels current interaction per II-02. Return restores exact parent/row focus.

**Compatibility:** No schema change required for regrouping; preserve IDs/native tags/content, styles, safe attrs and references. Structural corrections use atomic commands, not a new parallel property store.

**Acceptance (not run against redesign):**

- T-B69-columns3-01: Preset 3 reads3 after reselect; gap24px reads24px.
- T-B69-columns3-02: Shrink populated columns Cancel exact; Move preserves IDs; Remove+Undo restores all.
- T-B69-columns3-03: Mobile gap does not change Desktop or structural count.

## B69-grid

Source: `src/blocks/Layout/Grid.tsx`. **Builder/current Inspector paths inspected in source. block-runtime-survey.json verifies insertion/tree/returned selection/default panel only. Redesigned controls, save/reopen and output NOT RUN.**

**Existing structure:** Observed generated native tree: <div> → [<div>, <div>, <div>]. Returned selection: grid / div.

**Gap:** Simple count can erase custom track expression; structure count differs from column count.

**Disposition:** Keep + Fix lossless tracks

**Owner:** Grid root CSS owns tracks/gaps; children own placement/content.

**Editing home:** Style → Children layout/Grid; Content → child items.

**Controls/validation:**

- Count1–24 is convenience for repeat(N,1fr), not child deletion. Custom tracks/rows (minmax/auto-fill/auto-fit etc) remain exact Custom; editing count explicitly replaces track expression only.
- Flow row/column/row dense/column dense; alignments and row/column gap from existing GridControls, supported CSS units. Advanced values preserved, no array mirror.
- Child placement opens actual child; do not flatten intrinsic sizing or explicit grid areas.

**Flow / cancellation / recovery:** Select grid → Style tracks/gap → explicit replacement if Custom → commit → child placement → Back. Undo restores entire original expression and layer.

**Permission, keyboard, batch and focus:** BIC-C01–07 and IC/II apply: actual target, descendants, ancestor locks, component scope, command/server authorization; structure single owner only; scalar batch explicitly compatible subtypes and accurate mixed state. Exclude native ID/label association, structural/type conversion, CMS binding, form transport and radio group/default actions from batch; deduplicate shortcuts and directly selected controls by actual write target. Keyboard Add/Edit/Move up/down/Remove; Enter applies, invalid draft retained, Escape cancels current interaction per II-02. Return restores exact parent/row focus.

**Compatibility:** No schema change required for regrouping; preserve IDs/native tags/content, styles, safe attrs and references. Structural corrections use atomic commands, not a new parallel property store.

**Acceptance (not run against redesign):**

- T-B69-grid-01: Three children remain when grid columns count changes.
- T-B69-grid-02: auto-fill/minmax survives opening and unrelated gap edit.
- T-B69-grid-03: Invalid count retains draft and no style rewrite.

## B69-flex

Source: `src/blocks/Layout/Flex.tsx`. **Builder/current Inspector paths inspected in source. block-runtime-survey.json verifies insertion/tree/returned selection/default panel only. Redesigned controls, save/reopen and output NOT RUN.**

**Existing structure:** Observed generated native tree: <div> → [<div>, <div>, <div>]. Returned selection: flex / div.

**Gap:** Visual reverse/order is not native document order or keyboard order.

**Disposition:** Keep + Regroup

**Owner:** Flex root owns direction/wrap/gap/alignment; each child owns order/grow/shrink/basis.

**Editing home:** Style → Children layout/Flex; Content → Children; child Style → Placement.

**Controls/validation:**

- Row/Column + reverse; wrap/nowrap/wrap-reverse and existing alignment enums; gap same shared CSS units/source.
- Child list remains document order and indicates when visual ordering differs. Reorder document children is explicit structural command; toggling reverse changes CSS only.

**Flow / cancellation / recovery:** Select flex → direction/wrap → choose child for sizing → Back. Move up/down changes document order with warning when CSS order differs; one Undo.

**Permission, keyboard, batch and focus:** BIC-C01–07 and IC/II apply: actual target, descendants, ancestor locks, component scope, command/server authorization; structure single owner only; scalar batch explicitly compatible subtypes and accurate mixed state. Exclude native ID/label association, structural/type conversion, CMS binding, form transport and radio group/default actions from batch; deduplicate shortcuts and directly selected controls by actual write target. Keyboard Add/Edit/Move up/down/Remove; Enter applies, invalid draft retained, Escape cancels current interaction per II-02. Return restores exact parent/row focus.

**Compatibility:** No schema change required for regrouping; preserve IDs/native tags/content, styles, safe attrs and references. Structural corrections use atomic commands, not a new parallel property store.

**Acceptance (not run against redesign):**

- T-B69-flex-01: Reverse does not reorder saved children.
- T-B69-flex-02: Gap and child basis changes target distinct owners.

## B69-collection-list

Source: `src/blocks/Layout/CollectionList.tsx`. **Builder/current Inspector paths inspected in source. block-runtime-survey.json verifies insertion/tree/returned selection/default panel only. Redesigned controls, save/reopen and output NOT RUN.**

**Existing structure:** Observed generated native tree: <div> → [<div> → [<div>, <h3>, <p>]]. Returned selection: collection-list / div.

**Gap:** Repeated runtime instances are not independent saved children; placeholder source is not configured collection.

**Disposition:** Move + Fix boundaries

**Owner:** Selected list/site document owns collection reference, limit/query configuration and item-template tree; CMSBindingManager is the canonical engine writer, not the resource owner. Collection schema and records remain CMS-owned.

**Editing home:** Content → Collection, Show items, template, New collection and Open collection; Style → list layout; exact CMS workspace return.

**Controls/validation:**

- Choose real stable collection ID; show loading/no collections/missing collection/no results distinctly. CollectionListSection currently exposes Collection, New collection when callback exists, Show items, and Open collection; no filter/sort authoring there. Preserve stored query/filter/sort fields without inventing mounted controls or binding by name. Show items is All or integer 1…CMS_COLLECTION_LIMIT_MAX (currently 10,000); preserve legacy zero sentinel on read. Reject fractional/out-of-range drafts, never parseInt/clamp. Patch limit only, preserving all other binding/template configuration.
- Select repeated result for template edit must say Editing item template · affects all results. Record editing goes exact CMS record if permitted; no text overwrite of resolved record output.
- Disconnect retains the authored item-template tree, not materialized rendered records. Rebind reviews incompatible descendant field references and offers explicit mapping / Retain unresolved / Cancel; missing fields show their fallback, never silent arbitrary mapping. Binding and affected template edits commit in one history transaction. Initial {{item.name}}/{{item.description}} are template placeholders, not evidence of data.

**Flow / cancellation / recovery:** Select list → choose collection → preview results → edit template child → Back to list. New collection opens the existing creation route only with callback/permission and returns the original list; bind the confirmed created ID only after explicit successful result. Open collection/record targets the exact CMS resource and returns original page/list/query/draft; failed data fetch does not clear binding.

**Permission, keyboard, batch and focus:** BIC-C01–07 and IC/II apply: actual target, descendants, ancestor locks, component scope, command/server authorization; structure single owner only; scalar batch explicitly compatible subtypes and accurate mixed state. Exclude native ID/label association, structural/type conversion, CMS binding, form transport and radio group/default actions from batch; deduplicate shortcuts and directly selected controls by actual write target. Keyboard Add/Edit/Move up/down/Remove; Enter applies, invalid draft retained, Escape cancels current interaction per II-02. Return restores exact parent/row focus.

**Compatibility:** Preserve canonical CMS binding manager ID/query/template, all custom children and tokens. Existing catalog collection-list is separate from reserved product-grid; no conversion/data migration implied.

**Acceptance (not run against redesign):**

- T-B69-collection-list-01: No configured source distinct from empty results and error.
- T-B69-collection-list-02: Template edit affects all repeated results; record change stays in CMS.
- T-B69-collection-list-03: Deleted/retyped field retains missing binding and safe fallback; Undo restores reference.

## B69-form

Source: `src/blocks/Forms/Form.tsx`. **Builder/current Inspector paths inspected in source. block-runtime-survey.json verifies insertion/tree/returned selection/default panel only. Redesigned controls, save/reopen and output NOT RUN.**

**Existing structure:** Observed generated native tree: <form> → [<input>, <input>, <button>]. Returned selection: form / form.

**Gap:** Field discovery/reordering/conversion and delivery must not imply nonexistent file service or duplicate native attrs.

**Disposition:** Move + Fix

**Owner:** Form element owns native fields/transport; service record owns delivery/settings and permissions.

**Editing home:** Content → Fields/structure; Behaviour → Submission/after-submit; service exact setup subview.

**Controls/validation:**

- Fields rows identify actual native tag/type, including select and textarea; associated label is separate owner. Move entire proven wrapper, never move input into adjacent wrapper. Complex shared wrapper requires explicit grouping route.
- Submission Managed/action absent versus Native current document/action empty versus Custom endpoint/action nonempty per BIC-C06. Preserve method GET/POST and encoding urlencoded/multipart/text-plain only as native-supported values; managed actual service imposes own transport.
- Service message/redirect/spam/recipient controls keep existing permission+save behavior; form content and service save status remain distinct. File field warns built-in delivery unavailable, native compatible custom endpoint may be configured intentionally.

**Flow / cancellation / recovery:** Select form → Fields → field settings/label → Back → Submission mode/setup → confirm service save → Preview limited to configured mode. Cancel setting draft preserves previous delivery; backend failure keeps document fields/draft. Deletion removes form content, not submission records without separate action.

**Permission, keyboard, batch and focus:** BIC-C01–07 and IC/II apply: actual target, descendants, ancestor locks, component scope, command/server authorization; structure single owner only; scalar batch explicitly compatible subtypes and accurate mixed state. Exclude native ID/label association, structural/type conversion, CMS binding, form transport and radio group/default actions from batch; deduplicate shortcuts and directly selected controls by actual write target. Keyboard Add/Edit/Move up/down/Remove; Enter applies, invalid draft retained, Escape cancels current interaction per II-02. Return restores exact parent/row focus.

**Compatibility:** No schema change required for regrouping; preserve IDs/native tags/content, styles, safe attrs and references. Structural corrections use atomic commands, not a new parallel property store.

**Acceptance (not run against redesign):**

- T-B69-form-01: Stock field list classifies select correctly.
- T-B69-form-02: Move label+input wrapper preserves association, layout and IDs.
- T-B69-form-03: Absent/empty/custom action survives Undo/reopen/publish distinction.
- T-B69-form-04: No success claim for multipart/file delivery absent service.

## B69-input

Source: `src/blocks/Forms/Input.tsx`. **Builder/current Inspector paths inspected in source. block-runtime-survey.json verifies insertion/tree/returned selection/default panel only. Redesigned controls, save/reopen and output NOT RUN.**

**Existing structure:** Observed generated native tree: <input>. Returned selection: input / input.

**Gap:** Internal ElementType alone does not identify native input subtype. Generic Default/Placeholder rows may be invalid or incomplete for this field.

**Disposition:** Move + Fix subtype dispatch

**Owner:** Actual native form control owns name/default/constraints; associated label owns visible text; form owns submission.

**Editing home:** Content → Field/subtype and validation; Style → native field appearance.

**Controls/validation:**

- Name is submission key, not visible label. Empty/absent preserved and not submitted as a named field; duplicate names may be intentional and must not be deduplicated. BIC-C07 blocks newly entered names removed by the canonical sanitizer, while legacy names remain visible. Existing PropertyField has only a local five-name warning set; the canonical validator is proposed, not implemented. Label target via native id/for or containing label; placeholder never substitutes for label.
- BIC-C07 native eligibility matrix governs Required, Disabled, Read-only, Placeholder, lengths, pattern, multiple and bounds. Do not show flags with no native effect as functional controls; preserve stored unsupported attributes through native/custom inspection. Eligible booleans use presence/removal. Eligible Read-only/autocomplete/lengths/pattern live in Content → Advanced attributes; no silent empty-string removal. Attributes apply across breakpoints.
- Type conversion preserves engine/native IDs, association, data/CMS/interaction refs and compatible attrs/styles. Show affected unsupported attrs/content before Apply; retain them as legacy data if safe, or refuse conversion if lossless transformation cannot be supported. Never recreate node with only five attrs; no implicit multi-type conversion.
- Type selector preserves current14 supported choices: text,email,password,number,tel,url,date,time,datetime-local,search,file,hidden,range,color. Existing other native types stay Custom and editable through applicable safe routes; do not coerce.
- Text default string and placeholder independent; empty default is explicit empty attr, Reset removes. Pattern stays raw valid pattern with local error on invalid syntax; default does not need to match example placeholder. Hidden type selection stays accessible in Layers.

**Flow / cancellation / recovery:** Select actual field or Form → Fields row → same subtype controls → valid edit/inline validation → Back to form/associated label. Required/type/constraint change identifies scope across breakpoints; invalid input retained, Cancel restores current interaction, one Undo restores exact attr presence and dependent constraints. 

**Permission, keyboard, batch and focus:** BIC-C01–07 and IC/II apply: actual target, descendants, ancestor locks, component scope, command/server authorization; structure single owner only; scalar batch explicitly compatible subtypes and accurate mixed state. Exclude native ID/label association, structural/type conversion, CMS binding, form transport and radio group/default actions from batch; deduplicate shortcuts and directly selected controls by actual write target. Keyboard Add/Edit/Move up/down/Remove; Enter applies, invalid draft retained, Escape cancels current interaction per II-02. Return restores exact parent/row focus.

**Compatibility:** No schema change required for regrouping; preserve IDs/native tags/content, styles, safe attrs and references. Structural corrections use atomic commands, not a new parallel property store.

**Acceptance (not run against redesign):**

- T-B69-input-01: Default empty versus removed survives Undo.
- T-B69-input-02: Converting text→textarea preserves ID/for/refs or refuses before mutation.
- T-B69-input-03: Selecting file/range immediately changes eligible controls, not only type label.

## B69-textarea

Source: `src/blocks/Forms/Textarea.tsx`. **Builder/current Inspector paths inspected in source. block-runtime-survey.json verifies insertion/tree/returned selection/default panel only. Redesigned controls, save/reopen and output NOT RUN.**

**Existing structure:** Observed generated native tree: <textarea>. Returned selection: textarea / textarea.

**Gap:** Internal ElementType alone does not identify native input subtype. Generic Default/Placeholder rows may be invalid or incomplete for this field.

**Disposition:** Move + Fix subtype dispatch

**Owner:** Actual native form control owns name/default/constraints; associated label owns visible text; form owns submission.

**Editing home:** Content → Field/subtype and validation; Style → native field appearance.

**Controls/validation:**

- Name is submission key, not visible label. Empty/absent preserved and not submitted as a named field; duplicate names may be intentional and must not be deduplicated. BIC-C07 blocks newly entered names removed by the canonical sanitizer, while legacy names remain visible. Existing PropertyField has only a local five-name warning set; the canonical validator is proposed, not implemented. Label target via native id/for or containing label; placeholder never substitutes for label.
- BIC-C07 native eligibility matrix governs Required, Disabled, Read-only, Placeholder, lengths, pattern, multiple and bounds. Do not show flags with no native effect as functional controls; preserve stored unsupported attributes through native/custom inspection. Eligible booleans use presence/removal. Eligible Read-only/autocomplete/lengths/pattern live in Content → Advanced attributes; no silent empty-string removal. Attributes apply across breakpoints.
- Type conversion preserves engine/native IDs, association, data/CMS/interaction refs and compatible attrs/styles. Show affected unsupported attrs/content before Apply; retain them as legacy data if safe, or refuse conversion if lossless transformation cannot be supported. Never recreate node with only five attrs; no implicit multi-type conversion.
- Default native text content is canonical; legacy value attr conflict and repair per BIC-C06. Rich imported children remain visible and protected; no blind root setContent that loses structure.
- Rows positive integer; preset has no rows attribute (4 is only the current Inspector placeholder). Show Browser default when absent, distinct from explicitly authored 4. minlength/maxlength nonnegative integers/absent with max≥min when both; placeholder optional. Required/disabled/readOnly supported native flags.

**Flow / cancellation / recovery:** Select actual field or Form → Fields row → same subtype controls → valid edit/inline validation → Back to form/associated label. Required/type/constraint change identifies scope across breakpoints; invalid input retained, Cancel restores current interaction, one Undo restores exact attr presence and dependent constraints. 

**Permission, keyboard, batch and focus:** BIC-C01–07 and IC/II apply: actual target, descendants, ancestor locks, component scope, command/server authorization; structure single owner only; scalar batch explicitly compatible subtypes and accurate mixed state. Exclude native ID/label association, structural/type conversion, CMS binding, form transport and radio group/default actions from batch; deduplicate shortcuts and directly selected controls by actual write target. Keyboard Add/Edit/Move up/down/Remove; Enter applies, invalid draft retained, Escape cancels current interaction per II-02. Return restores exact parent/row focus.

**Compatibility:** No schema change required for regrouping; preserve IDs/native tags/content, styles, safe attrs and references. Structural corrections use atomic commands, not a new parallel property store.

**Acceptance (not run against redesign):**

- T-B69-textarea-01: Conflicting content/value opens unchanged with visible conflict.
- T-B69-textarea-02: Rows0 invalid, empty removes attr; default empty remains empty.
- T-B69-textarea-03: Typing/Undo preserves native content, ID, associated label.

## B69-select

Source: `src/blocks/Forms/Select.tsx`. **Builder/current Inspector paths inspected in source. block-runtime-survey.json verifies insertion/tree/returned selection/default panel only. Redesigned controls, save/reopen and output NOT RUN.**

**Existing structure:** Observed generated native tree: <select> → [<option>, <option>]. Returned selection: select / select.

**Gap:** Internal ElementType alone does not identify native input subtype. Generic Default/Placeholder rows may be invalid or incomplete for this field.

**Disposition:** Move + Fix subtype dispatch

**Owner:** Actual native form control owns name/default/constraints; associated label owns visible text; form owns submission.

**Editing home:** Content → Field/subtype and validation; Style → native field appearance.

**Controls/validation:**

- Name is submission key, not visible label. Empty/absent preserved and not submitted as a named field; duplicate names may be intentional and must not be deduplicated. BIC-C07 blocks newly entered names removed by the canonical sanitizer, while legacy names remain visible. Existing PropertyField has only a local five-name warning set; the canonical validator is proposed, not implemented. Label target via native id/for or containing label; placeholder never substitutes for label.
- BIC-C07 native eligibility matrix governs Required, Disabled, Read-only, Placeholder, lengths, pattern, multiple and bounds. Do not show flags with no native effect as functional controls; preserve stored unsupported attributes through native/custom inspection. Eligible booleans use presence/removal. Eligible Read-only/autocomplete/lengths/pattern live in Content → Advanced attributes; no silent empty-string removal. Attributes apply across breakpoints.
- Type conversion preserves engine/native IDs, association, data/CMS/interaction refs and compatible attrs/styles. Show affected unsupported attrs/content before Apply; retain them as legacy data if safe, or refuse conversion if lossless transformation cannot be supported. Never recreate node with only five attrs; no implicit multi-type conversion.
- Tree-backed Options list: text, optional label attribute, optional submission value, selected default, disabled, optgroup; preserve all native IDs/attrs. Absent value uses option text, not label attr; explicit empty is not absence.
- Options Add/Duplicate/Move/Remove act actual option/optgroup nodes. New option has editable text, absent value by default; no raw content-only rewrite. Multiple→single choice per BIC-C06, optgroup/selected flags preserved; size positive integer/absent via advanced.
- Required and Multiple flags alter native selection, not number of document children. Batch option-structure edit not supported.

**Flow / cancellation / recovery:** Select actual field or Form → Fields row → same subtype controls → valid edit/inline validation → Back to form/associated label. Required/type/constraint change identifies scope across breakpoints; invalid input retained, Cancel restores current interaction, one Undo restores exact attr presence and dependent constraints. 

**Permission, keyboard, batch and focus:** BIC-C01–07 and IC/II apply: actual target, descendants, ancestor locks, component scope, command/server authorization; structure single owner only; scalar batch explicitly compatible subtypes and accurate mixed state. Exclude native ID/label association, structural/type conversion, CMS binding, form transport and radio group/default actions from batch; deduplicate shortcuts and directly selected controls by actual write target. Keyboard Add/Edit/Move up/down/Remove; Enter applies, invalid draft retained, Escape cancels current interaction per II-02. Return restores exact parent/row focus.

**Compatibility:** No schema change required for regrouping; preserve IDs/native tags/content, styles, safe attrs and references. Structural corrections use atomic commands, not a new parallel property store.

**Acceptance (not run against redesign):**

- T-B69-select-01: Stock two options read as two; rename first still exactlytwo with sameIDs.
- T-B69-select-02: Optgroup/label/text/value/disabled/selected survive reorder+Undo.
- T-B69-select-03: Multiple→single requires explicit default choice and respects locked option.

## B69-checkbox

Source: `src/blocks/Forms/Checkbox.tsx`. **Builder/current Inspector paths inspected in source. block-runtime-survey.json verifies insertion/tree/returned selection/default panel only. Redesigned controls, save/reopen and output NOT RUN.**

**Existing structure:** Observed generated native tree: <label> → [<input>, <span>]. Returned selection: checkbox / label.

**Gap:** Internal ElementType alone does not identify native input subtype. Generic Default/Placeholder rows may be invalid or incomplete for this field.

**Disposition:** Move + Fix subtype dispatch

**Owner:** Actual native form control owns name/default/constraints; associated label owns visible text; form owns submission.

**Editing home:** Content → Field/subtype and validation; Style → native field appearance.

**Controls/validation:**

- Name is submission key, not visible label. Empty/absent preserved and not submitted as a named field; duplicate names may be intentional and must not be deduplicated. BIC-C07 blocks newly entered names removed by the canonical sanitizer, while legacy names remain visible. Existing PropertyField has only a local five-name warning set; the canonical validator is proposed, not implemented. Label target via native id/for or containing label; placeholder never substitutes for label.
- BIC-C07 native eligibility matrix governs Required, Disabled, Read-only, Placeholder, lengths, pattern, multiple and bounds. Do not show flags with no native effect as functional controls; preserve stored unsupported attributes through native/custom inspection. Eligible booleans use presence/removal. Eligible Read-only/autocomplete/lengths/pattern live in Content → Advanced attributes; no silent empty-string removal. Attributes apply across breakpoints.
- Type conversion preserves engine/native IDs, association, data/CMS/interaction refs and compatible attrs/styles. Show affected unsupported attrs/content before Apply; retain them as legacy data if safe, or refuse conversion if lossless transformation cannot be supported. Never recreate node with only five attrs; no implicit multi-type conversion.
- Wrapper label contains native input[type=checkbox] + caption. Direct inner-input selection and wrapper shortcut reach same native owner. Submission value string: absent native default, explicit empty, nonempty all distinct.
- Checked by default/Required/Disabled at native input; visible label text actual caption. Do not pick arbitrary first non-input node in custom structure. Checkbox same-name multi-values use actual transport encoding limits.

**Flow / cancellation / recovery:** Select actual field or Form → Fields row → same subtype controls → valid edit/inline validation → Back to form/associated label. Required/type/constraint change identifies scope across breakpoints; invalid input retained, Cancel restores current interaction, one Undo restores exact attr presence and dependent constraints. 

**Permission, keyboard, batch and focus:** BIC-C01–07 and IC/II apply: actual target, descendants, ancestor locks, component scope, command/server authorization; structure single owner only; scalar batch explicitly compatible subtypes and accurate mixed state. Exclude native ID/label association, structural/type conversion, CMS binding, form transport and radio group/default actions from batch; deduplicate shortcuts and directly selected controls by actual write target. Keyboard Add/Edit/Move up/down/Remove; Enter applies, invalid draft retained, Escape cancels current interaction per II-02. Return restores exact parent/row focus.

**Compatibility:** No schema change required for regrouping; preserve IDs/native tags/content, styles, safe attrs and references. Structural corrections use atomic commands, not a new parallel property store.

**Acceptance (not run against redesign):**

- T-B69-checkbox-01: Wrapper and direct input show same value/checked; lock on either prevents shortcutwrite.
- T-B69-checkbox-02: Label text edit leaves input and styling intact.
- T-B69-checkbox-03: Default checked changes saved default, not temporary visitor state.

## B69-radio

Source: `src/blocks/Forms/Radio.tsx`. **Builder/current Inspector paths inspected in source. block-runtime-survey.json verifies insertion/tree/returned selection/default panel only. Redesigned controls, save/reopen and output NOT RUN.**

**Existing structure:** Observed generated native tree: <label> → [<input>, <span>]. Returned selection: radio / label.

**Gap:** Internal ElementType alone does not identify native input subtype. Generic Default/Placeholder rows may be invalid or incomplete for this field.

**Disposition:** Move + Fix subtype dispatch

**Owner:** Actual native form control owns name/default/constraints; associated label owns visible text; form owns submission.

**Editing home:** Content → Field/subtype and validation; Style → native field appearance.

**Controls/validation:**

- Name is submission key, not visible label. Empty/absent preserved and not submitted as a named field; duplicate names may be intentional and must not be deduplicated. BIC-C07 blocks newly entered names removed by the canonical sanitizer, while legacy names remain visible. Existing PropertyField has only a local five-name warning set; the canonical validator is proposed, not implemented. Label target via native id/for or containing label; placeholder never substitutes for label.
- BIC-C07 native eligibility matrix governs Required, Disabled, Read-only, Placeholder, lengths, pattern, multiple and bounds. Do not show flags with no native effect as functional controls; preserve stored unsupported attributes through native/custom inspection. Eligible booleans use presence/removal. Eligible Read-only/autocomplete/lengths/pattern live in Content → Advanced attributes; no silent empty-string removal. Attributes apply across breakpoints.
- Type conversion preserves engine/native IDs, association, data/CMS/interaction refs and compatible attrs/styles. Show affected unsupported attrs/content before Apply; retain them as legacy data if safe, or refuse conversion if lossless transformation cannot be supported. Never recreate node with only five attrs; no implicit multi-type conversion.
- Native radio input within label wrapper, caption separate. Name defines group with resolved form owner, not nearest visual row; Default checked single-winner atomic action per BIC-C06.
- Submission value absent/empty/nonempty distinct. Renaming/moving checked field into another checked group requires explicit keep-default choice, with every affected member authorized.

**Flow / cancellation / recovery:** Select actual field or Form → Fields row → same subtype controls → valid edit/inline validation → Back to form/associated label. Required/type/constraint change identifies scope across breakpoints; invalid input retained, Cancel restores current interaction, one Undo restores exact attr presence and dependent constraints. 

**Permission, keyboard, batch and focus:** BIC-C01–07 and IC/II apply: actual target, descendants, ancestor locks, component scope, command/server authorization; structure single owner only; scalar batch explicitly compatible subtypes and accurate mixed state. Exclude native ID/label association, structural/type conversion, CMS binding, form transport and radio group/default actions from batch; deduplicate shortcuts and directly selected controls by actual write target. Keyboard Add/Edit/Move up/down/Remove; Enter applies, invalid draft retained, Escape cancels current interaction per II-02. Return restores exact parent/row focus.

**Compatibility:** No schema change required for regrouping; preserve IDs/native tags/content, styles, safe attrs and references. Structural corrections use atomic commands, not a new parallel property store.

**Acceptance (not run against redesign):**

- T-B69-radio-01: Selecting default clears grouppeers inoneUndo; lockedpeer blocksall.
- T-B69-radio-02: Two forms same name do not change eachother.
- T-B69-radio-03: Rename/move conflict reviewed; caption/input IDs preserved.

## B69-file

Source: `src/blocks/Forms/FileInput.tsx`. **Builder/current Inspector paths inspected in source. block-runtime-survey.json verifies insertion/tree/returned selection/default panel only. Redesigned controls, save/reopen and output NOT RUN.**

**Existing structure:** Observed generated native tree: <input>. Returned selection: input / input.

**Gap:** Internal ElementType alone does not identify native input subtype. Generic Default/Placeholder rows may be invalid or incomplete for this field.

**Disposition:** Move + Fix subtype dispatch

**Owner:** Actual native form control owns name/default/constraints; associated label owns visible text; form owns submission.

**Editing home:** Content → Field/subtype and validation; Style → native field appearance.

**Controls/validation:**

- Name is submission key, not visible label. Empty/absent preserved and not submitted as a named field; duplicate names may be intentional and must not be deduplicated. BIC-C07 blocks newly entered names removed by the canonical sanitizer, while legacy names remain visible. Existing PropertyField has only a local five-name warning set; the canonical validator is proposed, not implemented. Label target via native id/for or containing label; placeholder never substitutes for label.
- BIC-C07 native eligibility matrix governs Required, Disabled, Read-only, Placeholder, lengths, pattern, multiple and bounds. Do not show flags with no native effect as functional controls; preserve stored unsupported attributes through native/custom inspection. Eligible booleans use presence/removal. Eligible Read-only/autocomplete/lengths/pattern live in Content → Advanced attributes; no silent empty-string removal. Attributes apply across breakpoints.
- Type conversion preserves engine/native IDs, association, data/CMS/interaction refs and compatible attrs/styles. Show affected unsupported attrs/content before Apply; retain them as legacy data if safe, or refuse conversion if lossless transformation cannot be supported. Never recreate node with only five attrs; no implicit multi-type conversion.
- File native control: accept comma-separated valid extensions/MIME tokens or audio/*/video/*/image/*; blank removes accept, means any file. Invalid token retains draft; picker hint is not server validation.
- Multiple boolean; required/disabled; no authored nonempty default file/path. Previously stored value surfaced legacy/inert and preserved until explicit clear; uploaded editor Assets are a different resource.
- Built-in route/schema does not establish multipart bytes. Submission card shows file-delivery limitation and existing native compatible custom endpoint route; no imagined upload storage or size-limit guarantee.

**Flow / cancellation / recovery:** Select actual field or Form → Fields row → same subtype controls → valid edit/inline validation → Back to form/associated label. Required/type/constraint change identifies scope across breakpoints; invalid input retained, Cancel restores current interaction, one Undo restores exact attr presence and dependent constraints. 

**Permission, keyboard, batch and focus:** BIC-C01–07 and IC/II apply: actual target, descendants, ancestor locks, component scope, command/server authorization; structure single owner only; scalar batch explicitly compatible subtypes and accurate mixed state. Exclude native ID/label association, structural/type conversion, CMS binding, form transport and radio group/default actions from batch; deduplicate shortcuts and directly selected controls by actual write target. Keyboard Add/Edit/Move up/down/Remove; Enter applies, invalid draft retained, Escape cancels current interaction per II-02. Return restores exact parent/row focus.

**Compatibility:** No schema change required for regrouping; preserve IDs/native tags/content, styles, safe attrs and references. Structural corrections use atomic commands, not a new parallel property store.

**Acceptance (not run against redesign):**

- T-B69-file-01: No settabledefaultfile or path exposed.
- T-B69-file-02: accept/multiple serialize faithfully; invalidtoken rejected locally.
- T-B69-file-03: Manageddelivery configuration never claims filebytes supported.

## B69-date

Source: `src/blocks/Forms/DateInput.tsx`. **Builder/current Inspector paths inspected in source. block-runtime-survey.json verifies insertion/tree/returned selection/default panel only. Redesigned controls, save/reopen and output NOT RUN.**

**Existing structure:** Observed generated native tree: <input>. Returned selection: input / input.

**Gap:** Internal ElementType alone does not identify native input subtype. Generic Default/Placeholder rows may be invalid or incomplete for this field.

**Disposition:** Move + Fix subtype dispatch

**Owner:** Actual native form control owns name/default/constraints; associated label owns visible text; form owns submission.

**Editing home:** Content → Field/subtype and validation; Style → native field appearance.

**Controls/validation:**

- Name is submission key, not visible label. Empty/absent preserved and not submitted as a named field; duplicate names may be intentional and must not be deduplicated. BIC-C07 blocks newly entered names removed by the canonical sanitizer, while legacy names remain visible. Existing PropertyField has only a local five-name warning set; the canonical validator is proposed, not implemented. Label target via native id/for or containing label; placeholder never substitutes for label.
- BIC-C07 native eligibility matrix governs Required, Disabled, Read-only, Placeholder, lengths, pattern, multiple and bounds. Do not show flags with no native effect as functional controls; preserve stored unsupported attributes through native/custom inspection. Eligible booleans use presence/removal. Eligible Read-only/autocomplete/lengths/pattern live in Content → Advanced attributes; no silent empty-string removal. Attributes apply across breakpoints.
- Type conversion preserves engine/native IDs, association, data/CMS/interaction refs and compatible attrs/styles. Show affected unsupported attrs/content before Apply; retain them as legacy data if safe, or refuse conversion if lossless transformation cannot be supported. Never recreate node with only five attrs; no implicit multi-type conversion.
- Default/min/max are native date YYYY-MM-DD or absent, validate actual calendar date including leap days. No timezone conversion. Min≤Max; default ifnonempty must satisfy chosen bounds and step, otherwise keep draft; never clamp existing value.
- Step positive integer days or any; absent native step1. Preserve custom valid old values; bounds edits that invalidate current default require explicit correction, no partial batch.

**Flow / cancellation / recovery:** Select actual field or Form → Fields row → same subtype controls → valid edit/inline validation → Back to form/associated label. Required/type/constraint change identifies scope across breakpoints; invalid input retained, Cancel restores current interaction, one Undo restores exact attr presence and dependent constraints. 

**Permission, keyboard, batch and focus:** BIC-C01–07 and IC/II apply: actual target, descendants, ancestor locks, component scope, command/server authorization; structure single owner only; scalar batch explicitly compatible subtypes and accurate mixed state. Exclude native ID/label association, structural/type conversion, CMS binding, form transport and radio group/default actions from batch; deduplicate shortcuts and directly selected controls by actual write target. Keyboard Add/Edit/Move up/down/Remove; Enter applies, invalid draft retained, Escape cancels current interaction per II-02. Return restores exact parent/row focus.

**Compatibility:** No schema change required for regrouping; preserve IDs/native tags/content, styles, safe attrs and references. Structural corrections use atomic commands, not a new parallel property store.

**Acceptance (not run against redesign):**

- T-B69-date-01: Invalid2026-02-30 notcommitted; validleapdate preserved.
- T-B69-date-02: 0/empty bound notconverted to1970; reset removesattr.
- T-B69-date-03: Min/max/default revision one atomic valid operation orblocked.

## B69-time

Source: `src/blocks/Forms/TimeInput.tsx`. **Builder/current Inspector paths inspected in source. block-runtime-survey.json verifies insertion/tree/returned selection/default panel only. Redesigned controls, save/reopen and output NOT RUN.**

**Existing structure:** Observed generated native tree: <input>. Returned selection: input / input.

**Gap:** Internal ElementType alone does not identify native input subtype. Generic Default/Placeholder rows may be invalid or incomplete for this field.

**Disposition:** Move + Fix subtype dispatch

**Owner:** Actual native form control owns name/default/constraints; associated label owns visible text; form owns submission.

**Editing home:** Content → Field/subtype and validation; Style → native field appearance.

**Controls/validation:**

- Name is submission key, not visible label. Empty/absent preserved and not submitted as a named field; duplicate names may be intentional and must not be deduplicated. BIC-C07 blocks newly entered names removed by the canonical sanitizer, while legacy names remain visible. Existing PropertyField has only a local five-name warning set; the canonical validator is proposed, not implemented. Label target via native id/for or containing label; placeholder never substitutes for label.
- BIC-C07 native eligibility matrix governs Required, Disabled, Read-only, Placeholder, lengths, pattern, multiple and bounds. Do not show flags with no native effect as functional controls; preserve stored unsupported attributes through native/custom inspection. Eligible booleans use presence/removal. Eligible Read-only/autocomplete/lengths/pattern live in Content → Advanced attributes; no silent empty-string removal. Attributes apply across breakpoints.
- Type conversion preserves engine/native IDs, association, data/CMS/interaction refs and compatible attrs/styles. Show affected unsupported attrs/content before Apply; retain them as legacy data if safe, or refuse conversion if lossless transformation cannot be supported. Never recreate node with only five attrs; no implicit multi-type conversion.
- Default/min/max HH:mm with optional seconds/fraction allowed by existing native semantics; preserve exact precision. Step positive finite seconds or any; absent native60seconds.
- Time has periodic domain: min22:00/max06:00 may be an overnight range; show Overnight, do not use numeric min≤max rejection. No timezone field or automatic UTC conversion. Default validates interval/step before commit.

**Flow / cancellation / recovery:** Select actual field or Form → Fields row → same subtype controls → valid edit/inline validation → Back to form/associated label. Required/type/constraint change identifies scope across breakpoints; invalid input retained, Cancel restores current interaction, one Undo restores exact attr presence and dependent constraints. 

**Permission, keyboard, batch and focus:** BIC-C01–07 and IC/II apply: actual target, descendants, ancestor locks, component scope, command/server authorization; structure single owner only; scalar batch explicitly compatible subtypes and accurate mixed state. Exclude native ID/label association, structural/type conversion, CMS binding, form transport and radio group/default actions from batch; deduplicate shortcuts and directly selected controls by actual write target. Keyboard Add/Edit/Move up/down/Remove; Enter applies, invalid draft retained, Escape cancels current interaction per II-02. Return restores exact parent/row focus.

**Compatibility:** No schema change required for regrouping; preserve IDs/native tags/content, styles, safe attrs and references. Structural corrections use atomic commands, not a new parallel property store.

**Acceptance (not run against redesign):**

- T-B69-time-01: 22:00→06:00 range accepted asovernight;12:00default rejected.
- T-B69-time-02: Fractionalseconds/step and absentvalues roundtrip withouttruncation.
- T-B69-time-03: Timezone interpretation never silentlychanges on edit.

## B69-email

Source: `src/blocks/Forms/EmailInput.tsx`. **Builder/current Inspector paths inspected in source. block-runtime-survey.json verifies insertion/tree/returned selection/default panel only. Redesigned controls, save/reopen and output NOT RUN.**

**Existing structure:** Observed generated native tree: <input>. Returned selection: input / input.

**Gap:** Internal ElementType alone does not identify native input subtype. Generic Default/Placeholder rows may be invalid or incomplete for this field.

**Disposition:** Move + Fix subtype dispatch

**Owner:** Actual native form control owns name/default/constraints; associated label owns visible text; form owns submission.

**Editing home:** Content → Field/subtype and validation; Style → native field appearance.

**Controls/validation:**

- Name is submission key, not visible label. Empty/absent preserved and not submitted as a named field; duplicate names may be intentional and must not be deduplicated. BIC-C07 blocks newly entered names removed by the canonical sanitizer, while legacy names remain visible. Existing PropertyField has only a local five-name warning set; the canonical validator is proposed, not implemented. Label target via native id/for or containing label; placeholder never substitutes for label.
- BIC-C07 native eligibility matrix governs Required, Disabled, Read-only, Placeholder, lengths, pattern, multiple and bounds. Do not show flags with no native effect as functional controls; preserve stored unsupported attributes through native/custom inspection. Eligible booleans use presence/removal. Eligible Read-only/autocomplete/lengths/pattern live in Content → Advanced attributes; no silent empty-string removal. Attributes apply across breakpoints.
- Type conversion preserves engine/native IDs, association, data/CMS/interaction refs and compatible attrs/styles. Show affected unsupported attrs/content before Apply; retain them as legacy data if safe, or refuse conversion if lossless transformation cannot be supported. Never recreate node with only five attrs; no implicit multi-type conversion.
- Default emailstring or explicitempty; native formatvalidation on committed nonempty draft, no assumption that address is deliverable. Multiple flag supports comma-separated email list; switching it off with multiple authored addresses requires explicit editing/selection of a valid single default or Cancel; never silently drop addresses. Preserve supported native attrs.
- Placeholder optional; autocomplete values from native-supported token list/Custom existing. No password masking; existing invalid legacy default remains visible with repair, not deleted.

**Flow / cancellation / recovery:** Select actual field or Form → Fields row → same subtype controls → valid edit/inline validation → Back to form/associated label. Required/type/constraint change identifies scope across breakpoints; invalid input retained, Cancel restores current interaction, one Undo restores exact attr presence and dependent constraints. 

**Permission, keyboard, batch and focus:** BIC-C01–07 and IC/II apply: actual target, descendants, ancestor locks, component scope, command/server authorization; structure single owner only; scalar batch explicitly compatible subtypes and accurate mixed state. Exclude native ID/label association, structural/type conversion, CMS binding, form transport and radio group/default actions from batch; deduplicate shortcuts and directly selected controls by actual write target. Keyboard Add/Edit/Move up/down/Remove; Enter applies, invalid draft retained, Escape cancels current interaction per II-02. Return restores exact parent/row focus.

**Compatibility:** No schema change required for regrouping; preserve IDs/native tags/content, styles, safe attrs and references. Structural corrections use atomic commands, not a new parallel property store.

**Acceptance (not run against redesign):**

- T-B69-email-01: Single vs multiple email validation matchesmode.
- T-B69-email-02: Emptydefault distinct absent; labels notplaceholder.
- T-B69-email-03: No backendemail verification claim.

## B69-password

Source: `src/blocks/Forms/PasswordInput.tsx`. **Builder/current Inspector paths inspected in source. block-runtime-survey.json verifies insertion/tree/returned selection/default panel only. Redesigned controls, save/reopen and output NOT RUN.**

**Existing structure:** Observed generated native tree: <input>. Returned selection: input / input.

**Gap:** Internal ElementType alone does not identify native input subtype. Generic Default/Placeholder rows may be invalid or incomplete for this field.

**Disposition:** Move + Fix subtype dispatch

**Owner:** Actual native form control owns name/default/constraints; associated label owns visible text; form owns submission.

**Editing home:** Content → Field/subtype and validation; Style → native field appearance.

**Controls/validation:**

- Name is submission key, not visible label. Empty/absent preserved and not submitted as a named field; duplicate names may be intentional and must not be deduplicated. BIC-C07 blocks newly entered names removed by the canonical sanitizer, while legacy names remain visible. Existing PropertyField has only a local five-name warning set; the canonical validator is proposed, not implemented. Label target via native id/for or containing label; placeholder never substitutes for label.
- BIC-C07 native eligibility matrix governs Required, Disabled, Read-only, Placeholder, lengths, pattern, multiple and bounds. Do not show flags with no native effect as functional controls; preserve stored unsupported attributes through native/custom inspection. Eligible booleans use presence/removal. Eligible Read-only/autocomplete/lengths/pattern live in Content → Advanced attributes; no silent empty-string removal. Attributes apply across breakpoints.
- Type conversion preserves engine/native IDs, association, data/CMS/interaction refs and compatible attrs/styles. Show affected unsupported attrs/content before Apply; retain them as legacy data if safe, or refuse conversion if lossless transformation cannot be supported. Never recreate node with only five attrs; no implicit multi-type conversion.
- Default string is authored page content and visible in output data even if input masks it; explain before nonempty default commit. Existing defaults remain masked in Inspector until explicit Reveal; never include their literals in summaries or diagnostics. A password field and generic delivery service do not establish an authentication feature. Do not introduce automatic credential-storage semantics. No user secret required in audit.
- Min/max length optionalnonnegative integers, max≥min; autocomplete existing values; no multi-line or numeric min/max controls. Existing value preserved onopen and canbe explicitlycleared.

**Flow / cancellation / recovery:** Select actual field or Form → Fields row → same subtype controls → valid edit/inline validation → Back to form/associated label. Required/type/constraint change identifies scope across breakpoints; invalid input retained, Cancel restores current interaction, one Undo restores exact attr presence and dependent constraints. 

**Permission, keyboard, batch and focus:** BIC-C01–07 and IC/II apply: actual target, descendants, ancestor locks, component scope, command/server authorization; structure single owner only; scalar batch explicitly compatible subtypes and accurate mixed state. Exclude native ID/label association, structural/type conversion, CMS binding, form transport and radio group/default actions from batch; deduplicate shortcuts and directly selected controls by actual write target. Keyboard Add/Edit/Move up/down/Remove; Enter applies, invalid draft retained, Escape cancels current interaction per II-02. Return restores exact parent/row focus.

**Compatibility:** No schema change required for regrouping; preserve IDs/native tags/content, styles, safe attrs and references. Structural corrections use atomic commands, not a new parallel property store.

**Acceptance (not run against redesign):**

- T-B69-password-01: Maskingdoesnotclaimsecretstorage; existingvalue notchanged onopen.
- T-B69-password-02: Typeconversion totext warnsabout visibledefault, noimplicitconversion.
- T-B69-password-03: Clear/Undo exact withlabel/ID preserved.

## B69-number

Source: `src/blocks/Forms/NumberInput.tsx`. **Builder/current Inspector paths inspected in source. block-runtime-survey.json verifies insertion/tree/returned selection/default panel only. Redesigned controls, save/reopen and output NOT RUN.**

**Existing structure:** Observed generated native tree: <input>. Returned selection: input / input.

**Gap:** Internal ElementType alone does not identify native input subtype. Generic Default/Placeholder rows may be invalid or incomplete for this field.

**Disposition:** Move + Fix subtype dispatch

**Owner:** Actual native form control owns name/default/constraints; associated label owns visible text; form owns submission.

**Editing home:** Content → Field/subtype and validation; Style → native field appearance.

**Controls/validation:**

- Name is submission key, not visible label. Empty/absent preserved and not submitted as a named field; duplicate names may be intentional and must not be deduplicated. BIC-C07 blocks newly entered names removed by the canonical sanitizer, while legacy names remain visible. Existing PropertyField has only a local five-name warning set; the canonical validator is proposed, not implemented. Label target via native id/for or containing label; placeholder never substitutes for label.
- BIC-C07 native eligibility matrix governs Required, Disabled, Read-only, Placeholder, lengths, pattern, multiple and bounds. Do not show flags with no native effect as functional controls; preserve stored unsupported attributes through native/custom inspection. Eligible booleans use presence/removal. Eligible Read-only/autocomplete/lengths/pattern live in Content → Advanced attributes; no silent empty-string removal. Attributes apply across breakpoints.
- Type conversion preserves engine/native IDs, association, data/CMS/interaction refs and compatible attrs/styles. Show affected unsupported attrs/content before Apply; retain them as legacy data if safe, or refuse conversion if lossless transformation cannot be supported. Never recreate node with only five attrs; no implicit multi-type conversion.
- Default/min/max finite native numericstrings including valid decimals/exponent, unitsnotallowed. Step positivefinite or any, absent native1. Validate stepbase, bounds and default together; no rounding onload.
- Min≤Max whenboth; default may beempty; zero isnotempty. Reject constraintexcluding currentvaliddefault rather thanclamp; editcoupledconstraints in explicit apply if needed.

**Flow / cancellation / recovery:** Select actual field or Form → Fields row → same subtype controls → valid edit/inline validation → Back to form/associated label. Required/type/constraint change identifies scope across breakpoints; invalid input retained, Cancel restores current interaction, one Undo restores exact attr presence and dependent constraints. 

**Permission, keyboard, batch and focus:** BIC-C01–07 and IC/II apply: actual target, descendants, ancestor locks, component scope, command/server authorization; structure single owner only; scalar batch explicitly compatible subtypes and accurate mixed state. Exclude native ID/label association, structural/type conversion, CMS binding, form transport and radio group/default actions from batch; deduplicate shortcuts and directly selected controls by actual write target. Keyboard Add/Edit/Move up/down/Remove; Enter applies, invalid draft retained, Escape cancels current interaction per II-02. Return restores exact parent/row focus.

**Compatibility:** No schema change required for regrouping; preserve IDs/native tags/content, styles, safe attrs and references. Structural corrections use atomic commands, not a new parallel property store.

**Acceptance (not run against redesign):**

- T-B69-number-01: 0 distinct empty; decimals withstepany valid.
- T-B69-number-02: min10/max5 rejected withunchangedactualattrs.
- T-B69-number-03: Changingstep preserves authoredvalue until explicitcompatiblechoice.

## B69-range

Source: `src/blocks/Forms/RangeInput.tsx`. **Builder/current Inspector paths inspected in source. block-runtime-survey.json verifies insertion/tree/returned selection/default panel only. Redesigned controls, save/reopen and output NOT RUN.**

**Existing structure:** Observed generated native tree: <input>. Returned selection: input / input.

**Gap:** Internal ElementType alone does not identify native input subtype. Generic Default/Placeholder rows may be invalid or incomplete for this field.

**Disposition:** Move + Fix subtype dispatch

**Owner:** Actual native form control owns name/default/constraints; associated label owns visible text; form owns submission.

**Editing home:** Content → Field/subtype and validation; Style → native field appearance.

**Controls/validation:**

- Name is submission key, not visible label. Empty/absent preserved and not submitted as a named field; duplicate names may be intentional and must not be deduplicated. BIC-C07 blocks newly entered names removed by the canonical sanitizer, while legacy names remain visible. Existing PropertyField has only a local five-name warning set; the canonical validator is proposed, not implemented. Label target via native id/for or containing label; placeholder never substitutes for label.
- BIC-C07 native eligibility matrix governs Required, Disabled, Read-only, Placeholder, lengths, pattern, multiple and bounds. Do not show flags with no native effect as functional controls; preserve stored unsupported attributes through native/custom inspection. Eligible booleans use presence/removal. Eligible Read-only/autocomplete/lengths/pattern live in Content → Advanced attributes; no silent empty-string removal. Attributes apply across breakpoints.
- Type conversion preserves engine/native IDs, association, data/CMS/interaction refs and compatible attrs/styles. Show affected unsupported attrs/content before Apply; retain them as legacy data if safe, or refuse conversion if lossless transformation cannot be supported. Never recreate node with only five attrs; no implicit multi-type conversion.
- Preset min0/max100/default50, stepabsent native1. Finite bounds max≥min; Step positivefinite or any. Default must bewithinboundsandstep; changingbounds cannot silentlyclamp authoreddefault.
- When valueabsent show Browser default (range algorithm), not an authored50. Empty defaultaction removesattr; input browserpickedlivevalue isnot saved default. Native min/max noCSSunits.

**Flow / cancellation / recovery:** Select actual field or Form → Fields row → same subtype controls → valid edit/inline validation → Back to form/associated label. Required/type/constraint change identifies scope across breakpoints; invalid input retained, Cancel restores current interaction, one Undo restores exact attr presence and dependent constraints. 

**Permission, keyboard, batch and focus:** BIC-C01–07 and IC/II apply: actual target, descendants, ancestor locks, component scope, command/server authorization; structure single owner only; scalar batch explicitly compatible subtypes and accurate mixed state. Exclude native ID/label association, structural/type conversion, CMS binding, form transport and radio group/default actions from batch; deduplicate shortcuts and directly selected controls by actual write target. Keyboard Add/Edit/Move up/down/Remove; Enter applies, invalid draft retained, Escape cancels current interaction per II-02. Return restores exact parent/row focus.

**Compatibility:** No schema change required for regrouping; preserve IDs/native tags/content, styles, safe attrs and references. Structural corrections use atomic commands, not a new parallel property store.

**Acceptance (not run against redesign):**

- T-B69-range-01: Preset reads0/100/50; absentvalue shownnative default notsaved50.
- T-B69-range-02: Reduce maxbelow50 rejects until explicitcompatibledefault; Undoallattrs.
- T-B69-range-03: Visitor dragnever overwritesprojectdefault.

## B69-color

Source: `src/blocks/Forms/ColorInput.tsx`. **Builder/current Inspector paths inspected in source. block-runtime-survey.json verifies insertion/tree/returned selection/default panel only. Redesigned controls, save/reopen and output NOT RUN.**

**Existing structure:** Observed generated native tree: <input>. Returned selection: input / input.

**Gap:** Internal ElementType alone does not identify native input subtype. Generic Default/Placeholder rows may be invalid or incomplete for this field.

**Disposition:** Move + Fix subtype dispatch

**Owner:** Actual native form control owns name/default/constraints; associated label owns visible text; form owns submission.

**Editing home:** Content → Field/subtype and validation; Style → native field appearance.

**Controls/validation:**

- Name is submission key, not visible label. Empty/absent preserved and not submitted as a named field; duplicate names may be intentional and must not be deduplicated. BIC-C07 blocks newly entered names removed by the canonical sanitizer, while legacy names remain visible. Existing PropertyField has only a local five-name warning set; the canonical validator is proposed, not implemented. Label target via native id/for or containing label; placeholder never substitutes for label.
- BIC-C07 native eligibility matrix governs Required, Disabled, Read-only, Placeholder, lengths, pattern, multiple and bounds. Do not show flags with no native effect as functional controls; preserve stored unsupported attributes through native/custom inspection. Eligible booleans use presence/removal. Eligible Read-only/autocomplete/lengths/pattern live in Content → Advanced attributes; no silent empty-string removal. Attributes apply across breakpoints.
- Type conversion preserves engine/native IDs, association, data/CMS/interaction refs and compatible attrs/styles. Show affected unsupported attrs/content before Apply; retain them as legacy data if safe, or refuse conversion if lossless transformation cannot be supported. Never recreate node with only five attrs; no implicit multi-type conversion.
- Native default supports selected Buildrick authoring contract #RRGGBB (casepreserved/read). Explicit shorthand entry may normalize after visible preview; CSSvar/Brandtoken isnot a native inputvalue. Currentpreset #1A56DB.
- Current absence usesbrowserdefault; show distinct. Imported valid advancednative colour/alpha/colorspace attrs preserved asCustom withnativeattributes route; do not claimHTMLcannot representthose or auto-coerce. New expandedcolourauthoring deferred.
- CSS Fill/Border is fieldappearance and separate from submitted defaultcolour.

**Flow / cancellation / recovery:** Select actual field or Form → Fields row → same subtype controls → valid edit/inline validation → Back to form/associated label. Required/type/constraint change identifies scope across breakpoints; invalid input retained, Cancel restores current interaction, one Undo restores exact attr presence and dependent constraints. 

**Permission, keyboard, batch and focus:** BIC-C01–07 and IC/II apply: actual target, descendants, ancestor locks, component scope, command/server authorization; structure single owner only; scalar batch explicitly compatible subtypes and accurate mixed state. Exclude native ID/label association, structural/type conversion, CMS binding, form transport and radio group/default actions from batch; deduplicate shortcuts and directly selected controls by actual write target. Keyboard Add/Edit/Move up/down/Remove; Enter applies, invalid draft retained, Escape cancels current interaction per II-02. Return restores exact parent/row focus.

**Compatibility:** No schema change required for regrouping; preserve IDs/native tags/content, styles, safe attrs and references. Structural corrections use atomic commands, not a new parallel property store.

**Acceptance (not run against redesign):**

- T-B69-color-01: ChangeCSSfill leavesnativevalue unchanged.
- T-B69-color-02: var(--brand) rejected fornativevalue; customadvancedstoredattrs preserved.
- T-B69-color-03: Reset defaultremovesvalue only; Undo restorespresence.

## B69-label

Source: `src/blocks/Forms/Label.tsx`. **Builder/current Inspector paths inspected in source. block-runtime-survey.json verifies insertion/tree/returned selection/default panel only. Redesigned controls, save/reopen and output NOT RUN.**

**Existing structure:** Observed generated native tree: <label>. Returned selection: label / label.

**Gap:** Label text is neither placeholder nor submission key; associations must survive ID edits.

**Disposition:** Move + Fix

**Owner:** Native label owns text and for reference; control owns DOMid/name/value.

**Editing home:** Content → Label text/Associated control; exact Select control return.

**Controls/validation:**

- Associatedcontrol references unique native ID in same applicable document scope; wrappinglabel may use implicit target and showsit. Offer existing eligible labelable controls by name/type/path plus DOM ID, excluding hidden inputs. On explicit association only, reuse its unique DOM ID or generate one if absent in the same transaction as for; engine ID is separate. Undo restores former absence only if no later reference depends on it. Ambiguous/missing target retained with repair; no association batch.
- Changingcontrol DOMid through canonicalrename updates allaffected label/ARIA refs atomically withpermissions; engineID separate. Label text usesactualcontent/nestedmarkup; keepselectablecontroloutsideeditrange.

**Flow / cancellation / recovery:** Select label → edittext orChoose associatedcontrol → verifytarget → Apply → Selectcontrol → Backtolabel. Missingtarget retainsfor until explicitchange; no name-basedrelink.

**Permission, keyboard, batch and focus:** BIC-C01–07 and IC/II apply: actual target, descendants, ancestor locks, component scope, command/server authorization; structure single owner only; scalar batch explicitly compatible subtypes and accurate mixed state. Exclude native ID/label association, structural/type conversion, CMS binding, form transport and radio group/default actions from batch; deduplicate shortcuts and directly selected controls by actual write target. Keyboard Add/Edit/Move up/down/Remove; Enter applies, invalid draft retained, Escape cancels current interaction per II-02. Return restores exact parent/row focus.

**Compatibility:** No schema change required for regrouping; preserve IDs/native tags/content, styles, safe attrs and references. Structural corrections use atomic commands, not a new parallel property store.

**Acceptance (not run against redesign):**

- T-B69-label-01: Label+input rename preservesfor/id andengineID.
- T-B69-label-02: Missing/duplicateDOMid showsrepair, no arbitrarytarget.
- T-B69-label-03: Textedit leavescontrolname/placeholder/value unchanged.

## B69-submit

Source: `src/blocks/Forms/SubmitButton.tsx`. **Builder/current Inspector paths inspected in source. block-runtime-survey.json verifies insertion/tree/returned selection/default panel only. Redesigned controls, save/reopen and output NOT RUN.**

**Existing structure:** Observed generated native tree: <button>. Returned selection: button / button.

**Gap:** Submit preset isbutton type=submit; clickingeditor must notexecute submission; no generic linkreplacement.

**Disposition:** Keep + Fix

**Owner:** Native submit button and containing/explicit form owner; service action remainsform-owned.

**Editing home:** Content → Label/type/form association; Behaviour → supported native submit overrides inAdvanced.

**Controls/validation:**

- Label text and type=submit preserved. Explicit form attrresolvesformID, otherwiseancestor; outsideform saysNoassociatedform. formaction/formmethod/formenctype/formtarget/formnovalidate preservedwherealready authored, native-safeattributesroute; no simulatedserviceoverride.
- Do not show URLlink as primary submitaction; intentionaltypechange isformconsequence operation. Native disabled separatefromeditorreadonly.

**Flow / cancellation / recovery:** Select Submit → label/formassociation → exactformSubmission fordelivery → Back. Preview only explicitservice/nativeconfigured path; noauditdelivery. Removebutton leavesformandrecords intact; Undo restoresbutton.

**Permission, keyboard, batch and focus:** BIC-C01–07 and IC/II apply: actual target, descendants, ancestor locks, component scope, command/server authorization; structure single owner only; scalar batch explicitly compatible subtypes and accurate mixed state. Exclude native ID/label association, structural/type conversion, CMS binding, form transport and radio group/default actions from batch; deduplicate shortcuts and directly selected controls by actual write target. Keyboard Add/Edit/Move up/down/Remove; Enter applies, invalid draft retained, Escape cancels current interaction per II-02. Return restores exact parent/row focus.

**Compatibility:** No schema change required for regrouping; preserve IDs/native tags/content, styles, safe attrs and references. Structural corrections use atomic commands, not a new parallel property store.

**Acceptance (not run against redesign):**

- T-B69-submit-01: Submit ineditor never sendsrequest.
- T-B69-submit-02: Outsideform stateclear; associationpreservedonreorder.
- T-B69-submit-03: Nativeoverrides andtypepersist; no accidentalhrefconversion.

