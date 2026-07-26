/**
 * RecoveryBanner (C6) — surfaces the crash sentinel RecoveryManager writes but
 * nothing previously read. On reopen after an unexpected close, the editor has
 * already reloaded the local autosave; this banner tells the user that happened
 * (with a timestamp + how much was recovered) and lets them either keep the
 * recovered work or discard it and reload the server version.
 *
 * Non-binary per the design review: shows WHEN and HOW MUCH, not a bare
 * "Restore?" (the "newer server copy" comparison is a follow-up — it needs a
 * server-updatedAt fetch this banner deliberately doesn't do).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button } from "@/editor/ui";
import { RecoveryManager } from "@/engine/recovery/RecoveryManager";

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
        <span style={S.strong}>Recovered your work</span> after an unexpected close · {relTime(record.at)}{scope}.
      </div>
      <div style={S.actions}>
        <Button kind="ghost" size="sm" onClick={discard}>Discard &amp; reload</Button>
        <Button kind="primary" size="sm" onClick={() => setDismissed(true)}>Keep changes</Button>
      </div>
    </div>
  );
};

export default RecoveryBanner;
