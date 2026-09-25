/**
 * RoundHistoryModal — board 4418:172775 ("Review round history"), opened from
 * the Review ⋯ menu's "Round history ›".
 *
 * Newest round first; each round is a two-line block — where it stands, then
 * what it is relative to the others. The board's second line ("Included: Home,
 * Menu and Contact") needs the pages each round's snapshot carried, which no
 * endpoint returns, so the line says when the round moved instead. Round 1 is
 * muted and says why it has nothing to compare against.
 *
 * The primary compares the last approved round with the current one — the
 * same approved-vs-current Compare the ⋯ menu opens — and is drawn only when
 * there IS an approved round to compare with.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Button, Modal } from "@/editor/chrome-ui";
import type { CurrentRound, RoundListRow } from "../../../../services/ReviewService";

export interface RoundHistoryModalProps {
  open: boolean;
  onClose: () => void;
  /** null while loading. */
  rounds: RoundListRow[] | null;
  error: boolean;
  onRetry: () => void;
  current: CurrentRound;
  siteName: string;
  onCompare?: () => void;
  /** "2d" / "3h" — the panel's own age scale. */
  age: (iso: string | Date) => string;
}

const LINE = "tw:m-0 tw:text-[13px] tw:leading-5";

function outcome(r: Pick<RoundListRow, "status" | "revoked">): string {
  const st = r.status?.toUpperCase();
  if (st === "APPROVED") return "Approved";
  if (st === "CHANGES_REQUESTED") return "Changes requested";
  if (r.revoked) return "Link revoked";
  return "Awaiting approval";
}

export function RoundHistoryModal({
  open,
  onClose,
  rounds,
  error,
  onRetry,
  current,
  siteName,
  onCompare,
  age,
}: RoundHistoryModalProps) {
  const ordered = rounds ? [...rounds].sort((a, b) => b.roundNumber - a.roundNumber) : [];
  const baseline = ordered.find((r) => r.id !== current.id && r.status?.toUpperCase() === "APPROVED") ?? null;
  const who = current.reviewerName ?? current.invitedEmail ?? null;

  const body = error ? (
    <p className={`${LINE} tw:text-[var(--bk-ink-muted)]`} role="alert">
      Couldn&apos;t load the history.{" "}
      <Button color="light" size="xs" variant="link" className="tw:text-[13px]" onClick={onRetry}>
        Try again
      </Button>
    </p>
  ) : rounds === null ? (
    <p className={`${LINE} tw:text-[var(--bk-ink-muted)]`}>Loading…</p>
  ) : (
    <div className="tw:flex tw:flex-col tw:gap-4" data-testid="review-rounds-list">
      {ordered.map((r) => {
        const isCurrent = r.id === current.id;
        const first = r.roundNumber === 1 && !isCurrent;
        const head = isCurrent
          ? `Round ${r.roundNumber} · Current · ${outcome(r)}`
          : first
            ? `Round 1 · Initial snapshot`
            : `Round ${r.roundNumber} · ${r === baseline ? "Approved baseline" : outcome(r)}`;
        const tail = first
          ? "No earlier round exists — there is nothing to compare this against."
          : `${r.status?.toUpperCase() === "APPROVED" ? "approved" : "sent"} ${age(r.resolvedAt ?? r.createdAt)} ago${
              r.revoked && r.status?.toUpperCase() === "APPROVED" ? " · link revoked" : ""
            }`;
        return (
          <div
            key={r.id}
            className={`tw:flex tw:flex-col ${first ? "tw:text-[var(--bk-ink-muted)]" : "tw:text-[var(--bk-ink)]"}`}
            data-testid={`review-round-${r.roundNumber}`}
          >
            <p className={LINE}>{head}</p>
            <p className={LINE}>{tail}</p>
          </div>
        );
      })}
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Review round history"
      width="lg"
      testId="review-round-history"
      footer={
        <>
          <Button color="light" className="tw:border-transparent tw:bg-transparent" onClick={onClose}>
            Return to current review
          </Button>
          {baseline && onCompare ? (
            <Button
              onClick={() => {
                onClose();
                onCompare();
              }}
            >
              Compare Round {baseline.roundNumber} and {current.roundNumber}
            </Button>
          ) : null}
        </>
      }
    >
      <div className="tw:flex tw:flex-col tw:gap-4">
        <p className={`${LINE} tw:text-[var(--bk-ink)]`}>
          {siteName}
          {who ? ` · ${who}` : ""} · Sent snapshots
        </p>
        {body}
      </div>
    </Modal>
  );
}
