/**
 * CommentLayer tests — mode toggle, pin rendering, click-to-pin create,
 * orphan modal + events, reattach flow (S5 shell state 6 + boards 184:x).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor, act } from "@testing-library/react";

const comments: Array<Record<string, unknown>> = [];
const createPinnedComment = vi.fn().mockResolvedValue(undefined);
const reattachReviewComment = vi.fn().mockResolvedValue(undefined);

vi.mock("@/services/ReviewService", () => ({
  currentSiteId: () => "site-1",
  fetchReviewComments: vi.fn(() => Promise.resolve([...comments])),
  createPinnedComment: (...a: unknown[]) => createPinnedComment(...a),
  reattachReviewComment: (...a: unknown[]) => reattachReviewComment(...a),
}));

import { ToastProvider } from "@/editor/chrome-ui";
import { CommentLayer } from "../CommentLayer";
import { anchorSelector } from "../commentAnchors";

type Handler = (p: unknown) => void;

function makeComposer() {
  const listeners = new Map<string, Set<Handler>>();
  return {
    on: vi.fn((ev: string, fn: Handler) => {
      (listeners.get(ev) ?? listeners.set(ev, new Set()).get(ev)!).add(fn);
    }),
    off: vi.fn((ev: string, fn: Handler) => listeners.get(ev)?.delete(fn)),
    emit: vi.fn((ev: string, payload?: unknown) => {
      listeners.get(ev)?.forEach((fn) => fn(payload));
    }),
    elements: { getActivePage: () => ({ id: "p1" }) },
  };
}

function mount(composer: ReturnType<typeof makeComposer>) {
  const canvasRef: React.RefObject<HTMLDivElement | null> = { current: null };
  function Host() {
    const ref = React.useRef<HTMLDivElement | null>(null);
    canvasRef.current = ref.current;
    return (
      <ToastProvider>
        <div
          ref={(el) => {
            ref.current = el;
            canvasRef.current = el;
          }}
          style={{ position: "relative" }}
        >
          <div data-buildrick-id="el-1">anchored</div>
          <CommentLayer composer={composer as never} canvasRef={canvasRef} />
        </div>
      </ToastProvider>
    );
  }
  return render(<Host />);
}

beforeEach(() => {
  if (typeof document.elementFromPoint !== "function") {
    Object.defineProperty(document, "elementFromPoint", {
      value: () => null,
      writable: true,
      configurable: true,
    });
  }
  comments.length = 0;
  createPinnedComment.mockClear();
  reattachReviewComment.mockClear();
});

afterEach(() => cleanup());

function openComment(over: Record<string, unknown>) {
  return {
    id: "c1",
    body: "hero photo is too dark",
    pageId: "p1",
    x: 0.5,
    y: 0.5,
    targetSelector: null,
    status: "OPEN",
    authorKind: "client",
    authorName: "Sara",
    createdAt: new Date().toISOString(),
    ...over,
  };
}

describe("CommentLayer", () => {
  it("is inert until comment mode is switched on, then shows the capture layer", async () => {
    const composer = makeComposer();
    mount(composer);
    expect(screen.queryByTestId("comment-capture-layer")).toBeNull();
    act(() => composer.emit("ui:comment-mode", { on: true }));
    await waitFor(() =>
      expect(screen.getByTestId("comment-capture-layer")).toBeInTheDocument(),
    );
  });

  it("renders numbered pins for OPEN comments on the active page", async () => {
    comments.push(openComment({ id: "c1" }), openComment({ id: "c2", pageId: "other" }));
    const composer = makeComposer();
    mount(composer);
    act(() => composer.emit("ui:comment-mode", { on: true }));
    await waitFor(() => expect(screen.getByText("1")).toBeInTheDocument());
    // other-page comment draws no second pin
    expect(screen.queryByText("2")).toBeNull();
  });

  it("click-to-pin opens the composer and posts with page id + fractions", async () => {
    const composer = makeComposer();
    mount(composer);
    act(() => composer.emit("ui:comment-mode", { on: true }));
    const layer = await screen.findByTestId("comment-capture-layer");
    fireEvent.click(layer, { clientX: 10, clientY: 10 });
    const box = await screen.findByPlaceholderText("Leave a comment…");
    fireEvent.change(box, { target: { value: "make this bigger" } });
    fireEvent.click(screen.getByRole("button", { name: "Post" }));
    await waitFor(() => expect(createPinnedComment).toHaveBeenCalledTimes(1));
    const payload = createPinnedComment.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.body).toBe("make this bigger");
    expect(payload.pageId).toBe("p1");
    expect(typeof payload.x).toBe("number");
    expect(typeof payload.y).toBe("number");
  });

  it("announces orphans (dead anchors) via comments:orphans and shows the modal", async () => {
    comments.push(
      openComment({ id: "dead", targetSelector: anchorSelector("deleted-el") }),
      openComment({ id: "ok", targetSelector: anchorSelector("el-1") }),
    );
    const composer = makeComposer();
    mount(composer);
    await waitFor(() =>
      expect(composer.emit).toHaveBeenCalledWith("comments:orphans", { ids: ["dead"] }),
    );
    expect(await screen.findByText("A comment lost its element")).toBeInTheDocument();
  });

  it("reattach flow: banner shows, element click re-pins and emits comments:reattached", async () => {
    comments.push(openComment({ id: "dead", targetSelector: anchorSelector("gone") }));
    const composer = makeComposer();
    const { container } = mount(composer);
    act(() => composer.emit("comments:reattach-start", { id: "dead" }));
    expect(
      await screen.findByText("Click an element to re-pin the comment · Esc cancels"),
    ).toBeInTheDocument();

    const target = container.querySelector('[data-buildrick-id="el-1"]') as HTMLElement;
    const spy = vi.spyOn(document, "elementFromPoint").mockReturnValue(target);
    fireEvent.click(screen.getByTestId("comment-capture-layer"), { clientX: 5, clientY: 5 });
    await waitFor(() => expect(reattachReviewComment).toHaveBeenCalledTimes(1));
    expect(reattachReviewComment.mock.calls[0][0]).toBe("dead");
    expect((reattachReviewComment.mock.calls[0][1] as Record<string, unknown>).targetSelector).toBe(
      anchorSelector("el-1"),
    );
    await waitFor(() =>
      expect(composer.emit).toHaveBeenCalledWith("comments:reattached", { id: "dead" }),
    );
    spy.mockRestore();
  });

  it("Escape exits comment mode via the composer event", async () => {
    const composer = makeComposer();
    mount(composer);
    act(() => composer.emit("ui:comment-mode", { on: true }));
    await screen.findByTestId("comment-capture-layer");
    fireEvent.keyDown(window, { key: "Escape" });
    expect(composer.emit).toHaveBeenCalledWith("ui:comment-mode", { on: false });
  });

  // ── ui:comment-mode-changed — the state broadcast (topbar plan T6 / eng D4+D16)
  const changedCalls = (composer: ReturnType<typeof makeComposer>) =>
    composer.emit.mock.calls.filter(([ev]) => ev === "ui:comment-mode-changed");

  it("broadcasts ui:comment-mode-changed on every mode change", async () => {
    const composer = makeComposer();
    mount(composer);
    act(() => composer.emit("ui:comment-mode", { on: true }));
    await waitFor(() =>
      expect(composer.emit).toHaveBeenCalledWith("ui:comment-mode-changed", { on: true }),
    );
    composer.emit.mockClear();
    act(() => composer.emit("ui:comment-mode", { on: false }));
    await waitFor(() =>
      expect(composer.emit).toHaveBeenCalledWith("ui:comment-mode-changed", { on: false }),
    );
  });

  it("unmounting while mode is on broadcasts {on:false} — page switch must un-press the bar", async () => {
    const composer = makeComposer();
    const view = mount(composer);
    act(() => composer.emit("ui:comment-mode", { on: true }));
    await screen.findByTestId("comment-capture-layer");
    composer.emit.mockClear();
    view.unmount();
    expect(changedCalls(composer).map(([, p]) => p)).toContainEqual({ on: false });
  });

  // Investigate 2026-07-30: capture-phase Esc outranked every dialog — it
  // killed comment mode UNDER an open modal and its stopPropagation left the
  // modal open (live-reproduced). Esc must close the topmost layer.
  it("Esc yields to an open modal — comment mode survives underneath", async () => {
    const composer = makeComposer();
    mount(composer);
    act(() => composer.emit("ui:comment-mode", { on: true }));
    await screen.findByTestId("comment-capture-layer");
    const dialog = document.createElement("div");
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    document.body.appendChild(dialog);
    try {
      composer.emit.mockClear();
      fireEvent.keyDown(window, { key: "Escape" });
      expect(composer.emit).not.toHaveBeenCalledWith("ui:comment-mode", { on: false });
      expect(screen.getByTestId("comment-capture-layer")).toBeInTheDocument();
    } finally {
      dialog.remove();
    }
  });

  it("unmounting while mode is off broadcasts nothing extra", async () => {
    const composer = makeComposer();
    const view = mount(composer);
    // let the mount-time {on:false} broadcast land first, then clear
    await waitFor(() => expect(changedCalls(composer).length).toBeGreaterThan(0));
    composer.emit.mockClear();
    view.unmount();
    expect(changedCalls(composer)).toHaveLength(0);
  });
});
