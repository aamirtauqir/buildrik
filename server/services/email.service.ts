import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || "noreply@buildrik.app";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function sendVerificationEmail(to: string, token: string) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Verify your email — Buildrik",
    html: `
      <h2>Verify your email</h2>
      <p>Click the link below to verify your email address:</p>
      <a href="${BASE_URL}/auth/verify-email?token=${token}" style="display:inline-block;padding:12px 24px;background:#6366F1;color:white;border-radius:8px;text-decoration:none;">Verify Email Address</a>
      <p style="color:#64748B;font-size:12px;margin-top:16px;">This link expires in 24 hours.</p>
    `,
  });
}

export async function sendPasswordResetEmail(to: string, token: string) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Reset your password — Buildrik",
    html: `
      <h2>Reset your password</h2>
      <p>Click the link below to reset your password:</p>
      <a href="${BASE_URL}/auth/reset-password?token=${token}" style="display:inline-block;padding:12px 24px;background:#6366F1;color:white;border-radius:8px;text-decoration:none;">Reset Password</a>
      <p style="color:#64748B;font-size:12px;margin-top:16px;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
    `,
  });
}

export async function sendMagicLinkEmail(to: string, token: string) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Sign in to Buildrik",
    html: `
      <h2>Sign in to Buildrik</h2>
      <p>Click the link below to sign in:</p>
      <a href="${BASE_URL}/auth/callback?token=${token}" style="display:inline-block;padding:12px 24px;background:#6366F1;color:white;border-radius:8px;text-decoration:none;">Sign In</a>
      <p style="color:#64748B;font-size:12px;margin-top:16px;">This link expires in 15 minutes.</p>
    `,
  });
}

export async function sendTeamInviteEmail(
  to: string,
  workspaceName: string,
  inviterName: string,
  token: string
) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: `${inviterName} invited you to ${workspaceName} — Buildrik`,
    html: `
      <h2>You've been invited!</h2>
      <p>${inviterName} invited you to join <strong>${workspaceName}</strong> on Buildrik.</p>
      <a href="${BASE_URL}/auth/invite?token=${token}" style="display:inline-block;padding:12px 24px;background:#6366F1;color:white;border-radius:8px;text-decoration:none;">Accept Invite</a>
      <p style="color:#64748B;font-size:12px;margin-top:16px;">This invite expires in 7 days.</p>
    `,
  });
}
