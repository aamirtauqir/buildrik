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
  /** Rendered in the inspector column (boards 170:2 · 66:225), where the way
   *  out is back to the inspector rather than a panel close. */
  onBack?: () => void;
}

export const AITab: React.FC<AITabProps> = ({ composer, onHelpClick, onClose, onBack }) => {
  const { scope, status, lock, unlock } = useAIScope(composer);
  const stream = useStreamPrompt();
  // Not state: the server owns model choice (`resolveModelForUser` gates it by
  // plan and ignores a client hint it doesn't allow). The picker that used to
  // set this offered four models, three of which the server could never call —
  // a control that never controlled anything. Removed.
  const model: AIModel = DEFAULT_MODEL;
  /* No mode toggle on any board: the idle state's DRAFT row is the way into
     a longer job (board 170:2), and the run's own end returns you. */
  const [mode, setMode] = React.useState<"chat" | "agent">("chat");
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const streamingMsgIdRef = React.useRef<string | null>(null);
  const actionGate = useAiActionGate(composer);
  const agent = useAgentRunner(composer, model, actionGate.propose);
  /* Board 171:2's Retry re-runs the same brief, so the panel has to remember
     it — the runner does not keep the prompt. */
  const lastAgentPrompt = React.useRef("");

  /* With the mode toggle gone, a finished or stopped run has to hand the panel
     back by itself — otherwise the plan's last frame would be the only thing
     left on screen with no way to ask anything else. */
  React.useEffect(() => {
    if (mode === "agent" && agent.phase === "idle") setMode("chat");
  }, [mode, agent.phase]);

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
      {/* Every AI board opens with "‹ Inspector" and a plain "AI" title — the
          panel lives in the inspector column, not beside it. The old header
          carried a subtitle ("Chat with AI to edit your page") no board has. */}
      {onBack ? (
        <div className="bd-ai-drillin">
          <Button
            color="light"
            size="xs"
            className="bd-ai-drillin__back"
            onClick={onBack}
            aria-label="Back to Inspector"
          >
            ‹ Inspector
          </Button>
          <div className="bd-ai-drillin__title">AI</div>
        </div>
      ) : (
        <PanelFrame.Header
          title="AI"
          onHelpClick={onHelpClick}
          onClose={onClose}
        />
      )}
      {/* Every AI board puts the scope band and the prompt directly under the
          title, with whatever the run is doing below them — the composer used
          to sit at the bottom, chat-style, under states that had replaced the
          thread entirely. */}
      <ScopeChip scope={scope} status={status} />
      <PromptComposer
        onSubmit={
          mode === "agent"
            ? (text: string) => {
                lastAgentPrompt.current = text;
                agent.start(text);
              }
            : submit
        }
        onStop={mode === "agent" ? agent.stop : stream.stop}
        streaming={mode === "agent" ? agent.phase === "planning" || agent.phase === "running" : stream.streaming}
      />

      {/* Boards 171:136 and 171:105 — "no key" and "no credit" are states,
          not error lines. The server already tells them apart
          (PRECONDITION_FAILED vs TOO_MANY_REQUESTS); the panel used to print
          either as grey text under a composer that still looked ready. */}
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
      ) : stream.errorKind === "quota" ? (
        <div className="bd-ai-notconfigured bd-ai-quota">
          <p className="bd-ai-quota__title">AI is out of credit.</p>
          <p className="bd-ai-notconfigured__body">
            {/* The server's own sentence carries the real limit and reset time
                — the board's "1 Aug" is sample data. */}
            Nothing was changed. {stream.error}
          </p>
          <Button
            color="light"
            size="xs"
            className="bd-ai-notconfigured__link"
            onClick={() => window.open(`${DASHBOARD_URL}/dashboard/settings/billing`, "_blank")}
          >
            See plans
          </Button>
        </div>
      ) : mode === "chat" ? (
        <>
          <ChatThread
            messages={messages}
            onAccept={onAccept}
            onReject={onReject}
            onRegenerate={onRegenerate}
            onTry={submit}
            onDraft={() => setMode("agent")}
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
          stoppedByUser={agent.stoppedByUser}
          onRetry={lastAgentPrompt.current ? () => agent.start(lastAgentPrompt.current) : undefined}
          /* Each applied step is its own transaction, so taking the run back
             is exactly that many undos — and nothing has happened since the
             failure to undo by mistake. */
          onUndoAll={
            composer
              ? () => {
                  const applied = agent.steps.filter((s) => s.status === "applied").length;
                  for (let i = 0; i < applied; i++) composer.history.undo();
                }
              : undefined
          }
        />
      )}
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
