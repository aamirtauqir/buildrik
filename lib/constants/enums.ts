export const AuthProvider = {
  EMAIL: "EMAIL",
  GOOGLE: "GOOGLE",
  GITHUB: "GITHUB",
} as const;

export const UserRole = {
  OWNER: "OWNER",
  ADMIN: "ADMIN",
  EDITOR: "EDITOR",
  // a5-invite: Designer = site-edit access like a Content editor (same rank),
  // distinguished as a design-focused role. A finer design-only-vs-content
  // capability split would need a capability model beyond the linear rank.
  DESIGNER: "DESIGNER",
  VIEWER: "VIEWER",
} as const;

// User-facing display labels for workspace roles. The stored enum value stays
// EDITOR (JWT claims + ROLE_RANK in permission.service reference it); only the
// label a user reads is "Content editor". SSOT for every role-label render site
// (team table, invites, member detail, auth screens). Redesign build-spec E1:
// "the role a client gets is named Content editor", "Client" only names the
// company/account node — never a role.
export const RoleLabel: Record<UserRoleType, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  EDITOR: "Content editor",
  DESIGNER: "Designer",
  VIEWER: "Viewer",
};

export function roleLabel(role: string): string {
  return RoleLabel[role as UserRoleType] ?? role;
}

export const SiteStatus = {
  DRAFT: "DRAFT",
  PUBLISHED: "PUBLISHED",
  ARCHIVED: "ARCHIVED",
} as const;

export const SiteCreationMethod = {
  BLANK: "BLANK",
  TEMPLATE: "TEMPLATE",
  AI: "AI",
} as const;

export const InviteStatus = {
  PENDING: "PENDING",
  ACCEPTED: "ACCEPTED",
  DECLINED: "DECLINED",
  EXPIRED: "EXPIRED",
} as const;

export const MemberStatus = {
  ACTIVE: "ACTIVE",
  SUSPENDED: "SUSPENDED",
} as const;

export const SubscriptionPlan = {
  FREE: "FREE",
  PRO: "PRO",
  BUSINESS: "BUSINESS",
} as const;

export const SubscriptionStatus = {
  ACTIVE: "ACTIVE",
  PAST_DUE: "PAST_DUE",
  CANCELLED: "CANCELLED",
  INCOMPLETE: "INCOMPLETE",
} as const;

export const BillingInterval = {
  MONTHLY: "MONTHLY",
  YEARLY: "YEARLY",
} as const;

/**
 * Stripe's invoice statuses, uppercased — `stripe-webhook.service.ts` writes
 * `invoiceData.status.toUpperCase()` straight into the column, so these are the
 * only values that ever land there.
 *
 * This list previously read PAID / FAILED / PENDING / REFUNDED, which Stripe does
 * not use. Only PAID overlapped with reality, and the invoice table indexed a map
 * keyed on those names and read a property off the result — so every other real
 * invoice threw and took the billing page down. Anything reading this must still
 * tolerate an unrecognised value: the column is a bare String and Stripe can add
 * statuses.
 */
export const InvoiceStatus = {
  DRAFT: "DRAFT",
  OPEN: "OPEN",
  PAID: "PAID",
  UNCOLLECTIBLE: "UNCOLLECTIBLE",
  VOID: "VOID",
} as const;

export const DomainStatus = {
  PENDING: "PENDING",
  VERIFIED: "VERIFIED",
  FAILED: "FAILED",
} as const;

export const SslStatus = {
  PENDING: "PENDING",
  ACTIVE: "ACTIVE",
  EXPIRED: "EXPIRED",
} as const;

export const NotificationType = {
  SITE_PUBLISHED: "SITE_PUBLISHED",
  SITE_PUBLISH_FAILED: "SITE_PUBLISH_FAILED",
  SITE_TRANSFERRED: "SITE_TRANSFERRED",
  SITE_ARCHIVED: "SITE_ARCHIVED",
  SITE_DUPLICATED: "SITE_DUPLICATED",
  MEMBER_JOINED: "MEMBER_JOINED",
  MEMBER_REMOVED: "MEMBER_REMOVED",
  MEMBER_ROLE_CHANGED: "MEMBER_ROLE_CHANGED",
  PAYMENT_FAILED: "PAYMENT_FAILED",
  PLAN_LIMIT_WARNING: "PLAN_LIMIT_WARNING",
  SUBSCRIPTION_CHANGED: "SUBSCRIPTION_CHANGED",
  DOMAIN_VERIFIED: "DOMAIN_VERIFIED",
  DOMAIN_ERROR: "DOMAIN_ERROR",
  DOMAIN_SSL_EXPIRING: "DOMAIN_SSL_EXPIRING",
  SHARE_LINK_VIEWED: "SHARE_LINK_VIEWED",
  FORM_SUBMISSION_RECEIVED: "FORM_SUBMISSION_RECEIVED",
  AI_GENERATION_COMPLETE: "AI_GENERATION_COMPLETE",
  AI_GENERATION_FAILED: "AI_GENERATION_FAILED",
  SECURITY_LOGIN_NEW_DEVICE: "SECURITY_LOGIN_NEW_DEVICE",
  SECURITY_PASSWORD_CHANGED: "SECURITY_PASSWORD_CHANGED",
  SECURITY_2FA_CHANGED: "SECURITY_2FA_CHANGED",
} as const;

// Maps each notification type to the preference category surfaced in
// Settings → Notifications (notification-prefs.tsx NOTIFICATION_CATEGORIES).
// SSOT for both the in-app pref gate (notification.trigger) and "Mute this
// type" (notification.service).
export const NOTIFICATION_TYPE_CATEGORY: Record<string, string> = {
  SITE_PUBLISHED: "Site Updates",
  SITE_PUBLISH_FAILED: "Site Updates",
  SITE_TRANSFERRED: "Site Updates",
  SITE_ARCHIVED: "Site Updates",
  SITE_DUPLICATED: "Site Updates",
  MEMBER_JOINED: "Team",
  MEMBER_REMOVED: "Team",
  MEMBER_ROLE_CHANGED: "Team",
  PAYMENT_FAILED: "Billing",
  PLAN_LIMIT_WARNING: "Billing",
  SUBSCRIPTION_CHANGED: "Billing",
  DOMAIN_VERIFIED: "Domains",
  DOMAIN_ERROR: "Domains",
  DOMAIN_SSL_EXPIRING: "Domains",
  SHARE_LINK_VIEWED: "Feedback",
  FORM_SUBMISSION_RECEIVED: "Forms",
  AI_GENERATION_COMPLETE: "AI",
  AI_GENERATION_FAILED: "AI",
  SECURITY_LOGIN_NEW_DEVICE: "Security",
  SECURITY_PASSWORD_CHANGED: "Security",
  SECURITY_2FA_CHANGED: "Security",
};

export const OnboardingRole = {
  FREELANCER: "FREELANCER",
  SMALL_TEAM: "SMALL_TEAM",
  AGENCY: "AGENCY",
} as const;

export const TicketCategory = {
  GENERAL: "GENERAL",
  BILLING: "BILLING",
  TECHNICAL: "TECHNICAL",
  ACCOUNT: "ACCOUNT",
  FEATURE: "FEATURE",
  BUG: "BUG",
} as const;

export const TicketStatus = {
  OPEN: "OPEN",
  IN_PROGRESS: "IN_PROGRESS",
  RESOLVED: "RESOLVED",
  CLOSED: "CLOSED",
} as const;

export const IntegrationProvider = {
  GOOGLE_ANALYTICS: "GOOGLE_ANALYTICS",
  MAILCHIMP: "MAILCHIMP",
  ZAPIER: "ZAPIER",
  SLACK: "SLACK",
} as const;

export const TemplateCategory = {
  PORTFOLIO: "PORTFOLIO",
  BUSINESS: "BUSINESS",
  BLOG: "BLOG",
  AGENCY: "AGENCY",
  ECOMMERCE: "ECOMMERCE",
  RESTAURANT: "RESTAURANT",
} as const;

export const AIJobStatus = {
  QUEUED: "QUEUED",
  GENERATING_STRUCTURE: "GENERATING_STRUCTURE",
  GENERATING_CONTENT: "GENERATING_CONTENT",
  GENERATING_STYLES: "GENERATING_STYLES",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
} as const;

export const ActivityAction = {
  SITE_CREATED: "SITE_CREATED",
  SITE_PUBLISHED: "SITE_PUBLISHED",
  SITE_UNPUBLISHED: "SITE_UNPUBLISHED",
  SITE_ARCHIVED: "SITE_ARCHIVED",
  SITE_UNARCHIVED: "SITE_UNARCHIVED",
  SITE_DELETED: "SITE_DELETED",
  SITE_DUPLICATED: "SITE_DUPLICATED",
  SITE_TRANSFERRED: "SITE_TRANSFERRED",
  SITE_RENAMED: "SITE_RENAMED",
  PAGE_CREATED: "PAGE_CREATED",
  PAGE_UPDATED: "PAGE_UPDATED",
  PAGE_DELETED: "PAGE_DELETED",
  MEMBER_INVITED: "MEMBER_INVITED",
  MEMBER_JOINED: "MEMBER_JOINED",
  MEMBER_REMOVED: "MEMBER_REMOVED",
  MEMBER_ROLE_CHANGED: "MEMBER_ROLE_CHANGED",
  DOMAIN_CONNECTED: "DOMAIN_CONNECTED",
  DOMAIN_VERIFIED: "DOMAIN_VERIFIED",
  DOMAIN_REMOVED: "DOMAIN_REMOVED",
  SHARE_LINK_CREATED: "SHARE_LINK_CREATED",
  SHARE_LINK_REVOKED: "SHARE_LINK_REVOKED",
  SETTINGS_UPDATED: "SETTINGS_UPDATED",
  INTEGRATION_ADDED: "INTEGRATION_ADDED",
  INTEGRATION_REMOVED: "INTEGRATION_REMOVED",
  BILLING_CHANGED: "BILLING_CHANGED",
  AI_SITE_GENERATED: "AI_SITE_GENERATED",
} as const;

export const BlockType = {
  HEADING: "HEADING",
  PARAGRAPH: "PARAGRAPH",
  IMAGE: "IMAGE",
  VIDEO: "VIDEO",
  BUTTON: "BUTTON",
  COLUMNS: "COLUMNS",
  HERO: "HERO",
  GALLERY: "GALLERY",
  FORM: "FORM",
  DIVIDER: "DIVIDER",
  EMBED: "EMBED",
  CODE: "CODE",
} as const;

export const VerificationTokenType = {
  EMAIL_VERIFY: "EMAIL_VERIFY",
  PASSWORD_RESET: "PASSWORD_RESET",
  MAGIC_LINK: "MAGIC_LINK",
  EMAIL_CHANGE: "EMAIL_CHANGE",
} as const;

export const OnboardingStep = {
  ROLE_SELECT: "ROLE_SELECT",
  PROJECT_SETUP: "PROJECT_SETUP",
  SITE_CREATION: "SITE_CREATION",
  EDITOR_TOUR: "EDITOR_TOUR",
  CHECKLIST: "CHECKLIST",
  COMPLETED: "COMPLETED",
} as const;

export type AuthProviderType = (typeof AuthProvider)[keyof typeof AuthProvider];
export type UserRoleType = (typeof UserRole)[keyof typeof UserRole];
export type SiteStatusType = (typeof SiteStatus)[keyof typeof SiteStatus];
export type SiteCreationMethodType = (typeof SiteCreationMethod)[keyof typeof SiteCreationMethod];
export type InviteStatusType = (typeof InviteStatus)[keyof typeof InviteStatus];
export type MemberStatusType = (typeof MemberStatus)[keyof typeof MemberStatus];
export type SubscriptionPlanType = (typeof SubscriptionPlan)[keyof typeof SubscriptionPlan];
export type SubscriptionStatusType = (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];
export type BillingIntervalType = (typeof BillingInterval)[keyof typeof BillingInterval];
export type InvoiceStatusType = (typeof InvoiceStatus)[keyof typeof InvoiceStatus];
export type DomainStatusType = (typeof DomainStatus)[keyof typeof DomainStatus];
export type SslStatusType = (typeof SslStatus)[keyof typeof SslStatus];
export type NotificationTypeType = (typeof NotificationType)[keyof typeof NotificationType];
export type OnboardingRoleType = (typeof OnboardingRole)[keyof typeof OnboardingRole];
export type TicketCategoryType = (typeof TicketCategory)[keyof typeof TicketCategory];
export type TicketStatusType = (typeof TicketStatus)[keyof typeof TicketStatus];
export type IntegrationProviderType = (typeof IntegrationProvider)[keyof typeof IntegrationProvider];
export type TemplateCategoryType = (typeof TemplateCategory)[keyof typeof TemplateCategory];
export type AIJobStatusType = (typeof AIJobStatus)[keyof typeof AIJobStatus];
export type ActivityActionType = (typeof ActivityAction)[keyof typeof ActivityAction];
export type BlockTypeType = (typeof BlockType)[keyof typeof BlockType];
export type VerificationTokenTypeType = (typeof VerificationTokenType)[keyof typeof VerificationTokenType];
export type OnboardingStepType = (typeof OnboardingStep)[keyof typeof OnboardingStep];
