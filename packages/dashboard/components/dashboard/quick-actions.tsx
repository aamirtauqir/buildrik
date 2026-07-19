"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, UserPlus, LayoutTemplate } from "lucide-react";
import { trpc } from "@lib/trpc/client";
import { CreateSiteModal } from "@/components/sites/create-site-modal";
import { useToast } from "@/components/dashboard/toast-provider";

// Fixed destinations, reusing the hrefs the dynamic quick-action list already
// pointed at (team invite, template start). "Create a site" opens the create
// dialog rather than navigating, per the design.
const ACTIONS = [
  { label: "Invite teammate", href: "/dashboard/settings/team", icon: UserPlus },
  { label: "Browse templates", href: "/dashboard/sites/new?method=template", icon: LayoutTemplate },
];

export function QuickActions() {
  const [createOpen, setCreateOpen] = useState(false);
  const router = useRouter();
  const { addToast } = useToast();
  const utils = trpc.useUtils();

  // Same contract the Projects screen uses: a blank site is created inline,
  // the template and AI methods carry the name into the full flow.
  const createMutation = trpc.sites.create.useMutation({
    onSuccess: (site) => {
      setCreateOpen(false);
      void utils.dashboard.stats.invalidate();
      addToast("success", "Site created");
      router.push(`/dashboard/sites/${site.id}`);
    },
    onError: (e) => addToast("error", "Failed to create site", e.message),
  });

  return (
    <div className="flex flex-col gap-[9px]">
      <button
        type="button"
        onClick={() => setCreateOpen(true)}
        className="flex items-center gap-[9px] rounded-[9px] bg-[var(--color-primary)] px-[14px] py-[11px] text-[13.5px] font-semibold text-white transition-colors hover:bg-[var(--color-primary-hover)]"
      >
        <Plus className="h-4 w-4" strokeWidth={2} /> Create a site
      </button>

      {ACTIONS.map((action) => {
        const Icon = action.icon;
        return (
          <Link
            key={action.label}
            href={action.href}
            className="flex items-center gap-[9px] rounded-[9px] border px-[14px] py-[11px] text-[13.5px] font-semibold transition-colors hover:border-[var(--color-primary)]"
            style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-secondary)" }}
          >
            <Icon className="h-4 w-4" strokeWidth={2} /> {action.label}
          </Link>
        );
      })}

      <CreateSiteModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={(data) => {
          if (data.method === "blank") {
            createMutation.mutate({ name: data.name, method: "blank" });
          } else {
            setCreateOpen(false);
            router.push(`/dashboard/sites/new?method=${data.method}&name=${encodeURIComponent(data.name)}`);
          }
        }}
      />
    </div>
  );
}
