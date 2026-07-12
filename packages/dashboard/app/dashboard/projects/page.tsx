"use client";

import Link from "next/link";
import { Folder, FolderPlus, Layers, MoreHorizontal, Plus, Users } from "lucide-react";
import { trpc } from "@lib/trpc/client";
import { LoadingSkeleton, ErrorState, StateEmpty } from "@/components/states";
import { PageHeader, MetricValue, Pill } from "@/components/dashboard/primitives";
import { useToast } from "@/components/dashboard/toast-provider";

const UNGROUPED_KEY = "__ungrouped__";

type ProjectGroup = {
  key: string;
  name: string;
  total: number;
  published: number;
  ungrouped: boolean;
  /** distinct site creators in this project — no name/avatar data exists, so this
   *  drives a member-count chip rather than an avatar stack */
  members: Set<string>;
};

export default function ProjectsPage() {
  const { addToast } = useToast();
  // Real workspace sites (max page size) — counts are derived from these rows.
  const sitesQuery = trpc.sites.list.useQuery({ page: 1, perPage: 50 });
  // Folder names + membership; folders with no sites still surface as projects.
  const foldersQuery = trpc.sites.folders.list.useQuery();

  const createFolderMutation = trpc.sites.folders.create.useMutation({
    onSuccess: () => {
      foldersQuery.refetch();
      addToast("success", "Folder created");
    },
    onError: (err) => addToast("error", "Failed to create folder", err.message),
  });

  const handleNewFolder = () => {
    const name = window.prompt("Folder name")?.trim();
    if (name) createFolderMutation.mutate({ name });
  };

  const isLoading = sitesQuery.isLoading || foldersQuery.isLoading;
  const isError = sitesQuery.isError || foldersQuery.isError;

  const sites = sitesQuery.data?.data ?? [];
  const folders = foldersQuery.data ?? [];

  // Seed one group per folder so empty projects still appear, then fold each
  // site into its folder (or the Ungrouped bucket) counting totals + published.
  const groupMap = new Map<string, ProjectGroup>();
  for (const folder of folders) {
    groupMap.set(folder.id, { key: folder.id, name: folder.name, total: 0, published: 0, ungrouped: false, members: new Set() });
  }
  for (const site of sites) {
    const key = site.folderId ?? UNGROUPED_KEY;
    let group = groupMap.get(key);
    if (!group) {
      // Reached for the Ungrouped bucket, or a site whose folder isn't in the
      // folders list — we can't invent a folder name, so it reads as Ungrouped.
      group = { key, name: "Ungrouped", total: 0, published: 0, ungrouped: true, members: new Set() };
      groupMap.set(key, group);
    }
    group.total += 1;
    if (site.status === "PUBLISHED") group.published += 1;
    if (site.createdBy) group.members.add(site.createdBy);
  }
  const groups = [...groupMap.values()];

  return (
    <div>
      <PageHeader
        title="All projects"
        description="Group sites into projects for clients and teams."
        actions={
          <>
            <button
              type="button"
              onClick={handleNewFolder}
              disabled={createFolderMutation.isPending}
              className="flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors hover:bg-[var(--color-bg-subtle)] disabled:pointer-events-none disabled:opacity-60"
              style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-primary)" }}
            >
              <FolderPlus className="h-4 w-4" />
              New folder
            </button>
            <Link
              href="/dashboard/sites/new"
              className="flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-hover)]"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              <Plus className="h-4 w-4" />
              New project
            </Link>
          </>
        }
      />

      {isLoading ? (
        <LoadingSkeleton rows={6} variant="card" />
      ) : isError ? (
        <ErrorState
          title="Couldn't load projects"
          description="Something went wrong on our end."
          onRetry={() => {
            sitesQuery.refetch();
            foldersQuery.refetch();
          }}
        />
      ) : sites.length === 0 ? (
        <StateEmpty
          icon={<Layers className="h-7 w-7" />}
          title="No projects yet"
          description="Create your first site and it'll show up here, grouped into projects you can share with clients and teams."
          action={{ label: "New site", href: "/dashboard/sites/new" }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => {
            const Icon = group.ungrouped ? Layers : Folder;
            return (
              <div
                key={group.key}
                className="rounded-xl border p-5"
                style={{ borderColor: "var(--color-border-default)", backgroundColor: "var(--color-bg-surface)" }}
              >
                <div className="mb-4 flex items-start justify-between">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg"
                    style={{ backgroundColor: "var(--color-primary-subtle)", color: "var(--color-primary)" }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex items-center gap-2">
                    {group.members.size > 0 && (
                      <Pill tone="neutral" className="tabular-nums">
                        <Users className="h-3 w-3" />
                        {group.members.size} {group.members.size === 1 ? "member" : "members"}
                      </Pill>
                    )}
                    <button
                      type="button"
                      aria-label="Project options"
                      className="rounded-md p-1.5 transition-colors hover:bg-[var(--color-bg-subtle)]"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <h2 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>{group.name}</h2>
                <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  <MetricValue>{group.total}</MetricValue> {group.total === 1 ? "site" : "sites"}
                  {" · "}
                  <span style={{ color: "var(--color-success)" }}><MetricValue>{group.published}</MetricValue> published</span>
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
