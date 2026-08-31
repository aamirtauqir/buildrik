/**
 * The backup checkbox must produce the page it names.
 *
 * The hint under it reads `Keeps your work as “Home (backup)”`, but the handler
 * called `duplicatePage`, which names its output "Home Copy" — the same name
 * the Pages menu's Duplicate produces, so a backup was indistinguishable from
 * an ordinary duplicate. Walked live: applying Portfolio over a page called
 * Home left "Home Copy" at /-copy holding the original heading.
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

function makeComposer(existingNames: string[] = ["Home"]) {
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
        importHTMLToActivePage: vi.fn(),
        recordAppliedTemplate: vi.fn(),
        /* `getChildCount` is what drives `hasExistingContent`, and that is what
           decides whether the replace confirm (and its backup checkbox) opens
           at all — an empty page applies straight away, correctly. */
        getElement: vi.fn((id: string) =>
          id === "root-1" ? { getId: () => "root-1", getChildCount: () => 1, getChildren: () => [] } : null,
        ),
      },
      styles: { clear: vi.fn() },
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
    },
  };
}

async function applyWithBackup() {
  const first = SITE_TEMPLATES[0];
  fireEvent.click(await screen.findByText(first.name));
  /* The detail pane labels it "Apply to current page (<name>)"; the fullpage
     surface labels the same action "Apply template". */
  const [applyBtn] = await screen.findAllByRole("button", { name: /^apply to current page/i });
  fireEvent.click(applyBtn);
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

describe("Templates — the backup is named what the checkbox promises", () => {
  it("defaults the backup box ON — applying replaces the page", async () => {
    /* The default itself, not just the naming. Board 1169:4713 draws it
       checked: apply REPLACES the current page, so opting out of the backup
       has to be a deliberate act. */
    const { composer } = makeComposer(["Home"]);
    render(<TemplatesTab composer={composer as never} isExpanded />);
    const first = SITE_TEMPLATES[0];
    fireEvent.click(await screen.findByText(first.name));
    const [applyBtn] = await screen.findAllByRole("button", { name: /^apply to current page/i });
    fireEvent.click(applyBtn);
    const label = await screen.findByText(/save the current page as a backup version first/i);
    const input = (label.closest("label") ?? label).querySelector('input[type="checkbox"]') as HTMLInputElement | null;
    expect(input, "backup checkbox not found").not.toBeNull();
    expect(input!.checked).toBe(true);
  });

  it('renames the duplicate to "<page> (backup)"', async () => {
    const { renames, composer } = makeComposer();
    render(<TemplatesTab composer={composer as never} isExpanded />);
    await applyWithBackup();
    await waitFor(() => expect(renames).toHaveLength(1));
    expect(renames[0]).toEqual({ id: "page-dup", name: "Home (backup)" });
  });

  it("numbers the suffix when a backup of that name already exists", async () => {
    const { renames, composer } = makeComposer(["Home", "Home (backup)"]);
    render(<TemplatesTab composer={composer as never} isExpanded />);
    await applyWithBackup();
    await waitFor(() => expect(renames).toHaveLength(1));
    expect(renames[0].name).toBe("Home (backup 2)");
  });
});
