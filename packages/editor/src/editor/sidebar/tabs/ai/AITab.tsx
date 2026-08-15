import * as React from "react";
import { ConfirmDialog, PanelFrame, Button } from "@/editor/chrome-ui";
import type { Composer } from "../../../../engine";
import { ScopeChip } from "./ScopeChip";
import { ChatThread } from "./ChatThread";
import { AgentPlan } from "./AgentPlan";
import { Composer as PromptComposer } from "./Composer";
import { useAIScope } from "./hooks/useAIScope";
import { useStreamPrompt, toServerScope } from "./hooks/useStreamPrompt";
import { gatherTokens, gatherMediaAssets } from "./hooks/aiScopeContext";
import { useAgentRunner } from "./hooks/useAgentRunner";
import { useAiActionGate } from "./hooks/useAiActionGate";
import { applyAiEdit } from "./applySetStyle";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";
import { trackAiEditApplied } from "@/services/ai/adoptionTracker";
import { DEFAULT_MODEL, type AIModel, type ChatMessage, type DiffEdit } from "./types";
import "./AITab.css";

export interface AITabProps {
  composer: Composer | null;
  isExpanded: boolean;
  onExpandToggle: () => void;
  onHelpClick?: () => void;
  onClose: () => void;
}

export const AITab: React.FC<AITabProps> = ({ composer, onHelpClick, onClose }) => {
  const { scope, status, lock, unlock } = useAIScope(composer);
  const stream = useStreamPrompt();
  // Not state: the server owns model choice (`resolveModelForUser` gates it by
  // plan and ignores a client hint it doesn't allow). The picker that used to
  // set this offered four models, three of which the server could never call —
  // a control that never controlled anything. Removed.
  const model: AIModel = DEFAULT_MODEL;
  const [mode, setMode] = React.useState<"chat" | "agent">("chat");
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const streamingMsgIdRef = React.useRef<string | null>(null);
  const actionGate = useAiActionGate(composer);
  const agent = useAgentRunner(composer, model, actionGate.propose);

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
        // Attach the token registry + media library so set-token / set-image
        // recall works in chat page mode (agent mode already did this; chat
        // dropped both, so the model guessed non-existent tokens/URLs).
        finalScope = {
          kind: "page",
          elements,
          tokens: gatherTokens(composer),
          assets: gatherMediaAssets(composer),
        };
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
        const { proposals } = await applyAiEdit(composer, msg.edit);
        trackAiEditApplied({ applyOps: msg.edit.applyOps, surface: "chat", model });
        // A privileged action (e.g. publish) was proposed — route it to the
        // explicit confirm gate instead of applying it to the canvas.
        if (proposals.length > 0) void actionGate.propose(proposals[0].actionId);
      } catch { /* partial recorded */ }
    }
    setMessages((prev) => prev.map((m) => m.id === msgId && m.edit ? { ...m, edit: { ...m.edit, state: "applied" } } : m));
    unlock();
  }, [messages, composer, unlock, model, actionGate]);

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
    <PanelFrame className="bd-ai-tab">
      <PanelFrame.Header
        title="AI"
        subtitle="Chat with AI to edit your page"
        onHelpClick={onHelpClick}
        onClose={onClose}
      />
      <div className="bd-ai-mode" role="tablist" aria-label="AI mode">
        <Button
          type="button"
          color="light"
          role="tab"
          aria-selected={mode === "chat"}
          className={`bd-ai-mode-btn${mode === "chat" ? " bd-ai-mode-active" : ""}`}
          onClick={() => setMode("chat")}
        >
          Chat
        </Button>
        <Button
          type="button"
          color="light"
          role="tab"
          aria-selected={mode === "agent"}
          className={`bd-ai-mode-btn${mode === "agent" ? " bd-ai-mode-active" : ""}`}
          onClick={() => setMode("agent")}
        >
          Agent
        </Button>
      </div>
      {/* Board 171:136 — a missing API key is a state, not an error line. The
          server already says so (PRECONDITION_FAILED from
          assertProviderConfigured); the panel used to print that message as
          grey text under the prompt and leave the composer inviting more. */}
      {stream.errorKind === "not-configured" ? (
        <div className="bd-ai-notconfigured">
          <p className="bd-ai-notconfigured__title">AI drafting isn&rsquo;t configured yet.</p>
          <p className="bd-ai-notconfigured__body">
            No API key is set for this workspace, so nothing here will run. This is the real
            message — not a silent fallback that pretends to work.
          </p>
          <Button
            color="light"
            size="xs"
            className="bd-ai-notconfigured__link"
            onClick={() => window.open(`${DASHBOARD_URL}/dashboard/settings`, "_blank")}
          >
            Open workspace settings
          </Button>
        </div>
      ) : mode === "chat" ? (
        <>
          <ScopeChip scope={scope} status={status} />
          <ChatThread
            messages={messages}
            onAccept={onAccept}
            onReject={onReject}
            onRegenerate={onRegenerate}
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
        onSubmit={mode === "agent" ? agent.start : submit}
        onStop={mode === "agent" ? agent.stop : stream.stop}
        streaming={mode === "agent" ? agent.phase === "planning" || agent.phase === "running" : stream.streaming}
      />
      <ConfirmDialog
        open={actionGate.state.open}
        title={actionGate.state.title}
        message={actionGate.state.consequence}
        confirmLabel={actionGate.state.busy ? "Publishing…" : "Publish"}
        cancelLabel="Cancel"
        
        onConfirm={actionGate.confirm}
        onClose={actionGate.cancel}
      />
    </PanelFrame>
  );
};

export default AITab;
