/**
 * C-1 / D-3 — in-process round trip for `ai.summarize` / `ai.milestoneSuggest`.
 *
 * The editor used to POST plain JSON to these procedures; behind the
 * superjson transformer the input arrived as `undefined` and every request
 * was a 400. This runs the REAL ai router behind the real fetch adapter and
 * calls it the way the editor now does (a superjson httpBatchLink client), so
 * the input shape is checked by the real zod schema over the real wire. The
 * provider call itself is mocked — the transport is what is under test.
 */
import { describe, it, expect, vi } from "vitest";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import superjson from "superjson";

vi.mock("@/server/auth", () => ({ auth: vi.fn() }));
vi.mock("@/server/services/ai.service", () => ({
  summarizeChanges: vi.fn(async () => ({ summary: "Recoloured the hero." })),
  suggestMilestone: vi.fn(async () => ({ suggestedName: "Hero refresh", reasoning: "colour pass" })),
}));
vi.mock("@/server/services/quota.service", () => ({
  checkQuota: vi.fn(async () => ({ ok: true, used: 0, limit: 100, resetsAt: new Date() })),
  reserveQuota: vi.fn(async () => ({ ok: true })),
  releaseQuota: vi.fn(async () => undefined),
  resolveModelForUser: vi.fn(async () => "gpt-4o-mini"),
}));
vi.mock("@/server/services/ai-adoption.service", () => ({ recordAiAdoption: vi.fn() }));

import { router } from "@/server/trpc/trpc";
import { aiRouter } from "@/server/trpc/routers/ai";

const appRouter = router({ ai: aiRouter });
const ctx = { session: { user: { id: "u1" } }, prisma: {}, bearer: null, headers: undefined } as never;

const handle = (req: Request) =>
  fetchRequestHandler({ endpoint: "/api/trpc", req, router: appRouter, createContext: () => ctx });

const statuses: number[] = [];
const client = createTRPCClient<typeof appRouter>({
  links: [
    httpBatchLink({
      url: "http://editor.local/api/trpc",
      transformer: superjson,
      fetch: async (url, init) => {
        const res = await handle(new Request(String(url), init as RequestInit));
        statuses.push(res.status);
        return res;
      },
    }),
  ],
});

const changes = {
  elementName: "Hero",
  summary: { style: 1, text: 0, layout: 0, content: 0, other: 0 },
  changes: [{ type: "style" as const, property: "color", before: "red", after: "blue" }],
};

describe("ai.summarize / ai.milestoneSuggest over the superjson wire", () => {
  it("summarize: 200 and the summary comes back", async () => {
    statuses.length = 0;
    const res = await client.ai.summarize.mutate({ versionName: "v3", changes });
    expect(statuses).toEqual([200]);
    expect(res).toEqual({ summary: "Recoloured the hero." });
  });

  it("milestoneSuggest: 200 with the hook's input shape", async () => {
    statuses.length = 0;
    const res = await client.ai.milestoneSuggest.mutate({
      recentChanges: [{ id: "h1", label: "Recolour", timestamp: 1, type: "patch" }],
      pageStructure: { pageCount: 1, elementCount: 4 },
    });
    expect(statuses).toEqual([200]);
    expect(res).toEqual({ suggestedName: "Hero refresh", reasoning: "colour pass" });
  });

  it("the old hand-rolled plain-JSON POST is what the router refuses (400)", async () => {
    const res = await handle(
      new Request("http://editor.local/api/trpc/ai.summarize", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ versionName: "v3", changes }),
      }),
    );
    expect(res.status).toBe(400);
  });
});
