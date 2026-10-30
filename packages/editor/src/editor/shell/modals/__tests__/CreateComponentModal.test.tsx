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

  /* G07: an empty name keeps the dialog a draft. */
  it("a blank name cannot be submitted and says what a name needs", () => {
    const { composer } = makeComposer();
    renderModal(composer);
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "   " } });
    expect(screen.getByRole("button", { name: "Create and share component" })).toBeDisabled();
    expect(screen.getByTestId("create-component-name-error")).toHaveTextContent("Enter a name between 1 and 200 characters.");
    expect(screen.getByLabelText("Name")).toHaveAttribute("aria-invalid", "true");
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Hero" } });
    expect(screen.queryByTestId("create-component-name-error")).toBeNull();
  });

  /* G08: at the limit the usage line says what to do and Create is shut. */
  it("at 100 of 100 Create is shut and the usage line says why", () => {
    const { composer } = makeComposer();
    (composer as { components: { getAllComponents: () => unknown[] } }).components.getAllComponents = () => Array.from({ length: 100 });
    renderModal(composer);
    expect(screen.getByTestId("create-component-usage")).toHaveTextContent("100 of 100 components. Delete one before creating another.");
    expect(screen.getByRole("button", { name: "Create and share component" })).toBeDisabled();
  });

  /* G09 / G11: pending — the button keeps its label, the note says it is running. */
  it("while the create runs it says 'Creating component…' and keeps the label", async () => {
    let finish: (v: unknown) => void = () => {};
    const { composer } = makeComposer(vi.fn(() => new Promise((r) => (finish = r))));
    renderModal(composer);
    fireEvent.click(screen.getByRole("button", { name: "Create and share component" }));
    expect(await screen.findByTestId("create-component-pending")).toHaveTextContent("Creating component…");
    expect(screen.getByRole("button", { name: "Create and share component" })).toBeDisabled();
    finish(null);
    await waitFor(() => expect(screen.queryByTestId("create-component-pending")).toBeNull());
  });

  /* G10 / G12: failure keeps the input, says the element is unchanged, offers Try again. */
  it("a failed create keeps name and scope, says so in the dialog, and offers Try again", async () => {
    const createComponent = vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce({ id: "c1", name: "Hero" });
    const { composer } = makeComposer(createComponent);
    const { onClose } = renderModal(composer);
    fireEvent.click(scopeOption("This page"));
    fireEvent.click(screen.getByRole("button", { name: "Create component" }));
    expect(await screen.findByTestId("create-component-failed")).toHaveTextContent(
      "Couldn’t create the component. The name and scope are kept; Hero is unchanged."
    );
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Name")).toHaveValue("Hero");
    expect(scopeOption("This page")).toHaveAttribute("aria-checked", "true");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(createComponent).toHaveBeenLastCalledWith("Hero", "el-1", { prefillFromDs: true, pageId: "page-home" });
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
