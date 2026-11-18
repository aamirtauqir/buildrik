/**
 * UnsavedLinkNotice — the page panel on a collection page whose link the
 * server has not confirmed (2L9 B5 187:22071; REQUESTS A-26):
 *
 *   ‹ CMS · Dynamic pages
 *   Collection link not saved
 *   The page is safe here. Retry the link in CMS.
 *   Retry in CMS ›
 *
 * State: L-A's `unsavedCollectionLinks.forPage(pageId)` — it clears itself
 * once the link lands (retry or queue replay). Both doors open the
 * collection's Dynamic pages tab, where "Page created, link not saved" offers
 * Retry link save.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine";
import { Button } from "@/editor/chrome-ui";
import { EVENTS } from "@/shared/constants/events";
import { cmsWorkspace } from "@/editor/cms/cmsWorkspaceStore";
import { unsavedCollectionLinks } from "@/editor/cms/unsavedCollectionLinks";

const LINK = "tw:h-8 tw:text-[13px] tw:font-normal";

export function UnsavedLinkNotice({ composer, pageId }: { composer: Composer; pageId: string }) {
  const link = React.useSyncExternalStore(
    unsavedCollectionLinks.subscribe,
    () => unsavedCollectionLinks.forPage(pageId),
    () => unsavedCollectionLinks.forPage(pageId),
  );
  if (!link) return null;
  const open = () => {
    cmsWorkspace.openRequest({ collectionId: link.collectionId, tab: "dynamic-pages" });
    composer.emit(EVENTS.UI_PANEL_OPEN, { panel: "content" });
  };
  return (
    <div className="tw:flex tw:flex-col tw:pb-2" data-testid="inspector-unsaved-link">
      <div className="tw:flex tw:justify-center">
        <Button type="button" variant="link" size="xs" className={LINK} onClick={open}>
          ‹ CMS · Dynamic pages
        </Button>
      </div>
      {/* 187:22071: a full-bleed warning band. */}
      <div role="status" className="tw:mt-2 tw:flex tw:flex-col tw:gap-1 tw:bg-[var(--bk-warning-tint)] tw:px-3 tw:py-3">
        <p className="tw:m-0 tw:text-[13px] tw:font-semibold tw:leading-4 tw:text-[var(--bk-warning-text)]">Collection link not saved</p>
        <p className="tw:m-0 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-warning-text)]">The page is safe here. Retry the link in CMS.</p>
        <div className="tw:flex tw:justify-center">
          <Button type="button" variant="link" size="xs" className={LINK} onClick={open} data-testid="inspector-unsaved-link-retry">
            Retry in CMS ›
          </Button>
        </div>
      </div>
    </div>
  );
}
