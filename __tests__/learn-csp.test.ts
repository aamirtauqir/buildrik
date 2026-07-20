import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { VIDEO_EMBED_HOSTS } from "@buildrik/shared/schemas/learn";

/**
 * The CSP frame-src and the embed helper's host list must match.
 *
 * next.config.mjs is loaded by the Next config loader before path aliases
 * resolve, so it cannot import VIDEO_EMBED_HOSTS — the frame-src hosts are
 * hardcoded there, with a comment saying a test guards the sync. This is that
 * test. If someone adds Vimeo to the helper but not the config, every Vimeo
 * embed is produced and then blocked at runtime with no error at build time;
 * this fails instead.
 */

// vitest runs from the repo root; import.meta.url is not a file: URL here.
const configPath = resolve(process.cwd(), "packages/dashboard/next.config.mjs");

describe("CSP frame-src", () => {
  it("allows exactly the hosts the embed helper can emit", () => {
    const config = readFileSync(configPath, "utf8");
    const line = config.split("\n").find((l) => l.includes("videoFrameSrc") && l.includes("="));
    expect(line, "videoFrameSrc assignment not found in next.config.mjs").toBeTruthy();

    for (const host of VIDEO_EMBED_HOSTS) {
      expect(line, `frame-src is missing ${host}`).toContain(host);
    }
  });

  it("is actually wired into the CSP string", () => {
    const config = readFileSync(configPath, "utf8");
    // The assignment existing is not enough — it has to be interpolated into the
    // policy, or the hosts are declared and never sent.
    expect(config).toMatch(/frame-src 'self' \$\{videoFrameSrc\}/);
  });
});
