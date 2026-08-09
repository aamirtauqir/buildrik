import { PrismaClient } from "@prisma/client";
import { randomBytes } from "crypto";
const prisma = new PrismaClient();
const SITE = "cmrsur1fp000unh3rvmmiq25t";       // live qa site
const QA = "cmpa9ohx10000wrjux4ecumzo";
const ONB = "cmrsycr030004tg6n35vxhavz";
const TPL = "cmqsmpcpa000hqqircotk67a1";
// wizard state: template selected + site created (covers selected/preview/ready guards)
const wizardData = { v: 1, route: "/onboarding/template/selected",
  data: { path: "template", siteId: SITE, workspace: { name: "E2E Blank WS" },
          site: { name: "E2E Blank Full d013128c" }, template: { id: TPL, name: "Fixture Template" }, ai: {} } };
await prisma.onboardingState.upsert({
  where: { userId: ONB }, update: { wizardData }, create: { userId: ONB, wizardData } });
const share = randomBytes(16).toString("hex");
await prisma.shareLink.create({ data: { siteId: SITE, name: "baseline-fixture", token: share, isActive: true } });
const reviewer = await prisma.reviewer.upsert({
  where: { siteId_email: { siteId: SITE, email: "reviewer-fixture@buildrik.local" } },
  update: {}, create: { siteId: SITE, name: "Fixture Reviewer", email: "reviewer-fixture@buildrik.local" } });
const rtoken = randomBytes(16).toString("hex");
await prisma.reviewRequest.create({ data: { siteId: SITE, requestedById: QA, status: "PENDING", token: rtoken,
  note: "baseline fixture review", changeSummary: "fixture", reviewerId: reviewer.id } }).catch(async (e) => {
  // reviewerId may not exist as a column name — retry minimal
  await prisma.reviewRequest.create({ data: { siteId: SITE, requestedById: QA, status: "PENDING", token: rtoken } });
});
console.log(JSON.stringify({ share, review: rtoken }));
await prisma.$disconnect();
