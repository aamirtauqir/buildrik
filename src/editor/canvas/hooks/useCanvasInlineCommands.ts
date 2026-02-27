/**
 * useCanvasInlineCommands
 * Handles rich text inline editing commands (bold, italic, link, etc.)
 * using modern Selection API instead of deprecated document.execCommand.
 *
 * Extracted from Canvas.tsx for maintainability.
 *
 * @module components/Canvas/hooks/useCanvasInlineCommands
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine";
import { devLog } from "../../../shared/utils/devLogger";

interface UseCanvasInlineCommandsParams {
  composer: Composer | null;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  editingId: string | null;
}

/**
 * Rich text inline editing commands using Selection API.
 * Supports bold, italic, underline, strikethrough, insertText,
 * createLink, unlink, and formatBlock.
 */
export function useCanvasInlineCommands({
  composer,
  canvasRef,
  editingId,
}: UseCanvasInlineCommandsParams) {
  const handleInlineCommand = React.useCallback(
    (command: string, value?: string) => {
      const editingEl = canvasRef.current?.querySelector(
        `[data-aqb-id="${editingId}"]`
      ) as HTMLElement | null;
      if (!editingEl) return;

      editingEl.focus();
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);

      switch (command) {
        case "bold":
        case "italic":
        case "underline":
        case "strikeThrough": {
          const tagMap: Record<string, string> = {
            bold: "strong",
            italic: "em",
            underline: "u",
            strikeThrough: "s",
          };
          const tagName = tagMap[command];
          if (!tagName) return;

          const parentTag = range.commonAncestorContainer.parentElement;
          if (parentTag?.tagName.toLowerCase() === tagName) {
            const parent = parentTag.parentNode;
            while (parentTag.firstChild) {
              parent?.insertBefore(parentTag.firstChild, parentTag);
            }
            parent?.removeChild(parentTag);
          } else {
            const wrapper = document.createElement(tagName);
            try {
              range.surroundContents(wrapper);
            } catch {
              const fragment = range.extractContents();
              wrapper.appendChild(fragment);
              range.insertNode(wrapper);
            }
          }
          break;
        }
        case "insertText": {
          if (value) {
            range.deleteContents();
            const textNode = document.createTextNode(value);
            range.insertNode(textNode);
            range.setStartAfter(textNode);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
          }
          break;
        }
        case "createLink": {
          if (value) {
            const link = document.createElement("a");
            link.href = value;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            try {
              range.surroundContents(link);
            } catch {
              const fragment = range.extractContents();
              link.appendChild(fragment);
              range.insertNode(link);
            }
          }
          break;
        }
        case "unlink": {
          const anchor = range.commonAncestorContainer.parentElement?.closest("a");
          if (anchor) {
            const parent = anchor.parentNode;
            while (anchor.firstChild) {
              parent?.insertBefore(anchor.firstChild, anchor);
            }
            parent?.removeChild(anchor);
          }
          break;
        }
        case "formatBlock": {
          if (value) {
            const block = document.createElement(value);
            const contents = range.extractContents();
            block.appendChild(contents);
            range.insertNode(block);
          }
          break;
        }
        default:
          devLog("Canvas", `Unsupported inline command: ${command}`);
      }

      // Notify composer of content change
      if (composer && editingId) {
        const newContent = editingEl.innerHTML;
        composer.elements.getElement(editingId)?.setContent(newContent);
      }
    },
    [editingId, composer, canvasRef]
  );

  return { handleInlineCommand };
}
