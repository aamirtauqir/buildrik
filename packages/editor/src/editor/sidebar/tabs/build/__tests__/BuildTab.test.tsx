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
import { requestGenerateBlock, requestInsertGroup } from "../insertGroupRequest";
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
  /* Board 4428:140817 names the component groups by where they come from. */
  it("renders the four source groups: ELEMENTS BLOCKS BUILT-IN COMPONENTS SAVED COMPONENTS — no TEMPLATES", () => {
    renderTab();
    for (const label of ["ELEMENTS", "BLOCKS", "BUILT-IN COMPONENTS", "SAVED COMPONENTS"]) {
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
    expect(tip.className).toContain("tw:bg-gray-900");
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

/* G2-111 — board 4418:99857: SAVED COMPONENTS rows carry a ⠿ grip and drag
   onto the canvas; the group ends in "Manage components ›"; an empty group
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

  it("rows drag as a component id and draw a grip", () => {
    const { composer } = composerWith([{ id: "c1", name: "Menu card" }]);
    renderTab({ composer });
    fireEvent.click(screen.getByTestId("insert-group-mine"));
    const row = screen.getByTestId("insert-mine-c1");
    expect(row).toHaveAttribute("draggable", "true");
    expect(screen.getByTestId("insert-row-grip-insert-mine-c1").textContent).toBe("⠿");
    const setData = vi.fn();
    fireEvent.dragStart(row, { dataTransfer: { setData, effectAllowed: "" } });
    expect(setData).toHaveBeenCalledWith("application/x-aquibra-component", "c1");
  });

  it("Manage components › opens the Components panel", () => {
    const { composer, emit } = composerWith([{ id: "c1", name: "Menu card" }]);
    renderTab({ composer });
    fireEvent.click(screen.getByTestId("insert-group-mine"));
    fireEvent.click(screen.getByTestId("insert-mine-manage"));
    expect(emit).toHaveBeenCalledWith("ui:switch-tab", { tab: "components" });
  });

  it("an empty group says how to save one", () => {
    const { composer } = composerWith([]);
    renderTab({ composer });
    fireEvent.click(screen.getByTestId("insert-group-mine"));
    expect(screen.getByTestId("insert-mine-empty").textContent).toMatch(/No saved components yet/);
  });
});

/* G2-115 — board 4418:103353: ★ FAVOURITES sits in the drawer (it lived only
   in the Element Picker modal). Recently inserted elements get a RECENT group
   (the modal's other list, kept; designer-notes). */
describe("BuildTab — ★ FAVOURITES and RECENT (G2-115)", () => {
  it("starring an element row adds a ★ FAVOURITES group above ELEMENTS, opened", () => {
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
    fireEvent.click(screen.getByTestId("insert-el-Heading"));
    expect(onBlockClick).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("insert-group-recent")).toBeTruthy();
    fireEvent.click(screen.getByTestId("insert-group-recent"));
    fireEvent.click(screen.getByTestId("insert-recent-Heading"));
    expect(onBlockClick).toHaveBeenCalledTimes(2);
  });
});

/* G2-117 — board 4418:103353 row → the Generate a block screen. */
describe("BuildTab — ✦ Generate a block with AI… (G2-117)", () => {
  const composer = () =>
    ({ on: vi.fn(), off: vi.fn(), emit: vi.fn(), selection: { getSelectedIds: () => [] }, elements: { getElement: () => null, getActivePage: () => ({ name: "Home", root: { id: "r" } }) } }) as never;

  it("the row sits right above BLOCKS and opens the screen; ‹ Add returns", () => {
    renderTab({ composer: composer() });
    const row = screen.getByTestId("insert-generate-block");
    expect(row.textContent).toBe("✦\u00a0\u00a0Generate a block with AI…");
    expect(row.nextElementSibling?.getAttribute("data-testid")).toBe("insert-section-blocks");
    fireEvent.click(row);
    expect(screen.getByTestId("generate-block")).toBeTruthy();
    fireEvent.click(screen.getByTestId("generate-back"));
    expect(screen.queryByTestId("generate-block")).toBeNull();
  });

  it("a door that asked before the panel mounted opens straight on the screen", () => {
    const c = composer();
    requestGenerateBlock(c);
    renderTab({ composer: c });
    expect(screen.getByTestId("generate-block")).toBeTruthy();
  });
});

/* G3-079 — board 4428:151488: "Collection list" is an ELEMENTS row that
   inserts L2's collection-list block. */
describe("BuildTab — Collection list row (G3-079)", () => {
  it("inserts the collection-list block", () => {
    const onBlockClick = vi.fn();
    renderTab({ onBlockClick });
    fireEvent.click(screen.getByTestId("insert-el-Collection list"));
    expect(onBlockClick.mock.calls[0][0]).toMatchObject({ id: "collection-list", label: "Collection list" });
  });
});

/* Board 4428:145110 — hovering a block card opens its preview card. */
describe("BuildTab — block hover preview (4428:145110)", () => {
  it("after a beat, names the block, says what it is, and Add inserts it", () => {
    vi.useFakeTimers();
    const onBlockClick = vi.fn();
    renderTab({ onBlockClick });
    fireEvent.click(screen.getByTestId("insert-group-blocks"));
    fireEvent.mouseEnter(screen.getByTestId("insert-block-hero"));
    expect(screen.queryByTestId("insert-block-preview")).toBeNull();
    act(() => { vi.advanceTimersByTime(350); });
    const card = screen.getByTestId("insert-block-preview");
    expect(card.textContent).toContain("Full-width headline, subtitle and a button.");
    expect(card.textContent).toContain("or drag it onto the canvas");
    fireEvent.click(screen.getByTestId("insert-block-preview-add"));
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

/* Board 4418:100087: no search box in the drawer — the topbar field reads
   "Search elements…" while Add is open and its query filters this panel. */
describe("BuildTab — search through the topbar field", () => {
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

  it("draws no search box or purpose line, and claims the topbar field", () => {
    const { composer, emitted } = emitterComposer();
    const { container, unmount } = renderTab({ composer });
    expect(container.querySelector("input[type='search'], #bld-search-input")).toBeNull();
    expect(screen.queryByText(/Click a row to add it/)).toBeNull();
    expect(emitted).toContainEqual(["ui:search-context", { placeholder: "Search elements…" }]);
    unmount();
    expect(emitted[emitted.length - 1]).toEqual(["ui:search-context", null]);
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

  it("a topbar query swaps the groups for the flat results (138:53) and the no-results state", async () => {
    const { composer } = emitterComposer();
    renderTab({ composer });
    act(() => composer!.emit("ui:search-query" as never, { query: "button" } as never));
    await waitFor(() => expect(screen.getByTestId("insert-search-results")).toBeTruthy());
    expect(screen.getAllByText("Button").length).toBeGreaterThan(0);
    act(() => composer!.emit("ui:search-query" as never, { query: "zzznotablock" } as never));
    await waitFor(() => expect(screen.getByText("Nothing matches ‘zzznotablock’.")).toBeTruthy());
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
    expect(ids).toEqual(["hero", "features", "menu-grid", "testimonials-section", "cta", "contact", "footer", "navbar"]);
    expect(screen.getByTestId("insert-group-count-blocks").textContent).toBe("8");
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
    expect(screen.getByTestId("insert-group-elements")).toHaveAttribute("aria-expanded", "false");
    expect(scrolled).toContain("insert-section-blocks");
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

/* Parity V1, board 4428:140817: BLOCKS is 8 sections in a two-column grid,
   in the board's order. */
describe("BuildTab — BLOCKS to board 4428:140817", () => {
  it("lists the board's 8 blocks in order, two columns", () => {
    renderTab();
    fireEvent.click(screen.getByTestId("insert-group-blocks"));
    expect(screen.getByTestId("insert-group-count-blocks").textContent).toBe("8");
    const labels = Array.from(document.querySelectorAll('[data-testid^="insert-block-label-"]')).map((e) => e.textContent);
    expect(labels).toEqual(["Hero", "Features", "Menu grid", "Testimonials", "CTA", "Contact", "Footer", "Navbar"]);
    expect(screen.getByTestId("insert-blocks-grid").className).toMatch(/tw:grid-cols-2/);
  });
});

describe("BuildTab — the topbar claim is stable while typing", () => {
  it("claims the field once, however many queries arrive", () => {
    const handlers = new Map<string, Set<(p: unknown) => void>>();
    const emitted: string[] = [];
    const composer = {
      on: (e: string, h: (p: unknown) => void) => {
        if (!handlers.has(e)) handlers.set(e, new Set());
        handlers.get(e)!.add(h);
      },
      off: (e: string, h: (p: unknown) => void) => handlers.get(e)?.delete(h),
      emit: (e: string, p: unknown) => {
        emitted.push(e);
        handlers.get(e)?.forEach((h) => h(p));
      },
    } as unknown as BuildTabProps["composer"];
    renderTab({ composer });
    for (const q of ["b", "bu", "but", ""]) act(() => composer!.emit("ui:search-query" as never, { query: q } as never));
    expect(emitted.filter((e) => e === "ui:search-context")).toHaveLength(1);
  });
});
