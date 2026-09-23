/**
 * Toast — the stacking rule (plan 2026-09-21 decisions #24, #35, #43, #17, #25).
 *
 * The rule lives in the store, so every one of the call sites gets it without
 * changing: one transient at a time (newest wins, so Undo is always the last
 * action), persistent toasts pinned above it, 5 s default, Undo ≥ 8 s, the
 * viewport anchored to the canvas region, a context value that never changes
 * identity, and no ink surface anywhere.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, act, cleanup } from "@testing-library/react";
import React from "react";
import { ToastProvider, useToast } from "../index";

let api: ReturnType<typeof useToast>;

function Harness({ onRender }: { onRender?: () => void }) {
  api = useToast();
  onRender?.();
  return null;
}

function mount(onRender?: () => void) {
  render(
    <ToastProvider>
      <Harness onRender={onRender} />
    </ToastProvider>,
  );
}

function cards(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>('[data-testid^="toast-item-"]'));
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("Toast policy — one transient at a time", () => {
  it("ten fast adds leave ONE toast, the newest, and its Undo is the last action", () => {
    mount();
    const undos = Array.from({ length: 10 }, () => vi.fn());
    act(() => {
      undos.forEach((onClick, i) =>
        api.addToast({ description: `Dropped block ${i + 1}`, action: { label: "Undo", onClick } }),
      );
    });
    expect(cards()).toHaveLength(1);
    expect(screen.getByText("Dropped block 10")).toBeTruthy();
    expect(screen.queryByText("Dropped block 1")).toBeNull();
    screen.getByRole("button", { name: "Undo" }).click();
    expect(undos[9]).toHaveBeenCalledTimes(1);
    undos.slice(0, 9).forEach((fn) => expect(fn).not.toHaveBeenCalled());
  });

  it("a replaced transient's timer cannot dismiss the one that replaced it", () => {
    vi.useFakeTimers();
    mount();
    act(() => {
      api.addToast({ description: "First", duration: 1000 });
    });
    act(() => {
      vi.advanceTimersByTime(900);
      api.addToast({ description: "Second", duration: 5000 });
    });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.getByText("Second")).toBeTruthy();
  });
});

describe("Toast policy — persistent toasts are pinned first", () => {
  it("an error toast survives the next transient and renders above it", () => {
    mount();
    act(() => {
      api.addToast({ description: "Publish failed", tone: "error" });
      api.addToast({ description: "Saved" });
    });
    const list = cards();
    expect(list).toHaveLength(2);
    expect(list[0].textContent).toContain("Publish failed");
    expect(list[0].getAttribute("data-persistent")).toBe("true");
    expect(list[1].textContent).toContain("Saved");
  });

  it("an Infinity toast is persistent whatever its tone", () => {
    mount();
    act(() => {
      api.addToast({ description: "Offline — changes queued", tone: "info", duration: Infinity });
      api.addToast({ description: "Block added" });
      api.addToast({ description: "Block moved" });
    });
    const list = cards();
    expect(list).toHaveLength(2);
    expect(list[0].textContent).toContain("Offline — changes queued");
    expect(list[1].textContent).toContain("Block moved");
  });

  it("a second persistent toast slots in below the first and above the transient", () => {
    mount();
    act(() => {
      api.addToast({ description: "Sync failed", tone: "error" });
      api.addToast({ description: "Saved" });
      api.addToast({ description: "Comment failed", tone: "error" });
    });
    expect(cards().map((c) => c.textContent ?? "")).toEqual([
      expect.stringContaining("Sync failed"),
      expect.stringContaining("Comment failed"),
      expect.stringContaining("Saved"),
    ]);
  });
});

describe("Toast policy — durations", () => {
  it("defaults to 5 s", () => {
    vi.useFakeTimers();
    mount();
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

  it("a toast that offers Undo stays at least 8 s even when asked for less", () => {
    vi.useFakeTimers();
    mount();
    act(() => {
      api.addToast({ description: "Heading deleted", duration: 5000, action: { label: "Undo", onClick: () => {} } });
    });
    act(() => {
      vi.advanceTimersByTime(7999);
    });
    expect(screen.getByText("Heading deleted")).toBeTruthy();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.queryByText("Heading deleted")).toBeNull();
  });

  it("an Undo toast asked for longer keeps the longer value", () => {
    vi.useFakeTimers();
    mount();
    act(() => {
      api.addToast({ description: "Page deleted", duration: 10_000, action: { label: "Undo", onClick: () => {} } });
    });
    act(() => {
      vi.advanceTimersByTime(9999);
    });
    expect(screen.getByText("Page deleted")).toBeTruthy();
  });
});

describe("Toast policy — anchor and surface", () => {
  it("offsets the viewport's right edge by --bk-inspector-w", () => {
    mount();
    act(() => {
      api.addToast({ description: "Saved" });
    });
    const viewport = screen.getByTestId("toast-viewport");
    expect(viewport.className).toContain("tw:right-[calc(16px_+_var(--bk-inspector-w,0px))]");
    expect(viewport.className).not.toContain("tw:right-4");
  });

  it.each(["neutral", "info", "success", "warning", "error"] as const)(
    "%s renders on a tint with a hairline, never on ink (NO BLACK RULE)",
    (tone) => {
      mount();
      act(() => {
        api.addToast({ description: `${tone} body`, tone });
      });
      const card = cards()[0];
      expect(card.className).not.toContain("bg-[var(--bk-ink)]");
      expect(card.className).toContain("tw:border-[var(--bk-border)]");
      expect(card.className).toContain("tw:box-border");
    },
  );

  it("a toast without a title is a one-line bar; with a title, a two-line card", () => {
    mount();
    act(() => {
      api.addToast({ description: "Undo: Deleted element", tone: "neutral" });
      api.addToast({ description: "It's kept in the box", title: "Couldn't post", tone: "error" });
    });
    const [twoLine, oneLine] = cards();
    expect(oneLine.className).toContain("tw:items-center");
    expect(twoLine.className).toContain("tw:items-start");
  });
});

describe("Toast policy — the context value is stable", () => {
  it("a consumer renders once across three adds", () => {
    const onRender = vi.fn();
    mount(onRender);
    expect(onRender).toHaveBeenCalledTimes(1);
    act(() => {
      api.addToast({ description: "One" });
      api.addToast({ description: "Two" });
      api.addToast({ description: "Three", tone: "error" });
    });
    expect(cards()).toHaveLength(2);
    expect(onRender).toHaveBeenCalledTimes(1);
  });
});
