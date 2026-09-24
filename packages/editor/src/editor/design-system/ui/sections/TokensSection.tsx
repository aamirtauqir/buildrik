/**
 * TokensSection — the token table for one kind, on its Brand workspace page:
 * Colours (7315:80955), Spacing and the other non-colour kinds (7576:197036,
 * the generic "Tokens · <kind>" pattern). A row click selects the token; the
 * workspace draws its card in the right column.
 *
 * It also owns two engine subscriptions every token page needs:
 * `tokenUsage:changed` for the USED column, and the settings re-hydrate that
 * brings an engine-side write (applyAutoFix, the AI's setDesignToken) and
 * Cmd+Z back into the registries.
 *
 * (The drawer's kind drill-in list and its Beginner hint band lived here until
 * C1 (ii); the workspace nav replaced the first, the nav's own Beginner note
 * the second.)
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { ColorTokenList } from "../colors/ColorTokenList";
import { KindTokenList } from "../tokens/KindTokenList";
import {
  useColorRegistry,
  useSpacingRegistry,
  useRadiusRegistry,
  useShadowRegistry,
  useMotionRegistry,
  useBorderRegistry,
  useOpacityRegistry,
  useZindexRegistry,
  useBreakpointRegistry,
  useGridRegistry,
  useSizingRegistry,
  useIconRegistry,
  useImageryRegistry,
  useResetAllKinds,
} from "../../state/TokenRegistryContext";
import { useDSModeOptional } from "../../state/DSModeContext";
import { filterTokensByMode } from "../../utils/semanticKind";
import type { TokenKind } from "../../types";
import type { SpacingPreset } from "../../state/useSpacingTokens";
import type { Composer } from "../../../../engine/Composer";

/* The PRESET column (7576:197036): the spacing preset a token's value came
   from, or "custom" once hand-edited. */
const SPACING_PRESET_LABELS: Record<SpacingPreset, string> = {
  compact: "Compact",
  normal: "Normal",
  spacious: "Spacious",
};

interface TokensSectionProps {
  /** The page's kind. Type tokens have their own page (TypographySection). */
  openKind: Exclude<TokenKind, "type">;
  /** The empty colour library's "+ Add a color" opens the workspace's modal. */
  onAddTokenClick?: () => void;
  composer?: Composer | null;
  selectedTokenId?: string | null;
  onSelectToken?: (tokenId: string) => void;
}

export const TokensSection: React.FC<TokensSectionProps> = ({
  openKind,
  onAddTokenClick,
  composer,
  selectedTokenId = null,
  onSelectToken,
}) => {
  const mode = useDSModeOptional()?.mode ?? "beginner";
  const isPro = mode === "pro";

  /* Subscribe to the tracker's own "tokenUsage:changed", not the element
     events: Composer microtask-coalesces the recompute, so an element-event
     handler would snapshot the pre-recompute map. */
  const [usageMap, setUsageMap] = React.useState<ReadonlyMap<string, number>>(
    () => (composer?.designSystem?.tokenUsage ? new Map(composer.designSystem.tokenUsage.getAllUsage()) : new Map()),
  );
  React.useEffect(() => {
    const tracker = composer?.designSystem?.tokenUsage;
    if (!tracker) return;
    setUsageMap(new Map(tracker.getAllUsage()));
    const handler = () => setUsageMap(new Map(tracker.getAllUsage()));
    tracker.on("tokenUsage:changed", handler);
    return () => {
      tracker.off("tokenUsage:changed", handler);
    };
  }, [composer]);

  /* D6.c: re-hydrate every kind registry when project settings shift under
     the React state — project:changed (applyAutoFix's labelled transaction,
     setDesignToken) and history:undo / :redo (importProject emits no
     project:changed, so Cmd+Z needs its own listener). */
  const resetAll = useResetAllKinds();
  React.useEffect(() => {
    if (!composer) return;
    const onSettingsShift = () => {
      const settings = composer.getProjectSettings();
      if (!settings) return;
      resetAll((settings.designTokens ?? []) as Parameters<typeof resetAll>[0]);
    };
    composer.on("project:changed", onSettingsShift);
    composer.on("history:undo", onSettingsShift);
    composer.on("history:redo", onSettingsShift);
    return () => {
      composer.off("project:changed", onSettingsShift);
      composer.off("history:undo", onSettingsShift);
      composer.off("history:redo", onSettingsShift);
    };
  }, [composer, resetAll]);

  const color = useColorRegistry();
  const spacing = useSpacingRegistry();
  const generic = {
    radius: useRadiusRegistry(),
    shadow: useShadowRegistry(),
    motion: useMotionRegistry(),
    border: useBorderRegistry(),
    opacity: useOpacityRegistry(),
    zindex: useZindexRegistry(),
    breakpoint: useBreakpointRegistry(),
    grid: useGridRegistry(),
    sizing: useSizingRegistry(),
    icon: useIconRegistry(),
    imagery: useImageryRegistry(),
  };

  const selection = { usageByTokenId: usageMap, selectedTokenId, onSelectToken, isPro };

  if (openKind === "color") {
    const visible = filterTokensByMode(color.tokens, mode);
    return (
      <ColorTokenList
        tokens={visible}
        pendingDiff={color.pendingDiff}
        onAddToken={() => onAddTokenClick?.()}
        hiddenByModeCount={color.tokens.length - visible.length}
        {...selection}
      />
    );
  }

  if (openKind === "spacing") {
    const visible = filterTokensByMode(spacing.tokens, mode);
    const preset = spacing.activePreset;
    return (

        <KindTokenList
          tokens={visible}
          savedTokens={spacing.savedTokens}
          kindLabel="spacing"
          hiddenByModeCount={spacing.tokens.length - visible.length}
          /* The board's PRESET column: which preset a token's value came
             from, or "custom" once it has been hand-edited (the registry
             drops the active preset on any manual edit). */
          presetOf={() => (preset ? SPACING_PRESET_LABELS[preset] : "custom")}
          {...selection}
        />
    );
  }

  const r = generic[openKind];
  const visible = filterTokensByMode(r.tokens, mode);
  return (
    <KindTokenList
      tokens={visible}
      savedTokens={r.savedTokens}
      kindLabel={openKind}
      hiddenByModeCount={r.tokens.length - visible.length}
      {...selection}
    />
  );
};
