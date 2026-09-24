/**
 * Modal — the dialog boards' frame (width/dialog-md 560, pad 24, radius 12,
 * 20/600 title, 32px right-aligned buttons with no footer strip). Measured on
 * 7564:185450 (Assets · delete folder?) and 6752:59256 (New page, 640).
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { ConfirmDialog, Modal, ModalRoot, ModalContent, ModalFooter } from "../index";

const frame = () => screen.getByRole("dialog").querySelector<HTMLElement>("[data-testid=m]")!;

describe("Modal — board frame", () => {
  it("is 560 wide with 24 padding, a 20/600 title and a borderless right-aligned foot", () => {
    render(
      <Modal open onClose={() => {}} title="Delete “Icons”?" testId="m" footer={<button type="button">Delete</button>}>
        The folder is empty.
      </Modal>,
    );
    const f = frame();
    expect(f.className).toContain("tw:w-[var(--bk-size-dialog-md)]");
    expect(f.className).toContain("tw:rounded-[var(--bk-radius-card)]");
    const title = screen.getByText("Delete “Icons”?");
    expect(title.className).toContain("tw:text-[length:var(--bk-text-20)]");
    expect(title.className).toContain("tw:leading-[var(--bk-leading-30)]");
    expect(title.parentElement!.className).toContain("tw:px-6");
    expect(title.parentElement!.className).toContain("tw:pt-6");
    const body = screen.getByText("The folder is empty.");
    expect(body.className).toContain("tw:text-[length:var(--bk-text-14)]");
    expect(body.className).toContain("tw:px-6");
    const foot = screen.getByTestId("modal-foot-m");
    expect(foot.className).toContain("tw:justify-end");
    expect(foot.className).toContain("tw:px-6");
    expect(foot.className).toContain("tw:pb-6");
    expect(foot.className).not.toContain("tw:border-t");
    expect(foot.className).toContain("tw:[&_button]:h-8");
  });

  /* Form dialogs draw the DS "Footer" (7431:145583 on 4418:142143): a top rule
     and 16/24 padding. Confirms draw bare "Dialog actions" (7564:185450,
     4428:151964) — the default stays borderless. */
  it("a divided footer draws the form dialogs' top rule and 16px padding", () => {
    render(
      <ModalRoot open onClose={() => {}}>
        <ModalContent size="question" data-testid="m">
          <ModalFooter divided data-testid="f">
            <button type="button">Save</button>
          </ModalFooter>
        </ModalContent>
      </ModalRoot>,
    );
    const foot = screen.getByTestId("f");
    expect(foot.className).toContain("tw:border-t");
    expect(foot.className).toContain("tw:border-[var(--bk-border)]");
    expect(foot.className).toContain("tw:py-4");
    expect(foot.className).not.toContain("tw:pb-6");
    expect(foot.className).toContain("tw:[&_button]:h-8");
  });

  it("takes the 640 width for the New page dialog", () => {
    render(<Modal open onClose={() => {}} title="New page" testId="m" width="lg" />);
    expect(frame().className).toContain("tw:w-[var(--bk-size-dialog-lg)]");
  });

  it("compound question size is the same 560", () => {
    render(
      <ModalRoot open onClose={() => {}}>
        <ModalContent size="question" data-testid="m">x</ModalContent>
      </ModalRoot>,
    );
    expect(frame().className).toContain("tw:w-[var(--bk-size-dialog-md)]");
  });

  it("ConfirmDialog's Cancel is plain text in gray-700, no fill or border", () => {
    render(<ConfirmDialog open onClose={() => {}} onConfirm={() => {}} title="Delete?" message="m" confirmLabel="Delete" />);
    const cancel = screen.getByRole("button", { name: "Cancel" });
    expect(cancel.className).toContain("tw:bg-transparent");
    expect(cancel.className).toContain("tw:border-transparent");
    expect(cancel.className).toContain("tw:text-[var(--bk-gray-700)]");
  });
});
