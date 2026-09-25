/**
 * SSOT for element type → display label mapping.
 * Used by LayerTreeItem and layerUtils to show friendly names in the Layers panel.
 * @license BSD-3-Clause
 */

export const ELEMENT_TYPE_LABELS: Record<string, string> = {
  // HTML heading tags
  h1: "Heading 1",
  h2: "Heading 2",
  h3: "Heading 3",
  h4: "Heading 4",
  h5: "Heading 5",
  h6: "Heading 6",
  // HTML block elements
  p: "Paragraph",
  div: "Container",
  span: "Text",
  section: "Section",
  nav: "Navigation",
  header: "Header",
  footer: "Footer",
  main: "Main",
  article: "Article",
  aside: "Sidebar",
  // HTML inline / media
  a: "Link",
  img: "Image",
  video: "Video",
  // HTML form elements
  button: "Button",
  input: "Input",
  textarea: "Textarea",
  select: "Select",
  form: "Form",
  // HTML list elements
  ul: "List",
  ol: "Ordered List",
  li: "List Item",
  // Semantic type aliases used by the engine
  heading: "Heading",
  paragraph: "Paragraph",
  container: "Container",
  text: "Text",
  image: "Image",
  link: "Link",
  navbar: "Navbar",
  hero: "Hero",
  features: "Features",
  grid: "Grid",
  "collection-list": "Collection list",
  flex: "Flex",
  icon: "Icon",
  divider: "Divider",
  list: "List",
};

/** The display label for an element type: the SSOT entry, else the type
 *  capitalised (`section` → `Section`). */
export const elementTypeLabel = (type: string): string =>
  ELEMENT_TYPE_LABELS[type] ?? (type ? type.charAt(0).toUpperCase() + type.slice(1) : type);

/** The element-data key that holds a layer's custom name. */
export const LAYER_NAME_KEY = "layerName";

/**
 * A duplicate's layer name (board 5940:147595: "Hero" → "Hero 2"): the base
 * name without a trailing number, then one past the highest number any of
 * `siblingNames` already carries for that base (a bare base counts as 1).
 */
export function nextCopyName(name: string, siblingNames: readonly string[]): string {
  const base = name.replace(/ \d+$/, "");
  let max = 1;
  for (const n of siblingNames) {
    if (n === base) continue;
    const m = n.startsWith(`${base} `) ? /^(\d+)$/.exec(n.slice(base.length + 1)) : null;
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `${base} ${max + 1}`;
}
