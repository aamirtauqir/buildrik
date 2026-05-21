import { NextRequest, NextResponse } from "next/server";
import { submitForm } from "@server/services/form-submission.service";
import { checkRateLimit } from "@server/services/rate-limiter";

const FORM_SUBMIT_MAX = 10;
const FORM_SUBMIT_WINDOW_MS = 60_000;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ siteId: string; formBlockId: string }> }
) {
  const { siteId, formBlockId } = await params;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  const limit = checkRateLimit(
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

  const body = await req.json();

  try {
    const result = await submitForm(siteId, formBlockId, body, ip);
    return NextResponse.json({ id: result.id, message: "Submission received" }, { status: 201 });
  } catch (e: unknown) {
    if (e instanceof Error) {
      if (e.message === "FORM_NOT_FOUND") return NextResponse.json({ error: "Form not found" }, { status: 404 });
      if (e.message === "FORM_SUBMISSION_LIMIT") return NextResponse.json({ error: "Monthly submission limit reached" }, { status: 402 });
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
