/**
 * Pages tab shared types
 * @license BSD-3-Clause
 */

import type { PageSEO } from "../../../../shared/types";

/** Visibility/publication state of a page — stored in page.settings.visibility */
export type PageStatus = "live" | "draft" | "hidden" | "password" | "error" | "external";

/** Settings drawer tab identifier */
export type DrawerTab = "seo" | "social" | "advanced";

/** A sidebar-only folder that groups pages. Stored in localStorage, not the engine. */
export interface FolderItem {
  id: string;
  name: string;
  pageIds: string[];
  collapsed: boolean;
}

export interface PageItem {
  id: string;
  name: string;
  slug: string;
  route?: string;
  isHome?: boolean;
  /** True when this page is the currently active/open page in the composer. */
  isActive?: boolean;
  /** Page visibility/publication status. Defaults to "live". */
  status?: PageStatus;
  seo?: PageSEO;
  /** Custom <head> HTML injected for this page (from settings.head) */
  head?: string;
  /** ISO8601 timestamp from engine PageData.updatedAt — used for row "2m ago" label */
  updatedAt?: string;
}
