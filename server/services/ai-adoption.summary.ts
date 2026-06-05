/**
 * Pure aggregation for AI adoption telemetry — no DB import, so a standalone
 * `tsx` report script can reuse it without the `@/` alias resolver. The service
 * fetches rows and delegates here; the script instantiates its own PrismaClient,
 * fetches, and delegates here too.
 */

export interface AdoptionRow {
  event: string;
  surface: string | null;
  metadata: unknown;
}

export interface AiAdoptionSummary {
  sinceDays: number;
  totals: { applied: number; reverted: number; agentRuns: number };
  /** reverted / applied over the window — directional (reverts aren't keyed to a
   *  specific applied event, so treat as a trend, not an exact per-edit rate). */
  revertRate: number;
  commandFrequency: Array<{ commandId: string; count: number }>;
  bySurface: Array<{ surface: string; applied: number }>;
  agent: { runs: number; acceptanceRate: number; avgDurationMs: number };
}

export function summarizeAdoptionRows(
  rows: AdoptionRow[],
  sinceDays: number,
): AiAdoptionSummary {
  let applied = 0;
  let reverted = 0;
  let agentRuns = 0;
  let agentApplied = 0;
  let agentSkipped = 0;
  let agentDurSum = 0;
  const cmd = new Map<string, number>();
  const surf = new Map<string, number>();

  for (const r of rows) {
    const m = (r.metadata ?? {}) as Record<string, unknown>;
    if (r.event === "edit.applied") {
      applied++;
      if (r.surface) surf.set(r.surface, (surf.get(r.surface) ?? 0) + 1);
      const ids = Array.isArray(m.commandIds) ? m.commandIds : [];
      for (const id of ids) {
        if (typeof id === "string") cmd.set(id, (cmd.get(id) ?? 0) + 1);
      }
    } else if (r.event === "edit.reverted") {
      reverted++;
    } else if (r.event === "agent.run") {
      agentRuns++;
      if (typeof m.stepsApplied === "number") agentApplied += m.stepsApplied;
      if (typeof m.stepsSkipped === "number") agentSkipped += m.stepsSkipped;
      if (typeof m.durationMs === "number") agentDurSum += m.durationMs;
    }
  }

  const agentDenom = agentApplied + agentSkipped;
  return {
    sinceDays,
    totals: { applied, reverted, agentRuns },
    revertRate: applied ? reverted / applied : 0,
    commandFrequency: [...cmd.entries()]
      .map(([commandId, count]) => ({ commandId, count }))
      .sort((a, b) => b.count - a.count),
    bySurface: [...surf.entries()]
      .map(([surface, a]) => ({ surface, applied: a }))
      .sort((a, b) => b.applied - a.applied),
    agent: {
      runs: agentRuns,
      acceptanceRate: agentDenom ? agentApplied / agentDenom : 0,
      avgDurationMs: agentRuns ? Math.round(agentDurSum / agentRuns) : 0,
    },
  };
}
