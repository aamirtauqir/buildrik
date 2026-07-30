import { render, screen } from "@testing-library/react";
import { Button } from "flowbite-react";

describe("tailwind + flowbite setup", () => {
  it("flowbite-react renders", () => {
    render(<Button>go</Button>);
    expect(screen.getByRole("button", { name: "go" })).toBeInTheDocument();
  });
  it("flowbite class output respects the tw prefix (spec §4.1 acceptance)", () => {
    render(<Button>go</Button>);
    const cls = screen.getByRole("button", { name: "go" }).className;
    // Anything NOT carrying our tw: prefix must not be tailwind-utility-shaped
    // — including variant-prefixed forms (hover:, focus:, dark:, stacked
    // variants like sm:hover:) which a literal `^(bg-|text-|...)` check
    // misses entirely, since "hover:bg-x" doesn't start with "bg-" (fix
    // round 1, reviewer finding #2). Filter to non-tw: classes first, then
    // check THOSE for the tailwind shape.
    const tailwindShaped = /^([a-z-]+:)*(bg-|text-|ring-|flex|inline-|rounded|border|p[xy]?-|h-|w-)/;
    const leaked = cls
      .split(/\s+/)
      .filter(c => c.length > 0 && !c.startsWith("tw:"))
      .filter(c => tailwindShaped.test(c));
    expect(leaked).toEqual([]);
  });
});
