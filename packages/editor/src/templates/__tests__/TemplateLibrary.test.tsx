/**
 * TemplateLibrary — modal tabs / search / category pills, default-template
 * data integrity (15 items), thumbnail XSS guard (http/https only), and the
 * localStorage MY_TEMPLATES load / corrupt-recovery / delete-persist paths.
 *
 * composer prop stays null → useTemplateManager no-ops and the component
 * exercises its localStorage fallback (the shipped default in the studio).
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, cleanup } from "@testing-library/react";
import { STORAGE_KEYS } from "../../shared/constants/config";
import { TemplateLibrary, type Template } from "../TemplateLibrary";

beforeEach(() => {
  localStorage.clear();
  document.getElementById("vibcoder-overlay-root")?.remove();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function renderLibrary(overrides: Partial<React.ComponentProps<typeof TemplateLibrary>> = {}) {
  const onClose = vi.fn();
  const onSelect = vi.fn();
  const utils = render(
    <TemplateLibrary isOpen onClose={onClose} onSelect={onSelect} {...overrides} />
  );
  return { onClose, onSelect, ...utils };
}

const templateCards = () => screen.getAllByRole("button", { name: /^Use template / });

describe("TemplateLibrary — tabs + default data integrity", () => {
  it("renders the three tabs: Library, Sections, My Templates", () => {
    renderLibrary();
    expect(screen.getByText(/📚 Library/)).toBeInTheDocument();
    expect(screen.getByText(/🧱 Sections/)).toBeInTheDocument();
    expect(screen.getByText(/📁 My Templates/)).toBeInTheDocument();
  });

  it("ships exactly 15 default templates, each rendered with name + description", () => {
    renderLibrary();
    expect(templateCards()).toHaveLength(15);
    // Spot-check the full-page + section entries render name AND description.
    expect(screen.getByText("Modern Landing")).toBeInTheDocument();
    expect(screen.getByText("Modern landing page with hero section")).toBeInTheDocument();
    expect(screen.getByText("Blank Page")).toBeInTheDocument();
    expect(screen.getByText("Start from scratch")).toBeInTheDocument();
    expect(screen.getByText("FAQ Section")).toBeInTheDocument();
  });

  it("derives category pills from the data: all + 5 distinct categories", () => {
    renderLibrary();
    const pills = screen.getAllByRole("button", { name: /^Filter .* templates$/ });
    expect(pills.map((p) => p.textContent)).toEqual([
      "all",
      "Basic",
      "Landing Pages",
      "Portfolio",
      "Business",
      "Sections",
    ]);
  });

  it("category pill filters the grid (Sections → 9 section templates)", () => {
    renderLibrary();
    fireEvent.click(screen.getByRole("button", { name: "Filter Sections templates" }));
    expect(templateCards()).toHaveLength(9);
    expect(screen.queryByText("Modern Landing")).not.toBeInTheDocument();
  });

  it("search filters by name and description (case-insensitive)", () => {
    renderLibrary();
    const search = screen.getByPlaceholderText("Search templates...");
    fireEvent.change(search, { target: { value: "portfolio" } });
    expect(templateCards()).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Use template Portfolio" })).toBeInTheDocument();

    // description match: only Blank Page says "Start from scratch"
    fireEvent.change(search, { target: { value: "scratch" } });
    expect(templateCards()).toHaveLength(1);
    expect(screen.getByText("Blank Page")).toBeInTheDocument();

    fireEvent.change(search, { target: { value: "zzz-no-match" } });
    expect(screen.getByText("No templates match your search")).toBeInTheDocument();
  });

  it("selecting a template shows the loader then fires onSelect + onClose after 500ms", () => {
    vi.useFakeTimers();
    const { onSelect, onClose } = renderLibrary();
    fireEvent.click(screen.getByRole("button", { name: "Use template Modern Landing" }));

    expect(screen.getByText("Loading template...")).toBeInTheDocument();
    expect(onSelect).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0][0]).toMatchObject({ id: "landing-1", name: "Modern Landing" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("TemplateLibrary — thumbnail XSS guard (http/https only)", () => {
  const withThumb = (thumbnail: string): Template[] => [
    { id: "x1", name: "Guard", category: "Basic", thumbnail, html: "<div>x</div>" },
  ];

  it("renders a valid https thumbnail as background (no text fallback)", () => {
    renderLibrary({ templates: withThumb("https://example.com/shot.png") });
    // Valid URL path: the raw thumbnail string is NOT rendered as text.
    expect(screen.queryByText("https://example.com/shot.png")).not.toBeInTheDocument();
  });

  it("rejects javascript: URLs — rendered as inert text, never as url()", () => {
    const { container } = renderLibrary({ templates: withThumb("javascript:alert(1)") });
    // Fallback span renders the string as plain text (safe).
    expect(screen.getByText("javascript:alert(1)")).toBeInTheDocument();
    expect(container.ownerDocument.body.innerHTML).not.toContain("url(javascript");
  });

  it("rejects data: URLs the same way", () => {
    const { container } = renderLibrary({
      templates: withThumb("data:text/html,<script>alert(1)</script>"),
    });
    expect(container.ownerDocument.body.innerHTML).not.toContain("url(data:");
  });

  it("treats short strings (emoji) as icon fallback, and empty as the 📄 default", () => {
    renderLibrary({
      templates: [
        { id: "e1", name: "Emoji", category: "Basic", thumbnail: "🚀", html: "" },
        { id: "e2", name: "None", category: "Basic", thumbnail: "", html: "" },
      ],
    });
    expect(screen.getByText("🚀")).toBeInTheDocument();
    expect(screen.getByText("📄")).toBeInTheDocument();
  });
});

describe("TemplateLibrary — Sections tab", () => {
  it("inserting a section converts it to Template shape and closes", () => {
    const { onSelect, onClose } = renderLibrary();
    fireEvent.click(screen.getByText(/🧱 Sections/));
    fireEvent.click(screen.getByText("Simple Nav"));

    expect(onSelect).toHaveBeenCalledTimes(1);
    const arg = onSelect.mock.calls[0][0] as Template;
    expect(arg.id).toBe("nav-simple");
    expect(arg.category).toBe("navigation"); // SectionTemplate.type → Template.category
    expect(arg.html).toMatch(/^<nav/);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("TemplateLibrary — My Templates localStorage fallback", () => {
  const saved: Template[] = [
    { id: "m1", name: "My Saved One", category: "Custom", thumbnail: "", html: "<div>1</div>" },
    { id: "m2", name: "My Saved Two", category: "Custom", thumbnail: "", html: "<div>2</div>" },
  ];

  it("loads saved templates from STORAGE_KEYS.MY_TEMPLATES when opened without a composer", () => {
    localStorage.setItem(STORAGE_KEYS.MY_TEMPLATES, JSON.stringify(saved));
    renderLibrary();
    fireEvent.click(screen.getByText(/📁 My Templates/));
    expect(screen.getByText("My Saved One")).toBeInTheDocument();
    expect(screen.getByText("My Saved Two")).toBeInTheDocument();
  });

  it("recovers from corrupt localStorage JSON — no crash, empty state shown", () => {
    localStorage.setItem(STORAGE_KEYS.MY_TEMPLATES, "{{{not-json");
    renderLibrary();
    fireEvent.click(screen.getByText(/📁 My Templates/));
    expect(screen.getByText("No saved templates")).toBeInTheDocument();
  });

  it("deleting a template (double-click confirm) persists the pruned list back to localStorage", () => {
    localStorage.setItem(STORAGE_KEYS.MY_TEMPLATES, JSON.stringify(saved));
    renderLibrary();
    fireEvent.click(screen.getByText(/📁 My Templates/));

    const deleteBtn = screen.getAllByTitle("Delete")[0];
    fireEvent.click(deleteBtn); // arm
    expect(screen.getByText("Click delete again to confirm")).toBeInTheDocument();
    // Still persisted — nothing deleted yet.
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.MY_TEMPLATES)!)).toHaveLength(2);

    fireEvent.click(deleteBtn); // confirm
    const remaining = JSON.parse(localStorage.getItem(STORAGE_KEYS.MY_TEMPLATES)!) as Template[];
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe("m2");
    expect(screen.queryByText("My Saved One")).not.toBeInTheDocument();
  });

  it("renaming a local template persists the new name", () => {
    localStorage.setItem(STORAGE_KEYS.MY_TEMPLATES, JSON.stringify([saved[0]]));
    renderLibrary();
    fireEvent.click(screen.getByText(/📁 My Templates/));

    fireEvent.click(screen.getByTitle("Rename"));
    const input = screen.getByDisplayValue("My Saved One");
    fireEvent.change(input, { target: { value: "Renamed" } });
    fireEvent.keyDown(input, { key: "Enter" });

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.MY_TEMPLATES)!) as Template[];
    expect(stored[0].name).toBe("Renamed");
    expect(screen.getByText("Renamed")).toBeInTheDocument();
  });
});
