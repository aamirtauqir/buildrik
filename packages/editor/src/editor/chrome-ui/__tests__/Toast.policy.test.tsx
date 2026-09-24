/**
 * Toast — the stacking rule (plan 2026-09-21 decisions #24, #35, #43, #17, #25).
 *
 * The rule lives in the store, so every one of the call sites gets it without
 * changing: one transient at a time (newest wins, so Undo is always the last
 * action), persistent toasts pinned above it, 5 s default, Undo ≥ 8 s, the
 * viewport anchored to the canvas region's bottom-left (board 5940:148012), a
 * context value that never changes identity, and the dark bar of the toast
 * catalogue 7574:194162 (owner ruling 2026-09-24 retired #25 for toasts).
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
  /* Board 5940:148012: "Moved down · Undo" sits 16px in from the canvas
     column's left and 16px above its toolbar. */
  it("sits 16px inside the canvas column, 16px above its footer toolbar", () => {
    const rect = (left: number, top: number, width: number, height: number) => () =>
      ({ left, top, right: left + width, bottom: top + height, width, height, x: left, y: top, toJSON: () => ({}) });
    const anchor = document.createElement("div");
    anchor.setAttribute("data-bk-toast-anchor", "");
    anchor.getBoundingClientRect = rect(340, 90, 800, 780);
    const floor = document.createElement("div");
    floor.setAttribute("data-bk-toast-floor", "");
    floor.getBoundingClientRect = rect(340, 800, 800, 44);
    anchor.appendChild(floor);
    document.body.appendChild(anchor);
    mount();
    act(() => {
      api.addToast({ description: "Moved down" });
    });
    const viewport = screen.getByTestId("toast-viewport");
    expect(viewport.style.left).toBe("356px");
    expect(viewport.style.bottom).toBe(`${window.innerHeight - 800 + 16}px`);
    anchor.remove();
  });

  it.each(["neutral", "info", "success", "warning", "error"] as const)(
    "%s renders on the catalogue's ink bar with white text",
    (tone) => {
      mount();
      act(() => {
        api.addToast({ description: `${tone} body`, tone });
      });
      const card = cards()[0];
      expect(card.className).toContain("tw:bg-[var(--bk-ink)]");
      expect(card.className).toContain("tw:text-white");
      expect(card.className).toContain("tw:rounded-lg");
    },
  );

  it("marks tone with an 8px dot — none for neutral/info, red for error", () => {
    mount();
    act(() => {
      api.addToast({ description: "Saved" });
    });
    expect(cards()[0].querySelector('[data-testid="toast-tone"]')).toBeNull();
    act(() => {
      api.addToast({ description: "Couldn't start collaboration", tone: "error" });
    });
    const dot = cards()[0].querySelector<HTMLElement>('[data-testid="toast-tone"]');
    expect(dot?.className).toContain("tw:bg-[var(--bk-error)]");
  });

  it("actions are on-dark link buttons (blue-300), and only a persistent toast carries ✕", () => {
    mount();
    act(() => {
      api.addToast({ description: "Moved down", action: { label: "Undo", onClick: () => {} } });
    });
    expect(screen.getByRole("button", { name: "Undo" }).className).toContain("tw:text-[var(--bk-blue-300)]");
    expect(screen.queryByRole("button", { name: "Dismiss notification" })).toBeNull();
    act(() => {
      api.addToast({ description: "2 changes are not on the server", tone: "error" });
    });
    expect(screen.getByRole("button", { name: "Dismiss notification" })).toBeTruthy();
  });

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
