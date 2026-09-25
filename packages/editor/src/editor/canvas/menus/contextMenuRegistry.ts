import { ToastActionPayload, ToastTone } from "@/editor/chrome-ui";
/**
 * Context Menu Registry
 * The element menu (right-click and the toolbar's ⋯ More): ordered groups,
 * a rule between each, submenus for Arrange / Style / Structure
 * @license BSD-3-Clause
 */

import type { Composer, Element } from "../../../engine";
import {
  editSubmenu,
  insertSubmenu,
  layoutSubmenu,
  quickStyleSubmenu,
  standaloneActions,
} from "./actions";

/** Toast notification function signature */
export type AddToastFn = (toast: {
  description: string;
  tone?: ToastTone;
  duration?: number;
  action?: ToastActionPayload;
}) => void;

export type ActionContext = {
  composer: Composer;
  element: Element;
  isRoot: boolean;
  openAI?: () => void;
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

const pick = (list: ContextAction[], id: string, group: string): ContextAction[] =>
  list.filter((a) => a.id === id).map((a) => ({ ...a, group }));
const pickStandalone = (id: string, group: string) => pick(standaloneActions, id, group);

/* Board 4428:43928 (Canvas · selected · ⋯ More): four groups split by rules —
   ✦ Improve with AI · Duplicate · Delete | Arrange › Style › Structure › |
   Lock · Group · Bind to CMS field… | Add interaction. The old menu was
   Edit › Insert › Layout › Quick Style › then a flat tail. Nothing is
   dropped: Copy / Cut / Paste, Wrap / Unwrap, Replace with block… and Save
   as component sit under Structure; Ungroup / Unlock take their pair's slot. */
const menuItems: ContextAction[] = [
  ...pickStandalone("improve-with-ai", "top"),
  ...pick(editSubmenu, "duplicate", "top"),
  ...pick(editSubmenu, "delete", "top"),
  { id: "layout-group", label: "Arrange", icon: "layout", group: "sub", submenu: layoutSubmenu },
  { id: "style-group", label: "Style", icon: "palette", group: "sub", submenu: quickStyleSubmenu },
  {
    id: "structure-group",
    label: "Structure",
    icon: "box",
    group: "sub",
    submenu: [
      ...insertSubmenu,
      ...editSubmenu.filter((a) => a.id === "copy" || a.id === "cut" || a.id === "paste"),
      ...pickStandalone("replace-with-block", "Structure"),
      ...pickStandalone("save-as-component", "Structure"),
    ],
  },
  ...pickStandalone("lock-element", "state"),
  ...pickStandalone("unlock-element", "state"),
  ...pickStandalone("group-elements", "state"),
  ...pickStandalone("ungroup-elements", "state"),
  ...pickStandalone("bind-to-cms", "state"),
  ...pickStandalone("add-interaction", "tail"),
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

  return filterActions(menuItems);
};

