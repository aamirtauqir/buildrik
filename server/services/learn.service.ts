import { prisma } from "@/lib/prisma";
import {
  COURSES,
  ALL_LESSONS,
  type CourseProgressData,
  type CurrentLessonData,
} from "@buildrik/shared/schemas/learn";

/**
 * The Learn library, with one user's progress merged in.
 *
 * Courses and lessons are the code constants in `schemas/learn.ts`; the only
 * thing read from the database is the set of lesson slugs this user has
 * completed. Everything else — titles, order, counts — comes from the constant,
 * so a lesson that no longer exists simply never appears, and a progress row for
 * it is ignored rather than surfaced.
 */
export async function listCoursesForUser(
  userId: string
): Promise<{ courses: CourseProgressData[]; current: CurrentLessonData }> {
  const rows = await prisma.lessonProgress.findMany({
    where: { userId },
    select: { lessonSlug: true },
  });
  const done = new Set(rows.map((r) => r.lessonSlug));

  const courses: CourseProgressData[] = COURSES.map((course) => {
    const lessons = course.lessons.map((l) => ({
      slug: l.slug,
      title: l.title,
      durationSec: l.durationSec,
      completed: done.has(l.slug),
    }));
    return {
      slug: course.slug,
      title: course.title,
      description: course.description,
      lessons,
      completedCount: lessons.filter((l) => l.completed).length,
      total: lessons.length,
    };
  });

  return { courses, current: deriveCurrent(courses) };
}

/**
 * The "Continue learning" target: the first lesson, in authored order across all
 * courses, that the user has not completed. Null when everything is done — the
 * hero then shows a finished state rather than pointing nowhere.
 *
 * Walks `ALL_LESSONS` (already flattened in course/lesson order) so the choice
 * is deterministic and matches what the cards show, rather than depending on
 * Set or object iteration order.
 */
function deriveCurrent(courses: CourseProgressData[]): CurrentLessonData {
  const completed = new Set(
    courses.flatMap((c) => c.lessons.filter((l) => l.completed).map((l) => l.slug))
  );
  const next = ALL_LESSONS.find((l) => !completed.has(l.slug));
  if (!next) return null;

  const course = COURSES.find((c) => c.slug === next.courseSlug)!;
  const index = course.lessons.findIndex((l) => l.slug === next.slug);
  return {
    courseSlug: course.slug,
    courseTitle: course.title,
    lessonSlug: next.slug,
    lessonTitle: next.title,
    index: index + 1, // 1-based, for "Lesson 3 of 6"
    courseTotal: course.lessons.length,
  };
}

/**
 * Mark a lesson complete. Idempotent — a second call on the same lesson is a
 * no-op rather than an error, because "I finished this" is a fact, not an event,
 * and the UI may fire it on replay or a double click.
 *
 * Rejects a slug that is not a real lesson: the column is a free string, so
 * without this an arbitrary value would be accepted and quietly accumulate.
 */
export async function markLessonComplete(userId: string, lessonSlug: string): Promise<void> {
  const known = ALL_LESSONS.some((l) => l.slug === lessonSlug);
  if (!known) {
    throw new Error(`UNKNOWN_LESSON: ${lessonSlug}`);
  }
  await prisma.lessonProgress.upsert({
    where: { userId_lessonSlug: { userId, lessonSlug } },
    update: {},
    create: { userId, lessonSlug },
  });
}
