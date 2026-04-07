/**
 * Stack Block
 * Vertical stacking container with configurable gap
 * @license BSD-3-Clause
 */

import type { BlockBuildConfig, Composer } from "../types";

/**
 * Build vertical stack container
 */
function buildStack(composer: Composer, parentId: string, dropIndex?: number): string | undefined {
  const stack = composer.elements.createElement("container", {
    tagName: "div",
    attributes: {
      class: "stack",
    },
    styles: {
      display: "flex",
      flexDirection: "column",
      gap: "16px",
      width: "100%",
      padding: "16px",
    },
  });

  composer.elements.addElement(stack, parentId, dropIndex);
  const stackId = stack.getId();

  // Add placeholder children
  for (let i = 1; i <= 3; i++) {
    const child = composer.elements.createElement("container", {
      tagName: "div",
      attributes: {
        class: "stack-item",
      },
      styles: {
        padding: "16px",
        background: "#f8fafc",
        borderRadius: "8px",
        border: "1px solid #e2e8f0",
      },
    });
    composer.elements.addElement(child, stackId);

    const text = composer.elements.createElement("paragraph", {
      tagName: "p",
      content: `Stack Item ${i}`,
      styles: {
        margin: "0",
        color: "#64748b",
      },
    });
    composer.elements.addElement(text, child.getId());
  }

  return stackId;
}

export const stackBlockConfig: BlockBuildConfig = {
  id: "stack",
  label: "Stack (Vertical)",
  category: "Components",
  elementType: "container",
  build: buildStack,
};
