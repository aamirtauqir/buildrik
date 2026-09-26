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
});
