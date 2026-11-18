/**
 * RestorePointsSection — Brand's "Restore points ▾" popover (2L9 B6-B39;
 * states from BRP1-M10):
 *
 *   list      "Restore points", one row per point: what it was taken before
 *             ("Before import") and when ("Today 14:12"), Restore
 *   8224:245178  empty     "No restore points yet" and what makes one
 *   8224:245787  restored  the list, plus the receipt "Restored “<point>”." with Undo (the one undo)
 *
 * Restore is `useBrandRestorePoints().restore` — the point's tokens (migrated,
 * laid over the seed, in-use tokens kept) and its Dark mode in ONE
 * transaction, so one ⌘Z re-applies what was there. Guarded: a double click
 * restores once. Saved designPresets are not re-applied (no 1c flow changes
 * them).
 *
 * Copy departures, both because the code cannot do what the board says:
 * there are no `connect` restore points (1b OQ-4), so the board's "Connect to
 * tokens" row has no label here and the empty line does not name "token
 * connection".
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine/Composer";
import { Button } from "@/editor/chrome-ui";
import { useBrandRestorePoints } from "@/editor/design-system/state/useBrandRestorePoints";
import { useGuardedApply } from "@/editor/design-system/state/useGuardedApply";
import { NOTICE, SMALL_ACTION } from "./UsageHighlight";
import { CARD, COPY, TITLE } from "./ConnectTokensCheck";

/** What a point was taken before, as B6-B39 writes it. Unknown reasons read "Brand change". */
const RESTORE_REASON_LABEL: Record<string, string> = {
  "theme-push": "Before theme push",
  migration: "Before brand upgrade",
  generator: "Before generate scale",
  "dark-auto": "Before dark mode Auto",
  logo: "Before from logo or URL",
  starter: "Before starter",
  import: "Before import",
};
const pad = (n: number) => String(n).padStart(2, "0");

/** "Today 14:32" · "Yesterday 16:40" · "6 Oct 09:15" (local time, B6-B39). */
export function restorePointTime(at: Date, now: Date = new Date()): string {
  const day = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diff = Math.round((day(now) - day(at)) / 86_400_000);
  const time = `${pad(at.getHours())}:${pad(at.getMinutes())}`;
  if (diff === 0) return `Today ${time}`;
  if (diff === 1) return `Yesterday ${time}`;
  return `${at.getDate()} ${at.toLocaleString("en-GB", { month: "short" })} ${time}`;
}

export interface RestorePointsSectionProps {
  composer: Composer | null | undefined;
  /** After a point is restored — the workspace's receipt, given the point's label. */
  onRestored?: (label: string) => void;
  /** A refused or failed restore — nothing was changed. */
  onFailed?: () => void;
}

export const RestorePointsSection: React.FC<RestorePointsSectionProps> = ({ composer, onRestored, onFailed }) => {
  const points = useBrandRestorePoints(composer ?? null);
  const guard = useGuardedApply();
  const restore = (id: string) =>
    guard.run(async () => {
      const result = await points.restore(id);
      if (result === "restored") {
        const reason = points.rows.find((r) => r.id === id)?.reason ?? "";
        onRestored?.(RESTORE_REASON_LABEL[reason] ?? "Brand change");
        points.refresh();
        return true;
      }
      onFailed?.();
      return false;
    });

  return (
    <section aria-label="Brand restore points" className={CARD} data-testid="brand-restore-points" data-restore-state={points.status}>
      <p className={TITLE}>Restore points</p>
      <p className={COPY}>Restoring replaces Brand values with the saved checkpoint. It is one step you can undo.</p>
      {points.status === "error" ? (
        <>
          <p className={`${NOTICE} tw:w-full tw:bg-[var(--bk-error-tint)]`} role="alert" data-testid="brand-restore-load-error">
            Restore points couldn't be loaded.
          </p>
          <Button type="button" variant="secondary" size="xs" className={`${SMALL_ACTION} tw:text-[var(--bk-gray-700)]`} onClick={points.refresh}>
            Retry
          </Button>
        </>
      ) : points.status === "ready" && points.rows.length === 0 ? (
        <>
          <p className={TITLE} data-testid="brand-restore-empty">No restore points yet</p>
          <p className={COPY}>A restore point is created before a theme push, generator, switch to Auto dark mode, starter, import or logo import.</p>
        </>
      ) : (
        <ul className="tw:m-0 tw:flex tw:w-full tw:list-none tw:flex-col tw:gap-3 tw:p-0" aria-busy={points.status === "loading" || undefined}>
          {points.rows.map((row) => (
            <li key={row.id} className="tw:flex tw:items-center tw:gap-2" data-testid={`brand-restore-row-${row.id}`} data-reason={row.reason}>
              {/* 8224:244521: the text column is 480 wide, Restore 8 after it. */}
              <div className="tw:flex tw:w-[480px] tw:min-w-0 tw:flex-col tw:gap-1">
                <span className="tw:text-[length:var(--bk-text-13)] tw:font-semibold tw:leading-5 tw:text-[var(--bk-ink)]">
                  {RESTORE_REASON_LABEL[row.reason] ?? "Brand change"}
                </span>
                <span className="tw:text-[length:var(--bk-text-12)] tw:leading-[18px] tw:text-[var(--bk-ink-muted)]">
                  {restorePointTime(new Date(row.createdAt))}
                </span>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="xs"
                className={`${SMALL_ACTION} tw:text-[var(--bk-gray-700)]`}
                disabled={guard.busy}
                onClick={() => void restore(row.id)}
                data-testid={`brand-restore-${row.id}`}
              >
                Restore
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
