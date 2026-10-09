import * as React from "react";
import { X } from "lucide-react";
import { ConfirmDialog, PanelFrame, Button, IconButton } from "@/editor/chrome-ui";
import type { Composer } from "../../../../engine";
import type { AIScope } from "./types";
import type { RunPool } from "./hooks/useAgentRunner";
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
/* Board 4418:106919's error block: a 12/18 error-red headline over an 11/16
   muted body. */
const ERROR_TITLE = "tw:m-0 tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-error-text)]";
const ERROR_BODY = "tw:m-0 tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)]";
/* Board 4418:106671: same size, but --color/error (red-600), not error-text.
   A whole constant rather than a second colour utility — two on one plain
   element resolve by stylesheet order. */
const QUOTA_TITLE = "tw:m-0 tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-error)]";
/* Board 4418:106796's not-configured title: 13/20 ink regular. */
const NOTICE_TITLE = "tw:m-0 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)]";

/** The quota gate's sentence carries its reset as ISO ("Resets at
 *  2026-08-16T00:00:00.000Z."); board 4418:106671 reads it as a time. */
function readableQuotaMessage(message: string | null): string {
  if (!message) return "";
  return message.replace(/Resets at (\d{4}-\d{2}-\d{2}T[\d:.]+Z)/, (_m, iso: string) => {
    const at = new Date(iso);
    if (Number.isNaN(at.getTime())) return _m;
    if (at.getUTCHours() === 0 && at.getUTCMinutes() === 0) return "Resets at midnight UTC";
    return `Resets at ${at.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}`;
  });
}

/* Bare 12px accent links on a ~30 pitch (4418:106671 / 106919); they were
   32-tall buttons on a 40 pitch. */
const STATE_LINK =
  "tw:h-[22px] tw:self-start tw:border-transparent tw:bg-transparent tw:p-0 tw:text-[12px] tw:font-normal tw:text-[var(--bk-accent)] tw:focus:ring-0";
/* The scoped-run note under "Plan changes" (6881:63246 …, 11/16 muted). */
const SCOPE_NOTE = "tw:m-0 tw:px-4 tw:pb-3 tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)]";
/* Board 35 (Inspector v4 · AI column, 7995:210503): the column opened on one
   element, before anything is asked — 16 gutter, 12 between parts; the back
   link and the suggestions are 28-tall panel actions, 13/500 gray-700. */
const COLUMN_BACK =
  "tw:h-7 tw:w-full tw:rounded-md tw:border-0 tw:bg-transparent tw:px-3 tw:py-1 tw:text-[13px] tw:leading-5 tw:font-medium " +
  "tw:text-[var(--bk-gray-700)] tw:hover:bg-[var(--bk-bg-subtle)] tw:focus:ring-0";
const COLUMN_ACTION =
  "tw:h-7 tw:w-full tw:rounded-md tw:border tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-panel)] tw:px-3 tw:py-1 " +
  "tw:text-[13px] tw:leading-5 tw:font-medium tw:text-[var(--bk-gray-700)] tw:focus:ring-0";
const COLUMN_NOTE = "tw:m-0 tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-muted)]";
/** Board 35's three, for an element: each is a prompt on that element. */
const ELEMENT_SUGGESTIONS = ["Make it more concise", "Try a warmer tone", "Suggest a headline"] as const;
const CONFIRM_SUFFIX = " Changes to page settings or publishing need a separate confirmation.";
import { DEFAULT_MODEL, type AIModel } from "./types";
import "./AITab.css";
import { useAiQuota, quotaLeftLabel } from "./hooks/useAiQuota";
import { requestGenerateBlock } from "@/editor/sidebar/tabs/build/insertGroupRequest";

export interface AITabProps {
  composer: Composer | null;
  isExpanded: boolean;
  onExpandToggle: () => void;
  onHelpClick?: () => void;
  onClose: () => void;
  /** Rendered in the inspector column (boards 170:2 · 66:225), where the way
   *  out is back to the inspector rather than a panel close. */
  onBack?: () => void;
  /** A door's intent: the prompt it puts in the empty field ("Improve with
   *  AI" → IMPROVE_ELEMENT_PROMPT). */
  seedPrompt?: string;
}

/** What a scope's run copy calls it: "Hero", "the 3 selected elements". */
function scopeTarget(scope: AIScope): string {
  switch (scope.kind) {
    case "element":
      return scope.name;
    case "multi":
      return `the ${scope.ids.length} selected elements`;
    case "similar":
      return `the ${scope.ids.length} ${scope.noun}`;
    case "site":
      return "the site";
    default:
      return "the page";
  }
}

/** Boards 4418:104454 / 6881:63246 / 69981 / 6891:73760 / 73974 — what a
 *  scoped run may touch, said before it runs. */
function scopeNote(scope: AIScope): string {
  switch (scope.kind) {
    case "element":
      return `This run targets ${scope.name}${scope.name.startsWith("the ") ? " only" : ""}.${CONFIRM_SUFFIX}`;
    case "multi":
      return `This run targets the ${scope.ids.length} selected elements only.${CONFIRM_SUFFIX}`;
    case "similar":
      return `This run targets the ${scope.ids.length} ${scope.noun} like this one.${CONFIRM_SUFFIX}`;
    case "site":
      return `This run can change all ${scope.pages} pages.${CONFIRM_SUFFIX}`;
    default:
      return "";
  }
}

/** Board 6881:71076 / 4418:106547 — after Edit prompt the panel says what the
 *  failed run left behind and how scoped runs behave. */
const RESIDUE_NOTE =
  "Scoped runs edit only the selection — but page settings (title, description, slug) and a publish request are not element edits and can still come back. Clearing the selection widens the scope to the page.";

export const AITab: React.FC<AITabProps> = ({ composer, onHelpClick, onClose, onBack, seedPrompt }) => {
  const { scope: liveScope, status, lock, unlock, options, choose } = useAIScope(composer);
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
  const lastPrompt = React.useRef<{ text: string; scope: AIScope } | null>(null);
  const promptRef = React.useRef<HTMLDivElement>(null);
  /* The scope a run was started with. The band keeps naming it until the run
     is left (4418:105548 still reads "Hero section" after Undo all, although
     undo drops the selection). */
  const [runScope, setRunScope] = React.useState<AIScope | null>(null);
  /* Board 4418:105548 — Undo all took the run back. */
  const [undone, setUndone] = React.useState(false);
  /* Board 4418:106547 — what a failed run left, shown after Edit prompt. */
  const [residue, setResidue] = React.useState<string | null>(null);

  const run = React.useCallback(
    (text: string, target: AIScope) => {
      lastPrompt.current = { text, scope: target };
      setRunScope(target);
      setUndone(false);
      setResidue(null);
      lock();
      /* An element prompt is a one-step run on it; every wider scope is a
         planned run over its pool (a multi-selection too — it used to be
         refused, "one element at a time in v1"). */
      const pool: RunPool =
        target.kind === "site" ? "site" : target.kind === "multi" || target.kind === "similar" ? { ids: target.ids } : "page";
      agent.start(text, target.kind === "element" ? { id: target.id } : undefined, pool);
    },
    [agent, lock],
  );

  const submit = React.useCallback((text: string) => run(text, liveScope), [liveScope, run]);
  const scope = agent.phase !== "idle" && runScope ? runScope : liveScope;

  /* The scope stays locked while the run is live (board 4418:104454's 🔒)
     and is handed back when it ends. */
  const live = agent.phase === "planning" || agent.phase === "running";
  /* The prompt stays in the field through every end state (boards
     4418:105118 / 105261 / 105401 all draw it); leaving the run — Done or
     Keep N changes — clears it by remounting the composer. */
  const [composerKey, setComposerKey] = React.useState(0);
  /* G2-129: the daily counter — drawn only when the quota read answers. */
  /* Re-read when a run ends (it spent one), not on every phase of it —
     planning / running / done each re-read it (L5-024). */
  const [runsEnded, setRunsEnded] = React.useState(0);
  React.useEffect(() => {
    if (agent.phase === "done") setRunsEnded((n) => n + 1);
  }, [agent.phase]);
  const quota = useAiQuota(runsEnded);
  React.useEffect(() => {
    if (agent.phase === "done") unlock();
  }, [agent.phase, unlock]);

  /* Leave the run: clear it and empty the field. */
  const leaveRun = () => {
    agent.reset();
    setRunScope(null);
    setUndone(false);
    setComposerKey((k) => k + 1);
  };

  /* The three panel states replace the run only while nothing from it has
     landed — a run that failed after applying steps keeps AgentPlan, whose
     error card carries Undo all. */
  const failedKind = agent.steps.some((s) => s.status === "applied") ? null : agent.errorKind;

  /* Boards 4418:106671/106796/106919 all end on the way out of AI: back to
     the inspector (in the inspector column) or close the panel. */
  const continueByHand = (
    <Button
      color="light"
      size="xs"
      className={STATE_LINK}
      data-testid="ai-continue-by-hand"
      onClick={() => {
        agent.reset();
        (onBack ?? onClose)();
      }}
    >
      Continue by hand in the inspector
    </Button>
  );

  /* Board 35: the column (reached from the Inspector) on one element with
     nothing asked yet. Everything else — page scope, a run, its end states —
     keeps the 4418:* layout. Only classes and optional rows change between
     the two, so the prompt field is never remounted under a typed prompt. */
  const column35 = !!onBack && agent.phase === "idle" && scope.kind === "element" && !failedKind && !residue;

  const retry = () => {
    const again = lastPrompt.current;
    agent.reset();
    if (again) run(again.text, again.scope);
  };

  return (
    <PanelFrame className={column35 ? "bd-ai-tab tw:gap-3 tw:p-4" : "bd-ai-tab"} data-testid="ai-panel">
      {/* Every AI board opens with "‹ Inspector" and a plain "AI" title — the
          panel lives in the inspector column, not beside it. The old header
          carried a subtitle ("Chat with AI to edit your page") no board has.
          Board 35 draws the back link alone, centred, with no title and no ✕. */}
      {onBack ? (
        /* shrink-0: these two rows carry fixed heights now, and a flex child
           in an overflowing column is compressible by default. */
        <div className="tw:flex tw:shrink-0 tw:flex-col">
          {/* Boards 170:2/170:29/171:67 put the rule under the BACK ROW (36
              tall) and leave the title row (44) open below it. It was the
              other way round, which read as a header with a stray link
              floating above it. */}
          <div
            className={
              column35
                ? "tw:flex tw:h-7 tw:items-center"
                : "tw:flex tw:h-9 tw:items-center tw:border-b tw:border-[var(--bk-gray-100)]"
            }
            data-testid="ai-back-row"
          >
            <Button
              color="light"
              size="xs"
              className={
                column35
                  ? COLUMN_BACK
                  : "tw:h-full tw:border-transparent tw:bg-transparent tw:px-4 tw:py-0 tw:text-[14px] tw:font-medium tw:text-[var(--bk-ink)]"
              }
              onClick={onBack}
              aria-label="Back to Inspector"
              data-testid="ai-back-label"
            >
              ‹ Inspector
            </Button>
            {/* Board 4418:106919: ✕ at the back row's right closes the panel. */}
            {column35 ? null : (
              <IconButton size="sm" label="Close AI" className="tw:ml-auto tw:mr-4 tw:text-[var(--bk-ink-muted)]" onClick={onClose}>
                <X size={16} aria-hidden="true" />
              </IconButton>
            )}
          </div>
          {column35 ? null : (
            <div
              className="tw:flex tw:h-11 tw:items-center tw:px-4 tw:text-[14px] tw:font-medium tw:text-[var(--bk-ink)]"
              data-testid="ai-header"
            >
              AI
            </div>
          )}
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
      <ScopeChip scope={scope} status={status} options={options} onChoose={choose} variant={column35 ? "line" : "band"} />
      {/* Board 4418:106796 draws no composer: nothing here will run. */}
      {failedKind === "not-configured" ? null : (
        <div ref={promptRef}>
          <PromptComposer
            key={composerKey}
            onSubmit={submit}
            streaming={live}
            showPlan={agent.phase === "idle" && !failedKind && !column35}
            quotaLabel={(quota && quotaLeftLabel(quota)) || undefined}
            variant={column35 ? "column" : "band"}
            placeholder={column35 ? "What would you like to change?" : undefined}
            restoreText={failedKind ? lastPrompt.current?.text : seedPrompt}
          />
        </div>
      )}

      {/* Boards 171:136 and 171:105 — "no key" and "no credit" are states,
          not error lines. The server already tells them apart
          (PRECONDITION_FAILED vs TOO_MANY_REQUESTS); the panel used to print
          either as grey text under a composer that still looked ready. */}
      {failedKind === "not-configured" ? (
        /* Board 4418:106796. */
        <div className={STATE_BLOCK} data-testid="ai-state-not-configured">
          {lastPrompt.current ? (
            <p className="tw:m-0 tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink)]" data-testid="ai-state-prompt">
              Your prompt: {lastPrompt.current.text}
            </p>
          ) : null}
          <p className={NOTICE_TITLE}>AI isn&rsquo;t available on this workspace.</p>
          <p className={ERROR_BODY}>
            No AI provider is configured for this deployment. Ask your workspace owner to arrange setup with the
            deployment administrator. Nothing has changed on your site.
          </p>
          <Button
            color="light"
            size="xs"
            className={STATE_LINK}
            onClick={() => window.open(`${DASHBOARD_URL}/dashboard/settings/team`, "_blank")}
          >
            View workspace owner ↗
          </Button>
          {continueByHand}
        </div>
      ) : failedKind === "quota" ? (
        /* Board 4418:106671. */
        <div className={`${STATE_BLOCK} tw:bg-[var(--bk-warning-tint)]`} data-testid="ai-state-quota">
          <p className={QUOTA_TITLE}>AI is out of credit.</p>
          {/* The server's own sentence carries the real limit and reset — the
              board's "(10) · midnight UTC" is sample data; the shape is read. */}
          <p className={ERROR_BODY}>Nothing was changed. {readableQuotaMessage(agent.error)}</p>
          <Button
            color="light"
            size="xs"
            className={STATE_LINK}
            onClick={() => window.open(`${DASHBOARD_URL}/dashboard/settings/billing`, "_blank")}
          >
            Workspace billing ↗
          </Button>
          {continueByHand}
        </div>
      ) : failedKind === "other" ? (
        /* Board 4418:106919. The server's own line follows the sentence: an
           "other" error is the bucket for everything the two named states do
           not cover, and some carry the only useful detail there is. */
        <div className={`${STATE_BLOCK} tw:bg-[var(--bk-error-tint)]`} data-testid="ai-state-failed">
          <p className={ERROR_TITLE}>The AI service didn&rsquo;t respond.</p>
          {/* No raw server line: "Stream failed" is a transport string, not
              something the user can act on. The prompt stays in the composer. */}
          <p className={ERROR_BODY}>
            Nothing changed. Your prompt is still here; try again when the service is available.
          </p>
          <Button color="light" size="xs" className={STATE_LINK} onClick={retry}>
            Try again
          </Button>
          {continueByHand}
        </div>
      ) : agent.phase === "idle" && residue ? (
        <div data-testid="ai-residue">
          <p className={SCOPE_NOTE}>{RESIDUE_NOTE}</p>
          <p className="tw:m-0 tw:px-4 tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink)]">{residue}</p>
        </div>
      ) : column35 ? (
        /* Board 35: three suggestions on the element, then the promise the
           round trip keeps (P-7a — the Inspector stays mounted under AI). */
        <div className="tw:flex tw:flex-col tw:gap-3" data-testid="ai-suggestions">
          {ELEMENT_SUGGESTIONS.map((p) => (
            <Button key={p} color="light" size="xs" className={COLUMN_ACTION} onClick={() => submit(p)}>
              {p}
            </Button>
          ))}
          <p className={COLUMN_NOTE} data-testid="ai-return-note">
            Returning keeps your Inspector tab, scroll and state.
          </p>
        </div>
      ) : agent.phase === "idle" && scope.kind !== "page" ? (
        <p className={SCOPE_NOTE} data-testid="ai-scope-note">
          {scopeNote(scope)}
        </p>
      ) : agent.phase === "idle" ? (
        <div className="bd-ai-thread">
          <EmptyThread
            onTry={submit}
            onCreate={composer ? () => requestGenerateBlock(composer) : undefined}
          />
        </div>
      ) : (
        <AgentPlan
          phase={agent.phase}
          steps={agent.steps}
          currentIndex={agent.currentIndex}
          error={agent.error}
          onEditStep={agent.editStep}
          onRunPlan={agent.runPlan}
          onApprove={agent.approve}
          onSkip={agent.skip}
          onStop={agent.stop}
          stoppedByUser={agent.stoppedByUser}
          undone={undone}
          target={scopeTarget(scope)}
          /* Boards 4418:105695 / 105930 / 106165: Done hands straight back to
             the inspector (in the inspector column); Keep N changes stays. */
          onDismiss={() => {
            const finishedClean = !agent.error && !agent.stoppedByUser;
            leaveRun();
            if (finishedClean && onBack) onBack();
          }}
          /* Boards 4418:105118 → 106547: back to the prompt, which is still in
             the field, with what the failed run left behind. */
          onEditPrompt={() => {
            const applied = agent.steps.filter((s) => s.status === "applied").length;
            setResidue(
              applied > 0
                ? `${applied} ${applied === 1 ? "change is" : "changes are"} already applied. Change your request to target what the last run could not change.`
                : "Nothing was applied. Change your request and plan again.",
            );
            agent.reset();
            promptRef.current?.querySelector("textarea")?.focus();
          }}
          /* Undo all takes back exactly the run's own history entries, through
             the handle each applied step recorded — never a count of undos,
             which reverted the user's own work whenever a counted step had
             recorded nothing or the user edited in between. It stops at an
             entry a newer edit sits on. Undo drops the selection; the run's
             element is picked again, as 4418:105548 keeps it selected. */
          onUndoAll={
            composer
              ? () => {
                  agent.undoAll();
                  setUndone(true);
                  const target = runScope?.kind === "element" ? composer.elements.getElement(runScope.id) : undefined;
                  if (target) composer.selection.select(target);
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
