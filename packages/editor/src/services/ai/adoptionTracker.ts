import { getAiSubscriptionClient } from "./subscriptionClient";
import { getSiteIdFromUrl } from "@/services/BuildrikSyncProvider";
import { EVENTS } from "@/shared/constants";
import type { Composer } from "@/engine";
import type {
  AiAdoptionInput,
  AiAdoptionSurface,
} from "@buildrik/shared/schemas/ai-adoption";

/**
 * Task-level AI adoption telemetry (client). Measures whether AI edits are
 * TRUSTED — applied and kept — via three signals: edit.applied (inline/chat),
 * agent.run (acceptance: applied vs skipped), and edit.reverted (the user undid
 * an AI edit — the survival/regret signal, attributed by the "ai-edit" history
 * label). All sends are fire-and-forget and best-effort: a telemetry failure
 * must never surface to the user or block an edit.
 *
 * PRIVACY: only structural metrics leave the client — command type names,
 * scope, counts, durations. Never prompt text, token values, or page content.
 */

function send(input: AiAdoptionInput): void {
  try {
    void getAiSubscriptionClient()
      .ai.logAdoption.mutate(input)
      .catch(() => {});
  } catch {
    // never throw from telemetry
  }
}

/** Pull the command TYPE names out of an apply-op batch (e.g. "set-style"). */
function extractCommandIds(applyOps: { commit?: Record<string, unknown> }): string[] {
  const commit = (applyOps?.commit ?? {}) as { commands?: unknown };
  const commands = Array.isArray(commit.commands) ? commit.commands : [];
  return commands
    .map((c) => (c as { commandId?: unknown }).commandId)
    .filter((id): id is string => typeof id === "string")
    .slice(0, 50);
}

export function trackAiEditApplied(args: {
  applyOps: { commit?: Record<string, unknown> };
  surface: AiAdoptionSurface;
  model?: string;
}): void {
  const siteId = getSiteIdFromUrl();
  if (!siteId) return;
  const commandIds = extractCommandIds(args.applyOps);
  send({
    siteId,
    event: "edit.applied",
    surface: args.surface,
    model: args.model,
    commandIds,
    appliedCount: commandIds.length,
  });
}

export function trackAgentRun(args: {
  stepsPlanned: number;
  stepsApplied: number;
  stepsSkipped: number;
  stepsFailed: number;
  durationMs: number;
  model?: string;
}): void {
  const siteId = getSiteIdFromUrl();
  if (!siteId) return;
  send({
    siteId,
    event: "agent.run",
    surface: "agent",
    model: args.model,
    stepsPlanned: args.stepsPlanned,
    stepsApplied: args.stepsApplied,
    stepsSkipped: args.stepsSkipped,
    stepsFailed: args.stepsFailed,
    durationMs: args.durationMs,
  });
}

/**
 * Subscribe once to undo. An AI edit is wrapped in a "ai-edit"-labeled
 * transaction (applyAiEdit), so an undo carrying that label means the user
 * reverted an AI edit. Returns an unsubscribe fn.
 */
export function attachAdoptionRevertListener(composer: Composer): () => void {
  const handler = (data: { entry?: { label?: string } }) => {
    if (data?.entry?.label !== "ai-edit") return;
    const siteId = getSiteIdFromUrl();
    if (!siteId) return;
    send({ siteId, event: "edit.reverted" });
  };
  composer.on(EVENTS.HISTORY_UNDO, handler);
  return () => composer.off(EVENTS.HISTORY_UNDO, handler);
}
