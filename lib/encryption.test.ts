import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { encrypt, decrypt } from "./encryption";

const VALID_KEY = "0".repeat(64); // 32 bytes hex
const ORIGINAL_KEY = process.env.ENCRYPTION_KEY;

describe("encryption (AES-256-GCM)", () => {
  beforeEach(() => {
    process.env.ENCRYPTION_KEY = VALID_KEY;
  });

  afterEach(() => {
    process.env.ENCRYPTION_KEY = ORIGINAL_KEY;
  });

  it("encrypt → decrypt roundtrips back to original plaintext", () => {
    const plain = "vercel_token_abc123_test";
    const cipher = encrypt(plain);
    expect(cipher).not.toBe(plain);
    expect(cipher.startsWith("v1:")).toBe(true);
    expect(decrypt(cipher)).toBe(plain);
  });

  it("encrypt of same plaintext gives different ciphertexts (IV randomness)", () => {
    const plain = "same-token";
    const a = encrypt(plain);
    const b = encrypt(plain);
    expect(a).not.toBe(b);
  });

  it("decrypt with wrong key throws", () => {
    const cipher = encrypt("secret");
    process.env.ENCRYPTION_KEY = "1".repeat(64); // different key, valid length
    expect(() => decrypt(cipher)).toThrow();
  });

  it("decrypt of tampered ciphertext throws (authTag check)", () => {
    const cipher = encrypt("secret");
    // flip a byte in the ciphertext segment
    const parts = cipher.split(":");
    parts[3] = parts[3].slice(0, -2) + (parts[3].slice(-2) === "00" ? "ff" : "00");
    expect(() => decrypt(parts.join(":"))).toThrow();
  });

  it("encrypt throws if ENCRYPTION_KEY missing", () => {
    delete process.env.ENCRYPTION_KEY;
    expect(() => encrypt("x")).toThrow(/ENCRYPTION_KEY/);
  });

  it("encrypt throws if ENCRYPTION_KEY wrong length", () => {
    process.env.ENCRYPTION_KEY = "tooshort";
    expect(() => encrypt("x")).toThrow(/ENCRYPTION_KEY/);
  });
});
