/**
 * cms router — what the public tRPC surface must NOT offer.
 *
 * EDT-022: `cms.generateDynamicPages` rendered and sanitized one page per
 * published record for any VIEWER, with a 2 MB template, no rate limit and no
 * UI caller. Publish calls the service function directly, so the procedure
 * is gone.
 */
import { describe, it, expect, vi } from "vitest";

vi.mock("@/server/auth", () => ({ auth: vi.fn().mockResolvedValue(null) }));
vi.mock("@/server/services/api-token.service", () => ({
  extractBearer: () => null,
  verifyApiToken: vi.fn(),
}));
vi.mock("next/headers", () => ({
  cookies: () => Promise.resolve({ get: () => undefined, delete: vi.fn() }),
}));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import { cmsRouter } from "@/server/trpc/routers/cms";

describe("cms router — public surface", () => {
  it("does not expose generateDynamicPages (EDT-022)", () => {
    expect(Object.keys(cmsRouter._def.procedures)).not.toContain("generateDynamicPages");
  });
});
