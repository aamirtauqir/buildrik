# Brand Part 1c — Generators Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One picked colour becomes a full 11-step scale with its light/dark aliases; a site's Dark mode can be
switched between Off and Auto (filling missing dark values first, previewed, one ⌘Z); every big brand change
leaves a restore point the owner can list and restore; a logo or a website URL becomes a previewed brand; and
a theme-toggle block lets visitors of an Auto site pick light or dark without a flash.

**Architecture:** The colour math and the brand-colour extraction are pure functions in the editor engine
(`engine/designSystem/scale.ts`, `engine/designSystem/brandColors.ts`, eng D1). The Composer gets two small
write/preview primitives — a canvas **preview layer** that never touches project settings or history, and
`setDarkMode`, which writes Dark mode and tokens in one transaction. Restore points reuse the existing
`SiteThemeSnapshot` table (its `reason`/`darkMode` columns already shipped in 1a) through two new tRPC
procedures on the `theme` router. The URL import is a server-side, SSRF-guarded fetch that returns raw
colour and font strings; the editor normalises them and runs the same role-picking and generator as the logo
path. The theme-toggle block is a token-bound button plus an export-time runtime, injected the same way the
interaction runtime is. Every UI surface is built from its BRP1-M8…M12 board.

**Tech Stack:** TypeScript 5 (strict), Zod, Vitest + React Testing Library, tRPC 11, Prisma 5 / PostgreSQL
(**no schema change**), Node `http`/`https`/`dns` (server fetch), React 18 (editor), Playwright (E2E).

**Spec:** `docs/superpowers/specs/2026-10-05-brand-token-foundation-design.md` (CEO + eng reviewed). This plan
covers **Delivery step 1c**: §7 scale generator, §2 Dark mode Auto/Off + the D11 Auto flow + the editor's
disabled dark preview, §2 D12 theme-toggle block, §8 Brand restore list (client restore path), §9 brand from
logo / URL, §10's preview/Apply safety and extraction rate limit, and spec tests 9 (Auto half), 12, 13, 14,
18, 22, 27 (restore half), 28, 29 (generator/Dark/logo halves), 36 flow 3.

**Style reference:** `docs/superpowers/plans/2026-10-08-brand-part1b-binding.md` (same conventions).

---

## Reality check (code is truth over spec)

Read on `main` @ `b51ade6fd`. Each line is a place where the spec's picture and the code differ; the tasks
are written against the code.

1. **No Dark mode control exists anywhere.** `darkMode` is stored and honoured (`emitTokenCss`,
   `ProjectTokensApplier`, `emitSiteTokenCss`, history since `089593494`), but no UI writes it, and nothing
   writes `"auto"`. Absent reads as `"off"` everywhere (`DarkModeSchema.catch("off")`).
2. **New sites are Off, not Auto (spec D8).** The four create paths — `createSite` (blank + template,
   `sites.service.ts:226,257`), `template.service.ts:143`, the AI worker
   (`packages/dashboard/app/api/workers/ai-generate/[jobId]/route.ts:186`) — write no `projectSettings`, so
   every new site is Off. Turning them Auto now would also flip text bound to tokens on blocks that keep raw
   light backgrounds (1b OQ-2 kept those raw) → **OQ-1**.
3. **A Dark-mode-only save is silently dropped by the server.** `checkTokenPayload` returns `no-tokens` when
   the payload has no `designTokens`, and `withCheckedTokens` then puts the **stored** `darkMode` back
   (`sites.service.ts:895-911`). A site that never edited a token would lose its Off→Auto switch on save.
   `setDarkMode` (Task 3) therefore **always writes `designTokens` too**.
4. **The ColorModeToggle never knows the site's Dark mode.** `ProjectTokensApplier` already forces the canvas
   light when Off, but the Light/Dark pill (`ColorModeToggle.tsx`) still offers Dark — the M8
   "preview-disabled" state does not exist.
5. **Restore points: the table is ready, the endpoints are half there.** `SiteThemeSnapshot` has `reason`,
   `tokensSchemaVersion`, `darkMode` (1a migration `20261006120000_brand_tokens_v6`). `theme.brandRestorePoints`
   lists them (EDITOR, no agency gate, legacy rows filtered). There is **no** create endpoint for
   `generator | dark-auto | logo`, **no** endpoint to read one point's tokens, and no editor caller. **1c needs
   no Prisma migration.**
6. **`connect` restore points do not exist** (1b OQ-4: dropped). Board M10 still draws a `connect` row; the
   reason label map in Task 12 has no `connect` entry and the board's row is sample data.
7. **Restoring must not delete an in-use token.** After 1b Task 4, `setTokens` refuses a write that drops a
   token with a non-zero (or unknown) site-wide count. A restore point taken before a token was added and
   bound would be refused wholesale. Restore therefore merges with 1b Task 10's `keepInUseSiteTokens`
   (Task 9 here).
8. **No canvas preview layer.** `BrandLivePreview` paints a staged set into its own iframe; the canvas
   (`ProjectTokensApplier`) paints only saved settings. Spec §2/§7/§9 previews must repaint the **canvas**, so
   Task 3 adds a preview slot the applier reads first.
9. **Where the pure code lives.** Spec §7/§9 say "pure function in `packages/shared`"; the eng review (D1,
   later and approved) put `scale.ts` and `quantize.ts` browser-side in `engine/designSystem/`. The server
   never needs the colour math (the URL path returns raw strings), so this plan follows D1. The OKLCH
   conversions already exist in `@/shared/utils/parsers` (`rgbToOklch`, `oklchToRgb`) and are reused, not
   re-written. The extraction file is named `brandColors.ts` (quantize + SVG + role pick + font map).
10. **Two SSRF guards exist.** `lib/url-guard.ts` (`assertPublicHttpsUrl`, https-only, used by integrations)
    and `webhook.service.ts`'s own `isPrivateAddress`. Neither pins the connection to the vetted address (both
    resolve, then let `fetch` resolve again — the rebinding window `webhook.service.ts:61` documents), and
    neither re-checks redirects. Task 7 extends `lib/url-guard.ts` with a pinned, redirect-checked fetch; the
    webhook guard is untouched.
11. **The seed has no primitive scales.** 1a deferred spec §1's blue/gray/red/green/amber scales "to the 1c
    generator". Adding ~55 primitives to `DEFAULT_TOKENS` would show them in every site's Brand
    (merge-over-seed) → **OQ-8**; the default is that the generator creates a scale on demand only.
12. **#1A56DB lands on step 700.** Computed with the Task 1 algorithm: OKLCH L 0.505 is nearest the 700
    target, so the seed blue is `primary-700` (Flowbite calls it blue-700 too — spec §7's naming note is
    settled), and its mirrored dark step is 300.
13. **Theme toggle on export.** The interaction runtime is injected by `ExportEngine` on both the single-file
    and the publish path when the page carries its attribute; the accordion/countdown runtimes are injected
    only on publish (`lib/publish-widgets.ts`). The toggle follows the **interaction** pattern so export,
    ZIP and publish all work. An attribute with an empty value may not be written by the element writer, so
    the toggle uses `data-bk-theme-toggle="true"`.
14. **The designer ledger.** The node ids below come from the owner's working copy of
    `docs/design-jobs/BRAND-PART1/brief.md` (uncommitted on `main` at plan time; the scratchpad copy named in
    the request did not exist). Handoff index: `8230:233164`.
15. **Rollout state.** `BRAND_TOKENS_V2=on` in prod since 2026-10-07; no prod deploys until the owner asks.
    1c ships to `main` only.

## Global Constraints

- Accent `#1A56DB` (CLAUDE.md). Purple/violet/indigo banned in chrome. `#406ED6` is retired everywhere.
- Path aliases only; `../../` imports banned. Editor: `@/` → `packages/editor/src/`. Root: `@/lib/...`, `@/server/...`, `@server/...`.
- No `any`. No `as` unless truly necessary (Prisma JSON boundaries and the Node `lookup` callback overload are the accepted cases).
- Data flow: Page → tRPC → router → service → Prisma. New procedures live on `server/trpc/routers/theme.ts`; restore-point logic in `server/services/theme.service.ts`; URL extraction in `server/services/brand-extract.service.ts`; the guarded fetch in `lib/url-guard.ts`.
- Endpoint inputs that cross the transport boundary live in `packages/shared/schemas/theme.ts`.
- Chrome UI: `@/editor/chrome-ui` only (never `flowbite-react` directly), `tw:` utilities, `var(--bk-*)` tokens, no raw `<button>/<input>/<select>/<textarea>` (Gate 24), portals only through chrome-ui overlay primitives (Gate 22).
- No pass-through wrappers, no middle-man files, no duplicated logic: one OKLCH conversion (`@/shared/utils/parsers`), one scale algorithm (`generateColorScale`), one role picker (`pickBrandRoles`), one token write (`designSystem.setTokens` / `setDarkMode`).
- Every multi-token write — generator, Dark Auto, logo/URL apply, restore — is **one** `beginTransaction/endTransaction` (one ⌘Z step).
- Every preview (Dark Auto, generator, logo/URL) reverts the canvas on Cancel, on navigation away and on unmount; Apply is disabled while its work is in flight (spec D17).
- A restore point is written **before** the generator, Dark-Auto and logo/URL applies; if it cannot be written, the apply does not happen (OQ-6 default).
- Inserted block styles bind with **no fallback**: `var(--buildrick-design-color-surface-raised)`, never `var(--…, #fff)`.
- Prisma: 1c needs no migration. If an implementer finds it needs one, **stop and ask** — the agent creates migrations, the **owner applies** them (`pnpm prisma migrate deploy`).
- If you add a `process.env.X` read, add or update its row in the root `CLAUDE.md` env table in the same commit (Task 8 reads `NEXT_PUBLIC_FEATURE_DS_AI` on the server).
- **Never publish from the QA workspace** (`qa@buildrik.local` has a live Vercel connection). Every live and E2E check blocks `sites.publish` (`blockPublish` in `packages/dashboard/e2e/brand-tokens.spec.ts`). Published-page boards are verified on a **single-file export**, never a publish.
- Never `git stash` mid-execution. Never push unless the owner asks. Never stage `AquibraStudio.tsx` changes you did not make.
- Read `tsc` exit from the command itself, never after a pipe (`npx tsc --noEmit > /tmp/tsc.log 2>&1; echo $?`).
- Full editor suite + root suite run alone before any merge to main; known load-flaky files: RedirectsScreen, cms.service stripMarkup, BrandWorkspace.pages, ReviewTab.banner, LibraryManager*, OverviewScreen, TemplatesTab.ia, FormAfterSubmitSection, noChromeTokenWrites, SaveVersionModal, PublishTab.gate.
- UI tasks start only when `/plan-design-review` has run on their boards (D15). Build loop (editor CLAUDE.md, FIGMA UI REBUILD): load `figma:figma-design-to-code` → `get_design_context(<node>)` (or `node scripts/baseline/figma-mcp.mjs` when the Figma tools are absent) → build with chrome-ui + `tw:` + `--bk-*` → **verify = board screenshot vs live screenshot, side by side, at 1440×900** → not matching, keep fixing. Board sample data (colours, counts, names) is never conformed to literally — the shape is the contract; the generator's computed steps win over board swatches (brief, 2026-10-07).

## Review Focus

1. **A site that never saved a token switches Dark mode.** A person flips Off → Auto on a fresh site, the
   autosave lands, they reload — Dark mode must still be Auto. The server drops a `darkMode` that arrives
   without `designTokens` (reality check 3). → Task 3 Step 1 (`setDarkMode writes designTokens even when
   none were saved`).
2. **Restore a point taken before a token was added and bound.** A person expects the brand to go back and
   the bound element to keep its colour, not a refused restore or an undefined `var()`. → Task 9 Step 1
   (`restoredTokens keeps an in-use token the snapshot does not have`).
3. **Preview, then navigate away (another Brand page, another rail tab) or press ⌘Z mid-preview.** The canvas
   must go back to the saved brand; a stale preview must never sit over a newer saved state. → Task 9 Step 1
   (`useBrandPreview clears on unmount`, `recomputes when settings change`).
4. **A URL that redirects to an internal address, or a hostname that resolves to one.** A person pasting a
   short link expects "This address can't be used", and the server must never connect inward. → Task 7
   Step 1 (`refuses a redirect to a private address`, `connects to the vetted address`).
5. **A logo that is one colour on white, a transparent PNG, or a 6000×4000 photo.** Expect "We couldn't find
   brand colours in this logo" with a picker for the first; the real colour for the second (transparent
   pixels ignored); and no frozen tab for the third (downscaled to ≤ 4 MP). → Task 2 Step 1
   (`ignores transparent pixels`, `monochrome logo → null`, `downscaleSize caps at 4 MP`).

## Open questions for the owner (execution proceeds on the default)

| ID | Question | Blocks | Recommended default (used until answered) |
|----|----------|--------|--------------------------------------------|
| OQ-1 | **New sites start Auto (spec D8)?** Blocks inserted today keep raw light backgrounds (1b OQ-2 allow-list) while their text binds to tokens that turn light in dark mode, so an Auto site can publish light-on-light text for visitors on a dark OS. | Task 15 | **Keep new sites Off in 1c.** Auto stays one click away (M8). Revisit with Part 2's contrast badges. Task 15 is skipped. |
| OQ-2 | **Scale primitive names.** Role-named (`primary-50 … primary-950`) or hue-named (`blue-50 …`)? | Task 1 | **Role-named**, ids `<role without "color-">-<step>`, group `scale-<roleId>`; a clash gets `-2`, `-3` on the whole scale. |
| OQ-3 | **Which roles offer the generator?** Primary only, or every semantic colour (Secondary, Accent, Success, …)? | Task 11 | **Every semantic colour token** (the board shows the entry on a colour token). |
| OQ-4 | **Primitives left unaliased after a regenerate** (`color-brand-500`, `custom-color-primary-dark`) — keep, or prune when unused? | Task 1 | **Keep.** Pruning is a delete and goes through 1b's guard; Part 2 can add a cleanup check. |
| OQ-5 | **Dark-Auto fill shape.** For each semantic colour without a dark value: one `custom-<id>-dark` primitive at the generator's dark step (small), or a full 11-step scale per role (large)? Surfaces and text use the **unclamped** mirror step (a light background must get a dark background, not a 500 mid-tone); accents use spec §7's 300…500 clamp. | Task 1, 10 | **One primitive per token**, surface/text unclamped, others clamped. |
| OQ-6 | **Restore point write fails** (offline, server error). Block the apply, or apply without a restore point? | Tasks 9–13 | **Block:** "We couldn't save a restore point — nothing was changed." with Retry. ⌘Z still exists, but the spec puts the restore point first. |
| OQ-7 | **Turning Dark mode Off** — take a restore point too? (spec only names the Auto switch) | Task 10 | **No** — Off removes nothing (dark values stay stored) and is one ⌘Z. |
| OQ-8 | **Seed primitive scales** (spec §1 blue/gray/red/green/amber and the other kinds' scales, deferred by 1a to "the 1c generator"). Add to `DEFAULT_TOKENS` (visible in every site's Brand), or generate on demand? | — | **On demand only.** No seed change in 1c. |
| OQ-9 | **AI role naming** for logo/URL (spec: optional). Build it in 1c? | Task 13 | **No.** Deterministic: most saturated of the 3 most frequent brand colours → Primary; next distinct hue (≥ 30°) → Accent. Works without `OPENAI_API_KEY`. |
| OQ-10 | **URL schemes.** Spec says http(s); the existing guard is https-only. | Task 7 | **http and https, ports 80/443 only, no credentials in the URL.** |
| OQ-11 | **Fonts from a URL.** Which tokens change, and what is "closest available"? | Task 13 | `font-heading` = the most used family on `h1`–`h3` rules (else the most used overall), `font-body` = the family on `body`/`html` (else the most used overall). Not in `GOOGLE_FONT_CATALOGUE` → first catalogue family of its generic (sans-serif → Inter, serif → Playfair Display, monospace → Fira Code), shown as "replaced X with Y". |
| OQ-12 | **A fetch that is not refused but fails** (404, not HTML). The boards have only "took too long" and "can't be used". | Task 8 | **"This address can't be used."** |
| OQ-13 | **Deploy.** 1c adds two server procedures and an outbound fetch. Prod deploy timing is yours (no deploys until asked, 2026-10-07). | Task 16 | Ships to `main` only. |

## Dependencies on Part 1b (must be merged on `main` first)

| 1b task | What 1c uses | 1c tasks that wait |
|---------|--------------|--------------------|
| Task 1 — usage index v2 | `TokenUsageCount`, `TokenUsageIndex.count` | 9 |
| Task 3 — site-wide `TokenUsageTracker.getCount` | the usage passed to `keepInUseSiteTokens` on restore | 9, 12 |
| Task 4 — removal guard in `setTokens` | every 1c write goes through it; restore is shaped to pass it | 3, 9, 12 |
| Task 6 — seed gap tokens (`color-surface-raised`, `color-border-subtle`, `color-text-strong`) | the theme-toggle block binds to them | 5, 14 |
| Task 7 — insert-bound defaults + `blockRegistry.insertBound.test.ts` | the toggle block must pass that test | 5 |
| Task 10 — `keepInUseSiteTokens` (`packages/shared/tokens/keepInUse.ts`) | restore keeps in-use site-only tokens | 9, 12 |

Tasks 1, 2, 4 (export half), 6, 7 and 8 need nothing from 1b and can start at once. 1b's UI tasks (11–13) are
not prerequisites.

---

## File Structure

| File | Status | Responsibility |
|------|--------|----------------|
| `packages/editor/src/engine/designSystem/scale.ts` | create | `generateColorScale`, `applyScaleToRole`, `proposeMissingDarks` (pure) |
| `packages/editor/src/engine/designSystem/brandColors.ts` | create | `quantizePixels`, `extractSvgColors`, `normalizeColorCounts`, `pickBrandRoles`, `mapFontFamily`, `downscaleSize` (pure) |
| `packages/editor/src/engine/designSystem/restorePoint.ts` | create | `restoredTokens` (pure: migrate + merge + keep-in-use) |
| `packages/editor/src/engine/designSystem/types.ts` | modify | `BrandPreview` |
| `packages/editor/src/engine/Composer.ts` | modify | `designSystem.preview` / `setPreview` / `setDarkMode` |
| `packages/editor/src/shared/constants/events.ts` | modify | `BRAND_PREVIEW_CHANGED` + payload |
| `packages/editor/src/editor/design-system/ui/ProjectTokensApplier.tsx` | modify | paint the preview first; toggle CSS |
| `packages/editor/src/engine/export/themeToggleRuntime.ts` | create | runtime, boot script, toggle CSS, `siteHasThemeToggle` |
| `packages/editor/src/engine/export/ExportHelpers.ts` | modify | `emitSiteTokenCss` appends toggle CSS |
| `packages/editor/src/engine/export/ExportEngine.ts` | modify | boot script in head, runtime in body (both paths) |
| `packages/editor/src/blocks/Basic/ThemeToggle.ts` | create | the block (token-bound, data contract) |
| `packages/editor/src/blocks/Basic/index.ts`, `packages/editor/src/blocks/blockRegistry.ts` | modify | register it |
| `packages/editor/src/engine/designSystem/linter/DSLinter.ts` | modify | `theme-toggle-hidden` rule id |
| `packages/editor/src/editor/design-system/state/useDSLint.ts` | modify | emit that issue |
| `packages/shared/schemas/theme.ts` | modify | `createBrandRestorePointInput`, `brandRestorePointInput`, `extractBrandFromUrlInput` |
| `server/services/theme.service.ts` | modify | `createBrandRestorePoint`, `getBrandRestorePoint` |
| `lib/url-guard.ts` | modify | `resolvePublicAddress`, `fetchPublicText` (pinned, redirect-checked) |
| `server/services/brand-extract.service.ts` | create | `readBrandFromHtml`, `tallyBrandCss`, `extractBrandFromUrl`, `BrandExtractError` |
| `server/trpc/routers/theme.ts` | modify | `createBrandRestorePoint`, `brandRestorePoint`, `extractBrandFromUrl` |
| `packages/editor/src/editor/design-system/state/useBrandPreview.ts` | create | canvas preview lifecycle hook |
| `packages/editor/src/editor/design-system/state/useBrandRestorePoints.ts` | create | list / take / restore (tRPC + engine) |
| `packages/editor/src/editor/design-system/state/useGuardedApply.ts` | create | in-flight Apply guard |
| `packages/editor/src/editor/design-system/utils/decodeLogo.ts` | create | browser decode (SVG text / canvas pixels) |
| UI (per board) | create/modify | Tasks 10–14 |
| `packages/dashboard/e2e/brand-tokens.spec.ts` | modify | Part 1c flows |
| `docs/runbooks/brand-token-migration.md` | modify | §7 "Part 1c rollout" |
| `CLAUDE.md` | modify | `NEXT_PUBLIC_FEATURE_DS_AI` row (server read) |

---

## Before you start (every task)

- Work in a worktree from `main` (after the 1b tasks above have merged): `git -C /Users/shahg/Desktop/pencil/buildrik worktree add -b feat/brand-part1c ~/Desktop/buildrik-worktrees/brand-part1c main`, then `pnpm install` there. Never edit `/Users/shahg/Desktop/pencil/buildrik` directly.
- Read `server/AGENTS.md`, `packages/editor/src/engine/AGENTS.md`, `packages/editor/src/editor/AGENTS.md`, `packages/dashboard/AGENTS.md` before touching those folders.
- Editor tests run from `packages/editor` (`npx vitest run <path>`); shared, lib and server tests from the repo root (`npx vitest run <path>`); DB tests with `pnpm test:db -- <path>`.

### Lanes

| Lane | Tasks | Depends on |
|------|-------|------------|
| A — pure engine | 1, 2 | — |
| B — engine writes + toggle | 3 → 4 → 5 | 3 needs 1b T4; 5 needs 1b T6–T7 |
| C — server | 6, 7 → 8 | — |
| D — editor flows | 9 | 1, 3, 6, 1b T1/T3/T4/T10 |
| UI (boards) | 10, 11, 12, 13, 14 | 9 (all), plus 1 (10, 11), 2 + 8 (13), 4 + 5 (14) |
| Gated | 15 | OQ-1 = Auto |
| Verify | 16 | all |

---

### Task 1: Scale generator (pure)

**Files:**
- Create: `packages/editor/src/engine/designSystem/scale.ts`
- Test: `packages/editor/src/engine/designSystem/__tests__/scale.test.ts`

**Interfaces:**
- Consumes: `parseColor`, `rgbToHex`, `rgbToOklch`, `oklchToRgb` from `@/shared/utils/parsers`; `resolveTokenLiteral`, `setTokenLiteral` from `@buildrik/shared/tokens`; `DesignToken` from `@buildrik/shared/schemas/design-tokens`.
- Produces:
  - `SCALE_STEPS: readonly [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]`, `type ScaleStep`
  - `interface ColorScale { hexes: string[]; pickedStep: ScaleStep; darkStep: ScaleStep; mirrorStep: ScaleStep }`
  - `generateColorScale(input: string): ColorScale | null`
  - `applyScaleToRole(tokens: readonly DesignToken[], roleId: string, scale: ColorScale): { ok: true; tokens: DesignToken[]; prefix: string } | { ok: false; reason: "not-a-semantic-colour" }`
  - `proposeMissingDarks(tokens: readonly DesignToken[]): { tokens: DesignToken[]; filled: string[] }`

- [ ] **Step 1: Write the failing tests**

```ts
// packages/editor/src/engine/designSystem/__tests__/scale.test.ts
import { describe, it, expect } from "vitest";
import { validateTokens, type DesignToken } from "@buildrik/shared/schemas/design-tokens";
import { resolveTokenLiteral } from "@buildrik/shared/tokens";
import { rgbToOklch, parseColor } from "@/shared/utils/parsers";
import { DEFAULT_TOKENS } from "@/engine/designSystem/defaultTokens";
import { SCALE_STEPS, generateColorScale, applyScaleToRole, proposeMissingDarks } from "../scale";

const L = (hex: string) => rgbToOklch(parseColor(hex)!).l;
const semantic = (id: string, value: string, extra: Partial<DesignToken> = {}): DesignToken => ({
  id, name: id, kind: "color", layer: "semantic", modes: { light: { value } },
  category: "colors", cssVar: `--buildrick-design-${id}`, type: "color", ...extra,
});

describe("generateColorScale (spec §7, test 12)", () => {
  it("gives a fixed 11-step scale for a fixed input, keeping the picked colour exactly", () => {
    const s = generateColorScale("#1A56DB")!;
    expect(s.hexes).toEqual([
      "#EDF6FF", "#DAE9FF", "#C0D9FF", "#9CC0FF", "#699DFF", "#3C7CFF",
      "#1D60F4", "#1A56DB", "#0F41B1", "#0F3894", "#032166",
    ]);
    expect(s.pickedStep).toBe(700);
    expect(s.darkStep).toBe(300);
    expect(generateColorScale("#1a56db")).toEqual(s);
  });

  it("is monotonic in lightness, 50 lightest", () => {
    for (const input of ["#1A56DB", "#C2410C", "#0E7490", "#64748B"]) {
      const ls = generateColorScale(input)!.hexes.map(L);
      for (let i = 1; i < ls.length; i++) expect(ls[i]).toBeLessThan(ls[i - 1]);
    }
  });

  it("clamps the dark step to 300…500 and mirrors without the clamp", () => {
    const light = generateColorScale("#F0F9FF")!; // picked 50
    expect(light.pickedStep).toBe(50);
    expect(light.darkStep).toBe(500);
    expect(light.mirrorStep).toBe(950);
    expect(generateColorScale("#C2410C")!.darkStep).toBe(400); // picked 600
  });

  it("refuses what is not an opaque colour", () => {
    expect(generateColorScale("transparent")).toBeNull();
    expect(generateColorScale("rgba(26,86,219,0.5)")).toBeNull();
    expect(generateColorScale("var(--x)")).toBeNull();
  });
});

describe("applyScaleToRole", () => {
  it("adds 11 role-named primitives and points the role's light and dark at them", () => {
    const out = applyScaleToRole(DEFAULT_TOKENS, "color-primary", generateColorScale("#C2410C")!);
    if (!out.ok) throw new Error(out.reason);
    expect(out.prefix).toBe("primary");
    expect(SCALE_STEPS.every((s) => out.tokens.some((t) => t.id === `primary-${s}` && t.layer === "primitive"))).toBe(true);
    const role = out.tokens.find((t) => t.id === "color-primary")!;
    expect(role.modes).toEqual({ light: { alias: "primary-600" }, dark: { alias: "primary-400" } });
    expect(resolveTokenLiteral(out.tokens, "color-primary", "light")).toBe("#C2410C");
    expect(validateTokens(out.tokens).ok).toBe(true);
  });

  it("regenerating overwrites its own scale instead of adding a second one", () => {
    const first = applyScaleToRole(DEFAULT_TOKENS, "color-primary", generateColorScale("#C2410C")!);
    if (!first.ok) throw new Error(first.reason);
    const second = applyScaleToRole(first.tokens, "color-primary", generateColorScale("#0E7490")!);
    if (!second.ok) throw new Error(second.reason);
    expect(second.prefix).toBe("primary");
    expect(second.tokens.filter((t) => t.group === "scale-color-primary")).toHaveLength(11);
    expect(resolveTokenLiteral(second.tokens, "color-primary", "light")).toBe("#0E7490");
  });

  it("never overwrites a token it does not own — the whole scale moves to a free prefix", () => {
    const mine = semantic("primary-500", "#000000", { layer: "primitive" });
    const out = applyScaleToRole([...DEFAULT_TOKENS, mine], "color-primary", generateColorScale("#1A56DB")!);
    if (!out.ok) throw new Error(out.reason);
    expect(out.prefix).toBe("primary-2");
    expect(out.tokens.find((t) => t.id === "primary-500")).toEqual(mine);
  });

  it("refuses a primitive or a non-colour role", () => {
    expect(applyScaleToRole(DEFAULT_TOKENS, "color-brand-500", generateColorScale("#1A56DB")!).ok).toBe(false);
    expect(applyScaleToRole(DEFAULT_TOKENS, "space-4", generateColorScale("#1A56DB")!).ok).toBe(false);
  });
});

describe("proposeMissingDarks (spec D11, test 18)", () => {
  it("fills only semantic colours without a dark value; accents clamped, surfaces/text mirrored", () => {
    const tokens = [
      semantic("color-brand-x", "#C2410C"),
      semantic("color-card", "#F8FAFC", { semanticKind: "surface" }),
      semantic("color-ink", "#334155", { semanticKind: "text" }),
      semantic("color-has-dark", "#1A56DB", { modes: { light: { value: "#1A56DB" }, dark: { value: "#9CC0FF" } } }),
      semantic("color-clear", "transparent"),
    ];
    const out = proposeMissingDarks(tokens);
    expect(out.filled).toEqual(["color-brand-x", "color-card", "color-ink"]);
    expect(resolveTokenLiteral(out.tokens, "color-brand-x", "dark")).toBe("#F17953"); // step 400
    expect(resolveTokenLiteral(out.tokens, "color-card", "dark")).toBe("#232A31"); // mirror 950
    expect(resolveTokenLiteral(out.tokens, "color-ink", "dark")).toBe("#E3E9F2"); // mirror 100
    expect(resolveTokenLiteral(out.tokens, "color-has-dark", "dark")).toBe("#9CC0FF");
    expect(validateTokens(out.tokens).ok).toBe(true);
  });

  it("returns the input unchanged when nothing is missing", () => {
    const out = proposeMissingDarks(proposeMissingDarks(DEFAULT_TOKENS).tokens);
    expect(out.filled).toEqual([]);
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run (from `packages/editor`): `npx vitest run src/engine/designSystem/__tests__/scale.test.ts`
Expected: FAIL — `Cannot find module '../scale'`.

- [ ] **Step 3: Implement**

```ts
// packages/editor/src/engine/designSystem/scale.ts
/**
 * One colour → an 11-step scale (spec §7, D3). Built in OKLCH: every step
 * sits at a fixed target lightness, the picked colour is kept EXACTLY at the
 * step nearest its own lightness, chroma follows a fixed shape scaled to the
 * pick, hue stays the pick's. Out-of-gamut steps lose chroma until the sRGB
 * round trip holds. Deterministic: same input, same 11 values.
 *
 * Dark alias: the step mirroring the pick around the middle (10 − index),
 * clamped to 300…500 so dark accents stay readable. `mirrorStep` is the same
 * mirror without the clamp — what a surface or a text colour needs (a light
 * background must turn dark, not mid-grey; OQ-5).
 */
import type { DesignToken } from "@buildrik/shared/schemas/design-tokens";
import { resolveTokenLiteral, setTokenLiteral } from "@buildrik/shared/tokens";
import { parseColor, rgbToHex, rgbToOklch, oklchToRgb } from "@/shared/utils/parsers";

export const SCALE_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
export type ScaleStep = (typeof SCALE_STEPS)[number];

const TARGET_L = [0.97, 0.932, 0.882, 0.809, 0.707, 0.623, 0.546, 0.488, 0.424, 0.379, 0.282];
const CHROMA_SHAPE = [0.12, 0.25, 0.45, 0.7, 0.9, 1, 1, 0.92, 0.8, 0.68, 0.55];
const MAX_CHROMA = 0.37;

export interface ColorScale {
  /** 11 opaque `#RRGGBB`, 50 → 950. */
  hexes: string[];
  pickedStep: ScaleStep;
  darkStep: ScaleStep;
  mirrorStep: ScaleStep;
}

const hexOf = (rgb: { r: number; g: number; b: number }) => rgbToHex({ r: rgb.r, g: rgb.g, b: rgb.b }).toUpperCase();

function fitToGamut(l: number, c: number, h: number): string {
  let chroma = c;
  for (let i = 0; i < 80; i++) {
    const rgb = oklchToRgb({ l, c: chroma, h });
    const back = rgbToOklch(rgb);
    if (Math.abs(back.l - l) < 0.01 && Math.abs(back.c - chroma) < 0.01) return hexOf(rgb);
    if (chroma === 0) break;
    chroma = Math.max(0, chroma - 0.005);
  }
  return hexOf(oklchToRgb({ l, c: 0, h }));
}

export function generateColorScale(input: string): ColorScale | null {
  const rgb = parseColor(input.trim());
  if (!rgb || (rgb.a !== undefined && rgb.a < 1)) return null;
  const picked = rgbToOklch({ r: rgb.r, g: rgb.g, b: rgb.b });
  let pi = 0;
  for (let i = 1; i < TARGET_L.length; i++) {
    if (Math.abs(TARGET_L[i] - picked.l) < Math.abs(TARGET_L[pi] - picked.l)) pi = i;
  }
  const mirror = 10 - pi;
  const hexes = TARGET_L.map((l, i) =>
    i === pi ? hexOf(rgb) : fitToGamut(l, Math.min(MAX_CHROMA, (picked.c * CHROMA_SHAPE[i]) / CHROMA_SHAPE[pi]), picked.h),
  );
  return {
    hexes,
    pickedStep: SCALE_STEPS[pi],
    darkStep: SCALE_STEPS[Math.min(5, Math.max(3, mirror))],
    mirrorStep: SCALE_STEPS[mirror],
  };
}

const stepHex = (scale: ColorScale, step: ScaleStep) => scale.hexes[SCALE_STEPS.indexOf(step)];

/** Writes `scale` as the role's own primitives (`<role>-50…950`, group
 *  `scale-<roleId>`) and aliases the role's light → picked step, dark → dark
 *  step. A scale this role generated before is overwritten in place; a token
 *  it does not own is never touched — the whole scale takes a free prefix. */
export function applyScaleToRole(
  tokens: readonly DesignToken[],
  roleId: string,
  scale: ColorScale,
): { ok: true; tokens: DesignToken[]; prefix: string } | { ok: false; reason: "not-a-semantic-colour" } {
  const role = tokens.find((t) => t.id === roleId);
  if (!role || role.kind !== "color" || role.layer !== "semantic") return { ok: false, reason: "not-a-semantic-colour" };
  const group = `scale-${roleId}`;
  const slug = roleId.replace(/^color-/, "");
  const byId = new Map(tokens.map((t) => [t.id, t]));
  const vars = new Set(tokens.map((t) => t.cssVar));
  const fits = (prefix: string) =>
    SCALE_STEPS.every((s) => {
      const id = `${prefix}-${s}`;
      const existing = byId.get(id);
      if (existing) return existing.layer === "primitive" && existing.group === group && existing.cssVar === `--buildrick-design-${id}`;
      return !vars.has(`--buildrick-design-${id}`);
    });
  let prefix = slug;
  for (let n = 2; !fits(prefix); n++) prefix = `${slug}-${n}`;

  const primitives: DesignToken[] = SCALE_STEPS.map((s) => ({
    id: `${prefix}-${s}`,
    name: `${role.name} ${s}`,
    kind: "color",
    layer: "primitive",
    modes: { light: { value: stepHex(scale, s) } },
    category: "colors",
    cssVar: `--buildrick-design-${prefix}-${s}`,
    type: "color",
    group,
  }));
  const ids = new Set(primitives.map((p) => p.id));
  const rest = tokens
    .filter((t) => !ids.has(t.id))
    .map((t) =>
      t.id === roleId
        ? { ...t, modes: { light: { alias: `${prefix}-${scale.pickedStep}` }, dark: { alias: `${prefix}-${scale.darkStep}` } } }
        : t,
    );
  const at = rest.findIndex((t) => t.id === roleId);
  return { ok: true, tokens: [...rest.slice(0, at), ...primitives, ...rest.slice(at)], prefix };
}

const mirrors = (t: DesignToken) =>
  t.semanticKind === "surface" || t.semanticKind === "text" || t.group === "surface" || t.group === "text";

/** Dark values for every semantic colour that has none (D11). One
 *  `custom-<id>-dark` primitive each, via `setTokenLiteral` (OQ-5). A token
 *  whose light value is not an opaque colour (`transparent`) is skipped. */
export function proposeMissingDarks(tokens: readonly DesignToken[]): { tokens: DesignToken[]; filled: string[] } {
  let out: DesignToken[] = [...tokens];
  const filled: string[] = [];
  for (const t of tokens) {
    if (t.kind !== "color" || t.layer !== "semantic" || t.replacedBy || t.modes.dark) continue;
    const light = resolveTokenLiteral(out, t.id, "light");
    const scale = light ? generateColorScale(light) : null;
    if (!scale) continue;
    out = setTokenLiteral(out, t.id, "dark", stepHex(scale, mirrors(t) ? scale.mirrorStep : scale.darkStep));
    filled.push(t.id);
  }
  return { tokens: out, filled };
}
```

If any expected hex in Step 1 differs, the implementation diverged from the code above (the expectations
were computed from exactly this algorithm and the repo's own `rgbToOklch`/`oklchToRgb`) — fix the code, not
the expectation.

- [ ] **Step 4: Run to verify they pass**

Run (from `packages/editor`): `npx vitest run src/engine/designSystem/__tests__/scale.test.ts`
Expected: PASS (11 tests).

- [ ] **Step 5: Design review of the scale's look (spec §7).** Render the scales for `#1A56DB`, `#C2410C`,
  `#15803D`, `#64748B` as swatch rows (a scratch HTML page in your scratchpad, not committed), screenshot,
  and post it to the owner with the commit. Do not block the next tasks on the answer; a requested change is
  a new commit to `TARGET_L` / `CHROMA_SHAPE` with the Step 1 expectations recomputed.

- [ ] **Step 6: Commit**

```bash
git add packages/editor/src/engine/designSystem/scale.ts packages/editor/src/engine/designSystem/__tests__/scale.test.ts
git commit -m "feat(brand): one colour to an 11-step OKLCH scale with light/dark aliases"
```

---

### Task 2: Brand colours from pixels, SVG and raw lists (pure)

**Files:**
- Create: `packages/editor/src/engine/designSystem/brandColors.ts`
- Test: `packages/editor/src/engine/designSystem/__tests__/brandColors.test.ts`

**Interfaces:**
- Consumes: `parseColor`, `rgbToHex`, `rgbToOklch` (`@/shared/utils/parsers`), `GOOGLE_FONT_CATALOGUE` (`@/shared/constants/googleFonts`).
- Produces:
  - `interface ColorCount { hex: string; count: number }`
  - `interface BrandRoles { primary: string; accent?: string }`
  - `quantizePixels(rgba: ArrayLike<number>): ColorCount[]` — top 12, count desc
  - `extractSvgColors(svg: string): ColorCount[]`
  - `normalizeColorCounts(raw: ReadonlyArray<{ value: string; count: number }>): ColorCount[]` — parses literals, drops non-opaque, merges by hex
  - `pickBrandRoles(colors: readonly ColorCount[]): BrandRoles | null`
  - `type GenericFamily = "serif" | "sans-serif" | "monospace"`
  - `mapFontFamily(family: string, generic?: GenericFamily): { family: string; replaced?: string }`
  - `downscaleSize(width: number, height: number, maxPixels?: number): { width: number; height: number }`

- [ ] **Step 1: Write the failing tests**

```ts
// packages/editor/src/engine/designSystem/__tests__/brandColors.test.ts
import { describe, it, expect } from "vitest";
import {
  quantizePixels, extractSvgColors, normalizeColorCounts, pickBrandRoles, mapFontFamily, downscaleSize,
} from "../brandColors";

function pixels(spec: Array<[string, number, number?]>): Uint8ClampedArray {
  const out: number[] = [];
  for (const [hex, n, alpha = 255] of spec) {
    const v = parseInt(hex.slice(1), 16);
    for (let i = 0; i < n; i++) out.push((v >> 16) & 255, (v >> 8) & 255, v & 255, alpha);
  }
  return new Uint8ClampedArray(out);
}

describe("quantizePixels (spec test 14: fixed images give fixed palettes)", () => {
  it("counts exact colours, most frequent first, and is deterministic", () => {
    const img = pixels([["#1A56DB", 60], ["#F59E0B", 30], ["#FFFFFF", 10]]);
    const out = quantizePixels(img);
    expect(out.slice(0, 3)).toEqual([
      { hex: "#1A56DB", count: 60 }, { hex: "#F59E0B", count: 30 }, { hex: "#FFFFFF", count: 10 },
    ]);
    expect(quantizePixels(img)).toEqual(out);
  });

  it("ignores transparent pixels", () => {
    expect(quantizePixels(pixels([["#000000", 500, 0], ["#C2410C", 5]]))).toEqual([{ hex: "#C2410C", count: 5 }]);
  });

  it("merges near-identical shades into one colour", () => {
    expect(quantizePixels(pixels([["#1A56DB", 50], ["#1B57DC", 50]]))).toHaveLength(1);
  });
});

describe("extractSvgColors (spec test 28: SVG parsed, never rasterized)", () => {
  it("reads fill, stroke and stop-color from attributes and style", () => {
    const svg = `<svg><path fill="#1A56DB"/><path style="fill:#1a56db;stroke:none"/>
      <circle fill="currentColor"/><stop stop-color="rgb(245,158,11)"/><rect fill="url(#g)"/></svg>`;
    expect(extractSvgColors(svg)).toEqual([{ hex: "#1A56DB", count: 2 }, { hex: "#F59E0B", count: 1 }]);
  });
});

describe("normalizeColorCounts", () => {
  it("parses literals, drops translucent ones, merges equal colours", () => {
    expect(normalizeColorCounts([
      { value: "#1a56db", count: 3 }, { value: "rgb(26, 86, 219)", count: 2 },
      { value: "rgba(0,0,0,.5)", count: 9 }, { value: "#zzz", count: 4 },
    ])).toEqual([{ hex: "#1A56DB", count: 5 }]);
  });
});

describe("pickBrandRoles (no AI — OQ-9)", () => {
  it("primary is the most saturated of the three most frequent brand colours; accent the next distinct hue", () => {
    expect(pickBrandRoles([
      { hex: "#0E7490", count: 60 }, { hex: "#1A56DB", count: 30 }, { hex: "#F59E0B", count: 10 },
      { hex: "#FFFFFF", count: 400 }, { hex: "#111827", count: 200 },
    ])).toEqual({ primary: "#1A56DB", accent: "#0E7490" });
  });

  it("returns null for a monochrome logo", () => {
    expect(pickBrandRoles([{ hex: "#000000", count: 90 }, { hex: "#FFFFFF", count: 300 }, { hex: "#E5E7EB", count: 4 }])).toBeNull();
  });
});

describe("mapFontFamily (OQ-11)", () => {
  it("keeps a catalogue family and replaces any other with its generic's first catalogue family", () => {
    expect(mapFontFamily("lora")).toEqual({ family: "Lora" });
    expect(mapFontFamily("Brand Sans Pro", "sans-serif")).toEqual({ family: "Inter", replaced: "Brand Sans Pro" });
    expect(mapFontFamily("Tiempos Headline", "serif")).toEqual({ family: "Playfair Display", replaced: "Tiempos Headline" });
    expect(mapFontFamily("Berkeley Mono")).toEqual({ family: "Fira Code", replaced: "Berkeley Mono" });
  });
});

describe("downscaleSize (spec test 28: > 4 MP downscaled)", () => {
  it("caps at 4 MP keeping the aspect ratio, leaves small images alone", () => {
    const big = downscaleSize(6000, 4000);
    expect(big.width * big.height).toBeLessThanOrEqual(4_000_000);
    expect(Math.abs(big.width / big.height - 1.5)).toBeLessThan(0.01);
    expect(downscaleSize(800, 600)).toEqual({ width: 800, height: 600 });
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run (from `packages/editor`): `npx vitest run src/engine/designSystem/__tests__/brandColors.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```ts
// packages/editor/src/engine/designSystem/brandColors.ts
/**
 * Brand colours from a logo or a site (spec §9, D13, D16). Pure and
 * deterministic: a logo's pixels are decoded by the browser and handed here;
 * an SVG is read as markup, never rasterized; a site's CSS literals come back
 * from the server as raw strings and are parsed here, with the same parser the
 * colour picker uses. Roles are picked without AI (OQ-9): the most saturated of
 * the three most frequent brand colours is Primary, the next colour with a
 * clearly different hue (≥ 30°) is Accent. Near-white, near-black and greys
 * are never brand colours.
 */
import { parseColor, rgbToHex, rgbToOklch } from "@/shared/utils/parsers";
import { GOOGLE_FONT_CATALOGUE } from "@/shared/constants/googleFonts";

export interface ColorCount { hex: string; count: number }
export interface BrandRoles { primary: string; accent?: string }
export type GenericFamily = "serif" | "sans-serif" | "monospace";

const MERGE_DISTANCE = 0.08; // OKLab ΔE under which two shades are one colour
const TOP = 12;

const hexOf = (r: number, g: number, b: number) => rgbToHex({ r, g, b }).toUpperCase();
const byCount = (a: ColorCount, b: ColorCount) => b.count - a.count || (a.hex < b.hex ? -1 : a.hex > b.hex ? 1 : 0);

function oklab(r: number, g: number, b: number) {
  const o = rgbToOklch({ r, g, b });
  const h = (o.h * Math.PI) / 180;
  return { l: o.l, a: o.c * Math.cos(h), b: o.c * Math.sin(h) };
}
const distance = (x: ReturnType<typeof oklab>, y: ReturnType<typeof oklab>) =>
  Math.hypot(x.l - y.l, x.a - y.a, x.b - y.b);

interface Cluster { n: number; r: number; g: number; b: number }

export function quantizePixels(rgba: ArrayLike<number>): ColorCount[] {
  const buckets = new Map<number, Cluster>();
  for (let i = 0; i + 3 < rgba.length; i += 4) {
    if (rgba[i + 3] < 128) continue;
    const key = ((rgba[i] >> 3) << 10) | ((rgba[i + 1] >> 3) << 5) | (rgba[i + 2] >> 3);
    const bucket = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
    bucket.n += 1;
    bucket.r += rgba[i];
    bucket.g += rgba[i + 1];
    bucket.b += rgba[i + 2];
    buckets.set(key, bucket);
  }
  const ranked = [...buckets.entries()].sort((x, y) => y[1].n - x[1].n || x[0] - y[0]).slice(0, 256);
  const clusters: Cluster[] = [];
  for (const [, bk] of ranked) {
    const at = oklab(bk.r / bk.n, bk.g / bk.n, bk.b / bk.n);
    const hit = clusters.find((c) => distance(oklab(c.r / c.n, c.g / c.n, c.b / c.n), at) < MERGE_DISTANCE);
    if (hit) {
      hit.n += bk.n;
      hit.r += bk.r;
      hit.g += bk.g;
      hit.b += bk.b;
    } else clusters.push({ ...bk });
  }
  return clusters
    .map((c) => ({ hex: hexOf(c.r / c.n, c.g / c.n, c.b / c.n), count: c.n }))
    .sort(byCount)
    .slice(0, TOP);
}

const SVG_COLOR_RE = /\b(?:fill|stroke|stop-color)\s*(?:=\s*"([^"]*)"|=\s*'([^']*)'|:\s*([^;"'}]+))/gi;

export function normalizeColorCounts(raw: ReadonlyArray<{ value: string; count: number }>): ColorCount[] {
  const counts = new Map<string, number>();
  for (const { value, count } of raw) {
    const rgb = parseColor(value.trim());
    if (!rgb || (rgb.a !== undefined && rgb.a < 1)) continue;
    const hex = hexOf(rgb.r, rgb.g, rgb.b);
    counts.set(hex, (counts.get(hex) ?? 0) + count);
  }
  return [...counts.entries()].map(([hex, count]) => ({ hex, count })).sort(byCount);
}

export function extractSvgColors(svg: string): ColorCount[] {
  const raw: Array<{ value: string; count: number }> = [];
  for (const m of svg.matchAll(SVG_COLOR_RE)) raw.push({ value: m[1] ?? m[2] ?? m[3] ?? "", count: 1 });
  return normalizeColorCounts(raw);
}

function chromaOf(hex: string) {
  const rgb = parseColor(hex)!;
  return rgbToOklch({ r: rgb.r, g: rgb.g, b: rgb.b });
}

export function pickBrandRoles(colors: readonly ColorCount[]): BrandRoles | null {
  const total = colors.reduce((n, c) => n + c.count, 0);
  if (total === 0) return null;
  const candidates = [...colors].sort(byCount).filter((c) => {
    const o = chromaOf(c.hex);
    return o.c >= 0.04 && o.l >= 0.2 && o.l <= 0.92 && c.count / total >= 0.02;
  });
  if (candidates.length === 0) return null;
  const primary = candidates.slice(0, 3).reduce((best, c) => (chromaOf(c.hex).c > chromaOf(best.hex).c ? c : best));
  const hue = chromaOf(primary.hex).h;
  const accent = candidates.find((c) => {
    if (c === primary) return false;
    const d = Math.abs(chromaOf(c.hex).h - hue) % 360;
    return Math.min(d, 360 - d) >= 30;
  });
  return accent ? { primary: primary.hex, accent: accent.hex } : { primary: primary.hex };
}

function guessGeneric(family: string): GenericFamily {
  if (/mono|code|courier|consol/i.test(family)) return "monospace";
  if (/serif|times|georgia|garamond|tiempos|playfair|merriweather|lora|baskerville/i.test(family) && !/sans/i.test(family)) {
    return "serif";
  }
  return "sans-serif";
}

export function mapFontFamily(family: string, generic?: GenericFamily): { family: string; replaced?: string } {
  const hit = GOOGLE_FONT_CATALOGUE.find((f) => f.family.toLowerCase() === family.trim().toLowerCase());
  if (hit) return { family: hit.family };
  const want = generic ?? guessGeneric(family);
  const fallback = GOOGLE_FONT_CATALOGUE.find((f) => f.category === want) ?? GOOGLE_FONT_CATALOGUE[0];
  return { family: fallback.family, replaced: family.trim() };
}

export function downscaleSize(width: number, height: number, maxPixels = 4_000_000): { width: number; height: number } {
  if (width * height <= maxPixels) return { width, height };
  const k = Math.sqrt(maxPixels / (width * height));
  return { width: Math.max(1, Math.floor(width * k)), height: Math.max(1, Math.floor(height * k)) };
}
```

If `mapFontFamily("Tiempos Headline", "serif")` returns another family, the catalogue's first serif entry has
changed — read `GOOGLE_FONT_CATALOGUE` and update the expectation to its first `serif`, not the code.

- [ ] **Step 4: Run to verify they pass**

Run (from `packages/editor`): `npx vitest run src/engine/designSystem/__tests__/brandColors.test.ts`
Expected: PASS (10 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/editor/src/engine/designSystem/brandColors.ts packages/editor/src/engine/designSystem/__tests__/brandColors.test.ts
git commit -m "feat(brand): deterministic brand colours from pixels, SVG markup and CSS literals"
```

---

### Task 3: Composer preview layer + `setDarkMode` (waits for 1b Task 4)

**Files:**
- Modify: `packages/editor/src/engine/designSystem/types.ts` (add `BrandPreview`)
- Modify: `packages/editor/src/shared/constants/events.ts` (`BRAND_PREVIEW_CHANGED` + payload map entry)
- Modify: `packages/editor/src/engine/Composer.ts` (`designSystem` type ~:193-258, object ~:318-367)
- Modify: `packages/editor/src/editor/design-system/ui/ProjectTokensApplier.tsx`
- Test: `packages/editor/src/engine/__tests__/Composer.darkMode.test.ts` (create), `packages/editor/src/editor/design-system/ui/__tests__/ProjectTokensApplier.v6.test.tsx` (append)

**Interfaces:**
- Consumes: `designSystem.setTokens` (with 1b's removal guard), `DarkMode` (`@buildrik/shared/schemas/design-tokens`).
- Produces:
  - `interface BrandPreview { tokens: DesignToken[]; darkMode: DarkMode; theme?: "light" | "dark" }`
  - `composer.designSystem.preview: BrandPreview | null` (read-only for callers)
  - `composer.designSystem.setPreview(p: BrandPreview | null): void` — emits `EVENTS.BRAND_PREVIEW_CHANGED`; never touches settings or history
  - `composer.designSystem.setDarkMode(mode: DarkMode, label: string, tokens?: DesignToken[]): boolean` — one transaction writing `designTokens` (given set, else the merged set) **and** `darkMode`; `false` and nothing written when read-only or the token write is refused

- [ ] **Step 1: Write the failing tests**

```ts
// packages/editor/src/engine/__tests__/Composer.darkMode.test.ts
import { describe, it, expect, beforeAll } from "vitest";
import { Composer } from "../Composer";
import { EVENTS } from "@/shared/constants/events";
import { DEFAULT_TOKENS } from "@/engine/designSystem/defaultTokens";
import { setTokenLiteral, resolveTokenLiteral } from "@buildrik/shared/tokens";

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = (() => ({
    drawImage: () => {}, getImageData: () => ({ data: new Uint8ClampedArray() }),
    putImageData: () => {}, clearRect: () => {},
  })) as unknown as HTMLCanvasElement["getContext"];
  (globalThis as { indexedDB?: unknown }).indexedDB = { open: () => ({}) };
});

function fresh(settings: Record<string, unknown> = {}): Composer {
  const c = new Composer({} as never);
  c.importProject({ pages: [{ id: "p", name: "P", slug: "", root: { id: "root", type: "container", tagName: "div", children: [] } }] } as never);
  c.setProjectSettings({ ...c.getProjectSettings(), ...settings });
  c.history.flushPending();
  return c;
}

describe("designSystem.setDarkMode", () => {
  it("writes designTokens even when none were saved (the server drops a darkMode without them)", () => {
    const c = fresh();
    expect(c.getProjectSettings().designTokens).toBeUndefined();
    expect(c.designSystem.setDarkMode("auto", "Turn on dark mode")).toBe(true);
    const s = c.getProjectSettings();
    expect(s.darkMode).toBe("auto");
    expect(Array.isArray(s.designTokens) && s.designTokens.length).toBeGreaterThan(0);
    expect(s.designTokensSchemaVersion).toBe(6);
  });

  it("tokens + Dark mode are ONE undo step", () => {
    const c = fresh({ designTokens: DEFAULT_TOKENS, designTokensSchemaVersion: 6, darkMode: "off" });
    const next = setTokenLiteral(DEFAULT_TOKENS, "color-secondary", "dark", "#111111");
    expect(c.designSystem.setDarkMode("auto", "Turn on dark mode", next)).toBe(true);
    c.history.flushPending();
    expect(c.getProjectSettings().darkMode).toBe("auto");
    c.history.undo();
    expect(c.getProjectSettings().darkMode).toBe("off");
    expect(resolveTokenLiteral(c.getProjectSettings().designTokens ?? [], "color-secondary", "dark")).toBe(
      resolveTokenLiteral(DEFAULT_TOKENS, "color-secondary", "dark"),
    );
  });

  it("writes nothing when read-only", () => {
    const c = fresh({ darkMode: "off" });
    c.designSystem.readOnly = true;
    expect(c.designSystem.setDarkMode("auto", "x")).toBe(false);
    expect(c.getProjectSettings().darkMode).toBe("off");
  });

  it("writes nothing when the token write is refused (invalid set)", () => {
    const c = fresh({ darkMode: "off" });
    const bad = [...DEFAULT_TOKENS, { ...DEFAULT_TOKENS[0] }]; // duplicate id
    expect(c.designSystem.setDarkMode("auto", "x", bad)).toBe(false);
    expect(c.getProjectSettings().darkMode).toBe("off");
  });
});

describe("designSystem preview", () => {
  it("never touches settings or history, and announces itself", () => {
    const c = fresh({ designTokens: DEFAULT_TOKENS, designTokensSchemaVersion: 6 });
    const before = JSON.stringify(c.getProjectSettings());
    let seen = 0;
    c.on(EVENTS.BRAND_PREVIEW_CHANGED, () => { seen += 1; });
    const canUndoBefore = c.history.canUndo();
    c.designSystem.setPreview({ tokens: DEFAULT_TOKENS, darkMode: "auto", theme: "dark" });
    expect(c.designSystem.preview?.theme).toBe("dark");
    c.designSystem.setPreview(null);
    c.history.flushPending();
    expect(JSON.stringify(c.getProjectSettings())).toBe(before);
    expect(c.history.canUndo()).toBe(canUndoBefore);
    expect(seen).toBe(2);
  });
});
```

Append to `ProjectTokensApplier.v6.test.tsx` (its `fakeComposer` gains a `designSystem` field):

```tsx
it("paints the preview first, with its theme, and goes back when it clears", () => {
  const settings = { designTokens: DEFAULT_TOKENS, designTokensSchemaVersion: 6, darkMode: "off" };
  const c = { ...fakeComposer(settings), designSystem: { preview: null as null | { tokens: unknown[]; darkMode: "auto"; theme: "dark" } } };
  render(<ProjectTokensApplier composer={c as never} />);
  act(() => { vi.advanceTimersToNextFrame(); });
  const off = document.getElementById("bk-site-tokens")!.textContent;
  expect(off).not.toContain("prefers-color-scheme");

  c.designSystem.preview = { tokens: DEFAULT_TOKENS, darkMode: "auto", theme: "dark" };
  act(() => { c.emit("brand:preview-changed"); vi.advanceTimersToNextFrame(); });
  expect(document.getElementById("bk-site-tokens")!.textContent).toContain(':root[data-theme="dark"]');
  expect(document.documentElement.dataset.theme).toBe("dark");

  c.designSystem.preview = null;
  act(() => { c.emit("brand:preview-changed"); vi.advanceTimersToNextFrame(); });
  expect(document.getElementById("bk-site-tokens")!.textContent).toBe(off);
  expect(document.documentElement.dataset.theme).toBe("light");
});
```

- [ ] **Step 2: Run to verify they fail**

Run (from `packages/editor`): `npx vitest run src/engine/__tests__/Composer.darkMode.test.ts src/editor/design-system/ui/__tests__/ProjectTokensApplier.v6.test.tsx`
Expected: FAIL — `setDarkMode is not a function`, `BRAND_PREVIEW_CHANGED` undefined, applier ignores the preview.

- [ ] **Step 3: Implement**

`engine/designSystem/types.ts` — add:

```ts
import type { DarkMode } from "@buildrik/shared/schemas/design-tokens";

/** A token set painted on the canvas INSTEAD of the saved one while a Brand
 *  flow previews (Dark Auto, generator, logo/URL). Never saved, never in
 *  history; `theme` forces the canvas light or dark for the preview. */
export interface BrandPreview {
  tokens: DesignToken[];
  darkMode: DarkMode;
  theme?: "light" | "dark";
}
```

`shared/constants/events.ts` — next to `BRAND_APPLIED`:

```ts
  /** The canvas brand preview changed (set or cleared) — `designSystem.setPreview`. */
  BRAND_PREVIEW_CHANGED: "brand:preview-changed",
```

and in the payload map: `[EVENTS.BRAND_PREVIEW_CHANGED]: void;`

`Composer.ts` — in the `designSystem` type (after `setTokens`):

```ts
    /** The canvas preview, or null. Set only through `setPreview`. */
    preview: BrandPreview | null;
    /** Paint `p` on the canvas instead of the saved tokens (null = back to the
     *  saved ones). Touches neither settings nor history. */
    readonly setPreview: (p: BrandPreview | null) => void;
    /**
     * Writes the site's Dark mode AND its tokens in ONE transaction (one ⌘Z).
     * Tokens are always written — `tokens` when given, else the current merged
     * set — because the save path keeps the stored darkMode when a payload
     * carries no designTokens (sites.service withCheckedTokens). False, and
     * nothing written, when read-only or the token write is refused.
     */
    readonly setDarkMode: (mode: DarkMode, label: string, tokens?: DesignToken[]) => boolean;
```

and in the object literal, after `setTokens`:

```ts
      preview: null,
      setPreview: (p) => {
        this.designSystem.preview = p;
        this.emit(EVENTS.BRAND_PREVIEW_CHANGED, undefined);
      },
      setDarkMode: (mode, label, tokens) => {
        if (this.designSystem.readOnly) return false;
        this.beginTransaction(label);
        try {
          if (!this.designSystem.setTokens(tokens ?? this.mergedDesignTokens(), label)) return false;
          this.setProjectSettings({ ...this.getProjectSettings(), darkMode: mode });
          return true;
        } finally {
          this.endTransaction();
        }
      },
```

(`readonly designSystem!` keeps the object reference read-only; `preview` is a mutable field on it, like
`readOnly`. Import `BrandPreview` from `./designSystem/types` and `DarkMode` from
`@buildrik/shared/schemas/design-tokens`.)

`ProjectTokensApplier.tsx` — inside `write`:

```ts
      const preview = composer.designSystem?.preview ?? null;
      const settings = composer.getProjectSettings?.();
      const darkMode = preview?.darkMode ?? DarkModeSchema.catch("off").parse(settings?.darkMode);
      const tokens = preview?.tokens ?? tokensForEmit(settings, { migrate: composer.designSystem?.brandTokensV2 !== false });
      …
      document.documentElement.dataset.theme =
        preview?.theme ?? (darkMode === "off" ? "light" : (composer.colorMode?.resolved?.() ?? "light"));
```

and subscribe/unsubscribe `EVENTS.BRAND_PREVIEW_CHANGED` with `schedule` next to the other three events.
Update the file header: "A Brand flow's preview (`designSystem.preview`) is painted instead of the saved
tokens while it is set."

- [ ] **Step 4: Run to verify they pass**

Run (from `packages/editor`): `npx vitest run src/engine/__tests__/Composer.darkMode.test.ts src/engine/__tests__/Composer.setTokens.test.ts src/engine/__tests__/HistoryManager.undoScope.test.ts src/editor/design-system/ui/__tests__`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/editor/src/engine/designSystem/types.ts packages/editor/src/shared/constants/events.ts packages/editor/src/engine/Composer.ts packages/editor/src/editor/design-system/ui/ProjectTokensApplier.tsx packages/editor/src/engine/__tests__/Composer.darkMode.test.ts packages/editor/src/editor/design-system/ui/__tests__/ProjectTokensApplier.v6.test.tsx
git commit -m "feat(brand): canvas preview layer and setDarkMode as one undoable write"
```

---

### Task 4: Theme-toggle runtime, boot script and export wiring

**Files:**
- Create: `packages/editor/src/engine/export/themeToggleRuntime.ts`
- Modify: `packages/editor/src/engine/export/ExportHelpers.ts` (`emitSiteTokenCss` ~:119)
- Modify: `packages/editor/src/engine/export/ExportEngine.ts` (single-file token CSS ~:367 and head/body ~:600-697; multi-page token CSS ~:820 and head/body ~:1000-1030)
- Modify: `packages/editor/src/editor/design-system/ui/ProjectTokensApplier.tsx` (append toggle CSS)
- Test: `packages/editor/src/engine/export/__tests__/themeToggleRuntime.test.ts`, `packages/editor/src/engine/export/__tests__/ExportEngine.themeToggle.test.ts` (create both)

**Interfaces:**
- Consumes: `Element.getAttribute`, `ElementManager.getAllElements()` (all pages).
- Produces:
  - `THEME_TOGGLE_ATTR = "data-bk-theme-toggle"`, `THEME_TOGGLE_ICON_ATTR = "data-bk-tt"` (values `"light" | "dark"`), `THEME_STORAGE_KEY = "buildrick-theme"`
  - `initThemeToggleRuntime(root: ParentNode): () => void` (import-free; serialized)
  - `THEME_BOOT_SCRIPT: string`, `buildThemeToggleRuntimeScript(): string`
  - `themeToggleCss(state: "show" | "hide"): string`
  - `siteHasThemeToggle(elements: readonly { getAttribute(name: string): string | undefined }[]): boolean`
  - `emitSiteTokenCss(settings, opts?: { migrate: boolean; hasThemeToggle?: boolean })` — appends `themeToggleCss("show")` when Auto, `("hide")` when Off, nothing when the site has no toggle (existing output byte-for-byte unchanged)

- [ ] **Step 1: Write the failing tests**

```ts
// packages/editor/src/engine/export/__tests__/themeToggleRuntime.test.ts
// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";
import { initThemeToggleRuntime, THEME_BOOT_SCRIPT, themeToggleCss, siteHasThemeToggle } from "../themeToggleRuntime";

const prefersDark = (dark: boolean) =>
  vi.stubGlobal("matchMedia", (q: string) => ({ matches: dark && q.includes("dark") }));

beforeEach(() => {
  document.documentElement.removeAttribute("data-theme");
  localStorage.clear();
  document.body.innerHTML = `<button data-bk-theme-toggle="true"><span data-bk-tt="light"></span><span data-bk-tt="dark"></span></button>`;
});

describe("theme toggle runtime (spec D12, test 22)", () => {
  it("flips data-theme from the OS default, persists the choice and reports it", () => {
    prefersDark(false);
    initThemeToggleRuntime(document);
    const btn = document.querySelector("button")!;
    btn.click();
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(localStorage.getItem("buildrick-theme")).toBe("dark");
    expect(btn.getAttribute("aria-pressed")).toBe("true");
    btn.querySelector("span")!.click(); // a click on the icon counts
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });

  it("starts from dark when the visitor's OS is dark", () => {
    prefersDark(true);
    initThemeToggleRuntime(document);
    document.querySelector("button")!.click();
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });

  it("the boot script applies a stored choice before paint (no flash)", () => {
    localStorage.setItem("buildrick-theme", "dark");
    new Function(THEME_BOOT_SCRIPT.replace(/^<script[^>]*>|<\/script>$/g, ""))();
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("the boot script ignores anything that is not light or dark", () => {
    localStorage.setItem("buildrick-theme", "purple");
    new Function(THEME_BOOT_SCRIPT.replace(/^<script[^>]*>|<\/script>$/g, ""))();
    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
  });

  it("serializes without module references", () => {
    expect(initThemeToggleRuntime.toString()).not.toMatch(/THEME_|import\(|require\(/);
  });

  it("hide CSS hides every toggle; show CSS swaps the icons by theme", () => {
    expect(themeToggleCss("hide")).toContain("[data-bk-theme-toggle]{display:none!important}");
    expect(themeToggleCss("show")).toContain(':root[data-theme="dark"] [data-bk-theme-toggle] [data-bk-tt="light"]{display:none!important}');
  });

  it("finds a toggle on any page", () => {
    const el = (attrs: Record<string, string>) => ({ getAttribute: (n: string) => attrs[n] });
    expect(siteHasThemeToggle([el({}), el({ "data-bk-theme-toggle": "true" })])).toBe(true);
    expect(siteHasThemeToggle([el({})])).toBe(false);
  });
});
```

```ts
// packages/editor/src/engine/export/__tests__/ExportEngine.themeToggle.test.ts
import { describe, it, expect, beforeAll } from "vitest";
import { Composer } from "../../Composer";
import { ExportEngine } from "../ExportEngine";
import { DEFAULT_TOKENS } from "@/engine/designSystem/defaultTokens";

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = (() => ({
    drawImage: () => {}, getImageData: () => ({ data: new Uint8ClampedArray() }),
    putImageData: () => {}, clearRect: () => {},
  })) as unknown as HTMLCanvasElement["getContext"];
  (globalThis as { indexedDB?: unknown }).indexedDB = { open: () => ({}) };
});

function site(darkMode: "auto" | "off", withToggle: boolean) {
  const c = new Composer({} as never);
  const children = withToggle
    ? [{ id: "tt", type: "button", tagName: "button", attributes: { "data-bk-theme-toggle": "true" }, children: [] }]
    : [];
  c.importProject({ pages: [{ id: "p", name: "Home", slug: "", isHome: true, root: { id: "root", type: "container", tagName: "div", children } }] } as never);
  c.setProjectSettings({ ...c.getProjectSettings(), designTokens: DEFAULT_TOKENS, designTokensSchemaVersion: 6, darkMode });
  return c;
}

const head = (html: string) => html.slice(0, html.indexOf("</head>"));
const body = (html: string) => html.slice(html.indexOf("<body>"));

describe("theme toggle in export and publish (spec D12, test 22)", () => {
  it("Auto: boot script first in head, runtime in body, icon-swap CSS, on single file and every published page", async () => {
    const single = new ExportEngine(site("auto", true)).generateHTML();
    const { files } = await new ExportEngine(site("auto", true)).exportAllPages({ format: "html" });
    const published = files.find((f) => f.name === "index.html")!.content;
    for (const html of [single, published]) {
      expect(html).toContain('data-bk-theme-toggle="true"');
      const h = head(html);
      expect(h).toContain("data-buildrick-theme-boot");
      expect(h.indexOf("data-buildrick-theme-boot")).toBeLessThan(h.indexOf("<style") === -1 ? Infinity : h.indexOf("<style"));
      expect(body(html)).toContain("data-buildrick-theme-toggle-runtime");
    }
    const css = files.find((f) => f.name.endsWith(".css"))?.content ?? published;
    expect(css + single).toContain('[data-bk-tt="light"]{display:none!important}');
  });

  it("Off: every toggle hidden on publish; no boot script, no runtime", () => {
    const html = new ExportEngine(site("off", true)).generateHTML();
    expect(html).toContain("[data-bk-theme-toggle]{display:none!important}");
    expect(html).not.toContain("data-buildrick-theme-boot");
    expect(html).not.toContain("data-buildrick-theme-toggle-runtime");
  });

  it("a site with no toggle is byte-for-byte what it was", () => {
    const html = new ExportEngine(site("auto", false)).generateHTML();
    expect(html).not.toContain("data-bk-theme-toggle");
    expect(html).not.toContain("data-buildrick-theme");
  });
});
```

If the importer's element shape uses a different key than `attributes`, read the fixture shape from an
existing ExportEngine test that sets an attribute (`ExportEngine.blockLink.test.ts`) and use that. If the
toggle attribute does not reach the HTML at all, the element writer filters it — fix the writer's allow-list
for `data-bk-*`, not the test.

- [ ] **Step 2: Run to verify they fail**

Run (from `packages/editor`): `npx vitest run src/engine/export/__tests__/themeToggleRuntime.test.ts src/engine/export/__tests__/ExportEngine.themeToggle.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement** `themeToggleRuntime.ts`:

```ts
// packages/editor/src/engine/export/themeToggleRuntime.ts
/**
 * Theme-toggle block (spec §2, D12). A button carrying `data-bk-theme-toggle`
 * flips `data-theme` on <html> and remembers the visitor's choice in
 * localStorage. A tiny boot script in <head> applies a stored choice before
 * first paint (no flash). Same single-source model as `interactionRuntime.ts`:
 * the runtime function is serialized into the page, so it must not reference
 * anything outside itself — its literals repeat the constants below on purpose.
 *
 * Off sites: every toggle is hidden on export/publish (`themeToggleCss("hide")`)
 * and listed as a Brand check; the canvas still shows it, with the board's note.
 *
 * @license BSD-3-Clause
 */

export const THEME_TOGGLE_ATTR = "data-bk-theme-toggle";
export const THEME_TOGGLE_ICON_ATTR = "data-bk-tt";
export const THEME_STORAGE_KEY = "buildrick-theme";

export function initThemeToggleRuntime(root: ParentNode): () => void {
  const html = document.documentElement;
  const current = (): "light" | "dark" => {
    const set = html.getAttribute("data-theme");
    if (set === "light" || set === "dark") return set;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  };
  const sync = () => {
    const pressed = current() === "dark" ? "true" : "false";
    root.querySelectorAll("[data-bk-theme-toggle]").forEach((b) => b.setAttribute("aria-pressed", pressed));
  };
  const onClick = (e: Event) => {
    const target = e.target instanceof Element ? e.target : null;
    if (!target || !target.closest("[data-bk-theme-toggle]")) return;
    const next = current() === "dark" ? "light" : "dark";
    html.setAttribute("data-theme", next);
    try {
      localStorage.setItem("buildrick-theme", next);
    } catch (_) {
      /* storage blocked (private mode): the choice lasts this page view */
    }
    sync();
  };
  root.addEventListener("click", onClick);
  sync();
  return () => root.removeEventListener("click", onClick);
}

export const THEME_BOOT_SCRIPT =
  '<script data-buildrick-theme-boot>try{var t=localStorage.getItem("buildrick-theme");' +
  'if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}</script>';

export function buildThemeToggleRuntimeScript(): string {
  const call = `(${initThemeToggleRuntime.toString()})(document);`;
  return (
    `<script data-buildrick-theme-toggle-runtime>(function(){if(document.readyState==="loading"){` +
    `document.addEventListener("DOMContentLoaded",function(){${call}});}else{${call}}})();</script>`
  );
}

const DARK = '[data-theme="dark"]';
const OS_DARK_SCOPE = ':root:not([data-theme="light"])';
const ICON = (mode: "light" | "dark") => `[data-bk-theme-toggle] [data-bk-tt="${mode}"]`;

export function themeToggleCss(state: "show" | "hide"): string {
  if (state === "hide") return "\n[data-bk-theme-toggle]{display:none!important}\n";
  return (
    `\n${ICON("dark")}{display:none!important}` +
    `@media (prefers-color-scheme: dark){${OS_DARK_SCOPE} ${ICON("light")}{display:none!important}${OS_DARK_SCOPE} ${ICON("dark")}{display:inline-flex!important}}` +
    `:root${DARK} ${ICON("light")}{display:none!important}:root${DARK} ${ICON("dark")}{display:inline-flex!important}\n`
  );
}

export function siteHasThemeToggle(elements: readonly { getAttribute(name: string): string | undefined }[]): boolean {
  return elements.some((el) => el.getAttribute(THEME_TOGGLE_ATTR) !== undefined);
}
```

`ExportHelpers.ts` — `emitSiteTokenCss`:

```ts
export function emitSiteTokenCss(
  settings: SiteTokenSettings | undefined,
  opts?: { migrate: boolean; hasThemeToggle?: boolean },
): string {
  const darkMode = DarkModeSchema.catch("off").parse(settings?.darkMode);
  const css = emitTokenCss(tokensForEmit(settings, opts), {
    darkMode,
    onSkip: (id, reason) => console.warn(`[tokens] skipped ${id}: ${reason}`),
  });
  return opts?.hasThemeToggle ? css + themeToggleCss(darkMode === "auto" ? "show" : "hide") : css;
}
```

`ExportEngine.ts`:
- a private `themeToggleState(): { has: boolean; auto: boolean }` reading
  `siteHasThemeToggle(this.composer.elements.getAllElements())` and the settings' Dark mode
  (`DarkModeSchema.catch("off")`);
- both `emitSiteTokenCss(...)` calls pass `{ ...this.brandSwitch(), hasThemeToggle: state.has }`;
- single file: when `state.has && state.auto`, prepend `${indent}${THEME_BOOT_SCRIPT}${nl}` to `head` (first
  thing in `<head>`, before any `<style>`), and when the page content includes `THEME_TOGGLE_ATTR`, add
  `buildThemeToggleRuntimeScript() + nl` next to `interactionScript`;
- multi-page: `headParts.unshift(\`  ${THEME_BOOT_SCRIPT}\`)` under the same condition, and the runtime next to
  that page's `interactionScript` when `bodyContent.includes(THEME_TOGGLE_ATTR)`.

`ProjectTokensApplier.tsx` — after `emitTokenCss(...)`: when
`siteHasThemeToggle(composer.elements?.getAllElements?.() ?? [])`, append `themeToggleCss("show")` (the
canvas always shows the toggle, even on an Off site — the board draws it there with its note). Re-schedule on
`EVENTS.ELEMENT_CREATED` / `EVENTS.ELEMENT_DELETED` too (read the exact event names in `events.ts`), so an
inserted toggle gets its icon CSS at once.

- [ ] **Step 4: Run to verify they pass**

Run (from `packages/editor`): `npx vitest run src/engine/export src/editor/design-system/ui/__tests__`
Expected: PASS, including the existing `ExportEngine.siteTokens` / `tokenClosure` / `singleFileParity` tests
unchanged (no toggle → no change).

- [ ] **Step 5: Commit**

```bash
git add packages/editor/src/engine/export packages/editor/src/editor/design-system/ui/ProjectTokensApplier.tsx
git commit -m "feat(brand): theme-toggle runtime, no-flash boot script, hidden on publish when Dark mode is Off"
```

---

### Task 5: Theme-toggle block + its Brand check (waits for 1b Tasks 6–7)

**Files:**
- Create: `packages/editor/src/blocks/Basic/ThemeToggle.ts`
- Modify: `packages/editor/src/blocks/Basic/index.ts`, `packages/editor/src/blocks/blockRegistry.ts` (import + list in `blockDefinitions`)
- Modify: `packages/editor/src/engine/designSystem/linter/DSLinter.ts` (`LintRuleId` += `"theme-toggle-hidden"`)
- Modify: `packages/editor/src/editor/design-system/state/useDSLint.ts`
- Test: `packages/editor/src/blocks/__tests__/ThemeToggle.test.ts` (create), `packages/editor/src/editor/design-system/state/__tests__/useDSLint.themeToggle.test.tsx` (create)

**Interfaces:**
- Consumes: Task 4 constants; 1b Task 6 seed vars; 1b Task 7's `blockRegistry.insertBound.test.ts` (it scans every registry block, so this one is covered automatically).
- Produces:
  - `themeToggleBlockConfig: BlockBuildConfig` (`id: "theme-toggle"`, `label: "Theme toggle"`, `elementType: "button"`, `category: "Basic"`)
  - `isThemeToggleOffered(darkMode: DarkMode): boolean` — exported from `ThemeToggle.ts`; the Add panel (Task 14) and search filter on it
  - Lint issue `{ rule: "theme-toggle-hidden", severity: "warning", tokenId: "site", message: "Dark mode is off, so the theme toggle is hidden on the published site." }` when Dark mode is Off and the site has a toggle

- [ ] **Step 1: Write the failing tests**

```ts
// packages/editor/src/blocks/__tests__/ThemeToggle.test.ts
import { describe, it, expect, beforeAll } from "vitest";
import { Composer } from "@/engine/Composer";
import { themeToggleBlockConfig, isThemeToggleOffered } from "../Basic/ThemeToggle";
import { getBlockById } from "../blockRegistry";

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = (() => ({
    drawImage: () => {}, getImageData: () => ({ data: new Uint8ClampedArray() }),
    putImageData: () => {}, clearRect: () => {},
  })) as unknown as HTMLCanvasElement["getContext"];
  (globalThis as { indexedDB?: unknown }).indexedDB = { open: () => ({}) };
});

describe("theme-toggle block (spec D12)", () => {
  it("is registered and offered only when Dark mode is Auto", () => {
    expect(getBlockById("theme-toggle")).toBe(themeToggleBlockConfig);
    expect(isThemeToggleOffered("auto")).toBe(true);
    expect(isThemeToggleOffered("off")).toBe(false);
  });

  it("inserts a token-bound button with a light and a dark icon", () => {
    const c = new Composer({} as never);
    c.importProject({ pages: [{ id: "p", name: "P", slug: "", root: { id: "root", type: "container", tagName: "div", children: [] } }] } as never);
    const id = themeToggleBlockConfig.build!(c, "root")!;
    const btn = c.elements.getElement(id)!;
    expect(btn.getAttribute("data-bk-theme-toggle")).toBe("true");
    expect(btn.getAttribute("aria-label")).toBe("Switch light or dark theme");
    const icons = btn.getChildren().map((ch) => ch.getAttribute("data-bk-tt"));
    expect(icons).toEqual(["light", "dark"]);
    const styles = JSON.stringify(btn.getStyles());
    expect(styles).toContain("var(--buildrick-design-color-surface-raised)");
    expect(styles).toContain("var(--buildrick-design-color-text-strong)");
    expect(styles).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    for (const ch of btn.getChildren()) expect(JSON.stringify(ch.getStyles())).not.toContain("display");
  });
});
```

(`getStyles()` — use the Element accessor the 1b insert-bound test uses if it is named differently.)

```tsx
// packages/editor/src/editor/design-system/state/__tests__/useDSLint.themeToggle.test.tsx
// Render useDSLint through the same harness as the existing useDSLint tests in this folder (read one first).
// Case 1: settings.darkMode "off" + composer.elements.getAllElements() returns one element whose
//   getAttribute("data-bk-theme-toggle") is "true" → after the debounce, issues contain
//   { rule: "theme-toggle-hidden", tokenId: "site", severity: "warning" }.
// Case 2: same with darkMode "auto" → no such issue.
// Case 3: darkMode "off", no toggle → no such issue.
```

Write the three cases as real `it` blocks against that harness (fake timers, `act(() => vi.advanceTimersByTime(DEBOUNCE_MS))`).

- [ ] **Step 2: Run to verify they fail**

Run (from `packages/editor`): `npx vitest run src/blocks/__tests__/ThemeToggle.test.ts src/editor/design-system/state/__tests__/useDSLint.themeToggle.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// packages/editor/src/blocks/Basic/ThemeToggle.ts
/**
 * Theme toggle (spec §2, D12): a button visitors use to switch an Auto site
 * between light and dark. Token-bound like every inserted block (§3), no
 * fallbacks. The two icon children carry `data-bk-tt`; which one shows is
 * decided by `themeToggleCss` (engine/export/themeToggleRuntime.ts), so they
 * must not carry an inline `display`. Offered only when Dark mode is Auto.
 *
 * @license BSD-3-Clause
 */
import type { DarkMode } from "@buildrik/shared/schemas/design-tokens";
import { THEME_TOGGLE_ATTR, THEME_TOGGLE_ICON_ATTR } from "../../engine/export/themeToggleRuntime";
import type { BlockBuildConfig, Composer } from "../types";

const SUN = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-icon="sun" data-library="lucide"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`;
const MOON = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-icon="moon" data-library="lucide"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`;

export const isThemeToggleOffered = (darkMode: DarkMode): boolean => darkMode === "auto";

function buildThemeToggle(composer: Composer, parentId: string, dropIndex?: number): string {
  const button = composer.elements.createElement("button", {});
  button.setStyles({
    display: "inline-flex",
    "align-items": "center",
    "justify-content": "center",
    width: "var(--buildrick-design-btn-height-md)",
    height: "var(--buildrick-design-btn-height-md)",
    padding: "0",
    "background-color": "var(--buildrick-design-color-surface-raised)",
    color: "var(--buildrick-design-color-text-strong)",
    "border-width": "1px",
    "border-style": "solid",
    "border-color": "var(--buildrick-design-color-border-subtle)",
    "border-radius": "var(--buildrick-design-radius-full)",
    cursor: "pointer",
  });
  button.setAttribute(THEME_TOGGLE_ATTR, "true");
  button.setAttribute("aria-label", "Switch light or dark theme");
  button.setAttribute("type", "button");
  for (const [mode, svg] of [["light", SUN], ["dark", MOON]] as const) {
    const icon = composer.elements.createElement("icon", { content: svg });
    icon.setAttribute(THEME_TOGGLE_ICON_ATTR, mode);
    icon.setAttribute("aria-hidden", "true");
    button.addChild(icon);
  }
  composer.elements.addElement(button, parentId, dropIndex);
  return button.getId();
}

export const themeToggleBlockConfig: BlockBuildConfig = {
  id: "theme-toggle",
  label: "Theme toggle",
  category: "Basic",
  elementType: "button",
  icon: "/src/assets/icons/blocks/basic/button.svg",
  content: "",
  build: buildThemeToggle,
};
```

Check `radius-full`'s real var name in `defaultTokens.ts` (`--buildrick-design-radius-full` or `--bd-*`) and
use it. If `button.addChild` before `addElement` does not register the children with the manager, follow how
`blocks/Components/Tabs.tsx`'s builder adds children and do the same. The 1b insert-bound test must pass with
no allow-list entry for this block.

`useDSLint.ts` — in the timer callback, after the contrast issues:

```ts
      const settings = composer.getProjectSettings?.();
      const off = DarkModeSchema.catch("off").parse(settings?.darkMode) === "off";
      const hiddenToggle = off && siteHasThemeToggle(composer.elements?.getAllElements?.() ?? [])
        ? [{ rule: "theme-toggle-hidden" as const, severity: "warning" as const, tokenId: "site",
             message: "Dark mode is off, so the theme toggle is hidden on the published site." }]
        : [];
      const found = [...composer.dsLinter.lint(allTokens), ...buildContrastIssues(colorState?.tokens ?? [], mode), ...hiddenToggle];
```

and add `EVENTS.SETTINGS_CHANGE` plus the element create/delete events to the effect's re-run triggers (a
`settingsNonce` bumped by a listener, the same shape as `runNonce`). Add `"theme-toggle-hidden"` to
`LintRuleId` with a comment: "Computed editor-side from settings + elements, like contrast."

- [ ] **Step 4: Run to verify they pass**

Run (from `packages/editor`): `npx vitest run src/blocks src/editor/design-system/state src/editor/sidebar/tabs/build`
Expected: PASS, including 1b's `blockRegistry.insertBound.test.ts` and `catalog.test.ts`.

- [ ] **Step 5: Commit**

```bash
git add packages/editor/src/blocks packages/editor/src/engine/designSystem/linter/DSLinter.ts packages/editor/src/editor/design-system/state
git commit -m "feat(brand): theme-toggle block, token-bound, with a Brand check when Dark mode is Off"
```

---

### Task 6: Restore points — create and read one (server)

**Files:**
- Modify: `packages/shared/schemas/theme.ts`
- Modify: `server/services/theme.service.ts` (after `listBrandRestorePoints` ~:558)
- Modify: `server/trpc/routers/theme.ts` (next to `brandRestorePoints` ~:162)
- Test: `server/trpc/routers/__tests__/theme-brand-restore-points.test.ts` (append), `__tests__/db/brand-restore-points.db.test.ts` (create)

**Interfaces:**
- Consumes: `validateTokens`, `TOKENS_SCHEMA_VERSION`, `DarkModeSchema`; `readTokenTheme`, `pruneThemeSnapshots`, `ThemeError` (same file).
- Produces:
  - `brandRestorePointReason = z.enum(["generator", "dark-auto", "logo"])`
  - `createBrandRestorePointInput = { siteId, reason, designTokens: unknown[] (≤ 2000), designPresets?: unknown[] (≤ 500), darkMode: DarkMode }`
  - `brandRestorePointInput = { siteId, id }`
  - `createBrandRestorePoint(input): Promise<{ id: string; createdAt: Date }>`
  - `interface BrandRestorePoint { id; reason; createdAt; designTokens: unknown[]; designPresets?: unknown[]; tokensSchemaVersion: number; darkMode: DarkMode | null }`
  - `getBrandRestorePoint(siteId, id): Promise<BrandRestorePoint>`
  - tRPC `theme.createBrandRestorePoint` (mutation), `theme.brandRestorePoint` (query) — both EDITOR on the site, no agency gate

- [ ] **Step 1: Write the failing tests**

Router (append to `theme-brand-restore-points.test.ts`; add `createBrandRestorePoint` / `getBrandRestorePoint`
mocks to its `vi.mock("@/server/services/theme.service", …)` factory):

```ts
describe("theme.createBrandRestorePoint / brandRestorePoint (spec test 27)", () => {
  const input = { siteId: "s1", reason: "generator" as const, designTokens: [], darkMode: "off" as const };

  it("lets an editor create and read, with no agency gate", async () => {
    checkSiteRoleMock.mockResolvedValue(undefined);
    createBrandRestorePointMock.mockResolvedValueOnce({ id: "r1", createdAt: new Date(1) });
    getBrandRestorePointMock.mockResolvedValueOnce({ id: "r1", designTokens: [], tokensSchemaVersion: 6, darkMode: "off" });
    await expect(caller().createBrandRestorePoint(input)).resolves.toMatchObject({ id: "r1" });
    await expect(caller().brandRestorePoint({ siteId: "s1", id: "r1" })).resolves.toMatchObject({ id: "r1" });
    expect(checkSiteRoleMock.mock.calls.every((c) => c[3] === "EDITOR")).toBe(true);
  });

  it("refuses a VIEWER before the service is reached", async () => {
    checkSiteRoleMock.mockRejectedValue(new PermissionError("FORBIDDEN", "viewer"));
    await expect(caller().createBrandRestorePoint(input)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller().brandRestorePoint({ siteId: "s1", id: "r1" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(createBrandRestorePointMock).not.toHaveBeenCalled();
    expect(getBrandRestorePointMock).not.toHaveBeenCalled();
  });

  it("refuses server-only reasons at the schema", async () => {
    checkSiteRoleMock.mockResolvedValue(undefined);
    await expect(caller().createBrandRestorePoint({ ...input, reason: "migration" as never })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
```

DB tier:

```ts
// __tests__/db/brand-restore-points.db.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { createBrandRestorePoint, getBrandRestorePoint, listBrandRestorePoints, ThemeError } from "@/server/services/theme.service";
import { migrateTokensToV6 } from "@buildrik/shared/tokens";
import v5seed from "@buildrik/shared/tokens/__tests__/__fixtures__/seed-only.json";
import { createTestUser, createTestWorkspace, createTestSite, truncateTables } from "./helpers";

const v6 = migrateTokensToV6(v5seed);

beforeEach(async () => { await truncateTables("site", "workspace", "user"); });

async function site() {
  const user = await createTestUser();
  const workspace = await createTestWorkspace({ ownerId: user.id });
  return createTestSite({ workspaceId: workspace.id, createdBy: user.id, projectSettings: { designTokens: v6, designTokensSchemaVersion: 6, darkMode: "off" } });
}

describe("Brand restore points (spec §8, tests 13, 17)", () => {
  it("stores tokens + Dark mode, reads them back, and moves neither lastEditedAt nor dsSchemaVersion", async () => {
    const s = await site();
    const { id } = await createBrandRestorePoint({ siteId: s.id, reason: "dark-auto", designTokens: v6, darkMode: "off" });
    const after = await prisma.site.findUniqueOrThrow({ where: { id: s.id } });
    expect(after.lastEditedAt.getTime()).toBe(s.lastEditedAt.getTime());
    expect(after.dsSchemaVersion).toBe(s.dsSchemaVersion);
    const point = await getBrandRestorePoint(s.id, id);
    expect(point).toMatchObject({ reason: "dark-auto", tokensSchemaVersion: 6, darkMode: "off" });
    expect(point.designTokens).toEqual(v6);
  });

  it("refuses an invalid token set and writes nothing", async () => {
    const s = await site();
    await expect(createBrandRestorePoint({ siteId: s.id, reason: "generator", designTokens: [{ id: "x" }], darkMode: "off" }))
      .rejects.toBeInstanceOf(ThemeError);
    expect(await prisma.siteThemeSnapshot.count({ where: { siteId: s.id } })).toBe(0);
  });

  it("caps at 10 (migration rows exempt) — the 11th prunes the oldest", async () => {
    const s = await site();
    await prisma.siteThemeSnapshot.create({ data: { siteId: s.id, workspaceId: s.workspaceId, reason: "migration", prevStyles: { designTokens: [] }, prevDsSchemaVersion: 0, tokensSchemaVersion: 5, createdAt: new Date(1) } });
    for (let i = 0; i < 11; i++) await createBrandRestorePoint({ siteId: s.id, reason: "generator", designTokens: v6, darkMode: "off" });
    expect(await prisma.siteThemeSnapshot.count({ where: { siteId: s.id, reason: { not: "migration" } } })).toBe(10);
    expect(await prisma.siteThemeSnapshot.count({ where: { siteId: s.id, reason: "migration" } })).toBe(1);
    expect((await listBrandRestorePoints(s.id)).length).toBe(11);
  });

  it("reading another site's point, a legacy row or a deleted site's point is NOT_FOUND", async () => {
    const a = await site();
    const b = await site();
    const { id } = await createBrandRestorePoint({ siteId: a.id, reason: "logo", designTokens: v6, darkMode: "off" });
    await expect(getBrandRestorePoint(b.id, id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    const legacy = await prisma.siteThemeSnapshot.create({ data: { siteId: a.id, workspaceId: a.workspaceId, prevStyles: [{ selector: "x" }], prevDsSchemaVersion: 0 } });
    await expect(getBrandRestorePoint(a.id, legacy.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await prisma.site.update({ where: { id: a.id }, data: { deletedAt: new Date() } });
    await expect(getBrandRestorePoint(a.id, id)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run (root): `npx vitest run server/trpc/routers/__tests__/theme-brand-restore-points.test.ts` and `pnpm test:db -- __tests__/db/brand-restore-points.db.test.ts`
Expected: FAIL — procedures and service functions missing.

- [ ] **Step 3: Implement**

`packages/shared/schemas/theme.ts`:

```ts
import { DarkModeSchema } from "./design-tokens";

// Brand Part 1c (spec §8): restore points the editor takes before a big brand
// change. `migration` and `theme-push` rows are written by the server only.
export const brandRestorePointReason = z.enum(["generator", "dark-auto", "logo"]);
export const createBrandRestorePointInput = z.object({
  siteId: z.string().min(1),
  reason: brandRestorePointReason,
  designTokens: z.array(z.unknown()).max(2000),
  designPresets: z.array(z.unknown()).max(500).optional(),
  darkMode: DarkModeSchema,
});
export type CreateBrandRestorePointInput = z.infer<typeof createBrandRestorePointInput>;

export const brandRestorePointInput = z.object({ siteId: z.string().min(1), id: z.string().min(1) });
export type BrandRestorePointInput = z.infer<typeof brandRestorePointInput>;
```

`theme.service.ts` (import `DarkModeSchema`, `type DarkMode`, `type CreateBrandRestorePointInput`):

```ts
/** A restore point the editor takes before a generator, Dark-Auto or logo
 *  apply (spec §8). The token set must be a valid v6 set. Writing it changes
 *  neither lastEditedAt nor dsSchemaVersion, so no open editor reloads. */
export async function createBrandRestorePoint(input: CreateBrandRestorePointInput): Promise<{ id: string; createdAt: Date }> {
  const checked = validateTokens(input.designTokens);
  if (!checked.ok) throw new ThemeError("BAD_REQUEST", `Restore point refused: ${checked.reason}`);
  const site = await prisma.site.findFirst({
    where: { id: input.siteId, deletedAt: null },
    select: { workspaceId: true, dsSchemaVersion: true },
  });
  if (!site) throw new ThemeError("NOT_FOUND", "Site not found");
  const theme: TokenTheme = input.designPresets
    ? { designTokens: checked.tokens, designPresets: input.designPresets }
    : { designTokens: checked.tokens };
  const row = await prisma.siteThemeSnapshot.create({
    data: {
      siteId: input.siteId,
      workspaceId: site.workspaceId,
      prevStyles: theme as unknown as Prisma.InputJsonValue,
      prevDsSchemaVersion: site.dsSchemaVersion,
      reason: input.reason,
      tokensSchemaVersion: TOKENS_SCHEMA_VERSION,
      darkMode: input.darkMode,
    },
    select: { id: true, createdAt: true },
  });
  await pruneThemeSnapshots(input.siteId);
  return row;
}

export interface BrandRestorePoint {
  id: string;
  reason: string;
  createdAt: Date;
  designTokens: unknown[];
  designPresets?: unknown[];
  tokensSchemaVersion: number;
  darkMode: DarkMode | null;
}

/** One restore point's token set, for the editor to restore (spec §8: restore
 *  runs in the editor). Legacy projectStyles rows are NOT_FOUND here — they
 *  stay admin-rollback-only (eng E6). */
export async function getBrandRestorePoint(siteId: string, id: string): Promise<BrandRestorePoint> {
  const row = await prisma.siteThemeSnapshot.findFirst({ where: { id, siteId, site: { deletedAt: null } } });
  const theme = row ? readTokenTheme(row.prevStyles) : null;
  if (!row || !theme) throw new ThemeError("NOT_FOUND", "Restore point not found");
  const darkMode = DarkModeSchema.safeParse(row.darkMode);
  return {
    id: row.id,
    reason: row.reason,
    createdAt: row.createdAt,
    designTokens: theme.designTokens,
    ...(theme.designPresets ? { designPresets: theme.designPresets } : {}),
    tokensSchemaVersion: row.tokensSchemaVersion,
    darkMode: darkMode.success ? darkMode.data : null,
  };
}
```

`theme.ts` router — a local helper is not added (one call each); both procedures repeat the
`brandRestorePoints` role check verbatim and map `ThemeError` with `translateThemeError`:

```ts
  createBrandRestorePoint: protectedProcedure
    .input(createBrandRestorePointInput)
    .mutation(async ({ ctx, input }) => {
      try {
        await checkSiteRole(ctx.prisma, ctx.session.user.id, input.siteId, "EDITOR");
      } catch (e) {
        if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
        throw e;
      }
      try {
        return await createBrandRestorePoint(input);
      } catch (e) {
        translateThemeError(e);
      }
    }),

  brandRestorePoint: protectedProcedure
    .input(brandRestorePointInput)
    .query(async ({ ctx, input }) => {
      try {
        await checkSiteRole(ctx.prisma, ctx.session.user.id, input.siteId, "EDITOR");
      } catch (e) {
        if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
        throw e;
      }
      try {
        return await getBrandRestorePoint(input.siteId, input.id);
      } catch (e) {
        translateThemeError(e);
      }
    }),
```

- [ ] **Step 4: Run to verify they pass**

Run (root): the two commands from Step 2, plus `pnpm test:db -- __tests__/db/theme-snapshots-v6.db.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/shared/schemas/theme.ts server/services/theme.service.ts server/trpc/routers/theme.ts server/trpc/routers/__tests__/theme-brand-restore-points.test.ts __tests__/db/brand-restore-points.db.test.ts
git commit -m "feat(brand): create and read Brand restore points (generator, dark-auto, logo)"
```

---

### Task 7: Pinned, redirect-checked public fetch (`lib/url-guard.ts`)

**Files:**
- Modify: `lib/url-guard.ts`
- Test: `lib/__tests__/url-guard.fetch.test.ts` (create; if `lib/__tests__/` does not exist, use `server/services/__tests__/url-guard-fetch.test.ts`)

**Interfaces:**
- Consumes: the file's own `isPrivateAddr`.
- Produces:
  - `resolvePublicAddress(host: string): Promise<{ address: string; family: 4 | 6 }>` — throws `BLOCKED_URL`
  - `interface PublicFetchOptions { maxBytes: number; deadline: number; accept: RegExp; maxRedirects?: number; request?: (url: URL, options: http.RequestOptions) => http.ClientRequest }`
  - `fetchPublicText(raw: string, opts: PublicFetchOptions): Promise<{ url: URL; text: string }>` — throws `Error` with message `INVALID_URL | BLOCKED_URL | TIMEOUT | TOO_LARGE | FETCH_FAILED`
  - `assertPublicHttpsUrl` unchanged.

- [ ] **Step 1: Write the failing tests**

```ts
// lib/__tests__/url-guard.fetch.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { EventEmitter } from "node:events";
import { PassThrough } from "node:stream";
import type http from "node:http";

const lookup = vi.fn();
vi.mock("node:dns/promises", () => ({ default: { lookup: (...a: unknown[]) => lookup(...a) } }));

import { fetchPublicText } from "@/lib/url-guard";

type Route = { status: number; headers?: Record<string, string>; body?: string };
function transport(routes: Record<string, Route>) {
  const calls: Array<{ url: string; options: http.RequestOptions }> = [];
  const request = (url: URL, options: http.RequestOptions) => {
    calls.push({ url: url.toString(), options });
    const req = new EventEmitter() as EventEmitter & { end(): void; destroy(e?: Error): void };
    req.end = () =>
      queueMicrotask(() => {
        const r = routes[url.toString()];
        if (!r) return req.emit("error", new Error("ECONNREFUSED"));
        const res = Object.assign(new PassThrough(), { statusCode: r.status, headers: r.headers ?? { "content-type": "text/html" } });
        req.emit("response", res);
        res.end(r.body ?? "");
      });
    req.destroy = (e?: Error) => { if (e) req.emit("error", e); };
    return req as unknown as http.ClientRequest;
  };
  return { request, calls };
}

const opts = (t: ReturnType<typeof transport>, over: Partial<Parameters<typeof fetchPublicText>[1]> = {}) => ({
  maxBytes: 1000, deadline: Date.now() + 5000, accept: /^text\/html/, request: t.request, ...over,
});

beforeEach(() => {
  lookup.mockReset();
  lookup.mockImplementation(async (host: string) =>
    host === "internal.test" ? [{ address: "10.0.0.7", family: 4 }]
    : host === "mixed.test" ? [{ address: "93.184.216.34", family: 4 }, { address: "127.0.0.1", family: 4 }]
    : [{ address: "93.184.216.34", family: 4 }],
  );
});

describe("fetchPublicText (spec §9, test 14)", () => {
  it.each(["ftp://example.com/", "file:///etc/passwd", "javascript:alert(1)", "http://user:pw@example.com/", "http://example.com:8080/", "not a url"])(
    "refuses %s as INVALID_URL", async (raw) => {
      const t = transport({});
      await expect(fetchPublicText(raw, opts(t))).rejects.toThrow("INVALID_URL");
      expect(t.calls).toHaveLength(0);
    });

  it.each(["http://127.0.0.1/", "http://169.254.169.254/latest/meta-data", "http://[::1]/", "http://10.1.2.3/"])(
    "refuses the private address %s without connecting", async (raw) => {
      const t = transport({});
      await expect(fetchPublicText(raw, opts(t))).rejects.toThrow("BLOCKED_URL");
      expect(t.calls).toHaveLength(0);
    });

  it("refuses a hostname with any private address", async () => {
    const t = transport({});
    await expect(fetchPublicText("https://internal.test/", opts(t))).rejects.toThrow("BLOCKED_URL");
    await expect(fetchPublicText("https://mixed.test/", opts(t))).rejects.toThrow("BLOCKED_URL");
    expect(t.calls).toHaveLength(0);
  });

  it("connects to the vetted address (no second DNS answer can redirect it)", async () => {
    const t = transport({ "https://example.com/": { status: 200, body: "<html>ok</html>" } });
    const out = await fetchPublicText("https://example.com/", opts(t));
    expect(out.text).toBe("<html>ok</html>");
    expect(lookup).toHaveBeenCalledTimes(1);
    const pinned = t.calls[0].options.lookup!;
    const seen = await new Promise<unknown>((resolve) =>
      pinned("example.com", {}, (_e: unknown, address: unknown) => resolve(address)),
    );
    expect(seen).toBe("93.184.216.34");
  });

  it("refuses a redirect to a private address", async () => {
    const t = transport({ "https://example.com/": { status: 302, headers: { location: "http://internal.test/admin" } } });
    await expect(fetchPublicText("https://example.com/", opts(t))).rejects.toThrow("BLOCKED_URL");
    expect(t.calls).toHaveLength(1);
  });

  it("follows at most 3 redirects", async () => {
    const hop = (n: number): Route => ({ status: 301, headers: { location: `https://example.com/${n + 1}` } });
    const t = transport({ "https://example.com/0": hop(0), "https://example.com/1": hop(1), "https://example.com/2": hop(2), "https://example.com/3": hop(3) });
    await expect(fetchPublicText("https://example.com/0", opts(t))).rejects.toThrow("FETCH_FAILED");
    expect(t.calls).toHaveLength(4);
  });

  it("aborts a body over maxBytes", async () => {
    const t = transport({ "https://example.com/": { status: 200, body: "x".repeat(2000) } });
    await expect(fetchPublicText("https://example.com/", opts(t))).rejects.toThrow("TOO_LARGE");
  });

  it("is TIMEOUT once the deadline has passed", async () => {
    const t = transport({ "https://example.com/": { status: 200, body: "ok" } });
    await expect(fetchPublicText("https://example.com/", opts(t, { deadline: Date.now() - 1 }))).rejects.toThrow("TIMEOUT");
  });

  it("is FETCH_FAILED for a non-200 or an unexpected content type", async () => {
    const t = transport({
      "https://example.com/404": { status: 404 },
      "https://example.com/img": { status: 200, headers: { "content-type": "image/png" } },
    });
    await expect(fetchPublicText("https://example.com/404", opts(t))).rejects.toThrow("FETCH_FAILED");
    await expect(fetchPublicText("https://example.com/img", opts(t))).rejects.toThrow("FETCH_FAILED");
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run (root): `npx vitest run lib/__tests__/url-guard.fetch.test.ts`
Expected: FAIL — `fetchPublicText` not exported.

- [ ] **Step 3: Implement** — append to `lib/url-guard.ts` (add `import http from "node:http"; import https from "node:https";`):

```ts
/**
 * Resolves `host` ONCE and refuses it when any address is non-global. The
 * caller must connect to the returned address (see fetchPublicText) — letting
 * the HTTP client resolve again reopens the DNS-rebinding window.
 */
export async function resolvePublicAddress(host: string): Promise<{ address: string; family: 4 | 6 }> {
  const literal = net.isIP(host);
  if (literal) {
    if (isPrivateAddr(host)) throw new Error("BLOCKED_URL");
    return { address: host, family: literal === 6 ? 6 : 4 };
  }
  let addrs: { address: string; family: number }[];
  try {
    addrs = await dns.lookup(host, { all: true });
  } catch {
    throw new Error("BLOCKED_URL");
  }
  if (addrs.length === 0 || addrs.some((a) => isPrivateAddr(a.address))) throw new Error("BLOCKED_URL");
  return { address: addrs[0].address, family: addrs[0].family === 6 ? 6 : 4 };
}

export interface PublicFetchOptions {
  maxBytes: number;
  /** Epoch ms; shared across redirects and across every fetch of one job. */
  deadline: number;
  /** Content types accepted (matched against the response's content-type). */
  accept: RegExp;
  maxRedirects?: number;
  /** Test seam: the request function (defaults to node http/https). */
  request?: (url: URL, options: http.RequestOptions) => http.ClientRequest;
}

function parsePublicHttpUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("INVALID_URL");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("INVALID_URL");
  if (url.username || url.password) throw new Error("INVALID_URL");
  if (url.port && url.port !== "80" && url.port !== "443") throw new Error("INVALID_URL");
  return url;
}

const defaultRequest = (url: URL, options: http.RequestOptions) =>
  (url.protocol === "https:" ? https : http).request(url, options);

function requestOnce(
  url: URL,
  pinned: { address: string; family: 4 | 6 },
  opts: PublicFetchOptions,
): Promise<{ redirect: string } | { text: string }> {
  const remaining = opts.deadline - Date.now();
  if (remaining <= 0) return Promise.reject(new Error("TIMEOUT"));
  const lookup: net.LookupFunction = (_host, options, callback) => {
    if (options.all) {
      (callback as (err: null, addresses: net.LookupAddress[]) => void)(null, [pinned]);
    } else {
      callback(null, pinned.address, pinned.family);
    }
  };
  return new Promise((resolve, reject) => {
    const req = (opts.request ?? defaultRequest)(url, {
      method: "GET",
      lookup,
      timeout: remaining,
      headers: {
        "user-agent": "BuildrickBrandImport/1.0 (+https://buildrick.io)",
        accept: "text/html,text/css;q=0.9,*/*;q=0.1",
        "accept-encoding": "identity",
      },
    });
    const timer = setTimeout(() => req.destroy(new Error("TIMEOUT")), remaining);
    const fail = (code: string) => {
      clearTimeout(timer);
      reject(new Error(code));
    };
    req.on("timeout", () => req.destroy(new Error("TIMEOUT")));
    req.on("error", (e: Error) => fail(e.message === "TIMEOUT" || e.message === "TOO_LARGE" ? e.message : "FETCH_FAILED"));
    req.on("response", (res: http.IncomingMessage) => {
      const status = res.statusCode ?? 0;
      const location = res.headers.location;
      if (status >= 300 && status < 400 && location) {
        res.resume();
        clearTimeout(timer);
        resolve({ redirect: location });
        return;
      }
      if (status !== 200 || !opts.accept.test(String(res.headers["content-type"] ?? ""))) {
        res.resume();
        fail("FETCH_FAILED");
        return;
      }
      const chunks: Buffer[] = [];
      let size = 0;
      res.on("data", (chunk: Buffer) => {
        size += chunk.length;
        if (size > opts.maxBytes) {
          res.destroy();
          req.destroy(new Error("TOO_LARGE"));
          return;
        }
        chunks.push(Buffer.from(chunk));
      });
      res.on("end", () => {
        if (size > opts.maxBytes) return;
        clearTimeout(timer);
        resolve({ text: Buffer.concat(chunks).toString("utf8") });
      });
    });
    req.end();
  });
}

/**
 * GET a public http(s) page as text, for user-supplied URLs (Brand from URL,
 * spec §9). Every hop — the first URL and each redirect (max 3) — is parsed,
 * resolved once, refused if any address is private, and CONNECTED to that
 * vetted address. Size and time are capped by `maxBytes` and `deadline`.
 */
export async function fetchPublicText(raw: string, opts: PublicFetchOptions): Promise<{ url: URL; text: string }> {
  let url = parsePublicHttpUrl(raw);
  for (let hop = 0; ; hop++) {
    const pinned = await resolvePublicAddress(url.hostname.replace(/^\[|\]$/g, ""));
    const res = await requestOnce(url, pinned, opts);
    if ("text" in res) return { url, text: res.text };
    if (hop >= (opts.maxRedirects ?? 3)) throw new Error("FETCH_FAILED");
    url = parsePublicHttpUrl(new URL(res.redirect, url).toString());
  }
}
```

Update the file header's first paragraph: "…(webhook test events, Brand-from-URL)". If TypeScript rejects the
`lookup` overload call, keep the single `as` cast shown — it is the accepted case in Global Constraints.

- [ ] **Step 4: Run to verify they pass**

Run (root): `npx vitest run lib/__tests__/url-guard.fetch.test.ts server/services/__tests__/webhook-url-guard.test.ts`
Expected: PASS (both — the webhook guard is untouched).

- [ ] **Step 5: Commit**

```bash
git add lib/url-guard.ts lib/__tests__/url-guard.fetch.test.ts
git commit -m "feat(security): pinned, redirect-checked public fetch for user-supplied URLs"
```

---

### Task 8: Brand from a website URL (server service + procedure)

**Files:**
- Create: `server/services/brand-extract.service.ts`
- Modify: `packages/shared/schemas/theme.ts` (`extractBrandFromUrlInput`)
- Modify: `server/trpc/routers/theme.ts` (`extractBrandFromUrl`)
- Modify: `CLAUDE.md` (root) — `NEXT_PUBLIC_FEATURE_DS_AI` row: "…AI entry points in the Brand panel, **and the server's `theme.extractBrandFromUrl` (404 unless `"true"`; read on the server too, inlined at build like Collab)**."
- Test: `server/services/__tests__/brand-extract.service.test.ts`, `server/trpc/routers/__tests__/theme-extract-brand.test.ts` (create both)

**Interfaces:**
- Consumes: Task 7 `fetchPublicText`; `checkRateLimit` (`server/services/rate-limiter.ts`); `checkSiteRole`; `resolveWorkspaceId`.
- Produces:
  - `extractBrandFromUrlInput = { siteId: string; url: string (trimmed, 1…2048) }`
  - `interface ExtractedBrand { colors: Array<{ value: string; count: number }>; fonts: Array<{ family: string; generic?: "serif" | "sans-serif" | "monospace"; heading: number; body: number; count: number }> }` — raw colour literals (top 40), sanitized family names (top 6); the editor normalises (Task 2)
  - `class BrandExtractError extends Error { code: "BLOCKED" | "TIMEOUT" }`
  - `readBrandFromHtml(html: string): { css: string[]; stylesheets: string[]; googleFamilies: string[] }`
  - `tallyBrandCss(css: readonly string[], googleFamilies: readonly string[]): ExtractedBrand`
  - `extractBrandFromUrl(url: string): Promise<ExtractedBrand>`
  - tRPC `theme.extractBrandFromUrl` (mutation): `NOT_FOUND` unless `NEXT_PUBLIC_FEATURE_DS_AI === "true"`; EDITOR on the site; rate limit 10 / 10 min per user and 30 / 10 min per workspace (`TOO_MANY_REQUESTS`); `BrandExtractError` → `BAD_REQUEST` with message `"<code>: <copy>"`

- [ ] **Step 1: Write the failing tests**

```ts
// server/services/__tests__/brand-extract.service.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const fetchPublicText = vi.fn();
vi.mock("@/lib/url-guard", () => ({ fetchPublicText: (...a: unknown[]) => fetchPublicText(...a) }));

import { readBrandFromHtml, tallyBrandCss, extractBrandFromUrl, BrandExtractError } from "../brand-extract.service";

beforeEach(() => fetchPublicText.mockReset());

describe("readBrandFromHtml", () => {
  it("collects <style> blocks, style attributes, stylesheet links and Google Fonts families", () => {
    const html = `<head><style>.a{color:#1A56DB}</style>
      <link rel="stylesheet" href="/main.css"><link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter&display=swap" rel="stylesheet">
      <link rel="icon" href="/x.png"></head><body style="background:#fff"></body>`;
    const out = readBrandFromHtml(html);
    expect(out.css).toEqual([".a{color:#1A56DB}", "background:#fff"]);
    expect(out.stylesheets).toEqual(["/main.css", "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter&display=swap"]);
    expect(out.googleFamilies).toEqual(["Playfair Display", "Inter"]);
  });
});

describe("tallyBrandCss", () => {
  it("counts colour literals and font families, splitting heading and body use", () => {
    const out = tallyBrandCss([
      "h1,h2{font-family:'Tiempos Headline',Georgia,serif;color:#1A56DB}",
      "body{font-family:Inter,sans-serif;color:rgb(17,24,39)} a{color:#1a56db} .x{color:var(--brand)}",
    ], ["Inter"]);
    expect(out.colors).toEqual(expect.arrayContaining([{ value: "#1a56db", count: 2 }, { value: "rgb(17,24,39)", count: 1 }]));
    expect(out.colors.some((c) => c.value.includes("var("))).toBe(false);
    expect(out.fonts.find((f) => f.family === "Tiempos Headline")).toMatchObject({ generic: "serif", heading: 1 });
    expect(out.fonts.find((f) => f.family === "Inter")).toMatchObject({ body: 1 });
  });

  it("drops family names that are not plain names (font names are sanitized, spec D17)", () => {
    const out = tallyBrandCss(["p{font-family:\"Evil<script>\",serif} q{font-family:var(--f)}"], []);
    expect(out.fonts).toEqual([]);
  });
});

describe("extractBrandFromUrl", () => {
  it("fetches the page then up to 4 stylesheets on one deadline, skipping a refused one", async () => {
    fetchPublicText
      .mockResolvedValueOnce({ url: new URL("https://acme.test/"), text: `<link rel="stylesheet" href="/a.css"><link rel="stylesheet" href="http://10.0.0.1/b.css">` })
      .mockResolvedValueOnce({ url: new URL("https://acme.test/a.css"), text: "a{color:#C2410C}" })
      .mockRejectedValueOnce(new Error("BLOCKED_URL"));
    const out = await extractBrandFromUrl("https://acme.test/");
    expect(out.colors).toEqual([{ value: "#c2410c", count: 1 }]);
    const deadlines = fetchPublicText.mock.calls.map((c) => c[1].deadline);
    expect(new Set(deadlines).size).toBe(1);
  });

  it.each([
    ["BLOCKED_URL", "BLOCKED"], ["INVALID_URL", "BLOCKED"], ["FETCH_FAILED", "BLOCKED"],
    ["TIMEOUT", "TIMEOUT"], ["TOO_LARGE", "TIMEOUT"],
  ])("maps %s on the page to %s", async (raw, code) => {
    fetchPublicText.mockRejectedValueOnce(new Error(raw));
    await expect(extractBrandFromUrl("https://acme.test/")).rejects.toMatchObject({ code });
    fetchPublicText.mockRejectedValueOnce(new Error(raw));
    await expect(extractBrandFromUrl("https://acme.test/")).rejects.toBeInstanceOf(BrandExtractError);
  });

  it("needs no OPENAI_API_KEY", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    fetchPublicText.mockResolvedValueOnce({ url: new URL("https://acme.test/"), text: "<style>a{color:#0E7490}</style>" });
    await expect(extractBrandFromUrl("https://acme.test/")).resolves.toMatchObject({ colors: [{ value: "#0e7490", count: 1 }] });
    vi.unstubAllEnvs();
  });
});
```

Router (`theme-extract-brand.test.ts`, same mocking shape as `theme-brand-restore-points.test.ts`, plus
`vi.mock("@/server/services/rate-limiter", …)`, `vi.mock("@/server/trpc/workspace-ctx", () => ({ resolveWorkspaceId: async () => "w1" }))`
and `vi.mock("@/server/services/brand-extract.service", …)`):

```ts
describe("theme.extractBrandFromUrl", () => {
  it("is NOT_FOUND unless the dsAi flag is on", async () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_DS_AI", "");
    await expect(caller().extractBrandFromUrl({ siteId: "s1", url: "https://acme.test" })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("refuses a VIEWER, then rate-limits per user and per workspace (spec test 28)", async () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_DS_AI", "true");
    checkSiteRoleMock.mockRejectedValueOnce(new PermissionError("FORBIDDEN", "viewer"));
    await expect(caller().extractBrandFromUrl({ siteId: "s1", url: "https://acme.test" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    checkSiteRoleMock.mockResolvedValue(undefined);
    checkRateLimitMock.mockResolvedValueOnce({ allowed: true }).mockResolvedValueOnce({ allowed: false });
    await expect(caller().extractBrandFromUrl({ siteId: "s1", url: "https://acme.test" })).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    expect(checkRateLimitMock.mock.calls.map((c) => c[0])).toEqual(["brand-extract:user:u_1", "brand-extract:ws:w1"]);
    expect(extractMock).not.toHaveBeenCalled();
  });

  it("translates a BrandExtractError to BAD_REQUEST with the code first", async () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_DS_AI", "true");
    checkSiteRoleMock.mockResolvedValue(undefined);
    checkRateLimitMock.mockResolvedValue({ allowed: true });
    extractMock.mockRejectedValueOnce(new BrandExtractErrorMock("TIMEOUT", "That site took too long to answer"));
    await expect(caller().extractBrandFromUrl({ siteId: "s1", url: "https://acme.test" }))
      .rejects.toMatchObject({ code: "BAD_REQUEST", message: "TIMEOUT: That site took too long to answer" });
  });
});
```

(`BrandExtractErrorMock` is the mocked module's class: `class extends Error { constructor(public code: string, m: string) { super(m); } }`.)

- [ ] **Step 2: Run to verify they fail**

Run (root): `npx vitest run server/services/__tests__/brand-extract.service.test.ts server/trpc/routers/__tests__/theme-extract-brand.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```ts
// server/services/brand-extract.service.ts
import { fetchPublicText } from "@/lib/url-guard";

/**
 * Brand from a website URL (spec §9, D13). Deterministic: fetch the page and
 * up to four of its stylesheets through the SSRF-guarded fetch, then count the
 * colour literals and font families their CSS names. Returns RAW strings —
 * the editor parses colours with the picker's own parser and picks roles
 * (engine/designSystem/brandColors.ts), so nothing here duplicates colour math.
 * No AI (OQ-9); nothing from the fetched page is logged.
 */

export class BrandExtractError extends Error {
  constructor(public code: "BLOCKED" | "TIMEOUT", message: string) {
    super(message);
    this.name = "BrandExtractError";
  }
}

type Generic = "serif" | "sans-serif" | "monospace";
export interface ExtractedBrand {
  colors: Array<{ value: string; count: number }>;
  fonts: Array<{ family: string; generic?: Generic; heading: number; body: number; count: number }>;
}

const PAGE_BYTES = 2_000_000;
const CSS_BYTES = 1_000_000;
const MAX_STYLESHEETS = 4;
const BUDGET_MS = 10_000;

const STYLE_BLOCK_RE = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
const STYLE_ATTR_RE = /\sstyle\s*=\s*"([^"]*)"/gi;
const LINK_RE = /<link\b[^>]*>/gi;
const COLOR_RE = /#[0-9a-fA-F]{3,8}\b|\b(?:rgb|hsl)a?\([^()]{1,60}\)/g;
const RULE_RE = /([^{}]+)\{([^{}]*)\}/g;
const FONT_DECL_RE = /font-family\s*:\s*([^;}]+)/gi;
const GENERICS: Record<string, Generic | undefined> = { serif: "serif", "sans-serif": "sans-serif", monospace: "monospace" };
const IGNORED = new Set(["inherit", "initial", "unset", "system-ui", "cursive", "fantasy", "emoji", "math", "fangsong", "ui-sans-serif", "ui-serif", "ui-monospace", "-apple-system"]);

const attr = (tag: string, name: string) => new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, "i").exec(tag)?.[1];

/** A plain family name or null (spec D17: font names are sanitized). */
function cleanFamily(raw: string): string | null {
  const name = raw.trim().replace(/^['"]|['"]$/g, "").trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9 _-]{0,63}$/.test(name)) return null;
  const lower = name.toLowerCase();
  return GENERICS[lower] || IGNORED.has(lower) ? null : name;
}

export function readBrandFromHtml(html: string): { css: string[]; stylesheets: string[]; googleFamilies: string[] } {
  const css = [...html.matchAll(STYLE_BLOCK_RE)].map((m) => m[1]);
  for (const m of html.matchAll(STYLE_ATTR_RE)) css.push(m[1]);
  const stylesheets: string[] = [];
  const googleFamilies: string[] = [];
  for (const [tag] of html.matchAll(LINK_RE)) {
    if (!/\brel\s*=\s*["'][^"']*stylesheet/i.test(tag)) continue;
    const href = attr(tag, "href");
    if (!href) continue;
    stylesheets.push(href);
    if (/fonts\.googleapis\.com\/css/i.test(href)) {
      for (const fam of new URL(href, "https://x.invalid").searchParams.getAll("family")) {
        const clean = cleanFamily(fam.split(":")[0].replace(/\+/g, " "));
        if (clean) googleFamilies.push(clean);
      }
    }
  }
  return { css, stylesheets, googleFamilies };
}

export function tallyBrandCss(css: readonly string[], googleFamilies: readonly string[]): ExtractedBrand {
  const colors = new Map<string, number>();
  const fonts = new Map<string, { family: string; generic?: Generic; heading: number; body: number; count: number }>();
  const addFont = (family: string, generic: Generic | undefined, selector: string) => {
    const f = fonts.get(family) ?? { family, generic, heading: 0, body: 0, count: 0 };
    f.count += 1;
    if (/(^|[\s,>+~])h[1-3]\b/i.test(selector)) f.heading += 1;
    if (/(^|[\s,])(body|html)\b/i.test(selector)) f.body += 1;
    if (!f.generic && generic) f.generic = generic;
    fonts.set(family, f);
  };
  for (const text of css) {
    for (const m of text.matchAll(COLOR_RE)) {
      const v = m[0].toLowerCase().replace(/\s+/g, "");
      colors.set(v, (colors.get(v) ?? 0) + 1);
    }
    const rules = text.includes("{") ? [...text.matchAll(RULE_RE)].map((r) => [r[1], r[2]]) : [["", text]];
    for (const [selector, body] of rules) {
      for (const d of body.matchAll(FONT_DECL_RE)) {
        const parts = d[1].split(",");
        const generic = parts.map((p) => GENERICS[p.trim().toLowerCase()]).find(Boolean);
        const first = cleanFamily(parts[0]);
        if (first) addFont(first, generic, selector.trim());
      }
    }
  }
  for (const fam of googleFamilies) if (!fonts.has(fam)) fonts.set(fam, { family: fam, heading: 0, body: 0, count: 1 });
  return {
    colors: [...colors.entries()].map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count || (a.value < b.value ? -1 : 1)).slice(0, 40),
    fonts: [...fonts.values()].sort((a, b) => b.count - a.count || (a.family < b.family ? -1 : 1)).slice(0, 6),
  };
}

function toExtractError(e: unknown): BrandExtractError {
  const code = e instanceof Error ? e.message : "";
  return code === "TIMEOUT" || code === "TOO_LARGE"
    ? new BrandExtractError("TIMEOUT", "That site took too long to answer")
    : new BrandExtractError("BLOCKED", "This address can't be used");
}

export async function extractBrandFromUrl(url: string): Promise<ExtractedBrand> {
  const deadline = Date.now() + BUDGET_MS;
  let page: { url: URL; text: string };
  try {
    page = await fetchPublicText(url, { maxBytes: PAGE_BYTES, deadline, accept: /^(text\/html|application\/xhtml\+xml)/i });
  } catch (e) {
    throw toExtractError(e);
  }
  const { css, stylesheets, googleFamilies } = readBrandFromHtml(page.text);
  for (const href of stylesheets.filter((h) => !/fonts\.googleapis\.com/i.test(h)).slice(0, MAX_STYLESHEETS)) {
    try {
      css.push((await fetchPublicText(new URL(href, page.url).toString(), { maxBytes: CSS_BYTES, deadline, accept: /^text\/css/i })).text);
    } catch (e) {
      if (e instanceof Error && e.message === "TIMEOUT") break; // the shared budget is spent
      /* a refused or failing stylesheet is skipped; the page's own CSS still counts */
    }
  }
  return tallyBrandCss(css, googleFamilies);
}
```

The `"Inter"` Google family in the `tallyBrandCss` test is already counted from `body{…}`, so it is not
added twice — keep that behaviour.

`packages/shared/schemas/theme.ts`:

```ts
export const extractBrandFromUrlInput = z.object({ siteId: z.string().min(1), url: z.string().trim().min(1).max(2048) });
export type ExtractBrandFromUrlInput = z.infer<typeof extractBrandFromUrlInput>;
```

`theme.ts` router:

```ts
  // Brand Part 1c (spec §9): colours and fonts from a website, behind dsAi (spec §9 last line).
  extractBrandFromUrl: protectedProcedure
    .input(extractBrandFromUrlInput)
    .mutation(async ({ ctx, input }) => {
      if (process.env.NEXT_PUBLIC_FEATURE_DS_AI !== "true") throw new TRPCError({ code: "NOT_FOUND" });
      try {
        await checkSiteRole(ctx.prisma, ctx.session.user.id, input.siteId, "EDITOR");
      } catch (e) {
        if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
        throw e;
      }
      const workspaceId = await resolveWorkspaceId(ctx);
      for (const [key, max] of [[`brand-extract:user:${ctx.session.user.id}`, 10], [`brand-extract:ws:${workspaceId}`, 30]] as const) {
        if (!(await checkRateLimit(key, max, 10 * 60_000)).allowed) {
          throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many brand imports — try again in a few minutes." });
        }
      }
      try {
        return await extractBrandFromUrl(input.url);
      } catch (e) {
        if (e instanceof BrandExtractError) {
          console.warn("[brand-extract] failed", { kind: e.code, siteId: input.siteId });
          throw new TRPCError({ code: "BAD_REQUEST", message: `${e.code}: ${e.message}` });
        }
        throw e;
      }
    }),
```

- [ ] **Step 4: Run to verify they pass**

Run (root): `npx vitest run server/services/__tests__/brand-extract.service.test.ts server/trpc/routers/__tests__`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/services/brand-extract.service.ts packages/shared/schemas/theme.ts server/trpc/routers/theme.ts server/services/__tests__/brand-extract.service.test.ts server/trpc/routers/__tests__/theme-extract-brand.test.ts CLAUDE.md
git commit -m "feat(brand): colours and fonts from a website URL — SSRF-guarded, rate limited, behind dsAi"
```

---

### Task 9: Editor flows — preview hook, guarded apply, restore points (waits for 1b Tasks 1, 3, 4, 10)

**Files:**
- Create: `packages/editor/src/engine/designSystem/restorePoint.ts`
- Create: `packages/editor/src/editor/design-system/state/useBrandPreview.ts`
- Create: `packages/editor/src/editor/design-system/state/useGuardedApply.ts`
- Create: `packages/editor/src/editor/design-system/state/useBrandRestorePoints.ts`
- Test: `packages/editor/src/engine/designSystem/__tests__/restorePoint.test.ts`, `packages/editor/src/editor/design-system/state/__tests__/useBrandPreview.test.tsx`, `packages/editor/src/editor/design-system/state/__tests__/useGuardedApply.test.tsx`, `packages/editor/src/editor/design-system/state/__tests__/useBrandRestorePoints.test.tsx` (create all)

**Interfaces:**
- Consumes: Task 3 (`setPreview`, `setDarkMode`, `BrandPreview`), Task 6 procedures, 1b `keepInUseSiteTokens` and `TokenUsageCount`, `migrateDesignTokens` (`engine/designSystem/tokenMigrations`), `migrateTokensToV6`, `validateTokens`, `mergeProjectTokens`, `getBuildrikClient(DASHBOARD_URL)`, `getSiteIdFromUrl()`.
- Produces:
  - `restoredTokens(point: { designTokens: unknown[]; tokensSchemaVersion: number }, current: readonly DesignToken[], usage: { count(id: string): TokenUsageCount }): { ok: true; tokens: DesignToken[] } | { ok: false; reason: string }`
  - `useBrandPreview(composer: Composer | null): { show(compute: (tokens: DesignToken[], settings: ProjectSettings) => BrandPreview | null): void; clear(): void; active: boolean }`
  - `useGuardedApply(): { busy: boolean; run(work: () => Promise<boolean>): Promise<boolean> }`
  - `takeRestorePoint(composer: Composer, siteId: string, reason: "generator" | "dark-auto" | "logo"): Promise<boolean>`
  - `useBrandRestorePoints(composer: Composer | null): { rows: Array<{ id: string; reason: string; createdAt: Date }>; status: "loading" | "ready" | "error"; refresh(): void; restore(id: string): Promise<"restored" | "refused" | "failed"> }`

- [ ] **Step 1: Write the failing tests**

```ts
// packages/editor/src/engine/designSystem/__tests__/restorePoint.test.ts
import { describe, it, expect } from "vitest";
import { resolveTokenLiteral, setTokenLiteral } from "@buildrik/shared/tokens";
import type { DesignToken } from "@buildrik/shared/schemas/design-tokens";
import { DEFAULT_TOKENS, DEFAULT_TOKENS_V5 } from "@/engine/designSystem/defaultTokens";
import { restoredTokens } from "../restorePoint";

const custom: DesignToken = {
  id: "color-brand-x", name: "Brand X", kind: "color", layer: "semantic", modes: { light: { value: "#0E7490" } },
  category: "colors", cssVar: "--buildrick-design-color-brand-x", type: "color",
};
const none = { count: () => 0 as const };

describe("restoredTokens (spec §8, test 13)", () => {
  it("puts a v6 point back over the seed", () => {
    const saved = setTokenLiteral(DEFAULT_TOKENS, "color-primary", "light", "#C2410C");
    const out = restoredTokens({ designTokens: saved, tokensSchemaVersion: 6 }, DEFAULT_TOKENS, none);
    if (!out.ok) throw new Error(out.reason);
    expect(resolveTokenLiteral(out.tokens, "color-primary", "light")).toBe("#C2410C");
  });

  it("migrates an older point (theme-push / migration rows are v5) before restoring", () => {
    const out = restoredTokens({ designTokens: DEFAULT_TOKENS_V5, tokensSchemaVersion: 5 }, DEFAULT_TOKENS, none);
    expect(out.ok).toBe(true);
  });

  it("keeps an in-use token the snapshot does not have (1b removal guard would refuse otherwise)", () => {
    const out = restoredTokens({ designTokens: [], tokensSchemaVersion: 6 }, [...DEFAULT_TOKENS, custom], {
      count: (id) => (id === "color-brand-x" ? 2 : 0),
    });
    if (!out.ok) throw new Error(out.reason);
    expect(out.tokens.some((t) => t.id === "color-brand-x")).toBe(true);
  });

  it("drops an unused site-only token and refuses a point that does not validate", () => {
    const ok = restoredTokens({ designTokens: [], tokensSchemaVersion: 6 }, [...DEFAULT_TOKENS, custom], none);
    expect(ok.ok && ok.tokens.some((t) => t.id === "color-brand-x")).toBe(false);
    expect(restoredTokens({ designTokens: [{ id: "x" }], tokensSchemaVersion: 6 }, DEFAULT_TOKENS, none).ok).toBe(false);
  });
});
```

```tsx
// packages/editor/src/editor/design-system/state/__tests__/useBrandPreview.test.tsx
// @vitest-environment jsdom
import * as React from "react";
import { render, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { DEFAULT_TOKENS } from "@/engine/designSystem/defaultTokens";
import { useBrandPreview } from "../useBrandPreview";

function fake() {
  const handlers = new Map<string, Set<() => void>>();
  const c = {
    settings: { designTokens: DEFAULT_TOKENS, designTokensSchemaVersion: 6, darkMode: "off" } as Record<string, unknown>,
    getProjectSettings: () => c.settings,
    designSystem: { preview: null as unknown, setPreview: (p: unknown) => { c.designSystem.preview = p; } },
    on: (e: string, h: () => void) => { if (!handlers.has(e)) handlers.set(e, new Set()); handlers.get(e)!.add(h); },
    off: (e: string, h: () => void) => handlers.get(e)?.delete(h),
    emit: (e: string) => handlers.get(e)?.forEach((h) => h()),
  };
  return c;
}

function Harness({ c, onApi }: { c: ReturnType<typeof fake>; onApi: (api: ReturnType<typeof useBrandPreview>) => void }) {
  onApi(useBrandPreview(c as never));
  return null;
}

describe("useBrandPreview (spec D17: previews revert)", () => {
  it("shows, recomputes when settings change (⌘Z mid-preview), and clears on unmount", () => {
    const c = fake();
    let api!: ReturnType<typeof useBrandPreview>;
    const view = render(<Harness c={c} onApi={(a) => { api = a; }} />);
    let calls = 0;
    act(() => api.show((tokens) => { calls += 1; return { tokens, darkMode: "auto", theme: "dark" }; }));
    expect(c.designSystem.preview).toMatchObject({ theme: "dark" });
    act(() => { c.settings = { ...c.settings, darkMode: "off" }; c.emit("settings:change"); });
    expect(calls).toBe(2);
    view.unmount();
    expect(c.designSystem.preview).toBeNull();
  });

  it("clear() puts the saved brand back and stops listening", () => {
    const c = fake();
    let api!: ReturnType<typeof useBrandPreview>;
    render(<Harness c={c} onApi={(a) => { api = a; }} />);
    let calls = 0;
    act(() => api.show((tokens) => { calls += 1; return { tokens, darkMode: "auto" }; }));
    act(() => api.clear());
    act(() => c.emit("settings:change"));
    expect(c.designSystem.preview).toBeNull();
    expect(calls).toBe(1);
  });
});
```

```tsx
// packages/editor/src/editor/design-system/state/__tests__/useGuardedApply.test.tsx
// @vitest-environment jsdom
// Render a harness exposing useGuardedApply. Call api.run(work) twice in the same tick with a `work`
// that resolves after a deferred promise; assert `work` ran ONCE, the second call resolved false,
// `busy` was true while pending and false after (spec test 29: double-click Apply → one transaction).
```

Write it as a real `it` with a deferred promise (`let release!: (v: boolean) => void; const work = vi.fn(() => new Promise<boolean>((r) => { release = r; }))`).

```tsx
// packages/editor/src/editor/design-system/state/__tests__/useBrandRestorePoints.test.tsx
// @vitest-environment jsdom
// vi.mock("@/services/api-client", () => ({ getBuildrikClient: () => client }))
// vi.mock("@/services/BuildrikSyncProvider", () => ({ getSiteIdFromUrl: () => "s1" }))
// where client.theme.brandRestorePoints.query / brandRestorePoint.query / createBrandRestorePoint.mutate are vi.fn().
// Cases:
//  1. lists rows newest first from brandRestorePoints.query({ siteId: "s1" }); status "ready".
//  2. restore(id) of a dark-auto point with darkMode "off": calls composer.designSystem.setDarkMode("off", "Restore brand", tokens)
//     once and returns "restored"; a point with darkMode null calls setTokens(tokens, "Restore brand") instead.
//  3. restore(id) when setTokens/setDarkMode return false → "refused" (no throw).
//  4. restore(id) when the query rejects → "failed".
//  5. takeRestorePoint(composer, "s1", "generator") sends the SAVED designTokens (settings.designTokens ?? []),
//     designPresets when it is an array, and darkMode ("off" when absent); returns false when the mutation rejects.
```

Write each case as a real `it` with a fake composer exposing `getProjectSettings`, `designSystem.setTokens`,
`designSystem.setDarkMode`, `designSystem.tokenUsage.getCount` (1b Task 3) and `on/off`.

- [ ] **Step 2: Run to verify they fail**

Run (from `packages/editor`): `npx vitest run src/engine/designSystem/__tests__/restorePoint.test.ts src/editor/design-system/state/__tests__/useBrandPreview.test.tsx src/editor/design-system/state/__tests__/useGuardedApply.test.tsx src/editor/design-system/state/__tests__/useBrandRestorePoints.test.tsx`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement**

```ts
// packages/editor/src/engine/designSystem/restorePoint.ts
/**
 * A restore point's tokens as the site gets them back (spec §8: restore runs
 * in the editor, as one transaction). An older point (theme-push and migration
 * rows hold v5) is migrated first; the set is laid over the seed like every
 * saved set; and a site-only token the point does not have but elements still
 * use is KEPT (1b keepInUseSiteTokens) — otherwise the removal guard in
 * setTokens would refuse the whole restore.
 */
import { validateTokens, TOKENS_SCHEMA_VERSION, type DesignToken } from "@buildrik/shared/schemas/design-tokens";
import { keepInUseSiteTokens, migrateTokensToV6, type TokenUsageCount } from "@buildrik/shared/tokens";
import { migrateDesignTokens } from "./tokenMigrations";
import { mergeProjectTokens } from "./projectTokens";

export function restoredTokens(
  point: { designTokens: unknown[]; tokensSchemaVersion: number },
  current: readonly DesignToken[],
  usage: { count(id: string): TokenUsageCount },
): { ok: true; tokens: DesignToken[] } | { ok: false; reason: string } {
  let rows: unknown = point.designTokens;
  try {
    if (point.tokensSchemaVersion < TOKENS_SCHEMA_VERSION && point.designTokens.length > 0) {
      const v5 = point.tokensSchemaVersion < 5 ? migrateDesignTokens(point.designTokens, point.tokensSchemaVersion, 5) : point.designTokens;
      rows = migrateTokensToV6(v5);
    }
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : String(e) };
  }
  const checked = validateTokens(rows);
  if (!checked.ok) return { ok: false, reason: checked.reason };
  const theme = mergeProjectTokens(checked.tokens, TOKENS_SCHEMA_VERSION);
  return { ok: true, tokens: keepInUseSiteTokens(theme, current, usage).tokens };
}
```

(Check `migrateDesignTokens`' exact signature in `tokenMigrations.ts` and `mergeProjectTokens`' in
`projectTokens.ts` before writing; adapt the call, not the behaviour.)

```ts
// packages/editor/src/editor/design-system/state/useBrandPreview.ts
/**
 * The canvas preview of a Brand flow (Dark Auto, generator, logo/URL). The
 * preview is a FUNCTION of the saved tokens, re-run whenever settings change —
 * so a ⌘Z or a teammate's edit mid-preview never leaves a stale set painted.
 * Cleared on clear(), and always on unmount (navigation away, spec D17).
 */
import * as React from "react";
import type { Composer } from "@/engine";
import type { ProjectSettings } from "@/shared/types";
import { EVENTS } from "@/shared/constants/events";
import { mergeProjectTokens } from "@/engine/designSystem/projectTokens";
import type { BrandPreview, DesignToken } from "@/engine/designSystem/types";

type Compute = (tokens: DesignToken[], settings: ProjectSettings) => BrandPreview | null;

export function useBrandPreview(composer: Composer | null) {
  const compute = React.useRef<Compute | null>(null);
  const [active, setActive] = React.useState(false);

  const paint = React.useCallback(() => {
    if (!composer || !compute.current) return;
    const settings = composer.getProjectSettings();
    composer.designSystem.setPreview(compute.current(mergeProjectTokens(settings.designTokens ?? [], settings.designTokensSchemaVersion), settings));
  }, [composer]);

  const clear = React.useCallback(() => {
    if (!composer || !compute.current) return;
    compute.current = null;
    composer.off(EVENTS.SETTINGS_CHANGE, paint);
    composer.designSystem.setPreview(null);
    setActive(false);
  }, [composer, paint]);

  const show = React.useCallback((next: Compute) => {
    if (!composer) return;
    if (!compute.current) composer.on(EVENTS.SETTINGS_CHANGE, paint);
    compute.current = next;
    setActive(true);
    paint();
  }, [composer, paint]);

  React.useEffect(() => clear, [clear]);
  return { show, clear, active };
}
```

(Use the project's real `ProjectSettings` import path — `@/shared/types` or `@/shared/types/project`.)

```ts
// packages/editor/src/editor/design-system/state/useGuardedApply.ts
/** Apply buttons run their work at most once at a time (spec D17: a
 *  double-click can never create two transactions). */
import * as React from "react";

export function useGuardedApply() {
  const running = React.useRef(false);
  const [busy, setBusy] = React.useState(false);
  const run = React.useCallback(async (work: () => Promise<boolean>) => {
    if (running.current) return false;
    running.current = true;
    setBusy(true);
    try {
      return await work();
    } finally {
      running.current = false;
      setBusy(false);
    }
  }, []);
  return { busy, run };
}
```

```ts
// packages/editor/src/editor/design-system/state/useBrandRestorePoints.ts
/**
 * Brand restore points (spec §8, M10): the list, taking one before a big
 * change (generator, Dark Auto, logo/URL — OQ-6: the caller does not apply
 * when this returns false), and restoring one as a single transaction through
 * setDarkMode (a point that recorded Dark mode) or setTokens.
 */
import * as React from "react";
import type { Composer } from "@/engine";
import { getBuildrikClient } from "@/services/api-client";
import { getSiteIdFromUrl } from "@/services/BuildrikSyncProvider";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";
import { mergeProjectTokens } from "@/engine/designSystem/projectTokens";
import { restoredTokens } from "@/engine/designSystem/restorePoint";

const client = () => getBuildrikClient(DASHBOARD_URL);

export async function takeRestorePoint(
  composer: Composer,
  siteId: string,
  reason: "generator" | "dark-auto" | "logo",
): Promise<boolean> {
  const s = composer.getProjectSettings();
  try {
    await client().theme.createBrandRestorePoint.mutate({
      siteId,
      reason,
      designTokens: Array.isArray(s.designTokens) ? s.designTokens : [],
      ...(Array.isArray(s.designPresets) ? { designPresets: s.designPresets } : {}),
      darkMode: s.darkMode === "auto" ? "auto" : "off",
    });
    return true;
  } catch {
    return false;
  }
}

export function useBrandRestorePoints(composer: Composer | null) {
  const siteId = getSiteIdFromUrl();
  const [rows, setRows] = React.useState<Array<{ id: string; reason: string; createdAt: Date }>>([]);
  const [status, setStatus] = React.useState<"loading" | "ready" | "error">("loading");

  const refresh = React.useCallback(() => {
    if (!siteId) return;
    setStatus("loading");
    client().theme.brandRestorePoints.query({ siteId })
      .then((r) => { setRows(r); setStatus("ready"); })
      .catch(() => setStatus("error"));
  }, [siteId]);
  React.useEffect(refresh, [refresh]);

  const restore = React.useCallback(async (id: string): Promise<"restored" | "refused" | "failed"> => {
    if (!composer || !siteId) return "failed";
    let point;
    try {
      point = await client().theme.brandRestorePoint.query({ siteId, id });
    } catch {
      return "failed";
    }
    const s = composer.getProjectSettings();
    const current = mergeProjectTokens(s.designTokens ?? [], s.designTokensSchemaVersion);
    const usage = { count: (tokenId: string) => composer.designSystem.tokenUsage.getCount(tokenId) };
    const out = restoredTokens(point, current, usage);
    if (!out.ok) return "refused";
    const done = point.darkMode
      ? composer.designSystem.setDarkMode(point.darkMode, "Restore brand", out.tokens)
      : composer.designSystem.setTokens(out.tokens, "Restore brand");
    return done ? "restored" : "refused";
  }, [composer, siteId]);

  return { rows, status, refresh, restore };
}
```

(`siteId` null — the standalone demo — leaves `status` at `"loading"`; Task 12's board decides whether that
shows the empty state. Restored `designPresets` are not re-applied in 1c: presets are not part of the token
transaction and no 1c flow changes them; note it in the Task 12 commit body.)

- [ ] **Step 4: Run to verify they pass**

Run (from `packages/editor`): the Step 2 command, then `npx vitest run src/editor/design-system src/engine/designSystem`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/editor/src/engine/designSystem/restorePoint.ts packages/editor/src/engine/designSystem/__tests__/restorePoint.test.ts packages/editor/src/editor/design-system/state
git commit -m "feat(brand): canvas preview hook, guarded Apply, restore points in the editor"
```

---

### Task 10: Dark mode setting + Auto switch flow + disabled dark preview — **UI, board BRP1-M8**

**Boards (node ids):** off `8224:238726` · auto `8224:239369` · generated-aliases `8224:240003` ·
dark-preview `8224:240644` · preview-disabled `8224:241285` · auto-dark-preview `8230:232622`.

**Files (expected; confirm against the boards):**
- Modify: `packages/editor/src/editor/design-system/ui/sections/ColourModeSection.tsx` (Dark mode Off/Auto control + the Auto flow)
- Create (if the board draws the flow as its own panel/dialog): `packages/editor/src/editor/design-system/ui/sections/DarkModeAutoFlow.tsx`
- Modify: `packages/editor/src/editor/design-system/ui/ColorModeToggle.tsx` (Dark disabled when Off, hint "Dark mode is off for this site")
- Test: `packages/editor/src/editor/design-system/ui/sections/__tests__/DarkModeSetting.test.tsx` (create), `packages/editor/src/editor/design-system/ui/__tests__/ColorModeToggle.test.tsx` (append)

**Interfaces:**
- Consumes: Task 1 `proposeMissingDarks`; Task 3 `setDarkMode`; Task 9 `useBrandPreview`, `useGuardedApply`, `takeRestorePoint`; `composer.designSystem.readOnly`.
- Produces: the six M8 states.

**Behaviour (the contract the tests pin):**
- Off → Auto: `proposeMissingDarks(store.all)`. Nothing missing → restore point (`dark-auto`) → `setDarkMode("auto", "Turn on dark mode")`. Something missing → **generated-aliases** state listing each filled token (id, light → dark swatch), canvas previewed with `{ tokens: proposal.tokens, darkMode: "auto", theme: "dark" }` (**dark-preview** / **auto-dark-preview**); **Confirm** → restore point → `clear()` → `setDarkMode("auto", "Turn on dark mode", proposal.tokens)`; **Cancel** → `clear()`, setting stays Off, nothing written.
- Auto → Off: `setDarkMode("off", "Turn off dark mode")`, no restore point (OQ-7). Stored dark values stay.
- Restore point refused → error copy "We couldn't save a restore point — nothing was changed." with Retry; nothing written (OQ-6).
- Off: the ColorModeToggle's Dark segment is disabled with the hint (**preview-disabled**); the canvas stays light (already true in the applier).
- Read-only Brand: the control is disabled (1a's read-only notice explains why).

- [ ] **Step 1: Gate.** `/plan-design-review` has run on the M8 boards. If not, stop.
- [ ] **Step 2: Load `figma:figma-design-to-code`, then `get_design_context` on each node above** (or `node scripts/baseline/figma-mcp.mjs` per editor CLAUDE.md).
- [ ] **Step 3: Write the failing RTL tests** — one `it` per state, with a fake composer (`getProjectSettings`, `designSystem.{readOnly, setDarkMode, setPreview, preview}`, `on/off`) and `takeRestorePoint` mocked:
  1. Off renders the board's Off copy; switching to Auto on a seed-only set where nothing is missing calls `takeRestorePoint(…, "dark-auto")` then `setDarkMode("auto", …)` with no `tokens`.
  2. A set with one semantic colour lacking dark → generated-aliases lists exactly that id with its proposed dark hex (`#F17953` for `#C2410C`), `setPreview` was called with `theme: "dark"`, `setDarkMode` not yet called.
  3. Confirm → `takeRestorePoint` once, then `setPreview(null)`, then `setDarkMode("auto", …, tokens)` where `tokens` resolve that id's dark to `#F17953`; a second click while pending does nothing (Confirm disabled).
  4. Cancel → `setPreview(null)`, no `setDarkMode`, the control reads Off.
  5. Unmount during generated-aliases → `setPreview(null)`.
  6. `takeRestorePoint` → false → the error copy, no `setDarkMode`.
  7. Auto → Off → `setDarkMode("off", …)`, no `takeRestorePoint`.
  8. `ColorModeToggle` with `darkMode: "off"`: Dark segment `disabled`, hint text present; with `"auto"`: enabled.
- [ ] **Step 4: Run** → FAIL.
- [ ] **Step 5: Build from the boards** with `@/editor/chrome-ui` + `tw:` + `var(--bk-*)` only.
- [ ] **Step 6: Run** → PASS; then `npx vitest run src/editor/design-system`.
- [ ] **Step 7: Verify = each board vs live, side by side, at 1440×900** (QA workspace, publish blocked, a v6 site with one custom colour lacking dark). Then measure: after Confirm, `getComputedStyle(document.documentElement).getPropertyValue("--buildrick-design-<id>")` under `data-theme="dark"` equals the proposed hex; one ⌘Z → Dark mode reads Off and the dark value is gone; a single-file export of the site contains `prefers-color-scheme` (Auto) and does not after ⌘Z (spec live done-condition "Migrated site: no dark blocks until Auto").
- [ ] **Step 8: Commit** `feat(brand): Dark mode Off/Auto with the missing-dark preview flow (BRP1-M8)`.

---

### Task 11: Colour scale generator — **UI, board BRP1-M9**

**Boards:** pick-colour `8224:241925` · generated-scale `8224:242543` · preview `8224:243206` · confirmed `8224:243869`.

**Files (expected):**
- Create: `packages/editor/src/editor/design-system/ui/sections/ScaleGenerator.tsx`
- Modify: the colour token entry point the board shows (`TokenDetailView.tsx` and/or `ColorTokenList.tsx`) — every semantic colour token (OQ-3)
- Test: `packages/editor/src/editor/design-system/ui/sections/__tests__/ScaleGenerator.test.tsx`

**Interfaces:**
- Consumes: Task 1 (`generateColorScale`, `applyScaleToRole`, `SCALE_STEPS`), Task 9 (`useBrandPreview`, `useGuardedApply`, `takeRestorePoint`), `ColorPicker`, `store.all`, `composer.designSystem.setTokens`.
- Produces: the four M9 states.

**Behaviour:** pick (ColorPicker, starts at the role's light value) → **generated-scale**: 11 swatches labelled 50…950 from `generateColorScale`, the picked step and dark step marked (copy per board: "Light → 700 · Dark → 300") → **preview**: `show(tokens => ({ tokens: applyScaleToRole(tokens, roleId, scale).tokens, darkMode: <site's>, }))` → **Confirm** (guarded) → `takeRestorePoint("generator")` → `clear()` → `setTokens(result.tokens, "Generate colour scale")` → **confirmed**. Cancel / unmount → `clear()`. An input `generateColorScale` refuses (translucent, not a colour) keeps Confirm disabled with the board's error copy. Swatch values always come from the generator, never the board's samples.

- [ ] **Step 1: Gate** (`/plan-design-review` run on M9).
- [ ] **Step 2: `figma:figma-design-to-code` → `get_design_context` on the four nodes.**
- [ ] **Step 3: Failing RTL tests:** picking `#C2410C` renders 11 swatches whose `data-hex` equal `generateColorScale("#C2410C").hexes` and marks 600 / 400; preview calls `setPreview` with a set whose `color-primary` light resolves to `#C2410C`; Confirm → `takeRestorePoint(…, "generator")` → `setPreview(null)` → `setTokens(…, "Generate colour scale")` once (double-click → once); restore point false → error copy, no `setTokens`; Cancel and unmount → `setPreview(null)`; `rgba(0,0,0,.5)` → Confirm disabled.
- [ ] **Step 4: Run** → FAIL. **Step 5: Build from the boards.** **Step 6: Run** → PASS.
- [ ] **Step 7: Board vs live at 1440×900**, then the spec live done-condition: pick one brand colour → `getComputedStyle` of a primary button on the canvas = the picked colour; under the Dark switch = the dark step's hex; one ⌘Z → both back; the restore list (Task 12, if landed) shows a "generator" row.
- [ ] **Step 8: Commit** `feat(brand): one colour to a full scale, previewed and undoable (BRP1-M9)`.

---

### Task 12: Restore points list — **UI, board BRP1-M10**

**Boards:** list `8224:244521` · empty `8224:245178` · restored `8224:245787`.

**Files (expected):**
- Create: `packages/editor/src/editor/design-system/ui/sections/RestorePointsSection.tsx`
- Modify: `packages/editor/src/editor/design-system/ui/BrandWorkspace.tsx` (nav entry + caption + render case, where the board places it)
- Test: `packages/editor/src/editor/design-system/ui/sections/__tests__/RestorePointsSection.test.tsx`

**Interfaces:**
- Consumes: Task 9 `useBrandRestorePoints`, `useGuardedApply`.
- Produces: the three M10 states. Reason labels (board copy wins if it differs): `theme-push` "Theme push", `migration` "Brand upgrade", `generator` "Colour scale", `dark-auto` "Dark mode on", `logo` "Brand from logo or website". No `connect` label (reality check 6).

- [ ] **Step 1: Gate** (`/plan-design-review` run on M10).
- [ ] **Step 2: `figma:figma-design-to-code` → `get_design_context` on the three nodes.**
- [ ] **Step 3: Failing RTL tests:** rows render time + reason label newest first; empty → the board's empty copy; Restore → `restore(id)` once (double-click → once) → **restored** state; `"refused"` / `"failed"` → the board's error copy (or a toast if the board has none), list unchanged; after a successful restore the list refreshes.
- [ ] **Step 4: Run** → FAIL. **Step 5: Build from the boards.** **Step 6: Run** → PASS.
- [ ] **Step 7: Board vs live at 1440×900**, then the spec live done-condition: make a big change (generator), **reload**, Restore the generator point → every token's resolved value equals the snapshot's (read `composer.getProjectSettings().designTokens` through `resolveTokenLiteral` for each id in the browser console, or measure the primary button) and one ⌘Z re-applies the change. Also: restore a point taken before a custom token was added and bound → restore succeeds and the bound element's computed colour is unchanged.
- [ ] **Step 8: Commit** `feat(brand): Brand restore points list (BRP1-M10)`.

---

### Task 13: Brand from logo or website — **UI, board BRP1-M11** (behind `dsAi`)

**Boards:** source `8224:246458` · loading `8224:247084` · preview `8224:247700` · no-colours `8224:248332` ·
timeout `8224:248970` · address-refused `8224:249604` · confirmed `8224:250233`.

**Files (expected):**
- Create: `packages/editor/src/editor/design-system/utils/decodeLogo.ts`
- Create: `packages/editor/src/editor/design-system/ui/sections/BrandFromSource.tsx`
- Modify: the Brand entry point the board shows (likely `StartersSection.tsx` or `ExportSection.tsx`'s Import area), rendered only when `isFeatureEnabled("dsAi")`
- Test: `packages/editor/src/editor/design-system/utils/__tests__/decodeLogo.test.ts`, `packages/editor/src/editor/design-system/ui/sections/__tests__/BrandFromSource.test.tsx`

**Interfaces:**
- Consumes: Task 2 (`quantizePixels`, `extractSvgColors`, `normalizeColorCounts`, `pickBrandRoles`, `mapFontFamily`, `downscaleSize`), Task 1 (`generateColorScale`, `applyScaleToRole`), Task 8 (`theme.extractBrandFromUrl`), Task 9 hooks, `setTokenLiteral`.
- Produces:
  - `decodeLogoColors(file: File): Promise<ColorCount[]>` — SVG (`image/svg+xml`, ≤ 1 MB) read as text → `extractSvgColors`; PNG/JPEG/WebP (≤ 5 MB) → `createImageBitmap` → canvas at `downscaleSize(w, h)` → `getImageData` → `quantizePixels`; anything else rejects `"UNSUPPORTED"`; over the size limit rejects `"TOO_BIG"`.
  - `brandProposal(tokens, roles: BrandRoles, fonts?: { heading?: string; body?: string }): { tokens: DesignToken[]; replaced: Array<{ from: string; to: string }> }` (exported from `BrandFromSource.tsx`'s sibling util if the component file gets long) — primary scale onto `color-primary`, accent scale onto `color-accent` when present, font tokens via `setTokenLiteral(…, "font-heading" | "font-body", "light", family)`.
  - the seven M11 states.

**Behaviour:** file or URL → **loading** → colours (`decodeLogoColors`, or the URL result through `normalizeColorCounts`) → `pickBrandRoles` → null → **no-colours** ("We couldn't find brand colours in this logo") with a ColorPicker whose pick becomes Primary; else **preview**: canvas via `useBrandPreview` with `brandProposal(...)`, colour chips, and one "replaced X with Y" line per `mapFontFamily(...).replaced` (OQ-11 picks heading/body from the URL result's `heading`/`body` counts). URL errors: message starting `TIMEOUT:` → **timeout**; `BLOCKED:` → **address-refused**; `TOO_MANY_REQUESTS` → the router's copy as a toast. **Confirm** (guarded) → `takeRestorePoint("logo")` → `clear()` → `setTokens(proposal.tokens, "Brand from logo")` → **confirmed**. Cancel / unmount → `clear()`. Nothing is uploaded: the logo never leaves the browser (D16).

- [ ] **Step 1: Gate** (`/plan-design-review` run on M11; `dsAi` flag understood — the section is absent when it is off).
- [ ] **Step 2: `figma:figma-design-to-code` → `get_design_context` on the seven nodes.**
- [ ] **Step 3: Failing tests.** `decodeLogo.test.ts`: an SVG `File` returns `extractSvgColors` of its text and never calls `createImageBitmap` (spy); a 6 MB PNG rejects `TOO_BIG`; a `text/plain` file rejects `UNSUPPORTED`; a PNG path with `createImageBitmap` stubbed to `{ width: 6000, height: 4000 }` and a stub canvas draws at `downscaleSize(6000, 4000)`. `BrandFromSource.test.tsx`: one `it` per state with the tRPC client and `decodeLogoColors` mocked; Confirm order (`takeRestorePoint` → `setPreview(null)` → `setTokens`) and double-click → once; unmount clears the preview; fonts: a URL result with `Tiempos Headline` (serif, heading) shows "replaced Tiempos Headline with Playfair Display".
- [ ] **Step 4: Run** → FAIL. **Step 5: Build from the boards.** **Step 6: Run** → PASS.
- [ ] **Step 7: Board vs live at 1440×900** for every state (`NEXT_PUBLIC_FEATURE_DS_AI=true` on the worktree dev server). Live done-condition (spec §9): upload a logo → the canvas repaints with its colours in ≤ 2 steps (measure a primary button's computed colour = the picked primary); Confirm → one ⌘Z reverts; a "logo" row is in the restore list. URL: a real public site → preview; `http://127.0.0.1:3000` and `http://169.254.169.254` → address-refused, and the dev server log shows `[brand-extract] failed { kind: 'BLOCKED' … }` with no page content.
- [ ] **Step 8: Commit** `feat(brand): brand from a logo or a website, previewed and undoable (BRP1-M11)`.

---

### Task 14: Theme-toggle block in Add, on canvas, on the published page — **UI, board BRP1-M12**

**Boards:** add-panel-auto `8228:232784` · canvas-light `8228:233132` · canvas-dark `8228:233404` ·
published-auto `8228:233676` · off-hidden-on-publish `8228:233827` · published-dark `8230:232749`.

**Files (expected):**
- Modify: `packages/editor/src/editor/sidebar/tabs/build/catalog/groups.ts` (and `catalog.ts` if the board puts the tile under ELEMENTS) — filter with `isThemeToggleOffered(darkMode)`
- Modify: `packages/editor/src/editor/sidebar/tabs/build/BuildTab.tsx`, `hooks/useBuildTab.ts` (read the site's Dark mode reactively on `EVENTS.SETTINGS_CHANGE`; search uses the same filtered rows)
- Modify: the canvas element chrome where the board draws the Off note (selected toggle on an Off site)
- Modify: `ThemeToggle.ts` icons/sizes only if the board's glyphs or dimensions differ (keep the data contract and token bindings)
- Test: `packages/editor/src/editor/sidebar/tabs/build/__tests__/BuildTab.themeToggle.test.tsx` (create)

**Interfaces:**
- Consumes: Task 4 (runtime, CSS), Task 5 (`themeToggleBlockConfig`, `isThemeToggleOffered`, the `theme-toggle-hidden` check).
- Produces: the six M12 states.

- [ ] **Step 1: Gate** (`/plan-design-review` run on M12).
- [ ] **Step 2: `figma:figma-design-to-code` → `get_design_context` on the six nodes.**
- [ ] **Step 3: Failing RTL tests:** Add panel lists the "Theme toggle" tile when the site is Auto and not when Off (both the group list and search); flipping Dark mode via a `settings:change` emit shows/hides it without remount; on an Off site with a toggle selected, the board's note ("Hidden on the published site while Dark mode is off" — board copy wins) is shown.
- [ ] **Step 4: Run** → FAIL. **Step 5: Build from the boards.** **Step 6: Run** → PASS.
- [ ] **Step 7: Board vs live at 1440×900:** add-panel-auto, canvas-light, canvas-dark (editor Dark switch), off note. **Published boards are verified on a single-file export, never a publish:** export the QA site, open the HTML in the browser — Playwright `emulateMedia({ colorScheme: "light" })` → light icon visible, click → `document.documentElement.dataset.theme === "dark"` and the dark icon visible (published-dark), reload → still dark with no light frame (record a trace and check the first paint), `colorScheme: "dark"` with no stored choice → dark (published-auto); set Dark mode Off, export again → `getComputedStyle(toggle).display === "none"` (off-hidden-on-publish) and Brand checks lists the toggle warning.
- [ ] **Step 8: Commit** `feat(brand): theme-toggle block in Add, canvas and export (BRP1-M12)`.

---

### Task 15: New sites start Auto — **runs only if the owner answers OQ-1 "Auto"**

**Files:**
- Modify: `server/services/sites.service.ts` (`createSite` — both `tx.site.create` calls)
- Modify: `server/services/template.service.ts` (`prisma.site.create` ~:143)
- Modify: `packages/dashboard/app/api/workers/ai-generate/[jobId]/route.ts` (`tx.site.create` ~:186)
- Test: `__tests__/db/new-site-dark-mode.db.test.ts` (create)

- [ ] **Step 1: Gate.** OQ-1's answer in this plan's table is "Auto". Otherwise mark this task skipped in the PR and stop.
- [ ] **Step 2: Failing DB test:** a blank site, a template site (via `createSite` with `method: "template"`) and a `template.service` site each have `projectSettings.darkMode === "auto"`; a duplicated site keeps its source's value; an existing site is untouched.
- [ ] **Step 3: Run** → FAIL.
- [ ] **Step 4: Implement:** each create writes `projectSettings: { darkMode: "auto" }` (the AI worker's update branch for an existing row is left alone). The editor already keeps it: `loadTokensSafely` returns settings unchanged when no tokens are stored, and Task 3's `setDarkMode` path is not needed for a value set at creation.
- [ ] **Step 5: Run** → PASS (`pnpm test:db -- __tests__/db/new-site-dark-mode.db.test.ts __tests__/db/duplicate-site-settings.db.test.ts`).
- [ ] **Step 6: Commit** `feat(brand): new sites start with Dark mode Auto (D8)`.

---

### Task 16: E2E, full gates, live verification, rollout notes

**Files:**
- Modify: `packages/dashboard/e2e/brand-tokens.spec.ts`
- Modify: `docs/runbooks/brand-token-migration.md` (new §7)

- [ ] **Step 1: Add the 1c E2E flows** to `brand-tokens.spec.ts` as `test.describe("Brand Part 1c", …)`, reusing
  the file's seeding helpers, `blockPublish`, `openEditor`, `openBrand` and its `afterEach` "no
  sites.publish request" assertion. Seed a **v6** site with `darkMode: "off"` and one custom semantic colour
  `color-brand-x` (`#C2410C`, no dark) bound by a heading.

```ts
test("Dark Auto: generate → preview → confirm, one ⌘Z back (eng T1 flow 3)", async ({ page }) => {
  // seed as above; openEditor; openBrand → Colour mode
  const heading = page.frameLocator("iframe").locator("h1").first(); // use the file's canvas locator if different
  const colour = () => heading.evaluate((el) => getComputedStyle(el).color);
  await page.getByRole("switch", { name: /dark mode/i }).click(); // control name per board M8
  await expect(page.getByText("color-brand-x")).toBeVisible(); // generated-aliases lists it
  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.theme)).toBe("dark");
  await expect.poll(colour).toBe("rgb(241, 121, 83)"); // #F17953 previewed on the canvas
  await page.getByRole("button", { name: /confirm/i }).click();
  await page.keyboard.press("Meta+z");
  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.theme)).toBe("light");
});

test("generator: one colour repaints Primary; one ⌘Z restores it", async ({ page }) => {
  // seed a v6 site with an inserted Button; openBrand → Primary → generate (board M9 entry)
  // pick #0E7490 → preview → confirm → the button's computed background is rgb(14, 116, 144); ⌘Z → before
});

test("restore point: a generator change is listed and restores after reload", async ({ page }) => {
  // run the generator as above; reload; open Restore points; Restore the "Colour scale" row
  // → the button's computed background equals the pre-generator value
});
```

  Replace the comment lines with real code following the existing flows; take control names from the
  shipped components (Tasks 10–12), not from this sketch.

- [ ] **Step 2: Run E2E locally only** (see the spec file's header):
  `PW_FORCE_LOCAL=1 PW_BASE_URL=http://localhost:<port> npx playwright test e2e/brand-tokens.spec.ts --project=chromium` (from `packages/dashboard`) → all flows PASS, publish count 0.

- [ ] **Step 3: Full gates, alone** (repo root, nothing else running):

```bash
cd packages/editor && npx tsc --noEmit > /tmp/tsc-ed.log 2>&1; echo "editor tsc $?"
cd ../.. && npx tsc --noEmit -p packages/dashboard > /tmp/tsc-dash.log 2>&1; echo "dashboard tsc $?"
cd packages/editor && npx vitest run > /tmp/vitest-ed.log 2>&1; echo "editor vitest $?"; tail -5 /tmp/vitest-ed.log
cd ../.. && npx vitest run > /tmp/vitest-root.log 2>&1; echo "root vitest $?"; tail -5 /tmp/vitest-root.log
pnpm test:db > /tmp/vitest-db.log 2>&1; echo "db $?"; tail -5 /tmp/vitest-db.log
cd packages/editor && pnpm run verify:ds > /tmp/verify-ds.log 2>&1; echo "verify:ds $?"
cd ../.. && pnpm run audit:rules > /tmp/audit-rules.log 2>&1; echo "audit:rules $?"
```

  Expected: every exit `0` (`audit:rules` is an audit: read each finding before believing it). Rerun a
  known-flaky file alone before treating its failure as real.

- [ ] **Step 4: Live verification** on a worktree dev server (`NEXT_PUBLIC_APP_URL`/`AUTH_URL`/`NEXTAUTH_URL`
  = `http://localhost:<port>`, `NEXT_PUBLIC_FEATURE_DS_AI=true`, `BRAND_TOKENS_V2=on`), QA workspace,
  **publish blocked**. Measure with `getComputedStyle`, never by eye:
  1. Generator: pick one colour → the primary scale and its dark alias update; one ⌘Z (Task 11).
  2. Dark mode: a migrated (Off) site's single-file export has no `prefers-color-scheme` block; switch to Auto with the missing-dark flow → the export has it and an exported page turns dark under `colorScheme: "dark"` (Task 10).
  3. Dark mode Off → the editor's Dark segment is disabled with the hint.
  4. Restore: big change → reload → Restore → tokens match the snapshot (Task 12).
  5. Logo: upload → canvas repaints in ≤ 2 steps; ⌘Z; restore row listed. URL: a public site works; a private address is refused (Task 13).
  6. Theme toggle: Auto → in Add; export → click flips and persists, no flash; Off → hidden in export + Brand check (Task 14).
  7. A fresh site (never saved a token): Off → Auto → wait for autosave → reload → still Auto (Review Focus 1).
  State in the PR which of these were **not** verified and why (e.g. Task 15 skipped under OQ-1).

- [ ] **Step 5: Runbook §7 "Part 1c rollout"** in `docs/runbooks/brand-token-migration.md`:
  - No Prisma migration, no new env var. `NEXT_PUBLIC_FEATURE_DS_AI` now also gates the server's
    `theme.extractBrandFromUrl` (404 unless `"true"`; baked at build like every `NEXT_PUBLIC_*`).
  - New outbound traffic: the URL import fetches user-supplied public pages (http/https, ports 80/443, ≤ 3
    redirects, 2 MB page + 4 × 1 MB CSS, 10 s budget), pinned to the vetted IP. Rate limits 10/10 min per
    user, 30/10 min per workspace (`rate_limit_buckets` keys `brand-extract:*`). Failures log
    `[brand-extract] failed { kind, siteId }`, never page content.
  - Restore points: `generator | dark-auto | logo` rows in `site_theme_snapshots`, capped at 10 per site with
    `theme-push` (migration rows exempt). Admin theme-push rollback still only takes `theme-push` rows.
  - Dark mode: no site changes on deploy — every existing site stays Off until its owner switches (and new
    sites too unless Task 15 shipped). Rollback = revert the 1c commits; a site already switched to Auto keeps
    publishing dark blocks (that path is 1a's) until its owner turns Auto off.
  - Theme toggles placed while 1c is live are plain buttons after a revert (no runtime, no hide rule) — check
    `SELECT count(*) FROM pages WHERE content::text LIKE '%data-bk-theme-toggle%'` (read-only, owner runs it
    against prod) before reverting.

- [ ] **Step 6: Commit**

```bash
git add packages/dashboard/e2e/brand-tokens.spec.ts docs/runbooks/brand-token-migration.md
git commit -m "test(e2e): brand part 1c — Dark Auto, generator, restore; runbook rollout notes"
```

(Adjust the read-only SQL in Step 5 to the real page-content column after reading `prisma/schema.prisma`'s
`Page` model.)

---

## Self-Review notes (run by the plan author)

- **Spec coverage (1c scope):** §7 generator (fixed 11-step output, picked colour exact, dark clamp, one
  transaction, restore point first, design review of the look) → Tasks 1, 11 (test 12). §2 Dark mode
  Auto/Off, D11 fill + preview + restore point + one ⌘Z, disabled dark preview when Off, editor always sets
  `data-theme` (kept, preview aware) → Tasks 1, 3, 10 (tests 9 Auto half, 18). §2 D12 toggle (flip,
  persist, no flash, Add only when Auto, token-bound, hidden on publish when Off, Brand check) → Tasks 4, 5,
  14 (test 22). §8 restore list (reasons, cap 10, migration exempt, client restore, one ⌘Z, Dark mode
  restored with a `dark-auto` point, EDITOR not VIEWER, legacy rows hidden) → Tasks 6, 9, 12 (tests 13, 17
  parts, 27). §9 logo (browser decode, ≤ 4 MP, SVG never rasterized, no upload endpoint, no colours →
  picker) and URL (server fetch, pinned IP, redirects re-checked ≤ 3, size/time limits, rate limit, font
  sanitizing, Google family kept / others replaced, no AI needed, behind `dsAi`) → Tasks 2, 7, 8, 13
  (tests 14, 28). §10 preview reverts on cancel/navigation/unmount and Apply disabled in flight → Task 9
  (test 29 halves) + each UI task. E2E flow 3 → Task 16. **Not in 1c:** contrast guard (Part 2, D5);
  `connect` restore points (1b OQ-4); AI role naming (OQ-9 default); seed primitive scales (OQ-8 default);
  new sites Auto (OQ-1 default, Task 15 gated).
- **Spec items that changed shape because of the code:** Dark mode always writes tokens (reality check 3);
  restore merges keep-in-use (reality check 7); the pure code sits in the editor engine per eng D1 (reality
  check 9); the server returns raw literals so no colour math is duplicated server-side; the toggle runtime
  follows the interaction runtime so export and publish both get it (reality check 13).
- **Placeholder scan:** UI tasks 10–14 cannot carry board markup before `get_design_context` runs; their
  tests are pinned by behaviour state and their boards by node id. Three test files (useGuardedApply,
  useBrandRestorePoints, useDSLint.themeToggle) are specified case-by-case against existing harnesses the
  implementer must read first; every assertion is stated.
- **Type consistency:** `ColorScale.{hexes,pickedStep,darkStep,mirrorStep}` (Task 1) is what Tasks 10, 11,
  13 read; `BrandPreview` (Task 3) is what `useBrandPreview` (Task 9) produces and the applier paints;
  `setDarkMode(mode, label, tokens?)` (Task 3) is what Tasks 9, 10 call; `ExtractedBrand.colors[].value`
  (Task 8) feeds `normalizeColorCounts` (Task 2); `BrandRestorePoint.{designTokens,tokensSchemaVersion,
  darkMode}` (Task 6) is what `restoredTokens` / `restore` (Task 9) read; `THEME_TOGGLE_ATTR` /
  `THEME_TOGGLE_ICON_ATTR` (Task 4) are what the block (Task 5) writes.
