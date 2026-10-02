/**
 * importRedirects (Settings Phase B, BE-7). Every row goes through
 * `createRedirectSchema` — the Add-redirect dialog's rule — so a `javascript:`
 * target or a bare `new-page` is refused with its line; a `from` that already
 * has a rule (on the site, or earlier in the same file) is refused as a
 * duplicate; and it is all or nothing: one bad line and no row is written.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const { db } = vi.hoisted(() => {
  const db = {
    redirect: { findMany: vi.fn(), createMany: vi.fn() },
    $transaction: vi.fn(),
  };
  db.$transaction.mockImplementation(async (fn: (tx: typeof db) => unknown) => fn(db));
  return { db };
});

vi.mock("@/lib/prisma", () => ({ prisma: db }));

import { importRedirects } from "@server/services/redirect.service";

beforeEach(() => {
  db.redirect.findMany.mockReset().mockResolvedValue([]);
  db.redirect.createMany.mockReset().mockImplementation(async ({ data }) => ({ count: data.length }));
});

const HEADER = "from,to,type";

describe("importRedirects (BE-7)", () => {
  it("creates every valid row and says how many", async () => {
    const csv = [HEADER, "/old,/new,301", '"/menu","https://example.com/menu","302"', "/a,/b"].join("\n");
    await expect(importRedirects("s1", csv, "PRO")).resolves.toEqual({ created: 3 });
    expect(db.redirect.createMany).toHaveBeenCalledWith({
      data: [
        { siteId: "s1", fromPath: "/old", toUrl: "/new", type: "301" },
        { siteId: "s1", fromPath: "/menu", toUrl: "https://example.com/menu", type: "302" },
        { siteId: "s1", fromPath: "/a", toUrl: "/b", type: "301" },
      ],
    });
  });

  it.each([
    ["a javascript: target", "/ok,/fine\n/x,javascript:alert(1)", 3],
    ["a bare page name (fails the publish in vercel.json)", "/x,new-page", 2],
    ["a protocol-relative target", "/x,//evil.example", 2],
    ["a from that is not a path", "x,/y", 2],
    ["an unknown type", "/x,/y,307", 2],
  ])("refuses %s with its line, and writes nothing", async (_label, rows, line) => {
    await expect(importRedirects("s1", `${HEADER}\n${rows}`, "PRO")).rejects.toThrow(`INVALID_CSV_ROW:${line}`);
    expect(db.redirect.createMany).not.toHaveBeenCalled();
  });

  it("refuses a from that already has a rule on the site", async () => {
    db.redirect.findMany.mockResolvedValue([{ fromPath: "/taken" }]);
    await expect(importRedirects("s1", `${HEADER}\n/new,/x\n/taken,/y`, "PRO")).rejects.toThrow("DUPLICATE_CSV_ROW:3:/taken");
    expect(db.redirect.createMany).not.toHaveBeenCalled();
  });

  it("refuses a from repeated within the file", async () => {
    await expect(importRedirects("s1", `${HEADER}\n/a,/x\n/b,/y\n/a,/z`, "PRO")).rejects.toThrow("DUPLICATE_CSV_ROW:4:/a");
    expect(db.redirect.createMany).not.toHaveBeenCalled();
  });

  it("counts blank lines in the line numbers it reports", async () => {
    await expect(importRedirects("s1", `${HEADER}\n/a,/x\n\n/b,javascript:x`, "PRO")).rejects.toThrow("INVALID_CSV_ROW:4");
  });

  it("refuses the whole file past the plan's limit", async () => {
    db.redirect.findMany.mockResolvedValue(Array.from({ length: 99 }, (_, i) => ({ fromPath: `/e${i}` })));
    await expect(importRedirects("s1", `${HEADER}\n/a,/x\n/b,/y`, "FREE")).rejects.toThrow("REDIRECT_LIMIT");
    expect(db.redirect.createMany).not.toHaveBeenCalled();
  });
});
