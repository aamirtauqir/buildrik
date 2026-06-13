import { prisma } from "@/lib/prisma";

type AuditAction =
  | "LOGIN_SUCCESS" | "LOGIN_FAILED" | "LOGIN_LOCKED"
  | "SIGNUP" | "EMAIL_VERIFIED"
  | "PASSWORD_RESET_REQUESTED" | "PASSWORD_RESET_COMPLETED"
  | "MAGIC_LINK_REQUESTED" | "MAGIC_LINK_VERIFIED"
  | "2FA_VERIFIED" | "2FA_FAILED" | "2FA_LOCKED"
  | "BACKUP_CODE_USED" | "BACKUP_CODE_FAILED"
  | "INVITE_ACCEPTED" | "INVITE_DECLINED" | "INVITE_EMAIL_MISMATCH"
  | "SESSION_CREATED"
  | "OAUTH_LOGIN" | "OAUTH_SIGNUP"
  | "EMAIL_CHANGED"
  | "LOGOUT";

export async function logAuditEvent(
  action: AuditAction,
  status: "success" | "failure",
  options?: { userId?: string; email?: string; metadata?: Record<string, unknown> }
) {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        status,
        userId: options?.userId,
        email: options?.email,
        metadata: options?.metadata ? JSON.stringify(options.metadata) : null,
      },
    });
  } catch (err) {
    // Audit logging should never crash the app — but security events
    // (LOGIN_FAILED, 2FA_LOCKED, ...) silently vanishing defeats the point
    // of an audit trail. Log to the server console as a compliance fallback
    // sink so a broken audit table is at least visible in logs.
    console.error(`[audit] failed to record ${action}/${status}:`, err);
  }
}
