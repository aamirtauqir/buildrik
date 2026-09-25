/**
 * The Clone card primitives (3397:32011 / 3953:26363 / 3953:26503 /
 * 3950:26309) every Settings screen composes from — the contract E2's
 * screens build on.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import * as React from "react";
import { Field, Input, LoadCard, SaveErrorBanner, Section, Select, Textarea } from "../shared";

afterEach(cleanup);

describe("Section — the card", () => {
  it("is a titled card anchored by its own title, with a two-column field grid", () => {
    render(
      <Section title="Site identity" desc="Name, favicon, language.">
        <Field label="Site name">
          <Input id="site-name" />
        </Field>
        <div data-testid="wide">a table</div>
      </Section>,
    );
    const card = screen.getByTestId("set-card-site-identity");
    expect(card.tagName).toBe("SECTION");
    expect(card.className).toContain("tw:rounded-[var(--bk-radius-card)]");
    expect(card.className).toContain("tw:p-6");
    const title = screen.getByTestId("set-card-title-site-identity");
    expect(title.textContent).toBe("Site identity");
    expect(title.className).toContain("tw:font-semibold");
    expect(title.className).toContain("var(--bk-text-16)");
    expect(screen.getByText("Name, favicon, language.")).toBeTruthy();
    const grid = screen.getByTestId("wide").parentElement as HTMLElement;
    expect(grid.className).toContain("tw:grid-cols-2");
    // Anything that is not a Field takes the whole row.
    expect(grid.className).toContain("[&>*:not([data-set-field])]:col-span-full");
    expect(screen.getByTestId("set-field-site-name").hasAttribute("data-set-field")).toBe(true);
  });

  it("an empty title renders no heading and no junk anchor", () => {
    const { container } = render(
      <Section title="">
        <span>save row</span>
      </Section>,
    );
    expect(container.querySelector("h3")).toBeNull();
    expect(container.querySelector('[data-testid^="set-card-"]')).toBeNull();
  });

  it("`anchor` pins the id when the title carries data", () => {
    render(
      <Section title="Enabled locales (2)" anchor="locales">
        <span />
      </Section>,
    );
    expect(screen.getByTestId("set-card-locales")).toBeTruthy();
  });
});

describe("Field", () => {
  it("labels its control at 11 (4418:128657) and can span the row", () => {
    render(
      <>
        <Field label="Meta title" htmlFor="seo-meta-title">
          <Input id="seo-meta-title" />
        </Field>
        <Field label="Head scripts" span="full">
          <Textarea id="code-head" />
        </Field>
      </>,
    );
    const label = screen.getByTestId("set-field-label-meta-title");
    expect(label.getAttribute("for")).toBe("seo-meta-title");
    expect(label.className).toContain("var(--bk-text-11)");
    expect(screen.getByTestId("set-field-meta-title").className).not.toContain("tw:col-span-full");
    expect(screen.getByTestId("set-field-head-scripts").className).toContain("tw:col-span-full");
  });

  it("`anchor` disambiguates two fields with the same label", () => {
    render(
      <>
        <Field label="Policy" anchor="x-frame-policy">
          <Input />
        </Field>
        <Field label="Policy" anchor="referrer-policy">
          <Input />
        </Field>
      </>,
    );
    expect(screen.getByTestId("set-field-x-frame-policy")).toBeTruthy();
    expect(screen.getByTestId("set-field-referrer-policy")).toBeTruthy();
  });
});

describe("controls — density 32", () => {
  it("Input is chrome-ui's 32-tall box and paints aria-invalid red", () => {
    render(<Input aria-invalid="true" data-testid="in" />);
    const input = screen.getByTestId("in");
    expect(input.className).toContain("tw:h-8");
    expect(input.className).toContain("tw:aria-invalid:border-[var(--bk-error)]");
    expect(input.className).toContain("tw:aria-invalid:focus:border-[var(--bk-error)]");
  });

  it("Select is 32 tall on the radius-md, white on the border-input hairline", () => {
    render(
      <Select data-testid="sel">
        <option>English</option>
      </Select>,
    );
    const select = screen.getByTestId("sel");
    expect(select.className).toContain("tw:h-8");
    expect(select.className).toContain("tw:py-0");
    expect(select.className).toContain("tw:rounded-[var(--bk-radius-md)]");
    // 4418:127966 / 4418:128657: selects are NOT filled — white, like chrome-ui's base.
    expect(select.className).not.toContain("tw:bg-[var(--bk-gray-50)]");
    expect(select.className).not.toContain("rounded-lg");
  });

  it("Textarea keeps the caller's className on the control itself", () => {
    render(<Textarea data-testid="ta" className="tw:font-mono" />);
    const ta = screen.getByTestId("ta");
    expect(ta.className).toContain("tw:font-mono");
    expect(ta.className).toContain("tw:rounded-[var(--bk-radius-md)]");
    expect(ta.className).toContain("tw:border-[var(--bk-border-input)]");
  });
});

describe("LoadCard", () => {
  const props = {
    title: "Site identity",
    line: "Site name, favicon, language and social profiles.",
    errorLine: "Couldn't load your site settings. Check your connection, then try again.",
  };

  it("loading: eyebrow, line, `Loading…`, no button", () => {
    render(<LoadCard {...props} state="loading" />);
    const card = screen.getByTestId("set-load-card");
    expect(card.getAttribute("aria-busy")).toBe("true");
    expect(card.getAttribute("data-state")).toBe("loading");
    expect(screen.getByTestId("set-load-title").textContent).toBe("Site identity");
    expect(screen.getByTestId("set-load-title").className).toContain("tw:uppercase");
    expect(screen.getByTestId("set-load-line").textContent).toBe(props.line);
    expect(screen.getByText("Loading…")).toBeTruthy();
    expect(screen.queryByTestId("set-load-retry")).toBeNull();
  });

  it("error: the failure line and a 32px `Try again` that re-runs the load", () => {
    const onRetry = vi.fn();
    render(<LoadCard {...props} state="error" onRetry={onRetry} />);
    expect(screen.getByRole("alert")).toBeTruthy();
    expect(screen.getByText(props.errorLine)).toBeTruthy();
    const retry = screen.getByTestId("set-load-retry");
    expect(retry.textContent).toBe("Try again");
    expect(retry.className).toContain("tw:h-8");
    fireEvent.click(retry);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

describe("SaveErrorBanner", () => {
  it("is a danger alert carrying the screen's sentence", () => {
    render(<SaveErrorBanner message="Site settings were not saved. Your changes are still here. Review the values, then retry." />);
    const banner = screen.getByTestId("set-save-error");
    expect(banner.getAttribute("role")).toBe("alert");
    expect(banner.className).toContain("tw:border-[var(--bk-error)]");
    expect(banner.className).toContain("tw:bg-[var(--bk-error-tint)]");
    expect(banner.textContent).toContain("Your changes are still here");
  });
});
