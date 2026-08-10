// @vitest-environment jsdom
/**
 * useUploadState — quota math + upload state tests.
 * Covers: storage math from local assets vs. server quota (max() merge,
 * unlimited tier), quota cap on upload(), duplicate-name warning, failed
 * upload reporting + retry, media event listeners (progress / error /
 * complete / added / deleted) and their cleanup on unmount.
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import type { Mock } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { MEDIA_EVENTS, STORAGE_QUOTA_BYTES } from "@/shared/constants/media";
import { createMockComposer } from "@/editor/sidebar/__tests__/test-utils/mockComposer";
import { useUploadState } from "../useUploadState";

const asMock = (fn: unknown): Mock => fn as Mock;

function makeFile(name: string, size: number): File {
  return new File([new Uint8Array(size)], name);
}

interface SetupOpts {
  assets?: Array<{ name: string; size: number }>;
  serverQuota?: { usedBytes: number; totalBytes: number } | null;
}

function setup(opts: SetupOpts = {}) {
  const composer = createMockComposer();
  const getAssets = asMock(composer.media.getAssets);
  getAssets.mockReturnValue(opts.assets ?? []);
  const uploadFile = asMock(composer.media.uploadFile);
  const showToast = vi.fn();
  const view = renderHook(() => useUploadState(composer, showToast, opts.serverQuota));
  return { composer, getAssets, uploadFile, showToast, ...view };
}

afterEach(() => {
  vi.useRealTimers();
});

describe("useUploadState — quota math", () => {
  it("sums local asset sizes when no server quota is provided", () => {
    const { result } = setup({
      assets: [
        { name: "a.png", size: 300 },
        { name: "b.png", size: 700 },
      ],
    });

    expect(result.current.storageUsed).toBe(1000);
    expect(result.current.storageTotal).toBe(STORAGE_QUOTA_BYTES);
  });

  it("uses max(server usedBytes, local sum) and the server total when quota is wired", () => {
    // Server ahead of local (mirrored uploads counted server-side).
    const serverAhead = setup({
      assets: [{ name: "a.png", size: 500 }],
      serverQuota: { usedBytes: 2000, totalBytes: 10_000 },
    });
    expect(serverAhead.result.current.storageUsed).toBe(2000);
    expect(serverAhead.result.current.storageTotal).toBe(10_000);

    // Local ahead of server (local-only assets whose mirror failed).
    const localAhead = setup({
      assets: [{ name: "big.mp4", size: 5000 }],
      serverQuota: { usedBytes: 2000, totalBytes: 10_000 },
    });
    expect(localAhead.result.current.storageUsed).toBe(5000);
  });

  it("falls back to the default total on the unlimited tier (totalBytes -1)", () => {
    const { result } = setup({
      serverQuota: { usedBytes: 123, totalBytes: -1 },
    });

    expect(result.current.storageUsed).toBe(123);
    expect(result.current.storageTotal).toBe(STORAGE_QUOTA_BYTES);
  });

  it("recalculates the local sum on MEDIA_ADDED and MEDIA_DELETED", () => {
    const { composer, getAssets, result } = setup({
      assets: [{ name: "a.png", size: 100 }],
    });
    expect(result.current.storageUsed).toBe(100);

    getAssets.mockReturnValue([
      { name: "a.png", size: 100 },
      { name: "b.png", size: 400 },
    ]);
    act(() => {
      composer._emitMedia(MEDIA_EVENTS.MEDIA_ADDED, { assetId: "b" });
    });
    expect(result.current.storageUsed).toBe(500);

    getAssets.mockReturnValue([{ name: "b.png", size: 400 }]);
    act(() => {
      composer._emitMedia(MEDIA_EVENTS.MEDIA_DELETED, { assetId: "a" });
    });
    expect(result.current.storageUsed).toBe(400);
  });
});

describe("useUploadState — upload() quota cap", () => {
  it("rejects the upload with a toast when it would exceed the quota", async () => {
    const { uploadFile, showToast, result } = setup({
      serverQuota: { usedBytes: 900, totalBytes: 1000 },
    });

    let ok: boolean | undefined;
    await act(async () => {
      ok = await result.current.upload([makeFile("big.png", 200)]);
    });

    expect(ok).toBe(false);
    expect(showToast).toHaveBeenCalledWith(
      "Not enough storage — delete some files to free space",
      "error"
    );
    expect(uploadFile).not.toHaveBeenCalled();
  });

  it("counts local-only assets against the server cap (max() merge)", async () => {
    const { uploadFile, result } = setup({
      assets: [{ name: "local-only.mp4", size: 950 }],
      serverQuota: { usedBytes: 0, totalBytes: 1000 },
    });

    let ok: boolean | undefined;
    await act(async () => {
      ok = await result.current.upload([makeFile("more.png", 100)]);
    });

    expect(ok).toBe(false);
    expect(uploadFile).not.toHaveBeenCalled();
  });

  it("uploads when under the cap and resolves true", async () => {
    const { uploadFile, result } = setup({
      serverQuota: { usedBytes: 900, totalBytes: 1000 },
    });

    let ok: boolean | undefined;
    await act(async () => {
      ok = await result.current.upload([makeFile("small.png", 50)]);
    });

    expect(ok).toBe(true);
    expect(uploadFile).toHaveBeenCalledTimes(1);
    expect((uploadFile.mock.calls[0][0] as File).name).toBe("small.png");
  });

  it("skips the cap check entirely on the unlimited tier", async () => {
    const { uploadFile, result } = setup({
      serverQuota: { usedBytes: STORAGE_QUOTA_BYTES * 2, totalBytes: -1 },
    });

    let ok: boolean | undefined;
    await act(async () => {
      ok = await result.current.upload([makeFile("huge.mp4", 5000)]);
    });

    expect(ok).toBe(true);
    expect(uploadFile).toHaveBeenCalledTimes(1);
  });
});

describe("useUploadState — duplicate names + failures", () => {
  it("warns when a file with the same name already exists — but still uploads", async () => {
    const { uploadFile, showToast, result } = setup({
      assets: [{ name: "logo.png", size: 10 }],
    });

    let ok: boolean | undefined;
    await act(async () => {
      ok = await result.current.upload([makeFile("logo.png", 10)]);
    });

    expect(showToast).toHaveBeenCalledWith(
      '"logo.png" already exists — uploading as duplicate',
      "info"
    );
    expect(uploadFile).toHaveBeenCalledTimes(1);
    expect(ok).toBe(true);
  });

  it("reports failed uploads and returns false when uploadFile rejects", async () => {
    const { uploadFile, showToast, result } = setup();
    uploadFile.mockRejectedValueOnce(new Error("disk full"));

    let ok: boolean | undefined;
    await act(async () => {
      ok = await result.current.upload([makeFile("fail.png", 10)]);
    });

    expect(ok).toBe(false);
    expect(showToast).toHaveBeenCalledWith("1 upload failed", "error");
  });

  it("retryUpload re-uploads a previously failed file and clears it from failedUploads", async () => {
    const { composer, uploadFile, result } = setup();
    uploadFile.mockRejectedValueOnce(new Error("network"));

    await act(async () => {
      await result.current.upload([makeFile("retry-me.png", 10)]);
    });
    // The engine reports the failure via the UPLOAD_ERROR event.
    act(() => {
      composer._emitMedia(MEDIA_EVENTS.UPLOAD_ERROR, {
        fileName: "retry-me.png",
        error: "network",
      });
    });
    expect(result.current.failedUploads).toEqual([
      { fileName: "retry-me.png", reason: "network" },
    ]);

    await act(async () => {
      result.current.retryUpload("retry-me.png");
    });

    expect(result.current.failedUploads).toEqual([]);
    expect(uploadFile).toHaveBeenCalledTimes(2);
    expect((uploadFile.mock.calls[1][0] as File).name).toBe("retry-me.png");
  });

  it("retryUpload is a no-op for a file it never retained", async () => {
    const { uploadFile, result } = setup();

    await act(async () => {
      result.current.retryUpload("ghost.png");
    });

    expect(uploadFile).not.toHaveBeenCalled();
  });
});

describe("useUploadState — media event listeners", () => {
  it("tracks upload progress in the queue: appends new files, updates in place", () => {
    const { composer, result } = setup();

    act(() => {
      composer._emitMedia(MEDIA_EVENTS.UPLOAD_PROGRESS, {
        fileName: "a.png",
        progress: 10,
        status: "uploading",
      });
    });
    expect(result.current.uploadQueue).toHaveLength(1);
    expect(result.current.uploadQueue[0].progress).toBe(10);

    act(() => {
      composer._emitMedia(MEDIA_EVENTS.UPLOAD_PROGRESS, {
        fileName: "a.png",
        progress: 80,
        status: "uploading",
      });
    });
    expect(result.current.uploadQueue).toHaveLength(1);
    expect(result.current.uploadQueue[0].progress).toBe(80);
  });

  it("clears complete/error entries from the queue after 1.5s", () => {
    vi.useFakeTimers();
    const { composer, result } = setup();

    act(() => {
      composer._emitMedia(MEDIA_EVENTS.UPLOAD_PROGRESS, {
        fileName: "done.png",
        progress: 100,
        status: "complete",
      });
      composer._emitMedia(MEDIA_EVENTS.UPLOAD_PROGRESS, {
        fileName: "broken.png",
        progress: 40,
        status: "error",
      });
    });
    expect(result.current.uploadQueue).toHaveLength(2);

    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(result.current.uploadQueue).toHaveLength(0);
  });

  // The toast used to claim every failure was an unsupported TYPE, so an
  // oversized JPG was told to upload a JPG. And the failure only reached
  // `failedUploads`, which nothing renders — board 145:148 draws it as a row
  // above the footer, and that row comes from `uploadQueue`.
  it("UPLOAD_ERROR surfaces the real reason, in the queue and the toast", () => {
    const { composer, showToast, result } = setup();

    act(() => {
      composer._emitMedia(MEDIA_EVENTS.UPLOAD_ERROR, {
        fileName: "virus.exe",
        error: "Unsupported type",
      });
    });
    expect(result.current.failedUploads).toEqual([
      { fileName: "virus.exe", reason: "Unsupported type" },
    ]);
    expect(result.current.uploadQueue).toEqual([
      { fileName: "virus.exe", progress: 0, status: "error", error: "Unsupported type" },
    ]);
    expect(showToast).toHaveBeenCalledWith(
      "virus.exe — Unsupported type",
      "error"
    );

    // Payload without fileName/error falls back to generic labels.
    act(() => {
      composer._emitMedia(MEDIA_EVENTS.UPLOAD_ERROR, {});
    });
    expect(result.current.failedUploads[1]).toEqual({
      fileName: "File",
      reason: "Upload failed",
    });
  });

  it("UPLOAD_COMPLETE toasts success for files, info for fonts, and recalcs storage", () => {
    const { composer, getAssets, showToast, result } = setup();
    expect(result.current.storageUsed).toBe(0);

    getAssets.mockReturnValue([{ name: "pic.png", size: 250 }]);
    act(() => {
      composer._emitMedia(MEDIA_EVENTS.UPLOAD_COMPLETE, {
        fileName: "pic.png",
        mimeType: "image/png",
      });
    });
    expect(showToast).toHaveBeenCalledWith("pic.png uploaded ✓", "success");
    expect(result.current.storageUsed).toBe(250);

    act(() => {
      composer._emitMedia(MEDIA_EVENTS.UPLOAD_COMPLETE, {
        fileName: "brand.ttf",
        mimeType: "font/ttf",
      });
    });
    expect(showToast).toHaveBeenCalledWith(
      "Font uploaded! Use it via Text Style → Font → My Fonts",
      "info"
    );
  });

  it("removes all five media listeners on unmount", () => {
    const { composer, unmount } = setup();
    const off = asMock(composer.media.off);
    expect(off).not.toHaveBeenCalled();

    unmount();

    for (const event of [
      MEDIA_EVENTS.UPLOAD_PROGRESS,
      MEDIA_EVENTS.UPLOAD_ERROR,
      MEDIA_EVENTS.MEDIA_ADDED,
      MEDIA_EVENTS.MEDIA_DELETED,
      MEDIA_EVENTS.UPLOAD_COMPLETE,
    ]) {
      expect(off).toHaveBeenCalledWith(event, expect.any(Function));
    }
  });
});
