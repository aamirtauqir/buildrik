-- Session revocation was cosmetic: sessions are JWT-strategy with no adapter,
-- so deleting rows from "sessions" never invalidated a cookie. sessionVersion
-- is the gate the jwt callback checks on every request. Defaulted to 0 so every
-- existing row and every already-issued (claim-less) cookie stay valid on deploy.
-- The index backs the five userId-filtered reads/revokes on "sessions".

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "sessionVersion" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

