# Backend readiness — what can be built as drawn

> **For the designer, and for whoever schedules the build.** Every other document says what a screen should be. This one says whether the server can already do it.
>
> **Why it exists:** the answer was true but scattered — four documents each carried a piece, and no reader saw the whole. A designer's real question at every screen is *"am I drawing something buildable, or a promise?"* That changes how much they invest and what they flag.
>
> Verified against the code on 2026-07-20 by reading the routers, services and schema. Every ✅ below names its evidence. **Nothing here is inferred from a document.**

---

## The one-line answer

**Almost everything you will draw is backed by working server code. One thing is not, and it is the wedge.**

| | Build steps | Backend |
|---|---|---|
| ✅ **Backed** — build as drawn | 1–5, 7, 8, 9, 11, 12 | routers and services exist and are wired |
| ⚠ **Partly backed** — one gap named | 13 | Integrations: no site-level router |
| ❌ **Not backed** — needs schema work first | 6, 10 | the J5 wedge and the Review panel |

---

## 1. Backed — draw with confidence

These have live, wired routers. Procedure counts are from `server/trpc/routers/`.

| Surface | Router | Procedures | Note |
|---|---|---|---|
| **Media** panel | `media.ts` | **18** | the largest router in the app — folders, upload, stock, versions all real |
| **Content / CMS** | `cms.ts` | 9 | collections, records, dynamic pages |
| **Notifications** | `notifications.ts` | 9 | `list` · `unreadCount` · `markRead` — the bell has its backend already |
| **AI** | `ai.ts` | 10 | needs `OPENAI_API_KEY` set; the path is real |
| **Templates** | `templates.ts` + `user-template.ts` | 8 | |
| **Shared components** | `site-component.ts` | 7 | Portfolio's component library |
| **Forms** | `forms.ts` | 6 | inbox, filters, CSV |
| **Versions + Compare** | `site-version.ts` | 5 | `SiteVersion.payload` stores a full `ProjectData` snapshot; pruning exists both sides |
| **Site settings, domains, redirects** | `site-detail.ts` | — | `domains` · `redirects` · `sharing` |
| **Clients** | `clients.ts` | — | the `Client` record behind the review page is real |

**Shell · drawer · inspector · modal kit · keyboard traversal** need no backend at all — they are chrome. Draw freely.

### Brand push — better than the docs said

⚠ **Correction, 2026-07-20.** `2026-07-19-portfolio-wireframes.md` §2 lists Brand push as `❌ absent`. That is wrong, and it understates what exists by a lot. `theme.ts` is wired into the root router and carries:

| Procedure | Which screen it serves |
|---|---|
| `theme.targets` | Step 1 — pick sites |
| `theme.previewPush` | Step 2 — the diff |
| `theme.push` | Step 4 — pushing |
| `theme.rollback` | Step 5 — the 24-hour undo |
| `theme.capture` · `theme.setLock` · `theme.getShared` | supporting |

**Every step of the five-step flow has a procedure behind it.** Only the UI is missing. Portfolio §4 is a screen to draw, not a system to invent.

---

## 2. Partly backed — one named gap

**Integrations (step 13).** The connection *types* exist but the *site-level* plumbing does not:

- ✅ `integrations.ts` router exists — but exposes only **Vercel**.
- ✅ Workspace-level config is real: `addIntegrationSchema` accepts `GOOGLE_ANALYTICS | MAILCHIMP | ZAPIER | SLACK` (`packages/shared/schemas/account.ts:74`).
- ✅ Formspree and Stripe are real, but as **export-time injectors** (`engine/export/FormspreeInjector.ts`, `StripeInjector.ts`) — not connections.
- ❌ **No site-level integrations router.** `site-detail.ts` has `domains`, `redirects`, `sharing` — no `integrations`.
- ❌ **ConvertKit is not in the provider enum.** Adding it is a schema change.

**What this means for you:** draw §6 as specified — the two-shape model already reflects this reality. The per-site on/off toggle in Shape 2 needs a join row that does not exist yet; that is engineering's to add, and it is small.

---

## 3. Not backed — the wedge

**Steps 6 and 10 — J5 sign-off and the Review panel.**

`reviews.ts` (4 procedures) and `comments.ts` (5) both exist, which is exactly why this went unnoticed for so long. **They implement a different product.**

| What the code does today | What the product needs |
|---|---|
| `reviews.resolve` is **admin-gated** | the **client** approves |
| `notifyReviewSubmitted` → **workspace admins** | the **client** gets the link |
| `sendReviewResolvedEmail` → the **requester** (designer) | the **designer** hears back from the client |
| `createComment` writes `authorId` from the **session user** | an account-less client authors a comment |
| `Comment.authorId` is **required**, FK to `User` | must be optional |
| `ReviewRequest` has **no token** | the link needs one |

Today's flow is *designer submits → admin approves*. The product's flow is *designer sends → client approves*. **Two different products sharing a table name.**

### What must change before these screens can ship

From `2026-07-19-system-contracts.md` §1.2 — this is a schema migration, not a wiring job:

```
Comment.authorId          → optional
Comment.reviewerId        → new, optional, FK to a new Reviewer row
ReviewRequest.token       → new, unique, indexed
ReviewRequest.expiresAt   → new
reviews.* / comments.*    → token-authenticated public procedures
                            alongside the existing protected ones
```

**Draw these screens anyway.** The design is not blocked — the contracts settle every behaviour question (states, identity, token lifecycle, stale approval). But know that behind them sits weeks of server work and a migration, and that **nothing else on the list is worth polishing until this exists.**

---

## 4. One behaviour change already decided

**`sites.publish` is ADMIN-only today** (`server/trpc/routers/sites.ts:272`). The founder decided on 2026-07-19 that a **DESIGNER may publish** once a review is approved.

Draw the new rule — the topbar CTA is *enabled* for a designer after approval, not disabled with a tooltip. Engineering has this flagged. If the code does not change, the screens are wrong; that is a build task, not a design question.

---

## 5. What to do with this

**Designer:** nothing changes about what you draw. Steps 6 and 10 are still fully specified. This exists so that when you draw the Review panel and it feels ambitious, you know it is ambitious *for engineering*, not under-specified for you.

**Whoever schedules the build:** the ordering that matters is not the designer's. It is this — **the review-loop migration should start before any parity polish.** It is the longest lead time and the only thing on the list the company wins on. Every other surface in §1 already works.
