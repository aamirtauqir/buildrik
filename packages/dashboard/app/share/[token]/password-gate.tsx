"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Lock } from "lucide-react";
import { InputField } from "@/components/dashboard/primitives";

export function SharePasswordGate() {
  const params = useParams();
  const token = params.token as string;
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/share/${token}/verify-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.redirectUrl) {
          window.location.href = data.redirectUrl;
        }
      } else {
        const data = await res.json();
        if (res.status === 410) {
          setError("This share link has expired.");
        } else if (res.status === 404) {
          setError("This share link is no longer available.");
        } else if (res.status === 429) {
          setError("Too many attempts. Please wait a minute and try again.");
        } else {
          setError(data.error ?? "Incorrect password");
        }
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--color-bg-page)" }}>
      <div className="w-full max-w-sm mx-auto px-4">
        <div className="bg-white rounded-lg p-8 shadow-sm" style={{ border: "1px solid var(--color-border-default)" }}>
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: "#FDF2F2" }}>
              <Lock className="w-6 h-6" style={{ color: "var(--color-primary)" }} />
            </div>
          </div>
          <h1 className="text-lg font-semibold text-center" style={{ color: "var(--color-text-primary)" }}>
            This site is password protected
          </h1>
          <p className="text-body text-center mt-1 mb-6" style={{ color: "var(--color-text-secondary)" }}>
            Enter the password to view this site
          </p>
          <form onSubmit={handleSubmit}>
            <InputField
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              invalid={!!error}
              aria-invalid={!!error}
              autoFocus
            />
            {error && (
              <p className="text-body-sm mt-1.5" style={{ color: "#F05252" }}>{error}</p>
            )}
            <button
              type="submit"
              disabled={loading || !password}
              className="w-full h-11 mt-4 rounded-lg text-body font-medium text-white disabled:opacity-50"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              {loading ? "Verifying..." : "View Site"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
