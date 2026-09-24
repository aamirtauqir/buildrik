// @vitest-environment jsdom
/**
 * "Reset all styles" — kept as an inspector ⋯ row after the canvas menu lost
 * it (G2-054). Owner rule 2026-09-24: parity never silently removes a
 * capability. One transaction, and an Undo toast.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import {
  createTestComposer,
  installEngineBrowserStubs,
  removeEngineBrowserStubs,
} from "@/engine/__tests__/test-utils/realComposer";
import { ToastProvider } from "@/editor/chrome-ui";
import { InspectorElementMenu } from "../InspectorElementMenu";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);

describe("InspectorElementMenu — Reset all styles", () => {
  it("clears the element's styles in one undo step and offers Undo", () => {
    const composer = createTestComposer();
    const page = composer.elements.createPage("Home");
    const el = composer.elements.createElement("heading");
    composer.elements.addElement(el, page.root.id);
    el.setStyle?.("color", "rgb(26, 86, 219)");
    el.setStyle?.("padding", "24px");
    /* History coalesces within 500ms; flush so setup is its own step. */
    composer.history?.flushPending?.();

    render(
      <ToastProvider>
        <InspectorElementMenu composer={composer} selectedElementId={el.getId()} onRequestDelete={() => {}} />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByTestId("inspector-element-menu"));
    fireEvent.click(screen.getByTestId("inspector-menu-reset-styles"));
    expect(Object.keys(el.getStyles?.() ?? {})).toHaveLength(0);
    composer.history?.flushPending?.();

    const undo = screen.getByRole("button", { name: "Undo" });
    act(() => {
      undo.click();
    });
    // Undo restores from a snapshot, so the element is a fresh instance.
    expect(composer.elements.getElement(el.getId())?.getStyles?.()).toMatchObject({ color: "rgb(26, 86, 219)", padding: "24px" });
  });
});
