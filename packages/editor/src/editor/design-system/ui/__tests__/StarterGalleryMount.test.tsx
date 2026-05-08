import { render, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import * as React from "react";
import { StarterGalleryMount } from "../StarterGalleryMount";
import { TokenRegistryProvider } from "../../state/TokenRegistryContext";
import { STARTER_DS_REGISTRY } from "../../starters";
import { CURRENT_SCHEMA_VERSION } from "../../migrations";

const projectId = "starter-gallery-mount-test";
const seenKey = `buildrik:starter-gallery-seen-${projectId}`;
const tokensKey = `buildrick-design-tokens-${projectId}-v1`;

function wrap(children: React.ReactNode) {
  return <TokenRegistryProvider projectId={projectId}>{children}</TokenRegistryProvider>;
}

describe("StarterGalleryMount", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("opens the modal on first run when no seen flag is set", () => {
    const { queryByText } = render(wrap(<StarterGalleryMount projectId={projectId} />));
    expect(queryByText("Pick a starter design system")).toBeTruthy();
  });

  it("does not open when the seen flag is already set", () => {
    localStorage.setItem(seenKey, "1");
    const { queryByText } = render(wrap(<StarterGalleryMount projectId={projectId} />));
    expect(queryByText("Pick a starter design system")).toBeNull();
  });

  it("on Apply: persists the chosen starter's tokens, marks seen, closes modal", () => {
    const { queryByText, getByText } = render(
      wrap(<StarterGalleryMount projectId={projectId} />)
    );

    // First starter is the default selection.
    fireEvent.click(getByText(/^Apply /));

    // Modal closed.
    expect(queryByText("Pick a starter design system")).toBeNull();

    // Seen flag set.
    expect(localStorage.getItem(seenKey)).toBe("1");

    // Tokens persisted to the project's storage key.
    const raw = localStorage.getItem(tokensKey);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(Array.isArray(parsed.tokens)).toBe(true);
    expect(parsed.tokens.length).toBe(STARTER_DS_REGISTRY[0].tokens.length);
  });

  it("on Skip: marks seen, closes modal, does not write tokens", () => {
    const { queryByText, getByText } = render(
      wrap(<StarterGalleryMount projectId={projectId} />)
    );

    fireEvent.click(getByText("Skip"));

    expect(queryByText("Pick a starter design system")).toBeNull();
    expect(localStorage.getItem(seenKey)).toBe("1");
    expect(localStorage.getItem(tokensKey)).toBeNull();
  });

  it("re-mounting after apply does not re-open the modal", () => {
    // First render: pick + apply.
    const first = render(wrap(<StarterGalleryMount projectId={projectId} />));
    fireEvent.click(first.getByText(/^Apply /));
    first.unmount();

    // Second render: should stay closed.
    const second = render(wrap(<StarterGalleryMount projectId={projectId} />));
    expect(second.queryByText("Pick a starter design system")).toBeNull();
  });
});
