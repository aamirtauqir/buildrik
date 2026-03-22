import nodemailer from "nodemailer";
import { render } from "@react-email/render";
import VerifyEmail from "@/emails/verify-email";
import ResetPassword from "@/emails/reset-password";
import MagicLink from "@/emails/magic-link";
import TeamInvite from "@/emails/team-invite";

let _transport: nodemailer.Transporter | null = null;
function getTransport() {
  if (!_transport) {
    _transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 2525,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return _transport;
}

const FROM = process.env.EMAIL_FROM || "noreply@buildrik.app";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

async function sendEmail(to: string, subject: string, html: string) {
  await getTransport().sendMail({ from: FROM, to, subject, html });
}

export async function sendVerificationEmail(to: string, token: string) {
  const html = await render(VerifyEmail({ verifyUrl: `${BASE_URL}/auth/verify-email?token=${encodeURIComponent(token)}` }));
  await sendEmail(to, "Verify your email — Buildrik", html);
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const html = await render(ResetPassword({ resetUrl: `${BASE_URL}/auth/reset-password?token=${encodeURIComponent(token)}` }));
  await sendEmail(to, "Reset your password — Buildrik", html);
}

export async function sendMagicLinkEmail(to: string, token: string) {
  const html = await render(MagicLink({ signInUrl: `${BASE_URL}/auth/callback?token=${encodeURIComponent(token)}` }));
  await sendEmail(to, "Sign in to Buildrik", html);
}

export async function sendTeamInviteEmail(
  to: string,
  workspaceName: string,
  inviterName: string,
  token: string
) {
  const html = await render(TeamInvite({
    inviteUrl: `${BASE_URL}/auth/invite?token=${encodeURIComponent(token)}`,
    inviterName,
    workspaceName,
  }));
  await sendEmail(to, `${inviterName} invited you to ${workspaceName} — Buildrik`, html);
}
