/**
 * TokensSection — the token table for one kind, on its Brand workspace page:
 * Colours (7315:80955), Spacing and the other non-colour kinds (7576:197036,
 * the generic "Tokens · <kind>" pattern). A row click selects the token; the
 * workspace draws its card in the right column.
 *
 * It also owns the engine subscription every token page needs:
 * `tokenUsage:changed` for the USED column (Colours: the site-wide,
 * unknown-aware `getCount`, BRP1-M5). (Engine-side writes and ⌘Z reach
 * the registries by themselves now — they read the project.)
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
} from "../../state/TokenRegistryContext";
import { useDSModeOptional } from "../../state/DSModeContext";
import { filterTokensByMode } from "../../utils/semanticKind";
import type { TokenKind } from "../../types";
import type { SpacingPreset } from "@/editor/design-system/state/spacingRegistry";
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
  /** Colours' "Used by N" — highlight that token's elements (BRP1-M5). */
  onShowUsage?: (tokenId: string) => void;
}

export const TokensSection: React.FC<TokensSectionProps> = ({
  openKind,
  onAddTokenClick,
  composer,
  selectedTokenId = null,
  onSelectToken,
  onShowUsage,
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
    /* The site-wide count, "unknown" while saved components load. Read on the
       same "tokenUsage:changed" re-render as `usageMap` above. */
    const tracker = composer?.designSystem?.tokenUsage;
    const usageCounts = new Map(visible.map((t) => [t.id, tracker ? tracker.getCount(t.id) : (usageMap.get(t.id) ?? 0)] as const));
    return (
      <ColorTokenList
        tokens={visible}
        allTokens={color.tokens}
        onAddToken={() => onAddTokenClick?.()}
        hiddenByModeCount={filterTokensByMode(color.tokens, "pro").length - visible.length}
        usageCounts={usageCounts}
        onShowUsage={onShowUsage}
        selectedTokenId={selectedTokenId}
        onSelectToken={onSelectToken}
        isPro={isPro}
      />
    );
  }

  if (openKind === "spacing") {
    const visible = filterTokensByMode(spacing.tokens, mode);
    const preset = spacing.activePreset;
    return (

        <KindTokenList
          tokens={visible}
          allTokens={spacing.tokens}
          kindLabel="spacing"
          hiddenByModeCount={filterTokensByMode(spacing.tokens, "pro").length - visible.length}
          /* The board's PRESET column: which preset the spacing values
             match, or "custom" once any has been hand-edited. */
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
      allTokens={r.tokens}
      kindLabel={openKind}
      hiddenByModeCount={filterTokensByMode(r.tokens, "pro").length - visible.length}
      {...selection}
    />
  );
};
