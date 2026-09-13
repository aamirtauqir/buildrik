/**
 * VersionsModal — Clone 3695:45529 "Asset versions", with 3697:20326 (the
 * original's card selected) and 3697:20341 (v2 applied). Phase 6, section
 * 4184:26629.
 *
 * The model it draws: a saved edit is a version of the SAME asset — a row
 * flagged with its parent, hidden from the grid — and applying it to the
 * site is a separate, explicit step. So the cards say two things about each
 * version: what it is (`v2 · Latest saved · 2400 × 1600`, the edits it was
 * saved with) and where it stands on the site (`Not applied to site` /
 * `Applied to site · 3 placements`; for the original `Currently used on Home
 * and Menu · 3 placements` / `Not on site`). "Applied" is a fact about the
 * placements (`getUsages`), never a flag on the row.
 *
 * Newest first, the latest saved selected on open; clicking a card moves the
 * accent border (3697:20326). The footer always targets the latest saved
 * version: `Edit latest saved version` opens the editor on its file (its
 * save becomes the next version of the same parent), `Apply latest saved
 * version` (primary) opens the confirm — disabled once the site already
 * carries it (3697:20341's pale Apply).
 *
 * Shape from `libraryModal.ts` (title 16/600, body 13 ink-soft, 32px
 * buttons, 8 gap) at the Clone's 640.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button, ModalBody, ModalContent, ModalRoot } from "@/editor/chrome-ui";
import type { EditsSnapshot } from "@shared/types/media";
import type { LibraryItem, VersionEntry } from "../../sidebar/tabs/media/data/mediaTypes";
import { namePages } from "../../sidebar/tabs/media/data/mediaUtils";
import {
  LIBRARY_MODAL_BODY,
  LIBRARY_MODAL_BTN_PRIMARY,
  LIBRARY_MODAL_BTN_SECONDARY,
  LIBRARY_MODAL_FOOT,
  LIBRARY_MODAL_TITLE,
} from "./libraryModal";

/* A card is a button (the click selects it) drawn as the board's bordered
   panel: flowbite's `light` fill with its height, centring and weight
   replaced per property through twMerge. The accent border rides a data
   attribute so it never competes with the base border-colour utility. */
const CARD =
  `${LIBRARY_MODAL_BTN_SECONDARY} tw:h-auto tw:w-full tw:flex-col tw:items-start tw:justify-start tw:gap-1 ` +
  "tw:border tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-panel)] tw:p-3 tw:text-left tw:font-normal " +
  "tw:enabled:hover:bg-[var(--bk-bg-subtle)] tw:data-[selected=true]:border-[var(--bk-accent)]";
const CARD_HEAD = "tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:font-semibold tw:text-[var(--bk-ink)]";
const CARD_STATE = "tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink-soft)]";
const CARD_EDITS = "tw:text-[length:var(--bk-text-12)] tw:leading-4 tw:text-[var(--bk-ink-muted)]";

/**
 * The two lines a card prints from the saved snapshot (3695:45529):
 * `Crop: Free · Preset: None · Format: Original` and `Brightness: 0 ·
 * Contrast: 0 · Saturation: 0 · Blur: 0`. The Saved screen's ten-row list is
 * the editor's (P6-X `describeEdits`); this is the card's compact reading of
 * the same snapshot — main folds the two once the editor's export lands.
 */
export function versionEditLines(edits: EditsSnapshot): [string, string] {
  return [
    `Crop: ${edits.crop} · Preset: ${edits.preset} · Format: ${edits.format}`,
    `Brightness: ${edits.brightness} · Contrast: ${edits.contrast} · Saturation: ${edits.saturation} · Blur: ${edits.blur}`,
  ];
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** `v2 · Latest saved · 2400 × 1600` — the head of a card or a rail row. */
export function versionLabel(entry: VersionEntry, total: number): string {
  const kind = entry.index === 1 ? "Original" : entry.index === total ? "Latest saved" : "Saved";
  return `v${entry.index} · ${kind}`;
}

function cardHead(entry: VersionEntry, total: number): string {
  const { width, height } = entry.item;
  return width && height ? `${versionLabel(entry, total)} · ${width} × ${height}` : versionLabel(entry, total);
}

function cardState(entry: VersionEntry): string {
  const n = entry.placements;
  if (entry.index === 1) {
    if (n === 0) return "Not on site";
    const where = entry.pages.length > 0 ? namePages(entry.pages) : "the site";
    return `Currently used on ${where} · ${plural(n, "placement")}`;
  }
  return n === 0 ? "Not applied to site" : `Applied to site · ${plural(n, "placement")}`;
}

interface VersionsModalProps {
  open: boolean;
  /** `versionsOf(parent)` with each member's placements — the original first. */
  versions: VersionEntry[];
  onClose(): void;
  /** Opens the editor on the latest saved version's file. */
  onEditLatest(latest: LibraryItem): void;
  /** Opens the apply-across confirm for the latest saved version. */
  onApplyLatest(latest: LibraryItem): void;
}

export function VersionsModal({ open, versions, onClose, onEditLatest, onApplyLatest }: VersionsModalProps) {
  const parent = versions[0];
  const latest = versions[versions.length - 1];
  const newestFirst = React.useMemo(() => [...versions].reverse(), [versions]);
  /* The accent border. Reset to the latest whenever the dialog opens or the
     family changes — a reopened dialog never remembers a stale pick. */
  const [selectedKey, setSelectedKey] = React.useState<string | null>(null);
  React.useEffect(() => {
    setSelectedKey(latest?.item.key ?? null);
  }, [open, latest?.item.key]);

  if (!parent || !latest) return null;

  const hasSaved = versions.length > 1;
  const othersOnSite = versions.some((v) => v !== latest && v.placements > 0);
  const latestIsTheSite = hasSaved && latest.placements > 0 && !othersOnSite;
  const applyReason = !hasSaved
    ? "No saved version yet — Edit image and Save version to create one"
    : latestIsTheSite
      ? "The site already uses the latest saved version"
      : undefined;

  return (
    <ModalRoot open={open} onClose={onClose}>
      <ModalContent size="table" srTitle="Asset versions" data-testid="versions-modal">
        <h2 className={LIBRARY_MODAL_TITLE} data-testid="versions-title">
          Asset versions
        </h2>
        <ModalBody>
          <p className={LIBRARY_MODAL_BODY} data-testid="versions-subtitle">
            {parent.item.displayName ?? parent.item.name} · Original retained
          </p>
          <div className="tw:mt-3 tw:flex tw:max-h-[50vh] tw:flex-col tw:gap-3 tw:overflow-y-auto" data-testid="versions-list">
            {newestFirst.map((entry) => {
              const key = entry.item.key;
              const selected = key === selectedKey;
              return (
                <Button
                  key={key}
                  size="xs"
                  variant="secondary"
                  className={CARD}
                  data-selected={selected ? "true" : undefined}
                  aria-pressed={selected}
                  onClick={() => setSelectedKey(key)}
                  data-testid={`versions-card-${key}`}
                >
                  <span className={CARD_HEAD} data-testid={`versions-card-head-${key}`}>
                    {cardHead(entry, versions.length)}
                  </span>
                  <span className={CARD_STATE} data-testid={`versions-card-state-${key}`}>
                    {cardState(entry)}
                  </span>
                  {entry.index > 1 &&
                    entry.item.edits &&
                    versionEditLines(entry.item.edits).map((line, i) => (
                      <span key={line} className={CARD_EDITS} data-testid={`versions-card-edits-${key}-${i + 1}`}>
                        {line}
                      </span>
                    ))}
                </Button>
              );
            })}
          </div>
        </ModalBody>
        <div className={LIBRARY_MODAL_FOOT} data-testid="versions-foot">
          <Button size="xs" variant="secondary" className={LIBRARY_MODAL_BTN_SECONDARY} onClick={onClose} data-testid="versions-close">
            Close
          </Button>
          <Button
            size="xs"
            variant="secondary"
            className={LIBRARY_MODAL_BTN_SECONDARY}
            onClick={() => onEditLatest(latest.item)}
            data-testid="versions-edit-latest"
          >
            Edit latest saved version
          </Button>
          <Button
            size="xs"
            className={LIBRARY_MODAL_BTN_PRIMARY}
            disabled={applyReason !== undefined}
            title={applyReason}
            onClick={() => onApplyLatest(latest.item)}
            data-testid="versions-apply-latest"
          >
            Apply latest saved version
          </Button>
        </div>
      </ModalContent>
    </ModalRoot>
  );
}
