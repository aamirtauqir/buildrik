# DS Prototype Parity Arc Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close 9 visual + UX gaps between live DS implementation and `ds-components-prototype-20260507` wireframes.

**Architecture:** Revert DS surface from fullpage route to 320px sidebar panel; add Design rail icon; mount existing `ColorModeToggle`; add 3 new engine APIs (`tokenUsage`, `lintState`, `styleBindings.resolveForElements`); ship 5 UI surfaces (usage chips, beginner hint, inline lint row, dark-missing chip, Pro-gated detach confirm) + extend `CreateComponentModal` w/ Group + Pre-fill bindings + canvas right-click trigger.

**Tech Stack:** React 18 + TypeScript + Vitest + Composer engine (`engine/Composer.ts`) + Emotion + canonical CSS at `themes/components/`.

**Spec:** `docs/superpowers/specs/2026-05-15-ds-prototype-parity-arc-design.md`

---

## Pre-flight findings (2026-05-15 grep)

| Required | Status | Location |
|----------|--------|----------|
| `composer.colorMode.get()` / `set()` | EXISTS | `engine/colorMode/ColorMode.ts:54-58` |
| `darkValue` on color tokens | EXISTS | `engine/darkResolver/DarkResolver.ts:23` |
| `tokens:dark-missing` event | EXISTS | `engine/darkResolver/DarkResolver.ts:9` |
| `useCanvasContextMenu` hook | EXISTS | `editor/canvas/hooks/useCanvasContextMenu.ts` |
| `ColorModeToggle.tsx` component | EXISTS | `editor/design-system/ui/ColorModeToggle.tsx` |
| `DSModeToggle.tsx` component | EXISTS | `editor/design-system/ui/DSModeToggle.tsx` |
| `DesignSystemTab.tsx` header mount | EXISTS | line 457 |
| `getTokenUsage()` / usage count tracker | MISSING | scope into Task 1 |
| `lintSuppressions` state | MISSING | scope into Task 2 |
| `resolveBindings(elementIds)` | MISSING | scope into Task 3 |

## Task list overview

| # | Task | LOC | Deps |
|---|------|-----|------|
| 1 | Engine: TokenUsageTracker | ~150 | none |
| 2 | Engine: LintState | ~120 | none |
| 3 | Engine: styleBindings.resolveForElements | ~100 | none |
| 4 | Layout revert: panel mode | ~250 | none |
| 5 | Design rail icon | ~40 | 4 |
| 6 | ColorModeToggle in DS header | ~10 | 4 |
| 7 | Usage chips on token rows | ~80 | 1, 4 |
| 8 | Beginner mode hint chip | ~25 | 4 |
| 9 | Dark-missing variant chip | ~50 | 4 |
| 10 | Inline lint row (s09-A) | ~180 | 2, 4 |
| 11 | CreateComponentModal extension | ~100 | 3 |
| 12 | Canvas right-click "Save as component" | ~70 | 11 |
| 13 | DetachConfirmModal + Pro gate | ~120 | 4 |

**Total:** ~1295 LOC across 13 tasks, ~6-8 PRs.

---

### Task 1: Engine — TokenUsageTracker

**Files:**
- Create: `src/engine/designSystem/TokenUsageTracker.ts`
- Create: `src/engine/designSystem/__tests__/TokenUsageTracker.test.ts`
- Modify: `src/engine/Composer.ts` (mount on `designSystem` namespace)

**Purpose:** Count how many element style bindings reference each token. Output drives chip on `TokenKindCard` rows + delete-token blast-radius confirm.

**Algorithm:** Walk all elements, inspect each style prop; if value matches `{{token.X.Y}}` pattern, increment counter for `X.Y`. Recompute on element change.

- [ ] **Step 1: Write the failing test**

```typescript
// src/engine/designSystem/__tests__/TokenUsageTracker.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { TokenUsageTracker } from "../TokenUsageTracker";
import type { ElementsSnapshot } from "@/engine/elements/types";

describe("TokenUsageTracker", () => {
  let tracker: TokenUsageTracker;

  beforeEach(() => {
    tracker = new TokenUsageTracker();
  });

  it("returns 0 for unused token", () => {
    tracker.recompute([]);
    expect(tracker.getUsage("color.brand.primary")).toBe(0);
  });

  it("counts single binding", () => {
    const snapshot: ElementsSnapshot = [{
      id: "el-1", type: "button",
      styles: { color: "{{token.color.brand.primary}}" }
    }] as ElementsSnapshot;
    tracker.recompute(snapshot);
    expect(tracker.getUsage("color.brand.primary")).toBe(1);
  });

  it("counts multiple bindings across elements", () => {
    const snapshot: ElementsSnapshot = [
      { id: "el-1", type: "button", styles: { color: "{{token.color.brand.primary}}" } },
      { id: "el-2", type: "text", styles: { background: "{{token.color.brand.primary}}" } },
      { id: "el-3", type: "card", styles: { borderColor: "{{token.color.brand.primary}}" } },
    ] as ElementsSnapshot;
    tracker.recompute(snapshot);
    expect(tracker.getUsage("color.brand.primary")).toBe(3);
  });

  it("ignores non-token values", () => {
    const snapshot: ElementsSnapshot = [{
      id: "el-1", type: "button",
      styles: { color: "#3B82F6", background: "{{token.color.brand.primary}}" }
    }] as ElementsSnapshot;
    tracker.recompute(snapshot);
    expect(tracker.getUsage("color.brand.primary")).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd packages/editor && npx vitest run src/engine/designSystem/__tests__/TokenUsageTracker.test.ts
```

Expected: FAIL with "Cannot find module '../TokenUsageTracker'".

- [ ] **Step 3: Implement TokenUsageTracker**

```typescript
// src/engine/designSystem/TokenUsageTracker.ts
import type { ElementsSnapshot } from "@/engine/elements/types";

const TOKEN_REF_RE = /\{\{token\.([a-zA-Z0-9._-]+)\}\}/g;

export class TokenUsageTracker {
  private counts = new Map<string, number>();

  recompute(elements: ElementsSnapshot): void {
    this.counts.clear();
    for (const el of elements) {
      const styles = (el as { styles?: Record<string, unknown> }).styles ?? {};
      for (const value of Object.values(styles)) {
        if (typeof value !== "string") continue;
        for (const match of value.matchAll(TOKEN_REF_RE)) {
          const tokenId = match[1];
          this.counts.set(tokenId, (this.counts.get(tokenId) ?? 0) + 1);
        }
      }
    }
  }

  getUsage(tokenId: string): number {
    return this.counts.get(tokenId) ?? 0;
  }

  getAllUsage(): ReadonlyMap<string, number> {
    return this.counts;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd packages/editor && npx vitest run src/engine/designSystem/__tests__/TokenUsageTracker.test.ts
```

Expected: PASS — all 4 tests green.

- [ ] **Step 5: Mount on Composer.designSystem**

Open `src/engine/Composer.ts`. Find the `designSystem` namespace assembly (look for `readonly designSystem!:`). Add tracker:

```typescript
// Near imports
import { TokenUsageTracker } from "./designSystem/TokenUsageTracker";

// Inside designSystem namespace block (declaration)
readonly tokenUsage: TokenUsageTracker;

// In assembly (find pattern like `this.designSystem = { ... }`)
const tokenUsage = new TokenUsageTracker();
// Add to designSystem object literal:
//   tokenUsage,

// Add subscription in existing elements:changed handler
this.on("elements:changed", () => {
  tokenUsage.recompute(this.elements.getAll());
});
```

- [ ] **Step 6: Add integration test**

```typescript
// Append to src/engine/designSystem/__tests__/TokenUsageTracker.test.ts
import { Composer } from "@/engine/Composer";

describe("TokenUsageTracker via Composer", () => {
  it("auto-recomputes on element changes", () => {
    const composer = new Composer();
    composer.elements.add({
      id: "el-1", type: "button",
      styles: { color: "{{token.color.brand.primary}}" }
    });
    expect(composer.designSystem.tokenUsage.getUsage("color.brand.primary")).toBe(1);
    composer.elements.delete("el-1");
    expect(composer.designSystem.tokenUsage.getUsage("color.brand.primary")).toBe(0);
  });
});
```

Run: `cd packages/editor && npx vitest run src/engine/designSystem/__tests__/TokenUsageTracker.test.ts`
Expected: PASS — all 5 tests.

- [ ] **Step 7: Commit**

```bash
git add src/engine/designSystem/TokenUsageTracker.ts \
        src/engine/designSystem/__tests__/TokenUsageTracker.test.ts \
        src/engine/Composer.ts
git commit -m "feat(engine): add TokenUsageTracker on composer.designSystem"
```

---

### Task 2: Engine — LintState

**Files:**
- Create: `src/engine/designSystem/LintState.ts`
- Create: `src/engine/designSystem/__tests__/LintState.test.ts`
- Modify: `src/engine/Composer.ts`

**Purpose:** Tracks per-token lint issues + per-token suppression flags. Persists suppressions to localStorage.

- [ ] **Step 1: Write failing test**

```typescript
// src/engine/designSystem/__tests__/LintState.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { LintState, type LintIssue } from "../LintState";

describe("LintState", () => {
  let state: LintState;
  beforeEach(() => {
    localStorage.clear();
    state = new LintState();
  });

  it("returns empty issues for unknown token", () => {
    expect(state.getIssues("color.foo")).toEqual([]);
  });

  it("stores and reads issues", () => {
    const issue: LintIssue = {
      type: "contrast", severity: "warn",
      message: "2.8:1 vs surface", autoFixHint: "darken-22"
    };
    state.setIssues("color.accent.yellow", [issue]);
    expect(state.getIssues("color.accent.yellow")).toEqual([issue]);
  });

  it("suppresses lint per token", () => {
    state.suppress("color.accent.yellow");
    expect(state.isSuppressed("color.accent.yellow")).toBe(true);
    expect(state.isSuppressed("color.brand.primary")).toBe(false);
  });

  it("persists suppression to localStorage", () => {
    state.suppress("color.accent.yellow");
    const next = new LintState();
    expect(next.isSuppressed("color.accent.yellow")).toBe(true);
  });

  it("returns visible issues (excludes suppressed)", () => {
    const issue: LintIssue = { type: "contrast", severity: "warn", message: "x" };
    state.setIssues("color.accent.yellow", [issue]);
    expect(state.getVisibleIssues("color.accent.yellow")).toHaveLength(1);
    state.suppress("color.accent.yellow");
    expect(state.getVisibleIssues("color.accent.yellow")).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test, expect fail**

```bash
cd packages/editor && npx vitest run src/engine/designSystem/__tests__/LintState.test.ts
```

Expected: FAIL with "Cannot find module '../LintState'".

- [ ] **Step 3: Implement LintState**

```typescript
// src/engine/designSystem/LintState.ts
export interface LintIssue {
  type: "contrast" | "spacing-collision" | "unused" | "alias-cycle";
  severity: "warn" | "error";
  message: string;
  autoFixHint?: string;
}

const STORAGE_KEY = "buildrik:ds:lintSuppressions";

export class LintState {
  private issues = new Map<string, LintIssue[]>();
  private suppressed = new Set<string>();

  constructor() {
    this.loadSuppressions();
  }

  setIssues(tokenId: string, issues: readonly LintIssue[]): void {
    if (issues.length === 0) this.issues.delete(tokenId);
    else this.issues.set(tokenId, [...issues]);
  }

  getIssues(tokenId: string): readonly LintIssue[] {
    return this.issues.get(tokenId) ?? [];
  }

  getVisibleIssues(tokenId: string): readonly LintIssue[] {
    if (this.suppressed.has(tokenId)) return [];
    return this.getIssues(tokenId);
  }

  suppress(tokenId: string): void {
    this.suppressed.add(tokenId);
    this.persist();
  }

  unsuppress(tokenId: string): void {
    this.suppressed.delete(tokenId);
    this.persist();
  }

  isSuppressed(tokenId: string): boolean {
    return this.suppressed.has(tokenId);
  }

  private persist(): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...this.suppressed]));
    } catch {
      // localStorage write failed; suppression stays in-memory for session
    }
  }

  private loadSuppressions(): void {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        for (const id of list) if (typeof id === "string") this.suppressed.add(id);
      }
    } catch {
      // bad JSON or storage unavailable; ignore
    }
  }
}
```

- [ ] **Step 4: Run test, expect pass**

```bash
cd packages/editor && npx vitest run src/engine/designSystem/__tests__/LintState.test.ts
```

Expected: PASS (5 tests).

- [ ] **Step 5: Mount on Composer.designSystem**

In `src/engine/Composer.ts`:

```typescript
import { LintState } from "./designSystem/LintState";

// Inside designSystem namespace
const lintState = new LintState();
// add to designSystem literal: lintState,
```

- [ ] **Step 6: Commit**

```bash
git add src/engine/designSystem/LintState.ts \
        src/engine/designSystem/__tests__/LintState.test.ts \
        src/engine/Composer.ts
git commit -m "feat(engine): add LintState for per-token lint + suppression"
```

---

### Task 3: Engine — styleBindings.resolveForElements

**Files:**
- Create: `src/engine/designSystem/StyleBindingResolver.ts`
- Create: `src/engine/designSystem/__tests__/StyleBindingResolver.test.ts`
- Modify: `src/engine/Composer.ts`

**Purpose:** Given a set of element ids, extract style-to-token bindings. Used by Save-as-component flow to pre-fill bindings.

**Naming:** `composer.designSystem.styleBindings` (NOT `bindings` — `composer.cms.bindings` already exists per pre-flight).

- [ ] **Step 1: Write failing test**

```typescript
// src/engine/designSystem/__tests__/StyleBindingResolver.test.ts
import { describe, it, expect } from "vitest";
import { StyleBindingResolver } from "../StyleBindingResolver";
import type { ElementsSnapshot } from "@/engine/elements/types";

describe("StyleBindingResolver", () => {
  const resolver = new StyleBindingResolver();

  it("returns empty map when no elements", () => {
    expect(resolver.resolveForElements([], [])).toEqual(new Map());
  });

  it("extracts single binding", () => {
    const els: ElementsSnapshot = [{
      id: "el-1", type: "button",
      styles: { color: "{{token.color.brand.primary}}" }
    }] as ElementsSnapshot;
    const result = resolver.resolveForElements(["el-1"], els);
    expect(result.get("el-1:color")).toBe("color.brand.primary");
  });

  it("extracts multiple bindings across elements", () => {
    const els: ElementsSnapshot = [
      { id: "el-1", type: "button",
        styles: { color: "{{token.color.brand.primary}}", background: "{{token.color.surface.bg}}" } },
      { id: "el-2", type: "text", styles: { fontSize: "{{token.type.body}}" } },
    ] as ElementsSnapshot;
    const result = resolver.resolveForElements(["el-1", "el-2"], els);
    expect(result.size).toBe(3);
    expect(result.get("el-1:color")).toBe("color.brand.primary");
    expect(result.get("el-1:background")).toBe("color.surface.bg");
    expect(result.get("el-2:fontSize")).toBe("type.body");
  });

  it("ignores non-token style values", () => {
    const els: ElementsSnapshot = [{
      id: "el-1", type: "button",
      styles: { color: "#3B82F6", padding: "8px" }
    }] as ElementsSnapshot;
    const result = resolver.resolveForElements(["el-1"], els);
    expect(result.size).toBe(0);
  });

  it("excludes elements not in id list", () => {
    const els: ElementsSnapshot = [
      { id: "el-1", type: "button", styles: { color: "{{token.color.brand.primary}}" } },
      { id: "el-2", type: "text", styles: { color: "{{token.color.text.body}}" } },
    ] as ElementsSnapshot;
    const result = resolver.resolveForElements(["el-1"], els);
    expect(result.size).toBe(1);
    expect(result.has("el-2:color")).toBe(false);
  });
});
```

- [ ] **Step 2: Run test, expect fail**

```bash
cd packages/editor && npx vitest run src/engine/designSystem/__tests__/StyleBindingResolver.test.ts
```

Expected: FAIL with module-not-found.

- [ ] **Step 3: Implement StyleBindingResolver**

```typescript
// src/engine/designSystem/StyleBindingResolver.ts
import type { ElementsSnapshot } from "@/engine/elements/types";

const TOKEN_REF_RE = /^\{\{token\.([a-zA-Z0-9._-]+)\}\}$/;

export class StyleBindingResolver {
  resolveForElements(
    elementIds: readonly string[],
    elements: ElementsSnapshot,
  ): Map<string, string> {
    const idSet = new Set(elementIds);
    const result = new Map<string, string>();
    for (const el of elements) {
      if (!idSet.has(el.id)) continue;
      const styles = (el as { styles?: Record<string, unknown> }).styles ?? {};
      for (const [prop, value] of Object.entries(styles)) {
        if (typeof value !== "string") continue;
        const match = value.match(TOKEN_REF_RE);
        if (match) result.set(`${el.id}:${prop}`, match[1]);
      }
    }
    return result;
  }
}
```

- [ ] **Step 4: Run test, expect pass**

```bash
cd packages/editor && npx vitest run src/engine/designSystem/__tests__/StyleBindingResolver.test.ts
```

Expected: PASS (5 tests).

- [ ] **Step 5: Mount on Composer.designSystem**

In `src/engine/Composer.ts`:

```typescript
import { StyleBindingResolver } from "./designSystem/StyleBindingResolver";

// Inside designSystem namespace assembly
const styleBindings = new StyleBindingResolver();
// Add to designSystem literal: styleBindings,
```

Consumer call site looks like: `composer.designSystem.styleBindings.resolveForElements(ids, composer.elements.getAll())`.

- [ ] **Step 6: Commit**

```bash
git add src/engine/designSystem/StyleBindingResolver.ts \
        src/engine/designSystem/__tests__/StyleBindingResolver.test.ts \
        src/engine/Composer.ts
git commit -m "feat(engine): add style-binding resolver on composer.designSystem"
```

---

### Task 4: Layout revert — fullpage → panel

**Files:**
- Modify: `src/editor/sidebar/FullPageRouter.tsx:15, 66` — remove DesignSystemTab branch
- Modify: `src/editor/sidebar/LeftSidebar.tsx` — register new `design` tab in panel router
- Modify: `src/editor/sidebar/tabs/settings/SettingsTab.tsx` — change "Open Palette" handler
- Modify: `src/editor/design-system/ui/DesignSystemTab.tsx` — adapt to 320px panel container
- Create: `src/editor/design-system/styles/ds-panel.css`

**Purpose:** Move DS from fullpage route to 320px sidebar panel so canvas + inspector remain visible during editing. Matches prototype s01.

- [ ] **Step 1: Inventory FullPageRouter consumers**

```bash
cd packages/editor && grep -rn "FullPageRouter\|fullPage\|design.*fullpage" src/ --include="*.ts" --include="*.tsx" | grep -v node_modules
```

Note every match — these will need verification post-change.

- [ ] **Step 2: Inventory LeftSidebar tab definitions**

```bash
cd packages/editor && sed -n '1,100p' src/editor/sidebar/LeftSidebar.tsx
```

Identify the tab-type union (look for `type ActiveTab = ...`) and panel-router switch. Will need `"design"` added.

- [ ] **Step 3: Write panel-mount test**

```typescript
// src/editor/design-system/ui/__tests__/DesignSystemTab.panel-mode.test.tsx
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { DesignSystemTab } from "../DesignSystemTab";
import { Composer } from "@/engine/Composer";

describe("DesignSystemTab — panel mode", () => {
  it("renders within 320px container without horizontal overflow", () => {
    const composer = new Composer();
    const { container } = render(
      <div style={{ width: 320 }}>
        <DesignSystemTab composer={composer} />
      </div>
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.scrollWidth).toBeLessThanOrEqual(320);
  });

  it("renders header with both DSModeToggle and ColorModeToggle", () => {
    const composer = new Composer();
    const { getByRole } = render(
      <div style={{ width: 320 }}>
        <DesignSystemTab composer={composer} />
      </div>
    );
    expect(getByRole("group", { name: /mode/i })).toBeTruthy();
    expect(getByRole("group", { name: /color/i })).toBeTruthy();
  });
});
```

- [ ] **Step 4: Run test, expect fail**

```bash
cd packages/editor && npx vitest run src/editor/design-system/ui/__tests__/DesignSystemTab.panel-mode.test.tsx
```

Expected: FAIL — color-mode group not found (closed by Task 6).

- [ ] **Step 5: Remove DesignSystemTab from FullPageRouter**

Open `src/editor/sidebar/FullPageRouter.tsx`. Delete line 15:

```typescript
const DesignSystemTab = React.lazy(() => import("@/editor/design-system/ui/DesignSystemTab"));
```

And delete the branch at line 66:

```typescript
return <DesignSystemTab composer={composer} {...commonTabProps} />;
```

If line 66 is the only DS handling, remove the entire `"design"` case from any switch above it.

- [ ] **Step 6: Register Design in LeftSidebar panel router**

In `src/editor/sidebar/LeftSidebar.tsx`, add `"design"` to the tab-type union and the panel-render switch:

```typescript
// Type
type ActiveTab = "add" | "templates" | "assets" | "layers" | "pages" | "components" | "design" | "settings" | "history" | null;

// In render switch
case "design":
  return <DesignSystemTab composer={composer} {...commonProps} />;
```

Import `DesignSystemTab` at top:

```typescript
import { DesignSystemTab } from "@/editor/design-system/ui/DesignSystemTab";
```

- [ ] **Step 7: Update Settings → Branding "Open Palette" handler**

In `src/editor/sidebar/tabs/settings/SettingsTab.tsx` find the "Open Palette" button. Change its onClick to switch the active panel tab to `"design"`. First grep for existing pattern:

```bash
grep -rn "setActiveTab\|ui.activeTab" src/engine/ src/editor/sidebar/
```

Use whatever existing pattern the other rail buttons use. Typical shape:

```typescript
onClick={() => composer.ui.setActiveTab("design")}
```

- [ ] **Step 8: Constrain DesignSystemTab width**

In `src/editor/design-system/ui/DesignSystemTab.tsx` root container, set max width and overflow:

```typescript
<div className="ds-panel-root" style={{ width: 320, maxWidth: 320, overflow: "hidden", display: "flex", flexDirection: "column" }}>
```

Create CSS:

```css
/* src/editor/design-system/styles/ds-panel.css */
.ds-panel-root .ds-tokens-section { grid-template-columns: 1fr; }
.ds-panel-root .ds-styles-section { grid-template-columns: 1fr; }
.ds-panel-root .ds-export-section { grid-template-columns: 1fr; }
```

Import in `src/themes/default.css`:

```css
@import "../editor/design-system/styles/ds-panel.css";
```

- [ ] **Step 9: Run panel test, expect partial pass**

```bash
cd packages/editor && npx vitest run src/editor/design-system/ui/__tests__/DesignSystemTab.panel-mode.test.tsx
```

Expected: width-fit test PASSES. Color-mode-group test still FAILS (closed by Task 6).

- [ ] **Step 10: Verify FullPageRouter tests still pass**

```bash
cd packages/editor && npx vitest run src/editor/sidebar/__tests__/FullPageRouter.test.tsx 2>/dev/null || echo "no test file (ok)"
```

If a test file exists and fails on the removed DS branch, update assertions to reflect the new state.

- [ ] **Step 11: Commit**

```bash
git add src/editor/sidebar/FullPageRouter.tsx \
        src/editor/sidebar/LeftSidebar.tsx \
        src/editor/sidebar/tabs/settings/SettingsTab.tsx \
        src/editor/design-system/ui/DesignSystemTab.tsx \
        src/editor/design-system/styles/ds-panel.css \
        src/themes/default.css \
        src/editor/design-system/ui/__tests__/DesignSystemTab.panel-mode.test.tsx
git commit -m "feat(ds): revert DesignSystemTab from fullpage to 320px sidebar panel"
```

---

### Task 5: Design rail icon

**Files:**
- Modify: `src/editor/rail/RailButtons.tsx` (or the file that defines the `.ls-rail` button list)
- Create: `src/editor/rail/__tests__/DesignRailButton.test.tsx`

**Purpose:** Add Design rail icon between Components and Settings so DS is reachable in 1 click.

- [ ] **Step 1: Locate rail button definitions**

```bash
cd packages/editor && grep -rn "ls-rail\|data-tab" src/editor/rail/ src/editor/sidebar/
```

Open the file that renders the rail (likely `src/editor/rail/RailButtons.tsx` or inside `LeftSidebar.tsx`). Look for an array of `{ tab, title, icon }` or `<RailButton>` JSX list.

- [ ] **Step 2: Write failing test**

```typescript
// src/editor/rail/__tests__/DesignRailButton.test.tsx
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { RailButtons } from "../RailButtons";
import { Composer } from "@/engine/Composer";

describe("Rail buttons", () => {
  it("includes Design entry between Components and Settings", () => {
    const composer = new Composer();
    const { container } = render(<RailButtons composer={composer} />);
    const buttons = Array.from(container.querySelectorAll("button[data-tab]")) as HTMLButtonElement[];
    const tabs = buttons.map(b => b.dataset.tab);
    const compIdx = tabs.indexOf("components");
    const designIdx = tabs.indexOf("design");
    const settingsIdx = tabs.indexOf("settings");
    expect(designIdx).toBeGreaterThan(compIdx);
    expect(designIdx).toBeLessThan(settingsIdx);
  });
});
```

- [ ] **Step 3: Run test, expect fail**

```bash
cd packages/editor && npx vitest run src/editor/rail/__tests__/DesignRailButton.test.tsx
```

Expected: FAIL — `designIdx` is -1.

- [ ] **Step 4: Add Design rail button**

In the rail button list, insert a Design entry between Components and Settings. Adapt to actual code:

```typescript
{
  tab: "design",
  title: "Design tokens, styles, components",
  ariaLabel: "Design system tokens, styles, components",
  icon: <Palette size={18} aria-hidden="true" />,
},
```

Import icon:

```typescript
import { Palette } from "lucide-react";
```

- [ ] **Step 5: Run test, expect pass**

```bash
cd packages/editor && npx vitest run src/editor/rail/__tests__/DesignRailButton.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Visual verify**

```bash
cd packages/editor && npm run dev &
sleep 5
~/.claude/skills/gstack/browse/dist/browse goto http://localhost:5050/
~/.claude/skills/gstack/browse/dist/browse js "JSON.stringify(Array.from(document.querySelectorAll('.ls-rail button')).map(b => b.dataset.tab))"
```

Expected output includes `"design"` between `"components"` and `"settings"`.

- [ ] **Step 7: Commit**

```bash
git add src/editor/rail/RailButtons.tsx \
        src/editor/rail/__tests__/DesignRailButton.test.tsx
git commit -m "feat(rail): add Design icon between Components and Settings"
```

---

### Task 6: ColorModeToggle in DS header

**Files:**
- Modify: `src/editor/design-system/ui/DesignSystemTab.tsx:54, 457`

**Purpose:** Mount existing `ColorModeToggle` next to `DSModeToggle` in DS header. Matches prototype s01.

- [ ] **Step 1: Read existing header**

```bash
cd packages/editor && sed -n '440,470p' src/editor/design-system/ui/DesignSystemTab.tsx
```

Note JSX shape of DSModeToggle mount.

- [ ] **Step 2: Add import**

In `src/editor/design-system/ui/DesignSystemTab.tsx`, line 54 area:

```typescript
import { DSModeToggle } from "./DSModeToggle";
import { ColorModeToggle } from "./ColorModeToggle";
```

- [ ] **Step 3: Mount in header**

Find `<DSModeToggle />` at line ~457. Wrap both toggles in a flex container:

```tsx
<div style={{ display: "flex", gap: 4 }}>
  <DSModeToggle />
  <ColorModeToggle />
</div>
```

- [ ] **Step 4: Run Task 4 panel-mode test, expect pass**

```bash
cd packages/editor && npx vitest run src/editor/design-system/ui/__tests__/DesignSystemTab.panel-mode.test.tsx
```

Expected: BOTH tests pass now.

- [ ] **Step 5: Commit**

```bash
git add src/editor/design-system/ui/DesignSystemTab.tsx
git commit -m "feat(ds): mount ColorModeToggle next to DSModeToggle in header"
```

---

### Task 7: Usage chips on token rows

**Files:**
- Create: `src/editor/design-system/ui/sections/TokenUsageChip.tsx`
- Create: `src/editor/design-system/ui/sections/__tests__/TokenUsageChip.test.tsx`
- Modify: `src/editor/design-system/ui/sections/TokenKindCard.tsx`
- Modify: `src/editor/design-system/styles/ds-panel.css`

**Purpose:** Show "used Nx" chip on each token row. Counts come from Task 1.

- [ ] **Step 1: Inventory token row template**

```bash
cd packages/editor && grep -n "tok-row\|TokenRow\|swatch" src/editor/design-system/ui/sections/TokenKindCard.tsx src/editor/design-system/ui/sections/TokensSection.tsx
```

Identify JSX that renders a single token row.

- [ ] **Step 2: Write failing test**

```typescript
// src/editor/design-system/ui/sections/__tests__/TokenUsageChip.test.tsx
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { TokenUsageChip } from "../TokenUsageChip";

describe("TokenUsageChip", () => {
  it("renders 'used Nx' for count > 0", () => {
    const { getByText } = render(<TokenUsageChip count={23} />);
    expect(getByText("used 23×")).toBeTruthy();
  });

  it("renders 'unused' for count 0", () => {
    const { getByText } = render(<TokenUsageChip count={0} />);
    expect(getByText("unused")).toBeTruthy();
  });

  it("applies green variant for used", () => {
    const { container } = render(<TokenUsageChip count={5} />);
    const chip = container.firstElementChild as HTMLElement;
    expect(chip.className).toContain("ds-chip--used");
  });

  it("applies gray variant for unused", () => {
    const { container } = render(<TokenUsageChip count={0} />);
    const chip = container.firstElementChild as HTMLElement;
    expect(chip.className).toContain("ds-chip--unused");
  });
});
```

- [ ] **Step 3: Run test, expect fail**

```bash
cd packages/editor && npx vitest run src/editor/design-system/ui/sections/__tests__/TokenUsageChip.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 4: Implement TokenUsageChip**

```typescript
// src/editor/design-system/ui/sections/TokenUsageChip.tsx
import * as React from "react";

export interface TokenUsageChipProps {
  count: number;
}

export const TokenUsageChip: React.FC<TokenUsageChipProps> = ({ count }) => {
  const variant = count > 0 ? "ds-chip--used" : "ds-chip--unused";
  const label = count > 0 ? `used ${count}×` : "unused";
  return <span className={`ds-chip ${variant}`}>{label}</span>;
};
```

Add CSS to `src/editor/design-system/styles/ds-panel.css`:

```css
.ds-chip {
  display: inline-flex; align-items: center; padding: 2px 6px;
  border-radius: 4px; font-size: 11px; font-weight: 500;
  font-family: var(--buildrick-font-mono, ui-monospace, monospace);
}
.ds-chip--used { background: var(--buildrick-success-soft, #dcfce7); color: var(--buildrick-success-strong, #16a34a); }
.ds-chip--unused { background: var(--bd-bg-muted, #f1f5f9); color: var(--bd-fg-muted, #64748b); }
```

- [ ] **Step 5: Run test, expect pass**

```bash
cd packages/editor && npx vitest run src/editor/design-system/ui/sections/__tests__/TokenUsageChip.test.tsx
```

Expected: PASS (4 tests).

- [ ] **Step 6: Mount in TokenKindCard row template**

In the row JSX (per Step 1 inventory), add the chip column at the end:

```tsx
import { TokenUsageChip } from "./TokenUsageChip";

// Subscribe to changes (per feedback_dsmode_provider_initial_first_mount.md)
const [usageMap, setUsageMap] = React.useState(() =>
  new Map(composer.designSystem.tokenUsage.getAllUsage())
);
React.useEffect(() => {
  const handler = () => setUsageMap(new Map(composer.designSystem.tokenUsage.getAllUsage()));
  composer.on("elements:changed", handler);
  return () => composer.off("elements:changed", handler);
}, [composer]);

// In row:
const usage = usageMap.get(token.id) ?? 0;
return (
  <div className="tok-row">
    <span className="swatch" style={{ background: token.value }} />
    <span className="name">{token.displayName}</span>
    <TokenUsageChip count={usage} />
  </div>
);
```

- [ ] **Step 7: Visual smoke test**

```bash
cd packages/editor && npm run dev &
sleep 5
~/.claude/skills/gstack/browse/dist/browse goto http://localhost:5050/
~/.claude/skills/gstack/browse/dist/browse js "Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Skip')?.click()"
~/.claude/skills/gstack/browse/dist/browse js "document.querySelector('.ls-rail button[data-tab=\"design\"]').click()"
sleep 1
~/.claude/skills/gstack/browse/dist/browse screenshot /tmp/usage-chips.png
```

Open `/tmp/usage-chips.png`. Every token row must show green "used Nx" or gray "unused" chip.

- [ ] **Step 8: Commit**

```bash
git add src/editor/design-system/ui/sections/TokenUsageChip.tsx \
        src/editor/design-system/ui/sections/__tests__/TokenUsageChip.test.tsx \
        src/editor/design-system/ui/sections/TokenKindCard.tsx \
        src/editor/design-system/styles/ds-panel.css
git commit -m "feat(ds): add usage chip on token rows wired to TokenUsageTracker"
```

---

### Task 8: Beginner mode hint chip

**Files:**
- Modify: `src/editor/design-system/ui/sections/TokensSection.tsx`
- Create: `src/editor/design-system/ui/sections/__tests__/BeginnerHint.test.tsx`
- Modify: `src/editor/design-system/styles/ds-panel.css`

**Purpose:** Educative chip "Beginner mode hides token IDs and alias graph. Toggle Pro to expose." Renders only when `dsMode === 'beginner'`.

- [ ] **Step 1: Write failing test**

```typescript
// src/editor/design-system/ui/sections/__tests__/BeginnerHint.test.tsx
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { TokensSection } from "../TokensSection";
import { Composer } from "@/engine/Composer";

describe("TokensSection — beginner hint", () => {
  it("shows hint in beginner mode", () => {
    const composer = new Composer();
    composer.designSystem.dsMode.set("beginner");
    const { getByText } = render(<TokensSection composer={composer} />);
    expect(getByText(/Beginner mode hides token IDs/i)).toBeTruthy();
  });

  it("hides hint in pro mode", () => {
    const composer = new Composer();
    composer.designSystem.dsMode.set("pro");
    const { queryByText } = render(<TokensSection composer={composer} />);
    expect(queryByText(/Beginner mode hides token IDs/i)).toBeNull();
  });
});
```

- [ ] **Step 2: Run test, expect fail**

```bash
cd packages/editor && npx vitest run src/editor/design-system/ui/sections/__tests__/BeginnerHint.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Add hint JSX**

In `src/editor/design-system/ui/sections/TokensSection.tsx`, at end of body:

```tsx
{dsMode === "beginner" && (
  <div className="ds-beginner-hint" role="note">
    Beginner mode hides token IDs and alias graph. Toggle Pro to expose.
  </div>
)}
```

CSS:

```css
/* src/editor/design-system/styles/ds-panel.css */
.ds-beginner-hint {
  margin-top: 12px; padding: 8px 12px;
  background: var(--buildrick-info-soft, #eff4ff);
  color: var(--buildrick-info-strong, #1f4fbf);
  border-radius: 6px; font-size: 11px;
}
```

- [ ] **Step 4: Run test, expect pass**

```bash
cd packages/editor && npx vitest run src/editor/design-system/ui/sections/__tests__/BeginnerHint.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/editor/design-system/ui/sections/TokensSection.tsx \
        src/editor/design-system/ui/sections/__tests__/BeginnerHint.test.tsx \
        src/editor/design-system/styles/ds-panel.css
git commit -m "feat(ds): beginner mode hint chip in Tokens section"
```

---

### Task 9: Dark-missing variant chip

**Files:**
- Modify: `src/editor/design-system/ui/sections/TokenKindCard.tsx`
- Create: `src/editor/design-system/ui/sections/__tests__/DarkMissingChip.test.tsx`

**Purpose:** Amber chip on color rows when colorMode is "dark" and token lacks `darkValue`.

- [ ] **Step 1: Failing test**

```typescript
// src/editor/design-system/ui/sections/__tests__/DarkMissingChip.test.tsx
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { TokenKindCard } from "../TokenKindCard";
import { Composer } from "@/engine/Composer";

describe("Dark-missing chip", () => {
  it("shows chip when dark mode active and darkValue absent", () => {
    const composer = new Composer();
    composer.colorMode.set("dark");
    composer.designSystem.tokens.upsert({
      id: "color.accent.yellow", value: "#FACC15", type: "color"
    });
    const { getByText } = render(
      <TokenKindCard composer={composer} kindId="color" />
    );
    expect(getByText(/no dark · falls back/i)).toBeTruthy();
  });

  it("no chip when darkValue present", () => {
    const composer = new Composer();
    composer.colorMode.set("dark");
    composer.designSystem.tokens.upsert({
      id: "color.brand.primary", value: "#2D6DFF", darkValue: "#3B82F6", type: "color"
    });
    const { queryByText } = render(
      <TokenKindCard composer={composer} kindId="color" />
    );
    expect(queryByText(/no dark/i)).toBeNull();
  });

  it("no chip when light mode active", () => {
    const composer = new Composer();
    composer.colorMode.set("light");
    composer.designSystem.tokens.upsert({
      id: "color.accent.yellow", value: "#FACC15", type: "color"
    });
    const { queryByText } = render(
      <TokenKindCard composer={composer} kindId="color" />
    );
    expect(queryByText(/no dark/i)).toBeNull();
  });
});
```

- [ ] **Step 2: Run, expect fail**

```bash
cd packages/editor && npx vitest run src/editor/design-system/ui/sections/__tests__/DarkMissingChip.test.tsx
```

- [ ] **Step 3: Implement chip in row template**

In `TokenKindCard.tsx` color-row branch:

```tsx
// Subscribe to colorMode
const [mode, setMode] = React.useState<"light" | "dark">(() => composer.colorMode.get());
React.useEffect(() => {
  const handler = () => setMode(composer.colorMode.get());
  composer.on("colorMode:changed", handler);
  return () => composer.off("colorMode:changed", handler);
}, [composer]);

// In row JSX for color tokens:
{token.type === "color" && mode === "dark" && token.darkValue === undefined && (
  <span
    className="ds-chip ds-chip--dark-missing"
    role="button"
    tabIndex={0}
    onClick={() => composer.designSystem.openTokenEditor(token.id, { focusField: "darkValue" })}
  >
    no dark · falls back
  </span>
)}
```

CSS:

```css
/* src/editor/design-system/styles/ds-panel.css */
.ds-chip--dark-missing {
  background: var(--buildrick-warning-soft, #fef9c3);
  color: var(--buildrick-warning-strong, #854d0e);
  cursor: pointer;
}
```

If `composer.designSystem.openTokenEditor` doesn't exist, grep:

```bash
grep -rn "openTokenEditor\|tokenEditor\|editToken" src/engine/ src/editor/design-system/
```

Use the existing handler. If none exists, this becomes a follow-up — for now wire to `console.warn("openTokenEditor not implemented", tokenId)`.

- [ ] **Step 4: Run test, expect pass**

```bash
cd packages/editor && npx vitest run src/editor/design-system/ui/sections/__tests__/DarkMissingChip.test.tsx
```

- [ ] **Step 5: Commit**

```bash
git add src/editor/design-system/ui/sections/TokenKindCard.tsx \
        src/editor/design-system/ui/sections/__tests__/DarkMissingChip.test.tsx \
        src/editor/design-system/styles/ds-panel.css
git commit -m "feat(ds): amber chip on color rows missing dark variant"
```

---

### Task 10: Inline lint row (s09 surface A)

**Files:**
- Create: `src/editor/design-system/ui/sections/TokenLintRow.tsx`
- Create: `src/editor/design-system/ui/sections/__tests__/TokenLintRow.test.tsx`
- Modify: `src/editor/design-system/ui/sections/TokenKindCard.tsx`
- Modify: `src/engine/Composer.ts` (wire Auto-fix to existing `contrastFix.ts`)
- Possibly create: `src/engine/designSystem/contrastFix.ts` (if pure logic must move from editor/)

**Purpose:** When a token has a lint issue, render amber row below it with Auto-fix and Ignore buttons. Matches prototype s09 surface A.

- [ ] **Step 1: Failing test**

```typescript
// src/editor/design-system/ui/sections/__tests__/TokenLintRow.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { TokenLintRow } from "../TokenLintRow";
import type { LintIssue } from "@/engine/designSystem/LintState";

const issue: LintIssue = {
  type: "contrast", severity: "warn",
  message: "2.8:1 vs surface · WCAG AA needs 4.5",
  autoFixHint: "darken-22",
};

describe("TokenLintRow", () => {
  it("renders message and pill count", () => {
    const { getByText } = render(
      <TokenLintRow tokenId="color.accent.yellow" issues={[issue, issue, issue]}
        onAutoFix={() => {}} onIgnore={() => {}} />
    );
    expect(getByText(/2.8:1 vs surface/i)).toBeTruthy();
    expect(getByText("3 lints")).toBeTruthy();
  });

  it("fires Auto-fix callback with token id and hint", () => {
    const onAutoFix = vi.fn();
    const { getByText } = render(
      <TokenLintRow tokenId="color.accent.yellow" issues={[issue]}
        onAutoFix={onAutoFix} onIgnore={() => {}} />
    );
    fireEvent.click(getByText("Auto-fix"));
    expect(onAutoFix).toHaveBeenCalledWith("color.accent.yellow", "darken-22");
  });

  it("fires Ignore callback with token id", () => {
    const onIgnore = vi.fn();
    const { getByText } = render(
      <TokenLintRow tokenId="color.accent.yellow" issues={[issue]}
        onAutoFix={() => {}} onIgnore={onIgnore} />
    );
    fireEvent.click(getByText("Ignore"));
    expect(onIgnore).toHaveBeenCalledWith("color.accent.yellow");
  });
});
```

- [ ] **Step 2: Run, expect fail**

```bash
cd packages/editor && npx vitest run src/editor/design-system/ui/sections/__tests__/TokenLintRow.test.tsx
```

- [ ] **Step 3: Implement TokenLintRow**

```typescript
// src/editor/design-system/ui/sections/TokenLintRow.tsx
import * as React from "react";
import type { LintIssue } from "@/engine/designSystem/LintState";

export interface TokenLintRowProps {
  tokenId: string;
  issues: readonly LintIssue[];
  onAutoFix: (tokenId: string, hint: string | undefined) => void;
  onIgnore: (tokenId: string) => void;
}

export const TokenLintRow: React.FC<TokenLintRowProps> = ({ tokenId, issues, onAutoFix, onIgnore }) => {
  if (issues.length === 0) return null;
  const first = issues[0];
  return (
    <div className="ds-lint-row">
      <div className="ds-lint-row__body">
        <span className="ds-lint-row__icon">⚠</span>
        <span className="ds-lint-row__message">{first.message}</span>
        {issues.length > 1 && <span className="ds-chip ds-chip--lint">{issues.length} lints</span>}
      </div>
      <div className="ds-lint-row__actions">
        <button
          type="button"
          className="bd-btn bd-btn--primary bd-btn--xs"
          onClick={() => onAutoFix(tokenId, first.autoFixHint)}
        >
          Auto-fix
        </button>
        <button
          type="button"
          className="bd-btn bd-btn--ghost bd-btn--xs"
          onClick={() => onIgnore(tokenId)}
        >
          Ignore
        </button>
      </div>
    </div>
  );
};
```

CSS:

```css
/* src/editor/design-system/styles/ds-panel.css */
.ds-lint-row {
  margin-top: 6px; padding: 8px 12px;
  background: var(--buildrick-warning-soft, #fef9c3);
  border-radius: 6px;
  display: flex; flex-direction: column; gap: 6px;
}
.ds-lint-row__body { display: flex; gap: 8px; align-items: center; font-size: 11px; color: #854d0e; }
.ds-lint-row__actions { display: flex; gap: 4px; }
.ds-chip--lint { background: var(--buildrick-warning-strong, #eab308); color: #fff; }
```

- [ ] **Step 4: Run test, expect pass**

```bash
cd packages/editor && npx vitest run src/editor/design-system/ui/sections/__tests__/TokenLintRow.test.tsx
```

- [ ] **Step 5: Mount in TokenKindCard**

In `TokenKindCard.tsx` after each token row:

```tsx
import { TokenLintRow } from "./TokenLintRow";

const visibleIssues = composer.designSystem.lintState.getVisibleIssues(token.id);
{visibleIssues.length > 0 && (
  <TokenLintRow
    tokenId={token.id}
    issues={visibleIssues}
    onAutoFix={(id, hint) => composer.designSystem.applyAutoFix(id, hint)}
    onIgnore={(id) => composer.designSystem.lintState.suppress(id)}
  />
)}
```

- [ ] **Step 6: Resolve contrastFix import direction**

Per CLAUDE.md: `engine/` cannot import from `editor/`. If `contrastFix.ts` lives in `editor/design-system/utils/`, lift the pure function down to `engine/designSystem/contrastFix.ts` first. Grep:

```bash
grep -rn "contrastFix\|applyContrastFix" src/
```

If editor/util only, copy pure logic to `engine/designSystem/contrastFix.ts` and update editor/util to re-export. Add Composer method:

```typescript
// In src/engine/Composer.ts inside designSystem methods
import { applyContrastFix } from "./designSystem/contrastFix";

applyAutoFix: (tokenId: string, hint: string | undefined) => {
  const token = this.designSystem.tokens.getById(tokenId);
  if (!token) return;
  if (hint === "darken-22") {
    const fixed = applyContrastFix(token.value, "darken-22");
    this.designSystem.tokens.update(tokenId, { value: fixed });
    this.history.push({ type: "auto-fix", tokenId, prev: token.value, next: fixed });
  }
},
```

- [ ] **Step 7: Run all tests, expect pass**

```bash
cd packages/editor && npx vitest run src/editor/design-system/ src/engine/designSystem/
```

- [ ] **Step 8: Commit**

```bash
git add src/editor/design-system/ui/sections/TokenLintRow.tsx \
        src/editor/design-system/ui/sections/__tests__/TokenLintRow.test.tsx \
        src/editor/design-system/ui/sections/TokenKindCard.tsx \
        src/editor/design-system/styles/ds-panel.css \
        src/engine/Composer.ts \
        src/engine/designSystem/contrastFix.ts
git commit -m "feat(ds): inline TokenLintRow with Auto-fix + Ignore (s09 surface A)"
```

---

### Task 11: Extend CreateComponentModal with binding fields

**Files:**
- Modify: `src/editor/sidebar/tabs/component-library/CreateComponentModal.tsx`
- Modify: `src/editor/sidebar/tabs/component-library/useComponentsState.ts`
- Create: `src/editor/sidebar/tabs/component-library/__tests__/CreateComponentModal.test.tsx`

**Purpose:** Add Group select + "Pre-fill bindings from DS" checkbox. Conditional on `selectionContext` prop.

- [ ] **Step 1: Failing test**

```typescript
// src/editor/sidebar/tabs/component-library/__tests__/CreateComponentModal.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { CreateComponentModal } from "../CreateComponentModal";

describe("CreateComponentModal", () => {
  it("no binding fields when selectionContext absent", () => {
    const { queryByLabelText } = render(
      <CreateComponentModal onClose={() => {}} onSubmit={() => {}} />
    );
    expect(queryByLabelText(/pre-fill bindings/i)).toBeNull();
  });

  it("shows binding checkbox + group when selectionContext present", () => {
    const selectionContext = {
      selectionIds: ["el-1"],
      extractedBindings: new Map([["el-1:color", "color.brand.primary"]]),
    };
    const { getByLabelText, getByText } = render(
      <CreateComponentModal
        onClose={() => {}} onSubmit={() => {}}
        selectionContext={selectionContext}
      />
    );
    expect(getByLabelText(/pre-fill bindings/i)).toBeTruthy();
    expect(getByText(/1 style will bind/i)).toBeTruthy();
  });

  it("submits payload with binding flags", () => {
    const onSubmit = vi.fn();
    const selectionContext = {
      selectionIds: ["el-1"],
      extractedBindings: new Map([["el-1:color", "color.brand.primary"]]),
    };
    const { getByLabelText, getByText } = render(
      <CreateComponentModal
        onClose={() => {}} onSubmit={onSubmit}
        selectionContext={selectionContext}
      />
    );
    fireEvent.change(getByLabelText(/name/i), { target: { value: "Pricing card" } });
    fireEvent.click(getByText(/save component/i));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      name: "Pricing card",
      prefillBindings: true,
    }));
  });
});
```

- [ ] **Step 2: Run test, expect fail**

```bash
cd packages/editor && npx vitest run src/editor/sidebar/tabs/component-library/__tests__/CreateComponentModal.test.tsx
```

- [ ] **Step 3: Extend modal**

Replace contents of `src/editor/sidebar/tabs/component-library/CreateComponentModal.tsx`:

```typescript
import * as React from "react";
import { Input } from "@/editor/shared/vibcoder/Input";
import { Button } from "@/editor/shared/vibcoder/Button";
import { Modal, ModalContent, ModalTitle, ModalClose, OverlayMount, Stack } from "@/editor/shared/vibcoder";
import { dialogCancelBtnStyles, dialogInputStyles, dialogPrimaryBtnStyles } from "./styles";

export interface SelectionContext {
  selectionIds: readonly string[];
  extractedBindings: Map<string, string>;
}

export interface CreateComponentSubmitPayload {
  name: string;
  group: string | null;
  prefillBindings: boolean;
}

export interface CreateComponentModalProps {
  onClose: () => void;
  onSubmit: (payload: CreateComponentSubmitPayload) => void;
  selectionContext?: SelectionContext;
}

export const CreateComponentModal: React.FC<CreateComponentModalProps> = ({
  onClose, onSubmit, selectionContext,
}) => {
  const [name, setName] = React.useState("");
  const [group, setGroup] = React.useState<string>("");
  const [prefillBindings, setPrefillBindings] = React.useState<boolean>(true);

  const bindingCount = selectionContext?.extractedBindings.size ?? 0;

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSubmit({
      name: trimmed,
      group: group || null,
      prefillBindings: selectionContext ? prefillBindings : false,
    });
    onClose();
  };

  return (
    <OverlayMount>
      <Modal open onOpenChange={(next) => !next && onClose()}>
        <ModalContent size="lg">
          <ModalTitle>Save as component</ModalTitle>
          <ModalClose aria-label="Close modal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </ModalClose>
          <div className="bd-modal__body">
            <Stack gap="md">
              <label>
                <span className="ds-modal-label">Name</span>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={dialogInputStyles}
                />
              </label>

              <label>
                <span className="ds-modal-label">Group</span>
                <select
                  value={group}
                  onChange={(e) => setGroup(e.target.value)}
                  style={dialogInputStyles}
                >
                  <option value="">Your symbols</option>
                </select>
              </label>

              {selectionContext && (
                <div className="ds-bindings-pref">
                  <label className="ds-bindings-pref__checkbox">
                    <input
                      type="checkbox"
                      checked={prefillBindings}
                      onChange={(e) => setPrefillBindings(e.target.checked)}
                      aria-label="Pre-fill bindings from DS"
                    />
                    Pre-fill bindings from DS
                  </label>
                  <p className="ds-bindings-pref__hint">
                    {bindingCount === 1
                      ? "1 style will bind to your DS tokens. Editing tokens later updates this component too."
                      : `${bindingCount} styles will bind to your DS tokens. Editing tokens later updates this component too.`}
                  </p>
                </div>
              )}
            </Stack>
          </div>
          <div className="bd-modal__foot">
            <Button onClick={onClose} style={dialogCancelBtnStyles}>Cancel</Button>
            <Button onClick={handleSubmit} style={dialogPrimaryBtnStyles}>Save component</Button>
          </div>
        </ModalContent>
      </Modal>
    </OverlayMount>
  );
};
```

CSS:

```css
/* src/editor/design-system/styles/ds-panel.css */
.ds-modal-label { display: block; font-size: 11px; color: var(--bd-fg-muted); margin-bottom: 4px; }
.ds-bindings-pref { background: var(--bd-bg-muted); border: 1px solid var(--bd-border); border-radius: 6px; padding: 10px 12px; }
.ds-bindings-pref__checkbox { display: flex; align-items: center; gap: 8px; font-size: 12px; cursor: pointer; }
.ds-bindings-pref__hint { font-size: 11px; color: var(--bd-fg-muted); margin-top: 4px; padding-left: 22px; }
```

- [ ] **Step 4: Update useComponentsState submit handler**

In `useComponentsState.ts` find the handler that receives `CreateComponentModal.onSubmit`. Update signature to accept new payload:

```typescript
import type { CreateComponentSubmitPayload, SelectionContext } from "./CreateComponentModal";

const handleCreate = (payload: CreateComponentSubmitPayload) => {
  const bindings = payload.prefillBindings && pendingSelectionContext
    ? pendingSelectionContext.extractedBindings
    : new Map<string, string>();
  composer.components.createFromSelection({
    name: payload.name,
    group: payload.group,
    elementIds: pendingSelectionContext?.selectionIds ?? [],
    bindings,
  });
};
```

Verify `composer.components.createFromSelection` exists:

```bash
grep -rn "createFromSelection\|createComponent" src/engine/components/
```

If absent, add to `engine/components/ComponentManager.ts` mirroring existing `create()` but accepting bindings map. Bindings should be passed through to ComponentInstance creation.

- [ ] **Step 5: Run test, expect pass**

```bash
cd packages/editor && npx vitest run src/editor/sidebar/tabs/component-library/__tests__/CreateComponentModal.test.tsx
```

- [ ] **Step 6: Commit**

```bash
git add src/editor/sidebar/tabs/component-library/CreateComponentModal.tsx \
        src/editor/sidebar/tabs/component-library/useComponentsState.ts \
        src/editor/sidebar/tabs/component-library/__tests__/CreateComponentModal.test.tsx \
        src/editor/design-system/styles/ds-panel.css \
        src/engine/components/ComponentManager.ts
git commit -m "feat(components): extend CreateComponentModal with group + pre-fill bindings"
```

---

### Task 12: Canvas right-click "Save as component"

**Files:**
- Modify: `src/editor/canvas/hooks/useCanvasContextMenu.ts`
- Modify: `src/editor/canvas/Canvas.tsx` or modal host
- Create: `src/editor/canvas/hooks/__tests__/useCanvasContextMenu.saveAsComponent.test.tsx`

**Purpose:** Right-click canvas selection → "Save as component" menu item → opens CreateComponentModal with pre-computed extractedBindings.

- [ ] **Step 1: Inventory context menu items**

```bash
cd packages/editor && sed -n '1,80p' src/editor/canvas/hooks/useCanvasContextMenu.ts
```

Identify the menu items array shape (likely `{ label, action, gate }`).

- [ ] **Step 2: Failing test**

```typescript
// src/editor/canvas/hooks/__tests__/useCanvasContextMenu.saveAsComponent.test.tsx
import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useCanvasContextMenu } from "../useCanvasContextMenu";
import { Composer } from "@/engine/Composer";

describe("useCanvasContextMenu — Save as component", () => {
  it("includes 'Save as component' entry when selection non-empty", () => {
    const composer = new Composer();
    composer.elements.add({ id: "el-1", type: "button" } as any);
    composer.selection.set(["el-1"]);
    const { result } = renderHook(() => useCanvasContextMenu({ composer }));
    const labels = result.current.items.map((i: { label: string }) => i.label);
    expect(labels).toContain("Save as component");
  });

  it("Save as component entry hidden when no selection", () => {
    const composer = new Composer();
    const { result } = renderHook(() => useCanvasContextMenu({ composer }));
    const labels = result.current.items.map((i: { label: string }) => i.label);
    expect(labels).not.toContain("Save as component");
  });
});
```

- [ ] **Step 3: Run test, expect fail**

```bash
cd packages/editor && npx vitest run src/editor/canvas/hooks/__tests__/useCanvasContextMenu.saveAsComponent.test.tsx
```

- [ ] **Step 4: Add menu entry**

In `useCanvasContextMenu.ts`:

```typescript
const selectionIds = composer.selection.get();
if (selectionIds.length > 0) {
  items.push({
    label: "Save as component",
    action: () => {
      const bindings = composer.designSystem.styleBindings.resolveForElements(
        selectionIds,
        composer.elements.getAll(),
      );
      composer.ui.openModal("create-component", {
        selectionContext: { selectionIds, extractedBindings: bindings },
      });
    },
  });
}
```

Verify `composer.ui.openModal` exists. If not, grep existing modal pattern:

```bash
grep -rn "openModal\|setActiveModal" src/engine/ src/editor/
```

Use existing pattern; if no modal-state API exists, the wiring will live in the canvas component via React state.

- [ ] **Step 5: Wire CreateComponentModal into modal host**

Whichever component owns the modal root for canvas right-clicks (likely `AquibraStudio.tsx` or `StudioPanels.tsx`), add:

```tsx
{activeModal === "create-component" && (
  <CreateComponentModal
    onClose={() => composer.ui.closeModal()}
    onSubmit={(payload) => handleCreateFromCanvas(payload, modalPayload)}
    selectionContext={modalPayload?.selectionContext}
  />
)}
```

- [ ] **Step 6: Run test, expect pass**

```bash
cd packages/editor && npx vitest run src/editor/canvas/hooks/__tests__/useCanvasContextMenu.saveAsComponent.test.tsx
```

- [ ] **Step 7: Commit**

```bash
git add src/editor/canvas/hooks/useCanvasContextMenu.ts \
        src/editor/canvas/hooks/__tests__/useCanvasContextMenu.saveAsComponent.test.tsx \
        src/editor/canvas/Canvas.tsx \
        src/editor/shell/AquibraStudio.tsx
git commit -m "feat(canvas): right-click Save as component triggers binding-aware modal"
```

---

### Task 13: DetachConfirmModal + Pro gate

**Files:**
- Create: `src/editor/sidebar/tabs/component-library/DetachConfirmModal.tsx`
- Create: `src/editor/sidebar/tabs/component-library/__tests__/DetachConfirmModal.test.tsx`
- Modify: `src/editor/sidebar/tabs/component-library/ComponentDetailScreen.tsx:144`
- Modify: `src/editor/canvas/hooks/useCanvasContextMenu.ts` (Pro gate on Detach entry)

**Purpose:** Confirm modal with 4 bullets before `handleDetachInstance` fires. Detach context-menu entry only visible in Pro mode.

- [ ] **Step 1: Failing test**

```typescript
// src/editor/sidebar/tabs/component-library/__tests__/DetachConfirmModal.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { DetachConfirmModal } from "../DetachConfirmModal";

describe("DetachConfirmModal", () => {
  it("renders 4 bullet rows", () => {
    const { getByText } = render(
      <DetachConfirmModal
        instanceLabel="#3"
        masterName="Custom CTA"
        masterInstanceCount={7}
        onCancel={() => {}}
        onConfirm={() => {}}
      />
    );
    expect(getByText(/Current resolved bindings will be snapshotted/)).toBeTruthy();
    expect(getByText(/This instance becomes free-form/)).toBeTruthy();
    expect(getByText(/Master edits will no longer affect this instance/)).toBeTruthy();
    expect(getByText(/Undo restores the link/)).toBeTruthy();
  });

  it("fires onConfirm on Detach click", () => {
    const onConfirm = vi.fn();
    const { getByText } = render(
      <DetachConfirmModal
        instanceLabel="#3" masterName="X" masterInstanceCount={1}
        onCancel={() => {}} onConfirm={onConfirm}
      />
    );
    fireEvent.click(getByText("Detach"));
    expect(onConfirm).toHaveBeenCalled();
  });

  it("fires onCancel on Cancel click", () => {
    const onCancel = vi.fn();
    const { getByText } = render(
      <DetachConfirmModal
        instanceLabel="#3" masterName="X" masterInstanceCount={1}
        onCancel={onCancel} onConfirm={() => {}}
      />
    );
    fireEvent.click(getByText("Cancel"));
    expect(onCancel).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run, expect fail**

```bash
cd packages/editor && npx vitest run src/editor/sidebar/tabs/component-library/__tests__/DetachConfirmModal.test.tsx
```

- [ ] **Step 3: Implement modal**

```typescript
// src/editor/sidebar/tabs/component-library/DetachConfirmModal.tsx
import * as React from "react";
import { Modal, ModalContent, ModalTitle, ModalClose, OverlayMount, Button } from "@/editor/shared/vibcoder";

export interface DetachConfirmModalProps {
  instanceLabel: string;
  masterName: string;
  masterInstanceCount: number;
  onCancel: () => void;
  onConfirm: () => void;
}

const BULLETS = [
  { icon: "✓", color: "var(--buildrick-success-strong)", text: "Current resolved bindings will be snapshotted" },
  { icon: "✓", color: "var(--buildrick-success-strong)", text: "This instance becomes free-form (edit anything)" },
  { icon: "⚠", color: "var(--buildrick-warning-strong)", text: "Master edits will no longer affect this instance" },
  { icon: "↩", color: "var(--buildrick-info-strong)", text: "Undo restores the link (Cmd+Z)" },
] as const;

export const DetachConfirmModal: React.FC<DetachConfirmModalProps> = ({
  instanceLabel, masterName, masterInstanceCount, onCancel, onConfirm,
}) => {
  return (
    <OverlayMount>
      <Modal open onOpenChange={(next) => !next && onCancel()}>
        <ModalContent size="md">
          <ModalTitle>Detach instance {instanceLabel} from master?</ModalTitle>
          <ModalClose aria-label="Close modal" onClick={onCancel}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </ModalClose>
          <div className="bd-modal__body">
            <p className="ds-detach-modal__meta">
              Master: {masterName} · {masterInstanceCount} instance{masterInstanceCount === 1 ? "" : "s"} total
            </p>
            <ul className="ds-detach-modal__bullets">
              {BULLETS.map((b, i) => (
                <li key={i}>
                  <span style={{ color: b.color }}>{b.icon}</span>
                  <span>{b.text}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bd-modal__foot">
            <Button onClick={onCancel}>Cancel</Button>
            <Button variant="primary" onClick={onConfirm}>Detach</Button>
          </div>
        </ModalContent>
      </Modal>
    </OverlayMount>
  );
};
```

CSS:

```css
/* src/editor/design-system/styles/ds-panel.css */
.ds-detach-modal__meta { font-size: 12px; color: var(--bd-fg-muted); margin-bottom: 12px; }
.ds-detach-modal__bullets { list-style: none; padding: 0; margin: 0; }
.ds-detach-modal__bullets li { display: flex; gap: 8px; padding: 6px 0; font-size: 11px; color: var(--bd-fg-secondary); }
```

- [ ] **Step 4: Run test, expect pass**

```bash
cd packages/editor && npx vitest run src/editor/sidebar/tabs/component-library/__tests__/DetachConfirmModal.test.tsx
```

- [ ] **Step 5: Wrap handleDetachInstance with modal**

In `src/editor/sidebar/tabs/component-library/ComponentDetailScreen.tsx:144`:

```typescript
const [pendingDetach, setPendingDetach] = React.useState<{ instanceId: string } | null>(null);

const handleDetach = () => {
  if (!currentSelectedId) return;
  setPendingDetach({ instanceId: currentSelectedId });
};

const confirmDetach = () => {
  if (!pendingDetach) return;
  onDetachInstance?.();
  setPendingDetach(null);
};

// In render
{pendingDetach && (
  <DetachConfirmModal
    instanceLabel={`#${composer.components.getInstanceNumber(pendingDetach.instanceId)}`}
    masterName={composer.components.getMasterName(pendingDetach.instanceId)}
    masterInstanceCount={composer.components.getInstanceCount(pendingDetach.instanceId)}
    onCancel={() => setPendingDetach(null)}
    onConfirm={confirmDetach}
  />
)}
```

Verify composer methods exist:

```bash
grep -rn "getInstanceNumber\|getMasterName\|getInstanceCount" src/engine/components/
```

If absent, add to `engine/components/ComponentManager.ts` as thin reads over existing data structures.

- [ ] **Step 6: Pro gate on canvas context menu**

In `useCanvasContextMenu.ts` where Detach entry exists (or add it if not):

```typescript
const dsMode = composer.designSystem.dsMode.get();
if (dsMode === "pro" && composer.components.isInstance(selectionIds[0])) {
  items.push({
    label: "Detach instance",
    action: () => composer.ui.openModal("detach-confirm", { instanceId: selectionIds[0] }),
  });
}
```

- [ ] **Step 7: Add gate tests**

```typescript
// Append to src/editor/canvas/hooks/__tests__/useCanvasContextMenu.saveAsComponent.test.tsx
import { renderHook } from "@testing-library/react";

describe("Detach entry — Pro gate", () => {
  it("Detach entry hidden in beginner mode", () => {
    const composer = new Composer();
    composer.designSystem.dsMode.set("beginner");
    composer.elements.add({ id: "inst-1", type: "component-instance" } as any);
    composer.selection.set(["inst-1"]);
    const { result } = renderHook(() => useCanvasContextMenu({ composer }));
    const labels = result.current.items.map((i: { label: string }) => i.label);
    expect(labels).not.toContain("Detach instance");
  });

  it("Detach entry visible in pro mode", () => {
    const composer = new Composer();
    composer.designSystem.dsMode.set("pro");
    composer.elements.add({ id: "inst-1", type: "component-instance" } as any);
    composer.selection.set(["inst-1"]);
    const { result } = renderHook(() => useCanvasContextMenu({ composer }));
    const labels = result.current.items.map((i: { label: string }) => i.label);
    expect(labels).toContain("Detach instance");
  });
});
```

- [ ] **Step 8: Run all detach tests**

```bash
cd packages/editor && npx vitest run src/editor/sidebar/tabs/component-library/__tests__/DetachConfirmModal.test.tsx src/editor/canvas/hooks/__tests__/useCanvasContextMenu.saveAsComponent.test.tsx
```

Expected: all pass.

- [ ] **Step 9: Visual smoke**

```bash
cd packages/editor && npm run dev &
sleep 5
~/.claude/skills/gstack/browse/dist/browse goto http://localhost:5050/
# Manual verify: open editor, switch to Pro mode, drop a component, right-click instance, click Detach, confirm 4-bullet modal appears
```

- [ ] **Step 10: Commit**

```bash
git add src/editor/sidebar/tabs/component-library/DetachConfirmModal.tsx \
        src/editor/sidebar/tabs/component-library/__tests__/DetachConfirmModal.test.tsx \
        src/editor/sidebar/tabs/component-library/ComponentDetailScreen.tsx \
        src/editor/canvas/hooks/useCanvasContextMenu.ts \
        src/editor/design-system/styles/ds-panel.css \
        src/engine/components/ComponentManager.ts
git commit -m "feat(components): DetachConfirmModal with 4 bullets + Pro-mode gate"
```

---

## Post-arc verification

After all 13 tasks land:

- [ ] Run full test suite: `cd packages/editor && npx vitest run`
- [ ] Type check: `cd packages/editor && npx tsc --noEmit`
- [ ] DS gate check: `cd packages/editor && pnpm run gate:ds-ssot`
- [ ] Visual smoke: replay 2026-05-15 audit screenshots; expect all 9 gaps closed
- [ ] Update spec status header to "Shipped" with commit hashes
- [ ] Log to memory: `project_ds_prototype_parity_arc_20260515.md`

## Risks recap

| Risk | Where it bites | Mitigation |
|------|---------------|-----------|
| `composer.designSystem.bindings` name conflicts w/ existing `composer.cms.bindings` | Task 3 Step 5 | use `composer.designSystem.styleBindings` instead |
| `contrastFix.ts` import direction (editor → engine via Composer) violates CLAUDE.md | Task 10 Step 6 | lift pure logic to `engine/designSystem/contrastFix.ts` first |
| Width-stack CSS regressions on TokensSection grid layouts | Task 4 Step 8 | ds-panel.css overrides grid-template-columns to 1fr inside panel |
| `useCanvasContextMenu` may not be the only menu definition | Task 12 Step 1 | grep first to confirm single source |
| Modal subscribers observe stale dsMode | Task 13 Step 6 | per `feedback_dsmode_provider_initial_first_mount.md`, subscribe to changes |
| FullPageRouter has multiple consumers | Task 4 Step 1 | inventory before deletion (per `feedback_inventory_before_deletion_wrappers.md`) |

## Memory file additions (post-arc)

Create `~/.claude/projects/.../memory/project_ds_prototype_parity_arc_20260515.md` with: 13 tasks shipped, layout-revert decision rationale, 3 new engine APIs (TokenUsageTracker / LintState / StyleBindingResolver), commit hashes.
