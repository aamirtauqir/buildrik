/**
 * Toast — behaviour contract.
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen, act, cleanup } from "@testing-library/react";
import React from "react";
import { ToastProvider, useToast } from "../index";
import { Button } from "flowbite-react";

function Harness({ onReady }: { onReady?: (api: ReturnType<typeof useToast>) => void }) {
  const api = useToast();
  React.useEffect(() => {
    onReady?.(api);
  }, [api, onReady]);
  return <Button onClick={() => api.addToast({ description: "Saved", tone: "success" })}>Fire</Button>;
}

afterEach(() => {
  vi.useRealTimers();
});

describe("Toast", () => {
  it("throws a useful error outside the provider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Harness />)).toThrow(/within ToastProvider/);
    spy.mockRestore();
  });

  it("shows a toast and auto-dismisses after its duration", () => {
    vi.useFakeTimers();
    let api!: ReturnType<typeof useToast>;
    render(
      <ToastProvider>
        <Harness onReady={(a) => {
          api = a;
        }} />
      </ToastProvider>,
    );
    act(() => {
      api.addToast({ description: "Published", duration: 1000 });
    });
    expect(screen.getByText("Published")).toBeTruthy();
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.queryByText("Published")).toBeNull();
  });

  it("duration Infinity persists until dismissed", () => {
    vi.useFakeTimers();
    let api!: ReturnType<typeof useToast>;
    render(
      <ToastProvider>
        <Harness onReady={(a) => {
          api = a;
        }} />
      </ToastProvider>,
    );
    act(() => {
      api.addToast({ description: "Conflict — reload", duration: Infinity });
    });
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(screen.getByText("Conflict — reload")).toBeTruthy();
  });

  it("errors are announced assertively, everything else politely", () => {
    let api!: ReturnType<typeof useToast>;
    render(
      <ToastProvider>
        <Harness onReady={(a) => {
          api = a;
        }} />
      </ToastProvider>,
    );
    act(() => {
      api.addToast({ description: "Saved" });
    });
    expect(screen.getByRole("status").getAttribute("aria-live")).toBe("polite");
    act(() => {
      api.addToast({ description: "Publish failed", tone: "error" });
    });
    expect(screen.getByRole("status").getAttribute("aria-live")).toBe("assertive");
  });

  it("renders an action and can be dismissed by hand", () => {
    const onClick = vi.fn();
    let api!: ReturnType<typeof useToast>;
    render(
      <ToastProvider>
        <Harness onReady={(a) => {
          api = a;
        }} />
      </ToastProvider>,
    );
    act(() => {
      api.addToast({ description: "Deleted 3 pages", action: { label: "Undo", onClick }, duration: Infinity });
    });
    screen.getByRole("button", { name: "Undo" }).click();
    expect(onClick).toHaveBeenCalled();
    act(() => {
      screen.getByRole("button", { name: "Dismiss notification" }).click();
    });
    expect(screen.queryByText("Deleted 3 pages")).toBeNull();
  });
});

/*
  Board 1177:4859 is the toast catalog. Its header states the durations —
  "Default 5000ms · success often 1800-3000 · sync failures STICKY (Infinity +
  Retry)" — and its rows state the tones: five tinted cards, each with its
  title in its own colour, not one white card with a coloured edge.
*/
describe("Toast — board 1177:4859's catalog", () => {
  const fire = (input: Parameters<ReturnType<typeof useToast>["addToast"]>[0]) => {
    let api!: ReturnType<typeof useToast>;
    render(
      <ToastProvider>
        <Harness onReady={(a) => {
          api = a;
        }} />
      </ToastProvider>,
    );
    act(() => {
      api.addToast(input);
    });
    let n: HTMLElement | null = screen.getByText(input.description);
    while (n && !n.classList.contains("tw:rounded-lg")) n = n.parentElement;
    if (!n) throw new Error("toast card not found");
    return n;
  };

  it("defaults to the board's 5000ms", () => {
    vi.useFakeTimers();
    let api!: ReturnType<typeof useToast>;
    render(
      <ToastProvider>
        <Harness onReady={(a) => {
          api = a;
        }} />
      </ToastProvider>,
    );
    act(() => {
      api.addToast({ description: "Saved" });
    });
    act(() => {
      vi.advanceTimersByTime(4999);
    });
    expect(screen.getByText("Saved")).toBeTruthy();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.queryByText("Saved")).toBeNull();
  });

  it.each([
    ["success", "--bk-success-tint", "--bk-success-text"],
    ["info", "--bk-accent-tint", "--bk-accent-text"],
    ["error", "--bk-error-tint", "--bk-error-text"],
    ["warning", "--bk-warning-tint", "--bk-warning-text"],
  ] as const)("tints the whole %s card and colours its title", (tone, tint, text) => {
    const card = fire({ description: `${tone} body`, title: `${tone} title`, tone });
    const html = card.outerHTML;
    expect(html).toContain(tint);
    expect(html).toContain(text);
    // The old treatment: white card, 3px coloured edge.
    expect(html).not.toContain("border-l-[3px]");
    cleanup();
  });

  it("gives the neutral tone the grey card, not a coloured one", () => {
    const card = fire({ description: "Deleted 'Button'", title: "Undo", tone: "neutral" });
    expect(card.outerHTML).toContain("tw:bg-[var(--bk-gray-100)]");
  });
});

describe("Toast — a toast fired on mount is not swallowed", () => {
  /* Children's effects run before their parent's, always. The provider seeds
     its state at render time and subscribes in its own effect, so anything a
     child announced on mount landed in the store with no listener and was
     never displayed — "Offline — changes queued" is exactly that shape. */
  function ToastsOnMount() {
    const { addToast } = useToast();
    React.useEffect(() => {
      addToast({ description: "Offline — changes queued", tone: "info", duration: Infinity });
    }, [addToast]);
    return null;
  }

  it("displays it", () => {
    render(
      <ToastProvider>
        <ToastsOnMount />
      </ToastProvider>,
    );
    expect(screen.getByText("Offline — changes queued")).toBeTruthy();
  });
});

describe("Toast — the board's sticky class", () => {
  const HOOKS = ["useVersionSync", "useCmsSync", "useComponentSync"];

  it.each(HOOKS)("%s reports a failed sync stickily", (hook) => {
    const src = readFileSync(resolve(__dirname, `../../shell/hooks/${hook}.ts`), "utf8");
    expect(src, `${hook} must not let a sync failure time out`).toMatch(/duration:\s*Infinity/);
  });

  /* The board's header reads "sync failures STICKY (Infinity + Retry)", but
     only one of the three offers a button: `useCmsSync` retries on demand,
     while the version and component hooks retry themselves and say so in their
     own copy ("It'll retry when you save the next version or reconnect"). A
     Retry button on a queue that is already retrying is a lie about who is
     doing the work, so the code contract wins over the header's summary. */
  it("gives the CMS queue the manual retry the board draws", () => {
    const src = readFileSync(resolve(__dirname, "../../shell/hooks/useCmsSync.ts"), "utf8");
    expect(src).toMatch(/action:\s*\{/);
  });
});
