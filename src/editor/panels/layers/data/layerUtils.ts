// PURE FUNCTIONS ONLY — no React, no side effects, no imports from React
import type { LayerItem } from "../types";

/**
 * Flatten tree in depth-first order (all nodes, regardless of expand state).
 * Used for keyboard navigation range-select and search ancestor collection.
 */
export function flattenTree(nodes: LayerItem[]): LayerItem[] {
  const result: LayerItem[] = [];
  function walk(items: LayerItem[]): void {
    for (const node of items) {
      result.push(node);
      if (node.children.length > 0) walk(node.children);
    }
  }
  walk(nodes);
  return result;
}

/**
 * Find a node by ID anywhere in the tree. Returns null if not found.
 */
export function findById(nodes: LayerItem[], id: string): LayerItem | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findById(node.children, id);
    if (found) return found;
  }
  return null;
}

/**
 * Return all ancestors of targetId, from root to direct parent (excludes self).
 * Returns [] if targetId is root or not found.
 */
export function getAncestors(nodes: LayerItem[], targetId: string): LayerItem[] {
  function walk(items: LayerItem[], path: LayerItem[]): LayerItem[] | null {
    for (const node of items) {
      const newPath = [...path, node];
      if (node.id === targetId) return path; // exclude self
      const found = walk(node.children, newPath);
      if (found !== null) return found;
    }
    return null;
  }
  return walk(nodes, []) ?? [];
}

/**
 * Count all descendants (children, grandchildren, etc.) of a node.
 * Used for delete confirmation dialog.
 */
export function countDescendants(node: LayerItem): number {
  if (node.children.length === 0) return 0;
  return node.children.reduce((acc, child) => acc + 1 + countDescendants(child), 0);
}

const ELEMENT_TYPE_LABELS: Record<string, string> = {
  container: "Container",
  section: "Section",
  text: "Text",
  paragraph: "Paragraph",
  heading: "Heading",
  image: "Image",
  video: "Video",
  button: "Button",
  form: "Form",
  input: "Input",
  nav: "Navigation",
  navbar: "Navbar",
  list: "List",
  icon: "Icon",
  divider: "Divider",
  grid: "Grid",
  flex: "Flex",
  hero: "Hero",
  footer: "Footer",
  features: "Features",
  link: "Link",
};

/**
 * Resolve the display name for a layer row.
 * Priority: custom name from Map > semantic type label > raw type string.
 */
export function getDisplayName(id: string, type: string, customNames: Map<string, string>): string {
  const custom = customNames.get(id);
  if (custom) return custom;
  return ELEMENT_TYPE_LABELS[type] ?? type.charAt(0).toUpperCase() + type.slice(1);
}
