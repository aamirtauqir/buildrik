/**
 * Aquibra Command Constants
 * Centralized command IDs for keyboard shortcuts and command palette
 *
 * @module constants/commands
 * @license BSD-3-Clause
 */

/**
 * All command identifiers used throughout Aquibra
 */
export const COMMANDS = {
  // ============================================
  // Edit Commands
  // ============================================
  UNDO: "undo",
  REDO: "redo",
  CUT: "cut",
  COPY: "copy",
  PASTE: "paste",
  DELETE: "delete",
  DUPLICATE: "duplicate",
  SELECT_ALL: "select-all",
  DESELECT: "deselect",

  // ============================================
  // File Commands
  // ============================================
  SAVE: "save",
  SAVE_AS: "save-as",
  EXPORT: "export",
  IMPORT: "import",
  NEW_PROJECT: "new-project",
  OPEN_PROJECT: "open-project",

  // ============================================
  // View Commands
  // ============================================
  ZOOM_IN: "zoom-in",
  ZOOM_OUT: "zoom-out",
  ZOOM_FIT: "zoom-fit",
  ZOOM_100: "zoom-100",
  TOGGLE_GRID: "toggle-grid",
  TOGGLE_GUIDES: "toggle-guides",
  TOGGLE_RULERS: "toggle-rulers",
  TOGGLE_PREVIEW: "toggle-preview",

  // ============================================
  // Element Commands
  // ============================================
  MOVE_UP: "move-up",
  MOVE_DOWN: "move-down",
  MOVE_TO_FRONT: "move-to-front",
  MOVE_TO_BACK: "move-to-back",
  GROUP: "group",
  UNGROUP: "ungroup",
  LOCK: "lock",
  UNLOCK: "unlock",
  HIDE: "hide",
  SHOW: "show",

  // ============================================
  // Alignment Commands
  // ============================================
  ALIGN_LEFT: "align-left",
  ALIGN_CENTER: "align-center",
  ALIGN_RIGHT: "align-right",
  ALIGN_TOP: "align-top",
  ALIGN_MIDDLE: "align-middle",
  ALIGN_BOTTOM: "align-bottom",
  DISTRIBUTE_HORIZONTAL: "distribute-horizontal",
  DISTRIBUTE_VERTICAL: "distribute-vertical",

  // ============================================
  // Panel Commands
  // ============================================
  TOGGLE_LAYERS: "toggle-layers",
  TOGGLE_INSPECTOR: "toggle-inspector",
  TOGGLE_ASSETS: "toggle-assets",
  TOGGLE_COMPONENTS: "toggle-components",
  TOGGLE_CODE: "toggle-code",
  TOGGLE_AI: "toggle-ai",

  // ============================================
  // Tool Commands
  // ============================================
  TOOL_SELECT: "tool-select",
  TOOL_HAND: "tool-hand",
  TOOL_TEXT: "tool-text",
  TOOL_RECTANGLE: "tool-rectangle",
  TOOL_FRAME: "tool-frame",

  // ============================================
  // Navigation Commands
  // ============================================
  ESCAPE: "escape",
  ENTER: "enter",
  TAB_NEXT: "tab-next",
  TAB_PREV: "tab-prev",

  // ============================================
  // Debug Commands
  // ============================================
  TOGGLE_DEBUG: "toggle-debug",
  CLEAR_CONSOLE: "clear-console",
  INSPECT_ELEMENT: "inspect-element",
} as const;

/**
 * Type for all valid command IDs
 */
export type CommandId = (typeof COMMANDS)[keyof typeof COMMANDS];

/**
 * Command categories
 */
export type CommandCategory =
  | "edit"
  | "file"
  | "view"
  | "element"
  | "alignment"
  | "panel"
  | "tool"
  | "navigation"
  | "debug";

/**
 * Check if a string is a valid command ID
 */
export function isValidCommand(id: string): id is CommandId {
  return Object.values(COMMANDS).includes(id as CommandId);
}
