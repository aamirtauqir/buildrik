"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Lock } from "lucide-react";

export default function SharePasswordGate() {
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
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#FAFAFA" }}>
      <div className="w-full max-w-sm mx-auto px-4">
        <div className="bg-white rounded-2xl p-8 shadow-sm" style={{ border: "1px solid #E8E8E8" }}>
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: "#FEF2F2" }}>
              <Lock className="w-6 h-6" style={{ color: "var(--color-primary)" }} />
            </div>
          </div>
          <h1 className="text-lg font-semibold text-center" style={{ color: "#0D0D0D" }}>
            This site is password protected
          </h1>
          <p className="text-sm text-center mt-1 mb-6" style={{ color: "#7A7A7A" }}>
            Enter the password to view this site
          </p>
          <form onSubmit={handleSubmit}>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-11 px-3 rounded-lg text-sm"
              style={{
                border: error ? "2px solid #EF4444" : "1px solid #E8E8E8",
                backgroundColor: error ? "#FEF2F2" : "#FFFFFF",
              }}
              autoFocus
            />
            {error && (
              <p className="text-xs mt-1.5" style={{ color: "#EF4444" }}>{error}</p>
            )}
            <button
              type="submit"
              disabled={loading || !password}
              className="w-full h-11 mt-4 rounded-lg text-sm font-medium text-white disabled:opacity-50"
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
