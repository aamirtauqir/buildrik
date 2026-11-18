/**
 * 2L9 217:42918 (B6-K22): Layers' instance-row actions — "Go to main
 * component ›" opens the master in Components with the way back to the
 * instance; "Detach instance" detaches with the shared receipt + Undo.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import * as React from "react";
import { ToastProvider } from "@/editor/chrome-ui";
import { EVENTS } from "@/shared/constants";
import { useLayerContextActions } from "../useLayerContextActions";

const addToast = vi.fn();
vi.mock("@/editor/chrome-ui", async (orig) => ({ ...(await orig<object>()), useToast: () => ({ addToast }) }));

function setup() {
  const composer = {
    emit: vi.fn(),
    history: { captureUndo: () => () => {} },
    components: {
      getInstanceByElementId: (id: string) => (id === "hero-1" ? { componentId: "hero", elementId: id } : undefined),
      getComponent: () => ({ id: "hero", name: "Hero card" }),
      detachInstance: vi.fn(async () => true),
    },
  };
  const state = { composer, actionsHook: {}, treeHook: {}, selectionHook: { selectedIds: new Set<string>() } } as never;
  const { result } = renderHook(() => useLayerContextActions(state, { requestDeleteSelection: vi.fn(), requestMoveToPage: vi.fn() }), {
    wrapper: ({ children }: { children: React.ReactNode }) => <ToastProvider>{children}</ToastProvider>,
  });
  return { composer, run: result.current };
}

describe("useLayerContextActions — instance rows (B6-K22)", () => {
  it("Go to main component opens the master with the instance to return to", () => {
    const { composer, run } = setup();
    act(() => run("goToMain", "hero-1"));
    expect(composer.emit).toHaveBeenCalledWith(EVENTS.UI_SWITCH_TAB, { tab: "components" });
    expect(composer.emit).toHaveBeenCalledWith(EVENTS.UI_COMPONENTS_OPEN_MASTER, { componentId: "hero", instanceId: "hero-1", from: "layers" });
  });

  it("Detach instance detaches and says so with Undo", async () => {
    const { composer, run } = setup();
    await act(async () => run("detachInstance", "hero-1"));
    expect(composer.components.detachInstance).toHaveBeenCalledWith("hero-1");
    expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ description: "Hero card detached", action: expect.objectContaining({ label: "Undo" }) }));
  });
});
