# Brand Part 1a — Token Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One token pipeline (shared schema → migration → one CSS emitter) used by canvas, export, publish and
the server, with one undo stack, safe migration with rollback, and a kill switch — and no live site changing
colour.

**Architecture:** Pure token logic lives in `@buildrik/shared` so the editor (browser) and the server (Node)
run the same code: the v6 Zod schema in `packages/shared/schemas/design-tokens.ts`, and `migrate`, `emit`,
`usage` in `packages/shared/tokens/`. The editor swaps its per-var `setProperty` applier for one coalesced
`<style>` element and drops its two extra undo stacks; the server validates every `designTokens` write,
snapshots the pre-migration tokens inside the save transaction, and can roll a site back and hold it.

**Tech Stack:** TypeScript 5 (strict), Zod, Vitest + React Testing Library, Prisma 5 / PostgreSQL, tRPC 11,
React 18 (editor), Playwright (E2E).

**Spec:** `docs/superpowers/specs/2026-10-05-brand-token-foundation-design.md` (CEO + eng reviewed,
commit `997d6e13a`). This plan covers **N1 + Delivery step 1a** only. 1b (binding: insert-bound blocks,
safe delete, Connect to tokens, theme push keeps in-use tokens) and 1c (generators, Dark Auto flow, toggle
block, restore list, logo/URL import) get their own plans; their UI waits for designer boards (D15).

## Global Constraints

- Accent `#1A56DB` (CLAUDE.md). Purple/violet/indigo banned in chrome.
- Path aliases only; `../../` imports banned. Editor: `@/` → `packages/editor/src/`. Root: `@/lib/...`, `@/server/...`.
- No `any`. No `as` unless truly necessary (Prisma JSON boundaries are the accepted exception, as today).
- Never instantiate external clients at module level.
- Services throw domain errors; routers translate to tRPC errors; pages show friendly messages.
- Prisma migrations: the agent **creates** them; the **owner applies** them (`pnpm prisma migrate deploy`).
- Never publish from the QA workspace (`qa@buildrik.local` has a live Vercel connection) — block `sites.publish` in every live test.
- Never `git stash` mid-execution. Never push unless the owner asks.
- Full editor suite + root suite run alone before any merge to main; known load-flaky files: RedirectsScreen, cms.service stripMarkup, BrandWorkspace.pages, ReviewTab.banner, LibraryManager*, OverviewScreen, TemplatesTab.ia, FormAfterSubmitSection, noChromeTokenWrites, SaveVersionModal, PublishTab.gate.
- Read `tsc` exit from the command itself, never after a pipe (`npx tsc --noEmit > /tmp/tsc.log 2>&1; echo $?`).
- Token CSS var name: `--buildrick-design-<id>` (`tokenToCssVar`). Never derive from `token.name`.
- **No site's resolved colours change during migration** (spec §4). Migrated sites start `darkMode: "off"`; new sites `"auto"` (D8).
- If you add a `process.env.X` read, add its row to the CLAUDE.md env table in the same commit.

## Review Focus

1. **A site whose saved tokens are malformed or from an unknown older shape** (null entries, missing `id`, duplicate ids, values with `;`): the editor must still open with the old tokens, Brand read-only, a Sentry event — never a crashed editor or a half-migrated save. → Task 3 Step 1 (migrate throws a typed error) + Task 9 Step 1 (load path).
2. **A site with a user token whose id collides with a generated id** (`custom-color-x` already exists): migration must not create a second token with the same id. → Task 3 Step 1.
3. **Two tabs open on the same site during the first migrated save:** exactly one save wins; the loser gets the reload conflict; exactly one `migration` snapshot exists. → Task 11 Step 1.
4. **Kill switch flipped Off while a migrated site is open in another tab:** that tab keeps saving normally (Off = no *new* migrations). → Task 12 Step 1.
5. **Rapid colour-picker drags on a large page:** at most one stylesheet write per animation frame and one history entry per drag. → Task 8 Step 1.

---

## File Structure

| File | Status | Responsibility |
|------|--------|----------------|
| `server/services/sites.service.ts` | modify | N1 save-timeout fix; tokens validation, version rule, required CAS, migration snapshot in txn |
| `packages/shared/schemas/design-tokens.ts` | create | v6 Zod schema, graph checks, DTCG round trip, `TOKENS_SCHEMA_VERSION` |
| `packages/shared/schemas/designToken.ts` | modify | becomes the **v5 legacy** schema (rename exports `LegacyDesignToken*`) |
| `packages/shared/schemas/index.ts` | modify | export the new module |
| `packages/shared/tokens/migrate.ts` | create | v5 → v6 pure migration (`migrateTokensToV6`) + `TokenMigrationError` |
| `packages/shared/tokens/emit.ts` | create | `emitTokenCss(tokens, { darkMode })` + legacy backstop + sanitizer |
| `packages/shared/tokens/resolve.ts` | create | `resolveTokenLiteral(tokens, id, mode)` (alias chain → literal) |
| `packages/shared/tokens/usage.ts` | create | `buildTokenUsageIndex(sources)` one-pass scan |
| `packages/shared/tokens/legacySeed.ts` | create | the 96 v5 default var names + values (backstop data, generated once from `DEFAULT_TOKENS`) |
| `packages/shared/tokens/index.ts` | create | barrel (exports only) |
| `packages/editor/src/engine/designSystem/types.ts` | modify | `DesignToken` = shared v6 type; legacy type kept as `LegacyDesignToken` |
| `packages/editor/src/engine/designSystem/defaultTokens.ts` | modify | `DEFAULT_TOKENS` becomes v6 (built by migrating the v5 list once, checked in) |
| `packages/editor/src/editor/design-system/migrations/index.ts` | modify | `CURRENT_SCHEMA_VERSION = 6`; v6 step delegates to shared |
| `packages/editor/src/editor/design-system/state/projectTokens.ts` | modify | merge on v6 shape |
| `packages/editor/src/editor/design-system/ui/ProjectTokensApplier.tsx` | rewrite | one `<style id="bk-site-tokens">`, rAF-coalesced, `data-theme` always set |
| `packages/editor/src/engine/darkResolver/DarkResolver.ts` | modify | reads `modes` via `resolveTokenLiteral` |
| `packages/editor/src/engine/Composer.ts` | modify | `designSystem.setTokens(patch, label)` (one transaction); `setDesignToken`/`applyAutoFix` use it; `exportPageCss` uses `emitTokenCss` |
| `packages/editor/src/editor/design-system/state/useTokensForKind.ts` | rewrite | view over composer settings; no local undo, no saved/draft state |
| `packages/editor/src/editor/design-system/ui/useBrandDraft.ts` | delete | staging removed |
| `packages/editor/src/editor/design-system/ui/modals/ReviewModal.tsx` | delete | staging removed |
| `packages/editor/src/editor/design-system/ui/BrandWorkspace.tsx` | modify | drop Save/Apply/ReviewModal; read-only notice |
| `packages/editor/src/editor/inspector/.../useUpdateColorEverywhere.ts` | modify | goes through `designSystem.setTokens` |
| `packages/editor/src/engine/export/ExportHelpers.ts` | modify | delete `siteTokensCSS` |
| `packages/editor/src/engine/export/ExportEngine.ts` | modify | callers → `emitTokenCss`; `siteFontsFromTokens` reads v6 |
| `packages/editor/src/engine/designSystem/bundler/CSSBundler.ts` | modify | dark path → `emitTokenCss` |
| `packages/editor/src/editor/design-system/ui/BrandLivePreview.tsx` | modify | → `emitTokenCss` |
| `prisma/schema.prisma` + new migration dir | modify/create | `SiteThemeSnapshot.reason/tokensSchemaVersion/darkMode`, `Site.tokensMigrationHold` |
| `server/services/theme.service.ts` | modify | reason filter, legacy-row filter, prune exempt + log, migration rollback + hold, workspace theme migration |
| `server/services/brand-tokens.ts` | create | `isBrandTokensV2Enabled()`, `TokenSaveError` |
| `server/trpc/routers/sites.ts` | modify | translate `TokenSaveError` |
| `scripts/brand/rollback-migration.mjs` | create | operator rollback script |
| `docs/runbooks/brand-token-migration.md` | create | runbook |
| `e2e/brand-tokens.spec.ts` | create | E2E flows 1 and 2 (flow 3 lands with 1c) |

**Note on `DesignToken` readers:** `darkValue` is read in 28 editor files, `aliasOf` in 12, and `.value` in 34
design-system files (`grep -rln "darkValue" packages/editor/src`). v6 removes those fields. Task 7 migrates
every reader to `resolveTokenLiteral` / `modes` mechanically, file by file, with `tsc` as the checklist.

---

### Task 0: N1 — large-page autosave must not time out

Owner decision D10 (eng): fix before any 1a work. Evidence: Brand QA 2026-10-05 (`qa/brand-bugs-2026-10-05`,
`615487d05`): saving a ~700-element page → 500 from a DB timeout in `tx.page.upsert`, then 409.

**Files:**
- Modify: `server/services/sites.service.ts` (`saveProjectData`, page loop after the CAS, ~:985 onward)
- Test: `__tests__/db/save-project-large-page.db.test.ts` (DB tier, `pnpm test:db`)

**Interfaces:**
- Consumes: nothing new.
- Produces: `saveProjectData` unchanged signature; the page writes complete inside the transaction for a page
  with 700+ elements.

- [ ] **Step 1: Run `/investigate` on the timeout.** Use the gstack `investigate` skill with: "saveProjectData times out (Prisma interactive-transaction default 5s) in `tx.page.upsert` when one page's `blocks` JSON is ~700 elements; reproduce on the DB tier." Record the root cause (expected candidates: per-page sequential upserts holding the interactive transaction past Prisma's 5000 ms default `timeout`; or a redundant read inside the loop). Do not change code before the cause is written down.

- [ ] **Step 2: Write the failing DB test**

```ts
// __tests__/db/save-project-large-page.db.test.ts
import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/prisma";
import { saveProjectData } from "@/server/services/sites.service";
import { createTestSite } from "./helpers";

function bigBlocks(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    id: `el-${i}`,
    type: "text",
    content: `Paragraph ${i} `.repeat(20),
    styles: { color: "#111827", padding: "8px", fontSize: "16px" },
  }));
}

describe("saveProjectData · large page", () => {
  it("saves a 700-element page without a transaction timeout", async () => {
    const site = await createTestSite();
    const before = await prisma.site.findUniqueOrThrow({ where: { id: site.id }, select: { lastEditedAt: true } });
    await expect(
      saveProjectData(
        {
          siteId: site.id,
          pages: [{ id: site.homePageId, name: "Home", slug: "index", position: 0, blocks: bigBlocks(700) }],
          settings: {},
        },
        before.lastEditedAt.toISOString(),
      ),
    ).resolves.toBeDefined();
    const page = await prisma.page.findUniqueOrThrow({ where: { id: site.homePageId } });
    expect(Array.isArray(page.blocks) && page.blocks.length).toBe(700);
  }, 60_000);
});
```

If `createTestSite` does not exist in `__tests__/db/helpers.ts`, add it there (create a user, workspace, site and one home page with Prisma; return `{ id, homePageId }`), following the existing `cms-conflict.db.test.ts` setup.

- [ ] **Step 3: Run it and confirm the failure matches the QA evidence**

Run: `pnpm test:db __tests__/db/save-project-large-page.db.test.ts`
Expected: FAIL with a Prisma transaction timeout (`Transaction already closed` / `P2028`).

- [ ] **Step 4: Fix the root cause found in Step 1.** If the cause is the interactive-transaction default timeout with work that is already minimal, pass explicit options to the existing call — keep the CAS first:

```ts
await prisma.$transaction(async (tx) => {
  /* existing body unchanged */
}, { timeout: 30_000, maxWait: 10_000 });
```

If Step 1 found redundant per-page reads or writes, remove them instead and keep the default timeout. Write the chosen cause in a two-line comment above the transaction.

- [ ] **Step 5: Run the test and the existing save tests**

Run: `pnpm test:db __tests__/db/save-project-large-page.db.test.ts && npx vitest run __tests__/sites-save-project.test.ts __tests__/save-project-empty-snapshot.test.ts`
Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add server/services/sites.service.ts __tests__/db/save-project-large-page.db.test.ts __tests__/db/helpers.ts
git commit -m "fix(save): large pages no longer time out the save transaction (N1)"
```

---

### Task 1: Shared v6 token schema with graph checks

**Files:**
- Create: `packages/shared/schemas/design-tokens.ts`
- Modify: `packages/shared/schemas/designToken.ts` (rename exported `DesignTokenSchema` → `LegacyDesignTokenSchema`, type `DesignToken` → `LegacyDesignToken`; keep `TokenKindSchema`, `TokenCategorySchema`, `TokenTypeSchema`, `TokenValueSchema` exports as they are)
- Modify: `packages/shared/schemas/index.ts` (add `export * from "./design-tokens";`)
- Test: `packages/shared/schemas/__tests__/design-tokens.test.ts`

**Interfaces:**
- Consumes: `TokenKindSchema`, `TokenCategorySchema`, `TokenTypeSchema` from `./designToken`.
- Produces:
  - `TOKENS_SCHEMA_VERSION: 6`
  - `type TokenRef = { alias: string } | { value: string }`
  - `type TokenLayer = "primitive" | "semantic"`
  - `type DarkMode = "auto" | "off"`, `DarkModeSchema`
  - `type DesignToken` (v6, below), `DesignTokenSchema`, `DesignTokensSchema` (array + graph checks)
  - `validateTokens(input: unknown): { ok: true; tokens: DesignToken[] } | { ok: false; reason: string }`

- [ ] **Step 1: Write the failing tests**

```ts
// packages/shared/schemas/__tests__/design-tokens.test.ts
import { describe, it, expect } from "vitest";
import { validateTokens, type DesignToken } from "../design-tokens";

const prim = (id: string, value: string, kind: DesignToken["kind"] = "color"): DesignToken => ({
  id, name: id, kind, layer: "primitive", modes: { light: { value } },
  category: kind === "color" ? "colors" : "spacing", cssVar: `--buildrick-design-${id}`, type: kind === "color" ? "color" : "length",
});
const sem = (id: string, light: DesignToken["modes"]["light"], dark?: DesignToken["modes"]["light"], kind: DesignToken["kind"] = "color"): DesignToken => ({
  id, name: id, kind, layer: "semantic", modes: dark ? { light, dark } : { light },
  category: kind === "color" ? "colors" : "spacing", cssVar: `--buildrick-design-${id}`, type: kind === "color" ? "color" : "length",
});

describe("validateTokens (v6)", () => {
  it("accepts primitives and semantic aliases of the same kind", () => {
    const r = validateTokens([prim("blue-600", "#1A56DB"), prim("blue-400", "#76A9FA"),
      sem("color-primary", { alias: "blue-600" }, { alias: "blue-400" })]);
    expect(r.ok).toBe(true);
  });

  it("refuses a primitive with a dark mode", () => {
    const bad = { ...prim("blue-600", "#1A56DB"), modes: { light: { value: "#1A56DB" }, dark: { value: "#000" } } };
    expect(validateTokens([bad])).toEqual({ ok: false, reason: expect.stringContaining("primitive blue-600") });
  });

  it("refuses a primitive that aliases", () => {
    const bad = { ...prim("a", "#000"), modes: { light: { alias: "b" } } };
    expect(validateTokens([bad, prim("b", "#111")]).ok).toBe(false);
  });

  it("refuses an alias to a missing token", () => {
    expect(validateTokens([sem("color-primary", { alias: "nope" })])).toEqual({ ok: false, reason: expect.stringContaining("nope") });
  });

  it("refuses an alias across kinds", () => {
    const r = validateTokens([prim("space-4", "16px", "spacing"), sem("color-primary", { alias: "space-4" })]);
    expect(r).toEqual({ ok: false, reason: expect.stringContaining("kind") });
  });

  it("refuses an alias cycle", () => {
    const r = validateTokens([sem("a", { alias: "b" }), sem("b", { alias: "a" })]);
    expect(r).toEqual({ ok: false, reason: expect.stringContaining("cycle") });
  });

  it("refuses duplicate ids", () => {
    expect(validateTokens([prim("x", "#000"), prim("x", "#111")]).ok).toBe(false);
  });

  it("refuses replacedBy pointing at a missing token", () => {
    const t = { ...prim("x", "#000"), replacedBy: "gone" };
    expect(validateTokens([t]).ok).toBe(false);
  });

  it("refuses non-array and null entries with a reason", () => {
    expect(validateTokens(null)).toEqual({ ok: false, reason: expect.any(String) });
    expect(validateTokens([null]).ok).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run (repo root): `npx vitest run packages/shared/schemas/__tests__/design-tokens.test.ts`
Expected: FAIL — `Cannot find module '../design-tokens'`.

- [ ] **Step 3: Implement**

```ts
// packages/shared/schemas/design-tokens.ts
/**
 * Design tokens, schema v6 (Brand Part 1, spec §1).
 *
 * Shaped like the W3C Design Tokens format (D4): `kind` ~ `$type`, a mode's
 * `{ value }` ~ `$value` literal, `{ alias }` ~ `{group.token}` reference.
 * The editor, every server write path and publish validate with this one
 * schema. Primitives carry exactly `modes.light` as a literal; only semantic
 * tokens alias or carry `modes.dark`.
 */
import { z } from "zod";
import { TokenKindSchema, TokenCategorySchema, TokenTypeSchema } from "./designToken";

export const TOKENS_SCHEMA_VERSION = 6;

export const TokenRefSchema = z.union([
  z.object({ alias: z.string().min(1) }).strict(),
  z.object({ value: z.string() }).strict(),
]);
export type TokenRef = z.infer<typeof TokenRefSchema>;

export const TokenLayerSchema = z.enum(["primitive", "semantic"]);
export type TokenLayer = z.infer<typeof TokenLayerSchema>;

export const DarkModeSchema = z.enum(["auto", "off"]);
export type DarkMode = z.infer<typeof DarkModeSchema>;

export const DesignTokenSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
    name: z.string().min(1),
    kind: TokenKindSchema,
    layer: TokenLayerSchema,
    modes: z.object({ light: TokenRefSchema, dark: TokenRefSchema.optional() }).strict(),
    category: TokenCategorySchema,
    cssVar: z.string().regex(/^--[a-z0-9-]+$/),
    type: TokenTypeSchema,
    group: z.string().optional(),
    options: z.array(z.string()).optional(),
    description: z.string().optional(),
    friendlyName: z.string().optional(),
    semanticKind: z.enum(["action", "surface", "text", "feedback"]).optional(),
    replacedBy: z.string().optional(),
    /** Old var names this token still answers to (merged duplicates, renames). */
    legacyNames: z.array(z.string().regex(/^--[a-z0-9-]+$/)).optional(),
  })
  .strict();
export type DesignToken = z.infer<typeof DesignTokenSchema>;

const isAlias = (r: TokenRef): r is { alias: string } => "alias" in r;

function graphProblem(tokens: DesignToken[]): string | null {
  const byId = new Map<string, DesignToken>();
  for (const t of tokens) {
    if (byId.has(t.id)) return `duplicate token id ${t.id}`;
    byId.set(t.id, t);
  }
  for (const t of tokens) {
    if (t.layer === "primitive" && (t.modes.dark || isAlias(t.modes.light))) {
      return `primitive ${t.id} must have exactly one literal light value`;
    }
    for (const ref of [t.modes.light, t.modes.dark]) {
      if (!ref || !isAlias(ref)) continue;
      const target = byId.get(ref.alias);
      if (!target) return `${t.id} aliases missing token ${ref.alias}`;
      if (target.kind !== t.kind) return `${t.id} (${t.kind}) aliases ${target.id} of another kind (${target.kind})`;
    }
    if (t.replacedBy && !byId.has(t.replacedBy)) return `${t.id} replacedBy missing token ${t.replacedBy}`;
  }
  // Cycle check per mode: follow aliases; light falls back to light, dark to dark then light.
  for (const mode of ["light", "dark"] as const) {
    for (const start of tokens) {
      const seen = new Set<string>();
      let cur: DesignToken | undefined = start;
      while (cur) {
        if (seen.has(cur.id)) return `alias cycle through ${cur.id}`;
        seen.add(cur.id);
        const ref: TokenRef = (mode === "dark" && cur.modes.dark) || cur.modes.light;
        cur = isAlias(ref) ? byId.get(ref.alias) : undefined;
      }
    }
  }
  return null;
}

export const DesignTokensSchema = z.array(DesignTokenSchema).superRefine((tokens, ctx) => {
  const problem = graphProblem(tokens);
  if (problem) ctx.addIssue({ code: z.ZodIssueCode.custom, message: problem });
});

export function validateTokens(
  input: unknown,
): { ok: true; tokens: DesignToken[] } | { ok: false; reason: string } {
  const parsed = DesignTokensSchema.safeParse(input);
  if (parsed.success) return { ok: true, tokens: parsed.data };
  const issue = parsed.error.issues[0];
  return { ok: false, reason: `${issue.path.join(".") || "tokens"}: ${issue.message}` };
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run packages/shared/schemas/__tests__/design-tokens.test.ts`
Expected: 9 PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/shared/schemas/design-tokens.ts packages/shared/schemas/designToken.ts packages/shared/schemas/index.ts packages/shared/schemas/__tests__/design-tokens.test.ts
git commit -m "feat(shared): v6 design-token schema with alias graph checks"
```

---

### Task 2: DTCG round trip

D4: lossless ours → DTCG → ours. Lives in the schema module (eng D1: "schema.ts (DTCG shape + round-trip)").

**Files:**
- Modify: `packages/shared/schemas/design-tokens.ts`
- Test: `packages/shared/schemas/__tests__/design-tokens.dtcg.test.ts`

**Interfaces:**
- Produces: `toDTCG(tokens: DesignToken[]): DtcgDocument`, `fromDTCG(doc: DtcgDocument): DesignToken[]`,
  `type DtcgDocument = Record<string, DtcgEntry>`.

- [ ] **Step 1: Write the failing test**

```ts
// packages/shared/schemas/__tests__/design-tokens.dtcg.test.ts
import { describe, it, expect } from "vitest";
import { toDTCG, fromDTCG, type DesignToken } from "../design-tokens";

const tokens: DesignToken[] = [
  { id: "blue-600", name: "Blue 600", kind: "color", layer: "primitive", modes: { light: { value: "#1A56DB" } },
    category: "colors", cssVar: "--buildrick-design-blue-600", type: "color" },
  { id: "blue-400", name: "Blue 400", kind: "color", layer: "primitive", modes: { light: { value: "#76A9FA" } },
    category: "colors", cssVar: "--buildrick-design-blue-400", type: "color" },
  { id: "color-primary", name: "Primary", kind: "color", layer: "semantic",
    modes: { light: { alias: "blue-600" }, dark: { alias: "blue-400" } }, category: "colors",
    cssVar: "--buildrick-design-color-primary", type: "color", group: "brand", description: "Primary brand color",
    legacyNames: ["--buildrick-design-color-action"] },
  { id: "motion-fast", name: "Fast", kind: "motion", layer: "semantic", modes: { light: { value: "150ms ease-out" } },
    category: "effects", cssVar: "--buildrick-design-motion-fast", type: "string" },
];

describe("DTCG round trip", () => {
  it("is lossless for primitives, aliases, modes and extensions", () => {
    expect(fromDTCG(toDTCG(tokens))).toEqual(tokens);
  });

  it("writes standard $type/$value and {alias} references", () => {
    const doc = toDTCG(tokens);
    expect(doc["blue-600"]).toMatchObject({ $type: "color", $value: "#1A56DB" });
    expect(doc["color-primary"]).toMatchObject({ $type: "color", $value: "{blue-600}" });
    expect(doc["color-primary"].$extensions["com.buildrik"].modes.dark).toBe("{blue-400}");
  });

  it("maps kinds without a DTCG type to a namespaced extension type", () => {
    expect(toDTCG(tokens)["motion-fast"].$type).toBe("com.buildrik.motion");
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run packages/shared/schemas/__tests__/design-tokens.dtcg.test.ts`
Expected: FAIL — `toDTCG is not a function`.

- [ ] **Step 3: Implement (append to `design-tokens.ts`)**

```ts
/* ── DTCG (D4) ──────────────────────────────────────────────────────────
   Kinds with a DTCG type map to it; the rest use "com.buildrik.<kind>".
   Everything that is not $type/$value/$description rides in
   $extensions["com.buildrik"], so the round trip is lossless. */
const DTCG_TYPE: Partial<Record<DesignToken["kind"], string>> = {
  color: "color", spacing: "dimension", radius: "dimension", sizing: "dimension",
  breakpoint: "dimension", shadow: "shadow", opacity: "number", zindex: "number",
  type: "typography", border: "border",
};

type DtcgExt = Omit<DesignToken, "id" | "kind" | "modes" | "description"> & {
  kind: DesignToken["kind"];
  modes: { dark?: string };
};
export interface DtcgEntry {
  $type: string;
  $value: string;
  $description?: string;
  $extensions: { "com.buildrik": DtcgExt };
}
export type DtcgDocument = Record<string, DtcgEntry>;

const refToDtcg = (r: TokenRef): string => ("alias" in r ? `{${r.alias}}` : r.value);
const dtcgToRef = (s: string): TokenRef => {
  const m = /^\{([a-z0-9][a-z0-9-]*)\}$/.exec(s);
  return m ? { alias: m[1] } : { value: s };
};

export function toDTCG(tokens: DesignToken[]): DtcgDocument {
  const doc: DtcgDocument = {};
  for (const t of tokens) {
    const { id, kind, modes, description, ...rest } = t;
    doc[id] = {
      $type: DTCG_TYPE[kind] ?? `com.buildrik.${kind}`,
      $value: refToDtcg(modes.light),
      ...(description !== undefined ? { $description: description } : {}),
      $extensions: { "com.buildrik": { ...rest, kind, modes: modes.dark ? { dark: refToDtcg(modes.dark) } : {} } },
    };
  }
  return doc;
}

export function fromDTCG(doc: DtcgDocument): DesignToken[] {
  return Object.entries(doc).map(([id, e]) => {
    const { kind, modes, ...rest } = e.$extensions["com.buildrik"];
    const token: DesignToken = {
      id,
      name: rest.name,
      kind,
      layer: rest.layer,
      modes: modes.dark ? { light: dtcgToRef(e.$value), dark: dtcgToRef(modes.dark) } : { light: dtcgToRef(e.$value) },
      category: rest.category,
      cssVar: rest.cssVar,
      type: rest.type,
    };
    for (const key of ["group", "options", "friendlyName", "semanticKind", "replacedBy", "legacyNames"] as const) {
      if (rest[key] !== undefined) Object.assign(token, { [key]: rest[key] });
    }
    if (e.$description !== undefined) token.description = e.$description;
    return token;
  });
}
```

Note: `toEqual` ignores key order, so the rebuilt objects compare equal.

- [ ] **Step 4: Run tests**

Run: `npx vitest run packages/shared/schemas/__tests__/design-tokens.dtcg.test.ts packages/shared/schemas/__tests__/design-tokens.test.ts`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/shared/schemas/design-tokens.ts packages/shared/schemas/__tests__/design-tokens.dtcg.test.ts
git commit -m "feat(shared): lossless DTCG round trip for v6 tokens (D4)"
```

---

### Task 3: Shared v5 → v6 migration

Spec §4. **No resolved colour may change.** Rules:
1. Known v5 primitive ids (`color-brand-500`, `color-slate-50`, `color-slate-700`, `color-red-500`, every id the
   v5 seeds mark `group: "primitive"`) → `layer: "primitive"`, `modes.light = { value }`, `darkValue` dropped
   (primitives have no dark; v5 primitives never had one).
2. Every other token → `layer: "semantic"`. If its light value exactly equals (case-insensitive hex, trimmed) a
   primitive's value of the same kind → `{ alias: primitiveId }`; otherwise create `custom-<originalId>` primitive
   with that value and alias it. Same for `darkValue` → `modes.dark`.
3. Duplicate sets (BRD-12) merge **only when their values are equal**: `color-action`→`color-primary`,
   `color-surface`→`color-background`, `color-text-primary`→`color-text`, `color-feedback-error`→`color-error`.
   The dropped token's `cssVar` is added to the survivor's `legacyNames`. Unequal → both stay.
4. `kind` becomes required: legacy rows with no `kind` get it from `category`/`type` (`colors`→`color`,
   `typography`+`font-family|font-size`→`type`, `spacing`→`spacing`, `effects`+`shadow`→`shadow`, else `sizing`).
5. `aliasOf` (v5) → `modes.light = { alias }`. `typedValue` dropped (it mirrors `value`).
6. Deterministic: same input → same output (no random ids, no timestamps). Id collision: if `custom-<id>` exists,
   use `custom-<id>-2`, `-3`, … in input order.
7. Output must pass `validateTokens`; otherwise throw `TokenMigrationError` (the input is untouched).

**Files:**
- Create: `packages/shared/tokens/migrate.ts`, `packages/shared/tokens/index.ts`
- Test: `packages/shared/tokens/__tests__/migrate.test.ts`, fixtures in `packages/shared/tokens/__tests__/__fixtures__/` (`seed-only.json`, `custom-colours.json`, `dark-values.json`, `duplicates.json`, `malformed.json`) — generate each by exporting `projectSettings.designTokens` from a v5 site shape (copy the v5 `DEFAULT_TOKENS` list for `seed-only`; edit values for the others).

**Interfaces:**
- Consumes: `validateTokens`, `DesignToken`, `LegacyDesignToken` from `@buildrik/shared/schemas`.
- Produces:
  - `migrateTokensToV6(legacy: unknown): DesignToken[]` (throws `TokenMigrationError`)
  - `class TokenMigrationError extends Error { readonly reason: string }`
  - `LEGACY_PRIMITIVE_IDS: readonly string[]`

- [ ] **Step 1: Write the failing tests**

```ts
// packages/shared/tokens/__tests__/migrate.test.ts
import { describe, it, expect } from "vitest";
import { migrateTokensToV6, TokenMigrationError } from "../migrate";
import { resolveTokenLiteral } from "../resolve";
import seedOnly from "./__fixtures__/seed-only.json";
import customColours from "./__fixtures__/custom-colours.json";
import darkValues from "./__fixtures__/dark-values.json";
import duplicates from "./__fixtures__/duplicates.json";
import malformed from "./__fixtures__/malformed.json";

type V5 = { id: string; value: string; darkValue?: string; cssVar: string };

/** Every v5 var name must resolve to the same literal after migration. */
function expectSameResolvedValues(v5: V5[]) {
  const v6 = migrateTokensToV6(v5);
  for (const old of v5) {
    const holder = v6.find((t) => t.cssVar === old.cssVar || t.legacyNames?.includes(old.cssVar));
    expect(holder, `no token answers to ${old.cssVar}`).toBeDefined();
    expect(resolveTokenLiteral(v6, holder!.id, "light")?.toLowerCase()).toBe(old.value.trim().toLowerCase());
    if (old.darkValue) {
      expect(resolveTokenLiteral(v6, holder!.id, "dark")?.toLowerCase()).toBe(old.darkValue.trim().toLowerCase());
    }
  }
}

describe("migrateTokensToV6", () => {
  it.each([
    ["seed only", seedOnly],
    ["custom colours", customColours],
    ["dark values", darkValues],
    ["duplicates", duplicates],
  ])("keeps every resolved value identical: %s", (_name, fixture) => {
    expectSameResolvedValues(fixture as V5[]);
  });

  it("aliases a semantic colour equal to a primitive instead of copying it", () => {
    const v6 = migrateTokensToV6(seedOnly);
    const primary = v6.find((t) => t.id === "color-primary")!;
    expect(primary.layer).toBe("semantic");
    expect(primary.modes.light).toEqual({ alias: "color-brand-500" });
  });

  it("creates a deterministic custom primitive for an unmatched value", () => {
    const a = migrateTokensToV6(customColours);
    const b = migrateTokensToV6(customColours);
    expect(a).toEqual(b);
    expect(a.some((t) => t.id.startsWith("custom-") && t.layer === "primitive")).toBe(true);
  });

  it("does not collide with an existing custom-<id> token", () => {
    const input = [
      ...seedOnly,
      { id: "custom-color-primary", name: "Mine", value: "#123456", category: "colors", cssVar: "--buildrick-design-custom-color-primary", type: "color" },
    ];
    const ids = migrateTokensToV6(input.map((t) => (t.id === "color-primary" ? { ...t, value: "#ABCDEF" } : t))).map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("merges equal duplicates and keeps the dropped var as a legacy name", () => {
    const v6 = migrateTokensToV6(duplicates);
    expect(v6.find((t) => t.id === "color-action")).toBeUndefined();
    expect(v6.find((t) => t.id === "color-primary")!.legacyNames).toContain("--buildrick-design-color-action");
  });

  it("keeps unequal duplicates as separate tokens", () => {
    const input = (duplicates as V5[]).map((t) => (t.id === "color-action" ? { ...t, value: "#FF0000" } : t));
    expect(migrateTokensToV6(input).find((t) => t.id === "color-action")).toBeDefined();
  });

  it("throws a typed error on malformed input and never returns partial data", () => {
    expect(() => migrateTokensToV6(malformed)).toThrow(TokenMigrationError);
    expect(() => migrateTokensToV6(null)).toThrow(TokenMigrationError);
  });
});
```

`malformed.json`: `[null, {"id":"x"}, {"id":"color-primary","value":"#1A56DB"}, {"id":"color-primary","value":"#000"}]` (null entry, missing fields, duplicate id).

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run packages/shared/tokens/__tests__/migrate.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `resolve.ts` first (migrate's tests use it)**

```ts
// packages/shared/tokens/resolve.ts
import type { DesignToken, TokenRef } from "../schemas/design-tokens";

/** The literal a token resolves to in a mode, following aliases. Dark falls
 *  back to light at every hop. Returns null for a missing id or a cycle. */
export function resolveTokenLiteral(
  tokens: readonly DesignToken[],
  id: string,
  mode: "light" | "dark",
): string | null {
  const byId = new Map(tokens.map((t) => [t.id, t]));
  const seen = new Set<string>();
  let cur = byId.get(id);
  while (cur) {
    if (seen.has(cur.id)) return null;
    seen.add(cur.id);
    const ref: TokenRef = (mode === "dark" && cur.modes.dark) || cur.modes.light;
    if ("value" in ref) return ref.value;
    cur = byId.get(ref.alias);
  }
  return null;
}
```

- [ ] **Step 4: Implement `migrate.ts`**

```ts
// packages/shared/tokens/migrate.ts
/**
 * v5 → v6 (Brand Part 1 spec §4). Pure and deterministic: the editor (on
 * load), every server write path and publish call this one function. It
 * never changes a resolved value; the tests prove that per fixture.
 */
import { validateTokens, type DesignToken, type TokenRef } from "../schemas/design-tokens";

export class TokenMigrationError extends Error {
  constructor(readonly reason: string) {
    super(`token migration failed: ${reason}`);
    this.name = "TokenMigrationError";
  }
}

export const LEGACY_PRIMITIVE_IDS = ["color-brand-500", "color-slate-50", "color-slate-700", "color-red-500"] as const;

const DUPLICATE_OF: Record<string, string> = {
  "color-action": "color-primary",
  "color-surface": "color-background",
  "color-text-primary": "color-text",
  "color-feedback-error": "color-error",
};

interface V5Row {
  id: string; name: string; value: string; category: DesignToken["category"]; cssVar: string;
  type: DesignToken["type"]; kind?: DesignToken["kind"]; darkValue?: string; aliasOf?: string;
  group?: string; options?: string[]; description?: string; friendlyName?: string;
  semanticKind?: DesignToken["semanticKind"]; replacedBy?: string;
}

function isV5Row(x: unknown): x is V5Row {
  if (!x || typeof x !== "object") return false;
  const r = x as Record<string, unknown>;
  return typeof r.id === "string" && r.id.length > 0 && typeof r.name === "string" &&
    typeof r.value === "string" && typeof r.cssVar === "string" && typeof r.category === "string" && typeof r.type === "string";
}

const norm = (v: string) => v.trim().toLowerCase();

function kindOf(r: V5Row): DesignToken["kind"] {
  if (r.kind) return r.kind;
  if (r.category === "colors" || r.type === "color") return "color";
  if (r.category === "typography") return "type";
  if (r.category === "spacing") return "spacing";
  if (r.type === "shadow") return "shadow";
  return "sizing";
}

export function migrateTokensToV6(legacy: unknown): DesignToken[] {
  if (!Array.isArray(legacy)) throw new TokenMigrationError("designTokens is not an array");
  const rows: V5Row[] = [];
  const seenIds = new Set<string>();
  for (const [i, x] of legacy.entries()) {
    if (!isV5Row(x)) throw new TokenMigrationError(`entry ${i} is not a v5 token`);
    if (seenIds.has(x.id)) throw new TokenMigrationError(`duplicate id ${x.id}`);
    seenIds.add(x.id);
    rows.push(x);
  }

  const byId = new Map(rows.map((r) => [r.id, r]));
  // Merge equal duplicates (BRD-12). Unequal ones stay separate.
  const legacyNamesFor = new Map<string, string[]>();
  const dropped = new Set<string>();
  for (const [dupId, keepId] of Object.entries(DUPLICATE_OF)) {
    const dup = byId.get(dupId);
    const keep = byId.get(keepId);
    if (!dup || !keep) continue;
    if (norm(dup.value) !== norm(keep.value) || norm(dup.darkValue ?? "") !== norm(keep.darkValue ?? "")) continue;
    dropped.add(dupId);
    legacyNamesFor.set(keepId, [...(legacyNamesFor.get(keepId) ?? []), dup.cssVar]);
  }

  const out: DesignToken[] = [];
  const primitiveByValue = new Map<string, string>(); // `${kind}|${value}` → primitive id
  const usedIds = new Set(rows.map((r) => r.id));

  const base = (r: V5Row) => {
    const t: Omit<DesignToken, "layer" | "modes"> = {
      id: r.id, name: r.name, kind: kindOf(r), category: r.category, cssVar: r.cssVar, type: r.type,
    };
    for (const key of ["group", "options", "description", "friendlyName", "semanticKind", "replacedBy"] as const) {
      if (r[key] !== undefined) Object.assign(t, { [key]: r[key] });
    }
    return t;
  };

  for (const r of rows) {
    if (!(LEGACY_PRIMITIVE_IDS as readonly string[]).includes(r.id) && r.group !== "primitive") continue;
    out.push({ ...base(r), layer: "primitive", modes: { light: { value: r.value } } });
    primitiveByValue.set(`${kindOf(r)}|${norm(r.value)}`, r.id);
  }

  const primitiveFor = (r: V5Row, value: string, suffix: string): TokenRef => {
    const key = `${kindOf(r)}|${norm(value)}`;
    const hit = primitiveByValue.get(key);
    if (hit) return { alias: hit };
    let id = `custom-${r.id}${suffix}`;
    for (let n = 2; usedIds.has(id); n++) id = `custom-${r.id}${suffix}-${n}`;
    usedIds.add(id);
    out.push({
      id, name: `${r.name}${suffix ? " (dark)" : ""}`, kind: kindOf(r), layer: "primitive",
      modes: { light: { value } }, category: r.category, cssVar: `--buildrick-design-${id}`, type: r.type,
    });
    primitiveByValue.set(key, id);
    return { alias: id };
  };

  for (const r of rows) {
    if (dropped.has(r.id) || out.some((t) => t.id === r.id)) continue;
    const kind = kindOf(r);
    const isColour = kind === "color";
    const light: TokenRef = r.aliasOf ? { alias: r.aliasOf } : isColour ? primitiveFor(r, r.value, "") : { value: r.value };
    const dark: TokenRef | undefined =
      r.darkValue === undefined || r.darkValue === "" ? undefined : isColour ? primitiveFor(r, r.darkValue, "-dark") : { value: r.darkValue };
    const legacyNames = legacyNamesFor.get(r.id);
    out.push({
      ...base(r), layer: "semantic",
      modes: dark ? { light, dark } : { light },
      ...(legacyNames ? { legacyNames } : {}),
    });
  }

  const checked = validateTokens(out);
  if (!checked.ok) throw new TokenMigrationError(checked.reason);
  return checked.tokens;
}
```

Non-colour semantic tokens keep their literal (`{ value }`) — spec §1 primitive scales for spacing/radius/etc. are produced by the 1c generator, not invented here.

```ts
// packages/shared/tokens/index.ts
export { migrateTokensToV6, TokenMigrationError, LEGACY_PRIMITIVE_IDS } from "./migrate";
export { resolveTokenLiteral } from "./resolve";
```

- [ ] **Step 5: Run tests**

Run: `npx vitest run packages/shared/tokens/__tests__/migrate.test.ts`
Expected: all PASS. If a "keeps every resolved value" case fails, fix the migration — never the fixture.

- [ ] **Step 6: Commit**

```bash
git add packages/shared/tokens
git commit -m "feat(shared): deterministic v5→v6 token migration that never changes a resolved value"
```

---

### Task 4: `emitTokenCss` with legacy backstop, sanitizer and Dark mode

Spec §2, D8, D17 (skip-and-log, never throw), legacy backstop (round 2).

**Files:**
- Create: `packages/shared/tokens/legacySeed.ts`, `packages/shared/tokens/emit.ts`
- Modify: `packages/shared/tokens/index.ts`
- Test: `packages/shared/tokens/__tests__/emit.test.ts`

**Interfaces:**
- Consumes: `DesignToken`, `DarkMode` (shared schema), `resolveTokenLiteral`.
- Produces: `emitTokenCss(tokens: readonly DesignToken[], opts: { darkMode: DarkMode; onSkip?: (id: string, reason: string) => void }): string`;
  `LEGACY_SEED: ReadonlyArray<{ cssVar: string; value: string }>`.

- [ ] **Step 1: Generate `legacySeed.ts` once from today's v5 `DEFAULT_TOKENS`**

Run (repo root) and paste the printed array into the file:

```bash
cd packages/editor && npx tsx -e 'import("./src/engine/designSystem/defaultTokens").then(m => console.log(JSON.stringify(m.DEFAULT_TOKENS.map(t => ({ cssVar: t.cssVar, value: t.value })), null, 2)))'
```

```ts
// packages/shared/tokens/legacySeed.ts
/**
 * The v5 seed's var names and light values, frozen 2026-10-05. emitTokenCss
 * emits any of these that no current token defines, so an element bound to a
 * seed var whose token was deleted still resolves (siteTokensCSS did the same
 * by appending all 78 DEFAULT_TOKENS). Do not edit: it is a compatibility
 * record, not the seed.
 */
export const LEGACY_SEED: ReadonlyArray<{ cssVar: string; value: string }> = [
  /* paste the generated array here — 96 entries */
];
```

- [ ] **Step 2: Write the failing tests**

```ts
// packages/shared/tokens/__tests__/emit.test.ts
import { describe, it, expect, vi } from "vitest";
import { emitTokenCss } from "../emit";
import { LEGACY_SEED } from "../legacySeed";
import type { DesignToken } from "../../schemas/design-tokens";

const t = (over: Partial<DesignToken> & Pick<DesignToken, "id" | "modes" | "layer">): DesignToken => ({
  name: over.id, kind: "color", category: "colors", cssVar: `--buildrick-design-${over.id}`, type: "color", ...over,
});
const tokens: DesignToken[] = [
  t({ id: "blue-600", layer: "primitive", modes: { light: { value: "#1A56DB" } } }),
  t({ id: "blue-400", layer: "primitive", modes: { light: { value: "#76A9FA" } } }),
  t({ id: "color-primary", layer: "semantic", modes: { light: { alias: "blue-600" }, dark: { alias: "blue-400" } },
      legacyNames: ["--buildrick-design-color-action"] }),
];

describe("emitTokenCss", () => {
  it("emits primitives as literals and semantic tokens as var() aliases", () => {
    const css = emitTokenCss(tokens, { darkMode: "off" });
    expect(css).toContain("--buildrick-design-blue-600:#1A56DB");
    expect(css).toContain("--buildrick-design-color-primary:var(--buildrick-design-blue-600)");
  });

  it("emits legacy names as aliases of their token", () => {
    expect(emitTokenCss(tokens, { darkMode: "off" })).toContain(
      "--buildrick-design-color-action:var(--buildrick-design-color-primary)");
  });

  it("emits no dark blocks when Dark mode is off", () => {
    const css = emitTokenCss(tokens, { darkMode: "off" });
    expect(css).not.toContain("prefers-color-scheme");
    expect(css).not.toContain("data-theme");
  });

  it("emits media-query and data-theme dark blocks when Dark mode is auto", () => {
    const css = emitTokenCss(tokens, { darkMode: "auto" });
    expect(css).toContain('@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--buildrick-design-color-primary:var(--buildrick-design-blue-400)}}');
    expect(css).toContain(':root[data-theme="dark"]{--buildrick-design-color-primary:var(--buildrick-design-blue-400)}');
  });

  it("emits the legacy backstop for seed vars no token defines", () => {
    const missing = LEGACY_SEED.find((s) => s.cssVar === "--buildrick-design-btn-padding-x") ?? LEGACY_SEED[LEGACY_SEED.length - 1];
    expect(emitTokenCss(tokens, { darkMode: "off" })).toContain(`${missing.cssVar}:`);
  });

  it("strips ; { } < from values and skips an invalid token without throwing", () => {
    const onSkip = vi.fn();
    const evil = t({ id: "evil", layer: "primitive", modes: { light: { value: "red;}</style><script>" } } });
    const css = emitTokenCss([...tokens, evil], { darkMode: "off", onSkip });
    expect(css).not.toMatch(/<\/style>|<script/);
    expect(css).toContain("--buildrick-design-evil:red/style>script>");
    const empty = t({ id: "empty", layer: "primitive", modes: { light: { value: "  " } } });
    expect(() => emitTokenCss([empty], { darkMode: "off", onSkip })).not.toThrow();
    expect(onSkip).toHaveBeenCalledWith("empty", expect.any(String));
  });

  it("never emits a var twice (token wins over backstop)", () => {
    const css = emitTokenCss(tokens, { darkMode: "off" });
    expect(css.match(/--buildrick-design-color-primary:/g)).toHaveLength(1);
  });
});
```

- [ ] **Step 3: Run to verify failure**

Run: `npx vitest run packages/shared/tokens/__tests__/emit.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement**

```ts
// packages/shared/tokens/emit.ts
/**
 * The one token CSS emitter (spec §2): canvas, single-file export, ZIP export
 * and publish all write this string. Aliases stay `var()` so a primitive edit
 * cascades in the browser. Dark blocks only when the site's Dark mode is
 * "auto" (D8). A bad value is skipped and reported, never thrown, so one token
 * can never fail a publish (D17).
 */
import type { DarkMode, DesignToken, TokenRef } from "../schemas/design-tokens";
import { LEGACY_SEED } from "./legacySeed";

const clean = (v: string) => v.trim().replace(/[;{}<]/g, "");

export function emitTokenCss(
  tokens: readonly DesignToken[],
  opts: { darkMode: DarkMode; onSkip?: (id: string, reason: string) => void },
): string {
  const byId = new Map(tokens.map((t) => [t.id, t]));
  const refCss = (ref: TokenRef): string | null => {
    if ("alias" in ref) {
      const target = byId.get(ref.alias);
      return target ? `var(${target.cssVar})` : null;
    }
    const v = clean(ref.value);
    return v ? v : null;
  };

  const light: string[] = [];
  const dark: string[] = [];
  const seen = new Set<string>();
  for (const t of tokens) {
    const lv = refCss(t.modes.light);
    if (!lv) {
      opts.onSkip?.(t.id, "empty or unresolvable light value");
      continue;
    }
    seen.add(t.cssVar);
    light.push(`${t.cssVar}:${lv}`);
    for (const legacy of t.legacyNames ?? []) {
      if (seen.has(legacy)) continue;
      seen.add(legacy);
      light.push(`${legacy}:var(${t.cssVar})`);
    }
    if (opts.darkMode === "auto" && t.modes.dark) {
      const dv = refCss(t.modes.dark);
      if (dv) dark.push(`${t.cssVar}:${dv}`);
      else opts.onSkip?.(t.id, "unresolvable dark value");
    }
  }
  for (const s of LEGACY_SEED) {
    if (seen.has(s.cssVar)) continue;
    const v = clean(s.value);
    if (!v) continue;
    seen.add(s.cssVar);
    light.push(`${s.cssVar}:${v}`);
  }

  let css = `\n:root{${light.join(";")}}\n`;
  if (dark.length) {
    const body = dark.join(";");
    css += `@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){${body}}}\n`;
    css += `:root[data-theme="dark"]{${body}}\n`;
  }
  return css;
}
```

Add to `index.ts`: `export { emitTokenCss } from "./emit";` and `export { LEGACY_SEED } from "./legacySeed";`.

- [ ] **Step 5: Run tests**

Run: `npx vitest run packages/shared/tokens`
Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/shared/tokens
git commit -m "feat(shared): emitTokenCss — one emitter, legacy backstop, sanitized, dark only when Auto"
```

---

### Task 5: One-pass usage index

D2 groundwork (the delete guard UI is 1b); the server's theme push and Connect to tokens reuse it. Mirrors
`TokenUsageTracker`'s two reference syntaxes (`engine/designSystem/TokenUsageTracker.ts:28,52`).

**Files:**
- Create: `packages/shared/tokens/usage.ts`
- Modify: `packages/shared/tokens/index.ts`
- Test: `packages/shared/tokens/__tests__/usage.test.ts`

**Interfaces:**
- Produces: `buildTokenUsageIndex(sources: readonly unknown[], tokens: readonly DesignToken[]): { direct: Map<string, number>; total: (id: string) => number; unknown: boolean }`.
  `sources` are any JSON (page `blocks`, `projectStyles`, saved components, CMS templates). `unknown` is true when
  a source could not be serialized; callers must then refuse deletes (spec §6).

- [ ] **Step 1: Write the failing tests**

```ts
// packages/shared/tokens/__tests__/usage.test.ts
import { describe, it, expect } from "vitest";
import { buildTokenUsageIndex } from "../usage";
import type { DesignToken } from "../../schemas/design-tokens";

const tok = (id: string, light: DesignToken["modes"]["light"], layer: DesignToken["layer"] = "semantic"): DesignToken => ({
  id, name: id, kind: "color", layer, modes: { light }, category: "colors", cssVar: `--buildrick-design-${id}`, type: "color",
});
const tokens = [tok("blue-600", { value: "#1A56DB" }, "primitive"), tok("color-primary", { alias: "blue-600" })];

describe("buildTokenUsageIndex", () => {
  it("counts var() and {{token.x}} references across all sources in one pass", () => {
    const pages = [{ blocks: [{ styles: { color: "var(--buildrick-design-color-primary)", background: "{{token.color-primary}}" } }] }];
    const styles = [{ selector: ".btn", rules: { color: "var( --buildrick-design-color-primary )" } }];
    const idx = buildTokenUsageIndex([pages, styles], tokens);
    expect(idx.direct.get("color-primary")).toBe(3);
  });

  it("counts a primitive's usage through aliases", () => {
    const idx = buildTokenUsageIndex([[{ c: "var(--buildrick-design-color-primary)" }]], tokens);
    expect(idx.total("blue-600")).toBe(1);
  });

  it("reports unknown instead of zero when a source cannot be serialized", () => {
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    expect(buildTokenUsageIndex([cyclic], tokens).unknown).toBe(true);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run packages/shared/tokens/__tests__/usage.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```ts
// packages/shared/tokens/usage.ts
/**
 * One pass over every source (pages, project styles, components, CMS
 * templates): count each token's direct references, then let callers ask for
 * totals through alias chains. Same two syntaxes as TokenUsageTracker.
 */
import type { DesignToken } from "../schemas/design-tokens";

const VAR_RE = /var\(\s*--buildrick-design-([a-z0-9-]+)\s*\)/gi;
const TPL_RE = /\{\{token\.([a-z0-9._-]+)\}\}/gi;

export function buildTokenUsageIndex(sources: readonly unknown[], tokens: readonly DesignToken[]) {
  const direct = new Map<string, number>();
  let unknown = false;
  for (const src of sources) {
    let text: string;
    try {
      text = JSON.stringify(src) ?? "";
    } catch {
      unknown = true;
      continue;
    }
    for (const re of [VAR_RE, TPL_RE]) {
      for (const m of text.matchAll(re)) {
        const id = m[1].toLowerCase();
        direct.set(id, (direct.get(id) ?? 0) + 1);
      }
    }
  }
  const aliasedBy = new Map<string, string[]>();
  for (const t of tokens) {
    for (const ref of [t.modes.light, t.modes.dark]) {
      if (ref && "alias" in ref) aliasedBy.set(ref.alias, [...(aliasedBy.get(ref.alias) ?? []), t.id]);
    }
  }
  const total = (id: string, seen = new Set<string>()): number => {
    if (seen.has(id)) return 0;
    seen.add(id);
    return (direct.get(id) ?? 0) + (aliasedBy.get(id) ?? []).reduce((n, child) => n + total(child, seen), 0);
  };
  return { direct, total: (id: string) => total(id), unknown };
}
```

Add `export { buildTokenUsageIndex } from "./usage";` to `index.ts`.

- [ ] **Step 4: Run tests**

Run: `npx vitest run packages/shared/tokens`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/shared/tokens
git commit -m "feat(shared): one-pass token usage index with alias totals and unknown state"
```

---

### Task 6: Editor adopts v6 — types, seed and the migration chain

**Files:**
- Modify: `packages/editor/src/engine/designSystem/types.ts` — replace the `DesignToken` interface with
  `export type { DesignToken, TokenRef, TokenLayer, DarkMode } from "@buildrik/shared/schemas/design-tokens";`
  and keep the old interface renamed `LegacyDesignToken` (used only by migrations and fixtures).
- Modify: `packages/editor/src/engine/designSystem/defaultTokens.ts` — rename the current array to
  `DEFAULT_TOKENS_V5: LegacyDesignToken[]` and add
  `export const DEFAULT_TOKENS: DesignToken[] = migrateTokensToV6(DEFAULT_TOKENS_V5);`
  (pure, deterministic; module-level computation without I/O is allowed).
- Modify: `packages/editor/src/editor/design-system/migrations/index.ts` — `CURRENT_SCHEMA_VERSION = 6`; register
  `MIGRATIONS[6] = (tokens) => migrateTokensToV6(tokens)`.
- Modify: `packages/editor/src/editor/design-system/state/projectTokens.ts` — merge by id on v6: a saved token
  replaces its seed wholesale (modes included); added tokens follow; migrate first when `storedVersion < 6`.
- Test: `packages/editor/src/editor/design-system/state/__tests__/projectTokens.v6.test.ts`

**Interfaces:**
- Consumes: `migrateTokensToV6`, `DesignToken` from `@buildrik/shared`.
- Produces: `mergeProjectTokens(incoming: readonly unknown[], storedVersion?: number): DesignToken[]` (v6 out).

- [ ] **Step 1: Write the failing test**

```ts
// packages/editor/src/editor/design-system/state/__tests__/projectTokens.v6.test.ts
import { describe, it, expect } from "vitest";
import { mergeProjectTokens } from "../projectTokens";
import { DEFAULT_TOKENS_V5 } from "@/engine/designSystem/defaultTokens";
import { resolveTokenLiteral } from "@buildrik/shared/tokens";

describe("mergeProjectTokens on v6", () => {
  it("migrates a v5 save and keeps the saved primary colour", () => {
    const saved = DEFAULT_TOKENS_V5.map((t) => (t.id === "color-primary" ? { ...t, value: "#C2410C" } : t));
    const merged = mergeProjectTokens(saved, 5);
    expect(resolveTokenLiteral(merged, "color-primary", "light")).toBe("#C2410C");
  });

  it("keeps a token the site added", () => {
    const added = { ...DEFAULT_TOKENS_V5[0], id: "my-brand", name: "Mine", cssVar: "--buildrick-design-my-brand", value: "#123456" };
    expect(mergeProjectTokens([...DEFAULT_TOKENS_V5, added], 5).some((t) => t.id === "my-brand")).toBe(true);
  });

  it("passes v6 input through unchanged", () => {
    const v6 = mergeProjectTokens(DEFAULT_TOKENS_V5, 5);
    expect(mergeProjectTokens(v6, 6)).toEqual(v6);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run (in `packages/editor`): `npx vitest run src/editor/design-system/state/__tests__/projectTokens.v6.test.ts`
Expected: FAIL — `DEFAULT_TOKENS_V5` not exported.

- [ ] **Step 3: Implement the three file changes above.** `projectTokens.ts` becomes:

```ts
import type { DesignToken } from "@/engine/designSystem/types";
import { DEFAULT_TOKENS } from "@/engine/designSystem/defaultTokens";
import { migrateDesignTokens, CURRENT_SCHEMA_VERSION } from "../migrations";

/** The site's saved tokens over the seed (v6). A saved token replaces its seed
 *  wholesale, modes included; tokens the site added follow the seed. */
export function mergeProjectTokens(incoming: readonly unknown[], storedVersion = CURRENT_SCHEMA_VERSION): DesignToken[] {
  const saved: DesignToken[] =
    storedVersion < CURRENT_SCHEMA_VERSION
      ? migrateDesignTokens(incoming, storedVersion, CURRENT_SCHEMA_VERSION)
      : (incoming as DesignToken[]);
  const savedById = new Map(saved.map((t) => [t.id, t]));
  const seeded = DEFAULT_TOKENS.map((def) => savedById.get(def.id) ?? def);
  const added = saved.filter((t) => !DEFAULT_TOKENS.some((def) => def.id === t.id));
  return [...seeded, ...added];
}
```

(`migrateDesignTokens` keeps its loop; its v1–v5 steps operate on legacy rows and the v6 step returns v6. Change its
signature to `(tokens: readonly unknown[], from, to)`.)

- [ ] **Step 4: Run test + type-check (expect many errors — they are Task 7's checklist)**

Run: `npx vitest run src/editor/design-system/state/__tests__/projectTokens.v6.test.ts`
Expected: PASS.
Run: `npx tsc --noEmit > /tmp/tsc-6.log 2>&1; echo $?; grep -c "error TS" /tmp/tsc-6.log`
Expected: non-zero; save `/tmp/tsc-6.log` — every error is a v5 field reader Task 7 fixes.

- [ ] **Step 5: Commit (on the feature branch; main is not merged until Task 7 is green)**

```bash
git add packages/editor/src/engine/designSystem/types.ts packages/editor/src/engine/designSystem/defaultTokens.ts packages/editor/src/editor/design-system/migrations/index.ts packages/editor/src/editor/design-system/state/projectTokens.ts packages/editor/src/editor/design-system/state/__tests__/projectTokens.v6.test.ts
git commit -m "feat(editor): adopt v6 tokens — types, seed, migration chain (readers next)"
```

---

### Task 7: Migrate every v5 field reader

**Files:** every file `tsc` lists in `/tmp/tsc-6.log` (expected: ~28 `darkValue`, ~12 `aliasOf`, ~34 `.value`
readers under `packages/editor/src`), plus `engine/darkResolver/DarkResolver.ts` and `engine/Composer.ts`
(`applyAutoFix`, `setDesignToken`).

**Interfaces:**
- Consumes: `resolveTokenLiteral` (`@buildrik/shared/tokens`), `DesignToken` v6.
- Produces: `DarkResolver.resolve(token, tokens, mode)` — now takes the token list.

Mechanical rules (apply exactly, file by file):

| v5 read | v6 replacement |
|---------|----------------|
| `token.value` (display/compare) | `resolveTokenLiteral(tokens, token.id, "light") ?? ""` |
| `token.darkValue` | `token.modes.dark ? resolveTokenLiteral(tokens, token.id, "dark") : undefined` |
| `token.aliasOf` | `"alias" in token.modes.light ? token.modes.light.alias : undefined` |
| `token.typedValue` | delete the read; derive from the resolved literal where needed |
| write `{ ...t, value: v }` | `{ ...t, modes: { ...t.modes, light: { value: v } } }` on **primitives**; for a semantic token write to the primitive it aliases (`setTokenLiteral` below) |

Add this helper to `packages/shared/tokens/resolve.ts` (with its test) and use it for every write:

```ts
/** Writes a literal for a token in a mode. A semantic token aliasing a
 *  primitive writes through to that primitive only if no other token aliases
 *  it; otherwise it gets its own literal so siblings do not change. */
export function setTokenLiteral(
  tokens: readonly DesignToken[], id: string, mode: "light" | "dark", value: string,
): DesignToken[] {
  const t = tokens.find((x) => x.id === id);
  if (!t) return [...tokens];
  if (t.layer === "primitive") {
    return tokens.map((x) => (x.id === id ? { ...x, modes: { light: { value } } } : x));
  }
  return tokens.map((x) => (x.id === id ? { ...x, modes: { ...x.modes, [mode]: { value } } } : x));
}
```

```ts
// add to packages/shared/tokens/__tests__/resolve.test.ts
import { describe, it, expect } from "vitest";
import { setTokenLiteral, resolveTokenLiteral } from "../resolve";
import type { DesignToken } from "../../schemas/design-tokens";
const p: DesignToken = { id: "b", name: "b", kind: "color", layer: "primitive", modes: { light: { value: "#000" } }, category: "colors", cssVar: "--buildrick-design-b", type: "color" };
const s1: DesignToken = { ...p, id: "s1", layer: "semantic", cssVar: "--buildrick-design-s1", modes: { light: { alias: "b" } } };
const s2: DesignToken = { ...s1, id: "s2", cssVar: "--buildrick-design-s2" };
describe("setTokenLiteral", () => {
  it("changing one semantic token does not repaint its alias siblings", () => {
    const out = setTokenLiteral([p, s1, s2], "s1", "light", "#FFF");
    expect(resolveTokenLiteral(out, "s1", "light")).toBe("#FFF");
    expect(resolveTokenLiteral(out, "s2", "light")).toBe("#000");
  });
  it("writes a primitive's single literal", () => {
    expect(resolveTokenLiteral(setTokenLiteral([p], "b", "light", "#123"), "b", "light")).toBe("#123");
  });
});
```

`DarkResolver.resolve` becomes:

```ts
resolve(token: DesignToken, tokens: readonly DesignToken[], resolved: "light" | "dark"): string {
  return resolveTokenLiteral(tokens, token.id, resolved) ?? "";
}
```

- [ ] **Step 1: Add `setTokenLiteral` + its test; run** `npx vitest run packages/shared/tokens` (root) → PASS.
- [ ] **Step 2: Fix the files in `/tmp/tsc-6.log` in directory order** (`engine/` first, then `editor/design-system/state`, then `editor/design-system/ui`, then `editor/inspector`). After each directory: `npx tsc --noEmit > /tmp/tsc-7.log 2>&1; echo $?` and confirm the error count only goes down.
- [ ] **Step 3: Update tests that build v5 tokens by hand** to use `mergeProjectTokens(DEFAULT_TOKENS_V5, 5)` or v6 literals. Never weaken an assertion; if a test asserted a v5 field, assert the resolved literal instead.
- [ ] **Step 4: Gates**

Run: `npx tsc --noEmit > /tmp/tsc-7.log 2>&1; echo $?` → `0`.
Run: `npx vitest run src/engine src/editor/design-system src/editor/inspector` → all PASS (rerun known-flaky files alone before calling a failure real).

- [ ] **Step 5: Commit**

```bash
git add packages/editor/src packages/shared/tokens
git commit -m "refactor(editor): read tokens through resolveTokenLiteral/modes (v6)"
```

---

### Task 8: Canvas emitter — one coalesced `<style>`, `data-theme` always set

Spec §2, eng P1 (rAF), D9(c) (reuse `composer.colorMode`), D8 (Off disables dark preview).

**Files:**
- Rewrite: `packages/editor/src/editor/design-system/ui/ProjectTokensApplier.tsx`
- Test: `packages/editor/src/editor/design-system/ui/__tests__/ProjectTokensApplier.v6.test.tsx`

**Interfaces:**
- Consumes: `emitTokenCss`, `mergeProjectTokens`, `composer.colorMode.resolved()`, `EVENTS.PROJECT_LOADED`,
  `EVENTS.SETTINGS_CHANGE`, `"colorMode:changed"`.
- Produces: a single `<style id="bk-site-tokens">` in `document.head`; `document.documentElement.dataset.theme`
  always `"light"` or `"dark"`.

- [ ] **Step 1: Write the failing tests**

```tsx
// packages/editor/src/editor/design-system/ui/__tests__/ProjectTokensApplier.v6.test.tsx
// @vitest-environment jsdom
import * as React from "react";
import { render, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProjectTokensApplier } from "../ProjectTokensApplier";
import { DEFAULT_TOKENS } from "@/engine/designSystem/defaultTokens";

function fakeComposer(settings: Record<string, unknown>, mode: "light" | "dark" = "light") {
  const handlers = new Map<string, Set<() => void>>();
  return {
    getProjectSettings: () => settings,
    colorMode: { resolved: () => mode },
    on: (e: string, h: () => void) => { if (!handlers.has(e)) handlers.set(e, new Set()); handlers.get(e)!.add(h); },
    off: (e: string, h: () => void) => handlers.get(e)?.delete(h),
    emit: (e: string) => handlers.get(e)?.forEach((h) => h()),
  };
}

describe("ProjectTokensApplier (v6)", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
    delete document.documentElement.dataset.theme;
    vi.useFakeTimers({ toFake: ["requestAnimationFrame"] });
  });

  it("writes one style element and always sets data-theme", () => {
    const c = fakeComposer({ designTokens: DEFAULT_TOKENS, designTokensSchemaVersion: 6, darkMode: "auto" });
    render(<ProjectTokensApplier composer={c as never} />);
    act(() => { vi.advanceTimersToNextFrame(); });
    expect(document.querySelectorAll("#bk-site-tokens")).toHaveLength(1);
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("coalesces 50 rapid changes into one write per frame with the last value", () => {
    const settings: Record<string, unknown> = { designTokens: DEFAULT_TOKENS, designTokensSchemaVersion: 6, darkMode: "off" };
    const c = fakeComposer(settings);
    render(<ProjectTokensApplier composer={c as never} />);
    act(() => { vi.advanceTimersToNextFrame(); });
    const style = document.getElementById("bk-site-tokens")!;
    const writes = vi.fn();
    new MutationObserver(writes).observe(style, { childList: true, characterData: true, subtree: true });
    for (let i = 0; i < 50; i++) {
      settings.designTokens = DEFAULT_TOKENS.map((t) =>
        t.id === "color-brand-500" ? { ...t, modes: { light: { value: `#00000${i % 10}` } } } : t);
      c.emit("settings:change");
    }
    act(() => { vi.advanceTimersToNextFrame(); });
    return Promise.resolve().then(() => {
      expect(writes).toHaveBeenCalledTimes(1);
      expect(style.textContent).toContain("#000009");
    });
  });

  it("forces light preview when the site's Dark mode is off", () => {
    const c = fakeComposer({ designTokens: DEFAULT_TOKENS, designTokensSchemaVersion: 6, darkMode: "off" }, "dark");
    render(<ProjectTokensApplier composer={c as never} />);
    act(() => { vi.advanceTimersToNextFrame(); });
    expect(document.documentElement.dataset.theme).toBe("light");
  });
});
```

Use the real event names from `@/shared/constants/events` (`EVENTS.SETTINGS_CHANGE`, `EVENTS.PROJECT_LOADED`)
instead of the string literal if they differ.

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/editor/design-system/ui/__tests__/ProjectTokensApplier.v6.test.tsx`
Expected: FAIL (no `#bk-site-tokens`).

- [ ] **Step 3: Implement**

```tsx
// packages/editor/src/editor/design-system/ui/ProjectTokensApplier.tsx
/**
 * Headless. Writes the SITE's token CSS — the same string export and publish
 * write (`emitTokenCss`) — into one <style>, at most once per animation frame,
 * and keeps `data-theme` on <html> explicit so the emitted
 * `prefers-color-scheme` block never follows the designer's OS (spec §2).
 * A site whose Dark mode is "off" always previews light (D8).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine";
import { EVENTS } from "@/shared/constants/events";
import { emitTokenCss } from "@buildrik/shared/tokens";
import { DarkModeSchema } from "@buildrik/shared/schemas/design-tokens";
import { mergeProjectTokens } from "../state/projectTokens";

const STYLE_ID = "bk-site-tokens";

export interface ProjectTokensApplierProps {
  composer?: Composer | null;
}

export const ProjectTokensApplier: React.FC<ProjectTokensApplierProps> = ({ composer }) => {
  React.useEffect(() => {
    if (!composer) return;
    let frame = 0;

    const write = () => {
      frame = 0;
      const settings = composer.getProjectSettings?.();
      const darkMode = DarkModeSchema.catch("off").parse(settings?.darkMode);
      const tokens = mergeProjectTokens(settings?.designTokens ?? [], settings?.designTokensSchemaVersion);
      let style = document.getElementById(STYLE_ID);
      if (!style) {
        style = document.createElement("style");
        style.id = STYLE_ID;
        document.head.appendChild(style);
      }
      style.textContent = emitTokenCss(tokens, { darkMode });
      const wanted = darkMode === "off" ? "light" : composer.colorMode?.resolved?.() ?? "light";
      document.documentElement.dataset.theme = wanted;
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(write);
    };

    write();
    composer.on(EVENTS.PROJECT_LOADED, schedule);
    composer.on(EVENTS.SETTINGS_CHANGE, schedule);
    composer.on("colorMode:changed", schedule);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      composer.off(EVENTS.PROJECT_LOADED, schedule);
      composer.off(EVENTS.SETTINGS_CHANGE, schedule);
      composer.off("colorMode:changed", schedule);
    };
  }, [composer]);

  return null;
};
```

Remove the per-var `setProperty` writer in `useTokensForKind.applyToRoot` (Task 10 rewrites that file) so there is
one writer. `document.head.appendChild` is not `document.body.appendChild`; if Gate 22 flags it, add this file to
`scripts/gates/overlay-allowlist.txt` with the reason "token stylesheet, not an overlay".

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/editor/design-system/ui/__tests__/ProjectTokensApplier.v6.test.tsx` → PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/editor/src/editor/design-system/ui/ProjectTokensApplier.tsx packages/editor/src/editor/design-system/ui/__tests__/ProjectTokensApplier.v6.test.tsx
git commit -m "feat(editor): canvas token CSS via emitTokenCss, rAF-coalesced, explicit data-theme"
```

---

### Task 9: Export and publish use `emitTokenCss`; migration-failure load path

**Files:**
- Modify: `packages/editor/src/engine/export/ExportEngine.ts` (:362 single file, :815 multi-page/publish, `siteFontsFromTokens`)
- Modify: `packages/editor/src/engine/Composer.ts:750`, `packages/editor/src/editor/design-system/ui/BrandLivePreview.tsx:68`,
  `packages/editor/src/engine/designSystem/bundler/CSSBundler.ts:70-85` (dark path → `emitTokenCss(tokens, { darkMode: "auto" })`)
- Modify: `packages/editor/src/engine/export/ExportHelpers.ts` — delete `siteTokensCSS`
- Modify: `packages/editor/src/editor/shell/hooks/useComposerInit.ts` — catch `TokenMigrationError` on load
- Test: `packages/editor/src/engine/export/__tests__/exportTokens.v6.test.ts`, `packages/editor/src/editor/shell/hooks/__tests__/useComposerInit.migrationFailure.test.ts`

**Interfaces:**
- Consumes: `emitTokenCss`, `mergeProjectTokens`, `captureError` (`@/shared/utils/errorTracking`), `TokenMigrationError`.
- Produces: composer flag `composer.designSystem.readOnly: boolean` + event `"designSystem:readOnly"` with `{ reason }`.

- [ ] **Step 1: Write the failing tests**

```ts
// packages/editor/src/engine/export/__tests__/exportTokens.v6.test.ts
import { describe, it, expect } from "vitest";
import { emitTokenCss } from "@buildrik/shared/tokens";
import { mergeProjectTokens } from "@/editor/design-system/state/projectTokens";
import { DEFAULT_TOKENS_V5 } from "@/engine/designSystem/defaultTokens";
import { buildSingleFileExport } from "../ExportEngine"; // use the existing exported entry the BRD-23 test uses

describe("export token CSS (v6)", () => {
  it("writes exactly the canvas string for a migrated v5 site with Dark mode off", () => {
    const settings = { designTokens: DEFAULT_TOKENS_V5, designTokensSchemaVersion: 5, darkMode: "off" as const };
    const html = buildSingleFileExport({ settings });
    const canvas = emitTokenCss(mergeProjectTokens(settings.designTokens, 5), { darkMode: "off" });
    expect(html).toContain(canvas.trim());
    expect(html).not.toContain("prefers-color-scheme");
  });
});
```

Replace `buildSingleFileExport({ settings })` with the exact entry and arguments used by the existing BRD-23 closure
test (`git grep -n "siteTokensCSS\|BRD-23" packages/editor/src/engine/export/__tests__`), keeping that test and
extending it — do not delete it.

```ts
// packages/editor/src/editor/shell/hooks/__tests__/useComposerInit.migrationFailure.test.ts
import { describe, it, expect, vi } from "vitest";
import { loadTokensSafely } from "../useComposerInit";

vi.mock("@/shared/utils/errorTracking", () => ({ captureError: vi.fn() }));
import { captureError } from "@/shared/utils/errorTracking";

describe("loadTokensSafely", () => {
  it("keeps the old tokens, marks Brand read-only and reports when migration throws", () => {
    const settings = { designTokens: [null], designTokensSchemaVersion: 5 };
    const r = loadTokensSafely(settings, "site-1");
    expect(r.readOnly).toBe(true);
    expect(r.settings).toBe(settings);
    expect(captureError).toHaveBeenCalledWith(expect.any(Error), expect.objectContaining({ siteId: "site-1", fromVersion: 5 }));
  });

  it("migrates a valid v5 site", () => {
    const r = loadTokensSafely({ designTokens: [], designTokensSchemaVersion: 5 }, "site-1");
    expect(r.readOnly).toBe(false);
    expect(r.settings.designTokensSchemaVersion).toBe(6);
  });
});
```

- [ ] **Step 2: Run to verify failure** — both files FAIL (missing export / `loadTokensSafely` undefined).

- [ ] **Step 3: Implement**

In `useComposerInit.ts`, add and use (before `importMigratedProject`):

```ts
import { migrateTokensToV6, TokenMigrationError } from "@buildrik/shared/tokens";
import { TOKENS_SCHEMA_VERSION } from "@buildrik/shared/schemas/design-tokens";
import { captureError } from "@/shared/utils/errorTracking";

/** Spec §10 (D17): a site whose tokens cannot be migrated still opens — old
 *  tokens, Brand read-only, a Sentry event. Never a half-migrated save. */
export function loadTokensSafely<S extends { designTokens?: unknown; designTokensSchemaVersion?: number; darkMode?: unknown }>(
  settings: S,
  siteId: string,
): { settings: S; readOnly: boolean } {
  const from = settings.designTokensSchemaVersion ?? 1;
  if (from >= TOKENS_SCHEMA_VERSION) return { settings, readOnly: false };
  try {
    const designTokens = migrateTokensToV6(settings.designTokens ?? []);
    return {
      settings: { ...settings, designTokens, designTokensSchemaVersion: TOKENS_SCHEMA_VERSION, darkMode: settings.darkMode ?? "off" },
      readOnly: false,
    };
  } catch (err) {
    if (!(err instanceof TokenMigrationError)) throw err;
    captureError(err, { siteId, fromVersion: from, reason: err.reason });
    return { settings, readOnly: true };
  }
}
```

Note: v1–v4 sites reach v5 through the existing `migrateDesignTokens` steps first; call
`migrateDesignTokens(tokens, from, 5)` before `migrateTokensToV6` when `from < 5`.

Wire it where `useComposerInit.ts:198` imports the project: pass the migrated settings into `importMigratedProject`
and, when `readOnly`, set `composer.designSystem.readOnly = true` and emit `"designSystem:readOnly"`. Migration is
applied **before** history starts recording (it is part of the imported project), so ⌘Z after load cannot revert it
(spec §4, round 2).

Replace every `siteTokensCSS(tokens)` call with
`emitTokenCss(mergeProjectTokens(settings.designTokens ?? [], settings.designTokensSchemaVersion), { darkMode: DarkModeSchema.catch("off").parse(settings.darkMode), onSkip: (id, reason) => console.warn(\`[tokens] skipped ${id}: ${reason}\`) })`.
`siteFontsFromTokens` reads `resolveTokenLiteral(tokens, id, "light")` for the font tokens. Delete `siteTokensCSS`.

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/engine/export src/editor/shell/hooks src/engine/designSystem/bundler` → PASS.
Run: `npx tsc --noEmit > /tmp/tsc-9.log 2>&1; echo $?` → `0`.

- [ ] **Step 5: Commit**

```bash
git add packages/editor/src
git commit -m "feat(editor): export/publish write emitTokenCss; unmigratable sites open read-only"
```

---

### Task 10: One undo stack — remove Brand staging and per-kind undo

Spec §4, D9(a). Every multi-token write is one `begin/endTransaction`.

**Files:**
- Modify: `packages/editor/src/engine/Composer.ts` — add `designSystem.setTokens(next: DesignToken[], label: string)`
- Rewrite: `packages/editor/src/editor/design-system/state/useTokensForKind.ts`
- Delete: `packages/editor/src/editor/design-system/ui/useBrandDraft.ts`, `.../ui/modals/ReviewModal.tsx` and their tests
- Modify: `packages/editor/src/editor/design-system/ui/BrandWorkspace.tsx` (remove `useBrandDraft` :339, Save/Apply :515-540, `ReviewModal` :1271; add read-only notice)
- Modify: `useUpdateColorEverywhere.ts` (`git grep -l useUpdateColorEverywhere packages/editor/src`)
- Test: `packages/editor/src/editor/design-system/state/__tests__/useTokensForKind.v6.test.tsx`, `packages/editor/src/engine/__tests__/Composer.setTokens.test.ts`

**Interfaces:**
- Consumes: `setTokenLiteral`, `validateTokens`.
- Produces:
  - `composer.designSystem.setTokens(next: DesignToken[], label: string): boolean` — validates, writes `projectSettings.designTokens` + `designTokensSchemaVersion: 6` inside one transaction; returns false (no write) when `readOnly` or invalid.
  - `useTokensForKind(kind): { tokens: DesignToken[]; updateToken(id, value, mode?): void; addToken(t): void; deleteToken(id, opts?): void; renameToken(oldId, newId): void; filterTokens(q): DesignToken[] }` — no `undoToken/redoToken/canUndo/canRedo/markSaved/discardAll/resetFromSaved/hydrateFromExternal/pendingDiff/isDirty/savedTokens`.

- [ ] **Step 1: Write the failing tests**

```ts
// packages/editor/src/engine/__tests__/Composer.setTokens.test.ts
import { describe, it, expect } from "vitest";
import { Composer } from "@/engine";
import { DEFAULT_TOKENS } from "@/engine/designSystem/defaultTokens";
import { setTokenLiteral, resolveTokenLiteral } from "@buildrik/shared/tokens";

describe("composer.designSystem.setTokens", () => {
  it("is one undo step for a multi-token write, shared with canvas history", () => {
    const c = new Composer({});
    c.setProjectSettings({ ...c.getProjectSettings(), designTokens: DEFAULT_TOKENS, designTokensSchemaVersion: 6 });
    c.history.checkpoint?.();
    let next = setTokenLiteral(DEFAULT_TOKENS, "color-primary", "light", "#C2410C");
    next = setTokenLiteral(next, "color-secondary", "light", "#111111");
    expect(c.designSystem.setTokens(next, "Brand edit")).toBe(true);
    c.history.undo();
    const after = c.getProjectSettings().designTokens!;
    expect(resolveTokenLiteral(after, "color-primary", "light")).toBe(resolveTokenLiteral(DEFAULT_TOKENS, "color-primary", "light"));
    expect(resolveTokenLiteral(after, "color-secondary", "light")).toBe(resolveTokenLiteral(DEFAULT_TOKENS, "color-secondary", "light"));
  });

  it("refuses an invalid token set and writes nothing", () => {
    const c = new Composer({});
    const before = c.getProjectSettings().designTokens;
    const bad = [{ ...DEFAULT_TOKENS[0], modes: { light: { alias: "missing" } } }];
    expect(c.designSystem.setTokens(bad, "x")).toBe(false);
    expect(c.getProjectSettings().designTokens).toBe(before);
  });

  it("refuses writes while read-only", () => {
    const c = new Composer({});
    c.designSystem.readOnly = true;
    expect(c.designSystem.setTokens(DEFAULT_TOKENS, "x")).toBe(false);
  });
});
```

Construct `Composer` the way existing engine tests do (`git grep -n "new Composer(" packages/editor/src/engine/__tests__ | head -3`) and copy that setup.

```tsx
// packages/editor/src/editor/design-system/state/__tests__/useTokensForKind.v6.test.tsx
// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useTokensForKind } from "../useTokensForKind";
import { DEFAULT_TOKENS } from "@/engine/designSystem/defaultTokens";

describe("useTokensForKind (v6, composer-backed)", () => {
  it("writes through composer.designSystem.setTokens and keeps no local undo", () => {
    const setTokens = vi.fn(() => true);
    const composer = {
      getProjectSettings: () => ({ designTokens: DEFAULT_TOKENS, designTokensSchemaVersion: 6 }),
      designSystem: { setTokens, readOnly: false },
      on: vi.fn(), off: vi.fn(),
    };
    const { result } = renderHook(() => useTokensForKind("color", composer as never));
    act(() => result.current.updateToken("color-primary", "#C2410C"));
    expect(setTokens).toHaveBeenCalledTimes(1);
    expect(result.current).not.toHaveProperty("undoToken");
    expect(result.current).not.toHaveProperty("markSaved");
  });
});
```

- [ ] **Step 2: Run to verify failure** — both FAIL.

- [ ] **Step 3: Implement**

`Composer.ts` (inside the `designSystem` object, next to `setDesignToken`):

```ts
readOnly: false,
setTokens: (next: DesignToken[], label: string): boolean => {
  if (this.designSystem.readOnly) return false;
  const checked = validateTokens(next);
  if (!checked.ok) {
    console.warn(`[tokens] refused "${label}": ${checked.reason}`);
    return false;
  }
  this.beginTransaction(label);
  try {
    this.setProjectSettings({
      ...this.getProjectSettings(),
      designTokens: checked.tokens,
      designTokensSchemaVersion: TOKENS_SCHEMA_VERSION,
    });
  } finally {
    this.endTransaction();
  }
  return true;
},
```

Rewrite `setDesignToken` and `applyAutoFix` to compute `setTokenLiteral(...)` and call `setTokens` (keep the AI value guard).

`useTokensForKind.ts`:

```ts
import * as React from "react";
import type { Composer } from "@/engine";
import type { DesignToken, TokenKind } from "@/engine/designSystem/types";
import { setTokenLiteral } from "@buildrik/shared/tokens";
import { EVENTS } from "@/shared/constants/events";
import { mergeProjectTokens } from "./projectTokens";

/** A kind's tokens as the project holds them. Every edit is one composer
 *  transaction, so Brand and the canvas share one undo stack (spec §4). */
export function useTokensForKind(kind: TokenKind, composer: Composer | null) {
  const read = React.useCallback(() => {
    const s = composer?.getProjectSettings();
    return mergeProjectTokens(s?.designTokens ?? [], s?.designTokensSchemaVersion);
  }, [composer]);
  const [all, setAll] = React.useState<DesignToken[]>(read);
  React.useEffect(() => {
    if (!composer) return;
    const sync = () => setAll(read());
    composer.on(EVENTS.SETTINGS_CHANGE, sync);
    composer.on(EVENTS.PROJECT_LOADED, sync);
    return () => {
      composer.off(EVENTS.SETTINGS_CHANGE, sync);
      composer.off(EVENTS.PROJECT_LOADED, sync);
    };
  }, [composer, read]);

  const commit = React.useCallback(
    (next: DesignToken[], label: string) => composer?.designSystem.setTokens(next, label) ?? false,
    [composer],
  );
  const tokens = React.useMemo(() => all.filter((t) => t.kind === kind), [all, kind]);

  return {
    tokens,
    updateToken: (id: string, value: string, mode: "light" | "dark" = "light") =>
      commit(setTokenLiteral(all, id, mode, value), "Edit token"),
    addToken: (t: DesignToken) => commit([...all, t], "Add token"),
    deleteToken: (id: string, opts?: { replaceWith?: string }) =>
      commit(
        opts?.replaceWith
          ? all.map((t) => (t.id === id ? { ...t, replacedBy: opts.replaceWith } : t))
          : all.filter((t) => t.id !== id),
        "Delete token",
      ),
    renameToken: (oldId: string, newId: string) => {
      const old = all.find((t) => t.id === oldId);
      if (!old || all.some((t) => t.id === newId)) return false;
      const renamed: DesignToken = { ...old, id: newId, cssVar: `--buildrick-design-${newId}`, legacyNames: [...(old.legacyNames ?? []), old.cssVar] };
      return commit([...all.filter((t) => t.id !== oldId), renamed], "Rename token");
    },
    filterTokens: (q: string) => {
      const s = q.trim().toLowerCase();
      return s ? tokens.filter((t) => t.name.toLowerCase().includes(s) || t.id.includes(s)) : tokens;
    },
  };
}
```

(Rename keeps the old var working through `legacyNames` — no element breaks. The 1b delete guard will refuse
in-use deletes; until then `deleteToken` keeps today's behaviour.)

`BrandWorkspace.tsx`: delete the `useBrandDraft` hook call and its import, the Save button, the Apply handler
(:515-540) and the `ReviewModal` render/import; pass `composer` into each `useTokensForKind(kind, composer)`; remove
`persistAll`/`markSaved` calls; when `composer.designSystem.readOnly`, render one `Banner` (from `@/editor/chrome-ui`)
above the content: "We couldn't upgrade this site's brand — nothing was changed. Editing is paused." and disable
inputs. `useUpdateColorEverywhere.ts:42` → `composer.designSystem.setTokens(setTokenLiteral(tokens, id, "light", value), "Update everywhere")`.

Delete `useBrandDraft.ts`, `ReviewModal.tsx` and their `__tests__` files; fix remaining BrandWorkspace tests that
asserted Save/Apply to assert the immediate write instead (`setTokens` called, canvas `#bk-site-tokens` updated).

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/engine/__tests__/Composer.setTokens.test.ts src/editor/design-system` → PASS (rerun BrandWorkspace.pages alone if it flakes).
Run: `npx tsc --noEmit > /tmp/tsc-10.log 2>&1; echo $?` → `0`.

- [ ] **Step 5: Commit**

```bash
git add -A packages/editor/src
git commit -m "feat(brand): autosave + one undo stack — staging layer and per-kind undo removed"
```

---

### Task 11: Prisma columns + server save path (schema, version rule, required CAS, snapshot in txn)

Spec §1, §4, §8 (D10 reopened), eng E4.

**Files:**
- Modify: `prisma/schema.prisma` — `SiteThemeSnapshot`: `reason String @default("theme-push")`, `tokensSchemaVersion Int @default(5)`, `darkMode String?`; `Site`: `tokensMigrationHold Boolean @default(false)`
- Create: `prisma/migrations/<timestamp>_brand_tokens_v6/migration.sql` (`pnpm prisma migrate dev --create-only --name brand_tokens_v6`; **do not apply** — the owner does)
- Create: `server/services/brand-tokens.ts`
- Modify: `server/services/sites.service.ts` (`saveProjectData`, `duplicateSite` :509, `getProjectData` :1106)
- Modify: `server/trpc/routers/sites.ts` (translate `TokenSaveError`)
- Test: `__tests__/sites-save-tokens-v6.test.ts`, `__tests__/db/save-project-migration-snapshot.db.test.ts`

**Interfaces:**
- Produces (`server/services/brand-tokens.ts`):
  - `class TokenSaveError extends Error { code: "TOKENS_INVALID" | "TOKENS_STALE_CLIENT" | "TOKENS_NEED_CAS" }`
  - `isBrandTokensV2Enabled(): boolean` — reads `process.env.BRAND_TOKENS_V2 === "on"` at call time (no module-level read)
  - `checkTokenPayload(payload: unknown, stored: unknown): { kind: "no-tokens" } | { kind: "same-version"; tokens } | { kind: "first-migrated"; tokens; storedTokens: unknown; storedVersion: number }`
- `getProjectData` additionally returns `brandTokensV2: boolean`, `tokensMigrationHold: boolean`.

- [ ] **Step 1: Write the failing unit tests**

```ts
// __tests__/sites-save-tokens-v6.test.ts
import { describe, it, expect } from "vitest";
import { checkTokenPayload, TokenSaveError } from "@/server/services/brand-tokens";
import { migrateTokensToV6 } from "@buildrik/shared/tokens";
import v5seed from "@/packages/shared/tokens/__tests__/__fixtures__/seed-only.json";

const v6 = migrateTokensToV6(v5seed);

describe("checkTokenPayload", () => {
  it("passes saves without tokens", () => {
    expect(checkTokenPayload({ seo: {} }, {})).toEqual({ kind: "no-tokens" });
  });
  it("refuses an invalid v6 payload with TOKENS_INVALID", () => {
    const bad = { designTokens: [{ ...v6[0], modes: { light: { alias: "missing" } } }], designTokensSchemaVersion: 6 };
    expect(() => checkTokenPayload(bad, {})).toThrow(expect.objectContaining({ code: "TOKENS_INVALID" }));
  });
  it("refuses an old payload over a newer store (stale tab)", () => {
    expect(() => checkTokenPayload({ designTokens: v5seed, designTokensSchemaVersion: 5 }, { designTokensSchemaVersion: 6 }))
      .toThrow(expect.objectContaining({ code: "TOKENS_STALE_CLIENT" }));
  });
  it("marks the first migrated save", () => {
    const r = checkTokenPayload({ designTokens: v6, designTokensSchemaVersion: 6 }, { designTokens: v5seed, designTokensSchemaVersion: 5 });
    expect(r.kind).toBe("first-migrated");
  });
  it("migrates an old payload over an old store server-side", () => {
    const r = checkTokenPayload({ designTokens: v5seed, designTokensSchemaVersion: 5 }, { designTokensSchemaVersion: 5 });
    expect(r.kind).toBe("first-migrated");
  });
});
```

Adjust the fixture import to the root alias the repo uses for package files (`git grep -n "packages/shared" vitest.config.ts`).

```ts
// __tests__/db/save-project-migration-snapshot.db.test.ts
import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/prisma";
import { saveProjectData } from "@/server/services/sites.service";
import { migrateTokensToV6 } from "@buildrik/shared/tokens";
import { createTestSite } from "./helpers";
import v5seed from "../../packages/shared/tokens/__tests__/__fixtures__/seed-only.json";

async function v5Site() {
  const site = await createTestSite();
  await prisma.site.update({ where: { id: site.id }, data: { projectSettings: { designTokens: v5seed, designTokensSchemaVersion: 5 } } });
  return site;
}

describe("first migrated save", () => {
  it("writes one migration snapshot in the same transaction", async () => {
    const site = await v5Site();
    const { lastEditedAt } = await prisma.site.findUniqueOrThrow({ where: { id: site.id } });
    await saveProjectData({ siteId: site.id, pages: [], settings: { designTokens: migrateTokensToV6(v5seed), designTokensSchemaVersion: 6, darkMode: "off" } }, lastEditedAt.toISOString());
    const snaps = await prisma.siteThemeSnapshot.findMany({ where: { siteId: site.id, reason: "migration" } });
    expect(snaps).toHaveLength(1);
    expect(snaps[0].tokensSchemaVersion).toBe(5);
    expect(snaps[0].darkMode).toBeNull();
  });

  it("refuses without expectedLastEditedAt", async () => {
    const site = await v5Site();
    await expect(saveProjectData({ siteId: site.id, pages: [], settings: { designTokens: migrateTokensToV6(v5seed), designTokensSchemaVersion: 6 } }))
      .rejects.toMatchObject({ code: "TOKENS_NEED_CAS" });
  });

  it("two racing first saves: one wins, one conflicts, one snapshot", async () => {
    const site = await v5Site();
    const { lastEditedAt } = await prisma.site.findUniqueOrThrow({ where: { id: site.id } });
    const save = () => saveProjectData({ siteId: site.id, pages: [], settings: { designTokens: migrateTokensToV6(v5seed), designTokensSchemaVersion: 6 } }, lastEditedAt.toISOString());
    const results = await Promise.allSettled([save(), save()]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(await prisma.siteThemeSnapshot.count({ where: { siteId: site.id, reason: "migration" } })).toBe(1);
  });

  it("snapshot write does not change dsSchemaVersion", async () => {
    const site = await v5Site();
    const before = await prisma.site.findUniqueOrThrow({ where: { id: site.id } });
    await saveProjectData({ siteId: site.id, pages: [], settings: { designTokens: migrateTokensToV6(v5seed), designTokensSchemaVersion: 6 }, dsSchemaVersion: before.dsSchemaVersion }, before.lastEditedAt.toISOString());
    const after = await prisma.site.findUniqueOrThrow({ where: { id: site.id } });
    expect(after.dsSchemaVersion).toBe(before.dsSchemaVersion);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run __tests__/sites-save-tokens-v6.test.ts` → FAIL (module missing).
Run: `pnpm test:db __tests__/db/save-project-migration-snapshot.db.test.ts` → FAIL (columns missing; the test DB runs `prisma migrate deploy` in its own globalSetup against `buildrik_test` only).

- [ ] **Step 3: Schema + migration file**

```prisma
model SiteThemeSnapshot {
  id                  String   @id @default(cuid())
  siteId              String
  workspaceId         String
  prevStyles          Json?
  prevDsSchemaVersion Int
  /// theme-push | migration | generator | dark-auto | connect | logo
  reason              String   @default("theme-push")
  /// designTokensSchemaVersion at snapshot time (not the dsSchemaVersion reload counter)
  tokensSchemaVersion Int      @default(5)
  /// site Dark mode at snapshot time ("auto" | "off"); null = pre-v6
  darkMode            String?
  createdAt           DateTime @default(now())
  /* relations + indexes unchanged */
  @@index([siteId, reason, createdAt])
}
```

Add `tokensMigrationHold Boolean @default(false)` to `model Site`. Run `pnpm prisma migrate dev --create-only --name brand_tokens_v6`, open the SQL and confirm it is additive only (`ALTER TABLE ... ADD COLUMN ... DEFAULT`, one `CREATE INDEX`). Run `pnpm prisma generate`.

- [ ] **Step 4: Implement `brand-tokens.ts`**

```ts
// server/services/brand-tokens.ts
import { validateTokens, TOKENS_SCHEMA_VERSION, DarkModeSchema } from "@buildrik/shared/schemas/design-tokens";
import { migrateTokensToV6, TokenMigrationError } from "@buildrik/shared/tokens";

export class TokenSaveError extends Error {
  constructor(public code: "TOKENS_INVALID" | "TOKENS_STALE_CLIENT" | "TOKENS_NEED_CAS", message: string) {
    super(message);
    this.name = "TokenSaveError";
  }
}

/** Kill switch (D14, eng E3). Off = no NEW migrations; migrated sites keep working. */
export function isBrandTokensV2Enabled(): boolean {
  return process.env.BRAND_TOKENS_V2 === "on";
}

const versionOf = (s: unknown): number => {
  if (!s || typeof s !== "object") return 1;
  const v = (s as { designTokensSchemaVersion?: unknown }).designTokensSchemaVersion;
  return typeof v === "number" ? v : 1;
};

export type TokenCheck =
  | { kind: "no-tokens" }
  | { kind: "same-version"; tokens: unknown[] }
  | { kind: "first-migrated"; tokens: unknown[]; storedTokens: unknown; storedVersion: number };

export function checkTokenPayload(payload: unknown, stored: unknown): TokenCheck {
  if (!payload || typeof payload !== "object" || !("designTokens" in payload)) return { kind: "no-tokens" };
  const p = payload as { designTokens: unknown; designTokensSchemaVersion?: unknown; darkMode?: unknown };
  const pv = versionOf(p);
  const sv = versionOf(stored);
  if (pv < sv) throw new TokenSaveError("TOKENS_STALE_CLIENT", "This tab has an older brand format — reload to continue.");
  if (p.darkMode !== undefined && !DarkModeSchema.safeParse(p.darkMode).success) {
    throw new TokenSaveError("TOKENS_INVALID", "darkMode must be auto or off");
  }
  let tokens: unknown = p.designTokens;
  if (pv < TOKENS_SCHEMA_VERSION) {
    if (!isBrandTokensV2Enabled()) return { kind: "same-version", tokens: Array.isArray(tokens) ? tokens : [] };
    try {
      tokens = migrateTokensToV6(tokens);
    } catch (e) {
      if (e instanceof TokenMigrationError) throw new TokenSaveError("TOKENS_INVALID", e.reason);
      throw e;
    }
  }
  const checked = validateTokens(tokens);
  if (!checked.ok) throw new TokenSaveError("TOKENS_INVALID", checked.reason);
  const storedTokens = stored && typeof stored === "object" ? (stored as { designTokens?: unknown }).designTokens : undefined;
  return sv < TOKENS_SCHEMA_VERSION
    ? { kind: "first-migrated", tokens: checked.tokens, storedTokens, storedVersion: sv }
    : { kind: "same-version", tokens: checked.tokens };
}
```

When the switch is off and the payload is v5, the old-shape save is accepted as today (no validation beyond
today's), matching "Off = no new migrations".

- [ ] **Step 5: Wire `saveProjectData`**

At the top, select `lastEditedAt` and `workspaceId` too:

```ts
const site = await prisma.site.findUnique({
  where: { id: input.siteId },
  select: { deletedAt: true, projectSettings: true, lastEditedAt: true, workspaceId: true },
});
if (!site || site.deletedAt) throw new Error("SITE_NOT_FOUND");
const tokenCheck = checkTokenPayload(input.settings, site.projectSettings);
if (tokenCheck.kind === "first-migrated") {
  if (!expectedLastEditedAt) throw new TokenSaveError("TOKENS_NEED_CAS", "Reload to continue.");
  if (site.lastEditedAt.toISOString() !== new Date(expectedLastEditedAt).toISOString()) {
    throw new Error(`SAVE_CONFLICT:${site.lastEditedAt.toISOString()}`);
  }
}
```

Use `tokenCheck.tokens` for `settings.designTokens` (and `designTokensSchemaVersion: 6`) when not `no-tokens`. Inside the
existing transaction, right after the successful CAS `updateMany`:

```ts
if (tokenCheck.kind === "first-migrated") {
  await tx.siteThemeSnapshot.create({
    data: {
      siteId: input.siteId,
      workspaceId: site.workspaceId,
      prevStyles: { designTokens: tokenCheck.storedTokens ?? [] } as Prisma.InputJsonValue,
      prevDsSchemaVersion: input.dsSchemaVersion ?? 0,
      reason: "migration",
      tokensSchemaVersion: tokenCheck.storedVersion,
      darkMode: null,
    },
  });
}
```

Do **not** change `dsSchemaVersion` handling and do not touch `lastEditedAt` beyond the existing CAS write.
`duplicateSite` (:509): run `checkTokenPayload(source.projectSettings, source.projectSettings)` and store the migrated
tokens. `getProjectData` (:1106): add `tokensMigrationHold` to the select and return
`brandTokensV2: isBrandTokensV2Enabled()` and `tokensMigrationHold`.

Router (`server/trpc/routers/sites.ts`, the `saveProject` mutation's catch): map `TokenSaveError` →
`TRPCError({ code: e.code === "TOKENS_INVALID" ? "BAD_REQUEST" : "CONFLICT", message: \`${e.code}: ${e.message}\` })`,
and log `console.warn("[tokens] save refused", { siteId, code: e.code, reason: e.message })`.

- [ ] **Step 6: Run tests**

Run: `npx vitest run __tests__/sites-save-tokens-v6.test.ts __tests__/sites-save-project.test.ts __tests__/sites-service.dsSchemaVersion.test.ts` → PASS.
Run: `pnpm test:db __tests__/db/save-project-migration-snapshot.db.test.ts __tests__/db/save-project-large-page.db.test.ts` → PASS.
Run: `npx tsc --noEmit -p packages/dashboard > /tmp/tsc-dash.log 2>&1; echo $?` → `0`.

- [ ] **Step 7: Commit (+ CLAUDE.md env row)**

Add to CLAUDE.md "Server env vars → Core":
`| \`BRAND_TOKENS_V2\` | \`on\` enables the v6 brand-token migration (Brand Part 1). Off (unset) = no NEW migrations; already-migrated sites keep working. Server-side, read per request — never \`NEXT_PUBLIC_*\`. Rollout: QA workspace first. See docs/runbooks/brand-token-migration.md. | Yes once Part 1 ships |`

```bash
git add prisma/schema.prisma prisma/migrations server/services/brand-tokens.ts server/services/sites.service.ts server/trpc/routers/sites.ts __tests__/sites-save-tokens-v6.test.ts __tests__/db/save-project-migration-snapshot.db.test.ts CLAUDE.md
git commit -m "feat(server): validate tokens on save, migration snapshot in the save txn, kill switch"
```

Tell the owner: "Prisma migration `brand_tokens_v6` is created, additive only, not applied. Run `pnpm prisma migrate deploy` locally before Task 12's DB tests and before deploy."

---

### Task 12: theme.service — reason filter, legacy filter, prune, migration rollback + hold, workspace theme migration

Eng E1, E2, E5, E6; spec §4 (workspace theme).

**Files:**
- Modify: `server/services/theme.service.ts` (`pushSharedTheme` ~:230, `pruneSnapshots` :280, `rollbackSiteTheme` :320, `listSiteThemeSnapshots` :370)
- Modify: `server/trpc/routers/theme.ts` (new `brandRestorePoints` query for site editors: membership + non-VIEWER, no agency gate)
- Test: `server/services/__tests__/theme.service.test.ts` (extend), `__tests__/db/theme-snapshots-v6.db.test.ts`

**Interfaces:**
- Produces:
  - `rollbackSiteTheme(workspaceId, siteId)` — unchanged signature; now only `reason: "theme-push"` rows.
  - `rollbackTokenMigration(siteId): Promise<{ restoredVersion: number }>` — operator-only (no router); writes the
    `migration` snapshot's tokens + `designTokensSchemaVersion` verbatim, bumps `dsSchemaVersion`, sets `tokensMigrationHold = true`.
  - `clearTokenMigrationHold(siteId): Promise<void>` — operator-only.
  - `listBrandRestorePoints(siteId): Promise<Array<{ id; reason; createdAt }>>` — only rows whose `prevStyles` is a token set.

- [ ] **Step 1: Write the failing tests**

```ts
// __tests__/db/theme-snapshots-v6.db.test.ts
import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/prisma";
import { rollbackSiteTheme, rollbackTokenMigration, listBrandRestorePoints } from "@/server/services/theme.service";
import { createTestSite } from "./helpers";

async function snap(siteId: string, workspaceId: string, reason: string, prevStyles: unknown, at: number) {
  return prisma.siteThemeSnapshot.create({ data: { siteId, workspaceId, reason, prevStyles: prevStyles as object, prevDsSchemaVersion: 0, tokensSchemaVersion: 5, createdAt: new Date(at) } });
}

describe("SiteThemeSnapshot v6 rules", () => {
  it("admin rollback takes the newest theme-push even when a generator snapshot is newer (E1)", async () => {
    const s = await createTestSite();
    const push = await snap(s.id, s.workspaceId, "theme-push", { designTokens: [] }, 1_000);
    await snap(s.id, s.workspaceId, "generator", { designTokens: [] }, 2_000);
    await rollbackSiteTheme(s.workspaceId, s.id);
    expect(await prisma.siteThemeSnapshot.findUnique({ where: { id: push.id } })).toBeNull();
    expect(await prisma.siteThemeSnapshot.count({ where: { siteId: s.id, reason: "generator" } })).toBe(1);
  });

  it("migration rollback restores tokens + version verbatim and sets the hold (E2)", async () => {
    const s = await createTestSite();
    const old = [{ id: "color-primary", value: "#123456" }];
    await snap(s.id, s.workspaceId, "migration", { designTokens: old }, 1_000);
    await prisma.site.update({ where: { id: s.id }, data: { projectSettings: { designTokens: [], designTokensSchemaVersion: 6 } } });
    await rollbackTokenMigration(s.id);
    const site = await prisma.site.findUniqueOrThrow({ where: { id: s.id } });
    expect(site.projectSettings).toMatchObject({ designTokens: old, designTokensSchemaVersion: 5 });
    expect(site.tokensMigrationHold).toBe(true);
  });

  it("migration rows survive 15 generator snapshots (E5)", async () => {
    const s = await createTestSite();
    await snap(s.id, s.workspaceId, "migration", { designTokens: [] }, 1);
    for (let i = 0; i < 15; i++) await snap(s.id, s.workspaceId, "generator", { designTokens: [] }, 10 + i);
    // trigger prune through a theme push or call the exported prune helper
    expect(await prisma.siteThemeSnapshot.count({ where: { siteId: s.id, reason: "migration" } })).toBe(1);
  });

  it("Brand restore list hides legacy projectStyles rows (E6)", async () => {
    const s = await createTestSite();
    await snap(s.id, s.workspaceId, "theme-push", [{ selector: ".x", rules: {} }], 1);
    await snap(s.id, s.workspaceId, "generator", { designTokens: [] }, 2);
    const list = await listBrandRestorePoints(s.id);
    expect(list.map((r) => r.reason)).toEqual(["generator"]);
  });
});
```

Export `pruneSnapshots` (rename to `pruneThemeSnapshots`) and call it in the E5 test after the inserts. Extend
`server/services/__tests__/theme.service.test.ts` with a unit test that a prune failure logs
`[theme] prune failed` with the siteId and does not throw.

- [ ] **Step 2: Run to verify failure** — `pnpm test:db __tests__/db/theme-snapshots-v6.db.test.ts` FAILS.

- [ ] **Step 3: Implement**

`pruneThemeSnapshots`:

```ts
export async function pruneThemeSnapshots(siteId: string): Promise<void> {
  const keep = await prisma.siteThemeSnapshot.findMany({
    where: { siteId, reason: { not: "migration" } },
    orderBy: { createdAt: "desc" },
    take: SNAPSHOT_RETENTION,
    select: { id: true },
  });
  if (keep.length < SNAPSHOT_RETENTION) return;
  await prisma.siteThemeSnapshot
    .deleteMany({ where: { siteId, reason: { not: "migration" }, id: { notIn: keep.map((s) => s.id) } } })
    .catch((e: unknown) => {
      console.warn("[theme] prune failed", { siteId, error: e instanceof Error ? e.message : String(e) });
    });
}
```

`rollbackSiteTheme` and `listSiteThemeSnapshots`: add `reason: "theme-push"` to their `where`.
`pushSharedTheme`: before `withTokens`, if the workspace theme's tokens are v5 run `migrateTokensToV6` (when
`isBrandTokensV2Enabled()`), store the snapshot with `reason: "theme-push"`, `tokensSchemaVersion` = the site's
stored `designTokensSchemaVersion`.

```ts
export async function rollbackTokenMigration(siteId: string): Promise<{ restoredVersion: number }> {
  const snap = await prisma.siteThemeSnapshot.findFirst({ where: { siteId, reason: "migration" }, orderBy: { createdAt: "desc" } });
  if (!snap) throw new ThemeError("NOT_FOUND", "No migration snapshot for this site");
  const prev = (snap.prevStyles ?? {}) as { designTokens?: unknown };
  const site = await prisma.site.findUniqueOrThrow({ where: { id: siteId }, select: { projectSettings: true, dsSchemaVersion: true } });
  const current = site.projectSettings && typeof site.projectSettings === "object" ? (site.projectSettings as Record<string, unknown>) : {};
  const { darkMode: _drop, ...rest } = current;
  await prisma.site.update({
    where: { id: siteId },
    data: {
      projectSettings: { ...rest, designTokens: prev.designTokens ?? [], designTokensSchemaVersion: snap.tokensSchemaVersion } as Prisma.InputJsonValue,
      dsSchemaVersion: site.dsSchemaVersion + 1,
      tokensMigrationHold: true,
      lastEditedAt: new Date(),
    },
  });
  return { restoredVersion: snap.tokensSchemaVersion };
}

export async function clearTokenMigrationHold(siteId: string): Promise<void> {
  await prisma.site.update({ where: { id: siteId }, data: { tokensMigrationHold: false } });
}

export async function listBrandRestorePoints(siteId: string) {
  const rows = await prisma.siteThemeSnapshot.findMany({ where: { siteId }, orderBy: { createdAt: "desc" }, select: { id: true, reason: true, createdAt: true, prevStyles: true } });
  return rows.filter((r) => readTokenTheme(r.prevStyles) !== null).map(({ prevStyles: _p, ...r }) => r);
}
```

The migration snapshot's `prevStyles` has no `designPresets`; the rollback leaves the current presets in place
(presets are not migrated in 1a). Editor + server skip migration while `tokensMigrationHold`: in
`loadTokensSafely` (Task 9) return `{ settings, readOnly: true }` when `hold` is true (pass `getProjectData().tokensMigrationHold`
through), and in `checkTokenPayload` treat a held site like switch-off (accept old shape, never migrate) — add a
`hold` parameter and a unit test for it.

Router `brandRestorePoints`: `protectedProcedure.input(z.object({ siteId: z.string() }))`; check membership and that
the role is not `VIEWER` with the same helper `sites.ts` uses for edit rights; call `listBrandRestorePoints`. Unit test:
VIEWER → `FORBIDDEN`, editor without agency layer → OK.

- [ ] **Step 4: Run tests**

Run: `pnpm test:db __tests__/db/theme-snapshots-v6.db.test.ts && npx vitest run server/services/__tests__/theme.service.test.ts __tests__/sites-save-tokens-v6.test.ts` → PASS.

- [ ] **Step 5: Commit**

```bash
git add server prisma __tests__
git commit -m "feat(theme): snapshot reasons, migration rollback + hold, legacy filter, logged prune"
```

---

### Task 13: Kill switch reaches the editor; observability; runbook + operator script

**Files:**
- Modify: `packages/editor/src/editor/shell/hooks/useComposerInit.ts` — use `data.brandTokensV2` and `data.tokensMigrationHold`
- Create: `scripts/brand/rollback-migration.mjs`, `docs/runbooks/brand-token-migration.md`
- Test: extend `useComposerInit.migrationFailure.test.ts`

- [ ] **Step 1: Write the failing tests** (add to the Task 9 test file)

```ts
it("does not migrate when the switch is off; Brand read-only for an unmigrated site", () => {
  const r = loadTokensSafely({ designTokens: [], designTokensSchemaVersion: 5 }, "s", { switchOn: false, hold: false });
  expect(r.settings.designTokensSchemaVersion).toBe(5);
  expect(r.readOnly).toBe(true);
});
it("an already-migrated site works normally with the switch off", () => {
  const r = loadTokensSafely({ designTokens: [], designTokensSchemaVersion: 6 }, "s", { switchOn: false, hold: false });
  expect(r.readOnly).toBe(false);
});
it("a held site is never migrated", () => {
  const r = loadTokensSafely({ designTokens: [], designTokensSchemaVersion: 5 }, "s", { switchOn: true, hold: true });
  expect(r.settings.designTokensSchemaVersion).toBe(5);
  expect(r.readOnly).toBe(true);
});
it("reports a successful migration", () => {
  const r = loadTokensSafely({ designTokens: [], designTokensSchemaVersion: 5 }, "s", { switchOn: true, hold: false });
  expect(r.migrated).toBe(true);
});
```

- [ ] **Step 2: Run to verify failure** — FAIL (third parameter / `migrated` missing).

- [ ] **Step 3: Implement** — add `opts: { switchOn: boolean; hold: boolean } = { switchOn: true, hold: false }` to `loadTokensSafely` (the default keeps Task 9's two-argument calls and tests valid); return
`{ settings, readOnly, migrated }`; when `from < 6 && (!opts.switchOn || opts.hold)` return
`{ settings, readOnly: true, migrated: false }`. On `migrated`, emit `"designSystem:migrated"` and call
`captureMessage`-equivalent breadcrumb: `console.info("[tokens] migrated", { siteId, from })` (Sentry captures info
breadcrumbs). Failures already go to `captureError` (Task 9).

`scripts/brand/rollback-migration.mjs`:

```js
#!/usr/bin/env node
// Operator-only: roll a site's brand tokens back to its pre-migration snapshot
// and hold it (no re-migration until cleared). Usage:
//   node scripts/brand/rollback-migration.mjs <siteId>          # rollback + hold
//   node scripts/brand/rollback-migration.mjs <siteId> --clear  # clear the hold
import { rollbackTokenMigration, clearTokenMigrationHold } from "../../server/services/theme.service.ts";

const [siteId, flag] = process.argv.slice(2);
if (!siteId) {
  console.error("usage: rollback-migration.mjs <siteId> [--clear]");
  process.exit(2);
}
if (flag === "--clear") {
  await clearTokenMigrationHold(siteId);
  console.log(`hold cleared for ${siteId}`);
} else {
  const r = await rollbackTokenMigration(siteId);
  console.log(`rolled back ${siteId} to tokens v${r.restoredVersion}; hold set`);
}
process.exit(0);
```

Run it with `npx tsx scripts/brand/rollback-migration.mjs <siteId>` (tsx resolves the `.ts` import).

`docs/runbooks/brand-token-migration.md` — sections, in this order, each with exact commands:
1. **Symptoms** (Sentry `token migration failed`, `[tokens] save refused`, user reports colours changed).
2. **Stop the spread:** unset `BRAND_TOKENS_V2` in the cPanel Node app env (merge with existing keys — `cloudlinux-selector set --env-vars` replaces the whole map), restart the app. Off = no new migrations; migrated sites keep working.
3. **Find affected sites:** Sentry query for `token migration failed`; SQL `select "siteId", "createdAt" from site_theme_snapshots where reason='migration' order by "createdAt" desc;` (over the SSH tunnel).
4. **Roll back one site:** `npx tsx scripts/brand/rollback-migration.mjs <siteId>`; verify its export CSS matches the pre-migration export.
5. **After the fix ships:** clear holds (`--clear`), set `BRAND_TOKENS_V2=on`, open the site, confirm migration.

- [ ] **Step 4: Run tests** — `npx vitest run src/editor/shell/hooks` (in `packages/editor`) → PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/editor/src/editor/shell scripts/brand docs/runbooks
git commit -m "feat(brand): kill switch + hold reach the editor; rollback script and runbook"
```

---

### Task 14: E2E flows 1 and 2, full gates, live verification

**Files:**
- Create: `e2e/brand-tokens.spec.ts` (follow the existing Playwright config and login helper: `git ls-files | grep -E "playwright.config|e2e/.*helpers"`)

- [ ] **Step 1: Write the E2E tests**

```ts
// e2e/brand-tokens.spec.ts
import { test, expect } from "@playwright/test";
import { loginAsQa, openEditor, blockPublish } from "./helpers"; // existing helpers; add blockPublish if missing

test.describe("Brand Part 1a", () => {
  test.beforeEach(async ({ page }) => {
    await blockPublish(page); // route **/api/trpc/sites.publish* → 403; never publish from the QA workspace
    await loginAsQa(page);
  });

  test("changing Primary repaints the canvas and one ⌘Z restores it", async ({ page }) => {
    await openEditor(page);
    const read = () => page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--buildrick-design-color-primary").trim());
    const before = await page.evaluate(() => {
      const el = document.createElement("div");
      el.style.color = "var(--buildrick-design-color-primary)";
      document.body.appendChild(el);
      const c = getComputedStyle(el).color;
      el.remove();
      return c;
    });
    await page.getByRole("button", { name: /brand/i }).first().click();
    await page.getByRole("textbox", { name: /primary/i }).fill("#C2410C");
    await page.keyboard.press("Enter");
    await expect.poll(read).not.toBe("");
    const after = await page.evaluate(() => {
      const el = document.createElement("div");
      el.style.color = "var(--buildrick-design-color-primary)";
      document.body.appendChild(el);
      const c = getComputedStyle(el).color;
      el.remove();
      return c;
    });
    expect(after).toBe("rgb(194, 65, 12)");
    await page.keyboard.press("Meta+Escape").catch(() => {});
    await page.locator("[data-canvas-root], .bd-canvas").first().click();
    await page.keyboard.press("Meta+z");
    await expect.poll(async () => page.evaluate(() => {
      const el = document.createElement("div");
      el.style.color = "var(--buildrick-design-color-primary)";
      document.body.appendChild(el);
      const c = getComputedStyle(el).color;
      el.remove();
      return c;
    })).toBe(before);
  });

  test("a v5 fixture site migrates and its export token CSS is unchanged", async ({ page, request }) => {
    // Seed: the QA fixture site "brand-v5-fixture" (created by e2e global setup from seed-only.json with
    // designTokensSchemaVersion 5). Compare the exported token block before (recorded in the fixture) and after.
    await openEditor(page, { siteName: "brand-v5-fixture" });
    const exported = await page.evaluate(async () => (window as unknown as { __bkExportSingleFile: () => Promise<string> }).__bkExportSingleFile());
    const fixture = await request.get("/e2e-fixtures/brand-v5-export-tokens.json").then((r) => r.json());
    for (const [cssVar, value] of Object.entries(fixture as Record<string, string>)) {
      const resolved = await page.evaluate(([v]) => {
        const el = document.createElement("div");
        el.style.setProperty("--probe", `var(${v})`);
        el.style.color = `var(${v})`;
        document.body.appendChild(el);
        const c = getComputedStyle(el).color;
        el.remove();
        return c;
      }, [cssVar]);
      expect(resolved, cssVar).toBe(value);
    }
    expect(exported).not.toContain("prefers-color-scheme");
  });
});
```

Before writing flow 2, check whether a test-only export hook and fixture site already exist
(`git grep -n "__bkExport\|e2e-fixtures" packages e2e`). If not, record the fixture's computed colours by running the
v5 build once (on `main` before this branch) and saving `{ cssVar: "rgb(...)" }` for every colour var to
`e2e/fixtures/brand-v5-export-tokens.json`; compare computed colours in the migrated export loaded with
`page.setContent(exported)` instead of the window hook. Flow 3 (Dark Auto) lands with 1c.

- [ ] **Step 2: Run E2E** — `npx playwright test e2e/brand-tokens.spec.ts` → 2 PASS.

- [ ] **Step 3: Full gates, alone** (from repo root, nothing else running):

```bash
cd packages/editor && npx tsc --noEmit > /tmp/tsc-ed.log 2>&1; echo "editor tsc $?"
cd ../.. && npx tsc --noEmit -p packages/dashboard > /tmp/tsc-dash.log 2>&1; echo "dashboard tsc $?"
cd packages/editor && npx vitest run > /tmp/vitest-ed.log 2>&1; echo "editor vitest $?"; tail -5 /tmp/vitest-ed.log
cd ../.. && npx vitest run > /tmp/vitest-root.log 2>&1; echo "root vitest $?"; tail -5 /tmp/vitest-root.log
cd packages/editor && pnpm run verify:ds > /tmp/verify-ds.log 2>&1; echo "verify:ds $?"
```

Expected: every exit `0`. Rerun any failure from the known-flaky list alone before treating it as real. The
catalog fixture `catalogBlockHtml.baseline.json` must **not** change in 1a (inserts are 1b); if it does, stop.

- [ ] **Step 4: Live verification (the live app is the verifier — measure, don't eyeball)** on a worktree dev
server (`NEXT_PUBLIC_APP_URL/AUTH_URL/NEXTAUTH_URL=http://localhost:<port>`), QA workspace, publish blocked,
`BRAND_TOKENS_V2=on`:
  1. Change Primary in Brand: canvas buttons/links repaint immediately (`getComputedStyle`); one ⌘Z reverts.
  2. Three real existing sites (owner-chosen): before/after migration, export single-file token CSS → computed colours of button, input, heading, card identical (record numbers in the PR).
  3. Canvas = export = publish: computed styles of button, input, heading, card match (publish via the build step only, not a real publish).
  4. Switch `BRAND_TOKENS_V2` off: an unmigrated site opens with Brand read-only and the notice; a migrated site saves normally.
  5. `rollback-migration.mjs` on a scratch copy: site returns to v5 tokens; reload does not re-migrate; `--clear` re-enables.
  6. Picker drag on a ~200-element page: no visible stutter; Performance panel shows ≤1 style write per frame.
  7. ~700-element page saves (N1).
  State in the PR which of these were **not** verified and why.

- [ ] **Step 5: Commit**

```bash
git add e2e
git commit -m "test(e2e): brand primary change + undo; v5 site migrates with identical export colours"
```

---

## Self-Review notes (run by the plan author)

- **Spec coverage (1a scope):** §1 schema/DTCG → Tasks 1–2; §2 emitter, backstop, sanitize, Dark mode, canvas
  `<style>`, `data-theme`, callers → Tasks 4, 8, 9; §4 migration (determinism, duplicates, no colour change, not in
  undo, version rule, version skew, required CAS, snapshot in txn, workspace theme) → Tasks 3, 9, 11, 12; §4 one undo
  stack → Task 10; §8 snapshot store, reason, prune, legacy filter, migration rollback + hold → Tasks 11–12; §10 kill
  switch, migration/emit safety, authz on restore list, observability, runbook → Tasks 9, 11–13; eng P1 → Task 8;
  T1 flows 1–2 → Task 14; N1 → Task 0. **Deferred to 1b/1c plans by the spec's delivery order:** §3 insert-bound
  blocks + Connect, §6 delete guard UI + theme push keeps in-use tokens, §7 generator, §9 logo/URL, D11 Auto flow,
  D12 toggle, restore list UI, E2E flow 3, the full primitive scales in the seed (produced by the 1c generator).
- **Known judgement calls:** the seed keeps today's colours (migrated defaults) in 1a; the v6 `DesignToken` keeps
  `category`/`type`/`cssVar` because 34 UI files filter on them and Part 2 redesigns that UI.
