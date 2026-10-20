/**
 * PreviewNotices — what the preview shows differently from the live site, and
 * why, in a strip under the preview's bar (REA #18).
 *
 * The preview is the published page (renderPreviewHtml), but a few things
 * cannot or should not happen in it. Each used to be a silent gap the user had
 * to guess at; each is now named here, and only when the page has it.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Info } from "lucide-react";

interface PreviewNoticesProps {
  /** The sanitized page the frame renders. */
  html: string;
}

const STRIP_CLASS =
  "tw:m-0 tw:shrink-0 tw:list-none tw:flex tw:flex-wrap tw:gap-x-4 tw:gap-y-1 tw:px-3 tw:py-2 " +
  "tw:bg-[var(--bk-bg-card)] tw:border-b tw:border-[var(--bk-border)]";

const ROW_CLASS =
  "tw:flex tw:items-center tw:gap-1.5 tw:text-[length:var(--bk-text-12)] tw:leading-4 tw:text-[var(--bk-ink-soft)]";

/** Each notice the page earns: an id for tests, and its sentence. */
function previewNotices(html: string): Array<{ id: string; text: string }> {
  const out: Array<{ id: string; text: string }> = [];
  if (/<form\b/i.test(html)) {
    out.push({ id: "forms", text: "Forms are shown but don’t submit in preview. They submit on the published site." });
  }
  return out;
}

export const PreviewNotices: React.FC<PreviewNoticesProps> = ({ html }) => {
  const notices = React.useMemo(() => previewNotices(html), [html]);
  if (notices.length === 0) return null;
  return (
    <ul className={STRIP_CLASS} data-testid="preview-notices" aria-label="Preview notes">
      {notices.map((n) => (
        <li key={n.id} className={ROW_CLASS} data-testid={`preview-notice-${n.id}`}>
          <Info size={14} aria-hidden="true" />
          {n.text}
        </li>
      ))}
    </ul>
  );
};
