/**
 * useAltTextAutoTrigger.test.ts — covers the engine→server auto-fire on
 * UPLOAD_COMPLETE, including all skip paths + the post-AI re-check that
 * preserves user-typed alt text on a TOCTOU race.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const mocks = {
  generateAltTextRemote: vi.fn(),
};

vi.mock("../../../../services/AltTextService", () => ({
  generateAltTextRemote: (...args: any[]) => mocks.generateAltTextRemote(...args),
}));

import { useAltTextAutoTrigger } from "../useAltTextAutoTrigger";
import { MEDIA_EVENTS } from "../../../../shared/constants/media";
import type { MediaAsset } from "../../../../shared/types/media";

type Handler = (payload?: unknown) => void;

function makeMediaMock() {
  const handlers = new Map<string, Set<Handler>>();
  const assetStore = new Map<string, MediaAsset>();

  const media = {
    on: vi.fn((evt: string, h: Handler) => {
      let bag = handlers.get(evt);
      if (!bag) {
        bag = new Set();
        handlers.set(evt, bag);
      }
      bag.add(h);
    }),
    off: vi.fn((evt: string, h: Handler) => {
      handlers.get(evt)?.delete(h);
    }),
    getAsset: vi.fn((id: string): MediaAsset | undefined => assetStore.get(id)),
    updateAsset: vi.fn(async (id: string, updates: Partial<MediaAsset>) => {
      const cur = assetStore.get(id);
      if (!cur) return null;
      const next = { ...cur, ...updates };
      assetStore.set(id, next);
      return next;
    }),
    _setAsset: (a: MediaAsset) => assetStore.set(a.id, a),
    _fire: (evt: string, payload?: unknown) => {
      handlers.get(evt)?.forEach((h) => h(payload));
    },
  };

  return media;
}

function makeAsset(overrides: Partial<MediaAsset> = {}): MediaAsset {
  const base: any = {
    id: "cuid-server-1",
    serverId: "cuid-server-1",
    type: "image",
    name: "photo.jpg",
    src: "https://blob.example/photo.jpg",
    size: 1234,
    mimeType: "image/jpeg",
    createdAt: "2026-05-09T00:00:00Z",
    updatedAt: "2026-05-09T00:00:00Z",
    localOnly: false,
  };
  return { ...base, ...overrides } as MediaAsset;
}

function fireUploadComplete(
  media: ReturnType<typeof makeMediaMock>,
  asset: MediaAsset,
  success = true,
) {
  media._fire(MEDIA_EVENTS.UPLOAD_COMPLETE, {
    success,
    asset,
    fileName: asset.name,
  });
}

async function flushMicrotasks() {
  // Hook handler is async; wait for the await chain to settle.
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

describe("useAltTextAutoTrigger", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does nothing when composer is null", () => {
    renderHook(() => useAltTextAutoTrigger(null));
    expect(mocks.generateAltTextRemote).not.toHaveBeenCalled();
  });

  it("subscribes on mount and cleans up on unmount", () => {
    const media = makeMediaMock();
    const composer = { media } as any;
    const { unmount } = renderHook(() => useAltTextAutoTrigger(composer));
    expect(media.on).toHaveBeenCalledWith(MEDIA_EVENTS.UPLOAD_COMPLETE, expect.any(Function));
    unmount();
    expect(media.off).toHaveBeenCalledWith(MEDIA_EVENTS.UPLOAD_COMPLETE, expect.any(Function));
  });

  it("calls generateAltTextRemote and writes back on the happy path", async () => {
    const media = makeMediaMock();
    const composer = { media } as any;
    const asset = makeAsset();
    media._setAsset(asset);
    mocks.generateAltTextRemote.mockResolvedValueOnce({
      altText: "A red bicycle by a brick wall.",
      skipped: false,
      model: "claude-haiku-4-5",
    });

    renderHook(() => useAltTextAutoTrigger(composer));
    await act(async () => {
      fireUploadComplete(media, asset);
      await flushMicrotasks();
    });

    expect(mocks.generateAltTextRemote).toHaveBeenCalledWith("cuid-server-1");
    expect(media.updateAsset).toHaveBeenCalledWith("cuid-server-1", {
      altText: "A red bicycle by a brick wall.",
    });
  });

  it("skips when upload event signals failure", async () => {
    const media = makeMediaMock();
    const composer = { media } as any;
    const asset = makeAsset();
    renderHook(() => useAltTextAutoTrigger(composer));
    await act(async () => {
      fireUploadComplete(media, asset, false);
      await flushMicrotasks();
    });
    expect(mocks.generateAltTextRemote).not.toHaveBeenCalled();
  });

  it("skips non-image uploads (video, font, icon)", async () => {
    const media = makeMediaMock();
    const composer = { media } as any;
    renderHook(() => useAltTextAutoTrigger(composer));
    for (const type of ["video", "font", "icon"] as const) {
      const asset = makeAsset({ id: `id-${type}`, serverId: `id-${type}`, type } as any);
      media._setAsset(asset);
      await act(async () => {
        fireUploadComplete(media, asset);
        await flushMicrotasks();
      });
    }
    expect(mocks.generateAltTextRemote).not.toHaveBeenCalled();
  });

  it("skips local-only assets (server mirror failed)", async () => {
    const media = makeMediaMock();
    const composer = { media } as any;
    const asset = makeAsset({ localOnly: true, serverId: undefined } as any);
    media._setAsset(asset);
    renderHook(() => useAltTextAutoTrigger(composer));
    await act(async () => {
      fireUploadComplete(media, asset);
      await flushMicrotasks();
    });
    expect(mocks.generateAltTextRemote).not.toHaveBeenCalled();
  });

  it("skips when serverId is missing", async () => {
    const media = makeMediaMock();
    const composer = { media } as any;
    const asset = makeAsset({ serverId: undefined } as any);
    media._setAsset(asset);
    renderHook(() => useAltTextAutoTrigger(composer));
    await act(async () => {
      fireUploadComplete(media, asset);
      await flushMicrotasks();
    });
    expect(mocks.generateAltTextRemote).not.toHaveBeenCalled();
  });

  it("skips when the user already typed alt text", async () => {
    const media = makeMediaMock();
    const composer = { media } as any;
    const asset = makeAsset({ altText: "Already written" });
    media._setAsset(asset);
    renderHook(() => useAltTextAutoTrigger(composer));
    await act(async () => {
      fireUploadComplete(media, asset);
      await flushMicrotasks();
    });
    expect(mocks.generateAltTextRemote).not.toHaveBeenCalled();
    expect(media.updateAsset).not.toHaveBeenCalled();
  });

  it("does not write back when service returns null (auth/network failure)", async () => {
    const media = makeMediaMock();
    const composer = { media } as any;
    const asset = makeAsset();
    media._setAsset(asset);
    mocks.generateAltTextRemote.mockResolvedValueOnce(null);

    renderHook(() => useAltTextAutoTrigger(composer));
    await act(async () => {
      fireUploadComplete(media, asset);
      await flushMicrotasks();
    });

    expect(mocks.generateAltTextRemote).toHaveBeenCalled();
    expect(media.updateAsset).not.toHaveBeenCalled();
  });

  it("does not write back when service returns skipped (server preserved user-typed)", async () => {
    const media = makeMediaMock();
    const composer = { media } as any;
    const asset = makeAsset();
    media._setAsset(asset);
    mocks.generateAltTextRemote.mockResolvedValueOnce({
      altText: "User wrote this",
      skipped: true,
    });

    renderHook(() => useAltTextAutoTrigger(composer));
    await act(async () => {
      fireUploadComplete(media, asset);
      await flushMicrotasks();
    });

    expect(media.updateAsset).not.toHaveBeenCalled();
  });

  it("preserves user-typed alt text when user types DURING generation (engine-side TOCTOU)", async () => {
    const media = makeMediaMock();
    const composer = { media } as any;
    const asset = makeAsset();
    media._setAsset(asset);

    // Server returns generated text but, by the time the AI call resolves,
    // the engine asset has been updated locally with user-typed alt text.
    mocks.generateAltTextRemote.mockImplementationOnce(async () => {
      // Simulate user typing alt text while AI call is in flight.
      media._setAsset({ ...asset, altText: "I typed this mid-stream" });
      return { altText: "AI-generated text", skipped: false };
    });

    renderHook(() => useAltTextAutoTrigger(composer));
    await act(async () => {
      fireUploadComplete(media, asset);
      await flushMicrotasks();
    });

    expect(mocks.generateAltTextRemote).toHaveBeenCalled();
    expect(media.updateAsset).not.toHaveBeenCalled();
  });
});
