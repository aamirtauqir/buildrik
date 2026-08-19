/**
 * DesignSystemTab — the Brand panel.
 *
 * A drill-in root (M5) over seven destinations: Tokens · Presets · Starters ·
 * Components · Colour mode · Lint · Import / export. Aggregates dirty state
 * across all 14 token registries and all 11 preset registries.
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
import { CURRENT_SCHEMA_VERSION } from "../migrations";
import { mergeProjectTokens } from "../state/projectTokens";
import {
  buildExport,
  downloadFile,
  generateColorTokenId,
  generateColorCssVar,
} from "../utils/exportUtils";
import type { ExportFormat } from "../utils/exportUtils";
import { APPLY_CHANGES_LABEL, DesignTabFooter } from "./DesignTabFooter";
import { DraftChip } from "./DraftChip";
import { DSModeToggle } from "./DSModeToggle";
import { useDSModeOptional } from "../state/DSModeContext";
import { AIPromptModal } from "./AIPromptModal";
import { AddTokenModal } from "./modals/AddTokenModal";
import { ReviewModal } from "./modals/ReviewModal";
import { TabGuardModal } from "./modals/TabGuardModal";
import { TokensSection } from "./sections/TokensSection";
import { StylesSection, useStylesSectionTotalDirty } from "./sections/StylesSection";
import { ComponentsSection } from "./sections/ComponentsSection";
import { ExportSection } from "./sections/ExportSection";
import { STARTER_DS_REGISTRY } from "../starters";
import { CATALOG } from "../../components-catalog/catalog";
import { LintSection } from "./sections/LintSection";
import { filterTokensByMode } from "../utils/semanticKind";
import { ClassesSection } from "./sections/ClassesSection";
import { TypographySection } from "./sections/TypographySection";
import { StartersSection } from "./sections/StartersSection";
import { ColourModeSection } from "./sections/ColourModeSection";
import { useDSLint } from "../state/useDSLint";
// ─── Layout ───────────────────────────────────────────────────────────────────

const PANEL = "tw:relative tw:flex tw:flex-col tw:h-full tw:bg-[var(--bk-bg-subtle)]";
const SECTION_BODY = "tw:flex-1 tw:overflow-auto tw:p-3";
/** Header strip shared by the brand banner, the toolbar and the crumb. */
const STRIP = "tw:flex tw:items-center tw:flex-none tw:border-b tw:border-gray-200";
/** Square icon button in the toolbar (themes, AI). */
const TOOL_BTN =
  "tw:inline-flex tw:items-center tw:justify-center tw:w-7 tw:h-6 tw:p-0 tw:rounded-md " +
  "tw:border tw:border-gray-200 tw:bg-transparent tw:text-sm tw:text-gray-500 tw:hover:bg-gray-100";
/** Back crumb inside a destination — board 153:2 draws `‹ <Section>` in accent. */
const CRUMB =
  "tw:flex tw:items-center tw:gap-[5px] tw:h-auto tw:px-0 tw:border-0 tw:bg-transparent " +
  "tw:text-[13px] tw:font-normal tw:text-[var(--bk-accent)] tw:hover:underline";

// ─── Section types ────────────────────────────────────────────────────────────

type DesignSection = "tokens" | "typography" | "styles" | "starters" | "classes" | "components" | "colour-mode" | "lint" | "export";

/**
 * Brand root — a drill-in list, not a tab bar (M5).
 *
 * Board `Brand · root` (g4Gz… 152:2) draws nine peer destinations with a `›`
 * chevron each. The code had four tabs plus a modal (Starters), a toggle
 * (Colour mode) and a banner (Lint) — same capabilities, different mental
 * model. Figma owns navigation (rule 2), and the sidebar is drill-in stack nav.
 *
 * All nine of the board's rows ship. Starters and Colour mode joined later in
 * the same arc — Starters once the board settled that it is a destination and
 * not a modal, Colour mode once the dark-value write path was repaired (it had
 * an empty onBlur that discarded what you typed, so the screen had nothing to
 * write through). Classes and Typography followed: Classes reads the classes
 * elements actually carry, and Typography lists the site's active fonts. (This
 * paragraph said "two rows remain out" long after both had shipped.)
 *
 * Row counts follow the board, which draws one on Tokens, Presets, Starters,
 * Classes, Components and Lint — and not on Typography, Colour mode or
 * Import / export. Its numbers are the real registries: Starters 6 is
 * `STARTER_DS_REGISTRY.length` and Components 27 is `CATALOG.length`. A count
 * still has to be the truth; the rule that a row which cannot answer its own
 * question is worse than no row stands — it just no longer excuses a row whose
 * number is one property away.
 */
/* Board 152:2's order, top to bottom. Typography used to sit second here and
   sits sixth on the board — the list is the whole screen, so its order is the
   layout. */
const SECTIONS: Array<{ id: DesignSection; label: string; hint: string }> = [
  { id: "tokens",     label: "Tokens",          hint: "Colours, type, spacing" },
  { id: "styles",     label: "Presets",         hint: "Component style presets" },
  { id: "starters",   label: "Starters",        hint: "Whole-brand starting points" },
  { id: "classes",    label: "Classes",         hint: "Names shared across elements" },
  { id: "components", label: "Components",      hint: "What the brand ships" },
  { id: "typography", label: "Typography",      hint: "The fonts this site uses" },
  { id: "colour-mode", label: "Colour mode",    hint: "Light and dark values" },
  { id: "lint",       label: "Lint",            hint: "What breaks the brand" },
  { id: "export",     label: "Import / export", hint: "Move the brand in and out" },
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
  /** Scopes the starter token blob in storage — Starters is a destination now. */
  projectId?: string | null;
  isExpanded?: boolean;
  onExpandToggle?: () => void;
  onHelpClick?: () => void;
  onClose?: () => void;
}

export const DesignSystemTab: React.FC<DesignSystemTabProps> = ({
  composer,
  projectId,
  isExpanded,
  onExpandToggle,
  onHelpClick,
  onClose,
}) => {
  const { addToast } = useToast();
  const isBeginner = useDSModeOptional()?.mode !== "pro";
  /* Shared with DSLintBanner via `useDSLint` so the row count, the banner and
     the Lint destination can never disagree. */
  const lintIssues = useDSLint(composer);
  /* Board 306:2217 puts a "Warnings suppressed" pill on the root. Read here
     rather than stored: `useDSLint` re-renders this component whenever
     `lint:changed` fires, which is every suppress and unsuppress. */
  const suppressedCount = composer?.designSystem?.lintState?.suppressedCount?.() ?? 0;
  /* Which token KIND is open inside the Tokens destination (board 152:52 ->
     152:83). Held here so the panel renders ONE crumb — the board draws
     `‹ Tokens · color`, not a second crumb stacked under the first. */
  const [tokenKind, setTokenKind] = React.useState<string | null>(null);
  /* null = the Brand root list. Every destination is entered from it (M5). */
  const [activeSection, setActiveSection] = React.useState<DesignSection | null>(null);
  /* "root" is a real target (Back), so it cannot be modelled as null — null
     already means "nothing pending". */
  const [pendingSection, setPendingSection] = React.useState<DesignSection | "root" | null>(null);
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

  /* Board 152:2 puts a count on every row that has one — "Tokens 14",
     "Presets 18", "Classes 12". The docblock above this file says a count
     that is not the truth is worse than none, which is why Lint carried the
     only one; these three are counted from the same sources the screens
     themselves render, so they are the truth. Starters and Components stay
     bare until their own registries can answer. */
  const sectionCounts = React.useMemo<Partial<Record<DesignSection, number>>>(() => {
    /* The same filter the Tokens screen applies to its own rows. Beginner
       mode lists semantic tokens only, so counting every registry entry here
       put "Tokens 55" on the root above a screen that showed 4 — the row and
       its destination disagreeing about the same number. */
    const mode = isBeginner ? "beginner" : "pro";
    const tokens = allRegistries.reduce(
      (n, r) => n + filterTokensByMode(r.tokens ?? [], mode).length,
      0,
    );
    const presets = allPresetRegistries.reduce((n, r) => n + (r.presets?.length ?? 0), 0);
    const classNames = new Set<string>();
    for (const el of composer?.elements?.getAllElements?.() ?? []) {
      for (const cls of el.getClasses?.() ?? []) {
        const name = String(cls).trim();
        if (name) classNames.add(name);
      }
    }
    /* Board 152:2 draws a count on Starters and Components too, and its
       numbers are not sample data: 6 is `STARTER_DS_REGISTRY.length` and 27 is
       `CATALOG.length` to the digit. Both rows shipped countless — the only
       two rows on the board that carry a number and did not here. */
    /* Board 154:132 is this same list in Basic mode, and it carries no count
       on Classes or Components — the two rows whose contents Basic cannot
       edit. Its own footer says why: "Basic mode hides what you cannot edit
       yet." A number for something you cannot touch is the noise that note is
       about. Board 152:2 (Pro) shows both. */
    if (isBeginner) {
      return { tokens, styles: presets, starters: STARTER_DS_REGISTRY.length };
    }
    return {
      tokens,
      styles: presets,
      classes: classNames.size,
      starters: STARTER_DS_REGISTRY.length,
      components: CATALOG.length,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allRegistries, allPresetRegistries, composer, usageVersion, isBeginner]);

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
        // The merge itself lives in state/projectTokens so ProjectTokensApplier —
        // which runs this at project load, not at panel mount — shares it.
        const merged = mergeProjectTokens(
          settings.designTokens as unknown as DesignToken[],
          storedVersion
        );
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

  /* Navigation with the unsaved-changes guard. "root" is Back, and it is
     guarded like any other move — leaving a dirty section by the back button
     loses exactly as much work as leaving it sideways did. The arrow-key
     tablist handler that used to live here went with the tab bar: a drill-in
     list is a list of buttons and gets Tab, not roving focus. */
  const handleSectionClick = (s: DesignSection | "root") => {
    const target = s === "root" ? null : s;
    if (target === activeSection) return;
    if (isDirty) {
      setPendingSection(s);
      setShowSectionGuard(true);
    } else {
      setTokenKind(null);
      setActiveSection(target);
    }
  };

  const handleGuardDiscard = () => {
    allRegistries.forEach((r) => r.discardAll());
    allPresetRegistries.forEach((r) => r.discardAll());
    setShowSectionGuard(false);
    if (pendingSection) {
      setActiveSection(pendingSection === "root" ? null : pendingSection);
      setPendingSection(null);
    }
  };

  const handleGuardKeep = () => {
    setShowSectionGuard(false);
    setPendingSection(null);
  };

  const handleGuardSaveAndSwitch = () => {
    handleApply();
    setShowSectionGuard(false);
    if (pendingSection) {
      setActiveSection(pendingSection === "root" ? null : pendingSection);
      setPendingSection(null);
    }
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

      {/* Board note: every one of this family's destination boards — 152:52
          tokens, 153:2 classes, 154:2 lint — starts at its own back link. The
          three strips below (shared-theme, toolbar, lint card) used to render
          on every screen, spending about 300px of an 812px panel before the
          screen's own content began. They belong to the root. */}
      {activeSection === null && (
        <>
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

      {/* Board 152:2 draws the root as a list and nothing else. What used to
          sit above it has a destination of its own on the boards: Light/Dark
          is the Colour mode screen's own control (153:92), Export belongs to
          Import / export (153:120), the starter gallery is the Starters row,
          and the lint card repeated the Lint row's count. Only the mode
          toggle stays, because Basic/Pro changes what the rest of the panel
          offers and has no other route. */}
      <div
        className={`${STRIP} tw:flex-wrap tw:gap-1.5 tw:px-3 tw:py-1.5 tw:bg-[var(--bk-bg-subtle)]`}
      >
        <DSModeToggle />
        <span className="tw:flex-1" />
      </div>

        </>
      )}

      {/* Breadcrumb — only inside a destination. Board 152:2 draws no crumb at
          the root, and 153:2 draws `‹ <Section>` inside one. */}
      {activeSection && (
        <div className={`${STRIP} tw:px-3 tw:py-2 tw:bg-[var(--bk-bg-subtle)]`}>
          <Button
            color="light"
            data-crumb-back=""
            onClick={() => {
              /* Back walks ONE level: out of the open token kind first, then
                 out of the destination. */
              if (activeSection === "tokens" && tokenKind) setTokenKind(null);
              else handleSectionClick("root");
            }}
            className={CRUMB}
          >
            ‹ {SECTIONS.find((s) => s.id === activeSection)?.label}
            {activeSection === "tokens" && tokenKind ? ` · ${tokenKind}` : ""}
          </Button>
        </div>
      )}

      {error ? (
        /* Board 781:4311's copy: what failed, and — the half that matters —
           that nothing was lost. The raw exception text said neither. */
        <PanelErrorState
          title="Couldn't load your brand system."
          message="Your tokens are safe — only this list failed to load."
          onRetry={() => { setError(null); loadFromComposer(); }}
        />
      ) : (
        <div id={`design-section-${activeSection ?? "root"}`} className={SECTION_BODY}>
          {/* Brand root — the drill-in list (M5, board 152:2) */}
          {activeSection === null && suppressedCount > 0 ? (
            <div className="tw:px-3 tw:pb-2">
              <span
                role="status"
                className="tw:inline-flex tw:items-center tw:rounded-full tw:border tw:border-[var(--bk-warning-text)] tw:bg-[var(--bk-warning-tint)] tw:px-2.5 tw:py-0.5 tw:text-xs tw:text-[var(--bk-warning-text)]"
              >
                Warnings suppressed
              </span>
            </div>
          ) : null}

          {activeSection === null && (
            <ul className="tw:flex tw:flex-col tw:gap-0.5 tw:list-none tw:m-0 tw:p-0">
              {SECTIONS.map((s) => {
                const dirtyHere =
                  (s.id === "tokens" && tokensDirty > 0) ||
                  (s.id === "styles" && stylesDirty > 0);
                return (
                  <li key={s.id}>
                    <Button
                      color="light"
                      data-section-id={s.id}
                      onClick={() => handleSectionClick(s.id)}
                      className="tw:flex tw:w-full tw:items-center tw:gap-2 tw:justify-between tw:h-auto tw:px-2 tw:py-2 tw:rounded-md tw:border-0 tw:bg-transparent tw:text-left tw:hover:bg-gray-100"
                    >
                      <span className="tw:flex tw:items-center tw:gap-[5px] tw:min-w-0 tw:text-[13px] tw:text-gray-900">
                        {s.label}
                        {dirtyHere && (
                          <span
                            className="tw:size-[5px] tw:flex-none tw:rounded-full tw:bg-[var(--bk-warning)]"
                            aria-label="unsaved changes"
                          />
                        )}
                      </span>
                      <span className="tw:flex tw:flex-none tw:items-center tw:gap-1.5">
                        {(s.id === "lint" ? lintIssues.length : sectionCounts[s.id]) ? (
                          <span className="tw:text-xs tw:text-gray-500">
                            {s.id === "lint" ? lintIssues.length : sectionCounts[s.id]}
                          </span>
                        ) : null}
                        <span aria-hidden="true" className="tw:text-gray-400">›</span>
                      </span>
                    </Button>
                  </li>
                );
              })}
              {/* Board 154:132 is the root in Basic mode, and the only thing
                  that distinguishes it is this line. Without it the mode simply
                  shows less with no reason given, which reads as missing
                  features rather than a setting the user can change. */}
              {isBeginner && (
                <li className="tw:mt-3 tw:px-2 tw:text-xs tw:leading-normal tw:text-gray-500" data-basic-mode-note>
                  Basic mode hides what you cannot edit yet. Switch to Pro to unlock.
                </li>
              )}
            </ul>
          )}

          {isFirstLoad && activeSection === "tokens" && (
            <div className="tw:mx-2.5 tw:mt-2.5 tw:px-3 tw:py-2 tw:rounded-lg tw:border tw:border-[var(--bk-accent-tint)] tw:bg-[var(--bk-accent-tint)]">
              <span className="tw:text-xs tw:leading-relaxed tw:text-gray-900">
                These are your site's default design tokens. Customize them and click{" "}
                <strong>{APPLY_CHANGES_LABEL}</strong> to go live.
              </span>
            </div>
          )}

          {activeSection === "tokens" && (
            <TokensSection
              onAddTokenClick={() => setShowAddToken(true)}
              onResetSpacingToDefaults={handleResetSpacingToDefaults}
              composer={composer}
              openKind={tokenKind as never}
              onOpenKind={(k) => setTokenKind(k)}
            />
          )}
          {activeSection === "styles"     && <StylesSection />}
          {activeSection === "components" && (
            <ComponentsSection
              composer={composer}
              onOpenAIAssist={() => setAiOpen(true)}
            />
          )}
          {activeSection === "starters"   && <StartersSection projectId={projectId} />}
          {activeSection === "classes"    && <ClassesSection composer={composer} />}
          {activeSection === "typography" && <TypographySection composer={composer} />}
          {activeSection === "colour-mode" && <ColourModeSection composer={composer} />}
          {activeSection === "lint"       && <LintSection issues={lintIssues} />}
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
          /* Board 1172:4840's third door. The same discard the footer runs,
             with its undo toast — reachable from the review, which is where
             someone decides they do not want these edits after all. */
          onDiscardAll={() => {
            setShowReview(false);
            handleDiscard();
          }}
          usageCount={(() => {
            let n = 0;
            for (const set of usageMap.values()) n += set.size;
            return n;
          })()}
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
        /* No onAccept: there is nowhere for the schema to go yet. It is a
           preset BINDING schema ({componentTypeId, variants, bindings}), not an
           element tree, so ComponentManager.createComponent — which needs an
           existing elementId — is the wrong target; the real home is the style
           preset registries, and mapping into them is a feature, not a wiring.
           Omitting the prop hides the Accept button, where before it rendered,
           took the click and dropped the schema. */
      />
    </div>
  );
};

export default DesignSystemTab;
