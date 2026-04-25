import * as React from "react";
import type { ChatMessage as ChatMessageType, DiffEdit } from "./types";
import { ChatMessage } from "./ChatMessage";
import { EmptyThread } from "./EmptyThread";

export interface ChatThreadProps {
  messages: ChatMessageType[];
  onAccept: (msgId: string) => void;
  onReject: (msgId: string) => void;
  onRegenerate: (msgId: string) => void;
  onPreviewEnter: (edit: DiffEdit) => void;
  onPreviewLeave: (edit: DiffEdit) => void;
}

export const ChatThread: React.FC<ChatThreadProps> = ({ messages, ...handlers }) => {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!ref.current) return;
    ref.current.scrollTop = ref.current.scrollHeight;
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="bd-ai-thread" ref={ref}>
        <EmptyThread />
      </div>
    );
  }

  return (
    <div className="bd-ai-thread" ref={ref}>
      {messages.map((m) => (
        <ChatMessage key={m.id} message={m} {...handlers} />
      ))}
    </div>
  );
};
