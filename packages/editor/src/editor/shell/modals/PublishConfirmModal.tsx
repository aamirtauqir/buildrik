/**
 * PublishConfirmModal — board B8-PB04 `233:1802` ("Publish to {domain}",
 * the numbered ledger with its acknowledgement box; was B3-10 `7574:193972`):
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
import { ModalBody, ModalContent, ModalFooter, ModalRoot, ModalTitle, Button, Checkbox } from "@/editor/chrome-ui";
import type { Composer } from "@/engine";
import { EVENTS } from "@/shared/constants/events";
import { PublishConfirmFacts } from "@/editor/sidebar/tabs/publish/PublishConfirmFacts";
import { publishTray } from "../publishTrayStore";
import { fetchMyRole, roleAtLeast } from "@/services/RoleService";

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
  /** The approval is older than the edits (gate `stale-approval`, B8-PB05 /
   *  PB06): the Approval row offers an Admin the override box and anyone else
   *  the way to a fresh review; `onConfirm` then ships with acknowledgeStale. */
  stale?: boolean;
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
  stale = false,
  onConfirm,
  onClose,
}) => {
  /* PB06: publishing past a stale approval is ADMIN+ (the router enforces
     the same, sites.publish acknowledgeStale). */
  const [admin, setAdmin] = React.useState<boolean | null>(null);
  const [override, setOverride] = React.useState(false);
  React.useEffect(() => {
    if (!isOpen || !stale) return;
    setOverride(false);
    let alive = true;
    fetchMyRole()
      .then((r) => alive && setAdmin(roleAtLeast(r, "ADMIN") === true))
      .catch(() => alive && setAdmin(false));
    return () => {
      alive = false;
    };
  }, [isOpen, stale]);
  const [submitting, setSubmitting] = React.useState(false);
  /* A blocking pre-publish check means the server will refuse this deploy.
     v3 FC-8: every failing check renders here, not just the first. */
  const [blockers, setBlockers] = React.useState<Array<{ label: string; detail: string }>>([]);
  /* The exporter's count, reported by the facts component: a publish with
     nothing in it must not be offered. */
  const [pageCount, setPageCount] = React.useState<number | null>(null);
  const [warnCount, setWarnCount] = React.useState(0);
  /* B8-PB04: advice is acknowledged, not just shown — the server's warnings
     and the site's own tips (the tray's list, `publishTrayStore`). */
  const siteTips = publishTray.get().issues.filter((i) => i.type === "warning").length;
  const tips = warnCount + siteTips;
  const [tipsSeen, setTipsSeen] = React.useState(false);
  React.useEffect(() => {
    if (isOpen) setTipsSeen(false);
  }, [isOpen]);
  const blockedByStale = stale && !(admin && override);
  const unticked = (tips > 0 && !tipsSeen) || (stale && admin === true && !override);

  /* The confirm opens with the Publish surface already up behind it — the
     existing `UI_PANEL_OPEN` door, once per open. */
  React.useEffect(() => {
    if (!isOpen) return;
    composer?.emit?.(EVENTS.UI_PANEL_OPEN, { panel: "publish" });
  }, [isOpen, composer]);

  const domain = publishedUrl ? publishedUrl.replace(/^https?:\/\//, "").replace(/\/.*$/, "") : null;

  return (
    <ModalRoot open={isOpen} onOpenChange={(o) => !o && onClose()}>
      {/* Board B8-PB04 `233:1802`: 720 wide, no ✕ (Cancel and Esc close), "Publish to {domain}", the
          numbered ledger, Cancel · Publish, the reason under them. */}
      <ModalContent size="lg" srTitle="Confirm publish" data-testid="publish-confirm">
        <ModalTitle className="tw:text-[length:var(--bk-text-16)]">
          {domain ? `Publish to ${domain}` : "Publish this site"}
        </ModalTitle>

        <ModalBody>
          <div className="tw:-mt-2 tw:mb-[4px]">
            <PublishConfirmFacts
              active={isOpen}
              composer={composer}
              publishedUrl={publishedUrl}
              isPublished={isPublished}
              onPageCount={setPageCount}
              siteId={siteId}
              onBlockingChecks={setBlockers}
              onWarnings={setWarnCount}
              tips={tips}
              tipsSeen={tipsSeen}
              onTipsSeen={setTipsSeen}
              stale={stale}
              staleControl={
                admin ? (
                  <label className="tw:flex tw:items-start tw:gap-1.5 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)]">
                    <Checkbox
                      className="tw:mt-0.5"
                      checked={override}
                      onChange={(e) => setOverride(e.currentTarget.checked)}
                      data-testid="publish-confirm-override"
                    />
                    Publish without a fresh review
                  </label>
                ) : admin === false ? (
                  <Button
                    color="light"
                    size="xs"
                    className="tw:h-5 tw:border-transparent tw:bg-transparent tw:p-0 tw:text-[13px] tw:font-normal tw:text-[var(--bk-accent)]"
                    onClick={() => {
                      onClose();
                      composer?.emit?.(EVENTS.UI_SWITCH_TAB, { tab: "review" });
                    }}
                    data-testid="publish-confirm-request-review"
                  >
                    Request fresh review
                  </Button>
                ) : null
              }
            />
            {stale && admin === false ? (
              <p className="tw:m-0 tw:mt-1 tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink-muted)]" data-testid="publish-confirm-stale-note">
                Publishing without a fresh review needs Admin access — or request a fresh review.
              </p>
            ) : null}
          </div>

          {/* v3 FC-8: every failing server check, not just the first. */}
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
            disabled={submitting || pageCount === 0 || blockers.length > 0 || unticked || blockedByStale}
            aria-describedby={unticked ? "publish-confirm-reason" : undefined}
            onClick={() => {
              setSubmitting(true);
              void Promise.resolve(onConfirm()).finally(() => setSubmitting(false));
            }}
          >
            {submitting ? "Publishing…" : "Publish"}
          </Button>
        </ModalFooter>
        {unticked ? (
          <p id="publish-confirm-reason" className="tw:m-0 tw:px-6 tw:pb-4 tw:text-[12px] tw:text-[var(--bk-ink-muted)]" data-testid="publish-confirm-reason">
            Tick the boxes above to publish
          </p>
        ) : null}
      </ModalContent>
    </ModalRoot>
  );
};

export default PublishConfirmModal;
