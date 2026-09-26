-- Ldata bug A: a FormBlock belongs to ONE site.
--
-- Until now the publish worker and the inspector wrote each form's row with
-- `id = <form element id>` — a GLOBAL primary key. Two sites made from the same
-- template share page-1 element ids, and AI-drafted forms share HTML ids like
-- "contact-form", so publishing site B UPDATED site A's row (fields/isActive)
-- and site B never got a row at all: its visitors' submissions were refused as
-- FORM_NOT_FOUND. Identity is now (siteId, blockId); `id` stays the PK as a
-- surrogate, and `form_submissions.formBlockId` keeps pointing at it (no FK
-- change — existing ids are untouched).
--
-- `blockId` has been NOT NULL since the baseline and every writer set it to
-- the element id, so there is nothing to backfill. A site that lost its row to
-- another site's PK simply has no row today; its next publish creates one.
--
-- The one way a site can already hold two rows for one blockId: site
-- duplication copies rows under fresh cuids (blockId kept), and if the source
-- site was then hard-deleted the copy's publish created a second row keyed by
-- the element id. Keep the row the writers have been addressing (id = blockId,
-- else the most recently updated), move the others' submissions onto it, and
-- drop the others — so the unique index below can be created. Before the
-- drop, a nullable setting the survivor lacks is taken from the removed rows,
-- newest first, so an address or URL set only on a copy is not lost.
WITH ranked AS (
  SELECT "id",
         ROW_NUMBER() OVER (
           PARTITION BY "siteId", "blockId"
           ORDER BY ("id" = "blockId") DESC, "updatedAt" DESC, "id"
         ) AS rn,
         FIRST_VALUE("id") OVER (
           PARTITION BY "siteId", "blockId"
           ORDER BY ("id" = "blockId") DESC, "updatedAt" DESC, "id"
         ) AS keeper
  FROM "form_blocks"
), donor AS (
  SELECT r.keeper,
         (ARRAY_AGG(f."pageId"         ORDER BY f."updatedAt" DESC) FILTER (WHERE f."pageId" IS NOT NULL))[1]         AS "pageId",
         (ARRAY_AGG(f."successMessage" ORDER BY f."updatedAt" DESC) FILTER (WHERE f."successMessage" IS NOT NULL))[1] AS "successMessage",
         (ARRAY_AGG(f."redirectUrl"    ORDER BY f."updatedAt" DESC) FILTER (WHERE f."redirectUrl" IS NOT NULL))[1]    AS "redirectUrl",
         (ARRAY_AGG(f."notifyEmail"    ORDER BY f."updatedAt" DESC) FILTER (WHERE f."notifyEmail" IS NOT NULL))[1]    AS "notifyEmail",
         (ARRAY_AGG(f."webhookUrl"     ORDER BY f."updatedAt" DESC) FILTER (WHERE f."webhookUrl" IS NOT NULL))[1]     AS "webhookUrl"
  FROM ranked r
  JOIN "form_blocks" f ON f."id" = r."id"
  WHERE r.rn > 1
  GROUP BY r.keeper
)
UPDATE "form_blocks" k
SET "pageId"         = COALESCE(k."pageId", d."pageId"),
    "successMessage" = COALESCE(k."successMessage", d."successMessage"),
    "redirectUrl"    = COALESCE(k."redirectUrl", d."redirectUrl"),
    "notifyEmail"    = COALESCE(k."notifyEmail", d."notifyEmail"),
    "webhookUrl"     = COALESCE(k."webhookUrl", d."webhookUrl")
FROM donor d
WHERE k."id" = d.keeper;

WITH ranked AS (
  SELECT "id", "siteId", "blockId",
         ROW_NUMBER() OVER (
           PARTITION BY "siteId", "blockId"
           ORDER BY ("id" = "blockId") DESC, "updatedAt" DESC, "id"
         ) AS rn,
         FIRST_VALUE("id") OVER (
           PARTITION BY "siteId", "blockId"
           ORDER BY ("id" = "blockId") DESC, "updatedAt" DESC, "id"
         ) AS keeper
  FROM "form_blocks"
)
UPDATE "form_submissions" s
SET "formBlockId" = r.keeper
FROM ranked r
WHERE s."formBlockId" = r."id" AND r.rn > 1;

DELETE FROM "form_blocks" f
USING (
  SELECT "id",
         ROW_NUMBER() OVER (
           PARTITION BY "siteId", "blockId"
           ORDER BY ("id" = "blockId") DESC, "updatedAt" DESC, "id"
         ) AS rn
  FROM "form_blocks"
) r
WHERE f."id" = r."id" AND r.rn > 1;

-- CreateIndex
CREATE UNIQUE INDEX "form_blocks_siteId_blockId_key" ON "form_blocks"("siteId", "blockId");
