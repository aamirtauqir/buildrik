import { prisma } from "@/lib/prisma";
import { HELP_CATEGORIES, type SupportTicketInput } from "@buildrik/shared/schemas/help";
import { sendTicketReceivedEmail } from "@/server/services/email.service";

// SLA copy by plan — mirrors the confirmation UI (ticket-form SLA_BY_PLAN).
const SLA_COPY: Record<string, string> = {
  FREE: "Free plans use our help docs — we read every ticket but don't guarantee an email reply.",
  PRO: "You're on Pro: expect an email response within 48 hours.",
  BUSINESS: "You're on Business: priority response within 4 hours.",
};

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
  // Acknowledge the ticket by email so the SLA promised in the UI isn't a
  // lie — the ticket previously persisted with no acknowledgement at all.
  // Fire-and-forget: a mail hiccup must not fail ticket creation.
  prisma.user
    .findUnique({ where: { id: userId }, select: { email: true } })
    .then((u) => {
      if (u?.email) {
        return sendTicketReceivedEmail(u.email, ticket.ticketNumber, ticket.subject, SLA_COPY[plan] ?? SLA_COPY.FREE);
      }
    })
    .catch((err) => console.error("[help] ticket ack email failed:", err));

  // ticketNumber (real column) + plan feed the confirmation UI, which used to
  // hardcode "#0" and a FREE SLA.
  return { ...ticket, plan };
}
