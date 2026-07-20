-- AlterTable
ALTER TABLE "comments" ADD COLUMN     "reviewerId" TEXT,
ALTER COLUMN "authorId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "review_requests" ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "reviewerId" TEXT,
ADD COLUMN     "revokedAt" TIMESTAMP(3),
ADD COLUMN     "token" TEXT;

-- CreateTable
CREATE TABLE "reviewers" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviewers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reviewers_siteId_idx" ON "reviewers"("siteId");

-- CreateIndex
CREATE UNIQUE INDEX "reviewers_siteId_email_key" ON "reviewers"("siteId", "email");

-- CreateIndex
CREATE INDEX "comments_reviewerId_idx" ON "comments"("reviewerId");

-- CreateIndex
CREATE UNIQUE INDEX "review_requests_token_key" ON "review_requests"("token");

-- CreateIndex
CREATE INDEX "review_requests_reviewerId_idx" ON "review_requests"("reviewerId");

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "reviewers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_requests" ADD CONSTRAINT "review_requests_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "reviewers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviewers" ADD CONSTRAINT "reviewers_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- A comment has exactly one author: an internal workspace member (authorId)
-- or an account-less external reviewer (reviewerId). Prisma cannot express
-- this, and without it the pair silently allows both-set and neither-set —
-- the second of which is an orphan comment nobody can attribute.
-- Note the physical table name: `comments`, not the `Comment` model.
ALTER TABLE "comments"
  ADD CONSTRAINT "comments_one_author_chk"
  CHECK (("authorId" IS NOT NULL) <> ("reviewerId" IS NOT NULL));
