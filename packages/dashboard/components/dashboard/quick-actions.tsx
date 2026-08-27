"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, UserPlus, LayoutTemplate } from "lucide-react";
import { trpc } from "@lib/trpc/client";
import { CreateSiteModal } from "@/components/sites/create-site-modal";
import { Button, ButtonLink } from "@/components/dashboard/primitives";
import { useToast } from "@/components/dashboard/toast-provider";

// Fixed destinations, reusing the hrefs the dynamic quick-action list already
// pointed at (team invite, template start). "Create a site" opens the create
// dialog rather than navigating, per the design.
const ACTIONS = [
  { label: "Invite teammate", href: "/dashboard/settings/team", icon: UserPlus },
  { label: "Browse templates", href: "/dashboard/templates", icon: LayoutTemplate },
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
      {/* Was a hand-rolled button: 42px tall, 13.5px/600, its own hover colour —
          while "New site" on the Sites screen (the same action) came out of the
          Button primitive at 40px/14px/500. Two shapes for one action. */}
      <Button onClick={() => setCreateOpen(true)} className="tw:justify-start gap-[9px]">
        <Plus className="h-4 w-4" strokeWidth={2} /> Create a site
      </Button>

      {ACTIONS.map((action) => {
        const Icon = action.icon;
        return (
          <ButtonLink
            key={action.label}
            href={action.href}
            variant="ghost"
            className="tw:justify-start gap-[9px]"
          >
            <Icon className="h-4 w-4" strokeWidth={2} /> {action.label}
          </ButtonLink>
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
