/**
 * BottomBar — the shell's 32px bottom band (Figma 2L9 `Shell/BottomBar`
 * 497:99485), two contexts:
 *
 *   Editor         the page switcher and its count line.
 *   Resource area  CMS, Brand, Settings, Assets and Templates cover the canvas;
 *                  the bar says the page is still open and is the way back
 *                  ("‹ Back to Editor", board 497:99474).
 *
 * Rendered by StudioPanels into LayoutShell's footer slot.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "@/engine";
import { Button } from "@/editor/chrome-ui";
import { EVENTS } from "@/shared/constants/events";
import type { PageSummary } from "@/shared/types";
import { useActivePageId } from "@/editor/shared/useActivePageId";
import { useEditLocks } from "@/editor/shared/useEditLocks";
import { PageSwitcher } from "./PageSwitcher";

export interface BottomBarProps {
  composer: Composer | null;
  pages: readonly PageSummary[];
  /** A resource area replaces the canvas: no switcher, a way back instead. */
  resourceArea: boolean;
  onBackToEditor: () => void;
}

export function BottomBar({ composer, pages, resourceArea, onBackToEditor }: BottomBarProps) {
  /* Only a missing site disables navigation; view mode and time travel can
     still switch pages (setActivePage is not a document write). */
  const notLoaded = useEditLocks(composer).includes("not-loaded");

  const activePageId = useActivePageId(composer);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (!composer || resourceArea) return;
    const toggle = () => setOpen((o) => !o);
    composer.on(EVENTS.UI_TOGGLE_PAGE_SWITCHER, toggle);
    return () => {
      composer.off(EVENTS.UI_TOGGLE_PAGE_SWITCHER, toggle);
    };
  }, [composer, resourceArea]);

  React.useEffect(() => {
    if (resourceArea) setOpen(false);
  }, [resourceArea]);

  const openPagesPanel = React.useCallback(() => {
    composer?.emit(EVENTS.UI_PANEL_OPEN, { panel: "pages" });
  }, [composer]);

  if (resourceArea) {
    const page = pages.find((p) => p.id === activePageId);
    return (
      <div className="tw:flex tw:min-w-0 tw:items-center tw:gap-1 tw:text-[12px] tw:text-[var(--bk-ink-muted)]" data-testid="bottom-bar-resource">
        <span className="tw:truncate">Editor keeps {page?.name ?? "your page"} open — return with</span>
        <Button
          variant="link"
          size="xs"
          className="tw:h-6 tw:flex-none tw:px-1 tw:text-[12px]"
          data-testid="bottom-bar-back-to-editor"
          onClick={onBackToEditor}
        >
          ‹ Back to Editor
        </Button>
      </div>
    );
  }

  return (
    <PageSwitcher
      pages={pages}
      activePageId={activePageId}
      open={open}
      onOpenChange={setOpen}
      onSelect={(id) => composer?.elements.setActivePage(id)}
      onManagePages={openPagesPanel}
      onAddPage={openPagesPanel}
      disabledReason={notLoaded ? "Available when the site loads" : undefined}
    />
  );
}
