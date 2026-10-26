/**
 * LoadErrorBanner (S1.5, Task 1.6) — the one primary signal that the site did
 * not load: the board's copy per cause, announced, with a Retry that re-runs
 * the load in place (1 s / 2 s / 4 s, at most three), then a page reload and
 * the dashboard, and "Copy details" that carries a code and a request id only.
 *
 * Rewritten for Task 1.6: the old suite pinned the "there is no trash" copy,
 * which the server contradicts (`sites.restore`, Recently deleted for 30 days).
 */
import * as React from "react";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/editor/chrome-ui";
import { LoadErrorBanner, loadErrorDetails } from "../LoadErrorBanner";
import { setSiteLoadStatus, type SiteLoadFailure } from "../siteLoadStatus";

const writeClipboardText = vi.hoisted(() => vi.fn(() => Promise.resolve()));
vi.mock("@buildrik/shared/browser/clipboard", () => ({ writeClipboardText }));

function renderBanner(props: Partial<React.ComponentProps<typeof LoadErrorBanner>> = {}) {
  return render(
    <ToastProvider>
      <LoadErrorBanner kind={null} onRetry={vi.fn()} onSignIn={vi.fn()} onDismiss={vi.fn()} {...props} />
    </ToastProvider>,
  );
}

const failure = (over: Partial<SiteLoadFailure> = {}): SiteLoadFailure => ({
  kind: "network",
  status: 500,
  code: "INTERNAL_SERVER_ERROR",
  requestId: "req-42",
  url: "https://app.example/api/trpc/sites.get",
  ...over,
});

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  setSiteLoadStatus(null);
  vi.useRealTimers();
  writeClipboardText.mockClear();
});

describe("LoadErrorBanner — cause and copy", () => {
  it("renders nothing when there is no error", () => {
    renderBanner();
    expect(screen.queryByTestId("load-error-banner")).toBeNull();
  });

  it("is announced: role=alert, named by the cause", () => {
    renderBanner({ kind: "network" });
    expect(screen.getByRole("alert", { name: "Load failed" })).toBeInTheDocument();
  });

  it.each([
    ["network", "Couldn’t load this site. You can look around; editing waits until it loads."],
    ["offline", "You’re offline. Your saved work is safe."],
    ["auth", "Session expired — changes aren’t saving. They’re kept in this tab."],
    [
      "missing",
      "This site was deleted. Your unsaved changes are kept in this browser. A site owner can restore it from Recently deleted for 30 days.",
    ],
    ["forbidden", "Your role changed to Viewer — editing is off. Changes that weren’t saved are kept in this browser."],
  ] as const)("%s says the board's words", (kind, copy) => {
    renderBanner({ kind });
    expect(screen.getByTestId("load-error-message").textContent).toContain(copy);
  });

  it("a deleted site offers the dashboard, not a Retry that cannot work, and no 'no trash' line", () => {
    renderBanner({ kind: "missing" });
    expect(screen.queryByRole("button", { name: /^retry$/i })).toBeNull();
    expect(screen.getByRole("button", { name: /go to dashboard/i })).toBeInTheDocument();
    expect(screen.queryByText(/no trash/i)).toBeNull();
  });

  it("no access offers Back to dashboard and no Retry, in the warning tone", () => {
    renderBanner({ kind: "forbidden" });
    expect(screen.getByTestId("load-error-banner")).toHaveAttribute("data-kind", "forbidden");
    expect(screen.queryByRole("button", { name: /^retry$/i })).toBeNull();
    expect(screen.getByRole("button", { name: /back to dashboard/i })).toBeInTheDocument();
  });

  it("session expired offers Sign in and Retry", () => {
    const onSignIn = vi.fn();
    renderBanner({ kind: "auth", onSignIn });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    expect(onSignIn).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /^retry$/i })).toBeInTheDocument();
  });

  it("the ✕ dismisses", () => {
    const onDismiss = vi.fn();
    renderBanner({ kind: "network", onDismiss });
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(onDismiss).toHaveBeenCalled();
  });
});

describe("LoadErrorBanner — Retry", () => {
  it("with no in-place retry published, Retry falls back to onRetry (a reload) once", () => {
    const onRetry = vi.fn();
    renderBanner({ kind: "network", onRetry });
    fireEvent.click(screen.getByRole("button", { name: /^retry$/i }));
    const busy = screen.getByRole("button", { name: /reconnecting/i });
    expect(busy).toHaveAttribute("aria-busy", "true");
    expect(busy).toBeDisabled();
    expect(busy).toHaveAttribute("title", expect.stringMatching(/reaching the server/i));
    fireEvent.click(busy);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("re-runs the load in place after the backoff, and ignores repeat clicks while busy", async () => {
    const retry = vi.fn(() => Promise.resolve(false));
    setSiteLoadStatus({ failure: failure(), retry });
    const onRetry = vi.fn();
    renderBanner({ kind: "network", onRetry });

    fireEvent.click(screen.getByRole("button", { name: /^retry$/i }));
    fireEvent.click(screen.getByRole("button", { name: /reconnecting/i }));
    await act(async () => {
      vi.advanceTimersByTime(999);
    });
    expect(retry).not.toHaveBeenCalled();
    await act(async () => {
      vi.advanceTimersByTime(1);
    });
    expect(retry).toHaveBeenCalledTimes(1);
    expect(onRetry).not.toHaveBeenCalled();
  });

  it("a second failure shows the attempt count and Reload page; after three, Retry gives way to Reload page and Back to dashboard", async () => {
    const retry = vi.fn(() => Promise.resolve(false));
    setSiteLoadStatus({ failure: failure(), retry });
    renderBanner({ kind: "network" });

    const press = async (wait: number) => {
      fireEvent.click(screen.getByRole("button", { name: /^retry$/i }));
      await act(async () => {
        vi.advanceTimersByTime(wait);
      });
    };

    expect(screen.queryByRole("button", { name: /reload page/i })).toBeNull();
    await press(1000);
    expect(screen.getByTestId("load-error-attempts").textContent).toBe("Retry 1 of 3 didn’t load.");
    expect(screen.getByRole("button", { name: /reload page/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^retry$/i })).toBeInTheDocument();

    await press(1999);
    expect(retry).toHaveBeenCalledTimes(1);
    await act(async () => {
      vi.advanceTimersByTime(1);
    });
    expect(retry).toHaveBeenCalledTimes(2);

    await press(4000);
    expect(retry).toHaveBeenCalledTimes(3);
    expect(screen.queryByRole("button", { name: /^retry$/i })).toBeNull();
    expect(screen.getByRole("button", { name: /reload page/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /back to dashboard/i })).toBeInTheDocument();
    expect(screen.getByTestId("load-error-attempts").textContent).toMatch(/Tried 3 times/);
  });

  it("a retry that lands dismisses the banner", async () => {
    setSiteLoadStatus({ failure: failure(), retry: () => Promise.resolve(true) });
    const onDismiss = vi.fn();
    renderBanner({ kind: "network", onDismiss });
    fireEvent.click(screen.getByRole("button", { name: /^retry$/i }));
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});

describe("LoadErrorBanner — Copy details", () => {
  it("copies the error code and the request id, and nothing else", async () => {
    setSiteLoadStatus({ failure: failure({ url: "https://app.example/api/trpc/sites.get?token=secret" }), retry: null });
    renderBanner({ kind: "network" });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /copy details/i }));
    });
    expect(writeClipboardText).toHaveBeenCalledWith("Error code: INTERNAL_SERVER_ERROR\nRequest id: req-42");
  });

  it("without a server code it names the status, and says when no request id was sent", () => {
    expect(loadErrorDetails("network", failure({ code: null, status: 502, requestId: null }))).toBe(
      "Error code: HTTP 502\nRequest id: none sent",
    );
    expect(loadErrorDetails("offline", null)).toBe("Error code: offline\nRequest id: none sent");
  });
});
