"use client";

import { useEffect, useRef } from "react";

interface TurnstileApi {
  render: (el: HTMLElement, opts: { sitekey: string; callback: (token: string) => void }) => string;
  remove: (id: string) => void;
}
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";

/**
 * Cloudflare Turnstile widget. Renders only when NEXT_PUBLIC_TURNSTILE_SITE_KEY
 * is set; otherwise renders nothing (captcha disabled). Calls onVerify with the
 * solve token.
 */
export function TurnstileWidget({ onVerify }: { onVerify: (token: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!siteKey || !ref.current) return;
    let widgetId: string | undefined;
    const el = ref.current;
    const doRender = () => {
      if (window.turnstile) widgetId = window.turnstile.render(el, { sitekey: siteKey, callback: onVerify });
    };
    if (window.turnstile) {
      doRender();
    } else {
      const script = document.createElement("script");
      script.src = SCRIPT_SRC;
      script.async = true;
      script.onload = doRender;
      document.head.appendChild(script);
    }
    return () => {
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
  }, [siteKey, onVerify]);

  if (!siteKey) return null;
  return <div ref={ref} className="flex justify-center" />;
}
