/**
 * Aquibra Rich Text Editor
 * WYSIWYG text editing toolbar
 * @license BSD-3-Clause
 */

import * as React from "react";
import { ColorField } from "../../shared/forms";
import { Popover, Button, Select, TextInput, Tooltip } from "@/editor/chrome-ui";

export interface RichTextEditorProps {
  onCommand: (command: string, value?: string) => void;
  activeStyles?: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    strikethrough?: boolean;
    link?: boolean;
  };
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ onCommand, activeStyles = {} }) => {
  const [linkUrl, setLinkUrl] = React.useState("");
  const [textColorOpen, setTextColorOpen] = React.useState(false);
  const [bgColorOpen, setBgColorOpen] = React.useState(false);
  const [linkOpen, setLinkOpen] = React.useState(false);

  const handleLink = () => {
    if (linkUrl) {
      onCommand("createLink", linkUrl);
      setLinkUrl("");
      setLinkOpen(false);
    }
  };

  const toolbarGroups = [
    {
      name: "format",
      items: [
        {
          command: "bold",
          icon: "B",
          label: "Bold",
          active: activeStyles.bold,
          style: { fontWeight: "bold" },
        },
        {
          command: "italic",
          icon: "I",
          label: "Italic",
          active: activeStyles.italic,
          style: { fontStyle: "italic" },
        },
        {
          command: "underline",
          icon: "U",
          label: "Underline",
          active: activeStyles.underline,
          style: { textDecoration: "underline" },
        },
        {
          command: "strikeThrough",
          icon: "S",
          label: "Strikethrough",
          active: activeStyles.strikethrough,
          style: { textDecoration: "line-through" },
        },
      ],
    },
    {
      name: "list",
      items: [
        { command: "insertUnorderedList", icon: "•", label: "Bullet List" },
        { command: "insertOrderedList", icon: "1.", label: "Numbered List" },
      ],
    },
    {
      name: "align",
      items: [
        { command: "justifyLeft", icon: "⬅", label: "Align Left" },
        { command: "justifyCenter", icon: "⬌", label: "Align Center" },
        { command: "justifyRight", icon: "➡", label: "Align Right" },
        /* Justify drew the SAME "⬌" as Align Center, so the two controls were
           indistinguishable on screen — the label only reached a tooltip. */
        { command: "justifyFull", icon: "☰", label: "Justify" },
      ],
    },
    {
      name: "indent",
      items: [
        { command: "outdent", icon: "⇤", label: "Decrease Indent" },
        { command: "indent", icon: "⇥", label: "Increase Indent" },
      ],
    },
  ];

  const fontSizes = [
    { value: "1", label: "10px" },
    { value: "2", label: "13px" },
    { value: "3", label: "16px" },
    { value: "4", label: "18px" },
    { value: "5", label: "24px" },
    { value: "6", label: "32px" },
    { value: "7", label: "48px" },
  ];

  const headings = [
    { value: "p", label: "Paragraph" },
    { value: "h1", label: "Heading 1" },
    { value: "h2", label: "Heading 2" },
    { value: "h3", label: "Heading 3" },
    { value: "h4", label: "Heading 4" },
    { value: "h5", label: "Heading 5" },
    { value: "h6", label: "Heading 6" },
  ];

  return (
    <div
      className="tw:flex tw:items-center tw:gap-0.5"
      style={{
        padding: 4,
        background: "var(--bk-bg-panel)",
        borderRadius: 8,
        border: "1px solid var(--bk-border)",
      }}
    >
      {/* Heading Selector */}
      <Select
        /* Both toolbar selects shipped unnamed — axe critical, and a toolbar
           that reads out as "combo box, combo box" tells a screen-reader user
           nothing about which one sets the block and which the size. */
        aria-label="Text style"
        onChange={(e) => onCommand("formatBlock", e.target.value)}
        style={{
          padding: "2px 6px",
          minWidth: 84,
          background: "var(--bk-bg-panel)",
          border: "1px solid var(--bk-border)",
          borderRadius: 4,
          color: "var(--bk-ink)",
          fontSize: 12,
          cursor: "pointer",
          appearance: "auto",
        }}
      >
        {headings.map((h) => (
          <option key={h.value} value={h.value}>
            {h.label}
          </option>
        ))}
      </Select>
      {/* Font Size */}
      <Select
        aria-label="Font size"
        onChange={(e) => onCommand("fontSize", e.target.value)}
        style={{
          padding: "2px 6px",
          minWidth: 84,
          background: "var(--bk-bg-panel)",
          border: "1px solid var(--bk-border)",
          borderRadius: 4,
          color: "var(--bk-ink)",
          fontSize: 12,
          cursor: "pointer",
          appearance: "auto",
        }}
      >
        {fontSizes.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </Select>
      <Divider />
      {/* Format Buttons */}
      {toolbarGroups.map((group, gi) => (
        <React.Fragment key={group.name}>
          {gi > 0 && <Divider />}
          {group.items.map((item) => {
            const isActive = "active" in item ? item.active : false;
            const itemStyle = "style" in item ? item.style : {};
            return (
              <Tooltip
                key={item.command}
                content={item.label}
                placement="bottom"
                arrow={false}
                className="tw:max-w-[280px] tw:whitespace-normal"
              >
                <Button
                  color="light"
                  /* The button's content is a single glyph — "B", "•", "⬌" —
                     so without a name a screen reader announces the glyph.
                     A Tooltip is a description, not a label. */
                  aria-label={item.label}
                  onClick={() => onCommand(item.command)}
                  style={{
                    ...toolbarButtonStyle,
                    background: isActive ? "var(--bk-accent)" : "transparent",
                    color: isActive ? "var(--bk-bg-card)" : "var(--bk-ink-soft)",
                    ...itemStyle,
                  }} className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900"
                >
                  {item.icon}
                </Button>
              </Tooltip>
            );
          })}
        </React.Fragment>
      ))}
      <Divider />
      {/* Colors */}
      <Popover
        open={textColorOpen}
        onClose={() => setTextColorOpen(false)}
        label="Text color"
        trigger={
          <Button
            color="light"
            style={toolbarButtonStyle}
            title="Text Color"
            aria-label="Change text color"
            aria-expanded={textColorOpen}
            onClick={() => setTextColorOpen((v) => !v)} className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900"
          >
            <span style={{ borderBottom: "2px solid var(--bk-accent)" }}>A</span>
          </Button>
        }
      >
        <ColorField label="Text Color" onChange={(color) => onCommand("foreColor", color)} />
      </Popover>
      <Popover
        open={bgColorOpen}
        onClose={() => setBgColorOpen(false)}
        label="Highlight color"
        trigger={
          <Button
            color="light"
            style={toolbarButtonStyle}
            title="Background Color"
            aria-label="Change background highlight color"
            aria-expanded={bgColorOpen}
            onClick={() => setBgColorOpen((v) => !v)} className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900"
          >
            <span style={{ background: "var(--bk-warning)", padding: "0 4px" }}>A</span>
          </Button>
        }
      >
        <ColorField
          label="Highlight Color"
          onChange={(color) => onCommand("hiliteColor", color)}
        />
      </Popover>
      <Divider />
      {/* Link */}
      <Popover
        open={linkOpen}
        onClose={() => setLinkOpen(false)}
        label="Insert link"
        trigger={
          <Button
            color="light"
            style={{
              ...toolbarButtonStyle,
              background: activeStyles.link ? "var(--bk-accent)" : "transparent",
              color: activeStyles.link ? "var(--bk-bg-card)" : "var(--bk-ink-soft)",
            }}
            title="Insert Link"
            aria-label="Insert link"
            aria-expanded={linkOpen}
            onClick={() => setLinkOpen((v) => !v)} className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900"
          >
            🔗
          </Button>
        }
      >
        <div style={{ width: 250 }}>
          <TextInput
            type="text"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://..."
            style={{
              width: "100%",
              padding: "8px 12px",
              background: "var(--bk-bg-panel)",
              border: "1px solid var(--bk-border)",
              borderRadius: 6,
              color: "var(--bk-ink)",
              fontSize: 13,
              marginBottom: 8,
            }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <Button size="xs" color="light" onClick={() => onCommand("unlink")} className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900">
              Remove
            </Button>
            <Button size="xs" onClick={handleLink}>
              Apply
            </Button>
          </div>
        </div>
      </Popover>
      {/* Clear Formatting */}
      <Tooltip content="Clear Formatting" placement="bottom" arrow={false} className="tw:max-w-[280px] tw:whitespace-normal">
        <Button
          color="light"
          aria-label="Clear formatting"
          onClick={() => onCommand("removeFormat")}
          style={toolbarButtonStyle}
          className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900"
        >
          ✕
        </Button>
      </Tooltip>
    </div>
  );
};

const Divider = () => (
  <div
    style={{
      width: 1,
      height: 18,
      background: "var(--bk-border)",
      margin: "0 2px",
    }}
  />
);

const toolbarButtonStyle: React.CSSProperties = {
  /* Board 1176:4824 is one 633px row. At 28px a button plus 8px of padding
     and 4px dividers, the bar wrapped onto a second row over the text it was
     editing — and the second row covered the line being typed. */
  width: 24,
  height: 24,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "transparent",
  border: "none",
  borderRadius: 4,
  color: "var(--bk-ink-soft)",
  cursor: "pointer",
  fontSize: 13,
  transition: "all 0.15s ease",
};

export default RichTextEditor;
