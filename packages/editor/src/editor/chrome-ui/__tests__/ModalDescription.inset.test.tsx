/**
 * ModalDescription carries the same padding ModalTitle was fixed for.
 *
 * `MODAL_SUBTITLE_CLASS` is `text-xs text-gray-500` and nothing else. The
 * all-in-one `Modal` renders it inside MODAL_HEAD_CLASS, which supplies the
 * px-5; the compound part has no wrapper, so its subtitle sat flush at the
 * modal's left edge with the padded title above it and the padded body below.
 * Caught on board 1168:4732 at 1440x900 — title at x=520, description at
 * x=502.
 *
 * @license BSD-3-Clause
 */
import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ModalDescription, ModalTitle } from "../ModalParts";

afterEach(cleanup);

describe("ModalDescription", () => {
  it("insets by default, matching the body and title", () => {
    render(<ModalDescription>Subtitle</ModalDescription>);
    expect(screen.getByText("Subtitle").className).toMatch(/tw:px-5/);
  });

  it("opts out for callers that wrap their own padded header", () => {
    // MigrationProgressModal and AIPromptModal both do; without this they
    // would be inset twice.
    render(<ModalDescription inset={false}>Subtitle</ModalDescription>);
    expect(screen.getByText("Subtitle").className).not.toMatch(/tw:px-5/);
  });

  it("agrees with ModalTitle on the left inset", () => {
    // The defect was the two disagreeing. Both are pl-5 / px-5, so a reader
    // sees one left edge, not two.
    render(
      <>
        <ModalTitle>Title</ModalTitle>
        <ModalDescription>Subtitle</ModalDescription>
      </>,
    );
    expect(screen.getByText("Title").className).toMatch(/tw:pl-5/);
    expect(screen.getByText("Subtitle").className).toMatch(/tw:px-5/);
  });

  it("keeps the caller's className", () => {
    render(<ModalDescription className="tw:mt-1">Subtitle</ModalDescription>);
    const el = screen.getByText("Subtitle");
    expect(el.className).toMatch(/tw:px-5/);
    expect(el.className).toMatch(/tw:mt-1/);
  });
});
