/**
 * Aquibra Quick Add Bar
 * Quick access to common blocks
 * @license BSD-3-Clause
 */

import { Type, Heading, ImageIcon, Square, LayoutTemplate, LucideIcon } from "lucide-react";
import * as React from "react";
import type { BlockData } from "../../../shared/types";

interface QuickAddBarProps {
  blocks: BlockData[];
  onAdd: (block: BlockData) => void;
  disabled?: boolean;
}

const quickBlockConfig: { id: string; Icon: LucideIcon; label: string }[] = [
  { id: "text", Icon: Type, label: "Text" },
  { id: "heading", Icon: Heading, label: "Heading" },
  { id: "image", Icon: ImageIcon, label: "Image" },
  { id: "button", Icon: Square, label: "Button" },
  { id: "section", Icon: LayoutTemplate, label: "Section" },
];

export const QuickAddBar: React.FC<QuickAddBarProps> = ({ blocks, onAdd, disabled = false }) => {
  const [hovered, setHovered] = React.useState<string | null>(null);

  const quickBlocks = quickBlockConfig
    .map((config) => {
      const block = blocks.find((b) => b.id === config.id);
      return block ? { ...block, Icon: config.Icon, displayLabel: config.label } : null;
    })
    .filter(Boolean) as (BlockData & { Icon: LucideIcon; displayLabel: string })[];

  if (!quickBlocks.length) return null;

  return (
    <div
      style={{
        position: "absolute",
        bottom: 16,
        right: 100, // Offset to avoid overlap with ZoomControls
        display: "flex",
        gap: 4,
        background: "linear-gradient(135deg, rgba(30,30,46,0.95) 0%, rgba(24,24,37,0.95) 100%)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 10,
        padding: "8px 10px",
        backdropFilter: "blur(12px)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
        zIndex: 10,
      }}
    >
      <span
        style={{
          display: "flex",
          alignItems: "center",
          padding: "0 8px 0 4px",
          color: "var(--aqb-text-muted)",
          fontSize: 11,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          borderRight: "1px solid rgba(255,255,255,0.1)",
          marginRight: 4,
        }}
      >
        Quick Add
      </span>
      {quickBlocks.map((block) => (
        <button
          key={block.id}
          onClick={() => !disabled && onAdd(block)}
          onMouseEnter={() => !disabled && setHovered(block.id)}
          onMouseLeave={() => setHovered(null)}
          disabled={disabled}
          title={disabled ? "Adding block..." : `Add ${block.displayLabel}`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 12px",
            background:
              hovered === block.id && !disabled
                ? "linear-gradient(135deg, #667eea, #764ba2)"
                : "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 6,
            color: hovered === block.id && !disabled ? "#fff" : "#cdd6f4",
            fontSize: 12,
            fontWeight: 500,
            cursor: disabled ? "not-allowed" : "pointer",
            transition: "all 0.2s ease",
            transform: hovered === block.id && !disabled ? "translateY(-1px)" : "none",
            boxShadow:
              hovered === block.id && !disabled ? "0 4px 12px rgba(102, 126, 234, 0.3)" : "none",
            opacity: disabled ? 0.5 : 1,
            pointerEvents: disabled ? "none" : "auto",
          }}
        >
          <block.Icon size={14} strokeWidth={1.5} />
          <span>{block.displayLabel}</span>
        </button>
      ))}
    </div>
  );
};

export default QuickAddBar;
