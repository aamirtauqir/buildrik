/**
 * Aquibra Hero Section Block
 * @license BSD-3-Clause
 */

export const heroBlockConfig = {
  id: "hero",
  label: "Hero Section",
  category: "Sections",
  elementType: "hero" as const,
  icon: "🦸",
  content:
    '<section class="buildrick-hero-section" data-buildrick-type="hero">' +
    '<div class="buildrick-hero-content">' +
    "<h1>Welcome to Buildrick</h1>" +
    "<p>Build beautiful websites in minutes with our visual composer.</p>" +
    '<a href="#" class="buildrick-hero-button">Get Started</a>' +
    "</div>" +
    "</section>",
  attributes: {
    title: { type: "text", default: "Welcome to Buildrick" },
    subtitle: { type: "text", default: "Build beautiful websites" },
    buttonText: { type: "text", default: "Get Started" },
    buttonUrl: { type: "text", default: "#" },
    backgroundImage: { type: "image", default: "" },
    backgroundColor: { type: "color", default: "#0d0d1a" },
    textAlign: {
      type: "select",
      options: ["left", "center", "right"],
      default: "center",
    },
    height: { type: "text", default: "500px" },
  },
};

