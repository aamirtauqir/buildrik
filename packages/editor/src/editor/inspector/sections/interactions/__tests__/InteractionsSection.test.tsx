/**
 * InteractionsSection smoke tests
 * @license BSD-3-Clause
 */

import { render as rtlRender, screen, fireEvent, act } from "@testing-library/react";
import { ToastProvider } from "@/editor/chrome-ui";
import * as React from "react";
/* The section raises "Interaction added / deleted · Undo" receipts. */
const render = (ui: React.ReactElement) => rtlRender(<ToastProvider>{ui}</ToastProvider>);
import { EVENTS } from "@/shared/constants/events";
import { describe, it, expect, vi } from "vitest";
import { InteractionsSection } from "../index";
import { DEFAULT_ANIMATION } from "@/shared/types/animations";
import type { Interaction } from "../types";
import { DEFAULT_ANIMATION_CONFIG } from "@/engine/interactions/types";

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

  it("2L9 161:13919: 'Plays on all breakpoints', + Add interaction, then 'No interactions yet.'", () => {
    const { container } = renderOpen({ interactions: [], onInteractionsChange: vi.fn() });
    const text = container.textContent ?? "";
    const at = ["Plays on all breakpoints", "+ Add interaction", "No interactions yet."].map((t) => text.indexOf(t));
    expect(at.every((i) => i >= 0)).toBe(true);
    expect([...at].sort((a, b) => a - b)).toEqual(at);
  });

  it("a row reads trigger as the label, the animation as the value (board 2: On click  [Scroll to menu ▾])", () => {
    const interaction = { ...makeInteraction("hover"), animation: { ...DEFAULT_ANIMATION_CONFIG, preset: "scaleUp" } } as Interaction;
    renderOpen({ interactions: [interaction], onInteractionsChange: vi.fn() });
    const row = screen.getByRole("button", { name: /On hover/ });
    expect(row.querySelector(".bdi-lb")).toHaveTextContent("On hover");
    expect(row).toHaveTextContent("Scale Up");
  });

  it("renders Add Interaction button", () => {
    renderOpen({ interactions: [], onInteractionsChange: vi.fn() });
    // Multiple matches possible (section title includes "Interactions") — use getAllByText
    const matches = screen.getAllByText(/Add interaction/);
    expect(matches.length).toBeGreaterThan(0);
  });

  it("2L9 I14: + Add interaction opens presets first, in the board's order, then 'Choose a trigger ›'", () => {
    renderOpen({ interactions: [], onInteractionsChange: vi.fn() });
    fireEvent.click(screen.getByText(/\+ Add interaction/));
    expect(screen.getAllByTestId("add-interaction-preset").map((b) => b.textContent)).toEqual([
      "Fade in on scroll", "Slide up on scroll", "Fade in on page load", "Grow on hover", "Glow on hover", "Pulse on hover", "Press while held",
    ]);
    expect(screen.getByTestId("add-interaction-choose-trigger")).toHaveTextContent("Choose a trigger");
    /* The add screen replaces the list. */
    expect(screen.queryByText("No interactions yet.")).toBeNull();
  });

  it("a preset adds its trigger and animation", () => {
    const onChange = vi.fn();
    renderOpen({ interactions: [], onInteractionsChange: onChange });
    fireEvent.click(screen.getByText(/\+ Add interaction/));
    fireEvent.click(screen.getByText("Slide up on scroll"));
    expect(onChange).toHaveBeenCalledWith([expect.objectContaining({ trigger: "scroll-into-view", animation: expect.objectContaining({ preset: "slideUp" }) })]);
  });

  it("‹ Back to Interactions leaves the add screen", () => {
    renderOpen({ interactions: [], onInteractionsChange: vi.fn() });
    fireEvent.click(screen.getByText(/\+ Add interaction/));
    fireEvent.click(screen.getByTestId("add-interaction-back"));
    expect(screen.queryByTestId("add-interaction")).not.toBeInTheDocument();
    expect(screen.getByText("No interactions yet.")).toBeInTheDocument();
  });

  it("calls onInteractionsChange when a trigger is selected", () => {
    const onChange = vi.fn();
    renderOpen({ interactions: [], onInteractionsChange: onChange });
    fireEvent.click(screen.getByText(/\+ Add interaction/));
    fireEvent.click(screen.getByText("Choose a trigger ›"));
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
    fireEvent.click(screen.getByRole("button", { name: "More…" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
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
    fireEvent.click(screen.getByRole("button", { name: "More…" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Disable" }));
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
    fireEvent.click(screen.getByText("Choose a trigger ›"));
    act(() => {
      fireEvent.click(screen.getByText("On hover"));
    });
    /* The new interaction opens; back to the list shows its row. */
    fireEvent.click(screen.getByTestId("interactions-back"));
    expect(screen.getByRole("button", { name: /On hover/ })).toBeInTheDocument();
  });
});

/* G2-157 (option A, owner-approved): the element's CSS animation is a row
   in Interactions, labelled by its own trigger; data and export unchanged. */
describe("InteractionsSection — the element animation row", () => {
  const anim = { ...DEFAULT_ANIMATION, type: "fadeIn", trigger: "load" as const };

  it("shows the animation as '<trigger> · <preset> ›'", () => {
    renderOpen({ interactions: [], onInteractionsChange: vi.fn(), animation: anim, onAnimationChange: vi.fn() });
    const row = screen.getByRole("button", { name: /On page load/ });
    expect(row).toHaveTextContent("Fade In");
  });

  it("labels by the animation's actual trigger", () => {
    renderOpen({ interactions: [], onInteractionsChange: vi.fn(), animation: { ...anim, trigger: "hover" }, onAnimationChange: vi.fn() });
    expect(screen.getByRole("button", { name: /On hover/ })).toBeInTheDocument();
  });

  it("opens to the animation editor; Remove clears the animation", () => {
    const onAnimationChange = vi.fn();
    renderOpen({ interactions: [], onInteractionsChange: vi.fn(), animation: anim, onAnimationChange });
    fireEvent.click(screen.getByRole("button", { name: /On page load/ }));
    fireEvent.click(screen.getByRole("button", { name: "Remove animation" }));
    expect(onAnimationChange).toHaveBeenCalledWith(null);
  });

  it("no animation, no row", () => {
    renderOpen({ interactions: [], onInteractionsChange: vi.fn(), animation: null, onAnimationChange: vi.fn() });
    expect(screen.queryByRole("button", { name: /On page load/ })).toBeNull();
  });

  /* Boards 4428:142686 / 4418:109686: opening a row drills into its edit
     screen; back returns to the list. */
  it("opening an interaction drills in; back returns to the list", () => {
    const hover = makeInteraction("hover");
    renderOpen({ interactions: [hover, makeInteraction("click")], onInteractionsChange: vi.fn() });
    fireEvent.click(screen.getByRole("button", { name: /On hover/ }));
    expect(screen.getByTestId("interactions-back")).toHaveTextContent("‹ Back to Interactions");
    expect(screen.queryByRole("button", { name: /On click/ })).toBeNull();
    expect(screen.queryByText("+ Add interaction")).toBeNull();
    fireEvent.click(screen.getByTestId("interactions-back"));
    expect(screen.getByRole("button", { name: /On click/ })).toBeInTheDocument();
  });

  it("2L9 I20: Duplicate puts a copy after the original and opens it", () => {
    const interaction = makeInteraction("hover");
    const onChange = vi.fn();
    renderOpen({ interactions: [interaction], onInteractionsChange: onChange });
    fireEvent.click(screen.getByText("On hover"));
    fireEvent.click(screen.getByRole("button", { name: "More…" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Duplicate" }));
    const next = onChange.mock.calls[0][0];
    expect(next).toHaveLength(2);
    expect(next[1]).toMatchObject({ trigger: "hover", animation: interaction.animation });
    expect(next[1].id).not.toBe(interaction.id);
  });

  it("2L9 I15 / I22: a preset adds at 0.6 s Ease out and says 'Interaction added · Undo'; Undo is the document history's", async () => {
    const onChange = vi.fn();
    const undo = vi.fn();
    const composer = { on: vi.fn(), off: vi.fn(), elements: { getElement: () => null }, history: { undo } };
    renderOpen({ interactions: [], onInteractionsChange: onChange, composer: composer as never, elementId: "el-1" });
    fireEvent.click(screen.getByText(/\+ Add interaction/));
    fireEvent.click(screen.getByText("Fade in on scroll"));
    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ trigger: "scroll-into-view", animation: expect.objectContaining({ preset: "fadeIn", duration: 600, easing: "power2.out" }) }),
    ]);
    expect(await screen.findByText("Interaction added")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(undo).toHaveBeenCalledTimes(1);
  });
});
