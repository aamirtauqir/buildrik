/**
 * C1 residual — `useTemplate` had its own slug generator that checked slugs
 * only inside the caller's workspace (Site.slug is globally unique, so a slug
 * taken elsewhere hit a raw P2002) and never looked at pinned Vercel project
 * names — a new site could derive another site's project and its first
 * publish would deploy over it. It now uses sites.service's generateUniqueSlug.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const { db } = vi.hoisted(() => ({
  db: {
    template: { findFirst: vi.fn(), update: vi.fn() },
    workspaceMember: { findFirst: vi.fn() },
    site: { count: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn() },
    page: { createMany: vi.fn() },
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: db }));

import { slugifyProjectName } from "@/lib/vercel";
import { useTemplate } from "@server/services/template.service";

beforeEach(() => {
  vi.clearAllMocks();
  db.workspaceMember.findFirst.mockResolvedValue({ workspace: { plan: "PRO" } });
  db.site.count.mockResolvedValue(0);
  db.site.findFirst.mockResolvedValue(null);
  db.template.findFirst.mockResolvedValue({ id: "t1", pages: [] });
  db.site.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ id: "new", ...data }));
});

describe("useTemplate — slug", () => {
  it("skips a slug whose derived Vercel project name another site is pinned to", async () => {
    db.site.findMany.mockResolvedValue([{ slug: "renamed-away", vercelProjectName: slugifyProjectName("my-site") }]);

    await useTemplate("ws1", "u1", "t1", "My Site");

    expect(db.site.create.mock.calls[0][0].data.slug).toBe("my-site-2");
  });

  it("skips a slug another workspace's site already holds (slug is globally unique)", async () => {
    db.site.findMany.mockResolvedValue([{ slug: "my-site", vercelProjectName: null }]);

    await useTemplate("ws1", "u1", "t1", "My Site");

    expect(db.site.create.mock.calls[0][0].data.slug).toBe("my-site-2");
  });
});
