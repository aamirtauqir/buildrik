# Inspector redesign — "every capability kept, simple like Figma"

Status: **design review done** (`/plan-design-review`, 2026-09-27): 22 owner decisions (DD-1 … DD-22), 1 deferred (Figma boards).
Inventory and placement matrix: `2026-09-27-inspector-redesign-inventory.md`.
> **2026-09-27 strict audit:** `2026-09-27-inspector-architecture-proposal.md` cross-checked every decision against the full codebase and live app. **DD-8, DD-9, DD-14, DD-17, DD-18 are under revision** and DD-1 is reopened as product decision Q1; prerequisite defects P-1…P-13 come first. That proposal was **approved on 2026-09-27**; where it and this doc differ, the proposal's "Owner approvals" win.


Source: `docs/audits/2026-09-27-module-audit/01-inspector.md` (§2 inventory, §5 target shape) and the Fix plan card
"Inspector in two tabs" on the audit page. Closes INS-03, 04, 05, 06, 07, 08, 10, 11 (and touches INS-09, 12–20).

## Goal

A designer billing clients on Webflow/Framer (DESIGN.md §Product Context: power users, not beginners) selects an
element and finds the properties that define it in the first screen, edits each property in exactly one place, and
never meets a control that doesn't apply to what they selected. **No capability is removed** — every control that
exists today keeps a home.

## Current state (measured 2026-09-27, main @ 8e9a3ccb2, 1440×900)

| Selection | Controls today (all tabs) | Buried / irrelevant |
|---|---:|---|
| Heading | 68 | Level in closed "Advanced" on tab 2; Gap on text; text editable in 3 places |
| Button | ~89 | "Open In" ×2; class ×2 |
| Image | ~82 | Alt text in closed "Advanced" |
| Input | 116 | Type / Name / Required in closed "Advanced"; "Required ☐ Disabled" labels |
| Flex / Grid | 67 (78 with Show all) | Direction + align hidden by Beginner tier |
| Page body | ~48 | Link, Visibility, CMS offered on the page itself |
| Multi-select | separate panel | Placeholder values look real; no "Mixed" |

Tabs today: Style · Settings · Effects. Tier: Beginner / Pro. Scope: This element / All like this / Whole site.
AI doors in the Inspector: ✦ chip + ⋯ "Improve with AI".

## Target shape (from the audit — each item still needs its own review decision)

1. Header: icon, layer name, one ⋯ with element actions only. Instance / CMS-bound as a header mark.
2. Two tabs, e.g. Design (Style + Effects) and Behaviour (link, CMS, interactions, visibility, form/slider/collection).
3. A type block, open and first on Design, holding what defines the element.
4. One editor per property (text, class, shadow, spacing, gap, Open In each once).
5. Context chips (breakpoint, `:hover`) only when non-default, Design tab only.
6. Nothing selected → Page panel. Page body labelled "Page", no Link / Visibility / CMS.
7. Multi-select → same panel, "Mixed" values, Align/Distribute row on top.
8. No Beginner/Pro; per-section "More" handles progressive disclosure.

Budget (audit estimate): Heading ≤ 25 controls, Input ≤ 30.

## Design decisions

| # | Decision | By / when | Notes |
|---|---|---|---|
| DD-1 | **Keep three tabs**, same categories as today (Style · Settings · Effects). The two-tab Design/Behaviour idea from the audit is dropped. | Owner, board feedback 2026-09-27 | Visual direction = mockup A (clean sections, empty section = one header row with "+"). Tab *names* and *contents* still go through review. |
| DD-2 | **Scope is the whole Inspector**, every element type + Page (nothing selected) + multi-select, judged against the owner's 14 lenses: low module cohesion, feature-module misfit, contextual irrelevance, feature misplacement, module boundary violations, scope leakage, responsibility ambiguity, feature bloat, contextual noise, duplicate entry points, redundant actions, cross-surface duplication, navigation redundancy, choice overload. | Owner, board feedback 2026-09-27 | Method: a placement matrix gives every control exactly one home (tab + section) or removes it; each non-obvious move is a separate review decision. |
| DD-3 | **Type block at the top of the Style tab**, open, titled by element type ("Heading", "Image", "Input"…). Holds the element's defining properties: heading level + text style; image source/alt/object-fit/loading; video source/poster/autoplay/loop/muted/controls/inline; input type/name/placeholder/default/required/disabled/read-only/autocomplete; button type/disabled; icon glyph/size/stroke; iframe URL. The closed "Advanced" section stops holding them. | Owner, D3 (chose B over the recommended Settings placement) | First thing seen on selection, no tab switch. Style tab now means "what it is and how it looks"; keep the block compact (≤ 1 screen row per field) so it doesn't crowd typography. |
| DD-4 | **Tabs: Style · Behaviour · Effects.** "Settings" is renamed "Behaviour" (link, CMS binding, per-device visibility, form fields / after submit, slides / playback, collection source, CSS classes, attributes). | Owner, D4 (recommended) | Removes the clash with site Settings (INS-04, FB-1). Internal tab id `element` may stay. |
| DD-5 | **Remove the Beginner / Pro toggle.** One Inspector for everyone; Flexbox and Grid controls always visible for flex/grid containers; progressive disclosure = each section's own "More" plus empty sections collapsed to a single "+" header row. | Owner, D5 (recommended) | Closes INS-10. Drops `useInspectorTier` + localStorage key `buildrick-inspector-tier` and the ADVANCED tier tag. |
| DD-7 | **One AI door in the Inspector: the header "✦ AI" chip.** "Improve with AI" leaves the ⋯ menu. Multi-select keeps the same chip in the same place. | Owner, D7 (recommended) | Closes INS-14 AI half; canvas right-click AI is a Shell decision, untouched here. |
| DD-8 | **Inspector ⋯ = element actions only, same list and order as canvas right-click, from one shared registry:** Duplicate · Copy style · Paste style · Apply style to all N on this page (DD-6b) · Reset style · Save as component · Lock/Unlock · Delete. Removed from ⋯: Improve with AI (DD-7), Hide inspector (stays on its shortcut and ⌘K), Expand/Collapse all (becomes ⌥-click on any section header), Pick on canvas and Select parent (see D8b). | Owner, D8 (recommended) | Closes INS-14; the shared registry is also the fix for SHL-02 on the Inspector side. |
| DD-9 | **One editor per property.** Text → canvas inline only (remove the "Edit text on canvas" row and the Advanced text/label/content textareas). Classes → CSS classes section only; ID moves to a closed "Attributes" section (ID, title, tab index, data-*). Open-in / rel → Link section only. Width/height → Size section only (Layout's size selects removed). Gap → Flexbox section for flex, Grid section for grid (Spacing's gap/row/column gap removed; columns "Gap between columns" maps to Grid gap). Shadow → one Shadow section (preset + custom + inner). Blur + brightness/contrast/grayscale → one Filters section. Hiding → Behaviour › Visibility (per device); Display "None" and CSS `visibility` live under Attributes/advanced. Radius → Border only. Copy/Paste style → ⋯ only. | Owner, D9 (recommended) | Closes INS-05. No capability removed, only duplicate routes. |
| DD-10 | **Sections only where they work.** CMS binding (Content) only on text, heading, paragraph, image, button, link (the canvas "Bind to CMS field" list); collection list keeps its own Collection section. Link only on link, button, cta, card, container, section. Page body (root): no Link, Visibility, CMS or Interactions. Containers show Typography as a closed "Text inside" section with a one-line summary. | Owner, D10 (recommended) | Closes INS-06 and INS-16 (page body half). |
| DD-11 | **One open/closed rule on all three tabs.** Type block always open. A section holding a non-default value opens. An empty section is one header row "Fill  +" (click = open and add). A section with a value that the user closed shows a one-line summary on its header ("Fill × Hug", "0 · 16 · 0 · 0", "Shadow: Soft"). Open/closed choices keep being remembered per element type. | Owner, D11 (recommended) | Closes INS-20; replaces the per-tab seeding in useInspectorSections.ts:116-127. |
| DD-12 | **Multi-select uses the same Inspector** (same tabs and sections), showing only sections that apply to every selected element. Differing values read "Mixed" (muted); equal values show the real value; no placeholder that looks like a value. Top row: "N selected" + Align ×6 + Distribute ×2 (3+) + Group. An edit applies to all, one transaction, one Undo. The separate BatchStylePanel is retired. | Owner, D12 (recommended) | Closes INS-11. Type block shows only when all selected share a type. |
| DD-13 | **Nothing selected (and page body selected) shows a Page panel.** Header "Home · Page". Style tab only: Background (fill), content max width, default text (font, size, colour with brand token chips), page padding. Footer link "SEO & social…" opens the existing Page settings (one home, not a copy). No Behaviour / Effects tabs here. | Owner, D13 (recommended) | Closes INS-16. The "Template applied!" empty state becomes a one-time banner on top of the Page panel. |
| DD-14 | **Context row under the tabs, Style and Effects only**: chip "State: Base ▾" (labelled; accent when not Base), and a breakpoint chip ("Tablet") only when not Desktop, with "N overrides · Revert". Every field overridden at the current breakpoint/state shows a small dot by its label (today only Size and Z-index do). No context row, no state banner on Behaviour. | Owner, D14 (recommended) | Closes INS-07, INS-09, INS-15. |
| DD-15 | **Section order: define → shape → paint.** Style — Heading/Text: [Type] → Typography → Size → Spacing → Fill → Border. Button/Link: [Type] → Typography → Size → Spacing → Fill → Border. Image/Video/SVG: [Type] → Size → Spacing → Border → Fill. Input/Textarea/Select: [Type] → Typography → Size → Spacing → Border → Fill. Container/Section/Card: Layout → Flexbox/Grid (when flex/grid) → Size → Spacing → Fill → Border → Text inside (closed). Flex/Grid element: [Type: direction/align/gap or columns/gap] → Size → Spacing → Fill → Border. Form/Slider/Collection list: as container. Behaviour — [type-specific: Fields + After submit / Slides + Playback / Collection] → Link → CMS binding → Visibility → CSS classes → Attributes (closed). Effects — Opacity → Shadow → Filters → Transform & motion → Interactions → Advanced (closed). | Owner, D15 (recommended) | Replaces the per-profile orders in config/elementProfiles.ts. |
| DD-16 | **Component instance**: header mark "◆ Component: {name}" beside the element name. Style tab only, above the type block: one compact row — Variant ▾ (if variants) · "Edit master" · ⋯ (Reset to master, Detach instance, each with its existing confirm). Behaviour/Effects show only the header mark. Every field overridden from the master gets a dot; hovering it offers "Reset to master". | Owner, D16 (recommended) | Replaces the per-tab VariantSection band. |
| DD-17 | **CMS-bound element**: header chip "⌁ {Collection.field}" (click opens Behaviour › CMS binding). The binding banner is removed. One home for the binding: Behaviour › CMS binding (collection, field, live preview, Unbind, "Open record"). Double-clicking bound text on the canvas shows a tooltip: "This text comes from {Collection.field} — edit the record or unbind." | Owner, D17 (recommended) | Removes BindingBanner; follows DD-9 (text edits on canvas only). |
| DD-18 | **Read-only states.** Locked element: 🔒 mark in the header + one line above the Style content "Locked — unlock to edit · Unlock"; every control read-only (values fully legible, not dimmed, no edit on click). View-only role: every control read-only, one line under the header "View only — ask an admin for edit access", ⋯ offers only "Copy style", ✦ AI hidden. | Owner, D18 (recommended) | Replaces LockedBanner-over-editable-controls. |
| DD-19 | **Invalid input in a field**: nothing blocks typing. On Enter/blur a valid value (24, 24px, 2rem, auto, 50%, a token) applies; a bare number takes the field's default unit. An invalid value turns the field border red with one line under it: "Use a number or a unit like 24px, 2rem, auto." The old value stays on the canvas; Esc restores it. ↑/↓ = ±1, Shift = ±10 on every numeric field. No toast. | Owner, D19 (recommended) | Same rule for colour fields ("Use a hex like #1A56DB or pick a token"). |
| DD-20 | **Tab on selection change**: when the selected element's type changes (heading → image), the Inspector opens on Style so the type block is visible; when another element of the same type is selected (heading → heading), the current tab stays. | Owner, D20 (recommended) | Replaces the always-sticky tab (ProInspector.tsx:192). |
| DD-21 | **Components and tokens.** Segmented (H1–H6 etc.) → existing `inspector/shared/controls/ButtonControls`. "Mixed" → existing `MixedValueIndicator`. Box diagram → existing `SpacingControls` (pairs removed). State / breakpoint / component / CMS chips → chrome-ui `Chip`. Section header summary and "+" empty row → new modes in existing `shared/controls/Section.tsx`. Parent breadcrumb → **new chrome-ui `Breadcrumb`** exported from `chrome-ui/index.ts` with contract tests. Tokens `--bk-*` only: panel #FFFFFF, border #E5E7EB, accent #1A56DB only for focus / active tab / non-Base state chip / override dot, Inter 12–13 labels, Geist Mono tabular values, 4px grid, weight ≤ 600, panel radius ≤ 4px. | Owner, D21 (recommended) | Per packages/editor/CLAUDE.md SSOT decision tree. |
| DD-22 | **Accessibility (desktop-only editor).** Tabs = ARIA tablist with ←/→. Section headers = buttons with aria-expanded; ⌥-click / ⌥+Enter toggles all. Breadcrumb = nav landmark "Element path", crumbs are buttons. Every field has a visible label and an aria-label with its unit ("Font size, pixels"); checkbox labels sit next to the box and never read as its value (fixes INS-12). "Mixed" announces "Mixed values". Apply-to-all toast and field errors use aria-live="polite". Focus ring `--bk-shadow-focus`; tab order top to bottom. AA contrast: muted colour only for labels, never for values (except "Mixed"). Width fixed 300px: long names/values ellipsise with a tooltip, never wrap to two lines. | Owner, D22 (recommended) | |
| DD-9b | **Spacing = one compact box diagram**: margin outside, padding inside, a value on each side, a 🔗 link toggle in the centre (on = all four sides equal, one value typed). Spacing-token chips stay on every value. The padding/margin pairs and the "More settings" per-side box are removed. | Owner, D9b (recommended) | ~80px tall at 300px width (mockup A). |
| DD-8b | **Parent breadcrumb in the Inspector header**, above the element name: "Home › Hero section › Heading"; each crumb selects that ancestor. "Pick on canvas" is removed (a canvas click is the pick; Layers remains). | Owner, D8b (recommended) | Long chains truncate from the left with "…" at 300px; the current element is never truncated. |
| DD-6b | **"All like this" mode is removed; replaced by a one-shot ⋯ action** "Apply this style to all {H2 headings / buttons / images} on this page (N)". Scope: current page only; match = same type (headings also same level). Copies: every style-map property on Style + Effects at the current breakpoint + state. Never copies: text, heading level, link, CMS binding, form/slider settings, classes, ID/attributes, interactions. Confirm dialog lists copies / keeps / skipped (locked, inside a component instance) with counts; one transaction, one Undo; toast "Applied to N {type}s · Undo". Dialog hint: "To keep them in sync, save this as a text style." With the "Applies to" row gone (DD-6a/6b), the context row holds only state + breakpoint chips. | Owner, D6b (recommended, after detailed walkthrough) | Closes INS-02 and the batch fan-out gap (padding/margin/link/classes never reached peers). |
| DD-6a | **Remove the "Whole site" scope option** and its takeover banner. The route to site-wide values is the bound-token chip, which opens Brand on that token. | Owner, D6a (recommended) | Closes INS-08 (scope leakage). |

## Interaction states (from decisions DD-3 … DD-19)

| Surface | Loading | Empty | Error | Success | Partial / special |
|---|---|---|---|---|---|
| Whole Inspector | Existing skeleton: 48px header + 6 rows (unchanged) | Page panel (DD-13); one-time "Template applied" banner on top of it | — | — | AI run: existing takeover "Working…" with selection restored after (unchanged) |
| Section | — | One header row "Fill  +" (DD-11) | — | Value applies live on canvas | Closed with value → one-line summary on the header (DD-11) |
| Field | — | Muted placeholder only where no value exists, never value-shaped ("—", not "000000") | Red border + one hint line, old value kept, Esc restores (DD-19) | Applies on Enter/blur | Override dot for breakpoint/state/master (DD-14, DD-16) |
| Multi-select | — | — | — | Edit applies to all, one Undo (DD-12) | "Mixed" in muted text where values differ |
| Locked element | — | — | — | — | Read-only values + "Locked — unlock to edit · Unlock" (DD-18) |
| View-only role | — | — | — | — | Read-only + "View only — ask an admin for edit access"; ⋯ = Copy style; no ✦ AI (DD-18) |
| Component instance | — | — | — | — | Header mark + Style-tab row: Variant ▾ · Edit master · ⋯ (DD-16) |
| CMS-bound | — | — | — | — | Header chip "⌁ Collection.field"; canvas tooltip on double-click (DD-17) |
| Apply style to all (⋯) | — | Row disabled with reason when N = 0 ("No other H2 headings on this page") | — | Toast "Applied to N headings · Undo" (DD-6b) | Skipped count in the confirm (locked, inside components) |

## User journey storyboard (from decisions)

| # | User does | User feels | Plan specifies |
|---|---|---|---|
| 1 | Clicks a heading on the canvas | Oriented: "that's the thing I picked" | Breadcrumb "Home › Hero › Heading" + name; opens on Style if the type changed (DD-8b, DD-20) |
| 2 | Wants it to be H1 instead of H2 | No hunting | Type block is the first thing on Style: H1–H6 segmented (DD-3) |
| 3 | Tweaks size and colour | In flow, one place per property | Typography open (has values), token chips on colour/size; one editor each (DD-9, DD-11) |
| 4 | Adds padding | Understands margin vs padding at a glance | Box diagram with 🔗 (DD-9b) |
| 5 | Switches the canvas to Tablet and edits | Safe: knows it only changes Tablet | "Tablet · 1 override · Revert" chip + dot on the field (DD-14) |
| 6 | Makes the other H2s on the page match | Confident, reversible | ⋯ "Apply this style to all H2 headings on this page (12)" → confirm → toast with Undo (DD-6b) |
| 7 | Selects an image next | Finds alt text immediately | Tab resets to Style; type block: source, alt, fit (DD-3, DD-20) |
| 8 | Shift-selects three cards | Sees what is shared and what differs | Same panel, "Mixed" values, Align/Distribute row (DD-12) |
| 9 | Clicks empty canvas | Gets something useful, not a dead end | Page panel: background, max width, default text, "SEO & social…" (DD-13) |

Time horizons: first 5 seconds — the element's identity and defining control are visible without scrolling; 5 minutes — every property has one home, so habits form fast; long term — the same define → shape → paint order on every type (DD-15) means a new element type is never a new layout to learn.

## Prerequisite

- **Reproduce INS-01 on a clean site before building** (Inspector values not matching the canvas). If real, fix load-time style painting first; otherwise the redesigned Inspector inherits the same distrust.

## NOT in scope

- **Figma v3 boards** for the new Inspector — deferred by the owner (D23, 2026-09-27). Consequence: board-vs-live conformance for the Inspector family will read as drift until boards exist.
- Canvas right-click menu, selection toolbar and AI doors outside the Inspector — Shell audit (SHL-02, SHL-03); DD-8 only requires both menus to read from one registry.
- Brand text styles and token binding of canvas defaults (BRD-05 / R1) — the type block's "Text style" picker uses whatever Brand provides.
- CMS binding behaviour inside collection lists (CMS-05) — the CMS binding section keeps today's capability.
- Mobile / narrow layouts — the editor is desktop-only (DESIGN.md).

## What already exists (reuse)

- Section registry and profiles: `inspector/sections/registry/*`, `inspector/config/elementProfiles.ts`, `shouldRender`.
- Controls: `inspector/shared/controls/ButtonControls`, `SpacingControls`, `MixedValueIndicator`, `ColorInput`, `Section.tsx`, `MoreSettingsToggle`.
- chrome-ui: `Tabs`, `Chip`, `Popover`/`Menu`, `TextInput`, `Select`, `Tooltip`.
- Behaviour: `useStyleHandlers` (breakpoint/state writes), `BreakpointOverrides`, `DSBindingChip`, existing confirm dialogs for Detach/Reset.

## Approved mockups

| Screen | Mockup | Direction | Notes |
|---|---|---|---|
| Heading selected, Style tab | `~/.gstack/projects/aamirtauqir-buildrik/designs/inspector-redesign-20260927/variant-A.png` | Direction only: clean sections, type block on top, empty sections as one "+" row | Superseded details: shows two tabs "Design · Behaviour" (now three: Style · Behaviour · Effects, DD-1/DD-4) and an unexplained "Aa" button. Regenerate before any build. |

## Implementation Tasks

Synthesized from the decisions above. P1 = needed for the redesign to hold together; P2 = same branch; P3 = follow-up.

- [ ] **T0 (P1, human ~2h / CC ~20min)** — Reproduce INS-01 on a fresh site; fix style painting if real. Verify: stored vs computed style agree after reload.
- [ ] **T1 (P1, human ~1d / CC ~1h)** — Tabs Style · Behaviour · Effects; section order define → shape → paint (DD-1, DD-4, DD-15). Files: `sections/registry/_shared.tsx`, `config/elementProfiles.ts`. Verify: order per type matches DD-15 in a live walk.
- [ ] **T2 (P1, human ~1.5d / CC ~2h)** — Type block at the top of Style from `elementProperties/config.ts` fields (DD-3); MediaSourceRow folds in; object-fit moves in. Verify: heading level, image alt, input required visible on first render.
- [ ] **T3 (P1, human ~1d / CC ~1h)** — One editor per property (DD-9, DD-9b): remove TextContentRow + Advanced textareas, Advanced Open In, Layout size selects, Spacing gap/pairs, ID&class classes field; merge Shadow and Filters; Attributes section. Verify: grep shows one writer per CSS property in the Inspector.
- [ ] **T4 (P1, human ~0.5d / CC ~30min)** — Remove Beginner/Pro (DD-5) and the "Applies to" row incl. Whole site (DD-6a).
- [ ] **T5 (P1, human ~1d / CC ~1h)** — ⋯ "Apply this style to all N on this page" one-shot with confirm, skipped counts, one transaction, toast + Undo (DD-6b). Verify: 12 H2s change, other pages untouched, one Undo reverts all.
- [ ] **T6 (P1, human ~1d / CC ~1h)** — ⋯ menu from the shared element-action registry (DD-7, DD-8); header parent breadcrumb via new chrome-ui `Breadcrumb` (DD-8b, DD-21).
- [ ] **T7 (P1, human ~1d / CC ~1h)** — Relevance rules (DD-10) and one open/closed rule with summaries and "+" rows (DD-11); tab reset on type change (DD-20).
- [ ] **T8 (P2, human ~1.5d / CC ~2h)** — Multi-select in the same panel with Mixed + align row (DD-12); retire BatchStylePanel.
- [ ] **T9 (P2, human ~1d / CC ~1h)** — Page panel (DD-13).
- [ ] **T10 (P2, human ~1d / CC ~1h)** — Context row: state chip, breakpoint chip, override dots everywhere (DD-14); component row + header mark (DD-16); CMS header chip, banner removed, canvas tooltip (DD-17); read-only states (DD-18).
- [ ] **T11 (P2, human ~0.5d / CC ~30min)** — Field validation behaviour (DD-19).
- [ ] **T12 (P2, human ~0.5d / CC ~30min)** — Accessibility spec (DD-22).
- [ ] **T13 (P1, human ~0.5d / CC ~30min)** — Measure: Heading ≤ 25 controls, Input ≤ 30, in the live app at 1440×900; rewrite tests that pin the old layout in the same commits.

## Unresolved decisions

- **D23 — Figma boards before or after code:** deferred by the owner ("abhi nahi karna"). If building starts without boards, the board-vs-live acceptance loop in packages/editor/CLAUDE.md has no reference for the Inspector.

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| Design Review | `/plan-design-review` | UI/UX gaps | 1 | issues_open | score: 4/10 → 8/10, 22 decisions |

| Pass | Before | After | Note |
|---|---|---|---|
| 1 Information architecture | 3 | 9 | DD-1 … DD-15 |
| 2 Interaction states | 2 | 9 | DD-16 … DD-19 + state table |
| 3 User journey | 3 | 8 | DD-20 + storyboard |
| 4 AI slop | 8 | 8 | App UI; no hard rejections; mockup details outdated |
| 5 Design system | 5 | 9 | DD-21 |
| 6 Responsive & a11y | 2 | 8 | DD-22 (desktop-only) |
| 7 Decisions | — | 22 resolved, 1 deferred | D23 Figma |

**VERDICT:** Design review done with one deferred decision; eng review not yet run — eng review required.

**UNRESOLVED DECISIONS:**
- D23: Figma v3 Inspector boards before code (deferred by owner)
