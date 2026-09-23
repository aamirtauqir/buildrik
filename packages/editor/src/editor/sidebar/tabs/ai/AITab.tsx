import * as React from "react";
import { ConfirmDialog, PanelFrame, Button } from "@/editor/chrome-ui";
import type { Composer } from "../../../../engine";
import { ScopeChip } from "./ScopeChip";
import { EmptyThread } from "./EmptyThread";
import { AgentPlan } from "./AgentPlan";
import { Composer as PromptComposer } from "./Composer";
import { useAIScope } from "./hooks/useAIScope";
import { useAgentRunner } from "./hooks/useAgentRunner";
import { useAiActionGate } from "./hooks/useAiActionGate";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";

/* Boards 171:136 / 171:105 — a state block: what is wrong, why, and the way
   out. Utilities rather than a stylesheet: this panel's CSS file is on the
   styling ratchet, and new chrome belongs inline (DS SSOT §3). */
const STATE_BLOCK = "tw:flex tw:flex-col tw:gap-2 tw:bg-[var(--bk-bg-subtle)] tw:p-4";
const STATE_TITLE = "tw:m-0 tw:text-[14px] tw:font-medium tw:text-[var(--bk-ink)]";
const STATE_BODY = "tw:m-0 tw:text-[12px] tw:leading-5 tw:text-[var(--bk-ink-muted)]";
const STATE_LINK =
  "tw:self-start tw:border-transparent tw:bg-transparent tw:p-0 tw:text-[var(--bk-accent)]";
import { DEFAULT_MODEL, type AIModel } from "./types";
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

/** Board 4418:107268's guard — one element at a time until batch scope exists. */
const MULTI_GUARD = "AI editing supports one element at a time in v1 — select a single element.";

export const AITab: React.FC<AITabProps> = ({ composer, onHelpClick, onClose, onBack }) => {
  const { scope, status, lock, unlock } = useAIScope(composer);
  // Not state: the server owns model choice (`resolveModelForUser` gates it by
  // plan and ignores a client hint it doesn't allow). The picker that used to
  // set this offered four models, three of which the server could never call —
  // a control that never controlled anything. Removed.
  const model: AIModel = DEFAULT_MODEL;
  const actionGate = useAiActionGate(composer);
  const agent = useAgentRunner(composer, model, actionGate.propose);
  /* Decision #23 (E-8): one conversation model — plan / run. The chat thread,
     its proposed-change card and ↻ Regenerate are gone; every prompt goes to
     the runner. Board 171:2's Retry re-runs the same brief, so the panel
     remembers it — the runner does not keep the prompt. */
  const lastPrompt = React.useRef<{ text: string; target?: { id: string } } | null>(null);
  const [guard, setGuard] = React.useState(false);
  /* Board 921:4478's DRAFT row leads to the brief-entry frame (AgentPlan's
     idle state); a run ending (reset → idle) hands the panel back. */
  const [briefing, setBriefing] = React.useState(false);
  const promptRef = React.useRef<HTMLDivElement>(null);

  const run = React.useCallback(
    (text: string, target?: { id: string }) => {
      lastPrompt.current = { text, target };
      lock();
      agent.start(text, target);
    },
    [agent, lock],
  );

  const submit = React.useCallback(
    (text: string) => {
      if (scope.kind === "multi") {
        setGuard(true);
        return;
      }
      setGuard(false);
      run(text, scope.kind === "element" ? { id: scope.id } : undefined);
    },
    [scope, run],
  );

  /* The scope stays locked while the run is live (board 4418:104454's 🔒)
     and is handed back when it ends. */
  const live = agent.phase === "planning" || agent.phase === "running";
  React.useEffect(() => {
    if (agent.phase === "done") unlock();
    if (agent.phase !== "idle") setBriefing(false);
  }, [agent.phase, unlock]);

  /* The three panel states replace the run only while nothing from it has
     landed — a run that failed after applying steps keeps AgentPlan, whose
     error card carries Undo all. */
  const failedKind = agent.steps.some((s) => s.status === "applied") ? null : agent.errorKind;

  const retry = () => {
    const again = lastPrompt.current;
    agent.reset();
    if (again) run(again.text, again.target);
  };

  return (
    <PanelFrame className="bd-ai-tab" data-testid="ai-panel">
      {/* Every AI board opens with "‹ Inspector" and a plain "AI" title — the
          panel lives in the inspector column, not beside it. The old header
          carried a subtitle ("Chat with AI to edit your page") no board has. */}
      {onBack ? (
        /* shrink-0: these two rows carry fixed heights now, and a flex child
           in an overflowing column is compressible by default. */
        <div className="tw:flex tw:shrink-0 tw:flex-col">
          {/* Boards 170:2/170:29/171:67 put the rule under the BACK ROW (36
              tall) and leave the title row (44) open below it. It was the
              other way round, which read as a header with a stray link
              floating above it. */}
          <div
            className="tw:flex tw:h-9 tw:items-center tw:border-b tw:border-[var(--bk-gray-100)]"
            data-testid="ai-back-row"
          >
            <Button
              color="light"
              size="xs"
              className="tw:h-full tw:border-transparent tw:bg-transparent tw:px-4 tw:py-0 tw:text-[14px] tw:font-medium tw:text-[var(--bk-ink)]"
              onClick={onBack}
              aria-label="Back to Inspector"
              data-testid="ai-back-label"
            >
              ‹ Inspector
            </Button>
          </div>
          <div
            className="tw:flex tw:h-11 tw:items-center tw:px-4 tw:text-[14px] tw:font-medium tw:text-[var(--bk-ink)]"
            data-testid="ai-header"
          >
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
      <div ref={promptRef}>
        <PromptComposer onSubmit={submit} onStop={agent.stop} streaming={live} />
      </div>
      {guard && scope.kind === "multi" ? (
        <p className={`${STATE_BODY} tw:px-4 tw:py-2`} role="status" data-testid="ai-multi-guard">
          {MULTI_GUARD}
        </p>
      ) : null}

      {/* Boards 171:136 and 171:105 — "no key" and "no credit" are states,
          not error lines. The server already tells them apart
          (PRECONDITION_FAILED vs TOO_MANY_REQUESTS); the panel used to print
          either as grey text under a composer that still looked ready. */}
      {failedKind === "not-configured" ? (
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
      ) : failedKind === "quota" ? (
        <div className={`${STATE_BLOCK} tw:bg-[var(--bk-warning-tint)]`}>
          <p className={`${STATE_TITLE} tw:text-[var(--bk-error)]`}>AI is out of credit.</p>
          <p className={STATE_BODY}>
            {/* The server's own sentence carries the real limit and reset time
                — the board's "1 Aug" is sample data. */}
            Nothing was changed. {agent.error}
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
      ) : failedKind === "other" ? (
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
          {agent.error ? <p className={STATE_BODY}>{agent.error}</p> : null}
          <Button
            color="light"
            size="xs"
            className={STATE_LINK}
            onClick={retry}
          >
            Try again
          </Button>
        </div>
      ) : agent.phase === "idle" && !briefing ? (
        <div className="bd-ai-thread">
          <EmptyThread
            onTry={submit}
            onDraft={() => {
              setBriefing(true);
              promptRef.current?.querySelector("textarea")?.focus();
            }}
          />
        </div>
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
          onDismiss={agent.reset}
          onRetry={lastPrompt.current ? retry : undefined}
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
