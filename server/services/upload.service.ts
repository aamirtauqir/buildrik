import { UPLOAD_LIMITS, type PresignInput } from "@buildrik/shared/schemas/upload";

export type PendingUpload = {
  fileName: string;
  fileType: string;
  context: string;
  userId: string;
  wsId: string;
  siteId?: string;
  /** Actual stored URL once the PUT handler finishes upload to blob storage.
   *  Null until /api/upload/[fileId] writes the file and sets it. */
  storedUrl: string | null;
  createdAt: Date;
  confirmed: boolean;
};

const pendingUploads = new Map<string, PendingUpload>();
const TTL_MS = 10 * 60 * 1000;

export function validateUpload(context: string, fileType: string, sizeMB: number): void {
  const limits = UPLOAD_LIMITS[context];
  if (!limits) throw new Error("INVALID_CONTEXT");
  if (!limits.formats.includes(fileType)) throw new Error("INVALID_FORMAT");
  if (sizeMB > limits.maxSizeMB) throw new Error("FILE_TOO_LARGE");
}

export async function createPresignedUrl(
  input: Pick<PresignInput, "fileName" | "fileType" | "context" | "siteId">,
  userId: string,
  wsId: string,
): Promise<{ fileId: string; uploadUrl: string }> {
  validateUpload(input.context, input.fileType, 0);

  const fileId = crypto.randomUUID();

  pendingUploads.set(fileId, {
    fileName: input.fileName,
    fileType: input.fileType,
    context: input.context,
    userId,
    wsId,
    siteId: input.siteId,
    storedUrl: null,
    createdAt: new Date(),
    confirmed: false,
  });

  setTimeout(() => pendingUploads.delete(fileId), TTL_MS);

  return { fileId, uploadUrl: `/api/upload/${fileId}` };
}

/** Internal — used by /api/upload/[fileId] route to look up + update entries. */
export function getPendingUpload(fileId: string): PendingUpload | undefined {
  return pendingUploads.get(fileId);
}

/** Internal — used by /api/upload/[fileId] route to record the real blob URL
 *  once the PUT body has been persisted to storage. */
export function setPendingUploadStoredUrl(fileId: string, storedUrl: string): void {
  const upload = pendingUploads.get(fileId);
  if (!upload) throw new Error("NOT_FOUND");
  upload.storedUrl = storedUrl;
}

export async function confirmUpload(fileId: string): Promise<{ confirmed: true; cdnUrl: string }> {
  const upload = pendingUploads.get(fileId);
  if (!upload) throw new Error("NOT_FOUND");
  if (!upload.storedUrl) throw new Error("NOT_UPLOADED");
  upload.confirmed = true;
  return { confirmed: true, cdnUrl: upload.storedUrl };
}

export function getUploadLimits() {
  return UPLOAD_LIMITS;
}
