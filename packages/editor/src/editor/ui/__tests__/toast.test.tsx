/**
 * Toast — behaviour contract.
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
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
