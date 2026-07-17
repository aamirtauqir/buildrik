/**
 * SearchListingsTable — the "Search listings" view of the Pages panel
 * (prototype 50-pages). Where the page list answers "what pages exist", this
 * answers "what Google will show for each page" across the whole site at once —
 * the single-page SEO form doesn't scale past a handful of pages.
 *
 * Each card shows the EFFECTIVE title/description (page-set override vs inherited
 * site default), whether the page is indexed, and a computed status flag
 * (good / no description / duplicate title / hidden ok). Read-only summary;
 * clicking a card opens that page's settings to edit. All values are derived
 * from the live PageItem list — no new engine state.
 *
 * Layout: a stacked card per page (not a 5-column table) so the whole listing
 * reads top-to-bottom inside the ~340px rail without horizontal scroll. The
 * prototype's wide table is the same columns in a wide surface; this is the
 * rail-appropriate form.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { PageItem } from "../types";

interface SearchListingsTableProps {
  pages: PageItem[];
  onEditPage: (pageId: string) => void;
}

type Source = "custom" | "site default";
type Flag = { label: string; tone: "ok" | "warn" };

interface Row {
  page: PageItem;
  path: string;
  title: string;
  titleSource: Source;
  description: string | null; // null = missing
  descriptionSource: Source;
  indexed: boolean;
  flag: Flag;
}

// Effective value = the page's own override, else the inherited site default.
// Title falls back to the page name (what the engine renders when unset);
// description has no fallback — an unset description is a real SEO gap.
function buildRows(pages: PageItem[]): Row[] {
  const effectiveTitles = pages.map((p) => (p.seo?.metaTitle?.trim() || p.name).toLowerCase());
  const titleCounts = effectiveTitles.reduce<Record<string, number>>((acc, t) => {
    acc[t] = (acc[t] ?? 0) + 1;
    return acc;
  }, {});

  return pages.map((page, i) => {
    const customTitle = page.seo?.metaTitle?.trim();
    const customDesc = page.seo?.metaDescription?.trim();
    const indexed = !page.seo?.noIndex;
    const title = customTitle || page.name;
    const description = customDesc || null;

    let flag: Flag;
    if (!indexed) flag = { label: "hidden ok", tone: "ok" };
    else if (!description) flag = { label: "no description", tone: "warn" };
    else if (titleCounts[effectiveTitles[i]] > 1) flag = { label: "duplicate title", tone: "warn" };
    else flag = { label: "good", tone: "ok" };

    return {
      page,
      path: page.isHome ? "/" : `/${page.slug || ""}`,
      title,
      titleSource: customTitle ? "custom" : "site default",
      description,
      descriptionSource: customDesc ? "custom" : "site default",
      indexed,
      flag,
    };
  });
}

const srcBase: React.CSSProperties = {
  fontSize: 8.5,
  letterSpacing: "0.02em",
  textTransform: "uppercase",
  borderRadius: 3,
  padding: "1px 5px",
  marginLeft: 5,
  whiteSpace: "nowrap",
  flexShrink: 0,
};
const fieldLabel: React.CSSProperties = {
  fontSize: 9,
  letterSpacing: "0.03em",
  textTransform: "uppercase",
  color: "var(--bd-fg-muted)",
  width: 34,
  flexShrink: 0,
};

function SourceTag({ source }: { source: Source }) {
  return source === "custom" ? (
    <span style={{ ...srcBase, background: "var(--bd-accent)", color: "var(--bd-fg-on-accent)" }}>custom</span>
  ) : (
    <span style={{ ...srcBase, border: "1px dashed var(--bd-border)", color: "var(--bd-fg-muted)" }}>
      site default
    </span>
  );
}

function FlagPill({ flag }: { flag: Flag }) {
  const ok = flag.tone === "ok";
  return (
    <span
      style={{
        fontSize: 9,
        borderRadius: 3,
        padding: "1px 6px",
        whiteSpace: "nowrap",
        border: ok ? "1px solid var(--bd-border)" : "1px solid var(--bd-fg)",
        color: ok ? "var(--bd-fg-muted)" : "var(--bd-fg)",
        fontWeight: ok ? 400 : 600,
      }}
    >
      {flag.label}
    </span>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 6, minWidth: 0 }}>
      <span style={fieldLabel}>{label}</span>
      <span style={{ fontSize: 11, color: "var(--bd-fg)", minWidth: 0, display: "flex", alignItems: "center", flexWrap: "wrap" }}>
        {children}
      </span>
    </div>
  );
}

export function SearchListingsTable({ pages, onEditPage }: SearchListingsTableProps) {
  const rows = React.useMemo(() => buildRows(pages), [pages]);
  const issues = rows.filter((r) => r.flag.tone === "warn");

  return (
    <div style={{ padding: "8px 10px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
      {rows.map((r) => (
        <div
          key={r.page.id}
          onClick={() => onEditPage(r.page.id)}
          title={`Edit ${r.page.name}'s search listing`}
          style={{
            cursor: "pointer",
            border: "1px solid var(--bd-border)",
            borderRadius: 6,
            padding: "7px 9px",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <strong style={{ fontSize: 12, color: "var(--bd-fg)" }}>{r.page.name}</strong>
            <span style={{ fontSize: 10, color: "var(--bd-fg-muted)" }}>{r.path}</span>
            <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5 }}>
              {!r.indexed && (
                <span style={{ fontSize: 9, color: "var(--bd-fg-muted)", whiteSpace: "nowrap" }}>
                  hidden from Google
                </span>
              )}
              <FlagPill flag={r.flag} />
            </span>
          </div>
          <FieldRow label="Title">
            <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{r.title}</span>
            <SourceTag source={r.titleSource} />
          </FieldRow>
          <FieldRow label="Desc">
            {r.description ? (
              <>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{r.description}</span>
                <SourceTag source={r.descriptionSource} />
              </>
            ) : (
              <span style={{ color: "var(--bd-fg-muted)" }}>— missing —</span>
            )}
          </FieldRow>
        </div>
      ))}
      <p style={{ margin: "4px 2px 0", fontSize: 11, color: "var(--bd-fg-muted)", lineHeight: 1.5 }}>
        {issues.length === 0 ? (
          <>All pages have a title &amp; description Google can use.</>
        ) : (
          <>
            <strong style={{ color: "var(--bd-fg)" }}>{issues.length}</strong>{" "}
            {issues.length === 1 ? "page needs" : "pages need"} attention — click a card to fix its search listing.
          </>
        )}
      </p>
    </div>
  );
}

export default SearchListingsTable;
