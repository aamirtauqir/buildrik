import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { UploadZone } from "../UploadZone";

describe("UploadZone — consumes StorageQuotaBar", () => {
  it("renders StorageQuotaBar with current quota", () => {
    const onUpload = vi.fn();
    const { container } = render(
      <UploadZone storage={{ used: 1e9, total: 5e9 }} onUpload={onUpload} uploadQueue={[]} />
    );
    expect(container.querySelector(".med-quota-bar")).toBeInTheDocument();
    expect(container.querySelector(".med-quota-text")?.textContent).toMatch(/1 GB \/ 5 GB used/);
  });
});
