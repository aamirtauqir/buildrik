/**
 * Pure adoption summarizer — the STOP-AND-MEASURE aggregation. Deterministic, no
 * DB. Verifies totals, revert rate, agent acceptance, command frequency, surface
 * breakdown.
 */
import { describe, it, expect } from "vitest";
import { summarizeAdoptionRows, type AdoptionRow } from "@server/services/ai-adoption.summary";

const rows: AdoptionRow[] = [
  { event: "edit.applied", surface: "chat", metadata: { commandIds: ["set-style", "set-token"] } },
  { event: "edit.applied", surface: "inline", metadata: { commandIds: ["set-style"] } },
  { event: "edit.applied", surface: "chat", metadata: { commandIds: ["set-text"] } },
  { event: "edit.reverted", surface: null, metadata: null },
  { event: "agent.run", surface: "agent", metadata: { stepsApplied: 3, stepsSkipped: 1, durationMs: 4000 } },
  { event: "agent.run", surface: "agent", metadata: { stepsApplied: 1, stepsSkipped: 1, durationMs: 2000 } },
];

describe("summarizeAdoptionRows", () => {
  const s = summarizeAdoptionRows(rows, 30);

  it("counts totals per event", () => {
    expect(s.totals).toEqual({ applied: 3, reverted: 1, agentRuns: 2 });
  });

  it("computes revert rate = reverted / applied", () => {
    expect(s.revertRate).toBeCloseTo(1 / 3);
  });

  it("computes agent step acceptance = applied / (applied+skipped) and avg duration", () => {
    // applied 4, skipped 2 → 4/6; avg (4000+2000)/2 = 3000
    expect(s.agent.acceptanceRate).toBeCloseTo(4 / 6);
    expect(s.agent.avgDurationMs).toBe(3000);
    expect(s.agent.runs).toBe(2);
  });

  it("ranks command frequency from applied metadata, descending", () => {
    expect(s.commandFrequency).toEqual([
      { commandId: "set-style", count: 2 },
      { commandId: "set-token", count: 1 },
      { commandId: "set-text", count: 1 },
    ]);
  });

  it("breaks applied down by surface", () => {
    expect(s.bySurface).toEqual([
      { surface: "chat", applied: 2 },
      { surface: "inline", applied: 1 },
    ]);
  });

  it("returns zeroed rates on an empty window (no divide-by-zero)", () => {
    const empty = summarizeAdoptionRows([], 7);
    expect(empty.revertRate).toBe(0);
    expect(empty.agent.acceptanceRate).toBe(0);
    expect(empty.totals).toEqual({ applied: 0, reverted: 0, agentRuns: 0 });
  });
});
