/**
 * DomainsScreen tests — Clone 3397:32206 Domains: the two strips, a Custom
 * domain + DNS records card pair per domain (primary first), the actions
 * that land on the server as they are confirmed (Force HTTPS → update, Check
 * DNS → check, Remove → 3397:34402 → remove), the header's Add domain →
 * 3737:43669 → connect → re-list, the empty card (3397:33034), the load states (3397:32985 / 3397:33085) and the banner a refused action
 * leaves (3397:33134). Never dirty.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, waitFor, cleanup, within } from "@testing-library/react";
import * as React from "react";
import { createMockComposer } from "@/editor/sidebar/__tests__/test-utils/mockComposer";

const { api } = vi.hoisted(() => ({
  api: {
    siteDetail: {
      domains: {
        list: { query: vi.fn() },
        checkAvailability: { query: vi.fn() },
        connect: { mutate: vi.fn() },
        update: { mutate: vi.fn() },
        check: { mutate: vi.fn() },
        remove: { mutate: vi.fn() },
      },
    },
  },
}));

vi.mock("@/services/api-client", () => ({
  getBuildrikClient: () => api,
}));

import { DomainsScreen, DOMAINS_SAVE_ERROR } from "../DomainsScreen";
import type { DomainRow } from "../domainsContract";

const d = api.siteDetail.domains;

const bella = (over: Partial<DomainRow> = {}): DomainRow => ({
  id: "dom1",
  domain: "bellacucina.com",
  status: "VERIFIED",
  isPrimary: true,
  kind: "PRIMARY",
  forceHttps: true,
  dnsProvider: "namecheap",
  dnsRecords: [
    { type: "A", host: "@", value: "76.76.21.21", verified: true },
    { type: "CNAME", host: "www", value: "cname.vercel-dns.com", verified: true },
    { type: "TXT", host: "_buildrick", value: "brk-verify-8f21c0", verified: false },
  ],
  ...over,
});

const shop = (): DomainRow => ({
  id: "dom2",
  domain: "shop.bellacucina.com",
  status: "PENDING",
  isPrimary: false,
  kind: "SUBDOMAIN",
  forceHttps: false,
  dnsProvider: null,
  dnsRecords: [{ type: "CNAME", host: "shop", value: "cname.vercel-dns.com", verified: false }],
});

beforeEach(() => {
  d.list.query.mockReset().mockResolvedValue([bella()]);
  d.checkAvailability.query.mockReset().mockResolvedValue({ available: true });
  d.connect.mutate.mockReset().mockResolvedValue(bella({ id: "dom9", domain: "new.example", status: "PENDING" }));
  d.update.mutate.mockReset().mockImplementation(async (input: { id: string; forceHttps: boolean }) =>
    bella({ forceHttps: input.forceHttps }),
  );
  d.check.mutate.mockReset().mockResolvedValue(bella());
  d.remove.mutate.mockReset().mockResolvedValue({ ok: true });
});

afterEach(() => cleanup());

function setup(
  opts: {
    projectId?: string | null;
    onDirtyChange?: (d: boolean) => void;
    onLoadStateChange?: (s: "loading" | "ready" | "error") => void;
    registerHeaderAction?: (node: React.ReactNode | null) => void;
    saveError?: string | null;
  } = {},
) {
  const composer = createMockComposer({ projectMetadata: { domain: null, name: "Bella Cucina" } });
  const utils = render(
    <DomainsScreen
      composer={composer}
      projectId={opts.projectId === undefined ? "s1" : opts.projectId}
      onDirtyChange={opts.onDirtyChange}
      onLoadStateChange={opts.onLoadStateChange}
      registerHeaderAction={opts.registerHeaderAction}
      saveError={opts.saveError}
    />,
  );
  return { composer, ...utils };
}

const loaded = () => waitFor(() => expect(screen.getByTestId("set-dom-strip")).toBeInTheDocument());
const httpsToggle = (id = "dom1") => screen.getByTestId(`set-dom-https-${id}`);

/** The node the screen hands the shell's header slot, mounted where a test can click it. */
function mountHeader(register: ReturnType<typeof vi.fn>) {
  const node: React.ReactNode = register.mock.calls.at(-1)?.[0];
  return render(<div data-testid="header-slot">{node}</div>);
}

describe("DomainsScreen — 3397:32206, the strips and one card pair per domain", () => {
  it("draws the info strip, the amber restore strip, the Custom domain card and the DNS records card", async () => {
    setup();
    await loaded();
    expect(screen.getByTestId("set-dom-strip")).toHaveTextContent(
      "Domain actions apply as soon as you confirm them. There is nothing to save on this screen.",
    );
    expect(screen.getByTestId("set-dom-restore")).toHaveTextContent(
      "Restoring a site version leaves this configuration unchanged.",
    );
    expect(screen.getByTestId("set-dom-restore")).toHaveClass("tw:bg-[var(--bk-warning-tint)]");

    const card = screen.getByTestId("set-dom-card-dom1");
    expect(within(card).getByTestId("set-card-custom-domain")).toHaveTextContent("Custom domain");
    expect(within(card).getByLabelText("Domain")).toHaveValue("bellacucina.com");
    expect(within(card).getByLabelText("Domain")).toHaveAttribute("readonly");
    expect(within(card).getByLabelText("Domain").id).toBe("dom-domain");
    expect(screen.getByTestId("set-dom-status-dom1")).toHaveTextContent("VERIFIED");
    expect(screen.getByTestId("set-dom-status-dom1")).toHaveClass("tw:bg-[var(--bk-success-tint)]");
    expect(httpsToggle()).toHaveAttribute("aria-checked", "true");
    expect(httpsToggle().id).toBe("dom-force-https");
    expect(screen.getByRole("switch", { name: "Force HTTPS" })).toBe(httpsToggle());
    expect(screen.getByTestId("set-dom-remove-dom1")).toHaveTextContent("Remove bellacucina.com…");

    const dns = screen.getByTestId("set-dom-dns-dom1");
    expect(within(dns).getByTestId("set-card-dns-records")).toHaveTextContent("DNS records");
    expect(within(dns).getByRole("table").id).toBe("dom-dns-records");
    expect(within(dns).getAllByRole("columnheader").map((h) => h.textContent)).toEqual(["Type", "Name", "Value", "Status"]);
    const row0 = screen.getByTestId("set-dom-dns-row-dom1-0");
    expect(row0).toHaveTextContent("A");
    expect(row0).toHaveTextContent("@");
    expect(row0).toHaveTextContent("76.76.21.21");
    /* flowbite's Badge wraps its text in a span; the pill is the element carrying the tone. */
    expect(within(row0).getByText("VERIFIED").closest("[data-status]")).toHaveClass("tw:bg-[var(--bk-success-tint)]");
    const row2 = screen.getByTestId("set-dom-dns-row-dom1-2");
    expect(row2).toHaveTextContent("_buildrick");
    expect(within(row2).getByText("PENDING").closest("[data-status]")).toHaveClass("tw:bg-[var(--bk-warning-tint)]");
    expect(screen.getByTestId("set-dom-check-dom1")).toHaveTextContent("Check DNS");
    expect(d.list.query).toHaveBeenCalledWith({ siteId: "s1" });
  });

  it("lists several domains primary first, one card pair each, and only the first carries the bare search ids", async () => {
    d.list.query.mockResolvedValue([shop(), bella()]);
    setup();
    await loaded();
    const cards = screen.getAllByTestId(/^set-dom-card-/);
    expect(cards.map((c) => c.getAttribute("data-testid"))).toEqual(["set-dom-card-dom1", "set-dom-card-dom2"]);
    expect(screen.getByTestId("set-card-custom-domain")).toBeInTheDocument();
    expect(screen.getByTestId("set-card-custom-domain-1")).toBeInTheDocument();
    expect(screen.getByTestId("set-card-dns-records-1")).toBeInTheDocument();
    expect(screen.getByTestId("set-dom-status-dom2")).toHaveTextContent("PENDING");
    expect(httpsToggle("dom2")).toHaveAttribute("aria-checked", "false");
    expect(httpsToggle("dom2").id).toBe("dom-force-https-1");
    expect(screen.getByTestId("set-dom-dns-row-dom2-0")).toHaveTextContent("shop");
  });

  it("is never dirty — reports onDirtyChange(false) and nothing else", async () => {
    const onDirtyChange = vi.fn();
    setup({ onDirtyChange });
    await loaded();
    fireEvent.click(httpsToggle());
    await waitFor(() => expect(d.update.mutate).toHaveBeenCalled());
    expect(onDirtyChange).toHaveBeenCalledWith(false);
    expect(onDirtyChange).not.toHaveBeenCalledWith(true);
  });

  it("registers the header's Add domain once the rows are on screen, and clears it on unmount", async () => {
    const registerHeaderAction = vi.fn();
    const { unmount } = setup({ registerHeaderAction });
    await loaded();
    await waitFor(() => expect(registerHeaderAction.mock.calls.at(-1)?.[0]).not.toBeNull());
    mountHeader(registerHeaderAction);
    expect(screen.getByTestId("set-dom-add")).toHaveTextContent("Add domain");
    unmount();
    expect(registerHeaderAction).toHaveBeenLastCalledWith(null);
  });
});

describe("DomainsScreen — actions land as they are confirmed", () => {
  it("Force HTTPS writes domains.update at once and shows the row the server returns", async () => {
    setup();
    await loaded();
    fireEvent.click(httpsToggle());
    await waitFor(() => expect(d.update.mutate).toHaveBeenCalledWith({ id: "dom1", forceHttps: false }));
    await waitFor(() => expect(httpsToggle()).toHaveAttribute("aria-checked", "false"));
    expect(screen.queryByTestId("set-save-error")).toBeNull();
  });

  it("a refused toggle shows the banner and leaves the switch as the server has it", async () => {
    d.update.mutate.mockRejectedValue(new Error("FORBIDDEN"));
    setup();
    await loaded();
    fireEvent.click(httpsToggle());
    await waitFor(() => expect(screen.getByTestId("set-save-error")).toHaveTextContent(DOMAINS_SAVE_ERROR));
    expect(httpsToggle()).toHaveAttribute("aria-checked", "true");
    expect(httpsToggle()).not.toBeDisabled();
  });

  it("Check DNS runs domains.check, then re-lists — the pills are the resolver's answer", async () => {
    d.check.mutate.mockImplementation(async () => {
      d.list.query.mockResolvedValue([bella({ dnsRecords: bella().dnsRecords.map((r) => ({ ...r, verified: true })) })]);
      return bella();
    });
    setup();
    await loaded();
    fireEvent.click(screen.getByTestId("set-dom-check-dom1"));
    expect(screen.getByTestId("set-dom-check-dom1")).toHaveTextContent("Checking…");
    expect(screen.getByTestId("set-dom-check-dom1")).toBeDisabled();
    await waitFor(() => expect(d.check.mutate).toHaveBeenCalledWith({ id: "dom1", siteId: "s1" }));
    await waitFor(() =>
      expect(within(screen.getByTestId("set-dom-dns-row-dom1-2")).getByText("VERIFIED")).toBeInTheDocument(),
    );
    expect(d.list.query).toHaveBeenCalledTimes(2);
    expect(screen.getByTestId("set-dom-check-dom1")).toHaveTextContent("Check DNS");
  });

  it("a check that fails shows the banner and keeps the previous pills", async () => {
    d.check.mutate.mockRejectedValue(new Error("network"));
    setup();
    await loaded();
    fireEvent.click(screen.getByTestId("set-dom-check-dom1"));
    await waitFor(() => expect(screen.getByTestId("set-save-error")).toBeInTheDocument());
    expect(within(screen.getByTestId("set-dom-dns-row-dom1-2")).getByText("PENDING")).toBeInTheDocument();
    expect(d.list.query).toHaveBeenCalledTimes(1);
  });

  it("the next action that succeeds takes the banner down", async () => {
    d.update.mutate.mockRejectedValueOnce(new Error("FORBIDDEN"));
    setup();
    await loaded();
    fireEvent.click(httpsToggle());
    await waitFor(() => expect(screen.getByTestId("set-save-error")).toBeInTheDocument());
    fireEvent.click(httpsToggle());
    await waitFor(() => expect(httpsToggle()).toHaveAttribute("aria-checked", "false"));
    expect(screen.queryByTestId("set-save-error")).toBeNull();
  });

  it("renders the shell's saveError above the strips too", async () => {
    setup({ saveError: "Domain changes were not saved. Your changes are still here. Review the values, then retry." });
    await loaded();
    expect(screen.getByTestId("set-save-error")).toHaveTextContent(/Domain changes were not saved/);
  });
});

describe("DomainsScreen — Remove → 3397:34402", () => {
  it("Remove opens the confirm with the domain in its title and body; Cancel removes nothing", async () => {
    setup();
    await loaded();
    fireEvent.click(screen.getByTestId("set-dom-remove-dom1"));
    const dialog = screen.getByTestId("set-dom-confirm");
    expect(within(dialog).getByTestId("set-dom-confirm-title")).toHaveTextContent("Remove bellacucina.com?");
    expect(within(dialog).getByTestId("set-dom-confirm-body")).toHaveTextContent(
      "bellacucina.com stops pointing at this site. Visitors following that address get nothing until you reconnect it or change your DNS; the site keeps serving on its buildrick.app address.",
    );
    expect(dialog).toHaveAttribute("aria-label", "Remove bellacucina.com? · Bella Cucina");
    fireEvent.click(screen.getByTestId("set-dom-confirm-cancel"));
    expect(screen.queryByTestId("set-dom-confirm")).toBeNull();
    expect(d.remove.mutate).not.toHaveBeenCalled();
  });

  it("a refused remove closes the confirm and shows the banner over the untouched card", async () => {
    d.remove.mutate.mockRejectedValue(new Error("FORBIDDEN"));
    setup();
    await loaded();
    fireEvent.click(screen.getByTestId("set-dom-remove-dom1"));
    fireEvent.click(screen.getByTestId("set-dom-confirm-remove"));
    await waitFor(() => expect(screen.getByTestId("set-save-error")).toBeInTheDocument());
    expect(screen.queryByTestId("set-dom-confirm")).toBeNull();
    expect(screen.getByTestId("set-dom-card-dom1")).toBeInTheDocument();
  });
});

describe("DomainsScreen — empty (3397:33034), loading (3397:32985), load-error (3397:33085)", () => {
  it("with no domains draws the one CUSTOM DOMAIN card with its Add domain, and registers no header action", async () => {
    d.list.query.mockResolvedValue([]);
    const registerHeaderAction = vi.fn();
    setup({ registerHeaderAction });
    await loaded();
    const empty = screen.getByTestId("set-dom-empty");
    expect(empty).toHaveTextContent("Custom domain");
    expect(empty).toHaveTextContent("Point your own domain at this site. DNS changes happen at your domain registrar.");
    expect(empty).toHaveTextContent("No custom domain. Using the free buildrick.app address until you connect one.");
    expect(screen.queryByTestId("set-dom-removed")).toBeNull();
    expect(within(empty).getByTestId("set-dom-add")).toHaveClass("tw:h-8");
    expect(registerHeaderAction).not.toHaveBeenCalledWith(expect.objectContaining({ type: expect.anything() }));
    fireEvent.click(within(empty).getByTestId("set-dom-add"));
    expect(screen.getByTestId("set-dom-dialog")).toBeInTheDocument();
  });

  it("shows the CUSTOM DOMAIN load card while the rows are on their way", async () => {
    let resolve!: (rows: DomainRow[]) => void;
    d.list.query.mockReturnValue(new Promise((r) => { resolve = r; }));
    const onLoadStateChange = vi.fn();
    setup({ onLoadStateChange });
    expect(screen.getByTestId("set-load-title")).toHaveTextContent("Custom domain");
    expect(screen.getByTestId("set-load-line")).toHaveTextContent(
      "Point your own domain at this site. DNS changes happen at your domain registrar.",
    );
    expect(screen.getByTestId("set-load-state")).toHaveTextContent("Loading…");
    expect(onLoadStateChange).toHaveBeenLastCalledWith("loading");
    await act(async () => { resolve([bella()]); });
    await loaded();
    expect(onLoadStateChange).toHaveBeenLastCalledWith("ready");
  });

  it("shows the error line + Try again when the read fails, and Try again re-reads", async () => {
    d.list.query.mockRejectedValueOnce(new Error("network"));
    const onLoadStateChange = vi.fn();
    setup({ onLoadStateChange });
    await waitFor(() => expect(screen.getByTestId("set-load-retry")).toBeInTheDocument());
    expect(screen.getByTestId("set-load-state")).toHaveTextContent(
      "Couldn't load your domains. Check your connection, then try again.",
    );
    expect(onLoadStateChange).toHaveBeenLastCalledWith("error");
    fireEvent.click(screen.getByTestId("set-load-retry"));
    await loaded();
    expect(d.list.query).toHaveBeenCalledTimes(2);
  });

  it("without a projectId (the demo) requests nothing and says so", () => {
    setup({ projectId: null });
    expect(screen.getByText("The demo project can't have a custom domain.")).toBeInTheDocument();
    expect(d.list.query).not.toHaveBeenCalled();
  });
});

describe("DomainsScreen — Add domain → 3737:43669 → connect → re-list", () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
  afterEach(() => vi.useRealTimers());

  it("the header's Add domain opens the dialog; a valid, available name connects with the site id and the form's choices, then the new row is listed", async () => {
    const registerHeaderAction = vi.fn();
    setup({ registerHeaderAction });
    await loaded();
    await waitFor(() => expect(registerHeaderAction.mock.calls.at(-1)?.[0]).not.toBeNull());
    mountHeader(registerHeaderAction);
    fireEvent.click(screen.getByTestId("set-dom-add"));
    const dialog = screen.getByTestId("set-dom-dialog");
    expect(within(dialog).getByTestId("set-dom-dialog-scope")).toHaveTextContent("Bella Cucina · Domains");

    fireEvent.change(screen.getByTestId("set-dom-name"), { target: { value: "New.Example " } });
    await act(async () => { await vi.advanceTimersByTimeAsync(300); });
    await waitFor(() => expect(screen.getByTestId("set-dom-avail")).toHaveTextContent("Available"));
    expect(d.checkAvailability.query).toHaveBeenCalledWith({ domain: "new.example" });

    fireEvent.click(screen.getByTestId("set-dom-kind-subdomain"));
    fireEvent.change(screen.getByTestId("set-dom-provider"), { target: { value: "cloudflare" } });
    fireEvent.click(screen.getByTestId("set-dom-force-https"));

    d.connect.mutate.mockImplementation(async () => {
      d.list.query.mockResolvedValue([bella(), bella({ id: "dom9", domain: "new.example", status: "PENDING", isPrimary: false })]);
      return bella({ id: "dom9" });
    });
    fireEvent.click(screen.getByTestId("set-dom-submit"));
    await waitFor(() =>
      expect(d.connect.mutate).toHaveBeenCalledWith({
        siteId: "s1",
        domain: "new.example",
        kind: "SUBDOMAIN",
        dnsProvider: "cloudflare",
        forceHttps: false,
      }),
    );
    await waitFor(() => expect(screen.queryByTestId("set-dom-dialog")).toBeNull());
    await waitFor(() => expect(screen.getByTestId("set-dom-status-dom9")).toHaveTextContent("PENDING"));
    expect(d.list.query).toHaveBeenCalledTimes(2);
  });

  it("a refused connect keeps the dialog open with the server's reason under the form", async () => {
    d.connect.mutate.mockRejectedValue(new Error("Domain already in use."));
    const registerHeaderAction = vi.fn();
    setup({ registerHeaderAction });
    await loaded();
    await waitFor(() => expect(registerHeaderAction.mock.calls.at(-1)?.[0]).not.toBeNull());
    mountHeader(registerHeaderAction);
    fireEvent.click(screen.getByTestId("set-dom-add"));
    fireEvent.change(screen.getByTestId("set-dom-name"), { target: { value: "taken.example" } });
    await act(async () => { await vi.advanceTimersByTimeAsync(300); });
    await waitFor(() => expect(screen.getByTestId("set-dom-submit")).not.toBeDisabled());
    fireEvent.click(screen.getByTestId("set-dom-submit"));
    await waitFor(() => expect(screen.getByTestId("set-dom-dialog-error")).toHaveTextContent("Domain already in use."));
    expect(screen.getByTestId("set-dom-dialog")).toBeInTheDocument();
    expect(screen.getByTestId("set-dom-submit")).not.toBeDisabled();
    expect(d.list.query).toHaveBeenCalledTimes(1);
  });
});
