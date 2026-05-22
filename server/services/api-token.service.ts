import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

/**
 * API Token storage policy.
 *
 * - Token format: `bdr_live_<48-char-base64url>` (~36 bytes of entropy)
 * - Plaintext shown to user ONCE on creation. Never stored.
 * - DB stores SHA-256 hex of full plaintext + a `prefix` (first 12 chars)
 *   for display in admin UIs.
 *
 * Why SHA-256 not bcrypt: tokens are full-entropy random (~288 bits).
 * No need for slow KDF — bcrypt would force O(N) compare on lookup.
 * Hash + unique-index = O(1) lookup. Tradeoff: DB leak exposes hashes,
 * but hashes can't be reversed and brute force is computationally
 * impossible at full token entropy.
 */

const TOKEN_PREFIX = "bdr_live_";
const TOKEN_BODY_BYTES = 36;
const PREFIX_DISPLAY_CHARS = 12;

export type Scope =
  | "sites:read"
  | "sites:write"
  | "sites:publish"
  | "redirects:read"
  | "redirects:write"
  | "forms:read"
  | "domains:read"
  | "domains:write";

export const ALL_SCOPES: Scope[] = [
  "sites:read",
  "sites:write",
  "sites:publish",
  "redirects:read",
  "redirects:write",
  "forms:read",
  "domains:read",
  "domains:write",
];

function hashToken(plain: string): string {
  return createHash("sha256").update(plain).digest("hex");
}

function generateToken(): { plaintext: string; hash: string; prefix: string } {
  const body = randomBytes(TOKEN_BODY_BYTES).toString("base64url");
  const plaintext = `${TOKEN_PREFIX}${body}`;
  const hash = hashToken(plaintext);
  const prefix = plaintext.slice(0, PREFIX_DISPLAY_CHARS);
  return { plaintext, hash, prefix };
}

interface CreateTokenInput {
  userId: string;
  workspaceId: string;
  name: string;
  scopes: Scope[];
  expiresAt?: Date | null;
}

interface CreateTokenResult {
  id: string;
  plaintext: string;
  prefix: string;
  expiresAt: Date | null;
}

export async function createApiToken(input: CreateTokenInput): Promise<CreateTokenResult> {
  const { plaintext, hash, prefix } = generateToken();
  const row = await prisma.apiToken.create({
    data: {
      userId: input.userId,
      workspaceId: input.workspaceId,
      name: input.name,
      hashedToken: hash,
      prefix,
      scopes: input.scopes,
      expiresAt: input.expiresAt ?? null,
    },
  });
  return {
    id: row.id,
    plaintext,
    prefix: row.prefix,
    expiresAt: row.expiresAt,
  };
}

export async function listApiTokens(workspaceId: string) {
  return prisma.apiToken.findMany({
    where: { workspaceId },
    select: {
      id: true,
      name: true,
      prefix: true,
      scopes: true,
      lastUsedAt: true,
      expiresAt: true,
      revokedAt: true,
      createdAt: true,
      user: { select: { id: true, fullName: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function revokeApiToken(id: string) {
  return prisma.apiToken.update({
    where: { id },
    data: { revokedAt: new Date() },
  });
}

export async function deleteApiToken(id: string) {
  return prisma.apiToken.delete({ where: { id } });
}

interface VerifiedToken {
  userId: string;
  workspaceId: string;
  scopes: Scope[];
  tokenId: string;
}

export async function verifyApiToken(plain: string): Promise<VerifiedToken | null> {
  if (!plain.startsWith(TOKEN_PREFIX)) return null;
  const hash = hashToken(plain);
  const row = await prisma.apiToken.findUnique({
    where: { hashedToken: hash },
    select: {
      id: true,
      userId: true,
      workspaceId: true,
      scopes: true,
      revokedAt: true,
      expiresAt: true,
    },
  });
  if (!row) return null;
  if (row.revokedAt) return null;
  if (row.expiresAt && row.expiresAt < new Date()) return null;

  prisma.apiToken
    .update({ where: { id: row.id }, data: { lastUsedAt: new Date() } })
    .catch(() => {});

  const scopes = Array.isArray(row.scopes) ? (row.scopes as unknown as Scope[]) : [];
  return {
    userId: row.userId,
    workspaceId: row.workspaceId,
    scopes,
    tokenId: row.id,
  };
}

export function extractBearer(headers: Headers | undefined): string | null {
  if (!headers) return null;
  const auth = headers.get("authorization") || headers.get("Authorization");
  if (!auth) return null;
  const match = auth.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() ?? null;
}
