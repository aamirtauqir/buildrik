// @vitest-environment jsdom
import { render, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DEFAULT_TOKENS } from "@/engine/designSystem/defaultTokens";

const client = {
  theme: {
    brandRestorePoints: { query: vi.fn() },
    brandRestorePoint: { query: vi.fn() },
    createBrandRestorePoint: { mutate: vi.fn() },
  },
};
vi.mock("@/services/api-client", () => ({ getBuildrikClient: () => client }));
vi.mock("@/services/BuildrikSyncProvider", () => ({ getSiteIdFromUrl: () => "s1" }));

import { useBrandRestorePoints, takeRestorePoint } from "../useBrandRestorePoints";

function fakeComposer(settings: Record<string, unknown> = { designTokens: DEFAULT_TOKENS, designTokensSchemaVersion: 6 }) {
  return {
    getProjectSettings: () => settings,
    designSystem: {
      tokenUsage: { getCount: () => 0 },
      setTokens: vi.fn((..._args: unknown[]) => true),
      setDarkMode: vi.fn((..._args: unknown[]) => true),
    },
  };
}

function Harness({ c, onApi }: { c: unknown; onApi: (api: ReturnType<typeof useBrandRestorePoints>) => void }) {
  onApi(useBrandRestorePoints(c as never));
  return null;
}

const rows = [
  { id: "b", reason: "dark-auto", createdAt: new Date(2) },
  { id: "a", reason: "generator", createdAt: new Date(1) },
];

beforeEach(() => {
  for (const f of [client.theme.brandRestorePoints.query, client.theme.brandRestorePoint.query, client.theme.createBrandRestorePoint.mutate]) f.mockReset();
  client.theme.brandRestorePoints.query.mockResolvedValue(rows);
});

async function mount(c = fakeComposer()) {
  let api!: ReturnType<typeof useBrandRestorePoints>;
  render(<Harness c={c} onApi={(a) => { api = a; }} />);
  await waitFor(() => expect(api.status).toBe("ready"));
  return { api: () => api, c };
}

describe("useBrandRestorePoints (spec §8, M10)", () => {
  it("lists the site's restore points", async () => {
    const { api } = await mount();
    expect(client.theme.brandRestorePoints.query).toHaveBeenCalledWith({ siteId: "s1" });
    expect(api().rows.map((r) => r.id)).toEqual(["b", "a"]);
  });

  it("restores a point that recorded Dark mode through setDarkMode, else through setTokens", async () => {
    const { api, c } = await mount();
    client.theme.brandRestorePoint.query.mockResolvedValueOnce({ id: "b", designTokens: DEFAULT_TOKENS, tokensSchemaVersion: 6, darkMode: "off" });
    await act(async () => { await expect(api().restore("b")).resolves.toBe("restored"); });
    expect(c.designSystem.setDarkMode).toHaveBeenCalledTimes(1);
    expect(c.designSystem.setDarkMode.mock.calls[0][0]).toBe("off");
    expect(c.designSystem.setDarkMode.mock.calls[0][1]).toBe("Restore brand");

    client.theme.brandRestorePoint.query.mockResolvedValueOnce({ id: "x", designTokens: DEFAULT_TOKENS, tokensSchemaVersion: 6, darkMode: null });
    await act(async () => { await expect(api().restore("x")).resolves.toBe("restored"); });
    expect(c.designSystem.setTokens).toHaveBeenCalledTimes(1);
    expect(c.designSystem.setTokens.mock.calls[0][1]).toBe("Restore brand");
  });

  it("is refused when the engine refuses the write, failed when the point cannot be read", async () => {
    const { api, c } = await mount();
    c.designSystem.setTokens.mockReturnValueOnce(false);
    client.theme.brandRestorePoint.query.mockResolvedValueOnce({ id: "x", designTokens: DEFAULT_TOKENS, tokensSchemaVersion: 6, darkMode: null });
    await act(async () => { await expect(api().restore("x")).resolves.toBe("refused"); });
    client.theme.brandRestorePoint.query.mockRejectedValueOnce(new Error("NOT_FOUND"));
    await act(async () => { await expect(api().restore("y")).resolves.toBe("failed"); });
  });
});

describe("takeRestorePoint (OQ-6: no restore point → no apply)", () => {
  it("sends the SAVED tokens, presets and Dark mode; false when the write fails", async () => {
    const c = fakeComposer({ designTokens: DEFAULT_TOKENS, designPresets: [{ id: "p" }] });
    client.theme.createBrandRestorePoint.mutate.mockResolvedValueOnce({ id: "r1" });
    await expect(takeRestorePoint(c as never, "s1", "generator")).resolves.toBe(true);
    expect(client.theme.createBrandRestorePoint.mutate).toHaveBeenCalledWith({
      siteId: "s1", reason: "generator", designTokens: DEFAULT_TOKENS, designPresets: [{ id: "p" }], darkMode: "off",
    });
    const bare = fakeComposer({});
    client.theme.createBrandRestorePoint.mutate.mockRejectedValueOnce(new Error("offline"));
    await expect(takeRestorePoint(bare as never, "s1", "dark-auto")).resolves.toBe(false);
    expect(client.theme.createBrandRestorePoint.mutate.mock.calls[1][0]).toMatchObject({ designTokens: [], darkMode: "off" });
  });
});
