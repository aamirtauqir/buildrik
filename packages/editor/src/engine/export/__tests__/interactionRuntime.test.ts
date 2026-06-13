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

// Mirror of AnimationPreset (minus "custom", which is data-driven at runtime)
// and EasingFunction. If a preset/easing is added to the inspector, these
// arrays force the runtime map to keep up.
const PRESETS = [
  "fadeIn", "fadeOut", "slideUp", "slideDown", "slideLeft", "slideRight",
  "scaleIn", "scaleOut", "rotateIn", "rotateOut", "bounceIn", "bounceOut",
  "flipX", "flipY", "pulse", "shake", "blur", "glow",
] as const;
const EASINGS = [
  "linear", "easeIn", "easeOut", "easeInOut", "easeInQuad", "easeOutQuad",
  "easeInCubic", "easeOutCubic", "easeInQuart", "easeOutQuart", "spring", "bounce",
] as const;

describe("interaction runtime preset map (SSOT)", () => {
  it("covers every non-custom AnimationPreset", () => {
    for (const p of PRESETS) {
      expect(INTERACTION_PRESET_KEYFRAMES[p], `missing keyframes for ${p}`).toBeDefined();
      expect(INTERACTION_PRESET_KEYFRAMES[p].length).toBeGreaterThanOrEqual(2);
    }
    expect(Object.keys(INTERACTION_PRESET_KEYFRAMES)).toHaveLength(PRESETS.length);
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
