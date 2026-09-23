/**
 * Testimonials section block — board 4428:140817 ("Testimonials").
 * A section, distinct from the Testimonials component (id "testimonials").
 * @license BSD-3-Clause
 */
import type { BlockData, ElementType } from "../../shared/types";

export const testimonialsSectionBlockConfig: BlockData & { elementType: ElementType } = {
  id: "testimonials-section",
  label: "Testimonials",
  category: "Sections",
  elementType: "section",
  content:
    '<section style="padding:64px 24px"><h2 style="margin:0 0 32px;text-align:center">What people say</h2>' +
    '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:24px;max-width:840px;margin:0 auto">' +
    '<blockquote style="margin:0"><p style="margin:0 0 12px">“The best evening we have had in months.”</p><cite>— Sara</cite></blockquote>' +
    '<blockquote style="margin:0"><p style="margin:0 0 12px">“Warm, quick and exactly what we ordered.”</p><cite>— Omar</cite></blockquote>' +
    "</div></section>",
};
