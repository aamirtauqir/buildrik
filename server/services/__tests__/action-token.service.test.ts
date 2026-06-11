/**
 * Confirmation-token security. The token must bind actor+site+action+argsHash+
 * expiry and be unforgeable without NEXTAUTH_SECRET.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { createHmac } from "crypto";
import {
  signActionToken,
  verifyActionToken,
  argsMatch,
} from "@server/services/action-token.service";

const SECRET = "test-secret-action-token";
beforeAll(() => {
  process.env.NEXTAUTH_SECRET = SECRET;
});

const base = { actorId: "u1", siteId: "s1", actionId: "site.publish", args: {} };

describe("action confirmation token", () => {
  it("signs + verifies a roundtrip and returns the signed claims", () => {
    const v = verifyActionToken(signActionToken(base), "u1");
    expect(v.ok).toBe(true);
    if (v.ok) {
      expect(v.claims.siteId).toBe("s1");
      expect(v.claims.actionId).toBe("site.publish");
    }
  });

  it("rejects a DIFFERENT actor — token is bound to the proposer", () => {
    const v = verifyActionToken(signActionToken(base), "attacker");
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.reason).toBe("actor-mismatch");
  });

  it("rejects a tampered signature", () => {
    const t = signActionToken(base);
    const forged = t.slice(0, -3) + (t.endsWith("xyz") ? "abc" : "xyz");
    expect(verifyActionToken(forged, "u1").ok).toBe(false);
  });

  it("rejects a tampered payload (changing siteId breaks the signature)", () => {
    const sig = signActionToken(base).split(".")[1];
    const evil = Buffer.from(
      JSON.stringify({ actorId: "u1", siteId: "EVIL", actionId: "site.publish", argsHash: "x", exp: Date.now() + 9999 }),
    ).toString("base64url");
    expect(verifyActionToken(`${evil}.${sig}`, "u1").ok).toBe(false);
  });

  it("rejects an expired token even with a valid signature", () => {
    const payload = Buffer.from(
      JSON.stringify({ actorId: "u1", siteId: "s1", actionId: "site.publish", argsHash: "x", exp: Date.now() - 1000 }),
    ).toString("base64url");
    const sig = createHmac("sha256", SECRET).update(payload).digest("base64url");
    const v = verifyActionToken(`${payload}.${sig}`, "u1");
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.reason).toBe("expired");
  });

  it("rejects malformed tokens", () => {
    expect(verifyActionToken("no-dot-here", "u1").ok).toBe(false);
    expect(verifyActionToken("", "u1").ok).toBe(false);
  });

  it("argsMatch detects execute-time arg tampering vs the proposed args", () => {
    const v = verifyActionToken(signActionToken({ ...base, args: { from: "/a", to: "/b" } }), "u1");
    expect(v.ok).toBe(true);
    if (v.ok) {
      expect(argsMatch(v.claims, { from: "/a", to: "/b" })).toBe(true);
      expect(argsMatch(v.claims, { from: "/a", to: "/EVIL" })).toBe(false);
    }
  });
});
