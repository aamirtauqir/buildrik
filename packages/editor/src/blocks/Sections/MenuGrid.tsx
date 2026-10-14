/**
 * Menu grid section block — board 4428:140817 ("Menu grid").
 * Neutral defaults: colours come from the page and the Brand tokens.
 * @license BSD-3-Clause
 */
import type { BlockData, ElementType } from "@/shared/types";

export const menuGridBlockConfig: BlockData & { elementType: ElementType } = {
  id: "menu-grid",
  label: "Menu grid",
  description: "A grid of dishes or products, each with an image, a name and a price.",
  category: "Sections",
  elementType: "section",
  content:
    '<section style="padding:64px var(--buildrick-design-space-6)"><h2 style="margin:0 0 var(--buildrick-design-space-8);text-align:center">Our menu</h2>' +
    '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:var(--buildrick-design-space-6);max-width:960px;margin:0 auto">' +
    '<div><h3 style="margin:0 0 var(--buildrick-design-space-2)">Margherita</h3><p style="margin:0">Tomato, mozzarella, basil</p></div>' +
    '<div><h3 style="margin:0 0 var(--buildrick-design-space-2)">Marinara</h3><p style="margin:0">Tomato, garlic, oregano</p></div>' +
    '<div><h3 style="margin:0 0 var(--buildrick-design-space-2)">Diavola</h3><p style="margin:0">Tomato, mozzarella, salami</p></div>' +
    "</div></section>",
};
