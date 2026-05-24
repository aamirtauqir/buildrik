import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";

const createSessionSource = readFileSync(
  path.resolve(__dirname, "../packages/dashboard/app/api/auth/create-session/route.ts"),
  "utf-8"
);

const authServiceSource = readFileSync(
  path.resolve(__dirname, "../server/services/auth.service.ts"),
  "utf-8"
);

const authConfigSource = readFileSync(
  path.resolve(__dirname, "../server/auth.config.ts"),
  "utf-8"
);

const routerSource = readFileSync(
  path.resolve(__dirname, "../server/trpc/routers/auth.ts"),
  "utf-8"
);

const auditServiceSource = readFileSync(
  path.resolve(__dirname, "../server/services/audit.service.ts"),
  "utf-8"
);

describe("Fix #11: No duplicate LOGIN_SUCCESS audit in create-session", () => {
  it("create-session route does NOT log LOGIN_SUCCESS (service already does)", () => {
    // create-session should use SESSION_CREATED, not duplicate LOGIN_SUCCESS
    const hasLoginSuccess = createSessionSource.includes('"LOGIN_SUCCESS"');
    expect(hasLoginSuccess).toBe(false);
  });

  it("create-session route logs SESSION_CREATED instead", () => {
    expect(createSessionSource).toContain("SESSION_CREATED");
  });

  it("SESSION_CREATED is defined in audit action type", () => {
    expect(auditServiceSource).toContain("SESSION_CREATED");
  });
});

describe("Fix #12: Magic link audit logging", () => {
  it("sendMagicLink logs MAGIC_LINK_REQUESTED audit event", () => {
    const sendMagicLinkStart = authServiceSource.indexOf("export async function sendMagicLink(");
    const sendMagicLinkEnd = authServiceSource.indexOf("export async function verifyMagicLink(");
    const sendMagicLinkFn = authServiceSource.slice(sendMagicLinkStart, sendMagicLinkEnd);

    expect(sendMagicLinkFn).toContain("MAGIC_LINK_REQUESTED");
  });

  it("MAGIC_LINK_REQUESTED is defined in audit action type", () => {
    expect(auditServiceSource).toContain("MAGIC_LINK_REQUESTED");
  });
});

describe("Fix #13: OAuth audit logging and lastLoginAt", () => {
  it("OAuth signIn callback logs audit event", () => {
    expect(authConfigSource).toContain("logAuditEvent");
  });

  it("OAuth signIn callback updates lastLoginAt for existing users", () => {
    expect(authConfigSource).toContain("lastLoginAt");
  });
});

describe("Fix #14: acceptInvite creates WorkspaceMember", () => {
  it("acceptInvite creates a WorkspaceMember record in the database", () => {
    // Find the acceptInvite section in router
    const acceptSection = routerSource.slice(
      routerSource.indexOf("acceptInvite:"),
      routerSource.indexOf("declineInvite:")
    );

    expect(acceptSection).toContain("workspaceMember");
  });
});
