/**
 * Container Block
 * @license BSD-3-Clause
 */

import { buildSimpleElement } from "../builders";
import type { BlockBuildConfig } from "../types";

export const containerBlockConfig: BlockBuildConfig = {
  id: "container",
  label: "Container",
  category: "Basic",
  elementType: "container",
  icon: "/src/assets/icons/blocks/basic/container.svg",
  content: '<div class="container"></div>',
  build: (composer, parentId, dropIndex) =>
    buildSimpleElement(composer, parentId, "container", { classes: ["container"] }, dropIndex),
};
