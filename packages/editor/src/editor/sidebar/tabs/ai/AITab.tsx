import * as React from "react";
import type { Composer } from "../../../../engine";
import { TabFrame } from "@/shared/extensions/TabFrame";
import { ScopeChip } from "./ScopeChip";
import { ChatThread } from "./ChatThread";
import { Composer as PromptComposer } from "./Composer";
import { useAIScope } from "./hooks/useAIScope";
import { useStreamPrompt, toServerScope } from "./hooks/useStreamPrompt";
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
    if (!serverScope) return;
    lock();
    const userId = `u-${Date.now()}`;
    const aId = `a-${Date.now() + 1}`;
    streamingMsgIdRef.current = aId;
    setMessages((prev) => [
      ...prev,
      { id: userId, role: "user", text, createdAt: Date.now() },
      { id: aId, role: "assistant", text: "", streaming: true, createdAt: Date.now() },
    ]);
    stream.start({ prompt: text, scope: serverScope, model });
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
      if (stream.stopped) unlock();
    }
  }, [stream.text, stream.streaming, stream.stopped, stream.edit, unlock]);

  const onAccept = React.useCallback((msgId: string) => {
    setMessages((prev) => prev.map((m) => m.id === msgId && m.edit ? { ...m, edit: { ...m.edit, state: "applied" } } : m));
    unlock();
  }, [unlock]);

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
