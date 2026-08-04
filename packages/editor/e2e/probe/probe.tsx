/**
 * Style-parity probe host.
 *
 * jsdom cannot answer the only question that matters during the inline-style
 * drain: `getComputedStyle` on a `tw:` class returns rgb(0, 0, 0) there,
 * because no stylesheet is loaded. So a conversion from `style={{...}}` to
 * `tw:` utilities makes the vitest suite BLIND to styling while it stays
 * green — the exact failure shape this codebase keeps hitting.
 *
 * This page mounts one component in a real browser with the real CSS pipeline
 * (tokens + tw utilities + chrome reset), so Playwright can read genuine
 * computed values before and after a conversion.
 *
 * Pick the case with ?case=<name>. Cases are registered below, deliberately
 * by hand: an auto-discovering registry would silently stop covering a
 * component the day someone renamed a file, and a probe that quietly covers
 * nothing is worse than no probe.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { createRoot } from "react-dom/client";
// fonts.css before default.css, and imported here rather than from default.css
// — see the note at the top of themes/default.css. Without it this probe has no
// webfont at all, which is how 106 baseline entries came to record
// `font-family: "Times"`.
import "@/themes/fonts.css";
import "@/themes/default.css";

import { CollectionView, FieldsView, RootView } from "@/editor/sidebar/tabs/content/ContentViews";
import { FolderContextMenu } from "@/editor/sidebar/tabs/media/components/FolderContextMenu";
import { OnboardingChecklist } from "@/editor/onboarding/OnboardingChecklist";
import { CanvasFooterToolbar } from "@/editor/canvas/CanvasFooterToolbar";
import { PanelFrame } from "@/editor/chrome-ui";
import { SlimLauncher } from "@/editor/sidebar/tabs/media/components/SlimLauncher";
import type { LibraryItem } from "@/editor/sidebar/tabs/media/data/mediaTypes";
import type { UploadProgress } from "@/shared/types/media";


/**
 * Media drawer fixtures (T6).
 *
 * The plan said "mount `<MediaTab>` with fixture props". `SlimLauncher` is what
 * that actually resolves to at 320: `MediaTab` picks between three renderers,
 * and the drawer the Figma screens describe is this one. Mounting MediaTab
 * would drag a real `Composer` into the probe to reach the same markup — a
 * dependency that buys nothing and can only add flake.
 *
 * Every state below is unreachable by hovering the live app: an empty library,
 * a filter that matches nothing, a failed upload. Those are exactly the screens
 * the board draws and the ones nothing has ever measured.
 */
const MEDIA_ITEM = (over: Partial<LibraryItem> = {}): LibraryItem => ({
  key: "a1",
  name: "hero.jpg",
  type: "img",
  src: "data:image/gif;base64,R0lGODlhAQABAIAAAMLCwgAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==",
  thumb: "data:image/gif;base64,R0lGODlhAQABAIAAAMLCwgAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==",
  size: 128_000,
  createdAt: "2026-08-01T10:00:00.000Z",
  mimeType: "image/jpeg",
  ...over,
});

const MEDIA_ITEMS: LibraryItem[] = [
  MEDIA_ITEM({ key: "a1", name: "hero.jpg" }),
  MEDIA_ITEM({ key: "a2", name: "team.png", assetSource: "stock" }),
  MEDIA_ITEM({ key: "a3", name: "promo.mp4", type: "vid", mimeType: "video/mp4", thumb: undefined }),
  MEDIA_ITEM({ key: "a4", name: "logo.svg", type: "ico", mimeType: "image/svg+xml", thumb: undefined }),
];

const MEDIA_COUNTS = { all: 4, img: 2, vid: 1, ico: 1, fnt: 0 };

function mediaDrawer(over: Partial<React.ComponentProps<typeof SlimLauncher>> = {}) {
  return (
    <SlimLauncher
      composer={null as unknown as React.ComponentProps<typeof SlimLauncher>["composer"]}
      libraryItems={MEDIA_ITEMS}
      activeType="all"
      counts={MEDIA_COUNTS}
      searchQuery=""
      storage={{ used: 42 * 1024 * 1024, total: 500 * 1024 * 1024 }}
      uploadQueue={[]}
      usageMap={new Map([["a1", 3]])}
      onInsert={() => {}}
      onTypeChange={() => {}}
      onSearchChange={() => {}}
      onUpload={() => {}}
      onRetryUpload={() => {}}
      onOpenStock={() => {}}
      onOpenLibrary={() => {}}
      onClose={() => {}}
      {...over}
    />
  );
}

const ACTIVE_UPLOAD: UploadProgress[] = [
  { fileName: "pasta-2.jpg", progress: 62, status: "uploading" },
];

const FAILED_UPLOAD: UploadProgress[] = [
  { fileName: "poster-4k.png", progress: 0, status: "error", error: "File too large. Max: 10MB" },
];

/** Every case renders into `.bd-studio` so chrome-scoped CSS applies. */
const CASES: Record<string, () => React.ReactElement> = {
  // Was "content-style-map", which mapped over ContentViews' exported `S`
  // object. That object is gone (the panel now composes chrome-ui rows), and
  // because tsconfig's `include` did not cover e2e/, its import kept compiling
  // to nothing while every gate stayed green — the probe silently measured
  // an empty page. e2e/ is typechecked now, and the coverage `S` used to give
  // is replaced by rendering the real converted views below.
  "content-collection-rows": () => (
    <div data-probe="content-collection-rows">
      <CollectionView
        collection={
          {
            id: "c1",
            name: "Posts",
            displayField: "title",
            fields: [{ id: "f1", name: "Title", slug: "title", type: "text" }],
          } as never
        }
        records={[
          { id: "r0001", status: "published", data: { title: "Margherita" } } as never,
          { id: "r0002", status: "draft", data: { title: "Marinara" } } as never,
        ]}
        onBack={() => {}}
        onOpenRecord={() => {}}
        onAddRecord={() => {}}
        onOpenFields={() => {}}
        onOpenDynamicPages={() => {}}
      />
    </div>
  ),
  // The strike-through on a completed step used to be an inline
  // `textDecoration`, asserted in jsdom. It is a class now, and jsdom computes
  // "" for classes, so that assertion could no longer prove anything. This
  // case measures the real computed value in a browser instead — one completed
  // step, one pending, one expanded so the body and CTA render too.
  "onboarding-steps": () => (
    <div data-probe="onboarding-steps">
      <OnboardingChecklist
        steps={[
          { id: "a", label: "Name your project", description: "Give it a name.", completed: true } as never,
          { id: "b", label: "Choose a starting point", description: "Pick a template.",
            actionLabel: "Browse templates", actionKey: "templates", completed: false } as never,
          { id: "c", label: "Publish", description: "Ship it.", completed: false } as never,
        ]}
        completedCount={1}
        totalCount={3}
        activeStepId="b"
        onSetActiveStepId={() => {}}
        onAction={() => {}}
        onDismiss={() => {}}
        onMinimize={() => {}}
        isMinimized={false}
        onRestore={() => {}}
      />
    </div>
  ),
  // The floating canvas bar. Its containment contract (max-width:100%,
  // min-width:0, overflow-x:auto) and its opaque fill used to be inline styles
  // asserted in jsdom; both are classes now, so only a real browser can say
  // whether the bar still refuses to spill under the inspector.
  "canvas-footer-toolbar": () => (
    <div data-probe="canvas-footer-toolbar">
      <CanvasFooterToolbar
        overlays={{ guides: true, spacing: false, grid: false, rulers: false, badges: false, xray: false }}
        zoom={100}
        onOverlayChange={() => {}}
        onZoomChange={() => {}}
        onUndo={() => {}}
        onRedo={() => {}}
        onHelpClick={() => {}}
      />
    </div>
  ),
  // Covers the non-interactive Row variant plus the required-badge and the
  // row-action button, none of which the collection case reaches.
  "content-field-rows": () => (
    <div data-probe="content-field-rows">
      <FieldsView
        collection={
          {
            id: "c1",
            name: "Posts",
            fields: [
              { id: "f1", name: "Title", slug: "title", type: "text", validation: { required: true } },
              { id: "f2", name: "Body", slug: "body", type: "richtext" },
            ],
          } as never
        }
        onBack={() => {}}
        onAddField={async () => {}}
        onDeleteField={async () => {}}
      />
    </div>
  ),
  // Renders the menu itself, not a trigger — the converted markup IS the menu,
  // so a case that only mounted a button would measure nothing that changed.
  "folder-context-menu": () => (
    <div data-probe="folder-context-menu">
      <FolderContextMenu
        folderId="f1"
        folderName="Screenshots"
        x={40}
        y={40}
        onClose={() => {}}
        onRename={() => {}}
        onDelete={() => {}}
      />
    </div>
  ),
  // The empty-state render path, so the baseline also covers styles that only
  // appear through real JSX rather than through the S map alone.
  // POPULATED. An all-zero RootView early-returns its empty state
  // (ContentViews.tsx:169), so a zeros-only case renders none of the rows and
  // would pass parity against code it never executed. That false green is the
  // exact failure this harness exists to prevent; it caught itself here.
  "content-root-rows": () => (
    <div data-probe="content-root-rows">
      <RootView
        collections={[{ id: "c1", name: "Posts" } as never, { id: "c2", name: "Authors" } as never]}
        recordCounts={{ c1: 12, c2: 3 }}
        sourcesCount={2}
        variablesCount={5}
        conditionsCount={1}
        onOpenCollection={() => {}}
        onCreateCollection={() => {}}
        onOpenSources={() => {}}
        onOpenVariables={() => {}}
        onOpenConditions={() => {}}
      />
    </div>
  ),
  /**
   * T2 — the component all seven drawers share, and the one nothing measured.
   *
   * `8160d7d3` moved every drawer header to 11px UPPERCASE with 0.08em
   * tracking. No probe case rendered it, and `TRACKED` did not carry
   * `text-transform` until T1, so the property the header decision turns on was
   * invisible to every instrument in the repo. This case plus those two
   * properties is what makes T3's reversal to Title Case a visible change
   * rather than a silent one.
   *
   * The subtitle is not decoration here: `PanelFrame.tsx:88` re-normalises case
   * and tracking for it (`tw:normal-case tw:tracking-normal`), so a case
   * without one would measure the header's treatment and miss the exception
   * sitting inside it.
   */
  "panel-frame-header": () => (
    <div data-probe="panel-frame-header">
      <PanelFrame>
        <PanelFrame.Header
          title="Media"
          subtitle="53 blocks · 6 categories"
          isPinned={false}
          onPinToggle={() => {}}
          onHelpClick={() => {}}
          onClose={() => {}}
        />
        <PanelFrame.Body>
          <div />
        </PanelFrame.Body>
      </PanelFrame>
    </div>
  ),
  // ── Media drawer states (T6) — the 320 drawer the board specifies ─────────
  "media-drawer-grid": () => <div data-probe="media-drawer-grid">{mediaDrawer()}</div>,
  // One card, so a conformance target for `Card / media` resolves to exactly
  // one element — measure.mjs refuses ambiguity, and rightly: whichever card
  // happened to be first would be measured silently.
  "media-drawer-single": () => (
    <div data-probe="media-drawer-single">
      {mediaDrawer({
        libraryItems: [MEDIA_ITEMS[1]],
        counts: { all: 1, img: 1, vid: 0, ico: 0, fnt: 0 },
      })}
    </div>
  ),
  "media-drawer-loading": () => (
    <div data-probe="media-drawer-loading">
      {mediaDrawer({ loading: true, libraryItems: [], counts: MEDIA_COUNTS })}
    </div>
  ),
  "media-drawer-load-error": () => (
    <div data-probe="media-drawer-load-error">
      {mediaDrawer({ loadError: "IndexedDB is unavailable in this browser", onRetryLoad: () => {}, libraryItems: [] })}
    </div>
  ),
  "media-drawer-empty": () => (
    <div data-probe="media-drawer-empty">
      {mediaDrawer({ libraryItems: [], counts: { all: 0, img: 0, vid: 0, ico: 0, fnt: 0 } })}
    </div>
  ),
  // A library that HAS assets and a filter that matches none of them. Distinct
  // from empty on purpose: the board draws two different screens, and the code
  // has two different branches that only differ by which one it reaches.
  "media-drawer-no-results": () => (
    <div data-probe="media-drawer-no-results">{mediaDrawer({ searchQuery: "zzzz" })}</div>
  ),
  "media-drawer-folder-scoped": () => (
    <div data-probe="media-drawer-folder-scoped">
      {mediaDrawer({
        currentFolderId: "f1",
        allFolders: [
          { id: "f1", name: "Brand", parentId: null, createdAt: "", updatedAt: "" },
          { id: "f2", name: "Screenshots", parentId: null, createdAt: "", updatedAt: "" },
        ],
        onFolderChange: () => {},
        libraryItems: [MEDIA_ITEMS[0], MEDIA_ITEMS[1]],
        counts: { all: 2, img: 2, vid: 0, ico: 0, fnt: 0 },
      })}
    </div>
  ),
  "media-drawer-bulk-select": () => (
    <div data-probe="media-drawer-bulk-select">
      {mediaDrawer({
        selectionMode: true,
        selectedKeys: new Set(["a1", "a2", "a3", "a4"]),
        onToggleSelect: () => {},
        onExitSelection: () => {},
        onBulkMove: () => {},
        onBulkDelete: () => {},
      })}
    </div>
  ),
  "media-drawer-uploading": () => (
    <div data-probe="media-drawer-uploading">{mediaDrawer({ uploadQueue: ACTIVE_UPLOAD })}</div>
  ),
  "media-drawer-upload-failed": () => (
    <div data-probe="media-drawer-upload-failed">{mediaDrawer({ uploadQueue: FAILED_UPLOAD })}</div>
  ),
  // Quota pressure changes the upload zone's own copy and tint, which is a
  // state of the footer rather than of the grid.
  "media-drawer-quota-full": () => (
    <div data-probe="media-drawer-quota-full">
      {mediaDrawer({ storage: { used: 500 * 1024 * 1024, total: 500 * 1024 * 1024 } })}
    </div>
  ),
};

const name = new URLSearchParams(location.search).get("case") ?? "";
const render = CASES[name];
const el = document.getElementById("probe-root")!;

if (!render) {
  // Fail loudly and machine-readably. A probe that renders an empty page on a
  // typo'd case name would let the parity spec pass against nothing.
  el.setAttribute("data-probe-error", `unknown case: ${name || "(none)"}`);
  el.textContent = `unknown case: ${name || "(none)"}. known: ${Object.keys(CASES).join(", ")}`;
} else {
  createRoot(el).render(<React.StrictMode>{render()}</React.StrictMode>);
  el.setAttribute("data-probe-ready", name);
}
