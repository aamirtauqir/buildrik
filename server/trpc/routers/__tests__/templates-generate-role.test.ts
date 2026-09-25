/**
 * templates.generate.create (S-8): AI site generation spins a paid job and
 * consumes plan quota — must be EDITOR+ like templates.use, not open to
 * every ACTIVE member including VIEWER.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const createGenerationJobMock = vi.fn();
const checkRoleMock = vi.fn();
const memberFindFirstMock = vi.fn();

vi.mock("@/server/auth", () => ({ auth: vi.fn().mockResolvedValue(null) }));
vi.mock("@/server/services/ai-generation.service", () => ({
  createGenerationJob: (...a: unknown[]) => createGenerationJobMock(...a),
  getJobStatus: vi.fn(),
  cancelJob: vi.fn(),
}));
vi.mock("@/server/services/template.service", () => ({
  listTemplates: vi.fn(),
  getTemplate: vi.fn(),
  useTemplate: vi.fn(),
  cloneSiteAsTemplate: vi.fn(),
  applyTemplateToSite: vi.fn(),
  TemplateError: class TemplateError extends Error {},
}));
vi.mock("@/server/services/permission.service", () => ({
  checkSiteRole: vi.fn(),
  checkWorkspaceRole: (...a: unknown[]) => checkRoleMock(...a),
  PermissionError: class PermissionError extends Error {
    code: string;
    constructor(code: string, msg?: string) {
      super(msg ?? code);
      this.name = "PermissionError";
      this.code = code;
    }
  },
}));

import { templatesRouter } from "@/server/trpc/routers/templates";
import { PermissionError } from "@/server/services/permission.service";

function makeCtx(userId: string) {
  return {
    session: { user: { id: userId } },
    prisma: { workspaceMember: { findFirst: (...a: unknown[]) => memberFindFirstMock(...a) } } as never,
  };
}

const validInput = {
  name: "My Site",
  businessType: "BUSINESS" as const,
  pages: ["home"],
};

describe("templates.generate.create role gate", () => {
  beforeEach(() => {
    createGenerationJobMock.mockReset();
    checkRoleMock.mockReset();
    memberFindFirstMock.mockReset();
    memberFindFirstMock.mockResolvedValue({ workspaceId: "ws_1" });
  });

  it("rejects a VIEWER and never creates the job", async () => {
    checkRoleMock.mockRejectedValueOnce(new PermissionError("FORBIDDEN", "needs EDITOR"));
    const caller = templatesRouter.createCaller(makeCtx("u_viewer") as never);
    await expect(caller.generate.create(validInput)).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(createGenerationJobMock).not.toHaveBeenCalled();
  });

  it("creates the job for an EDITOR", async () => {
    checkRoleMock.mockResolvedValueOnce(undefined);
    createGenerationJobMock.mockResolvedValueOnce({ jobId: "job_1" });
    const caller = templatesRouter.createCaller(makeCtx("u_editor") as never);
    await expect(caller.generate.create(validInput)).resolves.toEqual({ jobId: "job_1" });
    expect(checkRoleMock).toHaveBeenCalledWith(expect.anything(), "u_editor", "ws_1", "EDITOR");
  });
});
