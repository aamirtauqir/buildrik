/**
 * AddDomainDialog — Clone 3737:43669 `Add a domain` (640): the form that
 * feeds `domains.connect`. The availability tag, the segmented type, the
 * provider's nameservers, the records shape, the Force HTTPS toggle and the
 * two doors out — each a DOM fact; the visual half is the live walk's shot
 * pair.
 *
 * @license BSD-3-Clause
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as React from "react";
import { AddDomainDialog, AVAILABILITY_DEBOUNCE_MS } from "../AddDomainDialog";

function mount(over: Partial<React.ComponentProps<typeof AddDomainDialog>> = {}) {
  const props = {
    open: true,
    siteName: "Bella Cucina",
    checkAvailability: vi.fn().mockResolvedValue({ available: true }),
    onSubmit: vi.fn().mockResolvedValue(undefined),
    onCancel: vi.fn(),
    ...over,
  };
  const utils = render(<AddDomainDialog {...props} />);
  return { props, ...utils };
}

const name = () => screen.getByTestId("set-dom-name") as HTMLInputElement;
const submit = () => screen.getByTestId("set-dom-submit");
const typeName = (value: string) => fireEvent.change(name(), { target: { value } });
const settle = () => act(async () => { await vi.advanceTimersByTimeAsync(AVAILABILITY_DEBOUNCE_MS); });

beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
afterEach(() => vi.useRealTimers());

describe("Clone 3737:43669 · Add a domain — the frame's shape", () => {
  it("carries the title, the scope line and every field, at the 640 table width, with Add domain waiting for a name", () => {
    mount();
    const dialog = screen.getByTestId("set-dom-dialog");
    expect(dialog).toHaveClass("tw:w-[640px]");
    expect(dialog).toHaveAttribute("aria-label", "Add a domain · Bella Cucina");
    expect(screen.getByTestId("set-dom-dialog-title")).toHaveTextContent("Add a domain");
    expect(screen.getByTestId("set-dom-dialog-scope")).toHaveTextContent("Bella Cucina · Domains");

    expect(screen.getByLabelText("Domain name")).toBe(name());
    expect(document.activeElement).toBe(name());
    expect(screen.queryByTestId("set-dom-avail")).toBeNull();

    const kinds = within(screen.getByRole("group", { name: "Domain type" })).getAllByRole("button");
    expect(kinds.map((b) => b.textContent)).toEqual(["Primary", "Redirect", "Subdomain"]);
    expect(screen.getByTestId("set-dom-kind-primary")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("set-dom-kind-redirect")).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByTestId("set-dom-kind-subdomain")).toHaveAttribute("aria-pressed", "false");

    const provider = screen.getByLabelText("DNS provider") as HTMLSelectElement;
    expect(provider).toBe(screen.getByTestId("set-dom-provider"));
    expect(provider.value).toBe("namecheap");
    expect(Array.from(provider.options).map((o) => o.textContent)).toEqual(["Namecheap", "Cloudflare", "GoDaddy", "Other"]);
    expect(dialog).toHaveTextContent("Cloudflare, GoDaddy and Other are also supported.");

    expect(dialog).toHaveTextContent("Read-only · set at your registrar");
    expect(screen.getByTestId("set-dom-ns")).toHaveTextContent("dns1.registrar-servers.com");
    expect(screen.getByTestId("set-dom-ns")).toHaveTextContent("dns2.registrar-servers.com");

    expect(dialog).toHaveTextContent("Add these at Namecheap");
    const records = screen.getByTestId("set-dom-records");
    expect(within(records).getAllByRole("columnheader").map((h) => h.textContent)).toEqual(["Type", "Name", "Value"]);
    const rows = within(records).getAllByRole("row").slice(1);
    expect(rows.map((r) => within(r).getAllByRole("cell").map((c) => c.textContent))).toEqual([
      ["A", "@", "76.76.21.21"],
      ["CNAME", "www", "cname.vercel-dns.com"],
      ["TXT", "_buildrick", "brk-verify-…"],
    ]);

    expect(screen.getByRole("switch", { name: "Force HTTPS" })).toBe(screen.getByTestId("set-dom-force-https"));
    expect(screen.getByTestId("set-dom-force-https")).toHaveAttribute("aria-checked", "true");
    expect(dialog).toHaveTextContent("Redirect every http:// request to https://.");
    expect(dialog).toHaveTextContent("DNS can take up to 48 hours to propagate. SSL is issued automatically.");

    expect(screen.getByTestId("set-dom-cancel")).toHaveTextContent("Cancel");
    expect(screen.getByTestId("set-dom-cancel")).toHaveClass("tw:h-8");
    expect(submit()).toHaveTextContent("Add domain");
    expect(submit()).toHaveClass("tw:h-8");
    expect(submit()).toBeDisabled();
  });

  it("the segmented type presses one at a time", () => {
    mount();
    fireEvent.click(screen.getByTestId("set-dom-kind-redirect"));
    expect(screen.getByTestId("set-dom-kind-redirect")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("set-dom-kind-primary")).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(screen.getByTestId("set-dom-kind-subdomain"));
    expect(screen.getByTestId("set-dom-kind-subdomain")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("set-dom-kind-redirect")).toHaveAttribute("aria-pressed", "false");
  });

  it("the provider drives the nameservers block and the records note; Other has none to list", () => {
    mount();
    fireEvent.change(screen.getByTestId("set-dom-provider"), { target: { value: "godaddy" } });
    expect(screen.getByTestId("set-dom-ns")).toHaveTextContent("domaincontrol.com");
    expect(screen.getByTestId("set-dom-dialog")).toHaveTextContent("Add these at GoDaddy");
    fireEvent.change(screen.getByTestId("set-dom-provider"), { target: { value: "other" } });
    expect(screen.getByTestId("set-dom-ns")).toHaveTextContent("Set at your registrar.");
    expect(screen.getByTestId("set-dom-dialog")).toHaveTextContent("Add these at your registrar");
  });

  it("names the dialog without a site when none is known, and renders nothing while closed", () => {
    mount({ siteName: "" });
    expect(screen.getByTestId("set-dom-dialog")).toHaveAttribute("aria-label", "Add a domain");
    expect(screen.getByTestId("set-dom-dialog-scope")).toHaveTextContent(/^Domains$/);
  });

  it("renders nothing while closed", () => {
    mount({ open: false });
    expect(screen.queryByTestId("set-dom-dialog")).toBeNull();
  });
});

describe("Add a domain — the availability tag", () => {
  it("a malformed name is refused by the server's own hostname rule at once, without a request", async () => {
    const { props } = mount();
    typeName("bella cucina");
    expect(screen.getByTestId("set-dom-avail")).toHaveTextContent("Not a valid domain");
    expect(screen.getByTestId("set-dom-avail")).toHaveAttribute("data-state", "invalid");
    expect(name()).toHaveAttribute("aria-invalid", "true");
    await settle();
    expect(props.checkAvailability).not.toHaveBeenCalled();
    expect(submit()).toBeDisabled();
  });

  it("a well-formed name is checked 300 ms after the last keystroke, trimmed and lowercased, and Available enables Add domain", async () => {
    const { props } = mount();
    typeName("Bella");
    typeName("BellaCucina.com ");
    expect(screen.getByTestId("set-dom-avail")).toHaveTextContent("Checking…");
    expect(props.checkAvailability).not.toHaveBeenCalled();
    await settle();
    expect(props.checkAvailability).toHaveBeenCalledTimes(1);
    expect(props.checkAvailability).toHaveBeenCalledWith("bellacucina.com");
    await waitFor(() => expect(screen.getByTestId("set-dom-avail")).toHaveTextContent("Available"));
    expect(screen.getByTestId("set-dom-avail")).toHaveAttribute("data-state", "available");
    expect(name()).not.toHaveAttribute("aria-invalid");
    expect(submit()).not.toBeDisabled();
  });

  it("a name another site holds reads Already connected and keeps Add domain off", async () => {
    mount({ checkAvailability: vi.fn().mockResolvedValue({ available: false, reason: "connected" }) });
    typeName("taken.example");
    await settle();
    await waitFor(() => expect(screen.getByTestId("set-dom-avail")).toHaveTextContent("Already connected"));
    expect(name()).toHaveAttribute("aria-invalid", "true");
    expect(submit()).toBeDisabled();
  });

  it("a check that cannot reach the server says so and keeps Add domain off", async () => {
    mount({ checkAvailability: vi.fn().mockRejectedValue(new Error("network")) });
    typeName("bellacucina.com");
    await settle();
    await waitFor(() => expect(screen.getByTestId("set-dom-avail")).toHaveTextContent("Couldn't check"));
    expect(submit()).toBeDisabled();
  });

  it("clearing the field clears the tag", async () => {
    mount();
    typeName("bellacucina.com");
    await settle();
    await waitFor(() => expect(screen.getByTestId("set-dom-avail")).toHaveTextContent("Available"));
    typeName("");
    expect(screen.queryByTestId("set-dom-avail")).toBeNull();
    expect(submit()).toBeDisabled();
  });
});

describe("Add a domain — the two doors out", () => {
  it("Add domain hands the caller the name and the form's choices", async () => {
    const { props } = mount();
    typeName("bellacucina.com");
    await settle();
    await waitFor(() => expect(submit()).not.toBeDisabled());
    fireEvent.click(screen.getByTestId("set-dom-kind-redirect"));
    fireEvent.change(screen.getByTestId("set-dom-provider"), { target: { value: "cloudflare" } });
    fireEvent.click(screen.getByTestId("set-dom-force-https"));
    fireEvent.click(submit());
    await waitFor(() =>
      expect(props.onSubmit).toHaveBeenCalledWith({
        domain: "bellacucina.com",
        kind: "REDIRECT",
        dnsProvider: "cloudflare",
        forceHttps: false,
      }),
    );
    expect(props.onCancel).not.toHaveBeenCalled();
  });

  it("a refused connect keeps the dialog open with the reason under the form, and Add domain live to retry", async () => {
    const { props } = mount({ onSubmit: vi.fn().mockRejectedValue(new Error("Domain already in use.")) });
    typeName("bellacucina.com");
    await settle();
    await waitFor(() => expect(submit()).not.toBeDisabled());
    fireEvent.click(submit());
    await waitFor(() => expect(screen.getByTestId("set-dom-dialog-error")).toHaveTextContent("Domain already in use."));
    expect(screen.getByTestId("set-dom-dialog-error")).toHaveAttribute("role", "alert");
    expect(screen.getByTestId("set-dom-dialog")).toBeInTheDocument();
    expect(submit()).not.toBeDisabled();
    expect(props.onCancel).not.toHaveBeenCalled();
  });

  it("Cancel, Escape and the scrim all cancel", () => {
    const { props } = mount();
    fireEvent.click(screen.getByTestId("set-dom-cancel"));
    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.mouseDown(screen.getByTestId("overlay-scrim"));
    expect(props.onCancel).toHaveBeenCalledTimes(3);
    expect(props.onSubmit).not.toHaveBeenCalled();
  });

  it("a reopened dialog starts clean", async () => {
    const { props, rerender } = mount();
    typeName("bellacucina.com");
    fireEvent.click(screen.getByTestId("set-dom-kind-subdomain"));
    await settle();
    rerender(<AddDomainDialog {...props} open={false} />);
    rerender(<AddDomainDialog {...props} open />);
    expect(name().value).toBe("");
    expect(screen.queryByTestId("set-dom-avail")).toBeNull();
    expect(screen.getByTestId("set-dom-kind-primary")).toHaveAttribute("aria-pressed", "true");
    expect(submit()).toBeDisabled();
  });
});
