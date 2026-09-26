/**
 * The Slider block exported as stacked slides with no behaviour — this is
 * the runtime that fixes it, shared between the canvas
 * (`useSliderRuntime.ts`) and the published page (`lib/publish-sliders.ts`,
 * which imports this same function and serializes it via
 * `Function.prototype.toString()` — no longer a hand copy, see its header).
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { initSliderRuntime } from "../sliderRuntime";

function buildSlider(attrs: Record<string, string> = {}) {
  document.body.innerHTML = "";
  const slider = document.createElement("div");
  slider.className = "buildrick-slider";
  for (const [k, v] of Object.entries(attrs)) slider.setAttribute(k, v);
  for (let i = 0; i < 2; i++) {
    const slide = document.createElement("div");
    slide.className = "buildrick-slide";
    slide.textContent = `Slide ${i}`;
    slider.appendChild(slide);
  }
  document.body.appendChild(slider);
  return slider;
}

afterEach(() => {
  vi.useRealTimers();
});

describe("initSliderRuntime", () => {
  it("shows only the first slide and adds arrows + dots by default", () => {
    const slider = buildSlider();
    initSliderRuntime(document);
    const slides = slider.querySelectorAll(".buildrick-slide");
    expect((slides[0] as HTMLElement).style.display).toBe("");
    expect((slides[1] as HTMLElement).style.display).toBe("none");
    expect(slider.querySelectorAll(".buildrick-slider-arrow")).toHaveLength(2);
    expect(slider.querySelectorAll(".buildrick-slider-dot")).toHaveLength(2);
  });

  it("omits arrows/dots when data-arrows / data-dots are false", () => {
    const slider = buildSlider({ "data-arrows": "false", "data-dots": "false" });
    initSliderRuntime(document);
    expect(slider.querySelectorAll(".buildrick-slider-arrow")).toHaveLength(0);
    expect(slider.querySelectorAll(".buildrick-slider-dot")).toHaveLength(0);
  });

  it("the next arrow advances to the second slide", () => {
    const slider = buildSlider();
    initSliderRuntime(document);
    const next = slider.querySelector<HTMLButtonElement>(".buildrick-slider-next")!;
    next.click();
    const slides = slider.querySelectorAll(".buildrick-slide");
    expect((slides[0] as HTMLElement).style.display).toBe("none");
    expect((slides[1] as HTMLElement).style.display).toBe("");
  });

  it("autoplay advances slides on the configured interval", () => {
    vi.useFakeTimers();
    const slider = buildSlider({ "data-autoplay": "true", "data-interval": "3" });
    initSliderRuntime(document);
    const slides = slider.querySelectorAll(".buildrick-slide");
    expect((slides[0] as HTMLElement).style.display).toBe("");
    vi.advanceTimersByTime(3000);
    expect((slides[1] as HTMLElement).style.display).toBe("");
  });

  it("does not autoplay when prefers-reduced-motion is set", () => {
    vi.useFakeTimers();
    const original = window.matchMedia;
    window.matchMedia = vi.fn().mockReturnValue({ matches: true }) as unknown as typeof window.matchMedia;
    const slider = buildSlider({ "data-autoplay": "true", "data-interval": "1" });
    initSliderRuntime(document);
    vi.advanceTimersByTime(5000);
    const slides = slider.querySelectorAll(".buildrick-slide");
    expect((slides[0] as HTMLElement).style.display).toBe("");
    window.matchMedia = original;
  });

  it("is idempotent — a second call on the same slider doesn't add a second set of controls", () => {
    const slider = buildSlider();
    initSliderRuntime(document);
    initSliderRuntime(document);
    expect(slider.querySelectorAll(".buildrick-slider-arrow")).toHaveLength(2);
  });

  it("skips a slider with fewer than two slides", () => {
    document.body.innerHTML = '<div class="buildrick-slider"><div class="buildrick-slide"></div></div>';
    initSliderRuntime(document);
    expect(document.querySelector(".buildrick-slider-arrow")).toBeNull();
  });

  it("opts.autoplay overrides data-autoplay (the canvas forces it off)", () => {
    vi.useFakeTimers();
    const slider = buildSlider({ "data-autoplay": "true", "data-interval": "1" });
    initSliderRuntime(document, { autoplay: false });
    vi.advanceTimersByTime(5000);
    const slides = slider.querySelectorAll(".buildrick-slide");
    expect((slides[0] as HTMLElement).style.display).toBe("");
  });

  it("opens on getInitialIndex's slide, keyed by data-buildrick-id", () => {
    const slider = buildSlider({ "data-buildrick-id": "s1" });
    initSliderRuntime(document, { getInitialIndex: (key) => (key === "s1" ? 1 : undefined) });
    const slides = slider.querySelectorAll(".buildrick-slide");
    expect((slides[0] as HTMLElement).style.display).toBe("none");
    expect((slides[1] as HTMLElement).style.display).toBe("");
  });

  it("calls onIndexChange as the shown slide changes", () => {
    const slider = buildSlider({ "data-buildrick-id": "s1" });
    const seen: Array<[string, number]> = [];
    initSliderRuntime(document, { onIndexChange: (key, i) => seen.push([key, i]) });
    slider.querySelector<HTMLButtonElement>(".buildrick-slider-next")!.click();
    expect(seen).toEqual([["s1", 0], ["s1", 1]]);
  });

  it("an arrow/dot click stops propagation, so it doesn't also select the slider in the canvas", () => {
    const slider = buildSlider();
    initSliderRuntime(document);
    const parentHandler = vi.fn();
    slider.parentElement!.addEventListener("click", parentHandler);
    slider.querySelector<HTMLButtonElement>(".buildrick-slider-next")!.click();
    expect(parentHandler).not.toHaveBeenCalled();
  });

  it("cleanup removes the injected arrows/dots and the init marker", () => {
    const slider = buildSlider();
    const cleanup = initSliderRuntime(document);
    expect(slider.querySelectorAll(".buildrick-slider-arrow, .buildrick-slider-dots")).toHaveLength(3);
    cleanup();
    expect(slider.querySelectorAll(".buildrick-slider-arrow, .buildrick-slider-dots")).toHaveLength(0);
    expect(slider.getAttribute("data-bk-slider-init")).toBeNull();
  });
});
