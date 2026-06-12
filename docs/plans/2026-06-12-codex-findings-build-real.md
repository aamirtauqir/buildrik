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
