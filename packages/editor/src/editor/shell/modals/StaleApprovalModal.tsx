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
import { ModalContent, ModalFooter, ModalRoot, ModalTitle, useToast, Button } from "@/editor/chrome-ui";
import type { Composer } from "@/engine";
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
        <ModalTitle>Publish work {name} hasn&rsquo;t seen?</ModalTitle>
        <p style={{ fontSize: 13, color: "var(--bk-ink-muted)", margin: "8px 0 12px" }}>
          {round?.reviewerName ?? "Your client"} approved round {round?.roundNumber ?? "—"}
          {approvedOn(round)}.{" "}
          {changed == null
            ? "Comparing with the approved version…"
            : changed.length === 0
              ? "The changes since couldn't be itemized — publishing still ships them."
              : `${changed.length} thing${changed.length === 1 ? "" : "s"} changed after that:`}
        </p>
        {changed != null && changed.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
            {changed.slice(0, 6).map((c) => (
              <div
                key={`${c.kind}-${c.path}`}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "var(--bk-warning-tint)",
                  border: "1px solid var(--bk-warning-text)",
                  borderRadius: "var(--bk-radius-sm)",
                  padding: "8px 10px",
                  fontSize: 12,
                }}
              >
                <span style={{ color: "var(--bk-ink)", fontWeight: 500, textTransform: "capitalize" }}>
                  {pageLabel(c.path)}
                </span>
                <span style={{ color: "var(--bk-warning-text)" }}>{c.kind}</span>
              </div>
            ))}
            {changed.length > 6 && (
              <div style={{ fontSize: 11, color: "var(--bk-ink-muted)" }}>
                and {changed.length - 6} more
              </div>
            )}
          </div>
        )}
        <p style={{ fontSize: 12, color: "var(--bk-ink-muted)", margin: "0 0 4px" }}>
          {name === "your client" ? "The" : `${name}’s`} approval still stands — publishing
          now just ships these on top of it.
        </p>
        <ModalFooter>
          <Button color="light" size="xs" disabled={resending} onClick={() => void handleResend()}>
            {resending ? "Re-sending…" : "Re-send for approval"}
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
