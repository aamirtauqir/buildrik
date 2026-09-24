/**
 * Saves filter — "Filter ▾" over the Saves list (board 4418:165744's filter
 * row) opening the filter popover (7291:81049: All · Named · Auto-saves ·
 * Author: anyone ▾), whose author row turns the popover into the author list
 * (6930:79873: Everyone · <names>). G1-075; also closes G2-170.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Button, Menu, MenuItem, Popover } from "@/editor/chrome-ui";
import type { NamedVersion } from "@/shared/types/versions";

export type SavesKind = "all" | "named" | "auto";
export interface SavesFilterValue {
  kind: SavesKind;
  /** A version's `userId`, or null for everyone. */
  author: string | null;
}
export const ALL_SAVES: SavesFilterValue = { kind: "all", author: null };

/** "You" for the signed-in user; else the server's name for the author. */
export function authorLabel(v: NamedVersion, currentUserId: string | null): string | null {
  if (!v.userId) return null;
  if (currentUserId && v.userId === currentUserId) return "You";
  return v.authorName ?? "Unknown author";
}

export function applySavesFilter(versions: NamedVersion[], f: SavesFilterValue): NamedVersion[] {
  return versions.filter(
    (v) =>
      (f.kind === "all" || (f.kind === "auto") === v.isAutoCheckpoint) &&
      (f.author === null || v.userId === f.author),
  );
}

const KIND_LABEL: Record<SavesKind, string> = { all: "All", named: "Named", auto: "Auto-saves" };

const ROW = "tw:flex tw:h-[30px] tw:flex-none tw:items-center tw:justify-end tw:pl-4 tw:pr-3 tw:py-0.5";
const CHIP =
  "tw:h-6 tw:min-h-0 tw:rounded tw:border tw:border-[var(--bk-border)] tw:bg-transparent tw:px-2 tw:py-0 " +
  "tw:text-[12px] tw:font-normal tw:text-[var(--bk-ink)] tw:focus:ring-0 tw:focus-visible:shadow-[var(--bk-shadow-focus)]";
/* 30-tall rows, 10 inset, 13/20 — the board's menu rows; the ✓ trails. */
const ITEM = "tw:h-[30px] tw:px-2.5";

export const SavesFilter: React.FC<{
  versions: NamedVersion[];
  currentUserId: string | null;
  value: SavesFilterValue;
  onChange: (next: SavesFilterValue) => void;
}> = ({ versions, currentUserId, value, onChange }) => {
  const [open, setOpen] = React.useState(false);
  const [authors, setAuthors] = React.useState(false);

  const authorOptions = React.useMemo(() => {
    const seen = new Map<string, string>();
    for (const v of versions) {
      const label = authorLabel(v, currentUserId);
      if (v.userId && label && !seen.has(v.userId)) seen.set(v.userId, label);
    }
    return [...seen];
  }, [versions, currentUserId]);

  const authorName = value.author ? authorOptions.find(([id]) => id === value.author)?.[1] ?? "Unknown author" : "anyone";
  const active = value.kind !== "all" || value.author !== null;
  const chipText = active
    ? `${[value.kind !== "all" ? KIND_LABEL[value.kind] : null, value.author ? authorName : null].filter(Boolean).join(" · ")} ▾`
    : "Filter ▾";

  const close = () => {
    setOpen(false);
    setAuthors(false);
  };
  const tick = (on: boolean) => (on ? "✓" : undefined);

  return (
    <div className={ROW} data-testid="saves-filter-row">
      <Popover
        open={open}
        onClose={close}
        placement="bottom-end"
        label="Filter saves"
        trigger={
          <Button
            type="button"
            color="light"
            size="xs"
            className={CHIP}
            aria-haspopup="menu"
            aria-expanded={open}
            onClick={() => (open ? close() : setOpen(true))}
            data-testid="saves-filter"
          >
            {chipText}
          </Button>
        }
      >
        {authors ? (
          <Menu label="Author" className="tw:w-[200px]">
            <MenuItem className={ITEM} kbd={tick(value.author === null)} onClick={() => { onChange({ ...value, author: null }); close(); }}>
              Everyone
            </MenuItem>
            {authorOptions.map(([id, label]) => (
              <MenuItem key={id} className={ITEM} kbd={tick(value.author === id)} onClick={() => { onChange({ ...value, author: id }); close(); }}>
                {label}
              </MenuItem>
            ))}
          </Menu>
        ) : (
          <Menu label="Filter saves" className="tw:w-[200px]">
            {(["all", "named", "auto"] as const).map((k) => (
              <MenuItem key={k} className={ITEM} kbd={tick(value.kind === k)} onClick={() => { onChange({ ...value, kind: k }); close(); }}>
                {KIND_LABEL[k]}
              </MenuItem>
            ))}
            <MenuItem className={ITEM} onClick={() => setAuthors(true)} data-testid="saves-filter-author">
              Author: {authorName} ▾
            </MenuItem>
          </Menu>
        )}
      </Popover>
    </div>
  );
};
