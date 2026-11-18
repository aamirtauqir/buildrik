/**
 * Aquibra Rich Text Editor — the inline text toolbar over a text being edited
 * on the canvas.
 *
 * design-2l9 TX02 / TX10 (423:97218 / 423:100171): one compact row —
 * "Heading ▾ · B · I · U · Lists · Align · Color · Link · … · Done". TX05
 * (423:98182): every tool the old 18-control bar carried is kept, the rare
 * ones behind "…" (Strikethrough, Indent, Outdent, Text highlight, Clear
 * formatting, Text size). Done commits the edit, as Escape and clicking away
 * do (TX03).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { ColorField } from "@/shared/forms";
import { Popover, Button, Menu, MenuItem, MenuSeparator, Modal, Select, TextInput } from "@/editor/chrome-ui";

export interface RichTextEditorProps {
  onCommand: (command: string, value?: string) => void;
  /** The edited element's tag — names the block menu ("Heading" for h1–h6). */
  blockTag?: string;
  activeStyles?: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    strikethrough?: boolean;
    link?: boolean;
  };
  /** Its computed font size in px — what Font size shows. */
  fontSizePx?: number;
}

const BLOCKS = [
  { value: "p", label: "Paragraph" },
  { value: "h1", label: "Heading 1" },
  { value: "h2", label: "Heading 2" },
  { value: "h3", label: "Heading 3" },
  { value: "h4", label: "Heading 4" },
  { value: "h5", label: "Heading 5" },
  { value: "h6", label: "Heading 6" },
] as const;

const LISTS = [
  { command: "insertUnorderedList", label: "Bullet list" },
  { command: "insertOrderedList", label: "Numbered list" },
] as const;

const ALIGNS = [
  { command: "justifyLeft", label: "Align left" },
  { command: "justifyCenter", label: "Align center" },
  { command: "justifyRight", label: "Align right" },
  { command: "justifyFull", label: "Justify" },
] as const;

const FONT_SIZES = [
  { value: "1", label: "10px" },
  { value: "2", label: "13px" },
  { value: "3", label: "16px" },
  { value: "4", label: "18px" },
  { value: "5", label: "24px" },
  { value: "6", label: "32px" },
  { value: "7", label: "48px" },
] as const;

/* 423:97218 draws text controls 28 tall on a 36 bar, 13px, no icons. */
const CTRL =
  "tw:h-7 tw:min-h-0 tw:min-w-0 tw:border-transparent tw:bg-transparent tw:px-3 tw:text-[13px] tw:font-normal tw:text-[var(--bk-ink)] tw:hover:bg-[var(--bk-gray-100)] tw:focus:ring-0";
const ON = "tw:bg-[var(--bk-accent-tint)]! tw:text-[var(--bk-accent-text)]!";

function blockLabel(tag?: string): string {
  if (!tag) return "Text";
  if (/^h[1-6]$/.test(tag)) return "Heading";
  if (tag === "p") return "Paragraph";
  return "Text";
}

type Open = null | "block" | "lists" | "align" | "color" | "link" | "more" | "highlight";

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ onCommand, blockTag, fontSizePx, activeStyles = {} }) => {
  const [open, setOpen] = React.useState<Open>(null);
  const [linkUrl, setLinkUrl] = React.useState("");
  const toggle = (which: Exclude<Open, null>) => setOpen((v) => (v === which ? null : which));
  const close = () => setOpen(null);
  const run = (command: string, value?: string) => {
    if (value === undefined) onCommand(command);
    else onCommand(command, value);
    close();
  };

  /* The link dialog takes focus from the edited text; keep its range. */
  const savedRange = React.useRef<Range | null>(null);
  const [linkText, setLinkText] = React.useState("");
  const restoreSelection = () => {
    const range = savedRange.current;
    if (!range) return;
    const host = (range.commonAncestorContainer as Element).parentElement?.closest?.("[contenteditable='true']")
      ?? (range.commonAncestorContainer as Element).closest?.("[contenteditable='true']");
    (host as HTMLElement | null)?.focus();
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  };
  const openLink = () => {
    const sel = window.getSelection();
    savedRange.current = sel && sel.rangeCount ? sel.getRangeAt(0).cloneRange() : null;
    setLinkText(sel?.toString().trim() ?? "");
    setLinkUrl("");
    setOpen("link");
  };
  const closeLink = () => {
    close();
    restoreSelection();
  };
  const applyLink = () => {
    if (!linkUrl) return;
    restoreSelection();
    run("createLink", linkUrl);
    setLinkUrl("");
  };

  const menuPopover = (which: Exclude<Open, null>, label: string, trigger: React.ReactNode, children: React.ReactNode) => (
    /* "Text highlight…" swaps the "…" menu for its colour field in place. */
    <Popover open={open === which || (which === "more" && open === "highlight")} onClose={close} label={label} placement="bottom" trigger={trigger}>
      {children}
    </Popover>
  );

  const trigger = (which: Exclude<Open, null>, text: string, ariaLabel: string, active = false) => (
    <Button
      color="light"
      size="xs"
      className={`${CTRL}${active || open === which ? ` ${ON}` : ""}`}
      aria-label={ariaLabel}
      aria-haspopup="menu"
      aria-expanded={open === which}
      data-testid={`rte-${which}`}
      onClick={() => toggle(which)}
    >
      {text}
    </Button>
  );

  /* 423:97218 draws B / I / U as plain letters. */
  const mark = (command: string, glyph: string, label: string, active?: boolean) => (
    <Button
      color="light"
      size="xs"
      className={`${CTRL} tw:w-9 tw:px-0${active ? ` ${ON}` : ""}`}
      aria-label={label}
      aria-pressed={active ?? false}
      data-testid={`rte-${command}`}
      onClick={() => onCommand(command)}
    >
      {glyph}
    </Button>
  );

  /* Audit 2026-10-20 #16: the size select was uncontrolled, so it showed
     its first option, not the text's. It shows the caret's computed size; one
     not on the list gets its own row (the size scale is execCommand's 1–7,
     not every px value). */
  const sizePx = fontSizePx === undefined ? undefined : Math.round(fontSizePx);
  const sizeValue = FONT_SIZES.find((s) => s.label === `${sizePx}px`)?.value ?? "";

  return (
    <div
      className="tw:inline-flex tw:h-10 tw:w-fit tw:items-center tw:gap-1 tw:rounded-md tw:bg-[var(--bk-bg-card)] tw:px-2 tw:shadow-[var(--bk-shadow-raised)]"
      role="toolbar"
      aria-label="Text formatting"
      data-testid="rte-toolbar"
    >
      {menuPopover(
        "block",
        "Text style",
        trigger("block", `${blockLabel(blockTag)} ▾`, "Text style"),
        <Menu label="Text style">
          {BLOCKS.map((b) => (
            <MenuItem key={b.value} selected={blockTag === b.value} data-testid={`rte-block-${b.value}`} onClick={() => run("formatBlock", b.value)}>
              {b.label}
            </MenuItem>
          ))}
        </Menu>,
      )}
      {mark("bold", "B", "Bold", activeStyles.bold)}
      {mark("italic", "I", "Italic", activeStyles.italic)}
      {mark("underline", "U", "Underline", activeStyles.underline)}
      {menuPopover(
        "lists",
        "Lists",
        trigger("lists", "Lists", "Lists"),
        <Menu label="Lists">
          {LISTS.map((l) => (
            <MenuItem key={l.command} data-testid={`rte-${l.command}`} onClick={() => run(l.command)}>
              {l.label}
            </MenuItem>
          ))}
        </Menu>,
      )}
      {menuPopover(
        "align",
        "Align",
        trigger("align", "Align", "Align"),
        <Menu label="Align">
          {ALIGNS.map((a) => (
            <MenuItem key={a.command} data-testid={`rte-${a.command}`} onClick={() => run(a.command)}>
              {a.label}
            </MenuItem>
          ))}
        </Menu>,
      )}
      {menuPopover(
        "color",
        "Text color",
        trigger("color", "Color", "Color"),
        <ColorField label="Text color" onChange={(color) => onCommand("foreColor", color)} />,
      )}
      {/* TX06 / TX07 (423:98532): "Link selected text" — a dialog over the
          edit that keeps it open: the selection is saved before focus leaves
          and put back before the link is made. */}
      <Button
        color="light"
        size="xs"
        className={`${CTRL}${activeStyles.link || open === "link" ? ` ${ON}` : ""}`}
        aria-haspopup="dialog"
        aria-expanded={open === "link"}
        data-testid="rte-link"
        onClick={openLink}
      >
        Link
      </Button>
      <Modal
        open={open === "link"}
        onClose={closeLink}
        title="Link selected text"
        width="sm"
        testId="rte-link-dialog"
      >
        {/* bd-inline-keep: focus and clicks here do not end the edit. */}
        <div className="bd-inline-keep tw:flex tw:flex-col tw:gap-3">
          <p className="tw:m-0 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink-soft)]" data-testid="rte-link-body">
            {`Link “${linkText || "the selected text"}”. Page, selected element and inline text draft stay intact.`}
          </p>
          <TextInput
            type="url"
            value={linkUrl}
            placeholder="https://…"
            aria-label="Link address"
            data-testid="rte-link-url"
            autoFocus
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyLink();
              }
            }}
          />
          <div className="tw:flex tw:items-center tw:justify-end tw:gap-2">
            {activeStyles.link && (
              <Button size="xs" color="light" className={`${CTRL} tw:mr-auto`} data-testid="rte-unlink" onClick={() => { restoreSelection(); run("unlink"); }}>
                Remove link
              </Button>
            )}
            <Button size="xs" color="light" className="tw:h-8 tw:min-h-0 tw:px-4 tw:text-[13px]" data-testid="rte-link-cancel" onClick={closeLink}>
              Cancel
            </Button>
            <Button size="xs" className="tw:h-8 tw:min-h-0 tw:px-4 tw:text-[13px]" disabled={!linkUrl} data-testid="rte-link-apply" onClick={applyLink}>
              Apply link
            </Button>
          </div>
        </div>
      </Modal>
      {menuPopover(
        "more",
        "More formatting",
        trigger("more", "…", "More formatting", activeStyles.strikethrough),
        open === "highlight" ? (
          <ColorField label="Text highlight" onChange={(color) => onCommand("hiliteColor", color)} />
        ) : (
        /* 423:98182: a 240 menu, labels centred, Close menu an outlined row. */
        <Menu label="More formatting" className="tw:w-60 tw:[&_[role^=menuitem]>span]:text-center">
          <MenuItem data-testid="rte-strikeThrough" onClick={() => run("strikeThrough")}>
            Strikethrough
          </MenuItem>
          <MenuItem data-testid="rte-indent" onClick={() => run("indent")}>
            Indent
          </MenuItem>
          <MenuItem data-testid="rte-outdent" onClick={() => run("outdent")}>
            Outdent
          </MenuItem>
          <MenuItem data-testid="rte-highlight" onClick={() => setOpen("highlight")}>
            Text highlight
          </MenuItem>
          <MenuItem data-testid="rte-removeFormat" onClick={() => run("removeFormat")}>
            Clear formatting
          </MenuItem>
          <MenuSeparator />
          <div className="tw:flex tw:items-center tw:gap-2 tw:px-2 tw:py-1 tw:text-[12px] tw:text-[var(--bk-ink-muted)]">
            Text size
            <Select aria-label="Text size" data-testid="rte-fontSize" value={sizeValue} onChange={(e) => run("fontSize", e.target.value)}>
              {sizeValue === "" && (
                <option value="" disabled>
                  {sizePx === undefined ? "—" : `${sizePx}px`}
                </option>
              )}
              {FONT_SIZES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </div>
          {/* 423:98182 ends the menu with "Close menu". */}
          <MenuItem data-testid="rte-more-close" className="tw:mt-1 tw:border! tw:border-solid! tw:border-[var(--bk-border)]!" onClick={close}>
            Close menu
          </MenuItem>
        </Menu>
        ),
      )}
      <Button
        color="light"
        size="xs"
        className="tw:ml-6 tw:h-8 tw:min-h-0 tw:px-5 tw:text-[13px] tw:font-normal tw:focus:ring-0"
        data-testid="rte-done"
        onClick={() => onCommand("commitEdit")}
      >
        Done
      </Button>
    </div>
  );
};

export default RichTextEditor;
