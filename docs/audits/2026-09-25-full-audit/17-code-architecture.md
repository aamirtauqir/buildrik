# 17 — Codebase Architecture & Maintainability

- **Agent:** E (Engineering Architecture)
- **Prompt:** 17
- **Date:** 2026-09-25
- **Mode:** READ-ONLY. This file is the only one written.
- **Scope:** Folder structure, feature boundaries, shared libraries, hooks, stores, services, APIs, types, utilities, backend boundaries and realtime architecture, across `packages/editor/src`, `packages/dashboard`, `server`, `lib`, `packages/shared` and `prisma`. I looked for:
  - god components and huge files
  - circular dependencies and feature coupling
  - business logic in the UI or the transport layer
  - duplicated business logic or state, and global-store abuse
  - prop drilling and mixed concerns
  - dead code, magic constants and unsafe `any`
  - scattered realtime logic

---

## Method & runtime status

| What I ran | Result |
|---|---|
| **Import-graph scan** (scratch script in the session scratchpad, not in the repo). It resolves `./`, `@/`, `@server/`, `@lib/`, `@shared/` and `@buildrik/shared/` over 1,710 non-test TS/TSX files, then runs Tarjan SCC over runtime (non-`import type`) edges. | 5,277 local imports. 6 did not resolve, and all 6 are in comments or template strings, so the harness is valid. **3 cycles, each of size 2, and all barrel↔member**: `canvas/overlays/{index,CanvasOverlayGroup}`, `projectMigrations/{index,runner}`, `inspector/config/{index,cssContext}`. There are no real feature cycles. |
| Cross-layer edge census from the same graph | See §Layer map. Notable edges: engine→services (3), shared→editor (8), shared→services (4), services→engine (3), server→dashboard (23, all email templates), dashboard pages→server (3). |
| Unimported-file scan, counting test, e2e and scripts as importers | 31 candidates, verified by hand; see A17-16. |
| `any` / `as unknown as` / `@ts-ignore` / `eslint-disable` / TODO census per layer | Low overall: engine 10, editor 20, services 1, server 15 real `any` sites. The notable ones are in A17-8 and A17-3. |
| `npx eslint src/engine src/shared src/services` (editor) | 0 errors, 44 warnings. **The boundary rules pass only because of stale exemptions and patterns that are too narrow** (A17-11). |
| `pnpm vitest run server/services/__tests__/publish.service.rollback.test.ts` | 7/7 pass. **These tests cover `completePublish`, which production never calls** (A17-2). |
| `pnpm --filter @buildrik/editor exec vitest run …/useCanvasDragDrop.test.ts` | 27/27 pass. The `getData` mock never goes empty after an `await`, so it cannot detect A17-8. |
| File-size, `useState` / `useEffect` / import / tRPC-call counts on the 45 largest files | See the table. |

**NOT RUNTIME VERIFIED:**
- There was no Postgres and no browser. Nothing was clicked, published, saved concurrently or dragged in a running app.
- **A17-1** (save race) is proven by reading the code path. It was not reproduced with two live writers.
- **A17-2** (rollback dead) is proven by the fact that the only live writer of `COMPLETED` nulls the payload. I did not observe it in a live Publish History panel.
- **A17-6** (lint on stale tokens) and **A17-8** (DataTransfer read after `await`) depend on browser and runtime state, so both are marked PARTIAL.
- The Playwright suites were not run.

---

## Output table: File · Symbol · Responsibility · Problem · Dependency impact · Refactor recommendation · Risk · Priority

| # | File | Symbol | Responsibility | Problem | Dependency impact | Refactor recommendation | Risk | Pri |
|---|---|---|---|---|---|---|---|---|
| 1 | `server/services/sites.service.ts:594-745` | `saveProjectData` | Whole-project autosave with optimistic concurrency | The concurrency check is a read *outside* the transaction, followed by an unconditional `site.update` (TOCTOU) | Every editor save, the ConflictModal contract, page deletes in full-snapshot mode | Compare-and-swap inside the transaction (`updateMany where lastEditedAt = expected`, count 0 → `SAVE_CONFLICT`), or `SELECT … FOR UPDATE` | Silent lost update | **P0** (A17-1) |
| 2 | `packages/dashboard/app/api/workers/publish/[jobId]/route.ts:53-260` vs `server/services/publish.service.ts:438-475` | `POST` (worker), `completePublish` | The publish job's terminal transition | Two implementations with **opposite retention rules**. The live one nulls `log`; the retaining one has no caller | Publish history, rollback, publish diff | Move the job lifecycle into `publish.service` and have the worker call `completePublish`/`failPublish` | Shipped feature is dead | **P1** (A17-2) |
| 3 | `server/trpc/routers/*.ts` (24 files) | `requireAdmin` ×5, `requireWorkspaceAdmin` ×2, `assertWorkspaceAdmin`, `requireOwner`, `requireRead/Write`, `guardSiteEditor`, `getWorkspaceCtx` ×2, `getWorkspaceMember`, `requireWorkspace`, `resolveWorkspaceId` | Authorization and active-workspace resolution | 87 copy-pasted `instanceof PermissionError` translations. **Four workspace resolvers with different semantics** | Every protected endpoint; the next security fix has to be made in N places | One tRPC middleware (`workspaceProcedure`, `siteRoleProcedure(min)`) that translates `PermissionError` once | Drift in authz | P2 (A17-3) |
| 4 | `server/trpc/routers/auth.ts:261-340`, `integrations.ts:31-180`, `site-detail.ts`, `sites.ts:660-690`, `dashboard.ts:97-110`; worker/cron routes (25 route files) | `acceptInvite`, Vercel callback, workers | Membership grant, integration upsert with audit log, publish/AI job lifecycles | Business transactions live in routers and route handlers, which breaks the declared Page→Router→Service→DB chain | Untestable through service tests; causes #2 | Extract `team.service.acceptInvite`, `integrations.service.connectVercel`, and `publish-worker.service` | Divergence | P2 (A17-4) |
| 5 | `packages/editor/src/services/api-client.ts`, `services/ai/AiTrpcClient.ts:162`, `services/ai/subscriptionClient.ts`, `shared/hooks/useAutoMilestone.ts:180`, `editor/panels/version-history/useAISummary.ts:109` | 3 tRPC clients + 2 raw `fetch("/api/trpc/…")` | Editor→server transport | No single transport owner. The raw fetches skip superjson, which is the root cause of A14-1 | AI summary and milestones are dead (A14-1) | One client module, and ban `fetch("/api/trpc` by lint | Silent 400s | P2 (A17-5) |
| 6 | `editor/design-system/state/TokenRegistryContext.tsx:114-155`, `ProjectTokensApplier.tsx`, `DesignSystemTab.tsx:390-466`, `useDSLint.ts:26-50` | Token registries | Design tokens | **Three stores**: localStorage (per browser), 14 React registries, and `projectSettings.designTokens` (server). Registries are hydrated from the project only in `DesignSystemTab` | The DS lint, the Issues chip and the publish-anyway gate read the registries | Hydrate the registries at project load (next to `ProjectTokensApplier`) and demote localStorage to a cache | Wrong pre-publish signal | P2 (A17-6) |
| 7 | `engine/media/MediaManager.ts:970-977`, `shared/constants/media.ts:333` | `STORAGE_QUOTA_BYTES` | Upload quota | Hard-coded 1 GB, independent of `lib/constants/plan-limits.ts` (500 MB / 5 GB / 50 GB / unlimited) | Every editor upload path (`useUploadState.ts:207`, canvas drop) | Inject the plan quota from the server (`media` quota query), and keep the client check advisory only | Paying users blocked | P2 (A17-7) |
| 8 | `editor/canvas/hooks/drag/useDropExecution.ts:289-302` | `handleMainDrop` dispatch chain | Canvas drop routing | `as any` casts hide that 5 of 6 handlers ignore the pre-snapshotted `payloads` and re-read `e.dataTransfer` after an `await` | Template and block drops onto the canvas | Type the handlers as `(e, ctx, payloads)` and remove the casts | Possible silent no-op drop | P2 (A17-8) |
| 9 | `engine/media/MediaManager.ts` (1,785 lines, ~107 methods) | `MediaManager` | Media | God object: IndexedDB, server sync, retry queues, folders, blob-URL lifecycle, quota, **UI selection and sort state**, zip download, icons, fonts | Imported by the engine, the Assets tab, LibraryManager and MediaLibraryPanel | Split into storage, sync, folders and a view model, and move selection/sort to the chrome | Change amplification | P3 (A17-9) |
| 10 | `engine/Composer.ts` (1,225 lines, 56 imports, ~40 managers) | `Composer` | Engine facade | Service locator that also configures stub email singletons (`:808-835`) | Everything | Keep it as the facade, but move integration configuration out | Low | P3 (A17-9) |
| 11 | `server/services/ai.service.ts` (1,392) | — | All AI features | Content, page, layout, summarize, milestone, stream, component schema and providers in one file | 3 editor clients | Split by use case, with the provider adapter separate | Low | P3 (A17-9) |
| 12 | `packages/dashboard/app/dashboard/projects/page.tsx` (787) | page | Sites list | 2 queries, 7 mutations and 22 `useState` in one page component | — | Extract a `useSitesListActions` hook and the dialog components | Low | P3 (A17-9) |
| 13 | `editor/sidebar/tabs/content/ContentViews.tsx` (1,275) | `RootView`…`ConditionsView` | CMS panel | 9 views, 30 `useState` | — | One file per view | Low | P3 (A17-9) |
| 14 | 41 files / 283 sites | `composer={composer}` | Engine handle | Prop drilling (94 components take a `composer` prop; there is no Composer context) | Every panel signature | `ComposerContext` + `useComposer()` | Low | P3 (A17-10) |
| 15 | `packages/editor/eslint.config.mjs:252-291`; `shared/forms/*.tsx` (8); `shared/utils/openai.ts`; `engine/Composer.ts:9`, `engine/forms/FormHandler.ts:7` | Boundary lint | Layering | shared→editor is exempt on a "vibcoder" rationale (vibcoder was deleted 2026-07-28). engine→services and services→engine are not linted, although the documented contract is "services → shared ONLY" | Layer inversion is invisible to CI | Remove the stale exemptions and add `engine ↛ services` and `services ↛ engine` (type-only allowed) | Low | P3 (A17-11) |
| 16 | `editor/src/services/EmailService.ts` (388), `engine/integrations/EmailService.ts` | `emailService`, `emailMarketingService` | Form email and marketing | Stubs: every real provider throws or mocks. Still wired into `Composer.applyProjectSettings` | Engine depends on a stub | Delete them, or route through the server `form-submission` email | Low | P3 (A17-12) |
| 17 | 10 `slugify` copies (`sites/template/page/cms/auth.service`, the `saveProjectData` inline rule, the editor `string.ts:79`, 2 dashboard components, the ai-generate worker) | `slugify` | Slugs | Divergent rules: `page.service` keeps `--` and punctuation handling differs | Page and site URLs | One `lib/slug.ts` with options (maxLen, fallback) | Inconsistent URLs | P3 (A17-13) |
| 18 | Editor (1,000 imports in 443 files); `server/trpc/routers/ai.ts:17-26`; `packages/editor/tsconfig.json` and `packages/dashboard/tsconfig.json` `@/*` | Imports | Module resolution | `../../` is banned by CLAUDE.md but used 1,000×. `@/*` has a 3-way fallback (`./*`, `../../*`, `../editor/src/*`), so shadowing is latent | Moving files is costly; a future `@/lib` collision would be silent | Codemod to aliases and a lint rule; give the editor its own alias prefix | Low | P3 (A17-14) |
| 19 | 29 services throw `new Error("CODE")`; 123 `e.message ===` matches in routers | Error translation | Domain errors | Two conventions. String matching is brittle | Routers | Domain error classes with `code`, and one translator | Low | P3 (A17-15) |
| 20 | See A17-16 | dead files | — | 12 files with no importers and 10 test-only files | Noise | Delete | Low | P3 (A17-16) |
| 21 | `editor/src/services/RoleService.ts:15-21,31-40`; `ReviewService.ts:15` vs `BuildrikSyncProvider.ts:590` | `RANK`, `currentSiteId`, `getSiteIdFromUrl` | Role display and site id | Role rank mirrored from `permission.service.ts:4`; the role is cached for the whole session; two site-id-from-URL parsers (one throws on bad `%`) | 10 + 17 importers | Put the rank in `packages/shared`; one `siteId` source | Low | P3 (A17-17) |
| 22 | `app/api/sse/{collab,publish,notifications}` + `usePublishJob.ts:25,177` + `lib/hooks/use-publish-sse.ts` + editor `NotificationPanel` | Realtime | Progress, notifications, collab | Three SSE routes each hand-roll a DB-poll loop. Editor publish **polls** while the dashboard uses **SSE** for the same job | Duplicate transports | One SSE helper (poll/heartbeat/abort) and one publish-progress hook shared by both apps | Low | P3 (A17-18) |
| 23 | `editor/sidebar/tabs/settings/screens/RedirectsScreen.tsx:240` | `repairKey` | — | A literal NUL byte in the source makes `grep`/`rg` treat the file as binary and skip it | Invisible to code search and audits | Use `"\u0000"` or `"|"` | Low | P3 (A17-19) |
| 24 | `packages/editor/src/shared/constants/events.ts` (928 lines, 309 events) | `EVENTS` | Composer bus | 94 genuine emit-without-listener events (A14-19); bus plus window CustomEvents; no typing between emit and listen | Hidden coupling | Typed event map; delete orphan events | Low | P3 (see A14-19; not re-audited) |

---

## Findings

### P0

#### A17-1 — Save-conflict detection is read-then-write, so two concurrent autosaves silently clobber each other — **P0 — IMMEDIATE FIX REQUIRED**
- **Severity:** P0. This is the data-loss class. It depends on timing and has not been observed at runtime.
- **File:** `server/services/sites.service.ts:594-608` (check), `:612-745` (transaction)
- **Symbol:** `saveProjectData(input, expectedLastEditedAt)`
- **Evidence:**
  - `:595`: `const site = await prisma.site.findUnique(...)` runs outside any transaction.
  - `:603-607`: `if (current !== expectedLastEditedAt) throw new Error(\`SAVE_CONFLICT:…\`)`.
  - Then `:612`: `await prisma.$transaction(async (tx) => { … })` deletes pages absent from a full snapshot (`:615-640`), upserts every page, and ends with an **unconditional** `tx.site.update({ where: { id }, data: { …, lastEditedAt: savedAt } })` (`:725-744`).
  - No `isolationLevel` is set anywhere in `server/services`, so the default is READ COMMITTED.
  - Two writers A and B that both loaded `lastEditedAt = t0` both pass the check. Whichever commits second overwrites the first writer's pages, styles and settings, and in full-snapshot mode deletes pages the first writer just created. It returns `{ success: true }` with no `SAVE_CONFLICT`.
  - The window runs from `:595` to commit, and it grows with page count because of the per-page upsert loop (`:643+`).
  - Editors autosave on a 1,000 ms debounce (`useComposerInit`).
- **Expected:** Optimistic concurrency is atomic. The version check and the write are one compare-and-swap, so exactly one of two racing saves wins and the other gets `SAVE_CONFLICT` → `ConflictModal`.
- **Root cause:** The concurrency token is compared in application code before the transaction and is not part of the write predicate.
- **Affected modules:**
  - Autosave (`BuildrikSyncProvider.saveProject`)
  - Pages (a full-snapshot delete)
  - Brand/settings (`projectSettings`)
  - The ConflictModal contract
  - Collaboration: two live collaborators both autosave the whole project (inventory note for Agent D)
- **Recommendation:** Inside the transaction, first run `tx.site.updateMany({ where: { id, lastEditedAt: expected }, data: { lastEditedAt: savedAt } })` and throw `SAVE_CONFLICT` when `count === 0`. Alternatively, lock the row (`SELECT … FOR UPDATE` via `$queryRaw`) before comparing. Add a concurrency test that runs two `saveProjectData` calls with the same `expectedLastEditedAt` against a real DB.
- **Status:** VERIFIED in code. **NOT RUNTIME VERIFIED:** not reproduced with two concurrent writers against Postgres.

### P1

#### A17-2 — Publish rollback and publish diff are dead: the live worker nulls the payload the "retention fix" was applied to, and the fix went into a function nothing calls
- **Severity:** P1. This is a shipped, UI-exposed feature (the Publish History rollback, contract §5) that can never work. The tests are green over it.
- **Files:**
  - `packages/dashboard/app/api/workers/publish/[jobId]/route.ts:136-146` (the live `COMPLETED` write)
  - `server/services/publish.service.ts:438-475` (`completePublish`)
  - `:558-575` (`getPublishHistory`)
  - `:582-600` (`rollbackPublish`)
  - `:522-550` (`getPublishDiff`)
- **Symbols:** worker `POST`, `completePublish`, `rollbackPublish`, `getPublishDiff`, `getPublishHistory`
- **Evidence:**
  - The only production writer of `publishBuildJob.status = "COMPLETED"` is the worker route. It writes `log: Prisma.DbNull` (`route.ts:146`) with the comment "Clear `log` (raw page HTML payload)".
  - `publish.service.ts:445` says "P1: KEEP the log payload (was `log: Prisma.DbNull`) so this version can be rolled back". That change lives in `completePublish`, which has **zero production callers**: grep finds it only in `publish.service.ts`, `server/services/__tests__/publish.service.rollback.test.ts`, `__tests__/publish-service.test.ts` and `scripts/smoke-publish-rollback.ts`.
  - The downstream effects of the null payload:
    - `getPublishHistory` derives `rollbackable: j.log != null` (`:572`), so every real row is `false`.
    - `rollbackPublish` throws `NOT_ROLLBACKABLE` when `log.pages` is missing (`:595`).
    - `getPublishDiff` returns `{ retained: false }` (`:538`).
    - The editor `PublishHistory.tsx:388-397` therefore disables or never offers the rollback.
  - The test suite (7/7 pass, run here) and the smoke script both exercise `completePublish` directly. They prove a function the product never runs.
  - There is a second divergence as well. The worker's success path adds webhook delivery, the outcome notification and `recordActivity`. `completePublish` adds the 20-version prune. Neither implementation is complete.
- **Expected:** One terminal-state implementation that keeps the payload for the last 20 versions, runs the prune, and emits the notifications, webhook and activity.
- **Root cause:** The publish job lifecycle is split between a service and a 495-line route handler with 27 direct Prisma calls (A17-4), so a fix landed in the copy that is not wired.
- **Affected modules:** Publish (editor `PublishTab`/`PublishHistory`, dashboard publish), History/Versioning, `sites.publishHistory`/`publishDiff`/`rollback` procedures
- **Recommendation:**
  - Make the worker call `completePublish(jobId, publicUrl)`, and move the notifications, webhook and activity into it or into a `publish-worker.service`.
  - Delete the inline transaction.
  - Add a test that drives the worker route to `COMPLETED` and then asserts that `getPublishHistory(...)[0].rollbackable === true`.
- **Status:** VERIFIED in code. The rollback test ran and passes over the dead path. **NOT RUNTIME VERIFIED:** no live publish or rollback was performed.

### P2

#### A17-3 — Authorization and workspace resolution are copy-pasted per router, with four resolvers that disagree
- **Severity:** P2
- **Files:**
  - `server/trpc/workspace-ctx.ts:44-76` (`resolveWorkspaceId`, which honours a bearer token and throws FORBIDDEN when there is no membership)
  - `server/trpc/require-workspace.ts:16-31` (`requireWorkspace`, which ignores the bearer and throws NOT_FOUND). Only `marketplace.ts` imports it, and its own header admits "features.ts and account.ts each still carry their own copy".
  - `server/trpc/routers/account.ts:32-47` (`getWorkspaceCtx`)
  - `server/trpc/routers/dashboard.ts:24-40` (`getWorkspaceMember`)
  - `server/trpc/routers/team.ts:25-36` (another `getWorkspaceCtx`, which wraps `resolveWorkspaceId` through `ctx as any`)
  - Role gates: `requireAdmin` in `clients.ts:29`, `marketplace.ts:23`, `reviews.ts:43`, `team.ts:38`, `theme.ts:38`; `requireWorkspaceAdmin` in `account.ts:59` and `site-component.ts:35`; `assertWorkspaceAdmin`/`assertWorkspaceMember` in `api-tokens.ts:16,36`; `requireOwner` in `billing.ts:43`; `requireRead`/`requireWrite` in `cms.ts:31,41`; `guardSiteEditor` in `pages.ts:27`
- **Evidence:**
  - 87 `instanceof PermissionError` translation blocks in 24 files.
  - 7 of these helpers type `ctx: any` behind `eslint-disable`.
  - `account.ts:66-71` documents an earlier miss: one router forgot the translation, so Designers got HTTP 500, which tRPC then retried.
  - The resolvers differ on bearer-token honouring, on the error code (NOT_FOUND vs FORBIDDEN), and on whether they re-check the JWT workspace against an ACTIVE membership.
- **Expected:** One middleware layer: `workspaceProcedure` (resolves and verifies the active workspace once) and `siteRoleProcedure(min)`. Both translate `PermissionError` centrally.
- **Root cause:** No procedure-level middleware for authz. Every router rolls its own.
- **Affected modules:** All 33 routers and every permission fix
- **Recommendation:** Add tRPC middlewares in `server/trpc/trpc.ts`, migrate the routers, and delete `require-workspace.ts` and the per-router copies. Agent F should confirm that no divergence is exploitable today.
- **Status:** VERIFIED in code. Security impact NOT VERIFIED (Agent F).

#### A17-4 — Business transactions live in routers and route handlers, which breaks Page→Router→Service→DB
- **Severity:** P2
- **Files:**
  - `server/trpc/routers/auth.ts:261-340` (`acceptInvite`). This one handler holds the invite lookup, the email-binding check, the membership plus `SitePermission` plus invite-status `$transaction`, the audit, the notification and the activity entry. It is the only membership-grant path, and there is no `team.service` equivalent.
  - `integrations.ts:31-180` (upsert/delete of the integration, plus the `auditLog.create`)
  - `site-detail.ts:169-463` (7 direct queries)
  - `sites.ts:411,660-690`
  - `dashboard.ts:97-110`
  - `forms.ts:32,44`
  - `account.ts:224,322,347`
- **Evidence:**
  - 9 routers call Prisma directly.
  - 25 Next route files do too. The biggest are the publish worker (27 calls, 495 lines) and the ai-generate worker (7 calls, with its own `slugify` and `sectionsToBlocks`), plus 17 cron routes.
  - CLAUDE.md ("Routers call services. Never touch Prisma directly") is the stated rule. It is not proof, but the code contradicts it.
- **Expected:** Routers and route handlers only authenticate, validate and translate. The lifecycle and transaction logic sits in services with unit tests.
- **Root cause:** Workers and crons grew as route files, and there is no `*-worker.service` layer.
- **Affected modules:** Invitations, Integrations, Publish (see A17-2), AI generation, Crons
- **Recommendation:** Extract `team.service.acceptInvite`, `integrations.service`, `publish-worker.service` and `ai-generate-worker.service`. Keep the route files as thin adapters.
- **Status:** VERIFIED in code

#### A17-5 — The editor has no single network owner: three tRPC clients plus raw `/api/trpc` fetches (root cause of A14-1)
- **Severity:** P2. The symptom, A14-1, is already P1 in audit 14.
- **Files:**
  - `packages/editor/src/services/api-client.ts:20-44`
  - `services/ai/AiTrpcClient.ts:162-176`
  - `services/ai/subscriptionClient.ts:17-38`
  - `shared/hooks/useAutoMilestone.ts:180`
  - `editor/panels/version-history/useAISummary.ts:109`
- **Evidence:** Three separately constructed `createTRPCClient<AppRouter>` instances with different URL and credentials handling. Two hand-built `fetch("/api/trpc/ai.*")` calls skip superjson. A14-1 reproduced the 400 at protocol level. 27 raw `fetch(` sites in the editor.
- **Expected:** One client module (batch plus subscription split link) that every editor service uses, and a lint rule that bans `fetch("/api/trpc`.
- **Root cause:** AI features were added with their own transport. `shared/utils/openai.ts` even reaches up into `services/ai/*` (a layer inversion).
- **Affected modules:** AI (selected element, chat, summary, milestones), History, every sync service
- **Recommendation:** Collapse to `services/api-client.ts` with a `splitLink`, and delete the other two factories and the raw fetches.
- **Status:** VERIFIED in code (the transport defect is runtime-proven by A14-1)

#### A17-6 — Design tokens have three sources of truth, and the lint and pre-publish gate read the one that is not hydrated from the project
- **Severity:** P2
- **Files:**
  - `editor/design-system/state/TokenRegistryContext.tsx:114-155` (registries seeded from `localStorage["buildrick-design-tokens-{projectId}-v1"]`, else `DEFAULT_TOKENS`)
  - `DesignSystemTab.tsx:390-466` (the only caller of `useResetAllKinds` besides TokensSection, and the only place registries receive `projectSettings.designTokens`)
  - `ProjectTokensApplier.tsx:28-60`, which writes CSS variables to the DOM but **does not** hydrate the registries
  - `DSLintRunner.tsx` (mounted shell-wide at `StudioPanels.tsx:452`)
  - `useDSLint.ts:26-50`, which reads `useColorRegistry` / `useSpacingRegistry` / `useTypeRegistry`
- **Evidence:**
  - `DSLintRunner`'s own header explains that the Issues chip is a pre-publish signal that gates the publish-anyway confirm.
  - On a browser with no cache (a teammate, a second device, cleared data), or with a stale cache from an earlier session, the lint evaluates `DEFAULT_TOKENS` or old values until the user opens Brand.
  - `ProjectTokensApplier` fixed the canvas half of this exact problem, but the lint half stayed.
- **Expected:** At project load, registries are hydrated from `projectSettings.designTokens`, which is the single source of truth. localStorage is at most a warm cache.
- **Root cause:** Token state lives in React context, not in the engine, and the project→registry merge is owned by a panel.
- **Affected modules:** Brand, Issues, Publish (confirm gate), multi-device and collaboration
- **Recommendation:** Call the `useResetAllKinds()(mergeProjectTokens(...))` logic from a shell-level headless mount on `PROJECT_LOADED` and `SETTINGS_CHANGE`, next to `ProjectTokensApplier`. Longer term, move the token store into the engine.
- **Status:** PARTIAL. The code path is verified. The user-visible wrong lint count is **NOT RUNTIME VERIFIED**.

#### A17-7 — The editor enforces a hard-coded 1 GB storage cap regardless of plan
- **Severity:** P2
- **Files:**
  - `packages/editor/src/shared/constants/media.ts:333` (`STORAGE_QUOTA_BYTES = 1_073_741_824`)
  - `engine/media/MediaManager.ts:965-977`
  - Callers: `editor/sidebar/tabs/media/hooks/useUploadState.ts:207` (`composer.media.uploadFile`), `useDropExecution.ts:255`
  - `lib/constants/plan-limits.ts:32,53,74` (`storageMB` 500 / 5,120 / 51,200)
- **Evidence:**
  - `useUploadState.ts:178-185` computes the plan-aware `storageTotal` from the server quota and skips its cap on unlimited plans.
  - It then calls `composer.media.uploadFile`, which throws `MediaQuotaError` once the local library sum plus the file exceeds 1 GB.
  - As a result, PRO and BUSINESS workspaces are blocked in the editor at 1 GB, while FREE is allowed past its 500 MB until the server rejects it.
- **Expected:** One quota rule (plan limits on the server), passed into the engine or checked only on the server.
- **Root cause:** The business rule is duplicated as a magic constant in the engine.
- **Affected modules:** Media (Quick and Full), canvas drop, billing and upgrade prompts
- **Recommendation:** Remove the engine gate, or give `MediaManager` a `setQuotaBytes()` fed from the `media` quota query. Delete `STORAGE_QUOTA_BYTES`.
- **Status:** VERIFIED in code. **NOT RUNTIME VERIFIED** (it needs a library over 1 GB).

#### A17-8 — `as any` in the drop dispatcher hides that most handlers ignore the pre-snapshotted payloads
- **Severity:** P2
- **Files:** `packages/editor/src/editor/canvas/hooks/drag/useDropExecution.ts:188-194,289-302`; `dropOperations.tsx:50,144,238,292,375` (signatures `(e, ctx)` or `(e, ctx, dropTargetId)`, with no `payloads`); `:542` (`handleCatalogDrop`, the only one that takes `payloads`)
- **Evidence:**
  - The hook's header (`:5-6`) and `:184-187` state that browsers empty the DataTransfer at the first `await`, so payloads are read up front.
  - The dispatcher then calls `(handleX as any)(e, ctx, payloads)`. The cast hides a type error, because the handlers take no `payloads` argument and call `e.dataTransfer.getData(...)` themselves.
  - `handleTemplateDrop` and `handleBlockDrop` run **after** `await handleComponentDrop(...)` (`:293`). `handleBlockDrop` is the terminal branch and sets `dropSucceeded = true` even when it returns `false`.
  - The unit test mocks `getData` from a static map (`useCanvasDragDrop.test.ts:144-153`), so it cannot detect the problem. It passes 27/27, run here.
- **Expected:** Handlers consume `payloads`, and there are no casts.
- **Root cause:** A refactor (the payload snapshot) was applied at the call site only, and `as any` silenced the compiler.
- **Affected modules:** Add (block and template drag onto the canvas), Templates
- **Recommendation:** Change the handler signatures to `(e, ctx, payloads)`, read from `payloads`, remove the casts, and add a test whose `getData` returns `""` after a microtask.
- **Status:** PARTIAL. The signature mismatch is VERIFIED. Whether Chromium actually returns `""` at that point (the component `await` resolves within the same microtask checkpoint) is **NOT RUNTIME VERIFIED**.

### P3

#### A17-9 — God files
- **Severity:** P3
- **Files:**
  - **`engine/media/MediaManager.ts` (1,785 lines, ~107 methods).** Mixes persistence, server sync, two retry queues, folders, blob-URL lifecycle, quota, **UI selection and sort state** (`selectAssets`, `setSortBy`, `sortAssets`), zip download, icons and fonts.
  - **`engine/Composer.ts` (1,225 lines, 56 imports).** A service locator of about 40 managers. It also configures stub email singletons (`:808-835`).
  - **`server/services/ai.service.ts` (1,392 lines).**
  - **`packages/dashboard/app/dashboard/projects/page.tsx` (787 lines).** 2 queries, 7 mutations and 22 `useState` (`:111-206`).
  - **`editor/sidebar/tabs/content/ContentViews.tsx` (1,275 lines).** 9 exported views and 30 `useState`.
  - **Others:** `StudioHeader.tsx` (1,040), `ReviewTab.tsx` (1,071), `LibraryManager.tsx` (1,199, 26 `useState`).
- **Evidence:** Line and method counts from the census above.
- **Expected:** One job per file (a project rule).
- **Root cause:** Features accreted onto existing hubs.
- **Affected modules:** Media, Engine, AI, Dashboard sites, CMS
- **Recommendation:** Split MediaManager into storage, sync, folders and a view model; split `ai.service` by use case; split ContentViews one view per file. The Composer facade shape can stay.
- **Status:** VERIFIED in code

#### A17-10 — The Composer is prop-drilled through the whole chrome
- **Severity:** P3
- **Evidence:** 283 `composer={composer}` passes across 41 files. 94 components declare a `composer: Composer` prop. The editor has no Composer React context; the only contexts are the design-system token and preset registries.
- **Recommendation:** Provide `ComposerContext` at `AquibraStudio` and add `useComposer()`, then migrate leaf panels gradually.
- **Status:** VERIFIED in code

#### A17-11 — Layer-boundary lint passes only through stale exemptions and incomplete patterns
- **Severity:** P3
- **File:** `packages/editor/eslint.config.mjs:232-291`
- **Evidence:**
  - `src/shared/forms/**` is exempt from the "shared/ is leaf" rule, with "vibcoder-primitive compositions" given as the reason. Vibcoder was deleted on 2026-07-28 (CLAUDE.md). All 8 files now import `editor/chrome-ui`.
  - The services rule says "services/ → shared/ ONLY" (`:233`) but restricts only `editor/`. `services/{cmsSync,componentSync,versionSync}.ts` import `engine/*`.
  - The engine rule restricts only `editor/`. `engine/Composer.ts:9` and `engine/forms/FormHandler.ts:7` import `services/EmailService` and `FormSubmissionService`.
  - `shared/utils/openai.ts` imports `services/ai/*`.
  - Together these form an engine⇄services layer cycle, although there is no file cycle.
- **Recommendation:** Drop the stale exemptions, add `engine ↛ services`, `services ↛ engine` and `shared ↛ services` (allowing `import type`), and move `shared/forms` under `editor/`.
- **Status:** VERIFIED (lint run: 0 errors)

#### A17-12 — Shipped stub integrations wired into the engine core
- **Severity:** P3
- **Files:** `packages/editor/src/services/EmailService.ts:184-388`; `engine/integrations/EmailService.ts:1` (header: "@deprecated DEAD/SIMULATED"); `engine/Composer.ts:808-835`
- **Evidence:**
  - `sendViaBackendProxy` always throws and refers to a nonexistent `server/src/modules/email`.
  - SMTP returns a failure.
  - Non-SendGrid providers are configured as `mock`.
  - `applyProjectSettings` configures both singletons from `projectSettings.integrations.email`, including `apiKey`, on every settings change.
- **Recommendation:** Delete both stubs and the Composer wiring. The server `form-submission` email already exists.
- **Status:** VERIFIED in code
- **Overlap:** Agent F should check where a provider `apiKey` stored in `projectSettings` ends up: the client, exports, and the version history.

#### A17-13 — Slug generation duplicated with divergent rules
- **Severity:** P3
- **Evidence:**
  - `page.service.ts:16` keeps `--` and handles punctuation differently from `sites.service.ts:15` and `template.service.ts:13`.
  - `saveProjectData` has a third inline rule (`sites.service.ts:651-652`, spaces only).
  - The editor has `shared/utils/helpers/string.ts:79`.
  - `auth.service.ts:61`, `cms.service.ts:115`, the ai-generate worker `:36`, `create-site-modal.tsx:14` and `workspace-form.tsx:70` each have their own copy.
  - Example: "About  Us!" becomes `about--us` through `page.service` and `about-us!`-derived variants elsewhere.
- **Recommendation:** Add `lib/slug.ts` with `{ maxLen, fallback }` and use it everywhere.
- **Status:** VERIFIED in code

#### A17-14 — Import hygiene: 1,000 banned `../../` imports and a latent alias-shadowing hazard
- **Severity:** P3
- **Evidence:**
  - `../../` appears 1,000 times in 443 editor files (engine 200, editor 740, shared 55, services 5), and in `server/trpc/routers/ai.ts:17,23,26`.
  - Both `packages/editor/tsconfig.json` and `packages/dashboard/tsconfig.json` map `@/*` to three fallbacks.
  - In production (Next), the editor's 569 `@/…` imports resolve only because nothing in `packages/dashboard/` or the repo root shadows `editor`, `engine`, `shared` or `services`. I checked all 111 distinct specifiers and none is shadowed today.
- **Recommendation:** Codemod to aliases, give the editor a dedicated prefix (e.g. `@editor/`), and add a lint rule for `../../`.
- **Status:** VERIFIED in code

#### A17-15 — Two error conventions in the server
- **Severity:** P3
- **Evidence:** 29 services throw string-coded `new Error("CODE")`, which routers match through 123 `e.message ===` or `startsWith` checks. 14 services define domain error classes. The next rename of a code string silently becomes a 500.
- **Recommendation:** Use a `DomainError(code, httpCode)` base and a single translator in the middleware from A17-3.
- **Status:** VERIFIED in code

#### A17-16 — Dead and test-only files
- **Severity:** P3
- **No importers** (verified by grep, with only comment mentions found):
  - editor `shell/hooks/useSaveState.ts` (mentioned only in an e2e comment), `shell/hooks/useDeviceZoom.ts`, `design-system/ui/ExportDropdown.tsx`
  - editor `sidebar/tabs/media/data/mediaData.ts`, `sidebar/tabs/media/hooks/useUsageMap.ts`, `inspector/shared/types.ts`
  - editor `shared/types/{block,command,config,media-image-editor,ui}.ts` (471 lines), `shared/constants/storage.ts`
  - dashboard `components/comments/comment-preview.tsx`, `components/dashboard/recent-sites.tsx`
- **Imported only by tests:**
  - editor `DSLintMount.tsx` (its own neighbour's header calls it unmounted), `CatalogSection.tsx`, `BindingRow.tsx`, `cssPropertyKinds.ts`, `InsertStateBlocks.tsx`, `LayerContextMenu.tsx`, `dragPayload.ts`, `shared/utils/tokens.ts`, `shared/types/modals.ts`
  - dashboard `billing/limit-reached.tsx`, `dashboard/workspace-health.tsx`, `help/contextual-help.tsx`
  - The publish service's `completePublish` belongs to the same class (A17-2).
- **Recommendation:** Delete them, or wire them in where a product decision says so. This overlaps A14-16.
- **Status:** VERIFIED in code (static)

#### A17-17 — Client mirrors of server rules and URL parsing
- **Severity:** P3
- **Evidence:**
  - `packages/editor/src/services/RoleService.ts:15-21` copies `ROLE_RANK` from `server/services/permission.service.ts:4-11`.
  - `fetchMyRole` caches in a module `let` for the whole session (`:24-37`), so a role change is not reflected until reload. This is a UX guard only; the server enforces.
  - `ReviewService.currentSiteId` (10 importers) and `BuildrikSyncProvider.getSiteIdFromUrl` (17 importers) parse the same URL. The first has no `decodeURIComponent` guard.
- **Recommendation:** Put `ROLE_RANK` in `packages/shared`, and use one `siteId` source (preferably passed down, not read from `window.location`).
- **Status:** VERIFIED in code

#### A17-18 — Scattered realtime plumbing
- **Severity:** P3
- **Evidence:**
  - The three SSE routes each hand-roll a DB-poll loop with its own interval and abort handling: `app/api/sse/collab/[siteId]/route.ts:66` (1.5 s), `sse/publish/[jobId]/route.ts:63`, `sse/notifications/route.ts:37`.
  - Editor publish progress polls tRPC every 2 s (`usePublishJob.ts:25,177`), while the dashboard uses SSE for the same job (`lib/hooks/use-publish-sse.ts:27`).
  - The editor notifications poll, while the dashboard's use SSE (inventory).
  - Collab transport lives in the engine (`engine/collaboration/SSETransport.ts:43`).
- **Recommendation:** Build one server SSE helper (poll, heartbeat, abort, backoff) and one publish-progress hook shared by the editor and the dashboard.
- **Status:** VERIFIED in code. Performance and realtime behaviour belong to Agents D and E (Prompt 18).

#### A17-19 — A raw NUL byte in source hides a file from code search
- **Severity:** P3
- **File:** `packages/editor/src/editor/sidebar/tabs/settings/screens/RedirectsScreen.tsx:240`
- **Evidence:** `repairKey` is built with a literal U+0000 separator. `grep` reports "binary file matches", and it dropped this file from several of my scans. Audits and rename codemods can silently skip it.
- **Recommendation:** Use `"\u0000"` as an escape, or a printable separator.
- **Status:** VERIFIED

---

## Good as-is
- **No real circular dependencies.** 1,710 files and 3 trivial barrel↔member pairs, found with the runtime-edge Tarjan scan.
- **Services are transport-free.** 0 of 71 `server/services` files import `@trpc/server` or `TRPCError`.
- **Plan limits have one SSOT** in `lib/constants/plan-limits.ts`, consumed by 18 services and the dashboard. A17-7 is the exception.
- **`packages/shared/schemas`** is a clean leaf: 0 `any`, and it imports nothing app-side.
- **Low unsafe typing:** about 46 real `any` sites across roughly 1,700 files, with 3 `@ts-ignore`/`@ts-expect-error`.
- **Lazy external clients:** the editor sync services use lazy `getBuildrikClient()`, and the server SMTP and Stripe clients are lazy, as the rules require.
- **Sync services share one pattern.** `cmsSync`, `componentSync`, `versionSync` and `templateSync` all use the same `SyncRetryQueue` and `registerPendingSource`, so the logic is consistent, not duplicated.
- **The dashboard does not import server code** outside RSC pages (`edit/[siteId]/page.tsx`, `not-found.tsx`) and API routes.
- **`engine ↛ editor` is enforced by lint** and holds: 0 runtime edges.

## Product decisions required
1. **Where does the media quota live?** Either server-only enforcement or a plan-fed client pre-check (A17-7).
2. **Publish history retention:** is keeping 20 HTML payloads per site accepted, given the data-at-rest rationale the worker comment gives for nulling them (A17-2)? The two code paths encode opposite decisions.
3. **Delete or build** the editor email and email-marketing integrations (A17-12).
4. **Stubbed or test-only UI** (A17-16), such as `DSLintMount`, `contextual-help` and `workspace-health`: wire them in or delete them.

## Overlaps with other audits
- **Agent D (collab/realtime):**
  - A17-1 (the save race) is the server half of "autosave vs live edits". Two collaborators trigger it more often.
  - A17-18 covers the realtime transport sprawl.
- **Agent F (security):**
  - A17-3: check whether the resolver divergence (bearer honouring, error codes) is exploitable.
  - A17-12: a provider `apiKey` is stored in `projectSettings`.
  - A17-17: the session-long role cache is a UX guard only.
- **Agent G (tests/wiring):**
  - A17-2: the tests exercise a dead function.
  - A17-8: the drag test cannot detect DataTransfer going empty.
  - A17-5 is the root cause of A14-1.
  - A17-16 overlaps A14-16.
- **Prompt 18 (performance):** the prop-drilled Composer (A17-10), the 14 token contexts, and the SSE poll loops.

---

## AUDIT HANDOFF

- **Agent / Prompt:** E, Engineering Architecture / Prompt 17: Codebase Architecture & Maintainability
- **Report:** `docs/audits/2026-09-25-full-audit/17-code-architecture.md`
- **Counts:** P0 = 1 · P1 = 1 · P2 = 6 · P3 = 11
- **P0:**
  - A17-1: `saveProjectData` concurrency check is read-then-write outside the transaction, so concurrent autosaves silently lose updates. **P0 — IMMEDIATE FIX REQUIRED.** Verified in code, not at runtime.
- **P1:**
  - A17-2: publish rollback and diff are dead. The worker nulls `log`, and the retention fix lives in the uncalled `completePublish`.
- **P2:**
  - A17-3: authz and workspace-resolver copy-paste, with 4 divergent resolvers.
  - A17-4: business transactions live in routers and workers.
  - A17-5: 3 editor tRPC clients plus raw fetches (the root of A14-1).
  - A17-6: the token triple store; the lint reads unhydrated registries.
  - A17-7: a hard-coded 1 GB engine quota versus plan limits.
  - A17-8: `as any` hides drop handlers that ignore the payload snapshot.
- **P3:** A17-9 to A17-19.
- **Runtime verified:**
  - The rollback unit test passes over the dead path (7/7).
  - The drag-drop unit test (27/27) cannot detect A17-8.
  - The editor boundary lint passes (0 errors).
  - The import-graph and cycle scan was run.
- **NOT runtime verified:**
  - The concurrent-save race against Postgres.
  - A live publish, then rollback.
  - The lint count on a fresh browser.
  - Chromium DataTransfer behaviour after `await`.
  - A media upload over 1 GB.
  - Playwright.
- **Blocking dependencies:**
  - A17-2's fix depends on product decision 2.
  - A17-3's cleanup should follow Agent F's review.
  - A17-1's fix should be coordinated with Agent D's collab/autosave findings.
- **Fix ordering hints:**
  1. A17-1.
  2. A17-2 together with A17-4 (the publish worker extraction).
  3. A17-5 (fixes A14-1).
  4. A17-3 together with A17-15 (middleware and error translator).
  5. A17-6, A17-7, A17-8.
  6. P3 hygiene.
