/**
 * Selection Box Overlay Component
 * Renders visible resize handles - uses ResizeHandler engine for logic
 * Supports multi-select with combined bounding box
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine";
import { ROTATION_HANDLE_OFFSET } from "../../../engine/canvas/constants";
import type { HandlePosition } from "../../../engine/canvas/ResizeHandler";
import { Z_LAYERS } from "../../../shared/constants/canvas";
import { useCanvasResize } from "../hooks";
import { AlignmentToolbar } from "../toolbars/AlignmentToolbar";
import { SelectionHandles } from "./SelectionHandles";
// import { useSelectionAnimation } from "../hooks/useSelectionAnimation";

// CSS variable references for colors - single source of truth is Canvas.css
const SELECTION_VARS = {
  primary: "var(--aqb-selection-color)",
  primaryLight: "var(--aqb-primary-light)",
  glow: "var(--aqb-selection-glow)",
  alpha40: "var(--aqb-selection-alpha-40)",
  alpha10: "var(--aqb-accent-blue-alpha)",
  gradient: "var(--aqb-handle-gradient)",
  glowSm: "var(--aqb-selection-glow-sm)",
};

interface SelectionBoxOverlayProps {
  composer: Composer | null;
  /** Primary selected element ID */
  elementId: string | null;
  /** All selected element IDs (for multi-select) */
  selectedIds?: string[];
  onResizeStart?: () => void;
  onResizeEnd?: (width: number, height: number) => void;
  /** Callback when resize/rotate state changes */
  onResizeStateChange?: (isResizing: boolean) => void;
}

/** Selection bounding rectangle */
interface SelectionRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

const SelectionBoxOverlayComponent: React.FC<SelectionBoxOverlayProps> = ({
  composer,
  elementId,
  selectedIds = [],
  onResizeStart,
  onResizeEnd,
  onResizeStateChange,
}) => {
  // CRITICAL: All hooks must execute unconditionally.
  // Do NOT add early returns (e.g. if (!id) return null) before hook calls.

  const [rect, setRect] = React.useState<SelectionRect | null>(null);
  // Memoized individual element rects for multi-select (calculated once in effect, not in render)
  const [elementRects, setElementRects] = React.useState<Map<string, SelectionRect>>(new Map());
  // Rotation state for rotation handle - isRotating reserved for future cursor/animation feedback
  const [_isRotating, setIsRotating] = React.useState(false);
  // Current rotation angle for aria-valuenow (WCAG 4.1.2 requires it on role="slider")
  const [rotationDegrees, setRotationDegrees] = React.useState(0);

  // Animation ref for GSAP
  const selectionBorderRef = React.useRef<HTMLDivElement>(null);

  // Check if element has CMS bindings
  const hasCMSBindings = React.useMemo(() => {
    if (!composer?.cmsBindings || !elementId) return false;
    return composer.cmsBindings.getBindings(elementId).length > 0;
  }, [composer, elementId]);

  // Check if element is locked — subscribes to element:updated to stay reactive
  const [isElementLocked, setIsElementLocked] = React.useState(false);

  React.useEffect(() => {
    if (!composer || !elementId) {
      setIsElementLocked(false);
      return;
    }
    const refresh = () => {
      setIsElementLocked(composer.elements.getElement(elementId)?.isLocked() ?? false);
    };
    refresh();
    composer.on("element:updated", refresh);
    return () => {
      composer.off("element:updated", refresh);
    };
  }, [composer, elementId]);

  // Read current rotation from element style so aria-valuenow stays accurate.
  // Subscribes to element:updated so the value updates live during active rotation drag.
  React.useEffect(() => {
    const readRotation = () => {
      if (!composer || !elementId) {
        setRotationDegrees(0);
        return;
      }
      const el = composer.elements.getElement(elementId);
      if (!el) {
        setRotationDegrees(0);
        return;
      }
      const transform = (el.getStyle?.("transform") ?? "") as string;
      const match = transform.match(/rotate\((-?[\d.]+)deg\)/);
      setRotationDegrees(match ? Math.round(parseFloat(match[1])) : 0);
    };

    readRotation(); // read once on mount/element change
    composer?.on("element:updated", readRotation);
    return () => {
      composer?.off("element:updated", readRotation);
    };
  }, [composer, elementId]);

  // Determine if multi-select mode
  const isMultiSelect = selectedIds.length > 1;
  const effectiveIds = isMultiSelect ? selectedIds : elementId ? [elementId] : [];

  // Use the resize hook - connects to ResizeHandler engine
  const { startResize, startRotation, isResizing, currentBounds } = useCanvasResize(
    composer,
    elementId,
    {
      onResizeStart,
      onResizeEnd: (bounds) => {
        onResizeEnd?.(bounds.width, bounds.height);
      },
    }
  );

  // Notify parent when resize/rotate state changes
  React.useEffect(() => {
    onResizeStateChange?.(isResizing);
  }, [isResizing, onResizeStateChange]);

  // Update rect when element(s) change
  React.useEffect(() => {
    if (effectiveIds.length === 0) {
      setRect(null);
      return;
    }

    // RAF throttling ref to prevent layout thrashing
    let rafId: number | null = null;

    const updateRect = () => {
      const canvas = document.querySelector(".aqb-canvas") as HTMLElement;
      if (!canvas) return;

      const canvasRect = canvas.getBoundingClientRect();

      // Account for canvas scroll position
      const scrollLeft = canvas.scrollLeft || 0;
      const scrollTop = canvas.scrollTop || 0;

      if (isMultiSelect) {
        // Calculate combined bounding box for multi-select
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        // Also calculate individual element rects (avoids DOM queries in render)
        const newElementRects = new Map<string, SelectionRect>();

        effectiveIds.forEach((id) => {
          const element = document.querySelector(`[data-aqb-id="${id}"]`) as HTMLElement;
          if (element) {
            const elRect = element.getBoundingClientRect();
            // Add scroll offset to convert viewport coords to canvas coords
            const elLeft = elRect.left - canvasRect.left + scrollLeft;
            const elTop = elRect.top - canvasRect.top + scrollTop;
            minX = Math.min(minX, elLeft);
            minY = Math.min(minY, elTop);
            maxX = Math.max(maxX, elRect.right - canvasRect.left + scrollLeft);
            maxY = Math.max(maxY, elRect.bottom - canvasRect.top + scrollTop);

            // Store individual element rect for render
            newElementRects.set(id, {
              left: elLeft,
              top: elTop,
              width: elRect.width,
              height: elRect.height,
            });
          }
        });

        if (minX !== Infinity) {
          setRect({
            left: minX,
            top: minY,
            width: maxX - minX,
            height: maxY - minY,
          });
          setElementRects(newElementRects);
        }
      } else {
        // Clear element rects for single selection
        setElementRects(new Map());
        // Single element selection
        const element = document.querySelector(`[data-aqb-id="${effectiveIds[0]}"]`) as HTMLElement;

        if (element) {
          const elementRect = element.getBoundingClientRect();
          // Add scroll offset to convert viewport coords to canvas coords
          setRect({
            left: elementRect.left - canvasRect.left + scrollLeft,
            top: elementRect.top - canvasRect.top + scrollTop,
            width: elementRect.width,
            height: elementRect.height,
          });
        }
      }
    };

    // RAF-throttled version for scroll/resize events to prevent layout thrashing
    const updateRectThrottled = () => {
      if (rafId !== null) return; // Already scheduled
      rafId = requestAnimationFrame(() => {
        rafId = null;
        updateRect();
      });
    };

    updateRect();

    // Use ResizeObserver for efficient size change detection (replaces setInterval polling)
    const resizeObserver = new ResizeObserver(() => {
      updateRect();
    });

    // Observe the canvas for overall layout changes
    const canvas = document.querySelector(".aqb-canvas") as HTMLElement;
    if (canvas) {
      resizeObserver.observe(canvas);
    }

    // Observe all selected elements for size changes
    effectiveIds.forEach((id) => {
      const element = document.querySelector(`[data-aqb-id="${id}"]`);
      if (element) {
        resizeObserver.observe(element);
      }
    });

    // MutationObserver for attribute/style changes that might affect position
    const mutationObserver = new MutationObserver((mutations) => {
      // Only update if style or position-related attributes changed
      const shouldUpdate = mutations.some(
        (m) =>
          m.type === "attributes" && (m.attributeName === "style" || m.attributeName === "class")
      );
      if (shouldUpdate) {
        updateRect();
      }
    });

    // Observe selected elements for style changes
    effectiveIds.forEach((id) => {
      const element = document.querySelector(`[data-aqb-id="${id}"]`);
      if (element) {
        mutationObserver.observe(element, {
          attributes: true,
          attributeFilter: ["style", "class"],
        });
      }
    });

    // Use RAF-throttled version for scroll/resize to prevent layout thrashing
    // CRITICAL: { passive: true } prevents scroll jank by telling browser we won't call preventDefault
    // Define options once to ensure add/remove use identical values (prevents memory leaks)
    const scrollListenerOptions: AddEventListenerOptions = { capture: true, passive: true };
    const resizeListenerOptions: AddEventListenerOptions = { passive: true };

    window.addEventListener("scroll", updateRectThrottled, scrollListenerOptions);
    window.addEventListener("resize", updateRectThrottled, resizeListenerOptions);

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener("scroll", updateRectThrottled, scrollListenerOptions);
      window.removeEventListener("resize", updateRectThrottled, resizeListenerOptions);
      // Cancel any pending RAF on cleanup
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [effectiveIds.join(","), isMultiSelect]);

  // Handle mouse down on a handle
  const handleMouseDown = (handle: HandlePosition, e: React.MouseEvent) => {
    if (!startResize) {
      return;
    }
    startResize(handle, e);
  };

  // Safe variables for unconditional render
  const safeRect = rect || { left: 0, top: 0, width: 0, height: 0 };
  const showOverlay = !!(rect && elementId);
  const displayRect = currentBounds
    ? {
        left: currentBounds.x,
        top: currentBounds.y,
        width: currentBounds.width,
        height: currentBounds.height,
      }
    : { left: safeRect.left, top: safeRect.top, width: safeRect.width, height: safeRect.height };

  // GSAP animation hook - DISABLED FOR STABILITY
  /*
  useSelectionAnimation(selectionBorderRef, showOverlay ? displayRect : null);
  */
  // Animation hook disabled for stability
  // useSelectionAnimation(selectionBorderRef, showOverlay ? displayRect : null);

  // Return null if not valid, catching the render at the very end
  // (After all hooks have run)
  if (!showOverlay) return null;

  const { left, top, width, height } = displayRect;

  return (
    <div
      className="aqb-selection-box"
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: Z_LAYERS.selectionBox,
        overflow: "visible",
      }}
    >
      {/* Selection border - single element or combined bounding box */}
      <div
        ref={selectionBorderRef}
        style={{
          position: "absolute",
          left: left - 1,
          top: top - 1,
          width: width + 2,
          height: height + 2,
          border: isMultiSelect
            ? `1px dashed ${SELECTION_VARS.alpha40}`
            : `1px solid ${SELECTION_VARS.primary}`,
          borderRadius: "3px",
          pointerEvents: "none",
          boxShadow: isMultiSelect ? "none" : SELECTION_VARS.glow,
          // No infinite animation - only appear animation via CSS class
          willChange: "left, top, width, height, transform, opacity",
        }}
      />

      {/* Individual element outlines for multi-select - primary vs secondary */}
      {/* Uses cached elementRects from effect to avoid DOM queries in render */}
      {isMultiSelect &&
        effectiveIds.map((id) => {
          const isPrimary = id === elementId;
          const elRect = elementRects.get(id);
          if (!elRect) return null;

          return (
            <div
              key={`outline-${id}`}
              style={{
                position: "absolute",
                left: elRect.left - 1,
                top: elRect.top - 1,
                width: elRect.width + 2,
                height: elRect.height + 2,
                border: isPrimary
                  ? `1px solid ${SELECTION_VARS.primary}`
                  : `1px dashed ${SELECTION_VARS.alpha40}`,
                borderRadius: "3px",
                pointerEvents: "none",
                boxShadow: isPrimary ? SELECTION_VARS.glow : "none",
              }}
            />
          );
        })}

      {/* CMS Binding indicator badge */}
      {hasCMSBindings && !isMultiSelect && (
        <div
          style={{
            position: "absolute",
            left: left - 12,
            top: top - 12,
            width: 20,
            height: 20,
            background: SELECTION_VARS.gradient,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: SELECTION_VARS.glowSm,
            pointerEvents: "none",
            zIndex: Z_LAYERS.selectionBadge,
          }}
          title="Element has CMS binding"
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
          >
            <ellipse cx="12" cy="5" rx="9" ry="3" />
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
          </svg>
        </div>
      )}

      {/* Locked badge — shown instead of resize handles for locked elements */}
      {isElementLocked && !isMultiSelect && (
        <div
          title="Element is locked. Unlock in Layers panel."
          style={{
            position: "absolute",
            left: left + width / 2 - 8,
            top: top - 20,
            width: 16,
            height: 16,
            background: "var(--aqb-warning, #f59e0b)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            zIndex: Z_LAYERS.selectionBadge,
          }}
          aria-label="Element is locked"
        >
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
      )}

      {/* Resize handles — hidden for locked elements */}
      {!isElementLocked && (
        <SelectionHandles
          left={left}
          top={top}
          width={width}
          height={height}
          onHandleMouseDown={handleMouseDown}
        />
      )}

      {/* Rotation handle — hidden for locked and multi-select */}
      {!isMultiSelect && !isElementLocked && (
        <div
          style={{
            position: "absolute",
            left: left + width / 2,
            top: top - ROTATION_HANDLE_OFFSET - 8,
            width: 1,
            height: ROTATION_HANDLE_OFFSET - 4,
            backgroundColor: SELECTION_VARS.primary,
            pointerEvents: "none",
            transform: "translateX(-50%)",
          }}
        />
      )}
      {!isMultiSelect && !isElementLocked && (
        <div
          style={{
            position: "absolute",
            left: left + width / 2 - 6,
            top: top - ROTATION_HANDLE_OFFSET - 8 - 6,
            width: 12,
            height: 12,
            backgroundColor: "white",
            border: `2px solid ${SELECTION_VARS.primary}`,
            borderRadius: "50%",
            cursor: "grab",
            pointerEvents: "auto",
            boxShadow: SELECTION_VARS.glowSm,
            transition: "transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (startRotation) {
              startRotation(e);
              setIsRotating(true);
            }
          }}
          onMouseUp={() => setIsRotating(false)}
          title="Drag to rotate (Shift for 15° snap)"
          aria-label="Rotation handle - drag to rotate element"
          role="slider"
          aria-valuemin={0}
          aria-valuemax={360}
          aria-valuenow={((rotationDegrees % 360) + 360) % 360}
        />
      )}

      {/* Size indicator while resizing */}
      {isResizing && (
        <div
          style={{
            position: "absolute",
            left: left + width / 2,
            top: top + height + 8,
            transform: "translateX(-50%)",
            background: SELECTION_VARS.primary,
            color: "white",
            padding: "2px 8px",
            borderRadius: "4px",
            fontSize: "11px",
            fontFamily: "monospace",
            whiteSpace: "nowrap",
            pointerEvents: "none",
          }}
        >
          {Math.round(width)} × {Math.round(height)}
        </div>
      )}

      {/* Multi-select toolbar with alignment tools */}
      {isMultiSelect && composer && (
        <div
          style={{
            position: "absolute",
            left: left + width / 2,
            top: top - 48,
            transform: "translateX(-50%)",
            zIndex: Z_LAYERS.alignmentToolbar,
          }}
        >
          <AlignmentToolbar composer={composer} selectedIds={selectedIds} />
        </div>
      )}
    </div>
  );
};

// Wrap with React.memo for performance - prevents re-renders when parent state changes
// but selection state (elementId, selectedIds) remains the same
export const SelectionBoxOverlay = React.memo(SelectionBoxOverlayComponent);

export default SelectionBoxOverlay;
