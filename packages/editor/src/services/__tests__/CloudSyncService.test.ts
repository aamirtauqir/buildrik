import { describe, it, expect, vi } from "vitest";
import { CloudSyncService } from "../CloudSyncService";

describe("CloudSyncService.fetchRemote validation", () => {
  it("returns null for non-JSON Content-Type", async () => {
    const service = new CloudSyncService({ provider: "custom", endpoint: "https://example.com", apiKey: "k" } as any);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, headers: { get: () => "text/html" }, json: vi.fn() }));
    const result = await (service as any).fetchRemote("p1");
    expect(result).toBeNull();
  });

  it("returns null for JSON that fails Zod schema", async () => {
    const service = new CloudSyncService({ provider: "custom", endpoint: "https://example.com", apiKey: "k" } as any);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, headers: { get: () => "application/json" }, json: vi.fn().mockResolvedValue({ bad: true }) }));
    const result = await (service as any).fetchRemote("p1");
    expect(result).toBeNull();
  });
});
