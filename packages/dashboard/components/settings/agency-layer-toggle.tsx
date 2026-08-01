"use client";

import { ToggleSwitch } from "flowbite-react";
import { trpc } from "@lib/trpc/client";
import { useToast } from "@/components/dashboard/toast-provider";
import { SectionCard } from "@/components/dashboard/primitives";

/**
 * The runtime switch for the whole agency layer. `features.set` (ADMIN-gated,
 * one DB upsert) is the only way to flip `agency_layer`, and until this component
 * existed nothing called it — the flag could only be changed by a direct DB
 * write. Flipping it on unlocks Clients, client Reviews, and Shared-theme / brand
 * push in one move; the server enforces ADMIN, so a non-admin toggle fails
 * cleanly with a toast rather than being hidden.
 */
export function AgencyLayerToggle() {
  const { addToast } = useToast();
  const features = trpc.features.list.useQuery(undefined, { staleTime: 60_000 });
  const setFeature = trpc.features.set.useMutation({
    onSuccess: () => {
      features.refetch();
      addToast("success", "Agency layer updated");
    },
    onError: (err) =>
      addToast(
        "error",
        err.data?.code === "FORBIDDEN" ? "Only workspace admins can change this" : "Couldn't update",
        err.message,
      ),
  });

  const enabled = !!features.data?.agency_layer;
  // isFetching (not isLoading) keeps the switch disabled through the post-success
  // refetch, so it can't be clicked again while `enabled` still reads the stale
  // cache. A failed list read must not render as a clickable "Disabled" — that
  // would let a click flip a flag whose real state we never loaded.
  const loadFailed = features.isError;
  const busy = setFeature.isPending || features.isFetching || loadFailed;

  return (
    <SectionCard title="Agency layer">
      <p className="text-body-sm mb-4" style={{ color: "var(--color-text-secondary)" }}>
        Turns on the client-facing side of the workspace: <strong>Clients</strong>, client{" "}
        <strong>Reviews &amp; sign-off</strong>, and <strong>Shared-theme / brand push</strong>. Off by
        default. Existing client review links keep working even if this is later switched off.
      </p>
      <div className="flex items-center gap-3">
        <ToggleSwitch
          checked={enabled}
          disabled={busy}
          onChange={(next) => setFeature.mutate({ key: "agency_layer", enabled: next })}
          aria-label="Agency layer"
        />
        <span className="text-body" style={{ color: loadFailed ? "var(--color-error-text)" : "var(--color-text-primary)" }}>
          {loadFailed
            ? "Couldn't load — reload the page"
            : enabled
              ? "Enabled for this workspace"
              : "Disabled"}
        </span>
      </div>
    </SectionCard>
  );
}
