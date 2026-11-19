/**
 * L3-036 (owner 2026-10-10): "SEO configured" inspects each emitted title —
 * the same resolver the export and the drawer use — and a site title
 * template alone no longer passes it. It stays a warning: SEO never blocks
 * publish.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const pageFindManyMock = vi.fn();
const siteFindUniqueMock = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    page: { findMany: (...a: unknown[]) => pageFindManyMock(...a) },
    site: { findUnique: (...a: unknown[]) => siteFindUniqueMock(...a), count: vi.fn(async () => 0) },
    domain: { findFirst: vi.fn(async () => null) },
    publishBuildJob: { findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn(), updateMany: vi.fn() },
    workspace: { findUnique: vi.fn() },
    workspaceMember: { findUnique: vi.fn() },
    reviewRequest: { findFirst: vi.fn() },
    cmsCollection: { findMany: vi.fn(async () => []) },
    cmsEntry: { findMany: vi.fn(async () => []) },
    $transaction: vi.fn(),
  },
}));
vi.mock("@/lib/vercel", () => ({
  createVercelDeployment: vi.fn(),
  pollDeploymentReady: vi.fn(),
  deleteDeployment: vi.fn(),
  VercelApiError: class extends Error {},
}));
vi.mock("@server/services/integrations.service", () => ({
  getActiveVercelConnection: vi.fn(async () => ({ id: "i1", token: "tok", teamId: null })),
}));

import { runPrePublishChecks } from "@server/services/publish.service";

const row = (over: Record<string, unknown>) => ({ blocks: [{}], slug: "x", isHomePage: false, settings: null, ...over });
const seoRow = async () => (await runPrePublishChecks("s1")).checks.find((c) => c.label === "SEO configured");

beforeEach(() => {
  siteFindUniqueMock.mockReset().mockResolvedValue({
    name: "Acme",
    metaTitle: null,
    metaTitleTemplate: "{page_title} · Acme",
    favicon: "x",
    deletedAt: null,
    workspaceId: "ws1",
  });
  pageFindManyMock.mockReset();
});

describe("SEO configured — every emitted title", () => {
  it("warns when two pages ship the same title, even with a template set", async () => {
    pageFindManyMock.mockResolvedValue([row({ id: "p1", name: "Home", isHomePage: true }), row({ id: "p2", name: "Home" })]);
    const r = await seoRow();
    expect(r?.status).toBe("warning");
    expect(r?.detail).toContain('2 pages share the title "Home · Acme"');
    expect(r?.detail).not.toContain("No meta title template set");
  });

  it("passes when every page has a usable title, with no template at all", async () => {
    siteFindUniqueMock.mockResolvedValue({ name: "Acme", metaTitle: null, metaTitleTemplate: null, favicon: "x", deletedAt: null, workspaceId: "ws1" });
    pageFindManyMock.mockResolvedValue([
      row({ id: "p1", name: "Home", isHomePage: true }),
      row({ id: "p2", name: "About", settings: { seo: { metaTitle: "About our kitchen" } } }),
    ]);
    const r = await seoRow();
    expect(r).toMatchObject({ status: "pass", detail: "Every page has a usable search title." });
  });

  it("uses the home page's site default title and the page's own SEO title verbatim", async () => {
    siteFindUniqueMock.mockResolvedValue({ name: "Acme", metaTitle: "x".repeat(70), metaTitleTemplate: "{page_title} · Acme", favicon: "x", deletedAt: null, workspaceId: "ws1" });
    pageFindManyMock.mockResolvedValue([row({ id: "p1", name: "Home", isHomePage: true })]);
    const r = await seoRow();
    expect(r?.status).toBe("warning");
    expect(r?.detail).toMatch(/Home.*70 characters/);
  });

  it("ignores pages that are hidden from search or not published", async () => {
    pageFindManyMock.mockResolvedValue([
      row({ id: "p1", name: "Home", isHomePage: true }),
      row({ id: "p2", name: "Home", settings: { seo: { noIndex: true } } }),
      row({ id: "p3", name: "Home", settings: { visibility: "hidden" } }),
    ]);
    expect((await seoRow())?.status).toBe("pass");
  });

  it("names at most three findings, then counts the rest", async () => {
    pageFindManyMock.mockResolvedValue(
      ["a", "b", "c", "d", "e"].map((id) => row({ id, name: id, settings: { seo: { metaTitle: `${id} ${"x".repeat(70)}` } } })),
    );
    expect((await seoRow())?.detail).toMatch(/and 2 more\.$/);
  });
});
