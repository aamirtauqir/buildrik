"use client";

import { Tooltip } from "flowbite-react";
import { Info, X } from "lucide-react";
import { Button } from "@/components/dashboard/primitives";

export type PushResultRow = {
  siteId: string;
  name: string;
  status: "pushed" | "skipped-locked" | "skipped-held" | "skipped-version" | "failed";
  error?: string;
};

const RECAPTURE_COPY =
  "This site uses a newer brand format than the captured theme. Re-capture the theme before pushing it again.";

/** The status line under a site's name, in the board's colour for it. */
function Status({ row }: { row: PushResultRow }) {
  const line = "m-0 inline-flex items-center gap-1 text-[12px] leading-[18px]";
  switch (row.status) {
    case "pushed":
      return <p className={`${line} text-[var(--color-success-text)]`} data-testid="push-result-status">Updated</p>;
    case "skipped-held":
      return <p className={`${line} text-[var(--color-warning-text)]`} data-testid="push-result-status">Brand rolled back — skipped</p>;
    case "skipped-version":
      /* The server sends "Brand upgrade is paused…" when the brand switch is
         off for this site, and a format-version message otherwise. */
      return row.error?.startsWith("Brand upgrade is paused") ? (
        <p className={`${line} text-[var(--color-warning-text)]`} data-testid="push-result-status">Brand upgrade paused — skipped</p>
      ) : (
        /* A div: flowbite's Tooltip renders a <div>, which a <p> may not hold. */
        <div className={`${line} text-[var(--color-warning-text)]`} data-testid="push-result-status">
          New brand format — re-capture theme
          <Tooltip
            content={
              <span className="block max-w-[436px] text-left">
                <span className="block text-[13px] font-semibold leading-5">Re-capture required</span>
                <span className="block text-[12px] font-normal leading-[18px]">{RECAPTURE_COPY}</span>
              </span>
            }
            style="light"
            placement="top"
          >
            <Info className="h-3 w-3" aria-label="Why re-capture" />
          </Tooltip>
        </div>
      );
    case "skipped-locked":
      return <p className={`${line} text-[var(--color-text-secondary)]`} data-testid="push-result-status">Locked — kept own</p>;
    default:
      return <p className={`${line} text-[var(--color-error-text)]`} title={row.error} data-testid="push-result-status">Failed</p>;
  }
}

/**
 * The per-site result of a theme push, built to BRP1-M4 (8222:233199): a card
 * titled "Push results", the theme and site count under it, then one subtle
 * plate per site — its name over its status. Undo lives on the site rows
 * below, not here: this list is client state and the snapshot behind an undo
 * is a DB row that outlives it.
 */
export function PushResults({ rows, onDismiss }: { rows: readonly PushResultRow[]; onDismiss: () => void }) {
  return (
    <section
      className="flex w-full max-w-[620px] flex-col gap-3 rounded-sm border border-[var(--color-border-default)] bg-white p-4"
      data-testid="push-results"
    >
      <div className="flex items-center justify-between gap-4">
        <h3 className="m-0 text-[20px] font-semibold leading-[30px] tracking-[-0.24px] text-[var(--color-text-primary)]">
          Push results
        </h3>
        <Button variant="ghost" size="sm" onClick={onDismiss} aria-label="Dismiss push results">
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
      <p className="m-0 text-[12px] leading-[18px] text-[var(--color-text-secondary)]">
        Shared theme · {rows.length} site{rows.length === 1 ? "" : "s"}
      </p>
      {rows.map((r) => (
        <div key={r.siteId} className="flex flex-col gap-2 bg-[var(--color-bg-subtle)] p-3" data-testid={`push-result-${r.siteId}`}>
          <p className="m-0 text-[13px] font-semibold leading-5 text-[var(--color-text-primary)]">{r.name}</p>
          <Status row={r} />
        </div>
      ))}
    </section>
  );
}
