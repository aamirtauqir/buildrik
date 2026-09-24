/**
 * Paste HTML — board 6887:78320. The Add panel's ⋯ › Paste HTML… opens this
 * dialog instead of dropping the clipboard straight onto the canvas: the
 * markup is shown (prefilled from the clipboard when it is readable),
 * editable, and the note says what sanitising will strip before Insert.
 *
 * Insert hands the text to the same BlockData insert path every block uses;
 * insertBlock owns the XSS boundary, so this dialog only reports.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Button, Label, Modal, Textarea } from "@/editor/chrome-ui";

export interface PasteHtmlModalProps {
  open: boolean;
  onClose: () => void;
  onInsert: (html: string) => void;
}

/** What the sanitiser will drop, said the way the board says it. */
function sanitiseNote(html: string): string | null {
  const scripts = (html.match(/<script\b/gi) ?? []).length;
  const handlers = (html.match(/\son[a-z]+\s*=/gi) ?? []).length;
  const parts: string[] = [];
  if (scripts) parts.push(`${scripts} <script> ${scripts === 1 ? "tag" : "tags"}`);
  if (handlers) parts.push(`${handlers} event ${handlers === 1 ? "handler" : "handlers"}`);
  return parts.length ? `${parts.join(" and ")} will be removed` : null;
}

const SECONDARY = "tw:border tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-card)] tw:text-[var(--bk-gray-700)]";
const PRIMARY = "tw:border-0 tw:bg-[var(--bk-accent)] tw:hover:bg-[var(--bk-accent-hover)] tw:text-[var(--bk-accent-on)]";
const FIELD =
  "tw:h-24 tw:resize-none tw:rounded tw:border tw:border-[var(--bk-border-input)] tw:bg-[var(--bk-bg-card)] tw:px-3 tw:pt-2.5 " +
  "tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)] tw:[font-family:var(--bk-font-mono)]";

export function PasteHtmlModal({ open, onClose, onInsert }: PasteHtmlModalProps) {
  const [html, setHtml] = React.useState("");
  const id = React.useId();

  React.useEffect(() => {
    if (!open) return;
    setHtml("");
    let live = true;
    navigator.clipboard?.readText?.().then(
      (text) => live && text.trim() && setHtml(text),
      () => {},
    );
    return () => {
      live = false;
    };
  }, [open]);

  const note = sanitiseNote(html);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Paste HTML"
      subtitle="Pasted markup is sanitised before it reaches the canvas — scripts and event handlers are stripped."
      testId="paste-html-modal"
      footer={
        <>
          <Button color="alternative" className={SECONDARY} onClick={onClose}>
            Cancel
          </Button>
          <Button
            className={PRIMARY}
            disabled={!html.trim()}
            onClick={() => {
              onInsert(html);
              onClose();
            }}
          >
            Insert
          </Button>
        </>
      }
    >
      <div className="tw:flex tw:flex-col tw:gap-1.5">
        <Label htmlFor={id} className="tw:text-[12px] tw:leading-[18px] tw:font-normal tw:text-[var(--bk-ink-soft)]">
          HTML
        </Label>
        <Textarea
          id={id}
          className={FIELD}
          value={html}
          spellCheck={false}
          onChange={(e) => setHtml(e.target.value)}
        />
      </div>
      {note ? (
        <p className="tw:m-0 tw:mt-2.5 tw:flex tw:h-8 tw:items-center tw:rounded-md tw:bg-[var(--bk-warning-tint)] tw:px-2.5 tw:text-[11px] tw:leading-4 tw:text-[var(--bk-yellow-800)]">
          {note}
        </p>
      ) : null}
    </Modal>
  );
}
