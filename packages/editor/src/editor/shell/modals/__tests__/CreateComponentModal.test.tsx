// @vitest-environment jsdom
/**
 * CreateComponentModal — board 4418:142143 (C5 G1-098): Name · Scope ·
 * "Also convert N matching groups", and the master converts the selection
 * into its first instance.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";

const { addToastMock, findMatching } = vi.hoisted(() => ({ addToastMock: vi.fn(), findMatching: vi.fn(() => [] as string[]) }));

vi.mock("@/editor/chrome-ui", async (importActual) => {
  const actual = await importActual<typeof import("@/editor/chrome-ui")>();
  return { ...actual, useToast: () => ({ addToast: addToastMock }) };
});
vi.mock("../../../../engine/components/matchingGroups", () => ({
  findMatchingElements: (...a: unknown[]) => findMatching(...(a as [])),
}));

import { CreateComponentModal } from "../CreateComponentModal";

function makeComposer(createComponent = vi.fn().mockResolvedValue({ id: "c1", name: "Hero" }), adoptInstances = vi.fn((_: string, ids: string[]) => ids.length)) {
  const el = { getType: () => "section", getCustomData: (k: string) => (k === "layerName" || k === "name" ? "Hero" : undefined) };
  return {
    composer: {
      emit: vi.fn(),
      components: { createComponent, adoptInstances },
      elements: { getElement: () => el, getActivePage: () => ({ id: "page-home", name: "Home" }) },
    } as never,
    createComponent,
    adoptInstances,
  };
}

function renderModal(composer: never) {
  const onClose = vi.fn();
  render(<CreateComponentModal isOpen onClose={onClose} composer={composer} elementId="el-1" />);
  return { onClose };
}

beforeEach(() => {
  cleanup();
  addToastMock.mockClear();
  findMatching.mockReset().mockReturnValue([]);
});

describe("CreateComponentModal — board 4418:142143", () => {
  it("draws exactly the board's form: lead, Name, Scope (This site), Cancel · Create component", () => {
    const { composer } = makeComposer();
    renderModal(composer);
    expect(screen.getByTestId("create-component-title")).toHaveTextContent("Create component");
    // The board's dialog title is 20/600 (the Modal default), not 16.
    expect(screen.getByTestId("create-component-title").className).toContain("--bk-text-20");
    expect(screen.getByTestId("create-component-title").className).not.toContain("--bk-text-16");
    expect(screen.getByTestId("create-component-lead")).toHaveTextContent(
      /^Selected: Home › .+ \(section\)\. Creating a master converts this .+ into its first instance\. Nothing else changes unless you opt in below\.$/,
    );
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect((screen.getByLabelText("Scope") as HTMLSelectElement).selectedOptions[0].textContent).toBe("This site");
    for (const gone of ["Description", "Category", "Tags", "variant", "Pre-fill"]) {
      expect(screen.queryByText(new RegExp(gone, "i"))).toBeNull();
    }
    expect(screen.getByRole("button", { name: "Create component" })).toBeInTheDocument();
    // Board footer 7431:145583: top rule, 16px vertical padding.
    expect(screen.getByTestId("create-component-cancel").parentElement?.className).toContain("tw:border-t");
  });

  it("offers the convert box only when identical groups exist, with their count", () => {
    const { composer } = makeComposer();
    findMatching.mockReturnValue(["el-2", "el-3"]);
    renderModal(composer);
    expect(screen.getByTestId("create-component-convert")).toHaveTextContent(/Also convert 2 other matching .+ groups on this page/);
  });

  it("creates, converts the selection into the first instance, and only the opted-in matches", async () => {
    const { composer, createComponent, adoptInstances } = makeComposer();
    findMatching.mockReturnValue(["el-2", "el-3"]);
    const { onClose } = renderModal(composer);
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "  Hero card " } });
    fireEvent.click(screen.getByRole("button", { name: "Create component" }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(createComponent).toHaveBeenCalledWith("Hero card", "el-1", { prefillFromDs: true, pageId: null });
    expect(adoptInstances).toHaveBeenCalledWith("c1", ["el-1"]);
  });

  /* Board 4418:166980: "Hero created as a component" (no tone dot), and the
     drawer turns to Components, where the new master carries a New badge. */
  it("says '{name} created as a component' and opens the Components drawer", async () => {
    const { composer } = makeComposer();
    const { onClose } = renderModal(composer);
    fireEvent.click(screen.getByRole("button", { name: "Create component" }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(addToastMock).toHaveBeenCalledWith({ description: "Hero created as a component" });
    expect((composer as unknown as { emit: ReturnType<typeof vi.fn> }).emit).toHaveBeenCalledWith("ui:switch-tab", { tab: "components" });
  });

  it("with the box ticked, the matches are converted too", async () => {
    const { composer, adoptInstances } = makeComposer();
    findMatching.mockReturnValue(["el-2"]);
    const { onClose } = renderModal(composer);
    fireEvent.click(screen.getByTestId("create-component-convert").querySelector("input")!);
    fireEvent.click(screen.getByRole("button", { name: "Create component" }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(adoptInstances).toHaveBeenCalledWith("c1", ["el-1", "el-2"]);
  });

  it("a blank name cannot be submitted; a failed create says so and stays open", async () => {
    const { composer } = makeComposer(vi.fn().mockResolvedValue(null));
    const { onClose } = renderModal(composer);
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "   " } });
    expect(screen.getByRole("button", { name: "Create component" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Hero" } });
    fireEvent.click(screen.getByRole("button", { name: "Create component" }));
    await waitFor(() => expect(addToastMock).toHaveBeenCalledWith(expect.objectContaining({ tone: "error" })));
    expect(onClose).not.toHaveBeenCalled();
  });

  /* Popover 6971:77663: This site / This page. */
  it("Scope offers This site and This page; This page scopes the master to the open page", async () => {
    const { composer, createComponent } = makeComposer();
    const { onClose } = renderModal(composer);
    const scope = screen.getByLabelText("Scope") as HTMLSelectElement;
    expect([...scope.options].map((o) => o.textContent)).toEqual(["This site", "This page"]);
    fireEvent.change(scope, { target: { value: "page" } });
    fireEvent.click(screen.getByRole("button", { name: "Create component" }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(createComponent).toHaveBeenCalledWith("Hero", "el-1", { prefillFromDs: true, pageId: "page-home" });
  });
});
