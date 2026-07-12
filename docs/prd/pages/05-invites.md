# Workspace Invites

> **Routes:** `/auth/invite?token=` · sender side lives in team settings
> **Source:** `app/auth/invite/page.tsx` · `auth.ts` getInviteDetails/acceptInvite/declineInvite · `team.service.ts` invite/resendInvite/revokeInvite

## Overview
Owners/admins invite people by email with a role. The invitee lands on a public invite page showing who invited them, to which workspace, and as what role — then accepts (auth required) or declines (public).

## Lifecycle & rules
- Invite = row on the `Invite` model with UUID token, **status PENDING**, **expires in 7 days**.
- **Max 2 resends**; each resend re-extends +7 days. A cron sweep flips overdue PENDING → EXPIRED.
- Statuses: `PENDING → ACCEPTED | DECLINED | EXPIRED`.

## Page behavior (`/auth/invite?token=`)
- On load: `auth.getInviteDetails` (public query) → `{found, workspaceName, workspaceIconUrl, inviterName, role, expired}`.
- Expired → `/auth/error/invite-expired` (ask the owner to resend — the page CTA copy must match this; self-serve "request new invite" doesn't exist server-side).
- **Accept** (requires session; unauthenticated → login with `returnUrl`):
  - `auth.acceptInvite` — **hard rule: invite email must equal the signed-in email** (case-insensitive); mismatch is audited and rejected.
  - Creates membership + per-site permissions, notifies the inviter, logs activity → `/dashboard`.
- **Decline** (public): `auth.declineInvite` → status DECLINED, owner notified → confirmation screen.

## Fields (sender side, team settings)
| Field | Validation |
|---|---|
| Invitee emails | `inviteMembersSchema` (bulk) |
| Role | one of `ADMIN, EDITOR, DESIGNER, VIEWER` (OWNER not grantable via invite) `[TBC: exact grantable set — verify schema]` |

## Page relationships
- **In:** invite email link (external), owner's team-settings page.
- **Out:** `/dashboard` (accept), decline confirmation, `/auth/error/invite-expired`, `/auth/login?returnUrl=` when unauthenticated.

## Product notes
- Signed-in-as context matters: show "Signed in as X — switch account" when the session email ≠ invite email, because accept will hard-fail otherwise.
- Invited members get a different first-run experience (see checklist doc) — currently unwired in code (gaps register).
