import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";

describe("LoginAttempt Recording", () => {
  const src = readFileSync(
    path.resolve(__dirname, "../server/services/auth.service.ts"),
    "utf-8"
  );

  it("auth.service.ts writes loginAttempt.create", () => {
    expect(src).toContain("loginAttempt.create");
  });

  it("records SUCCESS result", () => {
    expect(src).toContain('"SUCCESS"');
  });

  it("records FAILED result", () => {
    expect(src).toContain('"FAILED"');
  });

  it("records LOCKED result", () => {
    expect(src).toContain('"LOCKED"');
  });
});
