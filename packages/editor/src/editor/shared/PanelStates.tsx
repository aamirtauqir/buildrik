/**
 * Drawer state blocks shared by the v3 Layers and Pages boards, which draw
 * the same two: loading (4418:83074 / 4418:95114) and load-error (4418:83295 /
 * 4418:94910).
 * Each panel binds its own copy and testIds.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Button, SkeletonBlock } from "@/editor/chrome-ui";

/* Five centred 12px pills on a 24px pitch, widths 232 / 200 / 220 / 176 /
   212 — a list arriving, not a tree drawn in grey. */
const SKELETON_BARS = ["tw:w-[232px]", "tw:w-[200px]", "tw:w-[220px]", "tw:w-[176px]", "tw:w-[212px]"];

export const PanelLoadingSkeleton: React.FC<{ label: string; testId: string; barTestId: string }> = ({ label, testId, barTestId }) => (
  <div className="tw:flex tw:flex-col tw:items-center tw:gap-3 tw:pt-[26px]" data-testid={testId} aria-busy="true" aria-label={label}>
    {SKELETON_BARS.map((w) => (
      <SkeletonBlock key={w} className={`tw:h-3 tw:rounded-full ${w}`} data-testid={barTestId} />
    ))}
  </div>
);
/* A 32px red-tint mark, the failure 14/600, then one 12/18 muted sentence
   that starts with "Try again" — the sentence's first words are the retry. */
export const PanelLoadError: React.FC<{ title: string; rest: string; testId: string; retryTestId: string; onRetry: () => void }> = ({
  title,
  rest,
  testId,
  retryTestId,
  onRetry,
}) => (
  <div className="tw:flex tw:flex-col tw:items-center tw:gap-2 tw:px-6 tw:pt-7 tw:text-center" data-testid={testId} role="alert">
    <span className="tw:flex tw:size-8 tw:items-center tw:justify-center tw:rounded-lg tw:bg-[var(--bk-error-tint)] tw:text-[var(--bk-error-text)]" aria-hidden="true">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0zM12 9v4M12 17h.01" />
      </svg>
    </span>
    <p className="tw:m-0 tw:text-[14px] tw:font-semibold tw:leading-5 tw:text-[var(--bk-ink)]" data-testid={`${testId}-title`}>{title}</p>
    <p className="tw:m-0 tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink-muted)]">
      <Button
        type="button"
        size="xs"
        variant="link"
        className="tw:inline tw:min-h-0 tw:p-0 tw:text-[12px] tw:leading-[18px]"
        data-testid={retryTestId}
        onClick={onRetry}
      >
        Try again
      </Button>{" "}
      {rest}
    </p>
  </div>
);
