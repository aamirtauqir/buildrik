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
    // every tailwind-utility-shaped class flowbite emits must be prefixed
    const unprefixed = cls.split(/\s+/).filter(c => /^(bg-|text-|flex|inline-|rounded|border|p[xy]?-|h-|w-)/.test(c));
    expect(unprefixed).toEqual([]);
  });
});
