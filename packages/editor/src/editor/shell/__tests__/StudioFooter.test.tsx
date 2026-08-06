/**
 * StudioFooter.test.tsx — the board-52:10 contract: selection label, live
 * selection dims from the canvas DOM, `Device · zoom%` on the right, and the
 * E3 structure button.
 *
 * The previous suite asserted "Connected · main", device dimension strings and
 * zoom −/+ preset stepping. Those were the PRE-rebuild footer — the board
 * carries none of them (zoom controls live in the floating canvas toolbar,
 * connection truth in the topbar save pill), and a test protecting removed
 * design is how "No pages yet" survived (PageList.test.tsx:55). Rewritten with
 * the rebuild, in the same commit.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { StudioFooter, type StudioFooterProps } from "../StudioFooter";
import type { Composer } from "../../../engine";

function makeProps(over: Partial<StudioFooterProps> = {}): StudioFooterProps {
  return {
    composer: { setZoom: vi.fn() } as unknown as Composer,
    device: "desktop",
    zoom: 100,
    selectedElement: null,
    ...over,
  };
}

afterEach(() => {
  cleanup();
  for (const n of document.querySelectorAll("[data-buildrick-id]")) n.remove();
  window.history.replaceState({}, "", "/");
});

describe("StudioFooter (board 52:10)", () => {
  // ── left: selection identity ─────────────────────────────────────────────
  it("no selection → 'body'", () => {
    render(<StudioFooter {...makeProps()} />);
    expect(screen.getByTestId("footer-selection-label")).toHaveTextContent("body");
  });

  it("selection → '{Type} · {tagName}', shaped like the board's 'Section · Hero'", () => {
    render(
      <StudioFooter
        {...makeProps({ selectedElement: { id: "el-1", type: "section", tagName: "hero" } })}
      />,
    );
    expect(screen.getByTestId("footer-selection-label")).toHaveTextContent("Section · hero");
  });

  it("selection without a tagName renders the type alone — no dangling separator", () => {
    render(
      <StudioFooter {...makeProps({ selectedElement: { id: "el-1", type: "container" } })} />,
    );
    expect(screen.getByTestId("footer-selection-label")).toHaveTextContent(/^Container$/);
  });

  // ── left: live dims from the canvas DOM ──────────────────────────────────
  it("dims render from the [data-buildrick-id] node when it is in the DOM", () => {
    const node = document.createElement("div");
    node.setAttribute("data-buildrick-id", "el-9");
    // jsdom has no layout — offsetWidth/Height would report 0, so stub them
    // the way a browser reports the board's 680×250 hero.
    Object.defineProperty(node, "offsetWidth", { value: 680 });
    Object.defineProperty(node, "offsetHeight", { value: 250 });
    document.body.appendChild(node);

    render(
      <StudioFooter
        {...makeProps({ selectedElement: { id: "el-9", type: "section", tagName: "hero" } })}
      />,
    );
    expect(screen.getByTestId("footer-selection-dims")).toHaveTextContent("680 × 250");
  });

  it("dims stay hidden when the node is absent — never a '0 × 0' lie", () => {
    render(
      <StudioFooter
        {...makeProps({ selectedElement: { id: "not-mounted", type: "section" } })}
      />,
    );
    expect(screen.queryByTestId("footer-selection-dims")).not.toBeInTheDocument();
  });

  // ── right: device · zoom ─────────────────────────────────────────────────
  it.each([
    ["desktop", 100, "Desktop · 100%"],
    ["wide", 100, "Wide · 100%"],
    ["tablet", 75, "Tablet · 75%"],
    ["mobile", 150, "Mobile · 150%"],
  ] as const)("%s @ %d%% → '%s'", (device, zoom, expected) => {
    render(<StudioFooter {...makeProps({ device, zoom })} />);
    expect(screen.getByTestId("footer-device-zoom")).toHaveTextContent(expected);
  });

  it("unmapped device (watch) capitalises instead of dropping the row", () => {
    render(<StudioFooter {...makeProps({ device: "watch" })} />);
    expect(screen.getByTestId("footer-device-zoom")).toHaveTextContent("Watch · 100%");
  });

  it("fractional zoom rounds like the board's clean '100%'", () => {
    render(<StudioFooter {...makeProps({ zoom: 99.6 })} />);
    expect(screen.getByTestId("footer-device-zoom")).toHaveTextContent("Desktop · 100%");
  });

  // ── what the board does NOT carry must not render ────────────────────────
  it("no connection pill, no zoom buttons, no version string", () => {
    render(<StudioFooter {...makeProps({ syncConnected: true })} />);
    expect(screen.queryByText(/Connected/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Zoom in")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Zoom out")).not.toBeInTheDocument();
    expect(screen.queryByText(/^v\d/)).not.toBeInTheDocument();
  });

  // ── E3 structure button (mode-gated, unchanged by the rebuild) ───────────
  it("Structure button only exists in the E3 4-tool rail mode", () => {
    const onOpenStructure = vi.fn();
    const { unmount } = render(<StudioFooter {...makeProps({ onOpenStructure })} />);
    expect(screen.queryByRole("button", { name: "Page structure" })).toBeNull();
    unmount();

    window.history.replaceState({}, "", "/?rail=e3");
    render(<StudioFooter {...makeProps({ onOpenStructure })} />);
    fireEvent.click(screen.getByRole("button", { name: "Page structure" }));
    expect(onOpenStructure).toHaveBeenCalledTimes(1);
  });
});
