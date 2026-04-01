/**
 * Publishing Types
 * Types for deployment integrations (Vercel, Netlify, etc.)
 *
 * @module types/publish
 * @license BSD-3-Clause
 */

// ============================================================================
// VERCEL TYPES
// ============================================================================

export interface VercelConfig {
  /** OAuth access token */
  accessToken: string;
  /** Optional team ID for team deployments */
  teamId?: string;
}

export interface Deployment {
  /** Deployment ID */
  id: string;
  /** Live URL (e.g., my-site-abc123.vercel.app) */
  url: string;
  /** Project name on Vercel */
  projectName: string;
  /** ISO timestamp */
  createdAt: string;
  /** Deployment status */
  status: DeploymentStatus;
}

export type DeploymentStatus = "queued" | "building" | "ready" | "error" | "canceled";

// ============================================================================
// DEPLOY BUNDLE TYPES
// ============================================================================

export interface DeployBundle {
  /** Files to deploy */
  files: DeployFile[];
  /** Project name (used for Vercel project) */
  projectName?: string;
}

export interface DeployFile {
  /** File path relative to root (e.g., "index.html", "assets/logo.png") */
  path: string;
  /** File content - base64 for binary, plain text for text files */
  content: string;
  /** Content encoding */
  encoding?: "utf-8" | "base64";
}

export interface DeployResult {
  /** Deployment ID */
  id: string;
  /** Live URL */
  url: string;
  /** Creation timestamp */
  createdAt: string;
  /** Current status */
  status: DeploymentStatus;
}

// ============================================================================
// PROVIDER TYPES
// ============================================================================

export type PublishProvider = "vercel" | "netlify" | "github";

export interface PublishConfig {
  /** Active provider */
  provider?: PublishProvider;
  /** Vercel-specific config */
  vercel?: VercelConfig;
  /** Last deployment info */
  lastDeployment?: Deployment;
}
