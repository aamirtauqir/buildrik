/**
 * PagePanel — what the Inspector shows when nothing is selected, or the page
 * root is (DD-13, board 21):
 *
 *   Home                                   ← the path: the page alone
 *   Home · Page                ✦ AI  ⋯  ✕
 *   Fill        Background
 *   Size        Max width
 *   Typography  Font · Text colour
 *   Spacing     the margin / padding box
 *                                SEO & social ↗
 *   Your place here is kept
 *
 * No tabs, no context row, no Link / CMS / Visibility / Interactions. The
 * four sections are the registry's `page: true` entries rendered with
 * `ctx.variant = "page"` (each draws its own page subset), in the board's
 * order; every edit goes to the active page's root through useStyleHandlers,
 * so it is one undo step and passes the lock gate like any element edit.
 * "SEO & social" opens the page's settings on SEO; the Inspector stays
 * mounted, so closing them lands back here.
 *
 * The one-time "Template applied!" banner (a template was just applied)
 * sits on top.
 *
 * @license BSD-3-Clause
 */

import { ExternalLink, MoreHorizontal, X } from "lucide-react";
import * as React from "react";
import type { Composer } from "@/engine";
import { Breadcrumb, Button, IconButton, Menu, MenuItem, Popover } from "@/editor/chrome-ui";
import { capabilitiesFor } from "@/shared/constants/elementCapabilities";
import { EVENTS } from "@/shared/constants/events";
import { isValidBreakpoint } from "@/shared/constants/breakpoints";
import type { BreakpointId } from "@/shared/types/breakpoints";
import { useSaveConflict } from "@/editor/shell/hooks/useSaveConflict";
import { computeEffectiveStyles, deriveCssContext, getPropertyStates } from "../config/cssContext";
import { useFieldOverrides } from "../hooks/useFieldOverrides";
import { resolveDisplayMode, useInspectorSections } from "../hooks/useInspectorSections";
import { useStyleHandlers } from "../hooks/useStyleHandlers";
import { ActionRow, NoteRow } from "../sections/behaviourRows";
import { EMPTY_MIXED_KEYS, SECTION_REGISTRY, type SectionContext, type SectionId } from "../sections/registry";
import { InspectorFieldContext, type InspectorFieldContextValue } from "../shared/controls/InspectorFieldContext";
import { sectionOverrideMarks } from "../shared/controls/OverrideDot";
import { SectionFrameContext, type SectionFrame } from "../shared/controls/Section";

export interface PagePanelProps {
  composer: Composer | null | undefined;
}

/** Board 21's order — not the Style tab's (Fill leads on the page). */
const PAGE_SECTIONS: readonly SectionId[] = ["fill", "size", "typography", "spacing"];

/** Section choices are kept per element type; the page is its own "type". */
const PAGE_CHOICE_TYPE = "page";

const TEMPLATE_KEY = "buildrick-last-applied-template";
const TEMPLATE_BANNER_MS = 30 * 60 * 1000;

const NO_OP = () => undefined;

/** Re-render on what the panel reads outside React: the page and the breakpoint. */
function usePageAndBreakpoint(composer: Composer | null | undefined): BreakpointId {
  const [, bump] = React.useReducer((n: number) => n + 1, 0);
  React.useEffect(() => {
    if (!composer) return;
    composer.on(EVENTS.PAGE_CHANGED, bump);
    composer.on(EVENTS.BREAKPOINT_CHANGED, bump);
    return () => {
      composer.off(EVENTS.PAGE_CHANGED, bump);
      composer.off(EVENTS.BREAKPOINT_CHANGED, bump);
    };
  }, [composer]);
  const device = composer?.device;
  return device && isValidBreakpoint(device) ? device : "desktop";
}

/** The template just applied, for 30 minutes after (read once). */
function useAppliedTemplate(): string | null {
  const [name] = React.useState<string | null>(() => {
    try {
      const stored = localStorage.getItem(TEMPLATE_KEY);
      if (!stored) return null;
      const data = JSON.parse(stored) as { name?: unknown; ts?: unknown };
      if (typeof data.name === "string" && typeof data.ts === "number" && Date.now() - data.ts < TEMPLATE_BANNER_MS) {
        return data.name;
      }
      localStorage.removeItem(TEMPLATE_KEY);
    } catch {
      try {
        localStorage.removeItem(TEMPLATE_KEY);
      } catch {
        /* storage unavailable — no banner */
      }
    }
    return null;
  });
  return name;
}

export function PagePanel({ composer }: PagePanelProps) {
  const breakpoint = usePageAndBreakpoint(composer);
  const page = composer?.elements?.getActivePage?.();
  const rootEl = page ? composer?.elements.getElement(page.root.id) ?? null : null;
  const root = React.useMemo(
    () => (page ? { id: page.root.id, type: rootEl?.getType?.() ?? page.root.type ?? "container" } : null),
    [page, rootEl]
  );

  const conflict = useSaveConflict();
  const { styles, handleStyleChange, handleBatchStyleChange, overriddenProperties } = useStyleHandlers(
    root,
    composer,
    breakpoint,
    "normal",
    [],
    conflict.pending
  );
  const overrides = useFieldOverrides(composer, root?.id, breakpoint);
  const { choices, setChoices } = useInspectorSections();
  const appliedTemplate = useAppliedTemplate();

  const locked = Boolean(rootEl?.isLocked?.());
  const readOnly = locked || conflict.pending;
  const fieldContext = React.useMemo<InspectorFieldContextValue>(
    () => ({
      readOnly,
      readOnlyReason: conflict.pending ? "conflict" : locked ? "locked" : null,
      mixedKeys: EMPTY_MIXED_KEYS,
      overrides: overrides.overrides,
      overrideLabels: overrides.labels,
      resetOverride: overrides.resetOverride,
    }),
    [readOnly, conflict.pending, locked, overrides]
  );

  if (!composer || !page || !root) return null;

  const cssContext = deriveCssContext(root, composer, styles, breakpoint, "normal");
  const propertyStates = getPropertyStates(cssContext);
  overriddenProperties.forEach((prop) => {
    propertyStates[prop] = { ...propertyStates[prop], isOverridden: true };
  });
  const authoredStyles = computeEffectiveStyles(rootEl, composer, breakpoint, "normal");

  const modes = PAGE_SECTIONS.map((id) => resolveDisplayMode("always", true, choices[`${PAGE_CHOICE_TYPE}:${id}`]));
  const toggleAll = () =>
    setChoices(PAGE_CHOICE_TYPE, PAGE_SECTIONS, modes.some((m) => m === "open") ? "closed" : "open");

  const openSeo = () => composer.emit(EVENTS.UI_PAGES_OPEN_SETTINGS, { pageId: page.id, tab: "seo" });

  return (
    <InspectorFieldContext.Provider value={fieldContext}>
      <div className="bdi-panel" data-testid="inspector-page-panel" data-readonly={readOnly || undefined}>
        {appliedTemplate ? <TemplateAppliedBanner composer={composer} name={appliedTemplate} /> : null}
        <PageHeader composer={composer} pageName={page.name} pageId={page.id} />
        <div className="bdi-panel-scroll">
          <div className="bdi-body">
            {PAGE_SECTIONS.map((id, i) => {
              const entry = SECTION_REGISTRY[id];
              if (!entry) return null;
              const displayMode = modes[i];
              const onToggle = () =>
                setChoices(PAGE_CHOICE_TYPE, [id], displayMode === "open" ? "closed" : "open");
              const ctx: SectionContext = {
                composer,
                selectedElement: root,
                selectedIds: [root.id],
                variant: "page",
                styles,
                authoredStyles,
                onChange: handleStyleChange,
                onBatchChange: handleBatchStyleChange,
                cssContext,
                propertyStates,
                caps: capabilitiesFor(root.type),
                isOpen: displayMode === "open",
                onToggle,
                displayMode,
                advancedExpanded: false,
                onAdvancedToggle: NO_OP,
                tabId: "style",
                mixedKeys: EMPTY_MIXED_KEYS,
                isMultiSelect: false,
              };
              const frame: SectionFrame = {
                ...sectionOverrideMarks(fieldContext, entry.styleKeys),
                sectionId: id,
                title: entry.title,
                displayMode,
                summary: null,
                onToggle,
                onToggleAll: toggleAll,
              };
              return (
                <SectionFrameContext.Provider key={id} value={frame}>
                  {entry.render(ctx)}
                </SectionFrameContext.Provider>
              );
            })}
            <div className="tw:border-t tw:border-[var(--bk-border)] tw:px-3">
              <ActionRow
                testId="inspector-page-seo"
                onClick={openSeo}
                icon={<ExternalLink size={12} aria-hidden="true" className="tw:shrink-0" />}
              >
                SEO &amp; social
              </ActionRow>
            </div>
            <div className="tw:px-4">
              <NoteRow testId="inspector-page-note">Your place here is kept</NoteRow>
            </div>
          </div>
        </div>
      </div>
    </InspectorFieldContext.Provider>
  );
}

/** Board 21's header: the path is the page alone; the name reads "Home · Page". */
function PageHeader({ composer, pageName, pageId }: { composer: Composer; pageName: string; pageId: string }) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  return (
    <div className="tw:flex tw:flex-col tw:gap-1 tw:p-3" data-testid="inspector-header">
      <Breadcrumb label="Element path" items={[{ id: "page", label: pageName }]} data-testid="inspector-breadcrumb" />
      <div className="tw:flex tw:items-center tw:gap-1">
        <span
          className="tw:min-w-0 tw:flex-1 tw:truncate tw:text-[13px] tw:font-semibold tw:leading-4 tw:text-[var(--bk-ink-soft)]"
          data-testid="inspector-element-name"
        >
          {pageName} · Page
        </span>
        <Button
          type="button"
          className="tw:h-6 tw:w-10 tw:shrink-0 tw:justify-center tw:rounded-[6px] tw:bg-[var(--bk-accent-tint)] tw:px-2 tw:text-[11px] tw:font-medium tw:text-[var(--bk-accent-text)] tw:whitespace-nowrap"
          title="Ask AI about this page"
          aria-label="Ask AI about this page"
          data-testid="inspector-ai-chip"
          onClick={() => composer.emit("ui:switch-tab", { tab: "ai" })}
        >
          ✦ AI
        </Button>
        <Popover
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          placement="bottom-end"
          label="Page actions"
          className="tw:w-60 tw:p-1"
          trigger={
            <IconButton
              label="Page actions"
              size="sm"
              data-testid="inspector-page-menu"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <MoreHorizontal size={16} aria-hidden="true" />
            </IconButton>
          }
        >
          <Menu label="Page actions" className="tw:min-w-0">
            <MenuItem
              data-testid="inspector-page-menu-settings"
              className="tw:!h-auto tw:!min-h-8 tw:!py-1.5 tw:!text-[12px] tw:!leading-4"
              onClick={() => {
                setMenuOpen(false);
                composer.emit(EVENTS.UI_PAGES_OPEN_SETTINGS, { pageId });
              }}
            >
              Page settings…
            </MenuItem>
          </Menu>
        </Popover>
        <IconButton
          label="Hide inspector (⌘\)"
          size="sm"
          data-testid="inspector-hide"
          onClick={() => composer.emit(EVENTS.UI_TOGGLE_INSPECTOR)}
        >
          <X size={16} aria-hidden="true" />
        </IconButton>
      </div>
    </div>
  );
}

/** Board 1175:4841 — shown for 30 minutes after a template is applied. */
function TemplateAppliedBanner({ composer, name }: { composer: Composer; name: string }) {
  return (
    <div role="status" aria-live="polite" className="tw:px-3 tw:pt-3" data-testid="inspector-template-applied">
      <div className="tw:flex tw:w-full tw:flex-col tw:items-start tw:gap-1.5 tw:rounded-lg tw:bg-[var(--bk-success-tint)] tw:px-3 tw:py-2.5 tw:text-left">
        <h3 className="tw:m-0 tw:text-[12px] tw:font-semibold tw:text-[var(--bk-success-text)]">Template applied!</h3>
        <p className="tw:m-0 tw:text-[11px] tw:leading-normal tw:text-[var(--bk-ink-soft)]">{name}</p>
        {/* `h-auto` beats flowbite's own `h-8` (same twMerge group), so the
            padding sizes it to the board's 27. */}
        <Button
          size="xs"
          onClick={() => composer.emit(EVENTS.UI_OPEN_DESIGN_PANEL, {})}
          className="tw:inline-block tw:h-auto tw:min-h-6 tw:rounded-md tw:border-transparent tw:bg-[var(--bk-accent)] tw:px-3 tw:py-[7px] tw:text-center tw:text-[11px] tw:font-medium tw:text-white"
          aria-label="Set brand colors in Global Styles"
        >
          Set Brand Colors
        </Button>
      </div>
    </div>
  );
}
