import { z } from "zod";

/**
 * Learn is a small library of video courses. The content lives here in code —
 * there is no Course or Lesson table. Adding a lesson is a commit, which is the
 * right shape when the videos are produced in batches rather than authored in
 * the app; if that stops being true, this constant is what an admin CRUD would
 * later write into.
 *
 * The ONE thing that is per-user, and therefore in the database, is progress:
 * which lessons a given person has finished. That lives in `LessonProgress`,
 * keyed on `lessonSlug` — a plain string, not a foreign key, because the thing
 * it points at is a constant here, not a row. A lesson removed from this file
 * leaves a harmless orphan progress row that no read ever surfaces.
 *
 * Slugs are the join key across that boundary, so they must be unique and
 * stable. `onboarding-vocabulary`-style: a test guards uniqueness, because a
 * duplicated slug would silently merge two lessons' progress.
 */

export interface Lesson {
  slug: string;
  title: string;
  /** A YouTube or Vimeo watch/share URL. `lessonEmbedUrl` turns it into an
   *  embeddable, cookie-reduced src; the CSP frame-src must allow that host. */
  videoUrl: string;
  durationSec: number;
}

export interface Course {
  slug: string;
  title: string;
  description: string;
  lessons: Lesson[];
}

/**
 * The shipped courses. Placeholder video URLs until the real unlisted links are
 * dropped in — the shape is what matters for wiring the feature; swapping a URL
 * is a one-line edit that needs no code change.
 */
export const COURSES: Course[] = [
  {
    slug: "getting-started",
    title: "Getting started with Buildrick",
    description: "From an empty workspace to a published site.",
    lessons: [
      { slug: "gs-tour", title: "A tour of the dashboard", videoUrl: "https://www.youtube.com/watch?v=aqz-KE-bpKQ", durationSec: 240 },
      { slug: "gs-first-site", title: "Create your first site", videoUrl: "https://www.youtube.com/watch?v=aqz-KE-bpKQ", durationSec: 360 },
      { slug: "gs-publish", title: "Publish and share", videoUrl: "https://www.youtube.com/watch?v=aqz-KE-bpKQ", durationSec: 300 },
    ],
  },
  {
    slug: "ai-generation",
    title: "Designing with AI generation",
    description: "Turn a prompt into a real, editable site.",
    lessons: [
      { slug: "ai-brief", title: "Writing a good brief", videoUrl: "https://www.youtube.com/watch?v=aqz-KE-bpKQ", durationSec: 300 },
      { slug: "ai-refine", title: "Refining the draft", videoUrl: "https://www.youtube.com/watch?v=aqz-KE-bpKQ", durationSec: 420 },
    ],
  },
  {
    slug: "client-review",
    title: "Client review & sign-off",
    description: "Send work for approval and act on feedback.",
    lessons: [
      { slug: "cr-send", title: "Sending a site for review", videoUrl: "https://www.youtube.com/watch?v=aqz-KE-bpKQ", durationSec: 260 },
      { slug: "cr-comments", title: "Reading and resolving comments", videoUrl: "https://www.youtube.com/watch?v=aqz-KE-bpKQ", durationSec: 340 },
      { slug: "cr-signoff", title: "Getting sign-off and publishing", videoUrl: "https://www.youtube.com/watch?v=aqz-KE-bpKQ", durationSec: 280 },
    ],
  },
];

/** Every lesson across every course, flat — the order the "current lesson" walk
 *  follows and the set a progress row can legitimately point at. */
export const ALL_LESSONS: ReadonlyArray<Lesson & { courseSlug: string }> = COURSES.flatMap((c) =>
  c.lessons.map((l) => ({ ...l, courseSlug: c.slug }))
);

/**
 * Hosts allowed in the CSP frame-src. Kept beside the embed helper so the two
 * never drift: if a URL shape is accepted here, the host that serves it has to
 * be in this list or the iframe is blocked at runtime. Both are the
 * privacy/cookie-reduced variants.
 */
export const VIDEO_EMBED_HOSTS = ["https://www.youtube-nocookie.com", "https://player.vimeo.com"] as const;

/**
 * Turns a watch/share URL into an embeddable src, or returns null if the URL is
 * not a recognised YouTube/Vimeo link. Null is a real case the UI must handle —
 * a mistyped constant should show a "video unavailable" state, not an iframe
 * pointed at an arbitrary origin the CSP would block anyway.
 */
export function lessonEmbedUrl(videoUrl: string): string | null {
  let u: URL;
  try {
    u = new URL(videoUrl);
  } catch {
    return null;
  }

  const host = u.hostname.replace(/^www\./, "");

  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    const id = u.searchParams.get("v");
    return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  }
  if (host === "youtu.be") {
    const id = u.pathname.slice(1);
    return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  }
  if (host === "vimeo.com") {
    const id = u.pathname.split("/").filter(Boolean)[0];
    return id && /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}` : null;
  }
  if (host === "player.vimeo.com") {
    return videoUrl; // already an embed URL
  }
  return null;
}

// ── Transport-safe shapes the router returns (progress merged in) ──

export const lessonProgressSchema = z.object({
  slug: z.string(),
  title: z.string(),
  durationSec: z.number(),
  completed: z.boolean(),
});

export const courseProgressSchema = z.object({
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  lessons: z.array(lessonProgressSchema),
  completedCount: z.number(),
  total: z.number(),
});

/** The hero: the next lesson to watch, or null when everything is done. */
export const currentLessonSchema = z
  .object({
    courseSlug: z.string(),
    courseTitle: z.string(),
    lessonSlug: z.string(),
    lessonTitle: z.string(),
    index: z.number(), // 1-based position within its course
    courseTotal: z.number(),
  })
  .nullable();

export type LessonProgressData = z.infer<typeof lessonProgressSchema>;
export type CourseProgressData = z.infer<typeof courseProgressSchema>;
export type CurrentLessonData = z.infer<typeof currentLessonSchema>;
