/**
 * The drawer's version Restore (REA 2026-10-20 M-5): it moves the family's
 * placements onto the version's file — the library's Asset versions "Apply"
 * — instead of the old server restore that rewrote the parent asset's URL and
 * left the site untouched. A placement that does not move says so on the row
 * (DQ-012: a restore that did not land must not look like one never made).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AssetDetailOverlay } from "../AssetDetailOverlay";
import type { LibraryItem } from "@/editor/sidebar/tabs/media/data/mediaTypes";
import type { Composer } from "@/engine/Composer";

vi.mock("@/services/MediaVersionService", () => ({
  listAssetVersions: async () => [
    { id: "v2", assetId: "as1", url: "https://cdn.example/b.png", bytes: 200, edits: null, createdAt: "2026-01-02T00:00:00.000Z" },
    { id: "v1", assetId: "as1", url: "https://cdn.example/a.png", bytes: 100, edits: null, createdAt: "2026-01-01T00:00:00.000Z" },
  ],
}));

const item: LibraryItem = {
  key: "a1",
  assetId: "as1",
  name: "hero",
  type: "img",
  src: "https://cdn.example/hero.png",
  size: 100,
  createdAt: "2026-01-01T00:00:00.000Z",
  mimeType: "image/png",
};

function fakeComposer(failed: Array<{ elementId: string; error: string }>) {
  const replaceAcross = vi.fn(() => ({ replaced: [], failed, clean: failed.length === 0 }));
  const composer = {
    media: {
      getAssets: () => [
        { id: "a1", src: item.src },
        { id: "a1-v1", versionOf: "a1", src: "https://cdn.example/a.png" },
        { id: "a1-v2", versionOf: "a1", src: "https://cdn.example/b.png" },
      ],
    },
    mediaOps: { replaceAcross, getUsages: () => ({ count: 1, elements: [] }) },
    elements: { getAllPages: () => [] },
  } as unknown as Composer;
  return { composer, replaceAcross };
}

async function restoreV1(composer: Composer, onUpdate = vi.fn()) {
  render(<AssetDetailOverlay item={item} composer={composer} onClose={vi.fn()} onUpdate={onUpdate} />);
  fireEvent.click(screen.getByTestId("media-detail-versions"));
  fireEvent.click(await screen.findByTestId("media-version-menu-v1"));
  fireEvent.click(screen.getByTestId("media-restore-go"));
}

describe("AssetDetailOverlay — version restore moves the placements", () => {
  it("replaces every other family src with the version's url and never rewrites the asset", async () => {
    const { composer, replaceAcross } = fakeComposer([]);
    const onUpdate = vi.fn();
    await restoreV1(composer, onUpdate);
    expect(replaceAcross.mock.calls).toEqual([
      [item.src, "https://cdn.example/a.png"],
      ["https://cdn.example/b.png", "https://cdn.example/a.png"],
    ]);
    expect(onUpdate).not.toHaveBeenCalled();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("the confirm counts the family's placements, not only the original's", async () => {
    const { composer } = fakeComposer([]);
    render(<AssetDetailOverlay item={item} composer={composer} onClose={vi.fn()} />);
    fireEvent.click(screen.getByTestId("media-detail-versions"));
    fireEvent.click(await screen.findByTestId("media-version-menu-v1"));
    expect(screen.getByTestId("media-restore-confirm")).toHaveTextContent("used in 3 places");
  });

  it("a placement that did not move shows an alert on the row", async () => {
    const { composer } = fakeComposer([{ elementId: "el-1", error: "locked" }]);
    await restoreV1(composer);
    expect(screen.getByRole("alert")).toHaveTextContent(/Couldn't move every place onto this version/);
  });
});
