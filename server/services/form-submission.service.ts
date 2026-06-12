import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS, type PlanName } from "@/lib/constants/plan-limits";
import type { FormSubmissionInput, ListSubmissionsInput } from "@buildrik/shared/schemas/forms";
import { notifyWorkspaceOwner } from "@/server/services/notification.trigger";
import { sendFormSubmissionEmail } from "@/server/services/email.service";

type UpdateInput = {
  id: string;
  isRead?: boolean;
  isSpam?: boolean;
  isArchived?: boolean;
};

export async function submitForm(
  siteId: string,
  formBlockId: string,
  input: FormSubmissionInput,
  ip: string,
) {
  if (input.honeypot) {
    return { id: "honeypot" };
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
  ).catch(() => {});

  prisma.workspaceMember.findFirst({
    where: { workspaceId: site!.workspaceId, role: "OWNER" },
    select: { user: { select: { email: true } } },
  }).then((owner) => {
    if (!owner?.user.email) return;
    const fields = Object.entries((input.data ?? {}) as Record<string, unknown>).map(
      ([label, value]) => ({ label, value: String(value) }),
    );
    return sendFormSubmissionEmail(owner.user.email, site!.name, fields, submission.id);
  }).catch(() => {});

  return submission;
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
  const headers = ["id", "createdAt", "form", ...allKeys].join(",");
  const rows = submissions.map((s) => {
    const data = s.data as Record<string, string>;
    const values = [
      s.id,
      s.createdAt.toISOString(),
      s.formBlock?.name ?? "",
      ...allKeys.map((k) => data[k] ?? ""),
    ];
    return values.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",");
  });
  return [headers, ...rows].join("\n");
}
