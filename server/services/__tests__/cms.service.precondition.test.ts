/**
 * L3-022 — a record update names the version it was edited from. The server
 * used to accept an update with no `expectedUpdatedAt` (or `null`) as a blind
 * write, so any caller that left it out overwrote another person's edit with
 * no conflict. "Keep mine" is now an explicit `overwrite` against the
 * revision the person reviewed — a later edit in between is a fresh CONFLICT.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  colFindFirst: vi.fn(),
  entFindMany: vi.fn(), entFindUnique: vi.fn(), entCreate: vi.fn(), entUpdateMany: vi.fn(),
  siteUpdate: vi.fn(), entCount: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    site: { update: (...a: unknown[]) => mocks.siteUpdate(...a) },
    cmsCollection: { findFirst: (...a: unknown[]) => mocks.colFindFirst(...a) },
    cmsEntry: {
      findMany: (...a: unknown[]) => mocks.entFindMany(...a),
      findUnique: (...a: unknown[]) => mocks.entFindUnique(...a),
      create: (...a: unknown[]) => mocks.entCreate(...a),
      updateMany: (...a: unknown[]) => mocks.entUpdateMany(...a),
      count: (...a: unknown[]) => mocks.entCount(...a),
    },
  },
}));

import { upsertEntry, CmsError } from "@server/services/cms.service";
import { upsertEntryInput } from "@buildrik/shared/schemas/cms";

const AT = new Date("2026-10-10T10:00:00.000Z");
const LATER = new Date("2026-10-10T10:05:00.000Z");
const FIELDS = [{ id: "f-name", name: "Name", slug: "name", type: "text", order: 0, validation: { required: true } }];

beforeEach(() => {
  Object.values(mocks).forEach((m) => m.mockReset());
  mocks.siteUpdate.mockResolvedValue({});
  mocks.entCount.mockResolvedValue(0);
  mocks.entFindMany.mockResolvedValue([]);
  mocks.colFindFirst.mockResolvedValue({ deletedAt: null, fields: FIELDS, pageSlugPattern: null });
  mocks.entCreate.mockImplementation(async ({ data }: { data: unknown }) => data);
  /* An existing row, last written at AT. */
  mocks.entFindUnique.mockResolvedValue({ deletedAt: null, status: "DRAFT", updatedAt: AT, collection: { siteId: "s1" } });
  mocks.entUpdateMany.mockResolvedValue({ count: 1 });
});

async function codeOf(p: Promise<unknown>): Promise<string> {
  try {
    await p;
  } catch (e) {
    expect(e).toBeInstanceOf(CmsError);
    return (e as CmsError).code;
  }
  throw new Error("expected a CmsError");
}

const base = { id: "e1", siteId: "s1", collectionId: "c1", data: { name: "Mine" } };

describe("record updates require a precondition (L3-022)", () => {
  it("refuses an update that names no version (BAD_REQUEST), and writes nothing", async () => {
    expect(await codeOf(upsertEntry("s1", { ...base }))).toBe("BAD_REQUEST");
    expect(mocks.entUpdateMany).not.toHaveBeenCalled();
  });

  it("answers an update that thought the row was new (null) with CONFLICT carrying the server's version", async () => {
    let caught: unknown;
    try {
      await upsertEntry("s1", { ...base, expectedUpdatedAt: null });
    } catch (e) {
      caught = e;
    }
    expect((caught as CmsError).code).toBe("CONFLICT");
    expect((caught as CmsError).message).toBe(AT.toISOString());
    expect(mocks.entUpdateMany).not.toHaveBeenCalled();
  });

  it("writes a matching precondition conditionally (WHERE updatedAt = expected)", async () => {
    await upsertEntry("s1", { ...base, expectedUpdatedAt: AT.toISOString() });
    expect(mocks.entUpdateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "e1", updatedAt: AT, deletedAt: null } }));
  });

  it("a create (no row yet) needs no precondition", async () => {
    mocks.entFindUnique.mockResolvedValue(null);
    await upsertEntry("s1", { ...base, id: "new1" });
    await upsertEntry("s1", { siteId: "s1", collectionId: "c1", data: { name: "No id" } });
    expect(mocks.entCreate).toHaveBeenCalledTimes(2);
  });

  it("Keep mine: an overwrite against the reviewed revision is a conditional write on that revision", async () => {
    await upsertEntry("s1", { ...base, overwrite: { reviewedUpdatedAt: AT.toISOString() } });
    expect(mocks.entUpdateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "e1", updatedAt: AT, deletedAt: null } }));
  });

  it("Keep mine against a revision another edit has replaced is a fresh CONFLICT", async () => {
    mocks.entUpdateMany.mockResolvedValue({ count: 0 });
    mocks.entFindUnique
      .mockResolvedValueOnce({ deletedAt: null, status: "DRAFT", updatedAt: LATER, collection: { siteId: "s1" } })
      .mockResolvedValueOnce({ deletedAt: null, updatedAt: LATER });
    let caught: unknown;
    try {
      await upsertEntry("s1", { ...base, overwrite: { reviewedUpdatedAt: AT.toISOString() } });
    } catch (e) {
      caught = e;
    }
    expect((caught as CmsError).code).toBe("CONFLICT");
    expect((caught as CmsError).message).toBe(LATER.toISOString());
  });

  it("Keep mine still meets the collection's rules (validation applies to an overwrite)", async () => {
    expect(
      await codeOf(upsertEntry("s1", { ...base, data: {}, status: "PUBLISHED", overwrite: { reviewedUpdatedAt: AT.toISOString() } })),
    ).toBe("INVALID");
    expect(mocks.entUpdateMany).not.toHaveBeenCalled();
  });

  it("the transport schema carries overwrite and refuses it alongside expectedUpdatedAt", () => {
    const ok = upsertEntryInput.safeParse({ ...base, overwrite: { reviewedUpdatedAt: AT.toISOString() } });
    expect(ok.success).toBe(true);
    const both = upsertEntryInput.safeParse({ ...base, expectedUpdatedAt: AT.toISOString(), overwrite: { reviewedUpdatedAt: AT.toISOString() } });
    expect(both.success).toBe(false);
  });
});
