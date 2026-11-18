/**
 * ComponentRow — the instance identity block of 2L9 IC01/IC03 (above the
 * tabs): "◇ {name} · instance", "Component library · v{n}", Variant, "Edit
 * main component ›", "Reset to main component · {n} overrides" (disabled
 * with "No overrides to reset"), "Detach instance". Reset keeps its confirm;
 * Detach applies at once with a "{name} detached · Undo" receipt (IC06 —
 * detaching is a document history step since B-12); the P-1 lock gate and
 * the read-only field context (locked / save conflict) refuse the writes.
 *
 * @license BSD-3-Clause
 */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import * as React from "react";
import { describe, it, expect, vi } from "vitest";
import { ComponentRow } from "../ComponentRow";
import { ToastProvider } from "@/editor/chrome-ui";
import { EVENTS } from "@/shared/constants/events";
import type { ComponentDefinition, ComponentInstance } from "@/shared/types/components";
import { InspectorFieldContext, type InspectorFieldContextValue } from "@/editor/inspector/shared/controls/InspectorFieldContext";

const makeComponent = (overrides: Partial<ComponentDefinition> = {}): ComponentDefinition => ({
  id: "comp-1",
  name: "Reservation banner",
  masterTree: { id: "root", type: "container", styles: {}, children: [] } as never,
  createdAt: 0,
  updatedAt: 0,
  version: 1,
  ...overrides,
});

const makeInstance = (overrides: Partial<ComponentInstance> = {}): ComponentInstance =>
  ({ elementId: "el-1", componentId: "comp-1", ...overrides }) as ComponentInstance;

function makeComposer({
  component,
  instance,
  locked = false,
  resetInstance = vi.fn(),
  updateInstanceVariant = vi.fn(),
  detachInstance = vi.fn(async () => true),
  undo = vi.fn(() => true),
}: {
  component: ComponentDefinition | null;
  instance: ComponentInstance | null;
  locked?: boolean;
  resetInstance?: ReturnType<typeof vi.fn>;
  updateInstanceVariant?: ReturnType<typeof vi.fn>;
  detachInstance?: ReturnType<typeof vi.fn>;
  undo?: ReturnType<typeof vi.fn>;
}) {
  const hero = { getType: () => "section", getCustomData: (k: string) => (k === "layerName" ? "Hero" : undefined), getParent: () => root };
  const root = { getType: () => "root", getCustomData: () => undefined, getParent: () => null };
  return {
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    elements: {
      getElement: () => ({ getParent: () => hero, isLocked: () => locked }),
      getActivePage: () => ({ name: "Home" }),
      getAllPages: () => [{ id: "page-home", name: "Home" }],
    },
    components: {
      getInstanceByElementId: vi.fn(() => instance),
      getComponent: vi.fn(() => component),
      updateInstanceVariant,
      resetInstance,
      detachInstance,
    },
    history: { captureUndo: vi.fn(() => undo) },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

const readOnlyCtx = (reason: "locked" | "conflict"): InspectorFieldContextValue => ({
  readOnly: true,
  readOnlyReason: reason,
  mixedKeys: new Set(),
  overrides: new Map(),
  overrideLabels: {},
  resetOverride: () => undefined,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderRow = (composer: any, ctx?: InspectorFieldContextValue) =>
  render(
    <ToastProvider>
      {ctx ? (
        <InspectorFieldContext.Provider value={ctx}>
          <ComponentRow composer={composer} elementId="el-1" />
        </InspectorFieldContext.Provider>
      ) : (
        <ComponentRow composer={composer} elementId="el-1" />
      )}
    </ToastProvider>,
  );

const withVariants = () =>
  makeComponent({
    variantProperties: [{ name: "Size", values: ["Small", "Large"], defaultValue: "Small" }] as never,
    variants: [
      { id: "v-s", name: "Small", propertyValues: { Size: "Small" } },
      { id: "v-l", name: "Large", propertyValues: { Size: "Large" } },
    ] as never,
  });

const withOverrides = (n: number) => makeInstance({ overrides: Array.from({ length: n }, (_, i) => ({ op: "replace", path: `#/style/p${i}`, value: "x" })) } as never);

describe("ComponentRow — board 26", () => {
  it("2L9 G15 / G16: the source line says where the master can be used — 'This page · Home' or 'Component library'", () => {
    renderRow(makeComposer({ component: makeComponent({ pageId: "page-home" }), instance: makeInstance() }));
    expect(screen.getByTestId("component-source")).toHaveTextContent("This page · Home · v1");
  });

  /* L2-028 (moved here with the name, from StatusMarks): a rename of the
     main component shows without a reselect. */
  it("follows a main-component rename", () => {
    const component = makeComponent({ name: "Audit Feature Card" });
    const composer = makeComposer({ component, instance: makeInstance() });
    const handlers: Array<() => void> = [];
    composer.on = vi.fn((evt: string, fn: () => void) => {
      if (evt === EVENTS.COMPONENT_UPDATED) handlers.push(fn);
    });
    renderRow(composer);
    expect(screen.getByTestId("component-identity")).toHaveTextContent("Audit Feature Card · instance");
    composer.components.getComponent = vi.fn(() => ({ ...component, name: "Audit Card Renamed" }));
    React.act(() => handlers.forEach((h) => h()));
    expect(screen.getByTestId("component-identity")).toHaveTextContent("Audit Card Renamed · instance");
  });

  it("renders nothing when the element is not a component instance", () => {
    const { container } = renderRow(makeComposer({ component: null, instance: null }));
    expect(container.querySelector('[data-testid="component-row"]')).toBeNull();
  });

  it("2L9 IC01: identity, source, Variant, Edit main component, Reset · n overrides, Detach — in that order", () => {
    renderRow(makeComposer({ component: makeComponent({ version: 4 }), instance: withOverrides(3) }));
    const row = screen.getByTestId("component-row");
    const text = row.textContent ?? "";
    const at = [
      "Reservation banner · instance", "Component library · v4", "Variant", "Edit main component ›",
      "Reset to main component · 3 overrides", "Detach instance",
    ].map((t) => text.indexOf(t));
    expect(at.every((i) => i >= 0)).toBe(true);
    expect([...at].sort((a, b) => a - b)).toEqual(at);
    expect(screen.queryByRole("button", { name: "Instance actions" })).toBeNull();
  });

  it("IC03: no overrides — Reset is disabled and says why", () => {
    renderRow(makeComposer({ component: makeComponent(), instance: makeInstance({ overrides: [] } as never) }));
    expect(screen.getByTestId("component-reset")).toBeDisabled();
    expect(screen.getByTestId("component-reset")).toHaveTextContent("Reset to main component");
    expect(screen.getByTestId("component-reset-reason")).toHaveTextContent("No overrides to reset");
  });

  it("no variants: the select reads Default, its only choice", () => {
    renderRow(makeComposer({ component: makeComponent(), instance: makeInstance() }));
    const select = screen.getByLabelText("Variant") as HTMLSelectElement;
    expect([...select.options].map((o) => o.textContent)).toEqual(["Default"]);
  });

  it("variants: lists them, shows the current one, and swaps the variant", () => {
    const updateInstanceVariant = vi.fn();
    renderRow(
      makeComposer({
        component: withVariants(),
        instance: makeInstance({ variantSelection: { variantId: "v-l" } } as never),
        updateInstanceVariant,
      }),
    );
    const select = screen.getByLabelText("Variant") as HTMLSelectElement;
    expect([...select.options].map((o) => o.textContent)).toEqual(["Small", "Large"]);
    expect(select.value).toBe("v-l");
    fireEvent.change(select, { target: { value: "v-s" } });
    expect(updateInstanceVariant).toHaveBeenCalledWith("el-1", "v-s");
  });

  it("IC04: a removed variant reads 'Variant unavailable' and why — no silent Default; choosing one swaps", () => {
    const updateInstanceVariant = vi.fn();
    renderRow(makeComposer({ component: withVariants(), instance: makeInstance({ variantSelection: { variantId: "v-dark" } } as never), updateInstanceVariant }));
    const select = screen.getByLabelText("Variant") as HTMLSelectElement;
    expect(select.selectedOptions[0].textContent).toBe("Variant unavailable");
    expect(screen.getByTestId("component-variant-missing")).toHaveTextContent("The selected variant was removed from");
    fireEvent.change(select, { target: { value: "v-s" } });
    expect(updateInstanceVariant).toHaveBeenCalledWith("el-1", "v-s");
  });

  it("Edit master opens the Components panel on that master", () => {
    const composer = makeComposer({ component: makeComponent(), instance: makeInstance() });
    renderRow(composer);
    fireEvent.click(screen.getByTestId("component-edit-master"));
    expect(composer.emit).toHaveBeenCalledWith(EVENTS.UI_SWITCH_TAB, { tab: "components" });
    expect(composer.emit).toHaveBeenCalledWith(EVENTS.UI_COMPONENTS_OPEN_MASTER, { componentId: "comp-1", instanceId: "el-1" });
  });

  it("Reset to main component confirms first, then resets", () => {
    const resetInstance = vi.fn();
    renderRow(makeComposer({ component: makeComponent(), instance: withOverrides(2), resetInstance }));
    fireEvent.click(screen.getByTestId("component-reset"));
    expect(resetInstance).not.toHaveBeenCalled();
    expect(screen.getByText("Reset this instance?")).toBeTruthy();
    expect(screen.getByText("Its 2 overrides will be removed. Content from the main component replaces them.")).toBeTruthy();
    fireEvent.click(screen.getByTestId("instance-reset-confirm-confirm"));
    expect(resetInstance).toHaveBeenCalledWith("el-1");
  });

  it("2L9 IC02 walk: after the reset re-mounts the instance, it is selected again", async () => {
    const resetInstance = vi.fn(async () => true);
    const composer = makeComposer({ component: makeComponent(), instance: withOverrides(2), resetInstance });
    const select = vi.fn();
    (composer as unknown as { selection: unknown }).selection = { getSelectedIds: () => [], select };
    renderRow(composer);
    fireEvent.click(screen.getByTestId("component-reset"));
    fireEvent.click(screen.getByTestId("instance-reset-confirm-confirm"));
    await waitFor(() => expect(select).toHaveBeenCalled());
  });

  it("2L9 IC06: Detach applies at once, says \"{name} detached\" and its Undo undoes that detach", async () => {
    const detachInstance = vi.fn(async () => true);
    const undo = vi.fn(() => true);
    const composer = makeComposer({ component: makeComponent(), instance: makeInstance(), detachInstance, undo });
    renderRow(composer);
    fireEvent.click(screen.getByTestId("component-detach"));
    expect(detachInstance).toHaveBeenCalledWith("el-1");
    expect(screen.queryByText("Detach this Reservation banner instance?")).toBeNull();
    expect(await screen.findByText("Reservation banner detached")).toBeTruthy();
    // The Undo is bound to the detach (captureUndo after it landed), not to whatever is newest later.
    expect(composer.history.captureUndo).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(undo).toHaveBeenCalledTimes(1);
  });

  it("a detach that fails says so and offers no Undo", async () => {
    const composer = makeComposer({ component: makeComponent(), instance: makeInstance(), detachInstance: vi.fn(async () => false) });
    renderRow(composer);
    fireEvent.click(screen.getByTestId("component-detach"));
    expect(await screen.findByText("Couldn't detach this instance. It may already be detached.")).toBeTruthy();
    expect(composer.history.captureUndo).not.toHaveBeenCalled();
  });

  it("P-1: a locked instance refuses the reset even after the confirm", () => {
    const resetInstance = vi.fn();
    const composer = makeComposer({ component: makeComponent(), instance: withOverrides(1), resetInstance, locked: true });
    renderRow(composer);
    fireEvent.click(screen.getByTestId("component-reset"));
    fireEvent.click(screen.getByTestId("instance-reset-confirm-confirm"));
    expect(resetInstance).not.toHaveBeenCalled();
    expect(composer.emit).toHaveBeenCalledWith(EVENTS.LOCKED_ELEMENTS_SKIPPED, undefined);
  });

  it.each(["locked", "conflict"] as const)("read-only (%s): variant, reset and detach are off, Edit main component stays", (reason) => {
    const updateInstanceVariant = vi.fn();
    const detachInstance = vi.fn(async () => true);
    const composer = makeComposer({ component: withVariants(), instance: withOverrides(1), updateInstanceVariant, detachInstance });
    renderRow(composer, readOnlyCtx(reason));
    // Read-only is not disabled (DD-18): legible, focusable, the change refused.
    const select = screen.getByLabelText("Variant") as HTMLSelectElement;
    expect(select.disabled).toBe(false);
    expect(select.getAttribute("aria-readonly")).toBe("true");
    fireEvent.change(select, { target: { value: select.options[select.options.length - 1].value } });
    expect(updateInstanceVariant).not.toHaveBeenCalled();
    for (const id of ["component-reset", "component-detach"]) {
      expect(screen.getByTestId(id).getAttribute("aria-disabled")).toBe("true");
      fireEvent.click(screen.getByTestId(id));
    }
    expect(screen.queryByTestId("instance-reset-confirm-confirm")).toBeNull();
    expect(detachInstance).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId("component-edit-master"));
    expect(composer.emit).toHaveBeenCalledWith(EVENTS.UI_COMPONENTS_OPEN_MASTER, { componentId: "comp-1", instanceId: "el-1" });
  });
});
