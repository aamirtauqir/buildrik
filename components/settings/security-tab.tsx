"use client";

import { useState } from "react";

interface Session {
  id: string;
  device: string;
  ip: string;
  location: string;
  isCurrent: boolean;
  lastActive: string;
}

interface LoginAttempt {
  id: string;
  success: boolean;
  browser: string;
  location: string;
  timestamp: string;
}

interface SecurityTabProps {
  is2FAEnabled?: boolean;
  sessions?: Session[];
  loginHistory?: LoginAttempt[];
  currentSessionId?: string;
  on2FAToggle?: () => void;
  onRevokeSession?: (sessionId: string) => void;
  onRevokeAllOtherSessions?: () => void;
}

export function SecurityTab({
  is2FAEnabled = false,
  sessions = [],
  loginHistory = [],
  currentSessionId,
  on2FAToggle,
  onRevokeSession,
  onRevokeAllOtherSessions,
}: SecurityTabProps) {
  const [revoking, setRevoking] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);

  async function handleRevoke(sessionId: string) {
    setRevoking(sessionId);
    await onRevokeSession?.(sessionId);
    setRevoking(null);
  }

  async function handleRevokeAll() {
    setRevokingAll(true);
    await onRevokeAllOtherSessions?.();
    setRevokingAll(false);
  }

  return (
    <div className="space-y-8">
      <section>
        <div
          className="flex items-center justify-between p-4 rounded-lg border"
          style={{ borderColor: "#E8E8E8" }}
        >
          <div>
            <h2 className="text-sm font-semibold" style={{ color: "#0D0D0D" }}>
              Two-factor authentication
            </h2>
            <p className="text-sm mt-0.5" style={{ color: "#7A7A7A" }}>
              {is2FAEnabled
                ? "2FA is active. Your account has extra protection."
                : "Add an extra layer of security to your account."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: is2FAEnabled ? "#dcfce7" : "#fee2e2",
                color: is2FAEnabled ? "#16a34a" : "#991b1b",
              }}
            >
              {is2FAEnabled ? "Enabled" : "Disabled"}
            </span>
            <button
              type="button"
              onClick={on2FAToggle}
              className="text-sm px-3 py-1.5 rounded-md font-medium text-white"
              style={{ backgroundColor: is2FAEnabled ? "#7A7A7A" : "#E42313" }}
            >
              {is2FAEnabled ? "Disable" : "Enable 2FA"}
            </button>
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold" style={{ color: "#0D0D0D" }}>
            Active sessions
          </h2>
          {sessions.filter((s) => s.id !== currentSessionId).length > 0 && (
            <button
              type="button"
              onClick={handleRevokeAll}
              disabled={revokingAll}
              className="text-sm font-medium disabled:opacity-60"
              style={{ color: "#E42313" }}
            >
              {revokingAll ? "Revoking…" : "Revoke all other sessions"}
            </button>
          )}
        </div>

        <div
          className="rounded-lg border overflow-hidden"
          style={{ borderColor: "#E8E8E8" }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid #E8E8E8", backgroundColor: "#fafafa" }}>
                <th className="text-left px-4 py-2.5 font-medium" style={{ color: "#7A7A7A" }}>
                  Device
                </th>
                <th className="text-left px-4 py-2.5 font-medium" style={{ color: "#7A7A7A" }}>
                  IP address
                </th>
                <th className="text-left px-4 py-2.5 font-medium" style={{ color: "#7A7A7A" }}>
                  Location
                </th>
                <th className="text-left px-4 py-2.5 font-medium" style={{ color: "#7A7A7A" }}>
                  Last active
                </th>
                <th />
              </tr>
            </thead>
            <tbody>
              {sessions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm" style={{ color: "#B0B0B0" }}>
                    No active sessions found.
                  </td>
                </tr>
              )}
              {sessions.map((session) => (
                <tr key={session.id} style={{ borderBottom: "1px solid #E8E8E8" }}>
                  <td className="px-4 py-3" style={{ color: "#0D0D0D" }}>
                    <div className="flex items-center gap-2">
                      {session.device}
                      {session.isCurrent && (
                        <span
                          className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                          style={{ backgroundColor: "#E42313", color: "#fff" }}
                        >
                          Current
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3" style={{ color: "#7A7A7A" }}>
                    {session.ip}
                  </td>
                  <td className="px-4 py-3" style={{ color: "#7A7A7A" }}>
                    {session.location}
                  </td>
                  <td className="px-4 py-3" style={{ color: "#7A7A7A" }}>
                    {session.lastActive}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!session.isCurrent && (
                      <button
                        type="button"
                        onClick={() => handleRevoke(session.id)}
                        disabled={revoking === session.id}
                        className="text-sm disabled:opacity-60"
                        style={{ color: "#E42313" }}
                      >
                        {revoking === session.id ? "Revoking…" : "Revoke"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-base font-semibold mb-3" style={{ color: "#0D0D0D" }}>
          Login history
        </h2>
        <div
          className="rounded-lg border overflow-hidden"
          style={{ borderColor: "#E8E8E8" }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid #E8E8E8", backgroundColor: "#fafafa" }}>
                <th className="text-left px-4 py-2.5 font-medium" style={{ color: "#7A7A7A" }}>
                  Status
                </th>
                <th className="text-left px-4 py-2.5 font-medium" style={{ color: "#7A7A7A" }}>
                  Browser
                </th>
                <th className="text-left px-4 py-2.5 font-medium" style={{ color: "#7A7A7A" }}>
                  Location
                </th>
                <th className="text-left px-4 py-2.5 font-medium" style={{ color: "#7A7A7A" }}>
                  Time
                </th>
              </tr>
            </thead>
            <tbody>
              {loginHistory.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-sm" style={{ color: "#B0B0B0" }}>
                    No login history yet.
                  </td>
                </tr>
              )}
              {loginHistory.slice(0, 10).map((attempt) => (
                <tr key={attempt.id} style={{ borderBottom: "1px solid #E8E8E8" }}>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center gap-1 text-xs font-medium"
                      style={{ color: attempt.success ? "#16a34a" : "#991b1b" }}
                    >
                      {attempt.success ? "✓ Success" : "✗ Failed"}
                    </span>
                  </td>
                  <td className="px-4 py-3" style={{ color: "#7A7A7A" }}>
                    {attempt.browser}
                  </td>
                  <td className="px-4 py-3" style={{ color: "#7A7A7A" }}>
                    {attempt.location}
                  </td>
                  <td className="px-4 py-3" style={{ color: "#7A7A7A" }}>
                    {attempt.timestamp}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
