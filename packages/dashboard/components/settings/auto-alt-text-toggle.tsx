"use client";

import { ToggleSwitch } from "flowbite-react";
import { trpc } from "@lib/trpc/client";
import { useToast } from "@/components/dashboard/toast-provider";
import { SectionCard } from "@/components/dashboard/primitives";

/**
 * L4-007 (owner, 2026-10-10): automatic alt text on image upload is a paid AI
 * call, so it is a workspace opt-in — the `auto_alt_text` flag, OFF by default.
 * The server holds the upload hook's request to it; the on-demand Generate in
 * the media library is unaffected. ADMIN-gated by `features.set`.
 */
export function AutoAltTextToggle() {
  const { addToast } = useToast();
  const features = trpc.features.list.useQuery(undefined, { staleTime: 60_000 });
  const setFeature = trpc.features.set.useMutation({
    onSuccess: () => {
      features.refetch();
      addToast("success", "Automatic alt text updated");
    },
    onError: (err) =>
      addToast(
        "error",
        err.data?.code === "FORBIDDEN" ? "Only workspace admins can change this" : "Couldn't update",
        err.message,
      ),
  });

  const enabled = !!features.data?.auto_alt_text;
  // Same rule as the agency-layer switch: a failed read is not a clickable Off.
  const loadFailed = features.isError;
  const busy = setFeature.isPending || features.isFetching || loadFailed;

  return (
    <SectionCard title="Automatic alt text">
      <p className="text-body-sm mb-4" style={{ color: "var(--color-text-secondary)" }}>
        Describe every uploaded image with AI as soon as it lands. Each image uses 1 AI credit from the
        uploader&apos;s daily limit, once per image. It never replaces alt text someone typed, and images marked
        decorative keep their empty alt. Generate in the media library works either way.
      </p>
      <div className="flex items-center gap-3">
        <ToggleSwitch
          checked={enabled}
          disabled={busy}
          onChange={(next) => setFeature.mutate({ key: "auto_alt_text", enabled: next })}
          aria-label="Automatic alt text"
        />
        <span className="text-body" style={{ color: loadFailed ? "var(--color-error-text)" : "var(--color-text-primary)" }}>
          {loadFailed ? "Couldn't load — reload the page" : enabled ? "On for this workspace" : "Off"}
        </span>
      </div>
    </SectionCard>
  );
}
