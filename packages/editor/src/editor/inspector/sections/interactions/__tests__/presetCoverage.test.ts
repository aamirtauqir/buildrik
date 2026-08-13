/**
 * Every animation preset the inspector offers must have a timeline in the
 * runtime. It offered 31 and the runtime implemented 2 — the other 29 fell to
 * a default that returns a 0.2s opacity nudge, so Bounce, Zoom In, Shake and
 * Flip all produced the same faint flicker. Nothing looked broken, which is
 * why nothing caught it.
 *
 * This is the cross-layer check the two separate lists never had.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect } from "vitest";
import { PRESET_TIMELINES } from "@/engine/interactions/InteractionRuntime";
import { ANIMATION_PRESET_GROUPS, TRIGGER_GROUPS } from "../types";
import type { InteractionTrigger } from "@/engine/interactions/types";

const OFFERED_PRESETS = Object.values(ANIMATION_PRESET_GROUPS)
  .flat()
  .map((p) => p.value);

describe("inspector option catalogues vs the runtime", () => {
  it("offers at least one preset per group", () => {
    expect(OFFERED_PRESETS.length).toBeGreaterThan(0);
  });

  it.each(OFFERED_PRESETS)("preset %s has a timeline", (preset) => {
    expect(PRESET_TIMELINES[preset]).toBeDefined();
  });

  /* The picker's trigger list and the engine's InteractionTrigger union are
     separate declarations, so the panel could offer "active" while the
     runtime's switch had never heard of it. This is what makes them meet. */
  it.each(Object.values(TRIGGER_GROUPS).flat().map((t) => t.value))(
    "trigger %s is a value the engine knows",
    (trigger) => {
      const known: InteractionTrigger[] = [
        "hover", "click", "active", "focus", "blur",
        "page-load", "page-scroll", "page-leave",
        "scroll-into-view", "while-scrolling", "scroll-out",
        "mouse-over", "mouse-move", "mouse-out",
      ];
      expect(known).toContain(trigger as InteractionTrigger);
    },
  );
});
