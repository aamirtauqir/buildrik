import { prisma } from "@/lib/prisma";
import { HELP_CATEGORIES, type SupportTicketInput } from "@buildrik/shared/schemas/help";

export function listCategories() {
  return HELP_CATEGORIES.map((c) => ({ ...c }));
}

export async function searchArticles(query: string) {
  return prisma.helpArticle.findMany({
    where: {
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { excerpt: { contains: query, mode: "insensitive" } },
        { content: { contains: query, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      title: true,
      slug: true,
      category: true,
      excerpt: true,
      readTime: true,
    },
    take: 20,
  });
}

export async function listArticlesByCategory(category: string) {
  return prisma.helpArticle.findMany({
    where: { category },
    select: {
      id: true,
      title: true,
      slug: true,
      category: true,
      excerpt: true,
      readTime: true,
    },
    orderBy: { title: "asc" },
    take: 50,
  });
}

export async function getArticle(slug: string) {
  return prisma.helpArticle.findUnique({ where: { slug } });
}

export async function submitFeedback(articleId: string, helpful: boolean) {
  await prisma.helpArticle.update({
    where: { id: articleId },
    data: helpful ? { helpfulYes: { increment: 1 } } : { helpfulNo: { increment: 1 } },
  });
}

export async function createTicket(userId: string, input: SupportTicketInput) {
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId, status: "ACTIVE" },
    select: { workspace: { select: { plan: true } } },
  });
  // SLA is driven by the user's best plan across active memberships
  // (BUSINESS > PRO > FREE) — tickets are per-user but plans per-workspace.
  const PLAN_RANK: Record<string, number> = { FREE: 0, PRO: 1, BUSINESS: 2 };
  const plan = memberships
    .map((m) => m.workspace.plan)
    .reduce((best, p) => ((PLAN_RANK[p] ?? 0) > (PLAN_RANK[best] ?? 0) ? p : best), "FREE");

  const ticket = await prisma.supportTicket.create({
    data: {
      userId,
      subject: input.subject,
      category: input.category,
      description: input.description,
      status: "OPEN",
      attachments: input.attachments ?? [],
    },
  });
  // ticketNumber (real column) + plan feed the confirmation UI, which used to
  // hardcode "#0" and a FREE SLA.
  return { ...ticket, plan };
}
