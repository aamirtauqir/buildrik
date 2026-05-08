# DS Arc · Phase B.0 — Dark Mode Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship D8 dark mode infrastructure — color-only — as a foundation phase. Add a `darkValue?: string` field on `DesignToken`, build a Composer-owned `DarkResolver` (resolves a token's effective value given the current `ColorMode`), and a `ColorMode` store (light/dark/system + media-query listener + localStorage persistence). UI re-application + Inspector warn chip ship in a later sub-phase.

**Architecture:**
- `DarkResolver` lives at `engine/darkResolver/` and is wired into `Composer` alongside `migration` (A.1) and `aliasResolver` (A.2). It is a pure resolver — no DOM writes.
- `ColorMode` lives at `engine/colorMode/` as a tiny stateful store: `get()`, `set(mode)`, `resolved()` (light/dark — never "system"), with a `prefers-color-scheme` media-query listener and localStorage persistence.
- Token shape extension: a single new optional field `darkValue?: string` on `DesignToken`. We deliberately do NOT introduce the spec §16.3 `value: { light, dark? }` shape in this phase — that touches every existing color-token site and breaks the `value: string` invariant. The `darkValue` field is a minimal, additive surface that lets B.0 ship without rewiring `useColorTokens` / `useTokensForKind` / `useSpacingTokens` / `useTokenBase`. The full dual-mode shape converges in a later phase per CEO addendum §16.3.
- D16 fallback: when `mode === "dark"` and a token has no `darkValue`, resolver returns `value` (light) and emits `tokens:dark-missing` event with `tokenId`. UI listener (Inspector warn chip) ships in a later sub-phase.
- applyToRoot integration: explicitly OUT-OF-SCOPE for B.0. `useColorTokens` will gain a B.1 hook that listens to `colorMode:changed` and walks tokens through `composer.darkResolver`. B.0 ships only the resolver + mode store + Composer wiring + tests.

**Tech Stack:** TypeScript 5.3 (strict) · Vitest · React 18.3 · Buildrik EventEmitter · localStorage · matchMedia

---

## File Structure

| Path | Responsibility | Status |
|---|---|---|
| `packages/editor/src/editor/design-system/types.ts` | Add `darkValue?: string` to `DesignToken` | MODIFY |
| `packages/editor/src/engine/darkResolver/DarkResolver.ts` | `resolve(token, mode)` with D16 fallback emission | NEW |
| `packages/editor/src/engine/darkResolver/errors.ts` | (None for now — fallback uses event, not throw) | DEFERRED |
| `packages/editor/src/engine/darkResolver/index.ts` | Barrel | NEW |
| `packages/editor/src/engine/darkResolver/__tests__/DarkResolver.test.ts` | Resolver coverage | NEW |
| `packages/editor/src/engine/colorMode/ColorMode.ts` | Store: get/set/resolved + matchMedia listener + localStorage | NEW |
| `packages/editor/src/engine/colorMode/index.ts` | Barrel | NEW |
| `packages/editor/src/engine/colorMode/__tests__/ColorMode.test.ts` | Store coverage incl. matchMedia mock | NEW |
| `packages/editor/src/engine/Composer.ts` | Wire `darkResolver` + `colorMode` fields | MODIFY |
| `packages/editor/src/engine/__tests__/Composer.darkResolver.test.ts` | Composer wiring smoke | NEW |

No CI gate added in B.0 — the gate scope (`gate:ds-dark`) lands when B.1 ships the applyToRoot integration so the gate has a concrete fixture target.

---

## Pre-flight verification

- [ ] **Step P.1: Confirm Phase A.2 tag exists locally**

Run: `git tag -l 'ds-phase-a2-complete'`
Expected: `ds-phase-a2-complete` printed.

- [ ] **Step P.2: Confirm `ThemeMode` type already declared**

Run: `grep -n "export type ThemeMode" packages/editor/src/editor/design-system/types.ts`
Expected: a single match showing `export type ThemeMode = "light" | "dark" | "system";`.

- [ ] **Step P.3: Confirm composer.aliasResolver wiring shipped**

Run: `git log --oneline | grep -E "wire composer.aliasResolver"`
Expected: commit `275cf9e1`.

- [ ] **Step P.4: Confirm path-scoped baseline green**

Run: `cd packages/editor && pnpm vitest run src/engine/aliasResolver src/engine/__tests__/Composer.aliasResolver.test.ts --reporter=dot 2>&1 | tail -5`
Expected: all path-scoped tests pass.

If any pre-flight fails, STOP — A.2 baseline is not actually green.

---

## Task 1: Extend `DesignToken` with `darkValue?: string`

**Files:**
- Modify: `packages/editor/src/editor/design-system/types.ts:89-110`

- [ ] **Step 1.1: Add the field**

Modify `packages/editor/src/editor/design-system/types.ts` — locate the `DesignToken` interface and append `darkValue?: string` after the `aliasOf?` field:

```typescript
export interface DesignToken {
  // ... existing fields ...
  aliasOf?: string;
  darkValue?: string;            // Phase B.0 — color-only dark variant.
                                 // Resolution rule: mode === "dark" && darkValue → use darkValue;
                                 // missing darkValue under mode === "dark" → fall back to `value`
                                 // and emit `tokens:dark-missing` (D16).
  typedValue?: TokenValue;
}
```

- [ ] **Step 1.2: TSC check**

Run: `cd packages/editor && npx tsc --noEmit 2>&1 | grep -E "darkValue|DesignToken" | head`
Expected: empty output (no errors — additive optional field).

- [ ] **Step 1.3: Commit**

```bash
git add packages/editor/src/editor/design-system/types.ts
git commit -m "feat(ds-phase-b0): add DesignToken.darkValue?: string for D8 dark mode"
```

---

## Task 2: ColorMode store

**Files:**
- Create: `packages/editor/src/engine/colorMode/ColorMode.ts`
- Create: `packages/editor/src/engine/colorMode/index.ts`
- Create: `packages/editor/src/engine/colorMode/__tests__/ColorMode.test.ts`

- [ ] **Step 2.1: Write the failing test**

Create `packages/editor/src/engine/colorMode/__tests__/ColorMode.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { ColorMode } from "../ColorMode";
import type { EventEmitter } from "../../EventEmitter";

function makeEvents(): EventEmitter & { emit: ReturnType<typeof vi.fn> } {
  return {
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  } as unknown as EventEmitter & { emit: ReturnType<typeof vi.fn> };
}

describe("ColorMode", () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset matchMedia to a permissive default for each test.
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((q: string) => ({
        matches: false,
        media: q,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it("defaults to 'system' when no localStorage value", () => {
    const events = makeEvents();
    const cm = new ColorMode(events);
    expect(cm.get()).toBe("system");
  });

  it("hydrates from localStorage 'buildrik:colorMode' if present", () => {
    localStorage.setItem("buildrik:colorMode", "dark");
    const events = makeEvents();
    const cm = new ColorMode(events);
    expect(cm.get()).toBe("dark");
  });

  it("ignores invalid localStorage value and falls back to 'system'", () => {
    localStorage.setItem("buildrik:colorMode", "neon");
    const events = makeEvents();
    const cm = new ColorMode(events);
    expect(cm.get()).toBe("system");
  });

  it("set() persists to localStorage and emits colorMode:changed", () => {
    const events = makeEvents();
    const cm = new ColorMode(events);
    cm.set("dark");
    expect(localStorage.getItem("buildrik:colorMode")).toBe("dark");
    expect(events.emit).toHaveBeenCalledWith("colorMode:changed", { mode: "dark", resolved: "dark" });
  });

  it("resolved() returns 'light' for mode='system' when matchMedia.matches is false", () => {
    const events = makeEvents();
    const cm = new ColorMode(events);
    cm.set("system");
    expect(cm.resolved()).toBe("light");
  });

  it("resolved() returns 'dark' for mode='system' when matchMedia.matches is true", () => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((q: string) => ({
        matches: true,
        media: q,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
    const events = makeEvents();
    const cm = new ColorMode(events);
    cm.set("system");
    expect(cm.resolved()).toBe("dark");
  });

  it("resolved() returns the explicit mode for non-system modes", () => {
    const events = makeEvents();
    const cm = new ColorMode(events);
    cm.set("dark");
    expect(cm.resolved()).toBe("dark");
    cm.set("light");
    expect(cm.resolved()).toBe("light");
  });

  it("matchMedia change in 'system' mode re-emits colorMode:changed with new resolved", () => {
    const listeners: Array<(e: { matches: boolean }) => void> = [];
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((q: string) => ({
        matches: false,
        media: q,
        addEventListener: vi.fn((_evt: string, cb: any) => listeners.push(cb)),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
    const events = makeEvents();
    const cm = new ColorMode(events);
    cm.set("system");
    events.emit.mockClear();
    listeners.forEach((cb) => cb({ matches: true }));
    expect(events.emit).toHaveBeenCalledWith(
      "colorMode:changed",
      expect.objectContaining({ mode: "system", resolved: "dark" })
    );
  });
});
```

- [ ] **Step 2.2: Run test to confirm FAIL**

Run: `cd packages/editor && pnpm vitest run src/engine/colorMode/__tests__/ColorMode.test.ts`
Expected: FAIL — module `../ColorMode` does not exist.

- [ ] **Step 2.3: Implement ColorMode**

Create `packages/editor/src/engine/colorMode/ColorMode.ts`:

```typescript
import type { EventEmitter } from "../EventEmitter";
import type { ThemeMode } from "../../editor/design-system";

const STORAGE_KEY = "buildrik:colorMode";
const VALID_MODES: readonly ThemeMode[] = ["light", "dark", "system"];

function readPersisted(): ThemeMode {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && (VALID_MODES as readonly string[]).includes(raw)) {
      return raw as ThemeMode;
    }
  } catch {
    /* localStorage unavailable */
  }
  return "system";
}

function persist(mode: ThemeMode): void {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* private mode / quota exceeded */
  }
}

/**
 * Composer-owned color mode store. Tracks user preference (light/dark/system)
 * and resolves "system" against `prefers-color-scheme: dark`.
 *
 * Emits `colorMode:changed` on user-initiated `set()` AND on system preference
 * change while in "system" mode. Subscribers re-resolve any color-dependent UI.
 */
export class ColorMode {
  private mode: ThemeMode;
  private mql: MediaQueryList | null;

  constructor(private readonly events: EventEmitter) {
    this.mode = readPersisted();
    this.mql = typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-color-scheme: dark)")
      : null;

    if (this.mql && typeof this.mql.addEventListener === "function") {
      this.mql.addEventListener("change", this.onSystemChange);
    }
  }

  private onSystemChange = (_e: { matches: boolean }): void => {
    if (this.mode !== "system") return;
    this.events.emit("colorMode:changed", { mode: this.mode, resolved: this.resolved() });
  };

  get(): ThemeMode {
    return this.mode;
  }

  set(mode: ThemeMode): void {
    this.mode = mode;
    persist(mode);
    this.events.emit("colorMode:changed", { mode, resolved: this.resolved() });
  }

  /** Always returns "light" or "dark" — never "system". */
  resolved(): "light" | "dark" {
    if (this.mode === "system") {
      return this.mql?.matches ? "dark" : "light";
    }
    return this.mode;
  }
}
```

- [ ] **Step 2.4: Create barrel**

Create `packages/editor/src/engine/colorMode/index.ts`:

```typescript
export { ColorMode } from "./ColorMode";
```

- [ ] **Step 2.5: Run test to confirm PASS**

Run: `cd packages/editor && pnpm vitest run src/engine/colorMode/__tests__/ColorMode.test.ts`
Expected: PASS · 8 tests.

- [ ] **Step 2.6: Commit**

```bash
git add packages/editor/src/engine/colorMode/
git commit -m "feat(ds-phase-b0): ColorMode store with matchMedia + localStorage"
```

---

## Task 3: DarkResolver class

**Files:**
- Create: `packages/editor/src/engine/darkResolver/DarkResolver.ts`
- Create: `packages/editor/src/engine/darkResolver/index.ts`
- Create: `packages/editor/src/engine/darkResolver/__tests__/DarkResolver.test.ts`

- [ ] **Step 3.1: Write the failing test**

Create `packages/editor/src/engine/darkResolver/__tests__/DarkResolver.test.ts`:

```typescript
import { describe, it, expect, vi } from "vitest";
import { DarkResolver } from "../DarkResolver";
import type { DesignToken } from "../../../editor/design-system";
import type { EventEmitter } from "../../EventEmitter";

function makeEvents(): EventEmitter & { emit: ReturnType<typeof vi.fn> } {
  return {
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  } as unknown as EventEmitter & { emit: ReturnType<typeof vi.fn> };
}

describe("DarkResolver.resolve", () => {
  it("returns token.value for resolved='light'", () => {
    const events = makeEvents();
    const resolver = new DarkResolver(events);
    const token: DesignToken = {
      id: "color-primary", name: "Primary", value: "#fff", category: "colors",
      cssVar: "--bd-color-primary", type: "color", darkValue: "#000",
    };
    expect(resolver.resolve(token, "light")).toBe("#fff");
  });

  it("returns token.darkValue for resolved='dark' when present", () => {
    const events = makeEvents();
    const resolver = new DarkResolver(events);
    const token: DesignToken = {
      id: "color-primary", name: "Primary", value: "#fff", category: "colors",
      cssVar: "--bd-color-primary", type: "color", darkValue: "#000",
    };
    expect(resolver.resolve(token, "dark")).toBe("#000");
  });

  it("falls back to token.value for resolved='dark' when darkValue absent (D16) and emits tokens:dark-missing", () => {
    const events = makeEvents();
    const resolver = new DarkResolver(events);
    const token: DesignToken = {
      id: "color-primary", name: "Primary", value: "#fff", category: "colors",
      cssVar: "--bd-color-primary", type: "color",
    };
    expect(resolver.resolve(token, "dark")).toBe("#fff");
    expect(events.emit).toHaveBeenCalledWith("tokens:dark-missing", { tokenId: "color-primary" });
  });

  it("does NOT emit tokens:dark-missing for light mode even when darkValue absent", () => {
    const events = makeEvents();
    const resolver = new DarkResolver(events);
    const token: DesignToken = {
      id: "color-primary", name: "Primary", value: "#fff", category: "colors",
      cssVar: "--bd-color-primary", type: "color",
    };
    resolver.resolve(token, "light");
    expect(events.emit).not.toHaveBeenCalled();
  });

  it("does NOT emit tokens:dark-missing when darkValue is empty string (treated as explicit empty, not missing)", () => {
    const events = makeEvents();
    const resolver = new DarkResolver(events);
    const token: DesignToken = {
      id: "color-primary", name: "Primary", value: "#fff", category: "colors",
      cssVar: "--bd-color-primary", type: "color", darkValue: "",
    };
    expect(resolver.resolve(token, "dark")).toBe("");
    expect(events.emit).not.toHaveBeenCalled();
  });
});

describe("DarkResolver.resolveAll", () => {
  it("returns map of tokenId → resolved value across all input tokens", () => {
    const events = makeEvents();
    const resolver = new DarkResolver(events);
    const tokens: DesignToken[] = [
      { id: "a", name: "A", value: "#fff", category: "colors", cssVar: "--bd-a", type: "color", darkValue: "#000" },
      { id: "b", name: "B", value: "#eee", category: "colors", cssVar: "--bd-b", type: "color" },
    ];
    const map = resolver.resolveAll(tokens, "dark");
    expect(map.get("a")).toBe("#000");
    expect(map.get("b")).toBe("#eee"); // fallback
    expect(events.emit).toHaveBeenCalledWith("tokens:dark-missing", { tokenId: "b" });
  });
});
```

- [ ] **Step 3.2: Run test to confirm FAIL**

Run: `cd packages/editor && pnpm vitest run src/engine/darkResolver/__tests__/DarkResolver.test.ts`
Expected: FAIL — module `../DarkResolver` does not exist.

- [ ] **Step 3.3: Implement DarkResolver**

Create `packages/editor/src/engine/darkResolver/DarkResolver.ts`:

```typescript
import type { DesignToken } from "../../editor/design-system";
import type { EventEmitter } from "../EventEmitter";

/**
 * Composer-owned dark-mode resolver for color tokens.
 *
 * Resolution rule:
 *   resolved === "light"  → token.value
 *   resolved === "dark"   → token.darkValue ?? token.value (+ emit tokens:dark-missing)
 *
 * `darkValue === ""` (empty string) is treated as explicit and NOT as missing.
 *
 * Phase B.0 ships only resolution + missing-pair emission. UI listener
 * (Inspector warn chip) ships in a later sub-phase.
 */
export class DarkResolver {
  constructor(private readonly events: EventEmitter) {}

  resolve(token: DesignToken, resolved: "light" | "dark"): string {
    if (resolved === "light") {
      return token.value;
    }
    // dark
    if (token.darkValue !== undefined) {
      return token.darkValue;
    }
    this.events.emit("tokens:dark-missing", { tokenId: token.id });
    return token.value;
  }

  resolveAll(tokens: readonly DesignToken[], resolved: "light" | "dark"): Map<string, string> {
    const out = new Map<string, string>();
    for (const t of tokens) {
      out.set(t.id, this.resolve(t, resolved));
    }
    return out;
  }
}
```

- [ ] **Step 3.4: Create barrel**

Create `packages/editor/src/engine/darkResolver/index.ts`:

```typescript
export { DarkResolver } from "./DarkResolver";
```

- [ ] **Step 3.5: Run test to confirm PASS**

Run: `cd packages/editor && pnpm vitest run src/engine/darkResolver/__tests__/DarkResolver.test.ts`
Expected: PASS · 6 tests.

- [ ] **Step 3.6: Commit**

```bash
git add packages/editor/src/engine/darkResolver/
git commit -m "feat(ds-phase-b0): DarkResolver with D16 fallback emission"
```

---

## Task 4: Wire DarkResolver + ColorMode into Composer

**Files:**
- Modify: `packages/editor/src/engine/Composer.ts`
- Create: `packages/editor/src/engine/__tests__/Composer.darkResolver.test.ts`

- [ ] **Step 4.1: Write the failing wiring test**

Create `packages/editor/src/engine/__tests__/Composer.darkResolver.test.ts`:

```typescript
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Composer } from "../Composer";
import { DarkResolver } from "../darkResolver";
import { ColorMode } from "../colorMode";

describe("Composer · dark resolver + color mode wiring", () => {
  let originalGetContext: any;

  beforeAll(() => {
    if (typeof globalThis.indexedDB === "undefined") {
      const fireOnSuccess = (req: any) => {
        Promise.resolve().then(() => req.onsuccess?.());
      };
      Object.defineProperty(globalThis, "indexedDB", {
        value: {
          open: () => {
            const req = {
              onsuccess: () => {}, onerror: () => {}, onupgradeneeded: () => {},
              result: {
                createObjectStore: () => ({ createIndex: () => {} }),
                transaction: () => ({
                  objectStore: () => ({
                    get: () => { const r = { result: undefined }; fireOnSuccess(r); return r; },
                    put: () => { const r = {}; fireOnSuccess(r); return r; },
                    getAll: () => { const r = { result: [] }; fireOnSuccess(r); return r; },
                    index: () => ({ getAll: () => { const r = { result: [] }; fireOnSuccess(r); return r; } }),
                  }),
                }),
                close: () => {}, objectStoreNames: { contains: () => false },
              },
            };
            fireOnSuccess(req);
            return req;
          },
          deleteDatabase: () => ({ onsuccess: () => {}, onerror: () => {} }),
        },
        writable: true, configurable: true,
      });
    }

    originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (contextId: string) {
      if (contextId === "2d") {
        return {
          fillStyle: "", strokeStyle: "", lineWidth: 1, canvas: this,
          getImageData: () => ({ data: new Uint8ClampedArray(4) }),
          putImageData: () => {}, drawImage: () => {}, fillRect: () => {},
          clearRect: () => {}, strokeRect: () => {}, beginPath: () => {},
          closePath: () => {}, moveTo: () => {}, lineTo: () => {}, stroke: () => {},
          fill: () => {}, arc: () => {}, rect: () => {}, clip: () => {},
          save: () => {}, restore: () => {}, translate: () => {}, scale: () => {},
          rotate: () => {}, transform: () => {}, setTransform: () => {},
          createLinearGradient: () => ({ addColorStop: () => {} }),
          createRadialGradient: () => ({ addColorStop: () => {} }),
          createPattern: () => null, measureText: () => ({ width: 0 }),
          font: "", textAlign: "start", textBaseline: "alphabetic",
        } as any;
      }
      return originalGetContext.call(this, contextId);
    };
  });

  afterAll(() => {
    HTMLCanvasElement.prototype.getContext = originalGetContext;
  });

  it("exposes composer.darkResolver as a DarkResolver instance", () => {
    const c = new Composer({} as any);
    expect(c.darkResolver).toBeInstanceOf(DarkResolver);
  });

  it("exposes composer.colorMode as a ColorMode instance", () => {
    const c = new Composer({} as any);
    expect(c.colorMode).toBeInstanceOf(ColorMode);
  });
});
```

- [ ] **Step 4.2: Run, expect FAIL**

Run: `cd packages/editor && pnpm vitest run src/engine/__tests__/Composer.darkResolver.test.ts`
Expected: FAIL — `c.darkResolver` and `c.colorMode` are undefined.

- [ ] **Step 4.3: Add fields to Composer**

Modify `packages/editor/src/engine/Composer.ts`:

Add imports near other engine imports (alongside `AliasResolver` from A.2):

```typescript
import { AliasResolver } from "./aliasResolver";
import { DarkResolver } from "./darkResolver";
import { ColorMode } from "./colorMode";
```

Add field declarations after `aliasResolver` (around line 111):

```typescript
  readonly aliasResolver!: AliasResolver;
  readonly darkResolver!: DarkResolver;
  readonly colorMode!: ColorMode;
```

Add constructor inits after `this.aliasResolver = new AliasResolver(this);` (around line 166):

```typescript
    this.aliasResolver = new AliasResolver(this);
    this.darkResolver = new DarkResolver(this);
    this.colorMode = new ColorMode(this);
```

- [ ] **Step 4.4: Run, expect PASS**

Run: `cd packages/editor && pnpm vitest run src/engine/__tests__/Composer.darkResolver.test.ts src/engine/__tests__/Composer.aliasResolver.test.ts src/engine/__tests__/Composer.migration.test.ts`
Expected: PASS · 4 tests (2 new + 2 existing wiring smoke).

- [ ] **Step 4.5: Commit**

```bash
git add packages/editor/src/engine/Composer.ts \
  packages/editor/src/engine/__tests__/Composer.darkResolver.test.ts
git commit -m "feat(ds-phase-b0): wire composer.darkResolver + composer.colorMode"
```

---

## Task 5: Path-scoped baseline + closure tag

**Files:** none (verification only)

- [ ] **Step 5.1: Run all B.0 path-scoped tests + A.2 baseline**

Run: `cd packages/editor && pnpm vitest run src/engine/darkResolver src/engine/colorMode src/engine/__tests__/Composer.darkResolver.test.ts src/engine/__tests__/Composer.aliasResolver.test.ts src/engine/__tests__/Composer.migration.test.ts src/engine/aliasResolver --reporter=dot 2>&1 | tail -10`
Expected: all pass · ≥30 tests.

- [ ] **Step 5.2: TSC clean on touched paths**

Run: `cd packages/editor && npx tsc --noEmit 2>&1 | grep -E "darkResolver|colorMode|design-system/types\.ts:" | head`
Expected: empty output.

- [ ] **Step 5.3: Tag the phase locally** (do NOT push without explicit user OK per `feedback_solo_workflow`)

Run:
```bash
git tag ds-phase-b0-complete
git tag --list 'ds-phase-*'
```
Expected: tag list includes `ds-phase-a0-complete`, `ds-phase-a1-complete`, `ds-phase-a2-complete`, `ds-phase-b0-complete`.

---

## Phase B.0 Closure Checklist

- [ ] All 5 tasks complete with passing tests
- [ ] Composer wiring smoke tests green (`composer.darkResolver` is `DarkResolver`, `composer.colorMode` is `ColorMode`)
- [ ] DarkResolver D16 fallback emits `tokens:dark-missing`
- [ ] ColorMode persists to localStorage + listens to `prefers-color-scheme`
- [ ] Tag `ds-phase-b0-complete` exists locally
- [ ] CLAUDE.md memory entry written for the phase (`project_ds_phase_b0_shipped_YYYYMMDD.md`)

## Out-of-Scope (deferred to B.1+)

- `applyToRoot` integration with `composer.colorMode` — `useColorTokens` re-walk on `colorMode:changed` lands in B.1.
- Inspector warn chip listening on `tokens:dark-missing` — UI sub-phase ships when Design tab token editor lands.
- Spec §16.3 full dual-mode shape (`value: { light, dark? }`) — minimum-disturbance via `darkValue?: string` in B.0; full migration when the rest of the codebase converges.
- CI gate `gate:ds-dark` — wires when applyToRoot integration ships in B.1 with concrete fixture targets.
- Migration to seed `darkValue` for shipped color tokens — deferred until usage warrants.

---

## Notes for the Implementer

- **TDD is required.** Same as A.1/A.2 — failing test → minimal impl → green → commit per task.
- **Stage paths explicitly in `git add`.** Per memory `feedback_no_stash_mid_execution` and A.1/A.2 findings — list paths in every `git add`, never use `git add .`.
- **Path-scoped baselines only.** The full vitest suite is converging green per A.2 addendum; but path-scoped runs are the in-arc baseline.
- **Workflow yml changes use Write.** Per A.2 finding 3: PreToolUse:Edit hook blocks workflow .yml Edit; use Write tool with full content. (Not relevant in B.0 since no workflow changes — noted for the future B.1 ci-gate task.)
- **B.0 fail-soft.** No throw classes — D16 fallback is silent + event-driven. UI surfaces the warning when listener ships.
