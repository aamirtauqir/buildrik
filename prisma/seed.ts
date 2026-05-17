import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const QA_EMAIL = "qa@buildrik.local";
const QA_PASSWORD = "qa-test-1234";

async function main() {
  const passwordHash = await bcrypt.hash(QA_PASSWORD, 10);

  const user = await prisma.user.upsert({
    where: { email: QA_EMAIL },
    update: { passwordHash, emailVerified: new Date() },
    create: {
      email: QA_EMAIL,
      fullName: "QA Tester",
      displayName: "qa",
      passwordHash,
      emailVerified: new Date(),
      provider: "email",
    },
  });

  const workspace = await prisma.workspace.upsert({
    where: { slug: "qa-workspace" },
    update: {},
    create: {
      name: "QA Workspace",
      slug: "qa-workspace",
      ownerId: user.id,
      plan: "FREE",
    },
  });

  await prisma.workspaceMember.upsert({
    where: { userId_workspaceId: { userId: user.id, workspaceId: workspace.id } },
    update: { role: "OWNER", status: "ACTIVE" },
    create: {
      userId: user.id,
      workspaceId: workspace.id,
      role: "OWNER",
      status: "ACTIVE",
    },
  });

  console.log(`Seeded user ${QA_EMAIL} / ${QA_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
