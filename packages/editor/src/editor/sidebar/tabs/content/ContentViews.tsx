/**
 * ContentViews — the drill-in views of the Content panel, matched to the
 * Figma boards: root 148:2, empty 149:7, collection 149:50, record 149:84,
 * unsaved-record 149:108, fields 151:2, sources 151:46, variables 151:62,
 * conditions 151:87. Pure presentation + callbacks; state lives in
 * useContentPanel.
 *
 * Every list line here is a chrome-ui row (ListRow / RecordRow / Row), not a
 * local rebuild of one. The panel used to carry a 24-key style object that
 * reimplemented exactly those three.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Braces, Database, GitBranch, Table2 } from "lucide-react";
import {
  ConfirmDialog,
  Button,
  EmptyState,
  EmptyStateActions,
  EmptyStateDesc,
  IconButton,
  Popover,
  Menu,
  MenuItem,
  ListRow,
  Row,
  SectionHeader,
  ROW_ICON_CLASS,
  ROW_LABEL_CLASS,
  Select,
  TextInput,
} from "@/editor/chrome-ui";
import type { CMSCollection, CMSContentItem, CMSField } from "@/shared/types/cms";
import type { ConditionExpression, ConditionOperator, DataSource } from "@/shared/types/data";
import type { SiteVariable } from "@/shared/types/project";
import { conditionSummary, isValidVariableKey } from "./contentPanelUtils";
import type { ConditionRow } from "./useContentPanel";
import { ConnectSourceDialog, RenameDialog, ResyncJsonDialog } from "./DataRowDialogs";

/** The panel column. Exported because ContentTab wraps these views in it. */
export const CONTENT_BODY = "tw:flex tw:flex-col tw:h-full tw:min-h-0";
/** Board 148:2 — the Content group header is 32-tall, not the shared List
 *  section's 28. The arbitrary bracket sorts after the named `h-7` scale
 *  utility in the compiled sheet and so wins regardless of class order (same
 *  trick as AssetDetailOverlay's alt input) rather than trusting an
 *  equal-specificity `h-8` to win. Exported because the loading skeleton draws
 *  the same two bands and has to draw them at the same height.
 *
 *  `leading-4` for the same reason: 776:4095 draws the band's label at 11/16
 *  and the shared SectionHeader sets no line-height at all, so the band's text
 *  resolved off the face's own metrics. Content-only — nothing else imports
 *  this constant, so the shared primitive keeps whatever its own boards say. */
export const SECTION_H = "tw:h-[var(--bk-size-row)] tw:leading-4";

const SCROLL = "tw:flex-1 tw:min-h-0 tw:overflow-y-auto";
/** A text button that reads as a link: breadcrumbs and every "+ New …".
 *
 *  `border-0` is the one that matters, and it is NOT interchangeable with
 *  `border-transparent`: that sets only a colour, so the browser's own
 *  `2px outset` button border survives and the control grows 4px in both
 *  axes. The parity harness caught exactly that. With the width at 0 the
 *  colour is unobservable, so no `border-transparent` here. */
/* `tw:p-0` leaves the height entirely to the line-box, which rendered every
   link-action ("+ Add", "+ Add field", "+ New collection") and every breadcrumb
   at 16px tall — under WCAG 2.5.8's 24x24 target minimum. `min-h-6` is 24
   exactly; `items-center` already centres the label, so the glyph does not
   move, only the hit area grows. */
/* `tw:h-8`, not just `tw:min-h-6`. flowbite's Button ships `tw:h-10`, and
   `min-h-*` does not conflict with `h-*` so the 40px stood — these rows
   measured 40 against boards that draw 32-36. An `h-*` DOES conflict, so
   twMerge drops flowbite's. */
const LINK_BTN =
  "tw:inline-flex tw:items-center tw:gap-1.5 tw:bg-transparent tw:border-0 tw:p-0 tw:h-8 tw:min-h-0 " +
  /* ui/13 · row label is 13/20 wherever a board draws it (149:114 the back
     crumb, and every "+ New …" beside it); the line-height was left to the
     browser, which resolves `normal` off the face's own metrics. */
  "tw:text-[13px] tw:leading-5 tw:font-normal tw:text-[var(--bk-accent-text)] tw:hover:text-[var(--bk-accent-hover)] tw:enabled:hover:bg-transparent";
/** The quiet row-action button, previously copy-pasted at eleven call sites. */
const GHOST = "tw:border-transparent tw:bg-transparent tw:text-[var(--bk-ink-soft)] tw:hover:text-[var(--bk-ink)]";
/** A note that belongs to the row above it, not to the panel's foot.
 *  151:61 — 11/16 on the panel's 16px gutters with 8 above and 8 below
 *  (151:60's frame is the text's own box plus those two insets). It was
 *  `leading-normal` (16.5 at this size) with no top inset and 12 below, so the
 *  note sat tight under the link it explains and its two lines drifted half a
 *  pixel per line off every other 11px line in the panel. */
const INLINE_HINT = "tw:text-[11px] tw:text-[var(--bk-ink-muted)] tw:leading-4 tw:px-4 tw:py-2";
/* 151:70 — the {{site.*}} key is 12/16, and `text-xs` carries Tailwind's own
   16… which is right here, but only by accident: state it. */
const MONO = "tw:[font-family:var(--bk-font-mono)] tw:text-xs tw:leading-4 tw:text-[var(--bk-accent-text)]";
/* Boards 303:2067 and 303:2083 both draw the Sources status as the file's own
   Badge (12:16): a bordered pill, 10/2 padding, 12/16 medium. The two states
   differ only in ramp — grey for "nothing connected", green for "watching".
   Live drew the first as a plain 11px sentence and the second as a borderless
   green wash in --bk-success (`var(--bk-green-500)`), which is the DOT's colour, not the
   label's: on green-100 the board uses green-700. */
const STATUS_PILL =
  "tw:inline-flex tw:items-center tw:rounded-full tw:border tw:border-solid " +
  "tw:px-2.5 tw:py-0.5 tw:text-[12px] tw:leading-4 tw:font-medium";
const STATUS_PILL_OK = "tw:bg-[var(--bk-green-100)] tw:border-[var(--bk-green-500)] tw:text-[var(--bk-green-700)]";
const STATUS_PILL_IDLE = "tw:bg-[var(--bk-gray-200)] tw:border-[var(--bk-gray-400)] tw:text-[var(--bk-gray-700)]";
/* The second line of every two-line row: 151:11 the field's type, 151:56 a
   source's status, 151:71 a variable's value, 151:96 a condition's summary —
   all four boards draw it 11/16, and the line-height was left to the face. */
const SUB = "tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)]";
const INLINE_FORM = "tw:flex tw:flex-col tw:gap-2 tw:p-3 tw:border-b tw:border-[var(--bk-gray-200)]";
const FORM_ROW = "tw:flex tw:gap-2 tw:items-center";
const SPACER = "tw:flex-1";
/** Two stacked lines inside a row (name over type, key over value). */
const ROW_STACK = "tw:flex tw:flex-col tw:gap-0.5 tw:min-w-0 tw:flex-1";
/** …and its FIRST line: 13/20 wherever a board draws one (151:10 a field name,
 *  151:54 a source name, 151:95 a condition's element). `Row` supplies the 13
 *  and nothing supplied the 20. */
const ROW_TITLE = "tw:leading-5";
const ROW_ACTIONS = "tw:ml-auto tw:inline-flex tw:items-center tw:gap-1 tw:flex-none";
const ERROR_TEXT = "tw:text-xs tw:text-[var(--bk-error)]";

function Crumb({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    /* self-start / justify-start: flowbite's Button centres its content and
       stretches to the column's width, so the board's left-aligned back link
       sat in the middle of the panel (149:50, 149:84). */
    <Button className={`${LINK_BTN} tw:mx-4 tw:my-0.5 tw:self-start tw:justify-start`} onClick={onClick} aria-label={`Back to ${label}`} data-testid="content-crumb">
      ‹ {label}
    </Button>
  );
}

/* ── Root (148:2) + empty (149:7) ────────────────────────────────────────── */

export function RootView({
  collections,
  recordCounts,
  sourcesCount,
  variablesCount,
  conditionsCount,
  selectedCollectionId,
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
  onOpenCollection: (id: string) => void;
  onCreateCollection?: () => void;
  onOpenSources: () => void;
  onOpenVariables: () => void;
  onOpenConditions: () => void;
}) {
  if (collections.length === 0 && sourcesCount === 0 && variablesCount === 0 && conditionsCount === 0) {
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
        {onCreateCollection ? (
          <EmptyStateActions>
            <Button
              color="light"
              size="xs"
              variant="link" className="tw:min-h-6 tw:font-normal"
              data-testid="content-empty-cta"
              onClick={onCreateCollection}
            >
              Create a collection
            </Button>
          </EmptyStateActions>
        ) : null}
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
      <ListRow icon={<Database size={16} />} label="Sources" count={sourcesCount} chevron data-testid="content-open-sources" onClick={onOpenSources} />
      <ListRow icon={<Braces size={16} />} label="Variables" count={variablesCount} chevron data-testid="content-open-variables" onClick={onOpenVariables} />
      <ListRow icon={<GitBranch size={16} />} label="Conditions" count={conditionsCount} chevron data-testid="content-open-conditions" onClick={onOpenConditions} />
    </div>
  );
}

/* 6930:80567 — the Sources / Variables row ⋯ is 222 wide on the 1440 board
   (the shared Menu's own width is 200). */
const DATA_ROW_MENU = "tw:w-[222px]";

/* ── Sources (151:46) ────────────────────────────────────────────────────── */

/** Board 151:46 draws a status LINE under the source name — a dot, then a
 *  state and a detail ("● Connected · synced 4m ago").
 *
 *  Its sample is a Google Sheets connection with a sync clock, and neither
 *  exists here: `DataSource` carries no connection state and no timestamp, and
 *  `DataManager.watch()` watches a local data PATH for in-editor updates, not a
 *  remote file for external ones. So the SHAPE is taken and the sample is not —
 *  the dot reports whether the source actually resolves to data, which is the
 *  one thing this panel can state truthfully. A green dot next to
 *  "synced 4m ago" would be a fiction the code cannot back. */
function sourceStatus(s: DataSource): { ok: boolean; label: string } {
  const d = s.data;
  if (Array.isArray(d)) return { ok: d.length > 0, label: `${s.type} · ${d.length} item${d.length === 1 ? "" : "s"}` };
  if (d && typeof d === "object") {
    const n = Object.keys(d as Record<string, unknown>).length;
    return { ok: n > 0, label: `${s.type} · ${n} key${n === 1 ? "" : "s"}` };
  }
  if (s.type === "api") return { ok: Boolean(s.endpoint), label: s.endpoint ? `api · ${s.endpoint}` : "api · no endpoint" };
  if (s.type === "function") return { ok: Boolean(s.getData), label: "function" };
  return { ok: false, label: `${s.type} · empty` };
}

export function SourcesView({
  sources,
  onBack,
  onImportJson,
  actions,
}: {
  sources: DataSource[];
  onBack: () => void;
  onImportJson: (json: string) => string | null;
  /** The row ⋯ (6930:80567: Rename · Re-sync · Delete…). Board 151:46 drew
   *  the ⋯; `unregisterSource` had no UI caller, so a source could be added
   *  and never removed. */
  actions?: SourceRowActions;
}) {
  const [adding, setAdding] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [menuFor, setMenuFor] = React.useState<string | null>(null);
  const [renaming, setRenaming] = React.useState<DataSource | null>(null);
  const [resyncing, setResyncing] = React.useState<DataSource | null>(null);
  const [deleting, setDeleting] = React.useState<DataSource | null>(null);
  /* A source with a provider pulls from it; imported JSON has none, so
     Re-sync asks for the current data instead. */
  const resync = async (s: DataSource) => {
    if (!actions) return;
    if (!(await actions.refresh(s.id))) setResyncing(s);
  };
  return (
    <div className={CONTENT_BODY}>
      <Crumb label="Sources" onClick={onBack} />
      {/* Board 303:2083. Shown only when there is something to watch, and only
          because ContentTab now subscribes to DataManager's own events — the
          panel states this because it is true, not as decoration. */}
      {sources.length > 0 && (
        <div className="tw:px-4 tw:pb-1">
          <span className={`${STATUS_PILL} ${STATUS_PILL_OK}`} data-testid="sources-watching">
            Watching for changes
          </span>
        </div>
      )}
      <div className={SCROLL}>
        {sources.map((s) => {
          const status = sourceStatus(s);
          return (
            <Row key={s.id} size="comment" data-source-row data-testid={`content-source-${s.id}`}>
              <span className={ROW_STACK}>
                <span className={ROW_TITLE} data-testid={`content-source-name-${s.id}`}>{s.name}</span>
                <span className={`${SUB} tw:inline-flex tw:items-center tw:gap-1.5`} data-testid={`content-source-status-${s.id}`}>
                  <span
                    aria-hidden="true"
                    className="tw:size-[7px] tw:flex-none tw:rounded-full"
                    style={{ background: status.ok ? "var(--bk-success)" : "var(--bk-ink-muted)" }}
                  />
                  {status.label}
                </span>
              </span>
              {actions && (
                <span className={ROW_ACTIONS}>
                  <Popover
                    open={menuFor === s.id}
                    onClose={() => setMenuFor(null)}
                    placement="bottom-end"
                    label={`Actions for ${s.name}`}
                    trigger={
                      <IconButton label={`Actions for ${s.name}`} onClick={() => setMenuFor((p) => (p === s.id ? null : s.id))}>
                        ⋯
                      </IconButton>
                    }
                  >
                    <Menu label={`Actions for ${s.name}`} className={DATA_ROW_MENU}>
                      <MenuItem data-testid={`content-source-rename-${s.id}`} onClick={() => { setMenuFor(null); setRenaming(s); }}>
                        Rename
                      </MenuItem>
                      <MenuItem data-testid={`content-source-resync-${s.id}`} onClick={() => { setMenuFor(null); void resync(s); }}>
                        Re-sync
                      </MenuItem>
                      <MenuItem danger data-testid={`content-source-delete-${s.id}`} onClick={() => { setMenuFor(null); setDeleting(s); }}>
                        Delete…
                      </MenuItem>
                    </Menu>
                  </Popover>
                </span>
              )}
            </Row>
          );
        })}
        {/* Board 303:2067's pill words, which are the state's real name — the
            panel is not missing a list, there is nothing connected yet. */}
        {sources.length === 0 && (
          <div className="tw:px-4 tw:py-2">
            <span className={`${STATUS_PILL} ${STATUS_PILL_IDLE}`} data-testid="content-no-source">
              No data source connected
            </span>
          </div>
        )}
        {adding ? <ConnectSourceDialog onClose={() => setAdding(false)} onImport={onImportJson} /> : null}
        <Button className={`${LINK_BTN} tw:mx-4 tw:my-0.5`} data-testid="content-add-source" onClick={() => setAdding(true)}>
          + Connect a source
        </Button>
        {/* Board 151:46 prints this under the link, in flow. Pinned to the
            panel's foot with a rule above it, it read as a footer note on
            a different subject — 600px below the thing it explains. */}
        <div className={INLINE_HINT} data-testid="content-source-note">
          A source feeds a collection. Edits sync one way — from the source in.
        </div>
      </div>
      {actions ? (
        <>
          {renaming ? (
            <RenameDialog
              key={renaming.id}
              open
              onClose={() => setRenaming(null)}
              title="Rename source"
              label="Source name"
              initial={renaming.name}
              validate={(next) => (next ? null : "A source needs a name.")}
              onSave={(next) => actions.rename(renaming.id, next)}
              testId="content-source-rename"
            />
          ) : null}
          {resyncing ? (
            <ResyncJsonDialog
              key={resyncing.id}
              open
              onClose={() => setResyncing(null)}
              name={resyncing.name}
              current={resyncing.data}
              onResync={(data) => actions.replaceData(resyncing.id, data)}
            />
          ) : null}
          <ConfirmDialog
            open={deleting != null}
            onClose={() => setDeleting(null)}
            onConfirm={() => {
              if (deleting) actions.remove(deleting.id);
              setDeleting(null);
            }}
            title={`Delete “${deleting?.name ?? ""}”?`}
            message="The source and its data leave this site. Elements bound to it stop receiving its data."
            confirmLabel="Delete source"
            tone="destructive"
          />
        </>
      ) : null}
    </div>
  );
}

export interface SourceRowActions {
  rename: (id: string, name: string) => void;
  /** Pulls from the source's own provider; false when it has none. */
  refresh: (id: string) => Promise<boolean>;
  replaceData: (id: string, data: unknown) => void;
  remove: (id: string) => void;
}

/* ── Variables (151:62) ──────────────────────────────────────────────────── */

export function VariablesView({
  variables,
  onBack,
  onChange,
}: {
  variables: SiteVariable[];
  onBack: () => void;
  onChange: (vars: SiteVariable[]) => void;
}) {
  const [adding, setAdding] = React.useState(false);
  const [key, setKey] = React.useState("");
  const [value, setValue] = React.useState("");
  const [editKey, setEditKey] = React.useState<string | null>(null);
  const [editValue, setEditValue] = React.useState("");
  const [menuFor, setMenuFor] = React.useState<string | null>(null);
  const [renaming, setRenaming] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState<string | null>(null);
  const keyError = key.trim() !== "" && !isValidVariableKey(key.trim());
  const dupError = variables.some((v) => v.key === key.trim());

  return (
    <div className={CONTENT_BODY}>
      <Crumb label="Variables" onClick={onBack} />
      <div className={SCROLL}>
        {/* Every other screen in this panel says what an empty list means —
            "No data source connected", "No records yet". Variables said
            nothing at all, so an empty Variables screen was one blue link on
            white with no clue what a variable is for. */}
        {variables.length === 0 && !adding && (
          /* Variables are saved with the project and the export writes their
             value wherever {{site.<key>}} appears in text (G3-075). The canvas
             still shows the braces as typed — say so. */
          <div className={`${SUB} tw:p-3`}>
            No variables yet. Write a value once, then type{" "}
            <span className={MONO}>{"{{site.name}}"}</span> in any text: the
            published page shows the value; the canvas shows the braces.
          </div>
        )}
        {variables.map((v) => (
          <Row key={v.key} size="stack" data-variable-row data-testid={`content-var-${v.key}`}>
            <span className={ROW_STACK}>
              <span className={MONO} data-testid={`content-var-key-${v.key}`}>{`{{site.${v.key}}}`}</span>
              {editKey === v.key ? (
                <TextInput
                  className="tw:mt-1"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  aria-label={`Value for ${v.key}`}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      onChange(variables.map((x) => (x.key === v.key ? { ...x, value: editValue } : x)));
                      setEditKey(null);
                    }
                    if (e.key === "Escape") setEditKey(null);
                  }}
                />
              ) : (
                <span className={SUB} data-testid={`content-var-value-${v.key}`}>{v.value || "—"}</span>
              )}
            </span>
            <span className={ROW_ACTIONS}>
              {editKey === v.key ? (
                <Button
                  color="light"
                  size="xs"
                  className={GHOST}
                  onClick={() => {
                    onChange(variables.map((x) => (x.key === v.key ? { ...x, value: editValue } : x)));
                    setEditKey(null);
                  }}
                >
                  Save
                </Button>
              ) : (
                /* Board 151:62 draws one `⋯` per row, not a pair of text
                   buttons. Two labelled actions on every row read as the row's
                   content and crowded the value out of a 320 column. */
                <Popover
                  open={menuFor === v.key}
                  onClose={() => setMenuFor(null)}
                  placement="bottom-end"
                  label={`Actions for ${v.key}`}
                  trigger={
                    <IconButton
                      label={`Actions for ${v.key}`}
                      onClick={() => setMenuFor((p) => (p === v.key ? null : v.key))}
                    >
                      ⋯
                    </IconButton>
                  }
                >
                  <Menu label={`Actions for ${v.key}`} className={DATA_ROW_MENU}>
                    <MenuItem data-testid={`content-var-edit-${v.key}`} onClick={() => { setMenuFor(null); setEditKey(v.key); setEditValue(v.value); }}>
                      Edit value
                    </MenuItem>
                    <MenuItem data-testid={`content-var-rename-${v.key}`} onClick={() => { setMenuFor(null); setRenaming(v.key); }}>
                      Rename
                    </MenuItem>
                    <MenuItem danger data-testid={`content-var-delete-${v.key}`} onClick={() => { setMenuFor(null); setDeleting(v.key); }}>
                      Delete…
                    </MenuItem>
                  </Menu>
                </Popover>
              )}
            </span>
          </Row>
        ))}
        {adding ? (
          <div className={INLINE_FORM}>
            <TextInput
              placeholder="key (e.g. phone)"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              aria-label="Variable key"
              autoFocus
            />
            {(keyError || dupError) && (
              <div className={ERROR_TEXT} role="alert">
                {dupError ? "A variable with this key already exists." : "Keys are letters/digits/dashes, starting with a letter."}
              </div>
            )}
            <TextInput
              placeholder="value"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              aria-label="Variable value"
            />
            <div className={FORM_ROW}>
              <span className={SPACER} />
              <Button color="light" size="xs" className={GHOST} onClick={() => setAdding(false)}>Cancel</Button>
              <Button
                size="xs"
                disabled={!key.trim() || keyError || dupError}
                onClick={() => {
                  onChange([...variables, { key: key.trim(), value }]);
                  setAdding(false);
                  setKey("");
                  setValue("");
                }}
              >
                Add
              </Button>
            </div>
          </div>
        ) : (
          <Button className={`${LINK_BTN} tw:mx-4 tw:my-0.5`} data-testid="content-add-variable" onClick={() => setAdding(true)}>
            + New variable
          </Button>
        )}
      </div>
      {renaming != null ? (
      <RenameDialog
        key={renaming}
        open
        onClose={() => setRenaming(null)}
        title="Rename variable"
        label="Key"
        initial={renaming}
        validate={(next) =>
          !isValidVariableKey(next)
            ? "Keys are letters/digits/dashes, starting with a letter."
            : variables.some((x) => x.key === next)
              ? "A variable with this key already exists."
              : null
        }
        onSave={(next) => onChange(variables.map((x) => (x.key === renaming ? { ...x, key: next } : x)))}
        testId="content-var-rename"
      />
      ) : null}
      <ConfirmDialog
        open={deleting != null}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          onChange(variables.filter((x) => x.key !== deleting));
          setDeleting(null);
        }}
        title={`Delete {{site.${deleting ?? ""}}}?`}
        message="The variable and its value are removed."
        confirmLabel="Delete variable"
        tone="destructive"
      />
    </div>
  );
}

/* ── Conditions (151:87) ─────────────────────────────────────────────────── */

const OPERATORS: ConditionOperator[] = ["==", "!=", ">", "<", ">=", "<=", "contains", "exists", "empty"];

export function ConditionsView({
  conditions,
  onBack,
  onRemove,
  onSelectElement,
  onStartPick,
  pickedElementId,
  onCreate,
  onCancelPick,
}: {
  conditions: ConditionRow[];
  onBack: () => void;
  onRemove: (elementId: string) => void;
  onSelectElement: (elementId: string) => void;
  onStartPick: () => void;
  pickedElementId: string | null;
  onCreate: (expr: ConditionExpression) => void;
  onCancelPick: () => void;
}) {
  const [left, setLeft] = React.useState("");
  const [operator, setOperator] = React.useState<ConditionOperator>("==");
  const [right, setRight] = React.useState("");
  const needsRight = !["exists", "not_exists", "empty", "not_empty"].includes(operator);
  const [menuFor, setMenuFor] = React.useState<string | null>(null);

  return (
    <div className={CONTENT_BODY}>
      <Crumb label="Conditions" onClick={onBack} />
      <div className={SCROLL}>
        {conditions.map((c) => (
          <Row key={`${c.elementId}`} size="tall" data-condition-row data-testid={`content-cond-${c.elementId}`}>
            <span className={ROW_STACK}>
              <span className={`${ROW_TITLE} tw:overflow-hidden tw:text-ellipsis tw:whitespace-nowrap`} data-testid={`content-cond-label-${c.elementId}`}>{c.label}</span>
              <span className={SUB} data-testid={`content-cond-summary-${c.elementId}`}>{conditionSummary(c.binding)}</span>
            </span>
            <span className={ROW_ACTIONS}>
              {/* Board 151:87 draws `⋯`. */}
              <Popover
                open={menuFor === c.elementId}
                onClose={() => setMenuFor(null)}
                placement="bottom-end"
                label={`Actions for ${c.label}`}
                trigger={
                  <IconButton
                    label={`Actions for ${c.label}`}
                    onClick={() => setMenuFor((p) => (p === c.elementId ? null : c.elementId))}
                  >
                    ⋯
                  </IconButton>
                }
              >
                <Menu>
                  <MenuItem onClick={() => { setMenuFor(null); onSelectElement(c.elementId); }}>
                    Select element
                  </MenuItem>
                  <MenuItem onClick={() => { setMenuFor(null); onRemove(c.elementId); }}>
                    Remove condition
                  </MenuItem>
                </Menu>
              </Popover>
            </span>
          </Row>
        ))}
        {conditions.length === 0 && !pickedElementId && (
          <div className={`${SUB} tw:p-3`}>
            No conditions yet. A condition shows or hides an element based on data —
            &ldquo;+ New condition&rdquo; starts by picking the element on the canvas it
            controls.
          </div>
        )}
        {pickedElementId ? (
          <div className={INLINE_FORM} data-testid="condition-form">
            <div className={SUB}>Show the picked element when…</div>
            <TextInput
              placeholder="site.hours or menu.available"
              value={left}
              onChange={(e) => setLeft(e.target.value)}
              aria-label="Condition path"
              autoFocus
            />
            <div className={FORM_ROW}>
              <Select
                value={operator}
                onChange={(e) => setOperator(e.target.value as ConditionOperator)}
                aria-label="Operator"
              >
                {OPERATORS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </Select>
              {needsRight && (
                <div className={SPACER}>
                  <TextInput
                    placeholder="value"
                    value={right}
                    onChange={(e) => setRight(e.target.value)}
                    aria-label="Condition value"
                  />
                </div>
              )}
            </div>
            <div className={FORM_ROW}>
              <span className={SPACER} />
              <Button color="light" size="xs" className={GHOST} onClick={onCancelPick}>Cancel</Button>
              <Button
                size="xs"
                disabled={!left.trim() || (needsRight && !right.trim())}
                onClick={() =>
                  onCreate({
                    operator,
                    left: left.trim(),
                    ...(needsRight ? { right: right.trim() } : {}),
                  })
                }
              >
                Add condition
              </Button>
            </div>
          </div>
        ) : (
          <Button className={`${LINK_BTN} tw:mx-4 tw:my-0.5`} data-testid="content-add-condition" onClick={onStartPick}>
            + New condition
          </Button>
        )}
      </div>

    </div>
  );
}
