/**
 * REA 2026-10-20 M-6 — the drawer's edit-save links the server history row to
 * the family's PARENT, never to the version being edited (LibraryManager's
 * save already did). Editing a version used to file `createAssetVersion`
 * under that version's own server id and name the file after it.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { ToastProvider } from "@/editor/chrome-ui";
import type { Composer } from "@/engine";
import type { LibraryItem } from "../data/mediaTypes";

const overlayProps = vi.hoisted(() => ({ current: null as null | { onEditImage?(item: LibraryItem): void } }));
vi.mock("../components/AssetDetailOverlay", () => ({
  AssetDetailOverlay: (p: { onEditImage?(item: LibraryItem): void }) => {
    overlayProps.current = p;
    return null;
  },
}));
vi.mock("../components/SlimLauncher", () => ({ SlimLauncher: () => null }));
vi.mock("../components/StockSourceModal", () => ({ StockSourceModal: () => null }));
vi.mock("../hooks/useMediaWriteAccess", () => ({
  useMediaWriteAccess: () => ({ canWrite: true, reason: () => undefined }),
}));
const createAssetVersion = vi.hoisted(() => vi.fn(async () => ({})));
vi.mock("@/services/MediaVersionService", () => ({ createAssetVersion }));

const versionItem: LibraryItem = {
  key: "v2",
  assetId: "srv-v2",
  versionOf: "p1",
  name: "hero-v2.png",
  type: "img",
  src: "https://cdn.example/hero-v2.png",
  size: 10,
  mimeType: "image/png",
  createdAt: "2026-01-02T00:00:00.000Z",
};

vi.mock("../hooks/useMediaState", () => ({
  useMediaState: () =>
    new Proxy(
      {
        libraryItems: [versionItem],
        detailItem: versionItem,
        confirmDelete: null,
        replaceAcrossPair: null,
        selectionContext: null,
      } as Record<string, unknown>,
      { get: (t, k: string) => (k in t ? t[k] : vi.fn()) },
    ),
}));

import { MediaTab } from "../MediaTab";

describe("MediaTab — drawer edit-save history follows the parent (M-6)", () => {
  beforeEach(() => {
    createAssetVersion.mockClear();
    vi.stubGlobal("fetch", vi.fn(async () => ({ blob: async () => new Blob(["x"], { type: "image/png" }) })));
  });

  it("files the server version under the parent's server id, in the parent's folder", async () => {
    const uploadFile = vi.fn(async () => ({
      success: true,
      asset: { id: "v3", src: "https://cdn.example/hero-v3.png", size: 12, serverId: "srv-v3", localOnly: false },
    }));
    const composer = {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
      media: {
        getAsset: (id: string) => (id === "p1" ? { id: "p1", name: "hero.png", folderId: "f-1", serverId: "srv-p1" } : undefined),
        getAssets: () => [{ id: "v2", versionOf: "p1" }],
        uploadFile,
        selectAssets: vi.fn(),
      },
    } as unknown as Composer;
    type OnSave = Parameters<NonNullable<React.ComponentProps<typeof MediaTab>["onOpenImageEditor"]>>[1];
    let onSave: OnSave | null = null;
    render(
      <ToastProvider>
        <MediaTab composer={composer} onOpenImageEditor={(_src, save) => { onSave = save; }} />
      </ToastProvider>,
    );
    overlayProps.current?.onEditImage?.(versionItem);
    expect(onSave).not.toBeNull();
    await onSave!("blob:edited", {} as Parameters<OnSave>[1]);

    const [file, opts] = uploadFile.mock.calls[0] as unknown as [File, { folderId?: string; versionOf: string }];
    expect(file.name).toMatch(/^hero-v3/);
    expect(opts).toMatchObject({ folderId: "f-1", versionOf: "p1" });
    await waitFor(() => expect(createAssetVersion).toHaveBeenCalledTimes(1));
    expect(createAssetVersion).toHaveBeenCalledWith(expect.objectContaining({ assetId: "srv-p1" }));
  });
});
