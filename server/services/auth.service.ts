import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { authenticator } from "otplib";
import { generateToken, validateToken, invalidateToken } from "./token.service";
import { isAccountLocked, incrementFailedAttempts, resetFailedAttempts } from "./rate-limit.service";
import { sendVerificationEmail, sendPasswordResetEmail, sendMagicLinkEmail } from "./email.service";

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) {
    throw new AuthError("INVALID_CREDENTIALS", "Incorrect email or password");
  }

  if (await isAccountLocked(user.id)) {
    throw new AuthError("ACCOUNT_LOCKED", "Account locked. Try again later.", 423);
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    const remaining = await incrementFailedAttempts(user.id);
    throw new AuthError(
      "INVALID_CREDENTIALS",
      "Incorrect email or password",
      401,
      { attemptsRemaining: remaining }
    );
  }

  await resetFailedAttempts(user.id);
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  if (user.twoFactorEnabled) {
    const tempToken = await generateToken("2fa_temp", user.id, 10);
    return { requiresTwoFactor: true, tempToken };
  }

  return { requiresTwoFactor: false, user };
}

export async function signup(fullName: string, email: string, password: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AuthError("EMAIL_EXISTS", "Email already registered", 409);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { fullName, email, passwordHash },
  });

  const token = await generateToken("email_verify", user.id, 60 * 24); // 24h
  await sendVerificationEmail(email, token);

  return user;
}

export async function verifyEmail(token: string) {
  const userId = await validateToken(token, "email_verify");
  if (!userId) {
    throw new AuthError("TOKEN_EXPIRED", "Verification link expired", 410);
  }

  await invalidateToken(token);
  const user = await prisma.user.update({
    where: { id: userId },
    data: { emailVerified: new Date() },
  });

  return user;
}

export async function resendVerification(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return; // silent fail, prevent enumeration

  const token = await generateToken("email_verify", user.id, 60 * 24);
  await sendVerificationEmail(email, token);
}

export async function forgotPassword(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return; // always return success, prevent enumeration

  const token = await generateToken("password_reset", user.id, 60); // 1h
  await sendPasswordResetEmail(email, token);
}

export async function resetPassword(token: string, newPassword: string) {
  const userId = await validateToken(token, "password_reset");
  if (!userId) {
    throw new AuthError("TOKEN_EXPIRED", "Reset link expired", 410);
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await invalidateToken(token);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  // Invalidate all sessions
  await prisma.session.deleteMany({ where: { userId } });
}

export async function sendMagicLink(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return; // silent fail

  const token = await generateToken("magic_link", user.id, 15); // 15min
  await sendMagicLinkEmail(email, token);
}

export async function verifyMagicLink(token: string) {
  const userId = await validateToken(token, "magic_link");
  if (!userId) {
    throw new AuthError("TOKEN_EXPIRED", "Magic link expired", 410);
  }

  await invalidateToken(token);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  return user;
}

export async function verify2FA(tempToken: string, code: string) {
  const userId = await validateToken(tempToken, "2fa_temp");
  if (!userId) {
    throw new AuthError("INVALID_2FA_CODE", "Invalid or expired token", 401);
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.twoFactorSecret) {
    throw new AuthError("INVALID_2FA_CODE", "2FA not configured", 401);
  }

  const valid = authenticator.verify({ token: code, secret: user.twoFactorSecret });
  if (!valid) {
    throw new AuthError("INVALID_2FA_CODE", "Invalid code", 401);
  }

  await invalidateToken(tempToken);
  return user;
}

export async function verifyBackupCode(tempToken: string, backupCode: string) {
  const userId = await validateToken(tempToken, "2fa_temp");
  if (!userId) {
    throw new AuthError("INVALID_2FA_CODE", "Invalid or expired token", 401);
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AuthError("INVALID_2FA_CODE", "User not found", 401);
  }

  const codeIndex = user.backupCodes.indexOf(backupCode);
  if (codeIndex === -1) {
    throw new AuthError("INVALID_2FA_CODE", "Invalid backup code", 401);
  }

  // Remove used code
  const updatedCodes = [...user.backupCodes];
  updatedCodes.splice(codeIndex, 1);

  await prisma.user.update({
    where: { id: userId },
    data: { backupCodes: updatedCodes },
  });

  await invalidateToken(tempToken);
  return { user, backupCodesRemaining: updatedCodes.length };
}

// Custom error class
export class AuthError extends Error {
  code: string;
  statusCode: number;
  data?: Record<string, unknown>;

  constructor(code: string, message: string, statusCode = 400, data?: Record<string, unknown>) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.data = data;
  }
}
