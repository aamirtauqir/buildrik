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
import { useRadiusTokens } from "./useRadiusTokens";
import type { RadiusTokensState } from "./useRadiusTokens";
import { useShadowTokens } from "./useShadowTokens";
import type { ShadowTokensState } from "./useShadowTokens";
import { useMotionTokens } from "./useMotionTokens";
import type { MotionTokensState } from "./useMotionTokens";
import { useBorderTokens } from "./useBorderTokens";
import type { BorderTokensState } from "./useBorderTokens";
import { useOpacityTokens } from "./useOpacityTokens";
import type { OpacityTokensState } from "./useOpacityTokens";
import { useZindexTokens } from "./useZindexTokens";
import type { ZindexTokensState } from "./useZindexTokens";
import { useBreakpointTokens } from "./useBreakpointTokens";
import type { BreakpointTokensState } from "./useBreakpointTokens";
import { useGridTokens } from "./useGridTokens";
import type { GridTokensState } from "./useGridTokens";
import { useSizingTokens } from "./useSizingTokens";
import type { SizingTokensState } from "./useSizingTokens";
import { useIconTokens } from "./useIconTokens";
import type { IconTokensState } from "./useIconTokens";
import { useImageryTokens } from "./useImageryTokens";
import type { ImageryTokensState } from "./useImageryTokens";

// ============================================================================
// CONTEXT TYPES
// ============================================================================

export type ColorRegistry = ColorTokensState & ColorTokensActions;
export type SpacingRegistry = SpacingTokensState & SpacingTokensActions;
export type TypeRegistry = TypeTokensState & TypeTokensActions;
export type RadiusRegistry     = RadiusTokensState;
export type ShadowRegistry     = ShadowTokensState;
export type MotionRegistry     = MotionTokensState;
export type BorderRegistry     = BorderTokensState;
export type OpacityRegistry    = OpacityTokensState;
export type ZindexRegistry     = ZindexTokensState;
export type BreakpointRegistry = BreakpointTokensState;
export type GridRegistry       = GridTokensState;
export type SizingRegistry     = SizingTokensState;
export type IconRegistry       = IconTokensState;
export type ImageryRegistry    = ImageryTokensState;

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
const RadiusRegistryContext     = React.createContext<RadiusRegistry | null>(null);
const ShadowRegistryContext     = React.createContext<ShadowRegistry | null>(null);
const MotionRegistryContext     = React.createContext<MotionRegistry | null>(null);
const BorderRegistryContext     = React.createContext<BorderRegistry | null>(null);
const OpacityRegistryContext    = React.createContext<OpacityRegistry | null>(null);
const ZindexRegistryContext     = React.createContext<ZindexRegistry | null>(null);
const BreakpointRegistryContext = React.createContext<BreakpointRegistry | null>(null);
const GridRegistryContext       = React.createContext<GridRegistry | null>(null);
const SizingRegistryContext     = React.createContext<SizingRegistry | null>(null);
const IconRegistryContext       = React.createContext<IconRegistry | null>(null);
const ImageryRegistryContext    = React.createContext<ImageryRegistry | null>(null);
const RegistryConfigContext = React.createContext<RegistryConfig | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

export interface TokenRegistryProviderProps {
  projectId?: string | null;
  /** Phase B.1: when present, dark-mode applier subscribes to composer.colorMode. */
  composer?: {
    on: (evt: string, cb: (payload: unknown) => void) => void;
    off: (evt: string, cb: (payload: unknown) => void) => void;
    colorMode: { resolved: () => "light" | "dark" };
    darkResolver: { resolve: (token: DesignToken, resolved: "light" | "dark") => string };
  };
  children: React.ReactNode;
}

export const TokenRegistryProvider: React.FC<TokenRegistryProviderProps> = ({
  projectId,
  composer,
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
  const radiusState     = useRadiusTokens(initialTokens);
  const shadowState     = useShadowTokens(initialTokens);
  const motionState     = useMotionTokens(initialTokens);
  const borderState     = useBorderTokens(initialTokens);
  const opacityState    = useOpacityTokens(initialTokens);
  const zindexState     = useZindexTokens(initialTokens);
  const breakpointState = useBreakpointTokens(initialTokens);
  const gridState       = useGridTokens(initialTokens);
  const sizingState     = useSizingTokens(initialTokens);
  const iconState       = useIconTokens(initialTokens);
  const imageryState    = useImageryTokens(initialTokens);

  // Phase B.1: dark-mode applier. When composer is wired, subscribe to
  // colorMode:changed and re-apply each color token via darkResolver.
  // The effect also runs on mount (and whenever colorState.tokens changes)
  // so live edits in dark mode don't leave the LIGHT value flashed by
  // useColorTokens' internal applyToRoot.
  React.useEffect(() => {
    const apply = () => {
      const resolved = composer?.colorMode.resolved() ?? "light";
      colorState.tokens.forEach((t) => {
        const value = composer
          ? composer.darkResolver.resolve(t, resolved)
          : t.value;
        document.documentElement.style.setProperty(t.cssVar, value);
      });
    };
    apply();
    if (!composer) return;
    const handler = () => apply();
    composer.on("colorMode:changed", handler);
    return () => composer.off("colorMode:changed", handler);
  }, [composer, colorState.tokens]);

  // Save all tokens to localStorage in versioned format. Call this after apply.
  // Versioned format is {schemaVersion, tokens} — the loader accepts both
  // this and the legacy array-only format for backward compat.
  const persistAll = React.useCallback(() => {
    // Persist ALL 14 token kinds. Previously only color/spacing/type were saved,
    // so edits to the other 11 (radius, shadow, motion, border, opacity, zindex,
    // breakpoint, grid, sizing, icon, imagery) were silently lost on reload — the
    // load path reads every kind, but the save dropped 11 of them. Any kind added
    // here MUST also appear in the deps array below.
    const all: DesignToken[] = [
      ...colorState.tokens,
      ...spacingState.tokens,
      ...typeState.tokens,
      ...radiusState.tokens,
      ...shadowState.tokens,
      ...motionState.tokens,
      ...borderState.tokens,
      ...opacityState.tokens,
      ...zindexState.tokens,
      ...breakpointState.tokens,
      ...gridState.tokens,
      ...sizingState.tokens,
      ...iconState.tokens,
      ...imageryState.tokens,
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
  }, [
    colorState.tokens,
    spacingState.tokens,
    typeState.tokens,
    radiusState.tokens,
    shadowState.tokens,
    motionState.tokens,
    borderState.tokens,
    opacityState.tokens,
    zindexState.tokens,
    breakpointState.tokens,
    gridState.tokens,
    sizingState.tokens,
    iconState.tokens,
    imageryState.tokens,
    storageKey,
  ]);

  const config = React.useMemo<RegistryConfig>(() => ({ persistAll }), [persistAll]);

  // Flat list of (Context, value) pairs that wrap children, outermost first.
  // composeProviders below reduces this into the equivalent nested JSX tree.
  // Adding a 15th kind = add one row, no indentation pyramid.
  const providers: Array<{ Context: React.Context<unknown>; value: unknown }> = [
    { Context: ColorRegistryContext      as React.Context<unknown>, value: colorState      },
    { Context: SpacingRegistryContext    as React.Context<unknown>, value: spacingState    },
    { Context: TypeRegistryContext       as React.Context<unknown>, value: typeState       },
    { Context: RadiusRegistryContext     as React.Context<unknown>, value: radiusState     },
    { Context: ShadowRegistryContext     as React.Context<unknown>, value: shadowState     },
    { Context: MotionRegistryContext     as React.Context<unknown>, value: motionState     },
    { Context: BorderRegistryContext     as React.Context<unknown>, value: borderState     },
    { Context: OpacityRegistryContext    as React.Context<unknown>, value: opacityState    },
    { Context: ZindexRegistryContext     as React.Context<unknown>, value: zindexState     },
    { Context: BreakpointRegistryContext as React.Context<unknown>, value: breakpointState },
    { Context: GridRegistryContext       as React.Context<unknown>, value: gridState       },
    { Context: SizingRegistryContext     as React.Context<unknown>, value: sizingState     },
    { Context: IconRegistryContext       as React.Context<unknown>, value: iconState       },
    { Context: ImageryRegistryContext    as React.Context<unknown>, value: imageryState    },
    { Context: RegistryConfigContext     as React.Context<unknown>, value: config          },
  ];

  return <>{composeProviders(providers, children)}</>;
};

/**
 * Reduce a flat list of (Context, value) pairs into a nested provider tree.
 * Earlier entries wrap later entries (so list[0] is outermost). Replaces a
 * 15-level nested JSX pyramid with a single array.
 */
function composeProviders(
  providers: Array<{ Context: React.Context<unknown>; value: unknown }>,
  children: React.ReactNode
): React.ReactNode {
  return providers.reduceRight<React.ReactNode>(
    (acc, { Context, value }) => <Context.Provider value={value}>{acc}</Context.Provider>,
    children
  );
}

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
  stageTokens: noop,
  filterTokens: (q: string) =>
    colorDefaults.filter((t) => t.name.toLowerCase().includes(q.toLowerCase())),
  addToken: noop,
  deleteToken: noop,
  renameToken: noop,
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
  stageTokens: noop,
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
  stageTokens: noop,
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

export function useRadiusRegistry(): RadiusRegistry {
  const ctx = React.useContext(RadiusRegistryContext);
  if (!ctx) throw new Error("useRadiusRegistry must be used within TokenRegistryProvider");
  return ctx;
}

export function useShadowRegistry(): ShadowRegistry {
  const ctx = React.useContext(ShadowRegistryContext);
  if (!ctx) throw new Error("useShadowRegistry must be used within TokenRegistryProvider");
  return ctx;
}

export function useMotionRegistry(): MotionRegistry {
  const ctx = React.useContext(MotionRegistryContext);
  if (!ctx) throw new Error("useMotionRegistry must be used within TokenRegistryProvider");
  return ctx;
}

export function useBorderRegistry(): BorderRegistry {
  const ctx = React.useContext(BorderRegistryContext);
  if (!ctx) throw new Error("useBorderRegistry must be used within TokenRegistryProvider");
  return ctx;
}

export function useOpacityRegistry(): OpacityRegistry {
  const ctx = React.useContext(OpacityRegistryContext);
  if (!ctx) throw new Error("useOpacityRegistry must be used within TokenRegistryProvider");
  return ctx;
}

export function useZindexRegistry(): ZindexRegistry {
  const ctx = React.useContext(ZindexRegistryContext);
  if (!ctx) throw new Error("useZindexRegistry must be used within TokenRegistryProvider");
  return ctx;
}

export function useBreakpointRegistry(): BreakpointRegistry {
  const ctx = React.useContext(BreakpointRegistryContext);
  if (!ctx) throw new Error("useBreakpointRegistry must be used within TokenRegistryProvider");
  return ctx;
}

export function useGridRegistry(): GridRegistry {
  const ctx = React.useContext(GridRegistryContext);
  if (!ctx) throw new Error("useGridRegistry must be used within TokenRegistryProvider");
  return ctx;
}

export function useSizingRegistry(): SizingRegistry {
  const ctx = React.useContext(SizingRegistryContext);
  if (!ctx) throw new Error("useSizingRegistry must be used within TokenRegistryProvider");
  return ctx;
}

export function useIconRegistry(): IconRegistry {
  const ctx = React.useContext(IconRegistryContext);
  if (!ctx) throw new Error("useIconRegistry must be used within TokenRegistryProvider");
  return ctx;
}

export function useImageryRegistry(): ImageryRegistry {
  const ctx = React.useContext(ImageryRegistryContext);
  if (!ctx) throw new Error("useImageryRegistry must be used within TokenRegistryProvider");
  return ctx;
}

export function useRegistryConfig(): RegistryConfig {
  const ctx = React.useContext(RegistryConfigContext);
  if (!ctx) throw new Error("useRegistryConfig must be used within TokenRegistryProvider");
  return ctx;
}

/**
 * Replaces both `tokens` and `savedTokens` for ALL 14 kinds atomically from a
 * single external source (typically `composer.getProjectSettings().designTokens`
 * after migration merge). Closes the C1 persistence gap from S1: without this,
 * the 11 new-kind hooks silently revert to DEFAULT_TOKENS on project reload
 * because their `resetFromSaved` is no-arg.
 *
 * Color/Type/Spacing keep their bespoke `resetFromSaved(merged)` API; the 11
 * new kinds use `hydrateFromExternal(merged)` from `useTokensForKind`.
 */
export function useResetAllKinds(): (allTokens: DesignToken[]) => void {
  const color      = useColorRegistry();
  const type       = useTypeRegistry();
  const spacing    = useSpacingRegistry();
  const radius     = useRadiusRegistry();
  const shadow     = useShadowRegistry();
  const motion     = useMotionRegistry();
  const border     = useBorderRegistry();
  const opacity    = useOpacityRegistry();
  const zindex     = useZindexRegistry();
  const breakpoint = useBreakpointRegistry();
  const grid       = useGridRegistry();
  const sizing     = useSizingRegistry();
  const icon       = useIconRegistry();
  const imagery    = useImageryRegistry();

  // Each useXTokens hook returns a fresh object on every render (no
  // useMemo around the return). Listing those 14 registries in the
  // useCallback deps below would make this callable rotate identity on
  // every render, which destabilises any downstream useCallback/useEffect
  // that lists it as a dep — DesignSystemTab.loadFromComposer + the
  // effect that calls it synchronously produced an unbounded render loop
  // when `composer.getProjectSettings().designTokens.length > 0`.
  //
  // We only need to invoke registry mutator methods — we never need to
  // *react* to registry identity changes — so pinning the latest values
  // in a ref and returning an empty-deps useCallback is the correct
  // shape here. The ref is reassigned on every render so each invocation
  // hits the current registries.
  const latest = React.useRef({
    color, type, spacing, radius, shadow, motion, border,
    opacity, zindex, breakpoint, grid, sizing, icon, imagery,
  });
  latest.current = {
    color, type, spacing, radius, shadow, motion, border,
    opacity, zindex, breakpoint, grid, sizing, icon, imagery,
  };

  return React.useCallback((allTokens: DesignToken[]) => {
    const r = latest.current;
    r.color.resetFromSaved(allTokens);
    r.type.resetFromSaved(allTokens);
    r.spacing.resetFromSaved(allTokens);
    r.radius.hydrateFromExternal(allTokens);
    r.shadow.hydrateFromExternal(allTokens);
    r.motion.hydrateFromExternal(allTokens);
    r.border.hydrateFromExternal(allTokens);
    r.opacity.hydrateFromExternal(allTokens);
    r.zindex.hydrateFromExternal(allTokens);
    r.breakpoint.hydrateFromExternal(allTokens);
    r.grid.hydrateFromExternal(allTokens);
    r.sizing.hydrateFromExternal(allTokens);
    r.icon.hydrateFromExternal(allTokens);
    r.imagery.hydrateFromExternal(allTokens);
  }, []);
}
