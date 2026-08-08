import { PrismaClient } from "@prisma/client";
import { generateToken } from "@/server/services/token.service";
import { randomBytes } from "crypto";
async function main() {
  const prisma = new PrismaClient();
  const USER = "cmpa9ohx10000wrjux4ecumzo", WS = "cmpa9oi4n0001wrjuvh7j2h8m";
  const magic = await generateToken("magic_link", USER, 30);
  const reset = await generateToken("password_reset", USER, 60);
  const verify = await generateToken("email_verify", USER, 60);
  const invToken = randomBytes(24).toString("hex");
  await prisma.invite.create({ data: {
    workspaceId: WS, email: "invited-fixture@buildrik.local", role: "EDITOR",
    token: invToken, status: "PENDING", invitedBy: USER, siteIds: [],
    expiresAt: new Date(Date.now() + 3600_000),
  }});
  console.log(JSON.stringify({ magic, reset, verify, invite: invToken }));
  await prisma.$disconnect();
}
main();
