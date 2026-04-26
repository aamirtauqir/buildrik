/**
 * Vibcoder TemplatesDrawer — template grid drawer organism.
 *
 * Composes T2 Drawer + Phase 2 Card (Contract D — only public sibling
 * exports of the wrapped components, never their internals).
 *
 * Sibling exports (Contract C):
 *   TemplatesDrawer          — composes <Drawer><DrawerContent side="right">…</DrawerContent></Drawer>
 *   TemplatesDrawerCategory  — labeled section with sub-grid for templates
 *   TemplatesDrawerItem      — single template tile (composes Card)
 *
 * Adaptation note (Phase 3 T3 finding):
 *   Source CSS (organisms/templates-drawer.css) defines slot classes for a
 *   single column-flex layout: `__filters`, `__chip`, `__body`, `__grid`,
 *   `__card`, `__thumb`, `__meta`, `__name`, `__sub`. The plan API uses
 *   forward-looking compose markers (`__category`, `__category-heading`,
 *   `__category-grid`, `__item`, `__item-thumb`) which the vendored CSS
 *   does not yet style. We emit them anyway as semantic hooks per the
 *   plan's intent. Per manifest: `bdr-card` is the molecule used for the
 *   tile; TemplatesDrawerItem composes Card with thumbnail + header + body.
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
import { Card, CardHeader, CardBody, type CardProps } from "./Card";

export interface TemplatesDrawerProps {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  /** Drawer title (default: "Templates"). */
  title?: string;
  /** Optional secondary description rendered below title. */
  description?: string;
  children: ReactNode;
}

export interface TemplatesDrawerCategoryProps
  extends HTMLAttributes<HTMLDivElement> {
  heading: string;
  children: ReactNode;
}

export interface TemplatesDrawerItemProps extends CardProps {
  /** Optional preview image / illustration slot above the title. */
  thumbnail?: ReactNode;
  /** Required template name shown as the card header. */
  templateTitle: string;
  /** Optional one-line subtitle shown in the card body. */
  templateDescription?: string;
}

// Root — controlled-only Provider (Contract B). NO defaultOpen.
// Provider wrappers without DOM elements use plain functions (not forwardRef).
export function TemplatesDrawer({
  open,
  onOpenChange,
  title = "Templates",
  description,
  children,
}: TemplatesDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent side="right">
        <DrawerTitle className="bd-templates-drawer__title">
          {title}
        </DrawerTitle>
        {description && (
          <DrawerDescription className="bd-templates-drawer__desc">
            {description}
          </DrawerDescription>
        )}
        <div className="bd-drawer__body bd-templates-drawer__grid">{children}</div>
      </DrawerContent>
    </Drawer>
  );
}
TemplatesDrawer.displayName = "TemplatesDrawer";

export const TemplatesDrawerCategory = forwardRef<
  HTMLDivElement,
  TemplatesDrawerCategoryProps
>(({ heading, children, className, ...rest }, ref) => {
  const classes = ["bd-templates-drawer__category", className]
    .filter(Boolean)
    .join(" ");
  return (
    <div ref={ref} className={classes} {...rest}>
      <div className="bd-templates-drawer__category-heading">{heading}</div>
      <div className="bd-templates-drawer__category-grid">{children}</div>
    </div>
  );
});
TemplatesDrawerCategory.displayName = "TemplatesDrawerCategory";

export const TemplatesDrawerItem = forwardRef<
  HTMLDivElement,
  TemplatesDrawerItemProps
>(
  (
    { thumbnail, templateTitle, templateDescription, className, ...rest },
    ref,
  ) => {
    const classes = ["bd-templates-drawer__item", className]
      .filter(Boolean)
      .join(" ");
    return (
      <Card ref={ref} className={classes} {...rest}>
        {thumbnail && (
          <div className="bd-templates-drawer__item-thumb">{thumbnail}</div>
        )}
        <CardHeader>{templateTitle}</CardHeader>
        {templateDescription && <CardBody>{templateDescription}</CardBody>}
      </Card>
    );
  },
);
TemplatesDrawerItem.displayName = "TemplatesDrawerItem";
