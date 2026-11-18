/**
 * ContentRootView — the CMS drawer's root (148:2) and its empty state
 * (149:7), in the current-release shape (RL01 424:337006): Collections, then
 * Data = Site variables · Conditions · Recently deleted. Sources is hidden by
 * BD-39 (RL00 424:337803).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Braces, Database, GitBranch, Table2, Trash2 } from "lucide-react";
import {
  Button,
  EmptyState,
  EmptyStateActions,
  EmptyStateDesc,
  ListRow,
  Row,
  SectionHeader,
  ROW_ICON_CLASS,
  ROW_LABEL_CLASS,
  ROW_META_CLASS,
} from "@/editor/chrome-ui";
import type { CMSCollection } from "@/shared/types/cms";
import { SCROLL, SECTION_H } from "./ContentViews";

/** BD-39 (board RL00 424:337803): Sources is a future capability, hidden in
 *  this release. Its door goes; the view, authored sources and the
 *  conditions that read them stay, so turning this on brings it all back. */
export const SOURCES_IN_RELEASE = false;

/* ── Root (148:2) + empty (149:7) ────────────────────────────────────────── */

export function RootView({
  collections,
  recordCounts,
  sourcesCount,
  variablesCount,
  conditionsCount,
  selectedCollectionId,
  variablesOpen = false,
  conditionsOpen = false,
  onOpenCollection,
  onCreateCollection,
  onOpenSources,
  onOpenVariables,
  onOpenConditions,
}: {
  collections: CMSCollection[];
  recordCounts: Record<string, number>;
  sourcesCount: number;
  variablesCount: number;
  conditionsCount: number;
  selectedCollectionId?: string | null;
  /** The workspace shows the Site variables page (B5-V01) — its row is marked. */
  variablesOpen?: boolean;
  /** The workspace shows the Conditions page (176:21830) — its row is marked. */
  conditionsOpen?: boolean;
  onOpenCollection: (id: string) => void;
  onCreateCollection?: () => void;
  onOpenSources: () => void;
  onOpenVariables: () => void;
  onOpenConditions: () => void;
}) {
  const shownSources = SOURCES_IN_RELEASE ? sourcesCount : 0;
  if (collections.length === 0 && shownSources === 0 && variablesCount === 0 && conditionsCount === 0) {
    return (
      /*
        Board 149:7 draws this block composed, not with the default slots:
        the copy is 13/20 over 272, and the call to action is ACCENT TEXT.
        EmptyState's shared body class is 12px and its `action` slot takes a
        filled Button, so the defaults gave a 12px line under a solid blue
        CTA. The Button doc on the same page is explicit — primary is the ONE
        filled accent button per screen — and an empty panel inviting you in
        is not where that one gets spent. Media's empty state (145:406) draws
        its two calls to action the same way.
      */
      <EmptyState
        /* 149:46 — a 160-tall block at the TOP of the panel, not a column that
           fills it. `flex-1` centred the two lines in whatever height the
           drawer had (~768 live), which put the invitation halfway down an
           otherwise blank panel and ~300px below where the board draws it. */
        className="tw:h-40"
        data-testid="content-empty"
      >
        <EmptyStateDesc className="tw:max-w-[272px] tw:text-[13px] tw:leading-5" data-testid="content-empty-desc">
          {/* One source literal, deliberately: gate:copy greps src/ for the exact
              string from the design doc, so wrapping it across two JSX lines
              reads to that gate as the line having been deleted. */}
          Collections turn a spreadsheet into pages — one page per row, updated when the data changes.
        </EmptyStateDesc>
        {/* A-17/A09-8: the zero state offered only Create a collection — the
            Sources/Variables/Conditions doors this tab also owns had no way
            in until the user first created a collection. All three routes
            are wired regardless of collection count. */}
        <EmptyStateActions>
          {onCreateCollection ? (
            <Button
              color="light"
              size="xs"
              variant="link" className="tw:min-h-6 tw:font-normal"
              data-testid="content-empty-cta"
              onClick={onCreateCollection}
            >
              Create a collection
            </Button>
          ) : null}
          {SOURCES_IN_RELEASE ? (
            <Button
              color="light"
              size="xs"
              variant="link" className="tw:min-h-6 tw:font-normal"
              data-testid="content-empty-sources"
              onClick={onOpenSources}
            >
              Open Sources
            </Button>
          ) : null}
          <Button
            color="light"
            size="xs"
            variant="link" className="tw:min-h-6 tw:font-normal"
            data-testid="content-empty-variables"
            onClick={onOpenVariables}
          >
            Open Site variables
          </Button>
          <Button
            color="light"
            size="xs"
            variant="link" className="tw:min-h-6 tw:font-normal"
            data-testid="content-empty-conditions"
            onClick={onOpenConditions}
          >
            Open Conditions
          </Button>
        </EmptyStateActions>
      </EmptyState>
    );
  }
  return (
    <div className={SCROLL}>
      {/* Board 148:2 — the group header is 32-tall with a tint wash, not the
          shared List section's plain 28. The arbitrary bracket sorts after
          the named `h-7` scale utility in the compiled sheet and so wins
          regardless of class order (same trick as AssetDetailOverlay's alt
          input) rather than trusting an equal-specificity `h-8` to win. */}
      <SectionHeader tint className={SECTION_H} count={collections.length} data-testid="content-section-collections">Collections</SectionHeader>
      {collections.map((c) => (
        <ListRow
          key={c.id}
          icon={<Table2 size={16} />}
          label={c.name}
          count={recordCounts[c.id] ?? "—"}
          chevron
          selected={c.id === selectedCollectionId}
          aria-current={c.id === selectedCollectionId ? "true" : undefined}
          data-testid={`content-collection-${c.id}`}
          onClick={() => onOpenCollection(c.id)}
        />
      ))}
      {/* Board 148:20 — a bare row, not a button: "+" sits in the icon column
          (12/400 ink-muted) and "New collection" is the 13/400 accent-text
          label, flush with every List row above it. The old small inset
          Button (mx-4, its own 48h before this fix) never matched that. */}
      {onCreateCollection && (
        <Row interactive onClick={onCreateCollection} data-testid="content-new-collection" aria-label="New collection">
          <span className={`${ROW_ICON_CLASS} tw:text-[length:var(--bk-text-12)] tw:leading-[18px]`} aria-hidden="true" data-testid="content-new-collection-plus">
            +
          </span>
          <span className={`${ROW_LABEL_CLASS} tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-accent-text)]`} data-testid="content-new-collection-label">
            New collection
          </span>
        </Row>
      )}
      <SectionHeader tint className={SECTION_H} data-testid="content-section-data">Data</SectionHeader>
      {/* RL01 (424:337006) — Data is Site variables · Conditions · Recently
          deleted; Sources is hidden by BD-39. */}
      {SOURCES_IN_RELEASE ? (
        <ListRow icon={<Database size={16} />} label="Sources" count={sourcesCount} chevron data-testid="content-open-sources" onClick={onOpenSources} />
      ) : null}
      <ListRow icon={<Braces size={16} />} label="Site variables" count={variablesCount} chevron selected={variablesOpen} aria-current={variablesOpen ? "true" : undefined} data-testid="content-open-variables" onClick={onOpenVariables} />
      <ListRow icon={<GitBranch size={16} />} label="Conditions" count={conditionsCount} chevron selected={conditionsOpen} aria-current={conditionsOpen ? "true" : undefined} data-testid="content-open-conditions" onClick={onOpenConditions} />
      {/* Restoring deleted collections, fields and records needs the server
          to list and undelete them; until that ships the row says Planned
          rather than opening a list with nothing it can do. */}
      <Row disabled aria-disabled="true" data-testid="content-recently-deleted">
        <span className={ROW_ICON_CLASS}>
          <Trash2 size={16} />
        </span>
        <span className={`${ROW_LABEL_CLASS} tw:leading-5 tw:text-[var(--bk-ink-muted)]`}>Recently deleted</span>
        <span className={`${ROW_META_CLASS} tw:leading-4`}>Planned</span>
      </Row>
    </div>
  );
}
