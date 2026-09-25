# 20: Test Coverage and Test Quality

**Agent:** G, Verification & Test · **Prompt:** 20 · **Date:** 2026-09-25 · **Mode:** READ-ONLY

**Scope:** every automated test in the repo, mapped against the product modules and the collaboration scenarios Prompt 20 lists. That covers vitest unit and component tests in `packages/editor`, `packages/dashboard`, `server`, `lib`, `packages/shared` and root `__tests__`, and the Playwright specs in `packages/dashboard/e2e` and `packages/editor/e2e`. It also covers the CI workflows that decide which of these tests actually run.

---

## Method and runtime status

**What I ran** (all at the repo root, on the loaded 4-core box):

| Command | Result |
|---|---|
| `pnpm vitest run …/CommandPalette.test.tsx …/CanvasEmptyCTA.test.tsx` | **4 failed, 42 passed**. The failures are the same 4 the inventory recorded. |
| `pnpm vitest run …/RedirectsScreen.test.tsx`, run 3 times | **30/30 passed every time** on its own. The inventory saw it fail under load. |
| `pnpm vitest run` on `sites-save-project`, `permission-service`, `team-service`, `collab-service`, `engine/collaboration/*`, `week2-authz`, `e2e-backend-safety` | **8 files, 72 tests, all passed.** These are the tests this report cites as over-mocked or source-coupled, so the finding is that they pass, not that they fail. |
| `git log` / `git show fca2b60` | Traced the 4 failing tests to the commit that caused them. |
| `grep` and shell scans over the 1,161 tracked test files | Produced the classifications below: which files mock Prisma, which read source text, which routers, services and routes tests reach, and which tests are skipped or todo. |

**Inputs.** For suite totals I relied on the inventory's sharded full-suite run: 11,222 tests, of which 11,190 passed, 5 failed and 27 were skipped or todo. I did not re-run the full suite.

**NOT RUNTIME VERIFIED:**
- Nothing ran against Postgres or a browser.
- No Playwright spec was run.
- I have no GitHub Actions history. The `gh` CLI is not installed, and only the audit branch is fetched locally, not `main`. So anything in this report about CI being red, or about CI timing, is inferred from the workflow files and the local test results. I did not observe it.
- The peek time-zone hypothesis in A20-5 depends on the production Postgres `TimeZone` setting, which I could not read.

**How the classifications were made:**
- **Tests that read source text:** any test file that calls `readFileSync` or imports `?raw`.
- **Tests that mock Prisma:** any test file with `vi.mock(".../prisma")`.
- **Router reached by a test:** a test file imports that router module (`routers/<x>` or `../<x>`).
- **Service reached by a test:** at least one test imports the service without mocking it.

These are grep heuristics. Where the numbers matter, I checked sample files by reading them.

---

## Output table: feature coverage

**Levels:** U = unit, C = component (jsdom), S = service with Prisma mocked, R = router called through `createCaller`, T = test that only reads source text, E = Playwright. "Coverage" is my judgement of how much of the feature's real risk the tests would catch.

| Feature | Existing tests | Coverage | Missing scenarios | Recommended level | Priority |
|---|---|---|---|---|---|
| **Add** (BuildTab, ElementsTab, BlockPickerModal) | C: BuildTab (9 files), ElementsTab; tabsConfig figma test | Medium | `BlockPickerModal` and `StructurePopover` have **0 tests**. No test inserts into the real canvas and then saves. | C + E | P2 |
| **Layers** | C: LayersTab (2 files), LayerContextMenu, tree/search/selection hooks, `useLayerActions` hydration only | Low for mutations | `useLayerActions`' delete, move, group and reorder code paths (`useLayerActions.ts:212-281`) and `useLayerContextActions` have no tests. Nothing tests drag-reorder. | U (hook, real composer) | P2 (A20-9) |
| **Pages** | C: PagesTab (10), PageTabBar (2); S: `page-service`, `slug-history`; `sites-save-project` (the mocked-Prisma service test) | Medium | The `pages` router is **never invoked**. Nothing covers a page delete through the full-snapshot save hitting a real DB, a concurrent page edit (A17-1), or slug collisions against a real unique index. | S against a real DB + R | P1 (A20-2, A20-3) |
| **Media Quick / Full Media** | C: about 90 media files (LibraryManager, MediaTab, AssetUploadService, MediaCommandLayer); S: `media-service-paging`, `upload-service`, `stock` | Medium in the UI, **low on the server** | `media.service`: `deleteAsset`, `moveAsset`, `updateAsset`, `restoreAssetVersion` and `checkStorageQuota` have **0 test references**, so their ownership guards (`media.service.ts:290,325,372,475`) are unpinned. The upload routes `api/asset-upload` and `api/upload/[fileId]` have no route tests. `media-folder.service` is untested. | S + route tests | P1 (A20-5) |
| **CMS** | C: ContentTab, CMSRecordsModal ×3; U: `cmsSync`, DataBindResolver; S: `cms.service` | Medium | The `cms` router is never invoked. No test checks CMS role gates. | R | P2 |
| **Components** | C: ComponentsTab, ComponentDetailScreen ×4, `useComponentsState`; U: ComponentInstances, `componentSync`; S: `site-component.service`, `component-usage` | Good | The `site-component` router is never invoked. There is one `it.todo` in ComponentInstances. | R | P3 |
| **Brand / design system** | About 108 files (DesignSystemTab, linter, tokens, theme) | Good | 1 `it.skip`: "Save to site persists radius" (`DesignSystemTab.aggregation.test.tsx:94`). The `theme` router (13 procedures) is never invoked. | R | P3 |
| **Inspector** | C: ProInspector (8) plus many control tests | Good | None beyond the general lack of E2E | — | P3 |
| **Selected-element AI / AI chat / AI generation** | C: AiPromptPopover (1), AITab (6); R: `ai-router` (quota only); S: `ai.service`, `ai-generation-dispatch`, `ai-generate-worker`, styleCommands | Medium | `ai-router.test.ts` covers quota and usage only. No test checks site access on `streamPrompt`, `summarize` or `milestoneSuggest`. The SSE subscription transport is untested. The History AI summary is dead in production (A14-1), yet unit tests pass over it. | R + one transport-level test | P2 |
| **Review / Comments** | C: ReviewTab, ReviewBar, SendForReview, CommentLayer; U: ReviewService (p0 + base); S: review ×3, comment, client-review; R: `comments`, `reviews`, `reviews-own-submission`, `client-review-rate-limit` | **Good.** This is the best-covered authz surface. | No E2E of the reviewer link (`/review/[token]`) against a real DB. **Mentions are not implemented, so there is nothing to test.** | E | P2 |
| **Issues** | C: IssuesPanel ×2; U: DSLinter | Adequate for the feature's small scope | — | — | P3 |
| **History / Versioning / Undo** | U: HistoryManager ×4, `undo-redo-live.integration`, VersionHistoryStorage, `versionSync`, `useVersionHistory`; C: VersionHistoryPanel ×3, HistoryTab ×2; S: `site-version.service` | Good for a single user | The `site-version` router is never invoked. No test covers undo/redo when remote edits are interleaved. The History AI summary protocol failure (A14-1) is invisible to the mocked tests. | U (remote ops) + R | P2 |
| **Activity** | C: ActivityView; S: `site-detail-activity`, `workspace-activity`; dashboard activity-feed | Adequate | — | — | P3 |
| **Publish** | S: publish ×6 (approval, rollback, diff, prechecks), `scheduled-publish`; worker route (2); C: PublishTab (11), PublishWizard (2), `usePublishJob` (6) | Good at the service level | The `sites.publish`, `unpublish` and `rollback` role gates are **not router-tested**. `api/sse/publish/[jobId]` is untested. The `cron/scheduled-publish` route is untested. Nothing tests publishing during a collab session. No E2E of publish. | R + E (simulation mode) | P1 (A20-1, A20-3) |
| **Settings** (editor SettingsTab + dashboard site-detail) | S: site-detail ×7, site-settings ×3, redirect; R: site-detail ×5; C: SettingsTab screens (about 36) | Good | RedirectsScreen is timing-flaky (A20-13). The "not wired" copy is pinned by tests (A14-6). | — | P3 |
| **Templates** | C: TemplatesTab ×7; U: `templateSync`; S: `template-clone`, `template-scope`, `user-template`; R: `week2-authz` (applyToSite ADMIN, get scoping) | Good | The `user-template` router is never invoked. There are 3 `it.skip` in `template-ai-components`. | R | P3 |
| **Autosave / save conflict** | U: `buildrik-sync-provider`, `useComposerInit.loadFlow`; S: `sites-save-project` (mocked `findUnique`), `save-project-empty-snapshot`; C: ConflictModal | **Misleading.** The tests pass over the P0 lost-update race (A17-1). | Two concurrent saves against a real DB. The ConflictModal "overwrite" path deleting pages that B does not have. | S against a real DB | **P1 (A20-2)** |
| **Auth / Invites / Roles / Sharing** | S: `permission-service` (21 cases incl. site-scoping, bearer isolation), `userCanEditSite`, `team-service`, `session-revocation`, login tests; R: `account-workspace-authz`, `week2-authz`, `trpc-bearer-auth` | Good for `checkSiteRole` and `assertSiteAccess`. **Weak where it matters for invites and revocation.** | `auth.acceptInvite` (email binding, expiry; the logic lives in the router, `auth.ts:261-300`) has only source-grep coverage. `checkWorkspaceRole` has 0 direct tests. The `team` router gates are not router-tested. `revokeMember` tests do not assert the session kill (A20-8). `share/[token]/verify-password`, `api-token.service` and `workspace-transfer.service` have 0 tests. | R + S | **P1 (A20-3, A20-5)** |
| **Billing / crons** | S: billing, stripe-webhook (helpers mirror live payloads), subscription-liveness; route: stripe webhook; cron route tests for 12 of 18 | Medium | `cron/billing-downgrade` (a destructive plan downgrade, whose selection query lives in the route), `billing-dunning`, `scheduled-publish`, `ssl-check` and `ai-job-cleanup` routes are untested. | Route tests | P2 (A20-10) |
| **Notifications** | S: `notification-service`, `notification-triggers`; C: NotificationPanel (1) | Medium | The `notifications` router is never invoked. `api/sse/notifications` is untested. | R | P2 |
| **Collaboration** | S: `collab-service` (11 cases, Prisma mocked); U: `OTEngine` (**2 cases**), `CollaborationManager` (**1 case**); C: presence visuals | **Near zero** | All 11 of the scenarios in the next table. | U (a two-client harness with an in-memory transport) + route tests | **P1 (A20-4)**, which gates enabling `FEATURE_COLLAB` |

### Collaboration scenarios requested by Prompt 20

| Scenario | Test exists? | Evidence |
|---|---|---|
| Two-user editing | No | No test builds two `CollaborationManager` or `OTEngine` instances. |
| Simultaneous updates | No | `OTEngine.test.ts` has 21 lines and 2 "fast path" cases. |
| Conflict resolution | Partial (2 transform cases) | Same file. |
| Reconnect | No | `SSETransport.ts` has **0 tests**. The `resync` event is unhandled (A14-8 / A16). |
| Offline edits | No | — |
| Permission revocation mid-session | No | The SSE route (`api/sse/collab/[siteId]/route.ts`) has 0 tests. |
| Invite (joins a live session) | No | — |
| Remove member | No | — |
| Remote delete of the selected element | No | — |
| Undo/redo with remote edits | No | The HistoryManager tests are single-user only. |
| Publish during collaboration | No | — |

---

## Findings

### P0

**None.** No test gap here qualifies as P0 in its own right. The one P0-class defect these gaps let through is the save-conflict race. It is already filed by Agent E as **A17-1**, and A20-2 explains why the suite could not catch it.

### P1

#### A20-1: No end-to-end test runs the core editor loop against a real backend
- **Severity:** P1
- **File:**
  - `packages/editor/playwright.config.ts:30,62-70`, which serves `vite .` (the probe or demo, not Next)
  - `packages/editor/e2e/*.spec.ts`
  - `.github/workflows/dashboard-tests.yml` ("Dashboard smoke floor" step)
- **Symbol:** Playwright projects
- **Evidence:**
  - The 5 editor specs are `boot-clean`, `exit-guard`, `style-parity`, `target-size` and `visual-pins`. They target `http://localhost:5050/` (the standalone demo, `boot-clean.spec.ts:91`) or the vite probe.
  - `CLAUDE.md` itself calls that demo one that "doesn't load real projects".
  - The 7 dashboard specs cover smoke, onboarding, accessibility, links and responsive layout. None of them opens `/edit/[siteId]`.
  - CI runs only `e2e/dashboard.spec.ts`, which checks that each route renders an h1.
  - So nothing automated drives login → open a real site → edit → autosave → reload → content persisted → publish.
- **Expected:** At least one E2E test of that flow against Postgres. It could run in `PUBLISH_ALLOW_SIMULATION` mode, which already exists for exactly this.
- **Root cause:** The E2E investment went into visual and accessibility gates on the demo app. The CI e2e job deliberately keeps a "smoke floor".
- **Affected modules:** Autosave, Pages, Publish, EditorClient/`userCanEditSite`, the `saveProject` and `getProjectData` round-trip.
- **Recommendation:**
  - Add `e2e/editor-roundtrip.spec.ts` to the dashboard Playwright config. The CI job already has Postgres, a seed and `NEXT_PUBLIC_UNIFIED_EDITOR=true`.
  - Cover: edit a text element, wait for the save, reload, assert the text, then publish in simulation mode and assert the job reaches success.
- **Status:** VERIFIED (static: spec inventory and workflow). NOT RUNTIME VERIFIED (Playwright not run).

#### A20-2: No backend test touches a database, so transaction, race, raw-SQL and constraint bugs cannot be caught
- **Severity:** P1
- **File:**
  - `__tests__/sites-save-project.test.ts:391-430`
  - `server/services/sites.service.ts:594-612`
  - `.github/workflows/dashboard-tests.yml` (the `unit` job)
- **Symbol:** `saveProjectData`, and every Prisma-mocked service test
- **Evidence:**
  - About 181 test files cover `__tests__`, `server` and `lib`. 104 of them `vi.mock` Prisma, and none constructs a real `PrismaClient`.
  - The CI `unit` job sets `DATABASE_URL` but runs no Postgres service. Only `e2e-smoke` has one.
  - Concrete escape: the "61-conflict" test mocks `prisma.site.findUnique` to return a fixed `lastEditedAt` and asserts that `SAVE_CONFLICT` is thrown. The implementation reads outside the transaction (`sites.service.ts:595,603-608`) and writes inside it (`:612`), which is the TOCTOU race in A17-1. A mock cannot interleave two callers, so the suite is green over a P0 lost-update bug.
  - The same blindness covers:
    - `$queryRaw` in `rate-limiter.ts`, `media.service.ts`, `site-settings.service.ts` and `cron/analytics-aggregate`
    - `@@unique` collisions
    - soft-delete cascades. `soft-delete-cascade.test.ts` only greps for `$transaction` in the source.
- **Expected:** A small integration tier (for example a `*.db.test.ts` suffix) that runs against a disposable Postgres in CI and covers the concurrency, raw-SQL and cascade paths.
- **Root cause:** No DB test harness exists. Mocking Prisma is the only pattern in the repo.
- **Affected modules:** Autosave, Pages, rate limiting (login, share password, public forms), analytics aggregation, soft delete, collab op sequencing.
- **Recommendation:**
  - Add a Postgres service to the `unit` job, or a separate `db` job.
  - Add a `vitest.db.config.ts` with `prisma migrate deploy` in global setup.
  - First tests:
    - Two parallel `saveProjectData` calls with the same `expectedLastEditedAt`: exactly one must succeed.
    - `checkRateLimit` / `peekRateLimit` window and reset behaviour.
    - The soft-delete cascade.
    - `appendCollabOp` sequence ordering under concurrency.
- **Status:** VERIFIED (static; the cited tests pass: 72/72 in the run above).

#### A20-3: 19 of 33 tRPC routers are never invoked by any test, so their role gates are unpinned
- **Severity:** P1
- **File:** `server/trpc/routers/*.ts`
- **Symbol:**
  - The routers `api-tokens`, `auth`, `cms`, `dashboard`, `forms`, `handover`, `help`, `learn`, `marketplace`, `notifications`, `onboarding`, `pages`, `site-component`, `site-version`, `team`, `theme`, `upload`, `user-template`, `webhooks`
  - Most of `sites`
- **Evidence:**
  - No test imports these routers or calls them through `createCaller`. By a grep count that is about 145 of the roughly 286 procedures.
  - `sites` (32 procedures) is reached only by `site-limit-message.test.ts` (`create`). So you could delete these gates and no test would fail:
    - `checkSiteRole(…, "OWNER")` on `sites.delete` (`sites.ts:166`)
    - `"OWNER"` on `transfer` (`:242`)
    - `"EDITOR"` on `publish` (`:330`)
    - `"ADMIN"` on `unpublish` / `rollback` (`:501,554`)
  - The `team` router's ADMIN helper (`team.ts:41`) guards invite, changeRole, revoke and delete, and is not router-tested.
  - `auth.acceptInvite` holds its security logic in the router: the expiry check, `CONFLICT`, and the email binding at `auth.ts:~287`. It is covered only by `readFileSync` source-grep tests.
  - `checkWorkspaceRole` has 0 direct tests; `permission-service.test.ts` only exercises `checkSiteRole` and `assertSiteAccess`.
  - The pattern that works already exists: `week2-authz.test.ts` and `comments.test.ts` assert both that a denied caller is rejected and that "the service never runs".
- **Expected:** Every mutating procedure has a router test showing that the minimum role is enforced and the service is not called when the check fails.
- **Root cause:** Router tests were added per incident ("week2", "F3") rather than per procedure. The orphan scan checks only whether a procedure has a *caller*, not whether it has a *gate*.
- **Affected modules:** Sites, Publish, Team, Invites, Pages, CMS, Theme, Site versions, API tokens, Webhooks.
- **Recommendation:**
  - Add one table-driven authz-matrix test: `{router, procedure, minRole, input}` × `{below, at}`, using the `week2-authz` mock pattern.
  - Add a behavioural `acceptInvite` test covering wrong email → FORBIDDEN, expired, and already a member.
- **Status:** VERIFIED (static; the gates exist in code today, and no test pins them).

#### A20-4: Collaboration has essentially no tests, and none of the 11 required scenarios is covered
- **Severity:** P1. It does not affect the production path while `FEATURE_COLLAB` is off, but it blocks ever turning collab on.
- **File:**
  - `packages/editor/src/engine/collaboration/__tests__/OTEngine.test.ts` (21 lines, 2 cases)
  - `CollaborationManager.test.ts` (11 lines, 1 case)
  - `SSETransport.ts` (no test)
  - `packages/dashboard/app/api/collab/[siteId]/ops/route.ts` and `api/sse/collab/[siteId]/route.ts` (no tests)
- **Symbol:** `OTEngine`, `CollaborationManager`, `SSETransport`, the collab routes
- **Evidence:**
  - The collaboration scenarios table above shows 0 of 11 scenarios covered.
  - `collab-service.test.ts` (11 cases, Prisma mocked) covers sequence, prune and resync-gap arithmetic only.
  - The unhandled `resync` (A14-8) and the permission that is checked only once, at stream open (A16), are exactly what a transport test would catch.
- **Expected:**
  - A deterministic two-client harness: two composers plus an in-memory transport, with controllable delivery order.
  - Route tests for the ops POST (role check, body validation) and the SSE stream (revocation, resync).
- **Root cause:** Collab shipped as demo-only behind a flag, with no test investment.
- **Affected modules:** Collaboration, Undo, History, Autosave, Publish.
- **Recommendation:** Make the harness and the 11 scenario tests a precondition for flipping `NEXT_PUBLIC_FEATURE_COLLAB`. Agent D owns the defects themselves.
- **Status:** VERIFIED (static; 3 collab test files ran green).

#### A20-5: Security-critical units with zero tests
- **Severity:** P1
- **File:**
  - `server/services/rate-limiter.ts:10-69`
  - `packages/dashboard/app/api/asset-upload/route.ts` (274 lines)
  - `packages/dashboard/app/api/upload/[fileId]/route.ts` (114 lines)
  - `packages/dashboard/app/api/share/[token]/verify-password/route.ts`
  - `server/services/api-token.service.ts`
  - `server/services/workspace-transfer.service.ts`
  - `server/services/media.service.ts:285-495`
- **Symbol:**
  - `checkRateLimit`, `peekRateLimit`
  - the `onBeforeGenerateToken` guard chain (session, quota, per-plan size, folder ownership)
  - `PUT` in the upload route (owner check, content-type match, `validateUpload`)
  - `deleteAsset`, `moveAsset`, `updateAsset`, `restoreAssetVersion`
- **Evidence:**
  - No test imports any of these without mocking them. Every tRPC router test mocks the rate limiter or the auth layer.
  - The rate limiter is the only per-IP login throttle. `auth.ts:54-56` gates on `peekRateLimit`, and `auth.ts:79` increments on failure.
  - `peekRateLimit` compares `row.resetAt < now` **in JavaScript** (`rate-limiter.ts:66`). The comment 30 lines above it (`:20-27`) says that raw-SQL `resetAt` values read back shifted by the database session's UTC offset (measured: "313 minutes" for a 15-minute window). `checkRateLimit` works around this in SQL; `peekRateLimit` does not.
  - On a database whose session `TimeZone` has a negative UTC offset, peek would treat every window as already expired. The per-IP login limit and the captcha gate (`auth.ts:62`) would then never engage. On a positive offset, lockouts would last hours longer than intended.
  - This is the kind of defect only a DB-backed test would catch (A20-2).
- **Expected:**
  - Tests for:
    - each upload guard (wrong owner → 403, content-type mismatch → 400, oversize per plan, foreign `folderId`)
    - the rate-limit window, reset and peek behaviour against real Postgres, including under a non-UTC `TimeZone`
    - share-password throttling
    - api-token hashing, verification and revocation
    - workspace-transfer accept, expiry and wrong-user cases
    - media ownership
- **Root cause:** Route handlers and small infrastructure services fall outside the service-plus-router test habit.
- **Affected modules:** Auth (login), uploads (media, favicon, OG image), public share links, API tokens, workspace transfer, Media.
- **Recommendation:** Add the route and service tests. Agent F should confirm the peek time-zone behaviour against production's Postgres `SHOW timezone`. If it is negative-offset, this becomes **P0 — IMMEDIATE FIX REQUIRED** (login throttle bypass).
- **Status:** VERIFIED that no tests exist. The peek time-zone behaviour is **PARTIAL / NOT RUNTIME VERIFIED**: it is reasoned from the code and the code's own measured comment, and the production DB time zone is unknown.

### P2

#### A20-6: Four deterministic failures since commit `fca2b60` (2026-09-15) mean every full vitest run is red
- **Severity:** P2
- **File:**
  - `packages/editor/src/editor/shell/modals/__tests__/CommandPalette.test.tsx` (3 tests)
  - `packages/editor/src/editor/canvas/__tests__/CanvasEmptyCTA.test.tsx` (1 test)
- **Symbol:** —
- **Evidence:**
  - Reproduced: `4 failed | 42 passed`.
    - The CommandPalette tests expect "length of 21 but got 23" and cannot find "Open Insert panel".
    - The CanvasEmptyCTA test regex expects `id: "add" … label: "Insert"` in the `tabsConfig.ts` source.
  - `git show fca2b60` ("wip(editor): v3 IA…") changed three things:
    - it added two palette commands (`templates-replace-layout`, `help-keyboard-shortcuts`)
    - it renamed the tab label from Insert to Add
    - it updated six other test files.
  - It did not update these two. Its message says it was "verified" with targeted suites (45 files).
  - Both CI workflows run the full suite (`dashboard-tests.yml` unit job, `editor-ci.yml:166,175`), so they would be red on any branch containing `fca2b60`. I have no CI history to confirm this.
  - A permanently red suite hides new regressions.
- **Expected:** A green baseline. Tests updated in the same commit as the label and commands.
- **Root cause:** Test drift after the relabel. This is **not a product bug.** The commit was verified against a targeted subset only.
- **Affected modules:** Commands, Add, CI signal for the whole repo.
- **Recommendation:** Update the counts and labels in the 2 files. Also add a pre-push or CI rule that a WIP commit may not land on `main` with the suite red.
- **Status:** VERIFIED (failures and root cause). CI state NOT VERIFIED.

#### A20-7: 89 test files assert on source text, and several are named as if they were E2E or DB tests
- **Severity:** P2
- **File:**
  - `__tests__/e2e-backend-safety.test.ts`
  - `__tests__/e2e-frontend-gaps.test.ts`
  - `__tests__/db-data-flows.test.ts`
  - `__tests__/soft-delete-cascade.test.ts`
  - `__tests__/schema-integrity.test.ts`
  - 17 root files in total, 52 in the editor, 12 in dashboard components
- **Symbol:** `readFileSync(...)` plus `toContain` / `toMatch` / `indexOf` ordering
- **Evidence:**
  - `e2e-backend-safety` "B2" asserts `fnBody.indexOf("prisma.user.findUnique") < fnBody.indexOf("await invalidateToken")`. `e2e-frontend-gaps` "F2" asserts that the source `toContain("onError")`. `schema-integrity` asserts "all 41 models from PRD", while the schema now has 67.
  - These tests pass for a correct refactor that happens to rename things, and pass for broken code that keeps the strings.
  - `CanvasEmptyCTA` (A20-6) is the live example: a regex over `tabsConfig.ts` failed on a label rename that had no behavioural effect.
  - The names `e2e-*` and `db-data-flows` read as runtime coverage in any summary.
- **Expected:** Behavioural tests, with source scans kept for true lint-style invariants (banned imports, no `console.log`) and named as scans.
- **Root cause:** Regression tests written the quick way after audits.
- **Affected modules:** Auth, sessions, soft delete, schema, many editor surfaces.
- **Recommendation:**
  - Rename these files to `*.source-scan.test.ts` so the pattern is honest.
  - Convert the security-relevant ones (create-session ordering, logout decode, `acceptInvite`) into behavioural route or router tests.
- **Status:** VERIFIED (static; the sampled files were read).

#### A20-8: Over-mocked service tests assert the mock's return value, not the side effect
- **Severity:** P2
- **File:**
  - `__tests__/team-service.test.ts:141-152`
  - `server/services/team.service.ts:168-191`
- **Symbol:** `revokeMember` test
- **Evidence:**
  - The test mocks `workspaceMember.update` to return `{status:"SUSPENDED"}` and asserts `result.status === "SUSPENDED"`.
  - The real point of `revokeMember` is to kill the member's sessions immediately, via `sessionVersion: { increment: 1 }` and `session.deleteMany` (`team.service.ts:182-189`). The test asserts neither, so deleting those lines keeps it green.
  - The same shape appears in the `saveProjectData` conflict test (A20-2).
  - The "remove member" and "permission revocation" scenarios therefore have no effective test.
- **Expected:** Assert on the calls that carry the security effect: `user.update` with a `sessionVersion` increment, and `session.deleteMany({userId})`.
- **Root cause:** Tests written against the return shape.
- **Affected modules:** Team, Roles, Sessions.
- **Recommendation:** Add call assertions to `revokeMember` and `deleteMember`, and review the other Prisma-mocked tests for the same pattern.
- **Status:** VERIFIED.

#### A20-9: Layer mutations and two insert surfaces are untested
- **Severity:** P2
- **File:**
  - `packages/editor/src/editor/panels/layers/hooks/useLayerActions.ts:212-281`
  - `useLayerContextActions.ts`
  - `BlockPickerModal`
  - `StructurePopover`
- **Symbol:** delete, move, group and reorder via `composer.elements.moveElement` / `removeElement`
- **Evidence:**
  - The only `useLayerActions` test is `useLayerActions.hydration.test.tsx`.
  - No layers test mentions reorder or move.
  - `BlockPickerModal` and `StructurePopover` have 0 test references.
- **Expected:** Hook tests against a real composer that cover move into a parent, group, delete, and undo of each.
- **Root cause:** Tests focus on rendering and board conformance.
- **Affected modules:** Layers, Add, Undo.
- **Recommendation:** Add the hook-level tests. Engine `ElementManager` tests already give a real composer to build on.
- **Status:** VERIFIED (static).

#### A20-10: The destructive and billing cron routes are untested
- **Severity:** P2
- **File:**
  - `packages/dashboard/app/api/cron/billing-downgrade/route.ts:19-38`
  - `billing-dunning`, `scheduled-publish`, `ssl-check` and `ai-job-cleanup` routes
- **Symbol:** GET handlers
- **Evidence:**
  - These routes have no tests. 12 of the 18 cron routes do.
  - `billing-downgrade` selects `status:"PAST_DUE", stripeCurrentPeriodEnd < graceCutoff` directly in the route and sets `plan:"FREE", status:"CANCELLED"`.
  - `reconcileWorkspaceToFreePlan` is tested, but the selection that decides *who* gets downgraded is not.
- **Expected:** Route tests covering the cron-auth rejection and the selection predicate: an active subscriber is not downgraded, and a past-due subscriber inside the grace period is not downgraded.
- **Root cause:** Cron tests were added one route at a time.
- **Affected modules:** Billing, Publish (scheduled), Domains.
- **Recommendation:** Add the tests. Pair with A14-2, since whether these crons run at all on cPanel is unknown.
- **Status:** VERIFIED (static).

#### A20-11: CI may not be able to finish the suite, and the editor tests run twice
- **Severity:** P2
- **File:** `.github/workflows/editor-ci.yml:57` (`timeout-minutes: 15`), `:166` (editor vitest), `:175` (root vitest)
- **Symbol:** `build-and-test` job
- **Evidence:**
  - One 15-minute job runs vite build, about 7 gates, lint, the editor suite, and then the root suite. The root suite already includes `packages/editor/src/**` (`vitest.config.ts` include), so the editor's roughly 900 files run twice.
  - Locally, the root suite could not finish unsharded in 600 s, and took 3 shards of about 4–7 minutes each (inventory §9).
  - The box was under load, so the CI duration is unknown.
- **Expected:** Each test runs once per workflow, and the budget is sized to the measured duration.
- **Root cause:** The root run was added to catch a setup-file regression (see the comment at `:168-173`) without excluding the editor tree.
- **Affected modules:** CI signal.
- **Recommendation:** Exclude `packages/editor/src/**` from the root run in this job, or shard it. Record the actual CI duration.
- **Status:** PARTIAL. The CI timing is NOT VERIFIED.

#### A20-12: The realtime SSE endpoints have no tests
- **Severity:** P2
- **File:** `packages/dashboard/app/api/sse/publish/[jobId]/route.ts`, `api/sse/notifications/route.ts`, `api/sse/collab/[siteId]/route.ts`
- **Symbol:** stream handlers
- **Evidence:** No test references any SSE route. Publish progress is covered only through the mocked `usePublishJob` hook.
- **Expected:** Route tests for auth, access to the job's site, event framing, and close on a terminal state.
- **Root cause:** —
- **Affected modules:** Publish progress, Notifications, Collab.
- **Recommendation:** Add the route tests.
- **Status:** VERIFIED (static).

### P3

#### A20-13: `RedirectsScreen.test.tsx` is timing-flaky under CPU load
- **Severity:** P3
- **File:** `packages/editor/src/editor/sidebar/tabs/settings/screens/__tests__/RedirectsScreen.test.tsx:103` and others
- **Symbol:** `waitFor` / `getByTestId` sequences with the default 1000 ms `waitFor` timeout
- **Evidence:**
  - Run 3 times on its own: 30/30 passed each time (about 1.1 s of test time).
  - In the inventory's loaded runs, a different test failed each time (`Unable to find [data-testid="set-rd-add"]`).
  - `test-setup.ts` sets no `asyncUtilTimeout`.
- **Expected:** The test is deterministic under load.
- **Root cause:** It relies on the default async timeout while sharing 4 cores with other suites.
- **Affected modules:** CI signal.
- **Recommendation:** Wait with `findBy*` or `loaded()` before sync `getBy*` clicks, or set a larger `asyncUtilTimeout` globally.
- **Status:** PARTIAL. The flake is reproduced only by the inventory; I did not reproduce it.

#### A20-14: Known bugs are parked as `it.todo`
- **Severity:** P3
- **File:**
  - `AICache.test.ts:134`
  - `async.test.ts:92`
  - `validateElementTree.test.ts:168`
  - `colorParser.test.ts:110`
  - `InteractionRuntime.test.ts:616-620`
  - about 20 more
- **Symbol:** `it.todo("BUG: …")`, plus 4 `it.skip`
- **Evidence:**
  - Examples of documented but unfixed bugs:
    - "parallel(tasks, n) does not enforce the concurrency limit"
    - "validateAccessibility throws TypeError on unknown element type"
    - "oklch() parsed through lch()"
  - There are 27 skipped or todo tests in total.
  - `DesignSystemTab.aggregation.test.tsx:94` skips "Save to site persists radius".
- **Expected:** Each one either becomes a ticket or gets fixed. A todo is not a tracker.
- **Root cause:** Audit output was encoded as todos.
- **Affected modules:** AI cache, utilities, validation, Brand.
- **Recommendation:** Triage the list into the fix-batch plan.
- **Status:** VERIFIED.

#### A20-15: Most Playwright specs never run in CI, and two self-skip there
- **Severity:** P3
- **File:**
  - `.github/workflows/dashboard-tests.yml` (only `e2e/dashboard.spec.ts`)
  - `editor-ci.yml:238` (`test:parity` = `playwright test`)
  - `boot-clean.spec.ts:118`, `exit-guard.spec.ts:118`
- **Symbol:** —
- **Evidence:**
  - `onboarding.spec.ts` (26 tests), accessibility, console, link and responsive specs are manual only.
  - `boot-clean` and `exit-guard` call `test.skip(!up, "demo app not running on :5050 … NOT MEASURED")`.
  - In `editor-ci`, the Playwright step runs before the step that starts `:5050` (the Figma conformance step), so these two most likely skip in CI while CI stays green.
- **Expected:** Specs either run in CI or are listed as manual. An absent server should fail the run, not skip it.
- **Root cause:** —
- **Affected modules:** Onboarding, Autosave dirty-flag, exit guard.
- **Recommendation:**
  - Add `onboarding.spec.ts` to the e2e job; it already has a DB.
  - Make the `:5050` specs start their own server, or fail when the server is absent in CI.
- **Status:** PARTIAL. I inferred the skip from the workflow step order and did not observe it.

---

## Good as-is

- **The permission core is well tested.** `permission-service.test.ts` has 21 cases, and they cover the right edges:
  - role thresholds
  - override up and down
  - site-scoped members with and without a grant
  - ADMIN is never scoped
  - SUSPENDED members
  - cross-workspace isolation
  - bearer-token workspace mismatch
- **The router authz tests use the right shape.** `week2-authz`, `comments`, `reviews`, `account-workspace-authz` and `clients` assert both the rejection and that the service never ran. That is the template for A20-3.
- **The Stripe webhook tests** build payloads with the `invoiceParent()` and `subItem()` helpers, which mirror verified live payloads. That is a sound defence against invented payloads.
- **Publish service coverage is deep:** approval, rollback, diff, pre-checks, visibility and scheduled publish, plus a route test of the worker's build steps.
- **Undo/History has a live integration test** (`undo-redo-live.integration.test.ts`) as well as the HistoryManager unit tests.
- **`save-project-empty-snapshot.test.ts`** pins the `EMPTY_SNAPSHOT` guard, which stops a failed load plus an autosave from wiping every page.
- **The `target-size` Playwright gate** is negative-controlled (its comment records that it was watched failing) and runs in CI.

## Product decisions required

1. **Whether to add a DB-backed test tier to CI.** It adds infrastructure and time, but without it A20-2, A20-5 and the peek time-zone question cannot be closed.
2. **Collab test bar.** Should the two-client harness (A20-4) be a formal gate on enabling `FEATURE_COLLAB`? My recommendation is yes.
3. **Source-scan policy.** Keep or convert the 89 source-text tests (A20-7)? At minimum, rename them honestly.

## Overlaps with other audits

- **A17-1 (E), the save-conflict TOCTOU (P0).** A20-2 explains why the suite is green over it. The fix batch should include the concurrent-save DB test.
- **F (security).** The `peekRateLimit` time-zone comparison (A20-5) needs `SHOW timezone` on production Postgres. Upload route guards and `acceptInvite` email binding are untested.
- **A14-1, A14-6, A14-8 (G/14).** Unit tests pass over the History AI 400, pin the stale "not wired" copy, and do not cover the unhandled `resync`.
- **D (A16).** Every collab runtime defect lacks a test (A20-4).
- **A14-2.** The untested cron routes (A20-10) may also never run on cPanel.

---

## AUDIT HANDOFF

- **Agent / Prompt:** G, Verification & Test / Prompt 20: Test Coverage & Test Quality
- **Report:** `docs/audits/2026-09-25-full-audit/20-test-coverage.md`
- **Counts:** P0 = 0 · P1 = 5 · P2 = 7 · P3 = 3
- **P0:** none. The P0-class race these gaps let through is A17-1, already filed by E.
- **P1:**
  - A20-1: no E2E of the real edit → save → reload → publish loop.
  - A20-2: no DB-backed backend tests. The mocks are green over A17-1 and cannot see raw SQL.
  - A20-3: 19 of 33 routers (about 145 procedures) are never invoked by a test. Sites, team and invite gates are unpinned.
  - A20-4: collaboration has 0 of 11 required scenarios; `SSETransport` and the collab routes are untested.
  - A20-5: rate limiter, upload routes, share password, api-token, workspace-transfer and media ownership have zero tests. The peek time-zone hypothesis is P0-class if production's DB time zone is negative.
- **P2:**
  - A20-6: 4 red tests since `fca2b60` (drift, not a product bug).
  - A20-7: 89 source-text tests, some named "e2e" or "db".
  - A20-8: over-mocked `revokeMember` test that does not assert the session kill.
  - A20-9: layer mutations, BlockPicker and StructurePopover untested.
  - A20-10: destructive and billing cron routes untested.
  - A20-11: CI budget, and the editor suite runs twice.
  - A20-12: SSE routes untested.
- **P3:**
  - A20-13: RedirectsScreen flake.
  - A20-14: bugs parked as `it.todo`.
  - A20-15: Playwright specs outside CI or self-skipping.
- **Runtime verified:**
  - The 4 failing tests and their root commit.
  - RedirectsScreen passes 3/3 on its own.
  - The cited backend and collab tests run green (72/72).
- **NOT runtime verified:**
  - Every behaviour needing a DB or a browser.
  - All Playwright specs.
  - CI red/green state and duration.
  - The production Postgres `TimeZone` (A20-5).
  - The flake reproduction (A20-13).
- **Blocking dependencies:**
  - A20-5's severity depends on F or the owner reading production `SHOW timezone`.
  - A20-2 needs a decision on a DB test tier.
  - A20-4 should gate `FEATURE_COLLAB`.
- **Suggested fix batch:**
  - **T1 (green baseline):** A20-6, A20-13.
  - **T2 (DB tier, needs a decision):** A20-2 with the A17-1 regression test, plus the A20-5 rate-limit and media ownership tests.
  - **T3 (authz matrix):** A20-3 and `acceptInvite`, plus A20-8.
  - **T4 (E2E):** A20-1 and A20-15.
  - **T5 (collab harness, with D):** A20-4 and A20-12.
  - **T6 (cleanup):** A20-7, A20-9, A20-10, A20-11, A20-14.
