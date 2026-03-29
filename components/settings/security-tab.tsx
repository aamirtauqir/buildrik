"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";

function parseUserAgent(ua: string | null | undefined): string {
  if (!ua) return "Unknown device";
  const browsers: [RegExp, string][] = [
    [/Edg\//, "Edge"],
    [/OPR\/|Opera\//, "Opera"],
    [/CriOS\//, "Chrome"],
    [/FxiOS\//, "Firefox"],
    [/Chrome\//, "Chrome"],
    [/Firefox\//, "Firefox"],
    [/Safari\//, "Safari"],
  ];
  const os: [RegExp, string][] = [
    [/Windows NT/, "Windows"],
    [/Macintosh|Mac OS X/, "macOS"],
    [/Linux/, "Linux"],
    [/Android/, "Android"],
    [/iPhone|iPad/, "iOS"],
  ];
  const browser = browsers.find(([r]) => r.test(ua))?.[1] ?? "Browser";
  const system = os.find(([r]) => r.test(ua))?.[1] ?? "Unknown OS";
  return `${browser} on ${system}`;
}

type SetupStep = "idle" | "qr" | "backup" | "verify";

export function SecurityTab({ currentSessionId }: { currentSessionId?: string }) {
  const [setupStep, setSetupStep] = useState<SetupStep>("idle");
  const [setupData, setSetupData] = useState<{
    otpauth: string;
    secret: string;
    backupCodes: string[];
  } | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [disablePassword, setDisablePassword] = useState("");
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);
  const [error, setError] = useState("");

  const utils = trpc.useUtils();

  const profile = trpc.account.profile.get.useQuery();
  const sessions = trpc.account.sessions.list.useQuery();
  const loginHistory = trpc.account.loginHistory.useQuery();

  const is2FAEnabled = profile.data?.twoFactorEnabled ?? false;

  const enableMutation = trpc.account.twoFactor.enable.useMutation({
    onSuccess(data) {
      setSetupData(data);
      setSetupStep("qr");
      setError("");
    },
    onError(err) {
      setError(err.message);
    },
  });

  const confirmMutation = trpc.account.twoFactor.confirm.useMutation({
    onSuccess() {
      setSetupStep("idle");
      setSetupData(null);
      setVerifyCode("");
      setError("");
      utils.account.profile.get.invalidate();
    },
    onError(err) {
      setError(err.message);
    },
  });

  const disableMutation = trpc.account.twoFactor.disable.useMutation({
    onSuccess() {
      setShowDisableModal(false);
      setDisablePassword("");
      setError("");
      utils.account.profile.get.invalidate();
    },
    onError(err) {
      setError(err.message);
    },
  });

  const revokeMutation = trpc.account.sessions.revoke.useMutation({
    onSuccess() {
      utils.account.sessions.list.invalidate();
    },
  });

  const revokeAllMutation = trpc.account.sessions.revokeAll.useMutation({
    onSuccess() {
      utils.account.sessions.list.invalidate();
    },
  });

  async function handleRevoke(sessionId: string) {
    setRevoking(sessionId);
    await revokeMutation.mutateAsync({ sessionId });
    setRevoking(null);
  }

  async function handleRevokeAll() {
    if (!currentSessionId) return;
    setRevokingAll(true);
    await revokeAllMutation.mutateAsync({ currentSessionId });
    setRevokingAll(false);
  }

  function handleEnable() {
    setError("");
    enableMutation.mutate();
  }

  function handleConfirm() {
    setError("");
    confirmMutation.mutate({ code: verifyCode });
  }

  function handleDisable() {
    setError("");
    disableMutation.mutate({ password: disablePassword });
  }

  const sessionList = sessions.data ?? [];
  const historyList = loginHistory.data ?? [];

  return (
    <div className="space-y-8">
      {/* 2FA Section */}
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
              onClick={is2FAEnabled ? () => setShowDisableModal(true) : handleEnable}
              disabled={enableMutation.isPending}
              className="text-sm px-3 py-1.5 rounded-md font-medium text-white disabled:opacity-60"
              style={{ backgroundColor: is2FAEnabled ? "#7A7A7A" : "#E42313" }}
            >
              {enableMutation.isPending ? "Setting up..." : is2FAEnabled ? "Disable" : "Enable 2FA"}
            </button>
          </div>
        </div>

        {/* Setup Modal - Step 1: QR Code */}
        {setupStep === "qr" && setupData && (
          <div
            className="mt-4 p-4 rounded-lg border space-y-3"
            style={{ borderColor: "#E8E8E8" }}
          >
            <h3 className="text-sm font-semibold" style={{ color: "#0D0D0D" }}>
              Step 1: Scan QR code
            </h3>
            <p className="text-sm" style={{ color: "#7A7A7A" }}>
              Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
            </p>
            <div className="flex items-center justify-center p-4 rounded-lg" style={{ backgroundColor: "#fafafa" }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(setupData.otpauth)}`}
                alt="2FA QR Code"
                width={200}
                height={200}
              />
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: "#7A7A7A" }}>
                Or enter this key manually:
              </p>
              <code
                className="text-xs px-2 py-1 rounded block break-all"
                style={{ backgroundColor: "#f5f5f5", color: "#0D0D0D" }}
              >
                {setupData.secret}
              </code>
            </div>
            <button
              type="button"
              onClick={() => setSetupStep("backup")}
              className="text-sm px-3 py-1.5 rounded-md font-medium text-white"
              style={{ backgroundColor: "#E42313" }}
            >
              Next: View backup codes
            </button>
          </div>
        )}

        {/* Setup Modal - Step 2: Backup Codes */}
        {setupStep === "backup" && setupData && (
          <div
            className="mt-4 p-4 rounded-lg border space-y-3"
            style={{ borderColor: "#E8E8E8" }}
          >
            <h3 className="text-sm font-semibold" style={{ color: "#0D0D0D" }}>
              Step 2: Save backup codes
            </h3>
            <p className="text-sm" style={{ color: "#7A7A7A" }}>
              Store these codes in a safe place. Each code can only be used once.
            </p>
            <div
              className="grid grid-cols-2 gap-2 p-3 rounded-lg"
              style={{ backgroundColor: "#fafafa" }}
            >
              {setupData.backupCodes.map((code) => (
                <code key={code} className="text-xs font-mono" style={{ color: "#0D0D0D" }}>
                  {code}
                </code>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setSetupStep("verify")}
              className="text-sm px-3 py-1.5 rounded-md font-medium text-white"
              style={{ backgroundColor: "#E42313" }}
            >
              Next: Verify setup
            </button>
          </div>
        )}

        {/* Setup Modal - Step 3: Verify */}
        {setupStep === "verify" && (
          <div
            className="mt-4 p-4 rounded-lg border space-y-3"
            style={{ borderColor: "#E8E8E8" }}
          >
            <h3 className="text-sm font-semibold" style={{ color: "#0D0D0D" }}>
              Step 3: Verify your authenticator
            </h3>
            <p className="text-sm" style={{ color: "#7A7A7A" }}>
              Enter the 6-digit code from your authenticator app to complete setup.
            </p>
            {error && (
              <p className="text-sm" style={{ color: "#991b1b" }}>
                {error}
              </p>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="text-sm px-3 py-1.5 rounded-md border w-32 font-mono"
                style={{ borderColor: "#E8E8E8" }}
              />
              <button
                type="button"
                onClick={handleConfirm}
                disabled={verifyCode.length !== 6 || confirmMutation.isPending}
                className="text-sm px-3 py-1.5 rounded-md font-medium text-white disabled:opacity-60"
                style={{ backgroundColor: "#E42313" }}
              >
                {confirmMutation.isPending ? "Verifying..." : "Verify & Enable"}
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                setSetupStep("idle");
                setSetupData(null);
                setVerifyCode("");
                setError("");
              }}
              className="text-sm"
              style={{ color: "#7A7A7A" }}
            >
              Cancel setup
            </button>
          </div>
        )}

        {/* Disable Modal */}
        {showDisableModal && (
          <div
            className="mt-4 p-4 rounded-lg border space-y-3"
            style={{ borderColor: "#E8E8E8" }}
          >
            <h3 className="text-sm font-semibold" style={{ color: "#0D0D0D" }}>
              Disable two-factor authentication
            </h3>
            <p className="text-sm" style={{ color: "#7A7A7A" }}>
              Enter your password to disable 2FA. This will remove the extra security layer.
            </p>
            {error && (
              <p className="text-sm" style={{ color: "#991b1b" }}>
                {error}
              </p>
            )}
            <div className="flex gap-2">
              <input
                type="password"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                placeholder="Your password"
                className="text-sm px-3 py-1.5 rounded-md border w-48"
                style={{ borderColor: "#E8E8E8" }}
              />
              <button
                type="button"
                onClick={handleDisable}
                disabled={disableMutation.isPending}
                className="text-sm px-3 py-1.5 rounded-md font-medium text-white disabled:opacity-60"
                style={{ backgroundColor: "#E42313" }}
              >
                {disableMutation.isPending ? "Disabling..." : "Disable 2FA"}
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowDisableModal(false);
                setDisablePassword("");
                setError("");
              }}
              className="text-sm"
              style={{ color: "#7A7A7A" }}
            >
              Cancel
            </button>
          </div>
        )}
      </section>

      {/* Active Sessions */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold" style={{ color: "#0D0D0D" }}>
            Active sessions
          </h2>
          {sessionList.filter((s) => s.id !== currentSessionId).length > 0 && (
            <button
              type="button"
              onClick={handleRevokeAll}
              disabled={revokingAll}
              className="text-sm font-medium disabled:opacity-60"
              style={{ color: "#E42313" }}
            >
              {revokingAll ? "Revoking..." : "Revoke all other sessions"}
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
                  Sign-in
                </th>
                <th />
              </tr>
            </thead>
            <tbody>
              {sessions.isLoading && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-sm" style={{ color: "#B0B0B0" }}>
                    Loading sessions...
                  </td>
                </tr>
              )}
              {!sessions.isLoading && sessionList.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-sm" style={{ color: "#B0B0B0" }}>
                    No active sessions found.
                  </td>
                </tr>
              )}
              {sessionList.map((session) => {
                const isCurrent = session.id === currentSessionId;
                return (
                  <tr key={session.id} style={{ borderBottom: "1px solid #E8E8E8" }}>
                    <td className="px-4 py-3" style={{ color: "#0D0D0D" }}>
                      <div className="flex items-center gap-2">
                        {parseUserAgent(session.device)}
                        {isCurrent && (
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
                      {session.ip ?? "-"}
                    </td>
                    <td className="px-4 py-3" style={{ color: "#7A7A7A" }}>
                      {new Date(session.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!isCurrent && (
                        <button
                          type="button"
                          onClick={() => handleRevoke(session.id)}
                          disabled={revoking === session.id}
                          className="text-sm disabled:opacity-60"
                          style={{ color: "#E42313" }}
                        >
                          {revoking === session.id ? "Revoking..." : "Revoke"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Login History */}
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
                  Browser / Device
                </th>
                <th className="text-left px-4 py-2.5 font-medium" style={{ color: "#7A7A7A" }}>
                  IP address
                </th>
                <th className="text-left px-4 py-2.5 font-medium" style={{ color: "#7A7A7A" }}>
                  Time
                </th>
              </tr>
            </thead>
            <tbody>
              {loginHistory.isLoading && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-sm" style={{ color: "#B0B0B0" }}>
                    Loading history...
                  </td>
                </tr>
              )}
              {!loginHistory.isLoading && historyList.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-sm" style={{ color: "#B0B0B0" }}>
                    No login history yet.
                  </td>
                </tr>
              )}
              {historyList.map((attempt) => {
                const isSuccess = attempt.result === "success";
                return (
                <tr key={attempt.id} style={{ borderBottom: "1px solid #E8E8E8" }}>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center gap-1 text-xs font-medium"
                      style={{ color: isSuccess ? "#16a34a" : "#991b1b" }}
                    >
                      {isSuccess ? "Success" : "Failed"}
                    </span>
                  </td>
                  <td className="px-4 py-3" style={{ color: "#7A7A7A" }}>
                    {parseUserAgent(attempt.userAgent)}
                  </td>
                  <td className="px-4 py-3" style={{ color: "#7A7A7A" }}>
                    {attempt.ipAddress ?? "-"}
                  </td>
                  <td className="px-4 py-3" style={{ color: "#7A7A7A" }}>
                    {new Date(attempt.createdAt).toLocaleString()}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
