/**
 * One interaction store: an interaction added through the engine
 * (`composer.canvas.interactions`) is the one the Inspector lists and the one
 * the export publishes — `element.data.interactions`. The manager used to
 * write a shallow copy of the element's data, so on an element with no data
 * yet the interaction was lost: the panel showed none, the page published none.
 *
 * @license BSD-3-Clause
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as React from "react";
import { ToastProvider } from "@/editor/chrome-ui";
import { InteractionsSection } from "../index";
import { createTestComposer, installEngineBrowserStubs, removeEngineBrowserStubs } from "@/engine/__tests__/test-utils/realComposer";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);

describe("Interactions — added through the engine", () => {
  it("appear in the panel, and in the element's saved data the export reads", () => {
    const c = createTestComposer();
    const root = c.elements.createPage("Home").root.id;
    const made = c.elements.createElement("text" as never, {} as never);
    c.elements.addElement(made, root);
    const id = made.getId();

    render(
      <ToastProvider>
        <InteractionsSection interactions={[]} onInteractionsChange={vi.fn()} composer={c} elementId={id} isOpen />
      </ToastProvider>,
    );
    expect(screen.getByTestId("interactions-empty")).toBeInTheDocument();

    act(() => {
      c.canvas.interactions.addInteraction(id, "click", { preset: "fadeIn" });
    });

    expect(screen.getByTestId("interaction-row")).toHaveTextContent("On click · Fade In ›");
    expect(c.elements.getElement(id)?.toJSON().data?.interactions).toHaveLength(1);
    expect(c.canvas.interactions.getInteractions(id)).toHaveLength(1);
  });
});
