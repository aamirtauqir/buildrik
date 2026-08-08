import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const user = await prisma.user.findUnique({ where: { email: "qa@buildrik.local" } });
if (!user) { console.log(JSON.stringify({error:"no qa user"})); process.exit(1); }
const member = await prisma.workspaceMember.findFirst({ where: { userId: user.id } });
console.log(JSON.stringify({ userId: user.id, workspaceId: member?.workspaceId }));
await prisma.$disconnect();
