/**
 * DQ-012: a failed version restore said nothing. `.catch(() => {})` cleared
 * the "…" spinner and left the row exactly as it was, so a click on Restore
 * that did not land looked identical to one that had not been made.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AssetDetailOverlay } from "../AssetDetailOverlay";
import type { LibraryItem } from "../../data/mediaTypes";

const restoreAssetVersion = vi.fn();
vi.mock("@/services/MediaVersionService", () => ({
  listAssetVersions: async () => [
    { id: "v2", assetId: "as1", url: "https://cdn.example/b.png", bytes: 200, edits: null, createdAt: "2026-01-02T00:00:00.000Z" },
    { id: "v1", assetId: "as1", url: "https://cdn.example/a.png", bytes: 100, edits: null, createdAt: "2026-01-01T00:00:00.000Z" },
  ],
  restoreAssetVersion: (id: string) => restoreAssetVersion(id),
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

describe("AssetDetailOverlay — a version restore that fails says so", () => {
  it("shows an alert on the row and leaves the asset alone", async () => {
    restoreAssetVersion.mockRejectedValue(new Error("network"));
    const onUpdate = vi.fn();
    render(<AssetDetailOverlay item={item} onClose={vi.fn()} onUpdate={onUpdate} />);
    fireEvent.click(screen.getByTestId("media-detail-versions"));
    fireEvent.click(await screen.findByTestId("media-version-menu-v1"));
    fireEvent.click(screen.getByTestId("media-restore-go"));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(/Couldn't restore this version/));
    expect(onUpdate).not.toHaveBeenCalled();
  });
});
