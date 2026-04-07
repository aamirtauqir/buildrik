/**
 * Row Block - Horizontal container for columns
 * @license BSD-3-Clause
 */

import { buildSimpleElement } from "../builders";
import type { BlockBuildConfig } from "../types";

export const rowBlockConfig: BlockBuildConfig = {
  id: "row",
  label: "Row",
  category: "Basic",
  elementType: "columns",
  icon: "/src/assets/icons/blocks/basic/row.svg",
  content: '<div class="row"></div>',
  build: (composer, parentId, dropIndex) =>
    buildSimpleElement(composer, parentId, "columns", { classes: ["row"] }, dropIndex),
};
