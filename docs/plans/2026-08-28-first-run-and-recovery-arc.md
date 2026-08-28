# First-run & recovery arc — the approved decision package

2026-08-28. Founder approved the flow walk's recommendation package verbatim.
Figma half already landed (`7c9a397f`: 5 new boards, 15 superseded, census 438
rows). This plan is the code half. Inventory: four parallel agent sweeps over
onboarding, pages, save-auth, and rail/portal infrastructure — file:line facts
below come from those.

## Done-conditions (checked live before anything is called done)

| # | Item | Done-condition (observed, not claimed) |
|---|------|----------------------------------------|
| A | Checklist agency-framing | The checklist shows the 7 board steps; in the running app, applying Brand tokens ticks "Set your brand", adding a page ticks its step, inserting a section block ticks its step, sending a review round ticks "Send for review"; stale localStorage from schema v4 resets cleanly |
| B | Rail coach mark | Fresh site (0 steps complete, flag unset): coach bubble renders beside the rail with the board copy + "Got it"; dismiss persists across reload; never renders in `?view=readonly` |
| C | Template door | Pages footer shows "+ Add page · From template · ⋮"; clicking "From template" opens the Templates drawer in new-page mode — live |
| D | Session-expired surface | A 401 mid-session (manual AND autosave path) opens the blocking surface, not a toast; it lists changes since last save; "Try saving again" after re-login in another tab saves without reload; FORBIDDEN no longer masquerades as session-expired |
| E | Board + census closure | 813:4870 superseded by an honest-copy board; census re-pointed; check-boards PASS; gates green; touched-area suites green |

## A · Onboarding checklist — board 296:1972's seven steps

New `DEFAULT_ONBOARDING_STEPS` (`shared/constants/onboardingSteps.ts`), schema
version 4 → 5 (loader clears stale progress; length guard exists at
`useOnboardingOrchestrator.ts:97`):

| id | label | signal |
|----|-------|--------|
| `set-brand` | Set your brand | new `EVENTS.BRAND_APPLIED`, emitted in `DesignSystemTab.handleApply` beside `persistAll()` (:503). `SETTINGS_CHANGE` is too noisy (7 emitters) |
| `add-page` | Add your first page | `PROJECT_CHANGED` `{type:"page:created"}` (`PageManager.ts:91`; precedent `useAutoMilestone.ts:251`). `PAGE_CREATED` constant is declared but never emitted — do not use |
| `insert-section` | Insert a section | `ELEMENT_INSERTED` filtered: `blockId ∈ {section, hero, features, cta, footer, navbar}` or `type === "section"` |
| `connect-client` | Connect your client | the invite email IS the editor's act of connecting a client (codex: `sites.get`'s `clientId` never reaches the editor — `BuildrikSyncProvider` returns only `ProjectData`; dashboard assignment is the dashboard checklist's concern). Completes when `REVIEW_SENT` carries an invite email; seeds from `ReviewService.getCurrentRound() → invitedEmail != null` |
| `send-review` | Send for review | new `EVENTS.REVIEW_SENT` `{invitedEmail: string \| null}`, emitted at the three send sites: `SendForReview.tsx:119`, `AquibraStudio.resendReview` (:403), `StaleApprovalModal.tsx:104`. Completes on ANY send (link-only included); seeds when `getCurrentRound()` returns a round |
| `preview` | Preview your site | `UI_TOGGLE_PREVIEW` — plus fix the pre-existing gap: the topbar Preview button (`StudioHeader.handlePreview` :340) bypasses the event, so the most common preview never ticked |
| `publish` | Publish | `EVENTS.SITE_PUBLISHED` (`AquibraStudio.tsx:425`) |

Seeding on load (against an already-built site): pages > 1 → `add-page`; any
section-type element → `insert-section`; client/round via one
`getCurrentRound()` read. Brand/preview/publish stay unseeded — no honest
signal exists in a loaded snapshot. The `loadingRef` import guard (:105-108)
keeps import noise out.

**Codex blocking fix 1 — the version bump must reset phase too.** The v4→v5
mismatch branch in `loadInitialSteps` clears only `ONBOARDING_PROGRESS`;
`ONBOARDING_PHASE`/`ONBOARDING_DISMISSED` load separately and a v4 user who
finished or skipped stays `"done"` forever — the new job-framed list would
never show. Fix: a single idempotent `migrateOnboardingSchema()` run before
both loaders — on stored-version ≠ current, clear progress AND phase AND
dismissed, then stamp the new version (second call in the same render is a
no-op, so StrictMode's double-invoke is safe — the probe harness renders under
StrictMode).

**Codex medium fix — `BRAND_APPLIED` fires only on success**: emit at the END
of `handleApply`'s try block, after every persist step, never "beside
persistAll()" (later lines can still throw into the catch).

Tests to rewrite in the same commit: `OnboardingMount.signals.test.tsx`
(hardcodes v4 ids), `useOnboardingOrchestrator.test.ts`,
`OnboardingChecklist.test.tsx`, `AchievementPrompt.test.tsx` ([6] = last step),
e2e probe fixture (`e2e/probe/probe.tsx:269-289`) + its
`onboarding-steps.json` baseline. The visual-pin PNG regenerates only under
playwright — regenerate if the e2e suite is run, otherwise record it as
pending in the commit message (do not hand-edit a baseline).

## B · Rail coach mark — board 65:2's note, S1.1 family

New `RailCoach` in `editor/onboarding/`, rendered by `OnboardingMount` (the
established first-run home, `AquibraStudio.tsx:723`) so the gating lives in
one place.

- Show when: `phase === "active"` AND 0 steps complete AND
  `ONBOARDING_COACH_DISMISSED` unset AND NOT `getEditorViewMode().readOnlyView`.
- Copy: "Everything you build lives behind these six." + **Got it** (chrome-ui
  Button). Dismiss writes the flag via `safeSet`.
- Position: portal via chrome-ui `Portal` (Gate 22-clean), anchored to
  `[data-testid="rail"]` right edge, `z-index: var(--bk-z-popover)`; reposition
  on resize. HintTooltip is the wrong contract (hover-driven,
  `pointer-events:none` bubble) — copy its `place()`/measure pattern, not the
  component.
- New storage key in `STORAGE_KEYS` (the onboarding block, `storageKeys.ts:119`).

## C · Template door — DONE in this arc already

`AddPageButton.tsx`: "From template" is a visible sibling; overflow keeps only
"New folder" (`hasOverflow = !!onAddFolder`). Tests rewritten (28 pass). Live
verify pending in E.

## D · Session-expired surface — board 813:4870, rebuilt on honest copy

The inventory's truths this surface must respect:

- Signed-in unsaved work lives **in the tab only** — the network save path
  writes no localStorage; the StorageAdapter copy (`aquibra-project`) only
  appears ~5s after a FAILED save, and nothing ever offers it back once the
  server copy loads. **No TTL exists.** The board's "cached locally, sign in
  within 24h" is unshippable copy on both axes.
- Re-login in another same-origin tab restores the cookie; a retry save then
  succeeds with no reload (`credentials:"include"` per request, no held token).
- The autosave path has **no auth branch at all** — a mid-session 401 there
  currently reads "Save failed" generic.
- `/forbidden|403/` in the manual path's regex makes a role revocation read as
  session-expiry — a lie to fix while here.

Build:

1. `SessionExpiredModal` (`editor/shell/modals/`), on the SHARED modal infra —
   `ModalRoot`/`ModalContent` (codex: portalled modals demonstrably work in the
   dashboard-hosted shell today — `StaleApprovalModal.tsx:132`; ConflictModal's
   no-portal shape was a workaround for the retired Radix path, and it is
   backdrop-dismissable, so it is the wrong precedent for this surface). Scrim
   click and Escape map to the same outcome as "Keep editing" — an explicit,
   visible choice, with SaveStatus still showing the error — so the shared
   focus trap and a11y come for free instead of hand-rolling blockingness.
   - Title "Your session expired". Body: "You have unsaved changes — they live
     in this tab. Keep it open and sign in to save them."
   - Changes list: `composer.history.getHistoryStack().filter(e => e.timestamp
     > lastSavedAt)` — top 3 labels + "and N more". Fallback when empty:
     dirty-page names via `useDirtyPages`.
   - Buttons: **Sign in** (`window.open(DASHBOARD_URL +
     "/auth?reason=session-expired", "_blank", "noopener")` — the auth page
     already renders that reason banner) · **Try saving again** (runs the save;
     success closes) · quiet **Keep editing** (dismiss; SaveStatus keeps
     showing the error state).
2. Wiring: shell state `authExpired` in the studio state; set from the manual
   path's auth branch (`useSaveCallback.ts:202` — replace the toast) AND a new
   auth branch in the autosave catch (`useComposerInit.ts`, before the generic
   else). Clear on save success.
3. FORBIDDEN split: `/forbidden|403/` leaves the auth regex; gets its own
   toast "You don't have access to save this site" with no sign-in CTA.
4. `LoadErrorBanner` sign-in becomes new-tab (`AquibraStudio.tsx:465` is a
   same-tab redirect that would destroy local-fallback work).

Tests: useSaveCallback auth branch (toast → state), autosave auth branch,
modal render/actions, forbidden split.

## E · Closure

- Redraw 813:4870 with the honest copy actually built; supersede; census row
  re-pointed with `walked:` authority after live verify.
- Live verify A–D per done-conditions (editor rig; fixture mutations restored).
- `verify:ds` + touched suites + tsc. Findings doc + walkthrough amended.

## Order

C (done) → A → B (shares OnboardingMount) → D → E. Sequential — A/B/D all
touch the shell wiring; parallel edits there have burned this repo before.
