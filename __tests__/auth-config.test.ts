import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Transaction-client mock (used inside $transaction callback)
const txUserCreate = vi.fn();
const txClient = {
  user: { create: txUserCreate },
  workspace: { create: vi.fn() },
  workspaceMember: { create: vi.fn() },
};

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    account: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    $transaction: vi.fn(async (cb: (tx: typeof txClient) => Promise<unknown>) => cb(txClient)),
  },
}));

// Mock bcryptjs (needed by auth.config.ts credentials provider)
vi.mock("bcryptjs", () => ({
  default: { compare: vi.fn() },
}));

// Mock audit service
vi.mock("@/server/services/audit.service", () => ({
  logAuditEvent: vi.fn(),
}));

// Mock createWorkspaceForUser (called inside transaction in signIn callback)
vi.mock("@/server/services/auth.service", () => ({
  createWorkspaceForUser: vi.fn().mockResolvedValue({ workspaceId: "ws-123" }),
}));

// currentSessionUserId() reads the session cookie via next/headers + next-auth/jwt
// decode. Mocked so tests can simulate an "already signed in" Connect-provider
// flow vs. a public login (no session cookie → decode never reached).
const mockCookieGet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ get: mockCookieGet })),
}));
const mockDecode = vi.fn();
vi.mock("next-auth/jwt", () => ({
  decode: (...args: unknown[]) => mockDecode(...args),
}));

import { authConfig } from "@/server/auth.config";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/server/services/audit.service";

const mockPrisma = vi.mocked(prisma);
const mockLogAuditEvent = vi.mocked(logAuditEvent);

describe("OAuth signIn callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should have a signIn callback defined", () => {
    expect(authConfig.callbacks?.signIn).toBeDefined();
  });

  // The guard that made this file red: signIn refuses any provider email the
  // provider has not verified. Without it, an attacker adds the victim's address
  // as an UNVERIFIED email on their own Google account and signs into the
  // victim's Buildrick account. The fix shipped in 1c8fae40; this is its test.
  it("refuses an unverified Google email instead of linking the account", async () => {
    const signInCallback = authConfig.callbacks!.signIn!;
    const userObj = { id: "temp", email: "victim@example.com", name: "Attacker" } as any;
    const result = await signInCallback({
      user: userObj,
      account: { provider: "google", type: "oauth", providerAccountId: "g-1" } as any,
      profile: { email: "victim@example.com", email_verified: false } as any,
      credentials: undefined as any,
    } as any);

    expect(result).toBe("/auth/error/social-error?reason=unverified-email");
    expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
  });

  // Second untested guard on this path: a public OAuth login into an existing
  // PASSWORD account whose provider isn't linked yet must NOT silently link.
  // Otherwise anyone who controls a Google account with that address absorbs the
  // password account. They get sent to use their password instead.
  it("refuses to absorb a password account via an unlinked provider", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "victim-id",
      email: "victim@example.com",
      passwordHash: "$2b$10$hash",
      emailVerified: new Date("2026-01-01"), // already-verified row — the conflict guard only applies here
      accounts: [], // Google was never linked to this account
    } as any);

    const signInCallback = authConfig.callbacks!.signIn!;
    const result = await signInCallback({
      user: { id: "temp", email: "victim@example.com" } as any,
      account: { provider: "google", type: "oauth", providerAccountId: "g-3" } as any,
      profile: { email: "victim@example.com", email_verified: true } as any,
      credentials: undefined as any,
    } as any);

    expect(result).toBe("/auth/oauth-conflict?email=victim%40example.com");
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  it("refuses when Google omits email_verified entirely", async () => {
    const signInCallback = authConfig.callbacks!.signIn!;
    const result = await signInCallback({
      user: { id: "temp", email: "victim@example.com" } as any,
      account: { provider: "google", type: "oauth", providerAccountId: "g-2" } as any,
      profile: { email: "victim@example.com" } as any, // no email_verified
      credentials: undefined as any,
    } as any);

    expect(result).toBe("/auth/error/social-error?reason=unverified-email");
  });

  it("creates a new user when OAuth user does not exist in DB and sets user.id to DB id", async () => {
    // User not found in DB
    mockPrisma.user.findUnique.mockResolvedValue(null);
    txUserCreate.mockResolvedValue({
      id: "new-db-user-id",
      email: "oauth@example.com",
      fullName: "OAuth User",
    });

    const signInCallback = authConfig.callbacks!.signIn!;
    const userObj = { id: "temp-provider-id", email: "oauth@example.com", name: "OAuth User" } as any;
    const result = await signInCallback({
      user: userObj,
      account: { provider: "google", type: "oauth", providerAccountId: "google-123" } as any,
      // Google asserts email_verified. Without it the signIn callback now
      // refuses the login — see the unverified-email test below.
      profile: { email: "oauth@example.com", name: "OAuth User", email_verified: true } as any,
      credentials: undefined as any,
    } as any);

    expect(result).toBe(true);
    expect(txUserCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: "oauth@example.com",
          fullName: "OAuth User",
          provider: "google",
          emailVerified: expect.any(Date),
        }),
      })
    );
    // Critical: user.id must be set to our DB id for jwt callback
    expect(userObj.id).toBe("new-db-user-id");
  });

  // The signIn callback reads `existing.accounts` (include: { accounts: … }) to
  // decide whether this provider is already linked. The mock returned a user
  // without it, so this test died on "Cannot read properties of undefined".
  it("sets user.id to DB id when OAuth user already exists and is verified", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "existing-db-id",
      email: "oauth@example.com",
      passwordHash: null,
      emailVerified: new Date("2026-01-01"),
      accounts: [{ provider: "google" }],
    } as any);

    const signInCallback = authConfig.callbacks!.signIn!;
    const userObj = { id: "provider-id", email: "oauth@example.com", name: "OAuth User" } as any;
    const result = await signInCallback({
      user: userObj,
      account: { provider: "google", type: "oauth", providerAccountId: "google-123" } as any,
      // Google asserts email_verified. Without it the signIn callback now
      // refuses the login — see the unverified-email test below.
      profile: { email: "oauth@example.com", name: "OAuth User", email_verified: true } as any,
      credentials: undefined as any,
    } as any);

    expect(result).toBe(true);
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
    // Critical: user.id must be set to our DB id for jwt callback
    expect(userObj.id).toBe("existing-db-id");
    // Already-verified row: only lastLoginAt bumps, no credential clearing.
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: "existing-db-id" },
      data: { lastLoginAt: expect.any(Date) },
    });
  });

  // OAuth already proves control
  // of the email (email_verified asserted above), so a never-verified row is
  // the real owner's first verification — same anti-pre-account-hijack
  // clearing as verifyMagicLink, and no oauth-conflict redirect (an
  // unverified row was never provably the password-setter's).
  it("clears passwordHash/2FA and bumps sessionVersion on first OAuth login into a never-verified row", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "hijacked-id",
      email: "victim2@example.com",
      passwordHash: "$2b$10$attacker-set-hash",
      emailVerified: null,
      accounts: [], // Google was never linked to this account
    } as any);

    const signInCallback = authConfig.callbacks!.signIn!;
    const userObj = { id: "provider-id", email: "victim2@example.com", name: "Victim" } as any;
    const result = await signInCallback({
      user: userObj,
      account: { provider: "google", type: "oauth", providerAccountId: "g-9" } as any,
      profile: { email: "victim2@example.com", email_verified: true } as any,
      credentials: undefined as any,
    } as any);

    expect(result).toBe(true);
    expect(userObj.id).toBe("hijacked-id");
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: "hijacked-id" },
      data: {
        emailVerified: expect.any(Date),
        passwordHash: null,
        twoFactorEnabled: false,
        twoFactorSecret: null,
        backupCodes: [],
        sessionVersion: { increment: 1 },
        lastLoginAt: expect.any(Date),
      },
    });
  });

  // This asserted that a "credentials" account returns true. It cannot: there is
  // no Credentials provider (providers: [Google, GitHub]) — password login goes
  // through trpc.auth.login → /api/auth/create-session and never reaches this
  // callback. What the code actually guarantees is more useful, and is what the
  // email_verified branch falls through to: any provider we have not explicitly
  // decided to trust is refused. Fail closed.
  it("refuses a provider it has no verification rule for", async () => {
    const signInCallback = authConfig.callbacks!.signIn!;
    const result = await signInCallback({
      user: { id: "user-id", email: "test@example.com" },
      account: { provider: "some-new-provider", type: "oauth" } as any,
      profile: { email: "test@example.com", email_verified: true } as any,
      credentials: undefined as any,
    } as any);

    expect(result).toBe("/auth/error/social-error?reason=unverified-email");
    expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
  });
});

// GitHub's own `userinfo` override must resolve email from
// `/user/emails`'s `verified: true` flag, never from `/user`'s free-text
// "public email" field or an unverified-but-primary fallback.
describe("GitHub provider userinfo() — real profile/userinfo function", () => {
  // NextAuth's `GitHub(config)` factory stores whatever config we pass under
  // `.options` on the returned provider object — the DEFAULT `.userinfo` on
  // that object is untouched; Auth.js only deep-merges `.options` onto the
  // defaults inside its own internal `parseProviders()` at real request
  // time (node_modules/@auth/core/lib/utils/providers.js — not part of the
  // package's public exports, so not worth importing here). Reading
  // `.options.userinfo.request` grabs exactly the function this repo wrote
  // in server/auth.config.ts, which is what these tests need to verify.
  function githubUserinfoRequest() {
    const provider = authConfig.providers.find(
      (p) => (typeof p === "function" ? p({}) : p).id === "github",
    );
    const resolved = (typeof provider === "function" ? provider({}) : provider) as {
      options: { userinfo: { request: (args: { tokens: { access_token: string } }) => Promise<{ email: string | null }> } };
    };
    return resolved.options.userinfo.request;
  }

  const fetchMock = vi.fn();
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("an unverified primary email → no email returned (never trusted)", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url === "https://api.github.com/user") {
        return Promise.resolve({ json: () => Promise.resolve({ id: 1, login: "attacker", email: null }) });
      }
      if (url === "https://api.github.com/user/emails") {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              { email: "victim@example.com", primary: true, verified: false },
              { email: "attacker-real@example.com", primary: false, verified: true },
            ]),
        });
      }
      throw new Error(`unexpected fetch ${url}`);
    });

    const profile = await githubUserinfoRequest()({ tokens: { access_token: "tok" } });
    // The unverified PRIMARY is never used — falls back to the verified
    // secondary instead of the attacker's chosen unverified address.
    expect(profile.email).toBe("attacker-real@example.com");
  });

  it("no verified email at all → email is null (signIn refuses)", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url === "https://api.github.com/user") {
        return Promise.resolve({ json: () => Promise.resolve({ id: 1, login: "attacker", email: null }) });
      }
      if (url === "https://api.github.com/user/emails") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{ email: "victim@example.com", primary: true, verified: false }]),
        });
      }
      throw new Error(`unexpected fetch ${url}`);
    });

    const profile = await githubUserinfoRequest()({ tokens: { access_token: "tok" } });
    expect(profile.email).toBeNull();
  });

  it("a verified secondary email is used when primary is unverified and no other verified email exists", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url === "https://api.github.com/user") {
        return Promise.resolve({ json: () => Promise.resolve({ id: 2, login: "real-user", email: null }) });
      }
      if (url === "https://api.github.com/user/emails") {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              { email: "unverified@example.com", primary: true, verified: false },
              { email: "verified-secondary@example.com", primary: false, verified: true },
            ]),
        });
      }
      throw new Error(`unexpected fetch ${url}`);
    });

    const profile = await githubUserinfoRequest()({ tokens: { access_token: "tok" } });
    expect(profile.email).toBe("verified-secondary@example.com");
  });

  it("ignores /user's own `email` field entirely — only /user/emails' verified flag counts", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url === "https://api.github.com/user") {
        // /user's own email field claims an address — must be ignored.
        return Promise.resolve({
          json: () => Promise.resolve({ id: 3, login: "someone", email: "claimed@example.com" }),
        });
      }
      if (url === "https://api.github.com/user/emails") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{ email: "actually-verified@example.com", primary: true, verified: true }]),
        });
      }
      throw new Error(`unexpected fetch ${url}`);
    });

    const profile = await githubUserinfoRequest()({ tokens: { access_token: "tok" } });
    expect(profile.email).toBe("actually-verified@example.com");
  });
});

describe("signIn callback — GitHub unverified email refused on both paths", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("first-verification path: refuses when GitHub's userinfo resolved no verified email", async () => {
    const signInCallback = authConfig.callbacks!.signIn!;
    const result = await signInCallback({
      user: { id: "temp", email: undefined } as any,
      account: { provider: "github", type: "oauth", providerAccountId: "gh-1" } as any,
      // The userinfo override returns `email: null` for an unverified-only
      // account — NextAuth's profile() mapping carries that straight to
      // `user.email`.
      profile: { email: null } as any,
      credentials: undefined as any,
    } as any);

    expect(result).toBe("/auth/error/social-error?reason=unverified-email");
    expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("link path: refuses linking into an existing row when GitHub gave no verified email", async () => {
    // Mock an actual existing VERIFIED row
    // that a real DB lookup-by-email would find — proving the refusal
    // happens before the existing-row lookup even runs, not merely because
    // the mock happened to be unset. If this branch were ever reached
    // despite the unverified email, `user.findUnique` would return this row
    // and the code could silently link into it.
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "existing-verified-id",
      email: "b@x.example.com",
      passwordHash: null,
      emailVerified: new Date("2026-01-01"),
      accounts: [],
    } as any);

    const signInCallback = authConfig.callbacks!.signIn!;
    const result = await signInCallback({
      user: { id: "temp", email: undefined } as any,
      account: { provider: "github", type: "oauth", providerAccountId: "gh-2" } as any,
      profile: { email: null } as any,
      credentials: undefined as any,
    } as any);

    expect(result).toBe("/auth/error/social-error?reason=unverified-email");
    // Never reached the existing-row lookup at all, let alone linked into it
    // — despite the mock being ready to return a match.
    expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  it("a GitHub-verified email DOES proceed (positive control)", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    txUserCreate.mockResolvedValue({ id: "new-gh-user", email: "real@example.com", fullName: "Real User" });

    const signInCallback = authConfig.callbacks!.signIn!;
    const userObj = { id: "temp", email: "real@example.com", name: "Real User" } as any;
    const result = await signInCallback({
      user: userObj,
      account: { provider: "github", type: "oauth", providerAccountId: "gh-3" } as any,
      profile: { email: "real@example.com" } as any,
      credentials: undefined as any,
    } as any);

    expect(result).toBe(true);
    expect(userObj.id).toBe("new-gh-user");
  });
});

describe("signIn callback — account-first identity resolution", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // The scenario that motivated this ruling: user A linked GitHub with
  // verified a@x, then changed their GitHub account's verified email to
  // b@x. The OLD ordering (email-first) would look up `b@x`, find no row,
  // and create a second "verified" user + workspace before ever checking
  // the provider link — orphaning A's real account. Account-first settles
  // identity from the physical provider link BEFORE any email lookup, so
  // this can no longer happen.
  it("an existing provider link signs in as the LINKED user — no email lookup, no user/workspace writes, even when the provider's email changed", async () => {
    mockPrisma.account.findUnique.mockResolvedValue({ userId: "user-a" } as any);

    const signInCallback = authConfig.callbacks!.signIn!;
    const userObj = { id: "temp", email: "b@x.example.com" } as any; // the NEW email the provider now reports
    const result = await signInCallback({
      user: userObj,
      account: { provider: "github", type: "oauth", providerAccountId: "gh-a" } as any,
      profile: { email: "b@x.example.com" } as any, // GitHub's own userinfo override already resolved this as verified
      credentials: undefined as any,
    } as any);

    expect(result).toBe(true);
    expect(userObj.id).toBe("user-a"); // linked user, NOT an email-matched lookup
    expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
    expect(txUserCreate).not.toHaveBeenCalled();
    expect(mockPrisma.account.upsert).not.toHaveBeenCalled(); // "bump nothing else"
    expect(mockLogAuditEvent).not.toHaveBeenCalled();
  });

  it("no existing provider link → proceeds through the normal verified-email create/link flow (unchanged)", async () => {
    mockPrisma.account.findUnique.mockResolvedValue(null); // no link yet
    mockPrisma.user.findUnique.mockResolvedValue(null); // no existing row for this email either
    txUserCreate.mockResolvedValue({ id: "new-user", email: "fresh@example.com", fullName: "Fresh User" });

    const signInCallback = authConfig.callbacks!.signIn!;
    const userObj = { id: "temp", email: "fresh@example.com", name: "Fresh User" } as any;
    const result = await signInCallback({
      user: userObj,
      account: { provider: "google", type: "oauth", providerAccountId: "g-new" } as any,
      profile: { email: "fresh@example.com", email_verified: true } as any,
      credentials: undefined as any,
    } as any);

    expect(result).toBe(true);
    expect(userObj.id).toBe("new-user");
    expect(txUserCreate).toHaveBeenCalled();
    expect(mockPrisma.account.upsert).toHaveBeenCalled();
  });

  // Defense in depth: the ownership guard near the bottom of the callback is
  // unreachable by construction in the normal case (the account-first check
  // above already proved no link exists before any create/update runs) — but
  // still fires if a race lands a conflicting link between that read and the
  // final upsert.
  it("TOCTOU defense: refuses if the provider link appears (owned by someone else) between the account-first check and the upsert", async () => {
    mockPrisma.account.findUnique
      .mockResolvedValueOnce(null) // account-first check: no link yet
      .mockResolvedValueOnce({ userId: "user-a" } as any); // re-check just before upsert: now linked to someone else
    mockPrisma.user.findUnique.mockResolvedValue(null);
    txUserCreate.mockResolvedValue({ id: "user-b", email: "raced@example.com", fullName: "Raced User" });

    const signInCallback = authConfig.callbacks!.signIn!;
    const result = await signInCallback({
      user: { id: "temp", email: "raced@example.com", name: "Raced User" } as any,
      account: { provider: "google", type: "oauth", providerAccountId: "g-race" } as any,
      profile: { email: "raced@example.com", email_verified: true } as any,
      credentials: undefined as any,
    } as any);

    expect(result).toBe("/auth/error/social-error?reason=provider-linked-elsewhere");
    expect(mockPrisma.account.upsert).not.toHaveBeenCalled();
  });

  // The Connect-provider bug: a SIGNED-IN user (Settings → Connect provider)
  // authorizes a provider account that turns out to already be linked to a
  // DIFFERENT user. Account-first must not silently switch the active session
  // onto that other user — it must refuse.
  it("refuses when an already signed-in user connects a provider account linked to a DIFFERENT user", async () => {
    mockPrisma.account.findUnique.mockResolvedValue({ userId: "user-other" } as any);
    mockCookieGet.mockReturnValue({ value: "session-cookie" });
    mockDecode.mockResolvedValue({ userId: "user-self" });

    const signInCallback = authConfig.callbacks!.signIn!;
    const userObj = { id: "temp", email: "self@example.com" } as any;
    const result = await signInCallback({
      user: userObj,
      account: { provider: "github", type: "oauth", providerAccountId: "gh-other" } as any,
      profile: { email: "self@example.com" } as any,
      credentials: undefined as any,
    } as any);

    expect(result).toBe("/auth/error/social-error?reason=provider-linked-elsewhere");
    expect(mockPrisma.account.upsert).not.toHaveBeenCalled();
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  // Public logins (no active session) keep the existing account-first
  // behaviour — signing in as whichever user the provider is linked to.
  it("public login (no active session) still signs in as the linked user unchanged", async () => {
    mockPrisma.account.findUnique.mockResolvedValue({ userId: "user-a" } as any);
    mockCookieGet.mockReturnValue(undefined); // no session cookie

    const signInCallback = authConfig.callbacks!.signIn!;
    const userObj = { id: "temp", email: "b@x.example.com" } as any;
    const result = await signInCallback({
      user: userObj,
      account: { provider: "github", type: "oauth", providerAccountId: "gh-a" } as any,
      profile: { email: "b@x.example.com" } as any,
      credentials: undefined as any,
    } as any);

    expect(result).toBe(true);
    expect(userObj.id).toBe("user-a");
  });
});
