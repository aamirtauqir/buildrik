/**
 * Element animations are written as `animation: bd-anim-<name> …` and resolve
 * against @keyframes that the canvas must carry. It carried none: the
 * docblock in animationKeyframes.ts pointed at
 * themes/components/atoms/animation-utils.css, deleted with the vibcoder CSS
 * bundle on 2026-07-28. Export injected its own copy, so animations worked on
 * a published site and nowhere in the editor — including the interactions
 * Preview button, which sets the same property.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect } from "vitest";
import { ANIMATION_KEYFRAMES, keyframesStyleSheet } from "@/shared/constants/animationKeyframes";

describe("canvas animation keyframes", () => {
  it("emits every keyframe block", () => {
    const sheet = keyframesStyleSheet();
    for (const name of Object.keys(ANIMATION_KEYFRAMES)) {
      expect(sheet).toContain(`@keyframes ${name}`);
    }
  });

  /* The presets the inspector offers and the keyframes shipped for them are
     two lists in two files. Anything offered with no keyframe animates
     nothing on the canvas AND nothing on the published site. */
  it("covers the animation names ElementOperations can write", () => {
    const names = Object.keys(ANIMATION_KEYFRAMES).map((k) => k.replace("bd-anim-", ""));
    expect(names).toContain("fadeIn");
    expect(names).toContain("zoomIn");
    expect(names.length).toBeGreaterThan(20);
  });
});
