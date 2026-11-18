/**
 * VersionsModal — Clone 3695:45529 "Asset versions": the library's dialog
 * around the one version list (`AssetVersionList`, the same list the drawer's
 * Versions drill-in draws). A saved edit is a version of the SAME asset — a
 * row flagged with its parent, hidden from the grid — and putting it on the
 * site is a separate, explicit Restore. The list's ⋯ hands that restore to
 * the library's own confirm (`RestoreVersionModal`), which names the uses and
 * pages and reports per page.
 *
 * The footer keeps `Edit latest saved version`: it opens the editor on the
 * latest version's file, and its save becomes the next version of the same
 * parent. "Apply latest saved version" is gone — restoring the latest row is
 * the same action, and any other version can be restored the same way.
 *
 * Shape from `libraryModal.ts` (title 16/600, body 13 ink-soft, 32px
 * buttons, 8 gap) at the Clone's 640.
 *
 * @license BSD-3-Clause
 */

import { Button, ModalBody, ModalContent, ModalRoot } from "@/editor/chrome-ui";
import type { LibraryItem } from "@/editor/sidebar/tabs/media/data/mediaTypes";
import { AssetVersionList } from "@/editor/sidebar/tabs/media/components/AssetVersionList";
import type { AssetVersionRow, AssetVersions } from "@/editor/sidebar/tabs/media/hooks/useAssetVersions";
import { LIBRARY_MODAL_BODY, LIBRARY_MODAL_BTN_SECONDARY, LIBRARY_MODAL_FOOT, LIBRARY_MODAL_TITLE } from "./libraryModal";

interface VersionsModalProps {
  open: boolean;
  /** `useAssetVersions` over the parent's family — the original first. */
  versions: AssetVersions;
  onClose(): void;
  /** Opens the editor on the latest saved version's file. */
  onEditLatest(latest: LibraryItem): void;
  /** Opens the restore confirm for that version. */
  onRestore(row: AssetVersionRow): void;
}

export function VersionsModal({ open, versions, onClose, onEditLatest, onRestore }: VersionsModalProps) {
  const parent = versions.rows[0];
  const latest = versions.rows[versions.rows.length - 1];
  if (!parent || !latest) return null;

  return (
    <ModalRoot open={open} onClose={onClose}>
      <ModalContent size="table" srTitle="Asset versions" data-testid="versions-modal">
        <h2 className={LIBRARY_MODAL_TITLE} data-testid="versions-title">
          Asset versions
        </h2>
        <ModalBody>
          <p className={LIBRARY_MODAL_BODY} data-testid="versions-subtitle">
            {parent.item.displayName ?? parent.item.name} · Original retained
          </p>
          <div className="tw:mt-3 tw:max-h-[50vh] tw:overflow-y-auto" data-testid="versions-list">
            <AssetVersionList key={parent.item.key} versions={versions} onRestore={onRestore} />
          </div>
        </ModalBody>
        <div className={LIBRARY_MODAL_FOOT} data-testid="versions-foot">
          <Button size="xs" variant="secondary" className={LIBRARY_MODAL_BTN_SECONDARY} onClick={onClose} data-testid="versions-close">
            Close
          </Button>
          <Button
            size="xs"
            variant="secondary"
            className={LIBRARY_MODAL_BTN_SECONDARY}
            onClick={() => onEditLatest(latest.item)}
            data-testid="versions-edit-latest"
          >
            Edit latest saved version
          </Button>
        </div>
      </ModalContent>
    </ModalRoot>
  );
}
