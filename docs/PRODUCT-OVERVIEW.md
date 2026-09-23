# Buildrick — Complete Product Overview

_Last updated: 2026-07-24. Single source of truth for "what is this product." Grounded in the shipped code (routers, schema, plan limits), not aspiration. Where something is half-built or founder-gated, it says so._

> **Name note:** the repo is `buildrik`; the shipped brand and wordmark are **Buildrick** (prod: `app.buildrick.io`). Same product.

---

## 1. What it is

Buildrick is an **AI-powered, drag-and-drop website builder** aimed at people who build sites *for other people* — solo designers and small studios currently billing clients on Webflow or Framer.

Three ways to start a site, all sharing one element vocabulary:
1. **Drag & drop** — visual editor, section by section.
2. **Templates** — pick a starting design, apply to a new or existing site.
3. **AI generate** — describe the business, get a first draft.

The bet is not "another website builder." The bet is the **agency workflow around** the builder: group sites under clients, send a site for client sign-off, get approval, then publish. That client-review loop is the wedge that separates it from Wix/Squarespace/Durable.

- **Who it's for:** time-constrained power users who bill clients. Not beginners.
- **Peers:** Webflow, Framer, Webstudio. **Not peers:** Wix, Squarespace, Durable.
- **Shape:** desktop web app. The editor is the primary surface; a signed-in dashboard wraps it.

---

## 2. The core loop

```
Create a site  →  Edit (drag / template / AI)  →  Send for client review
      ↑                                                    │
      │                                                    ▼
   Analytics  ←  Live on a domain  ←  Publish  ←  Client approves
```

The whole product is organized around moving a site through that lifecycle. The agency layer (clients, reviews, sign-off, handover) is what makes the loop a business, not just a builder.

---

## 3. Product surfaces (what a user actually sees)

### Two-level app shell
- **Top nav (ecosystem):** Dashboard · Marketplace · Learn · Resources · Templates. Browse-the-catalog areas.
- **Sidebar (workspace):** Home · Getting started · Sites · **Agency** (agency-only) · Media · Settings. The 6 places you actually work.

### Dashboard (`/dashboard`)
- **Home** — greeting, "Needs attention", 4 stat tiles (Sites / Published / Visitors / Team), recent activity, quick actions.
- **Sites** (`/dashboard/projects`) — grid/list of every site with real screenshot thumbnails (falls back to a generated cover), status filters, folders, bulk actions.
- **Site detail** (`/dashboard/sites/[id]`) — Overview + tabs: Traffic · Domains · SEO · Submissions · Redirects · Sharing · Settings · Access · Feedback · Publish. Health score, publish/unpublish, send-for-review, apply-template.
- **Media** — workspace asset library (images/video/logos), folders, stock search (Pexels/Unsplash), storage meter.
- **Settings** — grouped: Workspace & branding · Security (2FA, sessions) · Team (members/roles/seats) · Plans · Billing · Usage & AI credits · Domains · Integrations · Notifications · Account · Danger zone.
- **Getting started / Learn / Resources / Help / Marketplace / Notifications / Activity**.

### Agency (`/dashboard/agency`, agency-flag only)
Tabs: **Clients · Reviews · Handover · Library · Shared theme · Partner.** Group sites per client, run sign-off, hand a finished site to the client, share components/theme across the workspace.

### Editor (`/edit/[siteId]`)
The in-app visual builder (bundled from `packages/editor`). Rail: Insert · Layers · Pages · Media · Content · Brand. Comments as a canvas mode. ⌘K command palette. Publishes to the workspace's own Vercel. Captures a screenshot thumbnail at publish.

### Client-facing (token-scoped, no login)
- `/review/[token]` — a client reviews a site and approves/requests changes.
- `/share/[token]` — a shared draft preview.
- `/transfer/accept` — accept a site/workspace handover.

### Auth + onboarding
Full signed-out craftwork auth (login, signup, magic link, 2FA, OTP, social, password reset, workspace select/setup, invites, ~15 error/state screens) and a post-verification onboarding wizard (workspace → first site → path chooser → AI/template/blank).

---

## 4. The agency wedge (the differentiator)

- **Clients** group sites per customer with optional white-label branding.
- **Reviews / sign-off** — a site can be sent for review; publishing can be **gated on an approved review** (the approval gate is enforced server-side).
- **Handover** — hand a finished site to the client.
- **Shared library + shared theme** — reuse components and a brand theme across a workspace's sites.
- **Partner program** — referral/partner surface.

**Honest state:** the review/approval machinery exists and the publish gate is real, but the flow was built more as *internal admin approval* than a polished *external client sign-off* experience. The true end-to-end proof (a real named client walking `/review/<token>` and approving) is a founder/pilot step, not something shipped-and-observed.

---

## 5. Publishing model

Sites deploy into **the workspace's own Vercel account** via per-workspace OAuth — **Buildrick hosts nothing**. Publishing is impossible without a Vercel connection (`runPrePublishChecks` hard-fails on it). At-rest OAuth tokens are AES-256-GCM encrypted. Custom domains + DNS records are managed per plan.

---

## 6. Plans & pricing (real, from `lib/constants/plan-limits.ts`)

| | **FREE** | **PRO** ($29/mo, $23 yearly) | **BUSINESS** ($79/mo, $63 yearly) |
|---|---|---|---|
| Sites | 3 | 15 | 50 |
| Pages / site | 10 | 30 | 50 |
| Custom domains | 0 | 3 | 20 |
| Team members | 1 | 5 | 25 |
| Storage | 500 MB | 5 GB | 50 GB |
| Bandwidth | 1 GB | 10 GB | 100 GB |
| AI generations | 3 | 20 | unlimited |
| AI prompts/day | 10 | 200 | unlimited |
| Upload max | 10 MB | 50 MB | 200 MB |
| Form submissions | 100 | 2,500 | unlimited |
| Integrations | 0 | 2 | unlimited |
| Analytics retention | 7 d | 30 d | 90 d |
| Share-link passwords | no | yes | yes |

Billing is **hosted Stripe Checkout + Customer Portal** — Buildrick never touches a card number. A plan flips to ACTIVE only via the verified `checkout.session.completed` webhook. Dunning (PAST_DUE) runs off `invoice.payment_failed`.

**Honest state:** Stripe **test-mode** products/prices exist; **live-mode** products + price ids are a founder step in the Stripe dashboard.

---

## 7. AI

- **Site generation** via OpenAI (`OPENAI_API_KEY`). The AI onboarding path drafts a first site from a business description; without the key it degrades to "AI drafting isn't configured yet."
- Quota is counted in **generations + prompts/day** per plan, not model spend.
- **Model tiering is deliberately flat today** — every tier runs `gpt-4o-mini`. The old "higher plan → better model" ladder (haiku/sonnet/opus) was fictional (no Anthropic key ever existed) and was removed. One honest model beats three fictional ones; the ladder is worth rebuilding on models we can actually call.
- Alt-text generation, AI-assisted actions, and an AI-adoption analytics trail also exist.

---

## 8. Feature domains (tRPC routers = the API surface)

`account · actions · ai · api-tokens · auth · billing · client-review · clients · cms · comments · dashboard · features · forms · handover · help · integrations · learn · marketplace · media · notifications · onboarding · pages · reviews · site-component · site-detail · site-version · sites · team · templates · theme · upload · user-template`

Notable capabilities beyond the obvious: a lightweight **CMS** (collections + entries) for data-driven pages, **forms** with submissions, **comments** on sites, **site/asset/template versioning**, **redirects**, **SEO**, **analytics**, **notifications**, **API tokens**, a **help center + support tickets**, and a **marketplace** of apps/integrations.

---

## 9. Data model (Prisma, ~70 models — the important ones)

- **Identity/workspace:** User, Account, Session, Workspace, WorkspaceMember, Invite, Referral, WorkspaceFeature, WorkspacePreset.
- **Sites:** Site, Page, Folder, Domain, DnsRecord, Redirect, SiteVersion, SiteComponent, SiteThemeSnapshot, SitePermission.
- **Agency:** Client, ReviewRequest, Reviewer, ShareLink, WorkspaceTransfer, WSSharingSettings.
- **Content:** CmsCollection, CmsEntry, FormBlock, FormSubmission, Comment, MediaAsset (+folders/versions), Template, UserTemplate.
- **Commerce:** Subscription, PaymentMethod, Invoice, ProcessedWebhookEvent.
- **AI:** AIUsage, AIGenerationJob, AiAdoptionEvent.
- **Ops/security:** AuditLog, ActivityLog, Notification/NotificationPref, LoginAttempt, KnownDevice, RateLimitBucket, ApiToken, AccountDeletionReq, PublishBuildJob, PendingUpload.

---

## 10. Roles & permissions

- **VIEWER (0) · EDITOR/DESIGNER (1) · ADMIN (2) · OWNER (3)** within a workspace, plus **CLIENT** = a token-scoped reviewer (no account).
- Enforced server-side in `permission.service.ts` (`assertSiteAccess`, `checkSiteRole`, `checkWorkspaceRole`). Site-level role overrides exist. The `agency_layer` feature flag gates the whole agency wedge.

---

## 11. Architecture & stack

- **Stack:** Next.js 16 (App Router, Turbopack) · React 19 · Tailwind 4 · tRPC 11 · NextAuth 5 · Prisma 5 · PostgreSQL · Zod · Nodemailer (SMTP).
- **Strict one-direction data flow:** `Page → tRPC router → Service → Prisma/External API`. Pages never import services; routers never touch Prisma; services own all logic + DB access.
- **Packages:** `dashboard` (the Next app), `editor` (the Vite-built visual builder, bundled into Next at `/edit`), `shared` (transport-safe Zod schemas + API client — the validation SSOT).
- **Design system:** one accent `#406ED6` everywhere, Inter (dashboard) / General Sans + Inter Tight (marketing/auth) / Geist Mono (data). Industrial, light, "Webflow meets Linear, daylight edition." Full rules in `DESIGN.md`.

---

## 12. Security posture

- Cookie-session auth (NextAuth JWT) + token-scoped access for client review/share links.
- 2FA (TOTP) with AES-encrypted secrets, device recognition + alerts, login-attempt rate limiting + Cloudflare Turnstile captcha gate, generic auth errors (no user-enumeration oracle).
- Stripe webhooks verified by raw HMAC signature with a replay window; OAuth tokens encrypted at rest; API tokens are workspace-scoped (IDOR-safe).
- Side effects keyed by a path param are authorized **before** the write (e.g. the site-thumbnail route checks edit access before touching Blob storage).

---

## 13. Deployment & infra

- **Prod:** `app.buildrick.io`, hosted on a **cPanel / LiteSpeed Node app** (not Vercel — Buildrick's own app runs here; user *sites* deploy to their own Vercel).
- Deploy = build the Next standalone bundle, graft static/public/openai, rsync to a staging dir, swap directories, kill the old worker (LiteSpeed lsnode auto-respawns), verify the new BUILD_ID + a new route resolves. Rollback = swap the dirs back.
- Config lives in the cPanel Node env; `NEXT_PUBLIC_*` are baked at build time. `npm run env:check:prod` guards required prod vars.

---

## 14. Current status (what's live vs. gated)

**Live on prod today:** the full builder, dashboard, auth, onboarding, templates, media, publishing to BYO Vercel, the agency layer (dormant until the flag is flipped per workspace), Stripe billing (test mode), AI drafting (when the key is set), and **real screenshot thumbnails on publish** (shipped 2026-07-24).

**Founder / pilot-gated (can't be done by engineering alone):**
- Flip `agency_layer` for a real named pilot workspace.
- A real client walking `/review/<token>` and approving (the wedge's true proof).
- Stripe **live-mode** products/prices; live secrets (Blob, OpenAI, Anthropic).

**Known honest gaps:**
- Agency review flow is closer to internal-admin approval than a polished external client experience.
- AI model tiering is flat (one model, honestly) until a real cost model is built.
- Real-time multiplayer collab is **demo-only** — it needs OT/CRDT (Yjs) before it can ship; do not present it as production multiplayer.

---

## 15. One-paragraph summary

Buildrick is a designer-grade, AI-assisted website builder whose real product is the **agency workflow around it**: create a client's site three ways, edit it visually, send it for the client's sign-off, publish it to the client's own Vercel, and watch its analytics — all under a role-gated, multi-tenant workspace with hosted Stripe billing. The builder is shipped and live; the wedge (client sign-off → publish) is built and enforced but still needs a real pilot client to prove end-to-end.
