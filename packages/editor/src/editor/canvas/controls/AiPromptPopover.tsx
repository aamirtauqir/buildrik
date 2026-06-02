/**
 * AiPromptPopover — in-canvas AI editing for the selected element.
 * Anchored under the selection toolbar. Flow: prompt -> streaming -> diff ->
 * accept (apply in one undo step) / reject (discard, no canvas write).
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "../../../engine";
import { Z_LAYERS } from "../../../shared/constants/canvas";
import { Textarea } from "@/editor/shared/vibcoder/Textarea";
import { Button } from "@/editor/shared/vibcoder/Button";
import { useStreamPrompt } from "../../sidebar/tabs/ai/hooks/useStreamPrompt";
import { applyAiEdit } from "../../sidebar/tabs/ai/applySetStyle";
import { DiffRows } from "../../sidebar/tabs/ai/DiffRows";
import { DEFAULT_MODEL } from "../../sidebar/tabs/ai/types";
import "./AiPromptPopover.css";

export interface AiPromptPopoverProps {
  composer: Composer;
  elementId: string;
  /** Absolute position within the canvas (below the selection toolbar). */
  top: number;
  left: number;
  onClose: () => void;
}

export const AiPromptPopover: React.FC<AiPromptPopoverProps> = ({
  composer,
  elementId,
  top,
  left,
  onClose,
}) => {
  const [text, setText] = React.useState("");
  const stream = useStreamPrompt();
  const trimmed = text.trim();
  const hasDiff = !!stream.edit && !stream.streaming;

  const submit = () => {
    if (!trimmed) return;
    stream.start({
      prompt: trimmed,
      scope: { kind: "element", id: elementId },
      model: DEFAULT_MODEL,
      intent: "style-command",
    });
  };

  const accept = () => {
    if (stream.edit) {
      // One transaction, one undo step. A stale element id throws but the
      // transaction still closes; the partial edit is recorded once.
      try {
        applyAiEdit(composer, stream.edit);
      } catch {
        /* partial recorded */
      }
    }
    onClose();
  };

  // Esc closes (discards) from any state.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  return (
    <div
      className="bd-ai-popover"
      style={{ top, left, zIndex: Z_LAYERS.floatingToolbar }}
      onMouseDown={stop}
      onClick={stop}
      role="dialog"
      aria-label="AI edit"
    >
      {stream.error ? (
        <div className="bd-ai-popover-error" role="alert">
          {stream.error}
        </div>
      ) : hasDiff ? (
        <>
          <DiffRows edit={stream.edit!} />
          <div className="bd-ai-popover-actions">
            <Button type="button" variant="bare" onClick={onClose} aria-label="Discard">
              Discard
            </Button>
            <Button type="button" onClick={accept} aria-label="Apply changes">
              Apply
            </Button>
          </div>
        </>
      ) : stream.streaming ? (
        <div className="bd-ai-popover-loading">Thinking…</div>
      ) : (
        <>
          <Textarea
            className="bd-ai-popover-input"
            placeholder="Describe a change… e.g. make this dark"
            aria-label="AI prompt"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            rows={2}
            autoFocus
          />
          <div className="bd-ai-popover-actions">
            <Button
              type="button"
              disabled={!trimmed}
              onClick={submit}
              aria-label="Generate change"
            >
              Generate
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default AiPromptPopover;
