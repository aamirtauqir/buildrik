/**
 * Design system types — editor-side re-export + UI-specific types.
 *
 * Pure data types moved to engine/designSystem/types.ts on 2026-05-22 so
 * engine code can import them without reaching into editor/ (CLAUDE.md
 * import-direction rule). This file:
 *   - re-exports the data types for editor consumers (50+ files)
 *   - keeps the React/UI-specific types (TokenListProps) here
 *
 * @license BSD-3-Clause
 */

export type {
  TokenCategory,
  WcagLevel,
  ColorHSB,
  TokenDiff,
  UndoEntry,
  TokenKind,
  SemanticKind,
  TokenValue,
  TokenType,
  DesignToken,
  ThemeMode,
  PresetCategory,
  PresetBinding,
  StylePreset,
} from "@/engine/designSystem/types";

export { tokenToCssVar } from "@/engine/designSystem/types";

import type { DesignToken } from "@/engine/designSystem/types";

/** React props for token list components — editor-only, no engine consumer. */
export interface TokenListProps {
  tokens: DesignToken[];
  onChange: (id: string, value: string) => void;
  onCopy: (id: string) => void;
}
