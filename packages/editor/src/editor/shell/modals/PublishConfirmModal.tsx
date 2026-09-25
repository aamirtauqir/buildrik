/**
 * PublishConfirmModal — board B3-10 `7574:193972` ("Publish to production?"):
 * the ONE facts confirm both publish doors open (code-gap B4, decision #34 —
 * the topbar CTA and the Publish panel's CTA route here through the shell's
 * `requestPublish`). The panel's own two-step wizard, whose second step
 * duplicated this dialog, is gone.
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
import { ModalBody, ModalClose, ModalContent, ModalFooter, ModalRoot, ModalTitle, Button } from "@/editor/chrome-ui";
import type { Composer } from "@/engine";
import { EVENTS } from "@/shared/constants/events";
import { PublishConfirmFacts, warningsLine } from "@/editor/sidebar/tabs/publish/PublishConfirmFacts";

export interface PublishConfirmModalProps {
  isOpen: boolean;
  composer: Composer | null;
  /** True when a deployment is already serving — publishing REPLACES it. */
  isPublished: boolean;
  /** The live URL, when there is one. */
  publishedUrl?: string | null;
  /** The site being published — passed through so the facts can ask the server
      whether this workspace can deploy at all. */
  siteId?: string | null;
  /** Proceed with the canonical publish. */
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}


export const PublishConfirmModal: React.FC<PublishConfirmModalProps> = ({
  isOpen,
  composer,
  isPublished,
  publishedUrl,
  siteId,
  onConfirm,
  onClose,
}) => {
  const [submitting, setSubmitting] = React.useState(false);
  /* A blocking pre-publish check means the server will refuse this deploy.
     The panel path has always shown that up front; this one used to publish
     anyway and let the job die after it had queued. v3 FC-8: every failing
     check renders here now, not just the first — the Publish panel's own
     PrePublishChecks list has always shown every row, from the same server
     call (`fetchPrePublishChecks`, read once in PublishConfirmFacts). */
  const [blockers, setBlockers] = React.useState<Array<{ label: string; detail: string }>>([]);
  /* The exporter's count, reported by the facts component: a publish with
     nothing in it must not be offered. */
  const [pageCount, setPageCount] = React.useState<number | null>(null);
  const [warnCount, setWarnCount] = React.useState(0);

  /* Board 7574:193972: the confirm opens with the Publish panel already up
     in the right column behind it — the checks the panel has always shown
     up front, not a modal floating over a bare canvas
     (DEF-shell-publish-confirm-no-panel). `UI_PANEL_OPEN` is the existing
     event `useEditorEventListeners` already answers for every ⌘K "Open X
     panel" command — this reuses that door instead of drilling a new prop
     through the shell (which owns this modal at
     `AquibraStudio.tsx`, out of scope for this fix). Fires once per open,
     not on every re-render while the facts stream in. */
  React.useEffect(() => {
    if (!isOpen) return;
    composer?.emit?.(EVENTS.UI_PANEL_OPEN, { panel: "publish" });
  }, [isOpen, composer]);

  return (
    <ModalRoot open={isOpen} onOpenChange={(o) => !o && onClose()}>
      {/* Board 7574:193972 (parity V1 #6): 480 wide, a ✕, the title at 16. */}
      <ModalContent size="confirm" srTitle="Confirm publish" data-testid="publish-confirm">
        {/* Board B3-10 asks one question in every state — the Target row is
            what says "replaces live v6". */}
        <ModalTitle className="tw:text-[length:var(--bk-text-16)]">Publish to production?</ModalTitle>
        <ModalClose label="Close" data-testid="publish-confirm-close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </ModalClose>

        {/* The four rows live in PublishConfirmFacts — the wizard's Confirm
            step renders the same component, so the two entry points into board
            914:4507 cannot drift apart. ModalBody carries the horizontal
            inset: without it the fact labels and values sat flush against the
            modal edges (walked live 2026-08-28). */}
        <ModalBody>
        <div className="tw:mt-[10px] tw:mb-[4px]">
          <PublishConfirmFacts
            active={isOpen}
            composer={composer}
            publishedUrl={publishedUrl}
            isPublished={isPublished}
            onPageCount={setPageCount}
            siteId={siteId}
            onBlockingChecks={setBlockers}
            onWarnings={setWarnCount}
          />
        </div>

        {isPublished && (
          <p className="tw:mt-[10px] tw:mb-0 tw:rounded-[var(--bk-radius-sm)] tw:px-[11px] tw:py-[9px] tw:text-[12px] tw:text-[var(--bk-warning-text)] tw:bg-[var(--bk-warning-tint)]">
            This replaces the live site immediately for all visitors.
          </p>
        )}

        {/* The comment above claims these two doors cannot drift apart. They
            had: the wizard showed a warnings band and this one showed nothing,
            so the fast path published a site with unresolved warnings and said
            so nowhere. Suppressed when blocked, where the blocker is the
            thing to read. */}
        {blockers.length === 0 && warnCount > 0 && (
          <p className="tw:mt-[10px] tw:mb-0 tw:rounded-[var(--bk-radius-sm)] tw:px-[11px] tw:py-[9px] tw:text-[12px] tw:text-[var(--bk-warning-text)] tw:bg-[var(--bk-warning-tint)]">
            {warningsLine(warnCount)}
          </p>
        )}

        {/* v3 FC-8: every failing server check, not just the first — the
            Publish panel's PrePublishChecks list has always shown every row
            from this same fetchPrePublishChecks call; this door used to read
            only `.find(status === "fail")` and hide the rest. */}
        {blockers.map((b) => (
          <p
            key={b.label}
            className="tw:mt-[10px] tw:mb-0 tw:rounded-[var(--bk-radius-sm)] tw:px-[11px] tw:py-[9px] tw:text-[12px] tw:text-[var(--bk-error)] tw:bg-[var(--bk-error-tint)]"
            role="alert"
          >
            <span className="tw:font-medium">{b.label}:</span> <span>{b.detail}</span>
          </p>
        ))}
        </ModalBody>

        <ModalFooter>
          <Button color="light" size="xs" disabled={submitting} onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="xs"
            disabled={submitting || pageCount === 0 || blockers.length > 0}
            onClick={() => {
              setSubmitting(true);
              void Promise.resolve(onConfirm()).finally(() => setSubmitting(false));
            }}
          >
            {submitting ? "Publishing…" : "Publish now"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </ModalRoot>
  );
};

export default PublishConfirmModal;
