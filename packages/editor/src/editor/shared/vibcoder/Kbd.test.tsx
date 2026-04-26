import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Kbd, KbdSeq } from "./Kbd";

describe("vibcoder Kbd wrapper", () => {
  it("renders <kbd> with bd-kbd class", () => {
    const { container } = render(<Kbd>K</Kbd>);
    const el = container.querySelector("kbd")!;
    expect(el).toBeTruthy();
    expect(el.className).toContain("bd-kbd");
    expect(el.textContent).toBe("K");
  });

  it("OMITS variant + size modifiers by default (default = light chrome at sm size)", () => {
    const { container } = render(<Kbd>K</Kbd>);
    const cls = container.querySelector("kbd")!.className;
    expect(cls).not.toContain("bd-kbd--bare");
    expect(cls).not.toContain("bd-kbd--inverted");
    expect(cls).not.toContain("bd-kbd--xs");
    expect(cls).not.toContain("bd-kbd--sm");
  });

  it("emits bd-kbd--bare for variant=bare", () => {
    const { container } = render(<Kbd variant="bare">K</Kbd>);
    expect(container.querySelector("kbd")!.className).toContain("bd-kbd--bare");
  });

  it("emits bd-kbd--inverted for variant=inverted", () => {
    const { container } = render(<Kbd variant="inverted">K</Kbd>);
    expect(container.querySelector("kbd")!.className).toContain("bd-kbd--inverted");
  });

  it("emits bd-kbd--xs for size=xs", () => {
    const { container } = render(<Kbd size="xs">K</Kbd>);
    expect(container.querySelector("kbd")!.className).toContain("bd-kbd--xs");
  });

  it("chains bare + xs correctly", () => {
    const { container } = render(<Kbd variant="bare" size="xs">K</Kbd>);
    const cls = container.querySelector("kbd")!.className;
    expect(cls).toContain("bd-kbd--bare");
    expect(cls).toContain("bd-kbd--xs");
  });

  it("merges caller className", () => {
    const { container } = render(<Kbd className="extra">K</Kbd>);
    expect(container.querySelector("kbd")!.className).toContain("extra");
  });

  it("forwards arbitrary attrs (e.g., title for tooltip hint)", () => {
    const { container } = render(<Kbd title="Command key">⌘</Kbd>);
    expect(container.querySelector("kbd")!.getAttribute("title")).toBe("Command key");
  });
});

describe("vibcoder KbdSeq wrapper", () => {
  it("renders <div> with bd-kbd-seq class", () => {
    const { container } = render(
      <KbdSeq>
        <Kbd>⌘</Kbd>
        <Kbd>K</Kbd>
      </KbdSeq>,
    );
    const el = container.querySelector("div.bd-kbd-seq")!;
    expect(el).toBeTruthy();
  });

  it("renders nested Kbd children", () => {
    const { container } = render(
      <KbdSeq>
        <Kbd>⌘</Kbd>
        <Kbd>K</Kbd>
      </KbdSeq>,
    );
    const kbds = container.querySelectorAll("kbd.bd-kbd");
    expect(kbds.length).toBe(2);
    expect(kbds[0].textContent).toBe("⌘");
    expect(kbds[1].textContent).toBe("K");
  });

  it("renders caller-supplied __then separator (not auto-injected)", () => {
    const { container } = render(
      <KbdSeq>
        <Kbd>g</Kbd>
        <span className="bd-kbd-seq__then">then</span>
        <Kbd>p</Kbd>
      </KbdSeq>,
    );
    const sep = container.querySelector(".bd-kbd-seq__then")!;
    expect(sep).toBeTruthy();
    expect(sep.textContent).toBe("then");
  });

  it("merges caller className", () => {
    const { container } = render(
      <KbdSeq className="extra">
        <Kbd>K</Kbd>
      </KbdSeq>,
    );
    expect(container.querySelector(".bd-kbd-seq")!.className).toContain("extra");
  });
});
