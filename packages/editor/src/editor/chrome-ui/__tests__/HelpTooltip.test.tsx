/**
 * HelpTooltip tests — trigger accessibility, focus-opened tooltip content,
 * and the optional docs link.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { HelpTooltip } from "../HelpTooltip";

afterEach(cleanup);

describe("HelpTooltip", () => {
  it("renders the '?' trigger with an accessible label", () => {
    render(<HelpTooltip content="Controls layout flow." />);
    expect(screen.getByRole("button", { name: "What's this?" })).toBeInTheDocument();
  });

  it("shows the help content when the trigger receives focus", () => {
    // flowbite's Tooltip always renders its content div — the show/hide
    // toggle is the "invisible" class on the floating wrapper
    // ([data-testid="flowbite-tooltip"], Floating.js), not presence of the
    // text node. See flowbite-parity.test.tsx for the same pattern.
    render(<HelpTooltip content="Controls how this element flows in the layout." />);

    const wrapper = screen.getByTestId("flowbite-tooltip");
    expect(wrapper.className).toMatch(/tw:invisible/);

    fireEvent.focus(screen.getByRole("button", { name: "What's this?" }));

    expect(wrapper.className).not.toMatch(/tw:invisible/);
    expect(
      screen.getByText("Controls how this element flows in the layout.")
    ).toBeInTheDocument();
  });

  it("renders a docs link inside the tooltip when docsLink is set", async () => {
    render(
      <HelpTooltip content="Spacing scale." docsLink="https://docs.buildrick.io/spacing" />
    );

    fireEvent.focus(screen.getByRole("button", { name: "What's this?" }));
    await screen.findAllByText("Spacing scale.");

    const links = screen.getAllByText("Learn more →");
    expect(links.length).toBeGreaterThan(0);
    const anchor = links[0].closest("a");
    expect(anchor).toHaveAttribute("href", "https://docs.buildrick.io/spacing");
    expect(anchor).toHaveAttribute("target", "_blank");
    expect(anchor).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("omits the docs link without docsLink", async () => {
    render(<HelpTooltip content="No docs here." />);
    fireEvent.focus(screen.getByRole("button", { name: "What's this?" }));
    await screen.findAllByText("No docs here.");
    expect(screen.queryByText("Learn more →")).not.toBeInTheDocument();
  });

  it("scales the icon by size", () => {
    const { container } = render(<HelpTooltip content="c" size="md" />);
    expect(container.querySelector("svg")).toHaveAttribute("width", "16");
  });
});
