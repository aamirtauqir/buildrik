/**
 * CMSRecordsModal — the edit form surfaces a validation failure.
 *
 * `updateContentItem` validates a PUBLISHED record against its collection's own
 * rules and throws `CMSValidationError` (CollectionManager.ts:305). Its
 * docstring says the error is "caught by the two record editors" — `setStatus`
 * caught it and `save` did not, so blanking a required field on a published
 * record threw past a `try/finally` with no `catch`: the form stayed open, the
 * user was told nothing, and the edit was gone.
 */
import { describe, it, expect, vi } from "vitest";
import { render, fireEvent, screen } from "@testing-library/react";
import { CMSRecordsModal } from "../CMSRecordsModal";
import { CMSValidationError } from "../../../../engine/cms/CollectionManager";
import type { CMSCollection, CMSContentItem } from "../../../../shared/types/cms";

const collection: CMSCollection = {
  id: "col-1",
  name: "Blog",
  slug: "blog",
  fields: [
    { id: "f1", name: "Title", slug: "title", type: "text", order: 0, validation: { required: true } },
  ],
  displayField: "title",
  pageSlugPattern: "/blog/{slug}",
  createdAt: "",
  updatedAt: "",
};

const item: CMSContentItem = {
  id: "r1",
  collectionId: "col-1",
  data: { title: "Hello" },
  status: "published",
  createdAt: "",
  updatedAt: "",
};

function makeComposer(updateContentItem: ReturnType<typeof vi.fn>) {
  return {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    cms: {
      collections: {
        getAllCollections: vi.fn().mockReturnValue([collection]),
        getContentItems: vi.fn().mockResolvedValue([item]),
        createContentItem: vi.fn().mockResolvedValue(undefined),
        updateContentItem,
        deleteContentItem: vi.fn().mockResolvedValue(undefined),
      },
    },
  } as never;
}

describe("CMSRecordsModal — save error", () => {
  it("shows the validation message instead of losing the edit", async () => {
    const updateContentItem = vi
      .fn()
      .mockRejectedValue(new CMSValidationError({ title: "Title is required" }));
    render(
      <CMSRecordsModal isOpen composer={makeComposer(updateContentItem)} onClose={vi.fn()} />,
    );

    fireEvent.click(await screen.findByRole("button", { name: /edit record/i }));
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/can't save/i);
    expect(alert).toHaveTextContent(/title is required/i);

    /* The form must stay open on the failed value so the user can correct it —
       closing it here is what made the loss silent. */
    expect(screen.getByRole("button", { name: /^save$/i })).toBeInTheDocument();
  });

  /* The `else throw e` branch is deliberately NOT covered here. `save` is
     fire-and-forget from onClick, so a rethrow becomes an unhandled rejection,
     and vitest 4 reports that as a suite-level Error even when the assertions
     pass — noise that outlives this file. The branch mirrors `setStatus`
     exactly; it is reviewed, not asserted. */
});
