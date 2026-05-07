# DS Arc · Phase A.0 — Token Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land the type system, Zod validators, factory-based per-kind hooks, and provider wiring needed to support all 14 token kinds (color/type/spacing already shipped + 11 new) inside the existing 3-context architecture, additively — without breaking the shipped color/spacing/type code paths.

**Architecture:** Extend `editor/design-system/types.ts` with the spec §5.3 `TokenKind` union and a discriminated `TokenValue` shape. Define one Zod validator per kind in `packages/shared/schemas/designToken.ts`. Build a generic `useTokensForKind(kind, initialTokens)` factory that subsumes the per-kind hook duplication problem (CEO plan §Test Counts called this out: factory reduces test counts ~30%). Wire all 14 contexts inside `TokenRegistryProvider`. Existing color/spacing/type hooks stay shipped — we add the 11 new kinds alongside, do NOT rewrite the existing 3.

**Tech Stack:** TypeScript 5.3 strict, React 19, Zod 3, Vitest 4, Emotion (existing), localStorage (existing persistence).

---

## Spec Reference

This plan covers Phase A's first sub-arc — the token foundation. It does NOT cover:
- Migration v0→v1 (Phase A.1)
- Alias graph + cycle detection (Phase A.2)
- Inspector binding chips (Phase A.3)

Spec sections this plan addresses:
- §5.1 Folder layout (extends `editor/design-system/state/`)
- §5.2 Engine boundaries (TokenRegistryContext stays the gateway)
- §5.3 Token shape (TokenKind + TokenValue discriminated union)
- §5.7 SSOT contract (Zod schemas in `packages/shared/schemas/`)
- §9.3 Unit tests (factory pattern target)

The existing `DesignToken` interface uses `name` + `category: TokenCategory` (9 string union). Spec §5.3 specifies `friendlyName` + `kind: TokenKind` (14 union). This plan adds the spec fields **additively** (keep `name`/`category`, add optional `kind`, `friendlyName`, `aliasOf`) so existing 3 hooks keep working. The full rename from `name`→`friendlyName` and `category`→`kind` is Phase A.4 polish (not in this plan).

---

## File Structure

| Path | Action | Responsibility |
|------|--------|----------------|
| `packages/editor/src/editor/design-system/types.ts` | Modify | Add `TokenKind` (14 kinds), `TokenValue` discriminated union, extend `DesignToken` with optional `kind`/`friendlyName`/`aliasOf`. Keep existing fields. |
| `packages/shared/schemas/designToken.ts` | Create | Zod validators per kind. Exports `TokenKindSchema`, `TokenValueSchema`, `DesignTokenSchema`. |
| `packages/editor/src/editor/design-system/state/useTokensForKind.ts` | Create | Generic factory hook. Returns same shape as `useColorTokens`/`useSpacingTokens`/`useTypeTokens` for any TokenKind. |
| `packages/editor/src/editor/design-system/state/useRadiusTokens.ts` | Create | `useTokensForKind("radius", ...)` thin wrapper. Existence proves the factory works against a real new kind. |
| `packages/editor/src/editor/design-system/state/useShadowTokens.ts` | Create | Same pattern. |
| `packages/editor/src/editor/design-system/state/useMotionTokens.ts` | Create | Same pattern. |
| `packages/editor/src/editor/design-system/state/useBorderTokens.ts` | Create | Same pattern. |
| `packages/editor/src/editor/design-system/state/useOpacityTokens.ts` | Create | Same pattern. |
| `packages/editor/src/editor/design-system/state/useZindexTokens.ts` | Create | Same pattern. |
| `packages/editor/src/editor/design-system/state/useBreakpointTokens.ts` | Create | Same pattern. |
| `packages/editor/src/editor/design-system/state/useGridTokens.ts` | Create | Same pattern. |
| `packages/editor/src/editor/design-system/state/useSizingTokens.ts` | Create | Same pattern. |
| `packages/editor/src/editor/design-system/state/useIconTokens.ts` | Create | Same pattern. |
| `packages/editor/src/editor/design-system/state/useImageryTokens.ts` | Create | Same pattern. |
| `packages/editor/src/editor/design-system/state/TokenRegistryContext.tsx` | Modify | Mount 11 new contexts. Existing 3 stay. |
| `packages/editor/src/editor/design-system/constants.ts` | Modify | Backfill `DEFAULT_TOKENS` with placeholder defaults for the 11 new kinds (1-2 sample tokens each, marked `kind`). |
| `packages/editor/src/editor/design-system/state/__tests__/useTokensForKind.test.ts` | Create | Factory unit tests. Covers add/update/delete/undo/filter for a representative kind (radius). |
| `packages/editor/src/editor/design-system/state/__tests__/useMotionTokens.test.ts` | Create | Tests motion-specific Zod validation (durations, easings). |
| `packages/shared/schemas/__tests__/designToken.test.ts` | Create | Zod validator tests per kind (24 valid/invalid cases — 12 kinds × 2). |

Total: 14 new files, 3 modified.

---

## Task 1: Define `TokenKind` and `TokenValue` discriminated union

**Files:**
- Modify: `packages/editor/src/editor/design-system/types.ts:41-61` (extend `TokenType` + `DesignToken`)

- [ ] **Step 1: Read existing types.ts and locate insertion point**

Read `packages/editor/src/editor/design-system/types.ts`. Existing `DesignToken` interface ends at line 61. New `TokenKind` and `TokenValue` definitions go BEFORE the existing `DesignToken` (so the interface can reference them).

- [ ] **Step 2: Add TokenKind and TokenValue types**

Insert directly above the existing `export type TokenType` declaration (line 41):

```typescript
/**
 * Spec §5.3 token kinds — 14 total. The 3 existing kinds (color/type/spacing)
 * have already-shipped hook + context implementations. The 11 new kinds plug
 * into the same architecture via the factory hook in useTokensForKind.ts.
 */
export type TokenKind =
  | "color" | "type" | "spacing"
  | "radius" | "shadow" | "motion"
  | "border" | "opacity" | "zindex"
  | "breakpoint" | "grid" | "sizing"
  | "icon" | "imagery";

/**
 * Per-kind value shape. Discriminated by `kind`. Validators in
 * packages/shared/schemas/designToken.ts enforce the per-kind shape.
 */
export type TokenValue =
  | { kind: "color"; value: string }                       // hex, rgb, hsl
  | { kind: "type"; family: string; weight?: number; size?: string; lineHeight?: string }
  | { kind: "spacing"; value: string }                     // px, rem, em
  | { kind: "radius"; value: string }                      // px, rem, %
  | { kind: "shadow"; value: string }                      // CSS box-shadow string
  | { kind: "motion"; duration: string; easing: string }   // "200ms", "ease-out"
  | { kind: "border"; width: string; style: string; color?: string }
  | { kind: "opacity"; value: number }                     // 0–1
  | { kind: "zindex"; value: number }                      // integer
  | { kind: "breakpoint"; value: string }                  // "768px"
  | { kind: "grid"; columns: number; gap?: string }
  | { kind: "sizing"; value: string }
  | { kind: "icon"; name: string; size?: string }          // ref to icon library
  | { kind: "imagery"; url: string; alt?: string };
```

- [ ] **Step 3: Extend `DesignToken` interface additively**

Replace lines 51-61 (the existing `DesignToken` interface) with:

```typescript
export interface DesignToken {
  // Existing fields — keep all for backward compat with shipped color/spacing/type.
  id: string;
  name: string;                  // legacy; spec §5.3 calls this `friendlyName`
  value: string;                 // legacy single-string value (color/spacing/type still use this)
  category: TokenCategory;       // legacy 9-category union
  cssVar: string;
  type: TokenType;               // legacy
  group?: string;
  options?: string[];
  description?: string;

  // Phase A.0 additions — optional so existing tokens remain valid.
  kind?: TokenKind;              // spec §5.3 — discriminator for new tokens
  friendlyName?: string;         // spec §5.3 — beginner-mode label, falls back to `name`
  aliasOf?: string;              // Phase A.2 — populated then; declared here so type compiles
  typedValue?: TokenValue;       // structured value for new kinds; legacy `value` stays for old
}
```

- [ ] **Step 4: Run TSC**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor
npx tsc --noEmit 2>&1 | grep -E "TokenKind|TokenValue|DesignToken" | head -10
```

Expected: empty (no new errors). Pre-existing 204 errors are out-of-scope.

- [ ] **Step 5: Commit**

```bash
git add packages/editor/src/editor/design-system/types.ts
git commit -m "$(cat <<'EOF'
feat(ds-phase-a0): add TokenKind + TokenValue + DesignToken extension

Spec §5.3. Adds the 14-kind TokenKind union and TokenValue
discriminated union. DesignToken extends additively — new optional
`kind`, `friendlyName`, `aliasOf`, `typedValue` fields. Existing
`name`/`value`/`category`/`type` stay so the shipped color/spacing/
type hooks continue to work without modification.

The full rename `name`→`friendlyName` and `category`→`kind` is
deferred to Phase A.4 polish.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Zod validators per token kind (transport-safe contracts)

**Files:**
- Create: `packages/shared/schemas/designToken.ts`

- [ ] **Step 1: Read existing schemas dir to learn conventions**

```bash
ls /Users/shahg/Desktop/pencil/buildrik/packages/shared/schemas/
head -30 /Users/shahg/Desktop/pencil/buildrik/packages/shared/schemas/sites.ts
```

Note conventions: `import { z } from "zod"` style, named-export pattern (`export const fooSchema = z.object({...})`), inferred types (`export type Foo = z.infer<typeof fooSchema>`).

- [ ] **Step 2: Write the Zod schemas file**

```bash
cat > /Users/shahg/Desktop/pencil/buildrik/packages/shared/schemas/designToken.ts <<'EOF'
import { z } from "zod";

export const TokenKindSchema = z.enum([
  "color", "type", "spacing",
  "radius", "shadow", "motion",
  "border", "opacity", "zindex",
  "breakpoint", "grid", "sizing",
  "icon", "imagery",
]);

export type TokenKind = z.infer<typeof TokenKindSchema>;

const ColorValueSchema    = z.object({ kind: z.literal("color"),    value: z.string().min(1) });
const TypeValueSchema     = z.object({ kind: z.literal("type"),     family: z.string().min(1), weight: z.number().int().min(100).max(900).optional(), size: z.string().optional(), lineHeight: z.string().optional() });
const SpacingValueSchema  = z.object({ kind: z.literal("spacing"),  value: z.string().min(1) });
const RadiusValueSchema   = z.object({ kind: z.literal("radius"),   value: z.string().min(1) });
const ShadowValueSchema   = z.object({ kind: z.literal("shadow"),   value: z.string().min(1) });
const MotionValueSchema   = z.object({ kind: z.literal("motion"),   duration: z.string().regex(/^\d+(\.\d+)?(ms|s)$/), easing: z.string().min(1) });
const BorderValueSchema   = z.object({ kind: z.literal("border"),   width: z.string().min(1), style: z.string().min(1), color: z.string().optional() });
const OpacityValueSchema  = z.object({ kind: z.literal("opacity"),  value: z.number().min(0).max(1) });
const ZindexValueSchema   = z.object({ kind: z.literal("zindex"),   value: z.number().int() });
const BreakpointValueSchema = z.object({ kind: z.literal("breakpoint"), value: z.string().regex(/^\d+(px|rem|em)$/) });
const GridValueSchema     = z.object({ kind: z.literal("grid"),     columns: z.number().int().positive(), gap: z.string().optional() });
const SizingValueSchema   = z.object({ kind: z.literal("sizing"),   value: z.string().min(1) });
const IconValueSchema     = z.object({ kind: z.literal("icon"),     name: z.string().min(1), size: z.string().optional() });
const ImageryValueSchema  = z.object({ kind: z.literal("imagery"),  url: z.string().url(), alt: z.string().optional() });

export const TokenValueSchema = z.discriminatedUnion("kind", [
  ColorValueSchema,
  TypeValueSchema,
  SpacingValueSchema,
  RadiusValueSchema,
  ShadowValueSchema,
  MotionValueSchema,
  BorderValueSchema,
  OpacityValueSchema,
  ZindexValueSchema,
  BreakpointValueSchema,
  GridValueSchema,
  SizingValueSchema,
  IconValueSchema,
  ImageryValueSchema,
]);

export type TokenValue = z.infer<typeof TokenValueSchema>;

export const DesignTokenSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  value: z.string(),
  category: z.string(),
  cssVar: z.string().regex(/^--[a-z0-9-]+$/),
  type: z.string(),
  group: z.string().optional(),
  options: z.array(z.string()).optional(),
  description: z.string().optional(),
  kind: TokenKindSchema.optional(),
  friendlyName: z.string().optional(),
  aliasOf: z.string().optional(),
  typedValue: TokenValueSchema.optional(),
});

export type DesignToken = z.infer<typeof DesignTokenSchema>;
EOF
```

- [ ] **Step 3: TSC validates the file**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
npx tsc --noEmit -p tsconfig.json 2>&1 | grep "designToken" | head -10
```

Expected: empty.

- [ ] **Step 4: Commit**

```bash
git add packages/shared/schemas/designToken.ts
git commit -m "$(cat <<'EOF'
feat(ds-phase-a0): Zod validators for 14 token kinds

Spec §5.7 SSOT contract — Zod schemas live in
packages/shared/schemas/. DesignTokenSchema mirrors the TS interface
from types.ts with optional Phase A.0 additions (kind, friendlyName,
aliasOf, typedValue). TokenValueSchema is a discriminated union
keyed on `kind`, one variant per spec §5.3 kind.

Used by: import/export round-trip, AI-assist schema gate (D14
hallucinated-tokenId rejection), migration runner.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Zod validator tests

**Files:**
- Create: `packages/shared/schemas/__tests__/designToken.test.ts`

- [ ] **Step 1: Write failing tests first (TDD)**

```bash
mkdir -p /Users/shahg/Desktop/pencil/buildrik/packages/shared/schemas/__tests__
cat > /Users/shahg/Desktop/pencil/buildrik/packages/shared/schemas/__tests__/designToken.test.ts <<'EOF'
import { describe, it, expect } from "vitest";
import { TokenKindSchema, TokenValueSchema, DesignTokenSchema } from "../designToken";

describe("TokenKindSchema", () => {
  it("accepts all 14 spec kinds", () => {
    const kinds = [
      "color", "type", "spacing",
      "radius", "shadow", "motion",
      "border", "opacity", "zindex",
      "breakpoint", "grid", "sizing",
      "icon", "imagery",
    ];
    for (const k of kinds) {
      expect(TokenKindSchema.safeParse(k).success).toBe(true);
    }
  });

  it("rejects unknown kinds", () => {
    expect(TokenKindSchema.safeParse("foo").success).toBe(false);
  });
});

describe("TokenValueSchema (discriminated union)", () => {
  it("accepts a valid color value", () => {
    expect(TokenValueSchema.safeParse({ kind: "color", value: "#2D6DFF" }).success).toBe(true);
  });

  it("rejects color with empty string value", () => {
    expect(TokenValueSchema.safeParse({ kind: "color", value: "" }).success).toBe(false);
  });

  it("accepts motion value with duration regex", () => {
    expect(TokenValueSchema.safeParse({ kind: "motion", duration: "200ms", easing: "ease-out" }).success).toBe(true);
  });

  it("rejects motion duration without ms/s suffix", () => {
    expect(TokenValueSchema.safeParse({ kind: "motion", duration: "200", easing: "ease-out" }).success).toBe(false);
  });

  it("accepts opacity value in [0,1]", () => {
    expect(TokenValueSchema.safeParse({ kind: "opacity", value: 0.5 }).success).toBe(true);
  });

  it("rejects opacity value > 1", () => {
    expect(TokenValueSchema.safeParse({ kind: "opacity", value: 1.5 }).success).toBe(false);
  });

  it("rejects opacity value < 0", () => {
    expect(TokenValueSchema.safeParse({ kind: "opacity", value: -0.1 }).success).toBe(false);
  });

  it("accepts zindex integer", () => {
    expect(TokenValueSchema.safeParse({ kind: "zindex", value: 100 }).success).toBe(true);
  });

  it("rejects zindex non-integer", () => {
    expect(TokenValueSchema.safeParse({ kind: "zindex", value: 1.5 }).success).toBe(false);
  });

  it("accepts breakpoint with px suffix", () => {
    expect(TokenValueSchema.safeParse({ kind: "breakpoint", value: "768px" }).success).toBe(true);
  });

  it("rejects breakpoint with bare number", () => {
    expect(TokenValueSchema.safeParse({ kind: "breakpoint", value: "768" }).success).toBe(false);
  });

  it("accepts imagery with valid URL", () => {
    expect(TokenValueSchema.safeParse({ kind: "imagery", url: "https://example.com/img.png" }).success).toBe(true);
  });

  it("rejects imagery with non-URL string", () => {
    expect(TokenValueSchema.safeParse({ kind: "imagery", url: "not-a-url" }).success).toBe(false);
  });
});

describe("DesignTokenSchema", () => {
  it("accepts a minimal legacy-shape token (no kind field)", () => {
    const legacy = {
      id: "color-brand-500",
      name: "Brand 500",
      value: "#2D6DFF",
      category: "colors",
      cssVar: "--bd-color-brand-500",
      type: "color",
    };
    expect(DesignTokenSchema.safeParse(legacy).success).toBe(true);
  });

  it("accepts a Phase A.0 token with kind + typedValue", () => {
    const newShape = {
      id: "radius-md",
      name: "Medium radius",
      value: "8px",
      category: "layout",
      cssVar: "--bd-radius-md",
      type: "length",
      kind: "radius",
      friendlyName: "Medium radius",
      typedValue: { kind: "radius", value: "8px" },
    };
    expect(DesignTokenSchema.safeParse(newShape).success).toBe(true);
  });

  it("rejects token with malformed cssVar", () => {
    const bad = {
      id: "x",
      name: "X",
      value: "x",
      category: "colors",
      cssVar: "not-a-css-var",
      type: "color",
    };
    expect(DesignTokenSchema.safeParse(bad).success).toBe(false);
  });
});
EOF
```

- [ ] **Step 2: Run tests, confirm they fail until Task 2's file is loaded**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
npx vitest run packages/shared/schemas/__tests__/designToken.test.ts 2>&1 | tail -10
```

Expected: ALL pass (Task 2 already wrote the schemas — this test file just locks in the contract).

If any fail, the schemas in Task 2 don't match the contract — fix the schema, not the test. Re-run.

- [ ] **Step 3: Commit**

```bash
git add packages/shared/schemas/__tests__/designToken.test.ts
git commit -m "$(cat <<'EOF'
test(ds-phase-a0): Zod validator coverage for 14 token kinds

17 test cases covering kind enum, discriminated value union,
DesignToken legacy-shape compatibility, and rejection cases for
each kind's specific validators (motion regex, opacity range,
zindex integer, breakpoint suffix, imagery URL).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Generic factory hook `useTokensForKind`

**Files:**
- Create: `packages/editor/src/editor/design-system/state/useTokensForKind.ts`

- [ ] **Step 1: Read existing useColorTokens to learn the shape**

```bash
cat /Users/shahg/Desktop/pencil/buildrik/packages/editor/src/editor/design-system/state/useColorTokens.ts | head -80
```

Capture the returned shape: `{tokens, savedTokens, pendingDiff, isDirty, updateToken, undoToken, redoToken, canUndo, canRedo, markSaved, discardAll, resetFromSaved, filterTokens, addToken, deleteToken}`. The factory must return the same shape so per-kind wrappers (Tasks 5-15) plug in cleanly.

- [ ] **Step 2: Write the factory**

```bash
cat > /Users/shahg/Desktop/pencil/buildrik/packages/editor/src/editor/design-system/state/useTokensForKind.ts <<'EOF'
import * as React from "react";
import type { DesignToken, TokenKind } from "../types";

interface TokensForKindState {
  tokens: DesignToken[];
  savedTokens: DesignToken[];
  pendingDiff: Record<string, string>;
  isDirty: boolean;
}

interface TokensForKindActions {
  updateToken: (id: string, value: string) => void;
  undoToken: (id: string) => void;
  redoToken: (id: string) => void;
  canUndo: (id: string) => boolean;
  canRedo: (id: string) => boolean;
  markSaved: () => void;
  discardAll: () => void;
  resetFromSaved: () => void;
  filterTokens: (q: string) => DesignToken[];
  addToken: (token: DesignToken) => void;
  deleteToken: (id: string) => void;
}

export type TokensForKindRegistry = TokensForKindState & TokensForKindActions;

export function useTokensForKind(
  kind: TokenKind,
  initialTokens: DesignToken[]
): TokensForKindRegistry {
  const seed = React.useMemo(
    () => initialTokens.filter((t) => t.kind === kind),
    [initialTokens, kind]
  );

  const [tokens, setTokens] = React.useState<DesignToken[]>(seed);
  const [savedTokens, setSavedTokens] = React.useState<DesignToken[]>(seed);
  const undoStackRef = React.useRef<Map<string, string[]>>(new Map());
  const redoStackRef = React.useRef<Map<string, string[]>>(new Map());

  const pendingDiff = React.useMemo<Record<string, string>>(() => {
    const diff: Record<string, string> = {};
    for (const t of tokens) {
      const saved = savedTokens.find((s) => s.id === t.id);
      if (!saved || saved.value !== t.value) {
        diff[t.id] = t.value;
      }
    }
    return diff;
  }, [tokens, savedTokens]);

  const isDirty = Object.keys(pendingDiff).length > 0;

  const updateToken = React.useCallback((id: string, value: string) => {
    setTokens((prev) => {
      const idx = prev.findIndex((t) => t.id === id);
      if (idx === -1) return prev;
      const old = prev[idx];
      const stack = undoStackRef.current.get(id) ?? [];
      stack.push(old.value);
      undoStackRef.current.set(id, stack);
      redoStackRef.current.set(id, []);
      const next = [...prev];
      next[idx] = { ...old, value };
      return next;
    });
  }, []);

  const undoToken = React.useCallback((id: string) => {
    const stack = undoStackRef.current.get(id);
    if (!stack || stack.length === 0) return;
    const prev = stack.pop()!;
    setTokens((cur) => {
      const idx = cur.findIndex((t) => t.id === id);
      if (idx === -1) return cur;
      const redoStack = redoStackRef.current.get(id) ?? [];
      redoStack.push(cur[idx].value);
      redoStackRef.current.set(id, redoStack);
      const next = [...cur];
      next[idx] = { ...next[idx], value: prev };
      return next;
    });
  }, []);

  const redoToken = React.useCallback((id: string) => {
    const stack = redoStackRef.current.get(id);
    if (!stack || stack.length === 0) return;
    const next = stack.pop()!;
    setTokens((cur) => {
      const idx = cur.findIndex((t) => t.id === id);
      if (idx === -1) return cur;
      const undoStack = undoStackRef.current.get(id) ?? [];
      undoStack.push(cur[idx].value);
      undoStackRef.current.set(id, undoStack);
      const out = [...cur];
      out[idx] = { ...out[idx], value: next };
      return out;
    });
  }, []);

  const canUndo = React.useCallback(
    (id: string) => (undoStackRef.current.get(id) ?? []).length > 0,
    []
  );

  const canRedo = React.useCallback(
    (id: string) => (redoStackRef.current.get(id) ?? []).length > 0,
    []
  );

  const markSaved = React.useCallback(() => {
    setSavedTokens(tokens);
    undoStackRef.current.clear();
    redoStackRef.current.clear();
  }, [tokens]);

  const discardAll = React.useCallback(() => {
    setTokens(savedTokens);
    undoStackRef.current.clear();
    redoStackRef.current.clear();
  }, [savedTokens]);

  const resetFromSaved = discardAll;

  const filterTokens = React.useCallback(
    (q: string) =>
      tokens.filter((t) => t.name.toLowerCase().includes(q.toLowerCase())),
    [tokens]
  );

  const addToken = React.useCallback((token: DesignToken) => {
    setTokens((prev) => [...prev, token]);
  }, []);

  const deleteToken = React.useCallback((id: string) => {
    setTokens((prev) => prev.filter((t) => t.id !== id));
    undoStackRef.current.delete(id);
    redoStackRef.current.delete(id);
  }, []);

  return {
    tokens,
    savedTokens,
    pendingDiff,
    isDirty,
    updateToken,
    undoToken,
    redoToken,
    canUndo,
    canRedo,
    markSaved,
    discardAll,
    resetFromSaved,
    filterTokens,
    addToken,
    deleteToken,
  };
}
EOF
```

- [ ] **Step 3: TSC clean**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor
npx tsc --noEmit 2>&1 | grep "useTokensForKind" | head -10
```

Expected: empty.

- [ ] **Step 4: Commit**

```bash
git add packages/editor/src/editor/design-system/state/useTokensForKind.ts
git commit -m "$(cat <<'EOF'
feat(ds-phase-a0): factory hook useTokensForKind

Generic per-kind hook that returns the same shape as the shipped
useColorTokens/useSpacingTokens/useTypeTokens but parameterized by
TokenKind. The 11 new per-kind wrappers (radius/shadow/motion/etc.)
will call this with their kind. Avoids 11x copy-paste of identical
state machinery.

CEO plan §Test Counts called this out: factory pattern reduces
unit test surface from ~330 → ~280 (≈15%).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Factory test coverage

**Files:**
- Create: `packages/editor/src/editor/design-system/state/__tests__/useTokensForKind.test.ts`

- [ ] **Step 1: Write the failing test (TDD against factory contract)**

```bash
cat > /Users/shahg/Desktop/pencil/buildrik/packages/editor/src/editor/design-system/state/__tests__/useTokensForKind.test.ts <<'EOF'
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTokensForKind } from "../useTokensForKind";
import type { DesignToken } from "../../types";

const radiusToken: DesignToken = {
  id: "radius-md",
  name: "Medium radius",
  value: "8px",
  category: "layout",
  cssVar: "--bd-radius-md",
  type: "length",
  kind: "radius",
};

const colorToken: DesignToken = {
  id: "color-brand-500",
  name: "Brand 500",
  value: "#2D6DFF",
  category: "colors",
  cssVar: "--bd-color-brand-500",
  type: "color",
  kind: "color",
};

describe("useTokensForKind", () => {
  it("filters initial tokens by kind", () => {
    const { result } = renderHook(() =>
      useTokensForKind("radius", [radiusToken, colorToken])
    );
    expect(result.current.tokens).toHaveLength(1);
    expect(result.current.tokens[0].id).toBe("radius-md");
  });

  it("starts with isDirty=false", () => {
    const { result } = renderHook(() => useTokensForKind("radius", [radiusToken]));
    expect(result.current.isDirty).toBe(false);
  });

  it("updateToken sets isDirty=true and adds to pendingDiff", () => {
    const { result } = renderHook(() => useTokensForKind("radius", [radiusToken]));
    act(() => result.current.updateToken("radius-md", "12px"));
    expect(result.current.isDirty).toBe(true);
    expect(result.current.pendingDiff["radius-md"]).toBe("12px");
  });

  it("undoToken restores previous value", () => {
    const { result } = renderHook(() => useTokensForKind("radius", [radiusToken]));
    act(() => result.current.updateToken("radius-md", "12px"));
    expect(result.current.canUndo("radius-md")).toBe(true);
    act(() => result.current.undoToken("radius-md"));
    expect(result.current.tokens[0].value).toBe("8px");
  });

  it("redoToken re-applies after undo", () => {
    const { result } = renderHook(() => useTokensForKind("radius", [radiusToken]));
    act(() => result.current.updateToken("radius-md", "12px"));
    act(() => result.current.undoToken("radius-md"));
    expect(result.current.canRedo("radius-md")).toBe(true);
    act(() => result.current.redoToken("radius-md"));
    expect(result.current.tokens[0].value).toBe("12px");
  });

  it("markSaved clears dirty state and undo stack", () => {
    const { result } = renderHook(() => useTokensForKind("radius", [radiusToken]));
    act(() => result.current.updateToken("radius-md", "12px"));
    act(() => result.current.markSaved());
    expect(result.current.isDirty).toBe(false);
    expect(result.current.canUndo("radius-md")).toBe(false);
  });

  it("discardAll resets tokens to savedTokens", () => {
    const { result } = renderHook(() => useTokensForKind("radius", [radiusToken]));
    act(() => result.current.updateToken("radius-md", "12px"));
    act(() => result.current.discardAll());
    expect(result.current.tokens[0].value).toBe("8px");
    expect(result.current.isDirty).toBe(false);
  });

  it("filterTokens does case-insensitive substring match", () => {
    const { result } = renderHook(() =>
      useTokensForKind("radius", [
        radiusToken,
        { ...radiusToken, id: "radius-lg", name: "Large radius" },
      ])
    );
    expect(result.current.filterTokens("LARGE")).toHaveLength(1);
    expect(result.current.filterTokens("radius")).toHaveLength(2);
  });

  it("addToken extends list", () => {
    const { result } = renderHook(() => useTokensForKind("radius", [radiusToken]));
    act(() =>
      result.current.addToken({ ...radiusToken, id: "radius-lg", name: "Large" })
    );
    expect(result.current.tokens).toHaveLength(2);
  });

  it("deleteToken removes by id", () => {
    const { result } = renderHook(() => useTokensForKind("radius", [radiusToken]));
    act(() => result.current.deleteToken("radius-md"));
    expect(result.current.tokens).toHaveLength(0);
  });
});
EOF
```

- [ ] **Step 2: Run tests, expect all pass**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor
npx vitest run src/editor/design-system/state/__tests__/useTokensForKind.test.ts 2>&1 | tail -10
```

Expected: 10/10 pass. If any fail, the factory in Task 4 has a bug — fix the factory.

- [ ] **Step 3: Commit**

```bash
git add packages/editor/src/editor/design-system/state/__tests__/useTokensForKind.test.ts
git commit -m "$(cat <<'EOF'
test(ds-phase-a0): factory hook coverage — 10 unit tests

Locks in useTokensForKind contract: kind filtering, dirty
tracking, undo/redo, markSaved, discardAll, filterTokens,
addToken, deleteToken. Tests use renderHook+act per RTL 16
patterns. All 10 must pass before per-kind wrappers ship.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: 11 per-kind wrapper hooks (one commit per kind for clean revert)

**Files:**
- Create: `useRadiusTokens.ts`, `useShadowTokens.ts`, `useMotionTokens.ts`, `useBorderTokens.ts`, `useOpacityTokens.ts`, `useZindexTokens.ts`, `useBreakpointTokens.ts`, `useGridTokens.ts`, `useSizingTokens.ts`, `useIconTokens.ts`, `useImageryTokens.ts` — all under `packages/editor/src/editor/design-system/state/`

For each kind, create a thin wrapper. Repeat the same 4-step pattern below ONCE PER KIND. Use the kind name verbatim.

- [ ] **Step 1 (per kind, e.g. `radius`): Create the wrapper file**

Pattern — substitute `<KIND>` with the lowercase kind name and `<Kind>` with PascalCase:

```bash
cat > /Users/shahg/Desktop/pencil/buildrik/packages/editor/src/editor/design-system/state/use<Kind>Tokens.ts <<EOF
import type { DesignToken } from "../types";
import { useTokensForKind } from "./useTokensForKind";

export type <Kind>TokensState = ReturnType<typeof useTokensForKind>;

export function use<Kind>Tokens(initialTokens: DesignToken[]) {
  return useTokensForKind("<KIND>", initialTokens);
}
EOF
```

- [ ] **Step 2 (per kind): TSC**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor
npx tsc --noEmit 2>&1 | grep "use<Kind>Tokens" | head -5
```

Expected: empty.

- [ ] **Step 3 (per kind): Commit (single file, single kind, single commit)**

```bash
git add packages/editor/src/editor/design-system/state/use<Kind>Tokens.ts
git commit -m "feat(ds-phase-a0): use<Kind>Tokens wrapper via factory

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 4: Repeat steps 1-3 for each of the 11 kinds**: radius, shadow, motion, border, opacity, zindex, breakpoint, grid, sizing, icon, imagery.

End state: 11 new files in `state/`, 11 new commits each scoped to a single kind.

---

## Task 7: Wire 11 new contexts into TokenRegistryProvider

**Files:**
- Modify: `packages/editor/src/editor/design-system/state/TokenRegistryContext.tsx`

- [ ] **Step 1: Add 11 new context creations**

Edit `TokenRegistryContext.tsx`. Below the existing 3 context lines (44-46):

```typescript
const ColorRegistryContext = React.createContext<ColorRegistry | null>(null);
const SpacingRegistryContext = React.createContext<SpacingRegistry | null>(null);
const TypeRegistryContext = React.createContext<TypeRegistry | null>(null);
```

Add (matching existing pattern):

```typescript
const RadiusRegistryContext     = React.createContext<RadiusRegistry | null>(null);
const ShadowRegistryContext     = React.createContext<ShadowRegistry | null>(null);
const MotionRegistryContext     = React.createContext<MotionRegistry | null>(null);
const BorderRegistryContext     = React.createContext<BorderRegistry | null>(null);
const OpacityRegistryContext    = React.createContext<OpacityRegistry | null>(null);
const ZindexRegistryContext     = React.createContext<ZindexRegistry | null>(null);
const BreakpointRegistryContext = React.createContext<BreakpointRegistry | null>(null);
const GridRegistryContext       = React.createContext<GridRegistry | null>(null);
const SizingRegistryContext     = React.createContext<SizingRegistry | null>(null);
const IconRegistryContext       = React.createContext<IconRegistry | null>(null);
const ImageryRegistryContext    = React.createContext<ImageryRegistry | null>(null);
```

Add the 11 new imports + types at the top of the file (mirror existing pattern lines 20-25):

```typescript
import { useRadiusTokens } from "./useRadiusTokens";
import type { RadiusTokensState } from "./useRadiusTokens";
// ... 10 more identical imports for the other kinds ...
```

Define the 11 new types alongside the existing 3 (lines 31-33):

```typescript
export type RadiusRegistry     = RadiusTokensState;
export type ShadowRegistry     = ShadowTokensState;
// ... 9 more ...
```

- [ ] **Step 2: Mount the 11 new states inside the provider**

In the provider body (currently lines 105-107 invoke 3 hooks), add 11 more invocations:

```typescript
const radiusState     = useRadiusTokens(initialTokens);
const shadowState     = useShadowTokens(initialTokens);
// ... 9 more ...
```

- [ ] **Step 3: Wrap the 11 new contexts inside the existing JSX (lines 132-141)**

The current return wraps Color > Spacing > Type > RegistryConfig. Add 11 more nested providers BETWEEN Type and RegistryConfig. Final shape:

```tsx
<ColorRegistryContext.Provider value={colorState}>
  <SpacingRegistryContext.Provider value={spacingState}>
    <TypeRegistryContext.Provider value={typeState}>
      <RadiusRegistryContext.Provider value={radiusState}>
        <ShadowRegistryContext.Provider value={shadowState}>
          {/* ... 9 more ... */}
          <RegistryConfigContext.Provider value={config}>
            {children}
          </RegistryConfigContext.Provider>
          {/* ... close 9 more ... */}
        </ShadowRegistryContext.Provider>
      </RadiusRegistryContext.Provider>
    </TypeRegistryContext.Provider>
  </SpacingRegistryContext.Provider>
</ColorRegistryContext.Provider>
```

- [ ] **Step 4: Add 11 new `useXRegistry()` exports at end of file (mirror lines 208-221)**

```typescript
export function useRadiusRegistry(): RadiusRegistry {
  const ctx = React.useContext(RadiusRegistryContext);
  if (!ctx) throw new Error("useRadiusRegistry must be used within TokenRegistryProvider");
  return ctx;
}
// ... 10 more ...
```

Note: Color/Spacing/Type have FALLBACK objects for orphan rendering (lines 155-206). The 11 new kinds don't need fallbacks for Phase A.0 — they're not yet consumed by any orphan component test. Throwing on missing provider matches the `useRegistryConfig` pattern (line 224).

- [ ] **Step 5: TSC + run existing TokenRegistry tests**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor
npx tsc --noEmit 2>&1 | grep -E "TokenRegistry|RadiusRegistry|MotionRegistry" | head -10
npx vitest run src/editor/design-system/state/__tests__/ 2>&1 | tail -10
```

Expected: TSC empty for new types. Existing tests still pass.

- [ ] **Step 6: Commit**

```bash
git add packages/editor/src/editor/design-system/state/TokenRegistryContext.tsx
git commit -m "$(cat <<'EOF'
feat(ds-phase-a0): mount 11 new per-kind contexts in registry provider

Spec §5.2 engine boundaries — TokenRegistryProvider remains the
single mount point for all 14 per-kind contexts. Existing 3 (color,
spacing, type) untouched. 11 new contexts wrap inside the existing
3 so consumers using only the existing 3 see no behavioral change.

useXRegistry() throw-on-missing pattern mirrors useRegistryConfig.
Fallbacks are NOT added for the 11 new kinds in Phase A.0 — no
orphan component tests consume them yet. Phase A.3 adds fallbacks
when Inspector binding chips ship.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Backfill `DEFAULT_TOKENS` with placeholder defaults for 11 new kinds

**Files:**
- Modify: `packages/editor/src/editor/design-system/constants.ts`

- [ ] **Step 1: Read existing constants**

```bash
head -80 /Users/shahg/Desktop/pencil/buildrik/packages/editor/src/editor/design-system/constants.ts
```

Identify the export `DEFAULT_TOKENS: DesignToken[]`. Note its existing structure for color/spacing/type tokens.

- [ ] **Step 2: Append 11 placeholder defaults**

For each new kind, add 1-2 representative tokens to the array. They should have `kind` set, sensible IDs matching `<kind>-<variant>` convention, and CSS var names following `--bd-<kind>-<variant>`. Example block to append:

```typescript
// Phase A.0 — placeholder defaults for 11 new kinds.
// Spec §5.3 / Phase F starter gallery will replace these with starter-themed values.
{
  id: "radius-md",
  name: "Medium radius",
  value: "8px",
  category: "layout",
  cssVar: "--bd-radius-md",
  type: "length",
  kind: "radius",
  friendlyName: "Medium radius",
},
{
  id: "shadow-sm",
  name: "Small shadow",
  value: "0 1px 2px rgba(15,23,42,0.04)",
  category: "effects",
  cssVar: "--bd-shadow-sm",
  type: "shadow",
  kind: "shadow",
},
// ... 9 more ...
```

Add at minimum: 2 radius (sm, md), 2 shadow (sm, md), 2 motion (fast, slow), 1 border, 2 opacity (50, 80), 2 zindex (modal, dropdown), 2 breakpoint (md, lg), 1 grid, 2 sizing, 1 icon, 1 imagery. Total ~18 placeholders.

- [ ] **Step 3: TSC**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor
npx tsc --noEmit 2>&1 | grep -E "constants|DEFAULT_TOKENS" | head -10
```

Expected: empty.

- [ ] **Step 4: Verify defaults pass DesignTokenSchema (Zod)**

Add a quick smoke test inline. Can run via:

```bash
cd /Users/shahg/Desktop/pencil/buildrik
node -e "
const { DesignTokenSchema } = require('./packages/shared/schemas/designToken.ts');
const { DEFAULT_TOKENS } = require('./packages/editor/src/editor/design-system/constants.ts');
const failures = DEFAULT_TOKENS.filter(t => !DesignTokenSchema.safeParse(t).success);
console.log('Failures:', failures.length);
"
```

Expected: `Failures: 0`. If non-zero, the defaults don't conform to the Zod schema — fix the defaults, not the schema.

If `node` can't load `.ts` directly, use `tsx`:

```bash
cd /Users/shahg/Desktop/pencil/buildrik
npx tsx -e "..."
```

- [ ] **Step 5: Commit**

```bash
git add packages/editor/src/editor/design-system/constants.ts
git commit -m "$(cat <<'EOF'
feat(ds-phase-a0): seed DEFAULT_TOKENS with 18 placeholders for 11 new kinds

Spec §5.3 placeholder values for radius/shadow/motion/border/
opacity/zindex/breakpoint/grid/sizing/icon/imagery so the new
TokenRegistry contexts have something to render. Phase F (starter
DS gallery) will replace these per-theme.

All 18 placeholders pass DesignTokenSchema validation.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Smoke test full A.0 wiring end-to-end

**Files:**
- No code edits

- [ ] **Step 1: Run full editor suite**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor
npx vitest run 2>&1 | tail -10
```

Expected: pass count ≥ T6 baseline (2069). New tests from Tasks 3 + 5 add ~17 + 10 = 27, so expected `~2096 passed`.

If pass count < 2069, a regression — diagnose before declaring A.0 done.

- [ ] **Step 2: Run TSC for editor and root**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx tsc --noEmit 2>&1 | grep -c "error TS"
cd /Users/shahg/Desktop/pencil/buildrik && npx tsc --noEmit 2>&1 | grep -c "error TS"
```

Expected: same ≈ counts as Phase 0 baseline (editor 204, root 1586). New errors → Phase A.0 introduced regression.

Spot-check no new errors mention `TokenKind`, `TokenValue`, `useTokensForKind`, or any of the 11 new wrapper names.

- [ ] **Step 3: Manual import smoke**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor
npx tsx -e "
import { useTokensForKind } from './src/editor/design-system/state/useTokensForKind.ts';
import { useRadiusTokens } from './src/editor/design-system/state/useRadiusTokens.ts';
import { TokenKindSchema } from '../shared/schemas/designToken.ts';
console.log('imports OK');
console.log('14 kinds:', TokenKindSchema.options.length);
"
```

Expected: `imports OK\n14 kinds: 14`.

- [ ] **Step 4: Tag the chain**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
git tag ds-phase-a0-complete
git log --oneline ds-phase-0-complete..ds-phase-a0-complete | head -20
```

Expected: 16-18 new commits since `ds-phase-0-complete` tag (1 hardening from Phase 0 + ~16 from this plan: types, schemas, schema-tests, factory, factory-tests, 11 per-kind wrappers, provider mount, defaults).

- [ ] **Step 5: TODOS.md closure block (mirror Phase 0 pattern)**

Append to `TODOS.md` near the top:

```markdown
## 2026-05-08 — DS Arc · Phase A.0 Token Foundation CLOSED

- ✅ TokenKind union (14 kinds) + TokenValue discriminated union — types.ts
- ✅ Zod validators for all 14 kinds — packages/shared/schemas/designToken.ts (17 unit tests)
- ✅ useTokensForKind factory — 10 unit tests, replaces would-be 11x copy-paste
- ✅ 11 per-kind wrapper hooks (radius/shadow/motion/border/opacity/zindex/breakpoint/grid/sizing/icon/imagery) — one commit each
- ✅ TokenRegistryProvider wires all 14 contexts — existing 3 (color/spacing/type) untouched
- ✅ DEFAULT_TOKENS seeded with 18 placeholders covering 11 new kinds — all pass DesignTokenSchema

Phase A.1 (migration v0→v1) is now unblocked. Tokens shipped here read from
existing localStorage; A.1 introduces the dsSchemaVersion-aware runner that
bumps from 0→1 on first DS write per site.
```

```bash
git add TODOS.md
git commit -m "$(cat <<'EOF'
docs(ds-phase-a0): close Phase A.0 token foundation, unblock A.1

Phase A.0 ships: 14-kind type system, Zod validators, factory hook,
11 per-kind wrappers, provider wiring, placeholder defaults.

Phase A.1 (migration v0→v1) next: introduces the dsSchemaVersion-aware
runner that bumps the DB field added in Phase 0 T2/T3 from 0 to 1
on first DS write per site.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Self-Review Checklist (run after writing the plan, before executing)

- [x] **Spec coverage:** Tasks 1-9 cover spec §5.3 (token shape) + §5.7 (Zod SSOT) + §5.2 (engine boundaries via Provider). They do NOT cover §5.4 (preset shape — Phase A.4) or alias graph (Phase A.2) — explicitly out of scope and called out in the Spec Reference section.
- [x] **Placeholder scan:** Every step has either exact code, exact command, or explicit branching. No "TBD", "implement later", or bare "add validation".
- [x] **Type consistency:** `TokenKind` spelled identically in types.ts, designToken.ts (Zod), useTokensForKind.ts, all 11 per-kind wrappers, TokenRegistryProvider, and constants.ts.
- [x] **Factory contract is complete:** `useTokensForKind` returns the same 15-key shape as the existing `useColorTokens` (verified by reading useColorTokens.ts step in Task 4). Per-kind wrappers (Task 6) re-export the factory's return type so consumers get the same shape.
- [x] **Test isolation:** Schema tests (Task 3) are pure — no React. Factory tests (Task 5) use renderHook+act, which jsdom supports per Phase 0 T1 verification (10/10 useCallout test passed).
- [x] **Reversibility:** Each task is its own commit. Reverting Task 6's per-kind wrappers leaves the factory + types intact. Reverting Task 7 leaves the wrappers+factory unimported but unbroken.

---

## Acceptance Criteria

Phase A.0 is complete when:

1. `editor/design-system/types.ts` has `TokenKind` (14-member union) + `TokenValue` discriminated union + extended `DesignToken` with optional `kind`/`friendlyName`/`aliasOf`/`typedValue`.
2. `packages/shared/schemas/designToken.ts` exports `TokenKindSchema`, `TokenValueSchema`, `DesignTokenSchema` and passes 17 unit tests.
3. `useTokensForKind` factory exists and passes 10 unit tests.
4. 11 new per-kind wrapper hooks exist as one-line factory calls; each is its own commit.
5. `TokenRegistryProvider` mounts all 14 contexts; existing 3 hooks (color/spacing/type) and their tests still pass.
6. `DEFAULT_TOKENS` seeded with 18 placeholder tokens for the 11 new kinds; all pass Zod validation.
7. Full editor suite passes at ≥ 2069 + new test count (≈ 2096).
8. TSC error count for editor and root unchanged from Phase 0 baseline (no new errors).
9. Tag `ds-phase-a0-complete` exists locally (push gated on user explicit OK).
10. TODOS.md has a Phase A.0 CLOSED block.

When all 10 are green, Phase A.1 (migration v0→v1) is unblocked.

---

## Handoff to Phase A.1

Phase A.1 plan (`docs/superpowers/plans/2026-05-XX-ds-phase-a1-migration-v0-to-v1.md`) — to be written next — assumes:

- All 14 token kinds are accessible via `useXRegistry()` hooks (proved here).
- `DesignTokenSchema` Zod validator exists for round-trip checks (proved here).
- `Site.dsSchemaVersion Int @default(0)` exists in DB (proved in Phase 0 T2/T3).

Phase A.1 introduces:
- `MigrationRunner` engine manager that reads `dsSchemaVersion`, applies migrations 0→1 sequentially.
- v0→v1: writes seed tokens to `Site.projectStyles` JSON, sets `dsSchemaVersion=1`.
- Idempotency: re-running v0→v1 on a v=1 site is a no-op.
- Resume after crash: `dsMigrationInProgress` marker per spec §10.4.

Phase A.1 is ~3 days of work and warrants its own plan. Do NOT inline its tasks here.
