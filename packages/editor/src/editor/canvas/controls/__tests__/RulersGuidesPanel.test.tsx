/**
 * design-2l9 153:79518 / 155:83650 / 155:82271 — Rulers and guides over the
 * site's real guides: list, edit (position, lock, Apply), remove + undo, add.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as React from "react";
import { RulersGuidesPanel, type CanvasGuideActions } from "../RulersGuidesPanel";
import type { CanvasGuide } from "@/shared/types/canvas";

function Host({ initial, spy }: { initial: CanvasGuide[]; spy: Partial<CanvasGuideActions> }) {
  const [list, setList] = React.useState(initial);
  const guides: CanvasGuideActions = {
    list,
    add: (type, position) => { spy.add?.(type, position); setList((l) => [...l, { id: "new", type, position, locked: false }]); },
    update: (id, position) => { spy.update?.(id, position); setList((l) => l.map((g) => (g.id === id ? { ...g, position } : g))); },
    setLocked: (id, locked) => { spy.setLocked?.(id, locked); setList((l) => l.map((g) => (g.id === id ? { ...g, locked } : g))); },
    remove: (id) => { spy.remove?.(id); setList((l) => l.filter((g) => g.id !== id)); },
    restore: (g) => { spy.restore?.(g); setList((l) => [...l, g]); },
  };
  return <RulersGuidesPanel rulersOn onRulersChange={() => {}} guides={guides} onClose={() => {}} />;
}

const V: CanvasGuide = { id: "v", type: "vertical", position: 320, locked: false };
const H: CanvasGuide = { id: "h", type: "horizontal", position: 120, locked: false };

describe("RulersGuidesPanel", () => {
  it("lists the guides as the board does (153:79518)", () => {
    render(<Host initial={[V, H]} spy={{}} />);
    expect(screen.getByTestId("guide-row-v")).toHaveTextContent("Vertical · 320 pxUnlocked");
    expect(screen.getByTestId("guide-row-h")).toHaveTextContent("Horizontal · 120 pxUnlocked");
    expect(screen.getByText("Guides · shared across this site")).toBeInTheDocument();
  });

  it("moves a guide on Apply only (155:83650)", () => {
    const update = vi.fn();
    render(<Host initial={[V]} spy={{ update }} />);
    fireEvent.click(screen.getByTestId("guide-edit-v"));
    expect(screen.getByText("Vertical guide")).toBeInTheDocument();
    fireEvent.change(screen.getByTestId("guide-position"), { target: { value: "400" } });
    expect(update).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId("guide-apply"));
    expect(update).toHaveBeenCalledWith("v", 400);
    expect(screen.getByTestId("guide-row-v")).toHaveTextContent("Vertical · 400 pxUnlocked");
  });

  it("Lock acts at once; a locked guide is read-only with ‹ Back to guides (145:67569)", () => {
    const setLocked = vi.fn();
    render(<Host initial={[V]} spy={{ setLocked }} />);
    fireEvent.click(screen.getByTestId("guide-edit-v"));
    fireEvent.click(screen.getByTestId("guide-lock"));
    expect(setLocked).toHaveBeenCalledWith("v", true);
    expect(screen.getByTestId("guide-position")).toBeDisabled();
    expect(screen.getByTestId("guide-hint")).toHaveTextContent("Unlock this guide to change it.");
    expect(screen.getByTestId("guide-remove")).toBeDisabled();
    expect(screen.getByTestId("guide-lock")).toHaveTextContent("Unlock guide");
    expect(screen.queryByTestId("guide-apply")).toBeNull();
    fireEvent.click(screen.getByTestId("guide-back"));
    expect(screen.getByTestId("guide-row-v")).toHaveTextContent("Vertical · 320 pxLocked");
  });

  it("refuses a position that is not a whole number", () => {
    render(<Host initial={[V]} spy={{}} />);
    fireEvent.click(screen.getByTestId("guide-edit-v"));
    fireEvent.change(screen.getByTestId("guide-position"), { target: { value: "3.5" } });
    expect(screen.getByTestId("guide-apply")).toBeDisabled();
  });

  it("removes a guide and offers to undo the removal (155:82271)", () => {
    const restore = vi.fn();
    render(<Host initial={[V, H]} spy={{ restore }} />);
    fireEvent.click(screen.getByTestId("guide-edit-v"));
    fireEvent.click(screen.getByTestId("guide-remove"));
    expect(screen.queryByTestId("guide-row-v")).toBeNull();
    fireEvent.click(screen.getByTestId("guides-undo-remove"));
    expect(restore).toHaveBeenCalledWith(V);
    expect(screen.getByTestId("guide-row-v")).toBeInTheDocument();
  });

  it("adds a guide of the chosen direction", () => {
    const add = vi.fn();
    render(<Host initial={[]} spy={{ add }} />);
    expect(screen.getByTestId("guides-empty")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("guides-add"));
    fireEvent.click(screen.getByTestId("guide-type-horizontal"));
    fireEvent.change(screen.getByTestId("guide-position"), { target: { value: "240" } });
    fireEvent.click(screen.getByTestId("guide-apply"));
    expect(add).toHaveBeenCalledWith("horizontal", 240);
  });
});
