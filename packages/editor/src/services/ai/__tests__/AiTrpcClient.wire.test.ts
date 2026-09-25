/**
 * C-1 / D-3 — the History summary and the milestone suggestion on the wire.
 *
 * Both used to POST `{ versionName, changes }` as plain JSON to
 * `/api/trpc/ai.*`. The router speaks superjson, which reads the input from a
 * `json` envelope — so the server saw `undefined` and answered 400 "expected
 * object, received undefined" every time. This drives the real client and
 * checks the request it actually puts on the wire, and that it reads the
 * superjson batch response the router actually sends back.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { aiTrpcClient } from "../AiTrpcClient";
import type { CompareResult } from "@/shared/types/versions";

function respondWith(data: unknown) {
  const fetchMock = vi.fn(async (_url: string | URL | Request, _init?: RequestInit) =>
    new Response(JSON.stringify([{ result: { data: { json: data } } }]), {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

const changes: CompareResult = {
  elementName: "Hero",
  summary: { style: 1, text: 0, layout: 0, content: 0, other: 0 },
  changes: [{ type: "style", property: "color", before: "red", after: "blue" }],
} as unknown as CompareResult;

describe("aiTrpcClient — superjson wire shape", () => {
  it("summarize sends a batched superjson envelope and reads the summary back", async () => {
    const fetchMock = respondWith({ summary: "Recoloured the hero." });

    const res = await aiTrpcClient.summarize(
      { versionName: `Wire ${Date.now()}`, changes },
      { skipCache: true, retries: 0 },
    );

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toMatch(/\/api\/trpc\/ai\.summarize\?batch=1$/);
    const body = JSON.parse(String(init?.body));
    expect(body["0"].json).toMatchObject({ changes: { elementName: "Hero" } });
    expect(res.data).toEqual({ summary: "Recoloured the hero." });
  });

  it("suggestMilestone sends the same envelope and reads the name back", async () => {
    const fetchMock = respondWith({ suggestedName: "Hero refresh", reasoning: "colour pass" });

    const res = await aiTrpcClient.suggestMilestone(
      {
        recentChanges: [{ id: "h1", label: `Recolour ${Date.now()}`, timestamp: 1, type: "patch" }],
        pageStructure: { pageCount: 1, elementCount: 4 },
      },
      { skipCache: true, retries: 0 },
    );

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toMatch(/\/api\/trpc\/ai\.milestoneSuggest\?batch=1$/);
    expect(JSON.parse(String(init?.body))["0"].json.pageStructure).toEqual({ pageCount: 1, elementCount: 4 });
    expect(res.data).toEqual({ suggestedName: "Hero refresh", reasoning: "colour pass" });
  });
});
