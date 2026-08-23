#!/usr/bin/env node
/**
 * Figma MCP, callable from any session — including the ones where the Figma
 * tools are absent from the tool list.
 *
 * Two separate things go wrong, and they look identical from inside a session:
 *
 *  1. THE TOOL REGISTRY. Some sessions start with no Figma tools at all — not
 *     even as deferred entries, so ToolSearch finds nothing. The SERVER is
 *     fine; only this session's registry is short. This file talks to it
 *     directly over JSON-RPC and does not care.
 *
 *  2. THE BUNDLE HEADER — the one that cost a whole arc. The plugin's own
 *     config (~/.claude/plugins/cache/claude-plugins-official/figma/<v>/
 *     server.json) sends `X-Figma-Plugin-Bundle`. Without it the server
 *     answers `tools/list` with 20 READ tools and no write tool. WITH it, 30 —
 *     including `use_figma`, `create_new_file`, `upload_assets`,
 *     `search_design_system`, `get_libraries`.
 *
 *     A session that omitted the header therefore reported "this toolchain
 *     cannot delete or rename a Figma node, record it for the founder to do by
 *     hand" (2026-08-23). It could. The absence of a tool is a claim about the
 *     REQUEST, not about Figma — check the header before writing that down.
 *
 * Auth is the login keychain's OAuth token, so nothing extra to configure.
 * BUNDLE below must track the installed plugin version; a stale one has so far
 * kept working, but if `use_figma` disappears from tools/list, check it first.
 *
 * Usage:
 *   node scripts/baseline/figma-mcp.mjs tools/list
 *   node scripts/baseline/figma-mcp.mjs tools/call '{"name":"get_metadata","arguments":{...}}'
 *   import { connect, rpc } from "./figma-mcp.mjs"   // for long/large payloads —
 *     the CLI branch truncates output at 6000 chars, which will break JSON.parse
 *     on a big metadata read. Import and handle the result yourself instead.
 *
 * @license BSD-3-Clause
 */
import { execFileSync } from "node:child_process";

const raw = execFileSync("security", ["find-generic-password", "-s", "Claude Code-credentials", "-w"], { encoding: "utf8" });
const creds = JSON.parse(raw);
const entry = Object.entries(creds.mcpOAuth || {}).find(([k]) => k.startsWith("plugin:figma:figma"));
if (!entry) { console.error("no figma oauth entry in keychain"); process.exit(2); }
const token = entry[1].accessToken;

/* Mirrors the installed plugin's server.json. See note 2 above. */
const BUNDLE = "figma_prod@2_2_96";
const URL_ = "https://mcp.figma.com/mcp";
let sessionId = null;

async function rpc(method, params, id) {
  const headers = {
    "content-type": "application/json",
    accept: "application/json, text/event-stream",
    authorization: `Bearer ${token}`,
    "x-figma-plugin-bundle": BUNDLE,
  };
  if (sessionId) headers["mcp-session-id"] = sessionId;
  const res = await fetch(URL_, { method: "POST", headers, body: JSON.stringify({ jsonrpc: "2.0", id, method, params }) });
  const sid = res.headers.get("mcp-session-id");
  if (sid) sessionId = sid;
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 400)}`);
  // SSE frames: data: {...}
  const frames = text.split("\n").filter((l) => l.startsWith("data:")).map((l) => l.slice(5).trim());
  const payloads = (frames.length ? frames : [text]).map((f) => { try { return JSON.parse(f); } catch { return null; } }).filter(Boolean);
  return payloads.find((p) => p.id === id) ?? payloads[payloads.length - 1];
}

async function notify(method, params) {
  const headers = {
    "content-type": "application/json",
    accept: "application/json, text/event-stream",
    authorization: `Bearer ${token}`,
    "x-figma-plugin-bundle": BUNDLE,
  };
  if (sessionId) headers["mcp-session-id"] = sessionId;
  await fetch(URL_, { method: "POST", headers, body: JSON.stringify({ jsonrpc: "2.0", method, params }) });
}

export async function connect() {
  const init = await rpc("initialize", {
    protocolVersion: "2025-06-18",
    capabilities: {},
    clientInfo: { name: "buildrik-walk", version: "1.0.0" },
  }, 1);
  await notify("notifications/initialized", {});
  return init;
}
export { rpc };

if (import.meta.url === `file://${process.argv[1]}`) {
  const [, , method, argJson] = process.argv;
  await connect();
  if (method === "tools/list") {
    const r = await rpc("tools/list", {}, 2);
    console.log((r.result?.tools ?? []).map((t) => t.name).join("\n"));
  } else if (method === "tools/call") {
    const r = await rpc("tools/call", JSON.parse(argJson), 3);
    const out = (r.result?.content ?? []).map((c) => (c.type === "text" ? c.text : `[${c.type} ${(c.data || "").length}b]`));
    console.log(JSON.stringify({ isError: r.result?.isError ?? false, error: r.error ?? null, out }, null, 1).slice(0, 6000));
  } else {
    console.log(JSON.stringify(await rpc(method, argJson ? JSON.parse(argJson) : {}, 4), null, 1).slice(0, 4000));
  }
}
