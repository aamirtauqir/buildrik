/**
 * ElementCard, AnimatedAccordionContent, ChevronIcon — UI sub-components for ElementsTab
 * Also exports handleDragStart and highlightMatch as standalone helpers.
 * @license BSD-3-Clause
 */

import { Star, Square, ChevronDown } from "lucide-react";
import * as React from "react";
import { getBlockById } from "../../../../blocks/blockRegistry";
import type { BlockData } from "../../../../shared/types";
import { BLOCK_ICONS, BLOCK_DESCRIPTIONS } from "./constants";

// ─── ElementCard ──────────────────────────────────────────────────────────────

export interface ElementCardProps {
  block: BlockData;
  fullWidth?: boolean;
  isFavorite: boolean;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onClick: (block: BlockData) => void;
  onDragStart: (e: React.DragEvent, block: BlockData, isCard: boolean) => void;
}

export const ElementCard: React.FC<ElementCardProps> = ({
  block,
  fullWidth = false,
  isFavorite,
  onToggleFavorite,
  onClick,
  onDragStart,
}) => {
  const Icon = BLOCK_ICONS[block.id] ?? Square;
  const description = BLOCK_DESCRIPTIONS[block.id] || block.description || "";

  return (
    <div
      className={`aqb-element-card${fullWidth ? " aqb-element-card--full" : ""}`}
      draggable
      role="button"
      tabIndex={0}
      onClick={() => onClick(block)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick(block);
        }
      }}
      onDragStart={(e) => onDragStart(e as unknown as React.DragEvent, block, true)}
      title={`Drag or click to add ${block.label}`}
    >
      <button
        className={`aqb-element-card-star${isFavorite ? " favorited" : ""}`}
        onClick={(e) => onToggleFavorite(block.id, e)}
        title={isFavorite ? "Remove from favorites" : "Add to favorites"}
      >
        <Star size={12} fill={isFavorite ? "currentColor" : "none"} />
      </button>
      <div className="aqb-element-card-header">
        <div className="aqb-element-card-icon">
          <Icon size={18} strokeWidth={1.5} />
        </div>
        <span className="aqb-element-card-label">{block.label}</span>
      </div>
      {description && <span className="aqb-element-card-desc">{description}</span>}
    </div>
  );
};

// ─── AnimatedAccordionContent ─────────────────────────────────────────────────

export const AnimatedAccordionContent: React.FC<{ isOpen: boolean; children: React.ReactNode }> = ({
  isOpen,
  children,
}) => {
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [height, setHeight] = React.useState<number | "auto">(isOpen ? "auto" : 0);

  React.useEffect(() => {
    if (isOpen) {
      const h = contentRef.current?.scrollHeight || 0;
      setHeight(h);
      const timer = setTimeout(() => setHeight("auto"), 200);
      return () => clearTimeout(timer);
    } else {
      const h = contentRef.current?.scrollHeight || 0;
      setHeight(h);
      requestAnimationFrame(() => setHeight(0));
    }
  }, [isOpen]);

  return (
    <div
      style={{
        height: typeof height === "number" ? `${height}px` : height,
        overflow: "hidden",
        transition: "height 0.2s ease-out",
      }}
    >
      <div ref={contentRef}>{children}</div>
    </div>
  );
};

// ─── ChevronIcon ──────────────────────────────────────────────────────────────

export const ChevronIcon: React.FC<{ expanded: boolean }> = ({ expanded }) => (
  <ChevronDown
    size={14}
    strokeWidth={2}
    className={`aqb-accordion-chevron ${expanded ? "open" : "closed"}`}
  />
);

// ─── Standalone helpers ───────────────────────────────────────────────────────

/** Text highlight utility — returns plain text (no-op; extend if needed). */
export function highlightMatch(text: string, _query: string): string {
  return text;
}

/** Drag-start handler as a standalone function for use outside the hook. */
export function handleDragStart(
  e: React.DragEvent,
  block: BlockData,
  isCard = false,
  addRecent?: (id: string) => void
): void {
  addRecent?.(block.id);
  const def = getBlockById(block.id);
  e.dataTransfer.effectAllowed = "copy";
  e.dataTransfer.setData(
    "block",
    JSON.stringify({ ...block, elementType: def?.elementType || "container" })
  );
  e.dataTransfer.setData("text/plain", block.id);
  if (isCard) {
    const target = e.currentTarget as HTMLElement;
    const ghost = target.cloneNode(true) as HTMLElement;
    ghost.classList.add("aqb-drag-ghost");
    ghost.style.cssText = "position:absolute;top:-1000px;";
    ghost.style.width = `${target.offsetWidth}px`;
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 40, 40);
    requestAnimationFrame(() => ghost.remove());
  }
}
