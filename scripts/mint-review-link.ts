/**
 * Mint a live review link for walking `/review/<token>` by hand.
 *   npx tsx scripts/mint-review-link.ts
 *
 * Deliberately hits the real database and the real service. A mocked token
 * proves the page renders; it does not prove the service, the router and the
 * schema agree — which is the seam this loop has already been wrong at once.
 */
import { prisma } from "@/lib/prisma";
import { issueReviewToken } from "@/server/services/client-review.service";

async function main() {
  const site = await prisma.site.findFirst({ select: { id: true, name: true } });
  if (!site) throw new Error("No site in the database to review.");

  // requestedById is the DESIGNER who sent it — required, because a review with
  // no sender has nobody to send the client's answer back to.
  const sender = await prisma.user.findFirst({ select: { id: true, email: true } });
  if (!sender) throw new Error("No user in the database to send the review.");

  const existing = await prisma.reviewRequest.findFirst({
    where: { siteId: site.id, status: "PENDING" },
    select: { id: true },
  });
  const review =
    existing ??
    (await prisma.reviewRequest.create({
      data: {
        siteId: site.id,
        requestedById: sender.id,
        status: "PENDING",
        changeSummary: "New hero copy, updated opening hours, two photos swapped.",
      },
      select: { id: true },
    }));

  const issued = await issueReviewToken(review.id, "client@example.com");
  console.log(
    JSON.stringify(
      {
        site: site.name,
        sentBy: sender.email,
        reviewId: review.id,
        invitedEmail: issued.invitedEmail,
        url: `http://localhost:3000/review/${issued.token}`,
      },
      null,
      2,
    ),
  );
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
