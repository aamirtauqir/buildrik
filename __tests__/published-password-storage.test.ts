import { describe, it, expect, beforeAll } from "vitest";
import bcrypt from "bcryptjs";
import {
  hashPublishedPassword,
  verifyPublishedPassword,
  decryptPublishedPassword,
} from "@/server/services/site-settings.service";

// lib/encryption needs a 32-byte hex key.
beforeAll(() => {
  if (!process.env.ENCRYPTION_KEY) {
    process.env.ENCRYPTION_KEY = "a".repeat(64);
  }
});

describe("published password storage (reversible for Vercel protection)", () => {
  it("stores AES-encrypted, not bcrypt", async () => {
    const stored = await hashPublishedPassword("hunter2");
    expect(stored).toMatch(/^v1:/); // AES ciphertext, not $2 bcrypt
    expect(stored).not.toContain("hunter2");
  });

  it("round-trips: decrypt returns the original plaintext for Vercel", async () => {
    const stored = await hashPublishedPassword("s3cret!");
    expect(decryptPublishedPassword(stored)).toBe("s3cret!");
  });

  it("verify accepts the right password and rejects the wrong one", async () => {
    const stored = await hashPublishedPassword("letmein");
    expect(await verifyPublishedPassword("letmein", stored)).toBe(true);
    expect(await verifyPublishedPassword("nope", stored)).toBe(false);
  });

  it("null/empty clears the gate (no password)", async () => {
    expect(await hashPublishedPassword(null)).toBeNull();
    expect(await hashPublishedPassword("")).toBeNull();
    expect(await verifyPublishedPassword("anything", null)).toBe(true);
  });

  it("re-saving an already-stored value keeps it (no double-encrypt)", async () => {
    const stored = await hashPublishedPassword("keepme");
    expect(await hashPublishedPassword(stored)).toBe(stored);
  });

  it("legacy bcrypt rows still verify but are not decryptable", async () => {
    const legacy = await bcrypt.hash("oldpw", 10);
    expect(await verifyPublishedPassword("oldpw", legacy)).toBe(true);
    expect(await verifyPublishedPassword("wrong", legacy)).toBe(false);
    // Irreversible — can't be pushed to Vercel until re-set.
    expect(decryptPublishedPassword(legacy)).toBeNull();
  });
});
