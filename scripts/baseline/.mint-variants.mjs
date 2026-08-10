import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const WS="cmpa9oi4n0001wrjuvh7j2h8m";
const mode = process.argv[2];
if (mode === "pastdue") {
  await prisma.subscription.upsert({ where: { workspaceId: WS },
    update: { status: "PAST_DUE", plan: "PRO" },
    create: { workspaceId: WS, status: "PAST_DUE", plan: "PRO", stripeSubscriptionId: "sub_baseline_fixture", stripeCurrentPeriodStart: new Date("2026-07-08T00:00:00Z"), stripeCurrentPeriodEnd: new Date("2026-08-08T00:00:00Z"), stripePriceId: "price_baseline_fixture", interval: "MONTHLY", price: 2900 } });
  await prisma.workspace.update({ where: { id: WS }, data: { plan: "PRO" } });
  console.log("PAST_DUE set");
} else if (mode === "revert") {
  await prisma.subscription.deleteMany({ where: { workspaceId: WS } });
  await prisma.workspace.update({ where: { id: WS }, data: { plan: "FREE" } });
  console.log("reverted to FREE");
} else if (mode === "viewer") {
  const u = await prisma.user.upsert({ where: { email: "viewer-fixture@buildrik.local" },
    update: {}, create: { email: "viewer-fixture@buildrik.local", fullName: "Viewer Fixture", emailVerified: new Date() } });
  await prisma.workspaceMember.upsert({
    where: { userId_workspaceId: { userId: u.id, workspaceId: WS } },
    update: { role: "VIEWER", status: "ACTIVE" },
    create: { userId: u.id, workspaceId: WS, role: "VIEWER", status: "ACTIVE" } });
  console.log(u.id);
}
await prisma.$disconnect();
