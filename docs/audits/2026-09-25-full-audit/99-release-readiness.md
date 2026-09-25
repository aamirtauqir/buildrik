# 99: Final Release-Readiness (Prompt 21, read-only)

Agent G (Verification) · 2026-09-25 · HEAD `76e853d` · READ-ONLY. **No code has been modified. No fixes were applied in this run** (founder instruction: audit only), so this is the verdict for the code as it stands at HEAD.

## Verdict

**NOT READY.**

The code at HEAD still has all 6 verified P0s from `90-fix-plan.md` §2, and I re-read every one of them in code for this report. On top of those, 8 of the 11 release criteria fail on findings verified in code. Two criteria cannot be judged, and none passes.

---

## Method and what was NOT verified

- **Inputs.** I read `PLAYBOOK.md` Prompt 21, `90-fix-plan.md` in full, `README.md`, and the relevant sections of reports 13, 14, 15 and 20. For the other reports I relied on their headline findings as merged in `90`. Severities follow `90`, which overrides the individual reports.
- **Spot-checks I ran myself.** Each is listed with its file:line below:
  - every verified P0;
  - every FAIL I assign that is not already a P0.
- **Tests I ran:**
  - `pnpm vitest run` on the 5 CommandPalette/CanvasEmptyCTA test files plus `__tests__/permission-service.test.ts` gave **4 failed, 85 passed** (89 tests in 6 files).
  - This reproduces the red suite (A20-6).
  - The permission test that passes is the one asserting that a VIEWER with an EDITOR override resolves to EDITOR (`permission-service.test.ts:66`), so the suite itself pins P0-6.
- **NOT RUNTIME VERIFIED.** There was no Postgres, browser, Vercel Blob, SMTP, cPanel crontab or second client. Nothing below was reproduced in a running app.
  - Every "VERIFIED" in this file means verified in code or in a unit/jsdom PoC.
  - These production values are unknown:
    - `NEXT_PUBLIC_FEATURE_COLLAB` and `NEXT_PUBLIC_FEATURE_PUBLISH`;
    - the per-workspace `agency_layer` rows;
    - the production Postgres `TimeZone`;
    - the LiteSpeed XFF behaviour;
    - the production crontab.
- **Not re-read.** I did not re-read the P2 and P3 file references. Where a category verdict rests on a P2 or P3, the verdict comes from the report.

---

## Category table (the 20 audits)

| # | Category | Result | One-line justification |
|---|---|---|---|
| 1 | Information architecture and ownership | **FAIL** | Site settings have two writers. `BuildrikSyncProvider.ts:192-222,405-421` sends every present settings field to `siteDetail.settings.update`, runs it in parallel with the conflict-checked save and gives it no version token, so an open editor reverts dashboard edits (A-1, P1, code-verified). |
| 2 | Module cohesion | PARTIAL | This category shares A-1's root cause. Otherwise it is parallel implementations that were never retired (palettes, settings UIs, catalogs), which are P2 and P3. |
| 3 | Navigation and discoverability | **FAIL** | Review is advertised through 5 doors, but `reviews.ts:62,137,203` calls `requireAgencyLayer`, so every door dead-ends when the layer is off (A03-1, P1). |
| 4 | Surface architecture | PARTIAL | The Settings unsaved-changes guard can be bypassed (A04-2, P1). Delete behind a full-screen surface was downgraded to P2. |
| 5 | Search architecture | PARTIAL | The Pages-drawer ⌘K opens two palettes and can leave a hidden modal that disables shortcuts (A05-1, P1, jsdom). |
| 6 | Interaction architecture | PARTIAL | Four P1s, none of them a P0: locked elements can be deleted, ⌘Z reverts saved settings, and form submissions are hard-deleted in one click. |
| 7 | Collaboration product | **FAIL** | P0-6: a demoted member keeps `roleOverride`. The comments and review model dead-ends when the layer is off. |
| 8 | Signifiers and affordances | **FAIL** | The page password is advertised but never enforced (A08-2 / B-3, P1). This is a misleading security affordance. |
| 9 | Cognitive load | PARTIAL | Staged Brand edits show "Unsaved" but cannot be saved (A09-1, P1). Otherwise the findings are overload (P2). |
| 10 | Typography, spacing and layout | PARTIAL | No P0 or P1. There is no size or type contract (P2 and P3). |
| 11 | Design-system consistency | PARTIAL | 12 hand-built dialogs have no focus trap, and the shell primitives have 0 consumers (P1 and P2). Nothing blocks release. |
| 12 | States, feedback and errors | **FAIL** | There are silent failures in critical paths. A settings-mirror error is only emitted after the primary save resolves. Invite emails are swallowed (A12-5, P1). A publish-poll failure freezes the panel (A12-3, P1). 44 mutations are silent on 4xx. |
| 13 | Accessibility | **FAIL** | The effect in `modal.tsx:27-70` depends on `[open, onClose]` (`:70`), so an inline `onClose` re-runs it on every keystroke and steals focus. Dashboard dialogs keep one typed character, for every user (A13-1, P1; code plus jsdom). |
| 14 | Functional wiring | **FAIL** | `useAISummary.ts:109` calls `fetch("/api/trpc/ai.summarize")` with raw JSON under a superjson transformer, which returns 400 (A14-1, reproduced at protocol level). Also, 18 cron routes exist but `docs/cpanel-deploy.md` documents triggers for only 2. The production crontab is NOT VERIFIED. |
| 15 | E2E cross-module flows | **FAIL** | If approval is on and the layer is off, only the OWNER can publish (A15-1). The publish gate at `publish.service.ts:271-299` does not check the layer, but review submission does. Publish has no freshness check (A15-2). Dashboard and scheduled publish send no pages (A15-4/5). |
| 16 | Collaboration runtime | **FAIL** | Autosave rewrites settings from a stale copy (A-1). The collab routes have no server-side kill switch: there is no env read in `api/collab/[siteId]/ops/route.ts` or in `sse/collab/[siteId]/route.ts`. CMS and component edits can be lost (C-4, P1). |
| 17 | Code architecture | **FAIL** | `completePublish` (`publish.service.ts:438`) has no production caller. The worker route writes its own terminal transaction (`workers/publish/[jobId]/route.ts:134-150`), so publish rollback and diff are dead (A17-2 / D-1, P1). |
| 18 | Performance | NOT VERIFIED | The P1 (whole-canvas re-serialize, A18-1) is static analysis only. No browser profile was possible. |
| 19 | Security and permissions | **FAIL** | 6 verified P0s. See the blockers below. |
| 20 | Test coverage | **FAIL** | The suite is red: I reproduced 4 failures. There is no DB tier, no real editor E2E, 19 of 33 routers are untested, and collab covers 0 of 11 scenarios. A test pins P0-6 as intended behaviour. |

**Totals: 12 FAIL, 7 PARTIAL, 1 NOT VERIFIED, 0 PASS.**

---

## Release criteria (Prompt 21)

| Criterion | Result | Evidence |
|---|---|---|
| No P0 | **FAIL** | P0-1 to P0-6 are all present at HEAD. |
| No critical dead end | **FAIL** | Two dead ends: the approval deadlock (approval ON, layer OFF, so only the OWNER can publish; A15-1) and the Review doors when the layer is off (A03-1). Both depend on configuration. |
| No misleading exposed feature | **FAIL** | The page password is not enforced (A08-2). The sharing-policy UI is not enforced (A07-8). The History AI summary is always 400 (A14-1). |
| No broken return path | NOT VERIFIED | Sticky deep links (A03-2, P1) land users on the wrong sub-screen, but this is static only. No return path was proven broken at runtime. |
| No major ownership violation | **FAIL** | Site settings have two writers, and one of them has no concurrency token (A-1). |
| No silent critical failure | **FAIL** | Four silent failures: the settings mirror revert, swallowed invite email errors, a false restore result toasted as success (A15-6), and crons that possibly never run (C-2, PARTIAL). |
| No collab data-loss risk | **FAIL** | A-1 (a stale full-record settings rewrite) and C-4 (CMS and component lost updates) are real in production. They do not depend on the collab flag. |
| No unauthorized realtime access | **FAIL** | The collab routes are live whatever the client flag says. Authz is checked at connect only (S-12), and P0-6 lets a demoted VIEWER keep EDITOR on collab ops. |
| No critical a11y blocker | **FAIL** | A13-1: text entry in dashboard dialogs is broken (jsdom-verified; browser NOT RUNTIME VERIFIED). |
| No known authz bypass | **FAIL** | P0-2, P0-3, P0-4 and P0-6. |
| Critical E2E and collab flows working and tested | **FAIL** | There is no DB-backed or real-editor E2E. The suite is red. Collab has 0 of 11 scenarios. |

---

## Verified remaining blockers

### Blocker 1: P0-1, stored XSS in the editor canvas

- **Finding:** Stored XSS in the editor canvas.
- **Severity:** **P0 — IMMEDIATE FIX REQUIRED**
- **File:line:**
  - `lib/sanitize-blocks.ts:21-57`
  - `packages/editor/src/engine/elements/ElementSerialization.ts:64-80`
  - `packages/dashboard/next.config.mjs:13-16`
- **Symbol:** `sanitizeNode`, `toHTML`
- **Evidence:**
  - `sanitizeNode` sanitizes only `content`, plus `on*` attributes and `javascript:`/`data:` values in URL attributes.
  - `tagName` is never checked.
  - `srcdoc` is not in `URL_ATTRS`.
  - `toHTML` interpolates the tag directly: `` `<${tag}${attrs}>` ``.
  - The production CSP keeps `'unsafe-inline'`.
- **Expected:** An allowlist of tags and attributes.
- **Root cause:** A denylist sanitizer feeding a same-origin `innerHTML` canvas.
- **Affected modules:** Canvas, pages, components, templates, versions.
- **Recommendation:** S-1a.
- **Status:** VERIFIED in code. Browser execution NOT RUNTIME VERIFIED.

### Blocker 2: P0-2, cross-tenant page overwrite and delete (IDOR)

- **Finding:** Cross-tenant page overwrite and delete.
- **Severity:** **P0 — IMMEDIATE FIX REQUIRED**
- **File:line:**
  - `server/trpc/routers/pages.ts:55-69`
  - `server/services/page.service.ts:95-129`
- **Symbol:** `updatePage`, `deletePage`
- **Evidence:**
  - The router guards `input.siteId`.
  - The service finds and writes by `pageId` only, with no `existing.siteId === input.siteId` check.
  - `deletePage` also decrements the page counter on the wrong site.
- **Expected:** `where: {id, siteId}`.
- **Root cause:** It authorizes one id and writes another.
- **Affected modules:** Pages, forms.
- **Recommendation:** S-2.
- **Status:** VERIFIED in code.

### Blocker 3: P0-3, any user can overwrite any site's favicon, touch-icon or og-image

- **Finding:** Any signed-in user can overwrite any site's favicon, touch-icon or og-image.
- **Severity:** **P0 — IMMEDIATE FIX REQUIRED**
- **File:line:**
  - `server/trpc/routers/upload.ts:8-11`
  - `server/services/upload.service.ts:22-47`
  - `packages/dashboard/app/api/upload/[fileId]/route.ts:67-95`
- **Symbol:** `presign`, `buildBlobPath`
- **Evidence:**
  - `presign` has no site role check.
  - `input.siteId` is stored as-is.
  - The PUT checks only `pending.userId`.
  - The key `sites/${siteId}/favicon${ext}` is combined with `addRandomSuffix:false, allowOverwrite:true`.
- **Expected:** `checkSiteRole` at both presign and PUT, and unguessable keys.
- **Root cause:** `siteId` is treated as a label, not authorized.
- **Affected modules:** Site settings and published sites.
- **Recommendation:** S-3.
- **Status:** VERIFIED in code. Blob overwrite NOT RUNTIME VERIFIED.

### Blocker 4: P0-4, cross-tenant blob deletion

- **Finding:** Cross-tenant blob deletion.
- **Severity:** **P0 — IMMEDIATE FIX REQUIRED**
- **File:line:**
  - `server/services/media.service.ts:53-80,135-170,320-360`
  - `packages/shared/schemas/media.ts:57`
- **Symbol:** `assertUrlNotOwnedByOther`, `deleteAsset`
- **Evidence:**
  - The ownership guard consults only `MediaAsset` and `MediaAssetVersion` rows.
  - Favicon, og and avatar blobs from `/api/upload` have no such row.
  - So `createAsset({url: <victim favicon>})` passes, and `deleteAsset` then calls `del(url)` once the reference count is 0.
- **Expected:** Delete only URLs issued to this user.
- **Root cause:** Blob ownership is inferred from rows that only one of the three upload paths writes.
- **Affected modules:** Media, settings, avatars.
- **Recommendation:** S-4.
- **Status:** VERIFIED in code. Blob behaviour NOT RUNTIME VERIFIED.

### Blocker 5: P0-5, anonymous signup deletes an unverified user's account

- **Finding:** An anonymous signup deletes an unverified, in-use account and every workspace it owns.
- **Severity:** **P0 — IMMEDIATE FIX REQUIRED**
- **File:line:**
  - `server/services/auth.service.ts:152-181`
  - `login` at `:96-150`
- **Symbol:** `signup`
- **Evidence:**
  - An existing unverified row triggers `workspace.deleteMany({ownerId})` followed by `user.delete`.
  - `login` never checks `emailVerified`, so unverified users can actively use the product.
- **Expected:** A reclaim that deletes nothing.
- **Root cause:** Two contradictory policies: "unverified means reclaimable" and "unverified can use the product".
- **Affected modules:** Auth, workspaces, sites.
- **Recommendation:** S-5 (the minimal half).
- **Status:** VERIFIED in code. Not run against a DB.

### Blocker 6: P0-6, a demoted member keeps their site role override

- **Finding:** A demoted member keeps their site role override.
- **Severity:** **P0 — IMMEDIATE FIX REQUIRED (the verifiers split; needs a human severity check)**
- **File:line:**
  - `server/services/team.service.ts:135-166`
  - `server/services/permission.service.ts:113-115`
- **Symbol:** `changeRole`, `getEffectiveSiteRole`
- **Evidence:**
  - `changeRole` updates only `workspaceMember.role`.
  - The resolver returns `row?.roleOverride ?? member.role`.
  - `permission-service.test.ts:66` passes and asserts that the override upgrades access.
- **Expected:** The override is clamped to at most the member's role.
- **Root cause:** The role is stored in two places.
- **Affected modules:** Team, and every site-write gate, including collab ops.
- **Recommendation:** S-6.
- **Status:** VERIFIED in code and in the test.

### Blocker 7: A-1, the settings mirror silently reverts dashboard edits

- **Finding:** The editor autosave silently reverts dashboard site-settings edits.
- **Severity:** P1 (release-blocking: an ownership violation, silent data loss and a collab data-loss risk)
- **File:line:** `packages/editor/src/services/BuildrikSyncProvider.ts:192-222,397-445`
- **Symbol:** `extractSiteColumnPatch`, `saveProject`
- **Evidence:**
  - The patch includes every field present in `projectData.settings`; it is not a diff.
  - It is sent alongside `sites.saveProject` in the same tick.
  - It carries no `expectedLastEditedAt`.
- **Expected:** A diff-only update, chained after a successful save.
- **Root cause:** Two writers, and only one of them has its conflicts checked.
- **Affected modules:** Settings, SEO, publish output.
- **Recommendation:** A-1 with A-4.
- **Status:** VERIFIED in code. The two-tab reproduction is NOT RUNTIME VERIFIED.

### Blocker 8: A13-1, dashboard dialogs drop typed input

- **Finding:** Dashboard dialogs keep only one typed character.
- **Severity:** P1 (a critical a11y and functional blocker)
- **File:line:** `packages/dashboard/components/dashboard/primitives/modal.tsx:27-70`
- **Symbol:** `Modal`
- **Evidence:**
  - The effect's dependencies are `[open, onClose]`.
  - The cleanup refocuses the trigger, and the re-run focuses the panel.
  - The jsdom probe typed "Homepage" and the field kept a single character.
- **Expected:** Keep `onClose` in a ref and depend on `[open]` only.
- **Root cause:** An unstable callback in the effect's dependencies.
- **Affected modules:** At least 7 dashboard dialogs.
- **Recommendation:** B-6.
- **Status:** VERIFIED in code and jsdom. Browser NOT RUNTIME VERIFIED.

### Blocker 9: D-15a, the full vitest suite is red

- **Finding:** Every full vitest run is red.
- **Severity:** P1 (for release purposes: regressions from any fix batch are invisible)
- **File:line:**
  - `packages/editor/src/editor/shell/modals/__tests__/CommandPalette.test.tsx:154`
  - `CanvasEmptyCTA.test.tsx`
- **Evidence:** I ran the tests myself: 4 failed, 85 passed.
- **Recommendation:** D-15a.
- **Status:** VERIFIED (test output).

### Conditional blockers (configuration-dependent, verified in code)

- **A15-1, approval deadlock.** Workspaces with `editsRequireApproval` on and `agency_layer` off end up with only the OWNER able to publish:
  - the publish gate is at `publish.service.ts:271-299`;
  - `reviews.submit` calls `requireAgencyLayer` (`reviews.ts:62`).
- **S-12, collab routes live in production.** The collab routes have no server kill switch. This becomes P0 if `NEXT_PUBLIC_FEATURE_COLLAB` is ever on (production value NOT VERIFIED).

### Not verified, may block

- **Crons (C-2).** 16 of 18 cron routes may never run in production, including billing dunning and downgrade and account deletion. The production crontab is NOT VERIFIED.
- **Login-throttle bypass (A20-5).** `peekRateLimit` becomes a throttle bypass if the production Postgres `TimeZone` has a negative UTC offset. The production `TimeZone` is NOT VERIFIED.

---

## Overlaps

These are observations for other audits. I did not audit them here.

- **Severity counts (Agent A).** I did not re-derive the P2 and P3 counts in `90`. I used its final severities as given.
- **A test pins a P0 (Agent F / D-15).** `permission-service.test.ts:66` pins P0-6 as intended behaviour. The S-6 fix must invert that test in the same change.

---

**READ-ONLY. No production code, tests or config were modified.**
