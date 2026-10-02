/**
 * AccessScreen tests — 8136:216089 password-set, 8136:216319 password-off,
 * 8136:216535 set-password: the switch, the "A password is set" line and its
 * New password + Remove, the Password field when none is stored, the off line,
 * the footer save through `siteDetail.settings.update` (never echoing the
 * stored value), the refusal before Save, and the Share links door.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup, act } from "@testing-library/react";
import * as React from "react";

const { get, updateSiteColumns } = vi.hoisted(() => ({ get: vi.fn(), updateSiteColumns: vi.fn() }));

vi.mock("@/services/api-client", () => ({
  getBuildrikClient: () => ({ siteDetail: { settings: { get: { query: get } } } }),
}));
vi.mock("@/services/BuildrikSyncProvider", () => ({ updateSiteColumns }));

import { AccessScreen } from "../AccessScreen";

beforeEach(() => {
  get.mockReset().mockResolvedValue({ hasPublishedPassword: true, publishedPassword: null });
  updateSiteColumns.mockReset().mockResolvedValue({});
});
afterEach(() => cleanup());

function setup(over: Partial<React.ComponentProps<typeof AccessScreen>> = {}) {
  const onDirtyChange = vi.fn();
  const registerSaveHandler = vi.fn();
  const registerFieldErrors = vi.fn();
  render(
    <AccessScreen
      projectId="s1"
      onDirtyChange={onDirtyChange}
      registerSaveHandler={registerSaveHandler}
      registerFieldErrors={registerFieldErrors}
      {...over}
    />,
  );
  const save = async () => {
    const handler = registerSaveHandler.mock.calls.at(-1)?.[0] as (() => Promise<void>) | null;
    expect(handler).toBeTypeOf("function");
    await act(async () => handler!());
  };
  return { onDirtyChange, registerSaveHandler, registerFieldErrors, save };
}

const loaded = () => waitFor(() => expect(screen.getByTestId("set-card-password-protection")).toBeInTheDocument());

describe("AccessScreen — a password is stored (8136:216089)", () => {
  it("draws the switch on, 'A password is set', the New password field, Remove and the publish note", async () => {
    setup();
    await loaded();
    expect(screen.getByText("Password protection · Pro")).toBeInTheDocument();
    expect(screen.getByTestId("set-access-toggle")).toHaveAttribute("aria-checked", "true");
    expect(screen.getByTestId("set-access-is-set")).toHaveTextContent("A password is set");
    expect(screen.getByLabelText("New password")).toHaveAttribute("placeholder", "Enter a new password to change it");
    expect(screen.getByLabelText("New password")).toHaveValue("");
    expect(screen.getByLabelText("New password").id).toBe("access-password");
    expect(screen.getByTestId("set-access-remove")).toHaveTextContent("Remove");
    expect(screen.getByText("Applies on next publish")).toBeInTheDocument();
    expect(get).toHaveBeenCalledWith({ siteId: "s1" });
  });

  it("typing a new password is dirty and Save sends it — and only it", async () => {
    const { onDirtyChange, save } = setup();
    await loaded();
    fireEvent.change(screen.getByLabelText("New password"), { target: { value: "s3cret!" } });
    await waitFor(() => expect(onDirtyChange).toHaveBeenLastCalledWith(true));
    await save();
    expect(updateSiteColumns).toHaveBeenCalledWith("s1", { publishedPassword: "s3cret!" });
    await waitFor(() => expect(onDirtyChange).toHaveBeenLastCalledWith(false));
    expect(screen.getByLabelText("New password")).toHaveValue("");
  });

  it("Remove turns protection off (8136:216319) and Save sends null", async () => {
    const { save } = setup();
    await loaded();
    fireEvent.click(screen.getByTestId("set-access-remove"));
    expect(screen.getByTestId("set-access-toggle")).toHaveAttribute("aria-checked", "false");
    expect(screen.getByTestId("set-access-off")).toHaveTextContent("Password protection will be off after the next publish.");
    expect(screen.queryByLabelText("New password")).toBeNull();
    await save();
    expect(updateSiteColumns).toHaveBeenCalledWith("s1", { publishedPassword: null });
    await waitFor(() => expect(screen.getByTestId("set-access-off")).toHaveTextContent("Anyone with the address"));
  });

  it("untouched, nothing is dirty and no save handler is registered", async () => {
    const { onDirtyChange, registerSaveHandler } = setup();
    await loaded();
    expect(onDirtyChange).not.toHaveBeenCalledWith(true);
    expect(registerSaveHandler).not.toHaveBeenCalledWith(expect.any(Function));
  });
});

describe("AccessScreen — no password stored (8136:216535)", () => {
  beforeEach(() => get.mockResolvedValue({ hasPublishedPassword: false }));

  it("switching on asks for a Password, refuses Save until one is typed, then saves it", async () => {
    const { registerFieldErrors, save } = setup();
    await loaded();
    expect(screen.getByTestId("set-access-toggle")).toHaveAttribute("aria-checked", "false");
    expect(screen.getByTestId("set-access-off")).toHaveTextContent("Anyone with the address can view the published site.");
    fireEvent.click(screen.getByTestId("set-access-toggle"));
    expect(screen.getByLabelText("Password")).toHaveAttribute("placeholder", "Enter a password");
    expect(screen.queryByTestId("set-access-is-set")).toBeNull();
    await waitFor(() =>
      expect(registerFieldErrors).toHaveBeenLastCalledWith({ "publishing.publishedPassword": "Enter a password to turn protection on" }),
    );
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "open-sesame" } });
    await waitFor(() => expect(registerFieldErrors).toHaveBeenLastCalledWith(null));
    await save();
    expect(updateSiteColumns).toHaveBeenCalledWith("s1", { publishedPassword: "open-sesame" });
    await waitFor(() => expect(screen.getByTestId("set-access-is-set")).toBeInTheDocument());
  });

  it("shows the server's refusal under the field", async () => {
    setup({ fieldErrors: { "publishing.publishedPassword": "Password protection is a Pro feature" } });
    await loaded();
    fireEvent.click(screen.getByTestId("set-access-toggle"));
    expect(screen.getByText("Password protection is a Pro feature")).toBeInTheDocument();
  });
});

describe("AccessScreen — Share links and the load states", () => {
  it("Manage share links opens the dashboard's Sharing tab in a new tab; read-only hides it", async () => {
    setup();
    await loaded();
    const link = screen.getByTestId("set-access-share-links");
    expect(link).toHaveTextContent("Manage share links ↗");
    expect(link.getAttribute("href")).toMatch(/\/dashboard\/sites\/s1\/access$/);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link.id).toBe("access-share-links");
    cleanup();
    setup({ readOnly: true });
    await loaded();
    expect(screen.queryByTestId("set-access-share-links")).toBeNull();
  });

  it("a failed read is the load-error card with Try again", async () => {
    get.mockRejectedValueOnce(new Error("network"));
    setup();
    await waitFor(() => expect(screen.getByTestId("set-load-retry")).toBeInTheDocument());
    fireEvent.click(screen.getByTestId("set-load-retry"));
    await loaded();
  });
});
