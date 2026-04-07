# Inspector Right Panel — Full Rebuild Design

**Date:** 2026-04-04
**Scope:** `packages/editor/src/editor/inspector/` — complete rewrite
**Strategy:** Full rebuild (Approach 3) — new architecture alongside existing, replace atomically
**Direction:** Tabs (Webflow-style) + Contextual (Framer-style) — fixed core tabs + element-specific tabs

---

## Background

The existing right panel (`ProInspector.tsx`) has accumulated structural debt from a partially completed 3-phase overhaul (design doc: `2026-03-07-right-panel-overhaul-design.md`). The following blockers and gaps were identified:

### Bugs (Blockers)

| ID | Issue |
|----|-------|
| B1 | `showPosition` and `showOverflow` computed in `LayoutTab` but never rendered — search matches them but nothing shows |
| B2 | `InspectorSubNav` lists "Visibility" under Layout sections — but `VisibilitySection` renders inside `EffectsTab` |
| B3 | `useInspectorSections` computes expand/collapse state but is immediately marked `void expandedSections` — collapse/expand all does nothing |
| B4 | `getAutoExpandSection()` always returns `null` (ARCH-02 fix) — `VariantSection` never auto-expands |

### UX Gaps

| ID | Issue |
|----|-------|
| G1 | `ElementSettingsFooter` duplicated at bottom of all 3 tabs — collapse state resets on tab switch |
| G2 | `MoreSettingsToggle` not wired in `FlexboxSection` and `EffectsSection` |
| G3 | `InspectorSubNav` type still includes dead `"settings"` tab |
| G4 | `AISuggestionSection` floats at bottom of Effects with no clear ownership |

### Decision

Rather than patching partial overhaul debt, do a **full rebuild** with clean architecture. Existing section components (Typography, Background, Border, Flexbox, Grid, Spacing, Animation, Interactions) are solid — only the orchestration layer is rebuilt.

---

## Non-Goals

- Changes to section component internals (Typography, Background, Border, etc.)
- Engine or Composer changes
- AI Suggestions — removed from panel (separate sprint)
- New design tokens — reuse existing `--aqb-*` variables
- New CSS-in-JS patterns — keep Emotion inline styles

---

## Design

### UX Direction

**Fixed core tabs + Element-specific tabs**

- `Layout` and `Style` are always present for every element (every element has layout and visual properties)
- Element-specific tabs append after the fixed tabs based on the selected element's type
- Tab positions are predictable: Layout is always slot 1, Style always slot 2 — muscle memory builds naturally

### Panel Header — Slim 1-row

**Before:** 7 stacked rows (~160px overhead before first control)
- ← Page settings link
- Element icon + name + ID + tag badge + binding popover + delete
- ElementBreadcrumb
- BreakpointIndicator
- PseudoStateSelector
- Search + collapse/expand + DevMode toggle
- Tab strip + SubNav chips

**After:** 1 compact row (~40px) + tab strip

```
[ 🔲 Button  ] [Mobile] [:hover] [ 🗑 ]
[ Layout ][ Style ][ Text ][ Link ]
```

- Element icon + name (left)
- Breakpoint pill — e.g. "Mobile", "Tablet" (color-coded)
- Pseudo-state pill — e.g. ":hover", ":focus" (only visible when non-normal state active)
- Delete button (right, destructive — red on hover)
- Tab strip immediately below header

Search and DevMode toggle move inside the Layout tab content area (tab-level controls, not panel-level).

`InspectorSubNav` (section jump links) is removed — replaced by sections being visible within the scrollable tab panel.

---

## Architecture

### File Structure

```
inspector/
  Inspector.tsx              ← new root component (replaces ProInspector.tsx)
  InspectorHeader.tsx        ← slim 1-row header
  InspectorTabRouter.tsx     ← reads profile, renders correct tab set
  index.ts                   ← re-exports Inspector (public API unchanged)

  profiles/
    index.ts                 ← getProfile(elementType): InspectorProfile
    types.ts                 ← InspectorProfile, TabDef, SectionId interfaces
    elements/
      default.ts             ← fallback for unknown element types
      button.ts
      image.ts
      text.ts
      heading.ts
      link.ts
      video.ts
      form.ts
      icon.ts
      container.ts           ← div, section, article, etc.

  tabs/
    LayoutTab.tsx            ← rebuilt — Display, Size, Spacing, Position, Overflow, Flex, Grid
    StyleTab.tsx             ← renamed from AppearanceTab — Background, Border, Effects
    MotionTab.tsx            ← renamed from EffectsTab — Animation, Transitions, Interactions, Visibility
    element/
      TextTab.tsx            ← Typography section
      ImageTab.tsx           ← Image source, fit, position
      LinkTab.tsx            ← Href, target, rel, CSS Classes, Element ID
      VideoTab.tsx           ← Src, autoplay, controls, loop, muted
      FormTab.tsx            ← Action, method, validation

  components/
    InspectorEmptyState.tsx  ← kept as-is
    InspectorErrorBoundary.tsx ← kept as-is
    MultiSelectToolbar.tsx   ← kept as-is
    PseudoStateSelector.tsx  ← kept as-is
    DeleteConfirmModal.tsx   ← kept as-is
    BindingPopover.tsx       ← kept as-is

  sections/                  ← ALL KEPT, zero changes to internals
    typography/
    BackgroundSection.tsx
    BorderSection.tsx
    SpacingSection.tsx
    SizeSection.tsx
    VisibilitySection.tsx
    EffectsSection.tsx
    AnimationSection.tsx
    interactions/
    flexbox/
    layout/
    GridSection.tsx
    CSSClassesSection.tsx
    elementProperties/
    LinkSection.tsx
    AllCSSSection.tsx

  hooks/
    useInspectorState.ts     ← kept, simplified (remove autoExpandSection logic)
    useStyleHandlers.ts      ← kept as-is
    useAdvancedSettings.ts   ← kept as-is

  shared/
    controls/                ← ALL kept as-is
    types.ts                 ← kept as-is
    DevModeToggle.tsx        ← kept as-is

  styles/
    index.ts                 ← kept as-is
```

### Deleted Files

| File | Reason |
|------|--------|
| `ProInspector.tsx` | Replaced by `Inspector.tsx` |
| `tabs/AppearanceTab.tsx` | Replaced by `tabs/StyleTab.tsx` |
| `tabs/EffectsTab.tsx` | Replaced by `tabs/MotionTab.tsx` |
| `components/ElementSettingsFooter.tsx` | Replaced by `LinkTab.tsx` for link concerns, `profiles` for identity |
| `components/InspectorSubNav.tsx` | Removed — no section jump nav in new design |
| `sections/AISuggestionSection.tsx` | Removed — canvas relocation sprint |
| `sections/VariantSection.tsx` | Absorbed into profile system (`hasVariants` flag) |
| `hooks/useInspectorSections.ts` | Replaced by profile-driven section visibility |
| `config/elementProfiles.ts` | Replaced by `profiles/elements/*.ts` |

---

## Profile System

### InspectorProfile Interface

```ts
// profiles/types.ts

export type SectionId =
  | "display" | "size" | "spacing" | "position" | "overflow"
  | "flexbox" | "grid"
  | "background" | "border" | "effects"
  | "typography" | "visibility"
  | "animation" | "transitions" | "interactions"
  | "image" | "video" | "link" | "form"
  | "cssClasses" | "elementProperties" | "allCSS";

export type TabId =
  | "layout" | "style"          // fixed core — always present
  | "text" | "image" | "link"   // element-specific
  | "video" | "form" | "motion";

export interface TabDef {
  id: TabId;
  label: string;
  icon?: string;
  component: React.ComponentType<TabProps>;
}

export interface InspectorProfile {
  elementType: string;
  /** Default tab to open when this element is selected */
  defaultTab: TabId;
  /** Element-specific tabs appended after Layout + Style */
  elementTabs: TabDef[];
  /** Which sections to show in Layout tab (always includes base set) */
  layoutSections: SectionId[];
  /** Which sections to show in Style tab */
  styleSections: SectionId[];
  /** If true, show VariantSection at top of Style tab */
  hasVariants?: boolean;
}
```

### Element Profiles

| Element type(s) | Default tab | Element tabs | Notes |
|----------------|-------------|--------------|-------|
| div, section, article, container | layout | Motion | Generic container |
| text, paragraph, span | layout | Text | Typography in Text tab |
| heading (h1–h6) | layout | Text | |
| button | style | Text · Link | Opens Style (background, border matter most) |
| link, a | layout | Link | |
| image, img | style | Image | Opens Style for visual inspection |
| video | layout | Video · Motion | |
| icon, svg | style | — | No element tab |
| form | layout | Form | |
| input, textarea, select | layout | Form | |
| unknown/default | layout | — | Base sections only |

### Layout Tab Sections (all elements)

Always present:
- Display (`layout/index.tsx` — DisplayControls, PositionControls, OverflowVisibilityControls)
- Size (`SizeSection`)
- Spacing (`SpacingSection`)

Conditional (shown by display value):
- Flexbox (`sections/flexbox/`) — only when `display: flex | inline-flex`
- Grid (`GridSection`) — only when `display: grid | inline-grid`

### Style Tab Sections (all elements)

- Background (`BackgroundSection`)
- Border (`BorderSection`)
- Effects (`EffectsSection` — shadows, filters, opacity, transforms)
- VariantSection — only when `profile.hasVariants === true`

### Element-Specific Tab Sections

**TextTab** — Typography section (font, size, weight, color, align, decoration, line-height). MoreSettingsToggle for advanced (word-break, white-space, text-shadow, overflow-wrap).

**ImageTab** — Image source, alt text, object-fit (cover/contain/fill/none), object-position.

**LinkTab** — Href input, target select (\_self/\_blank/\_parent), rel checkboxes (noopener, noreferrer), CSS Classes section, Element ID copy.

**VideoTab** — Src input, autoplay/controls/loop/muted toggles, poster image.

**MotionTab** — Animation section, Transitions, Interactions, Visibility.

**FormTab** — Action, method (GET/POST), enctype, novalidate toggle, Element Properties section.

---

## Component Design

### Inspector.tsx

```tsx
// Orchestrates everything — passes props down, handles multi-select + empty states
export const Inspector: React.FC<InspectorProps> = ({ selectedElement, composer, ... }) => {
  const { activeTab, pseudoState, devMode, setActiveTab, setPseudoState, setDevMode }
    = useInspectorState(selectedElement);

  const { styles, handleStyleChange, handleBatchStyleChange, overriddenProperties }
    = useStyleHandlers(selectedElement, composer, currentBreakpoint, pseudoState);

  // Multi-select
  const { selectedIds, isMultiSelect } = useComposerSelection({ composer });
  if (isMultiSelect) return <MultiSelectToolbar ... />;
  if (!selectedElement) return <InspectorEmptyState ... />;

  return (
    <div style={panelStyles.panel}>
      <InspectorHeader
        element={selectedElement}
        breakpoint={currentBreakpoint}
        pseudoState={pseudoState}
        onPseudoStateChange={setPseudoState}
        onDelete={onDelete}
        composer={composer}
      />
      <InspectorTabRouter
        element={selectedElement}
        composer={composer}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        styles={styles}
        pseudoState={pseudoState}
        onChange={handleStyleChange}
        onBatchChange={handleBatchStyleChange}
        devMode={devMode}
        onDevModeChange={setDevMode}
        overriddenProperties={overriddenProperties}
        onOpenMediaLibrary={onOpenMediaLibrary}
        onOpenIconPicker={onOpenIconPicker}
      />
    </div>
  );
};
```

### InspectorHeader.tsx

```tsx
// Slim 1-row: icon + name | breakpoint pill | pseudo pill | delete
export const InspectorHeader: React.FC<InspectorHeaderProps> = ({
  element, breakpoint, pseudoState, onPseudoStateChange, onDelete, composer
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const ElementIcon = getElementIcon(element.type);

  return (
    <>
      <div style={headerStyles.row}>
        <ElementIcon size="sm" aria-hidden />
        <span style={headerStyles.name}>{capitalize(element.type)}</span>
        <BreakpointPill breakpoint={breakpoint} />
        {pseudoState !== "normal" && (
          <PseudoPill state={pseudoState} onClick={() => onPseudoStateChange("normal")} />
        )}
        <button style={headerStyles.deleteBtn} onClick={() => setShowDeleteConfirm(true)}>
          <Trash2 size={13} />
        </button>
      </div>
      <DeleteConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => { onDelete?.(element.id); setShowDeleteConfirm(false); }}
        elementLabel={capitalize(element.type)}
      />
    </>
  );
};
```

### InspectorTabRouter.tsx

```tsx
// Reads profile for element type, renders fixed + element tabs
export const InspectorTabRouter: React.FC<TabRouterProps> = ({
  element, activeTab, onTabChange, ...tabProps
}) => {
  const profile = getProfile(element.type);
  const allTabs: TabDef[] = [
    { id: "layout", label: "Layout", component: LayoutTab },
    { id: "style",  label: "Style",  component: StyleTab },
    ...profile.elementTabs,
  ];

  const ActiveTabComponent = allTabs.find(t => t.id === activeTab)?.component
    ?? allTabs[0].component;

  return (
    <>
      {/* Tab strip */}
      <div role="tablist" style={tabStyles.strip}>
        {allTabs.map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => onTabChange(tab.id)}
            style={tabStyles.tab(activeTab === tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Active tab content */}
      <div role="tabpanel" style={tabStyles.content}>
        <InspectorErrorBoundary>
          <ActiveTabComponent profile={profile} {...tabProps} />
        </InspectorErrorBoundary>
      </div>
    </>
  );
};
```

---

## Progressive Disclosure

`MoreSettingsToggle` + `useAdvancedSettings` pattern kept and properly wired across **all sections**:

| Section | Basic | Advanced (hidden by default) |
|---------|-------|------------------------------|
| Display/Layout | display, position | isolation, contain, box-sizing |
| Size | width, height | min-w, max-w, min-h, max-h, aspect-ratio |
| Spacing | padding, margin | row-gap, column-gap individually |
| Typography | font-family, size, weight, align, color | word-break, white-space, text-shadow, overflow-wrap |
| Background | bg-color, bg-image | attachment, clip, origin, repeat variants |
| Border | border shorthand, radius | individual sides, outline, outline-offset |
| Flexbox | direction, align, justify | flex-wrap, order, align-self, flex-grow/shrink/basis |
| Effects | opacity, box-shadow | filter, backdrop-filter, mix-blend-mode, transform |

Search query auto-expands advanced sections (already built in `useAdvancedSettings`, no extra work needed).

---

## Pseudo-State Handling

`PseudoStateSelector` moves out of the header into a subtle pill in the 1-row header. Behavior unchanged:
- "Normal" is the default — pill hidden when normal state active
- When `:hover`, `:focus`, `:active`, or `:disabled` is active — pill shows, accent-colored, click to reset to normal
- States with at least one overridden property get a dot indicator

---

## Error Handling

- `InspectorErrorBoundary` wraps the entire `InspectorTabRouter` output — any section that throws does not crash the whole panel
- Unknown element types fall back to `profiles/elements/default.ts` — Layout + Style tabs, no element-specific tabs
- Missing composer prop — sections gracefully degrade (read-only display where possible)

---

## Testing

Existing tests in `inspector/__tests__/` continue to pass — section components are not changed. New tests needed:

| Test | File |
|------|------|
| `getProfile(type)` returns correct tab set | `profiles/__tests__/profiles.test.ts` |
| `InspectorTabRouter` renders correct tabs for each element type | `__tests__/InspectorTabRouter.test.tsx` |
| `InspectorHeader` slim row renders correctly | `__tests__/InspectorHeader.test.tsx` |
| Tab keyboard navigation (ArrowLeft/ArrowRight) | `__tests__/TabNavigation.test.tsx` (update existing) |

---

## Final State — Visual Summary

```
┌─────────────────────────────────────┐
│ 🔲 Button    [Mobile] [:hover]  🗑  │  ← InspectorHeader (40px)
├──────────┬─────────┬────────┬───────┤
│  Layout  │  Style  │  Text  │  Link │  ← InspectorTabRouter (tabs)
├──────────┴─────────┴────────┴───────┤
│                                     │
│  [Search...]           [Dev Mode]   │  ← inside active tab
│  ─────────────────────────────────  │
│  SIZE                               │
│  W [120px]  H [36px]               │
│                                     │
│  SPACING                            │
│  Padding [0] [0] [0] [0]           │
│  Margin  [0] [0] [0] [0]           │
│  ▸ More settings (3)               │
│                                     │
│  DISPLAY                            │
│  [Block] [Flex] [Grid] [None]      │
│                                     │
└─────────────────────────────────────┘
```

---

## Risk Register

| Risk | Mitigation |
|------|-----------|
| Public API change (`ProInspector` → `Inspector`) | Update `index.ts` to re-export `Inspector` as `ProInspector` for backward compat during transition |
| Profile missing for new element type | `getProfile()` falls back to `default.ts` — never throws |
| Section component throws | `InspectorErrorBoundary` per tab isolates failures |
| Tab state lost on element switch | `useInspectorState` resets to `profile.defaultTab` on element change — intentional |
| TypeScript errors from deleted files | Run `npx tsc --noEmit` as exit gate — fix all before merge |
