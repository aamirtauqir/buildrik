/**
 * LayersEmptyState — v3 board 4418:83911 (S·Layers · empty): the state glyph,
 * "Nothing here yet", "No layers yet. Add an element to start building this
 * page." The board draws no button — Add is the rail item beside the drawer.
 * @license BSD-3-Clause
 */

import * as React from "react";
import { LayersStateMessage } from "./LayersStateBlocks";

export const LayersEmptyState: React.FC = () => (
  <LayersStateMessage
    message="No layers yet. Add an element to start building this page."
    padTop="tw:pt-[30px]"
    testId="layers-empty"
  />
);

export default LayersEmptyState;
