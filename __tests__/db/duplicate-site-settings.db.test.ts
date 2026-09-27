/**
 * SA-01 — the Site columns are the only source of the settings they back, so
 * a duplicated site carries them over. It used to get them through the
 * projectSettings JSON copy, which saves no longer store. The copy keeps its
 * own name and slug, and never the source's site password.
 * Real Postgres, real service.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { duplicateSite } from "@/server/services/sites.service";
import {
  createTestUser,
  createTestWorkspace,
  createTestWorkspaceMember,
  createTestSite,
  truncateTables,
} from "./helpers";

beforeEach(async () => {
  await truncateTables("page", "site", "workspace", "user");
});

describe("duplicateSite — setting columns (SA-01)", () => {
  it("the copy keeps the source's setting columns, not its name, slug or password", async () => {
    const user = await createTestUser();
    const workspace = await createTestWorkspace({ ownerId: user.id });
    await createTestWorkspaceMember({ userId: user.id, workspaceId: workspace.id, role: "OWNER" });
    const source = await createTestSite({
      workspaceId: workspace.id,
      createdBy: user.id,
      name: "Bella",
      metaTitle: "Bella Cucina",
      metaTitleTemplate: "{page_title} — Bella",
      headCode: "<script>h()</script>",
      bodyCode: "<script>b()</script>",
      ogImage: "https://cdn.example.test/og.png",
      socialLinks: { twitter: "https://x.com/bella" },
      allowIndexing: false,
      canonicalUrl: "https://bella.example.test",
      xFrameOptions: "DENY",
      hstsMaxAge: 31536000,
      defaultLocale: "fr",
      enabledLocales: ["fr", "en"],
      localeAutoRedirect: true,
      publishedPassword: "ciphertext",
    });

    const copy = await duplicateSite(source.id, workspace.id, user.id);
    const row = await prisma.site.findUniqueOrThrow({ where: { id: copy.id } });

    expect(row).toMatchObject({
      name: "Bella (Copy)",
      metaTitle: "Bella Cucina",
      metaTitleTemplate: "{page_title} — Bella",
      headCode: "<script>h()</script>",
      bodyCode: "<script>b()</script>",
      ogImage: "https://cdn.example.test/og.png",
      socialLinks: { twitter: "https://x.com/bella" },
      allowIndexing: false,
      canonicalUrl: "https://bella.example.test",
      xFrameOptions: "DENY",
      hstsMaxAge: 31536000,
      defaultLocale: "fr",
      enabledLocales: ["fr", "en"],
      localeAutoRedirect: true,
      publishedPassword: null,
      metaDescription: null,
    });
    expect(row.slug).not.toBe(source.slug);
  });
});
