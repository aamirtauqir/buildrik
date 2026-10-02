import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * The editor canvas renders Map and Lottie embeds as <iframe>s
 * (packages/editor/src/shared/utils/embed/parseEmbedUrl.ts rebuilds every src
 * on the provider's own embed host). YouTube and Vimeo ride on the Learn
 * hosts (learn-csp.test.ts); Google Maps (www.google.com/maps/embed) and
 * LottieFiles (lottie.host/embed) need their own frame-src entries or the
 * canvas shows a blocked frame. Exactly those two hosts — no wildcard.
 */
const configPath = resolve(process.cwd(), "packages/dashboard/next.config.mjs");

describe("CSP frame-src — editor embeds", () => {
  const config = readFileSync(configPath, "utf8");

  it("declares exactly www.google.com and lottie.host for the editor's embeds", () => {
    const m = config.match(/const editorEmbedFrameSrc = "([^"]*)";/);
    expect(m, "editorEmbedFrameSrc assignment not found in next.config.mjs").toBeTruthy();
    expect(m![1].split(/\s+/).sort()).toEqual(["https://lottie.host", "https://www.google.com"]);
  });

  it("is wired into the frame-src directive beside the video hosts", () => {
    expect(config).toMatch(/frame-src 'self' \$\{videoFrameSrc\} \$\{editorEmbedFrameSrc\}/);
  });
});
