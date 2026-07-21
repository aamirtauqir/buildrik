import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TemplateFilterRail } from "../template-filter-rail";
import { DEFAULT_TEMPLATE_FILTERS } from "@/app/dashboard/templates/filters";

describe("TemplateFilterRail", () => {
  it("renders all category options", () => {
    render(<TemplateFilterRail filters={DEFAULT_TEMPLATE_FILTERS} onChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Portfolio" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Restaurant" })).toBeTruthy();
  });

  it("emits the field and resets page to 1 on select", () => {
    const onChange = vi.fn();
    render(<TemplateFilterRail filters={{ ...DEFAULT_TEMPLATE_FILTERS, page: 4 }} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Business" }));
    expect(onChange).toHaveBeenCalledWith({ category: "BUSINESS", page: 1 });
  });

  it("emits difficulty selection", () => {
    const onChange = vi.fn();
    render(<TemplateFilterRail filters={DEFAULT_TEMPLATE_FILTERS} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Advanced" }));
    expect(onChange).toHaveBeenCalledWith({ difficulty: "ADVANCED", page: 1 });
  });
});
