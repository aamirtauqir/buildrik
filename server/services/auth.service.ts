import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { authenticator } from "otplib";
import { generateToken, validateToken, invalidateToken } from "./token.service";
import { isAccountLocked, incrementFailedAttempts, resetFailedAttempts } from "./rate-limit.service";
import { sendVerificationEmail, sendPasswordResetEmail, sendMagicLinkEmail } from "./email.service";

// Dummy hash for timing-safe comparison when user not found (prevents timing-based email enumeration)
const DUMMY_HASH = "$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012";

// Safe user fields to return from service functions — NEVER include passwordHash, twoFactorSecret, backupCodes
const SAFE_USER_SELECT = {
  id: true, email: true, fullName: true, displayName: true, avatar: true,
  emailVerified: true, twoFactorEnabled: true, provider: true,
  createdAt: true, updatedAt: true,
} as const;

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });

  // Always run bcrypt to prevent timing-based email enumeration
  const hashToCompare = user?.passwordHash || DUMMY_HASH;
  const valid = await bcrypt.compare(password, hashToCompare);

  if (!user || !user.passwordHash || !valid) {
    // Only increment failed attempts if user exists
    if (user) {
      await incrementFailedAttempts(user.id);
    }
    throw new AuthError("INVALID_CREDENTIALS", "Incorrect email or password");
  }

  if (await isAccountLocked(user.id)) {
    throw new AuthError("ACCOUNT_LOCKED", "Account locked. Try again later.", 423);
  }

  await resetFailedAttempts(user.id);
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  if (user.twoFactorEnabled) {
    const tempToken = await generateToken("2fa_temp", user.id, 5);
    return { requiresTwoFactor: true, tempToken };
  }

  // Return safe fields only
  const safeUser = await prisma.user.findUnique({ where: { id: user.id }, select: SAFE_USER_SELECT });
  return { requiresTwoFactor: false, user: safeUser! };
}

export async function signup(fullName: string, email: string, password: string) {
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    throw new AuthError("EMAIL_EXISTS", "Email already registered", 409);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { fullName, email, passwordHash },
    select: SAFE_USER_SELECT,
  });

  const token = await generateToken("email_verify", user.id, 60 * 24); // 24h
  try {
    await sendVerificationEmail(email, token);
  } catch {
    // User is created but email failed (e.g., missing RESEND_API_KEY in dev).
    // Don't roll back — let them resend verification later.
  }

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
    select: SAFE_USER_SELECT,
  });

  return user;
}

export async function resendVerification(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return; // silent fail, prevent enumeration

  const token = await generateToken("email_verify", user.id, 60 * 24);
  try {
    await sendVerificationEmail(email, token);
  } catch {
    // Email failed but don't crash — user can retry
  }
}

export async function forgotPassword(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return; // always return success, prevent enumeration

  const token = await generateToken("password_reset", user.id, 30); // 30min
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
  const user = await prisma.user.findUnique({ where: { id: userId }, select: SAFE_USER_SELECT });
  return user;
}

export async function verify2FA(tempToken: string, code: string) {
  const userId = await validateToken(tempToken, "2fa_temp");
  if (!userId) {
    throw new AuthError("INVALID_2FA_CODE", "Invalid or expired token", 401);
  }

  // Need twoFactorSecret for validation — internal only
  const internal = await prisma.user.findUnique({
    where: { id: userId },
    select: { twoFactorSecret: true },
  });
  if (!internal?.twoFactorSecret) {
    throw new AuthError("INVALID_2FA_CODE", "2FA not configured", 401);
  }

  const valid = authenticator.verify({ token: code, secret: internal.twoFactorSecret });
  if (!valid) {
    throw new AuthError("INVALID_2FA_CODE", "Invalid code", 401);
  }

  await invalidateToken(tempToken);
  // Return safe fields only
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: SAFE_USER_SELECT });
  return user;
}

export async function verifyBackupCode(tempToken: string, backupCode: string) {
  const userId = await validateToken(tempToken, "2fa_temp");
  if (!userId) {
    throw new AuthError("INVALID_2FA_CODE", "Invalid or expired token", 401);
  }

  // Need backupCodes for validation — internal only
  const internal = await prisma.user.findUnique({
    where: { id: userId },
    select: { backupCodes: true },
  });
  if (!internal) {
    throw new AuthError("INVALID_2FA_CODE", "User not found", 401);
  }

  const codeIndex = internal.backupCodes.indexOf(backupCode);
  if (codeIndex === -1) {
    throw new AuthError("INVALID_2FA_CODE", "Invalid backup code", 401);
  }

  // Remove used code
  const updatedCodes = [...internal.backupCodes];
  updatedCodes.splice(codeIndex, 1);

  await prisma.user.update({
    where: { id: userId },
    data: { backupCodes: updatedCodes },
  });

  await invalidateToken(tempToken);
  // Return safe fields only
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: SAFE_USER_SELECT });
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
