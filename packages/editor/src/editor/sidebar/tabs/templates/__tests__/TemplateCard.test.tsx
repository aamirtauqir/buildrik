/**
 * TemplateCard Tests — pencil screen 4 (card grid item)
 * Covers: renders name, category, thumbnail, selected state, click handler
 */

import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as React from "react";
import { TemplateCard } from "../components/TemplateCard";
import type { TemplateItem } from "../templatesData";

const makeTemplate = (overrides: Partial<TemplateItem> = {}): TemplateItem => ({
  id: "tmpl-hero",
  name: "Hero Landing",
  type: "page",
  icon: "⬜",
  html: "<section></section>",
  category: "landing-page" as never,
  status: "free",
  gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  ...overrides,
});

describe("TemplateCard", () => {
  it("renders the template name", () => {
    render(<TemplateCard template={makeTemplate()} onClick={() => {}} />);
    expect(screen.getByText("Hero Landing")).toBeInTheDocument();
  });

  /* Board 4418:54134 card meta: "N sections · Built-in" / "Saved", then
     "Preview template →". The old category line ("Landing page · Free") and
     the catalogue's "with N pages" claim are gone (G2-093). */
  it("reads N sections · Built-in, and Preview template →", () => {
    render(<TemplateCard template={makeTemplate({ html: "<section></section><section></section>" })} onClick={() => {}} />);
    expect(screen.getByTestId("tpl-card-meta-tmpl-hero")).toHaveTextContent("2 sections · Built-in");
    expect(screen.getByText("Preview template →")).toBeInTheDocument();
    expect(screen.queryByText(/Landing page|pages\b/)).toBeNull();
  });

  it("marks a saved template Saved, and a premium one Pro", () => {
    render(<TemplateCard template={makeTemplate({ id: "mine", category: "my-templates" as never })} onClick={() => {}} />);
    expect(screen.getByTestId("tpl-card-meta-mine")).toHaveTextContent("1 section · Saved");
    render(<TemplateCard template={makeTemplate({ id: "pro", status: "premium" })} onClick={() => {}} />);
    expect(screen.getByTestId("tpl-card-meta-pro")).toHaveTextContent("1 section · Built-in · Pro");
  });

  it("applies tpl-card class to the card element", () => {
    const { container } = render(<TemplateCard template={makeTemplate()} onClick={() => {}} />);
    expect(container.querySelector(".tpl-card")).toBeTruthy();
  });

  it("applies tpl-card--selected class when isSelected is true", () => {
    const { container } = render(
      <TemplateCard template={makeTemplate()} onClick={() => {}} isSelected />
    );
    expect(container.querySelector(".tpl-card--selected")).toBeTruthy();
  });

  it("does not apply tpl-card--selected when isSelected is false", () => {
    const { container } = render(
      <TemplateCard template={makeTemplate()} onClick={() => {}} isSelected={false} />
    );
    expect(container.querySelector(".tpl-card--selected")).toBeFalsy();
  });

  it("calls onClick with template id when card is clicked", () => {
    const handleClick = vi.fn();
    render(<TemplateCard template={makeTemplate()} onClick={handleClick} />);
    fireEvent.click(screen.getByRole("option"));
    expect(handleClick).toHaveBeenCalledWith("tmpl-hero");
  });

  it("calls onClick when Enter key is pressed", () => {
    const handleClick = vi.fn();
    render(<TemplateCard template={makeTemplate()} onClick={handleClick} />);
    fireEvent.keyDown(screen.getByRole("option"), { key: "Enter" });
    expect(handleClick).toHaveBeenCalledWith("tmpl-hero");
  });

  it("renders thumbnail area with tpl-card-thumb class", () => {
    const { container } = render(<TemplateCard template={makeTemplate()} onClick={() => {}} />);
    expect(container.querySelector(".tpl-card-thumb")).toBeTruthy();
  });

  it("sets aria-label to template name", () => {
    render(<TemplateCard template={makeTemplate()} onClick={() => {}} />);
    expect(screen.getByRole("option", { name: /hero landing template/i })).toBeInTheDocument();
  });
});
