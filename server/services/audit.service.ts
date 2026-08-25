import { prisma } from "@/lib/prisma";

type AuditAction =
  | "LOGIN_SUCCESS" | "LOGIN_FAILED" | "LOGIN_LOCKED"
  | "SIGNUP" | "SIGNUP_RECLAIMED_UNVERIFIED" | "EMAIL_VERIFIED"
  | "PASSWORD_RESET_REQUESTED" | "PASSWORD_RESET_COMPLETED" | "PASSWORD_RESET_OAUTH_ONLY"
  | "MAGIC_LINK_REQUESTED" | "MAGIC_LINK_VERIFIED"
  | "2FA_VERIFIED" | "2FA_FAILED" | "2FA_LOCKED"
  | "BACKUP_CODE_USED" | "BACKUP_CODE_FAILED"
  | "INVITE_ACCEPTED" | "INVITE_DECLINED" | "INVITE_EMAIL_MISMATCH"
  | "SESSION_CREATED"
  | "OAUTH_LOGIN" | "OAUTH_SIGNUP"
  | "EMAIL_CHANGED"
  // The verification mail did not go out. Signup still succeeded, so nothing
  // else records it — and without a row here a broken SMTP config looks
  // identical to nobody signing up.
  | "VERIFICATION_EMAIL_FAILED"
  // Same shape, on the review loop: the client's invite mail did not go out.
  // The round and its token still exist, so without a row here a misconfigured
  // SMTP looks identical to a client who simply hasn't opened the link.
  | "REVIEW_INVITE_EMAIL_FAILED"
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
