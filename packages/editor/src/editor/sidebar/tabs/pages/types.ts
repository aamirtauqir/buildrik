/**
 * Pages tab shared types
 * @license BSD-3-Clause
 */

import type { PageSEO } from "../../../../shared/types";

/** Visibility/publication state of a page — stored in page.settings.visibility */
/* No "password" (C4 #26): Password pages are removed; a page saved as one
   before decision #21 reads as "hidden" (usePages). */
export type PageStatus = "live" | "draft" | "hidden" | "scheduled" | "error" | "external";

/** Settings drawer tab identifier */
export type DrawerTab = "seo" | "social" | "advanced";

/** `ui:pages-open-settings` from outside the panel — Settings' saved repair
 *  card (`Back to <Page> SEO`, Clone 3519:20096) and the Templates success
 *  modal. Held by StudioPanels while this panel mounts, then handed down. */
export interface PageSettingsOpenRequest {
  pageId: string;
  tab?: DrawerTab;
}

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
  /** Page visibility/publication status. Defaults to **"live"** when
   *  `settings.visibility` is unset (usePages), matching what the exporter's
   *  `isPageLive` does with the same field. It read "draft" (CAN-013) for a
   *  while and the panel announced a published page as Draft. Whether a
   *  page's URL is reachable at all is a SITE fact (`metadata.publishedUrl`),
   *  which is what SeoTab's slug warning gates on. */
  status?: PageStatus;
  seo?: PageSEO;
  /** Custom <head> HTML injected for this page (from settings.head) */
  head?: string;
  /** ISO8601 timestamp from engine PageData.updatedAt — used for row "2m ago" label */
  updatedAt?: string;
}
