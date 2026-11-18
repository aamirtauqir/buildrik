# Panel 25 — Analytics events catalogue: functionality specification (FD-PNL-25)

Date 2026-10-17 · Branch main @ `19f964d5e` · Mode: DESIGN ONLY
Status: **SPEC COMPLETE (written scope) · blocked by A-1, A-3, A-4 · not VERIFIED.** Independent design-qa-critic review: pass 1 PROPOSAL (5 blocking) + 13 notes — fixed 2026-10-17; pass 2: 2 blocking fixed 2026-10-17. OD-A1…A8 decided as recommended (SC-22); no AI events this version (SC-21). Runtime NOT RUN: every "today" fact below comes from reading the source on 2026-10-17 (file:line), not from a running app or a production log. *(DS)* = designer-selected; **OD-A…** = owner decision with a recommendation. Panel 00 (SC-1…SC-22) wins on conflicts; 00-STRATEGY §4–§6 and Panel 16 §7 are the inputs this panel completes.
**2026-10-18 owner decisions applied** (design-audit-2026-10-18/OWNER-DECISIONS-2026-10-18.md): S7 (new `check_ids` value); FINAL §4 item 11 (D3-1); gap rows D3-1, D3-14 (§4.3 owner column → 17).

**No AI in this version (owner 2026-10-17, Panel 00 SC-21):** every AI entry point in this panel is hidden; AI text below is kept for the later AI Build tab; backend unchanged.

Governing: 00-STRATEGY §4 core loop, §5 activation, §6 metrics (north star **sites published per week**), Panel 16 §7 (events + data contract) and F-1, Panel 14 (publish states), SC-18 (plan limits, AI), SC-20 (Free + Pro, 30-day trial), SC-9 (dependencies), SC-11 (nouns).

---

## 1. Purpose and boundary
Job: S supporting — measures J1 Build, J2 Get approval and J3 Publish and maintain (00-STRATEGY §3, §6) *(R-1018)*

This panel is the **single list of product events** for the editor and the parts of the dashboard and server that sit on the core loop. It answers: **"Did the designer build, get approval, publish and keep maintaining the site, and where did they stop?"** Each event has one name, one firing condition, enum-only properties, one owning panel and the metric it feeds.

- In: event names, firing conditions, properties, common envelope, the activation, north-star, funnel, health and trial-conversion reports, the data contract (privacy, hashing, retention, opt-out), naming rules, event QA.
- Out (separate systems, kept as they are — §9): **published-site visitor analytics** (Panel 10 Analytics: the customer's visitors, not our users), customer GA/Ads injection, error tracking (Sentry), the user-facing **Activity** feed (ActivityLog), customer **webhooks**, notifications, auth audit log.
- Not a UI. The only user-facing surface is the opt-out row (§6.4); dashboards for reports are internal tooling and not designed here.

## 2. Current telemetry inventory (source-read 2026-10-17; runtime NOT RUN)
Editor paths under `packages/editor/src/`; dashboard paths under `packages/dashboard/`; `route.ts` = the publish worker `packages/dashboard/app/api/workers/publish/[jobId]/route.ts`.

**No product-analytics pipeline exists.** No PostHog, Segment, Mixpanel, Amplitude or gtag in editor or dashboard app code; the only telemetry dependency is Sentry (`package.json` `@sentry/nextjs`, `packages/editor/package.json` `@sentry/react`). Not one of the 00-STRATEGY §6 funnel events is emitted today.

| ID | Source | Today | Reaches a store? |
|---|---|---|---|
| AN-01 | Editor cold load | `reportColdLoad` writes `{metric:"editor.cold_load_ms", value, siteId, route_unified, ts}` with `console.info` (`components/editor-route/EditorClient.tsx:13-29`, called `:33`). It fires in `EditorClient`'s effect while `AquibraStudio` is still a `dynamic()` import showing the skeleton (`:8-11`) | **No**. It only goes to the browser console; the comment says "replace with the SDK call" (`:18-19`). Measures time to skeleton, not editor ready (§13 D-3) |
| AN-02 | AI adoption (only real product telemetry) | Client `services/ai/adoptionTracker.ts`: `send()` fire-and-forget to tRPC `ai.logAdoption` (`:23-31`); `trackAiEditApplied` (`:43`), `trackAgentRun` (`:61`, called `editor/sidebar/tabs/ai/hooks/useAgentRunner.ts:138`), `attachAdoptionRevertListener` on `HISTORY_UNDO` (`:89-97`, attached `editor/shell/hooks/useComposerInit.ts:583`). Schema `packages/shared/schemas/ai-adoption.ts:14-38` (events `edit.applied` / `edit.reverted` / `agent.run`; structural props only). Router `server/trpc/routers/ai.ts:484-489`; service checks membership, swallows errors (`server/services/ai-adoption.service.ts:10-42`); table `ai_adoption_events` (`prisma/schema.prisma:855-871`); read path `scripts/ai-adoption-report.ts` | Yes, Postgres. But **`trackAiEditApplied` has no production caller** (tests only), so `edit.applied` never fires (§13 D-1). Raw `actorId`, no retention purge |
| AN-03 | Sidebar analytics stub | `shared/utils/sidebarAnalytics.ts:35-44` `trackSidebar` → provider; `setSidebarAnalyticsProvider` (`:26`) has **no caller**, so it is a no-op. Call sites: `editor/sidebar/shared/SearchBar.tsx:64` (`search`, `query_length`), `editor/inspector/components/InspectorErrorBoundary.tsx:45` (`error`, **`message: error.message`**) | **No**. Would leak free text if wired (§13 D-2) |
| AN-04 | Sentry, dashboard | `sentry.server.config.ts:9-15`, `sentry.edge.config.ts`, loaded by `instrumentation.ts:11-19` only when `SENTRY_DSN` is set; `sentry.client.config.ts:11-19` gated on `NEXT_PUBLIC_SENTRY_DSN`; `withSentryConfig` `next.config.mjs:149`. All `sendDefaultPii:false`, `tracesSampleRate:0.1`. One explicit capture: `app/api/cron/workspace-deletion/route.ts:17` | Errors only. No `instrumentation-client.ts` exists; whether the client config loads under Next 16/Turbopack is **NOT VERIFIED** (§13 D-4) |
| AN-05 | Sentry, editor | `shared/utils/errorTracking.ts`: `initErrorTracking` (`:32-48`) is called only by `demo/main.tsx:26` (the port-5050 demo); `captureError` (`:54-71`) at `SettingsErrorBoundary.tsx:32`, `InspectorErrorBoundary.tsx:44`, `useComposerInit.ts:108,130`; `setUser` (`:77-84`) has no caller. `EditorErrorBoundary.tsx:24-28` only does `console.error` ("When Sentry is wired…") | Shipping editor: depends on sharing the dashboard's Sentry client, **NOT VERIFIED** (§13 D-4) |
| AN-06 | Onboarding state | `OnboardingState` per **user** (`prisma/schema.prisma:922-943`): `dashboardTasks` / `editorTasks` string sets, `dismissed` boolean. `completeDashboardTask` (`server/services/onboarding.service.ts:111-126`), `completeEditorTask` (`:137-148`, called by `editor/onboarding/useOnboardingOrchestrator.ts:119`), `dismissOnboarding` (`:150-155`). The dashboard checklist marks a task done **on click** (`components/onboarding/dashboard-checklist.tsx:117-120`) | State, not events: no timestamps, no site, a click counts as done (§13 D-6) |
| AN-07 | Activity log (user-facing feed) | `server/services/activity-log.service.ts:5-27` union (`site.published`, `site.publish_failed`, `site.unpublished`, `site.rolled_back`, `site.settings.updated`, `site.share_link.*`, `site.domain.*`, `site.redirect.*`, `site.deleted/restored`, `review.revoked`, `MEMBER_*`); `record()` swallows errors (`:41-59`). Publish writes it with `actorId: site.lastPublishedBy` (`route.ts:176-186, 232-240`). `api-tokens.ts:90-99` writes `workspace.api_token.revoked` straight through Prisma, outside the union | Yes, but it is a product feed with free-text `description` and mixed naming. Not an analytics source (§9) |
| AN-08 | Workspace webhooks | `deliverWebhook` (`server/services/webhook.service.ts:152`): `site.publish` `{siteId, jobId, url}` (`route.ts:152-156`), `form.submit` (`server/services/form-submission.service.ts:173`); deliveries logged (`prisma/schema.prisma:1578-1612`) | The customer's integration, not our telemetry |
| AN-09 | Notifications | `notifyWorkspaceOwner` → owner only (`server/services/notification.trigger.ts:54-66`): `SITE_PUBLISHED` (`route.ts:168`), `SITE_PUBLISH_FAILED` (`:224`), `REVIEW_LINK_REQUESTED` (`server/services/client-review.service.ts:407`), form submissions (`form-submission.service.ts:129`) | User messaging, not telemetry |
| AN-10 | Server logs | `[publish-worker] job= site= pages= mode=vercel\|simulation` (`route.ts:86-89`); `[ai-generate-worker] job= pages= type=` (`app/api/workers/ai-generate/[jobId]/route.ts:156`); `[scheduled-publish] due= started=…` (`app/api/cron/scheduled-publish/route.ts:57`); `[ai] provider:` (`server/services/quota.service.ts:152`) | cPanel stdout only. No aggregation |
| AN-11 | Tables that can rebuild history (backfill) | `PublishBuildJob` status/start/complete/`rolledBackFrom`, **no actor column** (`prisma/schema.prisma:1440-1467`); `ReviewRequest` status `PENDING/APPROVED/CHANGES_REQUESTED` + `resolvedAt` (`:536`); `Reviewer.firstSeenAt` (`:587`); `Comment` author/reviewer + `createdAt` (`:498-520`); `Subscription` plan/status (`:757`), Stripe handlers (`server/services/stripe-webhook.service.ts:42,84,140,218,248`); `AIUsage` per user per day (`:836-848`, `quota.service.ts:85-125`); `AuditLog` auth (`:303-317`); `CmsEntry` (`:478`); `MediaAsset` (`:1062`) | Yes: these are the fallbacks while the pipeline is missing (§11) |
| AN-12 | Published-site visitor analytics (customer data) | beacon injected at publish (`lib/publish-html.ts:14-26`) → `app/api/public/track/[siteId]/route.ts` (rate-limited per IP+site) → `AnalyticsEvent` (`prisma/schema.prisma:963`), rolled up in `SiteAnalytics` (`:945`); purged after 30 days (`app/api/cron/analytics-purge/route.ts:12-16`). Customer GA/Ads injection `engine/export/AnalyticsInjector.ts:27-66` | Out of scope (§1): it is the customer's visitor data |
| AN-13 | Editor internal bus (what client events will listen to) | `shared/constants/events.ts`: `TEMPLATE_APPLIED` `:206`, `SITE_PUBLISHED` `:221`, `ASSET_UPLOADED` `:447`, `BRAND_APPLIED` `:563`, `REVIEW_SENT` `:577` (payload **`invitedEmail`**, `:993`); `PAGE_CREATED` `:556` is declared but page creation travels on `PROJECT_CHANGED` (`editor/onboarding/OnboardingMount.tsx:82`) | In-memory only |

No editor-telemetry opt-out exists (Panel 16 §7 confirmed; no such column in `prisma/schema.prisma`).

## 3. Problems this design solves (00-STRATEGY §6, all three jobs)
1. **The north star cannot be measured.** Publish has no actor (AN-11) and nothing counts publishes per designer per week. The activity log uses `site.lastPublishedBy`, which the next publish overwrites.
2. **Activation cannot be measured.** No `editor_opened` or `first_canvas_edit` exists. Onboarding state has no time and no site, and a dashboard click counts as done (AN-06).
3. **The only real telemetry is half wired.** AI `edit.applied` never fires, so the AI revert rate has no denominator (AN-02).
4. **Stubs would leak free text** once someone wires them: `error.message` (AN-03) and `invitedEmail` on `REVIEW_SENT` (AN-13).
5. **Cold-load timing is lost** in the browser console and measures the skeleton (AN-01).
6. **Trial conversion (SC-20) has no signal.** Nothing records plan-limit hits, Upgrade clicks or trial start/end.
7. **No privacy contract.** Raw user ids, no retention on `ai_adoption_events`, no opt-out (AN-02, Panel 16 §7).

## 4. Event catalogue
### 4.1 Common envelope (every event) *(DS)*
`event` (catalogue name) · `event_id` (client UUID, for de-duplication) · `schema_v` (int) · `client_ts` + `server_ts` · `user_h`, `workspace_h`, `site_h` (pseudonymous ids, §6.2) · `session_n` — the **Panel 16 session**: it starts at `editor_opened` and ends after 30 minutes without input or when the editor closes. A reload or remount within 30 minutes **continues** the same session. The server assigns `session_n` per user+site (1 = that user's first session on the site); it is not per mount · `role` OWNER/ADMIN/EDITOR (VIEWER never sends — §6.1) · `plan_effective` free/trial/pro/business (SC-20 effective-plan resolver, P-TRIAL) · `app_version` · `origin` editor/dashboard/server.
Columns: **Src** C = client, S = server (recorded where the outcome becomes true *(DS)*). **Owner** = panel that owns the trigger. **Feeds**: NS north star, ACT activation, FUN loop funnel, H health, TR trial conversion, AI AI trust.

### 4.2 Session and build (job 1)
| Event | Fires when (exact) | Properties (enum/int/bool only) | Src | Owner | Feeds |
|---|---|---|---|---|---|
| `editor_opened` | the editor has mounted with a site and the user can edit (Panel 16 §7) | `site_creation_method` read on the server from `Site.creationMethod` (`prisma/schema.prisma:328`, default `BLANK`; writers `template.service.ts:150`, `sites.service.ts:234`, ai-generate `route.ts:207,218`): `BLANK`→blank, `TEMPLATE`→site_template, `AI`→ai, other→unknown. Duplicate and import have no value today (A-11) · `first_open` bool (no earlier `editor_opened` for this user+site — Panel 16 §7) · `site_first_open` bool (no earlier `editor_opened` for this site by anyone; computed on the server) | C | 16 / 01 | ACT FUN |
| `editor_ready` | first canvas frame painted after the project loaded (replaces AN-01) | `ms_from_navigation` int · `load_kind` cold/soft_route | C | 05 | H |
| `editor_session_ended` | the Panel 16 session ends: editor close, or 30 min without input | `active_min` int · `edit_count` int (committed document steps in the session) · `reason` close/idle/server_timeout. **Server fallback:** if no close event arrives, the server closes the session 30 min after its last received batch and writes `reason:server_timeout` from the counts in that batch. Edits made after the last batch are lost (accepted; at most 10 s of counts, §6.5) | C/S | 01 | NS (active designer) H |
| `first_canvas_edit` | **once per site** (Panel 16 T-FR-11): the first committed document change on this site by any user, excluding template apply and load (Panel 16 §7). The server refuses a second one for the same site | `ms_since_site_first_open` int (from the site's first `editor_opened`) · `in_session_1` bool (the edit falls in the session that contains the site's first `editor_opened`) | C | 05 | ACT FUN |
| `element_inserted` | an Add insert commits (click, drag, keyboard, AI section) | `kind` section/element/component_instance · `via` click/drag/keyboard/ai (`ai`: Not emitted this version (SC-21)) · `section_id` built-in id or the literal `custom` | C | 03 | FUN |
| `template_applied` | Panel 15 apply succeeds (Panel 16 §7) | `mode` create/replace · `template_id` built-in id or the literal `saved` | C | 15 | ACT |
| `page_created` | a page create commits | `method` blank/page_template/duplicate/collection_page | C | 11 | FUN |
| `preview_opened` | Preview has actually rendered (Panel 16 §7, SC-8) | `from` topbar/checklist/key/review_task · `breakpoint` desktop/tablet/mobile/custom | C | SC-8 / 01 | ACT FUN |
| `undo_after_delete` | an undo within 60 s restores something the user deleted | `object` element/page/component/record/asset · `within_s` int | C | 05 / SC-15 | H |
| `save_failed` | the bottom status enters Save failed or Conflict (Panel 11) | `reason` network/conflict/server/quota | C | 11 | H |

### 4.3 Review and approval (job 2)
| Event | Fires when | Properties | Src | Owner | Feeds |
|---|---|---|---|---|---|
| `review_link_sent` | a `ReviewRequest` is created (link copied or invite sent) | `round_number` int · `invited` bool (email given; the email is never sent) · `reviewer_count` int | S | 17 Client review *(R-1018, D3-14)* | FUN H |
| `review_link_opened` | a reviewer opens `/review/<token>` for the first time (`Reviewer.firstSeenAt` set) | `round_number` int | S | 17 Client review *(R-1018, D3-14)* | FUN |
| `client_comment_created` | a `Comment` with `reviewerId` is created | `pinned` bool (has x/y or target) · `round_number` int | S | 17 Client review *(R-1018, D3-14)* | FUN |
| `comment_resolved` | a comment moves to RESOLVED | `author_kind` client/member · `age_h` int | S | 17 Client review *(R-1018, D3-14)* | H |
| `client_approved` / `client_changes_requested` | `ReviewRequest.status` becomes APPROVED / CHANGES_REQUESTED | `round_number` int · `open_comments` int | S | 17 Client review *(R-1018, D3-14)* | FUN |
| `review_revoked` | review link revoked (today's `review.revoked`, `reviews.ts:283`) | `round_number` int | S | 17 Client review *(R-1018, D3-14)* | H |

### 4.4 Publish (job 3 — Panel 14)
| Event | Fires when | Properties | Src | Owner | Feeds |
|---|---|---|---|---|---|
| `publish_started` | `startPublish` creates a job | `first_publish` bool · `trigger` topbar/task/republish. The client sends it as an input, and the server checks it against the enum, storing `unknown` when it doesn't match. Republish is set on the server from `rolledBackFrom` · `warnings` int · `approval` none/approved/stale_override/owner_exempt · `pro_output_dropped` bool (SC-20 Free after trial) · `simulated` bool (P-5) | S | 14 | FUN |
| `publish_blocked` | the user presses Publish (CTA or dialog) and a Blocking row or hard blocker stops it | `check_ids`: a **closed enum**. One value per Panel 14 §5.2 Blocking row: `vercel_connected`, `pages_ready`, `collection_lists`, `site_size`, `password_on_free`, `unresolved_images`, **`motion_wcag_2_2_2`** (Panel 14 §5.2 "Motion that never stops on an automatic trigger", Panel 19 §5.8) *(R-1018, D3-1)*, **`vercel_protection_unsupported`** (S7: the connected Vercel plan can't password-protect the site) *(R-1018, S7 — Panel 14 must use this id for its new row)*. Plus the PB-02 hard blockers: `flag_off`, `viewer`, `offline`, `save_conflict`, `save_failed`, `site_over_free_limit` (the site is locked read-only after the trial — SC-20). **Panel 14 owns the list**: a new Blocking row there adds its value here in the same commit | C | 14 | H |
| `publish_succeeded` | job reaches COMPLETED | `first_publish` bool · `rollback` bool (`rolledBackFrom` set) · `simulated` bool (P-5; until then from the job's mode, as ActivityLog `metadata.mode` `route.ts:184`) · `duration_s` int · `pages` int | S | 14 | **NS** ACT FUN |
| `publish_failed` | job reaches FAILED | `failed_step` generate/deploy/ssl (the Panel 14 §5.4 steps; the worker's extra steps `route.ts:25-30` map to the visible step before them *(DS)*: Optimizing images → generate, Performance check → ssl). This needs the step-0 bug fixed (A-13) · `reason_code` vercel_auth/domain/size/timeout/build/unknown, set by one server mapping (A-12); never the error message | S | 14 | H |
| `publish_cancelled` | job reaches CANCELLED | `stage` queued/building/deploying (today only `queued` can happen: the worker sets DEPLOYING at once and cancel refuses it, Panel 14 PB-11; `building` is reserved) | S | 14 | H |
| `site_unpublished` | unpublish succeeds (`sites.ts:675`) | — | S | 14 | H |

### 4.5 Change: CMS, Assets, Brand, Components (job 3 "maintain")
| Event | Fires when | Properties | Src | Owner | Feeds |
|---|---|---|---|---|---|
| `cms_collection_created` | collection create succeeds | `source` blank/template | S | 07 | FUN |
| `cms_record_saved` | a record write is confirmed by the server (receipt — SC-9) | `action` create/update/publish/unpublish · `from` cms_area/canvas · `fields_changed` int | S | 07 | FUN H |
| `cms_record_deleted` / `cms_record_restored` | delete / Restore succeeds | `exact_restore` bool | S | 07 | H |
| `asset_upload_finished` | an upload ends: either stored as an asset or refused (one event, outcome in `result`) | `kind` image/video/file/font · `size_kb_bucket` <100/<1000/<10000/≥10000 · `result` ok/refused_type/refused_size/quota/failed · `via` upload/stock_pexels/stock_unsplash/paste | S | 08 | H TR |
| `brand_applied` | `BRAND_APPLIED` after a Brand change commits | `change` starter/token/class/ai (`ai`: Not emitted this version (SC-21)) · `tokens_changed` int · `starter_id` built-in id or `none` | C | 09 | FUN |
| `component_created` | a main component is created | `from` selection/library | C | 13 | FUN |
| `library_update_shared` | "Share update" succeeds (SC-11) | `instances_affected` int · `sites_affected` int | S | 13 | H |

### 4.6 AI (SC-18) — replaces the AN-02 names, same table · **Not emitted this version (SC-21)**: the AI UI is hidden; rows kept for when AI returns
| Event | Fires when | Properties | Src | Owner | Feeds |
|---|---|---|---|---|---|
| `ai_edit_applied` (= `edit.applied`) | an AI edit batch is applied as one undo step | `surface` inline/chat/agent · `command_ids` list of command type names (≤50) · `applied_count` int · `model`: a model id matching `^[a-z0-9.:-]{1,40}$` (tightens today's free `max(40)` string, `ai-adoption.ts:28` — part of A-2) | C | AI / 05 | AI |
| `ai_edit_reverted` (= `edit.reverted`) | undo of an entry labelled AI | `surface` | C | AI | AI |
| `ai_agent_run` (= `agent.run`) | an agent run ends | `steps_planned/applied/skipped/failed` int · `duration_ms` int | C | AI | AI |
| `ai_preview_discarded` | the SC-18 preview of an AI change is closed without applying | `surface` | C | AI | AI |

### 4.7 First run (Panel 16) — names kept from Panel 16 §7
| Event | Fires when | Properties | Src | Owner | Feeds |
|---|---|---|---|---|---|
| `checklist_step_completed` | the server confirms an editor step (`completeEditorTask`) by outcome, not click | `step_id` one of the 7 IDs (`insert-section`…`publish`) · `ms_since_first_open` int | S | 16 | ACT |
| `checklist_dismissed` | user dismisses the checklist | `completed_eligible` int · `eligible` int | S | 16 | ACT |
| `rail_coach_dismissed` | RailCoach "Got it", Esc, or first edit | `how` got_it/esc/first_edit | C | 16 / 02 | ACT |

### 4.8 Plans, trial, upgrade (SC-18, SC-20)
| Event | Fires when | Properties | Src | Owner | Feeds |
|---|---|---|---|---|---|
| `trial_started` | the workspace's `trialEndsAt` (planned, P-TRIAL — no such field today) is set at sign-up or by the launch-day backfill | `source` new_workspace/launch_backfill | S | SC-20 | TR |
| `trial_reminder_sent` | a reminder is created. SC-20: "notification + email at **7, 3 and 1 day** left, and on the last day" | `days_left` 7/3/1/0, where **0 = the last-day reminder** ("Your Pro trial ends today", Panel 23 §5.3) · `channel` in_app/email | S | SC-20 | TR |
| `plan_limit_reached` | an action is shown disabled with the SC-18 limit line (once per limit per session) | `limit_id` sites/pages/domains/members/redirects/over_free_limit/assets_quota/ai_quota/components_cap/pro_feature/password_protection/custom_code (`ai_quota`: Not emitted this version (SC-21)) · `area` (SC-11 area enum) | C | SC-18 | TR |
| `upgrade_clicked` | the user presses Upgrade or "Ask the workspace owner to upgrade" | `from` limit/trial_chip/publish_check/billing/reminder · `limit_id` or `none` · `billing_rights` bool | C | SC-18 | TR |
| `checkout_started` | `createCheckoutSession` returns a URL | `plan` pro/business · `interval` month/year · `in_trial` bool | S | Billing | TR |
| `subscription_activated` | verified `checkout.session.completed` webhook (`stripe-webhook.service.ts:84`) | `plan` · `interval` · `in_trial` bool · `trial_days_left` int | S | Billing | TR |
| `trial_ended` | trial expiry job runs for the workspace | `outcome` converted/moved_to_free | S | SC-20 | TR |
| `plan_lock_applied` | the first server read after `trialEndsAt` (planned, P-TRIAL) moves the workspace to Free and locks everything above a Free limit read-only (SC-20) | `items_locked` per type, as ints: `sites`, `pages`, `domains`, `members`, `redirects`, `pro_settings` | S | SC-20 / 23 | TR |
| `active_set_changed` | the owner changes which items stay editable within the Free limit (Panel 23 §5.5) | `type` sites/pages/domains/members/redirects · `swapped` int | S | 23 | TR |
| `locked_item_deleted` | the user deletes a locked item (OD-PL-7 allows Delete) | `type` site/page/domain/member/redirect | C | 23 | TR |
| `plan_lock_lifted` | the verified Stripe webhook activates Pro and the locks are removed | `items_unlocked` per type (as above) · `days_locked` int | S | 23 / Billing | TR |
| `subscription_cancelled` / `payment_failed` | Stripe `customer.subscription.deleted` / `invoice.payment_failed` handled | `plan` | S | Billing | TR H |

## 5. Funnels and reports *(DS — definitions; metric owner confirms in OD-A8)*
Weeks are ISO weeks in UTC. Every report excludes internal and QA workspaces (OD-A7) and `simulated` publishes (OD-A6). Until P-5 ships, "simulated" is read from the job's mode (ActivityLog `metadata.mode = "simulation"`, `route.ts:184`).

**R-1 North star — sites published per week per active designer.**
`count(publish_succeeded where simulated=false)` in the week, including republishes; rollbacks are shown as a separate series (`rollback=true`) and counted in the total *(DS)*. **Active designer** = a user with role ≥ EDITOR who has at least one `editor_session_ended` with `edit_count ≥ 1` in the week. Show the weekly total, the per-active-designer ratio, and **distinct sites published** (so 10 republishes of one site are visible as such). Needs the publish actor (A-5) for per-designer splits.

**R-2 Activation (00-STRATEGY §5; Panel 16 §7).** Cohort: sites whose **first `editor_opened`** (`site_first_open=true`) falls in the week, **counted once per site**. A site enters the cohort only if `Site.createdAt` ≥ the pipeline start date, checked on the server. Sites that existed before launch are left out, so their first event after launch is not counted as a first open. **Session 1** = the Panel 16 session that contains the site's first `editor_opened`. Activated = `first_canvas_edit` with `in_session_1=true` and `ms_since_site_first_open ≤ 120000`, **and** a `preview_opened` in session 1. Show the rate, p50/p90 of time to first edit, and the split by `site_creation_method`. Secondary: `publish_succeeded` (first_publish) within 7 days.

**R-3 Core-loop funnel (per site, 30-day window).** `editor_opened` → `first_canvas_edit` → `preview_opened` → `review_link_sent` → `review_link_opened` → `client_comment_created` *(optional step)* → `client_approved` → `publish_succeeded` (first) → **republish within 30 days** (a second `publish_succeeded` ≤ 30 days after the first). The 00-STRATEGY name `site_republished_7d` is a **derived report**, not an event *(DS)*: R-3 shows both 7-day and 30-day republish.

**R-4 Health.** Publish success rate = succeeded / (succeeded + failed) by `reason_code`; blocked presses by `check_id`; % sites with a review link; median approval time (`review_link_sent` → `client_approved`); undo-after-delete rate per 100 sessions; save-failed rate; `editor_ready` p75; asset refusal mix.

**R-5 AI trust.** *Not emitted this version (SC-21): report inactive.* Revert rate = `ai_edit_reverted` / `ai_edit_applied` by surface; agent acceptance = applied / planned steps; preview discard rate.

**R-6 Trial conversion (SC-20).** Cohort: workspaces by `trial_started` week. Converted = `subscription_activated` before `trial_ended` or within 7 days after. Show conversion %, split by **activated in trial** (R-2 met on any site) vs not, and by **published in trial**; leading indicators per workspace: **locked items** (`plan_lock_applied.items_locked`, then `active_set_changed` / `locked_item_deleted`; lock → `plan_lock_lifted` rate and days locked), `plan_limit_reached` count, `upgrade_clicked` from each `from`, reminder → checkout within 48 h. After trial: share of moved-to-Free workspaces that publish again (badge added) within 30 days.

## 6. Data contract and privacy
### 6.1 What is never sent
- **No free text**, ever: no page, site, collection, component or template names; no emails; no element content, prompts, URLs, slugs, search queries or error messages. Saved templates are `saved`; custom sections are `custom` (Panel 16 §7).
- **No events in view-only sessions** and none from the **client review page** in the browser. Review events are recorded on the server from the review tables, attached to the site, never to the external reviewer (OD-A5).
- Properties are validated against the catalogue schema on the server; an unknown event or property is **dropped and counted**, not stored *(DS)*.
- Payloads from the internal bus are mapped field by field: `REVIEW_SENT.invitedEmail` becomes `invited: bool`; `error.message` is never mapped.

### 6.2 Identity
*Decided (SC-22).* `user_h`, `workspace_h`, `site_h` = HMAC-SHA256 of the id with a server-only key, applied on the server before storage; the raw id never reaches the analytics store. The same hash is used for all events, so funnels join. Sentry keeps its own error context and no product events.

### 6.3 Retention
*Decided (SC-22).* product events **13 months**, then deleted by a cron job like `analytics-purge`; `ai_adoption_events` falls under the same rule (today it has no purge). Account deletion deletes the user's events (by `user_h`) in the same job as `account-deletion`.

### 6.4 Opt-out *(none exists today)*
*Decided (SC-22): opt-out, built before launch (A-4 ⛔).* **Sharing is on by default.** A **legal check is a gate before A-1 goes live**: if it says EU users need opt-in, the default flips to off for them before any event is stored. Account settings › Privacy: toggle **"Share product usage data with Buildrick"**, help line "Helps us improve the editor. We never collect your content or your clients' details." It is stored per user on the server and read at editor mount. When it is off, the client sends nothing, and server events for that user's actions are not written. Server **publish** events can only skip an opted-out publisher once the job records who started it (A-5). Until then publish events are written for everyone (T-AN-13 BLOCKED). Aggregate counts that do not need events, such as publishes per day from the `publish_build_jobs` table, still work.

### 6.5 Delivery
Client events are batched (≤ 20 events or 10 s), sent with `sendBeacon` on page hide, and queued offline in memory only. They are fire-and-forget: a failure never blocks or shows to the user, same as AN-02 today. The server de-duplicates by `event_id`.

## 7. Naming rules *(DS)*
1. `object_action`, snake_case, past tense or state: `publish_succeeded`, `review_link_sent`. No dots, no prefixes per surface. (AN-02's `edit.applied` style is mapped in §4.6, OD-A1.)
2. One event per user-visible outcome. Do not log button presses when the outcome is available. A click is only an event when the click is the signal (`upgrade_clicked`, `publish_blocked`).
3. Nouns come from SC-11: *release* never names a component update, *record* not "item", *page template* not "starter".
4. Properties are snake_case; booleans read as facts (`first_publish`); counts are ints; durations end in `_ms`, `_s`, `_h` or `_min`; bucketed values end in `_bucket`; ids of built-in catalogue items only.
5. A new event needs a catalogue row (name, condition, props, owner, metric) in this panel in the same commit. An event without a report is not added.
6. Renames bump `schema_v` and keep the old name mapped for 13 months.

## 8. QA of events
- **Contract tests**, one per event: the firing condition fires exactly once, the near-miss does not (template apply is not `first_canvas_edit`; load is not an edit; a dashboard click is not `checklist_step_completed`), and every property is in its enum.
- **Free-text guard** *(DS)*: the shared schema has no `z.string()` property without `.enum` or a max-40 id pattern. A gate (proposed `gate:events-catalogue`) fails when an emitted name is missing from the schema or when the schema has a free string.
- **Debug view**: `window.__BK_EVENTS_DEBUG__ = true` logs each event to the console before sending (same pattern as AN-03), in dev and production.
- **Live check** (CLAUDE.md "live app is the verifier"): before the R-1/R-2 reports are trusted, walk one site through the whole loop at 1440×900 and match the stored rows one by one against the catalogue.
- **Backfill reconciliation**: `publish_succeeded` per week must match COMPLETED rows in `publish_build_jobs` (±1%); a gap means the pipeline is broken, not that people stopped publishing.

## 9. Preservation map
| Existing | Decision |
|---|---|
| `ai_adoption_events` table, `ai.logAdoption`, `scripts/ai-adoption-report.ts` | **Keep.** It becomes the AI slice of the catalogue (§4.6). Names are mapped, not migrated, until OD-A1 |
| ActivityLog + Activity feed | **Keep** as the user-facing feed. Not an analytics source (free-text description, mixed names) |
| Workspace webhooks `site.publish`, `form.submit` | **Keep**. Customer contract; names unchanged |
| Notifications (owner-only) | Keep; publisher notification is Panel 14 P-6 |
| Sentry (dashboard + editor) | Keep for errors only. Fix wiring under D-4; no product events in Sentry |
| `editor.cold_load_ms` console line | Keep until `editor_ready` ships, then delete (no dead code) |
| `sidebarAnalytics.ts` stub | Replace with the catalogue client; `search` and `error` calls are dropped (not in the catalogue, `error` leaks free text) |
| `OnboardingState` task sets | Keep as checklist state. Events are added beside it, not instead of it |
| Published-site visitor analytics + 30-day purge; customer GA/Ads injection | Untouched: separate domain (Panel 10) |

## 10. Planned (not designed here; reserved)
- Internal reports UI (who sees R-1…R-6, where it lives).
- Experiment flags and A/B assignment as an envelope property (`exp_*`).
- Collaboration events (`collab_*`), once `NEXT_PUBLIC_FEATURE_COLLAB` ships (flagged-viable).
- Scheduled publish (`publish_scheduled`), when Panel 14 §10 is built.
- Visitor-side conversion of published sites (forms submitted per site) as a maintenance signal. Needs a separate privacy review.

## 11. Engineering dependencies (add to SC-9)
⛔ = release-blocking (SC-9): the events this panel defines may not ship with the fallback alone.
| ID | Dependency | Fallback until shipped |
|---|---|---|
| ⛔ A-1 (= F-1) | First-party event pipeline: `product.track` tRPC batch endpoint + `product_events` store, server-side envelope (hashing, effective plan, de-duplication, `session_n`, site-once rule for `first_canvas_edit`). **Gate: the legal check of §6.4 passes before it goes live** | Reports R-1, R-3 (publish part), R-4 (publish, review), R-6 (billing) **backfilled from tables** (AN-11); no client events, so no activation report (Panel 16 §9) |
| A-2 | Shared catalogue schema `packages/shared/schemas/product-events.ts` (SSOT, enum-only, incl. the `model` id pattern) + `gate:events-catalogue` | Events reviewed by hand against this panel |
| ⛔ A-3 | HMAC key (server-only env var, added to the root CLAUDE.md env table in the same commit) | Pipeline does not start; raw ids never stored as a stop-gap |
| ⛔ A-4 | Per-user telemetry opt-out column + Account settings › Privacy row (F-1); built before launch (SC-22) | No events are stored until it ships |
| A-5 (= Panel 14 P-8) | `actorId` on `publish_build_jobs` | R-1 per-designer split uses `site.lastPublishedBy` at job time, marked "approximate"; opt-out can't skip publish events (T-AN-13 BLOCKED) |
| A-6 | Retention cron for `product_events` + `ai_adoption_events` (13 months) + account-deletion cascade | Manual purge script; `ai_adoption_events` keeps growing as today |
| A-7 | Server emit points: publish worker, `startPublish`, review service, CMS service, Stripe handlers, trial job (P-TRIAL) | Derived nightly from tables (review, publish, subscription); `trial_*` waits for P-TRIAL |
| A-8 | `editor_ready` timing at first canvas paint | AN-01 console line stays |
| A-9 | Internal/QA workspace flag (e.g. `qa@buildrik.local`) | Exclusion list kept in the report query |
| A-10 | Effective-plan resolver (SC-20 ⛔ P-TRIAL) for `plan_effective` | `plan_effective` = `ws.plan`; trial cohort report R-6 not available |
| A-11 | `Site.creationMethod` values for duplicate and import (today only BLANK/TEMPLATE/AI are written) | Those sites report `blank` (default) — R-2 split by method is marked approximate |
| A-12 | One server mapping of publish errors to `reason_code`, e.g. a `publishErrorReason(err)` in the publish service, using Vercel API status (401/403 → vercel_auth), domain errors → domain, the payload limits in `shared/schemas/publish.ts:12-18` → size, poll timeout → timeout, deployment ERROR state → build, else unknown | `reason_code: unknown` for every failure |
| A-13 (= Panel 14 §13 #2) | The worker records the step that actually failed, not step 0 (`route.ts:208`, `buildSteps(0, true)`) | `failed_step` is not sent (null) until fixed; R-4 shows failures without step |
| P-5 (Panel 14) | Server `simulated` flag on jobs | `simulated` from the job's mode (ActivityLog `metadata.mode`, `route.ts:184`) |

## 12. Acceptance tests (specified, NOT RUN)
| ID | Case |
|---|---|
| T-AN-01 | Blank site, then a page template applied: `editor_opened{first_open:true, site_creation_method:blank}`, `template_applied{mode:replace}`, **no** `first_canvas_edit` until the user edits; first edit at 90 s → `ms_since_site_first_open` ≈ 90000, `in_session_1:true`. Reload at 60 s keeps the same `session_n` |
| T-AN-02 | Reopen the same site: `first_open:false`; `first_canvas_edit` does not fire again. A second user opens the site and edits: `first_open:true`, `site_first_open:false`, and **no** `first_canvas_edit` (once per site, Panel 16 T-FR-11) |
| T-AN-03 | Viewer opens the site: zero events stored |
| T-AN-04 | Preview button pressed but render fails → no `preview_opened`; render succeeds → one event with `from` and `breakpoint` |
| T-AN-05 | Send review with an email → `review_link_sent{invited:true}`; the stored row contains no email (byte search of the payload) |
| T-AN-06 | Client opens the link twice → one `review_link_opened`; client comments → `client_comment_created`; approve → `client_approved{open_comments}`; no events are sent from the reviewer's browser |
| T-AN-07 | Publish succeeds → exactly one `publish_succeeded` per job (worker retry does not duplicate); simulation → `simulated:true` and excluded from R-1 |
| T-AN-08 | Publish fails at "Deploying to CDN" → `publish_failed{failed_step:deploy}` with an enum `reason_code` and no message text |
| T-AN-09 | Press Publish with 0 live pages → `publish_blocked{check_ids:[pages_ready]}`; no `publish_started` |
| T-AN-10 | *Not emitted this version (SC-21) — runs when AI returns.* AI inline edit applied, then ⌘Z → `ai_edit_applied` + `ai_edit_reverted` (fixes D-1) |
| T-AN-11 | Dashboard checklist click without the outcome → no `checklist_step_completed`; outcome reached → one event with the step id |
| T-AN-12 | Free after trial: Pages at the limit → `plan_limit_reached{limit_id:pages}` once per session; Upgrade → `upgrade_clicked{from:limit}`; Stripe test checkout → `checkout_started` then `subscription_activated` |
| T-AN-13 | **BLOCKED until A-5.** Opt-out on → no client events and no server events for that user; R-1 backfill from the table still counts the publish |
| T-AN-14 | Unknown property sent → dropped, counted in the rejection metric, never stored |
| T-AN-15 | Offline for 2 min, 5 edits → events delivered once on reconnect, de-duplicated by `event_id` |
| T-AN-16 | Weekly `publish_succeeded` with `simulated=false` equals the non-simulated COMPLETED jobs in `publish_build_jobs` for the same week ±1%; simulated jobs are excluded on both sides |
| T-AN-17 | Account deletion → the user's `user_h` rows are gone after the deletion job |
| T-AN-18 | Launch-day pollution: a site created before the pipeline start is opened for the first time after it → `editor_opened{site_first_open:true}` is stored but the site is **not** in the R-2 cohort (server check on `Site.createdAt`) |
| T-AN-19 | `publish_blocked` with a value outside the closed enum is rejected; each Panel 14 §5.2 Blocking row produces its own value |
| T-AN-23 *(R-1018, D3-1, S7)* | Publish with a Forever loop on page load → `publish_blocked{check_ids:[motion_wcag_2_2_2]}`; password-protected site on a Vercel plan without protection → `publish_blocked{check_ids:[vercel_protection_unsupported]}` |
| T-AN-21 | Trial ends with 3 sites and 14 pages on Free → one `plan_lock_applied` with `items_locked` sites 2, pages 4 on the first server read after `trialEndsAt`; Publish on a locked site → `publish_blocked{check_ids:[site_over_free_limit]}`; New page at the limit → `plan_limit_reached{limit_id:pages}` |
| T-AN-22 | Owner swaps the editable site → `active_set_changed{type:sites, swapped:1}`; deletes a locked page → `locked_item_deleted{type:page}`; buys Pro → one `plan_lock_lifted` with matching `items_unlocked`, and no second `plan_lock_applied` |
| T-AN-20 | Close the tab without a close event → after 30 min the server writes `editor_session_ended{reason:server_timeout}` with the last batch's counts |

## 13. Code defects found during this inventory (engineering, not design)
1. **D-1** `trackAiEditApplied` (`services/ai/adoptionTracker.ts:43`) has no production caller (only `__tests__/adoptionTracker*.test.ts`), so `edit.applied` is never recorded, while `edit.reverted` (`:89-97`) and `agent.run` are. The revert rate cannot be computed, and the adoption report undercounts AI use.
2. **D-2** `InspectorErrorBoundary.tsx:45` sends `message: error.message` through `trackSidebar`; `setSidebarAnalyticsProvider` (`sidebarAnalytics.ts:26`) is never called, so it is dead today. Wiring it as written would ship free text.
3. **D-3** `editor.cold_load_ms` (`EditorClient.tsx:13-29`) is only `console.info` in the visitor's browser, so it is never collected. It runs in `EditorClient`'s effect before the `dynamic()` editor chunk resolves (`:8-11`), so it measures time to skeleton, not editor ready (source inference, NOT RUN).
4. **D-4** Editor `initErrorTracking` is called only in `demo/main.tsx:26`. In the shipping (Next-bundled) editor, `captureError` imports `@sentry/react` without initialising it. Whether events reach Sentry through the dashboard's `@sentry/nextjs` client is NOT VERIFIED. The dashboard has `sentry.client.config.ts` but no `instrumentation-client.ts`, and whether the client config loads under Next 16 + Turbopack is NOT VERIFIED. `EditorErrorBoundary.tsx:24-28` never reports to Sentry. `setUser` (`errorTracking.ts:77`) has no caller.
5. **D-5** `publish_build_jobs` has no actor (`prisma/schema.prisma:1440-1467`). The activity row uses `site.lastPublishedBy` read **after** the job (`route.ts:158-160,179`), so a concurrent or later publish by another user can be attributed wrongly.
6. **D-6** The dashboard checklist marks a task complete **on click** (`dashboard-checklist.tsx:117-120` → `completeDashboardTask`), and `OnboardingState` stores task sets without timestamps or site (`onboarding.service.ts:111-148`). A click is recorded as an outcome.
7. **D-7** `ai_adoption_events` and `activity_logs` have no retention purge. Only `analytics_events` (30 days) does (`app/api/cron/analytics-purge/route.ts:12-16`).
8. **D-8** `api-tokens.ts:90-99` writes `activityLog` through Prisma directly from the router, outside `activity-log.service.ts` and its `ActivityAction` union. This breaks the Router → Service rule (root CLAUDE.md).
9. **D-9** `REVIEW_SENT` carries `invitedEmail` on the client bus (`shared/constants/events.ts:993`). This is fine in memory, but any future telemetry listener must map it to a bool (§6.1).
10. **D-10** `EVENTS.PAGE_CREATED` (`events.ts:557`) is declared but not the real signal (`OnboardingMount.tsx:82`). `page_created` must hook the `PROJECT_CHANGED` path or the page-create command, not this constant.

## 14. Review and not verified
- Independent `design-qa-critic` review, pass 1: PROPOSAL (B1–B5 + 13 notes), all fixed 2026-10-17 (once-per-site first edit, launch-day cohort guard, session-1 reference, closed `check_ids`, `failed_step` enum + error mapping + step-0 fix, plus notes 6–18). Pass 2: 2 blocking fixed 2026-10-17.
- Not verified: runtime behaviour of every inventory row; whether Sentry captures anything in production (D-4); production log contents; Stripe payload fields for the `in_trial` properties; volume estimates (`element_inserted` may need sampling — measure before deciding).
- **Owner decisions — all decided as recommended (SC-22, 2026-10-17):**
  - **OD-A1** AI names: map `edit.applied`/`edit.reverted`/`agent.run` to `ai_*` in reports only, or migrate the table. **Decided:** map only; no migration (inactive while SC-21).
  - **OD-A2** Pseudonymous ids (was Panel 16 pending). **Decided:** HMAC-SHA256 server-side with a server-only key; raw ids never stored in the event store.
  - **OD-A3** Retention (was Panel 16 pending). **Decided:** 13 months for product events and AI adoption; delete on account deletion.
  - **OD-A4** Opt-out (was Panel 16 pending; none today). **Decided:** sharing on by default with a per-user opt-out in Account settings › Privacy, built before the pipeline goes live (A-4 ⛔), first-party only. The legal check (EU opt-in?) is a gate before A-1 goes live.
  - **OD-A5** Client reviewers. **Decided:** no browser telemetry on `/review/<token>`; review events only from server tables, linked to the site.
  - **OD-A6** Simulated publishes in the north star. **Decided:** exclude; rollbacks count but are shown separately.
  - **OD-A7** Internal/QA workspaces. **Decided:** a server flag and exclusion from all reports.
  - **OD-A8** Store: first-party Postgres (`product_events`) vs a hosted tool (PostHog). **Decided:** first-party now, because it is the same contract as AN-02, adds no third-party processor and backfills from our own tables. Revisit at around 1M events a month.
