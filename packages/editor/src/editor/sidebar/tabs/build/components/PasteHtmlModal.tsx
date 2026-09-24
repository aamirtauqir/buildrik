/**
 * PasteHtmlModal — board 6887:78320 (G2-112).
 *
 * Add ⋯ › Paste HTML… used to read the clipboard and insert straight away,
 * sanitising silently. The board shows the markup first, lets it be edited,
 * and says what sanitising will strip. Sanitising itself is unchanged — it
 * still happens on the insert path (useBlockInsertion → insertBlock).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { BK_LABEL_CLASS, Button, Label, Modal, Textarea } from "@/editor/chrome-ui";

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** "2 <script> tags and 1 event handler will be removed", or null. */
export function describeStrip(html: string): string | null {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const scripts = doc.querySelectorAll("script").length;
  let handlers = 0;
  for (const el of doc.querySelectorAll("*")) {
    for (const attr of el.attributes) if (/^on/i.test(attr.name)) handlers++;
  }
  const parts = [
    scripts ? plural(scripts, "<script> tag", "<script> tags") : "",
    handlers ? plural(handlers, "event handler", "event handlers") : "",
  ].filter(Boolean);
  return parts.length ? `${parts.join(" and ")} will be removed` : null;
}

interface PasteHtmlModalProps {
  open: boolean;
  /** The clipboard's text when it was readable, else "". */
  initialHtml: string;
  onClose: () => void;
  onInsert: (html: string) => void;
}

export const PasteHtmlModal: React.FC<PasteHtmlModalProps> = ({ open, initialHtml, onClose, onInsert }) => {
  const [html, setHtml] = React.useState(initialHtml);
  React.useEffect(() => {
    if (open) setHtml(initialHtml);
  }, [open, initialHtml]);
  const strip = React.useMemo(() => describeStrip(html), [html]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Paste HTML"
      subtitle="Pasted markup is sanitised before it reaches the canvas — scripts and event handlers are stripped."
      testId="paste-html-modal"
      footer={
        <>
          <Button color="light" size="xs" data-testid="paste-html-cancel" onClick={onClose}>
            Cancel
          </Button>
          <Button size="xs" data-testid="paste-html-insert" disabled={!html.trim()} onClick={() => onInsert(html)}>
            Insert
          </Button>
        </>
      }
    >
      <div className="tw:flex tw:flex-col tw:gap-1">
        <Label htmlFor="paste-html-input" className={BK_LABEL_CLASS}>
          HTML
        </Label>
        <Textarea
          id="paste-html-input"
          data-testid="paste-html-input"
          rows={4}
          autoFocus
          value={html}
          placeholder="<section>…</section>"
          className="tw:bg-white tw:font-[family-name:var(--bk-font-mono)] tw:text-[length:var(--bk-text-12)]"
          onChange={(e) => setHtml(e.target.value)}
        />
      </div>
      {strip ? (
        <p
          data-testid="paste-html-strip"
          className="tw:m-0 tw:mt-3 tw:rounded tw:px-2 tw:py-1.5 tw:bg-[var(--bk-warning-tint)] tw:text-[11px] tw:leading-4 tw:text-[var(--bk-yellow-800)]"
        >
          {strip}
        </p>
      ) : null}
    </Modal>
  );
};
