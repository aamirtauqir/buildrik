/**
 * InteractionsSection smoke tests
 * @license BSD-3-Clause
 */

import { render, screen, fireEvent } from "@testing-library/react";
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

  it("shows empty-state hint when no interactions", () => {
    renderOpen({ interactions: [], onInteractionsChange: vi.fn() });
    expect(screen.getByText(/No interactions yet/i)).toBeInTheDocument();
  });

  it("renders Add Interaction button", () => {
    renderOpen({ interactions: [], onInteractionsChange: vi.fn() });
    // Multiple matches possible (section title includes "Interactions") — use getAllByText
    const matches = screen.getAllByText(/Add Interaction/i);
    expect(matches.length).toBeGreaterThan(0);
  });

  it("shows the trigger picker panel when Add Interaction is clicked", () => {
    renderOpen({ interactions: [], onInteractionsChange: vi.fn() });
    fireEvent.click(screen.getByText(/\+ Add Interaction/i));
    expect(screen.getByText("Choose Trigger")).toBeInTheDocument();
  });

  it("hides the picker panel when close button is clicked", () => {
    renderOpen({ interactions: [], onInteractionsChange: vi.fn() });
    fireEvent.click(screen.getByText(/\+ Add Interaction/i));
    // The × close button rendered via &#215;
    const closeBtn = screen.getByText("×");
    fireEvent.click(closeBtn);
    expect(screen.queryByText("Choose Trigger")).not.toBeInTheDocument();
  });

  it("calls onInteractionsChange when a trigger is selected", () => {
    const onChange = vi.fn();
    renderOpen({ interactions: [], onInteractionsChange: onChange });
    fireEvent.click(screen.getByText(/\+ Add Interaction/i));
    fireEvent.click(screen.getByText("On Click"));
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
    expect(screen.getByText("On Hover")).toBeInTheDocument();
  });

  it("calls onInteractionsChange with empty array when interaction is deleted", () => {
    const interaction = makeInteraction("hover");
    const onChange = vi.fn();
    renderOpen({
      interactions: [interaction],
      onInteractionsChange: onChange,
    });
    // Expand the item to reveal the Delete button
    fireEvent.click(screen.getByText("On Hover"));
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
    fireEvent.click(screen.getByText("On Click"));
    fireEvent.click(screen.getByText("Disable"));
    expect(onChange).toHaveBeenCalledOnce();
    const [updated] = onChange.mock.calls[0] as [Interaction[]];
    expect(updated[0].enabled).toBe(false);
  });
});
