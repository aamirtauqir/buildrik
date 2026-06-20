/**
 * SearchListingsTable — the "Search listings" view of the Pages panel
 * (prototype 50-pages). Where the page list answers "what pages exist", this
 * answers "what Google will show for each page" across the whole site at once —
 * the single-page SEO form doesn't scale past a handful of pages.
 *
 * Each row shows the EFFECTIVE title/description (page-set override vs inherited
 * site default), whether the page is indexed, and a computed status flag
 * (good / no description / duplicate title / hidden ok). Read-only summary;
 * clicking a row opens that page's settings to edit. All values are derived
 * from the live PageItem list — no new engine state.
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

const th: React.CSSProperties = {
  border: "1px solid var(--bd-border, #e5e7eb)",
  padding: "6px 9px",
  textAlign: "left",
  background: "var(--bd-bg-subtle, #f9fafb)",
  fontSize: 9.5,
  letterSpacing: "0.03em",
  textTransform: "uppercase",
  color: "var(--bd-fg-muted, #6b7280)",
  fontWeight: 600,
};
const td: React.CSSProperties = {
  border: "1px solid var(--bd-border, #e5e7eb)",
  padding: "6px 9px",
  textAlign: "left",
  verticalAlign: "middle",
  fontSize: 11.5,
  color: "var(--bd-fg, #374151)",
};
const srcBase: React.CSSProperties = {
  fontSize: 8.5,
  letterSpacing: "0.02em",
  textTransform: "uppercase",
  borderRadius: 3,
  padding: "1px 5px",
  marginLeft: 5,
  whiteSpace: "nowrap",
};

function SourceTag({ source }: { source: Source }) {
  return source === "custom" ? (
    <span style={{ ...srcBase, background: "var(--bd-accent, #2D6DFF)", color: "#fff" }}>custom</span>
  ) : (
    <span style={{ ...srcBase, border: "1px dashed var(--bd-border, #d1d5db)", color: "var(--bd-fg-muted, #9ca3af)" }}>
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
        border: ok ? "1px solid var(--bd-border, #d1d5db)" : "1px solid var(--bd-fg, #374151)",
        color: ok ? "var(--bd-fg-muted, #9ca3af)" : "var(--bd-fg, #374151)",
        fontWeight: ok ? 400 : 600,
      }}
    >
      {flag.label}
    </span>
  );
}

export function SearchListingsTable({ pages, onEditPage }: SearchListingsTableProps) {
  const rows = React.useMemo(() => buildRows(pages), [pages]);
  const issues = rows.filter((r) => r.flag.tone === "warn");

  return (
    <div style={{ padding: "10px 12px", overflow: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ ...th, width: "20%" }}>Page</th>
            <th style={{ ...th, width: "30%" }}>Title (effective)</th>
            <th style={{ ...th, width: "30%" }}>Description</th>
            <th style={{ ...th, width: "9%" }}>Index</th>
            <th style={th}>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.page.id}
              onClick={() => onEditPage(r.page.id)}
              style={{ cursor: "pointer" }}
              title={`Edit ${r.page.name}'s search listing`}
            >
              <td style={td}>
                <strong>{r.page.name}</strong>{" "}
                <span style={{ fontSize: 10, color: "var(--bd-fg-muted, #9ca3af)" }}>{r.path}</span>
              </td>
              <td style={td}>
                {r.title}
                <SourceTag source={r.titleSource} />
              </td>
              <td style={td}>
                {r.description ? (
                  <>
                    {r.description}
                    <SourceTag source={r.descriptionSource} />
                  </>
                ) : (
                  <span style={{ fontSize: 10, color: "var(--bd-fg-muted, #9ca3af)" }}>— missing —</span>
                )}
              </td>
              <td style={td}>
                {r.indexed ? (
                  "✓"
                ) : (
                  <span
                    style={{
                      fontSize: 9,
                      border: "1px dashed var(--bd-fg, #374151)",
                      borderRadius: 3,
                      padding: "1px 5px",
                      color: "var(--bd-fg, #374151)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    hidden from Google
                  </span>
                )}
              </td>
              <td style={td}>
                <FlagPill flag={r.flag} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ margin: "8px 2px 0", fontSize: 11, color: "var(--bd-fg-muted, #6b7280)", lineHeight: 1.5 }}>
        {issues.length === 0 ? (
          <>All pages have a title &amp; description Google can use.</>
        ) : (
          <>
            <strong style={{ color: "var(--bd-fg, #374151)" }}>{issues.length}</strong>{" "}
            {issues.length === 1 ? "page needs" : "pages need"} attention — click a row to fix its search listing.
          </>
        )}
      </p>
    </div>
  );
}

export default SearchListingsTable;
