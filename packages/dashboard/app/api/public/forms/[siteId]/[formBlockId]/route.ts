import { NextRequest, NextResponse } from "next/server";
import { submitForm, FormError } from "@server/services/form-submission.service";
import { checkRateLimit } from "@server/services/rate-limiter";
import { formSubmissionSchema } from "@buildrik/shared/schemas/forms";
import { isDangerousUrl, isAbsoluteHttpUrl } from "@buildrik/shared/schemas/element-markup";
import { clientIp } from "@lib/request-ip";

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

const FORM_SUBMIT_MAX = 10;
const FORM_SUBMIT_WINDOW_MS = 60_000;
// Hard body cap — the submission lands in a JSON column; schema bounds
// (100 fields × 10KB) put a worst case near 1MB, so 256KB is generous.
const MAX_BODY_BYTES = 256 * 1024;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ siteId: string; formBlockId: string }> }
) {
  const { siteId, formBlockId } = await params;
  const ip = clientIp(req.headers);

  const limit = await checkRateLimit(
    `form-submit:${siteId}:${formBlockId}:${ip}`,
    FORM_SUBMIT_MAX,
    FORM_SUBMIT_WINDOW_MS,
  );
  if (!limit.allowed) {
    const retryAfterSec = Math.max(1, Math.ceil((limit.resetAt - Date.now()) / 1000));
    return NextResponse.json(
      { error: "Too many submissions. Please wait before trying again." },
      { status: 429, headers: { "Retry-After": String(retryAfterSec) } },
    );
  }

  // The endpoint is public — never trust the body shape. Raw req.json()
  // previously went straight into the JSON column unvalidated.
  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }
  /* A published form is plain HTML: `<form method="POST">` sends
     application/x-www-form-urlencoded, and this endpoint accepted JSON only —
     so a real browser submission died at JSON.parse with a 400 before it ever
     reached validation. Both shapes are accepted now; the JSON one is what
     scripted submissions send. */
  const isForm = (req.headers.get("content-type") ?? "").includes(
    "application/x-www-form-urlencoded",
  );
  let parsedJson: unknown;
  if (isForm) {
    const fields = Object.fromEntries(new URLSearchParams(raw).entries());
    const { _honeypot, _return, ...data } = fields;
    parsedJson = {
      data,
      ...(_honeypot !== undefined ? { honeypot: _honeypot } : {}),
      ...(_return !== undefined ? { returnUrl: _return } : {}),
    };
  } else {
    try {
      parsedJson = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
  }
  const parsed = formSubmissionSchema.safeParse(parsedJson);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid submission" }, { status: 400 });
  }

  try {
    const result = await submitForm(siteId, formBlockId, parsed.data, ip, req.headers.get("referer") ?? undefined);
    /* A browser that posted a form expects a page, not JSON. Send it back where
       it came from with a marker the site can act on; a scripted caller still
       gets the id. */
    if (isForm) {
      // Redirect after submit: re-checked here (defense in depth — the
      // inspector's write path and the service both already validated it)
      // because this is the response that actually sends a browser's
      // `Location` header. `NextResponse.redirect` needs an absolute URL —
      // a relative one either throws or resolves against the wrong (this
      // API's) host, so isAbsoluteHttpUrl is required, not just "not
      // dangerous".
      if (
        result.successAction === "REDIRECT" &&
        result.redirectUrl &&
        isAbsoluteHttpUrl(result.redirectUrl) &&
        !isDangerousUrl(result.redirectUrl)
      ) {
        return NextResponse.redirect(result.redirectUrl, 303);
      }
      /* "Show message": land back on the page the visitor actually submitted
         from. `result.returnUrl` (the page's own `location.href`) is
         preferred — a cross-origin form POST's `Referer` is origin-only
         under the default `strict-origin-when-cross-origin` policy, so the
         path is already gone by the time it reaches here and a Referer-only
         redirect always lands on the home page. `result.refererUrl` is the
         fallback — the RAW `Referer` header is never used directly here; it
         went through the exact same exact-origin check as `_return` inside
         `submitForm` (an unvalidated Referer is attacker-influenceable, the
         same open-redirect risk `_return` itself guards against). Neither
         validating → land on the site's own resolved origin root, never on
         an unchecked string. */
      const back = result.returnUrl ?? result.refererUrl;
      if (back) {
        try {
          const url = new URL(back);
          url.searchParams.set("submitted", "1");
          url.searchParams.set("form", formBlockId);
          return NextResponse.redirect(url.toString(), 303);
        } catch {
          // Unreachable in practice — submitForm only ever returns an
          // absolute, already-`new URL`-parsed value here.
        }
      }
      if (result.siteOrigin) {
        try {
          const url = new URL(result.siteOrigin);
          url.searchParams.set("submitted", "1");
          url.searchParams.set("form", formBlockId);
          return NextResponse.redirect(url.toString(), 303);
        } catch {
          // Unreachable — siteOrigin is built by resolveSiteOrigins, which
          // only ever returns `new URL`-parsed origins.
        }
      }
      const message = result.successMessage || "Thanks — your message was sent.";
      return new NextResponse(
        `<!DOCTYPE html><meta charset="utf-8"><title>Thanks</title><p>${escapeHtml(message)}</p>`,
        { status: 200, headers: { "content-type": "text/html; charset=utf-8" } },
      );
    }
    return NextResponse.json({ id: result.id, message: "Submission received" }, { status: 201 });
  } catch (e: unknown) {
    if (e instanceof FormError) {
      if (e.message === "FORM_NOT_FOUND") return NextResponse.json({ error: "Form not found" }, { status: 404 });
      if (e.message === "FORM_SUBMISSION_LIMIT") return NextResponse.json({ error: "Monthly submission limit reached" }, { status: 402 });
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
