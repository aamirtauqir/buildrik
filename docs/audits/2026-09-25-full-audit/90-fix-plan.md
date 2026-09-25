# 90: Fix-Batch Plan (Prompt 29, plan only)

Agent A (Orchestrator) · 2026-09-25 · READ-ONLY. **No code has been modified.**

Inputs: `00-inventory.md`, the 20 audit reports `01`–`20`, `PLAYBOOK.md`, and the adversarial verifier verdicts on every P0 raised by the audits. I also re-read four of the P0 code sites myself: `server/services/page.service.ts:95-129`, `permission.service.ts:113-115`, `auth.service.ts:155-182`, and `api/upload/[fileId]/route.ts:73-74`. The code at each site matches what the audit describes.

**Runtime status of this plan.** No finding in any report was reproduced in a running app. There was no Postgres, no browser, no Vercel Blob and no second client. The evidence is code reading plus unit-level PoCs, jsdom probes and existing vitest suites. Every fix below therefore needs its own runtime check before anyone calls it done (CLAUDE.md §"Work against a stated goal").

---

## 1. Executive summary

- **Raw input.** The 20 reports contain 364 findings: 15 P0, 54 P1, 162 P2 and 133 P3.
- **After merging.** Duplicates and symptoms were grouped under shared root causes, which reduces the set to **75 fixes**. Each fix has one root cause, and the eight dominant root-cause families are listed at the end of this section:
  - Batch S (security and data integrity, first regardless of audit): **12**
  - Batch A (product structure, audits 1–7): **22**
  - Batch B (UX and system, audits 8–13): **17**
  - Batch C (functional, audits 14–16): **9**
  - Batch D (engineering, audits 17–20): **15**
- **Verified P0s: 6.** All six are server-side authorization or integrity holes found by audit 19. Five were CONFIRMED by the adversarial verifier. The sixth (role-override demotion) was CONFIRMED on A19-7 and downgraded on its duplicate A07-1, so its severity **needs a human check**. It stays P0 here because one verifier confirmed it and the two findings describe the same mechanism.
- **Downgraded: 9 P0 claims → 5 root causes.** None was refuted. The mechanisms were real in every case; the verifiers disputed only the severity class. The biggest of these is the site-settings mirror (A01-2 = A02-1 = A12-1 = A16-1). It is now **P1**, but it is still silent data loss in production, so it is the first fix in Batch A and runs right after Batch S.
- **Product decisions: 46** (§5), merged from the 20 reports' decision lists. They gate or shape 48 of the 75 fixes. Four of them sit on the P0 path: PD-2, PD-5, PD-6 and PD-24.
- **The eight dominant root-cause families**, by how many findings each explains:
  1. **Two sources of truth with only one writer checked.**
     - Site settings: editor `projectSettings` vs the Site columns.
     - Role: `WorkspaceMember.role` vs `SitePermission.roleOverride`.
     - Brand tokens: `projectStyles` vs `designTokens` vs localStorage.
     - Lock: the Layers set vs the element flag.
     - Media owner: user vs site.
  2. **Authorize one id, write another.** `pages.update/delete`, upload `siteId`, blob delete, `domains.check`, plan limits read through an arbitrary membership.
  3. **Denylist sanitization plus a same-origin `innerHTML` canvas.**
  4. **UI built ahead of enforcement.** Sharing policy, page passwords, Review doors with `agency_layer` off, Mentions, Localization, Trash.
  5. **Global capture-phase keyboard with no surface or modal ownership.**
  6. **Parallel implementations never retired.** Three palettes, two settings UIs, two template catalogs, two insert pipelines, twelve dialog shells, and unused chrome-ui shell primitives.
  7. **Split publish lifecycle.** The worker route and `completePublish` diverge, publish trusts client-supplied HTML, and server-initiated publish is impossible.
  8. **A test tier that cannot see these bugs.** There is no DB-backed test, no real editor E2E, and 19 of 33 routers are untested.
- **Live co-editing (flag-off)** has at least 11 independent correctness defects (A16-2..7, A07-2..5). The recommendation is a **product decision before any code**: replace the engine or patch it. The only code change proposed now is a server-side kill switch plus op validation (S-12), because the collab **routes are live in production** whatever the client flag says.

---

## 2. Verified P0 list — P0 · IMMEDIATE FIX REQUIRED

| # | Finding(s) | Title | Primary file:line | Verifier | Evidence class |
|---|---|---|---|---|---|
| P0-1 | A19-1 | Stored XSS in the editor canvas: `tagName` is never validated, `srcdoc` is kept, and components, templates, versions and collab ops are never sanitized on the server. A site EDITOR's script runs as the next OWNER or ADMIN who opens the editor. | `lib/sanitize-blocks.ts:23-57`; `packages/editor/src/engine/elements/ElementSerialization.ts:64-80`; `Element.ts:116-120`; `editor/canvas/Canvas.tsx:720`; `packages/dashboard/next.config.mjs:10-16` | CONFIRMED_P0 | Unit PoC up to the canvas HTML string. Browser execution NOT RUNTIME VERIFIED. |
| P0-2 | A19-2 (also A02-19) | Cross-tenant page overwrite and delete (IDOR): authz checks `input.siteId`, but the write targets `input.pageId`. | `server/trpc/routers/pages.ts:55-69`; `server/services/page.service.ts:95-129` (re-read for this plan; no `existing.siteId` check) | CONFIRMED_P0 | Unit PoC with the real service, mocked Prisma. |
| P0-3 | A19-3 | Any signed-in user can overwrite any site's favicon, touch-icon or og-image. `siteId` is never authorized at presign or PUT, and the blob key is predictable (`addRandomSuffix:false, allowOverwrite:true`). | `server/trpc/routers/upload.ts:8-18`; `server/services/upload.service.ts:22-47`; `packages/dashboard/app/api/upload/[fileId]/route.ts:67-95` | CONFIRMED_P0 | Unit PoC. Blob overwrite semantics NOT RUNTIME VERIFIED. |
| P0-4 | A19-4 | Cross-tenant blob deletion: `media.createAsset` accepts any URL, and `deleteAsset` calls `del()` once the ref count is 0. Favicon, thumbnail and avatar blobs have no `MediaAsset` row, so they are unprotected. | `server/services/media.service.ts:53-80, 135-170, 320-365`; `packages/shared/schemas/media.ts:57` | CONFIRMED_P0 | Code only. Blob NOT RUNTIME VERIFIED. |
| P0-5 | A19-5 (policy root shared with A19-9) | An anonymous `auth.signup` deletes an unverified user and every workspace they own (cascade to sites), even though unverified users can log in and use the product. | `server/services/auth.service.ts:152-181` (re-read), `:96-150` (`login` has no `emailVerified` check); `server/trpc/routers/auth.ts:84` | CONFIRMED_P0 | Unit PoC. Not run against a DB. |
| P0-6 | A19-7 = A07-1 | Demoting a member leaves their `SitePermission.roleOverride` in place, and the resolver prefers it. A member demoted to VIEWER keeps EDITOR on their sites: save, publish, share, collab ops. | `server/services/team.service.ts:135-166`; `permission.service.ts:113-115` (re-read); `server/trpc/routers/auth.ts:305-316`; `sites.service.ts:272-284` | A19-7 CONFIRMED_P0 / A07-1 REAL_BUT_DOWNGRADE→P1. **Severity needs human check** (verifiers split). | Code, plus an existing test asserting that the override wins. |

**Possible P0, not raised to P0 (needs human check):** `peekRateLimit` compares times in JS in a way that depends on the Postgres `TimeZone` setting (A20-5). If production runs with a negative UTC offset, this becomes a login-throttle bypass. The production DB `TimeZone` was NOT VERIFIED. It is tracked in S-11.

**Becomes P0 on a flag flip (NEXT_PUBLIC_FEATURE_COLLAB):**
- A16-2: wrong-element writes.
- A16-5: snapshot storm.
- A16-6: `Object.prototype` pollution.
- A07-2: replay from seq 0.
- A06-9: remote op erases local edits.

The production flag value was NOT VERIFIED. `check-baked-flags.mjs` asserts only flags that must be ON.

---

## 3. Dependency order and fixes that invalidate other findings

### Recommended execution order
1. **Phase 0, enablers (cheap, unblock verification).**
   - D-15a: fix the 4 red drift tests, so the suite is green and regressions become visible.
   - D-14a: stand up a minimal DB-backed test tier. This is a product decision (PD-24); it is required to test S-2, S-5, S-6 and A-2 honestly.
2. **Batch S in this order:**
   - S-2 (small, isolated);
   - S-6;
   - S-5;
   - S-3 and S-4 as one design;
   - S-1 (allowlist half first);
   - then S-7 to S-12.
3. **Batch A data-integrity head:**
   - A-2 (atomic save), then A-1 (settings mirror), then A-4 (undo scope);
   - A-3 (theme push);
   - then the rest of A.
4. **Batch B, then C, then D.** Exceptions:
   - C-1 must follow S-8.
   - D-1 must land with S-10's log stripping.
   - D-7 waits for the S-1 long-term decision.
   - D-8 follows A-2.

### Fixes that change or invalidate other findings
| Fix | What it changes | Consequence for planning |
|---|---|---|
| S-1, long-term option: render the canvas in a sandboxed iframe | Changes the render path behind A18-1, the canvas keyboard model (A04-1, A06-12, A13-3) and overlay geometry (A04-5, A04-7) | Ship the allowlist (S-1a) now. Decide the iframe separately (PD-2). Re-audit A18-1 and the canvas keyboard findings after that decision. |
| S-3 unguessable blob keys | Existing favicon and og URLs change; published sites keep the old URLs until republish. S-4's prefix-ownership check depends on the key scheme. | Design S-3 and S-4 together. Store the returned URL. Plan a migration for existing rows. |
| S-5 if PD-5 chooses "gate login on `emailVerified`" | Existing unverified users are locked out. SMTP has failed in prod before, so this may be a large population. It also interacts with invite-email swallowing (A12-5). | Ship the minimal non-destructive reclaim first, with no decision needed. Gate login only after B-5 (invite and email failure surfacing) and a resend path. |
| S-6 clamp overrides | Agency client invites use overrides as grants. Clamping may reduce access that someone intended to give. It also changes A07-20's behaviour. | Needs PD-6 (what an override means). A-10 follows S-6. |
| S-8 before C-1 | Fixing A14-1's transport makes the unmetered `ai.summarize/milestoneSuggest` reachable from the UI for every user | **C-1 is blocked on S-8.** |
| S-10 strip `log` from the SSE and `publishStatus` | D-1 will *retain* `log` payloads for rollback (PD-18). Without S-10, that retention widens the A19-18 exposure. | Land S-10 before or with D-1. |
| S-12 server kill switch for collab | If any environment actually has collab on (NOT VERIFIED), it goes off | Confirm the baked flag value first. Add an "must be OFF" assert to `gate:baked-flags`. |
| A-1 settings mirror + PD-1 settings owner | If the editor stops writing Site columns on autosave, A02-2 and A12-2 disappear, and A06-2's server write-back disappears (the local undo revert remains). If one settings surface is deleted (A-12), A12-7 may disappear with it. | Take PD-1 before A-12. A-1's diff-only mirror is needed either way. |
| A-2 atomic CAS | Races that previously succeeded silently now return `SAVE_CONFLICT`. Without client single-flight and suspend-on-conflict, users see *more* conflict modals (A12-4, A12-15, A16-15). | Ship server CAS and the client single-flight autosave in one release. |
| A-4 undo scope | After A-1 goes diff-only, an undo that reverts settings would still be a "change" and would still be mirrored | Land A-4 with or immediately after A-1. |
| A-8 comments and review gating | Hiding the Review doors when `agency_layer` is off removes A03-1, and shrinks A15-1 and A07-7 to the decision itself | A-8 follows PD-7 and PD-8. |
| A-11 media scope → workspace or site | Changes S-4's ownership semantics, and A05-3 and A05-4 search behaviour | S-4 uses an issued-URL registry, which works whatever the scope; do it first. |
| C-5 collab engine decision (replace) | Makes A16-2..7, A07-2..5, A07-10..13, A18-9, A11-13, A11-15, A13-15 and A10-13 moot | **Do not fix those individually.** Only S-12 lands now. |
| D-15 fixing the red and source-scan tests | Some suites pin defects as intended behaviour: A08-6 "Bring Forward" order test, A14-6 stale "not wired" copy, A03 palette labels | Each defect fix must update the pinning test in the same change. List them in the PR. |

---

## 4. Fix table

Legend:
- **Priority** is the final severity after merging and verifier verdicts.
- **PD-n** refers to §5.
- Path prefixes: `E/` = `packages/editor/src/`, `D/` = `packages/dashboard/`, `S/` = `server/`.

### Batch S: security and data-integrity (first, regardless of audit)

| Fix ID | Root Cause | Affected Findings | Affected Files | Affected Modules | Dependencies | Risk | Fix Strategy | Required Tests | Priority |
|---|---|---|---|---|---|---|---|---|---|
| S-1 | Denylist sanitizers; `tagName` trusted; same-origin `innerHTML` canvas; some stores never sanitized on the server | A19-1 (P0); the stores in A19-14 | `lib/sanitize-blocks.ts`; `E/shared/utils/html/sanitization.ts`, `sanitizationConfig.ts`; `E/engine/elements/ElementSerialization.ts`, `Element.ts`; `S/services/site-component.service.ts`, the user-template and site-version services; `D/next.config.mjs` | Canvas, pages, components, templates, versions, collab | None for S-1a. S-1b needs PD-2. | Medium: an allowlist can strip legitimate existing content. Run a dry run over prod JSON first. | **S-1a:** allowlist `tagName` (reject or replace outside `DEFAULT_ALLOWED_TAGS`) and attributes per tag, drop `srcdoc`, on the server `sanitizeBlocks` and in the client `importProject` and `getTagName`. Apply it to component, template and version payloads. **S-1b:** sandboxed-iframe canvas or nonce CSP without `unsafe-inline`. | Server and client unit tests for `srcdoc`, `<script>` tag names, and `img onerror`. Round-trip test that existing templates survive. A browser test that the payload does not execute (needs Playwright against Next). | **P0** |
| S-2 | Authz on `siteId`, write on `pageId` | A19-2 (P0), A02-19 | `S/services/page.service.ts:95-129`; `S/trpc/routers/pages.ts:55-69` | Pages, forms | None | Low | Use `updateMany/deleteMany({where:{id,siteId}})` or `existing.siteId !== siteId → NOT_FOUND`. Also consider deleting the procedures, since no client calls them (A02-19). | Foreign `pageId` rejected for update and for delete (DB tier). Router test. | **P0** |
| S-3 | Upload `siteId` treated as a label; predictable, overwritable keys | A19-3 (P0), A19-20 (`workspace_icon` has no role check) | `S/trpc/routers/upload.ts`, `S/services/upload.service.ts`, `D/app/api/upload/[fileId]/route.ts`, `packages/shared/schemas/upload.ts` | Site settings (favicon, OG), published sites, workspace icon | Design together with S-4 | Medium: URL change for existing blobs (§3) | Run `checkSiteRole(ADMIN)` at presign **and** at PUT. Reject `siteId` for non-site contexts. Role-check `workspace_icon`. Use `addRandomSuffix:true` and store the returned URL. Sanitize `fileName`. | Presign with a foreign `siteId` → FORBIDDEN. PUT re-check. Key is not guessable. Real Blob smoke test (NOT currently possible). | **P0** |
| S-4 | Blob ownership inferred from DB rows that only one of three upload paths writes | A19-4 (P0) | `S/services/media.service.ts:53-80,135-170,320-365`; `D/app/api/asset-upload/route.ts` | Media, settings, thumbnails, avatars | S-3 (key scheme) | Medium | `createAsset` accepts only URLs issued to this user by `/api/asset-upload` (record them at token issue). `del()` only inside an owned prefix. Never delete a URL outside it. | `createAsset` with a foreign favicon URL → rejected. `deleteAsset` never calls `del` outside the prefix. | **P0** |
| S-5 | Two contradictory policies: "unverified = reclaimable" and "unverified can use the product" | A19-5 (P0), A19-9 (P1) | `S/services/auth.service.ts:96-182, 219-250, 337-365`; `S/trpc/routers/auth.ts:283-293`; `S/services/workspace-transfer.service.ts:60-66` | Auth, workspaces, invites, transfer | PD-5 for the second half; B-5 before any login gate | High if login is gated (lockout); low for the minimal step | **Now (no decision needed):** reclaim only rows that have never logged in and own no site and no workspace with other members. Never cascade-delete. **A19-9:** require `emailVerified` in `acceptInvite` and `acceptTransfer`. On first magic-link or verify-link verification of a never-verified account, clear `passwordHash`, disable 2FA and bump `sessionVersion`. **Later (PD-5):** optionally gate login. | Signup over a used unverified account deletes nothing. Pre-account hijack test. Invite and transfer refuse unverified. DB tier. | **P0** (A19-9 part P1) |
| S-6 | Role stored in two places; the resolver prefers the override | A19-7 = A07-1 (P0, verifier split), A15-9 (P3 live-session part) | `S/services/team.service.ts:135-166`; `S/services/permission.service.ts:113-115`; `D/components/team/members-table.tsx` | Team, invites, transfer, every site-write gate | PD-6 (clamp or clear) | Medium: may cut access intended for agency clients | In `changeRole` and suspend, in one transaction, clamp `roleOverride` to at most the new role (or delete it, per PD-6). Also clamp in `getEffectiveSiteRole` (`min(member.role, override)`). Surface overrides in the Team UI. | VIEWER + EDITOR override after `changeRole(VIEWER)` fails `checkSiteRole(EDITOR)`. Update the existing `permission-service.test.ts:66` expectation. DB tier. | **P0 (needs human check)** |
| S-7 | The review token is handed to the party being reviewed; reviewer identity is only "typed the invited address" | A19-6 (P0→**P1**), A07-17 (part) | `S/services/review.service.ts:92-123`; `client-review.service.ts:184-296`; `S/trpc/routers/reviews.ts:58-79`; `publish.service.ts:262-300` | Reviews, client review, publish gate | PD-9, PD-10 | Low | Do not return `token` to non-admins. Reject a `clientEmail` that belongs to a workspace member or to the submitter. Record `issuedById`. Restrict `acknowledgeStale` per PD-10. | EDITOR self-approval path → refused. `submit` response has no token for an EDITOR. | **P1** |
| S-8 | Quota added per procedure, not as middleware | A19-8 (P1), A19-20 (`templates.generate` role, AI error echo) | `S/trpc/routers/ai.ts:67-86,233-271,400`; `S/trpc/routers/templates.ts:94-107`; `S/services/ai.service.ts` | AI | **Blocks C-1** | Low | Add an `aiProcedure` middleware (reserve quota plus rate limit). `.max()` on all strings. Stop echoing provider errors. Role-check `templates.generate`. | Quota is reserved on summarize and milestone. Oversize input → 400. VIEWER → FORBIDDEN. | **P1** |
| S-9 | Site scope is not applied to workspace-wide lists | A15-3 (P1), A19-10 (P2) | `S/services/sites.service.ts:47-107`; `dashboard.service` (`stats`, `recentSites`), `domains.listForWorkspace`, `siteComponents.workspaceList` | Site list, dashboard, domains, components | S-6 | Low | Apply `resolveSiteScope` to every workspace-wide list and aggregate. | A scoped member sees only scoped sites in each list (DB tier). The dashboard aggregates are NOT yet traced. | **P1** |
| S-10 | Full rows and secrets returned without role or field filtering | A19-13, A19-17, A19-18 = A18-5, A19-19, A19-15, A19-20 (the rest) | `S/services/integrations.service.ts:16-20`; `share-link.service.ts:5-10`; `D/app/api/sse/publish/[jobId]/route.ts:37-84`; `site-detail.ts:169-172,237-240,297-309,397-407`; `sites.ts:113-132,455` | Integrations, sharing, publish SSE, domains, redirects | Land before or with D-1 | Low | Role-gate integration configs and share-link rows, and never return `passwordHash`. Strip `log` from the SSE and `publishStatus`, and add `status:"ACTIVE"` plus a site-scope check. Authorize before `checkDomainDns`. Read the plan from `site.workspaceId`. Role-check `duplicate`'s destination. Translate the `getScheduledPublish` error. Throttle `reviews.submit` email and `comments.create`. Bound `public/track`. | One test per endpoint for VIEWER and scoped member. SSE payload has no `log`. | **P2** |
| S-11 | IP identity from the client-controlled leftmost XFF; peek compares times depending on the DB time zone | A19-12, A20-5 (rate limiter part) | `S/trpc/trpc.ts:146`; `S/trpc/routers/auth.ts:31`; share verify, `public/forms`, `public/track`; `S/services/rate-limiter.ts:10-69` | Login throttle, public endpoints | Confirm what LiteSpeed forwards and the prod DB `TimeZone` (**needs human check**) | Medium: a wrong hop count blocks everyone | Take the proxy-appended rightmost trusted hop. Compare in SQL (`now()`), not in JS. | Rate-limiter unit plus DB-tier tests under a non-UTC session TZ. | **P2 (possible P0; needs human check)** |
| S-12 | Collab server routes are live whatever the client flag; ops unvalidated; authz checked at connect only | A19-14, A07-9, A16-6 (P0 on flip), A16-10, A16-11 | `D/app/api/collab/[siteId]/ops/route.ts`; `D/app/api/sse/collab/[siteId]/route.ts`; `E/engine/utils/JsonPatch.ts:199-259,329-338`; `scripts/check-baked-flags.mjs` | Collab transport | C-5 decides the long term | Low | Server-side env kill switch (404 when collab is off). Zod op schema, size cap, `__proto__`/`constructor`/`prototype` key guard, rate limit. Re-check the role per poll. Lifetime cap and heartbeat on the stream. Assert COLLAB is OFF in `gate:baked-flags`. | Pollution PoC is refused. Route returns 404 with the flag off. A revoked member's stream closes. | **P2 (P0 on flag flip)** |

### Batch A: product structure (audits 1–7)

| Fix ID | Root Cause | Affected Findings | Affected Files | Affected Modules | Dependencies | Risk | Fix Strategy | Required Tests | Priority |
|---|---|---|---|---|---|---|---|---|---|
| A-1 | Site settings have two writers; the editor pushes a full record with no concurrency token, dispatched in parallel with the conflict-checked save | A01-2, A02-1, A12-1, A16-1 (all P0→**P1**); A02-2, A12-2 (P1) | `E/services/BuildrikSyncProvider.ts:192-270,398-448`; `E/editor/shell/hooks/useComposerInit.ts:517-527`, `useSaveCallback.ts:96-107`; `S/trpc/routers/site-detail.ts:94-127`; `S/services/site-settings.service.ts:130-257` | Autosave, dashboard site settings, SEO, publish output | A-2 (if the patch moves into the transaction); PD-1; land with A-4 | Medium | Diff the column patch against the load or last-save baseline and send only changed keys. Chain the call **after** a successful project save and skip it on conflict. Skip it for non-ADMIN roles (or allow a field subset). Give `settings.update` an `expectedLastEditedAt` and bump `lastEditedAt`. Preferred: write the patch inside `saveProjectData`'s CAS transaction. | A conflicting save does not call `settings.update`. An untouched field is not sent. An EDITOR autosave shows no warning. Two-writer DB test. Browser: dashboard edit plus open editor tab keeps the dashboard value (NOT yet possible here). | **P1** |
| A-2 | Optimistic concurrency is checked outside the write; the client has overlapping autosaves on a stale baseline; a second write door has no check | A17-1 (P0→P2), A07-6 (P1), A12-4 (P1), A12-15, A16-15, A16-16, A15-11 | `S/services/sites.service.ts:594-745`; `S/trpc/routers/sites.ts:268-280,585-600`; `E/editor/shell/hooks/useComposerInit.ts:497-677`; `E/services/BuildrikSyncProvider.ts:334,405-446`; `E/editor/shell/AquibraStudio.tsx:352-357,687`; `E/editor/shell/modals/ConflictModal.tsx` | Autosave, pages, ConflictModal | D-14a (DB tier to prove it) | Medium: more visible conflicts (§3) | Inside the transaction, `site.updateMany({where:{id,lastEditedAt:expected}})` and `count===0 → SAVE_CONFLICT`. Client single-flight autosave that rebases the baseline from each response. Suspend autosave while a conflict is unresolved (banner, not a re-opening modal). Make "Save a backup" or merge the primary action (PD-11). Retry after reconnect. Delete `sites.saveProjectData` or require the token. | Two concurrent `saveProjectData` calls with the same token: exactly one wins (real Postgres). Client test: no self-conflict under slow saves. | **P1** |
| A-3 | The token migration left `theme.service` on the old store (`projectStyles`) | A01-1 (P0→**P1**) | `S/services/theme.service.ts:49,76-106,160-190`; `D/components/theme/*`; `__tests__/theme.service.test.ts:107` | Agency Theme, Brand, published CSS | Related to D-4 | Low | Hide Push now. Re-point capture, push, preview and rollback to `projectSettings.designTokens` and `designPresets`. Never touch `projectStyles`. | A push with a real editor-shaped `projectStyles` (`[data-buildrik-id]` rules) leaves the rules intact and transfers the tokens. | **P1** |
| A-4 | Canvas history snapshots include site settings and metadata | A06-2 (P1), A06-14, A06-6 | `E/engine/Composer.ts:634-642,669-693,834-881`; `E/engine/HistoryManager.ts:93-127,459-513`; `E/editor/sidebar/tabs/pages/usePages.ts:286-298`; `E/editor/canvas/hooks/useCanvasKeyboard.ts` | Undo, settings, autosave | PD-12; with A-1 | Medium | Exclude settings and metadata from the undo snapshot and restore. Bind toast Undo to a specific history entry. | Probe from A06: undo after a settings save leaves the settings intact. Rename survives undo. | **P1** |
| A-5 | Lock is checked in a path the capture-phase registry pre-empts; there are two lock sources | A06-1 (P1), A06-4, A06-7, A06-5 | `E/engine/commands/defaultCommands.ts:75-98,174-192`, `CommandCenter.ts:59-81`; `E/editor/panels/layers/hooks/useLayerActions.ts`; `E/shared/utils/dragDrop/dropTarget.ts:148`; `E/editor/canvas/menus/actions/{editActions,insertActions}.ts` | Canvas editing, Layers, components | PD-13 | Low | Enforce lock and instance rules in the command layer (delete, cut, move, drop, paste). One persisted lock flag. Cut fills the in-app clipboard. | A06 lock-bypass probe refused on every route. Instance drop refused. Cut → Paste. | **P1** |
| A-6 | Global capture-phase keyboard with no surface or modal ownership | A05-1 (P1), A04-1 (P0→**P2**), A04-3, A04-8, A03-4, A05-11, A06-12, A06-13, A04-15 | `E/engine/commands/CommandCenter.ts:23-35,72-81,193-229`, `KeybindingManager.ts:56-58`; `E/editor/sidebar/FullPageRouter.tsx:85-122`; `E/editor/sidebar/tabs/pages/PagesTab.tsx:166-179,403-410`; `PageCommandPalette.tsx`; `E/editor/shell/StudioHeader.tsx:256-273`; `E/editor/sidebar/useSidebarKeyboard.ts`; `DrillInHeader.tsx`; `E/editor/media/LibraryManager.tsx:135-144` | Keyboard, full-screen surfaces, palettes | PD-3; re-check after S-1b | Medium: many shortcut regressions possible | One keyboard-scope stack: full-screen surfaces and modals own keys and the canvas scope is suspended. A single ⌘K owner. Inert drawers register no listeners. Clear selection when Settings or the Asset library opens. ⌘S and ⌘Z respect read-only. | A04-1 jsdom probe inverted (Delete with Settings open deletes nothing). ⌘K opens exactly one palette. `isModalOpen` is false after drawer close. | **P1** |
| A-7 | Deep-link sub-tab and full-page tab state is sticky and persisted | A03-2 (P1), A04-12, A03-9, A04-13, A04-14, A03-14 | `E/editor/shell/hooks/useStudioState.ts:224-236,267-327`; `E/editor/shell/StudioPanels.tsx:162,411-420`; `E/editor/canvas/hooks/useCanvasCommandPalette.ts:258-265` | Navigation | None | Low | Consume-once deep links. Do not persist full-page tabs. Remember the previous tab. Point "export settings" at `UI_TOGGLE_EXPORTER`. | Door sequence tests: Version history opens History after Published. Reload does not open Settings. | **P1** |
| A-8 | Comments and Review are merged in the UI but gated differently; approval is gated on a flag read from the wrong workspace | A03-1, A07-7, A15-1 (all P1); A01-8, A03-7, A07-15, A07-19, A08-13, A12-12 | `S/trpc/routers/reviews.ts:58-152`; `S/services/publish.service.ts:248-299`; `E/editor/sidebar/tabs/review/ReviewTab.tsx:499-535`; `E/editor/canvas/comments/CommentLayer.tsx`; `E/editor/shell/SiteMenu.tsx:203`, `StudioHeader.tsx:818`; `D/app/review/[token]/review-client.tsx:129,406-440`; `D/components/comments/comment-queue.tsx` | Comments, Review, publish gate, onboarding | PD-7, PD-8 | Medium | Per the decisions: either hide the Review doors and comment mode when `agency_layer` is off, or give comments a standalone list and resolve. Pass `reviewsEnabled` to `ReviewTab` and `SendForReview`. Read the flag from the site's workspace. Make "Edits need approval" require the layer, or work without it. Link queues to site, snapshot and pin. Handle review-page `resolve` errors. | Non-agency workspace: no dead door. Approval ON + layer OFF: an EDITOR can publish, or the UI prevents the combination. | **P1** |
| A-9 | Sharing-policy UI was built ahead of enforcement | A07-8 (P1), A19-11 | `S/services/share-link.service.ts:12-77`; `D/app/share/[token]/page.tsx:45-53`; `verify-password/route.ts`; `D/app/dashboard/settings/workspace/page.tsx:69-72`; `D/components/settings/workspace-form.tsx:340-420` | Sharing | PD-14 | Low | Enforce `requirePw`, `defaultExpiration` and `notify` at link creation. Check the effective role rank (DESIGNER included). Show the effective default. Make the password gate real, or relabel it. | Policy-on link creation without a password → refused. DESIGNER blocked when `allowEditors` is off. | **P1** |
| A-10 | `SitePermission` means both "scope marker" and "role override" | A07-20 (P1) | `S/services/sites.service.ts:250-284`; `S/services/permission.service.ts:55-58` | Transfer, roles, site list | S-6, PD-6 | Low | Do not write an override on transfer, or split scope from override. Add an admin UI to edit site scope. | A previous owner keeps access to other sites after a transfer. | **P1** |
| A-11 | Media belongs to the uploader, not the site or workspace; the client quota is hard-coded | A01-3, A02-3 (P1); A17-7, A05-3, A05-4, A12-13 | `prisma/schema.prisma` (`MediaAsset`); `S/services/media.service.ts:24-31,87-90,285-415`; `E/shared/constants/media.ts:333`; `E/engine/media/MediaManager.ts:965-977,1383-1400`; `E/services/AssetUploadService.ts:141-182`; `E/editor/sidebar/tabs/media/*` | Media, quota, search | S-4; PD-15; migration | High: data migration | Migrate to site or workspace scope. Plan-fed quota. One search field set on client and server (or server only). Distinguish refusal from transient in upload errors. | A teammate sees site assets. Search parity. A PRO user can upload above 1 GB. Migration dry run. | **P1** |
| A-12 | Two full site-settings surfaces with overlapping coverage | A01-4 (P1, PD); A02-5, A01-6, A02-16, A12-7 | `E/editor/sidebar/tabs/settings/{constants.ts,screens/*}`; `D/components/site-detail/{tab-nav,settings-tab,seo-tab}.tsx`; `D/app/dashboard/sites/[id]/*` | Settings | PD-1; after A-1 | Medium | Assign each field one owner surface. The other surface links to it. Move workspace webhooks to workspace settings. A failed SEO load shows an error, not defaults. | Field-ownership table test (each Site column editable in exactly one place). | **P1 (PD)** |
| A-13 | Parallel command palettes and shortcut references | A01-14, A02-12, A03-6, A03-12, A05-2, A05-10, A10-2, A11-6, A11-17 | `E/editor/shell/modals/CommandPalette.tsx`; `E/editor/canvas/controls/CommandPalette.tsx`; `E/editor/canvas/hooks/useCanvasCommandPalette.ts`; `E/editor/chrome-ui/CommandPalette.tsx`; `KeyboardShortcutsPanel.tsx`, `KeyboardCheatSheet.tsx` | Commands, search | PD-3, PD-16; after A-6 | Medium | One palette with scopes, built on the Figma-conformant chrome-ui palette. One shortcut data source. Add jump-to entities per PD-16. | Command registry snapshot. Every command appears once. Update the drifted ⌘K tests. | **P2** |
| A-14 | AI entry sprawl and a shared AI engine inside a panel folder | A03-3, A04-4, A09-4, A02-13, A01-17, A02-6 | `E/editor/shell/StudioPanels.tsx:239,332-356`; `useEditorEventListeners.ts:143-160`; `E/editor/canvas/controls/{UnifiedSelectionToolbar,AiPromptPopover}.tsx`; `E/shared/utils/openai.ts`; `E/editor/sidebar/tabs/media/components/AssetDetailOverlay.tsx:274-293` | AI | PD-17 | Low | One chat home. Move the engine to `editor/ai/`. Delete dead AI client paths. Alt text uses the vision path only. Fix the "Claude" label. | Door → destination table test. | **P2** |
| A-15 | Template, catalog and insert pipelines duplicated | A01-11, A02-10, A05-15, A02-7, A05-5, A05-6, A01-10, A02-8, A05-17 | `E/editor/sidebar/tabs/templates/templatesData.ts:175-304`; `prisma/seed.ts:103-249`; `E/editor/canvas/controls/BlockPickerModal.tsx`; `useBlockInsertion.ts`; `BuildTab.tsx`; `component-library/useComponentsState.ts` | Templates, Add, components | PD-4, PD-19 | Medium | The editor reads `templates.list`. One insert pipeline and one search dataset (including MINE). One components home. | Insert placement parity. Search includes MINE. | **P2** |
| A-16 | Server-initiated publish has no page source | A01-12, A02-4, A14-5, A15-4, A15-5 | `D/app/dashboard/sites/[id]/publish/page.tsx`; `D/app/api/cron/scheduled-publish/route.ts:36`; `D/app/api/workers/publish/[jobId]/route.ts:74-105` | Publish, scheduling | PD-18 | Low (delete) / High (renderer) | Redirect the dashboard publish page to the editor. Either build server-side rendering from stored pages, or remove scheduled publish and its cron. | Sweep → worker integration test with empty and non-empty payloads. | **P2** |
| A-17 | CMS dynamic pages and records have split owners | A01-13, A02-14, A15-7, A04-11, A05-8, A09-8 | `E/editor/sidebar/tabs/content/{ContentTab,ContentViews}.tsx`; `E/editor/shell/modals/CMSRecordsModal.tsx`; `S/services/cms.service.ts:78-81,229-246`; the export engine | CMS, Pages, publish | PD-20 | Medium | Pages lists generated routes read-only. One template-path contract with the exporter. Warn on a miss. One records surface. Paged lists. | Exporter emits the hinted path. Miss is surfaced. | **P2** |
| A-18 | Ad-hoc overlay geometry and two z-index scales | A04-5, A04-6, A04-7 | `E/editor/shell/{AquibraStudio,PreviewOverlay}.tsx`; `E/shared/constants/canvas.ts:260-290`; `TimeTravelScrubber.tsx` | Shell layering | After A-6 | Low | One `Z_LAYERS` scale. Issues panel as an anchored surface. Time-travel blocks live canvas input. | Computed z-order test. Time-travel click is inert (browser). | **P2** |
| A-19 | Dashboard ↔ editor hand-offs and VIEWER access undefined | A03-8, A03-5, A03-11, A03-15, A03-16, A15-8 | `D/app/edit/[siteId]/page.tsx:17-22`; `S/services/sites.service.ts:795-810`; `D/components/site-detail/site-header.tsx`; `D/app/auth/invite/page.tsx:78-80,144`; `D/app/dashboard/sites/new/initial-view.ts` | Navigation, roles | PD-21, PD-22 | Low | Read-only view or explained denial for VIEWERs. Consistent new-tab rule. Honour `?invite`, `?ai`, `next` with query. Switch session after invite accept. | Route tests per role. | **P2** |
| A-20 | Notifications own no collaboration events; "Mentions" is mislabelled | A01-9, A02-11, A07-18, A08-11, A07-16, A08-12, A14-15 | `packages/shared/schemas/notifications.ts:13-18`; `S/services/notification.service.ts`; `D/components/notifications/*`; `E/editor/shell/NotificationPanel.tsx:255-336` | Notifications | PD-23 | Low | Rename the filter (or build mentions). Emit comment and review notifications. Don't say "deleted" for linkless types. | Filter-type mapping test. | **P2** |
| A-21 | No production awareness of concurrent editors | A07-14 | `E/editor/shell/StudioHeader.tsx`; new heartbeat endpoint | Collaboration (async) | PD-25; independent of C-5 | Low | An ephemeral "someone else is editing" heartbeat, separate from the op log. | Two-session heartbeat test. | **P2** |
| A-22 | Dev-only and dead code compiled into production | A01-15, A01-16 = A04-16, A01-18, A01-19, A01-20, A01-21, A02-15, A02-17, A02-18, A02-20, A14-11, A14-16 | `E/editor/rail/tabsConfig.ts`, `FullPageRouter.tsx:67-76`, `StructurePopover`, `FourToolRail`, `ReviewService.ts:15-20`, `StudioModals.tsx:136-146` | Shell | None | Low | Delete or consolidate. One site-id helper in the sync layer. | Orphan scan clean. Build size delta. | **P3** |

### Batch B: UX and system (audits 8–13)

| Fix ID | Root Cause | Affected Findings | Affected Files | Affected Modules | Dependencies | Risk | Fix Strategy | Required Tests | Priority |
|---|---|---|---|---|---|---|---|---|---|
| B-1 | Four commit models; staged edits invisible to guards | A09-1 (P1), A04-2 (P1), A12-8, A04-10 | `E/editor/shell/StudioHeader.tsx:416-442,477-502,560-585`; `E/editor/shell/hooks/useEditorShortcuts.ts`; `useStudioState.ts:317-327`; `E/editor/sidebar/LeftSidebar.tsx:443-452`; `ContentViews.tsx:381-391` | Brand, Settings, CMS, exit guards | PD-11; after A-6 | Medium | One dirty registry that all guards read (navigation, beforeunload, tab switch, shortcuts, bus switches). The pill saves what it shows, or it names what is staged. | A04-2 bypass sequences blocked. Brand staged edit triggers beforeunload (A09 probe inverted). | **P1** |
| B-2 | The publish UI state machine has blind spots | A08-1 (P1), A12-3 (P1), A04-9, A08-4, A06-15, A08-27 | `E/editor/chrome-ui/Topbar.tsx:307-333`; `E/editor/shell/hooks/usePublishJob.ts:155-215,297-310`; `E/editor/sidebar/tabs/publish/PublishTab.tsx`; `StudioHeader.tsx:674-695,876-960`; `D/components/site-detail/site-header.tsx:103-138` | Publish UI | After D-1 | Low | Visible disabled state with a reason. Poll error → retryable state. In-flight guard set before await. One confirm surface. Unpublish is not primary. | Poll failure recovers. Double click → one job. | **P1** |
| B-3 | Page visibility UI ahead of enforcement | A08-2 (P1), A08-3 | `E/editor/sidebar/tabs/pages/page-settings/AdvancedTab.tsx:23-86`; `E/engine/export/ExportEngine.ts:112-126`; `PageRow.tsx` | Pages, publish | PD-14 | Low | Hide Password until enforced (or enforce). Consistent copy. Row status for excluded pages. | Exported file list matches row status. | **P1 (PD)** |
| B-4 | Dashboard mutations lack 4xx feedback; destructive actions have no confirm policy | A12-6 (P1), A06-3 (P1), A12-16, A06-11, A06-10, A08-5, A11-14 | `lib/trpc/client.tsx:59-109` + 44 call sites; `D/components/site-detail/{submission-drawer,submissions-panel}.tsx`; `api-tokens-tab.tsx`; `integrations-content.tsx`; `create-site-modal.tsx`; `context-menu.tsx`; `bulk-action-bar.tsx` | Dashboard | PD-26, PD-27 | Low | A global 4xx toast carrying the server message (opt-out per mutation). No login redirect on `/review/*`. Confirm and soft-delete for submissions. Destructive tone. Double-submit guard. | Handler unit test per status. Submission delete requires confirm. | **P1** |
| B-5 | Email failures swallowed | A12-5 (P1) | `S/services/team.service.ts:127-129,256-258`; `S/services/email.service.ts:86-92`; `D/app/dashboard/settings/team/page.tsx:29-37` | Team, invites | PD-28 | Low | Return per-invite send status. Log. Don't consume resend quota on failure. Offer copy-link per PD-28. | Mocked SMTP failure → UI shows failure. | **P1** |
| B-6 | The Modal focus effect depends on an unstable `onClose` | A13-1 (P1) | `D/components/dashboard/primitives/modal.tsx:27-70` | Dashboard dialogs | None (quick win) | Low | Hold `onClose` in a ref and run the effect on `[open]` only. | Re-run the jsdom ShareDraftModal probe: typing "Homepage" keeps "Homepage". | **P1** |
| B-7 | Hand-built dialog shells bypass ModalRoot and focus trapping | A11-2 (P1), A13-4, A13-10, A13-6, A13-9, A11-19 | `E/editor/shell/modals/ConflictModal.tsx`; `E/editor/chrome-ui/{ModalParts,OverlayMount,Modal}.tsx`; `D/app/review/[token]/review-client.tsx:374-420`; `D/components/search/command-palette.tsx`; 12 shells listed in A11-2 | Dialogs | Coordinate with A-6 | Low | Move the shells onto `ModalRoot`. Name the `role=dialog` node. One modal API. | Focus-in, trap and Esc tests per dialog. axe (B-13). | **P1** |
| B-8 | Labels not programmatically associated | A13-2 (P1) | `D/components/site-detail/settings-tab.tsx:373-387`, `account-tab.tsx:155-160`, about 69 dashboard and 78 editor controls | Forms | None | Low | `htmlFor` and `id` in the `Field` primitives. | jsdom accessible name is non-empty for every field. | **P1** |
| B-9 | No keyboard selection route | A13-3 (P1), A13-18, A13-11, A13-5 | `E/editor/panels/layers/LayerTreeItem.tsx:155-177`; `E/editor/sidebar/LeftSidebar.tsx:155-161,486-517`; `AssetGrid.tsx`; `PageRow.tsx`; `CommentLayer.tsx:411-422` | Layers, canvas, comments | PD-29; after A-6 | Low | Roving tabindex with focus following selection. Bind `selectNext/PrevSibling`. Keyboard comment pin anchored to the selection. | Layers arrow probe inverted. | **P1** |
| B-10 | Two shell implementations (unused primitives vs live shell) | A11-1 (P1), A10-10, A10-11 | `E/editor/chrome-ui/{EditorShell,Rail,RightPanel,Drawer,Footer,NavItem,TreeRow}.tsx`; `E/editor/sidebar/LeftSidebar.tsx`; `rail/LayoutShell.tsx`; `shell/StudioFooter.tsx` | Chrome | PD-30 | Medium | Migrate the live shell onto the primitives, or delete them and their tests. | Visual parity (Playwright) if migrating. | **P1 (PD)** |
| B-11 | No size, type or spacing contract | A10-1, A10-3..A10-9, A10-12, A10-14, A10-15, A10-16, A11-3, A11-4 | `E/editor/chrome-ui/{Button,buttonTheme,Modal,ModalParts,typeRamp,Row,textInputTheme}.ts(x)`; `tokens.generated.css`; `D/components/dashboard/primitives/button.tsx`; `D/app/layout.tsx:39-43` | Design system | PD-31 | Low | A required `size` on Button. Font sizes from the ramp. Self-host fonts. | DS ratchet extended to sizes. | **P2 (PD)** |
| B-12 | Duplicated primitives | A11-5, A11-7..A11-11, A11-16, A11-18, A11-20, A11-21, A05-12, A05-13, A05-14, A05-16, A05-18 | Files listed per finding in `11-*.md` and `05-*.md` | Design system | After B-10 | Low | Consolidate onto chrome-ui (Tabs, Menu, ColorField, SearchBar, StatusBadge). | Gate 24 scope extended to `shared/forms`. | **P2** |
| B-13 | Dashboard DS and a11y are not gated | A11-12, A13-20 | `D/scripts/ds-grep-gates.sh:158`; `package.json` | Tooling | PD-32 | Low | Refresh D7. Add jsx-a11y and axe as a ratchet. | The gates themselves. | **P2** |
| B-14 | Signifiers whose meaning contradicts behaviour | A08-6..A08-10, A03-10, A09-14, A03-17, A08-14..A08-27 | `ToolbarActionsSection.tsx:158-186`; `LayerTreeItem.tsx`; `IssueChip.tsx`; `IssuesPanel.tsx`; `LintState.ts` | Chrome | PD-33, PD-34; B-15 (one health evaluator, A02-9) | Low | Relabel or retarget per decision. Make "Ignore once" really once. Issues rows route to Brand. | Update the tests that pin the old behaviour (A08-6). | **P2** |
| B-15 | Chrome overload | A09-2, A09-3, A09-5..A09-7, A09-9..A09-11, A09-13, A09-15, A02-9 | `CanvasFooterToolbar.tsx`; `UnifiedSelectionToolbar.tsx`; `RichTextEditor.tsx`; `SiteMenu.tsx`; `contextMenuRegistry.ts`; `editorViewMode.ts`; publish, site-detail and issues evaluators | Chrome | PD-35 | Low | View popover. Deduplicate facts. Trim the site menu. Promote Copy and Delete. One site-health evaluator feeding Issues. | jsdom control-count probes. | **P2 (PD)** |
| B-16 | Remaining a11y gaps | A13-7, A13-8, A13-12..A13-17, A13-19, A12-14 | Files per finding in `13-*.md`; `E/editor/chrome-ui/Toast.tsx` | a11y | B-7 | Low | Per finding. Toast dedupe, cap and hover pause. | axe ratchet. | **P2/P3** |
| B-17 | AI apply failures swallowed; popover outlives its selection | A12-10, A15-10 | `E/editor/canvas/controls/AiPromptPopover.tsx:49-86` | Inline AI | A-14 | Low | Surface the error. Close or rebind on selection change. | Stale-id apply shows an error. | **P2** |

### Batch C: functional (audits 14–16)

| Fix ID | Root Cause | Affected Findings | Affected Files | Affected Modules | Dependencies | Risk | Fix Strategy | Required Tests | Priority |
|---|---|---|---|---|---|---|---|---|---|
| C-1 | A raw `fetch` bypasses the superjson transformer | A14-1 (P1) | `E/editor/panels/version-history/useAISummary.ts:109-121`; `E/shared/hooks/useAutoMilestone.ts:180-191` | History AI | **S-8 first**; D-3 | Low | Call through the editor tRPC client. Fix the mocks to the real wire shape. | In-process tRPC round trip (the A14 reproduction) returns 200. | **P1** |
| C-2 | Crons are declared for Vercel; production is cPanel | A14-2 (P1), A20-10 | `vercel.json`; `docs/cpanel-deploy.md:182-192`; `D/app/api/cron/*` | Billing dunning and downgrade, account deletion, purges | Ops access (production crontab NOT VERIFIED) | Medium: running destructive crons for the first time on a backlog | Inventory the prod crontab. Add the missing 16 triggers with `CRON_SECRET`. Dry-run destructive ones first. | Route tests for the billing and deletion crons. A post-deploy check. | **P1** |
| C-3 | Publish trusts the calling tab's HTML; approval binds timing, not content | A15-2 (P1), A07-17 | `E/editor/shell/hooks/useExportHandlers.ts:82-119`; `packages/shared/schemas/publish.ts:37-45`; `S/services/publish.service.ts:185-339`; `StudioHeader.tsx:630-635` | Publish, approval | A-2, S-7, PD-18, PD-9 | Medium | Require `expectedLastEditedAt` on publish. Disable Publish in the conflict state. Optionally render from stored pages (PD-18) or hash-check the approved snapshot. | Stale tab publish → refused (DB tier). | **P1** |
| C-4 | Local-first additive hydrate plus full-record upserts for shared resources | A16-8 (P1), A12-9, A01-5, A16-9 (the CMS and component part) | `E/services/{cmsSync,componentSync}.ts`; `S/services/cms.service.ts:83-102`; site-component service; `E/editor/sidebar/tabs/content/{contentPanelUtils,useContentPanel}.ts` | CMS, components | PD-36 | Medium | Server-first reconcile by `updatedAt`. Tombstones. Conditional upsert. Persist CMS variables and sources with the project. Surface hydrate errors. | Two-client lost-update and resurrection test (DB tier). | **P1** |
| C-5 | Custom live co-editing engine: positional JSON Patch, no remote transform, sequence-gap polling, all-host snapshots, local-only undo | A16-2..A16-5, A16-7, A16-9, A16-12..A16-14, A16-17, A07-2..A07-5, A07-10..A07-13, A07-22..A07-25, A06-9, A12-11, A14-8, A18-9, A11-13, A11-15, A13-15, A10-13, A09-12, A08-26, A20-4 | `E/engine/collaboration/*`; `E/engine/HistoryManager.ts`; `E/engine/utils/JsonPatch.ts`; `S/services/collab.service.ts`; collab routes | Live collaboration (flag-off) | **PD-37 before any code.** S-12 now. D-14 (two-client harness as the gate). | High | Keep the flag OFF (asserted by S-12). Decide replace (CRDT or server-authoritative) or repair. Build the 11-scenario two-client harness first. **Do not patch individual defects.** | A20-4's 11 scenarios as the gate for enabling the flag. | **P1 (flag-off; P0 on flip)** |
| C-6 | Dead commands and stale copy | A14-3, A14-4, A14-6, A14-9, A14-13, A14-17 | `E/editor/shell/modals/CommandPalette.tsx:152-156`; `useCanvasCommandPalette.ts:301-315`; `D/components/site-detail/{redirects-tab,submissions-panel}.tsx`; `scripts/check-baked-flags.mjs`; `package.json:28` | Commands, publish copy, CI | PD-38 | Low | Wire or remove. Fix the copy and its pinning tests. Run `gate:baked-flags` in the build CI. | Command-effect tests. CI gate run. | **P2** |
| C-7 | Localization controls with no consumer | A14-7 | `LocalizationScreen.tsx:137-142`; `TranslationChecklistDialog.tsx` | Localization | PD-39 | Low | Reduce to the default locale, or ship emission. | — | **P2 (PD)** |
| C-8 | A `false` restore result is treated as success | A06-8, A15-6 | `E/engine/VersionTimelineManager.ts:276-316`; `E/shared/hooks/useVersionHistory.ts:100-106`; `VersionHistoryPanel.tsx:207-220` | History | None | Low | Check the boolean result and show an error. | A `false` result renders an error (currently untested). | **P2** |
| C-9 | Remaining wiring P3s | A14-12 (Trash stub), A14-14, A14-18 = A15-12, A14-19, A15-9 (session UI after demotion) | Per `14-*.md` | Various | PD-40 (Trash) | Low | Per finding. | Per finding. | **P3** |

### Batch D: engineering (audits 17–20)

| Fix ID | Root Cause | Affected Findings | Affected Files | Affected Modules | Dependencies | Risk | Fix Strategy | Required Tests | Priority |
|---|---|---|---|---|---|---|---|---|---|
| D-1 | Publish lifecycle split between the worker route and the service | A17-2 (P1), A17-4 (worker part) | `D/app/api/workers/publish/[jobId]/route.ts:136-146`; `S/services/publish.service.ts:438-600` | Publish, rollback, diff, history | S-10 first; PD-41 (retention) | Medium | The worker calls one `completePublish`, which does retention, prune, webhook, notification and activity. Delete the inline transaction. | Drive the worker to COMPLETED, then `getPublishHistory()[0].rollbackable === true`. | **P1** |
| D-2 | Authorization copy-pasted, with four resolvers that disagree | A17-3, A19-16, A17-4 (acceptInvite, integrations), A17-15 | `S/trpc/{workspace-ctx,require-workspace,guards}.ts`; `S/trpc/routers/{auth,integrations}.ts` | Server authz | After S-2..S-10 | Medium | One resolver that carries `ctx.bearer`. Move transactions into services. One error convention. | Router tests for every role gate (with D-14). | **P2** |
| D-3 | No single network owner in the editor | A17-5 | `E/services/api-client.ts`; `E/services/ai/AiTrpcClient.ts` | Editor networking | C-1 | Low | One tRPC client. Ban raw `/api/trpc` fetches with lint. | Lint rule. | **P2** |
| D-4 | Three stores for design tokens | A17-6 | `E/editor/design-system/state/TokenRegistryContext.tsx:114-155`; `DesignSystemTab.tsx:390-466` | Brand, lint, pre-publish | A-3, B-1 | Medium | Hydrate the registries from `projectSettings.designTokens` at load, not on Brand open. Drop the localStorage seed. | Lint count is correct before Brand is opened. | **P2** |
| D-5 | `as any` hides wrong drop-handler signatures | A17-8 | `E/editor/canvas/hooks/drag/useDropExecution.ts:188-302`; `dropOperations.tsx` | Drag and drop | None | Low | Type the dispatcher. Pass payloads. | Chromium drop test (browser; NOT verified). | **P2** |
| D-6 | Code hygiene | A17-9..A17-14, A17-16..A17-19 | Per `17-*.md` (e.g. `RedirectsScreen.tsx:240` NUL byte, `eslint.config.mjs:232-291`, `EmailService.ts`) | Codebase | PD-42 (stubs) | Low | Split god files. Remove stale lint exemptions. Delete stubs. Replace the NUL byte with an escape. | Lint and `tsc`. | **P3** |
| D-7 | Every edit re-serializes and replaces the whole canvas DOM | A18-1 (P1), A18-14 | `E/editor/canvas/hooks/{useCanvasSync,useCMSPreview,useCanvasContent}.ts`; `Canvas.tsx:503,720` | Canvas | **S-1b decision**; PD-43 (size budget) | High | Incremental DOM patching or a keyed renderer. Remove the no-op re-parse. | Frame budget test at the PD-43 size. Browser profile (NOT possible here). | **P1** |
| D-8 | Autosave sends every page | A18-2 | `useComposerInit.ts:517-527`; `BuildrikSyncProvider.ts:398-420`; `sites.service.ts:612-744` | Autosave | **After A-2** | Medium | Dirty-page delta under the same CAS. | Payload size test. DB timing. | **P2** |
| D-9 | Unscoped re-renders | A18-3, A18-4, A18-11 | `StudioPanels.tsx:211,357-367`; `Canvas.tsx:437-441`; `useLayerTree.ts`; `useStudioState.ts:257`; `useExportHandlers.ts:57` | Shell performance | None | Low | Memo boundaries. Move hover state down. Incremental Layers tree. | Render-count tests. | **P2** |
| D-10 | Full-size media in grids | A18-6 | `E/engine/media/MediaManager.ts:566-644,1065`; `AssetCell.tsx` | Media | PD-44 | Medium | Thumbnails per the decision. Batch the hydration emit. | — | **P2 (PD)** |
| D-11 | N+1 hydration and in-memory pagination | A18-7, A18-10, A18-15 | `E/services/versionSync.ts:88-124`; `cmsSync.ts:115-160`; `S/services/sites.service.ts:73-105` | History, CMS, site list | C-4; PD-45 | Low | Batch endpoints. SQL-side traffic sort. | Query-count tests (DB tier). | **P2/P3** |
| D-12 | Heavy libraries in the eager chunk | A18-8 | `useExportHandlers.ts:27`; `Composer.ts:45`; `StudioModals.tsx:15` | Bundle | None | Low | Dynamic `import()` for jszip, gsap and react-easy-crop. | Bundle size budget in CI. | **P2** |
| D-13 | Dashboard over-fetching and reconnect storms | A18-12, A18-13, A05-9 | `lib/trpc/client.tsx:88-107`; `D/components/media/media-library.tsx`; `lib/hooks/use-notification-sse.ts`; `D/app/dashboard/{projects,templates}/page.tsx` | Dashboard network | None | Low | `staleTime`, debounce, backoff with jitter, stop on 401. | Hook tests. | **P3** |
| D-14 | The test tier cannot see integration, race, authz or E2E defects | A20-1, A20-2, A20-3, A20-5 (untested units), A20-12, A15-13 | `packages/editor/playwright.config.ts`; `.github/workflows/*`; `__tests__/*`; new DB-tier harness | Quality | PD-24, PD-46 | Medium (CI time) | **D-14a (Phase 0):** a Postgres service in CI plus a harness. **D-14b:** router role-gate tests for the 19 untested routers. **D-14c:** one real Next editor loop (open, edit, autosave, reload, publish-simulation). **D-14d:** SSE route tests. | These are the tests. | **P1** |
| D-15 | Red suite and dishonest tests | A20-6 = A15-12 = A14-18, A20-7, A20-8, A20-9, A20-11, A20-13, A20-14, A20-15 | `CommandPalette.test.tsx`; `CanvasEmptyCTA.test.tsx`; the 89 source-scan tests; `editor-ci.yml:57,166,175` | Quality | None (**D-15a in Phase 0**) | Low | Fix the drift. Rename or convert source-scan tests. Assert side effects. Deduplicate the editor runs. Raise the timeout or shard. | Green full run. | **P2** |

---

## 5. Product decisions (PRODUCT DECISION REQUIRED)

These were merged from the "Product decisions required" sections of all 20 reports. Each row says which fix it gates.

| PD | Decision | Source findings | Gates |
|---|---|---|---|
| PD-1 | Which surface owns each site-settings field, and should the editor write Site columns on autosave at all? | A01-4, A02-5, A12-1/2, A16-1 | A-1 (shape), A-12 |
| PD-2 | Sandboxed-iframe canvas or nonce CSP (the long-term XSS containment) | A19-1 | S-1b, D-7 |
| PD-3 | What a full-screen surface owns (keyboard, selection); whether ⌘⇧P survives | A04-1/2, A03-6, A05-2 | A-6, A-13 |
| PD-4 | Template catalog owner: static `SITE_TEMPLATES` or the server `Template` table | A01-11, A02-10, A05-15 | A-15 |
| PD-5 | May unverified password accounts use the product? | A19-5, A19-9 | S-5 (second half) |
| PD-6 | `SitePermission` meaning: a scope marker, a role cap or a grant; does a role change cascade? | A07-1, A07-20, A19-7 | S-6, A-10 |
| PD-7 | Comments: part of agency Review, or standalone (list, threads, VIEWER access)? | A01-8, A03-1, A07-7/19/23, A15 flow 18 | A-8 |
| PD-8 | Is "Edits need approval" an agency-layer feature? One approval product or two? | A15-1, A07-15 | A-8 |
| PD-9 | Approval binding: content (snapshot or hash) or timing; is "typed the invited address" an acceptable signer? | A07-17, A19-6 | S-7, C-3 |
| PD-10 | May EDITORs `acknowledgeStale`? | A19 PD 3, A15-2 note | S-7 |
| PD-11 | Commit model (autosave vs staging) and the primary conflict action; pause autosave during conflict? | A09-1, A12-4, A12-15 | B-1, A-2 |
| PD-12 | Undo scope: element tree plus tokens only? | A06-2 | A-4 |
| PD-13 | Lock semantics: "not selectable" or "not mutable" | A06-1 | A-5 |
| PD-14 | Share-link and page passwords: real protection or relabel; enforce `requirePw` and `defaultExpiration` | A07-8, A19-11, A08-2 | A-9, B-3 |
| PD-15 | Media scope (site, workspace or user) and what `/dashboard/media` shows | A01-3, A02-3 | A-11 |
| PD-16 | Editor ⌘K jump-to entity scope | A05-2 | A-13 |
| PD-17 | The home for AI chat (inspector, drawer or one shared thread); inline popover vs chat | A03-3, A04-4, A09-4 | A-14 |
| PD-18 | Publish source of truth (the tab canvas or server-rendered stored pages); scheduled and dashboard publish kept or dropped | A02-4, A15-2/4/5, A14-5 | A-16, C-3 |
| PD-19 | Components' home (Brand or Add) and workspace library visibility | A01-10, A02-8 | A-15 |
| PD-20 | Do CMS-generated routes appear in Pages? CMS record search client- or server-side? | A01-13, A02-14, A05-8 | A-17 |
| PD-21 | VIEWER access to the editor: read-only or explained denial | A03-8, A07-19 | A-19 |
| PD-22 | The editor's parent, and the new-tab vs same-tab rule for hand-offs | A03-5 | A-19 |
| PD-23 | Mentions: build or rename the filter | A01-9, A02-11, A07-18, A08-11 | A-20 |
| PD-24 | Add a DB-backed test tier to CI | A20-2 | D-14a (and the honest testing of S-2, S-5, S-6, A-2) |
| PD-25 | Concurrent-editor awareness in production without live co-editing | A07-14, A16 PD 4 | A-21 |
| PD-26 | Dashboard error policy: one global 4xx toast or copy per mutation | A12-6 | B-4 |
| PD-27 | Form submissions: soft-delete (archive and purge) or hard-delete; destructive confirm modal vs inline per risk class | A06-3, A11-14 | B-4 |
| PD-28 | Invite fallback "Copy invite link" when email fails | A12-5 | B-5 |
| PD-29 | Canvas keyboard traversal keys; keyboard comment placement | A13-3, A13-5 | B-9 |
| PD-30 | Shell primitives: migrate the live shell or delete them | A11-1 | B-10 |
| PD-31 | Canonical chrome button height (28/32), modal radius (8/12), spacing scale (6/10), rail item size, tall row value, font self-hosting | A10 PD 1–7 | B-11 |
| PD-32 | Adopt axe and jsx-a11y as a ratchet, and at what initial severity | A13-20 | B-13 |
| PD-33 | "Bring Forward" = DOM order or z-order; what feeds the Issues chip | A08-6, A08-8 | B-14 |
| PD-34 | Comment pin visibility; tone for "Approved" | A08-13, A08-18 | B-14 |
| PD-35 | Overlay toggles behind a "View" popover; Inspector density mode; inline toolbar scope; PageTabBar role; Brand as a full page | A09 PD, A04 PD 6 | B-15 |
| PD-36 | CMS and components: multi-user resources or per-user local libraries | A16-8 | C-4 |
| PD-37 | **Live co-editing: replace (CRDT or server-authoritative) or repair; the two-client harness as the gate to enable it** | A07 PD 7, A16 PD 1, A20 PD 2 | C-5 |
| PD-38 | ⌘K "Clear history": keep with a confirm, or drop | A14-3 | C-6 |
| PD-39 | Localization: ship emission or reduce to the default language | A14-7 | C-7 |
| PD-40 | Media Trash: build soft-delete or remove the row; public API tokens: launch `scopedProcedure` or hide token creation | A14-12, A14 PD 5 | C-9, D-2 |
| PD-41 | Publish history retention (20 HTML payloads vs the data-at-rest rationale) | A17-2 | D-1 |
| PD-42 | Delete or build the stub email integrations and test-only UI | A17-12, A17-16 | D-6 |
| PD-43 | Supported document size and per-edit frame budget | A18 PD 1 | D-7, D-8, D-9, D-11 |
| PD-44 | Media thumbnail generation (cost and hosting) | A18-6 | D-10 |
| PD-45 | Version history locality (a local copy of every version or metadata only) | A18-7 | D-11 |
| PD-46 | Source-scan test policy (keep, convert or rename) | A20-7 | D-15 |

**Total: 46 decisions.** Each row already merges the restatements of one question across reports.

**Decisions on the P0 path:**
- PD-2: S-1b only. The allowlist half, S-1a, needs no decision.
- PD-5: the login-gate half of S-5. The non-destructive reclaim needs no decision.
- PD-6: S-6 clamp vs clear. The resolver `min()` is safe under either answer.
- PD-24: the DB tier needed to *prove* S-2, S-5 and S-6.

None of these decisions blocks the immediate P0 mitigation.

---

## Appendix A: Refuted P0s

**None.** All 15 P0 claims across the reports described a real mechanism. No verifier returned REFUTED or UNCERTAIN.

## Appendix B: Downgraded P0s (REAL_BUT_DOWNGRADE, verifier severity applied)

| Finding | Claimed | Final | Merged into | Verifier's reason (summarised) |
|---|---|---|---|---|
| A01-1 (theme push writes `projectStyles`) | P0 | **P1** | A-3 | The mechanism holds. It is gated on `agency_layer` (off by default), a pre-push snapshot and rollback exist, and the push bumps `lastEditedAt`. Recoverable, and the blast radius is narrow. |
| A01-2 (settings two writers) | P0 | **P1** | A-1 | The mechanism is real and traced end to end. Severity reduced because the lost update needs a second writer and hits settings, not content. |
| A02-1 (autosave reverts dashboard settings) | P0 | **P1** | A-1 | Same mechanism as A01-2. It runs in the same tick as `saveProject` and also when that save is refused. |
| A12-1 (settings mirror bypasses the conflict guard) | P0 | **P1** | A-1 | Same mechanism. |
| A16-1 (full-record settings rewrite from a stale copy) | P0 | **P1** | A-1 | The mechanism is confirmed. The verifier disputes only the P0 class. |
| A04-1 (Delete removes the hidden canvas element behind a full-screen surface) | P0 | **P2** | A-6 | Real (capture-phase listener, jsdom 3/3), but undoable with ⌘Z and it needs an unusual keystroke. |
| A07-1 (demotion keeps the override) | P0 | P1 per this verifier | S-6 | **Contradicted by the A19-7 verifier (CONFIRMED_P0).** Kept at P0 in this plan, flagged "needs human check". |
| A17-1 (read-then-write conflict check) | P0 | **P2** | A-2 | The code matches the claim, but it is a timing race that has not been reproduced against Postgres. A-2 is prioritised **P1** anyway because it also carries A07-6 (P1) and A12-4 (P1). |
| A19-6 (EDITOR self-approval) | P0 | **P1** | S-7 | The path works as described, but it bypasses an in-workspace governance control, not a data-security or cross-tenant boundary. It also needs `agency_layer` and `editsRequireApproval` on. |

## Appendix C: What this plan did NOT verify
- No fix target was exercised at runtime. There was no Postgres, browser, Vercel Blob, SMTP, cPanel crontab or second client.
- Production values of `NEXT_PUBLIC_FEATURE_PUBLISH` and `NEXT_PUBLIC_FEATURE_COLLAB`, the per-workspace `agency_layer` rows, the production Postgres `TimeZone`, and the LiteSpeed `X-Forwarded-For` behaviour.
- The P2 and P3 file references were taken from the reports, not re-read. Only the four P0 sites named in the header were re-read for this plan.
- The fix-count merges are Agent A's judgement. A finding listed under two fixes (for example A04-3 under A-6, whose palette consolidation is A-13) is owned by the first fix named.

---

**Awaiting approval — no code has been modified.**
