/**
 * What changed between two published versions, page by page.
 *
 * "Compare v3 → v4" only ever switched to the History tab. No version-content
 * diff existed anywhere in the codebase, so a user saw WHEN two versions
 * shipped and never WHAT changed. The server diffs the retained deploy
 * payloads — the content that actually went live — and returns paths, change
 * kinds and sizes; the HTML never leaves it.
 *
 * Page-level on purpose: a client does not read a line diff of generated
 * HTML. "Pricing changed, About was added" answers the question they asked.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Button, SkeletonBlock } from "@/editor/chrome-ui";
import { fetchPublishDiff, type PublishDiff, type PublishPageChange } from "../../services/PublishService";

export interface PublishDiffViewProps {
  siteId: string;
  from: { id: string; version: number };
  to: { id: string; version: number };
  onBack: () => void;
}

const BADGE: Record<PublishPageChange, { label: string; cls: string }> = {
  added: { label: "Added", cls: "tw:text-[var(--bk-success-text)] tw:bg-[var(--bk-success-tint)]" },
  removed: { label: "Removed", cls: "tw:text-[var(--bk-error)] tw:bg-[var(--bk-error-tint)]" },
  changed: { label: "Changed", cls: "tw:text-[var(--bk-accent)] tw:bg-[var(--bk-accent-tint)]" },
  same: { label: "Unchanged", cls: "tw:text-[var(--bk-ink-muted)] tw:bg-[var(--bk-bg-subtle)]" },
};

const kb = (n: number | null) => (n === null ? "—" : `${(n / 1024).toFixed(1)} KB`);

export const PublishDiffView: React.FC<PublishDiffViewProps> = ({ siteId, from, to, onBack }) => {
  const [state, setState] = React.useState<"loading" | "ready" | "error">("loading");
  const [diff, setDiff] = React.useState<PublishDiff | null>(null);
  const [retry, setRetry] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    setState("loading");
    fetchPublishDiff(siteId, from.id, to.id)
      .then((d) => { if (!cancelled) { setDiff(d); setState("ready"); } })
      .catch(() => { if (!cancelled) setState("error"); });
    return () => { cancelled = true; };
  }, [siteId, from.id, to.id, retry]);

  const title = `v${from.version} → v${to.version}`;
  return (
    <div className="tw:flex tw:flex-col tw:gap-2" data-testid="publish-diff" aria-label={`Compare ${title}`}>
      <div className="tw:flex tw:items-center tw:justify-between">
        <Button color="light" size="xs" onClick={onBack} className="tw:border-transparent tw:bg-transparent tw:p-0 tw:text-[13px] tw:text-[var(--bk-ink-soft)]">
          ‹ Versions
        </Button>
        <span className="tw:text-[13px] tw:font-medium tw:text-[var(--bk-ink)]">{title}</span>
      </div>

      {state === "loading" && <SkeletonBlock className="tw:h-16 tw:w-full" />}

      {state === "error" && (
        <div role="alert" className="tw:text-[12px] tw:text-[var(--bk-error)]">
          Couldn’t compare these versions.{" "}
          <Button color="light" size="xs" onClick={() => setRetry((n) => n + 1)} className="tw:border-transparent tw:bg-transparent tw:p-0 tw:text-[12px] tw:text-[var(--bk-accent)]">
            Try again
          </Button>
        </div>
      )}

      {state === "ready" && diff && !diff.retained && (
        /* The payload is pruned past the retained window. Saying so is the
           only honest answer — an empty page list would read as "nothing
           changed", which is a different claim. */
        <p className="tw:m-0 tw:text-[12px] tw:text-[var(--bk-ink-soft)]">
          One of these versions is older than the {""}kept window, so its content is no longer stored and there is nothing to compare.
        </p>
      )}

      {state === "ready" && diff && diff.retained && (
        <>
          <p className="tw:m-0 tw:text-[12px] tw:text-[var(--bk-ink-soft)]" data-testid="publish-diff-summary">
            {diff.changed} changed · {diff.added} added · {diff.removed} removed · {diff.pages.length - diff.changed - diff.added - diff.removed} unchanged
          </p>
          <ul className="tw:m-0 tw:flex tw:list-none tw:flex-col tw:gap-1 tw:p-0">
            {diff.pages.map((p) => (
              <li key={p.path} className="tw:flex tw:items-center tw:justify-between tw:gap-2 tw:text-[12px]" data-change={p.change}>
                <span className="tw:min-w-0 tw:truncate tw:text-[var(--bk-ink)]">{p.path}</span>
                <span className="tw:flex tw:shrink-0 tw:items-center tw:gap-2">
                  <span className="tw:text-[var(--bk-ink-muted)] tw:[font-family:var(--bk-font-mono)] tw:tabular-nums">
                    {p.change === "changed" ? `${kb(p.fromBytes)} → ${kb(p.toBytes)}` : kb(p.toBytes ?? p.fromBytes)}
                  </span>
                  <span className={`tw:rounded-sm tw:px-1.5 tw:py-0.5 tw:text-[11px] tw:font-medium ${BADGE[p.change].cls}`}>
                    {BADGE[p.change].label}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};
