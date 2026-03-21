import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

export async function generateToken(
  type: "email_verify" | "password_reset" | "magic_link" | "invite" | "2fa_temp",
  identifier: string,
  expiryMinutes: number
) {
  const token = randomUUID();
  const expires = new Date(Date.now() + expiryMinutes * 60 * 1000);

  await prisma.verificationToken.create({
    data: { identifier, token, type, expires },
  });

  return token;
}

export async function validateToken(token: string, type: string) {
  const record = await prisma.verificationToken.findFirst({
    where: { token, type, used: false },
  });

  if (!record) return null;
  if (record.expires < new Date()) return null;

  return record.identifier;
}

export async function invalidateToken(token: string) {
  await prisma.verificationToken.updateMany({
    where: { token },
    data: { used: true },
  });
}
