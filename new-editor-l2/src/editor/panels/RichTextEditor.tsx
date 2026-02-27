/**
 * Aquibra Rich Text Editor
 * WYSIWYG text editing toolbar
 * @license BSD-3-Clause
 */

import * as React from "react";
import { ColorField } from "../../shared/forms";
import { Button, Popover, Tooltip } from "../../shared/ui";

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

  const handleLink = () => {
    if (linkUrl) {
      onCommand("createLink", linkUrl);
      setLinkUrl("");
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
        { command: "justifyFull", icon: "⬌", label: "Justify" },
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
      className="aqb-rte"
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 4,
        padding: 8,
        background: "var(--aqb-bg-panel)",
        borderRadius: 8,
        border: "1px solid var(--aqb-border)",
      }}
    >
      {/* Heading Selector */}
      <select
        onChange={(e) => onCommand("formatBlock", e.target.value)}
        style={{
          padding: "4px 8px",
          background: "var(--aqb-bg-dark)",
          border: "1px solid var(--aqb-border)",
          borderRadius: 4,
          color: "var(--aqb-text-primary)",
          fontSize: 12,
          cursor: "pointer",
        }}
      >
        {headings.map((h) => (
          <option key={h.value} value={h.value}>
            {h.label}
          </option>
        ))}
      </select>

      {/* Font Size */}
      <select
        onChange={(e) => onCommand("fontSize", e.target.value)}
        style={{
          padding: "4px 8px",
          background: "var(--aqb-bg-dark)",
          border: "1px solid var(--aqb-border)",
          borderRadius: 4,
          color: "var(--aqb-text-primary)",
          fontSize: 12,
          cursor: "pointer",
        }}
      >
        {fontSizes.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      <Divider />

      {/* Format Buttons */}
      {toolbarGroups.map((group, gi) => (
        <React.Fragment key={group.name}>
          {gi > 0 && <Divider />}
          {group.items.map((item) => {
            const isActive = "active" in item ? item.active : false;
            const itemStyle = "style" in item ? item.style : {};
            return (
              <Tooltip key={item.command} content={item.label}>
                <button
                  onClick={() => onCommand(item.command)}
                  style={{
                    ...toolbarButtonStyle,
                    background: isActive ? "var(--aqb-primary)" : "transparent",
                    color: isActive ? "#fff" : "var(--aqb-text-secondary)",
                    ...itemStyle,
                  }}
                >
                  {item.icon}
                </button>
              </Tooltip>
            );
          })}
        </React.Fragment>
      ))}

      <Divider />

      {/* Colors */}
      <Popover
        trigger={
          <button style={toolbarButtonStyle} title="Text Color" aria-label="Change text color">
            <span style={{ borderBottom: "2px solid var(--aqb-primary)" }}>A</span>
          </button>
        }
        content={
          <ColorField label="Text Color" onChange={(color) => onCommand("foreColor", color)} />
        }
      />

      <Popover
        trigger={
          <button
            style={toolbarButtonStyle}
            title="Background Color"
            aria-label="Change background highlight color"
          >
            <span style={{ background: "var(--aqb-warning)", padding: "0 4px" }}>A</span>
          </button>
        }
        content={
          <ColorField
            label="Highlight Color"
            onChange={(color) => onCommand("hiliteColor", color)}
          />
        }
      />

      <Divider />

      {/* Link */}
      <Popover
        trigger={
          <button
            style={{
              ...toolbarButtonStyle,
              background: activeStyles.link ? "var(--aqb-primary)" : "transparent",
              color: activeStyles.link ? "#fff" : "var(--aqb-text-secondary)",
            }}
            title="Insert Link"
          >
            🔗
          </button>
        }
        content={
          <div style={{ width: 250 }}>
            <input
              type="text"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://..."
              style={{
                width: "100%",
                padding: "8px 12px",
                background: "var(--aqb-bg-dark)",
                border: "1px solid var(--aqb-border)",
                borderRadius: 6,
                color: "var(--aqb-text-primary)",
                fontSize: 13,
                marginBottom: 8,
              }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <Button size="sm" variant="ghost" onClick={() => onCommand("unlink")}>
                Remove
              </Button>
              <Button size="sm" onClick={handleLink}>
                Apply
              </Button>
            </div>
          </div>
        }
      />

      {/* Clear Formatting */}
      <Tooltip content="Clear Formatting">
        <button onClick={() => onCommand("removeFormat")} style={toolbarButtonStyle}>
          ✕
        </button>
      </Tooltip>
    </div>
  );
};

const Divider = () => (
  <div
    style={{
      width: 1,
      height: 20,
      background: "var(--aqb-border)",
      margin: "0 4px",
    }}
  />
);

const toolbarButtonStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "transparent",
  border: "none",
  borderRadius: 4,
  color: "var(--aqb-text-secondary)",
  cursor: "pointer",
  fontSize: 13,
  transition: "all 0.15s ease",
};

export default RichTextEditor;
