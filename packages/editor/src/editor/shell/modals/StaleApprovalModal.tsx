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
      {/* 560, which board 131:201 draws (131:401 is 560x352) and which the
          size map already carries — `form` is the only 560 in it. It shipped
          `lg` (720), a third wider than the only board that states a width. */}
      <ModalContent size="form" srTitle="Publish un-approved changes?" data-testid="stale-modal">
        {/* Board 1168:4713. The title states the FACT (the approval is stale),
            not a question about the client — the question is the buttons. */}
        {/* `inset={false}` + our own padding: board 131:402 is 16/24 at the 24
            gutter, and ModalTitle's own pl-5 cannot be beaten by a second
            padding utility (two classes on one property resolve by stylesheet
            order — the escape hatch the part itself documents). */}
        <ModalTitle
          inset={false}
          className="tw:px-6 tw:pt-6 tw:pb-3 tw:leading-6"
          /* Through `style`: MODAL_TITLE_CLASS already sets
             `text-[length:var(--bk-text-14)]`, and two arbitrary font-size
             utilities on a plain element resolve by stylesheet order rather
             than by which one the caller wrote — measured, the part's 14 won. */
          style={{ fontSize: "var(--bk-text-16)" }}
          data-testid="stale-title"
        >
          The approval is older than your latest edits
        </ModalTitle>
        {/* ModalBody carries the horizontal inset — same missing-gutter bug
            as PublishConfirmModal (FINDING-008). */}
        {/* 24, not the part's 16. Five boards in this file draw a dialog body at
            the 24 gutter — 131:401 here, 184:56/70/87 on the orphan modals, and
            914:4517, whose own recipe conformed the same inset at its call
            site. Every 512-wide row on this board IS 560 less two 24s. */}
        <ModalBody className="tw:px-6">
        <p
          className="tw:my-0 tw:mb-3 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink-soft)]"
          data-testid="stale-body"
        >
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
              {/* Board 131:404/407: a 44-tall tinted row on a 6 radius, the page
                  in 13/20 Medium INK (not warning-text — the tint already says
                  "changed", and amber-on-amber was the quietest thing in the
                  dialog) and the verb in 12/18 ink-muted at the far end. */}
              {changed.slice(0, 6).map((c, i) => (
                <div
                  key={`${c.kind}-${c.path}`}
                  className="tw:flex tw:h-11 tw:w-full tw:items-center tw:justify-between tw:gap-2 tw:rounded-[var(--bk-radius-md)] tw:bg-[var(--bk-warning-tint)] tw:px-3"
                  data-testid={`stale-change-${i}`}
                >
                  <span
                    className="tw:text-[13px] tw:font-medium tw:capitalize tw:leading-5 tw:text-[var(--bk-ink)]"
                    data-testid={`stale-change-name-${i}`}
                  >
                    {pageLabel(c.path)}
                  </span>
                  <span
                    className="tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink-muted)]"
                    data-testid={`stale-change-kind-${i}`}
                  >
                    {c.kind}
                  </span>
                </div>
              ))}
              {changed.length > 6 && (
                <div className="tw:text-[11px] tw:text-[var(--bk-ink-muted)]">
                  and {changed.length - 6} more
                </div>
              )}
            </div>
            {/* Board 131:201's closing line (131:410), and it is true of this
                code: acknowledging lets the publish through WITHOUT revoking
                the sign-off — `publish-approval.ts:97` only blocks while
                `acknowledgeStale` is false. Without it the modal states the
                risk and leaves the user to guess whether pressing the amber
                button also throws away the approval they already have. */}
            <p
              className="tw:m-0 tw:mb-3 tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink-muted)]"
              data-testid="stale-footnote"
            >
              {round?.reviewerName ? `${round.reviewerName}’s` : "The"} approval still stands — publishing
              now just ships {changed.length === 1 ? "this change" : "these changes"} on top of it.
            </p>
          </>
        )}
        </ModalBody>
        <ModalFooter>
          {/* Board 1168:4713 draws this as the strong primary — it is the safe
              choice, and the amber "Publish anyway" beside it is not. It shipped
              as `color="light"`, which maps to flowbite's white/grey secondary,
              so the recovery path was quieter than the risky one. */}
          <Button size="xs" disabled={resending} onClick={() => void handleResend()}>
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
