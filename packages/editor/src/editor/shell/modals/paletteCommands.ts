/**
 * The ⌘K palette's command list — every row it can show, built per open
 * against the selection and role of that moment (CommandPalette renders it).
 *
 * @license BSD-3-Clause
 */
import type { Composer } from "@/engine";
import { EVENTS } from "@/shared/constants/events";
import { getSiteIdFromUrl } from "@/services/BuildrikSyncProvider";
import { isFeatureEnabled } from "@/shared/utils/featureFlags";
import { getLayerPreview } from "@/editor/panels/layers/data/layerUtils";
import { LAYER_NAME_KEY } from "@/shared/constants/elementTypeLabels";
import { ELEMENT_TYPE_LABELS } from "@/shared/constants/elementTypeLabels";
import { PAGE_TEMPLATES, getMyTemplates } from "@/editor/sidebar/tabs/templates/templatesData";
import { isTabAllowedForViewer, type GroupedTabId } from "@/editor/rail/tabsConfig";
import { recordHistoryCleared } from "@/shared/utils/historySessionMarkers";

// =============================================================================
// TYPES
// =============================================================================

export interface PaletteCommand {
  id: string;
  label: string;
  group: string;
  shortcut?: string;
  /** Registry `keywords` — matched by the filter beside the label. */
  keywords?: string[];
  handler: () => void;
  /** A command you cannot run is still worth seeing: disabled rows render
   *  muted as "Label · reason" and don't close the palette. */
  disabled?: boolean;
  disabledReason?: string;
  /** A door into a nested list (263:250988 "Go to page ›"): → or click opens it. */
  opens?: "pages";
}


// =============================================================================
// COMMANDS
// =============================================================================

/**
 * The tab a nav row's `openPanel`/`ui:switch-tab` call actually opens, for
 * gating against `isTabAllowedForViewer` — the SAME predicate
 * StudioPanels' rail/ui:switch-tab handler and useStudioState's
 * openLeftPanelToTab/setLeftPanelTab sink use. A row absent from this map
 * opens no tab (new-page, replace-layout, issues, shortcuts, permissions)
 * and is never hidden here.
 */
const NAV_TAB_TARGET: Partial<Record<string, GroupedTabId>> = {
  pages: "pages",
  add: "add",
  layers: "layers",
  assets: "assets",
  "asset-library": "assets",
  content: "content",
  design: "design",
  publish: "publish",
  templates: "templates",
  review: "review",
  activity: "activity",
  settings: "settings",
  components: "components",
};

export function buildCommands(
  composer: Composer | null,
  onClose: () => void,
  reviewsEnabled: boolean | null | undefined,
  viewerChrome: boolean,
): PaletteCommand[] {
  const commands: PaletteCommand[] = [];
  const run = (fn: () => void) => () => {
    fn();
    onClose();
  };
  const openPanel = (panel: string, screen?: string) =>
    composer?.emit(EVENTS.UI_PANEL_OPEN, screen ? { panel, screen } : { panel });

  // NAVIGATE — board order. Each is a door, so none prints a chord.
  const nav: Array<[string, string, () => void, string[]?]> = [
    ["pages", "Open Pages", () => openPanel("pages")],
    ["add", "Open Add", () => openPanel("add")],
    ["layers", "Open Layers", () => openPanel("layers")],
    ["assets", "Open Assets", () => openPanel("assets")],
    ["asset-library", "Open Asset library", () => composer?.emit(EVENTS.UI_SWITCH_TAB, { tab: "assets", fullPage: true }), ["media", "files"]],
    ["content", "Open CMS", () => openPanel("content"), ["collections", "records"]],
    ["design", "Open Brand", () => openPanel("design"), ["tokens", "colours", "fonts"]],
    ["publish", "Open Publish", () => openPanel("publish")],
    ["templates", "Browse Templates", () => openPanel("templates")],
    /* C4 #19: one of the New-page doors, from anywhere — the same event every
       door emits. */
    ["new-page", "New page", () => composer?.emit(EVENTS.UI_NEW_PAGE_REQUESTED, {}), ["page", "create", "add page"]],
    /* 4428:149355: the catalogue opens in replace mode for the active page. */
    ["replace-layout", "Replace layout with template…", () => composer?.emit(EVENTS.UI_BROWSE_TEMPLATES, { replace: true })],
    /* FB-4: the agency review layer is off for most sites — no row, no
       letter, no panel, until the workspace turns it on (server flag, not
       a client feature flag). The topbar Review pill stays visible either
       way (owner decision) — this only hides the ⌘K shortcut into it. */
    ...(reviewsEnabled ? ([["review", "Open Review", () => openPanel("review")]] as Array<[string, string, () => void, string[]?]>) : []),
    ["activity", "Open Activity", () => openPanel("activity")],
    ["issues", "Open Issues", () => composer?.emit(EVENTS.UI_OPEN_ISSUES, undefined), ["problems", "errors", "warnings", "checks"]],
    ["settings", "Open Site settings", () => openPanel("settings")],
    ["components", "Open Components", () => openPanel("components")],
    ["shortcuts", "Keyboard shortcuts", () => composer?.emit(EVENTS.UI_TOGGLE_CHEAT_SHEET, {})],
  ];
  for (const [id, label, fn, keywords] of nav) {
    const target = NAV_TAB_TARGET[id];
    if (target !== undefined && !isTabAllowedForViewer(target, viewerChrome)) continue;
    commands.push({ id: `nav-${id}`, label, group: "Navigate", keywords, handler: run(fn) });
  }
  /* 263:250083 / 263:250988: the pages are one nested list, not rows. */
  commands.push({ id: "nav-go-to-page", label: "Go to page", group: "Navigate", keywords: ["page", "open", "switch"], opens: "pages", handler: () => undefined });

  /* The Permissions dialog's door for every role but a viewer (whose door is
     the inspector notice) — and, for the owner, the way to delete the site
     (5905:44701). "More", so it shows only once typed: 4418:141220's opening
     list does not draw it. */
  commands.push({
    id: "nav-permissions",
    label: "Permissions",
    group: "More",
    keywords: ["role", "access", "delete site"],
    handler: run(() => composer?.emit(EVENTS.UI_OPEN_PERMISSIONS, undefined)),
  });

  if (!composer) return commands;

  const selectedCount = composer.selection?.getSelectedIds?.().length ?? 0;
  const selectedType = composer.selection?.getSelected?.()?.getType?.();
  const registry = composer.commands?.getAll?.() ?? [];
  const reg = (id: string) => registry.find((c) => c.id === id);
  /* Registry commands that quietly return when the selection is wrong. The
     engine cannot carry this — its list is built once at startup while the
     selection changes under it — so the reason is computed here, each open. */
  const guard = (cmd: { id: string; requiresSelection?: boolean }): string | undefined => {
    const blocked = composer.commands.blockedReason(cmd.id);
    if (blocked) return blocked;
    if (cmd.id === "group") return selectedCount < 2 ? "Select two or more elements" : undefined;
    if (cmd.id === "ungroup") return selectedType !== "container" ? "Select a group" : undefined;
    if (cmd.id === "paste") return composer.clipboard?.length ? undefined : "Nothing copied";
    if (cmd.requiresSelection) return selectedCount === 0 ? "Select an element first" : undefined;
    return undefined;
  };
  const used = new Set<string>();
  /** A registry command placed in one of the board's bands. */
  const fromRegistry = (id: string, group: string, label?: string) => {
    const cmd = reg(id);
    if (!cmd) return;
    used.add(id);
    const reason = guard(cmd);
    commands.push({
      id: `cmd-${id}`,
      label: label ?? cmd.label ?? id,
      group,
      shortcut: cmd.shortcut,
      keywords: cmd.keywords,
      disabled: reason !== undefined,
      disabledReason: reason,
      handler: run(() => composer.commands.run(id)),
    });
  };

  /* Undo, Redo and Clear history answer to the registry's gate (read-only,
     Time-travel, a full-page surface) — the same one ⌘Z does. */
  const historyBlock = composer.commands.blockedReason("undo");

  // EDIT
  commands.push({
    id: "edit-undo",
    label: "Undo",
    group: "Edit",
    shortcut: "Ctrl+Z",
    disabled: !!historyBlock || !composer.history.canUndo(),
    disabledReason: historyBlock ?? "No changes to undo",
    handler: run(() => composer.commands.run("undo")),
  });
  used.add("undo");
  fromRegistry("duplicate", "Edit");
  fromRegistry("replace-media", "Edit");

  // VIEW
  const pageName = composer.elements?.getActivePage?.()?.name;
  commands.push(
    { id: "view-zoom-50", label: "Zoom to 50%", group: "View", handler: run(() => composer.setZoom(50)) },
    {
      id: "view-preview",
      label: pageName ? `Preview ${pageName} page` : "Preview",
      group: "View",
      shortcut: "Ctrl+P",
      keywords: ["preview"],
      handler: run(() => composer.emit(EVENTS.UI_TOGGLE_PREVIEW, {})),
    },
  );

  // ADD
  fromRegistry("add-text", "Add");
  fromRegistry("add-container", "Add");

  // TOOLS
  fromRegistry("cms-records", "Tools");
  fromRegistry("save-template", "Tools");
  if (isTabAllowedForViewer("history", viewerChrome)) {
    commands.push({ id: "tools-history", label: "Open History", group: "Tools", handler: run(() => openPanel("history")) });
  }
  if (isTabAllowedForViewer("assets", viewerChrome)) {
    commands.push({
      id: "tools-stock",
      label: "Search stock photos",
      group: "Tools",
      keywords: ["unsplash", "pexels", "image", "photo"],
      handler: run(() => openPanel("assets", "stock")),
    });
  }

  // MORE — searchable, not in the opening list.
  commands.push(
    {
      id: "edit-redo",
      label: "Redo",
      group: "More",
      shortcut: "Ctrl+Y",
      disabled: !!historyBlock || !composer.history.canRedo(),
      disabledReason: historyBlock ?? "nothing to redo",
      handler: run(() => composer.commands.run("redo")),
    },
    { id: "view-zoom-in", label: "Zoom in", group: "More", shortcut: "Ctrl++", handler: run(() => composer.commands.run("zoom-in")) },
    { id: "view-zoom-out", label: "Zoom out", group: "More", shortcut: "Ctrl+-", handler: run(() => composer.commands.run("zoom-out")) },
    /* ⇧1 is fit (CanvasFooterToolbar binds ⇧1 fit, ⇧2 selection, ⇧0 100% —
       SC-12 / BD-39 moved them off ⌘1 / ⌘2, which switch browser tabs). */
    { id: "view-fit", label: "Zoom to fit", group: "More", shortcut: "Shift+1", handler: run(() => composer.emit(EVENTS.ZOOM_FIT, {})) },
    /* The footer flyout's third row (⇧2). Canvas has always listened for
       ZOOM_SELECTION; nothing emitted it (DQ-003). */
    { id: "view-zoom-selection", label: "Zoom to selection", group: "More", shortcut: "Shift+2", handler: run(() => composer.emit(EVENTS.ZOOM_SELECTION, {})) },
    /* The registry's chordless "Reset zoom" printed nothing although ⇧0 works
       (the flyout binds it). The row prints the flyout's chord, like fit's. */
    { id: "view-zoom-100", label: "Reset zoom", group: "More", shortcut: "Shift+0", handler: run(() => composer.setZoom(100)) },
    {
      id: "history-clear",
      label: "Clear history",
      group: "More",
      disabled: !!historyBlock,
      disabledReason: historyBlock,
      /* PD-38: kept, but not as a confirm-less destructive action — it used
         to emit HISTORY_CLEARED as pure notification, with nothing actually
         clearing the undo stack (C-6/A14-3). composer.history.clear() is the
         real op; a plain window.confirm is the smallest "with a confirm"
         that doesn't need new dialog plumbing inside the palette. */
      handler: run(() => {
        if (typeof window !== "undefined" && !window.confirm("Clear this session's undo history? This can't be undone.")) {
          return;
        }
        if (composer.history) recordHistoryCleared(composer);
        composer.history?.clear();
        composer.emit(EVENTS.HISTORY_CLEARED, undefined);
      }),
    },
  );
  used.add("redo");
  used.add("zoom-reset");

  /* Carried over from the canvas palette, flag-gated the same way StudioHeader
     gates the Collaborate CTA. Not a registry command: it needs the site id
     from the URL, which lives in services/ and engine/ may not import. */
  if (isFeatureEnabled("collab")) {
    commands.push({
      id: "start-collab",
      label: "Start collaboration session",
      group: "More",
      keywords: ["collaborate", "team", "real-time", "multiplayer", "share"],
      handler: run(() => {
        const siteId = getSiteIdFromUrl();
        if (siteId) void composer.collab.manager.startSession(siteId, "Editor").catch(() => {});
      }),
    });
  }

  /* TEMPLATES — the catalogue's own search went with 4418:54134 (it draws
     none); the owner kept the capability, so a template answers a query here
     and opens on its preview. Searchable only, never in the opening list. */
  for (const t of [...PAGE_TEMPLATES, ...getMyTemplates()]) {
    commands.push({
      id: `template-${t.id}`,
      label: t.name,
      group: "Templates",
      keywords: ["template"],
      handler: run(() => composer.emit(EVENTS.UI_BROWSE_TEMPLATES, { previewId: t.id })),
    });
  }

  /* LAYERS / ASSETS — the placeholder promises "pages, layers, assets":
     a layer on this page answers by its Layers name (custom name, else its
     first words, else its type) and the row selects it; an asset answers by
     name and opens the Asset library on it. Searchable only. */
  const page = composer.elements.getActivePage?.();
  const root = page ? composer.elements.getElement?.(page.root.id) : null;
  for (const el of root?.getDescendants?.() ?? []) {
    const custom = el.getCustomData?.(LAYER_NAME_KEY);
    const name =
      (typeof custom === "string" && custom) ||
      getLayerPreview(el) ||
      ELEMENT_TYPE_LABELS[el.getType()] ||
      el.getType();
    commands.push({
      id: `layer-${el.getId()}`,
      label: name,
      group: "Layers",
      keywords: ["layer", el.getType()],
      handler: run(() => {
        composer.selection.select(el);
        openPanel("layers");
      }),
    });
  }
  for (const asset of composer.media?.getAssets?.() ?? []) {
    commands.push({
      id: `asset-${asset.id}`,
      label: asset.name,
      group: "Assets",
      keywords: ["asset", "image", "file"],
      handler: run(() => {
        composer.media.selectAssets([asset.id]);
        composer.emit(EVENTS.UI_SWITCH_TAB, { tab: "assets", fullPage: true });
      }),
    });
  }

  /* Everything else the registry holds (devices, nudges…) —
     searchable under MORE. The Pages panel's rows keep their PAGES band. Dedup
     by id AND label: a registry row the board list already carries is not
     printed twice. */
  const seenLabels = new Set(commands.map((c) => c.label.toLowerCase()));
  for (const cmd of registry) {
    if (used.has(cmd.id)) continue;
    const label = cmd.label ?? cmd.id;
    if (seenLabels.has(label.toLowerCase())) continue;
    seenLabels.add(label.toLowerCase());
    const reason = guard(cmd);
    commands.push({
      id: `cmd-${cmd.id}`,
      label,
      /* PROPERTIES: the inspector's "Jump to property" rows (G2-146), searched
         only — not in the opening list. */
      group: cmd.group === "Pages" || cmd.group === "Properties" ? cmd.group : "More",
      shortcut: cmd.shortcut,
      keywords: cmd.keywords,
      disabled: reason !== undefined,
      disabledReason: reason,
      handler: run(() => composer.commands.run(cmd.id)),
    });
  }

  return commands;
}

