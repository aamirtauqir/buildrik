/**
 * Issues auto-fix — the drawn `Issues · fixing` (164:42) and
 * `Issues · fix-failed` (164:57) states.
 *
 * The panel had surfaced issues without ever offering the repair, and the
 * engine's `applyAutoFix` had no caller. These cover the branch that matters:
 * `applyAutoFix` returning null means "I declined to rewrite this token", and
 * the panel must say so rather than leaving the row looking untouched.
 */
import * as React from "react";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { TooltipProvider } from "@/editor/shared/vibcoder";
import { IssuesPanel } from "../IssuesPanel";
import type { Issue } from "../hooks/useStudioState";

const FIXABLE: Issue = {
  id: "color.accent:contrast",
  type: "error",
  message: "Contrast 3.1:1 (needs 4.5)",
  tokenId: "color.accent",
  autoFixHint: "darken-22",
  location: "Brand › color.accent",
};
const NOT_FIXABLE: Issue = {
  id: "link-1",
  type: "warning",
  message: "Link points nowhere",
};

function renderPanel(props: Partial<React.ComponentProps<typeof IssuesPanel>> = {}) {
  return render(
    <TooltipProvider>
      <IssuesPanel issues={[FIXABLE, NOT_FIXABLE]} onClose={vi.fn()} {...props} />
    </TooltipProvider>,
  );
}

afterEach(cleanup);

describe("Issues · Fix affordance", () => {
  it("offers Fix only on a token-backed issue that carries a hint", () => {
    renderPanel({ onFix: vi.fn() });
    // one Fix button, and it belongs to the contrast row — a broken link has
    // no token and no mechanical repair
    expect(screen.getAllByRole("button", { name: /Fix/ })).toHaveLength(1);
    expect(screen.getByText("Brand › color.accent")).toBeInTheDocument();
  });

  it("shows no Fix button when the host passes no handler", () => {
    renderPanel();
    expect(screen.queryByRole("button", { name: /Fix/ })).not.toBeInTheDocument();
  });
});

describe("Issues · fixing", () => {
  it("shows the in-flight band with the one-undo-step promise, then clears", async () => {
    let release: (v: string | null) => void = () => {};
    const onFix = vi.fn(() => new Promise<string | null>((r) => { release = r; }));
    renderPanel({ onFix });

    fireEvent.click(screen.getByRole("button", { name: /Fix/ }));
    expect(await screen.findByText("Auto-fix lands as ONE undo step.")).toBeInTheDocument();

    release("#2E56B8");
    await waitFor(() =>
      expect(screen.queryByText("Auto-fix lands as ONE undo step.")).not.toBeInTheDocument(),
    );
    // a successful fix is silent — no failure band
    expect(screen.queryByText(/Couldn't fix this automatically/)).not.toBeInTheDocument();
  });
});

describe("Issues · fix-failed", () => {
  it("surfaces the failure when the engine declines (null), with both exits", async () => {
    const onFix = vi.fn().mockResolvedValue(null);
    const onOpenBrand = vi.fn();
    const onIgnore = vi.fn();
    renderPanel({ onFix, onOpenBrand, onIgnore });

    fireEvent.click(screen.getByRole("button", { name: /Fix/ }));
    expect(await screen.findByText(/Couldn't fix this automatically/)).toBeInTheDocument();
    expect(screen.getByText(/comes from your brand tokens/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Open Brand" }));
    expect(onOpenBrand).toHaveBeenCalledTimes(1);
  });

  it("Ignore once suppresses that token and dismisses the band", async () => {
    const onIgnore = vi.fn();
    renderPanel({ onFix: vi.fn().mockResolvedValue(null), onIgnore });

    fireEvent.click(screen.getByRole("button", { name: /Fix/ }));
    expect(await screen.findByText(/Couldn't fix this automatically/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Ignore once" }));
    expect(onIgnore).toHaveBeenCalledWith("color.accent");
    await waitFor(() =>
      expect(screen.queryByText(/Couldn't fix this automatically/)).not.toBeInTheDocument(),
    );
  });

  it("treats a thrown fix as a failure, not a silent no-op", async () => {
    const onFix = vi.fn().mockRejectedValue(new Error("network"));
    renderPanel({ onFix });
    fireEvent.click(screen.getByRole("button", { name: /Fix/ }));
    expect(await screen.findByText(/Couldn't fix this automatically/)).toBeInTheDocument();
  });
});
