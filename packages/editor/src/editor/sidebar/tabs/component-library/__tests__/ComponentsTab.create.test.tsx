/**
 * "+ Create component" with and without a canvas selection. The handler lived
 * in LeftSidebar while Components was a drawer; the resource area (2L9
 * 215:43588) owns it now. With nothing selected it used to do nothing at all
 * (measured live 2026-08-22) — it says what is missing.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import * as React from "react";
import { EVENTS } from "@/shared/constants";
import { createMockComposer } from "@/editor/sidebar/__tests__/test-utils/mockComposer";

const { toasts } = vi.hoisted(() => ({ toasts: [] as Array<{ description: string }> }));
vi.mock("@/editor/chrome-ui", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, useToast: () => ({ addToast: (t: { description: string }) => toasts.push(t) }) };
});
vi.mock("@/services/componentSync", () => ({
  onComponentTrashChanged: () => () => {},
  stageComponentTrash: vi.fn(),
  fetchComponentLibrary: vi.fn(async () => []),
}));

import { ComponentsTab } from "@/editor/sidebar/tabs/ComponentsTab";

function mount(selectedIds: string[]) {
  const composer = createMockComposer({ components: [] });
  Object.assign(composer.components, { isAvailable: () => true, getInstancesOfComponent: () => [] });
  Object.assign(composer, { selection: { ...composer.selection, getSelectedIds: () => selectedIds } });
  const emit = vi.spyOn(composer, "emit");
  render(<ComponentsTab composer={composer as never} />);
  return emit;
}

beforeEach(() => {
  toasts.length = 0;
});

describe("ComponentsTab — + Create component", () => {
  it("with nothing selected, says what is missing instead of doing nothing", () => {
    const emit = mount([]);
    fireEvent.click(screen.getByTestId("comp-create"));
    expect(emit).not.toHaveBeenCalledWith(EVENTS.COMPONENT_CREATE_REQUESTED, expect.anything());
    expect(toasts.map((t) => t.description).join(" ")).toMatch(/select an element/i);
  });

  it("with a selection, asks for the Create component dialog", () => {
    const emit = mount(["el-1"]);
    fireEvent.click(screen.getByTestId("comp-create"));
    expect(emit).toHaveBeenCalledWith(EVENTS.COMPONENT_CREATE_REQUESTED, { elementId: "el-1" });
    expect(toasts).toHaveLength(0);
  });
});
