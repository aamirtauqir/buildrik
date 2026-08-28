/**
 * CatalogCard (Arc D5 — was CatalogRow) — one card in the catalog grid.
 *
 * Per prototype s06: 2-column grid of cards, each card = mini visual
 * preview on top + component name below. Drag → place stub unchanged
 * from CatalogRow: onDragStart sets the catalog-component dataTransfer
 * payload so canvas-side drop handlers route correctly.
 *
 * Mini preview is a class-only sketch per component id — ComponentType in
 * catalog.ts has no preview/thumbnail field. The schema interpreter could
 * render real previews in a follow-up; v1 ships per-id stand-ins matching
 * the prototype's visual vocabulary.
 *
 * The data-catalog-row attr is retained alongside data-catalog-card so
 * existing CatalogSection.test.tsx + ComponentsPanelV2.test.tsx queries
 * keep working without rewrites.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { ComponentType } from "../types";

interface CatalogCardProps {
  component: ComponentType;
  onSelect?: (id: string) => void;
}

/* Card chrome. */
const CARD =
  "tw:flex tw:flex-col tw:items-center tw:gap-1.5 tw:px-2 tw:py-2.5 tw:border tw:border-gray-200 " +
  "tw:rounded-md tw:bg-white tw:text-[11px] tw:text-gray-900 tw:cursor-grab tw:text-center tw:min-h-18";
const PREVIEW_BOX = "tw:flex tw:items-center tw:justify-center tw:w-full tw:h-9 tw:bg-gray-50 tw:rounded tw:overflow-hidden";
const LABEL = "tw:text-[11px] tw:leading-tight tw:text-gray-900 tw:w-full tw:whitespace-nowrap tw:overflow-hidden tw:text-ellipsis";

/* Sketch vocabulary. Tokens are written as arbitrary values rather than mapped
   to the nearest Tailwind shade, so nothing shifts colour in translation. */
const MUTED = "tw:text-[var(--bk-ink-soft)]";
const OUTLINE = "tw:border tw:border-gray-200 tw:rounded-sm";
const FILL = "tw:bg-gray-200";
const PILL = "tw:bg-[var(--bk-success-tint)] tw:text-[var(--bk-success)] tw:text-[8px]";

/** Per-id mini sketch — matches the prototype s06 visual vocabulary. */
function MiniPreview({ component }: { component: ComponentType }): React.ReactElement {
  switch (component.id) {
    case "button":
      return (
        <div className="tw:bg-[var(--bk-accent)] tw:text-white tw:text-[9px] tw:px-2 tw:py-[3px] tw:rounded-sm tw:font-medium">
          Btn
        </div>
      );
    case "input":
    case "search-bar":
      return <div className={`${OUTLINE} tw:w-4/5 tw:h-[18px] tw:bg-gray-50`} />;
    case "select":
      return (
        <div className={`${OUTLINE} tw:w-4/5 tw:h-[18px] tw:flex tw:items-center tw:justify-end tw:pr-1 tw:text-[9px] ${MUTED}`}>
          ▾
        </div>
      );
    case "checkbox":
      return <div className="tw:size-3.5 tw:border tw:border-gray-200 tw:rounded-[2px]" />;
    case "radio":
      return <div className="tw:size-3.5 tw:border tw:border-gray-200 tw:rounded-full" />;
    case "switch":
      return (
        <div className={`tw:w-7 tw:h-3.5 ${FILL} tw:rounded-full tw:relative`}>
          <div className="tw:absolute tw:top-px tw:left-px tw:size-3 tw:bg-white tw:rounded-full" />
        </div>
      );
    case "label":
      return <div className={`tw:text-[10px] ${MUTED}`}>Label</div>;
    case "spinner":
      return <div className="tw:size-3.5 tw:border-2 tw:border-gray-200 tw:border-t-blue-700 tw:rounded-full" />;
    case "card":
      return <div className={`tw:bg-gray-50 ${OUTLINE} tw:w-4/5 tw:h-[22px]`} />;
    case "form-field":
      return (
        <div className="tw:flex tw:flex-col tw:gap-0.5 tw:w-4/5">
          <div className={`tw:text-[8px] tw:text-left ${MUTED}`}>Label</div>
          <div className="tw:border tw:border-gray-200 tw:h-3 tw:rounded-[2px]" />
        </div>
      );
    case "alert":
      /* border-green-200 IS #BBF7D0 — the hex this carried, and the
         @lint-hex-policy exemption that came with it, are both gone. */
      return (
        <div className={`${PILL} tw:px-1.5 tw:py-0.5 tw:rounded-sm tw:border tw:border-green-200`}>Alert</div>
      );
    case "avatar":
      return <div className={`tw:size-[22px] tw:rounded-full ${FILL}`} />;
    case "badge":
      return <div className={`${PILL} tw:px-1.5 tw:py-px tw:rounded-lg`}>New</div>;
    case "breadcrumb":
      return <div className={`tw:text-[9px] ${MUTED}`}>Home / Page</div>;
    case "tabs":
      return (
        <div className={`tw:flex tw:gap-1 tw:text-[8px] ${MUTED}`}>
          <span className="tw:border-b-2 tw:border-[var(--bk-accent)] tw:pb-px">One</span>
          <span>Two</span>
        </div>
      );
    case "pagination":
      return (
        <div className={`tw:flex tw:gap-[3px] tw:text-[8px] ${MUTED}`}>
          <span>‹</span>
          <span>1</span>
          <span className="tw:text-[var(--bk-accent-text)]">2</span>
          <span>3</span>
          <span>›</span>
        </div>
      );
    case "list-item":
      return (
        <div className="tw:flex tw:flex-col tw:gap-px tw:w-4/5 tw:text-left">
          <div className="tw:text-[9px] tw:text-gray-900">Title</div>
          <div className={`tw:text-[7px] ${MUTED}`}>Subtitle</div>
        </div>
      );
    case "tooltip":
      return (
        <div className="tw:bg-gray-900 tw:text-gray-50 tw:text-[8px] tw:px-1.5 tw:py-0.5 tw:rounded-sm">Tip</div>
      );
    case "modal":
      return (
        <div className={`tw:bg-gray-50 ${OUTLINE} tw:w-[70%] tw:h-[22px] tw:[box-shadow:var(--bk-shadow-raised)]`} />
      );
    case "section":
      return <div className={`tw:text-[9px] ${MUTED}`}>§ Section</div>;
    case "hero":
      return <div className={`tw:text-[8px] ${MUTED}`}>Hero block</div>;
    case "footer":
      return <div className="tw:w-4/5 tw:h-2.5 tw:bg-gray-900 tw:opacity-70 tw:rounded-[2px]" />;
    case "pricing":
      return (
        <div className={`tw:flex tw:gap-[3px] tw:text-[8px] ${MUTED}`}>
          <span>$9</span>
          <span>$19</span>
          <span>$29</span>
        </div>
      );
    case "cta":
      return (
        <div className="tw:bg-[var(--bk-accent)] tw:text-white tw:text-[9px] tw:px-2.5 tw:py-[3px] tw:rounded-sm">Start</div>
      );
    case "header":
      return (
        <div className={`tw:flex tw:justify-between tw:items-center tw:w-4/5 tw:text-[8px] ${MUTED}`}>
          <span>Logo</span>
          <span>≡</span>
        </div>
      );
    case "feature-grid":
      return (
        <div className="tw:grid tw:grid-cols-3 tw:gap-0.5 tw:w-[60%]">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`tw:h-2 ${FILL} tw:rounded-[1px]`} />
          ))}
        </div>
      );
    default:
      return <div className={`tw:text-[9px] ${MUTED}`}>{component.name.slice(0, 8)}</div>;
  }
}

export const CatalogCard: React.FC<CatalogCardProps> = ({ component, onSelect }) => {
  return (
    <div
      className={CARD}
      data-catalog-card={component.id}
      data-catalog-row={component.id}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "copy";
        e.dataTransfer.setData(
          "application/x-buildrik-catalog-component",
          component.id,
        );
      }}
      onClick={() => onSelect?.(component.id)}
      role="button"
      tabIndex={0}
      title={`${component.name} · ${component.variants.length} variant${component.variants.length === 1 ? "" : "s"}`}
    >
      <div className={PREVIEW_BOX} aria-hidden="true">
        <MiniPreview component={component} />
      </div>
      <div className={LABEL}>{component.name}</div>
    </div>
  );
};
