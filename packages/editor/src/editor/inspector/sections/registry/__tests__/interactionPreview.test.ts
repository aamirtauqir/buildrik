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
    /* The entry renders the section inside its SectionErrorBoundary (2L9 B4-S05). */
    const boundary = BEHAVIOUR_SECTIONS.interactions.render(ctx) as {
      props: { children: { props: { onPreview: (i: unknown) => void } } };
    };
    boundary.props.children.props.onPreview({
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

  it("Stop cancels the preview run and leaves the element's own animation alone", () => {
    const node = document.createElement("div");
    node.setAttribute("data-buildrick-id", "el-2");
    node.style.animation = "spin 1s infinite";
    const cancel = vi.fn();
    (node as unknown as { animate: () => { cancel: typeof cancel } }).animate = () => ({ cancel });
    document.body.appendChild(node);

    const ctx = { composer: null, styles: {}, selectedElement: { id: "el-2", type: "heading" } } as unknown as SectionContext;
    const boundary = BEHAVIOUR_SECTIONS.interactions.render(ctx) as {
      props: { children: { props: { onPreview: (i: unknown) => void; onStopPreview: () => void } } };
    };
    const { onPreview, onStopPreview } = boundary.props.children.props;
    onPreview({ id: "i1", trigger: "click", enabled: true, animation: { preset: "fadeIn", duration: 300, delay: 0, easing: "ease" } });
    onStopPreview();

    expect(cancel).toHaveBeenCalledTimes(1);
    expect(node.style.animation).toBe("spin 1s infinite");
  });
});
