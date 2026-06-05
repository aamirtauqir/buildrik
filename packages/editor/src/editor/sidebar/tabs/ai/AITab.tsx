import * as React from "react";
import type { Composer } from "../../../../engine";
import { TabFrame } from "@/shared/extensions/TabFrame";
import { ScopeChip } from "./ScopeChip";
import { ChatThread } from "./ChatThread";
import { AgentPlan } from "./AgentPlan";
import { Composer as PromptComposer } from "./Composer";
import { useAIScope } from "./hooks/useAIScope";
import { useStreamPrompt, toServerScope } from "./hooks/useStreamPrompt";
import { useAgentRunner } from "./hooks/useAgentRunner";
import { applyAiEdit } from "./applySetStyle";
import { Button } from "@/editor/shared/vibcoder/Button";
import { trackAiEditApplied } from "@/services/ai/adoptionTracker";
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
  const [mode, setMode] = React.useState<"chat" | "agent">("chat");
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const streamingMsgIdRef = React.useRef<string | null>(null);
  const agent = useAgentRunner(composer, model);

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

    // Element scope edits the one element. Page scope (P3) attaches the page's
    // element list so the AI can edit across many elements in one batch
    // ("make the whole page modern"); that promotes page scope from chat to an
    // edit command batch the user accepts.
    let finalScope = serverScope;
    let intent: "text" | "style-command" =
      serverScope.kind === "element" ? "style-command" : "text";
    if (serverScope.kind === "page" && composer) {
      const elements = composer.elements
        .getAllElements()
        .map((el) => {
          const content = el.getContent?.();
          return {
            id: el.getId(),
            type: el.getType(),
            text: content ? String(content).slice(0, 200) : undefined,
          };
        })
        .filter((e) => e.id)
        .slice(0, 200);
      if (elements.length > 0) {
        finalScope = { kind: "page", elements };
        intent = "style-command";
      }
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
    stream.start({ prompt: text, scope: finalScope, model, intent });
  }, [scope, model, lock, stream, composer]);

  React.useEffect(() => {
    // Capture the streaming message id in a local BEFORE setMessages. The
    // functional updater runs during React's render pass — later than this
    // effect body — so reading `streamingMsgIdRef.current` inside it would see
    // the value AFTER the `= null` below ran, dropping the final chunk. The
    // final chunk is exactly the one carrying the edit (edit + done arrive in
    // one flush with streaming already false), so the edit was silently lost
    // and the canvas never changed. Bind the id locally to close the race.
    const targetId = streamingMsgIdRef.current;
    if (!targetId) return;
    setMessages((prev) =>
      prev.map((m) =>
        m.id === targetId
          ? { ...m, text: stream.text, streaming: stream.streaming, stopped: stream.stopped, edit: stream.edit ?? m.edit, error: stream.error ?? m.error }
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
  }, [stream.text, stream.streaming, stream.stopped, stream.edit, stream.error, unlock]);

  const onAccept = React.useCallback(async (msgId: string) => {
    const msg = messages.find((m) => m.id === msgId);
    if (msg?.edit && composer) {
      // Apply the command batch in one transaction (one undo step). A bad
      // element id throws but the transaction still closes (endTransaction in
      // finally) and the partial edit is recorded as one undoable entry.
      // applyAiEdit is async (some commands, e.g. insert-component, are async);
      // await so the "applied" state flips only after the mutation lands.
      try {
        await applyAiEdit(composer, msg.edit);
        trackAiEditApplied({ applyOps: msg.edit.applyOps, surface: "chat", model });
      } catch { /* partial recorded */ }
    }
    setMessages((prev) => prev.map((m) => m.id === msgId && m.edit ? { ...m, edit: { ...m.edit, state: "applied" } } : m));
    unlock();
  }, [messages, composer, unlock, model]);

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
      <div className="bd-ai-mode" role="tablist" aria-label="AI mode">
        <Button
          type="button"
          variant="bare"
          role="tab"
          aria-selected={mode === "chat"}
          className={`bd-ai-mode-btn${mode === "chat" ? " bd-ai-mode-active" : ""}`}
          onClick={() => setMode("chat")}
        >
          Chat
        </Button>
        <Button
          type="button"
          variant="bare"
          role="tab"
          aria-selected={mode === "agent"}
          className={`bd-ai-mode-btn${mode === "agent" ? " bd-ai-mode-active" : ""}`}
          onClick={() => setMode("agent")}
        >
          Agent
        </Button>
      </div>
      {mode === "chat" ? (
        <>
          <ScopeChip scope={scope} status={status} />
          <ChatThread
            messages={messages}
            onAccept={onAccept}
            onReject={onReject}
            onRegenerate={onRegenerate}
            onPreviewEnter={() => {}}
            onPreviewLeave={() => {}}
          />
        </>
      ) : (
        <AgentPlan
          phase={agent.phase}
          steps={agent.steps}
          currentIndex={agent.currentIndex}
          error={agent.error}
          autoApply={agent.autoApply}
          onAutoApplyChange={agent.setAutoApply}
          onApprove={agent.approve}
          onSkip={agent.skip}
          onStop={agent.stop}
        />
      )}
      <PromptComposer
        model={model}
        onModelChange={setModel}
        onSubmit={mode === "agent" ? agent.start : submit}
        onStop={mode === "agent" ? agent.stop : stream.stop}
        streaming={mode === "agent" ? agent.phase === "planning" || agent.phase === "running" : stream.streaming}
      />
    </TabFrame>
  );
};

export default AITab;
