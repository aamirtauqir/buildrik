"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc/client";
import { ViewToggle } from "@/components/sites/view-toggle";
import { SiteFilters } from "@/components/sites/site-filters";
import { FolderTabs } from "@/components/sites/folder-tabs";
import { SiteGrid } from "@/components/sites/site-grid";
import { SiteListView } from "@/components/sites/site-list-view";
import { BulkActionBar, BULK_SELECTION_CAP } from "@/components/sites/bulk-action-bar";
import { CreateSiteModal } from "@/components/sites/create-site-modal";
import { RenameModal } from "@/components/sites/rename-modal";
import { DeleteConfirmModal } from "@/components/sites/delete-confirm-modal";
import { TransferModal } from "@/components/sites/transfer-modal";
import { useToast } from "@/components/dashboard/toast-provider";
import Link from "next/link";
import { Plus, Search } from "lucide-react";

export default function SitesPage() {
  const { addToast } = useToast();

  // Preferences
  const prefs = trpc.account.preferences.get.useQuery();
  const updatePrefs = trpc.account.preferences.update.useMutation();

  // View state
  const [viewMode, setViewMode] = useState("grid");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [sort, setSort] = useState("lastEdited");
  const [page, setPage] = useState(1);
  const [folderId, setFolderId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const lastSelectedIdRef = useRef<string | null>(null);

  // Advanced filter state
  const [createdBy, setCreatedBy] = useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d" | undefined>(undefined);
  const [templateUsed, setTemplateUsed] = useState<string | undefined>(undefined);
  const [hasCustomDomain, setHasCustomDomain] = useState<boolean | undefined>(undefined);
  const [hasTraffic, setHasTraffic] = useState<"none" | "1-100" | "100-1000" | "1000+" | undefined>(undefined);

  // Initialize from saved preferences
  useEffect(() => {
    if (prefs.data) {
      if (prefs.data.siteViewMode) setViewMode(prefs.data.siteViewMode);
      if (prefs.data.siteViewSort) setSort(prefs.data.siteViewSort);
    }
  }, [prefs.data]);

  // Modal state
  const [createOpen, setCreateOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [transferTarget, setTransferTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Queries
  const sitesQuery = trpc.sites.list.useQuery({
    page,
    perPage: 12,
    status: showArchived ? "ARCHIVED" as const : status as "PUBLISHED" | "DRAFT" | "ARCHIVED" | undefined,
    sort: sort as
      | "lastEdited"
      | "name"
      | "created"
      | "traffic"
      | "pages"
      | "published",
    search: search || undefined,
    folderId: showArchived ? undefined : folderId,
    createdBy,
    dateRange,
    templateUsed,
    hasCustomDomain,
    hasTraffic,
  });

  const foldersQuery = trpc.sites.folders.list.useQuery();

  // Mutations
  const createMutation = trpc.sites.create.useMutation({
    onSuccess: () => {
      sitesQuery.refetch();
      setCreateOpen(false);
      addToast("success", "Site created");
    },
    onError: (err) => addToast("error", "Failed to create site", err.message),
  });

  const renameMutation = trpc.sites.rename.useMutation({
    onSuccess: () => {
      sitesQuery.refetch();
      setRenameTarget(null);
      addToast("success", "Site renamed");
    },
  });

  const deleteMutation = trpc.sites.delete.useMutation({
    onSuccess: () => {
      sitesQuery.refetch();
      setDeleteTarget(null);
      addToast("success", "Site deleted");
    },
    onError: (err) => addToast("error", "Failed to delete", err.message),
  });

  const archiveMutation = trpc.sites.archive.useMutation({
    onSuccess: () => {
      sitesQuery.refetch();
      addToast("success", "Site archived");
    },
  });

  const duplicateMutation = trpc.sites.duplicate.useMutation({
    onSuccess: () => {
      sitesQuery.refetch();
      addToast("success", "Site duplicated");
    },
    onError: (err) => addToast("error", "Failed to duplicate", err.message),
  });

  const bulkMutation = trpc.sites.bulk.useMutation({
    onSuccess: () => {
      sitesQuery.refetch();
      setSelectedIds(new Set());
      addToast("success", "Bulk action completed");
    },
  });

  const moveMutation = trpc.sites.folders.moveSite.useMutation({
    onSuccess: () => {
      sitesQuery.refetch();
      addToast("success", "Sites moved to folder");
    },
    onError: (err: { message: string }) => addToast("error", "Failed to move sites", err.message),
  });

  // Selection handler with shift+click range selection
  const handleSelect = useCallback((id: string, event?: React.MouseEvent) => {
    const sites = sitesQuery.data?.data ?? [];

    if (event?.shiftKey && lastSelectedIdRef.current) {
      const siteIds = sites.map((s) => s.id);
      const lastIdx = siteIds.indexOf(lastSelectedIdRef.current);
      const currentIdx = siteIds.indexOf(id);
      if (lastIdx !== -1 && currentIdx !== -1) {
        const start = Math.min(lastIdx, currentIdx);
        const end = Math.max(lastIdx, currentIdx);
        const rangeIds = siteIds.slice(start, end + 1);

        setSelectedIds((prev) => {
          const next = new Set(prev);
          for (const rangeId of rangeIds) {
            if (next.size >= BULK_SELECTION_CAP && !next.has(rangeId)) {
              addToast("warning", `Selection capped at ${BULK_SELECTION_CAP} items`);
              break;
            }
            next.add(rangeId);
          }
          return next;
        });
        lastSelectedIdRef.current = id;
        return;
      }
    }

    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (next.size >= BULK_SELECTION_CAP) {
          addToast("warning", `Selection capped at ${BULK_SELECTION_CAP} items`);
          return prev;
        }
        next.add(id);
      }
      return next;
    });
    lastSelectedIdRef.current = id;
  }, [sitesQuery.data, addToast]);

  const handleSelectAll = useCallback(() => {
    if (!sitesQuery.data) return;
    const allIds = sitesQuery.data.data.map((s) => s.id);
    const allSelected = allIds.every((id) => selectedIds.has(id));
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      const capped = allIds.slice(0, BULK_SELECTION_CAP);
      if (allIds.length > BULK_SELECTION_CAP) {
        addToast("warning", `Selection capped at ${BULK_SELECTION_CAP} items`);
      }
      setSelectedIds(new Set(capped));
    }
  }, [sitesQuery.data, selectedIds, addToast]);

  // Context menu action handler
  const handleSiteAction = useCallback(
    (action: string, siteId: string) => {
      const site = sitesQuery.data?.data.find((s) => s.id === siteId);
      switch (action) {
        case "edit":
          window.location.href = `/editor/${siteId}`;
          break;
        case "manage":
          window.location.href = `/dashboard/sites/${siteId}`;
          break;
        case "rename":
          if (site) setRenameTarget({ id: siteId, name: site.name });
          break;
        case "duplicate":
          duplicateMutation.mutate({ id: siteId });
          break;
        case "archive":
          archiveMutation.mutate({ id: siteId });
          break;
        case "delete":
          if (site) setDeleteTarget({ id: siteId, name: site.name });
          break;
        case "transfer":
          if (site) setTransferTarget({ id: siteId, name: site.name });
          break;
        case "copyUrl":
          if (site) {
            navigator.clipboard.writeText(`${site.slug}.buildrik.app`);
            addToast("success", "URL copied to clipboard");
          }
          break;
        case "viewPublished":
          if (site?.publishedUrl) window.open(site.publishedUrl, "_blank");
          break;
      }
    },
    [sitesQuery.data, duplicateMutation, archiveMutation, addToast]
  );

  // Bulk action handler
  const handleBulkAction = useCallback(
    (action: string, folderId?: string) => {
      const ids = Array.from(selectedIds);
      if (action === "move" && folderId) {
        for (const siteId of ids) {
          moveMutation.mutate({ siteId, folderId });
        }
        setSelectedIds(new Set());
        return;
      }
      if (action === "delete" || action === "publish" || action === "unpublish" || action === "archive" || action === "unarchive") {
        bulkMutation.mutate({
          action: action as "archive" | "delete" | "unarchive" | "publish" | "unpublish",
          siteIds: ids,
        });
      }
    },
    [selectedIds, bulkMutation, moveMutation]
  );

  // Folder tabs
  const folderTabs = [
    {
      id: null,
      name: "All Sites",
      count: sitesQuery.data?.total ?? 0,
    },
    ...(foldersQuery.data?.map((f: { id: string; name: string; _count?: { sites: number } }) => ({
      id: f.id,
      name: f.name,
      count: f._count?.sites ?? 0,
    })) ?? []),
  ];

  const folders = (foldersQuery.data ?? []).map((f: { id: string; name: string }) => ({
    id: f.id,
    name: f.name,
  }));

  const sites = sitesQuery.data?.data ?? [];
  const allSelected =
    sites.length > 0 && sites.every((s) => selectedIds.has(s.id));

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1
          className="text-[22px] font-bold"
          style={{ color: "#0D0D0D" }}
        >
          My Sites
        </h1>
        <div className="flex items-center gap-3">
          <ViewToggle value={viewMode} onChange={(mode) => {
            setViewMode(mode);
            updatePrefs.mutate({ siteViewMode: mode as "grid" | "list" });
          }} />
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: "#E42313" }}
          >
            <Plus className="h-4 w-4" />
            New Site
          </button>
        </div>
      </div>

      {/* Folder Tabs */}
      <div className="mt-4">
        <FolderTabs
          tabs={folderTabs}
          activeId={folderId}
          onSelect={(id) => {
            setFolderId(id);
            setShowArchived(false);
            setPage(1);
          }}
          onCreateFolder={() => {
            const name = prompt("Folder name:");
            if (name)
              trpc.useUtils().client.sites.folders.create.mutate({ name });
          }}
          archivedCount={0}
          showArchived={showArchived}
          onToggleArchived={() => {
            setShowArchived(!showArchived);
            setFolderId(null);
            setPage(1);
          }}
        />
      </div>

      {/* Filters */}
      <div className="mt-4">
        <SiteFilters
          search={search}
          onSearchChange={(val) => { setSearch(val); setPage(1); }}
          status={status}
          onStatusChange={(val) => { setStatus(val); setPage(1); }}
          sort={sort}
          onSortChange={(val) => {
            setSort(val);
            setPage(1);
            updatePrefs.mutate({ siteViewSort: val });
          }}
          createdBy={createdBy}
          onCreatedByChange={(val) => { setCreatedBy(val); setPage(1); }}
          dateRange={dateRange}
          onDateRangeChange={(val) => { setDateRange(val); setPage(1); }}
          templateUsed={templateUsed}
          onTemplateUsedChange={(val) => { setTemplateUsed(val); setPage(1); }}
          hasCustomDomain={hasCustomDomain}
          onHasCustomDomainChange={(val) => { setHasCustomDomain(val); setPage(1); }}
          hasTraffic={hasTraffic}
          onHasTrafficChange={(val) => { setHasTraffic(val); setPage(1); }}
        />
      </div>

      {/* Loading */}
      {sitesQuery.isLoading && (
        <div className="mt-6 grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-52 animate-pulse rounded-xl"
              style={{ backgroundColor: "#F4F4F4" }}
            />
          ))}
        </div>
      )}

      {/* Content */}
      {!sitesQuery.isLoading && sites.length === 0 && (search || status || createdBy || dateRange || templateUsed || hasCustomDomain !== undefined || hasTraffic) && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Search className="h-10 w-10 mb-4" style={{ color: "#B0B0B0" }} />
          <h3 className="text-base font-semibold" style={{ color: "#0D0D0D" }}>No sites found</h3>
          <p className="text-sm mt-1" style={{ color: "#7A7A7A" }}>
            Try a different search term or filter.
          </p>
        </div>
      )}

      {!sitesQuery.isLoading && sites.length === 0 && !search && !status && !createdBy && !dateRange && !templateUsed && hasCustomDomain === undefined && !hasTraffic && (
        <div
          className="mt-8 flex flex-col items-center rounded-xl border-2 border-dashed py-16 text-center"
          style={{ borderColor: "#E8E8E8" }}
        >
          <p
            className="text-base font-semibold"
            style={{ color: "#0D0D0D" }}
          >
            No sites yet
          </p>
          <p
            className="mt-1 text-sm"
            style={{ color: "#7A7A7A" }}
          >
            Create your first site to get started.
          </p>
          <button
            onClick={() => setCreateOpen(true)}
            className="mt-4 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: "#E42313" }}
          >
            <Plus className="h-4 w-4" />
            Create Site
          </button>
        </div>
      )}

      {!sitesQuery.isLoading && sites.length > 0 && (
        <div className="mt-6">
          {viewMode === "grid" ? (
            <SiteGrid
              sites={sites}
              selectedIds={selectedIds}
              onSelect={handleSelect}
              onAction={handleSiteAction}
            />
          ) : (
            <SiteListView
              sites={sites}
              selectedIds={selectedIds}
              onSelect={handleSelect}
              onSelectAll={handleSelectAll}
              allSelected={allSelected}
              onAction={handleSiteAction}
            />
          )}
        </div>
      )}

      {/* Pagination */}
      {sitesQuery.data && sitesQuery.data.totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm" style={{ color: "#7A7A7A" }}>
            Page {page} of {sitesQuery.data.totalPages} ({sitesQuery.data.total} sites)
          </p>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 text-sm rounded-lg border disabled:opacity-50"
              style={{ borderColor: "#E8E8E8" }}
            >
              Previous
            </button>
            <button
              disabled={page >= sitesQuery.data.totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 text-sm rounded-lg border disabled:opacity-50"
              style={{ borderColor: "#E8E8E8" }}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedIds.size}
        onAction={handleBulkAction}
        onClear={() => setSelectedIds(new Set())}
        folders={folders}
      />

      {/* Modals */}
      <CreateSiteModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={(data) =>
          createMutation.mutate({
            name: data.name,
            method: data.method as "blank" | "template" | "ai",
          })
        }
      />

      {renameTarget && (
        <RenameModal
          open={true}
          currentName={renameTarget.name}
          onClose={() => setRenameTarget(null)}
          onSubmit={(name) =>
            renameMutation.mutate({ id: renameTarget.id, name })
          }
        />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          open={true}
          siteName={deleteTarget.name}
          onClose={() => setDeleteTarget(null)}
          onConfirm={(name) =>
            deleteMutation.mutate({
              id: deleteTarget.id,
              confirmName: name,
            })
          }
        />
      )}

      {transferTarget && (
        <TransferModal
          open={true}
          siteId={transferTarget.id}
          siteName={transferTarget.name}
          onClose={() => setTransferTarget(null)}
        />
      )}
    </div>
  );
}
