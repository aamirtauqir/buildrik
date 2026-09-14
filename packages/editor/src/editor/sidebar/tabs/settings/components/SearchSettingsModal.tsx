/**
 * SearchSettingsModal — Clone 3737:46109 "Search settings" (640).
 *
 * Opened from the Overview's `Search settings` field (edge `Search settings|
 * CLIC|OVE>3737:46109`). `Search settings` · `<site> · <n> results for "<q>"`
 * (an empty query: `<site> · all sections`) · a `Search` field with a clear
 * ✕ · one row per hit — title / description / GROUP at the right — · foot
 * `<n> results` · `Clear search` · `Cancel`. The rows come from
 * `searchIndex.ts`, a static registry of every section and field, matched
 * as you type; an empty query lists the sections. A row hands the shell
 * `onOpen(screen, fieldId?)` and closes.
 *
 * Rows are 32 high at the founder's density (title 13/16 over description
 * 12/16) — the frame's taller rows are refused, as every S1 control's are.
 * Shape from `libraryModal.ts` (title 16/600, body 13 ink-soft, 32-high
 * buttons, 8 gap) at the Clone's 640.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { X } from "lucide-react";
import {
  BK_LABEL_CLASS,
  Button,
  type CustomFlowbiteTheme,
  IconButton,
  Label,
  ModalBody,
  ModalContent,
  ModalRoot,
  TextInput,
} from "@/editor/chrome-ui";
import {
  LIBRARY_MODAL_BODY,
  LIBRARY_MODAL_BTN_SECONDARY,
  LIBRARY_MODAL_FOOT,
  LIBRARY_MODAL_TITLE,
} from "@/editor/media/components/libraryModal";
import { searchSettings, type SettingsSearchScreen } from "../searchIndex";

export interface SearchSettingsModalProps {
  open: boolean;
  siteName: string;
  /** Cancel, Escape, the scrim — and after a row has been chosen. */
  onClose(): void;
  /** A row: the screen to open and, for a field, the control to scroll into view. */
  onOpen(screen: SettingsSearchScreen, fieldId?: string): void;
}

/* The ✕ sits inside the field's box, so the text needs room to its right.
   `withRightIcon.off` is the slot the input's padding is merged from after
   its size — the one place a `pr-*` reliably wins (`textInputTheme.ts`). */
const SEARCH_INPUT_THEME: NonNullable<CustomFlowbiteTheme["textInput"]> = {
  field: { input: { withRightIcon: { off: "tw:pr-8" } } },
};

const LIST =
  "tw:m-0 tw:mt-3 tw:max-h-[40vh] tw:list-none tw:overflow-y-auto tw:rounded-[var(--bk-radius-md)] " +
  "tw:border tw:border-[var(--bk-border)] tw:p-0 tw:divide-y tw:divide-[var(--bk-border)]";
/* A 32-high ghost row: the frame's title over description, the group at the
   right. The focus ring goes inset so the list's overflow cannot clip it. */
const ROW =
  "tw:h-8 tw:w-full tw:justify-between tw:gap-3 tw:rounded-none tw:border-0 tw:px-3 tw:py-0 tw:text-left " +
  "tw:focus:[box-shadow:inset_var(--bk-shadow-focus)]";
const ROW_TITLE =
  "tw:max-w-full tw:truncate tw:text-[length:var(--bk-text-13)] tw:leading-4 tw:font-medium tw:text-[var(--bk-ink)]";
const ROW_DESC =
  "tw:max-w-full tw:truncate tw:text-[length:var(--bk-text-12)] tw:leading-4 tw:font-normal tw:text-[var(--bk-ink-muted)]";
const ROW_GROUP =
  "tw:shrink-0 tw:text-[length:var(--bk-text-11)] tw:leading-4 tw:font-medium tw:uppercase " +
  "tw:tracking-[var(--bk-tracking-wide)] tw:text-[var(--bk-ink-muted)]";
const COUNT = "tw:text-[length:var(--bk-text-12)] tw:leading-4 tw:text-[var(--bk-ink-muted)]";

const results = (n: number) => `${n} result${n === 1 ? "" : "s"}`;

export function SearchSettingsModal({ open, siteName, onClose, onOpen }: SearchSettingsModalProps) {
  const [query, setQuery] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  /* A reopened dialog starts clean — a stale query is never what the next
     door meant. */
  React.useEffect(() => {
    if (open) setQuery("");
  }, [open]);

  const q = query.trim();
  const hits = searchSettings(q);
  const n = hits.length;
  const scope = q ? `${results(n)} for "${q}"` : "all sections";

  const clear = () => {
    setQuery("");
    inputRef.current?.focus();
  };

  return (
    <ModalRoot open={open} onClose={onClose}>
      <ModalContent size="table" srTitle="Search settings" data-testid="set-search">
        <h2 className={LIBRARY_MODAL_TITLE} data-testid="set-search-title">
          Search settings
        </h2>
        <ModalBody>
          <p className={LIBRARY_MODAL_BODY} data-testid="set-search-scope">
            {siteName ? `${siteName} · ` : ""}
            {scope}
          </p>
          <Label htmlFor="set-search-input" className={`${BK_LABEL_CLASS} tw:mt-3 tw:block`}>
            Search
          </Label>
          <div className="tw:relative tw:mt-1">
            <TextInput
              ref={inputRef}
              id="set-search-input"
              type="search"
              value={query}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
              autoFocus
              theme={SEARCH_INPUT_THEME}
              data-testid="set-search-input"
            />
            {query ? (
              <IconButton
                size="sm"
                label="Clear search"
                className="tw:absolute tw:top-1 tw:right-1"
                onClick={clear}
                data-testid="set-search-clear-x"
              >
                <X size={14} aria-hidden="true" />
              </IconButton>
            ) : null}
          </div>
          {n === 0 ? (
            <p className={`${LIBRARY_MODAL_BODY} tw:mt-3`} data-testid="set-search-empty">
              No settings match &quot;{q}&quot;.
            </p>
          ) : (
            <ul className={LIST} data-testid="set-search-list">
              {hits.map((hit, i) => (
                <li key={hit.id}>
                  <Button
                    size="xs"
                    variant="ghost"
                    className={ROW}
                    onClick={() => {
                      onOpen(hit.screen, hit.fieldId);
                      onClose();
                    }}
                    data-testid={`set-search-row-${i}`}
                  >
                    <span className="tw:flex tw:min-w-0 tw:flex-col tw:items-start">
                      <span className={ROW_TITLE}>{hit.title}</span>
                      <span className={ROW_DESC}>{hit.description}</span>
                    </span>
                    <span className={ROW_GROUP}>{hit.group}</span>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </ModalBody>
        <div className={`${LIBRARY_MODAL_FOOT} tw:justify-between`} data-testid="set-search-foot">
          <span className={COUNT} data-testid="set-search-count">
            {q ? results(n) : `${n} sections`}
          </span>
          <div className="tw:flex tw:items-center tw:gap-2">
            <Button
              size="xs"
              variant="secondary"
              className={LIBRARY_MODAL_BTN_SECONDARY}
              disabled={!query}
              onClick={clear}
              data-testid="set-search-clear"
            >
              Clear search
            </Button>
            <Button
              size="xs"
              variant="secondary"
              className={LIBRARY_MODAL_BTN_SECONDARY}
              onClick={onClose}
              data-testid="set-search-cancel"
            >
              Cancel
            </Button>
          </div>
        </div>
      </ModalContent>
    </ModalRoot>
  );
}
