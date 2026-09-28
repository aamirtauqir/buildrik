/**
 * PagePanel — what the Inspector shows when nothing is selected, or the page
 * root is (DD-13, board 21): the page's own Fill, Size, Typography and
 * Spacing ("Home · Page"), "SEO & social…", "Your place here is kept"; no
 * tabs, no Link / CMS / Visibility / Interactions.
 *
 * W1 STUB with its final props: renders today's empty state (which keeps the
 * one-time "Template applied" banner). Lane L3-A builds the board: it targets
 * the active page's root through useStyleHandlers and renders the registry
 * entries marked `page: true` with `ctx.variant = "page"`.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "@/engine";
import { InspectorEmptyState } from "./InspectorEmptyState";

export interface PagePanelProps {
  composer: Composer | null | undefined;
}

export function PagePanel({ composer }: PagePanelProps) {
  return <InspectorEmptyState composer={composer} />;
}
