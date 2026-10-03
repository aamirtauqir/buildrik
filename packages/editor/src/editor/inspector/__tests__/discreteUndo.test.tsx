// @vitest-environment jsdom
/**
 * Discrete Inspector actions are their own undo step (QA 2026-10-02).
 *
 * The Inspector debounces a write 300 ms and the engine coalesces history for
 * ~500 ms, so two clicks less than ~0.8 s apart — Align, then a Weight choice,
 * then Reset — undid as ONE step, and a Reset fired inside the debounce was
 * overtaken by the Align before it. Typing still coalesces; clicks do not.
 * Real Composer: the history manager is the thing under test.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import type { Composer } from "@/engine";
import {
  createTestComposer,
  installEngineBrowserStubs,
  removeEngineBrowserStubs,
} from "@/engine/__tests__/test-utils/realComposer";
import { useStyleHandlers } from "../hooks/useStyleHandlers";
import { InspectorFieldContext } from "../shared/controls/InspectorFieldContext";
import { ButtonGroup } from "../shared/controls/ButtonControls";
import { InputWithUnit, SelectRow } from "../shared/controls/InputControls";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);
afterEach(() => vi.useRealTimers());

const ALIGN = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
];
const WEIGHTS = [
  { value: "400", label: "Regular" },
  { value: "700", label: "Bold" },
];

function Panel({ composer, id }: { composer: Composer; id: string }) {
  const selected = React.useMemo(() => ({ id, type: "text", tagName: "p" }) as never, [id]);
  const { styles, handleStyleChange, runDiscrete } = useStyleHandlers(selected, composer, "desktop", "normal");
  const ctx = React.useMemo(
    () => ({
      readOnly: false,
      readOnlyReason: null,
      mixedKeys: new Set<string>(),
      overrides: new Map(),
      overrideLabels: {},
      resetOverride: () => undefined,
      runDiscrete,
    }),
    [runDiscrete],
  );
  return (
    <InspectorFieldContext.Provider value={ctx}>
      <ButtonGroup label="Align" value={styles["text-align"] || ""} options={ALIGN} property="text-align" onChange={(v) => handleStyleChange("text-align", v)} />
      <SelectRow label="Weight" value={styles["font-weight"] || ""} options={WEIGHTS} property="font-weight" onChange={(v) => handleStyleChange("font-weight", v)} />
      <InputWithUnit label="Font size" value={styles["font-size"] || ""} property="font-size" onChange={(v) => handleStyleChange("font-size", v)} />
    </InspectorFieldContext.Provider>
  );
}

function setup() {
  vi.useFakeTimers();
  const composer = createTestComposer();
  const page = composer.elements.createPage("Home");
  const el = composer.elements.createElement("text", { content: "Hello" });
  composer.elements.addElement(el, page.root.id);
  composer.history.flushPending();
  render(<Panel composer={composer} id={el.getId()} />);
  const style = (p: string) => composer.elements.getElement(el.getId())?.getStyles()[p];
  const settle = () => act(() => void vi.advanceTimersByTime(2000));
  return { composer, style, settle };
}

describe("discrete Inspector actions — one undo step each", () => {
  it("Align then a Weight choice 100 ms later: one Undo takes back the Weight only", () => {
    const { composer, style, settle } = setup();
    fireEvent.click(screen.getByRole("radio", { name: "Center" }));
    act(() => void vi.advanceTimersByTime(100));
    fireEvent.change(screen.getByLabelText("Weight"), { target: { value: "700" } });
    settle();
    expect(style("text-align")).toBe("center");
    expect(style("font-weight")).toBe("700");

    act(() => void composer.history.undo());
    expect(style("font-weight")).toBeUndefined();
    expect(style("text-align")).toBe("center");
    act(() => void composer.history.undo());
    expect(style("text-align")).toBeUndefined();
  });

  it("a click lands in order after a typed value still inside the debounce, and apart from it", () => {
    const { composer, style, settle } = setup();
    const size = screen.getByRole("textbox", { name: /^Font size/ });
    fireEvent.change(size, { target: { value: "3" } });
    fireEvent.change(size, { target: { value: "30" } });
    fireEvent.click(screen.getByRole("radio", { name: "Right" }));
    settle();
    expect(style("font-size")).toBe("30px");
    expect(style("text-align")).toBe("right");
    act(() => void composer.history.undo());
    expect(style("text-align")).toBeUndefined();
    expect(style("font-size")).toBe("30px");
  });

  it("typing still coalesces: keystrokes are one step", () => {
    const { composer, style, settle } = setup();
    const size = screen.getByRole("textbox", { name: /^Font size/ });
    for (const v of ["4", "48"]) {
      fireEvent.change(size, { target: { value: v } });
      act(() => void vi.advanceTimersByTime(120));
    }
    settle();
    expect(style("font-size")).toBe("48px");
    act(() => void composer.history.undo());
    expect(style("font-size")).toBeUndefined();
  });
});
