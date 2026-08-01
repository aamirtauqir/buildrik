/**
 * Regression: `useTemplate` read templates by id with no workspace scope.
 *
 * `56de0d4d` ("scope templates.get") added the visibility filter to
 * `getTemplate` and `applyTemplateToSite` and MISSED the third call site.
 * `useTemplate` kept `prisma.template.findUnique({ where: { id } })`, so any
 * authenticated user who knew (or guessed) a template id could instantiate
 * another workspace's PRIVATE template — copying its full page content into a
 * site they own. Cross-tenant read, and the leaked content is the whole point
 * of a template.
 *
 * The rule these tests pin: a template is readable only when it is global
 * (`workspaceId: null`) or belongs to the calling workspace. Same predicate
 * `getTemplate` already uses — this file exists so the next person who adds a
 * fourth call site has something that fails.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const templateFindFirst = vi.fn();
const templateFindUnique = vi.fn();
const memberFindFirst = vi.fn();
const siteCount = vi.fn();
const siteCreate = vi.fn();
const siteFindFirst = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    template: {
      findFirst: (...a: unknown[]) => templateFindFirst(...a),
      findUnique: (...a: unknown[]) => templateFindUnique(...a),
    },
    workspaceMember: { findFirst: (...a: unknown[]) => memberFindFirst(...a) },
    site: {
      count: (...a: unknown[]) => siteCount(...a),
      create: (...a: unknown[]) => siteCreate(...a),
      findFirst: (...a: unknown[]) => siteFindFirst(...a),
    },
  },
}));

import { useTemplate, getTemplate } from "../template.service";

const CALLER_WS = "ws-caller";
const VICTIM_WS = "ws-victim";

beforeEach(() => {
  vi.clearAllMocks();
  memberFindFirst.mockResolvedValue({ workspace: { plan: "PRO" } });
  siteCount.mockResolvedValue(0);
  siteCreate.mockResolvedValue({ id: "site-1", slug: "s" });
  templateFindFirst.mockResolvedValue(null);
  templateFindUnique.mockResolvedValue(null);
});

/** Every predicate that correctly scopes a template read looks like this. */
function isWorkspaceScoped(where: Record<string, unknown> | undefined): boolean {
  const or = where?.OR as Array<Record<string, unknown>> | undefined;
  if (!Array.isArray(or)) return false;
  const hasGlobal = or.some((c) => c.workspaceId === null);
  const hasCaller = or.some((c) => c.workspaceId === CALLER_WS);
  return hasGlobal && hasCaller;
}

describe("template reads are workspace-scoped", () => {
  it("getTemplate scopes by workspace (the call site 56de0d4d fixed)", async () => {
    await getTemplate("t-1", CALLER_WS);
    expect(isWorkspaceScoped(templateFindFirst.mock.calls[0]?.[0]?.where)).toBe(true);
  });

  it("useTemplate scopes by workspace (the call site 56de0d4d missed)", async () => {
    // An unscoped findUnique would resolve the victim's private template here
    // and happily clone its pages. Assert on the QUERY, not the result: a test
    // that only checked the return value would pass against a mock that
    // returned null for unrelated reasons.
    templateFindFirst.mockResolvedValue({ id: "t-1", pages: [], workspaceId: null });

    await useTemplate(CALLER_WS, "user-1", "t-1", "My Site").catch(() => {});

    expect(
      templateFindUnique,
      "useTemplate must not read templates with an unscoped findUnique",
    ).not.toHaveBeenCalled();
    expect(templateFindFirst).toHaveBeenCalled();
    expect(isWorkspaceScoped(templateFindFirst.mock.calls[0]?.[0]?.where)).toBe(true);
  });

  it("useTemplate refuses a template owned by another workspace", async () => {
    // The scoped query returns nothing for a foreign private template, which
    // must surface as TEMPLATE_NOT_FOUND rather than a silent empty site.
    templateFindFirst.mockResolvedValue(null);

    await expect(useTemplate(CALLER_WS, "user-1", "victim-template", "My Site")).rejects.toThrow(
      "TEMPLATE_NOT_FOUND",
    );
    expect(siteCreate).not.toHaveBeenCalled();
    void VICTIM_WS;
  });
});
