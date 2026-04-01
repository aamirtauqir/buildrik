/**
 * Aquibra Trait Panel — L0 stub
 * Sub-modules (components, hooks, types) not yet migrated to canonical.
 * @license BSD-3-Clause
 */
import * as React from "react";

export interface TraitPanelProps {
  composer?: unknown;
  selectedElement?: unknown;
}

export interface Trait {
  id: string;
  type: string;
  value?: unknown;
}

export const TraitPanel: React.FC<TraitPanelProps> = () => null;

export default TraitPanel;
