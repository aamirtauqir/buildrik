/**
 * /share/<token> — what each token state renders. An open link renders the
 * saved draft (DraftPreview) and counts the view; everything else gets the
 * gate, and neither loads draft data.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const resolveMock = vi.fn();
const rowsMock = vi.fn();
const viewMock = vi.fn();
const cookieGet = vi.fn();

vi.mock("next/headers", () => ({ cookies: async () => ({ get: cookieGet }) }));
vi.mock("@server/services/share-link.service", () => ({
  resolveShareLink: (...a: unknown[]) => resolveMock(...a),
  getShareDraftRows: (...a: unknown[]) => rowsMock(...a),
  recordShareView: (...a: unknown[]) => viewMock(...a),
}));
vi.mock("../password-gate", () => ({ SharePasswordGate: () => null }));
vi.mock("../draft-preview", () => ({ DraftPreview: () => null }));

import SharePage from "../page";
import { SharePasswordGate } from "../password-gate";
import { DraftPreview } from "../draft-preview";

const render = () => SharePage({ params: Promise.resolve({ token: "tok" }) });

describe("SharePage", () => {
  beforeEach(() => {
    [resolveMock, rowsMock, viewMock, cookieGet].forEach((m) => m.mockReset());
  });

  it("passes the share_<token> cookie to the resolver", async () => {
    cookieGet.mockReturnValue({ value: "proof" });
    resolveMock.mockResolvedValue({ state: "locked" });
    await render();
    expect(cookieGet).toHaveBeenCalledWith("share_tok");
    expect(resolveMock).toHaveBeenCalledWith("tok", "proof");
  });

  it.each(["unavailable", "locked"])("%s → the gate, no draft data, no view counted", async (state) => {
    resolveMock.mockResolvedValue({ state });
    const node = (await render()) as { type: unknown };
    expect(node.type).toBe(SharePasswordGate);
    expect(rowsMock).not.toHaveBeenCalled();
    expect(viewMock).not.toHaveBeenCalled();
  });

  it("open → the saved draft of the link's site, and the view is counted", async () => {
    resolveMock.mockResolvedValue({ state: "open", linkId: "l1", siteId: "s1", siteName: "Bella" });
    const rows = { site: {}, pages: [], siteColumns: {}, siteFonts: [] };
    rowsMock.mockResolvedValue(rows);
    const node = (await render()) as { type: unknown; props: Record<string, unknown> };
    expect(node.type).toBe(DraftPreview);
    expect(node.props).toEqual({ siteName: "Bella", rows });
    expect(rowsMock).toHaveBeenCalledWith("s1");
    expect(viewMock).toHaveBeenCalledWith("l1");
  });
});
