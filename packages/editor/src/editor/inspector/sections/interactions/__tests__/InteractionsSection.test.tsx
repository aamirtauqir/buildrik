/**
 * InteractionsSection smoke tests
 * @license BSD-3-Clause
 */

import { render, screen, fireEvent, act } from "@testing-library/react";
import { EVENTS } from "@/shared/constants/events";
import { describe, it, expect, vi } from "vitest";
import { InteractionsSection } from "../index";
import type { Interaction } from "../types";
import { DEFAULT_ANIMATION_CONFIG } from "../../../../../engine/interactions/types";

const makeInteraction = (trigger: Interaction["trigger"] = "click"): Interaction => ({
  id: `test-${trigger}`,
  trigger,
  animation: { ...DEFAULT_ANIMATION_CONFIG },
  enabled: true,
});

// Render with section open so children are visible
const renderOpen = (props: Parameters<typeof InteractionsSection>[0]) =>
  render(<InteractionsSection {...props} isOpen={true} />);

describe("InteractionsSection", () => {
  it("renders without crashing with empty interactions", () => {
    const { container } = render(
      <InteractionsSection interactions={[]} onInteractionsChange={vi.fn()} />
    );
    expect(container.firstChild).not.toBeNull();
  });

  it("draws no empty-state paragraph — the board shows only + Add interaction", () => {
    renderOpen({ interactions: [], onInteractionsChange: vi.fn() });
    expect(screen.queryByText(/No interactions yet/i)).toBeNull();
  });

  it("a row reads trigger · animation · chevron (board 4428:142686: On hover  Scale up ›)", () => {
    const interaction = { ...makeInteraction("hover"), animation: { ...DEFAULT_ANIMATION_CONFIG, preset: "scaleUp" } } as Interaction;
    renderOpen({ interactions: [interaction], onInteractionsChange: vi.fn() });
    const row = screen.getByRole("button", { name: /On hover/ });
    expect(row).toHaveTextContent("Scale Up");
    expect(row).toHaveTextContent("›");
  });

  it("renders Add Interaction button", () => {
    renderOpen({ interactions: [], onInteractionsChange: vi.fn() });
    // Multiple matches possible (section title includes "Interactions") — use getAllByText
    const matches = screen.getAllByText(/Add interaction/);
    expect(matches.length).toBeGreaterThan(0);
  });

  it("shows the trigger picker panel when Add Interaction is clicked", () => {
    renderOpen({ interactions: [], onInteractionsChange: vi.fn() });
    fireEvent.click(screen.getByText(/\+ Add interaction/));
    expect(screen.getByText("Choose Trigger")).toBeInTheDocument();
  });

  it("hides the picker panel when close button is clicked", () => {
    renderOpen({ interactions: [], onInteractionsChange: vi.fn() });
    fireEvent.click(screen.getByText(/\+ Add interaction/));
    // The × close button rendered via &#215;
    const closeBtn = screen.getByText("×");
    fireEvent.click(closeBtn);
    expect(screen.queryByText("Choose Trigger")).not.toBeInTheDocument();
  });

  it("calls onInteractionsChange when a trigger is selected", () => {
    const onChange = vi.fn();
    renderOpen({ interactions: [], onInteractionsChange: onChange });
    fireEvent.click(screen.getByText(/\+ Add interaction/));
    fireEvent.click(screen.getByText("On click"));
    expect(onChange).toHaveBeenCalledOnce();
    const [newList] = onChange.mock.calls[0] as [Interaction[]];
    expect(newList).toHaveLength(1);
    expect(newList[0].trigger).toBe("click");
    expect(newList[0].enabled).toBe(true);
  });

  it("renders existing interactions", () => {
    const interaction = makeInteraction("hover");
    renderOpen({
      interactions: [interaction],
      onInteractionsChange: vi.fn(),
    });
    expect(screen.getByText("On hover")).toBeInTheDocument();
  });

  it("calls onInteractionsChange with empty array when interaction is deleted", () => {
    const interaction = makeInteraction("hover");
    const onChange = vi.fn();
    renderOpen({
      interactions: [interaction],
      onInteractionsChange: onChange,
    });
    // Expand the item to reveal the Delete button
    fireEvent.click(screen.getByText("On hover"));
    fireEvent.click(screen.getByText("Delete"));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("toggles enabled state on interaction", () => {
    const interaction = makeInteraction("click");
    const onChange = vi.fn();
    renderOpen({
      interactions: [interaction],
      onInteractionsChange: onChange,
    });
    fireEvent.click(screen.getByText("On click"));
    fireEvent.click(screen.getByText("Disable"));
    expect(onChange).toHaveBeenCalledOnce();
    const [updated] = onChange.mock.calls[0] as [Interaction[]];
    expect(updated[0].enabled).toBe(false);
  });

  it("shows an interaction the moment the element takes it (live defect: it appeared only after a re-mount)", () => {
    const handlers = new Map<string, (el: unknown) => void>();
    let stored: Interaction[] = [];
    const element = { id: "el-1", getInteractions: () => stored };
    const composer = {
      on: (e: string, h: (el: unknown) => void) => handlers.set(e, h),
      off: (e: string) => handlers.delete(e),
      elements: { getElement: () => element },
    };
    renderOpen({
      interactions: [],
      onInteractionsChange: (next) => {
        stored = next;
        handlers.get(EVENTS.ELEMENT_UPDATED)?.(element);
      },
      composer: composer as never,
      elementId: "el-1",
    });
    fireEvent.click(screen.getByText(/\+ Add interaction/));
    act(() => {
      fireEvent.click(screen.getByText("On hover"));
    });
    expect(screen.getByRole("button", { name: /On hover/ })).toBeInTheDocument();
  });
});
