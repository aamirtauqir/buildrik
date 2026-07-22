import nodemailer from "nodemailer";
import { render } from "@react-email/render";
import VerifyEmail from "@/emails/verify-email";
import ResetPassword from "@/emails/reset-password";
import MagicLink from "@/emails/magic-link";
import TeamInvite from "@/emails/team-invite";
import EmailChanged from "@/emails/email-changed";
import PaymentFailed from "@/emails/payment-failed";
import DunningReminder from "@/emails/dunning-reminder";
import AutoDowngrade from "@/emails/auto-downgrade";
import ExportReady from "@/emails/export-ready";
import AccountDeletion from "@/emails/account-deletion";
import AiComplete from "@/emails/ai-complete";
import AiFailed from "@/emails/ai-failed";
import WsTransferOut from "@/emails/ws-transfer-out";
import WsTransferIn from "@/emails/ws-transfer-in";
import SslExpiring from "@/emails/ssl-expiring";
import PlanLimitWarning from "@/emails/plan-limit-warning";
import WsTransferInvite from "@/emails/ws-transfer-invite";
import FormSubmission from "@/emails/form-submission";
import SiteTransferred from "@/emails/site-transferred";
import TicketReceived from "@/emails/ticket-received";
import ReviewRequested from "@/emails/review-requested";
import ReviewInvite from "@/emails/review-invite";
import ReviewResolved from "@/emails/review-resolved";

/** cPanel/Passenger pipes env vars through a shell, so a `$` in the password is
 *  read as a variable and silently eaten (`^+qH$gt@...` lost `$gt`, giving a
 *  535 auth failure in prod while dev worked). Base64 has no shell metacharacters,
 *  so SMTP_PASS_B64 survives such hosts. Plain SMTP_PASS still works elsewhere. */
function smtpPassword(): string | undefined {
  const b64 = process.env.SMTP_PASS_B64;
  if (b64) return Buffer.from(b64, "base64").toString("utf8");
  return process.env.SMTP_PASS;
}

let _transport: nodemailer.Transporter | null = null;
function getTransport() {
  if (!_transport) {
    const port = Number(process.env.SMTP_PORT) || 587;
    _transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      // 465 is implicit TLS (SMTPS) — the socket is encrypted from the start.
      // Anything else starts plaintext and upgrades via STARTTLS.
      secure: port === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: smtpPassword(),
      },
    });
  }
  return _transport;
}

const FROM = process.env.EMAIL_FROM || "info@buildrick.io";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

async function sendEmail(to: string, subject: string, html: string) {
  await getTransport().sendMail({ from: FROM, to, subject, html });
}

export async function sendVerificationEmail(to: string, token: string) {
  const html = await render(VerifyEmail({ verifyUrl: `${BASE_URL}/auth/verify-email?token=${encodeURIComponent(token)}` }));
  await sendEmail(to, "Verify your email — Buildrick", html);
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const html = await render(ResetPassword({ resetUrl: `${BASE_URL}/auth/reset-password?token=${encodeURIComponent(token)}` }));
  await sendEmail(to, "Reset your password — Buildrick", html);
}

const PROVIDER_LABEL: Record<string, string> = { google: "Google", github: "GitHub" };

/**
 * Sent instead of the reset email when the account has no password because it
 * was created through a social provider. Telling the user this ON the login
 * screen would leak how any address signs in (a phishing oracle); telling them
 * in an email only the mailbox owner can read does not. It also carries a real
 * "Set a password" link for anyone who does want one — the reset token is valid
 * regardless of whether a password currently exists.
 */
export async function sendOAuthOnlyLoginEmail(to: string, providers: string[], token: string) {
  const named = providers.map((p) => PROVIDER_LABEL[p] ?? p).filter(Boolean);
  const providerText =
    named.length === 0
      ? "a social login"
      : named.length === 1
        ? named[0]
        : `${named.slice(0, -1).join(", ")} or ${named[named.length - 1]}`;
  const setPasswordUrl = `${BASE_URL}/auth/reset-password?token=${encodeURIComponent(token)}`;

  const html = `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px">
    <h2 style="color:#0F172A;margin:0 0 8px">Your account uses ${providerText}</h2>
    <p style="color:#334155">You asked to reset your password, but this account was created with ${providerText} and doesn't have one yet. Sign in with the button on the login page and you're in.</p>
    <p><a href="${BASE_URL}/auth" style="display:inline-block;background:#2D6DFF;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">Go to login</a></p>
    <p style="color:#334155;margin-top:20px">Prefer signing in with a password? You can set one:</p>
    <p><a href="${setPasswordUrl}" style="color:#2D6DFF;font-weight:600">Set a password</a> <span style="color:#94A3B8">(link expires in 1 hour)</span></p>
    <p style="color:#64748B;font-size:13px;margin-top:16px">If you didn't request this, you can ignore this email — nothing changes.</p>
  </div>`;
  await sendEmail(to, "Signing in to Buildrick", html);
}

export async function sendMagicLinkEmail(to: string, token: string) {
  const html = await render(MagicLink({ signInUrl: `${BASE_URL}/auth/callback?token=${encodeURIComponent(token)}` }));
  await sendEmail(to, "Sign in to Buildrick", html);
}

export async function sendNewDeviceAlertEmail(to: string) {
  const html = `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px">
    <h2 style="color:#0F172A;margin:0 0 8px">New sign-in to your Buildrick account</h2>
    <p style="color:#334155">We noticed a sign-in from a device or location we don't recognize. If this was you, no action is needed.</p>
    <p style="color:#334155">If this wasn't you, secure your account now:</p>
    <p><a href="${BASE_URL}/auth/forgot-password" style="display:inline-block;background:#2D6DFF;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">Secure my account</a></p>
    <p style="color:#64748B;font-size:13px;margin-top:16px">Review this alert at ${BASE_URL}/auth/device-alert</p>
  </div>`;
  await sendEmail(to, "New sign-in to your Buildrick account", html);
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
  await sendEmail(to, `${inviterName} invited you to ${workspaceName} — Buildrick`, html);
}

export async function sendEmailChangedEmail(to: string, token: string) {
  const html = await render(EmailChanged({ verifyUrl: `${BASE_URL}/auth/verify-email?token=${encodeURIComponent(token)}` }));
  await sendEmail(to, "Verify your new email — Buildrick", html);
}

export async function sendPaymentFailedEmail(to: string) {
  const html = await render(PaymentFailed({ updateUrl: `${BASE_URL}/dashboard/settings/billing` }));
  await sendEmail(to, "Your payment failed — Buildrick", html);
}

export async function sendDunningReminderEmail(to: string, daysLeft: number) {
  const html = await render(DunningReminder({ daysLeft, updateUrl: `${BASE_URL}/dashboard/settings/billing` }));
  await sendEmail(to, `${daysLeft} days until downgrade — Buildrick`, html);
}

export async function sendAutoDowngradeEmail(to: string) {
  const html = await render(AutoDowngrade({ reactivateUrl: `${BASE_URL}/dashboard/settings/billing` }));
  await sendEmail(to, "Your plan has been downgraded — Buildrick", html);
}

export async function sendExportReadyEmail(to: string, downloadUrl: string) {
  const html = await render(ExportReady({ downloadUrl }));
  await sendEmail(to, "Your data export is ready — Buildrick", html);
}

export async function sendAccountDeletionEmail(to: string, deletionDate: string) {
  const html = await render(AccountDeletion({ deletionDate, cancelUrl: `${BASE_URL}/dashboard/settings/danger` }));
  await sendEmail(to, "Account deletion scheduled — Buildrick", html);
}

export async function sendTicketReceivedEmail(to: string, ticketNumber: number, subject: string, sla: string) {
  const html = await render(TicketReceived({ ticketNumber, subject, sla }));
  await sendEmail(to, `We got your request — Ticket #${ticketNumber}`, html);
}

export async function sendAICompleteEmail(to: string, siteName: string, siteId: string) {
  const html = await render(AiComplete({ siteName, viewUrl: `${BASE_URL}/dashboard/sites/${encodeURIComponent(siteId)}` }));
  await sendEmail(to, `Your site "${siteName}" is ready — Buildrick`, html);
}

export async function sendAIFailedEmail(to: string) {
  const html = await render(AiFailed({ retryUrl: `${BASE_URL}/dashboard/sites/new` }));
  await sendEmail(to, "Site generation failed — Buildrick", html);
}

export async function sendWSTransferOutEmail(to: string, workspaceName: string, newOwnerEmail: string) {
  const html = await render(WsTransferOut({ workspaceName, newOwnerEmail }));
  await sendEmail(to, `Workspace transfer initiated — Buildrick`, html);
}

export async function sendWSTransferInEmail(to: string, workspaceName: string) {
  const html = await render(WsTransferIn({ workspaceName, manageUrl: `${BASE_URL}/dashboard/settings/workspace` }));
  await sendEmail(to, `You now own "${workspaceName}" — Buildrick`, html);
}

export async function sendSSLExpiringEmail(to: string, domain: string, domainId: string) {
  // No /domains/[id] route exists; the workspace domain monitor is the real
  // landing page. domainId is kept in the query for deep-link context.
  const html = await render(SslExpiring({ domain, renewUrl: `${BASE_URL}/dashboard/settings/domains?domain=${encodeURIComponent(domainId)}` }));
  await sendEmail(to, `SSL certificate expiring for ${domain} — Buildrick`, html);
}

export async function sendPlanLimitWarningEmail(to: string, resource: string) {
  const html = await render(PlanLimitWarning({ resource, upgradeUrl: `${BASE_URL}/dashboard/settings/billing` }));
  await sendEmail(to, `You're approaching your ${resource} limit — Buildrick`, html);
}

export async function sendWSTransferInviteEmail(to: string, workspaceName: string, token: string) {
  const html = await render(WsTransferInvite({ workspaceName, acceptUrl: `${BASE_URL}/transfer/accept?token=${encodeURIComponent(token)}` }));
  await sendEmail(to, `Accept ownership of "${workspaceName}" — Buildrick`, html);
}

export async function sendFormSubmissionEmail(
  to: string,
  siteName: string,
  fields: { label: string; value: string }[],
  siteId: string
) {
  // Submissions live on the site's feedback tab; there is no /forms/[id] route.
  const html = await render(FormSubmission({ siteName, fields, viewUrl: `${BASE_URL}/dashboard/sites/${encodeURIComponent(siteId)}/feedback` }));
  await sendEmail(to, `New form submission on ${siteName} — Buildrick`, html);
}

export async function sendSiteTransferredEmail(to: string, fromName: string, siteName: string, siteId: string) {
  const html = await render(SiteTransferred({ fromName, siteName, viewUrl: `${BASE_URL}/dashboard/sites/${encodeURIComponent(siteId)}` }));
  await sendEmail(to, `Site "${siteName}" transferred to you — Buildrick`, html);
}

export async function sendReviewRequestedEmail(
  to: string,
  opts: { siteName: string; requesterName: string; note?: string; changeSummary?: string }
) {
  const html = await render(ReviewRequested({ ...opts, reviewsUrl: `${BASE_URL}/dashboard/agency/reviews` }));
  await sendEmail(to, `${opts.requesterName} sent "${opts.siteName}" for review — Buildrick`, html);
}

/**
 * The client's review link. The ONE email in this file whose recipient is not
 * a Buildrick user — it goes to an account-less client, so it leads with the
 * agency's name and never mentions signing up.
 */
export async function sendReviewInviteEmail(
  to: string,
  opts: {
    siteName: string;
    agencyName: string;
    designerName: string;
    token: string;
    note?: string;
    changeSummary?: string;
    expiresInDays?: number;
  }
) {
  const { token, ...rest } = opts;
  const html = await render(
    ReviewInvite({ ...rest, reviewUrl: `${BASE_URL}/review/${encodeURIComponent(token)}` })
  );
  await sendEmail(to, `${opts.siteName} is ready for you to look at`, html);
}

export async function sendReviewResolvedEmail(
  to: string,
  opts: { siteName: string; approved: boolean; resolverName: string; note?: string; siteId: string }
) {
  const { siteId, ...rest } = opts;
  const html = await render(ReviewResolved({ ...rest, viewUrl: `${BASE_URL}/dashboard/sites/${encodeURIComponent(siteId)}` }));
  const subject = opts.approved
    ? `"${opts.siteName}" was approved — Buildrick`
    : `Changes requested on "${opts.siteName}" — Buildrick`;
  await sendEmail(to, subject, html);
}
