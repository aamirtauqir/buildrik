/**
 * HTML Diffing
 * Functions for comparing HTML structures
 *
 * @module utils/html/diffing
 * @license BSD-3-Clause
 */

import { parseHTML, type ParsedNode } from "./parsing";

// =============================================================================
// DIFF TYPES
// =============================================================================

/**
 * Diff operation type
 */
export type DiffType = "add" | "remove" | "change" | "move";

/**
 * HTML diff result
 */
export interface HTMLDiff {
  type: DiffType;
  path: string;
  oldValue?: string;
  newValue?: string;
}

// =============================================================================
// DIFFING FUNCTIONS
// =============================================================================

/**
 * Compare two HTML strings and return differences
 */
export function diffHTML(oldHTML: string, newHTML: string): HTMLDiff[] {
  const diffs: HTMLDiff[] = [];

  const oldNodes = parseHTML(oldHTML);
  const newNodes = parseHTML(newHTML);

  compareParsedNodes(oldNodes, newNodes, "", diffs);

  return diffs;
}

/**
 * Compare parsed nodes recursively
 */
function compareParsedNodes(
  oldNodes: ParsedNode[],
  newNodes: ParsedNode[],
  path: string,
  diffs: HTMLDiff[]
): void {
  const maxLen = Math.max(oldNodes.length, newNodes.length);

  for (let i = 0; i < maxLen; i++) {
    const currentPath = path ? `${path}[${i}]` : `[${i}]`;
    const oldNode = oldNodes[i];
    const newNode = newNodes[i];

    if (!oldNode && newNode) {
      diffs.push({
        type: "add",
        path: currentPath,
        newValue: nodeToString(newNode),
      });
    } else if (oldNode && !newNode) {
      diffs.push({
        type: "remove",
        path: currentPath,
        oldValue: nodeToString(oldNode),
      });
    } else if (oldNode && newNode) {
      // Compare type
      if (oldNode.type !== newNode.type) {
        diffs.push({
          type: "change",
          path: `${currentPath}.type`,
          oldValue: oldNode.type,
          newValue: newNode.type,
        });
      }

      // Compare tag
      if (oldNode.tag !== newNode.tag) {
        diffs.push({
          type: "change",
          path: `${currentPath}.tag`,
          oldValue: oldNode.tag,
          newValue: newNode.tag,
        });
      }

      // Compare content
      if (oldNode.content !== newNode.content) {
        diffs.push({
          type: "change",
          path: `${currentPath}.content`,
          oldValue: oldNode.content,
          newValue: newNode.content,
        });
      }

      // Compare attributes
      if (oldNode.attrs || newNode.attrs) {
        const allAttrs = new Set([
          ...Object.keys(oldNode.attrs || {}),
          ...Object.keys(newNode.attrs || {}),
        ]);

        for (const attr of allAttrs) {
          const oldVal = oldNode.attrs?.[attr];
          const newVal = newNode.attrs?.[attr];

          if (oldVal !== newVal) {
            diffs.push({
              type: oldVal === undefined ? "add" : newVal === undefined ? "remove" : "change",
              path: `${currentPath}.attrs.${attr}`,
              oldValue: oldVal,
              newValue: newVal,
            });
          }
        }
      }

      // Compare children
      if (oldNode.children || newNode.children) {
        compareParsedNodes(
          oldNode.children || [],
          newNode.children || [],
          `${currentPath}.children`,
          diffs
        );
      }
    }
  }
}

/**
 * Convert parsed node to string representation
 */
function nodeToString(node: ParsedNode): string {
  if (node.type === "text") {
    return node.content || "";
  }
  if (node.type === "comment") {
    return `<!--${node.content}-->`;
  }
  return `<${node.tag}>`;
}
