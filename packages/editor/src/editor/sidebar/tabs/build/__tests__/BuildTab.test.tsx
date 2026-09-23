// @vitest-environment jsdom
/**
 * BuildTab — render/interaction tests.
 *
 * Verifies the board-137:2 group view renders, and typing in the search box
 * swaps it for the flat cross-source SearchResults (board 138:53) while the
 * pinned panel-bottom stays visible.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import * as React from "react";
import { BuildTab, type BuildTabProps } from "../BuildTab";
import { requestInsertGroup } from "../insertGroupRequest";
import { ToastProvider } from "@/editor/chrome-ui";

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

/** BuildTab uses useToast (Paste-HTML clipboard errors) — the app provides
 *  ToastProvider at the shell; tests must too. */
const renderTab = (props: Partial<BuildTabProps> = {}) =>
  render(
    <ToastProvider>
      <BuildTab composer={null} onBlockClick={vi.fn()} {...props} />
    </ToastProvider>,
  );

// The previous suite here asserted the PRE-board design — the "N blocks ·
// N categories" subtitle, the BASIC/LAYOUT category rows, and a single-open
// accordion. Board 137:2 carries none of them, and a test protecting removed
// design is how "No pages yet" survived (PageList.test.tsx:55). Rewritten to
// the board contract in the same commit as the rebuild.
describe("BuildTab — board 137:2 taxonomy", () => {
  it("renders the title with no count subtitle", () => {
    renderTab();
    expect(screen.getByText("Add")).toBeTruthy();
    expect(screen.queryByText(/categories/)).toBeNull();
  });

  // TEMPLATES is OUT of Insert (founder, 2026-08-07) — templates own a full
  // flow (rail tab, Pages new-page, first-run) and never lived here.
  it("renders the four source groups: ELEMENTS BLOCKS COMPONENTS MINE — no TEMPLATES", () => {
    renderTab();
    for (const label of ["ELEMENTS", "BLOCKS", "COMPONENTS", "MINE"]) {
      expect(screen.getByText(label)).toBeTruthy();
    }
    expect(screen.queryByText("TEMPLATES")).toBeNull();
  });

  it("ELEMENTS is open by default (▾) with its rows mounted; BLOCKS is closed", () => {
    renderTab();
    expect(screen.getByTestId("insert-group-elements")).toHaveAttribute("aria-expanded", "true");
    // A known element row is mounted…
    expect(screen.getByText("Heading")).toBeTruthy();
    // …and the closed BLOCKS group has no rows mounted.
    expect(screen.getByTestId("insert-group-blocks")).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByTestId(/^insert-block-/)).toBeNull();
  });

  it("groups toggle independently — opening BLOCKS keeps ELEMENTS open", () => {
    renderTab();
    fireEvent.click(screen.getByTestId("insert-group-blocks"));
    expect(screen.getByTestId("insert-group-blocks")).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByTestId("insert-group-elements")).toHaveAttribute("aria-expanded", "true");
    // Scoped by testid: a BLOCK named "Heading" exists too once BLOCKS is open.
    expect(screen.getByTestId("insert-el-Heading")).toBeTruthy();
  });

  it("clicking a BLOCKS row inserts through the same onBlockClick path elements use", () => {
    const onBlockClick = vi.fn();
    renderTab({ onBlockClick });
    fireEvent.click(screen.getByTestId("insert-group-blocks"));
    const first = document.querySelector('[data-testid^="insert-block-"]') as HTMLElement;
    expect(first).toBeTruthy();
    fireEvent.click(first);
    expect(onBlockClick).toHaveBeenCalledTimes(1);
    expect(onBlockClick.mock.calls[0][0]).toHaveProperty("id");
    expect(onBlockClick.mock.calls[0][0]).toHaveProperty("label");
  });
});

describe("BuildTab — ⌥ Paste HTML (board 233:1123)", () => {
  it("reads the clipboard and sends content through onBlockClick", async () => {
    const onBlockClick = vi.fn();
    Object.assign(navigator, {
      clipboard: { readText: vi.fn().mockResolvedValue("<div><p>hi</p></div>") },
    });
    renderTab({ onBlockClick });
    fireEvent.click(screen.getByTestId("insert-paste-html"));
    await waitFor(() => expect(onBlockClick).toHaveBeenCalledTimes(1));
    expect(onBlockClick.mock.calls[0][0]).toMatchObject({
      id: "pasted-html",
      content: "<div><p>hi</p></div>",
    });
  });

  it("empty clipboard → warns, never inserts", async () => {
    const onBlockClick = vi.fn();
    Object.assign(navigator, {
      clipboard: { readText: vi.fn().mockResolvedValue("   ") },
    });
    renderTab({ onBlockClick });
    fireEvent.click(screen.getByTestId("insert-paste-html"));
    await waitFor(() => expect(screen.getByText(/Clipboard is empty/)).toBeTruthy());
    expect(onBlockClick).not.toHaveBeenCalled();
  });
});

describe("BuildTab — search", () => {
  it("swaps the group view for the flat cross-source SearchResults (138:53)", async () => {
    const { container } = renderTab();
    const input = container.querySelector("#bld-search-input") as HTMLInputElement;
    expect(input).toBeTruthy();

    fireEvent.change(input, { target: { value: "button" } });

    // SearchBar debounces (150ms) before pushing the query up to the hook.
    await waitFor(() => expect(screen.getByTestId("insert-search-results")).toBeTruthy());
    // Flat rows with the source tag on the right — no results header.
    // "Button" hits BOTH sources (element + block) — that IS the contract.
    expect(screen.getAllByText("Button").length).toBeGreaterThan(0);
    expect(screen.getAllByText("ELEMENTS").length).toBeGreaterThan(0);
    expect(screen.queryByText(/results? for/i)).toBeNull();
    // Board 138:53: the pinned bottom stays visible during search.
    expect(screen.getByTestId("insert-paste-html")).toBeTruthy();
  });

  it("shows the no-results state for an unmatched query", async () => {
    const { container } = renderTab();
    const input = container.querySelector("#bld-search-input") as HTMLInputElement;

    fireEvent.change(input, { target: { value: "zzznotablock" } });

    await waitFor(() =>
      expect(screen.getByText("Nothing matches ‘zzznotablock’.")).toBeTruthy()
    );
  });
});

/* Board 4428:140817 (Add · Blocks): a 2-column card grid of SECTIONS with
   thumbnails, hover Insert pill, drag-to-place, and the "Blocks use your
   Brand colours and fonts." footnote (G2-110). The 40 rows that duplicated
   ELEMENTS are gone from the group (G2-107). */
describe("BuildTab — BLOCKS as section cards (board 4428:140817)", () => {
  const openBlocks = () => fireEvent.click(screen.getByTestId("insert-group-blocks"));

  it("lists the registry's sections and nothing that duplicates an element", () => {
    renderTab();
    openBlocks();
    const ids = Array.from(document.querySelectorAll('[data-testid^="insert-block-"]'))
      .map((el) => el.getAttribute("data-testid")!)
      .filter((t) => /^insert-block-[a-z-]+$/.test(t) && !/thumb|label|pill/.test(t))
      .map((t) => t.replace("insert-block-", ""));
    expect(ids).toEqual(["hero", "features", "footer", "navbar", "cta"]);
    expect(screen.getByTestId("insert-group-count-blocks").textContent).toBe("5");
  });

  it("draws a thumbnail on every card — no blank grey box", () => {
    renderTab();
    openBlocks();
    for (const id of ["hero", "features", "footer", "navbar", "cta"]) {
      const thumb = screen.getByTestId(`insert-block-thumb-${id}`);
      expect(thumb.tagName.toLowerCase()).toBe("svg");
      expect(thumb.getAttribute("data-shape")).toBe(id);
      expect(thumb.querySelectorAll("rect").length).toBeGreaterThan(2);
    }
    expect(screen.getByTestId("insert-blocks-note").textContent).toBe("Blocks use your Brand colours and fonts.");
  });

  it("a card is a drag source writing the payload the canvas drop reads", () => {
    renderTab();
    openBlocks();
    const card = screen.getByTestId("insert-block-hero");
    expect(card.getAttribute("draggable")).toBe("true");
    const data: Record<string, string> = {};
    const dataTransfer = {
      setData: (k: string, v: string) => {
        data[k] = v;
      },
      effectAllowed: "",
    };
    fireEvent.dragStart(card, { dataTransfer });
    expect(JSON.parse(data.block)).toMatchObject({ id: "hero", label: "Hero Section", category: "Sections" });
    expect(data["text/plain"]).toBe("hero");
    expect(dataTransfer.effectAllowed).toBe("copy");
  });
});

/* QA (integration 5e0d47902): "Add a block" with Layers open switched to Add
   and emitted the open-group event in the same tick — before BuildTab had
   mounted to hear it — so BLOCKS stayed closed. A request made while the
   panel is not mounted must still land when it mounts. */
describe("BuildTab — a BLOCKS request made before the panel mounts", () => {
  it("opens BLOCKS on mount when the request came first", () => {
    const composer = { on: vi.fn(), off: vi.fn(), emit: vi.fn(), selection: { getSelectedIds: () => [], getSelected: () => null, getAllSelected: () => [] }, elements: { getElement: () => null, getActivePage: () => null } };
    requestInsertGroup(composer as never, "blocks");
    render(
      <ToastProvider>
        <BuildTab composer={composer as never} onBlockClick={vi.fn()} />
      </ToastProvider>,
    );
    expect(screen.getByTestId("insert-group-blocks")).toHaveAttribute("aria-expanded", "true");
    expect(composer.emit).toHaveBeenCalledWith("ui:insert-open-group", { group: "blocks" });
  });

  it("the request is consumed once — the next mount is back to ELEMENTS only", () => {
    const composer = { on: vi.fn(), off: vi.fn(), emit: vi.fn(), selection: { getSelectedIds: () => [], getSelected: () => null, getAllSelected: () => [] }, elements: { getElement: () => null, getActivePage: () => null } };
    requestInsertGroup(composer as never, "blocks");
    const first = render(
      <ToastProvider>
        <BuildTab composer={composer as never} onBlockClick={vi.fn()} />
      </ToastProvider>,
    );
    first.unmount();
    render(
      <ToastProvider>
        <BuildTab composer={composer as never} onBlockClick={vi.fn()} />
      </ToastProvider>,
    );
    expect(screen.getByTestId("insert-group-blocks")).toHaveAttribute("aria-expanded", "false");
  });
});
