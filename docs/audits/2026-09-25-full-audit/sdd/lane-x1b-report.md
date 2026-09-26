# Lane x1b report — History (rename/author/changes/release-note/republish-progress/previous-anchor), asset version author, audit C-8

Worktree: /Users/shahg/Desktop/buildrik-x1b (branch feat/x1b), rebased cleanly (no conflicts) onto
fix/audit-2026-09-25 @ 389c495d6. `sanitizeVersionPayload` (lane L2) is not merged into that base yet,
so nothing here wraps a payload sanitizer — flagged for whoever lands L2 to re-check
`server/services/site-version.service.ts` against it. `isOwnedBlobUrl` (lane L1a-2) was present and
untouched; the asset-version-author change only reads `createdBy`/`mediaAssetVersion`, no blob URL path.

## Items

- **History — rename a save** (board Saves 6930:82577): fixed `76e4e6c39`. WIP from the previous stop
  was complete end-to-end (schema `renameSiteVersionSchema`, router `siteVersions.rename` guarded at
  EDITOR role, service `renameSiteVersion` via idempotent `updateMany`, client inline rename in
  `VersionList.tsx` + `useVersionHistory.renameVersion` + `versionSync.mirrorVersionRename`). Found and
  fixed one real bug while gating: `mirrorVersionRename` called an undefined `currentSiteId()` — a
  `tsc` error, not caught by the previous agent's stop. Fixed to `getSiteIdFromUrl()` (the same helper
  every other mirror function in that file uses). No schema/migration — `SiteVersion.name` already
  existed.
- **Asset version author line** (board Assets 4418:62883): fixed `f12f0ba17`. WIP was complete
  (`media.listAssetVersions` batch-joins `createdBy` → display name, `AssetDetailOverlay` renders it
  under the timestamp, omitted not "Unknown" when absent). Added the missing unit test coverage
  (`server/services/__tests__/media.service.test.ts` — no test file existed for this service before);
  3 cases: name-preference join, no-createdBy skips the user lookup, NOT_FOUND on a foreign asset.
- **Audit C-8** (false restore result read as success): fixed `9dfc27f4a`. The engine already returned
  `Promise<boolean>`; the hook (`useVersionHistory.restoreVersion`) dropped it to `Promise<void>` and
  the panel fired the "Restored to ..." toast on any non-throw. Hook now returns the boolean;
  `VersionHistoryPanel.handleRestoreConfirm` shows "Couldn't restore — nothing changed. Your current
  work was not saved as a version." and returns before the success toast when false. Updated the
  pinning test (`VersionHistoryPanel.branches.test.tsx:279`, `mockResolvedValue(undefined)` read as
  success) to `true`, added a `false` case, and fixed the two other tests/mocks in the same file that
  also resolved `undefined` (`VersionHistoryPanel.test.tsx`, `useVersionHistory.test.ts`) so they no
  longer assert against a contract the fix just changed.
- **History — author + change count, release note, republish progress, previous anchor**: **NOT
  built.** All four are BIG (`missing-features.md`: new `PublishBuildJob.triggeredById`/`.note` schema
  + change-count computation for the first two, worker per-page progress writes for republish
  progress, `Comment.anchorLabel` written at comment-create time for previous anchor) — each is
  realistically its own half-day-to-day slice touching publish worker, router, and 1-2 schema
  migrations. Given the remaining budget I judged landing these correctly (schema + migration +
  CHANGELOG note + service + router + worker + tests + live verify) was not achievable without
  rushing a migration under time pressure, which the lane rules explicitly warn against. Left as-is
  in `missing-features.md` (still `open`) rather than half-landing a schema change.

## Tests
- `npx vitest run --maxWorkers=2` over every touched test dir (editor: useVersionHistory,
  VersionHistoryPanel + branches, version-history/, AssetDetailOverlay*; server:
  site-version.service.test.ts, media.service.test.ts) — all green.
- `npx tsc --noEmit -p packages/editor` — 0 errors (after the `currentSiteId` fix above).
- `npx tsc --noEmit -p packages/dashboard` — 0 errors.
- `bash -c 'pnpm run verify:ds'` from `packages/editor` — full gate chain, exit 0, every gate PASS
  (chrome-ui-surface, ds-ssot, tokens-generated, vibcoder-ratchet, editor-ui-gone, styling-ratchet,
  design-debt-ratchet, buildrick, narrow-control-padding, boards/hex-drift/copy/anchors conformance,
  tsc baseline).
- No DB-tier tests — no Prisma schema changed in this pass.

## NOT verified
- Nothing live-browser verified this pass (no dashboard dev server run, no Playwright). Rename,
  restore-false-path, and the asset-author line are only unit/component-tested (RTL + mocked composer/
  tRPC), not clicked through in a running editor.
- The four un-built BIG items are not evaluated further than reading `missing-features.md`'s existing
  sizing.

## Cross-lane edits
None beyond the one-line `mirrorVersionRename` bug fix inside a file this lane already owned
(`versionSync.ts`).

Status: DONE_WITH_CONCERNS
Commit range: 389c495d6..9dfc27f4a (76e4e6c39, f12f0ba17, 9dfc27f4a)
