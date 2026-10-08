/**
 * Flex Container Block
 * @license BSD-3-Clause
 */

import { buildLayoutWithChildren, FLEX_ITEM_STYLES } from "../builders";
import type { BlockBuildConfig } from "../types";

export const flexBlockConfig: BlockBuildConfig = {
  id: "flex",
  label: "Flex Container",
  category: "Layout",
  elementType: "flex",
  content:
    '<div style="display:flex;gap:var(--buildrick-design-space-4);align-items:center"><div style="background:#e0e0e0;padding:var(--buildrick-design-space-5);border-radius:var(--buildrick-design-radius-md)">Flex Item 1</div><div style="background:#e0e0e0;padding:var(--buildrick-design-space-5);border-radius:var(--buildrick-design-radius-md)">Flex Item 2</div><div style="background:#e0e0e0;padding:var(--buildrick-design-space-5);border-radius:var(--buildrick-design-radius-md)">Flex Item 3</div></div>',
  build: (composer, parentId, dropIndex) =>
    buildLayoutWithChildren(
      composer,
      parentId,
      "flex",
      {
        styles: {
          display: "flex",
          gap: "var(--buildrick-design-space-4)",
          "align-items": "center",
        },
      },
      [
        { type: "container", options: { content: "Flex Item 1", styles: FLEX_ITEM_STYLES } },
        { type: "container", options: { content: "Flex Item 2", styles: FLEX_ITEM_STYLES } },
        { type: "container", options: { content: "Flex Item 3", styles: FLEX_ITEM_STYLES } },
      ],
      dropIndex
    ),
};
