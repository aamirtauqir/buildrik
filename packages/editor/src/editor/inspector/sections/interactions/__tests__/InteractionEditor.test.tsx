/**
 * InteractionEditor — duration/delay (seconds↔ms), animation/easing selects,
 * enable-toggle / remove / preview actions.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
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

/* P-11(c): an emptied field wrote NaN into the interaction, and a negative
   number was taken as-is. The field is a draft while it has focus: a keystroke
   writes only a finite value already inside the field's range, so typing
   "0.5" can pass through "0" (below Duration's 0.1 minimum) without being
   snapped to 0.1. On blur an out-of-range number is clamped and written; an
   empty or non-numeric draft restores the stored value. Nothing ever stores
   NaN or a negative. */
describe("InteractionEditor — timing validation (P-11c)", () => {
  const written = (onUpdate: ReturnType<typeof vi.fn>) =>
    onUpdate.mock.calls.map(([, patch]) => patch.animation);

  /** Feeds writes back in, like the real section does. */
  function Host({ onUpdate }: { onUpdate: (id: string, patch: Partial<Interaction>) => void }) {
    const [interaction, setInteraction] = React.useState(makeInteraction());
    return (
      <InteractionEditor
        interaction={interaction}
        onUpdate={(id, patch) => {
          onUpdate(id, patch);
          setInteraction((prev) => ({ ...prev, ...patch }));
        }}
        onRemove={vi.fn()}
        onToggleEnabled={vi.fn()}
      />
    );
  }

  it("typing 0 on the way to 0.5 does not snap Duration to 0.1", () => {
    const onUpdate = vi.fn();
    render(<Host onUpdate={onUpdate} />);
    const [duration] = screen.getAllByRole("spinbutton");
    fireEvent.change(duration, { target: { value: "0" } });
    expect(onUpdate).not.toHaveBeenCalled();
    expect(duration).toHaveValue(0);
    fireEvent.change(duration, { target: { value: "0.5" } });
    expect(written(onUpdate)).toEqual([expect.objectContaining({ duration: 500 })]);
    expect(duration).toHaveValue(0.5);
  });

  it("an emptied Duration or Delay writes nothing and restores the stored value on blur", () => {
    const onUpdate = vi.fn();
    render(<Host onUpdate={onUpdate} />);
    const [duration, delay] = screen.getAllByRole("spinbutton");
    fireEvent.change(duration, { target: { value: "" } });
    fireEvent.change(delay, { target: { value: "" } });
    expect(duration).toHaveValue(null);
    fireEvent.blur(duration);
    fireEvent.blur(delay);
    expect(onUpdate).not.toHaveBeenCalled();
    expect(duration).toHaveValue(1);
    expect(delay).toHaveValue(0);
  });

  it("a negative Duration or Delay writes nothing while typing and is clamped on blur", () => {
    const onUpdate = vi.fn();
    render(<Host onUpdate={onUpdate} />);
    const [duration, delay] = screen.getAllByRole("spinbutton");
    fireEvent.change(duration, { target: { value: "-2" } });
    fireEvent.change(delay, { target: { value: "-1" } });
    expect(onUpdate).not.toHaveBeenCalled();
    fireEvent.blur(duration);
    fireEvent.blur(delay);
    // Delay was already 0, so its clamp has nothing to write.
    const [d, ...rest] = written(onUpdate);
    expect(d.duration).toBe(100);
    expect(rest).toEqual([]);
    written(onUpdate).forEach((a) => {
      expect(Number.isFinite(a.duration)).toBe(true);
      expect(Number.isFinite(a.delay)).toBe(true);
      expect(a.duration).toBeGreaterThanOrEqual(0);
      expect(a.delay).toBeGreaterThanOrEqual(0);
    });
    expect(duration).toHaveValue(0.1);
    expect(delay).toHaveValue(0);
  });

  it("a Duration above the maximum is clamped on blur", () => {
    const onUpdate = vi.fn();
    render(<Host onUpdate={onUpdate} />);
    const [duration] = screen.getAllByRole("spinbutton");
    fireEvent.change(duration, { target: { value: "20" } });
    expect(onUpdate).not.toHaveBeenCalled();
    fireEvent.blur(duration);
    expect(written(onUpdate)).toEqual([expect.objectContaining({ duration: 10000 })]);
  });
});
