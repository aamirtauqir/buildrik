/**
 * StaleApprovalModal — S5.6 · approved-but-edited-since (Figma board 131:201).
 *
 * The site changed after the client approved it. Publish is blocked behind a
 * deliberate acknowledgement that names WHAT changed: the modal diffs the
 * approved snapshot against the current pages and lists the changed pages.
 * "Re-send for approval" starts a fresh round with the same client;
 * "Publish anyway" ships the un-approved changes on top of the sign-off.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { ModalBody, ModalContent, ModalFooter, ModalRoot, ModalTitle, useToast, Button } from "@/editor/chrome-ui";
import type { Composer } from "@/engine";
import { EVENTS } from "@/shared/constants/events";
import { exportPublishPages, type PublishPage } from "../exportPublishPages";
import {
  fetchApprovedSnapshot,
  fetchCurrentRound,
  submitForReview,
  type CurrentRound,
} from "@/services/ReviewService";

interface StaleApprovalModalProps {
  isOpen: boolean;
  composer: Composer | null;
  /** Publish the un-approved changes deliberately (acknowledged path). */
  onPublishAnyway: () => void | Promise<void>;
  /** Dismiss the gate without publishing. */
  onClose: () => void;
}

interface ChangedPage {
  path: string;
  kind: "edited" | "added" | "removed";
}

function diffPages(approved: PublishPage[], current: PublishPage[]): ChangedPage[] {
  const a = new Map(approved.map((p) => [p.path, p.html]));
  const c = new Map(current.map((p) => [p.path, p.html]));
  const out: ChangedPage[] = [];
  for (const [path, html] of c) {
    if (!a.has(path)) out.push({ path, kind: "added" });
    else if (a.get(path) !== html) out.push({ path, kind: "edited" });
  }
  for (const path of a.keys()) {
    if (!c.has(path)) out.push({ path, kind: "removed" });
  }
  return out;
}

function pageLabel(path: string): string {
  const base = path.replace(/\.html$/, "");
  return base === "index" ? "Home" : base.replace(/[-_]/g, " ");
}

function approvedOn(round: CurrentRound | null): string {
  if (!round?.resolvedAt) return "";
  const d = new Date(round.resolvedAt);
  return ` on ${d.toLocaleDateString(undefined, { day: "numeric", month: "short" })}`;
}

export const StaleApprovalModal: React.FC<StaleApprovalModalProps> = ({
  isOpen,
  composer,
  onPublishAnyway,
  onClose,
}) => {
  const { addToast } = useToast();
  const [round, setRound] = React.useState<CurrentRound | null>(null);
  const [changed, setChanged] = React.useState<ChangedPage[] | null>(null);
  const [currentPages, setCurrentPages] = React.useState<PublishPage[] | null>(null);
  const [resending, setResending] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen || !composer) return;
    let cancelled = false;
    setChanged(null);
    setRound(null);
    void (async () => {
      try {
        const [r, snap, pages] = await Promise.all([
          fetchCurrentRound(),
          fetchApprovedSnapshot(),
          exportPublishPages(composer),
        ]);
        if (cancelled) return;
        setRound(r);
        setCurrentPages(pages);
        setChanged(snap ? diffPages(snap, pages) : []);
      } catch {
        if (!cancelled) setChanged([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, composer]);

  const name = round?.reviewerName ?? "your client";

  const handleResend = async () => {
    setResending(true);
    try {
      await submitForReview(
        undefined,
        changed?.length
          ? `Re-send after ${changed.length} change${changed.length === 1 ? "" : "s"}`
          : "Re-send for approval",
        round?.invitedEmail ?? undefined,
        currentPages ?? undefined,
      );
      composer?.emit(EVENTS.REVIEW_SENT, { invitedEmail: round?.invitedEmail ?? null });
      addToast({
        tone: "success",
        title: "Sent for approval",
        description: `A fresh review round is on its way to ${round?.invitedEmail ?? "the client"}.`,
        duration: 4000,
      });
      onClose();
    } catch {
      addToast({
        tone: "error",
        title: "Couldn't re-send",
        description: "The review link didn't go out. Try again.",
        duration: 4000,
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <ModalRoot open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <ModalContent size="lg" srTitle="Publish un-approved changes?">
        {/* Board 1168:4713. The title states the FACT (the approval is stale),
            not a question about the client — the question is the buttons. */}
        <ModalTitle>The approval is older than your latest edits</ModalTitle>
        {/* ModalBody carries the horizontal inset — same missing-gutter bug
            as PublishConfirmModal (FINDING-008). */}
        <ModalBody>
        <p className="tw:my-2 tw:mb-3 tw:text-[13px] tw:leading-normal tw:text-[var(--bk-ink-muted)]">
          {/* The round is fetched separately from the block that opens this
              modal, so it can be absent — and the fallback used to render the
              placeholder into the prose: "Your client approved round — — the
              changes since couldn't be itemized." A dash is a table's way of
              saying "no value"; in a sentence it reads as a typo. Without a
              round, state the fact the server just asserted and stop. */}
          {round
            ? `${round.reviewerName ?? "Your client"} approved round ${round.roundNumber}${approvedOn(round)}`
            : "This site was approved earlier"}
          {changed == null
            ? " — comparing with the approved version…"
            : changed.length === 0
              ? " — the changes since couldn't be itemized."
              : ` — since then, ${changed.length} ${changed.length === 1 ? "thing" : "things"} changed.`}
          {" "}
          Publishing now would go live with work the client hasn&rsquo;t seen.
        </p>
        {changed != null && changed.length > 0 && (
          <>
            <p className="tw:m-0 tw:mb-1.5 tw:text-[11px] tw:font-medium tw:uppercase tw:tracking-[0.04em] tw:text-[var(--bk-ink-muted)]">
              Changed since approval
            </p>
            <div className="tw:mb-3 tw:flex tw:flex-col tw:gap-1.5">
              {changed.slice(0, 6).map((c) => (
                <div
                  key={`${c.kind}-${c.path}`}
                  className="tw:flex tw:items-center tw:gap-2 tw:rounded-[var(--bk-radius-sm)] tw:bg-[var(--bk-warning-tint)] tw:px-2.5 tw:py-2 tw:text-[12px]"
                >
                  <span className="tw:font-medium tw:capitalize tw:text-[var(--bk-warning-text)]">
                    {pageLabel(c.path)}
                  </span>
                  <span className="tw:text-[var(--bk-ink-muted)]">{c.kind}</span>
                </div>
              ))}
              {changed.length > 6 && (
                <div className="tw:text-[11px] tw:text-[var(--bk-ink-muted)]">
                  and {changed.length - 6} more
                </div>
              )}
            </div>
          </>
        )}
        </ModalBody>
        <ModalFooter>
          <Button color="light" size="xs" disabled={resending} onClick={() => void handleResend()}>
            {resending ? "Requesting…" : "Request fresh review"}
          </Button>
          <Button
            size="xs"
            style={{ background: "var(--bk-warning)", borderColor: "var(--bk-warning)" }}
            onClick={() => void onPublishAnyway()}
          >
            Publish anyway
          </Button>
        </ModalFooter>
      </ModalContent>
    </ModalRoot>
  );
};

export default StaleApprovalModal;
