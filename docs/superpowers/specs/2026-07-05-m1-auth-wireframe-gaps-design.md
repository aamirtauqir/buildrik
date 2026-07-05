# M1 · Auth — Wireframe Gap Closure (Figma)

**Date:** 2026-07-05
**File:** Figma `RmtnWGlZX9Z3idP6f5vmLq` · page **M1 · Auth** (`922:2`)
**Scope approved:** Full (14 items) · Validation = separate error-state screens
**Type:** Figma wireframe/prototype edits (not code). "Implementation" = `use_figma` edits.

## Problem

User reported: M1 Auth is incomplete — required fields show no validation error, and several links point to screens that don't exist (e.g. "Change email"). Audit (grounded in `reactions` + node data) found 3 gap classes. No *wired* link is broken; the gaps are missing states, a missing screen, and dead/un-wired links.

## Bucket A — Validation error-state screens (6 new frames)

Method (matches M2 states pattern): clone base screen → offending field gets red 1.5px stroke → inline `✕ …` error (`#dc2626`, 12px) → corner `STATE:` chip → expose as prototype flow-start → CTA wired to the happy-next.

| # | New frame | Clone of | Field error | CTA → |
|---|---|---|---|---|
| 1 | Sign Up — VALIDATION | Sign Up `941:2` | email `✕ Enter a valid email address` + password `✕ Password too weak` | verify email `942:74` |
| 2 | Forgot Password — INVALID EMAIL | `941:105` | `✕ Enter a valid email address` | reset-link-sent `942:115` |
| 3 | Reset Password — MISMATCH | `941:127` | confirm `✕ Passwords don't match` | password-reset-success `942:136` |
| 4 | Magic Link — INVALID EMAIL | `941:151` | `✕ Enter a valid email address` | magic-link-sent `942:176` |
| 5 | 2FA — WRONG CODE | `943:239` | OTP `✕ Incorrect code — 2 attempts left` | workspace-select `943:288`; backup link → `943:267` |
| 6 | 2FA Backup — INVALID | `943:267` | `✕ Invalid backup code` | workspace-select `943:288` |

## Bucket B — Missing screen (1 new frame)

| # | New frame | Build | Wiring |
|---|---|---|---|
| 7 | Change Email | split-shell + form: "Change your email", current email (greyed), new-email input, **Update email** CTA. | Update → verify email `942:74` (re-verify) · ← Back → verify email `942:74`. Reached from #8. |

## Bucket C — Dead-link wiring + split 2-in-1 links (7 fixes)

All bundled links are single CENTER text nodes with a "·" separator → cannot carry two targets. Replace each with two separate, individually-wired link texts. Trigger convention: `ON_CLICK · NAVIGATE · DISSOLVE` (matches the 30 existing M1 reactions).

| # | Screen | Node | Fix |
|---|---|---|---|
| 8 | verify email | `942:94` | split → "Resend email" (→ self `942:74`) + "Change email" (→ Change Email #7) |
| 9 | reset-link-sent | `942:135` | split → "Resend link" (→ self `942:115`) + "Back to sign in" (→ Sign In `941:40`) |
| 10 | email-already-exists | `942:215` | split → "Use different email" (→ Sign Up `941:2`) + "Forgot password?" (→ Forgot `941:105`) |
| 11 | magic-link-sent | `942:194` | wire "Resend magic link" → self `942:176` |
| 12 | auth-invite-accept | `942:317` | wire "Accept invite" → M2 member-first-run `968:282` |
| 13 | workspace-select | `943:309`, `943:315` | "Open →" → **M3 Dashboard — BLOCKED: M3 (`922:4`) is empty.** Wire when M3 exists (or build minimal M3). |

"Resend" links re-navigate to self (prototype approximation of "sent again"); a toast state is a possible later polish.

## Out of scope / dependencies

- **#13 workspace-select** is a true dead-end but its target (M3 Dashboard) does not exist. Same blocker as flow-gap G5. Options: (a) leave pending M3, (b) build a minimal M3 landing. Recommend build M3 as the next milestone.
- M2 already wired in prior session; this spec covers M1 only.

## Definition of done

All 6 validation frames + Change Email built, red/error styling + STATE chips, exposed as flow-starts, CTAs wired. 7 dead-link fixes wired (bundled links split). Every new frame + link screenshot-verified. #13 documented as M3-blocked. Originals' structure untouched (clones + additive edits).
