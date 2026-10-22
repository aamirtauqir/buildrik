/**
 * The interaction "Preview" plays the animation on the canvas element with the
 * same keyframes and easings the published runtime uses (BD-34 / FLOW-SENSE
 * FS-07). It used to set a CSS `animation` shorthand with the GSAP easing name
 * (`power2.out`), which is not valid CSS, so nothing played.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { BEHAVIOUR_SECTIONS } from "../behaviour";
import { INTERACTION_EASINGS, INTERACTION_PRESET_KEYFRAMES } from "@/engine/export/interactionRuntime";
import type { SectionContext } from "../_shared";

afterEach(() => {
  document.body.innerHTML = "";
});

describe("interaction Preview", () => {
  it("plays the runtime's keyframes and easing on the canvas element", () => {
    const node = document.createElement("div");
    node.setAttribute("data-buildrick-id", "el-1");
    const animate = vi.fn();
    (node as unknown as { animate: typeof animate }).animate = animate;
    document.body.appendChild(node);

    const ctx = { composer: null, styles: {}, selectedElement: { id: "el-1", type: "heading" } } as unknown as SectionContext;
    const { props } = BEHAVIOUR_SECTIONS.interactions.render(ctx) as { props: { onPreview: (i: unknown) => void } };
    props.onPreview({
      id: "i1",
      trigger: "click",
      enabled: true,
      animation: { preset: "slideUp", duration: 400, delay: 50, easing: "power2.out" },
    });

    expect(animate).toHaveBeenCalledWith(INTERACTION_PRESET_KEYFRAMES.slideUp, {
      duration: 400,
      delay: 50,
      easing: INTERACTION_EASINGS["power2.out"],
      iterations: 1,
    });
  });
});
