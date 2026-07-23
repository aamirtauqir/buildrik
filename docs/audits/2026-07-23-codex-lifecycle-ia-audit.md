# Codex Job-Based IA Audit — Site Lifecycle Connectedness

**Date:** 2026-07-23 · **Auditor:** OpenAI Codex (via `/codex`, read-only) ·
**Scope:** `packages/dashboard` + related server code (editor package excluded).
**Method:** Traced ~40 files — schema, tRPC routers, services, and every lifecycle
screen — verified against `docs/DASHBOARD-FLOW.md` and the 2026-07-22 audit.

> **How this relates to the prior audit:** the 2026-07-22 pass covered surface
> problems (dead links, missing states, ungated permissions — all fixed). This
> one covers what that pass explicitly did *not*: whether the site lifecycle
> (`Site → Editor → Client → Review → Changes → Approval → Publish → Live →
> Analytics`) is composed as one connected job in the dashboard IA, or scattered
> across independent feature destinations. Findings here are deeper, not overlap.

---

## Verdict

Buildrick's backend models one **site-centric lifecycle**, but the dashboard IA
exposes it mostly as **independent feature areas**. The connective tissue exists
in data via `Site.id`, `Site.clientId`, `ReviewRequest.siteId`,
`PublishBuildJob.siteId` — but the canonical dashboard screens do not compose
**assigned client + current review round + approved artifact/version + publish
readiness + live monitoring** in one place. The strongest lifecycle model lives
in *services*, not in the UI. In practice, `Sites`, `Agency › Clients`, and
`Agency › Reviews` behave as **adjacent destinations, not one continuous job flow**.

---

## Issues (all file:line-cited)

### 1. Critical — onboarding drops the client contact
**Role:** Owner/Admin/Editor · **Job:** create a client-backed site, use that
client relationship later for review.
**Current:** `/onboarding/site` captures a client email ("Used for review and
approval links"), `useOnboardingComplete.attachClient()` creates/assigns the
client — **but the email is never persisted; `Client` has no email field and
`createClient` ignores it.**
**Impact:** the product collects client contact intent, then loses it before the
review stage; assigned client and review recipient are disconnected.
**Fix:** persist a primary client review contact; surface on client + site
detail as the default review recipient.
**Code:** `packages/dashboard/app/onboarding/site/page.tsx:156` ·
`packages/dashboard/components/onboarding/wizard/use-onboarding-complete.ts:30` ·
`prisma/schema.prisma:610` (Client model) · `server/services/clients.service.ts:54`.
**Acceptance:** client email survives onboarding, is editable later, is visible
on the assigned site, and pre-fills client review sends.

### 2. Critical — dashboard "Send for review" is the wrong path
**Role:** Editor/Admin · **Job:** send a specific version to a client.
**Current:** Site-detail header "Send for review" opens a modal that submits only
`siteId` + optional `note` — it's the **internal admin approval path, not the
client sign-off path**; it never collects `clientEmail`, `changeSummary`, or
`snapshotPages`, though the service supports them.
**Impact:** the primary review CTA doesn't continue the `Site → Client → Review`
chain; it routes into a different workflow.
**Fix:** rename to "Submit for internal approval"; add a separate "Send to client"
action bound to the client contact + frozen snapshot flow; show which mode is active.
**Code:** `packages/dashboard/components/site-detail/site-header.tsx:113` ·
`packages/dashboard/components/reviews/send-review-modal.tsx:20` ·
`server/trpc/routers/reviews.ts:61` · `server/services/review.service.ts:34`.
**Acceptance:** from Site detail, users can explicitly choose internal approval vs
client sign-off, with the client path capturing recipient + frozen snapshot.
**Note:** the M23 fix (2026-07-23) only stopped this path from rotating/killing the
client token; the *split into two actions* is still open.

### 3. Major — Sites surfaces hide client + review state
**Role:** Owner/Admin/Editor · **Job:** know which client / review state / publish
state a site is in from the main Sites surfaces.
**Current:** `sites.list` returns `clientId`, but the Sites UI never shows or
filters by client; site detail loads `sites.get` with no client relation;
overview shows publish stats only.
**Impact:** the canonical site index and shell hide who the site belongs to and
whether it's awaiting approval, approved, stale, or in changes-requested.
**Fix:** client/review/publish summary chips on cards + header; client
filter/grouping on Projects.
**Code:** `server/services/sites.service.ts:83` ·
`packages/dashboard/components/sites/site-list-view.tsx:40` ·
`packages/dashboard/components/sites/site-card-full.tsx:32` ·
`server/services/sites.service.ts:315` ·
`packages/dashboard/app/dashboard/sites/[id]/layout.tsx:20` ·
`server/services/site-detail.service.ts:4`.
**Acceptance:** a user sees assigned client, latest review state, and live/draft
state before opening the site.

### 4. Major — Agency Reviews is a moderation list, not a workbench
**Role:** Admin · **Job:** review submitted work with enough context.
**Current:** `/dashboard/agency/reviews` → `reviews.list({status:"PENDING"})`.
Queue shows only siteName/createdAt/note/changeSummary — **no client link, no
invited email, no open-comment count, no snapshot/version, no deep link to the site**.
**Impact:** Agency Reviews behaves like a standalone moderation list, not a
lifecycle workbench.
**Fix:** rows open a review workspace with site/client/snapshot/comments/publish-
readiness/round history.
**Code:** `packages/dashboard/components/reviews/review-queue.tsx:30` ·
`server/services/review.service.ts:250` (listReviews payload) ·
`server/services/review.service.ts:158` (unused richer round model).
**Acceptance:** an admin can review without leaving the queue blind and can
navigate directly to the client/site context.

### 5. Major — publish checks omit approval readiness
**Role:** Editor/Admin · **Job:** know publish readiness before attempting publish.
**Current:** `/dashboard/sites/[id]/publish` → pre-publish checks → click Publish →
approval error only *after* the mutation. Pre-publish checks **do not include
approval / stale-approval status**; enforced only inside `startPublish`.
**Impact:** review/approval isn't visible as part of the go-live job; the user
discovers a lifecycle dependency only after failure.
**Fix:** publish readiness must include "Needs approval / Approved / Approved but
edited since" as a first-class check with a link to the review round or resend flow.
**Code:** `server/services/publish.service.ts:17` + `:189` ·
`server/trpc/routers/sites.ts:320` ·
`packages/dashboard/components/publish/pre-publish-checks.tsx:21` ·
`packages/dashboard/components/site-detail/site-header.tsx:118`.
**Acceptance:** before clicking Publish, the user sees whether approval is missing,
current, or stale, and what to do next.

### 6. Major — no visible "which version was approved"
**Role:** Editor/Admin · **Job:** send, revise, resubmit, and later prove which
version was approved.
**Current:** review stores `snapshotPages` (frozen HTML); publish/version history
exist separately. The approved artifact is **not linked to `SiteVersion` or publish
history by a visible version id**; stale approval is inferred only by timestamps.
**Impact:** the system enforces policy, but users can't track "which version did
the client approve?" across dashboard surfaces.
**Fix:** a visible review-artifact/version reference carried through Site, Review,
Publish surfaces (Review round N, Sent on, Snapshot available, version label).
**Code:** `prisma/schema.prisma:491` (ReviewRequest.snapshotPages) ·
`server/services/client-review.service.ts:131` · `prisma/schema.prisma:1078`
(SiteVersion) · `server/services/site-version.service.ts:15` ·
`server/services/publish-approval.ts:18` (stale rule).
**Acceptance:** every approved round has a human-readable artifact/version label
visible from Site, Reviews, and publish history.

### 7. Major — resolved reviews vanish from the dashboard
**Role:** Editor/Admin · **Job:** leave a flow and resume later.
**Current:** the richer `reviews.status/currentRound` model exists but has **no
dashboard consumer** — the Reviews screen hard-codes `status:"PENDING"`, so
resolved rounds disappear after approval/changes-requested unless the user opens
the editor.
**Impact:** after a decision, the dashboard loses the review chain.
**Fix:** Site detail owns a persistent "Client & Review" summary (current round,
last decision, next action); add resolved/history filter to Agency Reviews.
**Code:** `packages/dashboard/components/reviews/review-queue.tsx:33` ·
`server/trpc/routers/reviews.ts:94` · `server/services/review.service.ts:181`.
**Acceptance:** a user returning later sees the latest round, decision, comments,
and next action from Site detail or Reviews.

### 8. Major — Client detail is a bucket, not a hub
**Role:** Admin/Owner · **Job:** manage work by client.
**Current:** `/dashboard/agency/[id]` shows sites as plain rows — **no link to the
site, publish state only, no review state**; empty-state copy conflates "client"
with "invite editor".
**Impact:** Clients behaves as a branding/assignment bucket, not a lifecycle hub
for that customer's work.
**Fix:** linked site rows with per-site lifecycle badges (pending review / changes
requested / published); separate collaborator invites from customer identity.
**Code:** `packages/dashboard/components/clients/clients-view.tsx:150` ·
`packages/dashboard/components/clients/client-detail-view.tsx:89` + `:107` ·
`packages/dashboard/components/clients/clients-view.tsx:255`.
**Acceptance:** from a client page, an admin can open a site, see its review/publish
state, and continue the client job without sidebar jumping.

---

## Lifecycle + Status Model (as-built)

- `Site` is the lifecycle anchor: `clientId`, `status`, `lastEditedAt`,
  `lastPublishedAt`, `lastPublishedBy`, `lastPublishError`, `publishedUrl`,
  `themeLocked` — `prisma/schema.prisma:292`.
- `ReviewRequest.status` is a **string field, not a Prisma enum**: `PENDING`,
  `APPROVED`, `CHANGES_REQUESTED` — `prisma/schema.prisma:482`.
- Public review artifact = `ReviewRequest.snapshotPages`; reviewer identity =
  `invitedEmail` + `reviewerId`; live link = `token` — `:491`.
- Publish state is separate from review state: `Site.status` changes in
  `server/services/publish.service.ts:273`; approval computed from latest review +
  `lastEditedAt` in `server/services/publish-approval.ts:76`.
- Version history exists as a **side system**: `SiteVersion.versionId/name/payload`
  (`schema.prisma:1078`) + publish history/rollback (`publish.service.ts:392`).
- **Missing lifecycle keys:** no materialized `Site.reviewStatus`, no
  `Site.currentReviewId`, no `Client.contactEmail`, no
  `ReviewRequest.siteVersionId` / `publishJobId`.

---

## Current IA vs Proposed IA

**Current (feature-based):** sidebar `Home / Getting started / Sites / Agency /
Media / Settings`; top-nav `Marketplace / Learn / Resources / Templates`;
site-detail tabs are operational (`Overview / Traffic / Domains / SEO / Submissions
/ Redirects / Sharing / Settings`); client work, sign-off, and go-live are split
across `Sites`, `Agency`, `Settings`, and `/review/:token`.

**Proposed (job-based):** keep `Templates`, `Media`, `Resources`, `Settings` as
secondary/admin surfaces; make the primary dashboard structure `Sites · Clients ·
Reviews · Activity · Settings`. Inside Site detail, reorganize context around
`Overview · Build · Client & Review · Go live · Monitor · Settings`.

---

## Role-to-Job Matrix

| Role | Jobs |
|---|---|
| **Owner** | workspace policy, billing, client assignment, approval override, publish, domain resolution, monitoring |
| **Admin** | client assignment, internal review, shared theme, domains, settings, publish once approved |
| **Editor/Designer** | create site, edit, submit for internal approval or client sign-off, revise, publish when approval is current |
| **Viewer** | inspect workspace/site state only; no lifecycle progression |
| **Client (token)** | identify, review frozen snapshot, comment, approve, request changes on `/review/:token` |

---

## Missing-Screen Inventory

- Site-level "Client & Review" summary panel.
- Persistent review round/history view outside `/edit/:id`.
- Client contact management tied to review invitations.
- Review workbench with client/site/version context.
- Visible approved-artifact/version label across Site, Reviews, and Publish.

## Broken-Flow Inventory

- Onboarding captures client email, then drops it.
- Site detail "Send for review" routes to internal approval, not client sign-off.
- Site list/detail omit assigned client and review state.
- Review queue cannot open the related site/client/approved artifact.
- Publish checks omit approval readiness until failure.
- Client detail cannot continue into site/review work from its site rows.

---

## Recommended Navigation

- **Sidebar:** `Home · Sites · Clients · Reviews · Media · Activity · Settings`.
- **Site detail contextual nav:** `Overview · Build · Client & Review · Go live · Monitor · Settings`.
- Keep `Templates`, `Learn`, `Resources` as secondary browse surfaces; keep `Media`
  accessible globally but also surface it contextually during build/publish jobs.

---

## Roadmap

- **P0:** split internal-approval vs client-sign-off (#2); persist client review
  contact (#1); surface client + review + publish summary on Sites & Site detail
  (#3); add approval status to publish checks (#5).
- **P1:** make Agency Reviews a linked workbench (#4); add dashboard review
  history/current-round (#7); make Client detail a real client workspace with
  linked site rows and lifecycle badges (#8).
- **P2:** explicit reviewed-artifact/version identity across review/publish history
  (#6); client filter/grouping on Projects; flatten the `Agency` umbrella into
  direct job destinations.

---

*Recommendation (synthesis): start with #2 (split "Submit for internal approval"
vs "Send to client") — it's UI-wiring over an already-capable service, and it's
the single break that makes the whole Site→Client→Review chain feel disconnected.
#1 needs a `Client.contactEmail` migration first, so sequence it right after.*

*Companion docs: `docs/DASHBOARD-FLOW.md` (as-built flow), `docs/audits/2026-07-22-app-audit-excluding-editor.md` (surface audit — all items fixed). Codex session `019f8b9f-7e26-73b2-97e5-db7fb0f25a05` (~2.84M tokens). Read-only; nothing modified.*
