/**
 * LayersEmptyState — v3 board 4418:83911 (S·Layers · empty): the state glyph,
 * "No layers yet", "Add an element to start building this page." (L2-031,
 * owner 2026-10-10: the empty tree and a failed search no longer share a
 * heading). The board draws no button — Add is the rail item beside the drawer.
 * @license BSD-3-Clause
 */

import * as React from "react";
import { PanelStateMessage } from "@/editor/shared/PanelStates";

export const LayersEmptyState: React.FC = () => (
  <PanelStateMessage
    title="No layers yet"
    message="Add an element to start building this page."
    padTop="tw:pt-[30px]"
    testId="layers-empty"
  />
);

export default LayersEmptyState;
