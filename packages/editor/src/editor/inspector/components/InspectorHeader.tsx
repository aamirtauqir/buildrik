/**
 * InspectorHeader — board 1's header, three rows:
 *   1. the path — chrome-ui Breadcrumb, "Home › Hero › Heading": the page
 *      crumb clears the selection (→ Page panel), an ancestor crumb selects it
 *      (the Layers-click path);
 *   2. identity — type icon + editable name · ✦ AI (the panel's only AI door)
 *      · ⋯ (board 30) · ✕ "Hide inspector (⌘\)";
 * 72 tall like every board: the identity row is 28 (the boards' 28px action
 * boxes). The status marks are their own row below it (StatusMarks).
 * Variants: `multi` (board 22): the name row reads "3 selected · Headings"
 * with no type icon, and the path is the shared parent's own ("Home › Hero"),
 * ending on that parent — the selection is not repeated as a crumb.
 *
 * @license BSD-3-Clause
 */

import { X } from "lucide-react";
import * as React from "react";
import type { Composer, Element } from "@/engine";
import { Breadcrumb, Button, IconButton, type BreadcrumbItem } from "@/editor/chrome-ui";
import { getElementIcon } from "@/editor/shared/elementIcons";
import { getLayerName } from "@/editor/panels/layers/hooks/layersPersistence";
import { elementTypeLabel } from "@/shared/constants/elementTypeLabels";
import { EVENTS } from "@/shared/constants/events";
import { ElementNameField } from "./ElementNameField";
import { InspectorElementMenu } from "./InspectorElementMenu";

export interface InspectorHeaderProps {
  composer: Composer | null | undefined;
  element: { id: string; type: string };
  /** Every selected id (primary first); more than one = the multi variant. */
  selectedIds: readonly string[];
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

export function InspectorHeader({ composer, element, selectedIds }: InspectorHeaderProps) {
  const multi = selectedIds.length > 1;
  const typeLabel = elementTypeLabel(element.type);
  const Icon = getElementIcon(element.type);

  let items: BreadcrumbItem[] = [];
  let multiName = "";
  if (composer) {
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
      {items.length > 0 ? <Breadcrumb label="Element path" items={items} data-testid="inspector-breadcrumb" /> : null}
      <div className="tw:flex tw:min-h-7 tw:items-center tw:gap-1">
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
        <Button
          type="button"
          className="tw:h-6 tw:w-10 tw:shrink-0 tw:justify-center tw:rounded-[6px] tw:bg-[var(--bk-accent-tint)] tw:px-2 tw:text-[11px] tw:font-medium tw:text-[var(--bk-accent-text)] tw:whitespace-nowrap"
          title="Ask AI about this element"
          aria-label="Ask AI about this element"
          data-testid="inspector-ai-chip"
          onClick={() => composer?.emit("ui:switch-tab", { tab: "ai" })}
        >
          ✦ AI
        </Button>
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
    </div>
  );
}
