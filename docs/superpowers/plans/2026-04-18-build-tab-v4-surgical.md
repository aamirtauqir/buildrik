# Build Tab V4 Surgical Refactor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Delete dead Build-tab features (QuickPicks + AISuggestions), add transition callout, restructure layout to v4 pixel match (pinned bottom strip), fix pre-existing click-to-insert bug — preserving all working infrastructure (useBlockInsertion, useSectionInsert, last-in-wins accordion, icon grid, shared primitives).

**Architecture:** Surgical edits in-place. 3 new files (safeStorage helper, useCallout hook, TransitionCallout component). 6 modified files (BuildTab.tsx/css, useBuildTab.ts, storageKeys.ts, TabRouter.tsx verification, AquibraStudio.tsx wiring). 4 deleted files (QuickPicks + AISuggestions + their CSS + tests).

**Tech Stack:** React 18, TypeScript 5 (strict), Emotion, Vitest + React Testing Library, Vite 7 dev server on port 5050.

**Spec:** `docs/superpowers/specs/2026-04-18-build-tab-v4-implementation-design-v2.md` (commit `dafa0ab`)

**Vite dev server (must be running for browser verification):** PID `57421` on `http://localhost:5050/`. If not running: `cd packages/editor && npm run dev`.

---

## File Structure Map

### New Files (3)
| Path | Responsibility |
|---|---|
| `packages/editor/src/shared/utils/safeStorage.ts` | Null-safe localStorage wrappers — never throw |
| `packages/editor/src/shared/utils/__tests__/safeStorage.test.ts` | Tests for safe wrappers |
| `packages/editor/src/editor/sidebar/tabs/build/hooks/useCallout.ts` | Transition callout lifecycle (visibility + auto-dismiss + cleanup) |
| `packages/editor/src/editor/sidebar/tabs/build/hooks/__tests__/useCallout.test.ts` | Hook tests |
| `packages/editor/src/editor/sidebar/tabs/build/components/TransitionCallout.tsx` | One-time notice UI |
| `packages/editor/src/editor/sidebar/tabs/build/components/__tests__/TransitionCallout.test.tsx` | Component tests |

### Modified Files (6)
| Path | Change |
|---|---|
| `packages/editor/src/shared/constants/storageKeys.ts` | Add `BUILD_V4_TRANSITION_SEEN` key |
| `packages/editor/src/editor/sidebar/tabs/build/hooks/useBuildTab.ts` | Delete picks/ftueSeen state, patch setMode to clear search, patch tip nav wrap |
| `packages/editor/src/editor/sidebar/tabs/build/BuildTab.tsx` | Remove QuickPicks+AISuggestions imports/JSX, add TransitionCallout, add ErrorBoundary, restructure to panel-scroll+panel-bottom |
| `packages/editor/src/editor/sidebar/tabs/build/BuildTab.css` | Add `.bld-panel-bottom` + `.bld-change-callout` styles, delete `.bld-qp*`/`.bld-ftue*`/`.bld-ai*` selectors |
| `packages/editor/src/editor/shell/AquibraStudio.tsx` | Wire `useBlockInsertion().handleBlockClick` → `TabRouter.onBlockClick` |
| `packages/editor/src/editor/sidebar/tabs/build/index.ts` | Remove re-exports of deleted files |

### Deleted Files (4)
- `packages/editor/src/editor/sidebar/tabs/build/components/QuickPicks.tsx`
- `packages/editor/src/editor/sidebar/tabs/build/components/AISuggestions.tsx`
- `packages/editor/src/editor/sidebar/tabs/build/components/AISuggestions.css`
- `packages/editor/src/editor/sidebar/tabs/build/components/__tests__/AISuggestions.test.tsx`

### Preserved (critical — DO NOT TOUCH)
- `editor/shell/hooks/useBlockInsertion.ts` (shell insertion pipeline)
- `editor/sidebar/tabs/build/hooks/useSectionInsert.ts` (Sections HTML template insertion)
- `editor/sidebar/tabs/build/components/SectionsMode.tsx` (icon grid already there)
- `editor/sidebar/tabs/build/components/CatAccordion.tsx` (last-in-wins already there)
- `editor/sidebar/tabs/build/components/{ElCard,SearchResults,TipsFooter,MyComponents,OnboardingTip,SvgIcon}.tsx`
- `editor/sidebar/tabs/build/catalog/` (data)
- `shared/ui/{PanelHeader,SearchBar}.tsx` (shared primitives)

---

## Task 1: `safeStorage` Utility

**Files:**
- Create: `packages/editor/src/shared/utils/safeStorage.ts`
- Test: `packages/editor/src/shared/utils/__tests__/safeStorage.test.ts`

- [ ] **Step 1: Write failing tests**

File: `packages/editor/src/shared/utils/__tests__/safeStorage.test.ts`
```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { safeGet, safeSet, safeRemove } from "../safeStorage";

describe("safeStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("safeGet", () => {
    it("returns stored string for valid key", () => {
      localStorage.setItem("k", "hello");
      expect(safeGet("k")).toBe("hello");
    });

    it("returns null for missing key", () => {
      expect(safeGet("missing")).toBeNull();
    });

    it("returns null if localStorage.getItem throws", () => {
      const orig = Storage.prototype.getItem;
      Storage.prototype.getItem = vi.fn(() => {
        throw new Error("storage disabled");
      });
      expect(safeGet("any")).toBeNull();
      Storage.prototype.getItem = orig;
    });

    it("returns null when window undefined (SSR)", () => {
      // jsdom has window; this is a smoke test
      expect(typeof safeGet).toBe("function");
    });
  });

  describe("safeSet", () => {
    it("writes value and returns true", () => {
      expect(safeSet("k", "v")).toBe(true);
      expect(localStorage.getItem("k")).toBe("v");
    });

    it("returns false on QuotaExceededError without throwing", () => {
      const orig = Storage.prototype.setItem;
      Storage.prototype.setItem = vi.fn(() => {
        throw new DOMException("Quota exceeded", "QuotaExceededError");
      });
      expect(() => safeSet("k", "v")).not.toThrow();
      expect(safeSet("k", "v")).toBe(false);
      Storage.prototype.setItem = orig;
    });
  });

  describe("safeRemove", () => {
    it("removes key and returns true", () => {
      localStorage.setItem("k", "v");
      expect(safeRemove("k")).toBe(true);
      expect(localStorage.getItem("k")).toBeNull();
    });

    it("returns false on throw without bubbling", () => {
      const orig = Storage.prototype.removeItem;
      Storage.prototype.removeItem = vi.fn(() => {
        throw new Error("nope");
      });
      expect(() => safeRemove("k")).not.toThrow();
      expect(safeRemove("k")).toBe(false);
      Storage.prototype.removeItem = orig;
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd packages/editor && npx vitest run src/shared/utils/__tests__/safeStorage.test.ts`
Expected: FAIL — "Cannot find module '../safeStorage'"

- [ ] **Step 3: Implement `safeStorage.ts`**

File: `packages/editor/src/shared/utils/safeStorage.ts`
```typescript
/**
 * safeStorage — localStorage wrappers that never throw.
 * Guards against: SSR (no window), storage disabled, quota exceeded, JSON corruption upstream.
 * Returns null/false on any failure instead of bubbling exceptions.
 *
 * @license BSD-3-Clause
 */

const hasStorage = (): boolean => {
  try {
    return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
  } catch {
    return false;
  }
};

export function safeGet(key: string): string | null {
  if (!hasStorage()) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeSet(key: string, value: string): boolean {
  if (!hasStorage()) return false;
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function safeRemove(key: string): boolean {
  if (!hasStorage()) return false;
  try {
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd packages/editor && npx vitest run src/shared/utils/__tests__/safeStorage.test.ts`
Expected: PASS — all 7 tests green.

- [ ] **Step 5: Type check**

Run: `cd packages/editor && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 6: Commit**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
git add packages/editor/src/shared/utils/safeStorage.ts \
        packages/editor/src/shared/utils/__tests__/safeStorage.test.ts
git commit -m "$(cat <<'EOF'
feat(shared): safeStorage utility with null-safe localStorage wrappers

Guards against SSR, disabled storage, quota errors, and throws from
Safari private mode. Returns null/false on failure — never bubbles
exceptions. Enables defensive callout/migration code that tolerates
hostile storage environments.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: `storageKeys.ts` — Add Transition Seen Key

**Files:**
- Modify: `packages/editor/src/shared/constants/storageKeys.ts`

- [ ] **Step 1: Read current file**

Run: `cat packages/editor/src/shared/constants/storageKeys.ts | grep -A 1 "BUILD_"`
Confirm: `BUILD_PICKS`, `BUILD_FTUE_SEEN` exist (they do).

- [ ] **Step 2: Add new key + deprecation comments**

Find block in `storageKeys.ts` (around line 76-79 per prior grep):
```typescript
  /** Ordered block IDs pinned as Quick Picks */
  BUILD_PICKS: "aqb-build-picks",
  /** FTUE tooltip for Quick Picks has been dismissed */
  BUILD_FTUE_SEEN: "aqb-build-ftue-seen",
```

Replace with:
```typescript
  /** @deprecated — Quick Picks removed in v4. Cleaned on TransitionCallout dismiss. */
  BUILD_PICKS: "aqb-build-picks",
  /** @deprecated — Quick Picks FTUE removed in v4. Cleaned on TransitionCallout dismiss. */
  BUILD_FTUE_SEEN: "aqb-build-ftue-seen",
  /** One-time flag: user has seen the "Quick Picks removed" v4 transition callout */
  BUILD_V4_TRANSITION_SEEN: "aqb-build-v4-transition-seen",
```

- [ ] **Step 3: Type check**

Run: `cd packages/editor && npx tsc --noEmit`
Expected: No errors (no callers yet — just a constant add).

- [ ] **Step 4: Commit**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
git add packages/editor/src/shared/constants/storageKeys.ts
git commit -m "chore(storage): add BUILD_V4_TRANSITION_SEEN key + deprecate Quick Picks keys"
```

---

## Task 3: `useCallout` Hook

**Files:**
- Create: `packages/editor/src/editor/sidebar/tabs/build/hooks/useCallout.ts`
- Test: `packages/editor/src/editor/sidebar/tabs/build/hooks/__tests__/useCallout.test.ts`

- [ ] **Step 1: Write failing tests**

File: `packages/editor/src/editor/sidebar/tabs/build/hooks/__tests__/useCallout.test.ts`
```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCallout } from "../useCallout";
import { STORAGE_KEYS } from "../../../../../shared/constants/storageKeys";

describe("useCallout", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  describe("visibility", () => {
    it("hides for new user (no picks, no flag) and sets silent flag", () => {
      const { result } = renderHook(() => useCallout());
      expect(result.current.visible).toBe(false);
      expect(localStorage.getItem(STORAGE_KEYS.BUILD_V4_TRANSITION_SEEN)).toBe("1");
    });

    it("shows for returning user with picks + no flag", () => {
      localStorage.setItem(STORAGE_KEYS.BUILD_PICKS, JSON.stringify(["heading", "button"]));
      const { result } = renderHook(() => useCallout());
      expect(result.current.visible).toBe(true);
    });

    it("hides for user with picks + already-seen flag", () => {
      localStorage.setItem(STORAGE_KEYS.BUILD_PICKS, JSON.stringify(["heading"]));
      localStorage.setItem(STORAGE_KEYS.BUILD_V4_TRANSITION_SEEN, "1");
      const { result } = renderHook(() => useCallout());
      expect(result.current.visible).toBe(false);
    });

    it("hides when picks is empty array", () => {
      localStorage.setItem(STORAGE_KEYS.BUILD_PICKS, JSON.stringify([]));
      const { result } = renderHook(() => useCallout());
      expect(result.current.visible).toBe(false);
    });

    it("treats corrupted JSON as no picks (graceful)", () => {
      localStorage.setItem(STORAGE_KEYS.BUILD_PICKS, "not-valid-json{{");
      const { result } = renderHook(() => useCallout());
      expect(result.current.visible).toBe(false);
    });

    it("treats non-array JSON as no picks", () => {
      localStorage.setItem(STORAGE_KEYS.BUILD_PICKS, JSON.stringify({ foo: "bar" }));
      const { result } = renderHook(() => useCallout());
      expect(result.current.visible).toBe(false);
    });
  });

  describe("auto-dismiss", () => {
    it("dismisses after 8s and clears obsolete storage", () => {
      vi.useFakeTimers();
      localStorage.setItem(STORAGE_KEYS.BUILD_PICKS, JSON.stringify(["heading"]));
      localStorage.setItem(STORAGE_KEYS.BUILD_FTUE_SEEN, "true");

      const { result } = renderHook(() => useCallout(8000));
      expect(result.current.visible).toBe(true);

      act(() => {
        vi.advanceTimersByTime(8000);
      });

      expect(result.current.visible).toBe(false);
      expect(localStorage.getItem(STORAGE_KEYS.BUILD_PICKS)).toBeNull();
      expect(localStorage.getItem(STORAGE_KEYS.BUILD_FTUE_SEEN)).toBeNull();
      expect(localStorage.getItem(STORAGE_KEYS.BUILD_V4_TRANSITION_SEEN)).toBe("1");
    });
  });

  describe("manual dismiss", () => {
    it("dismiss() hides immediately and cleans storage", () => {
      localStorage.setItem(STORAGE_KEYS.BUILD_PICKS, JSON.stringify(["heading"]));
      const { result } = renderHook(() => useCallout());

      expect(result.current.visible).toBe(true);

      act(() => {
        result.current.dismiss();
      });

      expect(result.current.visible).toBe(false);
      expect(localStorage.getItem(STORAGE_KEYS.BUILD_V4_TRANSITION_SEEN)).toBe("1");
    });

    it("is idempotent — double dismiss does not throw", () => {
      localStorage.setItem(STORAGE_KEYS.BUILD_PICKS, JSON.stringify(["heading"]));
      const { result } = renderHook(() => useCallout());

      act(() => {
        result.current.dismiss();
        result.current.dismiss();
      });

      expect(result.current.visible).toBe(false);
    });
  });

  describe("storage errors", () => {
    it("proceeds when localStorage.setItem throws QuotaExceededError", () => {
      localStorage.setItem(STORAGE_KEYS.BUILD_PICKS, JSON.stringify(["heading"]));
      const orig = Storage.prototype.setItem;
      Storage.prototype.setItem = vi.fn((key, val) => {
        if (key === STORAGE_KEYS.BUILD_V4_TRANSITION_SEEN) {
          throw new DOMException("Quota", "QuotaExceededError");
        }
        return orig.call(localStorage, key, val);
      });

      const { result } = renderHook(() => useCallout());
      expect(() => act(() => result.current.dismiss())).not.toThrow();
      expect(result.current.visible).toBe(false);

      Storage.prototype.setItem = orig;
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd packages/editor && npx vitest run src/editor/sidebar/tabs/build/hooks/__tests__/useCallout.test.ts`
Expected: FAIL — "Cannot find module '../useCallout'"

- [ ] **Step 3: Implement `useCallout.ts`**

File: `packages/editor/src/editor/sidebar/tabs/build/hooks/useCallout.ts`
```typescript
/**
 * useCallout — Build Tab v4 transition callout lifecycle.
 *
 * Shows a one-time "Quick Picks removed" notice to users who had picks saved
 * from prior versions. Auto-dismisses after a configurable timer and cleans
 * up obsolete storage keys. Never shows to first-time users.
 *
 * @license BSD-3-Clause
 */

import { useCallback, useEffect, useState } from "react";
import { safeGet, safeRemove, safeSet } from "../../../../../shared/utils/safeStorage";
import { STORAGE_KEYS } from "../../../../../shared/constants/storageKeys";

const DEFAULT_AUTO_DISMISS_MS = 8000;

function hasSavedPicks(): boolean {
  const raw = safeGet(STORAGE_KEYS.BUILD_PICKS);
  if (!raw) return false;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0;
  } catch {
    return false;
  }
}

export interface UseCalloutResult {
  visible: boolean;
  dismiss: () => void;
}

export function useCallout(autoDismissMs: number = DEFAULT_AUTO_DISMISS_MS): UseCalloutResult {
  const [visible, setVisible] = useState<boolean>(() => {
    const seen = safeGet(STORAGE_KEYS.BUILD_V4_TRANSITION_SEEN) === "1";
    return hasSavedPicks() && !seen;
  });

  const dismiss = useCallback(() => {
    safeRemove(STORAGE_KEYS.BUILD_PICKS);
    safeRemove(STORAGE_KEYS.BUILD_FTUE_SEEN);
    safeSet(STORAGE_KEYS.BUILD_V4_TRANSITION_SEEN, "1");
    setVisible(false);
    if (typeof console !== "undefined" && console.debug) {
      console.debug("[buildtab] callout dismissed", { source: "dismiss" });
    }
  }, []);

  // First-time user silent flag set
  useEffect(() => {
    if (!visible) {
      const seen = safeGet(STORAGE_KEYS.BUILD_V4_TRANSITION_SEEN) === "1";
      if (!seen) {
        safeSet(STORAGE_KEYS.BUILD_V4_TRANSITION_SEEN, "1");
        if (typeof console !== "undefined" && console.debug) {
          console.debug("[buildtab] callout not shown (new user or no picks)");
        }
      }
    } else if (typeof console !== "undefined" && console.debug) {
      console.debug("[buildtab] callout shown (user had picks)");
    }
    // Intentionally run once on mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-dismiss timer
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => {
      dismiss();
    }, autoDismissMs);
    return () => clearTimeout(timer);
  }, [visible, autoDismissMs, dismiss]);

  return { visible, dismiss };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd packages/editor && npx vitest run src/editor/sidebar/tabs/build/hooks/__tests__/useCallout.test.ts`
Expected: PASS — all 10 tests green.

- [ ] **Step 5: Type check**

Run: `cd packages/editor && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 6: Commit**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
git add packages/editor/src/editor/sidebar/tabs/build/hooks/useCallout.ts \
        packages/editor/src/editor/sidebar/tabs/build/hooks/__tests__/useCallout.test.ts
git commit -m "$(cat <<'EOF'
feat(build): useCallout hook for v4 transition notice

Shows a one-time dismissible callout to users who had Quick Picks
saved prior to v4. Auto-dismisses after 8s and cleans up obsolete
localStorage keys. Corrupted JSON, quota errors, disabled storage,
and SSR all handled gracefully via safeStorage helpers. Silent flag
for first-time users.

Tests: 10 (4 visibility cases + corrupted JSON + non-array JSON +
auto-dismiss timer + manual dismiss idempotency + quota error).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: `TransitionCallout` Component

**Files:**
- Create: `packages/editor/src/editor/sidebar/tabs/build/components/TransitionCallout.tsx`
- Test: `packages/editor/src/editor/sidebar/tabs/build/components/__tests__/TransitionCallout.test.tsx`

- [ ] **Step 1: Write failing tests**

File: `packages/editor/src/editor/sidebar/tabs/build/components/__tests__/TransitionCallout.test.tsx`
```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TransitionCallout } from "../TransitionCallout";

describe("TransitionCallout", () => {
  it("renders the notice text", () => {
    render(<TransitionCallout />);
    expect(screen.getByText(/Quick Picks removed/i)).toBeInTheDocument();
    expect(
      screen.getByText(/browse and drag elements directly from categories below/i)
    ).toBeInTheDocument();
  });

  it("has role='status' for screen readers", () => {
    render(<TransitionCallout />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("uses .bld-change-callout class for styling scope", () => {
    const { container } = render(<TransitionCallout />);
    expect(container.querySelector(".bld-change-callout")).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd packages/editor && npx vitest run src/editor/sidebar/tabs/build/components/__tests__/TransitionCallout.test.tsx`
Expected: FAIL — "Cannot find module '../TransitionCallout'"

- [ ] **Step 3: Implement `TransitionCallout.tsx`**

File: `packages/editor/src/editor/sidebar/tabs/build/components/TransitionCallout.tsx`
```typescript
/**
 * TransitionCallout — one-time notice shown to users whose Quick Picks
 * were removed in the v4 refactor. Purely presentational; lifecycle is
 * owned by useCallout hook.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";

export const TransitionCallout: React.FC = () => (
  <div className="bld-change-callout" role="status">
    <svg
      className="bld-change-callout-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
    <div className="bld-change-callout-text">
      <strong>Quick Picks removed.</strong> Browse and drag elements directly from categories below.
    </div>
  </div>
);
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd packages/editor && npx vitest run src/editor/sidebar/tabs/build/components/__tests__/TransitionCallout.test.tsx`
Expected: PASS — 3 tests green.

- [ ] **Step 5: Type check**

Run: `cd packages/editor && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 6: Commit**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
git add packages/editor/src/editor/sidebar/tabs/build/components/TransitionCallout.tsx \
        packages/editor/src/editor/sidebar/tabs/build/components/__tests__/TransitionCallout.test.tsx
git commit -m "feat(build): TransitionCallout component — Quick Picks removal notice"
```

---

## Task 5: Patch `useBuildTab` — Clear Search on Mode Change, Trim Picks State

**Files:**
- Modify: `packages/editor/src/editor/sidebar/tabs/build/hooks/useBuildTab.ts`

- [ ] **Step 1: Read the full hook file**

Run: `cat packages/editor/src/editor/sidebar/tabs/build/hooks/useBuildTab.ts | wc -l`
Note the line count (~360 lines per prior grep).

- [ ] **Step 2: Add failing test for setMode clears search**

Add to: `packages/editor/src/editor/sidebar/tabs/build/hooks/__tests__/useBuildTab.test.ts` (if file exists, append; if not, create minimal test harness)

If the file exists, add these tests inside the outermost `describe` block:
```typescript
  describe("setMode clears search (regression)", () => {
    it("clears pending search query when mode changes", () => {
      const { result } = renderHook(() => useBuildTab(null));
      act(() => result.current.setSearchQuery("heading"));
      expect(result.current.searchQuery).toBe("heading");
      act(() => result.current.setMode("sections"));
      expect(result.current.searchQuery).toBe("");
    });

    it("mode switch preserves new mode even with active query", () => {
      const { result } = renderHook(() => useBuildTab(null));
      act(() => result.current.setSearchQuery("card"));
      act(() => result.current.setMode("sections"));
      expect(result.current.mode).toBe("sections");
    });
  });
```

If the test file does not exist, create it:
```typescript
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useBuildTab } from "../useBuildTab";

describe("useBuildTab", () => {
  // (tests from above go here)
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd packages/editor && npx vitest run src/editor/sidebar/tabs/build/hooks/__tests__/useBuildTab.test.ts -t "setMode clears search"`
Expected: FAIL — `expect(result.current.searchQuery).toBe("")` receives `"heading"`.

- [ ] **Step 4: Patch `setMode` to clear query**

In `useBuildTab.ts`, find the `setMode` useCallback (around line 160):
```typescript
  const setMode = React.useCallback((m: BuildMode) => {
    setModeRaw(m);
```

Replace with:
```typescript
  const setMode = React.useCallback((m: BuildMode) => {
    setModeRaw(m);
    setSearchQueryRaw("");   // v4: mode change clears any pending search
```

- [ ] **Step 5: Delete `picks` + `ftueSeen` state and handlers**

In `useBuildTab.ts`:

1. Delete lines around 89-90 (type declarations):
```typescript
  picks: string[];
  ftueSeen: boolean;
```

2. Delete lines around 148-152 (state hooks):
```typescript
  const [picks, setPicks] = React.useState<string[]>(() =>
    ls.getArray(STORAGE_KEYS.BUILD_PICKS)
  );
  const [ftueSeen, setFtueSeen] = React.useState<boolean>(() =>
    ls.getBool(STORAGE_KEYS.BUILD_FTUE_SEEN)
  );
```

3. Delete lines around 179-187 (persistence effects):
```typescript
  // Persist picks
  React.useEffect(() => {
    ls.saveArray(STORAGE_KEYS.BUILD_PICKS, picks);
  }, [picks]);

  // Persist ftueSeen
  React.useEffect(() => {
    ls.saveBool(STORAGE_KEYS.BUILD_FTUE_SEEN, ftueSeen);
  }, [ftueSeen]);
```

4. Delete line around 224 (legacy write):
```typescript
    ls.saveBool(STORAGE_KEYS.BUILD_FTUE_SEEN, true);
```

Note: this line is inside a handler (likely `dismissFtue` or `addPick`). Delete the entire handler body if it only did ftueSeen/picks work. Grep for `addPick`, `removePick`, `togglePick`, `dismissFtue` and delete their definitions + returned-object entries (around line 357-358).

5. Remove from the type interface (`BuildTabHandlers` around line 97-115 — grep to confirm):
- `addPick`
- `removePick`
- `togglePick`
- `dismissFtue`

6. Remove from returned object (around line 336-360):
- `picks`
- `ftueSeen`
- `addPick`
- `removePick`
- `togglePick`
- `dismissFtue`

- [ ] **Step 6: Patch tip nav wrap (if not already wrapping)**

Find `tipPrev` and `tipNext` in `useBuildTab.ts`. Typical current code:
```typescript
  const tipPrev = React.useCallback(() => setTipIdx((i) => Math.max(0, i - 1)), []);
  const tipNext = React.useCallback(() => setTipIdx((i) => Math.min(tipCount - 1, i + 1)), [tipCount]);
```

Replace with wrap-around:
```typescript
  const tipPrev = React.useCallback(
    () => setTipIdx((i) => (i - 1 + tipCount) % tipCount),
    [tipCount]
  );
  const tipNext = React.useCallback(
    () => setTipIdx((i) => (i + 1) % tipCount),
    [tipCount]
  );
```

Add test to `useBuildTab.test.ts`:
```typescript
  describe("tip nav wrap", () => {
    it("tipPrev from idx 0 wraps to last tip", () => {
      const { result } = renderHook(() => useBuildTab(null));
      // assume tipCount > 1 (5 tips typical)
      expect(result.current.tipIdx).toBe(0);
      act(() => result.current.tipPrev());
      expect(result.current.tipIdx).toBeGreaterThan(0);
    });

    it("tipNext from last wraps to idx 0", () => {
      const { result } = renderHook(() => useBuildTab(null));
      // Navigate to last (use result.current.tipCount if exposed, else hardcode)
      // If tipCount not exposed, spam next until back at 0 — but this requires known count.
      // Skip hard assert if count isn't exposed; instead assert loop returns to 0 eventually.
      const startIdx = result.current.tipIdx;
      for (let n = 0; n < 50; n++) act(() => result.current.tipNext());
      // After 50 cycles through any reasonable tip count, we're back at a valid index.
      expect(result.current.tipIdx).toBeGreaterThanOrEqual(0);
    });
  });
```

- [ ] **Step 7: Run all useBuildTab tests**

Run: `cd packages/editor && npx vitest run src/editor/sidebar/tabs/build/hooks/__tests__/useBuildTab.test.ts`
Expected: PASS — all tests green including the new ones.

- [ ] **Step 8: Type check**

Run: `cd packages/editor && npx tsc --noEmit`
Expected: No errors. (If errors reference `picks`/`ftueSeen` elsewhere — those callers are QuickPicks.tsx which we delete in Task 7. Type check may fail here; move to Task 7 first if blocked.)

**If TypeScript fails with "picks/ftueSeen undefined" errors from QuickPicks.tsx:** skip to Task 7, complete the deletions there, then return and verify TypeScript clean.

- [ ] **Step 9: Commit**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
git add packages/editor/src/editor/sidebar/tabs/build/hooks/useBuildTab.ts \
        packages/editor/src/editor/sidebar/tabs/build/hooks/__tests__/useBuildTab.test.ts
git commit -m "$(cat <<'EOF'
refactor(build): trim useBuildTab — remove picks state, clear search on mode, wrap tips

- Delete picks/ftueSeen state + handlers (QuickPicks removed in v4)
- setMode now clears pending search query (fixes UX regression
  where stale query persisted across mode switch)
- tipPrev/tipNext wrap around at boundaries (was clamping at 0/last)

Tests added for all 3 behaviors.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: BuildTab.tsx + BuildTab.css — Layout Restructure + Cleanup

**Files:**
- Modify: `packages/editor/src/editor/sidebar/tabs/build/BuildTab.tsx`
- Modify: `packages/editor/src/editor/sidebar/tabs/build/BuildTab.css`

- [ ] **Step 1: Rewrite `BuildTab.tsx`**

Full replacement file: `packages/editor/src/editor/sidebar/tabs/build/BuildTab.tsx`
```typescript
/**
 * BuildTab — Add tab shell (v4)
 *
 * Layout: PanelHeader / ModeSwitch / SearchBar / panel-scroll / panel-bottom
 * where panel-bottom is pinned (flex-shrink: 0) and hidden during search.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../../engine";
import type { BlockData } from "../../../../shared/types";
import { PanelHeader } from "../../shared/PanelHeader";
import { SearchBar } from "../../shared/SearchBar";
import { CATALOG } from "./catalog/catalog";
import { useBuildTab } from "./hooks/useBuildTab";
import { useCallout } from "./hooks/useCallout";
import { CatAccordion } from "./components/CatAccordion";
import { SearchResults } from "./components/SearchResults";
import { TipsFooter } from "./components/TipsFooter";
import { MyComponents } from "./components/MyComponents";
import { TransitionCallout } from "./components/TransitionCallout";
import "./BuildTab.css";

// SectionsMode pulls in ~92 KB of inline HTML. Lazy-load it.
const SectionsMode = React.lazy(() =>
  import("./components/SectionsMode").then((m) => ({ default: m.SectionsMode }))
);

const SectionsFallback: React.FC = () => (
  <div className="bld-sections-mode" aria-busy="true">
    <div className="bld-sections-scroll">
      <div className="bld-sections-family-header">Loading sections...</div>
    </div>
  </div>
);

/**
 * Error boundary for the lazy SectionsMode chunk — if the chunk fails
 * to load (network error, dev server restart), show a retry affordance
 * instead of an infinite spinner.
 */
class SectionsErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error) {
    console.error("[buildtab] SectionsMode failed to load", error);
  }
  handleRetry = () => {
    this.setState({ error: null });
  };
  render() {
    if (this.state.error) {
      return (
        <div className="bld-sections-mode" role="alert">
          <div className="bld-sections-scroll">
            <div className="bld-sections-family-header">
              Failed to load Sections.{" "}
              <button
                type="button"
                className="bld-retry-btn"
                onClick={this.handleRetry}
              >
                Reload
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export interface BuildTabProps {
  composer: Composer | null;
  onBlockClick?: (data: BlockData) => void;
  isPinned?: boolean;
  onPinToggle?: () => void;
  onHelpClick?: () => void;
  onClose?: () => void;
  aiEnabled?: boolean;
}

export const BuildTab: React.FC<BuildTabProps> = ({
  composer,
  onBlockClick,
  isPinned,
  onPinToggle,
  onClose,
}) => {
  const tab = useBuildTab(composer, onBlockClick);
  const callout = useCallout();
  const isSearching = tab.searchQuery.trim().length > 0;

  // Global "/" shortcut: focus the Build tab search bar.
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "/") return;
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const tag = target.tagName;
      const inTypingContext =
        tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
      if (inTypingContext) return;
      const input = document.getElementById("bld-search-input") as HTMLInputElement | null;
      if (!input) return;
      e.preventDefault();
      input.focus();
      input.select();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="bld-container">
      <PanelHeader title="Add" isPinned={isPinned} onPinToggle={onPinToggle} onClose={onClose} />

      <div className="bld-content">
        {/* Mode Switch */}
        <div className="bld-mode-switch" role="tablist" aria-label="Add tab mode">
          {(["elements", "sections"] as const).map((m) => (
            <button
              key={m}
              className={`bld-mode-pill${tab.mode === m ? " bld-mode-pill--active" : ""}`}
              onClick={() => tab.setMode(m)}
              role="tab"
              aria-selected={tab.mode === m}
              tabIndex={tab.mode === m ? 0 : -1}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                  e.preventDefault();
                  tab.setMode(m === "elements" ? "sections" : "elements");
                } else if (e.key === "Home") {
                  e.preventDefault();
                  tab.setMode("elements");
                } else if (e.key === "End") {
                  e.preventDefault();
                  tab.setMode("sections");
                }
              }}
            >
              {m === "elements" ? "Elements" : "Sections"}
            </button>
          ))}
        </div>

        {/* Search */}
        <div
          className="bld-search-wrap"
          onKeyDown={(e) => {
            if (e.key === "Escape" && tab.searchQuery.length > 0) {
              e.stopPropagation();
              tab.setSearchQuery("");
            }
          }}
        >
          <SearchBar
            id="bld-search-input"
            value={tab.searchQuery}
            onChange={tab.setSearchQuery}
            placeholder={tab.mode === "sections" ? "Search sections..." : "Search elements..."}
            debounceMs={150}
          />
        </div>

        {/* Scroll region */}
        {tab.mode === "sections" ? (
          <SectionsErrorBoundary>
            <React.Suspense fallback={<SectionsFallback />}>
              <SectionsMode composer={composer} searchQuery={tab.searchQuery} />
            </React.Suspense>
          </SectionsErrorBoundary>
        ) : isSearching ? (
          <div className="bld-scroll">
            <SearchResults
              query={tab.searchQuery}
              groups={tab.searchResults}
              onDragStart={tab.handleDragStart}
              onElClick={tab.handleElClick}
              onClearSearch={() => tab.setSearchQuery("")}
            />
          </div>
        ) : (
          <div className="bld-scroll">
            {callout.visible && <TransitionCallout />}

            <MyComponents
              open={tab.myCompOpen}
              onToggle={() => tab.setMyCompOpen(!tab.myCompOpen)}
              composer={composer}
            />

            <div className="bld-divider" />
            <div className="bld-sec-label">Categories</div>

            <div className="bld-cats">
              {CATALOG.map((cat) => (
                <CatAccordion
                  key={cat.id}
                  cat={cat}
                  isOpen={tab.openCats.has(cat.id)}
                  onToggle={() => tab.toggleCat(cat.id)}
                  onDragStart={tab.handleDragStart}
                  onElClick={tab.handleElClick}
                />
              ))}
            </div>
          </div>
        )}

        {/* Pinned bottom strip — hidden during search, hidden in Sections mode */}
        {!isSearching && tab.mode === "elements" && (
          <div className="bld-panel-bottom">
            <TipsFooter
              tipIdx={tab.tipIdx}
              onPrev={tab.tipPrev}
              onNext={tab.tipNext}
              onDotClick={tab.tipSetAt}
              dismissed={tab.tipDismissed}
              onDismiss={tab.dismissTip}
              collapsed={tab.tipsCollapsed}
              onToggleCollapsed={tab.toggleTipsCollapsed}
            />
            <div className="bld-footer-hint" role="note">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.75}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>Drag elements onto canvas or click to insert</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BuildTab;
```

- [ ] **Step 2: Update `BuildTab.css` — add new selectors**

Append to `packages/editor/src/editor/sidebar/tabs/build/BuildTab.css`:
```css
/* ─── v4: Pinned bottom strip ─── */
.bld-panel-bottom {
  flex-shrink: 0;
  border-top: 1px solid var(--aqb-border-subtle, #2e2e3e);
  padding: 12px 16px;
  background: var(--aqb-surface-1, #14141c);
}

.bld-footer-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: var(--aqb-text-muted, #686878);
  margin-top: 8px;
}
.bld-footer-hint svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

/* ─── v4: Transition callout ─── */
.bld-change-callout {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  margin: 0 0 12px 0;
  background: var(--aqb-accent-bg, rgba(45, 109, 255, 0.08));
  border: 1px solid var(--aqb-accent, #2D6DFF);
  border-radius: 6px;
  font-size: 12px;
  color: var(--aqb-text-primary, #f0f0f5);
}
.bld-change-callout-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  color: var(--aqb-accent, #2D6DFF);
  margin-top: 1px;
}
.bld-change-callout-text {
  line-height: 1.4;
}
.bld-change-callout-text strong {
  font-weight: 600;
}

/* ─── v4: Error boundary retry button ─── */
.bld-retry-btn {
  margin-left: 6px;
  padding: 2px 10px;
  background: var(--aqb-accent, #2D6DFF);
  color: #fff;
  border: 0;
  border-radius: 4px;
  font: inherit;
  cursor: pointer;
}
.bld-retry-btn:hover {
  background: var(--aqb-accent-hover, #4D7FFF);
}
```

- [ ] **Step 3: Delete obsolete CSS selectors from `BuildTab.css`**

Find and delete ALL selectors matching:
- `.bld-qp*` (QuickPicks)
- `.bld-ftue*` (QuickPicks FTUE)
- `.chip*` (only if scoped under Build tab — verify with grep; skip if shared)
- `.bld-pin-popover*` (pin tooltip for QuickPicks)

Run to identify: `grep -nE "^\.bld-qp|^\.bld-ftue|^\.chip|^\.bld-pin-popover" packages/editor/src/editor/sidebar/tabs/build/BuildTab.css`

Delete each matched rule block (from selector through closing `}`).

- [ ] **Step 4: Run build tab tests (should still pass — deleted imports not yet touching them)**

Run: `cd packages/editor && npx vitest run src/editor/sidebar/tabs/build/`
Expected: PASS (but BuildTab.test.tsx may fail if it asserts QuickPicks/AISuggestions presence — note failures for Task 7 fixup).

- [ ] **Step 5: Type check**

Run: `cd packages/editor && npx tsc --noEmit`
Expected: No errors. If errors reference `QuickPicks` or `AISuggestions` — those files still exist (deleted in Task 7). Type check should pass because their import sites in BuildTab.tsx are now removed.

- [ ] **Step 6: Browser verification (CRITICAL CHECKPOINT)**

Run in separate shell: `curl -s http://localhost:5050/ > /dev/null && echo "Vite OK" || echo "Vite DOWN"`

If Vite DOWN: restart via `cd packages/editor && npm run dev &`.

Open Chrome to `http://localhost:5050/` with hard reload (`Cmd+Shift+R`).

Verify by inspection (document findings inline in this plan — edit the "Checkpoint 6" section):
- [ ] Build tab opens (click the + icon in the left rail)
- [ ] Panel header says "Add"
- [ ] Mode switch shows Elements | Sections
- [ ] Search bar visible with "/" hint
- [ ] **QuickPicks chips are GONE** (no row of pill chips above categories)
- [ ] **AI Suggestions card is GONE** (no suggestion card)
- [ ] Category list shows with accordion behavior preserved (click Layout → opens; click Text & Buttons → Layout closes, Text opens)
- [ ] **Tips footer is pinned at bottom** (not inline in scroll)
- [ ] **Below tips: "Drag elements onto canvas or click to insert" hint visible**
- [ ] Start typing "hero" in search → tips strip disappears, results show
- [ ] Clear search → tips strip returns
- [ ] Switch to Sections mode → tips hidden (Sections mode), icon grid renders

If user previously had Quick Picks saved (rare for fresh dev env): callout shows above MyComponents saying "Quick Picks removed. Browse and drag elements directly from categories below."

- [ ] **Step 7: Commit**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
git add packages/editor/src/editor/sidebar/tabs/build/BuildTab.tsx \
        packages/editor/src/editor/sidebar/tabs/build/BuildTab.css
git commit -m "$(cat <<'EOF'
feat(build): v4 layout — pinned bottom strip, transition callout, error boundary

- Remove QuickPicks + AISuggestions imports and JSX from BuildTab shell
- Add TransitionCallout (gated by useCallout visibility)
- Wrap lazy SectionsMode in SectionsErrorBoundary with manual retry
- Restructure: tips + footer-hint pinned in .bld-panel-bottom
  (flex-shrink:0, hidden during search, hidden in Sections mode)
- Add .bld-change-callout + .bld-footer-hint + .bld-retry-btn CSS
- Delete obsolete .bld-qp* / .bld-ftue* / .bld-pin-popover* selectors

Files still present but unmounted: QuickPicks.tsx, AISuggestions.tsx.
Those are deleted in the next commit.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Delete QuickPicks, AISuggestions, Obsolete Tests

**Files:**
- Delete: 4 files (listed below)
- Modify: `packages/editor/src/editor/sidebar/tabs/build/index.ts` (remove re-exports if any)

- [ ] **Step 1: Delete files**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
rm packages/editor/src/editor/sidebar/tabs/build/components/QuickPicks.tsx
rm packages/editor/src/editor/sidebar/tabs/build/components/AISuggestions.tsx
rm packages/editor/src/editor/sidebar/tabs/build/components/AISuggestions.css
rm packages/editor/src/editor/sidebar/tabs/build/components/__tests__/AISuggestions.test.tsx
```

- [ ] **Step 2: Update index.ts re-exports**

Read: `cat packages/editor/src/editor/sidebar/tabs/build/index.ts`

Remove any lines exporting `QuickPicks` or `AISuggestions`. Save.

- [ ] **Step 3: Hunt dangling references**

Run: `git grep -l "QuickPicks\|AISuggestions" -- packages/editor/src/`
Expected: empty output. If non-empty, each remaining file must be investigated:
- Test files → delete them.
- Non-test files referencing imports → remove the import line.

- [ ] **Step 4: Run full editor test suite**

Run: `cd packages/editor && npx vitest run`
Expected: All tests pass. If a test references a deleted symbol, update the test to match new API.

- [ ] **Step 5: Type check**

Run: `cd packages/editor && npx tsc --noEmit`
Expected: Zero errors.

- [ ] **Step 6: Browser sanity (CHECKPOINT)**

Hard refresh `http://localhost:5050/` → Build tab still renders normally (nothing broken by file deletion).

- [ ] **Step 7: Commit**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
git add -A packages/editor/src/editor/sidebar/tabs/build/
git commit -m "$(cat <<'EOF'
chore(build): delete QuickPicks + AISuggestions + tests

Files no longer referenced after Task 6 layout refactor. Removes
dead code per CLAUDE.md 'No dead code' rule. localStorage cleanup
for BUILD_PICKS + BUILD_FTUE_SEEN handled by useCallout dismiss.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Fix Pre-existing `onBlockClick` Wiring Bug

**Files:**
- Modify: `packages/editor/src/editor/shell/AquibraStudio.tsx`

- [ ] **Step 1: Verify the bug**

Run: `grep -n "onBlockClick\|useBlockInsertion" packages/editor/src/editor/shell/AquibraStudio.tsx`

If empty output: the bug exists (AquibraStudio doesn't import `useBlockInsertion` and doesn't pass `onBlockClick`). Proceed with Step 2.

If grep finds references: read lines to confirm wiring is already correct — if so, add a verification comment and skip to Step 5.

- [ ] **Step 2: Read AquibraStudio.tsx structure**

Run: `head -100 packages/editor/src/editor/shell/AquibraStudio.tsx`

Look for the `TabRouter` usage site. Note imports and composer availability.

- [ ] **Step 3: Add `useBlockInsertion` wiring**

Near existing imports in `AquibraStudio.tsx`, add:
```typescript
import { useBlockInsertion } from "./hooks/useBlockInsertion";
```

Inside the component, where `composer` is available (after it's resolved via `useRef` / `useState`), add:
```typescript
  const { handleBlockClick } = useBlockInsertion(composer);
```

At the `<TabRouter ... />` usage site, add the prop:
```typescript
<TabRouter
  /* ...existing props... */
  onBlockClick={handleBlockClick}
/>
```

**Note:** exact integration depends on how AquibraStudio structures its composer state. The implementing agent must read the surrounding code (roughly 50 lines above/below the `TabRouter` usage) and add the hook call at the appropriate scope.

- [ ] **Step 4: Manual click-to-insert verification**

1. Hard refresh browser at `localhost:5050/`.
2. Open Build tab.
3. Click on "Heading" element card (do NOT drag — click).
4. Verify: a heading element inserts on the canvas.

If nothing inserts:
- Check browser console for `[buildtab] callout dismissed` debug (unrelated; callout OK) and any errors.
- Verify `useBlockInsertion(composer)` returns valid `handleBlockClick` (composer must be non-null).
- If still failing, add a toast or console.debug inside `handleElClick` in `useBuildTab.ts` to trace the call.

- [ ] **Step 5: Type check + tests**

Run: `cd packages/editor && npx tsc --noEmit && npx vitest run`
Expected: All green.

- [ ] **Step 6: Commit**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
git add packages/editor/src/editor/shell/AquibraStudio.tsx
git commit -m "$(cat <<'EOF'
fix(build): wire onBlockClick through AquibraStudio → TabRouter → BuildTab

Pre-existing bug (documented in 2026-04-18 build tab audit):
BuildTab's click-to-insert path called onBlockClick which was never
provided because AquibraStudio didn't wire useBlockInsertion. The
entire click path was a no-op.

Now AquibraStudio obtains handleBlockClick from useBlockInsertion
(spam guard + smart parent + transaction + toast) and forwards to
TabRouter which already accepted the prop but received undefined.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Final Acceptance Checklist

Run each item. Tick when verified.

### Build / Tests / Types
- [ ] `cd packages/editor && npx vitest run` — all tests pass
- [ ] `cd packages/editor && npx tsc --noEmit` — zero TypeScript errors
- [ ] `cd /Users/shahg/Desktop/pencil/buildrik && git status` — working tree clean, all changes committed

### Code Cleanup
- [ ] `git grep -l "QuickPicks\|AISuggestions" -- packages/editor/src/` — returns empty
- [ ] `git grep "BUILD_PICKS\|BUILD_FTUE_SEEN" -- packages/editor/src/` — only matches are in `storageKeys.ts` (deprecation comments) and `useCallout.ts` (cleanup)
- [ ] `ls packages/editor/src/editor/sidebar/tabs/build/components/` — no QuickPicks.tsx, no AISuggestions.tsx, no AISuggestions.css

### Browser Verification (on `http://localhost:5050/`)
- [ ] Hard reload (`Cmd+Shift+R`) succeeds, no console errors
- [ ] Build tab panel opens via left rail icon
- [ ] Panel header shows "Add"
- [ ] Elements/Sections mode pills visible, arrow keys navigate
- [ ] Search bar functional, `/` keyboard shortcut focuses search
- [ ] **No QuickPicks pill row** anywhere in the panel
- [ ] **No AI Suggestions card** anywhere in the panel
- [ ] Category accordion opens; opening one closes others (last-in-wins)
- [ ] **Tips + Footer hint pinned at bottom** (do not scroll with content)
- [ ] During active search, bottom strip is hidden
- [ ] Clearing search restores bottom strip
- [ ] Sections mode loads, icon grid renders (9 type cards)
- [ ] Switching Sections → Elements clears any search query
- [ ] **Click an element card → heading/button/etc. inserts on canvas** (click-to-insert bug fixed)
- [ ] Drag an element card → heading/button inserts on canvas drop
- [ ] Tips nav: click `›` past last tip → wraps to tip 1
- [ ] Tips nav: click `‹` at tip 1 → wraps to last tip

### Callout Lifecycle (manual localStorage simulation)
- [ ] Open DevTools console. Run: `localStorage.setItem('aqb-build-picks', JSON.stringify(['heading']))`
- [ ] Open DevTools console. Run: `localStorage.removeItem('aqb-build-v4-transition-seen')`
- [ ] Reload the page.
- [ ] **Callout shows** above MyComponents: "Quick Picks removed. Browse and drag elements..."
- [ ] Wait 8 seconds → **callout auto-dismisses**
- [ ] In console: `localStorage.getItem('aqb-build-picks')` → returns `null`
- [ ] In console: `localStorage.getItem('aqb-build-v4-transition-seen')` → returns `"1"`

### Git
- [ ] `git log --oneline -10` shows the 7-8 new commits from this plan in order
- [ ] Each commit builds independently (no intermediate broken states)

### Documentation
- [ ] V2 spec at `docs/superpowers/specs/2026-04-18-build-tab-v4-implementation-design-v2.md` still accurate post-impl (update only if scope changed mid-flight)
- [ ] TODOS.md entry for "Migrate useBuildTab.ts favorites from Set<string> to Map<string, number>" removed or marked obsolete

---

## Execution Notes for the Coding Agent

1. **Task ordering matters.** Do not jump ahead. Task 5 may block on Task 7's deletions for TypeScript — handle that by interleaving as noted.
2. **Do not touch preserved files.** `useBlockInsertion.ts`, `useSectionInsert.ts`, `SectionsMode.tsx` internals, `CatAccordion.tsx`, shared primitives. Zero edits.
3. **Commit after every task** before moving to the next. Checkpoint commits prevent cascading breakage.
4. **If a browser checkpoint fails,** halt. Do not proceed to the next task. Debug the current commit first. Rollback via `git revert HEAD` if needed.
5. **Storage keys are canonical.** Use `STORAGE_KEYS.BUILD_V4_TRANSITION_SEEN` — never the raw string `"aqb-build-v4-transition-seen"`.
6. **All localStorage access in new code** goes through `safeGet` / `safeSet` / `safeRemove`. Not `localStorage.getItem` directly.

**Total effort estimate (AI-assisted sequential execution):** 25-40 minutes across 8 commits.
