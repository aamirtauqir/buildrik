# 01 · Inspector — UX / IA audit (2026-09-27)

Scope: `packages/editor/src/editor/inspector/` + selection toolbar / context menu where they duplicate it.
Build `8e9a3ccb2`, live `/edit/scratchver0000000000000001`, 1440×900. Every count below is from the DOM.

**Overall ≈ 4/10 against Figma.** A single selection shows 50–116 controls in 13–17 sections across three tabs
(Style · Settings · Effects). Heading 68, Input 116. Figma's text-layer panel ≈ 20.

## 1. Module map

| Part | What | Where |
|---|---|---|
| Shell | `ProInspector` (644 lines): header, tabs, context row, banners, body, footer | `inspector/ProInspector.tsx` |
| Header | Type icon, layer name, "✦ AI" chip, "Bound" chip, "⋯" | `ProInspector.tsx:358-416` |
| "⋯" menu | 12 rows: Improve with AI · Pick on canvas · Select parent · Hide inspector · Expand all · Collapse all · Duplicate · Copy styles · Paste styles · Reset all styles · Save as component · Delete | `components/InspectorElementMenu.tsx:236-297` |
| Tabs | Style · Settings (id `element`) · Effects | `sections/registry/_shared.tsx:50-57` |
| Context row | "Applies to [This element ▾] [▸]" on all three tabs | `ProInspector.tsx:436-450` |
| Scope menu | This element / All like this (mode) / Whole site (banner → Brand) | `ScopeDropdown.tsx`, `ProInspector.tsx:526-577` |
| Banners | Locked, reach-all, CMS binding, instance, pseudo-state, breakpoint overrides | `ProInspector.tsx:451-515` |
| Body | Profile order → tab sections → `shouldRender` → Beginner hides ADVANCED | `tabs/InspectorTabContent.tsx`, `config/elementProfiles.ts`, `sections/registry/*` |
| Footer (Style only) | Beginner / Pro (localStorage) | `ProInspector.tsx:622-639`, `hooks/useInspectorTier.ts` |
| Nothing selected | "Nothing selected" + one sentence | `InspectorEmptyState.tsx:76-83` |
| Multi-select | Separate panel: Align/Distribute + 5 batch fields | `MultiSelectToolbar.tsx`, `BatchStylePanel.tsx` |

Sections — Style: layout, flex (Adv), grid (Adv), size, spacing, typography, background, border. Settings: visibility
(defined in `effects.tsx:149`), link, content (Static / From CMS), collection, form-fields, form-settings, slides,
slider-settings, element-properties ("Advanced"), css-classes (Adv). Effects: opacity, shadow, blur, "More effects", interactions.

## 2. What each selection shows (Beginner, default open state)

Counts include ~9 chrome controls. "Scroll" = body height vs visible 688–732px.

| Selection | Style | Settings | Effects | Irrelevant / buried |
|---|---|---|---|---|
| Nothing | 1 sentence, 0 controls | — | — | No page properties (Figma shows them) |
| Heading (= Text, Paragraph) | Text row, Typography (27, open), Spacing (Padding + Gap), Size, Background, Border; **45** | Visibility, Content, Advanced (closed: text, **Level H1–H6**), CSS classes; 12 | 5 sections; 11 | Gap on a heading; Level hidden; text editable in 3 places |
| Button | 56, scroll 910 | Visibility, Link, Content, Advanced (Label, Open In, Type, Disabled), CSS classes; 22 | 11 | "Open In" ×2; class ×2 |
| Image | Source, Size, Spacing, Background, Border; 35 | Advanced (closed) holds **Alt** | "More effects" auto-open: 36, scroll 1095 | Alt buried |
| Video | 33; min/max unlabeled | Advanced (closed) holds **Autoplay, Loop, Muted, Controls, Poster** | 36 | Playback buried; "From CMS" on video |
| SVG | Header "Svg"; 29 | as image minus Alt | 11 | Wrong label |
| Container | 21; Size hidden by "Show all (1 more)" | Visibility, Link, Content, Advanced, CSS classes | 36 | Link + CMS on a generic box |
| Section | 30 | Link, Content | 11 | same |
| Flex / Grid | 45; Spacing 25 controls (rows **and** box diagram + 3 gap fields); **"Show all (2 more)" hides Flexbox/Grid** | Visibility, Content, Advanced, CSS classes | 11 | Show all → 78, scroll 1059 |
| Link | 37 | Link (3) | 36 | — |
| Input | 5 sections all open; **93, scroll 1364** | Advanced first but closed (Type, Name, Placeholder, Required); CMS Content | 11 | "Required ☐ Disabled" |
| Collection list | 45; Show all (2) | Collection "Source: None" below Visibility | 11 | — |
| Form | 45 | Fields · 2, After submit, Visibility, Content, Advanced (Action/Method repeated) | 11 | Action ×2; CMS on a form |
| Carousel | 66, scroll 1091 | Slides, Playback, Visibility, Content, Advanced | 11 | — |
| Icon | 31 | Glyph picker inside closed Advanced | 11 | — |
| Component instance | Edit master / Detach / Reset band on every tab | band | band | No instance mark in header |
| Multi-select | Separate panel: Group, Delete, 6 Align, 2 Distribute, Background, Text colour, Radius, Padding, Font size | no tabs | no tabs | Placeholders "000000"/"0" look like values; no "Mixed" |
| Page body | Labelled "Container"; 26 | Visibility, **Link**, **Content** | incl. Interactions | Can link / hide / CMS-bind the page body |

## 3. Scorecard (0–10)

| # | Lens | Score | Why |
|---|---|---|---|
| 1 | Cohesion | 5 | "Whole site", "Hide inspector", Expand/Collapse all beside element controls |
| 2 | Misfit | 4 | CMS on grids/forms/inputs; Link on page body; Gap on text; "Whole site" edits nothing |
| 3 | Duplicate doors | 3 | Text ×3, class ×2, shadow ×2, spacing ×2–4, Open In ×2, Copy/Paste styles ×3, AI ×3 |
| 4 | Scope leakage | 4 | "All like this" crosses pages; state row on Settings/Effects |
| 5 | Discoverability | 3 | Level, alt, autoplay, input name, flex direction hidden |
| 6 | Information scent | 4 | "Advanced" holds essentials; "Settings" clash; bare "▸"; "Required ☐ Disabled"; value-looking placeholders |
| 7 | Bloat | 3 | 93 controls on Input Style; 25-control "More effects" auto-opens |
| 8 | Surface | 6 | Right-column slot correct; multi-select separate panel isn't; "Whole site" fake surface |
| 9 | Navigation | 5 | Taxonomy tabs; tier toggle Style-only; ⋯ mixes 4 kinds of action |
| 10 | Collab | n/a | CMS Bound chip only |
| 11 | Cognitive load | 3 | Values that don't match canvas; tier + scope choices before any edit |

## 4. Findings

| ID | Sev | Finding | Evidence | Vs 09-25 |
|---|---|---|---|---|
| INS-01 | **P0** | **Inspector values don't match the canvas.** Button shows Fill `1A56DB` / text `ffffff`; renders transparent bg, `rgb(51,65,85)` text, radius 0. Heading shows `1a1a1a`; renders `#334155`. No stylesheet/inline carries the stored values. Fresh edits render (paragraph 16→40px). **Reproduce on a clean site before acting** (concurrent auditors). | `inv8.json`, `inv9.json`, `inv10/11`; `20-button-style-beginner.png`, `70-button-canvas-render.png` | NEW, cause not isolated |
| INS-02 | **P1 (near P0)** | **"All like this" reaches every page.** Offers "112 other headings"; Home has 70. Disabled tooltip says "on this page". | `ScopeDropdown.tsx:58-67,156`; `ProInspector.tsx:131-143` use `getAllElements()` = all pages (`ElementManager.ts:163-165`, `PageManager.ts:263-268`); `41-scope-open.png` | NEW (count + code; fan-out not run) |
| INS-03 | P1 | **Defining properties hidden** in closed "Advanced" on Settings: heading level, alt, video playback, input name/type/required. | `registry/element.tsx:134-151`; `useInspectorSections.ts:116`; `elementProperties/config.ts:69-209` | CHANGED (A09-9: only Link promoted) |
| INS-04 | P1 | **Three tabs by internal taxonomy.** Effects apart from Background/Border; Visibility defined in Effects file; "Settings" clashes with site Settings. | `_shared.tsx:50-57`; `effects.tsx:149-151`; `rail/tabsConfig.ts:161` | STILL TRUE (FB-1) |
| INS-05 | P1 | **One property, 2–4 editors:** text (canvas, "Edit text on canvas", Advanced textarea); class ("ID & class" + CSS classes); shadow (presets + More effects); padding/margin (rows + box diagram); gap (Gap, Row gap, Column gap, Flexbox gap); "Open In" (Link + Advanced). | `TextContentRow.tsx`; `config.ts:43-52,94,110`; `EffectsSection.tsx:175,214`; `layout.tsx:59-75`; `LinkSection.tsx:322` | NEW |
| INS-06 | P1 | **Sections that don't fit the type.** CMS Content on grid, flex, form, carousel, input, video, SVG, icon, page body (no `shouldRender`). Link on page body / containers / sections. Gap on heading/paragraph/image. Visibility + Interactions on page body. | `element.tsx:39-52`; `LinkSection.tsx:63-66`; `60-root-settings.png` | NEW |
| INS-07 | P1 | **State/scope bleed onto Settings/Effects.** `:hover` shows "Editing :hover — not Base" above Link, Content, Advanced (none vary by state). | `ProInspector.tsx:436-450,497-507`; `64b-hover-settings.png` | NEW |
| INS-08 | P1 | **"Whole site" edits nothing** — two banners + "Open Brand". | `ProInspector.tsx:526-577`; `43-whole-site.png` | NEW |
| INS-09 | P1 | **No breakpoint cue** — at Tablet looks like Desktop until an override exists. | `BreakpointOverrides.tsx:40,78`; `63-tablet.png` | CHANGED (A09-3: pill removed instead of kept as read-out) |
| INS-10 | P1 | **Beginner/Pro mostly a no-op, hides the wrong things.** Heading identical (45). Flex/Grid Beginner hides direction/align. Settings forced Pro → Beginners still see CSS classes. | `layout.tsx:73,91`; `ProInspector.tsx:611`; `inv3.json` | CHANGED (A09-9) |
| INS-11 | P1 | **Multi-select = different panel**, fake-looking values ("000000", "0"), no "Mixed". | `ProInspector.tsx:321-334`; `BatchStylePanel.tsx:102-103`; `50-multi.png` | NEW |
| INS-12 | P1 | **Checkbox text reads as value:** "Required ☐ Disabled", "Read Only ☐ Disabled". | `elementProperties/PropertyField.tsx:98`; `66-input-settings-adv.png` | NEW |
| INS-13 | P2 | Esc on ⋯ menu also deselects the element. | `inv5.json`; `InspectorElementMenu.tsx:156-160` | NEW |
| INS-14 | P2 | ⋯ mixes AI, navigation, panel chrome and element actions (12 rows); 5 repeat canvas More; "Improve with AI" duplicates the adjacent chip. | `InspectorElementMenu.tsx:236-297` | CHANGED |
| INS-15 | P2 | State pill is a bare "▸" (22px); only aria-label says "State: Base". | `StateDropdown.tsx:55-60` | NEW |
| INS-16 | P2 | Page body labelled "Container"; nothing-selected shows no page panel. | `InspectorEmptyState.tsx:76-83` | NEW |
| INS-17 | P2 | Header says "Svg" (no label-map entry). | `ProInspector.tsx:316-319` | NEW |
| INS-18 | P2 | Unlabeled paired fields ("Size" = font size + line height; min/max grid). | screenshots | NEW |
| INS-19 | P2 | Placeholders look like values (shadow placeholder under "Shadow: None"). | `EffectsSection.tsx:175,214` | NEW |
| INS-20 | P2 | Settings/Effects open everything (Style opens only valued sections); image Effects auto-opens 25 controls. | `useInspectorSections.ts:116-127,202-216` | NEW |
| INS-21 | P2 | Toolbar caption paints over page content; pill covers neighbouring text on small elements. | `UnifiedSelectionToolbar.tsx:44-47,187-190` | remainder of A09-3/4 |
| INS-22 | P2 | Copy/Cut/Paste nested under "Structure ›". | `contextMenuRegistry.ts:60-70` | A09-10 half fixed |
| INS-23 | P2 | Comments contradict shipped UI (`elementProfiles.ts:4-7`, `ProInspector.tsx:2-4`). | lines | NEW |

## 5. "Simple like Figma" target

Figma: two tabs (Design / Prototype); Design = one scroll of short always-open sections (Layer, Position, Layout,
type block, Fill, Stroke, Effects, Export); empty section = header + "+"; one editor per property; nothing selected =
page properties; multi-select = same panel with "Mixed"; no tiers, no scope modes, no site settings.

For Buildrik, keeping every capability:
1. **Header**: icon, name, one ⋯ with element actions only. Instance / CMS-bound as a header mark, not a band. One AI door.
2. **Two tabs**: *Design* (Style + Effects) and *Behaviour/Content* (link, CMS, interactions, per-breakpoint visibility, form/slider/collection). Not "Settings".
3. **Type block, open, first on Design**: Heading → level + text style · Image → source + alt · Video → source + autoplay/loop/muted/controls · Button/Link → label + destination/new tab · Input → type, name, placeholder, required · Flex/Grid → direction, align, gap (never hidden) · Collection list → collection + count. "Advanced" shrinks to ID, attributes, one class editor.
4. **Sections**: Layout/Size; Spacing with ONE editor; Typography on text only; Fill; Border; Effects with one shadow control, transform/transition behind "+".
5. **Context chips only when non-default**: "Editing: Tablet", ":hover" — Design tab only. Replace scope mode with one-shot "Apply to all N headings on this page" in ⋯. Remove "Whole site".
6. **Nothing selected** = Page panel. Page body labelled "Page", no Link/Visibility/CMS.
7. **Multi-select** = same panel with "Mixed" + Align/Distribute row.
8. **No Beginner/Pro** — per-section "More" does progressive disclosure.

Budget: heading 68 → ~20–25 controls on one tab; input 116 → ~30.

## 6. Prior-audit reconciliation

| 09-25 | Claimed | Now |
|---|---|---|
| A02-13 / A09-4: 7 AI doors | Fixed (A-14) | Partly — chip + ⋯ row side by side; multi-select keeps its own AI chip |
| A03-3 / A04-4: AI in two homes | Fixed | Fixed for the chip |
| A09-3: facts repeated 3–5× | Fixed (B-15) | Mostly; breakpoint now shown nowhere (INS-09) |
| A09-4: dead "Improve with AI" row | FC-3 | Fixed |
| A09-9: density, CSS classes, buried Link | Open (PD-35) | Changed — Beginner/Pro ineffective (INS-10) |
| A09-10: context-menu nesting | B-15 | Half fixed (INS-22) |
| A06: two delete behaviours | — | Fixed in code; not run live |
| A04-1: "Manage video" opens full library | Fixed (A-6) | Changed — video uses picker, "Manage SVG" still opens full library |
| FB-1: three "Settings" | Open | Still true |
| FB-5: "Bind to CMS field" | Fixed | Fixed |
| "N of M sections apply" footer (praised) | — | Removed |

## 7. Not verified
Figma v3 boards (no Figma calls); INS-01 cause; "All like this" fan-out (not executed on a shared site); variant
components (none on site); Pro tier beyond heading; deleting the page root; interactions editor, form Fields editor,
keyboard/a11y, performance. Later scripts ran write-blocked, so "Save failed" banners in `50-*`+ screenshots are harness.
