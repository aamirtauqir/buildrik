import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TabFrame } from "../TabFrame";

describe("TabFrame", () => {
  it("renders Header title", () => {
    render(
      <TabFrame>
        <TabFrame.Header title="Templates" />
        <TabFrame.Body>body</TabFrame.Body>
      </TabFrame>
    );
    expect(screen.getByText("Templates")).toBeDefined();
  });

  it("Search row hidden when visible=false", () => {
    render(
      <TabFrame>
        <TabFrame.Search
          visible={false}
          value=""
          onChange={() => {}}
        />
        <TabFrame.Body>body</TabFrame.Body>
      </TabFrame>
    );
    expect(screen.queryByPlaceholderText("Search…")).toBeNull();
  });

  it("Search row shown + onChange fires", () => {
    const onChange = vi.fn();
    render(
      <TabFrame>
        <TabFrame.Search
          visible={true}
          value=""
          onChange={onChange}
          placeholder="Find…"
          ariaLabel="Find templates"
        />
        <TabFrame.Body>body</TabFrame.Body>
      </TabFrame>
    );
    const input = screen.getByLabelText("Find templates");
    fireEvent.change(input, { target: { value: "hero" } });
    expect(onChange).toHaveBeenCalledWith("hero");
  });

  it("Search clear button calls onClear when provided", () => {
    const onChange = vi.fn();
    const onClear = vi.fn();
    render(
      <TabFrame>
        <TabFrame.Search
          visible={true}
          value="hero"
          onChange={onChange}
          onClear={onClear}
          ariaLabel="Search"
        />
        <TabFrame.Body>body</TabFrame.Body>
      </TabFrame>
    );
    fireEvent.click(screen.getByLabelText("Clear search"));
    expect(onClear).toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("Search clear falls back to onChange('') when onClear absent", () => {
    const onChange = vi.fn();
    render(
      <TabFrame>
        <TabFrame.Search
          visible={true}
          value="x"
          onChange={onChange}
          ariaLabel="Search"
        />
        <TabFrame.Body>body</TabFrame.Body>
      </TabFrame>
    );
    fireEvent.click(screen.getByLabelText("Clear search"));
    expect(onChange).toHaveBeenCalledWith("");
  });

  it("Empty renders label + hint + action", () => {
    render(
      <TabFrame>
        <TabFrame.Body>
          <TabFrame.Empty
            label="No items"
            hint="Try a different filter"
            action={<button>Reset</button>}
          />
        </TabFrame.Body>
      </TabFrame>
    );
    expect(screen.getByText("No items")).toBeDefined();
    expect(screen.getByText("Try a different filter")).toBeDefined();
    expect(screen.getByText("Reset")).toBeDefined();
  });

  it("Filters renders children inside toolbar slot", () => {
    render(
      <TabFrame>
        <TabFrame.Filters>
          <span data-testid="pill-1">All</span>
          <span data-testid="pill-2">Sites</span>
        </TabFrame.Filters>
        <TabFrame.Body>body</TabFrame.Body>
      </TabFrame>
    );
    expect(screen.getByTestId("pill-1")).toBeDefined();
    expect(screen.getByTestId("pill-2")).toBeDefined();
  });
});
