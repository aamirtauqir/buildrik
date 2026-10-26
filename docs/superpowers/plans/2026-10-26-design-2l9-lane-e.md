# Design 2L9 · Lane L-E — Site delivery (Figma page 06) — sub-plan

> Parent: `docs/superpowers/plans/2026-10-22-implement-2l9-design.md` (Global Constraints, Review Focus, Manifest schema and Phase 2 apply unchanged; later accepted lists win). Inventory: `packages/editor/docs/design-2l9/inventory/06-site-delivery.md`. Brief: `packages/editor/docs/design-2l9/LANE-BRIEF.md`.

**Goal:** Settings, Publish, Analytics, Domains, Security and Form submissions match Figma `2L9OTGzBrL6kYmU18yA1c7` page 06, slice by slice. Each slice updates its `boards-2l9.json` rows.

**Branch / worktree:** `feat/design-2l9-lane-e` in `~/Desktop/buildrik-worktrees/design-2l9-lane-e`, from `feat/design-2l9` @ `59c9fdf67`. Probe port 5175 (temporary config, deleted after use). No Next dev server in this lane (the lead walks live).

**Owned paths** (under `packages/editor/src/editor/`): `sidebar/tabs/settings/`, `sidebar/tabs/publish/`, `shell/PublishTray.tsx`, `shell/PublishDiffView.tsx`, `shell/PublishHistory.tsx`, `shell/publishTrayStore.ts`, `shell/lifecycle.ts`. Dashboard routers and services only through the full chain (shared Zod schema → service → router → client) with tests. Not owned: `sidebar/FullPageRouter.tsx` (the Settings host), `StudioPanels.tsx`, `Topbar.tsx`, `StudioHeader.tsx`, `AquibraStudio.tsx`, the client review page (L-F). Changes there go to `REQUESTS.md`.

**Safety:** never trigger a real publish. The QA workspace has a live Vercel connection, and `PUBLISH_ALLOW_SIMULATION` does not prevent a deploy (REQUESTS #8). This lane runs no live publish walk.

**Board screenshots used** (4 Figma calls, session `630675b5…`): `238:11495` (guard), `248:20853` (saving), `277:28233` (save failed). Everything else comes from the local dump.

---

## Archetypes, in order (user impact first)

Play F4 (publish) is already built as the Phase-1 tray (OD-1, blocking checks shut the CTA). This lane's first work is the Settings journey that F4 crosses ("save settings, then publish") and its largest drift clusters.

### E1 · Unsaved-changes guard: copy and button order (38 rows)
Rows: S06 `238:11495`, SG01 `245:51225`, B8-GUARD ×10 (`248:20642`…), GAP-ST guard draft→dest ×26 (`277:27746`…).
Files: `settings/components/UnsavedSettingsDialog.tsx`, `settings/SettingsTab.tsx`, `settings/components/__tests__/UnsavedSettingsDialog.test.tsx`, `settings/__tests__/SettingsTab.test.tsx`.
Board copy adopted (screen and destination names come from the nav, never the board's sample data):
- Title "Leave without saving?". 480 wide.
- Body, nav: "Your {Screen} changes are unsaved. Continue to {Destination} after saving or discarding them."
- Body, leaving Settings: "Your {Screen} changes are unsaved. Save them before you go, or discard them."
- Buttons, right-aligned: "Discard changes" (outline) · "Save and leave" (outline) · "Keep editing" (primary, focused; Escape and the scrim give the same answer).
Failing tests: `UnsavedSettingsDialog › title "Leave without saving?" and destination-named body`; `› buttons in board order, Keep editing primary and focused`; `› leave variant body`; `SettingsTab › dirty nav click raises the guard naming the current screen and the destination`.

### E2 · Guard while saving (36 rows)
Rows: B8-SAVING ×10 (`248:20853`…), GAP-ST saving→dest ×26 (`277:27988`…).
Board copy: title "Saving {Screen} settings…", body "Your destination is {Destination}. Wait for the save result; if it fails, your changes stay here.", one outline button "Stay in {Screen}".
Behaviour (code contract): a running save cannot be cancelled. "Stay in {Screen}" drops the pending destination and closes the dialog; the save carries on, and its result lands on the screen (success: the Saved toast; failure: the save-error banner). Escape = Stay.
GAP-ST-W draws the same state as a footer line ("Saving Security headers… destination: Overview"); the B8-SAVING dialog is adopted for both, and the GAP-ST-W rows note it (`authority: board`, variant chosen for one shape).
Failing tests: `› saving state shows "Saving {Screen} settings…" and the destination`; `› Stay in {Screen} keeps the user on the screen after the save resolves`.

### E3 · Save failed while leaving: "Retry save and leave" (26 rows)
Rows: GAP-ST save failed→dest ×26 (`277:28233`…).
Board copy: title "Couldn't save {Screen}", body "Your changes are still here. You have not left this screen.", line "Requested destination: {Destination}. Retry uses this same destination.", buttons "Keep editing" (primary) · "Retry save and leave" (outline). The footer status reads "Couldn't save — Retry" and its button "Retry save".
Behaviour: today a failed Save-and-continue closes the dialog and shows the banner. New: the dialog stays up in its failed state; Retry runs the same save and finishes the same destination; Keep editing closes it and keeps the banner. A `SettingsSaveCancelled` (General's slug confirm → Cancel) still closes everything quietly.
Failing tests: `› a failed Save and leave keeps the dialog in its failed state with the destination`; `› Retry save and leave saves again and then navigates`; `› Keep editing after failure leaves the banner`.

### E4 · Settings nav and footer copy (shared by every settings row; closes S02–S04, Return to editor)
Files: `settings/SettingsTab.tsx`, `settings/constants.ts`, tests.
Board copy: workspace group "Organization workspace ↗" (uppercase by the group style), rows "Members ↗", "Billing ↗", "Integrations ↗"; role foot "Your role: {Role}" and "Permissions ›" on two lines; pane header carries "‹ Back to Editor · {Page}" before the title and the scope as a pill ("Applies on next publish" / "Live immediately · no publish needed"); footer primary "Save settings".
Host: the board draws Settings inside the editor shell (topbar, rail, bottom bar). The host is `sidebar/FullPageRouter.tsx` (not owned) → REQUESTS entry. The "Settings" heading and site name above the nav are not on the board; they go (the topbar names the site).
Kept by owner decision 2026-10-04 (`authority: code:owner-search-mode-2026-10-04`): Search is an entry into Search Mode, not an always-on field; results list in the sidebar (S20 draws them in the pane). Recorded `blocked:owner-search-mode` for the owner to confirm against the newer board.
Failing tests: rewrite the SettingsTab tests that pin "Back to canvas", "Managed in workspace settings ↗", "Integrations & webhooks", "Save".

### E5 · Form submissions: views, filter, bulk select (≈230 rows: FM views ×4, FM inbox ×4, S13–S14, FM08/10, Unspam/Unarchive ×6, FMC dataset/Filter/Configure/Delete-*)
Files: `settings/screens/FormsScreen.tsx`, `settings/screens/__tests__/FormsScreen.test.tsx`.
Board copy: tabs "Inbox · Spam · Archived"; "Form: {name}" select with "All forms"; header "{View} · {n} submissions"; "Export CSV"; "Configure in Inspector" (one form) or "Choose a form to configure" (All forms, with the hint "Select a single form before configuring it in Inspector."); card title "Submissions · {Form | All forms}"; rows with a "Select {from}" checkbox, "{from} · {form}", summary, "{date} · {View}"; selection bar "{n} selected" · "Delete {n}" · "Unspam" (Spam) / "Unarchive" (Archived); foot "Showing {shown} of {total} · sorted newest first" and "Submissions are kept 365 days, then permanently deleted."; delete confirm "Delete {n} submission(s) permanently?" / "Submissions can't be restored after they're deleted." / Cancel (default) · Delete.
Server: none for this slice. `forms.listSubmissions` already filters by form, spam and archived; `updateSubmission` sets isSpam/isArchived; bulk delete / unspam run per row (the failed rows stay selected, FM10).
Retention line: check the server's retention before adopting "365 days"; if no retention job exists the line is not adopted (`authority: code:no-retention-job`).

### E6 · View-aware export (later server slice; FM export ×9, FMC Export-* ×108)
`forms.exportSubmissions` takes `siteId, formBlockId, format` only (`server/trpc/routers/forms.ts:91`). Full chain: `packages/shared/schemas/forms.ts` gains `exportSubmissionsSchema` with `isSpam`/`isArchived` → `form-submission.service.ts` `exportSubmissions` filters → router uses the shared schema → FormsScreen passes the view; service test. Then the board's Preparing CSV / CSV prepared / CSV failed copy.

### Later (not in this batch)
ACK saved→dest (25), Languages staged default (S07, GAP-ST-L), Analytics and Security headers screen copy (AN, SH), Permissions matrix (PM + 17 returns), offline states (S05, AN07, SH04), settings conflict (CF), publish from Settings (GAP-ST-P*, 26), compact 1280 nav (S21, AN15-16/SH14-15), Publish tray residual copy (PB13, PB16-17, PB22), Export dialog (EX), Issues (IS), Account › Privacy (dashboard). Review rows (B8-R, GAP-RV*) are L-F's.

## Code-ahead dispositions

No row is `code-ahead`; these code capabilities are undrawn and are kept:
- Publish history and rollback → kept under the tray's ⋯ / History.
- Preview vs production rows → folded into the tray's "Goes to".
- Vercel repair/reconnect, Cancel of a running job → kept (Cancel Admin + queued per PB08).
- Issues auto-fix → kept as the Fix › action.
- Redirect CSV import, URL-repair card, SEO social profiles, translation checklist, domain verified dialog, Access share links → kept on their screens, not restyled until the owner confirms (`authority: open:undrawn-settings-cards`).
- `Brand ↗` door in Settings › Site (board omits it; Brand is on the rail) → kept, `open:brand-door-in-settings`.
- Form submission detail (field list, Mark spam, Archive) → kept as the row's open state (FM06 draws a detail).

## Owner decisions raised
- `blocked:owner-search-mode` — board S20 (always-on field, results in pane) vs owner override 2026-10-04 (Search Mode in the sidebar). Code kept until confirmed.
- `blocked:owner-retention` — only if no retention job exists for "kept 365 days".

## Requests filed (REQUESTS.md)
- Settings host inside the editor shell (FullPageRouter / StudioPanels): board draws Topbar + Rail + bottom bar around Settings.

## Verification
Per slice: targeted vitest; before each commit batch `npx tsc --noEmit > /tmp/tsc-e.log; echo $?` = 0 and `pnpm run verify:ds` (cwd `packages/editor`). Rows move to `drift-fixed` only after a compare (board screenshot vs a probe render); otherwise they stay `drift-open` with "built, not compared".
