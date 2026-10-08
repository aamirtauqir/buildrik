// @vitest-environment jsdom
/**
 * Brand from logo or website — BRP1-M11's seven states (spec §9, D16/D17).
 * @license BSD-3-Clause
 */
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { resolveTokenLiteral } from "@buildrik/shared/tokens";
import type { DesignToken } from "@buildrik/shared/schemas/design-tokens";
import { DEFAULT_TOKENS } from "@/engine/designSystem/defaultTokens";
import { ToastProvider } from "@/editor/chrome-ui";

const mutate = vi.fn();
const decode = vi.fn();
const takeRestorePoint = vi.fn();
vi.mock("@/services/api-client", () => ({ getBuildrikClient: () => ({ theme: { extractBrandFromUrl: { mutate } } }) }));
vi.mock("@/services/BuildrikSyncProvider", () => ({ getSiteIdFromUrl: () => "s1" }));
vi.mock("@/editor/design-system/utils/decodeLogo", () => ({ decodeLogoColors: (f: File) => decode(f) }));
vi.mock("@/editor/design-system/state/useBrandRestorePoints", () => ({
  takeRestorePoint: (...a: unknown[]) => takeRestorePoint(...a),
}));

import { BrandFromSource } from "../BrandFromSource";

interface Preview { tokens: DesignToken[] }
function fakeComposer() {
  const calls: string[] = [];
  const c = {
    calls,
    getProjectSettings: () => ({ designTokens: DEFAULT_TOKENS, designTokensSchemaVersion: 6, darkMode: "off" }),
    on: vi.fn(),
    off: vi.fn(),
    designSystem: {
      preview: null as Preview | null,
      setPreview: vi.fn((p: Preview | null) => { calls.push(p ? "preview" : "clear"); c.designSystem.preview = p; }),
      setTokens: vi.fn((..._a: unknown[]) => { calls.push("setTokens"); return true; }),
    },
  };
  return c;
}

function mount(c = fakeComposer()) {
  const view = render(<ToastProvider><BrandFromSource composer={c as never} /></ToastProvider>);
  return { c, view };
}

const url = () => screen.getByLabelText("Website URL");
async function extract(value = "https://acme.test") {
  fireEvent.change(url(), { target: { value } });
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Extract brand" })); });
}

const URL_RESULT = {
  colors: [{ value: "#c2410c", count: 5 }, { value: "#0e7490", count: 3 }, { value: "#ffffff", count: 50 }],
  fonts: [
    { family: "Tiempos Headline", generic: "serif", heading: 2, body: 0, count: 2 },
    { family: "Inter", generic: "sans-serif", heading: 0, body: 1, count: 1 },
  ],
};

beforeEach(() => {
  mutate.mockReset();
  decode.mockReset();
  takeRestorePoint.mockReset();
});

describe("BrandFromSource (BRP1-M11)", () => {
  it("source: a logo drop zone and a website field", () => {
    mount();
    expect(screen.getByText("Start with your brand")).toBeTruthy();
    expect(screen.getByText("Drop your logo here")).toBeTruthy();
    expect(screen.getByText("PNG, JPG or SVG")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Choose file" })).toBeTruthy();
    expect(screen.getByText("Or use a website")).toBeTruthy();
    expect(url()).toBeTruthy();
  });

  it("loading: names the site, and Cancel goes back without applying the late answer", async () => {
    let resolve!: (v: unknown) => void;
    mutate.mockReturnValueOnce(new Promise((r) => { resolve = r; }));
    const { c } = mount();
    await extract();
    expect(mutate).toHaveBeenCalledWith({ siteId: "s1", url: "https://acme.test" });
    expect(screen.getByText("Finding your brand…")).toBeTruthy();
    expect(screen.getByText("Extracting colours and fonts from acme.test.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await act(async () => { resolve(URL_RESULT); });
    expect(screen.getByText("Drop your logo here")).toBeTruthy();
    expect(c.designSystem.preview).toBeNull();
  });

  it("preview: the canvas shows the proposal, fonts not in the catalogue are named as replaced", async () => {
    mutate.mockResolvedValueOnce(URL_RESULT);
    const { c } = mount();
    await extract();
    expect(screen.getByText("Preview extracted brand")).toBeTruthy();
    expect(screen.getByTestId("brand-source-chips").textContent).toContain("Primary · #C2410C");
    expect(screen.getByText("Headings: Playfair Display · Body: Inter")).toBeTruthy();
    expect(screen.getByText("Replaced Tiempos Headline with Playfair Display")).toBeTruthy();
    expect(screen.getByText("Tiempos Headline is unavailable. Playfair Display is the closest available family.")).toBeTruthy();
    const tokens = c.designSystem.preview!.tokens;
    expect(resolveTokenLiteral(tokens, "color-primary", "light")).toBe("#C2410C");
    expect(resolveTokenLiteral(tokens, "font-heading", "light")).toBe("Playfair Display");
  });

  it("no-colours: a monochrome logo asks for a colour, and that colour becomes Primary", async () => {
    decode.mockResolvedValueOnce([{ hex: "#000000", count: 90 }, { hex: "#FFFFFF", count: 300 }]);
    const { c } = mount();
    const input = screen.getByLabelText("Upload a logo");
    await act(async () => { fireEvent.change(input, { target: { files: [new File(["x"], "logo.png", { type: "image/png" })] } }); });
    expect(screen.getByText("We couldn't find brand colours in this logo")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Pick your brand colour"), { target: { value: "#0E7490" } });
    fireEvent.click(screen.getByRole("button", { name: "Use this colour" }));
    expect(resolveTokenLiteral(c.designSystem.preview!.tokens, "color-primary", "light")).toBe("#0E7490");
  });

  it("timeout: says so, and Try again asks again", async () => {
    mutate.mockRejectedValueOnce(new Error("TIMEOUT: That site took too long to answer"));
    mount();
    await extract();
    expect(screen.getByText("That site took too long to answer")).toBeTruthy();
    mutate.mockResolvedValueOnce(URL_RESULT);
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Try again" })); });
    expect(mutate).toHaveBeenCalledTimes(2);
    expect(screen.getByText("Preview extracted brand")).toBeTruthy();
  });

  it("address-refused: an internal or invalid address is refused with the board's copy", async () => {
    mutate.mockRejectedValueOnce(new Error("BLOCKED: This address can't be used"));
    mount();
    await extract("http://127.0.0.1");
    expect(screen.getByText("This address can't be used")).toBeTruthy();
    expect(screen.getByText("Enter a public website address starting with https:// or http://.")).toBeTruthy();
    expect((url() as HTMLInputElement).value).toBe("http://127.0.0.1");
  });

  it("confirmed: restore point → clear the preview → one token write; a double click applies once", async () => {
    mutate.mockResolvedValueOnce(URL_RESULT);
    let release!: (v: boolean) => void;
    takeRestorePoint.mockReturnValueOnce(new Promise<boolean>((r) => { release = r; }));
    const { c } = mount();
    await extract();
    c.calls.length = 0;
    const confirm = screen.getByRole("button", { name: "Confirm" });
    fireEvent.click(confirm);
    fireEvent.click(confirm);
    await act(async () => { release(true); });
    await waitFor(() => expect(screen.getByText("Your new brand is applied.")).toBeTruthy());
    expect(takeRestorePoint).toHaveBeenCalledTimes(1);
    expect(takeRestorePoint.mock.calls[0].slice(1)).toEqual(["s1", "logo"]);
    expect(c.calls).toEqual(["clear", "setTokens"]);
    expect(c.designSystem.setTokens.mock.calls[0][1]).toBe("Brand from logo");
  });

  it("no restore point → nothing changes (OQ-6)", async () => {
    mutate.mockResolvedValueOnce(URL_RESULT);
    takeRestorePoint.mockResolvedValueOnce(false);
    const { c } = mount();
    await extract();
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Confirm" })); });
    expect(screen.getByText("We couldn't save a restore point — nothing was changed.")).toBeTruthy();
    expect(c.designSystem.setTokens).not.toHaveBeenCalled();
  });

  it("Cancel and unmount put the saved brand back", async () => {
    mutate.mockResolvedValue(URL_RESULT);
    const { c, view } = mount();
    await extract();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(c.designSystem.preview).toBeNull();
    await extract();
    expect(c.designSystem.preview).not.toBeNull();
    view.unmount();
    expect(c.designSystem.preview).toBeNull();
  });
});
