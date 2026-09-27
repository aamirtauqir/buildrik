/**
 * SA-06: the site slug is validated and unique, and changing it never moves a
 * published site to a new Vercel project.
 *
 * Before: the slug accepted any 3-50 character string, nothing checked another
 * site already had it (the `@unique` index threw a raw P2002 → 500), and the
 * Vercel project name was derived from the slug on every deploy — so renaming
 * the slug of a live site deployed the next publish into a brand-new project
 * and left the old URL (and any attached domains) on the old one.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    site: { findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
    slugHistory: { create: vi.fn(() => Promise.resolve()) },
  },
}));

import { prisma } from "@/lib/prisma";
import { slugifyProjectName } from "@/lib/vercel";
import { updateSiteSettingsSchema } from "@buildrik/shared/schemas/site-detail";
import { updateSiteSettings } from "@server/services/site-settings.service";

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(prisma.site.update).mockResolvedValue({ id: "s1" } as never);
});

describe("slug validation", () => {
  it("rejects slugs that are not lowercase-dash", () => {
    expect(updateSiteSettingsSchema.safeParse({ id: "s", slug: "BAD SLUG!!" }).success).toBe(false);
    expect(updateSiteSettingsSchema.safeParse({ id: "s", slug: "trailing-" }).success).toBe(false);
    expect(updateSiteSettingsSchema.safeParse({ id: "s", slug: "double--dash" }).success).toBe(false);
    expect(updateSiteSettingsSchema.safeParse({ id: "s", slug: "good-slug-2" }).success).toBe(true);
  });
});

describe("updateSiteSettings — slug change", () => {
  it("refuses a slug another site uses", async () => {
    vi.mocked(prisma.site.findUnique).mockResolvedValue({ slug: "a", vercelProjectName: null, deletedAt: null, status: "DRAFT", workspace: { plan: "PRO" } } as never);
    vi.mocked(prisma.site.findFirst).mockResolvedValue({ id: "other" } as never);
    await expect(updateSiteSettings("s1", { slug: "taken" })).rejects.toThrow("SLUG_TAKEN");
    expect(prisma.site.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { slug: "taken", id: { not: "s1" } },
    }));
    expect(prisma.site.update).not.toHaveBeenCalled();
  });

  it("pins the old project name when a published site changes slug", async () => {
    vi.mocked(prisma.site.findUnique).mockResolvedValue({ slug: "old", vercelProjectName: null, deletedAt: null, status: "PUBLISHED", workspace: { plan: "PRO" } } as never);
    vi.mocked(prisma.site.findFirst).mockResolvedValue(null);
    await updateSiteSettings("s1", { slug: "new" });
    expect(prisma.site.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ slug: "new", vercelProjectName: slugifyProjectName("old") }),
    }));
  });

  it("does not re-pin a site that already has a project name", async () => {
    vi.mocked(prisma.site.findUnique).mockResolvedValue({ slug: "old", vercelProjectName: "buildrik-site-first", deletedAt: null, status: "PUBLISHED", workspace: { plan: "PRO" } } as never);
    vi.mocked(prisma.site.findFirst).mockResolvedValue(null);
    await updateSiteSettings("s1", { slug: "new" });
    const call = vi.mocked(prisma.site.update).mock.calls[0][0];
    expect(call.data).not.toHaveProperty("vercelProjectName");
  });

  it("does not pin a never-published site", async () => {
    vi.mocked(prisma.site.findUnique).mockResolvedValue({ slug: "old", vercelProjectName: null, deletedAt: null, status: "DRAFT", workspace: { plan: "FREE" } } as never);
    vi.mocked(prisma.site.findFirst).mockResolvedValue(null);
    await updateSiteSettings("s1", { slug: "new" });
    const call = vi.mocked(prisma.site.update).mock.calls[0][0];
    expect(call.data).not.toHaveProperty("vercelProjectName");
  });

  it("skips the uniqueness query when the slug is unchanged", async () => {
    vi.mocked(prisma.site.findUnique).mockResolvedValue({ slug: "same", vercelProjectName: null, deletedAt: null, status: "PUBLISHED", workspace: { plan: "PRO" } } as never);
    await updateSiteSettings("s1", { slug: "same" });
    expect(prisma.site.findFirst).not.toHaveBeenCalled();
  });
});
