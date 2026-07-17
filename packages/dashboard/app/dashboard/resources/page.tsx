import Link from "next/link";
import { FileText, Code2, Palette, LayoutTemplate, ScrollText, Users, ArrowUpRight } from "lucide-react";
import { PageHeader } from "@/components/dashboard/primitives";

const RESOURCES = [
  { icon: FileText, title: "Documentation", description: "Guides for building, publishing and managing sites.", href: "/dashboard/help", external: false },
  { icon: Code2, title: "API reference", description: "Endpoints, tokens and webhooks for developers.", href: "/dashboard/settings/api-tokens", external: false },
  { icon: Palette, title: "Brand kit", description: "Logos, colors and usage guidelines to download.", href: "/dashboard/templates", external: false },
  { icon: LayoutTemplate, title: "Template gallery", description: "Starter designs for every kind of site.", href: "/dashboard/templates", external: false },
  { icon: ScrollText, title: "Changelog", description: "What's new — features, fixes and improvements.", href: "/dashboard/help", external: false },
  { icon: Users, title: "Community", description: "Ask questions and share work with other builders.", href: "/dashboard/help", external: false },
] as const;

export default function ResourcesPage() {
  return (
    <div>
      <PageHeader title="Resources" description="Docs, guides, brand assets and everything else you need." />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {RESOURCES.map(({ icon: Icon, title, description, href }) => (
          <Link
            key={title}
            href={href}
            className="group rounded-xl border p-5 transition-colors hover:border-[var(--color-primary)]"
            style={{ borderColor: "var(--color-border-default)", backgroundColor: "var(--color-bg-surface)" }}
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: "var(--color-primary-subtle)", color: "var(--color-primary)" }}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex items-center gap-1">
              <h2 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>{title}</h2>
              <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" style={{ color: "var(--color-primary)" }} />
            </div>
            <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>{description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
