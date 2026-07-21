import Link from "next/link";
import { FileText, GraduationCap, Code2, Rocket, ArrowRight } from "lucide-react";
import { PageHeader, IconChip } from "@/components/dashboard/primitives";

// An honest in-app launcher. Buildrick has no external docs site, changelog,
// community forum or downloadable brand kit today, so this used to fabricate
// those as cards that all redirected to Help — and dressed every card with an
// external-link arrow that lied about where it went. Every card here now points
// at a real, distinct in-app destination, labelled for where it actually goes,
// with an internal arrow. Nothing pretends to be something it isn't.
const RESOURCES = [
  { icon: FileText, title: "Help center", description: "Guides and articles for building, publishing and managing sites.", href: "/dashboard/help", color: "var(--color-primary)" },
  { icon: GraduationCap, title: "Learn", description: "Video courses to get the most out of Buildrick.", href: "/dashboard/learn", color: "var(--color-teal)" },
  { icon: Code2, title: "API & tokens", description: "Tokens and webhooks for scripting and integrations.", href: "/dashboard/settings/api-tokens", color: "var(--color-text-secondary)" },
  { icon: Rocket, title: "Getting started", description: "Set up your workspace and publish your first site.", href: "/dashboard/getting-started", color: "var(--color-amber)" },
] as const;

export default function ResourcesPage() {
  return (
    <div>
      <PageHeader title="Resources" description="Guides, courses, developer tools and setup — everything to get the most out of Buildrick." />

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
              <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" style={{ color: "var(--color-primary)" }} />
            </div>
            <p className="mt-1 text-[12.5px]" style={{ color: "var(--color-text-secondary)" }}>{description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
