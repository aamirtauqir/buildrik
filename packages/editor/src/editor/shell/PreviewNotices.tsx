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
  /** Unpublished records the page's collection lists leave out. */
  hiddenDrafts: number;
}

const STRIP_CLASS =
  "tw:m-0 tw:shrink-0 tw:list-none tw:flex tw:flex-wrap tw:gap-x-4 tw:gap-y-1 tw:px-3 tw:py-2 " +
  "tw:bg-[var(--bk-bg-card)] tw:border-b tw:border-[var(--bk-border)]";

const ROW_CLASS =
  "tw:flex tw:items-center tw:gap-1.5 tw:text-[length:var(--bk-text-12)] tw:leading-4 tw:text-[var(--bk-ink-soft)]";

/** An `<img>` with no file: no `src`, or an empty one. */
const EMPTY_IMAGE = /<img\b(?![^>]*\ssrc="[^"]+")[^>]*>/gi;

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Each notice the page earns: an id for tests, and its sentence. */
function previewNotices(html: string, hiddenDrafts: number): Array<{ id: string; text: string }> {
  const out: Array<{ id: string; text: string }> = [];
  if (/<form\b/i.test(html)) {
    out.push({ id: "forms", text: "Forms are shown but don’t submit in preview. They submit on the published site." });
  }
  const emptyImages = html.match(EMPTY_IMAGE)?.length ?? 0;
  if (emptyImages > 0) {
    out.push({
      id: "images",
      text: `${plural(emptyImages, "image has", "images have")} no file chosen, so ${emptyImages === 1 ? "it won’t" : "they won’t"} show on the published site.`,
    });
  }
  if (hiddenDrafts > 0) {
    out.push({
      id: "drafts",
      text: `${plural(hiddenDrafts, "draft item isn’t", "draft items aren’t")} shown. Preview and the published site list published items only.`,
    });
  }
  return out;
}

export const PreviewNotices: React.FC<PreviewNoticesProps> = ({ html, hiddenDrafts }) => {
  const notices = React.useMemo(() => previewNotices(html, hiddenDrafts), [html, hiddenDrafts]);
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
