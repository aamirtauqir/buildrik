// C2: the published interaction runtime is the single source of truth for
// animations on exported sites. These lock the preset map's completeness and
// the boot script's self-containment.

import { describe, it, expect } from "vitest";
import {
  INTERACTION_PRESET_KEYFRAMES,
  INTERACTION_EASINGS,
  INTERACTION_ATTR,
  buildInteractionRuntimeScript,
} from "../interactionRuntime";

/* This used to carry a hand-typed mirror of AnimationPreset and assert the map
   had exactly that many keys — so it went red when the union GREW and, worse,
   would have stayed green if the union grew and the map did not, as long as
   someone updated the array. Completeness is already enforced at compile time:
   INTERACTION_PRESET_KEYFRAMES is typed Record<Exclude<AnimationPreset,
   "custom">, …>, which is what caught the 22 missing presets. What a runtime
   test can add is that each entry is usable. */
const EASINGS = [
  "linear", "easeIn", "easeOut", "easeInOut", "easeInQuad", "easeOutQuad",
  "easeInCubic", "easeOutCubic", "easeInQuart", "easeOutQuart", "spring", "bounce",
] as const;

describe("interaction runtime preset map (SSOT)", () => {
  it("gives every preset at least two usable keyframes", () => {
    for (const [preset, frames] of Object.entries(INTERACTION_PRESET_KEYFRAMES)) {
      expect(frames.length, `${preset} needs at least two frames`).toBeGreaterThanOrEqual(2);
      for (const frame of frames) {
        expect(Object.keys(frame).length, `${preset} has an empty frame`).toBeGreaterThan(0);
      }
    }
  });

  it("maps every EasingFunction to a CSS timing function", () => {
    for (const e of EASINGS) {
      expect(INTERACTION_EASINGS[e], `missing easing for ${e}`).toBeTruthy();
    }
  });
});

describe("buildInteractionRuntimeScript", () => {
  const script = buildInteractionRuntimeScript();

  it("is a self-contained script tag with no external dependencies", () => {
    expect(script.startsWith("<script>")).toBe(true);
    expect(script.endsWith("</script>")).toBe(true);
    expect(script).not.toMatch(/import |require\(|gsap/i);
  });

  it("inlines the preset and easing maps so the page needs no extra files", () => {
    expect(script).toContain('"pulse"');
    expect(script).toContain("cubic-bezier");
  });

  it("wires every trigger type the inspector offers", () => {
    for (const t of [
      "click", "mouseenter", "mouseleave", "focus", "blur", "mousemove",
      "beforeunload", "scroll", "DOMContentLoaded",
    ]) {
      expect(script, `runtime missing handler for ${t}`).toContain(t);
    }
    // IntersectionObserver path for scroll-into-view / scroll-out
    expect(script).toContain("IntersectionObserver");
  });

  it("selects elements by the same attribute the export emits", () => {
    expect(script).toContain(INTERACTION_ATTR);
    expect(INTERACTION_ATTR).toBe("data-buildrick-interactions");
  });
});
