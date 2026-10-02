/**
 * SA-01 — migration 20261003130000_settings_p0_settings_backfill, run from the
 * committed .sql against seeded rows.
 *
 * Before `saveProjectData` stops storing the column-backed keys in
 * `projectSettings`, a value that only ever reached the JSON (an EDITOR's
 * edit, which the ADMIN-only mirror never sent) is copied into its NULL
 * column. A column that already has a value is never overwritten, and `name`
 * / `publishedPassword` are never touched.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { createTestUser, createTestWorkspace, createTestSite, truncateTables } from "./helpers";

const MIGRATION = path.resolve(
  process.cwd(),
  "prisma/migrations/20261003130000_settings_p0_settings_backfill/migration.sql",
);

function statements(): string[] {
  return readFileSync(MIGRATION, "utf8")
    .split(/;\s*\n/)
    .map((chunk) => chunk.split("\n").filter((l) => !l.trim().startsWith("--")).join("\n").trim())
    .filter(Boolean);
}

async function runBackfill() {
  for (const statement of statements()) await prisma.$executeRawUnsafe(statement);
}

let owner: { workspaceId: string; createdBy: string };

beforeEach(async () => {
  await truncateTables("site", "workspace", "user");
  const user = await createTestUser();
  const workspace = await createTestWorkspace({ ownerId: user.id });
  owner = { workspaceId: workspace.id, createdBy: user.id };
});

afterAll(async () => {
  await truncateTables("site", "workspace", "user");
});

describe("migration 20261003130000 — settings backfill", () => {
  it("fills a NULL metaTitle from the JSON and never overwrites a set one", async () => {
    const jsonOnly = await createTestSite({ ...owner, projectSettings: { seo: { metaTitle: "From JSON" } } });
    const columnSet = await createTestSite({
      ...owner,
      metaTitle: "Column",
      projectSettings: { seo: { metaTitle: "Stale" } },
    });

    await runBackfill();

    expect((await prisma.site.findUniqueOrThrow({ where: { id: jsonOnly.id } })).metaTitle).toBe("From JSON");
    expect((await prisma.site.findUniqueOrThrow({ where: { id: columnSet.id } })).metaTitle).toBe("Column");
  });

  it("fills a NULL headCode from customCode.headScripts and never overwrites a set one", async () => {
    const jsonOnly = await createTestSite({
      ...owner,
      projectSettings: { customCode: { headScripts: "<script>json()</script>", bodyScripts: "", globalCss: "" } },
    });
    const columnSet = await createTestSite({
      ...owner,
      headCode: "<script>column()</script>",
      projectSettings: { customCode: { headScripts: "<script>stale()</script>" } },
    });

    await runBackfill();

    const a = await prisma.site.findUniqueOrThrow({ where: { id: jsonOnly.id } });
    expect(a.headCode).toBe("<script>json()</script>");
    // "" is how the editor says "empty" — it is not copied into the column.
    expect(a.bodyCode).toBeNull();
    expect((await prisma.site.findUniqueOrThrow({ where: { id: columnSet.id } })).headCode).toBe(
      "<script>column()</script>",
    );
  });

  it("copies every other column-backed string, the social links object, and nothing into name / password", async () => {
    const site = await createTestSite({
      ...owner,
      name: "Column name",
      projectSettings: {
        seo: {
          siteName: "JSON name",
          metaDescription: "  Desc  ",
          metaTitleTemplate: "{page_title} — Bella",
          defaultOgImage: "https://cdn.example.test/og.png",
          favicon: "https://cdn.example.test/f.ico",
          touchIcon: "https://cdn.example.test/t.png",
          robotsTxt: "User-agent: *",
          socialLinks: { twitter: "https://x.com/bella" },
          allowIndexing: false,
        },
        customCode: { bodyScripts: "<script>b()</script>" },
        publishing: { publishedPassword: "plain" },
      },
    });

    await runBackfill();

    const row = await prisma.site.findUniqueOrThrow({ where: { id: site.id } });
    expect(row).toMatchObject({
      name: "Column name",
      metaDescription: "Desc",
      metaTitleTemplate: "{page_title} — Bella",
      ogImage: "https://cdn.example.test/og.png",
      favicon: "https://cdn.example.test/f.ico",
      touchIcon: "https://cdn.example.test/t.png",
      robotsTxt: "User-agent: *",
      socialLinks: { twitter: "https://x.com/bella" },
      bodyCode: "<script>b()</script>",
      publishedPassword: null,
      // NOT NULL DEFAULT true: the column always has a value, so it is never
      // overwritten — the editor already loaded this column over the JSON.
      allowIndexing: true,
    });
  });

  it("skips blank, non-string and non-object JSON values, and a set socialLinks", async () => {
    const site = await createTestSite({
      ...owner,
      socialLinks: { facebook: "https://fb.com/kept" },
      projectSettings: {
        seo: { metaTitle: "   ", metaDescription: 42, socialLinks: { twitter: "https://x.com/stale" } },
        customCode: { headScripts: "" },
      },
    });
    const listLinks = await createTestSite({ ...owner, projectSettings: { seo: { socialLinks: ["not", "an", "object"] } } });

    await runBackfill();

    expect(await prisma.site.findUniqueOrThrow({ where: { id: site.id } })).toMatchObject({
      metaTitle: null,
      metaDescription: null,
      headCode: null,
      socialLinks: { facebook: "https://fb.com/kept" },
    });
    expect((await prisma.site.findUniqueOrThrow({ where: { id: listLinks.id } })).socialLinks).toBeNull();
  });

  it("skips a socialLinks object with any non-string value", async () => {
    const mixed = await createTestSite({
      ...owner,
      projectSettings: { seo: { socialLinks: { twitter: "https://x.com/bella", facebook: 42 } } },
    });
    const nested = await createTestSite({
      ...owner,
      projectSettings: { seo: { socialLinks: { twitter: { url: "https://x.com/bella" } } } },
    });
    const nulled = await createTestSite({
      ...owner,
      projectSettings: { seo: { socialLinks: { twitter: null } } },
    });
    const allStrings = await createTestSite({
      ...owner,
      projectSettings: { seo: { socialLinks: { twitter: "https://x.com/bella", facebook: "" } } },
    });

    await runBackfill();

    for (const { id } of [mixed, nested, nulled]) {
      expect((await prisma.site.findUniqueOrThrow({ where: { id } })).socialLinks).toBeNull();
    }
    expect((await prisma.site.findUniqueOrThrow({ where: { id: allStrings.id } })).socialLinks).toEqual({
      twitter: "https://x.com/bella",
      facebook: "",
    });
  });

  it("is a no-op on a second run", async () => {
    const site = await createTestSite({ ...owner, projectSettings: { seo: { metaTitle: "From JSON" } } });
    await runBackfill();
    const once = await prisma.site.findUniqueOrThrow({ where: { id: site.id } });
    await runBackfill();
    const twice = await prisma.site.findUniqueOrThrow({ where: { id: site.id } });
    expect({ ...twice, updatedAt: null }).toEqual({ ...once, updatedAt: null });
  });
});
