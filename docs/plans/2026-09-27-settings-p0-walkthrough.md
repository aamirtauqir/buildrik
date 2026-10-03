# Settings P0 fixes: walkthrough evidence

- **Date:** 2026-09-28
- **Branch:** `fix/settings-p0`, code HEAD `d91760e78` (not pushed)
- **Plan:** `docs/plans/2026-09-27-settings-p0-fixes.md`
- **Spec:** `docs/plans/2026-09-27-settings-architecture-proposal.md` (SA-01 was reclassified there to a P1 source-of-truth fix)

## Setup

- **Dashboard:** `next dev --turbopack -p 3200` from this worktree, with `NEXT_PUBLIC_UNIFIED_EDITOR=true` and `PUBLISH_ALLOW_SIMULATION=true`.
  - The worktree had no `packages/dashboard/.env.local`, so Next saw only `DATABASE_URL`. I added a symlink `packages/dashboard/.env.local -> ../../.env.local` (gitignored), the same as in the founder checkout.
- **Browser:** gstack browse at 1440x900.
- **Login:** `qa@buildrik.local`, workspace `E2E Blank WS 0a95fc` (`cmpa9oi4n0001wrjuvh7j2h8m`).
- **Database:** the shared local Postgres, `localhost:5432/buildrik`. All three P0 migrations were already applied (`_prisma_migrations`: `20261003120000`, `20261003130000`, `20261003140000`).
- **Screenshots:** `docs/plans/settings-p0-walkthrough/`.

**Publishing was real, not simulated.** The QA workspace has an active Vercel connection, so the worker ran `mode=vercel` (`[publish-worker] … mode=vercel`). As a result, throwaway site A was deployed to the connected Vercel account twice and then taken down by the delete. The real Vercel take-down was therefore verified; see SA-07.

## 1. Suites

| # | Command (cwd) | Exit | Result |
|---|---|---|---|
| 1 | `pnpm vitest run __tests__` (root) | 1 | 1304 files, 1 failed / 1303 passed. 12623 tests: 1 failed, 12597 passed, 3 skipped, 22 todo. 1678 s, run while the live walk loaded the machine. |
| 1a | The failing file alone, 15 runs on the branch (root config) | 0 in 14/15 | `AnalyticsScreen.test.tsx`, "re-reads the status, stamps verifiedAt…": `onDirtyChange` last called with `false`, expected `true`. It failed 1 of 15 isolated runs. |
| 1b | The same file on `main` (`8e9a3ccb2`, throwaway `git worktree add --detach /tmp/p0-main-check`, removed afterwards), 20 runs | 0 | 20/20 passed. |
| 2 | `pnpm test:db` (root) | 0 | 20 files, 78 tests passed. |
| 3 | `npx vitest run` (`packages/editor`) | 0 | 1187 files; 11548 tests passed, 22 todo. 910 s. |
| 4 | Dashboard tests. `packages/dashboard/package.json` has no unit-test script; its tests run under the root config. `vitest run packages/dashboard` (root) | 0 | 90 files, 331 passed. |
| 4a | `vitest run packages/dashboard server lib` (root). This also covers colocated tests the `__tests__` filter misses, such as `route.vercel-project-name.test.ts`. | 0 | 237 files, 1658 passed. |
| 5 | `npx tsc --noEmit` (`packages/editor`) | 0 | no output |
| 6 | `npx tsc --noEmit` (`packages/dashboard`) | 0 | no output |
| 7 | `pnpm run verify:ds` (`packages/editor`; the root `package.json` has no such script, and the pre-push hook runs it from `packages/editor`) | 0 | all gates PASS. `scripts/baselines/ssot.json` unchanged. |
| 8 | `pnpm run gate:ds` / `gate:figma` / `gate:trpc-orphans` (`packages/dashboard`, the rest of the pre-push chain) | 0 / 0 / 0 | 7 passed / 17 Figma + 2 keeps, 0 problems / 28 orphans, all accounted for |

**Classification of the one failure: pre-existing flake, not introduced.**

- The branch touches neither `AnalyticsScreen.tsx` nor its test, and changes nothing that the screen imports at runtime. Its only branch-touched import is a type import from `site-detail` schemas.
- The failing assertion is about the timing of the dirty callback.
- Task 8's report records the same test failing once under load before any Task 8 change (`task-8-report.md:108`).
- It did not reproduce on `main` in 20 isolated runs. Treat it as a timing flake that is more likely under load; it is not a regression.

## 2. Per-fix walkthrough

The throwaway objects I created are:

- site **A** `cmukdlv330008pdrj2p3saale`, "p0-walk-throwaway-a"
- site **C** `cmukdv8r1000xpdrjwj63g56i`, created to test C1
- site **D** `cmuke3c0b0019pdrjvek2xk3x`, "p0-walk-sa01-d"
- workspaces **WS1** `cmukecek3001kpdrjconjjnme` and **WS2** `cmukeeyzi001opdrjl43z26b0`
- user `p0walk2fauser000000000001`

The scratch site `scratchver0000000000000001` was only read (`sites.get`). Its `lastEditedAt` is still `2026-09-27 15:49:26.044`.

| Fix | Action | Expected | Observed (measured) | Screenshot | Result |
|---|---|---|---|---|---|
| SA-02 | Set a site password on A (dashboard Settings → Site password → Save; column now 87 chars of ciphertext), then `GET sites.get` for A. Also replayed the editor's own load batch (`account.profile.get,sites.get,pages.list,siteDetail.settings.get`). | No `publishedPassword` key; `hasPublishedPassword` present. | `hasOwnProperty("publishedPassword") = false`, `hasPublishedPassword = true`. In the editor batch, the only key matching `/password/i` is `hasPublishedPassword`. | `sa02-sites-get.png` | PASS |
| SA-03 | Throwaway user (SQL, below) logged in. Called `account.twoFactor.enable` with 2FA off, set `twoFactorEnabled=true` (SQL), then called it again. | CONFLICT with the new message; the secret is not rotated. | 2FA off: HTTP 200 (`otpauth://…`). 2FA on: **HTTP 409** `CONFLICT` "Two-factor is already on. Turn it off first to set up a new authenticator." `md5(twoFactorSecret)` was `d7cf352b…` before and after. | `sa03-enable-conflict.png` | PASS |
| SA-04 copy | WS1 → Settings → Delete workspace or account. | Honest copy: 30-day grace period, cancellable. | Danger row: "Permanently delete this workspace and all its data. You can cancel within 30 days." Modal: "Your workspace will be deleted 30 days from now. Until then you can cancel from the dashboard home page. / On that date every site is taken offline, the subscription is cancelled, and all sites, forms, members and data are removed for good." | `sa04-danger-page.png`, `sa04-delete-modal.png` | PASS (see concerns 3 and 4) |
| SA-04 schedule + cron | Typed the name and confirmed. Then backdated only WS1 (SQL) and called `GET /api/cron/workspace-deletion` without and with the bearer. | Scheduled +30 d; 401 without auth; only WS1 deleted. | `account.workspace.delete` 200, `deletionScheduledAt = 2026-10-27 22:36:02`. Before the call, WS1 was the **only** row with a due date. No bearer → **401**. Bearer → **200 `{"deleted":1,"skipped":0}`**. WS1 rows: 0; its memberships: 0; QA workspace rows: 1. | — | PASS |
| SA-04 banner + cancel | WS2: scheduled through the modal, looked at Home, reloaded, clicked "Cancel Deletion". | Owner sees the banner and can cancel. | After the modal's client navigation to `/dashboard`, the banner was **absent** (`/scheduled for deletion/` false). After a reload it was present: "Your workspace is scheduled for deletion on 10/28/2026." Cancel → `account.workspace.cancelDelete` 200, banner gone, `deletionScheduledAt` NULL. | `sa04-home-after-nav.png`, `sa04-home-banner.png` | PASS after reload (concern 3) |
| SA-05 | Forced the worst case on A with SQL (`localeAutoRedirect=true`, `enabledLocales={en,fr}`, JSON `localization.autoRedirect=true`). Opened editor Settings › Localization. Captured the `sites.publish` request body with a fetch hook. | No Auto-redirect row; no `brk-locale-redirect` in the HTML. | Localization page text: `/auto-?redirect/i` false; the only "redirect" string on the page is the "Redirects" nav item. Publish body: 1 page, 1368 bytes. `brk-locale-redirect` false, `sessionStorage` false, `navigator.language` false. | `sa05-localization.png` | PASS |
| SA-06 format | Dashboard A → Settings → Slug `BAD SLUG!!` → Save. | Refused with the rule text. | `siteDetail.settings.update` **400**; toast "Failed to save / slug: Use lowercase letters, numbers and single dashes". | `sa06-bad-slug.png` | PASS |
| SA-06 taken | Slug `scratch-ver` (the scratch site's slug) → Save. | "Another site already uses that URL slug." | **409**, toast "Another site already uses that URL slug." Nothing written. | `sa06-taken-slug.png` | PASS |
| SA-06 pin | A published for real (job `cmukdtqio…`, `dpl_5fQ6…`, pinned `buildrik-site-p0-walk-throwaway-a`). Changed the slug to `p0-walk-renamed-a` in the dashboard, then republished from the editor. | The slug change keeps the project; the republish goes to the same project and URL. | After the change: `slug=p0-walk-renamed-a`, `vercelProjectName=buildrik-site-p0-walk-throwaway-a` (unchanged), and `slug_history` has the row `p0-walk-throwaway-a → p0-walk-renamed-a`. Republish: job 2 COMPLETED (`dpl_AHEP…`), `publishedUrl` still `https://buildrik-site-p0-walk-throwaway-a.vercel.app`, URL HTTP 200. | `sa06-publish-panel.png`, `sa06-republish-same-project.png` | PASS. The pin was written by the real-deploy post-deploy path. The simulation-only "pin on slug change" path (`hasEverDeployed`) was not exercised live; it is covered by unit tests. |
| C1 | With A renamed (slug `p0-walk-throwaway-a` free, project name still pinned by A): (a) `sites.create` "p0-walk-throwaway-a"; (b) `siteDetail.settings.update` C.slug → `p0-walk-throwaway-a`. | A new site cannot take a slug whose project name is pinned. | (a) C got slug **`p0-walk-throwaway-a-2`**. (b) **409** "Another site already uses that URL slug." | — | PASS |
| SA-07 | Sites list page 2 → A "More options" → Delete → typed the name → Delete Site. | DRAFT/offline, soft-deleted, `site.deleted` activity, deployment down. | `sites.delete` 200. Row: `status=DRAFT`, `publishedUrl=NULL`, `deletedAt=2026-09-27 22:34:14`. `activity_logs`: `site.deleted` "Site deleted" (`cmukebhsd…`). The live URL went 200 → **404 `DEPLOYMENT_NOT_FOUND`** (real Vercel). | `sa07-delete-confirm.png` | PASS (concern 2) |
| SA-08 | Dashboard A → Social Links: Twitter `https://x.com/p0walk` + Instagram `https://instagram.com/p0walk` → Save. Editor → Settings › General (Twitter field shows the row value), edited Author → Save (`sites.saveProject`, `siteDetail.settings.update`, `sites.saveProject`, all 200). | Instagram survives the editor's General save. | Column before: `{"twitter":…,"instagram":…}`. After: `{"twitter": "https://x.com/p0walk", "facebook": "", "linkedin": "", "instagram": "https://instagram.com/p0walk"}`. JSON `projectSettings.seo` = `{}` (the SA-01 strip). | `sa08-dashboard-instagram.png` (the editor-side capture came out blank and site A is deleted, so the editor half rests on the network log and the column read) | PASS |
| SA-01 load | D: seeded a JSON-only `seo.metaTitle` (column NULL), then ran the migration's `metaTitle` backfill statement scoped to D in a transaction. Opened editor Settings › SEO defaults. | The value shows in Settings › SEO. | Column `metaTitle = "P0 Walk JSON-only Title"` (trimmed). Input `seo-meta-title` value `P0 Walk JSON-only Title`. | `sa01-seo-json-only-title.png` | PASS |
| SA-01 export | The site `metaTitle` never reaches `<title>`: `resolvePageTitle` uses page SEO → page title → page name (`SEOInjector.ts:39`, unchanged on this branch), so the export showed `<title>Home</title>`. To check the export path, I seeded a JSON-only `seo.metaTitleTemplate` `{page_title} — P0 Walk`, backfilled it, reloaded, and captured the publish body with a fetch hook that **blocked** the request (0 publish jobs for D). | The backfilled column reaches the export. | `index.html: <title>Home — P0 Walk</title>`. | `sa01-publish-blocked.png` | PASS |
| SA-01 strip | Wrote a JSON-only `seo.metaDescription` after the migration (SQL), then saved from the editor (SEO › Twitter Handle → Save). | The JSON-only value is stripped on the next save, and the column is not filled from it. | Before: `projectSettings.seo = {"metaDescription": "JSON-only desc written after the migration"}`. After: `{"twitterHandle": "@p0walk"}`; `metaDescription` column NULL. An earlier autosave had already stripped `seo.metaTitle` from the JSON while the column kept it. | — | PASS |

## 3. SQL log (shared DB; every statement I ran that writes)

```sql
-- SA-05 worst-case inputs on throwaway site A
UPDATE sites SET "localeAutoRedirect" = true, "enabledLocales" = ARRAY['en','fr'],
  "projectSettings" = jsonb_set("projectSettings"::jsonb, '{localization}', '{"autoRedirect": true, "defaultLocale": "en", "enabledLocales": ["en","fr"]}')
  WHERE id = 'cmukdlv330008pdrj2p3saale';

-- SA-01 seed + scoped backfill on throwaway site D
UPDATE sites SET "projectSettings" = jsonb_set(coalesce("projectSettings",'{}'::jsonb), '{seo}',
  coalesce("projectSettings"->'seo','{}'::jsonb) || '{"metaTitle":"  P0 Walk JSON-only Title  "}'::jsonb)
  WHERE id = 'cmuke3c0b0019pdrjvek2xk3x' AND "metaTitle" IS NULL;
BEGIN;
UPDATE "sites" SET "metaTitle" = btrim("projectSettings" #>> '{seo,metaTitle}')
WHERE "metaTitle" IS NULL AND jsonb_typeof("projectSettings" #> '{seo,metaTitle}') = 'string'
  AND btrim("projectSettings" #>> '{seo,metaTitle}') <> '' AND id = 'cmuke3c0b0019pdrjvek2xk3x';
COMMIT;
UPDATE sites SET "projectSettings" = jsonb_set("projectSettings", '{seo,metaDescription}', '"JSON-only desc written after the migration"')
  WHERE id = 'cmuke3c0b0019pdrjvek2xk3x';
UPDATE sites SET "projectSettings" = jsonb_set("projectSettings", '{seo,metaTitleTemplate}', '"{page_title} — P0 Walk"')
  WHERE id = 'cmuke3c0b0019pdrjvek2xk3x' AND "metaTitleTemplate" IS NULL;
BEGIN;
UPDATE "sites" SET "metaTitleTemplate" = btrim("projectSettings" #>> '{seo,metaTitleTemplate}')
WHERE "metaTitleTemplate" IS NULL AND jsonb_typeof("projectSettings" #> '{seo,metaTitleTemplate}') = 'string'
  AND btrim("projectSettings" #>> '{seo,metaTitleTemplate}') <> '' AND id = 'cmuke3c0b0019pdrjvek2xk3x';
COMMIT;

-- SA-04: backdate ONLY the throwaway workspaces (each checked to be the sole due row first)
-- (a first attempt used now() - 1 minute; the column is UTC-naive and the session is +05, so that was 5 h in the
--  future and nothing was due. Corrected to UTC:)
UPDATE workspaces SET "deletionScheduledAt" = now() - interval '1 minute' WHERE id = 'cmukecek3001kpdrjconjjnme';
UPDATE workspaces SET "deletionScheduledAt" = (now() AT TIME ZONE 'UTC') - interval '1 minute' WHERE id = 'cmukecek3001kpdrjconjjnme';
UPDATE workspaces SET "deletionScheduledAt" = (now() AT TIME ZONE 'UTC') - interval '1 minute' WHERE id = 'cmukeeyzi001opdrjl43z26b0';

-- SA-03 throwaway user (bcrypt hash generated locally with bcryptjs)
INSERT INTO users (id, email, "fullName", "passwordHash", "emailVerified", "updatedAt")
VALUES ('p0walk2fauser000000000001', 'p0walk-2fa@buildrik.local', 'P0 Walk 2FA', '<bcrypt>', now(), now());
UPDATE users SET "twoFactorEnabled" = true WHERE id = 'p0walk2fauser000000000001';
```

### Cleanup

- **WS1 and WS2** were removed by the cron itself (`{"deleted":1}` each; FK cascade). WS2 was re-scheduled through `account.workspace.delete` after its cancel test.
- **Sites C and D** were first soft-deleted through `sites.delete`. Then all three sites were hard-deleted:

```sql
BEGIN;
DELETE FROM activity_logs WHERE "siteId" IN ('cmukdlv330008pdrj2p3saale','cmukdv8r1000xpdrjwj63g56i','cmuke3c0b0019pdrjvek2xk3x');  -- 10 rows
DELETE FROM sites WHERE id IN ('cmukdlv330008pdrj2p3saale','cmukdv8r1000xpdrjwj63g56i','cmuke3c0b0019pdrjvek2xk3x')
  AND "createdBy" = 'cmpa9ohx10000wrjux4ecumzo' AND name LIKE 'p0-walk-%';                                                  -- 3 rows; FKs cascade
COMMIT;
BEGIN;
DELETE FROM login_attempts WHERE "userId" = 'p0walk2fauser000000000001' OR email = 'p0walk-2fa@buildrik.local';        -- 1
DELETE FROM audit_logs WHERE "userId" = 'p0walk2fauser000000000001';                                                     -- 2
DELETE FROM users WHERE id = 'p0walk2fauser000000000001' AND email = 'p0walk-2fa@buildrik.local';                      -- 1
COMMIT;
```

**Checks afterwards:**

- 0 sites named `p0-walk-%`.
- 0 workspaces named `P0 Walk%`.
- 0 users `p0walk-2fa@…`.
- 0 workspaces with `deletionScheduledAt` set.
- The QA session was switched back to the QA workspace.

**Left behind outside the DB:** the Vercel **project** `buildrik-site-p0-walk-throwaway-a` on the QA workspace's connected Vercel account. Delete takes down only the latest deployment and keeps the project, as designed. The first deployment `dpl_5fQ6GEDHSPpTjkKRafD8ibGV2qd7` may also still exist there. Remove both by hand in the Vercel dashboard.

## 4. Not verified

- **Real Stripe cancel.** Neither throwaway workspace had a Subscription row. The Stripe branch of `processDueWorkspaceDeletions`, including a Stripe error causing skip-and-retry, was not exercised. Unit tests only.
- **The real production deploy** and `prisma migrate deploy` against prod. Everything here ran on the shared local DB, where the migrations were already applied.
- **The prod duplicate-pin check** and the prod JSON-only before-count. Those are the founder steps in the checklist below.
- **The simulation-publish "pin on slug change" path** (`hasEverDeployed`, a COMPLETED job on a never-pinned site). This workspace publishes to real Vercel, so the pin came from the post-deploy write instead. Unit and DB tests only.
- **The publish worker's `assertProjectNameFree` refusal** for a legacy unpinned site whose name another site holds, and **`connectDomain`'s `PROJECT_NAME_TAKEN`**. Unit tests only.
- **Real Vercel take-down of older deployments.** Only the latest deployment is deleted (pre-existing `unpublishSite` behaviour).
- **Non-owner roles live.** The owner-only banner cancel (I5) and EDITOR/VIEWER views of `sites.get` were not walked; the QA user is OWNER.
- **The editor Export modal's download.** The export was read from the `sites.publish` request body, which uses the same `exportPublishPages` path, not from the downloaded ZIP.

## 5. Concerns found live

1. **The Vercel connection makes dev publishes real.** Under `PUBLISH_ALLOW_SIMULATION=true`, a workspace with an active Vercel connection still deploys for real. The QA workspace has one, so a "throwaway" publish reaches a real Vercel account and leaves a project behind.
2. **Delete removes only the latest deployment.** `unpublishSite` deletes only the most recent COMPLETED deployment. The production alias dies (404 observed), but earlier deployments and the project remain on the customer's Vercel account.
3. **The SA-04 banner is stale after scheduling.** The modal navigates client-side to `/dashboard` without invalidating `account.workspace.get`, so the "cancel from the dashboard home page" banner the copy promises appears only after a reload. The same `onSuccess` also toasts **"Workspace deleted"** for what is a scheduling. Both lines predate this branch, but they contradict SA-04's new honest copy.
4. **The danger page subtitle contradicts the new copy.** It still reads "Permanent, and not reversible" (`components/dashboard/shell/settings-sections.ts`), right above "You can cancel within 30 days."
5. **Workspace deletion exposes a split active-workspace fallback. This is a safety issue.** SA-04 makes deletion real, so a session's active workspace can now disappear. When it does:
   - The switcher falls back to the most recently joined workspace (`workspace-switcher.tsx:27`, `joinedAt desc`).
   - The server falls back to an unordered `findFirst` membership (`account.ts` `getWorkspaceCtx`).

   Observed: after WS1 was deleted, the switcher showed "P0 Walk Throwaway WS2", while the danger page's Delete modal targeted **"E2E Blank WS 0a95fc"**, the QA workspace. Only the type-the-name confirmation made the mismatch visible, and I cancelled. Before this branch, deletion never ran, so this state was unreachable.

## 6. Deploy checklist (in this order)

All SQL runs against prod over the SSH tunnel. `$PROD_DATABASE_URL` below is the tunnelled connection string.

1. **Snapshot BEFORE migrate.** The backfill writes columns; this is the way back for them:
   ```sql
   CREATE TABLE sites_projectsettings_bak_20261003 AS SELECT id, "projectSettings", "headCode", "bodyCode", "metaTitle", "metaDescription", "metaTitleTemplate", "ogImage", "favicon", "touchIcon", "robotsTxt", "socialLinks" FROM sites;
   ```
   Drop it (`DROP TABLE sites_projectsettings_bak_20261003;`) once SA-01 is verified in prod.
2. **The JSON-only before-count (read-only).** These are the rows the backfill will fill, using the same filters as `20261003130000`. Keep the numbers:
   ```sql
   SELECT
     count(*) FILTER (WHERE "metaTitle" IS NULL AND jsonb_typeof("projectSettings" #> '{seo,metaTitle}')='string' AND btrim("projectSettings" #>> '{seo,metaTitle}')<>'') AS meta_title,
     count(*) FILTER (WHERE "metaDescription" IS NULL AND jsonb_typeof("projectSettings" #> '{seo,metaDescription}')='string' AND btrim("projectSettings" #>> '{seo,metaDescription}')<>'') AS meta_description,
     count(*) FILTER (WHERE "metaTitleTemplate" IS NULL AND jsonb_typeof("projectSettings" #> '{seo,metaTitleTemplate}')='string' AND btrim("projectSettings" #>> '{seo,metaTitleTemplate}')<>'') AS title_template,
     count(*) FILTER (WHERE "ogImage" IS NULL AND jsonb_typeof("projectSettings" #> '{seo,defaultOgImage}')='string' AND btrim("projectSettings" #>> '{seo,defaultOgImage}')<>'') AS og_image,
     count(*) FILTER (WHERE "favicon" IS NULL AND jsonb_typeof("projectSettings" #> '{seo,favicon}')='string' AND btrim("projectSettings" #>> '{seo,favicon}')<>'') AS favicon,
     count(*) FILTER (WHERE "touchIcon" IS NULL AND jsonb_typeof("projectSettings" #> '{seo,touchIcon}')='string' AND btrim("projectSettings" #>> '{seo,touchIcon}')<>'') AS touch_icon,
     count(*) FILTER (WHERE "robotsTxt" IS NULL AND jsonb_typeof("projectSettings" #> '{seo,robotsTxt}')='string' AND btrim("projectSettings" #>> '{seo,robotsTxt}')<>'') AS robots_txt,
     count(*) FILTER (WHERE "headCode" IS NULL AND jsonb_typeof("projectSettings" #> '{customCode,headScripts}')='string' AND btrim("projectSettings" #>> '{customCode,headScripts}')<>'') AS head_code,
     count(*) FILTER (WHERE "bodyCode" IS NULL AND jsonb_typeof("projectSettings" #> '{customCode,bodyScripts}')='string' AND btrim("projectSettings" #>> '{customCode,bodyScripts}')<>'') AS body_code,
     count(*) FILTER (WHERE "socialLinks" IS NULL AND jsonb_typeof("projectSettings" #> '{seo,socialLinks}')='object' AND NOT EXISTS (SELECT 1 FROM jsonb_each("projectSettings" #> '{seo,socialLinks}') e WHERE jsonb_typeof(e.value) <> 'string')) AS social_links
   FROM sites;
   ```
3. **The backlog for the new cron (read-only).** The first `workspace-deletion` run deletes every workspace already past its date:
   ```sql
   SELECT count(*) FROM workspaces WHERE "deletionScheduledAt" <= now();
   ```
4. **Run `prisma migrate deploy`.** This applies the three migrations: `20261003120000_settings_p0_vercel_project_name`, `20261003130000_settings_p0_settings_backfill` and `20261003140000_settings_p0_vercel_project_name_unique`. No pre-check for duplicate `vercelProjectName` values is needed: the column does not exist in prod before the first migration and starts all-NULL, so the unique index has nothing to collide with.
5. **Deploy the code.** Only after the migrations: an editor bundle that reads columns only, served before the backfill, loads JSON-only fields empty, and its next publish drops them.
6. **Re-run the backfill once**, after the deploy and after old editor tabs have reloaded. An old tab still saves settings into the JSON only, so values written during the deploy window miss their column. The backfill is idempotent and only fills NULL columns:
   ```bash
   psql "$PROD_DATABASE_URL" -v ON_ERROR_STOP=1 -1 \
     -f prisma/migrations/20261003130000_settings_p0_settings_backfill/migration.sql
   ```
   This runs the SQL directly; it does not touch `_prisma_migrations`.
7. **Add the cPanel cron** `GET /api/cron/workspace-deletion`, daily, with the header `Authorization: Bearer $CRON_SECRET` (the line is in `docs/cpanel-deploy.md` Step C). Without it, scheduled workspace deletions never run. It returns 401 without the bearer and `{"deleted":n,"skipped":m}` with it.
8. **This release is ROLL-FORWARD-ONLY once any slug change has pinned a Vercel project name.** After a code rollback, the old publish worker derives the project from the slug again, so a site whose slug changed publishes into a new Vercel project and leaves its live URL and domains on the old one. Fix forward instead of rolling back.
