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
import ReviewResolved from "@/emails/review-resolved";

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

export async function sendEmailChangedEmail(to: string, token: string) {
  const html = await render(EmailChanged({ verifyUrl: `${BASE_URL}/auth/verify-email?token=${encodeURIComponent(token)}` }));
  await sendEmail(to, "Verify your new email — Buildrik", html);
}

export async function sendPaymentFailedEmail(to: string) {
  const html = await render(PaymentFailed({ updateUrl: `${BASE_URL}/settings/billing` }));
  await sendEmail(to, "Your payment failed — Buildrik", html);
}

export async function sendDunningReminderEmail(to: string, daysLeft: number) {
  const html = await render(DunningReminder({ daysLeft, updateUrl: `${BASE_URL}/settings/billing` }));
  await sendEmail(to, `${daysLeft} days until downgrade — Buildrik`, html);
}

export async function sendAutoDowngradeEmail(to: string) {
  const html = await render(AutoDowngrade({ reactivateUrl: `${BASE_URL}/settings/billing` }));
  await sendEmail(to, "Your plan has been downgraded — Buildrik", html);
}

export async function sendExportReadyEmail(to: string, downloadUrl: string) {
  const html = await render(ExportReady({ downloadUrl }));
  await sendEmail(to, "Your data export is ready — Buildrik", html);
}

export async function sendAccountDeletionEmail(to: string, deletionDate: string) {
  const html = await render(AccountDeletion({ deletionDate, cancelUrl: `${BASE_URL}/settings/danger-zone` }));
  await sendEmail(to, "Account deletion scheduled — Buildrik", html);
}

export async function sendTicketReceivedEmail(to: string, ticketNumber: number, subject: string, sla: string) {
  const html = await render(TicketReceived({ ticketNumber, subject, sla }));
  await sendEmail(to, `We got your request — Ticket #${ticketNumber}`, html);
}

export async function sendAICompleteEmail(to: string, siteName: string, siteId: string) {
  const html = await render(AiComplete({ siteName, viewUrl: `${BASE_URL}/sites/${encodeURIComponent(siteId)}` }));
  await sendEmail(to, `Your site "${siteName}" is ready — Buildrik`, html);
}

export async function sendAIFailedEmail(to: string) {
  const html = await render(AiFailed({ retryUrl: `${BASE_URL}/sites/new` }));
  await sendEmail(to, "Site generation failed — Buildrik", html);
}

export async function sendWSTransferOutEmail(to: string, workspaceName: string, newOwnerEmail: string) {
  const html = await render(WsTransferOut({ workspaceName, newOwnerEmail }));
  await sendEmail(to, `Workspace transfer initiated — Buildrik`, html);
}

export async function sendWSTransferInEmail(to: string, workspaceName: string) {
  const html = await render(WsTransferIn({ workspaceName, manageUrl: `${BASE_URL}/settings/workspace` }));
  await sendEmail(to, `You now own "${workspaceName}" — Buildrik`, html);
}

export async function sendSSLExpiringEmail(to: string, domain: string, domainId: string) {
  const html = await render(SslExpiring({ domain, renewUrl: `${BASE_URL}/domains/${encodeURIComponent(domainId)}` }));
  await sendEmail(to, `SSL certificate expiring for ${domain} — Buildrik`, html);
}

export async function sendPlanLimitWarningEmail(to: string, resource: string) {
  const html = await render(PlanLimitWarning({ resource, upgradeUrl: `${BASE_URL}/settings/billing` }));
  await sendEmail(to, `You're approaching your ${resource} limit — Buildrik`, html);
}

export async function sendWSTransferInviteEmail(to: string, workspaceName: string, token: string) {
  const html = await render(WsTransferInvite({ workspaceName, acceptUrl: `${BASE_URL}/transfer/accept?token=${encodeURIComponent(token)}` }));
  await sendEmail(to, `Accept ownership of "${workspaceName}" — Buildrik`, html);
}

export async function sendFormSubmissionEmail(
  to: string,
  siteName: string,
  fields: { label: string; value: string }[],
  submissionId: string
) {
  const html = await render(FormSubmission({ siteName, fields, viewUrl: `${BASE_URL}/forms/${encodeURIComponent(submissionId)}` }));
  await sendEmail(to, `New form submission on ${siteName} — Buildrik`, html);
}

export async function sendSiteTransferredEmail(to: string, fromName: string, siteName: string, siteId: string) {
  const html = await render(SiteTransferred({ fromName, siteName, viewUrl: `${BASE_URL}/sites/${encodeURIComponent(siteId)}` }));
  await sendEmail(to, `Site "${siteName}" transferred to you — Buildrik`, html);
}

export async function sendReviewRequestedEmail(
  to: string,
  opts: { siteName: string; requesterName: string; note?: string; changeSummary?: string }
) {
  const html = await render(ReviewRequested({ ...opts, reviewsUrl: `${BASE_URL}/dashboard/reviews` }));
  await sendEmail(to, `${opts.requesterName} sent "${opts.siteName}" for review — Buildrik`, html);
}

export async function sendReviewResolvedEmail(
  to: string,
  opts: { siteName: string; approved: boolean; resolverName: string; note?: string; siteId: string }
) {
  const { siteId, ...rest } = opts;
  const html = await render(ReviewResolved({ ...rest, viewUrl: `${BASE_URL}/sites/${encodeURIComponent(siteId)}` }));
  const subject = opts.approved
    ? `"${opts.siteName}" was approved — Buildrik`
    : `Changes requested on "${opts.siteName}" — Buildrik`;
  await sendEmail(to, subject, html);
}
