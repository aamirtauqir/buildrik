import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { deliverWebhook } from "@/server/services/webhook.service";
import { csvCell } from "@/lib/utils";
import { PLAN_LIMITS, type PlanName } from "@/lib/constants/plan-limits";
import type {
  FormSubmissionInput,
  ListSubmissionsInput,
  UpdateFormBlockInput,
} from "@buildrik/shared/schemas/forms";
import { isAbsoluteHttpUrl } from "@buildrik/shared/schemas/element-markup";
import { resolveSiteOrigins } from "@/lib/publish-urls";
import { slugifyProjectName } from "@/lib/vercel";
import type { DiscoveredForm, FormBlockWireSettings } from "@/lib/publish-forms";
import { notifyWorkspaceOwner } from "@/server/services/notification.trigger";
import { sendFormSubmissionEmail } from "@/server/services/email.service";

/** Domain error for this service — mirrors `CmsError` (`cms.service.ts`):
 *  routers translate `code` straight into a `TRPCError`. */
export class FormError extends Error {
  constructor(
    public code: "NOT_FOUND" | "PRECONDITION_FAILED" | "FORBIDDEN",
    message: string,
  ) {
    super(message);
    this.name = "FormError";
  }
}

/**
 * Validates a URL against one of the site's own known origins before
 * trusting it as a redirect target — an arbitrary attacker string here
 * would be an open redirect. Used for BOTH the visitor's own `location.href`
 * (sent as `returnUrl`, filled by the page script in `lib/publish-forms.ts`)
 * and the raw `Referer` header — the Referer is attacker-influenceable too
 * (any page can link to a form with a crafted opener, and some browsers/
 * extensions strip or rewrite it), so it gets the exact same exact-origin
 * check as `_return`, never trusted raw.
 */
function safeUrlOnOrigins(url: string | undefined | null, origins: string[]): string | null {
  if (!url || !isAbsoluteHttpUrl(url) || origins.length === 0) return null;
  try {
    const parsedOrigin = new URL(url).origin;
    return origins.some((o) => {
      try {
        return new URL(o).origin === parsedOrigin;
      } catch {
        return false;
      }
    })
      ? url
      : null;
  } catch {
    return null;
  }
}

type UpdateInput = {
  id: string;
  isRead?: boolean;
  isSpam?: boolean;
  isArchived?: boolean;
};

export interface SubmitFormResult {
  id: string;
  successAction: "MESSAGE" | "REDIRECT";
  redirectUrl: string | null;
  successMessage: string | null;
  /** The visitor's own page URL, validated against the site's own origins — null when absent/unvalidated/off-site. */
  returnUrl: string | null;
  /** The `Referer` header, validated against the exact same site origins as `returnUrl` — never trusted raw. Null when absent/unvalidated/off-site. */
  refererUrl: string | null;
  /** The site's own preferred origin, for a redirect fallback when neither `returnUrl` nor `refererUrl` validates — never an attacker-controlled string. Null only when the site has no resolvable origin at all. */
  siteOrigin: string | null;
}

export async function submitForm(
  siteId: string,
  blockId: string,
  input: FormSubmissionInput,
  ip: string,
  refererHeader?: string,
): Promise<SubmitFormResult> {
  if (input.honeypot) {
    return {
      id: "honeypot", successAction: "MESSAGE", redirectUrl: null, successMessage: null,
      returnUrl: null, refererUrl: null, siteOrigin: null,
    };
  }

  const formBlock = await prisma.formBlock.findFirst({
    where: { siteId, blockId, isActive: true },
  });
  if (!formBlock) throw new FormError("NOT_FOUND", "FORM_NOT_FOUND");

  const site = await prisma.site.findUnique({
    where: { id: siteId },
    select: { workspaceId: true, name: true, deletedAt: true, canonicalUrl: true, slug: true },
  });
  if (!site || site.deletedAt) throw new FormError("NOT_FOUND", "FORM_NOT_FOUND");

  const verifiedDomain = await prisma.domain.findFirst({
    where: { siteId, status: "VERIFIED" },
    select: { domain: true },
  });

  const member = await prisma.workspaceMember.findFirst({
    where: { workspaceId: site.workspaceId },
    select: { workspace: { select: { plan: true } } },
  });

  const plan = (member?.workspace?.plan ?? "FREE") as PlanName;
  const limit = PLAN_LIMITS[plan].formSubmissions as number;

  if (limit !== -1) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const count = await prisma.formSubmission.count({
      where: { siteId, createdAt: { gte: monthStart } },
    });
    if (count >= limit) throw new FormError("PRECONDITION_FAILED", "FORM_SUBMISSION_LIMIT");
  }

  const submission = await prisma.formSubmission.create({
    data: { formBlockId: formBlock.id, siteId, data: input.data, ip },
  });

  notifyWorkspaceOwner(
    site!.workspaceId,
    "FORM_SUBMISSION_RECEIVED",
    `New form submission on "${site!.name}"`,
    `/dashboard/sites/${siteId}`,
    siteId,
  ).catch(() => {});

  // Notify: the block's own configured address (inspector › AFTER SUBMIT ›
  // Send to email) AND the workspace owner, always — a form owner who set a
  // team inbox as notifyEmail still wants to know their own site is getting
  // submissions, and losing the owner silently was the previous behaviour's
  // failure mode. Deduped when the owner IS the configured address. Both
  // sends are fire-and-forget — a failed send (bad SMTP creds, provider
  // outage) must never lose the submission, which is already committed
  // above, but IS worth a log line instead of vanishing into a swallowed
  // catch.
  prisma.workspaceMember
    .findFirst({
      where: { workspaceId: site!.workspaceId, role: "OWNER" },
      select: { user: { select: { email: true } } },
    })
    .then((owner) => {
      // Dedup case-insensitively — email addresses are case-insensitive in
      // practice, and a notifyEmail set with different casing than the
      // owner's own account email is still the same mailbox, not two.
      const seen = new Set<string>();
      const recipients = [formBlock.notifyEmail, owner?.user?.email]
        .filter((e): e is string => Boolean(e))
        .filter((e) => {
          const key = e.toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      const fields = Object.entries((input.data ?? {}) as Record<string, unknown>).map(
        ([label, value]) => ({ label, value: String(value) }),
      );
      return Promise.all(recipients.map((to) => sendFormSubmissionEmail(to, site!.name, fields, siteId)));
    })
    .catch((err) => console.error(`[form-submission] notify email failed for form=${formBlock.id}:`, err));

  // P6 workspace webhook — best-effort, never blocks the submission.
  if (site?.workspaceId) {
    void deliverWebhook(site.workspaceId, "form.submit", {
      siteId,
      submissionId: submission.id,
      data: input.data ?? {},
    });
  }

  // A row can only reach REDIRECT with no usable URL through direct DB
  // tampering or a bug elsewhere (the write path validates it) — fail closed
  // to the message behaviour rather than send a browser to `undefined`.
  const redirectUrl = formBlock.redirectUrl && isAbsoluteHttpUrl(formBlock.redirectUrl) ? formBlock.redirectUrl : null;
  const successAction: "MESSAGE" | "REDIRECT" = formBlock.successAction === "REDIRECT" && redirectUrl ? "REDIRECT" : "MESSAGE";

  const origins = resolveSiteOrigins({
    canonicalUrl: site.canonicalUrl,
    verifiedDomain: verifiedDomain?.domain ?? null,
    vercelProjectName: site.slug ? slugifyProjectName(site.slug) : null,
  });

  return {
    id: submission.id,
    successAction,
    redirectUrl,
    successMessage: formBlock.successMessage ?? null,
    returnUrl: safeUrlOnOrigins(input.returnUrl, origins),
    refererUrl: safeUrlOnOrigins(refererHeader, origins),
    siteOrigin: origins[0] ?? null,
  };
}

export async function listSubmissions(input: ListSubmissionsInput) {
  const { siteId, formBlockId, isRead, isSpam, isArchived, page, perPage } = input;

  const where = {
    siteId,
    ...(formBlockId !== undefined && { formBlockId }),
    ...(isRead !== undefined && { isRead }),
    ...(isSpam !== undefined && { isSpam }),
    ...(isArchived !== undefined && { isArchived }),
  };

  const [total, data] = await Promise.all([
    prisma.formSubmission.count({ where }),
    prisma.formSubmission.findMany({
      where,
      include: { formBlock: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
  ]);

  return { data, total, page, perPage };
}

export async function updateSubmission(input: UpdateInput) {
  const { id, ...data } = input;
  return prisma.formSubmission.update({ where: { id }, data });
}

export async function deleteSubmission(id: string) {
  return prisma.formSubmission.delete({ where: { id } });
}

export async function listFormBlocks(siteId: string) {
  return prisma.formBlock.findMany({
    where: { siteId },
    include: { _count: { select: { submissions: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export interface FormBlockSettings {
  successMessage: string | null;
  successAction: "MESSAGE" | "REDIRECT";
  redirectUrl: string | null;
  notifyEmail: string | null;
  spamProtection: boolean;
}

const DEFAULT_FORM_BLOCK_SETTINGS: FormBlockSettings = {
  successMessage: null,
  successAction: "MESSAGE",
  redirectUrl: null,
  notifyEmail: null,
  spamProtection: true,
};

/**
 * Inspector AFTER SUBMIT / PROTECTION read. The block's row may not exist yet
 * — the row is created at first publish (`planFormWiring` → the publish
 * worker's upsert) — so an unpublished form reads as the same defaults its
 * row will get once it exists.
 */
export async function getFormBlockSettings(
  siteId: string,
  blockId: string,
): Promise<FormBlockSettings> {
  const row = await prisma.formBlock.findUnique({ where: { siteId_blockId: { siteId, blockId } } });
  if (!row) return DEFAULT_FORM_BLOCK_SETTINGS;
  return {
    successMessage: row.successMessage,
    successAction: row.successAction === "REDIRECT" ? "REDIRECT" : "MESSAGE",
    redirectUrl: row.redirectUrl,
    notifyEmail: row.notifyEmail,
    spamProtection: row.spamProtection,
  };
}

/**
 * Inspector AFTER SUBMIT / PROTECTION write. Upserts by (site, form element
 * id) — the same key `wireForms` posts to and the publish worker records — so
 * a setting saved before the form is ever published still lands on the row
 * publish later updates.
 */
export async function updateFormBlock(input: UpdateFormBlockInput) {
  const { siteId, blockId, ...settings } = input;
  const data: Prisma.FormBlockUpdateInput = {};
  if (settings.successMessage !== undefined) data.successMessage = settings.successMessage || null;
  if (settings.successAction !== undefined) data.successAction = settings.successAction;
  if (settings.redirectUrl !== undefined) data.redirectUrl = settings.redirectUrl || null;
  if (settings.notifyEmail !== undefined) data.notifyEmail = settings.notifyEmail || null;
  if (settings.spamProtection !== undefined) data.spamProtection = settings.spamProtection;

  return prisma.formBlock.upsert({
    where: { siteId_blockId: { siteId, blockId } },
    // Not `...data` — `Prisma.FormBlockUpdateInput`'s fields are typed for
    // PATCH semantics (`string | StringFieldUpdateOperationsInput`), which
    // poisons a Create input's plain-scalar fields when spread in. Every
    // field here has its own default because a settings save can be the
    // FIRST write this row ever gets (before the form is ever published).
    create: {
      siteId,
      blockId,
      name: "Untitled form",
      fields: [],
      successMessage: settings.successMessage || null,
      successAction: settings.successAction ?? "MESSAGE",
      redirectUrl: settings.redirectUrl || null,
      notifyEmail: settings.notifyEmail || null,
      spamProtection: settings.spamProtection ?? true,
    },
    update: data,
  });
}

/** Inspector settings a publish carries into the HTML it ships (honeypot on/
 *  off, success message), keyed by the form element's id — republishing must
 *  not silently turn the honeypot off or blank a custom message. */
export async function getPublishedFormSettings(
  siteId: string,
): Promise<Record<string, FormBlockWireSettings>> {
  const rows = await prisma.formBlock.findMany({
    where: { siteId },
    select: { blockId: true, spamProtection: true, successMessage: true },
  });
  return Object.fromEntries(
    rows.map((b) => [b.blockId, { spamProtection: b.spamProtection, successMessage: b.successMessage }]),
  );
}

/**
 * Record the forms a publish wired: one row per form, created on first publish.
 * Republishing must not clobber what the owner set in the dashboard (notify
 * email, webhook, the name they gave it) — only the shape. Forms deleted from
 * the site stop accepting submissions, but their rows and everything already
 * submitted stay — the Submissions tab is a record, not a mirror of the
 * current design. `deactivateMissing` is false whenever wiring could not run
 * (`planFormWiring`), so an empty list never sweeps a site's live forms.
 */
export async function recordPublishedForms(
  siteId: string,
  forms: DiscoveredForm[],
  deactivateMissing: boolean,
): Promise<void> {
  for (const form of forms) {
    await prisma.formBlock.upsert({
      where: { siteId_blockId: { siteId, blockId: form.blockId } },
      create: {
        siteId,
        blockId: form.blockId,
        name: form.name,
        fields: form.fields,
        isActive: true,
      },
      update: { fields: form.fields, isActive: true },
    });
  }
  if (deactivateMissing) {
    await prisma.formBlock.updateMany({
      where: { siteId, blockId: { notIn: forms.map((f) => f.blockId) } },
      data: { isActive: false },
    });
  }
}

export async function exportSubmissions(
  siteId: string,
  // null/undefined exports every form on the site (the overview "Export CSV"
  // button) rather than a single form block — the full dataset, not one page.
  formBlockId: string | null | undefined,
  format: "csv" | "json",
): Promise<string> {
  const submissions = await prisma.formSubmission.findMany({
    where: { siteId, ...(formBlockId ? { formBlockId } : {}) },
    orderBy: { createdAt: "desc" },
    include: { formBlock: { select: { name: true } } },
  });

  if (format === "json") {
    return JSON.stringify(submissions, null, 2);
  }

  if (submissions.length === 0) return "";

  const allKeys = Array.from(
    new Set(submissions.flatMap((s) => Object.keys(s.data as Record<string, string>))),
  );
  // Field names AND values are attacker-controlled (public endpoint) — both
  // go through csvCell so formula payloads can't execute in Excel/Sheets.
  const headers = ["id", "createdAt", "form", ...allKeys].map(csvCell).join(",");
  const rows = submissions.map((s) => {
    const data = s.data as Record<string, string>;
    const values = [
      s.id,
      s.createdAt.toISOString(),
      s.formBlock?.name ?? "",
      ...allKeys.map((k) => data[k] ?? ""),
    ];
    return values.map(csvCell).join(",");
  });
  return [headers, ...rows].join("\n");
}
