import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";

describe("Site Soft-Delete Cascade", () => {
  const src = readFileSync(
    path.resolve(__dirname, "../server/services/sites.service.ts"),
    "utf-8"
  );

  it("cascades soft-delete to share links", () => {
    expect(src).toContain("shareLink.updateMany");
  });

  it("cascades soft-delete to form blocks", () => {
    expect(src).toContain("formBlock.updateMany");
  });

  it("uses $transaction for atomic cascade", () => {
    expect(src).toContain("$transaction");
  });
});
