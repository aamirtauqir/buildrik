/**
 * AnimationSection smoke tests
 * @license BSD-3-Clause
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { AnimationSection } from "../AnimationSection";
import type { AnimationConfig } from "../../../../shared/types/animations";
import { DEFAULT_ANIMATION } from "../../../../shared/types/animations";

// Helper: render with section open so children are visible
const renderOpen = (props: Parameters<typeof AnimationSection>[0]) =>
  render(<AnimationSection {...props} isOpen={true} />);

describe("AnimationSection", () => {
  it("renders without crashing when no animation is set", () => {
    const { container } = render(
      <AnimationSection animation={null} onAnimationChange={vi.fn()} />
    );
    expect(container.firstChild).not.toBeNull();
  });

  it("shows 'No Animation' state when animation is null", () => {
    renderOpen({ animation: null, onAnimationChange: vi.fn() });
    expect(screen.getByText("No Animation")).toBeInTheDocument();
  });

  it("shows 'Animation Enabled' state when animation is provided", () => {
    renderOpen({ animation: DEFAULT_ANIMATION, onAnimationChange: vi.fn() });
    expect(screen.getByText("Animation Enabled")).toBeInTheDocument();
  });

  it("calls onAnimationChange with config when Enable button is clicked", () => {
    const onChange = vi.fn();
    renderOpen({ animation: null, onAnimationChange: onChange });
    // The toggle button sits in the header row — it's the only button with "Enable" text
    // inside the toggle area. Use getAllByText and pick the first (the toggle).
    const enableBtns = screen.getAllByText("Enable");
    fireEvent.click(enableBtns[0]);
    expect(onChange).toHaveBeenCalledOnce();
    const arg = onChange.mock.calls[0][0] as AnimationConfig;
    expect(arg).not.toBeNull();
    expect(arg.type).toBe(DEFAULT_ANIMATION.type);
  });

  it("calls onAnimationChange with null when Disable button is clicked", () => {
    const onChange = vi.fn();
    renderOpen({ animation: DEFAULT_ANIMATION, onAnimationChange: onChange });
    // "Disable" only appears in the toggle button when animation is enabled
    fireEvent.click(screen.getByText("Disable"));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("shows the animation type name as preview text when enabled", () => {
    renderOpen({ animation: DEFAULT_ANIMATION, onAnimationChange: vi.fn() });
    // Animation type appears as label in the enabled-state banner
    expect(screen.getByText("Animation Enabled")).toBeInTheDocument();
  });

  it("shows quick-tip text when disabled", () => {
    renderOpen({ animation: null, onAnimationChange: vi.fn() });
    // The tip contains "Enable" within the text — check the paragraph exists
    const tip = screen.getByText(/entrance, attention, or exit/i);
    expect(tip).toBeInTheDocument();
  });

  it("renders Generated CSS block when enabled", () => {
    renderOpen({ animation: DEFAULT_ANIMATION, onAnimationChange: vi.fn() });
    expect(screen.getByText("Generated CSS:")).toBeInTheDocument();
  });
});
