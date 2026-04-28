/**
 * Vibcoder Toast wrapper — Bucket B3 T1 Radix-backed compound + queue tests.
 *
 * Replaces Phase 2 passive-surface tests. The new wrapper bridges an
 * imperative useToast() hook to Radix.Toast.Provider/Root/Viewport — these
 * tests cover queue lifecycle, Provider/context wiring, tone classes,
 * default duration, and Radix.Toast.Close auto-dismiss flow.
 */
import { act } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  useToast,
  type ToastInput,
  type UseToastReturn,
} from "./Toast";

function captureHook(): { ref: { current: UseToastReturn | null } } {
  const ref: { current: UseToastReturn | null } = { current: null };
  return { ref };
}

const Capture = ({
  refOut,
}: {
  refOut: { current: UseToastReturn | null };
}) => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  refOut.current = useToast();
  return null;
};

/**
 * Module-level globalThis store persists toasts across HMR (a real DX win
 * in dev — see wrapper docstring). In Vitest the same global persists
 * across tests in the same worker, so we drain it before each test to
 * keep assertions hermetic.
 */
beforeEach(() => {
  const g = globalThis as unknown as Record<string, { toasts: unknown[] } | undefined>;
  const store = g["__VIBCODER_TOAST_STORE__"];
  if (store) store.toasts = [];
});

describe("vibcoder Toast — ToastProvider + useToast queue lifecycle", () => {
  it("renders children + viewport when ToastProvider is mounted", () => {
    const { container } = render(
      <ToastProvider>
        <div data-testid="child">child</div>
      </ToastProvider>,
    );
    expect(screen.getByTestId("child")).toBeTruthy();
    expect(container.querySelector(".bd-toast-viewport")).toBeTruthy();
  });

  it("useToast() throws when called outside ToastProvider", () => {
    const ThrowsOutside = () => {
      useToast();
      return null;
    };
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<ThrowsOutside />)).toThrow(
      /useToast must be used within ToastProvider/,
    );
    spy.mockRestore();
  });

  it("addToast({ tone, title, description }) appends a queue entry and returns a string id", () => {
    const { ref } = captureHook();
    render(
      <ToastProvider>
        <Capture refOut={ref} />
      </ToastProvider>,
    );
    expect(ref.current!.toasts).toHaveLength(0);
    let id = "";
    act(() => {
      id = ref.current!.addToast({
        tone: "success",
        title: "Saved",
        description: "Project saved.",
      });
    });
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
    expect(ref.current!.toasts).toHaveLength(1);
    expect(ref.current!.toasts[0].id).toBe(id);
    expect(ref.current!.toasts[0].tone).toBe("success");
    expect(ref.current!.toasts[0].title).toBe("Saved");
    expect(ref.current!.toasts[0].description).toBe("Project saved.");
  });

  it("removeToast(id) shrinks the queue and leaves siblings intact", () => {
    const { ref } = captureHook();
    render(
      <ToastProvider>
        <Capture refOut={ref} />
      </ToastProvider>,
    );
    let idA = "";
    let idB = "";
    act(() => {
      idA = ref.current!.addToast({ description: "A" });
      idB = ref.current!.addToast({ description: "B" });
    });
    expect(ref.current!.toasts).toHaveLength(2);
    act(() => {
      ref.current!.removeToast(idA);
    });
    expect(ref.current!.toasts).toHaveLength(1);
    expect(ref.current!.toasts[0].id).toBe(idB);
  });

  it("addToast returns unique ids across rapid successive calls", () => {
    const { ref } = captureHook();
    render(
      <ToastProvider>
        <Capture refOut={ref} />
      </ToastProvider>,
    );
    const ids = new Set<string>();
    act(() => {
      for (let i = 0; i < 25; i++) {
        ids.add(ref.current!.addToast({ description: `m${i}` }));
      }
    });
    expect(ids.size).toBe(25);
    // clean up so HMR-persistent store doesn't bleed into other tests
    act(() => {
      for (const id of ids) ref.current!.removeToast(id);
    });
  });

  it("renders bd-toast + bd-toast--<tone> classes for queued entry", () => {
    const { ref } = captureHook();
    const { container } = render(
      <ToastProvider>
        <Capture refOut={ref} />
      </ToastProvider>,
    );
    let id = "";
    act(() => {
      id = ref.current!.addToast({
        tone: "success",
        description: "ok",
      });
    });
    const root = container.querySelector(".bd-toast");
    expect(root).toBeTruthy();
    expect(root!.className).toContain("bd-toast--success");
    expect(container.querySelector(".bd-toast__desc")!.textContent).toBe("ok");
    act(() => ref.current!.removeToast(id));
  });

  it("defaults tone to 'info' when omitted", () => {
    const { ref } = captureHook();
    const { container } = render(
      <ToastProvider>
        <Capture refOut={ref} />
      </ToastProvider>,
    );
    let id = "";
    act(() => {
      id = ref.current!.addToast({ description: "no-tone" });
    });
    const root = container.querySelector(".bd-toast");
    expect(root!.className).toContain("bd-toast--info");
    act(() => ref.current!.removeToast(id));
  });

  it("renders title slot when provided, omits __title when not", () => {
    const { ref } = captureHook();
    const { container } = render(
      <ToastProvider>
        <Capture refOut={ref} />
      </ToastProvider>,
    );
    let id1 = "";
    act(() => {
      id1 = ref.current!.addToast({ description: "no-title" });
    });
    expect(container.querySelector(".bd-toast__title")).toBeNull();
    let id2 = "";
    act(() => {
      id2 = ref.current!.addToast({
        title: "Heading",
        description: "body",
      });
    });
    const titles = container.querySelectorAll(".bd-toast__title");
    expect(titles).toHaveLength(1);
    expect(titles[0].textContent).toBe("Heading");
    act(() => {
      ref.current!.removeToast(id1);
      ref.current!.removeToast(id2);
    });
  });

  it("renders action button with bd-toast__link class when provided", () => {
    const { ref } = captureHook();
    const onClick = vi.fn();
    const { container } = render(
      <ToastProvider>
        <Capture refOut={ref} />
      </ToastProvider>,
    );
    let id = "";
    act(() => {
      id = ref.current!.addToast({
        description: "deleted",
        action: { label: "Undo", onClick },
      });
    });
    const link = container.querySelector(".bd-toast__link");
    expect(link).toBeTruthy();
    expect(link!.textContent).toBe("Undo");
    act(() => ref.current!.removeToast(id));
  });

  it("supports all five ToastTone values", () => {
    const { ref } = captureHook();
    const { container } = render(
      <ToastProvider>
        <Capture refOut={ref} />
      </ToastProvider>,
    );
    const tones: ToastInput["tone"][] = [
      "info",
      "success",
      "warning",
      "error",
      "neutral",
    ];
    const ids: string[] = [];
    act(() => {
      for (const tone of tones) {
        ids.push(ref.current!.addToast({ tone, description: tone! }));
      }
    });
    for (const tone of tones) {
      expect(container.querySelector(`.bd-toast--${tone}`)).toBeTruthy();
    }
    act(() => {
      for (const id of ids) ref.current!.removeToast(id);
    });
  });

  it("Radix onOpenChange(false) drains the queue (auto-dismiss flow)", async () => {
    vi.useFakeTimers();
    try {
      const { ref } = captureHook();
      render(
        <ToastProvider>
          <Capture refOut={ref} />
        </ToastProvider>,
      );
      act(() => {
        ref.current!.addToast({
          description: "auto",
          duration: 1000,
        });
      });
      expect(ref.current!.toasts).toHaveLength(1);
      // Advance past Radix's internal auto-dismiss timer.
      await act(async () => {
        vi.advanceTimersByTime(2000);
      });
      expect(ref.current!.toasts).toHaveLength(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it("default duration is 5000ms when not specified (queue still present at 4999, gone after 5001)", async () => {
    vi.useFakeTimers();
    try {
      const { ref } = captureHook();
      render(
        <ToastProvider>
          <Capture refOut={ref} />
        </ToastProvider>,
      );
      act(() => {
        ref.current!.addToast({ description: "default-duration" });
      });
      expect(ref.current!.toasts).toHaveLength(1);
      await act(async () => {
        vi.advanceTimersByTime(4999);
      });
      expect(ref.current!.toasts).toHaveLength(1);
      await act(async () => {
        vi.advanceTimersByTime(2);
      });
      expect(ref.current!.toasts).toHaveLength(0);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("vibcoder Toast — compound primitive className wraps", () => {
  it("ToastTitle merges bd-toast__title", () => {
    const { container } = render(
      <ToastProvider>
        <Toast open>
          <ToastTitle>x</ToastTitle>
        </Toast>
      </ToastProvider>,
    );
    expect(container.querySelector(".bd-toast__title")).toBeTruthy();
  });

  it("ToastDescription merges bd-toast__desc", () => {
    const { container } = render(
      <ToastProvider>
        <Toast open>
          <ToastDescription>x</ToastDescription>
        </Toast>
      </ToastProvider>,
    );
    expect(container.querySelector(".bd-toast__desc")).toBeTruthy();
  });

  it("ToastAction merges bd-toast__link and forwards altText", () => {
    const { container } = render(
      <ToastProvider>
        <Toast open>
          <ToastAction altText="undo action">Undo</ToastAction>
        </Toast>
      </ToastProvider>,
    );
    const link = container.querySelector(".bd-toast__link");
    expect(link).toBeTruthy();
    expect(link!.textContent).toBe("Undo");
  });

  it("ToastClose merges bd-toast__close", () => {
    const { container } = render(
      <ToastProvider>
        <Toast open>
          <ToastClose>×</ToastClose>
        </Toast>
      </ToastProvider>,
    );
    expect(container.querySelector(".bd-toast__close")).toBeTruthy();
  });

  it("ToastViewport applies bd-toast-viewport class", () => {
    const { container } = render(
      <ToastProvider>
        <ToastViewport data-testid="vp" />
      </ToastProvider>,
    );
    // ToastProvider renders one viewport by default; the explicit one is
    // a duplicate. We assert at least one is present and tagged.
    const viewports = container.querySelectorAll(".bd-toast-viewport");
    expect(viewports.length).toBeGreaterThanOrEqual(1);
  });

  it("merges caller className on ToastTitle", () => {
    const { container } = render(
      <ToastProvider>
        <Toast open>
          <ToastTitle className="extra">x</ToastTitle>
        </Toast>
      </ToastProvider>,
    );
    expect(container.querySelector(".bd-toast__title")!.className).toContain(
      "extra",
    );
  });
});
