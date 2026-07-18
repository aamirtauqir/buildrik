import { Folder, Sparkle, Globe, MessageSquare } from "lucide-react";
import { PageHeader, ProgressBar, Button } from "@/components/dashboard/primitives";

const COURSES = [
  { title: "Getting started with Buildrik", lessons: 5, minutes: 20, status: "Completed", pct: 100, icon: Folder, color: "var(--color-primary)" },
  { title: "Designing with AI generation", lessons: 4, minutes: 16, status: null, pct: 25, icon: Sparkle, color: "var(--color-purple)" },
  { title: "Custom domains & DNS", lessons: 3, minutes: 12, status: "Not started", pct: 0, icon: Globe, color: "var(--color-teal)" },
  { title: "Client review & sign-off", lessons: 6, minutes: 24, status: null, pct: 50, icon: MessageSquare, color: "var(--color-amber)" },
] as const;

export default function LearnPage() {
  return (
    <div>
      <PageHeader title="Learn" description="Buildrick Academy — courses, tutorials and best practices." />

      <div
        className="mb-6 rounded-2xl px-6 py-[22px]"
        style={{ background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%)" }}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-eyebrow font-bold uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.75)" }}>
              Continue learning
            </p>
            <h2 className="mt-1.5 text-[19px] font-bold text-white">Client workflows · Lesson 3 of 6</h2>
          </div>
          {/* No courses backend yet — inert rather than a silent no-op. */}
          <Button size="md" disabled title="Coming soon" className="shrink-0 bg-white text-[var(--color-primary)] hover:bg-white disabled:opacity-100">
            Resume
          </Button>
        </div>
        <div className="mt-3 h-[6px] w-full max-w-[400px] overflow-hidden rounded-pill" style={{ backgroundColor: "rgba(255,255,255,0.25)" }}>
          <div className="h-full rounded-pill" style={{ width: "50%", backgroundColor: "#FFFFFF" }} />
        </div>
      </div>

      <h2 className="mb-5 text-section-title" style={{ color: "var(--color-text-primary)" }}>Learning paths</h2>

      <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
        {COURSES.map(({ title, lessons, minutes, status, pct, icon: Icon, color }) => (
          <div
            key={title}
            className="overflow-hidden rounded-xl border shadow-card"
            style={{ borderColor: "var(--color-border-default)", backgroundColor: "var(--color-bg-surface)" }}
          >
            <div
              className="flex h-[188px] items-center justify-center"
              style={{ background: `linear-gradient(135deg, color-mix(in srgb, ${color} 8%, white), color-mix(in srgb, ${color} 20%, white))` }}
            >
              <Icon className="h-[34px] w-[34px]" style={{ color }} />
            </div>
            <div className="px-4 py-3.5">
              <h3 className="text-body font-semibold" style={{ color: "var(--color-text-primary)" }}>{title}</h3>
              <p className="mt-1.5 text-body-sm" style={{ color: "var(--color-text-secondary)" }}>
                {lessons} lessons · {minutes} min
              </p>
              {status ? (
                <p
                  className="mt-1.5 text-eyebrow font-semibold"
                  style={{ color: status === "Completed" ? "var(--color-success)" : "var(--color-text-muted)" }}
                >
                  {status}
                </p>
              ) : (
                <ProgressBar pct={pct} className="mt-1.5" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
