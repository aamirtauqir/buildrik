"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Globe, Plus, LayoutGrid } from "lucide-react";
import { trpc } from "@lib/trpc/client";
import { useToast } from "@/components/dashboard/toast-provider";
import { Button, Modal } from "@/components/dashboard/primitives";
import { getEditorHref, useUnifiedEditorFlag } from "@/components/editor-route/unified-flag";

/**
 * The one modal for connecting a template to a site, from either direction:
 *
 *  - From the template detail page (`templateId` given): choose a target —
 *    a NEW site (name it) or an EXISTING site (pick one → confirm → replace).
 *  - From a site's detail page (`siteId` given): pick a template to apply to
 *    THAT site → confirm → replace.
 *
 * Both directions share the destructive confirm and `templates.applyToSite`
 * call, and both land in the editor. This replaces the old site-only
 * ApplyTemplateModal so there's a single component for the whole job.
 */
type UseTemplateModalProps =
  & { open: boolean; onClose: () => void }
  & (
      | { templateId: string; templateName: string; siteId?: undefined; siteName?: undefined }
      | { siteId: string; siteName: string; templateId?: undefined; templateName?: undefined }
    );

type Step = "choose" | "new" | "pick-existing" | "pick-template" | "confirm";

function toTitleCase(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

export function UseTemplateModal(props: UseTemplateModalProps) {
  const { open, onClose } = props;
  const fromSite = props.siteId != null;
  const router = useRouter();
  const { addToast } = useToast();
  const unified = useUnifiedEditorFlag();

  // From a site, we start straight at the template picker; from a template, at
  // the new-vs-existing chooser.
  const [step, setStep] = useState<Step>(fromSite ? "pick-template" : "choose");
  const [siteName, setSiteName] = useState(props.templateName ?? "");
  // The chosen target site (from-template existing path) or the chosen template
  // (from-site path) — both feed the single confirm step.
  const [targetSite, setTargetSite] = useState<{ id: string; name: string } | null>(null);
  const [chosenTemplate, setChosenTemplate] = useState<{ id: string; name: string } | null>(null);

  // Which template + which site the confirm/apply resolves to.
  const applyTemplateId = fromSite ? chosenTemplate?.id : props.templateId;
  const applyTemplateName = fromSite ? chosenTemplate?.name : props.templateName;
  const applySiteId = fromSite ? props.siteId : targetSite?.id;
  const applySiteName = fromSite ? props.siteName : targetSite?.name;

  const sites = trpc.sites.list.useQuery(
    { page: 1, perPage: 50 },
    { enabled: open && !fromSite && step === "pick-existing", staleTime: 30_000 },
  );
  const templates = trpc.templates.list.useQuery(
    { category: "ALL", page: 1, perPage: 20, sort: "popular", difficulty: "ALL" },
    { enabled: open && fromSite && step === "pick-template", staleTime: 30_000 },
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
    onSuccess: () => { addToast("success", "Template applied"); if (applySiteId) goEditor(applySiteId); },
    onError: (err) => addToast("error", "Couldn't apply template", err.message),
  });

  function handleClose() {
    setStep(fromSite ? "pick-template" : "choose");
    setSiteName(props.templateName ?? "");
    setTargetSite(null);
    setChosenTemplate(null);
    onClose();
  }

  const siteItems = sites.data?.data ?? [];
  const templateItems = templates.data?.data ?? [];
  const busy = createMutation.isPending || applyMutation.isPending;

  const title =
    step === "new" ? "Name your new site"
    : step === "pick-existing" ? "Choose a site to apply to"
    : step === "pick-template" ? "Apply a template"
    : step === "confirm" ? "Replace all pages?"
    : "Use this template";

  // Where "Back" returns to depends on how we arrived at confirm/pick.
  const backFromConfirm = () => setStep(fromSite ? "pick-template" : "pick-existing");

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={title}
      width={step === "confirm" ? 460 : 540}
      footer={
        step === "choose" ? (
          <Button variant="ghost" onClick={handleClose}>Cancel</Button>
        ) : step === "new" ? (
          <>
            <Button variant="ghost" onClick={() => setStep("choose")} disabled={busy}>Back</Button>
            <Button
              onClick={() => props.templateId && createMutation.mutate({ templateId: props.templateId, siteName: siteName.trim() })}
              disabled={busy || siteName.trim().length < 2}
            >
              {createMutation.isPending ? "Creating…" : "Create site"}
            </Button>
          </>
        ) : step === "pick-existing" ? (
          <Button variant="ghost" onClick={() => setStep("choose")} disabled={busy}>Back</Button>
        ) : step === "pick-template" ? (
          fromSite ? <Button variant="ghost" onClick={handleClose} disabled={busy}>Cancel</Button> : null
        ) : (
          <>
            <Button variant="ghost" onClick={backFromConfirm} disabled={busy}>Back</Button>
            <Button
              variant="danger"
              onClick={() => applyTemplateId && applySiteId && applyMutation.mutate({ siteId: applySiteId, templateId: applyTemplateId })}
              disabled={busy}
            >
              {applyMutation.isPending ? "Applying…" : "Replace pages"}
            </Button>
          </>
        )
      }
    >
      {/* Step: new vs existing (from a template) */}
      {step === "choose" && (
        <div className="space-y-2.5">
          <p className="mb-1 text-body" style={{ color: "var(--color-text-secondary)" }}>
            Apply <span className="font-semibold" style={{ color: "var(--color-text-primary)" }}>{props.templateName}</span> to:
          </p>
          <button
            type="button"
            onClick={() => setStep("new")}
            className="group flex w-full items-center gap-3 rounded-lg border px-3.5 py-3 text-left transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-bg-subtle)]"
            style={{ borderColor: "var(--color-border-default)" }}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md" style={{ backgroundColor: "var(--color-bg-subtle)", color: "var(--color-primary)" }}>
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

      {/* Step: name the new site (from a template) */}
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
            onKeyDown={(e) => { if (e.key === "Enter" && siteName.trim().length >= 2 && !busy && props.templateId) createMutation.mutate({ templateId: props.templateId, siteName: siteName.trim() }); }}
          />
          <p className="mt-1.5 text-body-sm" style={{ color: "var(--color-text-muted)" }}>You can rename it later. 2–100 characters.</p>
        </div>
      )}

      {/* Step: pick an existing site (from a template) */}
      {step === "pick-existing" && (
        <div>
          <p className="mb-3 text-body" style={{ color: "var(--color-text-secondary)" }}>
            Pick a site to apply <span className="font-semibold" style={{ color: "var(--color-text-primary)" }}>{props.templateName}</span> to. This replaces its pages.
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
                  onClick={() => { setTargetSite({ id: s.id, name: s.name }); setStep("confirm"); }}
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

      {/* Step: pick a template (from a site) */}
      {step === "pick-template" && (
        <div>
          <p className="mb-3 text-body" style={{ color: "var(--color-text-secondary)" }}>
            Pick a template to apply to <span className="font-semibold" style={{ color: "var(--color-text-primary)" }}>{props.siteName}</span>. This replaces the site&apos;s existing pages.
          </p>
          {templates.isLoading ? (
            <div className="py-8 text-center text-body" style={{ color: "var(--color-text-muted)" }}>Loading templates…</div>
          ) : templates.isError ? (
            <div className="py-8 text-center text-body" style={{ color: "var(--color-text-muted)" }}>
              Couldn&apos;t load templates. <button type="button" onClick={() => templates.refetch()} className="underline" style={{ color: "var(--color-primary)" }}>Retry</button>
            </div>
          ) : templateItems.length === 0 ? (
            <div className="py-8 text-center text-body" style={{ color: "var(--color-text-muted)" }}>No templates available.</div>
          ) : (
            <div className="max-h-[360px] space-y-1.5 overflow-y-auto pr-1">
              {templateItems.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => { setChosenTemplate({ id: t.id, name: t.name }); setStep("confirm"); }}
                  className="group flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-bg-subtle)]"
                  style={{ borderColor: "var(--color-border-default)" }}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md" style={{ backgroundColor: "var(--color-bg-subtle)", color: "var(--color-text-muted)" }}>
                    <Globe className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-body font-semibold" style={{ color: "var(--color-text-primary)" }}>{t.name}</span>
                    <span className="mt-0.5 block text-body-sm" style={{ color: "var(--color-text-muted)" }}>{toTitleCase(t.category)} · {toTitleCase(t.difficulty)}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" style={{ color: "var(--color-text-secondary)" }} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step: destructive confirm (shared by both directions) */}
      {step === "confirm" && applySiteName && applyTemplateName && (
        <div>
          <p className="text-body" style={{ color: "var(--color-text-secondary)" }}>
            This replaces <span className="font-semibold" style={{ color: "var(--color-text-primary)" }}>all pages</span> of{" "}
            <span className="font-semibold" style={{ color: "var(--color-text-primary)" }}>{applySiteName}</span> with the pages from{" "}
            <span className="font-semibold" style={{ color: "var(--color-text-primary)" }}>{applyTemplateName}</span>.
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
