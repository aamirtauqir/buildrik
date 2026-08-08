import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const ws = await prisma.workspace.findUnique({ where: { slug: "qa-workspace" } }).catch(() => null);
const site = ws ? await prisma.site.findFirst({ where: { workspaceId: ws.id } }) : null;
const template = await prisma.template.findFirst().catch(() => null);
console.log(JSON.stringify({ workspaceId: ws?.id, siteId: site?.id, siteName: site?.name, templateId: template?.id }));
await prisma.$disconnect();
