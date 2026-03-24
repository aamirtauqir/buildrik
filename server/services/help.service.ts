import { prisma } from "@/lib/prisma";
import { HELP_CATEGORIES, type SupportTicketInput } from "@/lib/validations/help";

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
  return prisma.supportTicket.create({
    data: {
      userId,
      subject: input.subject,
      category: input.category,
      description: input.description,
      status: "OPEN",
      attachments: [],
    },
  });
}
