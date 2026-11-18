/**
 * BottomBar — the shell's 32px bottom band (Figma 2L9 `Shell/BottomBar`
 * 497:99485), two contexts:
 *
 *   Editor         the page switcher and its count line.
 *   Resource area  CMS, Brand, Settings, Assets and Templates cover the canvas;
 *                  the bar says the page is still open and is the way back
 *                  ("‹ Back to Editor", board 497:99474).
 *
 * Both contexts end with the save status ("✓ Saved just now", SaveStatus
 * State=Saved) and a Ghost "Details" that opens History — the two halves of
 * the save pill that used to sit in the topbar. The status is written by
 * StudioHeader into `saveStatusStore`; nothing shows in view mode.
 *
 * Rendered by StudioPanels into LayoutShell's footer slot.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "@/engine";
import { Button, SaveStatus } from "@/editor/chrome-ui";
import { EVENTS } from "@/shared/constants/events";
import type { PageSummary } from "@/shared/types";
import { useActivePageId } from "@/editor/shared/useActivePageId";
import { useEditLocks } from "@/editor/shared/useEditLocks";
import { PageSwitcher } from "./PageSwitcher";
import { useShellSaveStatus } from "./saveStatusStore";

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
  /* "Add page" opens the Pages panel and asks for its New page dialog, as
     every other Add-page door does — the panel alone was a label the click
     did not keep (REA S-4). */
  const addPage = React.useCallback(() => {
    composer?.emit(EVENTS.UI_PANEL_OPEN, { panel: "pages" });
    composer?.emit(EVENTS.UI_NEW_PAGE_REQUESTED, {});
  }, [composer]);

  const save = useShellSaveStatus();
  /* Keeps "Saved 2m ago" honest without a render on every tick. */
  const [, setTick] = React.useState(0);
  const ticking = save?.state === "saved" && Boolean(save.savedAt);
  React.useEffect(() => {
    if (!ticking) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 30_000);
    return () => window.clearInterval(id);
  }, [ticking]);
  /* Board 497:99485: the status sits in a fixed column left of "Details", so
     a longer state ("Not loaded · nothing saved yet") does not move the door. */
  const saveGroup = save ? (
    <div className="tw:flex tw:flex-none tw:items-center" data-testid="bottom-bar-save">
      <span className="tw:flex tw:w-[248px] tw:min-w-0 tw:items-center">
        <SaveStatus
          state={save.state}
          savedAt={save.savedAt}
          onClick={save.onClick}
          hint={save.hint}
          stalledFor={save.stalledFor}
          panel={save.panel}
        />
      </span>
      {save.onDetails ? (
        <Button
          variant="ghost"
          size="xs"
          className="tw:h-6 tw:px-2 tw:text-[12px] tw:font-medium tw:text-[var(--bk-ink)]"
          onClick={save.onDetails}
          data-testid="bottom-bar-details"
        >
          Details
        </Button>
      ) : null}
    </div>
  ) : null;

  if (resourceArea) {
    const page = pages.find((p) => p.id === activePageId);
    return (
      <>
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
      {saveGroup}
      </>
    );
  }

  return (
    <>
    <PageSwitcher
      pages={pages}
      activePageId={activePageId}
      open={open}
      onOpenChange={setOpen}
      onSelect={(id) => composer?.elements.setActivePage(id)}
      onManagePages={openPagesPanel}
      onAddPage={addPage}
      disabledReason={notLoaded ? "Available when the site loads" : undefined}
    />
    {saveGroup}
    </>
  );
}
