import { PlayCircle, CheckCircle2, Circle, Clock } from "lucide-react";
import { PageHeader, MetricValue, Pill, ProgressBar, type PillTone } from "@/components/dashboard/primitives";

const STATUS = {
  completed: { label: "Completed", tone: "success", Icon: CheckCircle2 },
  "in-progress": { label: "In progress", tone: "accent", Icon: PlayCircle },
  "not-started": { label: "Not started", tone: "neutral", Icon: Circle },
} as const satisfies Record<string, { label: string; tone: PillTone; Icon: typeof Circle }>;

const COURSES = [
  { title: "Getting started with Buildrick", lessons: 5, minutes: 20, status: "completed" },
  { title: "Designing with AI generation", lessons: 4, minutes: 16, status: "in-progress" },
  { title: "Custom domains & DNS", lessons: 3, minutes: 12, status: "not-started" },
  { title: "Client review & sign-off", lessons: 6, minutes: 24, status: "not-started" },
] as const;

export default function LearnPage() {
  return (
    <div>
      <PageHeader title="Learn" description="Buildrick Academy — courses, tutorials and best practices." />

      <section
        className="mb-6 rounded-xl border p-5"
        style={{ borderColor: "var(--color-border-default)", backgroundColor: "var(--color-primary-subtle)" }}
      >
        <p className="text-eyebrow font-semibold uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>
          Continue learning
        </p>
        <div className="mt-2 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>Client workflows</h2>
            <p className="mt-0.5 text-body" style={{ color: "var(--color-text-secondary)" }}>
              Lesson <MetricValue>3</MetricValue> of <MetricValue>6</MetricValue>
            </p>
          </div>
          {/* No courses backend yet — inert rather than a silent no-op. */}
          <button
            type="button"
            disabled
            title="Coming soon"
            className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-lg px-4 py-2 text-body font-medium"
            style={{ backgroundColor: "var(--color-bg-subtle)", color: "var(--color-text-muted)" }}
          >
            <PlayCircle className="h-4 w-4" />
            Coming soon
          </button>
        </div>
        <ProgressBar pct={50} className="mt-4" />
      </section>

      <h2 className="mb-3 text-body font-semibold" style={{ color: "var(--color-text-primary)" }}>Learning paths</h2>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {COURSES.map(({ title, lessons, minutes, status }) => {
          const { label, tone, Icon } = STATUS[status];
          return (
            <div
              key={title}
              className="rounded-xl border p-4"
              style={{ borderColor: "var(--color-border-default)", backgroundColor: "var(--color-bg-surface)" }}
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-body font-semibold" style={{ color: "var(--color-text-primary)" }}>{title}</h3>
                <Pill tone={tone} className="shrink-0">
                  <Icon className="h-3 w-3" />
                  {label}
                </Pill>
              </div>
              <p className="mt-2 inline-flex items-center gap-1 text-body" style={{ color: "var(--color-text-secondary)" }}>
                <Clock className="h-3.5 w-3.5" />
                <MetricValue>{lessons}</MetricValue> lessons · <MetricValue>{minutes}</MetricValue> min
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
