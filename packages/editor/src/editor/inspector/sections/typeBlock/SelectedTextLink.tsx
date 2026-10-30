/**
 * SelectedTextLink — 2L9 TX07 (423:98884): while the element's text is being
 * edited on the canvas and the caret or selection sits in a link, the
 * Content tab names that link:
 *
 *   Selected text link
 *   https://fieldwork.studio/work
 *   The link is part of the current text edit. Done or Escape commits this
 *   text transaction.
 *
 * Read from the real link: the `<a href>` around the document selection,
 * inside this element's canvas node while it is contentEditable (the inline
 * edit — useCanvasInlineEdit). Follows `selectionchange`.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { GROUP_TITLE } from "@/editor/inspector/shared/controls/controlClasses";

interface SelectedLink {
  href: string;
  newTab: boolean;
}

function readSelectedLink(elementId: string): SelectedLink | null {
  const node = document.querySelector(`[data-buildrick-id="${elementId}"]`);
  if (!(node instanceof HTMLElement) || node.contentEditable !== "true") return null;
  const anchorNode = document.getSelection()?.anchorNode ?? null;
  const from = anchorNode instanceof Element ? anchorNode : anchorNode?.parentElement;
  const link = from?.closest("a[href]");
  if (!link || !node.contains(link)) return null;
  return { href: link.getAttribute("href") ?? "", newTab: link.getAttribute("target") === "_blank" };
}

export function SelectedTextLink({ elementId }: { elementId: string }) {
  const [link, setLink] = React.useState<SelectedLink | null>(() => readSelectedLink(elementId));
  React.useEffect(() => {
    const read = () => setLink(readSelectedLink(elementId));
    read();
    document.addEventListener("selectionchange", read);
    return () => document.removeEventListener("selectionchange", read);
  }, [elementId]);
  if (!link) return null;
  return (
    <div className="tw:flex tw:flex-col tw:gap-1 tw:pt-3" role="status" data-testid="inspector-selected-text-link">
      <div className={GROUP_TITLE}>Selected text link</div>
      <p className="tw:m-0 tw:break-all tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-soft)]" data-testid="inspector-selected-text-link-href">
        {link.href}
        {link.newTab ? " · opens in a new tab" : ""}
      </p>
      <p className="tw:m-0 tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-muted)]">
        The link is part of the current text edit. Done or Escape commits this text transaction.
      </p>
    </div>
  );
}
