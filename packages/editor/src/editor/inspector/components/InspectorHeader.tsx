/**
 * InspectorHeader — Shell/InspectorHeader (2L9 `497:339496`), 300×84:
 *   1. Target (24): type icon + editable name · ⋯ · ✕ "Hide inspector (⌘\)";
 *   2. Authored element state (32): "Editing" + a read-only `${breakpoint} ·`
 *      prefix + the state Select — together "Desktop · Default state". The
 *      topbar BreakpointSwitcher is the only breakpoint control; the prefix
 *      follows it. That is the Style / Effects line; Content and Behavior
 *      writes ignore breakpoint and state, so their line says so instead
 *      ("Content · All breakpoints", "Behavior · Heading" — boards 161:8480,
 *      161:13919, 36:2) and carries no Select.
 * 12 padding, 4 between rows. The element path (chrome-ui Breadcrumb) is
 * the row under the target, on every page, as every 2L9 inspector board
 * draws it (owner rule 2026-10-26: the board wins over the earlier
 * template-page-only default) — 104 tall. A path longer than three crumbs
 * reads "… › {parent} › {element}" (2L9 S31 258:37248); the "…" opens
 * "Selection path" beside the column, every crumb selectable. The page crumb
 * clears the selection, an ancestor crumb selects it.
 * While the site did not load for a connection reason the context line reads
 * "Could not load {site}" (2L9 S02 255:82909) — `loadFailedLine`.
 * Variants: `multi` (board 22): the name row reads "3 selected · Headings"
 * with no type icon, and the path is the shared parent's own ("Home › Hero"),
 * ending on that parent — the selection is not repeated as a crumb.
 *
 * @license BSD-3-Clause
 */

import { X } from "lucide-react";
import * as React from "react";
import type { Composer, Element } from "@/engine";
import { Breadcrumb, Button, IconButton, Label, Menu, MenuItem, Popover, Select, type BreadcrumbItem, type CustomFlowbiteTheme } from "@/editor/chrome-ui";
import { getElementIcon } from "@/editor/shared/elementIcons";
import { getLayerName } from "@/editor/panels/layers/hooks/layersPersistence";
import { elementTypeLabel } from "@/shared/constants/elementTypeLabels";
import { EVENTS } from "@/shared/constants/events";
import type { PseudoStateId } from "@/shared/types";
import type { TabId } from "@/editor/inspector/sections/registry";
import { ElementNameField } from "./ElementNameField";
import { InspectorElementMenu } from "./InspectorElementMenu";

export interface InspectorHeaderProps {
  composer: Composer | null | undefined;
  element: { id: string; type: string };
  /** Every selected id (primary first); more than one = the multi variant. */
  selectedIds: readonly string[];
  /** The topbar's breakpoint by name ("Desktop", "Tablet") — read-only here. */
  breakpointLabel: string;
  /** The inspector tab on screen — the context line follows it. */
  activeTab: TabId;
  /** The element state the Style / Effects writes land on. */
  state: PseudoStateId;
  onStateChange: (state: PseudoStateId) => void;
  /** States that carry overrides at this breakpoint — their option says so. */
  statesWithOverrides?: ReadonlySet<PseudoStateId>;
  /** The site did not load: the context line says so instead (S02). */
  loadFailedLine?: string;
  /** What the element is bound to ("Blog.title") — said in the name row and
   *  opening Content › Dynamic bindings (2L9 B5-D04 173:9757). A missing
   *  source keeps its error chip in StatusMarks. */
  boundTo?: string;
}

const STATES: readonly { id: PseudoStateId; label: string }[] = [
  { id: "normal", label: "Default state" },
  { id: "hover", label: "Hover state" },
  { id: "focus", label: "Focus state" },
  { id: "active", label: "Active state" },
  { id: "disabled", label: "Disabled state" },
];

/* The row is 32 tall (the board's "Authored element state" frame), so the
   select is too; flowbite's md is 42. */
const STATE_SELECT_THEME: NonNullable<CustomFlowbiteTheme["select"]> = {
  field: { select: { sizes: { md: "tw:h-8 tw:py-0 tw:pl-2 tw:pr-8 tw:text-[12px] tw:leading-4" } } },
};

/** Page crumb, then each ancestor below the page root down to `anchor`, then
 *  `last` as the current crumb — or, without `last`, `anchor` is the current one. */
function pathFor(composer: Composer, anchor: Element | null | undefined, last?: string): BreadcrumbItem[] {
  const page = composer.elements.getActivePage?.();
  const rootId = page?.root.id;
  const chain: Element[] = [];
  for (let p = anchor ?? null; p && p.getId() !== rootId; p = p.getParent?.() ?? null) chain.unshift(p);
  const crumbs: BreadcrumbItem[] = [
    { id: "page", label: page?.name ?? "Page", onSelect: () => composer.selection.clear() },
    ...chain.map((el) => ({
      id: el.getId(),
      label: getLayerName(el) ?? elementTypeLabel(el.getType()),
      onSelect: () => composer.selection.select(el as never),
    })),
  ];
  return last === undefined ? crumbs : [...crumbs, { id: "current", label: last }];
}

/** The deepest element that contains every one of `els`. */
function commonParent(els: Element[]): Element | null {
  const chains = els.map((el) => {
    const up: Element[] = [];
    for (let p = el.getParent?.() ?? null; p; p = p.getParent?.() ?? null) up.unshift(p);
    return up;
  });
  let common: Element | null = null;
  for (let i = 0; chains.every((c) => c[i] && c[i] === chains[0][i]); i++) common = chains[0][i];
  return common;
}

const pluralType = (type: string) => `${elementTypeLabel(type)}s`;

export function InspectorHeader({
  composer,
  element,
  selectedIds,
  breakpointLabel,
  activeTab,
  state,
  onStateChange,
  statesWithOverrides,
  loadFailedLine,
  boundTo,
}: InspectorHeaderProps) {
  const stateId = React.useId();
  const multi = selectedIds.length > 1;
  const typeLabel = elementTypeLabel(element.type);
  const Icon = getElementIcon(element.type);

  let items: BreadcrumbItem[] = [];
  /* A selection names itself on every page (2L9 B01 "3 selected"; one type:
     "2 selected · Headings"). It used to be named only on a template page,
     so elsewhere the title line was blank. */
  const selectedEls = multi && composer ? selectedIds.map((id) => composer.elements.getElement(id)).filter((e): e is Element => Boolean(e)) : [];
  const lockedCount = selectedEls.filter((e) => e.isLocked?.()).length;
  const multiName = multi
    ? `${selectedIds.length} selected${new Set(selectedEls.map((e) => e.getType())).size === 1 ? ` · ${pluralType(element.type)}` : ""}`
    : "";
  if (composer) {
    if (multi) {
      items = pathFor(composer, commonParent(selectedEls));
    } else {
      const el = composer.elements.getElement(element.id);
      items = pathFor(composer, el?.getParent?.() ?? null, getLayerName(el) ?? typeLabel);
    }
  }

  return (
    <div className="tw:flex tw:flex-col tw:gap-1 tw:p-3" data-testid="inspector-header">
      <div className="tw:flex tw:h-6 tw:items-center tw:gap-1" data-testid="inspector-target-row">
        <div className="tw:flex tw:min-w-0 tw:flex-1 tw:items-center tw:gap-2 tw:text-[13px] tw:font-semibold tw:leading-4 tw:text-[var(--bk-ink-soft)]">
          {multi ? null : (
            <span className="tw:inline-flex tw:shrink-0" aria-hidden="true" data-testid="inspector-type-icon">
              <Icon size="sm" />
            </span>
          )}
          <span className="tw:min-w-0 tw:truncate" title={multi ? multiName : undefined}>
            {multi ? (
              <>
                <span data-testid="inspector-element-name">{multiName}</span>
                {/* 2L9 B01: what a batch edit reaches, when the lock gate holds
                    some back (the board puts it after the editing state; the
                    state select leaves no room there at 300 wide). */}
                {lockedCount > 0 ? (
                  <span className="tw:font-normal tw:text-[12px] tw:text-[var(--bk-ink-muted)]" data-testid="inspector-batch-eligible">
                    {" "}· {selectedEls.length - lockedCount} of {selectedEls.length} eligible
                  </span>
                ) : null}
              </>
            ) : (
              <ElementNameField composer={composer} elementId={element.id} typeLabel={typeLabel} />
            )}
          </span>
        </div>
        {boundTo ? (
          <Button
            color="light"
            size="xs"
            data-testid="inspector-bound-chip"
            data-tone="bound"
            title={`Bound to ${boundTo}`}
            onClick={() => composer?.emit(EVENTS.UI_INSPECTOR_FOCUS_SECTION, { section: "cms-binding" })}
            className="tw:h-6 tw:min-w-0 tw:max-w-[120px] tw:shrink tw:border-0 tw:bg-transparent tw:px-1 tw:text-[13px] tw:font-normal tw:text-[var(--bk-accent-text)] tw:hover:bg-transparent tw:hover:underline tw:focus:ring-0"
          >
            <span className="tw:truncate">{boundTo}</span>
          </Button>
        ) : null}
        <InspectorElementMenu composer={composer} selectedElementId={element.id} />
        <IconButton
          label="Hide inspector (⌘\)"
          size="sm"
          data-testid="inspector-hide"
          onClick={() => composer?.emit(EVENTS.UI_TOGGLE_INSPECTOR)}
        >
          <X size={16} aria-hidden="true" />
        </IconButton>
      </div>
      {items.length > 0 ? <ElementPath items={items} /> : null}
      <div className="tw:flex tw:h-8 tw:items-center tw:gap-2" data-testid="inspector-editing-row">
        {loadFailedLine ? (
          <span className="tw:min-w-0 tw:truncate tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-soft)]" data-testid="inspector-load-failed-line">
            {loadFailedLine}
          </span>
        ) : activeTab === "content" || activeTab === "behaviour" ? (
          <span className="tw:min-w-0 tw:truncate tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-soft)]">
            {activeTab === "content" ? "Content · All breakpoints" : `Behavior · ${typeLabel}`}
          </span>
        ) : (
          <>
            <Label htmlFor={stateId} className="tw:shrink-0 tw:text-[11px] tw:font-medium tw:leading-4 tw:text-[var(--bk-ink-muted)]">
              Editing
            </Label>
            <span
              className="tw:shrink-0 tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-soft)] tw:whitespace-nowrap"
              data-testid="inspector-breakpoint-prefix"
            >
              {breakpointLabel} ·
            </span>
            <Select
              id={stateId}
              value={state}
              onChange={(e) => onStateChange(e.target.value as PseudoStateId)}
              theme={STATE_SELECT_THEME}
              className="tw:min-w-0 tw:flex-1"
              data-testid="inspector-state-select"
            >
              {STATES.map((s) => (
                <option key={s.id} value={s.id}>
                  {statesWithOverrides?.has(s.id) ? `${s.label} · edited` : s.label}
                </option>
              ))}
            </Select>
          </>
        )}
      </div>
    </div>
  );
}

/** Crumbs drawn before the path folds into "… › parent › element". */
const PATH_MAX = 3;

/** The element path row (S31): short paths in full; longer ones fold their
 *  head into a "…" that opens "Selection path" beside the column. */
function ElementPath({ items }: { items: BreadcrumbItem[] }) {
  const [open, setOpen] = React.useState(false);
  const fold = items.length > PATH_MAX;
  const tail = fold ? items.slice(-2) : items;
  return (
    <div className="tw:flex tw:h-4 tw:min-w-0 tw:items-center" data-testid="inspector-path-row">
      {fold ? (
        <>
          <Popover
            open={open}
            onClose={() => setOpen(false)}
            beside=".layout-shell__inspector"
            besideTop='[role="tablist"]'
            label="Selection path"
            className="tw:w-[280px] tw:p-3"
            trigger={
              <Button
                color="light"
                size="xs"
                aria-haspopup="menu"
                aria-expanded={open}
                aria-label={`Selection path: ${items.map((i) => i.label).join(" › ")}`}
                data-testid="inspector-path-more"
                onClick={() => setOpen((v) => !v)}
                className="tw:-my-1 tw:h-6 tw:min-w-6 tw:border-0 tw:bg-transparent tw:p-0 tw:text-[12px] tw:font-normal tw:leading-4 tw:text-[var(--bk-ink-muted)] tw:hover:bg-transparent tw:hover:text-[var(--bk-ink)] tw:focus:ring-0"
              >
                …
              </Button>
            }
          >
            <p className="tw:m-0 tw:mb-2 tw:text-[13px] tw:font-semibold tw:leading-4 tw:text-[var(--bk-ink)]">Selection path</p>
            <Menu label="Selection path" className="tw:min-w-0">
              {items.map((item) => (
                <MenuItem
                  key={item.id}
                  className="tw:h-10! tw:[&>span]:text-center!"
                  aria-current={item.onSelect ? undefined : "location"}
                  onClick={() => {
                    setOpen(false);
                    item.onSelect?.();
                  }}
                >
                  {item.label}
                </MenuItem>
              ))}
            </Menu>
          </Popover>
          <span aria-hidden="true" className="tw:shrink-0 tw:px-1 tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-muted)]">
            ›
          </span>
        </>
      ) : null}
      <Breadcrumb label="Element path" items={tail} maxItems={PATH_MAX} className="tw:h-4 tw:min-w-0" data-testid="inspector-breadcrumb" />
    </div>
  );
}
