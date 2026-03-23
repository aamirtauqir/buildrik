export const AuthProvider = {
  EMAIL: "EMAIL",
  GOOGLE: "GOOGLE",
  GITHUB: "GITHUB",
} as const;

export const UserRole = {
  OWNER: "OWNER",
  ADMIN: "ADMIN",
  EDITOR: "EDITOR",
  VIEWER: "VIEWER",
} as const;

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

export const InvoiceStatus = {
  PAID: "PAID",
  FAILED: "FAILED",
  PENDING: "PENDING",
  REFUNDED: "REFUNDED",
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
