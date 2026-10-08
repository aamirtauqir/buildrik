import dns from "node:dns/promises";
import http from "node:http";
import https from "node:https";
import net from "node:net";

/**
 * SSRF guard for user-supplied outbound URLs (webhook test events, Brand-from-URL).
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
  if (/^fe[89ab]/.test(lower)) return true; // link-local fe80::/10
  if (/^fe[c-f]/.test(lower)) return true; // deprecated site-local fec0::/10
  if (lower.startsWith("ff")) return true; // multicast
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // unique-local
  // IPv4-mapped (::ffff:a.b.c.d) — validate the embedded v4.
  const mapped = lower.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateV4(mapped[1]);
  // …and the hex form WHATWG URL normalises it to: [::ffff:127.0.0.1] → [::ffff:7f00:1].
  const hex = lower.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (hex) {
    const n = (parseInt(hex[1], 16) << 16) | parseInt(hex[2], 16);
    return isPrivateV4([n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join("."));
  }
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

/**
 * Resolves `host` ONCE and refuses it when any address is non-global. The
 * caller must connect to the returned address (see fetchPublicText) — letting
 * the HTTP client resolve again reopens the DNS-rebinding window.
 */
export async function resolvePublicAddress(host: string): Promise<{ address: string; family: 4 | 6 }> {
  const literal = net.isIP(host);
  if (literal) {
    if (isPrivateAddr(host)) throw new Error("BLOCKED_URL");
    return { address: host, family: literal === 6 ? 6 : 4 };
  }
  let addrs: { address: string; family: number }[];
  try {
    addrs = await dns.lookup(host, { all: true });
  } catch {
    throw new Error("BLOCKED_URL");
  }
  if (addrs.length === 0 || addrs.some((a) => isPrivateAddr(a.address))) throw new Error("BLOCKED_URL");
  return { address: addrs[0].address, family: addrs[0].family === 6 ? 6 : 4 };
}

export interface PublicFetchOptions {
  maxBytes: number;
  /** Epoch ms; shared across redirects and across every fetch of one job. */
  deadline: number;
  /** Content types accepted (matched against the response's content-type). */
  accept: RegExp;
  maxRedirects?: number;
  /** Test seam: the request function (defaults to node http/https). */
  request?: (url: URL, options: http.RequestOptions) => http.ClientRequest;
}

function parsePublicHttpUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("INVALID_URL");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("INVALID_URL");
  if (url.username || url.password) throw new Error("INVALID_URL");
  if (url.port && url.port !== "80" && url.port !== "443") throw new Error("INVALID_URL");
  return url;
}

const defaultRequest = (url: URL, options: http.RequestOptions) =>
  (url.protocol === "https:" ? https : http).request(url, options);

function requestOnce(
  url: URL,
  pinned: { address: string; family: 4 | 6 },
  opts: PublicFetchOptions,
): Promise<{ redirect: string } | { text: string }> {
  const remaining = opts.deadline - Date.now();
  if (remaining <= 0) return Promise.reject(new Error("TIMEOUT"));
  const lookup: net.LookupFunction = (_host, options, callback) => {
    if (options.all) {
      (callback as (err: null, addresses: net.LookupAddress[]) => void)(null, [pinned]);
    } else {
      callback(null, pinned.address, pinned.family);
    }
  };
  return new Promise((resolve, reject) => {
    const req = (opts.request ?? defaultRequest)(url, {
      method: "GET",
      lookup,
      timeout: remaining,
      headers: {
        "user-agent": "BuildrickBrandImport/1.0 (+https://buildrick.io)",
        accept: "text/html,text/css;q=0.9,*/*;q=0.1",
        "accept-encoding": "identity",
      },
    });
    const timer = setTimeout(() => req.destroy(new Error("TIMEOUT")), remaining);
    const fail = (code: string) => {
      clearTimeout(timer);
      reject(new Error(code));
    };
    req.on("timeout", () => req.destroy(new Error("TIMEOUT")));
    req.on("error", (e: Error) => fail(e.message === "TIMEOUT" || e.message === "TOO_LARGE" ? e.message : "FETCH_FAILED"));
    req.on("response", (res: http.IncomingMessage) => {
      const status = res.statusCode ?? 0;
      const location = res.headers.location;
      if (status >= 300 && status < 400 && location) {
        res.resume();
        clearTimeout(timer);
        resolve({ redirect: location });
        return;
      }
      if (status !== 200 || !opts.accept.test(String(res.headers["content-type"] ?? ""))) {
        res.resume();
        fail("FETCH_FAILED");
        return;
      }
      const chunks: Buffer[] = [];
      let size = 0;
      res.on("data", (chunk: Buffer) => {
        size += chunk.length;
        if (size > opts.maxBytes) {
          res.destroy();
          req.destroy(new Error("TOO_LARGE"));
          return;
        }
        chunks.push(Buffer.from(chunk));
      });
      res.on("end", () => {
        if (size > opts.maxBytes) return;
        clearTimeout(timer);
        resolve({ text: Buffer.concat(chunks).toString("utf8") });
      });
    });
    req.end();
  });
}

/**
 * GET a public http(s) page as text, for user-supplied URLs (Brand from URL,
 * spec §9). Every hop — the first URL and each redirect (max 3) — is parsed,
 * resolved once, refused if any address is private, and CONNECTED to that
 * vetted address. Size and time are capped by `maxBytes` and `deadline`.
 */
export async function fetchPublicText(raw: string, opts: PublicFetchOptions): Promise<{ url: URL; text: string }> {
  let url = parsePublicHttpUrl(raw);
  for (let hop = 0; ; hop++) {
    const pinned = await resolvePublicAddress(url.hostname.replace(/^\[|\]$/g, ""));
    const res = await requestOnce(url, pinned, opts);
    if ("text" in res) return { url, text: res.text };
    if (hop >= (opts.maxRedirects ?? 3)) throw new Error("FETCH_FAILED");
    url = parsePublicHttpUrl(new URL(res.redirect, url).toString());
  }
}
