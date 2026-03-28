import type { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { authenticator } from "otplib";
import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from "crypto";
import { generateToken, validateToken, invalidateToken } from "./token.service";
import { isAccountLocked, incrementFailedAttempts, resetFailedAttempts } from "./rate-limit.service";
import { sendVerificationEmail, sendPasswordResetEmail, sendMagicLinkEmail } from "./email.service";
import { logAuditEvent } from "./audit.service";

async function hashBackupCodes(codes: string[]): Promise<string[]> {
  return Promise.all(codes.map(code => bcrypt.hash(code, 10)));
}

async function findMatchingBackupCode(plainCode: string, hashedCodes: string[]): Promise<number> {
  for (let i = 0; i < hashedCodes.length; i++) {
    if (await bcrypt.compare(plainCode, hashedCodes[i])) return i;
  }
  return -1;
}

function encryptSecret(plaintext: string): string {
  const key = createHash('sha256').update(process.env.NEXTAUTH_SECRET!).digest();
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

function decryptSecret(ciphertext: string): string {
  const key = createHash('sha256').update(process.env.NEXTAUTH_SECRET!).digest();
  const [ivHex, tagHex, encHex] = ciphertext.split(':');
  const tag = Buffer.from(tagHex, 'hex');
  if (tag.length !== 16) {
    throw new Error('Invalid auth tag length');
  }
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(tag);
  return decipher.update(Buffer.from(encHex, 'hex')) + decipher.final('utf8');
}

// Dummy hash for timing-safe comparison when user not found (prevents timing-based email enumeration)
const DUMMY_HASH = "$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012";

// Safe user fields to return from service functions — NEVER include passwordHash, twoFactorSecret, backupCodes
const SAFE_USER_SELECT = {
  id: true, email: true, fullName: true, displayName: true, avatar: true,
  emailVerified: true, twoFactorEnabled: true, provider: true,
  createdAt: true, updatedAt: true,
} as const;

type TxClient = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0];

function generateSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 30) || "workspace";
}

async function generateUniqueSlug(tx: TxClient, name: string): Promise<string> {
  const base = generateSlug(name);
  const existing = await tx.workspace.findUnique({ where: { slug: base } });
  if (!existing) return base;

  for (let i = 0; i < 3; i++) {
    const suffix = Math.random().toString(36).slice(2, 6);
    const candidate = `${base}-${suffix}`.slice(0, 35);
    const found = await tx.workspace.findUnique({ where: { slug: candidate } });
    if (!found) return candidate;
  }
  throw new AuthError("SLUG_COLLISION", "Unable to generate workspace URL. Please try again.", 500);
}

export async function createWorkspaceForUser(
  tx: TxClient,
  userId: string,
  fullName: string,
): Promise<{ workspaceId: string }> {
  const slug = await generateUniqueSlug(tx, fullName);
  const workspace = await tx.workspace.create({
    data: { name: `${fullName}'s Workspace`, slug, ownerId: userId },
  });
  await tx.workspaceMember.create({
    data: { userId, workspaceId: workspace.id, role: "OWNER" },
  });
  await tx.onboardingState.create({ data: { userId } });
  return { workspaceId: workspace.id };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });

  // Check lockout BEFORE expensive bcrypt — fail fast for locked accounts
  if (user && await isAccountLocked(user.id)) {
    await logAuditEvent("LOGIN_LOCKED", "failure", { userId: user.id, email });
    await prisma.loginAttempt.create({
      data: { email, userId: user.id, ipAddress: "", result: "LOCKED" },
    }).catch(() => {});
    throw new AuthError("ACCOUNT_LOCKED", "Account locked. Try again later.", 423);
  }

  // Always run bcrypt to prevent timing-based email enumeration
  const hashToCompare = user?.passwordHash || DUMMY_HASH;
  const valid = await bcrypt.compare(password, hashToCompare);

  if (!user || !user.passwordHash || !valid) {
    if (user) {
      const remaining = await incrementFailedAttempts(user.id);
      await logAuditEvent("LOGIN_FAILED", "failure", { email, metadata: { attemptsRemaining: remaining } });
      await prisma.loginAttempt.create({
        data: { email, userId: user.id, ipAddress: "", result: "FAILED" },
      }).catch(() => {});
      const lockedUser = remaining <= 0
        ? await prisma.user.findUnique({ where: { id: user.id }, select: { lockedUntil: true } })
        : null;
      throw new AuthError("INVALID_CREDENTIALS", "Incorrect email or password", 401, {
        attemptsRemaining: remaining,
        locked: remaining <= 0,
        lockedUntil: lockedUser?.lockedUntil?.toISOString() ?? null,
      });
    }
    await logAuditEvent("LOGIN_FAILED", "failure", { email });
    await prisma.loginAttempt.create({
      data: { email, ipAddress: "", result: "FAILED" },
    }).catch(() => {});
    throw new AuthError("INVALID_CREDENTIALS", "Incorrect email or password");
  }

  if (!user.emailVerified) {
    await logAuditEvent("LOGIN_UNVERIFIED", "failure", { userId: user.id, email });
    throw new AuthError("EMAIL_NOT_VERIFIED", "Please verify your email before logging in.", 403);
  }

  await resetFailedAttempts(user.id);
  await logAuditEvent("LOGIN_SUCCESS", "success", { userId: user.id, email });
  await prisma.loginAttempt.create({
    data: { email, userId: user.id, ipAddress: "", result: "SUCCESS" },
  }).catch(() => {});
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

  const { user, workspaceId } = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { fullName, email, passwordHash },
      select: SAFE_USER_SELECT,
    });
    const { workspaceId } = await createWorkspaceForUser(tx, user.id, fullName);
    return { user, workspaceId };
  });

  await logAuditEvent("SIGNUP", "success", { userId: user.id, email });

  const token = await generateToken("email_verify", user.id, 60 * 24); // 24h
  try {
    await sendVerificationEmail(email, token);
  } catch {
    // User is created but email failed — let them resend verification later.
  }

  return user;
}

export async function verifyEmail(token: string) {
  const userId = await validateToken(token, "email_verify");

  if (!userId) {
    // Check if this is an email change verification
    const changeIdentifier = await validateToken(token, "email_change");
    if (changeIdentifier) {
      await invalidateToken(token);
      const colonIndex = changeIdentifier.indexOf(":");
      const uid = changeIdentifier.slice(0, colonIndex);
      const newEmail = changeIdentifier.slice(colonIndex + 1);
      await prisma.user.update({
        where: { id: uid },
        data: { email: newEmail, emailVerified: new Date() },
      });
      await logAuditEvent("EMAIL_CHANGED", "success", { userId: uid });
      const safeUser = await prisma.user.findUnique({ where: { id: uid }, select: SAFE_USER_SELECT });
      return safeUser!;
    }
    throw new AuthError("TOKEN_EXPIRED", "Verification link expired", 410);
  }

  await invalidateToken(token);
  const user = await prisma.user.update({
    where: { id: userId },
    data: { emailVerified: new Date() },
    select: SAFE_USER_SELECT,
  });

  await logAuditEvent("EMAIL_VERIFIED", "success", { userId });

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

  const token = await generateToken("password_reset", user.id, 60); // 1 hour per PRD
  await sendPasswordResetEmail(email, token);
  await logAuditEvent("PASSWORD_RESET_REQUESTED", "success", { email });
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

  await logAuditEvent("PASSWORD_RESET_COMPLETED", "success", { userId });

  // Invalidate all sessions
  await prisma.session.deleteMany({ where: { userId } });
}

export async function sendMagicLink(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return; // silent fail

  const token = await generateToken("magic_link", user.id, 15); // 15min
  await sendMagicLinkEmail(email, token);
  await logAuditEvent("MAGIC_LINK_REQUESTED", "success", { email });
}

export async function verifyMagicLink(token: string) {
  const userId = await validateToken(token, "magic_link");
  if (!userId) {
    throw new AuthError("TOKEN_EXPIRED", "Magic link expired", 410);
  }

  await invalidateToken(token);

  // Set emailVerified if not already set
  await prisma.user.updateMany({
    where: { id: userId, emailVerified: null },
    data: { emailVerified: new Date() },
  });

  // Check if 2FA is enabled
  const internal = await prisma.user.findUnique({
    where: { id: userId },
    select: { twoFactorEnabled: true },
  });

  if (internal?.twoFactorEnabled) {
    const tempToken = await generateToken("2fa_temp", userId, 5);
    return { requiresTwoFactor: true as const, tempToken, userId };
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: SAFE_USER_SELECT });
  return { requiresTwoFactor: false as const, user: user! };
}

export async function verify2FA(tempToken: string, code: string) {
  const userId = await validateToken(tempToken, "2fa_temp");
  if (!userId) {
    throw new AuthError("INVALID_2FA_CODE", "Invalid or expired token", 401);
  }

  // Check 2FA attempt count
  const hashedTemp = createHash("sha256").update(tempToken).digest("hex");
  const attemptCount = await prisma.verificationToken.count({
    where: { type: "2fa_attempt", identifier: hashedTemp, used: false, expires: { gt: new Date() } },
  });
  if (attemptCount >= 5) {
    await invalidateToken(tempToken);
    await logAuditEvent("2FA_LOCKED", "failure", { userId });
    throw new AuthError("2FA_LOCKED", "Too many failed attempts. Please log in again.", 423);
  }

  const internal = await prisma.user.findUnique({
    where: { id: userId },
    select: { twoFactorSecret: true },
  });
  if (!internal?.twoFactorSecret) {
    throw new AuthError("INVALID_2FA_CODE", "2FA not configured", 401);
  }

  let secret: string;
  try {
    secret = internal.twoFactorSecret.includes(':')
      ? decryptSecret(internal.twoFactorSecret)
      : internal.twoFactorSecret;
  } catch {
    throw new AuthError("INVALID_2FA_CODE", "Invalid 2FA configuration", 401);
  }
  const valid = authenticator.verify({ token: code, secret });
  if (!valid) {
    // Record failed attempt
    await prisma.verificationToken.create({
      data: {
        identifier: hashedTemp,
        token: randomUUID(),
        type: "2fa_attempt",
        expires: new Date(Date.now() + 5 * 60 * 1000),
      },
    });
    await logAuditEvent("2FA_FAILED", "failure", { userId });
    throw new AuthError("INVALID_2FA_CODE", "Invalid code", 401);
  }

  await invalidateToken(tempToken);
  await logAuditEvent("2FA_VERIFIED", "success", { userId });
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

  const codeIndex = await findMatchingBackupCode(backupCode, internal.backupCodes);
  if (codeIndex === -1) {
    await logAuditEvent("BACKUP_CODE_FAILED", "failure", { userId });
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
  await logAuditEvent("BACKUP_CODE_USED", "success", { userId });
  // Return safe fields only
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: SAFE_USER_SELECT });
  return { user, backupCodesRemaining: updatedCodes.length };
}

export { encryptSecret, decryptSecret, hashBackupCodes };

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
