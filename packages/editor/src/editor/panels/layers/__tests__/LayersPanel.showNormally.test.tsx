/**
 * REQUESTS B-20 / design-2l9 147:78900 — the Inspector's "Dimmed in editor
 * only · Show normally" emits LAYER_SHOW_NORMALLY_REQUESTED; Layers, which
 * owns the dimmed set, un-dims the element through the same write as the eye.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, afterEach, beforeAll, afterAll } from "vitest";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as React from "react";
import { ToastProvider } from "@/editor/chrome-ui";
import { Composer } from "@/engine";
import { EVENTS } from "@/shared/constants/events";
import { LayersPanel } from "../index";
import { installEngineBrowserStubs, removeEngineBrowserStubs } from "@/engine/__tests__/test-utils/realComposer";

beforeAll(() => installEngineBrowserStubs());
afterAll(() => removeEngineBrowserStubs());
afterEach(() => {
  cleanup();
  localStorage.clear();
});

function seeded(): Composer {
  const c = new Composer({} as never);
  const page = c.elements.createPage("Home", {
    id: "sn-page",
    root: { id: "sn-root", type: "container", tagName: "div", classes: ["buildrick-page-root"], children: [] },
  });
  c.elements.setActivePage(page.id);
  c.elements.addElement(c.elements.createElement("text" as never, { id: "sn-text", content: "Text" }), page.root.id);
  return c;
}

describe("LayersPanel — Show normally from the Inspector", () => {
  it("un-dims the element, and a second request changes nothing", () => {
    const composer = seeded();
    render(
      <ToastProvider>
        <LayersPanel composer={composer} selectedElement={null} />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByTestId("layer-eye-sn-text"));
    expect(screen.getByTestId("layer-row-sn-text").className).toMatch(/bdc-hidden/);

    act(() => composer.emit(EVENTS.LAYER_SHOW_NORMALLY_REQUESTED, { id: "sn-text" }));
    expect(screen.getByTestId("layer-row-sn-text").className).not.toMatch(/bdc-hidden/);

    act(() => composer.emit(EVENTS.LAYER_SHOW_NORMALLY_REQUESTED, { id: "sn-text" }));
    expect(screen.getByTestId("layer-row-sn-text").className).not.toMatch(/bdc-hidden/);
  });

  it("no longer draws its own dimmed note — the Inspector's banner carries it", () => {
    const composer = seeded();
    render(
      <ToastProvider>
        <LayersPanel composer={composer} selectedElement={{ id: "sn-text" } as never} />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByTestId("layer-eye-sn-text"));
    expect(screen.queryByTestId("layers-dimmed-note")).toBeNull();
  });
});
