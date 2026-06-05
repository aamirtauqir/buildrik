/**
 * AI adoption telemetry — recordAiAdoption. Verifies the capability scope (site
 * must exist AND actor must be a workspace member) and that only structural
 * metrics are persisted (no prompt/content fields).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const siteFindUnique = vi.fn();
const memberFindFirst = vi.fn();
const eventCreate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    site: { findUnique: (...a: unknown[]) => siteFindUnique(...a) },
    workspaceMember: { findFirst: (...a: unknown[]) => memberFindFirst(...a) },
    aiAdoptionEvent: { create: (...a: unknown[]) => eventCreate(...a) },
  },
}));

import { recordAiAdoption } from "@server/services/ai-adoption.service";

describe("recordAiAdoption", () => {
  beforeEach(() => {
    siteFindUnique.mockReset();
    memberFindFirst.mockReset();
    eventCreate.mockReset();
  });

  it("writes an event when the site exists and the actor is a member", async () => {
    siteFindUnique.mockResolvedValueOnce({ workspaceId: "ws-1" });
    memberFindFirst.mockResolvedValueOnce({ id: "m-1" });

    await recordAiAdoption("user-1", {
      siteId: "site-1",
      event: "edit.applied",
      surface: "chat",
      model: "ollama",
      commandIds: ["set-style", "set-token"],
      appliedCount: 2,
    });

    expect(eventCreate).toHaveBeenCalledOnce();
    const data = eventCreate.mock.calls[0][0].data;
    expect(data.workspaceId).toBe("ws-1");
    expect(data.siteId).toBe("site-1");
    expect(data.actorId).toBe("user-1");
    expect(data.event).toBe("edit.applied");
    expect(data.surface).toBe("chat");
    // structural metrics live in metadata; no prompt/content keys
    expect(data.metadata).toEqual({ commandIds: ["set-style", "set-token"], appliedCount: 2 });
    expect(JSON.stringify(data)).not.toMatch(/prompt|content|text/i);
  });

  it("drops the event when the site does not exist", async () => {
    siteFindUnique.mockResolvedValueOnce(null);
    await recordAiAdoption("user-1", { siteId: "ghost", event: "edit.reverted" });
    expect(memberFindFirst).not.toHaveBeenCalled();
    expect(eventCreate).not.toHaveBeenCalled();
  });

  it("drops the event when the actor is NOT a member of the site's workspace", async () => {
    siteFindUnique.mockResolvedValueOnce({ workspaceId: "ws-1" });
    memberFindFirst.mockResolvedValueOnce(null);
    await recordAiAdoption("intruder", { siteId: "site-1", event: "edit.applied" });
    expect(eventCreate).not.toHaveBeenCalled();
  });

  it("never throws when prisma fails (telemetry must not crash the edit path)", async () => {
    siteFindUnique.mockRejectedValueOnce(new Error("db down"));
    await expect(
      recordAiAdoption("user-1", { siteId: "site-1", event: "agent.run" }),
    ).resolves.toBeUndefined();
  });

  it("omits metadata when only the base fields are present", async () => {
    siteFindUnique.mockResolvedValueOnce({ workspaceId: "ws-1" });
    memberFindFirst.mockResolvedValueOnce({ id: "m-1" });
    await recordAiAdoption("user-1", { siteId: "site-1", event: "edit.reverted" });
    expect(eventCreate.mock.calls[0][0].data.metadata).toBeUndefined();
  });
});
