# Settings · Clone S4 — backend delta (for the founder's "go")

Phase: **S4 PLUMBING-2** — Forms · Webhooks · Integrations, their states, and the overlays the
section reaches: `4254:76050` Add form · `4265:26908` Manage form · `3873:25643` Browse all ·
`3866:25629` Manage (an integration) · `3856:25582` Connect Zapier (all five cached, 5 calls; 94
spent on 2026-09-14). Frames: `3397:32678` Forms + `3397:33669` loading + `3397:33716` empty +
`3397:33765` error + `3397:33812` action-error + `3397:33860` inbox-loading + `3397:33907`
inbox-empty + `3397:34304` delete-submission-confirm + `3445:14050` Submission deleted ·
`3397:32769` Webhooks + `3397:33954` loading + `3397:34001` empty + `3397:34050` load-error +
`3397:34097` save-error · `3397:34499` Integrations + `3951:49259` loading + `3951:49414`
load-error. Nothing below is built until this doc is approved (plan Q3c). **This phase has two
small migrations and one product question (forms without a block).**

## 1. What the frames need vs what the code has

### Forms (`3397:32678`, `4254:76050` Add form, `4265:26908` Manage form, `3397:34304`, `3445:14050`)

| the frame draws | code today | delta |
|---|---|---|
| grey strip `Form and submission actions apply as soon as you confirm them. There is nothing to save on this screen.` + the amber restore strip · footer `Actions apply immediately · nothing to save here` · Done | the S2 immediate-screen footer (Domains) | client (`IMMEDIATE_SCREENS` + forms) |
| **Forms on this site** `3 forms · 38 submissions` · table `FORM NAME · FIELDS · SUBMISSIONS · STATUS (LIVE / PAUSED) · Manage` | `forms.listBlocks({siteId})` → `FormBlock` rows (`name`, `fields` Json, `isActive`, `notifyEmail`); no per-form submission count | `listBlocks` returns `submissionCount` (`_count`), no schema change |
| header **`Add form`** → dialog: Form name · Fields table `FIELD LABEL · TYPE · REQUIRED` + `+ Add field` · `Send submissions to` (email) · **`Spam protection`** toggle (`Honeypot field and rate limiting on submit.`) · `Submissions are stored in Buildrick and emailed to the address above…` · Cancel · Create form | a `FormBlock` row is created by the EDITOR when a form block is placed (`blockId`, `pageId`); nothing creates one from Settings; no spam column | **new `forms.create`** (`FormBlock` with `pageId: null`, `blockId` = its own id, `fields`, `notifyEmail`, `spamProtection`) + **migration** `FormBlock.spamProtection Boolean @default(true)` (the submit route already honeypots + rate-limits every form — the column makes it per-form and switchable; off = the route skips both). **The product question is §5.1.** |
| **Manage form** (`4265:26908`): name · Status `Live / Paused` · Fields with `Edit · Remove` · `+ Add field` · Send submissions to · `Delete form` (danger, left) · Cancel · Save form | `isActive` exists; no `update` / `delete` for blocks | **new `forms.update`** (`{ id, name?, isActive?, fields?, notifyEmail?, spamProtection? }`) and **`forms.delete`** (cascades submissions — the dialog says so) |
| **Submissions** `Entries people sent through those forms · newest first · 38 total` · table `FORM · FROM · RECEIVED · STATUS (NEW) · Delete` | `forms.listSubmissions` (paged, `isRead` → NEW), `updateSubmission`, `deleteSubmission`, `exportSubmissions` | client; `FROM` = the submission's email-shaped field (first `email` field, else the first value) — a client rule over `data` |
| `3397:34304` **Delete this submission?** `Delete the <Form> submission from <from>, received <d MMM at HH:mm>? This permanently removes this message. Export CSV first if you need a copy.` · Cancel · Delete submission → `3445:14050` **Submission deleted** (the row leaves, `<from>'s submission deleted` line) | `deleteSubmission` | client (a confirm the S7 screen never had) |
| loading · empty (`No forms yet…`) · error · action-error (banner) · inbox-loading · inbox-empty | client | client — two load states on one screen (forms, inbox), each with its own card |

### Webhooks (`3397:32769` + 4 states)

| the frame draws | code today | delta |
|---|---|---|
| grey strip `Endpoint details save when you press Save endpoint. Enabling, disabling and deleting an endpoint apply immediately.` + restore strip | — | client |
| **Endpoint** card: `Signing secret` `whsec_… · rotate every 90 days` (mono well) · `Endpoint URL` · `Events` (a select: `site.published, review.approved`) · `Save endpoint` | `WorkspaceWebhook` (ONE per workspace: `url`, `secret`, `events` ∈ `site.publish`, `form.submit`), `webhooks.{status, connect, disconnect, regenerateSecret}`; the loopback guard | client over the existing surface; **the event ids are the code's** (`site.publish`, `form.submit` — the frame's `site.published` / `review.approved` are sample copy; nothing emits `review.approved`, §5.2); `rotate every 90 days` = `regenerateSecret` + the secret's age from `updatedAt` (client line, no column) |
| **enable / disable** an endpoint (the strip says they apply at once) | no `isActive` — `disconnect` deletes the row | **migration** `WorkspaceWebhook.isActive Boolean @default(true)`; `webhooks.setActive({ active })`; the dispatcher (`webhook.service.ts` `dispatch`) skips an inactive endpoint |
| **Recent deliveries** table `EVENT · ATTEMPTED · RESPONSE (200 OK / 502 Bad Gateway) · STATUS (DELIVERED / FAILED)` | `WebhookDelivery {event, status OK|FAILED, httpStatus, error, createdAt}`; `status` returns only the LAST delivery | **new `webhooks.deliveries({ limit })`** (newest first, 20) → `{ id, event, status, httpStatus, error, createdAt }`; `RESPONSE` = `httpStatus` + the reason phrase (client table) |
| footer `All changes saved · Cancel · Save changes` beside the card's `Save endpoint` | the S1 shell | the footer's Save IS `Save endpoint` (`registerSaveHandler` → `connect`); the card button is the same handler |
| loading · empty (`No endpoint yet`) · load-error · save-error | client | client |

### Integrations (`3397:34499`, `3951:49259`, `3951:49414`, `3873:25643` Browse all, `3866:25629` Manage, `3856:25582` Connect)

| the frame draws | code today | delta |
|---|---|---|
| header `Advanced / Integrations` · `Third-party OAuth` · **`Browse all`** · **Connected** table `SERVICE · SCOPE · CONNECTED · Manage` · **Available** `AVAILABLE · Connect` · footer `Connecting an app applies immediately · nothing to save here` · Done | `INTEGRATION_CATALOG` (6: formspree, netlify-forms, stripe, mailchimp, convertkit, zapier — `id, name, description, category`) in shared; `WorkspaceIntegration { provider, config, isActive }` rows (the S1 overview counts them); the editor's `IntegrationsScreen` draws the catalog from `projectSettings.integrations` keys (client-only); the `integrations` router is **Vercel OAuth only**; `marketplace` is the WorkspaceApp store (a different thing) | **new `siteDetail.integrations.list({ siteId })`** → the catalog joined with the workspace's rows: `{ id, name, scope, category, status: "connected" \| "available" \| "coming-soon", connectedAt, account }`; catalog gains `scope` (the frame's `Payments · checkout sessions`) and `comingSoon` |
| **Connect** (`3856:25582`): `Connect Zapier` · `Zapier needs access to: … Review scopes or disconnect anytime from Manage.` · Cancel · Connect → the row moves to Connected | nothing | **new `integrations.connect({ siteId, provider })`** → a `WorkspaceIntegration` row (`config: {}`), **no OAuth handshake** — each provider's real OAuth is its own app registration (`blocked:external`, §5.3). The row is what the overview, the badges and Manage read. |
| **Manage** (`3866:25629`): `<Service>` · CONNECTED · ACCOUNT `<account> · <site>` · ACCESS SCOPE · STATUS `Connected · Active since <d MMM yyyy>` · `Disconnect` (`You'll be asked to confirm…`) · `‹ Back to Integrations` | nothing | **`integrations.disconnect({ siteId, provider })`** (deletes the row) + a confirm; ACCOUNT = `config.account ?? "—"` (no OAuth → no account) |
| **Browse all** (`3873:25643`): search · Category chips `All · Payments · Marketing · Automation · Forms` · cards with `CONNECTED / AVAILABLE / COMING SOON` + `Manage / Connect` · `Showing 1–6 of 18` · pagination | the 6-entry catalog | client over `list`; **the catalog stays 6** (the `18` is sample data — the shape is the contract; Slack `COMING SOON` is added as the one `comingSoon` entry so the state exists); pagination at 6 per page |
| loading · load-error | client | client |

## 2. Migrations (`settings_s4_forms_webhooks`)

```prisma
model FormBlock        { spamProtection Boolean @default(true) }
model WorkspaceWebhook { isActive       Boolean @default(true) }
```
Reversible. Local `migrate deploy` (hand-written, as S2/S3); prod is the founder's.

## 3. New / changed server surface

| procedure | kind | notes |
|---|---|---|
| `forms.listBlocks` | changed | `+ submissionCount`, `+ spamProtection` |
| `forms.create` / `update` / `delete` | new | shared `createFormSchema` / `updateFormSchema` (`fields`: `{ id, label, type: text \| email \| textarea \| phone \| date \| number \| select \| checkbox, required }[]`, the block's own field shape) |
| `webhooks.deliveries` | new query | `{ limit }` → the last N `WebhookDelivery` rows |
| `webhooks.setActive` | new | `{ active }`; `dispatch` skips inactive |
| `siteDetail.integrations.list` / `connect` / `disconnect` | new | over `WorkspaceIntegration` keyed by catalog id; `INTEGRATION_CATALOG` gains `scope`, `comingSoon`, + `slack` |
| `siteDetail.settingsOverview` | unchanged | `integrations.connected` already counts the rows; `forms` already counts blocks + submissions |
| shared schemas | `packages/shared/schemas/{forms,integrations,webhooks}.ts` | the inputs above; `webhookDeliverySchema`, `integrationStatusSchema` |

Tests: the three routers' access (`guardSite` / workspace role — `forms.*` is site-scoped,
`webhooks.*` and `integrations.*` workspace-scoped as today), `forms.delete` cascades, the
dispatcher's inactive skip, `list` joins (connected / available / coming-soon), the overview
unchanged.

## 4. Seed + fixtures

S1's seed already has 3 forms / 38 submissions, 1 webhook + a failed delivery, 2 integrations
(`stripe`, `mailchimp`). This phase: the third form `PAUSED`, one form with `spamProtection: false`,
five deliveries (3 OK · 2 FAILED with `502` / a timeout error) so the table has rows, the webhook
`isActive: true`. Forced states as before (fetch patched in the page). The deliveries are the
seed's — no real receiver (`blocked:external` for a live delivery; the dispatcher is unit-tested).

## 5. Open questions (decide with the "go")

1. **A form created in Settings has no block on a page.** `Add form` (4254:76050) creates a
   `FormBlock` with `pageId: null` — it collects nothing until a form element binds to it. Options:
   **A (recommended)** ship the dialog as drawn; the row is a form definition the editor's form
   element can pick later ("Use existing form" in its inspector — a later phase); the table's
   `FIELDS` / `STATUS` are true either way. **B** hide `Add form` and keep the screen to forms the
   canvas created (the frame's header button is not built). **C** the dialog creates the row AND
   inserts a form block on the current page (a canvas mutation from Settings — the door out is
   Back to canvas with the block selected).
2. **Webhook events are the code's** (`site.publish`, `form.submit`); the frame's `site.published,
   review.approved` is sample copy and nothing emits a review event. OK to draw the two real events
   (labels as the frame styles them)?
3. **Integrations connect without OAuth.** `Connect` stores a row and shows CONNECTED; ACCOUNT reads
   `—`. A real handshake per provider (Stripe, Mailchimp, ConvertKit, Zapier, Formspree, Netlify) is
   six app registrations + callback routes — `blocked:external`, recorded per row. OK, or gate
   `Connect` behind `comingSoon` for every provider without an app (then the Connected table is
   the seed's two rows only)?
4. **`cleanUrls`** (carried from S3): the deploy serves `<slug>.html`, so every redirect
   destination and the suggester's `/<slug>` point at a 404 until `cleanUrls: true` ships in the
   same `vercel.json` — which also changes what the sitemap and canonical name (`/about` instead of
   `/about.html`). Go with it in S4 (B's row: `publish-urls.ts` + `publish-files.ts` + the tests),
   or leave the URLs as they are?
