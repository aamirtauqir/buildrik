/**
 * PagePanel — what the Inspector shows when nothing is selected, or the page
 * root is (DD-13, board 21):
 *
 *   Home · Page                      ⋯  ✕     (no AI entry point — owner, no AI this version)
 *   Home · Page                            ← the path (2L9 S06)
 *   Editing Desktop · Page appearance
 *   Background  Color
 *   Size        Max width
 *   Typography  Font · Text colour
 *   Spacing     the margin / padding box
 *   Page settings  [ SEO and social ]
 *                  Opens Home’s Page settings. Appearance stays here.
 *
 * No tabs, no context row, no Link / CMS / Visibility / Interactions. The
 * four sections are the registry's `page: true` entries rendered with
 * `ctx.variant = "page"` (each draws its own page subset), in the board's
 * order; every edit goes to the active page's root through useStyleHandlers,
 * so it is one undo step and passes the lock gate like any element edit.
 * "SEO and social" opens the page's settings on SEO; the Inspector stays
 * mounted, so closing them lands back here.
 *
 * The one-time "Template applied" notice (a template was just applied)
 * sits on top.
 *
 * @license BSD-3-Clause
 */

import { MoreHorizontal, X } from "lucide-react";
import * as React from "react";
import type { Composer } from "@/engine";
import { Breadcrumb, Button, IconButton, Menu, MenuItem, Popover } from "@/editor/chrome-ui";
import { capabilitiesFor } from "@/shared/constants/elementCapabilities";
import { EVENTS } from "@/shared/constants/events";
import { BREAKPOINTS, isValidBreakpoint } from "@/shared/constants/breakpoints";
import type { BreakpointId } from "@/shared/types/breakpoints";
import { useSaveConflict } from "@/editor/shell/hooks/useSaveConflict";
import { computeEffectiveStyles, deriveCssContext, getPropertyStates } from "../config/cssContext";
import { useFieldOverrides } from "../hooks/useFieldOverrides";
import { resolveDisplayMode, useInspectorSections } from "../hooks/useInspectorSections";
import { useStyleHandlers } from "../hooks/useStyleHandlers";
import { NoteRow } from "../sections/behaviourRows";
import { EMPTY_MIXED_KEYS, SECTION_REGISTRY, type SectionContext, type SectionId } from "../sections/registry";
import { InspectorFieldContext, type InspectorFieldContextValue } from "../shared/controls/InspectorFieldContext";
import { sectionOverrideMarks } from "../shared/controls/OverrideDot";
import { Section, SectionFrameContext, type SectionFrame } from "../shared/controls/Section";
import { WIDE_BUTTON } from "../shared/controls/controlClasses";
import { ChooseFont } from "../sections/typography/ChooseFont";
import { closeSubview, useSubview } from "../tabs/subviewStore";

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

/** The template just applied, for 30 minutes after (read once), and the
 *  board's "Dismiss notice" (S07), which forgets it. */
function useAppliedTemplate(): [string | null, () => void] {
  const [name, setName] = React.useState<string | null>(() => {
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
  const dismiss = React.useCallback(() => {
    setName(null);
    try {
      localStorage.removeItem(TEMPLATE_KEY);
    } catch {
      /* storage unavailable — hidden for this mount */
    }
  }, []);
  return [name, dismiss];
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
  const { styles, handleStyleChange, handleBatchStyleChange, overriddenProperties, runDiscrete } = useStyleHandlers(
    root,
    composer,
    breakpoint,
    "normal",
    [],
    conflict.pending
  );
  const overrides = useFieldOverrides(composer, root?.id, breakpoint);
  const { choices, setChoices } = useInspectorSections();
  const [appliedTemplate, dismissTemplate] = useAppliedTemplate();
  const subview = useSubview();
  /* More settings per section, for this panel's life (Spacing's sides). */
  const [advanced, setAdvanced] = React.useState<Readonly<Record<string, boolean>>>({});

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
      runDiscrete,
    }),
    [readOnly, conflict.pending, locked, overrides, runDiscrete]
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
        <PageHeader composer={composer} pageName={page.name} pageId={page.id} breakpoint={breakpoint} />
        {appliedTemplate ? <TemplateAppliedBanner name={appliedTemplate} pageName={page.name} onDismiss={dismissTemplate} /> : null}
        <div className="bdi-panel-scroll">
          {subview?.kind === "font-picker" && subview.elementId === root.id ? (
            <ChooseFont
              composer={composer}
              elementId={root.id}
              value={authoredStyles["font-family"] ?? ""}
              onChange={(v) => handleStyleChange("font-family", v)}
              onClose={() => closeSubview("font-picker")}
            />
          ) : (
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
                advancedExpanded: Boolean(advanced[id]),
                onAdvancedToggle: () => setAdvanced((a) => ({ ...a, [id]: !a[id] })),
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
            {/* 2L9 S06: its own "Page settings" group — a full-width
                button, and the note under it. */}
            <Section title="Page settings" isOpen onToggle={NO_OP} id="inspector-section-page-settings">
              <Button color="light" size="xs" className={WIDE_BUTTON} onClick={openSeo} data-testid="inspector-page-seo">
                SEO and social
              </Button>
              <NoteRow testId="inspector-page-note">Opens {page.name}’s Page settings. Appearance stays here.</NoteRow>
            </Section>
          </div>
          )}
        </div>
      </div>
    </InspectorFieldContext.Provider>
  );
}

/** 2L9 S06's header: "Home · Page", the path under it, then what is being
 *  edited ("Editing Desktop · Page appearance"). */
function PageHeader({ composer, pageName, pageId, breakpoint }: { composer: Composer; pageName: string; pageId: string; breakpoint: BreakpointId }) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  return (
    <div className="tw:flex tw:flex-col tw:gap-1 tw:p-3" data-testid="inspector-header">
      <div className="tw:flex tw:items-center tw:gap-1">
        <span
          className="tw:min-w-0 tw:flex-1 tw:truncate tw:text-[13px] tw:font-semibold tw:leading-4 tw:text-[var(--bk-ink)]"
          data-testid="inspector-element-name"
        >
          {pageName} · Page
        </span>
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
      <Breadcrumb label="Element path" items={[{ id: "page", label: `${pageName} · Page` }]} data-testid="inspector-breadcrumb" />
      <p className="tw:m-0 tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-muted)]" data-testid="inspector-page-editing">
        Editing {BREAKPOINTS[breakpoint].name} · Page appearance
      </p>
    </div>
  );
}

/** 2L9 S07 — under the page's header for 30 minutes after a template is
 *  applied, until dismissed: a titled group with a full-width Dismiss. */
function TemplateAppliedBanner({ name, pageName, onDismiss }: { name: string; pageName: string; onDismiss: () => void }) {
  return (
    <div role="status" aria-live="polite" className="tw:flex tw:flex-col tw:gap-2 tw:px-3 tw:pb-2 tw:pt-3" data-testid="inspector-template-applied">
      <h3 className="tw:m-0 tw:text-[13px] tw:font-semibold tw:leading-5 tw:text-[var(--bk-ink)]">Template applied</h3>
      <p className="tw:m-0 tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-soft)]">
        The {name} template was applied to {pageName}.
      </p>
      <Button color="light" size="xs" onClick={onDismiss} data-testid="inspector-template-dismiss" className={WIDE_BUTTON}>
        Dismiss notice
      </Button>
    </div>
  );
}
