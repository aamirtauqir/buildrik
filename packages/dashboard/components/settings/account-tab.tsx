"use client";

import { useState } from "react";
import { MailCheck } from "lucide-react";
import { SectionCard, Pill, Button } from "@/components/dashboard/primitives";

interface ConnectedAccount {
  provider: "google" | "github";
  email: string;
}

interface AccountTabProps {
  email?: string;
  hasPassword?: boolean;
  connectedAccounts?: ConnectedAccount[];
  onChangePassword?: (data: { currentPassword: string; newPassword: string }) => void;
  onSetPassword?: (data: { newPassword: string }) => void;
  onChangeEmail?: (data: { newEmail: string; password: string }) => void | Promise<unknown>;
  onConnectAccount?: (provider: "google" | "github") => void;
  onDisconnectAccount?: (provider: "google" | "github") => void;
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
  const colors = ["", "var(--color-primary)", "#C27803", "#1A56DB", "var(--color-success)", "#0E9F6E"];
  const width = `${(score / 5) * 100}%`;

  if (!password) return null;

  return (
    <div className="mt-1.5">
      <div className="h-1 w-full rounded-full" style={{ backgroundColor: "var(--color-border-default)" }}>
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

const PROVIDER_ICONS: Record<"google" | "github", React.ReactNode> = {
  google: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z" fill="#34A853" />
      <path d="M5.84 14.09A6.97 6.97 0 0 1 5.48 12c0-.72.13-1.43.36-2.09V7.07H2.18A11.97 11.97 0 0 0 .96 12c0 1.94.46 3.77 1.22 5.33l3.66-3.24Z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.99 14.97.96 12 .96 7.7.96 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z" fill="#EA4335" />
    </svg>
  ),
  github: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--color-text-primary)">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  ),
};

export function AccountTab({
  email = "",
  hasPassword = true,
  connectedAccounts = [],
  onChangePassword,
  onSetPassword,
  onChangeEmail,
  onConnectAccount,
  onDisconnectAccount,
  saving,
}: AccountTabProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  // Holds the new address once a verification link has been sent, so the tab
  // shows a persistent "check your inbox" panel instead of only a toast. The
  // email doesn't switch until the link in that inbox is clicked.
  const [dsEmailChangePending, setDsEmailChangePending] = useState<string | null>(null);

  const isSocialOnly = !hasPassword;

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = newEmail.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmed)) {
      setEmailError("Enter a valid email address.");
      return;
    }
    if (trimmed === email.toLowerCase()) {
      setEmailError("That's already your email.");
      return;
    }
    if (hasPassword && !emailPassword) {
      setEmailError("Enter your password to confirm.");
      return;
    }
    setEmailError("");
    try {
      // Only advance to the pending state once the link was actually sent —
      // a wrong password rejects here and the parent surfaces the error toast.
      await onChangeEmail?.({ newEmail: trimmed, password: emailPassword });
      setDsEmailChangePending(trimmed);
      setNewEmail("");
      setEmailPassword("");
    } catch {
      // Parent handles the error message; keep the form as-is so the user can retry.
    }
  }

  function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setConfirmError("Passwords don't match.");
      return;
    }
    if (newPassword.length < 8) {
      setConfirmError("Password must be at least 8 characters.");
      return;
    }
    setConfirmError("");
    if (isSocialOnly) {
      onSetPassword?.({ newPassword });
    } else {
      onChangePassword?.({ currentPassword, newPassword });
    }
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  return (
    <div className="space-y-4">
      <SectionCard
        title={isSocialOnly ? "Set a password" : "Change password"}
        description={isSocialOnly
          ? "Add a password so you can also sign in with your email."
          : "Use a strong password you don't use elsewhere."}
      >
        <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-sm">
          {!isSocialOnly && (
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-primary)" }}>
                Current password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm rounded-md border outline-none"
                style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-primary)" }}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-primary)" }}>
              New password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-3 py-2 text-sm rounded-md border outline-none"
              style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-primary)" }}
            />
            <PasswordStrengthBar password={newPassword} />
            <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>
              Min 8 chars with uppercase, number, and symbol.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-primary)" }}>
              Confirm new password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (confirmError) setConfirmError("");
              }}
              required
              className="w-full px-3 py-2 text-sm rounded-md border outline-none"
              style={{
                borderColor: confirmError ? "var(--color-primary)" : "var(--color-border-default)",
                color: "var(--color-text-primary)",
              }}
            />
            {confirmError && (
              <p className="text-xs mt-1" style={{ color: "var(--color-primary)" }}>
                {confirmError}
              </p>
            )}
          </div>

          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : isSocialOnly ? "Set password" : "Update password"}
          </Button>
        </form>
      </SectionCard>

      <SectionCard title="Email address">
        {dsEmailChangePending ? (
          <div
            className="max-w-sm rounded-lg border p-4"
            style={{ borderColor: "var(--color-border-default)", backgroundColor: "var(--color-primary-subtle)" }}
          >
            <div className="flex items-start gap-3">
              <MailCheck className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "var(--color-primary)" }} />
              <div className="space-y-1">
                <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                  Confirm your new email
                </p>
                <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  We sent a verification link to{" "}
                  <span className="font-medium" style={{ color: "var(--color-text-primary)" }}>{dsEmailChangePending}</span>.
                  Click it to finish changing your email. The link expires in 24 hours.
                </p>
                <p className="text-xs pt-1" style={{ color: "var(--color-text-secondary)" }}>
                  {email ? <>Your current address <span style={{ color: "var(--color-text-primary)" }}>{email}</span> stays active until you confirm. </> : "Your current address stays active until you confirm. "}
                  Didn&apos;t get it? Check your spam folder.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDsEmailChangePending(null)}
              className="mt-3 text-sm font-medium"
              style={{ color: "var(--color-primary)" }}
            >
              Use a different email
            </button>
          </div>
        ) : (
        <>
        <p className="text-sm mb-4" style={{ color: "var(--color-text-secondary)" }}>
          {email ? (
            <>Currently <span style={{ color: "var(--color-text-primary)" }}>{email}</span>. We'll send a confirmation link to the new address before switching.</>
          ) : (
            "We'll send a confirmation link to the new address before switching."
          )}
        </p>

        <form onSubmit={handleEmailSubmit} className="space-y-4 max-w-sm">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-primary)" }}>
              New email
            </label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => { setNewEmail(e.target.value); if (emailError) setEmailError(""); }}
              required
              placeholder="you@example.com"
              className="w-full px-3 py-2 text-sm rounded-md border outline-none"
              style={{
                borderColor: emailError ? "var(--color-primary)" : "var(--color-border-default)",
                color: "var(--color-text-primary)",
              }}
            />
          </div>

          {hasPassword && (
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-primary)" }}>
                Current password
              </label>
              <input
                type="password"
                value={emailPassword}
                onChange={(e) => { setEmailPassword(e.target.value); if (emailError) setEmailError(""); }}
                required
                className="w-full px-3 py-2 text-sm rounded-md border outline-none"
                style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-primary)" }}
              />
            </div>
          )}

          {emailError && (
            <p className="text-xs" style={{ color: "var(--color-primary)" }}>
              {emailError}
            </p>
          )}

          <Button type="submit" disabled={saving}>
            {saving ? "Sending..." : "Send confirmation link"}
          </Button>
        </form>
        </>
        )}
      </SectionCard>

      <SectionCard title="Connected accounts" description="Sign in faster using a social provider.">
        <div className="space-y-3">
          {(["google", "github"] as const).map((provider) => {
            const connected = connectedAccounts.find((a) => a.provider === provider);
            return (
              <div
                key={provider}
                className="flex items-center justify-between px-4 py-3 rounded-lg border"
                style={{ borderColor: "var(--color-border-default)" }}
              >
                <div className="flex items-center gap-3">
                  <span className="flex-shrink-0">{PROVIDER_ICONS[provider]}</span>
                  <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                    {provider === "google" ? "Google" : "GitHub"}
                  </span>
                  {connected ? (
                    <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                      {connected.email}
                    </span>
                  ) : (
                    <Pill tone="neutral">Not connected</Pill>
                  )}
                </div>
                {connected ? (
                  <Button type="button" variant="ghost" size="sm" onClick={() => onDisconnectAccount?.(provider)}>
                    Disconnect
                  </Button>
                ) : (
                  <Button type="button" variant="ghost" size="sm" onClick={() => onConnectAccount?.(provider)}>
                    Connect
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
}
