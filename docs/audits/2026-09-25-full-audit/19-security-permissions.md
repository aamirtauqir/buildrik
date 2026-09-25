# 19 — Security, Authorization & Permission Boundaries

- **Agent:** F (Security & Permissions)
- **Prompt:** 19
- **Date:** 2026-09-25
- **Mode:** READ-ONLY. This file is the only one written in the repo. The runtime proofs of concept (PoCs) were scratch files in the session scratchpad, outside the repo.
- **Scope:** authentication, authorization and roles; workspace, site, CMS and media permissions; publish and delete; AI usage; invitations; sharing; collab rooms; comments; realtime (SSE) events; uploads; XSS; secrets; validation; rate limits. I covered `server/` (all 33 routers, the permission and auth services), `packages/dashboard/app/api/*` (all 37 route handlers), `packages/dashboard/middleware.ts` and `next.config.mjs`, the editor's sanitize and serialize boundary (`packages/editor/src`), `lib/`, `packages/shared/schemas` and `prisma/schema.prisma`.

---

## Method & runtime status

| What I ran | Result |
|---|---|
| Read every router in `server/trpc/routers/*.ts`. For each procedure I traced guard → service → Prisma `where` scoping. | Findings below. The inventory's list of duplicated inline authz lookups (`sites.ts`, `site-detail.ts`, `dashboard.ts`, `api-tokens.ts`, `integrations.ts`) is correct. |
| Read every `app/api/**/route.ts` (cron, workers, SSE, collab, upload, asset-upload, share, public forms/track, Vercel OAuth, create-session). | All 18 cron routes and 2 worker routes call `checkCronAuth`/`checkWorkerAuth`, which is timing-safe and fails closed when the secret is unset (`lib/cron-auth.ts:40-60`). |
| `pnpm vitest run __tests__/permission-service.test.ts __tests__/page-service.test.ts __tests__/upload-service.test.ts __tests__/client-review-service.test.ts` | 4 files, 41/41 pass. **None of them tests the defects below.** The page-service tests never pass a `pageId` from another site, and the upload tests never check authz on `siteId`. |
| **Scratch PoC 1** (`tsx`, real modules): `sanitizeBlocks` (server write boundary), the editor's `isSafeAttrValue` and `buildAttributeString`, fed `{tagName:"iframe", attributes:{srcdoc:"<script>…"}}` and `tagName:"img src=x onerror=alert(1) x"`. | Server: both survive unchanged. Client: `isSafeAttrValue("srcdoc", "<script>…")` returns `true`. Serializer: emits `srcdoc="&lt;script&gt;…"`, which the browser decodes and executes (A19-1). |
| **Scratch PoC 2** (vitest, real `Composer`): `importProject` with that tree, then `composer.elements.toHTML()`, which is the exact string the canvas renders through `dangerouslySetInnerHTML`. | **Pass.** The canvas HTML contains `<iframe … srcdoc=` and the raw `<img src=x onerror=alert(1) x` tag (A19-1). |
| **Scratch PoC 3** (vitest, real `page.service` with mocked Prisma): `updatePage`/`deletePage` with `siteId: ATTACKER_SITE`, `pageId` of a page on `VICTIM_SITE`. | **Pass.** `page.update`/`page.delete` run on the victim's page (A19-2). |
| **Scratch PoC 4** (vitest, real `upload.service`): `createPresignedUrl({context:"og_image", siteId:"SOMEONE_ELSES_SITE"})`. | **Pass.** The pending upload is stored with the foreign `siteId`, and no role check runs (A19-3). |
| **Scratch PoC 5** (vitest, real `auth.service`, real bcrypt hash): `login()` for a user with `emailVerified: null`, then `signup()` with the same email. | **Pass.** Login succeeds unverified. Signup runs `workspace.deleteMany({ownerId: victim})` and `user.delete(victim)` (A19-5). |

**NOT RUNTIME VERIFIED:**
- Nothing ran against Postgres, Vercel Blob, a browser, or the cPanel/LiteSpeed proxy.
- Specifically unverified:
  - that the A19-1 payload actually executes in Chrome or Firefox on `/edit/<siteId>` (the chain is proven only up to the HTML string the canvas injects);
  - that Vercel Blob `put(…, {allowOverwrite:true})` and `del()` behave as their options state (A19-3 and A19-4);
  - which `X-Forwarded-For` value LiteSpeed forwards (A19-12);
  - end-to-end publish after a self-approval (A19-6).

---

## Output table (Prompt 19 format)

| ID | Issue | File / function | Role / action | Enforcement today | Risk | Recommendation | Priority |
|---|---|---|---|---|---|---|---|
| A19-1 | **Stored XSS in the editor canvas.** It turns any site EDITOR into an OWNER. | `lib/sanitize-blocks.ts:23-57`; editor `sanitization.ts:163-175`; `ElementSerialization.toHTML` `:64-80`; `Element.getTagName` `:116-120`; `Canvas.tsx:720`; `site-component.service.ts:13-31` | Any EDITOR or DESIGNER, including a client scoped to one site, saves the element tree | The sanitizers strip `on*` handlers and `javascript:` URLs only. `tagName` is emitted raw. `srcdoc` is allowed. Components, user templates, versions and collab ops are not sanitized on the server. | Script runs on the app origin when an OWNER or ADMIN opens the editor. From there it can call any tRPC endpoint as that user (invite, change roles, billing, transfer, delete). | Allowlist `tagName` on server and client. Deny `srcdoc` and other unlisted attributes. Sanitize every stored element tree. Consider rendering the canvas in a sandboxed iframe. | **P0** |
| A19-2 | **Cross-tenant page overwrite and delete (IDOR).** | `server/services/page.service.ts:95-129`; `routers/pages.ts:55-69` | Any logged-in user, since signup auto-creates their own site | Authz is checked on `input.siteId`, but the write goes to `input.pageId` with no `page.siteId === siteId` check | A former member or reviewer who knows a page id rewrites or deletes that page on any tenant's site | Scope the writes: `where: {id: pageId, siteId}` / `updateMany`, and throw `NOT_FOUND` on a mismatch | **P0** |
| A19-3 | **Any user can overwrite any site's favicon, og-image or touch-icon blob.** | `upload.service.ts:22-47`; `api/upload/[fileId]/route.ts:67-95` | Any logged-in user | `siteId` in `upload.presign` is never authorized. The blob key `sites/<siteId>/…` is predictable and written with `allowOverwrite: true`. | Defacement of every published site's social card and favicon (SVG is allowed for favicons). The site id is visible in the published favicon URL. | Call `checkSiteRole(…, "ADMIN")` on `siteId` for site contexts at presign **and** at PUT. Add a random suffix. | **P0** |
| A19-4 | **Cross-tenant blob deletion through a forged `MediaAsset` URL.** | `media.service.ts:53-80` (`assertUrlNotOwnedByOther`), `:320-365` (`deleteAsset` → `del`) | Any logged-in user | The URL is checked only against the `MediaAsset`/`MediaAssetVersion` tables. Favicon, og, thumbnail, avatar and workspace-icon blobs are not in those tables. | Permanent deletion of another tenant's favicon, og-image, thumbnail, avatar or icon blob | Accept only URLs this server minted (a `PendingUpload`/token-payload record), or never `del()` a URL not created through `/api/asset-upload` for that user | **P0** |
| A19-5 | **An unauthenticated caller can delete an unverified user and every workspace they own.** Unverified accounts are fully usable. | `auth.service.ts:152-181` (`signup` "reclaim"); `login` `:96-150` has no `emailVerified` check | Anonymous → `auth.signup` | Unverified users can log in and build sites. A second signup with the same email deletes them. | Data loss: sites, pages, media rows, and the work of any members of those workspaces | Either block login until the email is verified, or reclaim only rows with no workspace activity. Never cascade-delete an account that has logged in. | **P0** |
| A19-6 | **An EDITOR can self-approve and bypass the publish-approval gate.** | `review.service.ts:92-123` (token returned to the submitter); `client-review.service.ts:184-215, 273-296`; `publish.service.ts:262-300` | An EDITOR in an `editsRequireApproval` workspace | The submitter picks `clientEmail`, receives the token, identifies with that email, and approves | Unauthorized publish, plus a forged "client signed off" record | Do not return the token to the submitter, or require an admin to confirm the invited address. Bind approval to a reviewer who is not a member. Record who issued the token. | **P0** |
| A19-7 | **A demoted member keeps their old per-site role** (confirms A07-1). | `team.service.ts:135-166` (`changeRole`); `permission.service.ts:113-115`; `routers/auth.ts:305-316`; `sites.service.ts:273-283` | An ADMIN demotes a site-scoped member | `roleOverride` wins over `WorkspaceMember.role`, and `changeRole` never touches it | Permission bypass: a "Viewer" keeps save, publish, share and collab access | Clamp or clear the overrides on every role change, and show them in the Team UI | **P0** |
| A19-8 | Unmetered, unbounded AI endpoints | `routers/ai.ts:233-271` (`summarize`, `milestoneSuggest`); schema `:67-86` | Any logged-in user, including unverified ones | No `reserveAiUnit`/quota check, no rate limit, and `before`/`after` string sizes are unbounded | Unlimited OpenAI spend and token amplification | Reserve quota like `content`/`page`, cap string lengths, add a per-user rate limit | P1 |
| A19-9 | An unverified email is trusted as identity | `routers/auth.ts:283-293` (invite binding); `workspace-transfer.service.ts:60-66`; `verifyMagicLink` `auth.service.ts:337-365` | Anyone who pre-registers someone else's email | Checks compare `user.email` without `emailVerified` | Pre-account hijack: the attacker keeps their password after the victim claims the account through a magic link. The invite and transfer email binding is defeated for anyone holding the token. | Require `emailVerified` for any email-bound grant. On magic-link or verify claim of a never-verified account, reset the password and bump `sessionVersion`. | P1 |
| A19-10 | Site-scoped members can see every site in the workspace | `sites.service.ts:47-57` (`listSites`) | A member scoped to specific sites (for example a client) | `listSites` filters by `workspaceId` only | Leaks names, status, domains and traffic of sites the member was never given | Apply `resolveSiteScope` to list and aggregate reads | P2 |
| A19-11 | The share-link password and sharing policy are cosmetic (confirms A07-8) | `app/share/[token]/page.tsx:45-53`; `verify-password/route.ts`; `share-link.service.ts:12-72` | Anyone holding a link; an EDITOR or DESIGNER | The gate redirects to the public `publishedUrl`. The `share_<token>=1` cookie is unsigned and forgeable. `requirePw`/`defaultExpiration` are never enforced. `allowEditors` checks only `role === "EDITOR"`. | A false sense of protection, and the workspace policy is bypassed | Either enforce it (sign the cookie and use deployment protection) or relabel the feature. Enforce the policy server-side against the effective site role. | P2 |
| A19-12 | Every IP rate limit is keyed on the leftmost `X-Forwarded-For` value | `trpc.ts:146`; `routers/auth.ts:31`; `share verify`, `public/forms`, `public/track` | Anonymous | A client-supplied header | Bypasses the login-failure budget, the captcha trigger, the share-password throttle, form spam limits and client-review limits | Take the right-most proxy-appended hop, or a trusted header set by the platform | P2 (PARTIAL) |
| A19-13 | Integration configs are exposed to every member | `routers/account.ts:275-278` → `integrations.service.ts:16-20` | VIEWER | No role check, and every column is returned | Webhook URLs (bearer secrets, such as Slack) and the encrypted Vercel token go to viewers | Require ADMIN, or project out `config` secrets | P2 |
| A19-14 | The collab op channel is live in production, has no validation, and does not re-check access after revocation (confirms A16-6 and A16-11) | `api/collab/[siteId]/ops/route.ts:13-35`; `api/sse/collab/[siteId]/route.ts:17-24` | Site EDITOR | Role checked once; opaque JSON of unbounded size; no flag gate; no rate limit | Storage DoS, forged presence, `sync_response` project injection (also an A19-1 vector), reads after revocation | Gate on `FEATURE_COLLAB` server-side, add a Zod schema and a size cap, re-check the role on every poll | P2 |
| A19-15 | Plan limits are looked up through an arbitrary membership | `routers/site-detail.ts:169-172, 237-240` | EDITOR in two workspaces | `workspaceMember.findFirst({where:{userId}})` with no `workspaceId` | Bypasses redirect-count plan limits | Look up the plan through `site.workspaceId` | P3 |
| A19-16 | The guards drop `ctx.bearer` | `server/trpc/guards.ts:12-43`; direct `checkSiteRole` calls in the routers | API token (latent) | Tokens are deny-all today because nothing uses `scopedProcedure` | The day one endpoint adopts `scopedProcedure`, a token for workspace A reaches workspace B | Thread `ctx.bearer` through the guards now | P3 |
| A19-17 | Share-link rows, including `passwordHash` and `token`, are returned to VIEWERs | `share-link.service.ts:5-10`; `site-detail.ts:397-407` | VIEWER | `findMany` returns the full rows | Leaks the bcrypt hash and live tokens | Use a `select` without `passwordHash`, and gate `token` on EDITOR | P3 |
| A19-18 | The publish SSE stream checks membership without `status` or site scope and streams the full job, including the `log` HTML | `api/sse/publish/[jobId]/route.ts:42-54` | Suspended or site-scoped member holding a job id | `workspaceMember.findFirst({workspaceId, userId})` | Reads draft or published HTML for out-of-scope sites | Use `assertSiteAccess(job.siteId)` and strip `log` | P3 |
| A19-19 | `domains.check` mutates before it authorizes | `site-detail.ts:297-309` → `domain.service.ts:~34-63` | Any member of any site | The DNS check and `dnsRecord.update` run on any `id` before the siteId match | Flips verification flags on another tenant's DNS records | Scope the lookup `{id, siteId}` first | P3 |
| A19-20 | Minor authz and abuse gaps | `sites.duplicate` (`sites.ts:113-132`), `templates.generate.create` (`templates.ts:94-107`), `upload` `workspace_icon`, `sites.getScheduledPublish` (`:455`), `reviews.submit` email relay, `comments.create`, `public/track` | VIEWER / EDITOR | Various | Viewers creating sites or consuming AI quota; unthrottled comment and email spam; analytics poisoning; a raw `PermissionError` returned as a 500 | See the P3 section | P3 |

### UX guard vs real server enforcement

| Surface | Client (UX) guard | Server enforcement | Verdict |
|---|---|---|---|
| Open editor `/edit/:id` | — | `userCanEditSite` → `checkSiteRole(EDITOR)` (`edit/[siteId]/page.tsx:20`) | Real, but see A19-7 (stale override) |
| Editor controls disabled by role | `useEditorRole` → `sites.myRole` | Every mutation re-checks (save and publish need EDITOR; settings, domains and unpublish need ADMIN; delete and transfer need OWNER) | Real |
| Pages panel writes | — | `pages.update`/`delete` check the **caller-supplied** `siteId` only | **Broken** (A19-2) |
| Publish button | Flag plus role | EDITOR plus the approval gate in `startPublish` | The gate is bypassable (A19-6) |
| Team: invite and role changes | Settings → Team visible to admins | `requireAdmin` + `checkWorkspaceRole(ADMIN)`, with an IDOR-scoped member id | Real, but demotion is incomplete (A19-7) |
| Share-link creation | Workspace sharing settings UI | EDITOR plus `allowEditors` (raw `role==="EDITOR"` only); `requirePw`/expiry are not enforced | Partly cosmetic (A19-11) |
| Collab "Start collaboration" | `FEATURE_COLLAB` flag (off in production) | The routes are **not** flag-gated | UX-only (A19-14) |
| AI popover and chat | `FEATURE_DS_AI` / provider checks | Quota on `content`/`page`/`layout`/`streamPrompt`/`componentSchema`; **none** on `summarize`/`milestoneSuggest` | Partial (A19-8) |
| Agency layer (clients, reviews, theme) | Client-side redirect | `requireAgencyLayer` in every mutating agency procedure | Real |
| Favicon, og and icon upload | Settings tab for ADMIN | `upload.presign` has no site check | **Broken** (A19-3) |

---

## Findings — P0 (IMMEDIATE FIX REQUIRED)

### A19-1 — P0 — IMMEDIATE FIX REQUIRED: stored XSS in the editor canvas lets any site EDITOR run script as whoever opens the editor next
- **Severity:** P0 (XSS leading to privilege escalation).
- **File:**
  - `lib/sanitize-blocks.ts:23-57`: `isUnsafeAttribute` / `sanitizeNode`.
  - `packages/editor/src/shared/utils/html/sanitization.ts:70-95` (`isSafeAttrValue`) and `:163-175` (`sanitizeElementTreeContent`).
  - `packages/editor/src/engine/elements/ElementSerialization.ts:64-80`.
  - `packages/editor/src/engine/elements/Element.ts:116-120`.
  - `packages/editor/src/editor/canvas/hooks/useCanvasContent.ts:33-50`.
  - `packages/editor/src/editor/canvas/Canvas.tsx:720`.
  - `packages/dashboard/next.config.mjs:10-16` (`script-src 'self' 'unsafe-inline'`).
- **Symbol:** `sanitizeBlocks`, `sanitizeElementTreeContent`, `buildAttributeString`, `ElementSerialization.toHTML`, `Canvas`
- **Evidence:**
  - **Server boundary.** `sites.saveProject` accepts `root: z.unknown()` (`packages/shared/schemas/sites.ts:200`) and runs `sanitizeBlocks` (`sites.service.ts:649`). That function only drops attributes matching `/^on/i` and dangerous schemes on `href/src/action/formaction/poster/xlink:href`. It never looks at `tagName`, and it keeps `srcdoc`.
  - **Client boundary.** On load, `Composer.importProject` (`Composer.ts:612-616`) calls `sanitizeElementTreeContent`. That uses `isSafeAttrValue`, which returns `true` for `srcdoc="<script>…"` because none of the `DANGEROUS_PATTERNS` (`sanitizationConfig.ts:276-283`) match.
  - **Serializer.** `ElementSerialization.toHTML` emits `` `<${tag}${attrs}>` `` with `tag = getTagName()`, which is the stored string, unvalidated.
  - **Render.** The canvas renders `composer.elements.toHTML()` (`useCanvasSync.ts:33`), re-serialized through `DOMParser` with no sanitizer (`useCanvasContent.ts:46-49`), via `dangerouslySetInnerHTML` into the main document. This is not an iframe.
  - **PoC 1 and PoC 2 (runtime, unit level).** The server keeps both payloads. `Composer.importProject` → `toHTML()` produces `<iframe … srcdoc="&lt;script&gt;…">` and `<img src=x onerror=alert(1) x …>`.
  - **Why it executes.** An `srcdoc` iframe inherits the parent's origin and CSP, and the CSP allows inline script. `<img onerror>` inserted through `innerHTML` fires. Browser execution itself is NOT RUNTIME VERIFIED.
  - **More stores with no server-side sanitization at all** (`grep sanitizeBlocks` shows callers only in `sites`, `page` and `template` services):
    - `siteComponents.upsert` payload (`site-component.service.ts:13-31`), shared across the whole workspace through `workspaceList`;
    - `userTemplates.upsert`;
    - `siteVersions.create`;
    - the collab op log (A19-14).
- **Expected behavior:** Stored element trees cannot produce executable markup on the app origin. `tagName` comes from an allowlist, and attributes come from an allowlist per tag.
- **Root cause:** The sanitizers use a denylist (event handlers and URL schemes) instead of an allowlist. The tag name is treated as trusted. The canvas is a same-origin `innerHTML` sink.
- **Affected modules:** Editor canvas; every site-content store (pages, components, templates, versions, collab); team, billing and ownership (the escalation targets).
- **Recommendation:**
  - Validate `tagName` against `DEFAULT_ALLOWED_TAGS` on the server (`sanitizeBlocks`) and in the client (`importProject`, `getTagName`).
  - Allowlist attributes: drop `srcdoc`, `formaction` and `srcset` with `javascript:`, and so on.
  - Run the server sanitizer on component, template and version payloads.
  - Longer term: render the canvas in a sandboxed iframe, or add a nonce-based CSP without `unsafe-inline`.
- **Status:** VERIFIED to the canvas HTML string (PoC). Browser execution NOT RUNTIME VERIFIED.

### A19-2 — P0 — IMMEDIATE FIX REQUIRED: `pages.update` and `pages.delete` let any user overwrite or delete a page on any tenant's site
- **Severity:** P0 (cross-tenant destructive write).
- **File:**
  - `server/trpc/routers/pages.ts:55-69`
  - `server/services/page.service.ts:95-129`
- **Symbol:** `pagesRouter.update`, `pagesRouter.delete`, `updatePage`, `deletePage`
- **Evidence:**
  - The router authorizes `guardSiteEditor(…, input.siteId)`.
  - The service then runs `prisma.page.findUnique({where:{id: input.pageId}})` and `page.update({where:{id: pageId}, data:{…fields, blocks}})` (`:96-113`), or `page.delete({where:{id: input.pageId}})` (`:124`). It never checks `existing.siteId === input.siteId`.
  - Every signup gets its own workspace and site (`createWorkspaceForUser`), so every account has a site it can pass as `siteId`.
  - Page ids are cuids, but they reach anyone who ever had editor access (project JSON), client reviewers (`comment.pageId`), and removed members. This is revocation-proof access.
  - PoC 3 passes: the real service updates and deletes a `VICTIM_SITE` page under `ATTACKER_SITE` authz.
  - The sibling procedures `setTranslation`/`removeTranslation` do check `SITE_MISMATCH`, which shows the pattern was known.
- **Expected behavior:** A page can only be written through the site it belongs to.
- **Root cause:** Authz is on one id and the write is on another. The service does not scope the mutation.
- **Affected modules:** Pages; forms (`formBlock.deleteMany` of the victim page, `:123`); the published site on its next publish.
- **Recommendation:** Use `updateMany/deleteMany({where:{id: pageId, siteId}})` or an explicit `existing.siteId !== siteId → NOT_FOUND`. Add a test with a foreign `pageId`. The inventory lists these procedures as "no UI"; consider removing them if nothing calls them.
- **Status:** VERIFIED (code plus unit PoC with the real service). Not run against a DB.

### A19-3 — P0 — IMMEDIATE FIX REQUIRED: any authenticated user can overwrite any site's favicon, touch-icon or og-image
- **Severity:** P0 (unsafe upload; cross-tenant write).
- **File:**
  - `server/trpc/routers/upload.ts:8-18`
  - `server/services/upload.service.ts:22-47`
  - `packages/dashboard/app/api/upload/[fileId]/route.ts:36-95`
  - `packages/shared/schemas/upload.ts:3-8`
- **Symbol:** `createPresignedUrl`, `PUT /api/upload/[fileId]`, `buildBlobPath`
- **Evidence:**
  - `upload.presign` accepts `siteId: z.string().optional()` and stores it (`upload.service.ts:34-44`). No `checkSiteRole` runs anywhere on the path.
  - The PUT route checks only `pending.userId === session.user.id` (`:44`).
  - It then writes to `sites/${siteId}/favicon|touch-icon|og-image${ext}` with `addRandomSuffix: false, allowOverwrite: true` (`:67-75, 89-91`).
  - The key is predictable, and the site id is public inside the published favicon or og URL.
  - `favicon` accepts `image/svg+xml` (`UPLOAD_LIMITS`).
  - PoC 4 confirms the foreign `siteId` is stored.
  - Compare `api/site-thumbnail/[siteId]`, which authorizes before `put` and says why in its comment (`:44-55`).
- **Expected behavior:** Site-context uploads require ADMIN (or EDITOR) on that site. Blob keys are not guessable.
- **Root cause:** `siteId` is treated as a label, not as a resource to authorize.
- **Affected modules:** Site settings (SEO and favicon), published sites, social previews.
- **Recommendation:**
  - Authorize `siteId` at presign and again at PUT.
  - Reject `siteId` for non-site contexts.
  - Use `addRandomSuffix: true` and store the returned URL.
  - Also sanitize `fileName` for `site_media` and `ticket` keys (`:92-93`), which are user-controlled.
- **Status:** VERIFIED (code plus unit PoC). The Vercel Blob overwrite semantics are NOT RUNTIME VERIFIED.

### A19-4 — P0 — IMMEDIATE FIX REQUIRED: `media.createAsset` + `media.deleteAsset` can permanently delete another tenant's blob
- **Severity:** P0 (unauthorized delete).
- **File:**
  - `server/services/media.service.ts:53-80` (`assertUrlNotOwnedByOther`)
  - `:135-170` (`createAsset`)
  - `:320-365` (`deleteAsset` → `del`)
  - `packages/shared/schemas/media.ts:57` (`url: z.string().url()`)
- **Symbol:** `createAsset`, `deleteAsset`
- **Evidence:**
  - `createAsset` accepts any URL. The only cross-tenant guard looks for the URL in `MediaAsset`/`MediaAssetVersion` rows owned by someone else.
  - These blobs are written with `put()` and **never** get a `MediaAsset` row:
    - favicon, og and touch-icon: `api/upload/[fileId]`;
    - site thumbnails: `api/site-thumbnail/[siteId]`;
    - avatars and workspace icons.
  - So `createAsset({url: <victim favicon URL>})` passes.
  - Then `deleteAsset` counts the remaining refs, finds 0, and calls `del(asset.url)` (`:339-352`).
- **Expected behavior:** A user can only delete blobs this server issued to that user.
- **Root cause:** Blob ownership is inferred from DB rows that only one of the three upload paths writes.
- **Affected modules:** Media library, site settings, dashboard thumbnails, avatars.
- **Recommendation:** Let `createAsset` accept only URLs recorded at token issue (`/api/asset-upload` token payload) for that user, or only paths under a per-user prefix. Never `del()` a URL outside that prefix.
- **Status:** VERIFIED in code. NOT RUNTIME VERIFIED against Blob.

### A19-5 — P0 — IMMEDIATE FIX REQUIRED: an anonymous `auth.signup` deletes any unverified user together with all their workspaces and sites
- **Severity:** P0 (data loss through an unauthenticated call).
- **File:**
  - `server/services/auth.service.ts:152-181` (`signup` reclaim)
  - `:96-150` (`login`, which has no `emailVerified` check)
  - `server/trpc/routers/auth.ts:84` (`signup`, public, 10 per 15 min per IP; see A19-12)
- **Symbol:** `signup`, `login`
- **Evidence:**
  - The reclaim branch runs `tx.workspace.deleteMany({where:{ownerId: existing.id}})` then `tx.user.delete` whenever `existing.emailVerified` is null (`:173-180`).
  - `Site.workspace` is `onDelete: Cascade` (`schema.prisma:~415`).
  - The code comment claims "whoever signs up still has to prove control of the inbox before the account does anything". That is false:
    - `login()` never reads `emailVerified`;
    - no middleware, layout, router or `create-session` path reads it either (`grep emailVerified` across `server`, `packages/dashboard/app` and `middleware.ts` finds only auth.service and auth.config).
  - Prod SMTP has failed before (CLAUDE.md, SMTP_PASS_B64), and `signup` deliberately keeps accounts whose verification mail failed (`:195-208`). A population of active, unverified users is therefore expected.
  - PoC 5 passes: login succeeds while unverified, and a second signup deletes the owner's workspaces and user row.
- **Expected behavior:** An account that has been used is never deleted by an unauthenticated request.
- **Root cause:** Two policies contradict each other: "unverified = unclaimed, reclaimable" and "unverified can use the product".
- **Affected modules:** Auth, workspaces, sites, and every member of the victim's workspaces.
- **Recommendation:** Pick one policy (product decision 1):
  - either gate login (and `create-session`) on `emailVerified`;
  - or reclaim only accounts that have never logged in and own no sites.

  Never cascade-delete workspaces that contain other members.
- **Status:** VERIFIED (unit PoC with the real service). Not run against a DB.

### A19-6 — P0 — IMMEDIATE FIX REQUIRED: an EDITOR can forge the client's approval and bypass the publish-approval gate
- **Severity:** P0 (unauthorized publish; forged sign-off record).
- **File:**
  - `server/trpc/routers/reviews.ts:58-79`
  - `server/services/review.service.ts:92-123`
  - `server/services/client-review.service.ts:184-215, 273-296`
  - `server/trpc/routers/client-review.ts:95-127`
  - `server/services/publish.service.ts:262-300`
- **Symbol:** `submitReview`, `identifyReviewer`, `resolveReviewByToken`, `startPublish`
- **Evidence:**
  1. `reviews.submit` (EDITOR) takes a caller-chosen `clientEmail`, mints the token, and **returns `token`** to the caller (`review.service.ts:123`).
  2. `clientReview.identify` accepts exactly that email (`normalised === review.invitedEmail`).
  3. `clientReview.resolve` sets `status: "APPROVED"`.
  4. `startPublish` reads the latest non-revoked review. Seeing APPROVED, it lets the EDITOR publish.

  - The internal `reviews.resolve` refuses a self-resolve, but the client path has no equivalent.
  - The approval gate is described as "the real control" for DESIGNER and EDITOR publish (`sites.ts:318-324`).
  - `acknowledgeStale` also lets the same EDITOR ship edits made after approval.
- **Expected behavior:** Someone other than the submitter approves, and the submitter cannot obtain a signing credential for a reviewer identity they invented.
- **Root cause:** The review token is a bearer credential handed to the party being reviewed. Reviewer identity is only "typed the invited address".
- **Affected modules:** Reviews, client review page, publish, audit trail.
- **Recommendation:**
  - Do not return the token to non-admins.
  - Reject a `clientEmail` that belongs to a workspace member or to the submitter.
  - Record `issuedById` and refuse approvals where the reviewer email equals the submitter's.
  - Decide whether EDITORs may `acknowledgeStale` (product decision 3).
- **Status:** VERIFIED in code. End-to-end NOT RUNTIME VERIFIED (it needs `agency_layer` on and `editsRequireApproval` true).

### A19-7 — P0 — IMMEDIATE FIX REQUIRED: demoting a site-scoped member leaves their per-site `roleOverride` in place (confirms A07-1)
- **Severity:** P0 (permission bypass).
- **File:**
  - `server/services/team.service.ts:135-166`
  - `server/services/permission.service.ts:113-115`
  - `server/trpc/routers/auth.ts:305-316`
  - `server/services/sites.service.ts:273-283`
- **Symbol:** `changeRole`, `getEffectiveSiteRole`
- **Evidence:**
  - `changeRole` writes only `workspaceMember.role`.
  - `getEffectiveSiteRole` returns `row?.roleOverride ?? member.role`.
  - Invite acceptance writes `roleOverride: invite.role` for every scoped invite, and site transfer writes `roleOverride: "EDITOR"`.
  - I independently confirmed A07-1 on every line cited.
- **Expected behavior, root cause, affected modules, recommendation:** As in A07-1. The fix is to clamp or clear the overrides on role change and on suspend, and to surface them in the Team UI.
- **Status:** VERIFIED in code (the `permission-service` test asserts that the override wins).

---

## Findings — P1

### A19-8 — P1: `ai.summarize` and `ai.milestoneSuggest` call OpenAI with no quota and no input bound
- **File:**
  - `server/trpc/routers/ai.ts:67-86` (schema), `:233-271`
  - `server/services/ai.service.ts:345-380, 408+`
- **Evidence:**
  - Every other generating procedure calls `reserveAiUnit`/`reserveQuota` (`:161, 186, 211, 298, 383`). These two call the provider directly.
  - `changes[].before/after/property` are `z.string()` with no `.max`. The service interpolates the first five into the prompt.
  - There is no rate limit. Any logged-in user can call them, and signup plus an unverified login is free (A19-5).
  - Provider error messages are passed through to the client (`message: err.message`).
- **Expected:** Metered, rate-limited and bounded like `ai.content`.
- **Root cause:** Quota was added per procedure, not as middleware.
- **Recommendation:** Add an `aiProcedure` middleware that reserves quota, and cap string lengths.
- **Status:** VERIFIED in code.

### A19-9 — P1: email-bound grants trust an address the user never proved
- **File:**
  - `server/trpc/routers/auth.ts:283-293` (`acceptInvite`)
  - `server/services/workspace-transfer.service.ts:60-66` (`acceptTransfer`)
  - `server/services/auth.service.ts:337-365` (`verifyMagicLink`), `:219-250` (`verifyEmail`)
- **Evidence:**
  - These grants compare `user.email` to the invited address, but a password account's email is unproven until it is verified, and unverified accounts can log in (A19-5).
  - **Pre-account hijack.** An attacker registers `victim@corp` with their own password, and optionally enables 2FA. When the victim later signs in with a magic link, `verifyMagicLink` just sets `emailVerified` on the attacker-created row. It keeps the password and does not bump `sessionVersion`, so the attacker retains access.
  - A token-holding third party can satisfy invite and transfer email binding the same way. Workspace transfer grants **OWNER**.
- **Recommendation:**
  - Require `emailVerified` in `acceptInvite` and `acceptTransfer`.
  - When a never-verified account is first verified through a magic link or verify link, clear `passwordHash`, disable 2FA, and bump `sessionVersion`.
- **Status:** VERIFIED in code.

---

## Findings — P2

### A19-10 — P2: site scoping is not applied to workspace-wide lists
- **File:** `server/services/sites.service.ts:47-57`; `routers/sites.ts:60-66`
- **Evidence:** `listSites` filters by `workspaceId` and `deletedAt` only. A member limited by `SitePermission` rows to one site sees every site's name, status, domains and visitor counts.
- **Unchecked:** the same probably applies to `dashboard.stats/recentSites`, `siteDetail.domains.listForWorkspace` and `siteComponents.workspaceList`, which also resolve only the workspace. I did not trace each one, so they are NOT VERIFIED.
- **Recommendation:** A `scopedSiteWhere(member)` helper, applied to every workspace-level read.
- **Status:** VERIFIED for `listSites`; PARTIAL for the rest.

### A19-11 — P2: the share-link password gate and the workspace sharing policy do not protect anything (confirms A07-8)
- **File:**
  - `packages/dashboard/app/share/[token]/page.tsx:45-53`
  - `app/api/share/[token]/verify-password/route.ts:85-94`
  - `server/services/share-link.service.ts:21-29`
  - `prisma/schema.prisma:1228-1239`
- **Evidence:**
  - The destination is the public `publishedUrl`, and the page comment admits it.
  - The bypass cookie is the literal `share_<token>=1`, which is unsigned, so any visitor can set it.
  - `WSSharingSettings.requirePw` and `defaultExpiration` are read nowhere in `server/`.
  - `allowEditors === false` blocks only `member.role === "EDITOR"`. A DESIGNER, or a VIEWER with an EDITOR override, still creates links.
- **Recommendation:** Enforce the policy server-side using the effective site role. Either make the password real (a signed cookie plus deployment protection) or stop presenting it as protection (product decision 4).
- **Status:** VERIFIED in code.

### A19-12 — P2: IP rate limits trust the client's `X-Forwarded-For`
- **File:**
  - `server/trpc/trpc.ts:146-148`
  - `server/trpc/routers/auth.ts:31-32`
  - `app/api/share/[token]/verify-password/route.ts:20`
  - `app/api/public/forms/[siteId]/[formBlockId]/route.ts:17`
  - `app/api/public/track/[siteId]/route.ts:27`
- **Evidence:**
  - All seven reads take `split(",")[0]`. If the proxy appends to the header, that first entry is whatever the client sent.
  - These limits protect:
    - login-failure and captcha triggering (`auth.ts:53-65`);
    - `strictRateLimit` (2FA, reset, magic link);
    - share-password guessing;
    - client-review identify and resolve;
    - form spam.
  - 2FA is additionally capped per temp token (`auth.service.ts:374-383`), and login per account.
- **Recommendation:** Derive the client IP from the right-most trusted hop, or from a platform header.
- **Status:** PARTIAL. The code is verified, but LiteSpeed's forwarding behaviour is NOT RUNTIME VERIFIED.

### A19-13 — P2: `account.integrations.list` returns full integration configs to any member
- **File:**
  - `server/trpc/routers/account.ts:275-278`
  - `server/services/integrations.service.ts:16-20`
  - `routers/integrations.ts:84-91` (the config shape)
- **Evidence:**
  - There is no role check, and `findMany` returns every column.
  - `config` holds webhook URLs (bearer secrets for Slack-style hooks) and the Vercel `encryptedToken`, which is ciphertext but should never leave the server.
  - Only `add`, `remove`, `update` and `testEvent` are ADMIN-gated.
- **Recommendation:** Gate on ADMIN, or return a redacted projection.
- **Status:** VERIFIED in code.

### A19-14 — P2: collab endpoints are live in production with unvalidated, unbounded ops, and authorize only at connect (confirms A16-6, A16-11 and A07-9)
- **File:** `app/api/collab/[siteId]/ops/route.ts:13-35`; `app/api/sse/collab/[siteId]/route.ts:17-24`
- **Evidence:**
  - Neither route checks `FEATURE_COLLAB`.
  - `body.op` is persisted as opaque JSON with no size cap, and there is no rate limit.
  - The payload `userId` is client-chosen.
  - The SSE loop never re-checks the role.
  - Peers import `sync_response` projects, so this is also an A19-1 delivery channel.
- **Recommendation:** Flag-gate server-side now. Add a Zod `CollaborationEvent` schema, a byte cap and a per-user rate limit. Bind `userId` to `authorId`. Re-check the role every N polls.
- **Status:** VERIFIED in code. D owns the runtime analysis.

---

## Findings — P3

- **A19-15 — Plan limit read from the wrong workspace.**
  - Where: `site-detail.ts:169-172, 237-240`.
  - `workspaceMember.findFirst({where:{userId}})` has no `workspaceId` or `status`, so a user with a paid workspace applies that plan's redirect limits to a FREE workspace's site.
  - Fix: use `site.workspaceId`. VERIFIED.
- **A19-16 — Bearer scope dropped by the guards.**
  - Where: `guardSiteAccess`/`guardSiteRole` (`guards.ts:12-43`) and every direct `checkSiteRole`/`assertSiteAccess` call.
  - None of them passes `ctx.bearer`, which `trpc.ts:122-125` says downstream handlers must do.
  - It is latent because there are no `scopedProcedure` consumers (`grep`). Fix it before the first one ships. VERIFIED.
- **A19-17 — Share-link secrets reach VIEWERs.**
  - Where: `listShareLinks` (`share-link.service.ts:5-10`).
  - It returns `passwordHash` and live `token`s to any member, VIEWER included (`site-detail.ts:397-407`). VERIFIED.
- **A19-18 — Publish SSE authz is too loose.**
  - Where: `api/sse/publish/[jobId]/route.ts:42-54`.
  - The membership check omits `status: "ACTIVE"` and site scope.
  - It streams the full `PublishBuildJob` row, including `log` (`{pages:{path,html}[]}`, `schema.prisma:1402-1405`). `sites.publishStatus` returns the same row after `assertSiteAccess`.
  - Fix: strip `log` from both. VERIFIED.
- **A19-19 — `siteDetail.domains.check` acts before it authorizes.**
  - It calls `checkDomainDns(input.id)` (DNS lookups plus `dnsRecord.update`) *before* comparing `result.siteId` to the authorized `siteId` (`site-detail.ts:305-307`).
  - An authenticated user can refresh verification state on another tenant's domain. The impact is low. VERIFIED.
- **A19-20 — Small role, abuse and hygiene gaps.** All VERIFIED in code.
  - `sites.duplicate` checks EDITOR on the *source* site but not the destination workspace role (`sites.ts:113-132`). A VIEWER can create sites.
  - `templates.generate.create` has no role check (`templates.ts:94-107`). A VIEWER consumes the workspace AI monthly budget.
  - The `workspace_icon` upload context has no role check, so any member replaces the workspace icon.
  - `sites.getScheduledPublish` does not translate `PermissionError`, so the answer is a 500 (`sites.ts:455`).
  - `reviews.submit` sends a Buildrick-branded email with an EDITOR-controlled `note` to any address, with no throttle.
  - `comments.create` has no throttle.
  - `public/track` stores unbounded `path`/`referrer` strings with CORS `*`.
  - AI provider error text is echoed to clients (`ai.ts:246, 266, 400`).
- **Mentions:** not implemented anywhere (see inventory §5), so there is no mention-abuse surface today. The "mentions" notification filter is an IA issue (Agent B).

---

## Good as-is (verified in code)

- **Bearer tokens.** `protectedProcedure` denies bearer tokens by default, and an invalid bearer fails the whole request closed (`trpc.ts:31-39, 105-121`). Tokens are stored as SHA-256 hashes (`api-token.service.ts:44`).
- **Session revocation.** `sessionVersion` is re-checked on every `auth()` (`auth.config.ts:170-194`). Revoke, delete-member and password reset all bump it. `resolveWorkspaceId` re-checks ACTIVE membership on every request, and permission checks require `status: "ACTIVE"`.
- **OAuth.** The provider email must be verified (`auth.config.ts:53-62`). A public OAuth login does not auto-link into a password account (`:88-90`). The workspace switch is validated against memberships (`:139-151`).
- **`create-session`.** It enforces an exact same-origin CSRF check, uses a single-use 5-minute `session_grant`, and caps sessions at 10.
- **Team routes.** All require ADMIN and scope the member id to the workspace. Promotion to OWNER is impossible (`changeRoleSchema`). No self-demote, no self-revoke, and the owner is protected.
- **Client review.** The token is resolved server-side and never accepts a `siteId` from input. `listClientComments` uses a concrete `reviewerId` filter. Round supersession revokes old tokens.
- **Scoped writes elsewhere.** CMS collections and entries, site versions and site components are scoped by `(siteId, id)`, and so is `setPrimaryDomain`. Redirect, domain, share and submission mutations look up the row's `siteId` before authorizing.
- **Media library.** Rows are per-user, folder ownership is checked, and the `/api/asset-upload` token flow re-validates quota, size, MIME and folder.
- **Site thumbnails.** The route authorizes before `put`.
- **Outbound webhooks.** The SSRF guard runs at connect and at delivery, with `redirect: "error"`.
- **Cron and worker auth.** Timing-safe and fail-closed.
- **Stripe webhook.** HMAC verification. Not deep-audited here.
- **Site settings.** `publishedPassword` is redacted in `getSiteSettings`.
- **Review, preview and compare iframes.** All use `sandbox=""` (`review-client.tsx:69-70`, `PreviewOverlay.tsx:105-107`, `ApprovedCompareView.tsx:162`). Template previews omit `allow-scripts`.
- **2FA.** Capped at 5 attempts per temp token. The login lockout runs before bcrypt, and `checkEmail` returns only `exists`.
- **Agency layer.** Enforced server-side (`requireAgencyLayer`), not just by the client redirect.
- **Secrets.** No secrets are committed: the `whsec_`/`sk_live_` hits are fixtures or placeholder docs.

---

## Product decisions required

1. **Unverified accounts (A19-5, A19-9).** May a password account use the product before verifying its email? If yes, the "reclaim unverified address" behaviour must stop deleting data. If no, gate login and `create-session`.
2. **Client approval identity (A19-6).** Is "someone who can type the invited address" an acceptable signer? May the submitter see the token or choose the invited address?
3. **Stale approvals.** Should an EDITOR be able to `acknowledgeStale` and ship edits made after sign-off, or only ADMIN and OWNER?
4. **Share-link passwords (A19-11).** Real protection (Vercel deployment protection or a signed gate) or relabel? Should `requirePw` and `defaultExpiration` be enforced?
5. **VIEWER data access.** VIEWERs can currently read form submissions (PII), share tokens, integration configs and billing overview. Confirm which of these the VIEWER role is meant to see.
6. **Role model (A19-7 / A07-1).** Is `roleOverride` a cap, a grant, or both? Clamp on demotion, or clear?

---

## Overlaps with other audits

- **D (collab):** A19-14 confirms A16-6, A16-11 and A07-9, and adds that collab `sync_response` is a delivery channel for A19-1. A07-1 is confirmed as A19-7.
- **E (architecture):**
  - Authz is duplicated and inline (`sites.ts` folders, `site-detail.ts` plan lookups, `dashboard.ts`, `api-tokens.ts`, `integrations.ts`). This is the root of A19-15.
  - Quota is enforced per procedure instead of by middleware (A19-8).
  - There are three blob write paths with three ownership models (A19-3 and A19-4).
- **G (tests):** No test covers any of these:
  - a foreign `pageId` (A19-2);
  - presign authz (A19-3);
  - `createAsset` with a non-library URL (A19-4);
  - unverified login plus the reclaim cascade (A19-5);
  - submitter self-approval (A19-6);
  - demotion with overrides (A19-7);
  - a `tagName`/`srcdoc` sanitizer allowlist (A19-1).
- **B (IA):** The "Mentions" filter maps to security and payment notifications, and mentions are not implemented.
- **Ops:** `CRON_SECRET` is required for the self-invoked publish and AI workers. Cron coverage on cPanel is still unverified (inventory §5).

---

## AUDIT HANDOFF

- **Agent / Prompt:** F, Security & Permissions / Prompt 19: Security, Authorization & Permission Boundaries
- **Report:** `docs/audits/2026-09-25-full-audit/19-security-permissions.md`
- **Counts:** P0 = 7 · P1 = 2 · P2 = 5 · P3 = 6
- **P0 (all IMMEDIATE FIX REQUIRED):**
  - A19-1: stored XSS in the editor canvas. `tagName` is emitted raw, `srcdoc` is allowed, and components, templates and versions are unsanitized. An EDITOR can escalate to OWNER.
  - A19-2: `pages.update` and `pages.delete` cross-tenant IDOR.
  - A19-3: `upload.presign` has no site authz, so any user can overwrite any site's favicon, og or touch-icon blob.
  - A19-4: `media.createAsset` + `deleteAsset` delete another tenant's untracked blobs.
  - A19-5: an anonymous signup deletes an unverified user and their workspaces, and unverified users can log in.
  - A19-6: an EDITOR can self-approve through the client-review token and bypass the publish-approval gate.
  - A19-7: demotion keeps the per-site `roleOverride` (confirms A07-1).
- **P1:**
  - A19-8: unmetered and unbounded `ai.summarize` / `ai.milestoneSuggest`.
  - A19-9: unverified email trusted for invite and transfer binding; pre-account hijack through a magic link.
- **P2:**
  - A19-10: site scope not applied to `listSites` or the other workspace lists.
  - A19-11: cosmetic share-password gate and unenforced sharing policy.
  - A19-12: rate limits keyed on a spoofable `X-Forwarded-For`.
  - A19-13: integration configs readable by VIEWERs.
  - A19-14: collab routes are live, unvalidated, and authorize only at connect.
- **P3:** A19-15 to A19-20.
- **Runtime verified (unit level, real modules, no DB or browser):**
  - A19-1, up to the HTML string injected into the canvas;
  - A19-2, service writes on a foreign page;
  - A19-3, the foreign `siteId` is accepted at presign;
  - A19-5, unverified login and the reclaim cascade calls;
  - the existing permission, page, upload and client-review suites: 41/41 pass.
- **NOT runtime verified:**
  - browser execution of A19-1;
  - Blob overwrite and delete semantics (A19-3, A19-4);
  - the end-to-end self-approval publish (A19-6);
  - proxy `X-Forwarded-For` behaviour (A19-12);
  - the other workspace-list endpoints under A19-10;
  - anything needing Postgres.
- **Blocking dependencies:**
  - A19-5 and A19-9 need product decision 1.
  - A19-6 needs decisions 2 and 3.
  - A19-7 needs decision 6.
  - A19-11 needs decision 4.
- **Fix ordering hints:**
  1. A19-2, A19-3 and A19-4 are small, local and independent. Ship them first.
  2. A19-1: add the server `sanitizeBlocks` tag and attribute allowlist, extend it to components, templates and versions, then the client `importProject`/`getTagName` check.
  3. A19-5: gate login on verification, or narrow the reclaim.
  4. A19-7 (with A07-1).
  5. A19-6.
  6. A19-8 (AI middleware).
  7. A19-14 (flag-gate the collab routes) can land with D's A16-6 fix.
- **Required tests (for G):**
  - a foreign `pageId` → NOT_FOUND;
  - presign with an unauthorized `siteId` → FORBIDDEN;
  - `createAsset` with a URL not issued to the user → rejected;
  - `sanitizeBlocks` drops a disallowed `tagName` and `srcdoc`;
  - `Composer.importProject` → `toHTML` never emits an unlisted tag;
  - an unverified user cannot log in, **or** signup does not delete an account that has logged in;
  - the review submitter cannot approve their own round through the client path;
  - `changeRole` clamps the overrides;
  - `summarize` reserves quota.
