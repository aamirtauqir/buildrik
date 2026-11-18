# Factory-readiness audit — gated multi-agent pipeline foundations

- **Date:** 2026-10-15
- **Commit audited:** `65163bb0d0f4d930b57009ebecb8698eed5b1f5c` (local `main`, 1 commit ahead of `origin/main` `fb1697cbd`, 0 behind)
- **Mode:** read-only. Only write: this file. It replaces an earlier version of this report (same date, commit `df60cf9ec`, untracked). Every volatile figure below was re-measured at `65163bb`; stable path claims were re-checked for existence.

**Side effects, disclosed:** one root `vitest run`, one `tsc` baseline gate, one editor ESLint run, one `pnpm audit`, one `audit:rules` run, one failed `pnpm lint`. No dev server started. One stray log (`$TMPDIR/../tsc.log`, outside the repo) was written by mistake and deleted. After the vitest timeout, `pgrep -f vitest` showed no surviving process.

Statuses: FOUND / PARTIAL / MISSING / UNKNOWN / NOT RUN.

---

## 1. Repository overview

### Stack — FOUND
- Languages: TypeScript (1,967 `.ts`, 1,435 `.tsx` tracked), `.mjs` scripts (322), SQL migrations (72 `.sql`, 70 migration dirs), some Python.
- Frameworks: Next.js 16.2.2 (App Router, Turbopack), React 19, Tailwind 4, tRPC 11, NextAuth 5.0.0-beta.30, Prisma 5 + PostgreSQL, Vite (editor), Flowbite React, Stripe, OpenAI, Sentry, Vercel Blob.
- Package manager: pnpm (workspace `pnpm-workspace.yaml` → `packages/*`, `allowBuilds` list). `turbo.json` exists but no root script calls turbo. CI uses Node 22.
- Monorepo: `packages/dashboard` (Next app), `packages/editor` (Vite app, also bundled into Next), `packages/shared` (schemas/contracts). The root `package.json` is also named `@buildrik/dashboard` and owns the runtime deps (documented in `CLAUDE.md`).
- Top level (depth 2, generated dirs skipped): `__tests__/`, `archive/`, `docs/`, `learn/` (untracked), `lib/`, `packages/{dashboard,editor,shared}`, `prisma/`, `reports/`, `scratchpad_audit/`, `scripts/`, `server/{services,trpc}`, `src/`, `types/`, `video/`; stray file `undefined`; root `.md` files: `CLAUDE.md`, `DESIGN.md`, `CHANGELOG.md`, `TODOS*.md`, `TASKS_LANE_{A,B}.md`, `V1_*.md`, `ux-audit-20260621.md`.
- Generated/vendored on disk: `node_modules/`, `.next/`, `.pnpm-store/`, `packages/*/node_modules`, `packages/editor/{dist,coverage,playwright-report,test-results}`, `packages/dashboard/{.next,playwright-report,test-results}`, `tsconfig.tsbuildinfo`.

### Entry points / build / start — FOUND
- Dashboard: `packages/dashboard/app/` (App Router), `middleware.ts`, `instrumentation.ts`. Root: `pnpm dev` (`next dev --turbopack`), `pnpm build` (`next build`), `pnpm start`.
- Editor: `pnpm --filter @buildrik/editor dev` (Vite, :5050 — standalone demo, does not load real projects per `CLAUDE.md`), `build` = `tsc && vite build`.
- Documented in `CLAUDE.md` and `packages/editor/CLAUDE.md` §BUILD & DEV. No README.

### Size
- Tracked files: 6,920. Extensions: ts 1967, tsx 1435, md 1100, png 779, json 503, mjs 322, html 297, jsonl 88, svg 82, sql 72.
- Largest tracked dirs: `packages/editor` 3,428 · `docs/design-jobs` 830 · `packages/dashboard` 482 · `docs/reviews` 284 · `docs/plans` 228. Disk sizes: UNKNOWN (not measured).

### Git
- Default branch `main`; repo `aamirtauqir/buildrik`, **public**.
- Branches: 206 local, 23 remote.
- Last 10 commits:
  - 2026-10-15 test(dashboard-e2e): settings smoke checks the Phase B §25 groups, not the pre-regroup links (`65163bb`, unpushed)
  - 2026-10-15 fix(redirects): escape the CSV byte-order mark in the strip regex (no-irregular-whitespace)
  - 2026-10-15 fix(context-menu): Tab closes the canvas element menu from either level
  - 2026-10-15 Merge origin/main into main
  - 2026-10-15 docs(todos): defer scripted Preview on an isolated origin (P2)
  - 2026-10-15 fix(context-menu): keyboard reaches submenu rows; ARIA follows the active level
  - 2026-10-10 Merge remote-tracking branch 'origin/main' into fix/p2-figma-authority
  - 2026-10-10 docs(audits): status-p2 — design-authority package (FG-002/001/004/012, DQ-015, DQ-026, L2-031)
  - 2026-10-10 fix(p2): design authority — Review v2 current, Page settings Cancel/Save, DQ-015/DQ-026/L2-031 board+code
  - 2026-10-10 docs(audits): owner accepted the 8 plan-question defaults; CMS items unblocked
- Uncommitted: **60 entries** (not touched). Modified: `CLAUDE.md` (+35 lines, the `PRODUCT-DESIGN-GUARD` block). Untracked: `auth.json` (see §8), `learn/`, `reports/`, `docs/factory-readiness-audit.md` (this file), `docs/reviews/{prototype,wireframes}.zip`, 30 `packages/editor/docs/audit-2026-09-21/dump/live-*.json`, 12 files directly in `packages/editor/`, several `packages/editor/docs/*-2026-09/10-*` audit dirs, `packages/editor/scripts/figma/`.
- `.gitignore`: FOUND. Covers `node_modules/`, `.next/`, `.env`, `.env.local`, `.env*.local`, `.env*.bak*`, `*.tsbuildinfo`, `dist/`, `coverage/`, `*.log`, `.claude/`, `.superpowers/`, `.gstack/`, `.worktrees/`, `.walk/`, `.board-diff/`, `.playwright-mcp/`, `scratchpad_audit/`, `docs/reference/`, generated design HTML, video binaries. **Not covered:** `auth.json` (Playwright storageState).

---

## 2. Tests

### Frameworks — FOUND
| Tool | Config | Scope |
|---|---|---|
| Vitest 4.1 | `vitest.config.ts` (root, jsdom) | `__tests__`, `lib`, `server`, `packages/{editor/src,shared,dashboard/app,dashboard/components}`; excludes `*.db.test.ts` |
| Vitest 4.1 | `vitest.db.config.ts` | `*.db.test.ts`; globalSetup `__tests__/db/setup.ts` builds `buildrik_test`, refuses non-localhost |
| Vitest 4.1 | `packages/editor/vitest.config.ts` | editor-only, with coverage block |
| Playwright | `packages/editor/playwright.config.ts` | `e2e/` style parity, target size, visual pins (chromium) |
| Playwright | `packages/dashboard/playwright.config.ts` | `e2e/` smoke + `bs-*` BrowserStack projects |

### Test files — FOUND
1,575 tracked (`*.test.*` + 13 `*.spec.*`): `packages/editor/src` 1,127 · `__tests__` 151 · `server` 125 · `packages/dashboard/components` 69 · `packages/dashboard/app` 26 · `lib` 23 · `packages/shared` 20 · `packages/editor/scripts` 10 · `packages/dashboard/e2e` 8 · `packages/editor/e2e` 5.

Layers: unit/component FOUND · DB integration (`*.db.test.ts`, 29 files) FOUND · e2e (13 Playwright specs) FOUND · visual (`packages/editor/e2e/visual-pins.spec.ts`, darwin PNG baselines; skipped on ubuntu CI) PARTIAL · snapshot: 0 `.snap` files.

### Commands
`pnpm test` (root `vitest run`, primary — includes editor) · `pnpm test:db` (Postgres) · `pnpm --filter @buildrik/editor test` · `pnpm --filter @buildrik/editor test:parity` · `pnpm --filter @buildrik/dashboard test:e2e`.

### Run result — **NOT RUN (time-box exceeded)**
- `timeout 600 pnpm test` → `EXIT=124 SECS=601`, no summary (default reporter prints nothing per file when not a TTY, so no partial count). No orphan process left.
- **CI evidence instead** (GitHub Actions, commit `fb1697cbd`, 2026-10-14, = HEAD minus one test-only commit):
  - "Dashboard tests" › vitest (root config, whole repo): `Test Files 1519 passed (1519)`, `Tests 14847 passed | 3 skipped | 22 todo (14872)`, `Duration 847.53s`.
  - "editor" › repo-root tests: `392 passed (392)` files, `3123 passed | 3 skipped`, 251 s.
  - "editor" › db tests: `29 passed (29)` files, `138 passed`, 46 s.
  - "Dashboard tests" › playwright smoke: `1 failed | 9 passed` — `e2e/dashboard.spec.ts:48 Settings rail exposes workspace/platform/billing/personal groups`. HEAD `65163bb` (unpushed) changes exactly this test; result UNKNOWN until pushed.
  - "editor" › browser › Style parity: `18 failed | 19 skipped | 11 passed` — computed-style drift vs `packages/editor/e2e/baselines/*.json` (e.g. `media-drawer-upload-failed`: font-family `Inter, "Inter Tight"` → `Inter`, height 40px → 32px).

### Coverage — PARTIAL
- `@vitest/coverage-v8` only in `packages/editor` (`test:coverage`), no thresholds, not in CI. No dashboard/server coverage.
- Last recorded figure: `docs/audits/2026-07-08-editor-deep-audit.md` — 52.05% editor lines (dated July; not re-measured).

### Fixtures — FOUND
- Seeds: `prisma/seed.ts` (`pnpm db:seed`, used by CI e2e), `prisma/seed-settings-clone.ts` (no script entry; contains `deleteMany`/raw SQL).
- Older-format documents: `packages/editor/src/engine/designSystem/migrations/projectMigrations/__fixtures__/000{1,2}.{before,after}.json`, `packages/editor/src/engine/migration/__tests__/__fixtures__/legacyContainerTypes.{project,export}.json`.
- Saved projects/exports: `packages/editor/e2e/fixtures/inspector-v4-site.json`, `packages/dashboard/e2e/fixtures/brand-v5-export-tokens.json`, `packages/editor/e2e/fixtures/clone-assets/`.
- Parity baselines: `packages/editor/e2e/baselines/*.json`.

### Weakened tests
- `.skip(`: 6 occurrences in 4 files (CI shows 3 skipped in `__tests__/template-ai-components.test.ts`; rest in editor e2e specs).
- `.todo(`: 22.
- `.only(`, `xit(`, `xdescribe(`, `test.fixme`: 0.
- Files with no `expect`/`assert`: 3 — all `packages/editor/eslint-rules/__tests__/*.test.mjs`, which use ESLint `RuleTester` (asserts internally). Effective count 0.
- Bulk snapshot updates: none (0 `.snap`). The 18 failing parity baselines are a pending bulk-rebaseline risk: a "fix" that rewrites all 18 JSONs would pass CI without review.

---

## 3. Static checks

| Check | Command | Result here |
|---|---|---|
| Typecheck (editor + dashboard, ratchet) | `node packages/editor/scripts/check-tsc-baseline.mjs` (`gate:tsc`) | **PASS** — 0 errors editor, 0 dashboard, 344 s (ran concurrently with vitest) |
| Lint — editor | `pnpm --filter @buildrik/editor lint` (`packages/editor/eslint.config.mjs`) | **FAIL locally: 947 problems (570 errors, 377 warnings), exit 1.** All 570 errors are in gitignored/untracked scratch (`scratchpad_audit/` 45 files, `.playwright-mcp/` 19, `.scratch/` 3); **0 errors in tracked files**. CI clean checkout: `✖ 377 problems (0 errors, 377 warnings)` |
| Lint — dashboard / server / lib | root `pnpm lint` → `next lint` | **MISSING (broken):** `Invalid project directory provided, no such directory: .../lint` (Next 16 removed `next lint`). No ESLint config outside `packages/editor` |
| Formatter | — | **MISSING** (no Prettier/Biome) |
| DS / conformance gates | `pnpm --filter @buildrik/editor verify:ds`, dashboard `gate:ds`, `gate:figma`, `gate:trpc-orphans`, `gate:button-variants`, root `gate:baked-flags` | NOT RUN individually (pre-push runs them; CI "build + test" passed `verify:ds`) |
| Doc drift | `pnpm run audit:rules` | 7 docs, **0 present-tense stale claims**, 9+ historical mentions; env vars not checked (by design) |

### Hooks — PARTIAL
- No husky, lint-staged, pre-commit framework, or `prepare` script. **No pre-commit hook.**
- `core.hooksPath` = `.git/hooks`. `.git/hooks/pre-push` is active and identical to source `packages/editor/scripts/hooks/pre-push` (installed by `hooks:install`, per-clone, manual). `BLOCK_ON_FAIL=true`. Runs `verify:ds`, dashboard `gate:ds`, `gate:figma`, `gate:trpc-orphans`, `gate:button-variants` (skipped without `BK_STATE` + dev server), spec-age check. **Runs no vitest and no ESLint.** Header comment line 19/111 still describes WARN-only mode (stale text; code blocks).

---

## 4. CI/CD and branch protection

### CI — PARTIAL (runs, red)
`.github/workflows/` (GitHub Actions, ubuntu, Node 22, pnpm, `--frozen-lockfile`):

| Workflow | Triggers | Runs | Last 20 runs |
|---|---|---|---|
| `dashboard-tests.yml` | PR on app paths; push `main` | `vitest`: `db:generate`, `vitest run` (full root suite). `playwright smoke`: postgres:16, `migrate deploy`, seed, `e2e/dashboard.spec.ts` | **20/20 failure.** Latest: vitest ✔, smoke ✘ (1 test) |
| `editor-ci.yml` | PR + push `main` on editor/shared/server/lib/tests/prisma | `build + test`: prisma generate, `vite build`, `verify:ds` (incl. tsc gate), DS gates, ESLint (blocking on errors), vitest editor + root. `db tests`: `test:db`. `browser`: `test:parity`, target-size, spec-age (warn), Figma conformance (`continue-on-error`) | **20/20 failure.** Latest: build+test ✔, db ✔, browser ✘ (Style parity, 18 tests) |
| `editor-dashboard-build.yml` | PR + push `main` | `pnpm build` (next build, dummy `DATABASE_URL`) | 20/20 success |

Tests, lint (editor only), typecheck, build: all run in CI. Red status is from two browser jobs only.

### Deploy — PARTIAL (manual only)
- Nothing deploys from CI. Production is the cPanel Node app at `app.buildrick.io` (`docs/cpanel-deploy.md`, `CLAUDE.md` §Where the values live): local `pnpm build`, manual swap, smoke.
- Helpers: `scripts/set-prod-env.mjs` (`env:set:prod`; SSH + `cloudlinux-selector set --env-vars`, which replaces the whole env map; dry-run default, `--apply`/`--restart`), `scripts/check-prod-env-live.sh` (`env:check:prod`, read-only SSH), `scripts/check-prod-env.mjs`, `scripts/smoke-deployed.mjs` (`smoke:prod`), `scripts/check-baked-flags.mjs` (`gate:baked-flags`).
- Conflicting doc: `docs/prod-deploy.md` describes a Vercel deploy; `vercel.json` defines crons.
- Secrets needed (names): `DATABASE_URL`, `NEXTAUTH_SECRET`/`AUTH_SECRET`, `NEXTAUTH_URL`/`AUTH_URL`, `AUTH_TRUST_HOST`, `NEXT_PUBLIC_APP_URL`, `CRON_SECRET`, `GOOGLE_CLIENT_ID/SECRET`, `GITHUB_CLIENT_ID/SECRET`, `SMTP_HOST/PORT/USER/PASS(_B64)`, `EMAIL_FROM`, `VERCEL_INTEGRATION_ID`, `VERCEL_CLIENT_ID/SECRET`, `ENCRYPTION_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_*`, `OPENAI_API_KEY`, `BLOB_READ_WRITE_TOKEN`, `SENTRY_*`, `NEXT_PUBLIC_FEATURE_*`, plus cPanel SSH access. CI workflows reference no `secrets.*`.

### Branch protection — MISSING
- `gh api repos/aamirtauqir/buildrik/branches/main/protection` → `{"message":"Branch not protected","status":"404"}`.
- `gh api repos/aamirtauqir/buildrik/rulesets` → `[]`.
- No required reviews, no required checks, force-push and deletion unrestricted. No `CODEOWNERS`. No `.github/dependabot.yml`.

---

## 5. Run / preview recipe

### Documented steps — PARTIAL
Assembled from `CLAUDE.md`, `packages/editor/CLAUDE.md`, root `package.json` (no README):
1. `pnpm install`
2. `.env.local` at root (template `.env.local.example`) and `packages/dashboard/.env` with `DATABASE_URL` (Prisma CLI reads only `.env`).
3. `pnpm db:generate`; `pnpm db:push` or `prisma migrate deploy`; `pnpm db:seed`.
4. `pnpm dev` (dashboard :3000) and/or editor `dev` (:5050).
5. `pnpm --filter @buildrik/editor hooks:install` once per clone.

Gaps visible without running:
- No single clean-checkout sequence in one place; `db:push` vs `migrate deploy` unstated (CI uses `migrate deploy`, 70 migrations).
- `.env.example` is stale: uses `STRIPE_PRO_MONTHLY_PRICE_ID` etc.; code reads `STRIPE_PRICE_PRO_MONTHLY` (`server/services/stripe.client.ts:26`); lists `VERCEL_TOKEN` (legacy) and `VITE_FEATURE_*` without the `NEXT_PUBLIC_` half that ships.
- `.env.local.example` (12 keys) lacks `NEXT_PUBLIC_UNIFIED_EDITOR`, without which "Edit site" points at the dead demo (`CLAUDE.md` §Editor).
- Dev login needs SMTP or a magic-link workaround documented only in user memory, not in the repo.
- No Docker/compose file for Postgres.

### Env / services
- Env names: `CLAUDE.md` §Server env vars (full table). Templates: `.env.example` (17 keys), `.env.local.example` (12 keys).
- External services: PostgreSQL (required), SMTP, Vercel OAuth + Blob, Stripe, OpenAI/Ollama, Sentry, Pexels/Unsplash, Cloudflare Turnstile.
- Docker/compose: **MISSING**.

### Run/verify skill — MISSING
No `.claude/skills/run-*` or `verify` skill in the repo. Closest: `verify:ds`, pre-push hook, `scripts/smoke-*`, `scripts/audit/verify-login.mjs`.

### Dev server probe — NOT RUN
Dashboard `pnpm dev` needs Postgres + auth env (not dependency-free). Editor `dev` is dependency-free but is only the standalone demo; not started this run (prior run of this audit: HTTP 200 on :5050).

---

## 6. Documentation agents would rely on

- **README:** **MISSING** at root. Setup/commands/architecture are in `CLAUDE.md` (415 lines).
- **Architecture:** `CLAUDE.md` §Architecture / Data Flow / Folder rules; `DESIGN.md` (design system); `docs/PRODUCT-OVERVIEW.md`; four `AGENTS.md` module-boundary docs. **ADRs: MISSING** (no `docs/adr`, `docs/decisions`).
- **Spec template: MISSING** (no `docs/specs/`). Specs/plans scattered: `docs/plans` (228 files), `docs/superpowers/{plans,specs}`, `docs/prd`, `docs/audits`, `docs/reviews`, `docs/design-jobs`, `docs/runbooks`, root `TODOS.md`, `TASKS_LANE_A/B.md`. `.claude/skills/product-design-guard/templates/` holds design-decision templates (UI-only). No issue-tracker integration in repo.
- **Inventories (point-in-time, dated):** feature — `docs/prd/editor/12-feature-catalog.md`, `docs/audits/2026-09-29-prd/FEATURE_INVENTORY.md`; ownership — `docs/design-jobs/IA-AUDIT-OWNERSHIP-2026-09-25.md`; token catalog — `docs/prd/editor/06-design-system-catalog.md`; Figma board census — `packages/editor/scripts/conformance/boards.json`. Panel/layout and navigation maps as maintained files: MISSING.
- **Figma references:** 218 `figma.com` mentions in 91 tracked files (not fetched).

---

## 7. Existing Claude Code setup

### Instruction files
| Path | Lines | Content | Flags |
|---|---|---|---|
| `CLAUDE.md` | 415 (35 uncommitted) | Facts (stack, architecture, env table) + rules + procedures (stated-goal protocol, skill routing, product-design workflow) | Procedures that belong in skills: deploy/env checklist, verification protocol. Stale: "new domain → `lib/validations/[domain].ts`" — `lib/validations/` does not exist. Heavy dated history inline. |
| `packages/editor/CLAUDE.md` | 735 | Rules + procedures (Figma rebuild loop, publish smoke, build/dev, Vite env), partly Hinglish | Procedures → skills. Says editor prod env lives in "Vercel project settings"; prod is cPanel. |
| `server/AGENTS.md` | 36 | Boundary invariants | — |
| `packages/dashboard/AGENTS.md` | 144 | Boundary facts + Flowbite rules | — |
| `packages/editor/src/engine/AGENTS.md` | 31 | Boundary facts | — |
| `packages/editor/src/editor/AGENTS.md` | 34 | Boundary facts | — |
| `CLAUDE.local.md` | — | MISSING | — |

### `.claude/` — PARTIAL, and **entirely gitignored** (`.gitignore:28 .claude/`)
- `settings.json`: **MISSING**. `settings.local.json`: 7 allow (incl. `Bash(git *)`), 0 ask, 0 deny, no hooks, no env. Four more `settings.local.json` under `src/.claude`, `packages/.claude`, `packages/editor/.claude`, `packages/editor/src/.claude`.
- `agents/`: `design-guard-reviewer.md` (70 lines, read-only reviewer for design gates G1–G9; added 2026-10-15).
- `skills/`: 37 entries. 34 symlinks → tracked `.agents/skills/` (generic third-party pack, pinned in `skills-lock.json`, last changed July). 3 project-specific dirs, all dated 2026-10-15: `factory-audit` (this audit), `harden-instructions` (restructure instructions), `product-design-guard` (231 lines + references/templates/evals). Because `.claude/` is ignored, none of these 3 nor the agent reach another clone.
- `commands/`, `rules/`, `.mcp.json`: MISSING.
- Hooks: project-level none. User-level `~/.claude/settings.json`: every event runs `~/.config/iterm2/cc-status` (status display); Stop also runs a gstack timeline hook. User permissions: 303 allow, 0 deny, 0 ask, `defaultMode: auto`. **No hook enforces any repo rule.**

---

## 8. Safety and hygiene

### Secrets in git — FOUND (clean), one untracked exposure
- `git ls-files` filtered for env/secret/credential/key/pem/p12: only `.env.example`, `.env.local.example` (placeholders); other hits are source names (`*keyboard*`, `storageKeys`, a `StorageAdapter.secrets.test.ts`).
- Token patterns in tracked files: only prose/test fakes (`docs/reviews/security-audit-*.md`, `docs/audits/2026-09-25-full-audit/19-security-permissions.md`, `scripts/stripe-setup.ts` prefix check, `StripeInjector.test.ts`, `whsec_` in tests/seed). No real keys found (re-check carried from earlier run; tracked-file set changed by 18 files since).
- **`auth.json` at repo root: untracked and NOT gitignored.** Playwright storageState: 2 cookies (`authjs.csrf-token`, `authjs.callback-url`, both `localhost`) + localStorage for `http://localhost:3000`. No session token at time of audit, but the file shape is the one that holds one; a `git add .` publishes it to a **public** repo.
- Env files on disk (gitignored, paths only): `.env`, `.env.local`, `.env.local.bak-*`, `.env.production.local`, `packages/dashboard/.env*`.

### Dependencies — PARTIAL
- `pnpm-lock.yaml` tracked; CI uses `--frozen-lockfile`.
- `pnpm audit --prod`: **critical 6, high 53, moderate 61, low 19**. Critical modules: `next` (16.2.2), `next-auth` (5.0.0-beta.30), `@auth/core`. No Dependabot/Renovate, no audit step in CI.

### Paths a hook should guard
- DB: `prisma/schema.prisma`, `prisma/migrations/` (70 + `migration_lock.toml`), `prisma/seed*.ts`.
- Auth: `server/auth.ts`, `server/auth.config.ts`, `server/services/auth.service.ts`, `server/trpc/routers/auth.ts`, `lib/cron-auth.ts`, `packages/dashboard/app/api/auth/**`, `packages/dashboard/middleware.ts`, `server/services/vercel-oauth.service.ts`, `packages/dashboard/app/api/integrations/vercel/**`.
- Billing: `server/services/{billing.service,stripe-webhook.service,stripe.client,webhook.service}.ts`, `server/trpc/routers/{billing,webhooks}.ts`, `packages/dashboard/app/api/webhooks/stripe/route.ts`, `packages/dashboard/app/api/cron/billing-*/`, `packages/shared/schemas/billing.ts`, `scripts/stripe-setup.ts`.
- Publish/deploy: `server/services/{publish.service,publish-approval,scheduled-publish.service}.ts`, `packages/dashboard/app/api/workers/publish/`, `packages/dashboard/app/api/cron/{scheduled-publish,publish-job-cleanup}/`, `lib/publish-*.ts`, `packages/editor/src/services/PublishService.ts`, `packages/shared/schemas/publish.ts`, `vercel.json`, `packages/dashboard/next.config.mjs`.
- Design tokens: `DESIGN.md`, `packages/editor/src/editor/design-system/styles/design-tokens.css`, `packages/editor/src/engine/designSystem/{defaultTokens,projectTokens}.ts`, `packages/shared/schemas/{design-tokens,designToken}.ts`.
- Gate baselines: `packages/editor/scripts/.tsc-baselines.json`, `packages/editor/e2e/baselines/*.json`, visual-pin PNGs, ratchet baselines.
- Env/CI: `scripts/check-prod-env*.{mjs,sh}`, `scripts/set-prod-env.mjs`, `packages/editor/scripts/hooks/pre-push`, `.github/workflows/*`.

### Destructive scripts
- `env:set:prod` (`scripts/set-prod-env.mjs`): replaces the whole production env map over SSH (`--apply`), restarts (`--restart`). Highest risk.
- `db:push` (`prisma db push`): can drop columns, bypasses migrations.
- `stripe:setup` (`scripts/stripe-setup.ts`): creates Stripe products/prices against whatever key is set.
- `prisma/seed-settings-clone.ts`: `deleteMany` / raw SQL, no script entry.
- `__tests__/db/setup.ts`: `TRUNCATE ... CASCADE` (localhost-guarded).
- `dev:reset` / `dev:clean`: `rm -rf` local caches only. `smoke:prod`: hits production (read intent).
- Not found in scripts: `prisma migrate reset`, `git push --force`. No Makefile.

---

## 9. Integrations available in this session

- `gh auth status`: logged in as `aamirtauqir` (keyring), git over https.
- MCP (`claude mcp list`): Connected — Claude Docs, Apollo.io, Google Drive, Gmail, Google Calendar, Greptile, Playwright, pw-testrail, pw-browserstack, stitch, open-design, ahrefs, pencil. **Needs authentication** — two plugin HTTP servers (Figma and context7, per this session's tool list), mobbin. **Failed** — paper (ECONNREFUSED). No GitHub MCP (`gh` covers it).
- `claude plugin list`: 93 lines matching enabled. Relevant: superpowers, compound-engineering, pr-review-toolkit, code-review, feature-dev, pw (Playwright), figma, greptile, gstack.

---

## 10. Readiness verdict

### 10.1 Area table

| Area | Status | Evidence | Gap | Effort |
|---|---|---|---|---|
| Tests | PARTIAL | 1,575 test files; CI vitest 14,847 pass / 0 fail / 3 skip / 22 todo in 848 s; DB tier 138/138; local full run NOT RUN (>600 s) | Full suite too slow for a per-change gate; no affected-only command; pre-push runs no tests; Playwright smoke 1 red, style parity 18 red | M |
| Static checks | PARTIAL | `gate:tsc` 0 errors both packages; editor ESLint 0 errors on tracked files (CI); root `pnpm lint` broken | No lint for dashboard/server/lib; no formatter; editor ESLint does not ignore gitignored scratch (570 local errors) | M |
| CI | PARTIAL | 3 workflows; `dashboard-tests` 20/20 red, `editor-ci` 20/20 red, build gate 20/20 green | Red on every run, so it gates nothing; failures are browser jobs only; Figma conformance `continue-on-error` | M |
| Branch protection | MISSING | protection → 404; rulesets `[]`; no CODEOWNERS | No required checks/reviews; force-push and deletion allowed on a public repo | S |
| Run recipe | PARTIAL | Steps spread over CLAUDE.md files; dashboard needs Postgres + env | No README / single clean-checkout script; stale `.env.example`; `.env.local.example` missing `NEXT_PUBLIC_UNIFIED_EDITOR`; no compose; no run/verify skill | M |
| Architecture docs | PARTIAL | CLAUDE.md, 4 AGENTS.md, DESIGN.md, PRODUCT-OVERVIEW | No README, no ADRs; one stale vertical-slice path (`lib/validations/`) | M |
| Spec template | MISSING | Hundreds of plan/spec docs across 6+ dirs; only UI design templates in an ignored skill | No canonical spec/ticket format or location with a done-condition field | S |
| CLAUDE.md quality | PARTIAL | 415 + 735 lines; `audit:rules` 0 present-tense stale | Long, history-heavy; procedures embedded; stale claims: `lib/validations/`, editor prod env "Vercel"; 35 uncommitted lines | M |
| Permissions / hooks | MISSING | No `.claude/settings.json`; `.claude/` gitignored; 0 deny rules anywhere; hooks are status display only | No guard hooks on migrations/auth/billing/deploy/baselines; no pre-commit | S |
| Agents / skills | PARTIAL | 1 project agent + 3 project skills (all 2026-10-15) + 34 generic | All project ones live in ignored `.claude/` → not shared; no run/verify/deploy/review skill | S |
| Secrets hygiene | PARTIAL | No real secrets tracked; env files ignored | `auth.json` (storageState) untracked and not ignored in a public repo; no hook blocks staging env/auth files | S |
| Dependency health | PARTIAL | Lockfile tracked, frozen in CI; `pnpm audit --prod` 6 critical / 53 high | Criticals in `next`, `next-auth`, `@auth/core`; no Dependabot, no audit in CI | M |

### 10.2 Top 5 fixes, in order

1. **Make CI green.** Push `65163bb` (rewrites the one failing dashboard smoke test) and confirm; resolve the 18 style-parity drifts in `packages/editor/e2e/baselines/` by deciding per element whether the code or the baseline is wrong (the font-family drift matches the documented Inter Tight → Inter move, so some are stale baselines). Unblocks the **CI gate** — every other gate needs red to mean something. Effort: M.
2. **Protect `main`.** Required status checks (the jobs of all three workflows), block force-push and deletion, route agent work through PRs. Unblocks the **merge gate**. Effort: S (after #1).
3. **Commit a shared `.claude/settings.json` with deny rules and PreToolUse guard hooks**, and un-ignore it plus `.claude/{agents,skills}` (keep `settings.local.json` ignored). Guard the §8 paths and commands: migrations/schema, auth, billing, publish, env scripts, tokens, gate baselines; `db:push`, `env:set:prod`, `stripe:setup`, `git push --force`, `--no-verify`, `git stash`, staging `.env*`/`auth.json`. Add `auth.json` to `.gitignore`. Unblocks the **write-scope / dangerous-action gate**. Effort: S.
4. **Add a fast verification tier.** `vitest related`/`--changed` command, a flat ESLint config for dashboard/server/lib replacing `next lint`, editor ESLint ignoring scratch dirs, and a pre-commit hook running them. Keep the ~14-min full suite in CI. Unblocks the **per-change verification gate** an agent can run in minutes. Effort: M.
5. **Write the run recipe and spec template.** Root README with clean-checkout steps; fix `.env.example` / `.env.local.example`; a compose file or documented Postgres step; a committed `run-dev` + `verify` skill including dev login; `docs/specs/_template.md` with a done-condition field (CLAUDE.md already requires one). Unblocks the **spec gate** and the **live-app verification gate**. Effort: M.

### 10.3 Enforceable today vs needs foundation first

**Enforceable as hooks now (a check or a path list already exists):**
- Typecheck ratchet: `node packages/editor/scripts/check-tsc-baseline.mjs` (passes; ~1–6 min).
- DS/conformance: `verify:ds`, dashboard `gate:ds`, `gate:figma`, `gate:trpc-orphans`, `gate:baked-flags` (already in pre-push).
- Editor ESLint on changed editor files (0 errors on tracked files).
- Path guards (PreToolUse Edit/Write, block or ask) for the §8 lists — needs no checker.
- Command guards (PreToolUse Bash): `db:push`, `env:set:prod`, `stripe:setup`, `prisma migrate reset`, `git push --force`, `--no-verify`, `git stash`; grep for `../../` imports, purple/violet/indigo, banned system fonts.
- Secret guard: block staging `.env*`, `*.bak*`, `auth.json`.
- Doc drift: `pnpm run audit:rules` after edits to CLAUDE.md/AGENTS.md/DESIGN.md.
- DB test tier: `pnpm test:db` (46 s in CI, green) for edits under `prisma/` and `server/`.

**Needs foundation first:**
- "Tests pass" per change — full suite >10 min locally; needs fix #4.
- "CI green" / merge gate — CI red, no branch protection (fixes #1, #2).
- Dashboard/server lint — no config. Formatting — no formatter.
- "Verified in the running app" — no scripted run/verify recipe; dashboard needs DB + auth.
- Spec conformance — no template or canonical location.
- Coverage threshold — editor-only, no thresholds, figure from July.
- Review routing — no CODEOWNERS.
- Dependency gate — 6 critical advisories outstanding.

### 10.4 Unknowns

| Item | Status | What is needed |
|---|---|---|
| Local full vitest counts | NOT RUN (killed at 601 s) | `pnpm test` with ≥20 min budget on an idle machine (CI: 848 s) |
| Dashboard smoke after `65163bb` | UNKNOWN | `git push`, then `gh run list --workflow dashboard-tests.yml -L 1` |
| Playwright e2e / parity / visual locally | NOT RUN | `pnpm --filter @buildrik/dashboard test:e2e` (DB, seed, dev server); `pnpm --filter @buildrik/editor test:parity` |
| DB tier locally | NOT RUN | `pnpm test:db` (creates/truncates `buildrik_test` on localhost) |
| `verify:ds` / pre-push today | NOT RUN locally (green in CI) | `cd packages/editor && pnpm run verify:ds` |
| Coverage today | NOT RUN | `pnpm --filter @buildrik/editor test:coverage` |
| Dashboard dev boot | NOT RUN (needs DB + env) | `pnpm dev` with `.env.local` populated |
| Disk size per directory | UNKNOWN | `du -sh` excluding `node_modules` |
| Production env completeness | UNKNOWN | `pnpm run env:check:prod` (SSH to cPanel) |
| Figma / context7 / mobbin MCP | UNKNOWN (needs auth) | Authenticate those servers; paper MCP refused connection |
