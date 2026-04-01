/**
 * Section Block
 * @license BSD-3-Clause
 */

import { buildSectionWithContainer } from "../builders";
import type { BlockBuildConfig } from "../types";

export const sectionBlockConfig: BlockBuildConfig = {
  id: "section",
  label: "Section",
  category: "Layout",
  elementType: "section",
  content: '<section class="section"><div class="container"></div></section>',
  build: (composer, parentId, dropIndex) =>
    buildSectionWithContainer(
      composer,
      parentId,
      { classes: ["section"] },
      { classes: ["container"] },
      dropIndex
    ),
};
