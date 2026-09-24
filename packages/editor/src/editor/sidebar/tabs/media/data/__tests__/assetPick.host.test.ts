import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { endAssetPick, requestAssetPick, useRailTab } from "../assetPick";

function fakeComposer() {
  return { emit: vi.fn() } as unknown as Parameters<typeof requestAssetPick>[0] & { emit: ReturnType<typeof vi.fn> };
}

describe("hosted asset pick (6765:59890)", () => {
  it("keeps the host as the rail tab while the Assets drawer picks, and hands it back on end", () => {
    const composer = fakeComposer();
    const { result, rerender } = renderHook(({ tab }) => useRailTab(tab), { initialProps: { tab: "content" as string } });
    act(() => requestAssetPick(composer, { label: "Margherita · Photo", host: "content" }));
    expect(composer.emit).toHaveBeenLastCalledWith("ui:switch-tab", { tab: "assets" });
    rerender({ tab: "assets" });
    expect(result.current).toBe("content");
    act(() => endAssetPick());
    expect(composer.emit).toHaveBeenLastCalledWith("ui:switch-tab", { tab: "content" });
    expect(result.current).toBe("assets");
  });

  it("an unhosted pick leaves the rail on Assets and does not switch tabs when it ends", () => {
    const composer = fakeComposer();
    const { result } = renderHook(() => useRailTab("assets"));
    act(() => requestAssetPick(composer, { label: "Hero image" }));
    expect(result.current).toBe("assets");
    act(() => endAssetPick());
    expect(composer.emit).toHaveBeenCalledTimes(1);
  });
});
