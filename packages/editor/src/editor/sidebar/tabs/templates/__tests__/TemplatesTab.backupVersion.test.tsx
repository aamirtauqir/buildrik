/**
 * C4 #25 — the template backup is a History auto-version (owner decision 25).
 *
 * It used to duplicate the page as "Home (backup)", which left a stray page in
 * the sitemap (and, before that, one called "Home Copy"). The backup is now an
 * auto-version in History › Saves, taken BEFORE the template replaces the
 * page, and no page is created.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/editor/chrome-ui", async () => {
  const actual = await vi.importActual<Record<string, unknown>>("@/editor/chrome-ui");
  return {
    ...actual,
    useToast: () => ({ addToast: vi.fn(), removeToast: vi.fn(), toasts: [] }),
    ToastProvider: ({ children }: { children: React.ReactNode }) => children,
  };
});

import { TemplatesTab } from "../TemplatesTab";
import { SITE_TEMPLATES } from "../templatesData";

function makeComposer(existingNames: string[] = ["Home"], order: string[] = []) {
  const renames: Array<{ id: string; name: string }> = [];
  const pages = existingNames.map((name, i) => ({ id: `page-${i + 1}`, name }));
  return {
    renames,
    composer: {
      elements: {
        getActivePage: vi.fn(() => ({ id: "page-1", name: "Home", root: { id: "root-1" } })),
        getAllPages: vi.fn(() => pages),
        duplicatePage: vi.fn(() => {
          const copy = { id: "page-dup", name: "Home Copy" };
          pages.push(copy);
          return copy;
        }),
        updatePage: vi.fn((id: string, data: { name?: string }) => {
          if (data.name) renames.push({ id, name: data.name });
        }),
        createPage: vi.fn(() => ({ id: "page-new", name: "New" })),
        setActivePage: vi.fn(),
        importHTMLToActivePage: vi.fn(() => {
          order.push("apply");
        }),
        recordAppliedTemplate: vi.fn(),
        /* `getChildCount` is what drives `hasExistingContent`, and that is what
           decides whether the replace confirm (and its backup checkbox) opens
           at all — an empty page applies straight away, correctly. */
        getElement: vi.fn((id: string) =>
          id === "root-1" ? { getId: () => "root-1", getChildCount: () => 1, getChildren: () => [] } : null,
        ),
      },
      styles: { clear: vi.fn() },
      versions: {
        autoCheckpoint: vi.fn(async (label: string) => {
          order.push(`checkpoint:${label}`);
          return { id: "v1" };
        }),
      },
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
    },
  };
}

async function applyWithBackup() {
  const first = SITE_TEMPLATES[0];
  /* The sidebar row opens the same preview as the grid card (decision #24). */
  fireEvent.click(await screen.findByTestId(`tpl-ws-item-${first.id}`));
  /* The card opens the preview (decision #24); its Replace page… is the apply. */
  fireEvent.click(await screen.findByText("Replace page…"));
  /* Assert the state, do not toggle blindly. The box now DEFAULTS ON — board
     1169:4713 draws it checked, because applying a template replaces the page
     and the safe option belongs on the default. This helper used to click it
     unconditionally, which under the new default turned backup OFF and made
     both tests below fail with an empty rename list. */
  const checkbox = await screen.findByText(/save the current page as a backup version first/i);
  const control = checkbox.closest("label") ?? checkbox;
  const input = control.querySelector?.('input[type="checkbox"]') as HTMLInputElement | null;
  if (input && !input.checked) fireEvent.click(checkbox);
  if (input) expect(input.checked, "backup must be on before Replace").toBe(true);
  const [replace] = await screen.findAllByRole("button", { name: /^replace page$/i });
  fireEvent.click(replace);
}

afterEach(cleanup);

describe("Templates — the backup is a History auto-version (C4 #25)", () => {
  it("defaults the backup box ON — applying replaces the page", async () => {
    /* The default itself, not just the naming. Board 1169:4713 draws it
       checked: apply REPLACES the current page, so opting out of the backup
       has to be a deliberate act. */
    const { composer } = makeComposer(["Home"]);
    render(<TemplatesTab composer={composer as never} />);
    const first = SITE_TEMPLATES[0];
    /* The sidebar row opens the same preview as the grid card (decision #24).
       Test ids, not role queries: role + accessible-name resolution over the
       whole catalogue took ~8 s and timed this test out under load. */
    fireEvent.click(await screen.findByTestId(`tpl-ws-item-${first.id}`));
    fireEvent.click(await screen.findByText("Replace page…"));
    const label = await screen.findByText(/save the current page as a backup version first/i);
    const input = (label.closest("label") ?? label).querySelector('input[type="checkbox"]') as HTMLInputElement | null;
    expect(input, "backup checkbox not found").not.toBeNull();
    expect(input!.checked).toBe(true);
  });

  it("takes a History auto-version before the apply, and makes no backup page", async () => {
    const order: string[] = [];
    const { renames, composer } = makeComposer(["Home"], order);
    render(<TemplatesTab composer={composer as never} />);
    await applyWithBackup();
    const first = SITE_TEMPLATES[0];
    await waitFor(() =>
      expect(composer.versions.autoCheckpoint).toHaveBeenCalledWith(`Before template “${first.name}”`, {
        title: `Before template “${first.name}”`,
      }),
      { timeout: 5000 },
    );
    expect(composer.elements.duplicatePage).not.toHaveBeenCalled();
    expect(renames).toHaveLength(0);
    await waitFor(() => expect(order).toContain("apply"), { timeout: 5000 });
    expect(order.indexOf(`checkpoint:Before template “${first.name}”`)).toBeLessThan(order.indexOf("apply"));
  });

  /* QA 2026-09-24: the toast said "Backup saved" whatever happened. If the
     backup was asked for and could not be written, nothing is replaced. */
  it("a backup that cannot be written stops the replace, and says so", async () => {
    const order: string[] = [];
    const { composer } = makeComposer(["Home"], order);
    composer.versions.autoCheckpoint.mockImplementationOnce(async () => null as never);
    render(<TemplatesTab composer={composer as never} />);
    await applyWithBackup();
    await waitFor(() => expect(composer.versions.autoCheckpoint).toHaveBeenCalled(), { timeout: 5000 });
    await new Promise((r) => setTimeout(r, 50));
    expect(order).not.toContain("apply");
  });

  it("says where the backup lives", async () => {
    const { composer } = makeComposer();
    render(<TemplatesTab composer={composer as never} />);
    /* Decision #24: a template's row opens the in-view preview; Replace page… is the apply. */
    fireEvent.click(await screen.findByTestId(`tpl-ws-item-${SITE_TEMPLATES[0].id}`));
    fireEvent.click(await screen.findByText("Replace page…"));
    expect(await screen.findByText("Keeps your work as a version in History › Saves.")).toBeTruthy();
  });
});
