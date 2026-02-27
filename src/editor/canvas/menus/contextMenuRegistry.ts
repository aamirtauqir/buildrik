/**
 * Context Menu Registry
 * Simplified context menu with 4 main groups and nested submenus
 * @license BSD-3-Clause
 */

import type { Composer, Element } from "../../../engine";
import type { ToastAction, ToastVariant } from "../../../shared/ui/Toast";
import {
  editSubmenu,
  insertSubmenu,
  layoutSubmenu,
  quickStyleSubmenu,
  standaloneActions,
} from "./actions";

/** Toast notification function signature */
export type AddToastFn = (toast: {
  message: string;
  variant?: ToastVariant;
  duration?: number;
  action?: ToastAction;
}) => void;

export type ActionContext = {
  composer: Composer;
  element: Element;
  isRoot: boolean;
  openAI?: () => void;
  /** Stack of element IDs at click position (for "Select from stack" feature) */
  elementStack?: string[];
  /** Toast function for showing undo notifications */
  addToast?: AddToastFn;
};

export type ContextAction = {
  id: string;
  label: string;
  icon?: string;
  group: string;
  shortcut?: string;
  submenu?: ContextAction[];
  isVisible?: (ctx: ActionContext) => boolean;
  isEnabled?: (ctx: ActionContext) => boolean;
  handler?: (ctx: ActionContext) => void;
};

// Main menu items (top-level with submenus)
const mainMenuItems: ContextAction[] = [
  {
    id: "edit-group",
    label: "Edit",
    icon: "edit",
    group: "main",
    submenu: editSubmenu,
  },
  {
    id: "insert-group",
    label: "Insert",
    icon: "plus",
    group: "main",
    submenu: insertSubmenu,
  },
  {
    id: "layout-group",
    label: "Layout",
    icon: "layout",
    group: "main",
    submenu: layoutSubmenu,
  },
  {
    id: "style-group",
    label: "Quick Style",
    icon: "palette",
    group: "main",
    submenu: quickStyleSubmenu,
  },
];

export const getContextMenuActions = (ctx: ActionContext): ContextAction[] => {
  const filterActions = (actions: ContextAction[]): ContextAction[] => {
    return actions
      .filter((action) => {
        // Filter by isVisible predicate
        if (action.isVisible && !action.isVisible(ctx)) return false;
        return true;
      })
      .map((action) => {
        // Recursively filter submenu items
        if (action.submenu) {
          const filteredSubmenu = filterActions(action.submenu);
          // Hide parent if submenu becomes empty
          if (filteredSubmenu.length === 0) return null;
          return {
            ...action,
            submenu: filteredSubmenu,
          };
        }
        return action;
      })
      .filter(Boolean) as ContextAction[]; // Remove nulls
  };

  return [...filterActions(mainMenuItems), ...filterActions(standaloneActions)];
};

// Re-export submenu groups for potential direct access
export { editSubmenu, insertSubmenu, layoutSubmenu, quickStyleSubmenu };
