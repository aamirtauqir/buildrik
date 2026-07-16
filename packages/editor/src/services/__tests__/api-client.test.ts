/**
 * api-client tests — createBuildrikApiClient link configuration (url,
 * superjson transformer, credentials:"include" fetch wrapper) and the
 * getBuildrikClient lazy singleton.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import superjson from "superjson";

// Factories only close over these (TDZ-safe lazy deref).
const trpcMocks = {
  createTRPCClient: vi.fn(),
  httpBatchLink: vi.fn(),
};

vi.mock("@trpc/client", () => ({
  createTRPCClient: (opts: unknown) => trpcMocks.createTRPCClient(opts),
  httpBatchLink: (opts: unknown) => trpcMocks.httpBatchLink(opts),
}));

import { createBuildrikApiClient } from "../api-client";

interface CapturedLinkOpts {
  url: string;
  transformer: unknown;
  headers: () => Record<string, string>;
  fetch: (url: string, options?: RequestInit) => Promise<unknown>;
}

beforeEach(() => {
  trpcMocks.createTRPCClient.mockReset();
  trpcMocks.httpBatchLink.mockReset();
  // Pass the link opts through as a sentinel so we can inspect them.
  trpcMocks.httpBatchLink.mockImplementation((opts) => opts);
  trpcMocks.createTRPCClient.mockImplementation(() => ({ __client: true }));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createBuildrikApiClient", () => {
  it("builds one httpBatchLink at <baseUrl>/api/trpc with the superjson transformer", () => {
    const client = createBuildrikApiClient("https://dash.example");

    expect(trpcMocks.httpBatchLink).toHaveBeenCalledTimes(1);
    const opts = trpcMocks.httpBatchLink.mock.calls[0][0] as CapturedLinkOpts;
    expect(opts.url).toBe("https://dash.example/api/trpc");
    expect(opts.transformer).toBe(superjson);
    expect(opts.headers()).toEqual({});

    // createTRPCClient receives exactly that link.
    expect(trpcMocks.createTRPCClient).toHaveBeenCalledExactlyOnceWith({ links: [opts] });
    expect(client).toEqual({ __client: true });
  });

  it("its fetch wrapper forces credentials: 'include' (session cookie rides along)", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    createBuildrikApiClient("https://dash.example");
    const opts = trpcMocks.httpBatchLink.mock.calls[0][0] as CapturedLinkOpts;

    await opts.fetch("https://dash.example/api/trpc?batch=1", {
      method: "POST",
      body: "{}",
    });

    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
      "https://dash.example/api/trpc?batch=1",
      { method: "POST", body: "{}", credentials: "include" }
    );
  });

  it("each call builds a fresh client (no implicit sharing)", () => {
    createBuildrikApiClient("https://one.example");
    createBuildrikApiClient("https://two.example");

    expect(trpcMocks.createTRPCClient).toHaveBeenCalledTimes(2);
    expect((trpcMocks.httpBatchLink.mock.calls[1][0] as CapturedLinkOpts).url).toBe(
      "https://two.example/api/trpc"
    );
  });
});

describe("getBuildrikClient singleton", () => {
  it("lazily creates one client and reuses it — even for a different baseUrl", async () => {
    vi.resetModules(); // fresh module registry so the module-level _client is null
    const mod = await import("../api-client");

    expect(trpcMocks.createTRPCClient).not.toHaveBeenCalled(); // lazy — no eager init

    const a = mod.getBuildrikClient("https://first.example");
    const b = mod.getBuildrikClient("https://first.example");
    expect(a).toBe(b);
    expect(trpcMocks.createTRPCClient).toHaveBeenCalledTimes(1);
    expect((trpcMocks.httpBatchLink.mock.calls[0][0] as CapturedLinkOpts).url).toBe(
      "https://first.example/api/trpc"
    );

    // CURRENT BEHAVIOR: the first baseUrl wins for the whole session.
    const c = mod.getBuildrikClient("https://second.example");
    expect(c).toBe(a);
    expect(trpcMocks.createTRPCClient).toHaveBeenCalledTimes(1);
  });
});
