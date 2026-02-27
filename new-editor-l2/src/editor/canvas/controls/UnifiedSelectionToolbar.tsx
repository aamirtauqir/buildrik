/**
 * UnifiedSelectionToolbar — orchestrator
 * Compact toolbar at top of selected element.
 * State + action handlers live here; JSX sections are delegated to sub-components.
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine";
import { Z_LAYERS } from "../../../shared/constants/canvas";
import { useToast } from "../../../shared/ui/Toast";
import { getElementNameFromType } from "../utils/elementInfo";
import { BlockPickerModal } from "./BlockPickerModal";
import { ToolbarActionsSection } from "./toolbar/ToolbarActionsSection";
import { ToolbarNavSection } from "./toolbar/ToolbarNavSection";
import { toolbarStyles, formatElementName } from "./toolbar/toolbarStyles";

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

export interface UnifiedSelectionToolbarProps {
  /** Composer instance — used for element data and fallback actions */
  composer: Composer;
  /** ID of the selected element */
  elementId: string;
  /** Reference to canvas container */
  canvasRef: React.RefObject<HTMLDivElement>;

  // Action callbacks (Clean Layer Architecture).
  // When provided, these override direct composer access.
  onSelectParent?: () => void;
  onSelectAncestor?: (id: string) => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onCopy?: () => void;
  onWrap?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onUndo?: () => void;
}

interface ToolbarPosition {
  left: number;
  top: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export const UnifiedSelectionToolbar: React.FC<UnifiedSelectionToolbarProps> = ({
  composer,
  elementId,
  canvasRef,
  onSelectParent,
  onSelectAncestor,
  onDuplicate,
  onDelete,
  onCopy,
  onWrap,
  onMoveUp,
  onMoveDown,
  onUndo,
}) => {
  const [position, setPosition] = React.useState<ToolbarPosition | null>(null);
  const [showAncestorMenu, setShowAncestorMenu] = React.useState(false);
  const [showMoreMenu, setShowMoreMenu] = React.useState(false);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const ancestorMenuRef = React.useRef<HTMLDivElement>(null);
  const moreMenuRef = React.useRef<HTMLDivElement>(null);
  const toolbarRef = React.useRef<HTMLDivElement>(null);
  const { addToast } = useToast();

  // ── Element info ────────────────────────────────────────────────────────────
  const element = composer.elements.getElement(elementId);
  const elementType = element?.getType?.() || "element";
  const elementName = formatElementName(elementType);
  const parent = element?.getParent?.();
  const hasParent = !!parent;

  const ancestors = React.useMemo(() => {
    const chain: Array<{ id: string; name: string }> = [];
    let current = element?.getParent?.();
    while (current) {
      chain.push({
        id: current.getId(),
        name: formatElementName(current.getType?.() || "element"),
      });
      current = current.getParent?.();
    }
    return chain;
  }, [element]);

  // ── Track element position ──────────────────────────────────────────────────
  React.useEffect(() => {
    if (!canvasRef.current) return;

    const updatePosition = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const el = canvas.querySelector(`[data-aqb-id="${elementId}"]`) as HTMLElement;
      if (!el) return;

      const canvasRect = canvas.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const scrollLeft = canvas.scrollLeft || 0;
      const scrollTop = canvas.scrollTop || 0;

      let top = elRect.top - canvasRect.top + scrollTop - 36;
      let left = elRect.left - canvasRect.left + scrollLeft;

      // Keep in viewport
      if (top < 8) top = elRect.bottom - canvasRect.top + scrollTop + 8;
      if (left < 8) left = 8;

      setPosition({ left, top });
    };

    updatePosition();

    const observer = new ResizeObserver(updatePosition);
    const el = canvasRef.current.querySelector(`[data-aqb-id="${elementId}"]`);
    if (el) observer.observe(el);

    window.addEventListener("scroll", updatePosition, { capture: true, passive: true });
    window.addEventListener("resize", updatePosition, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", updatePosition, {
        capture: true,
      } as EventListenerOptions);
      window.removeEventListener("resize", updatePosition);
    };
  }, [elementId, canvasRef]);

  // ── Close menus on click outside ───────────────────────────────────────────
  React.useEffect(() => {
    if (!showAncestorMenu && !showMoreMenu) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        showAncestorMenu &&
        ancestorMenuRef.current &&
        !ancestorMenuRef.current.contains(target)
      ) {
        setShowAncestorMenu(false);
      }
      if (showMoreMenu && moreMenuRef.current && !moreMenuRef.current.contains(target)) {
        setShowMoreMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showAncestorMenu, showMoreMenu]);

  if (!position || !element) return null;

  // ── Action handlers ─────────────────────────────────────────────────────────

  const handleSelectParent = () => {
    if (onSelectParent) {
      onSelectParent();
    } else if (parent) {
      composer.selection.select(parent);
    }
  };

  const handleSelectAncestor = (id: string) => {
    if (onSelectAncestor) {
      onSelectAncestor(id);
    } else {
      const el = composer.elements.getElement(id);
      if (el) composer.selection.select(el);
    }
    setShowAncestorMenu(false);
  };

  const handleAdd = () => setPickerOpen(true);

  const handleDuplicate = () => {
    if (onDuplicate) {
      onDuplicate();
    } else {
      composer.elements.duplicateElement?.(elementId);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
    } else {
      const elType = element?.getType?.() || "element";
      const elName = getElementNameFromType(elType);
      const childCount = element?.getChildren?.()?.length || 0;

      composer.beginTransaction("delete-element");
      composer.elements.removeElement(elementId);
      composer.endTransaction();

      const message =
        childCount > 0
          ? `${elName} (${childCount} ${childCount === 1 ? "child" : "children"}) deleted`
          : `${elName} deleted`;

      addToast({
        message,
        variant: "info",
        duration: 5000,
        action: {
          label: "Undo",
          onClick: () => (onUndo ? onUndo() : composer.history.undo()),
        },
      });
    }
  };

  const handleCopy = () => {
    if (onCopy) {
      onCopy();
    } else if (element) {
      composer.clipboard = element.toJSON?.() || null;
    }
    setShowMoreMenu(false);
  };

  const handleWrap = () => {
    if (onWrap) {
      onWrap();
    } else {
      element?.wrap?.("container");
    }
    setShowMoreMenu(false);
  };

  const handleMoveUp = () => {
    if (onMoveUp) {
      onMoveUp();
    } else {
      composer.commands.run("bring-forward");
    }
    setShowMoreMenu(false);
  };

  const handleMoveDown = () => {
    if (onMoveDown) {
      onMoveDown();
    } else {
      composer.commands.run("send-backward");
    }
    setShowMoreMenu(false);
  };

  const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div
      ref={toolbarRef}
      className="aqb-unified-toolbar"
      onMouseDown={stopPropagation}
      onClick={stopPropagation}
      style={{
        position: "absolute",
        left: position.left,
        top: position.top,
        zIndex: Z_LAYERS.floatingToolbar,
        pointerEvents: "auto",
      }}
    >
      <div style={toolbarStyles}>
        <ToolbarNavSection
          hasParent={hasParent}
          elementName={elementName}
          ancestors={ancestors}
          showAncestorMenu={showAncestorMenu}
          ancestorMenuRef={ancestorMenuRef}
          onSelectParent={handleSelectParent}
          onAncestorMenuToggle={() => setShowAncestorMenu((v) => !v)}
          onSelectAncestor={handleSelectAncestor}
        />
        <ToolbarActionsSection
          showMoreMenu={showMoreMenu}
          moreMenuRef={moreMenuRef}
          onAdd={handleAdd}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
          onCopy={handleCopy}
          onWrap={handleWrap}
          onMoveUp={handleMoveUp}
          onMoveDown={handleMoveDown}
          onMoreMenuToggle={() => setShowMoreMenu((v) => !v)}
        />
      </div>

      <BlockPickerModal
        composer={composer}
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        insertionContext={{ targetElementId: elementId, position: "child" }}
      />
    </div>
  );
};

export default UnifiedSelectionToolbar;
