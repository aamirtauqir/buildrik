/**
 * Form › AFTER SUBMIT + PROTECTION (board 4428:141878) — the write path that
 * didn't exist: FormBlock.successMessage/notifyEmail had no editor UI, and
 * successAction/redirectUrl/spamProtection didn't exist at all before this.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach, beforeAll, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { Composer } from "@/engine/Composer";
import { FormAfterSubmitSection } from "../FormAfterSubmitSection";

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = (() => ({
    drawImage: () => {}, getImageData: () => ({ data: new Uint8ClampedArray() }),
    putImageData: () => {}, clearRect: () => {},
  })) as unknown as HTMLCanvasElement["getContext"];
  (globalThis as { indexedDB?: unknown }).indexedDB = { open: () => ({}) };
});

const { api } = vi.hoisted(() => ({
  api: {
    forms: {
      getBlock: { query: vi.fn() },
      updateBlock: { mutate: vi.fn() },
    },
  },
}));

vi.mock("@/services/api-client", () => ({
  getBuildrikClient: () => api,
}));

vi.mock("@/services/BuildrikSyncProvider", () => ({
  getSiteIdFromUrl: () => "s1",
}));

function project() {
  const composer = new Composer({} as never);
  composer.importProject({
    pages: [{ id: "p", name: "Home", slug: "", isHome: true,
      root: { id: "root", type: "container", tagName: "div", children: [
        { id: "f", type: "form", tagName: "form", children: [] },
      ] } }],
  } as never);
  return composer;
}

const defaults = {
  successMessage: null, successAction: "MESSAGE" as const, redirectUrl: null, notifyEmail: null, spamProtection: true,
};

afterEach(cleanup);

describe("Form › AFTER SUBMIT + PROTECTION", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.forms.getBlock.query.mockResolvedValue({ ...defaults });
    api.forms.updateBlock.mutate.mockResolvedValue({});
  });

  it("loads the block's settings and shows the message field for the MESSAGE action", async () => {
    render(<FormAfterSubmitSection elementId="f" composer={project()} isOpen />);
    expect(api.forms.getBlock.query).toHaveBeenCalledWith({ siteId: "s1", blockId: "f" });
    await waitFor(() => expect(screen.getByLabelText("Message")).toBeInTheDocument());
  });

  it("I1: switching to Redirect with no URL yet does NOT save a call the schema would reject", async () => {
    render(<FormAfterSubmitSection elementId="f" composer={project()} isOpen />);
    await waitFor(() => screen.getByLabelText("Then"));

    fireEvent.change(screen.getByLabelText("Then"), { target: { value: "REDIRECT" } });
    await waitFor(() => expect(screen.getByLabelText("Redirect to")).toBeInTheDocument());
    // No network call yet — the row would be `REDIRECT` with no target, which
    // the server schema refuses. Sending it anyway (and the UI just showing
    // REDIRECT as if it saved) was exactly I1's silent-failure bug.
    expect(api.forms.updateBlock.mutate).not.toHaveBeenCalled();
  });

  it("I1: typing the URL then blurring sends successAction + redirectUrl bundled in one call", async () => {
    render(<FormAfterSubmitSection elementId="f" composer={project()} isOpen />);
    await waitFor(() => screen.getByLabelText("Then"));
    fireEvent.change(screen.getByLabelText("Then"), { target: { value: "REDIRECT" } });
    await waitFor(() => screen.getByLabelText("Redirect to"));

    fireEvent.change(screen.getByLabelText("Redirect to"), { target: { value: "https://example.com/thanks" } });
    fireEvent.blur(screen.getByLabelText("Redirect to"));
    await waitFor(() => expect(api.forms.updateBlock.mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        siteId: "s1",
        blockId: "f",
        successAction: "REDIRECT",
        redirectUrl: "https://example.com/thanks",
      }),
    ));
  });

  it("I1: switching action away from Redirect (with an existing URL) saves immediately, both fields bundled", async () => {
    api.forms.getBlock.query.mockResolvedValue({
      ...defaults, successAction: "REDIRECT", redirectUrl: "https://example.com/thanks",
    });
    render(<FormAfterSubmitSection elementId="f" composer={project()} isOpen />);
    await waitFor(() => screen.getByLabelText("Redirect to"));

    fireEvent.change(screen.getByLabelText("Then"), { target: { value: "" } });
    await waitFor(() => expect(api.forms.updateBlock.mutate).toHaveBeenCalledWith(
      expect.objectContaining({ successAction: "MESSAGE", redirectUrl: "https://example.com/thanks" }),
    ));
  });

  it("blurring a field without changing it saves nothing", async () => {
    render(<FormAfterSubmitSection elementId="f" composer={project()} isOpen />);
    await waitFor(() => screen.getByLabelText("Send to"));
    // Tabbing through the field — focus then blur, no typing — must not
    // trigger a write. An EDITOR would otherwise hit a FORBIDDEN for the
    // notify-email field having never touched it.
    fireEvent.blur(screen.getByLabelText("Send to"));
    fireEvent.blur(screen.getByLabelText("Message"));
    await new Promise((r) => setTimeout(r, 0));
    expect(api.forms.updateBlock.mutate).not.toHaveBeenCalled();
    expect(screen.queryByTestId("form-after-submit-admin-only")).not.toBeInTheDocument();
  });

  it("saves the notify email on blur", async () => {
    render(<FormAfterSubmitSection elementId="f" composer={project()} isOpen />);
    await waitFor(() => screen.getByLabelText("Send to"));
    fireEvent.change(screen.getByLabelText("Send to"), { target: { value: "me@example.com" } });
    fireEvent.blur(screen.getByLabelText("Send to"));
    await waitFor(() => expect(api.forms.updateBlock.mutate).toHaveBeenCalledWith(
      expect.objectContaining({ notifyEmail: "me@example.com" }),
    ));
  });

  it("2L9 F10: Then · Message · Notifications › Send to · Spam protection › Block automated submissions · status · note", async () => {
    const { container } = render(<FormAfterSubmitSection elementId="f" composer={project()} isOpen />);
    await waitFor(() => screen.getByLabelText("Then"));
    expect((screen.getByLabelText("Then") as HTMLSelectElement).selectedOptions[0].textContent).toBe("Show message");
    const text = container.textContent ?? "";
    const at = [
      "Then", "Message", "Notifications", "Send to", "Spam protection", "Applies on next publish", "Block automated submissions",
      "Form settings status", "Saved", "Saved separately from page edits; outside document Undo.",
    ].map((t) => text.indexOf(t));
    expect(at.every((i) => i >= 0)).toBe(true);
    expect([...at].sort((a, b) => a - b)).toEqual(at);
  });

  it("toggles spam protection", async () => {
    render(<FormAfterSubmitSection elementId="f" composer={project()} isOpen />);
    await waitFor(() => screen.getByRole("checkbox", { name: "Block automated submissions" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Block automated submissions" }));
    await waitFor(() => expect(api.forms.updateBlock.mutate).toHaveBeenCalledWith(
      expect.objectContaining({ spamProtection: false }),
    ));
  });

  it("M6: the spam protection toggle has an accessible name", async () => {
    render(<FormAfterSubmitSection elementId="f" composer={project()} isOpen />);
    await waitFor(() => expect(screen.getByRole("checkbox", { name: "Block automated submissions" })).toBeInTheDocument());
  });

  it("I4 / F15: a non-admin's notify-email edit is reverted and Send to reads 'Changing Send to needs Admin access.'", async () => {
    api.forms.updateBlock.mutate.mockRejectedValueOnce(
      Object.assign(new Error("FORBIDDEN"), { data: { code: "FORBIDDEN" } }),
    );
    render(<FormAfterSubmitSection elementId="f" composer={project()} isOpen />);
    await waitFor(() => screen.getByLabelText("Send to"));

    fireEvent.change(screen.getByLabelText("Send to"), { target: { value: "me@example.com" } });
    fireEvent.blur(screen.getByLabelText("Send to"));

    await waitFor(() => expect(screen.getByTestId("form-after-submit-admin-only")).toHaveTextContent("Changing Send to needs Admin access."));
    // Reverted — nothing shows the edit that was never actually saved.
    expect(screen.queryByLabelText("Send to")).toBeNull();
    expect(screen.queryByDisplayValue("me@example.com")).toBeNull();
    expect(screen.getByTestId("form-settings-status")).toHaveTextContent("Saved");
  });

  it("I4: other fields stay editable after a notify-email FORBIDDEN — the gate is per-field", async () => {
    api.forms.updateBlock.mutate.mockRejectedValueOnce(
      Object.assign(new Error("FORBIDDEN"), { data: { code: "FORBIDDEN" } }),
    );
    render(<FormAfterSubmitSection elementId="f" composer={project()} isOpen />);
    await waitFor(() => screen.getByLabelText("Send to"));
    fireEvent.change(screen.getByLabelText("Send to"), { target: { value: "me@example.com" } });
    fireEvent.blur(screen.getByLabelText("Send to"));
    await waitFor(() => expect(screen.getByTestId("form-after-submit-admin-only")).toBeInTheDocument());

    api.forms.updateBlock.mutate.mockResolvedValue({});
    fireEvent.click(screen.getByRole("checkbox", { name: "Block automated submissions" }));
    await waitFor(() => expect(api.forms.updateBlock.mutate).toHaveBeenLastCalledWith(
      expect.objectContaining({ spamProtection: false }),
    ));
  });

  /* L3-028: the server's refusal read "notifyEmail: Invalid email" — the
     raw field key, then Zod's default. The field's own sentence is shown. */
  it("shows a refused field's sentence without the raw field key", async () => {
    api.forms.updateBlock.mutate.mockRejectedValueOnce(
      Object.assign(new Error("notifyEmail: Enter an email address like you@company.com"), {
        data: { code: "BAD_REQUEST", zodIssues: [{ path: "notifyEmail", message: "Enter an email address like you@company.com" }] },
      }),
    );
    render(<FormAfterSubmitSection elementId="f" composer={project()} isOpen />);
    await waitFor(() => screen.getByLabelText("Send to"));
    fireEvent.change(screen.getByLabelText("Send to"), { target: { value: "nope" } });
    fireEvent.blur(screen.getByLabelText("Send to"));
    await waitFor(() => expect(screen.getByText("Enter an email address like you@company.com")).toBeInTheDocument());
    expect(screen.queryByText(/notifyEmail:/)).toBeNull();
  });

  it("F12: a failed save keeps what was typed, says so, and Retry sends it again", async () => {
    /* Persistent, not Once: a Once queued by an earlier test that never
       reached its write would be consumed here instead. */
    api.forms.updateBlock.mutate.mockReset();
    api.forms.updateBlock.mutate.mockRejectedValue(new Error("Network down"));
    render(<FormAfterSubmitSection elementId="f" composer={project()} isOpen />);
    await waitFor(() => screen.getByLabelText("Message"));
    fireEvent.change(screen.getByLabelText("Message"), { target: { value: "Thanks!" } });
    fireEvent.blur(screen.getByLabelText("Message"));
    await waitFor(() => expect(screen.getByTestId("form-settings-status")).toHaveTextContent("Couldn’t save — your message is still here."), { timeout: 5000 });
    expect(screen.getByLabelText("Message")).toHaveValue("Thanks!");
    api.forms.updateBlock.mutate.mockResolvedValue({});
    fireEvent.click(screen.getByTestId("form-settings-retry"));
    await waitFor(() => expect(screen.getByTestId("form-settings-status")).toHaveTextContent("Saved"), { timeout: 5000 });
    expect(api.forms.updateBlock.mutate).toHaveBeenCalledTimes(2);
    expect(api.forms.updateBlock.mutate).toHaveBeenLastCalledWith(expect.objectContaining({ successMessage: "Thanks!" }));
  });

  it("F17: Redirect with no destination yet reads 'Choose a destination to save'", async () => {
    render(<FormAfterSubmitSection elementId="f" composer={project()} isOpen />);
    await waitFor(() => screen.getByLabelText("Then"));
    fireEvent.change(screen.getByLabelText("Then"), { target: { value: "REDIRECT" } });
    expect(screen.getByTestId("form-settings-status")).toHaveTextContent("Choose a destination to save");
  });

  it("F16: loading reads 'Loading form settings…'", () => {
    api.forms.getBlock.query.mockReturnValue(new Promise(() => {}));
    render(<FormAfterSubmitSection elementId="f" composer={project()} isOpen />);
    expect(screen.getByText("Loading form settings…")).toBeInTheDocument();
  });
});
