/**
 * adoptionTracker caps + failure-tolerance tests. Complements
 * adoptionTracker.test.ts (payload shapes / siteId skip / revert label):
 * this file covers the 50-command cap, non-string filtering, malformed
 * applyOps, and the "telemetry never throws" contract.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Swappable factory so one test can make the client getter itself throw.
// Factories only close over these (TDZ-safe lazy deref).
const mutateMock = vi.fn((_input: unknown) => Promise.resolve({ ok: true }));
let clientFactory: () => unknown = () => ({
  ai: { logAdoption: { mutate: (i: unknown) => mutateMock(i) } },
});

vi.mock("../subscriptionClient", () => ({
  getAiSubscriptionClient: () => clientFactory(),
}));

vi.mock("@/services/BuildrikSyncProvider", () => ({
  /* Added with the attribution wiring: useComposerInit now reads the
     signed-in user so versions and history stop recording `userId: null`. */
  loadCurrentUserId: vi.fn(() => Promise.resolve(null)),
  getSiteIdFromUrl: () => "site-1",
}));

import { trackAiEditApplied, trackAgentRun } from "../adoptionTracker";

const lastPayload = () =>
  mutateMock.mock.calls[0][0] as { commandIds: string[]; appliedCount: number };

beforeEach(() => {
  mutateMock.mockReset();
  mutateMock.mockResolvedValue({ ok: true });
  clientFactory = () => ({
    ai: { logAdoption: { mutate: (i: unknown) => mutateMock(i) } },
  });
});

describe("adoptionTracker commandIds cap", () => {
  it("caps commandIds at 50 and reports appliedCount from the capped list", () => {
    const commands = Array.from({ length: 60 }, (_, i) => ({
      commandId: `cmd-${i}`,
    }));
    trackAiEditApplied({ applyOps: { commit: { commands } }, surface: "chat" });

    expect(lastPayload().commandIds).toHaveLength(50);
    expect(lastPayload().commandIds[0]).toBe("cmd-0");
    expect(lastPayload().commandIds[49]).toBe("cmd-49");
    expect(lastPayload().appliedCount).toBe(50);
  });

  it("filters out non-string commandIds before capping", () => {
    const commands = [
      { commandId: "set-style" },
      { commandId: 5 },
      { notACommandId: true },
      { commandId: "set-token" },
      { commandId: null },
    ];
    trackAiEditApplied({ applyOps: { commit: { commands } }, surface: "inline" });

    expect(lastPayload().commandIds).toEqual(["set-style", "set-token"]);
    expect(lastPayload().appliedCount).toBe(2);
  });

  it("tolerates malformed applyOps (no commit / commands not an array)", () => {
    trackAiEditApplied({ applyOps: {}, surface: "chat" });
    expect(lastPayload().commandIds).toEqual([]);
    expect(lastPayload().appliedCount).toBe(0);

    mutateMock.mockClear();
    trackAiEditApplied({
      applyOps: { commit: { commands: "not-an-array" } },
      surface: "chat",
    });
    expect(lastPayload().commandIds).toEqual([]);
  });
});

describe("adoptionTracker never throws (fire-and-forget)", () => {
  it("swallows a rejected mutate — telemetry failure never surfaces", async () => {
    mutateMock.mockRejectedValue(new Error("INTERNAL_SERVER_ERROR"));

    expect(() =>
      trackAiEditApplied({
        applyOps: { commit: { commands: [{ commandId: "set-style" }] } },
        surface: "chat",
      })
    ).not.toThrow();
    expect(() =>
      trackAgentRun({
        stepsPlanned: 1,
        stepsApplied: 1,
        stepsSkipped: 0,
        stepsFailed: 0,
        durationMs: 10,
      })
    ).not.toThrow();

    // Flush the microtask queue — an unhandled rejection here would fail the run.
    await new Promise((r) => setTimeout(r, 0));
    expect(mutateMock).toHaveBeenCalledTimes(2);
  });

  it("swallows a synchronous throw from the client getter itself", () => {
    clientFactory = () => {
      throw new Error("tRPC client unavailable");
    };

    expect(() =>
      trackAiEditApplied({
        applyOps: { commit: { commands: [{ commandId: "set-style" }] } },
        surface: "inline",
      })
    ).not.toThrow();
    expect(() =>
      trackAgentRun({
        stepsPlanned: 2,
        stepsApplied: 0,
        stepsSkipped: 0,
        stepsFailed: 2,
        durationMs: 5,
      })
    ).not.toThrow();
    expect(mutateMock).not.toHaveBeenCalled();
  });
});
