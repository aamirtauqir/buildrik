/**
 * BrandWorkspace — the Brand surface, as the full-canvas workspace the owner
 * chose on 2026-09-21 (OD-1: "sab se new design implement karna hai" — board
 * `7315:80955` and its pages are the single Brand design; the 280/700 drawer
 * this replaces is `ARCHIVE · STATES · Brand … superseded 21 Sep 2026`).
 *
 *   ┌ nav 256 ──────────┬ 32 ┬ pane 620 ─────────────────┬ 32 ┬ preview 468 ─┬ 32 ┐
 *   │  ‹ Back to canvas │    │ Colours  18 tokens · light │    │ Live preview ·│    │
 *   │ Brand             │    │              [+ Add token] │    │ Home     50% ▾│    │
 *   │ site name         │    ├────────────────────────────┤    │  page at zoom │    │
 *   │                   │    │ TOKEN  LIGHT  DARK  USED   │    ├───────────────┤    │
 *   │ Colours        18 │    │ ● color-primary #1A56DB …  │    │ ▇ token card  │    │
 *   │ Colour mode       │    │ …                          │    │ Light value … │    │
 *   │ …                 │    ├────────────────────────────┤    │ Used by …     │    │
 *   │ Beginner | Pro    │    │ Unsaved brand changes  Save│    │ ✓ Brand checks│    │
 *   └───────────────────┴────┴────────────────────────────┴────┴───────────────┴────┘
 *
 * Measured off 7315:80955 at 1440×900 (C1 (ii)): nav 256 with the Brand head,
 * main gutters 40 top / 32 sides, pane content 620, preview column 468, the
 * page action at the header's right, the page's table in a bordered card.
 *
 * Nav order is the board's (decision #15), Colours landing (#28): Colours ·
 * Colour mode · Fonts & type styles · Component styles · Classes · Presets ·
 * Brand checks · Starters · Spacing · Import / export. Two departures, both
 * recorded in the C1 (i) commit: the board's `Styles` page (7316:82153) has no
 * code behind it (03 G3-142 NOT IMPLEMENTED, "hide") and is not a nav row; and
 * the ten token kinds the workspace boards do not draw (03 G3-130 — only
 * Spacing got a page, W-7) stay reachable behind the same "More token kinds"
 * disclosure the drawer's Tokens list used, so no kind loses its editor.
 *
 * Save model is the CODE's (behaviour → code contract): edits are staged in
 * the registries above this tree, the footer's Save opens the review → Apply
 * persists. `DraftChip` is the auto-draft indicator (#28); `‹ Back to canvas`
 * and Escape are guarded by `BrandDiscardDialog` (7317:80979) while anything
 * is staged. The staged edits survive leaving — `TokenRegistryProvider` sits
 * above the whole shell — so the guard is about the user's intent, not data
 * loss; Discard from the dialog is the footer's own Discard (with its Undo
 * toast), then leave.
 *
 * The aggregation, load and apply logic below is the drawer's, moved verbatim:
 * 14 token registries + 11 preset registries → one dirty count, one Apply,
 * one Discard. It stays here rather than in a hook because the footer, the
 * chip, the guard and the review modal all read the same numbers.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { ChevronLeft } from "lucide-react";
import { Button, IconButton, Menu, MenuItem, MenuLabel, MenuSeparator, Popover, Select, Tooltip, useToast } from "@/editor/chrome-ui";
import { PanelErrorState } from "../../sidebar/shared/PanelErrorState";
import type { Composer } from "../../../engine/Composer";
import { EVENTS } from "../../../shared/constants/events";
import type { DesignTokenRecord } from "../../../shared/types/project";
import { DEFAULT_TOKENS } from "../constants";
import type { SpacingPreset } from "../state/useSpacingTokens";
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
import type { DesignToken, StylePreset, TokenKind } from "../types";
import { useTokenUsageMap } from "../state/useTokenUsageMap";
import { CURRENT_SCHEMA_VERSION } from "../migrations";
import type { TokensForKindRegistry } from "../state/useTokensForKind";
import { mergeProjectTokens } from "../state/projectTokens";
import { generateColorTokenId, generateColorCssVar } from "../utils/exportUtils";
import { APPLY_CHANGES_LABEL, DesignTabFooter } from "./DesignTabFooter";
import { DraftChip } from "./DraftChip";
import { useBrandDraft } from "./useBrandDraft";
import { DSModeProvider, useDSModeOptional } from "../state/DSModeContext";
import { AIPromptModal } from "./AIPromptModal";
import { TokenAddDialog } from "./modals/TokenAddDialog";
import { ReviewModal } from "./modals/ReviewModal";
import { BrandDiscardDialog } from "./BrandDiscardDialog";
import { BrandPreview } from "./BrandPreview";
import { BrandLivePreview } from "./BrandLivePreview";
import { orderColourTokens } from "./colors/ColorTokenList";
import { TokenDetailView } from "./sections/TokenDetailView";
import { TokensSection } from "./sections/TokensSection";
import { StylesSection, useStylesSectionTotalDirty } from "./sections/StylesSection";
import { ComponentsSection } from "./sections/ComponentsSection";
import { ReusableStylesSection, reusableStylesCount } from "./sections/ReusableStylesSection";
import { isFeatureEnabled } from "@/shared/utils/featureFlags";
import { ExportSection } from "./sections/ExportSection";
import { LintSection, brandChecksCaption, contrastFixFor } from "./sections/LintSection";
import { filterTokensByMode } from "../utils/semanticKind";
import { ClassesSection } from "./sections/ClassesSection";
import { ClassAddDialog } from "./sections/ClassAddDialog";
import { TypographySection, fontsCaption } from "./sections/TypographySection";
import { openSiteFonts } from "@/editor/inspector/sections/typography";
import { requestInsertGroup } from "@/editor/sidebar/tabs/build/insertGroupRequest";
import { StartersSection } from "./sections/StartersSection";
import { ColourModeSection } from "./sections/ColourModeSection";
import { ColorModeToggle } from "./ColorModeToggle";
import { useDSLint } from "../state/useDSLint";

// ─── Pages ────────────────────────────────────────────────────────────────────

/** The board's nav, in its order (`7315:80955` read from the re-dump). */
const NAV = [
  { id: "colours",          label: "Colours" },
  { id: "colour-mode",      label: "Colour mode" },
  { id: "fonts",            label: "Fonts & type styles" },
  { id: "styles",           label: "Styles" },
  { id: "component-styles", label: "Component styles" },
  { id: "classes",          label: "Classes" },
  { id: "presets",          label: "Presets" },
  { id: "brand-checks",     label: "Brand checks" },
  { id: "starters",         label: "Starters" },
  { id: "spacing",          label: "Spacing" },
  { id: "export",           label: "Import / export" },
] as const;

type NavId = (typeof NAV)[number]["id"];

/* The token kinds no workspace board draws (03 G3-130). Colour, type and
   spacing have pages of their own above; these ten keep the drawer's generic
   list, one page each, behind a disclosure. */
const MORE_KINDS = [
  { kind: "radius",     label: "Radius" },
  { kind: "shadow",     label: "Shadow" },
  { kind: "motion",     label: "Motion" },
  { kind: "border",     label: "Border" },
  { kind: "opacity",    label: "Opacity" },
  { kind: "zindex",     label: "Z-index" },
  { kind: "breakpoint", label: "Breakpoint" },
  { kind: "grid",       label: "Grid" },
  { kind: "sizing",     label: "Sizing" },
  { kind: "icon",       label: "Icon" },
  { kind: "imagery",    label: "Imagery" },
] as const satisfies ReadonlyArray<{ kind: TokenKind; label: string }>;

type MoreKind = (typeof MORE_KINDS)[number]["kind"];
export type BrandPageId = NavId | `kind-${MoreKind}`;

const LANDING: BrandPageId = "colours";

function isPageId(value: string): value is BrandPageId {
  return NAV.some((n) => n.id === value) || MORE_KINDS.some((k) => `kind-${k.kind}` === value);
}

function pageLabel(id: BrandPageId): string {
  return NAV.find((n) => n.id === id)?.label
    ?? MORE_KINDS.find((k) => `kind-${k.kind}` === id)?.label
    ?? id;
}

// ─── Row chrome (7315:80955: 32-tall rows on a 2px rhythm, 14px, accent tint when on) ──

const NAV_ROW =
  "tw:flex tw:h-8 tw:w-full tw:items-center tw:justify-start tw:gap-2 tw:rounded-[var(--bk-radius-md)] tw:border-0 " +
  "tw:bg-transparent tw:px-3 tw:text-left tw:text-[length:var(--bk-text-14)] tw:font-normal tw:leading-5 " +
  "tw:text-[var(--bk-ink)] tw:enabled:hover:bg-[var(--bk-bg-subtle)] " +
  /* The ghost Button's own `focus:[box-shadow:…]` drew the focus ring on a
     MOUSE click (measured: rgba(26,86,219,.3) 0 0 0 2px on the clicked row).
     `focus:shadow-none` is a different twMerge group and lost; the same
     arbitrary property replaces it. Keyboard focus keeps the ring. */
  "tw:focus:ring-0 tw:focus:[box-shadow:none] tw:focus-visible:[box-shadow:var(--bk-shadow-focus)]";
const NAV_ROW_ON =
  "tw:bg-[var(--bk-accent-tint)] tw:font-medium tw:text-[var(--bk-accent)] " +
  "tw:enabled:hover:bg-[var(--bk-accent-tint)] tw:enabled:hover:text-[var(--bk-accent)]";
/* The count at the row's right — "18" on Colours, "2" on Brand checks — stays
   muted on the active row too (measured: rgb(107,114,128) on the tint). */
const NAV_COUNT =
  "tw:flex-none tw:tabular-nums tw:text-[length:var(--bk-text-14)] tw:font-normal tw:leading-5 tw:text-[var(--bk-ink-muted)]";
/* The header's page action (7315:80955 "+ Add token": 28 tall, 13px, hairline). */
/* Spacing's ⋯ menu: the three presets on the 4px grid (useSpacingTokens). */
const SPACING_PRESETS: [SpacingPreset, string][] = [
  ["compact", "Compact · 2px"],
  ["normal", "Normal · 4px"],
  ["spacious", "Spacious · 6px"],
];

const PAGE_ACTION =
  "tw:h-7 tw:rounded-[var(--bk-radius-md)] tw:border-[var(--bk-border)] tw:px-3 tw:text-[length:var(--bk-text-13)] tw:font-normal tw:leading-4 tw:text-[var(--bk-ink)]";

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

/** A token is dirty when its value OR its dark value differs from the saved one. */
function tokenDirty(t: DesignToken, saved: DesignToken | undefined): boolean {
  return saved === undefined || t.value !== saved.value || (t.darkValue ?? "") !== (saved.darkValue ?? "");
}

function dirtyCount(reg: KindRegistryLike): number {
  // Counts both modifications (id present in saved with different value) AND
  // additions (id not in saved at all). Pre-fix this only counted modifications,
  // so import-via-add and AddTokenModal both shipped tokens silently — no
  // section-tab dot, no DraftChip count increment. Removals are not counted
  // here; deleteToken UX is a separate concern. A dark value set on the card
  // counts too — it used to stage without ever lighting the footer (C1 (ii)).
  return reg.tokens.filter((t) => tokenDirty(t, reg.savedTokens.find((s) => s.id === t.id))).length;
}

// ─── BrandWorkspace ───────────────────────────────────────────────────────────

export interface BrandWorkspaceProps {
  composer: Composer | null;
  /** Scopes the starter token blob in storage — Starters is a destination now. */
  projectId?: string | null;
  /** A page to land on instead of Colours — `openLeftPanelToTab("design", <id>)`. */
  initialPage?: string;
  /** `‹ Back to canvas` / Escape, after the guard has been answered. */
  onClose?: () => void;
}

const BrandWorkspaceBody: React.FC<BrandWorkspaceProps> = ({
  composer,
  projectId,
  initialPage,
  onClose,
}) => {
  const { addToast } = useToast();
  const isBeginner = useDSModeOptional()?.mode !== "pro";
  /* Shared with DSLintBanner via `useDSLint` so the row count, the banner and
     the Brand checks page can never disagree. */
  const lintIssues = useDSLint(composer);
  /* Ignored (suppressed) checks, named in the Brand checks caption (G3-123:
     no pill band). Read here rather than stored: `useDSLint` re-renders this
     component whenever `lint:changed` fires, every suppress and unsuppress. */
  const suppressedCount = composer?.designSystem?.lintState?.suppressedCount?.() ?? 0;
  const [page, setPage] = React.useState<BrandPageId>(() =>
    initialPage && isPageId(initialPage) ? initialPage : LANDING
  );
  const [showReview, setShowReview] = React.useState(false);
  const [showAddToken, setShowAddToken] = React.useState(false);
  const [spacingMenuOpen, setSpacingMenuOpen] = React.useState(false);
  const [aiOpen, setAiOpen] = React.useState(false);
  const [guardOpen, setGuardOpen] = React.useState(false);
  const [classAddOpen, setClassAddOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isFirstLoad, setIsFirstLoad] = React.useState(false);
  /* The saved brand is in the registries — the auto-draft may restore on top. */
  const [brandLoaded, setBrandLoaded] = React.useState(false);

  // T10 / spec D8: outermost wrapper gets data-ds-preview={resolvedMode} so
  // ds-panel-dark.css can scope overrides to the Brand surface only. Editor
  // chrome (topbar, rail) keeps the canonical light theme.
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

  const allPresets: StylePreset[] = allPresetRegistries.flatMap((r) => r.presets);

  const allRegistries: KindRegistryLike[] = [
    color, type, spacing, radius, shadow, motion, border,
    opacity, zindex, breakpoint, grid, sizing, icon, imagery,
  ];

  // Decision #28: the draft survives a reload.
  useBrandDraft({
    projectId,
    registries: allRegistries,
    color,
    addColorToken: color.addToken,
    ready: brandLoaded,
  });


  const tokensDirty = allRegistries.reduce((n, r) => n + dirtyCount(r), 0);
  const stylesDirty = useStylesSectionTotalDirty();
  const totalDirty = tokensDirty + stylesDirty;
  const isDirty = totalDirty > 0;

  const isDirtyRef = React.useRef(isDirty);
  React.useEffect(() => { isDirtyRef.current = isDirty; }, [isDirty]);
  /* True while Apply writes the settings. `setProjectSettings` emits
     SETTINGS_CHANGE synchronously, before `markSaved` has cleared the dirty
     flag, so the cross-window listener below read our own write as another
     window's and toasted "Your edits may conflict" on every Save — measured
     live 2026-09-22 on the first Apply through the workspace. */
  const applyingRef = React.useRef(false);

  /* The topbar read only the PROJECT's dirty flag, so a token mid-edit left it
     reading "Saved · just now" with a green dot while this surface's own footer
     said "Unsaved brand changes". Same concept, two surfacings, and the global
     one — the one a user watches — was the wrong one.
     Announced rather than shared: brand staging lives in TokenRegistryProvider
     above the shell, and the topbar sits outside it. It deliberately does NOT
     raise the project's dirty flag: autosave would then write a project that
     has not changed and clear the flag, putting "Saved" back over brand work
     that is still only staged. */
  React.useEffect(() => {
    /* Optional CALL, not just optional access: this surface is mounted in
       tests with partial composer mocks that carry no emitter, and a hard call
       turns a missing test double into a crash in the component under test. */
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
        // which runs this at project load, not at mount — shares it.
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
      setBrandLoaded(true);
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
      if (applyingRef.current) return;
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
      // is a canvas action that must NOT silently discard unsaved token edits.
      // When there are staged changes, keep them and warn instead of
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
        /* The dark variant. It was dropped here, so a dark value set in the
           drawer's detail view — and the card's "Dark value · Set" now —
           reached the registry and never the project: measured live
           2026-09-22, Apply persisted `#C81E1E` and lost `#76A9FA`. */
        ...(t.darkValue ? { darkValue: t.darkValue } : {}),
        /* The kind rides along: the eleven generic registries hydrate by
           `kind`, and an added token (not in the seed) has nothing else to
           say which registry it belongs to on the next load. */
        ...(t.kind ? { kind: t.kind } : {}),
      }));

    // S2: pull all 11 preset categories into a flat record array for persistence.
    const presetRecords = allPresets.map((p) => ({
      id: p.id, friendlyName: p.friendlyName, category: p.category,
      variant: p.variant, bindings: p.bindings,
    }));

    applyingRef.current = true;
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
    } finally {
      applyingRef.current = false;
    }
  };

  // ─ Discard ─
  const handleDiscard = () => {
    const flat = allRegistries.flatMap((r) =>
      r.tokens
        .filter((t) => {
          const saved = r.savedTokens.find((s) => s.id === t.id);
          return saved !== undefined && tokenDirty(t, saved);
        })
        .map((t) => ({ id: t.id, value: t.value, darkValue: t.darkValue, registry: r }))
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
          flat.forEach(({ id, value, darkValue, registry }) =>
            registry === color ? color.updateToken(id, value, darkValue) : registry.updateToken(id, value));
        },
      },
    });
  };


  /* "+ Add token" (7318:81125): the kind is the page's. Only kinds with an
     add path offer it — colour, spacing and the eleven generic kinds. */
  const addKind: TokenKind | null =
    page === "colours" ? "color" : page === "spacing" ? "spacing" : page.startsWith("kind-") ? (page.slice(5) as TokenKind) : null;
  const addRegistry = (k: TokenKind | null): { tokens: DesignToken[]; addToken: (t: DesignToken) => void } | null =>
    k === "color" ? color : k === "spacing" ? spacing : k && isMoreKind(k) ? moreKindRegistry[k] : null;
  const handleAddToken = (token: DesignToken) => {
    addRegistry(token.kind ?? null)?.addToken(token);
    setShowAddToken(false);
    setSelectedTokenId(token.id);
    addToast({ description: `Token "${token.name}" added to the draft`, tone: "success" });
  };

  // ─ The door out (7315:80955 KEY_D: if draft → 7317:80979, else → canvas) ─
  /* What runs once the workspace has closed — a Component styles row's hand-
     off to Add › Blocks. Held across the guard; Keep editing drops it. */
  const afterLeaveRef = React.useRef<(() => void) | null>(null);
  const requestLeave = React.useCallback((then?: () => void) => {
    afterLeaveRef.current = then ?? null;
    if (isDirtyRef.current) {
      setGuardOpen(true);
      return;
    }
    onClose?.();
    then?.();
  }, [onClose]);

  const handleGuardDiscard = () => {
    setGuardOpen(false);
    handleDiscard();
    onClose?.();
    afterLeaveRef.current?.();
    afterLeaveRef.current = null;
  };

  /* Component styles (7316:82755) lists the Add › Blocks sections; a row
     leaves Brand for Add with BLOCKS open, where that section lives. */
  const openSectionInAdd = React.useCallback(() => {
    requestLeave(() => {
      if (!composer) return;
      composer.emit?.(EVENTS.UI_SWITCH_TAB, { tab: "add" });
      requestInsertGroup(composer, "blocks");
    });
  }, [requestLeave, composer]);

  // Escape is the same door, guarded the same way. The dialogs own their own
  // Escape while they are up; an input keeps its own.
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (guardOpen || showReview || showAddToken || aiOpen || classAddOpen) return;
      /* An open popover, menu or dialog owns this Escape (the token card's ⋯
         menu, the font picker, the rename / replace dialogs). Leaving the
         workspace on the same keypress that closed a menu was found live. */
      if (document.querySelector('[role="menu"], [role="dialog"], [role="listbox"]')) return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target?.isContentEditable) return;
      e.preventDefault();
      requestLeave();
    };
    /* Window, capture phase: ahead of the Popover's own document-capture
       Escape, which closes the menu and (microtasks run between listeners)
       unmounts it before a later listener could see it was open. */
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [guardOpen, showReview, showAddToken, aiOpen, classAddOpen, requestLeave]);

  // ─ Pane content ─
  const visibleColors = filterTokensByMode(color.tokens ?? [], isBeginner ? "beginner" : "pro");

  /* The site name under "Brand" (7315:80955 draws the site's own name there;
     "Bella Cucina" is the board's sample). Same read the topbar makes. */
  const [siteName, setSiteName] = React.useState("");
  React.useEffect(() => {
    if (!composer || typeof composer.on !== "function") return;
    const read = () => setSiteName(composer.getProjectMetadata?.()?.name ?? "");
    read();
    composer.on(EVENTS.PROJECT_LOADED, read);
    composer.on(EVENTS.PROJECT_METADATA_CHANGED, read);
    return () => {
      composer.off(EVENTS.PROJECT_LOADED, read);
      composer.off(EVENTS.PROJECT_METADATA_CHANGED, read);
    };
  }, [composer]);

  /* The selected token — the right column's card (7315:80955). One per
     workspace, cleared on a page change; a row click on any token page sets
     it. The card is a sibling of the table, not a drill-in. */
  const [selectedTokenId, setSelectedTokenId] = React.useState<string | null>(null);
  /* A page change drops the selection — unless the move is FOR a token
     (Brand checks' Open), which lands on its page with its card open. */
  const openPage = (id: BrandPageId, tokenId: string | null = null) => {
    setPage(id);
    setSelectedTokenId(tokenId);
  };
  const allTokens = React.useMemo(
    () => allRegistries.flatMap((r) => r.tokens),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    allRegistries.map((r) => r.tokens),
  );
  const selectedToken = selectedTokenId ? allTokens.find((t) => t.id === selectedTokenId) : undefined;


  const moreKindRegistry: Record<MoreKind, TokensForKindRegistry> = {
    radius, shadow, motion, border, opacity, zindex, breakpoint, grid, sizing, icon, imagery,
  };

  /* 7315:80955 / 7576:197036 draw the page with a token selected and its
     card open. A token page with nothing selected (landing, a page change)
     selects its first row. */
  const firstRowId = (() => {
    if (page === "colours") return orderColourTokens(visibleColors)[0]?.id;
    if (page === "spacing") return spacing.tokens[0]?.id;
    if (page.startsWith("kind-")) return moreKindRegistry[page.slice(5) as MoreKind]?.tokens[0]?.id;
    return undefined;
  })();
  React.useEffect(() => {
    if (!selectedTokenId && firstRowId) setSelectedTokenId(firstRowId);
  }, [selectedTokenId, firstRowId]);

  /* Dispatch to whichever registry owns the token. Only the colour registry
     stores a dark variant; type and spacing expose no delete or rename, so
     those two calls reach only colour and the eleven generic kinds. */
  const kindOf = (tok: DesignToken): TokenKind | undefined =>
    tok.kind ?? (tok.category === "colors" ? "color"
      : tok.category === "typography" ? "type"
      : tok.category === "spacing" ? "spacing"
      : undefined);
  const isMoreKind = (k: TokenKind | undefined): k is MoreKind =>
    MORE_KINDS.some((m) => m.kind === k);
  const tokenById = (id: string) => allTokens.find((t) => t.id === id);
  const changeToken = (id: string, value: string, darkValue?: string) => {
    const tok = tokenById(id);
    if (!tok) return;
    const k = kindOf(tok);
    if (k === "color") color.updateToken(id, value, darkValue);
    else if (k === "type") type.updateToken(id, value);
    else if (k === "spacing") spacing.updateToken(id, value);
    else if (isMoreKind(k)) moreKindRegistry[k].updateToken(id, value);
  };
  const deleteToken = (id: string, opts?: { replaceWith?: string }) => {
    const tok = tokenById(id);
    if (!tok) return;
    const k = kindOf(tok);
    if (k === "color") color.deleteToken(id, opts);
    else if (isMoreKind(k)) moreKindRegistry[k].deleteToken(id, opts);
  };
  const renameToken = (id: string, newId: string) => {
    const tok = tokenById(id);
    if (!tok) return;
    const k = kindOf(tok);
    if (k === "color") color.renameToken(id, newId);
    else if (isMoreKind(k)) moreKindRegistry[k].renameToken(id, newId);
  };

  const caption = (() => {
    switch (page) {
      case "colours":          return `${visibleColors.length} tokens · light / dark`;
      case "colour-mode":      return "Light and dark values";
      case "fonts":            return fontsCaption(type.tokens);
      case "styles":           return `Reusable · ${reusableStylesCount(type.tokens, allPresets)}`;
      case "component-styles": return "Default appearance by component";
      case "classes":          return "Names shared across elements";
      case "presets":          return "Section and element presets";
      case "brand-checks":     return brandChecksCaption(lintIssues, suppressedCount);
      case "starters":         return "Pick a starter, then apply it to the draft";
      case "spacing":          return `${spacing.tokens.length} tokens · presets + custom`;
      case "export":           return "Move the brand in and out";
      default: {
        const n = moreKindRegistry[page.slice("kind-".length) as MoreKind]?.tokens.length ?? 0;
        return `${n} token${n === 1 ? "" : "s"}`;
      }
    }
  })();

  /* The header's page action — each board draws one at the top right. */
  const pageAction = (() => {
    switch (page) {
      case "colours":
        return (
          <Button type="button" variant="secondary" size="xs" className={PAGE_ACTION} onClick={() => setShowAddToken(true)} data-testid="brand-page-action">
            + Add token
          </Button>
        );
      case "styles":
      case "component-styles": {
        /* 7316:82755 / 7316:82153's page action. Gated on the SAME flag that decides
           whether an AIClient is built at all (useComposerInit.ts:132): with
           it off the modal would open over a service with no client and answer
           with AIAssistService's developer string. Blocked, never hidden, and
           aria-disabled so the reason stays reachable by keyboard. */
        const aiOn = isFeatureEnabled("dsAi");
        const cta = (
          <Button
            type="button"
            variant="secondary"
            size="xs"
            className={PAGE_ACTION}
            onClick={aiOn ? () => setAiOpen(true) : undefined}
            aria-disabled={aiOn ? undefined : "true"}
            data-open-ai-assist
            data-testid="brand-page-action"
          >
            ✦ Generate with AI
          </Button>
        );
        return aiOn ? cta : (
          <Tooltip content="AI generation isn't switched on for this workspace yet" placement="bottom" arrow={false}>
            {cta}
          </Tooltip>
        );
      }
      case "classes":
        return (
          <Button type="button" variant="secondary" size="xs" className={PAGE_ACTION} onClick={() => setClassAddOpen(true)} data-testid="brand-page-action">
            + Add class
          </Button>
        );
      case "brand-checks":
        /* 7316:84555's page action. The checks also run by themselves on
           every staged edit; this runs them now (useDSLint's one trigger). */
        return (
          <Button
            type="button"
            variant="secondary"
            size="xs"
            className={PAGE_ACTION}
            onClick={() => composer?.emit?.(EVENTS.BRAND_CHECKS_RUN, undefined)}
            data-testid="brand-page-action"
          >
            Run checks
          </Button>
        );
      case "spacing":
      default:
        if (page === "spacing" || page.startsWith("kind-")) {
          /* Spacing (7576:197036) is the "Tokens · <kind>" pattern; its
             header switches kind — the one entry to the eleven others. */
          return (
            <div className="tw:flex tw:items-center tw:gap-2">
            <Select
              sizing="sm"
              aria-label="Token kind"
              value={page}
              onChange={(e) => openPage(e.target.value as BrandPageId)}
              data-testid="brand-kind-switch"
            >
              <option value="spacing">Spacing</option>
              {MORE_KINDS.map((k) => (
                <option key={k.kind} value={`kind-${k.kind}`}>
                  {k.label}
                </option>
              ))}
            </Select>
            <Button type="button" variant="secondary" size="xs" className={PAGE_ACTION} onClick={() => setShowAddToken(true)} data-testid="brand-page-action">
              + Add token
            </Button>
            {page === "spacing" ? (
              /* Owner ruling 2026-09-24: applying a whole preset comes back
                 (removed in 91ab74b33 for parity) — in a menu, so the page
                 still draws no chips (7576:197036). Both actions stage. */
              <Popover
                open={spacingMenuOpen}
                onClose={() => setSpacingMenuOpen(false)}
                placement="bottom-end"
                label="Spacing actions"
                trigger={
                  <IconButton label="Spacing actions" onClick={() => setSpacingMenuOpen((v) => !v)} data-testid="brand-spacing-menu">
                    ⋯
                  </IconButton>
                }
              >
                <Menu label="Spacing actions">
                  <MenuLabel>Apply preset</MenuLabel>
                  {SPACING_PRESETS.map(([p, label]) => (
                    <MenuItem
                      key={p}
                      radio
                      selected={spacing.activePreset === p}
                      onClick={() => {
                        spacing.applyPreset(p);
                        setSpacingMenuOpen(false);
                      }}
                      data-testid={`spacing-preset-${p}`}
                    >
                      {label}
                    </MenuItem>
                  ))}
                  <MenuSeparator />
                  <MenuItem
                    onClick={() => {
                      spacing.stageDefaults(DEFAULT_TOKENS);
                      setSpacingMenuOpen(false);
                      addToast({ description: "Spacing reset to defaults — review and Save to keep it.", tone: "info" });
                    }}
                    data-testid="spacing-reset-defaults"
                  >
                    Reset to defaults
                  </MenuItem>
                </Menu>
              </Popover>
            ) : null}
            </div>
          );
        }
        return null;
      case "fonts":
        /* The fonts a site can pick from are its Site fonts — the same door
           the font picker's "Manage site fonts" opens. */
        return (
          <Button type="button" variant="secondary" size="xs" className={PAGE_ACTION} onClick={() => openSiteFonts(composer)} data-testid="brand-page-action">
            + Add a font
          </Button>
        );
    }
  })();

  const tokenPageProps = {
    onAddTokenClick: () => setShowAddToken(true),
    composer,
    selectedTokenId,
    onSelectToken: setSelectedTokenId,
  };

  const renderPage = (): React.ReactNode => {
    switch (page) {
      case "colours":
        return <TokensSection {...tokenPageProps} openKind="color" />;
      case "colour-mode":
        return <ColourModeSection />;
      case "fonts":
        /* 7316:81551 — one card: the font roles, then the type styles. */
        return (
          <TypographySection
            composer={composer}
            tokens={type.tokens}
            selectedTokenId={selectedTokenId}
            onSelectToken={setSelectedTokenId}
          />
        );
      case "styles":
        return (
          <ReusableStylesSection
            typeTokens={type.tokens}
            allTokens={allTokens}
            presets={allPresets}
            selectedTokenId={selectedTokenId}
            onSelectToken={setSelectedTokenId}
            onOpenPresets={() => openPage("presets")}
          />
        );
      case "component-styles":
        return <ComponentsSection onOpenSection={openSectionInAdd} />;
      case "classes":
        return <ClassesSection composer={composer} />;
      case "presets":
        return <StylesSection />;
      case "brand-checks":
        return (
          <LintSection
            issues={lintIssues}
            onFix={(issue) => {
              const tok = tokenById(issue.tokenId);
              if (!tok) return;
              if (issue.rule === "contrast") {
                const fix = contrastFixFor(tok, color.tokens, resolvedMode);
                if (fix) changeToken(tok.id, fix.value, fix.darkValue);
                return;
              }
              const fixed = composer?.designSystem?.computeAutoFix(tok.value, issue.autoFixHint);
              if (fixed && fixed !== tok.value) changeToken(tok.id, fixed);
            }}
            onOpen={(tokenId) => {
              const tok = tokenById(tokenId);
              const k = tok ? kindOf(tok) : undefined;
              const target: BrandPageId | null =
                k === "color" ? "colours"
                : k === "type" ? "fonts"
                : k === "spacing" ? "spacing"
                : isMoreKind(k) ? `kind-${k}`
                : null;
              if (target) openPage(target, tokenId);
            }}
          />
        );
      case "starters":
        return <StartersSection projectId={projectId} />;
      case "spacing":
        return <TokensSection {...tokenPageProps} openKind="spacing" />;
      case "export":
        return (
          /* 4418:168885: a 760 panel centred in the main area — no page
             header, no preview column. Its ✕ goes back to Colours. */
          <div className="tw:mx-auto tw:w-full tw:max-w-[760px]">
            <ExportSection onClose={() => openPage("colours")} />
          </div>
        );
      default: {
        const kind = page.slice("kind-".length) as MoreKind;
        return <TokensSection {...tokenPageProps} openKind={kind} />;
      }
    }
  };

  /** `slot` names the row when its target moves (the Other tokens row lands
   *  on whichever kind is open). */
  const navRow = (id: BrandPageId, label: string, dirtyHere: boolean, count?: number, slot: string = id) => {
    /* The eleven other kinds are reached from Spacing's kind switch, so the
       Spacing row stays current on their pages. */
    const active = page === id || (id === "spacing" && page.startsWith("kind-"));
    return (
      <Button
        key={slot}
        type="button"
        variant="ghost"
        size="xs"
        className={`${NAV_ROW}${active ? ` ${NAV_ROW_ON}` : ""}`}
        aria-current={active ? "page" : undefined}
        onClick={() => openPage(id)}
        data-section-id={slot}
        data-testid={`brand-row-${slot}`}
      >
        <span className="tw:min-w-0 tw:flex-1 tw:truncate" data-testid={`brand-row-label-${slot}`}>
          {label}
        </span>
        {dirtyHere && (
          <span
            className="tw:size-[5px] tw:flex-none tw:rounded-full tw:bg-[var(--bk-warning)]"
            aria-label="unsaved changes"
          />
        )}
        {count !== undefined && (
          <span className={NAV_COUNT} data-testid={`brand-row-count-${id}`}>
            {count}
          </span>
        )}
      </Button>
    );
  };

  const kindDirty = (reg: KindRegistryLike) => dirtyCount(reg) > 0;

  /* The count the board draws beside two rows: the palette size on Colours,
     the open findings on Brand checks (only while there are any). */
  const navCount = (id: NavId): number | undefined => {
    if (id === "colours") return visibleColors.length;
    if (id === "brand-checks" && lintIssues.length > 0) return lintIssues.length;
    return undefined;
  };

  /* 7316:80949 draws the Light / Dark switch inside the preview card. */
  const previewControls =
    page === "colour-mode" && composer?.colorMode ? <ColorModeToggle composer={composer} /> : undefined;

  /* Import / export is drawn as a panel, not a page with a preview. */
  const isPanelPage = page === "export";

  const isTokenPage = page === "colours" || page === "fonts" || page === "styles" || page === "spacing" || page.startsWith("kind-");

  return (
    <div
      data-ds-preview={resolvedMode}
      data-testid="brand-panel"
      className="tw:flex tw:h-full tw:min-h-0 tw:w-full tw:bg-[var(--bk-bg-panel)] tw:[font-family:var(--bk-font-ui)]"
    >
      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <aside className="tw:flex tw:w-64 tw:shrink-0 tw:flex-col tw:overflow-y-auto tw:border-r tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-panel)]">
        {/* 7315:80955: the back link sits centred on the nav's first line. */}
        <div className="tw:flex tw:justify-center tw:pt-5" data-testid="brand-back-row">
          <Button
            type="button"
            variant="link"
            className="tw:h-auto tw:min-h-0 tw:gap-0.5 tw:px-0 tw:text-[length:var(--bk-text-13)] tw:leading-4 tw:text-[var(--bk-ink)] tw:enabled:hover:text-[var(--bk-accent)] tw:enabled:hover:no-underline"
            onClick={() => requestLeave()}
            data-testid="brand-back-link"
          >
            <ChevronLeft size={12} aria-hidden />
            Back to canvas
          </Button>
        </div>
        <div className="tw:flex tw:flex-col tw:px-4 tw:pt-4" data-testid="brand-nav-head">
          <h1 className="tw:m-0 tw:text-[length:var(--bk-text-24)] tw:font-semibold tw:leading-8 tw:text-[var(--bk-ink)]">
            Brand
          </h1>
          {siteName && (
            <span
              className="tw:truncate tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink-muted)]"
              data-testid="brand-nav-site"
            >
              {siteName}
            </span>
          )}
        </div>
        {/* 72 down to the first row — 7315:80955 leaves the band under the
            site name empty. */}
        <nav className="tw:flex tw:flex-col tw:gap-0.5 tw:px-2 tw:pb-4 tw:pt-18" aria-label="Brand pages">
          {NAV.map((n) => {
            const dirtyHere =
              (n.id === "colours" && kindDirty(color)) ||
              (n.id === "fonts" && kindDirty(type)) ||
              (n.id === "spacing" && (kindDirty(spacing) || MORE_KINDS.some((k) => kindDirty(moreKindRegistry[k.kind])))) ||
              (n.id === "presets" && stylesDirty > 0);
            return (
              <React.Fragment key={n.id}>
                {navRow(n.id, n.label, dirtyHere, navCount(n.id))}

              </React.Fragment>
            );
          })}
        </nav>
      </aside>

      {/* ── Main: pane + preview column, 40 top / 32 sides, 32 between ──── */}
      <div className="tw:flex tw:min-w-0 tw:flex-1 tw:gap-8 tw:px-8 tw:pt-10">
        {/* ── Pane ──────────────────────────────────────────────────────── */}
        <div className="tw:flex tw:min-w-0 tw:flex-1 tw:flex-col" data-testid="brand-pane">
          {/* 36 tall: the title and the 28px action share the centre line at
              y=58, and the card starts 16 under it at y=92 (7315:80955). */}
          {!isPanelPage && (
          <header className="tw:flex tw:h-9 tw:shrink-0 tw:items-center tw:justify-between tw:gap-6">
            <div className="tw:flex tw:min-w-0 tw:items-baseline tw:gap-2.5">
              <h2
                className="tw:m-0 tw:truncate tw:text-[length:var(--bk-text-20)] tw:font-semibold tw:leading-7 tw:text-[var(--bk-ink)]"
                data-testid="brand-page-title"
              >
                {pageLabel(page)}
              </h2>
              <p className="tw:m-0 tw:truncate tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink-muted)]" data-testid="brand-page-caption">
                {caption}
              </p>
            </div>
            <div className="tw:flex tw:shrink-0 tw:items-center tw:gap-3">
              {/* The auto-draft pill (#28). The board's clean state draws no
                  chip, so it appears only while something is staged. */}
              <div aria-live="polite" aria-atomic="true">
                {isDirty && <DraftChip state="dirty" count={totalDirty} />}
              </div>
              {pageAction}
            </div>
          </header>
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
            <div id={`design-section-${page}`} className={`${isPanelPage ? "" : "tw:mt-4 "}tw:min-h-0 tw:flex-1 tw:overflow-y-auto tw:pb-4`} data-testid="brand-page-body">
              {/* Parked STATE board `4418:49685` "Brand · empty": "No brand set."
                  with Browse starters · Import — the workspace's first-run state,
                  on the landing page, until the first Save. The sentence is the
                  design doc's own (§5.7, conformance copy.json). */}
              {isFirstLoad && page === "colours" && (
                <div
                  data-testid="brand-tokens-first-load-banner"
                  className="tw:mb-4 tw:flex tw:flex-col tw:gap-2 tw:rounded-lg tw:border tw:border-[var(--bk-accent-tint)] tw:bg-[var(--bk-accent-tint)] tw:px-4 tw:py-3"
                >
                  <span
                    data-testid="brand-tokens-first-load-text"
                    className="tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink)]"
                  >
                    <strong>No brand set.</strong> Start from a theme or import your client's tokens. These
                    are the site's default design tokens — customize them and click{" "}
                    <strong>{APPLY_CHANGES_LABEL}</strong> to go live.
                  </span>
                  <span className="tw:flex tw:gap-2">
                    <Button size="xs" variant="secondary" onClick={() => openPage("starters")} data-testid="brand-empty-starters">
                      Browse starters
                    </Button>
                    <Button size="xs" variant="secondary" onClick={() => openPage("export")} data-testid="brand-empty-import">
                      Import
                    </Button>
                  </span>
                </div>
              )}

              {renderPage()}
            </div>
          )}

          <DesignTabFooter
            isDirty={isDirty}
            dirtyCount={totalDirty}
            onDiscard={handleDiscard}
            onReview={() => setShowReview(true)}
          />
        </div>

        {/* ── Preview column ────────────────────────────────────────────── */}
        {!isPanelPage && (
        <aside
          className="tw:flex tw:w-[468px] tw:shrink-0 tw:flex-col tw:gap-4 tw:overflow-y-auto tw:pb-4"
          data-testid="brand-preview-column"
        >
          {composer?.exportHTML ? (
            <BrandLivePreview composer={composer} tokens={allTokens} mode={resolvedMode} controls={previewControls} />
          ) : (
            /* No document to render (no composer, or one without an export —
               the load-error and test harnesses): the palette and type slots
               stand in for the page. */
            <section
              className="tw:flex tw:flex-col tw:rounded-[var(--bk-radius-lg)] tw:border tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-panel)]"
              data-testid="brand-live-preview"
            >
              <div className="tw:flex tw:h-10 tw:items-center tw:gap-3 tw:px-4 tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink-muted)]">
                <span className="tw:flex-1">Live preview</span>
                {previewControls}
              </div>
              <BrandPreview colors={visibleColors} />
            </section>
          )}
          {isTokenPage && selectedToken && (
            <TokenDetailView
              key={selectedToken.id}
              token={selectedToken}
              composer={composer}
              allTokens={allTokens}
              mode={resolvedMode}
              onValueChange={changeToken}
              /* Same gate as rename (G3-138): type and spacing have no delete
                 path; offering Delete for them was a silent no-op. */
              onDelete={(() => {
                const k = kindOf(selectedToken);
                return k === "color" || isMoreKind(k) ? deleteToken : undefined;
              })()}
              /* Only colour and the generic kinds can rename; type and spacing
                 have no rename path, and a Rename that silently did nothing
                 was G3-137's defect — the item is disabled for them. */
              onRename={(() => {
                const k = kindOf(selectedToken);
                return k === "color" || isMoreKind(k) ? renameToken : undefined;
              })()}
              onDeleted={() => setSelectedTokenId(null)}
            />
          )}
        </aside>
        )}
      </div>

      <ClassAddDialog open={classAddOpen} composer={composer} onClose={() => setClassAddOpen(false)} />

      <BrandDiscardDialog
        open={guardOpen}
        count={totalDirty}
        onKeepEditing={() => {
          setGuardOpen(false);
          afterLeaveRef.current = null;
        }}
        onDiscard={handleGuardDiscard}
      />

      {showReview && (
        <ReviewModal
          colorTokens={color.tokens}
          colorDiff={color.pendingDiff}
          typeTokens={type.tokens}
          typeSavedTokens={type.savedTokens}
          spacingTokens={spacing.tokens}
          spacingSavedTokens={spacing.savedTokens}
          otherSections={MORE_KINDS.map(({ kind, label }) => {
            const reg = moreKindRegistry[kind];
            return {
              title: `${label} Changes`,
              rows: reg.tokens
                .map((t) => ({ t, saved: reg.savedTokens.find((x) => x.id === t.id) }))
                .filter(({ t, saved }) => tokenDirty(t, saved))
                .map(({ t, saved }) => ({ id: t.id, name: t.name, was: saved?.value ?? "new", now: t.value })),
            };
          })}
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
      {addKind && (
        <TokenAddDialog
          open={showAddToken}
          kind={addKind}
          siblings={addRegistry(addKind)?.tokens ?? []}
          takenIds={allTokens.map((t) => t.id)}
          onCancel={() => setShowAddToken(false)}
          onAdd={handleAddToken}
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

/**
 * The boards draw the workspace in one view — every token, ids shown (18
 * colours on 7315:80955) — and no Beginner / Pro switch (V1 parity, owner
 * order 2026-09-24). The workspace therefore renders in Pro, in its own
 * provider: the site-wide mode the inspector reads is not changed or written.
 */
export const BrandWorkspace: React.FC<BrandWorkspaceProps> = (props) => (
  <DSModeProvider initialMode="pro">
    <BrandWorkspaceBody {...props} />
  </DSModeProvider>
);

export default BrandWorkspace;
