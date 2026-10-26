// @vitest-environment jsdom
/**
 * Task 1.6 — the canvas under an engine edit lock. After a failed load it is
 * neutral (no skeleton, no build invitation, not the banner's sentence again),
 * and a selection gets no toolbar: its Duplicate / Delete / ⋯ would act on a
 * document the engine refuses to change. Both follow `editlock:changed`.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { ToastProvider } from "@/editor/chrome-ui";
import { createTestComposer, installEngineBrowserStubs, removeEngineBrowserStubs } from "@/engine/__tests__/test-utils/realComposer";
import { Canvas } from "../Canvas";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);
afterEach(cleanup);

function mount(withContent: boolean) {
  const c = createTestComposer();
  const page = c.elements.createPage("Home");
  c.elements.setActivePage(page.id);
  let selectedId: string | null = null;
  if (withContent) {
    const el = c.elements.createElement("heading" as never, { content: "Hello" } as never);
    c.elements.addElement(el, page.root.id);
    selectedId = el.getId();
  }
  render(
    <ToastProvider>
      <Canvas composer={c} device="desktop" zoom={100} />
    </ToastProvider>,
  );
  return { c, selectedId };
}

describe("Canvas under the not-loaded lock", () => {
  it("an empty page shows a neutral state — not the skeleton, not the build CTA, not the banner text", () => {
    const { c } = mount(false);
    act(() => c.setEditLock("not-loaded", true));
    const neutral = screen.getByTestId("canvas-not-loaded");
    expect(neutral.textContent).toBe("Nothing to show here yet");
    expect(neutral.textContent).not.toMatch(/load this site/i);
    expect(screen.queryByTestId("canvas-loading")).toBeNull();
    expect(screen.queryByText(/start blank/i)).toBeNull();

    act(() => c.setEditLock("not-loaded", false));
    expect(screen.queryByTestId("canvas-not-loaded")).toBeNull();
  });

  it("a selection gets no selection toolbar while locked", async () => {
    const { c, selectedId } = mount(true);
    act(() => {
      c.selection.select(c.elements.getElement(selectedId!)!);
    });
    const toolbarShown = () => document.querySelector("[data-testid='selection-toolbar']") !== null;
    await waitFor(() => expect(toolbarShown()).toBe(true));
    act(() => c.setEditLock("not-loaded", true));
    expect(toolbarShown()).toBe(false);
    act(() => c.setEditLock("not-loaded", false));
    await waitFor(() => expect(toolbarShown()).toBe(true));
  });
});
