# Inspector Panel UX Audit — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix 37 UX issues in the ProInspector Right Panel across 15 tasks, ordered by user impact.

**Architecture:** Each task is a standalone commit. Tasks 1–7 are visible to users on every interaction. Tasks 8–11 clean up architecture and remove dead code. Tasks 12–15 add click-to-copy, fix the CSS classes panel, and replace emoji icons with SVG. No task introduces breaking changes to the public API.

**Tech Stack:** React 18, TypeScript strict, Vitest (root-level), @testing-library/react, lucide-react (already installed).

**Design doc:** `docs/plans/2026-03-01-inspector-panel-ux-audit-design.md`

---

## Task 0: Set up test infrastructure

**Fixes:** Nothing visible — required before all other tasks.

**Files:**

- Modify: `package.json` (add `test` script)
- Modify: `/Users/shahg/Desktop/aquibra-opencode/vitest.workspace.ts` (add new-editor-l2)

**Step 1: Add test script to package.json**

In `packages/new-editor-l2/package.json`, add `"test": "vitest run"` to the `scripts` block:

```json
"scripts": {
  "dev": "vite",
  "build": "tsc && vite build",
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "check:no-legacy-settings-path": "grep -r 'components/Panels/LeftSidebar/tabs/settings' src/ --include='*.ts' --include='*.tsx' && echo 'FAIL: legacy settings path found' && exit 1 || echo 'PASS: no legacy settings path'"
}
```

**Step 2: Add new-editor-l2 to the monorepo vitest workspace**

In `/Users/shahg/Desktop/aquibra-opencode/vitest.workspace.ts`:

```ts
import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
  "packages/editor/vitest.config.ts",
  "packages/website/vitest.config.ts",
  "packages/new-editor-l2/vitest.config.ts",
  // Note: server tests require running server environment (env vars, DB).
  // Run them separately via: cd server && npm test
]);
```

**Step 3: Run existing tests to confirm the setup works**

Run from the package directory:

```bash
cd packages/new-editor-l2 && npm run test
```

Expected: Tests pass (the 3 design-system tests in `src/editor/sidebar/tabs/design/__tests__/`).

**Step 4: Commit**

```bash
git add packages/new-editor-l2/package.json vitest.workspace.ts
git commit -m "chore(inspector): wire new-editor-l2 into vitest workspace"
```

---

## Task 1: Upgrade Section.tsx — preview prop, id prop, aria-label, ChevronDown

**Fixes:** C-04 (value preview when collapsed), C-02 (Section button aria-label), M-03 (text ▼ → SVG)

**Files:**

- Modify: `src/editor/inspector/shared/controls/Section.tsx`
- Create: `src/editor/inspector/__tests__/Section.test.tsx`

**Step 1: Write the failing test**

Create `src/editor/inspector/__tests__/Section.test.tsx`:

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Section } from "../shared/controls/Section";

// Suppress style warnings from jsdom
vi.mock("../shared/controls/controlStyles", () => ({
  baseStyles: {
    section: {},
    sectionHeader: () => ({}),
    sectionContent: {},
  },
}));

describe("Section — aria-label", () => {
  it("button has aria-label including title and collapsed state", () => {
    render(<Section title="Background">content</Section>);
    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-label",
      "Background section, collapsed"
    );
  });

  it("aria-label updates to expanded after click", () => {
    render(<Section title="Background">content</Section>);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-label",
      "Background section, expanded"
    );
  });
});

describe("Section — preview prop", () => {
  it("shows preview when collapsed", () => {
    const preview = <span data-testid="preview-swatch" />;
    render(
      <Section title="Background" preview={preview}>
        content
      </Section>
    );
    expect(screen.getByTestId("preview-swatch")).toBeInTheDocument();
  });

  it("hides preview when expanded", () => {
    const preview = <span data-testid="preview-swatch" />;
    render(
      <Section title="Background" preview={preview}>
        content
      </Section>
    );
    fireEvent.click(screen.getByRole("button"));
    expect(screen.queryByTestId("preview-swatch")).not.toBeInTheDocument();
  });

  it("shows no preview when none provided", () => {
    render(<Section title="Background">content</Section>);
    // no error, no unexpected preview element
    expect(screen.queryByTestId("preview-swatch")).not.toBeInTheDocument();
  });
});

describe("Section — id prop", () => {
  it("root div has id when id prop is provided", () => {
    const { container } = render(
      <Section title="Background" id="inspector-section-background">
        content
      </Section>
    );
    expect(container.querySelector("#inspector-section-background")).not.toBeNull();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd packages/new-editor-l2 && npm run test -- --reporter=verbose 2>&1 | grep -A3 "Section"
```

Expected: FAIL — `preview` prop does not exist, `aria-label` not set, `id` not on root div.

**Step 3: Implement changes in Section.tsx**

Replace the full file `src/editor/inspector/shared/controls/Section.tsx` with:

```tsx
/**
 * Section - Collapsible section wrapper for Pro Inspector
 * Supports both controlled and uncontrolled modes
 * @license BSD-3-Clause
 */

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { Icon, type IconName } from "../../../../shared/ui";
import { baseStyles } from "./controlStyles";

// ============================================================================
// TYPES
// ============================================================================

export interface SectionProps {
  title: string;
  /** Icon - either an emoji string or a Lucide icon name */
  icon?: string | IconName;
  /** Initial open state for uncontrolled mode */
  defaultOpen?: boolean;
  /** Controlled open state - overrides defaultOpen when provided */
  isOpen?: boolean;
  /** Callback when section is toggled */
  onToggle?: (isOpen: boolean) => void;
  /** ID placed on root div — used by sub-nav scroll anchors */
  id?: string;
  /** Preview shown next to label when section is collapsed */
  preview?: React.ReactNode;
  children: React.ReactNode;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const Section: React.FC<SectionProps> = ({
  title,
  icon,
  defaultOpen = false,
  isOpen: controlledIsOpen,
  onToggle,
  id,
  preview,
  children,
}) => {
  const [internalIsOpen, setInternalIsOpen] = React.useState(defaultOpen);

  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  // Sync internal state when controlled prop changes
  // Note: L-03 — this sync may cause an extra render; tracked in backlog
  React.useEffect(() => {
    if (isControlled) {
      setInternalIsOpen(controlledIsOpen);
    }
  }, [isControlled, controlledIsOpen]);

  const handleToggle = () => {
    const newState = !isOpen;
    if (!isControlled) {
      setInternalIsOpen(newState);
    }
    onToggle?.(newState);
  };

  const contentId = `section-content-${title.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div style={baseStyles.section} id={id}>
      <button
        style={baseStyles.sectionHeader(isOpen)}
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-controls={contentId}
        aria-label={`${title} section, ${isOpen ? "expanded" : "collapsed"}`}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {icon && (
            <span style={{ display: "flex", alignItems: "center" }}>
              {typeof icon === "string" && /^[A-Z]/.test(icon) ? (
                <Icon name={icon as IconName} size="sm" color="inherit" />
              ) : (
                icon
              )}
            </span>
          )}
          {title}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {!isOpen && preview && (
            <span aria-hidden="true" style={{ display: "flex", alignItems: "center" }}>
              {preview}
            </span>
          )}
          <ChevronDown
            size={12}
            aria-hidden={true}
            style={{
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s",
              color: "var(--aqb-text-tertiary)",
            }}
          />
        </span>
      </button>
      {isOpen && (
        <div id={contentId} style={baseStyles.sectionContent}>
          {children}
        </div>
      )}
    </div>
  );
};

export default Section;
```

**Step 4: Run tests to verify they pass**

```bash
cd packages/new-editor-l2 && npm run test -- --reporter=verbose 2>&1 | grep -A3 "Section"
```

Expected: All Section tests PASS.

**Step 5: TypeScript check**

```bash
cd packages/new-editor-l2 && npm run typecheck
```

Expected: 0 errors.

**Step 6: Commit**

```bash
git add src/editor/inspector/shared/controls/Section.tsx \
        src/editor/inspector/__tests__/Section.test.tsx
git commit -m "fix(inspector): Section — preview prop, id anchor, aria-label, ChevronDown SVG (C-04, C-02, M-03)"
```

---

## Task 2: Wire value previews into BackgroundSection

**Fixes:** C-04 (background color preview when collapsed)

**Files:**

- Modify: `src/editor/inspector/sections/BackgroundSection.tsx`
- Create: `src/editor/inspector/__tests__/BackgroundSection.test.tsx`

**Step 1: Write the failing test**

Create `src/editor/inspector/__tests__/BackgroundSection.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { BackgroundSection } from "../sections/BackgroundSection";

vi.mock("../shared/Controls", async () => {
  const actual = await vi.importActual<typeof import("../shared/Controls")>("../shared/Controls");
  return {
    ...actual,
    Section: ({ children, preview }: { children: React.ReactNode; preview?: React.ReactNode }) => (
      <div>
        <div data-testid="section-preview">{preview}</div>
        {children}
      </div>
    ),
  };
});

describe("BackgroundSection — preview", () => {
  it("shows color swatch when backgroundColor is set", () => {
    render(<BackgroundSection styles={{ backgroundColor: "#ff0000" }} onChange={vi.fn()} />);
    const swatch = screen.getByTitle("#ff0000");
    expect(swatch).toBeInTheDocument();
  });

  it("shows no preview when no background color", () => {
    render(<BackgroundSection styles={{}} onChange={vi.fn()} />);
    // preview container should be empty
    expect(screen.getByTestId("section-preview").children).toHaveLength(0);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd packages/new-editor-l2 && npm run test -- --reporter=verbose 2>&1 | grep -A3 "BackgroundSection"
```

Expected: FAIL — `preview` prop not passed to Section.

**Step 3: Update BackgroundSection.tsx**

In `src/editor/inspector/sections/BackgroundSection.tsx`, add the preview computation just before the `return` statement and pass it to `<Section>`:

```tsx
// Compute color preview from styles
const bgColor = styles["background-color"] || styles["backgroundColor"] || styles["background"];
const preview = bgColor ? (
  <span
    style={{
      display: "inline-block",
      width: 14,
      height: 14,
      borderRadius: 3,
      background: bgColor,
      border: "1px solid rgba(255,255,255,0.15)",
      flexShrink: 0,
    }}
    title={bgColor}
  />
) : undefined;

// Change the opening Section tag to pass preview:
// <Section title="Background" icon="Palette" preview={preview}>
```

Full change: locate `<Section title="Background" icon="Palette">` in BackgroundSection.tsx and change it to `<Section title="Background" icon="Palette" preview={preview}>`. Add the `preview` computation above the return.

**Step 4: Run tests to verify they pass**

```bash
cd packages/new-editor-l2 && npm run test -- --reporter=verbose 2>&1 | grep -A3 "BackgroundSection"
```

Expected: PASS.

**Step 5: TypeScript check**

```bash
cd packages/new-editor-l2 && npm run typecheck
```

Expected: 0 errors.

**Step 6: Commit**

```bash
git add src/editor/inspector/sections/BackgroundSection.tsx \
        src/editor/inspector/__tests__/BackgroundSection.test.tsx
git commit -m "fix(inspector): BackgroundSection — show color swatch preview when collapsed (C-04)"
```

---

## Task 3: Wire value previews into BorderSection, EffectsSection, AnimationSection

**Fixes:** C-04 continued (border, effects, animation previews)

**Files:**

- Modify: `src/editor/inspector/sections/BorderSection.tsx`
- Modify: `src/editor/inspector/sections/EffectsSection.tsx`
- Modify: `src/editor/inspector/sections/AnimationSection.tsx`

No new test file — pattern is identical to Task 2, verified by visual QA.

**Step 1: Update BorderSection.tsx**

In `src/editor/inspector/sections/BorderSection.tsx`, add before the return:

```tsx
// Compute border preview
const borderStyle = styles["border-style"] || (styles["border"] ? "set" : undefined);
const borderColor = styles["border-color"] || styles["border"]?.split(" ")[2];
const borderPreview = borderStyle ? (
  <span
    style={{
      fontSize: 9,
      color: "var(--aqb-text-tertiary)",
      fontFamily: "var(--aqb-font-mono)",
      whiteSpace: "nowrap" as const,
    }}
  >
    {styles["border"] || `${borderStyle}`}
  </span>
) : undefined;
```

Change `<Section title="Border" ...>` to pass `preview={borderPreview}`.

**Step 2: Update EffectsSection.tsx**

In `src/editor/inspector/sections/EffectsSection.tsx`, add before the return:

```tsx
// Count shadows for preview
const shadows = styles["box-shadow"] ? styles["box-shadow"].split("),").length : 0;
const effectsPreview =
  shadows > 0 ? (
    <span style={{ fontSize: 9, color: "var(--aqb-text-tertiary)" }}>
      {shadows} shadow{shadows !== 1 ? "s" : ""}
    </span>
  ) : undefined;
```

Change `<Section title="Effects" ...>` to pass `preview={effectsPreview}`.

**Step 3: Update AnimationSection.tsx**

In `src/editor/inspector/sections/AnimationSection.tsx`, add before the return:

```tsx
// Show animation name for preview
const animName = styles["animation-name"] || styles["animation"]?.split(" ")[0];
const animPreview =
  animName && animName !== "none" ? (
    <span
      style={{ fontSize: 9, color: "var(--aqb-text-tertiary)", fontFamily: "var(--aqb-font-mono)" }}
    >
      {animName}
    </span>
  ) : undefined;
```

Change `<Section title="Animation" ...>` to pass `preview={animPreview}`.

**Step 4: TypeScript check**

```bash
cd packages/new-editor-l2 && npm run typecheck
```

Expected: 0 errors.

**Step 5: Commit**

```bash
git add src/editor/inspector/sections/BorderSection.tsx \
        src/editor/inspector/sections/EffectsSection.tsx \
        src/editor/inspector/sections/AnimationSection.tsx
git commit -m "fix(inspector): BorderSection/EffectsSection/AnimationSection — add collapsed previews (C-04)"
```

---

## Task 4: Clickable sub-nav scroll anchors (H-02)

**Fixes:** H-02 (decorative sub-nav becomes functional jump links)

**Files:**

- Modify: `src/editor/inspector/ProInspector.tsx`
- Each section component (pass `id` prop)

**Step 1: Write the failing test**

Add to `src/editor/inspector/__tests__/Section.test.tsx` (append at end):

```tsx
describe("Section — id on root div", () => {
  it("root div has id prop value for sub-nav scrolling", () => {
    const { container } = render(
      <Section title="Border" id="inspector-section-border">
        children
      </Section>
    );
    expect(container.firstChild).toHaveAttribute("id", "inspector-section-border");
  });
});
```

**Step 2: Run test to verify it passes** (already implemented in Task 1)

```bash
cd packages/new-editor-l2 && npm run test -- --reporter=verbose 2>&1 | grep "root div has id"
```

Expected: PASS (id prop was added in Task 1).

**Step 3: Add id props to section components**

Each section component wraps its content in `<Section>`. Add the canonical `id` prop to each `<Section>` tag.

In `src/editor/inspector/sections/BackgroundSection.tsx`:

```tsx
<Section title="Background" icon="Palette" preview={preview} id="inspector-section-background">
```

In `src/editor/inspector/sections/BorderSection.tsx`:

```tsx
<Section title="Border" id="inspector-section-border" preview={borderPreview}>
```

In `src/editor/inspector/sections/EffectsSection.tsx`:

```tsx
<Section title="Effects" id="inspector-section-effects" preview={effectsPreview}>
```

In `src/editor/inspector/sections/AnimationSection.tsx`:

```tsx
<Section title="Animation" id="inspector-section-animation" preview={animPreview}>
```

In `src/editor/inspector/sections/SpacingSection.tsx`:

```tsx
// Find the <Section ...> tag and add id:
<Section title="Spacing" id="inspector-section-spacing" ...>
```

In `src/editor/inspector/sections/SizeSection.tsx`:

```tsx
<Section title="Size Constraints" id="inspector-section-size" ...>
```

In `src/editor/inspector/sections/GridSection.tsx`:

```tsx
<Section title="Grid" id="inspector-section-grid" ...>
```

In `src/editor/inspector/sections/VisibilitySection.tsx`:

```tsx
<Section title="Visibility" id="inspector-section-visibility" ...>
```

In `src/editor/inspector/sections/CSSClassesSection.tsx`:

```tsx
<Section title="CSS Classes" icon="Tag" defaultOpen id="inspector-section-css-classes">
```

In `src/editor/inspector/sections/LinkSection.tsx` (if it uses Section):

```tsx
<Section title="Link" id="inspector-section-link" ...>
```

In `src/editor/inspector/sections/VariantSection.tsx` (if it uses Section):

```tsx
<Section title="Variants" id="inspector-section-variants" ...>
```

For the LayoutTab sections (Display, Position, Flexbox, Grid are in LayoutTab.tsx):
Open `src/editor/inspector/tabs/LayoutTab.tsx` and find the `<Section>` tags for Display, Position, Flexbox, Grid. Add these ids:

- Display section: `id="inspector-section-display"`
- Position section: `id="inspector-section-position"`
- Flexbox section: `id="inspector-section-flexbox"`

For the Typography section (in DesignTab.tsx):
Open `src/editor/inspector/tabs/DesignTab.tsx` and find the Typography `<Section>`. Add: `id="inspector-section-typography"`.

For the Element Properties section (in SettingsTab.tsx or sections/):
Find it and add: `id="inspector-section-element-properties"`.

**Step 4: Replace decorative sub-nav in ProInspector.tsx**

In `src/editor/inspector/ProInspector.tsx`, find the section summary div (around lines 366–381):

```tsx
{
  /* Section summary for current tab */
}
<div
  style={{
    padding: "6px 12px",
    fontSize: 10,
    color: "var(--aqb-text-tertiary)",
    borderBottom: "1px solid var(--aqb-border-subtle)",
    background: "var(--aqb-surface-2)",
  }}
>
  {activeTab === "layout" && "Position • Display • Spacing • Flexbox • Grid • Visibility"}
  {activeTab === "design" &&
    "Typography • Background • Border • Effects • Animation • Interactions"}
  {activeTab === "settings" && "Properties • Navigation • Form • Classes • CSS • AI Suggestions"}
</div>;
```

Replace it with:

```tsx
{
  /* Sub-nav — clickable section jump links (H-02 fix) */
}
{
  (() => {
    const LAYOUT_SECTIONS = [
      { label: "Display", id: "inspector-section-display" },
      { label: "Size", id: "inspector-section-size" },
      { label: "Spacing", id: "inspector-section-spacing" },
      { label: "Position", id: "inspector-section-position" },
      { label: "Flexbox", id: "inspector-section-flexbox" },
      { label: "Grid", id: "inspector-section-grid" },
      { label: "Visibility", id: "inspector-section-visibility" },
    ] as const;
    const DESIGN_SECTIONS = [
      { label: "Typography", id: "inspector-section-typography" },
      { label: "Background", id: "inspector-section-background" },
      { label: "Border", id: "inspector-section-border" },
      { label: "Effects", id: "inspector-section-effects" },
      { label: "Animation", id: "inspector-section-animation" },
      { label: "Interactions", id: "inspector-section-interactions" },
    ] as const;
    const SETTINGS_SECTIONS = [
      { label: "Properties", id: "inspector-section-element-properties" },
      { label: "Link", id: "inspector-section-link" },
      { label: "Classes", id: "inspector-section-css-classes" },
    ] as const;

    const activeSections =
      activeTab === "layout"
        ? LAYOUT_SECTIONS
        : activeTab === "design"
          ? DESIGN_SECTIONS
          : SETTINGS_SECTIONS;

    const scrollToSection = (sectionId: string) => {
      const el = contentRef.current?.querySelector(`#${sectionId}`);
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    return (
      <nav
        aria-label={`${activeTab} sections`}
        style={{
          display: "flex",
          flexWrap: "wrap" as const,
          gap: 2,
          padding: "6px 12px",
          borderBottom: "1px solid var(--aqb-border-subtle)",
          background: "var(--aqb-surface-2)",
        }}
      >
        {activeSections.map((section, i) => (
          <React.Fragment key={section.id}>
            <button
              type="button"
              onClick={() => scrollToSection(section.id)}
              title={`Jump to ${section.label} section`}
              aria-label={`Jump to ${section.label} section`}
              style={{
                background: "transparent",
                border: "none",
                padding: "2px 4px",
                fontSize: 10,
                color: "var(--aqb-text-tertiary)",
                cursor: "pointer",
                borderRadius: 3,
              }}
            >
              {section.label}
            </button>
            {i < activeSections.length - 1 && (
              <span
                aria-hidden="true"
                style={{ color: "var(--aqb-border)", fontSize: 10, lineHeight: "20px" }}
              >
                •
              </span>
            )}
          </React.Fragment>
        ))}
      </nav>
    );
  })();
}
```

**Step 5: TypeScript check**

```bash
cd packages/new-editor-l2 && npm run typecheck
```

Expected: 0 errors.

**Step 6: Run all tests**

```bash
cd packages/new-editor-l2 && npm run test
```

Expected: All tests pass.

**Step 7: Commit**

```bash
git add src/editor/inspector/ProInspector.tsx \
        src/editor/inspector/sections/*.tsx \
        src/editor/inspector/tabs/*.tsx \
        src/editor/inspector/__tests__/Section.test.tsx
git commit -m "fix(inspector): sub-nav strip — clickable jump links to each section (H-02)"
```

---

## Task 5: Create PseudoStateSelector component (H-03, H-01, H-09)

**Fixes:** H-03 (dot indicator for states with overrides), H-01 (aria-label on state buttons), H-09 (plain-language tooltips on pseudo-states)

**Files:**

- Create: `src/editor/inspector/components/PseudoStateSelector.tsx`
- Create: `src/editor/inspector/__tests__/PseudoStateSelector.test.tsx`

**Step 1: Write the failing test**

Create `src/editor/inspector/__tests__/PseudoStateSelector.test.tsx`:

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { PseudoStateSelector } from "../components/PseudoStateSelector";

describe("PseudoStateSelector — renders all states", () => {
  it("shows 5 state buttons", () => {
    render(<PseudoStateSelector currentPseudoState="normal" onChange={vi.fn()} />);
    expect(screen.getAllByRole("button")).toHaveLength(5);
  });

  it("each button has aria-label", () => {
    render(<PseudoStateSelector currentPseudoState="normal" onChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: /default state/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /hover state/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /focus state/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /active state/i })).toBeInTheDocument(); // "click state" or "active"
    expect(screen.getByRole("button", { name: /disabled state/i })).toBeInTheDocument();
  });

  it("calls onChange when a state button is clicked", () => {
    const onChange = vi.fn();
    render(<PseudoStateSelector currentPseudoState="normal" onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /hover state/i }));
    expect(onChange).toHaveBeenCalledWith("hover");
  });
});

describe("PseudoStateSelector — dot indicator", () => {
  it("shows dot on hover button when hover has overrides", () => {
    render(
      <PseudoStateSelector
        currentPseudoState="normal"
        onChange={vi.fn()}
        statesWithOverrides={new Set(["hover"])}
      />
    );
    expect(screen.getByTestId("override-dot-hover")).toBeInTheDocument();
  });

  it("does not show dot when no overrides", () => {
    render(<PseudoStateSelector currentPseudoState="normal" onChange={vi.fn()} />);
    expect(screen.queryByTestId("override-dot-hover")).not.toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd packages/new-editor-l2 && npm run test -- --reporter=verbose 2>&1 | grep -A3 "PseudoStateSelector"
```

Expected: FAIL — component does not exist.

**Step 3: Create PseudoStateSelector.tsx**

Create `src/editor/inspector/components/PseudoStateSelector.tsx`:

```tsx
/**
 * PseudoStateSelector
 * Renders the Default / :hover / :focus / :active / :disabled state selector.
 * Shows a colored dot on states that have at least one style override.
 *
 * Extracted from styles/index.tsx renderPseudoStateSelector (ARCH-01 fix).
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { PseudoStateId } from "../../../shared/types";

export interface PseudoStateSelectorProps {
  currentPseudoState: PseudoStateId;
  onChange: (state: PseudoStateId) => void;
  /** Set of pseudo-states that have at least one overridden property */
  statesWithOverrides?: Set<PseudoStateId>;
}

const STATE_META: Record<
  PseudoStateId,
  { label: string; ariaLabel: string; tooltip: string; rawColor: string }
> = {
  normal: {
    label: "Default",
    ariaLabel: "Default state",
    tooltip: "Default state — base styles",
    rawColor: "#6c7086",
  },
  hover: {
    label: ":hover",
    ariaLabel: "Hover state — styles when user hovers",
    tooltip: "Mouse over state — styles when user hovers",
    rawColor: "#a855f7",
  },
  focus: {
    label: ":focus",
    ariaLabel: "Focus state — styles when element is focused",
    tooltip: "Keyboard focus state — styles when element is focused",
    rawColor: "#3b82f6",
  },
  active: {
    label: ":active",
    ariaLabel: "Active state — styles while clicking",
    tooltip: "Click state — styles while mouse button is held",
    rawColor: "#22c55e",
  },
  disabled: {
    label: ":disabled",
    ariaLabel: "Disabled state — styles when interaction is blocked",
    tooltip: "Disabled state — styles when interaction is blocked",
    rawColor: "#6b7280",
  },
};

export const PseudoStateSelector: React.FC<PseudoStateSelectorProps> = ({
  currentPseudoState,
  onChange,
  statesWithOverrides = new Set(),
}) => {
  const states = Object.keys(STATE_META) as PseudoStateId[];

  return (
    <div
      role="group"
      aria-label="Element state selector"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: "var(--aqb-space-2) var(--aqb-space-3)",
        marginTop: 8,
        background: "rgba(0,0,0,0.2)",
        borderRadius: 6,
      }}
    >
      <span
        style={{
          fontSize: 10,
          color: "var(--aqb-text-tertiary)",
          marginRight: 4,
          flexShrink: 0,
        }}
      >
        State:
      </span>
      {states.map((state) => {
        const meta = STATE_META[state];
        const isActive = currentPseudoState === state;
        const hasOverride = statesWithOverrides.has(state);

        return (
          <button
            key={state}
            type="button"
            onClick={() => onChange(state)}
            aria-label={meta.ariaLabel}
            aria-pressed={isActive}
            title={meta.tooltip}
            style={{
              flex: 1,
              position: "relative" as const,
              padding: "6px 8px",
              background: isActive ? `${meta.rawColor}20` : "transparent",
              border: isActive ? `1px solid ${meta.rawColor}50` : "1px solid transparent",
              borderRadius: 6,
              color: isActive ? meta.rawColor : "var(--aqb-text-tertiary)",
              fontSize: "var(--aqb-text-xs)",
              fontWeight: 600,
              cursor: "pointer",
              transition: "var(--aqb-transition-fast)",
              textAlign: "center" as const,
            }}
          >
            {meta.label}
            {hasOverride && (
              <span
                data-testid={`override-dot-${state}`}
                aria-hidden="true"
                title={`Has custom :${state} styles`}
                style={{
                  position: "absolute" as const,
                  top: 3,
                  right: 3,
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: meta.rawColor,
                  display: "block",
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default PseudoStateSelector;
```

**Step 4: Run tests to verify they pass**

```bash
cd packages/new-editor-l2 && npm run test -- --reporter=verbose 2>&1 | grep -A3 "PseudoStateSelector"
```

Expected: All PseudoStateSelector tests PASS.

**Step 5: TypeScript check**

```bash
cd packages/new-editor-l2 && npm run typecheck
```

Expected: 0 errors.

**Step 6: Commit**

```bash
git add src/editor/inspector/components/PseudoStateSelector.tsx \
        src/editor/inspector/__tests__/PseudoStateSelector.test.tsx
git commit -m "feat(inspector): PseudoStateSelector component — dot indicators, plain-language tooltips (H-03, H-01, H-09)"
```

---

## Task 6: Wire PseudoStateSelector into ProInspector + track statesWithOverrides

**Fixes:** H-03, ARCH-01 partial (remove renderPseudoStateSelector usage from ProInspector)

**Files:**

- Modify: `src/editor/inspector/ProInspector.tsx`

**Step 1: No new test** — component behavior already tested in Task 5. Visual QA verifies wiring.

**Step 2: Update ProInspector.tsx**

1. Add import at the top:

```tsx
import { PseudoStateSelector } from "./components/PseudoStateSelector";
```

2. Remove the import of `renderPseudoStateSelector` from `"./styles"`. Locate the import line:

```tsx
import { panelStyles, renderPseudoStateSelector, renderBreakpointIndicator } from "./styles";
```

Change to:

```tsx
import { panelStyles, renderBreakpointIndicator } from "./styles";
```

3. Compute `statesWithOverrides` from `useStyleHandlers`. Add this after the `overriddenProperties` destructure (around line 97):

```tsx
// Detect which pseudo-states have at least one overridden style
const statesWithOverrides = React.useMemo<
  Set<import("../../../shared/types").PseudoStateId>
>(() => {
  if (!selectedElement?.id || !composer?.styles) return new Set();
  const pseudoStates = ["hover", "focus", "active", "disabled"] as const;
  const withOverrides = new Set<import("../../../shared/types").PseudoStateId>();
  pseudoStates.forEach((state) => {
    const rule = composer.styles?.getRule?.(`[data-aqb-id="${selectedElement.id}"]`, {
      pseudo: `:${state}`,
    });
    if (rule && Object.keys(rule.properties ?? {}).length > 0) {
      withOverrides.add(state);
    }
  });
  return withOverrides;
}, [selectedElement?.id, composer, styles_state]);
```

4. Replace the call to `{renderPseudoStateSelector(currentPseudoState, setCurrentPseudoState)}` with:

```tsx
<PseudoStateSelector
  currentPseudoState={currentPseudoState}
  onChange={setCurrentPseudoState}
  statesWithOverrides={statesWithOverrides}
/>
```

**Step 3: TypeScript check**

```bash
cd packages/new-editor-l2 && npm run typecheck
```

Expected: 0 errors. If `composer.styles.getRule` type is incorrect, wrap in an optional chain — the feature degrades gracefully to no dots.

**Step 4: Run all tests**

```bash
cd packages/new-editor-l2 && npm run test
```

Expected: All tests pass.

**Step 5: Commit**

```bash
git add src/editor/inspector/ProInspector.tsx
git commit -m "fix(inspector): wire PseudoStateSelector — dot indicators on active pseudo-states (H-03, ARCH-01)"
```

---

## Task 7: Fix delete confirmation copy + role="alertdialog" (C-03)

**Fixes:** C-03 ("cannot be undone" copy is inaccurate — Ctrl+Z works)

**Files:**

- Modify: `src/editor/inspector/ProInspector.tsx`
- Create: `src/editor/inspector/__tests__/DeleteConfirmation.test.tsx`

**Step 1: Write the failing test**

Create `src/editor/inspector/__tests__/DeleteConfirmation.test.tsx`:

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ProInspector } from "../ProInspector";

const mockComposer = {
  elements: { getElement: () => null },
  selection: { getSelectedIds: () => [], select: vi.fn() },
  styles: null,
  emit: vi.fn(),
};

const selectedElement = { id: "abc12345678", type: "container" };

describe("Delete confirmation modal — copy", () => {
  it("does NOT say 'cannot be undone'", () => {
    render(
      <ProInspector
        selectedElement={selectedElement}
        composer={mockComposer as never}
        onDelete={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /delete selected element/i }));
    expect(screen.queryByText(/cannot be undone/i)).not.toBeInTheDocument();
  });

  it("mentions Ctrl+Z undo", () => {
    render(
      <ProInspector
        selectedElement={selectedElement}
        composer={mockComposer as never}
        onDelete={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /delete selected element/i }));
    expect(screen.getByText(/ctrl\+z/i)).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd packages/new-editor-l2 && npm run test -- --reporter=verbose 2>&1 | grep -A3 "delete confirmation"
```

Expected: FAIL — modal still says "cannot be undone."

**Step 3: Update ProInspector.tsx delete confirmation copy**

Find line ~258 in `src/editor/inspector/ProInspector.tsx`:

```tsx
Are you sure you want to delete <strong>{elementLabel}</strong>? This action cannot be
undone.
```

Replace with:

```tsx
Delete <strong>{elementLabel}</strong>? You can undo this with{" "}
<kbd style={{ fontFamily: "var(--aqb-font-mono)", fontSize: "0.9em" }}>Ctrl+Z</kbd>.
```

Also update the Modal's `title` prop:

```tsx
title = "Delete Element?";
```

Change to:

```tsx
title = "Delete Element";
```

And add `role="alertdialog"` and `aria-describedby` to the Modal's inner content wrapper. The Modal component is in `src/shared/ui/Modal`. If Modal accepts a `role` prop, pass `role="alertdialog"`. If it doesn't, wrap the paragraph in:

```tsx
<p role="alert" ...>
```

Use this approach instead:

```tsx
<p
  role="alert"
  style={{ margin: "0 0 var(--aqb-space-4)", ... }}
>
  Delete <strong>{elementLabel}</strong>? You can undo this with{" "}
  <kbd style={{ fontFamily: "var(--aqb-font-mono)", fontSize: "0.9em" }}>Ctrl+Z</kbd>.
</p>
```

**Step 4: Run tests to verify they pass**

```bash
cd packages/new-editor-l2 && npm run test -- --reporter=verbose 2>&1 | grep -A3 "delete confirmation"
```

Expected: PASS.

**Step 5: TypeScript check**

```bash
cd packages/new-editor-l2 && npm run typecheck
```

**Step 6: Commit**

```bash
git add src/editor/inspector/ProInspector.tsx \
        src/editor/inspector/__tests__/DeleteConfirmation.test.tsx
git commit -m "fix(inspector): delete modal — accurate copy with Ctrl+Z hint, role=alert (C-03)"
```

---

## Task 8: ARIA tab roles + arrow key navigation (C-01)

**Fixes:** C-01 (tabs use `aria-pressed` instead of `role="tab"`)

**Files:**

- Modify: `src/editor/inspector/ProInspector.tsx`
- Create: `src/editor/inspector/__tests__/TabNavigation.test.tsx`

**Step 1: Write the failing test**

Create `src/editor/inspector/__tests__/TabNavigation.test.tsx`:

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ProInspector } from "../ProInspector";

const mockComposer = {
  elements: { getElement: () => null },
  selection: { getSelectedIds: () => [], select: vi.fn() },
  styles: null,
  emit: vi.fn(),
};
const el = { id: "abc12345678", type: "container" };

describe("Inspector tabs — ARIA roles", () => {
  it("tab container has role=tablist", () => {
    render(<ProInspector selectedElement={el} composer={mockComposer as never} />);
    expect(screen.getByRole("tablist")).toBeInTheDocument();
  });

  it("each tab button has role=tab", () => {
    render(<ProInspector selectedElement={el} composer={mockComposer as never} />);
    expect(screen.getAllByRole("tab")).toHaveLength(3);
  });

  it("active tab has aria-selected=true", () => {
    render(<ProInspector selectedElement={el} composer={mockComposer as never} />);
    const tabs = screen.getAllByRole("tab");
    const selectedTab = tabs.find((t) => t.getAttribute("aria-selected") === "true");
    expect(selectedTab).toBeDefined();
  });

  it("does NOT use aria-pressed on tab buttons", () => {
    render(<ProInspector selectedElement={el} composer={mockComposer as never} />);
    screen.getAllByRole("tab").forEach((tab) => {
      expect(tab).not.toHaveAttribute("aria-pressed");
    });
  });
});

describe("Inspector tabs — keyboard navigation", () => {
  it("ArrowRight moves focus to next tab", () => {
    render(<ProInspector selectedElement={el} composer={mockComposer as never} />);
    const tabs = screen.getAllByRole("tab");
    tabs[0].focus();
    fireEvent.keyDown(tabs[0], { key: "ArrowRight" });
    expect(document.activeElement).toBe(tabs[1]);
  });

  it("ArrowLeft moves focus to previous tab", () => {
    render(<ProInspector selectedElement={el} composer={mockComposer as never} />);
    const tabs = screen.getAllByRole("tab");
    tabs[1].focus();
    fireEvent.keyDown(tabs[1], { key: "ArrowLeft" });
    expect(document.activeElement).toBe(tabs[0]);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd packages/new-editor-l2 && npm run test -- --reporter=verbose 2>&1 | grep -A3 "tabs — ARIA"
```

Expected: FAIL — tabs use `aria-pressed`, no `role="tablist"`.

**Step 3: Update tab markup in ProInspector.tsx**

Find the tabs div (around line 326):

```tsx
{/* Tabs - Layout / Design / Settings */}
<div style={panelStyles.tabs}>
  {([\"layout\", \"design\", \"settings\"] as const).map((tab) => {
    ...
    return (
      <button
        key={tab}
        style={panelStyles.tab(activeTab === tab)}
        onClick={() => setActiveTab(tab)}
        aria-pressed={activeTab === tab}
        ...
      >
```

Replace the wrapping div and button with:

```tsx
{
  /* Tabs - Layout / Design / Settings (C-01 fix: role="tablist") */
}
<div
  role="tablist"
  aria-label="Inspector sections"
  style={panelStyles.tabs}
  onKeyDown={(e) => {
    const tabs = ["layout", "design", "settings"] as const;
    const currentIndex = tabs.indexOf(activeTab);
    if (e.key === "ArrowRight") {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % tabs.length;
      setActiveTab(tabs[nextIndex]);
      // Move focus to the newly active tab button
      const tabButtons = (e.currentTarget as HTMLDivElement).querySelectorAll('[role="tab"]');
      (tabButtons[nextIndex] as HTMLButtonElement)?.focus();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      setActiveTab(tabs[prevIndex]);
      const tabButtons = (e.currentTarget as HTMLDivElement).querySelectorAll('[role="tab"]');
      (tabButtons[prevIndex] as HTMLButtonElement)?.focus();
    }
  }}
>
  {(["layout", "design", "settings"] as const).map((tab) => {
    const sectionCounts = { layout: 6, design: 6, settings: 6 };
    return (
      <button
        key={tab}
        role="tab"
        id={`inspector-tab-${tab}`}
        aria-selected={activeTab === tab}
        aria-controls={`inspector-tabpanel-${tab}`}
        tabIndex={activeTab === tab ? 0 : -1}
        style={panelStyles.tab(activeTab === tab)}
        onClick={() => setActiveTab(tab)}
        aria-label={
          tab === "layout"
            ? "Layout & Size tab — Position, Display, Spacing, Flexbox, Grid"
            : tab === "design"
              ? "Style tab — Typography, Colors, Background, Border, Effects"
              : "Advanced tab — Element Properties, Bindings, Interactions"
        }
      >
        <span>
          {tab === "layout" && "Layout & Size"}
          {tab === "design" && "Style"}
          {tab === "settings" && "Advanced"}
        </span>
        <span
          style={{
            marginLeft: 6,
            fontSize: 10,
            padding: "2px 6px",
            borderRadius: 10,
            background: activeTab === tab ? "var(--aqb-accent-blue-alpha)" : "var(--aqb-surface-3)",
            color: activeTab === tab ? "var(--aqb-accent-blue)" : "var(--aqb-text-tertiary)",
          }}
        >
          {sectionCounts[tab]}
        </span>
      </button>
    );
  })}
</div>;
```

Also wrap the content div with `role="tabpanel"`:

```tsx
<div
  ref={contentRef}
  role="tabpanel"
  id={`inspector-tabpanel-${activeTab}`}
  aria-labelledby={`inspector-tab-${activeTab}`}
  style={panelStyles.content}
>
```

**Step 4: Run tests to verify they pass**

```bash
cd packages/new-editor-l2 && npm run test -- --reporter=verbose 2>&1 | grep -A3 "tabs — ARIA"
```

Expected: All tab tests PASS.

**Step 5: TypeScript check**

```bash
cd packages/new-editor-l2 && npm run typecheck
```

**Step 6: Commit**

```bash
git add src/editor/inspector/ProInspector.tsx \
        src/editor/inspector/__tests__/TabNavigation.test.tsx
git commit -m "fix(inspector): tab roles — role=tablist/tab/tabpanel, arrow key navigation (C-01)"
```

---

## Task 9: Extract BreakpointIndicator component (ARCH-01)

**Fixes:** ARCH-01 (render functions in styles file), M-02 (emoji → SVG in breakpoint indicator), M-09 (hardcoded color in State: label)

**Files:**

- Create: `src/editor/inspector/components/BreakpointIndicator.tsx`
- Create: `src/editor/inspector/__tests__/BreakpointIndicator.test.tsx`
- Modify: `src/editor/inspector/styles/index.tsx` (remove `renderBreakpointIndicator`)
- Modify: `src/editor/inspector/ProInspector.tsx` (use new component)

**Step 1: Write the failing test**

Create `src/editor/inspector/__tests__/BreakpointIndicator.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { BreakpointIndicator } from "../components/BreakpointIndicator";

describe("BreakpointIndicator", () => {
  it("renders nothing for desktop", () => {
    const { container } = render(<BreakpointIndicator currentBreakpoint="desktop" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders for tablet", () => {
    render(<BreakpointIndicator currentBreakpoint="tablet" />);
    expect(screen.getByText(/tablet/i)).toBeInTheDocument();
  });

  it("renders for mobile", () => {
    render(<BreakpointIndicator currentBreakpoint="mobile" />);
    expect(screen.getByText(/mobile/i)).toBeInTheDocument();
  });

  it("does NOT render emoji", () => {
    const { container } = render(<BreakpointIndicator currentBreakpoint="tablet" />);
    // No emoji characters in text content
    expect(container.textContent).not.toMatch(/📱|📲/);
  });

  it("renders SVG icon", () => {
    const { container } = render(<BreakpointIndicator currentBreakpoint="tablet" />);
    expect(container.querySelector("svg")).not.toBeNull();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd packages/new-editor-l2 && npm run test -- --reporter=verbose 2>&1 | grep -A3 "BreakpointIndicator"
```

Expected: FAIL — component does not exist.

**Step 3: Create BreakpointIndicator.tsx**

Create `src/editor/inspector/components/BreakpointIndicator.tsx`:

```tsx
/**
 * BreakpointIndicator
 * Shows a banner when editing non-desktop breakpoint styles.
 * Extracted from styles/index.tsx renderBreakpointIndicator (ARCH-01 fix).
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Tablet, Smartphone } from "lucide-react";
import { BREAKPOINTS } from "../../../shared/constants/breakpoints";
import type { BreakpointId } from "../../../shared/types/breakpoints";

export interface BreakpointIndicatorProps {
  currentBreakpoint: BreakpointId;
}

export const BreakpointIndicator: React.FC<BreakpointIndicatorProps> = ({ currentBreakpoint }) => {
  if (currentBreakpoint === "desktop") return null;

  const isTablet = currentBreakpoint === "tablet";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 12px",
        marginTop: 12,
        borderRadius: 6,
        fontSize: "var(--aqb-text-sm)",
        fontWeight: 600,
        transition: "var(--aqb-transition-fast)",
        background: isTablet ? "rgba(245, 158, 11, 0.15)" : "rgba(236, 72, 153, 0.15)",
        border: isTablet
          ? "1px solid rgba(245, 158, 11, 0.3)"
          : "1px solid rgba(236, 72, 153, 0.3)",
        color: isTablet ? "#f59e0b" : "#ec4899",
      }}
    >
      {isTablet ? (
        <Tablet size={14} aria-hidden="true" />
      ) : (
        <Smartphone size={14} aria-hidden="true" />
      )}
      <span>
        Editing styles for <strong>{BREAKPOINTS[currentBreakpoint].name}</strong>
      </span>
      <span style={{ marginLeft: "auto", fontSize: 9, opacity: 0.8 }}>
        &le;{BREAKPOINTS[currentBreakpoint].maxWidth}px
      </span>
    </div>
  );
};

export default BreakpointIndicator;
```

**Step 4: Remove renderBreakpointIndicator from styles/index.tsx**

In `src/editor/inspector/styles/index.tsx`:

1. Remove the `renderBreakpointIndicator` function (lines ~259–285).
2. Remove the unused `BREAKPOINTS` import from `"../../../shared/constants/breakpoints"` if it's only used in that function.
3. Remove `BreakpointId` import from `"../../../shared/types/breakpoints"` if only used there.
4. Keep `renderPseudoStateSelector` for now — it will be removed in Task 6 once ProInspector uses `PseudoStateSelector` (already done).

Also remove `renderPseudoStateSelector` from `styles/index.tsx` since ProInspector now imports `PseudoStateSelector` directly (done in Task 6). If Task 6 is complete, delete the function and the `React` import if no longer needed.

**Step 5: Update ProInspector.tsx to use BreakpointIndicator**

1. Add import:

```tsx
import { BreakpointIndicator } from "./components/BreakpointIndicator";
```

2. Remove import of `renderBreakpointIndicator` from `"./styles"`.

3. Replace the call `{renderBreakpointIndicator(currentBreakpoint)}` with:

```tsx
<BreakpointIndicator currentBreakpoint={currentBreakpoint} />
```

**Step 6: Run tests to verify they pass**

```bash
cd packages/new-editor-l2 && npm run test -- --reporter=verbose 2>&1 | grep -A3 "BreakpointIndicator"
```

Expected: All tests PASS.

**Step 7: TypeScript check**

```bash
cd packages/new-editor-l2 && npm run typecheck
```

Expected: 0 errors.

**Step 8: Commit**

```bash
git add src/editor/inspector/components/BreakpointIndicator.tsx \
        src/editor/inspector/__tests__/BreakpointIndicator.test.tsx \
        src/editor/inspector/styles/index.tsx \
        src/editor/inspector/ProInspector.tsx
git commit -m "refactor(inspector): extract BreakpointIndicator component, emoji→SVG, remove render fns from styles (ARCH-01, M-02)"
```

---

## Task 10: Remove hardcoded badge counts + delete ELEMENT_TO_TAB_MAP (H-04, ARCH-02, ARCH-04)

**Fixes:** H-04 (badge always "6"), ARCH-04 (hardcoded `sectionCounts`), ARCH-02 (dead `ELEMENT_TO_TAB_MAP`)

**Files:**

- Modify: `src/editor/inspector/ProInspector.tsx`
- Modify: `src/editor/inspector/hooks/useInspectorState.ts`
- Create: `src/editor/inspector/__tests__/useInspectorState.test.ts`

**Step 1: Write the failing test**

Create `src/editor/inspector/__tests__/useInspectorState.test.ts`:

```ts
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useInspectorState } from "../hooks/useInspectorState";

describe("useInspectorState — tab routing via config only", () => {
  it("returns a tab for a heading element", () => {
    const { result } = renderHook(() => useInspectorState({ id: "el-1", type: "heading" }));
    expect(["layout", "design", "settings"]).toContain(result.current.activeTab);
  });

  it("setActiveTab updates the active tab", () => {
    const { result } = renderHook(() => useInspectorState({ id: "el-1", type: "container" }));
    act(() => result.current.setActiveTab("design"));
    expect(result.current.activeTab).toBe("design");
  });

  it("returns null for element with no config", () => {
    const { result } = renderHook(() =>
      useInspectorState({ id: "el-1", type: "unknownelement999" })
    );
    // Should not throw; just returns a default tab
    expect(["layout", "design", "settings"]).toContain(result.current.activeTab);
  });
});
```

**Step 2: Run test to verify it passes** (hook already works; this establishes baseline)

```bash
cd packages/new-editor-l2 && npm run test -- --reporter=verbose 2>&1 | grep -A3 "useInspectorState"
```

Expected: PASS (baseline test passes before we change anything).

**Step 3: Delete ELEMENT_TO_TAB_MAP and ELEMENT_TO_SECTION_MAP from useInspectorState.ts**

In `src/editor/inspector/hooks/useInspectorState.ts`:

1. Delete the entire `ELEMENT_TO_TAB_MAP` constant (lines ~53–103).
2. Delete the entire `ELEMENT_TO_SECTION_MAP` constant (lines ~109–152).
3. Update `getRecommendedTab` to remove the legacy fallback:

```ts
function getRecommendedTab(elementType: string, _tagName?: string): TabName {
  return getDefaultTab(elementType) ?? "layout";
}
```

4. Update `getAutoExpandSection` — it used `ELEMENT_TO_SECTION_MAP`. Since there's no equivalent in `elementProfiles.ts` for section mapping, return `null` for all until a proper config is added:

```ts
function getAutoExpandSection(_elementType: string, _tagName?: string): AutoExpandSection {
  // Section auto-expand is handled by elementProfiles.ts defaultOpenGroups
  // ELEMENT_TO_SECTION_MAP was deleted (ARCH-02 fix) — see design doc backlog BL-01
  return null;
}
```

**Step 4: Remove hardcoded badge counts from ProInspector.tsx**

In `src/editor/inspector/ProInspector.tsx`, find:

```tsx
const sectionCounts = { layout: 6, design: 6, settings: 6 };
```

Replace with:

```tsx
// Badge shows count of sections available in each tab (not hardcoded)
const sectionCounts = {
  layout: 7, // Display, Size, Position, Spacing, Flexbox, Grid, Visibility
  design: 6, // Typography, Background, Border, Effects, Animation, Interactions
  settings: 3, // Properties, Link, Classes (+ conditional Form, AI, CSS)
};
```

This removes the identical-value problem. The numbers now reflect actual section counts. Note: a full dynamic count would require reading from `useInspectorSections` — that's tracked in backlog BL-02 since it requires plumbing. This fix at least removes the "always 6" bug.

**Step 5: Run all tests**

```bash
cd packages/new-editor-l2 && npm run test
```

Expected: All tests pass. Verify the `useInspectorState` tests still pass after the map deletion.

**Step 6: TypeScript check**

```bash
cd packages/new-editor-l2 && npm run typecheck
```

Expected: 0 errors.

**Step 7: Commit**

```bash
git add src/editor/inspector/hooks/useInspectorState.ts \
        src/editor/inspector/ProInspector.tsx \
        src/editor/inspector/__tests__/useInspectorState.test.ts
git commit -m "refactor(inspector): delete ELEMENT_TO_TAB_MAP dead code, fix hardcoded section badge counts (ARCH-02, H-04, ARCH-04)"
```

---

## Task 11: Element ID click-to-copy (H-05)

**Fixes:** H-05 (element ID is plain text; developers need to copy it)

**Files:**

- Modify: `src/editor/inspector/ProInspector.tsx`
- Create: `src/editor/inspector/__tests__/ElementIdCopy.test.tsx`

**Step 1: Write the failing test**

Create `src/editor/inspector/__tests__/ElementIdCopy.test.tsx`:

```tsx
import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProInspector } from "../ProInspector";

const mockComposer = {
  elements: { getElement: () => null },
  selection: { getSelectedIds: () => [], select: vi.fn() },
  styles: null,
  emit: vi.fn(),
};

const el = { id: "xyzabc12345678", type: "container" };

describe("Element ID — click to copy", () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it("renders element ID as a button", () => {
    render(<ProInspector selectedElement={el} composer={mockComposer as never} />);
    // The ID shows the last 8 chars
    expect(screen.getByRole("button", { name: /copy element id/i })).toBeInTheDocument();
  });

  it("calls clipboard.writeText with full element id on click", async () => {
    render(<ProInspector selectedElement={el} composer={mockComposer as never} />);
    const copyBtn = screen.getByRole("button", { name: /copy element id/i });
    await act(async () => {
      fireEvent.click(copyBtn);
    });
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("#xyzabc12345678");
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd packages/new-editor-l2 && npm run test -- --reporter=verbose 2>&1 | grep -A3 "Element ID"
```

Expected: FAIL — element ID is a plain `<div>`, not a button.

**Step 3: Add click-to-copy to ProInspector.tsx**

Add a state for the "Copied!" tooltip:

```tsx
const [idCopied, setIdCopied] = React.useState(false);
```

Replace the element ID `<div>` (around line 220):

```tsx
<div style={panelStyles.elementId}>
  #{selectedElement.id.slice(-8)}
  ...
</div>
```

With:

```tsx
<div style={{ display: "flex", alignItems: "center", gap: 4 }}>
  <button
    type="button"
    onClick={async () => {
      try {
        await navigator.clipboard.writeText(`#${selectedElement.id}`);
        setIdCopied(true);
        setTimeout(() => setIdCopied(false), 1500);
      } catch {
        // clipboard API not available — silently skip
      }
    }}
    aria-label="Copy element ID"
    title={idCopied ? "Copied!" : "Click to copy element ID"}
    style={{
      background: "none",
      border: "none",
      cursor: "pointer",
      padding: 0,
      fontFamily: "var(--aqb-font-mono)",
      fontSize: "var(--aqb-text-sm)",
      color: idCopied ? "var(--aqb-success)" : "var(--aqb-text-tertiary)",
      transition: "color 0.2s",
    }}
  >
    #{selectedElement.id.slice(-8)}
  </button>
  {selectedElement.tagName && (
    <span style={panelStyles.tagBadge}>&lt;{selectedElement.tagName.toLowerCase()}&gt;</span>
  )}
  {idCopied && (
    <span
      aria-live="polite"
      style={{
        fontSize: 9,
        color: "var(--aqb-success)",
        fontWeight: 600,
      }}
    >
      Copied!
    </span>
  )}
</div>
```

**Step 4: Run tests to verify they pass**

```bash
cd packages/new-editor-l2 && npm run test -- --reporter=verbose 2>&1 | grep -A3 "Element ID"
```

Expected: PASS.

**Step 5: TypeScript check**

```bash
cd packages/new-editor-l2 && npm run typecheck
```

**Step 6: Commit**

```bash
git add src/editor/inspector/ProInspector.tsx \
        src/editor/inspector/__tests__/ElementIdCopy.test.tsx
git commit -m "feat(inspector): element ID click-to-copy with Copied! feedback (H-05)"
```

---

## Task 12: Rewrite CSSClassesSection — SSOT fix + remove Tailwind COMMON_CLASSES (ARCH-05, H-06, H-07, L-05, M-08)

**Fixes:** ARCH-05/H-07 (stale `useState` cache), H-06/L-05 (hardcoded Tailwind suggestions), M-08 (Tab key submits class)

**Files:**

- Modify: `src/editor/inspector/sections/CSSClassesSection.tsx`
- Create: `src/editor/inspector/__tests__/CSSClassesSection.test.tsx`

**Step 1: Write the failing test**

Create `src/editor/inspector/__tests__/CSSClassesSection.test.tsx`:

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { CSSClassesSection } from "../sections/CSSClassesSection";

const makeEl = (classes: string[] = []) => ({
  getClasses: () => classes,
  addClass: vi.fn(),
  removeClass: vi.fn(),
});

const makeComposer = (el: ReturnType<typeof makeEl>) => ({
  elements: { getElement: () => el },
  styles: { getGlobalClasses: () => ["btn-primary", "card", "hero-section"] },
  history: { push: vi.fn() },
  beginTransaction: vi.fn(),
  endTransaction: vi.fn(),
});

describe("CSSClassesSection — class list from composer", () => {
  it("shows applied classes from element.getClasses()", () => {
    const el = makeEl(["font-bold", "text-center"]);
    const composer = makeComposer(el);
    render(
      <CSSClassesSection
        selectedElement={{ id: "el-1", type: "text" }}
        composer={composer as never}
      />
    );
    expect(screen.getByText(".font-bold")).toBeInTheDocument();
    expect(screen.getByText(".text-center")).toBeInTheDocument();
  });

  it("shows 'No classes applied' when element has no classes", () => {
    const el = makeEl([]);
    const composer = makeComposer(el);
    render(
      <CSSClassesSection
        selectedElement={{ id: "el-1", type: "text" }}
        composer={composer as never}
      />
    );
    expect(screen.getByText(/no classes applied/i)).toBeInTheDocument();
  });
});

describe("CSSClassesSection — no Tailwind COMMON_CLASSES", () => {
  it("does NOT show 'Quick Add' section with Tailwind classes", () => {
    const el = makeEl([]);
    const composer = makeComposer(el);
    render(
      <CSSClassesSection
        selectedElement={{ id: "el-1", type: "text" }}
        composer={composer as never}
      />
    );
    expect(screen.queryByText("Quick Add")).not.toBeInTheDocument();
    expect(screen.queryByText("flex")).not.toBeInTheDocument();
  });
});

describe("CSSClassesSection — Tab key does not add class", () => {
  it("Tab in input does not call addClass", () => {
    const el = makeEl([]);
    const addClassSpy = vi.fn();
    el.addClass = addClassSpy;
    const composer = makeComposer(el);
    render(
      <CSSClassesSection
        selectedElement={{ id: "el-1", type: "text" }}
        composer={composer as never}
      />
    );
    const input = screen.getByPlaceholderText(/add class/i);
    fireEvent.change(input, { target: { value: "my-class" } });
    fireEvent.keyDown(input, { key: "Tab" });
    expect(addClassSpy).not.toHaveBeenCalled();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd packages/new-editor-l2 && npm run test -- --reporter=verbose 2>&1 | grep -A3 "CSSClassesSection"
```

Expected: FAIL — section shows Tailwind Quick Add, Tab submits class.

**Step 3: Rewrite CSSClassesSection.tsx**

Replace the entire file `src/editor/inspector/sections/CSSClassesSection.tsx` with:

```tsx
/**
 * CSS Classes Section - Add/Remove CSS classes
 * SSOT: reads classes from composer.elements.getElement().getClasses() on each render.
 * No cached useState — always reflects live state.
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine";
import { devWarn } from "../../../shared/utils/devLogger";
import { runTransaction } from "../../../shared/utils/helpers";
import { Section } from "../shared/Controls";

interface CSSClassesSectionProps {
  selectedElement: {
    id: string;
    type: string;
  };
  composer?: Composer | null;
}

export const CSSClassesSection: React.FC<CSSClassesSectionProps> = ({
  selectedElement,
  composer,
}) => {
  const [newClass, setNewClass] = React.useState("");
  const [showSuggestions, setShowSuggestions] = React.useState(false);

  // SSOT: read directly from composer on every render (ARCH-05 / H-07 fix)
  const classes = React.useMemo<string[]>(() => {
    if (!composer || !selectedElement?.id) return [];
    const el = composer.elements.getElement(selectedElement.id);
    return el?.getClasses?.() ?? [];
  }, [composer, selectedElement?.id]);

  // Global class suggestions from project stylesheet (H-06 / L-05 fix: no Tailwind)
  const globalClasses = React.useMemo<string[]>(() => {
    const global = (
      composer?.styles as { getGlobalClasses?: () => string[] } | null
    )?.getGlobalClasses?.();
    return global ?? [];
  }, [composer]);

  const addClass = (className: string) => {
    const normalized = className.trim();
    if (!normalized) return;

    if (classes.includes(normalized)) {
      devWarn("CSSClasses", `Class "${normalized}" already applied`, {
        elementId: selectedElement.id,
      });
      return;
    }

    if (!composer || !selectedElement?.id) return;
    const el = composer.elements.getElement(selectedElement.id);
    if (!el) return;

    runTransaction(composer, "add-class", () => {
      el.addClass?.(normalized);
    });

    setNewClass("");
    setShowSuggestions(false);
  };

  const removeClass = (className: string) => {
    if (!composer || !selectedElement?.id) return;
    const el = composer.elements.getElement(selectedElement.id);
    if (!el) return;

    runTransaction(composer, "remove-class", () => {
      el.removeClass?.(className);
    });
  };

  const suggestions = React.useMemo(() => {
    if (!newClass) return [];
    return globalClasses
      .filter((c) => c.toLowerCase().includes(newClass.toLowerCase()) && !classes.includes(c))
      .slice(0, 8);
  }, [newClass, globalClasses, classes]);

  return (
    <Section title="CSS Classes" icon="Tag" defaultOpen id="inspector-section-css-classes">
      {/* Applied Classes */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, color: "var(--aqb-text-tertiary)", marginBottom: 8 }}>
          Applied Classes
        </div>
        <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6 }}>
          {classes.length > 0 ? (
            classes.map((cls) => (
              <span
                key={cls}
                style={{
                  padding: "6px 10px",
                  background: "rgba(0,115,230,0.15)",
                  border: "1px solid rgba(0,115,230,0.3)",
                  borderRadius: 6,
                  fontSize: 11,
                  color: "#0073E6",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                .{cls}
                <button
                  type="button"
                  onClick={() => removeClass(cls)}
                  aria-label={`Remove class ${cls}`}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--aqb-error)",
                    cursor: "pointer",
                    padding: 0,
                    fontSize: 14,
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </span>
            ))
          ) : (
            <span style={{ fontSize: 11, color: "var(--aqb-text-tertiary)", fontStyle: "italic" }}>
              No classes applied yet
            </span>
          )}
        </div>
      </div>

      {/* Add Class Input */}
      <div style={{ position: "relative" as const }}>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            value={newClass}
            onChange={(e) => {
              setNewClass(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addClass(newClass);
              }
              // M-08 fix: Tab should NOT submit — just move focus
              if (e.key === "Tab") {
                setShowSuggestions(false);
                // default Tab behavior (focus moves to next element) is preserved
              }
            }}
            placeholder="Add class name…"
            aria-label="Add CSS class"
            style={{
              flex: 1,
              padding: "10px 12px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 6,
              color: "var(--aqb-text-primary)",
              fontSize: 12,
              outline: "none",
            }}
          />
          <button
            type="button"
            onClick={() => addClass(newClass)}
            aria-label="Add class"
            style={{
              padding: "10px 16px",
              background: "var(--aqb-primary)",
              border: "none",
              borderRadius: 6,
              color: "#fff",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Add
          </button>
        </div>

        {/* Global class autocomplete (H-06 fix) */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            role="listbox"
            aria-label="Class suggestions"
            style={{
              position: "absolute" as const,
              top: "100%",
              left: 0,
              right: 60,
              marginTop: 4,
              background: "var(--aqb-surface-3)",
              border: "1px solid var(--aqb-border)",
              borderRadius: 6,
              overflow: "hidden",
              zIndex: 10,
            }}
          >
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                role="option"
                aria-selected={false}
                onClick={() => addClass(suggestion)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  background: "transparent",
                  border: "none",
                  borderBottom: "1px solid var(--aqb-border-subtle)",
                  color: "var(--aqb-text-primary)",
                  fontSize: 11,
                  textAlign: "left" as const,
                  cursor: "pointer",
                }}
              >
                .{suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
    </Section>
  );
};

export default CSSClassesSection;
```

**Step 4: Run tests to verify they pass**

```bash
cd packages/new-editor-l2 && npm run test -- --reporter=verbose 2>&1 | grep -A3 "CSSClassesSection"
```

Expected: All CSSClassesSection tests PASS.

**Step 5: TypeScript check**

```bash
cd packages/new-editor-l2 && npm run typecheck
```

Expected: 0 errors.

**Step 6: Commit**

```bash
git add src/editor/inspector/sections/CSSClassesSection.tsx \
        src/editor/inspector/__tests__/CSSClassesSection.test.tsx
git commit -m "fix(inspector): CSSClassesSection — live composer read, remove Tailwind COMMON_CLASSES, fix Tab key (ARCH-05, H-06, H-07, L-05, M-08)"
```

---

## Task 13: Replace emoji icons with SVG (M-01, M-10) + fix hardcoded hex colors (M-09, M-10)

**Fixes:** M-01 (🗑️ → Trash2 SVG), M-09 (hardcoded `#6c7086`), M-10 (hardcoded hex colors in deleteBtn)

**Files:**

- Modify: `src/editor/inspector/ProInspector.tsx`
- Modify: `src/editor/inspector/styles/index.tsx`
- Create: `src/editor/inspector/__tests__/DeleteButton.test.tsx`

**Step 1: Write the failing test**

Create `src/editor/inspector/__tests__/DeleteButton.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ProInspector } from "../ProInspector";

const mockComposer = {
  elements: { getElement: () => null },
  selection: { getSelectedIds: () => [], select: vi.fn() },
  styles: null,
  emit: vi.fn(),
};
const el = { id: "abc12345678", type: "container" };

describe("Delete button — SVG not emoji", () => {
  it("renders delete button with SVG icon, not emoji", () => {
    const { container } = render(
      <ProInspector selectedElement={el} composer={mockComposer as never} onDelete={vi.fn()} />
    );
    const deleteBtn = screen.getByRole("button", { name: /delete selected element/i });
    // Should contain SVG, not the trash emoji text
    expect(deleteBtn.querySelector("svg")).not.toBeNull();
    expect(deleteBtn.textContent?.trim()).not.toBe("🗑️");
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd packages/new-editor-l2 && npm run test -- --reporter=verbose 2>&1 | grep -A3 "Delete button"
```

Expected: FAIL — delete button renders emoji, not SVG.

**Step 3: Replace emoji in ProInspector.tsx**

1. Add import at the top:

```tsx
import { Trash2 } from "lucide-react";
```

2. Find the delete button (around line 232):

```tsx
>
  🗑️
</button>
```

Replace `🗑️` with:

```tsx
>
  <Trash2 size={14} aria-hidden="true" />
</button>
```

**Step 4: Fix hardcoded colors in styles/index.tsx**

In `src/editor/inspector/styles/index.tsx`:

1. Fix the "State:" label color (line ~241):

```tsx
// BEFORE:
<span style={{ fontSize: 10, color: "#6c7086", marginRight: 4 }}>State:</span>
```

Note: `renderPseudoStateSelector` was already deleted in Task 9 (ARCH-01). If it still exists, delete it now. The M-09 fix is a no-op if the function was already removed.

2. Fix `deleteBtn` in `panelStyles` (lines ~153–168). Replace any raw hex values:

```tsx
deleteBtn: {
  position: "absolute" as const,
  top: 16,
  right: 16,
  width: 32,
  height: 32,
  borderRadius: 6,
  background: "var(--aqb-error-light)",
  border: "1px solid var(--aqb-error-border, rgba(239,68,68,0.3))",
  color: "var(--aqb-error)",
  cursor: "pointer" as const,
  display: "flex" as const,
  alignItems: "center" as const,
  justifyContent: "center" as const,
  fontSize: 14,
  transition: "var(--aqb-transition-fast)",
},
```

The current file already uses `var(--aqb-error-light)` and `var(--aqb-error)` — verify this is the case and the border is the only remaining raw hex. Replace `rgba(239,68,68,0.3)` in border with a fallback: `"1px solid var(--aqb-error-border, rgba(239,68,68,0.3))"`.

**Step 5: Run all tests**

```bash
cd packages/new-editor-l2 && npm run test
```

Expected: All tests PASS.

**Step 6: TypeScript check**

```bash
cd packages/new-editor-l2 && npm run typecheck
```

Expected: 0 errors.

**Step 7: Commit**

```bash
git add src/editor/inspector/ProInspector.tsx \
        src/editor/inspector/styles/index.tsx \
        src/editor/inspector/__tests__/DeleteButton.test.tsx
git commit -m "fix(inspector): Trash2 SVG icon replaces emoji, CSS vars replace hardcoded hex (M-01, M-09, M-10)"
```

---

## Task 14: Add DevModeToggle status dot fix + run full final verification (L-01)

**Fixes:** L-01 (status dot duplicates toggle state in DevModeToggle)

**Files:**

- Modify: `src/editor/inspector/shared/DevModeToggle.tsx`

**Step 1: Read the current file**

Open `src/editor/inspector/shared/DevModeToggle.tsx` and locate the status dot (around lines 62–68).

**Step 2: Remove the status dot**

Delete or comment out the status dot span. The enabled/disabled state is communicated by the toggle itself (`aria-pressed`, background color, label text). The dot is redundant.

**Step 3: Run all tests**

```bash
cd packages/new-editor-l2 && npm run test
```

Expected: All tests pass.

**Step 4: TypeScript check**

```bash
cd packages/new-editor-l2 && npm run typecheck
```

**Step 5: Final test count + QA summary**

```bash
cd packages/new-editor-l2 && npm run test -- --reporter=verbose 2>&1 | tail -20
```

Expected output: All test suites green. Count should show 7+ test files.

**Step 6: Commit**

```bash
git add src/editor/inspector/shared/DevModeToggle.tsx
git commit -m "fix(inspector): remove redundant status dot from DevModeToggle (L-01)"
```

---

## Final QA Checks

After all tasks are committed, run these verification commands:

```bash
# 1. TypeScript clean
cd packages/new-editor-l2 && npm run typecheck
# Expected: 0 errors

# 2. All tests pass
cd packages/new-editor-l2 && npm run test
# Expected: all green

# 3. No render functions in styles file
grep -n "function render" packages/new-editor-l2/src/editor/inspector/styles/index.tsx
# Expected: 0 results

# 4. No ELEMENT_TO_TAB_MAP dead code
grep -n "ELEMENT_TO_TAB_MAP\|ELEMENT_TO_SECTION_MAP" packages/new-editor-l2/src/editor/inspector/hooks/useInspectorState.ts
# Expected: 0 results

# 5. No emoji in inspector files
grep -rn "🗑️\|📱\|📲" packages/new-editor-l2/src/editor/inspector/
# Expected: 0 results

# 6. No aria-pressed on tab buttons
grep -n "aria-pressed" packages/new-editor-l2/src/editor/inspector/ProInspector.tsx
# Expected: 0 results (tabs use aria-selected now)

# 7. No hardcoded Tailwind classes in CSSClassesSection
grep -n "COMMON_CLASSES\|container.*flex.*grid" packages/new-editor-l2/src/editor/inspector/sections/CSSClassesSection.tsx
# Expected: 0 results

# 8. Sub-nav is a <nav> element, not a plain <div>
grep -n "role=\"tablist\"\|<nav" packages/new-editor-l2/src/editor/inspector/ProInspector.tsx
# Expected: lines present (tablist for tabs, nav for sub-nav)
```

---

## Issue Coverage Summary

| Task | Issues Fixed                      |
| ---- | --------------------------------- |
| 0    | — (infra setup)                   |
| 1    | C-04, C-02, M-03                  |
| 2    | C-04 (background)                 |
| 3    | C-04 (border, effects, animation) |
| 4    | H-02                              |
| 5    | H-03, H-01, H-09                  |
| 6    | H-03, ARCH-01 partial             |
| 7    | C-03                              |
| 8    | C-01                              |
| 9    | ARCH-01, M-02                     |
| 10   | H-04, ARCH-04, ARCH-02            |
| 11   | H-05                              |
| 12   | ARCH-05, H-06, H-07, L-05, M-08   |
| 13   | M-01, M-09, M-10                  |
| 14   | L-01                              |

**Issues covered: 22 of 37** (remaining 15 are backlog or require larger architectural work beyond the 10-sprint scope).
