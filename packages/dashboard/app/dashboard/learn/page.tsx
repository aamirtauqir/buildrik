import { PlayCircle, CheckCircle2, Circle, Clock } from "lucide-react";

const STATUS_STYLE = {
  completed: { label: "Completed", color: "var(--color-success)", bg: "#ECFDF5" },
  "in-progress": { label: "In progress", color: "var(--color-primary)", bg: "var(--color-primary-subtle)" },
  "not-started": { label: "Not started", color: "var(--color-text-secondary)", bg: "var(--color-bg-surface)" },
} as const;

const COURSES = [
  { title: "Getting started with Buildrick", lessons: 5, minutes: 20, status: "completed" },
  { title: "Designing with AI generation", lessons: 4, minutes: 16, status: "in-progress" },
  { title: "Custom domains & DNS", lessons: 3, minutes: 12, status: "not-started" },
  { title: "Client review & sign-off", lessons: 6, minutes: 24, status: "not-started" },
] as const;

export default function LearnPage() {
  return (
    <div>
      <header className="mb-6">
        <h1 className="text-[22px] font-bold" style={{ color: "var(--color-text-primary)" }}>Learn</h1>
        <p className="mt-0.5 text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Buildrick Academy — courses, tutorials and best practices.
        </p>
      </header>

      <section
        className="mb-6 rounded-xl border p-5"
        style={{ borderColor: "var(--color-border-default)", backgroundColor: "var(--color-primary-subtle)" }}
      >
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>
          Continue learning
        </p>
        <div className="mt-2 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>Client workflows</h2>
            <p className="mt-0.5 text-sm" style={{ color: "var(--color-text-secondary)" }}>Lesson 3 of 6</p>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            <PlayCircle className="h-4 w-4" />
            Resume
          </button>
        </div>
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: "var(--color-bg-surface)" }}>
          <div className="h-full rounded-full" style={{ width: "50%", backgroundColor: "var(--color-primary)" }} />
        </div>
      </section>

      <h2 className="mb-3 text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Learning paths</h2>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {COURSES.map(({ title, lessons, minutes, status }) => {
          const s = STATUS_STYLE[status];
          return (
            <div
              key={title}
              className="rounded-xl border p-4"
              style={{ borderColor: "var(--color-border-default)", backgroundColor: "var(--color-bg-surface)" }}
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>{title}</h3>
                <span
                  className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium"
                  style={{ color: s.color, backgroundColor: s.bg }}
                >
                  {status === "completed" && <CheckCircle2 className="h-3 w-3" />}
                  {status === "in-progress" && <PlayCircle className="h-3 w-3" />}
                  {status === "not-started" && <Circle className="h-3 w-3" />}
                  {s.label}
                </span>
              </div>
              <p className="mt-2 inline-flex items-center gap-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                <Clock className="h-3.5 w-3.5" />
                {lessons} lessons · {minutes} min
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
