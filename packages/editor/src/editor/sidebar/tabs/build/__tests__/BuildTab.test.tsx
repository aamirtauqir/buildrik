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
import { render, screen, fireEvent, waitFor, act, within } from "@testing-library/react";
import * as React from "react";
import { BuildTab, type BuildTabProps } from "../BuildTab";
import { requestInsertGroup, showInsertReceipt } from "../insertGroupRequest";
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

/** Board 7:18981's three tabs — Elements · Blocks · Components. */
const openTab = (name: "Elements" | "Blocks" | "Components") => fireEvent.click(screen.getByRole("tab", { name }));

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
  /* design-2l9 board 7:18981 replaced the one long source list (137:2 /
     4428:140817) with three tabs. Re-baseline: Add panel. */
  it("draws the board's three tabs, Elements selected; Blocks and Components hold their own groups", () => {
    renderTab();
    const tabs = screen.getAllByRole("tab").map((t) => t.textContent);
    expect(tabs).toEqual(["Elements", "Blocks", "Components"]);
    expect(screen.getByRole("tab", { name: "Elements" })).toHaveAttribute("aria-selected", "true");
    expect(screen.queryByTestId("insert-group-blocks")).toBeNull();
    openTab("Blocks");
    expect(screen.getByTestId("insert-group-blocks")).toBeTruthy();
    openTab("Components");
    // 215:43556 (B6-K01) names the saved group "Saved components · This site";
    // L1-022 retired BUILT-IN COMPONENTS, which repeated ELEMENTS under other names.
    expect(screen.getByText("Saved components · This site")).toBeTruthy();
    expect(screen.queryByText("TEMPLATES")).toBeNull();
    expect(screen.queryByText("BUILT-IN COMPONENTS")).toBeNull();
  });

  it("Elements lists the catalog by category, open — \"Basic elements\" first", () => {
    renderTab();
    const labels = Array.from(document.querySelectorAll('[data-testid^="insert-group-label-cat-"]')).map((e) => e.textContent);
    expect(labels[0]).toBe("Basic elements");
    expect(labels).toContain("Layout");
    expect(screen.getByTestId("insert-group-cat-basic")).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByTestId("insert-el-Heading")).toBeTruthy();
    expect(screen.queryByTestId(/^insert-block-/)).toBeNull();
  });

  it("groups fold independently — folding Layout keeps Basic elements open", () => {
    renderTab();
    fireEvent.click(screen.getByTestId("insert-group-cat-layout"));
    expect(screen.getByTestId("insert-group-cat-layout")).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByTestId("insert-group-cat-basic")).toHaveAttribute("aria-expanded", "true");
    expect(screen.queryByTestId("insert-el-Section")).toBeNull();
    expect(screen.getByTestId("insert-el-Heading")).toBeTruthy();
  });

  /* Drag-only Add (owner 2026-11-19): a pointer click on a block card only
     hints; Enter inserts through the same onBlockClick path elements use. */
  it("a BLOCKS card: a pointer click only hints, Enter inserts through onBlockClick", () => {
    const onBlockClick = vi.fn();
    renderTab({ onBlockClick });
    openTab("Blocks");
    const first = document.querySelector('[data-testid^="insert-block-"]') as HTMLElement;
    expect(first).toBeTruthy();
    fireEvent.click(first, { detail: 1 });
    expect(onBlockClick).not.toHaveBeenCalled();
    expect(screen.getByTestId("add-drag-hint")).toHaveTextContent("Drag onto the canvas to add");
    fireEvent.keyDown(first, { key: "Enter" });
    expect(onBlockClick).toHaveBeenCalledTimes(1);
    expect(onBlockClick.mock.calls[0][0]).toHaveProperty("id");
    expect(onBlockClick.mock.calls[0][0]).toHaveProperty("label");
  });
});

/* G2-108 — board 4418:103591: an element row's one-line description is its
   hover tooltip (it used to live only in search matching). */
describe("BuildTab — element row description on hover (G2-108)", () => {
  it("hovering an enabled ELEMENTS row shows its catalog description", () => {
    renderTab();
    expect(screen.queryByTestId("insert-el-tip")).toBeNull();
    const row = screen.getByTestId("insert-el-Container");
    fireEvent.mouseEnter(row);
    const tip = screen.getByTestId("insert-el-tip");
    expect(tip.getAttribute("role")).toBe("tooltip");
    expect(tip.textContent).toBe("Generic wrapper box for grouping elements");
    expect(tip.className).toContain("tw:bg-[var(--bk-gray-900)]");
    fireEvent.mouseLeave(row);
    expect(screen.queryByTestId("insert-el-tip")).toBeNull();
  });

  /* One bubble for the list, not a Tooltip per row — 53 flowbite tooltips
     made this panel's first render 6–10s under load. */
  it("mounts no per-row tooltip", () => {
    renderTab();
    expect(document.querySelectorAll('[role="tooltip"]').length).toBe(0);
  });
});

/* DQ-016/017 — the Add panel drew its own SVG set (a serif "H" at 700 for
   Heading); every row now takes the lucide glyph Layers uses for the type. */
describe("BuildTab — element row icons come from the shared lucide map", () => {
  it("draws lucide glyphs, never a <text> glyph", () => {
    renderTab();
    for (const name of ["Heading", "Text", "Button", "Container", "Image"]) {
      const icon = screen.getByTestId(`insert-row-icon-insert-el-${name}`);
      expect(icon.tagName.toLowerCase()).toBe("svg");
      expect(icon.getAttribute("class")).toContain("lucide");
      expect(icon.querySelector("text")).toBeNull();
    }
  });
});

/* G2-111 — board 4418:99857: SAVED COMPONENTS rows carry a ⠿ grip and drag
   onto the canvas; the group ends in "Components ›" (2L9 215:43547); an empty group
   says how to make one. */
describe("BuildTab — SAVED COMPONENTS (G2-111)", () => {
  const composerWith = (saved: Array<{ id: string; name: string }>) => {
    const emit = vi.fn();
    return {
      emit,
      composer: {
        on: vi.fn(), off: vi.fn(), emit,
        components: { getAllComponents: () => saved },
        elements: { getActivePage: () => ({ id: "page-home" }) },
      } as unknown as NonNullable<BuildTabProps["composer"]>,
    };
  };

  /* Drag-only Add (owner 2026-11-19): a pointer click on a saved component
     only hints; Enter still instantiates it. */
  it("a pointer click only hints; Enter instantiates", async () => {
    const { composer } = composerWith([{ id: "c1", name: "Menu card" }]);
    const instantiateComponent = vi.fn(async () => "inst-1");
    Object.assign(composer, {
      selection: { getSelectedIds: () => [] },
      beginTransaction: vi.fn(),
      endTransaction: vi.fn(),
      elements: { getActivePage: () => ({ id: "page-home", root: { id: "root" } }) },
    });
    Object.assign(composer.components, { instantiateComponent });
    renderTab({ composer });
    openTab("Components");
    const row = screen.getByTestId("insert-mine-c1");
    fireEvent.click(row, { detail: 1 });
    expect(instantiateComponent).not.toHaveBeenCalled();
    expect(screen.getByTestId("add-drag-hint")).toHaveTextContent("Drag onto the canvas to add");
    fireEvent.keyDown(row, { key: "Enter" });
    await waitFor(() => expect(instantiateComponent).toHaveBeenCalledWith("c1", "root"));
  });

  it("rows drag as a component id and draw a grip", () => {
    const { composer } = composerWith([{ id: "c1", name: "Menu card" }]);
    renderTab({ composer });
    openTab("Components");
    const row = screen.getByTestId("insert-mine-c1");
    expect(row).toHaveAttribute("draggable", "true");
    expect(screen.getByTestId("insert-row-grip-insert-mine-c1").textContent).toBe("⠿");
    const setData = vi.fn();
    fireEvent.dragStart(row, { dataTransfer: { setData, effectAllowed: "" } });
    expect(setData).toHaveBeenCalledWith("application/x-aquibra-component", "c1");
  });

  /* 215:43547 (B6-K01): the door reads "Components ›" as a 13/500 accent link. */
  it("Components › opens the Components panel", () => {
    const { composer, emit } = composerWith([{ id: "c1", name: "Menu card" }]);
    renderTab({ composer });
    openTab("Components");
    const door = screen.getByTestId("insert-mine-manage");
    expect(door.textContent).toBe("Components ›");
    expect(door.className).toContain("--bk-accent)");
    fireEvent.click(door);
    expect(emit).toHaveBeenCalledWith("ui:switch-tab", { tab: "components" });
  });

  it("an empty group says how to save one", () => {
    const { composer } = composerWith([]);
    renderTab({ composer });
    openTab("Components");
    expect(screen.getByTestId("insert-mine-empty").textContent).toMatch(/No saved components yet/);
  });
});

/* G2-115 — board 4418:103353: ★ FAVOURITES sits in the drawer (it lived only
   in the Element Picker modal). Recently inserted elements get a RECENT group
   (the modal's other list, kept; designer-notes). */
describe("BuildTab — ★ FAVOURITES and RECENT (G2-115)", () => {
  it("starring an element row adds a ★ FAVOURITES group at the top of Elements, opened", () => {
    renderTab();
    expect(screen.queryByTestId("insert-group-favourites")).toBeNull();
    fireEvent.click(screen.getByTestId("insert-el-fav-Heading"));
    const groups = [...document.querySelectorAll('[data-testid^="insert-group-"]')].map((g) => g.getAttribute("data-testid"));
    expect(groups[0]).toBe("insert-group-favourites");
    expect(screen.getByTestId("insert-group-favourites").textContent).toContain("★ FAVOURITES");
    expect(screen.getByTestId("insert-group-favourites")).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByTestId("insert-fav-Heading")).toBeTruthy();
    fireEvent.click(screen.getByTestId("insert-el-fav-Heading"));
    expect(screen.queryByTestId("insert-group-favourites")).toBeNull();
  });

  it("an inserted element shows up under RECENT", () => {
    const onBlockClick = vi.fn();
    renderTab({ onBlockClick });
    fireEvent.keyDown(screen.getByTestId("insert-el-Heading"), { key: "Enter" });
    expect(onBlockClick).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("insert-group-recent")).toHaveAttribute("aria-expanded", "true");
    fireEvent.keyDown(screen.getByTestId("insert-recent-Heading"), { key: "Enter" });
    expect(onBlockClick).toHaveBeenCalledTimes(2);
  });
});

/* design-2l9 7:19448: the open panel takes the insert receipt, under its list. */
describe("BuildTab — insert receipt", () => {
  it("shows 'Text added to Hero' / 'Selected on canvas · Focus stays here' while open", () => {
    const c = { on: vi.fn(), off: vi.fn(), emit: vi.fn(), selection: { getSelectedIds: () => [] }, elements: { getElement: () => null, getActivePage: () => null } } as never;
    renderTab({ composer: c });
    act(() => {
      expect(showInsertReceipt(c, { title: "Text added to Hero", detail: "Selected on canvas · Focus stays here" })).toBe(true);
    });
    expect(screen.getByTestId("add-insert-receipt")).toHaveTextContent("Text added to HeroSelected on canvas · Focus stays here");
  });
});

// re-baseline: Add panel — no AI entry points in the editor UI (owner, 2026-10-17).
describe("BuildTab — no AI generator", () => {
  it("the Blocks tab offers no Generate a block with AI row", () => {
    renderTab({ composer: { on: vi.fn(), off: vi.fn(), emit: vi.fn(), selection: { getSelectedIds: () => [] }, elements: { getElement: () => null, getActivePage: () => null } } as never });
    openTab("Blocks");
    expect(screen.queryByTestId("insert-generate-block")).toBeNull();
    expect(screen.queryByText(/Generate a block with AI/)).toBeNull();
  });
});

/* G3-079 — board 4428:151488: "Collection list" is an ELEMENTS row that
   inserts L2's collection-list block. */
describe("BuildTab — Collection list row (G3-079)", () => {
  it("inserts the collection-list block", () => {
    const onBlockClick = vi.fn();
    renderTab({ onBlockClick });
    fireEvent.keyDown(screen.getByTestId("insert-el-Collection list"), { key: "Enter" });
    expect(onBlockClick.mock.calls[0][0]).toMatchObject({ id: "collection-list", label: "Collection list" });
  });
});

/* Board 4428:145110 — hovering a block card opens its preview card. */
describe("BuildTab — block hover preview (4428:145110)", () => {
  it("after a beat, names the block, says what it is; Add hints on a pointer click and inserts from the keyboard", () => {
    vi.useFakeTimers();
    const onBlockClick = vi.fn();
    renderTab({ onBlockClick });
    openTab("Blocks");
    fireEvent.mouseEnter(screen.getByTestId("insert-block-hero"));
    expect(screen.queryByTestId("insert-block-preview")).toBeNull();
    act(() => { vi.advanceTimersByTime(350); });
    const card = screen.getByTestId("insert-block-preview");
    expect(card.textContent).toContain("Full-width headline, subtitle and a button.");
    /* Drag-only copy (owner 2026-11-19): visible "Drag Hero to add", named
       "Add Hero" for the keyboard that still inserts with it. */
    const button = within(card).getByRole("button", { name: "Add Hero" });
    expect(button).toHaveTextContent("Drag Hero to add");
    expect(card.textContent).not.toContain("or drag it onto the canvas");
    expect(screen.getByTestId("insert-block-pill-hero")).toHaveTextContent("Drag to add");
    expect(screen.getByTestId("insert-block-hero")).toHaveAttribute("aria-label", "Add Hero");
    fireEvent.click(screen.getByTestId("insert-block-preview-add"), { detail: 1 });
    expect(onBlockClick).not.toHaveBeenCalled();
    expect(screen.getByTestId("add-drag-hint")).toHaveTextContent("Drag onto the canvas to add");
    fireEvent.click(screen.getByTestId("insert-block-preview-add"), { detail: 0 });
    expect(onBlockClick.mock.calls[0][0]).toMatchObject({ id: "hero" });
    expect(screen.queryByTestId("insert-block-preview")).toBeNull();
    vi.useRealTimers();
  });
});

/* Paste HTML… moved into the panel ⋯ (board 7063:78846) and opens the
   modal (6887:78320, G2-112) instead of inserting the clipboard blind. */
describe("BuildTab — ⋯ › Paste HTML… (boards 7063:78846 → 6887:78320)", () => {
  /* Button queries are scoped to the dialog: an unscoped getByRole walks the
     accessibility tree of the whole drawer (53 element rows) and took 2–5s a
     call under load — the timeout the integration run hit. */
  it("opens the modal prefilled from the clipboard; Insert sends it through onBlockClick", async () => {
    const onBlockClick = vi.fn();
    Object.assign(navigator, {
      clipboard: { readText: vi.fn().mockResolvedValue("<div><p>hi</p></div>") },
    });
    renderTab({ onBlockClick });
    fireEvent.click(screen.getByTestId("add-panel-menu"));
    fireEvent.click(screen.getByTestId("insert-paste-html"));
    /* Board 6887:78320: a modal, prefilled from the clipboard; Insert inserts. */
    const field = (await screen.findByLabelText("HTML")) as HTMLTextAreaElement;
    await waitFor(() => expect(field.value).toBe("<div><p>hi</p></div>"));
    expect(onBlockClick).not.toHaveBeenCalled();
    fireEvent.click(within(screen.getByTestId("paste-html-modal")).getByRole("button", { name: "Insert" }));
    expect(onBlockClick).toHaveBeenCalledTimes(1);
    expect(onBlockClick.mock.calls[0][0]).toMatchObject({
      id: "pasted-html",
      content: "<div><p>hi</p></div>",
    });
  });

  it("says what sanitising will strip, and Insert waits for some HTML", async () => {
    const onBlockClick = vi.fn();
    Object.assign(navigator, {
      clipboard: { readText: vi.fn().mockRejectedValue(new Error("denied")) },
    });
    renderTab({ onBlockClick });
    fireEvent.click(screen.getByTestId("add-panel-menu"));
    fireEvent.click(screen.getByTestId("insert-paste-html"));
    const field = (await screen.findByLabelText("HTML")) as HTMLTextAreaElement;
    expect(within(screen.getByTestId("paste-html-modal")).getByRole("button", { name: "Insert" })).toBeDisabled();
    fireEvent.change(field, { target: { value: '<p onclick="x()">a</p><script>1</script><script>2</script>' } });
    expect(screen.getByText("2 <script> tags and 1 event handler will be removed")).toBeInTheDocument();
    fireEvent.click(within(screen.getByTestId("paste-html-modal")).getByRole("button", { name: "Cancel" }));
    expect(onBlockClick).not.toHaveBeenCalled();
  });
});

/* Owner decision 2026-10-03 (board 4418:100087 had the topbar field read
   "Search elements…" while Add was open): the field is the panel's own,
   under the header, and drives the same results / no-results states. */
describe("BuildTab — search in its own field", () => {
  const emitterComposer = () => {
    const handlers = new Map<string, Set<(p: unknown) => void>>();
    const emitted: Array<[string, unknown]> = [];
    const composer = {
      on: (e: string, h: (p: unknown) => void) => {
        if (!handlers.has(e)) handlers.set(e, new Set());
        handlers.get(e)!.add(h);
      },
      off: (e: string, h: (p: unknown) => void) => handlers.get(e)?.delete(h),
      emit: (e: string, p: unknown) => {
        emitted.push([e, p]);
        handlers.get(e)?.forEach((h) => h(p));
      },
    };
    return { composer: composer as unknown as BuildTabProps["composer"], emitted };
  };

  it("draws its own search field under the header, no purpose line, and claims nothing in the topbar", () => {
    const { composer, emitted } = emitterComposer();
    const { unmount } = renderTab({ composer });
    const field = screen.getByPlaceholderText("Search elements");
    expect(field.getAttribute("aria-label")).toBe("Search elements");
    // re-baseline: Add panel — board 7:18981 draws the field with no shortcut chip (⌘F still works, below).
    expect(screen.queryByText("⌘F")).toBeNull();
    expect(screen.queryByText(/Click a row to add it/)).toBeNull();
    unmount();
    expect(emitted.some(([e]) => e === "ui:search-context")).toBe(false);
  });

  it("/ focuses the field from outside a text box; ⌘F only from inside the panel", () => {
    renderTab();
    const field = screen.getByPlaceholderText("Search elements");
    fireEvent.keyDown(document.body, { key: "/" });
    expect(document.activeElement).toBe(field);
    field.blur();
    fireEvent.keyDown(document.body, { key: "f", metaKey: true });
    expect(document.activeElement).not.toBe(field);
    fireEvent.keyDown(screen.getByTestId("insert-el-Heading"), { key: "f", metaKey: true });
    expect(document.activeElement).toBe(field);
  });

  it("a closed drawer answers no shortcut and drops its query", () => {
    const { rerender } = renderTab({ isOpen: true });
    const field = screen.getByPlaceholderText("Search elements") as HTMLInputElement;
    fireEvent.change(field, { target: { value: "button" } });
    rerender(
      <ToastProvider>
        <BuildTab composer={null} onBlockClick={vi.fn()} isOpen={false} />
      </ToastProvider>,
    );
    expect((screen.getByPlaceholderText("Search elements") as HTMLInputElement).value).toBe("");
    fireEvent.keyDown(document.body, { key: "/" });
    expect(document.activeElement).not.toBe(screen.getByPlaceholderText("Search elements"));
  });

  /* Board 7063:78846: "Paste HTML…  ⌘⇧V". The chord reaches an open panel
     by event, and a panel that mounts after it by the held request. */
  it("⌘⇧V opens Paste HTML — live, or on mount after the request", async () => {
    Object.assign(navigator, { clipboard: { readText: vi.fn().mockResolvedValue("") } });
    const { composer } = emitterComposer();
    const first = renderTab({ composer });
    fireEvent.click(screen.getByTestId("add-panel-menu"));
    expect(screen.getByTestId("insert-paste-html").textContent).toContain("⌘⇧V");
    act(() => composer!.emit("ui:insert-open-paste-html" as never, {} as never));
    expect(await screen.findByTestId("paste-html-modal")).toBeTruthy();
    first.unmount();

    const { requestPasteHtml } = await import("../insertGroupRequest");
    requestPasteHtml(composer as never);
    renderTab({ composer });
    expect(await screen.findByTestId("paste-html-modal")).toBeTruthy();
  });

  /* Board 4418:100890 (owner: the drag's visual state): holding an ELEMENTS
     row announces it, and a note under the row says where it will land. */
  it("dragging an element row: announces it, notes where it lands, clears on dragend", () => {
    const { composer, emitted } = emitterComposer();
    renderTab({ composer });
    const row = screen.getByTestId("insert-el-Heading");
    fireEvent.dragStart(row, { dataTransfer: { setData: vi.fn(), effectAllowed: "" } });
    expect(emitted).toContainEqual(["ui:insert-drag", { label: "Heading" }]);
    expect(screen.getByTestId("insert-drag-note").textContent).toBe("Drag it onto the canvas. Release to drop it, or Esc to cancel.");
    act(() => composer!.emit("ui:insert-drag-target" as never, { path: "Home › Hero › Content", into: "Content", after: null } as never));
    expect(screen.getByTestId("insert-drag-note").textContent).toBe(
      "Place the element in Home › Hero › Content. Release to drop it, or Esc to cancel.",
    );
    act(() => { window.dispatchEvent(new Event("dragend")); });
    expect(screen.queryByTestId("insert-drag-note")).toBeNull();
    expect(emitted).toContainEqual(["ui:insert-drag", { label: null }]);
  });

  it("a query swaps the groups for the flat results (138:53) and the no-results state", async () => {
    const { composer } = emitterComposer();
    renderTab({ composer });
    const field = screen.getByPlaceholderText("Search elements");
    fireEvent.change(field, { target: { value: "button" } });
    await waitFor(() => expect(screen.getByTestId("insert-search-results")).toBeTruthy());
    expect(screen.getAllByText("Button").length).toBeGreaterThan(0);
    fireEvent.change(field, { target: { value: "zzznotablock" } });
    await waitFor(() => expect(screen.getByText("Nothing matches ‘zzznotablock’.")).toBeTruthy());
  });
});

/* Board 4428:140817 (Add · Blocks): a 2-column card grid of SECTIONS with
   thumbnails, hover Insert pill, drag-to-place, and the "Blocks use your
   Brand colours and fonts." footnote (G2-110). The 40 rows that duplicated
   ELEMENTS are gone from the group (G2-107). */
describe("BuildTab — BLOCKS as section cards (board 4428:140817)", () => {
  const openBlocks = () => openTab("Blocks");

  it("lists the registry's sections and nothing that duplicates an element", () => {
    renderTab();
    openBlocks();
    const ids = Array.from(document.querySelectorAll('[data-testid^="insert-block-"]'))
      .map((el) => el.getAttribute("data-testid")!)
      .filter((t) => /^insert-block-[a-z-]+$/.test(t) && !/thumb|label|pill/.test(t))
      .map((t) => t.replace("insert-block-", ""));
    expect(ids).toEqual(["hero", "features", "menu-grid", "testimonials-section", "cta", "contact", "footer", "navbar", "pricing"]);
    expect(screen.getByTestId("insert-group-count-blocks").textContent).toBe("9");
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
    expect(JSON.parse(data.block)).toMatchObject({ id: "hero", label: "Hero", category: "Sections" });
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
    expect(screen.getByRole("tab", { name: "Blocks" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByTestId("insert-group-blocks")).toHaveAttribute("aria-expanded", "true");
    expect(composer.emit).toHaveBeenCalledWith("ui:insert-open-group", { group: "blocks" });
  });

  /* Brand › Component styles and "Replace with block…" land here asking for
     BLOCKS; with ELEMENTS' 53 rows still open above it, the asked-for group
     sat off-screen. The asked group opens alone and scrolls into view. */
  it("a request opens that group alone and scrolls it into view", () => {
    const scrolled: string[] = [];
    const orig = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function () { scrolled.push((this as HTMLElement).dataset.testid ?? ""); };
    const composer = { on: vi.fn(), off: vi.fn(), emit: vi.fn(), selection: { getSelectedIds: () => [], getSelected: () => null, getAllSelected: () => [] }, elements: { getElement: () => null, getActivePage: () => null } };
    requestInsertGroup(composer as never, "blocks");
    render(
      <ToastProvider>
        <BuildTab composer={composer as never} onBlockClick={vi.fn()} />
      </ToastProvider>,
    );
    Element.prototype.scrollIntoView = orig;
    expect(screen.queryByTestId("insert-group-cat-basic")).toBeNull();
    expect(scrolled).toContain("insert-section-blocks");
  });

  it("the request is consumed once — the next mount is back on Elements", () => {
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
    expect(screen.getByRole("tab", { name: "Elements" })).toHaveAttribute("aria-selected", "true");
    expect(screen.queryByTestId("insert-group-blocks")).toBeNull();
  });
});

/* Parity V1, board 4428:140817: BLOCKS is the board's 8 sections in a
   two-column grid, in the board's order — plus Pricing table, the one section
   the retired BUILT-IN COMPONENTS group carried (L1-022). */
describe("BuildTab — BLOCKS to board 4428:140817", () => {
  it("lists the board's 8 blocks in order, then Pricing table, two columns", () => {
    renderTab();
    openTab("Blocks");
    expect(screen.getByTestId("insert-group-count-blocks").textContent).toBe("9");
    const labels = Array.from(document.querySelectorAll('[data-testid^="insert-block-label-"]')).map((e) => e.textContent);
    expect(labels).toEqual(["Hero", "Features", "Menu grid", "Testimonials", "CTA", "Contact", "Footer", "Navbar", "Pricing Table"]);
    expect(screen.getByTestId("insert-blocks-grid").className).toMatch(/tw:grid-cols-2/);
  });
});


/* Boards 7:18981 / 302:3965: the strip says where a click lands before it is
   clicked — the same smart-placement rule useBlockInsertion applies. */
describe("BuildTab — insert target strip (board 7:18981)", () => {
  const el = (id: string, type: string, parent: unknown, kids: unknown[] = [], name?: string) => {
    const node = {
      getId: () => id,
      getType: () => type,
      getParent: () => parent,
      getChildren: () => kids,
      getChildCount: () => kids.length,
      getCustomData: (k: string) => (k === "layerName" ? name : undefined),
    };
    return node;
  };
  const composerWith = (selectedId: string | null) => {
    const root = el("root", "container", null);
    const hero = el("hero", "section", root, [], "Hero");
    const heading = el("h1", "heading", hero, [], "Headline");
    const kids = [heading];
    Object.assign(hero, { getChildren: () => kids, getChildCount: () => kids.length });
    Object.assign(root, { getChildren: () => [hero], getChildCount: () => 1 });
    const byId: Record<string, unknown> = { root, hero, h1: heading };
    return {
      on: vi.fn(), off: vi.fn(), emit: vi.fn(),
      selection: { getSelectedIds: () => (selectedId ? [selectedId] : []) },
      elements: { getActivePage: () => ({ name: "Home", root: { id: "root" } }), getElement: (id: string) => byId[id] },
    } as never;
  };

  it("a selected container takes the insert at its end", () => {
    renderTab({ composer: composerWith("hero") });
    expect(screen.getByTestId("add-insert-target-name").textContent).toBe("Insert into Hero");
    expect(screen.getByTestId("add-insert-target-path").textContent).toBe("Home / Hero · At end");
  });

  it("a selected text element is never the target — the insert goes after it", () => {
    renderTab({ composer: composerWith("h1") });
    expect(screen.getByTestId("add-insert-target-name").textContent).toBe("Insert into Hero");
    expect(screen.getByTestId("add-insert-target-path").textContent).toBe("Home / Hero · after Headline");
  });

  it("nothing selected: the page, at the end", () => {
    renderTab({ composer: composerWith(null) });
    expect(screen.getByTestId("add-insert-target-name").textContent).toBe("Insert into Home");
    expect(screen.getByTestId("add-insert-target-path").textContent).toBe("Home · At end");
  });
});

/* Drag-only Add (owner 2026-11-19): a mouse click on an Elements, Blocks or
   Saved components item does not insert — it shows "Drag onto the canvas to
   add" and nothing else. Dragging onto the canvas inserts; Enter and Space
   still insert (the a11y contract). */
describe("BuildTab — drag-only Add (owner 2026-11-19)", () => {
  it("a pointer click on an element row inserts nothing and shows the hint", () => {
    const onBlockClick = vi.fn();
    renderTab({ onBlockClick });
    fireEvent.click(screen.getByTestId("insert-el-Image"), { detail: 1 });
    expect(onBlockClick).not.toHaveBeenCalled();
    expect(screen.getByTestId("add-drag-hint")).toHaveTextContent("Drag onto the canvas to add");
    expect(screen.queryByTestId("insert-group-recent")).toBeNull();
  });

  it("Enter and Space on an element row insert it", () => {
    const onBlockClick = vi.fn();
    renderTab({ onBlockClick });
    fireEvent.keyDown(screen.getByTestId("insert-el-Image"), { key: "Enter" });
    expect(onBlockClick).toHaveBeenLastCalledWith(expect.objectContaining({ id: "image", label: "Image" }));
    fireEvent.keyDown(screen.getByTestId("insert-el-Heading"), { key: " " });
    expect(onBlockClick).toHaveBeenCalledTimes(2);
    expect(screen.queryByTestId("add-drag-hint")).toBeNull();
  });

  it("dragging an element row hands the canvas its block payload (the drop inserts)", () => {
    renderTab();
    const setData = vi.fn();
    fireEvent.dragStart(screen.getByTestId("insert-el-Image"), { dataTransfer: { setData, effectAllowed: "" } });
    expect(setData).toHaveBeenCalledWith("block", expect.stringContaining('"id":"image"'));
  });
});
