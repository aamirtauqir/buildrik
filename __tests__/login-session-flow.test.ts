import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";

const loginPageSource = readFileSync(
  path.resolve(__dirname, "../app/auth/login/page.tsx"),
  "utf-8"
);

const routerSource = readFileSync(
  path.resolve(__dirname, "../server/trpc/routers/auth.ts"),
  "utf-8"
);

describe("Login non-2FA session creation", () => {
  it("login page uses create-session API instead of signIn('credentials')", () => {
    // Should NOT call signIn("credentials") for non-2FA login
    const usesSignInCredentials = /signIn\(\s*["']credentials["']/.test(loginPageSource);
    expect(usesSignInCredentials).toBe(false);
  });

  it("login page calls createClientSession for non-2FA success", () => {
    // Page uses the createClientSession helper which internally calls /api/auth/create-session
    expect(loginPageSource).toContain("createClientSession");
  });

  it("router returns sessionToken for non-2FA login", () => {
    // Find the login mutation section
    const loginSection = routerSource.slice(
      routerSource.indexOf("login: strictRateLimit"),
      routerSource.indexOf("signup: normalRateLimit")
    );
    // Non-2FA path should generate and return sessionToken
    expect(loginSection).toContain("session_grant");
    expect(loginSection).toContain("sessionToken");
  });
});
