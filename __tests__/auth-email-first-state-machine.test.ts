/**
 * Structural tests for the Phase 3 email-first auth state machine (app/auth/page.tsx)
 *
 * These tests verify the invariants that matter most:
 * 1. All 5 states are defined
 * 2. Dispatch table is complete (all checkEmail outcomes handled)
 * 3. rememberMe lives at email_entry (not login_password)
 * 4. rememberMe threads into OAuth via sessionStorage try/catch
 * 5. rememberMe threads into 2FA via sessionStorage write before redirect
 * 6. Signup redirects to verify-email (not to dashboard)
 * 7. "Change email" escape hatch exists on all non-entry states
 * 8. Rate limit error surfaces correct message
 * 9. Ghost account handled as oauth_only (no password field)
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";

const source = readFileSync(
  path.resolve(__dirname, "../app/auth/page.tsx"),
  "utf-8"
);

describe("State machine — type definitions", () => {
  it("defines all 5 required states", () => {
    expect(source).toContain('type: "email_entry"');
    expect(source).toContain('type: "checking"');
    expect(source).toContain('type: "login_password"');
    expect(source).toContain('type: "oauth_only"');
    expect(source).toContain('type: "signup_new"');
  });

  it("login_password and oauth_only states carry email and providers fields", () => {
    // The AuthStep union must include email and providers on these states
    const typeDef = source.slice(source.indexOf("type AuthStep"), source.indexOf("export default"));
    expect(typeDef).toContain("login_password");
    expect(typeDef).toContain("email: string");
    expect(typeDef).toContain('providers: ("google" | "github")[]');
  });
});

describe("Dispatch table — checkEmail → state transitions", () => {
  it("routes exists=false to signup_new", () => {
    // onSuccess handler must check !data.exists
    expect(source).toContain("signup_new");
    expect(source).toContain("!data.exists");
  });

  it("routes exists=true + hasPassword to login_password", () => {
    expect(source).toContain("login_password");
    expect(source).toContain("data.hasPassword");
  });

  it("routes exists=true + no password to oauth_only (covers ghost accounts)", () => {
    // Both OAuth-only and ghost accounts route to oauth_only
    expect(source).toContain("oauth_only");
    // Ghost (providers=[]) is handled by the oauth_only branch showing magic link only
    // Verify the component distinguishes providers.length > 0
    expect(source).toContain("step.providers.length > 0");
  });

  it("TOO_MANY_REQUESTS error shows 15-minute retry message", () => {
    expect(source).toContain("TOO_MANY_REQUESTS");
    expect(source).toContain("15 minutes");
  });
});

describe("rememberMe threading", () => {
  it("rememberMe checkbox is in email_entry state (not login_password)", () => {
    // The rememberMe checkbox must appear inside the email_entry branch
    const emailEntryBlock = source.slice(
      source.indexOf('"email_entry" || step.type === "checking"'),
      source.indexOf('step.type === "login_password"')
    );
    expect(emailEntryBlock).toContain("rememberMe");
    expect(emailEntryBlock).toContain('type="checkbox"');
  });

  it("login_password does NOT re-show rememberMe checkbox", () => {
    const loginPasswordBlock = source.slice(
      source.indexOf('step.type === "login_password"'),
      source.indexOf('step.type === "oauth_only"')
    );
    // No checkbox in the login_password render block
    expect(loginPasswordBlock).not.toContain('type="checkbox"');
  });

  it("login_password passes rememberMe directly to login mutation", () => {
    expect(source).toContain("loginMutation.mutate({ email: step.email, password, rememberMe })");
  });

  it("oauth_only writes rememberMe to sessionStorage with try/catch", () => {
    // Must be wrapped in try/catch to handle iOS Safari private mode
    expect(source).toContain('sessionStorage.setItem("buildrik_rememberMe", "true")');
    // The try/catch pattern must exist in the OAuth path
    const oauthSignInFn = source.slice(
      source.indexOf("function handleOAuthSignIn"),
      source.indexOf("function resetToEmail")
    );
    expect(oauthSignInFn).toContain("try {");
    expect(oauthSignInFn).toContain("} catch {}");
  });

  it("2FA path writes rememberMe to sessionStorage before redirect", () => {
    // On requiresTwoFactor: true, must write sessionStorage before router.push
    const twoFABlock = source.slice(
      source.indexOf("requiresTwoFactor"),
      source.indexOf("/auth/2fa")
    );
    expect(twoFABlock).toContain('sessionStorage.setItem("buildrik_rememberMe"');
  });
});

describe("Post-action redirects", () => {
  it("successful signup redirects to verify-email (not dashboard)", () => {
    expect(source).toContain("/auth/verify-email?email=");
    // Must NOT redirect to /dashboard directly from signup
    const signupSuccess = source.slice(
      source.indexOf("signupMutation"),
      source.indexOf("trpc.auth.login")
    );
    expect(signupSuccess).not.toContain("/dashboard");
  });

  it("magic link success redirects to check-inbox", () => {
    expect(source).toContain("/auth/check-inbox?email=");
  });

  it("successful login creates session then redirects to /auth/redirect", () => {
    expect(source).toContain("/api/auth/create-session");
    expect(source).toContain("/auth/redirect");
  });

  it("account locked redirects to locked error page", () => {
    expect(source).toContain("/auth/error/locked");
    expect(source).toContain("lockedUntil");
  });
});

describe("UX invariants", () => {
  it("Change email button appears on non-entry states", () => {
    expect(source).toContain("Change email");
    expect(source).toContain("resetToEmail");
  });

  it("resetToEmail preserves previously entered email", () => {
    // resetToEmail should set email to the previous step's email, not empty string
    const resetFn = source.slice(
      source.indexOf("function resetToEmail"),
      source.indexOf("function resetToEmail") + 300
    );
    expect(resetFn).toContain("step.email");
  });

  it("signup_new email field is readonly (pre-filled from checkEmail)", () => {
    const signupBlock = source.slice(
      source.indexOf("Create your account"),
      source.indexOf("Create Account")
    );
    expect(signupBlock).toContain("readOnly");
    expect(signupBlock).toContain("step.email");
  });

  it("Create Account button is disabled until termsAccepted", () => {
    const signupBlock = source.slice(
      source.indexOf("Create your account"),
      source.indexOf("Create Account") + 200
    );
    expect(signupBlock).toContain("!termsAccepted");
  });

  it("login button shows loading state during mutation", () => {
    expect(source).toContain("loginMutation.isPending");
  });

  it("signup button shows loading state during mutation", () => {
    expect(source).toContain("signupMutation.isPending");
  });
});

describe("OAuth shortcut at email_entry", () => {
  it("OAuth buttons are present at email_entry step", () => {
    const emailEntryBlock = source.slice(
      source.indexOf('"email_entry" || step.type === "checking"'),
      source.indexOf('step.type === "login_password"')
    );
    expect(emailEntryBlock).toContain("SocialButton");
    expect(emailEntryBlock).toContain("google");
    expect(emailEntryBlock).toContain("github");
  });

  it("OAuth shortcut uses callbackUrl /auth/redirect", () => {
    expect(source).toContain('callbackUrl: "/auth/redirect"');
  });
});
