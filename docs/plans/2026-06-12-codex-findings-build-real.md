# Plan: Build real backends for Codex audit findings (2026-06-12)

Source: /codex audit (session 019ebaef). Approach chosen: **B — build real features** (not honest-relabel).
Backend reality verified before planning (audit-phase-specs-against-engine-apis rule).

## Backend that ALREADY exists (just wire / un-fake)
- CMS engine: `CollectionManager.createCollection` real; `composer.cms.collections` always wired.
- OAuth: NextAuth `Account` model (`@@unique([userId, provider])`) + Google/GitHub providers configured.
- Integrations: `webhookUrl` stored in `config` (Zapier/Slack); test-event = server POST to it.
- Forms: `forms.exportSubmissions` tRPC query exists (full dataset, per formBlock).
- Help: `help.search` + `help.categories` procedures exist.
- Templates: `previewUrl` field on template record.

## WAVE 1 — wire existing backend (real, low risk)
1. CMS modal fail-hard — remove fake `setSuccess(true)` when `createCollection` absent; engine API is always present, so call directly and only show success after confirmed create. (editor)
2. Template preview real iframe — render `<iframe src={previewUrl}>`; if null, honest "no preview" (not "placeholder"). (dashboard)
3. CSV export → server — overview-tab calls `forms.exportSubmissions` (full dataset) instead of hand-rolled current-page CSV. (dashboard)
4. Help categories — card click filters articles by category via `help.search` (real results), drop "Coming soon". (dashboard)

## WAVE 2 — build new backend, NO external dependency
5. OAuth connect/disconnect — connect = `signIn(provider)` (NextAuth links to current session); disconnect = `account.disconnectProvider` mutation deleting the `Account` row, guarded so the user cannot remove their last login method. (server + dashboard)
6. Webhook test-event — `account.integrations.testEvent` mutation: server POSTs a sample JSON payload to the stored `webhookUrl`, returns delivery status. (server + dashboard)
7. Integrations update — `account.integrations.update` mutation to persist edited config on connected integrations. (server + dashboard)

## WAVE 3 — bigger (storage + migration)
8. Ticket attachments — upload to blob storage, persist refs on `SupportTicket`, include in `createTicket` payload. Needs schema migration. (server + dashboard + prisma)

## BLOCKED on user (external service / credentials) — do NOT fake
- Real CAPTCHA (`auth/error/captcha`) — needs Cloudflare Turnstile / hCaptcha account + site/secret keys. Route is orphan (unreferenced). Decision needed: provide keys OR delete the orphan scaffold route.
- Live Chat (`help-center` card) — needs a vendor (Intercom/Crisp/etc.). Decision needed: pick vendor OR drop the card and keep ticket-only.
- Suspicious-device telemetry (`auth/error/suspicious:50`) — orphan route; real device/geo signal needs a sign-in-event store. Same orphan-route decision as CAPTCHA.

## Per-fix protocol
Atomic commit each, live-verify in browser, regression test where logic added.

## EXECUTION STATUS (2026-06-12)
- WAVE 1 DONE: W1.1 CMS fail-hard (cd132f8a), W1.2 template iframe (f017aa78), W1.3 server CSV (5936e19c), W1.4 help categories+dedupe (4844ecca).
- WAVE 2 DONE: W2.6 test-event + W2.7 update (bfb80f1d), + SSRF guard (0cfbb837, security-review caught).
- WAVE 3 DONE: W3.8 ticket attachments (1efad8d0).
- Plus billing.upgrade server gate (7c2e33e7) from the prior security finding.
- WAVE 2.5 DONE (auth-linking arc built): f7526aef — Account rows on OAuth login + disconnect guard. Live-proven.

## W2.5 — why it is blocked (decision needed)
signIn callback (server/auth.config.ts:69) matches OAuth users by EMAIL and NEVER writes an `Account` row. So `connectedAccounts` (account.service.ts:61) is always empty and the Settings → Account "Connect/Disconnect" buttons act on data that never populates. Safe real linking under the JWT session strategy (link the OAuth identity to the CURRENT logged-in user, not whoever the OAuth email maps to) is a real auth sub-arc, not a wire. Options:
  A) Build the auth-linking arc: write Account rows on OAuth sign-in + a session-aware link/unlink flow guarded against removing the last login method.
  B) Honest-disable the Connect/Disconnect buttons now (label "Social login linking coming soon") until the arc is scheduled.

## Still blocked on external setup (unchanged)
- Real CAPTCHA (auth/error/captcha) + suspicious-device telemetry (auth/error/suspicious) — orphan, unreferenced routes; real CAPTCHA needs a vendor (Turnstile/hCaptcha) + keys. Decision: provide keys & build, OR delete the orphan scaffold routes.
