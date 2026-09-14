/**
 * HeadersScreen tests — Clone 3397:32602 Headers: the amber strip, the four
 * cards the frame draws (CSP well, the two Policy selects, HSTS toggle +
 * Max age) and the Permissions-Policy card kept below them; the read behind
 * them (3397:33335 / 3397:33383), the save-error banner (3397:33431), the
 * dirty report the shell's footer follows (3397:34227) and the save
 * handler's write — the five columns, HSTS off as null, and a rejection
 * that keeps the values here.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor, within, act } from "@testing-library/react";
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
  getBuildrikClient: () => api,
}));

import { HeadersScreen } from "../HeadersScreen";

const getMock = api.siteDetail.settings.get.query;
const updateMock = api.siteDetail.settings.update.mutate;

/** The frame's row: every header set, HSTS at the recommended two years. */
const row = () => ({
  cspPolicy: "default-src 'self'; img-src 'self' data: https:",
  hstsMaxAge: 63072000,
  xFrameOptions: "SAMEORIGIN",
  referrerPolicy: "strict-origin-when-cross-origin",
  permissionsPolicy: "camera=(), microphone=()",
});

beforeEach(() => {
  getMock.mockReset().mockResolvedValue(row());
  updateMock.mockReset().mockResolvedValue({});
});

afterEach(() => cleanup());

interface SetupOpts {
  projectId?: string | null;
  onDirtyChange?: (d: boolean) => void;
  registerSaveHandler?: (h: (() => Promise<void>) | null) => void;
  onLoadStateChange?: (s: "loading" | "ready" | "error") => void;
  saveError?: string | null;
}

function setup(opts: SetupOpts = {}) {
  return render(
    <HeadersScreen
      projectId={opts.projectId === undefined ? "s1" : opts.projectId}
      onDirtyChange={opts.onDirtyChange}
      registerSaveHandler={opts.registerSaveHandler}
      onLoadStateChange={opts.onLoadStateChange}
      saveError={opts.saveError}
    />,
  );
}

/** Holds the latest handler the screen registered — what the shell's Save runs. */
function saveHandlerSpy() {
  const box: { current: (() => Promise<void>) | null } = { current: null };
  const register = vi.fn((h: (() => Promise<void>) | null) => {
    box.current = h;
  });
  return { box, register };
}

const loaded = () => waitFor(() => expect(screen.getByTestId("set-card-content-security-policy")).toBeInTheDocument());
const csp = () => screen.getByTestId("set-hd-csp") as HTMLTextAreaElement;
const xfo = () => screen.getByTestId("set-hd-xfo") as HTMLSelectElement;
const referrer = () => screen.getByTestId("set-hd-referrer") as HTMLSelectElement;
const hstsEnable = () => screen.getByTestId("set-hd-hsts-enable");
const hstsMax = () => screen.getByTestId("set-hd-hsts-max") as HTMLSelectElement;
const permissions = () => screen.getByTestId("set-hd-permissions") as HTMLInputElement;
const optionsOf = (select: HTMLSelectElement) => Array.from(select.options).map((o) => [o.text, o.value]);

describe("HeadersScreen — the frame's strip and cards", () => {
  it("reads the Site row, then draws the strip and the five cards in the frame's order", async () => {
    setup();
    await loaded();
    expect(getMock).toHaveBeenCalledWith({ siteId: "s1" });
    expect(screen.getByTestId("set-hd-restore")).toHaveTextContent(
      "Restoring a site version leaves this configuration unchanged.",
    );
    const cards = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
    expect(cards).toEqual([
      "Content Security Policy",
      "X-Frame-Options",
      "Referrer-Policy",
      "HSTS (HTTP Strict Transport Security)",
      "Permissions-Policy",
    ]);
    for (const slug of [
      "content-security-policy",
      "x-frame-options",
      "referrer-policy",
      "hsts-http-strict-transport-security",
      "permissions-policy",
    ]) {
      expect(screen.getByTestId(`set-card-${slug}`)).toBeInTheDocument();
    }
  });

  it("labels every control and gives it the testid as its id, so Search lands on it", async () => {
    setup();
    await loaded();
    expect(screen.getByLabelText("CSP header value")).toBe(csp());
    expect(within(screen.getByTestId("set-card-x-frame-options")).getByLabelText("Policy")).toBe(xfo());
    expect(within(screen.getByTestId("set-card-referrer-policy")).getByLabelText("Policy")).toBe(referrer());
    expect(screen.getByRole("switch", { name: "Enable HSTS" })).toBe(hstsEnable());
    expect(screen.getByLabelText("Max age")).toBe(hstsMax());
    expect(screen.getByLabelText("Header value")).toBe(permissions());
    for (const id of ["set-hd-csp", "set-hd-xfo", "set-hd-referrer", "set-hd-hsts-enable", "set-hd-hsts-max", "set-hd-permissions"]) {
      expect(screen.getByTestId(id).id).toBe(id);
    }
  });

  it("keeps the S7 probes' row anchors on the label-left rows", async () => {
    setup();
    await loaded();
    for (const stem of ["csp-header-value", "x-frame-policy", "referrer-policy", "enable-hsts", "max-age", "header-value"]) {
      expect(screen.getByTestId(`set-field-${stem}`)).toBeInTheDocument();
      expect(screen.getByTestId(`set-field-label-${stem}`)).toBeInTheDocument();
    }
  });

  it("prefills the five columns — HSTS on at the stored max age", async () => {
    setup();
    await loaded();
    expect(csp().value).toBe("default-src 'self'; img-src 'self' data: https:");
    expect(xfo().value).toBe("SAMEORIGIN");
    expect(referrer().value).toBe("strict-origin-when-cross-origin");
    expect(hstsEnable()).toHaveAttribute("aria-checked", "true");
    expect(hstsMax().value).toBe("63072000");
    expect(hstsMax().selectedOptions[0].text).toBe("2 years (recommended)");
    expect(hstsMax()).toBeEnabled();
    expect(permissions().value).toBe("camera=(), microphone=()");
  });

  it("an empty row is Not set everywhere, HSTS off with Max age disabled at the recommended value", async () => {
    getMock.mockResolvedValue({});
    setup();
    await loaded();
    expect(csp().value).toBe("");
    expect(xfo().value).toBe("");
    expect(xfo().selectedOptions[0].text).toBe("Not set");
    expect(referrer().value).toBe("");
    expect(referrer().selectedOptions[0].text).toBe("Not set");
    expect(hstsEnable()).toHaveAttribute("aria-checked", "false");
    expect(hstsMax()).toBeDisabled();
    expect(hstsMax().value).toBe("63072000");
    expect(permissions().value).toBe("");
  });

  it("offers the frame's Policy values with Not set last, and the four max ages in seconds", async () => {
    setup();
    await loaded();
    expect(optionsOf(xfo())).toEqual([
      ["DENY", "DENY"],
      ["SAMEORIGIN", "SAMEORIGIN"],
      ["Not set", ""],
    ]);
    expect(optionsOf(referrer())).toEqual([
      ["no-referrer", "no-referrer"],
      ["no-referrer-when-downgrade", "no-referrer-when-downgrade"],
      ["origin", "origin"],
      ["origin-when-cross-origin", "origin-when-cross-origin"],
      ["same-origin", "same-origin"],
      ["strict-origin", "strict-origin"],
      ["strict-origin-when-cross-origin", "strict-origin-when-cross-origin"],
      ["unsafe-url", "unsafe-url"],
      ["Not set", ""],
    ]);
    expect(optionsOf(hstsMax())).toEqual([
      ["1 month", "2592000"],
      ["6 months", "15552000"],
      ["1 year", "31536000"],
      ["2 years (recommended)", "63072000"],
    ]);
  });

  it("shows a stored max age the list does not carry as `<n> seconds`, and saves it back unsnapped", async () => {
    getMock.mockResolvedValue({ ...row(), hstsMaxAge: 300 });
    const { box, register } = saveHandlerSpy();
    setup({ registerSaveHandler: register });
    await loaded();
    expect(hstsEnable()).toHaveAttribute("aria-checked", "true");
    expect(hstsMax().value).toBe("300");
    expect(hstsMax().selectedOptions[0].text).toBe("300 seconds");
    expect(optionsOf(hstsMax())).toHaveLength(5);
    fireEvent.change(csp(), { target: { value: "default-src 'none'" } });
    await waitFor(() => expect(box.current).not.toBeNull());
    await act(async () => {
      await box.current!();
    });
    expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({ hstsMaxAge: 300 }));
  });

  it("a value the server's enum does not carry reads as Not set rather than an option that is not there", async () => {
    getMock.mockResolvedValue({ xFrameOptions: "ALLOW-FROM", referrerPolicy: "bogus" });
    setup();
    await loaded();
    expect(xfo().value).toBe("");
    expect(referrer().value).toBe("");
  });

  it("shows the dashboard-only message with no projectId and reads nothing", () => {
    setup({ projectId: null });
    expect(screen.getByText(/Open this site from the dashboard to manage headers/i)).toBeInTheDocument();
    expect(getMock).not.toHaveBeenCalled();
  });
});

describe("HeadersScreen — the server states", () => {
  it("draws the loading card with the brief's eyebrow and line, and reports loading (3397:33335)", () => {
    getMock.mockReturnValue(new Promise(() => {}));
    const onLoadStateChange = vi.fn();
    setup({ onLoadStateChange });
    const card = screen.getByTestId("set-load-card");
    expect(card).toHaveAttribute("data-state", "loading");
    expect(screen.getByTestId("set-load-title")).toHaveTextContent("Headers");
    expect(screen.getByTestId("set-load-line")).toHaveTextContent("CSP, X-Frame-Options, Referrer-Policy and HSTS.");
    expect(screen.getByTestId("set-load-state")).toHaveTextContent("Loading…");
    expect(onLoadStateChange).toHaveBeenCalledWith("loading");
    expect(screen.queryByTestId("set-card-content-security-policy")).toBeNull();
    expect(screen.queryByTestId("set-hd-restore")).toBeNull();
  });

  it("a failed read is the load-error card with Try again, which re-reads (3397:33383)", async () => {
    getMock.mockRejectedValueOnce(new Error("boom"));
    const onLoadStateChange = vi.fn();
    setup({ onLoadStateChange });
    await waitFor(() => expect(screen.getByTestId("set-load-card")).toHaveAttribute("data-state", "error"));
    expect(screen.getByTestId("set-load-state")).toHaveTextContent(
      "Couldn't load your headers. Check your connection, then try again.",
    );
    expect(onLoadStateChange).toHaveBeenCalledWith("error");
    fireEvent.click(screen.getByTestId("set-load-retry"));
    await loaded();
    expect(getMock).toHaveBeenCalledTimes(2);
    expect(onLoadStateChange).toHaveBeenLastCalledWith("ready");
    expect(xfo().value).toBe("SAMEORIGIN");
  });

  it("draws the shell's save-error banner above the strip (3397:33431)", async () => {
    setup({ saveError: "Header changes were not saved. Your changes are still here. Review the values, then retry." });
    await loaded();
    const banner = screen.getByTestId("set-save-error");
    expect(banner).toHaveTextContent("Header changes were not saved. Your changes are still here. Review the values, then retry.");
    expect(banner.compareDocumentPosition(screen.getByTestId("set-hd-restore")) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

describe("HeadersScreen — edits, dirty and the save handler", () => {
  it("the handler writes the five columns — trimmed text as null when empty, selects as null when Not set", async () => {
    const { box, register } = saveHandlerSpy();
    setup({ registerSaveHandler: register });
    await loaded();
    fireEvent.change(csp(), { target: { value: "   " } });
    fireEvent.change(xfo(), { target: { value: "DENY" } });
    fireEvent.change(referrer(), { target: { value: "" } });
    fireEvent.change(hstsMax(), { target: { value: "31536000" } });
    fireEvent.change(permissions(), { target: { value: " geolocation=(self) " } });
    await waitFor(() => expect(box.current).not.toBeNull());
    await act(async () => {
      await box.current!();
    });
    expect(updateMock).toHaveBeenCalledWith({
      id: "s1",
      cspPolicy: null,
      hstsMaxAge: 31536000,
      xFrameOptions: "DENY",
      referrerPolicy: null,
      permissionsPolicy: "geolocation=(self)",
    });
  });

  it("Enable HSTS off writes hstsMaxAge null and disables Max age; back on restores the chosen value", async () => {
    const { box, register } = saveHandlerSpy();
    setup({ registerSaveHandler: register });
    await loaded();
    fireEvent.change(hstsMax(), { target: { value: "2592000" } });
    fireEvent.click(hstsEnable());
    expect(hstsEnable()).toHaveAttribute("aria-checked", "false");
    expect(hstsMax()).toBeDisabled();
    await waitFor(() => expect(box.current).not.toBeNull());
    await act(async () => {
      await box.current!();
    });
    expect(updateMock).toHaveBeenLastCalledWith(expect.objectContaining({ hstsMaxAge: null }));

    fireEvent.click(hstsEnable());
    expect(hstsEnable()).toHaveAttribute("aria-checked", "true");
    expect(hstsMax()).toBeEnabled();
    expect(hstsMax().value).toBe("2592000");
    await waitFor(() => expect(box.current).not.toBeNull());
    await act(async () => {
      await box.current!();
    });
    expect(updateMock).toHaveBeenLastCalledWith(expect.objectContaining({ hstsMaxAge: 2592000 }));
  });

  it("turning HSTS on from an empty row writes the recommended two years", async () => {
    getMock.mockResolvedValue({});
    const { box, register } = saveHandlerSpy();
    setup({ registerSaveHandler: register });
    await loaded();
    fireEvent.click(hstsEnable());
    await waitFor(() => expect(box.current).not.toBeNull());
    await act(async () => {
      await box.current!();
    });
    expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({ hstsMaxAge: 63072000 }));
  });

  it("a refused save rejects, and the values and the dirty state stay here", async () => {
    updateMock.mockRejectedValue(new Error("save failed"));
    const { box, register } = saveHandlerSpy();
    const onDirtyChange = vi.fn();
    setup({ registerSaveHandler: register, onDirtyChange });
    await loaded();
    fireEvent.change(csp(), { target: { value: "default-src 'none'" } });
    await waitFor(() => expect(box.current).not.toBeNull());
    await expect(box.current!()).rejects.toThrow("save failed");
    expect(csp().value).toBe("default-src 'none'");
    expect(onDirtyChange).toHaveBeenLastCalledWith(true);
    expect(box.current).not.toBeNull();
  });
});
