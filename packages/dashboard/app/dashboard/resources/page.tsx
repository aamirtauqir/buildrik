import Link from "next/link";
import { FileText, Code2, ArrowRight } from "lucide-react";
import { PageHeader, IconChip } from "@/components/dashboard/primitives";

// An honest launcher — and only for destinations that DON'T already have a
// prominent home elsewhere. It used to carry Learn and Getting started too, but
// those are top-level nav (Learn is an Explore tab, Getting started is a sidebar
// item), so the cards were pure duplication. Removed. What's left is what
// Resources genuinely surfaces: Help (which lives only here) and API & tokens
// (buried three levels deep in Settings, worth a shortcut). No card here
// duplicates a prominent nav destination.
const RESOURCES = [
  { icon: FileText, title: "Help center", description: "Guides and articles for building, publishing and managing sites.", href: "/dashboard/help", color: "var(--color-primary)" },
  { icon: Code2, title: "API & tokens", description: "Tokens and webhooks for scripting and integrations.", href: "/dashboard/settings/api-tokens", color: "var(--color-text-secondary)" },
] as const;

export default function ResourcesPage() {
  return (
    <div className="mx-auto max-w-[1200px] px-6 py-6">
      <PageHeader title="Resources" description="Help, guides and developer tools — reference material for building on Buildrick." />

      <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
        {RESOURCES.map(({ icon: Icon, title, description, href, color }) => (
          <Link
            key={title}
            href={href}
            className="group rounded-lg border p-[18px] shadow-card transition-colors hover:border-[var(--color-primary)]"
            style={{ borderColor: "var(--color-border-default)", backgroundColor: "var(--color-bg-surface)" }}
          >
            <IconChip color={color} className="mb-3">
              <Icon className="h-5 w-5" />
            </IconChip>
            <div className="flex items-center gap-1">
              <h2 className="text-[14.5px] font-semibold" style={{ color: "var(--color-text-primary)" }}>{title}</h2>
              <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" style={{ color: "var(--color-primary)" }} />
            </div>
            <p className="mt-1 text-[12.5px]" style={{ color: "var(--color-text-secondary)" }}>{description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
