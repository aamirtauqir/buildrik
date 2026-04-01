import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ProInspector } from "../ProInspector";

const makeComposer = () => ({
  elements: { getElement: vi.fn(() => null) },
  selection: {
    getSelected: vi.fn(() => null),
    getAllSelected: vi.fn(() => []),
    select: vi.fn(),
    clear: vi.fn(),
  },
  styles: null,
  history: { canUndo: vi.fn(() => false), canRedo: vi.fn(() => false) },
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
});

const el = { id: "abc12345678", type: "container", tag: "div" };

describe("Inspector tabs — ARIA roles", () => {
  it("tab container has role=tablist", () => {
    render(<ProInspector selectedElement={el as never} composer={makeComposer() as never} />);
    expect(screen.getByRole("tablist")).toBeInTheDocument();
  });

  it("each tab button has role=tab", () => {
    render(<ProInspector selectedElement={el as never} composer={makeComposer() as never} />);
    expect(screen.getAllByRole("tab")).toHaveLength(3);
  });

  it("active tab has aria-selected=true", () => {
    render(<ProInspector selectedElement={el as never} composer={makeComposer() as never} />);
    const tabs = screen.getAllByRole("tab");
    const selectedTab = tabs.find((t) => t.getAttribute("aria-selected") === "true");
    expect(selectedTab).toBeDefined();
  });

  it("does NOT use aria-pressed on tab buttons", () => {
    render(<ProInspector selectedElement={el as never} composer={makeComposer() as never} />);
    screen.getAllByRole("tab").forEach((tab) => {
      expect(tab).not.toHaveAttribute("aria-pressed");
    });
  });
});

describe("Inspector tabs — keyboard navigation", () => {
  it("ArrowRight moves focus to next tab", () => {
    render(<ProInspector selectedElement={el as never} composer={makeComposer() as never} />);
    const tabs = screen.getAllByRole("tab");
    tabs[0].focus();
    fireEvent.keyDown(tabs[0], { key: "ArrowRight" });
    expect(document.activeElement).toBe(tabs[1]);
  });

  it("ArrowLeft moves focus to previous tab", () => {
    render(<ProInspector selectedElement={el as never} composer={makeComposer() as never} />);
    const tabs = screen.getAllByRole("tab");
    tabs[1].focus();
    fireEvent.keyDown(tabs[1], { key: "ArrowLeft" });
    expect(document.activeElement).toBe(tabs[0]);
  });
});
