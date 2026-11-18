# Phase 1 — Audit 6: Workspace Interaction Architecture

Date: 2026-09-25. Scope: dashboard, auth, and workspace/editor handoff interactions. Production code was inspected read-only. This report records static control-to-handler-to-state/API traces; no workspace interaction in this scope was runtime reproduced in this pass.

## Findings

### INT-W01 — Clipboard controls show success before clipboard writes resolve

- **Severity:** P3
- **File/symbol:** `packages/dashboard/app/dashboard/projects/page.tsx`, `handleSiteAction` (`copyUrl` branch, lines 350–361); `packages/dashboard/components/media/media-library.tsx`, `copyUrl` (lines 164–168).
- **Interaction:** Site context-menu Copy URL and media-card Copy URL.
- **Handler/state/API:** Both call `navigator.clipboard.writeText(url)` without awaiting or catching its promise. The site action immediately adds a success toast (projects page lines 356–357); media immediately sets the copied indicator and starts its timeout (media library lines 165–167).
- **Actual behavior:** The UI reports success before the asynchronous browser clipboard operation has succeeded. A rejected clipboard write has no local error feedback and can leave the site toast or media copied indicator claiming success.
- **Expected behavior:** Show success only after the write fulfills; surface a retry/error state if it rejects.
- **Root cause / affected modules:** Clipboard promise is treated as synchronous in both workspace copy actions.
- **Recommendation:** Share an async copy helper or handle fulfillment/rejection in each action; keep feedback tied to the resolved result.
- **Status:** SOURCE VERIFIED; NOT RUNTIME VERIFIED.

### INT-W02 — Site selection can outlive the visible result set

- **Severity:** P2 candidate; confirm intended bulk-selection scope before changing behavior.
- **File/symbol:** `packages/dashboard/app/dashboard/projects/page.tsx`, `selectedIds` state (line 50), filter/page controls (lines 481–483, 502, 516, 519–533, 622–626), `handleBulkAction` (lines 371–399), `BulkActionBar` mount (lines 632–639).
- **Interaction:** Select sites, then change folder, search/status/advanced filters, or page, then invoke a bulk action.
- **Handler/state/API:** Selection is stored in `selectedIds`; filter and pagination handlers reset `page` or change filter state but do not clear selection. `handleBulkAction` snapshots every ID in `selectedIds` and passes them to move/archive/unarchive/delete handling. The toolbar displays only `selectedIds.size`, not the selected site names or whether they are outside the current results.
- **Actual behavior:** IDs selected from a previous result set remain actionable after the result set changes. For archive/unarchive the full retained ID set reaches `sites.bulkAction`; for delete the count opens the confirmation path while retained IDs remain in state. The code does not communicate that selection spans pages/filters.
- **Expected behavior:** Make selection scope explicit. Either preserve cross-page selection with clear cross-result feedback, or clear/reconcile selection when the result set changes.
- **Root cause / affected modules:** Result-set state and bulk-selection state are independent; no filter/page transition reconciles them.
- **Recommendation:** Product decision: choose and encode page-local versus cross-result selection semantics, then align toolbar copy and reset behavior.
- **Status:** SOURCE VERIFIED; NOT RUNTIME VERIFIED; PRODUCT DECISION REQUIRED.

## Cross-audit overlaps and interaction checks

- **Auth continuation findings are duplicates of Audit 3, not new IDs.** Middleware redirects unauthenticated `/dashboard` requests to `/auth/login` without carrying the original pathname/query (`packages/dashboard/middleware.ts:109`); `/auth/login` forwards `returnUrl`/`next` only when those parameters reach it (`packages/dashboard/app/auth/login/page.tsx:7–18`). The browser redirect was already observed in the parent audit. The backup-code page preserves `remember` and `returnUrl` while entering 2FA (`packages/dashboard/app/auth/2fa/page.tsx:62–66`) and uses them to create the session and navigate after success (`packages/dashboard/app/auth/2fa/backup/page.tsx:25–38`), but its “Back to code” link reconstructs only `token` (`:62–66`). This confirms the source trace for existing `NAV-W01` and `NAV-W02`; it does not establish the successful 2FA destination at runtime.
- **Team member removal:** row and bulk remove/revoke actions pass through a confirmation modal before callbacks are invoked (`packages/dashboard/components/team/members-table.tsx:193–205, 227–244, 344–364`). Owner/current-user rows are excluded from bulk eligibility (`:217–225`) and ignored by row selection (`:246–250`). The callback dispatch and mutation result handling live in the team settings page; no destructive action was run.
- **Site deletion:** per-site and bulk deletion both route through `DeleteConfirmModal`, requiring the exact site name (`packages/dashboard/app/dashboard/projects/page.tsx:344–346, 386–389, 709–723`; `packages/dashboard/components/sites/delete-confirm-modal.tsx:16–36`). Archive/unarchive and folder move are separate bulk operations; publish/unpublish are deliberately absent from the bulk action bar (`packages/dashboard/app/dashboard/projects/page.tsx:390–397`; `packages/dashboard/components/sites/bulk-action-bar.tsx:12–21`).
- **Media pagination and destructive controls:** the “Load more assets” button increments the query limit by `PAGE_SIZE` and is disabled during fetch (`packages/dashboard/components/media/media-library.tsx:170–172, 354–359`). Asset and folder delete actions open their respective confirmation targets; successful mutations refetch data and close the modal, with explicit error toasts (`:79–82, :104–120`). No delete/upload was executed.
- **Keyboard search:** the Sites page binds `/` to focus its search field, skips the shortcut when focus is already in input/textarea/contenteditable, and unregisters the listener on unmount (`packages/dashboard/app/dashboard/projects/page.tsx:54–66`). This scope inspection found no competing `/` binding in the page itself; broader cross-app keyboard arbitration was outside this workspace-only pass.

## Coverage and handoff

- Inspected source paths for dashboard Sites selection, filters, pagination, bulk/single delete, Media clipboard/pagination/delete, team member removal, login continuation, and 2FA/backup navigation.
- No authenticated dashboard account/site fixture was available to exercise these controls here. No clipboard denial, mutation failure, destructive action, or 2FA success/failure was runtime verified.
- `INT-W01` is a small interaction feedback issue. `INT-W02` requires a product choice before implementation. Carry `NAV-W01`/`NAV-W02` forward as Audit 3 duplicates only.
- No production files or tests were modified.
