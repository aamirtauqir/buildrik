/**
 * OverrideDot + section marks — R-DD-14, boards 26–28. The dot is announced
 * ("Overridden on Tablet", not aria-hidden), opens a per-field reset menu for
 * the kinds the engine can reset, and the section note names the kind:
 * "Padding overrides master" / "Overridden on :hover" / "Overridden on Tablet".
 *
 * @license BSD-3-Clause
 */
import { fireEvent, render, screen } from "@testing-library/react";
import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { OverrideDot, sectionOverrideMarks } from "../OverrideDot";
import type { InspectorFieldContextValue, OverrideKind } from "../InspectorFieldContext";

describe("OverrideDot", () => {
  it.each([
    ["breakpoint", "Tablet", "Overridden on Tablet", "Reset to Desktop"],
    ["pseudo", ":hover", "Overridden on :hover", "Reset to Base"],
  ] as const)("%s: announced as '%s', one reset row", (kind, label, says, reset) => {
    const onReset = vi.fn();
    render(<OverrideDot kind={kind} label={label} onReset={onReset} />);
    const dot = screen.getByRole("button", { name: says });
    expect(dot.getAttribute("aria-hidden")).toBeNull();
    fireEvent.click(dot);
    fireEvent.click(screen.getByRole("menuitem", { name: reset }));
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it("master: announced as 'Overrides master' and offers no reset the engine cannot do", () => {
    const onReset = vi.fn();
    render(<OverrideDot kind="master" label="Reservation banner" onReset={onReset} />);
    const dot = screen.getByRole("button", { name: "Overrides master" });
    expect(dot.getAttribute("aria-haspopup")).toBeNull();
    fireEvent.click(dot);
    expect(screen.queryByRole("menu")).toBeNull();
    expect(onReset).not.toHaveBeenCalled();
  });

  it("read-only (no onReset): announces, no menu", () => {
    render(<OverrideDot kind="breakpoint" label="Tablet" />);
    fireEvent.click(screen.getByRole("button", { name: "Overridden on Tablet" }));
    expect(screen.queryByRole("menu")).toBeNull();
  });
});

const ctx = (
  overrides: Record<string, OverrideKind[]>,
  labels: InspectorFieldContextValue["overrideLabels"],
): InspectorFieldContextValue => ({
  readOnly: false,
  readOnlyReason: null,
  mixedKeys: new Set(),
  overrides: new Map(Object.entries(overrides)),
  overrideLabels: labels,
  resetOverride: vi.fn(),
});

const renderNode = (node: React.ReactNode) => render(<div data-testid="host">{node}</div>);

describe("sectionOverrideMarks", () => {
  it("nothing overridden in the section → no dot, no note", () => {
    const marks = sectionOverrideMarks(ctx({ width: ["breakpoint"] }, { breakpoint: "Tablet" }), ["padding-top"]);
    expect(marks).toEqual({ headerDot: null, note: null });
  });

  it("board 26: '● Padding overrides master', no header dot", () => {
    const marks = sectionOverrideMarks(
      ctx({ "padding-top": ["master"], "padding-bottom": ["master"] }, { master: "Reservation banner" }),
      ["margin-top", "padding-top", "padding-bottom"],
    );
    expect(marks.headerDot).toBeNull();
    renderNode(marks.note);
    expect(screen.getByTestId("host").textContent).toBe("Padding overrides master");
  });

  it("two groups overridden by the master read as one sentence", () => {
    const marks = sectionOverrideMarks(
      ctx({ "padding-top": ["master"], "margin-left": ["master"] }, { master: "Banner" }),
      ["margin-left", "padding-top"],
    );
    renderNode(marks.note);
    expect(screen.getByTestId("host").textContent).toBe("Margin, Padding override master");
  });

  it("board 27: '● Overridden on :hover', no header dot", () => {
    const marks = sectionOverrideMarks(ctx({ "background-color": ["pseudo"] }, { pseudo: ":hover" }), ["background-color"]);
    expect(marks.headerDot).toBeNull();
    renderNode(marks.note);
    expect(screen.getByTestId("host").textContent).toBe("Overridden on :hover");
  });

  it("board 28: header dot 'Overridden on Tablet' + the note", () => {
    const marks = sectionOverrideMarks(ctx({ width: ["breakpoint"] }, { breakpoint: "Tablet" }), ["width", "height"]);
    renderNode(
      <>
        {marks.headerDot}
        {marks.note}
      </>,
    );
    expect(screen.getByRole("img", { name: "Overridden on Tablet" })).toBeTruthy();
    expect(screen.getByTestId("inspector-section-note").textContent).toBe("Overridden on Tablet");
  });
});
