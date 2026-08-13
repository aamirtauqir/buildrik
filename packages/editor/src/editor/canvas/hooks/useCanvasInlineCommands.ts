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
import { devLog } from "../../../shared/utils/devLogger";
import { isSafeUrl } from "../../../shared/utils/html";

interface UseCanvasInlineCommandsParams {
  canvasRef: React.RefObject<HTMLDivElement | null>;
  editingId: string | null;
}

/**
 * Rich text inline editing commands using Selection API.
 * Supports bold, italic, underline, strikethrough, insertText,
 * createLink, unlink, and formatBlock.
 */
export function useCanvasInlineCommands({
  canvasRef,
  editingId,
}: UseCanvasInlineCommandsParams) {
  const handleInlineCommand = React.useCallback(
    (command: string, value?: string) => {
      const editingEl = canvasRef.current?.querySelector(
        `[data-buildrick-id="${editingId}"]`
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
          // Reject unsafe schemes (javascript:, non-media data:, etc.) before
          // they become a clickable link in the user's content.
          if (value && isSafeUrl(value)) {
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
        /* Everything the toolbar can emit that is not hand-built above:
           lists, the four alignments, indent/outdent, size and the two colours.
           ELEVEN of the toolbar's eighteen controls used to fall past this
           switch into the log below — they rendered, took the click, and did
           nothing, silently, because devLog is a no-op outside development.

           These are hand-built as tag surgery only where the markup matters
           (bold/italic/underline/strike, above, so the canvas gets <strong> and
           <em> rather than execCommand's <b>/<i>). For list, block-alignment
           and indent structure there is no equivalent worth writing by hand:
           contenteditable already implements them, and the result is sanitized
           on the very next lines before it reaches the element tree. */
        case "insertUnorderedList":
        case "insertOrderedList":
        case "justifyLeft":
        case "justifyCenter":
        case "justifyRight":
        case "justifyFull":
        case "outdent":
        case "indent":
        case "fontSize": {
          document.execCommand(command, false, value);
          break;
        }

        case "foreColor":
        case "hiliteColor": {
          /* Colours need CSS-mode on, or Chrome emits <font color> for
             foreColor and ignores hiliteColor entirely. styleWithCSS is
             per-document state, so it is set immediately before use rather
             than once at mount. */
          document.execCommand("styleWithCSS", false, "true");
          document.execCommand(command, false, value);
          document.execCommand("styleWithCSS", false, "false");
          break;
        }

        default:
          devLog("Canvas", `Unsupported inline command: ${command}`);
      }

      /* No setContent here. Persisting mid-session made the engine re-render
         the element, which destroyed the contentEditable session on the FIRST
         toolbar click — format applied, editing over, in a toolbar of
         eighteen controls. The live DOM already holds every edit;
         useCanvasInlineEdit's finishEdit(true) sanitizes and persists the
         final markup once, when the session actually ends (Enter, Escape,
         click-outside). One writer, one transaction, one undo step. */
    },
    [editingId, canvasRef]
  );

  return { handleInlineCommand };
}
