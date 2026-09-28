/**
 * account.twoFactor.enable — error mapping. SA-03 added a
 * TWO_FACTOR_ALREADY_ENABLED domain error (server/services/account.service.ts)
 * and the router maps it to CONFLICT with a specific message, alongside the
 * pre-existing USER_NOT_FOUND -> NOT_FOUND mapping and the catch-all
 * INTERNAL_SERVER_ERROR. account-service.test.ts proves the SERVICE throws
 * the string; nothing asserted the ROUTER translates it to the right
 * TRPCError — this file closes that gap.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const { enable2FA } = vi.hoisted(() => ({ enable2FA: vi.fn() }));

vi.mock("@/server/auth", () => ({ auth: vi.fn().mockResolvedValue(null) }));
vi.mock("@/server/services/api-token.service", () => ({ extractBearer: () => null, verifyApiToken: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: () => Promise.resolve({ get: () => undefined, delete: vi.fn() }) }));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/server/services/account.service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/server/services/account.service")>()),
  enable2FA,
}));

import { accountRouter } from "@/server/trpc/routers/account";

function caller() {
  return accountRouter.createCaller({ session: { user: { id: "u_1" } }, prisma: {} } as never);
}

beforeEach(() => {
  enable2FA.mockReset();
});

describe("account.twoFactor.enable — error mapping (SA-03)", () => {
  it("maps TWO_FACTOR_ALREADY_ENABLED to CONFLICT with the turn-it-off-first message", async () => {
    enable2FA.mockRejectedValue(new Error("TWO_FACTOR_ALREADY_ENABLED"));

    await expect(caller().twoFactor.enable()).rejects.toMatchObject({
      code: "CONFLICT",
      message: "Two-factor is already on. Turn it off first to set up a new authenticator.",
    });
  });

  it("maps USER_NOT_FOUND to NOT_FOUND", async () => {
    enable2FA.mockRejectedValue(new Error("USER_NOT_FOUND"));

    await expect(caller().twoFactor.enable()).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "User not found.",
    });
  });

  it("maps an unrecognized error to a generic INTERNAL_SERVER_ERROR, not the raw message", async () => {
    enable2FA.mockRejectedValue(new Error("some raw db error"));

    await expect(caller().twoFactor.enable()).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
      message: "Couldn't start two-factor setup. Please try again.",
    });
  });

  it("returns the setup payload on success", async () => {
    enable2FA.mockResolvedValue({ secret: "SECRET", otpauth: "otpauth://totp/x" });

    await expect(caller().twoFactor.enable()).resolves.toEqual({ secret: "SECRET", otpauth: "otpauth://totp/x" });
  });
});
