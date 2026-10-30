/**
 * NewFolderDraft — design-2l9 board 127:36696: "New folder" asks for the
 * name first, in a card under My folders, and makes nothing until
 * "Create folder". Cancel (or Escape) leaves no folder behind.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Button, TextInput } from "@/editor/chrome-ui";

const BTN = "tw:h-8 tw:min-h-0 tw:text-[13px]";
/* 127:36696 draws the name field 28 tall (the shared field is 32). */
const FIELD_THEME = { field: { input: { sizes: { md: "tw:h-7 tw:py-0 tw:text-[13px]" } } } };

export function NewFolderDraft({ onCreate, onCancel }: { onCreate: (name: string) => void; onCancel: () => void }) {
  const [name, setName] = React.useState("");
  const ready = name.trim().length > 0;
  const create = () => {
    if (ready) onCreate(name.trim());
  };
  return (
    <div className="tw:mx-3 tw:mt-1 tw:flex tw:flex-col tw:gap-2 tw:bg-[var(--bk-gray-100)] tw:p-2" data-testid="pages-new-folder">
      <span className="tw:text-[13px] tw:leading-5 tw:font-semibold tw:text-[var(--bk-ink)]" id="pages-new-folder-title">
        New folder
      </span>
      <TextInput
        autoFocus
        theme={FIELD_THEME}
        value={name}
        placeholder="Folder name"
        aria-labelledby="pages-new-folder-title"
        data-testid="pages-new-folder-name"
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            create();
          } else if (e.key === "Escape") {
            e.preventDefault();
            onCancel();
          }
        }}
      />
      <p className="tw:m-0 tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-muted)]">
        Only you see this folder. Page URLs stay the same.
      </p>
      <div className="tw:flex tw:gap-2">
        <Button size="xs" className={`${BTN} tw:w-32`} disabled={!ready} data-testid="pages-new-folder-create" onClick={create}>
          Create folder
        </Button>
        <Button color="light" size="xs" className={`${BTN} tw:w-22`} data-testid="pages-new-folder-cancel" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
