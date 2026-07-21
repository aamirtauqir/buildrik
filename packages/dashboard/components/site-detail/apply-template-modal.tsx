"use client";
import { useState } from "react";
import { ChevronRight, Globe } from "lucide-react";
import { trpc } from "@lib/trpc/client";
import { useToast } from "@/components/dashboard/toast-provider";
import { Button, Modal } from "@/components/dashboard/primitives";

interface ApplyTemplateModalProps {
  siteId: string;
  siteName: string;
  open: boolean;
  onClose: () => void;
}

function toTitleCase(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

/** Two-step apply-template flow: (1) pick a template, (2) a destructive confirm
 *  because applying REPLACES every page of the site. Only the confirm button is
 *  red (destructive); the picker stays on the single accent. */
export function ApplyTemplateModal({ siteId, siteName, open, onClose }: ApplyTemplateModalProps) {
  const { addToast } = useToast();
  const utils = trpc.useUtils();
  const [selected, setSelected] = useState<{ id: string; name: string } | null>(null);

  const list = trpc.templates.list.useQuery(
    { category: "ALL", page: 1, perPage: 20, sort: "popular", difficulty: "ALL" },
    { enabled: open, staleTime: 30_000 }
  );

  const applyMutation = trpc.templates.applyToSite.useMutation({
    onSuccess: () => {
      addToast("success", "Template applied");
      utils.sites.get.invalidate({ id: siteId });
      utils.pages.list.invalidate({ siteId });
      handleClose();
    },
    onError: (err) => addToast("error", "Couldn't apply template", err.message),
  });

  function handleClose() {
    setSelected(null);
    onClose();
  }

  const items = list.data?.data ?? [];

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={selected ? "Replace all pages?" : "Apply a template"}
      width={selected ? 460 : 560}
      footer={
        selected ? (
          <>
            <Button variant="ghost" onClick={() => setSelected(null)} disabled={applyMutation.isPending}>
              Back
            </Button>
            <Button
              variant="danger"
              disabled={applyMutation.isPending}
              onClick={() => applyMutation.mutate({ siteId, templateId: selected.id })}
            >
              {applyMutation.isPending ? "Applying…" : "Replace pages"}
            </Button>
          </>
        ) : (
          <Button variant="ghost" onClick={handleClose}>Cancel</Button>
        )
      }
    >
      {selected ? (
        <div>
          <p className="text-body" style={{ color: "var(--color-text-secondary)" }}>
            This replaces <span className="font-semibold" style={{ color: "var(--color-text-primary)" }}>all pages</span> of{" "}
            <span className="font-semibold" style={{ color: "var(--color-text-primary)" }}>{siteName}</span> with the pages
            from <span className="font-semibold" style={{ color: "var(--color-text-primary)" }}>{selected.name}</span>.
          </p>
          <div
            className="mt-4 rounded-lg border px-3.5 py-3 text-body-sm"
            style={{ borderColor: "var(--color-error)", backgroundColor: "color-mix(in srgb, var(--color-error) 8%, white)", color: "var(--color-error-text)" }}
          >
            This can&apos;t be undone. Your current pages and their content will be permanently removed.
          </div>
        </div>
      ) : (
        <div>
          <p className="mb-3 text-body" style={{ color: "var(--color-text-secondary)" }}>
            Pick a template to apply to <span className="font-semibold" style={{ color: "var(--color-text-primary)" }}>{siteName}</span>.
            This replaces the site&apos;s existing pages.
          </p>

          {list.isLoading ? (
            <div className="py-8 text-center text-body" style={{ color: "var(--color-text-muted)" }}>Loading templates…</div>
          ) : list.isError ? (
            <div className="py-8 text-center text-body" style={{ color: "var(--color-text-muted)" }}>
              Couldn&apos;t load templates. <button type="button" onClick={() => list.refetch()} className="underline" style={{ color: "var(--color-primary)" }}>Retry</button>
            </div>
          ) : items.length === 0 ? (
            <div className="py-8 text-center text-body" style={{ color: "var(--color-text-muted)" }}>No templates available.</div>
          ) : (
            <div className="max-h-[360px] space-y-1.5 overflow-y-auto pr-1">
              {items.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelected({ id: t.id, name: t.name })}
                  className="group flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-bg-subtle)]"
                  style={{ borderColor: "var(--color-border-default)" }}
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
                    style={{ backgroundColor: "var(--color-bg-subtle)", color: "var(--color-text-muted)" }}
                  >
                    <Globe className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-body font-semibold" style={{ color: "var(--color-text-primary)" }}>{t.name}</span>
                    <span className="mt-0.5 block text-body-sm" style={{ color: "var(--color-text-muted)" }}>
                      {toTitleCase(t.category)} · {toTitleCase(t.difficulty)}
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" style={{ color: "var(--color-text-secondary)" }} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
