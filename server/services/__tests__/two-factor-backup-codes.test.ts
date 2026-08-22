/**
 * 2FA backup codes must come from a CSPRNG.
 *
 * `enable2FA` built its ten codes with `Math.floor(Math.random() * 36)`.
 * `Math.random()` is not a CSPRNG: V8 runs xorshift128+, whose internal state
 * is recoverable from a short run of outputs — and all ten codes come off one
 * stream in one call, which is exactly the observation that makes recovery
 * practical. A backup code bypasses TOTP completely, so guessing one is
 * guessing the whole second factor.
 *
 * The repo had already learned this in the next file over:
 * `auth.service.ts:71` reads "CSPRNG suffix — Math.random() made the
 * disambiguator guessable". The fix landed there and not here.
 *
 * There is no behavioural delta to assert — same alphabet, same length, same
 * hashing — so the test is deliberately white-box: it fails if `Math.random`
 * is touched at all while codes are being minted.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const userFindUnique = vi.fn();
const userUpdate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: (...a: unknown[]) => userFindUnique(...a),
      update: (...a: unknown[]) => userUpdate(...a),
    },
  },
}));
vi.mock("@/server/services/auth.service", () => ({
  encryptSecret: (s: string) => `enc:${s}`,
  hashBackupCodes: async (codes: string[]) => codes.map((c) => `hash:${c}`),
}));

import { enable2FA } from "@/server/services/account.service";

beforeEach(() => {
  userFindUnique.mockReset();
  userUpdate.mockReset();
  userFindUnique.mockResolvedValue({ email: "owner@example.com" });
  userUpdate.mockResolvedValue({});
});

describe("enable2FA backup codes", () => {
  it("never draws them from Math.random", async () => {
    const spy = vi.spyOn(Math, "random");
    await enable2FA("user-1");
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("still mints ten codes in the shape users have already written down", async () => {
    const { backupCodes } = await enable2FA("user-1");
    expect(backupCodes).toHaveLength(10);
    for (const code of backupCodes) {
      expect(code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    }
    expect(new Set(backupCodes).size).toBe(10);
  });

  it("hashes the codes before they reach the row, and returns the plaintext once", async () => {
    const { backupCodes } = await enable2FA("user-1");
    const written = userUpdate.mock.calls[0][0].data.backupCodes;
    expect(written).toEqual(backupCodes.map((c: string) => `hash:${c}`));
    expect(written).not.toEqual(backupCodes);
  });
});
