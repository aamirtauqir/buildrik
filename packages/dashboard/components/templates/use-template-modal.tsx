"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Globe, Plus, LayoutGrid } from "lucide-react";
import { trpc } from "@lib/trpc/client";
import { useToast } from "@/components/dashboard/toast-provider";
import { Button, Modal } from "@/components/dashboard/primitives";
import { getEditorHref, useUnifiedEditorFlag } from "@/components/editor-route/unified-flag";

interface UseTemplateModalProps {
  templateId: string;
  templateName: string;
  open: boolean;
  onClose: () => void;
}

type Step = "choose" | "new" | "pick-existing" | "confirm-existing";

function toTitleCase(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

/**
 * The unified "use this template" flow. A template can go two ways and this is
 * the one place that offers the choice:
 *   - New site: name it, create via templates.use.
 *   - Existing site: pick one of your sites, then a destructive confirm, apply
 *     via templates.applyToSite (replaces its pages).
 * Both land in the editor. Previously the template detail page could only spawn
 * a new site (auto-named after the template), and applying to an existing site
 * was reachable only from inside that site — the two halves were disconnected.
 */
export function UseTemplateModal({ templateId, templateName, open, onClose }: UseTemplateModalProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const unified = useUnifiedEditorFlag();

  const [step, setStep] = useState<Step>("choose");
  const [siteName, setSiteName] = useState(templateName);
  const [selected, setSelected] = useState<{ id: string; name: string } | null>(null);

  const sites = trpc.sites.list.useQuery(
    { page: 1, perPage: 50 },
    { enabled: open && (step === "pick-existing" || step === "confirm-existing"), staleTime: 30_000 },
  );

  function goEditor(siteId: string) {
    const href = getEditorHref(siteId, unified);
    handleClose();
    if (unified) router.push(href);
    else window.location.href = href;
  }

  const createMutation = trpc.templates.use.useMutation({
    onSuccess: (site) => { addToast("success", "Site created from template"); goEditor(site.id); },
    onError: (err) => addToast("error", "Couldn't create site", err.message),
  });

  const applyMutation = trpc.templates.applyToSite.useMutation({
    onSuccess: () => { addToast("success", "Template applied"); if (selected) goEditor(selected.id); },
    onError: (err) => addToast("error", "Couldn't apply template", err.message),
  });

  function handleClose() {
    setStep("choose");
    setSiteName(templateName);
    setSelected(null);
    onClose();
  }

  const siteItems = sites.data?.data ?? [];
  const busy = createMutation.isPending || applyMutation.isPending;

  const title =
    step === "new" ? "Name your new site"
    : step === "pick-existing" ? "Choose a site to apply to"
    : step === "confirm-existing" ? "Replace all pages?"
    : "Use this template";

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={title}
      width={step === "confirm-existing" ? 460 : 540}
      footer={
        step === "choose" ? (
          <Button variant="ghost" onClick={handleClose}>Cancel</Button>
        ) : step === "new" ? (
          <>
            <Button variant="ghost" onClick={() => setStep("choose")} disabled={busy}>Back</Button>
            <Button
              onClick={() => createMutation.mutate({ templateId, siteName: siteName.trim() })}
              disabled={busy || siteName.trim().length < 2}
            >
              {createMutation.isPending ? "Creating…" : "Create site"}
            </Button>
          </>
        ) : step === "pick-existing" ? (
          <Button variant="ghost" onClick={() => setStep("choose")} disabled={busy}>Back</Button>
        ) : (
          <>
            <Button variant="ghost" onClick={() => setStep("pick-existing")} disabled={busy}>Back</Button>
            <Button
              variant="danger"
              onClick={() => selected && applyMutation.mutate({ siteId: selected.id, templateId })}
              disabled={busy}
            >
              {applyMutation.isPending ? "Applying…" : "Replace pages"}
            </Button>
          </>
        )
      }
    >
      {/* Step 1 — new vs existing */}
      {step === "choose" && (
        <div className="space-y-2.5">
          <p className="mb-1 text-body" style={{ color: "var(--color-text-secondary)" }}>
            Apply <span className="font-semibold" style={{ color: "var(--color-text-primary)" }}>{templateName}</span> to:
          </p>
          <button
            type="button"
            onClick={() => setStep("new")}
            className="group flex w-full items-center gap-3 rounded-lg border px-3.5 py-3 text-left transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-bg-subtle)]"
            style={{ borderColor: "var(--color-border-default)" }}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md" style={{ backgroundColor: "var(--color-accent-subtle, var(--color-bg-subtle))", color: "var(--color-primary)" }}>
              <Plus className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-body font-semibold" style={{ color: "var(--color-text-primary)" }}>A new site</span>
              <span className="block text-body-sm" style={{ color: "var(--color-text-muted)" }}>Create a fresh site from this template.</span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 opacity-40 group-hover:opacity-100" style={{ color: "var(--color-text-secondary)" }} />
          </button>
          <button
            type="button"
            onClick={() => setStep("pick-existing")}
            className="group flex w-full items-center gap-3 rounded-lg border px-3.5 py-3 text-left transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-bg-subtle)]"
            style={{ borderColor: "var(--color-border-default)" }}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md" style={{ backgroundColor: "var(--color-bg-subtle)", color: "var(--color-text-muted)" }}>
              <LayoutGrid className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-body font-semibold" style={{ color: "var(--color-text-primary)" }}>An existing site</span>
              <span className="block text-body-sm" style={{ color: "var(--color-text-muted)" }}>Replace a site&apos;s pages with this template.</span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 opacity-40 group-hover:opacity-100" style={{ color: "var(--color-text-secondary)" }} />
          </button>
        </div>
      )}

      {/* Step 2a — name the new site */}
      {step === "new" && (
        <div>
          <label className="mb-1.5 block text-body-sm font-medium" style={{ color: "var(--color-text-primary)" }}>Site name</label>
          <input
            autoFocus
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
            maxLength={100}
            placeholder="My site"
            className="w-full rounded-lg border px-3 py-2.5 text-body outline-none transition-colors focus:border-[var(--color-primary)]"
            style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-primary)" }}
            onKeyDown={(e) => { if (e.key === "Enter" && siteName.trim().length >= 2 && !busy) createMutation.mutate({ templateId, siteName: siteName.trim() }); }}
          />
          <p className="mt-1.5 text-body-sm" style={{ color: "var(--color-text-muted)" }}>You can rename it later. 2–100 characters.</p>
        </div>
      )}

      {/* Step 2b — pick an existing site */}
      {step === "pick-existing" && (
        <div>
          <p className="mb-3 text-body" style={{ color: "var(--color-text-secondary)" }}>
            Pick a site to apply <span className="font-semibold" style={{ color: "var(--color-text-primary)" }}>{templateName}</span> to. This replaces its pages.
          </p>
          {sites.isLoading ? (
            <div className="py-8 text-center text-body" style={{ color: "var(--color-text-muted)" }}>Loading your sites…</div>
          ) : sites.isError ? (
            <div className="py-8 text-center text-body" style={{ color: "var(--color-text-muted)" }}>
              Couldn&apos;t load your sites. <button type="button" onClick={() => sites.refetch()} className="underline" style={{ color: "var(--color-primary)" }}>Retry</button>
            </div>
          ) : siteItems.length === 0 ? (
            <div className="py-8 text-center text-body" style={{ color: "var(--color-text-muted)" }}>No sites yet — create a new one instead.</div>
          ) : (
            <div className="max-h-[360px] space-y-1.5 overflow-y-auto pr-1">
              {siteItems.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => { setSelected({ id: s.id, name: s.name }); setStep("confirm-existing"); }}
                  className="group flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-bg-subtle)]"
                  style={{ borderColor: "var(--color-border-default)" }}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md" style={{ backgroundColor: "var(--color-bg-subtle)", color: "var(--color-text-muted)" }}>
                    <Globe className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-body font-semibold" style={{ color: "var(--color-text-primary)" }}>{s.name}</span>
                    <span className="mt-0.5 block text-body-sm" style={{ color: "var(--color-text-muted)" }}>{toTitleCase(s.status)}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" style={{ color: "var(--color-text-secondary)" }} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 3 — destructive confirm for existing site */}
      {step === "confirm-existing" && selected && (
        <div>
          <p className="text-body" style={{ color: "var(--color-text-secondary)" }}>
            This replaces <span className="font-semibold" style={{ color: "var(--color-text-primary)" }}>all pages</span> of{" "}
            <span className="font-semibold" style={{ color: "var(--color-text-primary)" }}>{selected.name}</span> with the pages from{" "}
            <span className="font-semibold" style={{ color: "var(--color-text-primary)" }}>{templateName}</span>.
          </p>
          <div
            className="mt-4 rounded-lg border px-3.5 py-3 text-body-sm"
            style={{ borderColor: "var(--color-error)", backgroundColor: "color-mix(in srgb, var(--color-error) 8%, white)", color: "var(--color-error-text)" }}
          >
            This can&apos;t be undone. The site&apos;s current pages and their content are permanently removed.
          </div>
        </div>
      )}
    </Modal>
  );
}
