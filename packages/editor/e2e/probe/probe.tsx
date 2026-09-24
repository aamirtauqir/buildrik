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
/* flowbite-react's `tw:` prefix, BEFORE any flowbite component renders.
   Without this the probe measured bare OS buttons, not our components:
   flowbiteStore.ts:15 — "with prefix set but version undefined, resolveTheme's
   prefix branch never fires and classes render unprefixed" — and unprefixed
   classes do not exist in a `tw:`-prefixed Tailwind build, so every flowbite
   class resolved to nothing. The proof was sitting in the committed baseline:
   a `<Button size="xs">` recorded background-color rgb(239,239,239)
   (UA buttonface), color black, border-radius 0px, font-size 16px.
   Production was never affected — demo/main.tsx and the dashboard's
   EditorClient both mount AquibraStudio, which imports it at :56 — so this
   was a measurement bug, not a product bug. It is the worse kind: five
   "WCAG violations" were found and fixed against numbers that came from
   unstyled elements. */
import "@/editor/chrome-ui/flowbiteStore";
import "@/themes/fonts.css";
import "@/themes/default.css";

import { RootView } from "@/editor/sidebar/tabs/content/ContentViews";
import { OnboardingChecklist } from "@/editor/onboarding/OnboardingChecklist";
import { AchievementPrompt } from "@/editor/onboarding/AchievementPrompt";
import { SaveStatus } from "@/editor/chrome-ui";
import { LoadErrorBanner } from "@/editor/shell/LoadErrorBanner";
import { DEFAULT_ONBOARDING_STEPS } from "@/shared/constants/onboardingSteps";
import { CanvasFooterToolbar } from "@/editor/canvas/CanvasFooterToolbar";
import { PanelFrame } from "@/editor/chrome-ui";
import { SlimLauncher } from "@/editor/sidebar/tabs/media/components/SlimLauncher";
import { AssetDetailOverlay } from "@/editor/sidebar/tabs/media/components/AssetDetailOverlay";
import { IconBrowserOverlay } from "@/editor/sidebar/tabs/media/components/IconBrowserOverlay";
import { getAllIcons } from "@/shared/constants/icons";
import { STORAGE_KEYS } from "@/shared/constants/storageKeys";
import { StockBrowserOverlay } from "@/editor/sidebar/tabs/media/components/StockBrowserOverlay";
import { ReplaceAcrossDialog } from "@/editor/sidebar/tabs/media/components/ReplaceAcrossDialog";
import { MediaLibraryPanel } from "@/editor/media/MediaLibraryPanel";
import { LibraryManager } from "@/editor/media/LibraryManager";
import { ImageEditorModal } from "@/editor/media/ImageEditorModal";
import { ToastProvider, useToast } from "@/editor/chrome-ui";
import { ContentTab } from "@/editor/sidebar/tabs/content/ContentTab";
import { saveSiteVariables } from "@/editor/sidebar/tabs/content/contentPanelUtils";
import { CMSCollectionSetupModal } from "@/editor/shell/modals/CMSCollectionSetupModal";
import { LayersTab } from "@/editor/sidebar/tabs/layers/LayersTab";
import { Composer } from "@/engine/Composer";
import { LayersLoadError, LayersNoResults } from "@/editor/panels/layers/components/LayersStateBlocks";
import { Row as InsertRow } from "@/editor/sidebar/tabs/build/components/GroupSection";
import { BuildTab } from "@/editor/sidebar/tabs/build/BuildTab";
import type { ComponentDefinition } from "@/shared/types/components";
import { PagesLoadingSkeleton } from "@/editor/sidebar/tabs/pages/components/PagesStateBlocks";
/* AgentPlan carries `.bd-ai-*` styles that only AITab imports, so the probe
   loads the panel's stylesheet the way production does. */
import "@/editor/sidebar/tabs/ai/AITab.css";
import { AgentPlan } from "@/editor/sidebar/tabs/ai/AgentPlan";
import type { RunStep } from "@/editor/sidebar/tabs/ai/hooks/useAgentRunner";
import { ApprovedCompareView } from "@/editor/panels/version-history/ApprovedCompareView";
import type { ComparePage } from "@/shared/utils/html";
import { ComponentsTab } from "@/editor/sidebar/tabs/ComponentsTab";
import { ComponentDetailScreen } from "@/editor/sidebar/tabs/component-library/ComponentDetailScreen";
import { DSModeProvider } from "@/editor/design-system/state/DSModeContext";
import {
  BrandWorkspace,
  TokenRegistryProvider,
  StylePresetRegistryProvider,
} from "@/editor/design-system";
import { LayerTreeItem } from "@/editor/panels/layers/LayerTreeItem";
import type { LayerItem } from "@/editor/panels/layers/types";
import { HistoryTab } from "@/editor/sidebar/tabs/history/HistoryTab";
import { MilestoneSuggestionBanner } from "@/editor/sidebar/tabs/history/components/MilestoneSuggestionBanner";
import { PublishHistory } from "@/editor/shell/PublishHistory";
import { IssuesPanel } from "@/editor/shell/IssuesPanel";
import { ConfirmDialog } from "@/editor/chrome-ui";
import { ExportModal } from "@/editor/export/ExportModal";
import { ConflictModal } from "@/editor/shell/modals/ConflictModal";
import type { Issue } from "@/editor/shell/hooks/useStudioState";
import type { HistoryDisplayEntry } from "@/engine/historyTypes";
import type { LibraryItem } from "@/editor/sidebar/tabs/media/data/mediaTypes";
import type { UploadProgress } from "@/shared/types/media";
import { PageList } from "@/editor/sidebar/tabs/pages/components/PageList";
import { ConfirmDeleteModal } from "@/editor/sidebar/tabs/media/components/ConfirmDeleteModal";
import { ImportUrlModal } from "@/editor/media/components/ImportUrlModal";
import { ApplyProgressOverlay } from "@/editor/sidebar/tabs/templates/ApplyProgressOverlay";
import { PublishTab } from "@/editor/sidebar/tabs/publish/PublishTab";
import {
  CreatePageConfirmModal,
  CreatePageErrorModal,
  CreatePageSuccessModal,
} from "@/editor/sidebar/tabs/templates/TemplatesTabModals";
import type { UsePublishJobResult } from "@/editor/shell/hooks/usePublishJob";
import type { PageItem } from "@/editor/sidebar/tabs/pages/types";
import { PageTabBar } from "@/editor/shell/PageTabBar";
import { NotificationPanel } from "@/editor/shell/NotificationPanel";
import { PublishConfirmModal } from "@/editor/shell/modals/PublishConfirmModal";
import { PageContextMenu } from "@/editor/sidebar/tabs/pages/components/PageContextMenu";
import { PageSettingsDrawer } from "@/editor/sidebar/tabs/pages/page-settings/PageSettingsDrawer";
import { Topbar } from "@/editor/chrome-ui";
import { SmartGuidesOverlay } from "@/editor/canvas/overlays";
import type { SnapLine } from "@/editor/canvas/hooks";
import { DropFeedbackOverlay } from "@/editor/canvas/overlays";
import { KeyboardCheatSheet } from "@/editor/canvas/controls/KeyboardCheatSheet";
import { AnimationEditor } from "@/editor/animation/AnimationEditor";
import { useHistoryFeedback } from "@/editor/shell/hooks/useHistoryFeedback";
import {
  SiteSettingsScreen,
  DomainsScreen,
  SeoScreen,
  AnalyticsScreen,
  AdvancedScreen,
  HeadersScreen,
  RedirectsScreen,
  FormsScreen,
  WebhooksScreen,
  LocalizationScreen,
} from "@/editor/sidebar/tabs/settings/screens";
import type { PageData } from "@/shared/types";
import { ReviewTab } from "@/editor/sidebar/tabs/review/ReviewTab";
import { PublishGateModal, type PublishGateReason } from "@/editor/shell/modals/PublishGateModal";
import { StaleApprovalModal } from "@/editor/shell/modals/StaleApprovalModal";
import { CommentLayer } from "@/editor/canvas/comments/CommentLayer";
import { EVENTS } from "@/shared/constants/events";


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
 *
 * Each case hosts the drawer at `tw:h-203 tw:w-70` — 812 x 280, the frame every
 * Media board is drawn in. The cases mounted it bare until 2026-09-08, so the
 * panel collapsed to its content (430px in the no-results case) and the footer
 * sat under the last row instead of at the panel foot. Every board pins it to
 * the bottom, and nothing had measured the difference.
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
      activeTypes={new Set()}
      counts={MEDIA_COUNTS}
      searchQuery=""
      storage={{ used: 42 * 1024 * 1024, total: 500 * 1024 * 1024 }}
      uploadQueue={[]}
      usageMap={new Map([["a1", 3]])}
      onInsert={() => {}}
      onToggleType={() => {}}
      onSearchChange={() => {}}
      onUpload={async () => []}
      onRetryUpload={() => {}}
      onOpenDetail={() => {}}
      onOpenIconPicker={() => {}}
      onOpenStock={() => {}}
      onOpenLibrary={() => {}}
      onToggleSelection={() => {}}
      onClose={() => {}}
      {...over}
    />
  );
}

const ACTIVE_UPLOAD: UploadProgress[] = [
  { fileName: "pasta-2.jpg", progress: 62, status: "uploading" },
];

/* The limit in this string is the engine's for a JPG (`MEDIA_SIZE_LIMITS.
   MAX_IMAGE_SIZE`, 10 MB) — the copy `validateFile` produces. It read
   "50 MB" while UploadZone carried its own `MAX_FILE_BYTES`, a ceiling the
   engine never had; that gate is gone (Clone 3584:45522). No `failedUploads`
   record here, so the row keeps V1 145:148's Retry, which recipe
   media-upload-failed measures; the Clone's `Choose a smaller file…` door
   needs a record with `limit` and belongs to that frame's own recipe. */
const FAILED_UPLOAD: UploadProgress[] = [
  { fileName: "pasta-2.jpg", progress: 0, status: "error", error: "Upload failed — file is 62 MB, the limit is 10 MB per file" },
];

/**
 * Drill-in fixtures (boards 146:2 / 146:68 / 147:2 / 147:55).
 *
 * The drill-ins are `absolute inset-0`, so each needs a positioned host at the
 * drawer's own 320 to be measurable at all — mounting one bare stretches it to
 * the probe root and every width reads wrong.
 *
 * `versions` (146:32) used to be deliberately absent, on the reasoning that
 * its rows "come from IndexedDB". They do not: `reloadDbVersions` calls
 * `listAssetVersions`, which is a tRPC read over the wire (MediaVersionService
 * :34), and the probe already answers that transport for the review surfaces.
 * So the versions case stubs `media.listAssetVersions` — the component mounts
 * exactly as it ships and the only thing faked is what the server said. The
 * old reasoning is what left a board with four drawn rows measured against a
 * screen that had none.
 */
const DETAIL_ITEM: LibraryItem = MEDIA_ITEM({
  key: "hero",
  name: "hero-dark.jpg",
  size: 840 * 1024,
  width: 2400,
  height: 1600,
  altText: "Dark restaurant interior with…",
});

/**
 * Restore points as `media.listAssetVersions` returns them: newest first, and
 * `assetId` present on the ITEM (without it `reloadDbVersions` short-circuits
 * to an empty list before any request is made). The byte deltas are what the
 * board's "+12 KB / −4 KB / original" column is computed FROM — the overlay
 * derives each row's label by differencing with its successor, so the fixture
 * supplies sizes rather than the labels themselves.
 */
/* The optimise drill-in needs a source that actually SHRINKS. The shared
   fixture is a 1x1 GIF, which WebP-encodes ten times larger, so the panel drew
   its "+1069%" warning branch — the one state board 1124:4584 does not draw.
   A 2400x1600 SVG carrying a padded comment gives a real byte count to start
   from and a flat image that compresses to almost nothing, so the success
   branch (green, a negative percentage) is what gets measured. */
const OPTIMISE_ITEM: LibraryItem = MEDIA_ITEM({
  key: "hero",
  name: "hero-dark.jpg",
  size: 840 * 1024,
  width: 2400,
  height: 1600,
  src:
    "data:image/svg+xml," +
    encodeURIComponent(
      "<svg xmlns='http://www.w3.org/2000/svg' width='2400' height='1600'>" +
        "<rect width='2400' height='1600' fill='#334155'/><!--" +
        "padding".repeat(9000) +
        "--></svg>",
    ),
});

const VERSIONED_ITEM: LibraryItem = MEDIA_ITEM({
  key: "hero",
  name: "hero-dark.jpg",
  assetId: "asset-hero",
  size: 840 * 1024,
  width: 2400,
  height: 1600,
  altText: "Dark restaurant interior with…",
});

const DAY = 24 * 60 * 60 * 1000;
const ASSET_VERSIONS = [
  { id: "v3", assetId: "asset-hero", url: VERSIONED_ITEM.src, bytes: 852_000, edits: {}, createdAt: new Date(Date.now() - 2 * DAY).toISOString() },
  { id: "v2", assetId: "asset-hero", url: VERSIONED_ITEM.src, bytes: 840_000, edits: {}, createdAt: new Date(Date.now() - 5 * DAY).toISOString() },
  { id: "v1", assetId: "asset-hero", url: VERSIONED_ITEM.src, bytes: 844_000, edits: {}, createdAt: new Date(Date.now() - 12 * DAY).toISOString() },
];

/** Pages shaped for `collectUsageByPage`: Home ×2, Menu ×1 (board 146:68). */
const USAGE_PAGES = [
  {
    id: "home",
    name: "Home",
    root: {
      id: "r1",
      type: "container",
      children: [
        { id: "e1", type: "image", attributes: { src: DETAIL_ITEM.src, "data-name": "hero" } },
        { id: "e2", type: "image", attributes: { src: DETAIL_ITEM.src, "data-name": "gallery" } },
      ],
    },
  },
  {
    id: "menu",
    name: "Menu",
    root: {
      id: "r2",
      type: "container",
      children: [
        { id: "e3", type: "image", attributes: { src: DETAIL_ITEM.src, "data-name": "header" } },
      ],
    },
  },
];

/**
 * `mediaOps.getUsagesByPage` is what `collectUsageByPage` actually calls
 * (mediaUtils.ts:162); this fixture only answered `elements.getAllPages`, so
 * the used-in case had been rendering the EMPTY state — "Not used on any
 * page" — for as long as it has existed, and nothing noticed because no
 * recipe measured it. Found 2026-09-08 while joining board 75:2.
 */
const usageEl = (id: string, name: string) => ({
  getId: () => id,
  getType: () => "image",
  getAttribute: (attr: string) => (attr === "data-name" ? name : undefined),
});

const USAGE_COMPOSER = {
  mediaOps: {
    getUsagesByPage: () =>
      new Map<string, unknown[]>([
        ["home", [usageEl("e1", "hero"), usageEl("e2", "gallery")]],
        ["menu", [usageEl("e3", "header")]],
      ]),
  },
  elements: {
    getAllPages: () => USAGE_PAGES,
    setActivePage: () => {},
    getElement: () => null,
  },
  selection: { select: () => {} },
} as unknown as React.ComponentProps<typeof AssetDetailOverlay>["composer"];


/**
 * Fullpage library fixture (boards 1159:4593 / 1162:4617 / 1163:4641 /
 * 1163:13695 / 1163:13948).
 *
 * The fullpage manager cannot be measured in the running demo: it reads a
 * library out of IndexedDB and a fresh demo project has none, so every one of
 * these five boards would be measured against the empty state. LibraryManager
 * mounts here exactly as it ships — `useMediaState` runs, all four sub-hooks
 * run, FolderTree/AssetGrid/AssetDetailsPanel are the real components — and
 * the fixture answers only the `composer.media` / `composer.mediaOps` calls
 * those hooks make.
 *
 * The manager is `position: fixed`-free but sized by its own `.mgr` grid, so
 * the host is the board's own middle band: 1380 x 844 (1440 less the 60 rail,
 * 900 less the 56 topbar). Measuring it at the raw viewport would compare a
 * 1440-wide manager against a board that draws 1380.
 */
const MGR_NAMES = [
  "hero-kitchen.jpg", "menu-cover.png", "chef-intro.mp4", "team-photo.jpg",
  "logo-mark.svg", "pasta-closeup.jpg", "grand-opening.mp4", "star-icon.svg",
  "Inter-Var.woff2", "terrace-night.jpg",
];
const MGR_MIME: Record<string, string> = {
  jpg: "image/jpeg", png: "image/png", mp4: "video/mp4",
  svg: "image/svg+xml", woff2: "font/woff2",
};
const MGR_ASSETS = MGR_NAMES.map((name, i) => {
  const ext = name.split(".").pop() as string;
  return {
    id: `mg${i}`,
    type: (ext === "mp4" ? "video" : ext === "svg" ? "svg" : ext === "woff2" ? "font" : "image"),
    name,
    originalName: name,
    /* Distinct per asset, and that is load-bearing: `getUsages` is keyed by
       SRC, so a fixture where every asset shares one data URI reports the same
       usage for all ten and the in-use / unused smart folders both return
       everything. The fragment does not change what the browser decodes. */
    src: `${MEDIA_ITEM().src}#mg${i}`,
    thumbnailSrc: MEDIA_ITEM().src,
    mimeType: MGR_MIME[ext] ?? "application/octet-stream",
    /* The quota bar's FILL is a width, so it is only measurable if the fixture
       stands where the board stands: 1160:59 draws 22 of a 120 track, i.e.
       18.333% of the 1 GB local cap, which is 19_685_267 bytes x 10 assets.
       The megabyte figures on the cards are sample data; the proportion is
       the geometry. */
    size: 19_685_267,
    width: 1920,
    height: 1080,
    tags: i % 3 === 0 ? ["menu"] : i % 3 === 1 ? ["team"] : ["food"],
    createdAt: new Date(Date.now() - i * 3_600_000).toISOString(),
    updatedAt: new Date(Date.now() - i * 3_600_000).toISOString(),
  };
});
const MGR_FOLDERS = [
  { id: "f1", name: "Products", parentId: null, createdAt: "2026-08-01T10:00:00.000Z" },
  { id: "f2", name: "Hero shots", parentId: null, createdAt: "2026-08-01T10:00:00.000Z" },
  { id: "f3", name: "Icons", parentId: null, createdAt: "2026-08-01T10:00:00.000Z" },
];

/**
 * `getUsages` is what drives BOTH the in-use/unused smart folders and the
 * per-card usage pip, so the counts the board draws ("● In use 14 / ○ Unused
 * 10") come from this one answer rather than from three fixture constants that
 * could disagree with each other. Six of ten are used; the unused four are what
 * board 1163:13695's unused scope is drawn against.
 */
const MGR_UNUSED = new Set(["mg3", "mg6", "mg9"]);
const mgrComposer = (assets: typeof MGR_ASSETS = MGR_ASSETS) =>
  ({
    media: {
      on: () => {},
      off: () => {},
      isInitialized: true,
      initFailure: null,
      getAssets: (opts?: { folderId?: string | null }) =>
        opts?.folderId ? [] : assets,
      getAsset: (id: string) => assets.find((a) => a.id === id),
      getAssetSrc: async () => MEDIA_ITEM().src,
      getFolders: () => MGR_FOLDERS,
      getAllFolders: () => MGR_FOLDERS,
      getServerPage: () => null,
      setServerPage: () => {},
      importServerAssets: () => {},
      retryInit: async () => {},
      updateAsset: async () => {},
      deleteAsset: async () => {},
      createFolder: async () => {},
      deleteFolder: async () => {},
      renameFolder: async () => {},
      uploadFile: async () => ({ success: true }),
      downloadAssets: () => 0,
      getIcons: () => [],
      getFonts: () => [],
    },
    mediaOps: {
      getUsages: (src: string) => ({
        count: MGR_UNUSED.has(String(src).split("#")[1] ?? "") ? 0 : 2,
        elements: [],
      }),
      getUsagesByPage: () => new Map(),
      insertMedia: () => {},
      insertMediaAt: () => {},
      replaceMedia: () => {},
    },
    elements: { getAllPages: () => USAGE_PAGES, getElement: () => null, setActivePage: () => {} },
    selection: { select: () => {} },
    on: () => {},
    off: () => {},
    emit: () => {},
  }) as unknown as React.ComponentProps<typeof LibraryManager>["composer"];

/**
 * Puts the manager into its drag-over state by dispatching a REAL dragenter
 * carrying a real File, which is the only way in: `isDragOver` is
 * LibraryManager's own state and its handler tests
 * `dataTransfer.types.includes("Files")`, so a synthetic event with an empty
 * DataTransfer is ignored — correctly. Nothing about the component is faked;
 * the pointer is.
 */
function AutoDragOver({ children }: { children: React.ReactNode }) {
  const host = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const el = host.current?.querySelector<HTMLElement>('[data-testid="mgr-root"]');
    if (!el) return;
    const dt = new DataTransfer();
    dt.items.add(new File(["x"], "terrace-night.jpg", { type: "image/jpeg" }));
    el.dispatchEvent(new DragEvent("dragenter", { dataTransfer: dt, bubbles: true }));
  }, []);
  return <div ref={host} style={{ display: "contents" }}>{children}</div>;
}

/** The board's own middle band, so widths are read at the scale it draws. */
function mgrHost(children: React.ReactNode) {
  return (
    <ToastProvider>
      <div style={{ width: 1380, height: 844, position: "relative", overflow: "hidden" }}>
        {children}
      </div>
    </ToastProvider>
  );
}

/**
 * Media picker fixture (board 1164:4713).
 *
 * MediaLibraryPanel reads through `useMediaManager`, which is three
 * `composer.media` calls and an event subscription — so the fixture answers
 * those and the panel mounts as it ships. The live picker cannot be measured
 * instead: it opens from an element that needs an asset, and a fresh demo
 * project has neither the element nor the library.
 */
const PICKER_ASSETS = Array.from({ length: 8 }, (_, i) => ({
  id: `pk${i}`,
  type: "image" as const,
  name: ["hero-kitchen.jpg", "menu-cover.png", "chef-intro.jpg", "team-photo.jpg", "logo-mark.svg", "pasta-closeup.jpg", "grand-opening.jpg", "terrace-night.jpg"][i],
  originalName: "file.jpg",
  src: MEDIA_ITEM().src,
  thumbnailSrc: MEDIA_ITEM().src,
  mimeType: "image/jpeg",
  size: 412_000,
  width: 1920,
  height: 1080,
  tags: [],
  createdAt: "2026-08-04T10:00:00.000Z",
  updatedAt: "2026-08-04T10:00:00.000Z",
}));

const PICKER_COMPOSER = {
  media: {
    on: () => {},
    off: () => {},
    getAssets: () => PICKER_ASSETS,
    getAsset: (id: string) => PICKER_ASSETS.find((a) => a.id === id),
  },
} as unknown as React.ComponentProps<typeof MediaLibraryPanel>["composer"];

/**
 * Replace-across fixture (board 1164:4738 — the picker half).
 *
 * The dialog reads its page list from the SAME two calls the used-in view
 * makes, so it reuses USAGE_COMPOSER's answers and adds only the commit verb.
 * The result half is the Clone's ReplaceResultModal (3695:43897 … 3695:43906)
 * since 2026-09-14, verified by the live walk against the Clone shots; the
 * `media-replace-across-result` case that clicked through to V1 board
 * 1174:4849's states went with that board.
 */
const RX_RESULT_PARTIAL = {
  replaced: [{ elementId: "e1" }, { elementId: "e2" }],
  failed: [{ elementId: "e3", error: "element is locked" }],
  clean: false,
};

const RX_COMPOSER = {
  mediaOps: {
    getUsagesByPage: () =>
      new Map<string, unknown[]>([
        ["home", [usageEl("e1", "hero"), usageEl("e2", "gallery")]],
        ["menu", [usageEl("e3", "header")]],
      ]),
    replaceAcrossSelective: () => RX_RESULT_PARTIAL,
  },
  elements: { getAllPages: () => USAGE_PAGES },
} as unknown as React.ComponentProps<typeof ReplaceAcrossDialog>["composer"];

function rxDialog() {
  return (
    <ReplaceAcrossDialog
      composer={RX_COMPOSER}
      oldSrc={MEDIA_ITEM().src}
      newSrc={MEDIA_ITEM().src}
      oldLabel="pasta-closeup.jpg"
      newLabel="pasta-closeup-v2.jpg"
      onClose={() => {}}
    />
  );
}

/** Fires one toast per tone, sticky, so the catalog can be measured at rest. */
function ToastCatalogFirer() {
  const { addToast } = useToast();
  React.useEffect(() => {
    const rows = [
      { tone: "success" as const, title: "Saved", description: "Project saved successfully" },
      { tone: "info" as const, title: "Offline — changes queued", description: "Your edits are saved on this device and will sync when you're back." },
      { tone: "error" as const, title: "Save failed", description: "Network error — check your internet connection and try again.", action: { label: "Retry", onClick: () => {} } },
      { tone: "warning" as const, title: "Approval needed", description: "This site needs an approved review before it can be published." },
      { tone: "neutral" as const, title: "Undo", description: "Deleted 'Button'", action: { label: "Redo", onClick: () => {} } },
    ];
    for (const r of rows) addToast({ ...r, duration: Infinity });
  }, [addToast]);
  return <div data-probe="toast-catalog" />;
}

/**
 * The drill-in's own stage, at the size its boards are actually drawn.
 *
 * This was 320×840 (`tw:w-80`), and every drill-in board it hosts —
 * 146:2 asset-detail, 146:32 versions, 146:68 used-in, 147:2 icon-picker,
 * 147:55 stock-browser — is **280** wide. So four surfaces were measured 40px
 * wider than the thing they are compared against, and every width, wrap point
 * and truncation read from them was wrong at the source (F4).
 *
 * 280 × 812 is the drawer body: 900 viewport − 56 topbar − 32 footer. Written
 * on the spacing scale rather than as `[840px]`, because Gate 14 bans layout
 * literals and an arbitrary-value class would trip it.
 */
function drillHost(children: React.ReactNode) {
  return (
    <ToastProvider>
      <div className="tw:relative tw:h-203 tw:w-70 tw:overflow-hidden tw:bg-white">{children}</div>
    </ToastProvider>
  );
}

/**
 * Components · library fixture (board 641:2546).
 *
 * The live panel is EMPTY and cannot be made otherwise by clicking: components
 * are persisted per project (ComponentStorage), and a fresh demo has none — so
 * the four-row list the board draws has never been measurable. This answers
 * exactly the calls `useComponentsState` makes and nothing else; anything more
 * would be a second Composer to keep in sync.
 *
 * Names and counts are the board's own sample row set, kept so the row widths
 * a measurement reads are the widths the board drew.
 */
const COMPONENT_ROWS = [
  { id: "c1", name: "Site header", instances: 6 },
  { id: "c2", name: "Footer", instances: 6 },
  { id: "c3", name: "Menu card", instances: 18 },
  { id: "c4", name: "CTA band", instances: 3 },
];

const COMPONENTS_COMPOSER = {
  on: () => {},
  off: () => {},
  selection: { getSelectedIds: () => [] },
  components: {
    isAvailable: () => true,
    getAllComponents: () => COMPONENT_ROWS.map((r) => ({ id: r.id, name: r.name })),
    getInstancesOfComponent: (id: string) =>
      new Array(COMPONENT_ROWS.find((r) => r.id === id)?.instances ?? 0).fill(null),
  },
} as unknown as React.ComponentProps<typeof ComponentsTab>["composer"];

/**
 * Components · detach-confirm fixture (board 1170:4792, right-hand half).
 *
 * Three conditions gate this dialog and none can be arranged by clicking in
 * the demo: a saved component, an INSTANCE of it selected on the canvas, and
 * the design system in `pro` mode. AutoOpen presses the Detach button the
 * panel itself renders, so the dialog under measurement is the shipped one.
 */
const DETACH_COMPONENT = {
  id: "c3",
  name: "Menu card",
  createdAt: 0,
  updatedAt: 0,
  version: 1,
  masterTree: { id: "e1", type: "container" },
} as unknown as React.ComponentProps<typeof ComponentDetailScreen>["component"];

const DETACH_COMPOSER = {
  on: () => {},
  off: () => {},
  selection: { getSelectedIds: () => ["el-1"] },
  components: {
    isAvailable: () => true,
    getInstancesOfComponent: () => new Array(18).fill(null),
  },
} as unknown as React.ComponentProps<typeof ComponentDetailScreen>["composer"];

/**
 * Brand · load-error fixture (board 781:4311; the drawer it drew is archived —
 * the surface is the Brand workspace since C1 (i), 2026-09-22).
 *
 * The state is the `error` branch of `BrandWorkspace`, and nothing a user can
 * click produces it: `loadFromComposer` only sets `error` when reading the
 * project's own settings THROWS. So the composer here throws from
 * `getProjectSettings`, which is the one call that branch depends on, and the
 * surface under measurement is the real one — real PanelErrorState, real
 * copy, mounted under the same three providers `StudioPanels.tsx:405-407`
 * wraps it in. Nothing about the error block is re-drawn here.
 */
const BRAND_ERROR_COMPOSER = {
  on: () => {},
  off: () => {},
  emit: () => {},
  getProjectSettings: () => {
    throw new Error("design tokens unavailable");
  },
  elements: { getAllElements: () => [] },
  /* Everything below is answered because the panel asks for it on the way to
     the error branch, not because the branch needs it: `useDSLint` calls
     `composer.dsLinter.lint()` unguarded, `colorMode.resolved()` seeds the
     panel's `data-ds-preview`, and `designSystem.lintState` is where the hook
     publishes what it found. A stub thinner than this throws before the error
     state can render. */
  dsLinter: { lint: () => [] },
  colorMode: { resolved: () => "light" },
  designSystem: {
    lintState: {
      setAllIssues: () => {},
      suppressedCount: () => 0,
      getVisibleIssues: () => [],
      on: () => {},
      off: () => {},
    },
    tokenUsage: null,
  },
} as unknown as React.ComponentProps<typeof BrandWorkspace>["composer"];

/**
 * Layers · component-instance fixture (board 1082:4739).
 *
 * The board's own title says what this is: "NOT A STATE — a per-row badge
 * gated on composer.components.isInstance". Reaching it in the demo would take
 * a saved component AND a placed instance of it; the badge is a property of
 * the row, so the row is what is mounted. `isInstance` is the one composer
 * call LayerTreeItem makes.
 */
const LAYER_ROW = (over: Partial<LayerItem>): LayerItem => ({
  id: "l0",
  type: "container",
  tagName: "div",
  depth: 0,
  children: [],
  ...over,
});

const LAYER_TREE_COMPOSER = {
  components: { isInstance: (id: string) => id === "l1" },
} as unknown as React.ComponentProps<typeof LayerTreeItem>["composer"];

function layerRow(layer: LayerItem) {
  const noop = () => {};
  return (
    <LayerTreeItem
      key={layer.id}
      layer={layer}
      composer={LAYER_TREE_COMPOSER}
      expandedIds={new Set(["l0"])}
      dragState={{ draggedId: null, targetId: null, position: null }}
      hiddenIds={new Set()}
      lockedIds={new Set()}
      selectedIds={new Set()}
      customNames={new Map([["l0", "Page"], ["l1", "Button"]])}
      canvasHoveredId={null}
      editingId={null}
      editingName=""
      editInputRef={{ current: null }}
      onToggleExpand={noop}
      onToggleVisibility={noop}
      onToggleLock={noop}
      onStartEditing={noop}
      onSaveEditedName={noop}
      onCancelEditing={noop}
      onEditingNameChange={noop}
      onMouseEnter={noop}
      onMouseLeave={noop}
      onDragStart={noop}
      onDragEnd={noop}
      onDragOver={noop}
      onDragLeave={noop}
      onDrop={noop}
      onSelect={noop}
      onContextMenu={noop}
      getVisibleLayerIds={() => ["l0", "l1"]}
      displayPrefs={{ showDimmed: true, showLockBadges: true, treeDensity: "compact", highlightCmsBound: false, showHtmlBadges: false }}
    />
  );
}

/**
 * Insert drawer fixtures (boards 1069:4529 elements · 4707 blocks · 4790
 * components · 4970 mine).
 *
 * One case, four recipes. The four boards are the SAME panel with a different
 * group open, and `openGroups` is BuildTab's own state — there is no prop to
 * set it — so each recipe drives the header clicks itself. Mounting four
 * copies of the panel would put four `insert-group-blocks` anchors on one
 * page and measure.mjs refuses an ambiguous testid.
 *
 * The composer stub exists for MINE only: `getAllComponents` is the one call
 * BuildTab makes for that group (BuildTab.tsx:60-67), and with a null composer
 * the group's count is null and it renders no rows at all — which is the empty
 * sibling board, not 1069:4970.
 */
const MINE_COMPONENT = (id: string, name: string): ComponentDefinition => ({
  id,
  name,
  masterTree: { id: `${id}-root`, type: "container", tagName: "div", classes: [], styles: {}, children: [] },
  createdAt: 0,
  updatedAt: 0,
  version: 1,
});

const MINE_COMPONENTS: ComponentDefinition[] = [
  MINE_COMPONENT("mine-1", "Hero (dark)"),
  MINE_COMPONENT("mine-2", "Pricing card"),
  MINE_COMPONENT("mine-3", "Nav bar"),
  MINE_COMPONENT("mine-4", "Footer"),
];

const INSERT_COMPOSER = {
  components: { getAllComponents: () => MINE_COMPONENTS },
  selection: { getSelectedIds: () => [] as string[] },
  elements: { getElement: () => null },
  on: () => {},
  off: () => {},
} as unknown as Composer;

/**
 * Layers drawer fixtures (boards 142:2 tree · 143:2 filtered · 143:295
 * multi-select · 1082:4589 renaming · 1171:4829 display-settings).
 *
 * A REAL Composer, not a stub. LayersTab reaches the engine through five
 * hooks — useLayerTree, useLayerSelection, useLayerActions, useLayerSearch,
 * useLayerDrag — plus useComposerSelection and useProjectLoading, and a stub
 * wide enough to satisfy all seven would be a second implementation of the
 * engine measured instead of the engine. `new Composer({})` is what the
 * engine's own tests construct.
 *
 * Element ids are given explicitly (ElementCRUD spreads `options` over the
 * generated id) so `layer-row-<id>` is a stable anchor across runs — the
 * generated `el-mpebx…` ids are not addressable by a recipe.
 */
const LAYERS_SEED = [
  { id: "lx-section", type: "section", parent: null as string | null, name: "Section" },
  { id: "lx-container", type: "container", parent: "lx-section", name: "Container" },
  { id: "lx-heading", type: "heading", parent: "lx-container", name: "Build your site in minutes" },
  { id: "lx-button", type: "button", parent: "lx-container", name: "Get started free" },
  { id: "lx-gallery", type: "container", parent: null, name: "Gallery" },
  { id: "lx-grid", type: "grid", parent: "lx-gallery", name: "Grid" },
  { id: "lx-long", type: "text", parent: null, name: "a-very-long-layer-name-that-truncates" },
  { id: "lx-footer", type: "container", parent: null, name: "Footer" },
];

let _layersComposer: Composer | null = null;
function layersComposer(): Composer {
  if (_layersComposer) return _layersComposer;
  const c = new Composer({} as never);
  const page = c.elements.createPage("Home", {
    id: "lx-page",
    /* The ROOT id is pinned for stability, though it is no longer a ROW: as of
       2026-09-08 (B6) the tree excludes the page root, so the first row is the
       first seeded element and an empty page correctly reads "0 layers". The
       id still has to be fixed because children are added under it. Same shape
       PageManager builds. */
    root: { id: "lx-root", type: "container", tagName: "div", classes: ["buildrick-page-root"], children: [] },
  });
  c.elements.setActivePage(page.id);
  const rootId = page.root.id;
  for (const s of LAYERS_SEED) {
    const el = c.elements.createElement(s.type as never, { id: s.id, content: s.name });
    c.elements.addElement(el, s.parent ?? rootId);
  }
  _layersComposer = c;
  return c;
}

/**
 * Multi-select is engine STATE, not a click away: three ids have to be in the
 * SelectionManager and `measure.mjs`'s `click` step carries no modifier keys.
 * It is driven here, on the real SelectionManager, so the recipe still
 * measures the production component in the production state.
 *
 * Renaming is NOT driven here — LayerTreeItem answers F2 (`handleKeyDown`),
 * so that recipe reaches it with a click and a keypress, entirely through the
 * shipped keyboard path.
 */
function LayersProbe({ select }: { select?: string[] }) {
  const c = layersComposer();
  React.useEffect(() => {
    if (select?.length) {
      c.selection.selectMultiple(select.map((id) => c.elements.getElement(id)!).filter(Boolean));
    }
  }, [c, select]);
  return (
    /* ToastProvider is not decoration: useLayerContextActions calls useToast
       at the top of LayersPanel, so without it the tree throws and the tab's
       own error boundary renders the load-error block instead. */
    <ToastProvider>
      <div className="tw:flex tw:h-[812px] tw:w-70 tw:flex-col tw:overflow-hidden tw:bg-white">
        <LayersTab composer={c} onClose={() => {}} />
      </div>
    </ToastProvider>
  );
}

/**
 * Clicks one testid after mount so a nested view can be probed statically.
 *
 * Scoped to its OWN subtree, not the document: the media drill-ins case mounts
 * two AssetDetailOverlays side by side, and a document-wide query clicked the
 * first one's row twice, leaving the second overlay on its hub.
 */
/*
 * `delayMs` exists because a self-closing state is a RACE, not a state.
 * `modal-success-then-close` clicked its confirm on mount; the success card
 * holds for 1.4s and then closes itself, so on an idle machine the runner
 * attached in time and on a loaded one it did not — the surface passed a full
 * sweep and then timed out on `waitFor confirm-success-closing` an hour later,
 * with nothing about the product changed.
 *
 * Delaying the click past first paint puts the window INSIDE the runner's wait
 * instead of before it. The real component still runs its real timer; only the
 * moment it starts moves.
 */
function AutoOpen({ testid, delayMs = 0, children }: { testid: string; delayMs?: number; children: React.ReactNode }) {
  const host = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    /* Host first, then the whole document — because an overlay PORTALS out of
       this subtree. `Modal` renders through the overlay root, so a host-scoped
       query finds nothing and the click silently never happens: the dialog
       stays on its first step and the recipe times out waiting for a state
       that was never triggered. That is how `modal-success-then-close` broke
       when overlay mounting changed, with nothing wrong in the recipe. */
    const fire = () => {
      const el = (host.current?.querySelector(`[data-testid="${testid}"]`)
        ?? document.querySelector(`[data-testid="${testid}"]`)) as HTMLElement | null;
      el?.click();
    };
    if (!delayMs) { fire(); return; }
    const t = setTimeout(fire, delayMs);
    return () => clearTimeout(t);
  }, [testid, delayMs]);
  return (
    <div ref={host} style={{ display: "contents" }}>
      {children}
    </div>
  );
}

/**
 * Seeds the shared RECENT_ICONS list before IconBrowserOverlay reads it in its
 * `useState` initializer.
 *
 * Board 147:2 draws the RECENT band with 12 tiles, and the band only renders
 * when there IS a recent list — so without this the probe measures a picker
 * that has no section header at all and the recipe's anchors do not exist. The
 * names come from `getAllIcons()` rather than being typed out, because
 * `readRecent` resolves each through `getIconByName` and silently drops any it
 * cannot find: a hand-written name that has been renamed would shrink the band
 * without failing anything.
 */
function withRecentIcons(children: React.ReactNode) {
  try {
    window.localStorage.setItem(
      STORAGE_KEYS.RECENT_ICONS,
      JSON.stringify(getAllIcons().slice(0, 12).map((i) => i.name)),
    );
  } catch {
    // storage unavailable — the picker renders without the band
  }
  return <>{children}</>;
}

const STOCK_PHOTOS = Array.from({ length: 4 }, (_, i) => ({
  id: `p${i}`,
  url: MEDIA_ITEM().src,
  thumb: MEDIA_ITEM().src,
  alt: "restaurant interior",
  author: "A. Nowak",
  authorUrl: "https://example.test",
  width: 1200,
  height: 800,
  source: "unsplash" as const,
}));

/**
 * History fixtures (boards 1138:4573 / 163:2 / 163:113).
 *
 * Every state these boards draw hangs off engine data no click can produce:
 * the skeleton needs a version read still in flight, the changes list needs an
 * undo stack, and time-travel needs both plus an open scrubber. The demo app
 * boots with an empty stack and a settled read, so all three measured the
 * EMPTY branch — which is exactly what boards.json recorded against 163:2
 * ("drift-undo-empty-branch-only"). The stub is the smallest object the panel
 * actually calls into; anything it does not call is deliberately absent so a
 * new dependency fails loudly here rather than being faked.
 */
const HISTORY_ENTRIES: HistoryDisplayEntry[] = [
  { id: "h0", index: 3, timestamp: Date.parse("2026-07-18T16:20:00"), label: "Hero copy edited", type: "patch", changes: [], userId: "Ali" },
  { id: "h1", index: 2, timestamp: Date.parse("2026-07-18T16:12:00"), label: "2 images replaced", type: "patch", changes: [], userId: "Ali" },
  { id: "h2", index: 1, timestamp: Date.parse("2026-07-18T16:05:00"), label: "Menu prices updated", type: "patch", changes: [], userId: "Ali" },
  { id: "h3", index: 0, timestamp: Date.parse("2026-07-18T15:58:00"), label: "Footer link fixed", type: "checkpoint", changes: [], userId: "Sara" },
];

function historyStub(
  over: {
    loadState?: "loading" | "ready" | "error";
    stack?: HistoryDisplayEntry[];
    versions?: unknown[];
  } = {},
) {
  const stack = over.stack ?? [];
  /* A REAL listener table, not three no-ops. Boards 163:269 (pruned) and
     163:220 (restoring) are driven by engine events — VersionHistoryPanel
     subscribes to VERSION_PRUNED / VERSION_RESTORING and renders the notice
     from the payload — so a stub that swallows `on` can only ever measure the
     branch where the notice is absent, which is the branch every earlier run
     measured. */
  const handlers = new Map<string, Set<(p: unknown) => void>>();
  return {
    on: (name: string, fn: (p: unknown) => void) => {
      if (!handlers.has(name)) handlers.set(name, new Set());
      handlers.get(name)!.add(fn);
    },
    off: (name: string, fn: (p: unknown) => void) => handlers.get(name)?.delete(fn),
    emit: (name: string, payload: unknown) => handlers.get(name)?.forEach((fn) => fn(payload)),
    isDirty: () => false,
    versions: {
      isAvailable: () => true,
      getVersions: () => over.versions ?? [],
      getLoadState: () => over.loadState ?? "ready",
      captureVisualSnapshot: () => null,
      maxVersions: 50,
    },
    history: {
      getHistoryStack: () => stack,
      canUndo: () => stack.length > 0,
      canRedo: () => false,
      undo: () => {},
      redo: () => {},
      clear: () => {},
      restoreEntry: () => {},
      maxHistory: 100,
    },
  } as unknown as Composer;
}

/**
 * Fire engine events once the subtree below has subscribed.
 *
 * A parent's mount effect runs AFTER its children's, which is the whole
 * mechanism here: the panel's `composer.on(...)` is in place by the time this
 * emits, so the notice renders from a real event rather than from a prop the
 * fixture invented.
 */
function EmitOnMount({
  composer,
  events,
  children,
}: {
  composer: Composer;
  events: Array<[string, unknown]>;
  children: React.ReactNode;
}) {
  React.useEffect(() => {
    for (const [name, payload] of events) composer.emit(name as never, payload as never);
  });
  return <>{children}</>;
}

/**
 * The drawer body at the width the History boards are DRAWN at.
 *
 * boards.json records 360 for this family, which is the Figma frame; the art
 * inside it is 280 — the header's ✕ sits at x252 and the prune note's text is
 * w-248, i.e. 280 less the 16px gutters. Measuring at 360 would compare every
 * width against a panel a third wider than the one the board describes.
 */
function historyHost(children: React.ReactNode) {
  return (
    // VersionHistoryPanel calls useToast for its save/restore feedback, so the
    // provider is not optional dressing — without it the panel throws and the
    // probe measures an empty page.
    <ToastProvider>
      <div className="tw:relative tw:flex tw:h-203 tw:w-70 tw:flex-col tw:overflow-hidden tw:bg-white">
        {children}
      </div>
    </ToastProvider>
  );
}

/** Seeds the stored view preference before HistoryTab reads it once on mount. */
function withStoredView(value: string, children: React.ReactNode) {
  try {
    window.localStorage.setItem("buildrick-history-view", value);
  } catch {
    // storage unavailable — the panel falls back to its own defaults
  }
  return <>{children}</>;
}

/**
 * Issues fixtures (board 164:22).
 *
 * The filtered screen needs a list the filter can HIDE something from, and the
 * live producer is the DS linter — it emits whatever the site's tokens happen
 * to be wrong about, which on a clean demo project is nothing at all. Three
 * issues, one of them a fixable error, is the board's own arithmetic: "Errors
 * only · 1" over "Two issues are hidden."
 *
 * No `pageId` on any of them, which is true of every DS-lint issue today and
 * is why the board draws no This-page/All-pages scope row.
 */
const ISSUES: Issue[] = [
  {
    id: "i1",
    type: "error",
    message: "Contrast 3.1:1 (needs 4.5)",
    location: "Button · Book a table",
    tokenId: "color.accent",
    autoFixHint: "darken",
  },
  { id: "i2", type: "warning", message: "Heading scale skips a step", location: "Type · h3" },
  { id: "i3", type: "warning", message: "Radius token unused", location: "Brand · radius.lg" },
];

/** Every case renders into `.bd-studio` so chrome-scoped CSS applies. */

/**
 * Pages fixtures (boards 141:165 load-error, 141:78 bulk-select).
 *
 * `PagesTab` derives both states from a real `Composer`: `usePages` only ever
 * sets `loadError` from a failed project sync, and a bulk selection needs
 * three checkbox clicks against real page ids. Neither is reachable with
 * `composer={null}`, so the probe mounts the SAME composition PagesTab
 * renders — PanelFrame > Header > Body(noScroll) > PageList — and hands
 * PageList the props the tab would have computed. Nothing about the markup
 * under test differs.
 */
const PAGE = (id: string, name: string, over: Partial<PageItem> = {}): PageItem =>
  ({ id, name, slug: name.toLowerCase(), ...over }) as PageItem;

const PAGES_FIXTURE: PageItem[] = [
  PAGE("home", "Home", { isHome: true, isActive: true }),
  PAGE("menu", "Menu"),
  PAGE("contact", "Contact"),
  PAGE("about", "About"),
];

/* The page the S3.7 boards draw: a filled-in Home. */
const PAGE_SETTINGS_FIXTURE: PageItem = PAGE("home", "Home", {
  isHome: true,
  isActive: true,
  slug: "home",
  seo: {
    metaTitle: "Bella Cucina — Wood-fired pizza",
    metaDescription: "Neapolitan pizza downtown. Book a table.",
    ogTitle: "Bella Cucina",
    ogDescription: "Wood-fired Neapolitan pizza.",
    ogImage: "https://bellacucina.com/home-og.jpg",
  },
} as Partial<PageItem>);

function pagesPanel(over: Partial<React.ComponentProps<typeof PageList>> = {}) {
  /* `bd-pg-panel` is not decoration: PagesTab.css hangs `--pg-row-h`,
     `--pg-icon-box` and `--pg-footer-clearance` off it, and `bulk-mode` is the
     class PagesTab adds while a selection exists. A frame without them is a
     different component. */
  const bulk = (over.selectedIds?.size ?? 0) > 0;
  return (
    <PanelFrame className={`bd-pg-panel${bulk ? " bulk-mode" : ""}`}>
      <PanelFrame.Header title="Pages" onClose={() => {}} />
      <PanelFrame.Body noScroll>
        <PageList
          pages={PAGES_FIXTURE}
          renamingPageId={null}
          nameError={null}
          composer={null}
          folders={[]}
          pageToFolder={new Map()}
          selectedIds={new Set()}
          onAddPage={() => {}}
          onAddFolder={() => {}}
          onSelectPage={() => {}}
          onToggleSelect={() => {}}
          onBulkDuplicate={() => {}}
          onBulkMoveToFolder={() => {}}
          onBulkRemoveFromFolders={() => {}}
          onBulkDelete={() => {}}
          onClearSelection={() => {}}
          onContextMenu={() => {}}
          onRenameStart={() => {}}
          onRenameCommit={() => {}}
          onRenameCancel={() => {}}
          onFolderToggle={() => {}}
          onFolderRename={() => {}}
          onFolderDelete={() => {}}
          onMovePageToFolder={() => {}}
          onRemovePageFromFolder={() => {}}
          {...over}
        />
      </PanelFrame.Body>
    </PanelFrame>
  );
}

/**
 * Publish fixtures (boards 784:4250 publishing, 781:4489 load-error).
 *
 * Both are server conditions. `publishJob` is the shell's state machine, so a
 * running deploy is expressed by handing the panel the shape that machine
 * would be in; the load-error is the `sites.publishHistory` read failing,
 * which the probe forces by refusing the request rather than by hoping the
 * dashboard happens to be down — a state that depends on what else is running
 * on the machine is not a measurement.
 */
const PUBLISH_JOB = (over: Partial<UsePublishJobResult> = {}): UsePublishJobResult =>
  ({
    uiState: "idle",
    jobId: null,
    progress: 0,
    publishedUrl: null,
    error: null,
    steps: null,
    blockedReason: null,
    publish: async () => {},
    cancel: async () => {},
    track: () => {},
    reset: () => {},
    lastPublishedAt: null,
    hasUnpublishedChanges: null,
    dismissBlock: () => {},
    unpublished: () => {},
    ...over,
  }) as UsePublishJobResult;

/** Every network read this page would make, refused. */
function refuseFetch() {
  window.fetch = () => Promise.reject(new Error("probe: deploy service unreachable"));
}


/* Every S7 screen is hosted by the SAME pane the boards draw: `.bd-set-pane-body`
   supplies the --color/bg-app ground and the 32/24 insets, and 824 is the
   board's own arithmetic — the 760 card plus its two 32s. Settled on
   s7-settings-general (638:2378) and reused unchanged so the ten screens are
   measured in one host, not ten. */
const SettingsPane: React.FC<{ case_: string; children: React.ReactNode }> = ({ case_, children }) => (
  <div data-probe={case_} style={{ width: 824, height: 700, display: "flex" }}>
    <div className="bd-set-pane-body">{children}</div>
  </div>
);

/* SEO / Analytics / Custom code read and write through
   `composer.getProjectSettings()/setProjectSettings()` and subscribe to two
   events; a four-method stub is the whole dependency. */
function settingsComposer(initial: Record<string, unknown>) {
  let settings = initial;
  return {
    getProjectSettings: () => settings,
    setProjectSettings: (next: Record<string, unknown>) => { settings = next; },
    on: () => {},
    off: () => {},
    emit: () => {},
  };
}

/**
 * The review/collaboration surfaces read the dashboard over tRPC, and none of
 * their states can be reached by clicking in the standalone editor: every one
 * needs a review round, a client, and comments only the dashboard has
 * (`NEXT_PUBLIC_FEATURE_COLLAB` is off in production besides). So the probe
 * answers the TRANSPORT, not the component — `ReviewTab` mounts exactly as it
 * ships and the only thing faked is what the server would have said. A fixture
 * that re-exported `ReviewService` would measure the fixture: the service's own
 * mapping (`reviewerId` -> authorKind, `resolvedByName`, the round revision) is
 * part of what the panel draws.
 *
 * httpBatchLink always sends `batch=1`, so the response is always an array —
 * one entry per procedure in the comma-separated path, in order. superjson is
 * the transformer and `{ json: <plain> }` is its serialized form for values
 * with no special types; Dates travel as ISO strings, which is what the panel
 * parses anyway.
 */
function trpcStub(handlers: Record<string, () => unknown>) {
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    void init;
    const href = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const u = new URL(href, location.origin);
    const m = u.pathname.match(/\/api\/trpc\/(.+)$/);
    if (!m) return new Response("{}", { status: 404 });
    const body = decodeURIComponent(m[1])
      .split(",")
      .map((proc) => {
        const h = handlers[proc];
        return h
          ? { result: { data: { json: h() } } }
          : {
              error: {
                json: {
                  message: `probe: no stub for ${proc}`,
                  code: -32603,
                  data: { code: "INTERNAL_SERVER_ERROR", httpStatus: 500, path: proc },
                },
              },
            };
      });
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };
}

/** ISO for "N days ago" — these panels print ages, never absolute dates. */
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();

const REVIEW_PAGES = [
  { id: "page-home", name: "Home" },
  { id: "page-menu", name: "Menu" },
  { id: "page-contact", name: "Contact" },
];

interface StubComment {
  id: string;
  body: string;
  pageId: string | null;
  status: "OPEN" | "RESOLVED";
  reviewerId: string | null;
  reviewer: { name: string } | null;
  createdAt: string;
  x: null;
  y: null;
  targetSelector: string | null;
  resolvedByName: string | null;
  resolvedAt: string | null;
}

const stubComment = (
  id: string,
  body: string,
  pageId: string | null,
  over: Partial<StubComment> = {},
): StubComment => ({
  id,
  body,
  pageId,
  status: "OPEN",
  reviewerId: "rev-1",
  reviewer: { name: "Sara" },
  createdAt: daysAgo(2),
  x: null,
  y: null,
  targetSelector: `#el-${id}`,
  resolvedByName: null,
  resolvedAt: null,
  ...over,
});

/**
 * Board 157:2's SHAPE: a Detached group, two page groups, a collapsed RESOLVED
 * band. Not its literal counts — 157:2 draws "9 of 12" over bands that add to
 * 14, and board sample data is never conformed to literally.
 */
const REVIEW_COMMENTS: StubComment[] = [
  stubComment("d1", "is the terrace open in winter?", "page-home", { createdAt: daysAgo(3) }),
  stubComment("d2", "the opening hours moved", "page-home", { createdAt: daysAgo(3) }),
  stubComment("o1", "hero photo is too dark", "page-home"),
  stubComment("o2", "wrong phone number", "page-home"),
  stubComment("o3", "add gluten-free icons", "page-menu", { createdAt: daysAgo(1) }),
  ...Array.from({ length: 7 }, (_, i) =>
    stubComment(`r${i}`, `resolved note ${i + 1}`, "page-home", {
      status: "RESOLVED",
      resolvedByName: "You",
      resolvedAt: daysAgo(1),
    }),
  ),
];

const REVIEW_ROUND = (over: Record<string, unknown> = {}) => ({
  id: "round-3",
  status: "PENDING",
  invitedEmail: "sara@client.com",
  reviewerName: "Sara",
  revoked: false,
  resolvedAt: null,
  createdAt: daysAgo(2),
  revision: daysAgo(2),
  roundNumber: 3,
  totalRounds: 3,
  openCommentCount: 5,
  ...over,
});

/** Board 157:169's seven header lines. */
const REVIEW_ROUNDS = [
  { id: "r7", roundNumber: 7, status: "PENDING", reviewerName: "Sara", revoked: false, resolvedAt: null, createdAt: daysAgo(1) },
  { id: "r6", roundNumber: 6, status: "APPROVED", reviewerName: "Sara", revoked: false, resolvedAt: daysAgo(3), createdAt: daysAgo(4) },
  { id: "r5", roundNumber: 5, status: "CHANGES_REQUESTED", reviewerName: "Sara", revoked: false, resolvedAt: daysAgo(6), createdAt: daysAgo(7) },
  { id: "r4", roundNumber: 4, status: "APPROVED", reviewerName: "Sara", revoked: false, resolvedAt: daysAgo(9), createdAt: daysAgo(10) },
  { id: "r3", roundNumber: 3, status: "APPROVED", reviewerName: "Sara", revoked: false, resolvedAt: daysAgo(12), createdAt: daysAgo(13) },
  { id: "r2", roundNumber: 2, status: "CHANGES_REQUESTED", reviewerName: "Sara", revoked: false, resolvedAt: daysAgo(15), createdAt: daysAgo(16) },
  { id: "r1", roundNumber: 1, status: "APPROVED", reviewerName: "Sara", revoked: false, resolvedAt: daysAgo(20), createdAt: daysAgo(21) },
];

/**
 * The composer half of the panel's contract: page NAMES for the group bands
 * ("Open · Home", not a cuid), and the orphan handshake the canvas layer owns
 * — ReviewTab subscribes to `comments:orphans` and then asks for a replay, so
 * a stub that only stored handlers would leave the Detached group empty.
 */
function reviewComposerStub(orphanIds: string[] = []) {
  const handlers = new Map<string, Array<(p: unknown) => void>>();
  return {
    on: (evt: string, fn: (p: unknown) => void) => {
      handlers.set(evt, [...(handlers.get(evt) ?? []), fn]);
    },
    off: (evt: string, fn: (p: unknown) => void) => {
      handlers.set(evt, (handlers.get(evt) ?? []).filter((h) => h !== fn));
    },
    emit: (evt: string, payload: unknown) => {
      if (evt === "comments:orphans-request") {
        for (const h of handlers.get("comments:orphans") ?? []) h({ ids: orphanIds });
        return;
      }
      for (const h of handlers.get(evt) ?? []) h(payload);
    },
    elements: { getAllPages: () => REVIEW_PAGES },
  } as unknown as Composer;
}

/** The 280 drawer ReviewTab ships in (`--bk-size-drawer`), at the board's 812. */
const reviewHost = (name: string, children: React.ReactNode) => (
  <div
    data-probe={name}
    style={{ width: 280, height: 812, display: "flex", flexDirection: "column", background: "#fff" }}
  >
    {children}
  </div>
);

/**
 * Page-tab-bar fixture (board 435:2348).
 *
 * PageTabBar returns null without a composer — the whole bar IS the page list —
 * so a stub answers the two reads it makes and the two events it subscribes to.
 * The dirty dot is deliberately absent: `useDirtyPages` keeps its state in a
 * per-composer store fed by real engine events, and faking one would measure a
 * store this fixture wrote rather than the one the editor keeps.
 */
const TAB_PAGE = (id: string, name: string, over: Partial<PageData> = {}): PageData =>
  ({ id, name, slug: name.toLowerCase(), root: { id: `r-${id}`, type: "container" }, ...over }) as PageData;

const TAB_PAGES: PageData[] = [
  TAB_PAGE("home", "Home", { isHome: true }),
  TAB_PAGE("about", "About"),
  TAB_PAGE("pricing", "Pricing"),
];

function tabBarStub() {
  return {
    on: () => {},
    off: () => {},
    emit: () => {},
    elements: {
      getAllPages: () => TAB_PAGES,
      getActivePage: () => TAB_PAGES[0],
      setActivePage: () => {},
      createPage: () => {},
      updatePage: () => {},
      duplicatePage: () => true,
      deletePage: () => {},
      setHomePage: () => {},
    },
  } as unknown as Composer;
}

const APPLY_STEPS = [
  { id: "tokens", label: "Resolving brand tokens", state: "done" as const },
  { id: "import", label: "Importing template HTML", state: "done" as const },
  { id: "render", label: "Rendering on canvas", state: "active" as const },
  { id: "save", label: "Saving applied state", state: "queued" as const },
];


/**
 * AI run states (boards 170:29 thinking · 170:41 planning · 171:67 done).
 *
 * The AI panel's own chrome — back row, title row, scope band, prompt block —
 * is measured LIVE by the `ai-idle` recipe against the running editor, where it
 * is reached by the inspector's `✦ Ask AI`. The three states below cannot be
 * reached there at all: each one needs an answer from the dashboard's AI
 * endpoint, which the standalone editor has no credentials for. So the probe
 * mounts the ONE block each state adds, in the branch production renders it
 * from — `AgentPlan` at phase "planning" for the Thinking band (decision #23
 * retired the chat bubble that used to carry it), and at the run phase for the
 * band and the step rows.
 *
 * 280 is the board frame. Nothing compared from these three depends on it (the
 * anchored properties are heights, fills and type), and it keeps a probe
 * screenshot comparable to the board by eye. The shipped panel is 299 — the 300
 * inspector column less its own rule — which `ai-idle` records.
 */
const aiHost = (name: string, children: React.ReactNode) => (
  <div data-probe={name} style={{ width: 280, background: "#fff" }}>{children}</div>
);

/** Board 170:41's three, as `useAgentRunner` shapes them before step 0 runs. */
const RUN_STEPS = (status: RunStep["status"]): RunStep[] =>
  [
    "Rewrite the headline",
    "Warm the background tint",
    "Swap the hero photo",
  ].map((title) => ({
    plan: { title, scope: { kind: "page" as const }, instruction: title },
    status,
  }));

const agentPlan = (over: Partial<React.ComponentProps<typeof AgentPlan>>) => (
  <AgentPlan
    phase="planning"
    steps={[]}
    currentIndex={-1}
    error={null}
    autoApply={false}
    onAutoApplyChange={() => {}}
    onApprove={() => {}}
    onSkip={() => {}}
    onStop={() => {}}
    {...over}
  />
);

/**
 * Compare fixtures (boards 168:2 side-by-side · 168:26 overlay · 168:48 list).
 *
 * Compare only has states when the dashboard hands back an approved snapshot
 * for a review round, so no click in the standalone editor reaches it. Two
 * pages, one of them edited, produce a non-empty diff — without one, board
 * 168:82 (no-changes) takes the whole body and none of the three modes render.
 *
 * The host is 280: the review drawer this view actually ships inside. The
 * boards draw it at 1080, and that placement is a live founder call (blocker
 * B1), so the recipes anchor only what does not depend on it.
 */
const comparePage = (path: string, headline: string, hours: string): ComparePage => ({
  path,
  html: `<html><body><h1>${headline}</h1><p>${hours}</p></body></html>`,
});

const COMPARE_APPROVED: ComparePage[] = [
  comparePage("/", "Wood-fired pizza, five minutes away", "Open 11–23"),
];
const COMPARE_CURRENT: ComparePage[] = [
  comparePage("/", "Wood-fired pizza, five minutes from home", "Open 11–23"),
];

/**
 * Compare at the width its host actually gives it.
 *
 * Boards 168:2 / 168:26 / 168:48 draw Compare at 1080, and the founder call of
 * 2026-09-08 (BLOCKERS.md B1) is that SPLIT and OVERLAY open at 1080 through
 * `OverlayMount` while LIST stays in the 280 drawer — at 280 each pane was
 * ~140px, so "Side by side" was only side-by-side on the board's own surface.
 * The probe has to mount each mode at the width it now ships at, or it measures
 * a layout no user sees.
 */
const compareView = (width: 280 | 1080 = 280) => (
  /* A BLOCK host, not a flex one. `ApprovedCompareView`'s root carries no
     grow, so as a flex CHILD it sized to its content — the bar measured 628 in
     a 1080 box, and every pane 302 against the board's 516. Invisible at 280,
     where the content happened to fill the box. A block host makes the root's
     own `w-full`/`h-full` do the work. */
  <div style={{ width, height: width === 1080 ? 741 : 700, background: "#fff" }}>
    <div style={{ height: "100%" }}>
    <ApprovedCompareView
      approvedPages={COMPARE_APPROVED}
      currentPages={COMPARE_CURRENT}
      onBack={() => {}}
      onRefreshCurrent={() => {}}
    />
    </div>
  </div>
);

/**
 * Publish-history fixtures (boards 184:2 / 184:24 / 184:37 / 184:45 / 453:4064).
 *
 * PublishHistory reads two tRPC procedures before it renders a single row, so
 * every rollback board is unreachable without a server. Stubbing `fetch` at
 * the transport is deliberate: the alternative — passing rows in as a prop —
 * would need a prop the component does not have, i.e. a different component.
 * The envelope shape is httpBatchLink + superjson, which is what
 * `createBuildrikApiClient` builds.
 */
const PUBLISH_ROWS = [
  { id: "j6", version: 6, completedAt: "2026-07-18T14:00:00.000Z", deploymentId: "d6", rollbackable: true, rolledBackFrom: null },
  { id: "j5", version: 5, completedAt: "2026-07-16T14:00:00.000Z", deploymentId: "d5", rollbackable: true, rolledBackFrom: null },
  { id: "j4", version: 4, completedAt: "2026-07-11T14:00:00.000Z", deploymentId: "d4", rollbackable: true, rolledBackFrom: null },
  { id: "j3", version: 3, completedAt: "2026-07-04T14:00:00.000Z", deploymentId: "d3", rollbackable: true, rolledBackFrom: null },
];

function stubTrpc(answers: Record<string, unknown>) {
  window.fetch = (async (input: RequestInfo | URL) => {
    const href =
      typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const { pathname } = new URL(href, location.origin);
    const procs = pathname.split("/api/trpc/")[1]?.split(",") ?? [];
    const body = procs.map((name) => ({ result: { data: { json: answers[name] ?? null } } }));
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }) as typeof fetch;
}

function publishHistoryHost(job: { state: "publishing" | "published" | "failed"; progress: number } | null) {
  stubTrpc({
    "sites.publishHistory": PUBLISH_ROWS,
    "sites.get": { status: "PUBLISHED", publishedUrl: "https://bella.example.com", lastPublishedAt: "2026-07-18T14:00:00.000Z", lastEditedAt: "2026-07-18T15:00:00.000Z" },
    "sites.rollback": { id: "job-rollback-1" },
    "workspaces.myRole": "ADMIN",
  });
  return (
    <div className="tw:h-225 tw:w-70 tw:bg-white">
      <PublishHistory siteId="probe-site" rollbackJob={job} onRollbackStarted={() => {}} />
    </div>
  );
}

function publishRollbackCases(): Record<string, () => React.ReactElement> {
  return {
    "history-published-roll-back-confirm": () => (
      <div data-probe="history-published-roll-back-confirm">{publishHistoryHost(null)}</div>
    ),
    "history-published-restore-confirm": () => (
      <div data-probe="history-published-restore-confirm">{publishHistoryHost(null)}</div>
    ),
    "history-published-redeploying": () => (
      <div data-probe="history-published-redeploying">
        {publishHistoryHost({ state: "publishing", progress: 59 })}
      </div>
    ),
    "history-published-restored": () => (
      <div data-probe="history-published-restored">
        {publishHistoryHost({ state: "published", progress: 100 })}
      </div>
    ),
    "history-published-failed": () => (
      <div data-probe="history-published-failed">
        {publishHistoryHost({ state: "failed", progress: 40 })}
      </div>
    ),
  };
}


/**
 * The drop overlay measures `canvasRef.current.querySelector(...)` inside an
 * effect, so it has to render as a CHILD of the canvas it measures — by the
 * time its own effect runs the ref is attached and the target has laid out.
 */
function DropFeedbackProbe({ canvasRef }: { canvasRef: React.RefObject<HTMLDivElement | null> }) {
  return (
    <DropFeedbackOverlay
      isDragOver
      dropTargetId="el-1"
      dropPosition="before"
      isValidDrop
      invalidReason={null}
      canvasRef={canvasRef}
      dropTargetPath={[
        { id: "sec", type: "section", label: "Section", isCurrent: false },
        { id: "col", type: "container", label: "Column", isCurrent: true },
      ]}
    />
  );
}

/** Board 184:56's two orphans, anchored at ids the probe canvas does not hold. */
const ORPHAN_COMMENTS = [
  stubComment("d1", "is the terrace open in winter?", "page-home", {
    targetSelector: '[data-buildrick-id="el-book"]',
  }),
  stubComment("d2", "can we make this bigger?", "page-home", {
    targetSelector: '[data-buildrick-id="el-hero"]',
  }),
];

/** The canvas half of the orphan scan: a root with rendered elements, an
 *  active page, and the two deletions whose labels the modal quotes. */
function OrphanProbe() {
  const canvasRef = React.useRef<HTMLDivElement | null>(null);
  const composer = React.useMemo(() => {
    const handlers = new Map<string, Array<(p: unknown) => void>>();
    return {
      on: (e: string, fn: (p: unknown) => void) => handlers.set(e, [...(handlers.get(e) ?? []), fn]),
      off: (e: string, fn: (p: unknown) => void) =>
        handlers.set(e, (handlers.get(e) ?? []).filter((h) => h !== fn)),
      emit: (e: string, p: unknown) => {
        for (const h of handlers.get(e) ?? []) h(p);
      },
      elements: {
        getActivePage: () => ({ id: "page-home" }),
        getAllPages: () => REVIEW_PAGES,
      },
    } as unknown as Composer;
  }, []);

  React.useEffect(() => {
    // Replay the deletions so the modal can name what each pin was on — the
    // label is captured client-side from the live instance and never stored,
    // so nothing else can produce "was on: …".
    for (const [id, content] of [
      ["el-book", "Book a table"],
      ["el-hero", "Hero heading"],
    ]) {
      composer.emit(EVENTS.ELEMENT_DELETED, {
        getId: () => id,
        getContent: () => content,
        getType: () => "text",
      });
    }
  }, [composer]);

  return (
    <div data-probe="orphan-comments-detected">
      <ToastProvider>
        {/* Two rendered elements: the scan suppresses itself when EVERY pinned
            comment is missing on a root holding nothing but its container,
            which is the signature of a page that has not painted yet. */}
        <div ref={canvasRef} style={{ width: 680, height: 200 }}>
          <div data-buildrick-id="el-nav" />
          <div data-buildrick-id="el-footer" />
        </div>
        <CommentLayer composer={composer} canvasRef={canvasRef} />
      </ToastProvider>
    </div>
  );
}


/**
 * Board 814:7027's six undo/redo toasts, fired through the PRODUCT path.
 *
 * The toasts are not markup a fixture can hand over: `useHistoryFeedback`
 * subscribes to three engine events and composes each message from a label
 * table. So the probe gives it a two-method event bus in place of a Composer
 * and emits the six histories the board draws — undo of a delete, a text
 * edit, a move; redo of a delete; undo of a style change; and ⌘Z on an empty
 * stack. Every string, tone, duration and reverse-action link below is
 * produced by the shipping hook.
 */
function historyBus() {
  const listeners = new Map<string, Set<(d: unknown) => void>>();
  return {
    on: (evt: string, fn: (d: unknown) => void) => {
      if (!listeners.has(evt)) listeners.set(evt, new Set());
      listeners.get(evt)!.add(fn);
    },
    off: (evt: string, fn: (d: unknown) => void) => listeners.get(evt)?.delete(fn),
    emit: (evt: string, data: unknown) => listeners.get(evt)?.forEach((fn) => fn(data)),
    history: { undo: () => {}, redo: () => {} },
    selection: { getSelectedIds: () => [] },
    elements: { getElement: () => null },
  };
}

function UndoToastFirer() {
  const { addToast } = useToast();
  const bus = React.useMemo(historyBus, []);
  /* The ONLY thing the probe overrides is the linger: the hook dismisses each
     toast after 2.5-4s, and a measurement that starts a browser cannot beat
     that reliably (the first run of this recipe found four of six already
     gone). Everything the board specifies — the message, the tone, the
     reverse link — is still the hook's. */
  const hold = React.useCallback(
    (input: Parameters<typeof addToast>[0]) => addToast({ ...input, duration: Infinity }),
    [addToast],
  );
  useHistoryFeedback(bus as unknown as Composer, hold);
  React.useEffect(() => {
    /* The board's order, left to right. `duration: Infinity` is not available
       from here — the hook owns it — so the six are fired at once and read
       inside their 2.5s window. */
    bus.emit(EVENTS.HISTORY_UNDO, { entry: { label: "delete" } });
    bus.emit(EVENTS.HISTORY_UNDO, { entry: { label: "inline edit" } });
    bus.emit(EVENTS.HISTORY_UNDO, { entry: { label: "move-element" } });
    bus.emit(EVENTS.HISTORY_REDO, { entry: { label: "delete" } });
    bus.emit(EVENTS.HISTORY_UNDO, { entry: { label: "style-change" } });
    bus.emit(EVENTS.HISTORY_NOOP, { direction: "undo" });
  }, [bus]);
  return null;
}

/**
 * Content panel fixture (boards 148:2 · 149:50 · 149:84 · 151:2 · 151:46 ·
 * 151:62 · 151:87 · 303:2067 · 303:2083).
 *
 * A STUB manager, not `new Composer({})`, and the reason is identity rather
 * than convenience: `CollectionManager` mints its ids from `generateId()` and
 * persists them to IndexedDB, so `content-collection-<id>` would name a
 * different element on every run AND accumulate a new collection each time the
 * page loaded. A recipe anchors by testId; an id that changes per run is not an
 * anchor. Everything ABOVE the manager — `useContentPanel`, `ContentTab` and
 * all seven views — is the shipped code, reached through the shipped clicks.
 *
 * The seven drill-ins are ONE mount, navigated by the recipe's own `click`
 * steps (`content-collection-menu-items` → `content-open-fields`, and so on),
 * which is the real path a person takes rather than a fixture prop that skips
 * it.
 */
const CONTENT_FIELDS = [
  { id: "cf-name", name: "name", slug: "name", type: "text", order: 0, validation: { required: true } },
  { id: "cf-price", name: "price", slug: "price", type: "number", order: 1, validation: { required: true } },
  { id: "cf-description", name: "description", slug: "description", type: "richtext", order: 2 },
  { id: "cf-photo", name: "photo", slug: "photo", type: "image", order: 3 },
  { id: "cf-spicy", name: "spicy", slug: "spicy", type: "boolean", order: 4 },
  { id: "cf-category", name: "category", slug: "category", type: "reference", order: 5 },
  { id: "cf-slug", name: "slug", slug: "slug", type: "slug", order: 6, validation: { required: true } },
  { id: "cf-available", name: "available", slug: "available", type: "boolean", order: 7 },
];

const CONTENT_COLLECTIONS = [
  { id: "menu-items", name: "Menu items", slug: "menu-items", displayField: "name", fields: CONTENT_FIELDS },
  { id: "team", name: "Team", slug: "team", displayField: "name", fields: [] as unknown[] },
];

const MENU_RECORDS = [
  {
    id: "rec-margherita",
    collectionId: "menu-items",
    status: "published",
    data: { name: "Margherita", price: "$12", description: "Tomato, mozzarella, basil" },
  },
  { id: "rec-quattro", collectionId: "menu-items", status: "published", data: { name: "Quattro Formaggi" } },
  { id: "rec-diavola", collectionId: "menu-items", status: "draft", data: { name: "Diavola" } },
  { id: "rec-marinara", collectionId: "menu-items", status: "draft", data: { name: "Marinara" } },
];

const TEAM_RECORDS = Array.from({ length: 6 }, (_, i) => ({
  id: `rec-team-${i}`,
  collectionId: "team",
  status: "published",
  data: { name: `Person ${i + 1}` },
}));

/* The board's sub-line is "Connected · synced 4m ago". The panel writes what it
   can prove instead (`sourceStatus`, ContentViews.tsx) — see the note there;
   the SHAPE (name over a status line with a dot) is what this fixture carries. */
const SHEETS_SOURCE = {
  id: "sheets",
  name: "Google Sheets · menu.xlsx",
  type: "object" as const,
  data: { starters: 6, mains: 12, desserts: 6 },
};

/* Two elements carrying a real `condition` data-binding — the only thing
   `scanConditions` looks for, and the only way rows reach 151:87. */
const CONDITION_ELEMENTS = [
  {
    id: "el-happy-hour",
    type: "container",
    content: "Happy hour banner",
    bindings: { hidden: { type: "condition", condition: { operator: "==", left: "time", right: "17:00–19:00" } } },
  },
  {
    id: "el-sold-out",
    type: "badge",
    content: "Sold-out badge",
    bindings: { hidden: { type: "condition", condition: { operator: "==", left: "available", right: "false" } } },
  },
];

const CONTENT_VARIABLES = [
  { key: "name", value: "Bella Cucina" },
  { key: "phone", value: "+44 20 7946 0912" },
  { key: "address", value: "12 Dean St, London" },
  { key: "hours", value: "Tue–Sun, from 5pm" },
];

/* Board 1170:4749's own collection: three columns (Title · Price · Photo) plus
   the fixed Updated. The third being an IMAGE field is the point — that column
   is the only one the table renders as presence rather than as text. */
const RECORDS_COLLECTION = [
  {
    id: "menu-items",
    name: "Menu items",
    slug: "menu-items",
    displayField: "title",
    fields: [
      { id: "rcf-title", name: "Title", slug: "title", type: "text", order: 0 },
      { id: "rcf-price", name: "Price", slug: "price", type: "text", order: 1 },
      { id: "rcf-photo", name: "Photo", slug: "photo", type: "image", order: 2 },
    ],
  },
];
const RECORDS_ITEMS = [
  { id: "rec-margherita", collectionId: "menu-items", status: "published", updatedAt: new Date().toISOString(),
    data: { title: "Margherita", price: "$14", photo: "margherita.jpg" } },
  { id: "rec-carbonara", collectionId: "menu-items", status: "published", updatedAt: "2026-08-05T10:00:00.000Z",
    data: { title: "Carbonara", price: "$18", photo: "carbonara.jpg" } },
  { id: "rec-tiramisu", collectionId: "menu-items", status: "draft", updatedAt: "2026-08-02T10:00:00.000Z",
    data: { title: "Tiramisu", price: "$9", photo: "" } },
];

const CONTENT_PROJECT = "probe-content";

function contentElement(e: (typeof CONDITION_ELEMENTS)[number]) {
  return {
    getId: () => e.id,
    getType: () => e.type,
    getContent: () => e.content,
    getDataBindings: () => e.bindings,
    removeDataBinding: () => {},
  };
}

function contentComposer({
  collections = CONTENT_COLLECTIONS,
  records = MENU_RECORDS as unknown[],
  sources = [SHEETS_SOURCE],
  elements = CONDITION_ELEMENTS,
}: {
  collections?: unknown[];
  records?: unknown[];
  sources?: unknown[];
  elements?: typeof CONDITION_ELEMENTS;
} = {}): Composer {
  const live = [...sources];
  const noop = () => {};
  return {
    getProjectMetadata: () => ({ name: CONTENT_PROJECT }),
    cms: {
      collections: {
        initialize: async () => {},
        getAllCollections: () => collections,
        getCollection: (id: string) => collections.find((c) => (c as { id: string }).id === id) ?? null,
        getContentItems: async (id: string) =>
          id === "menu-items" ? records : id === "team" ? TEAM_RECORDS : [],
        on: noop,
        off: noop,
      },
    },
    data: {
      getAllSources: () => live,
      getSource: (id: string) => live.find((s) => (s as { id: string }).id === id) ?? null,
      registerSource: (s: unknown) => { live.push(s); },
      updateSourceData: noop,
      unregisterSource: noop,
      importSampleData: noop,
      on: noop,
      off: noop,
    },
    elements: {
      getAllElements: () => elements.map(contentElement),
      getElement: (id: string) => {
        const e = elements.find((x) => x.id === id);
        return e ? contentElement(e) : null;
      },
    },
    selection: { select: noop },
    on: noop,
    off: noop,
    emit: noop,
  } as unknown as Composer;
}

/** 812 tall and 280 wide — the drawer this panel ships in, and the board's own
 *  frame. Without a real height `CONTENT_BODY`'s `h-full` collapses and every
 *  `flex-1` region measures its content instead of its column. */
function ContentPanelHost({ probe, composer }: { probe: string; composer: Composer }) {
  /* Variables persist in localStorage keyed by the project NAME
     (contentPanelUtils.storageKey). Seeded through the shipped writer so the
     read path is identical to production's — and during THIS render rather
     than in an effect: child effects run before parent effects, so an effect
     here would write them after `useContentPanel` had already read, and board
     151:62 would mount on an empty list. */
  React.useMemo(() => saveSiteVariables(CONTENT_PROJECT, CONTENT_VARIABLES), []);
  return (
    <div data-probe={probe} className="tw:flex tw:h-203 tw:w-70 tw:flex-col tw:bg-white">
      <ContentTab composer={composer} hydrationStatus="ready" onCreateCollection={() => {}} onClose={() => {}} />
    </div>
  );
}

const CASES: Record<string, () => React.ReactElement> = {
  // ── AI run states (boards 170:29 / 170:41 / 171:67) ─────────────────────
  "ai-thinking": () => aiHost("ai-thinking", agentPlan({ phase: "planning", steps: [] })),
  /* Planning has NO step rows in the shipped runner: `start()` clears `steps`,
     awaits the plan, then sets steps and phase "running" in the same breath.
     The board draws a plan-review gate over three pending rows, which is a new
     FSM state (ledger J-170:41, founder lane) — so the probe mounts what the
     product actually renders here, the band alone. */
  "ai-planning": () => aiHost("ai-planning", agentPlan({ phase: "planning", steps: [] })),
  "ai-done": () =>
    aiHost("ai-done", agentPlan({ phase: "done", steps: RUN_STEPS("applied"), currentIndex: -1 })),
  // ── Compare modes (boards 168:2 / 168:26 / 168:48) ──────────────────────
  "compare-side-by-side": () => <div data-probe="compare-side-by-side">{compareView(1080)}</div>,
  "compare-overlay": () => <div data-probe="compare-overlay">{compareView(1080)}</div>,
  "compare-list": () => <div data-probe="compare-list">{compareView()}</div>,

  // Was "content-style-map", which mapped over ContentViews' exported `S`
  // object. That object is gone (the panel now composes chrome-ui rows), and
  // because tsconfig's `include` did not cover e2e/, its import kept compiling
  // to nothing while every gate stayed green — the probe silently measured
  // an empty page. e2e/ is typechecked now, and the coverage `S` used to give
  // is replaced by rendering the real converted views below.
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
  /* Board 1177:4859, the toast catalog: five tones, each one a tinted card
     with a title in its own colour. The tones are only reachable through the
     module-level store, so this fires them on mount and lets them portal to
     the overlay root, which the parity spec already measures. */
  "toast-catalog": () => (
    <ToastProvider>
      <ToastCatalogFirer />
    </ToastProvider>
  ),
  /* Board 807:8069 — the canvas toolbar carrying the breakpoint switcher.
     `device`/`onDeviceChange` are what make the switcher render at all. */
  "canvas-breakpoint-bar": () => (
    <div data-probe="canvas-breakpoint-bar" style={{ padding: 24, background: "var(--bk-gray-50)" }}>
      <CanvasFooterToolbar
        overlays={{ guides: true, spacing: false, grid: false, rulers: false, badges: false, xray: false }}
        zoom={100}
        device="desktop"
        onDeviceChange={() => {}}
        onOverlayChange={() => {}}
        onZoomChange={() => {}}
        onUndo={() => {}}
        onRedo={() => {}}
      />
    </div>
  ),
  "canvas-footer-toolbar": () => (
    <div data-probe="canvas-footer-toolbar">
      <CanvasFooterToolbar
        overlays={{ guides: true, spacing: false, grid: false, rulers: false, badges: false, xray: false }}
        zoom={100}
        onOverlayChange={() => {}}
        onZoomChange={() => {}}
        onUndo={() => {}}
        onRedo={() => {}}
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
          isExpanded={false}
          onExpandToggle={() => {}}
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
  "media-drawer-grid": () => <div data-probe="media-drawer-grid" className="tw:flex tw:h-203 tw:w-70 tw:flex-col tw:bg-white">{mediaDrawer()}</div>,
  // One card, so a conformance target for `Card / media` resolves to exactly
  // one element — measure.mjs refuses ambiguity, and rightly: whichever card
  // happened to be first would be measured silently.
  "media-drawer-single": () => (
    <div data-probe="media-drawer-single" className="tw:flex tw:h-203 tw:w-70 tw:flex-col tw:bg-white">
      {mediaDrawer({
        libraryItems: [MEDIA_ITEMS[1]],
        counts: { all: 1, img: 1, vid: 0, ico: 0, fnt: 0 },
      })}
    </div>
  ),
  "media-drawer-loading": () => (
    <div data-probe="media-drawer-loading" className="tw:flex tw:h-203 tw:w-70 tw:flex-col tw:bg-white">
      {mediaDrawer({ loading: true, libraryItems: [], counts: MEDIA_COUNTS })}
    </div>
  ),
  "media-drawer-load-error": () => (
    <div data-probe="media-drawer-load-error" className="tw:flex tw:h-203 tw:w-70 tw:flex-col tw:bg-white">
      {mediaDrawer({ loadError: "IndexedDB is unavailable in this browser", onRetryLoad: () => {}, libraryItems: [] })}
    </div>
  ),
  "media-drawer-empty": () => (
    <div data-probe="media-drawer-empty" className="tw:flex tw:h-203 tw:w-70 tw:flex-col tw:bg-white">
      {mediaDrawer({ libraryItems: [], counts: { all: 0, img: 0, vid: 0, ico: 0, fnt: 0 } })}
    </div>
  ),
  // A library that HAS assets and a filter that matches none of them. Distinct
  // from empty on purpose: the board draws two different screens, and the code
  // has two different branches that only differ by which one it reaches.
  "media-drawer-no-results": () => (
    /* Board 782:4353 draws this state WITH the failed search-scope band over
       it — the query ran, the server leg did not come back, and the drawer is
       reporting on a partial library. `searchState` alone does not render the
       band: it is gated on a serverPage whose total exceeds what is loaded,
       which is the only situation where the scope is a question at all. */
    <div data-probe="media-drawer-no-results" className="tw:flex tw:h-203 tw:w-70 tw:flex-col tw:bg-white">
      {mediaDrawer({
        searchQuery: "logo dark",
        counts: { all: 528, img: 128, vid: 6, ico: 24, fnt: 370 },
        serverPage: { nextCursor: "c200", total: 412, loaded: 200 },
        searchState: "failed",
      })}
    </div>
  ),
  // Board 145:199 — warn band at >80% with the actionable exit.
  "media-drawer-quota-warn": () => (
    <div data-probe="media-drawer-quota-warn" className="tw:flex tw:h-203 tw:w-70 tw:flex-col tw:bg-white">
      {mediaDrawer({ storage: { used: 842e6, total: 1e9 }, onOpenLibrary: () => {} })}
    </div>
  ),
  // ── Content states (T13) ─────────────────────────────────────────────────
  /* Board 149:7. `hydrationStatus="ready"` is what makes "no collections" a
     FACT rather than the absence of an answer — without it a composer-less tab
     renders the loading skeleton, which is the whole point of the injected
     status. A null composer then yields the all-zero root, which is the empty
     state's real branch (ContentViews RootView's early return). */
  "content-empty": () => (
    /* 812, the board's own frame height. Without it the probe host is
       auto-height, `CONTENT_BODY`'s `h-full` resolves to nothing, and a
       `flex-1` empty state measures its CONTENT rather than the column it
       fills in the shipped drawer — which is how this case first read 156
       against a board drawing 160 while the app rendered it 768 tall. */
    <div data-probe="content-empty" style={{ height: 812 }}>
      <ContentTab
        composer={null}
        hydrationStatus="ready"
        onCreateCollection={() => {}}
        onClose={() => {}}
      />
    </div>
  ),
  /* One mount, seven boards. The recipes navigate it with the panel's own
     rows — see ContentPanelHost above. */
  "content-panel": () => <ContentPanelHost probe="content-panel" composer={contentComposer()} />,
  /* Board 303:2067: the Sources screen with nothing registered. A separate
     case rather than a click, because "no source" is the ABSENCE of one and
     there is no UI that unregisters the last source without also opening a
     menu over the row being measured. */
  "content-panel-no-source": () => (
    <ContentPanelHost probe="content-panel-no-source" composer={contentComposer({ sources: [] })} />
  ),
  /* Board 1170:4713 — the collection-setup wizard, drawn at its SECOND step.
     Shell-owned, so it is mounted directly and the
     recipe walks it to step 2 through the wizard's own Next button. */
  "content-collection-setup": () => (
    <div data-probe="content-collection-setup">
      <CMSCollectionSetupModal composer={contentComposer()} isOpen onClose={() => {}} />
    </div>
  ),
  "content-loading": () => (
    <div data-probe="content-loading">
      <ContentTab composer={null} hydrationStatus="loading" onClose={() => {}} />
    </div>
  ),
  "content-load-error": () => (
    <div data-probe="content-load-error">
      <ContentTab composer={null} hydrationStatus="error" onClose={() => {}} />
    </div>
  ),
  // ── Layers states (boards 775:4130 / 781:4217 / 782:4260) ────────────────
  // Loading is the REAL path (composer null = editor boot), so the case mounts
  // the whole tab. Error/no-results need a throwing tree or a live search —
  // neither is mountable without an engine, so those cases mount the shared
  // block the app itself renders (LayersStateBlocks is the single home).
  "layers-loading": () => (
    <div data-probe="layers-loading">
      <LayersTab composer={null} />
    </div>
  ),
  "layers-load-error": () => (
    <div data-probe="layers-load-error" style={{ width: 280, background: "#fff" }}>
      <LayersLoadError onRetry={() => {}} />
    </div>
  ),
  "layers-no-results": () => (
    <div data-probe="layers-no-results" style={{ width: 280, background: "#fff" }}>
      <LayersNoResults search="hero" onClear={() => {}} />
    </div>
  ),
  // Insert board 138:198 — disabled row ("Soon" tag + reason tooltip, no
  // insert). No production catalog entry is disabled, so the probe is the
  // only mount, same rule as the loading/error pair above.
  // Pages board 774:4044 — pages hydrate synchronously today; the probe is
  // the loading block's only mount, same rule as the Insert/Layers pairs.
  /* Save conflict, board 66:640. The overlay opens only when the server
     rejects a save because the site moved underneath this editor — no click in
     the standalone demo reaches it, and AquibraStudio's `conflict` state is
     set from a save response. The REAL component is mounted with the four
     callbacks it takes. */
  "shell-state-11-saving-conflict": () => (
    <div data-probe="shell-state-11-saving-conflict">
      <ConflictModal open onReload={() => {}} onSaveBackup={() => {}} onOverwrite={() => {}} onClose={() => {}} />
    </div>
  ),
  /* Layers drawer, boards 142:2 / 143:2 / 143:295 / 1082:4589 / 1171:4829.
     One case per state because the state is engine state, not a click. */
  "layers-tree": () => (
    <div data-probe="layers-tree"><LayersProbe /></div>
  ),
  "layers-multi-select": () => (
    <div data-probe="layers-multi-select">
      <LayersProbe select={["lx-heading", "lx-button", "lx-grid"]} />
    </div>
  ),
  /* Insert drawer, boards 1069:4529 / 4707 / 4790 / 4970. Real BuildTab, real
     catalog; the recipe clicks the group headers to reach its board's state.
     The 280x812 host is the drawer the boards draw — BuildTab is `w-full` and
     would otherwise measure the viewport. */
  "insert-panel": () => (
    <div data-probe="insert-panel">
      <ToastProvider>
        <div className="tw:flex tw:h-[812px] tw:w-70 tw:flex-col tw:overflow-hidden tw:bg-white">
          <BuildTab composer={INSERT_COMPOSER} onExpandToggle={() => {}} onClose={() => {}} />
        </div>
      </ToastProvider>
    </div>
  ),
  // ── Components · library (board 641:2546) ────────────────────────────────
  // onExpandToggle + onClose are what put the panel in `isStandaloneMode`, and
  // therefore what draws the 44h header the board opens with; onHelpClick is
  // left off because the board's header carries exactly two 16px controls.
  "components-library": () => (
    <div data-probe="components-library">
      <ToastProvider>
        <div className="tw:flex tw:h-203 tw:w-70 tw:flex-col tw:overflow-hidden tw:bg-white">
          <ComponentsTab
            composer={COMPONENTS_COMPOSER}
            onCreateNew={() => {}}
            onExpandToggle={() => {}}
            onClose={() => {}}
          />
        </div>
      </ToastProvider>
    </div>
  ),
  "components-detach-confirm": () => (
    <div data-probe="components-detach-confirm">
      {drillHost(
        <DSModeProvider initialMode="pro">
          <AutoOpen testid="component-detach-all">
            <ComponentDetailScreen
              component={DETACH_COMPONENT}
              composer={DETACH_COMPOSER}
              onBack={() => {}}
              selectedElementId="el-1"
            />
          </AutoOpen>
        </DSModeProvider>,
      )}
    </div>
  ),
  "brand-load-error": () => (
    <div data-probe="brand-load-error">
      <ToastProvider>
        {/* 1440 x 900, the workspace's own frame (7315:80955). */}
        <div className="tw:flex tw:h-[900px] tw:w-[1440px] tw:flex-col tw:overflow-hidden tw:bg-white">
          <DSModeProvider>
            <TokenRegistryProvider projectId="probe" composer={undefined}>
              <StylePresetRegistryProvider projectId="probe">
                <BrandWorkspace
                  composer={BRAND_ERROR_COMPOSER}
                  projectId="probe"
                  onClose={() => {}}
                />
              </StylePresetRegistryProvider>
            </TokenRegistryProvider>
          </DSModeProvider>
        </div>
      </ToastProvider>
    </div>
  ),
  "layers-component-instance": () => (
    /* One call, not two: LayerTreeItem renders its own children, so mounting
       the child again beside the root duplicated every testid in the subtree
       and measure.mjs refuses an ambiguous anchor. */
    <div data-probe="layers-component-instance" style={{ width: 280, background: "#fff" }} role="tree">
      {layerRow(
        LAYER_ROW({
          id: "l0",
          children: [LAYER_ROW({ id: "l1", type: "button", tagName: "button", depth: 1 })],
        }),
      )}
    </div>
  ),
  "pages-loading": () => (
    <div data-probe="pages-loading" style={{ width: 280, background: "#fff" }}>
      <PagesLoadingSkeleton />
    </div>
  ),
  "insert-disabled-row": () => (
    <div data-probe="insert-disabled-row" style={{ width: 280, background: "#fff" }}>
      <InsertRow
        label="Video"
        disabled
        disabledReason="Video blocks need a media provider connected"
        testId="probe-insert-disabled"
        onClick={() => {}}
      />
    </div>
  ),
  "media-drawer-folder-scoped": () => (
    <div data-probe="media-drawer-folder-scoped" className="tw:flex tw:h-203 tw:w-70 tw:flex-col tw:bg-white">
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
    <div data-probe="media-drawer-bulk-select" className="tw:flex tw:h-203 tw:w-70 tw:flex-col tw:bg-white">
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
    <div data-probe="media-drawer-uploading" className="tw:flex tw:h-203 tw:w-70 tw:flex-col tw:bg-white">{mediaDrawer({ uploadQueue: ACTIVE_UPLOAD })}</div>
  ),
  "media-drawer-upload-failed": () => (
    <div data-probe="media-drawer-upload-failed" className="tw:flex tw:h-203 tw:w-70 tw:flex-col tw:bg-white">{mediaDrawer({ uploadQueue: FAILED_UPLOAD })}</div>
  ),
  // Quota pressure changes the upload zone's own copy and tint, which is a
  // state of the footer rather than of the grid.
  "media-drawer-quota-full": () => (
    <div data-probe="media-drawer-quota-full" className="tw:flex tw:h-203 tw:w-70 tw:flex-col tw:bg-white">
      {mediaDrawer({ storage: { used: 500 * 1024 * 1024, total: 500 * 1024 * 1024 } })}
    </div>
  ),
  // Board 145:2 — a type pill ON. Distinct from no-results: the filter matches
  // here, so what the board is asserting is the pill's active treatment and the
  // grid under it, not an empty branch.
  /* Board 1175:4827 — the >20-file bulk delete, which needs a real selection
     over a real library plus a usage scan. `isBulk` + 34 keys is what the
     modal branches on; `inUse` is what the warning names. */
  "media-delete-confirm-bulk": () => (
    <div data-probe="media-delete-confirm-bulk">
      <ConfirmDeleteModal
        payload={{
          keys: Array.from({ length: 34 }, (_, i) => `k${i}`),
          names: Array.from({ length: 34 }, (_, i) => `photo-${i}.jpg`),
          inUseCount: 5,
          inUse: [
            { key: "k0", name: "hero-dark.jpg", count: 3, pages: ["Home", "Menu"] },
            { key: "k1", name: "pasta.jpg", count: 2, pages: ["Menu"] },
          ],
          isBulk: true,
        }}
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    </div>
  ),
  /* Boards 1205:4804 / 1205:4816. The invalid case types into the field
     rather than pre-filling it: the error is derived from the field's own
     value, so a fixture that set it any other way would measure a screen the
     product cannot reach. */
  "media-import-url": () => (
    <div data-probe="media-import-url">
      <ImportUrlModal open onClose={() => {}} onImport={() => Promise.resolve()} />
    </div>
  ),
  "media-drawer-filtered": () => (
    <div data-probe="media-drawer-filtered" className="tw:flex tw:h-203 tw:w-70 tw:flex-col tw:bg-white">
      {mediaDrawer({ activeTypes: new Set(["img" as const]) })}
    </div>
  ),
  // ── History states (boards 1138:4573 / 163:2 / 163:113) ──────────────────
  "history-saves-loading": () => (
    <div data-probe="history-saves-loading">
      {historyHost(withStoredView("saves", <HistoryTab composer={historyStub({ loadState: "loading" })} />))}
    </div>
  ),
  "history-saves-changes": () => (
    <div data-probe="history-saves-changes">
      {historyHost(
        withStoredView("changes", <HistoryTab composer={historyStub({ stack: HISTORY_ENTRIES })} />),
      )}
    </div>
  ),
  // The scrubber is opened by a button and reports the previewed entry back up
  // to the panel, so the band the board draws only exists after that click —
  // "partial-scrubber-opens-by-button" in boards.json. AutoOpen performs it.
  "history-saves-time-travel": () => (
    <div data-probe="history-saves-time-travel">
      {historyHost(
        withStoredView(
          "saves",
          <AutoOpen testid="history-time-travel">
            <HistoryTab composer={historyStub({ stack: HISTORY_ENTRIES })} />
          </AutoOpen>,
        ),
      )}
    </div>
  ),
  // Board 163:64 — the panel with no saved versions. `getVersions()` is empty
  // AND the read is settled, which is the pair that distinguishes this from
  // 1138:4573: the skeleton screen and the empty screen answer different
  // questions and only one of them is reachable from a boot with no storage.
  "history-saves-empty": () => (
    <div data-probe="history-saves-empty">
      {historyHost(withStoredView("saves", <HistoryTab composer={historyStub()} />))}
    </div>
  ),
  // Boards 163:269 / 163:220 — the two notices above the Saves list. Neither
  // is a prop: VERSION_PRUNED fires from `pruneIfNeeded` after storage has
  // actually dropped rows, and VERSION_RESTORING from a restore already under
  // way. Both are seeded as real events through the stub's listener table, so
  // the branch measured is the branch production takes.
  "history-saves-pruned-notice": () => {
    const composer = historyStub({ stack: HISTORY_ENTRIES });
    return (
      <div data-probe="history-saves-pruned-notice">
        {historyHost(
          withStoredView(
            "saves",
            <EmitOnMount composer={composer} events={[["version:pruned", { removed: 7, kept: 50 }]]}>
              <HistoryTab composer={composer} />
            </EmitOnMount>,
          ),
        )}
      </div>
    );
  },
  "history-saves-restoring": () => {
    const composer = historyStub({ stack: HISTORY_ENTRIES });
    return (
      <div data-probe="history-saves-restoring">
        {historyHost(
          withStoredView(
            "saves",
            <EmitOnMount
              composer={composer}
              events={[["version:restoring", { targetName: "v3", savedAs: "v4" }]]}
            >
              <HistoryTab composer={composer} />
            </EmitOnMount>,
          ),
        )}
      </div>
    );
  },
  // Board 433:2348 — the milestone suggestion banner, all three of its states.
  // `useAutoMilestone` only produces a suggestion after the engine has watched
  // a real editing session cross a trigger threshold, so the component is
  // mounted directly, in the 280 drawer it ships inside (the board's 600 is a
  // component-gallery frame, not a surface the product has).
  "history-milestone-banner": () => (
    <div data-probe="history-milestone-banner">
      {historyHost(
        <MilestoneSuggestionBanner
          suggestion={{
            trigger: "page_added",
            suggestedName: "Added pricing page",
            reasoning: "3 sections added, hero copy changed",
          } as never}
          isLoading={false}
          onAccept={() => {}}
          onDismiss={() => {}}
          onEdit={() => {}}
        />,
      )}
    </div>
  ),
  // ── Compare · loading-render / no-changes (boards 169:28 / 168:82) ───────
  // `currentPages={null}` IS the loading branch — the live side is still
  // exporting while the stored snapshot renders at once. Passing the same
  // pages to both sides is what 168:82 needs: zero changes replaces the body.
  "compare-loading-render": () => (
    <div data-probe="compare-loading-render">
      <div style={{ width: 280, height: 700, display: "flex", background: "#fff" }}>
        <ApprovedCompareView
          approvedPages={COMPARE_APPROVED}
          currentPages={null}
          onBack={() => {}}
          onRefreshCurrent={() => {}}
        />
      </div>
    </div>
  ),
  "compare-no-changes": () => (
    <div data-probe="compare-no-changes">
      <div style={{ width: 280, height: 700, display: "flex", background: "#fff" }}>
        <ApprovedCompareView
          approvedPages={COMPARE_APPROVED}
          currentPages={COMPARE_APPROVED}
          onBack={() => {}}
          onRefreshCurrent={() => {}}
        />
      </div>
    </div>
  ),
  // ── History · Published · rollback flow (boards 184:2 / 184:24 / 184:37 /
  //    184:45 / 453:4064) ─────────────────────────────────────────────────
  // Five boards, one panel, and every one of them sits behind a real site:
  // `sites.publishHistory` for the rows and `sites.get` for whether anything
  // is serving. The stub answers those two procedures over the transport the
  // client actually uses, so PublishHistory takes its own branches — the
  // modals below are opened by the recipe's clicks, not by a fixture prop.
  ...publishRollbackCases(),

  // ── Export · HTML modal (board 1172:4825) ────────────────────────────────
  // `composer={null}` on purpose: the export RESULT needs a real engine run,
  // and every part this board is measured on — the format pills, the tab row,
  // the foot — renders before and regardless of it. A stub Composer here would
  // add an ExportEngine to the probe's dependency surface to change nothing
  // that is measured.
  "export-html-modal": () => (
    <div data-probe="export-html-modal">
      <ExportModal isOpen onClose={() => {}} composer={null} />
    </div>
  ),
  // ── Modal · success-then-close (board 183:60) ────────────────────────────
  // The state only exists between a confirm and the dialog closing itself,
  // which is 1.4s in the product — too short to click into and far too short
  // to measure. `onClose` is a no-op here, so the dialog's own timer fires
  // into nothing and the card holds still; everything up to that point is the
  // real component taking the real branch.
  "modal-success-then-close": () => (
    <div data-probe="modal-success-then-close">
      <AutoOpen testid="modal-success-confirm" delayMs={600}>
        <ConfirmDialog
          open
          onClose={() => {}}
          onConfirm={() => {}}
          title="Delete 3 pages?"
          message="“Home”, “Menu”, “About” are removed from this site. One undo (⌘Z) brings them all back."
          confirmLabel="Delete pages"
          tone="destructive"
          testId="modal-success"
          success={{ title: "Deleted", message: "3 pages deleted." }}
        />
      </AutoOpen>
    </div>
  ),
  // ── Issues · filtered (board 164:22) ─────────────────────────────────────
  // 360, `--size/panel-right`: the shipped Issues panel is a right-hand panel,
  // and boards.json's 2026-08-31 walk of the sibling board (164:2) confirms
  // 360 against the live app. The filter is internal state cycled by its own
  // control, so the recipe clicks it rather than the fixture pre-setting it.
  "issues-filtered": () => (
    <div data-probe="issues-filtered" className="tw:h-203 tw:w-90 tw:bg-white">
      <IssuesPanel
        issues={ISSUES}
        onClose={() => {}}
        onSelectElement={() => {}}
        onFix={async () => null}
        onOpenBrand={() => {}}
        onIgnore={() => {}}
      />
    </div>
  ),
  // ── Drill-ins (boards 146:2 / 146:68 / 147:2 / 147:55) ───────────────────
  "media-detail-hub": () => (
    <div data-probe="media-detail-hub">
      {drillHost(
        <AssetDetailOverlay
          item={DETAIL_ITEM}
          composer={USAGE_COMPOSER}
          onClose={() => {}}
          onEditImage={() => {}}
          onOptimized={() => {}}
          onReplaceAcross={() => {}}
        />,
      )}
    </div>
  ),
  "media-detail-used-in": () => (
    <div data-probe="media-detail-used-in">
      {drillHost(
        <AutoOpen testid="media-detail-used">
          <AssetDetailOverlay
            item={DETAIL_ITEM}
            composer={USAGE_COMPOSER}
            onClose={() => {}}
            onEditImage={() => {}}
          />
        </AutoOpen>,
      )}
    </div>
  ),
  /* Board 1124:4562 — the OPTIMISE drill-in, at the board's own 280x812. The
     panel is `OptimizationPanel` inside `AssetDetailOverlay`'s fourth view, so
     the probe mounts the real overlay and AutoOpen presses the hub's Optimise
     row, which is how a person reaches it. */
  "media-detail-optimize": () => (
    <div data-probe="media-detail-optimize">
      {drillHost(
        <AutoOpen testid="media-detail-optimize">
          <AssetDetailOverlay
            item={OPTIMISE_ITEM}
            composer={USAGE_COMPOSER}
            onClose={() => {}}
            onEditImage={() => {}}
            onOptimized={() => {}}
          />
        </AutoOpen>,
      )}
    </div>
  ),
  "media-versions": () => {
    trpcStub({ "media.listAssetVersions": () => ASSET_VERSIONS });
    return (
      <div data-probe="media-versions">
        {drillHost(
          <AutoOpen testid="media-detail-versions">
            <AssetDetailOverlay
              item={VERSIONED_ITEM}
              composer={USAGE_COMPOSER}
              onClose={() => {}}
              onEditImage={() => {}}
            />
          </AutoOpen>,
        )}
      </div>
    );
  },
  "media-fullpage-library": () => (
    <div data-probe="media-fullpage-library">
      {mgrHost(<LibraryManager composer={mgrComposer()} onClose={() => {}} onOpenImageEditor={() => {}} onOpenIconPicker={() => {}} />)}
    </div>
  ),
  "media-fullpage-drag-over": () => (
    <div data-probe="media-fullpage-drag-over">
      {mgrHost(
        <AutoDragOver>
          <LibraryManager composer={mgrComposer()} onClose={() => {}} onOpenImageEditor={() => {}} onOpenIconPicker={() => {}} />
        </AutoDragOver>,
      )}
    </div>
  ),
  "media-fullpage-empty": () => (
    <div data-probe="media-fullpage-empty">
      {mgrHost(<LibraryManager composer={mgrComposer([])} onClose={() => {}} />)}
    </div>
  ),
  /* Board 1124:4527 — the image editor, which is a 720 CARD on an ink scrim,
     not the 1000-wide takeover board 75:113 drew (that older frame is the one
     `media-drill-ins-the-five-destinations` recorded as "a build rather than a
     restyle"; ImageEditorModal was then built to THIS board and its docstring
     cites it). The modal is a plain fixed overlay rather than a portal, so it
     mounts inside the probe host and `[data-probe]` is a real contrast scope.
     A 2400x1600 SVG is the source because react-easy-crop only reports a
     cropped area once the media has loaded, and the mono dimension readout is
     gated on that — a 1x1 pixel would render "1x1" under the board's
     "2400x1600". */
  "media-image-editor": () => (
    <div data-probe="media-image-editor">
      <ImageEditorModal
        isOpen
        onClose={() => {}}
        imageSrc={
          "data:image/svg+xml," +
          encodeURIComponent(
            "<svg xmlns='http://www.w3.org/2000/svg' width='2400' height='1600'>" +
              "<rect width='2400' height='1600' fill='#334155'/></svg>",
          )
        }
        fileName="hero-dark.jpg"
        onSave={() => {}}
      />
    </div>
  ),
  "media-picker-modal": () => (
    <div data-probe="media-picker-modal">
      <ToastProvider>
        <MediaLibraryPanel
          isOpen
          onClose={() => {}}
          onSelect={() => {}}
          composer={PICKER_COMPOSER}
          forLabel="Hero · Image"
        />
      </ToastProvider>
    </div>
  ),
  "media-replace-across": () => <div data-probe="media-replace-across">{rxDialog()}</div>,
  "media-icon-picker": () => (
    <div data-probe="media-icon-picker">
      {withRecentIcons(drillHost(<IconBrowserOverlay onClose={() => {}} onPick={() => {}} />))}
    </div>
  ),
  "media-stock-browser": () => (
    <div data-probe="media-stock-browser">
      {drillHost(
        <StockBrowserOverlay
          onClose={() => {}}
          photos={STOCK_PHOTOS}
          videos={[]}
          loading={{ img: true, vid: false }}
          searchQuery="restaurant interior"
          orientation="all"
          color="all"
          onSearch={() => {}}
          onSetOrientation={() => {}}
          onSetColor={() => {}}
          onLoadMore={() => {}}
          onSave={() => {}}
        />,
      )}
    </div>
  ),
  // ── Pages states (boards 141:165 / 141:78) ───────────────────────────────
  "pages-load-error": () => (
    <div data-probe="pages-load-error">
      {pagesPanel({ pages: [], loadError: "sync failed", onRetry: () => {} })}
    </div>
  ),
  "pages-bulk-select": () => (
    <div data-probe="pages-bulk-select">
      {pagesPanel({ selectedIds: new Set(["home", "menu", "contact"]) })}
    </div>
  ),
  /* Boards 141:40 (searching) and 782:4212 (no-results). `search` is
     PageList's OWN state with no prop behind it, so both recipes reach their
     state the way a person does — by typing into the shipped field. One case
     serves both: the query decides which branch renders, and mounting two
     copies would put two `pages-search-box` anchors on one page, which
     measure.mjs refuses. The 812 host is the board's own frame — the
     Add-page foot pins to the bottom, so without a stated height it would be
     measured wherever the content happened to end. */
  "pages-panel": () => (
    <div data-probe="pages-panel" style={{ width: 280, height: 812 }}>
      {/* One folder, because board 141:40 draws a result that names its owning
          folder ("Menu / in Marketing"). `searchContext` is derived inside
          PageList from `folders` + `pageToFolder`, so a result row cannot
          carry that line without a real folder behind it. */}
      {pagesPanel({
        folders: [{ id: "marketing", name: "Marketing", pageIds: ["menu"], isOpen: true } as never],
        pageToFolder: new Map([["menu", "marketing"]]),
      })}
    </div>
  ),
  /* Board 141:124 — a site with exactly ONE page. Not an empty list: the
     branch is `!search && pages.length === 1` (PageList.tsx:351), the note
     sits UNDER the single row, and the panel keeps its search band and its
     Add-page foot. Handing PageList a one-page array is the same shape
     `usePages` computes for a new site. */
  "pages-onepage": () => (
    <div data-probe="pages-onepage" style={{ width: 280, height: 812 }}>
      {pagesPanel({ pages: [PAGE("home", "Home", { isHome: true, isActive: true })] })}
    </div>
  ),
  // ── Templates states (boards 1138:13413 / 642:2832 / 1169:4725) ──────────
  "templates-applying": () => (
    <div data-probe="templates-applying">
      <ApplyProgressOverlay
        templateName={"\u201CRestaurant \u2014 one page\u201D"}
        steps={APPLY_STEPS}
        onCancel={() => {}}
      />
    </div>
  ),
  /* Board 1169:4725 draws the three outcomes side by side; they are three
     states of one flow, and mounting all three is what the board shows. */
  "templates-create-page": () => (
    <div data-probe="templates-create-page">
      <CreatePageConfirmModal
        templateName="Bistro Landing"
        newPageName="Menu 2"
        onCancel={() => {}}
        onConfirm={() => {}}
      />
      <CreatePageSuccessModal pageName="Menu 2" onClose={() => {}} onOpenPageSettings={() => {}} />
      <CreatePageErrorModal onCancel={() => {}} onRetry={() => {}} />
    </div>
  ),
  // ── Page tab bar (board 435:2348) ────────────────────────────────────────
  "pages-page-tab-bar": () => (
    <div data-probe="pages-page-tab-bar">
      <ToastProvider>
        <PageTabBar composer={tabBarStub()} />
      </ToastProvider>
    </div>
  ),
  // ── Publish states (boards 784:4250 / 781:4489) ──────────────────────────
  "publish-publishing": () => (
    <div data-probe="publish-publishing">
      <ToastProvider>
        <PublishTab
          composer={null}
          onClose={() => {}}
          nextMove={null}
          onRequestPublish={() => {}}
          publishJob={PUBLISH_JOB({
            uiState: "publishing",
            jobId: "job-1",
            progress: 60,
            steps: [
              { name: "Exporting pages", status: "done" },
              { name: "Uploading files", status: "done" },
              { name: "Deploying to CDN", status: "running" },
              { name: "Warming cache", status: "pending" },
              { name: "Going live", status: "pending" },
            ],
          })}
        />
      </ToastProvider>
    </div>
  ),
  /* Board 165:71 — Notifications with a row whose jump target is gone.
     The list comes from the dashboard over tRPC (NotificationService ->
     api-client, superjson), so the only honest way to reach the state is to
     answer that ONE request and let the real panel, the real service and the
     real ordering run. A hand-built markup fixture would measure the fixture.
     360 is the shipped width (--bk-size-panel-right, header.css:39).

     The reply MUST carry one entry per batched call, not one per response:
     httpBatchLink coalesces StrictMode's double mount into a single request
     with `input={"0":…,"1":…}`, and a one-entry array left call 1 with no
     result — which tRPC reports as an error, so the panel rendered its load
     error while a direct call to the same service succeeded. */
  /* Boards 165:2 (unread) / 165:24 (all-read). The list is a dashboard tRPC
     read, so the probe answers that one request and the real panel, service
     and ordering run. Both boards draw the same three rows across a TODAY and
     a YESTERDAY band; the only difference is which of them are read — 165:2
     tints the first two and leaves the failed one plain, 165:24 tints none.
     `actionUrl` is set on every row so none of them opens the
     jump-target-deleted marker, which has its own board. */
  ...Object.fromEntries(
    ([["notifications-unread", false], ["notifications-all-read", true]] as Array<[string, boolean]>).map(
      ([caseName, allRead]) => [
        caseName,
        () => {
          const h = 3600_000;
          const rows = [
            { id: "n1", type: "SITE_PUBLISHED", actorName: null, read: allRead,
              message: "Site \u201cBella Cucina\u201d is live at bella-cucina.vercel.app",
              actionUrl: "/dashboard/sites/1", createdAt: new Date(Date.now() - 2 * h).toISOString() },
            { id: "n2", type: "FORM_SUBMISSION", actorName: null, read: allRead,
              message: "New form submission on \u201cBella Cucina\u201d",
              actionUrl: "/dashboard/forms/1", createdAt: new Date(Date.now() - 4 * h).toISOString() },
            /* Read on BOTH boards: 165:20 carries no accent tint. */
            { id: "n3", type: "PUBLISH_FAILED", actorName: null, read: true,
              message: "Site \u201cOsteria\u201d didn\u2019t publish: build failed",
              actionUrl: "/dashboard/sites/2", createdAt: new Date(Date.now() - 26 * h).toISOString() },
          ];
          window.fetch = (async (input: RequestInfo | URL) => {
            const url = new URL(String(typeof input === "string" ? input : (input as Request).url ?? input));
            const batched = JSON.parse(url.searchParams.get("input") ?? "{}") as Record<string, unknown>;
            const calls = Math.max(1, Object.keys(batched).length);
            return new Response(
              JSON.stringify(Array.from({ length: calls }, () => ({ result: { data: { json: rows } } }))),
              { headers: { "content-type": "application/json" } },
            );
          }) as typeof window.fetch;
          return (
            <div data-probe={caseName} style={{ width: 360 }}>
              <NotificationPanel onClose={() => {}} />
            </div>
          );
        },
      ],
    ),
  ),

  /* Boards 130:798 (S5.2 approved) and 130:201 (S5.2 pending). Both are the
     whole 1440 shell; what is THEIRS rather than the shell family's is the
     review state — the topbar's review chip. (The pending frame also drew a
     Review bar under the topbar; that component is retired — C2, owner
     decision D3 — and the v3 IA's chip B3-01 carries the round.) The shell
     around them is measured on its own boards, so this case mounts the real
     component that carries the state.

     The chip is the REAL chrome-ui ReviewBadge with the props StudioHeader's
     `reviewChip` builds for each state, so nothing about it is a fixture's
     opinion. */
  ...Object.fromEntries(
    (
      [
        ["s5-approved", "approved" as const],
        ["s5-pending", "pending" as const],
      ] as Array<[string, "approved" | "pending"]>
    ).map(([caseName, state]) => [
      caseName,
      () => {
        trpcStub({
          "reviews.currentRound": () =>
            REVIEW_ROUND(
              state === "pending"
                ? { status: "PENDING", openCommentCount: 3 }
                : { status: "APPROVED", openCommentCount: 0 },
            ),
          /* Not []: with no OPEN comments `Next ›` renders DISABLED, and a
             disabled Button is a different component (BK_BUTTON_THEME repaints
             it ink-muted). The board draws it live. */
          "comments.list": () => REVIEW_COMMENTS,
          "sites.myRole": () => "OWNER",
        });
        return (
          <div data-probe={caseName} style={{ width: 1440 }}>
            <Topbar
              siteName="Bella Cucina"
              onExit={() => {}}
              save="saved"
              savedAt={Date.now() - 2 * 60_000}
              onSaveClick={() => {}}
              review={
                state === "approved"
                  ? { label: "Approved", tone: "success", title: "Approved by Sara Whitfield · 2h ago", onClick: () => {} }
                  : { label: "Waiting · Sara Whitfield", tone: "info", title: "Sent to Sara Whitfield — waiting on approval", onClick: () => {} }
              }
              onPublish={() => {}}
            />
          </div>
        );
      },
    ]),
  ),

  "notifications-jump-target-deleted": () => {
    const created = new Date(Date.now() - 3 * 86_400_000).toISOString();
    const row = {
      id: "n1",
      type: "SECURITY_2FA_ENABLED",
      actorName: null,
      message: "Two-factor authentication was enabled on your account",
      actionUrl: null,
      read: true,
      createdAt: created,
    };
    window.fetch = (async (input: RequestInfo | URL) => {
      const url = new URL(String(typeof input === "string" ? input : (input as Request).url ?? input));
      const batched = JSON.parse(url.searchParams.get("input") ?? "{}") as Record<string, unknown>;
      const calls = Math.max(1, Object.keys(batched).length);
      return new Response(
        JSON.stringify(
          Array.from({ length: calls }, () => ({ result: { data: { json: [row] } } })),
        ),
        { headers: { "content-type": "application/json" } },
      );
    }) as typeof window.fetch;
    return (
      <div data-probe="notifications-jump-target-deleted" style={{ width: 360 }}>
        <NotificationPanel onClose={() => {}} />
      </div>
    );
  },
  // ── Orphan comments · detected (board 184:56) ───────────────────────────
  // The modal opens when the canvas scan finds a pinned comment whose element
  // has left the DOM. Reaching it live means deleting the element a client
  // commented on, on a site that HAS client comments — so the probe supplies
  // the three things the scan reads and lets the real CommentLayer decide:
  // a canvas root holding two rendered elements, an active page, and two open
  // comments anchored to ids that are not among them. The label under each
  // quote comes from `ELEMENT_DELETED`, which the stub replays.
  "orphan-comments-detected": () => {
    /* Installed BEFORE the layer mounts. It fetches its comments in a mount
       effect, and a stub installed in the parent's effect would land after —
       which is also why the deletions are replayed from a parent effect: child
       effects run first, so CommentLayer is already subscribed by then. */
    trpcStub({
      "comments.list": () => ORPHAN_COMMENTS,
      "sites.myRole": () => "OWNER",
    });
    return <OrphanProbe />;
  },

  // ── S5.6 · approved-edited-since (board 131:201, dialog 131:401) ────────
  // `composer={null}` on purpose, and it is a real branch: the changed-page
  // list needs `exportPublishPages`, i.e. a full ExportEngine run over a real
  // project, which no probe can stand up honestly. Without it the dialog
  // renders its "comparing with the approved version…" prose — which is the
  // state a slow compare actually shows — and the two things this recipe
  // measures, the title and the body gutter, render before and regardless of
  // it. The change rows are NOT measured here; see the recipe's own note.
  "s5-6-approved-edited-since": () => {
    trpcStub({ "reviews.currentRound": () => REVIEW_ROUND(), "sites.myRole": () => "OWNER" });
    return (
      <div data-probe="s5-6-approved-edited-since">
        <ToastProvider>
          <StaleApprovalModal isOpen composer={null} onPublishAnyway={() => {}} onClose={() => {}} />
        </ToastProvider>
      </div>
    );
  },

  // ── S5.4 approval gates (307:2193 · 307:2203 · 307:2213) ────────────────
  // The gate opens only when the dashboard REFUSES a publish, which needs a
  // site, a review round in the wrong state, and a real `sites.publish`
  // rejection — none of which the standalone editor can produce. The modal is
  // mounted with the block reason the server would have sent.
  ...Object.fromEntries(
    (
      [
        ["s5-4-gate-pending", "review-pending"],
        ["s5-4-gate-changes-requested", "changes-requested"],
        ["s5-4-gate-no-review-sent", "no-review"],
      ] as Array<[string, PublishGateReason]>
    ).map(([name, reason]) => [
      name,
      () => {
        trpcStub({
          "reviews.currentRound": () => REVIEW_ROUND(),
          "sites.myRole": () => "OWNER",
        });
        return (
          <div data-probe={name}>
            <PublishGateModal reason={reason} composer={reviewComposerStub()} onClose={() => {}} />
          </div>
        );
      },
    ]),
  ),

  // ── Review panel (boards 157:2 detached-present · 157:169 older-round) ──
  // Neither state is reachable by clicking: both need a round, a client, and
  // comments — and the Detached group additionally needs the orphan
  // announcement only the canvas CommentLayer makes.
  "review-panel-detached-present": () => {
    trpcStub({
      "comments.list": () => REVIEW_COMMENTS,
      "reviews.currentRound": () => REVIEW_ROUND(),
      "sites.myRole": () => "OWNER",
    });
    return reviewHost(
      "review-panel-detached-present",
      /* Both handlers are supplied because their ABSENCE disables the two
         buttons the board draws live, and a disabled Button is a different
         component (BK_BUTTON_THEME repaints it bg-subtle / ink-muted). The
         first measurement of this surface failed three colour rows on exactly
         that. */
      <ReviewTab
        composer={reviewComposerStub(["d1", "d2"])}
        onResend={async () => ({ inviteEmailSent: true })}
      />,
    );
  },
  "review-panel-older-round": () => {
    trpcStub({
      "comments.list": () => REVIEW_COMMENTS,
      "reviews.currentRound": () => REVIEW_ROUND({ roundNumber: 7, totalRounds: 7 }),
      "reviews.rounds": () => REVIEW_ROUNDS,
      "sites.myRole": () => "OWNER",
    });
    return reviewHost(
      "review-panel-older-round",
      <ReviewTab
        composer={reviewComposerStub()}
        onResend={async () => ({ inviteEmailSent: true })}
      />,
    );
  },
  /* Board B3-10 7574:193972 — the ONE facts confirm both publish doors open
     (the stepped wizard it replaced is gone, code-gap B4). The facts are the
     real PublishConfirmFacts over the real services; with no composer and no
     site the reads fail closed, which is a STATE of those rows, not a stand-in
     for them. */
  "publish-confirm": () => (
    <div data-probe="publish-confirm">
      <PublishConfirmModal
        isOpen
        composer={null}
        publishedUrl="https://bellacucina.com"
        isPublished
        onConfirm={() => {}}
        onClose={() => {}}
      />
    </div>
  ),
  /* Board 1171:4713 — the Pages panel with the row context menu open over it.
     PageContextMenu is a portal with a fixed position computed from the
     click, so the probe hands it the coordinates a right-click on the Menu
     row would produce and mounts it beside the same PageList fixture the
     other Pages cases use. */
  "pages-context-menu": () => (
    <div data-probe="pages-context-menu" style={{ width: 280, height: 812 }}>
      {pagesPanel()}
      <PageContextMenu
        pageId="menu"
        x={95}
        y={179}
        pages={PAGES_FIXTURE}
        onClose={() => {}}
        onRename={() => {}}
        onDuplicate={() => {}}
        onDelete={() => {}}
        onSetHomepage={() => {}}
        onReplaceLayout={() => {}}
        onCopyLink={() => {}}
        onSettings={() => {}}
      />
    </div>
  ),
  /* Boards 302:1978 / 302:2004 / 302:2026 — S3.7 page settings, one 580x520
     card on a gray-900 ground, three text-link tabs. The drawer is
     `position: fixed` and centres itself, so the case only has to supply the
     ground; PagesTab.css arrives through the `pages-` prefix loader below.

     `composer={null}` is a real branch, not a stub: usePageSettings only calls
     the composer to SAVE and to read project metadata, and both are optional
     (`composer?.getProjectMetadata?.()`). Nothing this measures depends on it.

     Board 302:1988 draws the slug as `/home` and 302:1992 a written meta
     title, i.e. a page whose SEO has been filled in. `PAGE()` alone leaves
     `seo` undefined, which puts the SEO tab in its noIndex-clear/low-score
     shape — the same fields, one extra banner. The fixture fills the three
     values the board shows so the tab renders the state the board draws.

     The three cases mount the SAME component; the recipe clicks the tab it
     measures. No `initialTab` prop was added for the probe — a prop that only
     a measurement uses is a prop production does not have. */
  ...Object.fromEntries(
    (["seo", "social", "advanced"] as const).map((tab) => [
      `pages-settings-${tab}`,
      () => (
        <div data-probe={`pages-settings-${tab}`} style={{ width: 1440, height: 900, background: "var(--bk-gray-900)" }}>
          <ToastProvider>
            <PageSettingsDrawer
              page={PAGE_SETTINGS_FIXTURE}
              allPages={[PAGE_SETTINGS_FIXTURE, ...PAGES_FIXTURE.slice(1)]}
              composer={null}
              onClose={() => {}}
            />
          </ToastProvider>
        </div>
      ),
    ]),
  ),

  /* Board 815:4608 — the four smart-guide scenarios. A guide only exists
     mid-drag, and `calculateSnapping` reads sibling geometry out of a real
     canvas DOM, so driving it would measure the fixture's rectangles rather
     than the guides. What IS the contract is the LINE: its colour, its
     thickness and its extent, all of which SmartGuidesOverlay computes from a
     SnapLine. So the real overlay is mounted over the board's own seven line
     geometries, read straight off 815:4616/4617/4625 (magenta alignment) and
     815:4633/4635/4643/4645 (red spacing), in the board's own 464x180 cell
     coordinates. Nothing is hardcoded to LOOK like a guide — the component
     draws every pixel from the same props the drag hands it. */
  "canvas-smart-guides": () => {
    const lines: SnapLine[] = [
      { orientation: "horizontal", position: 90, start: 60, end: 380 },
      { orientation: "vertical", position: 232, start: 25, end: 155 },
      { orientation: "vertical", position: 40, start: 10, end: 170 },
      { orientation: "horizontal", position: 90, start: 110, end: 170, kind: "equal-gap", value: 60 },
      { orientation: "horizontal", position: 90, start: 250, end: 310, kind: "equal-gap", value: 60 },
      { orientation: "horizontal", position: 80, start: 42, end: 74, kind: "parent-padding", value: 32 },
      { orientation: "vertical", position: 134, start: 20, end: 50, kind: "parent-padding", value: 30 },
    ];
    return (
      <div
        data-probe="canvas-smart-guides"
        style={{ position: "relative", width: 464, height: 180, background: "var(--bk-bg-subtle)" }}
      >
        <SmartGuidesOverlay snapLines={lines} zoom={100} />
      </div>
    );
  },
  /* Board 807:7301 — the drop-target insertion indicators. The overlay is the
     REAL one; what the probe supplies is the thing a drag supplies: a canvas
     whose `[data-buildrick-id]` target has real geometry, and the session
     fields `useDropTargetResolver` writes. The target is 672 wide because the
     overlay draws the line at `targetRect.width + 8` and the board draws it
     across a 680 page — that is the board's scenario reproduced, not a number
     fitted. `dropPosition: "before"` is what puts the line above the target. */
  "canvas-drop-indicators": () => {
    const canvasRef = React.createRef<HTMLDivElement>();
    return (
      <div data-probe="canvas-drop-indicators" style={{ padding: 60, background: "var(--bk-bg-app)" }}>
        <div
          ref={canvasRef}
          className="buildrick-canvas"
          style={{ position: "relative", width: 680, height: 400, background: "white" }}
        >
          <div
            data-buildrick-id="el-1"
            style={{ position: "absolute", left: 4, top: 120, width: 672, height: 160, background: "var(--bk-bg-subtle)" }}
          />
          <DropFeedbackProbe canvasRef={canvasRef} />
        </div>
      </div>
    );
  },
  /* Board 815:4518 → 7575:195538 "Keyboard shortcuts · full" — the ONE
     keyboard sheet (B7, 2026-09-22; the ⌘/ panel this case used to mount is
     deleted). Its rows derive from the command registry, so it takes a REAL
     Composer — the registry is built in the constructor. Controlled by one
     boolean, so the probe opens it the way ⌘/ does. */
  "keyboard-shortcuts": () => (
    <div data-probe="keyboard-shortcuts">
      <KeyboardCheatSheet isOpen onClose={() => {}} composer={layersComposer()} />
    </div>
  ),
  /* Board 429:2350 — the animation editor's Entrance card. The editor takes
     only `{animation, onChange}` and mounts with no composer at all, so this
     is the shipping component with a real AnimationConfig. The 320 host is
     the board's own card (429:2351): the chip grid is `repeat(3, 1fr)` inside
     the editor's 12 padding, so 320 is what makes a chip 93 wide the way the
     board draws it. `fadeInUp` is selected because 429:2364 is the chip the
     board draws selected. */
  "animation-editor": () => (
    <div data-probe="animation-editor" style={{ width: 320, background: "var(--bk-gray-50)" }}>
      <AnimationEditor
        animation={{
          type: "fadeInUp",
          duration: 600,
          delay: 0,
          easing: "ease",
          direction: "normal",
          iterations: 1,
          trigger: "load",
        }}
        onChange={() => {}}
      />
    </div>
  ),
  "undo-redo-toasts": () => (
    <div data-probe="undo-redo-toasts">
      <ToastProvider>
        <UndoToastFirer />
      </ToastProvider>
    </div>
  ),
  /* Board 638:2378 — Settings · General. The screen reads and writes through
     `composer.getProjectSettings()/setProjectSettings()` and touches nothing
     else, so a two-method stub is the whole dependency. It is hosted in the
     board's own pane: `.bd-set-pane-body` supplies the 32/24 insets and the
     bg-app ground, and 824 is 760 (the card) plus those two 32s. */
  "settings-general": () => {
    let settings: Record<string, unknown> = {
      seo: {
        siteName: "Bella Cucina",
        favicon: "",
        language: "en",
        socialLinks: { twitter: "", facebook: "", linkedin: "" },
      },
    };
    const composer = {
      getProjectSettings: () => settings,
      setProjectSettings: (next: Record<string, unknown>) => {
        settings = next;
      },
      on: () => {},
      off: () => {},
    };
    return (
      <div data-probe="settings-general" style={{ width: 824, height: 700, display: "flex" }}>
        <div className="bd-set-pane-body">
          <SiteSettingsScreen composer={composer as never} />
        </div>
      </div>
    );
  },
  /* Boards 638:3070 · 639:3443 · 639:4144 — the three composer-backed S7
     screens. Same host and same two-method stub as settings-general; only the
     screen changes. */
  "settings-seo": () => (
    <SettingsPane case_="settings-seo">
      <SeoScreen
        composer={settingsComposer({
          seo: { metaTitleTemplate: "", twitterHandle: "", defaultOgImage: "" },
        }) as never}
      />
    </SettingsPane>
  ),
  "settings-analytics": () => (
    <SettingsPane case_="settings-analytics">
      <AnalyticsScreen composer={settingsComposer({ analytics: {} }) as never} />
    </SettingsPane>
  ),
  "settings-custom-code": () => (
    <SettingsPane case_="settings-custom-code">
      {/* No `customCode` key: AdvancedScreen reads `s.customCode ?? DEFAULT_CUSTOM_CODE`,
          so an EMPTY object is truthy and hands it three undefined strings. */}
      <AdvancedScreen composer={settingsComposer({}) as never} />
    </SettingsPane>
  ),
  /* Boards 640:2789 · 639:3795 — both read the same `siteDetail.settings.get`
     row, so both get the same shape back and the real screen does the rest. */
  "settings-headers": () => {
    stubTrpc({
      "siteDetail.settings.get": {
        cspPolicy: "default-src 'self'",
        hstsMaxAge: null,
        xFrameOptions: "DENY",
        referrerPolicy: "strict-origin-when-cross-origin",
        permissionsPolicy: "",
      },
    });
    return (
      <SettingsPane case_="settings-headers">
        <HeadersScreen projectId="probe-site" />
      </SettingsPane>
    );
  },
  "settings-localization": () => {
    stubTrpc({
      "siteDetail.settings.get": {
        defaultLocale: "en-US",
        enabledLocales: ["en-US", "ur-PK"],
        autoRedirectLocale: false,
      },
    });
    return (
      <SettingsPane case_="settings-localization">
        <LocalizationScreen projectId="probe-site" composer={settingsComposer({}) as never} />
      </SettingsPane>
    );
  },
  /* Board 640:2440 — the board's own pair of redirects. */
  "settings-redirects": () => {
    stubTrpc({
      "siteDetail.redirects.list": [
        { id: "r1", fromPath: "/pizza-menu", toPath: "/menu", statusCode: 301 },
        { id: "r2", fromPath: "/contact-us", toPath: "/contact", statusCode: 301 },
      ],
    });
    return (
      <SettingsPane case_="settings-redirects">
        <RedirectsScreen projectId="probe-site" />
      </SettingsPane>
    );
  },
  /* Board 640:3135 — one form block with a page of submissions behind it, so
     the picker and the inbox both render rather than the empty state. */
  "settings-forms": () => {
    stubTrpc({
      "forms.listBlocks": [
        { id: "f1", name: "Contact", isActive: true, _count: { submissions: 2 } },
      ],
      "forms.listSubmissions": {
        total: 2,
        page: 1,
        perPage: 20,
        data: [
          {
            id: "s1",
            formBlockId: "f1",
            siteId: "probe-site",
            data: { name: "Ayesha", email: "ayesha@example.com" },
            sourceUrl: null,
            isRead: false,
            isSpam: false,
            isArchived: false,
            createdAt: "2026-09-01T10:00:00.000Z",
          },
          {
            id: "s2",
            formBlockId: "f1",
            siteId: "probe-site",
            data: { name: "Bilal", email: "bilal@example.com" },
            sourceUrl: null,
            isRead: true,
            isSpam: false,
            isArchived: false,
            createdAt: "2026-09-01T09:00:00.000Z",
          },
        ],
      },
    });
    return (
      <SettingsPane case_="settings-forms">
        <FormsScreen projectId="probe-site" />
      </SettingsPane>
    );
  },
  /* Board 640:3849 — a connected endpoint, which is what the board draws
     (a URL, an event list and a masked secret), not the empty state. */
  "settings-webhooks": () => {
    stubTrpc({
      "webhooks.status": {
        url: "https://api.bellacucina.com/hooks/buildrick",
        events: ["site.publish"],
        secret: "whsec_9f2c41a8b7e3",
        lastDeliveryAt: "2026-09-01T10:00:00.000Z",
        lastStatus: "200",
        failures24h: 0,
        recentFailures: [],
      },
    });
    return (
      <SettingsPane case_="settings-webhooks">
        <WebhooksScreen />
      </SettingsPane>
    );
  },
  /* Board 639:3092 — the connected-domain state, in the S7 pane rather than
     the DNS drill-in `settings-domains-dns` measures. */
  "settings-domains": () => {
    /* No rows: board 639:3092 draws the CUSTOM DOMAIN card with a Domain FIELD
       in it, and that field only exists in the add state — which is behind the
       "Add domain" button, so the recipe clicks it. A connected row renders a
       status card instead and the field the board draws is not on screen. */
    stubTrpc({ "siteDetail.domains.list": [] });
    return (
      <SettingsPane case_="settings-domains">
        <DomainsScreen projectId="probe-site" />
      </SettingsPane>
    );
  },
  /* Board 807:8756 — the DNS-verification state. The rows come from the
     dashboard over tRPC (siteDetail.domains.list), so the probe answers that
     one request the way the notifications case does — one result entry per
     BATCHED call — and lets the real screen, the real client and the real
     30s recheck loop run. The fixture is the board's own pair: an A record
     verified and a CNAME still pending. */
  "settings-domains-dns": () => {
    const domains = [
      {
        id: "d1",
        domain: "bellacucina.com",
        status: "PENDING",
        sslStatus: "PENDING",
        isPrimary: true,
        dnsRecords: [
          { id: "r1", type: "A", host: "@", value: "76.76.21.21", verified: true },
          { id: "r2", type: "CNAME", host: "www", value: "cname.buildrick.app", verified: false },
        ],
      },
    ];
    window.fetch = (async (input: RequestInfo | URL) => {
      const url = new URL(String(typeof input === "string" ? input : (input as Request).url ?? input));
      const batched = JSON.parse(url.searchParams.get("input") ?? "{}") as Record<string, unknown>;
      const calls = Math.max(1, Object.keys(batched).length);
      return new Response(
        JSON.stringify(Array.from({ length: calls }, () => ({ result: { data: { json: domains } } }))),
        { headers: { "content-type": "application/json" } },
      );
    }) as typeof window.fetch;
    return (
      <div data-probe="settings-domains-dns" style={{ width: 824, height: 700, display: "flex" }}>
        <div className="bd-set-pane-body">
          <DomainsScreen projectId="probe-site" />
        </div>
      </div>
    );
  },
  /* Board 75:2 — the media drill-ins. Four of the five destinations mount
     side by side in the drawer-width host each of them is `absolute inset-0`
     inside, so every number below is read at the 320 the board draws. Nothing
     is re-implemented: these are the shipping overlays. The fifth, the image
     editor, is a separate full-bleed component and is adjudicated in the
     recipe note. */
  "media-drill-ins": () => (
    <div data-probe="media-drill-ins" style={{ display: "flex", gap: 20, padding: 20 }}>
      <div className="tw:relative tw:h-203 tw:w-70 tw:overflow-hidden tw:bg-white">
        <IconBrowserOverlay onClose={() => {}} onPick={() => {}} />
      </div>
      <div className="tw:relative tw:h-203 tw:w-70 tw:overflow-hidden tw:bg-white">
        <ToastProvider>
          <AutoOpen testid="media-detail-used">
            <AssetDetailOverlay item={DETAIL_ITEM} composer={USAGE_COMPOSER} onClose={() => {}} />
          </AutoOpen>
        </ToastProvider>
      </div>
      <div className="tw:relative tw:h-203 tw:w-70 tw:overflow-hidden tw:bg-white">
        <ToastProvider>
          <AutoOpen testid="media-detail-versions">
            <AssetDetailOverlay item={DETAIL_ITEM} composer={USAGE_COMPOSER} onClose={() => {}} />
          </AutoOpen>
        </ToastProvider>
      </div>
      <div className="tw:relative tw:h-203 tw:w-70 tw:overflow-hidden tw:bg-white">
        <StockBrowserOverlay
          onClose={() => {}}
          photos={STOCK_PHOTOS}
          videos={[]}
          loading={{ img: false, vid: false }}
          searchQuery="restaurant interior"
          orientation="all"
          color="all"
          onSearch={() => {}}
          onSetOrientation={() => {}}
          onSetColor={() => {}}
          onLoadMore={() => {}}
          onSave={() => {}}
        />
      </div>
    </div>
  ),
  "publish-load-error": () => {
    refuseFetch();
    return (
      <div data-probe="publish-load-error">
        <ToastProvider>
          <PublishTab
            composer={null}
            projectId="probe-site"
            onClose={() => {}}
            nextMove={null}
            onRequestPublish={() => {}}
            publishJob={PUBLISH_JOB()}
          />
        </ToastProvider>
      </div>
    );
  },
  /**
   * S1.4 · 4 of 7 and 7 of 7 (boards 296:1999 / 296:2030), plus the two
   * achievement prompts they hand off to (430:2348 / 430:2375).
   *
   * None of the four is reachable by clicking: every step credits on an
   * OUTCOME event (`OnboardingMount` STEP_SIGNALS — a brand applied, a review
   * sent, a publish), so a 4-of-7 checklist needs four real editor sessions
   * and the prompt needs a fifth. The real components are mounted over the
   * SSOT step list instead; only `completed` and `activeStepId` are fixtures.
   *
   * `activeStepId` is not a free choice — it is seeded the way the
   * orchestrator's own initialiser seeds it (useOnboardingOrchestrator:182):
   * the first incomplete step, which is `send-review` at 4/7 and `null` at
   * 7/7. Hard-coding `null` at 4/7 would have rendered the board's flat list
   * for free and measured a state no user arrives in.
   */
  ...(() => {
    const steps = (doneCount: number) =>
      DEFAULT_ONBOARDING_STEPS.map((s, i) => ({ ...s, completed: i < doneCount }));
    /* Stateful, not a frozen prop: the accordion is the shipped structure and
       the boards draw the list with NOTHING expanded, so the recipe has to be
       able to COLLAPSE the active step the way a user does — click its header.
       A no-op `onSetActiveStepId` would have made that click measure the
       state it started in and call it the board's. */
    const Checklist: React.FC<{ doneCount: number }> = ({ doneCount }) => {
      const rows = steps(doneCount);
      const [activeStepId, setActiveStepId] = React.useState<string | null>(
        () => rows.find((s) => !s.completed)?.id ?? null,
      );
      return (
        <OnboardingChecklist
          steps={rows}
          completedCount={doneCount}
          totalCount={DEFAULT_ONBOARDING_STEPS.length}
          activeStepId={activeStepId}
          onSetActiveStepId={setActiveStepId}
          onAction={() => {}}
          onDismiss={() => {}}
          onMinimize={() => {}}
          isMinimized={false}
          onRestore={() => {}}
        />
      );
    };
    return {
      "s1-4-4-of-7": () => (
        <div data-probe="s1-4-4-of-7">
          <Checklist doneCount={4} />
        </div>
      ),
      "s1-4-7-of-7": () => (
        <div data-probe="s1-4-7-of-7">
          <Checklist doneCount={7} />
        </div>
      ),
      /**
       * S1.2f · save-indicator (board 813:4836) — the ONE board that draws
       * five states, split across two cases for one reason: states 2 and 3
       * are the SAME `saved` branch at two clock positions ("only savedAt is
       * older", says the board's own caption), so they render the same
       * `save-status-saved` anchor and cannot both stand on one page.
       *
       * `savedAt` is computed off `Date.now()` rather than pinned, because the
       * label is relative — a fixed epoch would read "2y ago" tomorrow.
       */
      /**
       * S1.2 · load-error (board 297:2139, banner 297:2243).
       *
       * `loadError` is set only by a FAILED dashboard round-trip
       * (useComposerInit's `.catch`), which no click reaches and no fixture in
       * the demo produces — the demo has no siteId and never calls the
       * dashboard at all. So the real banner is mounted directly, in the
       * `network` kind the board draws, at the board's full 1440 width.
       */
      "s1-2-load-error": () => (
        <div data-probe="s1-2-load-error" className="tw:w-[1440px]">
          <LoadErrorBanner kind="network" onRetry={() => {}} onSignIn={() => {}} />
        </div>
      ),
      "s1-2f-save-indicator": () => (
        <div data-probe="s1-2f-save-indicator" className="tw:flex tw:flex-col tw:items-start tw:gap-4 tw:p-4">
          <SaveStatus state="saving" />
          <SaveStatus state="saved" savedAt={Date.now()} />
          <SaveStatus state="unsaved" />
          <SaveStatus state="error" onClick={() => {}} />
        </div>
      ),
      "s1-2f-save-indicator-saved-stale": () => (
        <div data-probe="s1-2f-save-indicator-saved-stale" className="tw:flex tw:flex-col tw:items-start tw:gap-4 tw:p-4">
          <SaveStatus state="saved" savedAt={Date.now() - 2 * 60_000} />
        </div>
      ),
      "onboarding-achievement-step-complete": () => (
        <div data-probe="onboarding-achievement-step-complete">
          <AchievementPrompt
            completedStep={{ ...DEFAULT_ONBOARDING_STEPS[2], completed: true }}
            nextStep={DEFAULT_ONBOARDING_STEPS[3]}
            isLastStep={false}
            onDismiss={() => {}}
          />
        </div>
      ),
      "onboarding-achievement-final-step": () => (
        <div data-probe="onboarding-achievement-final-step">
          <AchievementPrompt
            completedStep={{ ...DEFAULT_ONBOARDING_STEPS[6], completed: true }}
            nextStep={null}
            isLastStep
            onDismiss={() => {}}
          />
        </div>
      ),
    };
  })(),
};

const name = new URLSearchParams(location.search).get("case") ?? "";

/* history.css reaches production through LeftSidebar.css, which this page does
   not mount — so the History panel rendered here with none of its own rules:
   `.bd-history-container` had no `flex: 1`, `.activity-view` no `height: 100%`
   and `.virtual-list` no `flex: 1`, which left ActivityView's measured height
   at 0 and its list rendering NOTHING. A probe that measures a panel without
   the panel's stylesheet is measuring a different component.

   Loaded per-case rather than at module scope on purpose: history.css claims
   generic names (`.toast`, `.empty-state`, `.skeleton`, `.action-btn`), and a
   static import would apply them to every OTHER case on this page too. */
if (name.startsWith("history-")) {
  await import("@/editor/sidebar/tabs/history/styles/history.css");
}

/* Same trap, same shape: PagesTab.css reaches the app through PagesTab.tsx,
   and these cases mount PageList directly. Without it every `.bd-pg-*` rule is
   absent — the error block measured 16px black text on a 0-radius search box,
   i.e. the browser's defaults, not the panel. Scoped to the pages cases
   because `.bd-pg-*` is namespaced but the file also sets `--pg-*` custom
   properties on `.bd-pg-panel`. */
if (name.startsWith("pages-")) {
  await import("@/editor/sidebar/tabs/pages/PagesTab.css");
}

/* Same trap again: header.css is what gives .bk-notifications its 360 width,
   its ground and its row rules, and it reaches the app through Topbar, not
   through NotificationPanel. Per-case for the same reason as history.css —
   the file also claims .bk-topbar* and .bk-notif-*. */
if (name.startsWith("notifications-")) {
  await import("@/editor/shell/header.css");
}

/* settings.css reaches the app through shared.tsx, which the screen imports —
   so it is already loaded here. The pane wrapper (`.bd-set-pane-body`) is the
   part that lives in SettingsTab and would otherwise be missing, which is why
   the case mounts it by hand rather than styling a host div. */

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
