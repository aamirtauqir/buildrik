import { describe, it, expect } from "vitest";
import {
  COURSES,
  ALL_LESSONS,
  VIDEO_EMBED_HOSTS,
  lessonEmbedUrl,
} from "@buildrik/shared/schemas/learn";

/**
 * The Learn content is a code constant, and `LessonProgress` joins to it by
 * `lessonSlug` — a plain string, not a foreign key. That join only holds if
 * slugs are unique: a duplicated slug would silently merge two lessons' progress,
 * and nothing at the database layer would object. So the guard lives here.
 */

describe("COURSES", () => {
  it("has a unique slug for every course", () => {
    const slugs = COURSES.map((c) => c.slug);
    expect(new Set(slugs).size, `duplicate course slug in ${slugs.join(", ")}`).toBe(slugs.length);
  });

  it("has a globally unique slug for every lesson", () => {
    // Global, not per-course: progress rows key on lessonSlug alone, so two
    // lessons in different courses sharing a slug would share completion state.
    const slugs = ALL_LESSONS.map((l) => l.slug);
    expect(new Set(slugs).size, `duplicate lesson slug in ${slugs.join(", ")}`).toBe(slugs.length);
  });

  it("gives every lesson an embeddable video URL", () => {
    // A URL the embed helper cannot parse renders a "video unavailable" state in
    // the UI. That is a fine runtime fallback for a typo, but a shipped constant
    // should never rely on it.
    for (const l of ALL_LESSONS) {
      expect(lessonEmbedUrl(l.videoUrl), `${l.slug}: ${l.videoUrl}`).not.toBeNull();
    }
  });

  it("keeps positive lesson durations", () => {
    for (const l of ALL_LESSONS) {
      expect(l.durationSec, l.slug).toBeGreaterThan(0);
    }
  });
});

describe("lessonEmbedUrl", () => {
  it("converts a YouTube watch URL to a nocookie embed", () => {
    expect(lessonEmbedUrl("https://www.youtube.com/watch?v=abc123")).toBe(
      "https://www.youtube-nocookie.com/embed/abc123"
    );
  });

  it("converts a youtu.be short link", () => {
    expect(lessonEmbedUrl("https://youtu.be/abc123")).toBe(
      "https://www.youtube-nocookie.com/embed/abc123"
    );
  });

  it("converts a Vimeo URL to a player embed", () => {
    expect(lessonEmbedUrl("https://vimeo.com/76979871")).toBe(
      "https://player.vimeo.com/video/76979871"
    );
  });

  it("passes through an already-embed Vimeo URL", () => {
    const embed = "https://player.vimeo.com/video/76979871";
    expect(lessonEmbedUrl(embed)).toBe(embed);
  });

  it("returns null for an unrecognised host", () => {
    // The point is not tidiness: a non-null result here would be an iframe src
    // pointed at an origin the CSP frame-src does not allow, i.e. a blocked frame.
    expect(lessonEmbedUrl("https://evil.example.com/video/1")).toBeNull();
  });

  it("returns null for a non-URL string", () => {
    expect(lessonEmbedUrl("not a url")).toBeNull();
  });

  it("returns null for a Vimeo path that is not a numeric id", () => {
    expect(lessonEmbedUrl("https://vimeo.com/channels/staffpicks")).toBeNull();
  });

  /**
   * The embed helper and the CSP must agree: every host the helper can emit has
   * to be allowed to frame, or the video is produced and then blocked. This
   * asserts the helper's output stays within VIDEO_EMBED_HOSTS. The CSP string
   * itself is hardcoded in next.config.mjs (it loads before path aliases), and
   * learn-csp.test.ts checks that copy against this same list.
   */
  it("only ever emits hosts the CSP allows", () => {
    const samples = [
      "https://www.youtube.com/watch?v=abc123",
      "https://youtu.be/abc123",
      "https://vimeo.com/76979871",
      "https://player.vimeo.com/video/76979871",
    ];
    for (const s of samples) {
      const out = lessonEmbedUrl(s)!;
      const origin = new URL(out).origin;
      expect(VIDEO_EMBED_HOSTS, `${s} -> ${out}`).toContain(origin);
    }
  });
});
