# Brand Part 1b — Binding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Elements a user inserts are bound to semantic tokens, a token in use can never be deleted into an
undefined `var()`, old sites can connect their raw values to tokens in one undo step, and a workspace theme
push never drops a token the site still uses.

**Architecture:** The pure token logic stays in `@buildrik/shared` (the usage index, `replacedBy` semantics
in the schema / emitter / resolver, and the theme-push merge), so the editor and the server count usage the
same way. The editor's `TokenUsageTracker` becomes the one editor-facing usage object, counting site-wide
(every page, project and global styles, saved components, presets) through the shared index. A
removal guard inside `composer.designSystem.setTokens` protects every token write, not only the Delete
menu. Insert defaults move from raw hex/px to `var(--buildrick-design-<semantic>)`. Connect to tokens is a
pure suggestion function plus one Composer transaction. The UI for usage, safe delete and Connect waits for
boards BRP1-M5/M6/M7 (D15); every engine/data half ships first.

**Tech Stack:** TypeScript 5 (strict), Zod, Vitest + React Testing Library, Prisma 5 / PostgreSQL (read
only in 1b — no schema change), tRPC 11 (no new endpoint), React 18 (editor), Playwright (E2E).

**Spec:** `docs/superpowers/specs/2026-10-05-brand-token-foundation-design.md` (CEO + eng reviewed).
This plan covers **Delivery step 1b** only: §3 (insert-bound defaults, Connect to tokens), §6 (usage map +
safe delete), §4 "Theme push vs in-use tokens", and spec tests 3, 4, 6, 11, 20, 21, 29 (Connect half), 30.
1c (scale generator, Dark mode Auto/Off + D11 flow, theme-toggle block, restore list, logo/URL import) is
out of scope; dependencies on it are named where they occur.

**Style reference:** `docs/superpowers/plans/2026-10-05-brand-part1a-foundation.md` (same conventions).

---

## Reality check (code is truth over spec)

Read on `main` @ `e1f86397d` (1a merged as `44f5db956`, deployed 2026-10-07). Each line is a place where the
spec's picture and the shipped code differ; the tasks below are written against the code.

1. **The usage index already exists but nothing uses it.** `buildTokenUsageIndex`
   (`packages/shared/tokens/usage.ts`, 42 lines) shipped in 1a with three tests and no product caller. It
   maps a var name to a token id by stripping `--buildrick-design-`, so it **misses** every token reached by
   another name: `legacyNames` (merged duplicates such as `--buildrick-design-color-action`), the seed's
   `--bd-radius-sm`-style vars, and any `var(--x, fallback)` (its regex needs `)` right after the name). It
   ignores `replacedBy`. It reports `unknown` only when `JSON.stringify` throws, never for a source that is
   simply not loaded.
2. **The editor counts with a second, different scanner.** `engine/designSystem/TokenUsageTracker.ts`
   scans element styles only (all loaded pages — `ElementManager.getAllElements()` spans every page), with
   its own two regexes. It misses project styles, global styles, saved components and presets, follows no
   alias chain, and has the same var-name blind spots. Its consumers: `TokenDetailView` (Used by + delete
   path), `TokensSection` (USED column), `ColorInput` (`usageOf`), `AquibraStudio.tsx:598` (lint highlight).
3. **Soft delete does not reach the page.** The schema checks only that `replacedBy` names an existing
   token. `emitTokenCss` and `resolveTokenLiteral` ignore `replacedBy`, so after "delete with replacement"
   the old var keeps its **old value** in the canvas, export and publish. The spec's "already resolved by
   `AliasResolver`" is true only inside the editor's `AliasResolver`, which no emitter calls.
4. **The guard is UI-only.** `TokenDetailView` hard-deletes when its count is 0. `kindRegistry.deleteToken`,
   spacing reset, import, starters and Review-changes Revert can all remove a token that elements use.
5. **Seed tokens cannot really be deleted.** `mergeProjectTokens` lays the saved set over `DEFAULT_TOKENS`
   by id, so a hard-deleted seed token comes back on the next read. Only site-added tokens can disappear.
6. **The seed is not the spec §1 seed.** `DEFAULT_TOKENS = migrateTokensToV6(DEFAULT_TOKENS_V5)` — today's 19
   colours (4 primitives, 4 merged duplicates as `legacyNames`) plus type/spacing/radius/shadow/button/input
   tokens. There are no gray/blue scales, no `Surface` distinct from `Background`, no `Info`, no white, no
   light border. `color-border` is `#27272A`. The 1a plan deferred the full scales to the 1c generator.
   **Consequence:** most raw values in inserted blocks have no exact token (see Task 5) — binding them is
   blocked on owner decisions OQ-1…OQ-3.
7. **Where the raw values are.** The Components catalog (`editor/components-catalog/`) is already token-bound
   (0 hex). The raw values are in `shared/constants/defaultStyles.ts` (19 hex, 23 token vars) and `blocks/`
   (86 hex, including 2× the banned old accent `#406ED6`). Most common: `#FFF`/`#FFFFFF` (21), `#1A56DB`
   (12), `#E5E7EB` (10), `#F3F4F6`, `#6B7280`, `#111827` (6 each).
8. **No canvas preview layer to reuse.** `ElementManager.previewUpdate` / `PreviewLayer` has no consumer.
   Connect to tokens only replaces a raw value with a token whose light value **equals** it, so in Light the
   canvas is visually identical before and after by construction: the Connect "preview" is a highlight of
   the affected elements (a board decision, BRP1-M7), not a repaint.
9. **No server shape change in 1b.** No Prisma migration, no new env var, no new tRPC endpoint. Theme push
   changes inside `theme.service.ts` only.
10. **Restore points hold tokens only.** `SiteThemeSnapshot.prevStyles` is a token set. Connect changes
    element styles, not tokens, so a `connect` snapshot (spec §8) could not undo it → OQ-4. 1b does not
    write one.
11. **Rollout state.** `BRAND_TOKENS_V2=on` globally in prod since 2026-10-07. The owner said no further prod
    deploys until asked (2026-10-07). 1b ships to `main` only; deploying is the owner's call.
12. **Brief.** `docs/design-jobs/BRAND-PART1/brief.md` as committed on `main` lists the 1b boards as
    BRP1-M5 (usage), BRP1-M6 (safe delete), BRP1-M7 (Connect). None has a node yet.

## Global Constraints

- Accent `#1A56DB` (CLAUDE.md). Purple/violet/indigo banned in chrome. `#406ED6` is retired everywhere.
- Path aliases only; `../../` imports banned. Editor: `@/` → `packages/editor/src/`. Root: `@/lib/...`, `@/server/...`, `@server/...`.
- No `any`. No `as` unless truly necessary (Prisma JSON boundaries are the accepted exception, as today).
- Data flow: Page → tRPC → router → service → Prisma. 1b adds no router; theme-push logic stays in `server/services/theme.service.ts`.
- Chrome UI: `@/editor/chrome-ui` only (never `flowbite-react` directly), `tw:` utilities, `var(--bk-*)` tokens, no raw `<button>/<input>/<select>/<textarea>` (Gate 24).
- No pass-through wrappers, no middle-man files, no duplicated logic: one var-name scanner (`scanTokenRefs`), one property→kind map (`TOKENIZED_PROPERTIES`).
- Token CSS var name comes from the token's `cssVar` (and its `legacyNames`). Never derive it from `token.name`.
- Inserted element styles bind with **no fallback**: `var(--buildrick-design-color-primary)`, never `var(--…, #1A56DB)` (spec §3).
- Every multi-token or multi-element write is one `beginTransaction/endTransaction` (one ⌘Z step).
- Prisma: 1b needs no migration. If an implementer finds it needs one, **stop and ask** — the agent creates migrations, the **owner applies** them (`pnpm prisma migrate deploy`).
- If you add a `process.env.X` read, add its row to the CLAUDE.md env table in the same commit. 1b plans none.
- **Never publish from the QA workspace** (`qa@buildrik.local` has a live Vercel connection). Every live and E2E check blocks `sites.publish` (`blockPublish` in `packages/dashboard/e2e/brand-tokens.spec.ts`).
- Never `git stash` mid-execution. Never push unless the owner asks. Never stage `AquibraStudio.tsx` changes you did not make.
- Read `tsc` exit from the command itself, never after a pipe (`npx tsc --noEmit > /tmp/tsc.log 2>&1; echo $?`).
- Full editor suite + root suite run alone before any merge to main; known load-flaky files: RedirectsScreen, cms.service stripMarkup, BrandWorkspace.pages, ReviewTab.banner, LibraryManager*, OverviewScreen, TemplatesTab.ia, FormAfterSubmitSection, noChromeTokenWrites, SaveVersionModal, PublishTab.gate.
- UI tasks marked **"UI waits for board BRP1-Mx"** start only when the board's node is in the brief's node ledger and `/plan-design-review` has run (D15). Build loop: `figma:figma-design-to-code` → build → board vs live screenshot at 1440×900 (editor CLAUDE.md).

## Review Focus

1. **A token reached by a name other than `--buildrick-design-<id>`** — a merged duplicate's legacy name
   (`--buildrick-design-color-action`), a seed `--bd-radius-sm` var, or `var(--x, #fff)` with a fallback.
   A person deleting that token expects "Used by N" with N > 0 and a refusal, not a silent hard delete that
   leaves elements unstyled. → Task 1 Step 1 (tests `counts legacy names`, `counts var() with a fallback`).
2. **Delete A with replacement B, then delete B.** A's references now resolve through B, so B must count
   them and refuse; the published CSS must say `--A: var(--B)`. → Task 1 Step 1 (`counts references to a
   token replaced by it`) + Task 2 Step 1 (`emits a replaced token as var() of its replacement`).
3. **Delete while saved components are still loading** (IndexedDB slow on a cold open). The count is
   unknown, so delete is refused — never treated as 0. → Task 3 Step 1 (`getCount is unknown while
   components load`).
4. **A bulk write that drops an in-use token** — spacing "Reset", an import, a starter, or Review-changes
   Revert of an "Add token" row the user has since bound. A person expects the write to be refused, not
   an element that loses its value. → Task 4 Step 1 (`refuses a spacing reset that drops a bound custom
   spacing token`).
5. **Theme push onto a site whose kept token aliases a site-only primitive, or whose var name the theme
   already owns.** The kept set must carry its alias closure, never shadow a theme var, and if the merged
   set does not validate the site is reported `failed` with nothing written. → Task 10 Step 1
   (`keeps the alias closure`, `never keeps a token whose var the theme owns`, DB test `reports failed and
   writes nothing when the merge does not validate`).

## Open questions for the owner (do not decide these in code)

| ID | Question | Blocks | Plan default until answered |
|----|----------|--------|-----------------------------|
| OQ-1 | **Seed gap tokens.** Inserted blocks use white, light gray borders/fills and near-black/gray text that no token holds. Add new semantic colour tokens (names, light + dark values) so inserts stay visually identical? They would also appear in Brand on every existing site (merge-over-seed). Recommended set in Task 6. | Tasks 6–7 | Task 6 does not start |
| OQ-2 | **Raw values with no exact token** (`#CCC`, `#F0F0F0`, `#E0E0E0`, `#333`, `#666`, `#1A1A2E`, `#0D0D1A`, `#2563EB`, `#E1EFFE`, `#FEF3C7`, `#DCFCE7`, off-scale px such as `10px`): snap each to the nearest token (a visible change to *newly inserted* blocks only), or keep them raw on a ratcheted allow-list? | Task 7 | Task 7 does not start |
| OQ-3 | **font-weight / line-height.** The spec lists them as bound; no general tokens exist (only `btn-font-weight`, `label-weight`). Add type-kind seed tokens, or leave both properties raw in 1b? | Task 7 | properties stay raw (not in `TOKENIZED_PROPERTIES`) |
| OQ-4 | **Connect restore point.** Spec §8 takes a restore point before Connect Apply, but restore points hold tokens and Connect changes element styles, so restoring would change nothing. Drop it (⌘Z + version history cover Connect), or extend snapshots to element styles (needs a migration; 1c)? | — | no snapshot; Apply is one ⌘Z step |
| OQ-5 | **Connect inside components.** Bind raw values inside component instances (creates instance overrides) and masters, or skip them? | Task 9 | skip instances and masters |
| OQ-6 | **Connect scope.** Whole-value matches only, or also the colour part of shorthands (`border: 1px solid #1A56DB`)? Include breakpoint overrides? | Task 8 | whole value, base styles only |
| OQ-7 | **Deleting seed tokens.** Today it silently comes back. Allow it at all, hide Delete for seed tokens, or make it "reset to default"? Feeds BRP1-M6. | Task 12 | unchanged behaviour |
| OQ-8 | **Theme push result.** Show "kept N site tokens" in Theme manager (BRP1-M4) or stay silent? | — | service returns `kept`, no UI |
| OQ-9 | **Social icon brand colours** (Facebook blue etc. in `SocialIcons`) stay raw as third-party brand colours? | Task 7 | stay raw, allow-listed with reason |
| OQ-10 | **Interim UI before boards.** Until BRP1-M5/M6 land: the "Used by" chip shows nothing when the count is unknown, and a refused delete reuses Brand's existing refusal toast. Acceptable? | Task 4 | as described |
| OQ-11 | **Deploy.** 1b changes theme push and every token write's guard. Prod deploy and its timing are yours (no deploys until asked, 2026-10-07). Run the read-only `replacedBy` audit query (Task 14 Step 6) before deploying. | Task 14 | ships to `main` only |

### Owner answers (2026-10-08)

| # | Answer |
|---|--------|
| OQ-1 | **Add the six recommended seed colour tokens** (on-primary, raised surface, muted surface, subtle border, strong text, subtle text; light + dark). Task 6 starts. |
| OQ-2 | **Keep raw on a tracked (ratcheted) allow-list** — no snapping. |
| OQ-3 | **Leave font-weight / line-height raw in 1b.** |
| OQ-4 | **Drop the Connect restore point** — ⌘Z + version history cover it. |
| OQ-5 | **Skip component instances and masters.** |
| OQ-6 | **Whole-value matches only (no shorthand parts), breakpoint overrides INCLUDED.** Task 8 widens from "base styles only" to base + breakpoint overrides. |
| OQ-7 | **Delete on a seed token becomes "Reset to default".** |
| OQ-8 | **Show "kept N site tokens"** in the Theme manager push result (copy within the existing M4 status row; board M4 to confirm). |
| OQ-9 | **Social brand colours stay raw**, allow-listed with reason. |
| OQ-10 | **Interim UI accepted** (hidden chip when unknown, existing refusal toast). |
| OQ-11 | Open — no prod deploy until the owner asks. |

---

## File Structure

| File | Status | Responsibility |
|------|--------|----------------|
| `packages/shared/tokens/usage.ts` | modify | `tokenIdsByVarName`, `scanTokenRefs`, `buildTokenUsageIndex` v2 (legacy names, fallbacks, `replacedBy`, unavailable sources, `count`, `closure`) |
| `packages/shared/tokens/keepInUse.ts` | create | `keepInUseSiteTokens(theme, site, usage)` — the theme-push merge |
| `packages/shared/tokens/index.ts` | modify | export the new names (barrel only) |
| `packages/shared/schemas/design-tokens.ts` | modify | `replacedBy`: same kind, part of the cycle walk |
| `packages/shared/tokens/emit.ts` | modify | a replaced token emits `var(<replacement>)`, no dark block |
| `packages/shared/tokens/resolve.ts` | modify | `resolveTokenLiteral` follows `replacedBy` first |
| `packages/editor/src/engine/designSystem/TokenUsageTracker.ts` | rewrite | site-wide counts via the shared index (lazy), element breakdown via `scanTokenRefs` |
| `packages/editor/src/engine/components/ComponentManager.ts` | modify | `isLoaded()` |
| `packages/editor/src/engine/Composer.ts` | modify | tracker wiring + invalidation; removal guard in `setTokens`; `connectSuggestions` / `applyConnect`; template-applied event |
| `packages/editor/src/shared/constants/events.ts` | modify | `BRAND_CONNECT_SUGGESTED` + payload |
| `packages/editor/src/shared/constants/tokenProperties.ts` | create | `TOKENIZED_PROPERTIES`, `RAW_VALUE_ALLOWED` (SSOT for insert test + Connect) |
| `packages/editor/src/engine/designSystem/connectTokens.ts` | create | `normalizeTokenValue`, `findConnectSuggestions` (pure) |
| `packages/editor/src/editor/design-system/ui/sections/TokenDetailView.tsx` | modify | delete path reads `getCount` (site-wide, unknown-aware) |
| `packages/editor/src/engine/designSystem/defaultTokens.ts` | modify (after OQ-1) | seed gap tokens |
| `packages/editor/src/themes/design-system/design.css` | modify (after OQ-1) | same values (`verify-design-baselines.mjs`) |
| `packages/shared/tokens/legacySeed.ts` | modify (after OQ-1) | backstop the new seed vars |
| `packages/editor/src/shared/constants/defaultStyles.ts`, `packages/editor/src/blocks/**` | modify (after OQ-1…3) | raw values → semantic `var()` |
| `packages/editor/src/blocks/__tests__/blockRegistry.insertBound.test.ts` | create | spec test 4 |
| `packages/editor/src/blocks/__tests__/__fixtures__/catalogBlockHtml.baseline.json` | regenerate (Task 7) | baseline moves from raw to `var()` |
| `server/services/theme.service.ts` | modify | push/preview keep in-use site tokens; `PushResult.kept` |
| `__tests__/db/theme-push-keeps-in-use.db.test.ts` | create | spec test 21 on the DB tier |
| `packages/dashboard/e2e/brand-tokens.spec.ts` | modify | 1b flows (insert binding, delete guard) |
| `docs/runbooks/brand-token-migration.md` | modify | §6 "Part 1b rollout" |

---

## Before you start (every task)

- Work in a worktree from `main`: `git -C /Users/shahg/Desktop/pencil/buildrik worktree add -b feat/brand-part1b ~/Desktop/buildrik-worktrees/brand-part1b main`, then `pnpm install` there. Never edit `/Users/shahg/Desktop/pencil/buildrik` directly.
- Read `server/AGENTS.md`, `packages/editor/src/engine/AGENTS.md`, `packages/editor/src/editor/AGENTS.md` before touching those folders.
- Editor tests run from `packages/editor` (`npx vitest run <path>`); shared and server tests from the repo root (`npx vitest run <path>`); DB tests with `pnpm test:db -- <path>`.

### Lanes

| Lane | Tasks | Depends on |
|------|-------|------------|
| A — usage + guard | 1 → 2 → 3 → 4 | — |
| B — insert binding | 5 → (OQ-1…3) → 6 → 7 | 5 needs nothing; 7 needs 6 |
| C — Connect | 8 → 9 | 8 needs 5 (`TOKENIZED_PROPERTIES`) |
| D — theme push | 10 | 1 |
| UI (boards) | 11, 12, 13 | 3/4 (11, 12), 9 (13), plus the boards |
| Verify | 14 | all engine tasks |

---

### Task 1: Shared usage index v2

**Files:**
- Modify: `packages/shared/tokens/usage.ts`
- Modify: `packages/shared/tokens/index.ts`
- Test: `packages/shared/tokens/__tests__/usage.test.ts`

**Interfaces:**
- Consumes: `DesignToken` from `@buildrik/shared/schemas/design-tokens`.
- Produces:
  - `type TokenUsageCount = number | "unknown"`
  - `tokenIdsByVarName(tokens: readonly DesignToken[]): Map<string, string>`
  - `scanTokenRefs(text: string, byVar: ReadonlyMap<string, string>): string[]`
  - `buildTokenUsageIndex(sources: readonly unknown[], tokens: readonly DesignToken[], opts?: { unavailable?: readonly string[] }): TokenUsageIndex`
  - `interface TokenUsageIndex { direct: Map<string, number>; unknown: boolean; unavailable: readonly string[]; total(id: string): number; count(id: string): TokenUsageCount; closure(id: string): string[] }`

- [ ] **Step 1: Write the failing tests** — append to `usage.test.ts` (keep the three existing tests; the
  `tok` helper and `tokens` fixture are already at the top of the file):

```ts
import { scanTokenRefs, tokenIdsByVarName } from "../usage";

const merged: DesignToken = {
  ...tok("color-primary-x", { value: "#1A56DB" }),
  legacyNames: ["--buildrick-design-color-action"],
};
const bdRadius: DesignToken = {
  id: "radius-sm", name: "Small radius", kind: "radius", layer: "semantic", modes: { light: { value: "4px" } },
  category: "layout", cssVar: "--bd-radius-sm", type: "length",
};

describe("buildTokenUsageIndex v2", () => {
  it("counts legacy names and non-prefixed vars by the token that answers to them", () => {
    const idx = buildTokenUsageIndex(
      [[{ a: "var(--buildrick-design-color-action)" }, { r: "var(--bd-radius-sm)" }]],
      [merged, bdRadius],
    );
    expect(idx.count("color-primary-x")).toBe(1);
    expect(idx.count("radius-sm")).toBe(1);
  });

  it("counts var() with a fallback", () => {
    const idx = buildTokenUsageIndex([[{ c: "var(--buildrick-design-color-primary, #1A56DB)" }]], tokens);
    expect(idx.count("color-primary")).toBe(1);
  });

  it("counts references to a token replaced by it", () => {
    const old = { ...tok("color-old", { value: "#000000" }), replacedBy: "color-primary" };
    const idx = buildTokenUsageIndex([[{ c: "var(--buildrick-design-color-old)" }]], [...tokens, old]);
    expect(idx.count("color-primary")).toBe(1);
    expect(idx.closure("color-primary").sort()).toEqual(["color-old", "color-primary"]);
  });

  it("is unknown for every token when a source is unavailable", () => {
    const idx = buildTokenUsageIndex([[]], tokens, { unavailable: ["components"] });
    expect(idx.unknown).toBe(true);
    expect(idx.count("blue-600")).toBe("unknown");
    expect(idx.total("blue-600")).toBe(0);
  });

  it("serializes each source exactly once (spec test 30)", () => {
    const spy = vi.spyOn(JSON, "stringify");
    const idx = buildTokenUsageIndex([[{ a: 1 }], [{ b: 2 }], [{ c: 3 }]], tokens);
    idx.count("color-primary");
    idx.count("blue-600");
    expect(spy).toHaveBeenCalledTimes(3);
    spy.mockRestore();
  });
});

describe("scanTokenRefs", () => {
  it("returns ids in order, repeats kept, unknown prefixed vars by suffix", () => {
    const byVar = tokenIdsByVarName(tokens);
    expect(scanTokenRefs("linear-gradient(var(--buildrick-design-color-primary), var(--buildrick-design-color-primary))", byVar))
      .toEqual(["color-primary", "color-primary"]);
    expect(scanTokenRefs("var(--buildrick-design-not-a-token)", byVar)).toEqual(["not-a-token"]);
    expect(scanTokenRefs("var(--some-other-lib)", byVar)).toEqual([]);
    expect(scanTokenRefs("{{token.color-primary}}", byVar)).toEqual(["color-primary"]);
  });
});
```

Add `vi` to the vitest import line.

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run packages/shared/tokens/__tests__/usage.test.ts`
Expected: FAIL — `scanTokenRefs is not exported`, then count/closure assertions.

- [ ] **Step 3: Implement** — replace `usage.ts`:

```ts
// packages/shared/tokens/usage.ts
/**
 * Token usage (spec §6). One pass over every source (pages, project and global
 * styles, saved components, presets): each token's direct references, then
 * totals through alias chains AND soft-delete bridges (`replacedBy`), because a
 * reference to a replaced token resolves through its replacement.
 *
 * A var is matched by the names a token answers to — its `cssVar` and its
 * `legacyNames` — never by assuming `--buildrick-design-<id>`; the seed's
 * radius/shadow tokens live under `--bd-*`. A source the caller could not read
 * makes every count "unknown", never 0: delete must refuse rather than guess.
 */
import type { DesignToken } from "../schemas/design-tokens";

const VAR_RE = /var\(\s*(--[A-Za-z0-9_-]+)\s*[,)]/g;
const TPL_RE = /\{\{token\.([A-Za-z0-9._-]+)\}\}/g;
const PREFIX = "--buildrick-design-";

export type TokenUsageCount = number | "unknown";

export interface TokenUsageIndex {
  direct: Map<string, number>;
  unknown: boolean;
  unavailable: readonly string[];
  total(id: string): number;
  count(id: string): TokenUsageCount;
  /** `id` plus every token whose references resolve through it. */
  closure(id: string): string[];
}

/** Var name → token id. A token's own `cssVar` beats another token's legacy name. */
export function tokenIdsByVarName(tokens: readonly DesignToken[]): Map<string, string> {
  const byVar = new Map<string, string>();
  for (const t of tokens) for (const n of t.legacyNames ?? []) if (!byVar.has(n)) byVar.set(n, t.id);
  for (const t of tokens) byVar.set(t.cssVar, t.id);
  return byVar;
}

/** Every token id one string references, in order, repeats kept. */
export function scanTokenRefs(text: string, byVar: ReadonlyMap<string, string>): string[] {
  const ids: string[] = [];
  if (text.includes("var(")) {
    for (const m of text.matchAll(VAR_RE)) {
      const id = byVar.get(m[1]) ?? (m[1].startsWith(PREFIX) ? m[1].slice(PREFIX.length).toLowerCase() : undefined);
      if (id) ids.push(id);
    }
  }
  if (text.includes("{{token.")) for (const m of text.matchAll(TPL_RE)) ids.push(m[1].toLowerCase());
  return ids;
}

export function buildTokenUsageIndex(
  sources: readonly unknown[],
  tokens: readonly DesignToken[],
  opts: { unavailable?: readonly string[] } = {},
): TokenUsageIndex {
  const byVar = tokenIdsByVarName(tokens);
  const direct = new Map<string, number>();
  const unavailable = [...(opts.unavailable ?? [])];
  for (const [i, src] of sources.entries()) {
    let text: string;
    try {
      text = JSON.stringify(src) ?? "";
    } catch {
      unavailable.push(`source ${i}`);
      continue;
    }
    for (const id of scanTokenRefs(text, byVar)) direct.set(id, (direct.get(id) ?? 0) + 1);
  }
  const referrers = new Map<string, string[]>();
  const link = (target: string, from: string) => referrers.set(target, [...(referrers.get(target) ?? []), from]);
  for (const t of tokens) {
    for (const ref of [t.modes.light, t.modes.dark]) if (ref && "alias" in ref) link(ref.alias, t.id);
    if (t.replacedBy) link(t.replacedBy, t.id);
  }
  const closure = (id: string): string[] => {
    const seen = new Set<string>();
    const walk = (cur: string) => {
      if (seen.has(cur)) return;
      seen.add(cur);
      for (const child of referrers.get(cur) ?? []) walk(child);
    };
    walk(id);
    return [...seen];
  };
  const total = (id: string) => closure(id).reduce((n, cur) => n + (direct.get(cur) ?? 0), 0);
  const unknown = unavailable.length > 0;
  return { direct, unknown, unavailable, total, count: (id) => (unknown ? "unknown" : total(id)), closure };
}
```

In `index.ts` replace the usage line with:

```ts
export { buildTokenUsageIndex, scanTokenRefs, tokenIdsByVarName, type TokenUsageCount, type TokenUsageIndex } from "./usage";
```

- [ ] **Step 4: Run to verify they pass**

Run: `npx vitest run packages/shared/tokens/__tests__/usage.test.ts`
Expected: PASS (8 tests). The existing "reports unknown … cannot be serialized" test still passes (`unknown` is now driven by `unavailable`).

- [ ] **Step 5: Commit**

```bash
git add packages/shared/tokens/usage.ts packages/shared/tokens/index.ts packages/shared/tokens/__tests__/usage.test.ts
git commit -m "feat(tokens): usage index counts legacy names, fallbacks and replaced tokens; unknown when a source is missing"
```

---

### Task 2: `replacedBy` reaches the page (schema, emitter, resolver)

**Files:**
- Modify: `packages/shared/schemas/design-tokens.ts` (`graphProblem`)
- Modify: `packages/shared/tokens/emit.ts`
- Modify: `packages/shared/tokens/resolve.ts` (`resolveTokenLiteral`)
- Test: `packages/shared/schemas/__tests__/design-tokens.test.ts`, `packages/shared/tokens/__tests__/emit.test.ts`, `packages/shared/tokens/__tests__/resolve.test.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: a token with `replacedBy: X` is a soft-deleted bridge: it must have the same `kind` as X; it
  emits `<cssVar>:var(<X.cssVar>)` (light block only — the replacement's own dark block reaches it through
  `var()`); `resolveTokenLiteral(tokens, id, mode)` resolves X in that mode. Cycles through `replacedBy` and
  aliases are refused.

- [ ] **Step 1: Write the failing tests**

`design-tokens.test.ts` (reuse the file's `prim` helper):

```ts
it("refuses replacedBy of another kind", () => {
  const radius = { ...prim("radius-x", "4px"), kind: "radius" as const, category: "layout" as const, type: "length" as const };
  const r = validateTokens([prim("a", "#000"), { ...radius, replacedBy: "a" }]);
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.reason).toMatch(/replacedBy .* another kind/);
});

it("refuses a replacedBy cycle", () => {
  const r = validateTokens([{ ...prim("a", "#000"), replacedBy: "b" }, { ...prim("b", "#111"), replacedBy: "a" }]);
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.reason).toMatch(/cycle/);
});
```

`emit.test.ts`:

```ts
it("emits a replaced token as var() of its replacement, with no dark block of its own", () => {
  const css = emitTokenCss(
    [
      { ...semantic("color-new", { value: "#1A56DB" }), modes: { light: { value: "#1A56DB" }, dark: { value: "#60A5FA" } } },
      { ...semantic("color-old", { value: "#000000" }), modes: { light: { value: "#000000" }, dark: { value: "#FFFFFF" } }, replacedBy: "color-new" },
    ],
    { darkMode: "auto" },
  );
  expect(css).toContain("--buildrick-design-color-old:var(--buildrick-design-color-new)");
  expect(css).not.toMatch(/--buildrick-design-color-old:#FFFFFF/);
  expect(css).not.toContain("--buildrick-design-color-old:#000000");
});
```

(If `emit.test.ts` has no `semantic(id, light)` helper, add one next to its existing helpers:
`const semantic = (id: string, light: TokenRef): DesignToken => ({ id, name: id, kind: "color", layer: "semantic", modes: { light }, category: "colors", cssVar: \`--buildrick-design-${id}\`, type: "color" });`)

`resolve.test.ts`:

```ts
it("follows replacedBy before the token's own value, in both modes", () => {
  const ts: DesignToken[] = [
    { ...c("color-new", "#1A56DB"), modes: { light: { value: "#1A56DB" }, dark: { value: "#60A5FA" } } },
    { ...c("color-old", "#000000"), replacedBy: "color-new" },
  ];
  expect(resolveTokenLiteral(ts, "color-old", "light")).toBe("#1A56DB");
  expect(resolveTokenLiteral(ts, "color-old", "dark")).toBe("#60A5FA");
});
```

(`c(id, value)` = a semantic colour token with a literal light value; add it if the file lacks one.)

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run packages/shared/schemas/__tests__/design-tokens.test.ts packages/shared/tokens/__tests__/emit.test.ts packages/shared/tokens/__tests__/resolve.test.ts`
Expected: FAIL on the four new tests.

- [ ] **Step 3: Implement**

`design-tokens.ts`, in `graphProblem` replace the `replacedBy` line and the cycle walk's `ref` line:

```ts
    if (t.replacedBy) {
      const target = byId.get(t.replacedBy);
      if (!target) return `${t.id} replacedBy missing token ${t.replacedBy}`;
      if (target.kind !== t.kind) return `${t.id} (${t.kind}) replacedBy ${target.id} of another kind (${target.kind})`;
    }
```

```ts
        // A replaced token resolves through its replacement in every mode.
        const ref: TokenRef = cur.replacedBy
          ? { alias: cur.replacedBy }
          : (mode === "dark" && cur.modes.dark) || cur.modes.light;
```

`emit.ts`: add after `const byId = …`:

```ts
  /* A soft-deleted token (spec §6) points at its replacement: every name it
     answers to must read the replacement's value, in both modes. */
  const lightRef = (t: DesignToken): TokenRef => (t.replacedBy ? { alias: t.replacedBy } : t.modes.light);
```

Then replace `const ref = t.modes.light;` in `emits` with `const ref = lightRef(t);`, replace
`refCss(t.modes.light)` and the `"alias" in t.modes.light` in the skip message with `lightRef(t)`, and
change the dark condition to `if (opts.darkMode === "auto" && t.modes.dark && !t.replacedBy) {`.

`resolve.ts`, in `resolveTokenLiteral` replace the `ref` line:

```ts
    const ref: TokenRef = cur.replacedBy
      ? { alias: cur.replacedBy }
      : (mode === "dark" && cur.modes.dark) || cur.modes.light;
```

- [ ] **Step 4: Run to verify they pass — plus every shared token test**

Run: `npx vitest run packages/shared`
Expected: PASS. The migration "identical resolved CSS" fixtures must still pass: a v5 rename bridge
(`replacedBy` → a copy with the same value) resolves to the same value.

- [ ] **Step 5: Commit**

```bash
git add packages/shared/schemas/design-tokens.ts packages/shared/tokens/emit.ts packages/shared/tokens/resolve.ts packages/shared/schemas/__tests__/design-tokens.test.ts packages/shared/tokens/__tests__/emit.test.ts packages/shared/tokens/__tests__/resolve.test.ts
git commit -m "fix(tokens): a replaced token resolves to its replacement in canvas, export and publish"
```

---

### Task 3: Site-wide usage in the editor

**Files:**
- Rewrite: `packages/editor/src/engine/designSystem/TokenUsageTracker.ts`
- Modify: `packages/editor/src/engine/components/ComponentManager.ts` (`isLoaded`)
- Modify: `packages/editor/src/engine/Composer.ts` (tracker construction ~:315, recompute wiring ~:370-390)
- Test: `packages/editor/src/engine/designSystem/__tests__/TokenUsageTracker.test.ts` (rewrite the cases that assert element-only counting in the same commit)

**Interfaces:**
- Consumes: Task 1 (`buildTokenUsageIndex`, `scanTokenRefs`, `tokenIdsByVarName`, `TokenUsageCount`).
- Produces (`composer.designSystem.tokenUsage`):
  - `constructor(readTokens: () => readonly DesignToken[], readSources: () => { sources: readonly unknown[]; unavailable: readonly string[] })`
  - `recompute(elements: readonly Element[]): void` — eager element breakdown, marks the index stale, emits `"tokenUsage:changed"`
  - `invalidate(): void` — marks the index stale, emits `"tokenUsage:changed"`
  - `getUsage(id): number` — site-wide total (known part), through alias and `replacedBy` chains
  - `getCount(id): TokenUsageCount` — `"unknown"` when any source is unavailable
  - `getBreakdown(id): readonly UsageRef[]` — element refs for `id` and every token in its closure
  - `getAllUsage(): ReadonlyMap<string, number>` — `getUsage` for every token id
  - `ComponentManager.isLoaded(): boolean`

- [ ] **Step 1: Write the failing tests** (new `describe` in `TokenUsageTracker.test.ts`; keep the file's
  existing element stubs for the breakdown cases and rewrite any case that asserted a count from element
  styles alone to the new site-wide meaning):

```ts
import { DEFAULT_TOKENS } from "@/engine/designSystem/defaultTokens";

describe("TokenUsageTracker · site-wide", () => {
  const make = (sources: unknown[], unavailable: string[] = []) => {
    const build = vi.fn(() => ({ sources, unavailable }));
    return { tracker: new TokenUsageTracker(() => DEFAULT_TOKENS, build), build };
  };

  it("counts project styles and components, not only element styles", () => {
    const { tracker } = make([[], [{ rules: { color: "var(--buildrick-design-color-primary)" } }], [{ masterTree: { styles: { color: "var(--buildrick-design-color-primary)" } } }]]);
    tracker.recompute([]);
    expect(tracker.getUsage("color-primary")).toBe(2);
  });

  it("getCount is unknown while components load", () => {
    const { tracker } = make([[]], ["components"]);
    tracker.recompute([]);
    expect(tracker.getCount("color-primary")).toBe("unknown");
  });

  it("builds the site index lazily, once per change burst", () => {
    const { tracker, build } = make([[]]);
    tracker.recompute([]);
    tracker.recompute([]);
    expect(build).not.toHaveBeenCalled();
    tracker.getUsage("color-primary");
    tracker.getCount("color-secondary");
    expect(build).toHaveBeenCalledTimes(1);
    tracker.invalidate();
    tracker.getUsage("color-primary");
    expect(build).toHaveBeenCalledTimes(2);
  });

  it("breakdown follows a legacy var name to its token", () => {
    const { tracker } = make([[]]);
    tracker.recompute([stubElement("e1", { color: "var(--buildrick-design-color-action)" })]);
    expect(tracker.getBreakdown("color-primary")).toEqual([{ elementId: "e1", styleProp: "color" }]);
  });
});

describe("TokenUsageTracker via Composer · sources", () => {
  it("is unknown until saved components have loaded, then counts", async () => {
    const c = createTestComposer();
    vi.spyOn(c.components, "isLoaded").mockReturnValue(false);
    c.designSystem.tokenUsage.invalidate();
    expect(c.designSystem.tokenUsage.getCount("color-primary")).toBe("unknown");
    vi.mocked(c.components.isLoaded).mockReturnValue(true);
    c.designSystem.tokenUsage.invalidate();
    expect(typeof c.designSystem.tokenUsage.getCount("color-primary")).toBe("number");
  });
});
```

(`stubElement(id, styles)` = the file's existing element stub returning `getId()`/`getStyles()`; reuse
it. `createTestComposer` from `@/engine/__tests__/test-utils/realComposer` with
`installEngineBrowserStubs` in `beforeAll`, as the block tests do.)

- [ ] **Step 2: Run to verify they fail**

Run (from `packages/editor`): `npx vitest run src/engine/designSystem/__tests__/TokenUsageTracker.test.ts`
Expected: FAIL — constructor arity / `getCount` / `invalidate` / `isLoaded` missing.

- [ ] **Step 3: Implement the tracker**

```ts
// packages/editor/src/engine/designSystem/TokenUsageTracker.ts
/**
 * TokenUsageTracker — the editor's one view of token usage (spec §6).
 *
 * Two answers, two costs:
 *  - the element BREAKDOWN (which element / style property binds a token) is
 *    walked eagerly on every element change, as before — cheap, and what the
 *    canvas highlight and the "Used by" drill-in need;
 *  - the site-wide COUNT (every page incl. CMS templates, project and global
 *    styles, saved components, presets — through alias and replacedBy chains)
 *    comes from the shared index, built lazily on first read after a change,
 *    because it serializes the whole project.
 * Both parse var names with the shared `scanTokenRefs`, so the editor and the
 * server (theme push) agree on what "in use" means.
 *
 * @module engine/designSystem/TokenUsageTracker
 * @license BSD-3-Clause
 */
import {
  buildTokenUsageIndex,
  scanTokenRefs,
  tokenIdsByVarName,
  type TokenUsageCount,
  type TokenUsageIndex,
} from "@buildrik/shared/tokens";
import type { Element } from "../elements/Element";
import { EventEmitter } from "../EventEmitter";
import type { DesignToken } from "./types";

export interface UsageRef {
  readonly elementId: string;
  readonly styleProp: string;
}

export class TokenUsageTracker extends EventEmitter {
  private refs = new Map<string, UsageRef[]>();
  private index: TokenUsageIndex | null = null;

  constructor(
    private readonly readTokens: () => readonly DesignToken[],
    private readonly readSources: () => { sources: readonly unknown[]; unavailable: readonly string[] },
  ) {
    super();
  }

  recompute(elements: readonly Element[]): void {
    this.refs.clear();
    const byVar = tokenIdsByVarName(this.readTokens());
    for (const el of elements) {
      const elementId = el.getId();
      for (const [styleProp, value] of Object.entries(el.getStyles())) {
        if (typeof value !== "string") continue;
        for (const id of scanTokenRefs(value, byVar)) {
          const bucket = this.refs.get(id);
          const entry: UsageRef = { elementId, styleProp };
          if (bucket) bucket.push(entry);
          else this.refs.set(id, [entry]);
        }
      }
    }
    this.invalidate();
  }

  invalidate(): void {
    this.index = null;
    this.emit("tokenUsage:changed");
  }

  private siteIndex(): TokenUsageIndex {
    if (!this.index) {
      const { sources, unavailable } = this.readSources();
      this.index = buildTokenUsageIndex(sources, this.readTokens(), { unavailable });
    }
    return this.index;
  }

  getUsage(tokenId: string): number {
    return this.siteIndex().total(tokenId);
  }

  getCount(tokenId: string): TokenUsageCount {
    return this.siteIndex().count(tokenId);
  }

  getBreakdown(tokenId: string): readonly UsageRef[] {
    return this.siteIndex().closure(tokenId).flatMap((id) => this.refs.get(id) ?? []);
  }

  getAllUsage(): ReadonlyMap<string, number> {
    const idx = this.siteIndex();
    return new Map(this.readTokens().map((t) => [t.id, idx.total(t.id)]));
  }
}
```

`ComponentManager.ts`: add a field and set it at the end of `loadComponentsFromStorage` (wrap the body in
`try { … this.loaded = true; } catch (e) { console.warn("[components] load failed", e); this.loaded = false; }`
keeping the existing emit inside the `try`), and:

```ts
  private loaded = false;

  /** True once saved components are in memory — or when nothing can be stored
   *  (no storage / disabled), so there is nothing to wait for. False while a
   *  load is in flight or after it failed: token usage is then unknown. */
  isLoaded(): boolean {
    return this.loaded || !this.isAvailable();
  }
```

`Composer.ts`: replace `const tokenUsage = new TokenUsageTracker();` with

```ts
    const tokenUsage = new TokenUsageTracker(
      () => this.mergedDesignTokens(),
      () => {
        const components = this.components.isLoaded() ? this.components.getAllComponents() : null;
        return {
          sources: [
            this.elements.exportPages(),
            this.styles.exportStyles(),
            this.globalStyles.getAll(),
            components ?? [],
            this.getProjectSettings().designPresets ?? [],
          ],
          unavailable: components === null ? ["components"] : [],
        };
      },
    );
```

and, next to the four `scheduleRecomputeTokenUsage` subscriptions, add the non-element invalidations
(settings/tokens, project styles, component list, load):

```ts
    const invalidateTokenUsage = () => tokenUsage.invalidate();
    this.on(EVENTS.PROJECT_CHANGED, invalidateTokenUsage);
    this.on(EVENTS.PROJECT_LOADED, invalidateTokenUsage);
    this.on(EVENTS.COMPONENT_LIST_UPDATED, invalidateTokenUsage);
```

Extract the microtask body into a private method so Task 4 can force a synchronous recompute:

```ts
  private recomputeTokenUsage(): void {
    this.designSystem.tokenUsage.recompute(this.elements.getAllElements());
  }
```

and call it from the `queueMicrotask` callback.

- [ ] **Step 4: Run to verify they pass — plus every consumer's tests**

Run (from `packages/editor`):
`npx vitest run src/engine/designSystem src/editor/design-system src/editor/inspector/shared/controls src/engine/__tests__`
Expected: PASS. A consumer test that asserted an element-only count (e.g. a TokensSection USED cell) is
rewritten in this commit to the site-wide count — never loosened to "any number".

- [ ] **Step 5: Commit**

```bash
git add packages/editor/src/engine/designSystem/TokenUsageTracker.ts packages/editor/src/engine/components/ComponentManager.ts packages/editor/src/engine/Composer.ts packages/editor/src/engine/designSystem/__tests__ packages/editor/src/editor
git commit -m "feat(brand): token usage counts the whole site (styles, components, presets) and is unknown while components load"
```

---

### Task 4: Removal guard on every token write

**Files:**
- Modify: `packages/editor/src/engine/Composer.ts` (`designSystem.setTokens` ~:350)
- Modify: `packages/editor/src/editor/design-system/ui/sections/TokenDetailView.tsx` (~:276-310, `consumerCount`)
- Test: `packages/editor/src/engine/__tests__/Composer.setTokens.test.ts`, `packages/editor/src/editor/design-system/ui/sections/__tests__/TokenDetailView.test.tsx`

**Interfaces:**
- Consumes: Task 3 (`tokenUsage.getCount`, `Composer.recomputeTokenUsage`), Task 2 (`replacedBy` semantics).
- Produces: `setTokens(next, label)` returns `false` and writes nothing when `next` (merged over the seed)
  drops a token whose site-wide count is not `0` (in use, or `"unknown"`). Soft delete (`replacedBy`) keeps
  the token, so it is never blocked by this guard; a bad replacement is refused by the schema (Task 2).

- [ ] **Step 1: Write the failing tests** (`Composer.setTokens.test.ts`, reusing its `withTokens()` helper):

```ts
const custom = (id: string, kind: DesignToken["kind"], value: string): DesignToken => ({
  id, name: id, kind, layer: "semantic", modes: { light: { value } },
  category: kind === "spacing" ? "spacing" : "colors", cssVar: `--buildrick-design-${id}`, type: kind === "spacing" ? "length" : "color",
});

function bindRoot(c: Composer, prop: string, value: string) {
  c.elements.getElement("root")!.setStyle(prop, value);
  c.history.flushPending();
}

describe("setTokens · removal guard (spec §6, test 11)", () => {
  it("refuses removing a token an element uses, keeps it, and allows it once unused", () => {
    const c = withTokens();
    const brand = custom("color-brand-x", "color", "#0E7490");
    expect(c.designSystem.setTokens([...DEFAULT_TOKENS, brand], "Add")).toBe(true);
    bindRoot(c, "color", "var(--buildrick-design-color-brand-x)");
    expect(c.designSystem.setTokens(DEFAULT_TOKENS, "Delete token")).toBe(false);
    expect(c.getProjectSettings().designTokens?.some((t) => t.id === "color-brand-x")).toBe(true);
    bindRoot(c, "color", "#000000");
    expect(c.designSystem.setTokens(DEFAULT_TOKENS, "Delete token")).toBe(true);
  });

  it("refuses a spacing reset that drops a bound custom spacing token", () => {
    const c = withTokens();
    expect(c.designSystem.setTokens([...DEFAULT_TOKENS, custom("space-7", "spacing", "28px")], "Add")).toBe(true);
    bindRoot(c, "padding", "var(--buildrick-design-space-7)");
    expect(c.designSystem.setTokens(DEFAULT_TOKENS, "Reset spacing")).toBe(false);
  });

  it("refuses removal while usage is unknown", () => {
    const c = withTokens();
    expect(c.designSystem.setTokens([...DEFAULT_TOKENS, custom("color-brand-y", "color", "#123456")], "Add")).toBe(true);
    vi.spyOn(c.components, "isLoaded").mockReturnValue(false);
    expect(c.designSystem.setTokens(DEFAULT_TOKENS, "Delete token")).toBe(false);
  });

  it("allows a soft delete of an in-use token, and the element resolves to the replacement", () => {
    const c = withTokens();
    expect(c.designSystem.setTokens([...DEFAULT_TOKENS, custom("color-brand-x", "color", "#0E7490")], "Add")).toBe(true);
    bindRoot(c, "color", "var(--buildrick-design-color-brand-x)");
    const all = c.getProjectSettings().designTokens ?? [];
    const soft = all.map((t) => (t.id === "color-brand-x" ? { ...t, replacedBy: "color-primary" } : t));
    expect(c.designSystem.setTokens(soft, "Delete token")).toBe(true);
    expect(resolveTokenLiteral(c.getProjectSettings().designTokens ?? [], "color-brand-x", "light")).toBe(
      resolveTokenLiteral(DEFAULT_TOKENS, "color-primary", "light"),
    );
  });

  it("deleting a seed token is not a removal (the seed merges it back)", () => {
    const c = withTokens();
    expect(c.designSystem.setTokens(DEFAULT_TOKENS.filter((t) => t.id !== "space-12"), "Delete token")).toBe(true);
  });
});
```

`TokenDetailView.test.tsx`: add a case using the file's existing render harness and fake composer: with
`tokenUsage.getCount` returning `"unknown"` and `getBreakdown` returning `[]`, choosing Delete must **not**
call `onDelete(id)` without a replacement (it opens the replacement picker or calls `onRefused`; assert
`onDelete` was not called with a single argument).

- [ ] **Step 2: Run to verify they fail**

Run (from `packages/editor`): `npx vitest run src/engine/__tests__/Composer.setTokens.test.ts src/editor/design-system/ui/sections/__tests__/TokenDetailView.test.tsx`
Expected: FAIL — the first three guard tests return `true`; the TokenDetailView case hard-deletes.

- [ ] **Step 3: Implement**

`Composer.ts`, in `setTokens` after the `validateTokens` refusal:

```ts
        const blocked = this.tokensRemovedInUse(checked.tokens);
        if (blocked.length > 0) {
          console.warn(`[tokens] refused "${label}": still in use or uncounted: ${blocked.join(", ")}`);
          return false;
        }
```

and a private method next to `mergedDesignTokens`:

```ts
  /** Ids the write would remove (after the seed merges back) whose site-wide
   *  usage is not a known 0. Builds usage synchronously: the microtask-coalesced
   *  recompute may not have run since the last element edit. */
  private tokensRemovedInUse(next: DesignToken[]): string[] {
    const after = new Set(mergeProjectTokens(next, TOKENS_SCHEMA_VERSION).map((t) => t.id));
    const removed = this.mergedDesignTokens().filter((t) => !after.has(t.id));
    if (removed.length === 0) return [];
    this.recomputeTokenUsage();
    return removed.filter((t) => this.designSystem.tokenUsage.getCount(t.id) !== 0).map((t) => t.id);
  }
```

`TokenDetailView.tsx`: replace the `consumerCount` line and the first branch of `handleDelete`:

```ts
  const consumerCount = composer?.designSystem?.tokenUsage?.getCount(token.id) ?? 0;
```

```ts
    if (consumerCount === 0) {
      onDelete?.(token.id);
      onDeleted?.();
      return;
    }
    setReplaceOpen(true);
```

and pass `usage={typeof consumerCount === "number" ? consumerCount : undefined}` to `TokenReplaceModal`
(make its `usage` prop optional if it is not; when undefined the modal omits its count line — interim
until BRP1-M6, OQ-10). An unknown count therefore always goes through the replacement picker, and a
hard delete attempted anyway is refused by the engine guard (Brand's existing `refused()` toast).

- [ ] **Step 4: Run to verify they pass — plus Brand**

Run (from `packages/editor`): `npx vitest run src/engine/__tests__ src/editor/design-system`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/editor/src/engine/Composer.ts packages/editor/src/engine/__tests__/Composer.setTokens.test.ts packages/editor/src/editor/design-system/ui/sections
git commit -m "feat(brand): no token write may remove a token the site still uses (or cannot count)"
```

**Live done-condition (after Task 4, QA workspace, publish blocked):** add a custom colour in Brand, bind
it to a heading via the Inspector, try Delete → the replacement picker opens, no hard delete; pick
Primary → `getComputedStyle(heading).color` equals Primary's computed colour (measured), and the
single-file export resolves the old var to the same colour (measured on the exported document).

---

### Task 5: Tokenized-property SSOT + insert audit (red, produces the owner report)

**Files:**
- Create: `packages/editor/src/shared/constants/tokenProperties.ts`
- Create: `packages/editor/src/blocks/__tests__/blockRegistry.insertBound.test.ts`

**Interfaces:**
- Consumes: `TokenKind` from `@buildrik/shared/schemas/designToken`.
- Produces:
  - `TOKENIZED_PROPERTIES: Readonly<Record<string, TokenKind>>`
  - `RAW_VALUE_ALLOWED: ReadonlySet<string>`
  - `COLOR_LITERAL_RE: RegExp`

- [ ] **Step 1: Write the constants**

```ts
// packages/editor/src/shared/constants/tokenProperties.ts
/**
 * Which style properties are token-bound, and by which token kind (spec §3).
 * One map for two readers: the insert test (no raw value may remain in these
 * properties) and Connect to tokens (a raw value is matched only against
 * tokens of the property's kind — colour to colour, spacing to spacing).
 * font-weight and line-height are absent until OQ-3 is answered.
 *
 * @license BSD-3-Clause
 */
import type { TokenKind } from "@buildrik/shared/schemas/designToken";

const sides = (base: string) => [base, `${base}-top`, `${base}-right`, `${base}-bottom`, `${base}-left`];

export const TOKENIZED_PROPERTIES: Readonly<Record<string, TokenKind>> = Object.freeze({
  ...Object.fromEntries(
    ["color", "background-color", "outline-color", "fill", "stroke", "text-decoration-color", ...sides("border").map((p) => `${p}-color`)]
      .map((p) => [p, "color" as const]),
  ),
  "font-family": "type",
  "font-size": "type",
  ...Object.fromEntries([...sides("padding"), ...sides("margin"), "gap", "row-gap", "column-gap"].map((p) => [p, "spacing" as const])),
  ...Object.fromEntries(
    ["border-radius", "border-top-left-radius", "border-top-right-radius", "border-bottom-left-radius", "border-bottom-right-radius"]
      .map((p) => [p, "radius" as const]),
  ),
  "box-shadow": "shadow",
});

/** Literals that are not brand decisions and stay raw. */
export const RAW_VALUE_ALLOWED: ReadonlySet<string> = new Set([
  "0", "0px", "auto", "100%", "inherit", "initial", "unset", "none", "transparent", "currentcolor",
]);

/** A colour literal anywhere in a value (shorthands included). */
export const COLOR_LITERAL_RE = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(|\b(?:white|black)\b/;
```

- [ ] **Step 2: Write the audit test**

```ts
// @vitest-environment jsdom
/**
 * Spec §3 test 4: every Add-panel block inserts token-bound. No colour literal
 * in any style value; no raw length in a tokenized property. Exceptions live in
 * ALLOWED below, each with a reason (OQ-9: third-party brand colours).
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createTestComposer, installEngineBrowserStubs, removeEngineBrowserStubs } from "@/engine/__tests__/test-utils/realComposer";
import { COLOR_LITERAL_RE, RAW_VALUE_ALLOWED, TOKENIZED_PROPERTIES } from "@/shared/constants/tokenProperties";
import { insertBlock, getBlockDefinitions } from "../blockRegistry";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);

/** `${blockId} ${prop}` → why it stays raw. */
const ALLOWED: Record<string, string> = {};

interface Node { id: string; type?: string; styles?: Record<string, unknown>; children?: Node[] }

const TOKEN_VAR = /^var\(--buildrick-design-[a-z0-9-]+\)$/;
const isBound = (part: string) => TOKEN_VAR.test(part) || RAW_VALUE_ALLOWED.has(part.toLowerCase());

function problems(blockId: string, node: Node, out: string[]) {
  for (const [prop, raw] of Object.entries(node.styles ?? {})) {
    if (typeof raw !== "string" || ALLOWED[`${blockId} ${prop}`]) continue;
    if (COLOR_LITERAL_RE.test(raw)) out.push(`${blockId} › ${node.type} › ${prop}: ${raw}`);
    else if (TOKENIZED_PROPERTIES[prop] && !raw.trim().split(/\s+(?![^(]*\))/).every(isBound)) {
      out.push(`${blockId} › ${node.type} › ${prop}: ${raw}`);
    }
  }
  for (const c of node.children ?? []) problems(blockId, c, out);
}

describe("every block inserts token-bound (spec test 4)", () => {
  it("leaves no raw colour and no raw tokenized length", () => {
    const found: string[] = [];
    for (const def of getBlockDefinitions()) {
      const composer = createTestComposer();
      const page = composer.elements.createPage("Home");
      insertBlock(composer, def, page.root.id);
      const exported = composer.elements.exportPages().find((p) => p.id === page.id);
      if (exported) problems(def.id, exported.root as Node, found);
    }
    expect(found, `raw values:\n${found.join("\n")}`).toEqual([]);
  });
});
```

Before trusting it, confirm `insertBlock` writes no StyleEngine rules (`git grep -n "styles\.\(set\|add\)Rule" packages/editor/src/blocks`); if it does, extend the walk to `composer.styles.exportStyles()` in the same test.

- [ ] **Step 3: Run it — it must fail and print the report**

Run (from `packages/editor`): `npx vitest run src/blocks/__tests__/blockRegistry.insertBound.test.ts > /tmp/insert-audit.log 2>&1; echo $?`
Expected: exit `1`; `/tmp/insert-audit.log` lists every raw value as `block › type › prop: value`.

- [ ] **Step 4: Owner gate.** Group the report by value (`grep -oE ': .*$' /tmp/insert-audit.log | sort | uniq -c | sort -rn`) and post it to the owner with OQ-1, OQ-2, OQ-3 and OQ-9. **Tasks 6–7 do not start until the answers are written into this plan's OQ table.** Commit the test as skipped so the suite stays green meanwhile:

Change `it(` to `it.skip(` with the comment `// un-skipped by Task 7 (waits for OQ-1…3)`.

- [ ] **Step 5: Commit**

```bash
git add packages/editor/src/shared/constants/tokenProperties.ts packages/editor/src/blocks/__tests__/blockRegistry.insertBound.test.ts
git commit -m "test(blocks): insert-bound audit + tokenized-property map (skipped until seed decisions)"
```

---

### Task 6: Seed gap tokens (waits for OQ-1)

**Files:**
- Modify: `packages/editor/src/engine/designSystem/defaultTokens.ts` (`DEFAULT_TOKENS_V5`, colours group)
- Modify: `packages/editor/src/themes/design-system/design.css`
- Modify: `packages/shared/tokens/legacySeed.ts`
- Test: `packages/editor/src/engine/designSystem/__tests__/defaultTokens.seedGap.test.ts` (create)

**Interfaces:**
- Consumes: the owner's OQ-1 answer.
- Produces: new seed token ids that Task 7 binds to. The **recommended** set (replace this table with the
  owner's answer before Step 1 — ids, names and both values):

| id | name | light | dark | replaces in blocks |
|----|------|-------|------|--------------------|
| `color-on-primary` | On primary | `#FFFFFF` | `#FFFFFF` | text on primary buttons/badges |
| `color-surface-raised` | Raised surface | `#FFFFFF` | `#1E293B` | card, input, modal backgrounds |
| `color-surface-muted` | Muted surface | `#F3F4F6` | `#1E293B` | placeholders, table stripes |
| `color-border-subtle` | Subtle border | `#E5E7EB` | `#334155` | card/table/divider borders |
| `color-text-strong` | Strong text | `#111827` | `#F8FAFC` | block headings |
| `color-text-subtle` | Subtle text | `#6B7280` | `#94A3B8` | captions, meta text |

Seed tokens are added as v5 rows (same path as every seed token, so `DEFAULT_TOKENS` stays
`migrateTokensToV6(DEFAULT_TOKENS_V5)`), `category: "colors"`, `type: "color"`, `group: "surface"` or
`"text"`, `darkValue` = the dark column. Never remove a seed token once elements can bind to it; that is
why each new var also joins `LEGACY_SEED` (the emitter's backstop).

- [ ] **Step 1: Write the failing test**

```ts
// packages/editor/src/engine/designSystem/__tests__/defaultTokens.seedGap.test.ts
import { describe, it, expect } from "vitest";
import { DEFAULT_TOKENS } from "../defaultTokens";
import { LEGACY_SEED, emitTokenCss, resolveTokenLiteral } from "@buildrik/shared/tokens";

const GAP: Array<[string, string, string]> = [
  ["color-on-primary", "#FFFFFF", "#FFFFFF"],
  ["color-surface-raised", "#FFFFFF", "#1E293B"],
  ["color-surface-muted", "#F3F4F6", "#1E293B"],
  ["color-border-subtle", "#E5E7EB", "#334155"],
  ["color-text-strong", "#111827", "#F8FAFC"],
  ["color-text-subtle", "#6B7280", "#94A3B8"],
];

describe("seed gap tokens (OQ-1)", () => {
  it.each(GAP)("%s resolves to its light and dark values", (id, light, dark) => {
    expect(resolveTokenLiteral(DEFAULT_TOKENS, id, "light")).toBe(light);
    expect(resolveTokenLiteral(DEFAULT_TOKENS, id, "dark")).toBe(dark);
    expect(DEFAULT_TOKENS.find((t) => t.id === id)?.layer).toBe("semantic");
  });

  it.each(GAP)("%s is in the emitter backstop", (id, light) => {
    expect(LEGACY_SEED.find((s) => s.cssVar === `--buildrick-design-${id}`)?.value).toBe(light);
    expect(emitTokenCss([], { darkMode: "off" })).toContain(`--buildrick-design-${id}:${light}`);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run (from `packages/editor`): `npx vitest run src/engine/designSystem/__tests__/defaultTokens.seedGap.test.ts`
Expected: FAIL — tokens missing.

- [ ] **Step 3: Implement** — one v5 row per table line in `DEFAULT_TOKENS_V5` after `color-error`, e.g.

```ts
  {
    id: "color-surface-raised",
    name: "Raised surface",
    value: "#FFFFFF",
    category: "colors",
    cssVar: "--buildrick-design-color-surface-raised",
    type: "color",
    group: "surface",
    description: "Cards, inputs and modals",
    darkValue: "#1E293B",
  },
```

the same `--buildrick-design-<id>: <light>;` lines in `design.css`'s `:root` block, and one
`{ cssVar: "--buildrick-design-<id>", value: "<light>" }` entry per token at the end of `LEGACY_SEED`
(match the file's existing entry shape).

- [ ] **Step 4: Run to verify — plus the seed's guards**

Run (from `packages/editor`):
`npx vitest run src/engine/designSystem src/engine/export/__tests__/ExportEngine.tokenClosure.test.ts && node scripts/verify-design-baselines.mjs; echo $?`
Run (root): `npx vitest run packages/shared`
Expected: PASS and exit `0`. The shared migration fixtures do not change (they are files, not the seed).

- [ ] **Step 5: Commit**

```bash
git add packages/editor/src/engine/designSystem packages/editor/src/themes/design-system/design.css packages/shared/tokens/legacySeed.ts
git commit -m "feat(brand): seed tokens for surfaces, subtle borders and text roles that inserted blocks use"
```

---

### Task 7: Insert defaults bind to semantic tokens (waits for OQ-1…3, OQ-9)

**Files:**
- Modify: `packages/editor/src/shared/constants/defaultStyles.ts`
- Modify: every `packages/editor/src/blocks/**` file the Task 5 report names
- Modify: `packages/editor/src/blocks/__tests__/blockRegistry.insertBound.test.ts` (un-skip; fill `ALLOWED`)
- Regenerate: `packages/editor/src/blocks/__tests__/__fixtures__/catalogBlockHtml.baseline.json`
- Test: `packages/editor/src/engine/export/__tests__/ExportEngine.tokenClosure.test.ts` (extend)

**Interfaces:**
- Consumes: Task 5 (`TOKENIZED_PROPERTIES`, report), Task 6 (seed ids), owner answers.
- Produces: no raw colour / tokenized length in any inserted element.

**Value map** (recommended; the owner's OQ-1/OQ-2 answers replace it before Step 2 — exact matches bind,
everything else follows the owner's snap/allow decision):

| raw | token |
|-----|-------|
| `#1A56DB`, `#406ED6` (retired accent), `#2563EB` | `color-primary` |
| `#FFF`, `#FFFFFF` (text on primary) | `color-on-primary` |
| `#FFF`, `#FFFFFF` (backgrounds) | `color-surface-raised` |
| `#F3F4F6`, `#F9FAFB`, `#F5F5F5`, `#F0F0F0` | `color-surface-muted` |
| `#E5E7EB`, `#E0E0E0`, `#D1D5DB`, `#CCC` | `color-border-subtle` |
| `#111827`, `#1A1A1A`, `#1E293B`, `#1A1A2E`, `#0D0D1A`, `#333`, `#333333`, `#374151` | `color-text-strong` |
| `#6B7280`, `#4B5563`, `#666`, `#999` | `color-text-subtle` |
| `#10B981`, `#166534`, `#DCFCE7` | `color-success` |
| `#92400E`, `#FEF3C7` | `color-warning` |
| `4px` … `48px` on the scale (padding/margin/gap) | `space-1` … `space-12` |
| font sizes `12px` … `36px` on the scale | `font-size-xs` … `font-size-4xl` |
| radii `4/8/12/16px`, `9999px` | `radius-sm/md/lg/xl`, `radius-full` |

- [ ] **Step 1: Un-skip the audit and fill `ALLOWED`** with only the owner-approved exceptions, each with
  its reason, e.g. `"social-icons color": "third-party brand colour (OQ-9)"`.

- [ ] **Step 2: Run it to see the current failures**

Run (from `packages/editor`): `npx vitest run src/blocks/__tests__/blockRegistry.insertBound.test.ts`
Expected: FAIL with the Task 5 list minus the allow-listed rows.

- [ ] **Step 3: Rewrite the values** in `defaultStyles.ts` and the named block files using the map, writing
  `var(--buildrick-design-<id>)` with no fallback. Multi-part values bind per part
  (`padding: "var(--buildrick-design-space-2) var(--buildrick-design-space-4)"`). For a `border` shorthand
  keep width/style raw and bind the colour (`"1px solid var(--buildrick-design-color-border-subtle)"`).
  Remove the `textPrimary`/`textSecondary` raw constants at the top of `defaultStyles.ts` if nothing reads
  them afterwards (`git grep`), per "no dead code".

- [ ] **Step 4: Extend the closure test** (`ExportEngine.tokenClosure.test.ts`) with a case for a site that
  the brand switch leaves on v5 (the overlay path), so every new var is declared there too:

```ts
it("declares every var an inserted block reads on a v5 site the switch leaves unmigrated", () => {
  for (const def of getBlockDefinitions()) {
    const composer = createTestComposer();
    composer.designSystem.brandTokensV2 = false;
    composer.setProjectSettings({ ...composer.getProjectSettings(), designTokens: DEFAULT_TOKENS_V5, designTokensSchemaVersion: 5 });
    const page = composer.elements.createPage("Home");
    insertBlock(composer, def, page.root.id);
    const doc = composer.exportHTML();
    expect(undeclared(`${doc.html}\n${doc.css}`), def.id).toEqual([]);
  }
});
```

(Match the field names of `ExportResult` used by the file's existing cases.)

- [ ] **Step 5: Regenerate the catalog baseline intentionally.** Read how
  `blockRegistry.realTypes.test.ts` compares against `catalogBlockHtml.baseline.json`. Regenerate it with a
  scratch script in your scratchpad (not committed) that runs the same insert+export per row and writes the
  JSON. Then `git diff --word-diff packages/editor/src/blocks/__tests__/__fixtures__/catalogBlockHtml.baseline.json`
  must show **only** raw values replaced by `var(--buildrick-design-…)` (and the OQ-2 snaps, if any). Any
  other change → stop and investigate.

- [ ] **Step 6: Run everything that inserts or exports**

Run (from `packages/editor`): `npx vitest run src/blocks src/engine/export src/editor/components-catalog`
Expected: PASS, including `blockRegistry.insertBound.test.ts` and the extended closure test.

- [ ] **Step 7: Commit**

```bash
git add packages/editor/src/shared/constants/defaultStyles.ts packages/editor/src/blocks packages/editor/src/engine/export/__tests__/ExportEngine.tokenClosure.test.ts
git commit -m "feat(blocks): inserted blocks bind to semantic tokens instead of raw colours and lengths"
```

**Live done-condition (QA workspace, publish blocked):** on a fresh site insert Button, Card, Input,
Navbar, Footer; change Primary, Raised surface and Subtle border in Brand → each element's computed
`color` / `background-color` / `border-color` changes to the new value (measured with `getComputedStyle`);
one ⌘Z reverts each. The single-file export of that page resolves the same computed values (canvas = export).

---

### Task 8: Connect to tokens — pure suggestions

**Files:**
- Create: `packages/editor/src/engine/designSystem/connectTokens.ts`
- Test: `packages/editor/src/engine/designSystem/__tests__/connectTokens.test.ts`

**Interfaces:**
- Consumes: Task 5 (`TOKENIZED_PROPERTIES`), `resolveTokenLiteral`, `DesignToken`/`TokenKind` from `./types`.
- Produces:
  - `normalizeTokenValue(kind: TokenKind, raw: string): string`
  - `interface ConnectRef { elementId: string; prop: string }`
  - `interface ConnectSuggestion { key: string; value: string; kind: TokenKind; refs: ConnectRef[]; elementCount: number; candidates: string[]; target: string | null }`
  - `findConnectSuggestions(roots: readonly StyledNode[], tokens: readonly DesignToken[], opts?: { skip?: (elementId: string) => boolean }): ConnectSuggestion[]`
  - `interface StyledNode { id: string; styles?: Record<string, unknown>; children?: StyledNode[] }`

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, it, expect } from "vitest";
import { DEFAULT_TOKENS } from "../defaultTokens";
import { findConnectSuggestions, normalizeTokenValue } from "../connectTokens";

const node = (id: string, styles: Record<string, string>, children: unknown[] = []) => ({ id, styles, children });

describe("findConnectSuggestions (spec §3, test 6)", () => {
  it("matches exact values of the same kind, semantic first, counted by element", () => {
    const roots = [node("r", {}, [node("a", { color: "#1A56DB" }), node("b", { "background-color": "#1a56db", color: "#1A56DB" })])];
    const [s] = findConnectSuggestions(roots, DEFAULT_TOKENS);
    expect(s).toMatchObject({ kind: "color", value: "#1A56DB", elementCount: 2, target: "color-primary" });
    expect(s.refs).toHaveLength(3);
    expect(s.candidates).toEqual(["color-primary"]);
  });

  it("never near-matches", () => {
    expect(findConnectSuggestions([node("a", { color: "#1A56DC" })], DEFAULT_TOKENS)).toEqual([]);
  });

  it("never crosses kinds: 16px padding is spacing, not a font size", () => {
    const [s] = findConnectSuggestions([node("a", { padding: "16px" })], DEFAULT_TOKENS);
    expect(s.kind).toBe("spacing");
    expect(s.candidates.every((id) => DEFAULT_TOKENS.find((t) => t.id === id)?.kind === "spacing")).toBe(true);
  });

  it("leaves the pick to the user when several semantic tokens tie", () => {
    const [s] = findConnectSuggestions([node("a", { color: "#71717A" })], DEFAULT_TOKENS);
    expect(s.candidates.length).toBeGreaterThan(1);
    expect(s.target).toBeNull();
  });

  it("ignores values already bound, unknown properties and skipped elements", () => {
    const roots = [node("a", { color: "var(--buildrick-design-color-primary)", width: "16px" }), node("b", { color: "#1A56DB" })];
    expect(findConnectSuggestions(roots, DEFAULT_TOKENS, { skip: (id) => id === "b" })).toEqual([]);
  });

  it("never suggests a soft-deleted token", () => {
    const tokens = DEFAULT_TOKENS.map((t) => (t.id === "color-secondary" ? { ...t, replacedBy: "color-primary" } : t));
    const out = findConnectSuggestions([node("a", { color: "#64748B" })], tokens);
    expect(out.flatMap((s) => s.candidates)).not.toContain("color-secondary");
  });
});

describe("normalizeTokenValue", () => {
  it("treats hex case, short hex, opaque 8-digit hex and rgb() as the same colour", () => {
    for (const v of ["#1A56DB", "#1a56db", "#1A56DBFF", "rgb(26, 86, 219)", "rgba(26,86,219,1)"]) {
      expect(normalizeTokenValue("color", v)).toBe("#1a56db");
    }
    expect(normalizeTokenValue("color", "#fff")).toBe("#ffffff");
    expect(normalizeTokenValue("color", "#1A56DB80")).toBe("#1a56db80");
    expect(normalizeTokenValue("spacing", " 16px ")).toBe("16px");
  });
});
```

(The tie case relies on today's seed: `color-muted` and `placeholder-color` are both `#71717A`. If the
seed changed, pick another pair from `DEFAULT_TOKENS` with equal values and the same kind.)

- [ ] **Step 2: Run to verify they fail**

Run (from `packages/editor`): `npx vitest run src/engine/designSystem/__tests__/connectTokens.test.ts`
Expected: FAIL — module missing.

- [ ] **Step 3: Implement**

```ts
// packages/editor/src/engine/designSystem/connectTokens.ts
/**
 * Connect to tokens (spec §3): find raw style values that EXACTLY equal a
 * token's resolved light value, for a property of the same kind. No near
 * matches. Semantic tokens win over primitives; several semantic tokens tied
 * leave the pick to the user (`target: null`). Pure — the Composer applies.
 *
 * @license BSD-3-Clause
 */
import { resolveTokenLiteral } from "@buildrik/shared/tokens";
import { TOKENIZED_PROPERTIES } from "@/shared/constants/tokenProperties";
import type { DesignToken, TokenKind } from "./types";

export interface ConnectRef { elementId: string; prop: string }
export interface ConnectSuggestion {
  key: string;
  value: string;
  kind: TokenKind;
  refs: ConnectRef[];
  elementCount: number;
  candidates: string[];
  target: string | null;
}
export interface StyledNode { id: string; styles?: Record<string, unknown>; children?: StyledNode[] }

const hex2 = (n: string) => Number(n).toString(16).padStart(2, "0");

export function normalizeTokenValue(kind: TokenKind, raw: string): string {
  const v = raw.trim().replace(/\s+/g, " ");
  if (kind !== "color") return v;
  const lower = v.toLowerCase();
  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/.exec(lower);
  if (short) return `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`;
  if (/^#[0-9a-f]{8}$/.test(lower) && lower.endsWith("ff")) return lower.slice(0, 7);
  const rgb = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*1(?:\.0+)?\s*)?\)$/.exec(lower);
  if (rgb) return `#${hex2(rgb[1])}${hex2(rgb[2])}${hex2(rgb[3])}`;
  return lower;
}

export function findConnectSuggestions(
  roots: readonly StyledNode[],
  tokens: readonly DesignToken[],
  opts: { skip?: (elementId: string) => boolean } = {},
): ConnectSuggestion[] {
  const byKey = new Map<string, DesignToken[]>();
  for (const t of tokens) {
    if (t.replacedBy) continue;
    const literal = resolveTokenLiteral(tokens, t.id, "light");
    if (!literal) continue;
    const key = `${t.kind}|${normalizeTokenValue(t.kind, literal)}`;
    byKey.set(key, [...(byKey.get(key) ?? []), t]);
  }
  const groups = new Map<string, { value: string; kind: TokenKind; refs: ConnectRef[] }>();
  const walk = (n: StyledNode) => {
    if (!opts.skip?.(n.id)) {
      for (const [prop, raw] of Object.entries(n.styles ?? {})) {
        const kind = TOKENIZED_PROPERTIES[prop];
        if (!kind || typeof raw !== "string" || raw.includes("var(")) continue;
        const key = `${kind}|${normalizeTokenValue(kind, raw)}`;
        if (!byKey.has(key)) continue;
        const g = groups.get(key) ?? { value: raw.trim(), kind, refs: [] };
        g.refs.push({ elementId: n.id, prop });
        groups.set(key, g);
      }
    }
    for (const c of n.children ?? []) walk(c);
  };
  roots.forEach(walk);
  return [...groups]
    .map(([key, g]) => {
      const all = byKey.get(key) ?? [];
      const semantic = all.filter((t) => t.layer === "semantic");
      const candidates = (semantic.length > 0 ? semantic : all).map((t) => t.id).sort();
      return {
        key,
        ...g,
        elementCount: new Set(g.refs.map((r) => r.elementId)).size,
        candidates,
        target: candidates.length === 1 ? candidates[0] : null,
      };
    })
    .sort((a, b) => b.elementCount - a.elementCount || a.key.localeCompare(b.key));
}
```

- [ ] **Step 4: Run to verify they pass**

Run (from `packages/editor`): `npx vitest run src/engine/designSystem/__tests__/connectTokens.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/editor/src/engine/designSystem/connectTokens.ts packages/editor/src/engine/designSystem/__tests__/connectTokens.test.ts
git commit -m "feat(brand): Connect to tokens finds exact same-kind matches, semantic first"
```

---

### Task 9: Connect to tokens — apply as one ⌘Z step; template-applied suggestions

**Files:**
- Modify: `packages/editor/src/engine/Composer.ts` (`designSystem` type + object; constructor subscriptions)
- Modify: `packages/editor/src/shared/constants/events.ts` (`BRAND_CONNECT_SUGGESTED` + payload map entry)
- Test: `packages/editor/src/engine/__tests__/Composer.connectTokens.test.ts` (create)

**Interfaces:**
- Consumes: Task 8.
- Produces (`composer.designSystem`):
  - `connectSuggestions(pageId?: string): ConnectSuggestion[]` — all pages, or one page; skips component instances (OQ-5 default)
  - `applyConnect(picks: ReadonlyArray<{ key: string; tokenId: string }>): number` — style writes made; `0` when read-only or nothing applies
  - event `EVENTS.BRAND_CONNECT_SUGGESTED` with payload `{ pageId: string; suggestions: ConnectSuggestion[] }`, emitted after `TEMPLATE_APPLIED` when the applied page has suggestions (the UI that offers them is BRP1-M7)

- [ ] **Step 1: Write the failing tests**

```ts
// packages/editor/src/engine/__tests__/Composer.connectTokens.test.ts
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { createTestComposer, installEngineBrowserStubs, removeEngineBrowserStubs } from "@/engine/__tests__/test-utils/realComposer";
import { EVENTS } from "@/shared/constants/events";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);

function siteWithRawPrimary() {
  const c = createTestComposer();
  const page = c.elements.createPage("Home");
  const root = c.elements.getElement(page.root.id)!;
  root.setStyle("color", "#1A56DB");
  root.setStyle("padding", "16px");
  c.history.flushPending();
  return { c, page, root };
}

describe("composer.designSystem Connect (spec §3, tests 6 + 29)", () => {
  it("applies the picks as ONE undo step", () => {
    const { c, root } = siteWithRawPrimary();
    const picks = c.designSystem.connectSuggestions().filter((s) => s.target).map((s) => ({ key: s.key, tokenId: s.target as string }));
    expect(c.designSystem.applyConnect(picks)).toBe(2);
    c.history.flushPending();
    expect(root.getStyles().color).toBe("var(--buildrick-design-color-primary)");
    expect(root.getStyles().padding).toBe("var(--buildrick-design-space-4)");
    c.history.undo();
    expect(root.getStyles().color).toBe("#1A56DB");
    expect(root.getStyles().padding).toBe("16px");
  });

  it("a second Apply of the same picks writes nothing and adds no undo step", () => {
    const { c } = siteWithRawPrimary();
    const picks = c.designSystem.connectSuggestions().map((s) => ({ key: s.key, tokenId: s.candidates[0] }));
    c.designSystem.applyConnect(picks);
    c.history.flushPending();
    const depth = c.history.getUndoStackSize?.() ?? c.history.canUndo();
    expect(c.designSystem.applyConnect(picks)).toBe(0);
    c.history.flushPending();
    expect(c.history.getUndoStackSize?.() ?? c.history.canUndo()).toEqual(depth);
  });

  it("refuses a token that is not a candidate, and refuses everything while read-only", () => {
    const { c } = siteWithRawPrimary();
    const [s] = c.designSystem.connectSuggestions();
    expect(c.designSystem.applyConnect([{ key: s.key, tokenId: "font-body" }])).toBe(0);
    c.designSystem.readOnly = true;
    expect(c.designSystem.applyConnect([{ key: s.key, tokenId: s.candidates[0] }])).toBe(0);
  });

  it("announces suggestions for the page a template was applied to", () => {
    const { c, page } = siteWithRawPrimary();
    const seen = vi.fn();
    c.on(EVENTS.BRAND_CONNECT_SUGGESTED, seen);
    c.emit(EVENTS.TEMPLATE_APPLIED, { templateId: "t", pageId: page.id });
    expect(seen).toHaveBeenCalledWith(expect.objectContaining({ pageId: page.id }));
    expect(seen.mock.calls[0][0].suggestions.length).toBeGreaterThan(0);
  });
});
```

(Use whichever undo-depth reader `HistoryManager` exposes — check `git grep -n "getUndoStackSize\|canUndo\|undoStack.length" packages/editor/src/engine/HistoryManager.ts` and keep exactly one form in the test.)

- [ ] **Step 2: Run to verify they fail**

Run (from `packages/editor`): `npx vitest run src/engine/__tests__/Composer.connectTokens.test.ts`
Expected: FAIL — `connectSuggestions` missing.

- [ ] **Step 3: Implement**

`events.ts`: add `BRAND_CONNECT_SUGGESTED: "brand:connect-suggested",` next to `BRAND_APPLIED`, and in the
payload map `[EVENTS.BRAND_CONNECT_SUGGESTED]: { pageId: string; suggestions: import("@/engine/designSystem/connectTokens").ConnectSuggestion[] };`
(follow the file's existing payload-import style).

`Composer.ts` — add to the `designSystem` type:

```ts
    /** Connect to tokens (spec §3): exact-match suggestions over every page, or one. */
    readonly connectSuggestions: (pageId?: string) => ConnectSuggestion[];
    /** Binds the picked suggestions in ONE transaction; returns the style writes made. */
    readonly applyConnect: (picks: ReadonlyArray<{ key: string; tokenId: string }>) => number;
```

and to the object:

```ts
      connectSuggestions: (pageId) => {
        const pages = this.elements.exportPages().filter((p) => pageId === undefined || p.id === pageId);
        return findConnectSuggestions(pages.map((p) => p.root), this.mergedDesignTokens(), {
          // OQ-5 default: never write inside a component instance (it would create overrides).
          skip: (id) => this.components.findInstanceContainingElement(id) !== null,
        });
      },
      applyConnect: (picks) => {
        if (this.designSystem.readOnly) return 0;
        const tokens = this.mergedDesignTokens();
        const byKey = new Map(this.designSystem.connectSuggestions().map((s) => [s.key, s]));
        const writes: Array<{ id: string; prop: string; value: string }> = [];
        for (const pick of picks) {
          const s = byKey.get(pick.key);
          const token = tokens.find((t) => t.id === pick.tokenId);
          if (!s || !token || !s.candidates.includes(token.id)) continue;
          for (const r of s.refs) writes.push({ id: r.elementId, prop: r.prop, value: `var(${token.cssVar})` });
        }
        if (writes.length === 0) return 0;
        this.beginTransaction("Connect to tokens");
        try {
          for (const w of writes) this.elements.getElement(w.id)?.setStyle(w.prop, w.value);
        } finally {
          this.endTransaction();
        }
        return writes.length;
      },
```

(`PageData.root` must satisfy `StyledNode`; if its type differs, map it with a typed walker rather than
`as`.) In the constructor, after the token-usage subscriptions:

```ts
    this.on(EVENTS.TEMPLATE_APPLIED, ({ pageId }) => {
      const suggestions = this.designSystem.connectSuggestions(pageId);
      if (suggestions.length > 0) this.emit(EVENTS.BRAND_CONNECT_SUGGESTED, { pageId, suggestions });
    });
```

- [ ] **Step 4: Run to verify they pass — plus engine history tests**

Run (from `packages/editor`): `npx vitest run src/engine/__tests__ src/engine/designSystem`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/editor/src/engine/Composer.ts packages/editor/src/shared/constants/events.ts packages/editor/src/engine/__tests__/Composer.connectTokens.test.ts
git commit -m "feat(brand): Connect to tokens applies as one undo step; template apply announces suggestions"
```

**Not live-verifiable until BRP1-M7** (no UI calls `applyConnect` yet). State this in the PR.

---

### Task 10: Theme push keeps in-use site tokens

**Files:**
- Create: `packages/shared/tokens/keepInUse.ts` (+ export from `packages/shared/tokens/index.ts`)
- Modify: `server/services/theme.service.ts` (`pushSharedTheme`, `previewSharedThemePush`, `PushResult`)
- Test: `packages/shared/tokens/__tests__/keepInUse.test.ts` (create), `__tests__/db/theme-push-keeps-in-use.db.test.ts` (create)

**Interfaces:**
- Consumes: Task 1 (`buildTokenUsageIndex`, `TokenUsageIndex`), `validateTokens`, `migrateTokensToV6`.
- Produces:
  - `keepInUseSiteTokens(theme: readonly DesignToken[], site: readonly DesignToken[], usage: Pick<TokenUsageIndex, "count">): { tokens: DesignToken[]; kept: string[] }`
  - `PushResult.kept?: string[]` (ids kept; no UI until OQ-8)
  - Scope: v6 writes only (`plan.version === TOKENS_SCHEMA_VERSION`). A v5 write (switch off) is unchanged.

- [ ] **Step 1: Write the failing tests**

```ts
// packages/shared/tokens/__tests__/keepInUse.test.ts
import { describe, it, expect } from "vitest";
import type { DesignToken, TokenRef } from "@buildrik/shared/schemas/design-tokens";
import { keepInUseSiteTokens } from "../keepInUse";

const t = (id: string, light: TokenRef, layer: DesignToken["layer"] = "semantic", cssVar = `--buildrick-design-${id}`): DesignToken => ({
  id, name: id, kind: "color", layer, modes: { light }, category: "colors", cssVar, type: "color",
});
const uses = (ids: string[]) => ({ count: (id: string) => (ids.includes(id) ? 1 : 0) });

describe("keepInUseSiteTokens (spec §4, test 21)", () => {
  const theme = [t("color-primary", { value: "#1A56DB" })];

  it("keeps an in-use site-only token, drops an unused one", () => {
    const site = [t("color-brand-x", { value: "#0E7490" }), t("color-unused", { value: "#000000" })];
    const out = keepInUseSiteTokens(theme, site, uses(["color-brand-x"]));
    expect(out.kept).toEqual(["color-brand-x"]);
    expect(out.tokens.map((x) => x.id)).toEqual(["color-primary", "color-brand-x"]);
  });

  it("keeps the alias closure", () => {
    const site = [t("custom-color-brand-x", { value: "#0E7490" }, "primitive"), t("color-brand-x", { alias: "custom-color-brand-x" })];
    expect(keepInUseSiteTokens(theme, site, uses(["color-brand-x"])).kept.sort()).toEqual(["color-brand-x", "custom-color-brand-x"]);
  });

  it("keeps when usage is unknown", () => {
    const site = [t("color-brand-x", { value: "#0E7490" })];
    expect(keepInUseSiteTokens(theme, site, { count: () => "unknown" }).kept).toEqual(["color-brand-x"]);
  });

  it("never keeps a token whose var the theme owns", () => {
    const site = [t("color-dup", { value: "#000000" }, "semantic", "--buildrick-design-color-primary")];
    expect(keepInUseSiteTokens(theme, site, uses(["color-dup"])).kept).toEqual([]);
  });

  it("theme tokens always win over a site token of the same id", () => {
    const site = [t("color-primary", { value: "#FF0000" })];
    const out = keepInUseSiteTokens(theme, site, uses(["color-primary"]));
    expect(out.kept).toEqual([]);
    expect(out.tokens).toEqual(theme);
  });
});
```

```ts
// __tests__/db/theme-push-keeps-in-use.db.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { pushSharedTheme, previewSharedThemePush } from "@/server/services/theme.service";
import { createTestUser, createTestWorkspace, createTestSite, createTestPage, truncateTables } from "./helpers";

const tok = (id: string, value: string) => ({
  id, name: id, kind: "color", layer: "semantic", modes: { light: { value } },
  category: "colors", cssVar: `--buildrick-design-${id}`, type: "color",
});

beforeEach(async () => {
  await truncateTables("site", "workspace", "user");
  vi.stubEnv("BRAND_TOKENS_V2", "on");
});
afterEach(() => vi.unstubAllEnvs());

async function setup(siteTokens: unknown[], pageStyles: Record<string, string>) {
  const user = await createTestUser();
  const ws = await createTestWorkspace({ ownerId: user.id });
  await prisma.workspace.update({
    where: { id: ws.id },
    data: { sharedTheme: { designTokens: [tok("color-primary", "#1A56DB")] }, sharedThemeUpdatedAt: new Date() },
  });
  const site = await createTestSite({
    workspaceId: ws.id, createdBy: user.id,
    projectSettings: { designTokens: siteTokens, designTokensSchemaVersion: 6 },
  });
  await createTestPage({ siteId: site.id, blocks: [{ id: "h", type: "heading", styles: pageStyles, children: [] }] });
  return { ws, site };
}

describe("pushSharedTheme keeps in-use site tokens (test 21)", () => {
  it("keeps a site token an element uses and reports it", async () => {
    const { ws, site } = await setup([tok("color-brand-x", "#0E7490")], { color: "var(--buildrick-design-color-brand-x)" });
    const [res] = await pushSharedTheme(ws.id);
    expect(res.status).toBe("pushed");
    expect(res.kept).toEqual(["color-brand-x"]);
    const after = await prisma.site.findUniqueOrThrow({ where: { id: site.id } });
    const ids = (after.projectSettings as { designTokens: Array<{ id: string }> }).designTokens.map((x) => x.id);
    expect(ids).toEqual(["color-primary", "color-brand-x"]);
  });

  it("drops an unused site-only token, as before", async () => {
    const { ws, site } = await setup([tok("color-unused", "#000000")], { color: "#111111" });
    await pushSharedTheme(ws.id);
    const after = await prisma.site.findUniqueOrThrow({ where: { id: site.id } });
    expect((after.projectSettings as { designTokens: unknown[] }).designTokens).toHaveLength(1);
  });

  it("reports failed and writes nothing when the merge does not validate", async () => {
    const broken = { ...tok("color-brand-x", "#0E7490"), modes: { light: { alias: "custom-missing" } } };
    const { ws, site } = await setup([broken], { color: "var(--buildrick-design-color-brand-x)" });
    const before = await prisma.site.findUniqueOrThrow({ where: { id: site.id } });
    const [res] = await pushSharedTheme(ws.id);
    expect(res.status).toBe("failed");
    const after = await prisma.site.findUniqueOrThrow({ where: { id: site.id } });
    expect(after.projectSettings).toEqual(before.projectSettings);
    expect(await prisma.siteThemeSnapshot.count({ where: { siteId: site.id } })).toBe(0);
  });

  it("preview says the site changes only by what the push really writes", async () => {
    const { ws } = await setup([tok("color-primary", "#1A56DB"), tok("color-brand-x", "#0E7490")], { color: "var(--buildrick-design-color-brand-x)" });
    const [p] = await previewSharedThemePush(ws.id);
    expect(p.willChange).toBe(false);
  });
});
```

(The broken-site case stores an invalid v6 set on purpose: `createTestSite` writes Prisma directly,
bypassing the save validation, which is exactly the state a push must not make worse.)

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run packages/shared/tokens/__tests__/keepInUse.test.ts` → FAIL (module missing).
Run: `pnpm test:db -- __tests__/db/theme-push-keeps-in-use.db.test.ts` → FAIL (`kept` undefined; token dropped).

- [ ] **Step 3: Implement**

```ts
// packages/shared/tokens/keepInUse.ts
/**
 * Theme push vs in-use tokens (spec §4). A push writes the workspace theme, but
 * a site-only token that the site still uses — or whose usage cannot be counted
 * — stays, with every site-only token it aliases or is replaced by, so no
 * element is left with an undefined var(). The theme owns its ids and var
 * names: a site token that would shadow either is never kept.
 */
import type { DesignToken } from "../schemas/design-tokens";
import type { TokenUsageIndex } from "./usage";

export function keepInUseSiteTokens(
  theme: readonly DesignToken[],
  site: readonly DesignToken[],
  usage: Pick<TokenUsageIndex, "count">,
): { tokens: DesignToken[]; kept: string[] } {
  const themeIds = new Set(theme.map((t) => t.id));
  const themeVars = new Set(theme.flatMap((t) => [t.cssVar, ...(t.legacyNames ?? [])]));
  const siteById = new Map(site.map((t) => [t.id, t]));
  const keep = new Set<string>();
  const visit = (id: string) => {
    const t = siteById.get(id);
    if (!t || themeIds.has(id) || keep.has(id) || themeVars.has(t.cssVar)) return;
    keep.add(id);
    for (const ref of [t.modes.light, t.modes.dark]) if (ref && "alias" in ref) visit(ref.alias);
    if (t.replacedBy) visit(t.replacedBy);
  };
  for (const t of site) if (usage.count(t.id) !== 0) visit(t.id);
  const kept = site.filter((t) => keep.has(t.id));
  return { tokens: [...theme, ...kept], kept: kept.map((t) => t.id) };
}
```

Export it from `packages/shared/tokens/index.ts`:
`export { keepInUseSiteTokens } from "./keepInUse";`

`theme.service.ts`:
1. Add `projectStyles: true` to the `select` of both `pushSharedTheme` and `previewSharedThemePush` target queries.
2. Add `kept?: string[]` to `PushResult`.
3. Add, below `planPush`:

```ts
/**
 * The token set a v6 push really writes to one site: the theme plus the site's
 * own tokens still in use (spec §4). Reads the site's pages, saved components
 * and presets for usage (same scanner as the editor). A site whose own tokens
 * cannot be read, or whose merged set does not validate, is refused for this
 * push — never written with a token dropped.
 */
async function withKeptSiteTokens(
  site: { id: string; projectSettings: unknown; projectStyles: unknown },
  theme: TokenTheme,
): Promise<{ theme: TokenTheme; kept: string[] }> {
  const themeTokens = validateTokens(theme.designTokens);
  if (!themeTokens.ok) throw new ThemeError("BAD_REQUEST", `Theme tokens are invalid: ${themeTokens.reason}`);
  const stored = readTokenTheme(site.projectSettings)?.designTokens ?? [];
  if (stored.length === 0) return { theme, kept: [] };
  let siteTokens: DesignToken[];
  const v6 = validateTokens(stored);
  if (v6.ok) siteTokens = v6.tokens;
  else {
    try {
      siteTokens = migrateTokensToV6(stored);
    } catch {
      throw new ThemeError("CONFLICT", "This site's own brand tokens could not be read — nothing was changed.");
    }
  }
  const [pages, components] = await Promise.all([
    prisma.page.findMany({ where: { siteId: site.id }, select: { blocks: true, settings: true } }),
    prisma.siteComponent.findMany({ where: { siteId: site.id }, select: { payload: true } }),
  ]);
  const presets = theme.designPresets
    ? []
    : ((site.projectSettings as { designPresets?: unknown } | null)?.designPresets ?? []);
  const usage = buildTokenUsageIndex([pages, site.projectStyles, components, presets], siteTokens);
  const merged = keepInUseSiteTokens(themeTokens.tokens, siteTokens, usage);
  if (merged.kept.length === 0) return { theme, kept: [] };
  const checked = validateTokens(merged.tokens);
  if (!checked.ok) {
    throw new ThemeError("CONFLICT", `This site's own tokens clash with the theme (${checked.reason}) — nothing was changed.`);
  }
  return { theme: { ...theme, designTokens: checked.tokens }, kept: merged.kept };
}
```

(import `buildTokenUsageIndex`, `keepInUseSiteTokens` from `@buildrik/shared/tokens` and the
`DesignToken` type from `@buildrik/shared/schemas/design-tokens`.)

4. In `pushSharedTheme`, inside the per-site `try` and **before** the `$transaction` (the CAS on
   `lastEditedAt` then guarantees the pages read here are the pages the write overwrites):

```ts
      const final = pushed.version === TOKENS_SCHEMA_VERSION
        ? await withKeptSiteTokens(site, pushed.theme)
        : { theme: pushed.theme, kept: [] };
```

   write `withTokens(site.projectSettings, final.theme, pushed.version)`, and push
   `{ siteId, name, status: "pushed", ...(final.kept.length ? { kept: final.kept } : {}) }`. A thrown
   `ThemeError` lands in the existing `catch` → `failed` with its message, nothing written.
5. In `previewSharedThemePush`, compute the same `final` (inside a `try`; on `ThemeError` return the row
   with `willChange: true`) and compare `JSON.stringify(final.theme.designTokens)` instead of
   `plan.theme.designTokens`.

- [ ] **Step 4: Run to verify they pass — plus the 1a theme tests**

Run: `npx vitest run packages/shared/tokens`
Run: `pnpm test:db -- __tests__/db/theme-push-keeps-in-use.db.test.ts __tests__/db/theme-snapshots-v6.db.test.ts`
Run: `npx vitest run __tests__ -t theme` (root, unit tier)
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/shared/tokens/keepInUse.ts packages/shared/tokens/index.ts packages/shared/tokens/__tests__/keepInUse.test.ts server/services/theme.service.ts __tests__/db/theme-push-keeps-in-use.db.test.ts
git commit -m "fix(theme): a workspace theme push keeps the site's own tokens that elements still use"
```

**Live done-condition (QA workspace, publish blocked, local DB):** in a scratch site add a custom colour
token and bind a heading to it; capture a workspace theme from a second site; push it to the first →
the push result lists the token in `kept`; reopen the first site → the heading's computed colour is
unchanged (measured), and its single-file export declares the custom var.

---

### Task 11: Token usage chip + canvas highlight — **UI waits for board BRP1-M5**

**Files (expected; confirm against the board):**
- Modify: `packages/editor/src/editor/design-system/ui/sections/TokenDetailView.tsx` (Used by row)
- Modify: `packages/editor/src/editor/design-system/ui/colors/ColorTokenList.tsx`, `packages/editor/src/editor/design-system/ui/sections/TokensSection.tsx` (USED chip)
- Modify: the canvas selection/highlight path used by `AquibraStudio.tsx:598` (lint issue → `getBreakdown`), reused for "click count → highlight"
- Test: `packages/editor/src/editor/design-system/ui/sections/__tests__/TokenDetailView.usage.test.tsx` (create)

**Interfaces:**
- Consumes: Task 3 (`getUsage`, `getCount`, `getBreakdown`, `"tokenUsage:changed"`).
- Produces: the four BRP1-M5 states — 0 uses, N uses, unknown ("Can't count right now"), canvas highlight.

- [ ] **Step 1: Gate.** The board's node is in `docs/design-jobs/BRAND-PART1/brief.md`'s node ledger and `/plan-design-review` has run on it. If not, stop.
- [ ] **Step 2: Load `figma:figma-design-to-code`, then `get_design_context(<BRP1-M5 node>)`** (or `scripts/baseline/figma-mcp.mjs` when the Figma tools are absent — editor CLAUDE.md).
- [ ] **Step 3: Write the failing RTL test** — one `it` per state, driven by a fake tracker: `getCount` → `0` renders the board's zero state; `3` renders "3" with the board's copy; `"unknown"` renders the board's unknown copy and no number; clicking the count calls the highlight with exactly `getBreakdown(id)`'s element ids.
- [ ] **Step 4: Run it** → FAIL.
- [ ] **Step 5: Build from the board** with `@/editor/chrome-ui` + `tw:` + `var(--bk-*)` only; remove OQ-10's interim behaviour.
- [ ] **Step 6: Run it** → PASS; then `npx vitest run src/editor/design-system`.
- [ ] **Step 7: Verify = board screenshot vs live screenshot, side by side, at 1440×900**, token detail open, one element bound (QA workspace, publish blocked). Not matching → keep fixing.
- [ ] **Step 8: Commit** `feat(brand): token usage chip and canvas highlight (BRP1-M5)`.

---

### Task 12: Safe delete dialog — **UI waits for board BRP1-M6** (and OQ-7)

**Files (expected):**
- Modify: `packages/editor/src/editor/design-system/ui/sections/TokenReplaceModal.tsx`, `TokenDetailView.tsx` (delete path)
- Test: `packages/editor/src/editor/design-system/ui/sections/__tests__/TokenReplaceModal.test.tsx`

**Interfaces:**
- Consumes: Task 4 (engine guard), Task 3 (`getCount`), Task 2 (`replacedBy` semantics).
- Produces: BRP1-M6 states — in use → replacement picker (same kind, not soft-deleted, not itself); unused → plain confirm; unknown → refused with reason; seed token → per OQ-7.

- [ ] **Step 1: Gate** (board in ledger, `/plan-design-review` run, OQ-7 answered).
- [ ] **Step 2: `figma:figma-design-to-code` → `get_design_context(<BRP1-M6 node>)`.**
- [ ] **Step 3: Failing RTL tests:** unused → confirm → `onDelete(id)`; in use → picker lists only same-kind, non-replaced candidates and never the token itself → `onDelete(id, { replaceWith })`; unknown → refusal copy, no `onDelete`.
- [ ] **Step 4: Run** → FAIL. **Step 5: Build from the board.** **Step 6: Run** → PASS.
- [ ] **Step 7: Board vs live at 1440×900** for each state; then the live done-condition: delete an in-use token → picker; pick Primary → no element has an undefined var (`getComputedStyle` of every bound element is a real colour).
- [ ] **Step 8: Commit** `feat(brand): safe delete asks for a replacement when a token is in use (BRP1-M6)`.

---

### Task 13: Connect to tokens check — **UI waits for board BRP1-M7** (and OQ-4…6)

**Files (expected):**
- Create: `packages/editor/src/editor/design-system/ui/sections/ConnectTokensCheck.tsx` (+ export where Brand's checks are listed)
- Test: `packages/editor/src/editor/design-system/ui/sections/__tests__/ConnectTokensCheck.test.tsx`

**Interfaces:**
- Consumes: Task 9 (`connectSuggestions`, `applyConnect`, `BRAND_CONNECT_SUGGESTED`), Task 11 (highlight).
- Produces: BRP1-M7 states — list ("`#1A56DB` · 14 elements → Primary"), tie → user picks, preview (highlight), Apply (one ⌘Z), nothing to connect; the template-applied offer.

- [ ] **Step 1: Gate** (board in ledger, `/plan-design-review` run, OQ-4…6 answered).
- [ ] **Step 2: `figma:figma-design-to-code` → `get_design_context(<BRP1-M7 node>)`.**
- [ ] **Step 3: Failing RTL tests:** rows render `value · N elements → token` from a fake `connectSuggestions`; a tie row has no target until the user picks; Apply calls `applyConnect` once with the picks and is **disabled while the call is in flight** (double-click → one call, spec test 29); the preview highlight is cleared on Cancel, on unmount and on navigation (spec D17); empty → the board's "nothing to connect".
- [ ] **Step 4: Run** → FAIL. **Step 5: Build from the board.** **Step 6: Run** → PASS.
- [ ] **Step 7: Live (QA workspace, publish blocked):** on a site with raw `#1A56DB` buttons, the check lists them with the right count; Apply → each button's inline style holds `var(--buildrick-design-color-primary)` and its computed colour is unchanged (measured); change Primary → they repaint; one ⌘Z restores the raw values. Board vs live at 1440×900.
- [ ] **Step 8: Commit** `feat(brand): Connect to tokens check (BRP1-M7)`.

---

### Task 14: E2E, full gates, live verification, rollout notes

**Files:**
- Modify: `packages/dashboard/e2e/brand-tokens.spec.ts`
- Modify: `docs/runbooks/brand-token-migration.md` (new §6)

- [ ] **Step 1: Add the 1b E2E flows** to `brand-tokens.spec.ts` as `test.describe("Brand Part 1b", …)`,
  reusing the file's `seedV5Site`-style seeding (seed a **v6** site for these), `blockPublish`,
  `openEditor`, `openBrand`, and its `afterEach` "no sites.publish request" assertion:

```ts
test("an inserted button follows Primary, and one ⌘Z restores it", async ({ page }) => {
  // seed a v6 site with an empty home page; open the editor; insert "Button" from the Add panel
  const button = page.frameLocator("iframe").locator("[data-buildrick-type='button']").first(); // use the file's canvas locator if different
  const bg = () => button.evaluate((el) => getComputedStyle(el).backgroundColor);
  const inline = await button.evaluate((el) => el.getAttribute("style") ?? "");
  expect(inline).toContain("var(--buildrick-design-color-primary)");
  const before = await bg();
  await openBrand(page);
  await page.getByRole("textbox", { name: /primary/i }).fill("#C2410C");
  await page.keyboard.press("Enter");
  await expect.poll(bg).toBe("rgb(194, 65, 12)");
  await page.keyboard.press("Meta+z");
  await expect.poll(bg).toBe(before);
});

test("an in-use token cannot be hard-deleted", async ({ page }) => {
  // seed a v6 site with a custom colour token bound by one heading; open Brand → that token → ⋯ → Delete
  await expect(page.getByTestId("brand-token-replace-modal")).toBeVisible(); // the replacement picker, not a delete
});
```

  Replace the commented seeding lines with real code following the existing `seedV5Site` (a v6 token list
  from `DEFAULT_TOKENS`-shaped JSON plus the custom token); locate the canvas element the same way the
  existing flows do. If the replace modal's test id differs, read it from `TokenReplaceModal.tsx`.

- [ ] **Step 2: Run E2E locally only** (see the spec file's header for why):
  `PW_FORCE_LOCAL=1 PW_BASE_URL=http://localhost:<port> npx playwright test e2e/brand-tokens.spec.ts --project=chromium` (from `packages/dashboard`) → all flows PASS, publish count 0.

- [ ] **Step 3: Full gates, alone** (repo root, nothing else running):

```bash
cd packages/editor && npx tsc --noEmit > /tmp/tsc-ed.log 2>&1; echo "editor tsc $?"
cd ../.. && npx tsc --noEmit -p packages/dashboard > /tmp/tsc-dash.log 2>&1; echo "dashboard tsc $?"
cd packages/editor && npx vitest run > /tmp/vitest-ed.log 2>&1; echo "editor vitest $?"; tail -5 /tmp/vitest-ed.log
cd ../.. && npx vitest run > /tmp/vitest-root.log 2>&1; echo "root vitest $?"; tail -5 /tmp/vitest-root.log
pnpm test:db > /tmp/vitest-db.log 2>&1; echo "db $?"; tail -5 /tmp/vitest-db.log
cd packages/editor && pnpm run verify:ds > /tmp/verify-ds.log 2>&1; echo "verify:ds $?"
```

  Expected: every exit `0`. Rerun a known-flaky file alone before treating its failure as real.

- [ ] **Step 4: Live verification** on a worktree dev server (`NEXT_PUBLIC_APP_URL`/`AUTH_URL`/`NEXTAUTH_URL`
  = `http://localhost:<port>`), QA workspace, **publish blocked**, `BRAND_TOKENS_V2=on`. Measure with
  `getComputedStyle`, never by eye:
  1. Insert Button, Card, Input, Navbar, Footer on a fresh site; change Primary / Raised surface / Subtle border → each repaints; one ⌘Z each (Task 7).
  2. Canvas = export: computed colours of those five match in the single-file export.
  3. Delete an in-use custom token → refused / picker; with replacement → elements and export resolve to the replacement (Task 4).
  4. Spacing → Reset on a site with a bound custom spacing token → refused, nothing changes.
  5. Theme push keeps an in-use site token; heading colour unchanged (Task 10).
  6. Typing in a text element on a ~700-element page with Brand open: no visible stutter; Performance panel shows the usage index built at most once per burst (Task 3).
  7. Connect: only if BRP1-M7 shipped (Task 13); otherwise record "not verified — no UI".
  State in the PR which of these were **not** verified and why.

- [ ] **Step 5: Runbook §6 "Part 1b rollout"** in `docs/runbooks/brand-token-migration.md`:
  - No Prisma migration, no new env var. `BRAND_TOKENS_V2` still governs migration only; on an
    un-migrated or held site Brand is read-only, so delete and Connect are refused there by `readOnly`.
  - Inserted blocks bind to seed vars that every emit path declares (seed merge + `LEGACY_SEED` backstop),
    on v5 and v6 sites alike. **Never remove a seed token once shipped**: elements bind to it.
  - Rollback: revert the 1b commits and redeploy. Elements inserted while 1b was live keep resolving
    (their vars are seed + backstop vars, which the revert does not remove — check this before reverting
    Task 6). Theme push returns to wholesale replace.
  - Theme push now refuses a site (`failed`, nothing written) when its own tokens cannot be read or clash
    with the theme; the message names the reason.

- [ ] **Step 6: Pre-deploy read-only audit for the owner (OQ-11)** — Task 2 tightens `replacedBy` (same
  kind, no cycles). A stored set that breaks the new rule would load read-only. Give the owner this
  **read-only** query to run against prod before deploying (do not run it against prod yourself):

```sql
SELECT id, name
FROM sites
WHERE "deletedAt" IS NULL
  AND "projectSettings"::text LIKE '%"replacedBy"%';
```

  For each row, open the site locally against a copy and confirm `validateTokens` passes; report the count.

- [ ] **Step 7: Commit**

```bash
git add packages/dashboard/e2e/brand-tokens.spec.ts docs/runbooks/brand-token-migration.md
git commit -m "test(e2e): brand part 1b — inserted blocks follow tokens, in-use delete refused; runbook rollout notes"
```

---

## Self-Review notes (run by the plan author)

- **Spec coverage (1b scope):** §3 insert-bound defaults → Tasks 5–7 (test 4; test 3 closure extended in
  Task 7); §3 Connect (exact, same kind, ties, preview, one ⌘Z, template apply) → Tasks 8, 9, 13 (test 6;
  test 29's Connect half in Task 13); §6 usage map across every page / styles / components / CMS templates
  (pages), unknown-refuses, highlight, safe delete with `replacedBy` → Tasks 1–4, 11, 12 (tests 11, 30);
  §4 theme push keeps in-use tokens → Task 10 (test 21); test 20 (legacy backstop) is covered by 1a and
  extended for the new seed vars in Task 6. **Not in 1b:** §7 generator, §2 Dark Auto/D11, D12 toggle,
  §8 restore list, §9 logo/URL, E2E flow 3 — all 1c.
- **Spec items that changed shape because of the code:** the Connect preview is a highlight, not a repaint
  (reality check 8); the Connect restore point is not written (reality check 10, OQ-4); seed tokens cannot
  be deleted (reality check 5, OQ-7); the seed gap decides what "bound" means for most block values
  (reality check 6, OQ-1…3).
- **Placeholder scan:** the only owner-dependent content is the OQ-1/OQ-2 value tables in Tasks 6–7, given
  as concrete recommended tables to be replaced by the owner's answers; Tasks 11–13 cannot carry
  board-specific markup before the boards exist, and their tests are specified by behaviour state.
- **Type consistency:** `TokenUsageCount`, `TokenUsageIndex.count/closure` (Task 1) are what Tasks 3, 4 and
  10 call; `ConnectSuggestion.key/candidates/target` (Task 8) are what Task 9 reads; `getCount` (Task 3)
  is what Tasks 4, 11 and 12 read.
