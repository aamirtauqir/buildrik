# Panel 23 — Plans, Pro trial and upgrade moments: functionality specification (FD-PNL-23)

Date 2026-10-17 · Branch main @ `19f964d5e` · Mode: DESIGN ONLY
**Owner amendments 2026-10-17:** over-limit items locked read-only after the trial until purchase (§5.5); no AI in this version (SC-21) — AI quota rows hidden; other recommendations accepted (SC-22).

Status: **SPEC COMPLETE (written scope) · blocked by TR-1, TR-2, TR-6, TR-7, TR-12, Access gate · not VERIFIED.** Independent design-qa-critic review: pass 1 PROPOSAL (5 blocking) + 9 notes — fixed 2026-10-17; pass 2 (5 blocking + notes) — fixed 2026-10-17. Runtime NOT RUN; geometry NOT MEASURED. Written after a source read (file:line below). *(DS)* = designer-selected; owner standing instruction 2026-10-17: designer recommendations accepted. Owner decisions OD-PL-1…7 are decided (§10, SC-22). Panel 00 wins on conflicts; this panel is the full spec behind **SC-20** (owner-accepted, unchanged here) and **SC-18** (plan-limit pattern).
**2026-10-18 owner decisions applied** (design-audit-2026-10-18/OWNER-DECISIONS-2026-10-18.md): S2, S7 (cross-reference), V7 (via ⋯ menu width); FINAL §4 items 5, 10, 13; gap rows D3-4, D3-5, D3-9, D3-23, D3-25, D3-28, CS-01, CS-08, CS-17, CS-21.
Governing IA: IAF-14 G ("Workspace door opens named dashboard new tab, keeping Editor context; no fake Editor Billing form", `evidence/ia-final-2026-10-16/module-specifications.md:765`), IAF-20 (plan restriction is distinct from role; "plan exhausted" state, `:1085,1109`), Panel 14 §5.2 (Publish rows), Panel 10 (Site settings locks), Panel 11 (page capacity), Panel 15 (Pro templates), Panel 08 (storage), Panel 12 (AI quota), 00-STRATEGY (job 3: publish and maintain; north star = sites published per week — a plan moment must never stop a publish silently).
Paths: editor under `packages/editor/src/`; server/lib/prisma from repo root; dashboard under `packages/dashboard/`. **`route.ts`** = publish worker `packages/dashboard/app/api/workers/publish/[jobId]/route.ts`.

---

## 1. Purpose and boundary
Plans answer one question wherever the user meets them: **"What does my plan let me do here, and what happens if I go past it?"**

Job: J3 Publish and maintain (00-STRATEGY §3; a plan moment never stops a publish silently) *(R-1018)*
- In: the **effective plan** concept; trial chip placements; trial reminders (in-app + email); trial-ending, trial-ended and paid-state notices; the one Upgrade dialog; every locked state and limit line in the editor and its copy; billing rights vs "ask the owner"; the Billing door; over-limit content after the trial; Publish plan rows (aligned with Panel 14 §5.2).
- Out (linked): dashboard Billing / Plans page layouts beyond the trial card (§5.8 names the deltas only); Stripe Checkout and Customer Portal UI (hosted by Stripe — we never touch a card, root `CLAUDE.md` §Payments); prices (`PLAN_LIMITS`); technical limits (file sizes, publish 2 MB/16 MB/500 pages, 100 components, rate limits — SC-20: never mention plans).
- Unchanged owner rules (SC-20): Free = "Made with Buildrick" badge; Pro = no badge + Pro features + Pro limits; Business unchanged; one 30-day Pro trial **per workspace**, automatic at creation, no card, never restarts; reminders at 7/3/1 days and last day; nothing deleted at expiry; live site unchanged until the next publish; password protection on Free is a **Blocking** Publish row.

## 2. Current implementation (source-read 2026-10-17; runtime NOT RUN)

| ID | Area | Today |
|---|---|---|
| PL-01 | Plans + limits | `PLAN_LIMITS` FREE/PRO/BUSINESS, 19 keys (`lib/constants/plan-limits.ts:26-90`): sites 3/15/50, pages per site 10/30/50, domains 0/3/20, members 1/5/25, storage 500 MB/5 GB/50 GB, AI generations/month 3/20/∞, AI prompts/day 10/200/∞, upload 10/50/200 MB, form submissions/month 100/2500/∞, redirects 100/500/∞, integrations 0/2/∞, analytics days 7/30/90, share-link expiry 7/30/90 days, share-link passwords no/yes/yes, asset versions 5/25/100; price $29 ($23 yearly) / $79 ($63) |
| PL-02 | Plan storage | `Workspace.plan` String default FREE (`prisma/schema.prisma:184`) — what every gate reads; `Subscription.plan` + free-string `status` (`:757-768`). **No trial field.** |
| PL-03 | Plan writers | Only the verified webhook: checkout completed → plan + status **"ACTIVE"** hard-coded (`stripe-webhook.service.ts:84-137`, `:116`); subscription updated (`:140-215`); deleted → FREE + `reconcileWorkspaceToFreePlan` (`:218-246`); dunning cron after 7-day grace → FREE + reconcile (`app/api/cron/billing-downgrade/route.ts:9-48`) |
| PL-04 | Downgrade reconcile | Unpublishes published sites beyond Free's 3 (newest kept), sets DRAFT, deletes nothing (`billing.service.ts:269-291`) |
| PL-05 | Live check | `isSubscriptionLive` treats any non-terminal status (incl. TRIALING, PAST_DUE) as live (`server/services/subscription-status.ts:16-23`) |
| PL-06 | Checkout / Portal | `createCheckoutSession` FREE→paid only (`ALREADY_SUBSCRIBED` otherwise), returns to `/dashboard/settings/billing?checkout=` (`billing.service.ts:206-238`); Portal for changes/cancel (`:245-266`); cancel/reactivate via Stripe `cancel_at_period_end` (`:343-397`) |
| PL-07 | Billing rights | Every billing mutation **OWNER only** (`server/trpc/routers/billing.ts:41-49`); reads member-visible; dashboard Billing disables with "Only the workspace owner can change billing." (`app/dashboard/settings/billing/page.tsx:140-146`) |
| PL-08 | Billing overview | reads `Subscription.plan`, defaults FREE when no row (`billing.service.ts:58-81`) — a different source from PL-02 |
| PL-09 | Server gates (Workspace.plan) | site cap `assertSiteQuota` (`site-quota.ts:33-49`, one message `:13-14`); pages create `PAGE_LIMIT` (`page.service.ts:64-67`); **save** `PAGE_LIMIT:<n>` — over-limit sites keep saving if no page is added (`sites.service.ts:972-986`); custom code + site password refuse on FREE (`site-settings.service.ts:282-310`; clearing a password stays free `:285-290`); domains (`domain.service.ts:335-341`); members (`team.service.ts:40-41,90-92`); redirects (`redirect.service.ts:51-55,137`); integrations (`integrations.service.ts:51-56`); share links: passwords, expiry, FREE = 3 active (`share-link.service.ts:88-117`); form submissions/month (`form-submission.service.ts:113-122`); analytics range clamp (`analytics.service.ts:121-123`); AI generations/month (`ai-generation.service.ts:14-30`); second workspace needs an owned paid workspace (`workspace-settings.service.ts:45-56`) |
| PL-10 | Gates resolved per **user** | AI prompts/day, storage quota and asset-version cap use the user's **first-joined** membership's plan (`quota.service.ts:48-55,75-115`; `media.service.ts:49-55,517-518,591-600`); storage summed over all the user's assets (`media.service.ts:597-600`) |
| PL-11 | Error copy | "Page limit reached." (`routers/pages.ts:63`); save: "Your plan allows N pages per site. Delete a page, or upgrade, to keep saving." (`routers/sites.ts:392-395`) → editor toast "Not saved — page limit reached" (`shell/hooks/useComposerInit.ts:848-855`); "Custom code requires Pro or above" (`routers/site-detail.ts:130-131`); "Redirect limit reached." (`:247-248`); "You've reached your plan's custom-domain limit. Upgrade to add more." (`:448-449`); share links (`:583-588`); "Storage quota exceeded." (`routers/media.ts:191-192`); "Integration limit reached." (`routers/account.ts:302`); AI drafts (`app/onboarding/ai/generating/page.tsx:17`) |
| PL-12 | Badge | `showBadge = ws.plan === "FREE"` read once per deploy (`route.ts:323-326`), `injectBadge` (`lib/publish-html.ts:143-155`) |
| PL-13 | Pro output at publish | Password applied by the worker on every plan (`route.ts:319-321,401`); site + page custom code injected by the client export with **no plan check** (`engine/export/ExportEngine.ts:636-637,975-976`) |
| PL-14 | Editor plan | `getEditorPlanTier()` starter/pro/enterprise, captured **once** at project load from the settings read (`services/BuildrikSyncProvider.ts:597-613,754-755`) |
| PL-15 | Site settings locks | `SCREEN_PLAN_REQUIREMENTS` custom-code + access = pro (`sidebar/tabs/settings/types.ts:215-218`); nav row "Pro" pill, Billing row shows plan "Free/Pro/Business" (`SettingsTab.tsx:124,849-873`); centred `LockedScreen` "{Feature} is a Pro feature" + "Upgrade to Pro" (`screens/LockedScreen.tsx:32-97`); header "Upgrade" (`SettingsTab.tsx:1109-1112`); Access keeps Share links and locks only the password card: "Upgrade to Pro to control who can view your site." (`screens/AccessScreen.tsx:155-175`); every Upgrade opens dashboard Billing in a **new tab** (`SettingsTab.tsx:669-671`) |
| PL-16 | Templates | `status: "premium"` templates (`templatesData.ts:185,218,240`), card " · Pro" (`TemplateCard.tsx:82`), locked on `starter` → `openUpgrade({feature})` (`TemplatesTab.tsx:154-157,171,214`); client-only gate |
| PL-17 | Upgrade dialog | `UpgradeModal` mounted once (`shell/AquibraStudio.tsx:859`), opened by `openUpgrade` event (`chrome-ui/UpgradeModal.tsx:37-46`); title "Upgrade Your Plan", "{feature} requires the Pro plan.", 4 fixed benefits incl. "AI-powered features", "Priority support" (`:55-60`); "Maybe Later" / "Upgrade to Pro" → Billing new tab (`:84-104`); shown to every role; only Templates calls it |
| PL-18 | Editor quotas | storage hook `useServerStorageQuota` (`sidebar/tabs/media/hooks/useServerStorageQuota.ts:30-93`), local fallback 1 GB (`shared/constants/media.ts:336`); AI quota hook `useAiQuota` + server sentence (`sidebar/tabs/ai/AITab.tsx:335`) |
| PL-19 | Notifications | PAYMENT_FAILED to owner, no `siteId` (`stripe-webhook.service.ts:64-73`); editor bell filters by `siteId` (`notification.service.ts:25-29,70-72`) |
| PL-20 | Emails | templates `auto-downgrade.tsx`, `plan-limit-warning.tsx`, `payment-failed.tsx`, `dunning-reminder.tsx` (`packages/dashboard/emails/`); senders `sendAutoDowngradeEmail`, `sendPlanLimitWarningEmail` (`email.service.ts:180,227`) **have no callers** |
| PL-21 | Dashboard | Billing page (checkout result, portal, cancel; `billing/page.tsx`), Plans page (`settings/plans/page.tsx:107-113`, no owner check), sidebar "Upgrade plan" on FREE (`components/dashboard/shell/sidebar.tsx:76-80`); `PaywallModal`, `LimitReached` unused |
| PL-22 | Trial | **None in code.** SC-20 P-TRIAL ⛔ |

## 3. Problems this design solves (job 3 "publish and maintain"; job 1 "build" for limits)
1. **No trial and no single plan answer.** 20+ gates each read `Workspace.plan`; Billing reads `Subscription.plan` (PL-08); three quotas read the user's first workspace (PL-10). A trial added to one of them would disagree with the rest.
2. **Plan moments are invisible until refusal.** Pages fail at save after the page exists (PL-09/11); storage/redirects say "limit reached" with no plan or next step (PL-11).
3. **Upgrade offered to people who can't upgrade** (PL-07 vs PL-17) and benefits that are not true (PL-17).
4. **Downgrade leaks and losses:** custom code keeps shipping (PL-13); asset versions above the Free cap are pruned on the next write (PL-10) — contradicting "nothing deleted"; a paid downgrade unpublishes sites (PL-04).
5. **Stale plan in the editor** after upgrading in the Billing tab (PL-14).
6. **Five visual treatments of "Pro"** (§13 #9) and "Enterprise" vs "Business" (§13 #8).

## 4. Target layout

### 4.1 The effective plan (one resolver — concept, NEW)
`effectivePlan(workspace)` → `{ plan: FREE|PRO|BUSINESS, source: "paid"|"trial"|"free", trialEndsAt?, daysLeft?, paidStartsAt?, cancelsAt?, pastDue?, canManageBilling }`
- **paid** when `Workspace.plan` is PRO/BUSINESS (PL-02/03 unchanged writers); else **trial** (= PRO) when `trialEndsAt > now`; else **free**.
- Computed **on read** — trial expiry needs no plan write and never runs `reconcileWorkspaceToFreePlan` *(DS)*. A cron only sends reminders (§5.3).
- `daysLeft` = whole days to `trialEndsAt` in `Workspace.timezone` (`schema.prisma:186`); last day = 0 → "last day".
- `canManageBilling` = role OWNER (PL-07).
- **Every** consumer uses it: all PL-09 gates, PL-10 quotas (re-keyed to the site's workspace), badge (PL-12), worker password/custom-code rule (§5.6), editor tier (PL-14), Billing overview (PL-08), dashboard pages. Business resolves exactly as today (paid only; no Business trial).
- **Collected-payment test** (`hasPaid`, B1/B2 fix): a subscription counts as **paid** only when its status is ACTIVE or PAST_DUE **and** at least one invoice has been paid (`handleInvoicePaid`, `stripe-webhook.service.ts:248-295`). TRIALING never counts. Reason: choosing Pro during the trial makes the webhook write `Workspace.plan = PRO` at once (`stripe-webhook.service.ts:132-135`), before any money is taken.
- **Anti-abuse exception** *(DS)*: the second-workspace rule (`workspace-settings.service.ts:45-56`) uses `hasPaid`, not the effective plan or `Workspace.plan`. If it didn't, a user could choose Pro, create workspaces (each with its own trial), then cancel.
- **One trial per owner** *(DS; OD-PL-6)*: a new workspace gets a trial only if its owner has not owned a trialled workspace in the last 12 months. This blocks the delete-and-recreate loop (`deletedAt` workspaces still count).

### 4.2 Plan chip — placements (SC-20 placements kept)
```
Topbar ⋯ menu (280, V7)                      Site settings › Overview (top card)
┌──────────────────────────────────┐          ┌──────────────────────────────────────────┐
│ ⌕ Search                     ⌘K  │ header   │ ⏱ Pro trial · 12 days left                │
│ ⏱ Pro trial · 12 days left     › │ row 32   │ Ends Nov 16. After that this workspace     │
│──────────────────────────────────│          │ moves to Free — nothing is deleted.        │
│ Site settings            ⌃,      │          │ [ Keep Pro ↗ ]   Compare plans ↗           │
│ View live ↗ · Copy live URL      │          └──────────────────────────────────────────┘
│ …                                │          Site settings nav › Billing pill: "Pro trial"
└──────────────────────────────────┘          (R-1018: header = Search ⌘K only; chip = first row, D3-5)
```
| State | Chip text | Glyph / tone | Click (OWNER) | Click (others) |
|---|---|---|---|---|
| Trial, >7 days | "Pro trial · {n} days left" | ⏱ neutral | Billing ↗ (new tab) | popover "This workspace is on a Pro trial until {date}. The workspace owner manages billing." |
| Trial, 1–7 days | same | ⏱ warning | Billing ↗ | popover |
| Trial, last day | "Pro trial · last day" | ⏱ warning | Billing ↗ | popover |
| Trial, Pro already chosen | "Pro · starts {date}" | ✓ neutral | Billing ↗ | popover |
| Free (after trial or never) | "Free · Upgrade" / others "Free" | outline ○ | Billing ↗ | popover "Ask the workspace owner to upgrade" (SC-18; OD-PL-4 accepted 2026-10-17) |
| Pro / Business paid | "Pro" / "Business" | none | Billing ↗ | no action |
| Paid, cancel at period end | "Pro · ends {date}" | neutral | Billing ↗ | no action |
| Paid, payment failed (PAST_DUE) | owner only: "Payment failed · Update ↗" | ✕ danger | Billing ↗ | not shown |
- **⋯ menu header has a single occupant: "Search ⌘K"** (Panel 18 §5.1); the plan chip is the **first row directly under the header**, 32 tall, above the first group *(R-1018, D3-5 — resolved toward "single occupant" per SCREEN_DESIGN_SPECIFICATIONS S22; Panel 01 §6 needs the same text)*.
- Viewers (SC-6): chip shown read-only, no action. Never colour-only: glyph + text.
- **No new topbar chip** *(DS — the ⋯ header and Overview are the owner-accepted places; the core loop stays uncluttered)*.

### 4.3 One Pro chip *(DS)*
Every Pro marker (Settings nav row, LockedScreen, Access card, template card + preview header, Upgrade dialog) uses one chrome-ui chip: text **"Pro"**, purple ramp (DESIGN.md §Color allowlists purple for the PRO badge only), 20 tall. During the trial the chip text is **"Pro · included in your trial"** where a line exists (cards, locked rows), "Pro" where only a pill fits (nav row). Replaces the four treatments in §13 #9.

### 4.4 Limit line and locked row (SC-18 made concrete)
```
Pages                                  8 of 10 pages on Free     ← limit line (12/muted)
[ + New page ]                                                   ← enabled under the limit
— at the limit —
[ + New page ]  (aria-disabled)  "10 of 10 pages on Free"
  Upgrade for 30 pages per site ↗        (OWNER)
  Ask the workspace owner to upgrade                (others; SC-18 text — OD-PL-4 accepted 2026-10-17)
```
- Trial: "12 of 30 pages · Pro trial". Paid Pro: "12 of 30 pages on Pro". Unlimited (-1): no line.
- The line shows only when the limit is within reach *(DS: ≥80%, matching the existing 80% warning, `media.service.ts:605-606`)* or at the limit; Free always shows it on the limit's own screen.
- A plan lock is never phrased as a role lock and vice versa (IAF-20, Panel 10 §6).

### 4.5 Upgrade dialog (480, replaces `UpgradeModal` content — same mount, same `openUpgrade`)
```
┌ Custom code is a Pro feature                            ✕ ┐
│ [Pro]  This workspace is on Free.                          │  (trial: "Included in your trial — 12 days left")
│                                                            │
│ Pro adds                                                   │  facts from PLAN_LIMITS only
│  ✓ No "Made with Buildrick" badge                          │
│  ✓ Custom code and password protection                     │
│  ✓ Pro page templates                                      │
│  ✓ 30 pages per site (Free: 10) · 15 sites (Free: 3)       │
│  ✓ 3 custom domains (Free: none) · 5 GB storage (500 MB)   │
│ $29 a month, or $23 a month billed yearly                  │
├────────────────────────────────────────────────────────────┤
│                         [ Not now ]  [ Choose Pro in Billing ↗ ] │ OWNER
│  "Ask the workspace owner to upgrade." [ OK ]   others (SC-18; OD-PL-4 accepted 2026-10-17)
└────────────────────────────────────────────────────────────┘
```
- Title names what the user reached for (existing `feature` detail, `UpgradeModal.tsx:40-44`); generic: "Upgrade to Pro".
- Benefit rows are generated from `PLAN_LIMITS` FREE→PRO deltas *(Fix: removes "Priority support" and "AI-powered features", §13 #7)*; the feature that triggered the dialog is listed first. **While SC-21 holds, AI keys are excluded** from the generated rows — `AI generations/month` and `AI prompts/day` (PL-01) never appear in the dialog, the Billing deltas or the emails *(R-1018, D3-9 / CS-21)*.
- Primary opens Billing in a **new tab** (IAF-14 G; existing behaviour). On return (tab focus) the editor re-reads the effective plan and unlocks without reload (§5.7).
- Not shown to viewers (they get the disabled reason instead).

## 5. Flows

### 5.1 Trial start
Workspace creation — sign-up (`auth.service.ts:81-92`) and additional workspace (`workspace-settings.service.ts:74`) — sets `trialEndsAt = createdAt + 30 days`, unless the owner already had a trial in the last 12 months (§4.1, OD-PL-6). In that case the workspace starts on Free and its chip reads "Free · Upgrade". Launch day: every existing workspace with `trialEndsAt` null **and** no paid plan gets launch day + 30. First editor open in a trial: no modal; the ⋯ chip exists and Pro items read "Pro · included in your trial" *(DS — first run, Panel 16, stays about building)*.

### 5.2 During the trial
Everything behaves as Pro: features, limits, no badge (SC-20). Limit lines show Pro numbers with "· Pro trial". Pro chips stay visible so the user learns what they will lose.

### 5.3 Reminders (7, 3, 1 days left and last day)
| When | In-app (bell, owner + admins *(DS)*) | Email (owner) |
|---|---|---|
| 7 days left | "Your Pro trial ends in 7 days — keep Pro or continue on Free" | subject "7 days left in your Buildrick Pro trial" |
| 3 days left | "…ends in 3 days…" | "3 days left…" |
| 1 day left | "Your Pro trial ends tomorrow — keep Pro or continue on Free" (SC-20 copy) | "Your Pro trial ends tomorrow" |
| Last day | "Your Pro trial ends today" | "Your Pro trial ends today" |
| Ended | "Your Pro trial ended. This workspace is on Free — nothing was deleted." | "Your Pro trial has ended" |
- Every email body states: date, what changes ("next publish adds the badge; custom code and password protection need Pro"), what does not ("nothing is deleted; live sites stay as they are until you publish"), and "items over the Free limit are locked until you upgrade", and one button **"Keep Pro"** → Billing. New templates beside `auto-downgrade.tsx`, in DESIGN.md type and accent (§13 #11).
- Reminders stop once Pro is chosen; a member who is not owner gets the in-app line with "Ask the workspace owner to upgrade" (OD-PL-4 accepted 2026-10-17) instead of the button.
- **Editor bell** shows workspace notices (no `siteId`) at the top of the list — needs TR-4 (today the bell filters by site, PL-19).
- Delivery is idempotent: one row per (workspace, milestone).
- **Timing** *(DS)*: the reminder job runs **hourly**. "Days left" is counted in calendar days in `Workspace.timezone` (default UTC, `schema.prisma:186`). The trial ends at **local midnight that starts the day after day 30**, so `trialEndsAt` is stored as that instant.
  - A milestone (7, 3 or 1 days left) fires on the first run after **09:00 local** on that day.
  - **Last day** fires at 09:00 local on the final day.
  - **Ended** fires on the first run after `trialEndsAt`.
  - Missed runs catch up, but at most one milestone is sent: the latest one due. Older ones are marked skipped, never sent late.
  - If the job is down, the effective plan still changes on time, because it is computed on read.

### 5.4 Upgrade during the trial
Owner → Billing › Choose Pro → Stripe Checkout with `trial_end = trialEndsAt` (no charge until then, remaining days kept — SC-20) → webhook records plan PRO, status TRIALING (needs TR-6; today `:116` writes "ACTIVE"). Chip → "Pro · starts {date}". Editor locks: unchanged (already Pro). Plan still flips **only via the webhook** (root CLAUDE.md §Payments) — the editor never assumes success; "?checkout=success" is a dashboard concern.
- **Last 2 days.** Stripe is believed to require `trial_end` at least 48 hours in the future. This is **unverified against current Stripe docs** and must be checked in test mode (TR-6). With under 48 h left *(DS)*:
  - Checkout starts the subscription **now**, and its first billing date is pushed to `trialEndsAt` (billing-cycle anchor, no proration). The user is charged at trial end and loses no days.
  - If that also proves impossible, the fallback is to charge now. The Billing line must then say so before Checkout: "Your trial ends {date}. Choosing Pro now starts billing today."
  - Ordinary copy on Billing: "No charge until {date} — your trial days are kept."
- **Cancel during the trial, or first invoice fails** (B2 fix). Both reach `handleSubscriptionDeleted` (`stripe-webhook.service.ts:218-246`) or the dunning cron (`billing-downgrade/route.ts:19-46`), and both call `reconcileWorkspaceToFreePlan`, which unpublishes sites beyond 3.
  - **Rule:** a subscription that never collected a payment (`hasPaid` false, §4.1) **never triggers the reconcile**. The workspace falls back to the effective plan: still trial if `trialEndsAt` is ahead, otherwise Free under §5.5.
  - Copy (Billing and bell): "Pro cancelled — you're back on your trial until {date}" / "Your first Pro payment failed — this workspace is on Free. Nothing was unpublished."

### 5.5 Trial ends without upgrade
- Effective plan → FREE at `trialEndsAt` (on read). **Nothing is deleted, nothing is unpublished** (Fix vs reusing PL-04).
- First editor open afterwards: one non-modal notice **in the Panel 22 banner slot, entry (9a) "Trial ended" — info tone (neutral grey + icon), no live role of its own** *(R-1018, D3-4 / CS-08; was "notice under the topbar")*: "Your Pro trial ended. This workspace is on Free. Your work is kept, and live sites stay as they are until you publish. Items over the Free limit are locked until you upgrade. · See what changed › · ✕" — "See what changed" lists the affected items on this site (custom code saved, password set, pages over 10, Pro templates used). Dismiss is per user per workspace; the bell keeps the "Ended" item.
- **Over-limit content — OWNER DECISION 2026-10-17 (replaces OD-PL-1):** *"after trial expire ka bad jo limit sae uper ho gaey vo block ho jaye gae jab tak vo purchase ni karey ga vo un ka kuch bhee edit ni kar sakta"*. Everything above a Free limit becomes **locked (read-only) until the workspace buys Pro**. Nothing is deleted; live sites keep serving what was last published. Locked items can be **viewed, previewed and exported**; they cannot be edited, published, renamed or duplicated. Unlock = upgrade (instant, via the webhook) — no per-item purchase.
- **Which items stay editable** *(DS)*: the newest-edited items up to the Free limit stay editable: the **10 most recently edited pages per site** and the **3 most recently edited sites**; the owner may choose a different set **once per 30 days** (Billing › Choose what stays active, §5.5a). The set is fixed (persisted) at the moment the trial ends, so it does not drift as people edit.
- **OD-PL-7 — decided yes (SC-22):** **Delete** is allowed on a locked item, so a user can get back under the limit without paying. Deleting goes to Recently deleted (SC-15). It is the only action besides view, Preview and export; the owner's wording "kuch bhee edit ni kar sakta" is otherwise kept as "no editing".

| Resource | Free limit | Over the limit after the trial (owner rule) |
|---|---|---|
| Sites | 3 | sites beyond the 3 active ones are **locked**: open read-only (view, Preview, export, Delete — OD-PL-7), no edit, no publish; live version keeps serving. Lock banner (Panel 22 slot, entry 4b — same sentence and actions as Panel 22 §7 *(R-1018, D3-23)*): "This site is over the Free limit. You can view, preview, export or delete it. · Upgrade to edit and publish · Choose what stays active (owner)" / "Ask the workspace owner to upgrade" (others) |
| Pages per site | 10 | pages beyond the 10 active ones (most recently edited, or the owner's chosen set) are **locked read-only** (Layers/canvas show a lock, Inspector disabled with reason "Over the Free limit — Upgrade to edit"); they publish unchanged with the site; New page disabled (SC-18) |
| Custom domains | 0 | stay connected and serving; domain settings **locked** (no edit, no add) |
| Team members | 1 | members beyond the owner become **view-only** until upgrade (no edit rights); invites locked |
| Redirects / integrations | 100 / 0 | existing keep working and ship; **locked** (no edit/add) |
| Storage | 500 MB | assets keep serving and stay usable in editable pages; uploads refused (SC-18) until under the limit or Pro |
| Asset versions | 5 | no existing version pruned (TR-8); new versions locked while over |
| Custom code / password | Pro | values stay saved and **locked read-only**: "Saved · not published on Free" (one string, M4). Saving other settings must still work (TR-11 — refuse only when the value changes; not run, needs checking) |
| Share links | 3 active, no password, 7-day expiry | existing links keep working until their expiry; new ones follow Free |
| Analytics | 7 days | view clamps to 7 days (existing); data not deleted |

### 5.5a "Choose what stays active" (dashboard Billing, OWNER only — NEW)
```
Choose what stays active                                         ✕
Free keeps 3 sites and 10 pages per site editable. The rest stay
live and viewable, but locked until you upgrade.
You can change this once every 30 days · next change: now
─────────────────────────────────────────────────────────────────
SITES  3 of 3 selected
 [✓] Bella Cucina        edited 2 h ago   ● Live     12 pages  ›
 [✓] Studio Noor         edited 1 d ago   ● Live      6 pages
 [✓] Atlas Law           edited 4 d ago   ○ Draft     3 pages
 [ ] Old portfolio       edited 3 mo ago  ● Live      8 pages   (disabled: 3 of 3 — clear one first)
PAGES — Bella Cucina  10 of 10 selected            (opens per site with ›)
 [✓] Home · [✓] Menu · … · [ ] Catering · [ ] Events
─────────────────────────────────────────────────────────────────
              [ Cancel ]  [ Save active set ]     or   Upgrade to Pro ↗
```
- Entry: Billing page (when over a limit), the locked-site banner, and the ⋯ chip popover (owner). Non-owners don't get the screen; they see the read-only reason.
- **Many items** *(R-1018, D3-28 / CS-17)*: a search field ("Search sites" / "Search pages") sits above a list when it has **more than 20 rows**; SC-2 search behaviour (Esc clears, second Esc blurs). Rows sort by **last edited, newest first**; checked rows stay in place (no re-sort on check). The list body scrolls inside the screen; the header lines, the "n of 3 selected" count and the footer buttons stay fixed. Width: dashboard dialog 640 (DS dialog widths) *(DS)*.
- Default set: as §5.5, fixed at trial end. Checkboxes stop at the limit; an unchecked row whose checkbox is unavailable says why ("3 of 3 — clear one first").
- **Once per 30 days:** after Save, the screen shows "Next change available {date}", with all checkboxes disabled and Upgrade still offered. The first choice after trial end is free and does not start the 30 days *(DS — the user hasn't seen the default yet)*.
- Save confirm — **SC-15 class (b) consequence confirm** (S2: states the consequence, default = Cancel) *(R-1018)*: "Old portfolio will be locked. It stays live and you can still view, export or delete it." [Save active set] [Cancel]. Toast: "Active set saved · next change {date}". Unlocking takes effect at once; locking takes effect for collaborators on their next action (server refuses with `OVER_FREE_LIMIT`).
- Upgrading unlocks everything in place (webhook → resolver), and the screen is no longer offered.

### 5.6 Publishing on Free — Panel 14 §5.2 rows (aligned, no new row)
| Row | Severity | Copy | Actions |
|---|---|---|---|
| Password protection on a Free site | **Blocking** | "This site is password protected. On Free the protection is removed and the site becomes public." | **Upgrade** (OWNER) / "Ask the workspace owner to upgrade" · **Remove protection and publish** (clears the password — free per `site-settings.service.ts:285-290` — then publishes; Undo not offered — **SC-15 class (b) consequence confirm** (S2, default = Cancel): "Remove password protection and publish? {domain} becomes public." [Remove and publish] [Cancel] *(R-1018)*) |
| Pro features on this site | Tip | "Custom code won't be included on Free." | Upgrade · Publish without it |
| Free-plan badge | Tip | "Free sites show 'Made with Buildrick'." | Upgrade to remove |
- Engineering truth needed (TR-7): `startPublish` refuses `PASSWORD_ON_FREE` while a password is stored on a Free workspace (so a second tab or API call cannot ship it public silently); the worker never applies a password on Free; the export omits site and page custom code on Free; the badge reads the effective plan. Rows show only when they apply; during the trial none show.
- **Enforcement levels (M1).** The password rule and the badge are enforced **server-side** (start and worker). Omitting custom code is **client-enforced**: the export builds the HTML in the browser (`ExportEngine.ts:636-637,975-976`), so a modified client could still ship code. This is a plan-fairness rule, **not a security boundary**, and is accepted as such *(DS)*. A server-side strip would need the worker to re-render pages, which is out of scope.
- **"Remove protection and publish" fails (M2b).** The password is cleared first, then the publish starts. If the publish fails, the site is still live with its old protected release, while the saved setting now says "no password". The outcome then reads "Publish failed — protection was removed from your settings, but the live site is still protected (v12)", with actions **Restore protection** (owner or admin re-enters a password; only allowed on Free as a restore inside the same task, TR-7) · **Try again** · View log. If clearing the password itself fails, nothing is published: "Couldn't remove protection — nothing was published. Try again." (Until the Access gate ships. After it, clearing the password unprotects the live site at once: the confirm says "{domain} becomes public now"; a failed publish reads "Publish failed — protection is off and the live site is public · Restore protection · Try again".)
- **Panel 10 OD-C3 (M3).** Access changes apply immediately once the SC-9 ⛔ Access gate ships (OD-C3 decided); until then, next publish with the C-3 warning. Either way protection never drops at trial expiry or on its own; it is removed only through this Blocking row's explicit choice, or when the user turns it off.
- **Live sites are unchanged until this publish** (SC-20): no job touches a deployed site at expiry.
- **Not a plan row** *(R-1018, S7)*: when the connected **Vercel** plan can't password-protect the site, Panel 14 §5.2 shows its own Blocking row ("Your Vercel plan can't protect this site"). It is a hosting limit, so it never uses Free/Pro wording or Upgrade (SC-20 "never plan words on technical limits"); it applies during the trial and on Pro too.

### 5.7 Billing door and plan refresh
- Doors: ⋯ chip, Overview card, Settings nav Billing (existing door card), LockedScreen / Access / header Upgrade, Upgrade dialog, limit lines → all open `/dashboard/settings/billing` in a **new tab** (IAF-14 G; existing `SettingsTab.tsx:669-671`). Kept *(DS: no in-place Billing; Stripe pages must not replace the editor tab with unsaved work)*.
- Plan refresh (TR-3): on window focus and after any plan-coded refusal the editor re-reads the effective plan; locks lift in place; toast "You're on Pro now" once. Fallback: line under the lock "Upgraded? Reload to unlock".
- A plan refusal from the server (`PAGE_LIMIT`, `QUOTA_EXCEEDED`, …) keeps the user's draft (IAF-20 I) and maps to the same SC-18 line.

### 5.8 Dashboard deltas (named only)
Billing page: trial card (state + date + Keep Pro); Plans page: owner check like Billing (Fix §13 #10); sidebar "Upgrade plan" (FREE) → "Pro trial · {n} days left" during the trial; overview from the resolver (Fix §13 #1).

## 6. States and permissions
| State | Behaviour |
|---|---|
| Plan unknown (loading / read failed) | Pro items render **unlocked-but-pending**: no lock, no Upgrade, actions run and the server decides; chip hidden *(R-1018, D3-25: the old "same rule as unknown role" precedent is removed — Panels 10 §6 / 15 §6 now treat an unknown role as "not granted"; the plan rule stays because the server enforces every plan gate)* |
| OWNER | all Upgrade / Keep Pro actions → Billing |
| ADMIN / EDITOR / DESIGNER | same locks and lines; action text "Ask the workspace owner to upgrade" (SC-18); Ask button sends a request after TR-9, text only until then |
| **Locked (over Free limit)** | view, Preview, export and **Delete** (→ Recently deleted, SC-15; OD-PL-7) only; every other action disabled with "Over the Free limit — Upgrade to edit" (owner, + Upgrade ↗ and Choose what stays active) / "Over the Free limit — Ask the workspace owner to upgrade" (others); the server refuses writes with `OVER_FREE_LIMIT` (TR-12) |
| VIEWER | Pro chips + limit lines read-only; no Upgrade, no Ask; existing viewer reasons win (SC-6) |
| Role lock and plan lock both apply | role reason shown first ("Only an admin can…"); plan chip still visible |
| Trial live | Pro behaviour; "· Pro trial" on lines; "Pro · included in your trial" on Pro items |
| Free after trial | §5.5 |
| Paid, PAST_DUE | Pro behaviour (PL-05, 7-day grace PL-03); owner chip "Payment failed" |
| Paid, cancel at period end | Pro until the date; chip "Pro · ends {date}"; then Free |
| Paid downgrade (cancel / dunning) | **never unpublishes** (OD-PL-2 decided); over-limit items lock per §5.5, the same as trial expiry |
| Trial, Pro chosen, then cancelled / first payment failed | no reconcile (§5.4 B2 rule); back to trial until `trialEndsAt`, else Free per §5.5 |
| Owner re-trial blocked (OD-PL-6) | workspace starts on Free; chip "Free · Upgrade"; no trial reminders |
| **Business, paid** (M8) | all Pro items unlocked, no Pro chips shown as locks; limit lines show Business numbers ("12 of 50 pages on Business"); unlimited limits show no line; chip "Business"; no trial, no reminders; Upgrade dialog never opens (no `openUpgrade` caller targets Business today) |
| **Business, cancel at period end / PAST_DUE / downgraded** | same as the Pro rows with "Business"; a Business → Pro change via the Portal is a webhook write (`stripe-webhook.service.ts:189-213`), and over-Pro content locks per §5.5 with Pro limits; never unpublishes (OD-PL-2 decided) |
| Offline | chip and lines show last known plan; Upgrade opens Billing anyway (browser handles offline) |
| Simulation / demo (:5050, no server) | plan = Free display only; storage uses the local 1 GB constant (PL-18) labelled "Local storage" not a plan |

## 7. Content
- Nouns: **Free, Pro, Business** — never "Starter", "Enterprise", "Premium" in UI (Fix §13 #8; templates "premium" → "Pro").
- SC-18 forms: "{used} of {limit} {unit} on {plan}" · "… · Pro trial" · "Available on Pro · Upgrade" · "Ask the workspace owner to upgrade" (SC-18, SC-20, Panel 15 T-TP-13 — kept; OD-PL-4 accepted 2026-10-17).
- Locked-state copy (one per gate):

| Gate | Locked copy (Free) | Upgrade line |
|---|---|---|
| Custom code (screen) | "Custom code is a Pro feature" + existing body (`LockedScreen.tsx:33-37`); saved code: "Saved · not published on Free" | Upgrade to Pro |
| Access › Password | "Password protection is a Pro feature. Share links work on every plan." | Upgrade to Pro |
| Pro template | card "Pro"; preview primary "Upgrade to use" / "Ask the workspace owner to upgrade" (Panel 15 T-TP-13) | dialog |
| Pages | "10 of 10 pages on Free" | "Upgrade for 30 pages per site" |
| Save over limit | toast "Not saved — page limit reached" + "Your plan allows 10 pages per site. Delete a page, or upgrade." (existing, kept) | Upgrade |
| Sites (duplicate) | "3 of 3 sites on Free" | "Upgrade for 15 sites" |
| Storage | "480 MB of 500 MB on Free"; full: "Storage full on Free — delete assets or upgrade" | "Upgrade for 5 GB" |
| AI prompts | Inactive this version (SC-21) — no AI quota line shown | — |
| Domains | "Custom domains are a Pro feature" | Upgrade |
| Redirects / members / integrations | "{used} of {limit} … on Free" | Upgrade |
| Share links | "3 of 3 active share links on Free" · password: "Password links are a Pro feature" | Upgrade |
| Analytics | "Free shows the last 7 days" | Upgrade for 30 days |
| Form inbox | "{n} of 100 submissions this month on Free" | Upgrade |
| Locked site | banner "This site is over the Free limit. You can view, preview, export or delete it." · owner: "Upgrade to edit and publish · Choose what stays active" · others: "Ask the workspace owner to upgrade"; Publish CTA disabled "Over the Free limit — Upgrade to publish" | Upgrade |
| Locked page | Pages row + Layers: lock glyph + "Over the Free limit"; Inspector "Over the Free limit — Upgrade to edit" | Upgrade |
| Locked domain | Domains row "Connected · locked on Free — Upgrade to change" | Upgrade |
| Locked redirect / integration | row "Locked on Free — Upgrade to edit"; Add disabled with SC-18 line | Upgrade |
| View-only member | member's editor: status "View only · this workspace is over its Free member limit"; owner's Members list: "View only on Free" chip | Upgrade |
- Never: "limit reached." without the plan and next step (Fix PL-11); never plan words on technical limits (SC-20).

## 8. Geometry and accessibility (NOT MEASURED)
- ⋯ plan-chip row 32 (first row under the "Search ⌘K" header, *R-1018*), full menu width, chip text truncates with full text in the accessible name. Overview card max 720 (IAF-14 F). Dialog 480, body scroll, buttons 32.
- Limit line 12px, `aria-describedby` on the control it limits; disabled controls are `aria-disabled`, focusable, reason as description (Panel 01 §5.9 rule).
- Trial-ended notice: Panel 22 banner (9a) — **no `role=status`**; announced once through Panel 22's polite pipe *(R-1018, D3-4)*; dismiss button labelled "Dismiss trial notice".
- ⋯ menu 280 wide (V7 popover widths 240/280/360; was 260 in Panel 01) *(R-1018)*.
- Chip states never rely on colour (glyph + text); warning/danger tones meet 4.5:1 on panel background.
- Upgrade dialog focus → title; Esc / Not now closes (SC-2); opening Billing keeps focus in the editor tab.

## 9. Preservation map
| Today | Target | Disposition |
|---|---|---|
| PL-01 limits, prices | unchanged; read through the resolver | Keep |
| PL-03 webhook-only plan writes | unchanged; + TRIALING status | Keep + Fix |
| PL-04 reconcile on paid downgrade (unpublishes sites above 3) | not called on any path; over-limit items lock instead (§5.5) | **Remove** (OD-PL-2 decided; no capability lost — sites stay live, locked) |
| PL-06 Checkout / Portal / cancel | unchanged; Checkout gains trial end | Keep + Change |
| PL-07 OWNER billing rights | unchanged | Keep |
| PL-09 server gates | same limits, one resolver | Keep + Fix |
| PL-10 per-user quotas | per site's workspace | Fix |
| PL-11 error strings | SC-18 wording | Change (copy) |
| PL-12 badge | effective plan | Keep + Fix |
| PL-15 locks, pills, Upgrade, new-tab Billing | same places; one chip; trial wording | Keep + Change |
| PL-16 template Pro gate | effective plan (Panel 15) | Keep + Fix |
| PL-17 UpgradeModal + `openUpgrade` | same mount and event; content §4.5; role-aware | Change |
| PL-19/20 notifications, email templates | + trial milestones; editor bell shows workspace notices | Keep + NEW |
| PL-21 dashboard billing/plans/sidebar | + trial card, owner check | Keep + Fix |
| `PaywallModal`, `LimitReached` (unused) | not used by this design; deletion is engineering's call (dead code, §13 #12) | — |
No capability removed.

## 10. Planned and owner decisions
Planned (not designed): annual-plan nudges, per-seat pricing, Business-specific moments, "ask owner" approval inbox in the dashboard.

| ID | Decision | Status |
|---|---|---|
| OD-PL-1 | Over-limit resources after the trial | **Decided by owner 2026-10-17** (SC-20): locked read-only until purchase; active set per §5.5/§5.5a |
| OD-PL-2 | Paid downgrade unpublishing sites above 3 (PL-04) | **Decided (SC-22):** never unpublishes; over-limit items lock per §5.5 |
| OD-PL-3 | Custom domains connected during the trial | **Decided (SC-22):** stay connected and serving, locked (no edit, no add) |
| OD-PL-4 | "Ask an admin" vs OWNER-only billing | **Decided (SC-22):** "Ask the workspace owner to upgrade"; billing stays OWNER-only |
| OD-PL-5 | Page-level custom head code | **Decided (SC-22):** Pro; saved code kept, locked on Free, covered by the "Pro features" Publish row |
| OD-PL-6 | Re-trial by delete-and-recreate | **Decided (SC-22):** one trial per owner per 12 months |
| OD-PL-7 | Delete on locked items | **Decided yes (SC-22):** Delete allowed (→ Recently deleted, SC-15); the only action besides view, Preview, export |

## 11. Engineering dependencies (add to SC-9; refine ⛔ P-TRIAL)
| ID | Dependency | Fallback until shipped |
|---|---|---|
| ⛔ TR-1 | `Workspace.trialEndsAt` (local-midnight instant, §5.3); set on both create paths; launch-day backfill; one trial per owner per 12 months (OD-PL-6) | No trial — plans as today (SC-20 fallback) |
| ⛔ TR-2 | One effective-plan resolver used by every PL-09/PL-10/PL-12 read and Billing overview; quotas keyed to the site's workspace; `hasPaid` (ACTIVE/PAST_DUE + ≥1 paid invoice) for the second-workspace rule and for reconcile (§4.1, §5.4) | No trial |
| TR-3 | Editor receives `{plan, source, trialEndsAt, canManageBilling}` at load and re-reads on focus / after a plan refusal | Load-time capture; "Upgraded? Reload to unlock" |
| TR-4 | Hourly milestone job (7/3/1/last day/ended, latest-due only, idempotent rows); editor bell includes workspace notices (`siteId` null) | Dashboard bell + email only |
| TR-5 | Trial reminder + ended email templates (DESIGN.md compliant) | In-app only |
| ⛔ TR-6 | Checkout during trial sets `trial_end = trialEndsAt` (≥48 h rule **unverified against Stripe docs**; <48 h → billing anchor at `trialEndsAt`, else charge-now copy, §5.4); webhook stores TRIALING and `paidStartsAt`; `handleSubscriptionDeleted` + dunning cron skip reconcile when `hasPaid` is false | **No trial** (plans as today) |
| ⛔ TR-7 | `startPublish` refuses `PASSWORD_ON_FREE`; worker skips password on Free; badge uses resolver (server-enforced). Export omits custom code on Free (**client-enforced, not a security boundary**). "Restore protection" allowed on Free only as the §5.6 failure recovery | No trial (protected sites would otherwise go public silently) |
| ⛔ TR-12 | Server refuses `OVER_FREE_LIMIT` on save, publish, page/settings/domain/redirect/integration writes and member edit rights for locked items; persisted active set + Billing "Choose what stays active" UI (§5.5a, once per 30 days, OWNER only); unlock on webhook (resolver) | No trial |
| TR-11 | On Free, `siteDetail.settings.update` refuses custom code / password only when the value **changes** (B3; `site-settings.service.ts:282-306` vs `BuildrikSyncProvider.ts:352-353`) — **not run, needs checking** whether today's Free saves already fail after a downgrade | Editor stops sending unchanged `headCode`/`bodyCode` on Free |
| TR-8 | Plan change never prunes existing asset versions | Before replace on Free: "Free keeps 5 versions — the oldest will be removed" |
| TR-9 | "Ask owner to upgrade" sends an owner notification naming the feature | Text only, no button |
| TR-10 | Capacity reads for sites/domains/storage/redirects in the editor (pages = existing SC-9 "Page capacity query") | Post-action server error mapped to the SC-18 line |

## 12. Acceptance (specified, NOT RUN)
| ID | Case |
|---|---|
| T-PL-01 | New sign-up: workspace has a trial ending in 30 days; the ⋯ plan-chip row (first row under the "Search ⌘K" header) shows "Pro trial · 30 days left" *(R-1018)*; Custom code editable with "Pro · included in your trial" |
| T-PL-02 | During the trial: 11th page creates; publish has no badge; no plan rows in Publish |
| T-PL-03 | Every server gate in PL-09/PL-10 returns the Pro limit during the trial and Free after it (one resolver; a unit test per call site) |
| T-PL-04 | Reminders arrive in app and email at 7, 3, 1 days and the last day — once each — and stop after Pro is chosen |
| T-PL-05 | Choosing Pro on day 10: no charge until `trialEndsAt`; chip "Pro · starts {date}"; plan written only by the webhook |
| T-PL-06 | Expiry: nothing deleted or unpublished; the live site still serves the trial-era release without badge until the next publish |
| T-PL-07 | First open after expiry: one non-modal notice **in the Panel 22 banner slot (9a)**, no `role=status`; dismiss persists per user per workspace; bell keeps the item *(R-1018)* |
| T-PL-08 | Free + password set: Publish shows the Blocking row; calling the publish API directly is refused `PASSWORD_ON_FREE`; "Remove protection and publish" ships a public site with the badge |
| T-PL-09 | Free + custom code: Tip row; published HTML contains no custom code; badge present |
| T-PL-10 | 12 pages on Free: edits on the 10 active pages save; pages 11–12 are read-only with "Over the Free limit — Upgrade to edit" (owner) / "Over the Free limit — Ask the workspace owner to upgrade" (editor); Delete is allowed on them; New page disabled with "12 of 10 pages on Free" |
| T-PL-11 | EDITOR opens the Upgrade dialog: no Billing button; OWNER: "Choose Pro in Billing ↗" opens a new tab |
| T-PL-12 | Upgrade in the Billing tab, return to the editor tab: locks lift without reload (TR-3) |
| T-PL-13 | Upgrade dialog lists only PLAN_LIMITS deltas; no "Priority support"; **no AI row** while SC-21 holds *(R-1018, D3-9)* |
| T-PL-32 *(R-1018)* | Choose what stays active with 45 sites → search field shown; rows newest-edited first; header, count and buttons stay visible while the list scrolls; Save asks the consequence confirm (default Cancel) |
| T-PL-33 *(R-1018)* | ⋯ menu: header row is "Search ⌘K" only; the plan chip is the first row below it |
| T-PL-14 | Every Pro marker uses the one chip; no "Enterprise"/"Starter"/"Premium" text in the editor |
| T-PL-15 | A trial workspace cannot create a second workspace unless it owns a paid one; **choose Pro during the trial (TRIALING, plan PRO) → create a workspace is still refused** → cancel → still refused (B1) |
| T-PL-19 | Choose Pro during the trial with 15 published sites, then cancel before `trialEndsAt` → no site unpublished; back on the trial; after expiry §5.5 applies (B2) |
| T-PL-20 | Choose Pro during the trial, first invoice fails, dunning cron runs → no site unpublished; workspace on Free; copy "Nothing was unpublished" (B2) |
| T-PL-21 | Free + saved custom code + edit the SEO title → settings save succeeds; editing the code itself is refused with the Pro lock (B3, TR-11) — *not run, needs checking* |
| T-PL-22 | Choose Pro with 30 h of trial left → no charge before `trialEndsAt`, or (fallback) the "starts billing today" line is shown before Checkout (B5) |
| T-PL-23 | "Remove protection and publish", publish fails → outcome names the protected live release; Restore protection re-applies a password on Free (M2b) |
| T-PL-24 | Workspace timezone UTC+5: the 1-day reminder fires after 09:00 local on that day; Ended fires right after local midnight; job down 2 days → one (latest) reminder only (M5) |
| T-PL-25 | Delete a trialled workspace, create a new one within 12 months → no trial (OD-PL-6) |
| T-PL-26 | Business workspace: no Pro locks, limit lines in Business numbers, chip "Business", no reminders (M8) |
| T-PL-27 | 5 sites at trial end: the 2 least recently edited open read-only; Preview and export work; every edit control is disabled with the locked reason; the live URL still serves the last release |
| T-PL-28 | Calling the publish or save API for a locked site (or a locked page edit) is refused `OVER_FREE_LIMIT`; the UI maps it to the locked reason and keeps any draft |
| T-PL-29 | Owner opens Choose what stays active, swaps one site, saves → that site unlocks at once, the other locks; the screen then shows "Next change available {date}" with checkboxes disabled; non-owners can't open it |
| T-PL-30 | Delete a locked site → it moves to Recently deleted (SC-15) and frees a slot; nothing else about locked items is editable (OD-PL-7) |
| T-PL-31 | Owner upgrades in the Billing tab → after the webhook, every locked item unlocks in place in the open editor (TR-3) without reload |
| T-PL-16 | Asset with 12 versions after expiry: replacing keeps all 12 old versions (TR-8) |
| T-PL-17 | Plan read fails: no lock and no Upgrade shown; server refusal still maps to the SC-18 line |
| T-PL-18 | Viewer sees chip read-only, no Upgrade or Ask anywhere |

## 13. Code defects found during this inventory (engineering, not design)
1. Two plan sources: Billing overview reads `Subscription.plan` (`billing.service.ts:64`), gates read `Workspace.plan` (e.g. `site-quota.ts:39`) — a grandfathered paid workspace with no subscription row shows "Free" in Billing.
2. AI prompts/day, storage and asset-version caps resolve the plan from the user's first-joined workspace, not the site's (`quota.service.ts:48-55`, `media.service.ts:49-55`); storage sums the user's assets across workspaces (`media.service.ts:597-600`).
3. Custom code ships after a downgrade: export injects site and page code with no plan check (`ExportEngine.ts:636-637,975-976`); the server gates only saving (`site-settings.service.ts:306`).
4. Worker applies the site password on any plan (`route.ts:319-321`) — fine today, wrong under SC-20 (§5.6).
5. Asset-version pruning on the next version write uses the current plan cap (`media.service.ts:517-518`), deleting versions after a downgrade, against the "nothing deleted" rule stated at `billing.service.ts:269-274`.
6. `checkout.session.completed` hard-codes `status: "ACTIVE"` (`stripe-webhook.service.ts:116`) even for a trialing subscription.
7. `UpgradeModal` offers Upgrade to every role though checkout is OWNER-only (`UpgradeModal.tsx:84-104` vs `billing.ts:41-49`); lists "Priority support" (no support tier in code) and "AI-powered features" (Free has AI, `plan-limits.ts:34-35`).
8. `LockedScreen` names "Enterprise" (`LockedScreen.tsx:28`); plans are FREE/PRO/BUSINESS and the Billing pill says "Business" (`SettingsTab.tsx:124`).
9. Four "Pro" treatments: purple Badge (`UpgradeModal.tsx:116`), accent tint (`LockedScreen.tsx:76`), nav pill (`SettingsTab.tsx:869-871`), text " · Pro" (`TemplateCard.tsx:82`).
10. Dashboard Plans page lets non-owners press plan buttons that the server refuses (`settings/plans/page.tsx:107-113`; Billing page checks, `billing/page.tsx:145-146`).
11. `sendAutoDowngradeEmail` / `sendPlanLimitWarningEmail` have no callers (`email.service.ts:180,227`); the dunning downgrade sends no email; templates use `system-ui` and a red `#E42313` button (`auto-downgrade.tsx:11,20`), against DESIGN.md (no system fonts, accent `#1A56DB`).
12. `PaywallModal` and `LimitReached` (`components/billing/`) are not imported anywhere.
13. Editor plan captured once at load (`BuildrikSyncProvider.ts:754-755`) — an upgrade in another tab is invisible until reload.
14. Editor bell filters by `siteId` (`notification.service.ts:25-29`), so PAYMENT_FAILED (no `siteId`, `stripe-webhook.service.ts:64-73`) never shows in the editor.
15. Limit messages without plan or next step: "Page limit reached." (`pages.ts:63`), "Storage quota exceeded." (`media.ts:192`), "Redirect limit reached." (`site-detail.ts:248`), "Integration limit reached." (`account.ts:302`).
16. Template Pro gate is client-only (`TemplatesTab.tsx:156-157`) — low risk (template HTML is local), noted for completeness.
17. Probable: a Free workspace that has saved custom code (e.g. after a downgrade) fails every Site settings save, because the editor re-sends the code (`BuildrikSyncProvider.ts:352-353`) and the server refuses any non-empty code on Free (`site-settings.service.ts:282-306`) — **not run, needs checking**.
18. `handleSubscriptionDeleted` and the dunning cron run `reconcileWorkspaceToFreePlan` whether or not the subscription ever collected a payment (`stripe-webhook.service.ts:245`, `billing-downgrade/route.ts:45`).

## 14. Review and not verified
Independent `design-qa-critic` review: pass 1 PROPOSAL (B1–B5 blocking + M1–M8 notes, 9 items) — all fixed 2026-10-17:
- B1: `hasPaid` excludes TRIALING (§4.1, T-PL-15).
- B2: no reconcile without a collected payment (§5.4, T-PL-19/20).
- B3: TR-11 (T-PL-21).
- B4: SC-18 text kept, OD-PL-4 accepted 2026-10-17.
- B5: the <48 h path, and the TR-6 fallback is now "no trial".
- M1: §5.6. M2/M2b: §5.6 and the follow-ups below. M3: §5.6. M4: §5.5. M5: §5.3. M6: OD-PL-1. M7: OD-PL-6. M8: §6.

Pass 2 (5 blocking + notes) — fixed 2026-10-17:
- B1: the active set is the 10 most recently edited pages per site and the 3 most recently edited sites; the owner can choose once per 30 days (§5.5, §5.5a).
- B2: ⛔ TR-12, plus the "Choose what stays active" screen (§5.5a).
- B3: AI removed from the Upgrade dialog and from §7 (SC-21).
- B4: §6 Locked, ADMIN, paid-downgrade and Business rows; PL-04 → Remove; §7 locked copy rows.
- B5: T-PL-10 rewritten; T-PL-27…31 added.
- Notes: lock line in the email and the notice; §10 marked decided; §14 copy.

Not verified:
- runtime of any state;
- Stripe `trial_end` limits and the billing-anchor path (test mode not exercised; the 48 h rule is not checked against Stripe docs);
- today's Free save with saved code (B3);
- email rendering, notification delivery, geometry and screen-reader output.

Code facts are from a source read on 2026-10-17, not from running the app.

**Text follow-ups for other docs (not edited here):**
- **00 SC-9:** add TR-1…TR-12 (§11). P-TRIAL ⛔ becomes "see Panel 23 TR-1, TR-2, TR-6, TR-7, TR-12".
- **00 SC-18:** append "Billing rights = workspace OWNER (`billing.ts:41-49`). Copy for others stays 'Ask the workspace owner to upgrade' (OD-PL-4 decided). A plan lock is never worded as a role lock. Full pattern and per-gate copy: Panel 23 §4.4, §7."
- **00 SC-20:**
  - add "Trial = Pro is computed on read by one effective-plan resolver (Panel 23 §4.1).
  - A subscription that never collected a payment never unpublishes sites.
  - The second-workspace rule counts only workspaces that have paid.
  - Trial per owner per 12 months (OD-PL-6).
  - Reminders: hourly job, workspace timezone, 09:00 local; the trial ends at local midnight after day 30 (Panel 23 §5.3).
  - Choosing Pro with <48 h left: billing anchored at trial end, or charge-now copy (§5.4)."
- **Panel 14:** a locked site's Publish CTA is disabled with "Over the Free limit — Upgrade to publish"; the server refusal `OVER_FREE_LIMIT` is mapped in §7 (TR-12).
- **Panel 14 §5.2:**
  - Password row action reads "Remove protection and publish (clears the saved password first)".
  - Add the server refusal **`PASSWORD_ON_FREE`** to §5.2 "Server enforces" and to the §7 table: "This site is password protected and this workspace is on Free. — Upgrade · Remove protection and publish".
  - Add the failure outcome "Publish failed — protection was removed from your settings, but the live site is still protected (v12) · Restore protection · Try again".
  - Note that custom-code omission is client-enforced.
- **Panel 15:** "premium" → "Pro"; T-TP-13 keeps "Ask the workspace owner to upgrade" (OD-PL-4 accepted 2026-10-17).
- **Panel 10:** the Access lock shows "Saved · not published on Free"; cross-reference OD-C3 ↔ Panel 23 §5.6.
- *(R-1018)* **Panel 01 §6:** the ⋯ menu header holds only "Search ⌘K"; the plan chip moves to the first row under it (D3-5); menu width 280 (V7).
- *(R-1018)* **Panel 22 §4.2:** entry (9a) "Trial ended" — applied there.
