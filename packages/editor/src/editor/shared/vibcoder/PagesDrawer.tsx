/**
 * Vibcoder PagesDrawer — pages tree drawer organism.
 *
 * Composes T2 Drawer + Phase 2 ListRow (Contract D — only public sibling
 * exports of the wrapped components, never their internals).
 *
 * Sibling exports (Contract C):
 *   PagesDrawer        — composes <Drawer><DrawerContent side="left">…</DrawerContent></Drawer>
 *   PagesDrawerGroup   — collapsible group of pages with heading
 *   PagesDrawerItem    — individual page row (composes ListRow, inherits ListRowProps)
 *
 * Adaptation note (Phase 3 T3 finding):
 *   Source CSS (organisms/pages-drawer.css) defines slot classes
 *   `__tree`, `__tree-head`, `__tree-label`, `__tree-body`, `__row`,
 *   `__row-name`, `__row-slug`, `__detail`, `__detail-title`, `__detail-meta`
 *   for a 2-column tree+detail layout. The plan API uses forward-looking
 *   compose markers (`__group`, `__item`, `__body`, `__title`, `__desc`)
 *   which the vendored CSS does not yet style. We emit them anyway as
 *   semantic hooks per the plan's intent — Gate 19/21 only block bdr-*
 *   leaks and vibcoder-shape token defs, not additive bd-* class hooks.
 *   Per manifest: `bdr-list-row` is the canonical replacement for
 *   `bdr-pages-drawer__row`, so PagesDrawerItem composes ListRow.
 *
 * No engine import (E2 N/A — only Phase 2/3 wrappers used).
 * No portal logic (E3 — Drawer already owns it).
 *
 * @license BSD-3-Clause
 */
import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerDescription,
} from "./Drawer";
import { ListRow, type ListRowProps } from "./ListRow";

export interface PagesDrawerProps {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  /** Drawer title (default: "Pages"). */
  title?: string;
  /** Optional secondary description rendered below title. */
  description?: string;
  children: ReactNode;
}

export interface PagesDrawerGroupProps extends HTMLAttributes<HTMLDivElement> {
  heading: string;
  children: ReactNode;
}

// PagesDrawerItem inherits all ListRowProps; adds bd-pages-drawer__item marker.
export type PagesDrawerItemProps = ListRowProps;

// Root — controlled-only Provider (Contract B). NO defaultOpen.
// Provider wrappers without DOM elements use plain functions (not forwardRef).
export function PagesDrawer({
  open,
  onOpenChange,
  title = "Pages",
  description,
  children,
}: PagesDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent side="left">
        <DrawerTitle className="bd-pages-drawer__title">{title}</DrawerTitle>
        {description && (
          <DrawerDescription className="bd-pages-drawer__desc">
            {description}
          </DrawerDescription>
        )}
        <div className="bd-drawer__body bd-pages-drawer__body">{children}</div>
      </DrawerContent>
    </Drawer>
  );
}
PagesDrawer.displayName = "PagesDrawer";

export const PagesDrawerGroup = forwardRef<HTMLDivElement, PagesDrawerGroupProps>(
  ({ heading, children, className, ...rest }, ref) => {
    const classes = ["bd-pages-drawer__group", className]
      .filter(Boolean)
      .join(" ");
    return (
      <div ref={ref} className={classes} {...rest}>
        <div className="bd-pages-drawer__group-heading">{heading}</div>
        {children}
      </div>
    );
  },
);
PagesDrawerGroup.displayName = "PagesDrawerGroup";

export const PagesDrawerItem = forwardRef<HTMLButtonElement, PagesDrawerItemProps>(
  ({ className, ...rest }, ref) => {
    const classes = ["bd-pages-drawer__item", className]
      .filter(Boolean)
      .join(" ");
    return <ListRow ref={ref} className={classes} {...rest} />;
  },
);
PagesDrawerItem.displayName = "PagesDrawerItem";
