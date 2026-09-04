/**
 * Aquibra Slider/Carousel Block
 * @license BSD-3-Clause
 */

export const sliderBlockConfig = {
  id: "slider",
  label: "Slider/Carousel",
  category: "Components",
  icon: "🎠",
  elementType: "slider" as const,
  content:
    '<div class="buildrick-slider" data-buildrick-type="slider">' +
    '<div class="buildrick-slide"><h3>Slide One</h3><p>Add your slide copy here.</p></div>' +
    '<div class="buildrick-slide"><h3>Slide Two</h3><p>Share another highlight.</p></div>' +
    "</div>",
};

