// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useDiscoveryState } from "../useDiscoveryState";

const photosMock = vi.fn();
const videosMock = vi.fn();

vi.mock("../../../../../../services/stock/StockService", () => ({
  stockService: {
    searchPhotos: (...args: unknown[]) => photosMock(...args),
    searchVideos: (...args: unknown[]) => videosMock(...args),
  },
}));

function makeFakeComposer() {
  return {
    media: {
      getIcons: () => [],
      getFonts: async () => [],
      uploadFile: vi.fn(),
      updateAsset: vi.fn(),
    },
  };
}

describe("useDiscoveryState — stale-discard contract (S19)", () => {
  beforeEach(() => {
    photosMock.mockReset();
    videosMock.mockReset();
  });

  it("aborts the previous search when a new search starts", async () => {
    let firstSignal: AbortSignal | undefined;
    let secondSignal: AbortSignal | undefined;

    photosMock.mockImplementationOnce((_q, _p, _o, _c, extras) => {
      firstSignal = extras?.signal;
      return new Promise(() => {}); // never resolves
    });
    videosMock.mockImplementationOnce(() => new Promise(() => {}));
    photosMock.mockImplementationOnce((_q, _p, _o, _c, extras) => {
      secondSignal = extras?.signal;
      return Promise.resolve([]);
    });
    videosMock.mockImplementationOnce(() => Promise.resolve([]));

    const composer = makeFakeComposer() as any;
    const showToast = vi.fn();
    const { result } = renderHook(() => useDiscoveryState(composer, showToast));

    await act(async () => {
      result.current.discSearchAll("first");
    });
    await act(async () => {
      result.current.discSearchAll("second");
    });

    expect(firstSignal?.aborted).toBe(true);
    expect(secondSignal?.aborted).toBe(false);
  });

  it("drops late resolutions from the prior controller (out-of-order responses)", async () => {
    // First search: resolves after second one finishes — but its result
    // must NOT land in state because the controller was aborted.
    let resolveFirstPhotos: (v: unknown) => void = () => {};
    photosMock.mockImplementationOnce(() => new Promise((r) => { resolveFirstPhotos = r; }));
    videosMock.mockImplementationOnce(() => Promise.resolve([]));
    photosMock.mockImplementationOnce(() => Promise.resolve([{ id: "p2", url: "second.jpg", thumb: "second-thumb.jpg", attribution: "" }]));
    videosMock.mockImplementationOnce(() => Promise.resolve([]));

    const composer = makeFakeComposer() as any;
    const showToast = vi.fn();
    const { result } = renderHook(() => useDiscoveryState(composer, showToast));

    await act(async () => {
      result.current.discSearchAll("first");
    });
    await act(async () => {
      await result.current.discSearchAll("second");
    });

    // Now resolve the FIRST search's photo promise — late-arriving stale data.
    await act(async () => {
      resolveFirstPhotos([{ id: "p1", url: "stale.jpg", thumb: "stale-thumb.jpg", attribution: "" }]);
      await new Promise((r) => setTimeout(r, 0));
    });

    // State must reflect the SECOND search, not the stale first.
    expect(result.current.stockPhotos).toHaveLength(1);
    expect(result.current.stockPhotos[0].id).toBe("p2");
  });

  it("does not toast when an in-flight request is aborted", async () => {
    photosMock.mockImplementationOnce(
      () => new Promise((_, reject) => reject(new DOMException("Aborted", "AbortError")))
    );
    videosMock.mockImplementationOnce(() => Promise.resolve([]));

    const composer = makeFakeComposer() as any;
    const showToast = vi.fn();
    const { result } = renderHook(() => useDiscoveryState(composer, showToast));

    await act(async () => {
      await result.current.discSearchAll("query-x");
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(showToast).not.toHaveBeenCalled();
  });

  it("setDiscSource updates state and triggers re-search with new source", async () => {
    photosMock.mockResolvedValue([]);
    videosMock.mockResolvedValue([]);

    const composer = makeFakeComposer() as any;
    const showToast = vi.fn();
    const { result } = renderHook(() => useDiscoveryState(composer, showToast));

    expect(result.current.discSource).toBe("unsplash");

    await act(async () => {
      result.current.discSearchAll("logo");
      await new Promise((r) => setTimeout(r, 0));
    });
    photosMock.mockClear();
    videosMock.mockClear();

    await act(async () => {
      result.current.setDiscSource("pexels");
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(result.current.discSource).toBe("pexels");
    // Re-search fired with new source.
    expect(photosMock).toHaveBeenCalled();
    const call = photosMock.mock.calls[0];
    const extras = call[4];
    expect(extras?.source).toBe("pexels");
  });
});
