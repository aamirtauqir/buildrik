/**
 * DesignSystemTab v12 — Tokens / Styles / Components / Export
 * 4-section workspace. Aggregates dirty state across all 14 token registries.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button, PanelHeader } from "@/editor/ui";
import { PanelErrorState } from "../../../editor/sidebar/shared/PanelErrorState";
import type { Composer } from "../../../engine/Composer";
import { EVENTS } from "../../../shared/constants/events";
import type { DesignTokenRecord } from "../../../shared/types/project";
import { useToast } from "@/editor/ui";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";
import { DEFAULT_TOKENS } from "../constants";
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
  useRegistryConfig,
  useResetAllKinds,
} from "../state/TokenRegistryContext";
import {
  useButtonPresets, useCardPresets, useFormPresets, useLinkPresets,
  useBadgePresets, useAlertPresets, useTooltipPresets, useModalPresets,
  useNavPresets, useTablePresets, useLayoutPresets,
  usePresetRegistryConfig,
} from "../state/StylePresetRegistryContext";
import type { StylePreset } from "../types";
import { useTokenUsageMap } from "../state/useTokenUsageMap";
import type { DesignToken } from "../types";
import { CURRENT_SCHEMA_VERSION, migrateDesignTokens } from "../migrations";
import {
  buildExport,
  downloadFile,
  generateColorTokenId,
  generateColorCssVar,
} from "../utils/exportUtils";
import type { ExportFormat } from "../utils/exportUtils";
import { DesignTabFooter } from "./DesignTabFooter";
import { DraftChip } from "./DraftChip";
import { DSLintMount } from "./DSLintMount";
import { DSModeToggle } from "./DSModeToggle";
import { ColorModeToggle } from "./ColorModeToggle";
import { ExportDropdown } from "./ExportDropdown";
import { AIPromptModal } from "./AIPromptModal";
import { AddTokenModal } from "./modals/AddTokenModal";
import { ReviewModal } from "./modals/ReviewModal";
import { TabGuardModal } from "./modals/TabGuardModal";
import { TokensSection } from "./sections/TokensSection";
import { StylesSection, useStylesSectionTotalDirty } from "./sections/StylesSection";
import { ComponentsSection } from "./sections/ComponentsSection";
import { ExportSection } from "./sections/ExportSection";

// ─── Layout ───────────────────────────────────────────────────────────────────

const containerStyles: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  height: "100%",
  background: "var(--bk-bg-subtle)",
};

const sectionBodyStyles: React.CSSProperties = {
  flex: 1,
  overflow: "auto",
  padding: 12,
};

// ─── Section types ────────────────────────────────────────────────────────────

type DesignSection = "tokens" | "styles" | "components" | "export";

const SECTIONS: Array<{ id: DesignSection; label: string }> = [
  { id: "tokens",     label: "Tokens" },
  { id: "styles",     label: "Styles" },
  { id: "components", label: "Components" },
  { id: "export",     label: "Export" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Only the truly-shared subset across all 14 registries. Color/Type/Spacing
// expose richer types (TypeRegistry has no pendingDiff field; ColorRegistry's
// pendingDiff is Record<string, TokenDiff>, not Record<string, string>). Stick
// to value-vs-savedTokens for a uniform dirty calculation that works for all 14.
interface KindRegistryLike {
  tokens: DesignToken[];
  savedTokens: DesignToken[];
  updateToken: (id: string, value: string) => void;
  markSaved: () => void;
  discardAll: () => void;
}

function dirtyCount(reg: KindRegistryLike): number {
  // Counts both modifications (id present in saved with different value) AND
  // additions (id not in saved at all). Pre-fix this only counted modifications,
  // so import-via-add and AddTokenModal both shipped tokens silently — no
  // section-tab dot, no DraftChip count increment. Removals are not counted
  // here; deleteToken UX is a separate concern.
  return reg.tokens.filter((t) => {
    const saved = reg.savedTokens.find((s) => s.id === t.id);
    return saved === undefined || t.value !== saved.value;
  }).length;
}

// ─── DesignSystemTab ──────────────────────────────────────────────────────────

interface DesignSystemTabProps {
  composer: Composer | null;
  isPinned?: boolean;
  onPinToggle?: () => void;
  onHelpClick?: () => void;
  onClose?: () => void;
}

export const DesignSystemTab: React.FC<DesignSystemTabProps> = ({
  composer,
  isPinned,
  onPinToggle,
  onHelpClick,
  onClose,
}) => {
  const { addToast } = useToast();
  const [activeSection, setActiveSection] = React.useState<DesignSection>("tokens");
  const [pendingSection, setPendingSection] = React.useState<DesignSection | null>(null);
  const [showSectionGuard, setShowSectionGuard] = React.useState(false);
  const [showReview, setShowReview] = React.useState(false);
  const [showAddToken, setShowAddToken] = React.useState(false);
  const [aiOpen, setAiOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isFirstLoad, setIsFirstLoad] = React.useState(false);

  // T10 / spec D8: outermost wrapper gets data-ds-preview={resolvedMode} so
  // ds-panel-dark.css can scope overrides to the DS panel only. Editor chrome
  // (Inspector, canvas, topbar) keeps the canonical light theme.
  const [resolvedMode, setResolvedMode] = React.useState<"light" | "dark">(
    () => composer?.colorMode?.resolved?.() ?? "light",
  );
  React.useEffect(() => {
    if (!composer?.colorMode) return;
    const sync = () => setResolvedMode(composer.colorMode.resolved?.() ?? "light");
    sync();
    composer.on("colorMode:changed", sync);
    return () => {
      composer.off("colorMode:changed", sync);
    };
  }, [composer]);

  const hasLoadedRef = React.useRef(false);
  // Identity of the composer that has already been loaded into the React
  // registries. Used by the load effect below to ensure each composer
  // instance gets a single initial loadFromComposer() call, even if
  // surrounding identity (resetAllKinds, loadFromComposer, addToast) ever
  // re-rotates. Cleared implicitly by the comparison when composer prop
  // changes (e.g. project switch).
  const loadedComposerRef = React.useRef<typeof composer | null>(null);

  const [usageVersion, setUsageVersion] = React.useState(0);
  const usageMap = useTokenUsageMap(composer, usageVersion);
  const totalUsageCount = React.useMemo(() => {
    let n = 0;
    for (const set of usageMap.values()) n += set.size;
    return n;
  }, [usageMap]);

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
  const { persistAll } = useRegistryConfig();
  const resetAllKinds = useResetAllKinds();

  // S2: preset registries — fanned out so handleApply can persist + markSaved
  // them in lockstep with tokens. Same pattern as the 14 token registries.
  const buttonPresets   = useButtonPresets();
  const cardPresets     = useCardPresets();
  const formPresets     = useFormPresets();
  const linkPresets     = useLinkPresets();
  const badgePresets    = useBadgePresets();
  const alertPresets    = useAlertPresets();
  const tooltipPresets  = useTooltipPresets();
  const modalPresets    = useModalPresets();
  const navPresets      = useNavPresets();
  const tablePresets    = useTablePresets();
  const layoutPresets   = useLayoutPresets();
  const { persistAll: persistAllPresets } = usePresetRegistryConfig();
  const allPresetRegistries = [
    buttonPresets, cardPresets, formPresets, linkPresets, badgePresets, alertPresets,
    tooltipPresets, modalPresets, navPresets, tablePresets, layoutPresets,
  ];

  const allRegistries: KindRegistryLike[] = [
    color, type, spacing, radius, shadow, motion, border,
    opacity, zindex, breakpoint, grid, sizing, icon, imagery,
  ];

  const tokensDirty = allRegistries.reduce((n, r) => n + dirtyCount(r), 0);
  const stylesDirty = useStylesSectionTotalDirty();
  const totalDirty = tokensDirty + stylesDirty;
  const isDirty = totalDirty > 0;

  const isDirtyRef = React.useRef(isDirty);
  React.useEffect(() => { isDirtyRef.current = isDirty; }, [isDirty]);

  // ─ Load from Composer ─
  const loadFromComposer = React.useCallback(() => {
    if (!composer) return;
    try {
      const settings = composer.getProjectSettings();
      const storedVersion = settings.designTokensSchemaVersion ?? 1;

      if (storedVersion > CURRENT_SCHEMA_VERSION) {
        console.warn(
          `project was saved with designTokensSchemaVersion=${storedVersion} ` +
          `(editor supports up to ${CURRENT_SCHEMA_VERSION}); loading tokens as-is`
        );
      }

      if (settings.designTokens && settings.designTokens.length > 0) {
        // DesignTokenRecord is structurally compatible with DesignToken at runtime
        // (id/name/value/cssVar/category/type/group are shared); cast to silence
        // a pre-existing TS narrowing gap in the migration signature.
        let incoming = settings.designTokens as unknown as DesignToken[];
        if (storedVersion < CURRENT_SCHEMA_VERSION) {
          incoming = migrateDesignTokens(incoming, storedVersion, CURRENT_SCHEMA_VERSION);
        }
        const merged = DEFAULT_TOKENS.map((def) => {
          const saved = incoming.find((t) => (t.id ? t.id === def.id : t.name === def.name));
          return saved ? { ...def, value: saved.value } : def;
        });
        // C1 fix: single fan-out resets all 14 kinds atomically. Internally:
        // color/type/spacing get resetFromSaved(merged), the 11 new kinds get
        // hydrateFromExternal(merged) (filters by kind, replaces tokens+saved).
        resetAllKinds(merged);
        hasLoadedRef.current = true;
        setIsFirstLoad(false);
      } else {
        setIsFirstLoad(true);
      }
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load design tokens");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [composer, resetAllKinds]);

  React.useEffect(() => {
    if (!composer) return;
    // Defense-in-depth alongside the useRef stabilisation of useResetAllKinds:
    // gate the initial load to once per composer instance, so that even if a
    // future change re-introduces identity churn for loadFromComposer, the
    // effect's self-invocation cannot drive an unbounded render loop. A
    // genuine project switch (new composer prop) still re-triggers because
    // the ref comparison fails. Cross-window settings change still flows
    // through handleSettingsChange below.
    if (loadedComposerRef.current !== composer) {
      loadedComposerRef.current = composer;
      loadFromComposer();
    }

    const handleProjectLoaded = () => { if (!hasLoadedRef.current) loadFromComposer(); };
    const handleSettingsChange = () => {
      if (isDirtyRef.current) {
        addToast({
          description: "Design tokens changed from another window. Your edits may conflict.",
          tone: "warning",
        });
      } else {
        loadFromComposer();
      }
    };
    const handleUndoRedo = () => {
      // Dirty guard (mirrors handleSettingsChange): a global engine undo/redo
      // is a canvas action that must NOT silently discard unsaved DS-tab token
      // edits. When the tab has staged changes, keep them and warn instead of
      // reloading over them from stored settings.
      if (isDirtyRef.current) {
        addToast({
          description: "Canvas undo/redo — your unsaved design token edits were kept.",
          tone: "info",
        });
        return;
      }
      loadFromComposer();
    };
    const bumpUsage = () => setUsageVersion((v) => v + 1);

    composer.on(EVENTS.PROJECT_LOADED, handleProjectLoaded);
    composer.on(EVENTS.SETTINGS_CHANGE, handleSettingsChange);
    // Engine emits history:undo / history:redo (EVENTS.HISTORY_UNDO/REDO).
    // The original "undo:applied" / "redo:applied" names matched zero
    // emitters anywhere in the codebase — handler never fired in production.
    composer.on("history:undo", handleUndoRedo);
    composer.on("history:redo", handleUndoRedo);
    composer.on(EVENTS.ELEMENT_CREATED, bumpUsage);
    composer.on(EVENTS.ELEMENT_UPDATED, bumpUsage);
    composer.on(EVENTS.ELEMENT_DELETED, bumpUsage);
    composer.on(EVENTS.STYLE_CHANGED, bumpUsage);
    composer.on(EVENTS.STYLE_APPLIED, bumpUsage);
    return () => {
      composer.off(EVENTS.PROJECT_LOADED, handleProjectLoaded);
      composer.off(EVENTS.SETTINGS_CHANGE, handleSettingsChange);
      composer.off("history:undo", handleUndoRedo);
      composer.off("history:redo", handleUndoRedo);
      composer.off(EVENTS.ELEMENT_CREATED, bumpUsage);
      composer.off(EVENTS.ELEMENT_UPDATED, bumpUsage);
      composer.off(EVENTS.ELEMENT_DELETED, bumpUsage);
      composer.off(EVENTS.STYLE_CHANGED, bumpUsage);
      composer.off(EVENTS.STYLE_APPLIED, bumpUsage);
    };
  }, [composer, loadFromComposer, addToast]);

  // ─ Section switching with guard ─
  const handleSectionClick = (s: DesignSection) => {
    if (s === activeSection) return;
    if (isDirty) {
      setPendingSection(s);
      setShowSectionGuard(true);
    } else {
      setActiveSection(s);
    }
  };

  // DD3 a11y baseline: WAI-ARIA tablist keyboard nav. Arrow keys cycle;
  // Home/End jump to ends. Auto-activation on focus matches the spec
  // pattern for tabsets where panel mounts are cheap.
  const handleSectionKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    const idx = SECTIONS.findIndex((s) => s.id === activeSection);
    if (idx < 0) return;
    let nextIdx = idx;
    switch (e.key) {
      case "ArrowRight": nextIdx = (idx + 1) % SECTIONS.length; break;
      case "ArrowLeft":  nextIdx = (idx - 1 + SECTIONS.length) % SECTIONS.length; break;
      case "Home":       nextIdx = 0; break;
      case "End":        nextIdx = SECTIONS.length - 1; break;
      default: return;
    }
    e.preventDefault();
    handleSectionClick(SECTIONS[nextIdx].id);
    // Move focus to the newly-active tab so screen readers announce it.
    const next = e.currentTarget.parentElement?.querySelector<HTMLButtonElement>(
      `[data-section-id="${SECTIONS[nextIdx].id}"]`,
    );
    next?.focus();
  };

  const handleGuardDiscard = () => {
    allRegistries.forEach((r) => r.discardAll());
    allPresetRegistries.forEach((r) => r.discardAll());
    setShowSectionGuard(false);
    if (pendingSection) { setActiveSection(pendingSection); setPendingSection(null); }
  };

  const handleGuardKeep = () => {
    setShowSectionGuard(false);
    setPendingSection(null);
  };

  const handleGuardSaveAndSwitch = () => {
    handleApply();
    setShowSectionGuard(false);
    if (pendingSection) { setActiveSection(pendingSection); setPendingSection(null); }
  };

  // ─ Apply ─
  const handleApply = () => {
    if (!composer) return;
    const allTokens: DesignToken[] = allRegistries.flatMap((r) => r.tokens);
    const validCategories: DesignTokenRecord["category"][] = [
      "colors", "typography", "spacing", "effects",
      "layout", "icons", "buttons", "forms", "theme",
    ];
    const tokenRecords: DesignTokenRecord[] = allTokens
      .filter((t): t is DesignToken & { category: DesignTokenRecord["category"] } =>
        validCategories.includes(t.category as DesignTokenRecord["category"])
      )
      .map((t) => ({
        id: t.id,
        name: t.name,
        value: t.value,
        cssVar: t.cssVar,
        category: t.category,
        type: t.type,
        group: t.group,
      }));

    // S2: pull all 11 preset categories into a flat record array for persistence.
    const allPresets: StylePreset[] = allPresetRegistries.flatMap((r) => r.presets);
    const presetRecords = allPresets.map((p) => ({
      id: p.id, friendlyName: p.friendlyName, category: p.category,
      variant: p.variant, bindings: p.bindings,
    }));

    try {
      const current = composer.getProjectSettings();
      composer.setProjectSettings({
        ...current,
        designTokens: tokenRecords,
        designTokensSchemaVersion: CURRENT_SCHEMA_VERSION,
        designPresets: presetRecords,
      });
      persistAll();
      persistAllPresets();
      allRegistries.forEach((r) => r.markSaved());
      allPresetRegistries.forEach((r) => r.markSaved());
      setShowReview(false);
      setIsFirstLoad(false);
      addToast({ description: "Design tokens applied successfully", tone: "success" });
    } catch {
      addToast({ description: "Failed to apply tokens. Try again.", tone: "error" });
    }
  };

  // ─ Discard ─
  const handleDiscard = () => {
    const flat = allRegistries.flatMap((r) =>
      r.tokens
        .filter((t) => {
          const saved = r.savedTokens.find((s) => s.id === t.id);
          return saved !== undefined && t.value !== saved.value;
        })
        .map((t) => ({ id: t.id, value: t.value, registry: r }))
    );
    const count = totalDirty;

    allRegistries.forEach((r) => r.discardAll());
    allPresetRegistries.forEach((r) => r.discardAll());

    addToast({
      description: `${count} change${count !== 1 ? "s" : ""} discarded`,
      tone: "info",
      action: {
        label: "Undo",
        onClick: () => {
          flat.forEach(({ id, value, registry }) => registry.updateToken(id, value));
        },
      },
    });
  };

  const handleExport = (format: ExportFormat) => {
    const allTokens: DesignToken[] = allRegistries.flatMap((r) => r.tokens);
    const { content, filename } = buildExport(allTokens, format);
    downloadFile(content, filename);
    addToast({ description: `Exported ${filename}`, tone: "success" });
  };

  // C3 fix: factory-reset spacing (stages defaults for Review/Apply, not discardAll).
  const handleResetSpacingToDefaults = () => {
    spacing.stageDefaults(DEFAULT_TOKENS);
    addToast({ description: "Spacing reset to defaults — review and Apply to save.", tone: "info" });
  };

  const handleAddToken = (name: string, hex: string) => {
    const newToken: DesignToken = {
      id: generateColorTokenId(name),
      name,
      value: hex,
      category: "colors",
      cssVar: generateColorCssVar(name),
      type: "color",
      group: "brand",
    };
    color.addToken(newToken);
    setShowAddToken(false);
    addToast({ description: `Token "${name}" added`, tone: "success" });
  };

  // Short titles — the section tablist below the toolbar row already shows
  // Tokens / Styles / Components / Export, so the header just needs the panel
  // identity ("Brand" per Figma board 52:2 rail naming, P1 convergence).
  const headerTitle = "Brand";

  const changedSectionLabels = isDirty ? ["Tokens"] : [];

  return (
    <div data-ds-preview={resolvedMode} style={{ ...containerStyles, position: "relative" }}>
      <PanelHeader
        title={headerTitle}
        isPinned={isPinned}
        onPinToggle={onPinToggle}
        onHelpClick={onHelpClick}
        onClose={onClose}
      >
        <div aria-live="polite" aria-atomic="true" style={{ marginRight: 4 }}>
          <DraftChip state={isDirty ? "dirty" : "saved"} count={totalDirty} />
        </div>
      </PanelHeader>

      {/* Redesign P4 (ds2): two homes for styling. Everyday styling = these tokens
          (the 3-reach editor). The brand source = the workspace shared theme, which
          lives dashboard-side and client sites sync from or override. Surface that
          relationship + a link out, instead of pretending the DS tab is the only home. */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 12px",
          borderBottom: "1px solid var(--bk-border)",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--bk-ink)" }}>Brand &amp; shared theme</div>
          <div style={{ fontSize: 10, color: "var(--bk-ink-muted)", lineHeight: 1.4 }}>
            Everyday styling lives here. The brand syncs from your workspace shared theme.
          </div>
        </div>
        <Button
          kind="secondary"
          size="sm"
          onClick={() => window.open(`${DASHBOARD_URL}/dashboard/agency/theme`, "_blank", "noopener")}
          title="Open the workspace shared theme"
          style={{ whiteSpace: "nowrap", flexShrink: 0 }}
        >
          Open Shared theme ↗
        </Button>
      </div>

      {/* Toolbar row — modes + AI + Export. Moved out of PanelHeader actions
          so the 320px DS panel doesn't overflow (title was wrapping under
          the action cluster). */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 12px",
          borderBottom: "1px solid var(--bk-border)",
          background: "var(--bk-bg-subtle)",
          flexShrink: 0,
          flexWrap: "wrap",
        }}
      >
        <DSModeToggle />
        {composer && composer.colorMode ? <ColorModeToggle composer={composer} /> : null}
        <span style={{ flex: 1 }} />
        {/* Browse themes — re-opens StarterGalleryModal after the 2026-05-22
            D3 onboarding fix hid the auto-open. StarterGalleryMount in
            StudioPanels subscribes to EVENTS.UI_OPEN_STARTERS. */}
        <Button
          type="button"
          kind="ghost"
          onClick={() => composer?.emit(EVENTS.UI_OPEN_STARTERS, {})}
          aria-label="Browse starter themes"
          title="Browse starter themes"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 28,
            height: 24,
            background: "transparent",
            border: "1px solid var(--bk-border)",
            borderRadius: "var(--bk-radius-md)",
            cursor: "pointer",
            color: "var(--bk-ink-muted)",
            fontSize: 14,
          }}
        >
          {"🎨"}
        </Button>
        <Button
          type="button"
          kind="ghost"
          data-ai-entry
          onClick={() => setAiOpen(true)}
          aria-label="Open AI assist"
          title="AI assist · component schema generate"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 28,
            height: 24,
            background: "transparent",
            border: "1px solid var(--bk-border)",
            borderRadius: 6,
            cursor: "pointer",
            color: "var(--bk-ink-muted)",
            fontSize: 14,
          }}
        >
          {"✨"}
        </Button>
        <ExportDropdown
          onExport={handleExport}
          isDirty={isDirty}
          onSaveFirst={() => setShowReview(true)}
        />
      </div>

      <DSLintMount composer={composer} />

      {/* Section switcher — WAI-ARIA tablist (DD3 a11y baseline) */}
      <div
        role="tablist"
        aria-label="Design workspace sections"
        style={{
          display: "flex",
          padding: "8px 12px 0",
          gap: 2,
          borderBottom: "1px solid var(--bk-border)",
          background: "var(--bk-bg-subtle)",
          flexShrink: 0,
        }}
      >
        {SECTIONS.map((s) => {
          const dirtyHere =
            (s.id === "tokens" && tokensDirty > 0) ||
            (s.id === "styles" && stylesDirty > 0);
          const selected = activeSection === s.id;
          return (
            <Button
              key={s.id}
              kind="ghost"
              role="tab"
              id={`design-tab-${s.id}`}
              aria-selected={selected}
              aria-controls={`design-tabpanel-${s.id}`}
              tabIndex={selected ? 0 : -1}
              data-section-id={s.id}
              onClick={() => handleSectionClick(s.id)}
              onKeyDown={handleSectionKeyDown}
              style={{
                height: 36,
                padding: "0 12px",
                borderRadius: "var(--bk-radius-md) var(--bk-radius-md) 0 0",
                border: "none",
                background: "transparent",
                color: activeSection === s.id ? "var(--bk-ink)" : "var(--bk-ink-muted)",
                fontSize: 13,
                fontWeight: activeSection === s.id ? 500 : 400,
                cursor: "pointer",
                borderBottom:
                  activeSection === s.id ? "2px solid var(--bk-accent)" : "2px solid transparent",
                transition: "color 0.15s",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              {s.label}
              {dirtyHere && (
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "var(--bk-radius-full)",
                    background: "var(--bk-warning)",
                    flexShrink: 0,
                  }}
                  aria-label="unsaved changes"
                />
              )}
            </Button>
          );
        })}
      </div>

      <div
        style={{
          padding: "5px 12px",
          fontSize: 12,
          color: "var(--bk-ink-muted)",
          background: "var(--bk-bg-subtle)",
          borderBottom: "1px solid var(--bk-border)",
          flexShrink: 0,
        }}
      >
        Changes here apply to every page on your site
        {totalUsageCount > 0 && (
          <span style={{ marginLeft: 6 }}>
            · {totalUsageCount} token binding{totalUsageCount === 1 ? "" : "s"} in use
          </span>
        )}
      </div>

      {error ? (
        <PanelErrorState
          message={error}
          onRetry={() => { setError(null); loadFromComposer(); }}
        />
      ) : (
        <div
          role="tabpanel"
          id={`design-tabpanel-${activeSection}`}
          aria-labelledby={`design-tab-${activeSection}`}
          style={sectionBodyStyles}
        >
          {isFirstLoad && activeSection === "tokens" && (
            <div
              style={{
                margin: "10px 10px 0",
                padding: "8px 12px",
                background: "var(--bk-accent-tint, rgba(45,109,255,0.07))",
                border: "1px solid var(--bk-accent-tint, rgba(45,109,255,0.2))",
                borderRadius: 8,
              }}
            >
              <span style={{ fontSize: 12, color: "var(--bk-ink)", lineHeight: 1.6 }}>
                These are your site's default design tokens. Customize them and click{" "}
                <strong>Review &amp; Apply</strong> to go live.
              </span>
            </div>
          )}

          {activeSection === "tokens" && (
            <TokensSection
              onAddTokenClick={() => setShowAddToken(true)}
              onResetSpacingToDefaults={handleResetSpacingToDefaults}
              composer={composer}
            />
          )}
          {activeSection === "styles"     && <StylesSection />}
          {activeSection === "components" && (
            <ComponentsSection
              composer={composer}
              onOpenAIAssist={() => setAiOpen(true)}
            />
          )}
          {activeSection === "export"     && <ExportSection />}
        </div>
      )}

      <DesignTabFooter
        isDirty={isDirty}
        dirtyCount={totalDirty}
        onDiscard={handleDiscard}
        onReview={() => setShowReview(true)}
      />

      {showSectionGuard && (
        <TabGuardModal
          changedTabs={changedSectionLabels}
          onDiscard={handleGuardDiscard}
          onKeep={handleGuardKeep}
          onSaveAndSwitch={handleGuardSaveAndSwitch}
        />
      )}
      {showReview && (
        <ReviewModal
          colorTokens={color.tokens}
          colorDiff={color.pendingDiff}
          typeTokens={type.tokens}
          typeSavedTokens={type.savedTokens}
          spacingTokens={spacing.tokens}
          spacingSavedTokens={spacing.savedTokens}
          onConfirm={handleApply}
          onClose={() => setShowReview(false)}
        />
      )}
      {showAddToken && (
        <AddTokenModal
          existingIds={color.tokens.map((t) => t.id)}
          onAdd={handleAddToken}
          onClose={() => setShowAddToken(false)}
        />
      )}
      <AIPromptModal
        open={aiOpen}
        onOpenChange={setAiOpen}
        service={composer?.aiAssistService ?? null}
        onAccept={() => {
          // Acceptance routes the generated schema into the component catalog
          // in a follow-up arc; modal closes itself via onOpenChange(false).
        }}
      />
    </div>
  );
};

export default DesignSystemTab;
