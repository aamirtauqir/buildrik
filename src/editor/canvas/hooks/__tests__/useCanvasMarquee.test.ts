import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Composer } from "../../../../engine/Composer";
import { useCanvasMarquee } from "../useCanvasMarquee";
import type { UseCanvasMarqueeOptions } from "../useCanvasMarquee";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal fake React.MouseEvent with the given client coordinates */
function makeMouseEvent(clientX: number, clientY: number): React.MouseEvent {
  return {
    clientX,
    clientY,
    target: document.createElement("div"), // plain div — not an aqb element / toolbar
  } as unknown as React.MouseEvent;
}

/** Create a canvas div whose getBoundingClientRect() reports origin (0,0) */
function makeCanvasRef(): React.RefObject<HTMLDivElement> {
  const div = document.createElement("div");
  div.getBoundingClientRect = () =>
    ({
      left: 0,
      top: 0,
      width: 800,
      height: 600,
      right: 800,
      bottom: 600,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }) as DOMRect;
  return { current: div } as React.RefObject<HTMLDivElement>;
}

function makeOptions(overrides: Partial<UseCanvasMarqueeOptions> = {}): UseCanvasMarqueeOptions {
  return {
    composer: null as unknown as Composer,
    canvasRef: makeCanvasRef(),
    isEditing: false,
    isDragOver: false,
    draggingElementId: null,
    clear: vi.fn(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests — MARQUEE_MIN_DRAG threshold guards clear()
// ---------------------------------------------------------------------------

describe("useCanvasMarquee — clear() deferred until 5px drag threshold", () => {
  let clear: ReturnType<typeof vi.fn>;
  let options: UseCanvasMarqueeOptions;

  beforeEach(() => {
    clear = vi.fn();
    options = makeOptions({ clear });
  });

  it("does NOT call clear() on mousedown + immediate mouseup (no drag at all)", () => {
    const { result } = renderHook(() => useCanvasMarquee(options));

    act(() => {
      result.current.handleMarqueeStart(makeMouseEvent(100, 100));
    });
    act(() => {
      result.current.handleMarqueeEnd();
    });

    expect(clear).not.toHaveBeenCalled();
  });

  it("does NOT call clear() when drag is below threshold (4px in X)", () => {
    const { result } = renderHook(() => useCanvasMarquee(options));

    act(() => {
      result.current.handleMarqueeStart(makeMouseEvent(100, 100));
    });
    act(() => {
      // Move 4px to the right — below the 5px threshold
      result.current.handleMarqueeMove(makeMouseEvent(104, 100));
    });
    act(() => {
      result.current.handleMarqueeEnd();
    });

    expect(clear).not.toHaveBeenCalled();
  });

  it("does NOT call clear() when drag is below threshold (4px in Y)", () => {
    const { result } = renderHook(() => useCanvasMarquee(options));

    act(() => {
      result.current.handleMarqueeStart(makeMouseEvent(100, 100));
    });
    act(() => {
      // Move 4px downward — below the 5px threshold
      result.current.handleMarqueeMove(makeMouseEvent(100, 104));
    });
    act(() => {
      result.current.handleMarqueeEnd();
    });

    expect(clear).not.toHaveBeenCalled();
  });

  it("DOES call clear() when drag reaches exactly 5px in X", () => {
    const { result } = renderHook(() => useCanvasMarquee(options));

    act(() => {
      result.current.handleMarqueeStart(makeMouseEvent(100, 100));
    });
    act(() => {
      result.current.handleMarqueeMove(makeMouseEvent(105, 100));
    });

    expect(clear).toHaveBeenCalledTimes(1);
  });

  it("DOES call clear() when drag reaches exactly 5px in Y", () => {
    const { result } = renderHook(() => useCanvasMarquee(options));

    act(() => {
      result.current.handleMarqueeStart(makeMouseEvent(100, 100));
    });
    act(() => {
      result.current.handleMarqueeMove(makeMouseEvent(100, 105));
    });

    expect(clear).toHaveBeenCalledTimes(1);
  });

  it("DOES call clear() when drag exceeds threshold (6px in X)", () => {
    const { result } = renderHook(() => useCanvasMarquee(options));

    act(() => {
      result.current.handleMarqueeStart(makeMouseEvent(100, 100));
    });
    act(() => {
      result.current.handleMarqueeMove(makeMouseEvent(106, 100));
    });

    expect(clear).toHaveBeenCalledTimes(1);
  });

  it("calls clear() exactly once even across multiple mousemove events above threshold", () => {
    const { result } = renderHook(() => useCanvasMarquee(options));

    act(() => {
      result.current.handleMarqueeStart(makeMouseEvent(100, 100));
    });
    act(() => {
      result.current.handleMarqueeMove(makeMouseEvent(106, 100));
    });
    act(() => {
      result.current.handleMarqueeMove(makeMouseEvent(120, 100));
    });
    act(() => {
      result.current.handleMarqueeMove(makeMouseEvent(150, 130));
    });

    // clear() must be called only once, not on every subsequent move
    expect(clear).toHaveBeenCalledTimes(1);
  });

  it("resets hasClearedRef after mouseup — next gesture can call clear() again", () => {
    const { result } = renderHook(() => useCanvasMarquee(options));

    // First gesture — crosses threshold
    act(() => {
      result.current.handleMarqueeStart(makeMouseEvent(100, 100));
    });
    act(() => {
      result.current.handleMarqueeMove(makeMouseEvent(106, 100));
    });
    act(() => {
      result.current.handleMarqueeEnd();
    });

    expect(clear).toHaveBeenCalledTimes(1);

    // Second gesture — also crosses threshold; clear() should fire again
    act(() => {
      result.current.handleMarqueeStart(makeMouseEvent(50, 50));
    });
    act(() => {
      result.current.handleMarqueeMove(makeMouseEvent(56, 50));
    });

    expect(clear).toHaveBeenCalledTimes(2);
  });
});
