/**
 * Canvas Breadcrumb Component
 * Fixed bar at bottom of canvas showing current selection path
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine";
import {
  BreadcrumbContainer,
  BreadcrumbSegment,
  BreadcrumbSeparator,
  BreadcrumbHint,
} from "../styled";

export interface CanvasBreadcrumbProps {
  composer: Composer;
  selectedId: string | null;
  onSelectElement: (elementId: string) => void;
}

interface BreadcrumbSegmentData {
  id: string;
  name: string;
  type: string;
  isCurrent: boolean;
}

/** Get friendly element name */
function getElementName(type: string, tagName?: string): string {
  const typeMap: Record<string, string> = {
    container: "Container",
    section: "Section",
    row: "Row",
    column: "Column",
    heading: "Heading",
    paragraph: "Paragraph",
    text: "Text",
    image: "Image",
    button: "Button",
    link: "Link",
    video: "Video",
    form: "Form",
    div: "Div",
    span: "Span",
    nav: "Nav",
    header: "Header",
    footer: "Footer",
  };
  const normalized = type.toLowerCase();
  return typeMap[normalized] || tagName || type;
}

/** Get type icon */
function getTypeIcon(type: string): React.ReactNode {
  const t = type.toLowerCase();

  if (["container", "div", "section"].includes(t)) {
    return (
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
      </svg>
    );
  }
  if (["row", "column"].includes(t)) {
    return (
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="3" y="3" width="7" height="18" rx="1" />
        <rect x="14" y="3" width="7" height="18" rx="1" />
      </svg>
    );
  }
  if (["heading", "h1", "h2", "h3", "h4", "h5", "h6"].includes(t)) {
    return <span style={{ fontWeight: 700, fontSize: 12 }}>H</span>;
  }
  if (["paragraph", "p", "text"].includes(t)) {
    return <span style={{ fontWeight: 500, fontSize: 12 }}>T</span>;
  }
  if (["image", "img"].includes(t)) {
    return (
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="M21 15l-5-5L5 21" />
      </svg>
    );
  }
  if (["button"].includes(t)) {
    return (
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="3" y="8" width="18" height="8" rx="2" />
      </svg>
    );
  }
  if (["link", "a"].includes(t)) {
    return (
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    );
  }

  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
    </svg>
  );
}

export const CanvasBreadcrumb: React.FC<CanvasBreadcrumbProps> = ({
  composer,
  selectedId,
  onSelectElement,
}) => {
  const [segments, setSegments] = React.useState<BreadcrumbSegmentData[]>([]);

  // Build breadcrumb path
  React.useEffect(() => {
    if (!selectedId) {
      setSegments([]);
      return;
    }

    const path: BreadcrumbSegmentData[] = [];

    // Build ancestor chain
    let currentElement: ReturnType<typeof composer.elements.getElement> | null =
      composer.elements.getElement(selectedId);
    while (currentElement) {
      const type =
        currentElement.getType?.() || currentElement.getTagName?.()?.toLowerCase() || "element";
      const currentId = currentElement.getId?.() || "";
      path.unshift({
        id: currentId,
        name: getElementName(type, currentElement.getTagName?.()?.toLowerCase()),
        type,
        isCurrent: currentId === selectedId,
      });

      currentElement = currentElement.getParent();
    }

    // Add "Canvas" as root
    path.unshift({
      id: "canvas-root",
      name: "Canvas",
      type: "canvas",
      isCurrent: false,
    });

    setSegments(path);
  }, [composer, selectedId]);

  if (!selectedId || segments.length === 0) {
    return null;
  }

  return (
    <BreadcrumbContainer>
      <div style={{ display: "flex", alignItems: "center", gap: 2, overflow: "hidden" }}>
        {segments.map((segment, index) => (
          <React.Fragment key={segment.id}>
            {index > 0 && (
              <BreadcrumbSeparator>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </BreadcrumbSeparator>
            )}
            <BreadcrumbSegment
              onClick={() => {
                if (segment.id !== "canvas-root" && !segment.isCurrent) {
                  onSelectElement(segment.id);
                }
              }}
              disabled={segment.id === "canvas-root"}
              isCurrent={segment.isCurrent}
              isRoot={segment.id === "canvas-root"}
            >
              <span style={{ opacity: 0.7, display: "flex", alignItems: "center" }}>
                {getTypeIcon(segment.type)}
              </span>
              <span>{segment.name}</span>
            </BreadcrumbSegment>
          </React.Fragment>
        ))}
      </div>

      <BreadcrumbHint>
        <span>Alt+↑ Parent</span>
        <span>Alt+↓ Child</span>
      </BreadcrumbHint>
    </BreadcrumbContainer>
  );
};

export default CanvasBreadcrumb;
