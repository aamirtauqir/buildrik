import { Select } from "@/editor/shared/vibcoder/Select";
import { Input } from "@/editor/shared/vibcoder/Input";
import { Cluster } from "@/editor/shared/vibcoder/Cluster";
/**
 * Aquibra Rich Text Editor
 * WYSIWYG text editing toolbar
 * @license BSD-3-Clause
 */

import * as React from "react";
import { ColorField } from "../../shared/forms";
import { Button } from "@/editor/shared/vibcoder/Button";
import {
  Popover,
  PopoverTrigger,
  PopoverPortal,
  PopoverContent,
  Tooltip,
  TooltipTrigger,
  TooltipPortal,
  TooltipContent,
} from "@/editor/shared/vibcoder";

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
    <Cluster
      gap="xs"
     
      style={{
        padding: 8,
        background: "var(--buildrick-bg-panel)",
        borderRadius: 8,
        border: "1px solid var(--buildrick-border)",
      }}
    >
      {/* Heading Selector */}
      <Select
        onChange={(e) => onCommand("formatBlock", e.target.value)}
        style={{
          padding: "4px 8px",
          background: "var(--buildrick-bg-dark)",
          border: "1px solid var(--buildrick-border)",
          borderRadius: 4,
          color: "var(--buildrick-text-primary)",
          fontSize: 12,
          cursor: "pointer",
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
        onChange={(e) => onCommand("fontSize", e.target.value)}
        style={{
          padding: "4px 8px",
          background: "var(--buildrick-bg-dark)",
          border: "1px solid var(--buildrick-border)",
          borderRadius: 4,
          color: "var(--buildrick-text-primary)",
          fontSize: 12,
          cursor: "pointer",
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
              <Tooltip key={item.command}>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => onCommand(item.command)}
                    style={{
                      ...toolbarButtonStyle,
                      background: isActive ? "var(--buildrick-accent)" : "transparent",
                      color: isActive ? "var(--buildrick-bg-card)" : "var(--buildrick-text-secondary)",
                      ...itemStyle,
                    }}
                  >
                    {item.icon}
                  </Button>
                </TooltipTrigger>
                <TooltipPortal>
                  <TooltipContent>{item.label}</TooltipContent>
                </TooltipPortal>
              </Tooltip>
            );
          })}
        </React.Fragment>
      ))}
      <Divider />
      {/* Colors */}
      <Popover open={textColorOpen} onOpenChange={setTextColorOpen}>
        <PopoverTrigger asChild>
          <Button style={toolbarButtonStyle} title="Text Color" aria-label="Change text color">
            <span style={{ borderBottom: "2px solid var(--buildrick-accent)" }}>A</span>
          </Button>
        </PopoverTrigger>
        <PopoverPortal>
          <PopoverContent sideOffset={8}>
            <ColorField label="Text Color" onChange={(color) => onCommand("foreColor", color)} />
          </PopoverContent>
        </PopoverPortal>
      </Popover>
      <Popover open={bgColorOpen} onOpenChange={setBgColorOpen}>
        <PopoverTrigger asChild>
          <Button
            style={toolbarButtonStyle}
            title="Background Color"
            aria-label="Change background highlight color"
          >
            <span style={{ background: "var(--buildrick-warning)", padding: "0 4px" }}>A</span>
          </Button>
        </PopoverTrigger>
        <PopoverPortal>
          <PopoverContent sideOffset={8}>
            <ColorField
              label="Highlight Color"
              onChange={(color) => onCommand("hiliteColor", color)}
            />
          </PopoverContent>
        </PopoverPortal>
      </Popover>
      <Divider />
      {/* Link */}
      <Popover open={linkOpen} onOpenChange={setLinkOpen}>
        <PopoverTrigger asChild>
          <Button
            style={{
              ...toolbarButtonStyle,
              background: activeStyles.link ? "var(--buildrick-accent)" : "transparent",
              color: activeStyles.link ? "var(--buildrick-bg-card)" : "var(--buildrick-text-secondary)",
            }}
            title="Insert Link"
          >
            🔗
          </Button>
        </PopoverTrigger>
        <PopoverPortal>
          <PopoverContent sideOffset={8}>
            <div style={{ width: 250 }}>
              <Input
                type="text"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://..."
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  background: "var(--buildrick-bg-dark)",
                  border: "1px solid var(--buildrick-border)",
                  borderRadius: 6,
                  color: "var(--buildrick-text-primary)",
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
          </PopoverContent>
        </PopoverPortal>
      </Popover>
      {/* Clear Formatting */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button onClick={() => onCommand("removeFormat")} style={toolbarButtonStyle}>
            ✕
          </Button>
        </TooltipTrigger>
        <TooltipPortal>
          <TooltipContent>Clear Formatting</TooltipContent>
        </TooltipPortal>
      </Tooltip>
    </Cluster>
  );
};

const Divider = () => (
  <div
    style={{
      width: 1,
      height: 20,
      background: "var(--buildrick-border)",
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
  color: "var(--buildrick-text-secondary)",
  cursor: "pointer",
  fontSize: 13,
  transition: "all 0.15s ease",
};

export default RichTextEditor;
