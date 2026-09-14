/**
 * TranslationChecklistDialog — Clone 3737:44869 "<Language> · Translation
 * checklist" (640): the dialog a Locales row opens. One `it` per prototype
 * fact a DOM assertion can prove; the visual half is the live walk's shot
 * pair.
 *
 * @license BSD-3-Clause
 */

import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as React from "react";
import { TranslationChecklistDialog, checklistLine } from "../TranslationChecklistDialog";
import type { LocaleRow } from "../../screens/localesContract";

const arabic = (over: Partial<LocaleRow> = {}): LocaleRow => ({
  code: "ar",
  path: "/ar",
  translated: 0,
  total: 6,
  status: "NOT_STARTED",
  pending: ["Home", "Menu", "Contact", "About", "Reservations", "Privacy"],
  ...over,
});

function mount(over: Partial<React.ComponentProps<typeof TranslationChecklistDialog>> = {}) {
  const props = { open: true, siteName: "Bella Cucina", locale: arabic(), onBack: vi.fn(), ...over };
  render(<TranslationChecklistDialog {...props} />);
  return props;
}

describe("checklistLine", () => {
  it("phrases the pending pages in site order — first, then the rest, `and` before the last", () => {
    expect(checklistLine(["Home", "Menu", "Contact", "About", "Reservations", "Privacy"])).toBe(
      "Begin with Home, then Menu, Contact, About, Reservations and Privacy.",
    );
    expect(checklistLine(["Home", "Menu", "Contact"])).toBe("Begin with Home, then Menu and Contact.");
    expect(checklistLine(["Home", "Menu"])).toBe("Begin with Home, then Menu.");
    expect(checklistLine(["Home"])).toBe("Begin with Home.");
  });

  it("says so when nothing is pending", () => {
    expect(checklistLine([])).toBe("Every page is translated.");
  });
});

describe("Clone 3737:44869 · Translation checklist", () => {
  it("carries the frame's title, the site · path · Draft · count line and the RTL page line, at 640", () => {
    mount();
    expect(screen.getByTestId("set-loc-check-title")).toHaveTextContent("Arabic · Translation checklist");
    expect(screen.getByTestId("set-loc-check-meta")).toHaveTextContent("Bella Cucina · /ar · Draft · 0 of 6 pages");
    expect(screen.getByTestId("set-loc-check-line")).toHaveTextContent(
      "Right-to-left locale. Begin with Home, then Menu, Contact, About, Reservations and Privacy.",
    );
    expect(screen.getByTestId("set-loc-check")).toHaveClass("tw:w-[640px]");
  });

  it("a LIVE locale reads Live, and a left-to-right one has no RTL note", () => {
    mount({ locale: arabic({ code: "fr", path: "/fr", translated: 6, status: "LIVE", pending: [] }) });
    expect(screen.getByTestId("set-loc-check-title")).toHaveTextContent("French · Translation checklist");
    expect(screen.getByTestId("set-loc-check-meta")).toHaveTextContent("Bella Cucina · /fr · Live · 6 of 6 pages");
    expect(screen.getByTestId("set-loc-check-line")).toHaveTextContent(/^Every page is translated\.$/);
  });

  it("marks every RTL locale — ar, he, fa, ur — and no other", () => {
    for (const code of ["he", "fa", "ur"]) {
      const { unmount } = render(
        <TranslationChecklistDialog open siteName="" locale={arabic({ code, pending: ["Home"] })} onBack={vi.fn()} />,
      );
      expect(screen.getByTestId("set-loc-check-line")).toHaveTextContent("Right-to-left locale. Begin with Home.");
      unmount();
    }
    mount({ locale: arabic({ code: "de", pending: ["Home"] }) });
    expect(screen.getByTestId("set-loc-check-line")).toHaveTextContent(/^Begin with Home\.$/);
  });

  it("Back to localization is the primary, takes focus and is the one door", () => {
    const props = mount();
    const back = screen.getByTestId("set-loc-check-back");
    expect(back).toHaveTextContent("Back to localization");
    expect(document.activeElement).toBe(back);
    expect(back).toHaveClass("tw:h-8");
    expect(screen.getByTestId("set-loc-check-foot").querySelectorAll("button")).toHaveLength(1);
    fireEvent.click(back);
    expect(props.onBack).toHaveBeenCalledTimes(1);
  });

  it("Escape and the scrim are the same door", () => {
    const props = mount();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(props.onBack).toHaveBeenCalledTimes(1);
    fireEvent.mouseDown(screen.getByTestId("overlay-scrim"));
    expect(props.onBack).toHaveBeenCalledTimes(2);
  });

  it("drops the site prefix when no site name is known", () => {
    mount({ siteName: "" });
    expect(screen.getByTestId("set-loc-check-meta")).toHaveTextContent(/^\/ar · Draft · 0 of 6 pages$/);
  });

  it("renders nothing while closed, or with no locale", () => {
    mount({ open: false });
    expect(screen.queryByTestId("set-loc-check")).toBeNull();
    mount({ locale: null });
    expect(screen.queryByTestId("set-loc-check")).toBeNull();
  });
});
