import { describe, it, expect, vi, beforeEach } from "vitest";

const fetchPublicText = vi.fn();
vi.mock("@/lib/url-guard", () => ({ fetchPublicText: (...a: unknown[]) => fetchPublicText(...a) }));

import { readBrandFromHtml, tallyBrandCss, extractBrandFromUrl, BrandExtractError } from "../brand-extract.service";

beforeEach(() => fetchPublicText.mockReset());

describe("readBrandFromHtml", () => {
  it("collects <style> blocks, style attributes, stylesheet links and Google Fonts families", () => {
    const html = `<head><style>.a{color:#1A56DB}</style>
      <link rel="stylesheet" href="/main.css"><link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter&display=swap" rel="stylesheet">
      <link rel="icon" href="/x.png"></head><body style="background:#fff"></body>`;
    const out = readBrandFromHtml(html);
    expect(out.css).toEqual([".a{color:#1A56DB}", "background:#fff"]);
    expect(out.stylesheets).toEqual(["/main.css", "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter&display=swap"]);
    expect(out.googleFamilies).toEqual(["Playfair Display", "Inter"]);
  });
});

describe("tallyBrandCss", () => {
  it("counts colour literals and font families, splitting heading and body use", () => {
    const out = tallyBrandCss([
      "h1,h2{font-family:'Tiempos Headline',Georgia,serif;color:#1A56DB}",
      "body{font-family:Inter,sans-serif;color:rgb(17,24,39)} a{color:#1a56db} .x{color:var(--brand)}",
    ], ["Inter"]);
    expect(out.colors).toEqual(expect.arrayContaining([{ value: "#1a56db", count: 2 }, { value: "rgb(17,24,39)", count: 1 }]));
    expect(out.colors.some((c) => c.value.includes("var("))).toBe(false);
    expect(out.fonts.find((f) => f.family === "Tiempos Headline")).toMatchObject({ generic: "serif", heading: 1 });
    expect(out.fonts.find((f) => f.family === "Inter")).toMatchObject({ body: 1 });
  });

  it("drops family names that are not plain names (font names are sanitized, spec D17)", () => {
    const out = tallyBrandCss(["p{font-family:\"Evil<script>\",serif} q{font-family:var(--f)}"], []);
    expect(out.fonts).toEqual([]);
  });
});

describe("extractBrandFromUrl", () => {
  it("fetches the page then up to 4 stylesheets on one deadline, skipping a refused one", async () => {
    fetchPublicText
      .mockResolvedValueOnce({ url: new URL("https://acme.test/"), text: `<link rel="stylesheet" href="/a.css"><link rel="stylesheet" href="http://10.0.0.1/b.css">` })
      .mockResolvedValueOnce({ url: new URL("https://acme.test/a.css"), text: "a{color:#C2410C}" })
      .mockRejectedValueOnce(new Error("BLOCKED_URL"));
    const out = await extractBrandFromUrl("https://acme.test/");
    expect(out.colors).toEqual([{ value: "#c2410c", count: 1 }]);
    const deadlines = fetchPublicText.mock.calls.map((c) => c[1].deadline);
    expect(new Set(deadlines).size).toBe(1);
  });

  it.each([
    ["BLOCKED_URL", "BLOCKED"], ["INVALID_URL", "BLOCKED"], ["FETCH_FAILED", "BLOCKED"],
    ["TIMEOUT", "TIMEOUT"], ["TOO_LARGE", "TIMEOUT"],
  ])("maps %s on the page to %s", async (raw, code) => {
    fetchPublicText.mockRejectedValueOnce(new Error(raw));
    await expect(extractBrandFromUrl("https://acme.test/")).rejects.toMatchObject({ code });
    fetchPublicText.mockRejectedValueOnce(new Error(raw));
    await expect(extractBrandFromUrl("https://acme.test/")).rejects.toBeInstanceOf(BrandExtractError);
  });

  it("needs no OPENAI_API_KEY", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    fetchPublicText.mockResolvedValueOnce({ url: new URL("https://acme.test/"), text: "<style>a{color:#0E7490}</style>" });
    await expect(extractBrandFromUrl("https://acme.test/")).resolves.toMatchObject({ colors: [{ value: "#0e7490", count: 1 }] });
    vi.unstubAllEnvs();
  });
});
