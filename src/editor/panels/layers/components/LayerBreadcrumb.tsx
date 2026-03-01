/**
 * LayerBreadcrumb - Shows ancestor path when exactly 1 layer is selected.
 * Props-only, no hook imports.
 * @license BSD-3-Clause
 */
import * as React from "react";
import { getAncestors, getDisplayName, findById } from "../data/layerUtils";
import type { LayerItem } from "../types";

interface LayerBreadcrumbProps {
  selectedId: string;
  layers: LayerItem[];
  customNames: Map<string, string>;
  onSelect: (id: string, modifiers: { shift?: boolean; meta?: boolean }) => void;
}

export function LayerBreadcrumb({
  selectedId,
  layers,
  customNames,
  onSelect,
}: LayerBreadcrumbProps) {
  const ancestors = getAncestors(layers, selectedId);
  const selectedNode = findById(layers, selectedId);
  if (ancestors.length === 0) return null;

  return (
    <div className="aqb-layer-breadcrumb" role="navigation" aria-label="Layer ancestry">
      {ancestors.map((node, i) => (
        <React.Fragment key={node.id}>
          <button
            className="aqb-bc-crumb"
            onClick={() => onSelect(node.id, {})}
            title={`Select ${getDisplayName(node.id, node.type, customNames)}`}
          >
            {getDisplayName(node.id, node.type, customNames)}
          </button>
          {i < ancestors.length - 1 && (
            <span className="aqb-bc-sep" aria-hidden>
              /
            </span>
          )}
        </React.Fragment>
      ))}
      <span className="aqb-bc-sep" aria-hidden>
        /
      </span>
      <span className="aqb-bc-current">
        {getDisplayName(selectedId, selectedNode?.type ?? "element", customNames)}
      </span>
    </div>
  );
}
