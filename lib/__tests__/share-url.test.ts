/**
 * A share link a client can actually open.
 *
 * These links used to point at `preview.buildrick.app`, a host with no DNS
 * record — every link handed to a client was dead. That was fixed by building
 * them off NEXT_PUBLIC_APP_URL, which is baked at build time and, when it is
 * not set at build, leaves `${undefined ?? ""}/share/<token>` — a bare path.
 * Pasted into an email it is not a link at all, and the person who copied it
 * has no way to tell: the modal shows something that looks right.
 *
 * In the browser the correct origin is always known, so there is no reason to
 * emit a relative one.
 */
import { describe, it, expect, afterEach } from "vitest";
import { shareUrl } from "../utils";

const ORIGINAL = process.env.NEXT_PUBLIC_APP_URL;

afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
  else process.env.NEXT_PUBLIC_APP_URL = ORIGINAL;
});

describe("shareUrl", () => {
  it("uses the configured origin when there is one", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://app.buildrick.io";
    expect(shareUrl("t_1")).toBe("https://app.buildrick.io/share/t_1");
  });

  it("does not hand back a bare path when the origin was never baked in", () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    // jsdom serves the page from an origin; that is the right answer here.
    expect(shareUrl("t_1")).toBe(`${window.location.origin}/share/t_1`);
  });

  it("treats an empty string the same as unset", () => {
    process.env.NEXT_PUBLIC_APP_URL = "";
    expect(shareUrl("t_1")).toBe(`${window.location.origin}/share/t_1`);
  });

  it("does not double the slash when the origin carries a trailing one", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://app.buildrick.io/";
    expect(shareUrl("t_1")).toBe("https://app.buildrick.io/share/t_1");
  });
});
