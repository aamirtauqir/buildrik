/**
 * AI adoption tracker (client). Verifies the three signals emit the right
 * payloads, that command TYPE names (not values) are extracted, that a missing
 * siteId suppresses the send, and that revert is attributed only to the
 * "ai-edit" history label.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const mutate = vi.fn(() => Promise.resolve({ ok: true }));
vi.mock("../subscriptionClient", () => ({
  getAiSubscriptionClient: () => ({ ai: { logAdoption: { mutate } } }),
}));

const getSiteIdFromUrl = vi.fn<[], string | null>(() => "site-1");
vi.mock("@/services/BuildrikSyncProvider", () => ({
  getSiteIdFromUrl: () => getSiteIdFromUrl(),
}));

import {
  trackAiEditApplied,
  trackAgentRun,
  attachAdoptionRevertListener,
} from "../adoptionTracker";
import { EVENTS } from "@/shared/constants";

const editWith = (...commandIds: string[]) => ({
  commit: { commands: commandIds.map((commandId) => ({ commandId, args: {} })) },
});

describe("adoptionTracker", () => {
  beforeEach(() => {
    mutate.mockClear();
    getSiteIdFromUrl.mockReturnValue("site-1");
  });

  it("trackAiEditApplied sends command TYPE names + count, not values", () => {
    trackAiEditApplied({
      applyOps: editWith("set-style", "set-token"),
      surface: "chat",
      model: "ollama",
    });
    expect(mutate).toHaveBeenCalledOnce();
    expect(mutate.mock.calls[0][0]).toMatchObject({
      siteId: "site-1",
      event: "edit.applied",
      surface: "chat",
      model: "ollama",
      commandIds: ["set-style", "set-token"],
      appliedCount: 2,
    });
  });

  it("suppresses the send when there is no siteId (editor opened standalone)", () => {
    getSiteIdFromUrl.mockReturnValue(null);
    trackAiEditApplied({ applyOps: editWith("set-style"), surface: "inline" });
    expect(mutate).not.toHaveBeenCalled();
  });

  it("trackAgentRun reports the step outcome counts", () => {
    trackAgentRun({
      stepsPlanned: 3,
      stepsApplied: 2,
      stepsSkipped: 1,
      stepsFailed: 0,
      durationMs: 4200,
      model: "ollama",
    });
    expect(mutate.mock.calls[0][0]).toMatchObject({
      event: "agent.run",
      surface: "agent",
      stepsPlanned: 3,
      stepsApplied: 2,
      stepsSkipped: 1,
      durationMs: 4200,
    });
  });

  it("attachAdoptionRevertListener fires edit.reverted ONLY for the ai-edit label", () => {
    let handler: (d: { entry?: { label?: string } }) => void = () => {};
    const composer = {
      on: (_evt: string, cb: (d: unknown) => void) => { handler = cb as typeof handler; },
      off: vi.fn(),
    } as never;
    const detach = attachAdoptionRevertListener(composer);

    handler({ entry: { label: "move-element" } }); // not an AI edit
    expect(mutate).not.toHaveBeenCalled();

    handler({ entry: { label: "ai-edit" } }); // AI edit reverted
    expect(mutate).toHaveBeenCalledOnce();
    expect(mutate.mock.calls[0][0]).toMatchObject({ siteId: "site-1", event: "edit.reverted" });

    detach();
  });

  it("subscribes to the HISTORY_UNDO event", () => {
    const on = vi.fn();
    attachAdoptionRevertListener({ on, off: vi.fn() } as never);
    expect(on).toHaveBeenCalledWith(EVENTS.HISTORY_UNDO, expect.any(Function));
  });
});
