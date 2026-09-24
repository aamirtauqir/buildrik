// @vitest-environment jsdom
/**
 * G1-075 (closes G2-170) — the Saves filter: All · Named · Auto-saves and
 * Author (boards 7291:81049 / 6930:79873).
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import * as React from "react";
import type { NamedVersion } from "@/shared/types/versions";
import { SavesFilter, applySavesFilter, authorLabel, ALL_SAVES, type SavesFilterValue } from "../SavesFilter";

afterEach(cleanup);

const v = (id: string, isAutoCheckpoint: boolean, userId: string | null, authorName?: string) =>
  ({ id, name: id, isAutoCheckpoint, userId, authorName, createdAt: 0, snapshot: {} }) as unknown as NamedVersion;

const LIST = [v("n1", false, "me"), v("a1", true, "me"), v("n2", false, "u-sara", "Sara"), v("a2", true, null)];

describe("applySavesFilter", () => {
  it("keeps named, auto-saves, or one author's versions", () => {
    const ids = (f: SavesFilterValue) => applySavesFilter(LIST, f).map((x) => x.id);
    expect(ids(ALL_SAVES)).toEqual(["n1", "a1", "n2", "a2"]);
    expect(ids({ kind: "named", author: null })).toEqual(["n1", "n2"]);
    expect(ids({ kind: "auto", author: null })).toEqual(["a1", "a2"]);
    expect(ids({ kind: "all", author: "u-sara" })).toEqual(["n2"]);
    expect(ids({ kind: "auto", author: "me" })).toEqual(["a1"]);
  });

  it("names the signed-in user You, others by their server name", () => {
    expect(authorLabel(LIST[0], "me")).toBe("You");
    expect(authorLabel(LIST[2], "me")).toBe("Sara");
    expect(authorLabel(LIST[3], "me")).toBeNull();
  });
});

describe("SavesFilter", () => {
  function Host({ onChange }: { onChange: (f: SavesFilterValue) => void }) {
    const [value, setValue] = React.useState(ALL_SAVES);
    return (
      <SavesFilter
        versions={LIST}
        currentUserId="me"
        value={value}
        onChange={(f) => {
          setValue(f);
          onChange(f);
        }}
      />
    );
  }

  it("Filter ▾ → Named, then Author: anyone ▾ → Sara", () => {
    const onChange = vi.fn();
    render(<Host onChange={onChange} />);
    expect(screen.getByTestId("saves-filter")).toHaveTextContent("Filter ▾");

    fireEvent.click(screen.getByTestId("saves-filter"));
    expect(screen.getAllByRole("menuitem").map((m) => m.textContent)).toEqual([
      "All✓",
      "Named",
      "Auto-saves",
      "Author: anyone ▾",
    ]);
    fireEvent.click(screen.getByRole("menuitem", { name: /^Named/ }));
    expect(onChange).toHaveBeenLastCalledWith({ kind: "named", author: null });
    expect(screen.getByTestId("saves-filter")).toHaveTextContent("Named ▾");

    fireEvent.click(screen.getByTestId("saves-filter"));
    fireEvent.click(screen.getByTestId("saves-filter-author"));
    expect(screen.getAllByRole("menuitem").map((m) => m.textContent)).toEqual(["Everyone✓", "You", "Sara"]);
    fireEvent.click(screen.getByRole("menuitem", { name: /^Sara/ }));
    expect(onChange).toHaveBeenLastCalledWith({ kind: "named", author: "u-sara" });
    expect(screen.getByTestId("saves-filter")).toHaveTextContent("Named · Sara ▾");
  });
});
