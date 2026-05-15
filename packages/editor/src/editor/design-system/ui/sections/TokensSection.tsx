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
import type { Composer } from "../../../../engine/Composer";
import type { LintIssue } from "../../../../engine/designSystem/LintState";

interface TokensSectionProps {
  /** C2 fix: clicking "+" inside ColorTokenList must open the parent's AddTokenModal. */
  onAddTokenClick?: () => void;
  /** C3 fix: SpacingTokenList's "Reset to defaults" must call stageDefaults at parent scope. */
  onResetSpacingToDefaults?: () => void;
  /** T7: composer drives per-token usage counts via TokenUsageTracker. */
  composer?: Composer | null;
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
  composer,
}) => {
  const dsMode = useDSModeOptional();
  const isBeginner = dsMode?.mode !== "pro";

  // T7: subscribe to TokenUsageTracker's own "tokenUsage:changed" event.
  //
  // Why not the 4 element:* events directly? Composer microtask-coalesces
  // recompute (Composer.ts:225-236). A handler on `element:updated` would
  // fire SYNCHRONOUSLY in the same tick and snapshot the pre-recompute
  // (stale) map; the queued microtask flushes the new counts AFTER the
  // snapshot is taken. The tracker emits "tokenUsage:changed" at the END
  // of recompute, so by the time we re-snapshot the map is fresh.
  //
  // Per feedback_setter_closure_stale_state.md: do not capture the initial
  // map only — subscribe via useEffect and update state on every event.
  const [usageMap, setUsageMap] = React.useState<ReadonlyMap<string, number>>(
    () =>
      composer?.designSystem?.tokenUsage
        ? new Map(composer.designSystem.tokenUsage.getAllUsage())
        : new Map()
  );

  React.useEffect(() => {
    const tracker = composer?.designSystem?.tokenUsage;
    if (!tracker) return;
    // Seed once on mount in case recompute already ran before subscription.
    setUsageMap(new Map(tracker.getAllUsage()));
    const handler = () => setUsageMap(new Map(tracker.getAllUsage()));
    tracker.on("tokenUsage:changed", handler);
    return () => {
      tracker.off("tokenUsage:changed", handler);
    };
  }, [composer]);

  // T10: subscribe to LintState "lint:changed" event. Bumps a version
  // counter that's referenced in lintGetter's dep array — re-creates the
  // getter, which forces children to re-resolve issues on every change
  // (suppress / unsuppress / setIssues). Matches T7 emit pattern; emit
  // added in T10 (see LintState.ts).
  const [lintVersion, setLintVersion] = React.useState(0);
  React.useEffect(() => {
    const lint = composer?.designSystem?.lintState;
    if (!lint) return;
    const handler = () => setLintVersion((v) => v + 1);
    lint.on("lint:changed", handler);
    return () => {
      lint.off("lint:changed", handler);
    };
  }, [composer]);

  // List-agnostic helpers passed to every token list. `getIssues` returns
  // the visible (non-suppressed) issues for a token; `onIgnore` suppresses
  // them. `computeAutoFix` resolves a LintIssue.autoFixHint into a fixed
  // hex (pure compute, engine-side); the list applies the result via its
  // own update path (onColorChange / onTokenChange / etc.) and then
  // suppresses the row. See Composer.ts:designSystem.computeAutoFix for
  // why this isn't a full engine transaction.
  const lintState = composer?.designSystem?.lintState;
  const getIssues = React.useCallback(
    (tokenId: string): readonly LintIssue[] =>
      lintState?.getVisibleIssues(tokenId) ?? [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lintState, lintVersion],
  );
  const onIgnoreLint = React.useCallback(
    (tokenId: string) => {
      lintState?.suppress(tokenId);
    },
    [lintState],
  );
  const computeAutoFix = React.useCallback(
    (value: string, hint: string | undefined): string =>
      composer?.designSystem?.computeAutoFix(value, hint) ?? value,
    [composer],
  );

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

  // Inline style for the beginner-mode educative hint chip (T8).
  // Inline-styles pattern matches TokenUsageChip post-T7 review — avoids
  // orphan className → vibcoder cobalt fallback per
  // feedback_orphan_classes_pattern.md.
  const hintStyle: React.CSSProperties = {
    marginTop: 12,
    padding: "8px 12px",
    background: "var(--buildrick-info-soft, #EFF4FF)",
    color: "var(--buildrick-info-strong, #1F4FBF)",
    borderRadius: 6,
    fontSize: 11,
    lineHeight: 1.5,
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
                usageByTokenId={usageMap}
                getLintIssues={getIssues}
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
                usageByTokenId={usageMap}
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
                usageByTokenId={usageMap}
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
              usageByTokenId={usageMap}
              getLintIssues={getIssues}
              onLintIgnore={onIgnoreLint}
              onLintAutoFix={(id, hint) => {
                const t = r.tokens.find((x) => x.id === id);
                if (!t) return;
                r.updateToken(id, computeAutoFix(t.value, hint));
                lintState?.suppress(id);
              }}
            />
          </TokenKindCard>
        );
      })}
      {isBeginner && (
        <div style={hintStyle} role="note">
          Beginner mode hides token IDs and alias graph. Toggle Pro to expose.
        </div>
      )}
    </div>
  );
};
