import { createRef } from "react";
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import {
  Card,
  CardHeader,
  CardHeaderMeta,
  CardBody,
  CardFooter,
  CardTitle,
  CardDesc,
} from "./Card";

describe("vibcoder Card sibling exports", () => {
  it("renders <div> with bd-card base class and children", () => {
    const { container } = render(<Card>content</Card>);
    const root = container.querySelector("div.bd-card");
    expect(root).toBeTruthy();
    expect(root!.textContent).toBe("content");
  });

  it("OMITS --flush modifier when flush is undefined (default)", () => {
    const { container } = render(<Card>x</Card>);
    expect(container.querySelector(".bd-card")!.className).not.toContain(
      "bd-card--flush",
    );
  });

  it("emits bd-card--flush when flush prop is true", () => {
    const { container } = render(<Card flush>x</Card>);
    expect(container.querySelector(".bd-card")!.className).toContain(
      "bd-card--flush",
    );
  });

  it("CardHeader renders bd-card__head", () => {
    const { container } = render(<CardHeader>head</CardHeader>);
    const el = container.querySelector(".bd-card__head");
    expect(el).toBeTruthy();
    expect(el!.textContent).toBe("head");
  });

  it("CardHeaderMeta renders bd-card__head-meta as <span>", () => {
    const { container } = render(<CardHeaderMeta>meta</CardHeaderMeta>);
    const el = container.querySelector("span.bd-card__head-meta");
    expect(el).toBeTruthy();
    expect(el!.textContent).toBe("meta");
  });

  it("CardBody renders bd-card__body", () => {
    const { container } = render(<CardBody>body</CardBody>);
    expect(container.querySelector(".bd-card__body")!.textContent).toBe("body");
  });

  it("CardFooter renders bd-card__foot", () => {
    const { container } = render(<CardFooter>foot</CardFooter>);
    expect(container.querySelector(".bd-card__foot")!.textContent).toBe("foot");
  });

  it("CardTitle renders bd-card__title as <h3>", () => {
    const { container } = render(<CardTitle>title</CardTitle>);
    const el = container.querySelector("h3.bd-card__title");
    expect(el).toBeTruthy();
    expect(el!.textContent).toBe("title");
  });

  it("CardDesc renders bd-card__desc as <p>", () => {
    const { container } = render(<CardDesc>desc</CardDesc>);
    const el = container.querySelector("p.bd-card__desc");
    expect(el).toBeTruthy();
    expect(el!.textContent).toBe("desc");
  });

  it("merges caller className on each sibling", () => {
    const { container } = render(
      <Card className="extra">
        <CardHeader className="h-extra">
          h<CardHeaderMeta className="m-extra">m</CardHeaderMeta>
        </CardHeader>
        <CardBody className="b-extra">b</CardBody>
        <CardFooter className="f-extra">f</CardFooter>
        <CardTitle className="t-extra">t</CardTitle>
        <CardDesc className="d-extra">d</CardDesc>
      </Card>,
    );
    expect(container.querySelector(".bd-card")!.className).toContain("extra");
    expect(container.querySelector(".bd-card__head")!.className).toContain(
      "h-extra",
    );
    expect(container.querySelector(".bd-card__head-meta")!.className).toContain(
      "m-extra",
    );
    expect(container.querySelector(".bd-card__body")!.className).toContain(
      "b-extra",
    );
    expect(container.querySelector(".bd-card__foot")!.className).toContain(
      "f-extra",
    );
    expect(container.querySelector(".bd-card__title")!.className).toContain(
      "t-extra",
    );
    expect(container.querySelector(".bd-card__desc")!.className).toContain(
      "d-extra",
    );
  });

  it("forwards ref on every sibling", () => {
    const cardRef = createRef<HTMLDivElement>();
    const headRef = createRef<HTMLDivElement>();
    const headMetaRef = createRef<HTMLSpanElement>();
    const bodyRef = createRef<HTMLDivElement>();
    const footRef = createRef<HTMLDivElement>();
    const titleRef = createRef<HTMLHeadingElement>();
    const descRef = createRef<HTMLParagraphElement>();
    render(
      <Card ref={cardRef}>
        <CardHeader ref={headRef}>
          h<CardHeaderMeta ref={headMetaRef}>m</CardHeaderMeta>
        </CardHeader>
        <CardBody ref={bodyRef}>b</CardBody>
        <CardFooter ref={footRef}>f</CardFooter>
        <CardTitle ref={titleRef}>t</CardTitle>
        <CardDesc ref={descRef}>d</CardDesc>
      </Card>,
    );
    expect(cardRef.current).toBeInstanceOf(HTMLDivElement);
    expect(headRef.current).toBeInstanceOf(HTMLDivElement);
    expect(headMetaRef.current).toBeInstanceOf(HTMLSpanElement);
    expect(bodyRef.current).toBeInstanceOf(HTMLDivElement);
    expect(footRef.current).toBeInstanceOf(HTMLDivElement);
    expect(titleRef.current).toBeInstanceOf(HTMLHeadingElement);
    expect(descRef.current).toBeInstanceOf(HTMLParagraphElement);
  });

  it("composes elevated layout: header (with meta) + body + footer", () => {
    const { container } = render(
      <Card>
        <CardHeader>
          Page settings <CardHeaderMeta>updated 2h ago</CardHeaderMeta>
        </CardHeader>
        <CardBody>body content</CardBody>
        <CardFooter>actions</CardFooter>
      </Card>,
    );
    const root = container.querySelector(".bd-card")!;
    expect(root.querySelector(".bd-card__head")).toBeTruthy();
    expect(root.querySelector(".bd-card__head-meta")!.textContent).toBe(
      "updated 2h ago",
    );
    expect(root.querySelector(".bd-card__body")!.textContent).toBe(
      "body content",
    );
    expect(root.querySelector(".bd-card__foot")!.textContent).toBe("actions");
  });

  it("composes flush layout: title + desc inside flush card", () => {
    const { container } = render(
      <Card flush>
        <CardTitle>Tip</CardTitle>
        <CardDesc>Use Cmd+K to open the command palette.</CardDesc>
      </Card>,
    );
    const root = container.querySelector(".bd-card.bd-card--flush")!;
    expect(root).toBeTruthy();
    expect(root.querySelector(".bd-card__title")!.textContent).toBe("Tip");
    expect(root.querySelector(".bd-card__desc")!.textContent).toBe(
      "Use Cmd+K to open the command palette.",
    );
  });
});
