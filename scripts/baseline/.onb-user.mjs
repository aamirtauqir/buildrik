import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const u = await prisma.user.findUnique({ where: { email: "qa-onboarding@buildrik.local" } });
console.log(JSON.stringify({ onbUserId: u?.id }));
await prisma.$disconnect();
