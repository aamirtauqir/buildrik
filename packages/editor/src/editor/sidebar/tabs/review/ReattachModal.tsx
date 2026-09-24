/**
 * Re-attach this comment — board 4418:115766. A comment whose element was
 * deleted is re-pinned by PICKING an element from a list of the elements on
 * its page ("Button · Reserve a table", "Section · Hours", …), not by a
 * crosshair hunt on the canvas. The canvas pick is kept as a secondary
 * link (owner rule: parity never silently removes a capability).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Button, ModalBody, ModalClose, ModalContent, ModalFooter, ModalRoot, ModalTitle } from "@/editor/chrome-ui";

export interface ReattachCandidate {
  id: string;
  label: string;
}

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/** The engine element surface the list reads — the page's live tree
 *  (PageData.root is only a stub; the registry holds the active page). */
export interface CandidateNode {
  getId(): string;
  getType(): string;
  getContent(): string;
  getCustomData(key: string): unknown;
  getChildren(): CandidateNode[];
}

/** Every element under the page root, labelled "Type · Name" (the layer
 *  name, else the first 40 characters of its text). */
export function reattachCandidates(root: CandidateNode | null | undefined): ReattachCandidate[] {
  if (!root) return [];
  const out: ReattachCandidate[] = [];
  const walk = (el: CandidateNode) => {
    for (const child of el.getChildren()) {
      const layer = child.getCustomData("layerName");
      const text = (child.getContent() ?? "").replace(/<[^>]*>/g, "").trim().slice(0, 40);
      const name = typeof layer === "string" && layer ? layer : text;
      out.push({ id: child.getId(), label: name ? `${cap(child.getType())} · ${name}` : cap(child.getType()) });
      walk(child);
    }
  };
  walk(root);
  return out;
}

export interface ReattachModalProps {
  open: boolean;
  body: string;
  pageName: string | null;
  candidates: ReattachCandidate[];
  onClose: () => void;
  /** Resolves when re-pinned; rejects to keep the modal open. */
  onReattach: (elementId: string) => Promise<void>;
  /** The kept canvas pick (crosshair mode). */
  onPickOnCanvas?: () => void;
}

export const ReattachModal: React.FC<ReattachModalProps> = ({
  open,
  body,
  pageName,
  candidates,
  onClose,
  onReattach,
  onPickOnCanvas,
}) => {
  const [picked, setPicked] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (!open) setPicked(null);
  }, [open]);

  const submit = async () => {
    if (!picked || busy) return;
    setBusy(true);
    try {
      await onReattach(picked);
      onClose();
    } catch {
      // The caller toasts; the pick stays for a retry.
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalRoot open={open} onOpenChange={(next) => !next && onClose()}>
      <ModalContent size="confirm" data-testid="reattach-modal">
        <ModalTitle className="tw:text-[length:var(--bk-text-16)]">Re-attach this comment</ModalTitle>
        <ModalClose label="Close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </ModalClose>
        <ModalBody>
          <p className="tw:m-0 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)]">{`“${body}”`}</p>
          {pageName ? (
            <p className="tw:m-0 tw:mt-2 tw:text-[12px] tw:text-[var(--bk-ink-muted)]">{pageName}</p>
          ) : null}
          <div
            role="radiogroup"
            aria-label="Element to re-attach to"
            className="tw:mt-3 tw:flex tw:max-h-[240px] tw:flex-col tw:gap-2 tw:overflow-y-auto"
            data-testid="reattach-candidates"
          >
            {candidates.length === 0 ? (
              <p className="tw:m-0 tw:text-[12px] tw:text-[var(--bk-ink-muted)]">This page has no elements to pin to.</p>
            ) : (
              candidates.map((c) => (
                <Button
                  key={c.id}
                  color="light"
                  size="xs"
                  role="radio"
                  aria-checked={picked === c.id}
                  onClick={() => setPicked(c.id)}
                  className={`${OPTION} ${picked === c.id ? OPTION_ON : ""}`}
                  data-testid={`reattach-option-${c.id}`}
                >
                  <span className="tw:truncate">{c.label}</span>
                </Button>
              ))
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          {onPickOnCanvas ? (
            <Button
              color="light"
              size="xs"
              className="tw:mr-auto tw:border-transparent tw:bg-transparent tw:px-0 tw:text-[var(--bk-accent)]"
              onClick={() => {
                onClose();
                onPickOnCanvas();
              }}
            >
              Pick on canvas
            </Button>
          ) : null}
          <Button color="light" size="xs" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button size="xs" onClick={() => void submit()} disabled={!picked || busy} data-testid="reattach-submit">
            {busy ? "Re-attaching…" : "Re-attach"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </ModalRoot>
  );
};

/* Board 4418:115766: 36-tall bordered rows, 12px ink, the pick in accent. */
const OPTION =
  "tw:h-9 tw:w-full tw:flex-none tw:justify-start tw:rounded-md tw:border tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-card)] tw:px-2 tw:text-[12px] tw:font-normal tw:text-[var(--bk-ink)]";
const OPTION_ON = "tw:border-[var(--bk-accent)] tw:bg-[var(--bk-accent-tint)]";
