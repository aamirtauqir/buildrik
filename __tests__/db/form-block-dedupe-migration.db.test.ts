/**
 * Ldata I3 — the dedupe half of migration
 * 20261003100000_form_block_site_scoped_identity, run from the committed .sql.
 *
 * Before the (siteId, blockId) unique index can exist, a site holding two rows
 * for one blockId (a duplicated site whose source was deleted, then published)
 * is merged onto one: the row the writers addressed (id = blockId) survives,
 * every submission is repointed to it, and a setting only the removed row had
 * is carried over instead of lost.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { createTestUser, createTestWorkspace, createTestSite, truncateTables } from "./helpers";

const MIGRATION = path.resolve(
  process.cwd(),
  "prisma/migrations/20261003100000_form_block_site_scoped_identity/migration.sql",
);

/** The migration's statements before `-- CreateIndex`, one per call. */
function dedupeStatements(): string[] {
  const sql = readFileSync(MIGRATION, "utf8");
  const [dedupe] = sql.split("-- CreateIndex");
  return dedupe
    .split(/;\s*\n/)
    .map((chunk) => chunk.split("\n").filter((l) => !l.trim().startsWith("--")).join("\n").trim())
    .filter(Boolean);
}

beforeEach(async () => {
  await truncateTables("site", "workspace", "user");
  // The index is what the dedupe makes possible — take it away to seed the
  // pre-migration state.
  await prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS "form_blocks_siteId_blockId_key"`);
});

afterEach(async () => {
  await truncateTables("site", "workspace", "user");
  await prisma.$executeRawUnsafe(
    `CREATE UNIQUE INDEX IF NOT EXISTS "form_blocks_siteId_blockId_key" ON "form_blocks"("siteId", "blockId")`,
  );
});

describe("migration 20261003100000 — dedupe", () => {
  it("leaves one row per (site, blockId), repoints every submission, and coalesces settings", async () => {
    const user = await createTestUser();
    const workspace = await createTestWorkspace({ ownerId: user.id });
    const site = await createTestSite({ workspaceId: workspace.id, createdBy: user.id });
    const other = await createTestSite({ workspaceId: workspace.id, createdBy: user.id });

    const now = Date.now();
    // Survivor: id = blockId (what publish and the inspector wrote), older, sparse settings.
    await prisma.formBlock.create({
      data: {
        id: "contact-form", siteId: site.id, blockId: "contact-form", name: "Published", fields: [],
        successMessage: "Kept", updatedAt: new Date(now - 3_000),
      },
    });
    // Removed rows (duplication copies with cuid ids): newest first wins per column.
    await prisma.formBlock.create({
      data: {
        id: "copy-new", siteId: site.id, blockId: "contact-form", name: "Copy new", fields: [],
        notifyEmail: "newest@example.test", successMessage: "Not taken — survivor has one",
        updatedAt: new Date(now - 1_000),
      },
    });
    await prisma.formBlock.create({
      data: {
        id: "copy-old", siteId: site.id, blockId: "contact-form", name: "Copy old", fields: [],
        notifyEmail: "older@example.test", webhookUrl: "https://hooks.example.test/x",
        redirectUrl: "https://example.test/thanks", updatedAt: new Date(now - 2_000),
      },
    });
    // Another site's row with the same blockId is not a duplicate.
    await prisma.formBlock.create({
      data: { id: "other-row", siteId: other.id, blockId: "contact-form", name: "Other", fields: [] },
    });
    for (const [id, formBlockId] of [["s1", "contact-form"], ["s2", "copy-new"], ["s3", "copy-old"]]) {
      await prisma.formSubmission.create({ data: { id, formBlockId, siteId: site.id, data: {} } });
    }

    for (const statement of dedupeStatements()) await prisma.$executeRawUnsafe(statement);

    const rows = await prisma.formBlock.findMany({ where: { siteId: site.id } });
    expect(rows.map((r) => r.id)).toEqual(["contact-form"]);
    expect(rows[0]).toMatchObject({
      successMessage: "Kept",
      notifyEmail: "newest@example.test",
      webhookUrl: "https://hooks.example.test/x",
      redirectUrl: "https://example.test/thanks",
    });
    const subs = await prisma.formSubmission.findMany({ where: { siteId: site.id } });
    expect(subs.map((s) => s.formBlockId)).toEqual(["contact-form", "contact-form", "contact-form"]);
    expect(await prisma.formBlock.count({ where: { siteId: other.id } })).toBe(1);
  });
});
