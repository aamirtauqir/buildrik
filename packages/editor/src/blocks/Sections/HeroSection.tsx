/**
 * Aquibra Hero Section Block
 * @license BSD-3-Clause
 */

export const heroBlockConfig = {
  id: "hero",
  label: "Hero",
  description: "Full-width headline, subtitle and a button. Uses your Brand heading font and primary colour.",
  category: "Sections",
  elementType: "hero" as const,
  icon: "🦸",
  content:
    '<section class="buildrick-hero-section" data-buildrick-type="hero">' +
    '<div class="buildrick-hero-content">' +
    /* L1-031 (owner 2026-10-10): neutral placeholders — this is the
       customer's site, not Buildrick's marketing — and the call to action is a
       Button painted from Brand tokens (it was an unstyled text link). */
    "<h1>Your headline here</h1>" +
    "<p>Add a short introduction to your business or idea.</p>" +
    '<button style="padding:var(--buildrick-design-space-3) var(--buildrick-design-space-6);' +
    "background:var(--buildrick-design-color-primary);color:var(--buildrick-design-color-on-primary);" +
    "border:none;border-radius:var(--buildrick-design-radius-md);" +
    'font-size:var(--buildrick-design-font-size-base);font-weight:600;cursor:pointer">Get started</button>' +
    "</div>" +
    "</section>",
  attributes: {
    title: { type: "text", default: "Your headline here" },
    subtitle: { type: "text", default: "Add a short introduction to your business or idea." },
    buttonText: { type: "text", default: "Get started" },
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

