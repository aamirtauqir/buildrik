/**
 * parseEmbedUrl — only allowlisted providers become an iframe src, and the
 * src is rebuilt on the provider's embed host, never the pasted string.
 * @license BSD-3-Clause
 */
import { describe, expect, it } from "vitest";
import { parseEmbedUrl } from "../parseEmbedUrl";

describe("parseEmbedUrl — video", () => {
  it.each([
    "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
    "https://youtu.be/aqz-KE-bpKQ",
    "youtu.be/aqz-KE-bpKQ",
    "https://m.youtube.com/watch?v=aqz-KE-bpKQ&t=30",
    "https://www.youtube.com/embed/aqz-KE-bpKQ",
    "https://www.youtube.com/shorts/aqz-KE-bpKQ",
    "https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ",
  ])("%s → YouTube on the no-cookie host", (url) => {
    const out = parseEmbedUrl(url, "video");
    expect(out?.label).toBe("YouTube");
    expect(out?.src).toBe("https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ?playsinline=1");
  });

  it("carries autoplay, muted and controls into the player params", () => {
    const yt = parseEmbedUrl("https://youtu.be/aqz-KE-bpKQ", "video", { autoplay: true, muted: true, controls: false });
    expect(yt?.src).toBe("https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ?autoplay=1&mute=1&controls=0&playsinline=1");
    const vm = parseEmbedUrl("https://vimeo.com/76979871", "video", { autoplay: true, muted: true });
    expect(vm?.src).toBe("https://player.vimeo.com/video/76979871?autoplay=1&muted=1");
  });

  it("reads Vimeo page and player links, keeping a private hash", () => {
    expect(parseEmbedUrl("https://vimeo.com/76979871", "video")).toEqual({
      provider: "vimeo",
      label: "Vimeo",
      src: "https://player.vimeo.com/video/76979871",
    });
    expect(parseEmbedUrl("https://vimeo.com/76979871/a1b2c3d4e5", "video")?.src).toBe(
      "https://player.vimeo.com/video/76979871?h=a1b2c3d4e5",
    );
    expect(parseEmbedUrl("https://player.vimeo.com/video/76979871", "video")?.label).toBe("Vimeo");
  });

  it.each([
    "javascript:alert(1)",
    "JaVaScRiPt:alert(document.cookie)",
    "data:text/html,<script>alert(1)</script>",
    "https://evil.example/watch?v=aqz-KE-bpKQ",
    "https://youtube.com.evil.io/watch?v=aqz-KE-bpKQ",
    "https://www.youtube.com/watch?v=aqz\"><script>",
    "https://www.youtube.com/watch?v=short",
    "https://vimeo.com/not-a-number",
    "ftp://youtu.be/aqz-KE-bpKQ",
    "",
    "   ",
  ])("refuses %j", (url) => {
    expect(parseEmbedUrl(url, "video")).toBeNull();
  });

  it("a map link is not a video", () => {
    expect(parseEmbedUrl("https://www.google.com/maps/place/Rome", "video")).toBeNull();
  });
});

describe("parseEmbedUrl — map", () => {
  it("turns a typed address into a Google Maps search embed", () => {
    expect(parseEmbedUrl("Via Roma 1, Turin", "map")).toEqual({
      provider: "google-maps",
      label: "Google Maps",
      src: "https://www.google.com/maps?q=Via+Roma+1%2C+Turin&output=embed",
    });
  });

  it("reads place, coordinates and embed links", () => {
    expect(parseEmbedUrl("https://www.google.com/maps/place/Colosseum/@41.89,12.49,17z", "map")?.src).toBe(
      "https://www.google.com/maps?q=Colosseum&output=embed",
    );
    expect(parseEmbedUrl("https://www.google.com/maps/@41.8902,12.4922,17z", "map")?.src).toBe(
      "https://www.google.com/maps?q=41.8902%2C12.4922&output=embed",
    );
    expect(parseEmbedUrl("https://www.google.com/maps/embed?pb=!1m18!1m12", "map")?.src).toBe(
      "https://www.google.com/maps/embed?pb=%211m18%211m12",
    );
  });

  it.each(["javascript:alert(1)", "https://evil.example/maps?q=Rome", "https://goo.gl/maps/abc"])("refuses %j", (url) => {
    expect(parseEmbedUrl(url, "map")).toBeNull();
  });
});

describe("parseEmbedUrl — lottie", () => {
  const ID = "4db68bbd-31f6-4cd8-84eb-189de081159a";
  it("reads a lottie.host file or embed link onto the embed host", () => {
    for (const url of [`https://lottie.host/${ID}/wave.json`, `https://lottie.host/embed/${ID}/wave.lottie`]) {
      const out = parseEmbedUrl(url, "lottie");
      expect(out?.label).toBe("LottieFiles");
      expect(out?.src).toMatch(new RegExp(`^https://lottie\\.host/embed/${ID}/wave\\.(json|lottie)$`));
    }
  });

  it.each(["https://evil.example/anim.json", `https://lottie.host/${"x".repeat(36)}/a.json`, "javascript:alert(1)"])(
    "refuses %j",
    (url) => {
      expect(parseEmbedUrl(url, "lottie")).toBeNull();
    },
  );
});
