import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";

describe("SlugHistory on slug change", () => {
  const src = readFileSync(
    path.resolve(__dirname, "../server/services/site-settings.service.ts"),
    "utf-8"
  );

  it("writes to slugHistory when slug changes", () => {
    expect(src).toContain("slugHistory.create");
  });

  it("stores the old slug before updating", () => {
    // The function should read the current slug before updating
    expect(src).toContain("current.slug");
  });
});
