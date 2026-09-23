# Settings · Clone S4 — PLUMBING-2 brief (Forms · Webhooks · Integrations)

Backend delta approved 2026-09-15 with the §5 defaults: **forms are definitions** (`Add form` creates
a `FormBlock` with no page; the canvas binds later), **webhook events are the code's**
(`site.publish`, `form.submit`), **integrations connect without OAuth** (a stored row, ACCOUNT `—`),
**`cleanUrls: true` ships** in the same `vercel.json` (canonical / sitemap / og:url name `/about`,
not `/about.html`). Base tip: `06f709119` (the shell's `registerHeader`, `IMMEDIATE_SCREENS` +
forms/integrations, `SAVE_ERROR_MESSAGES.webhooks`, the Hub retired — `case "integrations"` renders
`IntegrationsScreen`). Plan: `docs/plans/2026-09-14-settings-clone.md`; delta:
`phase4-backend.md`; S1–S3 logs for the shell's habits.

Frames (shots in `shots/`): `3397-32678` Forms + `3397-33669` loading + `3397-33716` empty +
`3397-33765` error + `3397-33812` action-error + `3397-33860` inbox-loading + `3397-33907`
inbox-empty + `3397-34304` delete-submission-confirm + `3445-14050` Submission deleted ·
`4254-76050` Add form · `4265-26908` Manage form · `3397-32769` Webhooks + `3397-33954` loading +
`3397-34001` empty + `3397-34050` load-error + `3397-34097` save-error · `3397-34499` Integrations +
`3951-49259` loading + `3951-49414` load-error · `3873-25643` Browse all · `3866-25629` Manage ·
`3856-25582` Connect. Precedence: CURRENT DESIGN frames win over REFERENCE VARIANTs; a later /
more specific frame wins; S1's shell habits (LoadCard copy pattern, banner + footer) hold where a
state frame draws an older card. Density 32 (`founder:density-32`). Sample data = shape.

## Screens, as decided

**Forms (`3397:32678`)** — header `Visitors / Forms` · `Add form` (header action) · grey info strip
`Form and submission actions apply as soon as you confirm them. There is nothing to save on this
screen.` · amber strip `Restoring a site version does not change form configuration or
submissions.` (`SET_RESTORE_STRIP`) · card **Forms on this site** (`3 forms · 38 submissions` right)
· line `What each form asks for, whether it is live, and where replies are sent` · table `FORM NAME ·
FIELDS · SUBMISSIONS · STATUS (LIVE green / PAUSED grey pill) · Manage` (32 secondary) · card
**Submissions** · line `Entries people sent through those forms · newest first · <n> total` · table
`FORM · FROM · RECEIVED (d MMM, HH:mm) · STATUS (NEW pill when unread) · Delete` (32 danger). Footer:
the shell's immediate footer (`Actions apply immediately · nothing to save here` · Done). Paged
submissions: 20 per page, `Load more` under the table when `total > shown` (no frame draws paging —
the S7 screen's `Load more` stays).
**Add form (`4254:76050`, 640)** — `Add form` · `<site> · Forms` · Form name · `Fields` (`<n> fields`)
table `FIELD LABEL · TYPE (mono) · REQUIRED (Required / Optional)` + `+ Add field` (a row editor:
label, type select `text · email · textarea · phone · date · number · select · checkbox`, required
toggle) · `Send submissions to` (email) · boxed `Spam protection` toggle `Honeypot field and rate
limiting on submit.` · note `Submissions are stored in Buildrick and emailed to the address above.
Fields and delivery can be changed after the form is created.` · Cancel · Create form →
`forms.create` → the row joins the table (LIVE). Validation: name required, ≥1 field, email shape.
**Manage form (`4265:26908`, 640)** — `Manage form` · `<site> · Forms · <name>` · Form name · Status
`Live / Paused` segmented · Fields table with `Edit · Remove` per row + `+ Add field` · Send
submissions to · `Delete form` (danger, left) · Cancel · `Save form` → `forms.update`; Delete → a
confirm (`Delete <name>? Its <n> submissions go with it.` · Cancel · Delete form) → `forms.delete`.
**Delete this submission? (`3397:34304`, 480)** — `Delete the <Form> submission from <from>,
received <d MMM at HH:mm>? This permanently removes this message. Export CSV first if you need a
copy.` · Cancel · `Delete submission` (danger) → `deleteSubmission` → the row leaves; the Submissions
line reads `<from>'s submission deleted` for that visit (`3445:14050`'s substance — its Provider card
and DELIVERED pills are the older screen and lose).
**States** — loading (`3397:33669`): LoadCard `FORMS` · `Submissions inbox + config.` · `Loading…`;
empty (`3397:33716`): the Forms card's own `No forms yet. Add one to start collecting replies.` +
`Add form`, no Submissions card, no header button; error (`3397:33765`): LoadCard `Couldn't load
your forms. Check your connection, then try again.` + Try again; action-error (`3397:33812`): the
banner `Could not delete this submission. It is still in your inbox.` over the cards (the frame's
sentence; `SaveErrorBanner`), the row stays; inbox-loading (`3397:33860`): the Submissions card body
`Loading submissions…`; inbox-empty (`3397:33907`): `No submissions yet. Replies land here the
moment someone sends one.` The two reads are one `useServerLoad` (blocks + first page); a page 2+
read shows the inbox-loading line only.

**Webhooks (`3397:32769`)** — header `Workspace / Webhooks` · grey strip `Endpoint details save when
you press Save endpoint. Enabling, disabling and deleting an endpoint apply immediately.` · amber
strip (`SET_RESTORE_STRIP`) · card **Endpoint** · row `Signing secret` (192 label) → mono well
`whsec_…` (masked to 12 chars + `…`) · `rotate every 90 days` (or `rotated <n> days ago` when older
than 90 → the well's line turns warning) with a `Rotate` quiet button (`regenerateSecret`, a confirm
`Rotate the signing secret? Your receiver stops verifying until it has the new value.`) ·
`Endpoint URL` (input) and `Events` (a multi-select built as two `SwitchRow`s under the label:
`site.publish` `When a site is published`, `form.submit` `When a form is submitted`) side by side
(two columns) · `Save endpoint` (primary, right) · under the card: `Enabled` SwitchRow
(`webhooks.setActive`, immediate) and `Delete endpoint` (danger text, a confirm) · card **Recent
deliveries** · table `EVENT · ATTEMPTED (d MMM, HH:mm) · RESPONSE (200 OK / 502 Bad Gateway / the
error) · STATUS (DELIVERED green / FAILED red)` from `webhooks.deliveries({ limit: 20 })`; none →
`No deliveries yet.` Footer: the shell's `All changes saved / Unsaved changes · Cancel · Save changes`
— the screen registers `registerSaveHandler` = the same `connect` the card's `Save endpoint` runs;
dirty = URL / events vs the loaded row.
**States** — loading (`3397:33954`): LoadCard `WEBHOOKS` · `One endpoint per workspace. Buildrick
POSTs JSON, signed with HMAC-SHA256 in the x-buildrick-signature header.` · `Loading…`; empty
(`3397:34001`): the card's `No endpoint connected.` + `Connect endpoint` (primary) → the Endpoint
card's form empty (`Save endpoint` creates); load-error (`3397:34050`): `Couldn't load your webhook.
Check your connection, then try again.` + Try again; save-error (`3397:34097`): the banner
`Couldn't save the webhook. Your endpoint is still here. Check the connection and retry.` (the
shell's `SAVE_ERROR_MESSAGES.webhooks`) · footer `Changes not saved` · Retry save.

**Integrations (`3397:34499`)** — header `Advanced / Integrations` · `Third-party OAuth` · `Browse
all` (header action) · card **Connected** table `SERVICE · SCOPE · STATUS (CONNECTED green) · Manage`
· card **Available** table `SERVICE · SCOPE · STATUS (AVAILABLE grey / COMING SOON grey) · Connect
(disabled for coming-soon)` · footer immediate (`Connecting an app applies immediately · nothing to
save here` · Done). Connected empty → the card's `Nothing connected yet. Pick a service below.`
**Browse all (`3873:25643`)** — a sub-view inside the screen: `registerHeader({ title: "Browse all",
subtitle: "All available integrations for <site>" })`, header action `‹ Back to Integrations`
(quiet link) · search input `Search integrations…` (filters name + scope) · `Category` chips `All ·
Payments · Marketing · Automation · Forms` (the catalog's categories; `email` shows as `Marketing`) ·
3-col cards `<name>` + pill + scope line + `Manage` (connected) / `Connect` (available) / `Connect`
disabled (coming soon) · `Showing 1–6 of <n>` + `‹ Previous · 1 · Next ›` at 6 per page.
**Manage (`3866:25629`)** — sub-view: `registerHeader({ title: "Manage", subtitle: "Connection
details and account" })`, `‹ Back to Integrations` · card `<Service>` + CONNECTED pill · eyebrows
`ACCOUNT` (`<account> · <site>`; `—` without one) · `ACCESS SCOPE` (the catalog scope) · `STATUS`
(`Connected · Active since <d MMM yyyy>`) · hairline · `Disconnect` (danger) · `You'll be asked to
confirm before this integration is disconnected.` → confirm `Disconnect <Service>? <Service> stops
receiving <site>'s events at once.` · Cancel · Disconnect → `integrations.disconnect` → back to the
list.
**Connect (`3856:25582`, 480)** — `Connect <Service>` · `<Service> needs access to: <scope
sentence from the catalog>. Review scopes or disconnect anytime from Manage.` · Cancel · Connect →
`integrations.connect` → the row moves to Connected (no OAuth — `blocked:external`, the row is the
product's record).
**States** — loading (`3951:49259`): LoadCard `INTEGRATIONS` · `Third-party services connected to
this site with OAuth.` · `Loading…`; load-error (`3951:49414`): `Couldn't load your integrations.
Check your connection, then try again.` + Try again. Integrations is PRO-gated (the shell's
LockedScreen on FREE — the walk flips the plan).

## Contracts

```ts
// packages/shared/schemas/forms.ts (B)
formFieldSchema = z.object({ id, label (1..80), type: z.enum(["text","email","textarea","phone","date","number","select","checkbox"]), required: z.boolean(), options?: string[] })
createFormSchema = z.object({ siteId, name (1..80), fields: formFieldSchema[] (min 1), notifyEmail: email | null, spamProtection: boolean })
updateFormSchema = z.object({ id, name?, isActive?, fields?, notifyEmail?, spamProtection? })
forms.listBlocks({ siteId }) rows += { submissionCount: number, spamProtection: boolean }
forms.create(createFormSchema) → FormBlock (pageId null, blockId = id) · forms.update · forms.delete({ id })
// packages/shared/schemas/webhooks.ts (B)
WEBHOOK_EVENTS = [{ id: "site.publish", label: "When a site is published" }, { id: "form.submit", label: "When a form is submitted" }]
webhookDeliverySchema = { id, event, status: "OK" | "FAILED", httpStatus: number | null, error: string | null, createdAt: ISO }
webhooks.status() += { isActive: boolean, secretRotatedAt: ISO } · webhooks.deliveries({ limit }) → WebhookDelivery[] · webhooks.setActive({ active })
// packages/shared/schemas/integrations.ts (B)
INTEGRATION_CATALOG entries += { scope: string, comingSoon?: true }; + slack (comingSoon)
integrationStatusSchema = { id, name, scope, category, status: "connected" | "available" | "coming-soon", connectedAt: ISO | null, account: string | null }
siteDetail.integrations.list({ siteId }) → IntegrationStatus[] · connect({ siteId, provider }) · disconnect({ siteId, provider })
// shell (main, at 06f709119)
ScreenProps.registerHeader({ title?, subtitle? } | null)   // sub-views
IMMEDIATE_SCREENS = domains · forms · integrations; SAVE_ERROR_MESSAGES.webhooks = the frame's sentence
```
Until B lands, each E-agent types its stand-in in a temporary `screens/<name>Contract.ts` (deleted
at merge, like S3's `redirectsContract.ts`) and calls `client.<router>` through an `as unknown as`
cast there — nowhere else.

## Work split

| agent | owns | delivers |
|---|---|---|
| **B** backend | migration `settings_s4_forms_webhooks` (`FormBlock.spamProtection`, `WorkspaceWebhook.isActive`); the three shared schema files; `server/trpc/routers/{forms,webhooks,site-detail}.ts` + `server/services/{form-submission,webhook,site-detail}.service.ts`; `deliverWebhook` skips inactive; the public submit route honours `spamProtection: false` (skip honeypot + rate limit for that form); `cleanUrls: true` in `lib/publish-files.ts` + `pageCanonicalUrl` / sitemap / og:url in `lib/publish-urls.ts` name clean paths (`/` for index, `/about` for about.html) + their tests; the seed (`prisma/seed-settings-clone.ts`: third form PAUSED, one form `spamProtection: false`, five deliveries 3 OK · 2 FAILED, webhook `isActive`, integrations rows `stripe`, `mailchimp` with `config.account`); tests for every procedure | the migration, the surface, the seed, `packages/dashboard` tsc `--types node` clean, root `npx vitest run server packages/shared lib` green |
| **E1** Forms | `screens/FormsScreen.tsx` (rewrite) + test, new `components/{FormDialog,DeleteSubmissionDialog}.tsx` (+ tests; one dialog component for Add and Manage), `screens/formsContract.ts` (temp), `searchIndex.ts` forms rows | the screen, the two dialogs + the delete-form confirm, the 7 states |
| **E2** Webhooks | `screens/WebhooksScreen.tsx` (rewrite) + test, `screens/webhooksContract.ts` (temp), `searchIndex.ts` webhooks rows | the screen, the confirms (rotate, delete), the 5 states |
| **E3** Integrations | `screens/IntegrationsScreen.tsx` (rewrite) + test, new `components/{ConnectIntegrationDialog,DisconnectIntegrationDialog}.tsx` (+ tests), the Browse all + Manage sub-views inside the screen, `screens/integrationsContract.ts` (temp), `searchIndex.ts` integrations rows | the screen, both sub-views, both dialogs, the 2 states |
| main | merges + folds, migrate + seed, the plan flip, the live walk, `boards.json`, `phase4-journeys.md` | — |

Rules for every agent: `git merge --ff-only 06f709119` first; one fix = one commit
`J-<nodeId>: implemented — …` / `backend — …`; never stage `AquibraStudio.tsx` or
`scripts/baselines/ssot.json`; no push; chrome-ui only (no raw inputs/buttons — Gate 24); `tw:`
utilities + `--bk-*` tokens; the `shared.tsx` primitives (`Screen · Section · Field · Input · Select ·
Textarea · SwitchRow · LoadCard · SaveErrorBanner · SET_BTN · SET_EYEBROW · SET_CARD ·
SET_RESTORE_STRIP · SET_ROW · SET_ROW_LABEL`); `hooks/useServerLoad`; `registerHeaderAction` for the
header primary; the load / save states through `ScreenProps`; `bash scripts/ds-grep-gates.sh` and
`pnpm run gate:styling-ratchet` green; tests rewritten with the design in the same commit. Report:
the tip, per-frame verdicts, contradictions decided, contract notes, what is not done.

## Testids

Forms: `set-fm-add` (header) · `set-fm-count` · `set-fm-row-<id>` · `set-fm-manage-<id>` ·
`set-fm-status-<id>` · `set-fm-empty` · `set-fm-empty-add` · `set-fm-sub-row-<id>` ·
`set-fm-sub-delete-<id>` · `set-fm-sub-status-<id>` · `set-fm-sub-empty` · `set-fm-sub-loading` ·
`set-fm-sub-more` · `set-fm-sub-deleted` · dialog `set-fm-dialog` · `set-fm-name` · `set-fm-field-row-<i>`
· `set-fm-field-add` · `set-fm-field-label` · `set-fm-field-type` · `set-fm-field-required` ·
`set-fm-field-save` · `set-fm-field-remove-<i>` · `set-fm-notify` · `set-fm-spam` · `set-fm-status-live`
· `set-fm-status-paused` · `set-fm-delete` · `set-fm-cancel` · `set-fm-submit` · `set-fm-error` ·
delete confirm `set-fm-sub-confirm` · `set-fm-sub-confirm-cancel` · `set-fm-sub-confirm-delete` ·
form confirm `set-fm-confirm` · `set-fm-confirm-delete`.
Webhooks: `set-wh-secret` · `set-wh-secret-age` · `set-wh-rotate` · `set-wh-rotate-confirm` ·
`set-wh-url` · `set-wh-event-<id>` · `set-wh-save` · `set-wh-enabled` · `set-wh-delete` ·
`set-wh-delete-confirm` · `set-wh-empty` · `set-wh-connect` · `set-wh-delivery-<id>` ·
`set-wh-delivery-status-<id>` · `set-wh-deliveries-empty`.
Integrations: `set-in-browse` (header) · `set-in-back` · `set-in-row-<id>` · `set-in-status-<id>` ·
`set-in-manage-<id>` · `set-in-connect-<id>` · `set-in-connected-empty` · browse `set-in-search` ·
`set-in-cat-<id>` · `set-in-card-<id>` · `set-in-page-prev` · `set-in-page-next` · `set-in-page-<n>` ·
`set-in-showing` · manage `set-in-account` · `set-in-scope` · `set-in-since` · `set-in-disconnect` ·
dialogs `set-in-connect-dialog` · `set-in-connect-confirm` · `set-in-disconnect-dialog` ·
`set-in-disconnect-confirm`. Each control's `id` = its testid where Search lands on it; the S7
anchors (`set-card-form`, `set-card-submissions`, `set-card-endpoint`, `set-field-signing-secret`)
stay on the cards / rows.
