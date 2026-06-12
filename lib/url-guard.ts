import dns from "node:dns/promises";
import net from "node:net";

/**
 * SSRF guard for user-supplied outbound URLs (webhook test events, etc.).
 *
 * A workspace ADMIN is still an untrusted actor relative to the server's
 * internal network: without this, "send test event" could point at cloud
 * metadata (169.254.169.254), localhost, or RFC1918 hosts and use the
 * server as a proxy to probe/exfiltrate internal services.
 */

function ipv4ToInt(ip: string): number {
  return ip.split(".").reduce((acc, oct) => (acc << 8) + Number(oct), 0) >>> 0;
}

function isPrivateV4(ip: string): boolean {
  const n = ipv4ToInt(ip);
  const inRange = (cidr: string) => {
    const [base, bitsStr] = cidr.split("/");
    const bits = Number(bitsStr);
    const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
    return (n & mask) === (ipv4ToInt(base) & mask);
  };
  return (
    inRange("0.0.0.0/8") ||
    inRange("10.0.0.0/8") ||
    inRange("100.64.0.0/10") || // CGNAT
    inRange("127.0.0.0/8") ||
    inRange("169.254.0.0/16") || // link-local (incl. cloud metadata)
    inRange("172.16.0.0/12") ||
    inRange("192.0.0.0/24") ||
    inRange("192.168.0.0/16") ||
    inRange("198.18.0.0/15") ||
    inRange("224.0.0.0/4") || // multicast
    inRange("240.0.0.0/4") // reserved
  );
}

function isPrivateV6(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower === "::1" || lower === "::") return true;
  if (lower.startsWith("fe80")) return true; // link-local
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // unique-local
  // IPv4-mapped (::ffff:a.b.c.d) — validate the embedded v4.
  const mapped = lower.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateV4(mapped[1]);
  return false;
}

function isPrivateAddr(ip: string): boolean {
  const family = net.isIP(ip);
  if (family === 4) return isPrivateV4(ip);
  if (family === 6) return isPrivateV6(ip);
  return true; // unknown → reject
}

/**
 * Throws "INVALID_URL" / "BLOCKED_URL" if `raw` is not a public https URL.
 * Resolves DNS and rejects if ANY resolved address is non-global. Call this
 * before persisting a webhook URL and again right before fetching it.
 */
export async function assertPublicHttpsUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("INVALID_URL");
  }
  if (url.protocol !== "https:") throw new Error("INVALID_URL");

  // URL.hostname wraps IPv6 literals in brackets ("[::1]") — strip them so
  // net.isIP recognises the address.
  const host = url.hostname.replace(/^\[|\]$/g, "");

  // Literal IP host — check directly, no DNS.
  if (net.isIP(host)) {
    if (isPrivateAddr(host)) throw new Error("BLOCKED_URL");
    return url;
  }

  // Hostname — resolve every address and reject if any is non-global
  // (defends against DNS rebinding to a private range).
  let addrs: { address: string }[];
  try {
    addrs = await dns.lookup(host, { all: true });
  } catch {
    throw new Error("BLOCKED_URL");
  }
  if (addrs.length === 0) throw new Error("BLOCKED_URL");
  for (const a of addrs) {
    if (isPrivateAddr(a.address)) throw new Error("BLOCKED_URL");
  }
  return url;
}
