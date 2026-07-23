import { prisma } from "@/lib/prisma";

/**
 * Agency handover (P6) — the launch-checklist rollup. For every site in the
 * workspace, condenses the four things an agency checks before handing a site
 * to a client into one glanceable status: a domain, forms that actually go
 * somewhere, client approval, and publish state. Every input is already
 * queryable today (Domain, FormBlock, ReviewRequest, Site publish fields) — this
 * is a read-only aggregation, not a new source of truth.
 *
 * A site is `ready` when nothing blocks handover: published, client-approved,
 * no form left dangling. Domain is surfaced but not a blocker — plenty of sites
 * launch on a *.buildrik URL, so a missing custom domain is information, not a
 * red flag.
 */

export type HandoverItemStatus = "ok" | "pending" | "warning" | "na";
export type HandoverItemKey = "domain" | "forms" | "approval" | "publish";

export interface HandoverItem {
  key: HandoverItemKey;
  status: HandoverItemStatus;
  label: string;
}

export interface HandoverSite {
  siteId: string;
  siteName: string;
  items: HandoverItem[];
  ready: boolean;
}

type DomainRow = { status: string; isPrimary: boolean };
type FormRow = { notifyEmail: string | null; webhookUrl: string | null };

function domainItem(domains: DomainRow[], publishedUrl: string | null): HandoverItem {
  const active = domains.find((d) => d.status === "ACTIVE");
  if (active) return { key: "domain", status: "ok", label: "Custom domain live" };
  if (publishedUrl) return { key: "domain", status: "pending", label: "On a Buildrik URL — no custom domain" };
  return { key: "domain", status: "pending", label: "No domain yet" };
}

function formsItem(forms: FormRow[]): HandoverItem {
  if (forms.length === 0) return { key: "forms", status: "na", label: "No forms" };
  const dangling = forms.filter((f) => !f.notifyEmail && !f.webhookUrl).length;
  if (dangling > 0) {
    return { key: "forms", status: "warning", label: `${dangling} form${dangling === 1 ? "" : "s"} with no destination` };
  }
  return { key: "forms", status: "ok", label: "Forms send somewhere" };
}

function approvalItem(status: string | undefined): HandoverItem {
  if (status === "APPROVED") return { key: "approval", status: "ok", label: "Client approved" };
  if (status === "PENDING") return { key: "approval", status: "pending", label: "Awaiting client sign-off" };
  if (status === "CHANGES_REQUESTED") return { key: "approval", status: "pending", label: "Changes requested" };
  return { key: "approval", status: "pending", label: "Not sent for review" };
}

function publishItem(status: string, lastPublishError: string | null): HandoverItem {
  if (status === "PUBLISHED") return { key: "publish", status: "ok", label: "Published" };
  if (lastPublishError) return { key: "publish", status: "warning", label: "Last publish failed" };
  return { key: "publish", status: "pending", label: "Not published" };
}

export async function getHandoverRollup(workspaceId: string): Promise<HandoverSite[]> {
  const sites = await prisma.site.findMany({
    where: { workspaceId, deletedAt: null },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      status: true,
      lastPublishError: true,
      publishedUrl: true,
      domains: { select: { status: true, isPrimary: true } },
      formBlocks: { where: { isActive: true }, select: { notifyEmail: true, webhookUrl: true } },
      reviewRequests: { orderBy: { createdAt: "desc" }, take: 1, select: { status: true } },
    },
  });

  return sites.map((s) => {
    const items: HandoverItem[] = [
      domainItem(s.domains, s.publishedUrl),
      formsItem(s.formBlocks),
      approvalItem(s.reviewRequests[0]?.status),
      publishItem(s.status, s.lastPublishError),
    ];
    // Ready = nothing blocks handover. A pending DOMAIN is informational (a
    // Buildrik URL is a valid launch), so it never blocks; everything else must
    // be resolved (ok or na).
    const ready = items.every(
      (i) => i.status === "ok" || i.status === "na" || (i.key === "domain" && i.status === "pending"),
    );
    return { siteId: s.id, siteName: s.name, items, ready };
  });
}
