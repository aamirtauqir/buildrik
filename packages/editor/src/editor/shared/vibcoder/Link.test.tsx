import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Link } from "./Link";

describe("vibcoder Link wrapper", () => {
  it("renders <a> with bd-link class", () => {
    const { container } = render(<Link href="#">Hello</Link>);
    const a = container.querySelector("a")!;
    expect(a.className).toBe("bd-link");
    expect(a.getAttribute("href")).toBe("#");
  });

  it("OMITS tone modifier when tone is undefined (default look)", () => {
    const { container } = render(<Link href="#">x</Link>);
    expect(container.querySelector("a")!.className).not.toMatch(/bd-link--(muted|inverse)/);
  });

  it("emits explicit modifier for muted, inverse tones", () => {
    for (const t of ["muted", "inverse"] as const) {
      const { container } = render(<Link href="#" tone={t}>x</Link>);
      expect(container.querySelector("a")!.className).toContain(`bd-link--${t}`);
    }
  });

  it("emits bd-link--no-underline when noUnderline=true", () => {
    const { container } = render(<Link href="#" noUnderline>x</Link>);
    expect(container.querySelector("a")!.className).toContain("bd-link--no-underline");
  });

  it("emits bd-link--external when external=true", () => {
    const { container } = render(<Link href="#" external>x</Link>);
    expect(container.querySelector("a")!.className).toContain("bd-link--external");
  });

  it("composes tone + noUnderline + external", () => {
    const { container } = render(
      <Link href="#" tone="inverse" noUnderline external>x</Link>
    );
    const cls = container.querySelector("a")!.className;
    expect(cls).toContain("bd-link--inverse");
    expect(cls).toContain("bd-link--no-underline");
    expect(cls).toContain("bd-link--external");
  });

  it("auto-applies target=_blank + rel=noopener noreferrer when external=true", () => {
    const { container } = render(<Link href="https://example.com" external>x</Link>);
    const a = container.querySelector("a")!;
    expect(a.getAttribute("target")).toBe("_blank");
    expect(a.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("respects caller's explicit target when external=true (caller wins)", () => {
    const { container } = render(
      <Link href="#" external target="_self">x</Link>
    );
    expect(container.querySelector("a")!.getAttribute("target")).toBe("_self");
  });

  it("respects caller's explicit rel when external=true (caller wins)", () => {
    const { container } = render(
      <Link href="#" external rel="nofollow">x</Link>
    );
    expect(container.querySelector("a")!.getAttribute("rel")).toBe("nofollow");
  });

  it("does NOT auto-apply target/rel when external=false", () => {
    const { container } = render(<Link href="#">x</Link>);
    const a = container.querySelector("a")!;
    expect(a.hasAttribute("target")).toBe(false);
    expect(a.hasAttribute("rel")).toBe(false);
  });

  it("maps disabled prop to aria-disabled (anchors can't take native disabled)", () => {
    const { container } = render(<Link href="#" disabled>x</Link>);
    const a = container.querySelector("a")!;
    expect(a.getAttribute("aria-disabled")).toBe("true");
  });

  it("does NOT emit aria-disabled when disabled=false", () => {
    const { container } = render(<Link href="#">x</Link>);
    expect(container.querySelector("a")!.hasAttribute("aria-disabled")).toBe(false);
  });

  it("merges caller className", () => {
    const { container } = render(<Link href="#" className="extra">x</Link>);
    expect(container.querySelector("a")!.className).toContain("extra");
  });

  it("forwards href, hash, and other anchor attrs via ...rest", () => {
    const { container } = render(
      <Link href="https://example.com" hrefLang="en" id="my-link">x</Link>
    );
    const a = container.querySelector("a")!;
    expect(a.getAttribute("href")).toBe("https://example.com");
    expect(a.getAttribute("hreflang")).toBe("en");
    expect(a.getAttribute("id")).toBe("my-link");
  });
});
