/**
 * DesignSystemTab v12 — Tokens / Styles / Components / Export
 * 4-section workspace. Aggregates dirty state across all 14 token registries.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { PanelHeader, useToast, Button } from "@/editor/chrome-ui";
import { PanelErrorState } from "../../../editor/sidebar/shared/PanelErrorState";
import type { Composer } from "../../../engine/Composer";
import { EVENTS } from "../../../shared/constants/events";
import type { DesignTokenRecord } from "../../../shared/types/project";
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

const PANEL = "tw:relative tw:flex tw:flex-col tw:h-full tw:bg-[var(--bk-bg-subtle)]";
const SECTION_BODY = "tw:flex-1 tw:overflow-auto tw:p-3";
/** Header strip shared by the brand banner, the toolbar and the tablist. */
const STRIP = "tw:flex tw:items-center tw:flex-none tw:border-b tw:border-gray-200";
/** Square icon button in the toolbar (themes, AI). */
const TOOL_BTN =
  "tw:inline-flex tw:items-center tw:justify-center tw:w-7 tw:h-6 tw:p-0 tw:rounded-md " +
  "tw:border tw:border-gray-200 tw:bg-transparent tw:text-sm tw:text-gray-500 tw:hover:bg-gray-100";
const SECTION_TAB =
  "tw:flex tw:items-center tw:gap-[5px] tw:h-9 tw:px-3 tw:rounded-t-md tw:rounded-b-none " +
  "tw:border-0 tw:border-b-2 tw:bg-transparent tw:text-[13px]";

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
  isExpanded?: boolean;
  onExpandToggle?: () => void;
  onHelpClick?: () => void;
  onClose?: () => void;
}

export const DesignSystemTab: React.FC<DesignSystemTabProps> = ({
  composer,
  isExpanded,
  onExpandToggle,
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
    <div data-ds-preview={resolvedMode} className={PANEL}>
      <PanelHeader
        title={headerTitle}
        isExpanded={isExpanded}
        onExpandToggle={onExpandToggle}
        onHelpClick={onHelpClick}
        onClose={onClose}
      >
        <div aria-live="polite" aria-atomic="true" className="tw:mr-1">
          <DraftChip state={isDirty ? "dirty" : "saved"} count={totalDirty} />
        </div>
      </PanelHeader>

      {/* Redesign P4 (ds2): two homes for styling. Everyday styling = these tokens
          (the 3-reach editor). The brand source = the workspace shared theme, which
          lives dashboard-side and client sites sync from or override. Surface that
          relationship + a link out, instead of pretending the DS tab is the only home. */}
      <div
        className={`${STRIP} tw:gap-2 tw:px-3 tw:py-2`}
      >
        <div className="tw:flex-1 tw:min-w-0">
          <div className="tw:text-[11px] tw:font-semibold tw:text-gray-900">Brand &amp; shared theme</div>
          <div className="tw:text-[10px] tw:leading-snug tw:text-gray-500">
            Everyday styling lives here. The brand syncs from your workspace shared theme.
          </div>
        </div>
        <Button
          color="light"
          size="xs"
          onClick={() => window.open(`${DASHBOARD_URL}/dashboard/agency/theme`, "_blank", "noopener")}
          title="Open the workspace shared theme"
          className="tw:flex-none tw:whitespace-nowrap"
        >
          Open Shared theme ↗
        </Button>
      </div>

      {/* Toolbar row — modes + AI + Export. Moved out of PanelHeader actions
          so the 320px DS panel doesn't overflow (title was wrapping under
          the action cluster). */}
      <div
        className={`${STRIP} tw:flex-wrap tw:gap-1.5 tw:px-3 tw:py-1.5 tw:bg-[var(--bk-bg-subtle)]`}
      >
        <DSModeToggle />
        {composer && composer.colorMode ? <ColorModeToggle composer={composer} /> : null}
        <span className="tw:flex-1" />
        {/* Browse themes — re-opens StarterGalleryModal after the 2026-05-22
            D3 onboarding fix hid the auto-open. StarterGalleryMount in
            StudioPanels subscribes to EVENTS.UI_OPEN_STARTERS. */}
        <Button
          type="button"
          color="light"
          onClick={() => composer?.emit(EVENTS.UI_OPEN_STARTERS, {})}
          aria-label="Browse starter themes"
          title="Browse starter themes"
          className={TOOL_BTN}
        >
          {"🎨"}
        </Button>
        <Button
          type="button"
          color="light"
          data-ai-entry
          onClick={() => setAiOpen(true)}
          aria-label="Open AI assist"
          title="AI assist · component schema generate"
          className={TOOL_BTN}
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
        className={`${STRIP} tw:gap-0.5 tw:px-3 tw:pt-2 tw:bg-[var(--bk-bg-subtle)]`}
      >
        {SECTIONS.map((s) => {
          const dirtyHere =
            (s.id === "tokens" && tokensDirty > 0) ||
            (s.id === "styles" && stylesDirty > 0);
          const selected = activeSection === s.id;
          return (
            <Button
              key={s.id}
              color="light"
              role="tab"
              id={`design-tab-${s.id}`}
              aria-selected={selected}
              aria-controls={`design-tabpanel-${s.id}`}
              tabIndex={selected ? 0 : -1}
              data-section-id={s.id}
              onClick={() => handleSectionClick(s.id)}
              onKeyDown={handleSectionKeyDown}
              className={`${SECTION_TAB} ${
                selected
                  ? "tw:border-b-blue-700 tw:font-medium tw:text-gray-900"
                  : "tw:border-b-transparent tw:font-normal tw:text-gray-500 tw:hover:text-gray-900"
              }`}
            >
              {s.label}
              {dirtyHere && (
                <span
                  className="tw:size-[5px] tw:flex-none tw:rounded-full tw:bg-[var(--bk-warning)]"
                  aria-label="unsaved changes"
                />
              )}
            </Button>
          );
        })}
      </div>

      <div
        className="tw:flex-none tw:px-3 tw:py-[5px] tw:border-b tw:border-gray-200 tw:bg-[var(--bk-bg-subtle)] tw:text-xs tw:text-gray-500"
      >
        Changes here apply to every page on your site
        {totalUsageCount > 0 && (
          <span className="tw:ml-1.5">
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
          className={SECTION_BODY}
        >
          {isFirstLoad && activeSection === "tokens" && (
            <div className="tw:mx-2.5 tw:mt-2.5 tw:px-3 tw:py-2 tw:rounded-lg tw:border tw:border-[var(--bk-accent-tint)] tw:bg-[var(--bk-accent-tint)]">
              <span className="tw:text-xs tw:leading-relaxed tw:text-gray-900">
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
