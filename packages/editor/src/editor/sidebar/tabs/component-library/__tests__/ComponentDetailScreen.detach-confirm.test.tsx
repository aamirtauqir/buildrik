// @vitest-environment jsdom
/**
 * ComponentDetailScreen — the master screen, board 4418:142876 (G2-122):
 * scope block, Detach all (confirmed), inline rename (G2-124), STRUCTURE and
 * USED ON. Per-instance detach moved to the inspector (G2-125).
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, fireEvent, screen, waitFor } from "@testing-library/react";
import * as React from "react";
import { ToastProvider } from "@/editor/chrome-ui";
import { ComponentDetailScreen } from "../ComponentDetailScreen";
import type { Composer } from "@/engine";
import type { ComponentDefinition } from "@/shared/types/components";

function makeComponent(): ComponentDefinition {
  return {
    id: "cmp-1",
    name: "Menu card",
    masterTree: {
      id: "el-master",
      type: "container",
      styles: {},
      children: [
        { id: "a", type: "image", children: [] },
        { id: "b", type: "heading", children: [], data: { layerName: "Title" } },
        { id: "c", type: "text", children: [], dataBindings: { content: { source: "cms" } } },
      ],
    } as unknown as ComponentDefinition["masterTree"],
    createdAt: 0,
    updatedAt: 0,
    version: 1,
  };
}

const root = (id: string) => ({ getId: () => id, getParent: () => null });
function makeComposer() {
  const detachInstance = vi.fn(async (_id: string) => true);
  const updateComponent = vi.fn(async () => true);
  const setActivePage = vi.fn();
  const select = vi.fn();
  const pageOf: Record<string, string> = { e1: "r-home", e2: "r-home", e3: "r-menu" };
  const getElement = (id: string) => ({ getId: () => id, getParent: () => root(pageOf[id]) });
  const composer = {
    selection: { getSelectedIds: () => [], select },
    getProjectMetadata: () => ({ name: "Bella Cucina" }),
    elements: {
      getAllPages: () => [
        { id: "home", name: "Home", root: { id: "r-home" } },
        { id: "menu", name: "Menu", root: { id: "r-menu" } },
        { id: "about", name: "About", root: { id: "r-about" } },
      ],
      getElement,
      setActivePage,
      /* `locateOnCanvas` (the used-on row's jump-to-usage) reads the active
         page before switching — "home" starts as active, matching the
         fixture's own default page. */
      getActivePage: () => ({ id: "home" }),
    },
    components: {
      getInstancesOfComponent: () => [{ elementId: "e1" }, { elementId: "e2" }, { elementId: "e3" }],
      detachInstance,
      updateComponent,
      snapshotComponent: () => ({ component: { id: "c1" }, instances: [{ elementId: "e1" }, { elementId: "e2" }, { elementId: "e3" }] }),
      relinkInstances: vi.fn(() => 3),
    },
  } as unknown as Composer;
  return { composer, detachInstance, updateComponent, setActivePage, select };
}

const renderMaster = (composer: Composer) =>
  render(
    <ToastProvider>
      <ComponentDetailScreen component={makeComponent()} composer={composer} onBack={() => {}} />
    </ToastProvider>,
  );

describe("ComponentDetailScreen — master screen (4418:142876)", () => {
  /* 2L9 215:47035 — the summary pane: name 16/600, scope chip, "Used in … ›",
     then Insert, Update from selection… and More actions ⋯. */
  it("draws the summary pane with the real instance count", () => {
    renderMaster(makeComposer().composer);
    expect(screen.getByTestId("component-name").textContent).toBe("Menu card");
    expect(screen.getByTestId("component-name").className).toContain("tw:text-[16px]");
    expect(screen.getByTestId("component-scope").textContent).toBe("This site");
    expect(screen.getByTestId("component-usedon-toggle").textContent).toMatch(/^Used in 3 places on \d pages? ›$/);
    expect(screen.getByTestId("component-insert").textContent).toBe("Insert");
    expect(screen.getByTestId("component-update").textContent).toBe("Update from selection…");
    expect(screen.getByTestId("component-more").textContent).toBe("More actions ⋯");
    fireEvent.click(screen.getByTestId("component-more"));
    expect(screen.getByTestId("component-delete").textContent).toBe("Delete");
    expect(screen.queryByText("Type")).toBeNull();
    expect(screen.queryByText("Tags")).toBeNull();
  });

  /* 2L9 217:41451 (B6-K17): no dialog — Detach all detaches every instance,
     says how many on how many pages, and Undo relinks them. */
  it("Detach all detaches every instance at once and offers Undo", async () => {
    const { composer, detachInstance } = makeComposer();
    renderMaster(composer);
    fireEvent.click(screen.getByTestId("component-more"));
    fireEvent.click(screen.getByTestId("component-detach-all"));
    expect(screen.queryByTestId("component-detach-all-confirm")).toBeNull();
    await waitFor(() => expect(detachInstance.mock.calls.map((c) => c[0])).toEqual(["e1", "e2", "e3"]));
    expect(await screen.findByText("Detached 3 instances on 2 pages from Menu card")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    const relink = (composer as unknown as { components: { relinkInstances: ReturnType<typeof vi.fn> } }).components.relinkInstances;
    expect(relink).toHaveBeenCalledWith([{ elementId: "e1" }, { elementId: "e2" }, { elementId: "e3" }]);
  });

  /* Flow-check (2026-09-25): a used-on row click used to ONLY switch page —
     on the page that was already active (this fixture's "home"), that read
     as nothing happening at all: no selection, no scroll. It now also
     selects one of the page's actual instances (`locateOnCanvas`, the same
     page-switch/select/scroll seam Review's "Locate ›" row uses). */
  it("STRUCTURE lists the master's parts; USED ON the pages with instances, which jump to an instance on click", () => {
    const { composer, setActivePage, select } = makeComposer();
    renderMaster(composer);
    fireEvent.click(screen.getByTestId("component-structure-header"));
    expect(screen.getByTestId("component-structure-header").textContent).toContain("3");
    const rows = screen.getAllByTestId("component-structure-row").map((r) => r.textContent);
    expect(rows).toEqual(["Imageimage", "Titleheading", "Texttext · CMS bound"]);
    fireEvent.click(screen.getByTestId("component-usedon-toggle"));
    expect(screen.getByTestId("component-usedon-home").textContent).toBe("Home2 instances");
    expect(screen.getByTestId("component-usedon-menu").textContent).toBe("Menu1 instance");
    expect(screen.queryByTestId("component-usedon-about")).toBeNull();

    // Menu isn't the active page ("home" is) — switches, then selects e3.
    fireEvent.click(screen.getByTestId("component-usedon-menu"));
    expect(setActivePage).toHaveBeenCalledWith("menu");
    expect(select).toHaveBeenCalledWith(expect.objectContaining({ getId: expect.any(Function) }));
    expect((select.mock.calls[0][0] as { getId: () => string }).getId()).toBe("e3");

    // Home IS already active — no page switch, but still selects an instance
    // (e1, the first of its two) instead of doing nothing.
    setActivePage.mockClear();
    select.mockClear();
    fireEvent.click(screen.getByTestId("component-usedon-home"));
    expect(setActivePage).not.toHaveBeenCalled();
    expect((select.mock.calls[0][0] as { getId: () => string }).getId()).toBe("e1");
  });

  it("the name renames inline (G2-124)", async () => {
    const { composer, updateComponent } = makeComposer();
    renderMaster(composer);
    fireEvent.click(screen.getByTestId("component-name"));
    const input = screen.getByTestId("component-rename-input");
    fireEvent.change(input, { target: { value: "  Dish card " } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(updateComponent).toHaveBeenCalledWith("cmp-1", { name: "Dish card" });
  });

  /* Flow-check (2026-09-25): Esc did nothing on this screen — every sibling
     drill-in (Add's Generate/create sub-views) backs out a level on Esc, this
     one never wired it. */
  describe("Escape", () => {
    it("backs out of the screen", () => {
      const { composer } = makeComposer();
      const onBack = vi.fn();
      render(
        <ToastProvider>
          <ComponentDetailScreen component={makeComponent()} composer={composer} onBack={onBack} />
        </ToastProvider>,
      );
      fireEvent.keyDown(document, { key: "Escape" });
      expect(onBack).toHaveBeenCalledTimes(1);
    });

    it("does not back out while renaming — the field's own Escape owns that", () => {
      const { composer } = makeComposer();
      const onBack = vi.fn();
      render(
        <ToastProvider>
          <ComponentDetailScreen component={makeComponent()} composer={composer} onBack={onBack} />
        </ToastProvider>,
      );
      fireEvent.click(screen.getByTestId("component-name"));
      fireEvent.keyDown(screen.getByTestId("component-rename-input"), { key: "Escape" });
      expect(onBack).not.toHaveBeenCalled();
    });
  });
});
