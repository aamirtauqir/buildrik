/**
 * ContentTab (P4.2) — the data front-door. Today a data source is only
 * creatable/inspectable through the inspector's binding chip, which means you
 * must select an element first. This panel surfaces the workspace's data
 * sources data-first: see every registered source, spin up a new collection,
 * and learn how to bind — without touching an element.
 *
 * Placement note: the authoritative IA map (14-screen-specs.md:8) puts a
 * "Content" tab in the rail; the master plan said "no rail change". This
 * resolves that contradiction toward the authoritative IA — an additive rail
 * entry (like the P0 review tab), not a restructure. Easily re-homed if the
 * 6-tab-rail redesign lands.
 *
 * Inline-style + DS primitives, matching the chrome convention (Topbar/ReviewTab).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button, Icon } from "@/editor/shared/vibcoder";
import { PanelHeader } from "@/shared/extensions/PanelHeader";
import { useDataManager } from "@/editor/shell/hooks/useDataManager";
import type { Composer } from "@/engine";
import type { DataSource } from "@/shared/types/data";

export interface ContentTabProps {
  composer: Composer | null;
  isPinned?: boolean;
  onPinToggle?: () => void;
  onHelpClick?: () => void;
  onClose?: () => void;
  /** Opens the CMS collection setup (shell-owned modal) — the data-first create
   *  path, no element selection required. Absent → the create button hides. */
  onCreateCollection?: () => void;
}

const TYPE_LABEL: Record<DataSource["type"], string> = {
  object: "Object",
  array: "Collection",
  function: "Dynamic",
  api: "API",
};

function recordCount(s: DataSource): number | null {
  if (Array.isArray(s.data)) return s.data.length;
  return null;
}

const S: Record<string, React.CSSProperties> = {
  body: { display: "flex", flexDirection: "column", height: "100%", minHeight: 0 },
  toolbar: { display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderBottom: "1px solid var(--bd-border)" },
  spacer: { flex: 1 },
  scroll: { flex: 1, minHeight: 0, overflowY: "auto", padding: "8px 12px" },
  row: { display: "flex", alignItems: "center", gap: 10, padding: "10px", border: "1px solid var(--bd-border)", borderRadius: "var(--bd-radius-md)", marginBottom: 6 },
  rowMain: { display: "flex", flexDirection: "column", gap: 2, minWidth: 0, flex: 1 },
  name: { fontSize: 13, fontWeight: 600, color: "var(--bd-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  meta: { fontSize: 12, color: "var(--bd-text-muted)" },
  typeTag: { fontSize: 11, fontWeight: 600, color: "var(--bd-text-secondary)", background: "var(--bd-surface)", border: "1px solid var(--bd-border)", borderRadius: "var(--bd-radius-md)", padding: "2px 6px", flexShrink: 0 },
  hint: { fontSize: 12, color: "var(--bd-text-muted)", lineHeight: 1.5, padding: "6px 12px", borderTop: "1px solid var(--bd-border)" },
  center: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, padding: 24, textAlign: "center", color: "var(--bd-text-muted)" },
  centerTitle: { fontSize: 14, fontWeight: 600, color: "var(--bd-text)" },
  centerHint: { fontSize: 12, color: "var(--bd-text-muted)", maxWidth: "15rem" },
};

const BIND_HINT = "To bind: select an element on the canvas, then use its data chip in the inspector to connect it to a source and field.";

export const ContentTab: React.FC<ContentTabProps> = ({
  composer,
  isPinned,
  onPinToggle,
  onHelpClick,
  onClose,
  onCreateCollection,
}) => {
  const { sources } = useDataManager(composer);

  const header = (
    <PanelHeader
      title="Content"
      isPinned={isPinned}
      onPinToggle={onPinToggle}
      onHelpClick={onHelpClick}
      onClose={onClose}
    />
  );

  return (
    <div style={S.body}>
      {header}

      {onCreateCollection && (
        <div style={S.toolbar}>
          <span style={S.meta}>{sources.length} data source{sources.length === 1 ? "" : "s"}</span>
          <div style={S.spacer} />
          <Button variant="primary" size="sm" onClick={onCreateCollection}>
            <Icon name="plus" size="sm" /> New collection
          </Button>
        </div>
      )}

      {sources.length === 0 ? (
        <div style={S.center}>
          <Icon name="components" size="lg" />
          <div style={S.centerTitle}>No data yet</div>
          <div style={S.centerHint}>
            Create a collection to power dynamic content — product lists, blog posts, team members —
            then bind elements to it.{onCreateCollection ? "" : " Drop a data-bound block to start."}
          </div>
          {onCreateCollection && (
            <Button variant="primary" size="sm" onClick={onCreateCollection}>
              <Icon name="plus" size="sm" /> New collection
            </Button>
          )}
        </div>
      ) : (
        <>
          <div style={S.scroll}>
            {sources.map((s) => {
              const count = recordCount(s);
              return (
                <div key={s.id} style={S.row}>
                  <span style={{ color: "var(--bd-text-muted)", flexShrink: 0 }}>
                    <Icon name="components" size="sm" />
                  </span>
                  <div style={S.rowMain}>
                    <span style={S.name}>{s.name}</span>
                    <span style={S.meta}>
                      {count != null ? `${count} record${count === 1 ? "" : "s"}` : s.description || "—"}
                    </span>
                  </div>
                  <span style={S.typeTag}>{TYPE_LABEL[s.type]}</span>
                </div>
              );
            })}
          </div>
          <div style={S.hint}>{BIND_HINT}</div>
        </>
      )}
    </div>
  );
};

export default ContentTab;
