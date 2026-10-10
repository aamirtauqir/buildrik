# P5 · Secure Client Located Pins (FG-006) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A client on `/review/<token>` can click the page snapshot to drop a located pin and write a comment. The comment arrives anchored to page, snapshot version and stable element id, with selector and coordinates as fallback. The designer's Review panel can locate it. This only works because the snapshot renders on an isolated origin as sanitized HTML, with every script blocked except a small trusted pin bridge whose messages are validated on both sides.

**Architecture:**
- **Isolation.** Snapshots move from `<iframe srcDoc sandbox="">` to a dedicated **snapshot origin**: a separate registrable domain, served by the same Next app through a host-gated route.
  - The snapshot response carries its own strict CSP. The only script it allows is the bridge, by hash.
  - The iframe keeps `sandbox="allow-scripts"` **without** `allow-same-origin`, so the frame is an opaque origin twice over.
- **Sanitisation.** The stored snapshot HTML is sanitised server-side with DOMPurify before it is served. `isomorphic-dompurify` is already a root dependency.
- **Bridge.** The bridge (~100 lines) finds the nearest `data-buildrick-id` under a click and draws pins.
- **Message validation.** The parent and the bridge exchange only Zod-validated, nonce-bound, source-checked `postMessage`s.
- **Anchoring.** The server derives the selector from the element id. It never accepts a selector string from the client.
- **Storage.** One additive migration (owner-applied) adds `reviewRequestId` and `elementId` to `Comment`.

**Tech Stack:** Next.js 16 (route handler + `middleware.ts` host gate), isomorphic-dompurify, Zod (`packages/shared/schemas/review-pins.ts`), Node `crypto` (HMAC tickets), Prisma 5, Vitest (+ jsdom for the bridge), Playwright for the cross-origin live check.

**Spec:**
- `docs/audits/2026-10-08-editor-full-audit/OWNER-ANSWERS-2026-10-10.md` FG-006, with this rationale: same-origin content with `allow-scripts` + `allow-same-origin` can escape its sandbox (HTML standard), so rendering moves to an isolated origin, and a security review comes before implementation.
- Detail: `phase2-live/FG.md` §FG-006. Board C-03 `7593:193511` ("Client sign-off · pin on snapshot").

## Global Constraints

- **Task 0 is blocking.** No task after it starts until the security review document carries an owner sign-off line.
- Never combine `allow-scripts` with `allow-same-origin` on any iframe that renders customer HTML.
- Customer HTML never runs in the app origin or the snapshot origin with script ability. Every `<script>`, inline event handler and `javascript:` URL is removed. The bridge is the only script, allowed by `sha256` hash in the snapshot CSP.
- Messages carry ids, numbers and short plain text only. They never carry tokens, cookies, HTML or selectors. Any string rendered from a message uses `textContent`.
- The server derives `targetSelector` from a validated `elementId` (`^[A-Za-z0-9_-]{1,64}$`). A client-sent selector is ignored.
- New env var `REVIEW_SNAPSHOT_ORIGIN`. Add its row to the root `CLAUDE.md` env table **in the same commit** that reads it, per the deploy-checklist rule. A new secret, `REVIEW_SNAPSHOT_SECRET`, must not reuse `NEXTAUTH_SECRET`.
- Data flow: Page → tRPC → Router → Service → Prisma. The snapshot route handler calls a service; it never calls Prisma itself.
- **Migration is owner-applied.**
- The FIGMA loop applies to the client UI (C-03 `7593:193511`).
- Live steps never publish from the QA workspace. A local review round on a dev site is fine.

## Review Focus

1. **Snapshot HTML containing `<script>`, `onerror=`, `<svg><script>`, `javascript:` hrefs, `<meta http-equiv=refresh>`, `<base href>`, `<form action>`, `<iframe>` or CSS `url(javascript:…)`.** Expected: none survive sanitisation, and the served page executes **no** script except the bridge. This is pinned by the corpus test in Task 2 and the CSP-hash assertion in Task 3.
2. **A message from another window or frame, from a different nonce, with an oversized payload, or with an extra field.** Expected: the parent and the bridge silently drop it and nothing is posted to the server. Pinned in Tasks 4 and 5.
3. **An expired or replayed snapshot ticket, or a ticket for another round or page.** Expected: 403 with no HTML body. The page shows its existing "link expired" state. Pinned in Task 3.
4. **A pin on an element with no `data-buildrick-id`, such as text inside CMS-generated markup.** Expected: the bridge walks up to the nearest ancestor that has an id. With none, the comment is stored with coordinates only and shows in the editor as "Pinned by position". Pinned in Tasks 4 and 7.
5. **The designer edits the page after the round was sent, so the element is gone or moved.** Expected: the editor shows the pin as "Pinned on an earlier version" with Locate disabled or falling back to the coordinates. It never selects a different element silently. Pinned in Task 7.

---

## Reality check (code is truth; `origin/main` @ `503bc62cd`)

1. **The snapshot is a srcdoc iframe with `sandbox=""`.** `SnapshotFrame` is at `packages/dashboard/components/reviews/signoff-snapshot.tsx:95`, with `srcDoc={page.html} sandbox=""` at `:120-123`. It has no scripts and an opaque origin. That is safe today, but there is no way to know where the client clicked. Simply adding `allow-scripts` would run the customer's own scripts, which the export does include, in a srcdoc that inherits the dashboard's CSP context. The plan replaces it with an isolated-origin frame.
2. **Client comments are text only.** `review-client.tsx:300-345` (`addNote`, `sendChangeRequest`) sends `{token, body}`. The server already accepts `pageId, x, y, targetSelector` (`client-review.service.ts:283` `createClientComment`), so a client could today post an **arbitrary selector string**. Task 6 closes that: the server derives the selector.
3. **Snapshots are stored unsanitised.** `ReviewRequest.snapshotPages Json?` (`prisma/schema.prisma:536-581`) is written via `reviews.submit` (`review.service.ts:81`). The only check is the Zod path and size check (`shared/schemas/publish.ts:48-66`). `pruneSupersededSnapshots` (`review.service.ts:164`) nulls superseded, unapproved rounds.
4. **There is no snapshot version id.** `ReviewRequest.id` is the de facto version, and `Comment` has no round link. This plan adds `Comment.reviewRequestId`.
5. **Stable ids exist.** The exported HTML carries `data-buildrick-id` (`ExportEngine.ts:1150`, `ELEMENT_ID` constant `shared/constants/config.ts:18`), and they are site-unique via `packages/shared/content/elementIds.ts`.
6. **The CSP is global.** `next.config.mjs:31-63` sets `frame-src 'self'` plus video hosts and `X-Frame-Options: DENY` on `/:path*`. There is no user-content origin env. The snapshot route needs its own header block, and the app's `frame-src` must allow `REVIEW_SNAPSHOT_ORIGIN`.
7. **Middleware exists** (`packages/dashboard/middleware.ts`), so host gating goes there. The snapshot host must serve **only** `/_snapshot/*`, and every other path must 404 on that host.
8. **The editor locates by selector.** `locateComment` (`sidebar/tabs/review/locate.ts:55`), `resolveAnchor` and `detectOrphans` (`canvas/comments/commentAnchors.ts`) work from `targetSelector` + `pageId`. Nothing uses the round.
9. **Production runs on cPanel**, not Vercel (root `CLAUDE.md`). A second domain needs DNS, an SSL certificate and the domain mapped to the same Node app. That is an **owner infrastructure step** (Q1).

## File Structure

| File | Responsibility | New / Modify |
|---|---|---|
| `docs/security/2026-10-review-pins-security-review.md` | Task 0 review + sign-off | Create |
| `packages/shared/schemas/review-pins.ts` | bridge message schemas, element-id regex, ticket payload | Create |
| `server/services/review-snapshot.service.ts` | ticket sign/verify, sanitise, serve model | Create |
| `server/services/review-snapshot-sanitize.ts` | DOMPurify config (one job) | Create |
| `packages/dashboard/app/_snapshot/[ticket]/route.ts` | GET handler: verify → sanitise → inject bridge → headers | Create |
| `packages/dashboard/lib/review-pin-bridge.ts` | bridge source string + its sha256 (built once at module load, no I/O) | Create |
| `packages/dashboard/middleware.ts` | host gate for the snapshot origin | Modify |
| `packages/dashboard/next.config.mjs` | app `frame-src` adds the snapshot origin; snapshot path excluded from global XFO | Modify |
| `packages/dashboard/components/reviews/signoff-snapshot.tsx` | frame from ticket URL, `sandbox="allow-scripts"` | Modify |
| `packages/dashboard/app/review/[token]/usePinBridge.ts`, `review-client.tsx` | parent side of the bridge + pin UI | Create / Modify |
| `server/services/client-review.service.ts`, `server/trpc/routers/client-review.ts` | tickets in `get`; `comment` takes `elementId` + `reviewRequestId` | Modify |
| `prisma/schema.prisma`, `prisma/migrations/20261015100000_comment_snapshot_anchor/migration.sql` | `Comment.reviewRequestId`, `Comment.elementId` | Modify / Create |
| `packages/editor/src/editor/canvas/comments/commentAnchors.ts`, `sidebar/tabs/review/ReviewTab.tsx` | anchor resolution order and the "earlier version" state | Modify |
| root `CLAUDE.md` (env table) | `REVIEW_SNAPSHOT_ORIGIN`, `REVIEW_SNAPSHOT_SECRET` rows | Modify |

---

### Task 0: Security review checklist (BLOCKING)

**Files:**
- Create: `docs/security/2026-10-review-pins-security-review.md`

The reviewer is a fresh agent running `/cso` or `security-review`, followed by the owner. Each item gets a decision, the evidence or test that will prove it, and the task that implements it. Implementation does not start until the document ends with `Owner sign-off: <name>, <date>`.

- [ ] **Step 1:** Write the review with every item below answered.

  **A. Origin and frame isolation**
  1. The snapshot origin is a **separate registrable domain**, not a subdomain of `buildrick.io`, so app cookies scoped to the parent domain (`COOKIE_DOMAIN`) can never reach it. Record the chosen domain (Q1).
  2. The iframe uses `sandbox="allow-scripts"` with no `allow-same-origin`, `allow-top-navigation`, `allow-popups`, `allow-forms` or `allow-modals`. Record the exact attribute string.
  3. On the snapshot host, middleware serves only `GET /_snapshot/<ticket>`. Every other path, including `/api/*`, `/review/*` and `/_next/*`, returns 404. The test enumerates them.
  4. No cookies are set or read on the snapshot host. The handler never calls `auth()`.

  **B. Response headers on snapshot responses**
  5. `Content-Security-Policy: default-src 'none'; script-src 'sha256-<bridge>'; style-src 'unsafe-inline' https:; img-src https: data:; font-src https: data:; media-src https:; connect-src 'none'; form-action 'none'; base-uri 'none'; frame-src 'none'; object-src 'none'; frame-ancestors <APP_ORIGIN>`.
  6. The global `X-Frame-Options: DENY` is **not** sent on this route, because `frame-ancestors` governs. Add a test that the app's other routes still send DENY.
  7. `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `Cache-Control: private, no-store`, `Cross-Origin-Resource-Policy: cross-origin` (fonts and images), and `Content-Type: text/html; charset=utf-8`.
  8. The app's own CSP `frame-src` adds `REVIEW_SNAPSHOT_ORIGIN` and nothing else.

  **C. Sanitisation**
  9. DOMPurify config: `WHOLE_DOCUMENT: true`, `FORBID_TAGS: [script, iframe, frame, object, embed, form, base, meta (http-equiv only), link (non-stylesheet), portal]`, `FORBID_ATTR: [srcdoc, formaction, ping]`, `ALLOW_DATA_ATTR: true` (keeps `data-buildrick-id`). URIs are restricted to `https:`, `data:` (images and fonts only) and `#`. Inline `style` is kept, and `url(` values other than https/data are stripped.
  10. The XSS corpus test file lists at least 30 payloads (OWASP cheat-sheet classes: tags, attributes, SVG, MathML, encoded `javascript:`, CSS `expression`/`url`, mutation-XSS samples). Each one must produce zero executable vectors.
  11. Sanitisation runs on **serve**, cached per `(reviewRequestId, pageIndex)` in memory with an LRU of 50. It never trusts stored HTML. A sanitiser-version bump invalidates the cache.

  **D. Ticket (access to a snapshot)**
  12. The ticket is `base64url(payload).base64url(HMAC-SHA256(REVIEW_SNAPSHOT_SECRET, payload))`, with payload `{rid, page, exp}` and a TTL of 60 minutes. A constant-time compare is used. The review token never appears in the snapshot URL.
  13. Tickets are issued only by `clientReview.get` for a valid, unexpired and unrevoked token, and only for that round's pages. Revoking the review takes effect when the ticket TTL ends. Record that this is acceptable or reduce the TTL.
  14. Replay within the TTL is allowed, because the ticket is read-only to a snapshot the holder could already see. Record the reasoning.

  **E. Bridge and messages**
  15. The bridge source is a fixed string in the repo, hashed at build. A test asserts that the CSP hash equals `sha256(bridgeSource)`.
  16. The parent generates a 128-bit nonce per frame load and passes it in the iframe URL **fragment** (`#n=`), which is never sent to the server. The bridge reads it once.
  17. Parent acceptance: `event.source === iframe.contentWindow`, `event.origin === "null"` (opaque) **or** `REVIEW_SNAPSHOT_ORIGIN`, `JSON.stringify(data).length <= 4096`, `bridgeToParentSchema.safeParse` succeeds with `.strict()`, and the nonce matches. Bridge acceptance: `event.source === window.parent` plus the same schema and nonce checks.
  18. Message types are closed: frame→parent `ready | pick | open | height`, parent→frame `mode | pins`. Numbers are clamped to 0..1, ids match the regex, and labels are ≤8 characters, rendered with `textContent`.
  19. The bridge cannot navigate (CSP plus sandbox), cannot fetch (`connect-src 'none'`) and cannot read cookies (opaque origin).

  **F. Server write path**
  20. `clientReview.comment` accepts `{ token, body, pageId?, elementId?, x?, y?, reviewRequestId }`. It verifies that `reviewRequestId` is the token's round and that `pageId` is in that round's snapshot. It derives `targetSelector` from `elementId`, and any client `targetSelector` is ignored. Rate limits are unchanged (20/15 min).
  21. The body is still rendered with `textContent` in the editor and on the page (no HTML).

  **G. Operations**
  22. cPanel: the domain has DNS and SSL, maps to the same Node app, and `REVIEW_SNAPSHOT_ORIGIN`/`REVIEW_SNAPSHOT_SECRET` are set via `cloudlinux-selector` **merged** with the existing env (root `CLAUDE.md` warning).
  23. Rollback: if `REVIEW_SNAPSHOT_ORIGIN` is unset, the page falls back to today's `srcDoc sandbox=""` frame with pins unavailable ("Pinning isn't available for this review"). Add a test for that.
  24. Logging: a ticket verification failure logs reason codes only, never ticket contents.
- [ ] **Step 2:** Dispatch a fresh reviewer agent (`/cso`) on the document plus the current code paths listed in the Reality check. Fold its findings into the document.
- [ ] **Step 3:** Commit: `git commit -m "docs(security): FG-006 client pins security review (awaiting owner sign-off)"`
- [ ] **Step 4: STOP.** Report to the owner and wait for the sign-off line.

### Task 1: Message schemas, element-id rule and ticket payload (shared)

**Files:**
- Create: `packages/shared/schemas/review-pins.ts`, `packages/shared/schemas/__tests__/review-pins.test.ts`

**Interfaces:**
- Produces:

```ts
export const ELEMENT_ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
const frac = z.number().min(0).max(1);
export const bridgeToParentSchema = z.discriminatedUnion("type", [
  z.object({ v: z.literal(1), type: z.literal("ready"), nonce: z.string().length(32) }).strict(),
  z.object({ v: z.literal(1), type: z.literal("pick"), nonce: z.string().length(32), elementId: z.string().regex(ELEMENT_ID_RE).nullable(), x: frac, y: frac }).strict(),
  z.object({ v: z.literal(1), type: z.literal("open"), nonce: z.string().length(32), pinId: z.string().max(40) }).strict(),
  z.object({ v: z.literal(1), type: z.literal("height"), nonce: z.string().length(32), px: z.number().int().min(0).max(100000) }).strict(),
]);
export const parentToBridgeSchema = z.discriminatedUnion("type", [
  z.object({ v: z.literal(1), type: z.literal("mode"), nonce: z.string().length(32), on: z.boolean() }).strict(),
  z.object({ v: z.literal(1), type: z.literal("pins"), nonce: z.string().length(32), pins: z.array(z.object({ id: z.string().max(40), label: z.string().max(8), elementId: z.string().regex(ELEMENT_ID_RE).nullable(), x: frac, y: frac }).strict()).max(200) }).strict(),
]);
export const MAX_MESSAGE_BYTES = 4096;
export const snapshotTicketPayload = z.object({ rid: z.string().min(1).max(40), page: z.number().int().min(0).max(199), exp: z.number().int() }).strict();
export function selectorForElementId(id: string): string { /* returns `[data-buildrick-id="${id}"]` after ELEMENT_ID_RE check, else throws */ }
```

- [ ] **Step 1: Write the failing tests.**
  - Extra fields are rejected.
  - `x: 1.01` is rejected.
  - `elementId: '"]<script>'` is rejected.
  - `selectorForElementId("abc-1")` returns `[data-buildrick-id="abc-1"]`, and `selectorForElementId('a"b')` throws.
  - `pins` with 201 items is rejected.
- [ ] **Step 2: Run them and confirm they fail.** `pnpm vitest run packages/shared/schemas/__tests__/review-pins.test.ts`
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run them and confirm they pass.**
- [ ] **Step 5: Commit.** `git commit -m "feat(review-pins): shared message schemas + element-id rule"`

### Task 2: Sanitiser with XSS corpus

**Files:**
- Create: `server/services/review-snapshot-sanitize.ts`, `__tests__/review-snapshot-sanitize.test.ts`, `__tests__/fixtures/xss-corpus.ts`

**Interfaces:**
- Produces: `sanitizeSnapshotHtml(html: string): string` and `SANITIZER_VERSION = 1`.

- [ ] **Step 1: Write the failing tests.**
  - For every corpus entry, parse the output with jsdom and assert:
    - there are no `script` elements;
    - no element has an attribute starting with `on`;
    - no `href`, `src` or `action` starts with `javascript:`, `vbscript:` or `data:text/html`;
    - there is no `iframe`, `object`, `embed`, `form`, `base` or `meta[http-equiv]`.
  - `data-buildrick-id` survives.
  - `<link rel="stylesheet" href="https://fonts.googleapis.com/…">` survives, but `<link rel="preload" as="script">` does not.
  - Inline `style="background:url(javascript:alert(1))"` loses the `url()`.
  - A real exported page fixture (`__tests__/fixtures/export-home.html`, produced by `ExportEngine` in a test) renders the same text content before and after, with only scripts removed.
- [ ] **Step 2: Run them and confirm they fail.** `pnpm vitest run __tests__/review-snapshot-sanitize.test.ts`
- [ ] **Step 3: Implement** with `isomorphic-dompurify` using the Task 0 §C config, plus a `uponSanitizeAttribute` hook for `style` `url()` filtering. DOMPurify is created lazily inside the function, not at module level (no module-level side effects).
- [ ] **Step 4: Run them and confirm they pass.**
- [ ] **Step 5: Commit.** `git commit -m "feat(review-pins): snapshot sanitiser + XSS corpus"`

### Task 3: Snapshot service, ticket, route and host gate

**Files:**
- Create: `server/services/review-snapshot.service.ts`, `packages/dashboard/lib/review-pin-bridge.ts` (bridge **placeholder** source exported here and filled in by Task 4; the hash is computed from whatever is exported), `packages/dashboard/app/_snapshot/[ticket]/route.ts`
- Modify: `packages/dashboard/middleware.ts`, `packages/dashboard/next.config.mjs`, root `CLAUDE.md` (env rows)
- Test: `__tests__/review-snapshot-service.test.ts`, `__tests__/review-snapshot-route.test.ts`, `__tests__/middleware-snapshot-host.test.ts`

**Interfaces:**
- Produces:
  - `signSnapshotTicket({ rid, page }, now?)` and `verifySnapshotTicket(ticket, now?) → { rid, page } | { error: "expired" | "bad-signature" | "malformed" }`.
  - `loadSnapshotHtml(rid, page): Promise<string | null>`. It returns null for a revoked, expired, pruned or missing round or page, and is sanitised and cached.
  - `snapshotHeaders(bridgeHash: string): Record<string, string>`.

- [ ] **Step 1: Write the failing tests.**
  - A ticket round-trips.
  - A tampered signature, an expired ticket, and a ticket for page 3 used as page 2 (the payload is signed, so the signature fails) are all refused.
  - The route returns 403 with an empty body for a bad ticket, and 404 for a pruned snapshot.
  - The success response has the exact Task 0 §B headers, with **no** `X-Frame-Options`, and the CSP's `sha256-` equals `createHash("sha256").update(BRIDGE_SOURCE).digest("base64")`.
  - The body contains exactly one `<script>`, the bridge, placed before `</body>`.
  - Middleware: with `host` = snapshot host, `/review/x`, `/api/trpc/x`, `/` and `/_next/static/x` return 404, while `/_snapshot/abc` passes through. With `host` = app host, `/_snapshot/abc` returns 404.
  - When `REVIEW_SNAPSHOT_ORIGIN` is unset, `/_snapshot/*` returns 404 everywhere.
- [ ] **Step 2: Run them and confirm they fail.**
- [ ] **Step 3: Implement.**
  - `REVIEW_SNAPSHOT_SECRET` is read lazily inside the sign and verify functions.
  - In `next.config.mjs`, append the snapshot origin to the app `frame-src`, and exclude `/_snapshot/:path*` from the global header block using a negative-lookahead `source`.
  - Add the env rows to root `CLAUDE.md` § Core: `REVIEW_SNAPSHOT_ORIGIN` (the separate snapshot domain; unset means pins are unavailable) and `REVIEW_SNAPSHOT_SECRET` (32-byte hex HMAC key; never reuse `NEXTAUTH_SECRET`).
- [ ] **Step 4: Run them and confirm they pass.**
- [ ] **Step 5: Commit.** `git commit -m "feat(review-pins): isolated snapshot route, signed tickets, host gate, strict CSP"`

### Task 4: The pin bridge (frame side)

**Files:**
- Modify: `packages/dashboard/lib/review-pin-bridge.ts` (real source)
- Test: `__tests__/review-pin-bridge.test.ts` (jsdom: evaluate `BRIDGE_SOURCE` in a window whose `parent` is a stub)

**Interfaces:**
- Consumes: `bridgeToParentSchema`, `parentToBridgeSchema` and `ELEMENT_ID_RE`. The bridge is plain ES2019 with no imports, so it **inlines a hand-written validator**. The test asserts that every message the bridge emits passes the shared schema and that every message the schema rejects is ignored by the bridge.
- Behaviour:
  - It reads `nonce` from `location.hash` once and then clears the hash.
  - It posts `ready`.
  - On `mode {on:true}`, it sets a crosshair cursor and on click calls `preventDefault()`. It walks from `event.target` to `closest('[data-buildrick-id]')` and validates the id. It computes `x = pageX / scrollWidth` and `y = pageY / scrollHeight`, then posts `pick`.
  - On `pins`, it draws absolutely positioned numbered markers. Placement uses the element's rect when the id resolves and the coordinates otherwise. The label is set with `textContent`, and clicking a marker posts `open`.
  - It posts `height` on resize, debounced.
  - It ignores any message where `event.source !== parent`, the nonce mismatches, or the payload exceeds 4096 bytes.

- [ ] **Step 1: Write the failing tests.**
  - With mode off, a click posts nothing.
  - With mode on, a click on a `<span>` inside `<div data-buildrick-id="hero-1">` posts `pick` with `elementId: "hero-1"`.
  - With no ancestor id, `elementId` is null.
  - A `pins` message from a wrong source, or with the wrong nonce, draws nothing.
  - A pin label `"<b>1</b>"` renders as literal text.
  - An unknown message type is ignored.
  - The bridge never calls `fetch`, `XMLHttpRequest`, `document.cookie` or `location.assign`. Spy on each.
- [ ] **Step 2: Run them and confirm they fail.**
- [ ] **Step 3: Implement** the bridge in about 100 lines. The hash test from Task 3 re-runs automatically.
- [ ] **Step 4: Run them and confirm they pass,** plus the Task 3 suite.
- [ ] **Step 5: Commit.** `git commit -m "feat(review-pins): trusted pin bridge with validated messages"`

### Task 5: Parent side and client pin UI

**Figma:** C-03 `7593:193511`.

**Files:**
- Create: `packages/dashboard/app/review/[token]/usePinBridge.ts` + test
- Modify: `packages/dashboard/components/reviews/signoff-snapshot.tsx:95-123`, `packages/dashboard/app/review/[token]/review-client.tsx:280-360`, `server/services/client-review.service.ts` (`get` returns `snapshotTickets: string[]` + `reviewRequestId`)

**Interfaces:**
- Produces: `usePinBridge(frameRef, { onPick, onOpen }): { ready: boolean; setMode(on: boolean): void; setPins(pins): void }`.

- [ ] **Step 1: Write the failing tests.**
  - The iframe `src` is `${REVIEW_SNAPSHOT_ORIGIN}/_snapshot/<ticket>#n=<nonce>`, with `sandbox="allow-scripts"` exactly. The attribute string is asserted, and `allow-same-origin` is absent.
  - Messages from `window` itself, from a second iframe, with origin `https://evil.example`, with a bad nonce, over 4096 bytes, or with an extra key are dropped. `onPick` is not called.
  - A valid `pick` opens the draft popover anchored at (x, y) over the frame (C-03).
  - Submitting calls `clientReview.comment` with `{ token, body, pageId, elementId, x, y, reviewRequestId }`.
  - Without `REVIEW_SNAPSHOT_ORIGIN` (no tickets returned), the frame is today's `srcDoc sandbox=""` and the "Add pin" control is replaced with "Pinning isn't available for this review".
- [ ] **Step 2: Run them and confirm they fail.** `pnpm vitest run packages/dashboard/app/review packages/dashboard/components/reviews`
- [ ] **Step 3: Implement.** The "Add pin" toggle is the C-03 control. Esc leaves pin mode. Existing pins on the current page are sent via `setPins`.
- [ ] **Step 4: Run them and confirm they pass.**
- [ ] **Step 5: Figma loop** for C-03 `7593:193511` at 1440×900, live on a local review link.
- [ ] **Step 6: Commit.** `git commit -m "feat(review): client located pins over isolated snapshot (FG-006)"`

### Task 6: Anchor storage and the server write path (owner-applied migration)

**Files:**
- Modify: `prisma/schema.prisma` (`Comment`), `packages/shared/schemas/comments.ts`/client-review input, `server/services/client-review.service.ts:283-313`
- Create: `prisma/migrations/20261015100000_comment_snapshot_anchor/migration.sql`
- Test: `__tests__/client-review-pin-comment.test.ts`

- [ ] **Step 1: Write the failing tests.**
  - A comment with `elementId: "hero-1"` stores `targetSelector = '[data-buildrick-id="hero-1"]'`, `elementId`, `reviewRequestId`, `pageId`, `x` and `y`.
  - A client-sent `targetSelector` is ignored.
  - A `reviewRequestId` that isn't the token's round gives BAD_REQUEST.
  - A `pageId` that isn't in that round's `snapshotPages` gives BAD_REQUEST.
  - `elementId` failing the regex gives BAD_REQUEST.
  - A text-only comment (no pin) still works unchanged.
- [ ] **Step 2: Run them and confirm they fail.**
- [ ] **Step 3: Migration**

```sql
-- OWNER-APPLIED. Additive. Snapshot version + stable element identity for located client pins (FG-006).
ALTER TABLE "comments" ADD COLUMN IF NOT EXISTS "reviewRequestId" TEXT;
ALTER TABLE "comments" ADD COLUMN IF NOT EXISTS "elementId" TEXT;
CREATE INDEX IF NOT EXISTS "comments_reviewRequestId_idx" ON "comments"("reviewRequestId");
```

  Prisma: `reviewRequestId String?` and `elementId String?`, with **no FK**, because rounds are pruned and the anchor must survive as history. Run `pnpm prisma generate` only.
- [ ] **Step 4: Implement** the service change.
- [ ] **Step 5: Run them and confirm they pass.**
- [ ] **Step 6: Commit.** `git commit -m "feat(review-pins): store page + snapshot version + element id; server-derived selector"`

### Task 7: Editor side — anchor resolution order and the "earlier version" state

**Files:**
- Modify: `packages/editor/src/editor/canvas/comments/commentAnchors.ts`, `packages/editor/src/editor/sidebar/tabs/review/{ReviewTab.tsx,locate.ts}`, `packages/editor/src/services/ReviewService.ts` (`ReviewComment` gains `elementId`, `reviewRequestId`)
- Test: `canvas/comments/__tests__/commentAnchors.test.ts`, `sidebar/tabs/review/__tests__/ReviewTab.pins.test.tsx`

**Interfaces:**
- Produces: `resolveCommentAnchor(composer, c): { kind: "element"; elementId } | { kind: "position"; pageId; x; y; earlierVersion: boolean } | { kind: "none" }`. The order is:
  1. `elementId` exists on `pageId`;
  2. else the selector resolves;
  3. else a position on `pageId` (`earlierVersion` = the comment's round is not the latest);
  4. else none.

- [ ] **Step 1: Write the failing tests.** Cover each branch.
  - The row label is "Pinned on an earlier version" when `earlierVersion` and the element is gone, and "Pinned by position" when there is no element id.
  - Locate on a position-only comment switches page and scrolls to the fraction **without selecting** any element.
  - It never selects an element other than the stored id.
- [ ] **Step 2: Run them and confirm they fail.** `cd packages/editor && npx vitest run src/editor/canvas/comments src/editor/sidebar/tabs/review`
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run them and confirm they pass.**
- [ ] **Step 5: Commit.** `git commit -m "feat(review): resolve client pins by element id, then selector, then position"`

### Task 8: Cross-origin live verification and security re-check

- [ ] **Step 1: Local two-origin setup.** Add `127.0.0.1 snap.buildrik.test` to `/etc/hosts` (owner permission; otherwise use `localtest.me`). Set `REVIEW_SNAPSHOT_ORIGIN=http://snap.buildrik.test:3000` in `.env.local` and restart the dev server.
- [ ] **Step 2: Live done-condition** (local dev site; send a review round to a local email; **no publish**):
  1. Open the review link and click "Add pin", then click the hero heading. A pin appears and the draft popover opens. Submit.
  2. In the editor, the Review panel shows the comment located on the heading, and Locate selects it.
  3. In DevTools on the review page:
     - `document.querySelector('iframe').getAttribute('sandbox') === "allow-scripts"`;
     - the frame's response headers match Task 0 §B;
     - `frames[0].document` throws, because the frame is cross-origin and opaque.
  4. From the review page console, `frames[0].postMessage({v:1,type:"mode",nonce:"x".repeat(32),on:true},"*")` with a wrong nonce causes nothing.
  5. Add `<img src=x onerror=alert(1)>` to the page as custom HTML, send a new round, and open it. No alert fires, and the CSP report shows no violations except the blocked inline handler, if it survived at all.
  6. Delete the heading in the editor. The comment shows "Pinned on an earlier version".
- [ ] **Step 3:** Run a Playwright spec, `packages/dashboard/e2e/review-pins.spec.ts`, automating steps 1, 3 and 4 against the two hosts.
- [ ] **Step 4:** Re-dispatch the Task 0 reviewer on the final diff. Record the verdict in the security doc.
- [ ] **Step 5:** Write `docs/audits/2026-10-08-editor-full-audit/status-p5-pins.md`. Production is NOT VERIFIED until the owner sets up the domain on cPanel.
- [ ] **Step 6:** Commit: `git commit -m "test(review-pins): cross-origin e2e + security re-check (FG-006)"`

---

## Owner questions (recommended defaults in bold)

| # | Question | Recommendation |
|---|---|---|
| Q1 | Which separate domain is the snapshot origin? It must be a different registrable domain from `buildrick.io`. | **Register `buildrick-snapshots.com` (or similar) and point it at the same cPanel Node app with SSL.** Owner infrastructure step, required before production. |
| Q2 | Is a ticket TTL of 60 minutes acceptable (revocation lag)? | **Yes**, the ticket is read-only. Use 15 minutes if revocation must be near-instant. |
| Q3 | Must clients be able to pin in pages whose markup lacks ids (CMS-generated lists)? | **Position-only pins are fine**, labelled "Pinned by position". |
| Q4 | Pin on the approval or "Request changes" flow only, or also on general notes? | **Both**. Any client comment can carry a pin. |

## Migrations

`20261015100000_comment_snapshot_anchor`: `Comment.reviewRequestId`, `Comment.elementId` plus an index. Additive and **owner-applied**. Order-independent of the comments plan's migrations A and B.
