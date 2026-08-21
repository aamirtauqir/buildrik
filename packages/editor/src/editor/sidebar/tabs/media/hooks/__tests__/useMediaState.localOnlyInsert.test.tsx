// @vitest-environment jsdom
/**
 * Inserting an asset that never reached the server says so.
 *
 * A local-only upload's `src` is a session Object URL. The sanitizer's
 * ALLOWED_URL_SCHEMES has no `blob:`, so `buildAttributeString` drops the src
 * on the way into the document — and the URL is revoked besides. Measured
 * 2026-08-19: the element mounts with no src, the page shows nothing, and the
 * toast said "added to page ✓".
 *
 * The element IS added; it will not render and will not publish. That is what
 * the toast now says. (The real fix — elements referencing the ASSET, canvas
 * resolving it, export inlining bytes — is a design change, recorded as an open
 * founder decision.)
 *
 * @license BSD-3-Clause
 */
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useMediaState } from "../useMediaState";

const toasts = vi.hoisted(() => [] as Array<{ description?: string; tone?: string }>);

vi.mock("@/editor/chrome-ui", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/editor/chrome-ui")>()),
  useToast: () => ({
    addToast: (t: { description?: string; tone?: string }) => {
      toasts.push(t);
      return "id";
    },
  }),
}));

vi.mock("../useLibraryState", () => ({
  useLibraryState: () => ({
    libraryItems: [], folders: [], allFolders: [],
    counts: { all: 0, img: 0, vid: 0, ico: 0, fnt: 0 },
    activeType: "all", currentFolderId: null, setCurrentFolderId: () => {},
    createFolder: () => {}, deleteFolder: () => {}, moveAsset: () => {},
    bulkMoveAssets: () => {}, renameItem: () => {}, updateItem: () => {},
    setActiveType: () => {}, sort: "newest", sortDir: "desc", gridN: 3,
    fmtFilter: "all", librarySearch: "", setLibrarySearch: () => {},
    setSort: () => {}, setGridN: () => {}, setFmtFilter: () => {},
  }),
}));
vi.mock("../useSelectionState", () => ({
  useSelectionState: () => ({
    selMode: false, selectedKeys: new Set(), toggleSelMode: vi.fn(),
    toggleSelect: vi.fn(), selectAll: vi.fn(), requestBulkDelete: vi.fn(),
    requestDelete: vi.fn(), executeDelete: vi.fn(), cancelDelete: vi.fn(),
    confirmDelete: null,
  }),
}));
vi.mock("../useUploadState", () => ({
  useUploadState: () => ({
    upload: vi.fn(), uploadQueue: [], failedUploads: [], dismissFailedUploads: vi.fn(),
    storageUsed: 0, storageTotal: 1024, panelDragOver: false,
    handlePanelDragEnter: vi.fn(), handlePanelDragLeave: vi.fn(),
    handlePanelDragOver: vi.fn(), handlePanelDrop: vi.fn(),
  }),
}));
vi.mock("../useDiscoveryState", () => ({
  useDiscoveryState: () => ({
    stockPhotos: [], stockVideos: [], discIcons: [], discFonts: [],
    discLoading: { img: false, vid: false, ico: false, fnt: false },
    discoverySearch: "", isDiscoveryEmpty: true, discSearchAll: vi.fn(),
    discOrientation: "all", discColor: "all", setDiscOrientation: vi.fn(),
    setDiscColor: vi.fn(), loadMoreDisc: vi.fn(), saveToLibrary: vi.fn(),
  }),
}));
vi.mock("../useServerStorageQuota", () => ({ useServerStorageQuota: () => ({ quota: null }) }));

function composerWith(asset: Record<string, unknown>) {
  return {
    emit: vi.fn(), on: vi.fn(), off: vi.fn(),
    media: {
      getAsset: vi.fn(() => asset),
      on: vi.fn(), off: vi.fn(), getFolders: vi.fn(() => []),
    },
    elements: {
      getAllPages: vi.fn(() => []),
      getElement: vi.fn(() => ({ id: "el-1" })),
    },
    selection: { select: vi.fn() },
    mediaOps: { insertMediaAt: vi.fn(() => ({ elementId: "el-1", kind: "inserted" })) },
  };
}

describe("insertToCanvas — a local-only asset", () => {
  it("warns instead of claiming it was added to the page", async () => {
    toasts.length = 0;
    const composer = composerWith({ src: "blob:http://x/1", type: "img", name: "shot.png", localOnly: true });
    const { result } = renderHook(() => useMediaState(composer as never));

    await act(async () => {
      await result.current.insertToCanvas("a1");
    });

    const last = toasts[toasts.length - 1];
    expect(last.tone).toBe("warning");
    expect(last.description).toContain("only on this device");
    expect(last.description).not.toContain("added to page ✓");
  });

  it("says the same thing when REPLACING a selected element's media", async () => {
    toasts.length = 0;
    const composer = composerWith({ src: "blob:http://x/1", type: "img", name: "shot.png", localOnly: true });
    (composer as unknown as { mediaOps: Record<string, unknown> }).mediaOps.replaceMedia = vi.fn(() => true);
    const { result } = renderHook(() => useMediaState(composer as never));

    /* The hook exposes the setter (MediaTab uses it to cancel selection); the
       replace branch only runs when a selection context is set, so assert we
       actually got there rather than falling through to the insert path. */
    act(() => {
      result.current.setSelectionContext({ elementId: "el-1" });
    });
    expect(result.current.selectionContext).toEqual({ elementId: "el-1" });
    await act(async () => {
      await result.current.insertToCanvas("a1");
    });

    expect(
      (composer as unknown as { mediaOps: { replaceMedia: ReturnType<typeof vi.fn> } }).mediaOps
        .replaceMedia,
    ).toHaveBeenCalled();
    const last = toasts[toasts.length - 1];
    expect(last.tone).toBe("warning");
    expect(last.description).toContain("only on this device");
  });

  it("still says added for an asset that reached the server", async () => {
    toasts.length = 0;
    const composer = composerWith({ src: "https://cdn/1.png", type: "img", name: "shot.png" });
    const { result } = renderHook(() => useMediaState(composer as never));

    await act(async () => {
      await result.current.insertToCanvas("a1");
    });

    const last = toasts[toasts.length - 1];
    expect(last.tone).toBe("success");
    expect(last.description).toContain("added to page");
  });
});
