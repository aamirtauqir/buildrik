import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";

// `app/auth/login/page.tsx` was refactored to a thin redirect stub —
// it just calls redirect("/auth?email=...") so /login URLs keep working.
// The actual login form + create-session POST + signIn() lives in
// `app/auth/page.tsx`. Read from there for these assertions.
const loginPageSource = readFileSync(
  path.resolve(__dirname, "../packages/dashboard/app/auth/page.tsx"),
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

  it("login page calls /api/auth/create-session for non-2FA success", () => {
    expect(loginPageSource).toContain("/api/auth/create-session");
  });

  it("router returns a session_grant token for non-2FA login", () => {
    // Sliced on "login: strictRateLimit" … "signup: normalRateLimit". The login
    // procedure was renamed to `login: publicProcedure`, so indexOf returned -1,
    // the slice came back empty, and this has asserted against "" ever since —
    // silently passing nothing, then failing. Anchor on what is actually there.
    const start = routerSource.indexOf("login: ");
    const end = routerSource.indexOf("signup: ");
    expect(start, "login procedure not found in the auth router").toBeGreaterThan(-1);
    expect(end, "signup procedure not found in the auth router").toBeGreaterThan(start);

    const loginSection = routerSource.slice(start, end);
    // The non-2FA path mints a short-lived session_grant token, which
    // /api/auth/create-session exchanges for the real session cookie.
    expect(loginSection).toContain('generateToken("session_grant"');
    expect(loginSection).toContain("sessionToken");
  });
});
