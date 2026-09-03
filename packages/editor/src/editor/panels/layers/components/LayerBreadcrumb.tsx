/**
 * LayerBreadcrumb - Shows ancestor path when exactly 1 layer is selected.
 * Props-only, no hook imports.
 * @license BSD-3-Clause
 */
import * as React from "react";
import { getAncestors, getDisplayName, findById } from "../data/layerUtils";
import type { LayerItem } from "../types";
import { Button } from "@/editor/chrome-ui";

interface LayerBreadcrumbProps {
  /** `null` when the selection is empty or multiple. The slot still renders, so
   *  the tree below it never moves. */
  selectedId: string | null;
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
  const ancestors = selectedId === null ? [] : getAncestors(layers, selectedId);
  const selectedNode = selectedId === null ? undefined : findById(layers, selectedId);
  /* Empty slot, not `return null`: a top-level row has no ancestors and used to
     unmount the crumb, which is the same reflow by another route. */
  if (selectedId === null || ancestors.length === 0) {
    return <div className="bdc-layers-crumb" aria-hidden="true" />;
  }

  return (
    <div className="bdc-layers-crumb" role="navigation" aria-label="Layer ancestry">
      {ancestors.map((node, i) => (
        <React.Fragment key={node.id}>
          <Button
            className="bdc-layers-crumb-btn"
            onClick={() => onSelect(node.id, {})}
            title={`Select ${getDisplayName(node.id, node.type, customNames)}`}
          >
            {getDisplayName(node.id, node.type, customNames)}
          </Button>
          {i < ancestors.length - 1 && (
            <span className="bdc-layers-crumb-sep" aria-hidden>
              /
            </span>
          )}
        </React.Fragment>
      ))}
      <span className="bdc-layers-crumb-sep" aria-hidden>
        /
      </span>
      <span className="bdc-layers-crumb-btn bdc-on">
        {getDisplayName(selectedId, selectedNode?.type ?? "element", customNames)}
      </span>
    </div>
  );
}
