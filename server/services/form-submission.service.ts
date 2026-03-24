import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS, type PlanName } from "@/lib/constants/plan-limits";
import type { FormSubmissionInput, ListSubmissionsInput } from "@/lib/validations/forms";

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
    select: { workspaceId: true },
  });

  const member = await prisma.workspaceMember.findFirst({
    where: { workspaceId: site!.workspaceId },
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

  return prisma.formSubmission.create({
    data: { formBlockId, siteId, data: input.data, ip },
  });
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
  formBlockId: string,
  format: "csv" | "json",
): Promise<string> {
  const submissions = await prisma.formSubmission.findMany({
    where: { siteId, formBlockId },
    orderBy: { createdAt: "desc" },
  });

  if (format === "json") {
    return JSON.stringify(submissions, null, 2);
  }

  if (submissions.length === 0) return "";

  const allKeys = Array.from(
    new Set(submissions.flatMap((s) => Object.keys(s.data as Record<string, string>))),
  );
  const headers = ["id", "createdAt", ...allKeys].join(",");
  const rows = submissions.map((s) => {
    const data = s.data as Record<string, string>;
    const values = [s.id, s.createdAt.toISOString(), ...allKeys.map((k) => data[k] ?? "")];
    return values.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",");
  });
  return [headers, ...rows].join("\n");
}
