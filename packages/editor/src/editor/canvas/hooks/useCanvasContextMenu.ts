/**
 * useCanvasContextMenu Hook
 * Manages context menu state and actions
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine";
import type { Element } from "../../../engine/elements/Element";
import { getContextMenuActions, type ContextAction, type AddToastFn } from "../menus";

// ============================================================================
// TYPES
// ============================================================================

export interface ContextMenuState {
  x: number;
  y: number;
  elementId: string;
  /** Stack of element IDs at click position (for "Select from stack" feature) */
  elementStack?: string[];
}

export interface ContextMenuContext {
  composer: Composer;
  element: Element;
  isRoot: boolean;
  openAI?: () => void;
  /** Stack of element IDs at click position (for "Select from stack" feature) */
  elementStack?: string[];
  /** Toast function for showing undo notifications */
  addToast?: AddToastFn;
}

export interface ContextMenuData {
  context: ContextMenuContext;
  actions: ContextAction[];
}

interface UseCanvasContextMenuProps {
  composer: Composer | null;
  onAIRequest?: (payload: { elementId: string; elementType?: string }) => void;
  /** Toast function for showing undo notifications */
  addToast?: AddToastFn;
}

interface UseCanvasContextMenuReturn {
  contextMenu: ContextMenuState | null;
  setContextMenu: React.Dispatch<React.SetStateAction<ContextMenuState | null>>;
  menuData: ContextMenuData | null;
  closeContextMenu: () => void;
}

// ============================================================================
// HOOK
// ============================================================================

export function useCanvasContextMenu({
  composer,
  onAIRequest,
  addToast,
}: UseCanvasContextMenuProps): UseCanvasContextMenuReturn {
  const [contextMenu, setContextMenu] = React.useState<ContextMenuState | null>(null);

  // Frozen menu data captured at open time
  const [frozenMenuData, setFrozenMenuData] = React.useState<ContextMenuData | null>(null);

  // Close context menu on scroll or window resize
  React.useEffect(() => {
    if (!contextMenu) return;

    const handleScrollOrResize = () => {
      setContextMenu(null);
      setFrozenMenuData(null);
    };

    window.addEventListener("scroll", handleScrollOrResize, { capture: true, passive: true });
    window.addEventListener("resize", handleScrollOrResize, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, {
        capture: true,
      } as EventListenerOptions);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [contextMenu]);

  // Capture menu data when context menu opens
  React.useEffect(() => {
    if (!contextMenu || !composer) {
      setFrozenMenuData(null);
      return;
    }

    const el = composer.elements.getElement(contextMenu.elementId);
    if (!el) {
      setFrozenMenuData(null);
      return;
    }

    const activePage = composer.elements.getActivePage();
    const isRoot = activePage?.root?.id === el.getId();

    const ctx: ContextMenuContext = {
      composer,
      element: el,
      isRoot: Boolean(isRoot),
      openAI: onAIRequest
        ? () =>
            onAIRequest({
              elementId: el.getId(),
              elementType: el.getType(),
            })
        : undefined,
      elementStack: contextMenu.elementStack,
      addToast,
    };

    // Freeze menu data at open time - won't change even if Composer updates
    setFrozenMenuData({
      context: ctx,
      actions: getContextMenuActions(ctx),
    });
  }, [contextMenu?.elementId, contextMenu?.x, contextMenu?.y, composer, onAIRequest, addToast]);

  const closeContextMenu = React.useCallback(() => {
    setContextMenu(null);
    setFrozenMenuData(null);
  }, []);

  return {
    contextMenu,
    setContextMenu,
    menuData: frozenMenuData,
    closeContextMenu,
  };
}

export default useCanvasContextMenu;
