/**
 * Form Block
 * @license BSD-3-Clause
 */

import type { BlockData, ElementType } from "@/shared/types";

export interface FormBlockConfig extends BlockData {
  elementType: ElementType;
}

/** A label stacked over its control, in the site's type and spacing tokens. */
const FIELD_LABEL =
  "display:flex;flex-direction:column;gap:var(--buildrick-design-space-1);font-size:var(--buildrick-design-font-size-sm);font-weight:500";

export const formBlockConfig: FormBlockConfig = {
  id: "form",
  label: "Form",
  category: "Forms",
  elementType: "form",
  /* BD-39 (7): each field sits inside a visible label (implicit association —
     no ids, so two Form blocks on one page cannot collide on for/id). The
     placeholder is an example, not the name: it vanishes on typing. */
  content:
    `<form><label style="${FIELD_LABEL}">Name<input type="text" name="fullname" placeholder="Jane Doe" autocomplete="name"/></label>` +
    `<label style="${FIELD_LABEL}">Email<input type="email" name="email" placeholder="jane@example.com" autocomplete="email"/></label>` +
    '<button type="submit">Submit</button></form>',
};
