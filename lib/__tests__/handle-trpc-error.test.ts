/**
 * B-4: handleTRPCError toasted only for INTERNAL_SERVER_ERROR and network
 * errors, and redirected to /auth/login on UNAUTHORIZED unconditionally —
 * including on /review/<token> and /share/<token>, where the visitor never
 * logged in and has nowhere to be redirected back from. Every other 4xx
 * (FORBIDDEN, NOT_FOUND, BAD_REQUEST, CONFLICT, ...) silently did nothing,
 * so a blocked action (e.g. Settings > Integrations > Disconnect as an
 * EDITOR) looked like it succeeded.
 *
 * @license BSD-3-Clause
 */
import { describe, expect, it, beforeEach, vi } from "vitest";
import { TRPCClientError } from "@trpc/client";
import { handleTRPCError } from "../trpc/client";

function trpcError(code: string, message: string) {
  const err = new TRPCClientError(message);
  Object.assign(err, { data: { code } });
  return err;
}

function ensureToastRoot(): HTMLElement {
  let root = document.getElementById("trpc-toast-root");
  if (!root) {
    root = document.createElement("div");
    root.id = "trpc-toast-root";
    document.body.appendChild(root);
  }
  root.innerHTML = "";
  return root;
}

function toastRoot(): HTMLElement {
  const root = document.getElementById("trpc-toast-root");
  if (!root) throw new Error("toast root missing");
  return root;
}

describe("handleTRPCError", () => {
  beforeEach(() => {
    ensureToastRoot();
    delete (window as unknown as { location?: unknown }).location;
    // @ts-expect-error — jsdom allows reassigning location for the test
    window.location = { pathname: "/dashboard/sites/abc", href: "" };
  });

  it("redirects to login on UNAUTHORIZED outside /review and /share", () => {
    handleTRPCError(trpcError("UNAUTHORIZED", "Please sign in"));
    expect(window.location.href).toBe("/auth/login");
  });

  it("does not redirect on UNAUTHORIZED under /review/<token>", () => {
    window.location.pathname = "/review/abc123";
    handleTRPCError(trpcError("UNAUTHORIZED", "Link expired"));
    expect(window.location.href).toBe("");
    expect(toastRoot().textContent).toContain("Link expired");
  });

  it("does not redirect on UNAUTHORIZED under /share/<token>", () => {
    window.location.pathname = "/share/xyz";
    handleTRPCError(trpcError("UNAUTHORIZED", "Link expired"));
    expect(window.location.href).toBe("");
  });

  it("toasts the server message for FORBIDDEN", () => {
    handleTRPCError(trpcError("FORBIDDEN", "You don't have permission to do that"));
    expect(toastRoot().textContent).toContain("You don't have permission to do that");
  });

  it("toasts the server message for NOT_FOUND", () => {
    handleTRPCError(trpcError("NOT_FOUND", "Site not found"));
    expect(toastRoot().textContent).toContain("Site not found");
  });

  it("toasts the server message for BAD_REQUEST", () => {
    handleTRPCError(trpcError("BAD_REQUEST", "Invalid domain"));
    expect(toastRoot().textContent).toContain("Invalid domain");
  });

  it("toasts the server message for CONFLICT", () => {
    handleTRPCError(trpcError("CONFLICT", "That name is taken"));
    expect(toastRoot().textContent).toContain("That name is taken");
  });

  it("still shows the generic message for INTERNAL_SERVER_ERROR", () => {
    handleTRPCError(trpcError("INTERNAL_SERVER_ERROR", "boom"));
    expect(toastRoot().textContent).toContain("Something went wrong");
    expect(toastRoot().textContent).not.toContain("boom");
  });
});
