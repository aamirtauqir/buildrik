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
    '<div style="display:flex;gap:16px;align-items:center"><div style="background:#e0e0e0;padding:20px;border-radius:8px">Flex Item 1</div><div style="background:#e0e0e0;padding:20px;border-radius:8px">Flex Item 2</div><div style="background:#e0e0e0;padding:20px;border-radius:8px">Flex Item 3</div></div>',
  build: (composer, parentId, dropIndex) =>
    buildLayoutWithChildren(
      composer,
      parentId,
      "flex",
      {
        styles: {
          display: "flex",
          gap: "16px",
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
