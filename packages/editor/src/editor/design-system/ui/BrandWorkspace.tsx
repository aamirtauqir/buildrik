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
 *   │ Beginner | Pro    │    │      (edits apply at once) │    │ ✓ Brand checks│    │
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
import { Button, IconButton, Menu, MenuItem, MenuLabel, MenuSeparator, Popover, Select, Tooltip, useToast } from "@/editor/chrome-ui";
import type { Composer } from "../../../engine/Composer";
import { EVENTS } from "../../../shared/constants/events";
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
import { BrandLivePreview } from "./BrandLivePreview";
import { orderColourTokens } from "./colors/ColorTokenList";
import { TokenDetailView } from "./sections/TokenDetailView";
import { TokensSection } from "./sections/TokensSection";
import { StylesSection } from "./sections/StylesSection";
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
import { takeBrandPageRequest, takeBrandTokenRequest } from "./brandOpenRequest";
import { ConnectTokensCheck } from "./sections/ConnectTokensCheck";
import { StartersSection } from "./sections/StartersSection";
import { ColourModeSection } from "./sections/ColourModeSection";
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
/* "connect" — Connect to tokens (BRP1-M7), a page under Brand checks: no nav
   row of its own, Brand checks stays current on it. */
export type BrandPageId = NavId | `kind-${MoreKind}` | "connect";

const LANDING: BrandPageId = "colours";

function isPageId(value: string): value is BrandPageId {
  return value === "connect" || NAV.some((n) => n.id === value) || MORE_KINDS.some((k) => `kind-${k.kind}` === value);
}

function pageLabel(id: BrandPageId): string {
  if (id === "connect") return "Connect to tokens";
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
/* Spacing's ⋯ menu: the three presets on the 4px grid (spacingRegistry). */
const SPACING_PRESETS: [SpacingPreset, string][] = [
  ["compact", "Compact · 2px"],
  ["normal", "Normal · 4px"],
  ["spacious", "Spacious · 6px"],
];

const PAGE_ACTION =
  "tw:h-7 tw:rounded-[var(--bk-radius-md)] tw:border-[var(--bk-border)] tw:px-3 tw:text-[length:var(--bk-text-13)] tw:font-normal tw:leading-4 tw:text-[var(--bk-ink)]";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/* Seed tokens merge back on every read, so deleting one only ever reset it:
   its Delete is "Reset to default" (owner, OQ-7). */
const SEED_BY_ID = new Map(DEFAULT_TOKENS.map((t) => [t.id, t]));

const lightOf = (tokens: readonly DesignToken[], id: string): string => resolveTokenLiteral(tokens, id, "light") ?? "";

/** Disables every native control inside while the tokens are read-only.
 *  `display: contents`, so it never takes part in the layout it sits in. */
function EditLock({ locked, children }: { locked: boolean; children: React.ReactNode }) {
  return (
    <fieldset disabled={locked} className="tw:contents" data-testid={locked ? "brand-edit-lock" : undefined}>
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
  const [page, setPage] = React.useState<BrandPageId>(() => {
    const requested = takeBrandPageRequest(composer) ?? initialPage;
    return requested && isPageId(requested) ? requested : LANDING;
  });
  const [showAddToken, setShowAddToken] = React.useState(false);
  const [spacingMenuOpen, setSpacingMenuOpen] = React.useState(false);
  const [aiOpen, setAiOpen] = React.useState(false);
  const [classAddOpen, setClassAddOpen] = React.useState(false);

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
  const refused = (what: string) => addToast({ description: `${what} wasn't applied — nothing was changed.`, tone: "error" });
  const handleAddToken = (token: DesignToken) => {
    setShowAddToken(false);
    if (!addRegistry(token.kind ?? null)?.addToken(token)) return refused(`Token "${token.name}"`);
    setSelectedTokenId(token.id);
    addToast({ description: `Token "${token.name}" added`, tone: "success" });
  };

  /* `‹ Back to canvas` / Escape: nothing is staged, so nothing to guard. */
  const requestLeave = React.useCallback(() => onClose?.(), [onClose]);

  /* Component styles (7316:82755) lists the Add › Blocks sections; a row
     leaves Brand for Add with BLOCKS open, where that section lives. */
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
      addToast({
        description: `${tok.friendlyName ?? tok.name} replaced with ${replacement.friendlyName ?? replacement.name} · Undo ⌘Z`,
        tone: "info",
      });
    }
  };
  const resetToken = (id: string) => {
    const tok = tokenById(id);
    const seed = SEED_BY_ID.get(id);
    if (!tok || !seed) return;
    if (!store.commit(allTokens.map((t) => (t.id === id ? seed : t)), "Reset token")) {
      return refused(`Resetting "${tok.name}"`);
    }
    addToast({ description: `${tok.friendlyName ?? tok.name} reset to default · Undo ⌘Z`, tone: "info" });
  };
  const renameToken = (id: string, newId: string) => {
    const tok = tokenById(id);
    if (!tok) return;
    const k = kindOf(tok);
    const ok = k === "color" ? color.renameToken(id, newId) : isMoreKind(k) ? moreKindRegistry[k].renameToken(id, newId) : false;
    if (!ok) refused(`Renaming "${tok.name}"`);
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
      case "starters":         return "Pick a starter to apply it to the site";
      case "spacing":          return `${spacing.tokens.length} tokens · presets + custom`;
      case "export":           return "Move the brand in and out";
      case "connect":          return "";
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
           every edit; this runs them now (useDSLint's one trigger). */
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
                 still draws no chips (7576:197036). Each action is one write. */
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
                        setSpacingMenuOpen(false);
                        if (!spacing.applyPreset(p)) refused("The spacing preset");
                      }}
                      data-testid={`spacing-preset-${p}`}
                    >
                      {label}
                    </MenuItem>
                  ))}
                  <MenuSeparator />
                  <MenuItem
                    onClick={() => {
                      setSpacingMenuOpen(false);
                      if (spacing.resetToDefaults()) addToast({ description: "Spacing reset to defaults.", tone: "info" });
                      else refused("Resetting spacing");
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
            onApplied={() => addToast({ description: "Tokens connected · Undo ⌘Z", tone: "info" })}
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
  const navRow = (id: BrandPageId, label: string, count?: number, slot: string = id) => {
    /* The eleven other kinds are reached from Spacing's kind switch, so the
       Spacing row stays current on their pages. */
    const active = page === id || (id === "spacing" && page.startsWith("kind-")) || (id === "brand-checks" && page === "connect");
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
        {count !== undefined && (
          <span className={NAV_COUNT} data-testid={`brand-row-count-${id}`}>
            {count}
          </span>
        )}
      </Button>
    );
  };

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
          {NAV.map((n) => navRow(n.id, n.label, navCount(n.id)))}
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
              {/* "Review changes" (spec §4): non-blocking, this session's
                  edits with Revert. Drawn only once there is one. */}
              {store.edits.length > 0 && (
                <SessionEditsPopover
                  edits={store.edits}
                  onRevert={(i) => {
                    if (!store.revert(i)) refused("That revert");
                  }}
                  disabled={readOnly}
                />
              )}
              <EditLock locked={readOnly}>{pageAction}</EditLock>
            </div>
          </header>
          )}

          {readOnly && (
            <div
              role="alert"
              data-testid="brand-read-only-banner"
              className="tw:mt-4 tw:rounded-lg tw:border tw:border-[var(--bk-warning)] tw:bg-[var(--bk-warning-tint)] tw:px-4 tw:py-3 tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-warning-text)]"
            >
              {(store.readOnlyReason && BRAND_READ_ONLY_COPY[store.readOnlyReason]) || BRAND_READ_ONLY_FAILED_COPY}
            </div>
          )}
          <div id={`design-section-${page}`} className={`${isPanelPage ? "" : "tw:mt-4 "}tw:min-h-0 tw:flex-1 tw:overflow-y-auto tw:pb-4`} data-testid="brand-page-body">
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
              tokens={allTokens}
              mode={resolvedMode}
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
          {page === "connect" && (
            /* 8224:234362's guidance card under the preview. */
            <section aria-label="About Connect to tokens" className={SIDE_CARD} data-testid="brand-connect-guide">
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
              mode={resolvedMode}
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
            />
            </EditLock>
          )}
        </aside>
        )}
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
