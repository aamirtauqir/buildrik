/**
 * What a stock-search failure sounds like to the editor.
 *
 * The service now names WHY a search failed, but the reason only reaches the
 * client if the router translates it into a tRPC code that survives the wire.
 * That is not automatic: tRPC maps codes to JSON-RPC numbers and several share
 * one. BAD_GATEWAY, SERVICE_UNAVAILABLE, GATEWAY_TIMEOUT and NOT_IMPLEMENTED
 * are all -32603, and -32603 decodes back to INTERNAL_SERVER_ERROR — so a
 * router that answered NOT_CONFIGURED with BAD_GATEWAY and REQUEST_FAILED with
 * SERVICE_UNAVAILABLE would look correct here and be indistinguishable at the
 * client, which is the exact bug this arc exists to remove.
 *
 * These tests therefore assert the property that matters: the two reasons the
 * UI words differently arrive under two DIFFERENT codes, and neither collides
 * with the generic-failure bucket.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/server/auth", () => ({ auth: vi.fn().mockResolvedValue(null) }));
vi.mock("@/server/services/api-token.service", () => ({
  extractBearer: () => null,
  verifyApiToken: vi.fn(),
}));
vi.mock("next/headers", () => ({
  cookies: () => Promise.resolve({ get: () => undefined, delete: vi.fn() }),
}));

import { mediaRouter } from "@/server/trpc/routers/media";

const fetchMock = vi.fn();

const ctx = () => ({
  session: { user: { id: "u_1", workspaceId: "ws_1" } },
  bearer: null,
  prisma: {} as never,
});
const caller = () => mediaRouter.createCaller(ctx() as never);

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
});
afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.UNSPLASH_ACCESS_KEY;
  delete process.env.PEXELS_API_KEY;
});

/** Pull the tRPC code off a rejected call. */
async function codeOf(fire: () => Promise<unknown>): Promise<string> {
  try {
    await fire();
  } catch (e) {
    return (e as { code?: string }).code ?? "NO_CODE";
  }
  throw new Error("expected the call to reject, but it resolved");
}

describe("stock search — the reason survives translation", () => {
  it("a missing provider key is PRECONDITION_FAILED, not a 500", async () => {
    expect(await codeOf(() => caller().searchStockPhotos({ query: "cats", page: 1 }))).toBe(
      "PRECONDITION_FAILED"
    );
  });

  it("a provider that rejects our key is FORBIDDEN", async () => {
    process.env.UNSPLASH_ACCESS_KEY = "expired";
    fetchMock.mockResolvedValueOnce({ ok: false, status: 401 });
    expect(await codeOf(() => caller().searchStockPhotos({ query: "cats", page: 1 }))).toBe(
      "FORBIDDEN"
    );
  });

  it("videos translate the same way", async () => {
    expect(await codeOf(() => caller().searchStockVideos({ query: "cats", page: 1 }))).toBe(
      "PRECONDITION_FAILED"
    );

    process.env.PEXELS_API_KEY = "expired";
    fetchMock.mockResolvedValueOnce({ ok: false, status: 403 });
    expect(await codeOf(() => caller().searchStockVideos({ query: "cats", page: 1 }))).toBe(
      "FORBIDDEN"
    );
  });

  it("the two configuration reasons never share a code", async () => {
    const notConfigured = await codeOf(() =>
      caller().searchStockPhotos({ query: "cats", page: 1 })
    );

    process.env.UNSPLASH_ACCESS_KEY = "expired";
    fetchMock.mockResolvedValueOnce({ ok: false, status: 401 });
    const unauthorized = await codeOf(() =>
      caller().searchStockPhotos({ query: "cats", page: 1 })
    );

    fetchMock.mockResolvedValueOnce({ ok: false, status: 503 });
    const requestFailed = await codeOf(() =>
      caller().searchStockPhotos({ query: "cats", page: 1 })
    );

    expect(new Set([notConfigured, unauthorized, requestFailed]).size).toBe(3);
  });

  it("a genuinely empty result is still a successful [] — never an error", async () => {
    process.env.UNSPLASH_ACCESS_KEY = "k";
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ results: [] }) });
    await expect(caller().searchStockPhotos({ query: "asdfgh", page: 1 })).resolves.toEqual([]);
  });
});
