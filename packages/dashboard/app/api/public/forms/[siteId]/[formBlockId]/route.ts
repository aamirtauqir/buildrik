import { NextRequest, NextResponse } from "next/server";
import { submitForm } from "@server/services/form-submission.service";
import { checkRateLimit } from "@server/services/rate-limiter";
import { formSubmissionSchema } from "@buildrik/shared/schemas/forms";

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
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

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
    const { _honeypot, ...data } = fields;
    parsedJson = { data, ...(_honeypot !== undefined ? { honeypot: _honeypot } : {}) };
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
    const result = await submitForm(siteId, formBlockId, parsed.data, ip);
    /* A browser that posted a form expects a page, not JSON. Send it back where
       it came from with a marker the site can act on; a scripted caller still
       gets the id. */
    if (isForm) {
      const back = req.headers.get("referer");
      if (back) {
        const url = new URL(back);
        url.searchParams.set("submitted", "1");
        return NextResponse.redirect(url.toString(), 303);
      }
      return new NextResponse(
        "<!DOCTYPE html><meta charset=\"utf-8\"><title>Thanks</title><p>Thanks — your message was sent.</p>",
        { status: 200, headers: { "content-type": "text/html; charset=utf-8" } },
      );
    }
    return NextResponse.json({ id: result.id, message: "Submission received" }, { status: 201 });
  } catch (e: unknown) {
    if (e instanceof Error) {
      if (e.message === "FORM_NOT_FOUND") return NextResponse.json({ error: "Form not found" }, { status: 404 });
      if (e.message === "FORM_SUBMISSION_LIMIT") return NextResponse.json({ error: "Monthly submission limit reached" }, { status: 402 });
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
