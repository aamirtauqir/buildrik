import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const site = await prisma.site.findUnique({ where: { id: "cmrsur1fp000unh3rvmmiq25t" }, include: { pages: true } });
console.log("site", site?.id, site?.name, "pages:", site?.pages?.length);
for (const p of site?.pages ?? []) {
  console.log("--- page", p.id, p.name, p.slug);
  /* Prisma's Page model stores the tree in `blocks`; `root` is the editor's
     in-memory shape and is undefined on a DB row, so this printed "undefined"
     for every page. */
  console.log(JSON.stringify(p.blocks).slice(0, 500));
}
await prisma.$disconnect();
