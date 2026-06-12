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
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = formSubmissionSchema.safeParse(parsedJson);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid submission" }, { status: 400 });
  }

  try {
    const result = await submitForm(siteId, formBlockId, parsed.data, ip);
    return NextResponse.json({ id: result.id, message: "Submission received" }, { status: 201 });
  } catch (e: unknown) {
    if (e instanceof Error) {
      if (e.message === "FORM_NOT_FOUND") return NextResponse.json({ error: "Form not found" }, { status: 404 });
      if (e.message === "FORM_SUBMISSION_LIMIT") return NextResponse.json({ error: "Monthly submission limit reached" }, { status: 402 });
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
