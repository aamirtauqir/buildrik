import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";
import { randomUUID } from "crypto";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function generateToken(
  type: "email_verify" | "password_reset" | "magic_link" | "invite" | "2fa_temp" | "session_grant" | "email_change" | "link_token",
  identifier: string,
  expiryMinutes: number
) {
  const token = randomUUID();
  const hashedToken = hashToken(token);
  const expires = new Date(Date.now() + expiryMinutes * 60 * 1000);

  await prisma.verificationToken.create({
    data: { identifier, token: hashedToken, type, expires },
  });

  return token; // Return raw token to user, store hash in DB
}

export async function validateToken(token: string, type: string) {
  const hashedToken = hashToken(token);
  const record = await prisma.verificationToken.findFirst({
    where: { token: hashedToken, type, used: false },
  });

  if (!record) return null;
  if (record.expires < new Date()) return null;

  return record.identifier;
}

export async function invalidateToken(token: string) {
  const hashedToken = hashToken(token);
  await prisma.verificationToken.updateMany({
    where: { token: hashedToken },
    data: { used: true },
  });
}
