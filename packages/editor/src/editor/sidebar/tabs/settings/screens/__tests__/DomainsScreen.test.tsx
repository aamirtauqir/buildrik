/**
 * DomainsScreen tests — 8136:214348 (several) / 8136:214574 (set-primary
 * confirm): one card per domain, primary first, with its PRIMARY badge and
 * connection line; `Set as primary` → confirm → `domains.setPrimary` → re-list;
 * `Manage DNS` → the domain's own view (Custom domain + DNS records cards:
 * Force HTTPS → update, Check DNS → check, Remove → confirm → remove); `Add a
 * domain` under the cards → AddDomainDialog → connect → re-list; the empty
 * card, the load states and the banner a refused action leaves. Never dirty.
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
        usesVercel: { query: vi.fn() },
        connect: { mutate: vi.fn() },
        update: { mutate: vi.fn() },
        check: { mutate: vi.fn() },
        remove: { mutate: vi.fn() },
        setPrimary: { mutate: vi.fn() },
      },
    },
  },
}));

vi.mock("@/services/api-client", () => ({
  getBuildrikClient: () => api,
}));

import { DomainsScreen } from "../DomainsScreen";
import { SAVE_ERROR_MESSAGES } from "../../constants";
import type { DomainRow } from "../DomainsScreen";

const d = api.siteDetail.domains;

const bella = (over: Partial<DomainRow> = {}): DomainRow => ({
  id: "dom1",
  domain: "bellacucina.com",
  status: "VERIFIED",
  sslStatus: "ACTIVE",
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
  sslStatus: "PENDING",
  isPrimary: false,
  kind: "SUBDOMAIN",
  forceHttps: false,
  dnsProvider: null,
  dnsRecords: [{ type: "CNAME", host: "shop", value: "cname.vercel-dns.com", verified: false }],
});

beforeEach(() => {
  d.list.query.mockReset().mockResolvedValue([bella()]);
  d.checkAvailability.query.mockReset().mockResolvedValue({ available: true });
  d.usesVercel.query.mockReset().mockResolvedValue({ vercelConnected: false });
  d.connect.mutate.mockReset().mockResolvedValue(bella({ id: "dom9", domain: "new.example", status: "PENDING" }));
  d.update.mutate.mockReset().mockImplementation(async (input: { id: string; forceHttps: boolean }) =>
    bella({ forceHttps: input.forceHttps }),
  );
  d.check.mutate.mockReset().mockResolvedValue(bella());
  d.remove.mutate.mockReset().mockResolvedValue({ ok: true });
  d.setPrimary.mutate.mockReset().mockResolvedValue(bella());
});

afterEach(() => cleanup());

function setup(
  opts: {
    projectId?: string | null;
    onDirtyChange?: (d: boolean) => void;
    onLoadStateChange?: (s: "loading" | "ready" | "error") => void;
    registerHeader?: (h: { title?: string } | null) => void;
    saveError?: string | null;
    readOnly?: boolean;
  } = {},
) {
  const composer = createMockComposer({ projectMetadata: { domain: null, name: "Bella Cucina" } });
  const utils = render(
    <DomainsScreen
      composer={composer}
      projectId={opts.projectId === undefined ? "s1" : opts.projectId}
      onDirtyChange={opts.onDirtyChange}
      onLoadStateChange={opts.onLoadStateChange}
      registerHeader={opts.registerHeader}
      saveError={opts.saveError}
      readOnly={opts.readOnly}
    />,
  );
  return { composer, ...utils };
}

const loaded = () => waitFor(() => expect(screen.getByTestId("set-dom-add")).toBeInTheDocument());
const httpsToggle = (id = "dom1") => screen.getByTestId(`set-dom-https-${id}`);

/** Load, then open a domain's Manage DNS view. */
async function manage(id = "dom1") {
  await loaded();
  fireEvent.click(screen.getByTestId(`set-dom-manage-${id}`));
  await waitFor(() => expect(screen.getByTestId(`set-dom-card-${id}`)).toBeInTheDocument());
}

describe("DomainsScreen — 8136:214348, one card per domain", () => {
  it("lists the domains primary first: name, PRIMARY badge, connection line, Set as primary on the others, Manage DNS on each", async () => {
    d.list.query.mockResolvedValue([{ ...shop(), status: "VERIFIED", sslStatus: "ACTIVE" }, bella()]);
    setup();
    await loaded();
    const items = screen.getAllByTestId(/^set-dom-item-/);
    expect(items.map((c) => c.getAttribute("data-testid"))).toEqual(["set-dom-item-dom1", "set-dom-item-dom2"]);
    expect(items[0]).toHaveTextContent("bellacucina.com");
    expect(screen.getByTestId("set-dom-primary-dom1")).toHaveTextContent("Primary");
    expect(screen.getByTestId("set-dom-primary-dom1").id).toBe("dom-primary");
    expect(screen.queryByTestId("set-dom-primary-dom2")).toBeNull();
    expect(screen.getByTestId("set-dom-line-dom1")).toHaveTextContent("Connected · SSL active");
    expect(screen.queryByTestId("set-dom-make-primary-dom1")).toBeNull();
    expect(screen.getByTestId("set-dom-make-primary-dom2")).toHaveTextContent("Set as primary");
    expect(screen.getByTestId("set-dom-manage-dom1")).toHaveTextContent("Manage DNS");
    expect(screen.getByTestId("set-dom-manage-dom2")).toHaveTextContent("Manage DNS");
    expect(screen.getByTestId("set-dom-add")).toHaveTextContent("Add a domain");
    expect(screen.queryByTestId("set-dom-card-dom1")).toBeNull();
    expect(d.list.query).toHaveBeenCalledWith({ siteId: "s1" });
  });

  it("says where a domain that is not connected stands, and keeps Set as primary off until it is verified", async () => {
    d.list.query.mockResolvedValue([bella(), shop()]);
    setup();
    await loaded();
    expect(screen.getByTestId("set-dom-line-dom2")).toHaveTextContent("Waiting for DNS · not connected yet");
    expect(screen.getByTestId("set-dom-make-primary-dom2")).toBeDisabled();
    expect(screen.getByTestId("set-dom-make-primary-dom2")).toHaveAttribute("title", "Verify this domain before making it primary");
  });

  it("Manage DNS opens the domain's view: the Custom domain and DNS records cards, the header naming the domain", async () => {
    const registerHeader = vi.fn();
    setup({ registerHeader });
    await manage();
    expect(registerHeader).toHaveBeenLastCalledWith({ title: "bellacucina.com" });
    const card = screen.getByTestId("set-dom-card-dom1");
    expect(within(card).getByTestId("set-card-custom-domain")).toHaveTextContent("Custom domain");
    expect(within(card).getByLabelText("Domain")).toHaveValue("bellacucina.com");
    expect(within(card).getByLabelText("Domain")).toHaveAttribute("readonly");
    expect(within(card).getByLabelText("Domain").id).toBe("dom-domain");
    expect(screen.getByTestId("set-dom-status-dom1")).toHaveTextContent("VERIFIED");
    expect(screen.getByTestId("set-dom-status-dom1")).toHaveClass("tw:bg-[var(--bk-success-tint)]");
    expect(httpsToggle()).toHaveAttribute("aria-checked", "true");
    expect(httpsToggle().id).toBe("dom-force-https");
    expect(screen.getByTestId("set-dom-remove-dom1")).toHaveTextContent("Remove bellacucina.com…");

    const dns = screen.getByTestId("set-dom-dns-dom1");
    expect(within(dns).getByRole("table").id).toBe("dom-dns-records");
    expect(within(dns).getAllByRole("columnheader").map((h) => h.textContent)).toEqual(["Type", "Name", "Value", "Status"]);
    const row2 = screen.getByTestId("set-dom-dns-row-dom1-2");
    expect(row2).toHaveTextContent("_buildrick");
    expect(within(row2).getByText("PENDING").closest("[data-status]")).toHaveClass("tw:bg-[var(--bk-yellow-100)]");

    fireEvent.click(screen.getByTestId("set-dom-back"));
    expect(screen.getByTestId("set-dom-item-dom1")).toBeInTheDocument();
    expect(registerHeader).toHaveBeenLastCalledWith(null);
  });

  it("a second domain's view carries the numbered ids", async () => {
    d.list.query.mockResolvedValue([shop(), bella()]);
    setup();
    await manage("dom2");
    expect(screen.getByTestId("set-card-custom-domain-1")).toBeInTheDocument();
    expect(httpsToggle("dom2").id).toBe("dom-force-https-1");
  });

  it("is never dirty — reports onDirtyChange(false) and nothing else", async () => {
    const onDirtyChange = vi.fn();
    setup({ onDirtyChange });
    await manage();
    fireEvent.click(httpsToggle());
    await waitFor(() => expect(d.update.mutate).toHaveBeenCalled());
    expect(onDirtyChange).toHaveBeenCalledWith(false);
    expect(onDirtyChange).not.toHaveBeenCalledWith(true);
  });

  it("read-only disables Add a domain and Set as primary", async () => {
    d.list.query.mockResolvedValue([bella(), { ...shop(), status: "VERIFIED" }]);
    setup({ readOnly: true });
    await loaded();
    expect(screen.getByTestId("set-dom-add")).toBeDisabled();
    expect(screen.getByTestId("set-dom-make-primary-dom2")).toBeDisabled();
  });
});

describe("DomainsScreen — Set as primary → 8136:214574", () => {
  it("names the domain in the confirm; Cancel changes nothing", async () => {
    d.list.query.mockResolvedValue([bella(), { ...shop(), status: "VERIFIED" }]);
    setup();
    await loaded();
    fireEvent.click(screen.getByTestId("set-dom-make-primary-dom2"));
    expect(screen.getByTestId("set-dom-primary-title")).toHaveTextContent("Set shop.bellacucina.com as primary?");
    expect(screen.getByTestId("set-dom-primary-body")).toHaveTextContent(
      "shop.bellacucina.com becomes the address visitors land on. This change is live immediately; no publish is needed.",
    );
    fireEvent.click(screen.getByTestId("set-dom-primary-cancel"));
    expect(screen.queryByTestId("set-dom-primary-confirm")).toBeNull();
    expect(d.setPrimary.mutate).not.toHaveBeenCalled();
  });

  it("confirm runs domains.setPrimary and the badge moves with the re-list", async () => {
    d.list.query.mockResolvedValue([bella(), { ...shop(), status: "VERIFIED" }]);
    d.setPrimary.mutate.mockImplementation(async () => {
      d.list.query.mockResolvedValue([{ ...shop(), status: "VERIFIED", isPrimary: true }, bella({ isPrimary: false })]);
      return {};
    });
    setup();
    await loaded();
    fireEvent.click(screen.getByTestId("set-dom-make-primary-dom2"));
    fireEvent.click(screen.getByTestId("set-dom-primary-ok"));
    await waitFor(() => expect(d.setPrimary.mutate).toHaveBeenCalledWith({ id: "dom2", siteId: "s1" }));
    await waitFor(() => expect(screen.getByTestId("set-dom-primary-dom2")).toBeInTheDocument());
    expect(screen.queryByTestId("set-dom-primary-dom1")).toBeNull();
    expect(screen.queryByTestId("set-dom-primary-confirm")).toBeNull();
  });

  it("a refusal stays in the dialog with the server's sentence", async () => {
    d.list.query.mockResolvedValue([bella(), { ...shop(), status: "VERIFIED" }]);
    d.setPrimary.mutate.mockRejectedValue(new Error("Verify this domain before making it primary."));
    setup();
    await loaded();
    fireEvent.click(screen.getByTestId("set-dom-make-primary-dom2"));
    fireEvent.click(screen.getByTestId("set-dom-primary-ok"));
    await waitFor(() =>
      expect(screen.getByTestId("set-dom-primary-error")).toHaveTextContent("Verify this domain before making it primary."),
    );
    expect(screen.getByTestId("set-dom-primary-confirm")).toBeInTheDocument();
  });
});


describe("DomainsScreen — actions land as they are confirmed", () => {
  it("Force HTTPS writes domains.update at once and shows the row the server returns", async () => {
    setup();
    await manage();
    fireEvent.click(httpsToggle());
    await waitFor(() => expect(d.update.mutate).toHaveBeenCalledWith({ id: "dom1", forceHttps: false }));
    await waitFor(() => expect(httpsToggle()).toHaveAttribute("aria-checked", "false"));
    expect(screen.queryByTestId("set-save-error")).toBeNull();
  });

  it("a refused toggle shows the banner and leaves the switch as the server has it", async () => {
    d.update.mutate.mockRejectedValue(new Error("FORBIDDEN"));
    setup();
    await manage();
    fireEvent.click(httpsToggle());
    await waitFor(() => expect(screen.getByTestId("set-save-error")).toHaveTextContent(SAVE_ERROR_MESSAGES.domains!));
    expect(httpsToggle()).toHaveAttribute("aria-checked", "true");
    expect(httpsToggle()).not.toBeDisabled();
  });

  it("Check DNS runs domains.check, then re-lists — the pills are the resolver's answer", async () => {
    d.check.mutate.mockImplementation(async () => {
      d.list.query.mockResolvedValue([bella({ dnsRecords: bella().dnsRecords.map((r) => ({ ...r, verified: true })) })]);
      return bella();
    });
    setup();
    await manage();
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
    await manage();
    fireEvent.click(screen.getByTestId("set-dom-check-dom1"));
    await waitFor(() => expect(screen.getByTestId("set-save-error")).toBeInTheDocument());
    expect(within(screen.getByTestId("set-dom-dns-row-dom1-2")).getByText("PENDING")).toBeInTheDocument();
    expect(d.list.query).toHaveBeenCalledTimes(1);
  });

  it("the next action that succeeds takes the banner down", async () => {
    d.update.mutate.mockRejectedValueOnce(new Error("FORBIDDEN"));
    setup();
    await manage();
    fireEvent.click(httpsToggle());
    await waitFor(() => expect(screen.getByTestId("set-save-error")).toBeInTheDocument());
    fireEvent.click(httpsToggle());
    await waitFor(() => expect(httpsToggle()).toHaveAttribute("aria-checked", "false"));
    expect(screen.queryByTestId("set-save-error")).toBeNull();
  });

  it("renders the shell's saveError above the cards", async () => {
    setup({ saveError: "Domain changes were not saved. Your changes are still here. Review the values, then retry." });
    await loaded();
    expect(screen.getByTestId("set-save-error")).toHaveTextContent(/Domain changes were not saved/);
  });
});

describe("DomainsScreen — Manage DNS › Remove → confirm → removed", () => {
  it("Remove opens the confirm with the domain in its title and body; Cancel removes nothing", async () => {
    setup();
    await manage();
    fireEvent.click(screen.getByTestId("set-dom-remove-dom1"));
    const dialog = screen.getByTestId("set-dom-confirm");
    expect(within(dialog).getByTestId("set-dom-confirm-title")).toHaveTextContent("Remove bellacucina.com?");
    expect(within(dialog).getByTestId("set-dom-confirm-body")).toHaveTextContent(
      "bellacucina.com stops pointing at this site. Visitors following that address get nothing until you reconnect it or change your DNS; the site keeps serving on its default vercel.app address.",
    );
    expect(dialog).toHaveAttribute("aria-label", "Remove bellacucina.com? · Bella Cucina");
    fireEvent.click(screen.getByTestId("set-dom-confirm-cancel"));
    expect(screen.queryByTestId("set-dom-confirm")).toBeNull();
    expect(d.remove.mutate).not.toHaveBeenCalled();
  });

  it("Remove domain runs domains.remove, then the empty card says the domain is gone", async () => {
    d.remove.mutate.mockImplementation(async () => {
      d.list.query.mockResolvedValue([]);
      return { ok: true };
    });
    setup();
    await manage();
    fireEvent.click(screen.getByTestId("set-dom-remove-dom1"));
    fireEvent.click(screen.getByTestId("set-dom-confirm-remove"));
    await waitFor(() => expect(d.remove.mutate).toHaveBeenCalledWith({ id: "dom1" }));
    await waitFor(() => expect(screen.getByTestId("set-dom-empty")).toBeInTheDocument());
    expect(screen.queryByTestId("set-dom-confirm")).toBeNull();
    expect(screen.getByTestId("set-dom-removed")).toHaveTextContent(
      "bellacucina.com removed. This site is still available at its default vercel.app address.",
    );
    expect(screen.queryByTestId("set-dom-card-dom1")).toBeNull();
    expect(screen.getByTestId("set-dom-add")).toBeInTheDocument();
  });

  it("a refused remove closes the confirm and shows the banner over the untouched card", async () => {
    d.remove.mutate.mockRejectedValue(new Error("FORBIDDEN"));
    setup();
    await manage();
    fireEvent.click(screen.getByTestId("set-dom-remove-dom1"));
    fireEvent.click(screen.getByTestId("set-dom-confirm-remove"));
    await waitFor(() => expect(screen.getByTestId("set-save-error")).toBeInTheDocument());
    expect(screen.queryByTestId("set-dom-confirm")).toBeNull();
    expect(screen.getByTestId("set-dom-card-dom1")).toBeInTheDocument();
  });
});

describe("DomainsScreen — empty (3397:33034), loading (3397:32985), load-error (3397:33085)", () => {
  it("with no domains draws the one CUSTOM DOMAIN card with its Add a domain", async () => {
    d.list.query.mockResolvedValue([]);
    setup();
    await loaded();
    const empty = screen.getByTestId("set-dom-empty");
    expect(empty).toHaveTextContent("Custom domain");
    expect(empty).toHaveTextContent("Point your own domain at this site. DNS changes happen at your domain registrar.");
    expect(empty).toHaveTextContent("No custom domain. The site uses its default vercel.app address until you connect one.");
    expect(screen.queryByTestId("set-dom-removed")).toBeNull();
    expect(within(empty).getByTestId("set-dom-add")).toHaveTextContent("Add a domain");
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

describe("DomainsScreen — Add a domain → 3737:43669 → connect → re-list", () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
  afterEach(() => vi.useRealTimers());

  it("a Vercel-connected workspace gets an Add dialog with no _buildrick TXT row", async () => {
    d.usesVercel.query.mockResolvedValue({ vercelConnected: true });
    setup();
    await loaded();
    fireEvent.click(screen.getByTestId("set-dom-add"));
    fireEvent.change(screen.getByTestId("set-dom-name"), { target: { value: "bellacucina.com" } });
    const records = screen.getByTestId("set-dom-records");
    await waitFor(() => expect(records).not.toHaveTextContent("_buildrick"));
    expect(d.usesVercel.query).toHaveBeenCalled();
  });

  it("Add a domain opens the dialog; a valid, available name connects with the site id and the form's choices, then the new row is listed", async () => {
    setup();
    await loaded();
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
    await waitFor(() => expect(screen.getByTestId("set-dom-line-dom9")).toHaveTextContent("Waiting for DNS"));
    expect(d.list.query).toHaveBeenCalledTimes(2);
  });

  it("a refused connect keeps the dialog open with the server's reason under the form", async () => {
    d.connect.mutate.mockRejectedValue(new Error("Domain already in use."));
    setup();
    await loaded();
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
