import { render, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import * as React from "react";
import { TemplateUsageDrawer } from "../TemplateUsageDrawer";

const sampleUsage = [
  { pageId: "p1", pageName: "Home", appliedAt: "2026-05-08T10:00:00Z" },
  { pageId: "p2", pageName: "About", appliedAt: "2026-05-07T09:00:00Z", version: "1.2.0" },
];

describe("TemplateUsageDrawer", () => {
  it("renders nothing when not open", () => {
    const { container } = render(
      <TemplateUsageDrawer
        open={false}
        onOpenChange={() => {}}
        templateId="t1"
        templateName="Hero"
        usage={[]}
      />
    );
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it("shows Preview tab by default + Used in tab exposes the usage list", () => {
    const { getByText, getByRole } = render(
      <TemplateUsageDrawer
        open
        onOpenChange={() => {}}
        templateId="t1"
        templateName="Hero"
        usage={sampleUsage}
      />
    );
    // §9 prototype-v3: Preview is the default tab (3-tab spec).
    expect(getByRole("tab", { name: "Preview" }).getAttribute("aria-selected")).toBe("true");
    expect(getByText("Used in")).toBeTruthy();
    // Switch to Used in tab → usage list renders.
    fireEvent.click(getByRole("tab", { name: "Used in" }));
    expect(getByText("Home")).toBeTruthy();
    expect(getByText("About")).toBeTruthy();
  });

  it("Preview tab renders 'Open full preview' CTA when onOpenPreview provided", () => {
    const onOpenPreview = vi.fn();
    const { getByText } = render(
      <TemplateUsageDrawer
        open
        onOpenChange={() => {}}
        templateId="t1"
        templateName="Hero"
        usage={sampleUsage}
        onOpenPreview={onOpenPreview}
      />
    );
    fireEvent.click(getByText(/Open full preview/));
    expect(onOpenPreview).toHaveBeenCalledTimes(1);
  });

  it("shows version chip when a usage has a version", () => {
    const { getByText, getByRole } = render(
      <TemplateUsageDrawer
        open
        onOpenChange={() => {}}
        templateId="t1"
        templateName="Hero"
        usage={sampleUsage}
      />
    );
    fireEvent.click(getByRole("tab", { name: "Used in" }));
    expect(getByText(/1\.2\.0/)).toBeTruthy();
  });

  it("shows empty state when usage list is empty", () => {
    const { getByText, getByRole } = render(
      <TemplateUsageDrawer
        open
        onOpenChange={() => {}}
        templateId="t1"
        templateName="Hero"
        usage={[]}
      />
    );
    fireEvent.click(getByRole("tab", { name: "Used in" }));
    expect(getByText(/not applied to any page/i)).toBeTruthy();
  });

  it("clicking a page row calls onJumpToPage with pageId", () => {
    const onJumpToPage = vi.fn();
    const { getByText, getByRole } = render(
      <TemplateUsageDrawer
        open
        onOpenChange={() => {}}
        templateId="t1"
        templateName="Hero"
        usage={sampleUsage}
        onJumpToPage={onJumpToPage}
      />
    );
    fireEvent.click(getByRole("tab", { name: "Used in" }));
    fireEvent.click(getByText("Home"));
    expect(onJumpToPage).toHaveBeenCalledWith("p1");
  });

  it("Versions tab renders empty-state when usage list is empty", () => {
    const { getByText } = render(
      <TemplateUsageDrawer
        open
        onOpenChange={() => {}}
        templateId="t1"
        templateName="Hero"
        usage={[]}
      />
    );
    fireEvent.click(getByText("Versions"));
    expect(getByText(/no applies yet/i)).toBeTruthy();
  });

  it("Versions tab renders 'Current version' chip when currentVersion provided", () => {
    const { getByText, getByTestId } = render(
      <TemplateUsageDrawer
        open
        onOpenChange={() => {}}
        templateId="t1"
        templateName="Hero"
        usage={[]}
        currentVersion="1.2.0"
      />
    );
    fireEvent.click(getByText("Versions"));
    const strip = getByTestId("versions-current");
    expect(strip.textContent).toMatch(/v1\.2\.0/);
  });

  it("Versions tab renders timeline sorted by appliedAt DESC", () => {
    const { getByText, getAllByRole } = render(
      <TemplateUsageDrawer
        open
        onOpenChange={() => {}}
        templateId="t1"
        templateName="Hero"
        usage={sampleUsage}
        currentVersion="1.2.0"
      />
    );
    fireEvent.click(getByText("Versions"));
    const items = getAllByRole("listitem");
    expect(items.length).toBeGreaterThanOrEqual(2);
    // sampleUsage: Home(2026-05-08) before About(2026-05-07) when DESC.
    // First two listitems belong to the Versions panel (no other lists in
    // this view).
    expect(items[0].textContent).toMatch(/Home/);
    expect(items[1].textContent).toMatch(/About/);
  });

  it("Versions tab flags stale applications when applied version != current", () => {
    const { getByText } = render(
      <TemplateUsageDrawer
        open
        onOpenChange={() => {}}
        templateId="t1"
        templateName="Hero"
        usage={[
          { pageId: "p1", pageName: "Home", appliedAt: "2026-05-08T10:00:00Z", version: "1.0.0" },
        ]}
        currentVersion="1.2.0"
      />
    );
    fireEvent.click(getByText("Versions"));
    expect(getByText(/update available/i)).toBeTruthy();
  });

  it("Versions tab does NOT flag stale when versions match", () => {
    const { getByText, queryByText } = render(
      <TemplateUsageDrawer
        open
        onOpenChange={() => {}}
        templateId="t1"
        templateName="Hero"
        usage={[
          { pageId: "p1", pageName: "Home", appliedAt: "2026-05-08T10:00:00Z", version: "1.2.0" },
        ]}
        currentVersion="1.2.0"
      />
    );
    fireEvent.click(getByText("Versions"));
    expect(queryByText(/update available/i)).toBeNull();
  });

  it("close button calls onOpenChange(false)", () => {
    const onOpenChange = vi.fn();
    const { getByLabelText } = render(
      <TemplateUsageDrawer
        open
        onOpenChange={onOpenChange}
        templateId="t1"
        templateName="Hero"
        usage={[]}
      />
    );
    fireEvent.click(getByLabelText(/close drawer/i));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
