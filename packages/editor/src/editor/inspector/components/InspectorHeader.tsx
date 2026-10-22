/**
 * InspectorHeader — Shell/InspectorHeader (2L9 `497:339496`), 300×84:
 *   1. Target (24): type icon + editable name · ⋯ · ✕ "Hide inspector (⌘\)";
 *   2. Authored element state (32): "Editing" + a read-only `${breakpoint} ·`
 *      prefix + the state Select — together "Desktop · Default state". The
 *      topbar BreakpointSwitcher is the only breakpoint control; the prefix
 *      follows it.
 * 12 padding, 4 between rows: 84 tall. The element path (chrome-ui
 * Breadcrumb, "Home › Hero › Heading") is a third row on top — 104 tall —
 * ONLY while the current page is a collection template. It never depends on
 * the selection, so the header keeps its height as selection moves within a
 * page (plan Task 1.4). The page crumb clears the selection, an ancestor
 * crumb selects it.
 * Variants: `multi` (board 22): the name row reads "3 selected · Headings"
 * with no type icon, and the path is the shared parent's own ("Home › Hero"),
 * ending on that parent — the selection is not repeated as a crumb.
 *
 * @license BSD-3-Clause
 */

import { X } from "lucide-react";
import * as React from "react";
import type { Composer, Element } from "@/engine";
import { Breadcrumb, IconButton, Label, Select, type BreadcrumbItem, type CustomFlowbiteTheme } from "@/editor/chrome-ui";
import { getElementIcon } from "@/editor/shared/elementIcons";
import { getLayerName } from "@/editor/panels/layers/hooks/layersPersistence";
import { elementTypeLabel } from "@/shared/constants/elementTypeLabels";
import { EVENTS } from "@/shared/constants/events";
import type { PseudoStateId } from "@/shared/types";
import { pageFileNames } from "@/engine/export/pageFiles";
import { ElementNameField } from "./ElementNameField";
import { InspectorElementMenu } from "./InspectorElementMenu";

export interface InspectorHeaderProps {
  composer: Composer | null | undefined;
  element: { id: string; type: string };
  /** Every selected id (primary first); more than one = the multi variant. */
  selectedIds: readonly string[];
  /** The topbar's breakpoint by name ("Desktop", "Tablet") — read-only here. */
  breakpointLabel: string;
  /** The element state the Style / Effects writes land on. */
  state: PseudoStateId;
  onStateChange: (state: PseudoStateId) => void;
  /** States that carry overrides at this breakpoint — their option says so. */
  statesWithOverrides?: ReadonlySet<PseudoStateId>;
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

/** Whether the active page is a collection's template page. */
function onTemplatePage(composer: Composer): boolean {
  const page = composer.elements.getActivePage?.();
  if (!page) return false;
  const file = pageFileNames(composer.elements.getAllPages()).get(page.id);
  return Boolean(file) && (composer.cms?.collections.getAllCollections() ?? []).some((c) => c.pageTemplatePath === file);
}

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
  state,
  onStateChange,
  statesWithOverrides,
}: InspectorHeaderProps) {
  const stateId = React.useId();
  const multi = selectedIds.length > 1;
  const typeLabel = elementTypeLabel(element.type);
  const Icon = getElementIcon(element.type);

  let items: BreadcrumbItem[] = [];
  let multiName = "";
  if (composer && onTemplatePage(composer)) {
    if (multi) {
      const els = selectedIds.map((id) => composer.elements.getElement(id)).filter((e): e is Element => Boolean(e));
      const types = new Set(els.map((e) => e.getType()));
      multiName = `${selectedIds.length} selected · ${types.size === 1 ? pluralType(element.type) : "Elements"}`;
      const parent = commonParent(els);
      items = pathFor(composer, parent);
    } else {
      const el = composer.elements.getElement(element.id);
      items = pathFor(composer, el?.getParent?.() ?? null, getLayerName(el) ?? typeLabel);
    }
  }

  return (
    <div className="tw:flex tw:flex-col tw:gap-1 tw:p-3" data-testid="inspector-header">
      {items.length > 0 ? (
        <Breadcrumb label="Element path" items={items} className="tw:h-4" data-testid="inspector-breadcrumb" />
      ) : null}
      <div className="tw:flex tw:h-6 tw:items-center tw:gap-1" data-testid="inspector-target-row">
        <div className="tw:flex tw:min-w-0 tw:flex-1 tw:items-center tw:gap-2 tw:text-[13px] tw:font-semibold tw:leading-4 tw:text-[var(--bk-ink-soft)]">
          {multi ? null : (
            <span className="tw:inline-flex tw:shrink-0" aria-hidden="true" data-testid="inspector-type-icon">
              <Icon size="sm" />
            </span>
          )}
          <span className="tw:min-w-0 tw:truncate" title={multi ? multiName : undefined}>
            {multi ? (
              <span data-testid="inspector-element-name">{multiName}</span>
            ) : (
              <ElementNameField composer={composer} elementId={element.id} typeLabel={typeLabel} />
            )}
          </span>
        </div>
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
      <div className="tw:flex tw:h-8 tw:items-center tw:gap-2" data-testid="inspector-editing-row">
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
      </div>
    </div>
  );
}
