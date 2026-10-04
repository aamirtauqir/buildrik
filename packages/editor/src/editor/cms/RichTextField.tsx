/**
 * RichTextField — a CMS rich text value's editor (PD-1 = build; UI-06: it was
 * a plain textarea and the server stripped every tag). The value is HTML cut
 * to the shared allow-list (`CMS_RICHTEXT_TAGS`): what the editor emits is
 * sanitized here on every input, and again on the server before it is stored
 * (DM-10), to the same list.
 *
 * The record boards draw a rich text field as the textarea box (4428:144760
 * Description); no board draws its toolbar, so the four marks sit in a 24px
 * row of chrome-ui IconButtons above that box (C1 ledger: missing boards).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Bold, Italic, Link2, List } from "lucide-react";
import { Button, IconButton, TextInput } from "@/editor/chrome-ui";
import { sanitizeRichtext } from "@/shared/utils/html/sanitization";

export interface RichTextFieldProps {
  id: string;
  labelId: string;
  value: string;
  onChange: (html: string) => void;
}

const BOX =
  "tw:min-h-[58px] tw:rounded-[6px] tw:border tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-panel)] tw:px-2.5 tw:py-2 " +
  "tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)] tw:outline-none tw:focus:[box-shadow:var(--bk-shadow-focus)] " +
  "tw:[&_ul]:list-disc tw:[&_ul]:pl-5 tw:[&_ol]:list-decimal tw:[&_ol]:pl-5 tw:[&_a]:text-[var(--bk-accent-text)] tw:[&_a]:underline";

/** Run a formatting command on the box's selection (no-op where the browser has none). */
function exec(command: string, arg?: string): void {
  if (typeof document.execCommand === "function") document.execCommand(command, false, arg);
}

export function RichTextField({ id, labelId, value, onChange }: RichTextFieldProps) {
  const box = React.useRef<HTMLDivElement | null>(null);
  /* The HTML this field last emitted: a value coming back equal to it is our
     own echo, and re-setting innerHTML would throw the caret to the start. */
  const emitted = React.useRef<string | null>(null);
  const [linking, setLinking] = React.useState(false);
  const [href, setHref] = React.useState("https://");

  React.useEffect(() => {
    const el = box.current;
    if (!el || value === emitted.current) return;
    el.innerHTML = sanitizeRichtext(value);
    emitted.current = value;
  }, [value]);

  const emit = () => {
    const el = box.current;
    if (!el) return;
    const html = sanitizeRichtext(el.innerHTML);
    const next = el.textContent?.trim() ? html : "";
    emitted.current = next;
    onChange(next);
  };
  const run = (command: string, arg?: string) => {
    box.current?.focus();
    exec(command, arg);
    emit();
  };

  return (
    <div className="tw:flex tw:flex-col tw:gap-1" data-testid={`${id}-richtext`}>
      <div className="tw:flex tw:items-center tw:gap-1" role="toolbar" aria-label="Text formatting">
        <IconButton size="sm" label="Bold" onMouseDown={(e) => e.preventDefault()} onClick={() => run("bold")}>
          <Bold size={14} />
        </IconButton>
        <IconButton size="sm" label="Italic" onMouseDown={(e) => e.preventDefault()} onClick={() => run("italic")}>
          <Italic size={14} />
        </IconButton>
        <IconButton size="sm" label="Bulleted list" onMouseDown={(e) => e.preventDefault()} onClick={() => run("insertUnorderedList")}>
          <List size={14} />
        </IconButton>
        <IconButton size="sm" label="Link" pressed={linking} onMouseDown={(e) => e.preventDefault()} onClick={() => setLinking((v) => !v)}>
          <Link2 size={14} />
        </IconButton>
      </div>
      {linking ? (
        <div className="tw:flex tw:items-center tw:gap-2">
          <TextInput
            sizing="sm"
            aria-label="Link URL"
            className="tw:flex-1 tw:[&_input]:h-7 tw:[&_input]:py-0 tw:[&_input]:text-[12px]"
            value={href}
            onChange={(e) => setHref(e.target.value)}
            data-testid={`${id}-link-url`}
          />
          <Button
            size="xs"
            variant="secondary"
            className="tw:h-7 tw:px-3 tw:text-[12px]"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              run("createLink", href);
              setLinking(false);
            }}
          >
            Apply link
          </Button>
        </div>
      ) : null}
      <div
        ref={box}
        id={id}
        role="textbox"
        aria-multiline="true"
        aria-labelledby={labelId}
        contentEditable
        suppressContentEditableWarning
        className={BOX}
        onInput={emit}
        onBlur={emit}
      />
    </div>
  );
}
