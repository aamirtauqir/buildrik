import * as React from "react";
import { TokenKindCard } from "./TokenKindCard";
import { GenericTokenList } from "../tokens/GenericTokenList";
import { ColorTokenList } from "../colors/ColorTokenList";
import { TypeTokenList } from "../type/TypeTokenList";
import { SpacingTokenList } from "../spacing/SpacingTokenList";
import {
  useColorRegistry,
  useTypeRegistry,
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
import type { TokenKind } from "../../types";

interface TokensSectionProps {
  /** C2 fix: clicking "+" inside ColorTokenList must open the parent's AddTokenModal. */
  onAddTokenClick?: () => void;
  /** C3 fix: SpacingTokenList's "Reset to defaults" must call stageDefaults at parent scope. */
  onResetSpacingToDefaults?: () => void;
}

interface KindEntry {
  kindId: TokenKind;
  title: string;
  isFoundation: boolean; // true = often empty in a fresh project; muted in beginner mode
}

const KIND_ORDER: KindEntry[] = [
  { kindId: "color",      title: "Color",      isFoundation: false },
  { kindId: "type",       title: "Type",       isFoundation: false },
  { kindId: "spacing",    title: "Spacing",    isFoundation: false },
  { kindId: "radius",     title: "Radius",     isFoundation: false },
  { kindId: "shadow",     title: "Shadow",     isFoundation: false },
  { kindId: "motion",     title: "Motion",     isFoundation: false },
  { kindId: "border",     title: "Border",     isFoundation: true  },
  { kindId: "opacity",    title: "Opacity",    isFoundation: true  },
  { kindId: "zindex",     title: "Z-index",    isFoundation: true  },
  { kindId: "breakpoint", title: "Breakpoint", isFoundation: true  },
  { kindId: "grid",       title: "Grid",       isFoundation: true  },
  { kindId: "sizing",     title: "Sizing",     isFoundation: true  },
  { kindId: "icon",       title: "Icon",       isFoundation: true  },
  { kindId: "imagery",    title: "Imagery",    isFoundation: true  },
];

export const TokensSection: React.FC<TokensSectionProps> = ({
  onAddTokenClick,
  onResetSpacingToDefaults,
}) => {
  const dsMode = useDSModeOptional();
  const isBeginner = dsMode?.mode !== "pro";

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

  const colorDirty = Object.keys(color.pendingDiff).length > 0;
  const typeDirty = type.tokens.some((t) => {
    const saved = type.savedTokens.find((s) => s.id === t.id);
    return saved !== undefined && t.value !== saved.value;
  });
  const spacingDirty = spacing.tokens.some((t) => {
    const saved = spacing.savedTokens.find((s) => s.id === t.id);
    return saved !== undefined && t.value !== saved.value;
  });

  const newKindRegistry = (kindId: TokenKind) => {
    switch (kindId) {
      case "radius":     return radius;
      case "shadow":     return shadow;
      case "motion":     return motion;
      case "border":     return border;
      case "opacity":    return opacity;
      case "zindex":     return zindex;
      case "breakpoint": return breakpoint;
      case "grid":       return grid;
      case "sizing":     return sizing;
      case "icon":       return icon;
      case "imagery":    return imagery;
      default:           return null;
    }
  };

  // Beginner mode: foundation kinds with zero tokens move to the bottom.
  const ordered = React.useMemo(() => {
    if (!isBeginner) return KIND_ORDER;
    const populated: KindEntry[] = [];
    const muted: KindEntry[] = [];
    for (const k of KIND_ORDER) {
      let count = 0;
      if (k.kindId === "color")        count = color.tokens.length;
      else if (k.kindId === "type")    count = type.tokens.length;
      else if (k.kindId === "spacing") count = spacing.tokens.length;
      else                             count = newKindRegistry(k.kindId)?.tokens.length ?? 0;
      if (k.isFoundation && count === 0) muted.push(k);
      else                               populated.push(k);
    }
    return [...populated, ...muted];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBeginner, color.tokens.length, type.tokens.length, spacing.tokens.length,
      radius.tokens.length, shadow.tokens.length, motion.tokens.length, border.tokens.length,
      opacity.tokens.length, zindex.tokens.length, breakpoint.tokens.length, grid.tokens.length,
      sizing.tokens.length, icon.tokens.length, imagery.tokens.length]);

  return (
    <div>
      {ordered.map((entry) => {
        if (entry.kindId === "color") {
          return (
            <TokenKindCard
              key={entry.kindId}
              kindId={entry.kindId}
              title={entry.title}
              count={color.tokens.length}
              isDirty={colorDirty}
            >
              <ColorTokenList
                tokens={color.tokens}
                pendingDiff={color.pendingDiff}
                onColorChange={color.updateToken}
                onUndo={color.undoToken}
                onRedo={color.redoToken}
                canUndo={color.canUndo}
                canRedo={color.canRedo}
                onAddToken={() => onAddTokenClick?.()}
              />
            </TokenKindCard>
          );
        }
        if (entry.kindId === "type") {
          return (
            <TokenKindCard
              key={entry.kindId}
              kindId={entry.kindId}
              title={entry.title}
              count={type.tokens.length}
              isDirty={typeDirty}
            >
              <TypeTokenList
                tokens={type.tokens}
                responsiveMode={type.responsiveMode}
                onTokenChange={type.updateToken}
                onResponsiveModeChange={type.setResponsiveMode}
                onUndo={type.undoToken}
                canUndo={type.canUndo}
                onRedo={type.redoToken}
                canRedo={type.canRedo}
              />
            </TokenKindCard>
          );
        }
        if (entry.kindId === "spacing") {
          return (
            <TokenKindCard
              key={entry.kindId}
              kindId={entry.kindId}
              title={entry.title}
              count={spacing.tokens.length}
              isDirty={spacingDirty}
            >
              <SpacingTokenList
                tokens={spacing.tokens}
                activePreset={spacing.activePreset}
                savedPreset={spacing.savedPreset}
                isDirty={spacing.isDirty}
                onTokenChange={spacing.updateToken}
                onPresetApply={spacing.applyPreset}
                onResetToDefaults={() => onResetSpacingToDefaults?.()}
                onUndo={spacing.undoToken}
                canUndo={spacing.canUndo}
                onRedo={spacing.redoToken}
                canRedo={spacing.canRedo}
              />
            </TokenKindCard>
          );
        }
        const r = newKindRegistry(entry.kindId);
        if (!r) return null;
        const dirty = Object.keys(r.pendingDiff).length > 0;
        return (
          <TokenKindCard
            key={entry.kindId}
            kindId={entry.kindId}
            title={entry.title}
            count={r.tokens.length}
            isDirty={dirty}
            defaultOpen={r.tokens.length > 0}
          >
            <GenericTokenList
              tokens={r.tokens}
              pendingDiff={r.pendingDiff}
              onTokenChange={r.updateToken}
              onUndo={r.undoToken}
              canUndo={r.canUndo}
            />
          </TokenKindCard>
        );
      })}
    </div>
  );
};
