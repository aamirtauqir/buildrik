import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const wizardData = { v: 1, route: "/onboarding/template/selected", path: "template",
  workspace: { name: "E2E Blank WS" }, site: { name: "E2E Blank Full d013128c", orgType: "mine" },
  template: { id: "cmqsmpcpa000hqqircotk67a1" }, ai: {},
  workspaceId: "cmpa9oi4n0001wrjuvh7j2h8m", siteId: "cmrsur1fp000unh3rvmmiq25t" };
await prisma.onboardingState.update({ where: { userId: "cmrsycr030004tg6n35vxhavz" }, data: { wizardData } });
console.log("flat-shape written");
await prisma.$disconnect();
