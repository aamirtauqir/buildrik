import { describe, it, expect } from "vitest";
import { collectUsedKeyframes, ANIMATION_KEYFRAMES } from "../animationKeyframes";

describe("collectUsedKeyframes (export animation fix C1)", () => {
  it("emits the @keyframes block for an animation referenced in the CSS", () => {
    const css = ".el{animation: bd-anim-fadeIn 0.5s ease both}";
    const out = collectUsedKeyframes(css);
    expect(out).toContain("@keyframes bd-anim-fadeIn");
    expect(out).toContain("opacity:0");
  });

  it("emits nothing when no animation is referenced (no export bloat)", () => {
    expect(collectUsedKeyframes(".el{color:red}")).toBe("");
  });

  it("does not false-match a prefix (fadeIn must not pull fadeInUp and vice-versa)", () => {
    const out = collectUsedKeyframes(".el{animation-name: bd-anim-fadeInUp}");
    expect(out).toContain("@keyframes bd-anim-fadeInUp");
    // the shorter-prefix keyframe must NOT be included
    expect(out).not.toContain("@keyframes bd-anim-fadeIn{");
  });

  it("emits multiple distinct keyframes when several are used", () => {
    const css = "a{animation:bd-anim-pulse 1s} b{animation:bd-anim-shake 1s}";
    const out = collectUsedKeyframes(css);
    expect(out).toContain("@keyframes bd-anim-pulse");
    expect(out).toContain("@keyframes bd-anim-shake");
  });

  it("covers every AnimationEditor preset name", () => {
    // Guards against drift: each known preset has a keyframe entry.
    expect(Object.keys(ANIMATION_KEYFRAMES).length).toBeGreaterThanOrEqual(24);
    for (const name of Object.keys(ANIMATION_KEYFRAMES)) {
      expect(ANIMATION_KEYFRAMES[name]).toContain(`@keyframes ${name}`);
    }
  });
});
