/**
 * PrePublishChecks — board B3-10 `7574:193972`'s PRE-PUBLISH CHECKS section:
 * the server's readiness rows drawn INLINE in the Publish panel, with the
 * legend "Red = blocks publish · Amber = advisory" under them.
 *
 * The rows were the first step of a two-step wizard (board 833:4518). The
 * 2026-09-21 audit's owner decision moved them into the panel (G1-044: "render
 * checks inline; server list is SSOT") and collapsed the wizard's second step
 * onto the ONE facts confirm both doors open (G1-043). The wizard is gone with
 * it — a surface that is added deletes its predecessor.
 *
 * The list is `runPrePublishChecks`'s, verbatim — never a local approximation.
 * The old local set was a different seven checks with no severity and no
 * Vercel check, so the panel could read all-green while the server
 * hard-refused. The server's six today: Vercel connected · Pages ready · SEO
 * configured · Domain connected · Empty pages · Favicon
 * (`server/services/publish.service.ts`). Whatever it sends is what renders.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Button, Spinner } from "@/editor/chrome-ui";
import type { PrePublishChecksResult } from "@buildrik/shared/schemas/publish";

export type CheckStatus = PrePublishChecksResult["checks"][number]["status"];

/** Board 833:4518: 20px disc, green tick for pass, amber bang otherwise.
 *  The disc is the ONLY thing carrying severity visually, so it carries it in
 *  text too — colour alone would drop it for anyone not reading pixels. */
const SR_STATUS: Record<CheckStatus, string> = {
  pass: "passing",
  warning: "warning",
  fail: "blocking",
};

/* Board B3-10 draws the failing row's disc RED (`Client approval · Blocks
   publish`) and the advisory rows amber — "Red = blocks publish · Amber =
   advisory" is its own legend. The wizard board (893:4518) painted a failing
   Vercel row amber and was flagged for the founder at the time; the newer
   board settles it the way the legend says. */
export const CheckIcon: React.FC<{ status: CheckStatus }> = ({ status }) => (
  <span
    className={`tw:flex tw:size-4 tw:flex-none tw:items-center tw:justify-center tw:rounded-full tw:text-[10px] tw:font-semibold tw:text-white ${
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

/* Board B3-10's row: 28 tall, the disc, the label at 13 ink, the detail at 12
   muted at the far end, then the door. The LABEL never wraps and the DETAIL
   gives way: the server's sentences ("No custom domain. Your site will be
   live on its Vercel URL.") are longer than the board's sample ("No custom
   domain") and, measured live at 280, a flexible label wrapped under the
   detail and the two overprinted. The detail truncates and carries its full
   sentence in `title` and in the row's accessible name. */
export const CHECK_ROW = "tw:flex tw:items-center tw:gap-2 tw:h-7";
export const CHECK_LABEL = "tw:flex-none tw:whitespace-nowrap tw:text-[13px] tw:text-[var(--bk-ink)]";
export const CHECK_DETAIL = "tw:flex-1 tw:min-w-0 tw:truncate tw:text-right tw:text-[12px] tw:text-[var(--bk-ink-muted)]";

const LEGEND = "tw:m-0 tw:mt-1 tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)]";

export interface PrePublishChecksProps {
  state: "loading" | "ready" | "error";
  checks: PrePublishChecksResult | null;
  onRetry(): void;
  /** The door on a non-passing row — Fix › into the editor, or Connect out to
   *  the dashboard. `null` when the editor has nowhere to send the user. */
  renderFix(label: string): React.ReactNode;
  /** The lifecycle's own row (Client approval), drawn with the server's. */
  children?: React.ReactNode;
}

export const PrePublishChecks: React.FC<PrePublishChecksProps> = ({
  state,
  checks,
  onRetry,
  renderFix,
  children,
}) => {
  const rows = checks?.checks ?? [];
  return (
    <div data-testid="publish-checks">
      {state === "loading" && (
        <div className="tw:flex tw:items-center tw:gap-2 tw:py-2 tw:text-[12px] tw:text-[var(--bk-ink-muted)]">
          <Spinner size="sm" aria-label="Checking readiness" />
          Checking readiness…
        </div>
      )}

      {/* DF5: a failed load never reads as passing — Retry, not a green list. */}
      {state === "error" && (
        <div className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:py-2 tw:text-[12px]" role="alert">
          <span className="tw:text-[var(--bk-error-text)]">Couldn&apos;t load the readiness checks.</span>
          <Button color="light" size="xs" onClick={onRetry}>
            Retry
          </Button>
        </div>
      )}

      {state === "ready" && rows.length === 0 && (
        <p className="tw:m-0 tw:py-2 tw:text-[12px] tw:text-[var(--bk-ink-muted)]">
          Open this site from the dashboard to see readiness checks.
        </p>
      )}

      {state === "ready" &&
        rows.map((c) => (
          <div
            key={c.label}
            className={CHECK_ROW}
            aria-label={`${c.label}: ${SR_STATUS[c.status]}.${c.status === "pass" ? "" : ` ${c.detail}`}`}
            data-testid={`publish-check-${c.status}`}
          >
            <CheckIcon status={c.status} />
            <span className={CHECK_LABEL}>{c.label}</span>
            {c.status !== "pass" && (
              <>
                <span className={CHECK_DETAIL} title={c.detail}>
                  {c.detail}
                </span>
                {renderFix(c.label)}
              </>
            )}
          </div>
        ))}

      {children}

      {state === "ready" && (rows.length > 0 || children) ? (
        <p className={LEGEND} data-testid="publish-checks-legend">
          Red = blocks publish · Amber = advisory
        </p>
      ) : null}
    </div>
  );
};

export default PrePublishChecks;
