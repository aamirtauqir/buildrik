# Topbar fix plan — from the 2026-07-29 /investigate report

**Branch:** `ds/fresh-token-system` · **Reviewed:** /plan-eng-review 2026-07-30 (8 decisions locked, outside-voice absorbed) · **Scope:** editor topbar surface — `StudioHeader`, `ui/Topbar`, `ui/Tooltip`, `ui/ModalParts` composition, `SiteMenu`, `SendForReview`, `NotificationPanel`, `SaveStatus` + `ReviewService` variant + `Composer` metadata event.

## Goal

Every finding from the investigation closed in one arc: no data-loss exit, no unreachable publish-reason, no dead review flow, no stale pills, no silent failures, no false shortcut hints, no dead code. Complete version, not happy-path.

## Locked review decisions (do not relitigate)

1A promise-based save-and-leave · 2A beforeunload bypass-ref · 3A blocked-vs-busy disabled split · 4A status-driven re-send reset (trigger = `at`-timestamp change) · 5A 6-state-aware guard (offline/conflict never fake-save) · 6A `fetchReviewStatusOrNull` + keep-last-known on refetch · 7A ui Tooltip placement classes · 8A outside-voice factual corrections folded.

## Fixes (dependency-ordered)

### F1 · Dirty-exit guard (CRITICAL — L1 + OV#1/#2/#3)
FOUR unguarded navigation exits: topbar ‹ Exit (`StudioHeader.tsx:255`), menu "Exit to dashboard", menu "Preview as client" (`SiteMenu.tsx:62`), and NotificationPanel row-jump (`NotificationPanel.tsx:99` `location.href`).

```
     navigation intent (exit | client-view | notification jump)
                          │
              ┌───────────▼────────────┐   save state (6, from SaveStatus):
              │  guardNavigation(nav)  │   saved            → nav() now
              │   in StudioHeader      │   saving           → await onSave() ≤3s → nav()
              └───────────┬────────────┘   unsaved (dirty)  → dialog A
                          │                error            → dialog A (error shown)
             dialog A: [Save & leave][Leave anyway][Stay]
                          │                offline|conflict → dialog B — NO save
             dialog B: [Leave anyway — edits may be lost][Stay]
                          │
             confirm → bypassRef.current = true → nav()
```
- **1A:** `saveProject` in `AquibraStudio` exposes its promise (`onSave: () => Promise<void>`); "Save & leave" = `await Promise.race([onSave(), timeout(3s)])` then nav; save rejection/timeout keeps dialog open with error. No prop-transition watching (prior learning: saveandgo loop).
- **5A:** guard reads the SAME 6-state mapping the pill uses. `offline`/`conflict` NEVER offer "Save & leave" — `useSaveCallback.ts:96-106` reports queued-offline saves as `idle` and the queue dies on navigation, so a fake save-success here IS the data loss. Dialog B copy: "You're offline — unsaved edits will be lost if you leave."
- **2A:** `beforeunload` registered while `isDirty || saving || offline-queued`; handler checks `bypassRef` — programmatic nav after confirm sets it first (no double-prompt). Covers ⌘W/refresh/close.
- **OV#2:** dialog composed from `ModalRoot/ModalContent/ModalTitle/ModalFooter` (ui ConfirmDialog is hardcoded 2-button — `ConfirmDialog.tsx:39-46` — and stays untouched).
- **OV#3:** `NotificationPanel` gains `onNavigate` wiring from StudioHeader = `guardNavigation(() => location.href = url)`.
- `SiteMenu` stays presentational: client-view toggle moves up to the container; menu receives guarded callbacks.
- Testability: `guardNavigation` takes an injectable `navigate` fn (redirect-mock-must-throw pattern).

### F2 · Reachable blocked-publish reason (HIGH — L2, board 469:3961 + OV#7)
- **3A split:** `blocked` → `aria-disabled="true"`, stays focusable, onClick no-op, wrapped in `ui/Tooltip label={publishBlockedReason}`; `busy` → native `disabled` + `loading` (double-publish stays impossible).
- **7A:** `ui/Tooltip` gains placement (`bottom` default, `bottom-end`, `top`) — `.bk-tooltip--*` CSS with real anchoring (currently `ui.css:326` has NO positioning); Topbar uses `bottom-end`.
- Same treatment for `SendForReview` trigger's `disabledReason` (viewer case); its `sending/sent` states remain native-disabled (busy semantics); `title` attrs dropped.
- Keyboard: Tab reaches blocked button, tooltip shows on focus (`Tooltip.tsx:27` already), Enter/Space no-op.

### F3 · Review pill: clickable + live (HIGH — D1 + S1 + OV#4)
- Click: pill `onClick` → `onOpenReview` → `state.openLeftPanelToTab("review")`. All 5 states clickable.
- Freshness: refetch on window `focus` + `visibilitychange:visible`, throttled ≥30s, via shared `useRefetchOnFocus(fn, ms)` hook (`src/shared/hooks/`).
- **6A:** new `fetchReviewStatusOrNull` in ReviewService (returns `null` on transport failure, real status otherwise). Mount keeps the fail-closed `fetchReviewStatus`; refetch path treats `null` as keep-last-known — a flaky request can no longer erase "Approved by X".
- U1: `pillAgo` replaced by shared `relTime(ts, opts)` added to the EXISTING `src/shared/utils/` time helpers (options: `prefix`, seconds granularity) — consumed by `pillAgo`-callsite, `SaveStatus.ago`, `NotificationPanel.relTime`. No new one-function util file (CLAUDE.md). Ladder: <60s just now · <1h Nm · <24h Nh · Nd.

### F4 · SendForReview re-send (MEDIUM — D4 + OV#6)
- **4A:** reset trigger = incoming `reviewStatus` **`at`-timestamp change** (not `state` — a re-send while `pending` stays `pending`; the timestamp always moves). Container passes `reviewStatus` down. `sent` → label "Send again", enabled. No timer.
- Keep a ~1.5s minimum display of "Sent ✓" before the label swap (pure UX, driven by the same status arrival, not a reset mechanism).
- Double-click send: `sending` state already guards; add the test.

### F5 · Notification honesty (MEDIUM — S3 + S2)
- `markAll` failure → error toast — `addToast` threaded into `NotificationPanel` via prop (OV minor).
- "Mark all read" hidden in `loading`/`error` list states.
- Unread badge: same `useRefetchOnFocus` hook.

### F6 · Shortcut-hint truth (SMALL — U2 + OV#5)
ctrl+H is ALREADY wired (`useEditorShortcuts.ts:88` — `ctrlKey || metaKey`). The entire fix: platform-aware hint string in `SiteMenu.tsx:115` — macOS shows `⌃H`, others `⌘H`/`Ctrl H`. No handler work.

### F7 · Perf pair (MEDIUM — B1 + B2 + OV#8)
- B1: **writers inventory first.** Metadata writers today: `Composer.updateProjectMetadata` (`Composer.ts:627`, called by ProjectSettingsModal), `Composer.mergeProjectMetadata` (`Composer.ts:645`, sync-load path), and the settings-screen dual-save path (`SiteSettingsScreen.tsx:120`). Emit `EVENTS.PROJECT_METADATA_CHANGED` from BOTH Composer methods (engine touch, per engine AGENTS.md); verify the settings-screen path lands in one of them — if not, route it through `updateProjectMetadata`. THEN drop the `selectedElement` dep from the siteName effect (resub-churn gone).
- B2: preview export off the click's paint path — `setTimeout(0)` after the overlay's loading state renders; drop the fake 300ms timer. (Worker offload out of scope.)

### F8 · Dead-code sweep (LOW — D2, D3)
- Remove `ColorModeIconCycle` import (`StudioHeader.tsx:36`) + stale test reference.
- Remove `Topbar.onOpenMenu` prop + built-in ⋯ fallback. Contract test updated.

### F9 · A11y pass (LOW — U3, U4, S5)
- NotificationPanel: focus moves in on open, returns to bell on close (no aria-modal — non-blocking panel).
- SiteMenu trigger: `aria-haspopup="menu"`.
- ⌘K: no-op while `[role=dialog][aria-modal="true"]` open (OverlayMount sets it — verified `OverlayMount.tsx:39`).

## What already exists (reused, not rebuilt)
- `ui/ModalRoot`+parts (F1 dialog) · `ui/Tooltip` focus behavior (F2 — only placement added) · ctrl+H handler (F6 — nothing to build) · `useFocusTrap` (F9) · NotificationPanel `onNavigate` prop (F1 — already injectable, only wiring) · `sending` guard in SendForReview (F4 double-click) · six-state save mapping in StudioHeader (F1 guard reads it, no new derivation).

## NOT in scope
- "Publish anyway" confirm modal (S4) — product call; label honest. → TODO.
- Worker-based export (B2 full fix) — engine not worker-safe. → TODO.
- `useSaveCallback` honesty fix (offline-fail reported as `idle` — OV#1 root cause) — blast radius spans autosave/toasts; F1 defends against it at the guard. → TODO.
- ReviewTab internals — F3's click target, unchanged.
- Console `ERR_CONNECTION_REFUSED` (U5) — standalone-dev sync noise.

## Tests (all gaps from the review's coverage diagram — 25 + regressions)
- **CRITICAL · REGRESSION:** 4 existing `toBeDisabled()` assertions (`topbar.test.tsx:28`, `StudioHeader.test.tsx:198/214/235`) rewritten for aria-disabled + focusable + tooltip-reachable. Same commit as F2.
- F1: clean/saving/dirty/error/offline/conflict branches; save-reject keeps dialog; bypass-ref kills double-prompt; beforeunload registered iff needed; all FOUR exits guarded; injectable navigate.
- F2: keyboard focus → tooltip; busy double-click = one job; Enter/Space no-op on blocked.
- F3: click fires onOpenReview (5 states); throttle no-op <30s; null-refetch keeps pill; relTime table-test (59m ≠ just now).
- F4: `at`-change resets pending→pending re-send; double-click single-submit.
- F5: markAll fail toast; button hidden in error/loading; badge refetch.
- F6: platform hint string (jsdom platform mock).
- F7: resub count stays 1 across selections (spy); rename via settings screen updates topbar name; overlay paints before export (fake timers).
- F8/F9: tsc; focus-return; aria-haspopup; ⌘K blocked while modal open.

## Implementation order & lanes
F2's Tooltip work → F1 (uses nothing of F2) can run parallel; then F3/F4/F5 (share refetch hook + review status), then F6/F7/F8/F9.

| Step | Modules touched | Depends on |
|---|---|---|
| F1 guard | editor/shell/, editor/ui (ModalParts compose only) | — |
| F2 tooltip+split | editor/ui/, editor/shell/ (props) | — |
| F3/F4/F5 review+notif | editor/shell/, services/, shared/hooks|utils | F1 (guard wraps notif nav) |
| F6 hint | editor/shell/SiteMenu | — |
| F7 perf | engine/ (event), editor/shell/ | — |
| F8/F9 sweep+a11y | editor/shell/, editor/ui/ | F1-F5 landed |

Lane A: F1 → F3/F4/F5 → F8/F9 (sequential, shared editor/shell/). Lane B: F2 (editor/ui-heavy). Lane C: F6+F7 (independent). A+B+C parallel-safe; B and A both touch StudioHeader props at the end — land B first or coordinate. One commit per F-group.

## Failure modes (per new codepath)
- guardNavigation: save hangs >3s → timeout branch → dialog stays with error (tested; user sees message, no silent nav).
- beforeunload bypass: bypass set but nav throws → flag stuck → next ⌘W unguarded once. Mitigation: reset bypassRef in finally. (tested)
- Tooltip placement: long reason near viewport edge → clipped; `bottom-end` anchoring + max-width added. (visual check in QA plan)
- Focus-refetch: dashboard down → null every time → pill frozen at last known (correct behavior, tested) — NOT silent failure, badge equally frozen; acceptable.
- Metadata event: writer missed in inventory → stale name returns. Guarded by F7 test through the settings-screen path.
- No critical gaps: every new path has a test + visible error state.

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 0 | — | — |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | — | (codex exec timed out; Claude-subagent outside voice ran instead) |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | CLEAR (PLAN) | 12 issues, 0 critical gaps — 4 review findings + 8 outside-voice findings, all folded (decisions 1A-8A) |
| Design Review | `/plan-design-review` | UI/UX gaps | 0 | — | — |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | — | — |

- **CROSS-MODEL:** Outside voice (Claude subagent, fresh context) found 8 misses the primary review agreed with on verification — most severe: save-pipeline reports offline-failure as `idle` (would have defeated F1), ConfirmDialog can't render the 3-action dialog, a 4th unguarded exit, tooltip has no positioning. All absorbed via decisions 5A-8A; no unresolved tension.
- **VERDICT:** ENG CLEARED — ready to implement.

NO UNRESOLVED DECISIONS
