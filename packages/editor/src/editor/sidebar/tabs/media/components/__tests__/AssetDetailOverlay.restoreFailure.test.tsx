/**
 * The drawer's Versions view is the one version list (owner decision after
 * REA 2026-10-20 M-5): the asset's family — the same rows the library's Asset
 * versions dialog lists — not the server's best-effort history, which now only
 * supplies author lines. Restore moves the family's placements onto the
 * version's file and never rewrites the asset; a placement that does not move
 * says so on the row (DQ-012).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AssetDetailOverlay } from "../AssetDetailOverlay";
import type { LibraryItem } from "@/editor/sidebar/tabs/media/data/mediaTypes";
import type { Composer } from "@/engine/Composer";

const ORIGINAL = "https://cdn.example/hero.png";
const V2 = "https://cdn.example/a.png";
const V3 = "https://cdn.example/b.png";

/* The server history: one row per synced saved version, and NOT the original
   — and here, deliberately, only v3 made it (v2's best-effort write failed). */
vi.mock("@/services/MediaVersionService", () => ({
  listAssetVersions: async () => [
    { id: "sv3", assetId: "as1", url: "https://cdn.example/b.png", bytes: 300, edits: null, createdAt: "2026-01-03T00:00:00.000Z", createdByName: "Sara" },
  ],
}));

const base = { type: "img" as const, mimeType: "image/png" };
const item: LibraryItem = { ...base, key: "a1", assetId: "as1", name: "hero", src: ORIGINAL, size: 100, createdAt: "2026-01-01T00:00:00.000Z" };
const FAMILY: LibraryItem[] = [
  item,
  { ...base, key: "a1-v2", versionOf: "a1", name: "hero-v2", src: V2, size: 200, createdAt: "2026-01-02T00:00:00.000Z" },
  { ...base, key: "a1-v3", versionOf: "a1", name: "hero-v3", src: V3, size: 300, createdAt: "2026-01-03T00:00:00.000Z" },
];

/** Placements: two on the original, one on v3. */
function fakeComposer(failed: Array<{ elementId: string; error: string }>) {
  const counts: Record<string, number> = { [ORIGINAL]: 2, [V3]: 1 };
  const replaceAcross = vi.fn(() => ({ replaced: [], failed, clean: failed.length === 0 }));
  const composer = {
    media: { on: vi.fn(), off: vi.fn() },
    mediaOps: { replaceAcross, getUsages: (src: string) => ({ count: counts[src] ?? 0, elements: [] }) },
    elements: { getAllPages: () => [] },
  } as unknown as Composer;
  return { composer, replaceAcross };
}

function open(composer: Composer, onUpdate = vi.fn()) {
  render(<AssetDetailOverlay item={item} versions={FAMILY} composer={composer} onClose={vi.fn()} onUpdate={onUpdate} />);
  fireEvent.click(screen.getByTestId("media-detail-versions"));
}

describe("AssetDetailOverlay — Versions is the family, restore moves the placements", () => {
  it("lists every family member newest first, including the version the server history lacks", async () => {
    const { composer } = fakeComposer([]);
    render(<AssetDetailOverlay item={item} versions={FAMILY} composer={composer} onClose={vi.fn()} />);
    expect(screen.getByTestId("media-detail-versions")).toHaveTextContent("3");
    fireEvent.click(screen.getByTestId("media-detail-versions"));
    const rows = screen.getAllByRole("listitem").map((r) => r.getAttribute("data-testid"));
    expect(rows).toEqual(["media-version-a1-v3", "media-version-a1-v2", "media-version-a1"]);
    expect(await screen.findByTestId("media-version-author-a1-v3")).toHaveTextContent("Sara");
    expect(screen.queryByTestId("media-version-author-a1-v2")).toBeNull();
  });

  it("marks the members the site carries current and the rest by original / size delta", () => {
    const { composer } = fakeComposer([]);
    open(composer);
    expect(screen.getByTestId("media-version-a1")).toHaveAttribute("data-current", "true");
    expect(screen.getByTestId("media-version-a1-v3")).toHaveAttribute("data-current", "true");
    expect(screen.getByTestId("media-version-meta-a1-v2")).toHaveTextContent("+100 B");
  });

  it("restoring v2 moves every other member's placements onto v2 and never rewrites the asset", () => {
    const { composer, replaceAcross } = fakeComposer([]);
    const onUpdate = vi.fn();
    open(composer, onUpdate);
    fireEvent.click(screen.getByTestId("media-version-menu-a1-v2"));
    expect(screen.getByTestId("media-restore-confirm")).toHaveTextContent("used in 3 places");
    fireEvent.click(screen.getByTestId("media-restore-go"));
    expect(replaceAcross.mock.calls).toEqual([
      [ORIGINAL, V2],
      [V3, V2],
    ]);
    expect(onUpdate).not.toHaveBeenCalled();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("the confirm counts only the placements that would move", () => {
    const { composer } = fakeComposer([]);
    open(composer);
    fireEvent.click(screen.getByTestId("media-version-menu-a1-v3"));
    expect(screen.getByTestId("media-restore-confirm")).toHaveTextContent("used in 2 places");
  });

  it("a placement that did not move shows an alert on the row", () => {
    const { composer } = fakeComposer([{ elementId: "el-1", error: "locked" }]);
    open(composer);
    fireEvent.click(screen.getByTestId("media-version-menu-a1-v2"));
    fireEvent.click(screen.getByTestId("media-restore-go"));
    expect(screen.getByRole("alert")).toHaveTextContent(/Couldn't move every place onto this version/);
  });

  it("an asset with no saved version shows only the note", () => {
    const { composer } = fakeComposer([]);
    render(<AssetDetailOverlay item={item} versions={[item]} composer={composer} onClose={vi.fn()} />);
    fireEvent.click(screen.getByTestId("media-detail-versions"));
    expect(screen.getByTestId("media-versions-empty")).toBeInTheDocument();
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });
});
