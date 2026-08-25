/**
 * The Partner route is closed, deliberately.
 *
 * `partner-view.tsx` beside this file is the built UI — commission tiers,
 * MRR-influenced stats, a tier progress bar and a "Get referral link" button.
 * It reads `prisma.referral` via `partner.service.ts:31`, which is the ONLY
 * consumer of that table in the repo: nothing writes a `Referral` row, and
 * nothing anywhere reads the `?ref=` parameter the button hands out. The
 * service says so itself — "Default thresholds — adjust when the commercial
 * program is finalized" (`partner.service.ts:22-23`).
 *
 * So the page showed every user a revenue-share program that cannot pay, with
 * $0 stats that could never be anything else. The code is kept; the door is
 * shut until the program exists. Restore by making this file re-export
 * `partner-view` and putting the tab back in `agency-tabs.tsx`.
 */
import { redirect } from "next/navigation";

export default function PartnerPage() {
  redirect("/dashboard/agency");
}
