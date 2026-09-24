"use client";

import { useEffect, useState } from "react";
import { PageCrumb, type SnapshotPage } from "@/components/reviews/signoff-snapshot";

type Rows = { site: unknown; pages: unknown; siteColumns: unknown };
type RenderState = { status: "rendering" } | { status: "ready"; pages: SnapshotPage[] } | { status: "failed" };

/**
 * The saved draft, rendered by the publish exporter itself: the rows are mapped
 * by the editor's own `projectDataFromRows` and exported by
 * `renderProjectPages` (a scratch composer + `exportPublishPages`, the same
 * pages a publish deploys). The engine needs a DOM, so this runs here in the
 * visitor's browser, not on the server.
 *
 * Each page is shown in `sandbox=""`: no scripts at all (stricter than a
 * published site, whose interaction runtime does not run here), a unique
 * origin, no forms, no top navigation — the draft's markup can never touch
 * this page or its cookies. The page switch lives in the header because a
 * script-less frame cannot follow its own nav links.
 */
export function DraftPreview({ siteName, rows }: { siteName: string; rows: Rows }) {
  const [state, setState] = useState<RenderState>({ status: "rendering" });
  const [active, setActive] = useState(0);

  useEffect(() => {
    let cancelled = false;
    import("@buildrik/editor")
      .then(({ projectDataFromRows, renderProjectPages }) =>
        renderProjectPages(projectDataFromRows(rows.site, rows.pages, rows.siteColumns)),
      )
      .then((pages) => {
        if (!cancelled) setState({ status: "ready", pages });
      })
      .catch((e: unknown) => {
        console.error("[share] draft render failed", e);
        if (!cancelled) setState({ status: "failed" });
      });
    return () => {
      cancelled = true;
    };
  }, [rows]);

  const pages = state.status === "ready" ? state.pages : [];
  const page = pages[Math.min(active, Math.max(pages.length - 1, 0))] ?? null;

  return (
    <div className="flex h-screen flex-col" style={{ backgroundColor: "var(--color-bg-page)" }}>
      <header
        className="flex h-12 shrink-0 items-center gap-2 bg-white px-4 text-[13px]"
        style={{ borderBottom: "1px solid var(--color-border-default)" }}
      >
        <span className="font-semibold" style={{ color: "var(--color-text-primary)" }}>
          {siteName}
        </span>
        {pages.length > 0 ? (
          <>
            <span aria-hidden="true" style={{ color: "var(--color-text-secondary)" }}>
              ·
            </span>
            <PageCrumb pages={pages} active={active} onPick={setActive} />
          </>
        ) : null}
        <span className="ml-auto" style={{ color: "var(--color-text-secondary)" }}>
          Draft preview · the last saved design, not the live site
        </span>
      </header>
      <main className="min-h-0 flex-1">
        {page ? (
          <iframe
            key={page.path}
            title={`${siteName} — draft preview`}
            srcDoc={page.html}
            sandbox=""
            referrerPolicy="no-referrer"
            className="block h-full w-full border-0 bg-white"
          />
        ) : (
          <p className="p-8 text-center text-[13px]" style={{ color: "var(--color-text-secondary)" }}>
            {state.status === "rendering"
              ? "Loading the saved design…"
              : state.status === "failed"
                ? "This preview couldn’t be rendered. Try reloading the page."
                : "There’s nothing to show yet — this site has no live pages."}
          </p>
        )}
      </main>
    </div>
  );
}
