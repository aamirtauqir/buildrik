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

/* The toast catalogue (7574:194162): 5 s default unless persistent. */
describe("Toast — catalogue durations", () => {
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
