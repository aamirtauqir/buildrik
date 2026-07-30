"use client";

import { useState } from "react";
import { Play, Check, Clock } from "lucide-react";
import { trpc } from "@lib/trpc/client";
import { PageHeader, Modal, Button, Pill, ProgressBar } from "@/components/dashboard/primitives";
import { ErrorState, LoadingSkeleton, StateEmpty } from "@/components/states";
import { COURSES, lessonEmbedUrl } from "@buildrik/shared/schemas/learn";
import type { CourseProgressData, CurrentLessonData } from "@buildrik/shared/schemas/learn";

/** Learn is a library of video courses. Courses/lessons are code constants
 *  (schemas/learn.ts); the per-user completion state comes from the `learn.list`
 *  query. This replaces the earlier version that mirrored Help's articles and
 *  drew a progress banner with no data behind it — the banner is real now. */

function fmtDuration(sec: number): string {
  const m = Math.round(sec / 60);
  return `${m} min`;
}

/** Look up a lesson's video URL from the constant by slug. The list query
 *  intentionally does not ship videoUrl (it is not per-user and does not belong
 *  in a progress payload); the player reads it from the same constant the server
 *  built the list from. */
function videoUrlFor(lessonSlug: string): string | undefined {
  for (const c of COURSES) {
    const l = c.lessons.find((x) => x.slug === lessonSlug);
    if (l) return l.videoUrl;
  }
  return undefined;
}

function courseStatus(c: CourseProgressData): { tone: "success" | "accent" | "neutral"; label: string } {
  if (c.completedCount === 0) return { tone: "neutral", label: "Not started" };
  if (c.completedCount === c.total) return { tone: "success", label: "Completed" };
  return { tone: "accent", label: `${c.completedCount} of ${c.total}` };
}

function ContinueHero({
  current,
  onResume,
}: {
  current: CurrentLessonData;
  onResume: (lessonSlug: string) => void;
}) {
  // Everything finished — no lesson to point at. A finished state, not an empty one.
  if (!current) {
    return (
      <div
        className="mb-8 flex items-center gap-3 rounded-lg border px-6 py-5"
        style={{ borderColor: "var(--color-border-default)", backgroundColor: "var(--color-bg-surface)" }}
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: "var(--color-success-bg, #DEF7EC)" }}>
          <Check className="h-5 w-5" style={{ color: "var(--color-success)" }} strokeWidth={3} />
        </span>
        <div>
          <p className="text-body font-semibold" style={{ color: "var(--color-text-primary)" }}>You're all caught up</p>
          <p className="text-body-sm" style={{ color: "var(--color-text-secondary)" }}>You've completed every course. New ones land here.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="mb-8 flex flex-col gap-4 rounded-lg border p-6 sm:flex-row sm:items-center sm:justify-between"
      style={{
        borderColor: "var(--color-border-default)",
        backgroundColor: "var(--color-primary-subtle)",
      }}
    >
      <div>
        <p className="text-eyebrow font-semibold uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>
          Continue learning
        </p>
        <h2 className="mt-1.5 text-section-title" style={{ color: "var(--color-text-primary)" }}>
          {current.lessonTitle}
        </h2>
        <p className="mt-1 text-body-sm" style={{ color: "var(--color-text-secondary)" }}>
          {current.courseTitle} · Lesson {current.index} of {current.courseTotal}
        </p>
      </div>
      <Button onClick={() => onResume(current.lessonSlug)}>
        <Play className="h-4 w-4" />
        Resume
      </Button>
    </div>
  );
}

function CourseCard({
  course,
  onOpenLesson,
}: {
  course: CourseProgressData;
  onOpenLesson: (lessonSlug: string) => void;
}) {
  const status = courseStatus(course);
  const pct = course.total === 0 ? 0 : Math.round((course.completedCount / course.total) * 100);

  return (
    <div
      className="flex flex-col overflow-hidden rounded-lg border shadow-card"
      style={{ borderColor: "var(--color-border-default)", backgroundColor: "var(--color-bg-surface)" }}
    >
      <div className="flex items-start justify-between gap-3 px-5 pt-5">
        <div>
          <h3 className="text-body font-semibold" style={{ color: "var(--color-text-primary)" }}>{course.title}</h3>
          <p className="mt-1 text-body-sm" style={{ color: "var(--color-text-secondary)" }}>{course.description}</p>
        </div>
        <Pill tone={status.tone}>{status.label}</Pill>
      </div>

      <div className="px-5 pb-3 pt-4">
        <ProgressBar pct={pct} tone={pct === 100 ? "success" : "accent"} />
      </div>

      <ul className="flex flex-col border-t" style={{ borderColor: "var(--color-border-subtle, var(--color-border-default))" }}>
        {course.lessons.map((l) => (
          <li key={l.slug}>
            <button
              type="button"
              onClick={() => onOpenLesson(l.slug)}
              className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-[var(--color-bg-page)]"
            >
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                style={{
                  backgroundColor: l.completed ? "var(--color-success-bg, #DEF7EC)" : "transparent",
                  boxShadow: l.completed ? "none" : "inset 0 0 0 1.5px var(--color-border-strong)",
                }}
              >
                {l.completed ? (
                  <Check className="h-3.5 w-3.5" style={{ color: "var(--color-success)" }} strokeWidth={3} />
                ) : (
                  <Play className="h-3 w-3" style={{ color: "var(--color-text-muted)" }} />
                )}
              </span>
              <span className="flex-1 text-body-sm" style={{ color: "var(--color-text-primary)" }}>{l.title}</span>
              <span className="flex items-center gap-1 text-eyebrow" style={{ color: "var(--color-text-muted)" }}>
                <Clock className="h-3 w-3" />
                {fmtDuration(l.durationSec)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function LearnPage() {
  const learn = trpc.learn.list.useQuery(undefined, { staleTime: 30_000 });
  const utils = trpc.useUtils();
  const complete = trpc.learn.complete.useMutation({
    onSuccess: () => utils.learn.list.invalidate(),
  });

  const [openLesson, setOpenLesson] = useState<string>();

  const lessonMeta = openLesson
    ? COURSES.flatMap((c) => c.lessons).find((l) => l.slug === openLesson)
    : undefined;
  const embedUrl = lessonMeta ? lessonEmbedUrl(lessonMeta.videoUrl) : null;
  const isDone =
    !!openLesson &&
    (learn.data?.courses ?? []).some((c) => c.lessons.some((l) => l.slug === openLesson && l.completed));

  return (
    <div className="mx-auto max-w-[1200px] px-6">
      <PageHeader title="Learn" description="Buildrick Academy — video courses for getting the most out of Buildrick." />

      {learn.isLoading ? (
        <LoadingSkeleton rows={3} variant="list" />
      ) : learn.isError ? (
        <ErrorState
          title="Couldn't load your courses"
          description="Something went wrong on our end. Refresh to try again."
          onRetry={() => learn.refetch()}
        />
      ) : (learn.data?.courses ?? []).length === 0 ? (
        <StateEmpty title="No courses yet" description="Video courses will appear here once they're published." />
      ) : (
        <>
          <ContinueHero current={learn.data!.current} onResume={(slug) => setOpenLesson(slug)} />
          <h2 className="mb-5 text-section-title" style={{ color: "var(--color-text-primary)" }}>Courses</h2>
          <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-2">
            {learn.data!.courses.map((c) => (
              <CourseCard key={c.slug} course={c} onOpenLesson={(slug) => setOpenLesson(slug)} />
            ))}
          </div>
        </>
      )}

      <Modal
        open={!!openLesson}
        onClose={() => setOpenLesson(undefined)}
        title={lessonMeta?.title ?? "Lesson"}
        width={720}
        footer={
          <div className="flex items-center justify-between gap-3">
            <Button variant="ghost" onClick={() => setOpenLesson(undefined)}>Close</Button>
            {isDone ? (
              <span className="flex items-center gap-1.5 text-body-sm font-medium" style={{ color: "var(--color-success)" }}>
                <Check className="h-4 w-4" strokeWidth={3} /> Completed
              </span>
            ) : (
              <Button
                onClick={() => openLesson && complete.mutate({ lessonSlug: openLesson })}
                disabled={complete.isPending}
              >
                {complete.isPending ? "Saving…" : "Mark as complete"}
              </Button>
            )}
          </div>
        }
      >
        {embedUrl ? (
          <div className="overflow-hidden rounded-lg" style={{ aspectRatio: "16 / 9" }}>
            <iframe
              src={embedUrl}
              title={lessonMeta?.title ?? "Lesson video"}
              className="h-full w-full"
              style={{ border: 0 }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div
            className="rounded-lg border px-6 py-12 text-center text-body"
            style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-secondary)" }}
          >
            This video isn't available right now.
          </div>
        )}
      </Modal>
    </div>
  );
}
