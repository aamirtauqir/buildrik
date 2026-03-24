import { NextRequest, NextResponse } from "next/server";
import { submitForm } from "@/server/services/form-submission.service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ siteId: string; formBlockId: string }> }
) {
  const { siteId, formBlockId } = await params;
  const body = await req.json();
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

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
