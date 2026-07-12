import { createHmac } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendNewDeviceAlertEmail } from "./email.service";

/** Browser-family + OS only (drop version numbers so weekly browser updates
 *  don't read as a new device). */
function normalizeUA(ua: string): string {
  const family = /Edg/.test(ua) ? "Edge"
    : /OPR|Opera/.test(ua) ? "Opera"
    : /Chrome/.test(ua) ? "Chrome"
    : /Firefox/.test(ua) ? "Firefox"
    : /Safari/.test(ua) ? "Safari"
    : "Other";
  const os = /Windows/.test(ua) ? "Windows"
    : /Mac OS|Macintosh/.test(ua) ? "macOS"
    : /Android/.test(ua) ? "Android"
    : /iPhone|iPad|iOS/.test(ua) ? "iOS"
    : /Linux/.test(ua) ? "Linux"
    : "Other";
  return `${family}/${os}`;
}

/** Coarse IP prefix — IPv4 /24, IPv6 first 4 hextets — so a dynamic host in the
 *  same network doesn't look like a new device. */
function ipPrefix(ip: string): string {
  if (ip.includes(":")) return ip.split(":").slice(0, 4).join(":");
  return ip.split(".").slice(0, 3).join(".");
}

/** Non-reversible fingerprint keyed by the server secret (never store raw IP/UA). */
function fingerprint(ip: string, userAgent: string): string {
  const key = process.env.ENCRYPTION_KEY || "device-fp-dev-fallback";
  return createHmac("sha256", key).update(`${normalizeUA(userAgent)}|${ipPrefix(ip)}`).digest("hex");
}

/**
 * Record the device this session was created from, and email a "new sign-in"
 * alert if it's a device we haven't seen for this user before. Best-effort +
 * NON-BLOCKING: never throws, never delays session creation. Suppresses the
 * alert on the user's first-ever device (signup / first login).
 */
export async function recordDeviceAndAlert(
  userId: string,
  email: string,
  ip: string,
  userAgent: string
): Promise<void> {
  try {
    if (!ip || ip === "unknown" || !userAgent) return; // can't fingerprint (e.g. local dev)
    const fp = fingerprint(ip, userAgent);
    const existing = await prisma.knownDevice.findUnique({
      where: { userId_fingerprint: { userId, fingerprint: fp } },
    });
    if (existing) {
      await prisma.knownDevice.update({ where: { id: existing.id }, data: { lastSeenAt: new Date() } });
      return;
    }
    const priorCount = await prisma.knownDevice.count({ where: { userId } });
    await prisma.knownDevice.create({ data: { userId, fingerprint: fp } });
    if (priorCount > 0) {
      await sendNewDeviceAlertEmail(email);
    }
  } catch {
    // Alerting is best-effort — swallow all errors.
  }
}
