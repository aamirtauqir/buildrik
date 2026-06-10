/**
 * SSETransport — DB-backed collaboration transport (no WebSocket server).
 *
 * Outbound: POST each event to `/api/collab/:roomId/ops`.
 * Inbound:  an EventSource on `/api/sse/collab/:roomId?since=:seq` replays ops
 *           and streams new ones; we skip our own (matched by clientId).
 *
 * Same-origin with the dashboard (unification §572), so URLs are relative and
 * the session cookie rides along — no CORS, no token plumbing.
 *
 * @license BSD-3-Clause
 */

import type { CollaborationEvent } from "../../shared/types/collaboration";
import type { CollaborationTransport } from "./types";

function makeClientId(): string {
  const c = (globalThis as { crypto?: Crypto }).crypto;
  if (c?.randomUUID) return c.randomUUID();
  return `c-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
}

export class SSETransport implements CollaborationTransport {
  private es: EventSource | null = null;
  private roomId = "";
  private userId = "";
  private readonly clientId = makeClientId();
  private lastSeq = 0;
  private connected = false;
  private hasConnectedOnce = false;

  private messageHandler: ((event: CollaborationEvent) => void) | null = null;
  private disconnectHandler: (() => void) | null = null;
  private reconnectHandler: (() => void) | null = null;

  connect(roomId: string, userId: string): Promise<void> {
    this.roomId = roomId;
    this.userId = userId;

    return new Promise((resolve, reject) => {
      let settled = false;
      const url = `/api/sse/collab/${encodeURIComponent(roomId)}?since=${this.lastSeq}`;
      const es = new EventSource(url, { withCredentials: true });
      this.es = es;

      es.addEventListener("hello", () => {
        this.connected = true;
        if (this.hasConnectedOnce) this.reconnectHandler?.();
        this.hasConnectedOnce = true;
        if (!settled) {
          settled = true;
          resolve();
        }
      });

      es.addEventListener("op", (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data) as { seq: number; clientId: string; op: CollaborationEvent };
          if (typeof data.seq === "number") this.lastSeq = Math.max(this.lastSeq, data.seq);
          if (data.clientId === this.clientId) return; // our own echo
          if (data.op && typeof data.op === "object") this.messageHandler?.(data.op);
        } catch {
          // malformed frame — ignore
        }
      });

      es.onerror = () => {
        this.connected = false;
        this.disconnectHandler?.();
        // EventSource auto-reconnects; if it never opened, fail the connect.
        if (!settled) {
          settled = true;
          reject(new Error("collab SSE connection failed"));
        }
      };
    });
  }

  disconnect(): Promise<void> {
    this.es?.close();
    this.es = null;
    this.connected = false;
    return Promise.resolve();
  }

  send(event: CollaborationEvent): void {
    if (!this.roomId) return;
    // Same-origin with the dashboard (§572): fetch's default "same-origin"
    // credentials already sends the session cookie, so no explicit include
    // (which would also trip the cross-origin-inventory baseline).
    void fetch(`/api/collab/${encodeURIComponent(this.roomId)}/ops`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: this.clientId, op: event }),
    }).catch(() => {
      // Send failure — the op is lost for peers; SSE resync on reconnect covers
      // gaps. (A durable outbox is a future hardening.)
    });
  }

  onMessage(handler: (event: CollaborationEvent) => void): void {
    this.messageHandler = handler;
  }
  onDisconnect(handler: () => void): void {
    this.disconnectHandler = handler;
  }
  onReconnect(handler: () => void): void {
    this.reconnectHandler = handler;
  }
  isConnected(): boolean {
    return this.connected;
  }
}
