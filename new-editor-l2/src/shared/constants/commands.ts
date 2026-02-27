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
 * Keyboard shortcut mapping
 * Maps command IDs to their keyboard shortcuts
 */
export const SHORTCUTS: Record<CommandId, string | null> = {
  // Edit
  [COMMANDS.UNDO]: "Mod+Z",
  [COMMANDS.REDO]: "Mod+Shift+Z",
  [COMMANDS.CUT]: "Mod+X",
  [COMMANDS.COPY]: "Mod+C",
  [COMMANDS.PASTE]: "Mod+V",
  [COMMANDS.DELETE]: "Backspace",
  [COMMANDS.DUPLICATE]: "Mod+D",
  [COMMANDS.SELECT_ALL]: "Mod+A",
  [COMMANDS.DESELECT]: "Escape",

  // File
  [COMMANDS.SAVE]: "Mod+S",
  [COMMANDS.SAVE_AS]: "Mod+Shift+S",
  [COMMANDS.EXPORT]: "Mod+E",
  [COMMANDS.IMPORT]: "Mod+I",
  [COMMANDS.NEW_PROJECT]: "Mod+N",
  [COMMANDS.OPEN_PROJECT]: "Mod+O",

  // View
  [COMMANDS.ZOOM_IN]: "Mod+=",
  [COMMANDS.ZOOM_OUT]: "Mod+-",
  [COMMANDS.ZOOM_FIT]: "Mod+0",
  [COMMANDS.ZOOM_100]: "Mod+1",
  [COMMANDS.TOGGLE_GRID]: "Mod+'",
  [COMMANDS.TOGGLE_GUIDES]: "Mod+;",
  [COMMANDS.TOGGLE_RULERS]: "Mod+R",
  [COMMANDS.TOGGLE_PREVIEW]: "Mod+P",

  // Element
  [COMMANDS.MOVE_UP]: "Mod+]",
  [COMMANDS.MOVE_DOWN]: "Mod+[",
  [COMMANDS.MOVE_TO_FRONT]: "Mod+Shift+]",
  [COMMANDS.MOVE_TO_BACK]: "Mod+Shift+[",
  [COMMANDS.GROUP]: "Mod+G",
  [COMMANDS.UNGROUP]: "Mod+Shift+G",
  [COMMANDS.LOCK]: "Mod+L",
  [COMMANDS.UNLOCK]: "Mod+Shift+L",
  [COMMANDS.HIDE]: "Mod+H",
  [COMMANDS.SHOW]: "Mod+Shift+H",

  // Alignment (no default shortcuts)
  [COMMANDS.ALIGN_LEFT]: null,
  [COMMANDS.ALIGN_CENTER]: null,
  [COMMANDS.ALIGN_RIGHT]: null,
  [COMMANDS.ALIGN_TOP]: null,
  [COMMANDS.ALIGN_MIDDLE]: null,
  [COMMANDS.ALIGN_BOTTOM]: null,
  [COMMANDS.DISTRIBUTE_HORIZONTAL]: null,
  [COMMANDS.DISTRIBUTE_VERTICAL]: null,

  // Panels
  [COMMANDS.TOGGLE_LAYERS]: "Alt+1",
  [COMMANDS.TOGGLE_INSPECTOR]: "Alt+2",
  [COMMANDS.TOGGLE_ASSETS]: "Alt+3",
  [COMMANDS.TOGGLE_COMPONENTS]: "Alt+4",
  [COMMANDS.TOGGLE_CODE]: "Alt+5",
  [COMMANDS.TOGGLE_AI]: "Alt+6",

  // Tools
  [COMMANDS.TOOL_SELECT]: "V",
  [COMMANDS.TOOL_HAND]: "H",
  [COMMANDS.TOOL_TEXT]: "T",
  [COMMANDS.TOOL_RECTANGLE]: "R",
  [COMMANDS.TOOL_FRAME]: "F",

  // Navigation
  [COMMANDS.ESCAPE]: "Escape",
  [COMMANDS.ENTER]: "Enter",
  [COMMANDS.TAB_NEXT]: "Tab",
  [COMMANDS.TAB_PREV]: "Shift+Tab",

  // Debug
  [COMMANDS.TOGGLE_DEBUG]: "Mod+Shift+D",
  [COMMANDS.CLEAR_CONSOLE]: null,
  [COMMANDS.INSPECT_ELEMENT]: null,
};

/**
 * Check if a string is a valid command ID
 */
export function isValidCommand(id: string): id is CommandId {
  return Object.values(COMMANDS).includes(id as CommandId);
}

/**
 * Get shortcut for a command
 */
export function getShortcut(commandId: CommandId): string | null {
  return SHORTCUTS[commandId] ?? null;
}
