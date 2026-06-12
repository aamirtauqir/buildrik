import { prisma } from "@/lib/prisma";
import { UPLOAD_LIMITS, type PresignInput } from "@buildrik/shared/schemas/upload";

const TTL_MS = 10 * 60 * 1000;

function freshCutoff(): Date {
  return new Date(Date.now() - TTL_MS);
}

/**
 * Validate context + format at presign time, and size once the body exists.
 * Pass `sizeMB` only from the PUT handler — at presign the size isn't known
 * yet (the old code passed 0, a check that could never fail).
 */
export function validateUpload(context: string, fileType: string, sizeMB?: number): void {
  const limits = UPLOAD_LIMITS[context];
  if (!limits) throw new Error("INVALID_CONTEXT");
  if (!limits.formats.includes(fileType)) throw new Error("INVALID_FORMAT");
  if (sizeMB !== undefined && sizeMB > limits.maxSizeMB) throw new Error("FILE_TOO_LARGE");
}

export async function createPresignedUrl(
  input: Pick<PresignInput, "fileName" | "fileType" | "context" | "siteId">,
  userId: string,
  wsId: string,
): Promise<{ fileId: string; uploadUrl: string }> {
  validateUpload(input.context, input.fileType);

  const fileId = crypto.randomUUID();

  // DB-backed so the follow-up PUT and confirm can land on any lambda — the
  // previous in-memory Map 404'd every upload whose requests split across
  // instances. Expiry is enforced on read; the session-cleanup cron prunes.
  await prisma.pendingUpload.create({
    data: {
      id: fileId,
      fileName: input.fileName,
      fileType: input.fileType,
      context: input.context,
      userId,
      wsId,
      siteId: input.siteId,
    },
  });

  return { fileId, uploadUrl: `/api/upload/${fileId}` };
}

/** Internal — used by /api/upload/[fileId] route to look up entries. */
export async function getPendingUpload(fileId: string) {
  return prisma.pendingUpload.findFirst({
    where: { id: fileId, createdAt: { gte: freshCutoff() } },
  });
}

/** Internal — used by /api/upload/[fileId] route to record the real blob URL
 *  once the PUT body has been persisted to storage. */
export async function setPendingUploadStoredUrl(fileId: string, storedUrl: string): Promise<void> {
  const { count } = await prisma.pendingUpload.updateMany({
    where: { id: fileId, createdAt: { gte: freshCutoff() } },
    data: { storedUrl },
  });
  if (count === 0) throw new Error("NOT_FOUND");
}

export async function confirmUpload(
  fileId: string,
  userId: string,
): Promise<{ confirmed: true; cdnUrl: string }> {
  // Scoped to the presigning user — a fileId is a capability, but it must
  // not be confirmable by a different account.
  const upload = await prisma.pendingUpload.findFirst({
    where: { id: fileId, userId, createdAt: { gte: freshCutoff() } },
  });
  if (!upload) throw new Error("NOT_FOUND");
  if (!upload.storedUrl) throw new Error("NOT_UPLOADED");
  await prisma.pendingUpload.update({
    where: { id: fileId },
    data: { confirmed: true },
  });
  return { confirmed: true, cdnUrl: upload.storedUrl };
}

export function getUploadLimits() {
  return UPLOAD_LIMITS;
}
