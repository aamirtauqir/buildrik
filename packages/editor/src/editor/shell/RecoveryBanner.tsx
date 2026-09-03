/**
 * RecoveryBanner (C6) — surfaces the crash sentinel RecoveryManager writes but
 * nothing previously read. The editor has already reloaded the local autosave;
 * this banner tells the user that happened (with a timestamp + how much was
 * recovered) and lets them either keep the recovered work or discard it and
 * reload the server version.
 *
 * It used to say the work was recovered "after an unexpected close". The
 * sentinel records a TIMESTAMP and nothing else, so that was an inference the
 * record cannot support — and at least two things reach this banner: a genuine
 * crash, and an ordinary reload taken while a save was failing. Naming the
 * wrong one is not a cosmetic slip: it invites the user to blame their browser
 * instead of retrying a save that is still broken. The copy now states what is
 * known — that the work was kept on this device, and may not be on the server.
 *
 * Non-binary per the design review: shows WHEN and HOW MUCH, not a bare
 * "Restore?" (the "newer server copy" comparison is a follow-up — it needs a
 * server-updatedAt fetch this banner deliberately doesn't do).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { RecoveryManager } from "@/engine/recovery/RecoveryManager";
import { Button } from "@/editor/chrome-ui";

export interface RecoveryBannerProps {
  /** How many pages the recovered draft holds — the scope of what was kept. */
  pageCount?: number;
  /** Injectable for tests; defaults to a real page reload. */
  reloadFn?: () => void;
}

const LOCAL_DRAFT_KEY = "buildrick-project";

function relTime(at: number): string {
  const s = Math.max(0, Math.round((Date.now() - at) / 1000));
  if (s < 60) return "moments ago";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} minute${m === 1 ? "" : "s"} ago`;
  const h = Math.round(m / 60);
  return `${h} hour${h === 1 ? "" : "s"} ago`;
}

const S: Record<string, React.CSSProperties> = {
  bar: { display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", background: "var(--bk-accent-subtle, #EEF3FC)", borderBottom: "1px solid var(--bk-border)", fontSize: 13, color: "var(--bk-ink)" },
  text: { flex: 1, lineHeight: 1.4 },
  strong: { fontWeight: 600 },
  actions: { display: "flex", alignItems: "center", gap: 8 },
};

export const RecoveryBanner: React.FC<RecoveryBannerProps> = ({ pageCount, reloadFn }) => {
  // Consume once on first render — reading clears the sentinel so a later
  // re-render or reload won't re-surface the same crash.
  const [record] = React.useState(() => RecoveryManager.consumeLastCrash());
  const [dismissed, setDismissed] = React.useState(false);

  if (!record || dismissed) return null;

  const scope = typeof pageCount === "number" ? ` · ${pageCount} page${pageCount === 1 ? "" : "s"}` : "";

  const discard = () => {
    try {
      localStorage.removeItem(LOCAL_DRAFT_KEY);
    } catch {
      /* private-mode / disabled storage — the reload still fetches the server copy */
    }
    (reloadFn ?? (() => window.location.reload()))();
  };

  return (
    <div style={S.bar} role="status" aria-label="Recovered work">
      <div style={S.text}>
        <span style={S.strong}>Recovered your work</span> · {relTime(record.at)}{scope}. It was
        kept on this device, so it may not be on the server yet.
      </div>
      <div style={S.actions}>
        <Button color="light" size="xs" onClick={discard} className="tw:border-transparent tw:bg-transparent tw:text-[var(--bk-ink-soft)] tw:hover:text-[var(--bk-ink)]">Discard &amp; reload</Button>
        <Button size="xs" onClick={() => setDismissed(true)}>Keep changes</Button>
      </div>
    </div>
  );
};

export default RecoveryBanner;
