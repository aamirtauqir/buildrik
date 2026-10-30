/**
 * BulkDeleteResult — the card above the Pages list after a bulk delete that
 * did not delete everything it was asked to (boards 139:48427 / 139:49184 /
 * 139:49899): a title, one line per page, and a retry for refused pages.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Button } from "@/editor/chrome-ui";
import type { BulkDeleteReport } from "../useBulkDelete";

export function BulkDeleteResult({ report, onRetry }: { report: BulkDeleteReport; onRetry: () => void }) {
  return (
    <div className="tw:mx-3 tw:mt-2 tw:shrink-0 tw:rounded-md tw:bg-[var(--bk-gray-100)] tw:px-2 tw:py-3" role="status" data-testid="pages-bulk-result">
      <p className="tw:m-0 tw:text-[12px] tw:leading-4 tw:font-semibold tw:text-[var(--bk-ink)]" data-testid="pages-bulk-result-title">
        {report.title}
      </p>
      {report.lines.map((l) => (
        <p
          key={`${l.name}-${l.text}`}
          className={`tw:m-0 tw:mt-2 tw:text-[12px] tw:leading-4 ${l.error ? "tw:text-[var(--bk-error-text)]" : "tw:text-[var(--bk-ink-muted)]"}`}
        >
          {`${l.name} — ${l.text}`}
        </p>
      ))}
      {report.retry && (
        <Button color="light" size="xs" className="tw:mt-3 tw:h-8 tw:min-h-0 tw:px-6 tw:text-[13px]" data-testid="pages-bulk-retry" onClick={onRetry}>
          {report.retry.label}
        </Button>
      )}
    </div>
  );
}
