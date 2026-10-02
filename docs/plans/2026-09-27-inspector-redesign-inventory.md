# Inspector redesign — control inventory and proposed placement matrix

Companion to `2026-09-27-inspector-redesign.md`. Inventory measured from code on main @ 8e9a3ccb2
(paths relative to `packages/editor/src/editor/inspector/`). The placement column is a **proposal**; each move marked
with a decision id stays pending until that decision is taken in the review.

## Key facts that drive the design

- **"All like this" is half-wired.** Only `handleStyleChange` fans out to peers (`hooks/useStyleHandlers.ts:255-266`).
  Batch writes (Padding pair, Margin pair, per-side box, Flex linked gap) and every non-style write (Link, attributes,
  classes, content, interactions) reach the selected element only. Peers come from `getAllElements()` (all pages).
- **"Whole site" writes nothing**; it swaps the panel for a signpost to Brand (`ProInspector.tsx:526-577`).
- **Beginner/Pro exists only on Style**; Settings and Effects are always Pro (`ProInspector.tsx:611`), so the ADVANCED
  tag on CSS classes hides nothing. Beginner hides Flexbox/Grid direction and alignment.
- **Default open rule differs per tab**: Style opens sections that hold a value; Settings/Effects open everything except
  Advanced, Blur, More effects, CSS classes (`hooks/useInspectorSections.ts:116-127`).
- **No profile sets a default tab**; the last tab sticks across selections (`ProInspector.tsx:192`).
- **No breakpoint control inside the Inspector**; per-control override dots exist only on Size and Z-index.

## Chrome

| Today | Where | Proposal | Decision |
|---|---|---|---|
| Icon + name (rename) | header | keep | — |
| ✦ AI chip | header | keep as the only Inspector AI door | D7 |
| Bound chip | header | keep (mark only) | — |
| ⋯: Improve with AI | header menu | remove (duplicate of ✦) | D7 |
| ⋯: Pick on canvas, Select parent | header menu | move to a parent breadcrumb in the header ("Section › Heading") | D8 |
| ⋯: Hide inspector, Expand all, Collapse all | header menu | remove from element menu (panel chrome, not element actions); Expand/Collapse via ⌥-click on any section header | D8 |
| ⋯: Duplicate, Copy/Paste/Reset styles, Save as component, Delete | header menu | keep, fed from the one shared element-action registry (same list as canvas right-click) | D8 |
| Tabs Style · Settings · Effects | tab row | keep three (DD-1); rename Settings | D4 |
| "Applies to" + scope dropdown | context row | remove the row; "All like this" → one-shot ⋯ action scoped to the page; "Whole site" removed | D6a, D6b |
| State pill "▸" | context row | "State: Base ▾" chip, Style + Effects tabs only | D14 |
| Breakpoint | none | "Editing: Tablet" chip beside the state chip when not Desktop | D14 |
| Beginner / Pro | footer | remove | D5 |
| Empty state "Nothing selected" | body | Page panel | D13 |
| Multi-select separate panel | body | same panel, "Mixed" values, Align/Distribute row on top | D12 |

## Style tab (how it looks)

| Section today | Controls | Proposal | Decision |
|---|---|---|---|
| TextContentRow "Edit text on canvas" | button | remove (canvas double-click is the editor) | D9 |
| MediaSourceRow (image/video/svg) | source + picker | moves into the type block at the top of Style | DD-3 |
| Layout | Display, Size (Fill/Hug/Fixed), MS: position, offsets, z-index, overflow, box sizing, visible, float, clear | Display + Position stay; Size selects merge into Size | D9 |
| Size | W/H Fixed/Fill/Hug, min/max, object-fit | one Size section = the only width/height editor; object-fit moves to the Image type block | D9, D3 |
| Spacing | padding pair, gap, MS margin pair, link toggles, per-side box, row/col gap | one editor: per-side box diagram (open) with linked toggle; gap removed here (lives in Flex/Grid) | D9 |
| Flexbox (ADV) | direction, 3×3 align, justify, align, wrap, gap, align-content; item: grow/shrink/basis/self/order | always visible for flex containers (no tier); the only gap editor for flex | D5, D9 |
| Grid (ADV) | templates, cols/rows, flow, gap, item align, J/A content; item placement | always visible for grid; the only gap editor for grid | D5, D9 |
| Typography | family, size+line, weight, align, colour, transform, decoration, letter/word, MS style/white-space/… | keep; on containers collapsed as "Text inside" | D10 |
| Background | colour / gradient / image | rename "Fill" (matches mockup A); background image moves here only | — |
| Border | radius, width/style/colour, MS corners, per-side, outline | keep; radius is the only radius editor | — |

## Settings tab (what it is and how it behaves) — name pending D4

| Section today | Proposal | Decision |
|---|---|---|
| Advanced (element-properties), closed | **Decided DD-3: moves to the top of the Style tab.** Type block, first and open, titled by type ("Heading", "Image", "Input"…): heading level; image alt/loading/source/object-fit; video poster/autoplay/loop/muted/controls/inline; input type/name/placeholder/default/required/disabled/read-only/autocomplete; button type/disabled; icon glyph/size/stroke; iframe URL | D3 |
| Advanced: text / label / content textareas | remove (canvas is the text editor) | D9 |
| Advanced: Open In (link, button), Rel | remove; Link section is the only destination editor | D9 |
| Advanced: ID & class | ID stays in a closed "Attributes" section (ID, title, tab index, data-*); classes only in CSS classes | D9 |
| Link | only on link, button, cta, card, container, section (not text, not page body) | D10 |
| Content (Static / From CMS) | only on bindable types (text, heading, paragraph, image, button, link) — same list as the canvas "Bind to CMS field" action | D10 |
| Collection / Fields / After submit / Slides / Playback | keep, first on their types | — |
| Visibility (per device) | keep; not on page body | D10 |
| CSS classes | keep (only class editor); closed | — |
| Layout › Visible (CSS `visibility`) | move to Attributes-level advanced; per-device Visibility is the user-facing one | D9 |

## Effects tab (depth, motion, interaction)

| Section today | Proposal | Decision |
|---|---|---|
| Opacity | keep | — |
| Shadow select + More effects custom shadow + inner shadow | one Shadow section: preset, custom, inner | D9 |
| Blur + More effects filters | one Filters section (blur, brightness, contrast, grayscale) | D9 |
| More effects: transform, transition, cursor, blend, text-shadow, will-change | "Transform & motion" (transform, transition), "Advanced" (cursor, blend, text-shadow, will-change) closed | D9 |
| Interactions | keep; not on page body | D10 |

## Open rule and default tab

| Today | Proposal | Decision |
|---|---|---|
| Style opens valued sections; Settings/Effects open nearly all | every tab: type block open; other sections open only when they hold a non-default value; empty ones are a single "+" header row | D11 |
| Last tab sticks | keep sticky tab, but a type's defining section is reachable in one click from the header type label | D11 |
