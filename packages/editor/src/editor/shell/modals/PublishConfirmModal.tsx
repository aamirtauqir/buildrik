/**
 * PublishConfirmModal — step 3 of the publish flow (Figma "Publish · Confirm").
 *
 * Publishing replaces the live site for every visitor and there was no confirm
 * on the normal path: clicking Publish exported and deployed immediately. The
 * only gate that existed was StaleApprovalModal, which fires *after* the server
 * rejects a stale approval — so the common case shipped with no stop at all.
 *
 * Every line here is backed by something real. It deliberately does NOT offer a
 * deploy target, a changelog note, or scheduling (the Figma "Publish · Options"
 * step): `publishInputSchema` carries only siteId/pages/acknowledgeStale, there
 * is no environment column, and nothing stores a per-publish note. Rendering
 * those controls would be the same class of defect this flow was fixed for.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { ModalContent, ModalFooter, ModalRoot, ModalTitle, Button } from "@/editor/chrome-ui";
import type { Composer } from "@/engine";
import { PublishConfirmFacts } from "@/editor/sidebar/tabs/publish/PublishConfirmFacts";

export interface PublishConfirmModalProps {
  isOpen: boolean;
  composer: Composer | null;
  /** True when a deployment is already serving — publishing REPLACES it. */
  isPublished: boolean;
  /** The live URL, when there is one. */
  publishedUrl?: string | null;
  /** Proceed with the canonical publish. */
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}


export const PublishConfirmModal: React.FC<PublishConfirmModalProps> = ({
  isOpen,
  composer,
  isPublished,
  publishedUrl,
  onConfirm,
  onClose,
}) => {
  const [submitting, setSubmitting] = React.useState(false);
  /* The exporter's count, reported by the facts component: a publish with
     nothing in it must not be offered. */
  const [pageCount, setPageCount] = React.useState<number | null>(null);

  return (
    <ModalRoot open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <ModalContent size="question" srTitle="Confirm publish">
        <ModalTitle>{isPublished ? "Update the live site?" : "Publish this site?"}</ModalTitle>

        {/* The four rows live in PublishConfirmFacts — the wizard's Confirm
            step renders the same component, so the two entry points into board
            914:4507 cannot drift apart. */}
        <div className="tw:mt-[10px] tw:mb-[4px]">
          <PublishConfirmFacts
            active={isOpen}
            composer={composer}
            publishedUrl={publishedUrl}
            isPublished={isPublished}
            onPageCount={setPageCount}
          />
        </div>

        {isPublished && (
          <p className="tw:mt-[10px] tw:mb-0 tw:rounded-[var(--bk-radius-sm)] tw:px-[11px] tw:py-[9px] tw:text-[12px] tw:text-[var(--bk-warning-text)] tw:bg-[var(--bk-warning-tint)]">
            This replaces the live site immediately for all visitors.
          </p>
        )}

        <ModalFooter>
          <Button color="light" size="xs" disabled={submitting} onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="xs"
            disabled={submitting || pageCount === 0}
            onClick={() => {
              setSubmitting(true);
              void Promise.resolve(onConfirm()).finally(() => setSubmitting(false));
            }}
          >
            {submitting ? "Publishing…" : isPublished ? "Update now" : "Publish now"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </ModalRoot>
  );
};

export default PublishConfirmModal;
