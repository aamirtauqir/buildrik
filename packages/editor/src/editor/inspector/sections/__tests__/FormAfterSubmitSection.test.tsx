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

  it("switches to a redirect URL field and saves it", async () => {
    render(<FormAfterSubmitSection elementId="f" composer={project()} isOpen />);
    await waitFor(() => screen.getByLabelText("After-submit action"));

    fireEvent.change(screen.getByLabelText("After-submit action"), { target: { value: "REDIRECT" } });
    await waitFor(() => expect(api.forms.updateBlock.mutate).toHaveBeenCalledWith(
      expect.objectContaining({ siteId: "s1", blockId: "f", successAction: "REDIRECT" }),
    ));
    await waitFor(() => expect(screen.getByLabelText("Redirect URL")).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText("Redirect URL"), { target: { value: "https://example.com/thanks" } });
    fireEvent.blur(screen.getByLabelText("Redirect URL"));
    await waitFor(() => expect(api.forms.updateBlock.mutate).toHaveBeenCalledWith(
      expect.objectContaining({ redirectUrl: "https://example.com/thanks" }),
    ));
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
});
