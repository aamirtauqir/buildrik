// @vitest-environment jsdom
/**
 * TabRouter — FB-4: the "review" tab id had no client gate on the server's
 * agency_layer flag (`reviewsEnabled`), so ReviewTab rendered regardless.
 * Renders nothing for "review" when the flag is off/unknown, and the real
 * panel when it's on — the topbar Review pill (a separate door, unaffected
 * by this gate per owner decision) is not exercised here.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import * as React from "react";

vi.mock("../tabs/review/ReviewTab", () => ({
  default: () => <div data-testid="review-tab-rendered" />,
}));

import { TabRouter } from "../TabRouter";

const commonTabProps = { isExpanded: false, onClose: vi.fn() };

function renderReview(reviewsEnabled: boolean | null | undefined) {
  render(
    <React.Suspense fallback={null}>
      <TabRouter
        activeTab="review"
        composer={null}
        commonTabProps={commonTabProps}
        onCreateComponent={vi.fn()}
        reviewsEnabled={reviewsEnabled}
      />
    </React.Suspense>,
  );
}

describe("TabRouter — FB-4 review gate", () => {
  it("renders nothing when reviewsEnabled is false", () => {
    const { container } = render(
      <TabRouter
        activeTab="review"
        composer={null}
        commonTabProps={commonTabProps}
        onCreateComponent={vi.fn()}
        reviewsEnabled={false}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when reviewsEnabled is null (unanswered)", () => {
    const { container } = render(
      <TabRouter
        activeTab="review"
        composer={null}
        commonTabProps={commonTabProps}
        onCreateComponent={vi.fn()}
        reviewsEnabled={null}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when reviewsEnabled is omitted", () => {
    const { container } = render(
      <TabRouter activeTab="review" composer={null} commonTabProps={commonTabProps} onCreateComponent={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the real panel when reviewsEnabled is true", async () => {
    renderReview(true);
    expect(await screen.findByTestId("review-tab-rendered")).toBeInTheDocument();
  });
});
