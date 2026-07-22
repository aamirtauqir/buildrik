# P0 — Editor-side review loop (wedge close) · task-level plan

> Executes P0 of `2026-07-22-design-to-code-master-plan.md`. Re-greped 2026-07-23 (standing rule). Corrections from the fresh grep are folded in below.

**Goal:** the designer can see + answer client comments and manage the review round from inside the editor, without leaving for the dashboard.

**Ground truth (re-greped 2026-07-23):**
- `comments.ts` router: `create` (assertSiteAccess) · `list` (assertSiteAccess, returns full Comment rows) · `workspaceList` (ADMIN) · `resolve` (EDITOR). `comments.list` has ONE consumer: `packages/dashboard/components/comments/comment-preview.tsx` (reads x/y/body/status) → an additive `include` is safe.
- `comment.service.listComments(siteId, status)` — oldest first, no relations. Client comments carry `reviewerId` (authorId null); internal carry `authorId` (reviewerId null). CHECK constraint: exactly one.
- `review.service`: `getReviewStatusForSite` (pill), `listReviews` (ADMIN queue), `resolveReview`, `submitReview` (idempotent on the open PENDING row — re-send overwrites note/summary/snapshot, mints a fresh token via `issueReviewToken`).
- `ReviewRequest.updatedAt @updatedAt` EXISTS → optimistic-concurrency revision for a race-safe revoke.
- `client-review.service.revokeReviewToken(workspaceId, reviewId)` exists but has **ZERO consumers** and is NOT revision-guarded → superseded by a guarded revoke in review.service (agency-authenticated half); delete the dead fn.
- Editor `ReviewService.ts` calls dashboard tRPC via `getBuildrikClient(DASHBOARD_URL)`, fail-closed pattern (`fetchReviewStatus` → `none` on any error).
- `TabRouter.tsx` maps `GroupedTabId` → lazy panel via `switch`; `tabsConfig.ts` `GROUPED_TABS_CONFIG` drives the rail (zone-gated) + `RailTool` map.

**Corrections to the master plan (from this grep):**
1. No new `reviews.comments` proc — **extend `comments.list`** with `include: { reviewer: { select: { name } } }` (additive). Editor derives `authorKind` from `reviewerId != null`.
2. Revoke: build `revokeReviewRound(workspaceId, reviewId, expectedRevision)` in review.service (revision = `updatedAt.toISOString()`), delete dead `revokeReviewToken`.
3. **No server-side REVIEW_REVOKED reject on internal replies.** Internal designer comments are NOT review-gated — comments outlive rounds (contracts §6.4); the designer replies to address feedback before re-sending. The CLIENT composer is already REVOKED-gated server-side via `requireLiveReview`. The master-plan registry row is corrected here; a test asserts internal reply works regardless of round state.
4. **Editor UI = Review sidebar tab (thread-list-first).** The canvas 💬 pin overlay is the pins fast-follow (locked decision — pins render only where coords exist). P0 ships the sidebar `ReviewTab`.

## Global constraints
Accent `#406ED6` via `--bd-*`; Gate 24 (no inline form elements — use vibcoder primitives); flag-gated behind `agency_layer` like `reviews.status`; TDD; commit per slice to `main`; tsc 0 + vitest green + live dev-DB integration before "done".

---

### Slice A — Server: race-safe revoke + current-round read

**Files:** `packages/shared/schemas/reviews.ts` · `server/services/review.service.ts` · `server/services/client-review.service.ts` (delete dead fn) · `server/trpc/routers/reviews.ts` · tests `server/services/__tests__/review.service.*.test.ts`

**Produces:**
- `revokeReviewInput = { siteId, reviewId, expectedRevision: string }`, `currentRoundInput = { siteId }` (shared schema).
- `getCurrentRound(siteId): Promise<CurrentRound | null>` — `{ id, status, invitedEmail, reviewerName, revoked, resolvedAt, createdAt, revision (updatedAt ISO), roundNumber, totalRounds, openCommentCount }`. roundNumber/totalRounds = count of ReviewRequest rows for the site (each re-send is the same row today → v1 rounds = 1 unless historical rows exist; count rows, current = latest).
- `revokeReviewRound(workspaceId, reviewId, expectedRevision): Promise<{ revoked: boolean; reason?: "token-changed" | "already-revoked" | "not-found" }>` — `updateMany where { id, site:{workspaceId}, revokedAt:null, updatedAt: new Date(expectedRevision) }` set `revokedAt`. count 1 → revoked; count 0 → disambiguate (find row: absent→not-found, revokedAt set→already-revoked, else→token-changed i.e. a re-send bumped updatedAt).
- Router: `reviews.currentRound` (flag-gated, EDITOR, flag-off → null) + `reviews.revoke` (flag-gated, EDITOR, activity-logged via `recordForSite`).

- [ ] A1 write failing service tests (getCurrentRound none/pending/resolved/revoked + openCommentCount; revoke match→revoked, stale-revision→token-changed, revoked→already-revoked, cross-ws→not-found)
- [ ] A2 run → fail
- [ ] A3 implement schemas + service fns + delete dead `revokeReviewToken` + router procs
- [ ] A4 run → pass; tsc 0
- [ ] A5 commit

### Slice B — Server: comments.list enrichment

**Files:** `server/services/comment.service.ts` · test `server/services/__tests__/comment.service.test.ts` (or reviews-adjacent)

**Produces:** `listComments` rows gain `reviewer: { name } | null`. Return type documents authorKind derivation. Dashboard consumer unaffected (additive).

- [ ] B1 failing test: listComments includes reviewer name for a client comment, null for internal
- [ ] B2 run → fail
- [ ] B3 add `include: { reviewer: { select: { name: true } } }`
- [ ] B4 run → pass; tsc 0
- [ ] B5 commit

### Slice C — Editor service layer

**Files:** `packages/editor/src/services/ReviewService.ts` · test `packages/editor/src/services/__tests__/ReviewService.test.ts`

**Produces (all fail-closed):**
- `fetchReviewComments(status?): Promise<ReviewComment[]>` — `comments.list` → `{ id, body, pageId, x, y, status, authorKind: "client"|"internal", authorName, createdAt }`.
- `fetchCurrentRound(): Promise<CurrentRound | null>` — `reviews.currentRound`.
- `revokeReview(reviewId, expectedRevision): Promise<{ revoked, reason? }>` — `reviews.revoke` (throws mapped to `{ revoked:false, reason:"error" }`).
- `postReply(body, pageId?): Promise<void>` — `comments.create` (authorId server-side).
- `resolveReviewComment(id, status): Promise<void>` — `comments.resolve`.

- [ ] C1 failing tests (mock getBuildrikClient; map shapes; fail-closed)
- [ ] C2 run → fail · C3 implement · C4 pass; tsc 0 · C5 commit

### Slice D — Editor UI: ReviewTab (sidebar, below divider)

**Files:** `packages/editor/src/editor/rail/tabsConfig.ts` (+`review` id, config) · `packages/editor/src/editor/sidebar/TabRouter.tsx` (case) · `packages/editor/src/editor/sidebar/tabs/review/ReviewTab.tsx` (new) · test `.../review/__tests__/ReviewTab.test.tsx`

**Produces:** `ReviewTab` — current-round header (status + invited email + round N of M) + open-count badge; thread list grouped per page, each row labels client/internal + name + relative time + "Home · pinned"/"General note"; reply composer (rest/pending/failed-retry); resolve/unresolve; show-resolved toggle; **Re-send** (primary → `submitForReview` re-send path) with confirm; **Revoke** behind ⋯ overflow + named confirm; states loading · empty ("No feedback yet") · **error+retry (never fake-empty)** · never-sent. DS primitives only (Gate 24). Flag-gated: tab hidden when `agency_layer` off (currentRound null + status none).

- [ ] D1 failing RTL tests (loading→list; empty; error+retry not fake-empty; reply calls service; resolve calls service; revoke behind overflow + confirm; re-send primary)
- [ ] D2 run → fail · D3 implement ReviewTab + config + router case · D4 pass; tsc 0 · D5 commit

### Slice E — Verify

- [ ] E1 full editor vitest green + full dashboard/server vitest green for touched files
- [ ] E2 tsc 0 both packages
- [ ] E3 gates: Gate 24, ds-ssot, buildrick-baseline
- [ ] E4 live dev-DB integration: seed site+review+client comment → getCurrentRound → revoke (revision match) → re-send bumps revision → stale revoke → token-changed. Cascade-clean.
- [ ] E5 commit verification notes; update memory
