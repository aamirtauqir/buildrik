"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Pencil, ExternalLink, Send, Share2, MoreHorizontal, LayoutTemplate } from "lucide-react";
import { trpc } from "@lib/trpc/client";
import { siteAddress } from "@lib/utils";
import { EditorLink } from "@/components/editor-route/EditorLink";
import { siteStatusTone } from "@/components/sites/site-status";
import { Button, Pill, MetricValue, Modal } from "@/components/dashboard/primitives";
import { SendReviewModal } from "@/components/reviews/send-review-modal";
import { ShareDraftModal } from "@/components/site-detail/share-draft-modal";
import { UseTemplateModal } from "@/components/templates/use-template-modal";

interface SiteHeaderProps {
  site: { id: string; name: string; slug: string; status: string; publishedUrl: string | null; domain?: string | null; sourceTemplate?: { id: string; name: string } | null };
  onPublish?: () => void;
  onUnpublish?: () => void;
}

function toTitleCase(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

const outlineButton = "flex items-center gap-2 rounded-lg border px-4 py-2 text-body font-medium transition-colors hover:bg-[var(--color-bg-subtle)]";

export function SiteHeader({ site, onPublish, onUnpublish }: SiteHeaderProps) {
  // Review is an agency-layer feature — the submit procedure requires the flag
  // and throws FORBIDDEN otherwise, so don't offer the button when it's off.
  const features = trpc.features.list.useQuery(undefined, { staleTime: 60_000 });
  const reviewEnabled = !!features.data?.agency_layer;
  const [reviewOpen, setReviewOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [applyTemplateOpen, setApplyTemplateOpen] = useState(false);
  const [confirmUnpublish, setConfirmUnpublish] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const address = siteAddress(site);

  return (
    <div>
      <Link href="/dashboard/projects" className="mb-3 inline-flex items-center gap-1 text-body transition-colors hover:underline" style={{ color: "var(--color-text-secondary)" }}>
        <ArrowLeft className="h-4 w-4" />Back to sites
      </Link>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-lg font-bold text-white" style={{ backgroundColor: "var(--color-ink)" }}>
            {site.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <h1 className="text-page-title leading-tight" style={{ color: "var(--color-text-primary)" }}>{site.name}</h1>
              <Pill tone={siteStatusTone(site.status)}>{toTitleCase(site.status)}</Pill>
            </div>
            {address === null ? (
              <span className="mt-0.5 inline-block text-body-sm" style={{ color: "var(--color-text-muted)" }}>Not published</span>
            ) : site.publishedUrl ? (
              <a href={site.publishedUrl} target="_blank" rel="noopener noreferrer" className="mt-0.5 inline-block hover:underline" style={{ color: "var(--color-text-muted)" }}>
                <MetricValue className="text-body-sm">{address}</MetricValue>
              </a>
            ) : (
              <span className="mt-0.5 inline-block" style={{ color: "var(--color-text-muted)" }}>
                <MetricValue className="text-body-sm">{address}</MetricValue>
              </span>
            )}
            {site.sourceTemplate && (
              <Link
                href={`/dashboard/templates/${site.sourceTemplate.id}`}
                className="mt-1 inline-flex items-center gap-1 text-body-sm transition-colors hover:underline"
                style={{ color: "var(--color-text-muted)" }}
              >
                <LayoutTemplate className="h-3.5 w-3.5" />
                Made from {site.sourceTemplate.name}
              </Link>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {site.status === "PUBLISHED" && site.publishedUrl ? (
            <a
              href={site.publishedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={outlineButton}
              style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-primary)" }}
            >
              <ExternalLink className="h-4 w-4" />View site
            </a>
          ) : (
            <span
              className="flex cursor-not-allowed items-center gap-2 rounded-lg border px-4 py-2 text-body font-medium opacity-50"
              style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-secondary)" }}
              title="Publish your site first"
            >
              <ExternalLink className="h-4 w-4" />View site
            </span>
          )}
          {reviewEnabled && (
            <Button variant="ghost" onClick={() => setReviewOpen(true)}>
              <Send className="h-4 w-4" />Send for review
            </Button>
          )}
          {site.status === "DRAFT" && onPublish && (
            <Button onClick={onPublish}>Publish</Button>
          )}
          {site.status === "PUBLISHED" && onUnpublish && (
            <Button onClick={() => setConfirmUnpublish(true)}>Unpublish</Button>
          )}
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              className="flex items-center gap-2 rounded-lg border px-3 py-2 text-body font-medium transition-colors hover:bg-[var(--color-bg-subtle)]"
              style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-primary)" }}
            >
              <MoreHorizontal className="h-4 w-4" />More
            </button>
            {menuOpen && (
              <div role="menu" className="absolute right-0 top-full z-20 mt-1 w-52 rounded-lg border bg-white py-1 shadow-lg" style={{ borderColor: "var(--color-border-default)" }}>
                <EditorLink
                  siteId={site.id}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMenuOpen(false)}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-body transition-colors hover:bg-[var(--color-bg-subtle)]"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  <Pencil className="h-4 w-4" style={{ color: "var(--color-text-secondary)" }} />Edit in Editor
                </EditorLink>
                <button
                  onClick={() => { setShareOpen(true); setMenuOpen(false); }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-body transition-colors hover:bg-[var(--color-bg-subtle)]"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  <Share2 className="h-4 w-4" style={{ color: "var(--color-text-secondary)" }} />Share draft
                </button>
                <button
                  onClick={() => { setApplyTemplateOpen(true); setMenuOpen(false); }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-body transition-colors hover:bg-[var(--color-bg-subtle)]"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  <LayoutTemplate className="h-4 w-4" style={{ color: "var(--color-text-secondary)" }} />Apply template
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <ShareDraftModal open={shareOpen} onClose={() => setShareOpen(false)} siteId={site.id} />
      <SendReviewModal open={reviewOpen} onClose={() => setReviewOpen(false)} siteId={site.id} siteName={site.name} />
      <UseTemplateModal open={applyTemplateOpen} onClose={() => setApplyTemplateOpen(false)} siteId={site.id} siteName={site.name} />

      {/* Unpublishing takes the live site down — confirm, don't fire on a click. */}
      <Modal
        open={confirmUnpublish}
        onClose={() => setConfirmUnpublish(false)}
        title="Unpublish site?"
        width={420}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmUnpublish(false)}>Cancel</Button>
            <Button variant="danger" onClick={() => { setConfirmUnpublish(false); onUnpublish?.(); }}>Unpublish</Button>
          </>
        }
      >
        <p className="text-body" style={{ color: "var(--color-text-secondary)" }}>
          <strong>{site.name}</strong> will be taken offline and its public URL will stop working until you publish again.
        </p>
      </Modal>
    </div>
  );
}
