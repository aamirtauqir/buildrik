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
import { Popover, Button, Menu, MenuItem, MenuSeparator, Select, TextInput } from "@/editor/chrome-ui";

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

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ onCommand, blockTag, activeStyles = {} }) => {
  const [open, setOpen] = React.useState<Open>(null);
  const [linkUrl, setLinkUrl] = React.useState("");
  const toggle = (which: Exclude<Open, null>) => setOpen((v) => (v === which ? null : which));
  const close = () => setOpen(null);
  const run = (command: string, value?: string) => {
    if (value === undefined) onCommand(command);
    else onCommand(command, value);
    close();
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
      {menuPopover(
        "link",
        "Link",
        trigger("link", "Link", "Link", activeStyles.link),
        <div className="tw:flex tw:w-62 tw:flex-col tw:gap-2">
          <TextInput
            type="url"
            value={linkUrl}
            placeholder="https://…"
            aria-label="Link address"
            data-testid="rte-link-url"
            onChange={(e) => setLinkUrl(e.target.value)}
          />
          <div className="tw:flex tw:gap-2">
            <Button size="xs" color="light" className={CTRL} data-testid="rte-unlink" onClick={() => run("unlink")}>
              Remove
            </Button>
            <Button
              size="xs"
              disabled={!linkUrl}
              data-testid="rte-link-apply"
              onClick={() => {
                run("createLink", linkUrl);
                setLinkUrl("");
              }}
            >
              Apply link
            </Button>
          </div>
        </div>,
      )}
      {menuPopover(
        "more",
        "More formatting",
        trigger("more", "…", "More formatting", activeStyles.strikethrough),
        open === "highlight" ? (
          <ColorField label="Text highlight" onChange={(color) => onCommand("hiliteColor", color)} />
        ) : (
        <Menu label="More formatting">
          <MenuItem selected={activeStyles.strikethrough ?? false} data-testid="rte-strikeThrough" onClick={() => run("strikeThrough")}>
            Strikethrough
          </MenuItem>
          <MenuItem data-testid="rte-indent" onClick={() => run("indent")}>
            Indent
          </MenuItem>
          <MenuItem data-testid="rte-outdent" onClick={() => run("outdent")}>
            Outdent
          </MenuItem>
          <MenuItem data-testid="rte-highlight" onClick={() => setOpen("highlight")}>
            Text highlight…
          </MenuItem>
          <MenuItem data-testid="rte-removeFormat" onClick={() => run("removeFormat")}>
            Clear formatting
          </MenuItem>
          <MenuSeparator />
          <div className="tw:flex tw:items-center tw:gap-2 tw:px-2 tw:py-1 tw:text-[12px] tw:text-[var(--bk-ink-muted)]">
            Text size
            <Select aria-label="Text size" data-testid="rte-fontSize" defaultValue="" onChange={(e) => run("fontSize", e.target.value)}>
              <option value="" disabled>
                —
              </option>
              {FONT_SIZES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </div>
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
