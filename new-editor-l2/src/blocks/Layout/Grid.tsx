/**
 * Grid Block
 * @license BSD-3-Clause
 */

import { buildLayoutWithChildren, GRID_ITEM_STYLES } from "../builders";
import type { BlockBuildConfig } from "../types";

export const gridBlockConfig: BlockBuildConfig = {
  id: "grid",
  label: "Grid",
  category: "Layout",
  elementType: "grid",
  content:
    '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px"><div style="background:#f0f0f0;padding:20px;border-radius:8px">Grid Item 1</div><div style="background:#f0f0f0;padding:20px;border-radius:8px">Grid Item 2</div><div style="background:#f0f0f0;padding:20px;border-radius:8px">Grid Item 3</div></div>',
  build: (composer, parentId, dropIndex) =>
    buildLayoutWithChildren(
      composer,
      parentId,
      "grid",
      {
        styles: {
          display: "grid",
          "grid-template-columns": "repeat(3, 1fr)",
          gap: "16px",
        },
      },
      [
        { type: "container", options: { content: "Grid Item 1", styles: GRID_ITEM_STYLES } },
        { type: "container", options: { content: "Grid Item 2", styles: GRID_ITEM_STYLES } },
        { type: "container", options: { content: "Grid Item 3", styles: GRID_ITEM_STYLES } },
      ],
      dropIndex
    ),
};
