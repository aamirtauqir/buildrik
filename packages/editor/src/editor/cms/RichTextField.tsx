/**
 * RichTextField — a CMS rich text value's editor (PD-1 = build; UI-06: it was
 * a plain textarea and the server stripped every tag). The value is HTML cut
 * to the shared allow-list (`CMS_RICHTEXT_TAGS`): what the editor emits is
 * sanitized here on every input, and again on the server before it is stored
 * (DM-10), to the same list.
 *
 * 2L9 165:520 draws it as one filled box: a row of text marks — B · I ·
 * Link · Heading · List — over the text.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Button, TextInput } from "@/editor/chrome-ui";
import { sanitizeRichtext } from "@/shared/utils/html/sanitization";

export interface RichTextFieldProps {
  id: string;
  labelId: string;
  value: string;
  onChange: (html: string) => void;
}

const FRAME =
  "tw:mt-2 tw:flex tw:flex-col tw:gap-2 tw:rounded-[6px] tw:bg-[var(--bk-bg-subtle)] tw:px-3 tw:py-3 tw:focus-within:[box-shadow:var(--bk-shadow-focus)]";
const MARK =
  "tw:h-6 tw:min-h-0 tw:min-w-0 tw:border-0 tw:bg-transparent tw:px-0 tw:py-0 tw:text-[13px] tw:leading-5 tw:font-medium " +
  "tw:text-[var(--bk-ink)] tw:enabled:hover:bg-transparent tw:enabled:hover:text-[var(--bk-accent-text)] tw:focus:ring-0";
const BOX =
  "tw:min-h-[56px] tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)] tw:outline-none " +
  "tw:[&_p]:m-0 tw:[&_p+p]:mt-5 tw:[&_h3]:m-0 tw:[&_h3]:text-[15px] tw:[&_h3]:font-semibold " +
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
      <div className={FRAME}>
      <div className="tw:flex tw:items-center tw:gap-4" role="toolbar" aria-label="Text formatting">
        {(
          [
            ["B", "Bold", () => run("bold")],
            ["I", "Italic", () => run("italic")],
            ["Link", "Link", () => setLinking((v) => !v)],
            ["Heading", "Heading", () => run("formatBlock", "h3")],
            ["List", "Bulleted list", () => run("insertUnorderedList")],
          ] as const
        ).map(([text, label, act]) => (
          <Button
            key={label}
            size="xs"
            color="light"
            aria-label={label}
            aria-pressed={label === "Link" ? linking : undefined}
            className={MARK}
            onMouseDown={(e) => e.preventDefault()}
            onClick={act}
          >
            {text}
          </Button>
        ))}
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
    </div>
  );
}
