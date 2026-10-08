// @vitest-environment jsdom
/**
 * useIssuesFeed — B-15 / A02-9 decision-free fix: route the pre-publish
 * check list into Issues alongside DS-lint and the content-issue scanner,
 * so Issues and Publish read the same facts instead of two disjoint sets.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";

const fetchPrePublishChecks = vi.fn();
vi.mock("@/services/PublishService", () => ({
  fetchPrePublishChecks: (siteId: string) => fetchPrePublishChecks(siteId),
}));

import { useIssuesFeed } from "../useIssuesFeed";
import type { Issue } from "../useStudioState";

function makeComposer(opts: {
  lintIssues?: Array<{ tokenId: string; issue: { type: string; severity: string; message: string; autoFixHint?: string } }>;
  pages?: Array<Record<string, unknown>>;
} = {}) {
  const handlers = new Map<string, Set<(...args: unknown[]) => void>>();
  const lintHandlers = new Map<string, Set<() => void>>();
  return {
    on: (ev: string, fn: (...args: unknown[]) => void) => {
      if (!handlers.has(ev)) handlers.set(ev, new Set());
      handlers.get(ev)!.add(fn);
    },
    off: (ev: string, fn: (...args: unknown[]) => void) => handlers.get(ev)?.delete(fn),
    emit: (ev: string) => handlers.get(ev)?.forEach((fn) => fn()),
    elements: { exportPages: () => opts.pages ?? [] },
    designSystem: {
      lintState: {
        getAllVisibleIssues: () => opts.lintIssues ?? [],
        on: (ev: string, fn: () => void) => {
          if (!lintHandlers.has(ev)) lintHandlers.set(ev, new Set());
          lintHandlers.get(ev)!.add(fn);
        },
        off: (ev: string, fn: () => void) => lintHandlers.get(ev)?.delete(fn),
      },
    },
  } as never;
}

function setIssuesHook() {
  let current: Issue[] = [];
  const setIssues = vi.fn((updater: Issue[] | ((prev: Issue[]) => Issue[])) => {
    current = typeof updater === "function" ? (updater as (prev: Issue[]) => Issue[])(current) : updater;
  });
  return { setIssues, get: () => current };
}

beforeEach(() => {
  fetchPrePublishChecks.mockReset().mockResolvedValue({ ready: true, checks: [] });
});

describe("useIssuesFeed", () => {
  it("merges lint issues and non-passing publish checks into one array", async () => {
    const composer = makeComposer({
      lintIssues: [
        { tokenId: "color.accent", issue: { type: "contrast", severity: "error", message: "Low contrast" } },
      ],
    });
    fetchPrePublishChecks.mockResolvedValue({
      ready: false,
      checks: [
        { label: "Domain connected", status: "fail", detail: "No custom domain" },
        { label: "Vercel connected", status: "pass", detail: "Connected" },
      ],
    });
    const issues = setIssuesHook();
    renderHook(() => useIssuesFeed(composer, "site-1", issues.setIssues));

    await waitFor(() => {
      expect(issues.get().some((i) => i.id === "publish-check:Domain connected")).toBe(true);
    });
    expect(issues.get().some((i) => i.tokenId === "color.accent")).toBe(true);
    // A passing check never becomes an Issues row.
    expect(issues.get().some((i) => i.id === "publish-check:Vercel connected")).toBe(false);
  });

  it("maps a failing check to error and a warning check to warning", async () => {
    fetchPrePublishChecks.mockResolvedValue({
      ready: false,
      checks: [
        { label: "Domain connected", status: "fail", detail: "No custom domain" },
        { label: "SEO configured", status: "warning", detail: "No title template" },
      ],
    });
    const issues = setIssuesHook();
    // `composer` MUST be hoisted outside the render callback — renderHook
    // re-invokes that callback on every render, so a `makeComposer()` call
    // inline there hands the hook a NEW object each time. `composer` feeds
    // useContentIssueScanner's effect deps (and this hook's own DS-lint
    // effect), so its identity changing every render re-fires "on mount"
    // effects every render → setState → re-render → new composer → repeat,
    // an infinite loop this test hit for real (root-caused via `it.only`
    // bisection: this exact shape of test OOM'd in isolation at ~1.5GB/210s
    // while the sibling test with a hoisted composer passed in ~10s). The
    // real editor never hits this: `useComposerInit` holds `composer` in
    // `React.useState`, stable across renders by React's own contract.
    const composer = makeComposer();
    renderHook(() => useIssuesFeed(composer, "site-1", issues.setIssues));

    await waitFor(() => expect(issues.get()).toHaveLength(2));
    expect(issues.get().find((i) => i.id === "publish-check:Domain connected")?.type).toBe("error");
    expect(issues.get().find((i) => i.id === "publish-check:SEO configured")?.type).toBe("warning");
  });

  it("without a siteId, contributes no publish-check rows", async () => {
    const issues = setIssuesHook();
    const composer = makeComposer(); // hoisted — see note above
    renderHook(() => useIssuesFeed(composer, null, issues.setIssues));
    expect(fetchPrePublishChecks).not.toHaveBeenCalled();
    expect(issues.get()).toHaveLength(0);
  });

  it("a failed check fetch leaves Issues silent on that source, not stuck loading", async () => {
    fetchPrePublishChecks.mockRejectedValue(new Error("network"));
    const issues = setIssuesHook();
    const composer = makeComposer(); // hoisted — see note above
    renderHook(() => useIssuesFeed(composer, "site-1", issues.setIssues));
    await waitFor(() => expect(fetchPrePublishChecks).toHaveBeenCalled());
    expect(issues.get()).toHaveLength(0);
  });

  it("rescan() re-fetches the checks (the panel's one Try again covers both sources)", async () => {
    const issues = setIssuesHook();
    const composer = makeComposer(); // hoisted — see note above
    const { result } = renderHook(() => useIssuesFeed(composer, "site-1", issues.setIssues));
    await waitFor(() => expect(fetchPrePublishChecks).toHaveBeenCalledTimes(1));
    act(() => result.current.rescan());
    await waitFor(() => expect(fetchPrePublishChecks).toHaveBeenCalledTimes(2));
  });

  it("reports the content scanner's scanState back to the caller", async () => {
    const composer = makeComposer({ pages: [{ id: "home", name: "Home", root: undefined }] });
    const issues = setIssuesHook();
    const { result } = renderHook(() => useIssuesFeed(composer, null, issues.setIssues));
    await waitFor(() => expect(result.current.scanState).toBe("idle"));
  });

  it("lists a content fact once: the scanner's per-element row, not the server's summary row too", async () => {
    const composer = makeComposer({
      pages: [
        {
          id: "home",
          name: "Home",
          root: { id: "img1", type: "image", tagName: "img", attributes: { src: "/a.png" } },
        },
      ],
    });
    fetchPrePublishChecks.mockResolvedValue({
      ready: true,
      checks: [
        { label: "Image alt text", status: "warning", detail: "1 image is missing alt text." },
        { label: "Domain connected", status: "warning", detail: "No custom domain" },
      ],
    });
    const issues = setIssuesHook();
    renderHook(() => useIssuesFeed(composer, "site-1", issues.setIssues));
    await waitFor(() => {
      expect(issues.get().some((i) => i.id === "publish-check:Domain connected")).toBe(true);
      expect(issues.get().some((i) => i.id === "content:alt:img1")).toBe(true);
    });
    expect(issues.get().some((i) => i.id === "publish-check:Image alt text")).toBe(false);
  });
});

/* IR-1: the check list was fetched once per mount, so a row the server had
   since cleared (Vercel connected, a page added, a publish settled) kept
   counting as an open error — "Publish anyway" over nothing. */
describe("useIssuesFeed — the publish-check rows stay current", () => {
  const vercelFail = { ready: false, checks: [{ label: "Vercel connected", status: "fail", detail: "Not connected" }] };
  const allPass = { ready: true, checks: [{ label: "Vercel connected", status: "pass", detail: "Connected" }] };
  const hasVercelRow = (issues: Issue[]) => issues.some((i) => i.id === "publish-check:Vercel connected");

  it("re-reads the checks after the project saves to the server", async () => {
    fetchPrePublishChecks.mockResolvedValueOnce(vercelFail).mockResolvedValue(allPass);
    const composer = makeComposer() as unknown as { emit: (ev: string) => void };
    const issues = setIssuesHook();
    renderHook(() => useIssuesFeed(composer as never, "site-1", issues.setIssues));
    await waitFor(() => expect(hasVercelRow(issues.get())).toBe(true));
    act(() => composer.emit("project:saved"));
    await waitFor(() => expect(hasVercelRow(issues.get())).toBe(false), { timeout: 3000 });
  });

  it("re-reads the checks when a publish settles", async () => {
    fetchPrePublishChecks.mockResolvedValueOnce(vercelFail).mockResolvedValue(allPass);
    const issues = setIssuesHook();
    const composer = makeComposer();
    const { rerender } = renderHook(
      ({ publishState }: { publishState?: string }) =>
        useIssuesFeed(composer, "site-1", issues.setIssues, { publishState }),
      { initialProps: { publishState: "publishing" } },
    );
    await waitFor(() => expect(hasVercelRow(issues.get())).toBe(true));
    rerender({ publishState: "published" });
    await waitFor(() => expect(hasVercelRow(issues.get())).toBe(false));
  });

  it("re-reads the checks when the Issues panel opens", async () => {
    fetchPrePublishChecks.mockResolvedValueOnce(vercelFail).mockResolvedValue(allPass);
    const issues = setIssuesHook();
    const composer = makeComposer();
    const { rerender } = renderHook(
      ({ panelOpen }: { panelOpen: boolean }) => useIssuesFeed(composer, "site-1", issues.setIssues, { panelOpen }),
      { initialProps: { panelOpen: false } },
    );
    await waitFor(() => expect(hasVercelRow(issues.get())).toBe(true));
    rerender({ panelOpen: true });
    await waitFor(() => expect(hasVercelRow(issues.get())).toBe(false));
  });
});
