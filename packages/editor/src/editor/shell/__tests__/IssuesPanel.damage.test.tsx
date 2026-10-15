/**
 * IssuesPanel — load-scan rows (design decision 8, DR-T5): escaped text shows
 * what Fix would do, Keep as written lives in the row's overflow (no action
 * strip, DESIGN rule 12); "Couldn't verify" rows group last with Open element
 * and Dismiss; view mode reads "An editor can fix this." with no actions.
 */
import * as React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { IssuesPanel } from "../IssuesPanel";
import type { Issue } from "../hooks/useStudioState";

const ESCAPED: Issue = {
  id: "damage:esc",
  type: "warning",
  message: "Text may be escaped twice",
  location: "Home › Heading",
  elementId: "esc",
  damage: { kind: "escaped-text", before: "Tom &amp; Jerry", after: "Tom & Jerry" },
};
const UNVERIFIED: Issue = {
  id: "damage-unverified:copy",
  type: "info",
  message: "Couldn't verify mobile or hover styles",
  location: "Home › Heading",
  elementId: "copy",
  damage: { kind: "unverified-styles" },
};
const OTHER: Issue = { id: "i1", type: "error", message: "Broken link: /about → 404" };

afterEach(cleanup);

describe("IssuesPanel — possible damage", () => {
  it("shows before → after, Fix applies, Keep as written sits in the overflow", () => {
    const onDamageFix = vi.fn(() => true);
    const onDamageKeep = vi.fn();
    render(<IssuesPanel issues={[ESCAPED]} onClose={vi.fn()} onDamageFix={onDamageFix} onDamageKeep={onDamageKeep} />);
    expect(screen.getByTestId("issue-damage-preview-0")).toHaveTextContent("Tom &amp; Jerry → Tom & Jerry");
    expect(screen.queryByText("Keep as written")).toBeNull();
    fireEvent.click(screen.getByTestId("issue-damage-fix-0"));
    expect(onDamageFix).toHaveBeenCalledWith(ESCAPED);
    fireEvent.click(screen.getByTestId("issue-damage-more-0"));
    fireEvent.click(screen.getByText("Keep as written"));
    expect(onDamageKeep).toHaveBeenCalledWith(ESCAPED);
  });

  it("a Fix the text outran says nothing was replaced", () => {
    render(<IssuesPanel issues={[ESCAPED]} onClose={vi.fn()} onDamageFix={() => false} />);
    fireEvent.click(screen.getByTestId("issue-damage-fix-0"));
    expect(screen.getByTestId("issues-damage-failed")).toHaveTextContent("Nothing was replaced");
    expect(screen.queryByText(/brand tokens/)).toBeNull();
  });

  it("groups Couldn't verify rows last, with Open element and Dismiss", () => {
    const onSelectElement = vi.fn();
    const onDamageKeep = vi.fn();
    render(
      <IssuesPanel issues={[UNVERIFIED, OTHER]} onClose={vi.fn()} onSelectElement={onSelectElement} onDamageKeep={onDamageKeep} />,
    );
    const group = screen.getByTestId("issues-unverified-group");
    expect(group).toHaveTextContent("Couldn't verify");
    expect(screen.getByTestId("issue-row-0")).toHaveTextContent("Broken link");
    fireEvent.click(screen.getByTestId("issue-unverified-open-0"));
    expect(onSelectElement).toHaveBeenCalledWith(UNVERIFIED);
    fireEvent.click(screen.getByTestId("issue-unverified-dismiss-0"));
    expect(onDamageKeep).toHaveBeenCalledWith(UNVERIFIED);
  });

  it("view mode: read-only rows that say an editor can fix them", () => {
    render(<IssuesPanel issues={[ESCAPED, UNVERIFIED]} onClose={vi.fn()} damageReadOnly onDamageFix={vi.fn()} />);
    expect(screen.queryByTestId("issue-damage-fix-0")).toBeNull();
    expect(screen.queryByTestId("issue-damage-more-0")).toBeNull();
    expect(screen.queryByTestId("issue-unverified-dismiss-0")).toBeNull();
    expect(screen.getByTestId("issue-damage-preview-0")).toHaveTextContent("An editor can fix this.");
    expect(screen.getByTestId("issue-unverified-0")).toHaveTextContent("An editor can fix this.");
  });
});
