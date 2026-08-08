import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const members = await prisma.workspaceMember.findMany({ where: { userId: "cmpa9ohx10000wrjux4ecumzo" }, include: { workspace: true } });
for (const m of members) {
  const sites = await prisma.site.findMany({ where: { workspaceId: m.workspaceId }, select: { id: true, name: true }, take: 3 });
  console.log(JSON.stringify({ ws: m.workspace.name, wsId: m.workspaceId, role: m.role, sites }));
}
await prisma.$disconnect();
