import * as React from "react";
import type { Composer } from "../../../../engine";
import { TabFrame } from "@/shared/extensions/TabFrame";
import { ScopeChip } from "./ScopeChip";
import { ChatThread } from "./ChatThread";
import { Composer as PromptComposer } from "./Composer";
import { useAIScope } from "./hooks/useAIScope";
import { useStreamPrompt, toServerScope } from "./hooks/useStreamPrompt";
import { applyAiEdit } from "./applySetStyle";
import { DEFAULT_MODEL, type AIModel, type ChatMessage, type DiffEdit } from "./types";
import "./AITab.css";

export interface AITabProps {
  composer: Composer | null;
  isPinned: boolean;
  onPinToggle: () => void;
  onHelpClick: () => void;
  onClose: () => void;
}

export const AITab: React.FC<AITabProps> = ({ composer, onHelpClick, onClose }) => {
  const { scope, status, lock, unlock } = useAIScope(composer);
  const stream = useStreamPrompt();
  const [model, setModel] = React.useState<AIModel>(DEFAULT_MODEL);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const streamingMsgIdRef = React.useRef<string | null>(null);

  const submit = React.useCallback((text: string) => {
    const serverScope = toServerScope(scope);
    if (!serverScope) {
      // Multi-select (or no scope): surface a message instead of a silent no-op.
      setMessages((prev) => [
        ...prev,
        {
          id: `sys-${Date.now()}`,
          role: "assistant",
          text: "AI editing supports one element at a time in v1 — select a single element.",
          createdAt: Date.now(),
        },
      ]);
      return;
    }
    lock();
    const userId = `u-${Date.now()}`;
    const aId = `a-${Date.now() + 1}`;
    streamingMsgIdRef.current = aId;
    setMessages((prev) => [
      ...prev,
      { id: userId, role: "user", text, createdAt: Date.now() },
      { id: aId, role: "assistant", text: "", streaming: true, createdAt: Date.now() },
    ]);
    // When an element is selected, the sidebar AI edits it (command batch the
    // user accepts) — same pipeline as the in-canvas popover. Page scope stays
    // a text chat until page-level generation lands.
    stream.start({
      prompt: text,
      scope: serverScope,
      model,
      intent: serverScope.kind === "element" ? "style-command" : "text",
    });
  }, [scope, model, lock, stream]);

  React.useEffect(() => {
    if (!streamingMsgIdRef.current) return;
    setMessages((prev) =>
      prev.map((m) =>
        m.id === streamingMsgIdRef.current
          ? { ...m, text: stream.text, streaming: stream.streaming, stopped: stream.stopped, edit: stream.edit ?? m.edit }
          : m,
      ),
    );
    if (!stream.streaming) {
      streamingMsgIdRef.current = null;
      // Unlock on any completion (done or stopped). Previously only `stopped`
      // unlocked, so a normal completion left the scope locked and the user
      // couldn't select a new element for the next edit.
      unlock();
    }
  }, [stream.text, stream.streaming, stream.stopped, stream.edit, unlock]);

  const onAccept = React.useCallback((msgId: string) => {
    const msg = messages.find((m) => m.id === msgId);
    if (msg?.edit && composer) {
      // Apply the command batch in one transaction (one undo step). A bad
      // element id throws but the transaction still closes (endTransaction in
      // finally) and the partial edit is recorded as one undoable entry.
      try { applyAiEdit(composer, msg.edit); } catch { /* partial recorded */ }
    }
    setMessages((prev) => prev.map((m) => m.id === msgId && m.edit ? { ...m, edit: { ...m.edit, state: "applied" } } : m));
    unlock();
  }, [messages, composer, unlock]);

  const onReject = React.useCallback((msgId: string) => {
    setMessages((prev) => prev.map((m) => m.id === msgId && m.edit ? { ...m, edit: { ...m.edit, state: "rejected" } } : m));
    unlock();
  }, [unlock]);

  const onRegenerate = React.useCallback((msgId: string) => {
    const idx = messages.findIndex((m) => m.id === msgId);
    if (idx < 1) return;
    const userMsg = messages[idx - 1];
    if (userMsg.role !== "user") return;
    submit(userMsg.text);
  }, [messages, submit]);

  return (
    <TabFrame className="bd-ai-tab">
      <TabFrame.Header
        title="AI"
        subtitle="Chat with Claude to edit your page"
        onHelpClick={onHelpClick}
        onClose={onClose}
      />
      <ScopeChip scope={scope} status={status} />
      <ChatThread
        messages={messages}
        onAccept={onAccept}
        onReject={onReject}
        onRegenerate={onRegenerate}
        onPreviewEnter={() => {}}
        onPreviewLeave={() => {}}
      />
      <PromptComposer
        model={model}
        onModelChange={setModel}
        onSubmit={submit}
        onStop={stream.stop}
        streaming={stream.streaming}
      />
    </TabFrame>
  );
};

export default AITab;
