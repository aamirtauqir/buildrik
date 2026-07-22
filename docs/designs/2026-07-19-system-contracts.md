# System Contracts — the five rules that decide how screens behave

> **Read this before drawing steps 7, 8 or 9.** Every other document in the designer's path says what a surface *looks like*. This one says what it *does* — who may act, what happens next, what is disabled and why. Screens drawn without it get redone, which is why three of the nine build steps were blocked on it.
>
> **Each contract below is a decision, not a survey.** Where the decision is mine, the reasoning is stated so you can overturn it. The three that were genuinely the founder's were decided on 2026-07-19 and are marked **DECIDED** with their reasoning. One item remains open and it is an *engineering* answer, not a design one — see §6.5.
>
> Written 2026-07-19, after three review passes found these five sitting under every remaining blocker.

---

## 0. The finding that changes contract 1

Before any of this, one fact from the code, because it moves a "design the screens" problem into a "change the schema" problem:

```prisma
model Comment {
  authorId  String     // required — not String?
}
model ReviewRequest {
  requestedById String   // no token — see below
  status        String   // PENDING | APPROVED | CHANGES_REQUESTED
}
```

⚠ **Two things this document originally overstated, corrected 2026-07-19 after review:**

- **A token model already exists.** `ShareLink` carries `token @unique`, `passwordHash` and `expiresAt` (`schema.prisma:578`), with `share-link.service.ts` behind it. The accurate claim is narrower: **no token is bound to `ReviewRequest`**, and `ShareLink`'s path is unrelated to review/comment auth. Contract 1.4 should be built on that pattern, not invented from nothing.
- **Notification infrastructure already exists.** `Notification` and `NotificationPref` models (`schema.prisma:668`, `:742`) plus a router with `list`, `unreadCount` and `markRead`. Contract 4 defines *which events fire*; it is not greenfield. The presence of `unreadCount` says a bell was always the intended surface.

Every procedure in `server/trpc/routers/comments.ts` and `reviews.ts` is `protectedProcedure` — it requires a signed-in workspace member.

**It goes deeper than the schema.** A review pass on 2026-07-19 traced the service layer and found the whole thing is modelled as an *internal* approval loop, not a client one:

| | |
|---|---|
| `notifyReviewSubmitted(siteId, requestedById, …)` | notifies **workspace admins** — nobody notifies the client |
| `reviews.resolve` | `protectedProcedure`, **admin-gated** — the client cannot be the one who approves |
| `sendReviewResolvedEmail` | goes to the **original requester**, i.e. the designer |
| `createComment` | writes `authorId` straight from the **session user** |

So today's flow is: *designer submits → admin approves*. The product's flow is: *designer sends → client approves*. **These are different products sharing a table name.** Contract 1 is not a UI spec on top of working plumbing; it is a specification for a loop that has to be built.

**So the wedge's premise cannot currently be expressed.** A client with no account opens a link, comments and approves — but `Comment.authorId` is required and points at `User`, and there is no token on `ReviewRequest` for the link to carry. The client is structurally unable to be an author.

This is not a gap in the UI. **The review surface is not "backend done, UI missing"** — an earlier note in these docs said exactly that and it was wrong. Contract 1 therefore specifies the data model as well as the states, because a designer drawing the client page is drawing something the server cannot yet accept.

---

## 1. Review state machine

### 1.1 Identity — model C, hybrid

**The token grants access. Name and email are captured on first visit. There is no password.**

| | |
|---|---|
| Client receives | a link carrying an opaque token: `/review/<token>` |
| First visit | a short form — name + email — before the page renders. Not a login; a signature. |
| Return visit | **identity is stored against the token, not the browser** — Sara is remembered on any machine that opens her link. *(Corrected 2026-07-19: this said browser-remembered, contradicting the J5 wireframes. Token-stored is right — a reviewer who opens the link on a second machine should not re-introduce themselves, and browser storage cannot survive a cleared cache.)* |
| Why capture at all | an approval with no name on it is worthless in a client dispute, and comments need an author to reply to |

**Why not a full account:** the client is a restaurant owner opening one link. Every account step loses reviewers, and losing reviewers is losing the wedge.

**Why not anonymous:** "approved" must mean *someone* approved. An unsigned approval cannot settle an argument, which is the entire job.

### 1.2 What the schema needs

| Change | Why |
|---|---|
| `Comment.authorId` → **optional** | so an account-less reviewer can author |
| `Comment.reviewerId` → **new, optional** | FK to a new `Reviewer` row (name · email · first seen) |
| Exactly one of the two must be set | a comment has one author, internal or external — enforce it, or you get orphan comments |
| `ReviewRequest.token` → **new, unique, indexed** | what the link carries |
| `ReviewRequest.expiresAt` → **new** | see 1.4 |
| `reviews.*` / `comments.*` | need **token-authenticated public procedures** alongside the protected ones. A token authenticates to *one review on one site* and nothing else. |

⚠ **Design consequence:** every comment in the UI shows an author who may be internal or external. Draw both — an external author needs a visible marker (`Sara Khan · client`), because "who said this" is the first thing a designer scanning feedback needs.

### 1.3 The states

```
   DRAFT ──send──► PENDING ──approve──────► APPROVED
                      │                        │
                      │ request changes        │ any edit to the site
                      ▼                        ▼
              CHANGES_REQUESTED ──resend──► APPROVED (stale)
                      │                        │
                      └────────────────────────┘
                              re-send
```

| State | Client sees | Designer sees | Publish CTA |
|---|---|---|---|
| **DRAFT** | nothing — no link exists | `Send for review` | disabled — "not reviewed" |
| **PENDING** | the review page, **frozen at send** — see 1.6 | review pill + review bar; rail Review item | disabled — "waiting on client" |
| **CHANGES_REQUESTED** | their own comments, read-only until re-sent | `9 of 12 resolved` in the Review panel | disabled — "changes requested" |
| **APPROVED** | a read-only approved snapshot | green anchor in Versions | **enabled** |
| **APPROVED (stale)** | the snapshot they approved, unchanged | ⚠ "12 changes since approval" + `Compare` | **enabled, with a warning** |

### 1.6 What the client actually sees — a frozen snapshot

**The review page renders a snapshot taken when the link was sent, not the live draft.**

A designer keeps working while a review is out — that is the point of sending it. If the client saw the live draft:

- a comment pin would point at an element that has since moved or been deleted, so **orphan comments become routine instead of rare**;
- an approval would name a moving target, which is the one thing an approval cannot be;
- the designer would have to stop working, or accept that feedback arrives about work already replaced.

The mechanism already exists — contract 3 stores a snapshot at approval. This takes the same snapshot one step earlier, at send.

**The cost, and how it is handled:** a client may comment on something already fixed. So the designer's review bar counts changes since the link was sent — `3 changes since sent · Re-send` — and re-sending issues a fresh snapshot with a fresh token (1.4).

⚠ **This was `DESIGNER-BRIEF` §10 open question 3.** Decided 2026-07-19. It is mine, not the founder's, and it is reversible — but reversing it makes orphan comments (6.4) the common case rather than the exception, so reverse it deliberately.

### 1.4 Token lifecycle

| Rule | Value | Why |
|---|---|---|
| Expiry | **90 days** from send | long enough for a slow client, short enough that a leaked link dies |
| Re-send | **issues a new token and revokes the old one** | otherwise every past link stays live forever |
| Revoke | manual, from the Review panel | a client relationship can end mid-project |
| Expired-link page | its own screen — "This review link has expired. Ask your designer for a new one." No login prompt, no 404. | a dead end that looks like an error costs a support email |
| Scope | one review · one site · comment + approve **only** | the token must never widen |

### 1.5 Approval invalidation — the rule that matters most

**An edit after approval does not revoke the approval. It marks it stale.**

Revoking would punish a typo fix. Ignoring it would let a designer approve a homepage and ship a different one — which is exactly the failure the product exists to prevent.

So: the approval stands, the count of changes since it is always visible, and the publish confirm names it — *"12 changes since Sara approved. Publish anyway, or re-send for approval?"* Both paths stay open; neither is silent.

**The publish confirm must name what changed.** That is what preserves the guarantee without the round trip: nobody ships work the client has not seen, because publishing past a stale approval is an explicit, itemised acknowledgement — not a silent default.

⚠ **This overrides `2026-07-18-j5-signoff-wireframes.md` S5.6**, which said "invalidate approval on edit" and blocked publish until re-review. That rule makes a one-word typo fix cost a full client round trip, which is hostile in the exact loop this product is selling. J5 has been updated to match.

⚠ **Screens that depend on this:** the topbar CTA's disabled/warning states · the Versions approved anchor · Compare's two exits · the pre-publish dialog.

---

## 2. Permissions — who may do what

Four roles. **The matrix below is settled** — the two rows that traded safety against friction (DESIGNER publish, DESIGNER shared-library rights) were decided by the founder on 2026-07-19; the reasoning follows the table.

**DECIDED 2026-07-22 — VIEWER is the fifth role (read-only).** The code has always
had it (`lib/constants/enums.ts` UserRole, rank 0 in `permission.service.ts`) and
the 2026-07-22 audit found it absent from this contract. Adopted as-is: a VIEWER
holds a real workspace seat, may open every surface, and can never be the target
of a permission gate (`checkSiteRole`/`checkWorkspaceRole` exclude it from
`minRole`). Every column below is ❌ for VIEWER except reading; the
"disabled, never hidden" rule applies to every control they see. Figma:
"Permissions — signed in as a VIEWER" board on the Editor page. Not to be
confused with CLIENT — the account-less token reviewer (`Reviewer` model), which
stays a non-role.

| Action | OWNER | ADMIN | DESIGNER | CLIENT |
|---|---|---|---|---|
| Edit canvas, pages, media, content | ✅ | ✅ | ✅ | ❌ |
| Edit brand tokens on **this** site | ✅ | ✅ | ✅ | ❌ |
| Send for review | ✅ | ✅ | ✅ | ❌ |
| Comment | ✅ | ✅ | ✅ | ✅ |
| Resolve a comment | ✅ | ✅ | ✅ | ❌ |
| **Approve** | ✅ | ✅ | ❌ | ✅ |
| Publish | ✅ | ✅ | **✅** | ❌ |
| Rollback a publish | ✅ | ✅ | ❌ | ❌ |
| Connect / change a domain | ✅ | ✅ | ❌ | ❌ |
| **Brand push** (cross-site) | ✅ | ✅ | ❌ | ❌ |
| Shared library — **create** | ✅ | ✅ | **✅** | ❌ |
| Shared library — **edit / delete** | ✅ | ✅ | **❌** | ❌ |
| Delete a site | ✅ | ❌ | ❌ | ❌ |
| Members, billing | ✅ | ❌ | ❌ | ❌ |

**Three rules behind the table:**

1. **A DESIGNER cannot approve their own work.** Approval is the client's signature; a role that can both build and sign makes the record worthless.
2. **Destructive and cross-site actions need ADMIN.** Brand push, rollback, domains and delete can damage something the actor is not looking at.
3. **CLIENT is comment + approve. Nothing else, ever.** The token cannot widen, and no CLIENT-visible surface may render an editing affordance — not even disabled. A disabled Publish button on the client page is a support ticket.

**DECIDED 2026-07-19 — a DESIGNER may publish.** The approval gate already sits in front of publish; a second gate turns a one-person agency into a two-person process.

⚠ **This is a behaviour change, not just a doc.** `server/trpc/routers/sites.ts:272` is admin-only today. The screens assume the new rule: the topbar CTA is **enabled** for a DESIGNER once approved. If engineering does not make the change, the designer's screens are wrong — flag it rather than drawing both.

**DECIDED 2026-07-19 — a DESIGNER may create shared library assets, but not edit or delete them.** Creating is additive and breaks nothing. Editing or deleting a shared component changes every site consuming it — the same blast radius as a brand push, which is already admin-only. Leaving those open while gating brand push would be an inconsistency users would feel.

⚠ **Screens affected:** Portfolio › Templates · Components · Brand kits. Each card's `⋯` shows **Open** enabled, **Rename** and **Delete** disabled for a DESIGNER with the reason (`Admins can rename shared components`). `+ New` stays enabled. Per the drawing rule below: disabled with a reason, never hidden.

### Drawing permissions

- **Disabled, never hidden.** A hidden action teaches nothing; a disabled one with a reason teaches the role. Every disabled control carries a tooltip naming the role needed: *"Admins can rename shared components."* *(That example replaced "Admins can publish" on 2026-07-19 — publish was opened to DESIGNER two sections above, so the old example contradicted its own contract.)*
- **One exception: CLIENT.** Their surface renders no editing affordance at all, disabled or otherwise.
- Each screen's spec should name what a DESIGNER cannot do on it — checklist row 9 in the brief.

---

## 3. Compare — the diff contract

### 3.1 The two sides are not the same kind of thing

**The approved version is a stored snapshot. The current version is a live render.**

This is forced, not chosen. "Approved" means an artifact that cannot change — if the approved side re-rendered from current data, a token edit would silently rewrite what the client agreed to, and the comparison would compare a thing to itself.

| Side | Source | Consequence for you |
|---|---|---|
| **Approved (left)** | snapshot written at approval: full page HTML + resolved token values + asset URLs | renders instantly; can render even if a source asset was later deleted |
| **Current (right)** | live render of the working document | may show a loading state; always truthful |

**Loading states differ per side**, and that asymmetry must be drawn: the left is instant, the right can spin. A single shared skeleton across both is wrong.

### 3.2 What counts as a change

Five kinds. Each renders differently, and a designer needs all five:

| Kind | Example | Rendering |
|---|---|---|
| **Content** | heading copy edited | cobalt 8% tint over the text run |
| **Style** | button colour, spacing | cobalt 8% tint over the element box |
| **Structural — added** | a new section | full-width green strip in the right pane, matching gap in the left |
| **Structural — removed** | a section deleted | full-width amber strip in the **left** pane; nothing to tint on the right |
| **Moved** | section order changed | both panes marked, with a connector in the gutter |

Structural changes cannot be tinted — a deletion has no "after" to tint — which is why they get strips.

### 3.3 Snapshot cost — answered from the code, 2026-07-19

**This was the last open item in the whole handoff, and the answer is that the question was framed wrong.**

An earlier draft of this section assumed a snapshot meant *stored rendered HTML* — expensive, needing blob storage, "a 27-page site approved 5 times stores 135 page snapshots." That is not what a snapshot is here.

| What exists today | Where |
|---|---|
| `NamedVersion.snapshot: ProjectData` — the **whole project**, structured JSON, not HTML | `shared/types/versions.ts:27` |
| `captureSnapshotAsync()` → `composer.exportProject()`, deep-cloned | `engine/VersionTimelineManager.ts:564` |
| `visualSnapshot` — base64 JPEG, already captured for named versions, skipped for auto-checkpoints | same file, `:119` |
| `SiteVersion.payload Json` — server-side, **wired end to end** (router + service + upsert) | `schema.prisma:993`, `server/services/site-version.service.ts:16` |
| Pruning — **already implemented on both sides** | `pruneIfNeeded()` engine-side, `pruneSiteVersions()` server-side |

**So all three Compare modes are buildable, and none of them needs new infrastructure.** Both panes render through the same renderer the canvas already uses; the only difference is the input. The approved side renders a frozen `ProjectData`, the current side renders the live one.

**Cost is one JSON document per version, not one per page** — 5 approvals of a 27-page site is 5 snapshots, not 135.

**Draw all three modes.** The List-only fallback is withdrawn; there is nothing to fall back from.

---

## 4. Notifications — who is told what

**Principle: notify the person who is now blocked.** Every row below has someone waiting.

| Event | Who is told | Channel | Why |
|---|---|---|---|
| Review sent | client | **email** — the link itself | the only way they learn a link exists |
| Client opened the review | designer | in-app | "did they see it" is the top anxiety of the wedge |
| Client commented | designer | in-app + email digest | comments arrive in bursts; a digest beats 12 emails |
| Client approved | designer + admins | in-app + **email** | unblocks publish; deserves an interruption |
| Client requested changes | designer | in-app + **email** | same |
| Review link expiring in 7 days | designer, **not** the client | in-app | the designer owns the relationship |
| Publish succeeded | actor | in-app | |
| Publish failed | actor + admins | in-app + **email** | a silent failed publish means a client sees a stale site |
| Brand push completed | actor | in-app | |
| Brand push partially failed | actor + admins | in-app + **email** | some sites changed and some did not — the worst state to not know about |
| Comment resolved | comment's author, if external | **email** | closes their loop; otherwise a client never learns their feedback landed |

**Never notify:** your own actions back to you · every autosave · a designer's own comment.

**Digest rule:** in-app is immediate; email batches comment events on a 15-minute window. Approvals and failures never batch.

⚠ **Screens this needs:** the topbar bell and its 360w panel — **now specced** at `2026-07-18-floating-panels-spec.md` §6, third occupant of the same right-side frame as Versions and Issues. *(This line previously said no surface existed anywhere. True when written; stale within the hour.)*

---

## 5. Publish rollback

### 5.1 The shape

Rollback is **a new publish of an old version**, never a mutation of history. The publish list only ever grows; a rollback appends an entry that names its source.

```
Publish history
┌────────────────────────────────────────────────┐
│ ● v14  Live      2h ago    Ali      ⋯          │
│ ○ v13            1d ago    Ali      ⋯          │
│ ○ v12  ↩ from v9 3d ago    Sara     ⋯          │  ← a rollback, labelled
│ ○ v11  ⚠ Failed  4d ago    Ali      ⋯          │
└────────────────────────────────────────────────┘
```

- Row **56h**: state dot · version · relative time · actor · `⋯` (Rollback to this · View live · Copy URL).
- The live entry carries a 3px accent left bar. Exactly one row is ever live.
- A rollback entry shows `↩ from vN` so the history stays readable a month later.

### 5.2 The flow

`⋯ → Rollback to this` opens a confirm naming three things people forget:

> **Roll back to v9?**
> Your current draft is not affected — only the live site changes.
> v9 was published 3 days ago and was approved by Sara Khan.
> This creates a new publish (v15). Nothing is deleted.
>
> `( Cancel )  [ Roll back ]`

**States:** `confirm · rolling-back · done · failed`.

### 5.3 Three rules

1. **Rollback never touches the draft.** The designer's working document is untouched — otherwise a rollback silently discards work. Say it on the dialog; it is the first thing anyone fears.
2. **Rolling back does not revoke an approval.** Approval attaches to a version, not to what is currently live.
3. **A failed publish cannot be rolled back to.** Its `⋯` offers `Retry`, not `Rollback` — there is nothing at that version to serve.

**DECIDED 2026-07-19 — keep 20 published versions per site; never prune one that was approved.** Approved publishes are the evidence a client signed off on something; the rest is convenience. Footnote on the list: *"Last 20 publishes. Approved ones are always kept."*

⚠ **These are two different caps on two different objects, and the copy must not blur them.** The **Versions panel** caps *document* versions at 50 (autosaves prune oldest-first, named versions never prune — `floating-panels-spec.md` §2). **Publish history** caps *published* versions at 20. An earlier draft of this line claimed the two matched. They do not, and pretending otherwise would have put one number in two places that mean different things.

---

## 6. What is still genuinely open after this

These are named so nobody mistakes silence for a decision:

Four of these were open when this document was first written. Three are now decided; the founder calls remain.

### 6.1 Notification surface — decided

**A bell in the topbar, right of the save pill, left of the CTA.** The backend already implies it: `notifications.unreadCount` exists and is not read by anything.

- **Bell 32 × 32** in the topbar's 56h band. Unread → an 8px dot in accent, top-right, no number under 10; `9+` above.
- **Panel 360w**, opens under the bell, same frame as Issues and Versions (`floating-panels-spec.md` §1) — a fourth right-side panel would be a fourth thing to learn.
- **Row 56h**: icon · one-line event · relative time. Unread rows carry a 2px accent left bar and a tinted background; opening the panel marks all read after 2s, so nothing is lost to an accidental click.
- **Grouped by day** with 28h headers (`Today` · `Yesterday` · date).
- **Every row is a jump**, never a dead notice — a comment opens the comment, a failed publish opens Publish history at that row.
- **Empty:** "Nothing new. You will hear when a client responds."

**States:** empty · unread · all-read · loading · jump-target-deleted (the row survives, marked "this page was deleted").

### 6.2 Brand-kit apply — decided

**Overwrite, behind a diff preview.** Same pattern as Brand's import (`drawer-cargo-sheets.md` §6): a diff before anything is written, unchanged tokens collapsed, an explicit count on the confirm — `[ Apply 12 tokens ]`.

Merge was rejected: it needs a per-token conflict rule the user would have to learn, and a brand that is half one kit and half another is not a brand. One preview, one decision, one undo entry.

### 6.3 Handover item taxonomy — decided

Now derivable, because contract 1 defines the states. A site is **outstanding** if any of:

| Item | Source |
|---|---|
| Open comments | `Comment.status = OPEN` |
| Unresolved review | `ReviewRequest.status = CHANGES_REQUESTED` |
| Stale approval | `APPROVED` with edits since — contract 1.5 |
| Failed publish | last publish `FAILED` |
| Never published | site has an approval but no publish |

Everything else rolls into the `N sites are clear` summary row.

### 6.4 Orphan comments — decided

**A comment whose target element is deleted is never deleted.** It detaches: the pin disappears from the canvas, and the comment moves to a **Detached** group pinned to the top of the review list, carrying the text it was originally anchored to (`"…on: Book a table"`).

Deleting client feedback because the designer deleted an element is destroying the record of a conversation. The detached group is also a signal worth reading — several detached comments usually means a section was rebuilt rather than edited.

**States:** anchored · detached · resolved-while-detached.

### 6.5 Still genuinely open

**Nothing.** As of 2026-07-19 every contract above is decided, and the last conditional one — Compare's render source — was closed by reading the code rather than waiting for an answer (§3.3). The snapshots it depended on already exist, are already persisted server-side, and are already pruned.

*What remains outside these contracts is not contract work: the ten cut-or-build product binaries (Integrations, Vue/Next export, and so on), each of which gates a screen but blocks none of the twelve build steps.*
