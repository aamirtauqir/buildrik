# Audit Code-Fixes Implementation Plan (S5.2 pill + stale comment)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Surface the S5.2 review-status pill for the designer (not just client view) and fix the stale ADMIN-premise comment in the publish approval gate.

**Architecture:** Everything already exists — `reviews.status` (6-state derivation incl. stale, flag-off→none, EDITOR-readable), `ReviewService.fetchReviewStatus` (fails closed to `none`), and the full `REVIEW_PILL` map in Topbar. The only gap is that fetch + render are gated on `viewMode.clientView`. Un-gate both. Comment fix is doc-only, no behavior change.

**Tech Stack:** React 18 + Vitest + RTL (editor package), plain TS comment edit (server).

## Global Constraints

- Solo workflow: commit directly to `main`, no branches (user preference).
- 2026-07-22 audit context: `templates.applyToSite` ADMIN gate and `sites.publish` EDITOR gate are ALREADY correct in code — do not touch them.
- `reviews.status` is agency_layer-gated server-side and `fetchReviewStatus` returns `{state:"none"}` on any failure — an always-on fetch is safe for non-agency workspaces (pill renders nothing for `none`).

---

### Task 1: Un-gate the S5.2 pill from client view

**Files:**
- Modify: `packages/editor/src/editor/shell/Topbar.tsx:223-226` (effect) and `:430` (render condition)
- Test: `packages/editor/src/editor/shell/__tests__/Topbar.test.tsx`

**Interfaces:**
- Consumes: `fetchReviewStatus(): Promise<ReviewStatus>` (already mocked in the test file), `REVIEW_PILL` map (6 keys, `none` → null).
- Produces: pill visible in the default (non-clientView) topbar whenever `REVIEW_PILL[reviewStatus.state]` is non-null.

- [ ] **Step 1: Write the failing tests** — new describe block in `Topbar.test.tsx` (default view mode, i.e. no `setViewMode` override):

```tsx
  // ── S5.2 review-status pill (designer-facing, default view) ────────────────
  describe("review-status pill in default view", () => {
    it("shows the pill in the normal editor when a review is pending", async () => {
      vi.mocked(fetchReviewStatus).mockResolvedValueOnce({
        state: "pending",
        reviewerName: "Sara",
        at: null,
      });
      render(<Topbar {...makeProps()} />);
      expect(await screen.findByText("In review")).toBeInTheDocument();
    });

    it("shows the stale-approval pill state in the normal editor", async () => {
      vi.mocked(fetchReviewStatus).mockResolvedValueOnce({
        state: "approved-edited-since",
        reviewerName: "Sara",
        at: null,
      });
      render(<Topbar {...makeProps()} />);
      expect(await screen.findByText("Approved · edited since")).toBeInTheDocument();
    });

    it("renders no pill when there is no review in flight", async () => {
      render(<Topbar {...makeProps()} />);
      expect(fetchReviewStatus).toHaveBeenCalled();
      expect(screen.queryByText("In review")).not.toBeInTheDocument();
    });
  });
```

Also import `fetchReviewStatus` in the test's imports from `../../../services/ReviewService`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd packages/editor && npx vitest run src/editor/shell/__tests__/Topbar.test.tsx`
Expected: the two pill-visibility tests FAIL (pill not rendered outside clientView); the no-pill test may pass but `fetchReviewStatus` call assertion FAILS (fetch is clientView-gated).

- [ ] **Step 3: Implement** — in `Topbar.tsx`:

Effect (was gated):
```tsx
  React.useEffect(() => {
    // S5.2: the pill is the designer's own status surface — fetch on every
    // mount. Fails closed to "none" (flag off / no review), which renders
    // nothing, so this is safe for non-agency workspaces too.
    refreshReviewStatus();
  }, [refreshReviewStatus]);
```

Render (was `viewMode.clientView && REVIEW_PILL[...]`):
```tsx
          {REVIEW_PILL[reviewStatus.state] ? (
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd packages/editor && npx vitest run src/editor/shell/__tests__/Topbar.test.tsx`
Expected: full suite PASS (existing clientView tests unaffected — pill still renders there).

- [ ] **Step 5: Commit**

```bash
git add packages/editor/src/editor/shell/Topbar.tsx packages/editor/src/editor/shell/__tests__/Topbar.test.tsx
git commit -m "feat(editor): S5.2 review-status pill visible to the designer, not just client view"
```

### Task 2: Fix the stale ADMIN-premise comment in publish-approval.ts

**Files:**
- Modify: `server/services/publish-approval.ts:4-9` (header comment only)

**Interfaces:** none (comment-only; zero behavior change).

- [ ] **Step 1: Edit the comment** — replace the stale sentence block:

```ts
 * When a workspace has `editsRequireApproval` on, a publish is blocked unless the
 * site's latest review is APPROVED. Only the workspace OWNER is exempt (the policy
 * owner / approver-of-last-resort keeps an escape hatch). ADMINs are NOT exempt —
 * since M3, `sites.publish` gates at EDITOR (a DESIGNER may publish; the approval
 * is the real control), so the gate must hold for everyone below OWNER or it
 * blocks nobody — exactly the §13-C1 bug ("any ADMIN publishes even when the
 * workspace demands review"). Gating ADMIN is the whole point of the setting.
```

- [ ] **Step 2: Verify no behavior change**

Run: `cd packages/dashboard && npx vitest run ../../server/services/__tests__/publish-approval*.test.* 2>/dev/null || npx tsc --noEmit`
Expected: approval-gate unit tests still green (16 tests) / tsc clean.

- [ ] **Step 3: Commit**

```bash
git add server/services/publish-approval.ts
git commit -m "docs(publish-approval): fix stale ADMIN-premise comment (publish gates at EDITOR since M3)"
```

## Self-Review

- Spec coverage: audit §4 items — #1 bulk-publish: NOT REAL (no bulk publish action in `bulkActionSchema`; misread), #2 applyToSite: already fixed in code, #3 VIEWER: founder/contract decision (no code change), #4 pill: Task 1, stale comment: Task 2. Pins + J2: founder decisions, out of scope.
- No placeholders; types match (`ReviewStatus["state"]` keys mirror `REVIEW_PILL`).
