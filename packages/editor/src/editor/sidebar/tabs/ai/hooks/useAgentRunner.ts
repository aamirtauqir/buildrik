import * as React from "react";
import type { Composer } from "@/engine";
import type { AIModel } from "../types";
import { applyAiEdit } from "../applySetStyle";
import {
  runPromptOnce,
  type PlanStep,
  type ServerEdit,
  type PageElementRef,
} from "./runPromptOnce";

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

export type RunPhase = "idle" | "planning" | "running" | "done";

interface UseAgentRunnerResult {
  phase: RunPhase;
  steps: RunStep[];
  currentIndex: number;
  error: string | null;
  autoApply: boolean;
  setAutoApply: (on: boolean) => void;
  start: (prompt: string) => void;
  approve: () => void;
  skip: () => void;
  stop: () => void;
  reset: () => void;
}

export function useAgentRunner(
  composer: Composer | null,
  model: AIModel,
): UseAgentRunnerResult {
  const [phase, setPhase] = React.useState<RunPhase>("idle");
  const [steps, setSteps] = React.useState<RunStep[]>([]);
  const [currentIndex, setCurrentIndex] = React.useState(-1);
  const [error, setError] = React.useState<string | null>(null);
  const [autoApply, setAutoApplyState] = React.useState(false);

  const stepsRef = React.useRef<RunStep[]>([]);
  stepsRef.current = steps;
  const indexRef = React.useRef(-1);
  indexRef.current = currentIndex;
  const cancelledRef = React.useRef(false);
  const autoApplyRef = React.useRef(false);
  autoApplyRef.current = autoApply;
  const generateStepRef = React.useRef<(i: number) => void>(() => {});
  const setAutoApply = React.useCallback((on: boolean) => setAutoApplyState(on), []);

  const gatherElements = React.useCallback((): PageElementRef[] => {
    if (!composer) return [];
    return composer.elements
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
  }, [composer]);

  const setStep = React.useCallback((i: number, patch: Partial<RunStep>) => {
    setSteps((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }, []);

  const advance = React.useCallback((next: number) => {
    if (cancelledRef.current || next >= stepsRef.current.length) {
      setPhase("done");
      setCurrentIndex(-1);
      return;
    }
    generateStepRef.current(next);
  }, []);

  const generateStep = React.useCallback(
    async (i: number) => {
      const step = stepsRef.current[i];
      if (!step || !composer) return;
      indexRef.current = i;
      setCurrentIndex(i);
      setStep(i, { status: "running" });
      // Re-ground page-scope steps against the live canvas; element-scope steps
      // target the id the plan chose.
      const scope =
        step.plan.scope.kind === "page"
          ? { kind: "page" as const, elements: gatherElements() }
          : step.plan.scope;
      try {
        const { edit } = await runPromptOnce({
          prompt: step.plan.instruction,
          scope,
          model,
          intent: "style-command",
        });
        if (cancelledRef.current) return;
        if (edit && edit.rows.length > 0) {
          if (autoApplyRef.current) {
            // Auto-apply mode (opt-in): apply without waiting for approval.
            try {
              await applyAiEdit(composer, { applyOps: edit.applyOps });
              setStep(i, { status: "applied", edit });
            } catch {
              setStep(i, { status: "failed", edit });
            }
            advance(i + 1);
          } else {
            setStep(i, { status: "awaiting", edit });
          }
        } else {
          setStep(i, { status: "nochange" });
          advance(i + 1);
        }
      } catch {
        if (cancelledRef.current) return;
        setStep(i, { status: "failed" });
        advance(i + 1);
      }
    },
    [composer, model, gatherElements, setStep, advance],
  );
  generateStepRef.current = generateStep;

  const start = React.useCallback(
    async (prompt: string) => {
      if (!composer) return;
      cancelledRef.current = false;
      setError(null);
      setSteps([]);
      stepsRef.current = [];
      setCurrentIndex(-1);
      setPhase("planning");
      try {
        const elements = gatherElements();
        const { plan } = await runPromptOnce({
          prompt,
          scope: { kind: "page", elements },
          model,
          intent: "plan",
        });
        if (cancelledRef.current) return;
        if (!plan || plan.length === 0) {
          setError("Couldn't break that into steps. Try a more specific build request.");
          setPhase("done");
          return;
        }
        const runSteps: RunStep[] = plan.map((p) => ({ plan: p, status: "pending" }));
        stepsRef.current = runSteps;
        setSteps(runSteps);
        setPhase("running");
        generateStepRef.current(0);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Planning failed");
        setPhase("done");
      }
    },
    [composer, model, gatherElements],
  );

  const approve = React.useCallback(async () => {
    const i = indexRef.current;
    const step = stepsRef.current[i];
    if (!step || step.status !== "awaiting" || !step.edit || !composer) return;
    try {
      await applyAiEdit(composer, { applyOps: step.edit.applyOps });
      setStep(i, { status: "applied" });
    } catch {
      setStep(i, { status: "failed" });
    }
    advance(i + 1);
  }, [composer, setStep, advance]);

  const skip = React.useCallback(() => {
    const i = indexRef.current;
    if (stepsRef.current[i]?.status !== "awaiting") return;
    setStep(i, { status: "skipped" });
    advance(i + 1);
  }, [setStep, advance]);

  const stop = React.useCallback(() => {
    cancelledRef.current = true;
    setPhase("done");
    setCurrentIndex(-1);
  }, []);

  const reset = React.useCallback(() => {
    cancelledRef.current = true;
    setPhase("idle");
    setSteps([]);
    stepsRef.current = [];
    setCurrentIndex(-1);
    setError(null);
  }, []);

  return { phase, steps, currentIndex, error, autoApply, setAutoApply, start, approve, skip, stop, reset };
}
