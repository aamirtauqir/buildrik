/**
 * TokenRegistryContext — 3 separate contexts for color, spacing, and type tokens.
 *
 * Architecture rationale:
 *   3 distinct contexts (not 1 combined) prevents cross-category re-renders.
 *   A color keystroke re-renders only ColorInput consumers, never SizeSection.
 *
 * CP2 (localStorage persistence):
 *   - On mount: reads buildrick-design-tokens-{projectId}-v1, falls back to DEFAULT_TOKENS
 *   - On apply: call persistAll() after composer.setProjectSettings
 *   - Private browsing (SecurityError) or corrupt JSON → falls through to DEFAULT_TOKENS, no crash
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { DesignToken } from "../types";
import { DEFAULT_TOKENS } from "../constants";
import { migrateDesignTokens, CURRENT_SCHEMA_VERSION } from "../migrations";
import { useColorTokens } from "./useColorTokens";
import type { ColorTokensState, ColorTokensActions } from "./useColorTokens";
import { useSpacingTokens } from "./useSpacingTokens";
import type { SpacingTokensState, SpacingTokensActions } from "./useSpacingTokens";
import { useTypeTokens } from "./useTypeTokens";
import type { TypeTokensState, TypeTokensActions } from "./useTypeTokens";

// ============================================================================
// CONTEXT TYPES
// ============================================================================

export type ColorRegistry = ColorTokensState & ColorTokensActions;
export type SpacingRegistry = SpacingTokensState & SpacingTokensActions;
export type TypeRegistry = TypeTokensState & TypeTokensActions;

interface RegistryConfig {
  /** Save all current token values to localStorage (call after composer.setProjectSettings) */
  persistAll: () => void;
}

// ============================================================================
// CONTEXTS
// ============================================================================

const ColorRegistryContext = React.createContext<ColorRegistry | null>(null);
const SpacingRegistryContext = React.createContext<SpacingRegistry | null>(null);
const TypeRegistryContext = React.createContext<TypeRegistry | null>(null);
const RegistryConfigContext = React.createContext<RegistryConfig | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

export interface TokenRegistryProviderProps {
  projectId?: string | null;
  children: React.ReactNode;
}

export const TokenRegistryProvider: React.FC<TokenRegistryProviderProps> = ({
  projectId,
  children,
}) => {
  const storageKey = `buildrick-design-tokens-${projectId ?? "default"}-v1`;

  // Load from localStorage on first render. Supports BOTH legacy array format
  // and new versioned format ({schemaVersion, tokens}). Applies migrations
  // when stored version < CURRENT_SCHEMA_VERSION. Falls through to DEFAULT_TOKENS
  // on any error (private browsing, corrupt JSON, unknown shape).
  const initialTokens = React.useMemo((): DesignToken[] => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return DEFAULT_TOKENS;

      const parsed: unknown = JSON.parse(raw);
      let tokens: DesignToken[];
      let storedVersion: number;

      if (Array.isArray(parsed)) {
        // Legacy format — pre-versioned. Treat as V1.
        tokens = parsed as DesignToken[];
        storedVersion = 1;
      } else if (
        parsed &&
        typeof parsed === "object" &&
        "schemaVersion" in parsed &&
        "tokens" in parsed &&
        Array.isArray((parsed as { tokens: unknown }).tokens)
      ) {
        tokens = (parsed as { tokens: DesignToken[] }).tokens;
        storedVersion = (parsed as { schemaVersion: number }).schemaVersion;
      } else {
        return DEFAULT_TOKENS;
      }

      if (storedVersion < CURRENT_SCHEMA_VERSION) {
        tokens = migrateDesignTokens(tokens, storedVersion, CURRENT_SCHEMA_VERSION);
      }

      return tokens.length > 0 ? tokens : DEFAULT_TOKENS;
    } catch {
      // SecurityError (private browsing) or JSON.parse failure → use defaults
      return DEFAULT_TOKENS;
    }
  }, [storageKey]);

  const colorState = useColorTokens(initialTokens);
  const spacingState = useSpacingTokens(initialTokens);
  const typeState = useTypeTokens(initialTokens);

  // Save all tokens to localStorage in versioned format. Call this after apply.
  // Versioned format is {schemaVersion, tokens} — the loader accepts both
  // this and the legacy array-only format for backward compat.
  const persistAll = React.useCallback(() => {
    const all: DesignToken[] = [
      ...colorState.tokens,
      ...spacingState.tokens,
      ...typeState.tokens,
    ];
    try {
      const versioned = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        tokens: all,
      };
      localStorage.setItem(storageKey, JSON.stringify(versioned));
    } catch {
      // SecurityError in private browsing → no crash, just skip persistence
    }
  }, [colorState.tokens, spacingState.tokens, typeState.tokens, storageKey]);

  const config = React.useMemo<RegistryConfig>(() => ({ persistAll }), [persistAll]);

  return (
    <ColorRegistryContext.Provider value={colorState}>
      <SpacingRegistryContext.Provider value={spacingState}>
        <TypeRegistryContext.Provider value={typeState}>
          <RegistryConfigContext.Provider value={config}>
            {children}
          </RegistryConfigContext.Provider>
        </TypeRegistryContext.Provider>
      </SpacingRegistryContext.Provider>
    </ColorRegistryContext.Provider>
  );
};

// ============================================================================
// HOOKS
// ============================================================================

// Static fallbacks for Inspector controls rendered outside the provider
// (e.g. isolated component tests). Reads return default tokens; writes are no-ops.
const noop = () => {};
const colorDefaults = DEFAULT_TOKENS.filter((t) => t.category === "colors");
const spacingDefaults = DEFAULT_TOKENS.filter((t) => t.category === "spacing");
const typeDefaults = DEFAULT_TOKENS.filter((t) => t.category === "typography");

const FALLBACK_COLOR: ColorRegistry = {
  tokens: colorDefaults,
  savedTokens: colorDefaults,
  pendingDiff: {},
  isDirty: false,
  updateToken: noop,
  undoToken: noop,
  redoToken: noop,
  canUndo: () => false,
  canRedo: () => false,
  markSaved: noop,
  discardAll: noop,
  resetFromSaved: noop,
  filterTokens: (q: string) =>
    colorDefaults.filter((t) => t.name.toLowerCase().includes(q.toLowerCase())),
  addToken: noop,
  deleteToken: noop,
};

const FALLBACK_SPACING: SpacingRegistry = {
  tokens: spacingDefaults,
  savedTokens: spacingDefaults,
  activePreset: "normal",
  savedPreset: "normal",
  isDirty: false,
  updateToken: noop,
  undoToken: noop,
  redoToken: noop,
  canUndo: () => false,
  canRedo: () => false,
  markSaved: noop,
  discardAll: noop,
  resetFromSaved: noop,
  applyPreset: noop,
  stageDefaults: noop,
} as SpacingRegistry;

const FALLBACK_TYPE: TypeRegistry = {
  tokens: typeDefaults,
  savedTokens: typeDefaults,
  responsiveMode: "desktop",
  isDirty: false,
  updateToken: noop,
  undoToken: noop,
  redoToken: noop,
  canUndo: () => false,
  canRedo: () => false,
  markSaved: noop,
  discardAll: noop,
  resetFromSaved: noop,
  setResponsiveMode: noop,
} as TypeRegistry;

export function useColorRegistry(): ColorRegistry {
  const ctx = React.useContext(ColorRegistryContext);
  return ctx ?? FALLBACK_COLOR;
}

export function useSpacingRegistry(): SpacingRegistry {
  const ctx = React.useContext(SpacingRegistryContext);
  return ctx ?? FALLBACK_SPACING;
}

export function useTypeRegistry(): TypeRegistry {
  const ctx = React.useContext(TypeRegistryContext);
  return ctx ?? FALLBACK_TYPE;
}

export function useRegistryConfig(): RegistryConfig {
  const ctx = React.useContext(RegistryConfigContext);
  if (!ctx) throw new Error("useRegistryConfig must be used within TokenRegistryProvider");
  return ctx;
}
