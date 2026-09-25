/**
 * Menu grid section block — board 4428:140817 ("Menu grid").
 * Neutral defaults: colours come from the page and the Brand tokens.
 * @license BSD-3-Clause
 */
import type { BlockData, ElementType } from "../../shared/types";

export const menuGridBlockConfig: BlockData & { elementType: ElementType } = {
  id: "menu-grid",
  label: "Menu grid",
  description: "A grid of dishes or products, each with an image, a name and a price.",
  category: "Sections",
  elementType: "section",
  content:
    '<section style="padding:64px 24px"><h2 style="margin:0 0 32px;text-align:center">Our menu</h2>' +
    '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;max-width:960px;margin:0 auto">' +
    '<div><h3 style="margin:0 0 8px">Margherita</h3><p style="margin:0">Tomato, mozzarella, basil</p></div>' +
    '<div><h3 style="margin:0 0 8px">Marinara</h3><p style="margin:0">Tomato, garlic, oregano</p></div>' +
    '<div><h3 style="margin:0 0 8px">Diavola</h3><p style="margin:0">Tomato, mozzarella, salami</p></div>' +
    "</div></section>",
};
