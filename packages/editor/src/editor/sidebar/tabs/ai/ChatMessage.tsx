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
        {streaming && !text ? <p className="tw:m-0 tw:bg-[var(--bk-accent-tint)] tw:px-4 tw:py-2 tw:text-[13px] tw:text-[var(--bk-accent)]">Thinking…</p> : null}
        {text ? <p>{text}</p> : null}
        {error ? <p className="bd-ai-msg-error" role="alert">{error}</p> : null}
        {stopped && <span className="bd-ai-msg-stopped">(stopped)</span>}
      </div>
      {edit && (
        <div className="bd-ai-msg-edit">
          {/* Board 171:67's result card: how many changes, then what they are.
              The undo promise is true HERE — a chat edit applies inside one
              transaction (applySetStyle), unlike a multi-step agent run. */}
          <p className="tw:mt-0 tw:mb-1 tw:text-[13px] tw:font-medium tw:text-[var(--bk-success-text)]">
            {edit.rows.length || 1} change{(edit.rows.length || 1) === 1 ? "" : "s"} proposed
          </p>
          <DiffRows edit={edit} />
          {edit.state === "pending" ? (
            <div className="bd-ai-msg-edit-actions">
              <Button
                type="button"
                color="light"
                aria-label="Discard"
                onClick={() => onReject(message.id)} className="tw:border-transparent tw:bg-transparent tw:text-[var(--bk-ink-soft)] tw:hover:text-[var(--bk-ink)]"
              >Discard</Button>
              <Button
                type="button"
                aria-label="Apply changes"
                onClick={() => onAccept(message.id)}
              >Apply</Button>
            </div>
          ) : (
            <span className="bd-ai-msg-edit-state">
              {/* Three outcomes, not two. "invalid" is Apply on a batch that
                  reached the canvas with nothing this editor could map — it
                  used to read "✓ Applied" over an unchanged page. */}
              {edit.state === "applied"
                ? "✓ Applied"
                : edit.state === "invalid"
                  ? "Nothing to apply — no change this editor can make"
                  : "Discarded"}
            </span>
          )}
          {edit.state === "pending" ? (
            <p className="tw:mt-1 tw:mb-0 tw:text-[12px] tw:text-[var(--bk-ink-muted)]">Apply lands as one undo step.</p>
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
