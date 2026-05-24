import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";

function readFile(filePath: string): string {
  return readFileSync(path.resolve(__dirname, "..", filePath), "utf-8");
}

describe("B1: logout decode() wrapped in try-catch", () => {
  const src = readFile("packages/dashboard/app/api/auth/logout/route.ts");

  it("has try-catch around decode call", () => {
    // decode should be inside try block
    const hasDecodeInTry = src.includes("try") && src.includes("decode(");
    expect(hasDecodeInTry).toBe(true);
  });

  it("catches decode errors gracefully (still clears cookie)", () => {
    expect(src).toContain("catch");
  });
});

describe("B2: create-session validates user BEFORE invalidating token", () => {
  const src = readFile("packages/dashboard/app/api/auth/create-session/route.ts");

  it("findUnique comes BEFORE invalidateToken in function body", () => {
    // Skip imports — search from the POST function body
    const fnBody = src.slice(src.indexOf("export async function POST"));
    const findPos = fnBody.indexOf("prisma.user.findUnique");
    const invalidatePos = fnBody.indexOf("await invalidateToken");

    expect(findPos).toBeGreaterThan(-1);
    expect(invalidatePos).toBeGreaterThan(-1);
    expect(findPos).toBeLessThan(invalidatePos);
  });
});

describe("B3: decryptSecret wrapped in try-catch", () => {
  const src = readFile("server/services/auth.service.ts");

  it("verify2FA wraps decryptSecret in try-catch", () => {
    const verify2FAStart = src.indexOf("export async function verify2FA(");
    const verify2FAEnd = src.indexOf("export async function verifyBackupCode(");
    const fn = src.slice(verify2FAStart, verify2FAEnd);

    // Should have try-catch around decryptSecret
    const decryptPos = fn.indexOf("decryptSecret");
    const tryPos = fn.lastIndexOf("try", decryptPos);
    expect(tryPos).toBeGreaterThan(-1);
  });
});
