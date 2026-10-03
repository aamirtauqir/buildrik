/**
 * Toast — the stacking rule (plan 2026-09-21 decisions #24, #35, #43, #17, #25).
 *
 * The rule lives in the store, so every one of the call sites gets it without
 * changing: one transient at a time (newest wins, so Undo is always the last
 * action), persistent toasts pinned above it, 5 s default, Undo ≥ 8 s, the
 * viewport anchored bottom-right, a context value that never changes identity,
 * and the light card of the Settings / CMS toast boards (8134:212718,
 * 8136:215838, 8139:217711 / 217890 / 218055) — owner decision 2026-10-03:
 * the boards win over the dark catalogue 7574:194162 and the bottom-left
 * anchor of 5940:148012.
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
  const rect = (left: number, top: number, width: number, height: number) => () =>
    ({ left, top, right: left + width, bottom: top + height, width, height, x: left, y: top, toJSON: () => ({}) });

  /* In the canvas: 16px in from the column's right edge, 16px above its
     footer toolbar — never over the inspector or the docked toolbar. */
  it("sits 16px inside the canvas column's right edge, 16px above its footer toolbar", () => {
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
    expect(viewport.style.right).toBe(`${window.innerWidth - 1140 + 16}px`);
    expect(viewport.style.bottom).toBe(`${window.innerHeight - 800 + 16}px`);
    expect(viewport.style.left).toBe("");
    anchor.remove();
  });

  /* Full-page views squeeze the column to a sliver without unmounting it
     (measured live in Settings: right edge at x=48): the boards' 48px. */
  it.each([0, 32])("falls back to 48px from the window's right and bottom when the column is %ipx wide", (w) => {
    const anchor = document.createElement("div");
    anchor.setAttribute("data-bk-toast-anchor", "");
    anchor.getBoundingClientRect = rect(16, 90, w, 780);
    document.body.appendChild(anchor);
    mount();
    act(() => {
      api.addToast({ title: "Saved · applies on next publish", description: "Your site settings are saved." });
    });
    const viewport = screen.getByTestId("toast-viewport");
    expect(viewport.style.right).toBe("48px");
    expect(viewport.style.bottom).toBe("48px");
    anchor.remove();
  });

  /* 8139:217711 / 8139:217890: the CMS workspace covers a full-width canvas
     column instead of squeezing it; anchored to it, "Record deleted" sat 16px
     off a canvas nobody could see (right 16 / bottom 61 live). */
  it("takes the window corner while a full-page view covers a wide canvas column", () => {
    const anchor = document.createElement("div");
    anchor.setAttribute("data-bk-toast-anchor", "");
    anchor.getBoundingClientRect = rect(340, 92, 1100, 808);
    const cms = document.createElement("div");
    cms.setAttribute("data-bk-full-page", "");
    document.body.append(anchor, cms);
    mount();
    act(() => {
      api.addToast({ tone: "neutral", title: "Record deleted", description: "This record was deleted. Your change to it wasn't saved." });
    });
    const viewport = screen.getByTestId("toast-viewport");
    expect(viewport.style.right).toBe("48px");
    expect(viewport.style.bottom).toBe("48px");
    anchor.remove();
    cms.remove();
  });

  it.each(["neutral", "info", "success", "warning", "error"] as const)(
    "%s renders on the boards' 460 white card with a 1px border, r8",
    (tone) => {
      mount();
      act(() => {
        api.addToast({ description: `${tone} body`, tone });
      });
      const card = cards()[0];
      expect(card.className).toContain("tw:bg-[var(--bk-bg-elevated)]");
      expect(card.className).toContain("tw:border-[var(--bk-border)]");
      expect(card.className).toContain("tw:rounded-[var(--bk-radius-lg)]");
      expect(card.className).toContain("tw:w-[460px]");
      expect(card.className).toContain("tw:text-[var(--bk-gray-700)]");
      expect(card.className).not.toContain("bk-ink");
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

  it("actions are accent link buttons; every toast keeps its ✕", () => {
    mount();
    act(() => {
      api.addToast({ description: "Moved down", action: { label: "Undo", onClick: () => {} } });
    });
    expect(screen.getByRole("button", { name: "Undo" }).className).toContain("tw:text-[var(--bk-accent)]");
    expect(screen.getByRole("button", { name: "Dismiss notification" })).toBeTruthy();
  });

  it("a toast without a title is one row; with a title, the text stacks", () => {
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

/* Owner call 2026-10-04: an error toast stays on screen until the user deals
   with it — ✕, or its action. Every other tone keeps its timing, an explicit
   `duration` still wins, and hover/focus pause is unchanged. */
describe("Toast policy — error toasts stay until closed", () => {
  it("an error toast is still there after a minute, and data-persistent says so", () => {
    vi.useFakeTimers();
    mount();
    act(() => {
      api.addToast({ tone: "error", description: "Publish failed" });
    });
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(screen.getByText("Publish failed")).toBeTruthy();
    expect(cards()[0].dataset.persistent).toBe("true");
  });

  it("✕ closes it", () => {
    mount();
    act(() => {
      api.addToast({ tone: "error", description: "Publish failed" });
    });
    act(() => {
      screen.getByRole("button", { name: "Dismiss notification" }).click();
    });
    expect(screen.queryByText("Publish failed")).toBeNull();
  });

  it("running its action closes it (primary and secondary), after the action ran", () => {
    mount();
    const retry = vi.fn();
    const details = vi.fn();
    act(() => {
      api.addToast({ tone: "error", description: "Save failed", action: { label: "Retry", onClick: retry } });
    });
    act(() => {
      screen.getByRole("button", { name: "Retry" }).click();
    });
    expect(retry).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Save failed")).toBeNull();
    act(() => {
      api.addToast({ tone: "error", title: "Sync failed", description: "Sync failed body", action: { label: "Retry", onClick: retry }, secondaryAction: { label: "Details", onClick: details } });
    });
    act(() => {
      screen.getByRole("button", { name: "Details" }).click();
    });
    expect(details).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Sync failed body")).toBeNull();
  });

  it("an explicit duration on an error toast is honoured", () => {
    vi.useFakeTimers();
    mount();
    act(() => {
      api.addToast({ tone: "error", description: "Brief error", duration: 3000 });
    });
    act(() => {
      vi.advanceTimersByTime(3001);
    });
    expect(screen.queryByText("Brief error")).toBeNull();
  });

  it.each(["success", "info", "warning", "neutral"] as const)("a %s toast still leaves after 5 s", (tone) => {
    vi.useFakeTimers();
    mount();
    act(() => {
      api.addToast({ tone, description: `${tone} note` });
    });
    act(() => {
      vi.advanceTimersByTime(4999);
    });
    expect(screen.getByText(`${tone} note`)).toBeTruthy();
    act(() => {
      vi.advanceTimersByTime(2);
    });
    expect(screen.queryByText(`${tone} note`)).toBeNull();
  });

  it("a non-error toast's action does not close it early (its timer still does)", () => {
    mount();
    const onClick = vi.fn();
    act(() => {
      api.addToast({ tone: "success", description: "Saved", action: { label: "Publish", onClick } });
    });
    act(() => {
      screen.getByRole("button", { name: "Publish" }).click();
    });
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Saved")).toBeTruthy();
  });
});
