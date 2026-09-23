/**
 * DownloadPreparedModal — Clone 3701:20394 "Download prepared".
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as React from "react";
import { DownloadPreparedModal } from "../DownloadPreparedModal";

describe("Clone 3701:20394 · Download prepared", () => {
  it("states that the archive is ready and nothing changed, with a single Done", () => {
    render(<DownloadPreparedModal open onClose={vi.fn()} />);
    expect(screen.getByTestId("mgr-download-title")).toHaveTextContent("Download prepared");
    expect(screen.getByTestId("mgr-download-body")).toHaveTextContent(
      "The selected file or selected-file archive is ready. Your assets and site placements are unchanged.",
    );
    const buttons = within(screen.getByTestId("mgr-download-foot")).getAllByRole("button");
    expect(buttons.map((b) => b.textContent?.trim())).toEqual(["Done"]);
  });

  it("Done closes it; Escape closes it", () => {
    const onClose = vi.fn();
    render(<DownloadPreparedModal open onClose={onClose} />);
    fireEvent.click(screen.getByTestId("mgr-download-done"));
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("renders nothing while closed", () => {
    render(<DownloadPreparedModal open={false} onClose={vi.fn()} />);
    expect(screen.queryByTestId("mgr-download-prepared")).toBeNull();
  });
});
