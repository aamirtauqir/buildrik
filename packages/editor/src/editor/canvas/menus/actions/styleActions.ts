/**
 * Quick Style Submenu Actions — copy / paste style, from the element-action
 * registry (the same commands ⌥⌘C / ⌥⌘V and the Inspector ⋯ run).
 * The padding/margin/border/background/shadow presets and "Reset all styles"
 * were deleted (G2-054): hard-coded values outside the Brand tokens.
 * @license BSD-3-Clause
 */

import type { ContextAction } from "../contextMenuRegistry";
import { fromElementAction } from "./standaloneActions";

export const quickStyleSubmenu: ContextAction[] = [
  fromElementAction("copy-style", "Quick Style", "copy-styles"),
  fromElementAction("paste-style", "Quick Style", "paste-styles"),
];
