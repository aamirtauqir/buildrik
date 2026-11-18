/**
 * Canvas select-to-edit refuses an element under a locked layer, as it
 * refuses a locked element itself, and the toast names the layer that holds
 * the lock (147:77668 "Locked by Hero — unlock in Layers").
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { renderHook, act, screen } from "@testing-library/react";
import { ToastProvider } from "@/editor/chrome-ui";
import { createTestComposer, installEngineBrowserStubs, removeEngineBrowserStubs } from "@/engine/__tests__/test-utils/realComposer";
import { useSelectionBehavior } from "../useSelectionBehavior";
import { renameElement } from "@/editor/panels/layers/hooks/layersPersistence";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);

function clickOn(handleClick: (e: React.MouseEvent) => void, target: HTMLElement, x: number) {
  handleClick({ target, clientX: x, clientY: 10, shiftKey: false, metaKey: false, ctrlKey: false } as unknown as React.MouseEvent);
}

describe("useSelectionBehavior — inherited lock", () => {
  it("does not select a child of a locked layer, and says which layer holds the lock", () => {
    const c = createTestComposer();
    const root = c.elements.createPage("Home").root.id;
    const hero = c.elements.createElement("section");
    c.elements.addElement(hero, root);
    renameElement(c, hero.getId(), "Hero");
    const text = c.elements.createElement("text", { content: "Hi" });
    c.elements.addElement(text, hero.getId());
    const node = document.createElement("p");
    node.setAttribute("data-buildrick-id", text.getId());
    document.body.appendChild(node);

    const { result } = renderHook(() => useSelectionBehavior({ composer: c, isEditing: false, onContextMenuClose: () => {} }), {
      wrapper: ({ children }) => <ToastProvider>{children}</ToastProvider>,
    });

    c.elements.getElement(hero.getId())!.setLocked(true);
    act(() => clickOn(result.current.handleClick, node, 10));
    expect(c.selection.getSelected()).toBeFalsy();
    expect(screen.getByText("Locked by Hero — unlock in Layers")).toBeInTheDocument();

    c.elements.getElement(hero.getId())!.setLocked(false);
    act(() => clickOn(result.current.handleClick, node, 200));
    expect(c.selection.getSelected()?.getId()).toBe(text.getId());
    node.remove();
  });
});
