/**
 * Row pieces the media / embed / widget type blocks share (boards 8–13),
 * where the shared controls have no equivalent (a select with only real
 * choices is the shared SelectRow with `placeholder={null}`):
 *   Note       — the 11px hint line under a field ("Detected: YouTube",
 *                "Uses the visitor's time zone.", missing-alt hint)
 *   Warning    — the full-width tinted warning (board 9 autoplay + sound)
 * plus `useElementVersion`, the re-read on `element:updated` every body needs.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "@/engine";

export function Note({ children, testId }: { children: React.ReactNode; testId?: string }) {
  return (
    <p className="tw:m-0 tw:py-2 tw:text-[length:var(--bk-text-11)] tw:leading-4 tw:text-[var(--bk-ink-muted)]" data-testid={testId}>
      {children}
    </p>
  );
}

/** Full-bleed across the section body (it pads 16 left, 20 right). */
export function Warning({ children, testId }: { children: React.ReactNode; testId?: string }) {
  return (
    <p
      role="status"
      className="tw:-mr-5 tw:-ml-4 tw:mb-0 tw:mt-1 tw:bg-[var(--bk-warning-tint)] tw:px-4 tw:py-2 tw:text-[length:var(--bk-text-11)] tw:leading-4 tw:text-[var(--bk-warning-text)]"
      data-testid={testId}
    >
      {children}
    </p>
  );
}

/** Re-render when any element changes — the rows read the element itself. */
export function useElementVersion(composer: Composer | null | undefined): number {
  const [version, bump] = React.useReducer((n: number) => n + 1, 0);
  React.useEffect(() => {
    if (!composer) return;
    composer.on("element:updated", bump);
    return () => {
      composer.off("element:updated", bump);
    };
  }, [composer]);
  return version;
}
