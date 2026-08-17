/**
 * Board 642:2556's consequence line names the page without stuttering.
 *
 * It read `the current {pageName} page content`, which is correct only when the
 * page is named like a noun — "the current Home page content" — and breaks on
 * the name every new site starts with: "the current Page 1 page content". The
 * default page IS "Page 1", so the broken reading was the common one.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { render, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TemplateApplyModal } from "../TemplateApplyModal";

afterEach(cleanup);

const TEMPLATE = {
  id: "t1",
  name: "SaaS Landing",
  type: "page",
  status: "free" as const,
  sectionCount: 3,
  pageCount: 1,
  html: "<section>hi</section>",
};

const open = (pageName?: string) =>
  render(
    <TemplateApplyModal
      template={TEMPLATE as never}
      open
      pageName={pageName}
      onApply={vi.fn()}
      onClose={vi.fn()}
    />,
  );

describe("TemplateApplyModal — the consequence line", () => {
  it("names the page in an 'of X' clause", () => {
    open("Page 1");
    expect(document.body.textContent).toMatch(/Applying replaces the content of Page 1\./);
  });

  it("never says 'page' twice in a row", () => {
    open("Page 1");
    expect(document.body.textContent).not.toMatch(/Page 1 page content/);
  });

  it("reads for a named page too", () => {
    open("Home");
    expect(document.body.textContent).toMatch(/Applying replaces the content of Home\./);
  });

  it("falls back to the generic sentence with no page name", () => {
    open(undefined);
    expect(document.body.textContent).toMatch(/Applying replaces the current page content\./);
  });

  it("keeps the way back, which is the half that matters", () => {
    open("Page 1");
    expect(document.body.textContent).toMatch(/version history keeps the previous state/);
  });
});
