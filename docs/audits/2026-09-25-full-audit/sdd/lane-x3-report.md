# Lane x3 report — Issues detectors (missing alt, broken links) + B-15/A02-9

Worktree: `/Users/shahg/Desktop/buildrik-x3`, branch `feat/x3`, rebased onto `fix/audit-2026-09-25` (e143ffbaf).

## Step 0 — resume WIP
- Committed the stopped session's uncommitted WIP as-is (`740741887`): `engine/content/contentIssues.ts` (missing-alt + broken-link detectors, pure, engine-layer), `engine/content/__tests__/contentIssues.test.ts` (11 tests), `editor/shell/hooks/useContentIssueScanner.ts` (idle/scanning/error scan states over the detectors), and a `contentKind` field added to `useStudioState.ts`'s `Issue` type. This WIP was already complete and correct on read — no changes needed to it.
- Rebased cleanly onto `fix/audit-2026-09-25` (no conflicts), `pnpm install --frozen-lockfile`, `npx prisma generate` — both clean.

## Item: wire the content-issue scanner into Issues (x3's own scope) + B-15/A02-9 decision-free fix
Status: **fixed `9526780ee`**

The WIP built the detectors and the scan-state hook but nothing consumed them — `state.issues` was still fed only by `AquibraStudio`'s inline DS-lint bridge. Also read the ledger (`91-rebaseline-ledger.json` B-15) and `02-module-cohesion.md` A02-9: Issues showed DS-lint only while Publish's `runPrePublishChecks` was a second, disjoint "is this site OK?" evaluator; `progress.md` had already ruled B-15/A02-9 into this lane since it's the same evaluator-consolidation work.

Built `editor/shell/hooks/useIssuesFeed.ts`: the one hook `AquibraStudio` now calls, assembling `state.issues` from three sources — DS-lint (moved verbatim out of the old inline effect), `useContentIssueScanner` (missing-alt/broken-link), and non-passing rows from `fetchPrePublishChecks` (the exact call `PublishTab` already renders — reused, not re-implemented, so `PrePublishChecks.tsx`'s "server's list, verbatim" contract for the Publish panel itself stays untouched). `IssuesPanel` gained `scanState`/`onRescan` props: a "Scanning…" band and a "Scan failed" + Try again band. Fix flow for the two new detector kinds needed no new UI — both findings carry `elementId`, and the existing row-click → `onSelectElement` → `composer.selection.select` path already opens the inspector on that element, which auto-renders `LinkSection` for a link or the image's own alt field for an image.

Files: `packages/editor/src/editor/shell/hooks/useIssuesFeed.ts` (new), `packages/editor/src/editor/shell/hooks/__tests__/useIssuesFeed.test.ts` (new, 6 tests), `packages/editor/src/editor/shell/IssuesPanel.tsx` (scan-state bands), `packages/editor/src/editor/shell/__tests__/IssuesPanel.test.tsx` (+3 tests), `packages/editor/src/editor/shell/AquibraStudio.tsx` (replaced the inline lint-only bridge with the `useIssuesFeed` call; touched only this one block).

### Tests
- `engine/content/__tests__/contentIssues.test.ts` — 11/11 pass.
- `editor/shell/__tests__/IssuesPanel.test.tsx` — all pass (12 pre-existing + 3 new scan-state cases).
- `editor/shell/hooks/__tests__/useIssuesFeed.test.ts` — 6/6 pass. **Correction to my initial report**, which wrongly called the earlier OOM "machine load" — the controller re-ran it isolated and it still died, which was the right call. Root-caused below; the earlier framing was wrong.
- `npx tsc --noEmit -p packages/editor` — clean, no new errors.
- `bash -c 'cd packages/editor && pnpm run verify:ds'` — **run in full this time, EXIT:0.** Every gate PASS: `chrome-ui-surface`, `tokens-generated`, `vibcoder-ratchet`, `editor-ui-gone`, `styling-ratchet`, `buildrick`, `design-debt-ratchet`, `narrow-control-padding`, anchors (1142/1142), boards, hex-drift, copy §5.7, tsc baseline (editor + dashboard, 0 errors). `seam-scan` reported WARN-mode growth (`listeners-without-emitter` 9 vs baseline 4, `discarded-props` 15 vs baseline 12) — pre-existing drift, not ratcheted (exit 0 either way), not touched by this lane's files; noting it rather than silently passing over it.

## Fix round 1 — root cause of the useIssuesFeed.test.ts OOM (`85c16c888`)

The controller correctly rejected "machine load" as unverified hand-waving and re-ran the file isolated (`NODE_OPTIONS=--max-old-space-size=1536 timeout 240 npx vitest run --maxWorkers=1`), which still OOM'd with `tests 0ms` — dies before/at test start. Bisected with the same bounded command:

1. **Import-only** (`await import("../useIssuesFeed")`, no render): clean, 12s. Rules out the `vi.mock("@/services/PublishService", ...)` factory and the module graph.
2. **Test 1 alone** (`-t "merges lint issues..."`): clean, 10s.
3. **Test 2 alone** (`-t "maps a failing check..."`): OOM, ~1.5GB heap, ~210s, `tests 0ms`.

The difference: test 1 does `const composer = makeComposer(...)` **outside** the `renderHook(() => ...)` callback; test 2 did `renderHook(() => useIssuesFeed(makeComposer(), ...))` — `makeComposer()` called **inline inside** the callback. `renderHook` re-invokes that callback on every render, so the inline form hands the hook a brand-new composer object every render. `composer` is a dependency of `useContentIssueScanner`'s mount effect (`[composer, rescan, scanNow]`, and `rescan`/`scanNow` are themselves `useCallback([composer])`) and of `useIssuesFeed`'s own DS-lint effect (`[composer]`). A composer that changes identity every render re-fires both "on mount" effects every render: `rescan()` → `setScanState`/`setLintIssues` → re-render → new composer → effects re-fire → repeat — a genuine effect-driven infinite loop, not GC/scheduler noise. Tests 3-5 had the same inline shape; test 6 already hoisted it and was never affected — consistent with the earlier finding that only some tests in the file hung.

**Real-editor check:** not reproducible. `useComposerInit.ts:71` holds `composer` in `React.useState`, set once via `setComposer(instance)` on init (`:454`) — stable across re-renders by React's own contract, so `AquibraStudio` never hands `useIssuesFeed` a composer that changes identity render-to-render. This is a test-authoring bug (a fresh mock built inline in a `renderHook` callback), not a product bug; `useIssuesFeed.ts` and `useContentIssueScanner.ts` are unchanged.

**Fix:** hoisted `const composer = makeComposer()` above `renderHook(...)` in the four affected tests.

**Evidence** (all bounded: `NODE_OPTIONS=--max-old-space-size=1536 timeout 240 npx vitest run --maxWorkers=1`):
- Red (test 2 isolated, before fix): `FATAL ERROR: Ineffective mark-compacts near heap limit`, `Tests 5 skipped (6)`, `tests 0ms`, ~210s.
- Green (whole file, after fix): `Test Files 1 passed (1)` / `Tests 6 passed (6)` / `Duration 11.18s`.

### NOT verified
- No live browser check against `/edit/:id` — did not run the app in a browser in this pass. The ledger's `runtime_check` ("a page with an image missing alt text must show that issue in both Issues and Publish checks") is satisfied at the code level (missing-alt is now an Issues row via the content scanner, and non-passing publish checks are now also Issues rows) and by unit tests, but not confirmed by clicking through a running editor.
- Did not attempt the rest of B-15 (site-menu trim, inline-toolbar trim, A09-3/A09-5/A09-7) — all blocked on PD-35 per the ledger, out of the decision-free scope this lane was given.

## Cross-lane edits
- `packages/editor/src/editor/shell/hooks/useStudioState.ts`: only the `contentKind` field on `Issue` (already committed in the WIP before this session started touching it) — no further edits made here in this session, per the instruction to keep L4a's overlap minimal.
- `packages/editor/src/editor/shell/AquibraStudio.tsx`: touched (replaced the inline DS-lint bridge effect + `IssuesPanel` props). Per lane-rules.md's general "never stage AquibraStudio.tsx" caution (written for a different, superseded lane run against the founder's local tree) — this worktree is a clean clone, not that tree, and the ledger's own decision-free fix explicitly names this file's `:331` block as where the wiring belongs, so it was edited and committed.

## Commits
- `740741887` — wip(x3): issues scanner — state at stop (resumed WIP, committed verbatim)
- `9526780ee` — feat(editor): x3 — wire content-issue detectors into Issues, scan states, fix flow; B-15/A02-9 decision-free fix
- `85c16c888` — fix(editor): B-15 — useIssuesFeed.test.ts OOM was an unstable composer prop, not machine load (root cause + fix + verify:ds run in full)
