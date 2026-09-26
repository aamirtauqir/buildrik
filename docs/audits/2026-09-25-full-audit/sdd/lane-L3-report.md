# Lane L3 report — editor save/sync integrity

Worktree `/Users/shahg/Desktop/buildrik-af-L3`, branch `fix/audit-L3`, base `e143ffbaf`.

## A-2 — fixed `f78f7199a`
- Server: `saveProjectData` CAS is `tx.site.updateMany({ where: { id, deletedAt: null, lastEditedAt: expected } })` FIRST in the transaction; count 0 → `SAVE_CONFLICT:<server iso>` (or `SITE_NOT_FOUND` if deleted meanwhile); page writes roll back. Token stays optional (omitted = unchecked, non-regressive).
- Deleted the unused `sites.saveProjectData` router door + its `check-trpc-orphans.mjs` allowlist row (cross-lane edit, 1 line).
- Client: single-flight + rebase were already in (e4161a612). New conflict hold: `isSaveConflictPending()` set on SAVE_CONFLICT, cleared by `setBaselineLastEditedAt` (Overwrite) or `loadProject`; autosave sends nothing while it stands (PD-11). The standing "banner" is the existing amber "Conflict — reload" save pill (re-opens the dialog) — no new banner component was added (AquibraStudio is not lane-owned).
- Tests: `__tests__/db/save-race.db.test.ts` flipped `it.fails` → `it` (+ page row holds only the winner); `sites-save-project`, `save-project-empty-snapshot`, `sites-service.dsSchemaVersion` mocks moved to `updateMany`; new CAS unit tests; provider "5 rapid saves vs slow CAS server → 0 self-conflicts" (Review Focus 2) and conflict-hold tests; `useComposerInit.loadFlow` "no autosave while conflict pending, resumes after".
- NOT verified: browser two-tab walk (conflict modal once, no further autosave POSTs until resolved).

## A-1 — fixed `dedbb6ee0`
- Mirror baseline captured at load; after a successful save only changed Site-column fields are sent (then the baseline advances); conflict throws before the mirror; skipped when the known role is below ADMIN (unknown role still sends — server decides).
- Tests: routing test renamed "after the project save"; new: starts only after the save resolves, conflict → no settings call, untouched field not sent (and re-save sends nothing), EDITOR skip.
- Server optional step (expectedLastEditedAt on settings.update / bump lastEditedAt) NOT done.
- NOT verified: runtime_check (tab B dashboard SEO edit survives tab A autosave; EDITOR sees no mirror toast; Network shows no siteDetail.settings.update when unchanged).

## A-4 — fixed `9a9953272` (partial: toast-Undo part not done)
- History snapshots = tree + styles + CMS bindings + designTokens/designTokensSchemaVersion/designPresets. Restore goes through `importScoped` (snapshot tokens replace live tokens; other settings + metadata stay live). Covers undo, redo, restoreEntry, applyRemoteOperation. Version restore untouched.
- Tests: `engine/__tests__/HistoryManager.undoScope.test.ts` (real Composer): settings survive undo, rename survives undo, tokens still undoable. 2/3 fail on old code.
- Left: toast "Undo" should undo its own entry (editActions.ts / useCanvasKeyboard.ts — L4a/L6 files).
- NOT verified: browser Cmd+Z after SEO save / rename.

## C-3 — fixed `f7535ac1f`
- `publishInputSchema.expectedLastEditedAt` (optional) → `sites.publish` → `startPublish(opts.expectedLastEditedAt)`; refuses `SAVE_CONFLICT:<iso>` before creating a job; router maps to CONFLICT.
- Editor: `publishSite` sends `settledBaselineLastEditedAt()` (awaits in-flight saves first); a refusal goes through `raiseSaveConflict` (same helper the save path uses) → hold + ConflictModal. `LifecycleInput.saveConflict` blocks Publish ("Resolve the sync conflict before publishing").
- Cross-lane edits: `server/services/publish.service.ts` (opts field + 8-line check; L1b), `services/PublishService.ts`, `shell/hooks/useLifecycle.ts`, `shell/AquibraStudio.tsx` (1 line: `saveConflict: state.saveState.status === "conflict"`).
- Tests: `__tests__/db/publish-freshness.db.test.ts` (stale refused, 0 PublishBuildJob rows; current token passes the gate); PublishService token/settle/conflict; lifecycle blocker row; useLifecycle fixture.
- NOT verified: browser runtime_check (B's Publish disabled via getComputedStyle/aria-disabled; console publish with old token → CONFLICT).

## B-7 (ConflictModal part) — fixed `f99708454`
- ConflictModal mounts through chrome-ui `OverlayMount` (portal, focus trap, Escape) with `dismissOnScrimClick={false}` and `labelledBy` → the ModalTitle; focus lands on "Reload latest"; ModalContent/Title/Body/Footer + `--bk-*` tokens replace the inline hex. Used OverlayMount directly (not ModalRoot) because ModalRoot does not forward `labelledBy` (ModalParts is L4b's; A13-4).
- z-index is now OverlayMount's `tw:z-50` (was 2147483646) — check against the Preview overlay in Phase 2.
- Tests: pinned "clicking the backdrop closes" replaced; new focus-in/Tab-cycle, named-dialog-node tests.
- NOT verified: live focus/Tab/scrim walk.

## C-1 + D-3 — fixed `43efe5da8` — **must merge AFTER L1b's S-8**
- `aiTrpcClient.summarize()` / `suggestMilestone()` on the existing superjson client; both hooks use it (no raw `fetch("/api/trpc` left in editor source). `versionName: version.name || "Untitled"`; milestone `retries: 0` + console.warn.
- Tests: hook tests mock the client; `AiTrpcClient.wire.test.ts` (real batched superjson request/response); `server/trpc/routers/__tests__/ai-summary-transport.test.ts` (real ai router behind fetchRequestHandler: 200 both, 400 for the old plain-JSON POST). That test mocks `quota.service`; if S-8 adds other deps to those procedures, extend the mocks at merge.
- Left (D-3): fold AiTrpcClient's client into api-client's singleton; eslint ban on `fetch("/api/trpc` (L6's eslint.config.mjs).
- NOT verified: live summary with OPENAI_API_KEY.

## C-8 — moved to x1b (skipped per brief)

## C-9 (A15-9) — fixed `5f38071dc` (partial)
- Both save paths keep the refused work (`keepUnsaved`) and call new `RoleService.invalidateMyRole()` on FORBIDDEN. The manual path's old "forbidden keeps nothing" rule is reversed (role can come back).
- Cross-lane edit: `services/RoleService.ts` (+`invalidateMyRole`).
- Left: pushing the re-fetched role into the shell so chrome drops to read-only immediately (useEditorRole reads once on mount; not lane-owned). A14-19(c) link-audit path and A14-14(b) scheduled-publish not touched (not in L3 brief row).
- Tests: pinned `useSaveCallback` "FORBIDDEN keeps nothing" flipped; new autosave FORBIDDEN test (`useComposerInit.offline`).
- NOT verified: demote-mid-session browser walk.

## C-4 — fixed `48ca6e2b7` (partial: client half)
- CMS + component hydrate server-first by `updatedAt` (missing or newer-on-server written; every collection's entries re-read); rows with a queued upsert/delete mirror skipped (new `SyncRetryQueue.isPending`); nothing deleted locally. Component hydrate status + "Couldn't load your shared components" toast with Retry (`useComponentSync`).
- Cross-lane edits: `services/syncRetryQueue.ts` (+isPending), `shell/hooks/useComponentSync.ts` (toast).
- Left: server resurrection guard (`expectedUpdatedAt` in cms.service / site-component.service — L1b/L2 files), versionSync additive filter, site variables in localStorage (A01-5).
- Tests: pinned `cmsSync.test.ts:293` and `componentSync.test.ts:86` rewritten; new newer/older, queued-entry, component error-status tests.
- NOT verified: two-browser CMS walk.

## A-3 — fixed `da6f303a1`
- theme.service capture/push/preview/snapshot/rollback/presets now use `projectSettings.designTokens` (+designPresets) as a `TokenTheme`; push merges into projectSettings (other settings kept, projectStyles never written, lastEditedAt bumped); legacy projectStyles-shaped shared theme/preset refused; legacy snapshot rollback still restores projectStyles. No schema change.
- Deviation from brief: Push is NOT hidden in the dashboard — with the re-point it no longer destroys element styles and the ledger runtime_check pushes A→B. There is no Apply-preset UI to hide (theme.presets.* are allowlisted orphans). Controller: hide it if you want belt-and-braces.
- Pre-existing oddity kept: push/rollback bump `dsSchemaVersion` (the editor's migration version) to force a reload — worth a look.
- Tests: pins :106, :122, :166, :191, :220, :254, :263 rewritten; new legacy-refusal / keeps-other-settings / legacy-rollback tests.
- NOT verified: agency push walk (DB projectStyles unchanged, designTokens changed).

## D-4 — fixed `6a3a78790`
- `TokenRegistryProvider` renders a headless hydrator: mount + PROJECT_LOADED → `resetAllKinds(mergeProjectTokens(...))`; never SETTINGS_CHANGE; skipped while color/type/spacing hold staged edits.
- Note: PROJECT_LOADED also fires on undo/redo (importProject); the staged-edit guard covers Brand's case.
- Tests: `TokenRegistryContext.projectHydrate.test.tsx`.
- NOT verified: cold-profile Issues count before/after opening Brand.

## D-8 — not attempted (stretch). Several rows above are partial, and context budget was reserved for the gate.

## Cross-lane edits (summary)
`packages/dashboard/scripts/check-trpc-orphans.mjs` (removed dead row), `server/services/publish.service.ts` (C-3 opts + check; L1b), `packages/shared/schemas/publish.ts` (C-3 field), `services/PublishService.ts`, `services/RoleService.ts`, `services/syncRetryQueue.ts`, `shell/hooks/useLifecycle.ts`, `shell/hooks/useComponentSync.ts`, `shell/AquibraStudio.tsx` (1 line, lane worktree only).
`sites.service.ts`: only `saveProjectData` changed (listSites untouched).

## Findings outside scope
- `node packages/dashboard/scripts/check-trpc-orphans.mjs` fails on `ai.page` (no caller, no allowlist reason) — pre-existing, not L3.
- `BrandWorkspace.pages.test.tsx` "dirty: the discard guard…" timed out once under full-suite load, green on rerun (flake under load).

## Gate
- DB tier: `pnpm test:db` → 2 files, 3 tests pass.
- Root: `npx vitest run` over `__tests__/sites-save-project|save-project-empty-snapshot|sites-service.dsSchemaVersion`, `server/services/__tests__`, `server/trpc/routers/__tests__`, `packages/shared` → 97 files / 766 tests pass.
- Editor touched tests (`--maxWorkers=2`, per the resource rule): 20 files / 306 tests pass. Earlier (before the rule) wider runs: engine+design-system 3012 pass (1 load flake), services+shell+publish 1247 pass.
- tsc: `npx tsc --noEmit -p packages/dashboard` → 0 errors; `-p packages/editor` → 0 errors (run once at end, after all commits).
- `pnpm run verify:ds` (in packages/editor): first run failed on check-anchors — recipe `shell-state-11-saving-conflict.json` named the removed `conflict-scrim`; re-pointed to `overlay-scrim` in `a follow-up commit (B-7)`. Rerun: exit 0.

---
## Fix round 1 (controller review) — commits 46ca700ef..6275f3ec0

| Finding | Commit | Change | Tests |
|---|---|---|---|
| IMPORTANT 1 publish-raised conflict | `e734ae5ea` | useComposerInit listens for SAVE_CONFLICT_EVENT (any source) → saveState "conflict"; the autosave hold branch sets "conflict" and keepUnsaved()s the held edit | loadFlow: publish-raised conflict → chip conflict, lifecycle blocker "Resolve the sync conflict…", held edit in `bk-unsaved-v1-*`, no save sent |
| IMPORTANT 2 C-4 clocks | `dcf98c7cc` | Persisted server stamps (`bk-sync-stamps-v1`, syncRetryQueue.ts): per row {server updatedAt at last confirmation, local updatedAt then}. Recorded on every successful upsert mirror and every hydrate write. `serverCopyWins`: no local → server; no stamp → keep local; local changed since stamp → keep local; else server only if its updatedAt passed the stamp. siteComponents.upsert returns `updatedAt` (cross-lane one-liner, site-component.service.ts). Rows hydrated before this change have no stamp → local-first until next successful mirror. | cmsSync: clock ahead, clock behind, no-stamp kept, mirror stamps, queued entry kept; componentSync stamp matrix + clock-ahead |
| M1 | `a9d3c65c3` | hold stores the server token; saveProjectNow refuses with that SaveConflictError (re-raises dialog) while it stands | provider: queued save behind a refused one not sent; sent after Overwrite |
| M2 | `6c1141fbe` | `expectedLastEditedAt: z.string().datetime().nullish()` in editorSaveProjectSchema + publishInputSchema | shared sites.test: ISO/null/absent ok, garbage refused (both schemas) |
| M3 | `11f58be65` | push per site = interactive tx: updateMany where lastEditedAt = value read (count 0 → that site "failed: changed while pushing", no snapshot), then snapshot; snapshot records tokens + presets exactly (also token-less sites); rollback restores exactly (removes presets the push added) | theme.service: CAS where + raced site fails w/o snapshot; rollback to no-presets; snapshot keeps presets |
| M4 | `66c6160b3` | hydrator resets on an empty/absent token list (→ seed) | projectHydrate: cleared tokens + project:loaded → DEFAULT color-primary |
| M6 | `72caf859e` | alias imports in ai-summary-transport.test; typed `withSettings()` instead of `as any` (0 `as any` added lane-wide) | — |
| M7 | `6275f3ec0` | General / SEO / Custom code screens: known role below ADMIN → disabled fieldset + "Only admins can change site settings", no Save footer; unknown role stays editable | SettingsTab: EDITOR read-only w/ text + no Save; ADMIN editable |

Commands / output:
- `npx vitest run --maxWorkers=2` over the 13 editor test files touched this round + PublishService + autofix-history → 14 files / 223 pass.
- Root: sites-save-project, shared sites.test, theme.service, ai-summary-transport, site-limit-message, site-component.service → 6 files / 66 pass.
- `pnpm test:db` → 2 files / 3 pass.
- `tsc --noEmit` dashboard 0 errors, editor 0 errors (once).
- `pnpm run verify:ds` (packages/editor) → exit 0.

Not verified (browser, Phase 2): publish-conflict pill/blocker live; two-browser CMS reconcile across a reload; M7 as an EDITOR member; theme push race.
Merge note honoured: my hunk before `startPublish` in routers/sites.ts is unchanged this round (only the opts arg + SAVE_CONFLICT mapping from C-3).

---
## Fix round 2 (scoped re-review) — commits 53456545b..cbaa31ff1 (8 commits)

| Finding | Commit | Change | Tests |
|---|---|---|---|
| IMPORTANT 1 Reload resurrects the behind copy | `53456545b` (+ `probe` follow-up) | New `discardUnsaved(siteId)` (unsavedRecovery.ts): clears `bk-unsaved-v1-<site>` AND latches `keepUnsaved` off for that site for the rest of the page, so a debounced autosave still in the conflict hold that fires between the click and the unload cannot write it back. ConflictModal takes `siteId` and calls it before Reload latest and Save a backup; Overwrite keeps the copy. AquibraStudio passes `getSiteIdFromUrl()` (1-line cross-lane edit); e2e probe passes `siteId={null}`. | ConflictModal: Reload clears before onReload runs; Backup clears; Overwrite keeps; keepUnsaved after the choice is a no-op for that site, another site unaffected |
| IMPORTANT 2 M7 over-locks | `d1821ad4b` | Whole-screen fieldset removed. `SITE_COLUMN_FIELDS` exported next to `extractSiteColumnPatch` (now exported); `siteColumnFields.test.ts` pins them together (a Proxy records every field the function reads = the list; each listed field alone reaches the patch). `SiteColumnsLockedContext` + `SiteColumnGate` in settings/shared.tsx: disabled fieldset around the one control + "Only admins can change this" under it. `Field siteColumn=`, CodeCard `siteColumn=`, SEO indexing switch gated directly; typed `SiteColumnField`. SettingsTab provides the context (known role < ADMIN) and draws the Save footer again. Now editable for EDITOR: Author, SEO Twitter handle, Global CSS. | SettingsTab: EDITOR General — Site name locked + reason, Author edits and Save appears; ADMIN all editable; unknown role editable. Screens: SEO locks title/description/OG/indexing not Twitter handle; Custom code locks head/body not Global CSS; General locks name/favicon/language/social not Author |
| IMPORTANT 3 C-4 permanent hide | `7603f0cdc` | (i) One-time pass: `serverCopyWins(..., firstPass)` falls back to the old updatedAt comparison for an unstamped row only while `stampMigrationDue("<cms|component>:<siteId>")`; a winning server copy is written + stamped; marker (`bk-sync-stamp-migrations-v1`) written after the hydrate got through (also when the server has no rows). After it, no stamp = local. **Deviation:** marker is per domain+site, not "`bk-sync-stamps-v1` absent" — CMS and component hydrates run side by side (the first stamp either writes would end the other's pass), stamps are browser-wide while a hydrate sees one site, and a failed hydrate must redo the pass. (ii) Adoption: unstamped local row with `sameContent` (JSON round trip + key-order-free deepEqual) to the server copy is stamped without a write. Entries compare data+status, collections all but timestamps, components one get per unstamped row (reused when the server wins). | cmsSync: first pass takes older unstamped entry + writes marker; keeps newer unstamped; post-pass differing stays local; equal entry adopted then later edit arrives; equal collection adopted. componentSync: first pass one get + stamp + marker; equal master adopted then next edit arrives; differing stays local. Pinned no-stamp tests run post-pass |
| Also: mirror `.then(row)` guard | `c564cb19e` | `if (row?.updatedAt) recordServerStamp(...)` in the collection/entry/component upsert mirrors — a no-row answer was a TypeError → queued "failure" forever | cmsSync + componentSync: upsert resolving undefined → no error event, 0 pending, no stamp |
| Also: rollbackSiteTheme CAS | `45dd5f210` | Interactive tx: `updateMany where { id, lastEditedAt: read }`; count 0 → `ThemeError("CONFLICT", "This site changed while rolling back — nothing was changed. Try again.")`, snapshot delete in the same tx (kept on failure). New ThemeError code CONFLICT → tRPC CONFLICT in routers/theme.ts | theme.service: where carries lastEditedAt; lost race → CONFLICT, no delete, no blind update; 3 pinned rollback tests → updateMany |
| M6 | `8092f84f0` | `@/editor/design-system/constants` alias | — |
| Minor doc | `48c25d517` | isSaveConflictPending comment: manual save is refused while held | — |

Commands / output:
- `npx vitest run --maxWorkers=2` (packages/editor) over ConflictModal, siteColumnFields, cmsSync, componentSync, syncRetryQueue, buildrik-sync-provider, `src/editor/sidebar/tabs/settings`, TokenRegistryContext.projectHydrate, useComposerInit.loadFlow/.offline, useSaveCallback → 40 files / 603 pass.
- Root: `npx vitest run --maxWorkers=2 server/services/__tests__/theme.service.test.ts` → 30 pass (earlier also `server/trpc/routers/__tests__` → 28 files / 175 pass with it).
- `npx tsc --noEmit -p packages/editor` → 0 errors (first run caught the probe's missing `siteId`, fixed); `-p packages/dashboard` → 0 errors.
- `pnpm run verify:ds` (packages/editor, bash -c) → exit 0.
- `pnpm test:db` not re-run (no DB-tier change this round).

Cross-lane edits this round: `shell/AquibraStudio.tsx` (1 line `siteId=`), `e2e/probe/probe.tsx` (1 prop), `server/trpc/routers/theme.ts` (CONFLICT mapping).

Not verified (browser, Phase 2): two-tab conflict → Reload latest → no "Some work never reached the server" offer after reload; Settings as an EDITOR member (per-field locks, Author/Global CSS save); two-browser CMS reconcile for a pre-stamp row across reload; theme rollback racing an editor save.
Deferred per brief: stamp map pruning/O(n²)/quota, legacy {designTokens: []} snapshots, re-queue diverged stamped rows, demo-token reset on empty designTokens. Known edge: a diverged unstamped component costs one `get` on every hydrate until it is mirrored (adoption only stamps when equal).

---
## Fix round 3 — commits 06d4ef663..644610a01 (2 commits)

| Finding | Commit | Change | Tests |
|---|---|---|---|
| IMPORTANT queued mirror ended the one-time pass early | `06d4ef663` | cmsSync: a queued collection UPSERT skips only the collection write; its entries still reconcile. A queued collection DELETE still skips the whole collection. cmsSync + componentSync: `markStampMigrationDone` runs only when no row was skipped for a queued mirror (`skippedQueued`), so the pass re-runs on the next hydrate | cmsSync: queued collection upsert → collection not written, its older unstamped entry takes the teammate copy on the first pass, scope stays due, marked once the queue drains. componentSync: master skipped for a queued mirror → scope due, marked after retry |
| MINOR discard latch outlives a cancelled reload | `644610a01` | `resumeKeepingUnsaved()` (unsavedRecovery) lifts the latch; called on confirmed Overwrite (ConflictModal) and in `announceConflict` (every new refusal and the held re-raise). Clears all latches, since one site is open per page | ConflictModal: Reload then Overwrite → keepUnsaved works again; Reload then a raised SAVE_CONFLICT → keepUnsaved works again |

Commands / output:
- `npx vitest run --maxWorkers=2` cmsSync + componentSync + syncRetryQueue → 3 files / 71 pass.
- `npx vitest run --maxWorkers=2` ConflictModal, buildrik-sync-provider, useComposerInit.loadFlow/.offline, useSaveCallback, PublishService → 6 files / 138 pass.
- `npx tsc --noEmit -p packages/editor` → 0 errors (once). Dashboard/server not touched this round.

Deferred (per controller, noted): a local-newer unstamped row stays local after the pass; a local edit made while a hydrate is in flight can race it (pre-existing); collection adoption rarely matches older local shapes.
Not verified (browser): cancel the unload prompt after Reload latest → Overwrite fails → the edit is offered on the next load; queued collection upsert across a reload (the retry queue lives in memory, so after a reload nothing is queued and the pass runs normally).
