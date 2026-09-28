/**
 * D7 — the last-used workspace is recorded. DEFAULT_WORKSPACE_ORDER picks the
 * membership with the newest `lastActiveAt`, but nothing ever wrote the column,
 * so the "last used" pick was really "oldest join". Sign-in (OAuth through the
 * jwt callback, password through /api/auth/create-session) and a successful
 * workspace switch stamp it. The stamp is best-effort: a DB error in it never
 * fails auth.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { userFindUnique, memberFindFirst, memberUpdateMany, sessionCreate, sessionFindMany } = vi.hoisted(() => ({
  userFindUnique: vi.fn(),
  memberFindFirst: vi.fn(),
  memberUpdateMany: vi.fn(),
  sessionCreate: vi.fn(),
  sessionFindMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: (...a: unknown[]) => userFindUnique(...a) },
    workspaceMember: {
      findFirst: (...a: unknown[]) => memberFindFirst(...a),
      updateMany: (...a: unknown[]) => memberUpdateMany(...a),
    },
    session: {
      create: (...a: unknown[]) => sessionCreate(...a),
      findMany: (...a: unknown[]) => sessionFindMany(...a),
      deleteMany: vi.fn(),
    },
  },
}));
vi.mock("@/server/services/audit.service", () => ({ logAuditEvent: vi.fn() }));
vi.mock("@/server/services/device-alert.service", () => ({ recordDeviceAndAlert: vi.fn() }));
vi.mock("@/server/services/token.service", () => ({
  validateToken: vi.fn().mockResolvedValue("u1"),
  invalidateToken: vi.fn(),
}));
vi.mock("next-auth/jwt", () => ({ encode: vi.fn().mockResolvedValue("jwt"), decode: vi.fn() }));

import { authConfig } from "@/server/auth.config";
import { POST as createSession } from "@/app/api/auth/create-session/route";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const jwtCallback = (authConfig.callbacks as any).jwt;

function stampedFor(userId: string, workspaceId: string) {
  return memberUpdateMany.mock.calls.some(
    ([args]) =>
      args.where.userId === userId &&
      args.where.workspaceId === workspaceId &&
      args.data.lastActiveAt instanceof Date,
  );
}

beforeEach(() => {
  userFindUnique.mockReset().mockResolvedValue({ id: "u1", email: "a@b.c", fullName: "A", sessionVersion: 0 });
  memberFindFirst.mockReset();
  memberUpdateMany.mockReset().mockResolvedValue({ count: 1 });
  sessionCreate.mockReset().mockResolvedValue({ id: "sess-1" });
  sessionFindMany.mockReset().mockResolvedValue([]);
});

describe("jwt callback — lastActiveAt", () => {
  it("OAuth sign-in stamps the workspace the token lands in", async () => {
    memberFindFirst.mockResolvedValue({ workspaceId: "ws-a" });

    const token = await jwtCallback({ token: {}, user: { id: "u1" } });

    expect(token.workspaceId).toBe("ws-a");
    expect(stampedFor("u1", "ws-a")).toBe(true);
  });

  it("a validated workspace switch stamps the NEW workspace", async () => {
    memberFindFirst.mockResolvedValue({ workspaceId: "ws-b" });

    const token = await jwtCallback({
      token: { userId: "u1", sv: 0, workspaceId: "ws-a" },
      trigger: "update",
      session: { workspaceId: "ws-b" },
    });

    expect(token.workspaceId).toBe("ws-b");
    expect(stampedFor("u1", "ws-b")).toBe(true);
    expect(stampedFor("u1", "ws-a")).toBe(false);
  });

  it("a switch to a workspace the user is not an ACTIVE member of stamps nothing", async () => {
    memberFindFirst.mockImplementation(async (args: { where: { workspaceId?: string } }) =>
      args.where.workspaceId === "ws-a" ? { workspaceId: "ws-a" } : null,
    );

    const token = await jwtCallback({
      token: { userId: "u1", sv: 0, workspaceId: "ws-a" },
      trigger: "update",
      session: { workspaceId: "ws-foreign" },
    });

    expect(token.workspaceId).toBe("ws-a");
    expect(memberUpdateMany).not.toHaveBeenCalled();
  });

  it("an ordinary request (no sign-in, no switch) writes nothing", async () => {
    memberFindFirst.mockResolvedValue({ workspaceId: "ws-a" });

    await jwtCallback({ token: { userId: "u1", sv: 0, workspaceId: "ws-a" } });

    expect(memberUpdateMany).not.toHaveBeenCalled();
  });

  it("a DB error in the stamp does not break sign-in or the switch", async () => {
    memberFindFirst.mockResolvedValue({ workspaceId: "ws-a" });
    memberUpdateMany.mockRejectedValue(new Error("db down"));
    const err = vi.spyOn(console, "error").mockImplementation(() => {});

    const signedIn = await jwtCallback({ token: {}, user: { id: "u1" } });
    const switched = await jwtCallback({
      token: { userId: "u1", sv: 0, workspaceId: "ws-x" },
      trigger: "update",
      session: { workspaceId: "ws-a" },
    });

    expect(signedIn).toMatchObject({ userId: "u1", workspaceId: "ws-a" });
    expect(switched).toMatchObject({ userId: "u1", workspaceId: "ws-a" });
    err.mockRestore();
  });
});

describe("/api/auth/create-session — lastActiveAt", () => {
  function request() {
    return new NextRequest("http://localhost:3000/api/auth/create-session", {
      method: "POST",
      headers: { origin: "http://localhost:3000", "content-type": "application/json" },
      body: JSON.stringify({ sessionToken: "3b241101-e2bb-4255-8caf-4136c566a962" }),
    });
  }

  it("password sign-in stamps the workspace the session lands in", async () => {
    memberFindFirst.mockResolvedValue({ workspaceId: "ws-a" });

    const res = await createSession(request());

    expect(res.status).toBe(200);
    expect(stampedFor("u1", "ws-a")).toBe(true);
  });

  it("a DB error in the stamp does not fail session creation", async () => {
    memberFindFirst.mockResolvedValue({ workspaceId: "ws-a" });
    memberUpdateMany.mockRejectedValue(new Error("db down"));
    const err = vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await createSession(request());

    expect(res.status).toBe(200);
    expect(res.cookies.get("next-auth.session-token")?.value).toBe("jwt");
    err.mockRestore();
  });
});
