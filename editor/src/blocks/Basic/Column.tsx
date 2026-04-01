/**
 * Column Block - Vertical container inside a row
 * @license BSD-3-Clause
 */

import { buildSimpleElement } from "../builders";
import type { BlockBuildConfig } from "../types";

export const columnBlockConfig: BlockBuildConfig = {
  id: "column",
  label: "Column",
  category: "Basic",
  elementType: "container",
  icon: "/src/assets/icons/blocks/basic/column.svg",
  content: '<div class="col"></div>',
  build: (composer, parentId, dropIndex) =>
    buildSimpleElement(composer, parentId, "container", { classes: ["col"] }, dropIndex),
};
