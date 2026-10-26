/**
 * BrandWorkspace — the Brand surface, a full workspace (owner OD-1,
 * 2026-09-21), drawn to Figma 2L9 page 05 (boards B6-B01…B62, canonical since
 * 2026-10-22).
 *
 *   ┌ nav 256 ──────────┬ main ──────────────────────────────┬ preview 468 ─┐
 *   │ Brand             │ ‹ Back to Editor · Home             │               │
 *   │ Tokens            │ Colors · 4   Review changes  Restore│ Website       │
 *   │  Colors           │ Changes apply as you edit — undo …  │ preview       │
 *   │  Typography       │ [+ Add color] [Generate scale]      │               │
 *   │  Spacing          │ ─ the page ─                        │ token card    │
 *   │  Other kinds ›    │                                     │               │
 *   │ Reusable styles   │                                     │               │
 *   │  Type styles · …  │                                     │               │
 *   │  Classes          │                                     │               │
 *   │ Tools             │                                     │               │
 *   │  Dark mode …      │                                     │               │
 *   └───────────────────┴─────────────────────────────────────┴───────────────┘
 *
 * The door is "‹ Back to Editor · <page>", or "‹ Back to Site settings" when
 * Site settings opened Brand (GAP-ST-T03; `requestBrandReturn`). No Undo /
 * Redo inside Brand: the topbar holds the one undo, and every write here is
 * on that stack.
 *
 * Save model (spec §4, Brand Part 1a Task 10): autosave + ONE undo stack.
 * Every edit is one `composer.designSystem.setTokens` transaction the moment
 * it is made — the canvas repaints from that write, the project's debounced
 * autosave persists it, and ⌘Z undoes it alongside canvas edits. There is no
 * draft, no Save, no review-before-apply and no leave guard. "Review changes"
 * is a non-blocking list of this session's token edits, each with Revert.
 * When the site's tokens are read-only (`designSystem.readOnly`: migration
 * failed, the kill switch is off for an unmigrated site, or the site is held)
 * the workspace shows them, says why (`readOnlyReason`), and disables every edit.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { BRAND_READ_ONLY_COPY, BRAND_READ_ONLY_FAILED_COPY } from "@/shared/constants/brandReadOnly";
import { ChevronLeft } from "lucide-react";
import { Button, Tooltip, useToast } from "@/editor/chrome-ui";
import type { Composer } from "@/engine/Composer";
import { EVENTS } from "@/shared/constants/events";
import { resolveTokenLiteral, setTokenLiteral } from "@buildrik/shared/tokens";
import type { SpacingPreset } from "../state/spacingRegistry";
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
  useProjectTokenStore,
} from "../state/TokenRegistryContext";
import {
  useButtonPresets, useCardPresets, useFormPresets, useLinkPresets,
  useBadgePresets, useAlertPresets, useTooltipPresets, useModalPresets,
  useNavPresets, useTablePresets, useLayoutPresets,
} from "../state/StylePresetRegistryContext";
import type { DesignToken, StylePreset, TokenKind } from "../types";
import type { TokensForKindRegistry } from "../state/kindRegistry";
import { generateColorTokenId, generateColorCssVar } from "../utils/exportUtils";
import { DSModeProvider, useDSModeOptional } from "../state/DSModeContext";
import { AIPromptModal } from "./AIPromptModal";
import { TokenAddDialog } from "./modals/TokenAddDialog";
import { SessionEditsPopover } from "./SessionEditsPopover";
import { BrandPreview } from "./BrandPreview";
import { BrandCard, BrandChevron, BrandRow } from "./BrandCard";
import { BrandLivePreview } from "./BrandLivePreview";
import { orderColourTokens } from "./colors/ColorTokenList";
import { TokenDetailView } from "./sections/TokenDetailView";
import { TokensSection } from "./sections/TokensSection";
import { StylesSection } from "./sections/StylesSection";
import { ReusableStylesSection } from "./sections/ReusableStylesSection";
import { isFeatureEnabled } from "@/shared/utils/featureFlags";
import { ExportSection } from "./sections/ExportSection";
import { LintSection, contrastFixFor } from "./sections/LintSection";
import { filterTokensByMode } from "../utils/semanticKind";
import { ClassesSection } from "./sections/ClassesSection";
import { ClassAddDialog } from "./sections/ClassAddDialog";
import { TypographySection } from "./sections/TypographySection";
import { openSiteFonts } from "@/editor/inspector/sections/typography";
import { requestInsertGroup } from "@/editor/sidebar/tabs/build/insertGroupRequest";
import { takeBrandPageRequest, takeBrandReturn, takeBrandTokenRequest } from "./brandOpenRequest";
import { ConnectTokensCheck } from "./sections/ConnectTokensCheck";
import { StartersSection } from "./sections/StartersSection";
import { BrandFromSource } from "./sections/BrandFromSource";
import { ColourModeSection } from "./sections/ColourModeSection";
import { DarkModeCard } from "./sections/DarkModeCard";
import { ScaleGenerator } from "./sections/ScaleGenerator";
import { RestorePointsSection } from "./sections/RestorePointsSection";
import { useSiteDarkMode } from "../state/useSiteDarkMode";
import { useOnline } from "../state/useOnline";
import { useBrandPreview } from "../state/useBrandPreview";
import { DarkModeSchema } from "@buildrik/shared/schemas/design-tokens";
import type { BrandPreview as CanvasPreview } from "@/engine/designSystem/types";
import { ColorModeToggle } from "./ColorModeToggle";
import { useDSLint } from "../state/useDSLint";
import { DEFAULT_TOKENS } from "@/engine/designSystem/defaultTokens";
import {
  SIDE_CARD,
  SIDE_CARD_BODY,
  SIDE_CARD_TITLE,
  useTokenBreakdownIds,
  useUsageHighlight,
  UsageHighlightCard,
  UsageHighlightNotice,
} from "./sections/UsageHighlight";

// ─── Pages ────────────────────────────────────────────────────────────────────

/** 2L9 B6-B01's nav: three groups, in the board's order. Page ids are the
 *  code's (deep links and `requestBrandPage` callers use them); labels are
 *  the board's. */
const NAV_GROUPS = [
  {
    label: "Tokens",
    rows: [
      { id: "colours",     label: "Colors" },
      { id: "fonts",       label: "Typography" },
      { id: "spacing",     label: "Spacing" },
      { id: "other-kinds", label: "Other kinds ›" },
    ],
  },
  {
    label: "Reusable styles",
    rows: [
      { id: "styles",  label: "Type styles · Presets" },
      { id: "classes", label: "Classes" },
    ],
  },
  {
    label: "Tools",
    rows: [
      { id: "colour-mode",  label: "Dark mode" },
      { id: "brand-checks", label: "Checks" },
      { id: "starters",     label: "Starters" },
      { id: "export",       label: "Import / export" },
    ],
  },
] as const;

type NavId = (typeof NAV_GROUPS)[number]["rows"][number]["id"];

/* The eleven kinds with no page of their own on the board's nav: each is a
   page under "Other kinds ›" (B6-B23), with the board's one-line description. */
const MORE_KINDS = [
  { kind: "radius",     label: "Radius",     description: "Corner rounding" },
  { kind: "shadow",     label: "Shadow",     description: "Elevation and depth" },
  { kind: "motion",     label: "Motion",     description: "Durations and easing" },
  { kind: "border",     label: "Border",     description: "Border widths" },
  { kind: "opacity",    label: "Opacity",    description: "Transparency steps" },
  { kind: "zindex",     label: "Z-index",    description: "Stacking order" },
  { kind: "breakpoint", label: "Breakpoint", description: "Layout widths for devices" },
  { kind: "grid",       label: "Grid",       description: "Columns and gutters" },
  { kind: "sizing",     label: "Sizing",     description: "Fixed widths and heights" },
  { kind: "icon",       label: "Icon",       description: "Icon sizes" },
  { kind: "imagery",    label: "Imagery",    description: "Image ratios and treatments" },
] as const satisfies ReadonlyArray<{ kind: TokenKind; label: string; description: string }>;

type MoreKind = (typeof MORE_KINDS)[number]["kind"];
/* Pages with no nav row of their own; the row named in `parentRow` stays
   current on them:
   "connect"          — Connect to Brand colors (BRP1-M7), under Checks;
   "brand-from-source"— From logo or URL (BRP1-M11), under Starters, dsAi;
   "scale"            — the colour scale generator (BRP1-M9), under Colors;
   "presets"          — the catalogue's preset drill-in, under
                        Type styles · Presets (B6-B26);
   "kind-*"           — under Other kinds;
   "restore-points"   — the header's action; no row is current on it. */
const FROM_SOURCE = "brand-from-source";
type SubPageId = "connect" | typeof FROM_SOURCE | "scale" | "restore-points" | "presets";
export type BrandPageId = NavId | `kind-${MoreKind}` | SubPageId;

const SUB_PAGES: readonly SubPageId[] = ["connect", FROM_SOURCE, "scale", "restore-points", "presets"];

const LANDING: BrandPageId = "colours";

function isPageId(value: string): value is BrandPageId {
  return (
    (SUB_PAGES as readonly string[]).includes(value) ||
    NAV_GROUPS.some((g) => g.rows.some((n) => n.id === value)) ||
    MORE_KINDS.some((k) => `kind-${k.kind}` === value)
  );
}

/** The nav row that stays current while `page` is open. */
function parentRow(page: BrandPageId): BrandPageId | null {
  if (page.startsWith("kind-")) return "other-kinds";
  if (page === "connect") return "brand-checks";
  if (page === FROM_SOURCE) return "starters";
  if (page === "scale") return "colours";
  if (page === "presets") return "styles";
  if (page === "restore-points") return null;
  return page;
}

function pageLabel(id: BrandPageId): string {
  if (id === "connect") return "Connect to Brand colors";
  if (id === FROM_SOURCE) return "From logo or URL";
  if (id === "restore-points") return "Restore points";
  if (id === "presets") return "Presets";
  if (id === "other-kinds") return "Other kinds";
  for (const g of NAV_GROUPS) for (const n of g.rows) if (n.id === id) return n.label;
  return MORE_KINDS.find((k) => `kind-${k.kind}` === id)?.label ?? id;
}

/** The strap under every page title (B6-B01): autosave, one undo. */
const STRAP = "Changes apply as you edit — undo any time";

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
/* The header's page action (7315:80955 "+ Add token": 28 tall, 13px, hairline). */
/* B6-B22: the three presets on the 4px grid (spacingRegistry), segmented. */
const SPACING_PRESETS: [SpacingPreset, string][] = [
  ["compact", "Compact"],
  ["normal", "Normal"],
  ["spacious", "Spacious"],
];
const SEG_TRACK =
  "tw:box-border tw:inline-flex tw:h-7 tw:items-center tw:gap-0.5 tw:rounded-[var(--bk-radius-md)] tw:border tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-panel)] tw:p-px";
const SEG_ITEM =
  "tw:h-6 tw:min-h-0 tw:rounded-[var(--bk-radius-sm)] tw:border-0 tw:px-3 tw:text-[length:var(--bk-text-13)] tw:font-medium tw:leading-5 tw:focus:ring-0 tw:focus-visible:[box-shadow:var(--bk-shadow-focus)]";
const SEG_ITEM_ON = "tw:bg-[var(--bk-gray-100)] tw:text-[var(--bk-ink)] tw:enabled:hover:bg-[var(--bk-gray-100)]";
const SEG_ITEM_OFF = "tw:bg-transparent tw:text-[var(--bk-ink-soft)] tw:enabled:hover:bg-[var(--bk-bg-subtle)]";

/* The disabled look is spelled out: on a read-only site the action is
   disabled by its EditLock fieldset, not by its own prop, and flowbite only
   applies its disabled theme for the prop (BRP1-M1 greys the header). */
const PAGE_ACTION =
  "tw:h-7 tw:rounded-[var(--bk-radius-md)] tw:border-[var(--bk-border)] tw:px-3 tw:text-[length:var(--bk-text-13)] tw:font-medium tw:leading-5 tw:text-[var(--bk-gray-700)] " +
  "tw:disabled:border-transparent tw:disabled:bg-[var(--bk-bg-subtle)] tw:disabled:text-[var(--bk-ink-muted)]";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/* Seed tokens merge back on every read, so deleting one only ever reset it:
   its Delete is "Reset to default" (owner, OQ-7). */
const SEED_BY_ID = new Map(DEFAULT_TOKENS.map((t) => [t.id, t]));

const lightOf = (tokens: readonly DesignToken[], id: string): string => resolveTokenLiteral(tokens, id, "light") ?? "";

/** Disables every native control inside while the tokens are read-only.
 *  `display: contents`, so it never takes part in the layout it sits in.
 *  A button disabled by the fieldset matches `:disabled` but never gets
 *  flowbite's disabled theme (that follows the prop), so "Change" / "Set"
 *  stayed in live ink on a read-only site. BRP1-M1 mutes every locked
 *  control's label; the descendant selector outranks the button's own colour. */
const EDIT_LOCK = "tw:contents tw:[&_button:disabled]:text-[var(--bk-ink-muted)]";
function EditLock({ locked, children }: { locked: boolean; children: React.ReactNode }) {
  return (
    <fieldset disabled={locked} className={EDIT_LOCK} data-testid={locked ? "brand-edit-lock" : undefined}>
      {children}
    </fieldset>
  );
}

// ─── BrandWorkspace ───────────────────────────────────────────────────────────

export interface BrandWorkspaceProps {
  composer: Composer | null;
  /** Scopes the starter token blob in storage — Starters is a destination now. */
  projectId?: string | null;
  /** A page to land on instead of Colours — `openLeftPanelToTab("design", <id>)`. */
  initialPage?: string;
  /** `‹ Back to Editor` / Escape (not called when Site settings opened Brand: that door reopens Settings). */
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
  const [page, setPage] = React.useState<BrandPageId>(() => {
    const requested = takeBrandPageRequest(composer) ?? initialPage;
    return requested && isPageId(requested) ? requested : LANDING;
  });
  const [showAddToken, setShowAddToken] = React.useState(false);
  const [aiOpen, setAiOpen] = React.useState(false);
  const [classAddOpen, setClassAddOpen] = React.useState(false);

  /* What the live preview SHOWS (BRP1-M8): the Brand preview layer's tokens
     and theme, else the saved brand in light — the same rule
     ProjectTokensApplier paints the canvas by. The outermost wrapper carries
     it as data-ds-preview. */
  const siteDarkMode = useSiteDarkMode(composer);
  const [canvasPreview, setCanvasPreview] = React.useState<CanvasPreview | null>(() => composer?.designSystem?.preview ?? null);
  React.useEffect(() => {
    if (!composer || typeof composer.on !== "function") return;
    const sync = () => setCanvasPreview(composer.designSystem?.preview ?? null);
    sync();
    composer.on(EVENTS.BRAND_PREVIEW_CHANGED, sync);
    return () => {
      composer.off(EVENTS.BRAND_PREVIEW_CHANGED, sync);
    };
  }, [composer]);
  const shownMode: "light" | "dark" = canvasPreview?.theme ?? "light";
  /* L4-021: the Light / Dark switch is PREVIEW-ONLY — a dark preview of the
     saved brand through the preview layer: never saved, never in ⌘Z, gone
     when Brand closes. Dark needs the site's Dark mode on (an Off site
     publishes light only); turning it Off mid-preview drops back to light.
     While another flow (generator, Dark-mode Auto, logo/URL) is previewing,
     the switch waits. The canvas theme toggle's look (BRP1-M12, source
     "canvas") is the same saved brand, so the switch shows it and owns it:
     Light clears it, Dark takes it over. */
  const themePreview = useBrandPreview(composer ?? null);
  const setPreviewTheme = (theme: "light" | "dark") => {
    if (theme === "light") {
      themePreview.clear();
      if (composer?.designSystem.preview?.source === "canvas") composer.designSystem.setPreview(null);
      return;
    }
    themePreview.show((tokens, settings) =>
      DarkModeSchema.catch("off").parse(settings.darkMode) === "off" ? null : { tokens, darkMode: "auto", theme: "dark" },
    );
  };
  const previewLocked = canvasPreview !== null && canvasPreview.source !== "canvas" && !themePreview.active;

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
  const store      = useProjectTokenStore();
  const readOnly   = store.readOnly;
  /* B6-B43: offline, edits still apply (autosave retries); restore points
     and reading a website need the server. */
  const online     = useOnline();
  /* "No brand set" (4418:49685): the site has never saved a token. */
  const isFirstLoad = !composer?.getProjectSettings()?.designTokens?.length;

  // The preset registries feed the Styles page's count (read-only).
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
  const allPresetRegistries = [
    buttonPresets, cardPresets, formPresets, linkPresets, badgePresets, alertPresets,
    tooltipPresets, modalPresets, navPresets, tablePresets, layoutPresets,
  ];

  const allPresets: StylePreset[] = allPresetRegistries.flatMap((r) => r.presets);

  /* "+ Add token" (7318:81125): the kind is the page's. Only kinds with an
     add path offer it — colour, spacing and the eleven generic kinds. */
  const addKind: TokenKind | null =
    page === "colours" ? "color" : page === "spacing" ? "spacing" : page.startsWith("kind-") ? (page.slice(5) as TokenKind) : null;
  const addRegistry = (k: TokenKind | null): { tokens: DesignToken[]; addToken: (t: DesignToken) => boolean } | null =>
    k === "color" ? color : k === "spacing" ? spacing : k && isMoreKind(k) ? moreKindRegistry[k] : null;
  /* A refused write (read-only, or a set that would not validate) changed
     nothing — say so rather than letting the edit look applied. */
  /* A receipt (B6-B10/B20/B40): what happened, and "Undo" — the one undo,
     composer.history, never a Brand-local stack. */
  const receipt = (description: string) =>
    addToast({ description, tone: "success", action: { label: "Undo", onClick: () => { store.undo(); } } });
  const refused = (what: string) => addToast({ description: `${what} wasn't applied — nothing was changed.`, tone: "error" });
  const handleAddToken = (token: DesignToken) => {
    setShowAddToken(false);
    if (!addRegistry(token.kind ?? null)?.addToken(token)) return refused(`Token "${token.name}"`);
    setSelectedTokenId(token.id);
    addToast({ description: `Token "${token.name}" added`, tone: "success" });
  };

  /* GAP-ST-T03: opened from Site settings, the door goes back there, to the
     screen it came from. Taken once on mount, like the page and token holds. */
  const [settingsReturn] = React.useState(() => takeBrandReturn(composer));

  /* `‹ Back` / Escape: nothing is staged, so nothing to guard (autosave,
     B6-B05's guard → authority code:autosave-no-leave-guard). */
  const requestLeave = React.useCallback(() => {
    if (settingsReturn && composer) {
      composer.emit(EVENTS.UI_PANEL_OPEN, settingsReturn.screen ? { panel: "settings", screen: settingsReturn.screen } : { panel: "settings" });
      return;
    }
    onClose?.();
  }, [onClose, settingsReturn, composer]);

  /* "Browse section blocks in Add ›" (B6-B26) leaves Brand for Add with
     BLOCKS open. */
  const openSectionInAdd = React.useCallback(() => {
    onClose?.();
    if (!composer) return;
    composer.emit?.(EVENTS.UI_SWITCH_TAB, { tab: "add" });
    requestInsertGroup(composer, "blocks");
  }, [onClose, composer]);

  // Escape is the same door. The dialogs own their own Escape while they are
  // up; an input keeps its own.
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (showAddToken || aiOpen || classAddOpen) return;
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
  }, [showAddToken, aiOpen, classAddOpen, requestLeave]);

  // ─ Pane content ─
  const visibleColors = filterTokensByMode(color.tokens ?? [], isBeginner ? "beginner" : "pro");

  /* "‹ Back to Editor · Home" (B6-B01): the door names the page the editor
     kept open ("Home" is the board's sample). The workspace covers the
     canvas, so a page switch cannot happen while it is up; PROJECT_LOADED
     covers a reload under it. */
  const [editorPageName, setEditorPageName] = React.useState("");
  React.useEffect(() => {
    if (!composer || typeof composer.on !== "function") return;
    const read = () => setEditorPageName(composer.elements?.getActivePage?.()?.name ?? "");
    read();
    composer.on(EVENTS.PAGE_CHANGED, read);
    composer.on(EVENTS.PROJECT_LOADED, read);
    return () => {
      composer.off(EVENTS.PAGE_CHANGED, read);
      composer.off(EVENTS.PROJECT_LOADED, read);
    };
  }, [composer]);

  /* The selected token — the right column's card (7315:80955). One per
     workspace, cleared on a page change; a row click on any token page sets
     it. The card is a sibling of the table, not a drill-in. */
  const [selectedTokenId, setSelectedTokenId] = React.useState<string | null>(null);
  /* BRP1-M5: the token whose "Used by N" was clicked — its elements are
     outlined in the live preview until Clear highlight or a page change. */
  const [usageTokenId, setUsageTokenId] = React.useState<string | null>(null);
  const usageIds = useTokenBreakdownIds(composer, usageTokenId);
  const usageHighlight = useUsageHighlight(composer, usageIds);
  /* BRP1-M7: Connect to tokens' preview — the elements its Apply would bind. */
  const [connectIds, setConnectIds] = React.useState<readonly string[] | null>(null);
  /* A page change drops the selection — unless the move is FOR a token
     (Brand checks' Open), which lands on its page with its card open. */
  const openPage = (id: BrandPageId, tokenId: string | null = null) => {
    setPage(id);
    setSelectedTokenId(tokenId);
    setUsageTokenId(null);
    setConnectIds(null);
  };
  const allTokens = store.all;
  const selectedToken = selectedTokenId ? allTokens.find((t) => t.id === selectedTokenId) : undefined;
  /* BRP1-M9: the semantic colour the generator writes a scale for (OQ-3:
     any of them). The Colours page action is Primary's (the board's lines
     name Primary; the landing page auto-selects its first row, so "the
     selected token" would rarely be what was meant); a token card's menu
     takes its own. */
  const isSemanticColour = (t: DesignToken | undefined) => Boolean(t && t.kind === "color" && t.layer === "semantic" && !t.replacedBy);
  const [scaleRole, setScaleRole] = React.useState("color-primary");
  const openScale = (roleId: string) => {
    setScaleRole(roleId);
    openPage("scale");
  };


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
  /* A token's own page with its card open — Brand checks' Open, and the
     inspector's bound chip (G3-156). */
  const openToken = (tokenId: string) => {
    const tok = tokenById(tokenId);
    const k = tok ? kindOf(tok) : undefined;
    const target: BrandPageId | null =
      k === "color" ? "colours"
      : k === "type" ? "fonts"
      : k === "spacing" ? "spacing"
      : isMoreKind(k) ? `kind-${k}`
      : null;
    if (target) openPage(target, tokenId);
  };
  /* The chip's request, taken once on mount; applied once its token has
     loaded into a registry. */
  const [requestedToken, setRequestedToken] = React.useState(() => takeBrandTokenRequest(composer));
  React.useEffect(() => {
    if (!requestedToken || !tokenById(requestedToken)) return;
    openToken(requestedToken);
    setRequestedToken(undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedToken, allTokens]);
  /* A value edit — light, and the dark value when the card sets one — is ONE
     write, so ⌘Z undoes it in one step (and Review changes lists one row). */
  const changeToken = (id: string, value: string, darkValue?: string) => {
    const tok = tokenById(id);
    if (!tok) return;
    let next = allTokens;
    const write = (mode: "light" | "dark", v: string) => {
      if ((resolveTokenLiteral(next, id, mode) ?? "") !== v) next = setTokenLiteral(next, id, mode, v);
    };
    write("light", value);
    if (darkValue !== undefined) write("dark", darkValue);
    if (next === allTokens) return;
    if (!store.commit(next, "Edit token")) refused(`"${tok.name}"`);
  };
  const deleteToken = (id: string, opts?: { replaceWith?: string }) => {
    const tok = tokenById(id);
    if (!tok) return;
    const k = kindOf(tok);
    const ok = k === "color" ? color.deleteToken(id, opts) : isMoreKind(k) ? moreKindRegistry[k].deleteToken(id, opts) : false;
    if (!ok) return refused(`Deleting "${tok.name}"`);
    /* 8224:233678 "replaced": the toast names both and the one undo. */
    const replacement = opts?.replaceWith ? tokenById(opts.replaceWith) : undefined;
    if (replacement) {
      receipt(`${tok.friendlyName ?? tok.name} replaced with ${replacement.friendlyName ?? replacement.name}.`);
    }
  };
  const resetToken = (id: string) => {
    const tok = tokenById(id);
    const seed = SEED_BY_ID.get(id);
    if (!tok || !seed) return;
    if (!store.commit(allTokens.map((t) => (t.id === id ? seed : t)), "Reset token")) {
      return refused(`Resetting "${tok.name}"`);
    }
    receipt(`${tok.friendlyName ?? tok.name} reset to default.`);
  };
  const renameToken = (id: string, newId: string) => {
    const tok = tokenById(id);
    if (!tok) return;
    const k = kindOf(tok);
    const ok = k === "color" ? color.renameToken(id, newId) : isMoreKind(k) ? moreKindRegistry[k].renameToken(id, newId) : false;
    if (!ok) refused(`Renaming "${tok.name}"`);
  };

  /* The page title (B6-B01 "Colors · 4", B6-B18 "Checks · 2"): the two
     counts the boards draw ride in the title; every other page is its name.
     The scale generator sits under Colors and keeps its title. */
  const checksLabel = lintIssues.length > 0 ? `Checks · ${lintIssues.length}` : "Checks";
  const title =
    page === "colours" || page === "scale" ? `Colors · ${visibleColors.length}`
    : page === "brand-checks" ? checksLabel
    : pageLabel(page);

  /* The page's actions, at the top of the body under the strap (B6-B01:
     "+ Add color · Generate scale"). */
  const pageAction = (() => {
    switch (page) {
      case "colours":
        return (
          <>
            <Button type="button" variant="secondary" size="xs" className={PAGE_ACTION} onClick={() => setShowAddToken(true)} data-testid="brand-page-action">
              + Add color
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="xs"
              className={PAGE_ACTION}
              onClick={() => openScale("color-primary")}
              data-testid="brand-generate-scale"
            >
              Generate scale
            </Button>
          </>
        );
      case "styles": {
        /* blocked:pr33-ai-removal — PR #33 deletes this entry and its modal;
           left as it was until then. 7316:82153's page action. Gated on the SAME flag that decides
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
          <Tooltip content="Coming soon: AI component styles aren't available yet" placement="bottom" arrow={false}>
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
           every edit; this runs them now (useDSLint's one trigger). The
           ignored count (B6-B18 "Show ignored · 1") rides beside it. */
        return (
          <>
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
            {suppressedCount > 0 && (
              <span className="tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink-muted)]" data-testid="brand-checks-ignored">
                Ignored · {suppressedCount}
              </span>
            )}
          </>
        );
      case "spacing":
        /* B6-B22: the three presets as one segmented control, then Reset to
           defaults; each is one write. "+ Add spacing" is code-ahead (the
           board adds none) and stays. */
        return (
          <>
            <div role="group" aria-label="Spacing preset" className={SEG_TRACK} data-testid="brand-spacing-presets">
              {SPACING_PRESETS.map(([p, label]) => (
                <Button
                  key={p}
                  type="button"
                  color="light"
                  size="xs"
                  aria-pressed={spacing.activePreset === p}
                  className={`${SEG_ITEM} ${spacing.activePreset === p ? SEG_ITEM_ON : SEG_ITEM_OFF}`}
                  onClick={() => {
                    if (!spacing.applyPreset(p)) refused("The spacing preset");
                  }}
                  data-testid={`spacing-preset-${p}`}
                >
                  {label}
                </Button>
              ))}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              className={`${PAGE_ACTION} tw:border-transparent tw:bg-transparent`}
              onClick={() => {
                if (spacing.resetToDefaults()) addToast({ description: "Spacing reset to defaults.", tone: "info" });
                else refused("Resetting spacing");
              }}
              data-testid="spacing-reset-defaults"
            >
              Reset to defaults
            </Button>
            <Button type="button" variant="secondary" size="xs" className={PAGE_ACTION} onClick={() => setShowAddToken(true)} data-testid="brand-page-action">
              + Add spacing
            </Button>
          </>
        );
      case "fonts":
        /* B6-B21: the fonts a site can pick from are its Site fonts — the
           same door the font picker's "Manage site fonts" opens. */
        return (
          <Button type="button" variant="secondary" size="xs" className={PAGE_ACTION} onClick={() => openSiteFonts(composer)} data-testid="brand-page-action">
            Manage site fonts ›
          </Button>
        );
      default: {
        if (!page.startsWith("kind-")) return null;
        /* B6-B24: "+ Add radius" — the kind's own name. */
        const kind = MORE_KINDS.find((k) => `kind-${k.kind}` === page);
        return (
          <Button type="button" variant="secondary" size="xs" className={PAGE_ACTION} onClick={() => setShowAddToken(true)} data-testid="brand-page-action">
            + Add {kind?.label.toLowerCase() ?? "token"}
          </Button>
        );
      }
    }
  })();

  const tokenPageProps = {
    onAddTokenClick: () => setShowAddToken(true),
    composer,
    selectedTokenId,
    onSelectToken: setSelectedTokenId,
    onShowUsage: (tokenId: string) => {
      setSelectedTokenId(tokenId);
      setUsageTokenId(tokenId);
    },
  };
  const usageToken = usageTokenId ? allTokens.find((t) => t.id === usageTokenId) : undefined;
  const usageTokenName = usageToken ? (usageToken.friendlyName ?? usageToken.name) : "";

  const renderPage = (): React.ReactNode => {
    switch (page) {
      case "colours":
        return <TokensSection {...tokenPageProps} openKind="color" />;
      case "other-kinds":
        /* B6-B23: one row per kind, its page behind it. */
        return (
          <div className="tw:flex tw:flex-col tw:gap-3">
            <p className="tw:m-0 tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink-muted)]">
              Each kind has its own page. Values use that kind’s validator.
            </p>
            <BrandCard label="Other kinds" data-testid="brand-other-kinds">
              {MORE_KINDS.map((k) => (
                <BrandRow
                  key={k.kind}
                  data-testid={`brand-kind-row-${k.kind}`}
                  onSelect={() => openPage(`kind-${k.kind}`)}
                  trailing={<BrandChevron />}
                  name={k.label}
                  sub={k.description}
                />
              ))}
            </BrandCard>
          </div>
        );
      case "scale":
        return (
          <ScaleGenerator
            key={scaleRole}
            composer={composer}
            roleId={scaleRole}
            /* 8224:243869's toast. */
            onApplied={() => receipt("Color scale added.")}
          />
        );
      case "colour-mode":
        /* BRP1-M8's Dark mode card over the per-token dark values (7316:80949). */
        return (
          <div className="tw:flex tw:flex-col tw:gap-4">
            <DarkModeCard composer={composer} previewTheme={shownMode} onPreviewTheme={setPreviewTheme} />
            <ColourModeSection />
          </div>
        );
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
            onBrowseBlocks={openSectionInAdd}
          />
        );
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
                const fix = contrastFixFor(tok, color.tokens, shownMode);
                if (fix) changeToken(tok.id, fix.value, fix.darkValue);
                return;
              }
              const current = lightOf(allTokens, tok.id);
              const fixed = composer?.designSystem?.computeAutoFix(current, issue.autoFixHint);
              if (fixed && fixed !== current) changeToken(tok.id, fixed);
            }}
            onOpen={openToken}
            onConnect={() => openPage("connect")}
          />
        );
      case "connect":
        return (
          <ConnectTokensCheck
            composer={composer}
            tokens={allTokens}
            onPreview={setConnectIds}
            onBack={() => openPage("colours")}
            /* 8224:236236's toast. */
            onApplied={(n) => receipt(`Connected ${n} color usage${n === 1 ? "" : "s"}.`)}
          />
        );
      case "restore-points":
        return (
          <RestorePointsSection
            composer={composer}
            /* 8224:245787's toast. */
            onRestored={(label) => receipt(`Restored “${label}”.`)}
            onFailed={() => refused("That restore point")}
          />
        );
      case "starters":
        return (
          <StartersSection
            composer={composer}
            projectId={projectId}
            onOpenFromSource={isFeatureEnabled("dsAi") ? () => openPage(FROM_SOURCE) : undefined}
            /* B6-B10: back on Colors with the receipt. */
            onApplied={(name) => {
              openPage("colours");
              receipt(`Applied ${name}. Restore point created.`);
            }}
          />
        );
      case FROM_SOURCE:
        return <BrandFromSource composer={composer ?? null} />;
      case "spacing":
        return (
          <>
            <p className="tw:m-0 tw:mb-3 tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink-muted)]" data-testid="brand-spacing-note">
              Spacing steps can be changed but not renamed or deleted.
            </p>
            <TokensSection {...tokenPageProps} openKind="spacing" />
          </>
        );
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

  const currentRow = parentRow(page);
  const navRow = (id: NavId, label: string) => {
    const active = currentRow === id;
    return (
      <Button
        key={id}
        type="button"
        variant="ghost"
        size="xs"
        className={`${NAV_ROW}${active ? ` ${NAV_ROW_ON}` : ""}`}
        aria-current={active ? "page" : undefined}
        onClick={() => openPage(id)}
        data-section-id={id}
        data-testid={`brand-row-${id}`}
      >
        <span className="tw:min-w-0 tw:flex-1 tw:truncate" data-testid={`brand-row-label-${id}`}>
          {id === "brand-checks" ? checksLabel : label}
        </span>
      </Button>
    );
  };

  /* The preview card's Light / Dark switch, on every page that has the
     preview — the dark check is not a Colour-mode-only question. */
  const previewControls = composer ? (
    <ColorModeToggle theme={shownMode} onChange={setPreviewTheme} siteOff={siteDarkMode === "off"} locked={previewLocked} />
  ) : undefined;

  /* Import / export is drawn as a panel, not a page with a preview. */
  const isPanelPage = page === "export";

  const isTokenPage = page === "colours" || page === "fonts" || page === "styles" || page === "spacing" || page.startsWith("kind-");

  /* The door out (B6-B01 "‹ Back to Editor · Home"; GAP-ST-T03 "‹ Back to
     Site settings" when Site settings opened Brand). */
  const backLabel = settingsReturn ? "Back to Site settings" : editorPageName ? `Back to Editor · ${editorPageName}` : "Back to Editor";

  return (
    <div
      data-ds-preview={shownMode}
      data-testid="brand-panel"
      className="tw:flex tw:h-full tw:min-h-0 tw:w-full tw:bg-[var(--bk-bg-panel)] tw:[font-family:var(--bk-font-ui)]"
    >
      {/* ── Nav: "Brand", then the three groups (B6-B01) ─────────────────── */}
      <aside className="tw:flex tw:w-64 tw:shrink-0 tw:flex-col tw:overflow-y-auto tw:border-r tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-panel)]">
        <div className="tw:flex tw:flex-col tw:px-4 tw:pt-5" data-testid="brand-nav-head">
          <h1 className="tw:m-0 tw:text-[length:var(--bk-text-20)] tw:font-semibold tw:leading-[30px] tw:text-[var(--bk-ink)]">
            Brand
          </h1>
        </div>
        <nav className="tw:flex tw:flex-col tw:gap-4 tw:px-2 tw:pb-4 tw:pt-4" aria-label="Brand pages">
          {NAV_GROUPS.map((g) => (
            <div key={g.label} className="tw:flex tw:flex-col tw:gap-0.5" role="group" aria-labelledby={`brand-nav-group-${g.label}`} data-testid="brand-nav-group">
              <p
                id={`brand-nav-group-${g.label}`}
                className="tw:m-0 tw:px-3 tw:pb-1 tw:text-[length:var(--bk-text-12)] tw:font-medium tw:leading-[18px] tw:text-[var(--bk-ink-muted)]"
              >
                {g.label}
              </p>
              {g.rows.map((n) => navRow(n.id, n.label))}
            </div>
          ))}
        </nav>
      </aside>

      {/* ── Main: the door, the header (title · Review changes · Restore
           points, the strap under it), then pane + preview column. ──────── */}
      <div className="tw:flex tw:min-w-0 tw:flex-1 tw:flex-col tw:px-8 tw:pt-5">
        <div className="tw:flex tw:shrink-0" data-testid="brand-back-row">
          <Button
            type="button"
            variant="link"
            className="tw:h-auto tw:min-h-5 tw:-my-0.5 tw:gap-0.5 tw:px-0 tw:text-[length:var(--bk-text-13)] tw:leading-4 tw:text-[var(--bk-ink)] tw:enabled:hover:text-[var(--bk-accent)] tw:enabled:hover:no-underline"
            onClick={() => requestLeave()}
            data-testid="brand-back-link"
          >
            <ChevronLeft size={12} aria-hidden />
            {backLabel}
          </Button>
        </div>
        {!isPanelPage && (
          <header className="tw:mt-4 tw:flex tw:shrink-0 tw:flex-col tw:gap-1" data-testid="brand-header">
            <div className="tw:flex tw:h-[30px] tw:items-center tw:gap-2">
              <h2
                className="tw:m-0 tw:min-w-0 tw:flex-1 tw:truncate tw:text-[length:var(--bk-text-20)] tw:font-semibold tw:leading-[30px] tw:tracking-[-0.24px] tw:text-[var(--bk-ink)]"
                data-testid="brand-page-title"
              >
                {title}
              </h2>
              {/* "Review changes" (spec §4): non-blocking, this session's
                  edits with Revert. No Undo / Redo here: the topbar's is the
                  one undo (GAP-ST boards draw a pair — not adopted). */}
              <SessionEditsPopover
                edits={store.edits}
                onRevert={(key) => {
                  if (!store.revert(key)) refused("That revert");
                }}
                disabled={readOnly}
                extraActions={
                  /* Opening the list is a read, so it stays live on a
                     read-only site (Restore does not) — but it is a server
                     read: offline it waits, and says why (B6-B43). */
                  <>
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      className={`${PAGE_ACTION} tw:border-transparent tw:bg-transparent`}
                      aria-current={page === "restore-points" ? "page" : undefined}
                      disabled={!online}
                      aria-describedby={online ? undefined : "brand-restore-offline"}
                      onClick={() => openPage("restore-points")}
                      data-testid="brand-restore-points-action"
                    >
                      Restore points
                    </Button>
                    {!online && (
                      <span id="brand-restore-offline" className="tw:text-[length:var(--bk-text-12)] tw:leading-[18px] tw:text-[var(--bk-ink-muted)]">
                        Restore points need a connection
                      </span>
                    )}
                  </>
                }
              />
            </div>
            <p className="tw:m-0 tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink-muted)]" data-testid="brand-page-strap">
              {STRAP}
            </p>
          </header>
        )}
      <div className={`tw:flex tw:min-h-0 tw:flex-1 tw:gap-8 ${isPanelPage ? "" : "tw:mt-5"}`}>
        {/* ── Pane ──────────────────────────────────────────────────────── */}
        <div className="tw:flex tw:min-w-0 tw:flex-1 tw:flex-col" data-testid="brand-pane">
          {/* BRP1-M1 (8222:229015 / 229636 / 230245): a flat warning-tint
              strip, 12 in, 12/18 ink — no border, no radius — 20 over the body. */}
          {!online && !readOnly && (
            <div
              role="status"
              data-testid="brand-offline-banner"
              className="tw:mb-5 tw:bg-[var(--bk-warning-tint)] tw:p-3 tw:text-[length:var(--bk-text-12)] tw:leading-[18px] tw:text-[var(--bk-ink)]"
            >
              You’re offline. Token edits still apply here and save when you reconnect. Restore points and reading a website need a connection.
            </div>
          )}
          {readOnly && (
            <div
              role="alert"
              data-testid="brand-read-only-banner"
              className="tw:mb-5 tw:bg-[var(--bk-warning-tint)] tw:p-3 tw:text-[length:var(--bk-text-12)] tw:leading-[18px] tw:text-[var(--bk-ink)]"
            >
              {(store.readOnlyReason && BRAND_READ_ONLY_COPY[store.readOnlyReason]) || BRAND_READ_ONLY_FAILED_COPY}
            </div>
          )}
          {!isPanelPage && (page.startsWith("kind-") || pageAction) && (
            <div className="tw:mb-4 tw:flex tw:shrink-0 tw:items-center tw:gap-2" data-testid="brand-page-actions">
              {page.startsWith("kind-") && (
                <Button
                  type="button"
                  variant="link"
                  size="xs"
                  className="tw:h-7 tw:px-0 tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink)] tw:enabled:hover:text-[var(--bk-accent)] tw:enabled:hover:no-underline"
                  onClick={() => openPage("other-kinds")}
                  data-testid="brand-back-other-kinds"
                >
                  ‹ Other kinds
                </Button>
              )}
              <EditLock locked={readOnly}>{pageAction}</EditLock>
            </div>
          )}
          <div id={`design-section-${page}`} className="tw:min-h-0 tw:flex-1 tw:overflow-y-auto tw:pb-4" data-testid="brand-page-body">
            {/* Parked STATE board `4418:49685` "Brand · empty": "No brand set."
                with Browse starters · Import — the workspace's first-run state,
                on the landing page, until the site's first token edit. The
                sentence is the design doc's own (§5.7, conformance copy.json). */}
            {isFirstLoad && !readOnly && page === "colours" && (
              <div
                data-testid="brand-tokens-first-load-banner"
                className="tw:mb-4 tw:flex tw:flex-col tw:gap-2 tw:rounded-lg tw:border tw:border-[var(--bk-accent-tint)] tw:bg-[var(--bk-accent-tint)] tw:px-4 tw:py-3"
              >
                <span
                  data-testid="brand-tokens-first-load-text"
                  className="tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink)]"
                >
                  <strong>No brand set.</strong> Start from a theme or import your client's tokens. These
                  are the site's default design tokens — every change you make applies to the site straight away.
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

            {/* Import / export stays usable read-only: export is a read, and
                an import is refused by the one write path (setTokens). */}
            <EditLock locked={readOnly && !isPanelPage}>{renderPage()}</EditLock>
            {usageToken && (
              /* 8224:231539: 16 under the table, the token's reach in one line —
                 held at the pane's foot, so a long table cannot push it out of view. */
              <div className="tw:sticky tw:bottom-0 tw:mt-4">
                <UsageHighlightNotice
                  tokenName={usageTokenName}
                  elements={usageIds.length}
                  pages={usageHighlight.pages.length}
                  references={composer?.designSystem?.tokenUsage?.getUsage(usageToken.id) ?? 0}
                />
              </div>
            )}
          </div>
        </div>

        {/* ── Preview column ────────────────────────────────────────────── */}
        {!isPanelPage && (
        <aside
          className="tw:flex tw:w-[468px] tw:shrink-0 tw:flex-col tw:gap-4 tw:overflow-y-auto tw:pb-4"
          data-testid="brand-preview-column"
        >
          {composer?.exportHTML ? (
            <BrandLivePreview
              composer={composer}
              tokens={canvasPreview?.tokens ?? allTokens}
              mode={shownMode}
              darkMode={canvasPreview?.darkMode ?? siteDarkMode}
              controls={previewControls}
              highlightIds={connectIds ?? usageIds}
            />
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
              <BrandPreview colors={visibleColors} tokens={color.tokens} />
            </section>
          )}
          {(page === "connect" || page === FROM_SOURCE || page === "colour-mode" || page === "scale") && (
            /* The guidance card under the preview on Connect (8224:234362),
               Brand from logo or website (BRP1-M11), Dark mode (M8) and the
               scale generator (M9): the same card. */
            <section
              aria-label={page === FROM_SOURCE ? "About Brand from logo or website" : "About Connect to tokens"}
              className={SIDE_CARD}
              data-testid={page === FROM_SOURCE ? "brand-from-source-guide" : "brand-connect-guide"}
            >
              <p className={SIDE_CARD_TITLE}>Preview before applying</p>
              <p className={SIDE_CARD_BODY}>
                Explore the result on your canvas. Confirm or Apply commits the whole change as one ⌘Z step.
              </p>
              <p className={`${SIDE_CARD_BODY} tw:font-semibold tw:text-[var(--bk-ink)]`}>Primitives → Semantic tokens → Elements</p>
              <p className={SIDE_CARD_BODY}>
                Edit Primary to change only Primary. Edit its palette value to update every token that uses it.
              </p>
            </section>
          )}
          {page === "restore-points" && (
            /* 8224:244521's guidance card under the preview. */
            <section aria-label="About restore points" className={SIDE_CARD} data-testid="brand-restore-guide">
              <p className={SIDE_CARD_TITLE}>Changes apply instantly</p>
              <p className={SIDE_CARD_BODY}>
                Every edit updates your canvas. Use ⌘Z to undo, including changes made on the canvas.
              </p>
              <p className={`${SIDE_CARD_BODY} tw:font-semibold tw:text-[var(--bk-ink)]`}>Primitives → Semantic tokens → Elements</p>
              <p className={SIDE_CARD_BODY}>
                Edit Primary to change only Primary. Edit its palette value to update every token that uses it.
              </p>
            </section>
          )}
          {usageToken && usageIds.length > 0 && usageHighlight.active && (
            <UsageHighlightCard
              active={usageHighlight.active}
              tokenName={usageTokenName}
              pageCount={usageHighlight.pages.length}
              onNext={usageHighlight.nextPage}
              onClear={() => setUsageTokenId(null)}
            />
          )}
          {isTokenPage && selectedToken && (
            <EditLock locked={readOnly}>
            <TokenDetailView
              key={selectedToken.id}
              token={selectedToken}
              composer={composer}
              allTokens={allTokens}
              mode={shownMode}
              onValueChange={changeToken}
              /* Same gate as rename (G3-138): type and spacing have no delete
                 path; offering Delete for them was a silent no-op. */
              onDelete={(() => {
                const k = kindOf(selectedToken);
                return k === "color" || isMoreKind(k) ? deleteToken : undefined;
              })()}
              onReset={(() => {
                const k = kindOf(selectedToken);
                return SEED_BY_ID.has(selectedToken.id) && (k === "color" || isMoreKind(k)) ? resetToken : undefined;
              })()}
              /* Only colour and the generic kinds can rename; type and spacing
                 have no rename path, and a Rename that silently did nothing
                 was G3-137's defect — the item is disabled for them. */
              onRename={(() => {
                const k = kindOf(selectedToken);
                return k === "color" || isMoreKind(k) ? renameToken : undefined;
              })()}
              onDeleted={() => setSelectedTokenId(null)}
              onGenerateScale={isSemanticColour(selectedToken) ? openScale : undefined}
            />
            </EditLock>
          )}
        </aside>
        )}
      </div>
      </div>

      <ClassAddDialog open={classAddOpen} composer={composer} onClose={() => setClassAddOpen(false)} />

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
