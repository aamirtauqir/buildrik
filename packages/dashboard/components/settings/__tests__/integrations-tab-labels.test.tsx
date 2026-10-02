/**
 * B-8: every provider-config field is reachable by its label once its
 * provider is expanded, and the label keeps the panel's original
 * body-sm / text-primary look.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { IntegrationsTab } from "../integrations-tab";

/* PD-2 (2026-10-02): no Google Analytics card — its Tracking ID was read by nothing. */
const FIELDS: [number, string[]][] = [
  [0, ["API Key", "Audience ID"]],
  [1, ["Webhook URL"]],
  [2, ["Webhook URL", "Channel name"]],
];

describe("IntegrationsTab — label association", () => {
  it.each(FIELDS)("provider #%i: %j are reachable via getByLabelText", (index, names) => {
    render(<IntegrationsTab onAdd={vi.fn()} />);
    fireEvent.click(screen.getAllByRole("button", { name: "Connect" })[index]);
    for (const name of names) {
      const input = screen.getByLabelText(name);
      const label = document.querySelector(`label[for="${input.id}"]`) as HTMLElement;
      expect(label.className, name).toBe("block text-body-sm font-medium mb-1");
      expect(label.style.color, name).toBe("var(--color-text-primary)");
    }
    cleanup();
  });
});
