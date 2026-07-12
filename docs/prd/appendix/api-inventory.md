# API Inventory — Auth + Onboarding

Transport: tRPC unless noted. Rate tiers: **strict = 5/15 min**, **normal = 10/15 min**, per `IP:path`, Postgres fixed-window.

## authRouter (`server/trpc/routers/auth.ts`)
| Procedure | Type | Input | Output | Side effects | Limit |
|---|---|---|---|---|---|
| checkEmail | mutation | email | exists, hasPassword, providers[] | — (200 ms floor) | strict |
| login | mutation | email, password(min8), rememberMe | 2FA branch or sessionToken+user | LoginAttempt row, audit, lockout counters, lastLoginAt | strict |
| signup | mutation | fullName 2–100, email, password(complex), termsAccepted:true | user + message | txn: User+Workspace+OWNER member+OnboardingState; 24 h verify email | normal |
| verifyEmail | mutation | token(uuid) | success+user | sets emailVerified; also consumes email_change tokens | normal |
| resendVerification | mutation | email | generic message | silent no-op if absent; re-mints 24 h token | normal |
| forgotPassword | mutation | email | generic message | mints 60-min reset token + email | normal |
| resetPassword | mutation | token, newPassword, confirmPassword | message | rehash; **deletes ALL sessions** | strict |
| magicLink | mutation | email | generic message | mints 15-min token + email | normal |
| verifyMagicLink | mutation | token | 2FA branch or sessionToken | sets emailVerified if null | strict |
| verify2FA | mutation | twoFactorToken, code(6 digits) | sessionToken+user | 5-attempt lockout per challenge | strict |
| verifyBackupCode | mutation | twoFactorToken, code `XXXX-XXXX-XXXX` | sessionToken+user+remaining | consumes the code | strict |
| logout | mutation (protected) | — | success | deletes all sessions | — |
| getInviteDetails | query (public) | token | workspace/inviter/role/expired | — | — |
| acceptInvite | mutation (protected) | token | workspaceId+name | email-match enforced; member+permissions created | — |
| declineInvite | mutation (public) | token | message | status DECLINED, owner notified | — |

## accountRouter (auth-relevant, all protected, cookie-session only)
| Procedure | Input | Notes |
|---|---|---|
| changeEmail | newEmail, password? | 24 h token to new address |
| changePassword | current, new(complex), confirm | ⚠ does NOT revoke sessions |
| setPassword | new(complex), confirm | OAuth-only accounts; refuses if password exists |
| disconnectProvider | provider(google\|github) | blocked if last login method |
| twoFactor.enable / confirm / disable | — / code(6) / password?+code? | 10 backup codes `XXXX-XXXX-XXXX` |
| sessions.list / revoke / revokeAll | — / sessionId / currentSessionId | IDOR-scoped |
| loginHistory | — | last 10 LoginAttempt rows |

## teamRouter (invite lifecycle)
| Procedure | Rule |
|---|---|
| invite | UUID token, PENDING, +7 days, email sent |
| resendInvite | max 2 resends, re-extends +7 days |
| revokeInvite / pendingInvites | — |

## onboardingRouter (all protected)
| Procedure | Type | Input | Side effects |
|---|---|---|---|
| getState | query | — | lazy-creates row; **read-repair** may jump step→CHECKLIST if a live site exists (not a pure getter) |
| selectRole | mutation | density: full\|fewer | writes UserPreference.editorDensity; step→PROJECT_SETUP |
| setupProject | mutation | projectName 2–100, method ai\|template\|blank | step→SITE_CREATION |
| completeStep | mutation | step(string) | ⚠ zero UI callers (dead but live) |
| completeDashboardTask | mutation | taskId (8-id enum) | all 7 full tasks → COMPLETED |
| dismiss | mutation | — | dismissed=true |

## Adjacent (site-creation branch)
| Procedure | Guards |
|---|---|
| sites.create {name 2–100, method, templateId?} | SITE_LIMIT (3/15/50) |
| templates.use {templateId, siteName} | TEMPLATE_NOT_FOUND |
| templates.generate.create (AI wizard) | AI_MONTHLY_LIMIT (3/20/∞), AI_RATE_LIMITED (3/hr) |

## Non-tRPC routes
| Route | Behavior |
|---|---|
| POST /api/auth/create-session | session_grant → JWT cookie + DB session (30 d rememberMe / 24 h); CSRF same-origin; max 10 sessions |
| POST /api/auth/logout | deletes all sessions, clears cookie |
| Cron: token-cleanup / invite-expiry / session-cleanup | Bearer CRON_SECRET; prunes expired tokens/invites/sessions |
