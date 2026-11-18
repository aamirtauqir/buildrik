# Verification log

Date: 2026-09-25. Baseline: `69a88e0b145dc4e52ff0fdf3578391b448c514ac` with pre-existing working changes retained.

## V-001: existing ownership and panel tests

Working directory: `packages/editor`.

```sh
npx vitest run \
  src/editor/shell/hooks/__tests__/useStudioState.test.ts \
  src/editor/shell/hooks/__tests__/panelStateMigration.test.ts \
  src/editor/shell/__tests__/StudioPanels.openRequests.test.ts \
  src/editor/shell/__tests__/StudioPanels.projectId.test.ts \
  src/editor/sidebar/__tests__/TabRouter.mapping.test.tsx \
  src/editor/sidebar/__tests__/TabRouter.ai.test.tsx \
  src/editor/sidebar/shared/__tests__/usePanelNavigation.test.ts
```

Result: **7 files passed, 82 tests passed**, Vitest 4.1.2, reported duration 7.43 seconds. No production or test files were edited for this run.

What this establishes: existing panel state, migration, navigation-hook and router expectations pass in the configured test environment at this checkpoint.

Limits: some tests assert source text, and the AI router test mocks AITab. These do not verify the complete shell event chain or disprove competing AI ownership. jsdom execution is not a browser walkthrough, real backend/persistence verification, or collaboration test.

## V-002: repository discovery

Working directory: repository root.

```sh
rg --files --hidden \
  -g '!node_modules' -g '!.git' -g '!.next' -g '!dist' \
  -g '!coverage' -g '!playwright-report' -g '!test-results' \
  -g '!packages/editor/docs/audit-2026-09-25/**'
```

Result: 7,423 paths, sorted into `repository-files.txt`. This includes discoverable non-ignored untracked files; it is deliberately different from the tracked-file census in `INVENTORY.md`.

Snapshot counts: dashboard 429; editor 4,486; shared 41; server 190; Prisma 59; root lib 42; root tests 92; root scripts 277; root docs 1,598; archive 101. Other root/config/auxiliary paths make up the remainder.

Limits: filenames only. Ignored files and generated/dependency/cache directories are not content-audited. Environment secrets were not read. A count does not imply a complete source inspection or behavioral coverage.

## V-003: report and manifest integrity

At the initial inventory checkpoint, read-only Node validation checked all 7,423 manifest paths against the repository: zero missing paths and zero duplicates. The workspace inventory specialist also checked 57 full source file/line references against current file lengths. This historical snapshot covered the reports present then; it is not a validation of each subsequently added source citation.

The lead independently re-read the complete AI dispatch/mount chain and the sharing menu/modal/public route/destination helper before retaining IA-001 and IA-002 as static findings. Review-placement findings were deduplicated into one product decision in `README.md`.

## V-004: alt-text ownership baseline

`npx vitest run src/services/__tests__/AltTextService.test.ts src/editor/media/components/__tests__/AssetDetailsPanel.altText.test.tsx`

Result: **2 files passed, 18 tests passed**, 5.92 seconds. Mocked service/component coverage does not establish that Quick Assets uses the full-library contract; COH-01 remains a source finding. No provider call was made.

## V-005: navigation and site-menu baseline

`npx vitest run src/editor/shell/hooks/__tests__/useDeepLink.test.ts src/editor/shell/hooks/__tests__/panelOpenAllowlist.test.ts src/editor/shell/__tests__/SiteMenu.publishDoor.test.tsx src/editor/shell/__tests__/SiteMenu.kbd.test.tsx src/editor/shell/__tests__/SiteMenu.unpublish.test.tsx`

Result: **5 files passed, 29 tests passed**, 12.98 seconds. These do not exercise every shell return or hidden-panel keyboard path; see runtime findings R4/R5.

## V-006: search regression baseline

`npx vitest run src/editor/shell/modals/__tests__/CommandPalette.test.tsx src/editor/panels/layers/hooks/__tests__/useLayerSearch.test.tsx src/editor/sidebar/tabs/build/hooks/__tests__/useBuildTab.search.test.ts src/editor/sidebar/tabs/settings/__tests__/searchIndex.test.ts`

Result: **3 files passed, 1 failed; 71 tests passed, 3 failed**, 12.02 seconds. Failures are in the shell CommandPalette suite: two assertions expect 21 hardcoded commands but the current implementation returns 23; one searches for the old “Open Insert panel” label while the registry renders “Open Add panel”. Source inspection identifies the two additional explicit template-layout and keyboard-help actions at CommandPalette.tsx:163. No production or test code was changed, so these are baseline test/implementation expectation mismatches, not audit regressions. They must be reconciled with the approved command contract, not hidden by simply updating numeric pins.

## V-007: limited browser evidence

[Runtime scenarios and screenshots](phase-1/runtime-evidence.md) record local demo UI checks and unauthenticated dashboard redirects. Several original IA/navigation findings now have demo runtime evidence. Full Media fails to compile because LibraryManager.tsx:870 already contained a staged merge marker when this audit began. No full build is claimed. Authenticated flows and multi-user behavior remain unexecuted.

## Pending verification

- Remaining browser scenarios not explicitly recorded in the runtime log.
- Authenticated dashboard/editor/API and database round trips.
- Two-user collaboration, reconnect/offline, permission changes, undo and publish concurrency.
- Full test suites, production build, lint/type/design checks for future approved changes.
- Phase 2 visual/accessibility verification and phase 5 release gate.

## V-008: audit-report links

Read-only Node validation walked all current Markdown files under `docs/audit-2026-09-25/` and resolved every relative Markdown link. Result: **29 Markdown reports, zero broken relative links**. This checks link targets, not source claims.

## V-009: production diff preservation

Compared the current `git diff --binary && git diff --cached --binary` output with the snapshot captured at the start of this audit. They are byte-identical. The audit made no production/source/test edits and preserved all pre-existing staged changes.

No production fix is claimed, and no release readiness conclusion is made. Static findings are **NOT RUNTIME VERIFIED** unless a specific runtime entry supersedes that status. Earlier checkpoint wording is historical, not a blanket pass for later checks.
