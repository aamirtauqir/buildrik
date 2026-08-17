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

/* Boards 171:136 / 171:105 — a state block: what is wrong, why, and the way
   out. Utilities rather than a stylesheet: this panel's CSS file is on the
   styling ratchet, and new chrome belongs inline (DS SSOT §3). */
const STATE_BLOCK = "tw:flex tw:flex-col tw:gap-2 tw:bg-[var(--bk-bg-subtle)] tw:p-4";
const STATE_TITLE = "tw:m-0 tw:text-[14px] tw:font-medium tw:text-[var(--bk-ink)]";
const STATE_BODY = "tw:m-0 tw:text-[12px] tw:leading-5 tw:text-[var(--bk-ink-muted)]";
const STATE_LINK =
  "tw:self-start tw:border-transparent tw:bg-transparent tw:p-0 tw:text-[var(--bk-accent)]";
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

  /** The last prompt, so the provider-failure state can offer a real retry. */
  const lastPromptRef = React.useRef<string | null>(null);

  const submit = React.useCallback((text: string) => {
    lastPromptRef.current = text;
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
    let outcome: "applied" | "invalid" = "invalid";
    if (msg?.edit && composer) {
      // Apply the command batch in one transaction (one undo step). A bad
      // element id throws but the transaction still closes (endTransaction in
      // finally) and the partial edit is recorded as one undoable entry.
      // applyAiEdit is async (some commands, e.g. insert-component, are async);
      // await so the "applied" state flips only after the mutation lands.
      /* `applied` is the number of commands that actually reached the canvas,
         and it has always been returned — it was just thrown away, so the
         message flipped to "✓ Applied" whether or not anything changed. The
         model regularly answers with a command set this editor cannot map
         (the server labels that batch "No applicable change" and still ships
         `commands: []`), and clicking Apply on one of those reported success
         over an untouched canvas. The catch is not success either. */
      try {
        const { applied, proposals } = await applyAiEdit(composer, msg.edit);
        trackAiEditApplied({ applyOps: msg.edit.applyOps, surface: "chat", model });
        // A privileged action (e.g. publish) was proposed — route it to the
        // explicit confirm gate instead of applying it to the canvas.
        if (proposals.length > 0) void actionGate.propose(proposals[0].actionId);
        outcome = applied > 0 || proposals.length > 0 ? "applied" : "invalid";
      } catch { /* partial recorded */ }
    }
    setMessages((prev) => prev.map((m) => m.id === msgId && m.edit ? { ...m, edit: { ...m.edit, state: outcome } } : m));
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
        <div className="tw:flex tw:flex-col">
          <Button
            color="light"
            size="xs"
            className="tw:self-start tw:border-transparent tw:bg-transparent tw:px-4 tw:py-3 tw:text-[13px] tw:font-medium tw:text-[var(--bk-ink)]"
            onClick={onBack}
            aria-label="Back to Inspector"
          >
            ‹ Inspector
          </Button>
          <div className="tw:border-b tw:border-[var(--bk-border)] tw:px-4 tw:pb-3 tw:text-[14px] tw:font-medium tw:text-[var(--bk-ink)]">
            AI
          </div>
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
        <div className={STATE_BLOCK}>
          <p className={STATE_TITLE}>AI drafting isn&rsquo;t configured yet.</p>
          <p className={STATE_BODY}>
            No API key is set for this workspace, so nothing here will run. This is the real
            message — not a silent fallback that pretends to work.
          </p>
          <Button
            color="light"
            size="xs"
            className={STATE_LINK}
            onClick={() => window.open(`${DASHBOARD_URL}/dashboard/settings`, "_blank")}
          >
            Open workspace settings
          </Button>
        </div>
      ) : stream.errorKind === "quota" ? (
        <div className={`${STATE_BLOCK} tw:bg-[var(--bk-warning-tint)]`}>
          <p className={`${STATE_TITLE} tw:text-[var(--bk-error)]`}>AI is out of credit.</p>
          <p className={STATE_BODY}>
            {/* The server's own sentence carries the real limit and reset time
                — the board's "1 Aug" is sample data. */}
            Nothing was changed. {stream.error}
          </p>
          <Button
            color="light"
            size="xs"
            className={STATE_LINK}
            onClick={() => window.open(`${DASHBOARD_URL}/dashboard/settings/billing`, "_blank")}
          >
            See plans
          </Button>
        </div>
      ) : stream.errorKind === "other" && stream.error ? (
        /* The third state the boards do not draw, because it is the one the
           server was never supposed to reach: the provider itself failed. It
           used to arrive as a raw code printed where the assistant's reply
           goes ("UNAUTHORIZED", "Connection error."), after the panel had sat
           on "Thinking…" through an unbounded reconnect loop. */
        <div className={`${STATE_BLOCK} tw:bg-[var(--bk-error-tint)]`}>
          <p className={`${STATE_TITLE} tw:text-[var(--bk-error)]`}>The AI service didn&rsquo;t respond.</p>
          <p className={STATE_BODY}>
            Nothing was changed. This is usually the model provider, not your site — try again in a
            moment.
          </p>
          {/* The server's own line, kept: an "other" error is the bucket for
              everything the two boarded states do not name, and some of those
              carry the only useful detail there is ("Daily limit reached (10).
              Resets at …"). Printing it under our sentence keeps the detail
              without letting a raw code stand in for the assistant's reply. */}
          <p className={STATE_BODY}>{stream.error}</p>
          <Button
            color="light"
            size="xs"
            className={STATE_LINK}
            onClick={() => {
              const again = lastPromptRef.current;
              stream.reset();
              if (again) submit(again);
            }}
          >
            Try again
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
