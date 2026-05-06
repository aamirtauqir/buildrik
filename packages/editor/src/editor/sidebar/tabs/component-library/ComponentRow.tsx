import { Button } from "@/editor/shared/vibcoder/Button";
/**
 * ComponentRow - Single component item in the component list
 * Handles drag, selection, context menu (insert/rename/duplicate/favorite/delete).
 * @license BSD-3-Clause
 */

import { MoreHorizontal, Plus, Copy, Trash2, RefreshCw, Star, Edit3 } from "lucide-react";
import * as React from "react";
import type { ComponentDefinition } from "../../../../shared/types/components";
import { ComponentIcon } from "./ComponentIcon";

export interface ComponentRowProps {
  component: ComponentDefinition;
  instanceCount: number;
  isSelected: boolean;
  openMenuId: string | null;
  isFavorite: (id: string) => boolean;
  hasVariants: (id: string) => boolean;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, component: ComponentDefinition) => void;
  onViewDetail: (component: ComponentDefinition) => void;
  onInstantiate: (id: string) => void;
  onSetOpenMenuId: (id: string | null) => void;
  onRename: (id: string) => void;
  onDuplicate: (id: string) => void;
  onSwapVariant: (id: string) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onDelete: (id: string) => void;
}

export const ComponentRow: React.FC<ComponentRowProps> = ({
  component,
  instanceCount,
  isSelected,
  openMenuId,
  isFavorite,
  hasVariants,
  onDragStart,
  onViewDetail,
  onInstantiate,
  onSetOpenMenuId,
  onRename,
  onDuplicate,
  onSwapVariant,
  onToggleFavorite,
  onDelete,
}) => (
  <div
    className={[
      "buildrick-component-row comp-row",
      isSelected && "selected comp-row--selected",
    ].filter(Boolean).join(" ")}
    draggable
    onDragStart={(e) => onDragStart(e, component)}
    onClick={() => onViewDetail(component)}
    onDoubleClick={() => onInstantiate(component.id)}
  >
    <div>
      <ComponentIcon />
    </div>
    <span style={{ flex: 1 }}>
      {component.name}
    </span>

    {instanceCount > 0 && (
      <span
        className="comp-count-badge"
        title={`${instanceCount} instance${instanceCount !== 1 ? "s" : ""} on canvas`}
      >
        {instanceCount}x
      </span>
    )}

    <Button
     
      onClick={(e) => {
        e.stopPropagation();
        onInstantiate(component.id);
      }}
      title={`Add ${component.name} to canvas`}
    >
      Add
    </Button>

    <div>
      <Button
       
        onClick={(e) => {
          e.stopPropagation();
          onSetOpenMenuId(openMenuId === component.id ? null : component.id);
        }}
        aria-label="Component options"
        title="More options"
      >
        <MoreHorizontal size={16} />
      </Button>

      {openMenuId === component.id && (
        <div onClick={(e) => e.stopPropagation()}>
          <Button onClick={() => onInstantiate(component.id)}>
            <Plus size={14} /> Insert
          </Button>
          <Button onClick={() => onRename(component.id)}>
            <Edit3 size={14} /> Rename
          </Button>
          <Button onClick={() => onDuplicate(component.id)}>
            <Copy size={14} /> Duplicate
          </Button>
          {hasVariants(component.id) && (
            <Button onClick={() => onSwapVariant(component.id)}>
              <RefreshCw size={14} /> Swap Variant
            </Button>
          )}
          <Button onClick={(e) => onToggleFavorite(component.id, e)}>
            <Star size={14} fill={isFavorite(component.id) ? "currentColor" : "none"} />
            {isFavorite(component.id) ? "Unfavorite" : "Favorite"}
          </Button>
          <Button onClick={() => onDelete(component.id)}>
            <Trash2 size={14} /> Delete
          </Button>
        </div>
      )}
    </div>
  </div>
);
