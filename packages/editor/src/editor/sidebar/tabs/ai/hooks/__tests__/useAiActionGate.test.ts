/**
 * AI action confirm gate. propose opens the consequence dialog; confirm exports
 * the pages and calls actions.confirm with the issued token + the page payload.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const proposeMutate = vi.fn(() =>
  Promise.resolve({ token: "tok-1", confirm: { title: "Publish site", consequence: "Deploys live. No undo.", undoable: false } }),
);
const confirmMutate = vi.fn(() => Promise.resolve({ id: "job-1" }));
vi.mock("@/services/ai/subscriptionClient", () => ({
  getAiSubscriptionClient: () => ({
    actions: { propose: { mutate: proposeMutate }, confirm: { mutate: confirmMutate } },
  }),
}));
vi.mock("@/services/BuildrikSyncProvider", () => ({ getSiteIdFromUrl: () => "site-1" }));
vi.mock("@/editor/shell/exportPublishPages", () => ({
  exportPublishPages: vi.fn(() => Promise.resolve([{ path: "index.html", html: "<h1>Hi</h1>" }])),
}));
vi.mock("@/services/PublishService", () => ({ fetchPublishStatus: vi.fn(() => Promise.resolve({ status: "QUEUED" })) }));
const addToast = vi.fn();
vi.mock("@/editor/shared/vibcoder/Toast", () => ({ useToast: () => ({ addToast }) }));

import { useAiActionGate } from "../useAiActionGate";

describe("useAiActionGate", () => {
  beforeEach(() => {
    proposeMutate.mockClear();
    confirmMutate.mockClear();
    addToast.mockClear();
  });

  it("propose opens the consequence dialog from the server describe()", async () => {
    const composer = {} as never;
    const { result } = renderHook(() => useAiActionGate(composer));
    await act(async () => {
      await result.current.propose("site.publish");
    });
    expect(proposeMutate).toHaveBeenCalledWith({ siteId: "site-1", actionId: "site.publish", args: {} });
    expect(result.current.state.open).toBe(true);
    expect(result.current.state.consequence).toMatch(/no undo/i);
  });

  it("confirm exports pages and calls actions.confirm with the issued token", async () => {
    const composer = {} as never;
    const { result } = renderHook(() => useAiActionGate(composer));
    await act(async () => {
      await result.current.propose("site.publish");
    });
    await act(async () => {
      await result.current.confirm();
    });
    expect(confirmMutate).toHaveBeenCalledWith({
      token: "tok-1",
      payload: { pages: [{ path: "index.html", html: "<h1>Hi</h1>" }] },
    });
    expect(result.current.state.open).toBe(false); // gate closes after confirm
  });

  it("cancel closes the gate without confirming", async () => {
    const composer = {} as never;
    const { result } = renderHook(() => useAiActionGate(composer));
    await act(async () => {
      await result.current.propose("site.publish");
    });
    act(() => result.current.cancel());
    expect(result.current.state.open).toBe(false);
    expect(confirmMutate).not.toHaveBeenCalled();
  });
});
