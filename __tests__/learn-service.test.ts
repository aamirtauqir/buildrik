import { describe, it, expect, vi, beforeEach } from "vitest";

const findMany = vi.fn();
const upsert = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: { lessonProgress: { findMany: (...a: unknown[]) => findMany(...a), upsert: (...a: unknown[]) => upsert(...a) } },
}));

import { listCoursesForUser, markLessonComplete } from "@server/services/learn.service";
import { COURSES, ALL_LESSONS } from "@buildrik/shared/schemas/learn";

/**
 * The merge and the "current lesson" walk. The live browser pass proved one path
 * end to end — complete the first lesson, watch the hero advance. These cover the
 * paths it did not: nothing done, a whole course done, everything done, and a
 * completion in the middle of the flat order.
 *
 * `completed` is the set of slugs the (mocked) DB returns for the user.
 */
function withCompleted(slugs: string[]) {
  findMany.mockResolvedValue(slugs.map((lessonSlug) => ({ lessonSlug })));
}

const FIRST = ALL_LESSONS[0].slug;
const SECOND = ALL_LESSONS[1].slug;

describe("listCoursesForUser", () => {
  beforeEach(() => {
    findMany.mockReset();
    upsert.mockReset();
  });

  it("points the hero at the first lesson when nothing is done", async () => {
    withCompleted([]);
    const { current, courses } = await listCoursesForUser("u1");
    expect(current?.lessonSlug).toBe(FIRST);
    expect(current?.index).toBe(1);
    expect(courses.every((c) => c.completedCount === 0)).toBe(true);
  });

  it("advances the hero past a completed lesson to the next incomplete one", async () => {
    withCompleted([FIRST]);
    const { current } = await listCoursesForUser("u1");
    expect(current?.lessonSlug).toBe(SECOND);
    // index is 1-based within its course, so completing lesson 1 of course 1
    // makes the hero read "Lesson 2 of N".
    expect(current?.index).toBe(2);
  });

  it("skips a fully-completed first course to the next course's first lesson", async () => {
    const firstCourse = COURSES[0];
    withCompleted(firstCourse.lessons.map((l) => l.slug));
    const { current, courses } = await listCoursesForUser("u1");

    // firstCourse is the raw constant, so its count is lessons.length — `total`
    // exists only on the merged output (courses[0]).
    expect(courses[0].completedCount).toBe(firstCourse.lessons.length);
    expect(current?.courseSlug).toBe(COURSES[1].slug);
    expect(current?.index).toBe(1); // first lesson of the NEXT course, so back to 1
  });

  it("returns a null hero when every lesson is done", async () => {
    withCompleted(ALL_LESSONS.map((l) => l.slug));
    const { current, courses } = await listCoursesForUser("u1");
    expect(current).toBeNull();
    expect(courses.every((c) => c.completedCount === c.total)).toBe(true);
  });

  it("ignores a progress row for a lesson that no longer exists", async () => {
    // A slug removed from COURSES but still in the DB must not crash or inflate a
    // count — it simply is not part of any course, so it is dropped.
    withCompleted([FIRST, "deleted-lesson-slug"]);
    const { courses } = await listCoursesForUser("u1");
    const total = courses.reduce((n, c) => n + c.completedCount, 0);
    expect(total).toBe(1); // only FIRST counted, orphan ignored
  });
});

describe("markLessonComplete", () => {
  beforeEach(() => {
    findMany.mockReset();
    upsert.mockReset();
    upsert.mockResolvedValue({});
  });

  it("upserts a known lesson", async () => {
    await markLessonComplete("u1", FIRST);
    expect(upsert).toHaveBeenCalledOnce();
    const arg = upsert.mock.calls[0][0] as { where: { userId_lessonSlug: { lessonSlug: string } } };
    expect(arg.where.userId_lessonSlug.lessonSlug).toBe(FIRST);
  });

  it("is idempotent — a second call has an empty update, not an error", async () => {
    await markLessonComplete("u1", FIRST);
    const arg = upsert.mock.calls[0][0] as { update: Record<string, unknown> };
    // upsert with an empty `update` is the idempotent shape: re-marking is a
    // no-op rather than a write or a throw.
    expect(arg.update).toEqual({});
  });

  it("rejects a slug that is not a real lesson without touching the DB", async () => {
    await expect(markLessonComplete("u1", "made-up-slug")).rejects.toThrow("UNKNOWN_LESSON");
    expect(upsert).not.toHaveBeenCalled();
  });
});
