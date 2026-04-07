import { CDN_PATHS, UPLOAD_LIMITS, type PresignInput } from "@buildrik/shared/schemas/upload";

type PendingUpload = {
  fileName: string;
  fileType: string;
  context: string;
  userId: string;
  wsId: string;
  cdnUrl: string;
  createdAt: Date;
  confirmed: boolean;
};

const pendingUploads = new Map<string, PendingUpload>();
const TTL_MS = 10 * 60 * 1000;

function buildCdnUrl(context: string, userId: string, wsId: string, fileId: string, siteId?: string): string {
  const template = CDN_PATHS[context] ?? `cdn.buildrik.app/uploads/{wsId}/{hash}`;
  const hash = fileId.slice(0, 12);
  return template
    .replace("{userId}", userId)
    .replace("{wsId}", wsId)
    .replace("{siteId}", siteId ?? wsId)
    .replace("{hash}", hash);
}

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
): Promise<{ fileId: string; uploadUrl: string; cdnUrl: string }> {
  validateUpload(input.context, input.fileType, 0);

  const fileId = crypto.randomUUID();
  const cdnUrl = buildCdnUrl(input.context, userId, wsId, fileId, input.siteId);

  pendingUploads.set(fileId, {
    fileName: input.fileName,
    fileType: input.fileType,
    context: input.context,
    userId,
    wsId,
    cdnUrl,
    createdAt: new Date(),
    confirmed: false,
  });

  setTimeout(() => pendingUploads.delete(fileId), TTL_MS);

  return { fileId, uploadUrl: `/api/upload/${fileId}`, cdnUrl };
}

export async function confirmUpload(fileId: string): Promise<{ confirmed: true; cdnUrl: string }> {
  const upload = pendingUploads.get(fileId);
  if (!upload) throw new Error("NOT_FOUND");
  upload.confirmed = true;
  return { confirmed: true, cdnUrl: upload.cdnUrl };
}

export function getUploadLimits() {
  return UPLOAD_LIMITS;
}
