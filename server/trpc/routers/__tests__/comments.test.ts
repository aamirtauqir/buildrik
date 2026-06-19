/**
 * comments router (E7). Verifies create/list require site access (a viewer can
 * comment), resolve requires EDITOR on the site (the agency resolves, not the
 * commenter), and a blocked call never reaches the service.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const assertAccessMock = vi.fn();
const checkSiteRoleMock = vi.fn();
const createMock = vi.fn();
const listMock = vi.fn();
const resolveMock = vi.fn();

vi.mock("@/server/auth", () => ({ auth: vi.fn().mockResolvedValue(null) }));
vi.mock("@/server/services/api-token.service", () => ({
  extractBearer: () => null,
  verifyApiToken: vi.fn(),
}));
vi.mock("next/headers", () => ({
  cookies: () => Promise.resolve({ get: () => undefined, delete: vi.fn() }),
}));
vi.mock("@/server/services/permission.service", () => ({
  assertSiteAccess: (...a: unknown[]) => assertAccessMock(...a),
  checkSiteRole: (...a: unknown[]) => checkSiteRoleMock(...a),
  PermissionError: class PermissionError extends Error {
    code: string;
    constructor(code: string, msg?: string) {
      super(msg ?? code);
      this.code = code;
    }
  },
}));
vi.mock("@/server/services/comment.service", () => ({
  createComment: (...a: unknown[]) => createMock(...a),
  listComments: (...a: unknown[]) => listMock(...a),
  resolveComment: (...a: unknown[]) => resolveMock(...a),
  CommentError: class CommentError extends Error {
    code: string;
    constructor(code: string, msg?: string) {
      super(msg ?? code);
      this.code = code;
    }
  },
}));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import { commentsRouter } from "@/server/trpc/routers/comments";
import { PermissionError } from "@/server/services/permission.service";

function makeCtx() {
  return { session: { user: { id: "u_1" } }, prisma: {} as never };
}

beforeEach(() => {
  [assertAccessMock, checkSiteRoleMock, createMock, listMock, resolveMock].forEach((m) => m.mockReset());
});

describe("comments router", () => {
  it("create requires site access; a non-member never creates", async () => {
    assertAccessMock.mockRejectedValueOnce(new PermissionError("FORBIDDEN", "no access"));
    const caller = commentsRouter.createCaller(makeCtx() as never);
    await expect(caller.create({ siteId: "s1", body: "hi" })).rejects.toThrow(/access/i);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("create works for a member with access (viewer can comment)", async () => {
    assertAccessMock.mockResolvedValueOnce(undefined);
    createMock.mockResolvedValueOnce({ id: "c1" });
    const caller = commentsRouter.createCaller(makeCtx() as never);
    await expect(caller.create({ siteId: "s1", body: "fix hero", x: 0.5, y: 0.5 })).resolves.toMatchObject({ id: "c1" });
    expect(createMock).toHaveBeenCalledWith("s1", "u_1", expect.objectContaining({ body: "fix hero" }));
  });

  it("resolve requires EDITOR on the site; a viewer can't resolve", async () => {
    checkSiteRoleMock.mockRejectedValueOnce(new PermissionError("FORBIDDEN", "needs EDITOR"));
    const caller = commentsRouter.createCaller(makeCtx() as never);
    await expect(caller.resolve({ id: "c1", siteId: "s1", status: "RESOLVED" })).rejects.toThrow(/EDITOR/i);
    expect(resolveMock).not.toHaveBeenCalled();
  });

  it("resolve runs for an editor", async () => {
    checkSiteRoleMock.mockResolvedValueOnce(undefined);
    resolveMock.mockResolvedValueOnce({ id: "c1", status: "RESOLVED" });
    const caller = commentsRouter.createCaller(makeCtx() as never);
    await expect(caller.resolve({ id: "c1", siteId: "s1", status: "RESOLVED" })).resolves.toMatchObject({ status: "RESOLVED" });
    expect(resolveMock).toHaveBeenCalledWith("s1", "c1", "RESOLVED", "u_1");
  });
});
