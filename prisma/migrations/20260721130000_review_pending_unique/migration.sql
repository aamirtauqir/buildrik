-- Partial unique index: at most one PENDING review request per site.
-- submitReview does a findFirst("PENDING") precheck then create-or-update,
-- with no transaction, so two parallel "submit for review" clicks on the same
-- site can both miss the precheck and both INSERT a PENDING row. This index
-- enforces the invariant atomically in Postgres; the losing INSERT throws
-- 23505 (Prisma P2002), which submitReview catches and converts into an update
-- of the winning row, so both callers converge on one review.
--
-- Prisma can't express partial unique indexes in schema.prisma — this
-- migration is hand-authored, and the ReviewRequest model carries a comment
-- marker so future schema diffs don't try to drop or duplicate it.
CREATE UNIQUE INDEX "review_requests_pending_unique"
  ON "review_requests" ("siteId")
  WHERE "status" = 'PENDING';
