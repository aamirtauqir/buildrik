/**
 * DimmedNotice — 2L9 147:78900: shown only while the element is dimmed in the
 * editor (its canvas node's `data-hidden`, or the stored Layers set when it has
 * no node), names the layer, asks Layers to "Show normally", and sends "Hide
 * on live site…" to Behavior › Visibility.
 *
 * @license BSD-3-Clause
 */
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as React from "react";
import { DimmedNotice } from "../DimmedNotice";
import { EVENTS } from "@/shared/constants/events";
import { saveSetToStorage } from "@/editor/panels/layers/hooks/layersPersistence";
import { createTestComposer, installEngineBrowserStubs, removeEngineBrowserStubs } from "@/engine/__tests__/test-utils/realComposer";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);
afterEach(() => {
  document.querySelectorAll("[data-buildrick-id]").forEach((n) => n.remove());
  localStorage.clear();
});

function setup() {
  const c = createTestComposer();
  const page = c.elements.createPage("Home");
  c.elements.setActivePage?.(page.id);
  const made = c.elements.createElement("text" as never, {} as never);
  c.elements.addElement(made, page.root.id);
  return { c, id: made.getId(), pageId: page.id };
}

const canvasNode = (id: string) => {
  const node = document.createElement("p");
  node.setAttribute("data-buildrick-id", id);
  document.body.appendChild(node);
  return node;
};

describe("DimmedNotice (2L9 147:78900)", () => {
  it("nothing while the element is not dimmed", () => {
    const { c, id } = setup();
    canvasNode(id);
    render(<DimmedNotice composer={c} elementId={id} onHideOnLiveSite={vi.fn()} />);
    expect(screen.queryByTestId("inspector-dimmed-notice")).toBeNull();
  });

  it("follows the canvas node's flag as Layers toggles it", async () => {
    const { c, id } = setup();
    const node = canvasNode(id);
    render(<DimmedNotice composer={c} elementId={id} onHideOnLiveSite={vi.fn()} />);
    await act(async () => {
      node.setAttribute("data-hidden", "true");
    });
    expect(screen.getByTestId("inspector-dimmed-notice")).toHaveTextContent("Dimmed in editor only");
    expect(screen.getByTestId("inspector-dimmed-notice")).toHaveTextContent("Text is still included on the live site.");
    await act(async () => {
      node.removeAttribute("data-hidden");
    });
    expect(screen.queryByTestId("inspector-dimmed-notice")).toBeNull();
  });

  it("with no canvas node, reads the stored Layers set", () => {
    const { c, id, pageId } = setup();
    saveSetToStorage(pageId, "hidden", new Set([id]));
    render(<DimmedNotice composer={c} elementId={id} onHideOnLiveSite={vi.fn()} />);
    expect(screen.getByTestId("inspector-dimmed-notice")).toBeInTheDocument();
  });

  it("Show normally asks Layers to un-dim it; Hide on live site… goes to Visibility", () => {
    const { c, id } = setup();
    canvasNode(id).setAttribute("data-hidden", "true");
    const onHide = vi.fn();
    const asked = vi.fn();
    c.on(EVENTS.LAYER_SHOW_NORMALLY_REQUESTED, asked);
    render(<DimmedNotice composer={c} elementId={id} onHideOnLiveSite={onHide} />);
    fireEvent.click(screen.getByRole("button", { name: "Show normally" }));
    expect(asked).toHaveBeenCalledWith({ id });
    fireEvent.click(screen.getByRole("button", { name: "Hide on live site…" }));
    expect(onHide).toHaveBeenCalled();
  });
});
