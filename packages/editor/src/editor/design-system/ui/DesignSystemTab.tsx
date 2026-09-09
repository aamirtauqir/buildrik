/*
 * Board citations here named 152:2 until 2026-09-02. 152:2 is `Brand · root —
 * SUPERSEDED 2026-08-27 by 1333:7162`, and a verifier reported this panel as
 * "NEVER BUILT TO — the code cites 152:2/154:132 and 1333:7162 appears nowhere
 * in src". The second half was true and the first half was not: this file
 * already renders 1333:7162's shape — `BrandPreview` (:704) above nine NAMED
 * rows at `tw:h-13` (52px) whose labels are the board's nine, verbatim. Only
 * the citations were stale, and they are the reason C3 read as a redraw.
 * 154:132 (Basic mode) keeps its number — it is a state of the root, not the root.
 */
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
import { BrandPreview } from "./BrandPreview";
import { SectionStatusBadge, presetsStatus } from "./SectionStatusBadge";
import { TokensSection } from "./sections/TokensSection";
import { StylesSection, useStylesSectionTotalDirty } from "./sections/StylesSection";
import { ComponentsSection } from "./sections/ComponentsSection";
import { isFeatureEnabled } from "@/shared/utils/featureFlags";
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

/* `--bk-bg-panel`, not `--bk-bg-subtle`: every board in this family — 154:26,
   154:78, 154:132, 306:2217, 152:137, 153:2, 306:2049, 781:4311 — fills the
   Brand frame `--color/bg-panel` (white). The drawer under it (`.ls-panel`)
   is already `--bk-bg-card` white, so the grey was this panel's own override
   and made Brand the one drawer in the shell with a tinted body. */
const PANEL = "tw:relative tw:flex tw:flex-col tw:h-full tw:bg-[var(--bk-bg-panel)]";
/* No padding of its own. The boards inset EVERY list row `px-[16px]` from the
   panel edge, and each section below already supplies that inset itself — so a
   12px body pad put the root list at 28 and shrank the Basic-mode note from
   the board's 248 to 224. Sections that leaned on it (Export, Lint) carry
   their own now. */
const SECTION_BODY = "tw:flex-1 tw:overflow-auto";
/** Header strip shared by the brand banner, the toolbar and the crumb. */
const STRIP = "tw:flex tw:items-center tw:flex-none tw:border-b tw:border-[var(--bk-gray-200)]";
/** Square icon button in the toolbar (themes, AI). */
const TOOL_BTN =
  "tw:inline-flex tw:items-center tw:justify-center tw:w-7 tw:h-6 tw:p-0 tw:rounded-md " +
  "tw:border tw:border-[var(--bk-gray-200)] tw:bg-transparent tw:text-sm tw:text-[var(--bk-ink-soft)] tw:hover:bg-[var(--bk-gray-100)]";
/** Back crumb inside a destination — board 153:2 draws `‹ <Section>` in accent. */
/* `leading-5` is load-bearing, not decoration: flowbite's Button base sets
   `text-sm`, whose 20px line-height only survives while the font size is 14.
   At the board's 13px the utility no longer implies it, and the boards state
   13/20 on every crumb they draw (153:8, 152:143, 306:2052, 306:2189). */
const CRUMB =
  "tw:flex tw:items-center tw:gap-[5px] tw:h-auto tw:px-0 tw:border-0 tw:bg-transparent " +
  "tw:text-[13px] tw:leading-5 tw:font-normal tw:text-[var(--bk-accent)] tw:hover:underline";

// ─── Section types ────────────────────────────────────────────────────────────

type DesignSection = "tokens" | "typography" | "styles" | "starters" | "classes" | "components" | "colour-mode" | "lint" | "export";

/**
 * Brand root — a drill-in list, not a tab bar (M5).
 *
 * Board `Brand · root` (g4Gz… 1333:7162) draws nine peer destinations with a `›`
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
/* Board 1333:7162's order, top to bottom. Typography used to sit second here and
   sits sixth on the board — the list is the whole screen, so its order is the
   layout. */
const SECTIONS = [
  { id: "tokens",     label: "Tokens",          hint: "Colours, type, spacing" },
  { id: "styles",     label: "Presets",         hint: "Component style presets" },
  { id: "starters",   label: "Starters",        hint: "Whole-brand starting points" },
  { id: "classes",    label: "Classes",         hint: "Names shared across elements" },
  /* "Component styles", not "Components". Four doors in this product were
     labelled Components and led three different places: Insert's inline
     catalog of placeable components, the site menu's Components panel for
     managing saved ones, and this — the STYLES the brand defines for them.
     A user who wants "components" had to guess which door. This one is the
     odd noun out, and its own hint already said so. */
  { id: "components", label: "Component styles", hint: "What the brand ships" },
  { id: "typography", label: "Typography",      hint: "The fonts this site uses" },
  { id: "colour-mode", label: "Colour mode",    hint: "Light and dark values" },
  { id: "lint",       label: "Lint",            hint: "What breaks the brand" },
  { id: "export",     label: "Import / export", hint: "Move the brand in and out" },
] satisfies ReadonlyArray<{ id: DesignSection; label: string; hint: string }>;

/* The back row renders `‹ ${SECTIONS.find(...)?.label}`, so a section id that
   reaches the drill level without a row here would print a bare `‹` — a crumb
   that names nowhere, on the one control the boards rely on to say where you
   are. The annotation this list used to carry could not catch that: it
   constrained each entry's id to a DesignSection but never required every
   DesignSection to appear. `satisfies` keeps the literal ids, so this line
   fails the build instead. */
type UncoveredSection = Exclude<DesignSection, (typeof SECTIONS)[number]["id"]>;
const _everySectionHasARow: UncoveredSection extends never ? true : UncoveredSection = true;
void _everySectionHasARow;

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

  /* Board 1333:7162 puts a count on every row that has one — "Tokens 14",
     "Presets 18", "Classes 12". The docblock above this file says a count
     that is not the truth is worse than none, which is why Lint carried the
     only one; these three are counted from the same sources the screens
     themselves render, so they are the truth. Starters and Components stay
     bare until their own registries can answer. */
  /* Cleared when the screen changes: a badge saying "Exported CSS" on a screen
     the user walked back into later is stale news dressed as fresh. */
  const [lastExport, setLastExport] = React.useState<string | null>(null);
  const [importOutcome, setImportOutcome] = React.useState<"imported" | "import-failed" | null>(null);
  React.useEffect(() => {
    if (activeSection !== "export") { setLastExport(null); setImportOutcome(null); }
  }, [activeSection]);

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
    /* Board 1333:7162 draws a count on Starters and Components too, and its
       numbers are not sample data: 6 is `STARTER_DS_REGISTRY.length` and 27 is
       `CATALOG.length` to the digit. Both rows shipped countless — the only
       two rows on the board that carry a number and did not here. */
    /* Board 154:132 is this same list in Basic mode, and it carries no count
       on Classes or Components — the two rows whose contents Basic cannot
       edit. Its own footer says why: "Basic mode hides what you cannot edit
       yet." A number for something you cannot touch is the noise that note is
       about. Board 1333:7162 (Pro) shows both. */
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

  /* The topbar read only the PROJECT's dirty flag, so a token mid-edit left it
     reading "Saved · just now" with a green dot while this panel's own footer
     said "Unsaved brand changes". Same concept, two surfacings, and the global
     one — the one a user watches — was the wrong one.
     Announced rather than shared: brand staging lives in TokenRegistryProvider
     above the sidebar, and the topbar sits outside it. It deliberately does NOT
     raise the project's dirty flag: autosave would then write a project that
     has not changed and clear the flag, putting "Saved" back over brand work
     that is still only staged. */
  React.useEffect(() => {
    /* Optional CALL, not just optional access: this panel is mounted in tests
       with partial composer mocks that carry no emitter, and a hard call turns
       a missing test double into a crash in the component under test. */
    composer?.emit?.(EVENTS.BRAND_DIRTY_CHANGED, { dirty: isDirty });
  }, [composer, isDirty]);

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
  /* This used to open a "you have unsaved changes" guard whenever `isDirty`,
     which wedged the panel after a token import: `ImportCard.handleApply` only
     STAGES tokens, so the panel becomes dirty, and from then on every
     navigation — Back included — set `showSectionGuard` instead of navigating.
     `TabGuardModal` renders `position:absolute; inset:0; z-index:200` inside
     the panel with its buttons clipped, so the user saw a Back button that
     appeared to do nothing. Measured 2026-08-25, reproduced 4x, and it also
     blocked the only route to a planted lint violation.

     The guard's premise was false. `TokenRegistryProvider` sits at
     `StudioPanels.tsx:384`, ABOVE the whole sidebar, so staged edits survive a
     section change and even a full unmount of this panel; the only things that
     discard are the footer's own Discard and the guard's discard handler.
     Navigating away from a dirty section never lost anything, so there was
     nothing to guard. The footer already reports "Unsaved brand changes" + Save
     Changes, which is the honest affordance. */
  const handleSectionClick = (s: DesignSection | "root") => {
    const target = s === "root" ? null : s;
    if (target === activeSection) return;
    setTokenKind(null);
    setActiveSection(target);
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
      /* Last line of the try, deliberately: every persist step above can still
         throw into the catch, and a failed apply must not tick the "Set your
         brand" onboarding step (codex, plan review 2026-08-28). */
      composer.emit(EVENTS.BRAND_APPLIED, undefined);
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

  /* The header is the constant "Brand" at every depth, and that is the BOARDS'
     call rather than this file's preference. Six destination frames state the
     title text directly — I208:551;16:7 (classes), I208:541;16:7 (starters),
     I306:2050;16:7 (tokens · add), I306:2081;16:7 (tokens · replace),
     I306:2162;16:7 (presets · draft), I306:2187;16:7 (starters · applied) —
     and every one of them reads "Brand". Copy on screen is decided by the
     board (CLAUDE.md precedence, founder 2026-08-06), and here the boards do
     not merely fail to contradict the code: they say the word.

     REVERSES a 2026-09-04 change, and the argument it reversed is kept because
     it is a good one: the section tablist that used to name the current screen
     is gone, so a constant header leaves "where am I" to the back link alone.
     What settles it is that the board answers that question in the same frame
     — 152:142, 153:7, 306:2051, 306:2163 and 306:2188 all draw a 36px Back row
     carrying `‹ <Section>` at 13/20 in accent, which is a full-width row and
     not a small link. The location cue is there; it is one row lower than the
     reverted change put it. Caught by check-board-copy.mjs, which reported
     "board draws, product does not render: brand" on six surfaces at once. */
  const headerTitle = "Brand";

  return (
    <div data-ds-preview={resolvedMode} className={PANEL} data-testid="brand-panel">
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
      {/* The "Brand & shared theme" strip that opened this panel is gone.
          Four boards of this family draw the root — 154:26 (lint-warnings),
          154:78 (dirty), 154:132 (Basic) and 306:2217 (lint suppressed) — and
          all four go panel header (44) -> Brand preview (82) -> the nine rows,
          with nothing between. The strip spent ~56px of an 812px panel above
          the fold on a link OUT of the editor, and the workspace shared theme
          it pointed at keeps its own routes dashboard-side (Agency tabs,
          `agency-tabs.tsx:15`, and the command palette, `command-palette.tsx:80`),
          so nothing became unreachable. boards.json already carried the
          finding against the root board: "140px of unboarded chrome (theme
          strip + mode toggle) hides 2 of 9 rows".

          The mode toggle below STAYS, and that is a deliberate exception:
          board 154:132 is the root in Basic mode and its own footnote tells
          the user to "Switch to Pro", while no board in the family draws a
          control that would let them. Deleting the only route to a state two
          boards specify would conform the pixels by breaking the screen. */}

      {/* Board 1333:7162 draws the root as a preview band above the list. What used to
          sit above it has a destination of its own on the boards: Light/Dark
          is the Colour mode screen's own control (153:92), Export belongs to
          Import / export (153:120), the starter gallery is the Starters row,
          and the lint card repeated the Lint row's count. Only the mode
          toggle stays, because Basic/Pro changes what the rest of the panel
          offers and has no other route. */}
      {/* No wrapper: 1747:8395 is one 40px frame and `DSModeToggle` is it. The
          `STRIP` band that used to hold it added a `--bk-bg-subtle` fill the
          board does not draw, directly under the panel header — two grey bars
          stacked before any content. */}
      <DSModeToggle />

        </>
      )}

      {/* Breadcrumb — only inside a destination. Board 1333:7162 draws no crumb at
          the root, and 153:2 draws `‹ <Section>` inside one. */}
      {activeSection && (
        /* 36px, inset 16, no fill of its own — 152:142, 153:7, 306:2051,
           306:2163 and 306:2188 all draw the Back row that way. It shipped as
           a 12/8-padded strip on `--bk-bg-subtle`, which is a band the boards
           do not have; on a white panel it read as a second header. */
        <div className={`${STRIP} tw:h-9 tw:px-4 tw:py-0`} data-testid="brand-back-row">
          <Button
            color="light"
            data-crumb-back=""
            data-testid="brand-back-link"
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
          {/* Board 306:2161 draws a status badge in the band under the back
              row. Its two siblings (bound / unbound) specify a state nothing can
              answer — elements carry no preset reference — so only this one
              ships. See SectionStatusBadge's note. */}
          {activeSection === "styles" && presetsStatus(stylesDirty > 0) && (
            <SectionStatusBadge status="draft" />
          )}
          {/* Board 306:2232 — "Exported CSS" under the back row after a
              download. The Copy button carries its own feedback; Download had
              none at all, so the one action that writes a file to disk was the
              one that said nothing. */}
          {activeSection === "export" && lastExport && (
            <SectionStatusBadge status="exported" detail={lastExport} />
          )}
          {/* Boards 306:2265 / 306:2298 — the import outcome, under the same
              back row. The card shows its own error DETAIL inline; this says
              what state the screen is in. */}
          {activeSection === "export" && !lastExport && importOutcome && (
            <SectionStatusBadge status={importOutcome} />
          )}
          {/* Brand root — the preview band + drill-in list (M5, board 1333:7162) */}
          {/* 306:2217's own Badge instance (333:2360), not a second pill built
              beside it. This rendered its own span with `px-2` and
              `leading-none` while `SectionStatusBadge` — same component on the
              board, same 10/2 inset — sat one import away. */}
          {activeSection === null && suppressedCount > 0 ? (
            <SectionStatusBadge status="warnings-suppressed" role="status" />
          ) : null}

          {/* The brand, before the list of places to change it. Nine rows of
              text with counts described the panel; none of them showed a
              colour or a typeface (ledger R10). */}
          {activeSection === null && (
            <BrandPreview colors={filterTokensByMode(color.tokens ?? [], isBeginner ? "beginner" : "pro")} />
          )}

          {activeSection === null && (
            <ul className="tw:flex tw:flex-col tw:gap-0 tw:list-none tw:m-0 tw:p-0">
              {SECTIONS.map((s) => {
                const dirtyHere =
                  (s.id === "tokens" && tokensDirty > 0) ||
                  (s.id === "styles" && stylesDirty > 0);
                return (
                  <li key={s.id}>
                    <Button
                      color="light"
                      data-section-id={s.id}
                      data-testid={`brand-row-${s.id}`}
                      onClick={() => handleSectionClick(s.id)}
                      /* `leading-[normal]` because the boards say so — every
                         List row on 1691:7353..7397 is `leading-[normal]`, and
                         flowbite's Button base ships `text-sm`, whose 20px
                         line-height the 13px label then inherited. It stacked
                         label+hint 36px tall inside a 52px row. */
                      className="tw:flex tw:w-full tw:items-center tw:gap-2 tw:justify-between tw:h-13 tw:px-4 tw:py-0 tw:leading-[normal] tw:rounded-none tw:border-0 tw:bg-transparent tw:font-normal tw:text-left tw:hover:bg-[var(--bk-gray-100)]"
                    >
                      {/* `hint` has been written for all nine rows since the
                          board landed and rendered for none of them — the row
                          showed a bare noun and a number. "Presets" and
                          "Starters" are not words a first-time user can rank
                          without them. */}
                      <span className="tw:flex tw:flex-col tw:gap-px tw:min-w-0 tw:text-left">
                        <span
                          data-testid={`brand-row-label-${s.id}`}
                          className="tw:flex tw:items-center tw:gap-[5px] tw:min-w-0 tw:text-[13px] tw:text-[var(--bk-ink)]"
                        >
                          {s.label}
                          {dirtyHere && (
                            <span
                              className="tw:size-[5px] tw:flex-none tw:rounded-full tw:bg-[var(--bk-warning)]"
                              aria-label="unsaved changes"
                            />
                          )}
                        </span>
                        <span
                          data-testid={`brand-row-hint-${s.id}`}
                          className="tw:truncate tw:text-[11px] tw:leading-4 tw:font-normal tw:text-[var(--bk-ink-soft)]"
                        >
                          {s.hint}
                        </span>
                      </span>
                      <span className="tw:flex tw:flex-none tw:items-center tw:gap-1.5">
                        {/* 12px, not 11: the boards draw the row count and the
                            chevron at the same size (1691:7357 / 7358 and its
                            eight siblings), which is what makes them read as one
                            trailing cluster rather than a number with a bigger
                            arrow after it. */}
                        {(s.id === "lint" ? lintIssues.length : sectionCounts[s.id]) ? (
                          <span
                            data-testid={`brand-row-count-${s.id}`}
                            className="tw:font-mono tw:tabular-nums tw:text-[12px] tw:font-medium tw:text-[var(--bk-ink-soft)]"
                          >
                            {s.id === "lint" ? lintIssues.length : sectionCounts[s.id]}
                          </span>
                        ) : null}
                        <span
                          aria-hidden="true"
                          data-testid={`brand-row-chevron-${s.id}`}
                          className="tw:text-[12px] tw:text-[var(--bk-ink-soft)]"
                        >›</span>
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
                <li
                  className="tw:mt-auto tw:flex tw:h-10 tw:items-center tw:px-4 tw:bg-[var(--bk-bg-subtle)]"
                  data-basic-mode-note
                  data-testid="brand-basic-note"
                >
                  {/* 154:186 verbatim. The line shipped as "Basic mode hides
                      what you cannot edit yet. Switch to Pro to unlock." — it
                      named the mode by a word the toggle beside it does not use
                      (the control says Beginner), and "what you cannot edit
                      yet" is vaguer than the two things actually hidden. On a
                      248 measure at 11/16, which is where the second line
                      breaks. */}
                  {/* `--bk-ink-soft`, and this is the ONE place this note does
                      not do what 154:186 says. The board colours it
                      `--color/ink-muted` on the `--color/bg-subtle` fill of
                      154:185, and that pair MEASURES 4.39:1
                      at 11px — under the 4.5 WCAG AA floor, computed by
                      measure.mjs, not eyeballed. `--bk-ink-soft` is the same
                      substitution `DesignTabFooter` already documents for the
                      same pair on the same fill. A board cannot authorise a
                      contrast failure, so the fill, the size, the line and the
                      248 measure are the board's and the colour is not —
                      recorded in surfaces/brand-pro-locked.json, which skips
                      154:186 for exactly this reason. */}
                  <span
                    data-testid="brand-basic-note-text"
                    className="tw:block tw:w-full tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-soft)]"
                  >
                    Beginner hides token IDs and empty foundations. Switch to Pro to show them.
                  </span>
                </li>
              )}
            </ul>
          )}

          {isFirstLoad && activeSection === "tokens" && (
            /* 1751:8390 — board 152:52 DOES draw this banner. boards.json still
               carries the opposite finding ("an unboarded info banner pushes
               the first kind +89px"); the board has moved since, and the 17xx
               node ids are the revision that moved it. */
            <div
              data-testid="brand-tokens-first-load-banner"
              className="tw:mx-2.5 tw:mt-2.5 tw:px-3 tw:py-2 tw:rounded-lg tw:border tw:border-[var(--bk-accent-tint)] tw:bg-[var(--bk-accent-tint)]"
            >
              {/* `leading-[normal]`, not `leading-relaxed` — 1751:8391. The 1.625
                  line spread two lines of a 12px sentence over 40px inside a
                  56px card, which is the whole card. */}
              <span
                data-testid="brand-tokens-first-load-text"
                className="tw:text-xs tw:leading-[normal] tw:text-[var(--bk-ink)]"
              >
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
              /* Gated on the SAME flag that decides whether an AIClient is
                 built at all (useComposerInit.ts:132), the way the sidebar's
                 publish action is gated on the flag behind the Topbar's
                 dropdown (TabRouter.tsx:195). The flag guarded the client and
                 nothing guarded this entry, so the modal opened over a service
                 with no client and Generate answered every user with
                 AIAssistService's developer string. Absent callback → the
                 section blocks the CTA and says why. */
              onOpenAIAssist={isFeatureEnabled("dsAi") ? () => setAiOpen(true) : undefined}
            />
          )}
          {activeSection === "starters"   && <StartersSection projectId={projectId} />}
          {activeSection === "classes"    && <ClassesSection composer={composer} />}
          {activeSection === "typography" && <TypographySection composer={composer} />}
          {activeSection === "colour-mode" && <ColourModeSection composer={composer} />}
          {activeSection === "lint"       && <LintSection issues={lintIssues} />}
          {activeSection === "export"     && <ExportSection onExported={setLastExport} onImportOutcome={setImportOutcome} />}
        </div>
      )}

      <DesignTabFooter
        isDirty={isDirty}
        dirtyCount={totalDirty}
        onDiscard={handleDiscard}
        onReview={() => setShowReview(true)}
      />

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
