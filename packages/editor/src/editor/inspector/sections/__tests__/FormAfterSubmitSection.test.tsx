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
    await waitFor(() => expect(screen.getByLabelText("Success message")).toBeInTheDocument());
  });

  it("I1: switching to Redirect with no URL yet does NOT save a call the schema would reject", async () => {
    render(<FormAfterSubmitSection elementId="f" composer={project()} isOpen />);
    await waitFor(() => screen.getByLabelText("After-submit action"));

    fireEvent.change(screen.getByLabelText("After-submit action"), { target: { value: "REDIRECT" } });
    await waitFor(() => expect(screen.getByLabelText("Redirect URL")).toBeInTheDocument());
    // No network call yet — the row would be `REDIRECT` with no target, which
    // the server schema refuses. Sending it anyway (and the UI just showing
    // REDIRECT as if it saved) was exactly I1's silent-failure bug.
    expect(api.forms.updateBlock.mutate).not.toHaveBeenCalled();
  });

  it("I1: typing the URL then blurring sends successAction + redirectUrl bundled in one call", async () => {
    render(<FormAfterSubmitSection elementId="f" composer={project()} isOpen />);
    await waitFor(() => screen.getByLabelText("After-submit action"));
    fireEvent.change(screen.getByLabelText("After-submit action"), { target: { value: "REDIRECT" } });
    await waitFor(() => screen.getByLabelText("Redirect URL"));

    fireEvent.change(screen.getByLabelText("Redirect URL"), { target: { value: "https://example.com/thanks" } });
    fireEvent.blur(screen.getByLabelText("Redirect URL"));
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
    await waitFor(() => screen.getByLabelText("Redirect URL"));

    fireEvent.change(screen.getByLabelText("After-submit action"), { target: { value: "MESSAGE" } });
    await waitFor(() => expect(api.forms.updateBlock.mutate).toHaveBeenCalledWith(
      expect.objectContaining({ successAction: "MESSAGE", redirectUrl: "https://example.com/thanks" }),
    ));
  });

  it("Fix round 2 (finding 1): blurring a field without changing it saves nothing", async () => {
    render(<FormAfterSubmitSection elementId="f" composer={project()} isOpen />);
    await waitFor(() => screen.getByLabelText("Notification email"));
    // Tabbing through the field — focus then blur, no typing — must not
    // trigger a write. An EDITOR would otherwise hit a FORBIDDEN for the
    // notify-email field having never touched it.
    fireEvent.blur(screen.getByLabelText("Notification email"));
    fireEvent.blur(screen.getByLabelText("Success message"));
    await new Promise((r) => setTimeout(r, 0));
    expect(api.forms.updateBlock.mutate).not.toHaveBeenCalled();
    expect(screen.queryByText(/Only workspace Admins/)).not.toBeInTheDocument();
  });

  it("saves the notify email on blur", async () => {
    render(<FormAfterSubmitSection elementId="f" composer={project()} isOpen />);
    await waitFor(() => screen.getByLabelText("Notification email"));
    fireEvent.change(screen.getByLabelText("Notification email"), { target: { value: "me@example.com" } });
    fireEvent.blur(screen.getByLabelText("Notification email"));
    await waitFor(() => expect(api.forms.updateBlock.mutate).toHaveBeenCalledWith(
      expect.objectContaining({ notifyEmail: "me@example.com" }),
    ));
  });

  it("toggles spam protection", async () => {
    render(<FormAfterSubmitSection elementId="f" composer={project()} isOpen />);
    await waitFor(() => screen.getByRole("switch"));
    fireEvent.click(screen.getByRole("switch"));
    await waitFor(() => expect(api.forms.updateBlock.mutate).toHaveBeenCalledWith(
      expect.objectContaining({ spamProtection: false }),
    ));
  });

  it("M6: the spam protection toggle has an accessible name", async () => {
    render(<FormAfterSubmitSection elementId="f" composer={project()} isOpen />);
    await waitFor(() => expect(screen.getByRole("switch", { name: "Spam protection" })).toBeInTheDocument());
  });

  it("I4: a non-admin's notify-email edit is reverted and explained on FORBIDDEN", async () => {
    api.forms.updateBlock.mutate.mockRejectedValueOnce(
      Object.assign(new Error("FORBIDDEN"), { data: { code: "FORBIDDEN" } }),
    );
    render(<FormAfterSubmitSection elementId="f" composer={project()} isOpen />);
    await waitFor(() => screen.getByLabelText("Notification email"));

    fireEvent.change(screen.getByLabelText("Notification email"), { target: { value: "me@example.com" } });
    fireEvent.blur(screen.getByLabelText("Notification email"));

    await waitFor(() => expect(screen.getByText(/Only workspace Admins/)).toBeInTheDocument());
    // Reverted — the field no longer shows the edit that was never actually saved.
    expect((screen.getByLabelText("Notification email") as HTMLInputElement).value).toBe("");
  });

  it("I4: other fields stay editable after a notify-email FORBIDDEN — the gate is per-field", async () => {
    api.forms.updateBlock.mutate.mockRejectedValueOnce(
      Object.assign(new Error("FORBIDDEN"), { data: { code: "FORBIDDEN" } }),
    );
    render(<FormAfterSubmitSection elementId="f" composer={project()} isOpen />);
    await waitFor(() => screen.getByLabelText("Notification email"));
    fireEvent.change(screen.getByLabelText("Notification email"), { target: { value: "me@example.com" } });
    fireEvent.blur(screen.getByLabelText("Notification email"));
    await waitFor(() => expect(screen.getByText(/Only workspace Admins/)).toBeInTheDocument());

    api.forms.updateBlock.mutate.mockResolvedValue({});
    fireEvent.click(screen.getByRole("switch", { name: "Spam protection" }));
    await waitFor(() => expect(api.forms.updateBlock.mutate).toHaveBeenLastCalledWith(
      expect.objectContaining({ spamProtection: false }),
    ));
  });
});
