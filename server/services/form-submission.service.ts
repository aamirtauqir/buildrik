import { prisma } from "@/lib/prisma";
import { deliverWebhook } from "@/server/services/webhook.service";
import { csvCell } from "@/lib/utils";
import { PLAN_LIMITS, type PlanName } from "@/lib/constants/plan-limits";
import type {
  FormSubmissionInput,
  ListSubmissionsInput,
  UpdateFormBlockInput,
} from "@buildrik/shared/schemas/forms";
import { notifyWorkspaceOwner } from "@/server/services/notification.trigger";
import { sendFormSubmissionEmail } from "@/server/services/email.service";

type UpdateInput = {
  id: string;
  isRead?: boolean;
  isSpam?: boolean;
  isArchived?: boolean;
};

export interface SubmitFormResult {
  id: string;
  successAction: "MESSAGE" | "REDIRECT";
  redirectUrl: string | null;
  successMessage: string | null;
}

export async function submitForm(
  siteId: string,
  formBlockId: string,
  input: FormSubmissionInput,
  ip: string,
): Promise<SubmitFormResult> {
  if (input.honeypot) {
    return { id: "honeypot", successAction: "MESSAGE", redirectUrl: null, successMessage: null };
  }

  const formBlock = await prisma.formBlock.findFirst({
    where: { id: formBlockId, siteId, isActive: true },
  });
  if (!formBlock) throw new Error("FORM_NOT_FOUND");

  const site = await prisma.site.findUnique({
    where: { id: siteId },
    select: { workspaceId: true, name: true, deletedAt: true },
  });
  if (!site || site.deletedAt) throw new Error("FORM_NOT_FOUND");

  const member = await prisma.workspaceMember.findFirst({
    where: { workspaceId: site.workspaceId },
    select: { workspace: { select: { plan: true } } },
  });

  const plan = (member?.workspace?.plan ?? "FREE") as PlanName;
  const limit = PLAN_LIMITS[plan].formSubmissions as number;

  if (limit !== -1) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const count = await prisma.formSubmission.count({
      where: { siteId, createdAt: { gte: monthStart } },
    });
    if (count >= limit) throw new Error("FORM_SUBMISSION_LIMIT");
  }

  const submission = await prisma.formSubmission.create({
    data: { formBlockId, siteId, data: input.data, ip },
  });

  notifyWorkspaceOwner(
    site!.workspaceId,
    "FORM_SUBMISSION_RECEIVED",
    `New form submission on "${site!.name}"`,
    `/dashboard/sites/${siteId}`,
    siteId,
  ).catch(() => {});

  // Notify: the block's own configured address wins (inspector › AFTER SUBMIT
  // › Send to email); no address configured falls back to the workspace
  // owner, same as before that setting existed. Fire-and-forget — a failed
  // send (bad SMTP creds, provider outage) must never lose the submission,
  // which is already committed above.
  (formBlock.notifyEmail
    ? Promise.resolve(formBlock.notifyEmail)
    : prisma.workspaceMember
        .findFirst({
          where: { workspaceId: site!.workspaceId, role: "OWNER" },
          select: { user: { select: { email: true } } },
        })
        .then((owner) => owner?.user.email)
  ).then((to) => {
    if (!to) return;
    const fields = Object.entries((input.data ?? {}) as Record<string, unknown>).map(
      ([label, value]) => ({ label, value: String(value) }),
    );
    return sendFormSubmissionEmail(to, site!.name, fields, siteId);
  }).catch(() => {});

  // P6 workspace webhook — best-effort, never blocks the submission.
  if (site?.workspaceId) {
    void deliverWebhook(site.workspaceId, "form.submit", {
      siteId,
      submissionId: submission.id,
      data: input.data ?? {},
    });
  }

  return {
    id: submission.id,
    successAction: (formBlock.successAction === "REDIRECT" ? "REDIRECT" : "MESSAGE") as
      | "MESSAGE"
      | "REDIRECT",
    redirectUrl: formBlock.redirectUrl ?? null,
    successMessage: formBlock.successMessage ?? null,
  };
}

export async function listSubmissions(input: ListSubmissionsInput) {
  const { siteId, formBlockId, isRead, isSpam, isArchived, page, perPage } = input;

  const where = {
    siteId,
    ...(formBlockId !== undefined && { formBlockId }),
    ...(isRead !== undefined && { isRead }),
    ...(isSpam !== undefined && { isSpam }),
    ...(isArchived !== undefined && { isArchived }),
  };

  const [total, data] = await Promise.all([
    prisma.formSubmission.count({ where }),
    prisma.formSubmission.findMany({
      where,
      include: { formBlock: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
  ]);

  return { data, total, page, perPage };
}

export async function updateSubmission(input: UpdateInput) {
  const { id, ...data } = input;
  return prisma.formSubmission.update({ where: { id }, data });
}

export async function deleteSubmission(id: string) {
  return prisma.formSubmission.delete({ where: { id } });
}

export async function listFormBlocks(siteId: string) {
  return prisma.formBlock.findMany({
    where: { siteId },
    include: { _count: { select: { submissions: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export interface FormBlockSettings {
  successMessage: string | null;
  successAction: "MESSAGE" | "REDIRECT";
  redirectUrl: string | null;
  notifyEmail: string | null;
  spamProtection: boolean;
}

const DEFAULT_FORM_BLOCK_SETTINGS: FormBlockSettings = {
  successMessage: null,
  successAction: "MESSAGE",
  redirectUrl: null,
  notifyEmail: null,
  spamProtection: true,
};

/**
 * Inspector AFTER SUBMIT / PROTECTION read. The block's row may not exist yet
 * — the row is created at first publish (`planFormWiring` → the publish
 * worker's upsert) — so an unpublished form reads as the same defaults its
 * row will get once it exists.
 */
export async function getFormBlockSettings(
  siteId: string,
  blockId: string,
): Promise<FormBlockSettings> {
  const row = await prisma.formBlock.findFirst({ where: { id: blockId, siteId } });
  if (!row) return DEFAULT_FORM_BLOCK_SETTINGS;
  return {
    successMessage: row.successMessage,
    successAction: row.successAction === "REDIRECT" ? "REDIRECT" : "MESSAGE",
    redirectUrl: row.redirectUrl,
    notifyEmail: row.notifyEmail,
    spamProtection: row.spamProtection,
  };
}

/**
 * Inspector AFTER SUBMIT / PROTECTION write. Upserts by the form element's
 * own id (the same id `wireForms` uses as the FormBlock id at publish time),
 * so a setting saved before the form is ever published still lands on the
 * row publish later creates/updates.
 */
export async function updateFormBlock(input: UpdateFormBlockInput) {
  const { siteId, blockId, ...settings } = input;
  const data: Record<string, unknown> = {};
  if (settings.successMessage !== undefined) data.successMessage = settings.successMessage || null;
  if (settings.successAction !== undefined) data.successAction = settings.successAction;
  if (settings.redirectUrl !== undefined) data.redirectUrl = settings.redirectUrl || null;
  if (settings.notifyEmail !== undefined) data.notifyEmail = settings.notifyEmail || null;
  if (settings.spamProtection !== undefined) data.spamProtection = settings.spamProtection;

  // `id` is globally unique, not scoped to siteId — an upsert keyed only on
  // `where: { id }` would let a member of one site overwrite another site's
  // row by guessing its element id. Check ownership of any existing row
  // before writing.
  const existing = await prisma.formBlock.findUnique({ where: { id: blockId }, select: { siteId: true } });
  if (existing && existing.siteId !== siteId) {
    throw new Error("FORM_NOT_FOUND");
  }

  return prisma.formBlock.upsert({
    where: { id: blockId },
    create: {
      id: blockId,
      siteId,
      blockId,
      name: "Untitled form",
      fields: [],
      ...data,
    },
    update: data,
  });
}

export async function exportSubmissions(
  siteId: string,
  // null/undefined exports every form on the site (the overview "Export CSV"
  // button) rather than a single form block — the full dataset, not one page.
  formBlockId: string | null | undefined,
  format: "csv" | "json",
): Promise<string> {
  const submissions = await prisma.formSubmission.findMany({
    where: { siteId, ...(formBlockId ? { formBlockId } : {}) },
    orderBy: { createdAt: "desc" },
    include: { formBlock: { select: { name: true } } },
  });

  if (format === "json") {
    return JSON.stringify(submissions, null, 2);
  }

  if (submissions.length === 0) return "";

  const allKeys = Array.from(
    new Set(submissions.flatMap((s) => Object.keys(s.data as Record<string, string>))),
  );
  // Field names AND values are attacker-controlled (public endpoint) — both
  // go through csvCell so formula payloads can't execute in Excel/Sheets.
  const headers = ["id", "createdAt", "form", ...allKeys].map(csvCell).join(",");
  const rows = submissions.map((s) => {
    const data = s.data as Record<string, string>;
    const values = [
      s.id,
      s.createdAt.toISOString(),
      s.formBlock?.name ?? "",
      ...allKeys.map((k) => data[k] ?? ""),
    ];
    return values.map(csvCell).join(",");
  });
  return [headers, ...rows].join("\n");
}
