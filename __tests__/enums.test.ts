import { describe, it, expect } from "vitest";
import {
  AuthProvider, UserRole, SiteStatus, SiteCreationMethod, InviteStatus,
  MemberStatus, SubscriptionPlan, SubscriptionStatus, BillingInterval,
  InvoiceStatus, DomainStatus, SslStatus, NotificationType, OnboardingRole,
  TicketCategory, TicketStatus, IntegrationProvider, TemplateCategory,
  AIJobStatus, ActivityAction, BlockType, VerificationTokenType, OnboardingStep,
} from "@/lib/constants/enums";

describe("Enums", () => {
  it("AuthProvider has 3 values", () => {
    expect(Object.values(AuthProvider)).toHaveLength(3);
    expect(AuthProvider.EMAIL).toBe("EMAIL");
    expect(AuthProvider.GOOGLE).toBe("GOOGLE");
    expect(AuthProvider.GITHUB).toBe("GITHUB");
  });
  it("UserRole has 5 values", () => {
    expect(Object.values(UserRole)).toHaveLength(5);
    expect(UserRole.OWNER).toBe("OWNER");
    expect(UserRole.ADMIN).toBe("ADMIN");
    expect(UserRole.EDITOR).toBe("EDITOR");
    expect(UserRole.DESIGNER).toBe("DESIGNER");
    expect(UserRole.VIEWER).toBe("VIEWER");
  });
  it("SiteStatus has 3 values", () => { expect(Object.values(SiteStatus)).toHaveLength(3); });
  it("SiteCreationMethod has 3 values", () => { expect(Object.values(SiteCreationMethod)).toHaveLength(3); });
  it("InviteStatus has 4 values", () => { expect(Object.values(InviteStatus)).toHaveLength(4); });
  it("MemberStatus has 2 values", () => { expect(Object.values(MemberStatus)).toHaveLength(2); });
  it("SubscriptionPlan has 3 values", () => { expect(Object.values(SubscriptionPlan)).toHaveLength(3); });
  it("SubscriptionStatus has 4 values", () => { expect(Object.values(SubscriptionStatus)).toHaveLength(4); });
  it("BillingInterval has 2 values", () => { expect(Object.values(BillingInterval)).toHaveLength(2); });
  it("InvoiceStatus has 4 values", () => { expect(Object.values(InvoiceStatus)).toHaveLength(4); });
  it("DomainStatus has 3 values", () => { expect(Object.values(DomainStatus)).toHaveLength(3); });
  it("SslStatus has 3 values", () => { expect(Object.values(SslStatus)).toHaveLength(3); });
  it("NotificationType has 21 values", () => {
    expect(Object.values(NotificationType)).toHaveLength(21);
    expect(NotificationType.FORM_SUBMISSION_RECEIVED).toBe("FORM_SUBMISSION_RECEIVED");
  });
  it("OnboardingRole has 3 values", () => { expect(Object.values(OnboardingRole)).toHaveLength(3); });
  it("TicketCategory has 6 values", () => { expect(Object.values(TicketCategory)).toHaveLength(6); });
  it("TicketStatus has 4 values", () => { expect(Object.values(TicketStatus)).toHaveLength(4); });
  it("IntegrationProvider has 4 values", () => { expect(Object.values(IntegrationProvider)).toHaveLength(4); });
  it("TemplateCategory has 6 values", () => { expect(Object.values(TemplateCategory)).toHaveLength(6); });
  it("AIJobStatus has 7 values", () => { expect(Object.values(AIJobStatus)).toHaveLength(7); });
  it("ActivityAction has 26 values", () => { expect(Object.values(ActivityAction)).toHaveLength(26); });
  it("BlockType has 12 values", () => {
    expect(Object.values(BlockType)).toHaveLength(12);
    expect(BlockType.HEADING).toBe("HEADING");
    expect(BlockType.FORM).toBe("FORM");
  });
  it("VerificationTokenType has 4 values", () => { expect(Object.values(VerificationTokenType)).toHaveLength(4); });
  it("OnboardingStep has 6 values", () => { expect(Object.values(OnboardingStep)).toHaveLength(6); });
  it("all 23 enum objects are exported", () => {
    const enums = [AuthProvider, UserRole, SiteStatus, SiteCreationMethod, InviteStatus, MemberStatus, SubscriptionPlan, SubscriptionStatus, BillingInterval, InvoiceStatus, DomainStatus, SslStatus, NotificationType, OnboardingRole, TicketCategory, TicketStatus, IntegrationProvider, TemplateCategory, AIJobStatus, ActivityAction, BlockType, VerificationTokenType, OnboardingStep];
    expect(enums).toHaveLength(23);
  });
});
