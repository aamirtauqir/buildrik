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
  flex: "Flex",
  icon: "Icon",
  divider: "Divider",
  list: "List",
};
