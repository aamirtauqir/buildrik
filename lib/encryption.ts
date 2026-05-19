/**
 * AES-256-GCM helper for token-at-rest encryption.
 *
 * Cipher format: "v1:<iv-hex>:<authTag-hex>:<ciphertext-hex>"
 * The "v1" prefix lets a future key rotation differentiate old from new.
 *
 * Requires ENCRYPTION_KEY env var (32 bytes hex = 64 hex chars).
 * Generate via: openssl rand -hex 32
 */
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // GCM standard
const VERSION_PREFIX = "v1";

function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex) throw new Error("ENCRYPTION_KEY env var is not set");
  if (hex.length !== 64) {
    throw new Error(
      `ENCRYPTION_KEY must be 64 hex chars (32 bytes); got ${hex.length}. Generate via: openssl rand -hex 32`,
    );
  }
  return Buffer.from(hex, "hex");
}

export function encrypt(plain: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plain, "utf-8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [VERSION_PREFIX, iv.toString("hex"), authTag.toString("hex"), ciphertext.toString("hex")].join(":");
}

export function decrypt(cipherText: string): string {
  const key = getKey();
  const parts = cipherText.split(":");
  if (parts.length !== 4 || parts[0] !== VERSION_PREFIX) {
    throw new Error("Invalid ciphertext format");
  }
  const [, ivHex, authTagHex, dataHex] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const data = Buffer.from(dataHex, "hex");
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  const plain = Buffer.concat([decipher.update(data), decipher.final()]);
  return plain.toString("utf-8");
}
