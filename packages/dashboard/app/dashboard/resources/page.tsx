import Link from "next/link";
import { FileText, Code2, CheckSquare, LayoutTemplate, Download, Users, ArrowUpRight } from "lucide-react";
import { PageHeader, IconChip } from "@/components/dashboard/primitives";

// Buildrick has no external docs site, changelog or community forum today —
// buildrick.io serves only a placeholder homepage (verified live, all
// candidate subpaths 404). These route to the closest real in-app page
// instead of a fabricated external URL.
const RESOURCES = [
  { icon: FileText, title: "Documentation", description: "Guides for building, publishing and managing sites.", href: "/dashboard/help", color: "var(--color-primary)" },
  { icon: Code2, title: "API reference", description: "Endpoints, tokens and webhooks for developers.", href: "/dashboard/settings/api-tokens", color: "var(--color-text-secondary)" },
  { icon: CheckSquare, title: "Brand kit", description: "Logos, colors and usage guidelines to download.", href: "/dashboard/templates", color: "var(--color-amber)" },
  { icon: LayoutTemplate, title: "Template gallery", description: "Starter designs for every kind of site.", href: "/dashboard/templates", color: "var(--color-teal)" },
  { icon: Download, title: "Changelog", description: "What's new — features, fixes and improvements.", href: "/dashboard/help", color: "var(--color-success)" },
  { icon: Users, title: "Community", description: "Ask questions and share work with other builders.", href: "/dashboard/help", color: "var(--color-pink)" },
] as const;

export default function ResourcesPage() {
  return (
    <div>
      <PageHeader title="Resources" description="Docs, guides, brand assets and everything else you need." />

      <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
        {RESOURCES.map(({ icon: Icon, title, description, href, color }) => (
          <Link
            key={title}
            href={href}
            className="group rounded-xl border p-[18px] shadow-card transition-colors hover:border-[var(--color-primary)]"
            style={{ borderColor: "var(--color-border-default)", backgroundColor: "var(--color-bg-surface)" }}
          >
            <IconChip color={color} className="mb-3">
              <Icon className="h-5 w-5" />
            </IconChip>
            <div className="flex items-center gap-1">
              <h2 className="text-[14.5px] font-semibold" style={{ color: "var(--color-text-primary)" }}>{title}</h2>
              <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" style={{ color: "var(--color-primary)" }} />
            </div>
            <p className="mt-1 text-[12.5px]" style={{ color: "var(--color-text-secondary)" }}>{description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
