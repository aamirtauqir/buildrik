/**
 * Testimonials section block — board 4428:140817 ("Testimonials").
 * A section, distinct from the Testimonials component (id "testimonials").
 * @license BSD-3-Clause
 */
import type { BlockData, ElementType } from "../../shared/types";

export const testimonialsSectionBlockConfig: BlockData & { elementType: ElementType } = {
  id: "testimonials-section",
  label: "Testimonials",
  description: "Customer quotes with names, in a row of cards.",
  category: "Sections",
  elementType: "section",
  content:
    '<section style="padding:64px var(--buildrick-design-space-6)"><h2 style="margin:0 0 var(--buildrick-design-space-8);text-align:center">What people say</h2>' +
    '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:var(--buildrick-design-space-6);max-width:840px;margin:0 auto">' +
    '<blockquote style="margin:0"><p style="margin:0 0 var(--buildrick-design-space-3)">“The best evening we have had in months.”</p><cite>— Sara</cite></blockquote>' +
    '<blockquote style="margin:0"><p style="margin:0 0 var(--buildrick-design-space-3)">“Warm, quick and exactly what we ordered.”</p><cite>— Omar</cite></blockquote>' +
    "</div></section>",
};
