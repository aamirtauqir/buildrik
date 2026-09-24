/**
 * ComponentsSection — Brand › Component styles, board 7316:82755.
 *
 * Owner ruling 2026-09-24: the page lists the site's SECTIONS — the Add ›
 * Blocks set (Hero, Features, Menu grid, Testimonials, CTA, Contact, Footer,
 * Navbar) — not UI controls. The list is Add's own `blockRows`, so the two
 * cannot drift. One bordered card, a 48px row per section: its name over
 * "Default appearance", ending in the board's ›. A row hands off to that
 * section (the workspace opens Add › Blocks); no per-section style editor
 * exists behind it yet. The page's one action, "✦ Generate with AI", is the
 * workspace header's (BrandWorkspace).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { blockRows } from "@/editor/sidebar/tabs/build/catalog/groups";
import { BrandCard, BrandChevron, BrandRow } from "../BrandCard";

export interface ComponentsSectionProps {
  /** A row was chosen — the workspace takes the user to that section. */
  onOpenSection?: (blockId: string) => void;
}

export const ComponentsSection: React.FC<ComponentsSectionProps> = ({ onOpenSection }) => (
  <BrandCard label="Component styles" data-testid="brand-components-list">
    {blockRows.map((block) => (
      <BrandRow
        key={block.id}
        data-section-row={block.id}
        data-testid={`brand-comp-row-${block.id}`}
        name={<span data-testid={`brand-comp-label-${block.id}`}>{block.label}</span>}
        sub={<span data-testid={`brand-comp-meta-${block.id}`}>Default appearance</span>}
        trailing={<BrandChevron />}
        onSelect={onOpenSection ? () => onOpenSection(block.id) : undefined}
      />
    ))}
  </BrandCard>
);
