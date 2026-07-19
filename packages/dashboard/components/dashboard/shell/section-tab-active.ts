"use client";

import { usePathname } from "next/navigation";

/**
 * Section-tab SSOT (IA v2, E7): the active rule and the token classes live
 * here; AgencyTabs is a thin renderer over them.
 *
 * Active rule: segment-safe prefix match, with an exact-match exception for a
 * section's index href — the index must not light on every sibling route, and
 * nested survivors (settings/integrations/vercel-team-picker) keep their
 * parent tab lit.
 */
export function useSectionTabActive(href: string, opts?: { index?: boolean }): boolean {
  const pathname = usePathname();
  if (opts?.index) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** The sidebar's active visual pattern, shared by both renderers: primary-subtle
 *  fill + semibold + primary text when active; bg-subtle hover; accent
 *  focus-visible ring; 13px labels; 6px radius; 44px touch target on mobile. */
export const sectionTabClass = {
  base: "flex items-center whitespace-nowrap rounded-sm px-3 py-2 text-body transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] max-lg:min-h-11",
  active: "bg-[var(--color-primary-subtle)] font-semibold text-[var(--color-primary)]",
  inactive: "font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-text-primary)]",
};
