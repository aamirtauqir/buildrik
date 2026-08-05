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
import { exportPublishPages } from "../exportPublishPages";
import { fetchCurrentRound, type CurrentRound } from "@/services/ReviewService";

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

function approvalLine(round: CurrentRound | null, loading: boolean): string {
  if (loading) return "Checking review status…";
  if (!round || round.revoked) return "Not sent for review.";
  if (round.status?.toLowerCase() === "approved") {
    const when = round.resolvedAt
      ? new Date(round.resolvedAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })
      : null;
    const who = round.reviewerName ?? round.invitedEmail ?? "the client";
    return when ? `Approved by ${who} on ${when}.` : `Approved by ${who}.`;
  }
  if (round.openCommentCount > 0) {
    return `Round ${round.roundNumber} open — ${round.openCommentCount} unresolved comment${round.openCommentCount === 1 ? "" : "s"}.`;
  }
  return `Round ${round.roundNumber} is still open.`;
}

const ROW =
  "tw:flex tw:justify-between tw:items-baseline tw:gap-[16px] tw:py-[7px] tw:text-[12px]";
const KEY = "tw:flex-none tw:text-[var(--bk-ink-muted)]";
const VAL = "tw:text-right tw:font-medium tw:text-[var(--bk-ink)]";

export const PublishConfirmModal: React.FC<PublishConfirmModalProps> = ({
  isOpen,
  composer,
  isPublished,
  publishedUrl,
  onConfirm,
  onClose,
}) => {
  const [pageCount, setPageCount] = React.useState<number | null>(null);
  const [round, setRound] = React.useState<CurrentRound | null>(null);
  const [loadingRound, setLoadingRound] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setPageCount(null);
    setLoadingRound(true);
    void (async () => {
      const [pages, r] = await Promise.all([
        composer ? exportPublishPages(composer).catch(() => null) : Promise.resolve(null),
        fetchCurrentRound().catch(() => null),
      ]);
      if (cancelled) return;
      setPageCount(pages ? pages.length : null);
      setRound(r);
      setLoadingRound(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, composer]);

  const target = publishedUrl
    ? publishedUrl.replace(/^https?:\/\//, "")
    : "your connected Vercel project";

  return (
    <ModalRoot open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <ModalContent size="question" srTitle="Confirm publish">
        <ModalTitle>{isPublished ? "Update the live site?" : "Publish this site?"}</ModalTitle>

        <div className="tw:mt-[10px] tw:mb-[4px]">
          <div className={ROW}>
            <span className={KEY}>Publishing to</span>
            <span className={VAL}>{target}</span>
          </div>
          <div className={ROW}>
            <span className={KEY}>Pages</span>
            <span className={VAL}>
              {pageCount == null ? "Preparing…" : `${pageCount} page${pageCount === 1 ? "" : "s"}`}
            </span>
          </div>
          <div className={ROW}>
            <span className={KEY}>Client approval</span>
            <span className={VAL}>{approvalLine(round, loadingRound)}</span>
          </div>
          <div className={ROW}>
            <span className={KEY}>Rollback</span>
            <span className={VAL}>
              {isPublished
                ? "The current version stays restorable"
                : "Every version stays restorable"}
            </span>
          </div>
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
