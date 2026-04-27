import { Button } from "@/editor/shared/vibcoder/Button";
import * as React from "react";
import type { ChatMessage as ChatMessageType, DiffEdit } from "./types";

export interface ChatMessageProps {
  message: ChatMessageType;
  onAccept: (msgId: string) => void;
  onReject: (msgId: string) => void;
  onRegenerate: (msgId: string) => void;
  onPreviewEnter: (edit: DiffEdit) => void;
  onPreviewLeave: (edit: DiffEdit) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message, onRegenerate,
}) => {
  const { role, text, streaming, stopped } = message;
  return (
    <div className={`bd-ai-msg bd-ai-msg-${role}`}>
      <div className="bd-ai-msg-role">{role === "user" ? "You" : "Assistant"}</div>
      <div className={`bd-ai-msg-body${streaming ? " bd-ai-msg-streaming" : ""}`}>
        <p>{text}</p>
        {stopped && <span className="bd-ai-msg-stopped">(stopped)</span>}
      </div>
      {role === "assistant" && !streaming && (
        <Button
          type="button"
          className="bd-ai-msg-regenerate"
          onClick={() => onRegenerate(message.id)}
        >↻ Regenerate</Button>
      )}
    </div>
  );
};
