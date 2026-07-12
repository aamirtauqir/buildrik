# Editor PRD · Ch.03 — Inspector

> Part of BUILDRIK-PRD-EDITOR v2.0 · `main` @ `e5624ca1` · 2026-07-07 · paths under `packages/editor/src/editor/inspector/`

## 3.1 Architecture

- Root branches: multi-select → MultiSelectToolbar; none → EmptyState; single → full panel (breadcrumb, ReachScopeStrip, tabs, breakpoint+state strip, sections, VariantSection) (`ProInspector.tsx:242-458`).
- **3 tabs** (concept axis): ids style/element/effects, **relabeled Look/Layout/Effects** (`InspectorTabs.tsx:23-28`); arrow-key cycling; auto-switch to profile's defaultTab on selection (`useInspectorState.ts:48-77`).
- **18-section registry** (SSOT, 5 family files, `_shared.tsx:55-76`, `registry/index.tsx:56-65`); `styleKeys` slicing for perf, invariant-tested (`_shared.tsx:180-232`).
- **7 element profiles** decide section order per type (`config/elementProfiles.ts:52-179`): CONTAINER (fallback + warn-once on unknown), TEXT, FLEX, GRID, MEDIA, BUTTON, INPUT; type map `:192-252`.
- shouldRender gates: typography=isTextLike; flex/grid=container-or-item; link=[link,button,cta]; **all-css=devMode only — devMode hardcoded false → never renders** (`element.tsx:74`, `ProInspector.tsx:95`).
- **Density**: full | fewer — fewer keeps first 3 sections + "Simplified view… Show all controls" (`?density=full`) (`InspectorTabContent.tsx:174,219-237`).
- Tiering: index 0 primary, 1-2 secondary, ≥3 tertiary (`:182-183`); default expanded = first 2 style sections, persisted per `${elementType}:${sectionId}` in `buildrick-inspector-sections-v2` (`useInspectorSections.ts:26,150-163`).

## 3.2 Sections (what users edit)

| Section | Basic | Advanced (count) |
|---|---|---|
| Size | W/H + token-chain (SPACING tokens → `var(--buildrick-design-…)`) | min/max W/H, object-fit (5) — `SizeSection.tsx:46-374` |
| Spacing | Webflow-style nested margin/padding box, link-all per group | row/col gap (2) — `SpacingSection.tsx:43-210` |
| Typography | FontPicker (Google), size/weight(9)/line-height/letter-spacing/decoration/style + TYPE token chains | color, align, transform, white-space, word-break, spacing, indent, vertical-align (5) — `FontControls.tsx:29-256` |
| Background | color/gradient/image segmented; gradient linear/radial + angle 0-360; image + browse | size/position(9)/repeat/attachment/blend (4) — `BackgroundSection.tsx:46-385` |
| Border | width/style(9)/color | per-side + outline ×4 (8); schema variant behind `buildrick:schema-border` flag — `BorderSection.tsx:64-188`, `featureFlags.ts:27` |
| Corner radius | quad tl/tr/br/bl, linked default true (shorthand vs longhands) — `CornerRadiusSection.tsx:33-61` | |
| Effects | opacity 0-100, shadow presets ×7 + inner ×7, transform (scale 0-200/rotate ±180/move/skew ±45, composeTransform merge), transition, cursor ×13, filters (blur 0-20 etc., composeFilter), blend ×10, text-shadow, will-change — `EffectsSection.tsx:34-480` | |
| Grid | 8 col templates, auto-flow, gaps, 9-dot alignment, item col/row + span shortcuts — `GridSection.tsx:43-334` | |
| Flexbox | EnableFlexPrompt; direction/wrap/9-dot align/justify/gaps; item grow/shrink/basis/align-self/order — `flexbox/*` | |
| Layout | display ×6 cards, ConstraintControl **Fixed/Fill/Hug** (Fill=100%, Hug=fit-content, Fixed default 200px), position ×5 + offsets + z-index (only when positioned) | overflow/box-sizing/visibility/float/clear — `ConstraintControl.tsx:15-152`, `PositionControls.tsx:34-244` |
| Quick actions | Block/Flex/Grid/Hide cards, batch display writes — `QuickActionsSection.tsx:101-136` | |
| Link | type none/page/url/email/phone/anchor; href encoding `#page:id`/mailto/tel/#; target _blank+noopener — `LinkSection.tsx:43-312` | |
| Element props | per-type configs (16 input types, video flags, select options 1/line, columns 2-6, icon picker) + custom data attrs — `elementProperties/config.ts:23-321` | |
| CSS classes | chip list + autocomplete (project classes, max 8) — `CSSClassesSection.tsx:107-207` | |
| Animation / Interactions / Visibility | enable+editor / 14 triggers ×42 presets, delay 0-5s / per-breakpoint hide via `--hide-<bp>` — `interactions/types.ts:13-148`, `VisibilitySection.tsx:36-91` | |

**MoreSettingsToggle** = progressive disclosure w/ count badges (size 5, spacing 2, border 8, typography 5, bg-image 4); auto-expands on search match or existing values (`MoreSettingsToggle.tsx:23-57`, `useAdvancedSettings.ts:88-133`).

## 3.3 Edit propagation (the contract)

- Cascade: base → breakpoint overlay → pseudo (`computeEffectiveStyles`, `cssContext.ts:52-74`).
- Single edit: instant local preview + **300ms debounced** engine write in `beginTransaction("style-change")` (`useStyleHandlers.ts:106-192`). Desktop → `el.setStyle`; breakpoint → `composer.styles.setBreakpointStyle`; pseudo → `setRule(selector,{pseudo,mediaQuery})` (`:145-181`).
- Multi-select: merged view (prop shown only if all agree, else "Mixed"); batch write one transaction (`useBatchStyleHandler.ts:87-214`); only 5 batch fields (bg-color, color, radius, padding, font-size, `BatchStylePanel.tsx:94-120`); align needs ≥2, distribute ≥3 (`MultiSelectToolbar.tsx:141-142`).
- Reach model: This item / **All like this** (peer propagate + blast-radius confirm) / Whole site (hint → Styles tab) (`ReachScopeStrip.tsx:93-138`).
- Token binds stored as `var(--buildrick-design-<id>)` never raw (`tokenBindingDetection.ts:17-41`).
- Context-driven disables: inline elements no W/H/vertical spacing; gaps need flex/grid; offsets need positioned; flex-item props need flex parent (`cssContext.ts:150-198`).
- Input validation: numeric regex, keyword units disable numeric field, Escape reverts + `aria-invalid` (`InputControls.tsx:122-246`).

## 3.4 State machines

Tab+pseudo (pseudo resets to normal on element change, `useInspectorState.ts:81-83`) · pseudo pills normal/hover/focus/active/disabled hidden until used (`ProInspector.tsx:149-153`) · bg type mode color/gradient/image re-derived (`BackgroundSection.tsx:46-50`) · pick-mode emit/reset (`usePickModeReset.ts:16-26`) · per-element scrollTop persistence (`ProInspector.tsx:198-232`).

## 3.5 Defects (feeds §13)

1. **all-css dead in production** (219 lines never render) — devMode hardcoded (matches v1.0 A6)
2. **useAdvancedSettings value-auto-expand broken for kebab keys**: looks up `styles["minWidth"]` but styles use `min-width` → never fires (`useAdvancedSettings.ts:116-122`)
3. **ColorInput opacity stub** — no alpha channel, 0/100 only (`ColorInput.tsx:46-48,180`)
4. Interactions Timeline button removed (was console.warn stub) — no timeline exists (`InteractionEditor.tsx:160-162`)
5. `propertiesRegistry.ts` (1109 lines) mostly spec/reference — sections hardcode controls; many property types (linkPicker, gridTemplate, mappingBuilder…) have no renderer
6. Schema-driven border/spacing pipeline parallel + off-by-default (localStorage flag)
7. Fixed-bug markers: debounce dropped last keystroke (now flushed), transform wipe (now composed), columns double-mutation (now early-return)

## 3.6 Integration

Engine: element.setStyle/removeStyle, composer.styles.*, composer.components.updateInstanceVariant, AlignmentHandler, cms.bindings (BindingPopover). Token registries via TokenRegistryContext; DSBindingChip states token/preset/off-ds; beginner-mode bind hints via useDSModeOptional. Events: element:updated re-reads, inspector:pick-*, UI_OPEN_DESIGN_PANEL/BUILD_PANEL.
