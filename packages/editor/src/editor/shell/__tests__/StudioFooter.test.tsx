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
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import { StudioFooter, type StudioFooterProps } from "../StudioFooter";
import type { Composer } from "../../../engine";

function makeProps(over: Partial<StudioFooterProps> = {}): StudioFooterProps {
  return {
    /* A composer double without an event surface is an incomplete double —
       the footer subscribes to the project-load state (board 65:412). */
    composer: {
      setZoom: vi.fn(),
      isProjectLoading: () => false,
      /* The footer reads the active page id to look up layer names. */
      elements: { getActivePage: () => ({ id: "page-1" }) },
      on: vi.fn(),
      off: vi.fn(),
    } as unknown as Composer,
    device: "desktop",
    zoom: 100,
    selectedElement: null,
    ...over,
  };
}

afterEach(() => {
  cleanup();
  localStorage.clear();
  for (const n of document.querySelectorAll("[data-buildrick-id]")) n.remove();
  window.history.replaceState({}, "", "/");
});

describe("StudioFooter (board 52:10)", () => {
  // ── left: selection identity ─────────────────────────────────────────────
  // Board 65:2 draws this slot with nothing selected and it reads "Nothing
  // selected". The old expectation was "body" — an element name for a
  // selection that does not exist.
  it("no selection → 'Nothing selected'", () => {
    render(<StudioFooter {...makeProps()} />);
    expect(screen.getByTestId("footer-selection-label")).toHaveTextContent("Nothing selected");
  });

  /* The board's "Section · Hero" is `{Type} · {name}`, and the name is the
     one the user typed in the layers panel — not the HTML tag. Asserting the
     tag here is what let "Container · div" ship. */
  it("selection with a layer name → '{Type} · {name}', the board's 'Section · Hero'", () => {
    localStorage.setItem("buildrick-layers-page-1-names", JSON.stringify({ "el-1": "Hero" }));
    render(
      <StudioFooter
        {...makeProps({ selectedElement: { id: "el-1", type: "section", tagName: "div" } })}
      />,
    );
    expect(screen.getByTestId("footer-selection-label")).toHaveTextContent("Section · Hero");
  });

  it("an unnamed selection renders the type alone — never the tag name", () => {
    render(
      <StudioFooter
        {...makeProps({ selectedElement: { id: "el-1", type: "container", tagName: "div" } })}
      />,
    );
    const label = screen.getByTestId("footer-selection-label");
    expect(label).toHaveTextContent(/^Container$/);
    expect(label).not.toHaveTextContent("div");
  });

  it("a rename lands immediately — the panel persists in an effect, so the event wins", () => {
    localStorage.setItem("buildrick-layers-page-1-names", JSON.stringify({ "el-1": "Hero" }));
    const handlers: Record<string, ((p: unknown) => void)[]> = {};
    const composer = {
      setZoom: vi.fn(),
      isProjectLoading: () => false,
      elements: { getActivePage: () => ({ id: "page-1" }) },
      on: (e: string, fn: (p: unknown) => void) => {
        (handlers[e] ??= []).push(fn);
      },
      off: vi.fn(),
    } as unknown as Composer;

    render(
      <StudioFooter
        {...makeProps({
          composer,
          selectedElement: { id: "el-1", type: "section", tagName: "div" },
        })}
      />,
    );
    expect(screen.getByTestId("footer-selection-label")).toHaveTextContent("Section · Hero");

    act(() => {
      handlers["element:renamed"]?.forEach((fn) => fn({ id: "el-1", name: "Masthead" }));
    });
    expect(screen.getByTestId("footer-selection-label")).toHaveTextContent("Section · Masthead");

    // Cleared name → back to the type label, no dangling separator.
    act(() => {
      handlers["element:renamed"]?.forEach((fn) => fn({ id: "el-1", name: null }));
    });
    expect(screen.getByTestId("footer-selection-label")).toHaveTextContent(/^Section$/);
  });

  // ── board 66:4 · Multi-select ────────────────────────────────────────────
  it("a multi-selection is counted, not named after one of its members", () => {
    const composer = {
      setZoom: vi.fn(),
      isProjectLoading: () => false,
      elements: { getActivePage: () => ({ id: "page-1" }) },
      selection: { getSelectedIds: () => ["a", "b", "c"] },
      on: vi.fn(),
      off: vi.fn(),
    } as unknown as Composer;

    render(
      <StudioFooter
        {...makeProps({
          composer,
          // The shell passes ONE element even when three are selected.
          selectedElement: { id: "a", type: "section", tagName: "div" },
        })}
      />,
    );
    expect(screen.getByTestId("footer-selection-label")).toHaveTextContent("3 elements selected");
  });

  it("a single selection is still named, not counted", () => {
    const composer = {
      setZoom: vi.fn(),
      isProjectLoading: () => false,
      elements: { getActivePage: () => ({ id: "page-1" }) },
      selection: { getSelectedIds: () => ["a"] },
      on: vi.fn(),
      off: vi.fn(),
    } as unknown as Composer;

    render(
      <StudioFooter
        {...makeProps({ composer, selectedElement: { id: "a", type: "section" } })}
      />,
    );
    expect(screen.getByTestId("footer-selection-label")).toHaveTextContent(/^Section$/);
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

  // ── board 65:412 · Loading ───────────────────────────────────────────────
  it("says 'Loading…' while the site is still arriving", () => {
    render(
      <StudioFooter
        {...makeProps({
          composer: {
            setZoom: vi.fn(),
            isProjectLoading: () => true,
            on: vi.fn(),
            off: vi.fn(),
          } as unknown as Composer,
        })}
      />,
    );
    const label = screen.getByTestId("footer-selection-label");
    expect(label).toHaveTextContent("Loading…");
    // "Nothing selected" is what a finished load with no selection reports —
    // the two states must not print the same string.
    expect(label).not.toHaveTextContent("Nothing selected");
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
