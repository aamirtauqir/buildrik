/**
 * Canvas Keyboard Hook — WCAG 2.1 AA keyboard navigation for canvas elements.
 * Keys: Tab/Shift+Tab (cycle) | Arrows (navigate) | Alt+Arrows (reorder)
 * Ctrl+Arrow (move 1px) | Shift+Arrow (10px) | Del (delete) | Esc (clear)
 * Ctrl+D (duplicate) | Ctrl+A (select all) | Shift+F10 (context menu)
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine/Composer";
import type { Element } from "../../../engine/elements/Element";
import type { ToastAction, ToastVariant } from "../../../shared/ui/Toast";
import { devLogger } from "../../../shared/utils/devLogger";
import { getElementNameFromType } from "../utils/elementInfo";
import {
  getNavigationTargets,
  getAllNavigableElements,
  moveElementPosition,
  reorderElement,
} from "./keyboard/keyboardHelpers";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface UseCanvasKeyboardOptions {
  composer: Composer | null;
  selectedId: string | null;
  selectedIds?: string[]; // ADD: full multi-select set
  editingId: string | null;
  select: (elementOrId: Element | string | null) => void;
  clear: () => void;
  syncFromComposer: () => void;
  onOpenContextMenu?: (elementId: string, position: { x: number; y: number }) => void;
  /** Toast function for showing undo notifications */
  addToast?: (toast: {
    message: string;
    variant?: ToastVariant;
    duration?: number;
    action?: ToastAction;
  }) => void;
}

export interface UseCanvasKeyboardResult {
  handleKeyDown: (e: React.KeyboardEvent) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Hook for handling keyboard navigation and shortcuts on the canvas.
 * Pure helper functions are in ./keyboard/keyboardHelpers.ts.
 */
export function useCanvasKeyboard({
  composer,
  selectedId,
  selectedIds = [],
  editingId,
  select,
  clear,
  syncFromComposer,
  onOpenContextMenu,
  addToast,
}: UseCanvasKeyboardOptions): UseCanvasKeyboardResult {
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (!composer || editingId) return;
      if ((e.target as HTMLElement)?.closest("input, textarea, [contenteditable]")) return;

      // Ctrl+A: Select All elements
      if ((e.key === "a" || e.key === "A") && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        devLogger.keyboard("select-all");
        composer.selection.selectAll();
        return;
      }

      // Tab: Cycle through ALL elements (root excluded — cannot be moved/edited)
      if (e.key === "Tab") {
        e.preventDefault();
        const tabRootId = composer.elements.getActivePage()?.root?.id ?? null;
        const allElements = getAllNavigableElements(composer, tabRootId);
        if (allElements.length === 0) return;

        const currentIndex = selectedId
          ? allElements.findIndex((el) => el.getId() === selectedId)
          : -1;

        let nextIndex: number;
        if (e.shiftKey) {
          nextIndex = currentIndex <= 0 ? allElements.length - 1 : currentIndex - 1;
        } else {
          nextIndex = currentIndex >= allElements.length - 1 ? 0 : currentIndex + 1;
        }

        select(allElements[nextIndex]);
        return;
      }

      // Shift+F10: Open context menu (standard accessibility shortcut)
      if (e.key === "F10" && e.shiftKey && selectedId) {
        e.preventDefault();
        const element = document.querySelector(`[data-aqb-id="${selectedId}"]`);
        if (element && onOpenContextMenu) {
          const rect = element.getBoundingClientRect();
          onOpenContextMenu(selectedId, {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
          });
        }
        return;
      }

      // Handle delete with focus management and undo toast
      if (e.key === "Delete" || e.key === "Backspace") {
        // Multi-select delete: remove all selected elements in a single transaction
        if (selectedIds.length > 1) {
          e.preventDefault();
          e.stopPropagation();

          // Get root ID to exclude it from deletion
          const page = composer.elements.getActivePage();
          const rootId = page?.root?.id;

          // Take immutable snapshot, filter out root and locked elements
          const idsToDelete = [...selectedIds]
            .filter((id) => id !== rootId)
            .filter((id) => {
              const el = composer.elements.getElement(id);
              return el && !el.isLocked?.();
            });

          if (idsToDelete.length === 0) return;

          devLogger.keyboard("delete-multi", { count: idsToDelete.length });

          composer.beginTransaction("delete-element");
          try {
            idsToDelete.forEach((id) => {
              composer.elements.removeElement(id);
            });
          } finally {
            composer.endTransaction();
          }

          composer.selection.clear();
          syncFromComposer(); // force React to re-read SSOT after mutation

          if (addToast) {
            addToast({
              message: `Deleted ${idsToDelete.length} elements`,
              variant: "info",
              duration: 4000,
              action: {
                label: "Undo",
                onClick: () => {
                  composer.history.undo();
                  syncFromComposer();
                },
              },
            });
          }

          return;
        }

        // Single-select delete: preserve focus management and child count toast
        if (!selectedId) return;
        devLogger.keyboard("delete", { elementId: selectedId });

        const element = composer.elements.getElement(selectedId);
        if (!element) return;

        const page = composer.elements.getActivePage();
        const isRoot = page?.root?.id === selectedId;

        if (!isRoot) {
          e.preventDefault();
          e.stopPropagation();

          const elementType = element.getType?.() || "element";
          const elementName = getElementNameFromType(elementType);
          const childCount = element.getChildren?.()?.length || 0;

          const { next, prev, parent } = getNavigationTargets(element);
          const nextFocus = next || prev || parent;

          composer.beginTransaction("delete-element");
          try {
            composer.elements.removeElement(selectedId);
            if (nextFocus) {
              select(nextFocus);
            } else {
              clear();
            }
            syncFromComposer();

            if (addToast) {
              const message =
                childCount > 0
                  ? `${elementName} (${childCount} ${childCount === 1 ? "child" : "children"}) deleted`
                  : `${elementName} deleted`;

              addToast({
                message,
                variant: "info",
                duration: 5000,
                action: {
                  label: "Undo",
                  onClick: () => {
                    composer.history.undo();
                    syncFromComposer();
                  },
                },
              });
            }
          } finally {
            composer.endTransaction();
          }
        }
        return;
      }

      if (!selectedId) return;

      const element = composer.elements.getElement(selectedId);
      if (!element) return;

      const page = composer.elements.getActivePage();
      const isRoot = page?.root?.id === selectedId;
      const { prev, next, parent, firstChild } = getNavigationTargets(element);

      switch (e.key) {
        case "Escape":
          e.preventDefault();
          devLogger.keyboard("escape");
          clear();
          break;

        case "ArrowUp":
          e.preventDefault();
          if ((e.metaKey || e.ctrlKey) && !e.altKey && !isRoot) {
            moveElementPosition(composer, selectedId, 0, -1);
          } else if (e.shiftKey && !e.altKey && !isRoot) {
            moveElementPosition(composer, selectedId, 0, -10);
          } else if (e.altKey && !isRoot) {
            reorderElement(element, composer, selectedId, "up");
          } else if (prev) {
            select(prev);
          }
          break;

        case "ArrowDown":
          e.preventDefault();
          if ((e.metaKey || e.ctrlKey) && !e.altKey && !isRoot) {
            moveElementPosition(composer, selectedId, 0, 1);
          } else if (e.shiftKey && !e.altKey && !isRoot) {
            moveElementPosition(composer, selectedId, 0, 10);
          } else if (e.altKey && !isRoot) {
            reorderElement(element, composer, selectedId, "down");
          } else if (next) {
            select(next);
          }
          break;

        case "ArrowLeft":
          e.preventDefault();
          if ((e.metaKey || e.ctrlKey) && !e.altKey && !isRoot) {
            moveElementPosition(composer, selectedId, -1, 0);
          } else if (e.shiftKey && !e.altKey && !isRoot) {
            moveElementPosition(composer, selectedId, -10, 0);
          } else if (parent) {
            select(parent);
          }
          break;

        case "ArrowRight":
          e.preventDefault();
          if ((e.metaKey || e.ctrlKey) && !e.altKey && !isRoot) {
            moveElementPosition(composer, selectedId, 1, 0);
          } else if (e.shiftKey && !e.altKey && !isRoot) {
            moveElementPosition(composer, selectedId, 10, 0);
          } else if (firstChild) {
            select(firstChild);
          }
          break;

        case "Home":
          e.preventDefault();
          if (e.altKey && !isRoot) {
            reorderElement(element, composer, selectedId, "first");
          } else if (parent) {
            const siblings = parent.getChildren?.() || [];
            if (siblings.length > 0) {
              select(siblings[0]);
            }
          }
          break;

        case "End":
          e.preventDefault();
          if (e.altKey && !isRoot) {
            reorderElement(element, composer, selectedId, "last");
          } else if (parent) {
            const siblings = parent.getChildren?.() || [];
            if (siblings.length > 0) {
              select(siblings[siblings.length - 1]);
            }
          }
          break;

        case "d":
        case "D":
          if ((e.ctrlKey || e.metaKey) && !isRoot) {
            e.preventDefault();
            devLogger.keyboard("duplicate", { elementId: selectedId });
            const cloned = composer.elements.duplicateElement(selectedId);
            if (cloned) {
              select(cloned);
              if (addToast) {
                const elementType = element.getType?.() || "element";
                const elementName = getElementNameFromType(elementType);
                addToast({
                  message: `${elementName} duplicated`,
                  variant: "success",
                  duration: 2000,
                });
              }
            }
          }
          break;

        case "c":
        case "C":
          if ((e.ctrlKey || e.metaKey) && e.altKey) {
            // Cmd/Ctrl+Option+C: Copy styles only
            e.preventDefault();
            const styles = element.getStyles?.();
            if (styles && Object.keys(styles).length > 0) {
              composer.styleClipboard = { ...styles };
              if (addToast) {
                const styleCount = Object.keys(styles).length;
                addToast({
                  message: `${styleCount} style${styleCount === 1 ? "" : "s"} copied`,
                  variant: "info",
                  duration: 2000,
                });
              }
            } else if (addToast) {
              addToast({
                message: "No styles to copy",
                variant: "warning",
                duration: 2000,
              });
            }
          } else if ((e.ctrlKey || e.metaKey) && !e.altKey) {
            // Cmd/Ctrl+C: Copy element
            e.preventDefault();
            const elementType = element.getType?.() || "element";
            const elementName = getElementNameFromType(elementType);
            composer.clipboard = element.toJSON?.() || null;
            if (addToast) {
              addToast({
                message: `${elementName} copied to clipboard`,
                variant: "info",
                duration: 2000,
              });
            }
          }
          break;

        case "v":
        case "V":
          if ((e.ctrlKey || e.metaKey) && e.altKey && composer.styleClipboard) {
            // Cmd/Ctrl+Option+V: Paste styles only
            e.preventDefault();
            const stylesToPaste = composer.styleClipboard;
            const styleKeys = Object.keys(stylesToPaste);

            if (styleKeys.length > 0) {
              composer.beginTransaction("paste-styles");
              try {
                styleKeys.forEach((key) => {
                  element.setStyle?.(key, stylesToPaste[key]);
                });
                syncFromComposer();
                if (addToast) {
                  addToast({
                    message: `${styleKeys.length} style${styleKeys.length === 1 ? "" : "s"} applied`,
                    variant: "success",
                    duration: 2000,
                    action: {
                      label: "Undo",
                      onClick: () => {
                        composer.history.undo();
                        syncFromComposer();
                      },
                    },
                  });
                }
              } finally {
                composer.endTransaction();
              }
            }
          } else if ((e.ctrlKey || e.metaKey) && !e.altKey && composer.clipboard) {
            // Cmd/Ctrl+V: Paste element
            e.preventDefault();
            const parentEl = element.getParent?.();
            if (parentEl) {
              composer.beginTransaction("paste-element");
              try {
                const pastedElement = composer.elements.pasteElement?.(
                  composer.clipboard,
                  parentEl
                );
                if (pastedElement) {
                  select(pastedElement);
                  syncFromComposer();
                  if (addToast) {
                    addToast({
                      message: "Element pasted",
                      variant: "success",
                      duration: 2000,
                    });
                  }
                }
              } finally {
                composer.endTransaction();
              }
            }
          }
          break;

        case "x":
        case "X":
          // Cmd/Ctrl+X: Cut element (copy + delete)
          if ((e.ctrlKey || e.metaKey) && !isRoot) {
            e.preventDefault();
            const elementType = element.getType?.() || "element";
            const elementName = getElementNameFromType(elementType);

            composer.clipboard = element.toJSON?.() || null;

            const { next: nextEl, prev: prevEl, parent: parentEl } = getNavigationTargets(element);
            const nextFocus = nextEl || prevEl || parentEl;

            composer.beginTransaction("cut-element");
            try {
              composer.elements.removeElement(selectedId);
              if (nextFocus) {
                select(nextFocus);
              } else {
                clear();
              }
              syncFromComposer();

              if (addToast) {
                addToast({
                  message: `${elementName} cut to clipboard`,
                  variant: "info",
                  duration: 3000,
                  action: {
                    label: "Undo",
                    onClick: () => {
                      composer.history.undo();
                      syncFromComposer();
                    },
                  },
                });
              }
            } finally {
              composer.endTransaction();
            }
          }
          break;
      }
    },
    [
      composer,
      selectedId,
      selectedIds,
      editingId,
      select,
      clear,
      syncFromComposer,
      onOpenContextMenu,
      addToast,
    ]
  );

  return { handleKeyDown };
}

export default useCanvasKeyboard;
