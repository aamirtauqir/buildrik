import { render, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import * as React from "react";
import { StarterGalleryMount } from "../StarterGalleryMount";
import { TokenRegistryProvider } from "../../state/TokenRegistryContext";
import { STARTER_DS_REGISTRY } from "../../starters";
import { CURRENT_SCHEMA_VERSION } from "../../migrations";
import { EVENTS } from "../../../../shared/constants/events";

const projectId = "starter-gallery-mount-test";
const seenKey = `buildrik:starter-gallery-seen-${projectId}`;
const tokensKey = `buildrick-design-tokens-${projectId}-v1`;

// Minimal Composer event-bus stand-in. The Mount only uses on/off/emit for
// UI_OPEN_STARTERS — full Composer construction is overkill here.
function makeFakeComposer() {
  const listeners = new Map<string, Set<(payload?: unknown) => void>>();
  return {
    on(event: string, handler: (payload?: unknown) => void) {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)!.add(handler);
    },
    off(event: string, handler: (payload?: unknown) => void) {
      listeners.get(event)?.delete(handler);
    },
    emit(event: string, payload?: unknown) {
      listeners.get(event)?.forEach((h) => h(payload));
    },
  };
}

function wrap(children: React.ReactNode) {
  return <TokenRegistryProvider projectId={projectId}>{children}</TokenRegistryProvider>;
}

describe("StarterGalleryMount", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // D3 onboarding fix (commit 1704d690 + 70bdceee): modal NO LONGER auto-opens
  // on first run. The theme picker is discoverable via the Design tab "Browse
  // themes" button which emits UI_OPEN_STARTERS. The seen-flag is written only
  // on real interaction (Apply/Skip), never on mount.
  it("stays closed on first run (no auto-open)", () => {
    const { queryByText } = render(wrap(<StarterGalleryMount projectId={projectId} />));
    expect(queryByText("Pick a starter design system")).toBeNull();
  });

  it("does not write the seen flag on mount — only on interaction", () => {
    expect(localStorage.getItem(seenKey)).toBeNull();
    render(wrap(<StarterGalleryMount projectId={projectId} />));
    expect(localStorage.getItem(seenKey)).toBeNull();
  });

  it("opens when UI_OPEN_STARTERS event fires (Design tab Browse-themes button)", () => {
    const composer = makeFakeComposer();
    const { queryByText } = render(
      wrap(<StarterGalleryMount projectId={projectId} composer={composer as never} />)
    );
    expect(queryByText("Pick a starter design system")).toBeNull();
    act(() => composer.emit(EVENTS.UI_OPEN_STARTERS));
    expect(queryByText("Pick a starter design system")).toBeTruthy();
  });

  it("on Apply: persists tokens, marks seen, closes modal", () => {
    const composer = makeFakeComposer();
    const { queryByText, getByText } = render(
      wrap(<StarterGalleryMount projectId={projectId} composer={composer as never} />)
    );
    act(() => composer.emit(EVENTS.UI_OPEN_STARTERS));

    fireEvent.click(getByText(/^Apply /));

    expect(queryByText("Pick a starter design system")).toBeNull();
    expect(localStorage.getItem(seenKey)).toBe("1");

    const raw = localStorage.getItem(tokensKey);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(Array.isArray(parsed.tokens)).toBe(true);
    expect(parsed.tokens.length).toBe(STARTER_DS_REGISTRY[0].tokens.length);
  });

  it("on Skip: marks seen, closes modal, does not write tokens", () => {
    const composer = makeFakeComposer();
    const { queryByText, getByText } = render(
      wrap(<StarterGalleryMount projectId={projectId} composer={composer as never} />)
    );
    act(() => composer.emit(EVENTS.UI_OPEN_STARTERS));

    fireEvent.click(getByText("Skip"));

    expect(queryByText("Pick a starter design system")).toBeNull();
    expect(localStorage.getItem(seenKey)).toBe("1");
    expect(localStorage.getItem(tokensKey)).toBeNull();
  });

  it("re-emit UI_OPEN_STARTERS after Apply reopens the modal", () => {
    const composer = makeFakeComposer();
    const first = render(
      wrap(<StarterGalleryMount projectId={projectId} composer={composer as never} />)
    );
    act(() => composer.emit(EVENTS.UI_OPEN_STARTERS));
    fireEvent.click(first.getByText(/^Apply /));
    expect(first.queryByText("Pick a starter design system")).toBeNull();

    // Second emit reopens — seen flag does not block the event-driven path.
    act(() => composer.emit(EVENTS.UI_OPEN_STARTERS));
    expect(first.queryByText("Pick a starter design system")).toBeTruthy();
  });
});
