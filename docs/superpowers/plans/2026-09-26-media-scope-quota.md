# Follow-up plan: A-11 — media scope migration + plan-based quota

Ledger ID: A-11. Status: OPEN. Quota half is decision-free and should land
separately/first (see "What can land now" below); this doc covers the
scope migration, which needs PD-15.

## Goal

Media assets (`MediaAsset` in `prisma/schema.prisma:1029-1057`) become
visible to every member of the site's workspace who has read access to the
site, instead of only the uploader — and storage quota is computed from the
site's workspace plan instead of a hard-coded 1 GB per user.

**Done condition:** a PRO workspace with two EDITOR members — member A
uploads an asset to site S, member B (different account, same workspace,
EDITOR on S) opens S's media library and sees A's upload. Quota shown in
the library UI matches the workspace's plan limit, not 1 GB, verified with
`getComputedStyle`/DOM read of the quota bar plus a `usedBytes`/`quotaBytes`
assertion from `media.quota`.

## Why deferred

- `MediaAsset` is uploader-owned in the schema: `userId String`,
  `siteId String?`, `@@unique([userId, url])`,
  `@@index([userId, type, createdAt])`. Moving to site/workspace-scoped
  listing is a data migration, not just a query change — existing rows
  need a `siteId` backfill (a media asset uploaded before `siteId` was
  nullable-required needs a real site attached or an explicit "unscoped"
  bucket decision), and the unique key `[userId, url]` needs to become
  `[siteId, url]` or similar, which can collide if two different users
  uploaded the same external URL to the same site.
- PD-15 (workspace-scope vs. site-scope for media, and how personal/
  unassigned assets are handled) is unanswered.
- The scope migration changes S-4's blob-ownership semantics (who can
  delete/move a blob) and search (A05-3/A05-4 asset search), so it must
  follow S-4, which has its own landing order.
- The quota fix, by contrast, has no schema change and no PD dependency —
  it is decision-free and belongs in the same lane as the rest of the
  audit-fix decision-free work, not deferred to this plan.

## What can land now (decision-free, not blocked by this plan)

1. `media.listAssets` / a new `media.quota` query returns
   `{ usedBytes, quotaBytes }` computed from the SITE's workspace plan
   (read the plan via `site.workspaceId`, not `getUserPlan`'s
   first-membership-by-`joinedAt` heuristic in
   `server/services/media.service.ts:35-46,102-113`).
2. `MediaManager.ts:979-989` reads the server-computed quota instead of the
   client constant `STORAGE_QUOTA_BYTES` (`packages/editor/src/shared/
   constants/media.ts:333`).
3. `AssetUploadService` distinguishes a 4xx quota/forbidden refusal (don't
   retry, show the reason) from a network error (retry).

If L-lane time allows, land this piece as its own decision-free fix before
this plan's migration work starts — it removes one blocker from the
"is this file already correct" question when A-11 is revisited.

## Decisions needed (PD-15)

1. **Scope: workspace or site?** Two members with EDITOR on site S but not
   on site T (same workspace) — should member B, working on T, see S's
   assets in a workspace-wide picker, or only when browsing S itself?
   Workspace-wide is more powerful (shared brand assets) but leaks assets
   across sites that may have different stakeholders.
2. **Existing rows.** Assets uploaded before this migration have a `userId`
   and maybe a `siteId`. Options: (a) backfill `siteId` from the asset's
   upload context if recoverable from `AuditLog`/other tables, (b) treat
   `siteId IS NULL` rows as personal-only forever (visible only to the
   uploader, a permanent "orphaned" bucket), (c) force a one-time
   reassignment UI ("these N assets have no site — attach them or they
   become personal-only").
3. **Unique key collision.** If `[siteId, url]` becomes the new unique key,
   two users uploading the identical external URL to the same site need a
   defined resolution (first write wins / both stored / de-dupe UI).

## Proposed tasks (once PD-15 lands, after S-4)

1. Migration: add `siteId` backfill pass (script, not implicit) with a
   dry-run count logged before the real run — same pattern as the S-1a
   sanitizer dry-run (`scripts/audit/sanitize-dry-run.mjs`).
2. Schema: adjust the unique index per the PD-15 collision decision, in a
   new `prisma/migrations/` entry, with the CHANGELOG deploy note
   ("Run `prisma migrate deploy` BEFORE deploying: media asset scope
   migration, includes a data backfill — expect downtime proportional to
   row count").
3. `media.listAssets`: change the `where` clause from
   `{ userId, ...(siteId ? { siteId } : {}) }` to a site/workspace-scoped
   filter per the PD-15 answer, with a role check (site read access) not a
   uploader check.
4. `MediaManager.importServerAssets`/hydration path: confirm cross-member
   assets hydrate correctly into IndexedDB (each browser's local cache is
   still per-device, so this is an additive hydrate, not a merge conflict
   — should be low risk given D-10's batched-emit fix already landed).
5. Re-audit A05-3/A05-4 (asset search) against the new scope.

## Risks

- Backfilling `siteId` on existing production rows is a real-data
  migration; a dry run is mandatory (root CLAUDE.md's "measure, don't
  eyeball" rule applies directly here — the migration's row-count and
  collision-count must be logged, not assumed).
- Widening visibility from uploader-only to site/workspace members is a
  permission change; a member who should NOT see another member's private
  drafts (if that distinction exists anywhere in the product) would be a
  regression — confirm no such expectation exists in the CMS/media docs
  before shipping.
- The quota UI reading a larger number after the quota fix (a FREE
  personal-workspace user editing a PRO client's site now sees the PRO
  quota) is correct per the ledger's own risk note, but should be called
  out in the release notes so it isn't reported as a bug.
