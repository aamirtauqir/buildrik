import * as React from "react";
import { Button } from "@/editor/chrome-ui";
import { TokensRouter } from "./TokensRouter";
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
  useResetAllKinds,
} from "../../state/TokenRegistryContext";
import { useDSModeOptional } from "../../state/DSModeContext";
import { filterTokensByMode } from "../../utils/semanticKind";
import type { TokenKind, DesignToken } from "../../types";
import type { Composer } from "../../../../engine/Composer";
import type { LintIssue } from "../../../../engine/designSystem/LintState";

interface TokensSectionProps {
  /** C2 fix: clicking "+" inside ColorTokenList must open the parent's AddTokenModal. */
  onAddTokenClick?: () => void;
  /** C3 fix: SpacingTokenList's "Reset to defaults" must call stageDefaults at parent scope. */
  onResetSpacingToDefaults?: () => void;
  /** T7: composer drives per-token usage counts via TokenUsageTracker. */
  composer?: Composer | null;
  /** Which token kind is open, or null for the kind list. Controlled by
   *  DesignSystemTab so the panel can render ONE crumb — board 152:83 draws
   *  `‹ Tokens · color`, not two stacked crumbs. */
  openKind?: TokenKind | null;
  onOpenKind?: (kind: TokenKind | null) => void;
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
  openKind = null,
  onOpenKind,
}) => {
  const dsMode = useDSModeOptional();
  const isBeginner = dsMode?.mode !== "pro";
  const isPro = dsMode?.mode === "pro";

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

  // T7: `getIssues` returns the visible (non-suppressed) issues for a token
  // and drives inline row warn state in each list. Auto-fix + Ignore actions
  // live in T8 detail view per D7 — TokensSection only needs the getter.
  const lintState = composer?.designSystem?.lintState;
  const getIssues = React.useCallback(
    (tokenId: string): readonly LintIssue[] =>
      lintState?.getVisibleIssues(tokenId) ?? [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lintState, lintVersion],
  );

  // B5-wire (2026-05-17): Beginner mode filters lists to semantic-only tokens
  // (those with semanticKind set). Pro mode passes all tokens through. Mode
  // is read once here; lists + card counts use the same filtered view so
  // the count never disagrees with what the list actually renders.
  const mode = dsMode?.mode ?? "beginner";
  const visible = React.useCallback(
    (tokens: readonly DesignToken[]): DesignToken[] => filterTokensByMode(tokens, mode),
    [mode],
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
    background: "var(--bk-accent-tint)",
    color: "var(--bk-accent-text)",
    borderRadius: 6,
    fontSize: 11,
    lineHeight: 1.5,
  };

  // T8: flat token map for TokensRouter — lets the router look up a token by
  // id without knowing about per-kind registries. Lookup also drives the
  // detail view's bail-out path when a token disappears.
  const allTokens = React.useMemo(
    () => [
      ...color.tokens, ...type.tokens, ...spacing.tokens,
      ...radius.tokens, ...shadow.tokens, ...motion.tokens, ...border.tokens,
      ...opacity.tokens, ...zindex.tokens, ...breakpoint.tokens, ...grid.tokens,
      ...sizing.tokens, ...icon.tokens, ...imagery.tokens,
    ],
    [color.tokens, type.tokens, spacing.tokens, radius.tokens, shadow.tokens,
     motion.tokens, border.tokens, opacity.tokens, zindex.tokens,
     breakpoint.tokens, grid.tokens, sizing.tokens, icon.tokens, imagery.tokens],
  );

  // D6.c: re-hydrate every kind registry whenever the underlying project
  // settings shift out from under the React state. Three triggers:
  //  - project:changed  → applyAutoFix's labeled transaction lands here
  //  - history:undo     → Composer.importProject runs WITHOUT emitting
  //                       project:changed (would create a record loop), so
  //                       we listen explicitly to get Cmd+Z back into the UI
  //  - history:redo     → same reasoning, Cmd+Shift+Z roundtrip
  // handleApply also fires project:changed → harmless no-op re-hydrate.
  const resetAll = useResetAllKinds();
  React.useEffect(() => {
    if (!composer) return;
    const onSettingsShift = () => {
      const settings = composer.getProjectSettings();
      if (!settings) return;
      const next = (settings.designTokens ?? []) as Parameters<typeof resetAll>[0];
      resetAll(next);
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

  // T8: dispatch a token-value update to whichever registry owns the id.
  // Detail view (and any future cross-kind editor) calls onTokenChange with
  // just (id, value) — we resolve the owning registry by token kind.
  const handleTokenChange = React.useCallback((id: string, value: string, darkValue?: string) => {
    const tok = allTokens.find((t) => t.id === id);
    if (!tok) return;
    const k = tok.kind ?? (tok.category === "colors" ? "color"
      : tok.category === "typography" ? "type"
      : tok.category === "spacing" ? "spacing"
      : undefined);
    // Only the color registry stores a dark variant — the other kinds take
    // two args and would ignore a third anyway.
    if (k === "color")        { color.updateToken(id, value, darkValue); return; }
    if (k === "type")         { type.updateToken(id, value); return; }
    if (k === "spacing")      { spacing.updateToken(id, value); return; }
    const r = newKindRegistry(k as TokenKind);
    r?.updateToken?.(id, value);
  }, [allTokens, color, type, spacing, radius, shadow, motion, border,
      opacity, zindex, breakpoint, grid, sizing, icon, imagery]);

  // T8: dispatch delete. Only color + generic kinds expose deleteToken;
  // type + spacing intentionally omit it (no DS UX entry for delete on
  // typography or spacing scales). Detail view's Delete button no-ops for
  // those token kinds (button still renders, just nothing to call).
  const handleTokenDelete = React.useCallback((id: string, opts?: { replaceWith?: string }) => {
    const tok = allTokens.find((t) => t.id === id);
    if (!tok) return;
    const k = tok.kind ?? (tok.category === "colors" ? "color" : undefined);
    if (k === "color") { color.deleteToken(id, opts); return; }
    const r = newKindRegistry(k as TokenKind);
    r?.deleteToken?.(id, opts);
  }, [allTokens, color, radius, shadow, motion, border, opacity, zindex,
      breakpoint, grid, sizing, icon, imagery]);

  // B1 follow-up (2026-05-17): dispatch rename to the owning registry. Same
  // routing rules as handleTokenDelete — color flows to useColorTokens, every
  // other kind to its useTokensForKind registry. Type + spacing currently
  // have no rename API (no DS UX entry for those) so renames there silently
  // no-op via optional chaining.
  const handleTokenRename = React.useCallback((id: string, newId: string) => {
    const tok = allTokens.find((t) => t.id === id);
    if (!tok) return;
    const k = tok.kind ?? (tok.category === "colors" ? "color" : undefined);
    if (k === "color") { color.renameToken(id, newId); return; }
    const r = newKindRegistry(k as TokenKind);
    r?.renameToken?.(id, newId);
  }, [allTokens, color, radius, shadow, motion, border, opacity, zindex,
      breakpoint, grid, sizing, icon, imagery]);

  // Beginner mode: foundation kinds with zero visible tokens move to the
  // bottom. B5-wire (2026-05-17): "visible" honors the semantic filter, so
  // a foundation kind with primitives-only (no semantics yet) still mutes
  // in Beginner — matches the empty card body the user will see.
  const ordered = React.useMemo(() => {
    if (!isBeginner) return KIND_ORDER;
    const populated: KindEntry[] = [];
    const muted: KindEntry[] = [];
    for (const k of KIND_ORDER) {
      let count = 0;
      if (k.kindId === "color")        count = visible(color.tokens).length;
      else if (k.kindId === "type")    count = visible(type.tokens).length;
      else if (k.kindId === "spacing") count = visible(spacing.tokens).length;
      else                             count = visible(newKindRegistry(k.kindId)?.tokens ?? []).length;
      if (k.isFoundation && count === 0) muted.push(k);
      else                               populated.push(k);
    }
    return [...populated, ...muted];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBeginner, visible, color.tokens, type.tokens, spacing.tokens,
      radius.tokens, shadow.tokens, motion.tokens, border.tokens,
      opacity.tokens, zindex.tokens, breakpoint.tokens, grid.tokens,
      sizing.tokens, icon.tokens, imagery.tokens]);

  return (
    <TokensRouter
      composer={composer}
      tokens={allTokens}
      onTokenChange={handleTokenChange}
      onTokenDelete={handleTokenDelete}
      onTokenRename={handleTokenRename}
    >
      {({ onRowClick }) => (
        <div>
          {/* Board 152:52 draws the Tokens destination as a DRILL-IN LIST of
              kinds — "color 18 ›" — not the accordion of expandable cards this
              replaced. That accordion came from prototype s02 (its own comment
              in TokenKindCard says so) and the board moved past it, the same
              way Brand's root moved from a tab bar to a drill-in. Presets was
              already a row list, so this brings the last Brand destination onto
              one nav model. */}
          {openKind === null &&
            ordered.map((entry) => {
              const r =
                entry.kindId === "color" ? color
                : entry.kindId === "type" ? type
                : entry.kindId === "spacing" ? spacing
                : newKindRegistry(entry.kindId);
              const count = r ? visible(r.tokens).length : 0;
              /* Not every registry exposes pendingDiff (SpacingRegistry does
                 not), so the dot reads the one field they all share. */
              const dirty = r
                ? r.tokens.some((t) => {
                    const saved = r.savedTokens.find((s2) => s2.id === t.id);
                    return saved === undefined || t.value !== saved.value;
                  })
                : false;
              return (
                <Button
                  key={entry.kindId}
                  color="light"
                  data-kind-id={entry.kindId}
                  data-kind-count={count}
                  onClick={() => onOpenKind?.(entry.kindId)}
                  className="tw:flex tw:w-full tw:items-center tw:justify-between tw:gap-2 tw:h-auto tw:px-2 tw:py-2 tw:rounded-md tw:border-0 tw:bg-transparent tw:text-left tw:hover:bg-gray-100"
                >
                  <span className="tw:flex tw:items-center tw:gap-[5px] tw:text-[13px] tw:text-gray-900">
                    {entry.title.toLowerCase()}
                    {dirty && (
                      <span
                        className="tw:size-[5px] tw:flex-none tw:rounded-full tw:bg-[var(--bk-warning)]"
                        aria-label="unsaved changes"
                      />
                    )}
                  </span>
                  <span className="tw:flex tw:flex-none tw:items-center tw:gap-1.5">
                    <span className="tw:text-xs tw:text-gray-500">{count}</span>
                    <span aria-hidden="true" className="tw:text-gray-400">›</span>
                  </span>
                </Button>
              );
            })}

          {ordered.filter((e) => e.kindId === openKind).map((entry) => {
            if (entry.kindId === "color") {
              const visibleColor = visible(color.tokens);
              return (
                <React.Fragment key={entry.kindId}>
                  <ColorTokenList
                    tokens={visibleColor}
                    /* Surface resolution must see the whole palette: Beginner
                       filters `color-background` out of the view, and the
                       contrast rule then measured everything against white. */
                    allTokens={color.tokens}
                    pendingDiff={color.pendingDiff}
                    onColorChange={color.updateToken}
                    onUndo={color.undoToken}
                    onRedo={color.redoToken}
                    canUndo={color.canUndo}
                    canRedo={color.canRedo}
                    onAddToken={() => onAddTokenClick?.()}
                    usageByTokenId={usageMap}
                    getLintIssues={getIssues}
                    isPro={isPro}
                    hiddenByModeCount={color.tokens.length - visibleColor.length}
                    composer={composer}
                    onRowClick={onRowClick}
                  />
                </React.Fragment>
              );
            }
            if (entry.kindId === "type") {
              const visibleType = visible(type.tokens);
              return (
                <React.Fragment key={entry.kindId}>
                  <TypeTokenList
                    tokens={visibleType}
                    responsiveMode={type.responsiveMode}
                    onTokenChange={type.updateToken}
                    onResponsiveModeChange={type.setResponsiveMode}
                    onUndo={type.undoToken}
                    canUndo={type.canUndo}
                    onRedo={type.redoToken}
                    canRedo={type.canRedo}
                    usageByTokenId={usageMap}
                    onRowClick={onRowClick}
                  />
                </React.Fragment>
              );
            }
            if (entry.kindId === "spacing") {
              const visibleSpacing = visible(spacing.tokens);
              return (
                <React.Fragment key={entry.kindId}>
                  <SpacingTokenList
                    tokens={visibleSpacing}
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
                    onRowClick={onRowClick}
                  />
                </React.Fragment>
              );
            }
            const r = newKindRegistry(entry.kindId);
            if (!r) return null;
            const dirty = Object.keys(r.pendingDiff).length > 0;
            const visibleR = visible(r.tokens);
            return (
              <React.Fragment key={entry.kindId}>
                <GenericTokenList
                  tokens={visibleR}
                  pendingDiff={r.pendingDiff}
                  onTokenChange={r.updateToken}
                  onUndo={r.undoToken}
                  canUndo={r.canUndo}
                  usageByTokenId={usageMap}
                  getLintIssues={getIssues}
                  onRowClick={onRowClick}
                />
              </React.Fragment>
            );
          })}
          {isBeginner && (
            <div style={hintStyle} role="note">
              Beginner mode hides token IDs and alias graph. Toggle Pro to expose.
            </div>
          )}
        </div>
      )}
    </TokensRouter>
  );
};
