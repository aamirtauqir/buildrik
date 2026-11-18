# R42 — Form remote-save acceptance checklist

14 October 2026. Independent source/documentation review while root authors the Form fixture. Only this report was written. No Figma inspection, browser playback, source/register changes, server writes, submission, email, webhook or publishing. This is a **proposed acceptance checklist**, not a passing result. All module gates remain open.

Reviewed [R41 Form plan](R41-FORM-CONTRACT-PLAN.md), current [control register](R36-INSPECTOR-CONTROL-REGISTER.csv), and the source anchors below. Historical Form root `8843:30589`; After submit `8843:30815`, Message `8843:30821`, URL `8843:30827`, Notification `8843:30833`, Spam protection `8843:30838`. IDs were not freshly resolved in Figma. At the register read, all six Form behavior rows remained `OPEN_LEAF_CONTRACT`, and notification still said “Owner managed.” Root's later changes must be assessed separately.

## Required state separation

Keep **last acknowledged settings**, **editable draft/failed attempt**, **captured pending request**, and **canvas field Undo** separate. Saved settings are keyed by site ID plus the Form parent's engine ID. Child conversion must not switch that remote target. Device is return context; these settings apply to the form across breakpoints.

Only an acknowledged response changes the saved-settings fixture. “Saving,” incomplete input, a failed attempt and a default returned for a missing server row must never appear as successful saves. Every acknowledgement here is simulated Figma behavior; no durable write is established.

## Finite acceptance matrix

Start with Contact form / Mobile / Settings, saved action MESSAGE, saved message “Thank you,” empty URL, unchanged recipient and spam protection on. Use a separately undoable canvas field conversion before testing remote changes.

| Check | Required visible outcome and invariant |
|---|---|
| A. Load/default | Loading and failed-read are distinct from populated settings. A missing-row default is identified as the initial configuration, not a just-completed save. Retry returns to this same form. |
| B. MESSAGE → REDIRECT, empty URL | Show the Redirect draft and “Add a redirect URL to save this change.” Last saved action remains MESSAGE. No pending request, success message or canvas-history write. |
| C. Invalid URL | Sample `javascript:alert(1)` or `//example.com` stays visible as an invalid draft with a helpful correction. Do not overwrite saved settings or silently replace the user's value. Valid source formats include `/thanks` and accepted absolute HTTP(S); keep full validation/range coverage open. |
| D. Valid commit / Saving | Commit `/thanks` and REDIRECT together for the captured Contact form. Display Saving. Saved action remains MESSAGE until acknowledgement. Prevent duplicate submission for this pending sample, or define request ordering explicitly; do not accidentally start two writes on Enter then blur. |
| E. Acknowledged success | Saved summary becomes REDIRECT → `/thanks`; pending/error clears, draft matches saved, and close/reopen shows the same values. There is no “published” or “email delivered” claim. A same-value blur/choice is a no-op. |
| F. Failed save | Start from a known saved value, submit a different valid attempt, then fail. Saved summary remains that known value; attempted action/URL remains separately labelled unsaved. Display Retry and Discard draft. A failed attempt must not masquerade as the current saved configuration. |
| G. Retry | Retry preserves the attempted values and captured form; eligibility is rechecked. Repeated failure retains both saved and attempted values. Acknowledged success updates only remote-settings state. Switching current canvas selection must not redirect the pending result to another form. |
| H. Discard incomplete/invalid/failed draft | Restore draft from last acknowledged settings and clear its validation/error state. No server write; no canvas Undo consumption. Keep editing retains the exact draft. Define close/Escape consistently; do not let automatic blur commit before the leave decision. |
| I. Pending request exit | Discard/cancel **cannot claim to retract an already sent request**. Either keep this bounded fixture in Saving until resolution or retain pending target/status on return. An eventual acknowledged success must not be silently rewritten as discarded. Do not infer cancellation from closing the overlay. |
| J. Editor permission | Effective site Editor/Designer can change action/message/URL/spam protection; changed notification recipient is unavailable with an Admin-permission reason. Untouched recipient blur produces no write or denial. An already-forbidden response retains last saved recipient and preserves allowed actions. |
| K. Admin permission | Effective Admin-tier fixture validates an email, displays Saving and then simulated acknowledged recipient. Invalid email remains unsaved; empty recipient is an explicit allowed clear. Mid-flight permission loss produces a refusal, not success or a silent role upgrade. |
| L. Canvas Undo isolation | After remote success, Undo the earlier field conversion. Field content/type restores; saved action, URL, recipient and spam setting are byte-for-byte unchanged. Conversely remote draft edits, retry and discard do not overwrite or consume the useful canvas Undo snapshot. |

Also exercise MESSAGE message editing and the spam toggle as independent settings writes; recipient denial must not disable these allowed fields. Reset sample, if retained, must be explicitly a prototype restart, not a product action claiming to restore both persistence domains. No remote “Undo” should appear unless it is clearly another authorized settings change with its own save outcome.

## Source contradictions and corrections to preserve

- **Incomplete draft versus “Saved” copy:** `src/editor/inspector/sections/FormAfterSubmitSection.tsx:130` bundles action/URL; `:138` skips the empty Redirect request after updating local state. Its static saved-immediately note remains at `:217`. The new incomplete-state wording is a design correction.
- **Retained failed attempt is new behavior:** `:149` currently restores the previous settings object and remounts text fields; it does not keep an editable retry draft. The proposed separate failed-attempt state must not be described as already implemented.
- **Permission is effective site role:** `server/trpc/routers/forms.ts:70` requires EDITOR; `:81` adds ADMIN only for a genuinely changed `notifyEmail`. `server/trpc/guards.ts:31` uses effective site permission and shares the Editor tier with Designer. “Owner managed” in the old fixture and “Only workspace Admins” in the existing UI are less accurate than this rule. No-op recipient saves should remain no-ops.
- **Validation is broader than a two-choice sample:** `packages/shared/schemas/forms.ts:50` permits message up to 500 characters, valid/empty recipient up to 320, and requires URL with REDIRECT. `packages/shared/schemas/element-markup.ts:307` trims URL, caps at 2000 and accepts site paths or allowed absolute HTTP(S). `/thanks` is a test value, not the only supported URL.
- **Acknowledgement/order needs implementation:** the current mutation at `FormAfterSubmitSection.tsx:147` has catch/finally but no response reconciliation, request serialization or target-generation guard. Read loading at `:93` does cancel stale reads; that does not prove stale writes are safe. Pending/acknowledged and late-response fixtures are proposed contracts, not runtime verification.
- **Separate store, separate recovery:** `server/services/form-submission.service.ts:300` upserts FormBlock settings without canvas history; first creation is inactive at `:330`. Publishing activates wired forms later at `:360`. Saved settings do not imply publication or submission delivery. Accepted changes cannot be reverted by document Undo.

## Evidence required before bounded acceptance

Root should record final control/state IDs and a manifest naming saved/draft/pending/Undo variables, then inspect actions for forbidden cross-writes. Capture visible incomplete, invalid, Saving, acknowledged, failed-with-retained-attempt, discard, permission refusal and successful retry states. Visually play a complete return path and the canvas-Undo isolation sequence. Test no-op commits and Enter/blur duplication in the authored model where represented.

Record model checks, visual playback and application verification separately. Real permissions, network cancellation/races, durable read-back, live-form effects, native validation/focus and full Undo remain runtime gates. Unauthored failure, role or return states remain design work. This bounded Form task continues Inspector Settings/Forms within the original 14-module acceptance goal.
