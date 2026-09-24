/**
 * PickModePanel — the Assets drawer while it is choosing a file for
 * something. Boards 6764:59051 (idle) and 6881:91481 (a card chosen).
 *
 * Audit G3-008: picking is two steps — a click CHOOSES a card (accent edge,
 * check in its corner), and only `Use selected image` hands it over. The bar
 * this replaced ("Selecting image for: …") applied on the first click, so a
 * mis-click replaced the element's image.
 *
 * Audit G3-061: this is the one image picker. The inspector's Choose image,
 * a background image, a CMS image field and a page's share image all land
 * here (`requestAssetPick`); `↑ Upload` and `From URL` open the "Upload an
 * image" modal, whose `Use selected image` finishes the same pick.
 *
 * A pick opened from ⌘K "Replace selected media" starts with the element's
 * name as a search; the search shows under Filter and clears in one click.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { ChevronDown, Upload, X } from "lucide-react";
import { Button, PanelFrame, TextField } from "@/editor/chrome-ui";
import type { Composer } from "@/engine/Composer";
import type { MediaAssetType } from "@shared/types/media";
import { kindLabel, kindNoun } from "@shared/constants/media";
import { UploadAssetModal, type UploadPane } from "@/editor/media/UploadAssetModal";
import type { AssetPickRequest } from "../data/assetPick";
import type { LibraryItem } from "../data/mediaTypes";
import { assetTypeToFilter } from "../data/mediaUtils";
import { AssetCell } from "./AssetCell";

interface PickModePanelProps {
  composer: Composer;
  request: AssetPickRequest;
  items: LibraryItem[];
  usageMap: Map<string, number>;
  searchQuery: string;
  onSearchChange(q: string): void;
  /** `Use selected image` — the chosen library key. */
  onUse(key: string): void;
  onCancel(): void;
}

const PICKABLE_ELEMENTS: ReadonlySet<MediaAssetType> = new Set(["image", "video", "icon", "svg"]);

/** What the field takes: its own list, else the element's kind, else image. */
function kindsFor(composer: Composer, request: AssetPickRequest): MediaAssetType[] {
  if (request.allowedTypes?.length) return request.allowedTypes;
  const type = request.elementId ? composer.elements.getElement(request.elementId)?.getType() : undefined;
  return type && PICKABLE_ELEMENTS.has(type as MediaAssetType) ? [type as MediaAssetType] : ["image"];
}

export function PickModePanel({
  composer,
  request,
  items,
  usageMap,
  searchQuery,
  onSearchChange,
  onUse,
  onCancel,
}: PickModePanelProps) {
  const kinds = React.useMemo(() => kindsFor(composer, request), [composer, request]);
  const kind = kindLabel(kinds);
  const noun = kinds.length === 1 ? kindNoun(kinds[0]) : "file";
  const [picked, setPicked] = React.useState<string | null>(null);
  const [filterOpen, setFilterOpen] = React.useState(searchQuery.trim() !== "");
  const [upload, setUpload] = React.useState<UploadPane | null>(null);

  // A new request is a new choice — the last field's card is not this one's.
  React.useEffect(() => setPicked(null), [request]);
  React.useEffect(() => {
    if (searchQuery.trim()) setFilterOpen(true);
  }, [searchQuery]);

  const buckets = React.useMemo(() => new Set(kinds.map(assetTypeToFilter)), [kinds]);
  const shown = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter(
      (i) => buckets.has(i.type) && !i.versionOf && (!q || (i.displayName ?? i.name).toLowerCase().includes(q)),
    );
  }, [items, buckets, searchQuery]);

  // A label that only repeats the kind ("image") adds nothing to "· Image".
  const label = request.label && request.label.toLowerCase() !== noun.toLowerCase() ? request.label : null;

  return (
    <PanelFrame className="tw:h-full tw:border tw:border-[var(--bk-gray-100)]" data-testid="media-pick-panel">
      <PanelFrame.Header title={`Choose ${noun}`} onClose={onCancel} closeLabel="Cancel choosing" />
      <p
        className="tw:m-0 tw:h-7 tw:px-4 tw:text-[length:var(--bk-text-12)] tw:leading-[18px] tw:text-[var(--bk-gray-500)]"
        data-testid="media-pick-for"
      >
        {/* A hosted pick's label already names its field ("Margherita · Photo",
            6765:59890), so the kind would only repeat it. */}
        {label ? (request.host ? `For ${label}` : `For ${label} · ${kind}`) : kind}
      </p>

      <div className="tw:flex tw:flex-col tw:gap-2 tw:px-4 tw:py-2">
        <Button
          type="button"
          size="xs"
          color="light"
          aria-expanded={filterOpen}
          className="tw:h-7 tw:self-start tw:rounded-sm tw:border-[var(--bk-border)] tw:px-2 tw:text-[length:var(--bk-text-12)] tw:font-medium tw:text-[var(--bk-ink)]"
          data-testid="media-pick-filter"
          onClick={() => setFilterOpen((o) => !o)}
        >
          Filter
          <ChevronDown size={14} aria-hidden="true" />
        </Button>
        {filterOpen ? (
          <div className="tw:flex tw:items-center tw:gap-1">
            <TextField
              type="text"
              className="tw:h-7 tw:w-full tw:text-[length:var(--bk-text-12)]"
              placeholder={`Search ${noun}s`}
              aria-label={`Search ${noun}s`}
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
              data-testid="media-pick-search"
            />
            {searchQuery ? (
              <Button
                type="button"
                size="xs"
                variant="ghost"
                className="tw:size-7 tw:shrink-0 tw:p-0"
                aria-label="Clear search"
                data-testid="media-pick-search-clear"
                onClick={() => onSearchChange("")}
              >
                <X size={14} aria-hidden="true" />
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      <PanelFrame.Body className="tw:min-h-0 tw:flex-1 tw:overflow-y-auto">
        {shown.length === 0 ? (
          <p
            className="tw:m-0 tw:px-4 tw:py-6 tw:text-center tw:text-[length:var(--bk-text-12)] tw:leading-4 tw:text-[var(--bk-ink-soft)]"
            data-testid="media-pick-empty"
          >
            {searchQuery.trim()
              ? `Nothing matches "${searchQuery.trim()}".`
              : `No ${noun}s in your library yet. Upload one or add it from a URL.`}
          </p>
        ) : (
          <div
            className="tw:grid tw:grid-cols-2 tw:gap-4 tw:px-4 tw:pt-3 tw:pb-1"
            role="listbox"
            aria-label={`Choose ${noun}`}
            data-testid="media-pick-grid"
          >
            {shown.map((item) => (
              <AssetCell
                key={item.key}
                item={item}
                usageCount={usageMap.get(item.key) ?? 0}
                picked={picked === item.key}
                onClick={setPicked}
              />
            ))}
          </div>
        )}
      </PanelFrame.Body>

      {/* Board 6764:59051: 12 over the links, 12 between, and the drawer's
          32 bottom band under a 16 inset — the same foot line as the drawer's
          Upload row. Buttons stay 32 (density decision), not the board's 40. */}
      <div className="tw:flex tw:flex-col tw:gap-3 tw:border-t tw:border-[var(--bk-border)] tw:px-4 tw:pt-3 tw:pb-12" data-testid="media-pick-foot">
        <div className="tw:flex tw:items-center tw:gap-4">
          <Button
            type="button"
            size="xs"
            variant="link"
            className="tw:h-5 tw:gap-1 tw:p-0 tw:text-[length:var(--bk-text-13)] tw:font-medium"
            data-testid="media-pick-upload"
            onClick={() => setUpload("upload")}
          >
            <Upload size={12} aria-hidden="true" />
            Upload
          </Button>
          <Button
            type="button"
            size="xs"
            variant="link"
            className="tw:h-5 tw:p-0 tw:text-[length:var(--bk-text-13)] tw:font-medium"
            data-testid="media-pick-url"
            onClick={() => setUpload("url")}
          >
            From URL
          </Button>
        </div>
        <div className="tw:flex tw:items-center tw:gap-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="tw:h-8 tw:w-21 tw:shrink-0 tw:text-[length:var(--bk-text-13)] tw:font-medium tw:text-[var(--bk-ink)]"
            data-testid="media-pick-cancel"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            className="tw:h-8 tw:flex-1 tw:whitespace-nowrap tw:text-[length:var(--bk-text-13)] tw:font-medium"
            disabled={!picked}
            data-testid="media-pick-use"
            onClick={() => picked && onUse(picked)}
          >
            Use selected {noun}
          </Button>
        </div>
      </div>

      <UploadAssetModal
        open={upload !== null}
        pane={upload ?? "upload"}
        onClose={() => setUpload(null)}
        onUse={(asset) => onUse(asset.id)}
        allowedTypes={kinds}
        forLabel={label ?? undefined}
        composer={composer}
      />
    </PanelFrame>
  );
}
