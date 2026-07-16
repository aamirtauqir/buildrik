/**
 * HeadersScreen tests — load, HSTS preset mapping, select edits, save payload.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import * as React from "react";

const { api } = vi.hoisted(() => ({
  api: {
    siteDetail: {
      settings: {
        get: { query: vi.fn() },
        update: { mutate: vi.fn() },
      },
    },
  },
}));

vi.mock("@/services/api-client", () => ({
  createBuildrikApiClient: () => api,
}));

import { HeadersScreen } from "../HeadersScreen";

const getMock = api.siteDetail.settings.get.query;
const updateMock = api.siteDetail.settings.update.mutate;

beforeEach(() => {
  getMock.mockReset().mockResolvedValue({});
  updateMock.mockReset().mockResolvedValue({});
});

afterEach(() => cleanup());

function setup(props: { projectId?: string | null; onDirtyChange?: (d: boolean) => void } = {}) {
  return render(
    <HeadersScreen
      projectId={props.projectId === undefined ? "s1" : props.projectId}
      onDirtyChange={props.onDirtyChange}
    />
  );
}

const cspField = () => screen.getByPlaceholderText("default-src 'self'") as HTMLTextAreaElement;
const permissionsField = () =>
  screen.getByPlaceholderText("camera=(), microphone=()") as HTMLInputElement;
const selectByName = (re: RegExp) =>
  screen.getAllByRole("combobox").find((el) =>
    Array.from(el.querySelectorAll("option")).some((o) => re.test(o.textContent ?? ""))
  ) as HTMLSelectElement;

describe("HeadersScreen — gating + loading", () => {
  it("shows the dashboard-only message with no projectId", () => {
    setup({ projectId: null });
    expect(screen.getByText(/Open this site from the dashboard to manage headers/i)).toBeInTheDocument();
    expect(getMock).not.toHaveBeenCalled();
  });

  it("prefills fields from loaded settings", async () => {
    getMock.mockResolvedValue({
      cspPolicy: "default-src 'self'",
      hstsMaxAge: 31536000,
      xFrameOptions: "DENY",
      referrerPolicy: "strict-origin",
      permissionsPolicy: "camera=()",
    });
    setup();
    await waitFor(() => expect(cspField().value).toBe("default-src 'self'"));
    expect(permissionsField().value).toBe("camera=()");
    expect(getMock).toHaveBeenCalledWith({ siteId: "s1" });
  });

  it("shows a load-error banner", async () => {
    getMock.mockRejectedValue(new Error("nope"));
    setup();
    expect(await screen.findByRole("alert")).toHaveTextContent("nope");
  });

  it("shows the 'Not yet enforced' storage-only banner", async () => {
    setup();
    expect(await screen.findByText(/Not yet enforced/i)).toBeInTheDocument();
  });
});

describe("HeadersScreen — editing + save", () => {
  it("Save is disabled until an edit marks the form dirty", async () => {
    setup();
    await screen.findByText(/Not yet enforced/i);
    const save = screen.getByRole("button", { name: /save headers/i });
    expect(save).toBeDisabled();
    fireEvent.change(cspField(), { target: { value: "default-src 'none'" } });
    expect(save).toBeEnabled();
  });

  it("maps the HSTS '1 year' preset to 31536000 seconds in the save payload", async () => {
    setup();
    await screen.findByText(/Not yet enforced/i);
    const hsts = selectByName(/1 year/);
    fireEvent.change(hsts, { target: { value: "31536000" } });
    fireEvent.click(screen.getByRole("button", { name: /save headers/i }));
    await waitFor(() =>
      expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({ hstsMaxAge: 31536000 }))
    );
  });

  it("normalizes empty CSP/permissions to null and passes selected header values", async () => {
    setup();
    await screen.findByText(/Not yet enforced/i);
    fireEvent.change(selectByName(/block all framing/), { target: { value: "DENY" } });
    fireEvent.change(selectByName(/strict-origin-when-cross-origin/), {
      target: { value: "strict-origin" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save headers/i }));

    await waitFor(() =>
      expect(updateMock).toHaveBeenCalledWith({
        id: "s1",
        cspPolicy: null,
        hstsMaxAge: null,
        xFrameOptions: "DENY",
        referrerPolicy: "strict-origin",
        permissionsPolicy: null,
      })
    );
  });

  it("keeps the save error visible when the mutation rejects", async () => {
    // Drive save via the registered savebar handler so the rejection is awaited
    // and caught here (the inline button's onClick returns an un-awaited promise).
    updateMock.mockRejectedValue(new Error("save failed"));
    const handlerRef: { current: (() => Promise<void>) | null } = { current: null };
    render(
      <HeadersScreen
        projectId="s1"
        registerSaveHandler={(h) => {
          if (h) handlerRef.current = h;
        }}
      />
    );
    await screen.findByText(/Not yet enforced/i);
    fireEvent.change(cspField(), { target: { value: "x" } });

    await waitFor(() => expect(handlerRef.current).toBeTypeOf("function"));
    await expect(handlerRef.current!()).rejects.toThrow("save failed");
    expect(await screen.findByText("save failed")).toBeInTheDocument();
  });
});
