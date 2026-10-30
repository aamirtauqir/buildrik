/**
 * The publish tray's run and outcome sections — boards B8-PB07 `233:3648`
 * (publishing, step 2 of 3), PB08 `233:4197` (queued), PB09 `233:4748`
 * (published), PB10 `233:5303` (failed), PB12 `233:6396` (lost track),
 * PB14 `233:7488` (simulation) and PB23 `233:12491` (checks loading).
 *
 * Every outcome is drawn the same way: the status card stays on top, then one
 * tinted sentence, then its doors in a row (an outlined button and links).
 * The footer CTA is gone in these states — the outcome's own button is the
 * one thing to press.
 *
 * Steps are the worker's own (`buildSteps`, workers/publish route): the names
 * and their order come from the server, and a step the MVP never runs
 * reports `skipped` — it is not listed and not counted.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Button, CopyButton, Modal, SkeletonBlock } from "@/editor/chrome-ui";
import type { PublishStep } from "@/services/PublishService";
import type { PublishPreview } from "@/editor/sidebar/tabs/publish/usePublishPreviewDiff";

const BODY = "tw:m-0 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)]";
const META = "tw:m-0 tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-muted)]";
const HEAD = "tw:m-0 tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-[0.04em] tw:text-[var(--bk-ink-muted)]";
const LINK_BTN =
  "tw:h-8 tw:w-auto tw:border-transparent tw:bg-transparent tw:px-0 tw:text-[13px] tw:font-normal tw:text-[var(--bk-accent)] tw:hover:bg-transparent tw:hover:underline";
/** The outcome's own button — outlined, 32 tall (PB09 View live, PB10 Try again, PB12 Check status). */
export const OUTCOME_BTN = "tw:h-8 tw:px-3 tw:text-[13px] tw:font-normal";

/* ── Steps ───────────────────────────────────────────────────────────────── */

/** What the worker actually runs, in its order. */
export function runSteps(steps: PublishStep[] | null | undefined): PublishStep[] {
  return (steps ?? []).filter((s) => s.status !== "skipped");
}

const isActive = (s: PublishStep) => s.status === "active" || s.status === "running";

/** Where the run is: the 1-based index of the running step among the steps
 *  that run, and how many there are. `null` before the worker writes any. */
function runPosition(steps: PublishStep[] | null | undefined): { index: number; total: number; name: string } | null {
  const shown = runSteps(steps);
  if (shown.length === 0) return null;
  const i = shown.findIndex(isActive);
  if (i < 0) return null;
  return { index: i + 1, total: shown.length, name: shown[i].name };
}

/** The topbar's run label (PB07 "Publishing 2/3…" while step 2 runs): the
 *  running step's number, else how many are done. "Publishing…" until the
 *  worker reports any. */
export function runLabel(steps: PublishStep[] | null | undefined): string {
  const shown = runSteps(steps);
  if (shown.length === 0) return "Publishing…";
  const at = runPosition(steps)?.index ?? shown.filter((s) => s.status === "done").length;
  return `Publishing ${at}/${shown.length}…`;
}

const Glyph: React.FC<{ step: PublishStep }> = ({ step }) => (
  <span aria-hidden="true" className="tw:inline-flex tw:w-3 tw:flex-none tw:justify-center tw:text-[12px]">
    {step.status === "done" ? "✓" : isActive(step) ? "●" : "○"}
  </span>
);

/** PB07 / PB08: the run, step by step. A job the worker has not picked up
 *  yet has no steps — it is queued, and says so. */
/** "0:42" — minutes and seconds since the job began, ticking. */
function useElapsed(since: string | null): string | null {
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    if (!since) return undefined;
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [since]);
  const start = since ? Date.parse(since) : NaN;
  if (!Number.isFinite(start)) return null;
  const secs = Math.max(0, Math.floor((now - start) / 1000));
  return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
}

export const RunSection: React.FC<{ steps: PublishStep[] | null; startedAt?: string | null }> = ({ steps, startedAt = null }) => {
  const shown = runSteps(steps);
  const pos = runPosition(steps);
  const elapsed = useElapsed(startedAt);
  /* Queued: the worker has written the steps (all pending) but none runs yet. */
  const queued = shown.length === 0 || shown.every((s) => s.status === "pending");
  return (
    <section className="tw:flex tw:flex-col tw:gap-1.5 tw:px-3 tw:pt-3.5" aria-label="Publishing" data-testid="publish-tray-run">
      <h3 className={HEAD}>Publishing</h3>
      <ol className="tw:m-0 tw:flex tw:list-none tw:flex-col tw:gap-1.5 tw:p-0" role="status">
        {queued ? (
          <li className={`${BODY} tw:flex tw:items-center tw:gap-2`} data-testid="publish-tray-queued">
            <span aria-hidden="true" className="tw:inline-flex tw:w-3 tw:justify-center tw:text-[12px]">●</span>
            Queued — waiting to start
          </li>
        ) : null}
        {shown.map((s, i) => (
            <li
              key={s.name}
              className={`tw:flex tw:items-center tw:gap-2 tw:text-[13px] tw:leading-5 ${
                s.status === "pending" ? "tw:text-[var(--bk-ink-muted)]" : "tw:text-[var(--bk-ink)]"
              } ${isActive(s) ? "tw:font-medium" : ""}`}
              data-status={s.status}
            >
              <Glyph step={s} />
              {s.name}
              {pos && pos.index === i + 1 ? ` · step ${pos.index} of ${pos.total}` : ""}
            </li>
          ))}
      </ol>
      {elapsed ? (
        <p className={META} data-testid="publish-tray-elapsed">
          Elapsed {elapsed}
        </p>
      ) : null}
    </section>
  );
};

/* ── Outcomes ────────────────────────────────────────────────────────────── */

type OutcomeTone = "neutral" | "success" | "warning" | "error";

const TONE: Record<OutcomeTone, string> = {
  neutral: "tw:bg-[var(--bk-bg-subtle)] tw:text-[var(--bk-ink)]",
  success: "tw:bg-[var(--bk-success-tint)] tw:text-[var(--bk-success-text)]",
  warning: "tw:bg-[var(--bk-warning-tint)] tw:text-[var(--bk-warning-text)]",
  error: "tw:bg-[var(--bk-error-tint)] tw:text-[var(--bk-error-text)]",
};

/** The one tinted sentence an outcome is (PB09 green, PB10 red, PB12 amber,
 *  PB11/PB14 grey), with its doors in a row under it. */
export const OutcomeNote: React.FC<{
  tone: OutcomeTone;
  role?: "status" | "alert";
  testId?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}> = ({ tone, role, testId, children, actions }) => (
  <div className="tw:mx-3 tw:mt-3" data-testid={testId}>
    <p className={`tw:m-0 tw:rounded-[var(--bk-radius-sm)] tw:px-1.5 tw:py-1 tw:text-[12px] tw:leading-[18px] ${TONE[tone]}`} role={role}>
      {children}
    </p>
    {actions ? <div className="tw:mt-2 tw:flex tw:items-center tw:gap-4">{actions}</div> : null}
  </div>
);

/** PB09: "View live ↗" (outlined), "Copy link", and "See what changed" when
 *  the previous version can be compared with this one. */
export const PublishedActions: React.FC<{ url: string; onSeeWhatChanged?: () => void }> = ({ url, onSeeWhatChanged }) => (
  <>
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="tw:inline-flex tw:h-8 tw:items-center tw:rounded-[var(--bk-radius-md)] tw:border tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-panel)] tw:px-3 tw:text-[13px] tw:text-[var(--bk-ink)] tw:no-underline tw:hover:bg-[var(--bk-bg-subtle)]"
      data-testid="publish-tray-view-live"
    >
      View live ↗
    </a>
    <CopyButton content={url} label="Copy link" variant="ghost" />
    {onSeeWhatChanged ? (
      <Button color="light" size="xs" className={LINK_BTN} onClick={onSeeWhatChanged} data-testid="publish-tray-see-changes">
        See what changed
      </Button>
    ) : null}
  </>
);

/** PB10 "View log": the failed job's own steps and ids — what support asks for. */
export const FailedLog: React.FC<{ steps: PublishStep[] | null; jobId: string | null; deploymentId: string | null }> = ({
  steps,
  jobId,
  deploymentId,
}) => {
  const ID = "tw:font-[family-name:var(--bk-font-mono)] tw:tabular-nums tw:text-[11px] tw:text-[var(--bk-ink-soft)]";
  return (
    <div className="tw:mx-3 tw:mt-3 tw:flex tw:flex-col tw:gap-1" data-testid="publish-tray-log">
      {runSteps(steps).map((s) => (
        <p key={s.name} className={META}>
          {s.name} · {s.status}
        </p>
      ))}
      <dl className="tw:m-0 tw:mt-1 tw:grid tw:grid-cols-[auto_1fr] tw:gap-x-2 tw:gap-y-0.5">
        {jobId ? (
          <>
            <dt className={META}>Job</dt>
            <dd className={`tw:m-0 ${ID}`} data-testid="publish-tray-job-id">{jobId}</dd>
          </>
        ) : null}
        {deploymentId ? (
          <>
            <dt className={META}>Deployment</dt>
            <dd className={`tw:m-0 ${ID}`} data-testid="publish-tray-deployment-id">{deploymentId}</dd>
          </>
        ) : null}
      </dl>
    </div>
  );
};

/** B8-PB01–PB03 / PB21 "WHAT WILL CHANGE" (A-33): the counts against the
 *  live version, a chip per page (✎ changed · + added · − removed), the CMS
 *  records published since, and "See all ›" into the one Compare. Without a
 *  comparison (loading, no site, pruned payload) the plain sentence stays. */
export const ChangesSection: React.FC<{
  preview: PublishPreview | null;
  fallback: string;
  pageNames: string[];
  onSeeAll?: () => void;
}> = ({ preview, fallback, pageNames, onSeeAll }) => {
  const d = preview?.diff;
  const counted = d && d.retained;
  const glyph = { changed: "✎", added: "+", removed: "−" } as const;
  return (
    <section className="tw:flex tw:flex-col tw:gap-1.5 tw:px-3 tw:pt-3.5" aria-label="What will change">
      <div className="tw:flex tw:items-baseline tw:justify-between">
        <h3 className={HEAD}>What will change</h3>
        {onSeeAll ? (
          <Button color="light" size="xs" className={`${LINK_BTN} tw:h-5 tw:text-[12px] tw:text-[var(--bk-ink-muted)]`} onClick={onSeeAll} data-testid="publish-tray-see-all">
            See all ›
          </Button>
        ) : null}
      </div>
      {counted ? (
        <>
          <p className={`${BODY} tw:font-medium`} data-testid="publish-tray-changes">
            {d.changed} page{d.changed === 1 ? "" : "s"} changed · {d.added} added · {d.removed} removed
          </p>
          {preview.changes.length > 0 ? (
            <p className="tw:m-0 tw:flex tw:flex-wrap tw:gap-x-3 tw:gap-y-1 tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-muted)]" data-testid="publish-tray-change-chips">
              {preview.changes.map((c) => (
                <span key={`${c.change}-${c.name}`}>
                  <span aria-hidden="true">{glyph[c.change]} </span>
                  <span className="tw:sr-only">{c.change} </span>
                  {c.name}
                </span>
              ))}
            </p>
          ) : null}
          {d.cmsRecords > 0 ? (
            <p className={META} data-testid="publish-tray-cms-count">
              CMS: {d.cmsRecords} record{d.cmsRecords === 1 ? "" : "s"} published
            </p>
          ) : null}
        </>
      ) : (
        <>
          <p className={BODY} data-testid="publish-tray-changes">
            {fallback}
          </p>
          {pageNames.length > 0 ? <p className={META}>{pageNames.join(" · ")}</p> : null}
        </>
      )}
    </section>
  );
};

/**
 * B8-PB16 / PB17 (A-36): a password kept on a plan without password
 * protection. The card states it; its two ways out are Upgrade ↗ and
 * "Remove protection and publish…", which asks first (PB17) and then clears
 * the password (siteDetail.settings.update — clearing is allowed on every
 * plan) before the publish door opens.
 */
export const PasswordCheckCard: React.FC<{
  detail: string;
  domain: string | null;
  onUpgrade: () => void;
  onRemoveAndPublish: () => Promise<void>;
}> = ({ detail, domain, onUpgrade, onRemoveAndPublish }) => {
  const [asking, setAsking] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  return (
    <div className="tw:my-1 tw:rounded-[var(--bk-radius-sm)] tw:bg-[var(--bk-error-tint)] tw:p-2" data-testid="publish-check-password">
      <p className="tw:m-0 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-error-text)]">
        <span aria-hidden="true">✕ </span>
        {detail}
      </p>
      <div className="tw:mt-2 tw:flex tw:items-center tw:gap-2">
        <Button variant="secondary" size="xs" className={OUTCOME_BTN} onClick={onUpgrade} data-testid="publish-check-password-upgrade">
          Upgrade ↗
        </Button>
        <Button color="light" size="xs" className={LINK_BTN} onClick={() => setAsking(true)} data-testid="publish-check-password-remove">
          Remove protection and publish…
        </Button>
      </div>
      {asking ? (
        <Modal
          open
          onClose={() => !busy && setAsking(false)}
          title="Remove password protection and publish?"
          kind="question"
          width="sm"
          testId="publish-remove-protection"
          footer={
            <>
              <Button variant="secondary" disabled={busy} onClick={() => setAsking(false)}>
                Cancel
              </Button>
              <Button
                disabled={busy}
                data-testid="publish-remove-protection-confirm"
                onClick={() => {
                  setBusy(true);
                  setFailed(false);
                  onRemoveAndPublish()
                    .then(() => setAsking(false))
                    .catch(() => setFailed(true))
                    .finally(() => setBusy(false));
                }}
              >
                {busy ? "Removing…" : "Remove and publish"}
              </Button>
            </>
          }
        >
          <p className="tw:m-0 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)]">
            {domain ?? "This site"} becomes public. You can add protection again on Pro.
          </p>
          {failed ? (
            <p className="tw:m-0 tw:mt-2 tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-error-text)]" role="alert">
              Couldn’t remove the protection. Nothing was published.
            </p>
          ) : null}
        </Modal>
      ) : null}
    </div>
  );
};

/** PB23: nothing actionable while readiness is unknown — the card and the
 *  rows as placeholders, the CTA shut with "Checking…". */
export const TraySkeleton: React.FC = () => (
  <div className="tw:flex tw:flex-col tw:gap-3 tw:p-3" aria-busy="true" aria-label="Checking readiness" data-testid="publish-tray-skeleton">
    <SkeletonBlock className="tw:h-[70px] tw:w-full tw:rounded-[var(--bk-radius-lg)]" />
    {[0, 1, 2, 3].map((i) => (
      <SkeletonBlock key={i} className="tw:h-[25px] tw:w-full" />
    ))}
  </div>
);

