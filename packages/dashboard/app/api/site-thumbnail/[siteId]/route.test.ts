import { describe, it, expect, vi, beforeEach } from "vitest";

const authMock = vi.fn();
const assertEditMock = vi.fn();
const setThumbMock = vi.fn();
const putMock = vi.fn();

vi.mock("@server/auth", () => ({ auth: () => authMock() }));
vi.mock("@vercel/blob", () => ({ put: (...args: unknown[]) => putMock(...args) }));
vi.mock("@server/services/sites.service", () => ({
  assertSiteEditAccess: (...a: unknown[]) => assertEditMock(...a),
  setSiteThumbnail: (...a: unknown[]) => setThumbMock(...a),
}));
vi.mock("@server/services/permission.service", () => {
  class PermissionError extends Error {
    constructor(public code: "NOT_FOUND" | "FORBIDDEN", message?: string) {
      super(message ?? code);
      this.name = "PermissionError";
    }
  }
  return { PermissionError };
});

import { POST } from "./route";
import { PermissionError } from "@server/services/permission.service";

const VALID_ID = "cmrtebwij0011718lkoz62f3p"; // cuid-shaped, passes the regex

function pngReq(body: BodyInit = new Uint8Array([1, 2, 3])) {
  return new Request(`http://localhost/api/site-thumbnail/${VALID_ID}`, {
    method: "POST",
    headers: { "content-type": "image/png" },
    body,
  });
}
const ctx = (siteId: string) => ({ params: Promise.resolve({ siteId }) });

describe("POST /api/site-thumbnail/[siteId]", () => {
  beforeEach(() => {
    authMock.mockReset();
    assertEditMock.mockReset();
    setThumbMock.mockReset();
    putMock.mockReset();
    putMock.mockResolvedValue({ url: "https://blob.example/sites/x/thumbnail.png" });
    setThumbMock.mockResolvedValue({ id: VALID_ID, thumbnail: "https://blob.example/x.png" });
  });

  it("401 unauthenticated — never touches blob storage", async () => {
    authMock.mockResolvedValueOnce(null);
    const res = await POST(pngReq(), ctx(VALID_ID));
    expect(res.status).toBe(401);
    expect(putMock).not.toHaveBeenCalled();
  });

  it("400 on a malformed siteId — never authorizes or writes", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "u_1" } });
    const res = await POST(pngReq(), ctx("../../etc/passwd"));
    expect(res.status).toBe(400);
    expect(assertEditMock).not.toHaveBeenCalled();
    expect(putMock).not.toHaveBeenCalled();
  });

  it("403 for a non-member — and the blob is NEVER written before authz (IDOR guard)", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "u_1" } });
    assertEditMock.mockRejectedValueOnce(new PermissionError("FORBIDDEN"));
    const res = await POST(pngReq(), ctx(VALID_ID));
    expect(res.status).toBe(403);
    // The security invariant: authorization runs before any blob write.
    expect(putMock).not.toHaveBeenCalled();
    expect(setThumbMock).not.toHaveBeenCalled();
  });

  it("400 when the body is not image/png", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "u_1" } });
    assertEditMock.mockResolvedValueOnce(undefined);
    const req = new Request(`http://localhost/api/site-thumbnail/${VALID_ID}`, {
      method: "POST",
      headers: { "content-type": "text/plain" },
      body: "x",
    });
    const res = await POST(req, ctx(VALID_ID));
    expect(res.status).toBe(400);
    expect(putMock).not.toHaveBeenCalled();
  });

  it("200 for an authorized member — authorizes, then writes blob, then persists", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "u_1" } });
    assertEditMock.mockResolvedValueOnce(undefined);
    const res = await POST(pngReq(), ctx(VALID_ID));
    expect(res.status).toBe(200);
    expect(assertEditMock).toHaveBeenCalledWith("u_1", VALID_ID);
    expect(putMock).toHaveBeenCalledTimes(1);
    expect(setThumbMock).toHaveBeenCalledTimes(1);
  });
});
