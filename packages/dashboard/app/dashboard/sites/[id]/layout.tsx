"use client";

import { useParams } from "next/navigation";
import { trpc } from "@lib/trpc/client";
import { SiteHeader } from "@/components/site-detail/site-header";
import { TabNav } from "@/components/site-detail/tab-nav";
import { Breadcrumb } from "@/components/dashboard/breadcrumb";

export default function SiteDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const siteId = params.id as string;

  const siteQuery = trpc.sites.get.useQuery({ id: siteId });
  const site = siteQuery.data;

  if (siteQuery.isLoading) {
    return (
      <div>
        <div className="h-6 w-48 animate-pulse rounded" style={{ backgroundColor: "#F4F4F4" }} />
        <div className="mt-4 h-10 w-full animate-pulse rounded" style={{ backgroundColor: "#F4F4F4" }} />
        <div className="mt-6 h-64 animate-pulse rounded-xl" style={{ backgroundColor: "#F4F4F4" }} />
      </div>
    );
  }

  if (!site) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <p className="text-base font-semibold" style={{ color: "#0D0D0D" }}>
          Site not found
        </p>
        <p className="mt-1 text-sm" style={{ color: "#7A7A7A" }}>
          This site may have been deleted or you don&apos;t have access.
        </p>
      </div>
    );
  }

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "My Sites", href: "/dashboard/sites" },
          { label: site.name },
        ]}
      />
      <SiteHeader site={site} />
      <div className="mt-4">
        <TabNav siteId={siteId} />
      </div>
      <div className="mt-6">{children}</div>
    </div>
  );
}
