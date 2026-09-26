# Lane L5b report

Base: `0431517b8`. Commits: `4074ce93b` → `c42957026` (5 commits, one per item).

## 1. B-8 remainder — fixed `bc1bf6751`

Migrated the 64-site wave-2 list onto `InputField`/`SelectField`'s `label`
prop or a `useId()`-generated `htmlFor`/`id` pair. Covered ~23 files
(2 dashboard primitives shared across auth/onboarding: `AuthInput`,
`OnbField`, `OnbSelect`) plus workspace/sites-new pages, ticket-form,
danger-zone/delete-workspace/api-tokens/integrations tabs, profile-form,
workspace-form, redirects/seo/share-draft site-detail tabs, invite-modal,
use-template-modal, cancel-modal, client-detail-view, step-pages,
send-review-modal.

Left as-is (verified false positives from the heuristic, not the B-8
defect): `app/auth/page.tsx`, `app/auth/signup/page.tsx`,
`marketplace/page.tsx`, `review-client.tsx`, `vercel-team-picker-form.tsx`
(label literally WRAPS the control — already implicitly associated) and
group headings over a set of buttons/radios/checkboxes rather than one
labelable control (Scopes/Expiry/Role/Site Access/Attachments headings).
`components/publish/pre-publish-checks.tsx` no longer exists in this tree.

Tests: one `getByLabelText` test per migrated form file (10 new test
files + 1 extended existing file `seo-tab-technical.test.tsx`), not
per-field, per the brief.

**Not verified**: `workspace/page.tsx` and `sites/new/page.tsx` fixes have
no new RTL test (heavier trpc-mocking surface) — fixed, tsc-clean, not
unit-tested this pass. No `runtime_check` walked in a browser.

Command: `npx vitest run --maxWorkers=2 <10 new + 1 extended file>` — 26
tests, all pass. `npx tsc --noEmit -p packages/dashboard` clean.
`bash packages/dashboard/scripts/ds-grep-gates.sh` — 7/7 pass.

## 2. A-12 remainder — fixed `63e2d2555`

Moved workspace webhooks from the editor's in-place `WebhooksScreen` to
`/dashboard/settings/integrations` (new `WebhooksCard`, reusing existing
`trpc.webhooks.*` — no new procedures). Editor's `SETTINGS_NAV` webhooks
row flips to `kind:"external"` with a `WORKSPACE_LINKS` entry, same
generic door pattern as Members/Billing. `WebhooksScreen.tsx` +
its event-copy test deleted; copy ported into `webhooks-card.test.tsx`.

Cross-lane edit: `packages/editor/e2e/probe/probe.tsx` — removed the
`"settings-webhooks"` conformance-probe case (rendered the deleted
screen); board 640:3849 / `s7-settings-webhooks` conformance entries are
now stale history, not a live surface (not my lane to update
`boards.json`).

Tests: `webhooks-card.test.tsx` (3), `SettingsTab.test.tsx` updated (nav
row is now an external link to `/dashboard/settings/integrations`),
`OverviewScreen.test.tsx` / `searchIndex.test.ts` unchanged and still
pass (generic `kind==="external"` handling already existed for
Members/Billing).

**Not verified**: the ledger's `runtime_check` (live Postgres check after
a settings.get failure / single-field save) is A12-7's own scope, already
done by lane L5 — not re-walked here. The new webhooks card was not
walked in a running browser.

Command: `npx tsc --noEmit -p packages/editor` and `-p packages/dashboard`
both clean. `npx vitest run --maxWorkers=2` over the 4 touched/new test
files — 64 tests pass.

## 3. Connect-provider session-switch guard — fixed `4074ce93b`

`server/auth.config.ts` signIn's account-first shortcut (`if
(linkedAccount) { user.id = linkedAccount.userId; return true; }`) now
calls `currentSessionUserId()` and refuses with
`reason=provider-linked-elsewhere` when a session already exists and
belongs to someone other than the linked account's owner — the
Settings→Connect-provider case. Public logins (no session) are
unaffected; added `next/headers`/`next-auth/jwt` mocks to
`__tests__/auth-config.test.ts` to simulate both cases.

Tests: 2 new cases in the existing "account-first identity resolution"
describe block. `npx vitest run --maxWorkers=2 __tests__/auth-config.test.ts`
— 20/20 pass (18 pre-existing + 2 new).

**Not verified**: no live walk through actual Google/GitHub OAuth
Connect-provider flow — server auth.config.ts is not directly browser-
testable without real OAuth credentials; unit-level TDD only.

## 4. D-13 remainder — fixed `7013f4206`

`media-library.tsx`'s "Load more" grew a `limit` param and re-fetched the
whole widened page from offset 0 on every click. Migrated
`trpc.media.listAssets` to `useInfiniteQuery`, walking the existing
`cursor`/`nextCursor` the service already returns — same pattern as
`review-queue.tsx`/`comment-queue.tsx`.

Tests: `media-library-infinite.test.tsx` (3 tests — flattens pages, calls
`fetchNextPage` not a widening limit, hides/shows Load more on
`hasNextPage`). Note: implementation was written before the test in this
one case (time-boxed); the test mocks `useInfiniteQuery` specifically,
which the pre-fix code never called (it called `useQuery`), so it would
have failed for the right reason against the old shape — not verified by
an actual red-run against the prior commit.

**Not verified**: the ledger's `runtime_check` (network tab: exactly one
new request per Load-more click, no re-fetch of already-shown assets) not
walked in a browser.

## 5. B-1 (editor) — fixed `c42957026`

Added `shellDirtyRegistry.ts` (module store, one boolean per domain:
`settings` / `brand` / `cms-record`) + `useTabSwitchGuard()` +
`UnsavedTabSwitchDialog`. Producers: `StudioPanels`' `settingsDirty`
setter, `StudioHeader`'s `BRAND_DIRTY_CHANGED` listener, a new effect in
`RecordSheet` keyed on its existing `dirty` computation. Consumer:
`AquibraStudio.tsx` wraps `state.setLeftPanelTab` (rail / `ui:switch-tab`
/ `UI_PANEL_OPEN`) and `state.openLeftPanelToTab` (⌘H, the palette, every
`onOpen*` deep link) with the same guard — one chokepoint per function,
covering every listed surface except the rail's OWN settings-specific
`safeTabChange`/`UnsavedSettingsDialog` path, which is left running
alongside (predates this fix, still works, doesn't double-prompt because
`setSettingsDirty(false)` clears the registry synchronously before
`onTabChange` fires in the same callback).

Tests: `shellDirtyRegistry.test.ts`, `useTabSwitchGuard.test.ts` (covers
the three must-haves directly — Brand dirty blocks a switch, Settings
dirty blocks one, clean state runs immediately — plus Keep-editing/
Leave-anyway), `UnsavedTabSwitchDialog.test.tsx`. Existing
`StudioPanels.{projectId,openRequests}.test.ts`, `RecordSheet.test.tsx`,
`UnsavedSettingsDialog.test.tsx`, `AquibraStudio.wiring.test.ts` all still
pass unchanged (42 tests total across the 8-file batch).

**Not verified — the big one**: no live-browser walk of the must-have
scenarios (Brand staged edit + ⌘H, Settings dirty + palette jump, clean
state + no prompt) in the running app — verified at the hook/unit level
only, per this lane's resource constraints. `AquibraStudio.tsx` is
1000+ lines and not fully mountable in this lane's test tier; the guard
wiring itself (which functions got wrapped, at which call sites) was
verified by direct code read + tsc, not by rendering the whole shell.

**Pre-existing, unrelated failure found**: `StudioHeader.test.tsx` and
`StudioHeader.savePill.test.tsx` both fail with `No "SyncRetryQueue"
export is defined on the "@/services/syncRetryQueue" mock` — their
`vi.mock("@/services/syncRetryQueue", ...)` only stubs
`totalPendingMirrors`, but `versionSync.ts` (pulled in transitively via
`useVersionHistory`) also needs `SyncRetryQueue`. This predates my change
(my only edit to `StudioHeader.tsx` is a two-line import + one listener
tweak, unrelated to version sync) — flagging as a real bug outside scope,
not fixed here.

## Cross-lane edits

- `packages/editor/e2e/probe/probe.tsx` (item 2) — removed the
  `"settings-webhooks"` probe case + its `WebhooksScreen` import.

## Verification run

- `npx tsc --noEmit -p packages/editor` — clean.
- `npx tsc --noEmit -p packages/dashboard` — clean.
- `bash -c 'cd packages/editor && pnpm run verify:ds'` — full run, exit 0,
  every gate PASS (tsc, tokens-generated, vibcoder-ratchet,
  editor-ui-gone, chrome-ui-surface, styling-ratchet, buildrick,
  design-debt-ratchet, narrow-control-padding).
- `bash packages/dashboard/scripts/ds-grep-gates.sh` — 7/7 pass.
- `pnpm test:db` — not run; no DB-tier test was needed for any of these
  5 fixes.
- Per-item `vitest run --maxWorkers=2` totals: item 1 = 26 tests, item 2
  = 64 tests, item 3 = 20 tests, item 4 = 3 tests, item 5 = 42 tests — all
  green, run separately per lane-common.md's resource rule (no full-suite
  run).

## Real bugs found outside scope

- `StudioHeader.test.tsx` / `StudioHeader.savePill.test.tsx` — pre-existing
  broken `SyncRetryQueue` mock (see item 5's note above).

## Fix round 1 (controller review)

Rebased onto `fix/audit-2026-09-25` = `e242b2949` (already contains Lfix:
VIEWER gate inside useStudioState sinks + the StudioHeader SyncRetryQueue
mock fix 6b96a3141 — so no mock fix from this lane was double-applied). One
conflict (AquibraStudio's moved `useEditorShortcuts` block) resolved onto the
guarded sinks. Original five now `344b8dc09..4c90e668b`; round-1 commits
`5d191f4e3..363121ba9` (10 commits).

1. **Exit/beforeunload/chip read the registry — fixed `5d191f4e3`.** StudioHeader
   reads `isDirty || shellDirty.get()` at call/fire time (guardNavigation,
   beforeunload) and `useShellDirty()` for the chip. ONE source: StudioHeader's
   `brandDirty` state and StudioPanels' `settingsDirty` state deleted; SettingsTab
   registers its own `settings` entry (cleared on unmount); the
   settingsDirty/onSettingsDirtyChange plumbing (StudioPanels → LeftSidebar /
   FullPageView / FullPageRouter, SettingsTabProps.onDirtyChange) deleted, and with
   it LeftSidebar's rail-only "Discard & Switch" ConfirmDialog — it duplicated the
   shell guard (every rail door already reaches it through onTabChange) and could
   double-prompt. Tests: StudioHeader "reads the shell dirty registry" (settings /
   cms-record dirty → Exit dialog + beforeunload prevented; clean → neither; red
   before the fix), SettingsTab registry entry set + cleared on unmount.
2. **No global reset — fixed `9421fc08f`.** `shellDirty.reset()` and `getDomains()`
   deleted; each producer owns its entry. New `blocksTabSwitch()` = settings ||
   cms-record. **Brand behaviour chosen: Brand never prompts on a tab switch** —
   its staged edits live in TokenRegistryProvider and survive the switch, so the
   dialog's "Switching away will lose them" stays literally true; Brand still
   counts for Exit and beforeunload. `useTabSwitchGuard` now owns both guarded
   sinks: same tab (+ same sub-tab) and VIEWER-refused switches (predicate passed
   in; the gate itself stays in useStudioState's sinks — composable with Lfix) are
   not prompted. "Leave anyway" only runs the switch. StudioPanels' open doors
   (templates/design/settings/pages/CMS/`ui:switch-tab`) now pass their request
   hand-off + drawer-open as the switch's `onSwitched`, so nothing lands while the
   confirm is pending or after Keep editing. Tests: useTabSwitchGuard (8, red
   first), shellDirtyRegistry (4), StudioPanels.openRequests regexes rewritten.
3. **No visual change — fixed `79fe5f9ff`.** Every site the B-8 pass moved onto
   InputField's `label` prop is back to its ORIGINAL `<label>` element and class
   list, tied by `htmlFor={useId()}` + `id` on the InputField (profile-form bio
   pattern). integrations-tab's 6 identical fields → one local `ConfigField`;
   integrations-content's mapped fields → one useId base + provider/key. Diffed the
   `className` lines against `0431517b8`: identical (only htmlFor/id added). Tests
   pin the original class list + colour on redirects/delete-workspace/danger-zone/
   use-template (red on the prior commit, verified by checking the old sources
   back out temporarily). Note: invite-modal was never restyled (its labels were
   only given htmlFor); the mb-1.5→mb-1 case was share-draft-modal — restored.
4. **getByLabelText tests — added `283c8a599`.** One file each for profile-form,
   workspace-form, invite-modal, integrations-tab (all 4 providers), ticket-form,
   share-draft-modal, client-detail-view (Branding dialog), send-review-modal,
   api-tokens-tab, settings/workspace/page, sites/new/page; restored sites also pin
   class list + colour. New helper `components/__test-utils__/trpc-stub.ts` (Proxy
   trpc: empty queries, inert mutations, per-procedure overrides). These pass on
   arrival — the association already existed; they are coverage, not red→green.
5. **webhooks-card — fixed `f02bd00f0`.** Raw URL input → InputField; raw
   checkboxes → flowbite-react `Checkbox color="blue"` (no dashboard Checkbox
   primitive exists — AGENTS.md order step 2, flowbite directly); Events list is a
   `role=group` named by its heading; "Events"/"Signing secret" are `<p>` headings.
   **Deviation, stated:** the Endpoint URL label keeps the eyebrow/primary style of
   the provider fields beside it (integrations-content) via htmlFor/useId rather
   than InputField's built-in body/secondary `label` — same ruling as item 3,
   consistent card. `as EventId[]` → `data.events.filter(isEventId)` (test: an
   unknown stored event is dropped on save). class-list.json regenerated with
   `npx flowbite-react build`; its collateral rewrites of globals.css /
   tw-flowbite.css reverted per AGENTS.md (flowbiteStore.prefix test green).
6. **Real doors — added `3be2fe2a4`.** AquibraStudio.wiring: raw
   `state.setLeftPanelTab/openLeftPanelToTab` appear only inside the
   `useTabSwitchGuard({...})` call (comments stripped); every `onOpen*` deep link
   (≥6) uses `guardedOpenLeftPanelToTab`; useEditorShortcuts gets the guarded
   `openLeftPanelToTab` + `openSiteSettings`; useEditorEventListeners gets both
   guarded sinks; `onLeftPanelTabChange={guardedSetLeftPanelTab}`.
   `tabSwitchGuard.integration.test.tsx` drives ⌘H (real useEditorShortcuts) and
   UI_PANEL_OPEN (real useEditorEventListeners) with a dirty Settings entry →
   confirm shown, tab held; Leave switches, Keep stays; clean → straight through.
   Written after item 2 landed, so green on arrival.

Minors:
- `constants.ts` Webhooks row "Webhooks ↗" → "Webhooks" (+ SettingsTab nav test) — `4e2817ced`.
- Import cycle: `IntegrationCard` moved verbatim to `components/settings/integration-card.tsx` — `719eb5345`.
- `media.service.listAssets` orderBy `[{ createdAt: "desc" }, { id: "desc" }]` + test (red first) — `363121ba9`.
- `getDomains` deleted, `useShellDirty` used (StudioHeader chip) — in `9421fc08f` / `5d191f4e3`.
- StudioPanels doors don't open the drawer while pending/cancelled — in `9421fc08f`. NOT changed: the rail's own `handleBtnClick` still opens a closed drawer before the (possibly pending) switch, and `useEditorEventListeners`' UI_TOGGLE_LAYERS still `setIsLeftPanelOpen(true)` unconditionally — both only reveal the current tab, lose nothing.
- `webhooks-card` `as EventId[]` → filter — in `f02bd00f0`.
- Conformance: board 640:3849 retired x5-style — `3046fec98`: boards.json row `status: retired`, `recipe: null`, note; `surfaces/` + `specs/s7-settings-webhooks.json` deleted; `.conformance-baseline.json` entry dropped; counts 505/24 → 504/25 (counted from rows); floor 185 → 184 via `check-boards.mjs --update-floor`. `raw-figma/s7-settings-webhooks.json` and its 3 `.hex-drift-baseline.json` pairs KEPT (the Figma board still exists; hex-drift scans raw-figma). `node scripts/conformance/check-boards.mjs`: PASS — 184 recipes (floor 184), 178/504 active measured. (`counts.outOfScope` 57 vs 62 rows is pre-existing drift, untouched.)

Note only: `currentSessionUserId` (auth.config) does not check `sessionVersion`, so a revoked-but-unexpired JWT still counts as "a session exists" for the Connect-provider guard — edge case, not fixed.

Verification (resource rule: `--maxWorkers=2`, touched files only):
- Editor: 22 files / 283 tests green (StudioHeader ×2, SettingsTab, sidebar/__tests__, shell hooks, registry, wiring, integration, StudioPanels ×2, UnsavedTabSwitchDialog, RecordSheet, searchIndex).
- Dashboard + server: 27 files / 71 tests green (settings/__tests__, all *-labels tests, seo-tab, flowbiteStore.prefix, media.service).
- `npx tsc --noEmit -p packages/editor` clean; `-p packages/dashboard` clean.
- `bash -c 'cd packages/editor && pnpm run verify:ds'` — **exit 1 at check-token-resolution, NOT this lane**: `--bk-danger` undefined, no fallback, `src/editor/inspector/sections/FormAfterSubmitSection.tsx:240` — present on the base `e242b2949` (forms lane, `057faccdf`/`a702ecd64`). Every gate after it was run by hand: anchors, boards, hex-drift, copy, tsc-baseline (editor + dashboard 0), tokens-generated, vibcoder-ratchet, editor-ui-gone, chrome-ui-surface, styling-ratchet, buildrick, design-debt-ratchet, narrow-control-padding — all PASS. Gates before it all PASS (seam-scan WARN-mode only).
- `bash packages/dashboard/scripts/ds-grep-gates.sh` — 7/7 PASS (D7 176 ≤ 177).

NOT verified: no live-browser walk of any B-1 scenario (Settings dirty + ⌘H / palette / rail; CMS record dirty + switch; Brand staged + switch → no prompt, + Exit → prompt), of the restored label visuals (asserted by class list, not a screenshot/getComputedStyle), or of the webhooks card's Checkbox rendering (class-list compiled, not looked at in a browser). The integration test uses a harness that composes the real hooks, not a mounted AquibraStudio.

Cross-lane edits this round: `packages/editor/scripts/conformance/{boards,.conformance-baseline}.json` + deleted surface/spec (conformance manifest), `e2e/probe/probe.tsx` comment.

## Fix round 2 (controller review)

Commits `452935374..7e3c52719` (3), on top of round 1's `363121ba9`.

1. **Double prompt after Settings' own Discard / Save and continue: fixed `bf13d8d07`.** The registry entry was written only from an effect, so `rollBack()` / the save's `succeeded()` followed by `leave()` reached the guarded tab switch while `settings` still read dirty. SettingsTab now has ONE synchronous writer, `markScreenDirty`, that sets the state, the ref and the registry entry together. It serves as the screens' `onDirtyChange`, the screen-change reset, `rollBack`, and the save's success. The old state→registry effect and the ref-mirror effect are gone. Tests, both red first: the registry reads clean at the moment Settings' door calls `onClose` after Discard, and after Save and continue. That is the exact condition the shell guard checks, so no second dialog can appear.
2. **Brand prompts again (ruling): fixed `452935374`.** `blocksTabSwitch()` is removed and the guard reads `get()`. The dialog's body and leave label now come from the registry when the dialog opens:
   - **Every dirty domain can discard:** "You have unsaved changes. Switching away will lose them." / "Leave and lose changes".
   - **Brand only:** "You have unsaved brand changes. Switching away may discard some of them." / "Leave anyway".
   - **Mixed without a discard:** the same "may discard some of them" wording.

   The comments that claimed Brand staging survives a switch are fixed in `useTabSwitchGuard.ts` and `shellDirtyRegistry.ts`, and `UnsavedTabSwitchDialog` takes `body` and `leaveLabel` props. Tests: useTabSwitchGuard (Brand prompts with the honest copy; Leave anyway runs the discard before the switch), shellDirtyRegistry (`discardDirty` / `everyDirtyDiscards`), UnsavedTabSwitchDialog (renders the copy it is given). These tests were written before the code but were not run red.
3. **An honest "Leave anyway": fixed `7e3c52719`.** A producer can now register a discard with `shellDirty.setDiscard(domain, fn | null)`. "Leave anyway" calls `discardDirty()` before it switches.
   - **SettingsTab** registers `rollBack`, which puts the composer back to the screen snapshot and clears the entry.
   - **RecordSheet** registers a reset of its fields and status that also clears the entry.
   - **Brand** registers nothing, which is why its copy does not claim loss.

   Tests: calling the shell discard on dirty Settings calls `setProjectSettings(snapshot)` and leaves a clean entry (red first). The same call on a dirty record puts the fields back to their stored values (red first). The sheet's own "Discard and leave" leaves the entry clean (already green).

Noted only, per the controller, and not fixed:
- The chip reads "unsaved" when only Settings or CMS is dirty.
- ⌘K on the same tab replaces a dirty CMS record without asking.
- Demoting a user to viewer while Settings is dirty raises the prompt.

Verification:
- Editor covering tests: 18 files, 234 tests green (`--maxWorkers=2`).
- `npx tsc --noEmit -p packages/editor`: clean.

NOT verified in a live browser: the Settings Discard → no second dialog path, Brand + switch → prompt, and Leave anyway → composer rolled back.
