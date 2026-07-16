/**
 * InteractionEditor — duration/delay (seconds↔ms), animation/easing selects,
 * enable-toggle / remove / preview actions.
 *
 * @license BSD-3-Clause
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { InteractionEditor } from "../InteractionEditor";
import type { Interaction } from "../types";

function makeInteraction(overrides: Partial<Interaction> = {}): Interaction {
  return {
    id: "i1",
    trigger: "hover",
    enabled: true,
    animation: {
      type: "fadeIn",
      duration: 1000,
      delay: 0,
      easing: "power2.out",
    },
    ...overrides,
  } as Interaction;
}

function setup(overrides: Partial<Interaction> = {}) {
  const onUpdate = vi.fn();
  const onRemove = vi.fn();
  const onToggleEnabled = vi.fn();
  const onPreview = vi.fn();
  const interaction = makeInteraction(overrides);
  const utils = render(
    <InteractionEditor
      interaction={interaction}
      onUpdate={onUpdate}
      onRemove={onRemove}
      onToggleEnabled={onToggleEnabled}
      onPreview={onPreview}
    />
  );
  return { interaction, onUpdate, onRemove, onToggleEnabled, onPreview, ...utils };
}

describe("InteractionEditor — timing writes (seconds ↔ ms)", () => {
  it("shows duration in seconds and writes back milliseconds", () => {
    const { onUpdate } = setup();
    const [duration] = screen.getAllByRole("spinbutton");
    expect(duration).toHaveValue(1); // 1000ms → 1s
    fireEvent.change(duration, { target: { value: "2" } });
    expect(onUpdate).toHaveBeenCalledWith(
      "i1",
      expect.objectContaining({
        animation: expect.objectContaining({ duration: 2000 }),
      })
    );
  });

  it("writes delay in milliseconds from the seconds input", () => {
    const { onUpdate } = setup();
    const [, delay] = screen.getAllByRole("spinbutton");
    fireEvent.change(delay, { target: { value: "0.5" } });
    expect(onUpdate).toHaveBeenCalledWith(
      "i1",
      expect.objectContaining({
        animation: expect.objectContaining({ delay: 500 }),
      })
    );
  });
});

describe("InteractionEditor — select writes", () => {
  it("changing the animation type writes animation.type", () => {
    const { onUpdate, container } = setup();
    const [animationSelect] = Array.from(container.querySelectorAll("select"));
    const nextValue = animationSelect.options[1].value;
    fireEvent.change(animationSelect, { target: { value: nextValue } });
    expect(onUpdate).toHaveBeenCalledWith(
      "i1",
      expect.objectContaining({
        animation: expect.objectContaining({ type: nextValue }),
      })
    );
  });

  it("changing the easing writes animation.easing", () => {
    const { onUpdate, container } = setup();
    const easingSelect = Array.from(container.querySelectorAll("select"))[1];
    const nextValue = easingSelect.options[1].value;
    fireEvent.change(easingSelect, { target: { value: nextValue } });
    expect(onUpdate).toHaveBeenCalledWith(
      "i1",
      expect.objectContaining({
        animation: expect.objectContaining({ easing: nextValue }),
      })
    );
  });
});

describe("InteractionEditor — actions", () => {
  it("Preview fires onPreview with the interaction", () => {
    const { onPreview, interaction } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Preview" }));
    expect(onPreview).toHaveBeenCalledWith(interaction);
  });

  it("shows Disable for an enabled interaction and toggles it", () => {
    const { onToggleEnabled } = setup({ enabled: true });
    fireEvent.click(screen.getByRole("button", { name: "Disable" }));
    expect(onToggleEnabled).toHaveBeenCalledWith("i1");
  });

  it("shows Enable for a disabled interaction", () => {
    setup({ enabled: false });
    expect(screen.getByRole("button", { name: "Enable" })).toBeInTheDocument();
  });

  it("Delete fires onRemove", () => {
    const { onRemove } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(onRemove).toHaveBeenCalledWith("i1");
  });
});
