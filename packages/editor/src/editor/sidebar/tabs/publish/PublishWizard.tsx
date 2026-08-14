/**
 * PublishWizard — boards 833:4518 (Review) and 914:4507 (Confirm).
 *
 * The publish flow is a stepped modal, not an inline panel section: the
 * checklist decides whether a publish is allowed, the confirm step states what
 * is about to happen and that it happens immediately. Shipping them inline
 * meant the panel showed a checklist nobody had asked for and a button that
 * published with no statement of consequence.
 *
 * TWO steps, not the three the stepper is drawn with. Board 912:4520 ("2.
 * Options") carries its own annotation: "design-ahead · no backend yet —
 * publishInputSchema carries siteId · pages · acknowledgeStale only. No
 * environment column, no per-publish note, no scheduler — all three controls
 * below are unbacked." Building it would ship three dead controls, which is
 * the exact defect this arc keeps removing. It becomes step 2 the day the
 * schema carries them.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button, ModalContent, ModalRoot, Spinner } from "@/editor/chrome-ui";
import type { PrePublishChecksResult } from "@buildrik/shared/schemas/publish";
import type { Composer } from "@/engine";
import { PublishConfirmFacts } from "./PublishConfirmFacts";

type Step = "review" | "confirm";

export interface PublishWizardProps {
  open: boolean;
  onClose(): void;
  /** Runs the publish. The wizard closes first — the panel owns progress. */
  onPublish(): void;
  checkState: "loading" | "ready" | "error";
  checks: PrePublishChecksResult | null;
  onRetryChecks(): void;
  /** Rendered on a check row when the editor can take the user to the fix. */
  renderFix?(label: string): React.ReactNode;
  /** Confirm-step context. The facts themselves come from
      PublishConfirmFacts, which reads the exporter and the review round. */
  composer: Composer | null;
  publishedUrl: string | null;
  isPublished: boolean;
  rollbackTo: number | null;
}

const STEP_PILL = "tw:rounded-full tw:px-2.5 tw:py-1 tw:text-[12px] tw:leading-4";
const ROW = "tw:flex tw:items-center tw:gap-3 tw:h-9 tw:px-6";
const BAND =
  "tw:mx-6 tw:my-3 tw:rounded-md tw:bg-[var(--bk-warning-tint)] tw:px-3 tw:py-2.5 tw:text-[13px] tw:text-[var(--bk-warning-text)]";

/** Board 833:4518: 20px disc, green tick for pass, amber bang otherwise.
 *  The disc is the ONLY thing carrying severity visually, so it carries it in
 *  text too — the row this replaced announced "SEO configured: warning. No
 *  meta title template", and colour alone would have dropped that for anyone
 *  not reading pixels. */
const SR_STATUS: Record<"pass" | "warning" | "fail", string> = {
  pass: "passing",
  warning: "warning",
  fail: "blocking",
};

const CheckIcon: React.FC<{ status: "pass" | "warning" | "fail" }> = ({ status }) => (
  <span
    className={`tw:flex tw:size-5 tw:flex-none tw:items-center tw:justify-center tw:rounded-full tw:text-[11px] tw:font-semibold tw:text-white ${
      status === "pass"
        ? "tw:bg-[var(--bk-success)]"
        : status === "fail"
          ? "tw:bg-[var(--bk-error)]"
          : "tw:bg-[var(--bk-warning)]"
    }`}
  >
    <span aria-hidden="true">{status === "pass" ? "✓" : "!"}</span>
    <span className="tw:sr-only">{SR_STATUS[status]}</span>
  </span>
);

export const PublishWizard: React.FC<PublishWizardProps> = ({
  open,
  onClose,
  onPublish,
  checkState,
  checks,
  onRetryChecks,
  renderFix,
  composer,
  publishedUrl,
  isPublished,
  rollbackTo,
}) => {
  const [step, setStep] = React.useState<Step>("review");

  // Reopening always starts at Review: the checks may have changed since the
  // last time, and landing on Confirm would skip the gate.
  React.useEffect(() => {
    if (open) setStep("review");
  }, [open]);

  const rows = checks?.checks ?? [];
  const blocking = rows.filter((c) => c.status === "fail");
  const warnings = rows.filter((c) => c.status === "warning");
  const blocked = blocking.length > 0;

  const stepper = (
    <div className="tw:flex tw:items-center tw:justify-center tw:gap-2">
      {(["review", "confirm"] as const).map((s, i) => (
        <span
          key={s}
          className={`${STEP_PILL} ${
            step === s
              ? "tw:bg-[var(--bk-accent)] tw:font-medium tw:text-white"
              : "tw:bg-[var(--bk-bg-subtle)] tw:text-[var(--bk-ink-muted)]"
          }`}
        >
          {i + 1}. {s === "review" ? "Review" : "Confirm"}
        </span>
      ))}
    </div>
  );

  return (
    /* Board 833:4518 gives the modal a stepper where a title bar would be —
       so the primitives, not <Modal>, whose title is a plain string. */
    <ModalRoot open={open} onOpenChange={(next) => !next && onClose()}>
      {/* Boards 833:4518 / 914:4507 are 520 wide; "form" (560) is the closest
            size in the shared scale and the one other wizards use. */}
      <ModalContent size="form" srTitle="Publish" className="tw:px-0 tw:py-0">
        <div className="tw:border-b tw:border-[var(--bk-border)] tw:px-6 tw:py-4">{stepper}</div>
      {step === "review" ? (
        <>
          <h2 className="tw:m-0 tw:px-6 tw:pt-1 tw:pb-3 tw:text-[16px] tw:font-semibold tw:text-[var(--bk-ink)]">
            Pre-Publish Checklist
          </h2>

          {checkState === "loading" && (
            <div className="tw:flex tw:items-center tw:gap-2 tw:px-6 tw:py-4 tw:text-[13px] tw:text-[var(--bk-ink-muted)]">
              <Spinner size="sm" aria-label="Checking readiness" />
              Checking readiness…
            </div>
          )}

          {checkState === "error" && (
            <div className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:px-6 tw:py-4 tw:text-[13px]">
              <span>Couldn&apos;t load the readiness checks.</span>
              <Button color="light" size="xs" onClick={onRetryChecks}>
                Retry
              </Button>
            </div>
          )}

          {checkState === "ready" && rows.length === 0 && (
            <p className="tw:m-0 tw:px-6 tw:py-4 tw:text-[13px] tw:text-[var(--bk-ink-muted)]">
              Open this site from the dashboard to see readiness checks.
            </p>
          )}

          {checkState === "ready" &&
            rows.map((c) => (
              <div
                key={c.label}
                className={ROW}
                aria-label={`${c.label}: ${SR_STATUS[c.status]}.${c.status === "pass" ? "" : ` ${c.detail}`}`}
              >
                <CheckIcon status={c.status} />
                <span className="tw:flex-1 tw:text-[14px] tw:text-[var(--bk-ink)]">{c.label}</span>
                {c.status !== "pass" && (
                  <>
                    <span className="tw:text-[13px] tw:text-[var(--bk-warning-text)]">{c.detail}</span>
                    {renderFix?.(c.label)}
                  </>
                )}
              </div>
            ))}

          {checkState === "ready" && rows.length > 0 && (
            <p className={BAND} role={blocked ? "alert" : undefined}>
              {blocked
                ? `⚠ ${blocking.length} blocking — ${blocking.map((c) => c.label).join(", ")}. Fix to publish.`
                : warnings.length > 0
                  ? `⚠ ${warnings.length} warning${warnings.length === 1 ? "" : "s"} — none block. Client approval is a separate gate.`
                  : "All checks pass."}
            </p>
          )}

          <div className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:border-t tw:border-[var(--bk-border)] tw:px-6 tw:py-3">
            <Button color="light" onClick={onClose} className="tw:border-transparent tw:bg-transparent">
              Cancel
            </Button>
            <Button onClick={() => setStep("confirm")} disabled={blocked}>
              Continue to Confirm →
            </Button>
          </div>
        </>
      ) : (
        <>
          <h2 className="tw:m-0 tw:px-6 tw:pt-1 tw:pb-3 tw:text-[16px] tw:font-semibold tw:text-[var(--bk-ink)]">
            Confirm publish
          </h2>

          {/* The four rows are PublishConfirmFacts — the shell's
              PublishConfirmModal renders the same component, so the two ways
              into this board cannot drift apart. It reads the real review
              round; this step used to guess the approval line from the publish
              job's block reason. */}
          <div className="tw:px-6">
            <PublishConfirmFacts
              active={open && step === "confirm"}
              composer={composer}
              publishedUrl={publishedUrl}
              isPublished={isPublished}
              rollbackTo={rollbackTo}
            />
          </div>

          {/* Board 914:4507. The consequence, stated before the irreversible
              button and not after it. */}
          <p className={BAND}>⚠ This replaces the live site immediately for all visitors.</p>

          <div className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:border-t tw:border-[var(--bk-border)] tw:px-6 tw:py-3">
            <Button
              color="light"
              onClick={() => setStep("review")}
              className="tw:border-transparent tw:bg-transparent"
            >
              ← Back
            </Button>
            <Button
              onClick={() => {
                onClose();
                onPublish();
              }}
            >
              Publish now
            </Button>
          </div>
        </>
      )}
      </ModalContent>
    </ModalRoot>
  );
};

export default PublishWizard;
