/**
 * Regression: account-deletion sole-owner / active-subscription guard (M20,
 * app-audit 2026-07-22). Found by /qa. The guard was dead on both layers, so a
 * sole owner could delete their account and orphan the workspace + a live
 * subscription. These verify the authoritative backend check.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const workspaceFindMany = vi.fn();
const deletionCreate = vi.fn();
const userFindUnique = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    workspace: { findMany: (...a: unknown[]) => workspaceFindMany(...a) },
    accountDeletionReq: { create: (...a: unknown[]) => deletionCreate(...a) },
    user: { findUnique: (...a: unknown[]) => userFindUnique(...a) },
  },
}));
vi.mock("@/server/services/email.service", () => ({
  sendAccountDeletionEmail: vi.fn().mockResolvedValue(undefined),
}));

import {
  getAccountDeletionEligibility,
  requestAccountDeletion,
  AccountDeletionBlockedError,
} from "@/server/services/account.service";

beforeEach(() => {
  workspaceFindMany.mockReset();
  deletionCreate.mockReset();
  userFindUnique.mockReset();
  userFindUnique.mockResolvedValue({ email: "u@x.com" });
  deletionCreate.mockResolvedValue({ scheduledAt: new Date(0) });
});

describe("getAccountDeletionEligibility", () => {
  it("flags sole owner of a shared workspace", async () => {
    workspaceFindMany.mockResolvedValueOnce([{ subscription: null, _count: { members: 3 } }]);
    const r = await getAccountDeletionEligibility("u_1");
    expect(r.isSoleOwner).toBe(true);
    expect(r.blocked).toBe(true);
  });

  it("flags an active subscription", async () => {
    workspaceFindMany.mockResolvedValueOnce([{ subscription: { status: "ACTIVE" }, _count: { members: 1 } }]);
    const r = await getAccountDeletionEligibility("u_1");
    expect(r.hasActiveSubscription).toBe(true);
    expect(r.blocked).toBe(true);
  });

  it("clears a solo owner with no subscription", async () => {
    workspaceFindMany.mockResolvedValueOnce([{ subscription: null, _count: { members: 1 } }]);
    const r = await getAccountDeletionEligibility("u_1");
    expect(r.blocked).toBe(false);
  });
});

describe("requestAccountDeletion guard", () => {
  it("refuses a sole owner and never creates the request", async () => {
    workspaceFindMany.mockResolvedValueOnce([{ subscription: null, _count: { members: 2 } }]);
    await expect(requestAccountDeletion("u_1")).rejects.toBeInstanceOf(AccountDeletionBlockedError);
    expect(deletionCreate).not.toHaveBeenCalled();
  });

  it("refuses an active subscriber and never creates the request", async () => {
    workspaceFindMany.mockResolvedValueOnce([{ subscription: { status: "PAST_DUE" }, _count: { members: 1 } }]);
    await expect(requestAccountDeletion("u_1")).rejects.toBeInstanceOf(AccountDeletionBlockedError);
    expect(deletionCreate).not.toHaveBeenCalled();
  });

  it("proceeds for a clean solo account", async () => {
    workspaceFindMany.mockResolvedValueOnce([{ subscription: null, _count: { members: 1 } }]);
    await requestAccountDeletion("u_1", "leaving");
    expect(deletionCreate).toHaveBeenCalledOnce();
  });
});
