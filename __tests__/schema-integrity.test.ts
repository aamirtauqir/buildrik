// __tests__/schema-integrity.test.ts
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

describe("Prisma Schema Integrity", () => {
  const schema = readFileSync(
    join(__dirname, "..", "prisma", "schema.prisma"),
    "utf-8"
  );

  it("schema contains all 41 models from PRD", () => {
    const expectedModels = [
      "User", "Account", "Session", "VerificationToken",
      "WorkspaceMember", "Workspace", "AuditLog",
      "Site", "Page", "Domain", "DnsRecord", "Folder",
      "Invite", "ShareLink", "SitePermission",
      "Subscription", "PaymentMethod", "Invoice",
      "Notification", "NotificationPref", "ActivityLog", "OnboardingState",
      "SiteAnalytics", "AnalyticsEvent", "FormBlock", "FormSubmission",
      "Template", "AIGenerationJob",
      "WorkspaceIntegration", "WSSharingSettings",
      "HelpArticle", "SupportTicket", "ExportJob", "UserPreference",
      "SlugHistory", "WorkspaceTransfer", "AccountDeletionReq",
      "LoginAttempt", "PublishBuildJob", "Redirect",
    ];

    for (const model of expectedModels) {
      expect(schema, `Missing model: ${model}`).toContain(`model ${model}`);
    }
    expect(expectedModels).toHaveLength(40);
  });

  it("schema has required unique constraints", () => {
    expect(schema).toContain("@@unique([userId, workspaceId])");
    expect(schema).toContain("@@unique([siteId, slug])");
    expect(schema).toContain("@@unique([memberId, siteId])");
    expect(schema).toContain("@@unique([userId, category])");
    expect(schema).toContain("@@unique([siteId, date])");
  });

  it("schema has required indexes", () => {
    expect(schema).toContain("@@index([workspaceId, status])");
    expect(schema).toContain("@@index([userId, read])");
    expect(schema).toContain("@@index([siteId, createdAt])");
    expect(schema).toContain("@@index([email, createdAt])");
    expect(schema).toContain("@@index([workspaceId, createdAt])");
    expect(schema).toContain("@@index([siteId, formBlockId])");
    expect(schema).toContain("@@index([siteId, isActive])");
  });

  it("Site model has all required fields", () => {
    const siteStart = schema.indexOf("model Site {");
    const siteEnd = schema.indexOf('@@map("sites")');
    const siteSection = schema.slice(siteStart, siteEnd);
    const requiredFields = [
      "workspaceId", "name", "slug", "status", "creationMethod",
      "pages", "createdBy", "headCode", "bodyCode", "socialLinks",
      "publishedPassword", "metaTitleTemplate", "folderId", "deletedAt",
    ];
    for (const field of requiredFields) {
      expect(siteSection, `Site missing field: ${field}`).toContain(field);
    }
  });

  it("Page model has blocks as Json", () => {
    const pageStart = schema.indexOf("model Page {");
    const pageEnd = schema.indexOf('@@map("pages")');
    const pageSection = schema.slice(pageStart, pageEnd);
    expect(pageSection).toContain("blocks");
    expect(pageSection).toContain("Json");
    expect(pageSection).toContain("@@unique([siteId, slug])");
  });
});
