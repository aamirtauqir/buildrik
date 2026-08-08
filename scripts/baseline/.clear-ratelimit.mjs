import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const n = await prisma.$executeRawUnsafe(`DELETE FROM "rate_limit_buckets"`);
console.log(JSON.stringify({ deleted: n }));
await prisma.$disconnect();
