/**
 * RedirectsScreen tests — list / add (with validation) / delete + dirty wiring.
 *
 * The tRPC api client is lazily created inside the screen (module-level
 * singleton), so we mock `@/services/api-client` to return a stable fake whose
 * nested query/mutate fns we reconfigure per test.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import * as React from "react";

const { api } = vi.hoisted(() => ({
  api: {
    siteDetail: {
      redirects: {
        list: { query: vi.fn() },
        create: { mutate: vi.fn() },
        delete: { mutate: vi.fn() },
      },
    },
  },
}));

vi.mock("@/services/api-client", () => ({
  createBuildrikApiClient: () => api,
}));

import { RedirectsScreen } from "../RedirectsScreen";

const listMock = api.siteDetail.redirects.list.query;
const createMock = api.siteDetail.redirects.create.mutate;
const deleteMock = api.siteDetail.redirects.delete.mutate;

function row(id: string, fromPath: string, toUrl: string, type = "301") {
  return { id, siteId: "s1", fromPath, toUrl, type, createdAt: new Date().toISOString() };
}

beforeEach(() => {
  listMock.mockReset().mockResolvedValue([]);
  createMock.mockReset().mockResolvedValue({});
  deleteMock.mockReset().mockResolvedValue({});
});

afterEach(() => cleanup());

function setup(props: { projectId?: string | null; onDirtyChange?: (d: boolean) => void } = {}) {
  return render(
    <RedirectsScreen
      projectId={props.projectId === undefined ? "s1" : props.projectId}
      onDirtyChange={props.onDirtyChange}
    />
  );
}

const fromInput = () => screen.getByPlaceholderText("/old-page") as HTMLInputElement;
const toInput = () => screen.getByPlaceholderText("/new-page") as HTMLInputElement;

describe("RedirectsScreen — gating + loading", () => {
  it("shows the dashboard-only message when there is no projectId", () => {
    setup({ projectId: null });
    expect(screen.getByText(/Open this site from the dashboard to manage redirects/i)).toBeInTheDocument();
    expect(listMock).not.toHaveBeenCalled();
  });

  it("renders the empty state after a successful load with no rows", async () => {
    setup();
    expect(await screen.findByText(/No redirects yet\. Add one above\./i)).toBeInTheDocument();
    expect(listMock).toHaveBeenCalledWith({ siteId: "s1" });
  });

  it("renders loaded rows with their from/to/type", async () => {
    listMock.mockResolvedValue([row("r1", "/old", "https://x.com/new", "302")]);
    setup();
    expect(await screen.findByText("/old")).toBeInTheDocument();
    expect(screen.getByText("https://x.com/new")).toBeInTheDocument();
    expect(screen.getByText("302")).toBeInTheDocument();
    expect(screen.getByText(/Active redirects \(1\)/)).toBeInTheDocument();
  });

  it("surfaces a load error banner", async () => {
    listMock.mockRejectedValue(new Error("boom"));
    setup();
    expect(await screen.findByRole("alert")).toHaveTextContent("boom");
  });
});

describe("RedirectsScreen — add redirect", () => {
  it("creates a redirect with trimmed from/to + selected type, then reloads", async () => {
    setup();
    await screen.findByText(/No redirects yet/i);

    fireEvent.change(fromInput(), { target: { value: "  /old-page  " } });
    fireEvent.change(toInput(), { target: { value: "  /new-page  " } });
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "302" } });
    fireEvent.click(screen.getByRole("button", { name: /add redirect/i }));

    await waitFor(() =>
      expect(createMock).toHaveBeenCalledWith({
        siteId: "s1",
        fromPath: "/old-page",
        toUrl: "/new-page",
        type: "302",
      })
    );
    // list re-fetched after create (initial load + reload).
    await waitFor(() => expect(listMock).toHaveBeenCalledTimes(2));
  });

  it("rejects a fromPath that does not start with '/' and does NOT call create", async () => {
    setup();
    await screen.findByText(/No redirects yet/i);
    fireEvent.change(fromInput(), { target: { value: "old-page" } });
    fireEvent.change(toInput(), { target: { value: "/new" } });
    fireEvent.click(screen.getByRole("button", { name: /add redirect/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/From path must start with \//i);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("rejects an empty toUrl", async () => {
    setup();
    await screen.findByText(/No redirects yet/i);
    fireEvent.change(fromInput(), { target: { value: "/old" } });
    fireEvent.click(screen.getByRole("button", { name: /add redirect/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/To URL is required/i);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("rejects a junk / javascript: toUrl and does NOT call create", async () => {
    setup();
    await screen.findByText(/No redirects yet/i);
    fireEvent.change(fromInput(), { target: { value: "/old" } });
    fireEvent.change(toInput(), { target: { value: "not a url ### javascript:alert(1)" } });
    fireEvent.click(screen.getByRole("button", { name: /add redirect/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/To URL must be a path/i);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("rejects a bare javascript: scheme target", async () => {
    setup();
    await screen.findByText(/No redirects yet/i);
    fireEvent.change(fromInput(), { target: { value: "/old" } });
    fireEvent.change(toInput(), { target: { value: "javascript:alert(1)" } });
    fireEvent.click(screen.getByRole("button", { name: /add redirect/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/To URL must be a path/i);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("accepts an absolute https target", async () => {
    setup();
    await screen.findByText(/No redirects yet/i);
    fireEvent.change(fromInput(), { target: { value: "/old" } });
    fireEvent.change(toInput(), { target: { value: "https://example.com/new" } });
    fireEvent.click(screen.getByRole("button", { name: /add redirect/i }));

    await waitFor(() =>
      expect(createMock).toHaveBeenCalledWith(
        expect.objectContaining({ toUrl: "https://example.com/new" })
      )
    );
  });

  it("surfaces a create failure as an alert and does not clear the draft", async () => {
    createMock.mockRejectedValue(new Error("dup rule"));
    setup();
    await screen.findByText(/No redirects yet/i);
    fireEvent.change(fromInput(), { target: { value: "/old" } });
    fireEvent.change(toInput(), { target: { value: "/new" } });
    fireEvent.click(screen.getByRole("button", { name: /add redirect/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent("dup rule");
    expect(fromInput().value).toBe("/old");
  });
});

describe("RedirectsScreen — delete", () => {
  it("deletes a row and removes it from the list optimistically", async () => {
    listMock.mockResolvedValue([row("r1", "/a", "/b"), row("r2", "/c", "/d")]);
    setup();
    await screen.findByText("/a");

    fireEvent.click(screen.getByRole("button", { name: /delete redirect from \/a/i }));
    await waitFor(() => expect(deleteMock).toHaveBeenCalledWith({ id: "r1" }));
    await waitFor(() => expect(screen.queryByText("/a")).toBeNull());
    expect(screen.getByText("/c")).toBeInTheDocument();
  });
});

describe("RedirectsScreen — dirty wiring", () => {
  it("reports dirty only once a field has content", async () => {
    const onDirtyChange = vi.fn();
    setup({ onDirtyChange });
    await screen.findByText(/No redirects yet/i);
    expect(onDirtyChange).toHaveBeenLastCalledWith(false);
    fireEvent.change(fromInput(), { target: { value: "/x" } });
    await waitFor(() => expect(onDirtyChange).toHaveBeenLastCalledWith(true));
  });
});
