import * as React from "react";
import type { ChatMessage as ChatMessageType, DiffEdit } from "./types";
import { DiffRows } from "./DiffRows";
import { Button } from "@/editor/chrome-ui";

export interface ChatMessageProps {
  message: ChatMessageType;
  onAccept: (msgId: string) => void;
  onReject: (msgId: string) => void;
  onRegenerate: (msgId: string) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message, onAccept, onReject, onRegenerate,
}) => {
  const { role, text, streaming, stopped, edit, error } = message;
  return (
    <div className={`bd-ai-msg bd-ai-msg-${role}`}>
      <div className="bd-ai-msg-role">{role === "user" ? "You" : "Assistant"}</div>
      <div className={`bd-ai-msg-body${streaming ? " bd-ai-msg-streaming" : ""}`}>
        {/* Board 170:29 — before any text arrives the panel says "Thinking…"
            in a band of its own, rather than showing an empty bubble with a
            role label above it. */}
        {streaming && !text ? <p className="bd-ai-msg-thinking">Thinking…</p> : null}
        {text ? <p>{text}</p> : null}
        {error ? <p className="bd-ai-msg-error" role="alert">{error}</p> : null}
        {stopped && <span className="bd-ai-msg-stopped">(stopped)</span>}
      </div>
      {edit && (
        <div className="bd-ai-msg-edit">
          {/* Board 171:67's result card: how many changes, then what they are.
              The undo promise is true HERE — a chat edit applies inside one
              transaction (applySetStyle), unlike a multi-step agent run. */}
          <p className="bd-ai-msg-edit-head">
            {edit.rows.length || 1} change{(edit.rows.length || 1) === 1 ? "" : "s"} proposed
          </p>
          <DiffRows edit={edit} />
          {edit.state === "pending" ? (
            <div className="bd-ai-msg-edit-actions">
              <Button
                type="button"
                color="light"
                aria-label="Discard"
                onClick={() => onReject(message.id)} className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900"
              >Discard</Button>
              <Button
                type="button"
                aria-label="Apply changes"
                onClick={() => onAccept(message.id)}
              >Apply</Button>
            </div>
          ) : (
            <span className="bd-ai-msg-edit-state">
              {edit.state === "applied" ? "✓ Applied" : "Discarded"}
            </span>
          )}
          {edit.state === "pending" ? (
            <p className="bd-ai-msg-edit-foot">Apply lands as one undo step.</p>
          ) : null}
        </div>
      )}
      {role === "assistant" && !streaming && !edit && (
        <Button
          type="button"
          className="bd-ai-msg-regenerate"
          onClick={() => onRegenerate(message.id)}
        >↻ Regenerate</Button>
      )}
    </div>
  );
};
