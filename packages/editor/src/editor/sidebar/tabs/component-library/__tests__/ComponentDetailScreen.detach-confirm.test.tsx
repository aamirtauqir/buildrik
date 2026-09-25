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
import type { Composer } from "../../../../../engine";
import type { ComponentDefinition } from "../../../../../shared/types/components";

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
  const pageOf: Record<string, string> = { e1: "r-home", e2: "r-home", e3: "r-menu" };
  const composer = {
    selection: { getSelectedIds: () => [] },
    getProjectMetadata: () => ({ name: "Bella Cucina" }),
    elements: {
      getAllPages: () => [
        { id: "home", name: "Home", root: { id: "r-home" } },
        { id: "menu", name: "Menu", root: { id: "r-menu" } },
        { id: "about", name: "About", root: { id: "r-about" } },
      ],
      getElement: (id: string) => ({ getId: () => id, getParent: () => root(pageOf[id]) }),
      setActivePage,
    },
    components: {
      getInstancesOfComponent: () => [{ elementId: "e1" }, { elementId: "e2" }, { elementId: "e3" }],
      detachInstance,
      updateComponent,
    },
  } as unknown as Composer;
  return { composer, detachInstance, updateComponent, setActivePage };
}

const renderMaster = (composer: Composer) =>
  render(
    <ToastProvider>
      <ComponentDetailScreen component={makeComponent()} composer={composer} onBack={() => {}} />
    </ToastProvider>,
  );

describe("ComponentDetailScreen — master screen (4418:142876)", () => {
  it("draws the scope block with the real instance count and site name", () => {
    renderMaster(makeComposer().composer);
    expect(screen.getByText(/^Master component ·/).textContent).toBe("Master component · Menu card");
    expect(screen.getByTestId("component-linked").textContent).toBe(
      "3 linked instances on Bella Cucina. Updating this master affects those instances. Inserting adds one instance.",
    );
    expect(screen.getByTestId("component-insert").textContent).toBe("Insert from saved components");
    expect(screen.getByTestId("component-update").textContent).toBe("Update from selection…");
    expect(screen.getByTestId("component-delete").textContent).toBe("Delete Menu card master");
    expect(screen.queryByText("Type")).toBeNull();
    expect(screen.queryByText("Tags")).toBeNull();
  });

  it("Detach all confirms, then detaches every instance", () => {
    const { composer, detachInstance } = makeComposer();
    renderMaster(composer);
    fireEvent.click(screen.getByTestId("component-detach-all"));
    expect(detachInstance).not.toHaveBeenCalled();
    expect(screen.getByText("Detach all 3 instances of Menu card?")).toBeTruthy();
    fireEvent.click(screen.getByTestId("component-detach-all-confirm-confirm"));
    expect(detachInstance.mock.calls.map((c) => c[0])).toEqual(["e1", "e2", "e3"]);
  });

  /* Board 4418:143126: the list reports it ("18 instances detached"), so the
     screen hands the count up and goes back instead of toasting. */
  it("Detach all hands the count to onDetachedAll and goes back", async () => {
    const { composer } = makeComposer();
    const onDetachedAll = vi.fn();
    const onBack = vi.fn();
    render(
      <ToastProvider>
        <ComponentDetailScreen component={makeComponent()} composer={composer} onBack={onBack} onDetachedAll={onDetachedAll} />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByTestId("component-detach-all"));
    fireEvent.click(screen.getByTestId("component-detach-all-confirm-confirm"));
    await waitFor(() => expect(onDetachedAll).toHaveBeenCalledWith(3));
    expect(onBack).toHaveBeenCalled();
  });

  it("STRUCTURE lists the master's parts; USED ON the pages with instances, which open on click", () => {
    const { composer, setActivePage } = makeComposer();
    renderMaster(composer);
    expect(screen.getByTestId("component-structure-header").textContent).toContain("3");
    const rows = screen.getAllByTestId("component-structure-row").map((r) => r.textContent);
    expect(rows).toEqual(["Imageimage", "Titleheading", "Texttext · CMS bound"]);
    expect(screen.getByTestId("component-usedon-home").textContent).toBe("Home2 instances");
    expect(screen.getByTestId("component-usedon-menu").textContent).toBe("Menu1 instance");
    expect(screen.queryByTestId("component-usedon-about")).toBeNull();
    fireEvent.click(screen.getByTestId("component-usedon-menu"));
    expect(setActivePage).toHaveBeenCalledWith("menu");
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
});
