"use client";

import { useState } from "react";

interface ConnectedAccount {
  provider: "google" | "github";
  email: string;
}

interface AccountTabProps {
  isSocialOnly?: boolean;
  connectedAccounts?: ConnectedAccount[];
  onChangePassword?: (data: { currentPassword: string; newPassword: string }) => void;
  onSetPassword?: (data: { newPassword: string }) => void;
  onDisconnect?: (provider: "google" | "github") => void;
  saving?: boolean;
}

function PasswordStrengthBar({ password }: { password: string }) {
  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[!@#$%^&*()]/.test(password),
    password.length >= 12,
  ].filter(Boolean).length;

  const label = ["", "Weak", "Fair", "Good", "Strong", "Very strong"][score];
  const colors = ["", "#E42313", "#f59e0b", "#3b82f6", "#22c55e", "#16a34a"];
  const width = `${(score / 5) * 100}%`;

  if (!password) return null;

  return (
    <div className="mt-1.5">
      <div className="h-1 w-full rounded-full" style={{ backgroundColor: "#E8E8E8" }}>
        <div
          className="h-1 rounded-full transition-all"
          style={{ width, backgroundColor: colors[score] }}
        />
      </div>
      <p className="text-xs mt-1" style={{ color: colors[score] }}>
        {label}
      </p>
    </div>
  );
}

export function AccountTab({
  isSocialOnly = false,
  connectedAccounts = [],
  onChangePassword,
  onSetPassword,
  onDisconnect,
  saving,
}: AccountTabProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmError, setConfirmError] = useState("");

  function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setConfirmError("Passwords don't match.");
      return;
    }
    setConfirmError("");
    if (isSocialOnly) {
      onSetPassword?.({ newPassword });
    } else {
      onChangePassword?.({ currentPassword, newPassword });
    }
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-base font-semibold mb-1" style={{ color: "#0D0D0D" }}>
          {isSocialOnly ? "Set a password" : "Change password"}
        </h2>
        <p className="text-sm mb-4" style={{ color: "#7A7A7A" }}>
          {isSocialOnly
            ? "Add a password so you can also sign in with your email."
            : "Use a strong password you don't use elsewhere."}
        </p>

        <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-sm">
          {!isSocialOnly && (
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "#0D0D0D" }}>
                Current password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm rounded-md border outline-none"
                style={{ borderColor: "#E8E8E8", color: "#0D0D0D" }}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "#0D0D0D" }}>
              New password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm rounded-md border outline-none"
              style={{ borderColor: "#E8E8E8", color: "#0D0D0D" }}
            />
            <PasswordStrengthBar password={newPassword} />
            <p className="text-xs mt-1" style={{ color: "#7A7A7A" }}>
              Min 8 chars with uppercase, number, and symbol.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "#0D0D0D" }}>
              Confirm new password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm rounded-md border outline-none"
              style={{
                borderColor: confirmError ? "#E42313" : "#E8E8E8",
                color: "#0D0D0D",
              }}
            />
            {confirmError && (
              <p className="text-xs mt-1" style={{ color: "#E42313" }}>
                {confirmError}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm font-medium rounded-md text-white disabled:opacity-60"
            style={{ backgroundColor: "#E42313" }}
          >
            {saving ? "Saving…" : isSocialOnly ? "Set password" : "Update password"}
          </button>
        </form>
      </section>

      <div style={{ borderTop: "1px solid #E8E8E8" }} />

      <section>
        <h2 className="text-base font-semibold mb-1" style={{ color: "#0D0D0D" }}>
          Connected accounts
        </h2>
        <p className="text-sm mb-4" style={{ color: "#7A7A7A" }}>
          Sign in faster using a social provider.
        </p>

        <div className="space-y-3">
          {(["google", "github"] as const).map((provider) => {
            const connected = connectedAccounts.find((a) => a.provider === provider);
            return (
              <div
                key={provider}
                className="flex items-center justify-between px-4 py-3 rounded-lg border"
                style={{ borderColor: "#E8E8E8" }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium capitalize" style={{ color: "#0D0D0D" }}>
                    {provider === "google" ? "Google" : "GitHub"}
                  </span>
                  {connected ? (
                    <span className="text-sm" style={{ color: "#7A7A7A" }}>
                      {connected.email}
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#E8E8E8", color: "#7A7A7A" }}>
                      Not connected
                    </span>
                  )}
                </div>
                {connected && (
                  <button
                    type="button"
                    onClick={() => onDisconnect?.(provider)}
                    className="text-sm px-3 py-1 rounded-md border"
                    style={{ borderColor: "#E8E8E8", color: "#7A7A7A" }}
                  >
                    Disconnect
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
