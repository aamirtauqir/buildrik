import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        auth: {
          cta: "#EF4444",
          "cta-hover": "#DC2626",
          "input-border": "#E2E8F0",
          "input-focus": "#3B82F6",
          "input-error": "#EF4444",
          "text-primary": "#0F172A",
          "text-body": "#1E293B",
          "text-secondary": "#334155",
          "text-muted": "#64748B",
          "text-placeholder": "#94A3B8",
          link: "#3B82F6",
          "success-bg": "#F0FDF4",
          "success-border": "#BBF7D0",
          "success-text": "#166534",
          "error-bg": "#FEF2F2",
          "error-border": "#FECACA",
          "error-text": "#991B1B",
          "strength-bg": "#F8FAFC",
          "strength-pass": "#16A34A",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        "auth-card": "0 4px 24px rgba(0, 0, 0, 0.08)",
      },
      borderRadius: {
        "auth-card": "16px",
        "auth-input": "8px",
        "auth-btn": "8px",
      },
      maxWidth: {
        "auth-card": "420px",
      },
      height: {
        "auth-input": "44px",
        "auth-btn": "44px",
      },
      fontSize: {
        "auth-title": ["22px", { lineHeight: "1.3", fontWeight: "700" }],
        "auth-subtitle": ["14px", { lineHeight: "1.5", fontWeight: "400" }],
        "auth-label": ["13px", { lineHeight: "1.4", fontWeight: "500" }],
        "auth-input": ["14px", { lineHeight: "1.5", fontWeight: "400" }],
        "auth-btn": ["14px", { lineHeight: "1", fontWeight: "600" }],
        "auth-link": ["14px", { lineHeight: "1.5", fontWeight: "500" }],
        "auth-error": ["13px", { lineHeight: "1.4", fontWeight: "400" }],
        "auth-fine": ["12px", { lineHeight: "1.5", fontWeight: "400" }],
      },
    },
  },
  plugins: [],
};

export default config;
