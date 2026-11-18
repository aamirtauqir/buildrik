/**
 * ConfirmDialog's layout props — `actionsAlign` and `cancelStyle` — added for
 * design-2l9's page confirms (63:15255: a 480 card, Cancel outlined, both
 * actions on the left). The defaults must not move any existing confirm:
 * actions on the right, Cancel a quiet text button.
 *
 * @license BSD-3-Clause
 */
import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ConfirmDialog } from "../ConfirmDialog";

afterEach(cleanup);

const show = (extra: Partial<React.ComponentProps<typeof ConfirmDialog>> = {}) =>
  render(
    <ConfirmDialog open onClose={vi.fn()} onConfirm={vi.fn()} title="Change URL?" message="body" confirmLabel="Change URL" testId="c" {...extra} />,
  );

describe("ConfirmDialog — layout props", () => {
  it("defaults: actions on the right, Cancel a text button", () => {
    show();
    expect(screen.getByTestId("modal-foot-c").className).toContain("tw:justify-end");
    expect(screen.getByTestId("modal-foot-c").className).not.toContain("tw:justify-start!");
    expect(screen.getByTestId("c-cancel").className).toContain("tw:bg-transparent");
  });

  it('actionsAlign="start" moves the actions left; cancelStyle="outline" borders Cancel', () => {
    show({ actionsAlign: "start", cancelStyle: "outline" });
    expect(screen.getByTestId("modal-foot-c").className).toContain("tw:justify-start!");
    const cancel = screen.getByTestId("c-cancel");
    expect(cancel.className).toContain("tw:border-[var(--bk-border)]");
    expect(cancel.className).not.toContain("tw:bg-transparent");
  });
});
