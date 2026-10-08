/**
 * AccessScreen tests — 8136:216089 password-set, 8136:216319 password-off,
 * 8136:216535 set-password: the switch, the "A password is set" line and its
 * Change + Remove (owner 2026-10-04: the New password field waits behind
 * Change), the purpose line on every state, the Password field when none is
 * stored, the off line,
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
  it("owner 2026-10-04: draws the switch on, 'A password is set' with Change and Remove — no field until Change — and the publish note", async () => {
    setup();
    await loaded();
    expect(screen.getByText("Password protection · Pro")).toBeInTheDocument();
    expect(screen.getByTestId("set-access-toggle")).toHaveAttribute("aria-checked", "true");
    expect(screen.getByTestId("set-access-is-set")).toHaveTextContent("A password is set");
    expect(screen.getByTestId("set-access-change")).toHaveTextContent("Change");
    expect(screen.getByTestId("set-access-remove")).toHaveTextContent("Remove");
    expect(screen.queryByLabelText("New password")).toBeNull();
    expect(screen.getByText("Applies on next publish")).toBeInTheDocument();
    expect(get).toHaveBeenCalledWith({ siteId: "s1" });
    // The stored value is never on screen.
    expect(document.querySelector("input[type=password]")).toBeNull();
  });

  it("Change opens the New password field, focused and empty; Cancel closes it without a write", async () => {
    const { onDirtyChange } = setup();
    await loaded();
    fireEvent.click(screen.getByTestId("set-access-change"));
    const field = screen.getByLabelText("New password");
    expect(field).toHaveAttribute("placeholder", "Enter a new password to change it");
    expect(field).toHaveValue("");
    expect(field.id).toBe("access-password");
    await waitFor(() => expect(document.activeElement).toBe(field));
    expect(screen.queryByTestId("set-access-change")).toBeNull();
    fireEvent.change(field, { target: { value: "half" } });
    fireEvent.click(screen.getByTestId("set-access-change-cancel"));
    expect(screen.queryByLabelText("New password")).toBeNull();
    await waitFor(() => expect(onDirtyChange).toHaveBeenLastCalledWith(false));
    expect(updateSiteColumns).not.toHaveBeenCalled();
  });

  it("typing a new password is dirty and Save sends it — and only it", async () => {
    const { onDirtyChange, save } = setup();
    await loaded();
    fireEvent.click(screen.getByTestId("set-access-change"));
    fireEvent.change(screen.getByLabelText("New password"), { target: { value: "s3cret!" } });
    await waitFor(() => expect(onDirtyChange).toHaveBeenLastCalledWith(true));
    await save();
    expect(updateSiteColumns).toHaveBeenCalledWith("s1", { publishedPassword: "s3cret!" });
    await waitFor(() => expect(onDirtyChange).toHaveBeenLastCalledWith(false));
    expect(screen.queryByLabelText("New password")).toBeNull();
    expect(screen.getByTestId("set-access-is-set")).toBeInTheDocument();
  });

  /* QA 2026-10-05: a New password of only spaces enabled Save and would have
     stored a blank-looking password. */
  it("a New password of only spaces is refused before Save", async () => {
    const { registerFieldErrors } = setup();
    await loaded();
    fireEvent.click(screen.getByTestId("set-access-change"));
    fireEvent.change(screen.getByLabelText("New password"), { target: { value: "   " } });
    await waitFor(() =>
      expect(registerFieldErrors).toHaveBeenLastCalledWith({ "publishing.publishedPassword": "A password can't be only spaces" }),
    );
    fireEvent.change(screen.getByLabelText("New password"), { target: { value: " ok " } });
    await waitFor(() => expect(registerFieldErrors).toHaveBeenLastCalledWith(null));
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

  it("after Remove, keyboard focus moves to the protection switch, not <body>", async () => {
    setup();
    await loaded();
    const remove = screen.getByTestId("set-access-remove");
    remove.focus();
    fireEvent.click(remove);
    await waitFor(() => expect(document.activeElement).toBe(screen.getByTestId("set-access-toggle")));
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

  it("owner 2026-10-04: off, the card says what password protection is for", async () => {
    setup();
    await loaded();
    expect(screen.getByTestId("set-access-purpose")).toHaveTextContent(
      "Visitors must enter a password before they can see the published site. Useful for client previews and staging.",
    );
  });

  it("switching on asks for a Password at once (focused), refuses Save until one is typed, then saves it", async () => {
    const { registerFieldErrors, save } = setup();
    await loaded();
    expect(screen.getByTestId("set-access-toggle")).toHaveAttribute("aria-checked", "false");
    expect(screen.getByTestId("set-access-off")).toHaveTextContent("Anyone with the address can view the published site.");
    expect(screen.queryByLabelText("Password")).toBeNull();
    fireEvent.click(screen.getByTestId("set-access-toggle"));
    expect(screen.getByLabelText("Password")).toHaveAttribute("placeholder", "Enter a password");
    await waitFor(() => expect(document.activeElement).toBe(screen.getByLabelText("Password")));
    expect(screen.queryByTestId("set-access-is-set")).toBeNull();
    await waitFor(() =>
      expect(registerFieldErrors).toHaveBeenLastCalledWith({ "publishing.publishedPassword": "Enter a password to turn protection on" }),
    );
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "open-sesame" } });
    await waitFor(() => expect(registerFieldErrors).toHaveBeenLastCalledWith(null));
    await save();
    expect(updateSiteColumns).toHaveBeenCalledWith("s1", { publishedPassword: "open-sesame" });
    await waitFor(() => expect(screen.getByTestId("set-access-is-set")).toBeInTheDocument());
    // Set → the stored state: Change + Remove, the typed value gone from the DOM.
    expect(screen.getByTestId("set-access-change")).toBeInTheDocument();
    expect(document.querySelector("input[type=password]")).toBeNull();
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
    // Navigation: it stays on the read-only screen.
    setup({ readOnly: true });
    await loaded();
    expect(screen.getByTestId("set-access-share-links").tagName).toBe("A");
  });

  it("a failed read is the load-error card with Try again", async () => {
    get.mockRejectedValueOnce(new Error("network"));
    setup();
    await waitFor(() => expect(screen.getByTestId("set-load-retry")).toBeInTheDocument());
    fireEvent.click(screen.getByTestId("set-load-retry"));
    await loaded();
  });
});

describe("AccessScreen — below Pro (8136:216758): the screen draws its own lock", () => {
  it("locks the password card — Pro, what it does, Upgrade to Pro — and keeps Share links", () => {
    const onUpgrade = vi.fn();
    const { registerSaveHandler } = setup({ planLocked: true, onUpgrade });
    const card = screen.getByTestId("set-card-password-protection");
    expect(card).toHaveTextContent("Password protection");
    expect(screen.getByTestId("set-access-pro")).toHaveTextContent("Pro");
    expect(card).toHaveTextContent("Protect your published site with a password.");
    expect(card).toHaveTextContent("Upgrade to Pro to control who can view your site.");
    // No switch, no password field: nothing here saves.
    expect(screen.queryByTestId("set-access-toggle")).toBeNull();
    expect(screen.queryByTestId("set-access-password")).toBeNull();
    expect(registerSaveHandler.mock.calls.every((c) => c[0] === null)).toBe(true);
    fireEvent.click(screen.getByTestId("set-access-upgrade"));
    expect(onUpgrade).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("set-access-share-links")).toHaveTextContent("Manage share links ↗");
  });
});
