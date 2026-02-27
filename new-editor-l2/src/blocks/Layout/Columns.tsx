/**
 * Columns Block
 * @license BSD-3-Clause
 */

import { buildColumns } from "../builders";
import type { BlockBuildConfig } from "../types";

export const columns2BlockConfig: BlockBuildConfig = {
  id: "columns",
  label: "2 Columns",
  category: "Layout",
  elementType: "columns",
  content: '<div class="row"><div class="col">Column 1</div><div class="col">Column 2</div></div>',
  build: (composer, parentId, dropIndex) =>
    buildColumns(composer, parentId, 2, "Column", dropIndex),
};

export const columns3BlockConfig: BlockBuildConfig = {
  id: "columns3",
  label: "3 Columns",
  category: "Layout",
  elementType: "columns",
  content:
    '<div class="row"><div class="col">Col 1</div><div class="col">Col 2</div><div class="col">Col 3</div></div>',
  build: (composer, parentId, dropIndex) => buildColumns(composer, parentId, 3, "Col", dropIndex),
};
