// @vitest-environment jsdom
/**
 * CreateComponentModal — 2L9 271:125321 (G05) / 271:125668 (G06): Name,
 * "Where it can be used" (Component library / This page), the matching-groups
 * line, the usage line, and the master converts the selection into its first
 * instance.
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
vi.mock("@/engine/components/matchingGroups", () => ({
  findMatchingElements: (...a: unknown[]) => findMatching(...(a as [])),
}));

import { CreateComponentModal } from "../CreateComponentModal";

function makeComposer(createComponent = vi.fn().mockResolvedValue({ id: "c1", name: "Hero" }), adoptInstances = vi.fn((_: string, ids: string[]) => ids.length)) {
  const el = { getType: () => "section", getCustomData: (k: string) => (k === "layerName" || k === "name" ? "Hero" : undefined) };
  return {
    composer: {
      emit: vi.fn(),
      components: { createComponent, adoptInstances, getAllComponents: () => Array.from({ length: 84 }) },
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

const scopeOption = (name: string) => screen.getByRole("radio", { name });

describe("CreateComponentModal — 2L9 G05 / G06", () => {
  it("draws the board's form: lead, Name, Where it can be used (Component library first), no matches, usage, Cancel · Create and share component", () => {
    const { composer } = makeComposer();
    renderModal(composer);
    expect(screen.getByTestId("create-component-title")).toHaveTextContent("Create component");
    expect(screen.getByTestId("create-component-title").className).toContain("--bk-text-16");
    expect(screen.getByTestId("create-component-lead")).toHaveTextContent(/^.+ on Home becomes the first instance\.$/);
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByText("Where it can be used")).toBeInTheDocument();
    expect(scopeOption("Component library")).toHaveAttribute("aria-checked", "true");
    expect(scopeOption("This page")).toHaveAttribute("aria-checked", "false");
    expect(screen.getByText("Reusable on every site in this workspace.")).toBeInTheDocument();
    expect(screen.getByText("Only on Home.")).toBeInTheDocument();
    expect(screen.getByTestId("create-component-no-matches")).toHaveTextContent("No matching groups on Home.");
    expect(screen.getByTestId("create-component-usage")).toHaveTextContent("84 of 100 components");
    for (const gone of ["Description", "Category", "Tags", "variant", "Pre-fill", "Scope"]) {
      expect(screen.queryByText(new RegExp(gone, "i"))).toBeNull();
    }
    expect(screen.getByRole("button", { name: "Create and share component" })).toBeInTheDocument();
    expect(screen.getByTestId("create-component-cancel").parentElement?.className).toContain("tw:border-t");
  });

  it("offers the convert box only when identical groups exist, with their count", () => {
    const { composer } = makeComposer();
    findMatching.mockReturnValue(["el-2", "el-3"]);
    renderModal(composer);
    expect(screen.getByTestId("create-component-convert")).toHaveTextContent(/Also convert 2 other matching .+ groups on Home/);
    expect(screen.queryByTestId("create-component-no-matches")).toBeNull();
  });

  it("creates in the library, converts the selection into the first instance, and only the opted-in matches", async () => {
    const { composer, createComponent, adoptInstances } = makeComposer();
    findMatching.mockReturnValue(["el-2", "el-3"]);
    const { onClose } = renderModal(composer);
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "  Hero card " } });
    fireEvent.click(screen.getByRole("button", { name: "Create and share component" }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(createComponent).toHaveBeenCalledWith("Hero card", "el-1", { prefillFromDs: true, pageId: null });
    expect(adoptInstances).toHaveBeenCalledWith("c1", ["el-1"]);
  });

  /* G13 / G14: "Hero heading component created.", then Components. */
  it("says '{name} component created.' and opens the Components drawer", async () => {
    const { composer } = makeComposer();
    const { onClose } = renderModal(composer);
    fireEvent.click(screen.getByRole("button", { name: "Create and share component" }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(addToastMock).toHaveBeenCalledWith({ description: "Hero component created." });
    expect((composer as unknown as { emit: ReturnType<typeof vi.fn> }).emit).toHaveBeenCalledWith("ui:switch-tab", { tab: "components" });
  });

  it("with the box ticked, the matches are converted too", async () => {
    const { composer, adoptInstances } = makeComposer();
    findMatching.mockReturnValue(["el-2"]);
    const { onClose } = renderModal(composer);
    fireEvent.click(screen.getByTestId("create-component-convert").querySelector("input")!);
    fireEvent.click(screen.getByRole("button", { name: "Create and share component" }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(adoptInstances).toHaveBeenCalledWith("c1", ["el-1", "el-2"]);
  });

  it("a blank name cannot be submitted; a failed create says so and stays open", async () => {
    const { composer } = makeComposer(vi.fn().mockResolvedValue(null));
    const { onClose } = renderModal(composer);
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "   " } });
    expect(screen.getByRole("button", { name: "Create and share component" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Hero" } });
    fireEvent.click(screen.getByRole("button", { name: "Create and share component" }));
    await waitFor(() => expect(addToastMock).toHaveBeenCalledWith(expect.objectContaining({ tone: "error" })));
    expect(onClose).not.toHaveBeenCalled();
  });

  /* G06: This page chosen — the primary reads "Create component" and the master is the page's. */
  it("This page scopes the master to the open page, and the primary reads Create component", async () => {
    const { composer, createComponent } = makeComposer();
    const { onClose } = renderModal(composer);
    fireEvent.click(scopeOption("This page"));
    expect(scopeOption("This page")).toHaveAttribute("aria-checked", "true");
    fireEvent.click(screen.getByRole("button", { name: "Create component" }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(createComponent).toHaveBeenCalledWith("Hero", "el-1", { prefillFromDs: true, pageId: "page-home" });
  });
});
