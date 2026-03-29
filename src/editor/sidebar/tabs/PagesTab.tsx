/**
 * PagesTab — Shell component.
 *
 * Wires usePages hook to sub-components. Zero business logic here.
 * Business logic: ./pages/usePages.ts
 * Settings logic: ./pages/settings/usePageSettings.ts
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine";
import { ConfirmDialog } from "../../../shared/ui/Modal";
import { PanelHeader } from "../shared/PanelHeader";
import { PageContextMenu } from "./pages/components/PageContextMenu";
import { PageList } from "./pages/components/PageList";
import { PageSettingsDrawer } from "./pages/settings/PageSettingsDrawer";
import { usePages } from "./pages/usePages";
import "./PagesTab.css";

export interface PagesTabProps {
  composer: Composer | null;
  isPinned?: boolean;
  onPinToggle?: () => void;
  onHelpClick?: () => void;
  onClose?: () => void;
  /** Called when user clicks "From Template" — parent should switch to Templates tab */
  onRequestTemplates?: () => void;
  /** Called when user clicks the upgrade CTA */
  onUpgradeClick?: () => void;
}

export const PagesTab: React.FC<PagesTabProps> = ({
  composer,
  isPinned,
  onPinToggle,
  onHelpClick,
  onClose,
}) => {
  const p = usePages(composer);

  // Delete confirmation state — UI concern lives here, not in usePages
  const [deleteTargetId, setDeleteTargetId] = React.useState<string | null>(null);
  const deleteTarget = p.pages.find((pg) => pg.id === deleteTargetId);

  const handleDeleteRequest = (pageId: string) => {
    const page = p.pages.find((pg) => pg.id === pageId);
    if (!page) return;
    // Guards are in usePages.deletePage — short-circuit for guarded cases
    if (page.isHome || p.isOnlyPage) {
      p.deletePage(pageId); // shows toast warning, no actual delete
      return;
    }
    setDeleteTargetId(pageId); // show confirm dialog
  };

  const settingsPage = p.pages.find((pg) => pg.id === p.settingsPageId) ?? null;

  return (
    <div className="pages-panel">
      <PanelHeader
        title="Pages"
        isPinned={isPinned}
        onPinToggle={onPinToggle}
        onHelpClick={onHelpClick}
        onClose={onClose}
      />

      {/* Error state — takes priority over everything */}
      {p.loadError ? (
        <div className="pages-error" role="alert" aria-live="assertive">
          <div className="pages-error__msg">{p.loadError}</div>
          <div className="pages-error__sub">Check your connection and try again.</div>
          <button className="pages-error__btn" onClick={p.retrySync}>
            Try again
          </button>
        </div>
      ) : settingsPage ? (
        <PageSettingsDrawer
          composer={composer}
          page={settingsPage}
          allPages={p.pages}
          onClose={p.closeSettings}
        />
      ) : (
        <PageList
          pages={p.pages}
          renamingPageId={p.renamingPageId}
          canSearch={p.canSearch}
          openContextMenuPageId={p.contextMenu?.pageId ?? null}
          onAddPage={p.addPage}
          onSelectPage={p.selectPage}
          onContextMenu={p.openContextMenu}
          onSettingsClick={p.openSettings}
          onRenameStart={p.startRename}
          onRenameCommit={p.commitRename}
          onRenameCancel={p.cancelRename}
        />
      )}

      {/* Context menu (portal) */}
      {p.contextMenu && (
        <PageContextMenu
          pageId={p.contextMenu.pageId}
          x={p.contextMenu.x}
          y={p.contextMenu.y}
          pages={p.pages}
          onClose={p.closeContextMenu}
          onRename={p.startRename}
          onDuplicate={p.duplicatePage}
          onDelete={handleDeleteRequest}
          onSetHomepage={p.setHomepage}
          onCopyLink={p.copyPageLink}
          onSettings={p.openSettings}
        />
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={() => {
          if (deleteTargetId) p.deletePage(deleteTargetId);
          setDeleteTargetId(null);
        }}
        title={`Delete "${deleteTarget?.name}"?`}
        message="All content on this page will be permanently removed. You can undo immediately after."
        confirmText="Delete Page"
        variant="danger"
      />
    </div>
  );
};

export default PagesTab;
