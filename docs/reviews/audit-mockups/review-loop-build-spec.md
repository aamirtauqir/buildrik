# Build handoff — client-review surface (the review loop)

**From:** [review-loop wireframe](review-loop-wireframe.html) · [reverse-wireframe inventory](../reverse-wireframe-inventory-20260622.md)
**Method:** [L4 handoff](../../learning/product-design/lessons/0004-design-to-build-handoff.html) (WHAT · WHERE · DON'T-BREAK · DONE) + [L12](../../learning/product-design/lessons/0012-reverse-wireframe-the-backend.html)
**Date:** 2026-06-22

---

## Why (the user pain)
An agency can *send* a site for review and *resolve* it, but the **external client can't actually review**. The `share/[token]` link just redirects to the read-only published site — no commenting, no approve/request-changes, and the agency gets no notification when (if) the client acts. The "client review" promise is one-directional. This is the thinnest, highest-leverage gap in the inventory.

## What exists already (CHECK FIRST — don't rebuild)
- `ReviewRequest` model — status `PENDING|APPROVED|CHANGES_REQUESTED`, `note`, `changeSummary`, `resolvedById/At`.
- `reviews` router — `submit` · `list` · `resolve`. `ReviewService.submit` fires from the editor.
- `review-queue.tsx` — agency side: list + Approve/Request-changes + success toast. **Wired, leave it.**
- `Comment` model — `x/y`, `targetSelector`, `OPEN|RESOLVED`. `comments` router — `create·list·workspaceList·resolve`. Comment UI today lives **inside the editor** (agency only).
- `ShareLink` — `token`, `passwordHash`, `expiresAt`, `viewCount`, `isActive`. `share/[token]/page.tsx` = password gate → redirect to published site.
- **Missing entirely:** any review notification trigger (`notification.trigger.ts` has none for reviews).

## The hard decision (resolve before building — this is what the plan-reviews should test)
The published site is a **separate deploy** (Vercel / its own URL). You cannot reliably overlay a comment layer on a foreign origin. Two paths:

| | A · Buildrik-hosted review preview | B · Overlay on the live published site |
|---|---|---|
| Client views | a Buildrik route that renders the site preview we control | the actual published URL |
| Comment overlay | easy — same origin, we own the DOM | hard — cross-origin, fragile |
| Fidelity | preview, may lag latest publish | exactly what's live |
| Recommend | **v1 = A** (ship the loop) | defer |

**Pick A for v1.** The review happens on a Buildrik preview surface, not the external URL. State this in the plan so the reviewers weigh it.

---

## WHAT to build
1. **Client review surface** at `share/[token]` (path A): after the gate, render the site **preview** + a review chrome (not a bare redirect).
2. **Comment layer** — client clicks the page → pins a `Comment` (reuse `comments.create` with `x/y` + `targetSelector`; authorId = the share visitor). List existing OPEN comments as pins.
3. **Verdict bar** — sticky: `Approve` / `Request changes` (+ optional note) → calls `reviews.resolve`. Single-use; once resolved, show read-only banner.
4. **Notifications both ways** — add review triggers: on `submit` → notify reviewer; on client `resolve` / new client comment → notify the agency (extend `notification.trigger.ts`, reuse the existing notification service).
5. **All 8 states** from the wireframe (empty · loading · error · password · expired/revoked · already-approved · submitting · success).

## WHERE
- `packages/dashboard/app/share/[token]/` — replace the redirect with the review surface (keep the gate).
- Client comment pins + verdict bar → new components under `components/reviews/` (or `components/share/`).
- Notification triggers → `server/services/notification.trigger.ts` (+ wire into `reviews.submit` / `reviews.resolve` / `comments.create`).
- No new router needed — `reviews` + `comments` already expose everything. Visitor auth for the share session = the existing `share_<token>` cookie.

## DON'T-BREAK
- The **password gate + cookie** logic in `share/[token]/page.tsx` — keep it; review surface renders *after* it.
- `review-queue.tsx` (agency side) — untouched; it already resolves + toasts.
- The **published-site access boundary** — the share gate guards the *share page*; a hard boundary still needs Vercel deployment protection (see the file's own comment). Don't conflate the two.
- The editor's internal comment UI — don't move it; the client layer is a *second* consumer of the same `comments` API.
- Cobalt only, no purple (DESIGN.md). The wireframe's client tint is wireframe-only.

## DONE (acceptance — climb all 5 rungs, L8)
1. `tsc` clean (dashboard).
2. Shell/service tests green; add tests for the new notification triggers.
3. **Walk all 8 states** live on a real share link (empty → comment → error → verdict → success).
4. **Click the loop end-to-end:** agency sends → reviewer (incognito, via link) comments + requests changes → agency gets a notification → queue shows CHANGES_REQUESTED + the comments.
5. Acceptance: a person who is *not* logged in can review a site and the agency learns about it — without opening the editor.

---

## Design review additions (plan-design-review, 2026-06-22)

### Information architecture — the client view (Pass 1)
The site being reviewed is primary; review chrome is secondary. Hierarchy when the client opens the link:
1. **The site** — full-bleed, the thing they're judging. Everything else floats over it.
2. **Verdict bar** — persistent bottom strip (Approve / Request changes). Always reachable, never covers content.
3. **Comment pins** — tertiary overlay on the site; composer opens on click.
4. **What-changed intro** — a dismissible top banner showing `changeSummary` so the client knows *why* they're here. Auto-dismisses after first comment.

### First-touch orientation (Pass 3)
The client is often non-technical and external. First 5 seconds must answer "this is the site, I'm reviewing it, here's how" — one line in the intro banner: *"Click anywhere to leave feedback, then Approve or Request changes below."* No tour, no modal. Gone after first interaction.

### State table — what the client SEES (Pass 2, expanded)
| State | Client sees |
|---|---|
| Loading | Site skeleton + "Loading [site] for review…" — not a blank screen |
| Empty (no comments) | Intro banner + "Click anywhere on the page to leave feedback" |
| Pin: saving | Pin shows a subtle pulse; comment text greyed until confirmed |
| Pin: failed | Inline "Couldn't save — retry" on the pin; never a silent drop |
| In-progress return | Prior comments still pinned; verdict bar shows "Continue your review" (cookie-scoped) |
| Password | Wrong → clear message; right → remembered (existing cookie) |
| Expired / revoked | "This review link is no longer available. Ask [agency] for a new one." |
| Already decided | Read-only banner "You approved this on [date]" — no double-submit |
| Submitting verdict | Button busy + disabled; bar locked |
| Success | "Thanks — [agency] has been notified." Loop closed. |

### AI-slop guardrail (Pass 4)
Reuse vibcoder + cobalt only. **The wireframe's purple client tint is wireframe-only — it must NOT ship** (DESIGN.md bans purple/violet). No card-mosaic for comments; pins + a simple list, not a grid.

### Responsive & accessibility (Pass 6) — was the weakest, must be specified
- **Mobile is the common case** (clients open the link from email on a phone). Not an afterthought.
- **Pin anchoring breaks on reflow:** an `x/y` pin placed on desktop is meaningless when the published site reflows to mobile width. Anchor comments to `targetSelector` (the element) with `x/y` as a within-element offset — so a comment survives viewport changes.
- **Touch targets** 44px min (verdict buttons, pins, composer). **Keyboard:** verdict bar + composer fully keyboard-operable; pins reachable via Tab. **Contrast** ≥4.5:1 on the floating chrome over arbitrary site backgrounds (use a solid scrim behind chrome, not transparency over unknown content).

### Resolved design decisions (2026-06-22)
1. **Mobile in v1 = yes, pins desktop-first.** Phone/tablet can view + Approve/Request-changes + leave general (un-pinned) comments. Element-pinned comments are desktop-first. Ships the loop everywhere without solving mobile-pinning now.
2. **Pin anchoring = `targetSelector` + within-element offset.** Survives reflow; comments stay attached to the right element on mobile. Uses the `Comment` model's existing fields.
3. **Client surface theme = cobalt, neutral.** Not dashboard-red. The external client gets a calm, trustworthy surface, one accent per DESIGN.md. White-label/agency-branded client surfaces = later feature, not v1.

## Next step in the sequence (per L12)
This spec + wireframe = the redesign plan for this surface. Design review done (below). **Next: `plan-ceo-review`** to pressure-test path A vs B and scope before building. Then build via the 5-rung ladder.

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 0 | — | not yet run |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | — | not run (quota saved) |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 0 | — | not yet run |
| Design Review | `/plan-design-review` | UI/UX gaps | 1 | issues_open | score 5/10 → 8/10, 3 decisions resolved |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | — | not run |

**Design review summary:** 7 passes. Strong: state coverage (8 states pre-existing), low AI-slop risk. Fixed in-plan: client-view IA hierarchy (site primary, verdict bar secondary, pins tertiary), first-touch orientation for non-technical clients, expanded per-pin + return-visit states, slop guardrail (no purple, no card-mosaic). Weakest pass = responsive/a11y (3/10) — now specified: mobile-first reality, `targetSelector` pin anchoring (survives reflow), 44px touch targets, keyboard verdict bar, scrim for contrast over arbitrary site backgrounds. 3 genuine decisions resolved (mobile scope · pin anchor · client theme).

**VERDICT:** DESIGN CLEARED at 8/10 — ready for CEO review then eng review. Mockups skipped by design (the companion wireframe `review-loop-wireframe.html` is the visual reference).

**UNRESOLVED DECISIONS:**
- Path A (Buildrik-hosted review preview) vs Path B (overlay on live published URL) — deferred to `plan-ceo-review` as a scope/strategy call.
