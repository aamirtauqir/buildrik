/**
 * Every animation preset the inspector offers must exist in each runtime
 * that plays it. The canvas GSAP runtime once implemented 2 of 31, so most
 * presets fell to a faint default flicker and nothing looked broken. That
 * runtime (engine/interactions/InteractionRuntime) was removed with its
 * uncalled InteractionManager (R1 §7); the CSS keyframes and the published
 * WAAPI runtime remain.
 *
 * This is the cross-layer check the two separate lists never had.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect } from "vitest";
import { ANIMATION_KEYFRAMES } from "@/shared/constants/animationKeyframes";
import { INTERACTION_PRESET_KEYFRAMES } from "@/engine/export/interactionRuntime";
import { ANIMATION_PRESET_GROUPS, TRIGGER_GROUPS } from "../types";
import type { InteractionTrigger } from "@/engine/interactions/types";

const OFFERED_PRESETS = Object.values(ANIMATION_PRESET_GROUPS)
  .flat()
  .map((p) => p.value);

describe("inspector option catalogues vs the runtime", () => {
  it("offers at least one preset per group", () => {
    expect(OFFERED_PRESETS.length).toBeGreaterThan(0);
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

  /* A CSS @keyframes serves element animations and the inspector's own
     Preview button, which sets `animation: bd-anim-<name>`. 20 of the 39 had
     no keyframe, so Preview showed nothing for them — on the
     canvas and on the published site alike. */
  it.each(OFFERED_PRESETS)("preset %s has a keyframe", (preset) => {
    expect(ANIMATION_KEYFRAMES[`bd-anim-${preset}`]).toBeDefined();
  });

  /* The only implementation a PUBLISHED page runs: the
     dependency-free WAAPI runtime shipped in the export boot script. It had 17
     of the 39, so 22 presets animated in the editor and did nothing on the
     live site. */
  it.each(OFFERED_PRESETS)("preset %s animates on a published page", (preset) => {
    expect(
      INTERACTION_PRESET_KEYFRAMES[preset as keyof typeof INTERACTION_PRESET_KEYFRAMES],
    ).toBeDefined();
  });
});
