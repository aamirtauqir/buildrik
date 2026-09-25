/**
 * Contact section block — board 4428:140817 ("Contact").
 * @license BSD-3-Clause
 */
import type { BlockData, ElementType } from "../../shared/types";

export const contactBlockConfig: BlockData & { elementType: ElementType } = {
  id: "contact",
  label: "Contact",
  description: "Contact details and a short message form, side by side.",
  category: "Sections",
  elementType: "section",
  content:
    '<section style="padding:64px 24px"><div style="display:grid;grid-template-columns:1fr 1fr;gap:32px;max-width:960px;margin:0 auto">' +
    '<div><h2 style="margin:0 0 12px">Get in touch</h2><p style="margin:0 0 8px">12 Harbour Street</p><p style="margin:0">hello@example.com</p></div>' +
    '<div style="min-height:160px;border:1px solid currentColor;opacity:0.2;border-radius:8px"></div>' +
    "</div></section>",
};
