/**
 * census-2l9 — the done predicate for the 2L9 design manifest (plan Task 0.4).
 * The final gate reads this script's exit code, so each exit path is pinned.
 */
import { describe, it, expect } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { census, isDone } from "../conformance/census-2l9.mjs";

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), "../conformance/census-2l9.mjs");
const row = (over = {}) => ({
  nodeId: "1:1", name: "Board", page: "03", family: "editor",
  status: "active", authority: "board", verified: "no", verifiedNote: "", ...over,
});
const run = (manifest, args = []) => {
  const dir = mkdtempSync(join(tmpdir(), "census-"));
  const file = join(dir, "m.json");
  writeFileSync(file, typeof manifest === "string" ? manifest : JSON.stringify(manifest));
  return spawnSync(process.execPath, [SCRIPT, file, ...args], { encoding: "utf8" });
};

describe("census", () => {
  it("exits 1 listing rows that fail the done predicate", () => {
    const r = run({ boards: [row(), row({ nodeId: "1:2", verified: "match" })] });
    expect(r.status).toBe(1);
    expect(r.stdout).toContain("1:1\teditor\tno\tboard\t");
    expect(r.stdout).not.toContain("1:2\t");
  });

  it("exits 0 when every active row is done", () => {
    const r = run({ boards: [
      row({ verified: "match" }),
      row({ nodeId: "1:2", verified: "drift-fixed" }),
      row({ nodeId: "1:3", status: "out-of-scope" }),
      row({ nodeId: "1:4", authority: "blocked:owner" }),
    ] });
    expect(r.status).toBe(0);
  });

  it('treats authority "undecided" and "open:*" as not done', () => {
    expect(isDone(row({ authority: "undecided" }))).toBe(false);
    expect(isDone(row({ authority: "open:pill-count" }))).toBe(false);
  });

  it("needs a verifiedNote for rows done only through code: or founder:", () => {
    expect(isDone(row({ authority: "code:mobile-label" }))).toBe(false);
    expect(isDone(row({ authority: "code:mobile-label", verifiedNote: "Mobile wins over Phone" }))).toBe(true);
    expect(isDone(row({ authority: "founder:copy", verifiedNote: "owner 10-22" }))).toBe(true);
  });

  it("an inheriting row is done only while its archetype is done", () => {
    const arche = row({ nodeId: "a:1", verified: "match" });
    const child = row({ nodeId: "c:1", inheritsFrom: "a:1" });
    expect(census({ boards: [arche, child] }).open).toHaveLength(0);
    const r = census({ boards: [{ ...arche, verified: "drift-open" }, child] });
    expect(r.open.map((o) => o.nodeId).sort()).toEqual(["a:1", "c:1"]);
  });

  it("exits 2 on a dangling or cyclic inheritsFrom", () => {
    const dangling = run({ boards: [row({ inheritsFrom: "zz:9" })] });
    expect(dangling.status).toBe(2);
    expect(dangling.stderr).toMatch(/manifest invalid at row 0, field inheritsFrom/);
    const cyclic = run({ boards: [row({ nodeId: "a", inheritsFrom: "b" }), row({ nodeId: "b", inheritsFrom: "a" })] });
    expect(cyclic.status).toBe(2);
  });

  it("exits 2 on malformed JSON, a missing file or an unknown enum value", () => {
    expect(run("{not json").status).toBe(2);
    expect(spawnSync(process.execPath, [SCRIPT, "/nope/missing.json"], { encoding: "utf8" }).status).toBe(2);
    const bad = run({ boards: [row({ verified: "maybe" })] });
    expect(bad.status).toBe(2);
    expect(bad.stderr).toMatch(/manifest invalid at row 0, field verified/);
  });

  it("--json prints the open rows as an array and per-family counts", () => {
    const r = run({ boards: [row(), row({ nodeId: "2:2", family: "cms", verified: "match" })] }, ["--json"]);
    const out = JSON.parse(r.stdout);
    expect(out.open).toHaveLength(1);
    expect(out.families.editor).toEqual({ total: 1, done: 0 });
    expect(out.families.cms).toEqual({ total: 1, done: 1 });
  });
});
