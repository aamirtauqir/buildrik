import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const site = await prisma.site.findUnique({ where: { id: "cmrsur1fp000unh3rvmmiq25t" }, include: { pages: true } });
console.log("site", site?.id, site?.name, "pages:", site?.pages?.length);
for (const p of site?.pages ?? []) {
  console.log("--- page", p.id, p.name, p.slug);
  const root = p.root;
  console.log(JSON.stringify(root).slice(0, 500));
}
await prisma.$disconnect();
