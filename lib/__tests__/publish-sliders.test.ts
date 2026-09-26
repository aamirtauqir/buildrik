/**
 * The Slider/Carousel block exported as stacked slides with no behaviour
 * (missing-features.md, Inspector 4428:142450) — this closes it by injecting
 * a runtime script + CSS into any published page that has one.
 */
import { describe, it, expect } from "vitest";
import { wireSliders } from "../publish-sliders";

const PAGE_WITH_SLIDER = `<html><body>
<div class="buildrick-slider" data-autoplay="true" data-interval="4">
  <div class="buildrick-slide"><h3>One</h3></div>
  <div class="buildrick-slide"><h3>Two</h3></div>
</div>
</body></html>`;

describe("wireSliders", () => {
  it("leaves a page with no slider untouched", () => {
    const page = "<html><body><p>hi</p></body></html>";
    expect(wireSliders(page)).toBe(page);
  });

  it("injects the runtime script and CSS once, before </body>", () => {
    const out = wireSliders(PAGE_WITH_SLIDER);
    expect(out).toContain('<style data-buildrick-slider-runtime>');
    expect(out).toContain('<script data-buildrick-slider-runtime>');
    expect(out.indexOf("</script>")).toBeLessThan(out.indexOf("</body>"));
  });

  it("is idempotent — running it twice doesn't double-inject", () => {
    const once = wireSliders(PAGE_WITH_SLIDER);
    const twice = wireSliders(once);
    expect(twice).toBe(once);
    expect(once.match(/data-buildrick-slider-runtime/g)).toHaveLength(2);
  });

  it("appends at the end when there is no </body>", () => {
    const noBody = '<div class="buildrick-slider"><div class="buildrick-slide"></div><div class="buildrick-slide"></div></div>';
    const out = wireSliders(noBody);
    expect(out.startsWith(noBody)).toBe(true);
    expect(out).toContain("data-buildrick-slider-runtime");
  });

  // Parity: the injected <script> is `initSliderRuntime` serialized via
  // `Function.prototype.toString()` (imported from @buildrik/editor, not
  // hand-copied — see publish-sliders.ts's header). Run the ACTUAL injected
  // script body against a real DOM to prove the serialize step didn't lose
  // or mangle behaviour, rather than trusting that importing the same
  // function is equivalent to running it.
  it("the injected script, executed for real, behaves like initSliderRuntime itself", () => {
    const sliderHtml =
      '<div class="buildrick-slider" data-buildrick-id="s1"><div class="buildrick-slide">One</div><div class="buildrick-slide">Two</div></div>';
    const out = wireSliders(sliderHtml);
    const script = /<script data-buildrick-slider-runtime>([\s\S]*?)<\/script>/.exec(out)?.[1];
    expect(script).toBeTruthy();

    document.body.innerHTML = sliderHtml;
    // eslint-disable-next-line no-new-func
    new Function(script!)();

    const slider = document.querySelector(".buildrick-slider")!;
    expect(slider.querySelectorAll(".buildrick-slider-arrow")).toHaveLength(2);
    expect(slider.querySelectorAll(".buildrick-slider-dot")).toHaveLength(2);
    const next = slider.querySelector<HTMLButtonElement>(".buildrick-slider-next")!;
    next.click();
    const slides = slider.querySelectorAll<HTMLElement>(".buildrick-slide");
    expect(slides[0].style.display).toBe("none");
    expect(slides[1].style.display).toBe("");
  });
});
