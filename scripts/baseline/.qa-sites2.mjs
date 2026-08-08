import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const sites = await prisma.site.findMany({ where: { workspaceId: "cmpa9oi4n0001wrjuvh7j2h8m" }, select: { id: true, name: true, deletedAt: true, status: true }, orderBy: { createdAt: "desc" }, take: 8 }).catch(e => e.message);
console.log(JSON.stringify(sites, null, 1));
await prisma.$disconnect();
