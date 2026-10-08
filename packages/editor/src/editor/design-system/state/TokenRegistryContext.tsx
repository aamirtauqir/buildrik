/**
 * TokenRegistryContext — one context per token kind, so a colour edit
 * re-renders colour consumers only, never SizeSection.
 *
 * Every registry reads the PROJECT's tokens and writes them back through
 * `composer.designSystem.setTokens`: no local copy, no localStorage cache,
 * nothing staged, one undo stack with the canvas (spec §4, Brand Part 1a
 * Task 10). All fourteen are built from ONE project read and ONE commit,
 * which `useSessionEdits` logs — Brand's "Review changes". `useProjectTokenStore`
 * hands the whole set, that commit and the session's edits to the multi-kind
 * writes (import, starters, Colour mode) and to Brand.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "@/engine";
import type { TokenKind } from "../types";
import { DEFAULT_TOKENS } from "../constants";
import { kindRegistry, type TokensForKindRegistry } from "./kindRegistry";
import { spacingRegistry, type SpacingRegistry } from "./spacingRegistry";
import { useProjectTokens, type ProjectTokens } from "./useProjectTokens";
import { useSessionEdits, type SessionEdit } from "./useSessionEdits";

// ============================================================================
// CONTEXT TYPES
// ============================================================================

export type ColorRegistry      = TokensForKindRegistry;
export type { SpacingRegistry };
export type TypeRegistry       = TokensForKindRegistry;
export type RadiusRegistry     = TokensForKindRegistry;
export type ShadowRegistry     = TokensForKindRegistry;
export type MotionRegistry     = TokensForKindRegistry;
export type BorderRegistry     = TokensForKindRegistry;
export type OpacityRegistry    = TokensForKindRegistry;
export type ZindexRegistry     = TokensForKindRegistry;
export type BreakpointRegistry = TokensForKindRegistry;
export type GridRegistry       = TokensForKindRegistry;
export type SizingRegistry     = TokensForKindRegistry;
export type IconRegistry       = TokensForKindRegistry;
export type ImageryRegistry    = TokensForKindRegistry;

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
/** The whole set, its one (logged) commit, and this session's edits. */
export interface TokenStore extends ProjectTokens {
  edits: SessionEdit[];
  /** Revert one session edit; false when it is stale or refused. */
  revert: (key: string) => boolean;
}
const ProjectTokenStoreContext  = React.createContext<TokenStore | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

export interface TokenRegistryProviderProps {
  composer?: Composer | null;
  children: React.ReactNode;
}

export const TokenRegistryProvider: React.FC<TokenRegistryProviderProps> = ({
  composer = null,
  children,
}) => {
  const project = useProjectTokens(composer);
  const { commit, edits, revert } = useSessionEdits(composer, project);
  const { all, readOnly, readOnlyReason } = project;
  const store = React.useMemo<TokenStore>(() => ({ all, readOnly, readOnlyReason, commit, edits, revert }), [all, readOnly, readOnlyReason, commit, edits, revert]);
  const kinds = React.useMemo(() => {
    const k = (kind: TokenKind) => kindRegistry(kind, all, commit);
    return {
      color: k("color"), spacing: spacingRegistry(all, commit), type: k("type"), radius: k("radius"),
      shadow: k("shadow"), motion: k("motion"), border: k("border"), opacity: k("opacity"),
      zindex: k("zindex"), breakpoint: k("breakpoint"), grid: k("grid"), sizing: k("sizing"),
      icon: k("icon"), imagery: k("imagery"),
    };
  }, [all, commit]);
  const {
    color: colorState, spacing: spacingState, type: typeState, radius: radiusState,
    shadow: shadowState, motion: motionState, border: borderState, opacity: opacityState,
    zindex: zindexState, breakpoint: breakpointState, grid: gridState, sizing: sizingState,
    icon: iconState, imagery: imageryState,
  } = kinds;

  // Flat list of (Context, value) pairs that wrap children, outermost first.
  // composeProviders below reduces this into the equivalent nested JSX tree.
  const providers: Array<{ Context: React.Context<unknown>; value: unknown }> = [
    { Context: ProjectTokenStoreContext  as React.Context<unknown>, value: store           },
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
// (e.g. isolated component tests). Reads return the seed; writes refuse.
const refuse = () => false;
function seedRegistry(kind: TokenKind): TokensForKindRegistry {
  const tokens = DEFAULT_TOKENS.filter((t) => t.kind === kind);
  return {
    tokens,
    updateToken: refuse,
    addToken: refuse,
    deleteToken: refuse,
    renameToken: refuse,
    filterTokens: (q: string) => tokens.filter((t) => t.name.toLowerCase().includes(q.trim().toLowerCase())),
  };
}

const FALLBACK_COLOR: ColorRegistry = seedRegistry("color");
const FALLBACK_TYPE: TypeRegistry = seedRegistry("type");
const FALLBACK_SPACING: SpacingRegistry = {
  ...seedRegistry("spacing"),
  activePreset: "normal",
  applyPreset: refuse,
  resetToDefaults: refuse,
};
const FALLBACK_STORE: TokenStore = { all: DEFAULT_TOKENS, readOnly: false, readOnlyReason: null, commit: refuse, edits: [], revert: refuse };

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

/** The whole token set, its one logged writer and the session's edits — for
 *  writes that span kinds (import, starters, Colour mode), the read-only state
 *  and Brand's Review changes. */
export function useProjectTokenStore(): TokenStore {
  return React.useContext(ProjectTokenStoreContext) ?? FALLBACK_STORE;
}
