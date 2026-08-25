import { prisma } from "@/lib/prisma";
import type {
  CreateClientInput,
  UpdateClientInput,
} from "@buildrik/shared/schemas/clients";

/**
 * Agency Client node (redesign E2) — the ONLY layer that reads/writes the
 * clients table. Every op is scoped by workspaceId so a client in one workspace
 * can never be read or mutated through another (IDOR guard); the router supplies
 * workspaceId from the authenticated session, never from client input.
 */

export class ClientError extends Error {
  constructor(
    public code: "NOT_FOUND",
    message: string,
  ) {
    super(message);
    this.name = "ClientError";
  }
}

export interface ClientWithCount {
  id: string;
  name: string;
  logoUrl: string | null;
  brandColor: string | null;
  customDomain: string | null;
  hideBuildrik: boolean;
  siteCount: number;
}

/** All clients in a workspace, alphabetized, each with its live site count. */
export async function listClients(
  workspaceId: string,
): Promise<ClientWithCount[]> {
  const rows = await prisma.client.findMany({
    where: { workspaceId },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      logoUrl: true,
      brandColor: true,
      customDomain: true,
      hideBuildrik: true,
      /* `listSites` filters `deletedAt: null`; this count did not, so the
         Clients table and the client's own site list disagreed after any
         delete. Same filter, one source of truth. */
      _count: { select: { sites: { where: { deletedAt: null } } } },
    },
  });
  return rows.map(({ _count, ...c }) => ({ ...c, siteCount: _count.sites }));
}

export async function createClient(
  workspaceId: string,
  input: CreateClientInput,
) {
  return prisma.client.create({
    data: {
      workspaceId,
      name: input.name,
      logoUrl: input.logoUrl ?? null,
      brandColor: input.brandColor ?? null,
      customDomain: input.customDomain ?? null,
      hideBuildrik: input.hideBuildrik ?? false,
    },
  });
}

// Confirm the target belongs to this workspace before any mutate — Prisma's
// update/delete key on the globally-unique id alone, so without this a crafted
// id could reach another workspace's client.
async function assertInWorkspace(
  workspaceId: string,
  id: string,
): Promise<void> {
  const owned = await prisma.client.findFirst({
    where: { id, workspaceId },
    select: { id: true },
  });
  if (!owned) throw new ClientError("NOT_FOUND", "Client not found");
}

export async function updateClient(
  workspaceId: string,
  input: UpdateClientInput,
) {
  await assertInWorkspace(workspaceId, input.id);
  const { id, ...rest } = input;
  return prisma.client.update({ where: { id }, data: rest });
}

/** Deleting a client orphans its sites (Site.clientId SetNull), never deletes them. */
export async function deleteClient(
  workspaceId: string,
  id: string,
): Promise<void> {
  await assertInWorkspace(workspaceId, id);
  await prisma.client.delete({ where: { id } });
}

/** One client with its live site count, workspace-scoped (drives the drill-in page). */
export async function getClient(
  workspaceId: string,
  id: string,
): Promise<ClientWithCount> {
  const c = await prisma.client.findFirst({
    where: { id, workspaceId },
    select: {
      id: true,
      name: true,
      logoUrl: true,
      brandColor: true,
      customDomain: true,
      hideBuildrik: true,
      /* `listSites` filters `deletedAt: null`; this count did not, so the
         Clients table and the client's own site list disagreed after any
         delete. Same filter, one source of truth. */
      _count: { select: { sites: { where: { deletedAt: null } } } },
    },
  });
  if (!c) throw new ClientError("NOT_FOUND", "Client not found");
  const { _count, ...rest } = c;
  return { ...rest, siteCount: _count.sites };
}

/**
 * Assign a site to a client (or null to unassign). Both the site and the target
 * client must live in the caller's workspace — a site can never be pulled into
 * another workspace's client, nor an out-of-workspace site assigned here.
 */
export async function assignSite(
  workspaceId: string,
  siteId: string,
  clientId: string | null,
): Promise<void> {
  const site = await prisma.site.findFirst({
    where: { id: siteId, workspaceId },
    select: { id: true },
  });
  if (!site) throw new ClientError("NOT_FOUND", "Site not found");
  if (clientId) await assertInWorkspace(workspaceId, clientId);
  await prisma.site.update({ where: { id: siteId }, data: { clientId } });
}
