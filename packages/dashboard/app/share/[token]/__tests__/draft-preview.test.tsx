/**
 * The draft preview's page menu names pages by their NAME (it showed slugs —
 * "Home-copy-2"), and the chosen page lives in `?page=<slug>`.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";

const pages = [
  { path: "index.html", html: "<p>home</p>", name: "Home", slug: "home" },
  { path: "home-copy.html", html: "<p>copy</p>", name: "Home Copy", slug: "home-copy" },
  { path: "menu.html", html: "<p>menu</p>", name: "Our menu", slug: "menu" },
];

vi.mock("@buildrik/editor", () => ({
  projectDataFromRows: () => ({}),
  renderProjectPages: () => Promise.resolve(pages),
}));

import { DraftPreview, pageIndexForSlug } from "../draft-preview";

const rows = { site: {}, pages: [], siteColumns: {}, siteFonts: [] };

afterEach(() => {
  cleanup();
  window.history.replaceState(null, "", "/share/tok");
});

describe("pageIndexForSlug", () => {
  it("finds the page; unknown or missing → first", () => {
    expect(pageIndexForSlug(pages, "menu")).toBe(2);
    expect(pageIndexForSlug(pages, "nope")).toBe(0);
    expect(pageIndexForSlug(pages, null)).toBe(0);
  });
});

describe("DraftPreview", () => {
  it("opens the ?page= page and names pages by name, not slug", async () => {
    render(<DraftPreview siteName="Bella" rows={rows} initialPage="menu" />);
    const trigger = await screen.findByRole("button", { name: /Page: Our menu/ });
    fireEvent.click(trigger);
    expect(screen.getAllByRole("menuitem").map((m) => m.textContent)).toEqual(["Home", "Home Copy", "Our menu"]);
    expect(screen.getByTitle("Bella — draft preview").getAttribute("srcdoc")).toBe("<p>menu</p>");
  });

  it("an unknown ?page= opens the first page", async () => {
    render(<DraftPreview siteName="Bella" rows={rows} initialPage="gone" />);
    await screen.findByRole("button", { name: /Page: Home\./ });
  });

  it("picking a page writes its slug to the URL; the first page clears it", async () => {
    window.history.replaceState(null, "", "/share/tok");
    render(<DraftPreview siteName="Bella" rows={rows} />);
    fireEvent.click(await screen.findByRole("button", { name: /Change page/ }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Home Copy" }));
    await waitFor(() => expect(window.location.search).toBe("?page=home-copy"));
    fireEvent.click(screen.getByRole("button", { name: /Change page/ }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Home" }));
    await waitFor(() => expect(window.location.search).toBe(""));
  });
});
