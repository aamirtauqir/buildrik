/**
 * design-2l9 147:77668 / 147:78110 — every row under a locked layer shows the
 * lock, as a mark (the lock is held by the ancestor, unlocked there).
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, afterEach, beforeAll, afterAll } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as React from "react";
import { ToastProvider } from "@/editor/chrome-ui";
import { Composer } from "@/engine";
import { LayersPanel } from "../index";
import { installEngineBrowserStubs, removeEngineBrowserStubs } from "@/engine/__tests__/test-utils/realComposer";

beforeAll(() => installEngineBrowserStubs());
afterAll(() => removeEngineBrowserStubs());
afterEach(cleanup);

function seeded(): Composer {
  const c = new Composer({} as never);
  const page = c.elements.createPage("Home", {
    id: "lk-page",
    root: { id: "lk-root", type: "container", tagName: "div", classes: ["buildrick-page-root"], children: [] },
  });
  c.elements.setActivePage(page.id);
  const hero = c.elements.createElement("container" as never, { id: "lk-hero" });
  c.elements.addElement(hero, page.root.id);
  const text = c.elements.createElement("text" as never, { id: "lk-text", content: "Text" });
  c.elements.addElement(text, "lk-hero");
  return c;
}

describe("LayerTreeItem — a locked ancestor's lock shows on the rows under it", () => {
  it("marks the child once its parent is locked, and drops the mark on unlock", () => {
    render(
      <ToastProvider>
        <LayersPanel composer={seeded()} selectedElement={null} />
      </ToastProvider>,
    );
    expect(screen.queryByTestId("layer-lock-inherited-lk-text")).toBeNull();
    fireEvent.click(screen.getByTestId("layer-lock-lk-hero"));
    expect(screen.getByTestId("layer-lock-inherited-lk-text")).toHaveAttribute("aria-label", "Locked by a parent layer");
    expect(screen.queryByTestId("layer-lock-lk-text")).toBeNull();
    fireEvent.click(screen.getByTestId("layer-lock-lk-hero"));
    expect(screen.queryByTestId("layer-lock-inherited-lk-text")).toBeNull();
  });
});
