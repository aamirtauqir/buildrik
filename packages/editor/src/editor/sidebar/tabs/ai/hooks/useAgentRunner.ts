import * as React from "react";
import type { Composer } from "@/engine";
import type { AIModel } from "../types";
import { applyAiEdit } from "../applySetStyle";
import {
  runPromptOnce,
  AiRunError,
  type AiErrorKind,
  type PlanStep,
  type ServerEdit,
  type PageElementRef,
  type TokenRef,
  type MediaAssetRef,
  type RunScope,
} from "./runPromptOnce";
import { gatherTokens, gatherMediaAssets, gatherElementContext, toElementRef, withBeforeValues } from "./aiScopeContext";
import { activePageElements } from "./useAIScope";
import { trackAgentRun } from "@/services/ai/adoptionTracker";

/**
 * P4 agent build loop. Generates an ordered plan, then walks each step through
 * the existing single-shot generate→approve→apply pipeline:
 *
 *   start(prompt) ─▶ planning ─▶ running
 *      per step i:  running ─▶ (edit) awaiting ─▶ approve→applied | skip→skipped
 *                            └▶ (no edit) nochange ─▶ advance
 *      advance: i+1 < n ? generate(i+1) : done
 *
 * Page-scope steps re-gather the element list against the LIVE canvas at
 * generate time (staleness mitigation — the plan is fixed but each step's
 * commands are produced against current state). Refs back the index/steps so
 * the approve/skip callbacks never read stale closure state (see
 * feedback_setter_closure_stale_state).
 */

export type StepStatus =
  | "pending"
  | "running"
  | "awaiting"
  | "applied"
  | "skipped"
  | "nochange"
  | "failed";

export interface RunStep {
  plan: PlanStep;
  status: StepStatus;
  edit?: ServerEdit;
}

/** "review" — board 4418:104698: the plan is shown before anything runs; its
 *  steps can be edited, and Run starts it (G2-132). */
export type RunPhase = "idle" | "planning" | "review" | "running" | "done";

/** The selected element a prompt is scoped to (ScopeChip's element scope). */
export interface ElementTarget {
  id: string;
}

/** What a planned run may read and change: the active page (default), every
 *  page, or a fixed set of elements (a multi-selection, "all sections like
 *  this"). */
export type RunPool = "page" | "site" | { ids: string[] };

function errorKindOf(e: unknown): AiErrorKind {
  return e instanceof AiRunError ? e.kind : "other";
}

interface UseAgentRunnerResult {
  phase: RunPhase;
  steps: RunStep[];
  currentIndex: number;
  error: string | null;
  /** What kind of failure `error` is — boards 171:136 / 171:105 draw "not
   *  configured" and "out of credit" as panel states, not as a run error. */
  errorKind: AiErrorKind | null;
  /** Board 171:36 — a run the user stopped is not a run that finished, and
   *  `phase` alone could not tell them apart (stop() sets "done"). */
  stoppedByUser: boolean;
  /** Review phase: change what a step asks for before the run starts. */
  editStep: (index: number, instruction: string) => void;
  /** Review phase: run the plan as it stands. */
  runPlan: () => void;
  /** Plan and run a prompt. With an element target the plan is that one
   *  step — the server planner only reasons about pages. */
  start: (prompt: string, target?: ElementTarget, pool?: RunPool) => void;
  approve: () => void;
  skip: () => void;
  stop: () => void;
  reset: () => void;
  /** Undo the run's own history entries, newest first, and return how many
   *  were undone. Stops at the first entry that is no longer on top (the user
   *  edited after it), so it never undoes the user's work. */
  undoAll: () => number;
}

export function useAgentRunner(
  composer: Composer | null,
  model: AIModel,
  // A privileged-action proposal (e.g. publish) emitted mid-run is routed to the
  // confirm gate, NOT silently dropped. Without this the agent path would discard
  // applyAiEdit's `proposals`.
  onProposal?: (actionId: string) => void,
): UseAgentRunnerResult {
  const [phase, setPhase] = React.useState<RunPhase>("idle");
  const [steps, setSteps] = React.useState<RunStep[]>([]);
  const [currentIndex, setCurrentIndex] = React.useState(-1);
  const [error, setError] = React.useState<string | null>(null);
  const [errorKind, setErrorKind] = React.useState<AiErrorKind | null>(null);
  const [stoppedByUser, setStoppedByUser] = React.useState(false);

  const stepsRef = React.useRef<RunStep[]>([]);
  stepsRef.current = steps;
  const indexRef = React.useRef(-1);
  indexRef.current = currentIndex;
  const cancelledRef = React.useRef(false);
  /* The request in flight — Stop / reset abort it, so the subscription is torn
     down and the server stops generating. */
  const abortRef = React.useRef<AbortController | null>(null);
  const nextSignal = React.useCallback((): AbortSignal => {
    const ac = new AbortController();
    abortRef.current = ac;
    return ac.signal;
  }, []);
  /* One undo handle per step that recorded a history entry, oldest first
     (applyAiEdit → history.captureUndo). Undo all walks these, not a count. */
  const undoHandlesRef = React.useRef<Array<() => boolean>>([]);
  const generateStepRef = React.useRef<(i: number) => void>(() => {});
  // Adoption telemetry: one agent.run report per run (start time + once-guard).
  const runStartRef = React.useRef(0);
  const reportedRef = React.useRef(true);

  const reportRun = React.useCallback(() => {
    if (reportedRef.current) return;
    reportedRef.current = true;
    const steps = stepsRef.current;
    if (steps.length === 0) return;
    trackAgentRun({
      stepsPlanned: steps.length,
      stepsApplied: steps.filter((s) => s.status === "applied").length,
      stepsSkipped: steps.filter((s) => s.status === "skipped").length,
      stepsFailed: steps.filter((s) => s.status === "failed").length,
      durationMs: Math.max(0, Date.now() - runStartRef.current),
      model,
    });
  }, [model]);

  /* The planned run's pool, fixed at start: each step re-gathers it against
     the live canvas. It read every loaded page's elements for a "page" run —
     the registry spans all pages. */
  const poolRef = React.useRef<RunPool>("page");
  const gatherElements = React.useCallback((): PageElementRef[] => {
    if (!composer) return [];
    const pool = poolRef.current;
    const els =
      pool === "site"
        ? composer.elements.getAllElements()
        : pool === "page"
          ? (() => {
              const onPage = activePageElements(composer);
              return onPage.length > 0 ? onPage : composer.elements.getAllElements();
            })()
          : pool.ids.flatMap((id) => composer.elements.getElement(id) ?? []);
    return els
      .map(toElementRef)
      .filter((e) => e.id)
      .slice(0, 200);
  }, [composer]);

  // Token registry + media library for set-token / set-image recall — shared
  // with AITab chat path via aiScopeContext (SSOT).
  const gatherTokensCb = React.useCallback((): TokenRef[] => gatherTokens(composer), [composer]);
  const gatherMediaAssetsCb = React.useCallback((): MediaAssetRef[] => gatherMediaAssets(composer), [composer]);

  const setStep = React.useCallback((i: number, patch: Partial<RunStep>) => {
    setSteps((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }, []);

  const advance = React.useCallback((next: number) => {
    if (cancelledRef.current || next >= stepsRef.current.length) {
      setPhase("done"); composer?.emit("ai:agent-run", { running: false, summary: "" });
      setCurrentIndex(-1);
      reportRun();
      return;
    }
    generateStepRef.current(next);
  }, [reportRun]);

  /* A failed step — one that could not be generated or could not be applied —
     STOPS the run. This used to mark the step failed and then `advance(i + 1)`,
     so the agent quietly carried on editing the user's page after a step had
     already failed, while the band above it read "STOPPED AT STEP N", which it
     computes from `steps` alone. Walked live: the band said stopped at step 1
     with step 2 still showing a running dot, the run finished "0 changes
     applied", and no error, Retry or Undo-all ever appeared, because
     AgentPlan's error card is gated on `error` and nothing here ever set it.

     Continuing past a failure is the wrong default for an agent that writes
     to the page: later steps are planned against a state the failed step was
     supposed to produce. Stop, say so, and leave the user the Undo-all the
     board promises. (A failed apply leaves nothing behind — applyAiEdit rolls
     the batch back.) */
  const failRun = React.useCallback(
    (i: number, e: unknown) => {
      cancelledRef.current = true;
      /* Write the ref in the same breath as the state. `stepsRef.current` is
         assigned during RENDER, and `reportRun` reads it synchronously — so
         marking the step failed with `setStep` alone and reporting straight
         after logged `stepsFailed: 0` for the very run that just failed.
         (Caught in review, not by the suite: nothing asserts telemetry.) */
      const failed = stepsRef.current.map((s, idx) =>
        idx === i ? { ...s, status: "failed" as const } : s,
      );
      stepsRef.current = failed;
      setSteps(failed);
      setError(e instanceof Error ? e.message : "That step failed.");
      setErrorKind(errorKindOf(e));
      setPhase("done");
      setCurrentIndex(-1);
      composer?.emit("ai:agent-run", { running: false, summary: "" });
      /* `advance` reports the run when it ends; this path does not go
         through it, and a run that failed is the one most worth measuring. */
      reportRun();
    },
    [composer, reportRun],
  );

  const generateStep = React.useCallback(
    async (i: number) => {
      const step = stepsRef.current[i];
      if (!step || !composer) return;
      indexRef.current = i;
      setCurrentIndex(i);
      setStep(i, { status: "running" });
      // Inspector takeover (board 160:512) — broadcast what the agent is doing
      // so the right panel can show "AI · {step}…" instead of stale controls.
      composer.emit("ai:agent-run", { running: true, summary: step.plan.title ?? step.plan.instruction });
      // Re-ground every step against the live canvas: page steps send the
      // pool's elements, element steps a snapshot of the element the plan
      // chose (the model used to get its id alone). Both carry the token
      // registry and media library for set-token / image recall.
      const scope: RunScope =
        step.plan.scope.kind === "page"
          ? {
              kind: "page",
              elements: gatherElements(),
              tokens: gatherTokensCb(),
              assets: gatherMediaAssetsCb(),
            }
          : {
              kind: "element",
              id: step.plan.scope.id,
              context: gatherElementContext(composer, step.plan.scope.id),
              tokens: gatherTokensCb(),
              assets: gatherMediaAssetsCb(),
            };
      try {
        const { edit } = await runPromptOnce({
          prompt: step.plan.instruction,
          scope,
          model,
          intent: "style-command",
          signal: nextSignal(),
        });
        if (cancelledRef.current) return;
        if (edit && edit.rows.length > 0) {
          setStep(i, { status: "awaiting", edit: withBeforeValues(composer, edit) });
        } else {
          setStep(i, { status: "nochange" });
          advance(i + 1);
        }
      } catch (e) {
        if (cancelledRef.current) return;
        failRun(i, e);
      }
    },
    [composer, model, gatherElements, gatherTokensCb, gatherMediaAssetsCb, setStep, advance, failRun, nextSignal],
  );
  generateStepRef.current = generateStep;

  const start = React.useCallback(
    async (prompt: string, target?: ElementTarget, pool: RunPool = "page") => {
      if (!composer) return;
      poolRef.current = pool;
      cancelledRef.current = false;
      undoHandlesRef.current = [];
      setStoppedByUser(false);
      runStartRef.current = Date.now();
      reportedRef.current = false;
      setError(null);
      setErrorKind(null);
      setSteps([]);
      stepsRef.current = [];
      setCurrentIndex(-1);
      setPhase("planning");
      try {
        let plan: PlanStep[] | null;
        if (target) {
          /* Decision #23: one conversation model. An element-scoped prompt
             is a one-step plan on that element — it runs at once, through the
             same step gate as any other run. */
          plan = [{ title: prompt, scope: { kind: "element", id: target.id }, instruction: prompt }];
        } else {
          const elements = gatherElements();
          ({ plan } = await runPromptOnce({
            prompt,
            scope: { kind: "page", elements, tokens: gatherTokensCb(), assets: gatherMediaAssetsCb() },
            model,
            intent: "plan",
            signal: nextSignal(),
          }));
        }
        if (cancelledRef.current) return;
        if (!plan || plan.length === 0) {
          setError("Couldn't break that into steps. Try a more specific build request.");
          setPhase("done"); composer?.emit("ai:agent-run", { running: false, summary: "" });
          return;
        }
        const runSteps: RunStep[] = plan.map((p) => ({ plan: p, status: "pending" }));
        stepsRef.current = runSteps;
        setSteps(runSteps);
        /* A page plan waits for review (board 4418:104698 — "Edit plan ·
           Run N steps"); an element prompt is one step and runs at once. */
        if (target) {
          setPhase("running");
          generateStepRef.current(0);
        } else {
          setPhase("review");
        }
      } catch (e) {
        if (cancelledRef.current) return;
        setError(e instanceof Error ? e.message : "Planning failed");
        setErrorKind(errorKindOf(e));
        setPhase("done"); composer?.emit("ai:agent-run", { running: false, summary: "" });
      }
    },
    [composer, model, gatherElements, gatherTokensCb, gatherMediaAssetsCb, nextSignal],
  );

  const approve = React.useCallback(async () => {
    const i = indexRef.current;
    const step = stepsRef.current[i];
    if (!step || step.status !== "awaiting" || !step.edit || !composer) return;
    let undo: (() => boolean) | null;
    try {
      let proposals: Array<{ actionId: string }>;
      ({ proposals, undo } = await applyAiEdit(composer, { applyOps: step.edit.applyOps }, step.plan.title));
      if (proposals.length > 0) onProposal?.(proposals[0].actionId);
    } catch (e) {
      failRun(i, e);
      return;
    }
    /* "Applied" means a history entry was recorded — a proposal-only or
       all-no-op step changed nothing Undo all could take back. Write the ref
       with the state so a following advance()/reportRun reads it. */
    if (undo) undoHandlesRef.current.push(undo);
    const status: StepStatus = undo ? "applied" : "nochange";
    stepsRef.current = stepsRef.current.map((s, idx) => (idx === i ? { ...s, status } : s));
    setStep(i, { status });
    advance(i + 1);
  }, [composer, setStep, advance, failRun, onProposal]);

  const skip = React.useCallback(() => {
    const i = indexRef.current;
    if (stepsRef.current[i]?.status !== "awaiting") return;
    setStep(i, { status: "skipped" });
    advance(i + 1);
  }, [setStep, advance]);

  const stop = React.useCallback(() => {
    cancelledRef.current = true;
    abortRef.current?.abort();
    setStoppedByUser(true);
    /* Board 4418:105261: what had not run when the user stopped is Skipped —
       an awaiting step left as a live dot read as still running. */
    const settled = stepsRef.current.map((s) =>
      s.status === "pending" || s.status === "running" || s.status === "awaiting" ? { ...s, status: "skipped" as const } : s,
    );
    stepsRef.current = settled;
    setSteps(settled);
    setPhase("done"); composer?.emit("ai:agent-run", { running: false, summary: "" });
    setCurrentIndex(-1);
    reportRun();
  }, [reportRun]);

  const reset = React.useCallback(() => {
    cancelledRef.current = true;
    abortRef.current?.abort();
    undoHandlesRef.current = [];
    setStoppedByUser(false);
    setPhase("idle"); composer?.emit("ai:agent-run", { running: false, summary: "" });
    setSteps([]);
    stepsRef.current = [];
    setCurrentIndex(-1);
    setError(null);
    setErrorKind(null);
  }, []);

  const editStep = React.useCallback((index: number, instruction: string) => {
    const next = stepsRef.current.map((s, i) =>
      i === index ? { ...s, plan: { ...s.plan, title: instruction, instruction } } : s,
    );
    stepsRef.current = next;
    setSteps(next);
  }, []);

  const runPlan = React.useCallback(() => {
    if (stepsRef.current.length === 0) return;
    setPhase("running");
    generateStepRef.current(0);
  }, []);

  const undoAll = React.useCallback((): number => {
    const handles = undoHandlesRef.current;
    let undone = 0;
    while (handles.length > 0) {
      // Each handle undoes only while its own entry is still the newest.
      if (!handles[handles.length - 1]()) break;
      handles.pop();
      undone++;
    }
    return undone;
  }, []);

  return { phase, steps, currentIndex, error, errorKind, stoppedByUser, editStep, runPlan, start, approve, skip, stop, reset, undoAll };
}
