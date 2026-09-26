/**
 * S-12: `gate:baked-flags` refuses a production bundle with collab baked on —
 * the collab routes are gated on the same variable, so baking it "true" turns
 * the unvalidated-by-design op channel on for every user.
 */
import { describe, it, expect, afterAll } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const dirs: string[] = [];
afterAll(() => dirs.forEach((d) => rmSync(d, { recursive: true, force: true })));

function runGate(bundle: string): number | null {
  const dir = mkdtempSync(path.join(tmpdir(), "baked-flags-"));
  dirs.push(dir);
  mkdirSync(path.join(dir, "static", "chunks"), { recursive: true });
  writeFileSync(path.join(dir, "static", "chunks", "a.js"), bundle);
  return spawnSync(process.execPath, ["scripts/check-baked-flags.mjs", dir], { encoding: "utf8" }).status;
}

describe("check-baked-flags", () => {
  it("passes with Publish on and Collab unset", () => {
    expect(runGate('var e={NEXT_PUBLIC_FEATURE_PUBLISH:"true",NEXT_PUBLIC_FEATURE_COLLAB:void 0};')).toBe(0);
  });

  it("fails when Collab is baked true", () => {
    expect(runGate('var e={NEXT_PUBLIC_FEATURE_PUBLISH:"true",NEXT_PUBLIC_FEATURE_COLLAB:"true"};')).toBe(1);
  });

  it("still fails when Publish is not baked", () => {
    expect(runGate("var e={NEXT_PUBLIC_FEATURE_PUBLISH:void 0};")).toBe(1);
  });
});
