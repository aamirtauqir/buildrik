/**
 * AnalyticsScreen tests — Clone 3397:32295 Analytics: the five cards in the
 * frame's order with their label-left rows, the Connection status pill and
 * Last received data line off the tracker's `analyticsStatus` read
 * (3953:49515 / 3953:49670), the save-error banner (3951:26455), Verify and
 * the Connection verified dialog (4256:26844), the id normalisation, the
 * per-provider validation that holds Save (3397:34148), dirty wiring and the
 * flush-handler contract.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, waitFor, cleanup, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as React from "react";
import { createMockComposer } from "@/editor/sidebar/__tests__/test-utils/mockComposer";

const { api } = vi.hoisted(() => ({
  api: {
    siteDetail: {
      analyticsStatus: { query: vi.fn() },
    },
  },
}));

vi.mock("@/services/api-client", () => ({
  getBuildrikClient: () => api,
}));

import { AnalyticsScreen, connectionPill, formatDay, formatDayTime, lastReceivedLine } from "../AnalyticsScreen";

const statusMock = api.siteDetail.analyticsStatus.query;

/** Local wall-clock 19:38 on 2 Jul 2025 — the frame's shape, in the runner's zone. */
const LAST_EVENT = new Date(2025, 6, 2, 19, 38).toISOString();
const VERIFIED = new Date(2025, 6, 2, 9, 0).toISOString();

const receiving = () => ({ lastEventAt: LAST_EVENT, events24h: 1284 });
const silent = () => ({ lastEventAt: null, events24h: 0 });

const gaSettings = (over: Record<string, unknown> = {}) => ({
  analytics: {
    googleAnalytics: { enabled: true, measurementId: "G-4XQ2P7B1KD", verifiedAt: VERIFIED, ...over },
    googleTagManager: { enabled: false, containerId: "GTM-ABC1234" },
    facebookPixel: { enabled: true, pixelId: "1234567890123456" },
    microsoftClarity: { enabled: false, projectId: "abcdefghij" },
    cookieConsent: { enabled: false },
  },
});

beforeEach(() => {
  statusMock.mockReset().mockResolvedValue(receiving());
});

afterEach(() => cleanup());

function setup(opts: {
  projectId?: string | null;
  onDirtyChange?: (d: boolean) => void;
  registerSaveHandler?: (h: (() => Promise<void>) | null) => void;
  registerFlushHandler?: (h: (() => void) | null) => void;
  onLoadStateChange?: (s: "loading" | "ready" | "error") => void;
  saveError?: string | null;
  settings?: Record<string, unknown>;
} = {}) {
  const composer = createMockComposer({ projectSettings: opts.settings ?? {} });
  const utils = render(
    <AnalyticsScreen
      composer={composer}
      projectId={opts.projectId === undefined ? "s1" : opts.projectId}
      onDirtyChange={opts.onDirtyChange}
      registerSaveHandler={opts.registerSaveHandler}
      registerFlushHandler={opts.registerFlushHandler}
      onLoadStateChange={opts.onLoadStateChange}
      saveError={opts.saveError}
    />,
  );
  return { composer, ...utils };
}

const gaInput = () => screen.getByLabelText("Google Analytics ID") as HTMLInputElement;
const gtmInput = () => screen.getByLabelText("GTM Container ID") as HTMLInputElement;
const pixelInput = () => screen.getByLabelText("Pixel ID") as HTMLInputElement;
const clarityInput = () => screen.getByLabelText("Clarity Project ID") as HTMLInputElement;
const gaSwitch = () => screen.getByRole("switch", { name: "Enable Google Analytics" });
const pixelSwitch = () => screen.getByRole("switch", { name: "Enable Meta Pixel" });
const consentSwitch = () => screen.getByRole("switch", { name: "Cookie Consent" });

const loaded = () => waitFor(() => expect(screen.getByTestId("set-card-google-analytics")).toBeInTheDocument());

describe("AnalyticsScreen — the frame's cards and rows", () => {
  it("draws the five cards in 3397:32295's order, each with its label-left rows", async () => {
    setup();
    await loaded();
    const cards = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
    expect(cards).toEqual(["Google Analytics", "Google Tag Manager", "Meta Pixel", "Microsoft Clarity", "Consent"]);

    const ga = within(screen.getByTestId("set-card-google-analytics"));
    expect(ga.getByTestId("set-field-label-enable-google-analytics")).toHaveTextContent("Enable Google Analytics");
    expect(ga.getByTestId("set-field-label-google-analytics-id")).toHaveTextContent("Google Analytics ID");
    expect(ga.getByTestId("set-field-label-connection-status")).toHaveTextContent("Connection status");
    expect(ga.getByTestId("set-field-label-last-received-data")).toHaveTextContent("Last received data");
    expect(ga.getByTestId("set-an-ga-verify")).toHaveTextContent("Verify");

    expect(screen.getByTestId("set-field-label-gtm-container-id")).toHaveTextContent("GTM Container ID");
    expect(screen.getByTestId("set-field-label-pixel-id")).toHaveTextContent("Pixel ID");
    expect(screen.getByTestId("set-field-label-clarity-project-id")).toHaveTextContent("Clarity Project ID");
    expect(screen.getByTestId("set-field-label-cookie-consent")).toHaveTextContent("Cookie Consent");
  });

  it("gives every control the id Search lands on, and the brief's testids", async () => {
    setup();
    await loaded();
    expect(gaSwitch().id).toBe("enable-google-analytics");
    expect(gaInput().id).toBe("google-analytics-id");
    expect(screen.getByRole("switch", { name: "Enable Google Tag Manager" }).id).toBe("enable-google-tag-manager");
    expect(gtmInput().id).toBe("gtm-container-id");
    expect(pixelSwitch().id).toBe("enable-meta-pixel");
    expect(pixelInput().id).toBe("pixel-id");
    expect(screen.getByRole("switch", { name: "Enable Microsoft Clarity" }).id).toBe("enable-microsoft-clarity");
    expect(clarityInput().id).toBe("clarity-project-id");
    expect(consentSwitch().id).toBe("cookie-consent");

    expect(screen.getByTestId("set-an-ga-enable")).toBe(gaSwitch());
    expect(screen.getByTestId("set-an-ga-id")).toBe(gaInput());
    expect(screen.getByTestId("set-an-gtm-enable")).toBeInTheDocument();
    expect(screen.getByTestId("set-an-gtm-id")).toBe(gtmInput());
    expect(screen.getByTestId("set-an-pixel-enable")).toBe(pixelSwitch());
    expect(screen.getByTestId("set-an-pixel-id")).toBe(pixelInput());
    expect(screen.getByTestId("set-field-connection-status")).toBeInTheDocument();
    expect(screen.getByTestId("set-field-last-received-data")).toBeInTheDocument();
  });

  it("prefills the ids and switches from the composer's analytics settings", async () => {
    setup({ settings: gaSettings() });
    await loaded();
    expect(gaInput().value).toBe("G-4XQ2P7B1KD");
    expect(gtmInput().value).toBe("GTM-ABC1234");
    expect(pixelInput().value).toBe("1234567890123456");
    expect(clarityInput().value).toBe("abcdefghij");
    expect(gaSwitch()).toHaveAttribute("aria-checked", "true");
    expect(pixelSwitch()).toHaveAttribute("aria-checked", "true");
    expect(consentSwitch()).toHaveAttribute("aria-checked", "false");
  });

  it("defaults: empty ids, tracking off, cookie consent ON, the honesty note under it", async () => {
    setup();
    await loaded();
    expect(gaInput().value).toBe("");
    expect(pixelInput().value).toBe("");
    expect(gaSwitch()).toHaveAttribute("aria-checked", "false");
    expect(consentSwitch()).toHaveAttribute("aria-checked", "true");
    expect(screen.getByText(/Records the preference only/)).toHaveTextContent("they do not wait for consent");
  });
});

describe("AnalyticsScreen — Connection status and Last received data", () => {
  it("RECEIVING DATA (green) with the verified line and the frame's last-received shape", async () => {
    setup({ settings: gaSettings() });
    await loaded();
    expect(statusMock).toHaveBeenCalledWith({ siteId: "s1" });
    const pill = screen.getByTestId("set-an-ga-status");
    expect(pill).toHaveTextContent("RECEIVING DATA");
    expect(pill).toHaveClass("tw:bg-[var(--bk-success-tint)]");
    expect(screen.getByTestId("set-an-ga-verified")).toHaveTextContent("Measurement ID verified on 2 Jul 2025");
    expect(screen.getByTestId("set-an-ga-last")).toHaveTextContent("2 Jul 2025, 19:38 · 1,284 events in the last 24 hours");
  });

  it("NO DATA YET (grey) when the id is verified but nothing has arrived", async () => {
    statusMock.mockResolvedValue(silent());
    setup({ settings: gaSettings() });
    await loaded();
    const pill = screen.getByTestId("set-an-ga-status");
    expect(pill).toHaveTextContent("NO DATA YET");
    expect(pill).toHaveClass("tw:bg-[var(--bk-bg-subtle)]");
    expect(screen.getByTestId("set-an-ga-verified")).toBeInTheDocument();
    expect(screen.getByTestId("set-an-ga-last")).toHaveTextContent(/^No events yet$/);
  });

  it("NOT VERIFIED (grey), no verified line, when the id was never verified", async () => {
    statusMock.mockResolvedValue(silent());
    setup({ settings: gaSettings({ verifiedAt: undefined }) });
    await loaded();
    expect(screen.getByTestId("set-an-ga-status")).toHaveTextContent("NOT VERIFIED");
    expect(screen.queryByTestId("set-an-ga-verified")).toBeNull();
  });

  it("events in the last 24 hours mean RECEIVING DATA even before a Verify — they are the tracker's", async () => {
    setup({ settings: gaSettings({ verifiedAt: undefined }) });
    await loaded();
    expect(screen.getByTestId("set-an-ga-status")).toHaveTextContent("RECEIVING DATA");
    expect(screen.queryByTestId("set-an-ga-verified")).toBeNull();
  });

  it("editing the Measurement ID drops its verification — a different id is a different connection", async () => {
    statusMock.mockResolvedValue(silent());
    setup({ settings: gaSettings() });
    await loaded();
    expect(screen.getByTestId("set-an-ga-status")).toHaveTextContent("NO DATA YET");
    fireEvent.change(gaInput(), { target: { value: "G-4XQ2P7B1KE" } });
    expect(screen.getByTestId("set-an-ga-status")).toHaveTextContent("NOT VERIFIED");
    expect(screen.queryByTestId("set-an-ga-verified")).toBeNull();
  });

  it("without a projectId requests nothing and reports the honest empty state", () => {
    setup({ projectId: null, settings: gaSettings({ verifiedAt: undefined }) });
    expect(statusMock).not.toHaveBeenCalled();
    expect(screen.getByTestId("set-an-ga-status")).toHaveTextContent("NOT VERIFIED");
    expect(screen.getByTestId("set-an-ga-last")).toHaveTextContent(/^No events yet$/);
  });
});

describe("formatDay / formatDayTime / lastReceivedLine / connectionPill — pure", () => {
  it("draws the frame's d MMM yyyy and HH:mm shapes", () => {
    expect(formatDay(new Date(2025, 6, 2, 9, 5))).toBe("2 Jul 2025");
    expect(formatDay(new Date(2026, 8, 14, 0, 0))).toBe("14 Sep 2026");
    expect(formatDayTime(new Date(2025, 6, 2, 19, 38))).toBe("2 Jul 2025, 19:38");
    expect(formatDayTime(new Date(2025, 0, 9, 0, 7))).toBe("9 Jan 2025, 00:07");
  });

  it("builds the Last received data line, or No events yet", () => {
    expect(lastReceivedLine({ lastEventAt: new Date(2025, 6, 2, 19, 38).toISOString(), events24h: 1284 })).toBe(
      "2 Jul 2025, 19:38 · 1,284 events in the last 24 hours",
    );
    expect(lastReceivedLine({ lastEventAt: new Date(2025, 6, 2, 19, 38).toISOString(), events24h: 1 })).toBe(
      "2 Jul 2025, 19:38 · 1 event in the last 24 hours",
    );
    expect(lastReceivedLine({ lastEventAt: null, events24h: 0 })).toBe("No events yet");
    expect(lastReceivedLine(null)).toBe("No events yet");
  });

  it("picks the pill from the count first, then the verification", () => {
    expect(connectionPill({ lastEventAt: LAST_EVENT, events24h: 3 }, undefined)).toBe("RECEIVING DATA");
    expect(connectionPill({ lastEventAt: LAST_EVENT, events24h: 3 }, VERIFIED)).toBe("RECEIVING DATA");
    expect(connectionPill({ lastEventAt: null, events24h: 0 }, VERIFIED)).toBe("NO DATA YET");
    expect(connectionPill({ lastEventAt: null, events24h: 0 }, undefined)).toBe("NOT VERIFIED");
    expect(connectionPill(null, VERIFIED)).toBe("NO DATA YET");
    expect(connectionPill(null, undefined)).toBe("NOT VERIFIED");
  });
});

describe("AnalyticsScreen — Verify and Connection verified (4256:26844)", () => {
  const verify = () => screen.getByTestId("set-an-ga-verify");

  it("re-reads the status, stamps verifiedAt into the draft (dirty, not saved) and opens the dialog", async () => {
    statusMock.mockResolvedValueOnce(silent());
    const onDirtyChange = vi.fn();
    const { composer } = setup({ onDirtyChange, settings: gaSettings({ verifiedAt: undefined }) });
    await loaded();
    expect(screen.getByTestId("set-an-ga-status")).toHaveTextContent("NOT VERIFIED");
    expect(onDirtyChange).toHaveBeenLastCalledWith(false);

    statusMock.mockResolvedValueOnce(receiving());
    fireEvent.click(verify());
    await waitFor(() => expect(screen.getByTestId("set-an-verified")).toBeInTheDocument());
    expect(statusMock).toHaveBeenCalledTimes(2);
    expect(screen.getByTestId("set-an-verified-line")).toHaveTextContent(
      "G-4XQ2P7B1KD is receiving data. 1,284 events arrived in the last 24 hours.",
    );
    expect(document.activeElement).toBe(screen.getByTestId("set-an-verified-back"));

    // Behind the dialog the rows already show the re-read and the stamp.
    expect(screen.getByTestId("set-an-ga-status")).toHaveTextContent("RECEIVING DATA");
    expect(screen.getByTestId("set-an-ga-verified")).toHaveTextContent(`Measurement ID verified on ${formatDay(new Date())}`);
    expect(screen.getByTestId("set-an-ga-last")).toHaveTextContent("1,284 events in the last 24 hours");
    expect(onDirtyChange).toHaveBeenLastCalledWith(true);
    expect(composer.setProjectSettings).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId("set-an-verified-back"));
    expect(screen.queryByTestId("set-an-verified")).toBeNull();
  });

  it("the stamp is flushed on the next Save", async () => {
    let flush: (() => void) | null = null;
    const { composer } = setup({
      registerFlushHandler: (h) => { flush = h; },
      settings: gaSettings({ verifiedAt: undefined }),
    });
    await loaded();
    fireEvent.click(verify());
    await waitFor(() => expect(screen.getByTestId("set-an-verified")).toBeInTheDocument());
    act(() => flush!());
    const settings = composer.getProjectSettings() as { analytics: { googleAnalytics: { verifiedAt?: string } } };
    expect(settings.analytics.googleAnalytics.verifiedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("says verified with nothing arrived when the re-read counts zero", async () => {
    statusMock.mockResolvedValue(silent());
    setup({ settings: gaSettings({ verifiedAt: undefined }) });
    await loaded();
    fireEvent.click(verify());
    await waitFor(() => expect(screen.getByTestId("set-an-verified")).toBeInTheDocument());
    expect(screen.getByTestId("set-an-verified-line")).toHaveTextContent(/^G-4XQ2P7B1KD is verified\. No events have arrived yet\.$/);
    expect(screen.getByTestId("set-an-ga-status")).toHaveTextContent("NO DATA YET");
  });

  it("a malformed or empty id lands the cursor on the field and opens nothing", async () => {
    setup();
    await loaded();
    fireEvent.click(verify());
    expect(document.activeElement).toBe(gaInput());
    expect(statusMock).toHaveBeenCalledTimes(1);
    fireEvent.change(gaInput(), { target: { value: "G-ABC" } });
    fireEvent.click(verify());
    expect(screen.getByTestId("set-an-ga-error")).toBeInTheDocument();
    expect(screen.queryByTestId("set-an-verified")).toBeNull();
    expect(screen.queryByTestId("set-an-ga-verified")).toBeNull();
  });

  it("a failed re-read is the load-error card, not a dialog", async () => {
    setup({ settings: gaSettings({ verifiedAt: undefined }) });
    await loaded();
    statusMock.mockRejectedValue(new Error("network"));
    fireEvent.click(verify());
    await waitFor(() => expect(screen.getByTestId("set-load-retry")).toBeInTheDocument());
    expect(screen.queryByTestId("set-an-verified")).toBeNull();
    statusMock.mockResolvedValue(silent());
    fireEvent.click(screen.getByTestId("set-load-retry"));
    await loaded();
    // The draft survived the detour; nothing was stamped.
    expect(gaInput().value).toBe("G-4XQ2P7B1KD");
    expect(screen.getByTestId("set-an-ga-status")).toHaveTextContent("NOT VERIFIED");
  });

  it("without a projectId verifies the shape alone and reports no events", async () => {
    setup({ projectId: null, settings: gaSettings({ verifiedAt: undefined }) });
    fireEvent.click(verify());
    await waitFor(() => expect(screen.getByTestId("set-an-verified")).toBeInTheDocument());
    expect(statusMock).not.toHaveBeenCalled();
    expect(screen.getByTestId("set-an-verified-line")).toHaveTextContent("is verified. No events have arrived yet.");
  });
});

describe("AnalyticsScreen — loading, load-error and save-error", () => {
  it("shows the ANALYTICS load card while the status is on its way", async () => {
    let resolve!: (row: unknown) => void;
    statusMock.mockReturnValue(new Promise((r) => { resolve = r; }));
    const onLoadStateChange = vi.fn();
    setup({ onLoadStateChange });
    expect(screen.getByTestId("set-load-title")).toHaveTextContent("Analytics");
    expect(screen.getByTestId("set-load-line")).toHaveTextContent("GA4, GTM, Meta Pixel and Clarity keys.");
    expect(screen.getByTestId("set-load-state")).toHaveTextContent("Loading…");
    expect(onLoadStateChange).toHaveBeenLastCalledWith("loading");
    expect(screen.queryByTestId("set-card-google-analytics")).toBeNull();
    await act(async () => { resolve(receiving()); });
    await loaded();
    expect(onLoadStateChange).toHaveBeenLastCalledWith("ready");
  });

  it("shows the error line + Try again when the read fails, and Try again re-reads", async () => {
    statusMock.mockRejectedValueOnce(new Error("network"));
    const onLoadStateChange = vi.fn();
    setup({ onLoadStateChange });
    await waitFor(() => expect(screen.getByTestId("set-load-retry")).toBeInTheDocument());
    expect(screen.getByTestId("set-load-state")).toHaveTextContent(
      "Couldn't load your analytics settings. Check your connection, then try again.",
    );
    expect(onLoadStateChange).toHaveBeenLastCalledWith("error");
    fireEvent.click(screen.getByTestId("set-load-retry"));
    await loaded();
    expect(statusMock).toHaveBeenCalledTimes(2);
  });

  it("renders the shell's saveError above the cards", async () => {
    setup({
      settings: gaSettings(),
      saveError: "Analytics settings were not saved. Your changes are still here. Review the values, then retry.",
    });
    await loaded();
    expect(screen.getByTestId("set-save-error")).toHaveTextContent(/Analytics settings were not saved/);
    expect(gaInput().value).toBe("G-4XQ2P7B1KD");
  });
});

describe("AnalyticsScreen — id normalisation", () => {
  it("uppercases the Measurement ID and the GTM id as typed", async () => {
    setup();
    await loaded();
    fireEvent.change(gaInput(), { target: { value: "g-abcd123456" } });
    expect(gaInput().value).toBe("G-ABCD123456");
    fireEvent.change(gtmInput(), { target: { value: " gtm-abc1234 " } });
    expect(gtmInput().value).toBe("GTM-ABC1234");
  });

  it("strips non-digit characters from the Pixel ID as the user types", async () => {
    setup();
    await loaded();
    fireEvent.change(pixelInput(), { target: { value: "12ab34-cd56" } });
    expect(pixelInput().value).toBe("123456");
  });

});

describe("AnalyticsScreen — validation (3397:34148)", () => {
  const GA_SENTENCE =
    "This doesn't look right. Your Google Analytics ID should start with G- followed by 10 characters, like G-ABCD123456.";

  it("a malformed Measurement ID flags the field and says the frame's sentence under it; an empty one is not an error", async () => {
    setup();
    await loaded();
    fireEvent.change(gaInput(), { target: { value: "G-ABC" } });
    expect(gaInput()).toHaveAttribute("aria-invalid", "true");
    expect(gaInput()).toHaveAttribute("aria-describedby", "ga-error");
    expect(screen.getByTestId("set-an-ga-error")).toHaveTextContent(GA_SENTENCE);
    expect(screen.getByTestId("set-an-ga-error").id).toBe("ga-error");
    fireEvent.change(gaInput(), { target: { value: "" } });
    expect(screen.queryByRole("alert")).toBeNull();
    expect(gaInput()).toHaveAttribute("aria-invalid", "false");
    fireEvent.change(gaInput(), { target: { value: "G-ABCD123456" } });
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("each other provider gets its own sentence, under its own field", async () => {
    setup();
    await loaded();
    fireEvent.change(gtmInput(), { target: { value: "GTM-AB" } });
    expect(gtmInput()).toHaveAttribute("aria-invalid", "true");
    expect(gtmInput()).toHaveAttribute("aria-describedby", "gtm-error");
    expect(screen.getByTestId("set-an-gtm-error")).toHaveTextContent(
      "Your GTM Container ID should start with GTM- followed by 6 to 8 characters, like GTM-ABC1234.",
    );
    fireEvent.change(pixelInput(), { target: { value: "12345678" } });
    expect(pixelInput()).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByTestId("set-an-pixel-error")).toHaveTextContent("Your Pixel ID should be 15 or 16 digits, like 1234567890123456.");
    fireEvent.change(clarityInput(), { target: { value: "abc" } });
    expect(clarityInput()).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByTestId("set-an-clarity-error")).toHaveTextContent(
      "Your Clarity Project ID should be 10 letters or digits, like abcdefghij.",
    );
    expect(screen.getAllByRole("alert")).toHaveLength(3);
  });

  it("while an id is malformed the screen stays dirty and registers a save that rejects with the sentence; a fixed id clears it", async () => {
    const onDirtyChange = vi.fn();
    const registerSaveHandler = vi.fn();
    setup({ onDirtyChange, registerSaveHandler });
    await loaded();
    expect(registerSaveHandler).not.toHaveBeenCalled();

    fireEvent.change(gaInput(), { target: { value: "G-ABC" } });
    await waitFor(() => expect(onDirtyChange).toHaveBeenLastCalledWith(true));
    expect(registerSaveHandler).toHaveBeenLastCalledWith(expect.any(Function));
    const refuse = registerSaveHandler.mock.calls.at(-1)![0] as () => Promise<void>;
    await expect(refuse()).rejects.toThrow(GA_SENTENCE);

    fireEvent.change(gaInput(), { target: { value: "G-ABCD123456" } });
    expect(registerSaveHandler).toHaveBeenLastCalledWith(null);
    await waitFor(() => expect(onDirtyChange).toHaveBeenLastCalledWith(true));
  });

  it("the flush throws the sentence too and writes nothing while an id is malformed", async () => {
    let flush: (() => void) | null = null;
    const { composer } = setup({ registerFlushHandler: (h) => { flush = h; } });
    await loaded();
    fireEvent.change(pixelInput(), { target: { value: "12345678" } });
    expect(() => flush!()).toThrow("Your Pixel ID should be 15 or 16 digits");
    expect(composer.setProjectSettings).not.toHaveBeenCalled();
    fireEvent.change(pixelInput(), { target: { value: "123456789012345" } });
    act(() => flush!());
    expect(composer.setProjectSettings).toHaveBeenCalledTimes(1);
  });
});

describe("AnalyticsScreen — dirty wiring + flush handler", () => {
  it("starts clean; a switch or a field marks the screen dirty, never the composer", async () => {
    const onDirtyChange = vi.fn();
    const { composer } = setup({ onDirtyChange });
    await loaded();
    expect(onDirtyChange).toHaveBeenLastCalledWith(false);
    fireEvent.click(consentSwitch());
    await waitFor(() => expect(onDirtyChange).toHaveBeenLastCalledWith(true));
    fireEvent.change(gaInput(), { target: { value: "G-ABCD123456" } });
    expect(composer.setProjectSettings).not.toHaveBeenCalled();
  });

  it("registers a flush handler and clears it on unmount", async () => {
    const registerFlushHandler = vi.fn();
    const { unmount } = setup({ registerFlushHandler });
    await loaded();
    expect(registerFlushHandler).toHaveBeenCalledWith(expect.any(Function));
    unmount();
    expect(registerFlushHandler).toHaveBeenLastCalledWith(null);
  });

  it("flush writes the config once; enabled is ANDed with a non-empty id; verifiedAt rides along", async () => {
    let flush: (() => void) | null = null;
    const registerFlushHandler = vi.fn((h: (() => void) | null) => {
      flush = h;
    });
    const { composer } = setup({
      registerFlushHandler,
      settings: {
        analytics: {
          googleAnalytics: { enabled: true, measurementId: "G-4XQ2P7B1KD", verifiedAt: VERIFIED },
          googleTagManager: { enabled: true, containerId: "GTM-ABC1234", verifiedAt: VERIFIED },
        },
      },
    });
    await loaded();

    // Enable pixel WITHOUT an id — flushed `enabled` must resolve false.
    fireEvent.click(pixelSwitch());
    fireEvent.click(consentSwitch());

    expect(flush).toBeTypeOf("function");
    act(() => flush!());

    expect(composer.setProjectSettings).toHaveBeenCalledTimes(1);
    const settings = composer.getProjectSettings() as {
      analytics: {
        googleAnalytics: { enabled: boolean; measurementId: string; verifiedAt?: string };
        googleTagManager: { enabled: boolean; containerId: string; verifiedAt?: string };
        facebookPixel: { enabled: boolean; pixelId: string };
        cookieConsent: { enabled: boolean };
      };
    };
    expect(settings.analytics.googleAnalytics).toEqual({ enabled: true, measurementId: "G-4XQ2P7B1KD", verifiedAt: VERIFIED });
    expect(settings.analytics.googleTagManager).toEqual({ enabled: true, containerId: "GTM-ABC1234", verifiedAt: VERIFIED });
    expect(settings.analytics.facebookPixel).toEqual({ enabled: false, pixelId: "" });
    expect(settings.analytics.cookieConsent).toEqual({ enabled: false });
  });

  it("an edited Measurement ID is flushed without a verifiedAt", async () => {
    let flush: (() => void) | null = null;
    const { composer } = setup({
      registerFlushHandler: (h) => { flush = h; },
      settings: gaSettings(),
    });
    await loaded();
    fireEvent.change(gaInput(), { target: { value: "G-ABCD123456" } });
    act(() => flush!());
    const settings = composer.getProjectSettings() as { analytics: { googleAnalytics: Record<string, unknown> } };
    expect(settings.analytics.googleAnalytics).toEqual({ enabled: true, measurementId: "G-ABCD123456" });
  });

  it("resyncs when composer settings change externally (SETTINGS_CHANGE)", async () => {
    const { composer } = setup({ settings: gaSettings() });
    await loaded();
    act(() => {
      composer.setProjectSettings({ analytics: { googleAnalytics: { enabled: false, measurementId: "G-EXTERNAL00" } } });
    });
    await waitFor(() => expect(gaInput().value).toBe("G-EXTERNAL00"));
    expect(gaSwitch()).toHaveAttribute("aria-checked", "false");
  });
});
