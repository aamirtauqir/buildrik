/**
 * Live smoke for the client sign-off loop — run against a real database.
 *   npx tsx scripts/smoke-client-review.ts
 *
 * Exists because every unit test of this path would mock the token lookup,
 * and the token lookup IS the security boundary. It creates a review, walks
 * a client through identify → comment → approve, checks that every dead-link
 * case fails closed, and cleans up after itself.
 */
import { prisma } from "@/lib/prisma";
import {
  issueReviewToken, getReviewByToken, identifyReviewer,
  createClientComment, listClientComments, resolveReviewByToken,
  revokeReviewToken, ClientReviewError,
} from "@/server/services/client-review.service";

const ok = (m: string) => console.log(`  ✅ ${m}`);
const bad = (m: string) => { console.error(`  ❌ ${m}`); process.exitCode = 1; };

async function expectFail(code: string, label: string, fn: () => Promise<unknown>) {
  try { await fn(); bad(`${label} — should have thrown ${code}`); }
  catch (e) {
    if (e instanceof ClientReviewError && e.code === code) ok(`${label} → ${code}`);
    else bad(`${label} — threw ${(e as Error).message}`);
  }
}

async function main() {
  const site = await prisma.site.findFirst({ select: { id: true, name: true, workspaceId: true } });
  if (!site) { console.error("no site to test against"); return; }
  const user = await prisma.user.findFirst({ select: { id: true } });
  console.log(`site: ${site.name}\n`);

  const review = await prisma.reviewRequest.create({
    data: { siteId: site.id, requestedById: user!.id, status: "PENDING", changeSummary: "smoke" },
  });

  // 1. token — issued against the address the link was sent to
  const { token } = await issueReviewToken(review.id, "sara@bella.test");
  token && token.length >= 40 ? ok(`token minted (${token.length} chars)`) : bad("token too short");

  // 2. load before identity
  const before = await getReviewByToken(token!);
  before.reviewer === null ? ok("loads before identity, reviewer null") : bad("reviewer not null");
  before.siteName === site.name ? ok("resolves to the right site") : bad("wrong site");

  // 3. comment before identity must fail
  await expectFail("NOT_IDENTIFIED", "comment before identity", () =>
    createClientComment(token!, { body: "too early" }));
  await expectFail("NOT_IDENTIFIED", "approve before identity", () =>
    resolveReviewByToken(token!, "APPROVED"));

  // 3b. ATTACK: read comments without identifying.
  //     Before the fix this returned every comment on the site, internal ones
  //     included, because `reviewerId ?? undefined` made Prisma drop the filter.
  const internal = await prisma.comment.create({
    data: { siteId: site.id, authorId: user!.id, body: "INTERNAL: do not show the client", status: "OPEN" },
  });
  await expectFail("NOT_IDENTIFIED", "list comments without identifying", () =>
    listClientComments(token!));

  // 3c. ATTACK: sign as someone the link was never sent to.
  await expectFail("EMAIL_MISMATCH", "identify with a different address", () =>
    identifyReviewer(token!, "Mallory", "mallory@evil.test"));

  // 4. identify
  const sara = await identifyReviewer(token!, "  Sara Khan ", "  SARA@Bella.test ");
  sara.email === "sara@bella.test" ? ok("email normalised + trimmed") : bad(`email = ${sara.email}`);
  sara.name === "Sara Khan" ? ok("name trimmed") : bad(`name = "${sara.name}"`);

  // 5. same person on a NEW token (the re-send case)
  const round2 = await issueReviewToken(review.id, "sara@bella.test");
  const sara2 = await identifyReviewer(round2.token!, "Sara Khan", "sara@bella.test");
  sara2.id === sara.id ? ok("round 2 recognises the same reviewer") : bad("duplicate reviewer created");
  await expectFail("INVALID_TOKEN", "round 1 token is dead after re-send", () =>
    getReviewByToken(token!));

  // 6. client comment — authorId must be null, reviewerId set
  const c = await createClientComment(round2.token!, { body: "hero too dark", x: 0.4, y: 0.2 });
  const row = await prisma.comment.findUnique({
    where: { id: c.id }, select: { authorId: true, reviewerId: true },
  });
  row?.authorId === null && row?.reviewerId === sara.id
    ? ok("comment authored by reviewer, authorId null")
    : bad(`authorId=${row?.authorId} reviewerId=${row?.reviewerId}`);
  (await listClientComments(round2.token!)).length === 1 ? ok("client sees their comment") : bad("comment list wrong");

  // 7. approve
  const done = await resolveReviewByToken(round2.token!, "APPROVED");
  done.status === "APPROVED" ? ok("client approved") : bad(`status = ${done.status}`);
  await expectFail("ALREADY_RESOLVED", "double approve", () =>
    resolveReviewByToken(round2.token!, "APPROVED"));

  // 7b. the client sees ONLY their own comments, never the internal one
  const visible = await listClientComments(round2.token!);
  visible.some((c) => c.body.startsWith("INTERNAL:"))
    ? bad("internal comment leaked to the client")
    : ok("internal comment not visible to the client");

  // 8. revoke
  const r3 = await issueReviewToken(review.id, "sara@bella.test");
  await revokeReviewToken(site.workspaceId, review.id);
  await expectFail("REVOKED", "revoked token", () => getReviewByToken(r3.token!));

  // 9. expiry
  const r4 = await issueReviewToken(review.id, "sara@bella.test");
  await prisma.reviewRequest.update({
    where: { id: review.id }, data: { expiresAt: new Date(Date.now() - 1000), revokedAt: null },
  });
  await expectFail("EXPIRED", "expired token", () => getReviewByToken(r4.token!));

  // 10. garbage
  await expectFail("INVALID_TOKEN", "unknown token", () => getReviewByToken("not-a-real-token-xxxxxxxxxxxxx"));

  // 11. a review with no invited address: nobody may sign it
  const uninvited = await prisma.reviewRequest.create({
    data: { siteId: site.id, requestedById: user!.id, status: "PENDING" },
  });
  const ut = await issueReviewToken(uninvited.id);
  await expectFail("NOT_INVITED", "sign a link sent to nobody", () =>
    identifyReviewer(ut.token!, "Anyone", "anyone@test.test"));
  await prisma.reviewRequest.delete({ where: { id: uninvited.id } });

  // cleanup
  await prisma.comment.delete({ where: { id: internal.id } });
  await prisma.comment.deleteMany({ where: { reviewerId: sara.id } });
  await prisma.reviewRequest.delete({ where: { id: review.id } });
  await prisma.reviewer.delete({ where: { id: sara.id } });
  console.log("\n  cleaned up");
}
main().finally(() => prisma.$disconnect());
